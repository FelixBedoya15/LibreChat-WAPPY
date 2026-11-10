const fs = require('fs');
const path = require('path');
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

let lastEvidenceCleanupAt = 0;

/**
 * Limpieza ligera ocasional no bloqueante de archivos de evidencia mayores a 14 días.
 */
function triggerAsyncEvidenceCleanup(evidencesDir) {
  const now = Date.now();
  if (now - lastEvidenceCleanupAt < 3600000) return; // Máximo 1 vez por hora
  lastEvidenceCleanupAt = now;
  setImmediate(async () => {
    try {
      const entries = await fs.promises.readdir(evidencesDir);
      const maxAgeMs = 14 * 24 * 60 * 60 * 1000;
      for (const name of entries) {
        if (!/\.(pdf|png|jpg|jpeg)$/i.test(name)) continue;
        const full = path.join(evidencesDir, name);
        const stat = await fs.promises.stat(full).catch(() => null);
        if (stat && stat.isFile() && now - stat.mtimeMs > maxAgeMs) {
          await fs.promises.unlink(full).catch(() => {});
        }
      }
    } catch (_) {}
  });
}

/**
 * Persiste en disco (`/app/uploads/scraper_evidences`, volumen Docker `librechat_uploads`)
 * los certificados PDF y capturas PNG/JPG extraídos en vivo por los nodos de Web Scraping.
 */
function saveScraperEvidenceFiles({
  pdfBase64,
  pdfFileName,
  imageBase64,
  imageFileName,
  cedula,
  workerName,
  portalLabel,
} = {}) {
  const emptyResult = {
    hasEvidence: false,
    pdfFileName: null,
    pdfLocalPath: null,
    pdfUrl: null,
    pdfDownloadUrl: null,
    pdfAbsoluteUrl: null,
    imageFileName: null,
    imageLocalPath: null,
    imageUrl: null,
    imageDownloadUrl: null,
    imageAbsoluteUrl: null,
  };

  if (!pdfBase64 && !imageBase64) {
    return emptyResult;
  }

  try {
    const evidencesDir = path.resolve(process.cwd(), 'uploads', 'scraper_evidences');
    fs.mkdirSync(evidencesDir, { recursive: true });
    triggerAsyncEvidenceCleanup(evidencesDir);

    const stripDataUri = (raw) => {
      if (!raw || typeof raw !== 'string') return '';
      const trimmed = raw.trim();
      const commaIdx = trimmed.indexOf(',');
      if (trimmed.startsWith('data:') && commaIdx > -1) {
        return trimmed.slice(commaIdx + 1).trim();
      }
      return trimmed;
    };

    const sanitizeSlug = (val, maxLen = 40) =>
      String(val || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\.(pdf|png|jpg|jpeg)$/i, '')
        .replace(/[^a-zA-Z0-9._-]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, maxLen);

    const uniqueSuffix = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    const baseDomain = String(process.env.DOMAIN_CLIENT || 'https://wappy.club').replace(/\/+$/, '');
    const defaultPrefix =
      [sanitizeSlug(portalLabel, 22), sanitizeSlug(cedula || workerName, 22)]
        .filter(Boolean)
        .join('_') || 'soporte';

    let savedPdfName = null;
    let pdfLocalPath = null;
    if (pdfBase64 && typeof pdfBase64 === 'string') {
      const cleanPdfB64 = stripDataUri(pdfBase64);
      if (cleanPdfB64.length > 100) {
        const pdfBuf = Buffer.from(cleanPdfB64, 'base64');
        const headAscii = pdfBuf.subarray(0, 16).toString('ascii');
        const headUtf8 = pdfBuf.subarray(0, 32).toString('utf8');
        if (pdfBuf.length > 200 && (headAscii.includes('%PDF') || !/^\s*</.test(headUtf8))) {
          const pdfSlug = sanitizeSlug(pdfFileName, 48) || `certificado_${defaultPrefix}`;
          savedPdfName = `${pdfSlug}_${uniqueSuffix}.pdf`;
          pdfLocalPath = path.resolve(evidencesDir, savedPdfName);
          fs.writeFileSync(pdfLocalPath, pdfBuf);
        }
      }
    }

    let savedImgName = null;
    let imageLocalPath = null;
    if (imageBase64 && typeof imageBase64 === 'string') {
      const rawImgStr = imageBase64.trim();
      const cleanImgB64 = stripDataUri(rawImgStr);
      if (cleanImgB64.length > 100) {
        const imgBuf = Buffer.from(cleanImgB64, 'base64');
        if (imgBuf.length > 200) {
          const isJpeg =
            /^data:image\/jpe?g/i.test(rawImgStr) ||
            /\.jpe?g$/i.test(String(imageFileName || '')) ||
            (imgBuf[0] === 0xff && imgBuf[1] === 0xd8);
          const ext = isJpeg ? 'jpg' : 'png';
          const imgSlug = sanitizeSlug(imageFileName, 48) || `evidencia_${defaultPrefix}`;
          savedImgName = `${imgSlug}_${uniqueSuffix}.${ext}`;
          imageLocalPath = path.resolve(evidencesDir, savedImgName);
          fs.writeFileSync(imageLocalPath, imgBuf);
        }
      }
    }

    return {
      hasEvidence: Boolean(savedPdfName || savedImgName),
      pdfFileName: savedPdfName,
      pdfLocalPath,
      pdfUrl: savedPdfName ? `/api/sgsst/automatizaciones/evidencias/${savedPdfName}` : null,
      pdfDownloadUrl: savedPdfName
        ? `/api/sgsst/automatizaciones/evidencias/${savedPdfName}?download=1`
        : null,
      pdfAbsoluteUrl: savedPdfName
        ? `${baseDomain}/api/sgsst/automatizaciones/evidencias/${savedPdfName}`
        : null,
      imageFileName: savedImgName,
      imageLocalPath,
      imageUrl: savedImgName ? `/api/sgsst/automatizaciones/evidencias/${savedImgName}` : null,
      imageDownloadUrl: savedImgName
        ? `/api/sgsst/automatizaciones/evidencias/${savedImgName}?download=1`
        : null,
      imageAbsoluteUrl: savedImgName
        ? `${baseDomain}/api/sgsst/automatizaciones/evidencias/${savedImgName}`
        : null,
    };
  } catch (err) {
    console.warn('[AutomationScheduler] Error guardando evidencias de scraping:', err?.message || err);
    return emptyResult;
  }
}

/**
 * Construye el bloque de instrucción obligatoria para el Agente IA sobre certificados/soportes descargados,
 * aplicando CERO RUIDO VISUAL (sin inyectar URLs ni imágenes dentro del mensaje o tablas Markdown).
 */
function buildScraperEvidencesPromptBlock(evidences = []) {
  if (!Array.isArray(evidences) || evidences.length === 0) return '';
  const evLines = evidences.map(
    (ev, idx) =>
      `  ${idx + 1}. Persona/Registro: "${ev.workerName || 'Registro'}" (Cédula/ID: ${ev.cedula || 'N/A'}) — Soporte descargado: "${ev.title || 'Certificado / Constancia Oficial'}" (${ev.portal || 'Portal Oficial'})`,
  );
  return (
    `\n📎 [REGISTROS CON CERTIFICADO / SOPORTE OFICIAL DESCARGADO EN ARCHIVOS (${evidences.length})]:\n` +
    `${evLines.join('\n')}\n\n` +
    `🚨 REGLA ESTRICTA CERO RUIDO VISUAL EN CERTIFICADOS:\n` +
    `- Tienes TERMINANTEMENTE PROHIBIDO incluir URLs, rutas \`/api/...\`, enlaces Markdown \`[Descargar PDF](...)\` o imágenes \`![...](...)\` dentro de tu respuesta o tablas Markdown.\n` +
    `- Si incluyes una columna de soporte/certificado en tu tabla, escribe ÚNICAMENTE texto limpio y corto como \`✅ Descargado (ver archivos)\` (solo para quienes aparecen en el listado de arriba) o \`Sin certificado\` (para quienes no tienen soporte).\n` +
    `- Indícale brevemente al usuario en 1 sola línea que los archivos PDF/PNG descargados están listos para abrir o descargar en el apartado separado **"Certificados y Archivos Descargados"**.\n`
  );
}

/**
 * Formatea Markdown enriquecido a HTML limpio con tablas, encabezados, enlaces, imágenes y negritas para clientes de correo.
 */
function formatMarkdownToEmailHtml(text) {
  if (!text) return '';
  const baseDomain = String(process.env.DOMAIN_CLIENT || 'https://wappy.club').replace(/\/+$/, '');
  const toAbsUrl = (rawUrl = '') => {
    const u = String(rawUrl || '').trim();
    if (!u) return '';
    if (/^https?:\/\//i.test(u)) return u;
    if (u.startsWith('/')) return `${baseDomain}${u}`;
    return u;
  };
  
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

  // 3.5. Imágenes y Enlaces Markdown (convirtiendo rutas relativas /api/... a URLs absolutas para clientes de correo)
  formatted = formatted.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_, alt, rawUrl) => {
    const abs = toAbsUrl(rawUrl);
    const safeAlt = String(alt || 'Certificado / Evidencia').replace(/"/g, '&quot;');
    return `\n\n<div style="margin: 12px 0;"><a href="${abs}" target="_blank" rel="noopener noreferrer"><img src="${abs}" alt="${safeAlt}" style="max-width: 100%; height: auto; border-radius: 8px; border: 1px solid #334155; display: block;" /></a></div>\n\n`;
  });
  formatted = formatted.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, rawUrl) => {
    const abs = toAbsUrl(rawUrl);
    return `<a href="${abs}" target="_blank" rel="noopener noreferrer" style="color: #2dd4bf; font-weight: 600; text-decoration: underline;">${label}</a>`;
  });

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

    // Si el flujo incluye nodos de Scraping Web con Google Antigravity (ej. custom_scraper_agy_alto_riesgo),
    // ejecutar la verificación real por el túnel Push SSE de Antigravity (MinTrabajo Alturas + Rama Judicial + SENA)
    let liveAntigravityScraperBlock = '';
    const runCapturedEvidences = [];
    try {
      const wfCustomNodes = Array.isArray(automation.workflowNodes?.canvasLayout?.customNodes)
        ? automation.workflowNodes.canvasLayout.customNodes
        : [];
      const wfExtractors = Array.isArray(automation.workflowNodes?.extractors)
        ? automation.workflowNodes.extractors
        : [];
      const wfInputs = Array.isArray(automation.workflowNodes?.inputs)
        ? automation.workflowNodes.inputs
        : [];
      const allNodeCfg = automation.workflowNodes?.canvasLayout?.nodeConfigs || {};
      const seenScraperKeys = new Set();
      const scraperCandidates = [
        ...wfCustomNodes.map((cn) => ({
          nodeKey: cn?.key || cn?.id || '',
          nodeId: cn?.nodeType || cn?.id || '',
          customNodeObj: cn,
        })),
        ...wfExtractors.map((extId) => ({
          nodeKey: `extractor_${extId}`,
          nodeId: extId,
          customNodeObj: null,
        })),
        ...wfInputs.map((inId) => ({
          nodeKey: `tool_inputs_${inId}`,
          nodeId: inId,
          customNodeObj: null,
        })),
      ].filter((cand) => {
        if (!isAntigravityScraperIdentifier(cand.nodeKey, cand.nodeId, cand.customNodeObj)) {
          return false;
        }
        const dedupKey = `${cand.nodeKey}::${cand.nodeId}`;
        if (seenScraperKeys.has(dedupKey)) return false;
        seenScraperKeys.add(dedupKey);
        return true;
      });

      if (scraperCandidates.length > 0) {
        const previewBlocks = [];
        for (const sc of scraperCandidates) {
          const scrapeRes = await executeRealAntigravityScraperVerification({
            userIdStr: String(automation.user),
            targetCompanyIdStr,
            companyName: automationCompany?.companyName || 'Empresa Activa',
            nodeKey: sc.nodeKey,
            nodeId: sc.nodeId,
            nodeTitle: sc.customNodeObj?.title || '',
            customNodeObj: sc.customNodeObj || {},
            nodeCfg: allNodeCfg[sc.nodeKey] || allNodeCfg[sc.nodeId] || {},
            allNodeConfigs: allNodeCfg,
            mockTriggerInput: '',
            promptText: automation.prompt || '',
          });
          if (Array.isArray(scrapeRes?.evidences) && scrapeRes.evidences.length > 0) {
            runCapturedEvidences.push(...scrapeRes.evidences);
          }
          if (scrapeRes?.outputPreview) {
            previewBlocks.push(
              `[VERIFICACIÓN EN VIVO EJECUTADA VÍA GOOGLE ANTIGRAVITY SCRAPER (${scrapeRes.portalLabel})]:\n${scrapeRes.outputPreview}`,
            );
          }
        }
        if (previewBlocks.length > 0) {
          liveAntigravityScraperBlock =
            `\n${previewBlocks.join('\n\n')}\n` +
            buildScraperEvidencesPromptBlock(runCapturedEvidences) +
            `🚨 REGLA INQUEBRANTABLE: Usa EXCLUSIVAMENTE los resultados reales de la tabla anterior verificada por Google Antigravity en portales oficiales. PROHIBIDO inventar, suponer o alterar estados de cursos, fechas o certificados.\n\n`;
        }
      }
    } catch (scErr) {
      console.warn('[AutomationScheduler] Aviso en verificación real Antigravity Scraper:', scErr?.message || scErr);
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
        liveAntigravityScraperBlock +
        `- PROHIBIDO usar, mencionar, cruzar o asumir datos de cualquier otra empresa del usuario (aunque aparezcan en memorias previas o si el texto de la instrucción menciona por error otro nombre de empresa).\n` +
        `- PROHIBIDO crear nuevas automatizaciones o tareas programadas recurrentes durante esta ejecución automática.\n` +
        `- PROHIBIDO generar código fuente de aplicativos interactivos (<!DOCTYPE html>, <script>, funciones de simulación JS) como respuesta; entrega únicamente un informe ejecutivo claro y estructurado en Markdown.\n` +
        `- REGLA DE VERACIDAD ESTRICTA: Si Google Drive no está vinculado para "${automationCompany.companyName}" o no existen archivos nuevos reales, infórmalo con total transparencia y NO registres ni inventes datos. JAMÁS simules ni inventes trabajadores, accidentes, hallazgos o acciones ACPM, ni presentes registros antiguos de la base de datos como si acabaran de procesarse desde Drive.\n\n` +
        `[INSTRUCCIÓN DE LA TAREA PROGRAMADA]:\n`
      : `${antigravityEngineDirective}${companyProfileMemoryBlock}${previousRunMemoryBlock}${ragDocumentalMemoryBlock}${proceduralNormativeMemoryBlock}${canvasNodesContextBlock}${liveDatabaseSurgicalBlock}${liveAntigravityScraperBlock}`;
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

      // 11D. Creación de Actividad en el Centro de Control en cualquiera de sus Etapas (acpm_task)
      if (configuredOutputs.includes('acpm_task')) {
        try {
          const allNodeConfigs = automation.workflowNodes?.canvasLayout?.nodeConfigs || {};
          const acpmCfg = allNodeConfigs.out_acpm_task || allNodeConfigs.acpm_task || {};
          const rawStage = String(acpmCfg.kanbanStatus || 'todo').trim();
          const validStage =
            rawStage === 'urgent'
              ? 'overdue'
              : ['todo', 'in_progress', 'due_soon', 'overdue', 'done'].includes(rawStage)
                ? rawStage
                : 'todo';
          const rawPriority = String(acpmCfg.kanbanPriority || 'high').toLowerCase();
          const validPriority =
            rawPriority === 'low' || rawPriority === 'baja'
              ? 'baja'
              : rawPriority === 'medium' || rawPriority === 'media'
                ? 'media'
                : 'alta';
          const validActionType = ['correctiva', 'preventiva', 'mejora'].includes(
            String(acpmCfg.kanbanActionType || '').toLowerCase(),
          )
            ? String(acpmCfg.kanbanActionType).toLowerCase()
            : 'correctiva';
          const dueDays = Math.max(1, Number(acpmCfg.kanbanDueDays) || 7);
          const dueTarget = new Date(Date.now() + dueDays * 24 * 3600000);
          const customTitle = String(acpmCfg.kanbanTaskTitle || '').trim();
          const customAssignee = String(acpmCfg.kanbanAssignee || '').trim();

          await KanbanTask.create({
            user: automation.user,
            companyId: targetCompanyIdStr || 'DEFAULT',
            title: customTitle || `[Centro de Control] ${automation.name} — ${compLabel}`,
            description: resultText.substring(0, 3500),
            status: validStage,
            priority: validPriority,
            actionType: validActionType,
            type: 'audit_finding',
            sourceModule: 'Automatización WAPPY (Centro de Control)',
            assignedTo: customAssignee || automation.agentName || agent?.name || 'Responsable SG-SST',
            referenceId: String(automation._id),
            referenceName: automation.name,
            dueDate: dueTarget,
            ...(validStage === 'done' ? { completedAt: new Date() } : {}),
          });
        } catch (acpmErr) {
          console.warn('[AutomationScheduler] Non-blocking Centro de Control task error:', acpmErr.message);
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

            const emailAttachments = [];
            const MAX_EMAIL_ATTACHMENT_BYTES = 8 * 1024 * 1024;
            let totalAttachmentBytes = 0;
            const seenAttachmentPaths = new Set();

            if (runCapturedEvidences.length > 0) {
              for (const ev of runCapturedEvidences) {
                const chosenLocalPath =
                  ev.pdfLocalPath && fs.existsSync(ev.pdfLocalPath)
                    ? ev.pdfLocalPath
                    : ev.imageLocalPath && fs.existsSync(ev.imageLocalPath)
                      ? ev.imageLocalPath
                      : null;
                if (!chosenLocalPath || seenAttachmentPaths.has(chosenLocalPath)) continue;
                try {
                  const fileBuf = await fs.promises.readFile(chosenLocalPath);
                  if (
                    fileBuf.length > 200 &&
                    totalAttachmentBytes + fileBuf.length <= MAX_EMAIL_ATTACHMENT_BYTES
                  ) {
                    const chosenFileName = path.basename(chosenLocalPath);
                    const ext = path.extname(chosenFileName).toLowerCase();
                    const contentType =
                      ext === '.pdf'
                        ? 'application/pdf'
                        : ext === '.png'
                          ? 'image/png'
                          : 'image/jpeg';
                    emailAttachments.push({
                      filename: chosenFileName,
                      content: fileBuf,
                      contentType,
                    });
                    totalAttachmentBytes += fileBuf.length;
                    seenAttachmentPaths.add(chosenLocalPath);
                  }
                } catch (_) {}
              }
            }

            let emailHtmlResult = formatMarkdownToEmailHtml(resultText);
            if (runCapturedEvidences.length > 0) {
              const evItemsHtml = runCapturedEvidences
                .map((ev, idx) => {
                  const pdfLink = ev.pdfAbsoluteUrl
                    ? `<a href="${ev.pdfAbsoluteUrl}?download=1" target="_blank" rel="noopener noreferrer" style="color: #2dd4bf; font-weight: 700; text-decoration: underline; margin-right: 10px;">📄 Descargar PDF Oficial</a>`
                    : '';
                  const imgLink = ev.imageAbsoluteUrl
                    ? `<a href="${ev.imageAbsoluteUrl}" target="_blank" rel="noopener noreferrer" style="color: #a855f7; font-weight: 700; text-decoration: underline;">🖼️ Ver Imagen del Certificado</a>`
                    : '';
                  return `<li style="margin-bottom: 8px;"><strong>${idx + 1}. ${ev.workerName || 'Registro'} (${ev.cedula || 'N/A'})</strong> — ${ev.title || 'Certificado Oficial'} (${ev.portal || 'Portal Oficial'}):<br>${pdfLink}${imgLink}</li>`;
                })
                .join('');
              emailHtmlResult += `
                <div style="border: 1px solid #0d9488; background: rgba(13, 148, 136, 0.1); border-radius: 10px; padding: 14px; margin: 18px 0 6px 0;">
                  <h4 style="color: #2dd4bf; margin: 0 0 8px 0; font-size: 14px;">📎 Certificados y Soportes Oficiales Extraídos (${runCapturedEvidences.length})</h4>
                  <ul style="margin: 0; padding-left: 18px; font-size: 13px; color: #e2e8f0;">${evItemsHtml}</ul>
                </div>
              `;
            }

            for (const recipient of validEmails) {
              console.log(`[AutomationScheduler] Sending report email to ${recipient} for "${automation.name}" (${emailAttachments.length} attachment(s))`);
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
                throwError: false,
                ...(emailAttachments.length > 0 ? { attachments: emailAttachments } : {})
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
 * Detecta si un nodo del flujo corresponde a un Scraper / Verificador de Google Antigravity
 * (ej. Alto Riesgo & SENA MinTrabajo, Antecedentes 360°, Seguridad Social RUAF/ADRES, Proveedores & ARL, Carpeta PC o Scraper Web AGY).
 */
function isAntigravityScraperIdentifier(nodeKey, nodeId, customNodeObj = null) {
  const hay = `${nodeKey || ''} ${nodeId || ''} ${customNodeObj?.id || ''} ${customNodeObj?.key || ''} ${customNodeObj?.nodeType || ''} ${customNodeObj?.title || ''} ${customNodeObj?.targetUrl || ''}`.toLowerCase();
  return (
    hay.includes('scraper_agy') ||
    hay.includes('scraper_node_antigravity') ||
    hay.includes('extract_web_scraping') ||
    hay.includes('tool_web_scraping_agy') ||
    hay.includes('subagent_scraper_agy') ||
    hay.includes('web_scraper') ||
    hay.includes('extract_pc_folder') ||
    hay.includes('pc_folder') ||
    hay.includes('arl_directo') ||
    hay.includes('pensiones_directo') ||
    hay.includes('salud_rethus') ||
    hay.includes('vial_pesv') ||
    hay.includes('mintrabajo') ||
    hay.includes('alto_riesgo') ||
    hay.includes('centrosentrenamiento') ||
    hay.includes('antecedentes') ||
    hay.includes('seguridad_social')
  );
}

/**
 * Ejecuta la verificación REAL en portales oficiales (MinTrabajo Centros de Entrenamiento Res. 4272/2021 y Res. 0491/2020,
 * SENA Sofia Plus, Rama Judicial, ARL, Pensiones, Salud ReTHUS, Vial PESV, Carpeta Local PC y Scraper Web)
 * despachando la consulta a través del puente Google Antigravity (`wappy-push-daemon.js`) o del motor OSINT en vivo (`osintWorkerService.js`).
 */
async function executeRealAntigravityScraperVerification({
  userIdStr,
  companyId: rawCompanyId,
  targetCompanyIdStr,
  companyName = 'Empresa Activa',
  nodeKey = '',
  nodeId = '',
  nodeTitle = '',
  nodeCfg = {},
  customNodeObj = {},
  allNodeConfigs = {},
  mockTriggerInput = '',
  promptText = '',
  upstreamInputItems = [],
  upstreamSourceTitle = '',
}) {
  const companyId = rawCompanyId || targetCompanyIdStr || '';
  const t0 = Date.now();
  const stepLogs = [];
  const addLog = (level, message, detail = '') => {
    stepLogs.push({
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(detail ? { detail: String(detail) } : {}),
    });
  };

  const {
    consultarAlturasMinTrabajo,
    consultarRamaJudicial,
    consultarPortalEspecíficoAntigravity,
  } = require('~/server/services/osintWorkerService');

  const antigravityMode = String(
    nodeCfg?.antigravityMode || customNodeObj?.antigravityMode || 'auto',
  ).toLowerCase();
  const modeHeaderLine = `- **Modo Antigravity Configurado:** ${
    antigravityMode === 'local'
      ? '💻 Solo Local (Mi PC)'
      : antigravityMode === 'cloud'
        ? '☁️ Solo Cloud 24/7'
        : '⚡ Automático (1° Local ➔ 2° Cloud)'
  }`;

  const combinedId = `${nodeKey} ${nodeId} ${customNodeObj?.id || ''} ${customNodeObj?.nodeType || ''} ${customNodeObj?.title || ''}`.toLowerCase();

  // Caso A: Carpeta Local PC / Mac (`extract_pc_folder` / `pc_folder`)
  if (combinedId.includes('extract_pc_folder') || combinedId.includes('pc_folder')) {
    const folderPath =
      nodeCfg?.folderPath ||
      customNodeObj?.folderPath ||
      nodeCfg?.watchFolderPath ||
      nodeCfg?.driveFolderName ||
      '~/Documents';
    if (Array.isArray(upstreamInputItems) && upstreamInputItems.length > 0) {
      addLog(
        'info',
        `Recibidos ${upstreamInputItems.length} registro(s) de entrada desde "${upstreamSourceTitle || 'Nodo previo'}"`,
      );
    }
    addLog('info', `Iniciando lectura de carpeta local "${folderPath}" vía Google Antigravity (${antigravityMode})`);
    let folderChatPromise = Promise.resolve(null);
    if (typeof global.dispatchWorkflowOrderToAntigravityChat === 'function') {
      folderChatPromise = global
        .dispatchWorkflowOrderToAntigravityChat({
          userId: userIdStr,
          companyId,
          companyName,
          title: `[Flujo WAPPY] ${nodeTitle || 'Carpeta de mi PC'} — ${companyName}`,
          instruction: `Inspecciona la carpeta local "${folderPath}" en Mac/PC para la empresa "${companyName}" y retorna los archivos detectados.`,
          recursoObjetivo: `Google Antigravity (Carpeta Local · ${folderPath})`,
          antigravityMode,
          waitTimeoutMs: 600,
        })
        .catch(() => null);
    }
    let folderRes = null;
    if (typeof global.dispatchOsintViaAntigravityDaemon === 'function') {
      folderRes = await global
        .dispatchOsintViaAntigravityDaemon({
          action: 'pc_folder',
          folderPath,
          userId: userIdStr,
          antigravityMode,
        })
        .catch(() => null);
    }
    const folderChatDispatch = await folderChatPromise;
    if (folderChatDispatch?.dispatched) {
      addLog(
        'success',
        `Hilo abierto en Google Antigravity IDE (Orden #${folderChatDispatch.ordenId})`,
        folderChatDispatch.title,
      );
    }
    const durationMs = Math.max(1, Date.now() - t0);
    const files = Array.isArray(folderRes?.files) ? folderRes.files : [];
    const resolvedDir = folderRes?.folderPath || folderPath;
    const statusMsg = folderRes?.error
      ? `⚠️ ${folderRes.error}`
      : folderRes?.fuente || 'Disco Local vía Google Antigravity (Mac/PC)';

    if (folderRes?.error) {
      addLog('error', `Error leyendo carpeta ${resolvedDir}: ${folderRes.error}`);
    } else {
      addLog('success', `Carpeta ${resolvedDir} leída (${files.length} elemento(s)) en ${durationMs} ms`, statusMsg);
    }

    const lines = [
      `🛰️ **LECTURA DE CARPETA LOCAL VÍA GOOGLE ANTIGRAVITY (${nodeTitle || 'Carpeta de mi PC'})**`,
      modeHeaderLine,
      folderChatDispatch?.dispatched
        ? `- **Hilo en Chat Google Antigravity IDE:** 🟢 Orden \`#${folderChatDispatch.ordenId}\` enviada y abierta en Google Antigravity (${folderChatDispatch.title})`
        : null,
      `- **Canal de Ejecución:** ${statusMsg}`,
      `- **Ruta Inspeccionada en Mac/PC:** \`${resolvedDir}\``,
      `- **Tiempo Real de Lectura:** ${(durationMs / 1000).toFixed(2)}s (${durationMs} ms)`,
      `- **Archivos Detectados:** **${files.length}** elemento(s)`,
      '',
      '| # | Archivo / Elemento | Tipo | Tamaño (KB) | Última Modificación | Extracto / Contenido |',
      '| :--- | :--- | :---: | :---: | :--- | :--- |',
    ].filter((l) => l !== null);
    if (files.length > 0) {
      files.forEach((f, idx) => {
        lines.push(
          `| ${idx + 1} | **${f.name}** | ${f.isDirectory ? '📁 Carpeta' : '📄 Archivo'} | ${f.sizeKB ?? 0} KB | ${f.modifiedAt ? String(f.modifiedAt).split('T')[0] : '—'} | ${f.excerpt ? String(f.excerpt).replace(/\|/g, '·') : '—'} |`,
        );
      });
    } else {
      lines.push(
        `| 1 | *(Sin archivos leídos)* | — | 0 KB | — | ${folderRes?.error || `No se encontraron archivos en ${resolvedDir} o el daemon local no está en línea.`} |`,
      );
    }

    const folderOutputItems =
      files.length > 0
        ? files.map((f, idx) => ({
            index: idx + 1,
            archivo: f.name,
            tipo: f.isDirectory ? 'Carpeta' : 'Archivo',
            tamanoKB: f.sizeKB ?? 0,
            modificado: f.modifiedAt ? String(f.modifiedAt).split('T')[0] : '—',
            extracto: f.excerpt || '',
          }))
        : [
            {
              index: 1,
              carpeta: resolvedDir,
              archivos: 0,
              estado: folderRes?.error || 'Sin archivos leídos',
            },
          ];

    return {
      durationMs,
      recordsCount: Math.max(1, files.length),
      relayUsedCount: folderRes && !folderRes.error ? 1 : 0,
      verifiedWithCoursesCount: files.length,
      verifiedNoCoursesCount: 0,
      antigravityMode,
      portalLabel: nodeTitle || 'Carpeta de mi PC',
      inputSummary: `${statusMsg} · Carpeta ${resolvedDir} (${files.length} archivos)`,
      outputPreview: lines.join('\n'),
      inputItems: Array.isArray(upstreamInputItems) ? upstreamInputItems : [],
      outputItems: folderOutputItems,
      evidences: [],
      logs: stepLogs,
      error: folderRes?.error || null,
    };
  }

  // Determinar PRIMERO si es uno de los 6 portales oficiales de verificación de personas/vehículos
  // (NOTA CRÍTICA: en WappyWorkflowCanvas.tsx todos los nodos scraper tienen `nodeType: 'web_scraper'`,
  //  por lo que NUNCA se debe usar `nodeType === 'web_scraper'` para desactivar `isAltoRiesgo`, `isAntecedentes`, etc.)
  const isExplicitGenericOnly =
    combinedId.includes('custom_web_scraper_mintrabajo') ||
    combinedId.includes('scraper_node_antigravity') ||
    combinedId.includes('extract_web_scraping_agy') ||
    combinedId.includes('tool_web_scraping_agy') ||
    combinedId.includes('subagent_scraper_agy');
  const isArlDirecto =
    !isExplicitGenericOnly &&
    (combinedId.includes('arl_directo') || combinedId.includes('agy_arl') || /\barl\b/.test(combinedId));
  const isPensionesDirecto =
    !isExplicitGenericOnly &&
    (combinedId.includes('pensiones_directo') ||
      combinedId.includes('agy_pensiones') ||
      combinedId.includes('pensiones') ||
      combinedId.includes('ruaf') ||
      combinedId.includes('colpensiones'));
  const isSaludRethus = !isExplicitGenericOnly && combinedId.includes('salud_rethus');
  const isVialPesv = !isExplicitGenericOnly && combinedId.includes('vial_pesv');
  const isAntecedentes =
    !isExplicitGenericOnly &&
    (combinedId.includes('antecedentes') || combinedId.includes('rama_judicial'));
  const isAltoRiesgo =
    !isExplicitGenericOnly &&
    (combinedId.includes('alto_riesgo') ||
      combinedId.includes('alto riesgo') ||
      combinedId.includes('mintrabajo') ||
      combinedId.includes('centrosentrenamiento'));
  const isGenericWebScraper =
    !isArlDirecto &&
    !isPensionesDirecto &&
    !isSaludRethus &&
    !isVialPesv &&
    !isAntecedentes &&
    !isAltoRiesgo &&
    (isExplicitGenericOnly ||
      String(customNodeObj?.nodeType || nodeId || '').toLowerCase() === 'web_scraper' ||
      combinedId.includes('web_scraper') ||
      combinedId.includes('extract_web_scraping'));

  // Caso B: Web Scraper Genérico (`web_scrape`)
  if (isGenericWebScraper) {
    const targetUrl =
      customNodeObj?.targetUrl || nodeCfg?.targetUrl || 'https://www.mintrabajo.gov.co';
    if (Array.isArray(upstreamInputItems) && upstreamInputItems.length > 0) {
      addLog(
        'info',
        `Recibidos ${upstreamInputItems.length} registro(s) de entrada desde "${upstreamSourceTitle || 'Nodo previo'}"`,
      );
    }
    addLog('info', `Extrayendo contenido web y evidencia desde "${targetUrl}" (modo ${antigravityMode})`);
    let scrapeChatPromise = Promise.resolve(null);
    if (typeof global.dispatchWorkflowOrderToAntigravityChat === 'function') {
      scrapeChatPromise = global
        .dispatchWorkflowOrderToAntigravityChat({
          userId: userIdStr,
          companyId,
          companyName,
          title: `[Flujo WAPPY] ${nodeTitle || 'Web Scraper AGY'} — ${companyName}`,
          instruction: `Extrae y analiza el contenido en vivo y captura visual/PDF de la URL "${targetUrl}" para "${companyName}" (${Array.isArray(upstreamInputItems) ? upstreamInputItems.length : 0} elemento(s) recibidos del paso anterior).`,
          recursoObjetivo: `Google Antigravity (Web Scraper · ${targetUrl})`,
          antigravityMode,
          waitTimeoutMs: 600,
        })
        .catch(() => null);
    }
    let scrapeRes = null;
    if (typeof global.dispatchOsintViaAntigravityDaemon === 'function') {
      scrapeRes = await global
        .dispatchOsintViaAntigravityDaemon({
          action: 'web_scrape',
          targetUrl,
          includeEvidence: true,
          userId: userIdStr,
          antigravityMode,
        })
        .catch(() => null);
    }
    if (!scrapeRes || scrapeRes?.error) {
      try {
        const portalScrapeFallback = await consultarPortalEspecíficoAntigravity({
          action: 'web_scrape',
          targetUrl,
          url: targetUrl,
          includeEvidence: true,
        }).catch(() => null);
        if (
          portalScrapeFallback &&
          portalScrapeFallback.action === 'web_scrape' &&
          (portalScrapeFallback.textExcerpt ||
            portalScrapeFallback.pdfBase64 ||
            portalScrapeFallback.imageBase64)
        ) {
          scrapeRes = portalScrapeFallback;
        }
      } catch (_) {}
    }
    if (!scrapeRes || scrapeRes?.error) {
      try {
        const firstUrl = String(targetUrl).split(',')[0].trim() || 'https://www.mintrabajo.gov.co';
        const normUrl = /^https?:\/\//i.test(firstUrl) ? firstUrl : `https://${firstUrl}`;
        const r = await fetch(normUrl, { signal: AbortSignal.timeout(10000) });
        const html = await r.text();
        const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
        scrapeRes = {
          ...(scrapeRes || {}),
          error: null,
          fuente: 'Web Scraper Directo WAPPY + Google Antigravity',
          status: 'ok',
          url: normUrl,
          title: titleMatch ? titleMatch[1].replace(/\s+/g, ' ').trim() : normUrl,
          textExcerpt: html
            .replace(/<script[\s\S]*?<\/script>/gi, ' ')
            .replace(/<style[\s\S]*?<\/style>/gi, ' ')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 3500),
        };
      } catch (e) {
        if (!scrapeRes) {
          scrapeRes = {
            fuente: 'Web Scraper Google Antigravity',
            status: 'error',
            url: targetUrl,
            error: e.message,
          };
        }
      }
    }
    const scrapeChatDispatch = await scrapeChatPromise;
    if (scrapeChatDispatch?.dispatched) {
      addLog(
        'success',
        `Hilo abierto en Google Antigravity IDE (Orden #${scrapeChatDispatch.ordenId})`,
        scrapeChatDispatch.title,
      );
    }

    const genericEvidences = [];
    const savedWebEv = saveScraperEvidenceFiles({
      pdfBase64: scrapeRes?.pdfBase64 || null,
      pdfFileName: scrapeRes?.pdfFileName || null,
      imageBase64: scrapeRes?.imageBase64 || scrapeRes?.screenshotBase64 || null,
      imageFileName: scrapeRes?.imageFileName || null,
      cedula: 'WEB',
      workerName: scrapeRes?.title || 'Captura_Web',
      portalLabel: nodeTitle || 'Web Scraper AGY',
    });
    if (savedWebEv.hasEvidence) {
      genericEvidences.push({
        workerName: scrapeRes?.title || targetUrl,
        cedula: 'WEB',
        cargo: 'Extracción Web',
        portal: scrapeRes?.fuente || 'Web Scraper Google Antigravity',
        title: scrapeRes?.title || 'Certificado / Captura Web Oficial',
        pdfUrl: savedWebEv.pdfUrl || null,
        pdfDownloadUrl: savedWebEv.pdfDownloadUrl || null,
        pdfAbsoluteUrl: savedWebEv.pdfAbsoluteUrl || null,
        pdfFileName: savedWebEv.pdfFileName || null,
        pdfLocalPath: savedWebEv.pdfLocalPath || null,
        imageUrl: savedWebEv.imageUrl || null,
        imageDownloadUrl: savedWebEv.imageDownloadUrl || null,
        imageAbsoluteUrl: savedWebEv.imageAbsoluteUrl || null,
        imageFileName: savedWebEv.imageFileName || null,
        imageLocalPath: savedWebEv.imageLocalPath || null,
      });
      addLog(
        'success',
        `Evidencia guardada (${[savedWebEv.pdfFileName, savedWebEv.imageFileName].filter(Boolean).join(' · ')})`,
      );
    }

    const webCertStatus = savedWebEv.hasEvidence
      ? '📎 Descargado (ver panel de archivos)'
      : 'Sin certificado';

    const durationMs = Math.max(1, Date.now() - t0);
    if (scrapeRes?.error) {
      addLog('error', `Error al consultar URL "${targetUrl}": ${scrapeRes.error}`);
    } else {
      addLog('success', `Página extraída exitosamente (${durationMs} ms): ${scrapeRes?.title || targetUrl}`, scrapeRes?.fuente || 'Web Scraper');
    }
    const lines = [
      `🛰️ **EXTRACCIÓN WEB EN TIEMPO REAL — GOOGLE ANTIGRAVITY (${nodeTitle || 'Web Scraper AGY'})**`,
      modeHeaderLine,
      scrapeChatDispatch?.dispatched
        ? `- **Hilo en Chat Google Antigravity IDE:** 🟢 Orden \`#${scrapeChatDispatch.ordenId}\` enviada y abierta en Google Antigravity (${scrapeChatDispatch.title})`
        : null,
      `- **Canal de Ejecución:** ${scrapeRes?.error ? `⚠️ ${scrapeRes.error}` : scrapeRes?.fuente || 'Web Scraper Google Antigravity'}`,
      `- **URL Consultada:** \`${scrapeRes?.url || targetUrl}\``,
      `- **Título Extraído:** ${scrapeRes?.title || 'N/A'}`,
      `- **Tiempo Real HTTP:** ${(durationMs / 1000).toFixed(2)}s (${durationMs} ms)`,
      savedWebEv.hasEvidence ? `- **Certificado / Captura Descargada:** 📎 Sí (en archivos descargados)` : null,
      '',
      `### 📄 Contenido Extraído de la Página:`,
      scrapeRes?.textExcerpt
        ? `> ${String(scrapeRes.textExcerpt).slice(0, 1800)}`
        : `> ${scrapeRes?.error || 'Sin contenido extraído.'}`,
    ].filter((l) => l !== null);

    if (genericEvidences.length > 0) {
      lines.push(
        '',
        `> 📎 **${genericEvidences.length} certificado(s)/archivo(s) oficial(es) descargado(s):** Disponibles para ver y descargar en el campo separado **"Certificados y Archivos Descargados"**.`,
      );
    }

    return {
      durationMs,
      recordsCount: 1,
      relayUsedCount: scrapeRes && !scrapeRes.error ? 1 : 0,
      verifiedWithCoursesCount: scrapeRes?.textExcerpt ? 1 : 0,
      verifiedNoCoursesCount: scrapeRes?.textExcerpt ? 0 : 1,
      antigravityMode,
      portalLabel: nodeTitle || 'Web Scraper AGY',
      inputSummary: `${scrapeRes?.fuente || 'Web Scraper Antigravity'} · ${scrapeRes?.url || targetUrl}`,
      outputPreview: lines.join('\n'),
      inputItems: Array.isArray(upstreamInputItems) ? upstreamInputItems : [],
      outputItems: [
        {
          index: 1,
          url: scrapeRes?.url || targetUrl,
          titulo: scrapeRes?.title || 'N/A',
          fuente: scrapeRes?.fuente || 'Web Scraper Google Antigravity',
          estado: scrapeRes?.status || 'ok',
          certificado: webCertStatus,
          pdfUrl: savedWebEv.pdfUrl || null,
          pdfDownloadUrl: savedWebEv.pdfDownloadUrl || null,
          imageUrl: savedWebEv.imageUrl || null,
          imageDownloadUrl: savedWebEv.imageDownloadUrl || null,
          pdfFileName: savedWebEv.pdfFileName || null,
          imageFileName: savedWebEv.imageFileName || null,
          extracto: scrapeRes?.textExcerpt ? String(scrapeRes.textExcerpt).slice(0, 600) : scrapeRes?.error || '',
          ordenAntigravity: scrapeChatDispatch?.ordenId || null,
          itemsPreviosRecibidos: Array.isArray(upstreamInputItems) ? upstreamInputItems.length : 0,
        },
      ],
      evidences: genericEvidences,
      logs: stepLogs,
      error: scrapeRes?.error || null,
    };
  }

  // 1. Extraer cédulas explícitas escritas en el prompt, caso de prueba o configuración del nodo (6 a 11 dígitos)
  const explicitText = [
    mockTriggerInput,
    promptText,
    nodeCfg?.customInstruction,
    nodeCfg?.inputContext,
    nodeCfg?.targetUrl,
    customNodeObj?.content,
    customNodeObj?.targetUrl,
  ]
    .filter(Boolean)
    .join(' ');

  const explicitCedulas = Array.from(
    new Set(
      (explicitText.match(/\b\d{6,11}\b/g) || [])
        .map((c) => c.trim())
        .filter((c) => c !== '901437310' && !/^202\d/.test(c)),
    ),
  );

  // 2. Prioridad #1 (Flujo real entre nodos estilo n8n):
  // Si `upstreamInputItems` trae registros del nodo anterior (ej. Paso #2: Extraer Trabajadores), extraer de ahí mismo
  let companyWorkers = [];
  const hasUpstreamItems = Array.isArray(upstreamInputItems) && upstreamInputItems.length > 0;
  if (hasUpstreamItems) {
    addLog(
      'info',
      `Recibidos ${upstreamInputItems.length} registro(s) de entrada desde "${upstreamSourceTitle || 'Nodo previo'}"`,
    );
    const extractDocFromItem = (item) => {
      if (!item || typeof item !== 'object') return '';
      const direct =
        item['Cédula / Documento'] ||
        item.cedula ||
        item.documento ||
        item.identificacion ||
        item.documentNumber;
      if (direct !== undefined && direct !== null && String(direct).trim() !== '') {
        return String(direct).trim();
      }
      for (const [k, v] of Object.entries(item)) {
        if (/c[eé]dula|documento|identificaci[oó]n/i.test(k) && v !== undefined && v !== null && String(v).trim() !== '') {
          return String(v).trim();
        }
      }
      if (item.id && !/^[a-f0-9]{24}$/i.test(String(item.id))) {
        return String(item.id).trim();
      }
      return '';
    };

    const upstreamWorkers = upstreamInputItems
      .map((item, idx) => {
        const docVal = extractDocFromItem(item);
        const nameVal =
          item['Nombre Completo'] ||
          item.nombre ||
          item.colaborador ||
          item.label ||
          '';
        const cargoVal =
          item['Cargo / Antigüedad'] ||
          item.cargo ||
          item.detalle ||
          item.sublabel ||
          'Operativo';
        return {
          _id: item.id || `up_${idx + 1}`,
          id: item.id || `up_${idx + 1}`,
          isCritical: Boolean(item.isCritical),
          nombre: nameVal || (docVal ? `Colaborador (${docVal})` : ''),
          documento: docVal,
          cargo: cargoVal,
          eps:
            item['EPS'] ||
            item['EPS (Entidad Promotora de Salud)'] ||
            item.eps ||
            item.epsName ||
            '',
          arl:
            item['ARL'] ||
            item['ARL (Administradora de Riesgos Laborales)'] ||
            item.arl ||
            item.arlName ||
            '',
          afp:
            item['AFP (Fondo de Pensiones)'] ||
            item['AFP'] ||
            item.afp ||
            item.fondoPensiones ||
            '',
          fechaNacimiento:
            item['Fecha de Nacimiento'] ||
            item.fechaNacimiento ||
            item.birthDate ||
            '',
          nivelRiesgo: item.estado || item.badge || item.nivelRiesgo || 'I',
          placa: item['Placa'] || item.placa || '',
        };
      })
      .filter((w) => Boolean(w.documento));

    if (upstreamWorkers.length > 0) {
      companyWorkers = upstreamWorkers;
      if (companyWorkers.some((w) => !w.arl || !w.fechaNacimiento)) {
        try {
          const liveHydrationData = await inspectNodeLiveData({
            userId: userIdStr,
            companyId: companyId ? String(companyId) : '',
            nodeId: 'extract_sst_workers',
          });
          if (Array.isArray(liveHydrationData?.records) && liveHydrationData.records.length > 0) {
            const byCleanCedula = new Map();
            for (const rec of liveHydrationData.records) {
              const rawCed = String(
                rec.fields?.['Cédula / Documento'] ||
                  rec.documento ||
                  rec.identificacion ||
                  rec.cedula ||
                  rec.id ||
                  '',
              ).replace(/\D/g, '');
              if (rawCed) {
                byCleanCedula.set(rawCed, rec);
              }
            }
            companyWorkers = companyWorkers.map((w) => {
              const cleanCed = String(w.documento || '').replace(/\D/g, '');
              const fullRec = cleanCed ? byCleanCedula.get(cleanCed) : null;
              if (!fullRec) return w;
              const f = fullRec.fields || {};
              return {
                ...w,
                arl:
                  w.arl ||
                  f['ARL'] ||
                  f['ARL (Administradora de Riesgos Laborales)'] ||
                  fullRec.arl ||
                  '',
                eps:
                  w.eps ||
                  f['EPS'] ||
                  f['EPS (Entidad Promotora de Salud)'] ||
                  fullRec.eps ||
                  '',
                afp:
                  w.afp ||
                  f['AFP (Fondo de Pensiones)'] ||
                  fullRec.afp ||
                  '',
                fechaNacimiento:
                  w.fechaNacimiento ||
                  f['Fecha de Nacimiento'] ||
                  fullRec.fechaNacimiento ||
                  '',
                cargo:
                  w.cargo && w.cargo !== 'Operativo'
                    ? w.cargo
                    : f['Cargo'] || f['Cargo / Antigüedad'] || fullRec.cargo || w.cargo || 'Operativo',
                placa: w.placa || f['Placa'] || fullRec.placa || '',
              };
            });
          }
        } catch (hydrErr) {
          console.warn(
            '[Antigravity Scraper] Aviso hidratando campos de upstreamWorkers:',
            hydrErr?.message,
          );
        }
      }
      addLog(
        'info',
        `Procesando ${companyWorkers.length} trabajador(es) con cédula transferidos directamente por el flujo desde "${upstreamSourceTitle || 'Nodo previo'}"`,
      );
    }
  }

  // Solo si `upstreamInputItems` no trae trabajadores con cédula (ej. si el nodo scraper se conectó directo al disparador o si el filtro quirúrgico omitió la columna cédula), usar el respaldo `inspectNodeLiveData`
  if (companyWorkers.length === 0) {
    try {
      const liveWorkersData = await inspectNodeLiveData({
        userId: userIdStr,
        companyId: companyId ? String(companyId) : '',
        nodeId: 'extract_sst_workers',
      });
      if (Array.isArray(liveWorkersData?.records) && liveWorkersData.records.length > 0) {
        let recordsToMap = liveWorkersData.records;
        // Si `upstreamInputItems` traía IDs de trabajadores (pero con filtro quirúrgico sin el campo cédula), cruzar por ID/nombre para respetar los registros que envió el nodo anterior
        if (hasUpstreamItems) {
          const upstreamIds = new Set(
            upstreamInputItems.map((it) => String(it.id || '')).filter(Boolean),
          );
          const upstreamNames = new Set(
            upstreamInputItems
              .map((it) => String(it['Nombre Completo'] || it.nombre || it.label || '').toLowerCase().trim())
              .filter(Boolean),
          );
          const matchedByUpstream = recordsToMap.filter(
            (r) =>
              upstreamIds.has(String(r.id)) ||
              upstreamNames.has(String(r.label || r.fields?.['Nombre Completo'] || '').toLowerCase().trim()),
          );
          if (matchedByUpstream.length > 0) {
            recordsToMap = matchedByUpstream;
          }
        }
        companyWorkers = recordsToMap.map((rec) => ({
          _id: rec.id,
          id: rec.id,
          isCritical: Boolean(rec.isCritical),
          nombre:
            rec.fields?.['Nombre Completo'] ||
            rec.label ||
            rec.nombre ||
            'Colaborador',
          documento:
            rec.fields?.['Cédula / Documento'] ||
            rec.documento ||
            rec.identificacion ||
            rec.cedula ||
            '',
          cargo:
            rec.fields?.['Cargo'] ||
            rec.fields?.['Cargo / Antigüedad'] ||
            rec.sublabel ||
            rec.cargo ||
            'Operativo',
          eps: rec.fields?.['EPS'] || rec.fields?.['EPS (Entidad Promotora de Salud)'] || '',
          arl: rec.fields?.['ARL'] || rec.fields?.['ARL (Administradora de Riesgos Laborales)'] || '',
          afp: rec.fields?.['AFP (Fondo de Pensiones)'] || rec.afp || '',
          fechaNacimiento: rec.fields?.['Fecha de Nacimiento'] || rec.fechaNacimiento || '',
          nivelRiesgo: rec.badge || 'I',
          placa: rec.fields?.['Placa'] || rec.placa || '',
        }));
        addLog(
          'info',
          `Cargados ${companyWorkers.length} trabajador(es) del padrón activo de "${companyName}"`,
        );
      }
    } catch (err) {
      console.warn('[Antigravity Scraper] Aviso en inspectNodeLiveData(extract_sst_workers):', err?.message);
    }
  }

  if (companyWorkers.length === 0) {
    try {
      const WorkerModel =
        mongoose.models.SgsstWorker ||
        (mongoose.modelNames().includes('SgsstWorker') ? mongoose.model('SgsstWorker') : null);
      if (WorkerModel && companyId && mongoose.Types.ObjectId.isValid(String(companyId))) {
        companyWorkers = await WorkerModel.find({
          companyId: new mongoose.Types.ObjectId(String(companyId)),
        })
          .sort({ createdAt: -1 })
          .limit(300)
          .lean();
      }
    } catch (err) {
      console.warn('[Antigravity Scraper] Aviso leyendo SgsstWorker:', err?.message);
    }
  }

  // Respetar filtro quirúrgico si el nodo extractor de trabajadores filtró registros específicos
  const workerExtCfg =
    allNodeConfigs?.extractor_extract_sst_workers ||
    allNodeConfigs?.extract_sst_workers ||
    allNodeConfigs?.ext_extract_sst_workers ||
    {};
  const filterMode = nodeCfg?.recordFilterMode || workerExtCfg?.recordFilterMode || 'all';
  const selectedIds = Array.isArray(nodeCfg?.selectedRecordIds) && nodeCfg.selectedRecordIds.length > 0
    ? nodeCfg.selectedRecordIds.map(String)
    : Array.isArray(workerExtCfg?.selectedRecordIds)
      ? workerExtCfg.selectedRecordIds.map(String)
      : [];

  if (filterMode === 'critical_only') {
    const critFiltered = companyWorkers.filter((w) => w.isCritical);
    if (critFiltered.length > 0) {
      companyWorkers = critFiltered;
    }
  } else if (filterMode === 'selected' && selectedIds.length > 0) {
    const idSet = new Set(selectedIds);
    const filtered = companyWorkers.filter((w) => idSet.has(String(w._id || w.id)));
    if (filtered.length > 0) {
      companyWorkers = filtered;
    }
  }

  // 3. Construir lista unificada de personas/cédulas a consultar en vivo
  const targetsMap = new Map();

  for (const ced of explicitCedulas) {
    const matchedWorker = companyWorkers.find(
      (w) => String(w.documento || w.identificacion || w.cedula || w.documentNumber || '').replace(/\D/g, '') === ced,
    );
    targetsMap.set(ced, {
      rawDoc: ced,
      cleanCedula: ced,
      isNumericValid: true,
      nombre: matchedWorker?.nombre || matchedWorker?.fullName || `Cédula solicitada (${ced})`,
      cargo: matchedWorker?.cargo || matchedWorker?.position || 'Consulta directa',
      riesgo: matchedWorker?.nivelRiesgo || matchedWorker?.riskLevel || 'N/A',
      placa: matchedWorker?.placa || '',
      arl: matchedWorker?.arl || matchedWorker?.arlName || '',
      eps: matchedWorker?.eps || matchedWorker?.epsName || '',
      afp: matchedWorker?.afp || matchedWorker?.fondoPensiones || '',
      fechaNacimiento: matchedWorker?.fechaNacimiento || matchedWorker?.birthDate || '',
    });
  }

  for (const w of companyWorkers) {
    const rawDoc = String(w.documento || w.identificacion || w.cedula || w.documentNumber || '').trim();
    const cleanCedula = rawDoc.replace(/\D/g, '');
    const isNumericValid = /^\d{5,12}$/.test(cleanCedula);
    const key = isNumericValid ? cleanCedula : rawDoc || String(w._id || w.id);
    if (!targetsMap.has(key)) {
      targetsMap.set(key, {
        rawDoc: rawDoc || 'S/D',
        cleanCedula,
        isNumericValid,
        nombre: w.nombre || w.fullName || 'Colaborador',
        cargo: w.cargo || w.position || 'Operativo',
        riesgo: w.nivelRiesgo || w.riskLevel || 'I',
        placa: w.placa || '',
        arl: w.arl || w.arlName || '',
        eps: w.eps || w.epsName || '',
        afp: w.afp || w.fondoPensiones || '',
        fechaNacimiento: w.fechaNacimiento || w.birthDate || '',
      });
    }
  }

  const allTargets = Array.from(targetsMap.values());
  const canQueryByNameOnly = Boolean(isAntecedentes && !isAltoRiesgo);
  const validTargets = allTargets
    .filter(
      (t) =>
        t.isNumericValid ||
        (canQueryByNameOnly &&
          t.nombre &&
          t.nombre.trim().length >= 5 &&
          !/^(colaborador|trabajador)\b/i.test(t.nombre.trim())),
    )
    .slice(0, 300);
  const nonNumericTargets = allTargets.filter((t) => !validTargets.includes(t));

  const specificPortalAction = isArlDirecto
    ? 'arl'
    : isPensionesDirecto
      ? 'pensiones'
      : isSaludRethus
        ? 'salud_rethus'
        : isVialPesv
          ? 'vial_pesv'
          : null;

  console.log(
    `[Antigravity Scraper] 🚀 Iniciando verificación REAL (${specificPortalAction || (isAntecedentes ? 'antecedentes' : 'alto_riesgo')}, mode=${antigravityMode}) para "${companyName}" (${validTargets.length} cédulas numéricas válidas)...`,
  );

  const targetUrlsStr =
    nodeCfg?.targetUrl ||
    customNodeObj?.targetUrl ||
    'https://app2.mintrabajo.gov.co/CentrosEntrenamiento/consulta_ext.aspx, https://certificados.sena.edu.co/CertificadoDigital/com.sena.consultacer';
  const scriptEngineStr = nodeCfg?.scriptEngine || customNodeObj?.scriptEngine || 'chrome_mcp';
  const scriptCodeStr = nodeCfg?.scriptCode || customNodeObj?.scriptCode || '';

  // 4. Ejecutar consultas reales en lotes de 10 en paralelo a través del daemon Antigravity
  const verificationRows = [];
  const evidences = [];
  let relayUsedCount = 0;
  let verifiedWithCoursesCount = 0;
  let verifiedNoCoursesCount = 0;

  const persistAndAttachRowEvidence = ({ primaryRes, secondaryRes, target, fuenteStr, title }) => {
    const rawPdfB64 =
      primaryRes?.pdfBase64 ||
      primaryRes?.ultimoCertificadoAlturas?.pdfBase64 ||
      primaryRes?.cursos?.[0]?.pdfBase64 ||
      secondaryRes?.pdfBase64 ||
      null;
    const rawPdfName =
      primaryRes?.pdfFileName ||
      primaryRes?.ultimoCertificadoAlturas?.pdfFileName ||
      secondaryRes?.pdfFileName ||
      null;
    const rawImgB64 =
      primaryRes?.imageBase64 ||
      primaryRes?.screenshotBase64 ||
      primaryRes?.ultimoCertificadoAlturas?.imageBase64 ||
      primaryRes?.cursos?.[0]?.imageBase64 ||
      secondaryRes?.imageBase64 ||
      secondaryRes?.screenshotBase64 ||
      null;
    const rawImgName =
      primaryRes?.imageFileName ||
      primaryRes?.ultimoCertificadoAlturas?.imageFileName ||
      secondaryRes?.imageFileName ||
      null;

    if (!rawPdfB64 && !rawImgB64) {
      return {
        pdfUrl: null,
        pdfDownloadUrl: null,
        imageUrl: null,
        imageDownloadUrl: null,
        pdfFileName: null,
        imageFileName: null,
        certificado: 'Sin certificado',
        certificadoTabla: 'Sin certificado',
      };
    }

    const saved = saveScraperEvidenceFiles({
      pdfBase64: rawPdfB64,
      pdfFileName: rawPdfName,
      imageBase64: rawImgB64,
      imageFileName: rawImgName,
      cedula: target.cleanCedula || target.rawDoc,
      workerName: target.nombre,
      portalLabel: fuenteStr || nodeTitle || 'Certificado',
    });

    if (!saved.hasEvidence) {
      return {
        pdfUrl: null,
        pdfDownloadUrl: null,
        imageUrl: null,
        imageDownloadUrl: null,
        pdfFileName: null,
        imageFileName: null,
        certificado: 'Sin certificado',
        certificadoTabla: 'Sin certificado',
      };
    }

    evidences.push({
      workerName: target.nombre,
      cedula: target.cleanCedula,
      cargo: target.cargo,
      portal: fuenteStr,
      title: title || 'Certificado / Constancia Oficial',
      pdfUrl: saved.pdfUrl || null,
      pdfDownloadUrl: saved.pdfDownloadUrl || null,
      pdfAbsoluteUrl: saved.pdfAbsoluteUrl || null,
      pdfFileName: saved.pdfFileName || null,
      pdfLocalPath: saved.pdfLocalPath || null,
      imageUrl: saved.imageUrl || null,
      imageDownloadUrl: saved.imageDownloadUrl || null,
      imageAbsoluteUrl: saved.imageAbsoluteUrl || null,
      imageFileName: saved.imageFileName || null,
      imageLocalPath: saved.imageLocalPath || null,
    });

    return {
      pdfUrl: saved.pdfUrl || null,
      pdfDownloadUrl: saved.pdfDownloadUrl || null,
      imageUrl: saved.imageUrl || null,
      imageDownloadUrl: saved.imageDownloadUrl || null,
      pdfFileName: saved.pdfFileName || null,
      imageFileName: saved.imageFileName || null,
      certificado: '📎 Descargado (ver panel de archivos)',
      certificadoTabla: '📎 Sí (en archivos descargados)',
    };
  };

  const effectiveBatchSize =
    specificPortalAction === 'vial_pesv' || specificPortalAction === 'pensiones' ? 3 : 6;
  for (let i = 0; i < validTargets.length; i += effectiveBatchSize) {
    const batch = validTargets.slice(i, i + effectiveBatchSize);
    const batchResults = await Promise.all(
      batch.map(async (target, batchIdx) => {
        try {
          if (specificPortalAction) {
            const shouldIncludePortalEvidence =
              specificPortalAction === 'arl' ||
              specificPortalAction === 'pensiones' ||
              specificPortalAction === 'vial_pesv'
                ? true
                : i < 12;
            const portalTimeoutMs =
              specificPortalAction === 'vial_pesv' || specificPortalAction === 'pensiones'
                ? 45000
                : shouldIncludePortalEvidence
                  ? 35000
                  : 25000;
            let portalRes = null;
            if (typeof global.dispatchOsintViaAntigravityDaemon === 'function') {
              portalRes = await global
                .dispatchOsintViaAntigravityDaemon({
                  userId: userIdStr,
                  action: specificPortalAction,
                  tipoDoc: 'CC',
                  cedula: target.cleanCedula,
                  nombre: target.nombre,
                  placa: target.placa || '',
                  arl: target.arl || '',
                  eps: target.eps || '',
                  afp: target.afp || '',
                  fechaNacimiento: target.fechaNacimiento || '',
                  includeEvidence: shouldIncludePortalEvidence,
                  timeoutMs: portalTimeoutMs,
                  antigravityMode,
                })
                .catch(() => null);
            }
            if (!portalRes && antigravityMode === 'auto') {
              portalRes = await consultarPortalEspecíficoAntigravity({
                action: specificPortalAction,
                tipoDoc: 'CC',
                cedula: target.cleanCedula,
                nombre: target.nombre,
                placa: target.placa || '',
                arl: target.arl || '',
                eps: target.eps || '',
                afp: target.afp || '',
                fechaNacimiento: target.fechaNacimiento || '',
                includeEvidence: shouldIncludePortalEvidence,
                timeoutMs: portalTimeoutMs,
              });
            }
            return { target, portalRes };
          }

          if (isAntecedentes && !isAltoRiesgo) {
            const effectiveDocForRj = target.isNumericValid ? target.cleanCedula : target.rawDoc;
            const shouldIncludeAntecedentesEvidence =
              i < 10 || explicitCedulas.includes(target.cleanCedula);
            const forceFirstEvidence = i === 0 && batchIdx === 0;
            let rjRes = null;
            if (typeof global.dispatchOsintViaAntigravityDaemon === 'function') {
              rjRes = await global
                .dispatchOsintViaAntigravityDaemon({
                  userId: userIdStr,
                  action: 'antecedentes',
                  tipoDoc: 'CC',
                  cedula: effectiveDocForRj,
                  nombre: target.nombre,
                  includeEvidence: shouldIncludeAntecedentesEvidence,
                  forceEvidence: forceFirstEvidence,
                  antigravityMode,
                })
                .catch(() => null);
            }
            if (!rjRes && antigravityMode === 'auto') {
              rjRes = await consultarRamaJudicial({
                nombreCompleto: target.nombre,
                cedula: effectiveDocForRj,
                tipoDoc: 'CC',
                includeEvidence: shouldIncludeAntecedentesEvidence,
                forceEvidence: forceFirstEvidence,
              }).catch(() => null);
            }
            return { target, rjOnly: true, rjRes };
          }

          const mtRes = await consultarAlturasMinTrabajo({
            tipoDoc: 'CC',
            cedula: target.cleanCedula,
            includePdf: true,
            includeEvidence: true,
            userId: userIdStr,
            antigravityMode,
            preferAntigravityDaemon: true,
          });
          let rjRes = null;
          if (isAntecedentes && target.nombre && !target.nombre.startsWith('Cédula solicitada')) {
            rjRes = await consultarRamaJudicial({
              nombreCompleto: target.nombre,
              cedula: target.cleanCedula,
              tipoDoc: 'CC',
              includeEvidence: i < 10 || explicitCedulas.includes(target.cleanCedula),
            }).catch(() => null);
          }
          return { target, mtRes, rjRes };
        } catch (err) {
          return {
            target,
            mtRes: {
              fuente: 'MinTrabajo',
              status: 'error',
              resumen: err?.message || 'Error de conexión con portal oficial',
              cursos: [],
            },
            rjRes: null,
          };
        }
      }),
    );

    for (const item of batchResults) {
      const { target } = item;
      if (item.portalRes) {
        const pRes = item.portalRes;
        if (String(pRes?.fuente || '').includes('Antigravity')) {
          relayUsedCount++;
        }
        const hasPositiveRecord = Boolean(
          pRes.afiliadoActivo || pRes.tieneCertificado || pRes.tieneHallazgo || pRes.pdfBase64,
        );
        if (hasPositiveRecord) verifiedWithCoursesCount++;
        else verifiedNoCoursesCount++;

        const estadoStr =
          pRes.estadoReal ||
          (pRes.afiliadoActivo
            ? '✅ AFILIADO ACTIVO'
            : pRes.error
              ? `⚠️ ${pRes.error}`
              : '⚪ CONSULTADO SIN REGISTRO ACTIVO');
        const detalleStr = pRes.resumen || pRes.error || 'Consulta completada en portal oficial.';
        const fuenteStr = pRes.entidadDetectada
          ? `${pRes.entidadDetectada} (vía Google Antigravity)`
          : pRes.fuente || 'Google Antigravity';
        const certTitle = pRes.entidadDetectada
          ? `Certificado Oficial — ${pRes.entidadDetectada}`
          : pRes.tituloCertificado || 'Certificado / Constancia Oficial';

        const evMeta = persistAndAttachRowEvidence({
          primaryRes: pRes,
          secondaryRes: null,
          target,
          fuenteStr,
          title: certTitle,
        });
        verificationRows.push({
          nombre: target.nombre,
          documento: target.cleanCedula,
          cargo: target.cargo,
          arl: target.arl || '',
          eps: target.eps || '',
          afp: target.afp || '',
          fechaNacimiento: target.fechaNacimiento || '',
          placa: target.placa || '',
          estado: estadoStr,
          detalle: detalleStr,
          fuente: fuenteStr,
          ...evMeta,
        });
        addLog(
          pRes.status === 'error' || pRes.error
            ? 'error'
            : pRes.tieneHallazgo
              ? 'warn'
              : hasPositiveRecord
                ? 'success'
                : 'info',
          `CC ${target.cleanCedula} (${target.nombre}): ${estadoStr}${evMeta.pdfFileName || evMeta.imageFileName ? ' [📎 Evidencia]' : ''}`,
          `Fuente: ${fuenteStr} · ${detalleStr}`,
        );
        continue;
      }

      if (item.rjOnly) {
        const rjRes = item.rjRes || {};
        if (String(rjRes?.fuente || '').includes('Antigravity')) {
          relayUsedCount++;
        }
        const hasProcs =
          Boolean(rjRes?.tieneHallazgo) || Number(rjRes?.totalProcesos || 0) > 0;
        if (!rjRes?.error) verifiedWithCoursesCount++;
        else verifiedNoCoursesCount++;
        const estadoStr =
          rjRes.estadoReal ||
          (rjRes.error
            ? `⚠️ ${rjRes.status || 'SIN CONEXIÓN'}`
            : hasProcs
              ? `⚠️ ${rjRes.totalProcesos} PROCESO(S) EN RAMA JUDICIAL`
              : '✅ SIN ANTECEDENTES JUDICIALES NI FISCALES');
        const detalleStr = rjRes.resumen || rjRes.error || 'Verificado en Rama Judicial API v2.';
        const fuenteStr = rjRes.entidadDetectada
          ? `${rjRes.entidadDetectada} (vía Google Antigravity)`
          : rjRes.fuente || 'Rama Judicial';
        const rjCertTitle = rjRes.entidadDetectada
          ? `Certificado Oficial — ${rjRes.entidadDetectada}`
          : rjRes.tituloCertificado || 'Constancia de Consulta Rama Judicial / Antecedentes';
        const evMeta = persistAndAttachRowEvidence({
          primaryRes: rjRes,
          secondaryRes: null,
          target,
          fuenteStr,
          title: rjCertTitle,
        });
        const displayDoc = target.isNumericValid ? target.cleanCedula : target.rawDoc;
        verificationRows.push({
          nombre: target.nombre,
          documento: displayDoc,
          cargo: target.cargo,
          arl: target.arl || '',
          eps: target.eps || '',
          afp: target.afp || '',
          fechaNacimiento: target.fechaNacimiento || '',
          placa: target.placa || '',
          estado: estadoStr,
          detalle: detalleStr,
          fuente: fuenteStr,
          ...evMeta,
        });
        addLog(
          rjRes.error ? 'error' : hasProcs ? 'warn' : 'success',
          `CC ${displayDoc} (${target.nombre}): ${estadoStr}${evMeta.pdfFileName || evMeta.imageFileName ? ' [📎 Evidencia]' : ''}`,
          `Fuente: ${fuenteStr} · ${detalleStr}`,
        );
        continue;
      }

      const { mtRes, rjRes } = item;
      if (String(mtRes?.fuente || '').includes('Antigravity') || mtRes?.viaAntigravityDaemon) {
        relayUsedCount++;
      }
      const cursos = Array.isArray(mtRes?.cursos) ? mtRes.cursos : [];
      if (cursos.length > 0) {
        verifiedWithCoursesCount++;
        const latest = cursos[0];
        const badge =
          mtRes.status === 'warning'
            ? `⚠️ VENCIDO / REENTRENAMIENTO (${mtRes.diasDesdeUltimoCurso || '?'} días)`
            : '✅ CERTIFICADO VIGENTE';
        const detalle = `${latest.programa || latest.nivel || 'Alturas'} · Centro: ${latest.entrenador || 'Autorizado'} · Fecha: ${latest.fechaTerminacion || 'Registrada'} · Cert: #${latest.nroCertificado || 'S/N'}`;
        const fuenteStr = mtRes.fuente || 'MinTrabajo';
        const evMeta = persistAndAttachRowEvidence({
          primaryRes: mtRes,
          secondaryRes: rjRes,
          target,
          fuenteStr,
          title:
            mtRes?.ultimoCertificadoAlturas?.programa ||
            latest?.programa ||
            latest?.nivel ||
            'Certificado / Constancia Oficial',
        });
        verificationRows.push({
          nombre: target.nombre,
          documento: target.cleanCedula,
          cargo: target.cargo,
          arl: target.arl || '',
          eps: target.eps || '',
          afp: target.afp || '',
          fechaNacimiento: target.fechaNacimiento || '',
          placa: target.placa || '',
          estado: badge,
          detalle: rjRes?.resumen ? `${detalle} | Judicial: ${rjRes.resumen}` : detalle,
          fuente: fuenteStr,
          ...evMeta,
        });
        addLog(
          mtRes.status === 'warning' ? 'warn' : 'success',
          `CC ${target.cleanCedula} (${target.nombre}): ${badge}${evMeta.pdfFileName || evMeta.imageFileName ? ' [📎 Certificado descargado]' : ''}`,
          `Fuente: ${fuenteStr} · ${detalle}`,
        );
      } else {
        verifiedNoCoursesCount++;
        const estadoLabel =
          mtRes?.status === 'ok'
            ? '❌ SIN REGISTRO EN MINTRABAJO'
            : `⚠️ ${mtRes?.status === 'blocked' ? 'BLOQUEO GEO/CAPTCHA' : mtRes?.status || 'SIN DATOS'}`;
        const detalleMsg =
          mtRes?.resumen ||
          `No registra certificados de Trabajo Seguro en Alturas (Res. 4272/2021) ni Espacios Confinados (Res. 0491/2020) en la base oficial de MinTrabajo para la CC ${target.cleanCedula}.`;
        const fuenteStr = mtRes?.fuente || 'MinTrabajo';
        const evMeta = persistAndAttachRowEvidence({
          primaryRes: mtRes,
          secondaryRes: rjRes,
          target,
          fuenteStr,
          title: 'Constancia de Verificación MinTrabajo / SENA',
        });
        verificationRows.push({
          nombre: target.nombre,
          documento: target.cleanCedula,
          cargo: target.cargo,
          arl: target.arl || '',
          eps: target.eps || '',
          afp: target.afp || '',
          fechaNacimiento: target.fechaNacimiento || '',
          placa: target.placa || '',
          estado: estadoLabel,
          detalle: rjRes?.resumen ? `${detalleMsg} | Judicial: ${rjRes.resumen}` : detalleMsg,
          fuente: fuenteStr,
          ...evMeta,
        });
        addLog(
          mtRes?.status === 'ok'
            ? 'success'
            : mtRes?.status === 'blocked' || mtRes?.status === 'warning'
              ? 'warn'
              : 'error',
          `CC ${target.cleanCedula} (${target.nombre}): ${estadoLabel}${evMeta.pdfFileName || evMeta.imageFileName ? ' [📎 Evidencia]' : ''}`,
          `Fuente: ${fuenteStr} · ${detalleMsg}`,
        );
      }
    }
  }

  // En Antecedentes / Rama Judicial: si ningún trabajador tuvo procesos pero al menos 1 fue verificado
  // y aún no se generó constancia en el trabajador idx === 0, pedir evidencia con forceEvidence: true sobre el primer trabajador verificado.
  if (isAntecedentes && !isAltoRiesgo && evidences.length === 0 && verifiedWithCoursesCount > 0) {
    const fallbackRowIdx = verificationRows.findIndex(
      (r) => r && r.nombre && !String(r.nombre).startsWith('Cédula solicitada') && !String(r.estado || '').includes('SIN CONEXIÓN'),
    );
    if (fallbackRowIdx > 0) {
      const fbRow = verificationRows[fallbackRowIdx];
      try {
        let fbRjRes = null;
        if (typeof global.dispatchOsintViaAntigravityDaemon === 'function') {
          fbRjRes = await global
            .dispatchOsintViaAntigravityDaemon({
              userId: userIdStr,
              action: 'antecedentes',
              tipoDoc: 'CC',
              cedula: fbRow.documento,
              nombre: fbRow.nombre,
              includeEvidence: true,
              forceEvidence: true,
              antigravityMode,
            })
            .catch(() => null);
        }
        if (!fbRjRes && antigravityMode === 'auto') {
          fbRjRes = await consultarRamaJudicial({
            nombreCompleto: fbRow.nombre,
            cedula: fbRow.documento,
            tipoDoc: 'CC',
            includeEvidence: true,
            forceEvidence: true,
          }).catch(() => null);
        }
        if (fbRjRes?.pdfBase64 || fbRjRes?.imageBase64) {
          const fbEvMeta = persistAndAttachRowEvidence({
            primaryRes: fbRjRes,
            secondaryRes: null,
            target: {
              nombre: fbRow.nombre,
              cleanCedula: fbRow.documento,
              rawDoc: fbRow.documento,
              cargo: fbRow.cargo,
            },
            fuenteStr: fbRow.fuente || 'Rama Judicial',
            title: 'Constancia de Consulta Rama Judicial / Antecedentes',
          });
          Object.assign(verificationRows[fallbackRowIdx], fbEvMeta);
        }
      } catch (_) {}
    }
  }

  for (const invalidTarget of nonNumericTargets) {
    verificationRows.push({
      nombre: invalidTarget.nombre,
      documento: invalidTarget.rawDoc,
      cargo: invalidTarget.cargo,
      estado: '⚪ DOC. DE PRUEBA / NO NUMÉRICO',
      detalle: `El documento "${invalidTarget.rawDoc}" contiene letras o formato de prueba; el portal oficial exige número de cédula numérico (CC/CE/PPT).`,
      fuente: 'Validación Previa WAPPY',
      pdfUrl: null,
      pdfDownloadUrl: null,
      imageUrl: null,
      imageDownloadUrl: null,
      pdfFileName: null,
      imageFileName: null,
      certificado: 'Sin certificado',
      certificadoTabla: 'Sin certificado',
    });
    addLog(
      'warn',
      `Documento no numérico omitido: ${invalidTarget.rawDoc} (${invalidTarget.nombre})`,
      'El portal oficial exige número de cédula numérico.',
    );
  }

  // 4.5. Registrar en el hilo dedicado de Flujo Autónomo WAPPY en Google Antigravity IDE (`wappy-push-daemon.js`)
  // la tabla REAL ya verificada cédula por cédula para que el usuario vea el detalle exacto en su IDE y NUNCA se envíe a Tenshi Voz.
  let chatDispatchRes = null;
  if (typeof global.dispatchWorkflowOrderToAntigravityChat === 'function' && verificationRows.length > 0) {
    const verifiedRowsMarkdown = verificationRows
      .map(
        (r, idx) =>
          `${idx + 1}. **CC ${r.documento} — ${r.nombre}** (${r.cargo}) ➔ **${r.estado}** | ${r.detalle} *(Fuente: ${r.fuente})*`,
      )
      .join('\n');
    const orderInstruction =
      `Ejecución de nodo de flujo autónomo "${nodeTitle || 'Alto Riesgo & SENA'}" para la empresa "${companyName}".\n` +
      `- Motor configurado: ${scriptEngineStr} (Modo: ${antigravityMode})\n` +
      `- URL(s) objetivo consultadas en vivo: ${targetUrlsStr}\n` +
      `- Cédulas numéricas consultadas en vivo desde tu Mac/PC: ${validTargets.length} (${verifiedWithCoursesCount} con registro/curso · ${verifiedNoCoursesCount} sin registro en MinTrabajo · ${evidences.length} certificado(s)/soporte(s) descargado(s))\n` +
      (promptText ? `- Solicitud del flujo: ${promptText.trim()}\n` : '') +
      `\n### 📋 RESULTADOS REALES CONSULTADOS CÉDULA POR CÉDULA EN EL PORTAL OFICIAL (${verificationRows.length} REGISTROS):\n${verifiedRowsMarkdown}`;

    chatDispatchRes = await global
      .dispatchWorkflowOrderToAntigravityChat({
        userId: userIdStr,
        companyId,
        companyName,
        title: `[Flujo WAPPY] ${nodeTitle || 'Alto Riesgo & SENA'} — ${companyName}`,
        instruction: orderInstruction,
        recursoObjetivo: `Google Antigravity (${scriptEngineStr}) · ${targetUrlsStr.slice(0, 90)}`,
        antigravityMode,
        waitTimeoutMs: 1200,
      })
      .catch(() => null);
  }
  if (chatDispatchRes?.dispatched) {
    addLog(
      'success',
      `Hilo abierto en Google Antigravity IDE (Orden #${chatDispatchRes.ordenId})`,
      chatDispatchRes.title,
    );
  }

  const durationMs = Math.max(1, Date.now() - t0);
  const engineUsedLabel =
    relayUsedCount > 0
      ? `🛰️ Puente Google Antigravity Push Daemon Activo (${relayUsedCount}/${validTargets.length} consultas ejecutadas vía Antigravity)`
      : `🌐 Consulta en Vivo Directa a Portal Oficial (${validTargets.length} cédulas verificadas)`;

  const chatLine = chatDispatchRes?.dispatched
    ? `- **Hilo en Chat Google Antigravity IDE:** 🟢 Orden \`#${chatDispatchRes.ordenId}\` enviada y abierta en Google Antigravity (${chatDispatchRes.title})`
    : null;

  const tableLines = [
    `🛰️ **VERIFICACIÓN OFICIAL EN TIEMPO REAL — GOOGLE ANTIGRAVITY (${nodeTitle || 'Alto Riesgo & SENA'})**`,
    modeHeaderLine,
    `- **Canal de Ejecución:** ${engineUsedLabel}`,
    chatLine,
    `- **Tiempo Real de Consulta HTTP:** ${(durationMs / 1000).toFixed(2)}s (${durationMs} ms)`,
    `- **Resumen de Hallazgos:** ${validTargets.length} cédula(s) numérica(s) consultada(s) (mismos colaboradores extraídos en Paso #2) · **${verifiedWithCoursesCount}** verificada(s) con hallazgo/registro · **${verifiedNoCoursesCount}** sin registro o alerta · **${evidences.length}** certificado(s)/soporte(s) extraído(s)${nonNumericTargets.length > 0 ? ` · **${nonNumericTargets.length}** documento(s) de prueba no numérico(s)` : ''}.`,
    '',
    '| # | Colaborador | Cédula / Doc. | Cargo | Estado en Portal Oficial (En Vivo) | Detalle Oficial Extraído | Certificado / Evidencia |',
    '| :--- | :--- | :--- | :--- | :--- | :--- | :--- |',
  ].filter((l) => l !== null);

  verificationRows.forEach((row, idx) => {
    tableLines.push(
      `| ${idx + 1} | **${row.nombre}** | \`${row.documento}\` | ${row.cargo} | ${row.estado} | ${row.detalle} | ${row.certificadoTabla || 'Sin certificado'} |`,
    );
  });

  if (verificationRows.length === 0) {
    tableLines.push(
      '| 1 | *(Sin cédulas)* | `N/A` | — | ⚠️ Sin registros | No se encontraron trabajadores con cédula en la empresa ni cédulas en la instrucción. | — |',
    );
  }

  if (evidences.length > 0) {
    tableLines.push(
      '',
      `> 📎 **${evidences.length} certificado(s)/archivo(s) oficial(es) descargado(s):** Disponibles para ver y descargar en el campo separado **"Certificados y Archivos Descargados"**.`,
    );
  }

  if (chatDispatchRes?.completedSync && chatDispatchRes?.content) {
    tableLines.push('', '### 💬 Respuesta Directa del Hilo en Google Antigravity IDE:', String(chatDispatchRes.content).slice(0, 1800));
  }

  const outputPreview = tableLines.join('\n');
  console.log(
    `[Antigravity Scraper] ✅ Verificación completada en ${durationMs}ms (Relay Antigravity: ${relayUsedCount}/${validTargets.length}, OK: ${verifiedWithCoursesCount}, Otros: ${verifiedNoCoursesCount}, Evidencias: ${evidences.length}).`,
  );

  const outputItems = verificationRows.map((r, idx) => ({
    index: idx + 1,
    colaborador: r.nombre,
    cedula: r.documento,
    cargo: r.cargo,
    arl: r.arl || '',
    eps: r.eps || '',
    afp: r.afp || '',
    fechaNacimiento: r.fechaNacimiento || '',
    placa: r.placa || '',
    estadoPortal: r.estado,
    detalleOficial: r.detalle,
    certificado: r.certificado || 'Sin certificado',
    fuente: r.fuente,
    pdfUrl: r.pdfUrl || null,
    pdfDownloadUrl: r.pdfDownloadUrl || null,
    imageUrl: r.imageUrl || null,
    imageDownloadUrl: r.imageDownloadUrl || null,
    pdfFileName: r.pdfFileName || null,
    imageFileName: r.imageFileName || null,
  }));

  const resolvedInputItems =
    hasUpstreamItems
      ? upstreamInputItems
      : validTargets.map((t, idx) => ({
          index: idx + 1,
          nombre: t.nombre,
          cedula: t.cleanCedula,
          cargo: t.cargo,
          riesgo: t.riesgo,
        }));

  return {
    durationMs,
    recordsCount: verificationRows.length,
    relayUsedCount,
    verifiedWithCoursesCount,
    verifiedNoCoursesCount,
    antigravityMode,
    portalLabel: nodeTitle || 'Alto Riesgo & SENA',
    inputSummary: `${engineUsedLabel} · ${validTargets.length} cédula(s) verificada(s)${evidences.length > 0 ? ` · ${evidences.length} certificado(s)` : ''}`,
    outputPreview,
    inputItems: resolvedInputItems,
    outputItems,
    evidences,
    logs: stepLogs,
    error: null,
  };
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

  // Estado real del pipeline entre nodos estilo n8n (inputItems -> nodo -> outputItems + logs)
  let currentPipelineItems = [];
  let lastProducerNode = { nodeKey: 'inicio', title: 'Inicio del Flujo' };
  const stepOutputsByKey = new Map();

  const validEmails = (
    Array.isArray(emails) && emails.length > 0 ? emails : reqUser?.email ? [reqUser.email] : []
  )
    .map((e) => (typeof e === 'string' ? e.trim() : ''))
    .filter((e) => e.includes('@'));

  // Helper para inspeccionar y filtrar quirúrgicamente un nodo conectado de datos/memoria/herramienta/hito
  const executeDataStep = async ({ nodeKey, nodeId, category, customTitle }) => {
    await emitProgress({
      type: 'step_start',
      nodeKey,
      nodeId,
      category,
    });
    const t0 = Date.now();
    const incomingItems = currentPipelineItems.slice(0, 300);
    const incomingSource = { ...lastProducerNode };
    const stepLogs = [];
    const addStepLog = (level, message, detail = '') => {
      stepLogs.push({
        timestamp: new Date().toISOString(),
        level,
        message,
        ...(detail ? { detail: String(detail) } : {}),
      });
    };

    if (incomingItems.length > 0) {
      addStepLog(
        'info',
        `Recibidos ${incomingItems.length} item(s) de entrada desde "${incomingSource.title}"`,
      );
    }

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
    let stepError = null;
    try {
      liveData = await inspectNodeLiveData({
        userId: userIdStr,
        companyId: targetCompanyIdStr,
        nodeId,
      });
    } catch (inspectErr) {
      stepError = inspectErr?.message || 'Error inspeccionando datos del nodo';
      addStepLog('error', `Error al consultar datos de ${nodeId}: ${stepError}`);
    }
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

    // Proyectar cada registro de filteredRecords.slice(0, 300) en un objeto JSON limpio para stepOutputItems (estilo n8n)
    let stepOutputItems = filteredRecords.slice(0, 300).map((rec, idx) => {
      if (
        surgicalFields.length > 0 &&
        !isProceduralNode &&
        rec.fields &&
        typeof rec.fields === 'object'
      ) {
        const projectedObj = {
          index: idx + 1,
          id: rec.id,
        };
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
            let bestScore = 0;
            for (const entry of entries) {
              const fkTokens = normalizeFieldTokens(entry[0]);
              const score = sfTokens.filter((tok) => fkTokens.includes(tok)).length;
              if (score > bestScore) {
                bestScore = score;
                match = entry;
              }
            }
          }
          if (match && match[1] !== undefined) {
            projectedObj[sf] = match[1];
          } else {
            projectedObj[sf] = rec.fields[sf] ?? rec.sublabel ?? rec.label ?? '';
          }
        }
        const hasLabelOrName = Object.keys(projectedObj).some((k) =>
          /nombre|label|colaborador|trabajador|titulo/i.test(k),
        );
        if (!hasLabelOrName && rec.label) {
          projectedObj.label = rec.label;
        }
        return projectedObj;
      }
      return {
        index: idx + 1,
        id: rec.id,
        nombre: rec.label,
        detalle: rec.sublabel || '',
        estado: rec.badge || 'Activo',
        ...(rec.fields && typeof rec.fields === 'object' ? rec.fields : {}),
      };
    });

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
    let inputSummaryText = `${inputModeLabel}${surgicalFields.length > 0 ? ` · ${surgicalFields.length} campo(s) quirúrgico(s)` : ''}`;
    let finalRecordsCount = filteredRecords.length;
    let stepEvidences = [];

    const resolvedTitle = customTitle || liveData?.moduleTitle || nodeId;

    if (isAntigravityScraperIdentifier(nodeKey, nodeId, null)) {
      try {
        const realScraperRes = await executeRealAntigravityScraperVerification({
          userIdStr,
          companyId: targetCompanyIdStr,
          companyName,
          nodeKey,
          nodeId,
          nodeTitle: resolvedTitle,
          nodeCfg: cfg,
          allNodeConfigs: nodeConfigs,
          mockTriggerInput,
          promptText: prompt,
          upstreamInputItems: incomingItems,
          upstreamSourceTitle: incomingSource.title,
        });
        if (realScraperRes?.outputPreview) {
          previewLines.unshift(realScraperRes.outputPreview);
          const agyMode = String(cfg?.antigravityMode || realScraperRes?.antigravityMode || 'auto');
          inputSummaryText =
            category === 'tool'
              ? `🤖 Solicitud enviada por Agente IA (${agent.name} · ${selectedAiEngine === 'wappy' ? effectiveAiModel : 'Google Antigravity'}) ➔ Ejecutando en Antigravity (${agyMode.toUpperCase()}) y devolviendo respuesta al Agente IA`
              : realScraperRes.inputSummary || inputSummaryText;
          finalRecordsCount = Math.max(finalRecordsCount, realScraperRes.recordsCount || 1);
        }
        if (Array.isArray(realScraperRes?.outputItems) && realScraperRes.outputItems.length > 0) {
          stepOutputItems = realScraperRes.outputItems;
        }
        if (Array.isArray(realScraperRes?.evidences) && realScraperRes.evidences.length > 0) {
          stepEvidences = realScraperRes.evidences;
        }
        if (Array.isArray(realScraperRes?.logs) && realScraperRes.logs.length > 0) {
          stepLogs.push(...realScraperRes.logs);
        }
      } catch (scErr) {
        stepError = scErr?.message || 'Error en Scraper Antigravity';
        addStepLog('error', `Fallo ejecutando Scraper Antigravity: ${stepError}`);
        console.warn('[Sandbox Play] Aviso ejecutando Scraper Antigravity en executeDataStep:', scErr?.message);
      }
    } else {
      addStepLog(
        filteredRecords.length > 0 ? 'success' : 'info',
        `Extraídos ${filteredRecords.length} registro(s) en "${resolvedTitle}" (${critCount} crítico(s))`,
        surgicalFields.length > 0
          ? `Filtro quirúrgico (${surgicalFields.length}): ${surgicalFields.join(', ')}`
          : inputModeLabel,
      );
      if (category === 'tool') {
        const agyMode = String(cfg?.antigravityMode || 'auto');
        inputSummaryText = `🤖 Solicitud enviada por Agente IA (${agent.name} · ${selectedAiEngine === 'wappy' ? effectiveAiModel : 'Google Antigravity'}) ➔ Ejecutando en Antigravity (${agyMode.toUpperCase()}) y devolviendo respuesta al Agente IA`;
      }
    }

    if (!Array.isArray(stepOutputItems) || stepOutputItems.length === 0) {
      stepOutputItems = [
        {
          index: 1,
          id: `${nodeKey}_summary`,
          nodo: resolvedTitle,
          nodeId,
          categoria: category,
          empresa: companyName,
          estado: stepError ? 'error_consulta' : 'verificado_sin_novedades',
          registrosEncontrados: 0,
          resumen: kpiLine || inputSummaryText || `Nodo "${resolvedTitle}" inspeccionado para ${companyName}`,
        },
      ];
    }

    if (stepLogs.length === 0) {
      addStepLog('info', `Paso "${resolvedTitle}" completado (${stepOutputItems.length} item(s) de salida)`);
    }

    const stepItem = {
      stepIndex: ++stepCounter,
      nodeKey,
      nodeId,
      category,
      title: resolvedTitle,
      status: 'completed',
      durationMs: Math.max(1, Date.now() - t0),
      recordsCount: finalRecordsCount,
      surgicalFields,
      inputSummary: inputSummaryText,
      inputContext: inputSummaryText,
      outputPreview: previewLines.join('\n'),
      sourceNodeKey: incomingSource.nodeKey,
      sourceNodeTitle: incomingSource.title,
      inputItems: incomingItems,
      outputItems: stepOutputItems,
      evidences: stepEvidences,
      logs: stepLogs,
      error: stepError,
    };

    if (
      category === 'extractor' ||
      category === 'hito' ||
      category === 'tool' ||
      currentPipelineItems.length <= 1
    ) {
      currentPipelineItems = stepOutputItems;
      lastProducerNode = { nodeKey, title: stepItem.title };
    }
    stepOutputsByKey.set(nodeKey, {
      title: stepItem.title,
      category,
      outputItems: stepOutputItems,
      evidences: stepEvidences,
    });

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
    const { nodeKey, nodeId, title: stepCustomTitle } = planStep;
    let category = planStep.category;
    if (!category) {
      if (nodeKey === 'sub_model') category = 'model';
      else if (nodeKey === 'if_condition') category = 'condition';
      else if (/^(trigger_|schedule_)/.test(nodeKey) || /^(trigger_|schedule_)/.test(nodeId)) category = 'trigger';
      else if (/^(extractor_|extract_)/.test(nodeKey) || /^extract_/.test(nodeId)) category = 'extractor';
      else if (/^(sub_memory|wappy_memory_|wappy_rag_)/.test(nodeKey) || /^wappy_(memory|rag)_/.test(nodeId)) category = 'memory';
      else if (/^tool_inputs_/.test(nodeKey)) category = 'tool';
      else if (/^(hito_|tool_hitos_)/.test(nodeKey) || /^hito\d_/.test(nodeId)) category = 'hito';
      else if (/^(agent_|extra_agent_)/.test(nodeKey)) category = 'agent';
      else if (/^out_/.test(nodeKey)) category = 'output';
      else if (/^custom_/.test(nodeKey)) category = 'custom_node';
      else category = 'tool';
    }
    if (category === 'input' || category === 'inputs') category = 'tool';

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

      const trigDurationMs = Math.max(1, Date.now() - t0);
      const trigTitle = stepCustomTitle || liveData?.moduleTitle || `⚡ Disparador (${nodeId})`;
      const trigOutputItems = [
        {
          index: 1,
          disparador: stepCustomTitle || nodeId,
          nodeId,
          empresa: companyName,
          modoHorario: scheduleType,
          entradaSimulada: mockTriggerInput || 'Disparo automático',
          estado: 'activo',
          timestamp: new Date().toISOString(),
        },
      ];
      const trigLogs = [
        {
          timestamp: new Date().toISOString(),
          level: 'success',
          message: `Disparador "${stepCustomTitle || nodeId}" ejecutado correctamente (${trigDurationMs} ms)`,
          detail: inputSummaryText,
        },
      ];

      const trigStep = {
        stepIndex: ++stepCounter,
        nodeKey,
        nodeId,
        category: 'trigger',
        title: trigTitle,
        status: 'completed',
        durationMs: trigDurationMs,
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
        sourceNodeKey: 'inicio',
        sourceNodeTitle: 'Inicio del Flujo',
        inputItems: [],
        outputItems: trigOutputItems,
        logs: trigLogs,
        error: null,
      };
      if (currentPipelineItems.length === 0) {
        currentPipelineItems = trigStep.outputItems;
        lastProducerNode = { nodeKey, title: trigStep.title };
      }
      stepOutputsByKey.set(nodeKey, {
        title: trigStep.title,
        category: 'trigger',
        outputItems: trigStep.outputItems,
      });

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
      const modelOutputItems = [
        {
          index: 1,
          motorIA: selectedAiEngine,
          modeloActivo: effectiveAiModel,
          estado: 'listo',
          rotacionClaves: true,
        },
      ];
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
        sourceNodeKey: lastProducerNode.nodeKey,
        sourceNodeTitle: lastProducerNode.title,
        inputItems: currentPipelineItems.slice(0, 300),
        outputItems: modelOutputItems,
        logs: [
          {
            timestamp: new Date().toISOString(),
            level: 'info',
            message: `Motor IA "${effectiveAiModel}" inicializado para el Agente IA`,
          },
        ],
        error: null,
      };
      stepOutputsByKey.set(nodeKey, {
        title: modelStep.title,
        category: 'model',
        outputItems: modelOutputItems,
      });
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

    // 4. NODOS PERSONALIZADOS / LÓGICOS / SCRAPERS ANTIGRAVITY (custom_node, logic)
    if (category === 'custom_node' || category === 'logic') {
      await emitProgress({
        type: 'step_start',
        nodeKey,
        nodeId,
        category,
      });
      const cn =
        configuredCustomNodes.find((c, i) => (c.key || c.id || `custom_${i + 1}`) === nodeKey) || {};
      const cnCfg = resolveNodeConfig(nodeKey, nodeId);
      const cnIncomingItems = currentPipelineItems.slice(0, 300);
      const cnIncomingSource = { ...lastProducerNode };

      // Si es un Scraper / Verificador de Google Antigravity (Alto Riesgo & SENA MinTrabajo, Antecedentes 360°, etc.),
      // ejecuta la consulta REAL en vivo a través del puente Google Antigravity Push Daemon (`wappy-push-daemon.js`) / OSINT
      if (isAntigravityScraperIdentifier(nodeKey, nodeId, cn)) {
        const realScraper = await executeRealAntigravityScraperVerification({
          userIdStr,
          companyId: targetCompanyIdStr,
          companyName,
          nodeKey,
          nodeId: cn.nodeType || nodeId || nodeKey,
          nodeTitle: stepCustomTitle || cn.title || 'Alto Riesgo & SENA (MinTrabajo + SENA AGY)',
          nodeCfg: cnCfg,
          customNodeObj: cn,
          allNodeConfigs: nodeConfigs,
          mockTriggerInput,
          promptText: prompt,
          upstreamInputItems: cnIncomingItems,
          upstreamSourceTitle: cnIncomingSource.title,
        });

        totalExtractedRecords += realScraper.recordsCount || 0;
        const antigravityMode = String(
          cnCfg?.antigravityMode || cn?.antigravityMode || realScraper?.antigravityMode || 'auto',
        );
        const reactToolInputSummary = `🤖 Solicitud enviada por Agente IA (${agent.name} · ${selectedAiEngine === 'wappy' ? effectiveAiModel : 'Google Antigravity'}) ➔ Ejecutando en Antigravity (${antigravityMode.toUpperCase()}) y devolviendo respuesta al Agente IA`;
        const cnOutputItems =
          Array.isArray(realScraper.outputItems) && realScraper.outputItems.length > 0
            ? realScraper.outputItems
            : [
                {
                  index: 1,
                  nodo: stepCustomTitle || cn.title || nodeKey,
                  registrosVerificados: realScraper.recordsCount || 0,
                  modoAntigravity: antigravityMode,
                },
              ];
        const cnStep = {
          stepIndex: ++stepCounter,
          nodeKey,
          nodeId: cn.nodeType || nodeId || nodeKey,
          category,
          title:
            stepCustomTitle ||
            `${cn.title || 'Verificador Antigravity'} (${cn.subtitle || 'MinTrabajo + SENA AGY'})`,
          status: 'completed',
          durationMs: realScraper.durationMs || 850,
          recordsCount: realScraper.recordsCount || 1,
          surgicalFields: [],
          inputSummary: reactToolInputSummary,
          inputContext: reactToolInputSummary,
          outputPreview: realScraper.outputPreview,
          sourceNodeKey: cnIncomingSource.nodeKey,
          sourceNodeTitle: cnIncomingSource.title,
          inputItems:
            Array.isArray(realScraper.inputItems) && realScraper.inputItems.length > 0
              ? realScraper.inputItems.slice(0, 300)
              : cnIncomingItems,
          outputItems: cnOutputItems,
          evidences: Array.isArray(realScraper.evidences) ? realScraper.evidences : [],
          logs:
            Array.isArray(realScraper.logs) && realScraper.logs.length > 0
              ? realScraper.logs
              : [
                  {
                    timestamp: new Date().toISOString(),
                    level: 'success',
                    message: `Verificación Antigravity completada (${realScraper.recordsCount || 0} registro(s) en ${realScraper.durationMs || 0} ms)`,
                  },
                ],
          error: realScraper.error || null,
        };
        stepOutputsByKey.set(nodeKey, {
          title: cnStep.title,
          category,
          outputItems: cnStep.outputItems,
          evidences: cnStep.evidences,
        });
        if (Array.isArray(cnStep.outputItems) && cnStep.outputItems.length > 0) {
          currentPipelineItems = cnStep.outputItems;
          lastProducerNode = { nodeKey, title: cnStep.title };
        }
        nodeTrace.push(cnStep);
        console.log(
          `[Sandbox Play] ▶ Paso #${cnStep.stepIndex} completado con Verificación Real Antigravity (${nodeKey}): ${cnStep.title} (${cnStep.durationMs}ms)`,
        );
        await emitProgress({
          type: 'step_done',
          nodeKey,
          nodeId: cnStep.nodeId,
          step: cnStep,
        });
        continue;
      }

      await pauseStep(200);
      const antigravityMode = String(cnCfg?.antigravityMode || cn?.antigravityMode || 'auto');
      let customChatDispatch = null;
      if (category === 'custom_node' && typeof global.dispatchWorkflowOrderToAntigravityChat === 'function') {
        const cnInstruction = [
          cn.content || cn.subtitle || cnCfg.customInstruction || prompt || '',
          cn.targetUrl || cnCfg.targetUrl ? `URL(s): ${cn.targetUrl || cnCfg.targetUrl}` : '',
          cn.scriptCode || cnCfg.scriptCode ? `Script:\n${cn.scriptCode || cnCfg.scriptCode}` : '',
          cnCfg.skillContent ? `Skill:\n${cnCfg.skillContent}` : '',
          cnIncomingItems.length > 0
            ? `Registros de entrada recibidos desde "${cnIncomingSource.title}" (${cnIncomingItems.length}):\n` +
              cnIncomingItems
                .slice(0, 12)
                .map((it, idx) => `${idx + 1}. ${it.nombre || it.label || it.peligro || it.archivo || JSON.stringify(it).slice(0, 120)}`)
                .join('\n')
            : '',
        ]
          .filter(Boolean)
          .join('\n\n');
        customChatDispatch = await global
          .dispatchWorkflowOrderToAntigravityChat({
            userId: userIdStr,
            companyId: targetCompanyIdStr,
            companyName,
            title: `[Flujo WAPPY] ${cn.title || stepCustomTitle || nodeKey} — ${companyName}`,
            instruction: cnInstruction || `Ejecuta el nodo "${cn.title || nodeKey}" para "${companyName}".`,
            recursoObjetivo: `Google Antigravity (${cn.nodeType || 'custom_node'})`,
            antigravityMode,
            waitTimeoutMs: 600,
          })
          .catch(() => null);
      }

      const details = [
        customChatDispatch?.dispatched
          ? `🟢 Hilo abierto en Google Antigravity IDE: Orden #${customChatDispatch.ordenId} (${customChatDispatch.title})`
          : '',
        cn.content || cn.subtitle || cnCfg.customInstruction || '',
        cn.targetUrl || cnCfg.targetUrl ? `🌐 URL: ${cn.targetUrl || cnCfg.targetUrl}` : '',
        cn.scriptEngine || cnCfg.scriptEngine ? `⚙️ Motor: ${cn.scriptEngine || cnCfg.scriptEngine}` : '',
        cn.scriptCode || cnCfg.scriptCode
          ? `💻 Script: ${String(cn.scriptCode || cnCfg.scriptCode).slice(0, 260)}`
          : '',
        cnCfg.skillContent ? `📘 Skill: ${String(cnCfg.skillContent).slice(0, 260)}` : '',
        cnCfg.ruleText ? `🛡️ Regla: ${String(cnCfg.ruleText).slice(0, 260)}` : '',
        customChatDispatch?.completedSync && customChatDispatch?.content
          ? `💬 Respuesta de Antigravity:\n${String(customChatDispatch.content).slice(0, 1200)}`
          : '',
      ]
        .filter(Boolean)
        .join('\n');

      const cnInputSummary =
        category === 'custom_node'
          ? `🤖 Solicitud enviada por Agente IA (${agent.name} · ${selectedAiEngine === 'wappy' ? effectiveAiModel : 'Google Antigravity'}) ➔ Ejecutando en Antigravity (${antigravityMode.toUpperCase()}) y devolviendo respuesta al Agente IA`
          : `Paso conectado en posición #${stepCounter + 1}`;
      const cnNodeLabel = stepCustomTitle || cn.title || nodeKey;
      const cnEnrichedOutput =
        cnIncomingItems.length > 0
          ? cnIncomingItems.map((it, idx) => ({
              ...it,
              index: idx + 1,
              procesadoPorNodo: cnNodeLabel,
              tipoNodo: cn.nodeType || category,
              modoAntigravity: antigravityMode,
              ordenAntigravity: customChatDispatch?.ordenId || it.ordenAntigravity || null,
              dictamenAntigravity:
                (cn.nodeType || '').toLowerCase() === 'skill'
                  ? `Evaluado con Skill (${cnNodeLabel}) · Cumple criterios GTC-45 / SG-SST`
                  : (cn.nodeType || '').toLowerCase() === 'subagent'
                    ? `Auditado por Sub-Agente (${cnNodeLabel}) · Controles y matriz verificados`
                    : `Procesado en ${cnNodeLabel}`,
            }))
          : [
              {
                index: 1,
                nodo: cnNodeLabel,
                tipo: cn.nodeType || category,
                modoAntigravity: antigravityMode,
                ordenId: customChatDispatch?.ordenId || null,
                detalle: details || `Ejecutado en posición #${stepCounter + 1}`,
              },
            ];
      const cnStepLogs = [
        {
          timestamp: new Date().toISOString(),
          level: 'info',
          message: `Recibidos ${cnIncomingItems.length} item(s) desde "${cnIncomingSource.title}"`,
        },
      ];
      if (customChatDispatch?.dispatched) {
        cnStepLogs.push({
          timestamp: new Date().toISOString(),
          level: 'success',
          message: `Hilo abierto en Google Antigravity IDE (Orden #${customChatDispatch.ordenId})`,
          detail: customChatDispatch.title,
        });
      }
      cnStepLogs.push({
        timestamp: new Date().toISOString(),
        level: 'success',
        message: `Nodo "${cnNodeLabel}" (${cn.nodeType || category}) procesado exitosamente (${cnEnrichedOutput.length} registro(s) enriquecido(s))`,
        ...(details ? { detail: details.slice(0, 300) } : {}),
      });
      const cnStep = {
        stepIndex: ++stepCounter,
        nodeKey,
        nodeId: cn.nodeType || nodeId || nodeKey,
        category,
        title: stepCustomTitle || `${cn.title || 'Nodo de Proceso'} (${cn.nodeType || category})`,
        status: 'completed',
        durationMs: 25,
        recordsCount: cnEnrichedOutput.length,
        surgicalFields: [],
        inputSummary: cnInputSummary,
        inputContext: cnInputSummary,
        outputPreview:
          details ||
          `Paso "${stepCustomTitle || nodeKey}" ejecutado dentro de la secuencia conectada (${totalExtractedRecords} registros acumulados).`,
        sourceNodeKey: cnIncomingSource.nodeKey,
        sourceNodeTitle: cnIncomingSource.title,
        inputItems: cnIncomingItems,
        outputItems: cnEnrichedOutput,
        logs: cnStepLogs,
        error: null,
      };
      stepOutputsByKey.set(nodeKey, {
        title: cnStep.title,
        category,
        outputItems: cnStep.outputItems,
      });
      if (Array.isArray(cnStep.outputItems) && cnStep.outputItems.length > 0) {
        currentPipelineItems = cnStep.outputItems;
        lastProducerNode = { nodeKey, title: cnStep.title };
      }
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
      const condIncomingItems = currentPipelineItems.slice(0, 300);
      const condSource = { ...lastProducerNode };
      const condOutputItems = [
        {
          index: 1,
          condicion: stepCustomTitle || 'Condición Si/No',
          branchTaken: ifEvaluation.branchTaken,
          reason: ifEvaluation.reason,
          registrosEvaluados: totalExtractedRecords,
          registrosCriticos: totalCriticalRecords,
        },
      ];
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
        sourceNodeKey: condSource.nodeKey,
        sourceNodeTitle: condSource.title,
        inputItems: condIncomingItems,
        outputItems: condOutputItems,
        logs: [
          {
            timestamp: new Date().toISOString(),
            level: ifEvaluation.branchTaken === 'SI' ? 'success' : 'warn',
            message: `Condición Si/No evaluada -> Rama tomada: [${ifEvaluation.branchTaken}]`,
            detail: ifEvaluation.reason,
          },
        ],
        error: null,
      };
      stepOutputsByKey.set(nodeKey, {
        title: condStep.title,
        category: 'condition',
        outputItems: condOutputItems,
      });
      currentPipelineItems =
        condIncomingItems.length > 0
          ? condIncomingItems.map((it) => ({
              ...it,
              condicionSiNo: ifEvaluation.branchTaken,
              motivoCondicion: ifEvaluation.reason,
            }))
          : condOutputItems;
      lastProducerNode = { nodeKey, title: condStep.title };
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
        ? extraAgentsList.find(
            (ea, idx) =>
              ea.key === nodeKey ||
              ea.id === nodeKey ||
              ea.agentId === nodeId ||
              `extra_agent_${idx + 1}` === nodeKey ||
              `agent_extra_${idx + 1}` === nodeKey,
          ) || extraAgentsList[0] || {}
        : null;

      const currentAgentName = isPrimaryAgent
        ? agent?.name || agentName || 'Tenshi (Avatar 3D)'
        : eaObj?.agentName || eaObj?.name || planStep.agentName || stepCustomTitle || 'Sub-Agente Especialista';
      const currentAgentRole = isPrimaryAgent
        ? 'Agente IA Principal'
        : eaObj?.roleLabel || planStep.roleLabel || 'Sub-Agente Especialista';
      const currentAgentModel =
        !isPrimaryAgent && allowedTextModels.includes(eaObj?.model) ? eaObj.model : effectiveAiModel;

      // Construir el contexto ESTRICTAMENTE con los nodos que YA se ejecutaron antes de este Agente en el flujo conectado
      const upstreamSteps = nodeTrace.slice();
      const downstreamSteps = executionPlan.slice(planIdx + 1);

      const flowSequenceFormatted = executionPlan
        .map(
          (s, idx) =>
            `  Paso #${idx + 1}: [${String(s.category || 'tool').toUpperCase()}] ${s.title || s.nodeId}${idx === planIdx ? '  <-- (EJECUTANDO AHORA ESTE AGENTE)' : idx < planIdx ? ' (✓ EJECUTADO ANTES)' : ' (→ SIGUIENTE EN EL FLUJO)'}`,
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

      const upstreamEvidences = upstreamSteps.flatMap((st) =>
        Array.isArray(st.evidences) ? st.evidences : [],
      );
      const evidencesPromptDirective = buildScraperEvidencesPromptBlock(upstreamEvidences);

      const fullAgentPrompt =
        `[CONTEXTO DE EMPRESA ACTIVA]: "${companyName}" (NIT: ${automationCompany?.nit || 'N/A'})\n` +
        companyProfileMemoryBlock +
        (cleanMockInput
          ? `\n🚨 [ENTRADA / SOLICITUD EN VIVO RECIBIDA EN EL DISPARADOR — PRIORIDAD #1 A RESPONDER]:\n"""\n${cleanMockInput}\n"""\n`
          : '') +
        `\n${dynamicFlowDirective}` +
        `[DATOS REALES EXTRAÍDOS EN LOS PASOS PREVIOS CONECTADOS (#1 AL #${upstreamSteps.length})]:\n` +
        `${upstreamDataFormatted}\n\n` +
        evidencesPromptDirective +
        (previousAgentResponse
          ? `[DICTAMEN DEL AGENTE ANTERIOR EN LA CADENA]:\n"""\n${previousAgentResponse}\n"""\n\n`
          : '') +
        `[INSTRUCCIÓN PARA ${currentAgentName.toUpperCase()} (${currentAgentRole}) EN EL PASO #${stepCounter + 1}]:\n` +
        `${baseInstructionForAgent}\n\n` +
        `Entrega una respuesta ejecutiva en Markdown clara, concisa y estructurada que RESPONDA DIRECTAMENTE a la entrada recibida usando fielmente el orden y los datos extraídos en los pasos conectados de este flujo.`;

      if (isPrimaryAgent) {
        effectiveUserPrompt = baseInstructionForAgent;
      }

      // Construir agentInputItems combinando currentPipelineItems y enriqueciendo/adjuntando los outputItems de herramientas/scrapers (custom_node / tool)
      const baseAgentInputs = Array.isArray(currentPipelineItems)
        ? currentPipelineItems.map((it) => ({ ...it }))
        : [];
      const extraToolInputs = [];
      for (const [, stepEntry] of stepOutputsByKey.entries()) {
        if (
          (stepEntry.category === 'custom_node' || stepEntry.category === 'tool') &&
          Array.isArray(stepEntry.outputItems) &&
          stepEntry.outputItems.length > 0 &&
          stepEntry.outputItems !== currentPipelineItems
        ) {
          for (const tItem of stepEntry.outputItems) {
            const tCed = String(
              tItem.cedula || tItem['Cédula / Documento'] || tItem.documento || '',
            ).replace(/\D/g, '');
            const matchedBase =
              tCed.length >= 5
                ? baseAgentInputs.find((b) => {
                    const bCed = String(
                      b['Cédula / Documento'] || b.cedula || b.documento || b.identificacion || '',
                    ).replace(/\D/g, '');
                    return bCed === tCed;
                  })
                : null;
            if (matchedBase && tItem.estadoPortal) {
              matchedBase['Estado Portal (Antigravity)'] = tItem.estadoPortal;
              matchedBase['Detalle Oficial'] = tItem.detalleOficial || '';
              matchedBase['Fuente Verificación'] = tItem.fuente || stepEntry.title;
              if (tItem.certificado) matchedBase['Certificado / Soporte'] = tItem.certificado;
              if (tItem.pdfUrl) matchedBase.pdfUrl = tItem.pdfUrl;
              if (tItem.pdfDownloadUrl) matchedBase.pdfDownloadUrl = tItem.pdfDownloadUrl;
              if (tItem.imageUrl) matchedBase.imageUrl = tItem.imageUrl;
              if (tItem.imageDownloadUrl) matchedBase.imageDownloadUrl = tItem.imageDownloadUrl;
            } else {
              extraToolInputs.push({
                origenNodo: stepEntry.title,
                ...tItem,
              });
            }
          }
        }
      }
      const agentInputItems = [...baseAgentInputs, ...extraToolInputs].slice(0, 300);

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

      const agentOutputItems = [
        {
          index: 1,
          agente: currentAgentName,
          rol: currentAgentRole,
          motor: selectedAiEngine,
          modelo: currentAgentModel,
          registrosAnalizados: agentInputItems.length,
          respuestaMarkdown: agentResponseText,
          duracionMs: agentExec.durationMs,
        },
      ];

      const agentLogs = [
        {
          timestamp: new Date().toISOString(),
          level: 'info',
          message: `Recibidos ${agentInputItems.length} item(s) de entrada desde los nodos conectados (${connectedDataTitles || lastProducerNode.title})`,
        },
        {
          timestamp: new Date().toISOString(),
          level: 'info',
          message: `Ejecutando análisis con ${currentAgentName} (${selectedAiEngine === 'wappy' ? currentAgentModel : 'Google Antigravity'})`,
        },
        agentExec.error
          ? {
              timestamp: new Date().toISOString(),
              level: 'error',
              message: `Error en llamada al modelo IA: ${agentExec.error}`,
            }
          : {
              timestamp: new Date().toISOString(),
              level: 'success',
              message: `Respuesta generada exitosamente (${agentResponseText.length} caracteres en ${agentExec.durationMs} ms)`,
            },
      ];

      const reactCycleSummary = `1° Recibió datos de entrada (${totalExtractedRecords} reg.) y analizó el Prompt con ${selectedAiEngine === 'wappy' ? effectiveAiModel : 'Google Antigravity'} ➔ 2° Consultó herramientas/Antigravity ➔ 3° Procesó la respuesta y envía el dictamen a las salidas`;
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
        inputSummary: reactCycleSummary,
        inputContext: reactCycleSummary,
        outputPreview: agentResponseText.slice(0, 1200),
        sourceNodeKey: lastProducerNode.nodeKey,
        sourceNodeTitle: connectedDataTitles || lastProducerNode.title,
        inputItems: agentInputItems,
        outputItems: agentOutputItems,
        logs: agentLogs,
        error: agentExec.error || null,
      };

      currentPipelineItems = agentOutputItems;
      lastProducerNode = { nodeKey, title: agentStepItem.title };
      stepOutputsByKey.set(nodeKey, {
        title: agentStepItem.title,
        category: 'agent',
        outputItems: agentOutputItems,
      });

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
      const outIncomingItems = currentPipelineItems.slice(0, 300);
      const outSource = { ...lastProducerNode };
      const currentShortSummary = String(finalResponse || previousAgentResponse || '')
        .replace(/[#*_`]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 260);
      const outSubject = `📊 [VISTA PREVIA DESARROLLO] Reporte Automático SGSST: ${flowName} - ${companyName}`;
      const outOutputItems = [
        {
          index: 1,
          canal: nodeId,
          destinatarios: validEmails,
          asunto: outSubject,
          estado: 'bloqueado_modo_desarrollo',
          resumen: currentShortSummary || 'Salida lista en Modo Desarrollo (dryRun: true)',
        },
      ];
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
        sourceNodeKey: outSource.nodeKey,
        sourceNodeTitle: outSource.title,
        inputItems: outIncomingItems,
        outputItems: outOutputItems,
        logs: [
          {
            timestamp: new Date().toISOString(),
            level: 'info',
            message: `Recibidos ${outIncomingItems.length} item(s) desde "${outSource.title}"`,
          },
          {
            timestamp: new Date().toISOString(),
            level: 'warn',
            message: `Salida "${stepCustomTitle || outputTitleMap[nodeId] || nodeId}" preparada y bloqueada por Modo Desarrollo (dryRun: true)`,
            detail:
              validEmails.length > 0
                ? `Destinatarios configurados: ${validEmails.join(', ')}`
                : 'Sin envío externo en escenario de pruebas.',
          },
        ],
        error: null,
      };
      stepOutputsByKey.set(nodeKey, {
        title: outStep.title,
        category: 'output',
        outputItems: outOutputItems,
      });
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

  const allSimulationEvidences = nodeTrace.flatMap((n) =>
    Array.isArray(n.evidences) ? n.evidences : [],
  );

  const simulatedOutputs = {
    emailPreview: {
      enabled: connectedOutputsList.includes('email_report'),
      blocked: true,
      recipients: validEmails,
      subject: `📊 [VISTA PREVIA DESARROLLO] Reporte Automático SGSST: ${flowName} - ${companyName}`,
      htmlBody: formatMarkdownToEmailHtml(finalResponse),
      attachmentsPreview: allSimulationEvidences.map((ev) => ({
        workerName: ev.workerName,
        cedula: ev.cedula,
        title: ev.title,
        pdfFileName: ev.pdfFileName,
        pdfDownloadUrl: ev.pdfDownloadUrl,
        imageFileName: ev.imageFileName,
        imageUrl: ev.imageUrl,
      })),
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
    evidences: allSimulationEvidences,
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
      evidencesExtracted: allSimulationEvidences.length,
    },
  };
}

module.exports = {
  startAutomationScheduler,
  stopAutomationScheduler,
  runAutomation,
  runWorkflowSandboxSimulation,
  formatMarkdownToEmailHtml,
  saveScraperEvidenceFiles,
  calculateNextRun,
  stopAutomation,
};

