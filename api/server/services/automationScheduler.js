const { getAppConfig } = require('~/server/services/Config');
const { getAgent } = require('~/models/Agent');
const { initializeClient } = require('~/server/services/Endpoints/agents/initialize');
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
 * Formatea Markdown enriquecido a HTML limpio con tablas, encabezados y negritas para clientes de correo.
 */
function formatMarkdownToEmailHtml(text) {
  if (!text) return '';
  
  // 1. Manejo y embellecimiento de bloques ```wappy-card
  let formatted = text.replace(/```wappy-card[\s\S]*?```/gi, (match) => {
    try {
      const jsonStr = match.replace(/```wappy-card/i, '').replace(/```/, '').trim();
      const card = JSON.parse(jsonStr);
      let itemsHtml = '';
      if (Array.isArray(card.items)) {
        itemsHtml = card.items.map(it => `<li><strong>${it.title || ''}</strong>: ${it.description || it.subtitle || ''}</li>`).join('');
      }
      return `
        <div style="border: 1px solid #9333ea; background: rgba(147, 51, 234, 0.1); border-radius: 10px; padding: 14px; margin: 15px 0;">
          <h4 style="color: #c084fc; margin: 0 0 6px 0; font-size: 15px;">${card.title || 'Resumen de Gestión'}</h4>
          <p style="margin: 0 0 8px 0; font-size: 13px; color: #e2e8f0;">${card.subtitle || card.description || ''}</p>
          ${itemsHtml ? `<ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #cbd5e1;">${itemsHtml}</ul>` : ''}
        </div>
      `;
    } catch (e) {
      return '';
    }
  });

  // Limpiar triples comillas
  formatted = formatted.replace(/"""/g, '"');

  // 2. Procesar Tablas de Markdown
  const lines = formatted.split('\n');
  const processedLines = [];
  let inTable = false;
  let tableRows = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('|') && line.endsWith('|')) {
      inTable = true;
      // Omitir fila separadora |---|---|
      if (line.replace(/[\s|:-]/g, '').length === 0) {
        continue;
      }
      const cells = line.split('|').slice(1, -1).map(c => c.trim());
      tableRows.push(cells);
    } else {
      if (inTable) {
        if (tableRows.length > 0) {
          const headerRow = tableRows[0];
          const bodyRows = tableRows.slice(1);
          let tableHtml = '<table><thead><tr>';
          headerRow.forEach(cell => {
            tableHtml += `<th>${cell}</th>`;
          });
          tableHtml += '</tr></thead><tbody>';
          bodyRows.forEach(row => {
            tableHtml += '<tr>';
            row.forEach(cell => {
              tableHtml += `<td>${cell}</td>`;
            });
            tableHtml += '</tr>';
          });
          tableHtml += '</tbody></table>';
          processedLines.push(tableHtml);
        }
        tableRows = [];
        inTable = false;
      }
      processedLines.push(lines[i]);
    }
  }
  if (inTable && tableRows.length > 0) {
    const headerRow = tableRows[0];
    const bodyRows = tableRows.slice(1);
    let tableHtml = '<table><thead><tr>';
    headerRow.forEach(cell => {
      tableHtml += `<th>${cell}</th>`;
    });
    tableHtml += '</tr></thead><tbody>';
    bodyRows.forEach(row => {
      tableHtml += '<tr>';
      row.forEach(cell => {
        tableHtml += `<td>${cell}</td>`;
      });
      tableHtml += '</tr>';
    });
    tableHtml += '</tbody></table>';
    processedLines.push(tableHtml);
  }

  formatted = processedLines.join('\n');

  // 3. Encabezados
  formatted = formatted.replace(/^#### (.*$)/gim, '<h4>$1</h4>');
  formatted = formatted.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  formatted = formatted.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  formatted = formatted.replace(/^# (.*$)/gim, '<h1>$1</h1>');

  // 4. Negritas y Cursivas
  formatted = formatted.replace(/\*\*\*(.*?)\*\*\*/gim, '<strong><em>$1</em></strong>');
  formatted = formatted.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
  formatted = formatted.replace(/\*(.*?)\*/gim, '<em>$1</em>');

  // 5. Citas / Blockquotes
  formatted = formatted.replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>');

  // 6. Listas con viñetas
  formatted = formatted.replace(/^\s*[\-\*]\s+(.*$)/gim, '<li>$1</li>');
  formatted = formatted.replace(/(<li>.*<\/li>(\s*<li>.*<\/li>)*)/gim, '<ul>$1</ul>');

  // 7. Párrafos
  const blocks = formatted.split(/\n{2,}/);
  formatted = blocks.map(block => {
    block = block.trim();
    if (!block) return '';
    if (block.startsWith('<h') || block.startsWith('<table') || block.startsWith('<ul') || block.startsWith('<ol') || block.startsWith('<blockquote') || block.startsWith('<div')) {
      return block;
    }
    return `<p>${block.replace(/\n/g, '<br>')}</p>`;
  }).filter(Boolean).join('\n');

  return formatted;
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
    console.log(`[AutomationScheduler] STEP 3: Executing prompt for "${automation.name}" via agent "${agent?.name || 'Default'}"...`);
    const response = await Promise.race([
      client.sendMessage(automation.prompt, messageOptions),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Tiempo límite de ejecución superado (8 minutos).')), 480000)
      )
    ]);
    
    // Desactivar el temporizador de 10 minutos de inmediato
    clearTimeout(timeoutId);
    console.log(`[AutomationScheduler] STEP 4: Agent sendMessage finished for "${automation.name}". GeneratedConvo: ${generatedConvoId}`);

    if (response?.databasePromise) {
      try {
        console.log(`[AutomationScheduler] STEP 4.1: Awaiting response.databasePromise (max 5s)...`);
        await Promise.race([
          response.databasePromise,
          new Promise((r) => setTimeout(r, 5000))
        ]);
        console.log(`[AutomationScheduler] STEP 4.2: databasePromise resolved.`);
      } catch (dbErr) {
        console.warn('[AutomationScheduler] databasePromise non-blocking notice:', dbErr.message);
      }
    }

    // 9. Extract result text immediately
    console.log(`[AutomationScheduler] STEP 5: Extracting result text...`);
    let resultText = (response?.text || '').trim();
    if (!resultText && Array.isArray(response?.content)) {
      resultText = response.content
        .filter(part => part && part.type === 'text' && typeof part.text === 'string')
        .map(part => part.text.trim())
        .filter(Boolean)
        .join('\n\n')
        .trim();
    }
    if (!resultText) {
      resultText = '(Ejecución completada por el agente. Documento generado disponible en el chat)';
    }

    // 10. Update Log and Automation to SUCCESS immediately in MongoDB
    console.log(`[AutomationScheduler] STEP 6: Updating AutomationLog ${log._id} and Automation ${automation._id} to SUCCESS...`);
    await Promise.all([
      AutomationLog.updateOne(
        { _id: log._id },
        {
          $set: {
            status: 'success',
            result: resultText,
            conversationId: generatedConvoId
          }
        }
      ),
      Automation.updateOne(
        { _id: automation._id },
        {
          $set: {
            lastRunAt: new Date(),
            lastRunStatus: 'success',
            lastRunResult: resultText.substring(0, 500),
            conversationId: generatedConvoId,
            ...(isManual && automation.status === 'active'
              ? { nextRunAt: calculateNextRun(automation.scheduleType, automation.scheduleConfig) }
              : {})
          }
        }
      )
    ]);
    console.log(`[AutomationScheduler] ALL STEPS COMPLETED! Successfully finished execution for "${automation.name}"`);

    // 11. Optional Post-Processing Tasks (Completely Non-Blocking in background)
    setImmediate(async () => {
      // Background tagging
      if (generatedConvoId) {
        try {
          const ConvoModel = mongoose.models.Conversation;
          if (ConvoModel) {
            await ConvoModel.updateOne(
              { conversationId: generatedConvoId },
              { $addToSet: { tags: { $each: ['sgsst-automation', `company-${automation.companyId}`] } } }
            );
          }
        } catch (tagErr) {
          // No-op
        }
      }
    });

    // 12. Send Email Notification to configured recipients (Completely Non-blocking)
    if (Array.isArray(automation.emails) && automation.emails.length > 0) {
      setImmediate(async () => {
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

            const emailHtmlResult = formatMarkdownToEmailHtml(resultText);

            for (const recipient of validEmails) {
              console.log(`[AutomationScheduler] Sending report email to ${recipient} for "${automation.name}"`);
              sendEmail({
                email: recipient,
                from: process.env.EMAIL_NOTIFICATIONS_FROM || 'notificaciones@wappy.club',
                subject: `📊 Reporte Automático SGSST: ${automation.name} - ${companyName}`,
                payload: {
                  taskName: automation.name,
                  agentName: automation.agentName || agent.name || 'Agente Experto',
                  companyName,
                  executionDate: bogotaDateStr,
                  prompt: automation.prompt,
                  result: emailHtmlResult,
                  chatUrl,
                  year: new Date().getFullYear()
                },
                template: 'agentAutomationReport.handlebars',
                throwError: false
              }).catch(e => console.warn(`[AutomationScheduler] Non-blocking email error for ${recipient}:`, e.message));
            }
          }
        } catch (emailErr) {
          console.error(`[AutomationScheduler] Error in non-blocking email task:`, emailErr.message);
        }
      });
    }

  } catch (err) {
    console.error(`[AutomationScheduler] Error executing automation "${automation.name}":`, err);
    
    // Update Log to failed
    await AutomationLog.updateOne(
      { _id: log._id },
      {
        $set: {
          status: 'failed',
          error: err.message || 'Error desconocido'
        }
      }
    );

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
  
  // Limpiar cualquier tarea zombie previa que haya quedado en 'running' por reinicio del contenedor
  setTimeout(async () => {
    try {
      const twoMinAgo = new Date(Date.now() - 2 * 60 * 1000);
      await Automation.updateMany(
        { lastRunStatus: 'running', updatedAt: { $lt: twoMinAgo } },
        { $set: { lastRunStatus: 'failed', lastRunResult: 'Reinicio del servidor detectado.' } }
      );
      await AutomationLog.updateMany(
        { status: 'running', createdAt: { $lt: twoMinAgo } },
        { $set: { status: 'failed', error: 'Reinicio del servidor detectado.' } }
      );
      console.log('[AutomationScheduler] Zombie tasks from previous container restarts cleaned up.');
    } catch (e) {}
  }, 2000);

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

