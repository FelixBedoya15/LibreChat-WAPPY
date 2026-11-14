'use strict';

const mongoose = require('mongoose');

const DEFAULT_QUERY_MAX_TIME_MS = 650;
const DEFAULT_LOOKUP_MAX_TIME_MS = 350;
const AUTOMATION_DEDUP_WINDOW_MS = 15000;
const GENERAL_DEDUP_WINDOW_MS = 60000;

const GENERIC_CHAT_TITLES = [
  'New Chat',
  'new chat',
  'Nueva conversación',
  'Nueva conversacion',
  'Nuevo chat',
  'Untitled',
  '',
  null,
];

const GENERIC_LIVE_EDITOR_TITLES = [
  'Archivo sin título',
  'Archivo sin titulo',
  'Documento sin título',
  'Documento sin titulo',
  'Sin título',
  'Sin titulo',
  '',
  null,
];

const GENERIC_CANVAS_TITLES = [
  'Archivo de Canvas sin título',
  'Archivo de Canvas sin titulo',
  'Sin título',
  'Sin titulo',
  '',
  null,
];

const INTERNAL_CONVO_TAGS = new Set([
  'sgsst-mood',
  'sgsst-psicosocial',
  'sgsst-termometro',
]);

const GREETING_ONLY_REGEX =
  /^(?:hola+|buenos?\s+dias?|buenas?\s+(?:tardes?|noches?)|saludos?|que\s+(?:tal|hubo|mas(?:\s+pues)?)|como\s+estas?|como\s+vas|te\s+escucho|me\s+escuchas|probando|test|ok+|oki+|dale|listo|si+|no+|gracias|muchas\s+gracias|perfecto|vale|entendido|claro|super|bien|excelente|genial)(?:\s+(?:tenshi|suri|wappy|ia|amigo|parce|parcero|felix|por\s+favor|muchas\s+gracias|gracias|como\s+estas?|todo\s+bien|de\s+acuerdo))*$/i;

const VOICE_ECHO_PHRASE_REGEX =
  /(?:\bte\s+escucho\b.*\bdime\s+que\s+necesitas\b|\bde\s+acuerdo[,.\s]+te\s+escucho\b|\bcomo\s+te\s+(?:fue|termino\s+de\s+ir)\s+con\b|\ben\s+que\s+te\s+(?:puedo\s+ayudar|colaboro|ayudo)\b|\bsoy\s+tu\s+(?:asistente|copiloto)\s+(?:en\s+)?s[gq]?-?sst\b)/i;

const CANVAS_TYPE_LABELS = {
  text: 'Documento',
  excel: 'Hoja de Cálculo',
  presentation: 'Presentación',
  html: 'Aplicativo Web',
  animo: 'Termómetro Psicosocial',
  actos_condiciones: 'Actos y Condiciones',
};

const KANBAN_STATUS_LABELS = {
  done: 'completada',
  in_progress: 'en curso',
  overdue: 'vencida',
  due_soon: 'próxima a vencer',
  todo: 'pendiente',
};

const STOP_WORDS = new Set([
  'para',
  'como',
  'sobre',
  'desde',
  'hasta',
  'entre',
  'estudio',
  'puesto',
  'trabajo',
  'informe',
  'documento',
  'matriz',
  'empresa',
  'sistema',
  'sgsst',
  'wappy',
  'oficial',
  'general',
  'reporte',
]);

const failedRequirePaths = new Set();

/**
 * Resuelve de forma segura un modelo Mongoose intentando primero el registro activo
 * en `mongoose.models[modelName]` y haciendo fallback a `require(requirePath)`.
 */
function resolveModel(modelName, requirePath) {
  if (!modelName) {
    return null;
  }
  if (mongoose.models && mongoose.models[modelName]) {
    return mongoose.models[modelName];
  }
  if (!requirePath || failedRequirePaths.has(requirePath)) {
    return null;
  }
  try {
    const mod = require(requirePath);
    if (mongoose.models && mongoose.models[modelName]) {
      return mongoose.models[modelName];
    }
    if (mod && (typeof mod.findOne === 'function' || typeof mod.find === 'function')) {
      return mod;
    }
    if (
      mod &&
      mod[modelName] &&
      (typeof mod[modelName].findOne === 'function' || typeof mod[modelName].find === 'function')
    ) {
      return mod[modelName];
    }
  } catch (_) {
    failedRequirePaths.add(requirePath);
    // Silencioso para soportar ejecuciones aisladas o scripts de prueba sin todas las rutas cargadas
  }
  return null;
}

function getBogotaDateParts(date) {
  const colDate = date.toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
  const colYear = colDate.slice(0, 4);
  return { colDate, colYear };
}

/**
 * Formatea una fecha en español colombiano (`America/Bogota`) de forma relativa/compacta.
 */
function formatRelativeActivityDate(dateInput) {
  if (!dateInput) {
    return '';
  }
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  const ts = date.getTime();
  if (!Number.isFinite(ts) || ts <= 0) {
    return '';
  }

  const now = new Date();
  const diffMs = now.getTime() - ts;

  if (diffMs >= -5000 && diffMs < 60000) {
    return 'Hace un momento';
  }
  if (diffMs >= 60000 && diffMs < 3600000) {
    const mins = Math.max(1, Math.floor(diffMs / 60000));
    return `Hace ${mins} min`;
  }

  const { colDate: itemDate, colYear: itemYear } = getBogotaDateParts(date);
  const { colDate: todayDate, colYear: todayYear } = getBogotaDateParts(now);
  const yesterdayRef = new Date(now.getTime() - 24 * 3600 * 1000);
  const { colDate: yesterdayDate } = getBogotaDateParts(yesterdayRef);

  const timeStr = date.toLocaleTimeString('es-CO', {
    timeZone: 'America/Bogota',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  if (itemDate === todayDate) {
    return `Hoy, ${timeStr}`;
  }
  if (itemDate === yesterdayDate) {
    return `Ayer, ${timeStr}`;
  }

  return date.toLocaleDateString('es-CO', {
    timeZone: 'America/Bogota',
    day: 'numeric',
    month: 'short',
    ...(itemYear !== todayYear ? { year: 'numeric' } : {}),
  });
}

function normalizeAscii(str) {
  return String(str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function truncateText(text, maxLen = 85) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  if (!clean) {
    return '';
  }
  if (clean.length <= maxLen) {
    return clean;
  }
  return `${clean.slice(0, maxLen - 1).trimEnd()}…`;
}

function isGenericTitle(rawTitle) {
  const clean = String(rawTitle || '').trim();
  if (!clean) {
    return true;
  }
  return /^(new chat|nueva conversaci[oó]n|nuevo chat|untitled|archivo sin t[ií]tulo|documento sin t[ií]tulo|archivo de canvas sin t[ií]tulo|sin t[ií]tulo)$/i.test(
    clean,
  );
}

function isMeaningfulUserPrompt(rawText) {
  if (typeof rawText !== 'string') {
    return false;
  }
  const clean = rawText.replace(/\s+/g, ' ').trim();
  if (!clean || clean.startsWith('[RESULTADO_GUI]') || clean.length < 15) {
    return false;
  }
  const norm = normalizeAscii(clean)
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!norm || norm.length < 10) {
    return false;
  }
  if (GREETING_ONLY_REGEX.test(norm) || VOICE_ECHO_PHRASE_REGEX.test(norm)) {
    return false;
  }
  return true;
}

function cleanChatTitle(rawTitle) {
  const original = String(rawTitle || '').trim();
  if (!original) {
    return '';
  }
  const stripped = original.replace(/^\[.*?\]\s*/, '').trim();
  const candidate = stripped || original;
  return isGenericTitle(candidate) ? '' : candidate;
}

function stripHtmlTags(raw) {
  return String(raw || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function normalizeCoreTitle(raw) {
  return normalizeAscii(raw)
    .replace(
      /^(?:en ejecucion|esperando aprobacion|con error|flujo ejecutado|flujo rechazado|flujo actualizado|flujo activado|flujo pausado|flujo creado|delegacion|estudio ergonomico|informe|reporte|mensaje en chat sst|curso completado|curso en progreso|inscripcion a evento|evaluacion owas|investigacion atel|permiso de alturas|equipos de alturas|entrega epp|solicitud epp|brigadista|acta copasst|inspeccion copasst|acta convivencia|caso convivencia|vehiculo pesv|colaborador|ats)\s*:\s*/i,
      '',
    )
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractSignificantTokens(raw) {
  const core = normalizeCoreTitle(raw);
  if (!core) {
    return [];
  }
  return core
    .split(' ')
    .filter((w) => w.length >= 4 && !STOP_WORDS.has(w));
}

function hasSignificantTokenOverlap(titleA, titleB) {
  const tokensA = extractSignificantTokens(titleA);
  const tokensB = extractSignificantTokens(titleB);
  if (tokensA.length === 0 || tokensB.length === 0) {
    return false;
  }
  const setB = new Set(tokensB);
  const matches = tokensA.filter((t) => setB.has(t)).length;
  const minLen = Math.min(tokensA.length, tokensB.length);
  if (minLen === 1) {
    return matches >= 1;
  }
  return matches >= 2 || matches / minLen >= 0.5;
}

function extractTimestampMs(doc, preferredFields = []) {
  if (!doc || typeof doc !== 'object') {
    return 0;
  }
  const fields = [...preferredFields, 'updatedAt', 'createdAt'];
  for (const field of fields) {
    const val = doc[field];
    if (!val) {
      continue;
    }
    const ms = new Date(val).getTime();
    if (Number.isFinite(ms) && ms > 0) {
      return ms;
    }
  }
  if (doc._id && typeof doc._id.getTimestamp === 'function') {
    const ms = doc._id.getTimestamp().getTime();
    if (Number.isFinite(ms) && ms > 0) {
      return ms;
    }
  }
  return 0;
}

function buildContext({ userId, companyId, viewerRole }) {
  const rawUserId =
    userId &&
    typeof userId === 'object' &&
    !(userId instanceof mongoose.Types.ObjectId) &&
    typeof userId.toHexString !== 'function'
      ? userId.id || userId._id
      : userId;
  const uidStr = rawUserId ? String(rawUserId).trim() : '';
  const uidObj =
    uidStr && /^[a-f0-9]{24}$/i.test(uidStr) ? new mongoose.Types.ObjectId(uidStr) : null;

  const rawCompanyId =
    companyId &&
    typeof companyId === 'object' &&
    !(companyId instanceof mongoose.Types.ObjectId) &&
    typeof companyId.toHexString !== 'function'
      ? companyId.id || companyId._id
      : companyId;
  const cidStr = rawCompanyId ? String(rawCompanyId).trim() : '';
  const cidObj =
    cidStr && /^[a-f0-9]{24}$/i.test(cidStr) ? new mongoose.Types.ObjectId(cidStr) : null;

  const isAdmin = String(viewerRole || '').trim().toUpperCase() === 'ADMIN';

  function resolveUserValue(Model, field = 'user') {
    const instance = Model?.schema?.path?.(field)?.instance;
    if (instance === 'String') {
      return uidStr;
    }
    return uidObj || uidStr;
  }

  function resolveCompanyCondition(Model, { allowNullLegacy = true } = {}) {
    const instance = Model?.schema?.path?.('companyId')?.instance;
    if (cidStr) {
      if (instance === 'ObjectId') {
        if (!cidObj) {
          return { invalid: true };
        }
        return { condition: cidObj };
      }
      return {
        condition: cidObj ? { $in: [cidStr, cidObj] } : cidStr,
      };
    }

    if (!allowNullLegacy) {
      return { invalid: true };
    }

    if (instance === 'ObjectId') {
      return { condition: null };
    }
    if (instance === 'String') {
      return { condition: { $in: [null, ''] } };
    }
    return { condition: { $in: [null, ''] } };
  }

  function userAndCompanyFilter(Model, opts = {}) {
    const {
      userField = 'user',
      allowNullLegacy = true,
      skipUserWhenCompanyActive = false,
    } = opts;
    const comp = resolveCompanyCondition(Model, { allowNullLegacy });
    if (comp.invalid) {
      return null;
    }
    if (skipUserWhenCompanyActive && cidStr) {
      return { companyId: comp.condition };
    }
    return {
      [userField]: resolveUserValue(Model, userField),
      companyId: comp.condition,
    };
  }

  return {
    uidStr,
    uidObj,
    cidStr,
    cidObj,
    viewerRole: String(viewerRole || ''),
    isAdmin,
    resolveUserValue,
    resolveCompanyCondition,
    userAndCompanyFilter,
  };
}

function formatAutomationLogTitle(status, flowName) {
  switch (status) {
    case 'running':
      return `En ejecución: ${flowName}`;
    case 'awaiting_approval':
      return `Esperando aprobación: ${flowName}`;
    case 'failed':
      return `Con error: ${flowName}`;
    case 'rejected':
      return `Flujo rechazado: ${flowName}`;
    case 'success':
    default:
      return `Flujo ejecutado: ${flowName}`;
  }
}

function formatAutomationLogStatus(status) {
  switch (status) {
    case 'running':
      return 'en ejecución';
    case 'awaiting_approval':
      return 'pendiente aprobación';
    case 'failed':
      return 'con error';
    case 'rejected':
      return 'rechazado';
    case 'success':
    default:
      return 'ejecutado';
  }
}

/**
 * Registro declarativo unificado de todas las fuentes de actividad real del sistema.
 */
const ACTIVITY_SOURCE_DESCRIPTORS = [
  // ── 1. Flujos y Automatizaciones (/tareas) ───────────────────────────────
  {
    key: 'automation_log',
    modelName: 'AutomationLog',
    requirePath: '../../models/AutomationLog',
    mode: 'find',
    limit: 3,
    priority: 100,
    sort: { updatedAt: -1, runAt: -1, createdAt: -1 },
    select: 'automation status agentName tenshiFlowName triggerSource runAt updatedAt createdAt',
    buildFilter: (ctx, Model) => {
      const scope = ctx.userAndCompanyFilter(Model, { allowNullLegacy: true });
      if (!scope) return null;
      return {
        ...scope,
        isTenshiFlow: { $ne: true },
      };
    },
    enrichDocs: async (docs, ctx) => {
      const autoIds = docs.map((d) => d.automation).filter(Boolean);
      const map = new Map();
      if (autoIds.length > 0) {
        const AutomationModel = resolveModel('Automation', '../../models/Automation');
        if (AutomationModel && typeof AutomationModel.find === 'function') {
          try {
            let q = AutomationModel.find({ _id: { $in: autoIds } });
            if (typeof q.select === 'function') q = q.select('name presetCategory agentName adminOnly');
            if (typeof q.maxTimeMS === 'function') q = q.maxTimeMS(DEFAULT_LOOKUP_MAX_TIME_MS);
            if (typeof q.lean === 'function') q = q.lean();
            const autos = await q;
            for (const a of autos || []) {
              map.set(String(a._id), a);
            }
          } catch (_) {
            // Fallback seguro al nombre embebido en el log
          }
        }
      }
      ctx._autoById = map;
    },
    mapDoc: (doc, ctx) => {
      const auto = doc.automation ? ctx._autoById?.get(String(doc.automation)) : null;
      if (auto?.adminOnly && !ctx.isAdmin) {
        return null;
      }
      const flowName = String(
        auto?.name || doc.tenshiFlowName || doc.agentName || 'Flujo automatizado',
      ).trim();
      const ts = extractTimestampMs(doc, ['updatedAt', 'runAt', 'createdAt']);
      if (!ts) return null;
      return {
        tipo: 'automatizacion',
        modulo: 'Flujos (/tareas)',
        categoria: 'automatizaciones',
        titulo: formatAutomationLogTitle(doc.status, flowName),
        detalle: doc.triggerSource ? `Origen: ${doc.triggerSource}` : auto?.agentName || doc.agentName || '',
        estado: formatAutomationLogStatus(doc.status),
        ts,
        _meta: {
          key: 'automation_log',
          priority: 100,
          automationId: doc.automation ? String(doc.automation) : '',
          coreTitle: normalizeCoreTitle(flowName),
        },
      };
    },
  },
  {
    key: 'automation',
    modelName: 'Automation',
    requirePath: '../../models/Automation',
    mode: 'find',
    limit: 3,
    priority: 55,
    sort: { updatedAt: -1, createdAt: -1 },
    select: 'name status agentName presetCategory adminOnly updatedAt createdAt',
    buildFilter: (ctx, Model) => {
      const scope = ctx.userAndCompanyFilter(Model, {
        allowNullLegacy: true,
        skipUserWhenCompanyActive: Boolean(ctx.cidStr),
      });
      if (!scope) return null;
      return {
        ...scope,
        isSystemPreset: { $ne: true },
        isTenshiFlow: { $ne: true },
        ...(ctx.isAdmin ? {} : { adminOnly: { $ne: true } }),
      };
    },
    mapDoc: (doc) => {
      const name = String(doc.name || '').trim();
      if (!name || isGenericTitle(name)) return null;
      const updatedMs = extractTimestampMs(doc, ['updatedAt', 'createdAt']);
      if (!updatedMs) return null;
      const createdMs = doc.createdAt ? new Date(doc.createdAt).getTime() : 0;

      let prefix = 'Flujo actualizado';
      let estado = doc.status || 'active';
      if (doc.status === 'inactive' || doc.status === 'paused_error') {
        prefix = 'Flujo pausado';
        estado = doc.status === 'paused_error' ? 'pausado por error' : 'pausado';
      } else if (createdMs && Math.abs(updatedMs - createdMs) < 5000) {
        prefix = doc.status === 'active' ? 'Flujo activado' : 'Flujo creado';
        estado = doc.status === 'active' ? 'activo' : String(doc.status || 'creado');
      } else if (doc.status === 'active') {
        prefix = 'Flujo actualizado';
        estado = 'activo';
      }

      return {
        tipo: 'automatizacion',
        modulo: 'Flujos (/tareas)',
        categoria: 'automatizaciones',
        titulo: `${prefix}: ${name}`,
        detalle: doc.agentName ? `Agente: ${doc.agentName}` : '',
        estado,
        ts: updatedMs,
        _meta: {
          key: 'automation',
          priority: 55,
          automationId: doc._id ? String(doc._id) : '',
          coreTitle: normalizeCoreTitle(name),
        },
      };
    },
  },

  // ── 2. Centro de Control ACPM / Agenda / Delegaciones ────────────────────
  {
    key: 'kanban_task',
    modelName: 'KanbanTask',
    requirePath: '../../models/KanbanTask',
    mode: 'find',
    limit: 3,
    priority: 72,
    sort: { updatedAt: -1, createdAt: -1 },
    select: 'title status type actionType priority sourceModule referenceName updatedAt createdAt',
    buildFilter: (ctx, Model) => {
      const scope = ctx.userAndCompanyFilter(Model, { allowNullLegacy: true });
      if (!scope) return null;
      return {
        ...scope,
        status: { $ne: 'dismissed' },
        title: { $nin: ['New Chat', 'new chat', '', null] },
      };
    },
    mapDoc: (doc) => {
      const cleanTitle = String(doc.title || '').trim();
      if (!cleanTitle || isGenericTitle(cleanTitle)) return null;
      const ts = extractTimestampMs(doc, ['updatedAt', 'createdAt']);
      if (!ts) return null;

      const isDelegation = doc.type === 'antigravity_delegation';
      const titulo = isDelegation && !/^delegaci[oó]n\s*:/i.test(cleanTitle)
        ? `Delegación: ${cleanTitle}`
        : cleanTitle;
      const detalle = [
        doc.actionType || '',
        doc.priority ? `Prioridad ${doc.priority}` : '',
        doc.referenceName || '',
      ]
        .filter(Boolean)
        .join(' · ');

      return {
        tipo: isDelegation ? 'delegacion' : 'tarea',
        modulo: isDelegation ? 'Delegación Antigravity' : doc.sourceModule || 'Centro de Control ACPM',
        categoria: isDelegation ? 'delegaciones' : 'agenda_acpm',
        titulo,
        detalle,
        estado: KANBAN_STATUS_LABELS[doc.status] || String(doc.status || 'activa'),
        ts,
        _meta: {
          key: 'kanban_task',
          priority: 72,
          coreTitle: normalizeCoreTitle(cleanTitle),
        },
      };
    },
  },

  // ── 3. Chats y Mensajes ──────────────────────────────────────────────────
  {
    key: 'conversation',
    modelName: 'Conversation',
    requirePath: '../../db/models',
    mode: 'find',
    limit: 15,
    priority: 50,
    sort: { updatedAt: -1, createdAt: -1 },
    select: 'conversationId title tags agent_id expiredAt updatedAt createdAt',
    buildFilter: (ctx) => ({
      user: ctx.uidStr,
      title: { $nin: GENERIC_CHAT_TITLES },
    }),
    mapDocs: (docs, ctx) => {
      const nowMs = Date.now();
      const results = [];
      for (const doc of docs) {
        if (doc.expiredAt && new Date(doc.expiredAt).getTime() <= nowMs) {
          continue;
        }
        const tags = Array.isArray(doc.tags) ? doc.tags : [];
        if (tags.some((t) => INTERNAL_CONVO_TAGS.has(String(t)))) {
          continue;
        }
        const companyTags = tags.filter(
          (t) => typeof t === 'string' && (t.startsWith('company-') || t.startsWith('company:')),
        );
        if (ctx.cidStr) {
          const matchesCompany =
            companyTags.length === 0 ||
            companyTags.includes(`company-${ctx.cidStr}`) ||
            companyTags.includes(`company:${ctx.cidStr}`);
          if (!matchesCompany) {
            continue;
          }
        } else if (companyTags.length > 0) {
          continue;
        }

        const cleanTitle = cleanChatTitle(doc.title);
        if (!cleanTitle) {
          continue;
        }
        const ts = extractTimestampMs(doc, ['updatedAt', 'createdAt']);
        if (!ts) {
          continue;
        }
        results.push({
          tipo: 'chat',
          modulo: 'Chat Agentes IA',
          categoria: 'chat',
          titulo: cleanTitle,
          detalle: doc.agent_id ? 'Conversación con especialista IA' : 'Conversación activa',
          estado: 'activa',
          ts,
          _meta: {
            key: 'conversation',
            priority: 50,
            conversationId: doc.conversationId ? String(doc.conversationId) : '',
            coreTitle: normalizeCoreTitle(cleanTitle),
          },
        });
        if (results.length >= 3) {
          break;
        }
      }
      return results;
    },
  },
  {
    key: 'tenshi_report',
    modelName: 'TenshiMessage',
    requirePath: '../../models/TenshiMessage',
    mode: 'find',
    limit: 3,
    priority: 80,
    sort: { createdAt: -1, updatedAt: -1 },
    select: 'file.title file.fileType report.titulo report.aplicativo qrCode.titulo qrCode.tipo createdAt updatedAt',
    buildFilter: (ctx, Model) => {
      const scope = ctx.userAndCompanyFilter(Model, { allowNullLegacy: true });
      if (!scope) return null;
      return {
        ...scope,
        $or: [
          { 'file.title': { $exists: true, $nin: GENERIC_CHAT_TITLES } },
          { 'report.titulo': { $exists: true, $nin: GENERIC_CHAT_TITLES } },
          { 'qrCode.titulo': { $exists: true, $nin: GENERIC_CHAT_TITLES } },
        ],
      };
    },
    mapDoc: (doc) => {
      const rawTitle = doc.file?.title || doc.report?.titulo || doc.qrCode?.titulo || '';
      const title = cleanChatTitle(rawTitle);
      if (!title) return null;
      const ts = extractTimestampMs(doc, ['createdAt', 'updatedAt']);
      if (!ts) return null;

      const detalle = doc.report?.aplicativo
        ? `Aplicativo: ${doc.report.aplicativo}`
        : doc.qrCode?.tipo
          ? `QR: ${doc.qrCode.tipo}`
          : doc.file?.fileType
            ? `Formato: ${doc.file.fileType}`
            : '';

      return {
        tipo: 'informe',
        modulo: 'Entregables Tenshi',
        categoria: 'informes',
        titulo: title,
        detalle,
        estado: 'generado',
        ts,
        _meta: {
          key: 'tenshi_report',
          priority: 80,
          coreTitle: normalizeCoreTitle(title),
        },
      };
    },
  },
  {
    key: 'tenshi_prompt',
    modelName: 'TenshiMessage',
    requirePath: '../../models/TenshiMessage',
    mode: 'find',
    limit: 8,
    priority: 45,
    sort: { createdAt: -1 },
    select: 'content createdAt updatedAt',
    buildFilter: (ctx, Model) => {
      const scope = ctx.userAndCompanyFilter(Model, { allowNullLegacy: true });
      if (!scope) return null;
      return {
        ...scope,
        role: 'user',
      };
    },
    mapDocs: (docs) => {
      for (const doc of docs) {
        if (!isMeaningfulUserPrompt(doc.content)) {
          continue;
        }
        const ts = extractTimestampMs(doc, ['createdAt', 'updatedAt']);
        if (!ts) continue;
        const snippet = truncateText(doc.content, 85);
        return [
          {
            tipo: 'chat_tenshi',
            modulo: 'Chat con Tenshi',
            categoria: 'chat',
            titulo: snippet,
            detalle: 'Consulta directa en Tenshi',
            estado: 'enviado',
            ts,
            _meta: {
              key: 'tenshi_prompt',
              priority: 45,
              coreTitle: normalizeCoreTitle(snippet),
            },
          },
        ];
      }
      return [];
    },
  },
  {
    key: 'chat_sst_message',
    modelName: 'ChatSSTMessage',
    requirePath: '../../models/ChatSSTMessage',
    mode: 'find',
    limit: 3,
    priority: 42,
    sort: { createdAt: -1, updatedAt: -1 },
    select: 'content senderName groupId createdAt updatedAt',
    buildFilter: (ctx, Model) => ({
      user: ctx.resolveUserValue(Model),
      senderRole: 'user',
    }),
    mapDocs: (docs) => {
      for (const doc of docs) {
        if (!isMeaningfulUserPrompt(doc.content)) {
          continue;
        }
        const ts = extractTimestampMs(doc, ['createdAt', 'updatedAt']);
        if (!ts) continue;
        const snippet = truncateText(doc.content, 75);
        return [
          {
            tipo: 'chat_sst',
            modulo: 'Chat SST Comunitario',
            categoria: 'chat',
            titulo: `Mensaje en Chat SST: ${snippet}`,
            detalle: doc.groupId ? 'Mensaje en grupo SST' : 'Mensaje en chat comunitario',
            estado: 'enviado',
            ts,
            _meta: {
              key: 'chat_sst_message',
              priority: 42,
              coreTitle: normalizeCoreTitle(snippet),
            },
          },
        ];
      }
      return [];
    },
  },

  // ── 4. Workspace Creativos y Documentos ──────────────────────────────────
  {
    key: 'live_editor',
    modelName: 'LiveEditorSession',
    requirePath: '../../models/LiveEditorSession',
    mode: 'find',
    limit: 5,
    priority: 70,
    sort: { contentUpdatedAt: -1, updatedAt: -1 },
    select: 'fileName conversationId contentUpdatedAt updatedAt createdAt',
    buildFilter: (ctx, Model) => {
      const scope = ctx.userAndCompanyFilter(Model, { allowNullLegacy: true });
      if (!scope) return null;
      return {
        ...scope,
        $or: [
          { fileName: { $nin: GENERIC_LIVE_EDITOR_TITLES } },
          { content: { $exists: true, $nin: ['', null, '<p></p>', '<p><br></p>'] } },
        ],
      };
    },
    mapDocs: (docs) => {
      for (const doc of docs) {
        const rawName = String(doc.fileName || '').trim();
        const isDefaultName =
          !rawName ||
          /^(archivo sin t[ií]tulo|documento sin t[ií]tulo|sin t[ií]tulo)$/i.test(rawName);
        if (isDefaultName && typeof doc.content === 'string' && !stripHtmlTags(doc.content)) {
          continue;
        }
        const ts = extractTimestampMs(doc, ['contentUpdatedAt', 'updatedAt', 'createdAt']);
        if (!ts) continue;
        const title = isDefaultName ? 'Documento en Editor en Vivo' : rawName;
        return [
          {
            tipo: 'documento',
            modulo: 'Editor en Vivo',
            categoria: 'documentos',
            titulo: title,
            detalle: 'Documento editado',
            estado: 'editado',
            ts,
            _meta: {
              key: 'live_editor',
              priority: 70,
              conversationId: doc.conversationId ? String(doc.conversationId) : '',
              coreTitle: normalizeCoreTitle(title),
            },
          },
        ];
      }
      return [];
    },
  },
  {
    key: 'canvas_session',
    modelName: 'CanvasSession',
    requirePath: '../../models/CanvasSession',
    mode: 'find',
    limit: 3,
    priority: 65,
    sort: { updatedAt: -1, createdAt: -1 },
    select: 'title fileType conversationId updatedAt createdAt',
    buildFilter: (ctx, Model) => {
      const scope = ctx.userAndCompanyFilter(Model, { allowNullLegacy: true });
      if (!scope) return null;
      return {
        ...scope,
        $or: [
          { title: { $nin: GENERIC_CANVAS_TITLES } },
          { content: { $exists: true, $nin: ['', null], $ne: [] } },
        ],
      };
    },
    mapDocs: (docs) => {
      for (const doc of docs) {
        const rawTitle = String(doc.title || '').trim();
        const isDefault =
          !rawTitle ||
          /^(archivo de canvas sin t[ií]tulo|sin t[ií]tulo)$/i.test(rawTitle);
        if (
          isDefault &&
          doc.content !== undefined &&
          (!doc.content || (Array.isArray(doc.content) && doc.content.length === 0))
        ) {
          continue;
        }
        const ts = extractTimestampMs(doc, ['updatedAt', 'createdAt']);
        if (!ts) continue;
        const typeLabel = CANVAS_TYPE_LABELS[doc.fileType] || doc.fileType || 'Canvas';
        const title = isDefault ? `Archivo Canvas (${typeLabel})` : rawTitle;
        return [
          {
            tipo: 'canvas',
            modulo: 'WAPPY Canvas',
            categoria: 'documentos',
            titulo: title,
            detalle: typeLabel,
            estado: 'editado',
            ts,
            _meta: {
              key: 'canvas_session',
              priority: 65,
              conversationId: doc.conversationId ? String(doc.conversationId) : '',
              coreTitle: normalizeCoreTitle(title),
            },
          },
        ];
      }
      return [];
    },
  },
  {
    key: 'live_document',
    modelName: 'LiveDocument',
    requirePath: '../../models/LiveDocument',
    mode: 'find',
    limit: 3,
    priority: 62,
    sort: { updatedAt: -1, createdAt: -1 },
    select: 'title originalFileName originalFileType updatedAt createdAt',
    buildFilter: (ctx, Model) => {
      const scope = ctx.userAndCompanyFilter(Model, { allowNullLegacy: true });
      if (!scope) return null;
      return {
        ...scope,
        $or: [
          { title: { $nin: GENERIC_LIVE_EDITOR_TITLES } },
          { content: { $exists: true, $nin: ['', null] } },
        ],
      };
    },
    mapDocs: (docs) => {
      for (const doc of docs) {
        const rawTitle = String(doc.title || doc.originalFileName || '').trim();
        const isDefault =
          !rawTitle || /^(documento sin t[ií]tulo|sin t[ií]tulo)$/i.test(rawTitle);
        if (isDefault && typeof doc.content === 'string' && !stripHtmlTags(doc.content)) {
          continue;
        }
        const ts = extractTimestampMs(doc, ['updatedAt', 'createdAt']);
        if (!ts) continue;
        const title = isDefault ? 'Documento en Vivo' : rawTitle;
        return [
          {
            tipo: 'documento',
            modulo: 'Documentos en Vivo',
            categoria: 'documentos',
            titulo: title,
            detalle: doc.originalFileType ? `Archivo ${doc.originalFileType}` : '',
            estado: 'guardado',
            ts,
            _meta: {
              key: 'live_document',
              priority: 62,
              coreTitle: normalizeCoreTitle(title),
            },
          },
        ];
      }
      return [];
    },
  },

  // ── 5. Todos los Hitos y Módulos Somos SST ───────────────────────────────
  {
    key: 'gtc45_workspace',
    modelName: 'GTC45WorkspaceSession',
    requirePath: '../../models/GTC45WorkspaceSession',
    mode: 'find',
    limit: 3,
    priority: 82,
    sort: { updatedAt: -1, createdAt: -1 },
    select: 'officialTitle isOfficial updatedAt createdAt',
    buildFilter: (ctx, Model) => {
      const scope = ctx.userAndCompanyFilter(Model, { allowNullLegacy: true });
      if (!scope) return null;
      return {
        ...scope,
        $or: [
          { 'matrixRows.0': { $exists: true } },
          { isOfficial: true, officialTitle: { $exists: true, $nin: ['', null] } },
          { officialTitle: { $exists: true, $nin: ['', null, 'Matriz IPEVR Oficial'] } },
        ],
      };
    },
    mapDocs: (docs) => {
      for (const doc of docs) {
        if (
          Array.isArray(doc.matrixRows) &&
          doc.matrixRows.length === 0 &&
          !doc.isOfficial &&
          (!doc.officialTitle || doc.officialTitle === 'Matriz IPEVR Oficial')
        ) {
          continue;
        }
        const ts = extractTimestampMs(doc, ['updatedAt', 'createdAt']);
        if (!ts) continue;
        const title =
          doc.officialTitle && String(doc.officialTitle).trim()
            ? String(doc.officialTitle).trim()
            : 'Matriz de Peligros GTC 45';
        return [
          {
            tipo: 'matriz',
            modulo: 'Matriz GTC 45',
            categoria: 'sgsst',
            titulo: title,
            detalle: doc.isOfficial ? 'Versión oficial IPEVR' : 'Espacio de trabajo GTC 45',
            estado: 'actualizada',
            ts,
            _meta: {
              key: 'gtc45_workspace',
              priority: 82,
              coreTitle: normalizeCoreTitle(title),
            },
          },
        ];
      }
      return [];
    },
  },
  {
    key: 'pesv_workspace',
    modelName: 'PESVWorkspaceSession',
    requirePath: '../../models/PESVWorkspaceSession',
    mode: 'find',
    limit: 3,
    priority: 82,
    sort: { updatedAt: -1, createdAt: -1 },
    select: 'officialTitle isOfficial updatedAt createdAt',
    buildFilter: (ctx, Model) => {
      const scope = ctx.userAndCompanyFilter(Model, { allowNullLegacy: true });
      if (!scope) return null;
      return {
        ...scope,
        $or: [
          { 'matrixRows.0': { $exists: true } },
          { isOfficial: true },
          { officialTitle: { $exists: true, $nin: ['', null, 'Matriz PESV SG-SST'] } },
        ],
      };
    },
    mapDocs: (docs) => {
      for (const doc of docs) {
        if (
          Array.isArray(doc.matrixRows) &&
          doc.matrixRows.length === 0 &&
          !doc.isOfficial &&
          (!doc.officialTitle || doc.officialTitle === 'Matriz PESV SG-SST')
        ) {
          continue;
        }
        const ts = extractTimestampMs(doc, ['updatedAt', 'createdAt']);
        if (!ts) continue;
        const title =
          doc.officialTitle && String(doc.officialTitle).trim()
            ? String(doc.officialTitle).trim()
            : 'Matriz PESV';
        return [
          {
            tipo: 'matriz',
            modulo: 'Matriz PESV',
            categoria: 'sgsst',
            titulo: title,
            detalle: doc.isOfficial ? 'Versión oficial PESV' : 'Espacio de trabajo PESV',
            estado: 'actualizada',
            ts,
            _meta: {
              key: 'pesv_workspace',
              priority: 82,
              coreTitle: normalizeCoreTitle(title),
            },
          },
        ];
      }
      return [];
    },
  },
  {
    key: 'chemical_compat_workspace',
    modelName: 'ChemicalCompatibilitySession',
    requirePath: '../../models/ChemicalCompatibilitySession',
    mode: 'find',
    limit: 3,
    priority: 82,
    sort: { updatedAt: -1, createdAt: -1 },
    select: 'officialTitle isOfficial updatedAt createdAt',
    buildFilter: (ctx, Model) => {
      const scope = ctx.userAndCompanyFilter(Model, { allowNullLegacy: true });
      if (!scope) return null;
      return {
        ...scope,
        $or: [
          { 'matrixRows.0': { $exists: true } },
          { isOfficial: true },
          { officialTitle: { $exists: true, $nin: ['', null] } },
        ],
      };
    },
    mapDocs: (docs) => {
      for (const doc of docs) {
        if (
          Array.isArray(doc.matrixRows) &&
          doc.matrixRows.length === 0 &&
          !doc.isOfficial &&
          !String(doc.officialTitle || '').trim()
        ) {
          continue;
        }
        const ts = extractTimestampMs(doc, ['updatedAt', 'createdAt']);
        if (!ts) continue;
        const title =
          doc.officialTitle && String(doc.officialTitle).trim()
            ? String(doc.officialTitle).trim()
            : 'Compatibilidad Química SGA';
        return [
          {
            tipo: 'matriz',
            modulo: 'Compatibilidad Química SGA',
            categoria: 'sgsst',
            titulo: title,
            detalle: doc.isOfficial ? 'Versión oficial SGA' : 'Matriz de compatibilidad',
            estado: 'actualizada',
            ts,
            _meta: {
              key: 'chemical_compat_workspace',
              priority: 82,
              coreTitle: normalizeCoreTitle(title),
            },
          },
        ];
      }
      return [];
    },
  },
  {
    key: 'diagnostico_0312',
    modelName: 'DiagnosticoData',
    requirePath: '../../models/DiagnosticoData',
    mode: 'findOne',
    priority: 76,
    sort: { updatedAt: -1, createdAt: -1 },
    select: 'score complianceLevel updatedAt createdAt',
    buildFilter: (ctx, Model) => {
      const scope = ctx.userAndCompanyFilter(Model, { allowNullLegacy: true });
      if (!scope) return null;
      return { ...scope, 'statusData.0': { $exists: true } };
    },
    mapDoc: (doc) => {
      const ts = extractTimestampMs(doc);
      if (!ts) return null;
      return {
        tipo: 'sgsst',
        modulo: 'Diagnóstico 0312',
        categoria: 'sgsst',
        titulo: 'Diagnóstico Estándares Mínimos Res. 0312',
        detalle:
          doc.score != null
            ? `Puntaje: ${doc.score}%${doc.complianceLevel ? ` (${doc.complianceLevel})` : ''}`
            : '',
        estado: 'evaluado',
        ts,
        _meta: { key: 'diagnostico_0312', priority: 76, coreTitle: 'diagnostico 0312' },
      };
    },
  },
  {
    key: 'auditoria_sgsst',
    modelName: 'AuditoriaData',
    requirePath: '../../models/AuditoriaData',
    mode: 'findOne',
    priority: 76,
    sort: { updatedAt: -1, createdAt: -1 },
    select: 'compliancePercentage score reviewerInfo.nombre updatedAt createdAt',
    buildFilter: (ctx, Model) => {
      const scope = ctx.userAndCompanyFilter(Model, { allowNullLegacy: true });
      if (!scope) return null;
      return {
        ...scope,
        $or: [
          { 'statusData.0': { $exists: true } },
          { 'reviewerInfo.nombre': { $exists: true, $nin: ['', null] } },
        ],
      };
    },
    mapDoc: (doc) => {
      const ts = extractTimestampMs(doc);
      if (!ts) return null;
      return {
        tipo: 'sgsst',
        modulo: 'Auditoría SG-SST',
        categoria: 'sgsst',
        titulo: 'Auditoría Interna SG-SST',
        detalle: doc.compliancePercentage
          ? `Cumplimiento: ${doc.compliancePercentage}%`
          : doc.reviewerInfo?.nombre
            ? `Auditor: ${doc.reviewerInfo.nombre}`
            : '',
        estado: 'actualizada',
        ts,
        _meta: { key: 'auditoria_sgsst', priority: 76, coreTitle: 'auditoria interna sgsst' },
      };
    },
  },
  {
    key: 'contexto_dofa',
    modelName: 'ContextoData',
    requirePath: '../../models/ContextoData',
    mode: 'findOne',
    priority: 75,
    sort: { updatedAt: -1, createdAt: -1 },
    select: 'updatedAt createdAt',
    buildFilter: (ctx, Model) => {
      const scope = ctx.userAndCompanyFilter(Model, { allowNullLegacy: true });
      if (!scope) return null;
      return {
        ...scope,
        $or: [
          { 'dofaList.0': { $exists: true } },
          { 'stakeholders.0': { $exists: true } },
          { lastGeneratedReport: { $exists: true, $nin: ['', null] } },
        ],
      };
    },
    mapDoc: (doc) => {
      const ts = extractTimestampMs(doc);
      if (!ts) return null;
      return {
        tipo: 'sgsst',
        modulo: 'Contexto DOFA',
        categoria: 'sgsst',
        titulo: 'Contexto Organizacional y DOFA SST',
        detalle: 'Matriz DOFA y partes interesadas',
        estado: 'actualizado',
        ts,
        _meta: { key: 'contexto_dofa', priority: 75, coreTitle: 'contexto organizacional dofa' },
      };
    },
  },
  {
    key: 'oportunidades_sgsst',
    modelName: 'OportunidadesData',
    requirePath: '../../models/OportunidadesData',
    mode: 'findOne',
    priority: 75,
    sort: { updatedAt: -1, createdAt: -1 },
    select: 'updatedAt createdAt',
    buildFilter: (ctx, Model) => {
      const scope = ctx.userAndCompanyFilter(Model, { allowNullLegacy: true });
      if (!scope) return null;
      return {
        ...scope,
        $or: [
          { 'oportunidades.0': { $exists: true } },
          { 'riesgosSistema.0': { $exists: true } },
          { lastGeneratedReport: { $exists: true, $nin: ['', null] } },
        ],
      };
    },
    mapDoc: (doc) => {
      const ts = extractTimestampMs(doc);
      if (!ts) return null;
      return {
        tipo: 'sgsst',
        modulo: 'Riesgos y Oportunidades',
        categoria: 'sgsst',
        titulo: 'Matriz de Riesgos y Oportunidades del SG-SST',
        detalle: 'Gestión estratégica SG-SST',
        estado: 'actualizada',
        ts,
        _meta: {
          key: 'oportunidades_sgsst',
          priority: 75,
          coreTitle: 'matriz riesgos oportunidades sgsst',
        },
      };
    },
  },
  {
    key: 'matriz_legal',
    modelName: 'MatrizLegalData',
    requirePath: '../routes/sgsst/matriz',
    mode: 'findOne',
    priority: 75,
    sort: { updatedAt: -1, createdAt: -1 },
    select: 'activity location updatedAt createdAt',
    buildFilter: (ctx, Model) => {
      const scope = ctx.userAndCompanyFilter(Model, { allowNullLegacy: true });
      if (!scope) return null;
      return {
        ...scope,
        $or: [
          { 'statuses.0': { $exists: true } },
          { activity: { $exists: true, $nin: ['', null] } },
        ],
      };
    },
    mapDoc: (doc) => {
      const ts = extractTimestampMs(doc);
      if (!ts) return null;
      return {
        tipo: 'matriz',
        modulo: 'Matriz Legal',
        categoria: 'sgsst',
        titulo: 'Matriz Legal SG-SST',
        detalle: doc.activity || doc.location || '',
        estado: 'actualizada',
        ts,
        _meta: { key: 'matriz_legal', priority: 75, coreTitle: 'matriz legal sgsst' },
      };
    },
  },
  {
    key: 'matriz_peligros',
    modelName: 'MatrizPeligrosData',
    requirePath: '../routes/sgsst/matrizPeligros',
    mode: 'findOne',
    priority: 76,
    sort: { updatedAt: -1, createdAt: -1 },
    select: 'updatedAt createdAt',
    buildFilter: (ctx, Model) => {
      const scope = ctx.userAndCompanyFilter(Model, { allowNullLegacy: true });
      if (!scope) return null;
      return { ...scope, 'procesos.0': { $exists: true } };
    },
    mapDoc: (doc) => {
      const ts = extractTimestampMs(doc);
      if (!ts) return null;
      return {
        tipo: 'matriz',
        modulo: 'Matriz de Peligros',
        categoria: 'sgsst',
        titulo: 'Matriz de Peligros IPEVR',
        detalle: 'Identificación y valoración de peligros',
        estado: 'actualizada',
        ts,
        _meta: { key: 'matriz_peligros', priority: 76, coreTitle: 'matriz peligros ipevr' },
      };
    },
  },
  {
    key: 'estudio_puesto',
    modelName: 'EstudioPuestoTrabajo',
    requirePath: '../../models/EstudioPuestoTrabajo',
    mode: 'findOne',
    priority: 85,
    sort: { updatedAt: -1, createdAt: -1 },
    select: 'workerName cargo status riskLevel evaluationType completedAt updatedAt createdAt',
    buildFilter: (ctx, Model) => ctx.userAndCompanyFilter(Model, { allowNullLegacy: false }),
    mapDoc: (doc) => {
      const ts = extractTimestampMs(doc, ['completedAt', 'updatedAt', 'createdAt']);
      if (!ts) return null;
      const worker = String(doc.workerName || '').trim();
      const titulo = worker ? `Estudio ergonómico: ${worker}` : 'Estudio de Puesto de Trabajo';
      const detalle = [doc.cargo || '', doc.riskLevel ? `Riesgo ${doc.riskLevel}` : '']
        .filter(Boolean)
        .join(' · ');
      return {
        tipo: 'sgsst',
        modulo: 'Estudios Ergonómicos',
        categoria: 'sgsst',
        titulo,
        detalle,
        estado: doc.status || 'completado',
        ts,
        _meta: {
          key: 'estudio_puesto',
          priority: 85,
          coreTitle: normalizeCoreTitle(titulo),
        },
      };
    },
  },
  {
    key: 'metodo_owas',
    modelName: 'MetodoOwasData',
    requirePath: '../routes/sgsst/metodoOwas',
    mode: 'findOne',
    priority: 76,
    sort: { updatedAt: -1, createdAt: -1 },
    select: 'formData.tarea formData.cargo updatedAt createdAt',
    buildFilter: (ctx, Model) => {
      const scope = ctx.userAndCompanyFilter(Model, { allowNullLegacy: true });
      if (!scope) return null;
      return {
        ...scope,
        $or: [
          { 'observaciones.0': { $exists: true } },
          { 'trabajadoresList.0': { $exists: true } },
          { 'formData.tarea': { $exists: true, $nin: ['', null] } },
          { 'formData.cargo': { $exists: true, $nin: ['', null] } },
        ],
      };
    },
    mapDoc: (doc) => {
      const ts = extractTimestampMs(doc);
      if (!ts) return null;
      const taskLabel = doc.formData?.tarea || doc.formData?.cargo || '';
      const titulo = taskLabel ? `Evaluación OWAS: ${taskLabel}` : 'Evaluación Postural Método OWAS';
      return {
        tipo: 'sgsst',
        modulo: 'Método OWAS',
        categoria: 'sgsst',
        titulo,
        detalle: doc.formData?.cargo || '',
        estado: 'evaluado',
        ts,
        _meta: { key: 'metodo_owas', priority: 76, coreTitle: normalizeCoreTitle(titulo) },
      };
    },
  },
  {
    key: 'investigacion_atel',
    modelName: 'InvestigacionAtelData',
    requirePath: '../../models/InvestigacionAtelData',
    mode: 'findOne',
    priority: 80,
    sort: { updatedAt: -1, createdAt: -1 },
    select: 'formData.tipoEvento formData.nombreTrabajador updatedAt createdAt',
    buildFilter: (ctx, Model) => {
      const scope = ctx.userAndCompanyFilter(Model, { allowNullLegacy: true });
      if (!scope) return null;
      return {
        ...scope,
        $or: [
          { 'formData.nombreTrabajador': { $exists: true, $nin: ['', null] } },
          { 'formData.descripcionEvento': { $exists: true, $nin: ['', null] } },
          { 'formData.tipoEvento': { $exists: true, $nin: ['', null] } },
          { 'equipoList.0': { $exists: true } },
        ],
      };
    },
    mapDoc: (doc) => {
      const ts = extractTimestampMs(doc);
      if (!ts) return null;
      const worker = doc.formData?.nombreTrabajador || '';
      const titulo = worker
        ? `Investigación ATEL: ${worker}`
        : 'Investigación de Accidente / Enfermedad Laboral';
      return {
        tipo: 'sgsst',
        modulo: 'Investigación ATEL',
        categoria: 'sgsst',
        titulo,
        detalle: doc.formData?.tipoEvento || '',
        estado: 'registrada',
        ts,
        _meta: { key: 'investigacion_atel', priority: 80, coreTitle: normalizeCoreTitle(titulo) },
      };
    },
  },
  {
    key: 'atel_annual',
    modelName: 'ATELAnnualData',
    requirePath: '../routes/sgsst/atel-data',
    mode: 'findOne',
    priority: 74,
    sort: { updatedAt: -1, createdAt: -1 },
    select: 'year updatedAt createdAt',
    buildFilter: (ctx, Model) => ctx.userAndCompanyFilter(Model, { allowNullLegacy: true }),
    mapDoc: (doc) => {
      const ts = extractTimestampMs(doc);
      if (!ts) return null;
      const titulo = doc.year
        ? `Estadísticas ATEL y Ausentismo ${doc.year}`
        : 'Estadísticas ATEL y Ausentismo';
      return {
        tipo: 'sgsst',
        modulo: 'Estadísticas ATEL',
        categoria: 'sgsst',
        titulo,
        detalle: 'Indicadores de accidentalidad y ausentismo',
        estado: 'actualizado',
        ts,
        _meta: { key: 'atel_annual', priority: 74, coreTitle: normalizeCoreTitle(titulo) },
      };
    },
  },
  {
    key: 'plan_emergencias',
    modelName: 'PlanEmergenciasData',
    requirePath: '../../models/PlanEmergenciasData',
    mode: 'findOne',
    priority: 75,
    sort: { updatedAt: -1, createdAt: -1 },
    select: 'updatedAt createdAt',
    buildFilter: (ctx, Model) => {
      const scope = ctx.userAndCompanyFilter(Model, { allowNullLegacy: true });
      if (!scope) return null;
      return {
        ...scope,
        $or: [
          { 'escenariosAmenaza.0': { $exists: true } },
          { 'procedimientosPon.0': { $exists: true } },
          { 'simulacrosPlan.0': { $exists: true } },
          { lastGeneratedReport: { $exists: true, $nin: ['', null] } },
        ],
      };
    },
    mapDoc: (doc) => {
      const ts = extractTimestampMs(doc);
      if (!ts) return null;
      return {
        tipo: 'sgsst',
        modulo: 'Plan de Emergencias',
        categoria: 'sgsst',
        titulo: 'Plan de Emergencias y Contingencias',
        detalle: 'PON, amenazas y simulacros',
        estado: 'actualizado',
        ts,
        _meta: { key: 'plan_emergencias', priority: 75, coreTitle: 'plan emergencias contingencias' },
      };
    },
  },
  {
    key: 'analisis_vulnerabilidad',
    modelName: 'AnalisisVulnerabilidadData',
    requirePath: '../routes/sgsst/analisisVulnerabilidad',
    mode: 'findOne',
    priority: 75,
    sort: { updatedAt: -1, createdAt: -1 },
    select: 'formData.sede updatedAt createdAt',
    buildFilter: (ctx, Model) => {
      const scope = ctx.userAndCompanyFilter(Model, { allowNullLegacy: true });
      if (!scope) return null;
      return {
        ...scope,
        $or: [
          { 'evaluadoresList.0': { $exists: true } },
          { 'formData.sede': { $exists: true, $nin: ['', null] } },
          { 'formData.amenazas.0': { $exists: true } },
        ],
      };
    },
    mapDoc: (doc) => {
      const ts = extractTimestampMs(doc);
      if (!ts) return null;
      return {
        tipo: 'sgsst',
        modulo: 'Análisis de Vulnerabilidad',
        categoria: 'sgsst',
        titulo: 'Análisis de Vulnerabilidad y Amenazas',
        detalle: doc.formData?.sede ? `Sede: ${doc.formData.sede}` : '',
        estado: 'actualizado',
        ts,
        _meta: {
          key: 'analisis_vulnerabilidad',
          priority: 75,
          coreTitle: 'analisis vulnerabilidad amenazas',
        },
      };
    },
  },
  {
    key: 'analisis_trabajo_seguro',
    modelName: 'AnalisisTrabajoSeguroData',
    requirePath: '../routes/sgsst/analisisTrabajoSeguro',
    mode: 'findOne',
    priority: 78,
    sort: { updatedAt: -1, createdAt: -1 },
    select: 'formData.actividad formData.tarea updatedAt createdAt',
    buildFilter: (ctx, Model) => {
      const scope = ctx.userAndCompanyFilter(Model, { allowNullLegacy: true });
      if (!scope) return null;
      return {
        ...scope,
        $or: [
          { 'trabajadoresList.0': { $exists: true } },
          { 'formData.actividad': { $exists: true, $nin: ['', null] } },
          { 'formData.tarea': { $exists: true, $nin: ['', null] } },
        ],
      };
    },
    mapDoc: (doc) => {
      const ts = extractTimestampMs(doc);
      if (!ts) return null;
      const act = doc.formData?.actividad || doc.formData?.tarea || '';
      const titulo = act ? `ATS: ${act}` : 'Análisis de Trabajo Seguro (ATS)';
      return {
        tipo: 'sgsst',
        modulo: 'ATS',
        categoria: 'sgsst',
        titulo,
        detalle: 'Control de tarea de alto riesgo',
        estado: 'registrado',
        ts,
        _meta: {
          key: 'analisis_trabajo_seguro',
          priority: 78,
          coreTitle: normalizeCoreTitle(titulo),
        },
      };
    },
  },
  {
    key: 'permiso_alturas',
    modelName: 'PermisoAlturasData',
    requirePath: '../routes/sgsst/permisoAlturas',
    mode: 'findOne',
    priority: 78,
    sort: { updatedAt: -1, createdAt: -1 },
    select: 'formData.actividad formData.lugar updatedAt createdAt',
    buildFilter: (ctx, Model) => {
      const scope = ctx.userAndCompanyFilter(Model, { allowNullLegacy: true });
      if (!scope) return null;
      return {
        ...scope,
        $or: [
          { 'trabajadoresList.0': { $exists: true } },
          { 'formData.actividad': { $exists: true, $nin: ['', null] } },
          { 'formData.lugar': { $exists: true, $nin: ['', null] } },
        ],
      };
    },
    mapDoc: (doc) => {
      const ts = extractTimestampMs(doc);
      if (!ts) return null;
      const act = doc.formData?.actividad || doc.formData?.lugar || '';
      const titulo = act ? `Permiso de Alturas: ${act}` : 'Permiso de Trabajo en Alturas';
      return {
        tipo: 'sgsst',
        modulo: 'Trabajo en Alturas',
        categoria: 'sgsst',
        titulo,
        detalle: doc.formData?.lugar || '',
        estado: 'registrado',
        ts,
        _meta: { key: 'permiso_alturas', priority: 78, coreTitle: normalizeCoreTitle(titulo) },
      };
    },
  },
  {
    key: 'equipos_alturas',
    modelName: 'SgsstHeightsData',
    requirePath: '../../models/SgsstHeightsData',
    mode: 'findOne',
    priority: 76,
    sort: { updatedAt: -1, createdAt: -1 },
    select: 'nombreTrabajador cargo updatedAt createdAt',
    buildFilter: (ctx, Model) => {
      const scope = ctx.userAndCompanyFilter(Model, { allowNullLegacy: false });
      if (!scope) return null;
      return { ...scope, 'equipos.0': { $exists: true } };
    },
    mapDoc: (doc) => {
      const ts = extractTimestampMs(doc);
      if (!ts) return null;
      const titulo = doc.nombreTrabajador
        ? `Equipos de Alturas: ${doc.nombreTrabajador}`
        : 'Inspección Equipos de Trabajo en Alturas';
      return {
        tipo: 'sgsst',
        modulo: 'Equipos de Alturas',
        categoria: 'sgsst',
        titulo,
        detalle: doc.cargo || '',
        estado: 'actualizado',
        ts,
        _meta: { key: 'equipos_alturas', priority: 76, coreTitle: normalizeCoreTitle(titulo) },
      };
    },
  },
  {
    key: 'perfil_sociodemografico',
    modelName: 'PerfilSociodemograficoData',
    requirePath: '../../models/PerfilSociodemograficoData',
    mode: 'findOne',
    priority: 74,
    sort: { updatedAt: -1, createdAt: -1 },
    select: 'updatedAt createdAt',
    buildFilter: (ctx, Model) => {
      const scope = ctx.userAndCompanyFilter(Model, { allowNullLegacy: true });
      if (!scope) return null;
      return { ...scope, 'trabajadores.0': { $exists: true } };
    },
    mapDoc: (doc) => {
      const ts = extractTimestampMs(doc);
      if (!ts) return null;
      return {
        tipo: 'sgsst',
        modulo: 'Perfil Sociodemográfico',
        categoria: 'sgsst',
        titulo: 'Perfil Sociodemográfico y Condiciones de Salud',
        detalle: 'Nómina y encuesta sociodemográfica',
        estado: 'actualizado',
        ts,
        _meta: {
          key: 'perfil_sociodemografico',
          priority: 74,
          coreTitle: 'perfil sociodemografico condiciones salud',
        },
      };
    },
  },
  {
    key: 'sgsst_worker',
    modelName: 'SgsstWorker',
    requirePath: '../../models/SgsstWorker',
    mode: 'findOne',
    priority: 75,
    sort: { updatedAt: -1, createdAt: -1 },
    select: 'nombre cargo estadoLaboral updatedAt createdAt',
    buildFilter: (ctx, Model) => ctx.userAndCompanyFilter(Model, { allowNullLegacy: true }),
    mapDoc: (doc) => {
      const ts = extractTimestampMs(doc);
      if (!ts) return null;
      const titulo = doc.nombre ? `Colaborador: ${doc.nombre}` : 'Gestión de Trabajadores';
      return {
        tipo: 'sgsst',
        modulo: 'Trabajadores',
        categoria: 'sgsst',
        titulo,
        detalle: doc.cargo || '',
        estado: doc.estadoLaboral || 'Activo',
        ts,
        _meta: { key: 'sgsst_worker', priority: 75, coreTitle: normalizeCoreTitle(titulo) },
      };
    },
  },
  {
    key: 'perfiles_cargo',
    modelName: 'PerfilCargoData',
    requirePath: '../routes/sgsst/perfilesCargo',
    mode: 'findOne',
    priority: 74,
    sort: { updatedAt: -1, createdAt: -1 },
    select: 'updatedAt createdAt',
    buildFilter: (ctx, Model) => {
      const scope = ctx.userAndCompanyFilter(Model, { allowNullLegacy: true });
      if (!scope) return null;
      return { ...scope, 'perfilesList.0': { $exists: true } };
    },
    mapDoc: (doc) => {
      const ts = extractTimestampMs(doc);
      if (!ts) return null;
      return {
        tipo: 'sgsst',
        modulo: 'Perfiles de Cargo',
        categoria: 'sgsst',
        titulo: 'Perfiles de Cargo y Profesiograma',
        detalle: 'Manual de funciones y riesgos por cargo',
        estado: 'actualizado',
        ts,
        _meta: { key: 'perfiles_cargo', priority: 74, coreTitle: 'perfiles cargo profesiograma' },
      };
    },
  },
  {
    key: 'programa_capacitaciones',
    modelName: 'ProgramaCapacitacionesData',
    requirePath: '../routes/sgsst/programaCapacitaciones',
    mode: 'findOne',
    priority: 75,
    sort: { updatedAt: -1, createdAt: -1 },
    select: 'updatedAt createdAt',
    buildFilter: (ctx, Model) => {
      const scope = ctx.userAndCompanyFilter(Model, { allowNullLegacy: true });
      if (!scope) return null;
      return {
        ...scope,
        $or: [
          { 'sesiones.0': { $exists: true } },
          { 'planPersonalizado.0': { $exists: true } },
        ],
      };
    },
    mapDoc: (doc) => {
      const ts = extractTimestampMs(doc);
      if (!ts) return null;
      return {
        tipo: 'sgsst',
        modulo: 'Capacitaciones SST',
        categoria: 'sgsst',
        titulo: 'Programa de Capacitaciones SST',
        detalle: 'Plan anual y sesiones de formación',
        estado: 'actualizado',
        ts,
        _meta: {
          key: 'programa_capacitaciones',
          priority: 75,
          coreTitle: 'programa capacitaciones sst',
        },
      };
    },
  },
  {
    key: 'participacion_ipevar',
    modelName: 'ParticipacionIpevarData',
    requirePath: '../routes/sgsst/participacionIpevar',
    mode: 'findOne',
    priority: 74,
    sort: { updatedAt: -1, createdAt: -1 },
    select: 'updatedAt createdAt',
    buildFilter: (ctx, Model) => {
      const scope = ctx.userAndCompanyFilter(Model, { allowNullLegacy: true });
      if (!scope) return null;
      return {
        ...scope,
        $or: [
          { 'participacionesList.0': { $exists: true } },
          { 'inboxPublico.0': { $exists: true } },
        ],
      };
    },
    mapDoc: (doc) => {
      const ts = extractTimestampMs(doc);
      if (!ts) return null;
      return {
        tipo: 'sgsst',
        modulo: 'Participación IPEVR',
        categoria: 'sgsst',
        titulo: 'Participación de Trabajadores en IPEVR',
        detalle: 'Autorreporte de peligros en puestos',
        estado: 'actualizado',
        ts,
        _meta: {
          key: 'participacion_ipevar',
          priority: 74,
          coreTitle: 'participacion trabajadores ipevr',
        },
      };
    },
  },
  {
    key: 'reporte_actos',
    modelName: 'ReporteActosData',
    requirePath: '../routes/sgsst/reporteActos',
    mode: 'findOne',
    priority: 76,
    sort: { updatedAt: -1, createdAt: -1 },
    select: 'formData.tipoReporte updatedAt createdAt',
    buildFilter: (ctx, Model) => {
      const scope = ctx.userAndCompanyFilter(Model, { allowNullLegacy: true });
      if (!scope) return null;
      return {
        ...scope,
        $or: [
          { 'inboxPublico.0': { $exists: true } },
          { 'trabajadoresList.0': { $exists: true } },
          { 'formData.descripcion': { $exists: true, $nin: ['', null] } },
        ],
      };
    },
    mapDoc: (doc) => {
      const ts = extractTimestampMs(doc);
      if (!ts) return null;
      return {
        tipo: 'sgsst',
        modulo: 'Actos y Condiciones',
        categoria: 'sgsst',
        titulo: 'Reporte de Actos y Condiciones Inseguras',
        detalle: doc.formData?.tipoReporte || '',
        estado: 'reportado',
        ts,
        _meta: {
          key: 'reporte_actos',
          priority: 76,
          coreTitle: 'reporte actos condiciones inseguras',
        },
      };
    },
  },
  {
    key: 'alta_direccion',
    modelName: 'AltaDireccionData',
    requirePath: '../routes/sgsst/altaDireccion',
    mode: 'findOne',
    priority: 75,
    sort: { updatedAt: -1, createdAt: -1 },
    select: 'reviewerInfo.nombre updatedAt createdAt',
    buildFilter: (ctx, Model) => {
      const scope = ctx.userAndCompanyFilter(Model, { allowNullLegacy: true });
      if (!scope) return null;
      return {
        ...scope,
        $or: [
          { 'statusData.0': { $exists: true } },
          { 'inboxPublico.0': { $exists: true } },
          { 'reviewerInfo.nombre': { $exists: true, $nin: ['', null] } },
        ],
      };
    },
    mapDoc: (doc) => {
      const ts = extractTimestampMs(doc);
      if (!ts) return null;
      return {
        tipo: 'sgsst',
        modulo: 'Alta Dirección',
        categoria: 'sgsst',
        titulo: 'Revisión por la Alta Dirección',
        detalle: doc.reviewerInfo?.nombre ? `Revisor: ${doc.reviewerInfo.nombre}` : '',
        estado: 'actualizada',
        ts,
        _meta: { key: 'alta_direccion', priority: 75, coreTitle: 'revision alta direccion' },
      };
    },
  },
  {
    key: 'inventario_quimico',
    modelName: 'SgsstChemicalData',
    requirePath: '../../models/SgsstChemicalData',
    mode: 'findOne',
    priority: 75,
    sort: { updatedAt: -1, createdAt: -1 },
    select: 'updatedAt createdAt',
    buildFilter: (ctx, Model) => {
      const scope = ctx.userAndCompanyFilter(Model, { allowNullLegacy: false });
      if (!scope) return null;
      return { ...scope, 'productos.0': { $exists: true } };
    },
    mapDoc: (doc) => {
      const ts = extractTimestampMs(doc);
      if (!ts) return null;
      return {
        tipo: 'sgsst',
        modulo: 'Inventario Químico',
        categoria: 'sgsst',
        titulo: 'Inventario de Productos Químicos SGA',
        detalle: 'Sustancias químicas y FDS',
        estado: 'actualizado',
        ts,
        _meta: {
          key: 'inventario_quimico',
          priority: 75,
          coreTitle: 'inventario productos quimicos sga',
        },
      };
    },
  },
  {
    key: 'flota_vehicular',
    modelName: 'SgsstVehicleData',
    requirePath: '../../models/SgsstVehicleData',
    mode: 'findOne',
    priority: 76,
    sort: { updatedAt: -1, createdAt: -1 },
    select: 'placa marca modelo tipo updatedAt createdAt',
    buildFilter: (ctx, Model) => ctx.userAndCompanyFilter(Model, { allowNullLegacy: false }),
    mapDoc: (doc) => {
      const ts = extractTimestampMs(doc);
      if (!ts) return null;
      const titulo = doc.placa
        ? `Vehículo PESV: ${doc.placa}${doc.marca ? ` (${doc.marca})` : ''}`
        : 'Gestión de Flota Vehicular PESV';
      return {
        tipo: 'sgsst',
        modulo: 'Flota Vehicular PESV',
        categoria: 'sgsst',
        titulo,
        detalle: [doc.tipo || '', doc.modelo || ''].filter(Boolean).join(' · '),
        estado: 'actualizado',
        ts,
        _meta: { key: 'flota_vehicular', priority: 76, coreTitle: normalizeCoreTitle(titulo) },
      };
    },
  },
  {
    key: 'epp_entregas',
    modelName: 'SgsstEppData',
    requirePath: '../../models/SgsstEppData',
    mode: 'findOne',
    priority: 76,
    sort: { updatedAt: -1, createdAt: -1 },
    select: 'nombreTrabajador cargo updatedAt createdAt',
    buildFilter: (ctx, Model) => {
      const scope = ctx.userAndCompanyFilter(Model, { allowNullLegacy: false });
      if (!scope) return null;
      return { ...scope, 'entregas.0': { $exists: true } };
    },
    mapDoc: (doc) => {
      const ts = extractTimestampMs(doc);
      if (!ts) return null;
      const titulo = doc.nombreTrabajador
        ? `Entrega EPP: ${doc.nombreTrabajador}`
        : 'Control de Entregas EPP';
      return {
        tipo: 'sgsst',
        modulo: 'Gestión EPP',
        categoria: 'sgsst',
        titulo,
        detalle: doc.cargo || '',
        estado: 'entregado',
        ts,
        _meta: { key: 'epp_entregas', priority: 76, coreTitle: normalizeCoreTitle(titulo) },
      };
    },
  },
  {
    key: 'epp_solicitud',
    modelName: 'SgsstEppSolicitud',
    requirePath: '../../models/SgsstEppSolicitud',
    mode: 'findOne',
    priority: 77,
    sort: { updatedAt: -1, createdAt: -1 },
    select: 'nombreTrabajador cargo estado updatedAt createdAt',
    buildFilter: (ctx, Model) => ctx.userAndCompanyFilter(Model, { allowNullLegacy: false }),
    mapDoc: (doc) => {
      const ts = extractTimestampMs(doc);
      if (!ts) return null;
      const titulo = doc.nombreTrabajador
        ? `Solicitud EPP: ${doc.nombreTrabajador}`
        : 'Solicitud de EPP';
      return {
        tipo: 'sgsst',
        modulo: 'Solicitudes EPP',
        categoria: 'sgsst',
        titulo,
        detalle: doc.cargo || '',
        estado: doc.estado || 'pendiente',
        ts,
        _meta: { key: 'epp_solicitud', priority: 77, coreTitle: normalizeCoreTitle(titulo) },
      };
    },
  },
  {
    key: 'brigadista',
    modelName: 'SgsstBrigadista',
    requirePath: '../../models/SgsstBrigadista',
    mode: 'findOne',
    priority: 75,
    sort: { updatedAt: -1, createdAt: -1 },
    select: 'nombre grupoEspecialidad estadoMembresia updatedAt createdAt',
    buildFilter: (ctx, Model) => ctx.userAndCompanyFilter(Model, { allowNullLegacy: false }),
    mapDoc: (doc) => {
      const ts = extractTimestampMs(doc);
      if (!ts) return null;
      const titulo = doc.nombre ? `Brigadista: ${doc.nombre}` : 'Brigada de Emergencias';
      return {
        tipo: 'sgsst',
        modulo: 'Brigada de Emergencias',
        categoria: 'sgsst',
        titulo,
        detalle: doc.grupoEspecialidad || '',
        estado: doc.estadoMembresia || 'Activo',
        ts,
        _meta: { key: 'brigadista', priority: 75, coreTitle: normalizeCoreTitle(titulo) },
      };
    },
  },
  {
    key: 'copasst_comite',
    modelName: 'SgsstCopasstComite',
    requirePath: '../../models/SgsstCopasst',
    mode: 'findOne',
    priority: 74,
    sort: { updatedAt: -1, createdAt: -1 },
    select: 'modalidad estado updatedAt createdAt',
    buildFilter: (ctx, Model) => ctx.userAndCompanyFilter(Model, { allowNullLegacy: false }),
    mapDoc: (doc) => {
      const ts = extractTimestampMs(doc);
      if (!ts) return null;
      const titulo = doc.modalidad === 'vigia' ? 'Vigía SST' : 'Comité COPASST';
      return {
        tipo: 'sgsst',
        modulo: 'COPASST',
        categoria: 'sgsst',
        titulo,
        detalle: 'Conformación y seguimiento',
        estado: doc.estado || 'activo',
        ts,
        _meta: { key: 'copasst_comite', priority: 74, coreTitle: normalizeCoreTitle(titulo) },
      };
    },
  },
  {
    key: 'copasst_acta',
    modelName: 'SgsstCopasstActa',
    requirePath: '../../models/SgsstCopasst',
    mode: 'findOne',
    priority: 78,
    sort: { updatedAt: -1, createdAt: -1 },
    select: 'consecutivo tipo estadoActa lugar updatedAt createdAt',
    buildFilter: (ctx, Model) => ctx.userAndCompanyFilter(Model, { allowNullLegacy: false }),
    mapDoc: (doc) => {
      const ts = extractTimestampMs(doc);
      if (!ts) return null;
      const titulo = doc.consecutivo
        ? `Acta COPASST: ${doc.consecutivo}`
        : 'Acta de Reunión COPASST';
      return {
        tipo: 'sgsst',
        modulo: 'Actas COPASST',
        categoria: 'sgsst',
        titulo,
        detalle: doc.lugar || doc.tipo || '',
        estado: doc.estadoActa || 'borrador',
        ts,
        _meta: { key: 'copasst_acta', priority: 78, coreTitle: normalizeCoreTitle(titulo) },
      };
    },
  },
  {
    key: 'copasst_inspeccion',
    modelName: 'SgsstCopasstInspeccion',
    requirePath: '../../models/SgsstCopasst',
    mode: 'findOne',
    priority: 78,
    sort: { updatedAt: -1, createdAt: -1 },
    select: 'consecutivo area tipoLabel estadoInspeccion semaforoGeneral updatedAt createdAt',
    buildFilter: (ctx, Model) => ctx.userAndCompanyFilter(Model, { allowNullLegacy: false }),
    mapDoc: (doc) => {
      const ts = extractTimestampMs(doc);
      if (!ts) return null;
      const titulo = doc.area
        ? `Inspección COPASST: ${doc.area}`
        : doc.consecutivo
          ? `Inspección COPASST: ${doc.consecutivo}`
          : 'Inspección Planeada COPASST';
      return {
        tipo: 'sgsst',
        modulo: 'Inspecciones COPASST',
        categoria: 'sgsst',
        titulo,
        detalle: doc.tipoLabel || '',
        estado: doc.estadoInspeccion || 'completada',
        ts,
        _meta: { key: 'copasst_inspeccion', priority: 78, coreTitle: normalizeCoreTitle(titulo) },
      };
    },
  },
  {
    key: 'convivencia_comite',
    modelName: 'SgsstConvivenciaComite',
    requirePath: '../../models/SgsstConvivencia',
    mode: 'findOne',
    priority: 74,
    sort: { updatedAt: -1, createdAt: -1 },
    select: 'centroTrabajo estado updatedAt createdAt',
    buildFilter: (ctx, Model) => ctx.userAndCompanyFilter(Model, { allowNullLegacy: false }),
    mapDoc: (doc) => {
      const ts = extractTimestampMs(doc);
      if (!ts) return null;
      return {
        tipo: 'sgsst',
        modulo: 'Convivencia Laboral',
        categoria: 'sgsst',
        titulo: 'Comité de Convivencia Laboral',
        detalle: doc.centroTrabajo || '',
        estado: doc.estado || 'activo',
        ts,
        _meta: {
          key: 'convivencia_comite',
          priority: 74,
          coreTitle: 'comite convivencia laboral',
        },
      };
    },
  },
  {
    key: 'convivencia_acta',
    modelName: 'SgsstConvivenciaActa',
    requirePath: '../../models/SgsstConvivencia',
    mode: 'findOne',
    priority: 78,
    sort: { updatedAt: -1, createdAt: -1 },
    select: 'consecutivo tipo trimestre anio estadoActa updatedAt createdAt',
    buildFilter: (ctx, Model) => ctx.userAndCompanyFilter(Model, { allowNullLegacy: false }),
    mapDoc: (doc) => {
      const ts = extractTimestampMs(doc);
      if (!ts) return null;
      const titulo = doc.consecutivo
        ? `Acta Convivencia: ${doc.consecutivo}`
        : 'Acta Comité de Convivencia';
      return {
        tipo: 'sgsst',
        modulo: 'Actas Convivencia',
        categoria: 'sgsst',
        titulo,
        detalle: doc.trimestre && doc.anio ? `Trimestre ${doc.trimestre} · ${doc.anio}` : '',
        estado: doc.estadoActa || 'borrador',
        ts,
        _meta: { key: 'convivencia_acta', priority: 78, coreTitle: normalizeCoreTitle(titulo) },
      };
    },
  },
  {
    key: 'convivencia_caso',
    modelName: 'SgsstConvivenciaCaso',
    requirePath: '../../models/SgsstConvivencia',
    mode: 'findOne',
    priority: 78,
    sort: { updatedAt: -1, createdAt: -1 },
    select: 'radicado tipoAcoso estado updatedAt createdAt',
    buildFilter: (ctx, Model) => ctx.userAndCompanyFilter(Model, { allowNullLegacy: false }),
    mapDoc: (doc) => {
      const ts = extractTimestampMs(doc);
      if (!ts) return null;
      const titulo = doc.radicado
        ? `Caso Convivencia: ${doc.radicado}`
        : 'Caso Comité de Convivencia Laboral';
      return {
        tipo: 'sgsst',
        modulo: 'Casos Convivencia',
        categoria: 'sgsst',
        titulo,
        detalle: doc.tipoAcoso ? 'Registro confidencial CCL' : '',
        estado: doc.estado || 'registrado',
        ts,
        _meta: { key: 'convivencia_caso', priority: 78, coreTitle: normalizeCoreTitle(titulo) },
      };
    },
  },
  {
    key: 'compras_sst',
    modelName: 'SgsstComprasData',
    requirePath: '../../models/SgsstComprasData',
    mode: 'findOne',
    priority: 74,
    sort: { updatedAt: -1, createdAt: -1 },
    select: 'updatedAt createdAt',
    buildFilter: (ctx, Model) => {
      const scope = ctx.userAndCompanyFilter(Model, { allowNullLegacy: true });
      if (!scope) return null;
      return {
        ...scope,
        $or: [
          { 'compras.0': { $exists: true } },
          { 'criteriosMatriz.0': { $exists: true } },
          { lastGeneratedReport: { $exists: true, $nin: ['', null] } },
        ],
      };
    },
    mapDoc: (doc) => {
      const ts = extractTimestampMs(doc);
      if (!ts) return null;
      return {
        tipo: 'sgsst',
        modulo: 'Compras SST',
        categoria: 'sgsst',
        titulo: 'Compras y Adquisiciones SST (Est. 2.9.1)',
        detalle: 'Evaluación de requisitos SST en compras',
        estado: 'actualizado',
        ts,
        _meta: { key: 'compras_sst', priority: 74, coreTitle: 'compras adquisiciones sst' },
      };
    },
  },
  {
    key: 'contratistas_sst',
    modelName: 'SgsstContratistasData',
    requirePath: '../../models/SgsstContratistasData',
    mode: 'findOne',
    priority: 74,
    sort: { updatedAt: -1, createdAt: -1 },
    select: 'updatedAt createdAt',
    buildFilter: (ctx, Model) => {
      const scope = ctx.userAndCompanyFilter(Model, { allowNullLegacy: true });
      if (!scope) return null;
      return {
        ...scope,
        $or: [
          { 'contratistas.0': { $exists: true } },
          { 'checklistRequisitos.0': { $exists: true } },
          { lastGeneratedReport: { $exists: true, $nin: ['', null] } },
        ],
      };
    },
    mapDoc: (doc) => {
      const ts = extractTimestampMs(doc);
      if (!ts) return null;
      return {
        tipo: 'sgsst',
        modulo: 'Contratistas SST',
        categoria: 'sgsst',
        titulo: 'Gestión de Contratistas SST (Est. 2.10.1)',
        detalle: 'Verificación de contratistas y PILA',
        estado: 'actualizado',
        ts,
        _meta: { key: 'contratistas_sst', priority: 74, coreTitle: 'gestion contratistas sst' },
      };
    },
  },
  {
    key: 'gestion_cambio_moc',
    modelName: 'SgsstGestionCambioData',
    requirePath: '../../models/SgsstGestionCambioData',
    mode: 'findOne',
    priority: 74,
    sort: { updatedAt: -1, createdAt: -1 },
    select: 'updatedAt createdAt',
    buildFilter: (ctx, Model) => {
      const scope = ctx.userAndCompanyFilter(Model, { allowNullLegacy: true });
      if (!scope) return null;
      return {
        ...scope,
        $or: [
          { 'mocList.0': { $exists: true } },
          { lastGeneratedReport: { $exists: true, $nin: ['', null] } },
        ],
      };
    },
    mapDoc: (doc) => {
      const ts = extractTimestampMs(doc);
      if (!ts) return null;
      return {
        tipo: 'sgsst',
        modulo: 'Gestión del Cambio',
        categoria: 'sgsst',
        titulo: 'Gestión del Cambio MOC (Est. 2.11.1)',
        detalle: 'Evaluación de impacto SST ante cambios',
        estado: 'actualizado',
        ts,
        _meta: { key: 'gestion_cambio_moc', priority: 74, coreTitle: 'gestion cambio moc' },
      };
    },
  },
  {
    key: 'tenshi_pending_action',
    modelName: 'TenshiPendingAction',
    requirePath: '../../models/TenshiPendingAction',
    mode: 'findOne',
    priority: 79,
    sort: { updatedAt: -1, createdAt: -1 },
    select: 'title toolName moduleLabel status decidedAt updatedAt createdAt',
    buildFilter: (ctx, Model) => ctx.userAndCompanyFilter(Model, { allowNullLegacy: true }),
    mapDoc: (doc) => {
      const ts = extractTimestampMs(doc, ['decidedAt', 'updatedAt', 'createdAt']);
      if (!ts) return null;
      const titulo = String(doc.title || doc.toolName || 'Acción gobernada Tenshi').trim();
      return {
        tipo: 'gobernanza',
        modulo: doc.moduleLabel || 'Gobernanza Tenshi',
        categoria: 'sgsst',
        titulo,
        detalle: doc.toolName ? `Acción: ${doc.toolName}` : '',
        estado: doc.status || 'pendiente_aprobacion',
        ts,
        _meta: {
          key: 'tenshi_pending_action',
          priority: 79,
          coreTitle: normalizeCoreTitle(titulo),
        },
      };
    },
  },
  {
    key: 'mood_telemetry',
    modelName: 'MoodTelemetry',
    requirePath: '../../models/MoodTelemetry',
    mode: 'findOne',
    priority: 70,
    isEnabled: (ctx) => Boolean(ctx.cidObj),
    sort: { updatedAt: -1, createdAt: -1 },
    select: 'mood department updatedAt createdAt',
    buildFilter: (ctx) => ({
      companyId: ctx.cidObj,
      isDemo: { $ne: true },
    }),
    mapDoc: (doc) => {
      const ts = extractTimestampMs(doc);
      if (!ts) return null;
      const moodLabel =
        doc.mood === 'happy'
          ? 'positivo'
          : doc.mood === 'sad'
            ? 'alerta emocional'
            : 'neutral';
      const titulo = doc.department
        ? `Termómetro Psicosocial (${doc.department})`
        : 'Registro Termómetro Psicosocial';
      return {
        tipo: 'sgsst',
        modulo: 'Termómetro Psicosocial',
        categoria: 'sgsst',
        titulo,
        detalle: 'Pulso de clima laboral',
        estado: moodLabel,
        ts,
        _meta: { key: 'mood_telemetry', priority: 70, coreTitle: normalizeCoreTitle(titulo) },
      };
    },
  },

  // ── 6. Academia, Eventos, Tienda, Soporte ────────────────────────────────
  {
    key: 'user_progress',
    modelName: 'UserProgress',
    requirePath: '../../models/UserProgress',
    mode: 'findOne',
    priority: 64,
    sort: { lastAccessed: -1, updatedAt: -1, createdAt: -1 },
    select: 'course isCourseCompleted completedLessons lastAccessed updatedAt createdAt',
    buildFilter: (ctx, Model) => ({
      user: ctx.resolveUserValue(Model),
      ...(ctx.cidObj
        ? {
            $or: [
              { companyId: ctx.cidObj },
              { companyId: null },
              { companyId: { $exists: false } },
            ],
          }
        : {}),
    }),
    enrichDocs: async (docs, ctx) => {
      const doc = docs[0];
      if (!doc?.course) return;
      const CourseModel = resolveModel('Course', '../../models/Course');
      if (CourseModel && typeof CourseModel.findById === 'function') {
        try {
          let q = CourseModel.findById(doc.course);
          if (typeof q.select === 'function') q = q.select('title');
          if (typeof q.maxTimeMS === 'function') q = q.maxTimeMS(DEFAULT_LOOKUP_MAX_TIME_MS);
          if (typeof q.lean === 'function') q = q.lean();
          const courseDoc = await q;
          if (courseDoc?.title) {
            ctx._courseTitle = String(courseDoc.title).trim();
          }
        } catch (_) {}
      }
    },
    mapDoc: (doc, ctx) => {
      const ts = extractTimestampMs(doc, ['lastAccessed', 'updatedAt', 'createdAt']);
      if (!ts) return null;
      const courseTitle = ctx._courseTitle || '';
      const titulo = courseTitle
        ? doc.isCourseCompleted
          ? `Curso completado: ${courseTitle}`
          : `Curso en progreso: ${courseTitle}`
        : doc.isCourseCompleted
          ? 'Curso completado en Academia WAPPY'
          : 'Avance en Academia WAPPY';
      const lessonsCount = Array.isArray(doc.completedLessons) ? doc.completedLessons.length : 0;
      return {
        tipo: 'academia',
        modulo: 'Academia WAPPY',
        categoria: 'academia',
        titulo,
        detalle: lessonsCount > 0 ? `${lessonsCount} lecciones completadas` : '',
        estado: doc.isCourseCompleted ? 'completado' : 'en curso',
        ts,
        _meta: { key: 'user_progress', priority: 64, coreTitle: normalizeCoreTitle(titulo) },
      };
    },
  },
  {
    key: 'event_registration',
    modelName: 'EventRegistration',
    requirePath: '../../models/EventRegistration',
    mode: 'findOne',
    priority: 64,
    sort: { registeredAt: -1, updatedAt: -1, createdAt: -1 },
    select: 'event registeredAt updatedAt createdAt',
    buildFilter: (ctx, Model) => ({
      user: ctx.resolveUserValue(Model),
    }),
    enrichDocs: async (docs, ctx) => {
      const doc = docs[0];
      if (!doc?.event) return;
      const EventModel = resolveModel('Event', '../../models/Event');
      if (EventModel && typeof EventModel.findById === 'function') {
        try {
          let q = EventModel.findById(doc.event);
          if (typeof q.select === 'function') q = q.select('title');
          if (typeof q.maxTimeMS === 'function') q = q.maxTimeMS(DEFAULT_LOOKUP_MAX_TIME_MS);
          if (typeof q.lean === 'function') q = q.lean();
          const eventDoc = await q;
          if (eventDoc?.title) {
            ctx._eventTitle = String(eventDoc.title).trim();
          }
        } catch (_) {}
      }
    },
    mapDoc: (doc, ctx) => {
      const ts = extractTimestampMs(doc, ['registeredAt', 'updatedAt', 'createdAt']);
      if (!ts) return null;
      const eventTitle = ctx._eventTitle || '';
      const titulo = eventTitle
        ? `Inscripción a evento: ${eventTitle}`
        : 'Inscripción a clase o evento en vivo';
      return {
        tipo: 'evento',
        modulo: 'Eventos en Vivo',
        categoria: 'academia',
        titulo,
        detalle: 'Registro confirmado',
        estado: 'inscrito',
        ts,
        _meta: { key: 'event_registration', priority: 64, coreTitle: normalizeCoreTitle(titulo) },
      };
    },
  },
  {
    key: 'ticket',
    modelName: 'Ticket',
    requirePath: '../../models/Ticket',
    mode: 'findOne',
    priority: 66,
    sort: { updatedAt: -1, createdAt: -1 },
    select: 'type description status updatedAt createdAt',
    buildFilter: (ctx, Model) => ({
      user: ctx.resolveUserValue(Model),
    }),
    mapDoc: (doc) => {
      const ts = extractTimestampMs(doc);
      if (!ts) return null;
      const titulo = doc.type ? `Ticket de soporte (${doc.type})` : 'Ticket de soporte';
      return {
        tipo: 'soporte',
        modulo: 'Soporte WAPPY',
        categoria: 'soporte',
        titulo,
        detalle: truncateText(doc.description, 70),
        estado: doc.status || 'pending',
        ts,
        _meta: { key: 'ticket', priority: 66, coreTitle: normalizeCoreTitle(titulo) },
      };
    },
  },
  {
    key: 'marketplace_order',
    modelName: 'MarketplaceOrder',
    requirePath: '../../models/MarketplaceOrder',
    mode: 'findOne',
    priority: 68,
    sort: { updatedAt: -1, createdAt: -1 },
    select: 'orderNumber items.title paymentStatus fulfillmentStatus updatedAt createdAt',
    buildFilter: (ctx, Model) => ({
      userId: ctx.resolveUserValue(Model, 'userId'),
    }),
    mapDoc: (doc) => {
      const ts = extractTimestampMs(doc);
      if (!ts) return null;
      const firstTitle = Array.isArray(doc.items) && doc.items[0]?.title ? doc.items[0].title : '';
      const titulo = firstTitle
        ? `Pedido Tienda: ${firstTitle}`
        : `Pedido ${doc.orderNumber || 'Marketplace'}`;
      return {
        tipo: 'marketplace',
        modulo: 'Tienda WAPPY',
        categoria: 'tienda',
        titulo,
        detalle: doc.orderNumber ? `Orden ${doc.orderNumber}` : '',
        estado: doc.fulfillmentStatus || doc.paymentStatus || 'NUEVO',
        ts,
        _meta: { key: 'marketplace_order', priority: 68, coreTitle: normalizeCoreTitle(titulo) },
      };
    },
  },
];

function buildPublicActivityItem(candidate) {
  const ts = candidate.ts;
  return {
    tipo: String(candidate.tipo || 'actividad'),
    modulo: String(candidate.modulo || 'Sistema'),
    categoria: String(candidate.categoria || 'general'),
    titulo: String(candidate.titulo || '').trim(),
    detalle: String(candidate.detalle || '').trim(),
    estado: String(candidate.estado || '').trim(),
    fecha: formatRelativeActivityDate(ts),
    fechaIso: new Date(ts).toISOString(),
    timestamp: ts,
  };
}

function shouldReplaceOrSkipCollision(acceptedItem, candidate) {
  const diffMs = Math.abs(acceptedItem.ts - candidate.ts);
  if (diffMs > GENERAL_DEDUP_WINDOW_MS) {
    return false;
  }

  const keyA = acceptedItem._meta?.key || '';
  const keyB = candidate._meta?.key || '';
  const isAutoLogPair =
    (keyA === 'automation_log' && keyB === 'automation') ||
    (keyA === 'automation' && keyB === 'automation_log');

  if (isAutoLogPair) {
    const sameFlowId =
      acceptedItem._meta?.automationId &&
      candidate._meta?.automationId &&
      acceptedItem._meta.automationId === candidate._meta.automationId;
    const sameFlowName =
      acceptedItem._meta?.coreTitle &&
      candidate._meta?.coreTitle &&
      acceptedItem._meta.coreTitle === candidate._meta.coreTitle;
    return Boolean((sameFlowId || sameFlowName) && diffMs <= AUTOMATION_DEDUP_WINDOW_MS);
  }

  const coreA = acceptedItem._meta?.coreTitle || '';
  const coreB = candidate._meta?.coreTitle || '';
  if (coreA && coreB && coreA === coreB) {
    return true;
  }

  const isEditorCanvasPair =
    (keyA === 'live_editor' && keyB === 'canvas_session') ||
    (keyA === 'canvas_session' && keyB === 'live_editor');
  if (isEditorCanvasPair) {
    const sameConvo =
      acceptedItem._meta?.conversationId &&
      candidate._meta?.conversationId &&
      acceptedItem._meta.conversationId === candidate._meta.conversationId;
    if (sameConvo || hasSignificantTokenOverlap(acceptedItem.titulo, candidate.titulo)) {
      return true;
    }
  }

  const isEstudioEditorPair =
    (keyA === 'estudio_puesto' && (keyB === 'live_editor' || keyB === 'canvas_session')) ||
    ((keyA === 'live_editor' || keyA === 'canvas_session') && keyB === 'estudio_puesto');
  if (isEstudioEditorPair) {
    const otherTitle = normalizeAscii(keyA === 'estudio_puesto' ? candidate.titulo : acceptedItem.titulo);
    const hasErgonomicKeyword = /\b(estudio|puesto|ergonom|biomecan|rula|reba)\b/i.test(otherTitle);
    if (hasErgonomicKeyword || hasSignificantTokenOverlap(acceptedItem.titulo, candidate.titulo)) {
      return true;
    }
  }

  return false;
}

function rankAndDeduplicateCandidates(rawCandidates, limit) {
  if (!Array.isArray(rawCandidates) || rawCandidates.length === 0) {
    return [];
  }

  const sorted = [...rawCandidates].sort((a, b) => {
    if (b.ts !== a.ts) {
      return b.ts - a.ts;
    }
    return (b._meta?.priority || 0) - (a._meta?.priority || 0);
  });

  // Pre-paso: si un AutomationLog y su Automation coinciden dentro de <= 15s, priorizar siempre AutomationLog
  const automationLogs = sorted.filter((c) => c._meta?.key === 'automation_log');
  const filtered = sorted.filter((c) => {
    if (c._meta?.key !== 'automation') {
      return true;
    }
    return !automationLogs.some((log) => {
      const sameId =
        log._meta?.automationId &&
        c._meta?.automationId &&
        log._meta.automationId === c._meta.automationId;
      const sameName =
        log._meta?.coreTitle &&
        c._meta?.coreTitle &&
        log._meta.coreTitle === c._meta.coreTitle;
      return (sameId || sameName) && Math.abs(log.ts - c.ts) <= AUTOMATION_DEDUP_WINDOW_MS;
    });
  });

  const accepted = [];
  const seenIdentityKeys = new Set();
  for (const cand of filtered) {
    const entityKeys = [];
    if (cand._meta?.automationId) entityKeys.push(`auto:${cand._meta.automationId}`);
    if (cand._meta?.conversationId) entityKeys.push(`convo:${cand._meta.conversationId}`);
    if (
      cand._meta?.coreTitle &&
      ['automation', 'automation_log', 'conversation', 'tenshi_prompt', 'tenshi_report'].includes(
        cand._meta?.key || '',
      )
    ) {
      const group = cand._meta.key.startsWith('automation') ? 'auto_group' : cand._meta.key;
      entityKeys.push(`title:${group}:${cand._meta.coreTitle}`);
    }
    if (entityKeys.some((k) => seenIdentityKeys.has(k))) {
      continue;
    }

    let handled = false;
    for (let i = 0; i < accepted.length; i += 1) {
      if (shouldReplaceOrSkipCollision(accepted[i], cand)) {
        if ((cand._meta?.priority || 0) > (accepted[i]._meta?.priority || 0)) {
          accepted[i] = cand;
        }
        handled = true;
        break;
      }
    }
    if (!handled) {
      accepted.push(cand);
      entityKeys.forEach((k) => seenIdentityKeys.add(k));
    }
  }

  accepted.sort((a, b) => {
    if (b.ts !== a.ts) {
      return b.ts - a.ts;
    }
    return (b._meta?.priority || 0) - (a._meta?.priority || 0);
  });

  const safeLimit = Math.max(1, Number.isFinite(Number(limit)) ? Number(limit) : 5);
  return accepted.slice(0, safeLimit).map(buildPublicActivityItem);
}

async function runDescriptor(descriptor, Model, baseCtx, collectedCandidates) {
  try {
    if (!Model) {
      return false;
    }

    const localCtx = { ...baseCtx };
    const filter = descriptor.buildFilter(localCtx, Model);
    if (!filter) {
      return false;
    }

    const isFindMany = descriptor.mode === 'find';
    const queryFn = isFindMany ? Model.find : Model.findOne;
    if (typeof queryFn !== 'function') {
      return false;
    }

    let query = queryFn.call(Model, filter);
    if (!query) {
      return false;
    }
    if (typeof query.sort === 'function') {
      query = query.sort(descriptor.sort || { updatedAt: -1, createdAt: -1 });
    }
    if (isFindMany && typeof query.limit === 'function') {
      query = query.limit(descriptor.limit || 3);
    }
    if (descriptor.select && typeof query.select === 'function') {
      query = query.select(descriptor.select);
    }
    if (typeof query.maxTimeMS === 'function') {
      query = query.maxTimeMS(descriptor.maxTimeMS || DEFAULT_QUERY_MAX_TIME_MS);
    }
    if (typeof query.lean === 'function') {
      query = query.lean();
    }

    const rawResult = await query;
    if (!rawResult) {
      return true;
    }

    const docs = Array.isArray(rawResult) ? rawResult : [rawResult];
    if (docs.length === 0) {
      return true;
    }

    if (typeof descriptor.enrichDocs === 'function') {
      await descriptor.enrichDocs(docs, localCtx);
    }

    const mapped =
      typeof descriptor.mapDocs === 'function'
        ? descriptor.mapDocs(docs, localCtx)
        : docs.map((d) => descriptor.mapDoc(d, localCtx));

    for (const item of mapped || []) {
      if (item && item.titulo && Number.isFinite(item.ts) && item.ts > 0) {
        collectedCandidates.push(item);
      }
    }
    return true;
  } catch (_) {
    return false;
  }
}

/**
 * Obtiene la última actividad real y las actividades recientes en todo el sistema WAPPY/SG-SST.
 */
async function getLatestSystemActivity({
  userId,
  companyId = null,
  viewerRole = '',
  limit = 5,
  timeoutMs = 1500,
} = {}) {
  const startedAt = Date.now();
  const ctx = buildContext({ userId, companyId, viewerRole });
  if (!ctx.uidStr) {
    return {
      ultimaActividad: null,
      actividadesRecientes: [],
      sourceCount: 0,
      elapsedMs: 0,
    };
  }

  const collectedCandidates = [];
  const activeDescriptors = [];
  for (const desc of ACTIVITY_SOURCE_DESCRIPTORS) {
    if (desc.isEnabled && !desc.isEnabled(ctx)) {
      continue;
    }
    const Model = resolveModel(desc.modelName, desc.requirePath);
    if (Model) {
      activeDescriptors.push({ desc, Model });
    }
  }

  const tasks = activeDescriptors.map(({ desc, Model }) =>
    runDescriptor(desc, Model, ctx, collectedCandidates),
  );
  const safeTimeoutMs = Math.max(50, Number.isFinite(Number(timeoutMs)) ? Number(timeoutMs) : 1500);

  let timer = null;
  const deadlinePromise = new Promise((resolve) => {
    timer = setTimeout(() => resolve('timeout'), safeTimeoutMs);
  });

  try {
    await Promise.race([Promise.allSettled(tasks), deadlinePromise]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }

  const topItems = rankAndDeduplicateCandidates([...collectedCandidates], limit);
  return {
    ultimaActividad: topItems[0] || null,
    actividadesRecientes: topItems,
    sourceCount: activeDescriptors.length,
    elapsedMs: Date.now() - startedAt,
  };
}

module.exports = {
  getLatestSystemActivity,
  formatRelativeActivityDate,
  ACTIVITY_SOURCE_DESCRIPTORS,
  resolveModel,
};
