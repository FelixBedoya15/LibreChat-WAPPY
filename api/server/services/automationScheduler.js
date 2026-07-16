const { getAppConfig } = require('~/server/services/Config');
const { getAgent } = require('~/models/Agent');
const { initializeClient } = require('~/server/services/Endpoints/agents/initialize');
const { Conversation } = require('~/db/models');
const Automation = require('~/models/Automation');
const AutomationLog = require('~/models/AutomationLog');

let schedulerInterval = null;

function calculateNextRun(scheduleType, config) {
  const now = new Date();
  let next = new Date();
  
  const hour = config?.hour ?? 8;
  const minute = config?.minute ?? 0;
  const dayOfWeek = config?.dayOfWeek ?? 1; // 1 = Monday, 0 = Sunday
  const dayOfMonth = config?.dayOfMonth ?? 1;
  const intervalHours = config?.intervalHours ?? 1;

  if (scheduleType === 'hourly') {
    next = new Date(now.getTime() + intervalHours * 60 * 60 * 1000);
  } else if (scheduleType === 'daily') {
    next.setHours(hour, minute, 0, 0);
    if (next <= now) {
      next.setDate(next.getDate() + 1);
    }
  } else if (scheduleType === 'weekly') {
    next.setHours(hour, minute, 0, 0);
    const currentDay = now.getDay();
    let daysToAdd = (dayOfWeek - currentDay + 7) % 7;
    if (daysToAdd === 0 && next <= now) {
      daysToAdd = 7;
    }
    next.setDate(next.getDate() + daysToAdd);
  } else if (scheduleType === 'monthly') {
    next.setHours(hour, minute, 0, 0);
    next.setDate(dayOfMonth);
    if (next <= now) {
      next.setMonth(next.getMonth() + 1);
    }
  } else {
    // default daily
    next.setHours(hour, minute, 0, 0);
    if (next <= now) {
      next.setDate(next.getDate() + 1);
    }
  }
  return next;
}

async function runAutomation(automation, isManual = false) {
  console.log(`[AutomationScheduler] Starting execution for automation "${automation.name}" (${automation._id})`);
  
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

  try {
    // 1. Fetch app config
    const appConfig = await getAppConfig();

    // 2. Fetch agent
    const agent = await getAgent({ id: automation.agentId });
    if (!agent) {
      throw new Error(`Agent ${automation.agentId} not found`);
    }

    // 3. Build mock request & response
    const req = {
      user: { id: automation.user.toString() },
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

    // 4. Construct endpointOption
    const endpointOption = {
      endpoint: 'agents',
      agent_id: agent.id,
      model_parameters: agent.model_parameters || {},
      agent: Promise.resolve(agent)
    };

    req.body.endpointOption = endpointOption;

    const prelimAbortController = new AbortController();

    // 5. Initialize agent client
    const { client, userMCPAuthMap } = await initializeClient({
      req,
      res: mockRes,
      endpointOption,
      signal: prelimAbortController.signal
    });

    // 6. Message options
    const messageOptions = {
      user: automation.user.toString(),
      getReqData: (data) => {
        if (data.conversationId) {
          generatedConvoId = data.conversationId;
        }
      },
      conversationId: null,
      parentMessageId: '00000000-0000-0000-0000-000000000000', // NO_PARENT
      abortController: prelimAbortController,
      userMCPAuthMap
    };

    // 7. Execute agent call
    const response = await client.sendMessage(automation.prompt, messageOptions);

    if (response.databasePromise) {
      await response.databasePromise;
    }

    // 8. Inyectar tags a la conversación generada en la BD para aislarla
    if (generatedConvoId) {
      await Conversation.updateOne(
        { conversationId: generatedConvoId },
        { $addToSet: { tags: { $each: ['sgsst-automation', `company-${automation.companyId}`] } } }
      );
    }

    // 9. Update Log to success
    log.status = 'success';
    log.result = response.text || '(Sin respuesta del agente)';
    log.conversationId = generatedConvoId;
    await log.save();

    // 10. Update Automation next run and last run stats
    const nextRun = calculateNextRun(automation.scheduleType, automation.scheduleConfig);
    await Automation.updateOne(
      { _id: automation._id },
      {
        $set: {
          lastRunAt: new Date(),
          lastRunStatus: 'success',
          lastRunResult: (response.text || '').substring(0, 500),
          nextRunAt: nextRun,
          conversationId: generatedConvoId
        }
      }
    );

    console.log(`[AutomationScheduler] Successfully completed execution for "${automation.name}"`);

  } catch (err) {
    console.error(`[AutomationScheduler] Error executing automation "${automation.name}":`, err);
    
    // Update Log to failed
    log.status = 'failed';
    log.error = err.message || 'Error desconocido';
    await log.save();

    // Update Automation next run and last run stats
    const nextRun = calculateNextRun(automation.scheduleType, automation.scheduleConfig);
    await Automation.updateOne(
      { _id: automation._id },
      {
        $set: {
          lastRunAt: new Date(),
          lastRunStatus: 'failed',
          lastRunResult: `Error: ${err.message}`,
          nextRunAt: nextRun
        }
      }
    );
  }
}

async function checkAndRunAutomations() {
  try {
    const now = new Date();
    // Buscar automatizaciones activas cuya fecha de próxima ejecución sea menor o igual a ahora
    // o que no tengan fecha de próxima ejecución asignada (se ejecutarán de inmediato en su primer ciclo)
    const pendingAutomations = await Automation.find({
      status: 'active',
      $or: [
        { nextRunAt: { $lte: now } },
        { nextRunAt: null }
      ]
    });

    if (pendingAutomations.length === 0) return;

    console.log(`[AutomationScheduler] Found ${pendingAutomations.length} pending automations to execute.`);

    for (const automation of pendingAutomations) {
      // Marcar temporalmente como corriendo para evitar doble ejecución si toma tiempo
      await Automation.updateOne(
        { _id: automation._id },
        { $set: { lastRunStatus: 'running' } }
      );
      
      // Correr de forma asíncrona sin bloquear el loop principal
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

  console.log('[AutomationScheduler] Starting automation background scheduler (interval: 1 minute)...');
  
  // Ejecutar un chequeo inicial rápido a los 10 segundos
  setTimeout(checkAndRunAutomations, 10000);

  // Correr cada minuto
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
