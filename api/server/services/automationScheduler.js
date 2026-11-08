const { monitorEventLoopDelay } = require('perf_hooks');
const { getAppConfig } = require('~/server/services/Config');
const { getAgent } = require('~/models/Agent');
const { initializeClient } = require('~/server/services/Endpoints/agents/initialize');
const mongoose = require('mongoose');
const Automation = require('~/models/Automation');
const AutomationLog = require('~/models/AutomationLog');
const CompanyInfo = require('~/models/CompanyInfo');
const Notification = require('~/models/Notification');
const TenshiMessage = require('~/models/TenshiMessage');
const KanbanTask = require('~/models/KanbanTask');
const sendEmail = require('~/server/utils/sendEmail');
const {
  inspectNodeLiveData,
  buildSurgicalLiveContextForWorkflow,
} = require('~/server/services/workflowNodeInspectorService');

let schedulerInterval = null;
let isCheckingAutomations = false; // Evita que dos ticks del intervalo se solapen
let drainTimer = null; // Re-disparo inmediato de drenaje continuo al liberarse ventanilla
const runningAutomations = new Map(); // automationId -> { abortController, timeoutId, startedAt, automationName, logId }

/**
 * Monitor de atraso del Event Loop (detecta si hay muchos usuarios chateando o en Tenshi Voice).
 */
let loopDelayMonitor = null;
try {
  loopDelayMonitor = monitorEventLoopDelay({ resolution: 20 });
  loopDelayMonitor.enable();
} catch (_) {
  loopDelayMonitor = null;
}

/**
 * Drenaje Continuo Adaptativo (Smart Throttle):
 * - En calma (pocos usuarios en vivo): abre hasta MAX_CONCURRENT_AUTOMATIONS (por defecto 8).
 * - Con tráfico moderado en el chat/voz: baja a 4 ventanillas simultáneas.
 * - En hora pico (80-100 usuarios chateando o RAM/EventLoop exigidos): baja a MIN_CONCURRENT_AUTOMATIONS (2)
 *   para garantizar prioridad absoluta a los humanos en vivo.
 * - Apenas termina una tarea, jala la siguiente de la fila en 400ms sin esperar el minuto entero.
 */
const MAX_CONCURRENT_AUTOMATIONS = Math.max(
  2,
  parseInt(process.env.AUTOMATION_MAX_CONCURRENCY || '8', 10) || 8,
);
const MIN_CONCURRENT_AUTOMATIONS = Math.max(
  1,
  parseInt(process.env.AUTOMATION_MIN_CONCURRENCY || '2', 10) || 2,
);
const STAGGER_MS = 500;

/**
 * Calcula cuántas ventanillas simultáneas puede abrir el scheduler en este preciso segundo
 * según la presión de RAM (heapUsed / rss) y el atraso del Event Loop de Node.js.
 */
function getAdaptiveConcurrencyLimit() {
  try {
    const mem = process.memoryUsage();
    const heapUsedMB = mem.heapUsed / (1024 * 1024);
    const rssMB = mem.rss / (1024 * 1024);
    const eventLoopLagMs = loopDelayMonitor ? loopDelayMonitor.mean / 1e6 : 0;

    // Resetear estadísticas acumuladas del histograma periódicamente para medir carga fresca
    if (loopDelayMonitor && Math.random() < 0.25) {
      loopDelayMonitor.reset();
    }

    // Hora pico fuerte (80-100 usuarios en vivo, alto uso de heap o lag > 80ms en Event Loop)
    if (heapUsedMB > 2400 || rssMB > 4200 || eventLoopLagMs > 80) {
      return MIN_CONCURRENT_AUTOMATIONS; // 2 ventanillas: prioridad total al chat en vivo
    }

    // Tráfico moderado (20-50 usuarios chateando o lag entre 35ms y 80ms)
    if (heapUsedMB > 1500 || rssMB > 2800 || eventLoopLagMs > 35) {
      return Math.max(MIN_CONCURRENT_AUTOMATIONS, Math.min(4, MAX_CONCURRENT_AUTOMATIONS));
    }

    // Servidor holgado: velocidad máxima de drenaje (8 ventanillas)
    return MAX_CONCURRENT_AUTOMATIONS;
  } catch (_) {
    return 4;
  }
}

/**
 * Dispara el drenaje continuo en cuanto una tarea termina y deja un cupo libre.
 */
function scheduleImmediateDrain(delayMs = 400) {
  if (drainTimer) return;
  drainTimer = setTimeout(() => {
    drainTimer = null;
    checkAndRunAutomations().catch((err) => {
      console.error('[AutomationScheduler] Continuous drain error:', err);
    });
  }, delayMs);
}

/** Campos mínimos necesarios para ejecutar una tarea (evita cargar documentos completos en memoria). */
const AUTOMATION_RUN_FIELDS =
  '_id name user companyId agentId agentName prompt scheduleType scheduleConfig status emails workflowNodes lastRunAt nextRunAt';

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
  const automationIdStr = automation._id.toString();
  console.log(`[AutomationScheduler] Starting execution for automation "${automation.name}" (${automationIdStr})`);
  
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

  runningAutomations.set(automationIdStr, {
    abortController: prelimAbortController,
    timeoutId,
    startedAt: new Date(),
    automationName: automation.name,
    logId: log._id,
  });

  try {
    // 1. Fetch app config
    const appConfig = await getAppConfig();

    // 2. Fetch agent (soporta 'tenshi_avatar_3d' y 'tenshi_avatar_orchestrator' como Orquestador Tenshi 3D)
    const isTenshiAvatarAgent =
      automation.agentId === 'tenshi_avatar_3d' ||
      automation.agentId === 'tenshi_avatar_orchestrator' ||
      /tenshi/i.test(String(automation.agentId || '')) ||
      /tenshi/i.test(String(automation.agentName || ''));

    let agent = automation.agentId ? await getAgent({ id: automation.agentId }) : null;
    if (!agent) {
      const AgentModel =
        mongoose.models.Agent || (mongoose.modelNames().includes('Agent') ? mongoose.model('Agent') : null);
      if (AgentModel) {
        let fallbackDoc = null;
        if (!isTenshiAvatarAgent && automation.agentName) {
          fallbackDoc = await AgentModel.findOne({ name: automation.agentName }).lean();
        }
        if (!fallbackDoc) {
          fallbackDoc =
            (await AgentModel.findOne({ name: /tenshi/i }).lean()) ||
            (await AgentModel.findOne({ name: /consultor|profesional|sst/i }).lean()) ||
            (await AgentModel.findOne({}).lean());
        }
        if (fallbackDoc?.id) {
          agent = (await getAgent({ id: fallbackDoc.id })) || fallbackDoc;
        }
      }
    }
    if (!agent) {
      throw new Error(`Agent ${automation.agentId} not found`);
    }
    if (isTenshiAvatarAgent) {
      agent = {
        ...agent,
        name: automation.agentName || 'Tenshi (Avatar 3D)',
        instructions:
          `[IDENTIDAD ACTIVA: TENSHI (AVATAR 3D) — ORQUESTADOR INTELIGENTE DE WAPPY IA Y SOMOS SST]\n` +
          `Actúas como Tenshi (Avatar 3D), el copiloto ejecutivo, director técnico y orquestador principal de Seguridad y Salud en el Trabajo (SG-SST) de la plataforma WAPPY. Tu tono es ejecutivo, riguroso, cercano y resolutivo. Coordinas las herramientas de los 8 Hitos SST, Google Drive, Google Antigravity, NotebookLM y los sub-agentes especialistas para entregar resultados verificables y accionables.\n\n` +
          (agent.instructions || ''),
      };
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

    // 4. Resolve target company for strict multi-company isolation
    const targetCompanyIdStr = automation.companyId ? String(automation.companyId) : null;
    let automationCompany = null;
    if (targetCompanyIdStr && mongoose.Types.ObjectId.isValid(targetCompanyIdStr)) {
      try {
        automationCompany = await CompanyInfo.findById(targetCompanyIdStr).lean();
      } catch (_) {}
    }

    const rawEngine = automation.workflowNodes?.aiEngine;
    const selectedAiEngine =
      rawEngine === 'antigravity_cloud'
        ? 'antigravity_cloud'
        : rawEngine === 'antigravity'
          ? 'antigravity'
          : 'wappy';
    const allowedTextModels = ['gemini-3.6-flash', 'gemini-3.5-flash-lite', 'gemini-3.8-flash'];
    const requestedModel = automation.workflowNodes?.aiModel;
    const effectiveAiModel = allowedTextModels.includes(requestedModel)
      ? requestedModel
      : agent.model || 'gemini-3.6-flash';

    const antigravityEngineDirective =
      selectedAiEngine === 'antigravity_cloud'
        ? `- MOTOR IA SELECCIONADO EN EL FLUJO WAPPY: Google Antigravity Cloud 24/7 (antigravity.google.com) + MCP WAPPY. Utiliza prioritariamente la herramienta "google_antigravity" con entorno destino "cloud" (24/7 sin necesidad del PC encendido) y las herramientas MCP para ejecutar el procesamiento profundo de este flujo.\n`
        : selectedAiEngine === 'antigravity'
          ? `- MOTOR IA SELECCIONADO EN EL FLUJO WAPPY: Google Antigravity Local (Mac/PC) + MCP WAPPY. Utiliza prioritariamente la herramienta "google_antigravity" (action: "delegate_task" o consulta por puente Push SSE con respaldo Cloud Failover automático) y las herramientas MCP para ejecutar el procesamiento profundo de este flujo.\n`
          : `- MOTOR IA SELECCIONADO EN EL FLUJO WAPPY: WAPPY Cloud IA (Rotación de Claves) con el modelo "${effectiveAiModel}".\n`;

    // Equipo 4: Memorias del Agente (wappy_memory_company, wappy_memory_antiduplicate, wappy_rag_documental, wappy_memory_procedural)
    const activeMemories = Array.isArray(automation.workflowNodes?.memories)
      ? automation.workflowNodes.memories
      : ['wappy_memory_company'];

    let companyProfileMemoryBlock = '';
    if (activeMemories.includes('wappy_memory_company') && automationCompany) {
      companyProfileMemoryBlock =
        `- [MEMORIA DE EMPRESA (wappy_memory_company)]: Razón Social: "${automationCompany.companyName}" | NIT: ${automationCompany.nit || 'N/A'} | Actividad Económica: ${automationCompany.economicActivity || 'N/A'} (CIIU: ${automationCompany.ciiuCode || 'N/A'}) | Nivel de Riesgo ARL: ${automationCompany.riskLevel || 'N/A'} | ARL: ${automationCompany.arl || 'N/A'} | N.º Trabajadores: ${automationCompany.employeeCount ?? 'N/A'} | Ciudad/Depto: ${automationCompany.city || 'N/A'} / ${automationCompany.department || 'N/A'} | Representante Legal: ${automationCompany.legalRepresentative || 'N/A'} | Responsable SG-SST: ${automationCompany.sstResponsibleName || 'N/A'} (Licencia: ${automationCompany.sstLicenseNumber || 'N/A'})\n`;
    }

    let previousRunMemoryBlock = '';
    if (activeMemories.includes('wappy_memory_antiduplicate')) {
      try {
        const lastSuccessLog = await AutomationLog.findOne({
          automation: automation._id,
          status: 'success',
          _id: { $ne: log._id },
        })
          .sort({ runAt: -1 })
          .select('runAt result')
          .lean();
        if (lastSuccessLog?.result) {
          previousRunMemoryBlock =
            `- [MEMORIA DE BITÁCORA PREVIA — ANTI-DUPLICADOS (${new Date(lastSuccessLog.runAt).toISOString()})]: En la ejecución anterior ya se procesó lo siguiente (NO volver a duplicar ni reprocesar los mismos registros/archivos): ${String(lastSuccessLog.result).substring(0, 600)}\n`;
        } else if (automation.lastRunResult) {
          previousRunMemoryBlock =
            `- [MEMORIA DE BITÁCORA PREVIA — ANTI-DUPLICADOS]: Último resultado procesado (NO volver a duplicar ni reprocesar los mismos registros/archivos): ${String(automation.lastRunResult).substring(0, 500)}\n`;
        }
      } catch (_) {}
    }

    let ragDocumentalMemoryBlock = '';
    if (activeMemories.includes('wappy_rag_documental')) {
      try {
        const ragLines = [];
        const LiveDocumentModel =
          mongoose.models.LiveDocument || require('~/models/LiveDocument');
        if (LiveDocumentModel) {
          const docFilter = {
            user: automation.user,
            ...(targetCompanyIdStr && mongoose.Types.ObjectId.isValid(targetCompanyIdStr)
              ? { companyId: targetCompanyIdStr }
              : {}),
          };
          const liveDocs = await LiveDocumentModel.find(docFilter)
            .sort({ updatedAt: -1 })
            .limit(8)
            .select('title content updatedAt')
            .lean();
          if (Array.isArray(liveDocs) && liveDocs.length > 0) {
            const docSnippets = liveDocs.map((d) => {
              const excerpt = String(d.content || '')
                .replace(/<style[\s\S]*?<\/style>/gi, '')
                .replace(/<script[\s\S]*?<\/script>/gi, '')
                .replace(/<[^>]+>/g, ' ')
                .replace(/\s+/g, ' ')
                .trim()
                .slice(0, 320);
              return `  • Documento Vivo "${d.title || 'Sin título'}": "${excerpt}"`;
            });
            ragLines.push(...docSnippets);
          }
        }
        const NotebookSessionModel =
          mongoose.models.NotebookSession || require('~/models/NotebookSession');
        if (NotebookSessionModel) {
          const nbSession =
            (targetCompanyIdStr && mongoose.Types.ObjectId.isValid(targetCompanyIdStr)
              ? await NotebookSessionModel.findOne({
                  user: automation.user,
                  companyId: targetCompanyIdStr,
                })
                  .select('cachedNotebooks email')
                  .lean()
              : null) ||
            (await NotebookSessionModel.findOne({ user: automation.user })
              .select('cachedNotebooks email')
              .lean());
          if (Array.isArray(nbSession?.cachedNotebooks) && nbSession.cachedNotebooks.length > 0) {
            const nbTitles = nbSession.cachedNotebooks
              .slice(0, 8)
              .map((nb) => `"${nb.title || nb.name || 'Cuaderno'}" (ID: ${nb.id || 'N/A'})`)
              .join(', ');
            ragLines.push(`  • Cuadernos NotebookLM vinculados: ${nbTitles}`);
          }
        }
        if (ragLines.length > 0) {
          ragDocumentalMemoryBlock =
            `- [MEMORIA RAG DOCUMENTAL Y BASE DE CONOCIMIENTO DE LA EMPRESA (wappy_rag_documental)]:\n${ragLines.join('\n')}\n`;
        } else {
          ragDocumentalMemoryBlock =
            `- [MEMORIA RAG DOCUMENTAL (wappy_rag_documental)]: Sin documentos vivos ni cuadernos NotebookLM indexados aún para esta empresa; puedes consultar la biblioteca documental con wappy_consultar_documentos_vivo o wappy_ejecutar_notebooklm.\n`;
        }
      } catch (_) {}
    }

    let proceduralNormativeMemoryBlock = '';
    if (activeMemories.includes('wappy_memory_procedural')) {
      proceduralNormativeMemoryBlock =
        `- [MEMORIA PROCEDURAL Y MARCO NORMATIVO OBLIGATORIO SST COLOMBIA (wappy_memory_procedural)]:\n` +
        `  • Decreto 1072 de 2015 (Libro 2, Parte 2, Título 4, Cap. 6): Directrices obligatorias del SG-SST bajo el ciclo PHVA (Planear, Hacer, Verificar, Actuar).\n` +
        `  • Resolución 0312 de 2019: Estándares Mínimos del SG-SST según número de trabajadores y nivel de riesgo ARL (I a V — 7, 21 o 60 estándares).\n` +
        `  • Guía Técnica Colombiana GTC-45 (2012): Metodología oficial de Identificación de Peligros, Evaluación y Valoración de Riesgos (IPEVR: ND, NE, NP, NR, aceptabilidad y jerarquía de controles: Eliminación, Sustitución, Controles de Ingeniería, Controles Administrativos y EPP).\n` +
        `  • Resolución 2764 de 2022: Batería de Instrumentos de Evaluación de Factores de Riesgo Psicosocial y protocolos de intervención.\n` +
        `  • Resolución 20223040040595 de 2022: Metodología de diseño, implementación y verificación del Plan Estratégico de Seguridad Vial (PESV — 24 pasos).\n` +
        `  • Decreto 1496 de 2018: Sistema Globalmente Armonizado (SGA) de clasificación y etiquetado químico, FDS de 16 secciones y compatibilidad química.\n` +
        `  • Resolución 4272 de 2021: Requisitos mínimos de seguridad para el Programa de Prevención y Protección contra Caídas en Trabajo Seguro en Alturas.\n` +
        `  • Resolución 1401 de 2007: Investigación obligatoria de incidentes y accidentes de trabajo (ATEL) dentro de los 15 días calendario siguientes al evento, análisis causal y planes ACPM.\n`;
    }

    // Configuración granular por nodo (campos solicitados, contexto de entrada/salida y 2do Prompt de Agentes extra)
    let canvasNodesContextBlock = '';
    try {
      const nodeConfigs = automation.workflowNodes?.canvasLayout?.nodeConfigs || {};
      const extraAgents = Array.isArray(automation.workflowNodes?.canvasLayout?.extraAgents)
        ? automation.workflowNodes.canvasLayout.extraAgents
        : [];
      const customNodes = Array.isArray(automation.workflowNodes?.canvasLayout?.customNodes)
        ? automation.workflowNodes.canvasLayout.customNodes
        : [];
      const cfgLines = [];
      const ConversationModel =
        mongoose.models.Conversation ||
        (mongoose.modelNames().includes('Conversation') ? mongoose.model('Conversation') : null);
      const MessageModel =
        mongoose.models.Message ||
        (mongoose.modelNames().includes('Message') ? mongoose.model('Message') : null);

      for (const [nKey, cfg] of Object.entries(nodeConfigs)) {
        if (!cfg || typeof cfg !== 'object') continue;
        const parts = [];
        if (Array.isArray(cfg.fields) && cfg.fields.length > 0) {
          const isStrict = cfg.strictFieldFilter !== false;
          parts.push(
            isStrict
              ? `🎯 EXTRACCIÓN QUIRÚRGICA SIN SATURACIÓN (extraer, leer y pasar ÚNICAMENTE estos campos específicos): [${cfg.fields.join(', ')}]`
              : `Campos específicos solicitados: [${cfg.fields.join(', ')}]`,
          );
        }
        if (cfg.includeLatestReport && Array.isArray(cfg.reportTags) && cfg.reportTags.length > 0 && ConversationModel) {
          try {
            const companyFilter = targetCompanyIdStr
              ? { tags: { $in: [`company-${targetCompanyIdStr}`, `company_${targetCompanyIdStr}`] } }
              : {};
            const latestConv = await ConversationModel.findOne({
              user: String(automation.user),
              $and: [{ tags: { $in: cfg.reportTags } }, companyFilter],
            })
              .sort({ updatedAt: -1 })
              .select('conversationId title updatedAt')
              .lean();
            if (latestConv?.conversationId && MessageModel) {
              const latestMsg = await MessageModel.findOne({
                conversationId: latestConv.conversationId,
                isCreatedByUser: false,
              })
                .sort({ createdAt: -1 })
                .select('text')
                .lean();
              const cleanSnippet = String(latestMsg?.text || '')
                .replace(/<style[\s\S]*?<\/style>/gi, '')
                .replace(/<script[\s\S]*?<\/script>/gi, '')
                .replace(/<[^>]+>/g, ' ')
                .replace(/\s+/g, ' ')
                .trim()
                .slice(0, 700);
              parts.push(
                `📜 Último Informe del Historial ("${latestConv.title}"): "${cleanSnippet}"`,
              );
            }
          } catch (_) {}
        }
        if (Array.isArray(cfg.selectedReportIds) && cfg.selectedReportIds.length > 0 && MessageModel) {
          try {
            const selMsgs = await MessageModel.find({
              conversationId: { $in: cfg.selectedReportIds.slice(0, 5) },
              isCreatedByUser: false,
            })
              .sort({ createdAt: -1 })
              .limit(5)
              .select('conversationId text')
              .lean();
            if (selMsgs && selMsgs.length > 0) {
              const snippets = selMsgs.map((m) =>
                String(m.text || '')
                  .replace(/<style[\s\S]*?<\/style>/gi, '')
                  .replace(/<script[\s\S]*?<\/script>/gi, '')
                  .replace(/<[^>]+>/g, ' ')
                  .replace(/\s+/g, ' ')
                  .trim()
                  .slice(0, 500),
              );
              parts.push(
                `📜 Informes Seleccionados del Historial (${(cfg.selectedReportTitles || []).join(', ')}): "${snippets.join(' || ')}"`,
              );
            }
          } catch (_) {}
        }
        if (cfg.targetUrl && String(cfg.targetUrl).trim()) {
          parts.push(`URL(s) / Consulta Objetivo: "${String(cfg.targetUrl).trim()}"`);
        }
        if (cfg.scriptEngine) {
          parts.push(`Motor Script Antigravity: ${cfg.scriptEngine}`);
        }
        if (cfg.scriptCode && String(cfg.scriptCode).trim()) {
          parts.push(`Script de Extracción / Selectores: "${String(cfg.scriptCode).trim()}"`);
        }
        if (cfg.skillContent && String(cfg.skillContent).trim()) {
          parts.push(`Skill (SKILL.md): "${String(cfg.skillContent).trim()}"`);
        }
        if (cfg.ruleText && String(cfg.ruleText).trim()) {
          parts.push(`Regla Obligatoria: "${String(cfg.ruleText).trim()}"`);
        }
        if (cfg.inputContext && String(cfg.inputContext).trim()) {
          parts.push(`Contexto de entrada: "${String(cfg.inputContext).trim()}"`);
        }
        if (cfg.outputContext && String(cfg.outputContext).trim()) {
          parts.push(`Contexto de salida: "${String(cfg.outputContext).trim()}"`);
        }
        if (cfg.customInstruction && String(cfg.customInstruction).trim()) {
          parts.push(`Instrucción del nodo: "${String(cfg.customInstruction).trim()}"`);
        }
        if (parts.length > 0) {
          cfgLines.push(`  • Nodo [${nKey}]: ${parts.join(' | ')}`);
        }
      }
      extraAgents.forEach((ea, idx) => {
        if (!ea) return;
        const eaParts = [`Agente IA #${idx + 2}: "${ea.agentName || 'Especialista'}" (${ea.roleLabel || 'IA Revisora'})`];
        if (ea.prompt && String(ea.prompt).trim()) {
          eaParts.push(`Segundo Prompt: "${String(ea.prompt).trim()}"`);
        }
        if (ea.inputContext && String(ea.inputContext).trim()) {
          eaParts.push(`Entrada: "${String(ea.inputContext).trim()}"`);
        }
        if (ea.outputContext && String(ea.outputContext).trim()) {
          eaParts.push(`Salida: "${String(ea.outputContext).trim()}"`);
        }
        cfgLines.push(`  • ${eaParts.join(' | ')}`);
      });
      customNodes.forEach((cn) => {
        if (!cn) return;
        const cnParts = [
          `Nodo Especial [${cn.nodeType || 'custom'} — "${cn.title || cn.key}"]: ${cn.content || cn.subtitle || ''}`,
        ];
        if (cn.targetUrl && String(cn.targetUrl).trim()) {
          cnParts.push(`URL Objetivo: "${String(cn.targetUrl).trim()}"`);
        }
        if (cn.scriptEngine) {
          cnParts.push(`Motor Script Antigravity: ${cn.scriptEngine}`);
        }
        if (cn.scriptCode && String(cn.scriptCode).trim()) {
          cnParts.push(`Script: "${String(cn.scriptCode).trim()}"`);
        }
        cfgLines.push(`  • ${cnParts.join(' | ')}`);
      });
      if (cfgLines.length > 0) {
        canvasNodesContextBlock =
          `- [CONFIGURACIÓN DETALLADA DE NODOS Y MULTI-AGENTE EN EL LIENZO WAPPY]:\n${cfgLines.join('\n')}\n`;
      }
    } catch (_) {}

    let liveDatabaseSurgicalBlock = '';
    try {
      liveDatabaseSurgicalBlock = await buildSurgicalLiveContextForWorkflow(automation, automationCompany);
    } catch (liveErr) {
      console.error('[AutomationScheduler] Error construyendo extracción quirúrgica en vivo:', liveErr?.message || liveErr);
    }

    const companyHeaderBlock = automationCompany
      ? `[CONTEXTO OBLIGATORIO DE EJECUCIÓN AUTOMÁTICA — AISLAMIENTO ESTRICTO DE EMPRESA]\n` +
        `- Empresa objetivo exclusiva de esta tarea: "${automationCompany.companyName}" (NIT: ${automationCompany.nit || 'N/A'}, ID: ${targetCompanyIdStr}).\n` +
        antigravityEngineDirective +
        companyProfileMemoryBlock +
        previousRunMemoryBlock +
        ragDocumentalMemoryBlock +
        proceduralNormativeMemoryBlock +
        canvasNodesContextBlock +
        liveDatabaseSurgicalBlock +
        `- PROHIBIDO usar, mencionar, cruzar o asumir datos de cualquier otra empresa del usuario (aunque aparezcan en memorias previas o si el texto de la instrucción menciona por error otro nombre de empresa).\n` +
        `- PROHIBIDO crear nuevas automatizaciones o tareas programadas recurrentes durante esta ejecución automática.\n` +
        `- PROHIBIDO generar código fuente de aplicativos interactivos (<!DOCTYPE html>, <script>, funciones de simulación JS) como respuesta; entrega únicamente un informe ejecutivo claro y estructurado en Markdown.\n` +
        `- REGLA DE VERACIDAD ESTRICTA: Si Google Drive no está vinculado para "${automationCompany.companyName}" o no existen archivos nuevos reales, infórmalo con total transparencia y NO registres ni inventes datos. JAMÁS simules ni inventes trabajadores, accidentes, hallazgos o acciones ACPM, ni presentes registros antiguos de la base de datos como si acabaran de procesarse desde Drive.\n\n` +
        `[INSTRUCCIÓN DE LA TAREA PROGRAMADA]:\n`
      : `${antigravityEngineDirective}${companyProfileMemoryBlock}${previousRunMemoryBlock}${ragDocumentalMemoryBlock}${proceduralNormativeMemoryBlock}${canvasNodesContextBlock}${liveDatabaseSurgicalBlock}`;
    const effectivePrompt = `${companyHeaderBlock}${automation.prompt}`;

    // Override agent model if specified in the WAPPY workflow canvas
    if (effectiveAiModel) {
      agent.model = effectiveAiModel;
      agent.model_parameters = {
        ...(agent.model_parameters || {}),
        model: effectiveAiModel,
      };
    }

    // Build mock request & response with explicit companyId and isAutomation flag
    const req = {
      user: reqUser,
      companyId: targetCompanyIdStr,
      isAutomation: true,
      body: {
        text: effectivePrompt,
        companyId: targetCompanyIdStr,
        isAutomation: true,
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
    console.log(`[AutomationScheduler] STEP 3: Executing prompt for "${automation.name}" via agent "${agent?.name || 'Default'}" (companyId: ${targetCompanyIdStr || 'none'})...`);
    let raceTimeoutId = null;
    const response = await Promise.race([
      client.sendMessage(effectivePrompt, messageOptions),
      new Promise((_, reject) => {
        raceTimeoutId = setTimeout(() => {
          prelimAbortController.abort();
          reject(new Error('Tiempo límite de ejecución superado (8 minutos).'));
        }, 480000);
      }),
    ]);
    if (raceTimeoutId) {
      clearTimeout(raceTimeoutId);
    }
    
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

      const configuredOutputs = Array.isArray(automation.workflowNodes?.outputs)
        ? automation.workflowNodes.outputs
        : ['email_report'];
      const compLabel = automationCompany?.companyName || 'Somos SST';

      // 11A. Notificación Directa en WAPPY + Chat de Tenshi (cuando wappy_notification está activo)
      if (configuredOutputs.includes('wappy_notification')) {
        try {
          const shortSummary = resultText.replace(/[#*_`]/g, '').substring(0, 260);
          await Notification.create({
            user: automation.user,
            companyId: automation.companyId || null,
            title: `✅ Bitácora Completada: ${automation.name} (${compLabel})`,
            body: `${shortSummary}${resultText.length > 260 ? '...' : ''}`,
            type: 'system_update',
            read: false,
          });
          await TenshiMessage.create({
            user: automation.user,
            companyId: automation.companyId ? String(automation.companyId) : null,
            role: 'assistant',
            content:
              `🤖 **Automatización Ejecutada: ${automation.name} (${compLabel})**\n\n` +
              `${resultText.substring(0, 900)}${resultText.length > 900 ? '\n\n*(Ver informe completo en el Historial de Ejecuciones de /tareas)*' : ''}`,
          });
        } catch (notifErr) {
          console.warn('[AutomationScheduler] Non-blocking WAPPY notification error:', notifErr.message);
        }
      }

      // 11B. Envío de Bitácora Final a Google Antigravity (PC Local o Cloud 24/7)
      if (
        configuredOutputs.includes('antigravity_local_report') ||
        configuredOutputs.includes('antigravity_cloud_report')
      ) {
        try {
          const targetEnv = configuredOutputs.includes('antigravity_cloud_report')
            ? 'Antigravity Cloud 24/7'
            : 'Antigravity Local (Mi PC)';
          await KanbanTask.create({
            user: automation.user,
            companyId: targetCompanyIdStr || 'DEFAULT',
            title: `[Bitácora ${targetEnv}] ${automation.name} — ${compLabel}`,
            description: resultText.substring(0, 4000),
            status: 'done',
            priority: 'medium',
            type: 'antigravity_delegation',
            sourceModule: 'Automatización WAPPY',
            assignedTo: targetEnv,
            category: 'Automatización WAPPY',
            assignedAgent: targetEnv,
            dueDate: new Date(),
            completedAt: new Date(),
          });
          const shortSummary = resultText.replace(/[#*_`]/g, '').substring(0, 240);
          await Notification.create({
            user: automation.user,
            companyId: automation.companyId || null,
            title: `📡 Bitácora ${targetEnv}: ${automation.name} (${compLabel})`,
            body: `Informe registrado en ${targetEnv}: ${shortSummary}${resultText.length > 240 ? '...' : ''}`,
            type: 'system_update',
            read: false,
          });
        } catch (agyErr) {
          console.warn('[AutomationScheduler] Non-blocking Antigravity bitácora error:', agyErr.message);
        }
      }

      // 11C. Creación/Actualización de Documento en el Editor en Vivo WAPPY (canvas_doc)
      if (configuredOutputs.includes('canvas_doc')) {
        try {
          const LiveDocumentModel =
            mongoose.models.LiveDocument || require('~/models/LiveDocument');
          if (LiveDocumentModel) {
            const docTitle = `📄 Informe Automatizado: ${automation.name} (${compLabel})`;
            const htmlContent = formatMarkdownToEmailHtml(resultText) || `<p>${resultText}</p>`;
            const validCompanyObjId =
              targetCompanyIdStr && mongoose.Types.ObjectId.isValid(targetCompanyIdStr)
                ? targetCompanyIdStr
                : undefined;
            await LiveDocumentModel.findOneAndUpdate(
              {
                user: automation.user,
                title: docTitle,
                ...(validCompanyObjId ? { companyId: validCompanyObjId } : {}),
              },
              {
                $set: {
                  title: docTitle,
                  content: htmlContent,
                  originalFileName: `${automation.name}.docx`,
                  originalFileType: 'html',
                  user: automation.user,
                  ...(validCompanyObjId ? { companyId: validCompanyObjId } : {}),
                },
              },
              { upsert: true, new: true },
            );
          }
        } catch (docErr) {
          console.warn('[AutomationScheduler] Non-blocking LiveDocument (canvas_doc) error:', docErr.message);
        }
      }

      // 11D. Creación de Tarea / Plan de Acción ACPM en el Cronograma SG-SST (acpm_task)
      if (configuredOutputs.includes('acpm_task')) {
        try {
          const dueIn7Days = new Date(Date.now() + 7 * 24 * 3600000);
          await KanbanTask.create({
            user: automation.user,
            companyId: targetCompanyIdStr || 'DEFAULT',
            title: `[ACPM Automatización] ${automation.name} — ${compLabel}`,
            description: resultText.substring(0, 3500),
            status: 'todo',
            priority: 'alta',
            actionType: 'correctiva',
            type: 'audit_finding',
            sourceModule: 'Automatización WAPPY (ACPM)',
            assignedTo: automation.agentName || agent?.name || 'Responsable SG-SST',
            referenceId: String(automation._id),
            referenceName: automation.name,
            dueDate: dueIn7Days,
          });
        } catch (acpmErr) {
          console.warn('[AutomationScheduler] Non-blocking ACPM task error:', acpmErr.message);
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

    prelimAbortController.abort();

    const isStoppedManually =
      err?.message?.includes('Detenida manualmente') ||
      err?.name === 'AbortError' ||
      err?.name === 'CancelledError';

    // Update Log to failed
    await AutomationLog.updateOne(
      { _id: log._id },
      {
        $set: {
          status: 'failed',
          error: isStoppedManually ? 'Detenida manualmente por el usuario.' : (err.message || 'Error desconocido')
        }
      }
    );

    // If all API keys failed, quota exceeded, or critical execution failure:
    // Pause immediately in this single run so it doesn't repeat on future schedules.
    const isExhaustionOrCritical =
      !isStoppedManually &&
      (err?.message?.includes('All available API keys failed') ||
        err?.message?.includes('429') ||
        err?.message?.includes('quota') ||
        err?.message?.includes('Quota') ||
        err?.message?.includes('API_KEY_INVALID') ||
        err?.message?.includes('overloaded') ||
        err?.message?.includes('Tiempo límite de ejecución superado'));

    // Update Automation last run stats
    const updateDoc = {
      lastRunAt: new Date(),
      lastRunStatus: isStoppedManually ? 'stopped' : 'failed',
      lastRunResult: isStoppedManually
        ? 'Detenida manualmente por el usuario en tiempo real.'
        : isExhaustionOrCritical
          ? `Pausada automáticamente: se rotaron todas las claves API y modelos de respaldo sin éxito (${err.message}). Revise sus claves o prompt y presione Reactivar.`
          : `Error: ${err.message}`
    };

    if (isExhaustionOrCritical) {
      updateDoc.status = 'paused_error';
      updateDoc.nextRunAt = null;
      console.warn(`[AutomationScheduler] Automation "${automation.name}" paused immediately due to exhaustion/critical failure.`);
    } else if (isManual && automation.status === 'active') {
      updateDoc.nextRunAt = calculateNextRun(automation.scheduleType, automation.scheduleConfig);
    }

    await Automation.updateOne({ _id: automation._id }, { $set: updateDoc });
  } finally {
    clearTimeout(timeoutId);
    runningAutomations.delete(automationIdStr);
    // Drenaje continuo: apenas se libera una ventanilla, revisar si hay más tareas en la fila
    scheduleImmediateDrain(400);
  }
}

/**
 * Stops an active running automation immediately in real time.
 * @param {string} automationId
 * @returns {Promise<{ success: boolean, message: string }>}
 */
async function stopAutomation(automationId) {
  const idStr = automationId ? automationId.toString() : '';
  const running = runningAutomations.get(idStr);

  if (running) {
    console.log(`[AutomationScheduler] Stopping running automation "${running.automationName || idStr}"...`);
    if (running.timeoutId) {
      clearTimeout(running.timeoutId);
    }
    if (running.abortController && !running.abortController.signal.aborted) {
      running.abortController.abort();
    }
    runningAutomations.delete(idStr);
  }

  // Update MongoDB state to stopped
  await Promise.all([
    Automation.updateOne(
      { _id: idStr },
      {
        $set: {
          lastRunStatus: 'stopped',
          lastRunResult: 'Detenida manualmente por el usuario en tiempo real.'
        }
      }
    ),
    AutomationLog.updateMany(
      { automation: idStr, status: 'running' },
      {
        $set: {
          status: 'failed',
          error: 'Detenida manualmente por el usuario.'
        }
      }
    )
  ]);

  return {
    success: true,
    message: running
      ? 'Automatización detenida inmediatamente en segundo plano.'
      : 'Estado de la automatización actualizado a detenido.'
  };
}

async function checkAndRunAutomations() {
  if (isCheckingAutomations) return;
  isCheckingAutomations = true;
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

    // 2. Respect the ADAPTIVE concurrency cap: adjusts between MIN (2) and MAX (8) based on live chat load
    const adaptiveCap = getAdaptiveConcurrencyLimit();
    const availableSlots = adaptiveCap - runningAutomations.size;
    if (availableSlots <= 0) return;

    // Query pending active automations (lean + projection + limit => mínimo uso de RAM)
    const pendingAutomations = await Automation.find({
      isSystemPreset: { $ne: true },
      companyId: { $ne: 'SYSTEM_PRESET' },
      status: 'active',
      lastRunStatus: { $ne: 'running' },
      $or: [
        { nextRunAt: { $lte: now } },
        { nextRunAt: null }
      ]
    })
      .select(AUTOMATION_RUN_FIELDS)
      .sort({ nextRunAt: 1 })
      .limit(availableSlots)
      .lean();

    if (pendingAutomations.length === 0) return;

    console.log(`[AutomationScheduler] Found ${pendingAutomations.length} pending automations to execute (adaptive cap: ${adaptiveCap}, active: ${runningAutomations.size}).`);

    const toExecute = [];

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

      toExecute.push(automation);
    }

    if (toExecute.length === 0) return;

    // 5. Execute (bounded by the global cap above) with 500ms stagger to protect RAM and API rate limits
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    (async () => {
      const executing = new Set();
      for (const item of toExecute) {
        const p = Promise.resolve()
          .then(() => runAutomation(item))
          .catch((err) => {
            console.error(`[AutomationScheduler] Background run error for ${item._id}:`, err);
          });

        executing.add(p);
        p.finally(() => executing.delete(p));

        if (executing.size >= MAX_CONCURRENT_AUTOMATIONS) {
          await Promise.race(executing);
        }

        if (STAGGER_MS > 0) {
          await delay(STAGGER_MS);
        }
      }
      await Promise.all(executing);
    })().catch((poolErr) => {
      console.error('[AutomationScheduler] Concurrency pool error:', poolErr);
    });
  } catch (err) {
    console.error('[AutomationScheduler] Error in checkAndRunAutomations interval:', err);
  } finally {
    isCheckingAutomations = false;
  }
}

function startAutomationScheduler() {
  if (schedulerInterval) return; // Ya está corriendo

  console.log(`[AutomationScheduler] Starting automation background scheduler (interval: 1 minute, max concurrency: ${MAX_CONCURRENT_AUTOMATIONS}, America/Bogota timezone aware)...`);
  
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
  if (drainTimer) {
    clearTimeout(drainTimer);
    drainTimer = null;
  }
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log('[AutomationScheduler] Stopped background scheduler.');
  }
}

/**
 * Ejecuta un Agente IA individual dentro del Escenario de Desarrollo (Sandbox) con rotación de claves WAPPY.
 * Cero llamadas a servidores externos innecesarios (Ollama/Firecrawl/Reranker/MCP) y cero efectos secundarios sobre salidas.
 */
async function executeSandboxAgentCall({
  reqUser,
  agentDoc,
  fullPrompt,
  useWebSearch = false,
}) {
  const startedAt = Date.now();
  try {
    const { generateWithKeyRotation } = require('~/server/routes/sgsst/sgsstGemini');
    const preferredModel = agentDoc?.model || 'gemini-3.6-flash';
    const systemInstruction =
      agentDoc?.instructions ||
      'Actúas como Consultor Especialista en Seguridad y Salud en el Trabajo (SG-SST) de WAPPY IA bajo la normativa colombiana vigente (Decreto 1072 de 2015 y Resolución 0312 de 2019).';

    const result = await generateWithKeyRotation(
      preferredModel,
      reqUser?.id || reqUser,
      fullPrompt,
      {
        systemInstruction,
        useWebSearch: Boolean(useWebSearch),
        generationConfig: {
          temperature: 0.15,
          maxOutputTokens: 8192,
        },
      },
    );

    const responseText =
      (result?.response && typeof result.response.text === 'function'
        ? result.response.text()
        : result?.text || '') || '';

    const cleanText = String(responseText).trim();
    return {
      text: cleanText || '(Simulación completada por el agente en el Escenario de Desarrollo)',
      durationMs: Math.max(1, Date.now() - startedAt),
      error: null,
    };
  } catch (err) {
    console.warn('[Sandbox Play] Aviso en executeSandboxAgentCall:', err?.message || err);
    return {
      text: '',
      durationMs: Math.max(1, Date.now() - startedAt),
      error: err?.message || 'Error ejecutando el Agente IA en el Escenario de Desarrollo.',
    };
  }
}

/**
 * Ejecuta una simulación completa del flujo en el Escenario de Desarrollo / Sandbox (`dryRun: true`).
 * Recorre los nodos UNO A UNO en orden estricto de ejecución (emitiendo eventos en tiempo real vía `onProgress`),
 * filtra campos quirúrgicos, ejecuta el Agente IA Principal y Sub-Agentes, evalúa la Condición Si/No,
 * procesa los Hitos SST y construye la vista previa de salidas SIN enviar correos ni modificar registros.
 */
async function runWorkflowSandboxSimulation(params = {}, onProgress = null) {
  const simStartTime = Date.now();
  const emitProgress = async (payload) => {
    if (typeof onProgress === 'function') {
      try {
        await onProgress(payload);
      } catch (_) {}
    }
  };
  const pauseStep = (ms = 180) => new Promise((resolve) => setTimeout(resolve, ms));
  const {
    user,
    companyId,
    name,
    agentId,
    agentName,
    prompt,
    scheduleType = 'daily',
    scheduleConfig = { hour: 8, minute: 0 },
    emails = [],
    workflowNodes = {},
    mockTriggerInput = '',
  } = params;

  const flowName = (name && String(name).trim()) || 'Prueba en Escenario de Desarrollo';
  const userIdStr = String(user?.id || user?._id || '');

  // 1. Resolver usuario y empresa activa en modo lectura
  let userObj = null;
  try {
    const UserModel =
      mongoose.models.User || (mongoose.modelNames().includes('User') ? mongoose.model('User') : null);
    if (UserModel && userIdStr && mongoose.Types.ObjectId.isValid(userIdStr)) {
      userObj = await UserModel.findById(userIdStr).lean();
    }
  } catch (_) {}

  const reqUser = userObj
    ? { ...userObj, id: userObj._id.toString() }
    : { ...(user || {}), id: userIdStr };

  let automationCompany = null;
  let targetCompanyIdStr =
    companyId && companyId !== 'SYSTEM_PRESET' && companyId !== 'default' ? String(companyId) : null;
  try {
    if (targetCompanyIdStr && mongoose.Types.ObjectId.isValid(targetCompanyIdStr)) {
      automationCompany = await CompanyInfo.findById(targetCompanyIdStr).lean();
    }
    if (!automationCompany && userIdStr) {
      automationCompany =
        (await CompanyInfo.findOne({ user: userIdStr, isActive: true }).lean()) ||
        (await CompanyInfo.findOne({ user: userIdStr }).sort({ updatedAt: -1 }).lean());
      if (automationCompany?._id) {
        targetCompanyIdStr = String(automationCompany._id);
      }
    }
  } catch (_) {}

  const companyName = automationCompany?.companyName || 'Empresa Activa';
  const wf = workflowNodes && typeof workflowNodes === 'object' ? workflowNodes : {};
  const nodeConfigs = wf?.canvasLayout?.nodeConfigs || {};

  // Helper para recuperar la configuración quirúrgica de cualquier nodo del lienzo
  const resolveNodeConfig = (nodeKey, nodeId) => {
    return (
      nodeConfigs[nodeKey] ||
      nodeConfigs[nodeId] ||
      nodeConfigs[`trigger_${nodeId}`] ||
      nodeConfigs[`ext_${nodeId}`] ||
      nodeConfigs[`sub_memory_${nodeId}`] ||
      nodeConfigs[`tool_inputs_${nodeId}`] ||
      nodeConfigs[`tool_hitos_${nodeId}`] ||
      nodeConfigs[`hito_${nodeId}`] ||
      nodeConfigs[`out_${nodeId}`] ||
      {}
    );
  };

  // Normalizar listas de nodos configurados en el flujo
  const configuredTriggers =
    Array.isArray(wf.triggers) && wf.triggers.length > 0
      ? wf.triggers
      : [wf.trigger || 'schedule_cron'];
  const configuredExtractors = Array.isArray(wf.extractors) ? wf.extractors : [];
  const configuredMemories =
    Array.isArray(wf.memories) && wf.memories.length > 0
      ? wf.memories
      : ['wappy_memory_company'];
  const configuredInputs = Array.isArray(wf.inputs) ? wf.inputs : [];
  const configuredCustomNodes = Array.isArray(wf.canvasLayout?.customNodes)
    ? wf.canvasLayout.customNodes.filter(Boolean)
    : [];
  const configuredHitos = Array.isArray(wf.hitos) ? wf.hitos : [];
  const configuredOutputs =
    Array.isArray(wf.outputs) && wf.outputs.length > 0 ? wf.outputs : ['email_report'];

  // ═══════════════════════════════════════════════════════════════════════════
  // PASO A — Plan de Ejecución Consecutivo del Grafo Conectado (`executionPlan`)
  // ═══════════════════════════════════════════════════════════════════════════
  const nodeTrace = [];
  let stepCounter = 0;
  let totalExtractedRecords = 0;
  let totalCriticalRecords = 0;

  const outputTitleMap = {
    email_report: '📧 Reporte Ejecutivo por Correo Electrónico',
    wappy_notification: '🔔 Notificación en WAPPY + Chat de Tenshi',
    acpm_task: '📋 Tarea Preventiva/Correctiva en Centro de Control ACPM',
    canvas_doc: '📄 Documento en Editor en Vivo WAPPY (LiveEditor)',
    somos_sst_update: '🛡️ Actualización de Aplicativos en Somos SST',
    antigravity_local_report: '💻 Envío de Bitácora a Google Antigravity Local (PC)',
    antigravity_cloud_report: '☁️ Envío de Bitácora a Google Antigravity Cloud 24/7',
    google_docs: '📝 Exportación a Google Docs',
    google_sheets: '📊 Sincronización en Google Sheets',
    google_slides: '📽️ Presentación Ejecutiva en Google Slides',
    google_calendar: '📅 Agendamiento en Google Calendar',
  };

  // Si el frontend envía `params.executionPlan` (calculado desde los cables activos y el orden visual del lienzo),
  // se respeta ESTRICTAMENTE ese orden consecutivo y se ignoran todos los nodos desconectados.
  let executionPlan = Array.isArray(params.executionPlan)
    ? params.executionPlan.filter((s) => s && s.nodeKey && s.isConnected !== false)
    : [];

  if (executionPlan.length === 0) {
    // Fallback por defecto si no se envió executionPlan explícito
    configuredTriggers.forEach((trigId, i) => {
      executionPlan.push({
        nodeKey: i === 0 ? 'trigger_root' : `trigger_${trigId}`,
        nodeId: trigId,
        category: 'trigger',
      });
    });
    configuredExtractors.forEach((extId) => {
      executionPlan.push({
        nodeKey: `extractor_${extId}`,
        nodeId: extId,
        category: 'extractor',
      });
    });
    executionPlan.push({
      nodeKey: 'sub_model',
      nodeId: wf?.aiModel || 'gemini-3.6-flash',
      category: 'model',
    });
    configuredMemories.forEach((memId, mIdx) => {
      executionPlan.push({
        nodeKey: mIdx === 0 ? 'sub_memory' : `sub_memory_${memId}`,
        nodeId: memId,
        category: 'memory',
      });
    });
    configuredInputs.forEach((inId) => {
      executionPlan.push({
        nodeKey: `tool_inputs_${inId}`,
        nodeId: inId,
        category: 'tool',
      });
    });
    configuredCustomNodes.forEach((cn, i) => {
      const cnKey = cn.key || cn.id || `custom_${i + 1}`;
      executionPlan.push({
        nodeKey: cnKey,
        nodeId: cn.nodeType || cnKey,
        category: 'custom_node',
      });
    });
    executionPlan.push({
      nodeKey: 'agent_root',
      nodeId: agentId || 'agent_root',
      category: 'agent',
    });
    const extraAgentsFallback = Array.isArray(wf?.canvasLayout?.extraAgents)
      ? wf.canvasLayout.extraAgents.filter(Boolean).slice(0, 2)
      : [];
    extraAgentsFallback.forEach((ea, idx) => {
      executionPlan.push({
        nodeKey: ea.key || `extra_agent_${idx + 1}`,
        nodeId: ea.agentId || ea.key || `extra_agent_${idx + 1}`,
        category: 'agent',
      });
    });
    if (wf.includeIfNode !== false) {
      executionPlan.push({
        nodeKey: 'if_condition',
        nodeId: 'if_condition',
        category: 'condition',
      });
    }
    configuredHitos.forEach((hId) => {
      executionPlan.push({
        nodeKey: `hito_${hId}`,
        nodeId: hId,
        category: 'hito',
      });
    });
    configuredOutputs.forEach((outId) => {
      executionPlan.push({
        nodeKey: `out_${outId}`,
        nodeId: outId,
        category: 'output',
      });
    });
  }

  // Conjuntos de nodos REALMENTE conectados según `executionPlan`
  const connectedNodeKeys = new Set(executionPlan.map((s) => String(s.nodeKey)));
  const connectedNodeIds = new Set(executionPlan.map((s) => String(s.nodeId)));

  // Resolver Agente IA Principal y configuración de modelo
  const isTenshiAvatarAgent =
    agentId === 'tenshi_avatar_3d' ||
    agentId === 'tenshi_avatar_orchestrator' ||
    /tenshi/i.test(String(agentId || '')) ||
    /tenshi/i.test(String(agentName || ''));

  let agent = agentId ? await getAgent({ id: agentId }).catch(() => null) : null;
  const AgentModel =
    mongoose.models.Agent || (mongoose.modelNames().includes('Agent') ? mongoose.model('Agent') : null);

  if (!agent && AgentModel) {
    let fallbackDoc = null;
    if (!isTenshiAvatarAgent && agentName) {
      fallbackDoc = await AgentModel.findOne({ name: agentName }).lean().catch(() => null);
    }
    if (!fallbackDoc) {
      fallbackDoc =
        (await AgentModel.findOne({ name: /tenshi/i }).lean().catch(() => null)) ||
        (await AgentModel.findOne({ name: /consultor|profesional|sst/i }).lean().catch(() => null)) ||
        (await AgentModel.findOne({}).lean().catch(() => null));
    }
    if (fallbackDoc?.id) {
      agent = (await getAgent({ id: fallbackDoc.id }).catch(() => null)) || fallbackDoc;
    }
  }

  if (!agent) {
    agent = {
      id: agentId || 'agent_consultor_sg_sst',
      name: agentName || 'Consultor SG-SST',
      provider: 'google',
      model: 'gemini-3.6-flash',
      instructions:
        'Actúas como Consultor Especialista en Seguridad y Salud en el Trabajo (SG-SST) de WAPPY IA bajo la normativa colombiana vigente (Decreto 1072 de 2015 y Resolución 0312 de 2019).',
      tools: [],
      model_parameters: { model: 'gemini-3.6-flash' },
    };
  }

  if (isTenshiAvatarAgent) {
    agent = {
      ...agent,
      name: agentName || 'Tenshi (Avatar 3D)',
      instructions:
        `[IDENTIDAD ACTIVA: TENSHI (AVATAR 3D) — ORQUESTADOR INTELIGENTE DE WAPPY IA Y SOMOS SST]\n` +
        `Actúas como Tenshi (Avatar 3D), el copiloto ejecutivo, director técnico y orquestador principal de Seguridad y Salud en el Trabajo (SG-SST) de la plataforma WAPPY. Tu tono es ejecutivo, riguroso, cercano y resolutivo.\n\n` +
        (agent.instructions || ''),
    };
  }

  const rawEngine = wf?.aiEngine;
  const selectedAiEngine =
    rawEngine === 'antigravity_cloud'
      ? 'antigravity_cloud'
      : rawEngine === 'antigravity'
        ? 'antigravity'
        : 'wappy';

  const allowedTextModels = ['gemini-3.6-flash', 'gemini-3.5-flash-lite', 'gemini-3.8-flash'];
  const requestedModel = wf?.aiModel;
  const effectiveAiModel = allowedTextModels.includes(requestedModel)
    ? requestedModel
    : allowedTextModels.includes(agent?.model)
      ? agent.model
      : 'gemini-3.6-flash';

  agent.model = effectiveAiModel;
  agent.model_parameters = {
    ...(agent.model_parameters || {}),
    model: effectiveAiModel,
  };

  // Helper para inspeccionar y filtrar quirúrgicamente un nodo conectado de datos/memoria/herramienta/hito
  const executeDataStep = async ({ nodeKey, nodeId, category, customTitle }) => {
    await emitProgress({
      type: 'step_start',
      nodeKey,
      nodeId,
      category,
    });
    const t0 = Date.now();
    const cfg = resolveNodeConfig(nodeKey, nodeId);
    const rawFields = Array.isArray(cfg.selectedFields)
      ? cfg.selectedFields
      : Array.isArray(cfg.fields)
        ? cfg.fields
        : [];
    const surgicalFields = rawFields.filter(Boolean);
    const filterMode = cfg.recordFilterMode || 'all';
    const selectedRecordIds = Array.isArray(cfg.selectedRecordIds) ? cfg.selectedRecordIds : [];

    let liveData = null;
    try {
      liveData = await inspectNodeLiveData({
        userId: userIdStr,
        companyId: targetCompanyIdStr,
        nodeId,
      });
    } catch (_) {}
    await pauseStep(240);

    const allRecords = Array.isArray(liveData?.records) ? liveData.records : [];
    let filteredRecords = allRecords;

    if (filterMode === 'critical_only') {
      filteredRecords = allRecords.filter((r) => r.isCritical);
    } else if (filterMode === 'selected' && selectedRecordIds.length > 0) {
      const idSet = new Set(selectedRecordIds.map(String));
      filteredRecords = allRecords.filter((r) => idSet.has(String(r.id)));
    }

    const isProceduralNode =
      nodeId === 'wappy_memory_procedural' || liveData?.canonicalNodeId === 'wappy_memory_procedural';
    if (isProceduralNode && surgicalFields.length > 0) {
      const normTokens = surgicalFields.map((s) =>
        String(s).toLowerCase().replace(/\.md$/i, '').replace(/[_-]+/g, ' ').trim(),
      );
      const matchedMdRecords = filteredRecords.filter((r) => {
        const hay = `${r.id || ''} ${r.label || ''} ${r.sublabel || ''}`
          .toLowerCase()
          .replace(/[_-]+/g, ' ');
        return normTokens.some((tok) => tok && hay.includes(tok));
      });
      if (matchedMdRecords.length > 0) {
        filteredRecords = matchedMdRecords;
      }
    }

    const critCount = filteredRecords.filter((r) => r.isCritical).length;
    totalExtractedRecords += filteredRecords.length;
    totalCriticalRecords += critCount;

    const kpiLine = Array.isArray(liveData?.kpis)
      ? liveData.kpis.map((k) => `${k.label}: ${k.value}`).join(' · ')
      : '';

    const previewLines = [];
    if (kpiLine) {
      previewLines.push(`📊 KPIs en Vivo: ${kpiLine}`);
    }
    if (surgicalFields.length > 0) {
      previewLines.push(`🎯 Filtro Quirúrgico Activo (${surgicalFields.length}): [${surgicalFields.join(', ')}]`);
    }

    const normalizeFieldTokens = (txt) =>
      String(txt || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length >= 3 && !['del', 'los', 'las', 'por', 'con', 'para', 'una', 'uno', 'que', 'sus'].includes(w));

    const sampleRecords = filteredRecords.slice(0, 15);
    if (sampleRecords.length > 0) {
      const formattedRows = sampleRecords.map((rec, idx) => {
        if (surgicalFields.length > 0 && !isProceduralNode && rec.fields && typeof rec.fields === 'object') {
          const projected = [];
          const entries = Object.entries(rec.fields);
          for (const sf of surgicalFields) {
            const sfNorm = sf.toLowerCase().trim();
            const sfTokens = normalizeFieldTokens(sf);
            let match = entries.find(
              ([fk]) =>
                fk.toLowerCase().trim() === sfNorm ||
                fk.toLowerCase().includes(sfNorm) ||
                sfNorm.includes(fk.toLowerCase().trim()),
            );
            if (!match && sfTokens.length > 0) {
              match = entries.find(([fk]) => {
                const fkTokens = normalizeFieldTokens(fk);
                return sfTokens.some((tok) => fkTokens.includes(tok));
              });
            }
            if (match && match[1] !== undefined && match[1] !== '') {
              projected.push(`${sf}: ${match[1]}`);
            }
          }
          if (projected.length > 0) {
            return `  ${idx + 1}. [${rec.label || rec.id}] -> ${projected.join(' | ')}`;
          }
        }
        return `  ${idx + 1}. ${rec.label || rec.id}${rec.sublabel ? ` — ${rec.sublabel}` : ''}${rec.badge ? ` [${rec.badge}]` : ''}`;
      });
      previewLines.push(`📋 Registros Extraídos (${filteredRecords.length}):\n${formattedRows.join('\n')}`);
    } else {
      previewLines.push('📋 Sin registros activos que coincidan con el filtro en este nodo.');
    }

    if (cfg.inputContext || cfg.outputContext || cfg.customInstruction) {
      const ctxNotes = [
        cfg.inputContext ? `Entrada: ${cfg.inputContext}` : null,
        cfg.outputContext ? `Salida: ${cfg.outputContext}` : null,
        cfg.customInstruction ? `Instrucción: ${cfg.customInstruction}` : null,
      ]
        .filter(Boolean)
        .join(' | ');
      previewLines.push(`⚙️ Contexto del Nodo: ${ctxNotes}`);
    }

    const inputModeLabel =
      filterMode === 'critical_only'
        ? 'Solo registros críticos/en brecha'
        : filterMode === 'selected'
          ? `Registros seleccionados (${selectedRecordIds.length})`
          : 'Todos los registros de la empresa activa';
    const inputSummaryText = `${inputModeLabel}${surgicalFields.length > 0 ? ` · ${surgicalFields.length} campo(s) quirúrgico(s)` : ''}`;

    const stepItem = {
      stepIndex: ++stepCounter,
      nodeKey,
      nodeId,
      category,
      title: customTitle || liveData?.moduleTitle || nodeId,
      status: 'completed',
      durationMs: Math.max(1, Date.now() - t0),
      recordsCount: filteredRecords.length,
      surgicalFields,
      inputSummary: inputSummaryText,
      inputContext: inputSummaryText,
      outputPreview: previewLines.join('\n'),
    };
    nodeTrace.push(stepItem);
    console.log(`[Sandbox Play] ▶ Paso #${stepItem.stepIndex} completado (${stepItem.nodeKey}): ${stepItem.title}`);
    await emitProgress({
      type: 'step_done',
      nodeKey,
      nodeId,
      step: stepItem,
    });
    return stepItem;
  };

  // Variables de estado de la ejecución paso a paso
  const agentOutputs = [];
  let finalResponse = '';
  let previousAgentResponse = '';
  let effectiveUserPrompt = typeof prompt === 'string' ? prompt.trim() : '';
  let ifEvaluation = {
    enabled: connectedNodeKeys.has('if_condition'),
    branchTaken: 'SI',
    reason: 'Flujo directo hacia los nodos conectados.',
  };

  const extraAgentsList = Array.isArray(wf?.canvasLayout?.extraAgents)
    ? wf.canvasLayout.extraAgents.filter(Boolean)
    : [];

  // ═══════════════════════════════════════════════════════════════════════════
  // PASO B — Ejecución Estricta UNO A UNO siguiendo `executionPlan`
  // ═══════════════════════════════════════════════════════════════════════════
  for (let planIdx = 0; planIdx < executionPlan.length; planIdx++) {
    const planStep = executionPlan[planIdx];
    const { nodeKey, nodeId, category, title: stepCustomTitle } = planStep;

    // 1. NODO DISPARADOR (Trigger)
    if (category === 'trigger') {
      await emitProgress({
        type: 'step_start',
        nodeKey,
        nodeId,
        category: 'trigger',
      });
      const t0 = Date.now();
      const cfg = resolveNodeConfig(nodeKey, nodeId);
      const surgicalFields = (
        Array.isArray(cfg.selectedFields)
          ? cfg.selectedFields
          : Array.isArray(cfg.fields)
            ? cfg.fields
            : []
      ).filter(Boolean);

      let liveData = null;
      try {
        liveData = await inspectNodeLiveData({
          userId: userIdStr,
          companyId: targetCompanyIdStr,
          nodeId,
        });
      } catch (_) {}
      await pauseStep(240);

      const kpiLine = Array.isArray(liveData?.kpis)
        ? liveData.kpis.map((k) => `${k.label}: ${k.value}`).join(' · ')
        : '';
      const hasMockInput = Boolean(mockTriggerInput && String(mockTriggerInput).trim());
      const inputSummaryText = hasMockInput
        ? `Caso simulado en Escenario de Desarrollo: "${String(mockTriggerInput).trim().slice(0, 180)}"`
        : `Disparo de prueba en Escenario de Desarrollo (${scheduleType}) para "${companyName}"`;

      const trigStep = {
        stepIndex: ++stepCounter,
        nodeKey,
        nodeId,
        category: 'trigger',
        title: stepCustomTitle || liveData?.moduleTitle || `⚡ Disparador (${nodeId})`,
        status: 'completed',
        durationMs: Math.max(1, Date.now() - t0),
        recordsCount: Array.isArray(liveData?.records) ? liveData.records.length : 1,
        surgicalFields,
        inputSummary: inputSummaryText,
        inputContext: inputSummaryText,
        outputPreview:
          [
            hasMockInput ? `🧪 [EVENTO SIMULADO]: ${String(mockTriggerInput).trim()}` : null,
            kpiLine ? `📊 Estado del Disparador: ${kpiLine}` : null,
            cfg.customInstruction ? `📌 Instrucción: ${cfg.customInstruction}` : null,
          ]
            .filter(Boolean)
            .join('\n') || `Disparador ${nodeId} activado en modo simulación.`,
      };
      nodeTrace.push(trigStep);
      console.log(`[Sandbox Play] ▶ Paso #${trigStep.stepIndex} completado (${nodeKey}): ${trigStep.title}`);
      await emitProgress({
        type: 'step_done',
        nodeKey,
        nodeId,
        step: trigStep,
      });
      continue;
    }

    // 2. NODO MOTOR / MODELO IA (sub_model)
    if (category === 'model' || nodeKey === 'sub_model') {
      await emitProgress({
        type: 'step_start',
        nodeKey,
        nodeId: effectiveAiModel,
        category: 'model',
      });
      await pauseStep(180);
      const modelStep = {
        stepIndex: ++stepCounter,
        nodeKey,
        nodeId: effectiveAiModel,
        category: 'model',
        title: stepCustomTitle || `🧠 Motor IA Activo (${effectiveAiModel})`,
        status: 'completed',
        durationMs: 15,
        recordsCount: 1,
        surgicalFields: [],
        inputSummary: `Motor: ${selectedAiEngine} · Modelo: ${effectiveAiModel}`,
        inputContext: `Motor: ${selectedAiEngine} · Modelo: ${effectiveAiModel}`,
        outputPreview: `Motor IA "${effectiveAiModel}" preparado con rotación de claves WAPPY.`,
      };
      nodeTrace.push(modelStep);
      console.log(`[Sandbox Play] ▶ Paso #${modelStep.stepIndex} completado (${nodeKey}): ${modelStep.title}`);
      await emitProgress({
        type: 'step_done',
        nodeKey,
        nodeId: effectiveAiModel,
        step: modelStep,
      });
      continue;
    }

    // 3. NODOS DE DATOS CONECTADOS (Extractor, Memoria, Herramienta, Hito SST)
    if (
      category === 'extractor' ||
      category === 'memory' ||
      category === 'tool' ||
      category === 'hito'
    ) {
      await executeDataStep({
        nodeKey,
        nodeId,
        category,
        customTitle: stepCustomTitle,
      });
      continue;
    }

    // 4. NODOS PERSONALIZADOS / LÓGICOS (custom_node, logic)
    if (category === 'custom_node' || category === 'logic') {
      await emitProgress({
        type: 'step_start',
        nodeKey,
        nodeId,
        category,
      });
      await pauseStep(200);
      const cn =
        configuredCustomNodes.find((c, i) => (c.key || c.id || `custom_${i + 1}`) === nodeKey) || {};
      const cnCfg = resolveNodeConfig(nodeKey, nodeId);
      const details = [
        cn.content || cn.subtitle || cnCfg.customInstruction || '',
        cn.targetUrl || cnCfg.targetUrl ? `🌐 URL: ${cn.targetUrl || cnCfg.targetUrl}` : '',
        cn.scriptEngine || cnCfg.scriptEngine ? `⚙️ Motor: ${cn.scriptEngine || cnCfg.scriptEngine}` : '',
        cn.scriptCode || cnCfg.scriptCode
          ? `💻 Script: ${String(cn.scriptCode || cnCfg.scriptCode).slice(0, 260)}`
          : '',
        cnCfg.skillContent ? `📘 Skill: ${String(cnCfg.skillContent).slice(0, 260)}` : '',
        cnCfg.ruleText ? `🛡️ Regla: ${String(cnCfg.ruleText).slice(0, 260)}` : '',
      ]
        .filter(Boolean)
        .join('\n');

      const cnStep = {
        stepIndex: ++stepCounter,
        nodeKey,
        nodeId: cn.nodeType || nodeId || nodeKey,
        category,
        title: stepCustomTitle || `${cn.title || 'Nodo de Proceso'} (${cn.nodeType || category})`,
        status: 'completed',
        durationMs: 25,
        recordsCount: 1,
        surgicalFields: [],
        inputSummary: `Paso conectado en posición #${stepCounter}`,
        inputContext: `Paso conectado en posición #${stepCounter}`,
        outputPreview:
          details ||
          `Paso "${stepCustomTitle || nodeKey}" ejecutado dentro de la secuencia conectada (${totalExtractedRecords} registros acumulados).`,
      };
      nodeTrace.push(cnStep);
      console.log(`[Sandbox Play] ▶ Paso #${cnStep.stepIndex} completado (${nodeKey}): ${cnStep.title}`);
      await emitProgress({
        type: 'step_done',
        nodeKey,
        nodeId: cnStep.nodeId,
        step: cnStep,
      });
      continue;
    }

    // 5. NODO CONDICIÓN SI/NO (if_condition)
    if (category === 'condition' || nodeKey === 'if_condition') {
      await emitProgress({
        type: 'step_start',
        nodeKey,
        nodeId: 'if_condition',
        category: 'condition',
      });
      await pauseStep(220);
      const mockLower = String(mockTriggerInput || '').toLowerCase();
      const respLower = String(previousAgentResponse || finalResponse || '').toLowerCase();
      const explicitNoInMock =
        /sin novedad|sin hallazgo|no hay archivo|0 alerta|todo al d[ií]a|ning[uú]n vencimiento|rama no/i.test(
          mockLower,
        );
      const explicitNoInResp =
        !mockLower &&
        totalCriticalRecords === 0 &&
        /no existen archivos nuevos|sin novedades detectadas|no se encontraron hallazgos|0 hallazgos cr[ií]ticos/i.test(
          respLower,
        );

      if (explicitNoInMock || explicitNoInResp) {
        ifEvaluation = {
          enabled: true,
          branchTaken: 'NO',
          reason: explicitNoInMock
            ? 'El evento simulado en el Escenario de Desarrollo indica ausencia de novedades/hallazgos críticos -> Se activa la Rama NO.'
            : 'El análisis determinó que no existen brechas críticas ni archivos pendientes por escalar -> Se activa la Rama NO.',
        };
      } else {
        ifEvaluation = {
          enabled: true,
          branchTaken: 'SI',
          reason: `Se validaron ${totalExtractedRecords} registro(s) en los pasos conectados previos (${totalCriticalRecords} críticos/en brecha) -> Se activa la Rama SÍ hacia los siguientes nodos del flujo.`,
        };
      }

      const ifCfg = resolveNodeConfig(nodeKey, 'if_condition');
      const condStep = {
        stepIndex: ++stepCounter,
        nodeKey,
        nodeId: 'if_condition',
        category: 'condition',
        title: stepCustomTitle || `🔀 Condición Si/No (Rama Evaluada: ${ifEvaluation.branchTaken})`,
        status: 'completed',
        durationMs: 18,
        recordsCount: totalExtractedRecords,
        surgicalFields: [],
        inputSummary:
          ifCfg.customInstruction ||
          `Evaluación en Paso #${stepCounter} sobre ${nodeTrace.length} paso(s) previos conectados`,
        inputContext:
          ifCfg.customInstruction ||
          `Evaluación en Paso #${stepCounter} sobre ${nodeTrace.length} paso(s) previos conectados`,
        outputPreview: `✅ Rama tomada: [${ifEvaluation.branchTaken}] — ${ifEvaluation.reason}`,
      };
      nodeTrace.push(condStep);
      console.log(`[Sandbox Play] ▶ Paso #${condStep.stepIndex} completado (${nodeKey}): ${condStep.title}`);
      await emitProgress({
        type: 'step_done',
        nodeKey,
        nodeId: 'if_condition',
        step: condStep,
      });
      continue;
    }

    // 6. NODO AGENTE IA (agent_root o extra_agent_N)
    if (category === 'agent') {
      await emitProgress({
        type: 'step_start',
        nodeKey,
        nodeId,
        category: 'agent',
      });

      const isPrimaryAgent = nodeKey === 'agent_root';
      const eaObj = !isPrimaryAgent
        ? extraAgentsList.find((ea, idx) => (ea.key || `extra_agent_${idx + 1}`) === nodeKey) || {}
        : null;

      const currentAgentName = isPrimaryAgent
        ? agent?.name || agentName || 'Tenshi (Avatar 3D)'
        : eaObj?.agentName || stepCustomTitle || 'Sub-Agente Especialista';
      const currentAgentRole = isPrimaryAgent
        ? 'Agente IA Principal'
        : eaObj?.roleLabel || 'Sub-Agente Especialista';
      const currentAgentModel =
        !isPrimaryAgent && allowedTextModels.includes(eaObj?.model) ? eaObj.model : effectiveAiModel;

      // Construir el contexto ESTRICTAMENTE con los nodos que YA se ejecutaron antes de este Agente en el flujo conectado
      const upstreamSteps = nodeTrace.slice();
      const downstreamSteps = executionPlan.slice(planIdx + 1);

      const flowSequenceFormatted = executionPlan
        .map(
          (s, idx) =>
            `  Paso #${idx + 1}: [${s.category.toUpperCase()}] ${s.title || s.nodeId}${idx === planIdx ? '  <-- (EJECUTANDO AHORA ESTE AGENTE)' : idx < planIdx ? ' (✓ EJECUTADO ANTES)' : ' (→ SIGUIENTE EN EL FLUJO)'}`,
        )
        .join('\n');

      const upstreamDataFormatted =
        upstreamSteps.length > 0
          ? upstreamSteps
              .map(
                (st) =>
                  `### 🔹 Paso #${st.stepIndex}: ${st.title} (\`${st.category}\`)\n` +
                  `- Resumen de Entrada: ${st.inputSummary}\n` +
                  `- Datos / Resultados Entregados al Flujo:\n${st.outputPreview}`,
              )
              .join('\n\n')
          : 'Este Agente IA se encuentra al inicio del flujo sin extractores previos.';

      let companyProfileMemoryBlock = '';
      if (connectedNodeIds.has('wappy_memory_company') && automationCompany) {
        companyProfileMemoryBlock =
          `- [MEMORIA DE EMPRESA CONECTADA (wappy_memory_company)]: Razón Social: "${automationCompany.companyName}" | NIT: ${automationCompany.nit || 'N/A'} | Actividad Económica: ${automationCompany.economicActivity || 'N/A'} (CIIU: ${automationCompany.ciiuCode || automationCompany.ciiu || 'N/A'}) | Nivel de Riesgo ARL: ${automationCompany.riskLevel || 'N/A'} | ARL: ${automationCompany.arl || 'N/A'} | N.º Trabajadores: ${automationCompany.employeeCount ?? automationCompany.workerCount ?? 'N/A'}\n`;
      }

      const agentCfg = resolveNodeConfig(nodeKey, nodeId);
      const customNodePrompt =
        (!isPrimaryAgent && eaObj?.prompt ? String(eaObj.prompt).trim() : '') ||
        (agentCfg?.customInstruction ? String(agentCfg.customInstruction).trim() : '');

      // Si el flujo cambió (nodos desconectados o reordenados), el prompt debe reflejar OBLIGATORIAMENTE los pasos reales conectados
      const connectedDataTitles = upstreamSteps
        .filter((s) => s.category !== 'model')
        .map((s) => s.title)
        .join(' ➔ ');
      const downstreamTitles = downstreamSteps.map((s) => s.title || s.nodeId).join(' ➔ ');

      const cleanMockInput = mockTriggerInput ? String(mockTriggerInput).trim() : '';

      const dynamicFlowDirective =
        `[ORDEN CONSECUTIVO OBLIGATORIO DEL FLUJO CONECTADO EN EL LIENZO (${executionPlan.length} PASOS ACTIVOS)]\n` +
        `${flowSequenceFormatted}\n\n` +
        `[REGLA INQUEBRANTABLE DE EJECUCIÓN CONSECUTIVA]:\n` +
        `1. Responde y analiza ÚNICAMENTE con base en los nodos que están CONECTADOS y que se han ejecutado hasta este punto (${connectedDataTitles || 'Disparador inicial'}).\n` +
        `2. PROHIBIDO inventar o mencionar datos de nodos que NO estén en la lista de pasos conectados de arriba (si un nodo como Extraer Trabajadores, Hito o Correo fue desconectado del flujo, NO lo menciones ni lo incluyas).\n` +
        `3. Estructura tu respuesta siguiendo el orden exacto de los pasos conectados de este flujo y preparando la salida para los pasos siguientes (${downstreamTitles || 'Cierre del flujo'}).\n\n`;

      const baseInstructionForAgent =
        customNodePrompt ||
        (cleanMockInput
          ? `RESPONDE DIRECTAMENTE A ESTA ENTRADA / SOLICITUD DEL DISPARADOR: "${cleanMockInput}"\n` +
            (effectiveUserPrompt ? `Contexto adicional de la tarea: ${effectiveUserPrompt}\n` : '') +
            `Cruza los datos reales extraídos en los pasos previos conectados (${connectedDataTitles || 'Disparador'}) para dar una respuesta exacta, completa y accionable a la entrada recibida.`
          : effectiveUserPrompt
            ? `${effectiveUserPrompt}\n\n(NOTA CRÍTICA: Ajusta este análisis estrictamente a los nodos actualmente conectados en la secuencia: ${connectedDataTitles || 'Disparador'} ➔ ${currentAgentName} ➔ ${downstreamTitles || 'Salida'}).`
            : `Ejecuta el análisis del flujo para "${companyName}" siguiendo estrictamente el orden consecutivo de los pasos conectados (${connectedDataTitles || 'Disparador'} ➔ ${downstreamTitles || 'Salida'}).`);

      const fullAgentPrompt =
        `[CONTEXTO DE EMPRESA ACTIVA]: "${companyName}" (NIT: ${automationCompany?.nit || 'N/A'})\n` +
        companyProfileMemoryBlock +
        (cleanMockInput
          ? `\n🚨 [ENTRADA / SOLICITUD EN VIVO RECIBIDA EN EL DISPARADOR — PRIORIDAD #1 A RESPONDER]:\n"""\n${cleanMockInput}\n"""\n`
          : '') +
        `\n${dynamicFlowDirective}` +
        `[DATOS REALES EXTRAÍDOS EN LOS PASOS PREVIOS CONECTADOS (#1 AL #${upstreamSteps.length})]:\n` +
        `${upstreamDataFormatted}\n\n` +
        (previousAgentResponse
          ? `[DICTAMEN DEL AGENTE ANTERIOR EN LA CADENA]:\n"""\n${previousAgentResponse}\n"""\n\n`
          : '') +
        `[INSTRUCCIÓN PARA ${currentAgentName.toUpperCase()} (${currentAgentRole}) EN EL PASO #${stepCounter + 1}]:\n` +
        `${baseInstructionForAgent}\n\n` +
        `Entrega una respuesta ejecutiva en Markdown clara, concisa y estructurada que RESPONDA DIRECTAMENTE a la entrada recibida usando fielmente el orden y los datos extraídos en los pasos conectados de este flujo.`;

      if (isPrimaryAgent) {
        effectiveUserPrompt = baseInstructionForAgent;
      }

      const agentExec = await executeSandboxAgentCall({
        reqUser,
        targetCompanyIdStr,
        agentDoc: {
          ...agent,
          name: currentAgentName,
          model: currentAgentModel,
        },
        fullPrompt: fullAgentPrompt,
        timeoutMs: 60000,
      });

      let agentResponseText = agentExec.text;
      if (!agentResponseText) {
        const traceSummaryRows = upstreamSteps
          .map(
            (n) =>
              `| **Paso #${n.stepIndex}: ${n.title}** | \`${n.category.toUpperCase()}\` | ${n.recordsCount} reg. | ${n.surgicalFields.length > 0 ? n.surgicalFields.join(', ') : ' Completo '} |`,
          )
          .join('\n');
        agentResponseText =
          `### 🧪 Dictamen Ejecutivo del Flujo Conectado (${currentAgentName}) — ${companyName}\n\n` +
          `> **Secuencia Conectada Ejecutada:** ${connectedDataTitles || 'Disparador'} ➔ **${currentAgentName}** ➔ ${downstreamTitles || 'Fin'}\n\n` +
          `| Paso Consecutivo | Categoría | Registros en Vivo | Filtro Quirúrgico |\n` +
          `| :--- | :---: | :---: | :--- |\n` +
          `${traceSummaryRows}\n\n` +
          upstreamSteps
            .map((n) => `#### 🔹 Paso #${n.stepIndex}: ${n.title}\n${n.outputPreview}`)
            .join('\n\n');
      }

      agentOutputs.push({
        agentKey: nodeKey,
        agentName: currentAgentName,
        roleLabel: currentAgentRole,
        model: currentAgentModel,
        avatarSrc:
          (!isPrimaryAgent && eaObj?.avatarSrc) ||
          nodeConfigs?.[nodeKey]?.avatarSrc ||
          '/assets/tenshi.png',
        promptUsed: baseInstructionForAgent,
        responseText: agentResponseText,
        durationMs: agentExec.durationMs,
      });

      const agentStepItem = {
        stepIndex: ++stepCounter,
        nodeKey,
        nodeId: nodeId || nodeKey,
        category: 'agent',
        title: stepCustomTitle || `🤖 ${currentAgentRole}: ${currentAgentName} (${currentAgentModel})`,
        status: 'completed',
        durationMs: agentExec.durationMs,
        recordsCount: 1,
        surgicalFields: [],
        inputSummary: `Recibió ${upstreamSteps.length} paso(s) conectados previos (${totalExtractedRecords} reg.)`,
        inputContext: `Recibió ${upstreamSteps.length} paso(s) conectados previos (${totalExtractedRecords} reg.)`,
        outputPreview: agentResponseText.slice(0, 1200),
      };
      nodeTrace.push(agentStepItem);
      console.log(
        `[Sandbox Play] ▶ Paso #${agentStepItem.stepIndex} completado (${nodeKey}): ${agentStepItem.title} (${agentExec.durationMs}ms)`,
      );
      await emitProgress({
        type: 'step_done',
        nodeKey,
        nodeId: agentStepItem.nodeId,
        step: agentStepItem,
      });

      previousAgentResponse = agentResponseText;
      finalResponse =
        agentOutputs.length > 1
          ? agentOutputs
              .map(
                (ao, idx) =>
                  `### 🤖 Paso Agente #${idx + 1} (${ao.roleLabel} — ${ao.agentName}):\n\n${ao.responseText}`,
              )
              .join('\n\n---\n\n')
          : agentResponseText;
      continue;
    }

    // 7. NODO DE SALIDA / BITÁCORA (output — Bloqueado en Modo Sandbox)
    if (category === 'output') {
      await emitProgress({
        type: 'step_start',
        nodeKey,
        nodeId,
        category: 'output',
      });
      await pauseStep(200);
      const outCfg = resolveNodeConfig(nodeKey, nodeId);
      const outStep = {
        stepIndex: ++stepCounter,
        nodeKey,
        nodeId,
        category: 'output',
        title: `${stepCustomTitle || outputTitleMap[nodeId] || `Salida: ${nodeId}`} (Simulado — No Enviado)`,
        status: 'simulated_blocked',
        durationMs: 12,
        recordsCount: 0,
        surgicalFields: [],
        inputSummary:
          outCfg.customInstruction ||
          `Informe final (${(finalResponse || '').length} caracteres) listo en Paso #${stepCounter}`,
        inputContext:
          outCfg.customInstruction ||
          `Informe final (${(finalResponse || '').length} caracteres) listo en Paso #${stepCounter}`,
        outputPreview:
          `🛑 [VISTA PREVIA EN ESCENARIO DE DESARROLLO — NO ENVIADO]: ` +
          `La salida "${stepCustomTitle || outputTitleMap[nodeId] || nodeId}" recibió el resultado del paso anterior correctamente, pero su envío externo fue bloqueado por estar en modo prueba (dryRun: true).`,
      };
      nodeTrace.push(outStep);
      console.log(`[Sandbox Play] ▶ Paso #${outStep.stepIndex} simulado (${nodeKey}): ${outStep.title}`);
      await emitProgress({
        type: 'step_done',
        nodeKey,
        nodeId,
        step: outStep,
      });
      continue;
    }
  }

  // Si el flujo conectado no incluyó ningún nodo Agente IA, sintetizar la respuesta desde los pasos conectados ejecutados
  if (!finalResponse) {
    finalResponse =
      `### 🧪 Resultado de Ejecución Consecutiva (${nodeTrace.length} Pasos Conectados) — ${companyName}\n\n` +
      nodeTrace
        .map((n) => `#### 🔹 Paso #${n.stepIndex}: ${n.title}\n${n.outputPreview}`)
        .join('\n\n');
  }

  const validEmails = (Array.isArray(emails) && emails.length > 0 ? emails : reqUser?.email ? [reqUser.email] : [])
    .map((e) => (typeof e === 'string' ? e.trim() : ''))
    .filter((e) => e.includes('@'));

  const shortSummary = finalResponse
    .replace(/[#*_`]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 260);

  const connectedOutputsList = executionPlan
    .filter((s) => s.category === 'output')
    .map((s) => s.nodeId);
  const connectedHitosList = executionPlan
    .filter((s) => s.category === 'hito')
    .map((s) => s.nodeId);

  const simulatedOutputs = {
    emailPreview: {
      enabled: connectedOutputsList.includes('email_report'),
      blocked: true,
      recipients: validEmails,
      subject: `📊 [VISTA PREVIA DESARROLLO] Reporte Automático SGSST: ${flowName} - ${companyName}`,
      htmlBody: formatMarkdownToEmailHtml(finalResponse),
    },
    wappyNotificationPreview: {
      enabled: connectedOutputsList.includes('wappy_notification'),
      blocked: true,
      title: `✅ Bitácora Completada: ${flowName} (${companyName})`,
      body: shortSummary,
      tenshiChatPreview: `🤖 **Automatización Ejecutada: ${flowName} (${companyName})**\n\n${finalResponse.substring(0, 900)}`,
    },
    hitoAndAcpmPreview: {
      enabled:
        connectedOutputsList.includes('acpm_task') ||
        connectedOutputsList.includes('canvas_doc') ||
        connectedOutputsList.includes('somos_sst_update') ||
        connectedHitosList.length > 0,
      blocked: true,
      targetHitos: connectedHitosList,
      targetOutputs: connectedOutputsList,
      acpmTaskTitle: `[ACPM Automatización] ${flowName} — ${companyName}`,
      liveDocTitle: `📄 Informe Automatizado: ${flowName} (${companyName})`,
      summary: `En ejecución real se actualizarían únicamente los hitos conectados [${connectedHitosList.join(', ') || 'ninguno'}] y salidas conectadas [${connectedOutputsList.join(', ') || 'ninguna'}]. En Modo Desarrollo no se modificó ningún registro.`,
    },
  };

  return {
    success: true,
    dryRun: true,
    sandboxMode: true,
    executedAt: new Date().toISOString(),
    durationMs: Math.max(1, Date.now() - simStartTime),
    companyId: targetCompanyIdStr,
    companyName,
    flowName,
    aiEngine: selectedAiEngine,
    aiModel: effectiveAiModel,
    mockTriggerInput: mockTriggerInput ? String(mockTriggerInput).trim() : '',
    promptUsed: effectiveUserPrompt,
    finalResponse,
    finalResponseHtml: formatMarkdownToEmailHtml(finalResponse),
    nodeTrace,
    agentOutputs,
    ifEvaluation,
    simulatedOutputs,
    stats: {
      totalSteps: nodeTrace.length,
      completedSteps: nodeTrace.filter((n) => n.status === 'completed').length,
      blockedOutputSteps: nodeTrace.filter((n) => n.status === 'simulated_blocked').length,
      totalRecordsInspected: totalExtractedRecords,
      totalCriticalRecords,
      agentsExecuted: agentOutputs.length,
    },
  };
}

module.exports = {
  startAutomationScheduler,
  stopAutomationScheduler,
  runAutomation,
  runWorkflowSandboxSimulation,
  formatMarkdownToEmailHtml,
  calculateNextRun,
  stopAutomation,
};

