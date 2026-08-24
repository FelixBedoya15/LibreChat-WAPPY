const { getAppConfig } = require('~/server/services/Config');
const { getAgent } = require('~/models/Agent');
const { initializeClient } = require('~/server/services/Endpoints/agents/initialize');
const { Conversation } = require('~/db/models');
const mongoose = require('mongoose');
const Automation = require('~/models/Automation');
const AutomationLog = require('~/models/AutomationLog');
const CompanyInfo = require('~/models/CompanyInfo');
const sendEmail = require('~/server/utils/sendEmail');

let schedulerInterval = null;

const BOGOTA_OFFSET_HOURS = -5; // America/Bogota is UTC-5 (no DST)

/**
 * Helper to get Bogota local date components from a UTC Date
 */
function getBogotaDate(date = new Date()) {
  const utc = date.getTime();
  return new Date(utc + (BOGOTA_OFFSET_HOURS * 3600000));
}

/**
 * Helper to convert Bogota local components into a UTC Date object
 */
function createUtcFromBogota(year, month, day, hour, minute, second = 0) {
  return new Date(Date.UTC(year, month, day, hour - BOGOTA_OFFSET_HOURS, minute, second, 0));
}

/**
 * Calculates the next run date strictly in the future.
 * Time parameters are evaluated in Colombia Time (America/Bogota, UTC-5).
 */
function calculateNextRun(scheduleType, config) {
  const nowUtc = new Date();
  const bogotaNow = getBogotaDate(nowUtc);
  
  const hour = Math.min(23, Math.max(0, parseInt(config?.hour, 10) || 8));
  const minute = Math.min(59, Math.max(0, parseInt(config?.minute, 10) || 0));
  const intervalHours = Math.max(1, parseInt(config?.intervalHours, 10) || 1);
  const dayOfMonth = Math.min(31, Math.max(1, parseInt(config?.dayOfMonth, 10) || 1));

  let nextUtc;

  if (scheduleType === 'hourly') {
    nextUtc = new Date(nowUtc.getTime() + intervalHours * 3600000);
  } else if (scheduleType === 'daily') {
    const curYear = bogotaNow.getUTCFullYear();
    const curMonth = bogotaNow.getUTCMonth();
    const curDay = bogotaNow.getUTCDate();
    const curHour = bogotaNow.getUTCHours();
    const curMin = bogotaNow.getUTCMinutes();

    const isPastToday = (curHour > hour) || (curHour === hour && curMin >= minute);

    if (isPastToday) {
      const tomorrowBogota = new Date(bogotaNow.getTime() + 24 * 3600000);
      nextUtc = createUtcFromBogota(
        tomorrowBogota.getUTCFullYear(),
        tomorrowBogota.getUTCMonth(),
        tomorrowBogota.getUTCDate(),
        hour,
        minute
      );
    } else {
      nextUtc = createUtcFromBogota(curYear, curMonth, curDay, hour, minute);
    }
  } else if (scheduleType === 'weekly') {
    let rawDays = config?.dayOfWeek ?? [1];
    let daysOfWeek = (Array.isArray(rawDays) ? rawDays : [rawDays])
      .map(Number)
      .filter(d => !isNaN(d) && d >= 0 && d <= 6);
    if (daysOfWeek.length === 0) daysOfWeek = [1];

    const curDayOfWeek = bogotaNow.getUTCDay(); // 0 = Sunday, 1 = Monday, ...
    const curHour = bogotaNow.getUTCHours();
    const curMin = bogotaNow.getUTCMinutes();
    const isPastToday = (curHour > hour) || (curHour === hour && curMin >= minute);

    let daysToAdd = null;

    // Search next 7 days for the first valid matching day
    for (let offset = 0; offset <= 7; offset++) {
      const checkDayOfWeek = (curDayOfWeek + offset) % 7;
      if (daysOfWeek.includes(checkDayOfWeek)) {
        if (offset === 0) {
          if (!isPastToday) {
            daysToAdd = 0;
            break;
          }
        } else {
          daysToAdd = offset;
          break;
        }
      }
    }

    if (daysToAdd === null) {
      daysToAdd = 7;
    }

    const targetBogota = new Date(bogotaNow.getTime() + daysToAdd * 24 * 3600000);
    nextUtc = createUtcFromBogota(
      targetBogota.getUTCFullYear(),
      targetBogota.getUTCMonth(),
      targetBogota.getUTCDate(),
      hour,
      minute
    );
  } else if (scheduleType === 'monthly') {
    const curYear = bogotaNow.getUTCFullYear();
    const curMonth = bogotaNow.getUTCMonth();
    const curDay = bogotaNow.getUTCDate();
    const curHour = bogotaNow.getUTCHours();
    const curMin = bogotaNow.getUTCMinutes();

    let targetYear = curYear;
    let targetMonth = curMonth;

    const isPastThisMonth = (curDay > dayOfMonth) || (curDay === dayOfMonth && ((curHour > hour) || (curHour === hour && curMin >= minute)));

    if (isPastThisMonth) {
      targetMonth += 1;
      if (targetMonth > 11) {
        targetMonth = 0;
        targetYear += 1;
      }
    }

    const daysInTargetMonth = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();
    const validDay = Math.min(dayOfMonth, daysInTargetMonth);

    nextUtc = createUtcFromBogota(targetYear, targetMonth, validDay, hour, minute);
  } else {
    // Default daily
    const tomorrowBogota = new Date(bogotaNow.getTime() + 24 * 3600000);
    nextUtc = createUtcFromBogota(
      tomorrowBogota.getUTCFullYear(),
      tomorrowBogota.getUTCMonth(),
      tomorrowBogota.getUTCDate(),
      hour,
      minute
    );
  }

  // Safety: Next execution MUST be strictly at least 60 seconds in the future
  if (!nextUtc || isNaN(nextUtc.getTime()) || nextUtc.getTime() <= nowUtc.getTime() + 30000) {
    nextUtc = new Date(nowUtc.getTime() + 24 * 3600000); // 24h fallback
  }

  return nextUtc;
}

async function runAutomation(automation, isManual = false) {
  console.log(`[AutomationScheduler] Starting execution for automation "${automation.name}" (${automation._id})`);
  
  // Update Automation state to running
  await Automation.updateOne(
    { _id: automation._id },
    { $set: { lastRunStatus: 'running', lastRunAt: new Date() } }
  );

  // Create log entry
  const log = await AutomationLog.create({
    automation: automation._id,
    user: automation.user,
    companyId: automation.companyId,
    agentId: automation.agentId,
    agentName: automation.agentName,
    prompt: automation.prompt,
    status: 'running'
  });

  const prelimAbortController = new AbortController();
  // 10 minutes timeout (600,000 ms) safety measure
  const timeoutId = setTimeout(() => {
    console.warn(`[AutomationScheduler] Automation "${automation.name}" timed out after 10 minutes. Aborting execution.`);
    prelimAbortController.abort();
  }, 600000);

  try {
    // 1. Fetch app config
    const appConfig = await getAppConfig();

    // 2. Fetch agent
    const agent = await getAgent({ id: automation.agentId });
    if (!agent) {
      throw new Error(`Agent ${automation.agentId} not found`);
    }

    // 3. Fetch user details for complete context
    let userObj = null;
    try {
      const UserModel = mongoose.models.User || (mongoose.modelNames().includes('User') ? mongoose.model('User') : null);
      if (UserModel) {
        userObj = await UserModel.findById(automation.user).lean();
      }
    } catch (uErr) {
      console.warn(`[AutomationScheduler] Warning fetching user ${automation.user}:`, uErr.message);
    }

    const reqUser = userObj ? {
      ...userObj,
      id: userObj._id.toString()
    } : {
      id: automation.user.toString()
    };

    // 4. Build mock request & response
    const req = {
      user: reqUser,
      body: {
        text: automation.prompt,
        conversationId: null,
        files: []
      },
      config: appConfig
    };

    let generatedConvoId = null;

    const mockRes = {
      headersSent: false,
      finished: false,
      writableEnded: false,
      write: () => {},
      end: () => {
        mockRes.finished = true;
        mockRes.writableEnded = true;
      },
      on: () => {},
      removeListener: () => {},
      status: function() { return this; },
      json: function() { return this; }
    };

    // 5. Construct endpointOption
    const endpointOption = {
      endpoint: 'agents',
      agent_id: agent.id,
      model_parameters: agent.model_parameters || {},
      agent: Promise.resolve(agent)
    };

    req.body.endpointOption = endpointOption;

    // 6. Initialize agent client
    const { client, userMCPAuthMap } = await initializeClient({
      req,
      res: mockRes,
      endpointOption,
      signal: prelimAbortController.signal
    });

    // 7. Message options
    const messageOptions = {
      user: automation.user.toString(),
      getReqData: (data) => {
        if (data?.conversationId) {
          generatedConvoId = data.conversationId;
        }
      },
      conversationId: null,
      parentMessageId: '00000000-0000-0000-0000-000000000000', // NO_PARENT
      abortController: prelimAbortController,
      userMCPAuthMap
    };

    // 8. Execute agent call with safety limit of 8 minutes
    const response = await Promise.race([
      client.sendMessage(automation.prompt, messageOptions),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Tiempo límite de ejecución superado (8 minutos).')), 480000)
      )
    ]);

    if (response?.databasePromise) {
      await response.databasePromise;
    }

    // 9. Tag generated conversation to isolate from regular chats
    if (generatedConvoId) {
      await Conversation.updateOne(
        { conversationId: generatedConvoId },
        { $addToSet: { tags: { $each: ['sgsst-automation', `company-${automation.companyId}`] } } }
      );
    }

    let resultText = (response?.text || '').trim();
    if (!resultText && Array.isArray(response?.content)) {
      resultText = response.content
        .filter(part => part && part.type === 'text' && typeof part.text === 'string')
        .map(part => part.text.trim())
        .filter(Boolean)
        .join('\n\n')
        .trim();
    }

    // Fallback: si el agente generó un documento en Canvas / LiveEditor
    if (!resultText && generatedConvoId) {
      try {
        const CanvasSession = mongoose.models.CanvasSession || require('~/models/CanvasSession');
        const canvas = await CanvasSession.findOne({ conversationId: generatedConvoId }).lean();
        if (canvas?.content) {
          resultText = typeof canvas.content === 'string' && canvas.content.startsWith('{')
            ? `Reporte generado: "${canvas.title || 'Analítica SST'}" guardado en Canvas.`
            : canvas.content.substring(0, 1500);
        }
      } catch (e) {
        // fallback silencioso
      }
    }

    if (!resultText) {
      resultText = '(Ejecución completada por el agente. Documento consolidado disponible en el chat)';
    }

    // 10. Update Log to success
    log.status = 'success';
    log.result = resultText;
    log.conversationId = generatedConvoId;
    await log.save();

    // 11. Update Automation status and result
    const updateDoc = {
      lastRunAt: new Date(),
      lastRunStatus: 'success',
      lastRunResult: resultText.substring(0, 500),
      conversationId: generatedConvoId
    };

    // If manual run and nextRunAt is missing or past, ensure a valid nextRunAt is set
    if (isManual && automation.status === 'active') {
      updateDoc.nextRunAt = calculateNextRun(automation.scheduleType, automation.scheduleConfig);
    }

    await Automation.updateOne({ _id: automation._id }, { $set: updateDoc });

    console.log(`[AutomationScheduler] Successfully completed execution for "${automation.name}"`);

    // 12. Send Email Notification to configured recipients
    if (Array.isArray(automation.emails) && automation.emails.length > 0) {
      try {
        let companyName = 'Mi Empresa';
        if (automation.companyId) {
          const comp = await CompanyInfo.findById(automation.companyId).select('companyName').lean();
          if (comp?.companyName) companyName = comp.companyName;
        }

        const validEmails = automation.emails
          .map(e => (typeof e === 'string' ? e.trim() : ''))
          .filter(e => e.includes('@'));

        if (validEmails.length > 0) {
          const bogotaDateStr = new Intl.DateTimeFormat('es-CO', {
            timeZone: 'America/Bogota',
            dateStyle: 'full',
            timeStyle: 'medium'
          }).format(new Date());

          const chatUrl = generatedConvoId ? `https://wappy.club/c/${generatedConvoId}` : null;

          for (const recipient of validEmails) {
            console.log(`[AutomationScheduler] Sending report email to ${recipient} for "${automation.name}"`);
            await sendEmail({
              email: recipient,
              from: process.env.EMAIL_NOTIFICATIONS_FROM || 'notificaciones@wappy.club',
              subject: `📊 Reporte Automático SGSST: ${automation.name} - ${companyName}`,
              payload: {
                taskName: automation.name,
                agentName: automation.agentName || agent.name || 'Agente Experto',
                companyName,
                executionDate: bogotaDateStr,
                prompt: automation.prompt,
                result: resultText,
                chatUrl,
                year: new Date().getFullYear()
              },
              template: 'agentAutomationReport.handlebars',
              throwError: false
            });
          }
        }
      } catch (emailErr) {
        console.error(`[AutomationScheduler] Error sending automation report emails:`, emailErr.message);
      }
    }

  } catch (err) {
    console.error(`[AutomationScheduler] Error executing automation "${automation.name}":`, err);
    
    // Update Log to failed
    log.status = 'failed';
    log.error = err.message || 'Error desconocido';
    await log.save();

    // Update Automation last run stats
    const updateDoc = {
      lastRunAt: new Date(),
      lastRunStatus: 'failed',
      lastRunResult: `Error: ${err.message}`
    };

    if (isManual && automation.status === 'active') {
      updateDoc.nextRunAt = calculateNextRun(automation.scheduleType, automation.scheduleConfig);
    }

    await Automation.updateOne({ _id: automation._id }, { $set: updateDoc });
  } finally {
    clearTimeout(timeoutId);
  }
}

async function checkAndRunAutomations() {
  try {
    const now = new Date();

    // 1. Zombie / Crash Recovery: Reset tasks and logs stuck in 'running' for more than 9 minutes
    const nineMinutesAgo = new Date(Date.now() - 9 * 60 * 1000);
    await Promise.all([
      Automation.updateMany(
        {
          lastRunStatus: 'running',
          updatedAt: { $lt: nineMinutesAgo }
        },
        {
          $set: {
            lastRunStatus: 'failed',
            lastRunResult: 'Ejecución anterior cancelada por tiempo de espera o reinicio.'
          }
        }
      ),
      AutomationLog.updateMany(
        {
          status: 'running',
          createdAt: { $lt: nineMinutesAgo }
        },
        {
          $set: {
            status: 'failed',
            error: 'Tiempo límite de ejecución superado (cancelada por el sistema).'
          }
        }
      )
    ]);

    // 2. Query pending active automations
    const pendingAutomations = await Automation.find({
      status: 'active',
      lastRunStatus: { $ne: 'running' },
      $or: [
        { nextRunAt: { $lte: now } },
        { nextRunAt: null }
      ]
    });

    if (pendingAutomations.length === 0) return;

    console.log(`[AutomationScheduler] Found ${pendingAutomations.length} pending automations to execute.`);

    for (const automation of pendingAutomations) {
      // 3. Anti-loop & Cooldown Check: Ensure at least 4 minutes between automatic runs
      if (automation.lastRunAt) {
        const timeSinceLastRun = now.getTime() - new Date(automation.lastRunAt).getTime();
        if (timeSinceLastRun < 4 * 60 * 1000) {
          console.warn(`[AutomationScheduler] Skipping "${automation.name}" (${automation._id}) - In cooldown (${Math.round(timeSinceLastRun / 1000)}s since last run).`);
          const safeNext = calculateNextRun(automation.scheduleType, automation.scheduleConfig);
          await Automation.updateOne({ _id: automation._id }, { $set: { nextRunAt: safeNext } });
          continue;
        }
      }

      // 4. Calculate next run IMMEDIATELY and update atomically before executing
      const nextRun = calculateNextRun(automation.scheduleType, automation.scheduleConfig);
      
      await Automation.updateOne(
        { _id: automation._id },
        { 
          $set: { 
            lastRunStatus: 'running',
            nextRunAt: nextRun 
          } 
        }
      );
      
      // 5. Execute asynchronously in background
      runAutomation(automation).catch(err => {
        console.error(`[AutomationScheduler] Background run error for ${automation._id}:`, err);
      });
    }
  } catch (err) {
    console.error('[AutomationScheduler] Error in checkAndRunAutomations interval:', err);
  }
}

function startAutomationScheduler() {
  if (schedulerInterval) return; // Ya está corriendo

  console.log('[AutomationScheduler] Starting automation background scheduler (interval: 1 minute, America/Bogota timezone aware)...');
  
  // Quick initial check 15 seconds after boot
  setTimeout(checkAndRunAutomations, 15000);

  // Poll every minute
  schedulerInterval = setInterval(checkAndRunAutomations, 60000);
}

function stopAutomationScheduler() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log('[AutomationScheduler] Stopped background scheduler.');
  }
}

module.exports = {
  startAutomationScheduler,
  stopAutomationScheduler,
  runAutomation,
  calculateNextRun
};

