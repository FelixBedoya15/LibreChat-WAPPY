const fs = require('fs');
const path = require('path');
const dns = require('dns');
const net = require('net');
const { Readable } = require('stream');
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
  collectStructuredWorkflowSourceData,
  resolveWorkflowHitoRole,
  extractWorkflowEntityDedupKey,
  normalizeInspectorNodeId,
} = require('~/server/services/workflowNodeInspectorService');
const { normalizeAnyDateYmd } = require('~/server/routes/sgsst/birthDateHelper');
const {
  extractStructuredFieldsFromDocuments,
  listPassiveCandidateMetadata,
} = require('~/server/services/aiDocumentExtractorService');

/**
 * Extrae el ID real de una carpeta o archivo de Google Drive desde URLs (`folders/<ID>`, `/d/<ID>`, `?id=<ID>`),
 * `'root'` o un ID puro de Google Drive (`^[a-zA-Z0-9_-]{20,}$`).
 */
function extractGoogleDriveId(input) {
  if (!input || typeof input !== 'string') return '';
  const cleaned = input.trim().replace(/^['"`]+|['"`]+$/g, '').trim();
  if (!cleaned) return '';
  if (cleaned.toLowerCase() === 'root') return 'root';

  const folderMatch = cleaned.match(/\/folders\/([a-zA-Z0-9_-]{10,})/i);
  if (folderMatch && folderMatch[1]) return folderMatch[1];

  const docMatch =
    cleaned.match(/\/(?:file|document|spreadsheets|presentation|forms)\/(?:u\/\d+\/)?d\/([a-zA-Z0-9_-]{10,})/i) ||
    cleaned.match(/\/d\/([a-zA-Z0-9_-]{15,})/i);
  if (docMatch && docMatch[1]) return docMatch[1];

  const queryIdMatch = cleaned.match(/[?&]id=([a-zA-Z0-9_-]{10,})/i);
  if (queryIdMatch && queryIdMatch[1]) return queryIdMatch[1];

  if (/^[a-zA-Z0-9_-]{20,}$/.test(cleaned)) {
    return cleaned;
  }
  return '';
}

/**
 * Carga defensiva del pipeline universal de Informes Oficiales HTML de Aplicativos Hito (Worker B).
 */
let _cachedHitoReportPipeline = null;
try {
  _cachedHitoReportPipeline = require('./hitoAppReportPipelineService');
} catch (_) {
  _cachedHitoReportPipeline = null;
}
function getHitoReportPipeline() {
  if (_cachedHitoReportPipeline) return _cachedHitoReportPipeline;
  try {
    _cachedHitoReportPipeline = require('./hitoAppReportPipelineService');
    return _cachedHitoReportPipeline;
  } catch (_) {
    return null;
  }
}

/**
 * Extensión en tiempo de carga de esquemas Mongoose (AutomationLog y Automation) para soportar
 * Compuerta Real de Aprobación Humana ('awaiting_approval', 'rejected', pendingApprovalPayload),
 * metadatos de disparadores por evento y deduplicación por gmailMessageId sin tocar modelos compartidos.
 */
(function extendAutomationSchemasForRealWorkflows() {
  try {
    if (AutomationLog?.schema) {
      const statusPath = AutomationLog.schema.path('status');
      if (statusPath) {
        for (const extraStatus of ['awaiting_approval', 'rejected']) {
          if (Array.isArray(statusPath.enumValues) && !statusPath.enumValues.includes(extraStatus)) {
            statusPath.enumValues.push(extraStatus);
          }
          if (Array.isArray(statusPath.options?.enum) && !statusPath.options.enum.includes(extraStatus)) {
            statusPath.options.enum.push(extraStatus);
          }
        }
      }
      const extraLogFields = {};
      if (!AutomationLog.schema.path('pendingApprovalPayload')) {
        extraLogFields.pendingApprovalPayload = { type: mongoose.Schema.Types.Mixed, default: null };
      }
      if (!AutomationLog.schema.path('approvedAt')) {
        extraLogFields.approvedAt = { type: Date, default: null };
      }
      if (!AutomationLog.schema.path('approvedBy')) {
        extraLogFields.approvedBy = { type: String, default: '' };
      }
      if (!AutomationLog.schema.path('rejectedAt')) {
        extraLogFields.rejectedAt = { type: Date, default: null };
      }
      if (!AutomationLog.schema.path('rejectedBy')) {
        extraLogFields.rejectedBy = { type: String, default: '' };
      }
      if (!AutomationLog.schema.path('rejectedReason')) {
        extraLogFields.rejectedReason = { type: String, default: '' };
      }
      if (!AutomationLog.schema.path('triggerSource')) {
        extraLogFields.triggerSource = { type: String, default: 'schedule_cron' };
      }
      if (!AutomationLog.schema.path('gmailMessageId')) {
        extraLogFields.gmailMessageId = { type: String, default: '', index: true };
      }
      if (!AutomationLog.schema.path('eventMetadata')) {
        extraLogFields.eventMetadata = { type: mongoose.Schema.Types.Mixed, default: null };
      }
      if (!AutomationLog.schema.path('executionTrace')) {
        extraLogFields.executionTrace = { type: mongoose.Schema.Types.Mixed, default: null };
      }
      if (!AutomationLog.schema.path('processedEntityKeys')) {
        extraLogFields.processedEntityKeys = { type: [String], default: [], index: true };
      }
      if (!AutomationLog.schema.path('dedupWindowUsed')) {
        extraLogFields.dedupWindowUsed = { type: String, default: '' };
      }
      if (!AutomationLog.schema.path('liveSteps')) {
        extraLogFields.liveSteps = { type: [mongoose.Schema.Types.Mixed], default: [] };
      }
      if (!AutomationLog.schema.path('activeStepNodeKey')) {
        extraLogFields.activeStepNodeKey = { type: String, default: null };
      }
      if (!AutomationLog.schema.path('completedNodeKeys')) {
        extraLogFields.completedNodeKeys = { type: [String], default: [] };
      }
      if (!AutomationLog.schema.path('blockedNodeKeys')) {
        extraLogFields.blockedNodeKeys = { type: [String], default: [] };
      }
      if (!AutomationLog.schema.path('skippedNodeKeys')) {
        extraLogFields.skippedNodeKeys = { type: [String], default: [] };
      }
      if (!AutomationLog.schema.path('currentStageLabel')) {
        extraLogFields.currentStageLabel = { type: String, default: '' };
      }
      if (!AutomationLog.schema.path('heartbeatAt')) {
        extraLogFields.heartbeatAt = { type: Date, default: Date.now, index: true };
      }
      if (!AutomationLog.schema.path('durationMs')) {
        extraLogFields.durationMs = { type: Number, default: 0 };
      }
      if (!AutomationLog.schema.path('modelUsed')) {
        extraLogFields.modelUsed = { type: String, default: '' };
      }
      if (!AutomationLog.schema.path('companyName')) {
        extraLogFields.companyName = { type: String, default: '' };
      }
      if (Object.keys(extraLogFields).length > 0) {
        AutomationLog.schema.add(extraLogFields);
        if (AutomationLog.prototype) {
          for (const fieldName of Object.keys(extraLogFields)) {
            if (!(fieldName in AutomationLog.prototype)) {
              Object.defineProperty(AutomationLog.prototype, fieldName, {
                get() {
                  return this.get(fieldName);
                },
                set(val) {
                  this.set(fieldName, val);
                },
                configurable: true,
                enumerable: true,
              });
            }
          }
        }
      }
    }

    if (Automation?.schema) {
      if (!Automation.schema.path('lastRunLogId')) {
        Automation.schema.add({
          lastRunLogId: { type: mongoose.Schema.Types.ObjectId, ref: 'AutomationLog', default: null },
        });
      }
      const lastRunStatusPath = Automation.schema.path('lastRunStatus');
      if (lastRunStatusPath) {
        for (const extraStatus of ['awaiting_approval', 'rejected']) {
          if (
            Array.isArray(lastRunStatusPath.enumValues) &&
            !lastRunStatusPath.enumValues.includes(extraStatus)
          ) {
            lastRunStatusPath.enumValues.push(extraStatus);
          }
          if (
            Array.isArray(lastRunStatusPath.options?.enum) &&
            !lastRunStatusPath.options.enum.includes(extraStatus)
          ) {
            lastRunStatusPath.options.enum.push(extraStatus);
          }
        }
      }
    }
  } catch (schemaExtErr) {
    console.warn('[AutomationScheduler] Aviso extendiendo esquemas de ejecución:', schemaExtErr?.message);
  }
})();

/**
 * Envuelve cualquier promesa externa o de base de datos con un timeout estricto para evitar bloqueos indefinidos.
 */
function withTimeout(promise, ms = 25000, label = 'operación') {
  let timerId = null;
  return Promise.race([
    Promise.resolve(promise),
    new Promise((_, reject) => {
      timerId = setTimeout(() => {
        reject(new Error(`Timeout (${Math.round(ms / 1000)}s) superado en ${label}`));
      }, ms);
    }),
  ]).finally(() => {
    if (timerId) clearTimeout(timerId);
  });
}

/**
 * Carga el Ledger Real Anti-Duplicados (`Remove Duplicates` estilo n8n) consultando las llaves
 * de entidades ya procesadas (`processedEntityKeys`) en corridas previas exitosas o esperando aprobación
 * dentro de la ventana temporal configurada (`24h`, `7d`, `30d`, `all`).
 */
async function loadProcessedEntityKeysForAutomation({
  automationId,
  nodeConfigs = {},
  excludeLogId = null,
} = {}) {
  const safeConfigs = nodeConfigs && typeof nodeConfigs === 'object' ? nodeConfigs : {};
  const dedupWindow = String(
    safeConfigs.sub_memory_wappy_memory_antiduplicate?.dedupWindow ||
      safeConfigs.sub_memory?.dedupWindow ||
      safeConfigs.wappy_memory_antiduplicate?.dedupWindow ||
      '7d',
  )
    .trim()
    .toLowerCase();

  let sinceDate = null;
  if (dedupWindow !== 'all' && dedupWindow !== 'forever' && dedupWindow !== '0') {
    if (dedupWindow === '24h' || dedupWindow === '1d') {
      sinceDate = new Date(Date.now() - 24 * 3600000);
    } else if (dedupWindow === '7d') {
      sinceDate = new Date(Date.now() - 7 * 24 * 3600000);
    } else if (dedupWindow === '30d') {
      sinceDate = new Date(Date.now() - 30 * 24 * 3600000);
    } else {
      const customMatch = dedupWindow.match(/^(\d+)\s*([hd])$/);
      if (customMatch) {
        const val = Number(customMatch[1]);
        const unitMs = customMatch[2] === 'h' ? 3600000 : 24 * 3600000;
        sinceDate = new Date(Date.now() - val * unitMs);
      } else {
        sinceDate = new Date(Date.now() - 7 * 24 * 3600000);
      }
    }
  }

  if (!automationId || !mongoose.Types.ObjectId.isValid(String(automationId))) {
    return { keysSet: new Set(), dedupWindow };
  }

  try {
    const query = {
      automation: automationId,
      status: { $in: ['success', 'awaiting_approval'] },
      ...(sinceDate ? { runAt: { $gte: sinceDate } } : {}),
      ...(excludeLogId && mongoose.Types.ObjectId.isValid(String(excludeLogId))
        ? { _id: { $ne: excludeLogId } }
        : {}),
    };
    const logs = await AutomationLog.find(query).select('processedEntityKeys runAt').lean();
    const flatKeys = [];
    for (const lg of logs || []) {
      if (Array.isArray(lg?.processedEntityKeys)) {
        for (const k of lg.processedEntityKeys) {
          const clean = String(k || '').trim();
          if (clean) flatKeys.push(clean);
        }
      }
    }
    return { keysSet: new Set(flatKeys), dedupWindow };
  } catch (err) {
    console.warn('[AutomationScheduler] Aviso consultando ledger anti-duplicados:', err?.message);
    return { keysSet: new Set(), dedupWindow };
  }
}

/**
 * Evalúa la Compuerta Condicional Determinista ANTES del Agente IA (`ifPlacement: 'pre_agent'`).
 * Ahorra el 100 % de tokens LLM cuando no existen brechas nuevas ni elementos externos sin procesar.
 */
function evaluatePreAgentDeterministicIf({
  ifCfg = {},
  structuredSourceRes = {},
  preRes = {},
  runCapturedEvidences = [],
  scraperBreachCount = 0,
  eventPayload = null,
  watchesExternal = false,
} = {}) {
  const safeCfg = ifCfg && typeof ifCfg === 'object' ? ifCfg : {};
  const condType = String(safeCfg.ifConditionType || 'critical_findings').trim();
  const expr = String(safeCfg.ifRuleExpression || '').trim();

  const freshCriticalCount = Array.isArray(structuredSourceRes?.freshCriticalRecords)
    ? structuredSourceRes.freshCriticalRecords.length
    : 0;
  const dedupSkippedCount = Array.isArray(structuredSourceRes?.deduplicatedSkippedRecords)
    ? structuredSourceRes.deduplicatedSkippedRecords.length
    : 0;
  const freshExternalCount =
    Number(preRes?.traceMeta?.freshDriveFilesCount || 0) +
    Number(preRes?.traceMeta?.freshGmailMessagesCount || 0) +
    (watchesExternal && eventPayload ? 1 : 0);
  const extDedupCount =
    Number(preRes?.traceMeta?.deduplicatedDriveFilesCount || 0) +
    Number(preRes?.traceMeta?.deduplicatedGmailMessagesCount || 0);
  const effectiveScraperBreachCount = Number(
    scraperBreachCount ||
      structuredSourceRes?.scraperBreachCount ||
      preRes?.traceMeta?.scraperBreachCount ||
      0,
  );

  const numMatch = expr.match(/(>=|<=|>|<|===|==|=|!=|!==)\s*(\d+(?:\.\d+)?)/);
  const op = numMatch ? numMatch[1] : '>=';
  const threshold = numMatch ? Number(numMatch[2]) : 1;

  const evalOp = (observed, operator, target) => {
    if (operator === '>') return observed > target;
    if (operator === '>=') return observed >= target;
    if (operator === '<') return observed < target;
    if (operator === '<=') return observed <= target;
    if (operator === '!=' || operator === '!==') return observed !== target;
    return observed === target;
  };

  let passed = false;
  let reason = '';

  if (condType === 'new_external_items') {
    passed = evalOp(freshExternalCount, op, threshold);
    reason = passed
      ? `Se detectaron ${freshExternalCount} elemento(s) externo(s) nuevo(s) sin procesar (${freshExternalCount} ${op} ${threshold}) -> Se activa la Rama SÍ.`
      : `0 elementos externos nuevos que cumplan (${freshExternalCount} ${op} ${threshold})${extDedupCount > 0 ? ` (${extDedupCount} archivo(s)/correo(s) ya procesados omitidos por anti-duplicados)` : ''} -> Se activa la Rama NO (0 tokens LLM).`;
  } else if (condType === 'numeric_threshold') {
    // NUNCA sustituir 0 críticos por allRecords.length
    const observed = watchesExternal
      ? freshExternalCount
      : freshCriticalCount + effectiveScraperBreachCount;
    passed = evalOp(observed, op, threshold);
    reason = passed
      ? `Umbral numérico cumplido sobre hallazgos nuevos (${observed} ${op} ${threshold}) -> Se activa la Rama SÍ.`
      : `Umbral numérico NO cumplido (${observed} ${op} ${threshold})${dedupSkippedCount + extDedupCount > 0 ? ` · ${dedupSkippedCount + extDedupCount} ítem(s) previos omitidos por anti-duplicados` : ''} -> Se activa la Rama NO (0 tokens LLM).`;
  } else if (condType === 'keyword_match') {
    const keywords = expr
      .split(/[,;|]+/)
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    const haystack = JSON.stringify([
      structuredSourceRes?.freshCriticalRecords || [],
      preRes?.freshDriveFiles || [],
      preRes?.freshGmailMessages || [],
      eventPayload,
    ]).toLowerCase();
    const matchedKw = keywords.find((kw) => haystack.includes(kw));
    passed = Boolean(matchedKw);
    reason = passed
      ? `Palabra clave "${matchedKw}" detectada en los registros nuevos -> Se activa la Rama SÍ.`
      : `Ninguna palabra clave de [${expr || 'sin expresión'}] presente en registros nuevos -> Se activa la Rama NO (0 tokens LLM).`;
  } else {
    // critical_findings (por defecto)
    passed =
      freshCriticalCount >= 1 ||
      (watchesExternal && freshExternalCount >= 1) ||
      effectiveScraperBreachCount >= 1;
    if (passed) {
      const parts = [];
      if (freshCriticalCount >= 1) parts.push(`${freshCriticalCount} brecha(s) crítica(s) nueva(s) en BD`);
      if (watchesExternal && freshExternalCount >= 1) {
        parts.push(`${freshExternalCount} archivo(s)/correo(s)/evento(s) externo(s) nuevo(s)`);
      }
      if (effectiveScraperBreachCount >= 1) {
        parts.push(`${effectiveScraperBreachCount} novedad(es) en portal oficial Antigravity`);
      }
      reason = `Hallazgos nuevos verificados (${parts.join(' + ')}) -> Se activa la Rama SÍ.`;
    } else {
      const totalDedup = dedupSkippedCount + extDedupCount;
      reason =
        totalDedup > 0
          ? `0 brechas nuevas pendientes (${totalDedup} caso(s) ya gestionados omitidos por ventana anti-duplicados) -> Se activa la Rama NO (0 tokens LLM).`
          : `100 % al día: 0 brechas críticas nuevas${watchesExternal ? ' y 0 elementos externos nuevos' : ''} -> Se activa la Rama NO (0 tokens LLM).`;
    }
  }

  return {
    passed,
    branchTaken: passed ? 'yes' : 'no',
    reason,
    freshCriticalCount,
    dedupSkippedCount,
    freshExternalCount,
  };
}

/**
 * Evalúa la Compuerta Semántica DESPUÉS del Agente IA (`ifPlacement: 'post_agent'`),
 * priorizando el veredicto estructurado `[VEREDICTO_IF: SI|NO]` y protegiendo el respaldo
 * contra falsos positivos por negaciones en español («0 exámenes vencidos», «sin brechas críticas»).
 */
function evaluatePostAgentSemanticIf({
  resultText = '',
  ifCfg = {},
  watchesDriveNewFiles = false,
} = {}) {
  const rawText = String(resultText || '');
  const safeCfg = ifCfg && typeof ifCfg === 'object' ? ifCfg : {};

  // 1° Prioridad: Marcador explícito [VEREDICTO_IF: NO]
  if (/\[\s*VEREDICTO_IF\s*:\s*NO\s*\]/i.test(rawText)) {
    return {
      passed: false,
      reason: 'Veredicto explícito [VEREDICTO_IF: NO] emitido por el Agente IA.',
    };
  }

  // 2° Prioridad: Marcador explícito [VEREDICTO_IF: SI] / [VEREDICTO_IF: SÍ]
  if (/\[\s*VEREDICTO_IF\s*:\s*S[IÍ]\s*\]/i.test(rawText)) {
    return {
      passed: true,
      reason: 'Veredicto explícito [VEREDICTO_IF: SI] emitido por el Agente IA.',
    };
  }

  // 3° Respaldo inmune a negaciones en español
  if (
    watchesDriveNewFiles &&
    /no\s+(se\s+encontraron|existen|hay)\s+archivos\s+nuevos|no\s+(se\s+encontraron|existen|hay)\s+(archivos|documentos|reportes|furat|eventos|accidentes)(\s+furat)?\s+nuevos|0\s+(archivos|furat|accidentes)\s+nuevos|google\s+drive\s+no\s+est[aá]\s+vinculado|sin\s+archivos\s+(furat\s+)?nuevos|conexi[oó]n\s+con\s+google\s+drive\s+ha\s+expirado|no\s+se\s+encontraron\s+archivos\s+ni\s+carpetas\s+en\s+google\s+drive|ya\s+(hab[ií]an\s+sido|fueron)\s+(procesados|investigados)\s+anteriormente/i.test(
      rawText,
    )
  ) {
    return {
      passed: false,
      reason: 'El dictamen confirma ausencia de archivos o eventos nuevos en origen externo.',
    };
  }

  const strippedText = rawText.replace(
    /(?:\b0\b|cero|ning[uú]n[oa]?|sin|no\s+hay|no\s+existen|no\s+se\s+(?:encontraron|detectaron|hallaron)|100\s*%\s+(?:vigente|al\s+d[ií]a|cumplimiento))\s+(?:[a-záéíóúñ]+\s+){0,4}(?:vencid[oa]s?|cr[ií]tic[oa]s?|brechas?|incumplimientos?|hallazgos?|alertas?|archivos?\s+nuevos?|accidentes?|casos?|novedades?|riesgos?\s+altos?|multas?|comparendos?)/gi,
    ' ',
  );

  const condType = String(safeCfg.ifConditionType || 'critical_findings').trim();
  const expr = String(safeCfg.ifRuleExpression || '').trim();

  if (condType === 'keyword_match' && expr) {
    const keywords = expr
      .split(/[,;|]+/)
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    const matched = keywords.find((kw) => strippedText.toLowerCase().includes(kw));
    return {
      passed: Boolean(matched),
      reason: matched
        ? `Palabra clave "${matched}" detectada en dictamen no negado.`
        : `Ninguna palabra clave de [${expr}] activa tras excluir cláusulas negadas.`,
    };
  }

  const hasPositiveCritical =
    /🚨|❌|\bvencid[oa]s?\b|\bcr[ií]tic[oa]s?\b|\bmultas?\b|\bcomparendos?\b|\bincumplimientos?\b|\bbrechas?\b|\briesgo\s+alto\b|\bno\s+cumple\b|\bsin\s+afiliaci[oó]n\b|\bpeligro\s+inminente\b|\baccidente\s+grave\b/i.test(
      strippedText,
    );

  return {
    passed: hasPositiveCritical,
    reason: hasPositiveCritical
      ? 'Señales semánticas de hallazgo crítico detectadas tras excluir cláusulas negadas.'
      : 'Sin hallazgos críticos activos tras evaluación semántica inmune a negaciones.',
  };
}

/**
 * Mapa canónico de alias de extract_sst_app hacia los IDs reales de Hitos SG-SST.
 */
const sstAppSourceAliasMap = {
  gtc45: 'hito2_matriz_ipevar',
  pesv: 'hito3_matriz_pesv',
  '0312': 'hito1_diagnostico_0312',
  diagnostico_0312: 'hito1_diagnostico_0312',
  atel: 'hito7_investigacion_atel',
  acpm: 'hito7_acpm',
  quimicos: 'hito5_registro_quimico',
  alturas: 'hito3_alturas',
  epp: 'hito3_epp',
  inspecciones: 'hito4_actos_condiciones',
  capacitaciones: 'hito6_capacitaciones',
  auditorias: 'hito7_auditoria',
  trabajadores: 'extract_sst_workers',
  cronograma: 'hito1_plan_trabajo',
  legal: 'hito1_matriz_legal',
};

/**
 * Lista explícita de conectores en construcción bloqueados (NUNCA incluye 'webhook_api').
 */
const BLOCKED_WORKFLOW_NODE_IDS = [
  'trigger_whatsapp',
  'extract_onedrive',
  'one_drive',
  'scraper_agy_pensiones_directo',
  'scraper_agy_salud_rethus',
];

/**
 * Determina si una automatización debe ser ejecutada por el reloj horario (`schedule_cron`).
 * Retorna `true` SOLO si `!Array.isArray(automation?.workflowNodes?.triggers)`
 * o `automation.workflowNodes.triggers.length === 0`
 * o `automation.workflowNodes.triggers.includes('schedule_cron')`.
 */
function hasCronTrigger(automation) {
  const triggers = automation?.workflowNodes?.triggers;
  if (!Array.isArray(triggers) || triggers.length === 0) {
    return true;
  }
  return triggers.includes('schedule_cron');
}

function normalizeTriggerMatchText(str = '') {
  return String(str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/(?<=\d)\s+(?=\d)/g, '')
    .trim();
}

function stripTriggerCommandVerbs(normStr = '') {
  let out = normalizeTriggerMatchText(normStr);
  const leadRx =
    /^(?:suri|siri|sur|tenshi|wappy|por favor|oye|ey|para|activar|activa|activame|encender|enciende|prender|prende|ejecutar|ejecuta|correr|corre|disparar|dispara|iniciar|inicia|arrancar|arranca|pon en marcha|lanzar|lanza|el|la|los|las|un|una|este|esta|ese|esa|flujo|tarea|automatizacion|robot)\b\s*/i;
  for (let i = 0; i < 6; i++) {
    const next = out.replace(leadRx, '').trim();
    if (next === out) break;
    out = next;
  }
  return out;
}

function getAutomationTriggersList(automation) {
  const raw = Array.isArray(automation?.workflowNodes?.triggers)
    ? automation.workflowNodes.triggers
    : automation?.workflowNodes?.trigger
      ? [automation.workflowNodes.trigger]
      : ['schedule_cron'];
  return raw.filter(Boolean);
}

function getTriggerNodeConfig(automation, triggerType) {
  const nodeConfigs =
    automation?.workflowNodes?.canvasLayout?.nodeConfigs ||
    automation?.workflowNodes?.nodeConfigs ||
    {};
  const triggers = getAutomationTriggersList(automation);
  const candidateKeys = [`trigger_${triggerType}`, triggerType];
  if (triggerType === 'trigger_email') candidateKeys.push('trigger_email_in');
  if (triggerType === 'trigger_webhook') candidateKeys.push('trigger_webhook_in');
  if (triggers[0] === triggerType || (!triggers.length && triggerType === 'schedule_cron')) {
    candidateKeys.push('trigger_root');
  }

  let merged = {};
  for (const key of candidateKeys) {
    if (nodeConfigs[key] && typeof nodeConfigs[key] === 'object') {
      merged = { ...nodeConfigs[key], ...merged };
    }
  }
  // Si solo hay trigger_root sin llave específica aún (configuración legada), aprovechar sus campos del tipo correspondiente
  if (Object.keys(merged).length === 0 && nodeConfigs.trigger_root && typeof nodeConfigs.trigger_root === 'object') {
    if (triggers.includes(triggerType)) {
      merged = { ...nodeConfigs.trigger_root };
    }
  }
  return merged;
}

function extractAutomationTriggerConfigs(automation) {
  const triggers = getAutomationTriggersList(automation);
  const nodeConfigs =
    automation?.workflowNodes?.canvasLayout?.nodeConfigs ||
    automation?.workflowNodes?.nodeConfigs ||
    {};

  const tenshiCfg = getTriggerNodeConfig(automation, 'trigger_tenshi');
  const emailCfg = getTriggerNodeConfig(automation, 'trigger_email');
  const qrCfg = getTriggerNodeConfig(automation, 'trigger_qr_worker');
  const webhookCfg = getTriggerNodeConfig(automation, 'trigger_webhook');
  const agentCfg = getTriggerNodeConfig(automation, 'trigger_agent');

  const voiceCmdSet = new Set();
  if (tenshiCfg?.voiceCommand && String(tenshiCfg.voiceCommand).trim()) {
    voiceCmdSet.add(String(tenshiCfg.voiceCommand).trim());
  }
  for (const [k, v] of Object.entries(nodeConfigs)) {
    if (!v || typeof v !== 'object') continue;
    if (k.startsWith('trigger') && v.voiceCommand && String(v.voiceCommand).trim()) {
      voiceCmdSet.add(String(v.voiceCommand).trim());
    }
  }

  return {
    triggers,
    voiceCommands: Array.from(voiceCmdSet),
    triggerChannel: String(tenshiCfg?.triggerChannel || 'both').toLowerCase(),
    emailSubjectFilter: String(emailCfg?.emailSubjectFilter || '').trim(),
    emailSenderFilter: String(emailCfg?.emailSenderFilter || '').trim(),
    onlyWithAttachments: Boolean(emailCfg?.onlyWithAttachments),
    qrPortalTarget: String(qrCfg?.qrPortalType || qrCfg?.qrPortalTarget || 'all').trim(),
    qrSeverityFilter: String(qrCfg?.qrSeverityFilter || 'all').trim(),
    webhookSecret: String(webhookCfg?.webhookSecret || '').trim(),
    sourceAgentId: String(agentCfg?.sourceAgentId || '').trim(),
    agentInstruction: String(agentCfg?.customInstruction || '').trim(),
  };
}

const TRIGGER_QUERY_STOP_WORDS = new Set([
  'para', 'con', 'del', 'las', 'los', 'una', 'por', 'que', 'tarea', 'flujo',
  'automatizacion', 'activar', 'activa', 'activame', 'ejecutar', 'ejecuta',
  'encender', 'enciende', 'iniciar', 'inicia', 'disparar', 'dispara',
  'suri', 'siri', 'sur', 'tenshi', 'wappy', 'este', 'esta', 'ese', 'esa',
]);

function resolveAutomationByVoiceOrQuery(automations = [], rawQuery = '', { requireTenshiTrigger = false } = {}) {
  const qNorm = normalizeTriggerMatchText(rawQuery);
  const qCore = stripTriggerCommandVerbs(qNorm);
  if (!qNorm) {
    return { matches: [], matchSource: null, matchedVoiceCommand: null, score: 0 };
  }

  const allTokens = Array.from(new Set([...qNorm.split(' '), ...qCore.split(' ')]))
    .map((t) => t.trim())
    .filter((t) => t && !TRIGGER_QUERY_STOP_WORDS.has(t));
  const codeOrDigitTokens = allTokens.filter((t) => /\d/.test(t));
  const meaningfulTokens = allTokens.filter((t) => /\d/.test(t) || t.length >= 3);

  const scored = [];
  for (const auto of automations) {
    const cfg = extractAutomationTriggerConfigs(auto);
    if (requireTenshiTrigger && !cfg.triggers.includes('trigger_tenshi')) {
      continue;
    }

    const nameNorm = normalizeTriggerMatchText(auto?.name || '');
    const nameCore = stripTriggerCommandVerbs(nameNorm);
    const haystackNorm = normalizeTriggerMatchText(
      `${cfg.voiceCommands.join(' ')} ${auto?.name || ''} ${auto?.agentName || ''}`,
    );

    // Si la petición menciona un código numérico específico (ej. "001", "1401"), ningún flujo que NO contenga ese código puede ganar por accidente
    const hasMissingCodeToken =
      codeOrDigitTokens.length > 0 &&
      codeOrDigitTokens.some((tok) => {
        const strippedZero = tok.replace(/^0+(?=\d)/, '');
        return (
          !haystackNorm.includes(tok) &&
          !(strippedZero && new RegExp(`\\b0*${strippedZero}\\b`).test(haystackNorm))
        );
      });

    let bestScore = 0;
    let matchSource = null;
    let matchedVoiceCommand = null;

    // 1. Coincidencia prioritaria con FRASE O COMANDO DE TENSHI (`voiceCommand`)
    for (const vc of cfg.voiceCommands) {
      const vcNorm = normalizeTriggerMatchText(vc);
      const vcCore = stripTriggerCommandVerbs(vcNorm);
      if (!vcNorm) continue;

      if (vcNorm === qNorm || (qCore && vcCore && vcCore === qCore)) {
        if (100 > bestScore) {
          bestScore = 100;
          matchSource = 'voiceCommand';
          matchedVoiceCommand = vc;
        }
      } else if (
        (qNorm.length >= 2 && vcNorm.includes(qNorm)) ||
        (vcNorm.length >= 2 && qNorm.includes(vcNorm)) ||
        (qCore && vcCore && qCore.length >= 2 && (vcCore.includes(qCore) || qCore.includes(vcCore)))
      ) {
        if (!hasMissingCodeToken && 85 > bestScore) {
          bestScore = 85;
          matchSource = 'voiceCommand';
          matchedVoiceCommand = vc;
        }
      }
    }

    // 2. Coincidencia exacta o de subcadena por Nombre de la Tarea (solo si no faltan códigos numéricos)
    if (bestScore < 95 && nameNorm && !hasMissingCodeToken) {
      if (nameNorm === qNorm || (qCore && nameCore && nameCore === qCore)) {
        bestScore = 95;
        matchSource = 'name';
        matchedVoiceCommand = null;
      } else if (
        (qCore && qCore.length >= 4 && nameNorm.includes(qCore)) ||
        (qNorm.length >= 4 && nameNorm.includes(qNorm)) ||
        (nameNorm.length >= 5 && qNorm.includes(nameNorm))
      ) {
        if (75 > bestScore) {
          bestScore = 75;
          matchSource = 'name';
          matchedVoiceCommand = null;
        }
      }
    }

    // 3. Coincidencia estricta por tokens discriminantes (excluyendo palabras vacías como "flujo")
    if (bestScore === 0 && meaningfulTokens.length > 0 && !hasMissingCodeToken) {
      const vcHaystack = normalizeTriggerMatchText(cfg.voiceCommands.join(' '));
      const vcHits = vcHaystack
        ? meaningfulTokens.filter((t) => vcHaystack.includes(t)).length
        : 0;
      if (vcHaystack && vcHits > 0 && (vcHits >= 2 || vcHits === meaningfulTokens.length)) {
        bestScore = 65 + Math.round((vcHits / meaningfulTokens.length) * 15);
        matchSource = 'voiceCommand';
        matchedVoiceCommand = cfg.voiceCommands[0] || null;
      } else {
        const hits = meaningfulTokens.filter((t) => haystackNorm.includes(t)).length;
        const ratio = hits / meaningfulTokens.length;
        if (hits >= 2 || (meaningfulTokens.length === 1 && hits === 1 && ratio === 1)) {
          bestScore = 50 + Math.round(ratio * 15);
          matchSource = 'name';
          matchedVoiceCommand = null;
        }
      }
    }

    if (bestScore > 0) {
      scored.push({
        automation: auto,
        score: bestScore,
        matchSource,
        matchedVoiceCommand,
        triggerConfigs: cfg,
      });
    }
  }

  if (scored.length === 0) {
    return { matches: [], matchSource: null, matchedVoiceCommand: null, score: 0 };
  }

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const aHasVc = a.matchSource === 'voiceCommand' ? 1 : 0;
    const bHasVc = b.matchSource === 'voiceCommand' ? 1 : 0;
    if (bHasVc !== aHasVc) return bHasVc - aHasVc;
    const aActive = a.automation?.status === 'active' ? 1 : 0;
    const bActive = b.automation?.status === 'active' ? 1 : 0;
    if (bActive !== aActive) return bActive - aActive;
    return new Date(b.automation?.updatedAt || b.automation?.createdAt || 0).getTime() -
      new Date(a.automation?.updatedAt || a.automation?.createdAt || 0).getTime();
  });

  const top = scored[0];
  const equivalentTop = scored
    .filter((s) => s.score === top.score && s.matchSource === top.matchSource)
    .map((s) => s.automation);

  return {
    matches: equivalentTop,
    matchSource: top.matchSource,
    matchedVoiceCommand: top.matchedVoiceCommand,
    score: top.score,
    triggerConfigs: top.triggerConfigs,
  };
}

/**
 * Reconoce de forma equivalente tanto el nuevo rol canónico `'agent_tool'` (conectado en el puerto
 * `Herramienta +` del Agente IA estilo n8n) como el alias legado `'target_write_report'`.
 */
function isAgentToolHitoRole(role) {
  return role === 'agent_tool' || role === 'target_write_report';
}

const HUMAN_WORKFLOW_NODE_TITLES = {
  schedule_cron: 'Programación Horaria',
  trigger_tenshi: 'Orden por Voz o Chat de Tenshi',
  trigger_email: 'Correo Entrante en Gmail',
  trigger_webhook: 'Disparador Webhook Externo',
  trigger_qr_worker: 'Reporte QR de Trabajadores en Campo',
  trigger_antigravity: 'Evento Local Google Antigravity',
  trigger_antigravity_cloud: 'Evento Google Antigravity Cloud',
  extract_drive: 'Google Drive',
  extract_gmail: 'Bandeja de Gmail',
  extract_pc_folder: 'Carpeta Local del Computador',
  extract_ai_doc_ocr: 'Extractor IA de Documentos',
  extract_sst_workers: 'Padrón de Trabajadores SG-SST',
  extract_sst_app: 'Aplicativo Fuente de Somos SST',
  extract_web_search: 'Búsqueda Normativa en la Web',
  if_router: 'Condición Si/No',
  if_condition: 'Condición Si/No',
  agent_root: 'Agente IA Principal',
  wappy_memory_company: 'Memoria de Contexto de Empresa',
  wappy_memory_antiduplicate: 'Filtro Anti-Duplicados',
  wappy_rag_documental: 'Base Documental de la Empresa',
  wappy_memory_procedural: 'Memoria Normativa SG-SST',
  hito1_dofa: 'Contexto Organizacional DOFA (Hito 1)',
  hito1_diagnostico_0312: 'Diagnóstico Estándares Mínimos Res. 0312 (Hito 1)',
  hito1_responsable: 'Designación de Responsable SG-SST (Hito 1)',
  hito1_politica_objetivos: 'Política y Objetivos SG-SST (Hito 1)',
  hito1_plan_trabajo: 'Plan de Trabajo Anual SG-SST (Hito 1)',
  hito1_perfiles_cargo: 'Perfiles de Cargo y Profesiograma (Hito 1)',
  hito2_perfil_socio: 'Perfil Sociodemográfico y Condiciones de Salud (Hito 2)',
  hito2_examenes_medicos: 'Exámenes Médicos Ocupacionales (Hito 2)',
  hito2_matriz_ipevar: 'Matriz de Peligros IPEVR GTC-45 (Hito 2)',
  hito2_perfiles_cargo: 'Perfiles de Cargo y Profesiograma (Hito 2)',
  hito3_matriz_pesv: 'Matriz de Riesgos Viales PESV (Hito 3)',
  hito3_vehiculos: 'Control de Flota Vehicular PESV (Hito 3)',
  hito3_quimicos_sga: 'Matriz de Compatibilidad Química SGA (Hito 3)',
  hito3_epp: 'Entrega y Control de EPP (Hito 3)',
  hito3_alturas: 'Trabajo Seguro en Alturas (Hito 3)',
  hito4_psicosocial: 'Vigilancia y Analítica Psicosocial (Hito 4)',
  hito4_actos_condiciones: 'Reporte de Actos y Condiciones Inseguras (Hito 4)',
  hito5_registro_quimico: 'Inventario de Sustancias Químicas (Hito 5)',
  hito5_copasst_cocola: 'Comités COPASST y Convivencia Laboral (Hito 5)',
  hito6_capacitaciones: 'Cronograma de Capacitaciones y LMS (Hito 6)',
  hito7_investigacion_atel: 'Investigación de Accidentes e Incidentes ATEL (Hito 7)',
  hito7_auditoria: 'Auditorías Internas SG-SST (Hito 7)',
  hito7_acpm: 'Plan de Mejoramiento y Acciones ACPM (Hito 7)',
  hito8_revision_direccion: 'Revisión por la Alta Dirección (Hito 8)',
  email_report: 'Reporte Ejecutivo por Correo Electrónico',
  wappy_notification: 'Notificación en WAPPY y Chat de Tenshi',
  acpm_task: 'Tarea en Centro de Control ACPM',
  canvas_doc: 'Documento en Editor en Vivo WAPPY',
  somos_sst_update: 'Actualización en Somos SST',
};

function formatHumanWorkflowNodeTitle(rawKeyOrId = '') {
  const cleanRaw = String(rawKeyOrId || '').trim();
  if (!cleanRaw) return 'Paso del Flujo';
  if (HUMAN_WORKFLOW_NODE_TITLES[cleanRaw]) {
    return HUMAN_WORKFLOW_NODE_TITLES[cleanRaw];
  }
  const canonical = normalizeInspectorNodeId(cleanRaw);
  if (canonical && HUMAN_WORKFLOW_NODE_TITLES[canonical]) {
    return HUMAN_WORKFLOW_NODE_TITLES[canonical];
  }
  return (canonical || cleanRaw)
    .replace(/^(trigger_|extractor_|ext_|tool_hitos_|sub_tool_|hito_|tool_inputs_|sub_memory_|out_|output_)/i, '')
    .replace(/^hito(\d+)_/i, 'Hito $1 · ')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Mapea dinámicamente los nodos activos del lienzo (`triggers`, `extractors`, `inputs`, `hitos`, `outputs`, `customNodes`)
 * hacia los nombres exactos de herramientas registradas en `handleTools.js`, sin duplicados ni herramientas fantasma.
 */
function resolveRequiredToolsForWorkflow(workflowNodes = {}) {
  const wf = workflowNodes && typeof workflowNodes === 'object' ? workflowNodes : {};
  const triggers = Array.isArray(wf.triggers)
    ? wf.triggers
    : wf.trigger
      ? [wf.trigger]
      : [];
  const extractors = Array.isArray(wf.extractors) ? wf.extractors : [];
  const inputs = Array.isArray(wf.inputs) ? wf.inputs : [];
  const hitos = Array.isArray(wf.hitos) ? wf.hitos : [];
  const outputs = Array.isArray(wf.outputs) ? wf.outputs : [];
  const customNodes = Array.isArray(wf?.canvasLayout?.customNodes)
    ? wf.canvasLayout.customNodes
    : Array.isArray(wf.customNodes)
      ? wf.customNodes
      : [];
  const nodeConfigs = wf?.canvasLayout?.nodeConfigs || wf?.nodeConfigs || {};

  // Resolver alias de extract_sst_app si está configurado
  const resolvedSstAppTargets = [];
  if (extractors.includes('extract_sst_app')) {
    const extCfg =
      nodeConfigs.extractor_extract_sst_app ||
      nodeConfigs.ext_extract_sst_app ||
      nodeConfigs.extract_sst_app ||
      {};
    if (extCfg.sstAppSourceId) {
      const mapped =
        sstAppSourceAliasMap[String(extCfg.sstAppSourceId).toLowerCase().trim()] ||
        String(extCfg.sstAppSourceId).trim();
      if (mapped) resolvedSstAppTargets.push(mapped);
    }
  }

  const canonicalHitos = hitos
    .filter(Boolean)
    .map((h) => normalizeInspectorNodeId(String(h).trim()));

  const allTokens = new Set(
    [
      ...triggers,
      ...extractors,
      ...inputs,
      ...hitos,
      ...canonicalHitos,
      ...outputs,
      ...resolvedSstAppTargets,
      ...customNodes.flatMap((cn) =>
        cn && typeof cn === 'object' ? [cn.id, cn.key, cn.nodeType] : [],
      ),
    ]
      .filter(Boolean)
      .map((s) => String(s).trim()),
  );

  const requiredTools = new Set();

  const hasAnyStartsWith = (prefix) => {
    for (const tok of allTokens) {
      if (tok.startsWith(prefix)) return true;
    }
    return false;
  };

  const requiresSomosSstTool =
    hitos.length > 0 ||
    resolvedSstAppTargets.some((t) => t.startsWith('hito') || t.startsWith('extract_sst_')) ||
    hasAnyStartsWith('hito') ||
    hasAnyStartsWith('somos_sst_') ||
    hasAnyStartsWith('extract_sst_') ||
    allTokens.has('cursos_lms') ||
    outputs.includes('acpm_task') ||
    outputs.includes('somos_sst_update') ||
    outputs.includes('canvas_doc') ||
    allTokens.has('somos_sst');

  if (requiresSomosSstTool) {
    requiredTools.add('somos_sst');
  }

  if (
    allTokens.has('hito2_matriz_ipevar') ||
    allTokens.has('hito3_gtc45_ipvr') ||
    allTokens.has('extract_gtc45_risks') ||
    allTokens.has('matriz_ipevar')
  ) {
    requiredTools.add('matriz_ipevar');
  }
  if (allTokens.has('hito3_matriz_pesv') || allTokens.has('matriz_pesv')) {
    requiredTools.add('matriz_pesv');
  }
  if (allTokens.has('hito3_quimicos_sga') || allTokens.has('matriz_compatibilidad')) {
    requiredTools.add('matriz_compatibilidad');
  }
  if (allTokens.has('hito4_psicosocial') || allTokens.has('consultar_analitica_psicosocial')) {
    requiredTools.add('consultar_analitica_psicosocial');
  }
  if (
    allTokens.has('hito4_actos_condiciones') ||
    allTokens.has('consultar_analitica_actos_condiciones')
  ) {
    requiredTools.add('consultar_analitica_actos_condiciones');
  }
  if (allTokens.has('extract_drive') || allTokens.has('google_drive')) {
    requiredTools.add('google_drive');
  }
  if (
    allTokens.has('extract_gmail') ||
    allTokens.has('google_gmail') ||
    allTokens.has('trigger_email') ||
    allTokens.has('trigger_email_in')
  ) {
    requiredTools.add('google_gmail');
  }
  if (allTokens.has('google_docs')) {
    requiredTools.add('google_docs');
  }
  if (allTokens.has('google_sheets')) {
    requiredTools.add('google_sheets');
  }
  if (allTokens.has('google_slides')) {
    requiredTools.add('google_slides');
  }
  if (allTokens.has('google_calendar')) {
    requiredTools.add('google_calendar');
  }
  if (allTokens.has('consultar_pubchem_quimico') || allTokens.has('pubchem_api')) {
    requiredTools.add('pubchem_api');
  }
  if (allTokens.has('extract_web_search') || allTokens.has('web_search')) {
    requiredTools.add('web_search');
  }
  if (allTokens.has('google_antigravity')) {
    requiredTools.add('google_antigravity');
  }
  if (allTokens.has('google_flow')) {
    requiredTools.add('google_flow');
  }

  return Array.from(requiredTools);
}

/**
 * Valida si una dirección IP (IPv4 o IPv6) pertenece a rangos privados, loopback, link-local o reservados (anti-SSRF).
 */
function isPrivateOrReservedIp(ipStr = '') {
  const clean = String(ipStr || '').trim().replace(/^\[|\]$/g, '').toLowerCase();
  if (!clean) return true;
  if (
    clean === '::1' ||
    clean === '::' ||
    clean === '0:0:0:0:0:0:0:1' ||
    clean === '0:0:0:0:0:0:0:0'
  ) {
    return true;
  }
  if (clean.startsWith('::ffff:')) {
    return isPrivateOrReservedIp(clean.slice(7));
  }
  const ipVersion = net.isIP(clean);
  if (ipVersion === 4) {
    const parts = clean.split('.').map((n) => parseInt(n, 10));
    if (parts.length !== 4 || parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) {
      return true;
    }
    const [a, b] = parts;
    if (a === 0 || a === 10 || a === 127) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true; // Carrier-grade NAT
    if (a >= 224) return true; // Multicast / reserved
    return false;
  }
  if (ipVersion === 6) {
    if (/^f[cd][0-9a-f]{2}:/i.test(clean)) return true; // fc00::/7 Unique Local
    if (/^fe[89ab][0-9a-f]:/i.test(clean)) return true; // fe80::/10 Link-Local
    if (/^ff[0-9a-f]{2}:/i.test(clean)) return true; // Multicast
    return false;
  }
  return false;
}

/**
 * Verifica sincrónicamente que la URL sea HTTPS pública y no apunte a localhost ni subredes internas.
 */
function isSafePublicHttpsUrl(rawUrl = '') {
  try {
    const u = new URL(String(rawUrl || '').trim());
    if (u.protocol !== 'https:') return false;
    const host = String(u.hostname || '').trim().replace(/^\[|\]$/g, '').toLowerCase();
    if (!host) return false;
    if (
      host === 'localhost' ||
      host.endsWith('.localhost') ||
      host.endsWith('.local') ||
      host.endsWith('.internal') ||
      host === 'metadata.google.internal' ||
      host === '0.0.0.0' ||
      host === '::1'
    ) {
      return false;
    }
    if (net.isIP(host)) {
      return !isPrivateOrReservedIp(host);
    }
    return host.includes('.');
  } catch (_) {
    return false;
  }
}

/**
 * Ejecuta una pre-consulta HTTP GET segura sobre `webhook_api` (solo `https://` público, timeout 8s, anti-SSRF con DNS check).
 */
async function fetchSafeWebhookApiData(endpointUrl = '', extraHeaders = {}) {
  const cleanUrl = String(endpointUrl || '').trim();
  if (!isSafePublicHttpsUrl(cleanUrl)) {
    return {
      ok: false,
      status: 0,
      error:
        'URL bloqueada por seguridad SSRF: solo se permiten URLs públicas con protocolo https:// (se bloquean localhost e IPs privadas).',
      previewText: '',
      parsedJson: null,
    };
  }
  try {
    const parsed = new URL(cleanUrl);
    const host = parsed.hostname.replace(/^\[|\]$/g, '');
    if (!net.isIP(host)) {
      const resolved = await dns.promises.lookup(host, { all: true });
      if (!Array.isArray(resolved) || resolved.length === 0) {
        return {
          ok: false,
          status: 0,
          error: `No fue posible resolver DNS para ${host}.`,
          previewText: '',
          parsedJson: null,
        };
      }
      for (const entry of resolved) {
        if (isPrivateOrReservedIp(entry.address)) {
          return {
            ok: false,
            status: 0,
            error: `Resolución DNS bloqueada por protección SSRF (${host} -> IP interna/reservada).`,
            previewText: '',
            parsedJson: null,
          };
        }
      }
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    let resp;
    try {
      const safeHeaders = {
        Accept: 'application/json, text/plain;q=0.9, */*;q=0.8',
        'User-Agent': 'Wappy-SGSST-WorkflowEngine/1.0',
      };
      if (extraHeaders && typeof extraHeaders === 'object' && !Array.isArray(extraHeaders)) {
        for (const [hk, hv] of Object.entries(extraHeaders)) {
          if (hk && typeof hv === 'string' && !/^(host|cookie)$/i.test(hk)) {
            safeHeaders[hk] = hv;
          }
        }
      }
      resp = await fetch(cleanUrl, {
        method: 'GET',
        headers: safeHeaders,
        redirect: 'error',
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }

    const contentType = String(resp.headers.get('content-type') || '');
    const rawBody = await resp.text();
    const previewText = String(rawBody || '').slice(0, 10000);
    let parsedJson = null;
    if (contentType.includes('json') || /^[\s]*[{[]/.test(previewText)) {
      try {
        parsedJson = JSON.parse(rawBody);
      } catch (_) {}
    }
    return {
      ok: resp.ok,
      status: resp.status,
      contentType,
      previewText,
      parsedJson,
      error: resp.ok ? null : `HTTP ${resp.status}`,
    };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      contentType: '',
      previewText: '',
      parsedJson: null,
      error:
        err?.name === 'AbortError'
          ? 'Timeout de 8 segundos alcanzado consultando el endpoint HTTPS.'
          : err?.message || 'Error consultando endpoint HTTPS externo.',
    };
  }
}

/**
 * Obtiene un cliente OAuth2 de Google autenticado y aislado estrictamente por `(userId, companyId)`
 * (usado por pre-extractores de Drive y post-procesadores Google Docs, Sheets, Calendar y Slides).
 */
async function getCompanyGoogleOAuthClient(userId, companyId) {
  try {
    if (!userId) return null;
    const { google } = require('googleapis');
    const { getScopedAuthValue, updateScopedAuthValue } = require('./googleAuthHelper');
    const uid = String(userId);
    const cid = companyId && String(companyId) !== 'DEFAULT' ? String(companyId) : null;

    const accessToken = await getScopedAuthValue(uid, cid, 'GOOGLE_DRIVE_ACCESS_TOKEN', false);
    const refreshToken = await getScopedAuthValue(uid, cid, 'GOOGLE_DRIVE_REFRESH_TOKEN', false);
    const expiryStr = await getScopedAuthValue(uid, cid, 'GOOGLE_DRIVE_EXPIRY', false);

    if (!accessToken && !refreshToken) {
      return null;
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.DOMAIN_SERVER || 'http://localhost:3080'}/api/sgsst/google-drive/callback`,
    );

    const expiry = expiryStr ? Number(expiryStr) : null;
    oauth2Client.setCredentials({
      access_token: accessToken || undefined,
      refresh_token: refreshToken || undefined,
      expiry_date: expiry || undefined,
    });

    if ((!accessToken || (expiry && expiry - Date.now() < 60000)) && refreshToken) {
      try {
        const { credentials } = await oauth2Client.refreshAccessToken();
        oauth2Client.setCredentials(credentials);
        if (credentials.access_token) {
          await updateScopedAuthValue(uid, cid, 'GOOGLE_DRIVE_ACCESS_TOKEN', credentials.access_token);
        }
        if (credentials.expiry_date) {
          await updateScopedAuthValue(uid, cid, 'GOOGLE_DRIVE_EXPIRY', String(credentials.expiry_date));
        }
      } catch (refreshErr) {
        console.warn('[AutomationScheduler] Aviso refrescando OAuth Google:', refreshErr?.message);
        if (!accessToken) return null;
      }
    }

    return { oauth2Client, google };
  } catch (err) {
    console.warn('[AutomationScheduler] Error inicializando Google OAuth Client:', err?.message);
    return null;
  }
}

/** Coordenadas de ciudades principales de Colombia para pronostico_clima_sst (Open-Meteo, sin API key). */
const COLOMBIAN_CITIES_COORDS = {
  bogota: { name: 'Bogotá D.C.', lat: 4.711, lon: -74.0721 },
  medellin: { name: 'Medellín', lat: 6.2442, lon: -75.5812 },
  cali: { name: 'Cali', lat: 3.4516, lon: -76.532 },
  barranquilla: { name: 'Barranquilla', lat: 10.9685, lon: -74.7813 },
  cartagena: { name: 'Cartagena', lat: 10.391, lon: -75.4794 },
  bucaramanga: { name: 'Bucaramanga', lat: 7.1193, lon: -73.1227 },
  pereira: { name: 'Pereira', lat: 4.8133, lon: -75.6961 },
  manizales: { name: 'Manizales', lat: 5.0703, lon: -75.5138 },
  cucuta: { name: 'Cúcuta', lat: 7.8939, lon: -72.5078 },
  ibague: { name: 'Ibagué', lat: 4.4389, lon: -75.2322 },
  villavicencio: { name: 'Villavicencio', lat: 4.142, lon: -73.6266 },
  santamarta: { name: 'Santa Marta', lat: 11.2408, lon: -74.199 },
  neiva: { name: 'Neiva', lat: 2.9273, lon: -75.2819 },
  pasto: { name: 'Pasto', lat: 1.2136, lon: -77.2811 },
  armenia: { name: 'Armenia', lat: 4.5339, lon: -75.6811 },
  monteria: { name: 'Montería', lat: 8.7479, lon: -75.8814 },
  valledupar: { name: 'Valledupar', lat: 10.4631, lon: -73.2532 },
  popayan: { name: 'Popayán', lat: 2.4448, lon: -76.6147 },
  tunja: { name: 'Tunja', lat: 5.5353, lon: -73.3678 },
  yopal: { name: 'Yopal', lat: 5.3378, lon: -72.3959 },
};

/**
 * Resuelve determinísticamente a qué rama ('yes' | 'no') pertenece un nodo de salida
 * cuando el flujo tiene `includeIfNode: true`, 100% alineado con `resolveOutputIfBranch`
 * en `WappyWorkflowCanvas.tsx`.
 */
function resolveOutputBranchForIfRouter(outNodeId, idx, allOutIds, nodeConfigs, edges) {
  const outKey = `out_${outNodeId}`;
  if (Array.isArray(edges) && edges.length > 0) {
    const explicitIfEdges = edges.filter(
      (ed) =>
        (ed.from === 'if_router' || ed.from === 'if_condition') &&
        (ed.to === outKey || ed.to === outNodeId),
    );
    if (explicitIfEdges.length > 0) {
      const hasFalse = explicitIfEdges.some(
        (ed) => ed.kind === 'branch_false' || ed.label === 'no',
      );
      const hasTrue = explicitIfEdges.some(
        (ed) => ed.kind !== 'branch_false' && ed.label !== 'no',
      );
      if (hasFalse && !hasTrue) return 'no';
      if (hasTrue && !hasFalse) return 'yes';
    }
  }

  const explicit = nodeConfigs?.[outKey]?.ifBranch || nodeConfigs?.[outNodeId]?.ifBranch;
  if (explicit === 'yes' || explicit === 'no') {
    return explicit;
  }

  const urgentYesIds = [
    'acpm_task',
    'email_report',
    'google_calendar',
    'somos_sst_update',
    'antigravity_local_report',
    'antigravity_cloud_report',
  ];
  const calmNoIds = [
    'wappy_notification',
    'google_sheets',
    'canvas_doc',
    'google_docs',
    'google_slides',
  ];
  const classifyDefault = (id) => {
    if (urgentYesIds.includes(id)) return 'yes';
    if (calmNoIds.includes(id)) return 'no';
    return 'yes';
  };

  const list = Array.isArray(allOutIds) ? allOutIds : [];
  if (list.length >= 2) {
    const hasAnyExplicit = list.some((id) => {
      const b = nodeConfigs?.[`out_${id}`]?.ifBranch || nodeConfigs?.[id]?.ifBranch;
      return b === 'yes' || b === 'no';
    });
    if (!hasAnyExplicit) {
      const defaults = list.map((id) => classifyDefault(id));
      if (defaults.every((b) => b === 'yes') && idx === list.length - 1) return 'no';
      if (defaults.every((b) => b === 'no') && idx === 0) return 'yes';
    }
  }
  return classifyDefault(outNodeId);
}

let schedulerInterval = null;
let isCheckingAutomations = false; // Evita que dos ticks del intervalo se solapen
let drainTimer = null; // Re-disparo inmediato de drenaje continuo al liberarse ventanilla
const runningAutomations = new Map(); // automationId -> { abortController, timeoutId, startedAt, automationName, logId }

/**
 * Snapshot de ejecuciones activas actualmente en la memoria de este proceso Node.
 */
function getActiveRunningSnapshot() {
  const activeAutomationIds = [];
  const activeLogIds = [];
  const entries = [];
  for (const [automationId, entry] of runningAutomations.entries()) {
    activeAutomationIds.push(String(automationId));
    if (entry?.logId) {
      activeLogIds.push(String(entry.logId));
    }
    entries.push({
      automationId: String(automationId),
      logId: entry?.logId ? String(entry.logId) : null,
      startedAt: entry?.startedAt || null,
      automationName: entry?.automationName || '',
    });
  }
  return { activeAutomationIds, activeLogIds, entries };
}

/**
 * Limpia y reconcilia ejecuciones huérfanas o atascadas sin heartbeat (por caída de red, timeout o reinicio del servidor).
 */
async function reconcileOrphanedRunningRuns({ companyId = null, automationId = null } = {}) {
  try {
    const nowMs = Date.now();
    // 1. Evictar de memoria cualquier ejecución activa que haya excedido el límite absoluto (9.5 min)
    for (const [autoId, entry] of runningAutomations.entries()) {
      const elapsedMs = entry?.startedAt ? nowMs - new Date(entry.startedAt).getTime() : 0;
      if (elapsedMs > 9.5 * 60 * 1000) {
        console.warn(
          `[AutomationScheduler] Evicting stale in-memory run for "${entry?.automationName || autoId}" (${Math.round(elapsedMs / 1000)}s).`,
        );
        try {
          if (entry.timeoutId) clearTimeout(entry.timeoutId);
          if (entry.abortController && !entry.abortController.signal.aborted) {
            entry.abortController.abort();
          }
        } catch (_) {}
        runningAutomations.delete(autoId);
      }
    }

    const { activeAutomationIds, activeLogIds } = getActiveRunningSnapshot();
    const activeAutoObjIds = activeAutomationIds
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map((id) => new mongoose.Types.ObjectId(id));
    const activeLogObjIds = activeLogIds
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map((id) => new mongoose.Types.ObjectId(id));

    const orphanCutoff = new Date(nowMs - 90 * 1000);
    const hardTimeoutCutoff = new Date(nowMs - 9.5 * 60 * 1000);

    const scopeLogFilter = {
      status: 'running',
      ...(companyId ? { companyId: String(companyId) } : {}),
      ...(automationId && mongoose.Types.ObjectId.isValid(String(automationId))
        ? { automation: new mongoose.Types.ObjectId(String(automationId)) }
        : {}),
    };

    const staleLogs = await AutomationLog.find({
      ...scopeLogFilter,
      $or: [
        // Cualquier log cuyo heartbeat/creación lleve > 9.5 minutos
        { heartbeatAt: { $lt: hardTimeoutCutoff } },
        { heartbeatAt: { $exists: false }, createdAt: { $lt: hardTimeoutCutoff } },
        // Log marcado 'running' en BD pero cuyo proceso en memoria NO existe (ej. reinicio / deploy Dokploy) con > 90s sin latido
        {
          ...(activeLogObjIds.length > 0 ? { _id: { $nin: activeLogObjIds } } : {}),
          $or: [
            { heartbeatAt: { $lt: orphanCutoff } },
            { heartbeatAt: { $exists: false }, updatedAt: { $lt: orphanCutoff } },
            { heartbeatAt: { $exists: false }, updatedAt: { $exists: false }, createdAt: { $lt: orphanCutoff } },
          ],
        },
      ],
    })
      .select('_id automation liveSteps activeStepNodeKey')
      .lean();

    if (staleLogs.length > 0) {
      const recoveredAutoIds = [];
      for (const sl of staleLogs) {
        const patchedSteps = Array.isArray(sl.liveSteps)
          ? sl.liveSteps.map((st) =>
              st && st.status === 'running'
                ? {
                    ...st,
                    status: 'error',
                    error: 'Ejecución interrumpida por tiempo límite o reinicio del servidor.',
                  }
                : st,
            )
          : [];
        await AutomationLog.updateOne(
          { _id: sl._id, status: 'running' },
          {
            $set: {
              status: 'failed',
              activeStepNodeKey: null,
              currentStageLabel: 'Tiempo límite / Interrumpida',
              heartbeatAt: new Date(),
              liveSteps: patchedSteps,
              error: 'Tiempo límite de ejecución superado o servidor reiniciado.',
            },
          },
        );
        if (sl.automation) recoveredAutoIds.push(sl.automation);
      }

      if (recoveredAutoIds.length > 0) {
        await Automation.updateMany(
          {
            _id: { $in: recoveredAutoIds },
            lastRunStatus: 'running',
            ...(activeAutoObjIds.length > 0 ? { _id: { $nin: activeAutoObjIds } } : {}),
          },
          {
            $set: {
              lastRunStatus: 'failed',
              lastRunResult: 'Ejecución anterior recuperada automáticamente tras superar el tiempo límite o reinicio.',
            },
          },
        );
      }
    }

    // Asegurar también Automations huérfanas cuyo lastRunStatus quedó en 'running' sin proceso activo
    await Automation.updateMany(
      {
        lastRunStatus: 'running',
        ...(companyId ? { companyId: String(companyId) } : {}),
        ...(automationId && mongoose.Types.ObjectId.isValid(String(automationId))
          ? { _id: new mongoose.Types.ObjectId(String(automationId)) }
          : {}),
        ...(activeAutoObjIds.length > 0 ? { _id: { $nin: activeAutoObjIds } } : {}),
        updatedAt: { $lt: orphanCutoff },
      },
      {
        $set: {
          lastRunStatus: 'failed',
          lastRunResult: 'Ejecución anterior recuperada automáticamente (sin proceso activo en memoria).',
        },
      },
    );
  } catch (reconcileErr) {
    console.warn('[AutomationScheduler] Aviso reconciliando ejecuciones huérfanas:', reconcileErr?.message);
  }
}

/**
 * Rastreador determinista paso a paso para persistir el progreso en vivo y el histórico real del flujo
 * con las llaves exactas de nodos del lienzo visual (`SandboxNodeTraceStep` compatible).
 */
function createLiveRunTracker({ logId, startedAtMs, modelUsed = '', companyName = '' }) {
  const stepsByKey = new Map();
  let activeStepNodeKey = null;
  let currentStageLabel = 'Iniciando flujo...';
  let blockedKeys = new Set();
  let skippedKeys = new Set();

  const buildSnapshot = () => {
    const orderedSteps = Array.from(stepsByKey.values()).map((st, idx) => ({
      ...st,
      stepNumber: idx + 1,
    }));
    const completedNodeKeys = orderedSteps
      .filter((s) => s.status === 'done')
      .map((s) => s.nodeKey);
    const blockedNodeKeys = Array.from(
      new Set([
        ...blockedKeys,
        ...orderedSteps
          .filter((s) => s.status === 'skipped' || s.status === 'error')
          .map((s) => s.nodeKey),
      ]),
    );
    const skippedNodeKeys = Array.from(
      new Set([
        ...skippedKeys,
        ...orderedSteps.filter((s) => s.status === 'skipped').map((s) => s.nodeKey),
      ]),
    );
    return {
      liveSteps: orderedSteps,
      activeStepNodeKey,
      completedNodeKeys,
      blockedNodeKeys,
      skippedNodeKeys,
      currentStageLabel,
      durationMs: Math.max(0, Date.now() - (startedAtMs || Date.now())),
      heartbeatAt: new Date(),
      ...(modelUsed ? { modelUsed } : {}),
      ...(companyName ? { companyName } : {}),
    };
  };

  return {
    upsertStep(stepData) {
      if (!stepData || !stepData.nodeKey) return;
      const prev = stepsByKey.get(stepData.nodeKey) || {};
      stepsByKey.set(stepData.nodeKey, {
        ...prev,
        ...stepData,
      });
    },
    setActiveStage(nodeKey, label) {
      activeStepNodeKey = nodeKey || null;
      if (label) currentStageLabel = String(label);
    },
    markBlockedKeys(keys = []) {
      for (const k of Array.isArray(keys) ? keys : []) {
        if (k) blockedKeys.add(String(k));
      }
    },
    markSkippedKeys(keys = []) {
      for (const k of Array.isArray(keys) ? keys : []) {
        if (k) {
          skippedKeys.add(String(k));
          blockedKeys.add(String(k));
        }
      }
    },
    getSnapshot: buildSnapshot,
    async flush(extraSet = {}, { awaitWrite = false } = {}) {
      if (!logId) return;
      const snap = buildSnapshot();
      const op = AutomationLog.updateOne(
        { _id: logId },
        {
          $set: {
            ...snap,
            ...extraSet,
          },
        },
      ).catch((err) => {
        console.warn('[AutomationScheduler] Non-blocking liveSteps flush error:', err?.message);
      });
      if (awaitWrite) {
        await op;
      }
    },
  };
}

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
 * Limpia y deduplica la lista de certificados/soportes (`evidenceFiles`) para exposición segura en API y MongoDB
 * (remueve rutas internas del sistema de archivos `pdfLocalPath` / `imageLocalPath`).
 */
function sanitizePublicEvidenceList(rawEvidences = []) {
  if (!Array.isArray(rawEvidences) || rawEvidences.length === 0) return [];
  const seen = new Set();
  const clean = [];
  for (const ev of rawEvidences) {
    if (!ev || typeof ev !== 'object') continue;
    const pdfUrl = ev.pdfUrl || null;
    const imageUrl = ev.imageUrl || null;
    if (!pdfUrl && !imageUrl) continue;
    const cedNorm = String(ev.cedula || '').trim();
    const portalNorm = String(ev.portal || '').trim().toLowerCase();
    const titleNorm = String(ev.title || '').trim().toLowerCase();
    const dedupKey =
      cedNorm && cedNorm !== 'N/A'
        ? `person::${cedNorm}::${portalNorm}::${titleNorm}`
        : `${pdfUrl || ''}::${imageUrl || ''}::${cedNorm}::${titleNorm}`;
    if (seen.has(dedupKey)) continue;
    seen.add(dedupKey);
    clean.push({
      workerName: String(ev.workerName || 'Colaborador / Registro').trim(),
      cedula: String(ev.cedula || 'N/A').trim(),
      cargo: String(ev.cargo || '').trim(),
      portal: String(ev.portal || 'Portal Oficial').trim(),
      title: String(ev.title || 'Certificado / Soporte Oficial').trim(),
      pdfUrl,
      pdfDownloadUrl: ev.pdfDownloadUrl || (pdfUrl ? `${pdfUrl}?download=1` : null),
      pdfAbsoluteUrl: ev.pdfAbsoluteUrl || null,
      pdfFileName: ev.pdfFileName || (pdfUrl ? path.basename(String(pdfUrl).split('?')[0]) : null),
      imageUrl,
      imageDownloadUrl: ev.imageDownloadUrl || (imageUrl ? `${imageUrl}?download=1` : null),
      imageAbsoluteUrl: ev.imageAbsoluteUrl || null,
      imageFileName: ev.imageFileName || (imageUrl ? path.basename(String(imageUrl).split('?')[0]) : null),
    });
  }
  return clean;
}

/**
 * Sanitizador post-generación para garantizar CERO ruido visual de URLs o enlaces de descarga
 * dentro del mensaje Markdown o celdas de tablas del Agente IA cuando ya existe la bandeja `evidenceFiles`.
 */
function stripAgentInlineEvidenceNoise(markdownText, evidences = []) {
  if (!markdownText || typeof markdownText !== 'string') return '';
  if (!Array.isArray(evidences) || evidences.length === 0) return markdownText;
  return markdownText
    // Remover imágenes Markdown apuntando a /api/sgsst/automatizaciones/evidencias/...
    .replace(
      /!\[[^\]]*\]\((?:https?:\/\/[^)\s]+)?\/api\/sgsst\/automatizaciones\/evidencias\/[^)\s]+\)/gi,
      '',
    )
    // Reemplazar enlaces Markdown [Descargar PDF](/api/sgsst/automatizaciones/evidencias/...) por insignia limpia
    .replace(
      /\[([^\]]*)\]\((?:https?:\/\/[^)\s]+)?\/api\/sgsst\/automatizaciones\/evidencias\/[^)\s]+\)/gi,
      '📎 En bandeja de soportes',
    )
    // Reemplazar URLs crudas /api/sgsst/automatizaciones/evidencias/... sueltas en texto o tablas
    .replace(
      /(?:https?:\/\/[^\s|)]+)?\/api\/sgsst\/automatizaciones\/evidencias\/[a-zA-Z0-9._-]+(?:\?download=1)?/gi,
      '📎 En bandeja de soportes',
    )
    // Compactar repeticiones si el LLM puso PDF + PNG seguidos en la misma celda
    .replace(/(📎 En bandeja de soportes[\s·,/|-]*){2,}/g, '📎 En bandeja de soportes');
}

/**
 * Detecta si un nodo pertenece a conectores marcados como "En Construcción" en el catálogo oficial,
 * para devolver un paso limpio `🚧 En Construcción (Omitido)` sin romper ni demorar flujos heredados.
 */
function isUnderConstructionNode(nodeKey = '', nodeId = '', customNodeObj = null) {
  if (customNodeObj && customNodeObj.underConstruction === true) return true;
  const hay = `${nodeKey || ''} ${nodeId || ''} ${customNodeObj?.id || ''} ${customNodeObj?.key || ''} ${customNodeObj?.nodeType || ''}`.toLowerCase();
  if (hay.includes('webhook_api')) return false;
  return (
    BLOCKED_WORKFLOW_NODE_IDS.some((blockedId) => hay.includes(blockedId)) ||
    hay.includes('custom_scraper_agy_pensiones') ||
    hay.includes('pensiones_directo') ||
    hay.includes('custom_scraper_agy_salud_rethus') ||
    hay.includes('salud_rethus') ||
    /\bone_drive\b/.test(hay)
  );
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
    `\n📎 [BANDEJA DEDICADA DE CERTIFICADOS Y SOPORTES DESCARGADOS (evidenceFiles: ${evidences.length} archivo(s))]:\n` +
    `${evLines.join('\n')}\n\n` +
    `🚨 REGLA ESTRICTA CERO RUIDO VISUAL EN TABLAS Y MENSAJE DEL AGENTE:\n` +
    `- Tienes TERMINANTEMENTE PROHIBIDO escribir URLs, rutas \`/api/...\`, enlaces Markdown \`[Descargar PDF](...)\`, botones HTML o imágenes \`![...](...)\` dentro de las celdas de tus tablas o cuerpo del mensaje.\n` +
    `- En las celdas de estado de tu tabla usa ÚNICAMENTE estados ejecutivos ultra limpios como: \`✅ VIGENTE\`, \`✅ AFILIADO ACTIVO (ARL SURA)\`, \`❌ SIN REGISTRO\`, \`✅ PAZ Y SALVO\`, y en la columna de soporte escribe solo \`📎 En bandeja\` (o \`—\` si no aplica).\n` +
    `- Al final, menciona en 1 sola línea limpia que los ${evidences.length} certificado(s)/soporte(s) oficiales PDF/PNG ya están disponibles en el cajón aparte **"Certificados y Archivos Descargados"**.\n`
  );
}

/**
 * Formatea Markdown enriquecido a HTML limpio con tablas, encabezados, enlaces, imágenes y negritas para clientes de correo.
 */
function escapeHtmlEmailAttr(str = '') {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function decorateEmailStatusCell(html, rawText) {
  const txt = String(rawText || '').trim();
  if (!txt || txt.length > 65) return html;
  const pill = (bg, fg, brd) =>
    `<span style="display:inline-block;padding:2px 9px;border-radius:9999px;font-size:11px;font-weight:800;background:${bg};color:${fg};border:1px solid ${brd};white-space:nowrap;">${html}</span>`;
  if (/❌|🔴|vencid|crític|no apto|incumpl/i.test(txt)) {
    return pill('#fff1f2', '#be123c', '#fda4af');
  }
  if (/⚠️|🟠|🟡|por vencer|próxim|pendiente|restricci/i.test(txt)) {
    return pill('#fffbeb', '#b45309', '#fcd34d');
  }
  if (/✅|🟢|vigente|apto|cumple|al día|\bok\b/i.test(txt)) {
    return pill('#ecfdf5', '#047857', '#6ee7b7');
  }
  return html;
}

function formatMarkdownToEmailHtml(text) {
  const safeInput = String(text || '').trim();
  if (!safeInput) return '';
  if (
    safeInput.startsWith('<') &&
    (safeInput.includes('<div') || safeInput.includes('<table') || safeInput.includes('<h1'))
  ) {
    return safeInput;
  }

  const baseDomain = String(process.env.DOMAIN_CLIENT || 'https://wappy.club').replace(/\/+$/, '');
  const toAbsUrl = (rawUrl = '') => {
    const u = String(rawUrl || '').trim();
    if (!u) return '';
    if (/^https?:\/\//i.test(u)) return u;
    if (u.startsWith('/')) return `${baseDomain}${u}`;
    return u;
  };

  const formatInlineEmail = (escapedLine = '') => {
    const tokens = [];
    const stash = (snippet) => {
      const idx = tokens.length;
      tokens.push(snippet);
      return `\u0000EMLTOK_${idx}\u0000`;
    };
    let out = String(escapedLine || '')
      .replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_, alt, rawUrl) => {
        const abs = escapeHtmlEmailAttr(toAbsUrl(String(rawUrl || '').replace(/&amp;/g, '&')));
        const safeAlt = escapeHtmlEmailAttr(alt || 'Certificado / Evidencia');
        return stash(
          `<div style="margin:10px 0;"><a href="${abs}" target="_blank" rel="noopener noreferrer"><img src="${abs}" alt="${safeAlt}" style="max-width:100%;max-height:280px;height:auto;border-radius:10px;border:1px solid #cbd5e1;display:block;" /></a></div>`,
        );
      })
      .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, rawUrl) => {
        const abs = escapeHtmlEmailAttr(toAbsUrl(String(rawUrl || '').replace(/&amp;/g, '&')));
        return stash(
          `<a href="${abs}" target="_blank" rel="noopener noreferrer" style="color:#0f766e;font-weight:700;text-decoration:underline;">${label}</a>`,
        );
      })
      .replace(
        /`([^`]+)`/g,
        '<code style="padding:1px 5px;border-radius:5px;background:#f1f5f9;color:#0f172a;font-size:11.5px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;">$1</code>',
      )
      .replace(/\*\*\*(.+?)\*\*\*/g, '<strong style="color:#0f172a;"><em>$1</em></strong>')
      .replace(/\*\*(.+?)\*\*/g, '<strong style="color:#0f172a;font-weight:800;">$1</strong>')
      .replace(/(^|[\s(])\*([^*\n]+)\*(?=[\s).,;:!?]|$)/g, '$1<em>$2</em>');
    return out.replace(/\u0000EMLTOK_(\d+)\u0000/g, (_, i) => tokens[Number(i)] || '');
  };

  // 1. Extraer bloques ```wappy-card
  const cardBlocks = [];
  const withoutCards = safeInput.replace(/```wappy-card[\s\S]*?```/gi, (match) => {
    try {
      const jsonStr = match.replace(/```wappy-card/i, '').replace(/```$/, '').trim();
      const card = JSON.parse(jsonStr);
      const itemsHtml = Array.isArray(card.items)
        ? card.items
            .map((it) => {
              const t = escapeHtmlEmailAttr(typeof it === 'string' ? it : it?.title || '');
              const d = escapeHtmlEmailAttr(
                typeof it === 'string' ? '' : it?.description || it?.subtitle || '',
              );
              return `<li style="margin:4px 0;color:#334155;"><strong style="color:#0f172a;">${t}</strong>${d ? `: ${d}` : ''}</li>`;
            })
            .join('')
        : '';
      const idx = cardBlocks.length;
      cardBlocks.push(
        `<div style="margin:14px 0;padding:14px 16px;border-radius:14px;border:1px solid rgba(13,148,136,0.3);background:linear-gradient(135deg,#f0fdfa 0%,#f8fafc 100%);">` +
          `<div style="font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:0.04em;color:#0f766e;margin:0 0 6px 0;">● ${escapeHtmlEmailAttr(card.title || 'Resumen de Gestión')}</div>` +
          `${card.subtitle || card.description ? `<p style="margin:0 0 8px 0;font-size:12.5px;color:#475569;">${escapeHtmlEmailAttr(card.subtitle || card.description)}</p>` : ''}` +
          `${itemsHtml ? `<ul style="margin:0;padding-left:18px;font-size:12.5px;">${itemsHtml}</ul>` : ''}` +
          `</div>`,
      );
      return `\n@@EMLCARD_${idx}@@\n`;
    } catch (_) {
      return '';
    }
  });

  // 2. Extraer bloques ```code
  const codeBlocks = [];
  const withoutCode = withoutCards
    .replace(/"""/g, '"')
    .replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (_, lang, code) => {
      const idx = codeBlocks.length;
      codeBlocks.push(
        `<div style="margin:12px 0;border-radius:10px;overflow:hidden;border:1px solid #334155;background:#0f172a;">` +
          `<div style="padding:5px 12px;background:#1e293b;color:#5eead4;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.06em;">${escapeHtmlEmailAttr(lang || 'dato')}</div>` +
          `<pre style="margin:0;padding:12px;color:#f1f5f9;font-size:11.5px;font-family:ui-monospace,Menlo,monospace;white-space:pre-wrap;word-break:break-word;">${escapeHtmlEmailAttr(String(code || '').trimEnd())}</pre>` +
          `</div>`,
      );
      return `\n@@EMLCODE_${idx}@@\n`;
    });

  const escaped = withoutCode.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const lines = escaped.split('\n');
  const htmlOut = [];
  let listType = null;
  let olCounter = 0;
  let tableRows = [];
  let bannerTitle = '';

  const closeList = () => {
    if (listType === 'ul') htmlOut.push('</ul>');
    else if (listType === 'ol') htmlOut.push('</ol>');
    listType = null;
    olCounter = 0;
  };

  const flushTable = () => {
    if (tableRows.length === 0) return;
    const headerRow = tableRows[0];
    const bodyRows = tableRows.slice(1);
    let tbl =
      '<div style="overflow-x:auto;margin:14px 0;border-radius:14px;border:1px solid #e2e8f0;background:#ffffff;">' +
      '<table style="width:100%;border-collapse:separate;border-spacing:0;font-size:12px;"><thead><tr style="background:linear-gradient(90deg,#0f766e 0%,#0d9488 65%,#0ea5e9 100%);">';
    headerRow.forEach((cell) => {
      tbl += `<th style="padding:10px 12px;text-align:left;font-weight:800;font-size:10.5px;text-transform:uppercase;letter-spacing:0.05em;color:#ffffff;border-bottom:2px solid #0f766e;">${formatInlineEmail(cell)}</th>`;
    });
    tbl += '</tr></thead><tbody>';
    bodyRows.forEach((row, rIdx) => {
      const bg = rIdx % 2 === 0 ? '#ffffff' : '#f8fafc';
      tbl += `<tr style="background:${bg};">`;
      row.forEach((cell) => {
        tbl += `<td style="padding:9px 12px;border-bottom:1px solid #e2e8f0;color:#334155;vertical-align:middle;line-height:1.4;">${decorateEmailStatusCell(formatInlineEmail(cell), cell)}</td>`;
      });
      tbl += '</tr>';
    });
    tbl += '</tbody></table></div>';
    htmlOut.push(tbl);
    tableRows = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (line.startsWith('|') && line.endsWith('|') && line.length > 2) {
      closeList();
      if (line.replace(/[\s|:-]/g, '').length === 0) continue;
      tableRows.push(line.split('|').slice(1, -1).map((c) => c.trim()));
      continue;
    }
    flushTable();
    if (!line) {
      closeList();
      continue;
    }
    const cardM = line.match(/^@@EMLCARD_(\d+)@@$/);
    if (cardM) {
      closeList();
      htmlOut.push(cardBlocks[Number(cardM[1])] || '');
      continue;
    }
    const codeM = line.match(/^@@EMLCODE_(\d+)@@$/);
    if (codeM) {
      closeList();
      htmlOut.push(codeBlocks[Number(codeM[1])] || '');
      continue;
    }
    const ordM = line.match(/^(\d+)[.)]\s+(.+)$/);
    if (/^-{3,}$/.test(line)) {
      closeList();
      htmlOut.push('<hr style="margin:16px 0;border:none;border-top:1px solid #cbd5e1;" />');
    } else if (line.startsWith('#### ')) {
      closeList();
      htmlOut.push(
        `<h4 style="margin:14px 0 6px 0;font-size:11.5px;font-weight:900;text-transform:uppercase;letter-spacing:0.06em;color:#0f766e;">${formatInlineEmail(line.slice(5))}</h4>`,
      );
    } else if (line.startsWith('### ')) {
      closeList();
      htmlOut.push(
        `<h3 style="margin:18px 0 8px 0;padding-left:10px;border-left:4px solid #0d9488;font-size:14px;font-weight:800;color:#0f172a;">${formatInlineEmail(line.slice(4))}</h3>`,
      );
    } else if (line.startsWith('## ')) {
      closeList();
      htmlOut.push(
        `<h2 style="margin:20px 0 10px 0;padding:8px 12px;border-radius:10px;border-bottom:2px solid rgba(13,148,136,0.35);background:linear-gradient(90deg,rgba(15,118,110,0.10),rgba(14,165,233,0.03));font-size:14.5px;font-weight:900;color:#115e59;">${formatInlineEmail(line.slice(3))}</h2>`,
      );
    } else if (line.startsWith('# ')) {
      closeList();
      const rawH = line.slice(2).trim();
      if (!bannerTitle) {
        bannerTitle = rawH;
      } else {
        htmlOut.push(
          `<h1 style="margin:18px 0 10px 0;padding:10px 14px;border-radius:12px;background:linear-gradient(90deg,#0f766e,#0d9488,#0ea5e9);color:#ffffff;font-size:16px;font-weight:900;">${formatInlineEmail(rawH)}</h1>`,
        );
      }
    } else if (line.startsWith('&gt; ')) {
      closeList();
      const q = line.slice(5);
      const isDanger = /🚨|❌|crític|vencid|urgente|incumpl/i.test(q);
      const isWarn = !isDanger && /⚠️|próxim|atención|alerta|pendiente/i.test(q);
      const st = isDanger
        ? 'border-left:4px solid #e11d48;background:#fff1f2;color:#881337;'
        : isWarn
          ? 'border-left:4px solid #d97706;background:#fffbeb;color:#78350f;'
          : 'border-left:4px solid #0d9488;background:#f0fdfa;color:#134e4a;';
      htmlOut.push(
        `<blockquote style="margin:12px 0;padding:10px 14px;border-radius:10px;font-size:12.5px;line-height:1.5;${st}">${formatInlineEmail(q)}</blockquote>`,
      );
    } else if (ordM) {
      if (listType !== 'ol') {
        closeList();
        htmlOut.push('<ol style="margin:10px 0;padding-left:22px;color:#334155;">');
        listType = 'ol';
        olCounter = 0;
      }
      olCounter += 1;
      htmlOut.push(
        `<li style="margin:5px 0;line-height:1.55;color:#334155;">${formatInlineEmail(ordM[2])}</li>`,
      );
    } else if (line.startsWith('- ') || line.startsWith('* ') || line.startsWith('• ')) {
      if (listType !== 'ul') {
        closeList();
        htmlOut.push('<ul style="margin:8px 0;padding-left:20px;color:#334155;">');
        listType = 'ul';
      }
      htmlOut.push(
        `<li style="margin:4px 0;line-height:1.55;color:#334155;">${formatInlineEmail(line.slice(2))}</li>`,
      );
    } else {
      closeList();
      htmlOut.push(
        `<p style="margin:8px 0;line-height:1.6;color:#334155;font-size:13px;">${formatInlineEmail(line)}</p>`,
      );
    }
  }

  flushTable();
  closeList();

  const safeBannerTitle = escapeHtmlEmailAttr(
    (bannerTitle || 'Informe Ejecutivo SG-SST').replace(/\*+/g, '').replace(/`/g, '').trim(),
  );
  const topBanner =
    `<div data-wappy-canva-banner="1" style="background:linear-gradient(135deg,#0f766e 0%,#0d9488 52%,#0ea5e9 100%);border-radius:16px;padding:16px 18px;color:#ffffff;margin-bottom:16px;">` +
    `<div style="font-size:10px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;color:#d1fae5;margin-bottom:4px;">WAPPY IA · INFORME EJECUTIVO SG-SST</div>` +
    `<div style="font-size:17px;font-weight:900;line-height:1.25;color:#ffffff;">${safeBannerTitle}</div>` +
    `</div>`;

  return (
    `<div style="background:#ffffff;color:#0f172a;border-radius:16px;padding:18px 20px;border:1px solid #cbd5e1;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;font-size:13px;line-height:1.6;">` +
    `${topBanner}\n${htmlOut.join('\n')}` +
    `</div>`
  );
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

/**
 * Parsea listas de correos desde cadena separada por comas/punto y coma o arreglo, devolviendo correos válidos deduplicados.
 */
function parseEmailList(rawInput) {
  if (!rawInput) return [];
  const items = Array.isArray(rawInput)
    ? rawInput
    : String(rawInput)
        .split(/[,;\n]+/)
        .map((s) => s.trim());
  const seen = new Set();
  const out = [];
  for (const item of items) {
    const clean = String(item || '').trim();
    if (clean && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean) && !seen.has(clean.toLowerCase())) {
      seen.add(clean.toLowerCase());
      out.push(clean);
    }
  }
  return out;
}

/**
 * Construye pre-extracciones reales (`extract_drive`, `extract_gmail`, `extract_web_search`, `webhook_api`),
 * resúmenes en vivo de entradas especiales (`pronostico_clima_sst`, `somos_sst_perfiles_cargo`, `somos_sst_epp`,
 * `somos_sst_examenes`, `cursos_lms`) y procesamiento estructurado de `logic_merge` y `logic_loop`.
 */
async function buildLivePreExtractionAndLogicBlocks({
  automation,
  reqUser,
  targetCompanyIdStr,
  automationCompany,
  effectiveAiModel,
  alreadyProcessedKeysSet = new Set(),
}) {
  const wf = automation?.workflowNodes || {};
  const extractors = Array.isArray(wf.extractors) ? wf.extractors : [];
  const inputs = Array.isArray(wf.inputs) ? wf.inputs : [];
  const hitos = Array.isArray(wf.hitos) ? wf.hitos : [];
  const normalizedHitosSet = new Set(hitos.map((h) => normalizeInspectorNodeId(h)));
  const nodeConfigs = wf?.canvasLayout?.nodeConfigs || wf?.nodeConfigs || {};
  const customNodes = Array.isArray(wf?.canvasLayout?.customNodes)
    ? wf.canvasLayout.customNodes
    : Array.isArray(wf.customNodes)
      ? wf.customNodes
      : [];
  const logicNodes = Array.isArray(wf?.canvasLayout?.logicNodes)
    ? wf.canvasLayout.logicNodes
    : [];

  const safeProcessedSet =
    alreadyProcessedKeysSet instanceof Set
      ? alreadyProcessedKeysSet
      : Array.isArray(alreadyProcessedKeysSet)
        ? new Set(alreadyProcessedKeysSet.filter(Boolean).map(String))
        : new Set();

  const getNodeCfg = (...keys) => {
    for (const k of keys) {
      if (k && nodeConfigs[k] && typeof nodeConfigs[k] === 'object') {
        return nodeConfigs[k];
      }
    }
    return {};
  };

  const blocks = [];
  const freshDriveFiles = [];
  const deduplicatedDriveFiles = [];
  const freshGmailMessages = [];
  const deduplicatedGmailMessages = [];
  const externalCandidateKeysSet = new Set();

  const traceMeta = {
    driveFilesPrelisted: 0,
    freshDriveFilesCount: 0,
    deduplicatedDriveFilesCount: 0,
    gmailMessagesPreextracted: 0,
    freshGmailMessagesCount: 0,
    deduplicatedGmailMessagesCount: 0,
    webSearchExecuted: false,
    webhookEndpointsFetched: 0,
    mergedRecordsCount: 0,
    batchesProcessed: 0,
  };

  const userIdStr = String(automation?.user || reqUser?.id || '');
  const companyName = automationCompany?.companyName || 'Empresa Activa';

  // 1. Pre-extracción real de Google Drive (`extract_drive` / `driveFolderId` / `driveFolderUrl` / `driveFolderName`)
  const driveCfg = getNodeCfg(
    'extractor_extract_drive',
    'ext_extract_drive',
    'extract_drive',
    'tool_inputs_google_drive',
    'google_drive',
  );
  const hasExplicitDriveSelector = Boolean(
    driveCfg?.driveFolderId ||
      driveCfg?.driveFolderUrl ||
      driveCfg?.driveFolderName ||
      driveCfg?.fileNameFilter,
  );
  if (
    extractors.includes('extract_drive') ||
    (inputs.includes('google_drive') && hasExplicitDriveSelector)
  ) {
    try {
      const oauthCtx = await getCompanyGoogleOAuthClient(userIdStr, targetCompanyIdStr);
      const rawFolderId = String(driveCfg?.driveFolderId || '').trim();
      const rawFolderUrl = String(driveCfg?.driveFolderUrl || '').trim();
      const folderName = String(driveCfg?.driveFolderName || '').trim();
      const fileNameFilter = String(driveCfg?.fileNameFilter || '').trim();
      const fileTypeFilter = String(driveCfg?.fileTypeFilter || 'all').toLowerCase().trim();
      const maxItems = Math.min(40, Math.max(1, parseInt(driveCfg?.maxItems, 10) || 15));
      const folderLabel = folderName || rawFolderUrl || rawFolderId || '';

      if (!oauthCtx) {
        blocks.push(
          `📂 [PRE-EXTRACCIÓN GOOGLE DRIVE (extract_drive${folderLabel ? ` — Ubicación: "${folderLabel}"` : ''})]: Google Drive NO está vinculado por OAuth para "${companyName}". Informa con transparencia que requiere conectar Google Drive en Integraciones.`,
        );
      } else {
        const drive = oauthCtx.google.drive({ version: 'v3', auth: oauthCtx.oauth2Client });
        const escapeDriveStr = (v) => String(v || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");

        const buildMimeClause = () => {
          if (!fileTypeFilter || fileTypeFilter === 'all') return '';
          if (fileTypeFilter.includes('pdf')) return ` and mimeType = 'application/pdf'`;
          if (fileTypeFilter.includes('sheet') || fileTypeFilter.includes('excel') || fileTypeFilter.includes('xlsx')) {
            return ` and (mimeType = 'application/vnd.google-apps.spreadsheet' or mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' or mimeType = 'text/csv')`;
          }
          if (fileTypeFilter.includes('doc') || fileTypeFilter.includes('word')) {
            return ` and (mimeType = 'application/vnd.google-apps.document' or mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')`;
          }
          if (fileTypeFilter.includes('image') || fileTypeFilter.includes('img') || fileTypeFilter.includes('foto')) {
            return ` and mimeType contains 'image/'`;
          }
          return '';
        };

        const buildNameFilterClause = () =>
          fileNameFilter ? ` and name contains '${escapeDriveStr(fileNameFilter)}'` : '';

        const findDriveFolderSegment = async (segName, parentId = null) => {
          const escSeg = escapeDriveStr(segName);
          const parentCond = parentId ? ` and '${escapeDriveStr(parentId)}' in parents` : '';
          const exactRes = await drive.files
            .list({
              q: `mimeType = 'application/vnd.google-apps.folder' and trashed = false and name = '${escSeg}'${parentCond}`,
              pageSize: 5,
              fields: 'files(id, name, modifiedTime)',
            })
            .catch(() => null);
          const exactArr = Array.isArray(exactRes?.data?.files) ? exactRes.data.files : [];
          if (exactArr.length > 0) return exactArr[0];

          const partialRes = await drive.files
            .list({
              q: `mimeType = 'application/vnd.google-apps.folder' and trashed = false and name contains '${escSeg}'${parentCond}`,
              pageSize: 5,
              orderBy: 'modifiedTime desc',
              fields: 'files(id, name, modifiedTime)',
            })
            .catch(() => null);
          const partialArr = Array.isArray(partialRes?.data?.files) ? partialRes.data.files : [];
          return (
            partialArr.find((f) => String(f.name || '').toLowerCase() === segName.toLowerCase()) ||
            partialArr[0] ||
            null
          );
        };

        let targetFiles = [];
        let matchedFolderInfo = '';
        const exactDriveId =
          extractGoogleDriveId(rawFolderId) ||
          extractGoogleDriveId(rawFolderUrl) ||
          extractGoogleDriveId(folderName);

        if (exactDriveId) {
          if (exactDriveId === 'root') {
            matchedFolderInfo = 'Carpeta raíz: "Mi unidad" (folderId: root)';
            const rootRes = await drive.files.list({
              q: `'root' in parents and trashed = false and mimeType != 'application/vnd.google-apps.folder'${buildMimeClause()}${buildNameFilterClause()}`,
              pageSize: maxItems,
              orderBy: 'modifiedTime desc',
              fields: 'files(id, name, mimeType, modifiedTime, webViewLink)',
            });
            targetFiles = Array.isArray(rootRes?.data?.files) ? rootRes.data.files : [];
          } else {
            const itemMetaRes = await drive.files
              .get({
                fileId: exactDriveId,
                fields: 'id, name, mimeType, modifiedTime, webViewLink',
              })
              .catch(() => null);
            const itemMeta = itemMetaRes?.data;

            if (itemMeta?.id && itemMeta.mimeType !== 'application/vnd.google-apps.folder') {
              matchedFolderInfo = `Archivo directo por ID/URL: "${itemMeta.name}" (fileId: ${itemMeta.id})`;
              targetFiles = [itemMeta];
            } else {
              const resolvedName = itemMeta?.name || folderName || exactDriveId;
              matchedFolderInfo = `Carpeta exacta por ID/URL: "${resolvedName}" (folderId: ${exactDriveId})`;
              const filesRes = await drive.files.list({
                q: `'${escapeDriveStr(exactDriveId)}' in parents and trashed = false and mimeType != 'application/vnd.google-apps.folder'${buildMimeClause()}${buildNameFilterClause()}`,
                pageSize: maxItems,
                orderBy: 'modifiedTime desc',
                fields: 'files(id, name, mimeType, modifiedTime, webViewLink)',
              });
              targetFiles = Array.isArray(filesRes?.data?.files) ? filesRes.data.files : [];
            }
          }
        } else if (folderName && folderName.includes('/') && !/^https?:\/\//i.test(folderName)) {
          const rawSegments = folderName
            .split('/')
            .map((s) => s.trim())
            .filter(Boolean)
            .filter(
              (seg, idx) =>
                !(idx === 0 && ['mi unidad', 'my drive', 'root'].includes(seg.toLowerCase())),
            );
          let currentFolder = null;
          for (let i = 0; i < rawSegments.length; i++) {
            const nextFolder = await findDriveFolderSegment(
              rawSegments[i],
              i === 0 ? null : currentFolder?.id,
            );
            if (!nextFolder) {
              currentFolder = null;
              break;
            }
            currentFolder = nextFolder;
          }
          if (!currentFolder && rawSegments.length > 0) {
            currentFolder = await findDriveFolderSegment(rawSegments[rawSegments.length - 1], null);
          }

          if (currentFolder?.id) {
            matchedFolderInfo = `Ruta de carpeta encontrada: "${currentFolder.name}" (folderId: ${currentFolder.id})`;
            const filesRes = await drive.files.list({
              q: `'${escapeDriveStr(currentFolder.id)}' in parents and trashed = false and mimeType != 'application/vnd.google-apps.folder'${buildMimeClause()}${buildNameFilterClause()}`,
              pageSize: maxItems,
              orderBy: 'modifiedTime desc',
              fields: 'files(id, name, mimeType, modifiedTime, webViewLink)',
            });
            targetFiles = Array.isArray(filesRes?.data?.files) ? filesRes.data.files : [];
          } else {
            const lastSeg = rawSegments[rawSegments.length - 1] || folderName;
            matchedFolderInfo = `No se halló ruta "${folderName}"; listando coincidencias por "${lastSeg}"`;
            const fallbackRes = await drive.files.list({
              q: `trashed = false and mimeType != 'application/vnd.google-apps.folder' and name contains '${escapeDriveStr(lastSeg)}'${buildMimeClause()}${buildNameFilterClause()}`,
              pageSize: maxItems,
              orderBy: 'modifiedTime desc',
              fields: 'files(id, name, mimeType, modifiedTime, webViewLink)',
            });
            targetFiles = Array.isArray(fallbackRes?.data?.files) ? fallbackRes.data.files : [];
          }
        } else if (folderName) {
          const exactFolder = await findDriveFolderSegment(folderName, null);
          if (exactFolder?.id) {
            matchedFolderInfo = `Carpeta encontrada: "${exactFolder.name}" (folderId: ${exactFolder.id})`;
            const filesRes = await drive.files.list({
              q: `'${escapeDriveStr(exactFolder.id)}' in parents and trashed = false and mimeType != 'application/vnd.google-apps.folder'${buildMimeClause()}${buildNameFilterClause()}`,
              pageSize: maxItems,
              orderBy: 'modifiedTime desc',
              fields: 'files(id, name, mimeType, modifiedTime, webViewLink)',
            });
            targetFiles = Array.isArray(filesRes?.data?.files) ? filesRes.data.files : [];
          } else {
            matchedFolderInfo = `No se halló carpeta llamada "${folderName}"; listando coincidencias directas por nombre`;
            const fallbackRes = await drive.files.list({
              q: `trashed = false and mimeType != 'application/vnd.google-apps.folder' and name contains '${escapeDriveStr(folderName)}'${buildMimeClause()}${buildNameFilterClause()}`,
              pageSize: maxItems,
              orderBy: 'modifiedTime desc',
              fields: 'files(id, name, mimeType, modifiedTime, webViewLink)',
            });
            targetFiles = Array.isArray(fallbackRes?.data?.files) ? fallbackRes.data.files : [];
          }
        } else {
          const recentRes = await drive.files.list({
            q: `trashed = false and mimeType != 'application/vnd.google-apps.folder'${buildMimeClause()}${buildNameFilterClause()}`,
            pageSize: maxItems,
            orderBy: 'modifiedTime desc',
            fields: 'files(id, name, mimeType, modifiedTime, webViewLink)',
          });
          targetFiles = Array.isArray(recentRes?.data?.files) ? recentRes.data.files : [];
        }

        for (const f of targetFiles) {
          const cleanFileId = String(f?.id || '').trim();
          const driveKey = cleanFileId ? `drive:${cleanFileId}` : '';
          if (driveKey && safeProcessedSet.has(driveKey)) {
            deduplicatedDriveFiles.push(f);
          } else {
            freshDriveFiles.push(f);
            if (driveKey) externalCandidateKeysSet.add(driveKey);
          }
        }

        traceMeta.driveFilesPrelisted = targetFiles.length;
        traceMeta.freshDriveFilesCount = freshDriveFiles.length;
        traceMeta.deduplicatedDriveFilesCount = deduplicatedDriveFiles.length;

        if (targetFiles.length > 0) {
          const freshLines = freshDriveFiles.map(
            (f, idx) =>
              `  ${idx + 1}. [NUEVO SIN PROCESAR] "${f.name}" | fileId: "${f.id}" | mimeType: ${f.mimeType} | Modificado: ${f.modifiedTime || 'N/A'}`,
          );
          const dedupLines = deduplicatedDriveFiles.map(
            (f, idx) =>
              `  ${idx + 1}. [YA PROCESADO — OMITIR] "${f.name}" | fileId: "${f.id}" | Modificado: ${f.modifiedTime || 'N/A'}`,
          );
          if (freshDriveFiles.length > 0) {
            blocks.push(
              `📂 [ARCHIVOS REALES PRE-LISTADOS EN GOOGLE DRIVE${folderName ? ` — Carpeta "${folderName}"` : ''} (${matchedFolderInfo || 'Raíz / Recientes'})]:\n` +
                `• NUEVOS SIN PROCESAR (${freshDriveFiles.length}):\n${freshLines.join('\n')}` +
                (dedupLines.length > 0
                  ? `\n• YA PROCESADOS EN CORRIDAS ANTERIORES — NO REPROCESAR (${deduplicatedDriveFiles.length}):\n${dedupLines.join('\n')}`
                  : '') +
                `\n👉 INSTRUCCIÓN DIRECTA: Invoca la herramienta "google_drive" (action: "read_document_content" o "readFile") pasando ÚNICAMENTE los "fileId" marcados como [NUEVO SIN PROCESAR] sin adivinar IDs ni reprocesar archivos ya gestionados.`,
            );
          } else {
            blocks.push(
              `📂 [PRE-EXTRACCIÓN GOOGLE DRIVE${folderName ? ` — Carpeta "${folderName}"` : ''}]: Existen 0 archivos nuevos sin procesar (${deduplicatedDriveFiles.length} archivo(s) encontrado(s) en carpeta ya fueron procesados previamente dentro de la ventana anti-duplicados; NO reprocesar).\n` +
                dedupLines.join('\n'),
            );
          }
        } else {
          blocks.push(
            `📂 [PRE-EXTRACCIÓN GOOGLE DRIVE${folderName ? ` — Carpeta "${folderName}"` : ''}]: Conectado correctamente (${matchedFolderInfo || 'Drive activo'}), pero existen 0 archivos que coincidan actualmente.`,
          );
        }
      }
    } catch (driveErr) {
      console.warn('[AutomationScheduler] Aviso pre-listando Google Drive:', driveErr?.message);
    }
  }

  // 2. Pre-extracción real de Gmail (`extract_gmail`)
  const gmailCfg = getNodeCfg(
    'extractor_extract_gmail',
    'ext_extract_gmail',
    'extract_gmail',
    'tool_inputs_google_gmail',
    'google_gmail',
  );
  if (extractors.includes('extract_gmail')) {
    try {
      const { listEmails, readEmail } = require('./googleGmail');
      const subjectFilter = String(gmailCfg?.emailSubjectFilter || '').trim();
      const maxItems = Math.min(15, Math.max(1, parseInt(gmailCfg?.maxItems, 10) || 6));
      const gmailQuery = subjectFilter ? `subject:("${subjectFilter.replace(/"/g, '')}")` : 'newer_than:7d';
      const rawEmails = await listEmails(
        userIdStr,
        { query: gmailQuery, maxResults: maxItems },
        targetCompanyIdStr,
      );
      const emails = Array.isArray(rawEmails)
        ? rawEmails
        : Array.isArray(rawEmails?.messages)
          ? rawEmails.messages
          : [];

      for (const em of emails) {
        const cleanMsgId = String(em?.id || '').trim();
        const gmailKey = cleanMsgId ? `gmail:${cleanMsgId}` : '';
        if (gmailKey && safeProcessedSet.has(gmailKey)) {
          deduplicatedGmailMessages.push(em);
        } else {
          freshGmailMessages.push(em);
          if (gmailKey) externalCandidateKeysSet.add(gmailKey);
        }
      }

      traceMeta.gmailMessagesPreextracted = emails.length;
      traceMeta.freshGmailMessagesCount = freshGmailMessages.length;
      traceMeta.deduplicatedGmailMessagesCount = deduplicatedGmailMessages.length;

      if (emails.length > 0) {
        if (freshGmailMessages.length > 0) {
          const detailed = [];
          for (const em of freshGmailMessages.slice(0, 5)) {
            try {
              const full = await readEmail(userIdStr, em.id, targetCompanyIdStr);
              detailed.push(
                `  • [NUEVO SIN PROCESAR | messageId: ${em.id}] De: ${full.from || em.from} | Asunto: "${full.subject || em.subject}" | Fecha: ${full.date || em.date}\n    Extracto: ${String(full.body || full.snippet || em.snippet || '').replace(/\s+/g, ' ').trim().slice(0, 500)}`,
              );
            } catch (_) {
              detailed.push(
                `  • [NUEVO SIN PROCESAR | messageId: ${em.id}] De: ${em.from} | Asunto: "${em.subject}" | Fecha: ${em.date} | Extracto: ${String(em.snippet || '').slice(0, 300)}`,
              );
            }
          }
          const dedupNote =
            deduplicatedGmailMessages.length > 0
              ? `\n  • (🛡️ Anti-Duplicados: ${deduplicatedGmailMessages.length} mensaje(s) anterior(es) ya procesados omitidos)`
              : '';
          blocks.push(
            `📧 [CORREOS REALES PRE-EXTRAÍDOS DE GMAIL (extract_gmail${subjectFilter ? ` — Filtro asunto: "${subjectFilter}"` : ''} · ${freshGmailMessages.length} nuevo(s))]:\n${detailed.join('\n')}${dedupNote}`,
          );
        } else {
          blocks.push(
            `📧 [PRE-EXTRACCIÓN GMAIL]: Existen 0 correos nuevos sin procesar (${deduplicatedGmailMessages.length} mensaje(s) coincidente(s) ya fueron procesados previamente dentro de la ventana anti-duplicados).`,
          );
        }
      } else {
        blocks.push(
          `📧 [PRE-EXTRACCIÓN GMAIL]: Bandeja consultada correctamente (${gmailQuery}), 0 mensajes coincidentes.`,
        );
      }
    } catch (gmErr) {
      blocks.push(
        `📧 [PRE-EXTRACCIÓN GMAIL]: Gmail OAuth no conectado o expirado para "${companyName}" (${gmErr?.message || 'sin sesión'}).`,
      );
    }
  }

  // 2B. Pre-listado pasivo (0 tokens IA) cuando `extract_ai_doc_ocr` se conecta sin `extract_drive` / `extract_gmail` separados
  if (
    (extractors.includes('extract_ai_doc_ocr') ||
      extractors.includes('extractor_extract_ai_doc_ocr')) &&
    !extractors.includes('extract_drive') &&
    !extractors.includes('extract_gmail')
  ) {
    try {
      const aiExtCfg = getNodeCfg(
        'extractor_extract_ai_doc_ocr',
        'ext_extract_ai_doc_ocr',
        'extract_ai_doc_ocr',
      );
      const pcCfgPre = getNodeCfg(
        'extractor_extract_pc_folder',
        'ext_extract_pc_folder',
        'extract_pc_folder',
      );
      const passiveMeta = await listPassiveCandidateMetadata({
        userId: userIdStr,
        companyId: targetCompanyIdStr,
        extractorCfg: aiExtCfg,
        driveCfg: driveCfg,
        gmailCfg: gmailCfg,
        pcCfg: pcCfgPre,
        maxItems: Math.min(15, Math.max(1, parseInt(aiExtCfg?.maxItems, 10) || 8)),
      });
      const candList = Array.isArray(passiveMeta?.candidateFiles) ? passiveMeta.candidateFiles : [];
      let freshCandCount = 0;
      let dedupCandCount = 0;
      for (const c of candList) {
        const cKey = `${c.sourceType || 'ai_doc'}:${c.id}`;
        if (safeProcessedSet.has(cKey)) {
          dedupCandCount += 1;
        } else {
          freshCandCount += 1;
          externalCandidateKeysSet.add(cKey);
        }
      }
      traceMeta.driveFilesPrelisted += candList.length;
      traceMeta.freshDriveFilesCount += freshCandCount;
      traceMeta.deduplicatedDriveFilesCount += dedupCandCount;
    } catch (aiPreErr) {
      console.warn(
        '[AutomationScheduler] Aviso en pre-listado pasivo de extract_ai_doc_ocr:',
        aiPreErr?.message,
      );
    }
  }

  // 3. Pre-ejecución de Búsqueda Web Fundamentada (`extract_web_search`)
  if (extractors.includes('extract_web_search')) {
    try {
      const wsCfg = getNodeCfg('extractor_extract_web_search', 'ext_extract_web_search', 'extract_web_search');
      const searchQueryStr = String(
        wsCfg?.searchQuery ||
          wsCfg?.targetUrl ||
          wsCfg?.customInstruction ||
          automation?.prompt ||
          `Normativa vigente SG-SST Colombia aplicable a ${companyName}`,
      )
        .trim()
        .slice(0, 300);
      const searchExec = await executeSandboxAgentCall({
        reqUser,
        agentDoc: {
          name: 'Buscador Normativo Web WAPPY',
          model: effectiveAiModel,
          instructions:
            'Eres un motor de búsqueda normativa y técnica SST en Colombia (MinTrabajo, ARL, Decreto 1072/2015, Res. 0312/2019, Res. 4272/2021, PESV). Entrega de 3 a 5 hallazgos verificados, concisos y con fuente oficial.',
        },
        fullPrompt: `Consulta en vivo sobre: "${searchQueryStr}". Resume los hallazgos oficiales más recientes aplicables a "${companyName}".`,
        useWebSearch: true,
      });
      if (searchExec?.text) {
        traceMeta.webSearchExecuted = true;
        blocks.push(
          `🌐 [BÚSQUEDA WEB FUNDAMENTADA EN VIVO (extract_web_search — ${effectiveAiModel})]:\n${searchExec.text.slice(0, 2200)}`,
        );
      }
    } catch (wsErr) {
      console.warn('[AutomationScheduler] Aviso en extract_web_search:', wsErr?.message);
    }
  }

  // 4. Pre-consulta HTTP segura para `webhook_api` (8s timeout + anti-SSRF)
  const webhookApiCandidates = [];
  if (inputs.includes('webhook_api') || extractors.includes('webhook_api')) {
    const whCfg = getNodeCfg(
      'tool_inputs_webhook_api',
      'extractor_webhook_api',
      'ext_webhook_api',
      'webhook_api',
    );
    if (whCfg?.endpointUrl || whCfg?.targetUrl) {
      webhookApiCandidates.push({
        label: whCfg.customTitle || 'Conector API HTTPS (webhook_api)',
        endpointUrl: whCfg.endpointUrl || whCfg.targetUrl,
        headers: whCfg.headers || {},
      });
    }
  }
  for (const cn of customNodes) {
    if (!cn) continue;
    const cnHay = `${cn.id || ''} ${cn.key || ''} ${cn.nodeType || ''}`.toLowerCase();
    if (cnHay.includes('webhook_api')) {
      const cnCfg = { ...(cn.config || {}), ...(nodeConfigs[cn.key || cn.id] || {}) };
      const ep = cnCfg.endpointUrl || cnCfg.targetUrl || cn.targetUrl;
      if (ep) {
        webhookApiCandidates.push({
          label: cn.title || 'Conector API HTTPS',
          endpointUrl: ep,
          headers: cnCfg.headers || {},
        });
      }
    }
  }
  for (const cand of webhookApiCandidates.slice(0, 3)) {
    const whRes = await fetchSafeWebhookApiData(cand.endpointUrl, cand.headers);
    if (whRes.ok) {
      traceMeta.webhookEndpointsFetched += 1;
      blocks.push(
        `🔌 [RESPUESTA EN VIVO API EXTERNA (${cand.label} — HTTP ${whRes.status})]:\n${whRes.previewText.slice(0, 3500)}`,
      );
    } else {
      blocks.push(
        `🔌 [AVISO CONECTOR API EXTERNA (${cand.label})]: ${whRes.error || 'No fue posible consultar el endpoint.'}`,
      );
    }
  }

  // 5. Resúmenes reales en vivo para entradas especiales (`inputs`)
  if (inputs.includes('pronostico_clima_sst')) {
    try {
      const rawCity = String(automationCompany?.city || 'Bogotá').trim();
      const normCity = rawCity
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z]/g, '');
      const coords =
        Object.entries(COLOMBIAN_CITIES_COORDS).find(
          ([k]) => normCity.includes(k) || k.includes(normCity),
        )?.[1] || COLOMBIAN_CITIES_COORDS.bogota;
      const ctrl = new AbortController();
      const tId = setTimeout(() => ctrl.abort(), 5000);
      try {
        const meteoResp = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,wind_gusts_10m&daily=precipitation_probability_max,wind_speed_10m_max&timezone=America%2FBogota&forecast_days=1`,
          { signal: ctrl.signal },
        );
        if (meteoResp.ok) {
          const mJson = await meteoResp.json();
          const cur = mJson?.current || {};
          const daily = mJson?.daily || {};
          const windMax = Math.max(
            Number(cur.wind_speed_10m || 0),
            Number(cur.wind_gusts_10m || 0),
            Number(daily.wind_speed_10m_max?.[0] || 0),
          );
          const rainProb = Number(daily.precipitation_probability_max?.[0] || 0);
          const alturasAlert =
            windMax >= 35 || Number(cur.precipitation || 0) > 1.5
              ? '⚠️ ALERTA CRÍTICA RES. 4272/2021: Suspender o restringir izajes y trabajo en alturas a la intemperie.'
              : '✅ Condiciones meteorológicas operativas normales para campo.';
          blocks.push(
            `🌦️ [PRONÓSTICO CLIMÁTICO SST EN VIVO (${coords.name} — Open-Meteo)]: Temperatura: ${cur.temperature_2m ?? 'N/A'}°C | Humedad: ${cur.relative_humidity_2m ?? 'N/A'}% | Precipitación actual: ${cur.precipitation ?? 0} mm (Prob. lluvia hoy: ${rainProb}%) | Viento: ${cur.wind_speed_10m ?? 0} km/h (Ráfagas máx: ${windMax} km/h) | Dictamen Alturas/Campo: ${alturasAlert}`,
          );
        }
      } finally {
        clearTimeout(tId);
      }
    } catch (wErr) {
      console.warn('[AutomationScheduler] Aviso pronostico_clima_sst:', wErr?.message);
    }
  }

  if (
    inputs.includes('somos_sst_perfiles_cargo') &&
    !normalizedHitosSet.has('hito2_perfiles_cargo') &&
    !normalizedHitosSet.has('hito1_perfiles_cargo') &&
    targetCompanyIdStr &&
    mongoose.Types.ObjectId.isValid(targetCompanyIdStr)
  ) {
    try {
      const PerfilCargoModel = mongoose.models.PerfilCargoData;
      const doc = PerfilCargoModel
        ? await PerfilCargoModel.findOne({ companyId: targetCompanyIdStr }).lean()
        : await mongoose.connection.db
            .collection('perfilcargodatas')
            .findOne({ companyId: new mongoose.Types.ObjectId(targetCompanyIdStr) });
      const perfiles = Array.isArray(doc?.perfilesList) ? doc.perfilesList : [];
      if (perfiles.length > 0) {
        const lines = perfiles.slice(0, 25).map(
          (p, i) =>
            `  ${i + 1}. Cargo: "${p.nombreCargo || p.cargo || 'Sin nombre'}" | Área: ${p.area || 'General'} | Riesgos clave: ${p.peligrosPrincipales || p.riesgos || 'N/A'} | Exámenes/EPP: ${p.examenesMedicos || p.eppRequerido || 'Según matriz'}`,
        );
        blocks.push(
          `👔 [PERFILES DE CARGO Y PROFESIOLOGÍA EN VIVO (${perfiles.length} cargo(s))]:\n${lines.join('\n')}`,
        );
      } else {
        blocks.push(`👔 [PERFILES DE CARGO EN VIVO]: 0 perfiles de cargo registrados actualmente para "${companyName}".`);
      }
    } catch (_) {}
  }

  if (
    inputs.includes('somos_sst_epp') &&
    !normalizedHitosSet.has('hito3_epp') &&
    targetCompanyIdStr &&
    mongoose.Types.ObjectId.isValid(targetCompanyIdStr)
  ) {
    try {
      const SgsstEppInventory = require('~/models/SgsstEppInventory');
      const SgsstEppSolicitud = require('~/models/SgsstEppSolicitud');
      const [invItems, pendingReqs] = await Promise.all([
        SgsstEppInventory.find({ companyId: targetCompanyIdStr }).limit(40).lean(),
        SgsstEppSolicitud.find({ companyId: targetCompanyIdStr }).sort({ createdAt: -1 }).limit(15).lean(),
      ]);
      const lowStock = (invItems || []).filter(
        (it) => Number(it.stockActual || 0) <= Number(it.stockMinimo || 3),
      );
      const pendingOnly = (pendingReqs || []).filter((r) => r.estado === 'pendiente');
      const eppLines = [
        `  • Inventario EPP: ${(invItems || []).length} referencia(s) registradas | En stock crítico/agotado: ${lowStock.length}`,
        `  • Solicitudes QR de EPP recientes: ${(pendingReqs || []).length} (${pendingOnly.length} pendiente(s) de entrega)`,
      ];
      for (const reqItem of pendingOnly.slice(0, 8)) {
        const itemNames = (reqItem.items || []).map((i) => `${i.nombre} x${i.cantidad || 1}`).join(', ');
        eppLines.push(
          `    - Pendiente: ${reqItem.nombreTrabajador} (CC: ${reqItem.documento}) solicita [${itemNames}] — Urgencia: ${reqItem.urgencia || 'Media'}`,
        );
      }
      blocks.push(`🦺 [GESTIÓN DE DOTACIÓN Y EPP EN VIVO (somos_sst_epp)]:\n${eppLines.join('\n')}`);
    } catch (_) {}
  }

  if (
    inputs.includes('somos_sst_examenes') &&
    !normalizedHitosSet.has('hito2_perfil_socio') &&
    !normalizedHitosSet.has('hito2_condiciones_salud') &&
    !extractors.includes('extract_sst_workers') &&
    targetCompanyIdStr &&
    mongoose.Types.ObjectId.isValid(targetCompanyIdStr)
  ) {
    try {
      const SgsstWorker = mongoose.models.SgsstWorker || require('~/models/SgsstWorker');
      const PerfilModel = mongoose.models.PerfilSociodemograficoData;
      const [workers, perfilDoc] = await Promise.all([
        SgsstWorker.find({ companyId: targetCompanyIdStr }).limit(100).lean(),
        PerfilModel ? PerfilModel.findOne({ companyId: targetCompanyIdStr }).lean() : null,
      ]);
      const socioList = Array.isArray(perfilDoc?.trabajadores) ? perfilDoc.trabajadores : [];
      const sourceRows = socioList.length > 0 ? socioList : workers || [];
      const emoLines = sourceRows.slice(0, 40).map((w, idx) => {
        const docNum = w.identificacion || w.documento || 'N/A';
        const fechaEmo = w.fechaExamenMedico || w.ultimoExamenMedico || 'Sin registro';
        const rec = w.recomendacionesMedicas || (Array.isArray(w.fitAlerts) ? w.fitAlerts.join(', ') : '') || 'Sin restricciones';
        return `  ${idx + 1}. ${w.nombre || 'Colaborador'} (CC: ${docNum}, Cargo: ${w.cargo || 'N/A'}) — Último EMO: ${fechaEmo} | Concepto/Recomendaciones: ${String(rec).slice(0, 140)}`;
      });
      blocks.push(
        `🩺 [SEGUIMIENTO EXÁMENES MÉDICOS OCUPACIONALES EN VIVO (${sourceRows.length} colaborador(es))]:\n${
          emoLines.length > 0 ? emoLines.join('\n') : '  • Sin registros de exámenes médicos ocupacionales cargados.'
        }`,
      );
    } catch (_) {}
  }

  if (inputs.includes('cursos_lms')) {
    try {
      const Course = mongoose.models.Course || require('~/models/Course');
      const UserProgress = mongoose.models.UserProgress || require('~/models/UserProgress');
      const companyFilter =
        targetCompanyIdStr && mongoose.Types.ObjectId.isValid(targetCompanyIdStr)
          ? { $or: [{ companyId: targetCompanyIdStr }, { isPublished: true }] }
          : { isPublished: true };
      const [courses, progresses] = await Promise.all([
        Course.find(companyFilter).limit(20).select('title category lessons isPublished').lean(),
        targetCompanyIdStr && mongoose.Types.ObjectId.isValid(targetCompanyIdStr)
          ? UserProgress.find({ companyId: targetCompanyIdStr }).limit(100).lean()
          : [],
      ]);
      const completedCount = (progresses || []).filter((p) => p.isCourseCompleted).length;
      const courseLines = (courses || []).slice(0, 12).map(
        (c, idx) =>
          `  ${idx + 1}. Curso LMS: "${c.title}" | Lecciones: ${Array.isArray(c.lessons) ? c.lessons.length : 0}`,
      );
      blocks.push(
        `🎓 [ACADEMIA LMS Y PROGRESO DE CAPACITACIÓN (cursos_lms)]: ${(courses || []).length} curso(s) disponibles | ${(progresses || []).length} inscripción(es) en la empresa (${completedCount} completado(s)).\n${courseLines.join('\n')}`,
      );
    } catch (_) {}
  }

  // 6. Ejecución real de `logic_merge` y `logic_loop` sobre registros extraídos de fuentes de lectura
  const mergeNode = logicNodes.find(
    (ln) => ln && (ln.logicType === 'merge' || ln.id === 'logic_merge' || ln.key === 'logic_merge'),
  );
  const loopNode = logicNodes.find(
    (ln) => ln && (ln.logicType === 'loop' || ln.id === 'logic_loop' || ln.key === 'logic_loop'),
  );

  if ((mergeNode || loopNode) && targetCompanyIdStr) {
    try {
      const sourceNodeIds = [];
      for (const extId of extractors) {
        if (extId === 'extract_sst_app') {
          const appCfg = getNodeCfg('extractor_extract_sst_app', 'ext_extract_sst_app', 'extract_sst_app');
          const mapped =
            appCfg?.sstAppSourceId
              ? sstAppSourceAliasMap[String(appCfg.sstAppSourceId).toLowerCase().trim()] ||
                String(appCfg.sstAppSourceId).trim()
              : '';
          if (mapped) sourceNodeIds.push(mapped);
        } else if (extId.startsWith('extract_sst_') || extId.startsWith('hito')) {
          sourceNodeIds.push(extId);
        }
      }
      for (const hId of hitos) {
        if (resolveWorkflowHitoRole(nodeConfigs, hId) !== 'source_read') continue;
        if (!sourceNodeIds.includes(hId)) sourceNodeIds.push(hId);
      }

      const collectedRecords = [];
      for (const srcId of sourceNodeIds.slice(0, 6)) {
        try {
          const srcCfg = getNodeCfg(
            `tool_hitos_${srcId}`,
            `hito_${srcId}`,
            `extractor_${srcId}`,
            `ext_${srcId}`,
            srcId,
          );
          const srcFilterMode = String(srcCfg?.recordFilterMode || 'all').trim();
          const srcSelectedIds = Array.isArray(srcCfg?.selectedRecordIds)
            ? new Set(srcCfg.selectedRecordIds.map(String))
            : null;
          const canonicalSrcId = normalizeInspectorNodeId(srcId);

          const inspected = await inspectNodeLiveData({
            userId: userIdStr,
            companyId: targetCompanyIdStr,
            nodeId: srcId,
            nodeConfig: srcCfg,
          });
          if (Array.isArray(inspected?.records)) {
            let sourceFiltered = inspected.records;
            if (srcFilterMode === 'critical_only' || srcFilterMode === 'expiry_only') {
              sourceFiltered = sourceFiltered.filter((r) => r && r.isCritical === true);
            } else if (srcFilterMode === 'selected' && srcSelectedIds && srcSelectedIds.size > 0) {
              sourceFiltered = sourceFiltered.filter((r) => srcSelectedIds.has(String(r.id)));
            }
            if (safeProcessedSet.size > 0) {
              sourceFiltered = sourceFiltered.filter((r) => {
                if (!r || r.isCritical !== true) return true;
                const dedupKey = extractWorkflowEntityDedupKey(canonicalSrcId, r);
                return !safeProcessedSet.has(dedupKey);
              });
            }

            for (const rec of sourceFiltered.slice(0, 150)) {
              collectedRecords.push({
                _sourceModule: inspected.moduleTitle || srcId,
                _canonicalSourceId: canonicalSrcId,
                id: rec.id,
                label: rec.label,
                sublabel: rec.sublabel,
                badge: rec.badge,
                isCritical: Boolean(rec.isCritical),
                ...(rec.fields && typeof rec.fields === 'object' ? rec.fields : {}),
              });
            }
          }
        } catch (_) {}
      }

      let workingRecords = collectedRecords;

      const formatMergedSourceFinding = (rec) => {
        const cId = rec._canonicalSourceId || '';
        if (cId === 'hito2_perfil_socio') {
          const detail =
            rec.motivosVencimientoDetectados &&
            rec.motivosVencimientoDetectados !== 'Sin vencimientos pendientes'
              ? rec.motivosVencimientoDetectados
              : `${rec.sublabel || ''} (${rec.badge || ''})`;
          return `[${rec._sourceModule}]: ${detail}`;
        }
        if (cId === 'hito3_epp') {
          return `[${rec._sourceModule}]: EPP «${rec['Elemento de Protección Personal Entregado y Norma Técnica'] || rec.label}» — Estado: ${rec.badge || 'Alerta'} (${rec['Talla, Cantidad, Fecha de Entrega y Fecha de Próxima Reposición'] || rec.sublabel || ''})`;
        }
        return `[${rec._sourceModule}]: ${rec.label || rec.id} — ${rec.sublabel || ''} (${rec.badge || 'Alerta'})`;
      };

      if (mergeNode && workingRecords.length > 0) {
        const mergeCfg = {
          ...(mergeNode.config || {}),
          ...getNodeCfg(mergeNode.key, mergeNode.id, 'logic_merge'),
        };
        const mergeStrategy = String(mergeCfg.mergeStrategy || 'deduplicate_by_id').toLowerCase();
        const rawMergeKey = String(mergeCfg.mergeKey || '').trim().toLowerCase();

        const extractRecordKey = (rec, idx) => {
          if (rawMergeKey) {
            const matchedEntry =
              Object.entries(rec).find(([k]) => k.toLowerCase().trim() === rawMergeKey) ||
              Object.entries(rec).find(([k]) => k.toLowerCase().includes(rawMergeKey));
            if (matchedEntry && matchedEntry[1]) {
              return String(matchedEntry[1]).trim().toLowerCase();
            }
          }
          const docCandidate =
            rec['Cédula / Documento'] ||
            rec.cedula ||
            rec.documento ||
            rec.identificacion ||
            rec.Placa ||
            rec.placa ||
            rec.id ||
            rec.label ||
            `row_${idx}`;
          return String(docCandidate).trim().toLowerCase();
        };

        if (mergeStrategy !== 'append_all') {
          const mergedMap = new Map();
          for (let i = 0; i < workingRecords.length; i++) {
            const rec = workingRecords[i];
            const key = extractRecordKey(rec, i);
            const findingLine = formatMergedSourceFinding(rec);
            if (!mergedMap.has(key)) {
              mergedMap.set(key, {
                ...rec,
                _mergedSources: [rec._sourceModule],
                _mergedFindings: [findingLine],
              });
            } else {
              const prev = mergedMap.get(key);
              const nextFindings = Array.isArray(prev._mergedFindings) ? [...prev._mergedFindings] : [];
              if (!nextFindings.includes(findingLine)) {
                nextFindings.push(findingLine);
              }
              mergedMap.set(key, {
                ...rec,
                ...prev,
                isCritical: Boolean(prev.isCritical || rec.isCritical),
                _mergedSources: Array.from(new Set([...(prev._mergedSources || []), rec._sourceModule])),
                _mergedFindings: nextFindings,
              });
            }
          }
          workingRecords = Array.from(mergedMap.values());
        } else {
          workingRecords = workingRecords.map((rec) => ({
            ...rec,
            _mergedSources: [rec._sourceModule],
            _mergedFindings: [formatMergedSourceFinding(rec)],
          }));
        }

        traceMeta.mergedRecordsCount = workingRecords.length;
        const mergeLines = workingRecords.slice(0, 80).map((r, idx) => {
          const personName = String(r['Nombre Completo'] || r.nombre || '').trim();
          const personDoc = String(
            r['Cédula / Documento'] || r.documento || r.cedula || r.identificacion || '',
          ).trim();
          const personCargo = String(r['Cargo'] || r.cargo || '').trim();
          const header = personName
            ? `${personName}${personDoc ? ` (CC ${personDoc})` : ''}${personCargo ? ` — ${personCargo}` : ''}`
            : r.label || r.id;
          const findings = Array.isArray(r._mergedFindings) && r._mergedFindings.length > 0
            ? r._mergedFindings
            : [formatMergedSourceFinding(r)];
          return (
            `  ${idx + 1}. ${header} [Fuentes: ${(r._mergedSources || [r._sourceModule]).join(' + ')}]\n` +
            findings.map((f) => `     • ${f}`).join('\n')
          );
        });
        blocks.push(
          `🔀 [REGISTROS CONSOLIDADOS Y DEDUPLICADOS POR NODO MERGE (${workingRecords.length} sujeto(s)/ítem(s) únicos de ${collectedRecords.length} hallazgo(s) totales | Llave: ${rawMergeKey || 'documento/id'})]:\n${mergeLines.join('\n')}`,
        );
      }

      if (loopNode && workingRecords.length > 0) {
        const loopCfg = {
          ...(loopNode.config || {}),
          ...getNodeCfg(loopNode.key, loopNode.id, 'logic_loop'),
        };
        const batchSize = Math.min(50, Math.max(1, parseInt(loopCfg.batchSize, 10) || 10));
        const iterateByField = String(loopCfg.iterateByField || '').trim();
        const batches = [];

        if (iterateByField) {
          const groups = new Map();
          for (const rec of workingRecords) {
            const matchedEntry = Object.entries(rec).find(([k]) =>
              k.toLowerCase().includes(iterateByField.toLowerCase()),
            );
            const groupVal = matchedEntry?.[1] ? String(matchedEntry[1]).trim() : 'General';
            if (!groups.has(groupVal)) groups.set(groupVal, []);
            groups.get(groupVal).push(rec);
          }
          for (const [groupLabel, items] of groups.entries()) {
            for (let i = 0; i < items.length; i += batchSize) {
              batches.push({
                label: `${iterateByField}: ${groupLabel}`,
                items: items.slice(i, i + batchSize),
              });
            }
          }
        } else {
          for (let i = 0; i < workingRecords.length; i += batchSize) {
            batches.push({
              label: `Registros ${i + 1}–${Math.min(i + batchSize, workingRecords.length)}`,
              items: workingRecords.slice(i, i + batchSize),
            });
          }
        }

        traceMeta.batchesProcessed = batches.length;
        const batchBlocks = batches.slice(0, 20).map((b, bIdx) => {
          const rows = b.items
            .map((it, rIdx) => {
              const mergedInfo =
                Array.isArray(it._mergedFindings) && it._mergedFindings.length > 0
                  ? ` -> ${it._mergedFindings.join(' || ')}`
                  : `${it.sublabel ? ` — ${it.sublabel}` : ''} [${it.badge || 'Activo'}]`;
              return `    ${rIdx + 1}) ${it.label || it.id}${mergedInfo}`;
            })
            .join('\n');
          return `  📦 [LOTE #${bIdx + 1} de #${batches.length} (${b.label} · ${b.items.length} reg.)]:\n${rows}`;
        });
        blocks.push(
          `🔁 [ITERACIÓN ESTRUCTURADA POR LOTES — NODO LOOP (${batches.length} LOTE(S) PROCESADOS, tamaño máx: ${batchSize})]:\n${batchBlocks.join('\n')}`,
        );
      }
    } catch (logicErr) {
      console.warn('[AutomationScheduler] Aviso procesando logic_merge / logic_loop:', logicErr?.message);
    }
  }

  return {
    contextBlock: blocks.length > 0 ? `\n${blocks.join('\n\n')}\n` : '',
    traceMeta,
    freshDriveFiles,
    freshGmailMessages,
    externalCandidateKeys: Array.from(externalCandidateKeysSet),
  };
}

/**
 * Ejecuta todas las salidas finales permitidas por la rama activa (`outputsToExecute`):
 * `wappy_notification`, `tenshi_alert`, `antigravity_local_report`, `antigravity_cloud_report`,
 * `canvas_doc`, `acpm_task`, `wappy_kanban`, `email_report`, `google_calendar`, `google_docs`,
 * `google_sheets` y `google_slides`.
 * Reutilizado tanto en ejecución directa como tras la Compuerta Real de Aprobación Humana (`POST /logs/:logId/approve`).
 */
async function executeDownstreamOutputs({
  automation,
  user,
  companyId,
  companyInfo = null,
  outputsToExecute = [],
  responseText = '',
  generatedAppReports = [],
  activeBranch = 'direct',
  nodeConfigs = {},
  capturedEvidences = [],
  generatedConvoId = null,
  hasCriticalSignal = true,
  logId = null,
} = {}) {
  const executedOutputs = [];
  const workspaceLinks = [];
  const errors = [];

  if (!automation || !Array.isArray(outputsToExecute) || outputsToExecute.length === 0) {
    return { executedOutputs, workspaceLinks, errors };
  }

  const userId = user?.id || user?._id || automation.user;
  const userIdStr = userId ? String(userId) : '';
  const targetCompanyIdStr = companyId
    ? String(companyId)
    : automation.companyId
      ? String(automation.companyId)
      : null;

  let resolvedCompany = companyInfo;
  if (!resolvedCompany && targetCompanyIdStr && mongoose.Types.ObjectId.isValid(targetCompanyIdStr)) {
    try {
      resolvedCompany = await CompanyInfo.findById(targetCompanyIdStr).lean();
    } catch (_) {}
  }
  const compLabel = resolvedCompany?.companyName || 'Somos SST';
  const postNodeConfigs = nodeConfigs || automation.workflowNodes?.canvasLayout?.nodeConfigs || {};
  const validReports = Array.isArray(generatedAppReports)
    ? generatedAppReports.filter((r) => r && typeof r.reportHtml === 'string' && r.reportHtml.trim())
    : [];
  const safeResponseText = String(responseText || '').trim();
  const bogotaDateStr = new Intl.DateTimeFormat('es-CO', {
    timeZone: 'America/Bogota',
    dateStyle: 'full',
    timeStyle: 'medium',
  }).format(new Date());

  // 1. Notificación en WAPPY + Chat de Tenshi (`wappy_notification` / `tenshi_alert`)
  if (outputsToExecute.includes('wappy_notification') || outputsToExecute.includes('tenshi_alert')) {
    try {
      const shortSummary = safeResponseText.replace(/[#*_`]/g, '').substring(0, 260);
      await withTimeout(
        Notification.create({
          user: automation.user || userId,
          companyId: automation.companyId || targetCompanyIdStr || null,
          title: `✅ Bitácora Completada: ${automation.name} (${compLabel})`,
          body: `${shortSummary}${safeResponseText.length > 260 ? '...' : ''}`,
          type: 'system_update',
          read: false,
        }),
        12000,
        'Notification.create',
      );
      await withTimeout(
        TenshiMessage.create({
          user: automation.user || userId,
          companyId: targetCompanyIdStr || null,
          role: 'assistant',
          content:
            `🤖 **Automatización Ejecutada: ${automation.name} (${compLabel})**\n\n` +
            `${safeResponseText.substring(0, 900)}${safeResponseText.length > 900 ? '\n\n*(Ver informe completo en el Historial de Ejecuciones de /tareas)*' : ''}`,
        }),
        12000,
        'TenshiMessage.create',
      );
      executedOutputs.push('wappy_notification');
    } catch (notifErr) {
      errors.push(`wappy_notification: ${notifErr.message}`);
    }
  }

  // 2. Bitácora Antigravity (`antigravity_local_report` / `antigravity_cloud_report`)
  if (
    outputsToExecute.includes('antigravity_local_report') ||
    outputsToExecute.includes('antigravity_cloud_report')
  ) {
    try {
      const targetEnv = outputsToExecute.includes('antigravity_cloud_report')
        ? 'Antigravity Cloud 24/7'
        : 'Antigravity Local (Mi PC)';
      await withTimeout(
        KanbanTask.create({
          user: automation.user || userId,
          companyId: targetCompanyIdStr || 'DEFAULT',
          title: `[Bitácora ${targetEnv}] ${automation.name} — ${compLabel}`,
          description: safeResponseText.substring(0, 4000),
          status: 'done',
          priority: 'medium',
          type: 'antigravity_delegation',
          sourceModule: 'Automatización WAPPY',
          assignedTo: targetEnv,
          category: 'Automatización WAPPY',
          assignedAgent: targetEnv,
          dueDate: new Date(),
          completedAt: new Date(),
        }),
        12000,
        'KanbanTask.create(Antigravity)',
      );
      const shortSummary = safeResponseText.replace(/[#*_`]/g, '').substring(0, 240);
      await withTimeout(
        Notification.create({
          user: automation.user || userId,
          companyId: automation.companyId || targetCompanyIdStr || null,
          title: `📡 Bitácora ${targetEnv}: ${automation.name} (${compLabel})`,
          body: `Informe registrado en ${targetEnv}: ${shortSummary}${safeResponseText.length > 240 ? '...' : ''}`,
          type: 'system_update',
          read: false,
        }),
        12000,
        'Notification.create(Antigravity)',
      );
      executedOutputs.push(
        outputsToExecute.includes('antigravity_cloud_report')
          ? 'antigravity_cloud_report'
          : 'antigravity_local_report',
      );
    } catch (agyErr) {
      errors.push(`antigravity_report: ${agyErr.message}`);
    }
  }

  // 3. Documento Vivo WAPPY (`canvas_doc`) — Generalizado para CUALQUIER Aplicativo Hito 1–8
  if (outputsToExecute.includes('canvas_doc')) {
    try {
      const LiveDocumentModel =
        mongoose.models.LiveDocument || require('~/models/LiveDocument');
      if (LiveDocumentModel) {
        const docCfg = postNodeConfigs.out_canvas_doc || postNodeConfigs.canvas_doc || {};
        const customDocTitle = String(docCfg.documentTitle || '').trim();
        const defaultReportTitle =
          validReports.length === 1 && validReports[0].reportTitle
            ? `${validReports[0].reportTitle} (${compLabel})`
            : `📄 Informe Automatizado: ${automation.name} (${compLabel})`;
        const docTitle = customDocTitle || defaultReportTitle;
        const execSummaryHtml = formatMarkdownToEmailHtml(safeResponseText) || `<p>${safeResponseText}</p>`;
        const extractedOfficialHtmlBlocks = validReports
          .map((rep) => {
            const officialTitle = rep.reportTitle || 'Informe Oficial del Aplicativo SG-SST';
            return (
              `<hr style="margin:28px 0;border:none;border-top:2px solid #cbd5e1;" />` +
              `<h3 style="color:#0d9488;margin:12px 0 8px 0;font-size:16px;">📋 ${officialTitle}</h3>` +
              `<div class="wappy-extracted-official-report" style="margin-top:12px;">${rep.reportHtml}</div>`
            );
          })
          .join('\n');
        const htmlContent = extractedOfficialHtmlBlocks
          ? `<div style="margin-bottom:24px;">${execSummaryHtml}</div>\n${extractedOfficialHtmlBlocks}`
          : execSummaryHtml;
        const validCompanyObjId =
          targetCompanyIdStr && mongoose.Types.ObjectId.isValid(targetCompanyIdStr)
            ? targetCompanyIdStr
            : undefined;
        await LiveDocumentModel.findOneAndUpdate(
          {
            user: automation.user || userId,
            title: docTitle,
            ...(validCompanyObjId ? { companyId: validCompanyObjId } : {}),
          },
          {
            $set: {
              title: docTitle,
              content: htmlContent,
              originalFileName: `${validReports[0]?.fileNameSlug || automation.name}.docx`,
              originalFileType: 'html',
              user: automation.user || userId,
              ...(validCompanyObjId ? { companyId: validCompanyObjId } : {}),
            },
          },
          { upsert: true, new: true },
        );
        executedOutputs.push('canvas_doc');
      }
    } catch (docErr) {
      errors.push(`canvas_doc: ${docErr.message}`);
    }
  }

  // 4. Actividad en el Centro de Control / Kanban ACPM (`acpm_task` / `wappy_kanban`)
  if (outputsToExecute.includes('acpm_task') || outputsToExecute.includes('wappy_kanban')) {
    try {
      const acpmCfg =
        postNodeConfigs.out_acpm_task ||
        postNodeConfigs.acpm_task ||
        postNodeConfigs.out_wappy_kanban ||
        postNodeConfigs.wappy_kanban ||
        {};
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
      const resolvedTitle = customTitle || `[Centro de Control] ${automation.name} — ${compLabel}`;

      const existingOpenTask = await KanbanTask.findOne({
        user: automation.user || userId,
        companyId: targetCompanyIdStr || 'DEFAULT',
        referenceId: String(automation._id),
        title: resolvedTitle,
        status: { $nin: ['done', 'completed', 'cancelled'] },
      })
        .select('_id description')
        .lean();

      if (existingOpenTask?._id) {
        const prevDesc = String(existingOpenTask.description || '').trim();
        const combinedDesc = prevDesc
          ? `${prevDesc}\n\n---\n**[Actualización Automática ${bogotaDateStr}]:**\n${safeResponseText}`.slice(-4000)
          : safeResponseText.substring(0, 4000);
        await KanbanTask.updateOne(
          { _id: existingOpenTask._id },
          {
            $set: {
              description: combinedDesc,
              priority: validPriority,
              dueDate: dueTarget,
              updatedAt: new Date(),
            },
          },
        );
      } else {
        await KanbanTask.create({
          user: automation.user || userId,
          companyId: targetCompanyIdStr || 'DEFAULT',
          title: resolvedTitle,
          description: safeResponseText.substring(0, 3500),
          status: validStage,
          priority: validPriority,
          actionType: validActionType,
          type: 'audit_finding',
          sourceModule: 'Automatización WAPPY (Centro de Control)',
          assignedTo: customAssignee || automation.agentName || 'Responsable SG-SST',
          referenceId: String(automation._id),
          referenceName: automation.name,
          dueDate: dueTarget,
          ...(validStage === 'done' ? { completedAt: new Date() } : {}),
        });
      }
      executedOutputs.push('acpm_task');
    } catch (acpmErr) {
      errors.push(`acpm_task: ${acpmErr.message}`);
    }
  }

  // 5. Post-Procesador Real: Google Calendar + Agenda Interna (`google_calendar`)
  if (outputsToExecute.includes('google_calendar')) {
    try {
      const calendarCfg =
        postNodeConfigs.out_google_calendar || postNodeConfigs.google_calendar || {};
      const calTitle =
        String(calendarCfg.calendarEventTitle || '').trim() ||
        `[SG-SST] ${automation.name} — ${compLabel}`;
      const durationMinutes = Math.max(5, Number(calendarCfg.calendarDurationMinutes) || 30);
      const attendeesList = parseEmailList(calendarCfg.calendarAttendees);
      const startDate = calendarCfg.startDateTime
        ? new Date(calendarCfg.startDateTime)
        : new Date(Date.now() + 60 * 60 * 1000); // Por defecto +1 hora
      const safeStart = Number.isNaN(startDate.getTime())
        ? new Date(Date.now() + 60 * 60 * 1000)
        : startDate;
      const safeEnd = new Date(safeStart.getTime() + durationMinutes * 60 * 1000);

      const bogotaStartHm = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'America/Bogota',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(safeStart);
      const bogotaEndHm = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'America/Bogota',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(safeEnd);

      // 5A. Crear evento en la Agenda Interna de WAPPY (KanbanTask + AgendaEvent si existe)
      await KanbanTask.create({
        user: automation.user || userId,
        companyId: targetCompanyIdStr || 'DEFAULT',
        title: calTitle,
        description: safeResponseText.substring(0, 3000),
        status: 'todo',
        priority: hasCriticalSignal ? 'alta' : 'media',
        type: 'scheduled_reminder',
        sourceModule: 'Agenda SG-SST (Automatización)',
        dueDate: safeStart,
        startTime: bogotaStartHm,
        endTime: bogotaEndHm,
        emailAttendees: attendeesList,
      });
      if (mongoose.models.AgendaEvent) {
        try {
          await mongoose.models.AgendaEvent.create({
            user: automation.user || userId,
            companyId: targetCompanyIdStr || null,
            title: calTitle,
            description: safeResponseText.substring(0, 3000),
            startDate: safeStart,
            endDate: safeEnd,
            durationMinutes,
            attendees: attendeesList,
          });
        } catch (_) {}
      }

      // 5B. Si el usuario tiene OAuth Google Calendar conectado, crear evento real en Google Calendar API
      const oauthCtx = await withTimeout(
        getCompanyGoogleOAuthClient(userIdStr, targetCompanyIdStr),
        12000,
        'getCompanyGoogleOAuthClient(Calendar)',
      );
      if (oauthCtx) {
        try {
          const calendar = oauthCtx.google.calendar({ version: 'v3', auth: oauthCtx.oauth2Client });
          const gcalRes = await withTimeout(
            calendar.events.insert({
              calendarId: 'primary',
              sendUpdates: attendeesList.length > 0 ? 'all' : 'none',
              requestBody: {
                summary: calTitle,
                description: `${safeResponseText.substring(0, 3500)}\n\n— Generado automáticamente por WAPPY SG-SST (${compLabel})`,
                start: {
                  dateTime: safeStart.toISOString(),
                  timeZone: 'America/Bogota',
                },
                end: {
                  dateTime: safeEnd.toISOString(),
                  timeZone: 'America/Bogota',
                },
                ...(attendeesList.length > 0
                  ? { attendees: attendeesList.map((email) => ({ email })) }
                  : {}),
              },
            }),
            20000,
            'calendar.events.insert',
          );
          if (gcalRes?.data?.htmlLink) {
            workspaceLinks.push({
              type: 'google_calendar',
              label: `📅 Evento Google Calendar: "${calTitle}"`,
              url: gcalRes.data.htmlLink,
            });
          }
        } catch (gcalErr) {
          console.warn('[AutomationScheduler] Aviso creando evento Google Calendar API:', gcalErr?.message);
          errors.push(`google_calendar_api: ${gcalErr?.message || 'Timeout/Error'}`);
        }
      }
      executedOutputs.push('google_calendar');
    } catch (calErr) {
      errors.push(`google_calendar: ${calErr.message}`);
    }
  }

  // 6. Post-Procesador Real: Google Docs (`google_docs` — conversión Multipart HTML -> Google Doc nativo)
  if (outputsToExecute.includes('google_docs')) {
    try {
      const alreadyHasGoogleDocInText = /https:\/\/docs\.google\.com\/document\/d\/[a-zA-Z0-9_-]+/i.test(
        safeResponseText,
      );
      if (!alreadyHasGoogleDocInText) {
        const oauthCtx = await withTimeout(
          getCompanyGoogleOAuthClient(userIdStr, targetCompanyIdStr),
          12000,
          'getCompanyGoogleOAuthClient(Docs)',
        );
        if (oauthCtx) {
          const docsCfg = postNodeConfigs.out_google_docs || postNodeConfigs.google_docs || {};
          const docTitle =
            String(docsCfg.documentTitle || '').trim() ||
            (validReports[0]?.reportTitle
              ? `${validReports[0].reportTitle} — ${compLabel}`
              : `Informe SG-SST: ${automation.name} (${compLabel})`);
          const execHtml = formatMarkdownToEmailHtml(safeResponseText) || `<p>${safeResponseText}</p>`;
          const appReportsHtml = validReports
            .map(
              (rep) =>
                `<hr /><h2>${rep.reportTitle || 'Informe Oficial del Aplicativo SG-SST'}</h2><div>${rep.reportHtml}</div>`,
            )
            .join('\n');
          const fullDocHtml =
            `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><title>${docTitle.replace(/[<>&"]/g, '')}</title></head>` +
            `<body style="font-family:Arial,sans-serif;color:#0f172a;line-height:1.5;">` +
            `<h1>${docTitle}</h1>` +
            `<p><strong>Empresa:</strong> ${compLabel} &bull; <strong>Fecha:</strong> ${bogotaDateStr}</p><hr />` +
            `<div>${execHtml}</div>` +
            `${appReportsHtml}` +
            `</body></html>`;

          const drive = oauthCtx.google.drive({ version: 'v3', auth: oauthCtx.oauth2Client });
          const folderId = String(docsCfg.folderId || '').trim();
          const createdDoc = await withTimeout(
            drive.files.create({
              requestBody: {
                name: docTitle,
                mimeType: 'application/vnd.google-apps.document',
                ...(folderId ? { parents: [folderId] } : {}),
              },
              media: {
                mimeType: 'text/html',
                body: Readable.from([Buffer.from(fullDocHtml, 'utf8')]),
              },
              fields: 'id, name, webViewLink',
            }),
            25000,
            'drive.files.create(GoogleDoc)',
          );
          const docUrl =
            createdDoc?.data?.webViewLink ||
            (createdDoc?.data?.id
              ? `https://docs.google.com/document/d/${createdDoc.data.id}/edit`
              : null);
          if (docUrl) {
            workspaceLinks.push({
              type: 'google_docs',
              label: `📝 Google Doc Oficial: "${docTitle}"`,
              url: docUrl,
            });
          }
          executedOutputs.push('google_docs');
        }
      } else {
        executedOutputs.push('google_docs');
      }
    } catch (gdocErr) {
      console.warn('[AutomationScheduler] Aviso creando Google Doc:', gdocErr?.message);
      errors.push(`google_docs: ${gdocErr.message}`);
    }
  }

  // 7. Post-Procesador Real: Google Sheets (`google_sheets` — fila de auditoría en spreadsheetId o bitácora)
  if (outputsToExecute.includes('google_sheets')) {
    try {
      const oauthCtx = await withTimeout(
        getCompanyGoogleOAuthClient(userIdStr, targetCompanyIdStr),
        12000,
        'getCompanyGoogleOAuthClient(Sheets)',
      );
      if (oauthCtx) {
        const sheetsCfg = postNodeConfigs.out_google_sheets || postNodeConfigs.google_sheets || {};
        const sheets = oauthCtx.google.sheets({ version: 'v4', auth: oauthCtx.oauth2Client });
        const drive = oauthCtx.google.drive({ version: 'v3', auth: oauthCtx.oauth2Client });

        let rawSheetId = String(sheetsCfg.spreadsheetId || '').trim();
        const urlMatch = rawSheetId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
        let spreadsheetId = urlMatch ? urlMatch[1] : rawSheetId;
        let sheetTabName = String(sheetsCfg.sheetName || '').trim();

        if (!spreadsheetId) {
          const defaultSheetTitle = `Bitácora Automatizaciones SG-SST - ${compLabel}`;
          const escapedTitle = defaultSheetTitle.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
          const existingSearch = await withTimeout(
            drive.files.list({
              q: `mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false and name = '${escapedTitle}'`,
              pageSize: 1,
              fields: 'files(id, name)',
            }),
            15000,
            'drive.files.list(GoogleSheets)',
          );
          if (Array.isArray(existingSearch?.data?.files) && existingSearch.data.files.length > 0) {
            spreadsheetId = existingSearch.data.files[0].id;
          } else {
            const createdSheet = await withTimeout(
              sheets.spreadsheets.create({
                requestBody: {
                  properties: { title: defaultSheetTitle },
                },
              }),
              15000,
              'sheets.spreadsheets.create',
            );
            spreadsheetId = createdSheet?.data?.spreadsheetId || '';
            const firstTab =
              createdSheet?.data?.sheets?.[0]?.properties?.title || 'Hoja 1';
            sheetTabName = firstTab;
            if (spreadsheetId) {
              await withTimeout(
                sheets.spreadsheets.values.append({
                  spreadsheetId,
                  range: `'${firstTab}'!A1`,
                  valueInputOption: 'USER_ENTERED',
                  requestBody: {
                    values: [
                      [
                        'Fecha y Hora (Bogotá)',
                        'Empresa',
                        'Automatización',
                        'Rama Ejecutada',
                        'Estado Hallazgos',
                        'Resumen Ejecutivo',
                        'Enlace / Referencia',
                      ],
                    ],
                  },
                }),
                15000,
                'sheets.spreadsheets.values.append(Header)',
              );
            }
          }
        }

        if (spreadsheetId) {
          if (!sheetTabName) {
            try {
              const meta = await withTimeout(
                sheets.spreadsheets.get({
                  spreadsheetId,
                  fields: 'sheets.properties.title',
                }),
                12000,
                'sheets.spreadsheets.get',
              );
              sheetTabName = meta?.data?.sheets?.[0]?.properties?.title || 'Sheet1';
            } catch (_) {
              sheetTabName = 'Sheet1';
            }
          }
          const cleanExcerpt = safeResponseText
            .replace(/[#*_`|]/g, '')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 480);
          const refLink =
            workspaceLinks.find((l) => l.type === 'google_docs')?.url ||
            (generatedConvoId ? `https://wappy.club/c/${generatedConvoId}` : 'https://wappy.club/tareas');

          await withTimeout(
            sheets.spreadsheets.values.append({
              spreadsheetId,
              range: `'${sheetTabName}'!A1`,
              valueInputOption: 'USER_ENTERED',
              requestBody: {
                values: [
                  [
                    bogotaDateStr,
                    compLabel,
                    automation.name,
                    String(activeBranch || 'direct').toUpperCase(),
                    hasCriticalSignal ? 'CON HALLAZGOS' : 'SIN NOVEDADES CRÍTICAS',
                    cleanExcerpt,
                    refLink,
                  ],
                ],
              },
            }),
            15000,
            'sheets.spreadsheets.values.append(Row)',
          );

          const sheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
          workspaceLinks.push({
            type: 'google_sheets',
            label: `📊 Bitácora Google Sheets Actualizada`,
            url: sheetUrl,
          });
          executedOutputs.push('google_sheets');
        }
      }
    } catch (gsheetErr) {
      console.warn('[AutomationScheduler] Aviso actualizando Google Sheets:', gsheetErr?.message);
      errors.push(`google_sheets: ${gsheetErr.message}`);
    }
  }

  // 8. Post-Procesador Real: Google Slides (`google_slides` — presentación ejecutiva con conclusiones clave)
  if (outputsToExecute.includes('google_slides')) {
    try {
      const oauthCtx = await withTimeout(
        getCompanyGoogleOAuthClient(userIdStr, targetCompanyIdStr),
        12000,
        'getCompanyGoogleOAuthClient(Slides)',
      );
      if (oauthCtx) {
        const slidesCfg = postNodeConfigs.out_google_slides || postNodeConfigs.google_slides || {};
        const presTitle =
          String(slidesCfg.presentationTitle || '').trim() ||
          `Informe Ejecutivo SG-SST: ${automation.name} (${compLabel})`;
        const slidesApi = oauthCtx.google.slides({ version: 'v1', auth: oauthCtx.oauth2Client });

        const createdPres = await withTimeout(
          slidesApi.presentations.create({
            requestBody: { title: presTitle },
          }),
          20000,
          'slides.presentations.create',
        );
        const presentationId = createdPres?.data?.presentationId;
        if (presentationId) {
          const requests = [];
          const firstSlide = createdPres?.data?.slides?.[0];
          if (firstSlide?.pageElements) {
            const titleEl = firstSlide.pageElements.find(
              (el) =>
                el.shape?.placeholder?.type === 'CENTERED_TITLE' ||
                el.shape?.placeholder?.type === 'TITLE',
            );
            const subEl = firstSlide.pageElements.find(
              (el) => el.shape?.placeholder?.type === 'SUBTITLE',
            );
            if (titleEl?.objectId) {
              requests.push({
                insertText: {
                  objectId: titleEl.objectId,
                  text: presTitle.slice(0, 140),
                },
              });
            }
            if (subEl?.objectId) {
              requests.push({
                insertText: {
                  objectId: subEl.objectId,
                  text: `${compLabel} · Generado por WAPPY SG-SST · ${bogotaDateStr}`,
                },
              });
            }
          }

          const slide2Id = `exec_summary_${Date.now().toString(36)}`;
          const slide2TitleId = `${slide2Id}_title`;
          const slide2BodyId = `${slide2Id}_body`;
          const bulletLines = safeResponseText
            .split('\n')
            .map((l) => l.replace(/^[\s#*>-]+/, '').replace(/\*\*/g, '').trim())
            .filter((l) => l.length >= 12 && !l.startsWith('|'))
            .slice(0, 7)
            .map((l) => `• ${l.slice(0, 170)}`)
            .join('\n');

          requests.push({
            createSlide: {
              objectId: slide2Id,
              insertionIndex: 1,
              slideLayoutReference: { predefinedLayout: 'TITLE_AND_BODY' },
              placeholderIdMappings: [
                { layoutPlaceholder: { type: 'TITLE', index: 0 }, objectId: slide2TitleId },
                { layoutPlaceholder: { type: 'BODY', index: 0 }, objectId: slide2BodyId },
              ],
            },
          });
          requests.push({
            insertText: {
              objectId: slide2TitleId,
              text: 'Conclusiones y Hallazgos Clave SG-SST',
            },
          });
          requests.push({
            insertText: {
              objectId: slide2BodyId,
              text: bulletLines || safeResponseText.replace(/[#*_`]/g, '').slice(0, 900),
            },
          });

          await withTimeout(
            slidesApi.presentations.batchUpdate({
              presentationId,
              requestBody: { requests },
            }),
            20000,
            'slides.presentations.batchUpdate',
          );

          const slidesUrl = `https://docs.google.com/presentation/d/${presentationId}/edit`;
          workspaceLinks.push({
            type: 'google_slides',
            label: `📽️ Presentación Ejecutiva Google Slides: "${presTitle}"`,
            url: slidesUrl,
          });
          executedOutputs.push('google_slides');
        }
      }
    } catch (gslidesErr) {
      console.warn('[AutomationScheduler] Aviso creando Google Slides:', gslidesErr?.message);
      errors.push(`google_slides: ${gslidesErr.message}`);
    }
  }

  // 9. Correo Electrónico (`email_report`) — honrando `emailRecipientsOverride` + Informes Oficiales Universales HTML
  const emailCfg = postNodeConfigs.out_email_report || postNodeConfigs.email_report || {};
  const shouldSendEmailReport = outputsToExecute.includes('email_report');

  if (shouldSendEmailReport) {
    try {
      const overrideEmails = parseEmailList(emailCfg.emailRecipientsOverride);
      const baseEmails = parseEmailList([
        ...(Array.isArray(automation.emails) ? automation.emails : []),
        ...(Array.isArray(automation.emailRecipients) ? automation.emailRecipients : []),
      ]);
      const validEmails = parseEmailList([...overrideEmails, ...baseEmails]);

      if (validEmails.length > 0) {
        const chatUrl = generatedConvoId ? `https://wappy.club/c/${generatedConvoId}` : null;
        const emailAttachments = [];
        const MAX_EMAIL_ATTACHMENT_BYTES = 8 * 1024 * 1024;
        let totalAttachmentBytes = 0;
        const seenAttachmentPaths = new Set();

        if (Array.isArray(capturedEvidences) && capturedEvidences.length > 0) {
          for (const ev of capturedEvidences) {
            const chosenLocalPath =
              ev?.pdfLocalPath && fs.existsSync(ev.pdfLocalPath)
                ? ev.pdfLocalPath
                : ev?.imageLocalPath && fs.existsSync(ev.imageLocalPath)
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

        let emailHtmlResult = formatMarkdownToEmailHtml(safeResponseText);
        if (validReports.length > 0) {
          for (const rep of validReports) {
            const dynamicReportTitle =
              rep.reportTitle || 'Informe Oficial del Aplicativo SG-SST';
            const dynamicSlugPrefix = rep.fileNameSlug || 'Informe_Oficial_SGSST';
            const rawDetailSlug =
              rep.formData?.afectadoNombre ||
              rep.caseId ||
              rep.hitoNodeId ||
              rep.appId ||
              new Date().toISOString().slice(0, 10);
            const safeSlug =
              String(rawDetailSlug)
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-zA-Z0-9_-]+/g, '_')
                .replace(/^_+|_+$/g, '')
                .slice(0, 64) || 'SGSST';
            const reportUrl = rep.reportConversationId
              ? `https://wappy.club/c/${rep.reportConversationId}`
              : null;
            const standaloneReportHtml =
              `<!DOCTYPE html>\n<html lang="es">\n<head>\n` +
              `<meta charset="utf-8" />\n<meta name="viewport" content="width=device-width, initial-scale=1.0" />\n` +
              `<title>${dynamicReportTitle.replace(/[<>&"]/g, '')}</title>\n` +
              `<style>body{font-family:Arial,Helvetica,sans-serif;background:#f8fafc;color:#0f172a;margin:0;padding:24px;} .sgsst-sheet{max-width:1060px;margin:0 auto;background:#ffffff;padding:28px;border-radius:16px;box-shadow:0 10px 25px rgba(15,23,42,0.08);} @media print{body{background:#fff;padding:0;} .sgsst-sheet{box-shadow:none;padding:0;max-width:100%;}}</style>\n` +
              `</head>\n<body>\n<div class="sgsst-sheet">\n${rep.reportHtml}\n</div>\n</body>\n</html>`;
            const htmlAttachmentBuf = Buffer.from(standaloneReportHtml, 'utf8');
            if (totalAttachmentBytes + htmlAttachmentBuf.length <= MAX_EMAIL_ATTACHMENT_BYTES) {
              emailAttachments.push({
                filename: `${dynamicSlugPrefix}_${safeSlug}.html`,
                content: htmlAttachmentBuf,
                contentType: 'text/html; charset=utf-8',
              });
              totalAttachmentBytes += htmlAttachmentBuf.length;
            }

            const hasAtelMeta = Boolean(rep.formData?.afectadoNombre || rep.caseId);
            const metaLineHtml = hasAtelMeta
              ? `<strong>Trabajador:</strong> ${rep.formData?.afectadoNombre || 'N/A'} (CC: ${rep.formData?.afectadoCedula || 'N/A'}) &bull; <strong>Evento:</strong> ${rep.formData?.tipoEvento || 'ATEL'} &bull; <strong>Fecha:</strong> ${rep.formData?.fechaEvento || 'N/A'} &bull; <strong>Expediente:</strong> <code>${rep.caseId || 'N/A'}</code>`
              : `<strong>Empresa:</strong> ${compLabel} &bull; <strong>Módulo:</strong> ${rep.hitoNodeId || rep.appId || 'SG-SST'} &bull; <strong>Generado:</strong> ${bogotaDateStr}`;

            emailHtmlResult += `
              <div style="border: 2px solid #0d9488; background: linear-gradient(135deg, rgba(13, 148, 136, 0.14), rgba(14, 165, 233, 0.10)); border-radius: 14px; padding: 16px 18px; margin: 22px 0 14px 0;">
                <h3 style="color: #0d9488; margin: 0 0 8px 0; font-size: 16px; font-weight: 800;">📋 ${dynamicReportTitle}</h3>
                <p style="margin: 0 0 10px 0; font-size: 13px; color: #334155; line-height: 1.5;">
                  ${metaLineHtml}
                </p>
                ${
                  reportUrl
                    ? `<a href="${reportUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background: #0d9488; color: #ffffff; font-weight: 700; font-size: 13px; padding: 8px 16px; border-radius: 8px; text-decoration: none;">🔗 Abrir Informe Oficial en el Historial de WAPPY &rarr;</a>`
                    : ''
                }
              </div>
              <div style="background: #ffffff; color: #0f172a; border: 1px solid #cbd5e1; border-radius: 14px; padding: 20px; margin: 12px 0 22px 0; overflow-x: auto;">
                ${rep.reportHtml}
              </div>
            `;
          }
        }

        if (workspaceLinks.length > 0) {
          const wsItems = workspaceLinks
            .map(
              (wl) =>
                `<li style="margin-bottom:6px;"><a href="${wl.url}" target="_blank" rel="noopener noreferrer" style="color:#2dd4bf;font-weight:700;text-decoration:underline;">${wl.label} &rarr;</a></li>`,
            )
            .join('');
          emailHtmlResult += `
            <div style="border: 1px solid #38bdf8; background: rgba(56, 189, 248, 0.08); border-radius: 10px; padding: 14px; margin: 16px 0;">
              <h4 style="color: #38bdf8; margin: 0 0 8px 0; font-size: 14px;">🔗 Documentos y Salidas Sincronizadas en Google Workspace</h4>
              <ul style="margin: 0; padding-left: 18px; font-size: 13px; color: #e2e8f0;">${wsItems}</ul>
            </div>
          `;
        }

        if (Array.isArray(capturedEvidences) && capturedEvidences.length > 0) {
          const evItemsHtml = capturedEvidences
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
              <h4 style="color: #2dd4bf; margin: 0 0 8px 0; font-size: 14px;">📎 Certificados y Soportes Oficiales Extraídos (${capturedEvidences.length})</h4>
              <ul style="margin: 0; padding-left: 18px; font-size: 13px; color: #e2e8f0;">${evItemsHtml}</ul>
            </div>
          `;
        }

        const customEmailSubject = String(emailCfg.emailSubject || '').trim();
        const resolvedEmailSubject = customEmailSubject
          ? `${customEmailSubject} (${compLabel})`
          : `📊 Reporte Automático SGSST: ${automation.name} - ${compLabel}`;

        const emailSettled = await withTimeout(
          Promise.allSettled(
            validEmails.map((recipient) =>
              sendEmail({
                email: recipient,
                from: process.env.EMAIL_NOTIFICATIONS_FROM || 'notificaciones@wappy.club',
                subject: resolvedEmailSubject,
                payload: {
                  taskName: automation.name,
                  agentName: automation.agentName || 'Agente Experto SG-SST',
                  companyName: compLabel,
                  executionDate: bogotaDateStr,
                  prompt: automation.prompt,
                  result: emailHtmlResult,
                  chatUrl,
                  year: new Date().getFullYear(),
                },
                template: 'agentAutomationReport.handlebars',
                throwError: true,
                ...(emailAttachments.length > 0 ? { attachments: emailAttachments } : {}),
              }),
            ),
          ),
          28000,
          'email_report',
        );
        const failedRecipients = [];
        emailSettled.forEach((resItem, idx) => {
          if (resItem.status === 'rejected') {
            const errMsg = resItem.reason?.message || String(resItem.reason || 'Error SMTP');
            failedRecipients.push(`${validEmails[idx]}: ${errMsg}`);
            console.warn(`[AutomationScheduler] Non-blocking email error for ${validEmails[idx]}:`, errMsg);
          }
        });
        if (failedRecipients.length === validEmails.length) {
          errors.push(`email_report: ${failedRecipients.join(' | ')}`);
        } else {
          if (failedRecipients.length > 0) {
            errors.push(`email_report_partial: ${failedRecipients.join(' | ')}`);
          }
          executedOutputs.push('email_report');
        }
      }
    } catch (emailErr) {
      errors.push(`email_report: ${emailErr.message}`);
    }
  }

  // Si se crearon enlaces en Google Workspace y tenemos logId, anexarlos al resultado del log en Historial
  if (workspaceLinks.length > 0 && logId) {
    try {
      const linksMd =
        `\n\n---\n### 🔗 Salidas Generadas en Google Workspace\n` +
        workspaceLinks.map((wl) => `- [${wl.label}](${wl.url})`).join('\n');
      const existingLog = await AutomationLog.findById(logId).select('result').lean();
      if (existingLog && !String(existingLog.result || '').includes(workspaceLinks[0].url)) {
        await AutomationLog.updateOne(
          { _id: logId },
          { $set: { result: `${existingLog.result || safeResponseText}${linksMd}` } },
        );
      }
    } catch (_) {}
  }

  return { executedOutputs, workspaceLinks, errors };
}

async function runAutomation(automation, optionsOrIsManual = false) {
  const runOpts =
    typeof optionsOrIsManual === 'boolean'
      ? { isManual: optionsOrIsManual }
      : optionsOrIsManual && typeof optionsOrIsManual === 'object'
        ? optionsOrIsManual
        : {};
  const isManual = Boolean(runOpts.isManual);
  const triggerSource = String(
    runOpts.triggerSource || (isManual ? 'manual' : 'schedule_cron'),
  );
  const eventPayload = runOpts.eventPayload || null;
  const gmailMessageId = runOpts.gmailMessageId ? String(runOpts.gmailMessageId) : '';
  const runStartedAtMs = Date.now();

  const automationIdStr = automation._id.toString();
  console.log(
    `[AutomationScheduler] Starting execution for automation "${automation.name}" (${automationIdStr}) [trigger=${triggerSource}]`,
  );

  // Create or hydrate pre-allocated log entry
  let log = null;
  if (runOpts.existingLogId && mongoose.Types.ObjectId.isValid(String(runOpts.existingLogId))) {
    log = await AutomationLog.findByIdAndUpdate(
      runOpts.existingLogId,
      {
        $set: {
          status: 'running',
          triggerSource,
          heartbeatAt: new Date(),
          durationMs: 0,
          currentStageLabel: 'Iniciando disparador del flujo...',
          activeStepNodeKey: 'trigger_root',
          ...(gmailMessageId ? { gmailMessageId } : {}),
          ...(eventPayload ? { eventMetadata: eventPayload } : {}),
        },
      },
      { new: true },
    );
  }
  if (!log) {
    log = await AutomationLog.create({
      automation: automation._id,
      user: automation.user,
      companyId: automation.companyId,
      agentId: automation.agentId,
      agentName: automation.agentName,
      prompt: automation.prompt,
      status: 'running',
      triggerSource,
      heartbeatAt: new Date(),
      durationMs: 0,
      currentStageLabel: 'Iniciando disparador del flujo...',
      activeStepNodeKey: 'trigger_root',
      ...(gmailMessageId ? { gmailMessageId } : {}),
      ...(eventPayload ? { eventMetadata: eventPayload } : {}),
    });
  }

  // Update Automation state to running & link active log
  await Automation.updateOne(
    { _id: automation._id },
    { $set: { lastRunStatus: 'running', lastRunAt: new Date(), lastRunLogId: log._id } },
  );

  const prelimAbortController = new AbortController();
  // 10 minutes timeout (600,000 ms) safety measure (armed through finally)
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

  // Latido periódico (cada 12s) para distinguir ejecuciones largas legítimas de procesos caídos
  const heartbeatTimer = setInterval(() => {
    AutomationLog.updateOne(
      { _id: log._id, status: 'running' },
      {
        $set: {
          heartbeatAt: new Date(),
          durationMs: Math.max(0, Date.now() - runStartedAtMs),
        },
      },
    ).catch(() => {});
  }, 12000);

  const liveTracker = createLiveRunTracker({
    logId: log._id,
    startedAtMs: runStartedAtMs,
    modelUsed: String(automation.workflowNodes?.aiModel || ''),
  });

  // Emitir paso inicial de Disparador inmediatamente para vista En Vivo
  try {
    const trigListInit = getAutomationTriggersList(automation);
    const primaryTrigId = trigListInit[0] || automation.workflowNodes?.trigger || 'schedule_cron';
    const trigLabelMap = {
      schedule_cron: 'Cron Programado',
      trigger_tenshi: 'Tenshi IA (Voz / Chat)',
      trigger_email_in: 'Correo Entrante',
      trigger_webhook_in: 'Webhook HTTP',
      trigger_qr_report: 'Reporte QR en Planta',
      trigger_agent_chain: 'Cadena Multi-Agente',
    };
    liveTracker.upsertStep({
      nodeKey: 'trigger_root',
      nodeId: primaryTrigId,
      title: trigLabelMap[primaryTrigId] || formatHumanWorkflowNodeTitle(primaryTrigId),
      category: 'trigger',
      status: 'done',
      durationMs: 120,
      inputCount: 0,
      outputCount: 1,
      outputPreview: `Disparo "${triggerSource}" recibido. Preparando fuentes de lectura...`,
      outputItems: [
        {
          Disparador: trigLabelMap[primaryTrigId] || primaryTrigId,
          OrigenReal: triggerSource,
          HoraInicio: new Date().toISOString(),
        },
      ],
    });
    for (let tIdx = 1; tIdx < trigListInit.length; tIdx += 1) {
      const extraTrigId = trigListInit[tIdx];
      const matchesVoice = triggerSource === 'tenshi_voice' && extraTrigId === 'trigger_tenshi';
      const matchesWebhook = triggerSource === 'webhook' && extraTrigId.includes('webhook');
      const matchesEmail = triggerSource === 'email' && extraTrigId.includes('email');
      const isActiveExtra = matchesVoice || matchesWebhook || matchesEmail;
      liveTracker.upsertStep({
        nodeKey: `trigger_${extraTrigId}`,
        nodeId: extraTrigId,
        title: trigLabelMap[extraTrigId] || formatHumanWorkflowNodeTitle(extraTrigId),
        category: 'trigger',
        status: 'done',
        durationMs: 40,
        inputCount: 0,
        outputCount: 1,
        outputPreview: isActiveExtra
          ? `Disparador "${triggerSource}" activó este flujo.`
          : 'Disparador alterno en espera (sincronizado con entrada principal).',
      });
    }
    liveTracker.setActiveStage('trigger_root', 'Leyendo fuentes y módulos conectados...');
    await liveTracker.flush({}, { awaitWrite: true });
  } catch (_) {}

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
      agent = {
        id: automation.agentId || 'agent_consultor_sg_sst',
        name: automation.agentName || 'Consultor SG-SST',
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

    const allNodeCfg =
      automation.workflowNodes?.canvasLayout?.nodeConfigs ||
      automation.workflowNodes?.nodeConfigs ||
      {};

    let companyProfileMemoryBlock = '';
    if (activeMemories.includes('wappy_memory_company') && automationCompany) {
      companyProfileMemoryBlock =
        `- [MEMORIA DE EMPRESA (wappy_memory_company)]: Razón Social: "${automationCompany.companyName}" | NIT: ${automationCompany.nit || 'N/A'} | Actividad Económica: ${automationCompany.economicActivity || 'N/A'} (CIIU: ${automationCompany.ciiu || automationCompany.ciiuCode || 'N/A'}) | Nivel de Riesgo ARL: ${automationCompany.riskLevel || 'N/A'} | ARL: ${automationCompany.arl || 'N/A'} | N.º Trabajadores: ${automationCompany.workerCount ?? automationCompany.employeeCount ?? 'N/A'} | Ciudad/Depto: ${automationCompany.city || 'N/A'} / ${automationCompany.departamento || automationCompany.department || 'N/A'} | Representante Legal: ${automationCompany.legalRepresentative || 'N/A'} | Responsable SG-SST: ${automationCompany.responsibleSST || automationCompany.sstResponsibleName || 'N/A'} (Licencia: ${automationCompany.licenseNumber || automationCompany.sstLicenseNumber || 'N/A'})\n`;
    }

    let dedupLedger = { keysSet: new Set(), dedupWindow: '' };
    let previousRunMemoryBlock = '';
    if (activeMemories.includes('wappy_memory_antiduplicate')) {
      dedupLedger = await loadProcessedEntityKeysForAutomation({
        automationId: automation._id,
        nodeConfigs: allNodeCfg,
        excludeLogId: log._id,
      });
      try {
        const lastSuccessLog = await AutomationLog.findOne({
          automation: automation._id,
          status: { $in: ['success', 'awaiting_approval'] },
          _id: { $ne: log._id },
        })
          .sort({ runAt: -1 })
          .select('runAt result processedEntityKeys')
          .lean();
        const activeKeysNote =
          dedupLedger.keysSet.size > 0
            ? ` (${dedupLedger.keysSet.size} llave(s) única(s) filtradas activamente en ventana ${dedupLedger.dedupWindow})`
            : ` (ventana activa: ${dedupLedger.dedupWindow})`;
        if (lastSuccessLog?.result) {
          previousRunMemoryBlock =
            `- [MEMORIA DE BITÁCORA PREVIA — ANTI-DUPLICADOS (${new Date(lastSuccessLog.runAt).toISOString()})${activeKeysNote}]: En la ejecución anterior ya se procesó lo siguiente (NO volver a duplicar ni reprocesar los mismos registros/archivos): ${String(lastSuccessLog.result).substring(0, 600)}\n`;
        } else if (automation.lastRunResult) {
          previousRunMemoryBlock =
            `- [MEMORIA DE BITÁCORA PREVIA — ANTI-DUPLICADOS${activeKeysNote}]: Último resultado procesado (NO volver a duplicar ni reprocesar los mismos registros/archivos): ${String(automation.lastRunResult).substring(0, 500)}\n`;
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

      const wfOutputsForContext = Array.isArray(automation.workflowNodes?.outputs)
        ? automation.workflowNodes.outputs
        : ['email_report'];
      const hasDocumentaryOutput =
        wfOutputsForContext.includes('canvas_doc') ||
        wfOutputsForContext.includes('email_report') ||
        wfOutputsForContext.includes('google_docs');

      for (const [nKey, cfg] of Object.entries(nodeConfigs)) {
        if (!cfg || typeof cfg !== 'object') continue;
        const parts = [];
        const isHitoReportPipelineActive =
          hasDocumentaryOutput &&
          (cfg.generateAppReport === true ||
            cfg.appActionMode === 'generate_report' ||
            cfg.appActionMode === 'write_and_report' ||
            cfg.includeLatestReport === true);

        if (cfg.driveFolderName && String(cfg.driveFolderName).trim()) {
          parts.push(`📂 Carpeta Google Drive Objetivo: "${String(cfg.driveFolderName).trim()}"`);
        }
        if (cfg.emailSubjectFilter && String(cfg.emailSubjectFilter).trim()) {
          parts.push(`📧 Filtro de Asunto Gmail: "${String(cfg.emailSubjectFilter).trim()}"`);
        }
        if (cfg.endpointUrl && String(cfg.endpointUrl).trim()) {
          parts.push(`🔌 Endpoint HTTPS Objetivo: "${String(cfg.endpointUrl).trim()}"`);
        }
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
              const rawMsgText = String(latestMsg?.text || '');
              if (isHitoReportPipelineActive) {
                const preservedHtmlOrText = rawMsgText
                  .replace(/<script[\s\S]*?<\/script>/gi, '')
                  .trim()
                  .slice(0, 24000);
                parts.push(
                  `📜 Último Informe Oficial Íntegro del Historial ("${latestConv.title}" — preservado para salida documental): "${preservedHtmlOrText}"`,
                );
              } else {
                const cleanSnippet = rawMsgText
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
              const snippets = selMsgs.map((m) => {
                const rawTxt = String(m.text || '');
                if (isHitoReportPipelineActive) {
                  return rawTxt.replace(/<script[\s\S]*?<\/script>/gi, '').trim().slice(0, 12000);
                }
                return rawTxt
                  .replace(/<style[\s\S]*?<\/style>/gi, '')
                  .replace(/<script[\s\S]*?<\/script>/gi, '')
                  .replace(/<[^>]+>/g, ' ')
                  .replace(/\s+/g, ' ')
                  .trim()
                  .slice(0, 500);
              });
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
        if (cfg.hitoOperationMode) {
          const modeLabel =
            cfg.hitoOperationMode === 'write_register'
              ? 'ESCRITURA / REGISTRO DIRECTO EN SOMOS SST'
              : cfg.hitoOperationMode === 'audit_and_update'
                ? 'AUDITORÍA + ACTUALIZACIÓN EN SOMOS SST'
                : 'SOLO EXTRACCIÓN Y LECTURA';
          parts.push(`Modo Operativo en Aplicativo SST: ${modeLabel}`);
        }
        if (cfg.ifConditionType || cfg.ifRuleExpression) {
          parts.push(
            `Regla Condicional (${cfg.ifConditionType || 'critical_findings'}): "${cfg.ifRuleExpression || 'Detectar hallazgos críticos'}"`,
          );
        }
        if (cfg.approverEmail) {
          parts.push(`Aprobador Humano Responsable: ${cfg.approverEmail}`);
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
          cfgLines.push(`  • Módulo "${formatHumanWorkflowNodeTitle(nKey)}": ${parts.join(' | ')}`);
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
        if (isUnderConstructionNode(cn.key || cn.id || '', cn.nodeType || cn.id || '', cn)) {
          cfgLines.push(
            `  • 🚧 Nodo Omitido (En Construcción): "${cn.title || formatHumanWorkflowNodeTitle(cn.key || cn.id)}" — Omitido limpiamente sin demorar ni afectar el flujo.`,
          );
          return;
        }
        const cnParts = [
          `Nodo Especial "${cn.title || formatHumanWorkflowNodeTitle(cn.key || cn.id)}": ${cn.content || cn.subtitle || ''}`,
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
      const logicNodes = Array.isArray(automation.workflowNodes?.canvasLayout?.logicNodes)
        ? automation.workflowNodes.canvasLayout.logicNodes
        : [];
      logicNodes.forEach((ln) => {
        if (!ln) return;
        cfgLines.push(
          `  • Nodo Lógico "${ln.title || formatHumanWorkflowNodeTitle(ln.key || ln.logicType)}": ${ln.subtitle || 'Control lógico del flujo'}`,
        );
      });
      const legacyCheckIds = [
        ...(Array.isArray(automation.workflowNodes?.triggers) ? automation.workflowNodes.triggers : [automation.workflowNodes?.trigger]),
        ...(Array.isArray(automation.workflowNodes?.extractors) ? automation.workflowNodes.extractors : []),
        ...(Array.isArray(automation.workflowNodes?.inputs) ? automation.workflowNodes.inputs : []),
      ].filter(Boolean);
      for (const lid of legacyCheckIds) {
        if (isUnderConstructionNode(lid, lid, null)) {
          cfgLines.push(
            `  • 🚧 Conector Omitido (En Construcción): "${formatHumanWorkflowNodeTitle(lid)}" — Omitido limpiamente sin demorar ni afectar el flujo.`,
          );
        }
      }
      const wfOutputsList = Array.isArray(automation.workflowNodes?.outputs)
        ? automation.workflowNodes.outputs
        : [];
      const workspaceOutDirectives = [];
      if (wfOutputsList.includes('somos_sst_update')) {
        workspaceOutDirectives.push('Actualizar/sincronizar hallazgos en los módulos correspondientes de Somos SST');
      }
      if (wfOutputsList.includes('google_docs')) {
        workspaceOutDirectives.push('Si tienes habilitado el conector Google Docs, genera o actualiza el acta/informe en Google Docs');
      }
      if (wfOutputsList.includes('google_sheets')) {
        workspaceOutDirectives.push('Si tienes habilitado el conector Google Sheets, sincroniza la tabla de control en Google Sheets');
      }
      if (wfOutputsList.includes('google_calendar')) {
        workspaceOutDirectives.push('Si tienes habilitado el conector Google Calendar, agenda los hitos o vencimientos críticos');
      }
      if (wfOutputsList.includes('google_slides')) {
        workspaceOutDirectives.push('Estructura el resumen ejecutivo listo para presentación gerencial (Google Slides)');
      }
      if (workspaceOutDirectives.length > 0) {
        cfgLines.push(`  • Salidas Conectadas Adicionales: ${workspaceOutDirectives.join(' | ')}`);
      }
      if (cfgLines.length > 0) {
        canvasNodesContextBlock =
          `- [CONFIGURACIÓN DETALLADA DE NODOS Y MULTI-AGENTE EN EL LIENZO WAPPY]:\n${cfgLines.join('\n')}\n`;
      }
    } catch (_) {}

    let liveDatabaseSurgicalBlock = '';
    let structuredSourceRes = {
      contextBlock: '',
      allRecords: [],
      criticalRecords: [],
      freshCriticalRecords: [],
      deduplicatedSkippedRecords: [],
      candidateProcessedKeys: [],
      sourceSummaries: [],
    };
    try {
      liveTracker.setActiveStage(null, 'Consultando fuentes y módulos SG-SST...');
      structuredSourceRes = await collectStructuredWorkflowSourceData(automation, automationCompany, {
        alreadyProcessedKeysSet: dedupLedger.keysSet,
        includeTargetWriteHitos: false,
      });
      liveDatabaseSurgicalBlock = structuredSourceRes?.contextBlock || '';

      // Registrar pasos completados de fuentes de lectura (Extractores y Hitos source_read)
      const wfExtListInit = Array.isArray(automation.workflowNodes?.extractors)
        ? automation.workflowNodes.extractors
        : [];
      const wfInputsListInit = Array.isArray(automation.workflowNodes?.inputs)
        ? automation.workflowNodes.inputs
        : [];
      for (const s of Array.isArray(structuredSourceRes?.sourceSummaries)
        ? structuredSourceRes.sourceSummaries
        : []) {
        const sId = String(s.nodeId || s.canonicalNodeId || '');
        if (!sId) continue;
        const isExtNode =
          wfExtListInit.includes(sId) || sId.startsWith('extract_') || sId.startsWith('somos_sst_trabajadores');
        const isInputNode = wfInputsListInit.includes(sId) || sId.startsWith('somos_sst_') || sId.startsWith('pronostico_') || sId.startsWith('buscar_');
        const resolvedKey = isExtNode
          ? `extractor_${sId}`
          : isInputNode && !sId.startsWith('hito')
            ? `tool_inputs_${sId}`
            : `tool_hitos_${sId}`;
        const matchingRows = (structuredSourceRes.allRecords || [])
          .filter((r) => String(r._sourceNodeId || '') === sId)
          .slice(0, 15)
          .map((rec, rIdx) => ({
            '#': rIdx + 1,
            Registro: rec.label || rec.nombre || rec.title || rec.id || `Item #${rIdx + 1}`,
            Detalle: rec.sublabel || '',
            Estado: rec.badge || (rec.isCritical ? 'Brecha / Crítico' : 'Al día'),
            ...(rec.fields && typeof rec.fields === 'object' ? rec.fields : {}),
          }));
        liveTracker.upsertStep({
          nodeKey: resolvedKey,
          nodeId: sId,
          title: s.moduleTitle || formatHumanWorkflowNodeTitle(sId),
          category: isExtNode ? 'extractor' : 'hito',
          status: 'done',
          durationMs: 260,
          inputCount: 1,
          outputCount: Number(s.totalRecords || 0),
          outputPreview: `${s.totalRecords || 0} registro(s) verificado(s) · ${s.freshCriticalCount || 0} brecha(s) nueva(s)${Number(s.deduplicatedSkippedCount || 0) > 0 ? ` · ${s.deduplicatedSkippedCount} omitido(s) por anti-duplicados` : ''}`,
          outputItems: matchingRows,
        });
      }
      await liveTracker.flush();
    } catch (liveErr) {
      console.error('[AutomationScheduler] Error construyendo extracción quirúrgica en vivo:', liveErr?.message || liveErr);
    }

    // Si el flujo incluye nodos de Scraping Web con Google Antigravity (ej. custom_scraper_agy_alto_riesgo),
    // ejecutar la verificación real por el túnel Push SSE de Antigravity (MinTrabajo Alturas + Rama Judicial + SENA)
    let liveAntigravityScraperBlock = '';
    const runCapturedEvidences = [];
    let runScraperBreachCount = 0;
    const runScraperCandidateKeys = [];
    try {
      const wfCustomNodes = Array.isArray(automation.workflowNodes?.canvasLayout?.customNodes)
        ? automation.workflowNodes.canvasLayout.customNodes
        : Array.isArray(automation.workflowNodes?.customNodes)
          ? automation.workflowNodes.customNodes
          : [];
      const wfExtractors = Array.isArray(automation.workflowNodes?.extractors)
        ? automation.workflowNodes.extractors
        : [];
      const wfInputs = Array.isArray(automation.workflowNodes?.inputs)
        ? automation.workflowNodes.inputs
        : [];
      const seenScraperKeys = new Set();
      const scraperCandidates = [
        ...wfCustomNodes.map((cn) => ({
          nodeKey: cn?.key || cn?.id || '',
          nodeId: cn?.nodeType || cn?.config?.scraperTarget || cn?.id || '',
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
        const hay = `${cand.nodeKey} ${cand.nodeId} ${cand.customNodeObj?.title || ''} ${cand.customNodeObj?.config?.scraperTarget || ''}`.toLowerCase();
        let canonicalPortalKey = `${cand.nodeKey}::${cand.nodeId}`;
        if (hay.includes('arl_directo') || hay.includes('agy_arl') || /\barl\b/.test(hay)) {
          canonicalPortalKey = 'portal::arl_directo';
        } else if (hay.includes('vial_pesv')) {
          canonicalPortalKey = 'portal::vial_pesv';
        } else if (hay.includes('antecedentes') || hay.includes('rama_judicial')) {
          canonicalPortalKey = 'portal::antecedentes';
        } else if (hay.includes('alto_riesgo') || hay.includes('mintrabajo') || hay.includes('centrosentrenamiento')) {
          canonicalPortalKey = 'portal::alto_riesgo';
        }
        if (seenScraperKeys.has(canonicalPortalKey)) return false;
        seenScraperKeys.add(canonicalPortalKey);
        return true;
      });

      if (scraperCandidates.length > 0) {
        const previewBlocks = [];
        for (const sc of scraperCandidates) {
          const mergedNodeCfg = {
            ...(sc.customNodeObj?.config || {}),
            ...(allNodeCfg[sc.nodeKey] || allNodeCfg[sc.nodeId] || {}),
          };
          const scrapeRes = await executeRealAntigravityScraperVerification({
            userIdStr: String(automation.user),
            targetCompanyIdStr,
            companyName: automationCompany?.companyName || 'Empresa Activa',
            nodeKey: sc.nodeKey,
            nodeId: sc.nodeId,
            nodeTitle: sc.customNodeObj?.title || '',
            customNodeObj: sc.customNodeObj || {},
            nodeCfg: mergedNodeCfg,
            allNodeConfigs: allNodeCfg,
            mockTriggerInput: '',
            promptText: automation.prompt || '',
          });
          if (Array.isArray(scrapeRes?.evidences) && scrapeRes.evidences.length > 0) {
            runCapturedEvidences.push(...scrapeRes.evidences);
          }
          if (Array.isArray(scrapeRes?.outputItems) && scrapeRes.outputItems.length > 0) {
            for (const item of scrapeRes.outputItems) {
              const statusTxt = String(
                item?.estadoPortal || item?.detalleOficial || item?.estado || item?.alerta || '',
              ).toLowerCase();
              const isItemBreach =
                Boolean(item?.isCritical) ||
                /sin\s+registro|sin\s+curso|vencid|no\s+afiliad|inactiv|comparendo|multa|brecha|cr[ií]tic|no\s+encontrad/i.test(
                  statusTxt,
                );
              if (isItemBreach) {
                const rawDoc = String(
                  item?.cedula || item?.['Cédula / Documento'] || item?.documento || item?.placa || item?.id || '',
                )
                  .trim()
                  .toLowerCase()
                  .replace(/[^a-z0-9_-]/g, '');
                const sKey = `scraper:${sc.nodeId || sc.nodeKey}:${rawDoc || 'item'}`;
                if (!dedupLedger.keysSet.has(sKey)) {
                  runScraperBreachCount += 1;
                  runScraperCandidateKeys.push(sKey);
                }
              }
            }
          } else if (Number(scrapeRes?.verifiedNoCoursesCount || 0) > 0) {
            runScraperBreachCount += Number(scrapeRes.verifiedNoCoursesCount);
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

    // 4.9. Pre-extracción en vivo (Drive folder, Gmail, Web Search, Webhook API, Clima, Perfiles, EPP, Exámenes, LMS) + Loop & Merge
    let livePreExtractionBlock = '';
    let preExtractionTraceMeta = {};
    let preRes = null;
    try {
      preRes = await buildLivePreExtractionAndLogicBlocks({
        automation,
        reqUser,
        targetCompanyIdStr,
        automationCompany,
        effectiveAiModel,
        alreadyProcessedKeysSet: dedupLedger.keysSet,
      });
      livePreExtractionBlock = preRes?.contextBlock || preRes?.block || '';
      preExtractionTraceMeta = preRes?.traceMeta || {};
    } catch (preErr) {
      console.warn('[AutomationScheduler] Aviso en buildLivePreExtractionAndLogicBlocks:', preErr?.message || preErr);
    }

    // 4.95. Compuerta Condicional Determinista Pre-Agente (`ifPlacement: 'pre_agent'`) — 0 tokens LLM en Rama NO
    const ifCfg = allNodeCfg.if_router || allNodeCfg.if_condition || {};
    const includeIfNodeFlag = Boolean(automation.workflowNodes?.includeIfNode);
    const isPreAgentIf =
      includeIfNodeFlag && String(ifCfg.ifPlacement || '').trim() === 'pre_agent';
    const ifConditionLabelStr = String(
      ifCfg.ifConditionLabel ||
        ifCfg.customTitle ||
        ifCfg.title ||
        ifCfg.customInstruction ||
        ifCfg.ifRuleExpression ||
        automation.workflowNodes?.ifConditionLabel ||
        '',
    ).trim();
    const wfTriggersForCondition = Array.isArray(automation.workflowNodes?.triggers)
      ? automation.workflowNodes.triggers
      : [automation.workflowNodes?.trigger].filter(Boolean);
    const wfExtractorsForCondition = Array.isArray(automation.workflowNodes?.extractors)
      ? automation.workflowNodes.extractors
      : [];

    // Registrar Extractores externos (Drive / Gmail) y Nodos Lógicos pre-condicionales (Merge / Loop) en traza en vivo
    if (wfExtractorsForCondition.includes('extract_drive') || wfExtractorsForCondition.includes('google_drive')) {
      const drvKey = wfExtractorsForCondition.includes('extract_drive')
        ? 'extractor_extract_drive'
        : 'extractor_google_drive';
      const totalDrv = Number(preRes?.traceMeta?.driveFilesPrelisted || 0);
      const freshDrv = Number(preRes?.traceMeta?.freshDriveFilesCount || 0);
      liveTracker.upsertStep({
        nodeKey: drvKey,
        nodeId: wfExtractorsForCondition.includes('extract_drive') ? 'extract_drive' : 'google_drive',
        title: 'Extraer de Drive',
        category: 'extractor',
        status: 'done',
        durationMs: 320,
        inputCount: 1,
        outputCount: totalDrv,
        outputPreview: `${totalDrv} archivo(s) listado(s) · ${freshDrv} nuevo(s) sin procesar`,
        outputItems: Array.isArray(preRes?.freshDriveFiles)
          ? preRes.freshDriveFiles.slice(0, 15).map((f) => ({
              Archivo: f.name || f.title || f.id,
              MimeType: f.mimeType || 'documento',
              Modificado: f.modifiedTime || '',
            }))
          : [],
      });
    }
    if (wfExtractorsForCondition.includes('extract_gmail')) {
      const totalGm = Number(preRes?.traceMeta?.gmailMessagesPreextracted || 0);
      const freshGm = Number(preRes?.traceMeta?.freshGmailMessagesCount || 0);
      liveTracker.upsertStep({
        nodeKey: 'extractor_extract_gmail',
        nodeId: 'extract_gmail',
        title: 'Extraer de Gmail',
        category: 'extractor',
        status: 'done',
        durationMs: 280,
        inputCount: 1,
        outputCount: totalGm,
        outputPreview: `${totalGm} correo(s) inspeccionado(s) · ${freshGm} nuevo(s) sin procesar`,
      });
    }
    const preLogicNodesList = Array.isArray(automation.workflowNodes?.canvasLayout?.logicNodes)
      ? automation.workflowNodes.canvasLayout.logicNodes.filter(
          (ln) =>
            ln &&
            String(ln.logicType || '').toLowerCase() !== 'human_approval' &&
            ln.id !== 'logic_human_approval',
        )
      : [];
    for (const ln of preLogicNodesList) {
      if (!ln?.key) continue;
      liveTracker.upsertStep({
        nodeKey: ln.key,
        nodeId: `logic_${ln.logicType || 'merge'}`,
        title: ln.title || 'Unir Ramas / Bucle',
        category: 'logic',
        status: 'done',
        durationMs: 45,
        inputCount: Array.isArray(structuredSourceRes?.allRecords) ? structuredSourceRes.allRecords.length : 1,
        outputCount: Array.isArray(structuredSourceRes?.allRecords) ? structuredSourceRes.allRecords.length : 1,
        outputPreview: 'Ramas y fuentes consolidadas determinísticamente antes de la compuerta.',
      });
    }

    // Solo considerar eventos externos que realmente transportan datos entrantes (NUNCA comandos de activación de voz/UI)
    const isExternalDataEvent =
      ['webhook', 'email', 'qr_report', 'agent_chain'].includes(triggerSource) ||
      Boolean(
        eventPayload &&
          typeof eventPayload === 'object' &&
          (eventPayload.gmailMessageId ||
            eventPayload.driveFileId ||
            eventPayload.webhookBody ||
            eventPayload.externalItems ||
            eventPayload.portalName ||
            eventPayload.qrFinding),
      );
    const effectiveEventPayload = isExternalDataEvent ? eventPayload : null;

    const watchesDriveNewFiles =
      wfExtractorsForCondition.includes('extract_drive') ||
      wfExtractorsForCondition.includes('google_drive') ||
      /\b(drive|furat|archivo\s+nuevo|archivos?\s+nuevos?)\b/i.test(ifConditionLabelStr);
    const watchesExternal =
      watchesDriveNewFiles ||
      wfExtractorsForCondition.includes('extract_gmail') ||
      wfExtractorsForCondition.includes('extract_ai_doc_ocr') ||
      wfExtractorsForCondition.includes('extractor_extract_ai_doc_ocr') ||
      wfTriggersForCondition.includes('trigger_email') ||
      wfTriggersForCondition.includes('trigger_email_in') ||
      wfTriggersForCondition.includes('trigger_webhook') ||
      wfTriggersForCondition.includes('trigger_webhook_in') ||
      Boolean(effectiveEventPayload);

    let preIfRes = null;
    if (isPreAgentIf) {
      liveTracker.setActiveStage('if_router', 'Evaluando Condición Si/No (Pre-Agente)...');
      preIfRes = evaluatePreAgentDeterministicIf({
        ifCfg,
        structuredSourceRes,
        preRes,
        runCapturedEvidences,
        scraperBreachCount: runScraperBreachCount,
        eventPayload: effectiveEventPayload,
        watchesExternal,
      });

      liveTracker.upsertStep({
        nodeKey: 'if_router',
        nodeId: 'if_node_router',
        title: 'Condición Si/No (Pre-IA)',
        category: 'if',
        status: 'done',
        branchTaken: preIfRes.passed ? 'yes' : 'no',
        durationMs: 35,
        inputCount: Array.isArray(structuredSourceRes?.allRecords) ? structuredSourceRes.allRecords.length : 0,
        outputCount: preIfRes.passed ? 1 : 0,
        outputPreview: preIfRes.reason,
        outputItems: [
          {
            Compuerta: ifConditionLabelStr || 'Detección determinista de brechas nuevas',
            RamaTomada: preIfRes.passed ? 'Rama SÍ' : 'Rama NO (0 tokens IA)',
            RegistrosAuditados: Array.isArray(structuredSourceRes?.allRecords)
              ? structuredSourceRes.allRecords.length
              : 0,
            BrechasNuevas: preIfRes.freshCriticalCount || 0,
            OmitidosAntiDuplicados: preIfRes.dedupSkippedCount || 0,
            Dictamen: preIfRes.reason,
          },
        ],
      });
      await liveTracker.flush();

      if (preIfRes.passed === false) {
        const totalAuditedRecordsCount = Array.isArray(structuredSourceRes?.allRecords)
          ? structuredSourceRes.allRecords.length
          : 0;
        const extDedupCount =
          Number(preRes?.traceMeta?.deduplicatedDriveFilesCount || 0) +
          Number(preRes?.traceMeta?.deduplicatedGmailMessagesCount || 0);
        const totalDedupSkipped = Number(preIfRes.dedupSkippedCount || 0) + extDedupCount;

        const sourceBulletLines = Array.isArray(structuredSourceRes?.sourceSummaries)
          ? structuredSourceRes.sourceSummaries.map((s) => {
              const sDedup = Number(s.deduplicatedSkippedCount ?? s.deduplicatedCount ?? 0);
              return `- **${s.moduleTitle || s.title || s.canonicalNodeId || s.canonical || s.nodeId}**: ${s.totalRecords} registro(s) verificado(s) · ${s.freshCriticalCount || 0} brecha(s) nueva(s)${sDedup > 0 ? ` · ${sDedup} ya gestionado(s) en ventana anti-duplicados` : ''}`;
            })
          : [];
        if (watchesDriveNewFiles) {
          sourceBulletLines.push(
            `- **Google Drive**: ${Number(preRes?.traceMeta?.driveFilesPrelisted || 0)} archivo(s) listado(s) · ${Number(preRes?.traceMeta?.freshDriveFilesCount || 0)} nuevo(s) sin procesar${Number(preRes?.traceMeta?.deduplicatedDriveFilesCount || 0) > 0 ? ` · ${preRes.traceMeta.deduplicatedDriveFilesCount} ya procesado(s)` : ''}`,
          );
        }
        if (wfExtractorsForCondition.includes('extract_gmail')) {
          sourceBulletLines.push(
            `- **Gmail**: ${Number(preRes?.traceMeta?.gmailMessagesPreextracted || 0)} correo(s) inspeccionado(s) · ${Number(preRes?.traceMeta?.freshGmailMessagesCount || 0)} nuevo(s) sin procesar${Number(preRes?.traceMeta?.deduplicatedGmailMessagesCount || 0) > 0 ? ` · ${preRes.traceMeta.deduplicatedGmailMessagesCount} ya procesado(s)` : ''}`,
          );
        }

        const compDisplay = automationCompany?.companyName || 'Somos SST';
        let preNoResultText =
          `### ✅ Constancia de Verificación Automática SG-SST — Rama NO Activa (0 Tokens IA)\n\n` +
          `- **Empresa Auditada:** ${compDisplay}${automationCompany?.nit ? ` (NIT: ${automationCompany.nit})` : ''}\n` +
          `- **Compuerta Evaluada (Pre-Agente):** ${ifConditionLabelStr || 'Detección determinista de brechas nuevas'}\n` +
          `- **Total de Registros Verificados:** ${totalAuditedRecordsCount}\n` +
          `- **Brechas Críticas Nuevas Detectadas:** 0\n` +
          (totalDedupSkipped > 0
            ? `- **Filtro Anti-Duplicados Activo (${dedupLedger.dedupWindow || '7d'}):** ${totalDedupSkipped} registro(s)/archivo(s) previamente gestionados fueron omitidos para evitar alertas repetidas.\n`
            : '') +
          `- **Dictamen Determinista:** ${preIfRes.reason}\n` +
          `- **Acción Ejecutada:** Se activó limpiamente la **Rama NO** sin invocar al modelo LLM ni generar reportes/escalamientos innecesarios.\n` +
          (sourceBulletLines.length > 0
            ? `\n#### 📊 Fuentes de Lectura Revisadas\n${sourceBulletLines.join('\n')}\n`
            : '');

        const configuredOutputsPre = Array.isArray(automation.workflowNodes?.outputs)
          ? automation.workflowNodes.outputs
          : ['email_report'];
        const postEdgesPre = Array.isArray(automation.workflowNodes?.canvasLayout?.edges)
          ? automation.workflowNodes.canvasLayout.edges
          : [];
        const outputsToExecuteNo = [];
        const outputsBlockedYes = [];
        configuredOutputsPre.forEach((outNodeId) => {
          const outIdx = Math.max(0, configuredOutputsPre.indexOf(outNodeId));
          const branch = resolveOutputBranchForIfRouter(
            outNodeId,
            outIdx,
            configuredOutputsPre,
            allNodeCfg,
            postEdgesPre,
          );
          if (branch === 'no') {
            outputsToExecuteNo.push(outNodeId);
          } else {
            outputsBlockedYes.push(outNodeId);
          }
        });

        // Marcar Agente IA y salidas Rama SÍ como omitidas (`skipped`) por optimización determinista
        liveTracker.markSkippedKeys([
          'agent_root',
          'extractor_extract_ai_doc_ocr',
          ...outputsBlockedYes.map((o) => `out_${o}`),
        ]);
        liveTracker.upsertStep({
          nodeKey: 'agent_root',
          nodeId: automation.agentId || 'ai_agent_root',
          title: 'Agente IA',
          category: 'agent',
          status: 'skipped',
          durationMs: 0,
          outputPreview: 'Omitido limpiamente por Condición Si/No (Pre-IA = Rama NO · 0 tokens IA).',
        });
        for (const yesOutId of outputsBlockedYes) {
          liveTracker.upsertStep({
            nodeKey: `out_${yesOutId}`,
            nodeId: yesOutId,
            title: formatHumanWorkflowNodeTitle(yesOutId),
            category: 'output',
            status: 'skipped',
            branchTaken: 'no',
            durationMs: 0,
            outputPreview: 'Omitida: pertenece a la Rama SÍ.',
          });
        }

        if (outputsToExecuteNo.length > 0) {
          liveTracker.setActiveStage(
            `out_${outputsToExecuteNo[0]}`,
            `Ejecutando salida Rama NO (${formatHumanWorkflowNodeTitle(outputsToExecuteNo[0])})...`,
          );
          await liveTracker.flush();
        }

        const cleanPreEvidenceFiles = sanitizePublicEvidenceList(runCapturedEvidences);
        let outResNo = { executedOutputs: [], workspaceLinks: [], errors: [] };
        if (outputsToExecuteNo.length > 0) {
          try {
            outResNo = await withTimeout(
              executeDownstreamOutputs({
                automation,
                user: reqUser,
                companyId: targetCompanyIdStr,
                companyInfo: automationCompany,
                outputsToExecute: outputsToExecuteNo,
                responseText: preNoResultText,
                generatedAppReports: [],
                activeBranch: 'no',
                nodeConfigs: allNodeCfg,
                capturedEvidences: runCapturedEvidences,
                generatedConvoId: null,
                hasCriticalSignal: false,
                logId: log._id,
              }),
              75000,
              'executeDownstreamOutputs(pre_agent NO)',
            );
          } catch (preOutErr) {
            console.warn(
              '[AutomationScheduler] Non-blocking executeDownstreamOutputs (pre_agent NO) error:',
              preOutErr?.message || preOutErr,
            );
            outResNo.errors = [...(outResNo.errors || []), String(preOutErr?.message || preOutErr)];
          }
        }

        for (const noOutId of outputsToExecuteNo) {
          const outWarn = (outResNo?.errors || []).find((e) => String(e).startsWith(noOutId));
          liveTracker.upsertStep({
            nodeKey: `out_${noOutId}`,
            nodeId: noOutId,
            title: formatHumanWorkflowNodeTitle(noOutId),
            category: 'output',
            status: outWarn ? 'error' : 'done',
            branchTaken: 'no',
            durationMs: 180,
            outputCount: outWarn ? 0 : 1,
            ...(outWarn ? { error: outWarn } : {}),
            outputPreview: outWarn
              ? `Advertencia: ${outWarn}`
              : `Salida Rama NO ejecutada (${formatHumanWorkflowNodeTitle(noOutId)}).`,
          });
        }

        if (
          Array.isArray(outResNo?.workspaceLinks) &&
          outResNo.workspaceLinks.length > 0 &&
          !preNoResultText.includes(outResNo.workspaceLinks[0].url)
        ) {
          const linksMd =
            '\n\n---\n### 🔗 Documentos Generados en Google Workspace\n' +
            outResNo.workspaceLinks
              .map((l) => `- **[${l.type.toUpperCase()}]** [${l.title}](${l.url})`)
              .join('\n');
          preNoResultText += linksMd;
        }

        const cronNextRunPatchPre =
          isManual && automation.status === 'active'
            ? {
                nextRunAt: hasCronTrigger(automation)
                  ? calculateNextRun(automation.scheduleType, automation.scheduleConfig)
                  : null,
              }
            : {};

        liveTracker.setActiveStage(null, 'Completado (Rama NO · 0 tokens IA)');
        const preSnap = liveTracker.getSnapshot();

        await Promise.all([
          AutomationLog.updateOne(
            { _id: log._id },
            {
              $set: {
                status: 'success',
                result: preNoResultText,
                conversationId: null,
                evidenceFiles: cleanPreEvidenceFiles,
                evidences: cleanPreEvidenceFiles,
                dedupWindowUsed: dedupLedger.dedupWindow || '',
                modelUsed: effectiveAiModel,
                companyName: compDisplay,
                ...preSnap,
                executionTrace: {
                  triggerSource,
                  ifPlacement: 'pre_agent',
                  activeBranch: 'no',
                  ifConditionPassed: false,
                  hasCriticalSignal: false,
                  llmSkippedByPreIf: true,
                  ifReason: preIfRes.reason,
                  totalAuditedRecords: totalAuditedRecordsCount,
                  freshCriticalCount: 0,
                  deduplicatedCount: totalDedupSkipped,
                  executedOutputs: outResNo?.executedOutputs || [],
                  workspaceLinks: outResNo?.workspaceLinks || [],
                  ...(outResNo?.errors?.length ? { outputWarnings: outResNo.errors } : {}),
                  ...preExtractionTraceMeta,
                },
              },
            },
          ),
          Automation.updateOne(
            { _id: automation._id },
            {
              $set: {
                lastRunAt: new Date(),
                lastRunStatus: 'success',
                lastRunLogId: log._id,
                lastRunResult: preNoResultText.substring(0, 500),
                ...cronNextRunPatchPre,
              },
            },
          ),
        ]);

        console.log(
          `[AutomationScheduler] PRE-AGENT IF GATE -> Branch NO taken for "${automation.name}" (0 LLM tokens used). Outputs executed: [${(outResNo?.executedOutputs || []).join(', ')}]`,
        );
        return;
      }
    }

    // 4.98. Extracción Estructurada IA + OCR de Documentos (`extract_ai_doc_ocr`)
    // Se ejecuta ESTRICTAMENTE DESPUÉS de la compuerta `pre_agent` (0 tokens gastados si `pre_agent` dio NO)
    if (
      wfExtractorsForCondition.includes('extract_ai_doc_ocr') ||
      wfExtractorsForCondition.includes('extractor_extract_ai_doc_ocr')
    ) {
      liveTracker.setActiveStage(
        'extractor_extract_ai_doc_ocr',
        'Extrayendo datos exactos con IA + OCR de documentos...',
      );
      liveTracker.upsertStep({
        nodeKey: 'extractor_extract_ai_doc_ocr',
        nodeId: 'extract_ai_doc_ocr',
        title: 'Extractor IA Docs',
        category: 'extractor',
        status: 'running',
        outputPreview: 'Leyendo PDF / imágenes / documentos con IA + OCR...',
      });
      await liveTracker.flush();
      try {
        const extractorCfg =
          allNodeCfg?.extractor_extract_ai_doc_ocr ||
          allNodeCfg?.extract_ai_doc_ocr ||
          {};
        const driveCfg =
          allNodeCfg?.extractor_extract_drive ||
          allNodeCfg?.extract_drive ||
          null;
        const gmailCfg =
          allNodeCfg?.extractor_extract_gmail ||
          allNodeCfg?.extract_gmail ||
          null;
        const pcCfg =
          allNodeCfg?.extractor_extract_pc_folder ||
          allNodeCfg?.extract_pc_folder ||
          null;

        const hasPrelistedDrive = wfExtractorsForCondition.includes('extract_drive');
        const hasPrelistedGmail = wfExtractorsForCondition.includes('extract_gmail');

        const aiOcrResult = await withTimeout(
          extractStructuredFieldsFromDocuments({
            userId: String(automation?.user || reqUser?.id || ''),
            companyId: targetCompanyIdStr,
            companyName: automationCompany?.companyName || 'Empresa Activa',
            extractorCfg,
            driveCfg,
            gmailCfg,
            pcCfg,
            freshDriveFiles: hasPrelistedDrive ? preRes?.freshDriveFiles || [] : null,
            freshGmailMessages: hasPrelistedGmail ? preRes?.freshGmailMessages || [] : null,
            eventPayload: effectiveEventPayload || null,
            maxDocs: Math.min(10, Math.max(1, Number(extractorCfg?.maxItems) || 5)),
          }),
          90000,
          'extractStructuredFieldsFromDocuments',
        );

        preExtractionTraceMeta.aiDocOcrExecuted = true;
        preExtractionTraceMeta.aiDocOcrModelUsed = aiOcrResult.modelUsed;
        preExtractionTraceMeta.aiDocOcrDocumentsCount = aiOcrResult.documentsCount;
        preExtractionTraceMeta.aiDocOcrRowsCount = Array.isArray(aiOcrResult.rows)
          ? aiOcrResult.rows.length
          : 0;

        liveTracker.upsertStep({
          nodeKey: 'extractor_extract_ai_doc_ocr',
          nodeId: 'extract_ai_doc_ocr',
          title: 'Extractor IA Docs',
          category: 'extractor',
          status: 'done',
          durationMs: 1200,
          inputCount: aiOcrResult.documentsCount || 0,
          outputCount: Array.isArray(aiOcrResult.rows) ? aiOcrResult.rows.length : 0,
          outputPreview: `${aiOcrResult.documentsCount || 0} documento(s) -> ${Array.isArray(aiOcrResult.rows) ? aiOcrResult.rows.length : 0} fila(s) (${aiOcrResult.modelUsed || effectiveAiModel})`,
          outputItems: Array.isArray(aiOcrResult.rows) ? aiOcrResult.rows.slice(0, 15) : [],
        });

        if (Array.isArray(aiOcrResult.rows) && aiOcrResult.rows.length > 0) {
          const aiOcrBlock =
            `\n✨ [DATOS EXACTOS EXTRAÍDOS CON IA + OCR DE DOCUMENTOS (${aiOcrResult.documentsCount} archivo(s) · Modelo: ${aiOcrResult.modelUsed})]:\n` +
            `${aiOcrResult.markdownTable}\n` +
            `JSON Estructurado:\n${JSON.stringify(aiOcrResult.rows, null, 2)}\n`;
          livePreExtractionBlock = `${livePreExtractionBlock || ''}${aiOcrBlock}`;
          console.log(
            `[AutomationScheduler] ✨ Extractor IA + OCR procesó ${aiOcrResult.documentsCount} archivo(s) -> ${aiOcrResult.rows.length} fila(s) (${aiOcrResult.modelUsed}) para "${automation.name}".`,
          );
        } else {
          console.log(
            `[AutomationScheduler] ℹ️ Extractor IA + OCR verificado para "${automation.name}": 0 documentos candidatos extraíbles.`,
          );
        }
      } catch (aiOcrErr) {
        console.warn(
          '[AutomationScheduler] Aviso en extractStructuredFieldsFromDocuments:',
          aiOcrErr?.message || aiOcrErr,
        );
        liveTracker.upsertStep({
          nodeKey: 'extractor_extract_ai_doc_ocr',
          nodeId: 'extract_ai_doc_ocr',
          title: 'Extractor IA Docs',
          category: 'extractor',
          status: 'error',
          error: aiOcrErr?.message || 'Error en extracción OCR',
          outputPreview: `Aviso OCR: ${aiOcrErr?.message || 'Error'}`,
        });
      }
    }

    const postAgentIfContractDirective =
      includeIfNodeFlag && !isPreAgentIf
        ? `\n\n🔀 [CONTRATO OBLIGATORIO DE COMPUERTA CONDICIONAL POST-AGENTE]: Evalúa estrictamente la condición "${ifConditionLabelStr || '¿Existen hallazgos críticos que requieran escalamiento?'}" y escribe en la ÚLTIMA LÍNEA de tu respuesta exactamente [VEREDICTO_IF: SI] (si se cumple) o [VEREDICTO_IF: NO] (si NO se cumple / todo está al día / es observación menor).`
        : '';

    // Construir directiva explícita de aplicativos conectados en `Herramienta +` (`agent_tool` / `target_write_report`)
    const wfHitosForTools = Array.isArray(automation.workflowNodes?.hitos)
      ? automation.workflowNodes.hitos.filter(Boolean)
      : [];
    const connectedAgentToolHitos = wfHitosForTools.filter((hId) =>
      isAgentToolHitoRole(resolveWorkflowHitoRole(allNodeCfg, hId)),
    );
    let agentToolsConnectedDirective = '';
    if (connectedAgentToolHitos.length > 0 || Number(preExtractionTraceMeta?.aiDocOcrRowsCount || 0) > 0) {
      const toolBulletLines = connectedAgentToolHitos.map((rawHId) => {
        const canonH = normalizeInspectorNodeId(rawHId);
        const hTitle = formatHumanWorkflowNodeTitle(canonH || rawHId);
        const hCfg =
          allNodeCfg[`tool_hitos_${rawHId}`] ||
          allNodeCfg[`sub_tool_${rawHId}`] ||
          allNodeCfg[`hito_${rawHId}`] ||
          allNodeCfg[rawHId] ||
          (canonH && canonH !== rawHId
            ? allNodeCfg[`tool_hitos_${canonH}`] ||
              allNodeCfg[`sub_tool_${canonH}`] ||
              allNodeCfg[`hito_${canonH}`] ||
              allNodeCfg[canonH]
            : null) ||
          {};
        let mcpHint = 'herramienta MCP de gestión operativa Somos SST';
        if (canonH === 'hito2_matriz_ipevar' || canonH === 'hito3_gtc45_ipvr') {
          mcpHint = 'herramienta MCP de Matriz de Peligros IPEVR GTC-45 (`matriz_ipevar`) y gestión Somos SST';
        } else if (canonH === 'hito3_matriz_pesv') {
          mcpHint = 'herramienta MCP de Matriz de Riesgos Viales PESV (`matriz_pesv`) y gestión Somos SST';
        } else if (canonH === 'hito3_quimicos_sga') {
          mcpHint = 'herramienta MCP de Compatibilidad Química SGA (`matriz_compatibilidad`) y gestión Somos SST';
        }
        const reportNote =
          hCfg.generateAppReport === true ||
          hCfg.appActionMode === 'generate_report' ||
          hCfg.appActionMode === 'write_and_report'
            ? ' (incluye emisión automática de Informe Oficial HTML hacia las salidas)'
            : '';
        return `  • Aplicativo en Herramienta +: "${hTitle}" -> Tienes habilitada la ${mcpHint} para consultar, crear o actualizar registros reales en Somos SST${reportNote}.`;
      });

      const ocrSyncNote =
        Number(preExtractionTraceMeta?.aiDocOcrRowsCount || 0) > 0
          ? `  • ✨ Integración con Extractor IA de Documentos: Recibiste ${preExtractionTraceMeta.aiDocOcrRowsCount} fila(s) estructurada(s) reales extraídas previamente con IA + OCR. Cuando invoques tus herramientas conectadas en Herramienta + para guardar o actualizar en Somos SST, utiliza EXACTAMENTE esos campos y valores extraídos sin inventar, omitir ni alterar datos.\n`
          : '';

      agentToolsConnectedDirective =
        `- [HERRAMIENTAS + CONECTADAS AL AGENTE IA PARA OPERAR EN SOMOS SST]:\n` +
        (toolBulletLines.length > 0 ? `${toolBulletLines.join('\n')}\n` : '') +
        ocrSyncNote;
    }

    const cleanExecutiveLanguageDirective =
      `- REGLA DE LENGUAJE EJECUTIVO LIMPIO (CERO IDs TÉCNICOS CRUDOS): En el texto final para el usuario usa SIEMPRE los nombres ejecutivos en español de los aplicativos, conectores y canales (por ejemplo: "Google Drive", "Extractor IA de Documentos", "Perfil Sociodemográfico y Condiciones de Salud", "Investigación de Accidentes ATEL"). ESTÁ ESTRICTAMENTE PROHIBIDO escribir identificadores técnicos internos de código (como \`extract_drive\`, \`extract_ai_doc_ocr\`, \`hito2_perfil_socio\`, \`hito7_investigacion_atel\`, \`somos_sst_update\`, \`wappy_notification\`, \`if_router\`, \`pre_agent\` o nombres crudos de funciones internas) en tu informe final.\n`;

    const realTimeEventHeader = eventPayload
      ? `🚨 [EVENTO DISPARADOR EN TIEMPO REAL (${String(triggerSource || 'event').toUpperCase()}) — PRIORIDAD #1]:\n` +
        `${typeof eventPayload === 'string' ? eventPayload : JSON.stringify(eventPayload, null, 2).slice(0, 8000)}\n\n`
      : '';

    const companyHeaderBlock = automationCompany
      ? `${realTimeEventHeader}[CONTEXTO OBLIGATORIO DE EJECUCIÓN AUTOMÁTICA — AISLAMIENTO ESTRICTO DE EMPRESA]\n` +
        `- Empresa objetivo exclusiva de esta tarea: "${automationCompany.companyName}" (NIT: ${automationCompany.nit || 'N/A'}, ID: ${targetCompanyIdStr}).\n` +
        antigravityEngineDirective +
        companyProfileMemoryBlock +
        previousRunMemoryBlock +
        ragDocumentalMemoryBlock +
        proceduralNormativeMemoryBlock +
        canvasNodesContextBlock +
        agentToolsConnectedDirective +
        liveDatabaseSurgicalBlock +
        livePreExtractionBlock +
        liveAntigravityScraperBlock +
        `- PROHIBIDO usar, mencionar, cruzar o asumir datos de cualquier otra empresa del usuario (aunque aparezcan en memorias previas o si el texto de la instrucción menciona por error otro nombre de empresa).\n` +
        `- PROHIBIDO crear nuevas automatizaciones o tareas programadas recurrentes durante esta ejecución automática.\n` +
        `- PROHIBIDO generar código fuente de aplicativos interactivos (<!DOCTYPE html>, <script>, funciones de simulación JS) como respuesta; entrega únicamente un informe ejecutivo claro y estructurado en Markdown.\n` +
        cleanExecutiveLanguageDirective +
        `- REGLA DE VERACIDAD ESTRICTA: Si Google Drive no está vinculado para "${automationCompany.companyName}" o no existen archivos nuevos reales, infórmalo con total transparencia y NO registres ni inventes datos. JAMÁS simules ni inventes trabajadores, accidentes, hallazgos o acciones ACPM, ni presentes registros antiguos de la base de datos como si acabaran de procesarse desde Drive.\n\n` +
        `[INSTRUCCIÓN DE LA TAREA PROGRAMADA]:\n`
      : `${realTimeEventHeader}${antigravityEngineDirective}${companyProfileMemoryBlock}${previousRunMemoryBlock}${ragDocumentalMemoryBlock}${proceduralNormativeMemoryBlock}${canvasNodesContextBlock}${agentToolsConnectedDirective}${liveDatabaseSurgicalBlock}${livePreExtractionBlock}${liveAntigravityScraperBlock}${cleanExecutiveLanguageDirective}`;
    const effectivePrompt = `${companyHeaderBlock}${automation.prompt}${postAgentIfContractDirective}`;

    // Override agent model if specified in the WAPPY workflow canvas
    if (effectiveAiModel) {
      agent.model = effectiveAiModel;
      agent.model_parameters = {
        ...(agent.model_parameters || {}),
        model: effectiveAiModel,
      };
    }

    // Inyección Dinámica de Herramientas del Lienzo sin duplicados ni herramientas fantasma
    const dynamicWorkflowTools = resolveRequiredToolsForWorkflow(automation.workflowNodes);
    const wfCanvasObj =
      automation.workflowNodes && typeof automation.workflowNodes === 'object'
        ? automation.workflowNodes
        : {};
    const hasExplicitCanvasGraph =
      Boolean(wfCanvasObj.canvasLayout) ||
      (Array.isArray(wfCanvasObj.extractors) && wfCanvasObj.extractors.length > 0) ||
      (Array.isArray(wfCanvasObj.inputs) && wfCanvasObj.inputs.length > 0) ||
      (Array.isArray(wfCanvasObj.hitos) && wfCanvasObj.hitos.length > 0) ||
      (Array.isArray(wfCanvasObj.outputs) && wfCanvasObj.outputs.length > 0);
    const existingAgentTools = Array.isArray(agent.tools) ? agent.tools.filter(Boolean) : [];
    agent.tools = hasExplicitCanvasGraph
      ? dynamicWorkflowTools
      : Array.from(new Set([...existingAgentTools, ...dynamicWorkflowTools]));

    // Build mock request & response with explicit companyId, isAutomation flag, and app reports collector
    const req = {
      user: reqUser,
      companyId: targetCompanyIdStr,
      isAutomation: true,
      _generatedAppReports: [],
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

    // Registrar Sub-Nodos (Modelo IA, Memorias, Herramientas+) y marcar Agente IA Principal como `running` en vivo
    try {
      liveTracker.upsertStep({
        nodeKey: 'sub_model',
        nodeId: effectiveAiModel || 'gemini-3.6-flash',
        title: `Modelo IA (${effectiveAiModel || 'gemini-3.6-flash'})`,
        category: 'model',
        status: 'done',
        durationMs: 25,
        outputPreview: `Motor: ${selectedAiEngine} · Modelo activo: ${effectiveAiModel || 'gemini-3.6-flash'}`,
      });
      activeMemories.forEach((memId, mIdx) => {
        const memKey = mIdx === 0 ? 'sub_memory' : `sub_memory_${memId}`;
        liveTracker.upsertStep({
          nodeKey: memKey,
          nodeId: memId,
          title: formatHumanWorkflowNodeTitle(memId),
          category: 'memory',
          status: 'done',
          durationMs: 35,
          outputPreview:
            memId === 'wappy_memory_company'
              ? `Contexto cargado: ${automationCompany?.companyName || 'Somos SST'} (${automationCompany?.nit || 'Sin NIT'})`
              : memId === 'wappy_memory_antiduplicate'
                ? `Filtro anti-duplicados activo (${dedupLedger.dedupWindow || '7d'} · ${dedupLedger.keysSet.size} llave(s) previa(s))`
                : 'Memoria activa inyectada al Agente IA.',
        });
      });
      for (const hToolId of connectedAgentToolHitos) {
        liveTracker.upsertStep({
          nodeKey: `tool_hitos_${hToolId}`,
          nodeId: hToolId,
          title: formatHumanWorkflowNodeTitle(hToolId),
          category: 'hito',
          status: 'done',
          durationMs: 30,
          outputPreview: 'Herramienta MCP conectada debajo del Agente IA (Herramienta +).',
        });
      }
      liveTracker.setActiveStage(
        'agent_root',
        `Agente IA "${agent?.name || automation.agentName || 'Consultor SG-SST'}" analizando...`,
      );
      liveTracker.upsertStep({
        nodeKey: 'agent_root',
        nodeId: automation.agentId || 'ai_agent_root',
        title: agent?.name || automation.agentName || 'Agente IA',
        category: 'agent',
        status: 'running',
        inputCount: Array.isArray(structuredSourceRes?.allRecords) ? structuredSourceRes.allRecords.length : 1,
        outputPreview: `Procesando análisis SG-SST con ${effectiveAiModel || 'gemini-3.6-flash'}...`,
      });
      await liveTracker.flush({
        modelUsed: effectiveAiModel || '',
        companyName: automationCompany?.companyName || 'Somos SST',
      });
    } catch (_) {}

    const agentPhaseStartedAtMs = Date.now();

    // 5-8. Construct endpointOption & execute agent call (supports programmatic agentExecutorOverride for deterministic logical test suites)
    let response = null;
    if (typeof runOpts.agentExecutorOverride === 'function') {
      console.log(`[AutomationScheduler] STEP 3: Executing programmatic agentExecutorOverride for "${automation.name}"...`);
      response = await runOpts.agentExecutorOverride({
        effectivePrompt,
        agent,
        req,
        automation,
        structuredSourceRes,
        preRes,
        dedupLedger,
      });
      if (response?.conversationId) {
        generatedConvoId = response.conversationId;
      }
    } else {
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
      response = await Promise.race([
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

    // Limpiar ruido visual de URLs crudas en la respuesta si existen certificados descargados en la bandeja dedicada
    const cleanRunEvidenceFiles = sanitizePublicEvidenceList(runCapturedEvidences);
    if (cleanRunEvidenceFiles.length > 0) {
      resultText = stripAgentInlineEvidenceNoise(resultText, cleanRunEvidenceFiles);
    }

    const agentDurationMs = Math.max(100, Date.now() - agentPhaseStartedAtMs);
    liveTracker.upsertStep({
      nodeKey: 'agent_root',
      nodeId: automation.agentId || 'ai_agent_root',
      title: agent?.name || automation.agentName || 'Agente IA',
      category: 'agent',
      status: 'done',
      durationMs: agentDurationMs,
      inputCount: Array.isArray(structuredSourceRes?.allRecords) ? structuredSourceRes.allRecords.length : 1,
      outputCount: 1,
      outputPreview: resultText.slice(0, 600),
      outputItems: [
        {
          Agente: agent?.name || automation.agentName || 'Agente Especialista',
          Modelo: effectiveAiModel || 'gemini-3.6-flash',
          Duracion: `${(agentDurationMs / 1000).toFixed(1)}s`,
          Conversacion: generatedConvoId || '—',
          ResumenRespuesta: resultText.slice(0, 320),
        },
      ],
      ...(cleanRunEvidenceFiles.length > 0 ? { evidenceFiles: cleanRunEvidenceFiles } : {}),
    });
    liveTracker.setActiveStage(null, 'Procesando validación y salidas posteriores...');
    await liveTracker.flush({
      ...(generatedConvoId ? { conversationId: generatedConvoId } : {}),
    });

    const postNodeConfigs = automation.workflowNodes?.canvasLayout?.nodeConfigs || {};
    const postLogicNodes = Array.isArray(automation.workflowNodes?.canvasLayout?.logicNodes)
      ? automation.workflowNodes.canvasLayout.logicNodes
      : [];
    const postEdges = Array.isArray(automation.workflowNodes?.canvasLayout?.edges)
      ? automation.workflowNodes.canvasLayout.edges
      : [];
    const postCustomNodes = Array.isArray(automation.workflowNodes?.canvasLayout?.customNodes)
      ? automation.workflowNodes.canvasLayout.customNodes
      : Array.isArray(automation.workflowNodes?.customNodes)
        ? automation.workflowNodes.customNodes
        : [];
    const extraAgentsForRun = Array.isArray(automation.workflowNodes?.canvasLayout?.extraAgents)
      ? automation.workflowNodes.canvasLayout.extraAgents.filter(Boolean)
      : [];
    const subagentCustomNodes = postCustomNodes.filter((cn) => {
      const cid = String(cn?.id || cn?.nodeType || cn?.key || '').toLowerCase();
      return cid.startsWith('subagent_') || cn?.category === 'subagent';
    });

    // 9.5. Pases Secuenciales Multi-Agente (`extraAgents` y `subagent_*` en `customNodes`) vía callSgsstGemini
    let multiAgentPassesExecuted = 0;
    if (extraAgentsForRun.length > 0 || subagentCustomNodes.length > 0) {
      try {
        const { callSgsstGemini } = require('~/server/routes/sgsst/sgsstGemini');
        const sequentialReviewers = [
          ...extraAgentsForRun.map((ea, idx) => ({
            nodeKey: ea.key || `agent_extra_${idx + 1}`,
            nodeId: ea.agentId || 'ai_agent_extra',
            name: ea.agentName || ea.name || `Agente Especialista #${idx + 2}`,
            role: ea.roleLabel || 'Revisor / Auditor Especialista SG-SST',
            model: allowedTextModels.includes(ea.aiModel || ea.model)
              ? ea.aiModel || ea.model
              : effectiveAiModel,
            instruction:
              String(ea.prompt || postNodeConfigs[ea.key]?.customInstruction || '').trim() ||
              'Audita, enriquece técnicamente y consolida el dictamen del Agente #1 con rigor normativo SG-SST colombiano.',
          })),
          ...subagentCustomNodes.map((sn, idx) => {
            const snCfg = postNodeConfigs[sn.key] || postNodeConfigs[sn.id] || {};
            return {
              nodeKey: sn.key || sn.id || `subagent_${idx + 1}`,
              nodeId: sn.id || 'subagent',
              name: sn.title || sn.label || `Subagente Especialista #${idx + 1}`,
              role: sn.subtitle || 'Subagente Especialista de Dominio',
              model: allowedTextModels.includes(snCfg.aiModel || sn.aiModel)
                ? snCfg.aiModel || sn.aiModel
                : effectiveAiModel,
              instruction:
                String(snCfg.customInstruction || sn.prompt || '').trim() ||
                `Aplica tu especialidad (${sn.title || sn.id}) sobre el dictamen preliminar y consolida un informe ejecutivo enriquecido.`,
            };
          }),
        ];

        for (const rev of sequentialReviewers) {
          const revStartMs = Date.now();
          liveTracker.setActiveStage(rev.nodeKey, `Ejecutando ${rev.name}...`);
          liveTracker.upsertStep({
            nodeKey: rev.nodeKey,
            nodeId: rev.nodeId,
            title: rev.name,
            category: 'agent',
            status: 'running',
            outputPreview: `Auditoría multi-agente en curso (${rev.model})...`,
          });
          await liveTracker.flush();

          const passPrompt =
            `[ORQUESTACIÓN MULTI-AGENTE WAPPY SG-SST — EMPRESA: "${automationCompany?.companyName || 'Somos SST'}"]\n` +
            `Actúas como **${rev.name}** (${rev.role}).\n\n` +
            `[BORRADOR / DICTAMEN DEL AGENTE PREVIO EN LA CADENA]:\n"""\n${resultText.slice(0, 18000)}\n"""\n\n` +
            `[TU MISIÓN E INSTRUCCIÓN ESPECIALIZADA]:\n${rev.instruction}\n\n` +
            `Entrega el informe ejecutivo consolidado final en Markdown (conservando todos los datos verificados, tablas, hallazgos críticos y complementando con tu dictamen experto sin perder trazabilidad).${postAgentIfContractDirective}`;
          const enriched = await withTimeout(
            callSgsstGemini({
              userId: automation.user.toString(),
              modelName: rev.model,
              prompt: passPrompt,
              timeoutMs: 45000,
            }),
            55000,
            `callSgsstGemini(${rev.name})`,
          );
          if (enriched && String(enriched).trim().length > 60) {
            resultText = String(enriched).trim();
            if (cleanRunEvidenceFiles.length > 0) {
              resultText = stripAgentInlineEvidenceNoise(resultText, cleanRunEvidenceFiles);
            }
            multiAgentPassesExecuted += 1;
          }
          liveTracker.upsertStep({
            nodeKey: rev.nodeKey,
            nodeId: rev.nodeId,
            title: rev.name,
            category: 'agent',
            status: 'done',
            durationMs: Math.max(80, Date.now() - revStartMs),
            inputCount: 1,
            outputCount: 1,
            outputPreview: resultText.slice(0, 480),
          });
        }
      } catch (maErr) {
        console.warn('[AutomationScheduler] Aviso en pase secuencial Multi-Agente:', maErr?.message || maErr);
      }
    }

    // 9.7. Evaluación Causal de Compuerta Condicional (`pre_agent` ya verificado o `post_agent` inmune a negaciones)
    let ifConditionPassed = true;
    let activeBranch = 'direct';
    let hasCriticalSignalInResult = false;
    let ifEvaluationReason = 'Flujo directo sin compuerta condicional.';

    if (!includeIfNodeFlag) {
      activeBranch = 'direct';
      ifConditionPassed = true;
      const semanticSignal = evaluatePostAgentSemanticIf({
        resultText,
        ifCfg,
        watchesDriveNewFiles,
      });
      hasCriticalSignalInResult =
        semanticSignal.passed ||
        (Array.isArray(structuredSourceRes?.freshCriticalRecords) &&
          structuredSourceRes.freshCriticalRecords.length > 0) ||
        runScraperBreachCount > 0;
    } else if (isPreAgentIf) {
      // Si llegamos aquí con isPreAgentIf === true es porque preIfRes.passed === true (Rama SÍ)
      ifConditionPassed = true;
      activeBranch = 'yes';
      hasCriticalSignalInResult = true;
      ifEvaluationReason =
        preIfRes?.reason || 'Condición determinista pre_agent cumplida -> Rama SÍ activa.';
    } else {
      const postIfRes = evaluatePostAgentSemanticIf({
        resultText,
        ifCfg,
        watchesDriveNewFiles,
      });
      ifConditionPassed = postIfRes.passed;
      activeBranch = ifConditionPassed ? 'yes' : 'no';
      hasCriticalSignalInResult = ifConditionPassed;
      ifEvaluationReason = postIfRes.reason;
      liveTracker.upsertStep({
        nodeKey: 'if_router',
        nodeId: 'if_node_router',
        title: 'Condición Si/No (Post-IA)',
        category: 'if',
        status: 'done',
        branchTaken: activeBranch,
        durationMs: 35,
        inputCount: 1,
        outputCount: 1,
        outputPreview: ifEvaluationReason,
        outputItems: [
          {
            Compuerta: ifConditionLabelStr || '¿Veredicto IA = SÍ?',
            RamaTomada: activeBranch === 'yes' ? 'Rama SÍ' : 'Rama NO',
            Dictamen: ifEvaluationReason,
          },
        ],
      });
    }

    // 9.8. Puente Universal de Informes Oficiales HTML (`req._generatedAppReports`) para Hitos conectados en `Herramienta +` (`agent_tool` / `target_write_report`) SOLO cuando pidan informe oficial y SOLO en Rama SÍ / Flujo Directo (JAMÁS en Rama NO)
    const workflowHitosList = Array.isArray(automation.workflowNodes?.hitos)
      ? automation.workflowNodes.hitos.filter(Boolean)
      : [];
    if ((activeBranch === 'yes' || activeBranch === 'direct') && workflowHitosList.length > 0) {
      const pipeline = getHitoReportPipeline();
      if (pipeline) {
        for (const rawHitoId of workflowHitosList) {
          const hitoNodeId = sstAppSourceAliasMap[rawHitoId] || rawHitoId;
          const cfg =
            postNodeConfigs[`tool_hitos_${rawHitoId}`] ||
            postNodeConfigs[`sub_tool_${rawHitoId}`] ||
            postNodeConfigs[`hito_${rawHitoId}`] ||
            postNodeConfigs[rawHitoId] ||
            postNodeConfigs[`tool_hitos_${hitoNodeId}`] ||
            postNodeConfigs[`sub_tool_${hitoNodeId}`] ||
            postNodeConfigs[`hito_${hitoNodeId}`] ||
            postNodeConfigs[hitoNodeId] ||
            {};
          const hitoRole = resolveWorkflowHitoRole(postNodeConfigs, rawHitoId);
          const shouldGenerateOfficialReport =
            isAgentToolHitoRole(hitoRole) &&
            (cfg.generateAppReport === true ||
              cfg.appActionMode === 'generate_report' ||
              cfg.appActionMode === 'write_and_report');

          if (!shouldGenerateOfficialReport && cfg.includeLatestReport !== true) {
            continue;
          }

          const alreadyCollected =
            Array.isArray(req._generatedAppReports) &&
            req._generatedAppReports.some(
              (r) =>
                r &&
                (r.hitoNodeId === hitoNodeId ||
                  r.hitoNodeId === rawHitoId ||
                  r.appId === hitoNodeId),
            );
          if (alreadyCollected) continue;

          try {
            if (shouldGenerateOfficialReport) {
              if (typeof pipeline.generateOrExtractOfficialAppReport === 'function') {
                await withTimeout(
                  pipeline.generateOrExtractOfficialAppReport({
                    userId: automation.user.toString(),
                    companyId: targetCompanyIdStr,
                    hitoNodeId,
                    forceRegenerate: Boolean(cfg.forceRegenerateReport),
                    generateIfMissing: true,
                    aiModel: effectiveAiModel,
                    customInstructions: String(cfg.customInstruction || '').trim(),
                    req,
                  }),
                  60000,
                  `generateOrExtractOfficialAppReport(${hitoNodeId})`,
                );
              }
            } else if (cfg.includeLatestReport === true) {
              if (typeof pipeline.extractLatestOfficialAppReport === 'function') {
                const extracted = await withTimeout(
                  pipeline.extractLatestOfficialAppReport({
                    userId: automation.user.toString(),
                    companyId: targetCompanyIdStr,
                    hitoNodeId,
                  }),
                  25000,
                  `extractLatestOfficialAppReport(${hitoNodeId})`,
                );
                if (extracted?.found && extracted?.reportHtml) {
                  req._generatedAppReports.push({
                    appId: extracted.appId || hitoNodeId,
                    hitoNodeId: extracted.hitoNodeId || hitoNodeId,
                    reportTitle: extracted.reportTitle || 'Informe Oficial del Aplicativo SG-SST',
                    reportHtml: extracted.reportHtml,
                    reportConversationId: extracted.reportConversationId || null,
                    fileNameSlug: extracted.fileNameSlug || 'Informe_Oficial_SGSST',
                  });
                }
              }
            }
          } catch (hitoRepErr) {
            console.warn(
              `[AutomationScheduler] Aviso procesando informe oficial Hito (${hitoNodeId}):`,
              hitoRepErr?.message || hitoRepErr,
            );
          }
        }
      }
    }

    const configuredOutputs = Array.isArray(automation.workflowNodes?.outputs)
      ? automation.workflowNodes.outputs
      : ['email_report'];

    const allGeneratedAppReports = Array.isArray(req._generatedAppReports)
      ? req._generatedAppReports.filter(Boolean)
      : [];
    const newAppReports = allGeneratedAppReports.filter((r) => r && !r.alreadyProcessed);
    if ((activeBranch === 'yes' || activeBranch === 'direct') && newAppReports.length > 0) {
      hasCriticalSignalInResult = true;
    }

    const isOutputAllowedByIfBranch = (outNodeId) => {
      if (!includeIfNodeFlag) return true;
      const outIdx = Math.max(0, configuredOutputs.indexOf(outNodeId));
      const branch = resolveOutputBranchForIfRouter(
        outNodeId,
        outIdx,
        configuredOutputs,
        postNodeConfigs,
        postEdges,
      );
      return branch === 'no' ? !ifConditionPassed : ifConditionPassed;
    };

    const outputsToExecute = configuredOutputs.filter((outId) => isOutputAllowedByIfBranch(outId));

    const keysToPersist =
      activeBranch === 'yes' || activeBranch === 'direct'
        ? Array.from(
            new Set(
              [
                ...(Array.isArray(structuredSourceRes?.candidateProcessedKeys)
                  ? structuredSourceRes.candidateProcessedKeys
                  : []),
                ...(Array.isArray(preRes?.externalCandidateKeys)
                  ? preRes.externalCandidateKeys
                  : []),
                ...runScraperCandidateKeys,
                ...(gmailMessageId ? [`gmail:${gmailMessageId}`] : []),
              ].filter(Boolean),
            ),
          )
        : [];

    const totalDedupSkippedPost =
      (Array.isArray(structuredSourceRes?.deduplicatedSkippedRecords)
        ? structuredSourceRes.deduplicatedSkippedRecords.length
        : 0) +
      Number(preRes?.traceMeta?.deduplicatedDriveFilesCount || 0) +
      Number(preRes?.traceMeta?.deduplicatedGmailMessagesCount || 0);

    const humanApprovalNode = postLogicNodes.find(
      (ln) =>
        ln &&
        (ln.logicType === 'human_approval' ||
          ln.id === 'logic_human_approval' ||
          String(ln.key || '').includes('human_approval')),
    );
    const humanApprovalCfg = humanApprovalNode
      ? postNodeConfigs[humanApprovalNode.key] ||
        postNodeConfigs.logic_human_approval ||
        postNodeConfigs.human_approval ||
        {}
      : null;

    const shouldGateForHumanApproval =
      Boolean(humanApprovalNode) &&
      (activeBranch === 'yes' || !includeIfNodeFlag) &&
      outputsToExecute.length > 0;

    const executionTraceSummary = {
      triggerSource,
      ifPlacement: includeIfNodeFlag ? (isPreAgentIf ? 'pre_agent' : 'post_agent') : 'none',
      activeBranch,
      ifConditionPassed,
      ifReason: ifEvaluationReason,
      hasCriticalSignal: hasCriticalSignalInResult,
      llmSkippedByPreIf: false,
      totalAuditedRecords: Array.isArray(structuredSourceRes?.allRecords)
        ? structuredSourceRes.allRecords.length
        : 0,
      freshCriticalCount: Array.isArray(structuredSourceRes?.freshCriticalRecords)
        ? structuredSourceRes.freshCriticalRecords.length
        : 0,
      deduplicatedCount: totalDedupSkippedPost,
      multiAgentPassesExecuted,
      officialReportsAttached: newAppReports.length,
      dynamicToolsInjected: dynamicWorkflowTools,
      ...preExtractionTraceMeta,
    };

    // Marcar salidas de rama no seleccionada como omitidas (`skipped`)
    const skippedBranchOutputs = configuredOutputs.filter((outId) => !outputsToExecute.includes(outId));
    if (skippedBranchOutputs.length > 0) {
      liveTracker.markSkippedKeys(skippedBranchOutputs.map((o) => `out_${o}`));
      for (const skOutId of skippedBranchOutputs) {
        liveTracker.upsertStep({
          nodeKey: `out_${skOutId}`,
          nodeId: skOutId,
          title: formatHumanWorkflowNodeTitle(skOutId),
          category: 'output',
          status: 'skipped',
          branchTaken: activeBranch,
          durationMs: 0,
          outputPreview: `Omitida por Compuerta Condicional (Rama ${String(activeBranch).toUpperCase()} activa).`,
        });
      }
    }

    // 10. Compuerta Real de Aprobación Humana (`logic_human_approval`) vs Ejecución Directa de Salidas
    const cronNextRunPatch =
      isManual && automation.status === 'active'
        ? {
            nextRunAt: hasCronTrigger(automation)
              ? calculateNextRun(automation.scheduleType, automation.scheduleConfig)
              : null,
          }
        : {};

    if (shouldGateForHumanApproval) {
      const approverEmail = String(
        humanApprovalCfg?.approverEmail ||
          reqUser?.email ||
          (Array.isArray(automation.emails) ? automation.emails[0] : '') ||
          '',
      ).trim();
      const approverRole = String(
        humanApprovalCfg?.approverRole || 'Responsable SG-SST / Gerencia',
      ).trim();
      const requestedAt = new Date().toISOString();
      const expiresAt = new Date(Date.now() + 7 * 24 * 3600000).toISOString();

      const gateNodeKey = humanApprovalNode?.key || 'logic_human_approval';
      liveTracker.setActiveStage(
        gateNodeKey,
        `Esperando Visto Bueno Humano (${approverEmail || approverRole})...`,
      );
      liveTracker.upsertStep({
        nodeKey: gateNodeKey,
        nodeId: 'logic_human_approval',
        title: humanApprovalNode?.title || 'Visto Bueno Humano',
        category: 'logic',
        status: 'running',
        outputPreview: `Salidas retenidas (${outputsToExecute.join(', ')}) esperando aprobación de ${approverEmail || approverRole}.`,
      });
      const gateSnap = liveTracker.getSnapshot();

      const pendingApprovalPayload = {
        outputsToExecute,
        responseText: resultText,
        generatedAppReports: newAppReports.map((r) => ({
          appId: r.appId || null,
          hitoNodeId: r.hitoNodeId || null,
          reportTitle: r.reportTitle || 'Informe Oficial del Aplicativo SG-SST',
          reportHtml: r.reportHtml || '',
          reportConversationId: r.reportConversationId || null,
          fileNameSlug: r.fileNameSlug || 'Informe_Oficial_SGSST',
          formData: r.formData || null,
          caseId: r.caseId || null,
        })),
        capturedEvidences: runCapturedEvidences,
        generatedConvoId,
        hasCriticalSignal: hasCriticalSignalInResult,
        activeBranch,
        nodeConfigs: postNodeConfigs,
        approverRole,
        approverEmail,
        requestedAt,
        expiresAt,
        processed: false,
      };

      console.log(
        `[AutomationScheduler] STEP 6 (HUMAN APPROVAL GATE): Deteniendo ${outputsToExecute.length} salida(s) de "${automation.name}" hasta Visto Bueno de ${approverEmail || approverRole}...`,
      );

      await Promise.all([
        AutomationLog.updateOne(
          { _id: log._id },
          {
            $set: {
              status: 'awaiting_approval',
              result: resultText,
              conversationId: generatedConvoId,
              evidenceFiles: cleanRunEvidenceFiles,
              evidences: cleanRunEvidenceFiles,
              processedEntityKeys: keysToPersist,
              dedupWindowUsed: dedupLedger.dedupWindow || '',
              pendingApprovalPayload,
              executionTrace: executionTraceSummary,
              ...gateSnap,
            },
          },
        ),
        Automation.updateOne(
          { _id: automation._id },
          {
            $set: {
              lastRunAt: new Date(),
              lastRunStatus: 'awaiting_approval',
              lastRunLogId: log._id,
              lastRunResult: `[Pendiente de Visto Bueno Humano] ${resultText.substring(0, 440)}`,
              conversationId: generatedConvoId,
              ...cronNextRunPatch,
            },
          },
        ),
      ]);

      setImmediate(async () => {
        if (generatedConvoId) {
          try {
            const ConvoModel = mongoose.models.Conversation;
            if (ConvoModel) {
              await withTimeout(
                ConvoModel.updateOne(
                  { conversationId: generatedConvoId },
                  { $addToSet: { tags: { $each: ['sgsst-automation', `company-${automation.companyId}`] } } },
                ),
                10000,
                'ConvoModel.updateOne(approval)',
              );
            }
          } catch (_) {}
        }

        const compLabel = automationCompany?.companyName || 'Somos SST';
        const shortSummary = resultText.replace(/[#*_`]/g, '').substring(0, 340);
        try {
          await withTimeout(
            Notification.create({
              user: automation.user,
              companyId: automation.companyId || null,
              title: `🛑 Visto Bueno Requerido: ${automation.name} (${compLabel})`,
              body: `Salidas retenidas (${outputsToExecute.join(', ')})${approverEmail ? ` para aprobación de ${approverEmail}` : ''}. Aprueba o rechaza en /tareas (pestaña Historial). Resumen: ${shortSummary}`,
              type: 'system_update',
              read: false,
            }),
            10000,
            'Notification.create(approval)',
          );
        } catch (_) {}

        if (approverEmail && approverEmail.includes('@')) {
          try {
            const bogotaDateStr = new Intl.DateTimeFormat('es-CO', {
              timeZone: 'America/Bogota',
              dateStyle: 'full',
              timeStyle: 'medium',
            }).format(new Date());
            const approvalBannerHtml =
              `<div style="border:2px solid #f59e0b;background:rgba(245,158,11,0.12);border-radius:12px;padding:16px;margin-bottom:18px;">` +
              `<h3 style="color:#d97706;margin:0 0 8px 0;">🛑 Solicitud de Visto Bueno Humano (${approverRole})</h3>` +
              `<p style="margin:0 0 10px 0;font-size:14px;">Las salidas finales de este flujo (<strong>${outputsToExecute.join(', ')}</strong>) están <strong>detenidas en compuerta</strong> esperando tu autorización.</p>` +
              `<a href="https://wappy.club/tareas" target="_blank" rel="noopener noreferrer" style="display:inline-block;background:#f59e0b;color:#0f172a;font-weight:800;padding:10px 18px;border-radius:8px;text-decoration:none;">Revisar y Aprobar / Rechazar en WAPPY (/tareas &rarr; Historial)</a>` +
              `</div>` +
              formatMarkdownToEmailHtml(resultText);

            await withTimeout(
              sendEmail({
                email: approverEmail,
                from: process.env.EMAIL_NOTIFICATIONS_FROM || 'notificaciones@wappy.club',
                subject: `🛑 Visto Bueno Requerido: ${automation.name} (${compLabel})`,
                payload: {
                  taskName: `[Aprobación Pendiente] ${automation.name}`,
                  agentName: automation.agentName || agent?.name || 'Agente Experto',
                  companyName: compLabel,
                  executionDate: bogotaDateStr,
                  prompt: automation.prompt,
                  result: approvalBannerHtml,
                  chatUrl: 'https://wappy.club/tareas',
                  year: new Date().getFullYear(),
                },
                template: 'agentAutomationReport.handlebars',
                throwError: false,
              }),
              25000,
              'sendEmail(approval)',
            );
          } catch (apMailErr) {
            console.warn('[AutomationScheduler] Aviso correo Visto Bueno:', apMailErr?.message);
          }
        }
      });
    } else {
      if (generatedConvoId) {
        try {
          const ConvoModel = mongoose.models.Conversation;
          if (ConvoModel) {
            await withTimeout(
              ConvoModel.updateOne(
                { conversationId: generatedConvoId },
                { $addToSet: { tags: { $each: ['sgsst-automation', `company-${automation.companyId}`] } } },
              ),
              10000,
              'ConvoModel.updateOne',
            );
          }
        } catch (_) {}
      }

      if (outputsToExecute.length > 0) {
        liveTracker.setActiveStage(
          `out_${outputsToExecute[0]}`,
          `Ejecutando salidas (${outputsToExecute.map(formatHumanWorkflowNodeTitle).join(', ')})...`,
        );
        for (const outId of outputsToExecute) {
          liveTracker.upsertStep({
            nodeKey: `out_${outId}`,
            nodeId: outId,
            title: formatHumanWorkflowNodeTitle(outId),
            category: 'output',
            status: 'running',
            branchTaken: activeBranch,
            outputPreview: 'Enviando o registrando salida del flujo...',
          });
        }
        await liveTracker.flush();
      }

      let outRes = { executedOutputs: [], workspaceLinks: [], errors: [] };
      if (outputsToExecute.length > 0) {
        try {
          outRes = await withTimeout(
            executeDownstreamOutputs({
              automation,
              user: reqUser,
              companyId: targetCompanyIdStr,
              companyInfo: automationCompany,
              outputsToExecute,
              responseText: resultText,
              generatedAppReports: newAppReports,
              activeBranch,
              nodeConfigs: postNodeConfigs,
              capturedEvidences: runCapturedEvidences,
              generatedConvoId,
              hasCriticalSignal: hasCriticalSignalInResult,
              logId: log._id,
            }),
            95000,
            'executeDownstreamOutputs',
          );
        } catch (postErr) {
          console.warn(
            '[AutomationScheduler] Non-blocking executeDownstreamOutputs error:',
            postErr?.message || postErr,
          );
          outRes.errors = [...(outRes.errors || []), String(postErr?.message || postErr)];
        }
      }

      for (const outId of outputsToExecute) {
        const outWarn = (outRes?.errors || []).find((e) => String(e).includes(outId));
        const wsLink = (outRes?.workspaceLinks || []).find((l) => l.type === outId);
        const didRun = Array.isArray(outRes?.executedOutputs) && outRes.executedOutputs.includes(outId);
        liveTracker.upsertStep({
          nodeKey: `out_${outId}`,
          nodeId: outId,
          title: formatHumanWorkflowNodeTitle(outId),
          category: 'output',
          status: outWarn && !didRun ? 'error' : 'done',
          branchTaken: activeBranch,
          durationMs: 320,
          inputCount: 1,
          outputCount: didRun ? 1 : 0,
          ...(outWarn ? { error: outWarn } : {}),
          outputPreview: wsLink
            ? `${wsLink.label}: ${wsLink.url}`
            : outWarn
              ? `Aviso en salida: ${outWarn}`
              : didRun
                ? `Salida ejecutada correctamente (${formatHumanWorkflowNodeTitle(outId)}).`
                : `Canal ${formatHumanWorkflowNodeTitle(outId)} procesado.`,
          outputItems: [
            {
              Canal: formatHumanWorkflowNodeTitle(outId),
              Rama: String(activeBranch || 'direct').toUpperCase(),
              Estado: outWarn && !didRun ? `Advertencia (${outWarn})` : didRun ? 'Ejecutado' : 'Procesado',
              ...(wsLink ? { Enlace: wsLink.url } : {}),
            },
          ],
        });
      }

      if (
        Array.isArray(outRes?.workspaceLinks) &&
        outRes.workspaceLinks.length > 0 &&
        !resultText.includes(outRes.workspaceLinks[0].url)
      ) {
        const linksMd =
          '\n\n---\n### 🔗 Documentos Generados en Google Workspace\n' +
          outRes.workspaceLinks
            .map((l) => `- **[${l.type.toUpperCase()}]** [${l.title}](${l.url})`)
            .join('\n');
        resultText += linksMd;
      }

      executionTraceSummary.executedOutputs = outRes?.executedOutputs || [];
      executionTraceSummary.workspaceLinks = outRes?.workspaceLinks || [];
      if (Array.isArray(outRes?.errors) && outRes.errors.length > 0) {
        executionTraceSummary.outputWarnings = outRes.errors;
      }

      liveTracker.setActiveStage(null, 'Flujo completado exitosamente');
      const finalSnap = liveTracker.getSnapshot();

      console.log(
        `[AutomationScheduler] STEP 6: Updating AutomationLog ${log._id} (${cleanRunEvidenceFiles.length} evidenceFiles, branch=${activeBranch}) and Automation ${automation._id} to SUCCESS...`,
      );
      await Promise.all([
        AutomationLog.updateOne(
          { _id: log._id },
          {
            $set: {
              status: 'success',
              result: resultText,
              conversationId: generatedConvoId,
              evidenceFiles: cleanRunEvidenceFiles,
              evidences: cleanRunEvidenceFiles,
              processedEntityKeys: keysToPersist,
              dedupWindowUsed: dedupLedger.dedupWindow || '',
              executionTrace: executionTraceSummary,
              ...finalSnap,
            },
          },
        ),
        Automation.updateOne(
          { _id: automation._id },
          {
            $set: {
              lastRunAt: new Date(),
              lastRunStatus: 'success',
              lastRunLogId: log._id,
              lastRunResult: resultText.substring(0, 500),
              conversationId: generatedConvoId,
              ...cronNextRunPatch,
            },
          },
        ),
      ]);

      if (activeBranch === 'yes' || !includeIfNodeFlag) {
        dispatchAgentTriggeredAutomations({
          companyId: targetCompanyIdStr,
          sourceAgentId: automation.agentId,
          sourceAgentName: automation.agentName,
          sourceAutomationId: automation._id,
          summaryText: resultText,
          agentChainDepth: Number(runOpts?.agentChainDepth || 0),
        });
      }
      console.log(`[AutomationScheduler] ALL STEPS COMPLETED! Successfully finished execution for "${automation.name}"`);
    }

  } catch (err) {
    console.error(`[AutomationScheduler] Error executing automation "${automation.name}":`, err);

    prelimAbortController.abort();

    const isStoppedManually =
      err?.message?.includes('Detenida manualmente') ||
      err?.name === 'AbortError' ||
      err?.name === 'CancelledError';

    liveTracker.setActiveStage(
      null,
      isStoppedManually ? 'Detenida manualmente por el usuario' : 'Error en ejecución',
    );
    const errSnap = liveTracker.getSnapshot();
    const patchedLiveSteps = (errSnap.liveSteps || []).map((st) =>
      st && st.status === 'running'
        ? {
            ...st,
            status: 'error',
            error: isStoppedManually
              ? 'Detenida manualmente por el usuario.'
              : err?.message || 'Error desconocido',
          }
        : st,
    );

    // Update Log to failed
    await AutomationLog.updateOne(
      { _id: log._id },
      {
        $set: {
          status: 'failed',
          ...errSnap,
          liveSteps: patchedLiveSteps,
          error: isStoppedManually ? 'Detenida manualmente por el usuario.' : (err.message || 'Error desconocido'),
        },
      },
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
      lastRunLogId: log._id,
      lastRunResult: isStoppedManually
        ? 'Detenida manualmente por el usuario en tiempo real.'
        : isExhaustionOrCritical
          ? `Pausada automáticamente: se rotaron todas las claves API y modelos de respaldo sin éxito (${err.message}). Revise sus claves o prompt y presione Reactivar.`
          : `Error: ${err.message}`,
    };

    if (isExhaustionOrCritical) {
      updateDoc.status = 'paused_error';
      updateDoc.nextRunAt = null;
      console.warn(`[AutomationScheduler] Automation "${automation.name}" paused immediately due to exhaustion/critical failure.`);
    } else if (isManual && automation.status === 'active') {
      updateDoc.nextRunAt = hasCronTrigger(automation)
        ? calculateNextRun(automation.scheduleType, automation.scheduleConfig)
        : null;
    }

    await Automation.updateOne({ _id: automation._id }, { $set: updateDoc });
  } finally {
    if (heartbeatTimer) clearInterval(heartbeatTimer);
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
          activeStepNodeKey: null,
          currentStageLabel: 'Detenida manualmente',
          heartbeatAt: new Date(),
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

/**
 * Normaliza equivalencias de portales QR públicos para disparo reactivo `trigger_qr_worker`.
 */
function matchesQrPortalFilter(configuredValue, incomingPortalType) {
  const cfgNorm = String(configuredValue || '')
    .trim()
    .toLowerCase();
  if (!cfgNorm || cfgNorm === 'all' || cfgNorm === 'todos' || cfgNorm === '*') {
    return true;
  }
  const incNorm = String(incomingPortalType || '')
    .trim()
    .toLowerCase();
  if (!incNorm) return false;
  if (cfgNorm === incNorm) return true;

  const aliasGroups = [
    ['actos_condiciones', 'reporte_acto', 'actos', 'condiciones_inseguras', 'inspecciones'],
    ['participacion_ipevr', 'participacion_ipevar', 'ipevr', 'ipevar', 'peligros_qr'],
    ['permiso_alturas', 'alturas', 'trabajo_alturas'],
    ['solicitud_epp', 'epp', 'dotacion_epp'],
    ['sociodemografico_salud', 'sociodemografico', 'perfil_salud', 'autoreporte_salud', 'perfil_update'],
    ['testimonio_atel', 'investigacion_atel', 'atel', 'accidente'],
    ['alta_direccion', 'aporte_alta_direccion', 'gerencia'],
    ['inspeccion_pesv', 'pesv', 'preoperacional_pesv'],
    ['copasst_inspeccion', 'copasst'],
    ['comite_convivencia', 'convivencia', 'cocola'],
    ['brigada_emergencias', 'brigadista', 'emergencias'],
    ['estudio_puesto', 'ept', 'ergonomia'],
    ['clima_psicosocial', 'mood', 'psicosocial'],
  ];

  for (const group of aliasGroups) {
    if (group.includes(cfgNorm) && group.includes(incNorm)) {
      return true;
    }
  }
  return incNorm.includes(cfgNorm) || cfgNorm.includes(incNorm);
}

/**
 * Determina si una entrega QR cumple `qrSeverityFilter` (`'all'` vs `'critical_only'`).
 */
function matchesQrSeverityFilter(qrSeverityFilter, submissionData = {}) {
  if (!qrSeverityFilter || qrSeverityFilter === 'all') return true;
  if (qrSeverityFilter !== 'critical_only') return true;
  const serialized = normalizeTriggerMatchText(JSON.stringify(submissionData || {}));
  return /\b(alto|alta|critico|critica|criticos|criticas|grave|severo|severa|fatal|inmediato|inmediata|urgente|rojo|accidente|rechazado|bloqueado|no apto|suspender|peligro alto|criticity high)\b/.test(
    serialized,
  );
}

/**
 * Construye término válido de búsqueda Gmail (`subject:(A OR B)` / `from:(x OR y)`) desde filtro separado por comas/punto y coma.
 */
function buildGmailQueryTerm(fieldName, rawFilter = '') {
  const parts = String(rawFilter || '')
    .split(/[,;|]+/)
    .map((s) => s.trim().replace(/"/g, ''))
    .filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) {
    const term = parts[0];
    return term.includes(' ') ? `${fieldName}:"${term}"` : `${fieldName}:${term}`;
  }
  const joined = parts.map((p) => (p.includes(' ') ? `"${p}"` : p)).join(' OR ');
  return `${fieldName}:(${joined})`;
}

/**
 * Dispara en segundo plano (`setImmediate`) todas las automatizaciones activas de la empresa
 * que tengan `'trigger_qr_worker'` en `workflowNodes.triggers` y coincidan con `portalType` y severidad.
 * Nunca bloquea la petición pública del trabajador.
 */
function dispatchQrWorkerAutomations({ companyId, portalType, submissionData = {} } = {}) {
  if (!companyId) return;
  const companyIdStr = String(companyId).trim();
  if (!companyIdStr) return;

  setImmediate(async () => {
    try {
      const candidates = await Automation.find({
        isSystemPreset: { $ne: true },
        status: 'active',
        companyId: companyIdStr,
        'workflowNodes.triggers': 'trigger_qr_worker',
      })
        .select(AUTOMATION_RUN_FIELDS)
        .lean();

      if (!Array.isArray(candidates) || candidates.length === 0) return;

      for (const auto of candidates) {
        const trigCfg = extractAutomationTriggerConfigs(auto);
        if (!matchesQrPortalFilter(trigCfg.qrPortalTarget, portalType)) {
          continue;
        }
        if (!matchesQrSeverityFilter(trigCfg.qrSeverityFilter, submissionData)) {
          continue;
        }

        console.log(
          `[AutomationScheduler] Disparo reactivo QR Worker (${portalType}) -> "${auto.name}" (${auto._id})`,
        );
        runAutomation(auto, {
          triggerSource: 'qr_worker',
          eventPayload: {
            portalType,
            receivedAt: new Date().toISOString(),
            ...submissionData,
          },
        }).catch((qrErr) => {
          console.warn(
            `[AutomationScheduler] Error en automatización QR "${auto.name}":`,
            qrErr?.message || qrErr,
          );
        });
      }
    } catch (err) {
      console.warn('[AutomationScheduler] Aviso en dispatchQrWorkerAutomations:', err?.message || err);
    }
  });
}

let lastEmailTriggerSweepAt = 0;

function extractGmailAttachmentNames(payload) {
  const names = [];
  const walk = (part) => {
    if (!part || typeof part !== 'object') return;
    if (part.filename && String(part.filename).trim()) {
      names.push(String(part.filename).trim());
    }
    if (Array.isArray(part.parts)) {
      for (const child of part.parts) walk(child);
    }
  };
  walk(payload);
  return names;
}

/**
 * Vigilante de Bandeja Gmail (`trigger_email`): consulta mensajes recientes no leídos (`is:unread newer_than:2d`)
 * filtrando por asunto, remitente (`emailSenderFilter`) y adjuntos (`onlyWithAttachments`),
 * deduplicando contra `AutomationLog.gmailMessageId` para no disparar dos veces el mismo correo.
 */
async function checkEmailTriggeredAutomations(maxToDispatch = 2) {
  if (maxToDispatch <= 0) return;
  const nowMs = Date.now();
  if (nowMs - lastEmailTriggerSweepAt < 50000) return; // Máx 1 barrido cada ~50s
  lastEmailTriggerSweepAt = nowMs;

  try {
    const emailAutomations = await Automation.find({
      isSystemPreset: { $ne: true },
      companyId: { $ne: 'SYSTEM_PRESET' },
      status: 'active',
      lastRunStatus: { $ne: 'running' },
      'workflowNodes.triggers': 'trigger_email',
    })
      .select(AUTOMATION_RUN_FIELDS)
      .limit(12)
      .lean();

    if (!Array.isArray(emailAutomations) || emailAutomations.length === 0) return;

    let dispatched = 0;
    for (const auto of emailAutomations) {
      if (dispatched >= maxToDispatch) break;
      if (runningAutomations.has(String(auto._id))) continue;

      const userIdStr = String(auto.user || '');
      const companyIdStr = auto.companyId ? String(auto.companyId) : null;
      const oauthCtx = await getCompanyGoogleOAuthClient(userIdStr, companyIdStr);
      if (!oauthCtx) continue;

      const scopesStr = String(oauthCtx.tokenDoc?.scopes || '').toLowerCase();
      if (scopesStr && !scopesStr.includes('gmail') && !scopesStr.includes('mail.google.com')) {
        continue;
      }

      const trigCfg = extractAutomationTriggerConfigs(auto);
      const queryTokens = ['is:unread', 'newer_than:2d'];
      const subjectClause = buildGmailQueryTerm('subject', trigCfg.emailSubjectFilter);
      const fromClause = buildGmailQueryTerm('from', trigCfg.emailSenderFilter);
      if (subjectClause) queryTokens.push(subjectClause);
      if (fromClause) queryTokens.push(fromClause);
      if (trigCfg.onlyWithAttachments) queryTokens.push('has:attachment');
      const gmailQuery = queryTokens.join(' ');

      try {
        const gmail = oauthCtx.google.gmail({ version: 'v1', auth: oauthCtx.oauth2Client });
        const listRes = await gmail.users.messages.list({
          userId: 'me',
          q: gmailQuery,
          maxResults: 5,
        });
        const msgs = Array.isArray(listRes?.data?.messages) ? listRes.data.messages : [];
        if (msgs.length === 0) continue;

        for (const m of msgs) {
          if (!m?.id) continue;
          const alreadyTriggered = await AutomationLog.exists({
            automation: auto._id,
            $or: [{ gmailMessageId: m.id }, { 'eventMetadata.gmailMessageId': m.id }],
          });
          if (alreadyTriggered) continue;

          const detail = await gmail.users.messages.get({
            userId: 'me',
            id: m.id,
            format: trigCfg.onlyWithAttachments ? 'full' : 'metadata',
            metadataHeaders: ['From', 'Subject', 'Date'],
          });
          const attachmentNames = extractGmailAttachmentNames(detail?.data?.payload);
          if (trigCfg.onlyWithAttachments && attachmentNames.length === 0) {
            continue;
          }

          const headers = Array.isArray(detail?.data?.payload?.headers)
            ? detail.data.payload.headers
            : [];
          const getHdr = (hName) =>
            headers.find((h) => String(h?.name || '').toLowerCase() === hName.toLowerCase())?.value || '';

          const emailMeta = {
            gmailMessageId: m.id,
            threadId: detail?.data?.threadId || m.threadId || null,
            from: getHdr('From'),
            subject: getHdr('Subject'),
            date: getHdr('Date'),
            snippet: String(detail?.data?.snippet || '').trim(),
            attachments: attachmentNames,
            matchedFilter: trigCfg.emailSubjectFilter || trigCfg.emailSenderFilter || null,
          };

          console.log(
            `[AutomationScheduler] Disparo reactivo Gmail (${m.id}: "${emailMeta.subject}") -> "${auto.name}"`,
          );
          dispatched += 1;
          runAutomation(auto, {
            triggerSource: 'email',
            gmailMessageId: m.id,
            eventPayload: emailMeta,
          }).catch((emErr) => {
            console.warn(
              `[AutomationScheduler] Error en automatización Email "${auto.name}":`,
              emErr?.message || emErr,
            );
          });
          break; // 1 correo nuevo por ciclo para esta automatización
        }
      } catch (gErr) {
        // Token sin permiso Gmail o revocado — ignorar silenciosamente sin tumbar el scheduler
      }
    }
  } catch (err) {
    console.warn('[AutomationScheduler] Aviso en checkEmailTriggeredAutomations:', err?.message || err);
  }
}

/**
 * Encadenamiento reactivo por Delegación de Agente Especialista IA (`trigger_agent`).
 * Evita bucles infinitos acotando `agentChainDepth < 2` y excluyendo la automatización origen.
 */
function dispatchAgentTriggeredAutomations({
  companyId,
  sourceAgentId,
  sourceAgentName,
  sourceAutomationId,
  summaryText = '',
  agentChainDepth = 0,
} = {}) {
  if (!companyId || agentChainDepth >= 2) return;
  const companyIdStr = String(companyId).trim();
  const srcAutoStr = sourceAutomationId ? String(sourceAutomationId).trim() : '';

  setImmediate(async () => {
    try {
      const candidates = await Automation.find({
        isSystemPreset: { $ne: true },
        status: 'active',
        lastRunStatus: { $ne: 'running' },
        companyId: companyIdStr,
        'workflowNodes.triggers': 'trigger_agent',
      })
        .select(AUTOMATION_RUN_FIELDS)
        .limit(8)
        .lean();

      for (const target of candidates) {
        if (srcAutoStr && String(target._id) === srcAutoStr) continue;
        const trigCfg = extractAutomationTriggerConfigs(target);
        const expectedSrc = normalizeTriggerMatchText(trigCfg.sourceAgentId);
        if (expectedSrc) {
          const idMatch = normalizeTriggerMatchText(sourceAgentId) === expectedSrc;
          const nameMatch = normalizeTriggerMatchText(sourceAgentName) === expectedSrc;
          if (!idMatch && !nameMatch) continue;
        }

        console.log(
          `[AutomationScheduler] Encadenamiento trigger_agent (${sourceAgentName || sourceAgentId}) -> "${target.name}"`,
        );
        runAutomation(target, {
          triggerSource: 'agent_delegation',
          agentChainDepth: agentChainDepth + 1,
          eventPayload: {
            sourceAutomationId: srcAutoStr || null,
            sourceAgentId: sourceAgentId || null,
            sourceAgentName: sourceAgentName || null,
            summaryPreview: String(summaryText || '').slice(0, 1500),
            triggeredAt: new Date().toISOString(),
          },
        }).catch((chErr) => {
          console.warn(
            `[AutomationScheduler] Error en encadenamiento trigger_agent "${target.name}":`,
            chErr?.message || chErr,
          );
        });
      }
    } catch (err) {
      console.warn('[AutomationScheduler] Aviso en dispatchAgentTriggeredAutomations:', err?.message || err);
    }
  });
}

async function checkAndRunAutomations() {
  if (isCheckingAutomations) return;
  isCheckingAutomations = true;
  try {
    const now = new Date();

    // 1. Zombie / Crash Recovery: Reconciliar corridas huérfanas con latido perdido (>90s) o límite absoluto
    await reconcileOrphanedRunningRuns();

    // 2. Respect the ADAPTIVE concurrency cap: adjusts between MIN (2) and MAX (8) based on live chat load
    const adaptiveCap = getAdaptiveConcurrencyLimit();
    const availableSlots = adaptiveCap - runningAutomations.size;
    if (availableSlots <= 0) return;

    // 2.5. Vigilante de Bandeja Gmail (`trigger_email`)
    await checkEmailTriggeredAutomations(Math.min(2, availableSlots));

    const remainingSlots = adaptiveCap - runningAutomations.size;
    if (remainingSlots <= 0) return;

    // 3. Ejecutar por reloj horario SOLO las automatizaciones con disparador Cron (`hasCronTrigger(auto) === true`)
    const pendingCandidates = await Automation.find({
      isSystemPreset: { $ne: true },
      companyId: { $ne: 'SYSTEM_PRESET' },
      status: 'active',
      lastRunStatus: { $ne: 'running' },
      $and: [
        {
          $or: [
            { nextRunAt: { $lte: now } },
            { nextRunAt: null },
          ],
        },
        {
          $or: [
            { 'workflowNodes.triggers': { $exists: false } },
            { 'workflowNodes.triggers': { $size: 0 } },
            { 'workflowNodes.triggers': 'schedule_cron' },
          ],
        },
      ],
    })
      .select(AUTOMATION_RUN_FIELDS)
      .sort({ nextRunAt: 1 })
      .limit(remainingSlots)
      .lean();

    const pendingAutomations = pendingCandidates.filter((auto) => hasCronTrigger(auto));
    if (pendingAutomations.length === 0) return;

    console.log(`[AutomationScheduler] Found ${pendingAutomations.length} cron automations to execute (adaptive cap: ${adaptiveCap}, active: ${runningAutomations.size}).`);

    const toExecute = [];

    for (const automation of pendingAutomations) {
      if (!hasCronTrigger(automation)) {
        continue;
      }
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
          .then(() => runAutomation(item, { triggerSource: 'schedule_cron' }))
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
 * Detecta si un nodo del flujo corresponde a un Scraper / Verificador ACTIVO de Google Antigravity
 * (excluyendo explícitamente conectores En Construcción como pensiones_directo o salud_rethus).
 */
function isAntigravityScraperIdentifier(nodeKey, nodeId, customNodeObj = null) {
  if (isUnderConstructionNode(nodeKey, nodeId, customNodeObj)) {
    return false;
  }
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
    nodeCfg?.cedula,
    nodeCfg?.documento,
    nodeCfg?.customInstruction,
    nodeCfg?.inputContext,
    nodeCfg?.targetUrl,
    customNodeObj?.config?.cedula,
    customNodeObj?.config?.documento,
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
          fechaNacimiento: normalizeAnyDateYmd(
            item['Fecha de Nacimiento'] ||
              item.fechaNacimiento ||
              item.birthDate ||
              '',
          ),
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
                fechaNacimiento: normalizeAnyDateYmd(
                  w.fechaNacimiento ||
                    f['Fecha de Nacimiento'] ||
                    fullRec.fechaNacimiento ||
                    fullRec.birthDate ||
                    '',
                ),
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
          fechaNacimiento: normalizeAnyDateYmd(
            rec.fields?.['Fecha de Nacimiento'] || rec.fechaNacimiento || rec.birthDate || '',
          ),
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

  if (filterMode === 'critical_only' || filterMode === 'expiry_only') {
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
      fechaNacimiento: normalizeAnyDateYmd(
        matchedWorker?.fechaNacimiento || matchedWorker?.birthDate || '',
      ),
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
        fechaNacimiento: normalizeAnyDateYmd(w.fechaNacimiento || w.birthDate || ''),
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
    birthDate: r.fechaNacimiento || '',
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
function buildSandboxExecutiveSystemInstruction(agentDoc) {
  const agentName = String(agentDoc?.name || 'Consultor SG-SST').trim();
  const rawInstr = String(agentDoc?.instructions || '').trim();
  // Filtrar mandatos de chat interactivo / invocación de herramientas MCP (causan MALFORMED_FUNCTION_CALL e inflan tokens)
  const sanitizedLines = rawInstr
    .split('\n')
    .filter((line) => {
      const low = line.toLowerCase();
      if (
        /llamar a la herramienta|invoca de inmediato|herramienta\s+[`']?(canvas|matriz_ipevar|gestor_automatizaciones|somos_sst|google_drive|google_gmail|web_search|notebooklm)/i.test(
          low,
        ) ||
        /\bmcp_|wappy_renderizar_widget|preguntas clave|saludo personalizado|¿deseas que/i.test(low)
      ) {
        return false;
      }
      return true;
    })
    .join('\n')
    .trim()
    .slice(0, 1200);

  return (
    `Eres ${agentName}, Consultor Especialista en Seguridad y Salud en el Trabajo (SG-SST) de WAPPY IA bajo la normativa colombiana vigente (Decreto 1072/2015, Resolución 0312/2019, Res. 4272/2021, GTC-45, Res. 2764/2022 y Dec. 1496/2018).\n` +
    (sanitizedLines ? `Perfil del especialista:\n${sanitizedLines}\n\n` : '') +
    `REGLA ESTRICTA DE EJECUCIÓN EN SIMULACIÓN (CERO HERRAMIENTAS / CERO NARRADOR DE NODOS):\n` +
    `1. Todos los datos reales de los módulos conectados ya fueron extraídos previamente y aparecen en el mensaje del usuario.\n` +
    `2. Está TERMINANTEMENTE PROHIBIDO emitir llamadas a funciones/herramientas externas o bloques JSON de herramientas.\n` +
    `3. Redacta directamente el INFORME EJECUTIVO final en Markdown limpio (titular #, resumen ejecutivo, tabla de hallazgos/vencimientos con estados ✅/⚠️/❌ si aplica y plan de acción numerado), listo para enviarse por correo electrónico y chat a gerencia/SG-SST.\n` +
    `4. NO narres la arquitectura del flujo ni enumeres pasos internos tipo "Paso #1", "Paso #6", "Memoria Bitácora" o "Condición Si/No".`
  );
}

async function executeSandboxAgentCall({
  reqUser,
  agentDoc,
  fullPrompt,
  useWebSearch = false,
  timeoutMs = 70000,
}) {
  const startedAt = Date.now();
  const { generateWithKeyRotation } = require('~/server/routes/sgsst/sgsstGemini');
  const preferredModel = String(agentDoc?.model || 'gemini-3.6-flash').trim() || 'gemini-3.6-flash';
  const systemInstruction = buildSandboxExecutiveSystemInstruction(agentDoc);
  const perAttemptMs = Math.max(20000, Math.min(Number(timeoutMs) || 45000, 45000));

  const extractVisibleText = (res) => {
    let raw = '';
    try {
      raw =
        (res?.response && typeof res.response.text === 'function'
          ? res.response.text()
          : res?.text || '') || '';
    } catch (_) {
      raw = '';
    }
    if (!String(raw).trim()) {
      const parts = res?.response?.candidates?.[0]?.content?.parts || [];
      raw = parts
        .filter((p) => p && typeof p.text === 'string' && !p.thought)
        .map((p) => p.text)
        .join('\n');
    }
    return String(raw).trim();
  };

  const invokeModel = async (
    modelId,
    { fastFallback = true, callTimeoutMs = perAttemptMs, allowWebSearch = Boolean(useWebSearch), thinkingBudget = 512 } = {},
  ) => {
    const isLite = modelId.includes('lite');
    const generationConfig = {
      temperature: 0.15,
      maxOutputTokens: 16384,
      ...(!isLite ? { thinkingConfig: { thinkingBudget } } : {}),
    };
    const res = await generateWithKeyRotation(
      modelId,
      reqUser?.id || reqUser,
      fullPrompt,
      {
        systemInstruction,
        useWebSearch: allowWebSearch,
        timeoutMs: callTimeoutMs,
        fastFallback,
        generationConfig,
      },
    );
    return {
      res,
      cleanText: extractVisibleText(res),
      finishReason: res?.response?.candidates?.[0]?.finishReason || 'desconocido',
    };
  };

  const altModel = preferredModel.includes('gemini-3.5-flash-lite')
    ? 'gemini-3.6-flash'
    : 'gemini-3.5-flash-lite';
  const attemptPlan = [
    { modelId: preferredModel, callTimeoutMs: perAttemptMs, allowWebSearch: Boolean(useWebSearch), thinkingBudget: 512 },
    { modelId: altModel, callTimeoutMs: 35000, allowWebSearch: false, thinkingBudget: 512 },
    // Tercer intento acotado sobre gemini-3.6-flash (geminiPoolManager entrega la siguiente clave sana)
    { modelId: 'gemini-3.6-flash', callTimeoutMs: 35000, allowWebSearch: false, thinkingBudget: 256 },
  ];

  let lastError = null;
  let lastFinishReason = 'desconocido';
  for (let i = 0; i < attemptPlan.length; i++) {
    const step = attemptPlan[i];
    try {
      const out = await invokeModel(step.modelId, {
        fastFallback: true,
        callTimeoutMs: step.callTimeoutMs,
        allowWebSearch: step.allowWebSearch,
        thinkingBudget: step.thinkingBudget,
      });
      lastFinishReason = out.finishReason;
      if (out.cleanText) {
        return {
          text: out.cleanText,
          durationMs: Math.max(1, Date.now() - startedAt),
          error: null,
        };
      }
      console.warn(
        `[Sandbox Play] Intento #${i + 1} (${step.modelId}) sin texto visible (finishReason=${out.finishReason}).`,
      );
    } catch (err) {
      lastError = err;
      console.warn(
        `[Sandbox Play] Intento #${i + 1} (${step.modelId}) falló:`,
        err?.message || err,
      );
    }
  }

  const fallbackErrMsg = lastError?.message
    ? lastError.message
    : `Modelo sin texto visible (finishReason=${lastFinishReason}).`;
  return {
    text: '',
    durationMs: Math.max(1, Date.now() - startedAt),
    error: fallbackErrMsg,
  };
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
    const isIfKey =
      nodeKey === 'if_condition' ||
      nodeKey === 'if_router' ||
      nodeId === 'if_condition' ||
      nodeId === 'if_node_router';
    return (
      nodeConfigs[nodeKey] ||
      nodeConfigs[nodeId] ||
      nodeConfigs[`trigger_${nodeId}`] ||
      nodeConfigs[`extractor_${nodeId}`] ||
      nodeConfigs[`ext_${nodeId}`] ||
      nodeConfigs[`sub_memory_${nodeId}`] ||
      nodeConfigs[`tool_inputs_${nodeId}`] ||
      nodeConfigs[`tool_hitos_${nodeId}`] ||
      nodeConfigs[`hito_${nodeId}`] ||
      nodeConfigs[`out_${nodeId}`] ||
      (isIfKey ? nodeConfigs.if_router || nodeConfigs.if_condition : null) ||
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
  const configuredLogicNodes = Array.isArray(wf.canvasLayout?.logicNodes)
    ? wf.canvasLayout.logicNodes.filter(Boolean)
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
  let totalDeduplicatedRecords = 0;
  let totalFreshExternalItems = 0;

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
    // Fallback causal DAG estilo n8n:
    // triggers ➔ extractors + source_read Hitos ➔ preIfLogic (merge/loop) ➔ [if_router + extract_ai_doc_ocr si pre_agent] ➔ sub_model + memories + tools + agent_tool Hitos (Herramienta +) + customNodes + agent_root ➔ [if_router si !pre_agent] ➔ human_approval ➔ extraAgents ➔ outputs
    const fallbackIfCfg = nodeConfigs.if_router || nodeConfigs.if_condition || {};
    const isPreAgentIfFallback =
      Boolean(wf.includeIfNode) && String(fallbackIfCfg.ifPlacement || '').trim() === 'pre_agent';
    const sourceReadHitosFallback = configuredHitos.filter(
      (hId) => resolveWorkflowHitoRole(nodeConfigs, hId) === 'source_read',
    );
    const agentToolHitosFallback = configuredHitos.filter((hId) =>
      isAgentToolHitoRole(resolveWorkflowHitoRole(nodeConfigs, hId)),
    );
    const preIfLogicFallback = configuredLogicNodes.filter(
      (ln) => String(ln?.logicType || '').toLowerCase() !== 'human_approval',
    );
    const postApprovalLogicFallback = configuredLogicNodes.filter(
      (ln) => String(ln?.logicType || '').toLowerCase() === 'human_approval',
    );
    const preIfScraperCustomFallback = isPreAgentIfFallback
      ? configuredCustomNodes.filter((cn, i) => {
          const cnKey = cn.key || cn.id || `custom_${i + 1}`;
          return isAntigravityScraperIdentifier(cnKey, cn.nodeType || cnKey, cn);
        })
      : [];
    const preIfScraperKeys = new Set(
      preIfScraperCustomFallback.map((cn, i) => cn.key || cn.id || `custom_${i + 1}`),
    );
    const agentClusterCustomFallback = configuredCustomNodes.filter((cn, i) => {
      const cnKey = cn.key || cn.id || `custom_${i + 1}`;
      return !preIfScraperKeys.has(cnKey);
    });

    configuredTriggers.forEach((trigId, i) => {
      executionPlan.push({
        nodeKey: i === 0 ? 'trigger_root' : `trigger_${trigId}`,
        nodeId: trigId,
        category: 'trigger',
      });
    });
    configuredExtractors
      .filter(
        (extId) =>
          !isPreAgentIfFallback || normalizeInspectorNodeId(extId) !== 'extract_ai_doc_ocr',
      )
      .forEach((extId) => {
        executionPlan.push({
          nodeKey: `extractor_${extId}`,
          nodeId: extId,
          category: 'extractor',
        });
      });
    sourceReadHitosFallback.forEach((hId) => {
      executionPlan.push({
        nodeKey: `hito_${hId}`,
        nodeId: hId,
        category: 'hito',
      });
    });
    preIfScraperCustomFallback.forEach((cn, i) => {
      const cnKey = cn.key || cn.id || `custom_${i + 1}`;
      executionPlan.push({
        nodeKey: cnKey,
        nodeId: cn.nodeType || cnKey,
        category: 'custom_node',
      });
    });
    preIfLogicFallback.forEach((ln, idx) => {
      const lKey = ln.key || `logic_${ln.logicType || 'step'}_${idx + 1}`;
      executionPlan.push({
        nodeKey: lKey,
        nodeId: `logic_${ln.logicType || 'step'}`,
        category: 'logic',
        title: ln.title || `Nodo Lógico (${ln.logicType || 'step'})`,
      });
    });
    if (Boolean(wf.includeIfNode) && isPreAgentIfFallback) {
      executionPlan.push({
        nodeKey: 'if_router',
        nodeId: 'if_condition',
        category: 'condition',
      });
      configuredExtractors
        .filter((extId) => normalizeInspectorNodeId(extId) === 'extract_ai_doc_ocr')
        .forEach((extId) => {
          executionPlan.push({
            nodeKey: `extractor_${extId}`,
            nodeId: extId,
            category: 'extractor',
          });
        });
    }
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
    agentToolHitosFallback.forEach((hId) => {
      executionPlan.push({
        nodeKey: `tool_hitos_${hId}`,
        nodeId: hId,
        category: 'hito',
      });
    });
    agentClusterCustomFallback.forEach((cn, i) => {
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
    if (Boolean(wf.includeIfNode) && !isPreAgentIfFallback) {
      executionPlan.push({
        nodeKey: 'if_router',
        nodeId: 'if_condition',
        category: 'condition',
      });
    }
    postApprovalLogicFallback.forEach((ln, idx) => {
      const lKey = ln.key || `logic_human_approval_${idx + 1}`;
      executionPlan.push({
        nodeKey: lKey,
        nodeId: 'logic_human_approval',
        category: 'logic',
        title: ln.title || 'Aprobación Humana',
      });
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

  // Cargar Ledger Anti-Duplicados real en Sandbox cuando `wappy_memory_antiduplicate` esté conectado y exista automationId
  const simAutomationId = params.automationId || params._id || wf?.automationId || null;
  const hasSimAntiDuplicate =
    configuredMemories.includes('wappy_memory_antiduplicate') ||
    connectedNodeIds.has('wappy_memory_antiduplicate') ||
    connectedNodeKeys.has('sub_memory_wappy_memory_antiduplicate');
  let simDedupLedger = { keysSet: new Set(), dedupWindow: '' };
  if (hasSimAntiDuplicate && simAutomationId) {
    simDedupLedger = await loadProcessedEntityKeysForAutomation({
      automationId: simAutomationId,
      nodeConfigs,
    });
  }

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

    const effectiveInspectNodeId =
      nodeId === 'extract_sst_app' && cfg.sstAppSourceId
        ? sstAppSourceAliasMap[String(cfg.sstAppSourceId).toLowerCase().trim()] ||
          String(cfg.sstAppSourceId).trim()
        : sstAppSourceAliasMap[String(nodeId || '').toLowerCase().trim()] || nodeId;

    let liveData = null;
    let stepError = null;
    if (
      (nodeId === 'webhook_api' || String(nodeKey || '').includes('webhook_api')) &&
      cfg.endpointUrl
    ) {
      const whRes = await fetchSafeWebhookApiData(cfg.endpointUrl, {
        method: cfg.httpMethod || 'GET',
        headers: cfg.headers || {},
      });
      if (whRes.ok) {
        const rows = Array.isArray(whRes.data) ? whRes.data : [whRes.data];
        liveData = {
          nodeId: 'webhook_api',
          canonicalNodeId: 'webhook_api',
          sourceTitle: `API / Webhook HTTPS (${cfg.endpointUrl})`,
          totalCount: rows.length,
          records: rows.slice(0, 40).map((item, idx) => ({
            id: `wh_${idx + 1}`,
            label: typeof item === 'object' && item ? item.title || item.name || item.id || `Registro API #${idx + 1}` : String(item).slice(0, 80),
            sublabel: `HTTP ${whRes.status}`,
            isCritical: false,
            data: typeof item === 'object' && item ? item : { value: item },
          })),
        };
      } else {
        stepError = whRes.error || 'Error en consulta HTTPS externa';
        addStepLog('error', `Error consultando API/Webhook HTTPS: ${stepError}`);
      }
    } else {
      try {
        const isAiDocOcrStep = normalizeInspectorNodeId(effectiveInspectNodeId) === 'extract_ai_doc_ocr';
        const effectiveStepCfg = isAiDocOcrStep
          ? {
              ...cfg,
              runAiExtraction: true,
              driveCfg: nodeConfigs?.extractor_extract_drive || nodeConfigs?.extract_drive || null,
              gmailCfg: nodeConfigs?.extractor_extract_gmail || nodeConfigs?.extract_gmail || null,
              pcCfg:
                nodeConfigs?.extractor_extract_pc_folder || nodeConfigs?.extract_pc_folder || null,
              eventPayload: mockTriggerInput ? String(mockTriggerInput).trim() : null,
            }
          : cfg;

        liveData = await inspectNodeLiveData({
          userId: userIdStr,
          companyId: targetCompanyIdStr,
          nodeId: effectiveInspectNodeId,
          driveFolderId: cfg.driveFolderId,
          driveFolderUrl: cfg.driveFolderUrl,
          driveFolderName: cfg.driveFolderName,
          fileNameFilter: cfg.fileNameFilter,
          fileTypeFilter: cfg.fileTypeFilter,
          maxItems: cfg.maxItems,
          watchFolderPath: cfg.watchFolderPath,
          includeSubfolders: cfg.includeSubfolders,
          sstAppSourceId: cfg.sstAppSourceId,
          emailSubjectFilter: cfg.emailSubjectFilter,
          endpointUrl: cfg.endpointUrl,
          nodeConfig: effectiveStepCfg,
        });
      } catch (inspectErr) {
        stepError = inspectErr?.message || 'Error inspeccionando datos del nodo';
        addStepLog('error', `Error al consultar datos de ${effectiveInspectNodeId}: ${stepError}`);
      }
    }
    await pauseStep(240);

    const allRecords = Array.isArray(liveData?.records) ? liveData.records : [];
    let filteredRecords = allRecords;

    if (filterMode === 'critical_only' || filterMode === 'expiry_only') {
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

    const canonicalStepId = normalizeInspectorNodeId(effectiveInspectNodeId);
    const isExternalDriveStep =
      canonicalStepId === 'extract_drive' || canonicalStepId === 'google_drive';
    const isExternalGmailStep =
      canonicalStepId === 'extract_gmail' || canonicalStepId === 'google_gmail';
    const isTargetWriteHitoStep =
      category === 'hito' && isAgentToolHitoRole(resolveWorkflowHitoRole(nodeConfigs, nodeId));

    let stepDedupSkipped = 0;
    let critCount = 0;
    if (isExternalDriveStep) {
      const nextDriveRecords = [];
      for (const r of filteredRecords) {
        if (r.badge === 'CARPETA') {
          nextDriveRecords.push(r);
          continue;
        }
        const dKey = `drive:${r.id}`;
        if (simDedupLedger.keysSet.size > 0 && simDedupLedger.keysSet.has(dKey)) {
          stepDedupSkipped += 1;
          totalDeduplicatedRecords += 1;
        } else {
          totalFreshExternalItems += 1;
          nextDriveRecords.push(r);
        }
      }
      if (simDedupLedger.keysSet.size > 0) {
        filteredRecords = nextDriveRecords;
      }
    } else if (isExternalGmailStep) {
      const nextGmailRecords = [];
      for (const r of filteredRecords) {
        const gKey = `gmail:${r.id}`;
        if (simDedupLedger.keysSet.size > 0 && simDedupLedger.keysSet.has(gKey)) {
          stepDedupSkipped += 1;
          totalDeduplicatedRecords += 1;
        } else {
          totalFreshExternalItems += 1;
          nextGmailRecords.push(r);
        }
      }
      if (simDedupLedger.keysSet.size > 0) {
        filteredRecords = nextGmailRecords;
      }
    } else if (!isTargetWriteHitoStep && category !== 'memory') {
      const nextSourceRecords = [];
      for (const r of filteredRecords) {
        if (r.isCritical) {
          const eKey = extractWorkflowEntityDedupKey(canonicalStepId, r);
          if (simDedupLedger.keysSet.size > 0 && simDedupLedger.keysSet.has(eKey)) {
            stepDedupSkipped += 1;
            totalDeduplicatedRecords += 1;
            if (filterMode !== 'critical_only' && filterMode !== 'expiry_only') {
              nextSourceRecords.push(r);
            }
            continue;
          }
          critCount += 1;
        }
        nextSourceRecords.push(r);
      }
      filteredRecords = nextSourceRecords;
      totalCriticalRecords += critCount;
    }

    totalExtractedRecords += filteredRecords.length;

    const kpiLine = Array.isArray(liveData?.kpis)
      ? liveData.kpis.map((k) => `${k.label}: ${k.value}`).join(' · ')
      : '';

    const previewLines = [];
    if (kpiLine) {
      previewLines.push(`📊 KPIs en Vivo: ${kpiLine}`);
    }
    if (stepDedupSkipped > 0) {
      previewLines.push(
        `🛡️ Filtro Anti-Duplicados Activo (${simDedupLedger.dedupWindow || '7d'}): ${stepDedupSkipped} registro(s)/archivo(s) ya procesados en corridas previas fueron omitidos.`,
      );
      addStepLog(
        'info',
        `Ledger Anti-Duplicados (${simDedupLedger.dedupWindow || '7d'}): ${stepDedupSkipped} ítem(s) omitidos por haber sido procesados previamente`,
      );
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

    const isWorkerDataNode =
      effectiveInspectNodeId === 'extract_sst_workers' ||
      effectiveInspectNodeId === 'somos_sst_trabajadores' ||
      effectiveInspectNodeId === 'hito2_perfil_socio';

    // Proyectar cada registro de filteredRecords.slice(0, 300) en un objeto JSON limpio para stepOutputItems (estilo n8n)
    let stepOutputItems = filteredRecords.slice(0, 300).map((rec, idx) => {
      const rawBirth =
        rec?.fields?.['Fecha de Nacimiento'] ||
        rec?.fechaNacimiento ||
        rec?.birthDate ||
        '';
      const normalizedBirth = rawBirth ? normalizeAnyDateYmd(rawBirth) || String(rawBirth).trim() : '';

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
          if (
            isWorkerDataNode &&
            (sfNorm === 'birthdate' ||
              sfNorm === 'fechanacimiento' ||
              sfNorm.includes('fecha de nacimiento') ||
              sfNorm.includes('nacimiento'))
          ) {
            projectedObj[sf] = normalizedBirth;
            projectedObj.birthDate = normalizedBirth;
            projectedObj.fechaNacimiento = normalizedBirth;
            continue;
          }
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
        ...(isWorkerDataNode
          ? {
              'Fecha de Nacimiento': normalizedBirth || rec?.fields?.['Fecha de Nacimiento'] || '',
              fechaNacimiento: normalizedBirth,
              birthDate: normalizedBirth,
            }
          : {}),
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
      filterMode === 'expiry_only'
        ? 'Solo vencimientos próximos o vencidos (<= 30 días)'
        : filterMode === 'critical_only'
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
    } else if (nodeId === 'extract_web_search' || nodeId === 'web_search') {
      const searchQueryStr = String(
        cfg.searchQuery ||
          cfg.targetUrl ||
          cfg.customInstruction ||
          mockTriggerInput ||
          prompt ||
          `Normativa vigente SG-SST Colombia para ${companyName}`,
      ).trim();
      addStepLog('info', `Ejecutando Búsqueda Web en Vivo: "${searchQueryStr.slice(0, 140)}"`);
      try {
        const searchExec = await executeSandboxAgentCall({
          reqUser,
          agentDoc: {
            name: 'Buscador Normativo Web WAPPY',
            model: effectiveAiModel,
            instructions:
              'Eres un motor de búsqueda normativa y técnica SST en Colombia (MinTrabajo, ARL, Decreto 1072/2015, Res. 0312/2019, Res. 4272/2021, PESV). Entrega de 3 a 5 hallazgos verificados, concisos y con fuente oficial.',
          },
          fullPrompt: `Consulta en vivo sobre: "${searchQueryStr}". Resume los hallazgos oficiales más recientes aplicables a "${companyName}".`,
          useWebSearch: true,
        });
        if (searchExec.text) {
          previewLines.unshift(`🌐 **RESULTADO DE BÚSQUEDA WEB EN VIVO (${effectiveAiModel} + Grounding):**\n${searchExec.text.slice(0, 1500)}`);
          stepOutputItems = [
            {
              index: 1,
              id: `${nodeKey}_web_search_live`,
              consulta: searchQueryStr,
              motor: `${effectiveAiModel} (Google Search Grounding)`,
              hallazgos: searchExec.text.slice(0, 2000),
              duracionMs: searchExec.durationMs,
            },
          ];
          finalRecordsCount = Math.max(1, finalRecordsCount);
          inputSummaryText = `Búsqueda Web en Vivo: "${searchQueryStr.slice(0, 120)}"`;
          addStepLog('success', `Búsqueda Web completada en ${searchExec.durationMs} ms`);
        }
      } catch (wsErr) {
        addStepLog('warn', `Aviso en Búsqueda Web en Vivo: ${wsErr?.message || wsErr}`);
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
      if (category === 'hito') {
        const hitoMode = String(cfg?.hitoOperationMode || (isTargetWriteHitoStep ? 'audit_and_update' : 'extract_only'));
        if (isTargetWriteHitoStep || hitoMode === 'write_register' || hitoMode === 'audit_and_update') {
          const modeLabel =
            hitoMode === 'write_register'
              ? 'ESCRITURA / REGISTRO NUEVO'
              : 'HERRAMIENTA + · CONSULTA Y ACTUALIZACIÓN EN SOMOS SST';
          previewLines.push(
            `🔧 [HERRAMIENTA + CONECTADA AL AGENTE IA (${modeLabel} — SIMULADO EN SANDBOX)]: Habilita la herramienta MCP de "${resolvedTitle}" para ${agent.name} a partir de ${incomingItems.length} item(s) entrantes sin alterar la base de datos durante esta prueba (dryRun: true).`,
          );
          if (nodeId === 'hito7_investigacion_atel') {
            const atelStages = [
              '1) Mapeo IA de los 23 campos FURAT + cruce con Trabajadores 360° (SgsstWorker, CompanyInfo y COPASST)',
              '2) Registro idempotente del expediente en InvestigacionAtelData + ATELAnnualData + Hoja de Vida Bio-Individual',
              '3) Análisis IA Res. 1401 dentro del aplicativo (5 Porqués + Ishikawa SVG + Árbol de Causas + Firmas) y guardado en Historial (sgsst-investigacion-atel)',
              '4) Extracción del Informe Oficial HTML hacia el flujo (Condición Si/No ➔ ACPM / Correo)',
            ];
            previewLines.push(
              `🔬 [PIPELINE NATIVO DE 4 SUB-ETAPAS EN H7: INVESTIGACIÓN ATEL]:\n  • ${atelStages.join('\n  • ')}`,
            );
            const atelStageFields = {
              modoOperativoHito: hitoMode,
              subEtapa1_MapeoYCruce360: atelStages[0],
              subEtapa2_RegistroExpediente: atelStages[1],
              subEtapa3_AnalisisRes1401EHistorial: atelStages[2],
              subEtapa4_ExtraccionInformeAlFlujo: atelStages[3],
            };
            if (Array.isArray(stepOutputItems) && stepOutputItems.length > 0) {
              stepOutputItems = stepOutputItems.map((it) => ({
                ...it,
                ...atelStageFields,
              }));
            } else {
              stepOutputItems = [
                {
                  index: 1,
                  id: `${nodeKey}_atel_pipeline_preview`,
                  nodo: resolvedTitle,
                  nodeId,
                  categoria: category,
                  empresa: companyName,
                  estado: 'pipeline_4_subetapas_listo_sandbox',
                  registrosEncontrados: filteredRecords.length,
                  ...atelStageFields,
                },
              ];
            }
            addStepLog(
              'success',
              'Pipeline de 4 sub-etapas de H7: Investigación ATEL (Mapeo 23 campos + Cruce 360° ➔ Registro InvestigacionAtelData ➔ Análisis IA Res. 1401 en Historial ➔ Extracción HTML Oficial al flujo) verificado',
            );
          }
          addStepLog(
            'info',
            `Herramienta + "${modeLabel}" validada en Sandbox (${incomingItems.length} item(s) evaluados; escritura bloqueada por dryRun: true)`,
          );
        }
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

    const preserveUpstreamItemsBeforeAgent =
      isTargetWriteHitoStep && agentOutputs.length === 0 && incomingItems.length > 0;

    if (
      !preserveUpstreamItemsBeforeAgent &&
      (category === 'extractor' ||
        category === 'hito' ||
        category === 'tool' ||
        currentPipelineItems.length <= 1)
    ) {
      currentPipelineItems = stepOutputItems;
      lastProducerNode = { nodeKey, title: stepItem.title };
    }
    stepOutputsByKey.set(nodeKey, {
      title: stepItem.title,
      category: isTargetWriteHitoStep && agentOutputs.length === 0 ? 'tool' : category,
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
  const activeSkillsAndRulesBlocks = [];
  let finalResponse = '';
  let previousAgentResponse = '';
  let effectiveUserPrompt = typeof prompt === 'string' ? prompt.trim() : '';
  let ifHasEvaluated = false;
  let ifEvaluation = {
    enabled: connectedNodeKeys.has('if_condition') || connectedNodeKeys.has('if_router'),
    branchTaken: 'SI',
    reason: 'Flujo directo hacia los nodos conectados.',
  };

  const extraAgentsList = Array.isArray(wf?.canvasLayout?.extraAgents)
    ? wf.canvasLayout.extraAgents.filter(Boolean)
    : [];
  const customEdgesList = Array.isArray(wf?.canvasLayout?.edges)
    ? wf.canvasLayout.edges.filter((e) => e && e.kind !== 'sub')
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
      else if (
        nodeKey === 'if_condition' ||
        nodeKey === 'if_router' ||
        nodeId === 'if_condition' ||
        nodeId === 'if_node_router'
      ) {
        category = 'condition';
      } else if (/^logic_/.test(nodeKey) || /^logic_/.test(nodeId)) category = 'logic';
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

    const matchedCustomObj =
      configuredCustomNodes.find((c, i) => (c.key || c.id || `custom_${i + 1}`) === nodeKey) || null;

    // 0A. GUARDIA OBLIGATORIA PARA NODOS "EN CONSTRUCCIÓN" (Omitir limpiamente sin romper ni demorar)
    if (
      planStep.underConstruction === true ||
      isUnderConstructionNode(nodeKey, nodeId, matchedCustomObj)
    ) {
      await emitProgress({
        type: 'step_start',
        nodeKey,
        nodeId,
        category,
      });
      const baseSkipTitle =
        stepCustomTitle || matchedCustomObj?.title || nodeId || nodeKey;
      const passthroughItems =
        currentPipelineItems.length > 0
          ? currentPipelineItems.slice(0, 300)
          : [
              {
                index: 1,
                nodo: baseSkipTitle,
                nodeId,
                estado: '🚧 En Construcción (Omitido)',
              },
            ];
      const skipMsg =
        '🚧 En Construcción (Omitido): Este conector se encuentra actualmente en desarrollo y fue omitido limpiamente sin interrumpir ni demorar la secuencia del flujo.';
      const skippedStep = {
        stepIndex: ++stepCounter,
        nodeKey,
        nodeId: nodeId || nodeKey,
        category,
        title: `${baseSkipTitle} — 🚧 En Construcción (Omitido)`,
        status: 'skipped',
        durationMs: 3,
        recordsCount: 0,
        surgicalFields: [],
        inputSummary: '🚧 En Construcción (Omitido)',
        inputContext: '🚧 En Construcción (Omitido)',
        outputPreview: skipMsg,
        sourceNodeKey: lastProducerNode.nodeKey,
        sourceNodeTitle: lastProducerNode.title,
        inputItems: currentPipelineItems.slice(0, 300),
        outputItems: passthroughItems,
        evidences: [],
        logs: [
          {
            timestamp: new Date().toISOString(),
            level: 'warn',
            message: `🚧 En Construcción (Omitido): "${baseSkipTitle}" saltado en 3 ms sin afectar el flujo.`,
          },
        ],
        error: null,
      };
      stepOutputsByKey.set(nodeKey, {
        title: skippedStep.title,
        category,
        outputItems: passthroughItems,
        evidences: [],
      });
      nodeTrace.push(skippedStep);
      await emitProgress({
        type: 'step_done',
        nodeKey,
        nodeId: skippedStep.nodeId,
        step: skippedStep,
      });
      continue;
    }

    // 0B. ENRUTAMIENTO POR RAMA CONDICIONAL (Si existen cables explícitos if_true / if_false desde if_router)
    if (ifHasEvaluated && customEdgesList.length > 0) {
      const incomingEdges = customEdgesList.filter(
        (e) => (e.targetKey || e.target) === nodeKey,
      );
      if (incomingEdges.length > 0) {
        const allFromUntakenIfBranch = incomingEdges.every((e) => {
          const src = e.sourceKey || e.source || '';
          const port = String(e.portType || e.sourceHandle || '').toLowerCase();
          if (src !== 'if_router' && src !== 'if_condition') return false;
          if (!port.includes('true') && !port.includes('false')) return false;
          const edgeIsTrue = port.includes('true');
          return ifEvaluation.branchTaken === 'SI' ? !edgeIsTrue : edgeIsTrue;
        });
        if (allFromUntakenIfBranch) {
          const untakenBranchStep = {
            stepIndex: ++stepCounter,
            nodeKey,
            nodeId: nodeId || nodeKey,
            category,
            title: `${stepCustomTitle || nodeId} (Omitido — Rama ${ifEvaluation.branchTaken === 'SI' ? 'NO' : 'SÍ'} inactiva)`,
            status: 'skipped',
            durationMs: 2,
            recordsCount: 0,
            surgicalFields: [],
            inputSummary: `Rama condicional activa: ${ifEvaluation.branchTaken}`,
            inputContext: `Rama condicional activa: ${ifEvaluation.branchTaken}`,
            outputPreview: `⏭️ Paso omitido porque pertenece exclusivamente a la rama opuesta a [${ifEvaluation.branchTaken}].`,
            sourceNodeKey: lastProducerNode.nodeKey,
            sourceNodeTitle: lastProducerNode.title,
            inputItems: [],
            outputItems: [],
            evidences: [],
            logs: [
              {
                timestamp: new Date().toISOString(),
                level: 'info',
                message: `Nodo omitido por bifurcación Si/No (Rama tomada: ${ifEvaluation.branchTaken})`,
              },
            ],
            error: null,
          };
          nodeTrace.push(untakenBranchStep);
          await emitProgress({
            type: 'step_done',
            nodeKey,
            nodeId: untakenBranchStep.nodeId,
            step: untakenBranchStep,
          });
          continue;
        }
      }
    }

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
          ...(cfg.voiceCommand ? { comandoVoz: cfg.voiceCommand } : {}),
          ...(cfg.emailSenderFilter ? { filtroRemitente: cfg.emailSenderFilter } : {}),
          ...(cfg.emailSubjectFilter ? { filtroAsunto: cfg.emailSubjectFilter } : {}),
          ...(cfg.qrPortalTarget ? { portalQR: cfg.qrPortalTarget } : {}),
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
            cfg.voiceCommand ? `🎙️ Comando Tenshi: "${cfg.voiceCommand}"` : null,
            cfg.emailSubjectFilter ? `📧 Filtro Correo: "${cfg.emailSubjectFilter}"` : null,
            cfg.qrPortalTarget ? `📱 Portal QR Colaborador: ${cfg.qrPortalTarget}` : null,
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
      const engineDisplay =
        selectedAiEngine === 'antigravity_cloud'
          ? `Google Antigravity Cloud 24/7 (Respaldo: ${effectiveAiModel})`
          : selectedAiEngine === 'antigravity'
            ? `Google Antigravity Local Mac/PC (Respaldo: ${effectiveAiModel})`
            : `WAPPY IA Rotación de Claves (${effectiveAiModel})`;
      const modelOutputItems = [
        {
          index: 1,
          motorIA: selectedAiEngine,
          modeloActivo: effectiveAiModel,
          descripcionMotor: engineDisplay,
          estado: 'listo',
          rotacionClaves: true,
        },
      ];
      const modelStep = {
        stepIndex: ++stepCounter,
        nodeKey,
        nodeId: effectiveAiModel,
        category: 'model',
        title: stepCustomTitle || `🧠 Motor IA Activo (${engineDisplay})`,
        status: 'completed',
        durationMs: 15,
        recordsCount: 1,
        surgicalFields: [],
        inputSummary: `Motor: ${selectedAiEngine} · Modelo: ${effectiveAiModel}`,
        inputContext: `Motor: ${selectedAiEngine} · Modelo: ${effectiveAiModel}`,
        outputPreview: `Motor IA "${engineDisplay}" inicializado y verificado.`,
        sourceNodeKey: lastProducerNode.nodeKey,
        sourceNodeTitle: lastProducerNode.title,
        inputItems: currentPipelineItems.slice(0, 300),
        outputItems: modelOutputItems,
        logs: [
          {
            timestamp: new Date().toISOString(),
            level: 'info',
            message: `Motor IA "${engineDisplay}" inicializado para el Agente IA`,
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
      if (
        ((category === 'hito' &&
          isAgentToolHitoRole(resolveWorkflowHitoRole(nodeConfigs, nodeId))) ||
          (category === 'extractor' &&
            normalizeInspectorNodeId(nodeId) === 'extract_ai_doc_ocr')) &&
        ifHasEvaluated &&
        ifEvaluation.branchTaken === 'NO'
      ) {
        await emitProgress({
          type: 'step_start',
          nodeKey,
          nodeId,
          category,
        });
        const skippedNodeStep = {
          stepIndex: ++stepCounter,
          nodeKey,
          nodeId,
          category,
          title: `${stepCustomTitle || formatHumanWorkflowNodeTitle(nodeId)} (⏭️ Omitido — Rama SÍ no activa · 0 tokens IA)`,
          status: 'skipped',
          durationMs: 2,
          recordsCount: 0,
          surgicalFields: [],
          inputSummary: '⏭️ Omitido — Rama SÍ no activa · 0 tokens IA',
          inputContext: '⏭️ Omitido — Rama SÍ no activa · 0 tokens IA',
          outputPreview:
            category === 'extractor'
              ? '⏭️ Omitido — Rama SÍ no activa · 0 tokens IA: El Extractor IA de Documentos no consume tokens cuando la compuerta condicional previa toma la Rama NO.'
              : '⏭️ Omitido — Rama SÍ no activa · 0 tokens IA: Este aplicativo conectado en Herramienta + del Agente IA no se ejecuta cuando la compuerta condicional toma la Rama NO.',
          sourceNodeKey: lastProducerNode.nodeKey,
          sourceNodeTitle: lastProducerNode.title,
          inputItems: [],
          outputItems: [],
          evidences: [],
          logs: [
            {
              timestamp: new Date().toISOString(),
              level: 'info',
              message: '⏭️ Omitido — Rama SÍ no activa · 0 tokens IA',
            },
          ],
          error: null,
        };
        nodeTrace.push(skippedNodeStep);
        await emitProgress({
          type: 'step_done',
          nodeKey,
          nodeId,
          step: skippedNodeStep,
        });
        continue;
      }

      await executeDataStep({
        nodeKey,
        nodeId,
        category,
        customTitle: stepCustomTitle,
      });
      continue;
    }

    // 4A. NODOS LÓGICOS DE CONTROL DE FLUJO (`loop`, `merge`, `switch`, `filter`, `human_approval`)
    if (category === 'logic') {
      await emitProgress({
        type: 'step_start',
        nodeKey,
        nodeId,
        category: 'logic',
      });
      const tLogic0 = Date.now();
      await pauseStep(140);
      const lnObj =
        configuredLogicNodes.find((l) => l.key === nodeKey || `logic_${l.logicType}` === nodeId) || {};
      const lnCfg = resolveNodeConfig(nodeKey, nodeId);
      const rawLogicType = String(
        lnObj.logicType || String(nodeId || nodeKey).replace(/^logic_/, ''),
      ).toLowerCase();
      const logicIncoming = currentPipelineItems.slice(0, 300);
      const logicSource = { ...lastProducerNode };

      let logicOutputItems = logicIncoming;
      let logicEvidences = [];
      let logicSummary = '';
      let logicPreview = '';
      const logicTitle = stepCustomTitle || lnObj.title || `Nodo Lógico (${rawLogicType})`;

      if (rawLogicType.includes('merge')) {
        // Consolidar salidas de múltiples ramas productoras previas sin duplicar registros
        const mergedItems = [];
        const mergedEvidences = [];
        const seenItemKeys = new Set();
        for (const [sKey, sVal] of stepOutputsByKey.entries()) {
          if (sVal.category === 'model' || sVal.category === 'trigger') continue;
          if (Array.isArray(sVal.evidences) && sVal.evidences.length > 0) {
            mergedEvidences.push(...sVal.evidences);
          }
          for (const it of sVal.outputItems || []) {
            const k =
              String(
                it.cedula ||
                  it['Cédula / Documento'] ||
                  it.documento ||
                  it.id ||
                  `${sKey}_${it.nombre || it.colaborador || it.index || ''}`,
              ).trim() + `::${it.fuente || sVal.title || ''}`;
            if (seenItemKeys.has(k)) continue;
            seenItemKeys.add(k);
            mergedItems.push({
              ...it,
              index: mergedItems.length + 1,
              _mergedFrom: sVal.title,
            });
          }
        }
        logicOutputItems = mergedItems.length > 0 ? mergedItems.slice(0, 300) : logicIncoming;
        logicEvidences = sanitizePublicEvidenceList(mergedEvidences);
        logicSummary = `Unión (Merge) de ${stepOutputsByKey.size} paso(s) previos ➔ ${logicOutputItems.length} registro(s) consolidados`;
        logicPreview = `🔗 **MERGE COMPLETADO:** Se unificaron las ramas conectadas previas entregando **${logicOutputItems.length}** registro(s) consolidado(s)${logicEvidences.length > 0 ? ` y **${logicEvidences.length}** soporte(s) documental(es)` : ''} al siguiente nodo.`;
      } else if (rawLogicType.includes('loop')) {
        const batchSize = Math.max(1, Number(lnCfg.batchSize) || 25);
        const totalBatches = Math.max(1, Math.ceil(logicIncoming.length / batchSize));
        logicOutputItems = logicIncoming.map((it, idx) => ({
          ...it,
          index: idx + 1,
          _loopIteration: idx + 1,
          _loopTotal: logicIncoming.length,
          _loopBatch: Math.floor(idx / batchSize) + 1,
        }));
        logicSummary = `Iteración por Lotes (Loop): ${logicOutputItems.length} registro(s) recorridos en ${totalBatches} lote(s)`;
        logicPreview = `🔁 **LOOP EJECUTADO:** Se iteraron **${logicOutputItems.length}** registro(s) de "${logicSource.title}" (${totalBatches} lote(s) de máx. ${batchSize} ítems) listos para procesamiento individual.`;
      } else if (rawLogicType.includes('human_approval') || rawLogicType.includes('approval')) {
        if (ifHasEvaluated && ifEvaluation.branchTaken === 'NO') {
          const skippedApprovalStep = {
            stepIndex: ++stepCounter,
            nodeKey,
            nodeId: nodeId || nodeKey,
            category: 'logic',
            title: `${logicTitle} (⏭️ Omitido — Rama SÍ no activa · 0 tokens IA)`,
            status: 'skipped',
            durationMs: 2,
            recordsCount: 0,
            surgicalFields: [],
            inputSummary: '⏭️ Omitido — Rama SÍ no activa · 0 tokens IA',
            inputContext: '⏭️ Omitido — Rama SÍ no activa · 0 tokens IA',
            outputPreview:
              '⏭️ Omitido — Rama SÍ no activa · 0 tokens IA: No se requiere Visto Bueno Humano cuando la compuerta condicional toma la Rama NO.',
            sourceNodeKey: logicSource.nodeKey,
            sourceNodeTitle: logicSource.title,
            inputItems: [],
            outputItems: [],
            evidences: [],
            logs: [
              {
                timestamp: new Date().toISOString(),
                level: 'info',
                message: '⏭️ Omitido — Rama SÍ no activa · 0 tokens IA',
              },
            ],
            error: null,
          };
          nodeTrace.push(skippedApprovalStep);
          await emitProgress({
            type: 'step_done',
            nodeKey,
            nodeId: skippedApprovalStep.nodeId,
            step: skippedApprovalStep,
          });
          continue;
        }
        const approver = String(lnCfg.approverEmail || validEmails[0] || 'responsable.sst@empresa.com').trim();
        logicOutputItems =
          logicIncoming.length > 0
            ? logicIncoming.map((it, idx) => ({
                ...it,
                index: idx + 1,
                _approvalGate: 'simulado_aprobado_sandbox',
                _approverEmail: approver,
              }))
            : [
                {
                  index: 1,
                  aprobador: approver,
                  estadoAprobacion: 'simulado_aprobado_sandbox',
                },
              ];
        logicSummary = `Compuerta de Aprobación Humana (${approver}) — Simulada en Sandbox`;
        logicPreview = `👤 **APROBACIÓN HUMANA (VISTA PREVIA SANDBOX):** En ejecución real se solicitará visto bueno a **${approver}** antes de continuar. En Modo Desarrollo continúa automáticamente (${logicOutputItems.length} registro(s)).`;
      } else {
        // switch / filter
        const ruleExpr = String(lnCfg.ifRuleExpression || lnCfg.customInstruction || '').trim().toLowerCase();
        if (ruleExpr) {
          const matched = logicIncoming.filter((it) =>
            JSON.stringify(it).toLowerCase().includes(ruleExpr),
          );
          logicOutputItems = matched.length > 0 ? matched : logicIncoming;
        }
        logicSummary = `Filtro / Enrutador Lógico (${logicOutputItems.length}/${logicIncoming.length} registro(s))`;
        logicPreview = `🎛️ **FILTRO LÓGICO APLICADO:** ${logicOutputItems.length} de ${logicIncoming.length} registro(s) cumplen los criterios configurados${ruleExpr ? ` ("${ruleExpr}")` : ''}.`;
      }

      const logicDurationMs = Math.max(1, Date.now() - tLogic0);
      const logicStep = {
        stepIndex: ++stepCounter,
        nodeKey,
        nodeId: nodeId || nodeKey,
        category: 'logic',
        title: logicTitle,
        status: 'completed',
        durationMs: logicDurationMs,
        recordsCount: logicOutputItems.length,
        surgicalFields: [],
        inputSummary: logicSummary,
        inputContext: logicSummary,
        outputPreview: logicPreview,
        sourceNodeKey: logicSource.nodeKey,
        sourceNodeTitle: logicSource.title,
        inputItems: logicIncoming,
        outputItems: logicOutputItems,
        evidences: logicEvidences,
        logs: [
          {
            timestamp: new Date().toISOString(),
            level: 'success',
            message: `${logicTitle}: ${logicSummary} (${logicDurationMs} ms)`,
          },
        ],
        error: null,
      };
      stepOutputsByKey.set(nodeKey, {
        title: logicStep.title,
        category: 'logic',
        outputItems: logicOutputItems,
        evidences: logicEvidences,
      });
      if (logicOutputItems.length > 0) {
        currentPipelineItems = logicOutputItems;
        lastProducerNode = { nodeKey, title: logicStep.title };
      }
      nodeTrace.push(logicStep);
      await emitProgress({
        type: 'step_done',
        nodeKey,
        nodeId: logicStep.nodeId,
        step: logicStep,
      });
      continue;
    }

    // 4B. NODOS PERSONALIZADOS / SKILLS / REGLAS / SUB-AGENTES / SCRAPERS ANTIGRAVITY (custom_node)
    if (category === 'custom_node') {
      await emitProgress({
        type: 'step_start',
        nodeKey,
        nodeId,
        category,
      });
      const cn = matchedCustomObj || {};
      const cnCfg = resolveNodeConfig(nodeKey, nodeId);
      const cnIncomingItems = currentPipelineItems.slice(0, 300);
      const cnIncomingSource = { ...lastProducerNode };
      const cnTypeLower = String(cn.nodeType || nodeId || '').toLowerCase();

      // Si es un Scraper / Verificador ACTIVO de Google Antigravity (Alto Riesgo, ARL Directo, Vial PESV, Antecedentes, Carpeta PC o Scraper Web AGY),
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
        if (Array.isArray(realScraper.outputItems) && realScraper.outputItems.length > 0) {
          for (const sItem of realScraper.outputItems) {
            const stTxt = String(
              sItem?.estadoPortal || sItem?.detalleOficial || sItem?.estado || sItem?.alerta || '',
            ).toLowerCase();
            const isBreach =
              Boolean(sItem?.isCritical) ||
              /sin\s+registro|sin\s+curso|vencid|no\s+afiliad|inactiv|comparendo|multa|brecha|cr[ií]tic|no\s+encontrad/i.test(
                stTxt,
              );
            if (isBreach) {
              const rawDoc = String(
                sItem?.cedula || sItem?.['Cédula / Documento'] || sItem?.documento || sItem?.placa || sItem?.id || '',
              )
                .trim()
                .toLowerCase()
                .replace(/[^a-z0-9_-]/g, '');
              const sKey = `scraper:${cn.nodeType || nodeId || nodeKey}:${rawDoc || 'item'}`;
              if (simDedupLedger.keysSet.size > 0 && simDedupLedger.keysSet.has(sKey)) {
                totalDeduplicatedRecords += 1;
              } else {
                totalCriticalRecords += 1;
              }
            }
          }
        } else if (Number(realScraper.verifiedNoCoursesCount || 0) > 0) {
          totalCriticalRecords += Number(realScraper.verifiedNoCoursesCount);
        }
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

      // Caso Especial: Sub-Agente Especialista o Buscador Web en Vivo (`subagent` / `web_search`)
      if (cnTypeLower === 'subagent' || cnTypeLower === 'web_search') {
        const subTitle = stepCustomTitle || cn.title || (cnTypeLower === 'web_search' ? 'Buscador Web SST' : 'Sub-Agente Especialista');
        if (ifHasEvaluated && ifEvaluation.branchTaken === 'NO') {
          const skippedSubStep = {
            stepIndex: ++stepCounter,
            nodeKey,
            nodeId: cn.nodeType || nodeId || nodeKey,
            category,
            title: `🧑‍🔬 ${subTitle} (⏭️ Omitido — Rama SÍ no activa · 0 tokens IA)`,
            status: 'skipped',
            durationMs: 2,
            recordsCount: 0,
            surgicalFields: [],
            inputSummary: '⏭️ Omitido — Rama SÍ no activa · 0 tokens IA',
            inputContext: '⏭️ Omitido — Rama SÍ no activa · 0 tokens IA',
            outputPreview: '⏭️ Omitido — Rama SÍ no activa · 0 tokens IA',
            sourceNodeKey: cnIncomingSource.nodeKey,
            sourceNodeTitle: cnIncomingSource.title,
            inputItems: [],
            outputItems: [],
            evidences: [],
            logs: [
              {
                timestamp: new Date().toISOString(),
                level: 'info',
                message: '⏭️ Omitido — Rama SÍ no activa · 0 tokens IA',
              },
            ],
            error: null,
          };
          nodeTrace.push(skippedSubStep);
          await emitProgress({
            type: 'step_done',
            nodeKey,
            nodeId: skippedSubStep.nodeId,
            step: skippedSubStep,
          });
          continue;
        }
        const subInstruction =
          cn.content ||
          cnCfg.customInstruction ||
          cn.subtitle ||
          prompt ||
          `Analiza técnicamente los datos recibidos de "${companyName}".`;
        const subItemsDigest = cnIncomingItems
          .slice(0, 20)
          .map((it, idx) => `${idx + 1}. ${JSON.stringify(it).slice(0, 260)}`)
          .join('\n');
        const subExec = await executeSandboxAgentCall({
          reqUser,
          agentDoc: {
            name: subTitle,
            model: effectiveAiModel,
            instructions: `Actúas como ${subTitle} de WAPPY IA para la empresa "${companyName}". ${subInstruction}`,
          },
          fullPrompt:
            `[EMPRESA]: "${companyName}"\n` +
            `[DATOS DE ENTRADA DESDE "${cnIncomingSource.title}" (${cnIncomingItems.length} ítem(s))]:\n${subItemsDigest || 'Sin registros previos.'}\n\n` +
            `[TAREA ESPECIALIZADA]: ${subInstruction}\nEntrega un dictamen técnico concreto y estructurado en Markdown.`,
          useWebSearch: cnTypeLower === 'web_search',
        });
        const cleanSubText = stripAgentInlineEvidenceNoise(
          subExec.text || `Dictamen completado por ${subTitle}.`,
          nodeTrace.flatMap((n) => (Array.isArray(n.evidences) ? n.evidences : [])),
        );
        if (cnTypeLower === 'subagent') {
          agentOutputs.push({
            agentKey: nodeKey,
            agentName: subTitle,
            roleLabel: cn.subtitle || 'Sub-Agente Especialista',
            model: effectiveAiModel,
            avatarSrc: '/assets/tenshi.png',
            promptUsed: subInstruction,
            responseText: cleanSubText,
            durationMs: subExec.durationMs,
          });
          previousAgentResponse = cleanSubText;
        }
        const subOutItems = [
          {
            index: 1,
            subAgente: subTitle,
            tipo: cnTypeLower,
            modelo: effectiveAiModel,
            dictamen: cleanSubText,
            duracionMs: subExec.durationMs,
          },
        ];
        const subStep = {
          stepIndex: ++stepCounter,
          nodeKey,
          nodeId: cn.nodeType || nodeId || nodeKey,
          category,
          title: `🧑‍🔬 ${subTitle}`,
          status: 'completed',
          durationMs: subExec.durationMs,
          recordsCount: 1,
          surgicalFields: [],
          inputSummary: `${cnTypeLower === 'web_search' ? 'Búsqueda Web Grounding' : 'Sub-Agente Especialista'} (${effectiveAiModel}) sobre ${cnIncomingItems.length} ítem(s)`,
          inputContext: subInstruction.slice(0, 220),
          outputPreview: cleanSubText.slice(0, 1400),
          sourceNodeKey: cnIncomingSource.nodeKey,
          sourceNodeTitle: cnIncomingSource.title,
          inputItems: cnIncomingItems,
          outputItems: subOutItems,
          logs: [
            {
              timestamp: new Date().toISOString(),
              level: subExec.error ? 'warn' : 'success',
              message: `${subTitle} ejecutado en ${subExec.durationMs} ms`,
            },
          ],
          error: subExec.error || null,
        };
        stepOutputsByKey.set(nodeKey, {
          title: subStep.title,
          category,
          outputItems: subOutItems,
        });
        currentPipelineItems = subOutItems;
        lastProducerNode = { nodeKey, title: subStep.title };
        nodeTrace.push(subStep);
        await emitProgress({
          type: 'step_done',
          nodeKey,
          nodeId: subStep.nodeId,
          step: subStep,
        });
        continue;
      }

      // Registrar Skills y Reglas activas para inyectarlas en el prompt del Agente IA siguiente
      if (cnTypeLower === 'skill' || cnTypeLower === 'rule') {
        const srBody =
          cnCfg.skillContent || cnCfg.ruleText || cn.content || cnCfg.customInstruction || cn.subtitle || '';
        if (srBody) {
          activeSkillsAndRulesBlocks.push(
            `- [${cnTypeLower === 'skill' ? 'SKILL TÉCNICA ACTIVA' : 'REGLA OBLIGATORIA ACTIVA'} — "${cn.title || stepCustomTitle || nodeKey}"]: ${srBody}`,
          );
        }
      }

      await pauseStep(160);
      const antigravityMode = String(cnCfg?.antigravityMode || cn?.antigravityMode || 'auto');
      let customChatDispatch = null;
      if (typeof global.dispatchWorkflowOrderToAntigravityChat === 'function' && cnTypeLower !== 'skill' && cnTypeLower !== 'rule') {
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
        cnCfg.skillContent ? `📘 Skill: ${String(cnCfg.skillContent).slice(0, 400)}` : '',
        cnCfg.ruleText ? `🛡️ Regla: ${String(cnCfg.ruleText).slice(0, 400)}` : '',
        customChatDispatch?.completedSync && customChatDispatch?.content
          ? `💬 Respuesta de Antigravity:\n${String(customChatDispatch.content).slice(0, 1200)}`
          : '',
      ]
        .filter(Boolean)
        .join('\n');

      const cnNodeLabel = stepCustomTitle || cn.title || nodeKey;
      const cnInputSummary =
        cnTypeLower === 'skill' || cnTypeLower === 'rule'
          ? `${cnTypeLower === 'skill' ? '📘 Skill Técnica' : '🛡️ Regla Normativa'} cargada e inyectada para el Agente IA`
          : `🤖 Solicitud enviada por Agente IA (${agent.name} · ${selectedAiEngine === 'wappy' ? effectiveAiModel : 'Google Antigravity'}) ➔ Ejecutando en Antigravity (${antigravityMode.toUpperCase()})`;
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
                cnTypeLower === 'skill'
                  ? `Evaluado con Skill (${cnNodeLabel}) · Cumple criterios GTC-45 / SG-SST`
                  : cnTypeLower === 'rule'
                    ? `Validado bajo Regla (${cnNodeLabel})`
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

    // 5. NODO CONDICIÓN SI/NO (`if_router` / `if_condition`)
    if (
      category === 'condition' ||
      nodeKey === 'if_condition' ||
      nodeKey === 'if_router' ||
      nodeId === 'if_condition'
    ) {
      await emitProgress({
        type: 'step_start',
        nodeKey,
        nodeId: 'if_condition',
        category: 'condition',
      });
      await pauseStep(180);
      const ifCfg = resolveNodeConfig(nodeKey, 'if_condition');
      const condType = String(ifCfg.ifConditionType || 'critical_findings');
      const ruleExpr = String(ifCfg.ifRuleExpression || '').trim();
      const mockLower = String(mockTriggerInput || '').toLowerCase();
      const respLower = String(previousAgentResponse || finalResponse || '').toLowerCase();
      const pipelineStrLower = JSON.stringify(currentPipelineItems.slice(0, 50)).toLowerCase();

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

      const hasAgentRunBefore = agentOutputs.length > 0;
      const watchesExternalSim =
        connectedNodeIds.has('extract_drive') ||
        connectedNodeIds.has('google_drive') ||
        connectedNodeIds.has('extract_gmail') ||
        connectedNodeIds.has('extract_ai_doc_ocr') ||
        connectedNodeIds.has('trigger_email') ||
        connectedNodeIds.has('trigger_email_in') ||
        connectedNodeIds.has('trigger_webhook') ||
        connectedNodeIds.has('trigger_webhook_in');
      const hasPositiveMockInput = Boolean(mockLower) && !explicitNoInMock;

      const evalSimOp = (observed, operator, target) => {
        if (operator === '>') return observed > target;
        if (operator === '>=') return observed >= target;
        if (operator === '<') return observed < target;
        if (operator === '<=') return observed <= target;
        if (operator === '!=' || operator === '!==') return observed !== target;
        return observed === target;
      };

      if (condType === 'new_external_items') {
        const numMatch = ruleExpr.match(/(>=|<=|>|<|===|==|=|!=|!==)\s*(\d+(?:\.\d+)?)/);
        const threshold = numMatch ? Number(numMatch[2]) : 1;
        const op = numMatch ? numMatch[1] : '>=';
        const observedExt = explicitNoInMock
          ? 0
          : totalFreshExternalItems + (hasPositiveMockInput ? 1 : 0);
        const passed = evalSimOp(observedExt, op, threshold);
        ifEvaluation = {
          enabled: true,
          branchTaken: passed ? 'SI' : 'NO',
          reason: passed
            ? `Se detectaron ${observedExt} elemento(s) externo(s) nuevo(s) sin procesar (${observedExt} ${op} ${threshold}) -> Se activa la Rama SÍ.`
            : `0 elementos externos nuevos que cumplan (${observedExt} ${op} ${threshold})${totalDeduplicatedRecords > 0 ? ` · ${totalDeduplicatedRecords} ya procesado(s) omitido(s)` : ''} -> Se activa la Rama NO.`,
        };
      } else if (condType === 'keyword_match' && ruleExpr) {
        const keywords = ruleExpr
          .split(/[,;|]+/)
          .map((s) => s.trim().toLowerCase())
          .filter(Boolean);
        const matchedKw = explicitNoInMock
          ? null
          : keywords.find(
              (kw) => respLower.includes(kw) || pipelineStrLower.includes(kw) || mockLower.includes(kw),
            );
        ifEvaluation = {
          enabled: true,
          branchTaken: matchedKw ? 'SI' : 'NO',
          reason: matchedKw
            ? `Coincidencia exacta de palabra clave "${matchedKw}" detectada en el flujo -> Se activa la Rama SÍ.`
            : `Ninguna palabra clave de [${ruleExpr}] apareció en los datos evaluados -> Se activa la Rama NO.`,
        };
      } else if (condType === 'numeric_threshold') {
        const numMatch = ruleExpr.match(/(>=|<=|>|<|===|==|=|!=|!==)\s*(\d+(?:\.\d+)?)/);
        const threshold = numMatch ? Number(numMatch[2]) : 1;
        const op = numMatch ? numMatch[1] : '>=';
        // NUNCA sustituir totalCriticalRecords === 0 por totalExtractedRecords
        const baseMetric = watchesExternalSim ? totalFreshExternalItems : totalCriticalRecords;
        const observed = explicitNoInMock
          ? 0
          : baseMetric + (hasPositiveMockInput && baseMetric === 0 ? 1 : 0);
        const passed = evalSimOp(observed, op, threshold);
        ifEvaluation = {
          enabled: true,
          branchTaken: passed ? 'SI' : 'NO',
          reason: `Evaluación de umbral numérico sobre hallazgos nuevos (${observed} ${op} ${threshold})${totalDeduplicatedRecords > 0 ? ` · ${totalDeduplicatedRecords} omitido(s) por anti-duplicados` : ''} -> Se activa la Rama ${passed ? 'SÍ' : 'NO'}.`,
        };
      } else if (explicitNoInMock) {
        ifEvaluation = {
          enabled: true,
          branchTaken: 'NO',
          reason:
            'El evento simulado en el Escenario de Desarrollo indica ausencia de novedades/hallazgos críticos -> Se activa la Rama NO.',
        };
      } else if (hasAgentRunBefore) {
        const postSimRes = evaluatePostAgentSemanticIf({
          resultText: previousAgentResponse || finalResponse,
          ifCfg,
          watchesDriveNewFiles: watchesExternalSim,
        });
        ifEvaluation = {
          enabled: true,
          branchTaken: postSimRes.passed ? 'SI' : 'NO',
          reason: `${postSimRes.reason} -> Se activa la Rama ${postSimRes.passed ? 'SÍ' : 'NO'}.`,
        };
      } else {
        const effectiveCrit = watchesExternalSim
          ? totalCriticalRecords + totalFreshExternalItems
          : totalCriticalRecords;
        const passedPreSim = effectiveCrit > 0 || hasPositiveMockInput;
        ifEvaluation = {
          enabled: true,
          branchTaken: passedPreSim ? 'SI' : 'NO',
          reason: passedPreSim
            ? `Se detectaron ${effectiveCrit > 0 ? `${effectiveCrit} hallazgo(s)/elemento(s) nuevo(s) en brecha` : 'novedades en la entrada simulada'} (${totalExtractedRecords} registros inspeccionados) -> Se activa la Rama SÍ.`
            : `100 % al día: 0 brechas críticas nuevas de ${totalExtractedRecords} registro(s) verificado(s)${totalDeduplicatedRecords > 0 ? ` (${totalDeduplicatedRecords} ya gestionado(s) omitido(s) por anti-duplicados)` : ''} -> Se activa la Rama NO (0 tokens IA).`,
        };
      }
      ifHasEvaluated = true;

      const condIncomingItems = currentPipelineItems.slice(0, 300);
      const condSource = { ...lastProducerNode };
      const condOutputItems = [
        {
          index: 1,
          condicion: stepCustomTitle || 'Condición Si/No',
          tipoRegla: condType,
          expresion: ruleExpr || 'Detección automática de hallazgos',
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
          `Evaluación (${condType}) en Paso #${stepCounter} sobre ${nodeTrace.length} paso(s) previos conectados`,
        inputContext:
          ifCfg.customInstruction ||
          `Evaluación (${condType}) en Paso #${stepCounter} sobre ${nodeTrace.length} paso(s) previos conectados`,
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
      const requestedEaModel = eaObj?.aiModel || eaObj?.model;
      const currentAgentModel =
        !isPrimaryAgent && allowedTextModels.includes(requestedEaModel)
          ? requestedEaModel
          : effectiveAiModel;

      if (ifHasEvaluated && ifEvaluation.branchTaken === 'NO') {
        await emitProgress({
          type: 'step_start',
          nodeKey,
          nodeId,
          category: 'agent',
        });
        const skippedAgentStep = {
          stepIndex: ++stepCounter,
          nodeKey,
          nodeId: nodeId || nodeKey,
          category: 'agent',
          title: `${stepCustomTitle || `🤖 ${currentAgentRole}: ${currentAgentName}`} (⏭️ Omitido — Rama SÍ no activa · 0 tokens IA)`,
          status: 'skipped',
          durationMs: 2,
          recordsCount: 0,
          surgicalFields: [],
          inputSummary: '⏭️ Omitido — Rama SÍ no activa · 0 tokens IA',
          inputContext: '⏭️ Omitido — Rama SÍ no activa · 0 tokens IA',
          outputPreview:
            '⏭️ Omitido — Rama SÍ no activa · 0 tokens IA: La compuerta determinista previa activó la Rama NO al no existir brechas nuevas pendientes, ahorrando el 100 % de tokens del modelo IA.',
          sourceNodeKey: lastProducerNode.nodeKey,
          sourceNodeTitle: lastProducerNode.title,
          inputItems: [],
          outputItems: [],
          evidences: [],
          logs: [
            {
              timestamp: new Date().toISOString(),
              level: 'info',
              message: '⏭️ Omitido — Rama SÍ no activa · 0 tokens IA',
            },
          ],
          error: null,
        };
        nodeTrace.push(skippedAgentStep);
        await emitProgress({
          type: 'step_done',
          nodeKey,
          nodeId: skippedAgentStep.nodeId,
          step: skippedAgentStep,
        });
        continue;
      }

      await emitProgress({
        type: 'step_start',
        nodeKey,
        nodeId,
        category: 'agent',
      });

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
              .filter((st) => st.category !== 'model' && st.category !== 'trigger' && st.category !== 'condition')
              .map(
                (st) =>
                  `### 🔹 Fuente: ${st.title}\n` +
                  `${String(st.outputPreview || '').slice(0, 3200)}`,
              )
              .join('\n\n') ||
            upstreamSteps
              .map((st) => `- ${st.title}: ${st.inputSummary}`)
              .join('\n')
          : 'Sin extractores previos conectados.';

      let connectedMemoriesPromptBlock = '';
      if (connectedNodeIds.has('wappy_memory_company') && automationCompany) {
        connectedMemoriesPromptBlock +=
          `- [MEMORIA DE EMPRESA CONECTADA (wappy_memory_company)]: Razón Social: "${automationCompany.companyName}" | NIT: ${automationCompany.nit || 'N/A'} | Actividad Económica: ${automationCompany.economicActivity || 'N/A'} (CIIU: ${automationCompany.ciiu || automationCompany.ciiuCode || 'N/A'}) | Nivel de Riesgo ARL: ${automationCompany.riskLevel || 'N/A'} | ARL: ${automationCompany.arl || 'N/A'} | N.º Trabajadores: ${automationCompany.workerCount ?? automationCompany.employeeCount ?? 'N/A'} | Responsable SG-SST: ${automationCompany.responsibleSST || automationCompany.sstResponsibleName || 'N/A'} (Licencia: ${automationCompany.licenseNumber || automationCompany.sstLicenseNumber || 'N/A'})\n`;
      }
      if (connectedNodeIds.has('wappy_memory_antiduplicate')) {
        connectedMemoriesPromptBlock +=
          `- [MEMORIA ANTI-DUPLICADOS ACTIVA (wappy_memory_antiduplicate)]: Cruza los IDs/cédulas ya reportados en corridas previas del paso de memoria para NO repetir alertas idénticas ya cerradas.\n`;
      }
      if (connectedNodeIds.has('wappy_rag_documental')) {
        connectedMemoriesPromptBlock +=
          `- [MEMORIA RAG DOCUMENTAL CONECTADA (wappy_rag_documental)]: Aplica los documentos vivos y cuadernos NotebookLM indexados para "${companyName}" extraídos en el paso de memoria.\n`;
      }
      if (connectedNodeIds.has('wappy_memory_procedural')) {
        connectedMemoriesPromptBlock +=
          `- [MEMORIA PROCEDURAL NORMATIVA SST ACTIVA (wappy_memory_procedural)]: Aplica estrictamente Decreto 1072/2015, Res. 0312/2019, GTC-45, Res. 4272/2021, Res. 20223040040595 PESV, Res. 2764/2022 y Decreto 1496/2018 SGA.\n`;
      }
      if (activeSkillsAndRulesBlocks.length > 0) {
        connectedMemoriesPromptBlock += `${activeSkillsAndRulesBlocks.join('\n')}\n`;
      }

      const agentCfg = resolveNodeConfig(nodeKey, nodeId);
      const customNodePrompt =
        (!isPrimaryAgent && eaObj?.prompt ? String(eaObj.prompt).trim() : '') ||
        (agentCfg?.customInstruction ? String(agentCfg.customInstruction).trim() : '');

      const connectedDataTitles = upstreamSteps
        .filter((s) => s.category !== 'model')
        .map((s) => s.title)
        .join(' ➔ ');
      const downstreamTitles = downstreamSteps.map((s) => s.title || s.nodeId).join(' ➔ ');

      const cleanMockInput = mockTriggerInput ? String(mockTriggerInput).trim() : '';

      const dynamicFlowDirective =
        `[CONTEXTO DEL FLUJO CONECTADO EN EL LIENZO (${executionPlan.length} MÓDULOS)]\n` +
        `${flowSequenceFormatted}\n\n` +
        `[REGLAS ESTRICTAS PARA EL INFORME EJECUTIVO FINAL]:\n` +
        `1. Analiza ÚNICAMENTE la información real extraída de los módulos conectados hasta este punto (${connectedDataTitles || 'Disparador inicial'}).\n` +
        `2. PROHIBIDO inventar, suponer o mencionar datos de módulos que NO estén conectados.\n` +
        `3. Este informe es exactamente el reporte ejecutivo que llegará a correo electrónico, chat de Tenshi y Centro de Control de "${companyName}". Redáctalo de forma gerencial (Titular \`#\`, Resumen Ejecutivo, Tabla de hallazgos/vencimientos con estados ✅/⚠️/❌ si hay registros, y Plan de Acción numerado).\n` +
        `4. PROHIBIDO narrar cómo funcionan los nodos del lienzo o dividir el informe en subtítulos tipo "Paso #1", "Paso #6: Memoria WAPPY", "Paso #7: Memoria Bitácora" o "Condición Si/No".\n\n`;

      const baseInstructionForAgent =
        customNodePrompt ||
        (cleanMockInput
          ? `RESPONDE DIRECTAMENTE A ESTA ENTRADA / SOLICITUD DEL DISPARADOR: "${cleanMockInput}"\n` +
            (effectiveUserPrompt ? `Contexto adicional de la tarea: ${effectiveUserPrompt}\n` : '') +
            `Cruza los datos reales extraídos en los pasos previos conectados (${connectedDataTitles || 'Disparador'}) para dar una respuesta exacta, completa y accionable a la entrada recibida.`
          : effectiveUserPrompt
            ? `${effectiveUserPrompt}\n\n(NOTA CRÍTICA: Ajusta este análisis estrictamente a los nodos actualmente conectados en la secuencia: ${connectedDataTitles || 'Disparador'} ➔ ${currentAgentName} ➔ ${downstreamTitles || 'Salida'}).`
            : `Ejecuta el análisis del flujo para "${companyName}" siguiendo estrictamente el orden consecutivo de los pasos conectados (${connectedDataTitles || 'Disparador'} ➔ ${downstreamTitles || 'Salida'}).`);

      const upstreamEvidences = sanitizePublicEvidenceList(
        upstreamSteps.flatMap((st) => (Array.isArray(st.evidences) ? st.evidences : [])),
      );
      const evidencesPromptDirective = buildScraperEvidencesPromptBlock(upstreamEvidences);

      const hasDownstreamPostIfSim =
        !ifHasEvaluated &&
        downstreamSteps.some(
          (s) =>
            s.category === 'condition' ||
            s.nodeKey === 'if_router' ||
            s.nodeKey === 'if_condition' ||
            s.nodeId === 'if_condition',
        );
      const simIfCfgForAgent = resolveNodeConfig('if_router', 'if_condition');
      const simIfConditionLabel = String(
        simIfCfgForAgent.ifConditionLabel ||
          simIfCfgForAgent.customTitle ||
          simIfCfgForAgent.title ||
          simIfCfgForAgent.customInstruction ||
          simIfCfgForAgent.ifRuleExpression ||
          wf?.ifConditionLabel ||
          '',
      ).trim();
      const simPostAgentIfDirective = hasDownstreamPostIfSim
        ? `\n\n🔀 [CONTRATO OBLIGATORIO DE COMPUERTA CONDICIONAL POST-AGENTE]: Evalúa estrictamente la condición "${simIfConditionLabel || '¿Existen hallazgos críticos que requieran escalamiento?'}" y escribe en la ÚLTIMA LÍNEA de tu respuesta exactamente [VEREDICTO_IF: SI] (si se cumple) o [VEREDICTO_IF: NO] (si NO se cumple / todo está al día / es observación menor).`
        : '';

      const fullAgentPrompt =
        `[CONTEXTO DE EMPRESA ACTIVA]: "${companyName}" (NIT: ${automationCompany?.nit || 'N/A'})\n` +
        connectedMemoriesPromptBlock +
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
        `REGLA DE LENGUAJE EJECUTIVO LIMPIO: Usa SIEMPRE los nombres ejecutivos en español de los módulos y conectores. ESTÁ PROHIBIDO mostrar identificadores técnicos internos crudos (como \`extract_drive\`, \`extract_ai_doc_ocr\`, \`hito2_perfil_socio\`, \`hito7_investigacion_atel\`, \`somos_sst_update\`, \`if_router\` o \`pre_agent\`) en el texto final.\n` +
        `Entrega una respuesta ejecutiva en Markdown clara, concisa y estructurada (con titular \`#\`, resumen ejecutivo, tabla de datos/hallazgos si aplica y plan de acción numerado) apta para enviarse directamente a correo electrónico, chat de Tenshi y Centro de Control, usando fielmente los datos reales extraídos y SIN explicar el funcionamiento ni los pasos internos de cada nodo del flujo.${simPostAgentIfDirective}`;

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
        useWebSearch:
          connectedNodeIds.has('web_search') || connectedNodeIds.has('extract_web_search'),
        timeoutMs: 60000,
      });

      let agentResponseText = agentExec.text;
      if (!agentResponseText) {
        const criticalSample = agentInputItems
          .filter((it) => {
            const rawStr = JSON.stringify(it || {}).toLowerCase();
            return /vencid|crític|próxim|por vencer|pendiente|restric|no apto|incumpl|hallazgo/i.test(
              rawStr,
            );
          })
          .slice(0, 15);
        const rowsForFallback = (criticalSample.length > 0 ? criticalSample : agentInputItems).slice(
          0,
          12,
        );
        const contingencyTable =
          rowsForFallback.length > 0
            ? `| Trabajador / Elemento | Detalle / Cargo | Estado / Hallazgo |\n` +
              `| :--- | :--- | :--- |\n` +
              rowsForFallback
                .map((r) => {
                  const name =
                    r.nombre ||
                    r.trabajador ||
                    r.archivo ||
                    r.documento ||
                    r.elemento ||
                    r.vehiculo ||
                    r.empresa ||
                    'Registro';
                  const detail =
                    r.cargo ||
                    r.area ||
                    r.fechaVencimiento ||
                    r.fecha ||
                    r.motivo ||
                    r.tipo ||
                    '—';
                  const st =
                    r.estado ||
                    r.estadoEmo ||
                    r.estadoAlturas ||
                    r.estadoPortal ||
                    r.nivelRiesgo ||
                    r.hallazgo ||
                    'Revisar en módulo';
                  return `| ${String(name).replace(/\|/g, '/').slice(0, 50)} | ${String(detail).replace(/\|/g, '/').slice(0, 50)} | ${String(st).replace(/\|/g, '/').slice(0, 60)} |`;
                })
                .join('\n')
            : '';

        agentResponseText =
          `# Informe de Contingencia SG-SST — ${companyName}\n\n` +
          `> ⚠️ **Aviso de Contingencia del Modelo IA:** El modelo de IA no devolvió respuesta narrativa en esta corrida de prueba (${agentExec.error || 'sobrecarga temporal en Google API'}). Se presenta el consolidado directo de los **${totalExtractedRecords} registros** y **${totalCriticalRecords} hallazgos críticos** auditados. Puedes ver el detalle técnico de cada nodo en la sección **PASOS DEL FLUJO** inferior.\n\n` +
          `## Resumen Ejecutivo de Registros Auditados\n\n` +
          `- **Empresa:** ${companyName}\n` +
          `- **Registros inspeccionados:** ${totalExtractedRecords}\n` +
          `- **Hallazgos / alertas detectadas:** ${totalCriticalRecords}\n` +
          `- **Módulos consultados:** ${connectedDataTitles || 'Disparador'}\n\n` +
          (contingencyTable ? `## Muestras de Registros y Hallazgos\n\n${contingencyTable}\n` : '');
      }

      if (upstreamEvidences.length > 0) {
        agentResponseText = stripAgentInlineEvidenceNoise(agentResponseText, upstreamEvidences);
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
        responseMarkdown: agentResponseText,
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

    // 7. NODO DE SALIDA / BITÁCORA (output — Respeta rama activa de Condición Si/No y Bloquea envío en Modo Sandbox)
    if (category === 'output') {
      await emitProgress({
        type: 'step_start',
        nodeKey,
        nodeId,
        category: 'output',
      });
      await pauseStep(160);
      const outCfg = resolveNodeConfig(nodeKey, nodeId);
      const outIdx = Math.max(0, configuredOutputs.indexOf(nodeId));
      const simEdges = Array.isArray(wf?.canvasLayout?.edges) ? wf.canvasLayout.edges : [];
      const expectedBranch = Boolean(wf.includeIfNode)
        ? resolveOutputBranchForIfRouter(nodeId, outIdx, configuredOutputs, nodeConfigs, simEdges)
        : null;
      const isBranchActive =
        !ifHasEvaluated ||
        !expectedBranch ||
        (expectedBranch === 'yes' && ifEvaluation.branchTaken === 'SI') ||
        (expectedBranch === 'no' && ifEvaluation.branchTaken === 'NO');

      if (!isBranchActive) {
        const expectedLabel = expectedBranch === 'no' ? 'NO' : 'SÍ';
        const skippedStep = {
          stepIndex: ++stepCounter,
          nodeKey,
          nodeId,
          category: 'output',
          title: `⏭️ ${stepCustomTitle || outputTitleMap[nodeId] || `Salida: ${nodeId}`} (Omitido — Rama ${expectedLabel})`,
          status: 'skipped',
          durationMs: 4,
          recordsCount: 0,
          surgicalFields: [],
          inputSummary: `Conectado a la Rama [${expectedLabel}] de Condición Si/No (rama activa en esta corrida: [${ifEvaluation.branchTaken}])`,
          inputContext: `Conectado a la Rama [${expectedLabel}] de Condición Si/No (rama activa en esta corrida: [${ifEvaluation.branchTaken}])`,
          outputPreview: `⏭️ [RAMA ${expectedLabel} NO ACTIVA]: Condición Si/No tomó la Rama [${ifEvaluation.branchTaken}], por lo que esta salida de la Rama [${expectedLabel}] se omite limpiamente.`,
          sourceNodeKey: 'if_router',
          sourceNodeTitle: 'Condición Si/No',
          inputItems: [],
          outputItems: [],
          logs: [
            {
              timestamp: new Date().toISOString(),
              level: 'info',
              message: `Salida omitida porque pertenece a la Rama [${expectedLabel}] y Condición Si/No evaluó [${ifEvaluation.branchTaken}].`,
            },
          ],
          error: null,
        };
        nodeTrace.push(skippedStep);
        await emitProgress({
          type: 'step_done',
          nodeKey,
          nodeId,
          step: skippedStep,
        });
        continue;
      }

      const outIncomingItems = currentPipelineItems.slice(0, 300);
      const outSource = { ...lastProducerNode };
      const currentShortSummary = String(finalResponse || previousAgentResponse || '')
        .replace(/[#*_`]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 260);
      const outSubject =
        outCfg.emailSubject ||
        `📊 [VISTA PREVIA DESARROLLO] Reporte Automático SGSST: ${flowName} - ${companyName}`;
      const outOutputItems = [
        {
          index: 1,
          canal: nodeId,
          tituloCanal: outputTitleMap[nodeId] || stepCustomTitle || nodeId,
          destinatarios: nodeId === 'email_report' ? validEmails : [],
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
              nodeId === 'email_report' && validEmails.length > 0
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

  const allSimulationEvidences = sanitizePublicEvidenceList(
    nodeTrace.flatMap((n) => (Array.isArray(n.evidences) ? n.evidences : [])),
  );
  if (allSimulationEvidences.length > 0) {
    finalResponse = stripAgentInlineEvidenceNoise(finalResponse, allSimulationEvidences);
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

  const simulatedOutputs = {
    emailPreview: {
      enabled: connectedOutputsList.includes('email_report'),
      blocked: true,
      from: process.env.EMAIL_NOTIFICATIONS_FROM || 'notificaciones@wappy.club',
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
        connectedOutputsList.includes('google_docs') ||
        connectedOutputsList.includes('google_sheets') ||
        connectedOutputsList.includes('google_slides') ||
        connectedOutputsList.includes('google_calendar') ||
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
    finalResponseMarkdown: finalResponse,
    finalResponseHtml: formatMarkdownToEmailHtml(finalResponse),
    nodeTrace,
    evidenceFiles: allSimulationEvidences,
    evidences: allSimulationEvidences,
    agentOutputs,
    ifEvaluation,
    simulatedOutputs,
    interceptedOutputs: simulatedOutputs,
    stats: {
      totalSteps: nodeTrace.length,
      completedSteps: nodeTrace.filter((n) => n.status === 'completed').length,
      skippedSteps: nodeTrace.filter((n) => n.status === 'skipped').length,
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
  getActiveRunningSnapshot,
  reconcileOrphanedRunningRuns,
  formatMarkdownToEmailHtml,
  saveScraperEvidenceFiles,
  sanitizePublicEvidenceList,
  stripAgentInlineEvidenceNoise,
  isUnderConstructionNode,
  calculateNextRun,
  stopAutomation,
  hasCronTrigger,
  normalizeTriggerMatchText,
  stripTriggerCommandVerbs,
  getAutomationTriggersList,
  getTriggerNodeConfig,
  extractAutomationTriggerConfigs,
  resolveAutomationByVoiceOrQuery,
  isAgentToolHitoRole,
  resolveRequiredToolsForWorkflow,
  sstAppSourceAliasMap,
  dispatchQrWorkerAutomations,
  matchesQrPortalFilter,
  matchesQrSeverityFilter,
  checkEmailTriggeredAutomations,
  dispatchAgentTriggeredAutomations,
  executeDownstreamOutputs,
  isSafePublicHttpsUrl,
  fetchSafeWebhookApiData,
  loadProcessedEntityKeysForAutomation,
  evaluatePreAgentDeterministicIf,
  evaluatePostAgentSemanticIf,
};

