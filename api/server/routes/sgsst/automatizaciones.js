const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const router = express.Router();
const requireJwtAuth = require('~/server/middleware/requireJwtAuth');
const CompanyInfo = require('~/models/CompanyInfo');
const Automation = require('~/models/Automation');
const AutomationLog = require('~/models/AutomationLog');
const { Agent } = require('~/db/models');
const {
  runAutomation,
  runWorkflowSandboxSimulation,
  calculateNextRun,
  stopAutomation,
  hasCronTrigger,
  executeDownstreamOutputs,
  getAutomationTriggersList,
  getTriggerNodeConfig,
  extractAutomationTriggerConfigs,
  resolveAutomationByVoiceOrQuery,
  getActiveRunningSnapshot,
  reconcileOrphanedRunningRuns,
} = require('~/server/services/automationScheduler');
const { inspectNodeLiveData } = require('~/server/services/workflowNodeInspectorService');
const {
  resolveStrictExecutionContext,
  listActiveTenshiFlows,
  matchTenshiFlowByQuery,
  executeTenshiFlowInstant,
} = require('~/server/services/tenshiFlowService');

const UserPlan = require('~/db/models/UserPlan');

function safeSecretEquals(expectedSecret, providedSecret) {
  const expected = String(expectedSecret || '').trim();
  const provided = String(providedSecret || '').trim();
  if (!expected || !provided) return false;
  const h1 = crypto.createHash('sha256').update(expected, 'utf8').digest();
  const h2 = crypto.createHash('sha256').update(provided, 'utf8').digest();
  return crypto.timingSafeEqual(h1, h2);
}

/**
 * POST /api/sgsst/automatizaciones/webhook/:automationId
 * POST /api/sgsst/automatizaciones/webhook
 * Disparador público de Webhook autenticado por secreto (`trigger_webhook`), montado ANTES de `requireJwtAuth`.
 */
async function handlePublicAutomationWebhook(req, res) {
  try {
    const rawId =
      req.params?.automationId || req.body?.automationId || req.query?.automationId || '';
    const automationId = String(rawId).trim();

    const authHeader = String(req.headers?.authorization || '');
    const bearerToken = authHeader.replace(/^Bearer\s+/i, '').trim();
    const candidateSecret = String(
      req.headers?.['x-wappy-secret'] ||
        (bearerToken !== authHeader ? bearerToken : '') ||
        req.query?.secret ||
        req.body?.secret ||
        '',
    ).trim();

    let automation = null;
    if (automationId) {
      if (!mongoose.Types.ObjectId.isValid(automationId)) {
        return res.status(400).json({ error: 'El parámetro automationId debe ser un ID válido.' });
      }
      automation = await Automation.findOne({
        _id: automationId,
        isSystemPreset: { $ne: true },
        isTenshiFlow: { $ne: true },
        companyId: { $nin: ['SYSTEM_PRESET', 'TENSHI_GLOBAL'] },
      }).lean();
    } else if (candidateSecret) {
      const activeWebhooks = await Automation.find({
        status: 'active',
        isSystemPreset: { $ne: true },
        isTenshiFlow: { $ne: true },
        companyId: { $nin: ['SYSTEM_PRESET', 'TENSHI_GLOBAL'] },
      }).lean();
      for (const cand of activeWebhooks) {
        const candTriggers = getAutomationTriggersList(cand);
        if (!candTriggers.includes('trigger_webhook')) continue;
        const candCfg = getTriggerNodeConfig(cand, 'trigger_webhook');
        const configured = String(candCfg?.webhookSecret || '').trim();
        if (configured && safeSecretEquals(configured, candidateSecret)) {
          automation = cand;
          break;
        }
      }
      if (!automation) {
        return res.status(401).json({
          error: 'No se encontró un flujo Webhook activo que coincida con ese secreto.',
        });
      }
    } else {
      return res.status(400).json({
        error: 'El parámetro automationId en la URL o el secreto en x-wappy-secret es obligatorio.',
      });
    }

    if (!automation) {
      return res.status(404).json({ error: 'Automatización no encontrada.' });
    }
    if (automation.status !== 'active') {
      return res.status(403).json({ error: 'La automatización está inactiva o pausada.' });
    }

    const triggers = getAutomationTriggersList(automation);
    if (!triggers.includes('trigger_webhook')) {
      return res.status(400).json({
        error: 'Esta automatización no tiene habilitado el disparador Webhook (trigger_webhook).',
      });
    }

    const webhookCfg = getTriggerNodeConfig(automation, 'trigger_webhook');
    const configuredSecret = String(webhookCfg?.webhookSecret || '').trim();

    if (configuredSecret && !safeSecretEquals(configuredSecret, candidateSecret)) {
      return res.status(401).json({ error: 'Secreto de Webhook inválido o no autorizado.' });
    }

    const sanitizedPayload = { ...(req.body && typeof req.body === 'object' ? req.body : {}) };
    delete sanitizedPayload.secret;

    const waitMode = String(req.query?.wait || '').toLowerCase() === 'true';
    if (waitMode) {
      await runAutomation(automation, {
        triggerSource: 'webhook',
        eventPayload: sanitizedPayload,
      });
    } else {
      setImmediate(() => {
        runAutomation(automation, {
          triggerSource: 'webhook',
          eventPayload: sanitizedPayload,
        }).catch((whErr) => {
          console.error('[Webhook Trigger] Error en corrida background:', whErr?.message || whErr);
        });
      });
    }

    return res.json({
      success: true,
      automationId: automation._id,
      message: 'Flujo disparado por Webhook',
    });
  } catch (err) {
    console.error('[API Automatizaciones Webhook] Error:', err);
    return res.status(500).json({ error: 'Error interno al procesar el disparo por Webhook.' });
  }
}

router.post('/webhook/:automationId', handlePublicAutomationWebhook);
router.post('/webhook', handlePublicAutomationWebhook);

/**
 * GET /api/sgsst/automatizaciones/evidencias/:fileName
 * Endpoint público/seguro para servir certificados PDF e imágenes de soporte extraídos por Web Scraping
 * (registrado ANTES del middleware JWT para permitir <img src>, <iframe src>, enlaces en nueva pestaña y correos en Gmail sin 401).
 */
router.get('/evidencias/:fileName', (req, res) => {
  try {
    const safeName = path.basename(String(req.params.fileName || '').trim());
    if (!/^[a-zA-Z0-9._-]+\.(pdf|png|jpg|jpeg)$/i.test(safeName)) {
      return res.status(400).json({ error: 'Nombre de archivo de evidencia inválido.' });
    }

    const evidencesDir = path.resolve(process.cwd(), 'uploads', 'scraper_evidences');
    const filePath = path.resolve(evidencesDir, safeName);
    if (!filePath.startsWith(evidencesDir + path.sep)) {
      return res.status(400).json({ error: 'Ruta de evidencia no permitida.' });
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Evidencia no encontrada o expirada.' });
    }

    const ext = path.extname(safeName).toLowerCase();
    const mimeType =
      ext === '.pdf'
        ? 'application/pdf'
        : ext === '.png'
          ? 'image/png'
          : 'image/jpeg';

    const disposition = req.query.download === '1' ? 'attachment' : 'inline';
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Cache-Control', 'public, max-age=604800');
    res.setHeader('Content-Disposition', `${disposition}; filename="${safeName}"`);
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.removeHeader('X-Frame-Options');

    const stream = fs.createReadStream(filePath);
    stream.on('error', (streamErr) => {
      console.error('[API Automatizaciones Evidencias] Stream error:', streamErr.message);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Error al leer el archivo de evidencia.' });
      } else {
        res.end();
      }
    });
    return stream.pipe(res);
  } catch (err) {
    console.error('[API Automatizaciones Evidencias] Error sirviendo evidencia:', err);
    return res.status(500).json({ error: 'Error interno al servir la evidencia.' });
  }
});

// Autenticación resiliente: valida JWT Bearer y, si expiró o fue sobreescrito por un token antiguo en localStorage,
// recupera automáticamente la sesión activa desde la cookie httpOnly refreshToken de WAPPY.
router.use((req, res, next) => {
  passport.authenticate('jwt', { session: false }, async (err, user) => {
    if (!err && user) {
      user.id = String(user._id || user.id);
      req.user = user;
      return next();
    }
    try {
      const cookieHeader = String(req.headers?.cookie || '');
      let refreshToken = req.cookies?.refreshToken || '';
      if (!refreshToken && cookieHeader) {
        const match = cookieHeader.match(/(?:^|;\s*)refreshToken=([^;]+)/);
        if (match && match[1]) refreshToken = decodeURIComponent(match[1]);
      }
      if (refreshToken && process.env.JWT_REFRESH_SECRET) {
        const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        if (payload && payload.id && mongoose.Types.ObjectId.isValid(String(payload.id))) {
          const User = mongoose.models.User || mongoose.model('User');
          const dbUser = await User.findById(payload.id).lean();
          if (dbUser) {
            dbUser.id = String(dbUser._id);
            req.user = dbUser;
            return next();
          }
        }
      }
    } catch (_) {}
    return requireJwtAuth(req, res, next);
  })(req, res, next);
});

// Bloquear acceso a sub-usuarios: las automatizaciones son exclusivas de la cuenta principal de la empresa
router.use((req, res, next) => {
  if (req.user?.isSubUser) {
    return res.status(403).json({ error: 'Los sub-usuarios no tienen permisos para gestionar o ejecutar automatizaciones.' });
  }
  next();
});

// Tareas (antes "Automatizaciones IA"): EXCLUSIVO para Administradores y cuentas Wappy Pro
router.use(async (req, res, next) => {
  try {
    const role = req.user?.role;
    if (role === 'ADMIN' || role === 'USER_PRO' || role === 'PRO') {
      return next();
    }
    const userPlanDoc = await UserPlan.findOne({ userId: req.user?.id }).select('plan').lean();
    if (['pro', 'admin'].includes(userPlanDoc?.plan)) {
      return next();
    }
    return res.status(403).json({
      error: 'La sección Tareas (automatizaciones de agentes IA) es exclusiva para Administradores y cuentas Wappy Pro.',
    });
  } catch (err) {
    console.error('[API Automatizaciones] Error verificando plan:', err);
    return res.status(500).json({ error: 'No fue posible verificar el plan del usuario.' });
  }
});

// Auxiliar para obtener el ID de la empresa objetivo/activa del usuario (respeta aislamiento estricto de subusuarios y empresas)
async function getActiveCompanyId(
  userId,
  explicitCompanyId = null,
  userRole = '',
  reqUser = null,
  allowAdminCrossTenant = true,
) {
  const effectiveUser =
    reqUser && typeof reqUser === 'object'
      ? {
          ...reqUser,
          id: String(reqUser.id || reqUser._id || userId || ''),
          role: reqUser.role || userRole || '',
        }
      : {
          id: String(userId || ''),
          role: userRole || '',
        };

  const ctx = await resolveStrictExecutionContext({
    reqUser: effectiveUser,
    explicitCompanyId,
    allowAdminCrossTenant,
  });

  return ctx?.companyId || null;
}

// Catálogo oficial auditado de 15 Flujos Maestros del Sistema (Arquitectura DAG n8n de WAPPY IA)
const {
  SYSTEM_WORKFLOW_PRESETS_VERSION,
  SYSTEM_WORKFLOW_PRESETS_CATALOG: DEFAULT_SYSTEM_PRESETS,
} = require('~/server/services/systemWorkflowPresetsCatalog');

let _syncedPresetsVersion = null;
let _syncPresetsPromise = null;

async function ensureDefaultSystemPresets() {
  if (_syncedPresetsVersion === SYSTEM_WORKFLOW_PRESETS_VERSION) {
    return;
  }
  if (_syncPresetsPromise) {
    return _syncPresetsPromise;
  }

  _syncPresetsPromise = (async () => {
    try {
      const allAgents = await Agent.find({}).select('id name').lean();
      const resolveAgentForPreset = (targetName) => {
        if (/tenshi.*avatar/i.test(String(targetName || ''))) {
          return {
            id: 'tenshi_avatar_orchestrator',
            name: '🐱 Tenshi Avatar (Voz y Orquestador 3D)',
          };
        }
        if (!allAgents || allAgents.length === 0) {
          return { id: 'agent_consultor_sg_sst', name: targetName || 'Consultor SG-SST' };
        }
        const cleanTarget = String(targetName || '').trim().toLowerCase();
        if (cleanTarget) {
          const exact = allAgents.find((a) => a.name && a.name.toLowerCase() === cleanTarget);
          if (exact) return { id: exact.id, name: exact.name };
          const partial = allAgents.find((a) => a.name && a.name.toLowerCase().includes(cleanTarget));
          if (partial) return { id: partial.id, name: partial.name };
        }
        const consultor = allAgents.find((a) => /Consultor SG-SST/i.test(a.name));
        if (consultor) return { id: consultor.id, name: consultor.name };
        return { id: allAgents[0].id, name: allAgents[0].name };
      };

      const resolvePresetSchedule = (preset) => {
        if (preset.scheduleType && preset.scheduleConfig) {
          return {
            scheduleType: preset.scheduleType,
            scheduleConfig: preset.scheduleConfig,
          };
        }
        const cronParts = String(preset.cronExpression || '').trim().split(/\s+/);
        const parsedMinute = Number.parseInt(cronParts[0], 10);
        const parsedHour = Number.parseInt(cronParts[1], 10);
        const parsedDom = Number.parseInt(cronParts[2], 10);
        const parsedDow = cronParts[4] && cronParts[4] !== '*'
          ? cronParts[4]
              .split(',')
              .map((d) => Number.parseInt(d, 10))
              .filter((d) => Number.isFinite(d) && d >= 0 && d <= 6)
          : [];
        const rawSchedule = String(preset.schedule || preset.scheduleType || 'daily').toLowerCase().trim();
        let scheduleType = 'daily';
        if (rawSchedule === 'hourly') scheduleType = 'hourly';
        else if (rawSchedule === 'monthly') scheduleType = 'monthly';
        else if (rawSchedule === 'weekly' || rawSchedule.startsWith('weekly_') || parsedDow.length > 0) {
          scheduleType = 'weekly';
        }
        const days = parsedDow.length > 0 ? parsedDow : [1];
        return {
          scheduleType,
          scheduleConfig: preset.scheduleConfig || {
            hour: Number.isFinite(parsedHour) ? parsedHour : 8,
            minute: Number.isFinite(parsedMinute) ? parsedMinute : 0,
            dayOfWeek: days,
            daysOfWeek: days,
            dayOfMonth: Number.isFinite(parsedDom) ? parsedDom : 1,
            intervalHours: 4,
          },
        };
      };

      const ops = DEFAULT_SYSTEM_PRESETS.map((preset) => {
        const ag = resolveAgentForPreset(preset.agentTargetName || preset.agentName);
        const resolvedSchedule = resolvePresetSchedule(preset);
        return {
          updateOne: {
            filter: { isSystemPreset: true, isTenshiFlow: { $ne: true }, presetKey: preset.presetKey },
            update: {
              $set: {
                presetCategory: preset.presetCategory,
                presetDescription: preset.presetDescription,
                name: preset.name,
                agentId: ag.id,
                agentName: ag.name,
                prompt: preset.prompt,
                scheduleType: resolvedSchedule.scheduleType,
                scheduleConfig: resolvedSchedule.scheduleConfig,
                workflowNodes: preset.workflowNodes,
              },
              $setOnInsert: {
                companyId: 'SYSTEM_PRESET',
                isSystemPreset: true,
                isTenshiFlow: false,
                presetKey: preset.presetKey,
                emails: [],
                status: 'inactive',
                nextRunAt: null,
              },
            },
            upsert: true,
          },
        };
      });

      if (ops.length > 0) {
        await Automation.bulkWrite(ops, { ordered: false });
      }
      const validPresetKeys = DEFAULT_SYSTEM_PRESETS.map((p) => p.presetKey).filter(Boolean);
      if (validPresetKeys.length > 0) {
        await Automation.deleteMany({
          isSystemPreset: true,
          isTenshiFlow: { $ne: true },
          presetKey: { $nin: validPresetKeys },
        });
      }
      _syncedPresetsVersion = SYSTEM_WORKFLOW_PRESETS_VERSION;
    } catch (err) {
      console.error('[API Automatizaciones] Error asegurando los 15 Flujos Maestros del Sistema:', err);
    } finally {
      _syncPresetsPromise = null;
    }
  })();

  return _syncPresetsPromise;
}

const ADMIN_SAMPLE_AUTOMATIONS_VERSION = '2026-11-12-n8n-v2';
const ADMIN_SAMPLE_PRESET_KEYS = ['admin_sample_n8n_v2_emo', 'admin_sample_n8n_v2_atel'];

async function ensureAdminSampleAutomations(user, companyId, force = false) {
  if (!user || user.role !== 'ADMIN' || !companyId) return;
  if (!force) {
    const legacySamples = await Automation.find({
      companyId,
      isSystemPreset: { $ne: true },
      isTenshiFlow: { $ne: true },
      name: /^\[Ejemplo Admin\]/i,
      presetKey: { $nin: ADMIN_SAMPLE_PRESET_KEYS },
    })
      .select('_id')
      .lean();
    if (legacySamples.length > 0) {
      const legacyIds = legacySamples.map((s) => s._id);
      await AutomationLog.deleteMany({ automation: { $in: legacyIds } });
      await Automation.deleteMany({ _id: { $in: legacyIds } });
    } else {
      const existingCount = await Automation.countDocuments({
        companyId,
        isSystemPreset: { $ne: true },
        isTenshiFlow: { $ne: true },
      });
      if (existingCount > 0) return;
    }
  } else {
    // Si fuerza recarga desde el botón Admin, reemplazamos los ejemplos previos [Ejemplo Admin]
    const oldSamples = await Automation.find({
      companyId,
      isTenshiFlow: { $ne: true },
      name: /^\[Ejemplo Admin\]/i,
    })
      .select('_id')
      .lean();
    if (oldSamples.length > 0) {
      const oldIds = oldSamples.map((s) => s._id);
      await AutomationLog.deleteMany({ automation: { $in: oldIds } });
      await Automation.deleteMany({ _id: { $in: oldIds } });
    }
  }

  try {
    const medicoAgent = await Agent.findOne({ name: /Médico Laboral|Consultor SG-SST/i })
      .select('id name')
      .lean();
    const consultorAgent = await Agent.findOne({ name: /Consultor SG-SST/i })
      .select('id name')
      .lean();

    const agent1Id = medicoAgent?.id || 'agent_medico_laboral';
    const agent1Name = medicoAgent?.name || 'Médico Laboral';
    const agent2Id = consultorAgent?.id || 'agent_consultor_sg_sst';
    const agent2Name = consultorAgent?.name || 'Consultor SG-SST';
    const adminEmail = user.email ? [user.email] : ['admin@wappy.club'];

    const sample1RunAt = new Date(Date.now() - 2 * 3600 * 1000);
    const sample2RunAt = new Date(Date.now() - 14 * 3600 * 1000);

    const sample1Result = `### 📂 Sincronización Google Drive → Extractor IA de Documentos → Perfil Sociodemográfico y Condiciones de Salud

**Carpeta vigilada en Google Drive:** \`Examenes Medicos EMO\`
**Secuencia ejecutada (${ADMIN_SAMPLE_AUTOMATIONS_VERSION}):** Google Drive → Condición Si/No (Pre-Agente) → ✨ Extractor IA de Documentos → Agente IA con Herramienta + (Perfil Sociodemográfico y Condiciones de Salud)

| Archivo Nuevo en Google Drive | Campos Extraídos con IA + OCR | Aplicativo Actualizado en Somos SST | Estado |
| :--- | :--- | :--- | :---: |
| \`Actualizacion_Sociodemografica_Octubre.xlsx\` | 4 colaboradores con actualización de EPS, cargo, turno y contacto de emergencia | **Hito 2: Perfil Sociodemográfico y Condiciones de Salud** | ✅ Sincronizado (4 perfiles actualizados) |
| \`Concepto_Aptitud_Carlos_Ramirez.pdf\` | Cédula, concepto de aptitud y recomendación ergonómica postural | **Hito 2: Perfil Sociodemográfico y Condiciones de Salud** | ✅ Registrado + Reporte enviado |

> **Dictamen Ejecutivo:** La compuerta condicional verificó archivos nuevos no procesados en la ventana anti-duplicados, el Extractor IA de Documentos estructuró los campos exactos y el Agente IA actualizó los expedientes reales en **Somos SST** mediante su aplicativo conectado en **Herramienta +**.`;

    const sample2Result = `### 🚨 Vigilancia Google Drive → Extractor IA de Documentos → Investigación de Accidentes ATEL y Actos Inseguros

**Carpeta vigilada en Google Drive:** \`Accidentes\`
**Secuencia ejecutada (${ADMIN_SAMPLE_AUTOMATIONS_VERSION}):** Google Drive → Condición Si/No (Pre-Agente) → ✨ Extractor IA de Documentos → Agente IA con Herramienta + (Investigación ATEL + Actos y Condiciones Inseguras)

* **1. Reporte Preliminar de Accidente de Trabajo:** \`FURAT_Preliminar_Bodega_Norte.pdf\`
  * **Gestión en Somos SST:** El Extractor IA de Documentos obtuvo fecha, cédula, área, descripción de la lesión y 2 días de incapacidad; el Agente IA registró el caso en **Investigación de Accidentes e Incidentes ATEL (Hito 7)** y emitió su Informe Oficial HTML.
* **2. Inspección de Seguridad en Campo:** \`Inspeccion_Locativa_y_Actos_Semana42.xlsx\`
  * **Gestión en Somos SST:** Se registraron 2 condiciones locativas prioritarias en **Reporte de Actos y Condiciones Inseguras (Hito 4)** y se creó la tarea correctiva en el **Centro de Control ACPM**.

\`\`\`wappy-card
{
  "title": "Flujo Documental Drive → Somos SST Completado",
  "subtitle": "2 documentos nuevos extraídos con IA + OCR y asentados en Herramienta +",
  "items": [
    {
      "title": "Investigación de Accidentes e Incidentes ATEL (Hito 7)",
      "description": "1 nuevo expediente registrado con Informe Oficial HTML adjunto desde FURAT_Preliminar_Bodega_Norte.pdf."
    },
    {
      "title": "Actos y Condiciones Inseguras + Tarea ACPM (Hito 4)",
      "description": "2 hallazgos locativos registrados desde Inspeccion_Locativa_y_Actos_Semana42.xlsx con acción correctiva asignada."
    }
  ]
}
\`\`\``;

    const auto1 = await Automation.create({
      user: user.id,
      companyId,
      presetKey: 'admin_sample_n8n_v2_emo',
      presetCategory: 'salud_vencimientos',
      presetDescription:
        'Vigila conceptos médicos ocupacionales o nóminas nuevas en Google Drive, detiene en Rama NO con 0 tokens IA si no hay archivos nuevos, extrae campos exactos con el Extractor IA de Documentos y actualiza el Perfil Sociodemográfico y Condiciones de Salud conectado en Herramienta +.',
      name: '[Ejemplo Admin] Vigilar Google Drive (EMO / Sociodemográfico) y Actualizar Perfil Sociodemográfico',
      agentId: agent1Id,
      agentName: agent1Name,
      prompt:
        'Con base en las filas estructuradas obtenidas por el Extractor IA de Documentos desde los archivos nuevos de Google Drive ("Examenes Medicos EMO"), valida cada colaborador identificado y actualiza su expediente real en el aplicativo de Perfil Sociodemográfico y Condiciones de Salud conectado en tus herramientas. Si Google Drive no está vinculado o no existen archivos nuevos verificables, infórmalo con total transparencia sin inventar ni simular datos. Entrega un informe ejecutivo en Markdown con los colaboradores actualizados, concepto de aptitud, recomendaciones médicas y fecha del examen.',
      scheduleType: 'daily',
      scheduleConfig: { hour: 18, minute: 0 },
      workflowNodes: {
        trigger: 'schedule_cron',
        triggers: ['schedule_cron', 'trigger_tenshi'],
        extractors: ['extract_drive', 'extract_ai_doc_ocr'],
        aiEngine: 'wappy',
        aiModel: 'gemini-3.6-flash',
        memoryNode: 'wappy_memory_company',
        memories: ['wappy_memory_company', 'wappy_memory_antiduplicate'],
        inputs: [],
        includeIfNode: true,
        hitos: ['hito2_perfil_socio'],
        outputs: ['email_report', 'wappy_notification'],
        canvasLayout: {
          nodeConfigs: {
            extractor_extract_drive: {
              driveFolderName: 'Examenes Medicos EMO',
              fileTypeFilter: 'pdf,xlsx,docx',
            },
            if_router: {
              ifPlacement: 'pre_agent',
              ifConditionLabel: '¿Existen Archivos Nuevos de EMO o Sociodemográfico en Google Drive?',
              ifConditionType: 'new_external_items',
              ifRuleExpression: '>= 1',
            },
            extractor_extract_ai_doc_ocr: {
              aiModel: 'gemini-3.6-flash',
              aiExtractionRowMode: 'multiple_rows',
              upstreamSourceType: 'drive',
              aiExtractionSchema: [
                {
                  name: 'Cédula',
                  type: 'string',
                  description: 'Número de documento de identidad del trabajador',
                },
                {
                  name: 'Nombre Completo',
                  type: 'string',
                  description: 'Nombres y apellidos completos del colaborador',
                },
                {
                  name: 'Cargo',
                  type: 'string',
                  description: 'Cargo u ocupación desempeñada',
                },
                {
                  name: 'Concepto de Aptitud',
                  type: 'string',
                  description: 'Concepto médico ocupacional (Apto, Apto con restricciones o Aplazado)',
                },
                {
                  name: 'Recomendaciones o Restricciones',
                  type: 'string',
                  description: 'Recomendaciones médicas ocupacionales o restricciones laborales vigentes',
                },
                {
                  name: 'Fecha Examen Médico',
                  type: 'date',
                  description: 'Fecha de realización del examen médico ocupacional (YYYY-MM-DD)',
                },
              ],
            },
            tool_hitos_hito2_perfil_socio: {
              hitoRole: 'agent_tool',
              hitoOperationMode: 'audit_and_update',
              appActionMode: 'write_and_update',
              generateAppReport: false,
            },
            hito_hito2_perfil_socio: {
              hitoRole: 'agent_tool',
              hitoOperationMode: 'audit_and_update',
              appActionMode: 'write_and_update',
              generateAppReport: false,
            },
            out_email_report: { ifBranch: 'yes' },
            out_wappy_notification: { ifBranch: 'no' },
          },
        },
      },
      emails: adminEmail,
      status: 'inactive',
      lastRunAt: sample1RunAt,
      lastRunStatus: 'success',
      lastRunResult: sample1Result,
      nextRunAt: null,
    });

    const auto2 = await Automation.create({
      user: user.id,
      companyId,
      presetKey: 'admin_sample_n8n_v2_atel',
      presetCategory: 'accidentes_campo',
      presetDescription:
        'Vigila reportes nuevos de accidentes laborales (FURAT) o inspecciones en Google Drive, detiene en Rama NO con 0 tokens IA si no hay archivos nuevos, estructura los datos con el Extractor IA de Documentos y registra el caso en Investigación ATEL y Actos/Condiciones Inseguras.',
      name: '[Ejemplo Admin] Vigilar Google Drive (FURAT / Inspecciones) y Registrar Investigación ATEL',
      agentId: agent2Id,
      agentName: agent2Name,
      prompt:
        'Revisa las filas estructuradas obtenidas por el Extractor IA de Documentos a partir de los archivos nuevos detectados en la carpeta "Accidentes" de Google Drive. 1) Si el documento corresponde a un reporte de accidente o incidente de trabajo (FURAT), registra el expediente completo con sus datos exactos en el aplicativo de Investigación de Accidentes e Incidentes ATEL conectado en tus herramientas. 2) Si incluye hallazgos de inspecciones o condiciones inseguras en campo, regístralos en el aplicativo de Reporte de Actos y Condiciones Inseguras conectado en tus herramientas. Jamás inventes ni simules sucesos que no provengan de los archivos nuevos reales y entrega un resumen ejecutivo en Markdown con los casos registrados y las medidas correctivas.',
      scheduleType: 'daily',
      scheduleConfig: { hour: 7, minute: 30 },
      workflowNodes: {
        trigger: 'schedule_cron',
        triggers: ['schedule_cron', 'trigger_tenshi'],
        extractors: ['extract_drive', 'extract_ai_doc_ocr'],
        aiEngine: 'wappy',
        aiModel: 'gemini-3.8-flash',
        memoryNode: 'wappy_memory_company',
        memories: ['wappy_memory_company', 'wappy_memory_antiduplicate'],
        inputs: [],
        includeIfNode: true,
        hitos: ['hito7_investigacion_atel', 'hito4_actos_condiciones'],
        outputs: ['acpm_task', 'email_report', 'wappy_notification'],
        canvasLayout: {
          nodeConfigs: {
            extractor_extract_drive: {
              driveFolderName: 'Accidentes',
              fileTypeFilter: 'pdf,xlsx,docx',
            },
            if_router: {
              ifPlacement: 'pre_agent',
              ifConditionLabel: '¿Hay FURAT o Inspección Nueva sin Procesar en Google Drive?',
              ifConditionType: 'new_external_items',
              ifRuleExpression: '>= 1',
            },
            extractor_extract_ai_doc_ocr: {
              aiModel: 'gemini-3.6-flash',
              aiExtractionRowMode: 'multiple_rows',
              upstreamSourceType: 'drive',
              aiExtractionSchema: [
                {
                  name: 'Tipo de Evento',
                  type: 'string',
                  description: 'Accidente de Trabajo, Incidente o Condición Insegura',
                },
                {
                  name: 'Cédula Trabajador',
                  type: 'string',
                  description: 'Número de documento de identidad del trabajador involucrado',
                },
                {
                  name: 'Nombre Trabajador',
                  type: 'string',
                  description: 'Nombre completo del colaborador afectado o reportante',
                },
                {
                  name: 'Fecha del Evento',
                  type: 'date',
                  description: 'Fecha exacta del accidente, incidente o inspección (YYYY-MM-DD)',
                },
                {
                  name: 'Área o Lugar',
                  type: 'string',
                  description: 'Planta, bodega, sede o frente de trabajo donde ocurrió',
                },
                {
                  name: 'Descripción y Lesión o Hallazgo',
                  type: 'string',
                  description: 'Descripción objetiva del evento, lesión sufrida o condición insegura detectada',
                },
                {
                  name: 'Días de Incapacidad',
                  type: 'number',
                  description: 'Cantidad de días de incapacidad médica inicial (0 si no aplica)',
                },
              ],
            },
            tool_hitos_hito7_investigacion_atel: {
              hitoRole: 'agent_tool',
              hitoOperationMode: 'write_register',
              appActionMode: 'write_and_report',
              generateAppReport: true,
            },
            hito_hito7_investigacion_atel: {
              hitoRole: 'agent_tool',
              hitoOperationMode: 'write_register',
              appActionMode: 'write_and_report',
              generateAppReport: true,
            },
            tool_hitos_hito4_actos_condiciones: {
              hitoRole: 'agent_tool',
              hitoOperationMode: 'write_register',
              appActionMode: 'write_and_update',
              generateAppReport: false,
            },
            hito_hito4_actos_condiciones: {
              hitoRole: 'agent_tool',
              hitoOperationMode: 'write_register',
              appActionMode: 'write_and_update',
              generateAppReport: false,
            },
            out_acpm_task: { ifBranch: 'yes' },
            out_email_report: { ifBranch: 'yes' },
            out_wappy_notification: { ifBranch: 'no' },
          },
        },
      },
      emails: adminEmail,
      status: 'inactive',
      lastRunAt: sample2RunAt,
      lastRunStatus: 'success',
      lastRunResult: sample2Result,
      nextRunAt: null,
    });

    await AutomationLog.insertMany([
      {
        automation: auto1._id,
        user: user.id,
        companyId,
        agentId: agent1Id,
        agentName: agent1Name,
        prompt: auto1.prompt,
        runAt: sample1RunAt,
        status: 'success',
        result: sample1Result,
      },
      {
        automation: auto2._id,
        user: user.id,
        companyId,
        agentId: agent2Id,
        agentName: agent2Name,
        prompt: auto2.prompt,
        runAt: sample2RunAt,
        status: 'success',
        result: sample2Result,
      },
    ]);
  } catch (seedErr) {
    console.error('[API Automatizaciones] Error sembrando ejemplos para ADMIN:', seedErr);
  }
}

/**
 * Asegura que exista un Flujo Simple de 4 pasos (exclusivo para usuarios ADMIN) en la empresa activa,
 * ideal para probar orden consecutivo (Paso #1 ➔ Paso #2 ➔ Paso #3 ➔ Paso #4), extracción quirúrgica
 * y el Escenario de Desarrollo (▶ Dar Play · Probar sin Enviar).
 */
async function ensureSimpleAdminFlow(user, companyId) {
  try {
    if (!user || user.role !== 'ADMIN' || !companyId) return;

    const existingSimple = await Automation.findOne({
      companyId,
      isSystemPreset: { $ne: true },
      isTenshiFlow: { $ne: true },
      $or: [
        { presetKey: 'admin_simple_flow_v1' },
        { adminOnly: true, name: /Flujo Simple/i },
      ],
    }).lean();

    if (existingSimple) return;

    await Automation.create({
      user: user.id,
      companyId,
      isSystemPreset: false,
      adminOnly: true,
      presetKey: 'admin_simple_flow_v1',
      presetCategory: 'salud_vencimientos',
      presetDescription:
        'Flujo lineal limpio de 4 pasos exclusivos para pruebas de Administrador: 1) Disparador Tenshi IA ➔ 2) Extraer Trabajadores (Cédula, Nombre, Cargo, ARL y EPS) ➔ 3) Agente IA Tenshi ➔ 4) Notificación en WAPPY.',
      name: '⚡ [Solo Admin] Flujo Simple (4 Pasos): Cédula y Nombre ➔ Tenshi IA ➔ Alerta WAPPY',
      agentId: 'tenshi_avatar_orchestrator',
      agentName: '🐱 Tenshi Avatar (Voz y Orquestador 3D)',
      prompt:
        'Sigue estrictamente el orden consecutivo del flujo (Paso #1 Disparador ➔ Paso #2 Extraer Trabajadores ➔ Paso #3 Agente IA ➔ Paso #4 Notificación WAPPY). Con los datos extraídos en el Paso #2, responde directamente a la consulta de entrada entregando una tabla limpia con Cédula / Documento, Nombre Completo, Cargo, ARL y EPS de los trabajadores activos de la empresa.',
      scheduleType: 'daily',
      scheduleConfig: { hour: 8, minute: 0, dayOfWeek: [1, 2, 3, 4, 5] },
      workflowNodes: {
        trigger: 'trigger_tenshi',
        triggers: ['trigger_tenshi'],
        extractors: ['extract_sst_workers'],
        aiEngine: 'wappy',
        aiModel: 'gemini-3.6-flash',
        memoryNode: 'wappy_memory_company',
        memories: ['wappy_memory_company'],
        includeIfNode: false,
        inputs: [],
        hitos: [],
        outputs: ['wappy_notification'],
        canvasLayout: {
          positions: {
            trigger_root: { x: 70, y: 120 },
            extractor_extract_sst_workers: { x: 270, y: 120 },
            agent_root: { x: 480, y: 112 },
            sub_model: { x: 440, y: 275 },
            sub_memory_wappy_memory_company: { x: 580, y: 275 },
            out_wappy_notification: { x: 770, y: 120 },
          },
          extraElements: [],
          customEdges: [],
          removedDefaultEdges: [],
          nodeConfigs: {
            extractor_extract_sst_workers: {
              selectedFields: ['Cédula / Documento', 'Nombre Completo', 'Cargo', 'ARL', 'EPS'],
              strictFieldFilter: true,
              inputContext: 'Recibe la consulta o filtro enviado en el Disparador Tenshi IA (Paso #1)',
              outputContext: 'Entrega únicamente Cédula, Nombre Completo, Cargo, ARL y EPS al Agente IA (Paso #3)',
              filterRule: 'Solo trabajadores activos de la empresa',
            },
            agent_root: {
              selectedFields: [
                'Cruce Exacto con Pregunta de Entrada',
                'Tabla Markdown Estructurada',
                'Respuesta Directa sin Relleno',
              ],
              inputContext: 'Recibe los trabajadores filtrados del Paso #2 (Cédula, Nombre, Cargo, ARL y EPS)',
              outputContext: 'Genera tabla limpia con Cédula y Nombre Completo para la notificación WAPPY (Paso #4)',
              filterRule: 'Responder directamente a la entrada del disparador respetando el orden consecutivo',
            },
          },
        },
      },
      emails: user.email ? [user.email] : [],
      status: 'inactive',
      nextRunAt: null,
    });
  } catch (err) {
    console.error('[API Automatizaciones] Error creando Flujo Simple para ADMIN:', err);
  }
}

// Auxiliar para obtener el límite efectivo de automatizaciones del usuario
async function getEffectiveAutomationLimit(userId, userRole) {
  if (!userId) return { limit: 0, plan: 'free' };
  const userPlanDoc = await UserPlan.findOne({ userId }).lean();
  let plan = userPlanDoc?.plan;
  if (!plan || plan === 'free') {
    if (userRole === 'ADMIN') plan = 'admin';
    else if (userRole === 'USER_PRO') plan = 'pro';
    else if (userRole === 'USER_PLUS') plan = 'plus';
    else if (userRole === 'USER_GO') plan = 'go';
    else if (userRole === 'USER_CUSTOM') plan = 'custom';
    else if (userRole === 'USER_IPEVAR') plan = 'ipevar';
    else plan = 'free';
  }

  if (userPlanDoc?.automationLimit !== undefined && userPlanDoc?.automationLimit !== null) {
    return { limit: userPlanDoc.automationLimit, plan };
  }

  if (['admin', 'custom'].includes(plan)) {
    return { limit: 999, plan };
  }
  if (plan === 'pro') {
    return { limit: 1, plan };
  }
  return { limit: 0, plan };
}

/**
 * GET /api/sgsst/automatizaciones/node-live-inspector
 * Inspecciona en tiempo real los registros, KPIs, brechas e informes de cualquiera de los 50 aplicativos de los 8 Hitos.
 */
router.get('/node-live-inspector', async (req, res) => {
  try {
    const nodeId = String(req.query.nodeId || '').trim();
    if (!nodeId) {
      return res.status(400).json({ error: 'El parámetro nodeId es obligatorio.' });
    }
    const explicitCompanyId = req.query.companyId ? String(req.query.companyId).trim() : null;
    const companyId = await getActiveCompanyId(req.user.id, explicitCompanyId, req.user?.role, req.user);

    const optStr = (val) =>
      val !== undefined && val !== null && String(val).trim() !== ''
        ? String(val).trim()
        : undefined;
    const optBool = (val) =>
      val === undefined || val === null || val === ''
        ? undefined
        : val === true || val === 'true' || val === '1';

    const driveFolderId = optStr(req.query.driveFolderId);
    const driveFolderUrl = optStr(req.query.driveFolderUrl);
    const driveFolderName = optStr(req.query.driveFolderName) || '';
    const fileNameFilter = optStr(req.query.fileNameFilter);
    const fileTypeFilter = optStr(req.query.fileTypeFilter) || '';
    const maxItems = req.query.maxItems !== undefined ? Number(req.query.maxItems) || undefined : undefined;
    const watchFolderPath = optStr(req.query.watchFolderPath);
    const includeSubfolders = optBool(req.query.includeSubfolders);
    const recordFilterMode = optStr(req.query.recordFilterMode);
    const expiryAuditScope = optStr(req.query.expiryAuditScope);
    const dedupWindow = optStr(req.query.dedupWindow);
    const sstAppSourceId = optStr(req.query.sstAppSourceId) || '';
    const emailSubjectFilter = optStr(req.query.emailSubjectFilter) || '';
    const emailSenderFilter = optStr(req.query.emailSenderFilter);
    const timeWindow = optStr(req.query.timeWindow);
    const onlyWithAttachments = optBool(req.query.onlyWithAttachments);
    const endpointUrl = optStr(req.query.endpointUrl) || '';

    let aiExtractionSchema;
    if (
      req.query.aiExtractionSchema !== undefined &&
      req.query.aiExtractionSchema !== null &&
      String(req.query.aiExtractionSchema).trim() !== ''
    ) {
      if (Array.isArray(req.query.aiExtractionSchema)) {
        aiExtractionSchema = req.query.aiExtractionSchema;
      } else {
        try {
          aiExtractionSchema = JSON.parse(String(req.query.aiExtractionSchema));
        } catch {
          aiExtractionSchema = undefined;
        }
      }
    }
    let fields;
    if (req.query.fields !== undefined && req.query.fields !== null && String(req.query.fields).trim() !== '') {
      if (Array.isArray(req.query.fields)) {
        fields = req.query.fields;
      } else {
        try {
          const parsedFields = JSON.parse(String(req.query.fields));
          fields = Array.isArray(parsedFields)
            ? parsedFields
            : String(req.query.fields).split(',').map((s) => s.trim()).filter(Boolean);
        } catch {
          fields = String(req.query.fields).split(',').map((s) => s.trim()).filter(Boolean);
        }
      }
    }
    const aiExtractionRowMode = optStr(req.query.aiExtractionRowMode);
    const aiModel = optStr(req.query.aiModel);
    const customInstruction = optStr(req.query.customInstruction);
    const upstreamSourceType = optStr(req.query.upstreamSourceType);
    const runAiExtraction = optBool(req.query.runAiExtraction);

    const nodeConfig = {
      ...(driveFolderId !== undefined ? { driveFolderId } : {}),
      ...(driveFolderUrl !== undefined ? { driveFolderUrl } : {}),
      driveFolderName,
      ...(fileNameFilter !== undefined ? { fileNameFilter } : {}),
      fileTypeFilter,
      ...(maxItems !== undefined ? { maxItems } : {}),
      ...(watchFolderPath !== undefined ? { watchFolderPath } : {}),
      ...(includeSubfolders !== undefined ? { includeSubfolders } : {}),
      ...(recordFilterMode !== undefined ? { recordFilterMode } : {}),
      ...(expiryAuditScope !== undefined ? { expiryAuditScope } : {}),
      ...(dedupWindow !== undefined ? { dedupWindow } : {}),
      sstAppSourceId,
      emailSubjectFilter,
      ...(emailSenderFilter !== undefined ? { emailSenderFilter } : {}),
      ...(timeWindow !== undefined ? { timeWindow } : {}),
      ...(onlyWithAttachments !== undefined ? { onlyWithAttachments } : {}),
      endpointUrl,
      ...(aiExtractionSchema !== undefined ? { aiExtractionSchema } : {}),
      ...(fields !== undefined ? { fields } : {}),
      ...(aiExtractionRowMode !== undefined ? { aiExtractionRowMode } : {}),
      ...(aiModel !== undefined ? { aiModel } : {}),
      ...(customInstruction !== undefined ? { customInstruction } : {}),
      ...(upstreamSourceType !== undefined ? { upstreamSourceType } : {}),
      ...(runAiExtraction !== undefined ? { runAiExtraction } : {}),
    };

    const data = await inspectNodeLiveData({
      userId: req.user.id,
      companyId,
      nodeId,
      driveFolderId,
      driveFolderUrl,
      driveFolderName,
      fileNameFilter,
      fileTypeFilter,
      maxItems,
      watchFolderPath,
      includeSubfolders,
      recordFilterMode,
      expiryAuditScope,
      dedupWindow,
      sstAppSourceId,
      emailSubjectFilter,
      emailSenderFilter,
      timeWindow,
      onlyWithAttachments,
      endpointUrl,
      aiExtractionSchema,
      fields,
      aiExtractionRowMode,
      aiModel,
      customInstruction,
      upstreamSourceType,
      runAiExtraction,
      nodeConfig,
    });
    return res.json({ success: true, ...data });
  } catch (error) {
    console.error('[API Automatizaciones] Error en node-live-inspector:', error);
    return res.status(500).json({ error: 'Error al consultar datos en vivo del nodo.' });
  }
});

/**
 * POST /api/sgsst/automatizaciones/trigger-tenshi
 * Dispara automatizaciones del usuario/empresa con `'trigger_tenshi'` o Flujos Tenshi globales activos aislados por companyId.
 */
router.post('/trigger-tenshi', async (req, res) => {
  try {
    const commandText = String(
      req.body?.commandText || req.body?.text || req.body?.userInstruction || '',
    ).trim();
    const explicitAutomationId = req.body?.automationId ? String(req.body.automationId).trim() : '';
    const requestedChannel = String(req.body?.channel || 'voice').trim().toLowerCase();
    const activateIfInactive = req.body?.activateIfInactive !== false;
    if (!commandText && !explicitAutomationId) {
      return res.status(400).json({ error: 'El parámetro commandText es obligatorio.' });
    }

    const strictCtx = await resolveStrictExecutionContext({
      reqUser: req.user,
      reqObj: req,
      explicitCompanyId: req.body?.companyId || req.query?.companyId,
      allowAdminCrossTenant: false,
    });
    const companyId = strictCtx?.companyId || null;

    const queryFilter = {
      isSystemPreset: { $ne: true },
      isTenshiFlow: { $ne: true },
      companyId: { $nin: ['SYSTEM_PRESET', 'TENSHI_GLOBAL'] },
      ...(companyId ? { companyId } : { user: strictCtx?.tenantOwnerUserId || req.user.id }),
    };

    const candidates = await Automation.find(queryFilter).sort({ createdAt: -1 }).lean();

    let matched = [];
    let matchSource = null;
    let companyScore = 0;
    let selectedTenshiFlow = null;
    let tenshiMatchSource = null;

    if (explicitAutomationId && mongoose.Types.ObjectId.isValid(explicitAutomationId)) {
      const exactDoc = candidates.find((a) => String(a._id) === explicitAutomationId);
      if (exactDoc) {
        matched = [exactDoc];
        matchSource = 'id';
        companyScore = 100;
      } else {
        const tenshiDoc = await Automation.findOne({
          _id: explicitAutomationId,
          isTenshiFlow: true,
          companyId: 'TENSHI_GLOBAL',
          status: 'active',
        }).lean();
        if (tenshiDoc) {
          selectedTenshiFlow = tenshiDoc;
          tenshiMatchSource = 'id';
        }
      }
    }

    if (matched.length === 0 && !selectedTenshiFlow && commandText) {
      const resolved = resolveAutomationByVoiceOrQuery(candidates, commandText, {
        requireTenshiTrigger: true,
      });
      if (resolved.matches && resolved.matches.length > 0) {
        matchSource = resolved.matchSource;
        companyScore = Number(resolved.score || 0);
        matched = resolved.matches.filter((auto) => {
          const cfg = extractAutomationTriggerConfigs(auto);
          if (cfg.triggerChannel === 'voice' && requestedChannel === 'chat') return false;
          if (cfg.triggerChannel === 'chat' && requestedChannel === 'voice') return false;
          return true;
        });
      }

      const activeTenshiFlows = await listActiveTenshiFlows();
      const tenshiResolved = await matchTenshiFlowByQuery(commandText, activeTenshiFlows);
      if (tenshiResolved?.flow) {
        const tenshiCfg = extractAutomationTriggerConfigs(tenshiResolved.flow);
        const channelAllowed = !(
          (tenshiCfg.triggerChannel === 'voice' && requestedChannel === 'chat') ||
          (tenshiCfg.triggerChannel === 'chat' && requestedChannel === 'voice')
        );
        if (channelAllowed && (matched.length === 0 || Number(tenshiResolved.score || 0) > companyScore)) {
          selectedTenshiFlow = tenshiResolved.flow;
          tenshiMatchSource = tenshiResolved.matchSource;
        }
      }
    }

    if (selectedTenshiFlow) {
      if (strictCtx.error || !strictCtx.companyId) {
        return res.status(400).json({
          success: false,
          error: strictCtx.error || 'No hay una empresa activa registrada para tu usuario.',
        });
      }

      const shouldWait =
        req.query?.wait !== undefined
          ? String(req.query.wait).toLowerCase() !== 'false' && String(req.query.wait) !== '0'
          : req.body?.wait !== false && String(req.body?.wait || '').toLowerCase() !== 'false';
      const parsedTimeout = Number(req.body?.waitTimeoutMs || req.query?.waitTimeoutMs);
      const waitTimeoutMs = shouldWait
        ? Number.isFinite(parsedTimeout) && parsedTimeout > 0
          ? Math.min(parsedTimeout, 120000)
          : 40000
        : 0;

      const execRes = await executeTenshiFlowInstant({
        flow: selectedTenshiFlow,
        context: strictCtx,
        userInstruction: commandText || selectedTenshiFlow.name,
        waitTimeoutMs,
        triggerSource: requestedChannel === 'chat' ? 'tenshi_chat' : 'tenshi_voice',
      });

      return res.json({
        success: true,
        isTenshiFlow: true,
        triggeredCount: 1,
        flowId: execRes.flowId,
        flowName: execRes.flowName,
        logId: execRes.logId,
        companyId: execRes.companyId,
        companyName: execRes.companyName,
        completedInTurn: execRes.completedInTurn,
        status: execRes.status || (execRes.completedInTurn ? 'success' : 'running_background'),
        resultText: execRes.resultText || '',
        evidenceFiles: Array.isArray(execRes.evidenceFiles) ? execRes.evidenceFiles : [],
        automations: [
          {
            _id: selectedTenshiFlow._id,
            name: selectedTenshiFlow.name,
            isTenshiFlow: true,
            matchedBy: tenshiMatchSource,
          },
        ],
        message: execRes.completedInTurn
          ? `Flujo Tenshi «${selectedTenshiFlow.name}» ejecutado para ${execRes.companyName || 'tu empresa'}.`
          : `Flujo Tenshi «${selectedTenshiFlow.name}» iniciado en segundo plano para ${execRes.companyName || 'tu empresa'}.`,
      });
    }

    if (matched.length === 0) {
      return res.status(404).json({
        success: false,
        error:
          'No se encontró ninguna automatización con disparador de voz/texto Tenshi cuyo comando o título coincida con esa orden.',
      });
    }

    const triggeredAutos = [];
    for (const rawAuto of matched) {
      let auto = rawAuto;
      let activatedNow = false;

      if (auto.status !== 'active') {
        if (!activateIfInactive) {
          continue;
        }
        const { limit: effectiveLimit, plan: userPlanName } = await getEffectiveAutomationLimit(
          req.user.id,
          req.user.role,
        );
        const activeCount = await Automation.countDocuments({
          user: req.user.id,
          isSystemPreset: { $ne: true },
          isTenshiFlow: { $ne: true },
          companyId: { $nin: ['SYSTEM_PRESET', 'TENSHI_GLOBAL'] },
          status: 'active',
        });
        if (activeCount >= effectiveLimit) {
          return res.status(400).json({
            success: false,
            error: `El flujo «${auto.name}» está inactivo y alcanzaste el límite de ${effectiveLimit} automatización(es) activa(s) en tu plan ${userPlanName}.`,
          });
        }
        const nextRunAt = hasCronTrigger(auto)
          ? calculateNextRun(auto.scheduleType || 'daily', auto.scheduleConfig || {})
          : null;
        const updatedDoc = await Automation.findByIdAndUpdate(
          auto._id,
          { $set: { status: 'active', nextRunAt } },
          { new: true },
        ).lean();
        if (updatedDoc) {
          auto = updatedDoc;
          activatedNow = true;
        }
      }

      triggeredAutos.push({
        _id: auto._id,
        name: auto.name,
        matchedBy: matchSource,
        activatedNow,
      });

      setImmediate(() => {
        runAutomation(auto, {
          triggerSource: 'tenshi_voice',
          eventPayload: {
            commandText,
            matchedBy: matchSource,
            channel: requestedChannel,
            invokedBy: req.user?.email || req.user?.id,
            invokedAt: new Date().toISOString(),
          },
        }).catch((tErr) => {
          console.error('[Trigger Tenshi] Error ejecutando flujo:', tErr?.message || tErr);
        });
      });
    }

    if (triggeredAutos.length === 0) {
      return res.status(409).json({
        success: false,
        error: 'La automatización coincidente está inactiva.',
      });
    }

    return res.json({
      success: true,
      triggeredCount: triggeredAutos.length,
      automations: triggeredAutos,
      message: `Disparado(s) ${triggeredAutos.length} flujo(s) por comando Tenshi.`,
    });
  } catch (error) {
    console.error('[API Automatizaciones] Error en trigger-tenshi:', error);
    return res.status(500).json({ error: 'Error al procesar el comando de disparo Tenshi.' });
  }
});

/**
 * POST /api/sgsst/automatizaciones/logs/:logId/approve
 * Aprueba una corrida detenida en Compuerta de Aprobación Humana (`awaiting_approval`) y ejecuta las salidas retenidas.
 */
router.post('/logs/:logId/approve', async (req, res) => {
  try {
    const { logId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(String(logId || ''))) {
      return res.status(400).json({ error: 'ID de bitácora inválido.' });
    }

    const log = await AutomationLog.findById(logId);
    if (!log) {
      return res.status(404).json({ error: 'Registro de bitácora no encontrado.' });
    }
    if (String(log.user) !== String(req.user.id) && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'No tienes permiso para aprobar esta ejecución.' });
    }
    if (log.status !== 'awaiting_approval') {
      return res.status(400).json({
        error: `Esta ejecución no está pendiente de aprobación (estado actual: ${log.status}).`,
      });
    }

    const payload = log.pendingApprovalPayload || {};
    const automation = log.automation
      ? await Automation.findById(log.automation).lean()
      : null;

    const safeTargetCompanyId =
      log.companyId && log.companyId !== 'TENSHI_GLOBAL' && log.companyId !== 'SYSTEM_PRESET'
        ? log.companyId
        : automation?.companyId &&
            automation.companyId !== 'TENSHI_GLOBAL' &&
            automation.companyId !== 'SYSTEM_PRESET'
          ? automation.companyId
          : null;

    const outputSummary = await executeDownstreamOutputs({
      automation: automation || {
        _id: log.automation,
        name: 'Automatización Aprobada',
        user: log.user,
        companyId: safeTargetCompanyId,
        prompt: log.prompt || '',
        emails: req.user?.email ? [req.user.email] : [],
      },
      user: req.user,
      companyId: safeTargetCompanyId,
      outputsToExecute: Array.isArray(payload.outputsToExecute)
        ? payload.outputsToExecute
        : automation?.workflowNodes?.outputs || [],
      responseText: payload.responseText || log.result || '',
      generatedAppReports: Array.isArray(payload.generatedAppReports)
        ? payload.generatedAppReports
        : [],
      activeBranch: payload.activeBranch || 'yes',
      nodeConfigs:
        payload.nodeConfigs ||
        automation?.workflowNodes?.canvasLayout?.nodeConfigs ||
        {},
      capturedEvidences: Array.isArray(payload.capturedEvidences)
        ? payload.capturedEvidences
        : Array.isArray(log.evidenceFiles)
          ? log.evidenceFiles
          : [],
      generatedConvoId: payload.generatedConvoId || log.conversationId || null,
      hasCriticalSignal: payload.hasCriticalSignal !== false,
      logId: log._id,
    });

    const now = new Date();
    const approverIdentity = req.user?.email || String(req.user?.id || '');
    log.status = 'success';
    log.approvedAt = now;
    log.approvedBy = approverIdentity;
    log.pendingApprovalPayload = {
      ...payload,
      processed: true,
      approvedAt: now.toISOString(),
      approvedBy: approverIdentity,
      executedOutputs: outputSummary.executedOutputs || [],
      workspaceLinks: outputSummary.workspaceLinks || [],
    };
    log.executionTrace = {
      ...(log.executionTrace && typeof log.executionTrace === 'object' ? log.executionTrace : {}),
      humanApprovalDecision: 'approved',
      approvedAt: now.toISOString(),
      approvedBy: approverIdentity,
      executedOutputs: outputSummary.executedOutputs || [],
      workspaceLinks: outputSummary.workspaceLinks || [],
    };
    log.markModified('pendingApprovalPayload');
    log.markModified('executionTrace');
    await log.save();

    if (log.automation && !log.isTenshiFlow) {
      await Automation.updateOne(
        { _id: log.automation },
        {
          $set: {
            lastRunStatus: 'success',
            lastRunResult: `[Aprobado por ${approverIdentity}] ${String(log.result || '').substring(0, 430)}`,
          },
        },
      ).catch(() => {});
    }

    return res.json({
      success: true,
      log: normalizeAutomationLogRun(log.toObject(), new Set(), req.user?.role),
      outputSummary,
    });
  } catch (error) {
    console.error('[API Automatizaciones] Error aprobando log:', error);
    return res.status(500).json({ error: 'Error al aprobar y despachar las salidas de la bitácora.' });
  }
});

/**
 * POST /api/sgsst/automatizaciones/logs/:logId/reject
 * Rechaza una corrida detenida en Compuerta de Aprobación Humana (`awaiting_approval`) cancelando las salidas finales.
 */
router.post('/logs/:logId/reject', async (req, res) => {
  try {
    const { logId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(String(logId || ''))) {
      return res.status(400).json({ error: 'ID de bitácora inválido.' });
    }

    const log = await AutomationLog.findById(logId);
    if (!log) {
      return res.status(404).json({ error: 'Registro de bitácora no encontrado.' });
    }
    if (String(log.user) !== String(req.user.id) && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'No tienes permiso para rechazar esta ejecución.' });
    }
    if (log.status !== 'awaiting_approval') {
      return res.status(400).json({
        error: `Esta ejecución no está pendiente de aprobación (estado actual: ${log.status}).`,
      });
    }

    const now = new Date();
    const rejectorIdentity = req.user?.email || String(req.user?.id || '');
    const reason = String(req.body?.reason || '').trim() || 'Rechazado por aprobador';
    const payload = log.pendingApprovalPayload || {};

    log.status = 'rejected';
    log.rejectedAt = now;
    log.rejectedBy = rejectorIdentity;
    log.rejectedReason = reason;
    log.pendingApprovalPayload = {
      ...payload,
      processed: true,
      rejected: true,
      rejectedAt: now.toISOString(),
      rejectedBy: rejectorIdentity,
      rejectedReason: reason,
    };
    log.executionTrace = {
      ...(log.executionTrace && typeof log.executionTrace === 'object' ? log.executionTrace : {}),
      humanApprovalDecision: 'rejected',
      rejectedAt: now.toISOString(),
      rejectedBy: rejectorIdentity,
      rejectedReason: reason,
    };
    log.markModified('pendingApprovalPayload');
    log.markModified('executionTrace');
    await log.save();

    if (log.automation && !log.isTenshiFlow) {
      await Automation.updateOne(
        { _id: log.automation },
        {
          $set: {
            lastRunStatus: 'rejected',
            lastRunResult: `[Rechazado: ${reason}]`,
          },
        },
      ).catch(() => {});
    }

    return res.json({
      success: true,
      log: normalizeAutomationLogRun(log.toObject(), new Set(), req.user?.role),
    });
  } catch (error) {
    console.error('[API Automatizaciones] Error rechazando log:', error);
    return res.status(500).json({ error: 'Error al rechazar la ejecución en espera.' });
  }
});

/**
 * POST /api/sgsst/automatizaciones/test-sandbox
 * Ejecuta el flujo actual del Lienzo WAPPY en Modo Desarrollo (Sandbox / Dry-Run):
 * procesa los nodos, extrae datos quirúrgicos reales, ejecuta el/los Agentes IA y devuelve
 * la respuesta final y la traza nodo por nodo SIN enviar correos ni disparar salidas externas.
 */
router.post('/test-sandbox', async (req, res) => {
  const isStreaming = req.query.stream === '1' || req.body?.stream === true;
  let keepAliveTimer = null;
  try {
    const {
      automationId,
      companyId: explicitCompanyId,
      name,
      agentId,
      agentName,
      prompt,
      scheduleType,
      scheduleConfig,
      emails,
      workflowNodes,
      mockTriggerInput,
      executionPlan,
    } = req.body || {};

    const resolvedCompanyId = await getActiveCompanyId(
      req.user.id,
      explicitCompanyId || req.query?.companyId,
      req.user?.role,
      req.user,
      false,
    );

    // Si se pasa un automationId opcional, usarlo como base de respaldo para campos no enviados en el body
    let existingDoc = null;
    if (automationId && mongoose.Types.ObjectId.isValid(String(automationId))) {
      try {
        const candidateDoc = await Automation.findById(automationId).lean();
        if (candidateDoc && (!candidateDoc.isTenshiFlow || req.user?.role === 'ADMIN')) {
          existingDoc = candidateDoc;
        }
      } catch (_) {}
    }

    const existingSafeCompanyId =
      existingDoc?.companyId &&
      existingDoc.companyId !== 'TENSHI_GLOBAL' &&
      existingDoc.companyId !== 'SYSTEM_PRESET' &&
      mongoose.Types.ObjectId.isValid(String(existingDoc.companyId))
        ? String(existingDoc.companyId)
        : null;
    const effectiveSandboxCompanyId = resolvedCompanyId || existingSafeCompanyId || null;

    const writeStreamEvent = (evt) => {
      if (!isStreaming || res.writableEnded) return;
      try {
        res.write(`${JSON.stringify(evt)}\n`);
        if (typeof res.flush === 'function') {
          res.flush();
        }
      } catch (_) {}
    };

    if (isStreaming) {
      res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');
      if (typeof res.flushHeaders === 'function') {
        res.flushHeaders();
      }
      keepAliveTimer = setInterval(() => {
        writeStreamEvent({ type: 'ping', ts: Date.now() });
      }, 15000);
      res.on('close', () => {
        if (keepAliveTimer) {
          clearInterval(keepAliveTimer);
          keepAliveTimer = null;
        }
      });
    }

    const simulationResult = await runWorkflowSandboxSimulation(
      {
        user: req.user,
        companyId: effectiveSandboxCompanyId,
        name: name ?? existingDoc?.name ?? 'Prueba en Escenario de Desarrollo',
        agentId: agentId ?? existingDoc?.agentId ?? 'tenshi_avatar_3d',
        agentName: agentName ?? existingDoc?.agentName ?? 'Tenshi (Avatar 3D)',
        prompt: prompt ?? existingDoc?.prompt ?? '',
        scheduleType: scheduleType ?? existingDoc?.scheduleType ?? 'daily',
        scheduleConfig: scheduleConfig ?? existingDoc?.scheduleConfig ?? { hour: 8, minute: 0 },
        emails: Array.isArray(emails)
          ? emails
          : Array.isArray(existingDoc?.emails) && existingDoc.emails.length > 0
            ? existingDoc.emails
            : req.user?.email
              ? [req.user.email]
              : [],
        workflowNodes: workflowNodes ?? existingDoc?.workflowNodes ?? {},
        mockTriggerInput: typeof mockTriggerInput === 'string' ? mockTriggerInput : '',
        executionPlan: Array.isArray(executionPlan) ? executionPlan : [],
      },
      isStreaming ? writeStreamEvent : null,
    );

    if (isStreaming) {
      if (keepAliveTimer) {
        clearInterval(keepAliveTimer);
        keepAliveTimer = null;
      }
      writeStreamEvent({ type: 'complete', result: simulationResult });
      return res.end();
    }

    return res.json(simulationResult);
  } catch (error) {
    console.error('[API Automatizaciones] Error en test-sandbox:', error);
    if (isStreaming && !res.writableEnded) {
      if (keepAliveTimer) {
        clearInterval(keepAliveTimer);
        keepAliveTimer = null;
      }
      try {
        res.write(
          `${JSON.stringify({
            type: 'error',
            error: error?.message || 'Error al ejecutar la simulación en el Escenario de Desarrollo.',
          })}\n`,
        );
      } catch (_) {}
      return res.end();
    }
    return res.status(500).json({
      error: error?.message || 'Error al ejecutar la simulación en el Escenario de Desarrollo.',
    });
  } finally {
    if (keepAliveTimer) {
      clearInterval(keepAliveTimer);
      keepAliveTimer = null;
    }
  }
});

/**
 * GET /api/sgsst/automatizaciones/presets
 * Lista todas las Tareas Preestablecidas del Sistema (plantillas de flujo disponibles para todos los usuarios).
 */
router.get('/presets', async (req, res) => {
  try {
    await ensureDefaultSystemPresets();
    const presets = await Automation.find({
      isSystemPreset: true,
      isTenshiFlow: { $ne: true },
      companyId: { $ne: 'TENSHI_GLOBAL' },
    })
      .sort({ createdAt: 1 })
      .lean();
    res.json(presets);
  } catch (error) {
    console.error('[API Automatizaciones Presets] Error listing presets:', error);
    res.status(500).json({ error: 'Error al obtener las tareas preestablecidas del sistema.' });
  }
});

/**
 * POST /api/sgsst/automatizaciones/presets
 * Exclusivo ADMIN: Crea una nueva Tarea Preestablecida en el sistema para TODOS los usuarios.
 */
router.post('/presets', async (req, res) => {
  try {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Solo los administradores pueden crear tareas preestablecidas globales.' });
    }
    const {
      name,
      agentId,
      agentName,
      prompt,
      scheduleType,
      scheduleConfig,
      presetCategory,
      presetDescription,
      workflowNodes,
    } = req.body;

    if (!name || !agentId || !prompt) {
      return res.status(400).json({ error: 'Faltan campos obligatorios: name, agentId y prompt.' });
    }

    const preset = await Automation.create({
      user: req.user.id,
      companyId: 'SYSTEM_PRESET',
      isSystemPreset: true,
      isTenshiFlow: false,
      presetKey: `custom_preset_${Date.now()}`,
      presetCategory: presetCategory || 'general',
      presetDescription: presetDescription || '',
      name: name.trim(),
      agentId,
      agentName: agentName || 'Consultor SG-SST',
      prompt: prompt.trim(),
      scheduleType: scheduleType || 'daily',
      scheduleConfig: scheduleConfig || { hour: 8, minute: 0 },
      workflowNodes: workflowNodes || {
        trigger: 'schedule_cron',
        inputs: [],
        hitos: [],
        outputs: ['email_report'],
      },
      emails: [],
      status: 'inactive',
      nextRunAt: null,
    });

    res.status(201).json(preset);
  } catch (error) {
    console.error('[API Automatizaciones Presets] Error creating preset:', error);
    res.status(500).json({ error: 'Error al crear la tarea preestablecida.' });
  }
});

/**
 * PUT /api/sgsst/automatizaciones/presets/:id
 * Exclusivo ADMIN: Actualiza una Tarea Preestablecida global del sistema.
 */
router.put('/presets/:id', async (req, res) => {
  try {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Solo los administradores pueden editar tareas preestablecidas globales.' });
    }
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(String(id || ''))) {
      return res.status(400).json({ error: 'ID de plantilla inválido.' });
    }
    const {
      name,
      agentId,
      agentName,
      prompt,
      scheduleType,
      scheduleConfig,
      presetCategory,
      presetDescription,
      workflowNodes,
    } = req.body;

    const preset = await Automation.findOne({
      _id: id,
      isSystemPreset: true,
      isTenshiFlow: { $ne: true },
    });
    if (!preset) {
      return res.status(404).json({ error: 'No se encontró la tarea preestablecida.' });
    }

    if (name !== undefined) preset.name = name.trim();
    if (agentId !== undefined) preset.agentId = agentId;
    if (agentName !== undefined) preset.agentName = agentName;
    if (prompt !== undefined) preset.prompt = prompt.trim();
    if (scheduleType !== undefined) preset.scheduleType = scheduleType;
    if (scheduleConfig !== undefined) preset.scheduleConfig = scheduleConfig;
    if (presetCategory !== undefined) preset.presetCategory = presetCategory;
    if (presetDescription !== undefined) preset.presetDescription = presetDescription;
    if (workflowNodes !== undefined) preset.workflowNodes = workflowNodes;

    await preset.save();
    res.json(preset);
  } catch (error) {
    console.error('[API Automatizaciones Presets] Error updating preset:', error);
    res.status(500).json({ error: 'Error al actualizar la tarea preestablecida.' });
  }
});

/**
 * DELETE /api/sgsst/automatizaciones/presets/:id
 * Exclusivo ADMIN: Elimina una Tarea Preestablecida global del sistema.
 */
router.delete('/presets/:id', async (req, res) => {
  try {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Solo los administradores pueden eliminar tareas preestablecidas globales.' });
    }
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(String(id || ''))) {
      return res.status(400).json({ error: 'ID de plantilla inválido.' });
    }
    const result = await Automation.deleteOne({
      _id: id,
      isSystemPreset: true,
      isTenshiFlow: { $ne: true },
    });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'No se encontró la tarea preestablecida para eliminar.' });
    }
    res.json({ success: true, message: 'Tarea preestablecida eliminada del catálogo global.' });
  } catch (error) {
    console.error('[API Automatizaciones Presets] Error deleting preset:', error);
    res.status(500).json({ error: 'Error al eliminar la tarea preestablecida.' });
  }
});

/**
 * POST /api/sgsst/automatizaciones/presets/:id/install
 * Instala/Clona una Tarea Preestablecida del catálogo en la empresa activa del usuario.
 */
router.post('/presets/:id/install', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(String(id || ''))) {
      return res.status(400).json({ error: 'ID de plantilla inválido.' });
    }
    const { activateImmediately = false, emails, companyId: explicitCompanyId } = req.body || {};

    const companyId = await getActiveCompanyId(
      req.user.id,
      explicitCompanyId || req.query?.companyId,
      req.user?.role,
      req.user,
    );
    if (!companyId) {
      return res.status(400).json({ error: 'No se encontró una empresa asociada para su usuario. Registre su empresa primero.' });
    }

    const preset = await Automation.findOne({
      _id: id,
      isSystemPreset: true,
      isTenshiFlow: { $ne: true },
    }).lean();
    if (!preset) {
      return res.status(404).json({ error: 'No se encontró la plantilla de tarea preestablecida.' });
    }

    const { limit: effectiveLimit } = await getEffectiveAutomationLimit(req.user.id, req.user.role);
    const activeCount = await Automation.countDocuments({
      user: req.user.id,
      isSystemPreset: { $ne: true },
      isTenshiFlow: { $ne: true },
      companyId: { $nin: ['SYSTEM_PRESET', 'TENSHI_GLOBAL'] },
      status: 'active',
    });

    const canActivate = activateImmediately && effectiveLimit > 0 && activeCount < effectiveLimit;
    const finalStatus = canActivate ? 'active' : 'inactive';
    const nextRunAt =
      canActivate && hasCronTrigger(preset)
        ? calculateNextRun(preset.scheduleType || 'daily', preset.scheduleConfig || {})
        : null;

    const defaultEmails =
      Array.isArray(emails) && emails.length > 0
        ? emails
        : req.user?.email
          ? [req.user.email]
          : [];

    const created = await Automation.create({
      user: req.user.id,
      companyId,
      isSystemPreset: false,
      isTenshiFlow: false,
      presetCategory: preset.presetCategory || 'general',
      presetDescription: preset.presetDescription || '',
      name: preset.name,
      agentId: preset.agentId,
      agentName: preset.agentName,
      prompt: preset.prompt,
      scheduleType: preset.scheduleType || 'daily',
      scheduleConfig: preset.scheduleConfig || { hour: 8, minute: 0 },
      workflowNodes: preset.workflowNodes || {
        trigger: 'schedule_cron',
        inputs: [],
        hitos: [],
        outputs: ['email_report'],
      },
      emails: defaultEmails,
      status: finalStatus,
      nextRunAt,
    });

    res.status(201).json({
      automation: created,
      installedAsActive: canActivate,
      message: canActivate
        ? `Flujo "${created.name}" instalado y activado en tu empresa.`
        : `Flujo "${created.name}" agregado a Mis Tareas (en modo Inactivo para que ajustes horario/correos cuando desees).`,
    });
  } catch (error) {
    console.error('[API Automatizaciones Presets] Error installing preset:', error);
    res.status(500).json({ error: 'Error al instalar la tarea preestablecida en tu empresa.' });
  }
});

// =========================================================================
// RUTAS EXCLUSIVAS DE ADMINISTRADOR: FLUJOS INTERNOS GLOBALES TENSHI
// =========================================================================

/**
 * GET /api/sgsst/automatizaciones/tenshi-flows
 * Exclusivo ADMIN: Lista todos los Flujos Tenshi globales internos.
 */
router.get('/tenshi-flows', async (req, res) => {
  try {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({
        error: 'Acceso exclusivo para administradores: gestión de Flujos Tenshi.',
      });
    }
    const flows = await Automation.find({
      isTenshiFlow: true,
      companyId: 'TENSHI_GLOBAL',
    })
      .sort({ updatedAt: -1, createdAt: -1 })
      .lean();
    return res.json(flows);
  } catch (error) {
    console.error('[API Automatizaciones TenshiFlows] Error listando:', error);
    return res.status(500).json({ error: 'Error al listar los Flujos Tenshi globales.' });
  }
});

/**
 * POST /api/sgsst/automatizaciones/tenshi-flows
 * Exclusivo ADMIN: Crea un Flujo Tenshi global (sin consumo de límite de plan ni vínculo a empresa).
 */
router.post('/tenshi-flows', async (req, res) => {
  try {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({
        error: 'Acceso exclusivo para administradores: creación de Flujos Tenshi.',
      });
    }
    const {
      name,
      agentId,
      agentName,
      prompt,
      scheduleType,
      scheduleConfig,
      presetCategory,
      presetDescription,
      workflowNodes,
      status,
      emails,
    } = req.body || {};

    if (!name || !String(name).trim() || !prompt || !String(prompt).trim()) {
      return res.status(400).json({
        error: 'Faltan campos obligatorios: name y prompt son necesarios para crear el Flujo Tenshi.',
      });
    }

    const baseWorkflowNodes =
      workflowNodes && typeof workflowNodes === 'object'
        ? {
            ...workflowNodes,
            trigger: workflowNodes.trigger || 'trigger_tenshi',
            triggers:
              Array.isArray(workflowNodes.triggers) && workflowNodes.triggers.length > 0
                ? workflowNodes.triggers
                : [workflowNodes.trigger || 'trigger_tenshi'],
          }
        : {
            trigger: 'trigger_tenshi',
            triggers: ['trigger_tenshi'],
            extractors: [],
            inputs: [],
            hitos: [],
            outputs: [],
          };

    const flow = await Automation.create({
      user: req.user.id,
      companyId: 'TENSHI_GLOBAL',
      isTenshiFlow: true,
      isSystemPreset: false,
      adminOnly: true,
      presetKey: `tenshi_flow_${Date.now()}`,
      presetCategory: presetCategory || 'tenshi_global',
      presetDescription: presetDescription || '',
      name: String(name).trim(),
      agentId: (agentId && String(agentId).trim()) || 'tenshi_avatar_orchestrator',
      agentName: (agentName && String(agentName).trim()) || '🐱 Tenshi Avatar (Voz y Orquestador 3D)',
      prompt: String(prompt).trim(),
      scheduleType: scheduleType || 'daily',
      scheduleConfig: scheduleConfig || { hour: 8, minute: 0 },
      workflowNodes: baseWorkflowNodes,
      emails: Array.isArray(emails) ? emails : [],
      status: status === 'inactive' ? 'inactive' : 'active',
      nextRunAt: null,
    });

    return res.status(201).json(flow);
  } catch (error) {
    console.error('[API Automatizaciones TenshiFlows] Error creando:', error);
    return res.status(500).json({ error: 'Error al crear el Flujo Tenshi global.' });
  }
});

/**
 * PUT /api/sgsst/automatizaciones/tenshi-flows/:id
 * Exclusivo ADMIN: Actualiza un Flujo Tenshi global interno.
 */
router.put('/tenshi-flows/:id', async (req, res) => {
  try {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({
        error: 'Acceso exclusivo para administradores: edición de Flujos Tenshi.',
      });
    }
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(String(id || ''))) {
      return res.status(400).json({ error: 'ID de Flujo Tenshi inválido.' });
    }

    const flow = await Automation.findOne({
      _id: id,
      isTenshiFlow: true,
      companyId: 'TENSHI_GLOBAL',
    });
    if (!flow) {
      return res.status(404).json({ error: 'Flujo Tenshi no encontrado.' });
    }

    const {
      name,
      agentId,
      agentName,
      prompt,
      scheduleType,
      scheduleConfig,
      presetCategory,
      presetDescription,
      workflowNodes,
      status,
      emails,
    } = req.body || {};

    if (name !== undefined && String(name).trim()) flow.name = String(name).trim();
    if (agentId !== undefined && String(agentId).trim()) flow.agentId = String(agentId).trim();
    if (agentName !== undefined) flow.agentName = String(agentName || '').trim();
    if (prompt !== undefined) flow.prompt = String(prompt || '').trim();
    if (scheduleType !== undefined) flow.scheduleType = scheduleType;
    if (scheduleConfig !== undefined) flow.scheduleConfig = scheduleConfig;
    if (presetCategory !== undefined) flow.presetCategory = presetCategory;
    if (presetDescription !== undefined) flow.presetDescription = presetDescription;
    if (emails !== undefined && Array.isArray(emails)) flow.emails = emails;
    if (workflowNodes !== undefined && workflowNodes && typeof workflowNodes === 'object') {
      flow.workflowNodes = {
        ...workflowNodes,
        trigger: workflowNodes.trigger || 'trigger_tenshi',
        triggers:
          Array.isArray(workflowNodes.triggers) && workflowNodes.triggers.length > 0
            ? workflowNodes.triggers
            : [workflowNodes.trigger || 'trigger_tenshi'],
      };
    }
    if (status === 'active' || status === 'inactive') {
      flow.status = status;
    }

    flow.isTenshiFlow = true;
    flow.isSystemPreset = false;
    flow.companyId = 'TENSHI_GLOBAL';
    flow.nextRunAt = null;

    await flow.save();
    return res.json(flow);
  } catch (error) {
    console.error('[API Automatizaciones TenshiFlows] Error actualizando:', error);
    return res.status(500).json({ error: 'Error al actualizar el Flujo Tenshi global.' });
  }
});

/**
 * PATCH /api/sgsst/automatizaciones/tenshi-flows/:id/toggle
 * Exclusivo ADMIN: Alterna o fija el estado (active / inactive) de un Flujo Tenshi global.
 */
router.patch('/tenshi-flows/:id/toggle', async (req, res) => {
  try {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({
        error: 'Acceso exclusivo para administradores: activación de Flujos Tenshi.',
      });
    }
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(String(id || ''))) {
      return res.status(400).json({ error: 'ID de Flujo Tenshi inválido.' });
    }

    const flow = await Automation.findOne({
      _id: id,
      isTenshiFlow: true,
      companyId: 'TENSHI_GLOBAL',
    });
    if (!flow) {
      return res.status(404).json({ error: 'Flujo Tenshi no encontrado.' });
    }

    const requestedStatus = req.body?.status;
    if (requestedStatus === 'active' || requestedStatus === 'inactive') {
      flow.status = requestedStatus;
    } else {
      flow.status = flow.status === 'active' ? 'inactive' : 'active';
    }
    flow.nextRunAt = null;

    await flow.save();
    return res.json(flow);
  } catch (error) {
    console.error('[API Automatizaciones TenshiFlows] Error en toggle:', error);
    return res.status(500).json({ error: 'Error al cambiar el estado del Flujo Tenshi.' });
  }
});

/**
 * DELETE /api/sgsst/automatizaciones/tenshi-flows/:id
 * Exclusivo ADMIN: Elimina un Flujo Tenshi global (conserva historial por defecto o limpia logs si ?deleteLogs=true).
 */
router.delete('/tenshi-flows/:id', async (req, res) => {
  try {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({
        error: 'Acceso exclusivo para administradores: eliminación de Flujos Tenshi.',
      });
    }
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(String(id || ''))) {
      return res.status(400).json({ error: 'ID de Flujo Tenshi inválido.' });
    }

    const result = await Automation.deleteOne({
      _id: id,
      isTenshiFlow: true,
      companyId: 'TENSHI_GLOBAL',
    });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Flujo Tenshi no encontrado para eliminar.' });
    }

    const shouldDeleteLogs =
      String(req.query?.deleteLogs || req.body?.deleteLogs || '').toLowerCase() === 'true';
    if (shouldDeleteLogs) {
      await AutomationLog.deleteMany({ automation: id, isTenshiFlow: true });
    }

    return res.json({
      success: true,
      deletedLogs: shouldDeleteLogs,
      message: 'Flujo Tenshi eliminado correctamente.',
    });
  } catch (error) {
    console.error('[API Automatizaciones TenshiFlows] Error eliminando:', error);
    return res.status(500).json({ error: 'Error al eliminar el Flujo Tenshi global.' });
  }
});

/**
 * GET /api/sgsst/automatizaciones/tenshi-flows/:id/runs
 * Exclusivo ADMIN: Historial de ejecuciones de un Flujo Tenshi global (opcional ?companyId= para filtrar por empresa).
 */
router.get('/tenshi-flows/:id/runs', async (req, res) => {
  try {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({
        error: 'Acceso exclusivo para administradores: historial de Flujos Tenshi.',
      });
    }
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(String(id || ''))) {
      return res.status(400).json({ error: 'ID de Flujo Tenshi inválido.' });
    }

    const flow = await Automation.findOne({
      _id: id,
      isTenshiFlow: true,
      companyId: 'TENSHI_GLOBAL',
    }).lean();
    if (!flow) {
      return res.status(404).json({ error: 'Flujo Tenshi no encontrado.' });
    }

    const rawCompanyFilter = String(req.query?.companyId || '').trim();
    const companyFilter =
      rawCompanyFilter &&
      rawCompanyFilter !== 'TENSHI_GLOBAL' &&
      rawCompanyFilter !== 'SYSTEM_PRESET' &&
      mongoose.Types.ObjectId.isValid(rawCompanyFilter)
        ? rawCompanyFilter
        : null;

    await reconcileOrphanedRunningRuns({
      automationId: flow._id,
      ...(companyFilter ? { companyId: companyFilter } : {}),
    });

    const parsedLimit = Number.parseInt(String(req.query?.limit || '50'), 10);
    const limit = Number.isFinite(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 100) : 50;

    const logFilter = {
      automation: flow._id,
      ...(companyFilter ? { companyId: companyFilter } : {}),
    };

    const { activeLogIds } = getActiveRunningSnapshot();
    const activeLogIdsSet = new Set(activeLogIds);

    const rawLogs = await AutomationLog.find(logFilter)
      .sort({ runAt: -1, createdAt: -1 })
      .limit(limit)
      .lean();

    return res.json({
      flow,
      automation: flow,
      runs: rawLogs.map((l) => normalizeAutomationLogRun(l, activeLogIdsSet, req.user?.role)),
    });
  } catch (error) {
    console.error('[API Automatizaciones TenshiFlows] Error listando corridas:', error);
    return res.status(500).json({ error: 'Error al consultar las corridas del Flujo Tenshi.' });
  }
});

/**
 * GET /api/sgsst/automatizaciones
 * Lista todas las automatizaciones configuradas para la empresa activa del usuario.
 */
router.get('/', async (req, res) => {
  try {
    const companyId = await getActiveCompanyId(
      req.user.id,
      req.query?.companyId,
      req.user?.role,
      req.user,
    );
    if (!companyId) {
      return res.json([]);
    }

    if (req.user?.role === 'ADMIN') {
      await ensureSimpleAdminFlow(req.user, companyId);
      const hasLegacyAdminSamples = await Automation.exists({
        companyId,
        isSystemPreset: { $ne: true },
        isTenshiFlow: { $ne: true },
        name: /^\[Ejemplo Admin\]/i,
        presetKey: { $nin: ADMIN_SAMPLE_PRESET_KEYS },
      });
      if (hasLegacyAdminSamples) {
        await ensureAdminSampleAutomations(req.user, companyId, false);
      }
    }

    // Auto-recuperar tareas bloqueadas o huérfanas sin heartbeat activo
    await reconcileOrphanedRunningRuns({ companyId });

    const findQuery = {
      companyId,
      isSystemPreset: { $ne: true },
      isTenshiFlow: { $ne: true },
      ...(req.user?.role !== 'ADMIN' ? { adminOnly: { $ne: true } } : {}),
    };

    const { activeAutomationIds } = getActiveRunningSnapshot();
    const activeSet = new Set(activeAutomationIds);

    const rawAutomations = await Automation.find(findQuery)
      .sort({ adminOnly: -1, createdAt: -1 })
      .lean();
    const automations = rawAutomations.map((a) => ({
      ...a,
      isActivelyRunningInProcess: a.lastRunStatus === 'running' && activeSet.has(String(a._id)),
    }));
    res.json(automations);
  } catch (error) {
    console.error('[API Automatizaciones] Error listing:', error);
    res.status(500).json({ error: 'Error al obtener la lista de automatizaciones.' });
  }
});

/**
 * POST /api/sgsst/automatizaciones
 * Crea una nueva automatización y calcula su primera fecha de ejecución.
 */
router.post('/', async (req, res) => {
  try {
    const {
      name,
      agentId,
      agentName,
      prompt,
      scheduleType,
      scheduleConfig,
      emails,
      presetCategory,
      presetDescription,
      workflowNodes,
      saveAsSystemPreset,
      companyId: explicitCompanyId,
    } = req.body;

    const safeAgentId = (agentId && String(agentId).trim()) || 'tenshi_avatar_3d';
    const safeAgentName = (agentName && String(agentName).trim()) || 'Tenshi (Avatar 3D)';

    if (!name || !prompt) {
      return res.status(400).json({ error: 'Faltan campos obligatorios: name y prompt son necesarios.' });
    }

    const { limit: effectiveLimit, plan: userPlanName } = await getEffectiveAutomationLimit(req.user.id, req.user.role);
    if (effectiveLimit <= 0) {
      return res.status(403).json({
        error: 'Las automatizaciones de tareas periódicas son exclusivas del Plan Wappy Pro. Actualiza tu suscripción para habilitar tareas autónomas.'
      });
    }

    const activeCount = await Automation.countDocuments({
      user: req.user.id,
      isSystemPreset: { $ne: true },
      isTenshiFlow: { $ne: true },
      companyId: { $nin: ['SYSTEM_PRESET', 'TENSHI_GLOBAL'] },
      status: 'active',
    });
    if (activeCount >= effectiveLimit) {
      return res.status(400).json({
        error: `Límite de ${effectiveLimit} automatización(es) activa(s) alcanzado para tu plan actual (${userPlanName === 'pro' ? 'Wappy Pro' : userPlanName}). Para activar más tareas, puedes adquirir un paquete de 5 automatizaciones adicionales por solo $25.000 COP/mes.`
      });
    }

    const companyId = await getActiveCompanyId(
      req.user.id,
      explicitCompanyId || req.query?.companyId,
      req.user?.role,
      req.user,
    );
    if (!companyId) {
      return res.status(400).json({ error: 'No se encontró una empresa asociada para su usuario. Registre su empresa primero.' });
    }

    const resolvedWorkflowNodes = workflowNodes || {
      trigger: 'schedule_cron',
      inputs: [],
      hitos: [],
      outputs: ['email_report'],
    };
    const nextRunAt = hasCronTrigger({ workflowNodes: resolvedWorkflowNodes })
      ? calculateNextRun(scheduleType || 'daily', scheduleConfig || {})
      : null;

    const automation = await Automation.create({
      user: req.user.id,
      companyId,
      isSystemPreset: false,
      isTenshiFlow: false,
      presetCategory: presetCategory || 'general',
      presetDescription: presetDescription || '',
      name,
      agentId: safeAgentId,
      agentName: safeAgentName,
      prompt,
      scheduleType: scheduleType || 'daily',
      scheduleConfig: scheduleConfig || { hour: 8, minute: 0 },
      workflowNodes: resolvedWorkflowNodes,
      emails: emails || [],
      status: 'active',
      nextRunAt
    });

    // Si es ADMIN y marcó "Publicar también como Tarea Preestablecida para todos los usuarios"
    if (req.user?.role === 'ADMIN' && saveAsSystemPreset) {
      await Automation.create({
        user: req.user.id,
        companyId: 'SYSTEM_PRESET',
        isSystemPreset: true,
        isTenshiFlow: false,
        presetKey: `custom_preset_${Date.now()}`,
        presetCategory: presetCategory || 'general',
        presetDescription: presetDescription || '',
        name: name.trim(),
        agentId: safeAgentId,
        agentName: safeAgentName,
        prompt: prompt.trim(),
        scheduleType: scheduleType || 'daily',
        scheduleConfig: scheduleConfig || { hour: 8, minute: 0 },
        workflowNodes: workflowNodes || {
          trigger: 'schedule_cron',
          inputs: [],
          hitos: [],
          outputs: ['email_report'],
        },
        emails: [],
        status: 'inactive',
        nextRunAt: null,
      });
    }

    res.status(201).json(automation);
  } catch (error) {
    console.error('[API Automatizaciones] Error creating:', error);
    res.status(500).json({ error: 'Error al crear la automatización.' });
  }
});

/**
 * PUT /api/sgsst/automatizaciones/:id
 * Actualiza una automatización existente.
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(String(id || ''))) {
      return res.status(400).json({ error: 'ID de automatización inválido.' });
    }
    const {
      name,
      agentId,
      agentName,
      prompt,
      scheduleType,
      scheduleConfig,
      emails,
      status,
      presetCategory,
      presetDescription,
      workflowNodes,
      saveAsSystemPreset,
    } = req.body;

    const companyId = await getActiveCompanyId(
      req.user.id,
      req.body?.companyId || req.query?.companyId,
      req.user?.role,
      req.user,
    );
    let automation = companyId
      ? await Automation.findOne({
          _id: id,
          $and: [
            { companyId },
            { companyId: { $nin: ['SYSTEM_PRESET', 'TENSHI_GLOBAL'] } },
          ],
          isSystemPreset: { $ne: true },
          isTenshiFlow: { $ne: true },
        })
      : null;
    if (!automation) {
      automation = await Automation.findOne({
        _id: id,
        ...(req.user?.role === 'ADMIN' ? {} : { user: req.user.id }),
        isSystemPreset: { $ne: true },
        isTenshiFlow: { $ne: true },
        companyId: { $nin: ['SYSTEM_PRESET', 'TENSHI_GLOBAL'] },
      });
    }

    if (!automation) {
      return res.status(404).json({ error: 'No se encontró la automatización.' });
    }

    // Actualizar campos si vienen en el body
    if (name !== undefined && String(name).trim()) automation.name = String(name).trim();
    if (agentId !== undefined && String(agentId).trim()) {
      automation.agentId = String(agentId).trim();
    } else if (!automation.agentId) {
      automation.agentId = 'tenshi_avatar_3d';
    }
    if (agentName !== undefined && String(agentName).trim()) {
      automation.agentName = String(agentName).trim();
    } else if (!automation.agentName) {
      automation.agentName = 'Tenshi (Avatar 3D)';
    }
    if (prompt !== undefined) automation.prompt = prompt;
    if (scheduleType !== undefined) automation.scheduleType = scheduleType;
    if (scheduleConfig !== undefined) automation.scheduleConfig = scheduleConfig;
    if (emails !== undefined) automation.emails = emails;
    if (presetCategory !== undefined) automation.presetCategory = presetCategory;
    if (presetDescription !== undefined) automation.presetDescription = presetDescription;
    if (workflowNodes !== undefined) automation.workflowNodes = workflowNodes;
    
    // Si cambia el estado, o cambia la configuración del schedule, recalculamos nextRunAt
    if (status !== undefined) {
      if (status === 'active' && automation.status !== 'active') {
        const { limit: effectiveLimit, plan: userPlanName } = await getEffectiveAutomationLimit(req.user.id, req.user.role);
        const activeCount = await Automation.countDocuments({
          user: req.user.id,
          isSystemPreset: { $ne: true },
          isTenshiFlow: { $ne: true },
          companyId: { $nin: ['SYSTEM_PRESET', 'TENSHI_GLOBAL'] },
          status: 'active',
        });
        if (activeCount >= effectiveLimit) {
          return res.status(400).json({
            error: `No se puede activar: Límite de ${effectiveLimit} automatización(es) activa(s) alcanzado para tu plan actual (${userPlanName === 'pro' ? 'Wappy Pro' : userPlanName}). Adquiere 5 adicionales por $25.000 COP/mes.`
          });
        }
      }
      automation.status = status;
    }

    if (automation.status === 'active' && hasCronTrigger(automation)) {
      if (
        scheduleType !== undefined ||
        scheduleConfig !== undefined ||
        workflowNodes !== undefined ||
        status === 'active' ||
        !automation.nextRunAt
      ) {
        automation.nextRunAt = calculateNextRun(automation.scheduleType, automation.scheduleConfig);
      }
    } else {
      automation.nextRunAt = null;
    }

    await automation.save();

    if (req.user?.role === 'ADMIN' && saveAsSystemPreset) {
      await Automation.create({
        user: req.user.id,
        companyId: 'SYSTEM_PRESET',
        isSystemPreset: true,
        isTenshiFlow: false,
        presetKey: `custom_preset_${Date.now()}`,
        presetCategory: automation.presetCategory || 'general',
        presetDescription: automation.presetDescription || '',
        name: automation.name,
        agentId: automation.agentId,
        agentName: automation.agentName,
        prompt: automation.prompt,
        scheduleType: automation.scheduleType,
        scheduleConfig: automation.scheduleConfig,
        workflowNodes: automation.workflowNodes,
        emails: [],
        status: 'inactive',
        nextRunAt: null,
      });
    }

    res.json(automation);
  } catch (error) {
    console.error('[API Automatizaciones] Error updating:', error);
    res.status(500).json({ error: 'Error al actualizar la automatización.' });
  }
});

/**
 * DELETE /api/sgsst/automatizaciones/:id
 * Elimina una automatización.
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(String(id || ''))) {
      return res.status(400).json({ error: 'ID de automatización inválido.' });
    }
    const companyId = await getActiveCompanyId(
      req.user.id,
      req.query?.companyId || req.body?.companyId,
      req.user?.role,
      req.user,
    );

    let result = await Automation.deleteOne({
      _id: id,
      companyId,
      isSystemPreset: { $ne: true },
      isTenshiFlow: { $ne: true },
    });
    if (result.deletedCount === 0) {
      result = await Automation.deleteOne({
        _id: id,
        ...(req.user?.role === 'ADMIN' ? {} : { user: req.user.id }),
        isSystemPreset: { $ne: true },
        isTenshiFlow: { $ne: true },
        companyId: { $nin: ['SYSTEM_PRESET', 'TENSHI_GLOBAL'] },
      });
    }
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'No se encontró la automatización para eliminar.' });
    }

    // Opcionalmente eliminar los logs asociados
    await AutomationLog.deleteMany({ automation: id });

    res.json({ success: true, message: 'Automatización eliminada correctamente.' });
  } catch (error) {
    console.error('[API Automatizaciones] Error deleting:', error);
    res.status(500).json({ error: 'Error al eliminar la automatización.' });
  }
});

/**
 * POST /api/sgsst/automatizaciones/:id/run
 * Ejecuta manualmente de inmediato una automatización (test run).
 */
router.post('/:id/run', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(String(id || ''))) {
      return res.status(400).json({ error: 'ID de automatización inválido.' });
    }
    const companyId = await getActiveCompanyId(
      req.user.id,
      req.body?.companyId || req.query?.companyId,
      req.user?.role,
      req.user,
    );

    let automation = await Automation.findOne({
      _id: id,
      companyId,
      isSystemPreset: { $ne: true },
      isTenshiFlow: { $ne: true },
    });
    if (!automation) {
      automation = await Automation.findOne({
        _id: id,
        ...(req.user?.role === 'ADMIN' ? {} : { user: req.user.id }),
        isSystemPreset: { $ne: true },
        isTenshiFlow: { $ne: true },
        companyId: { $nin: ['SYSTEM_PRESET', 'TENSHI_GLOBAL'] },
      });
    }
    if (!automation) {
      return res.status(404).json({ error: 'Automatización no encontrada.' });
    }

    await reconcileOrphanedRunningRuns({
      automationId: automation._id,
      companyId: automation.companyId || companyId || null,
    });
    automation = await Automation.findById(automation._id);
    if (!automation) {
      return res.status(404).json({ error: 'Automatización no encontrada.' });
    }

    const { activeAutomationIds } = getActiveRunningSnapshot();
    const isActivelyRunningInProcess = activeAutomationIds.includes(String(automation._id));
    if (automation.lastRunStatus === 'running') {
      const fifteenSecAgo = new Date(Date.now() - 15 * 1000);
      if (isActivelyRunningInProcess || (automation.updatedAt && automation.updatedAt > fifteenSecAgo)) {
        return res.status(400).json({ error: 'Esta automatización ya se encuentra ejecutándose en segundo plano.' });
      }
      console.log(`[API Run Manual] Reemplazando estado 'running' huérfano para "${automation.name}".`);
    }

    const initialLog = await AutomationLog.create({
      automation: automation._id,
      user: automation.user || req.user.id,
      companyId: automation.companyId || companyId,
      agentId: automation.agentId,
      agentName: automation.agentName,
      prompt: automation.prompt,
      status: 'running',
      triggerSource: 'manual',
      heartbeatAt: new Date(),
      durationMs: 0,
      currentStageLabel: 'Iniciando disparador del flujo...',
      activeStepNodeKey: 'trigger_root',
      liveSteps: [
        {
          stepOrder: 1,
          nodeKey: 'trigger_root',
          nodeType: 'trigger',
          title: 'Disparador Manual / Inmediato',
          status: 'running',
          durationMs: 0,
          details: 'Iniciando ejecución manual solicitada desde /tareas.',
          timestamp: new Date().toISOString(),
        },
      ],
      completedNodeKeys: [],
      blockedNodeKeys: [],
      skippedNodeKeys: [],
    });

    // Marcar como corriendo y vincular al log activo
    await Automation.updateOne(
      { _id: automation._id },
      { $set: { lastRunStatus: 'running', lastRunAt: new Date(), lastRunLogId: initialLog._id } },
    );

    // Ejecutar en background de forma inmediata hidratando el log pre-creado
    runAutomation(automation, {
      isManual: true,
      triggerSource: 'manual',
      existingLogId: initialLog._id,
    }).catch((err) => {
      console.error('[API Run Manual] Error en corrida background:', err);
    });

    res.json({
      success: true,
      logId: initialLog._id,
      automationId: automation._id,
      message: 'Ejecución iniciada correctamente en segundo plano.',
    });
  } catch (error) {
    console.error('[API Automatizaciones] Error triggering run:', error);
    res.status(500).json({ error: 'Error al iniciar la ejecución manual.' });
  }
});

/**
 * POST /api/sgsst/automatizaciones/:id/stop
 * Detiene inmediatamente una automatización en ejecución.
 */
router.post('/:id/stop', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(String(id || ''))) {
      return res.status(400).json({ error: 'ID de automatización inválido.' });
    }
    const companyId = await getActiveCompanyId(
      req.user.id,
      req.body?.companyId || req.query?.companyId,
      req.user?.role,
      req.user,
    );

    let automation = await Automation.findOne({
      _id: id,
      companyId,
      isSystemPreset: { $ne: true },
      isTenshiFlow: { $ne: true },
    });
    if (!automation) {
      automation = await Automation.findOne({
        _id: id,
        ...(req.user?.role === 'ADMIN' ? {} : { user: req.user.id }),
        isSystemPreset: { $ne: true },
        isTenshiFlow: { $ne: true },
        companyId: { $nin: ['SYSTEM_PRESET', 'TENSHI_GLOBAL'] },
      });
    }
    if (!automation) {
      return res.status(404).json({ error: 'Automatización no encontrada.' });
    }

    const result = await stopAutomation(id);
    res.json(result);
  } catch (error) {
    console.error('[API Automatizaciones] Error stopping run:', error);
    res.status(500).json({ error: 'Error al detener la automatización.' });
  }
});

/**
 * POST /api/sgsst/automatizaciones/seed-admin-examples
 * Permite a un usuario ADMIN generar/restaurar las 2 automatizaciones de ejemplo en su empresa activa.
 */
router.post('/seed-admin-examples', async (req, res) => {
  try {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Acción exclusiva para administradores.' });
    }
    const companyId = await getActiveCompanyId(
      req.user.id,
      req.body?.companyId || req.query?.companyId,
      req.user?.role,
      req.user,
    );
    if (!companyId) {
      return res.status(400).json({ error: 'No se encontró una empresa asociada para su usuario.' });
    }
    await ensureAdminSampleAutomations(req.user, companyId, true);
    const automations = await Automation.find({
      companyId,
      isSystemPreset: { $ne: true },
      isTenshiFlow: { $ne: true },
    })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, automations });
  } catch (error) {
    console.error('[API Automatizaciones] Error seeding admin examples:', error);
    res.status(500).json({ error: 'Error al generar las automatizaciones de ejemplo.' });
  }
});

function normalizeAutomationLogRun(logDoc, activeLogIdsSet = new Set(), viewerRole = '') {
  if (!logDoc) return null;
  const files =
    Array.isArray(logDoc.evidenceFiles) && logDoc.evidenceFiles.length > 0
      ? logDoc.evidenceFiles
      : Array.isArray(logDoc.evidences)
        ? logDoc.evidences
        : [];
  const logIdStr = String(logDoc._id || '');
  const isConfidentialTenshiRun = Boolean(logDoc.isTenshiFlow) && viewerRole !== 'ADMIN';

  if (isConfidentialTenshiRun) {
    return {
      ...logDoc,
      prompt: logDoc.userInstruction || logDoc.tenshiFlowName || 'Consulta ejecutada con Tenshi',
      evidenceFiles: files,
      evidences: files,
      liveSteps: [],
      executionTrace: null,
      pendingApprovalPayload: null,
      completedNodeKeys: [],
      blockedNodeKeys: [],
      skippedNodeKeys: [],
      activeStepNodeKey: null,
      currentStageLabel:
        logDoc.status === 'running' ? 'Procesando consulta con Tenshi...' : 'Completado',
      isActivelyRunningInProcess:
        logDoc.status === 'running' && activeLogIdsSet.has(logIdStr),
    };
  }

  const liveSteps = Array.isArray(logDoc.liveSteps) ? logDoc.liveSteps : [];
  const completedNodeKeys = Array.isArray(logDoc.completedNodeKeys)
    ? logDoc.completedNodeKeys
    : [];
  const blockedNodeKeys = Array.isArray(logDoc.blockedNodeKeys)
    ? logDoc.blockedNodeKeys
    : [];
  const skippedNodeKeys = Array.isArray(logDoc.skippedNodeKeys)
    ? logDoc.skippedNodeKeys
    : [];
  return {
    ...logDoc,
    evidenceFiles: files,
    evidences: files,
    liveSteps,
    completedNodeKeys,
    blockedNodeKeys,
    skippedNodeKeys,
    isActivelyRunningInProcess:
      logDoc.status === 'running' && activeLogIdsSet.has(logIdStr),
  };
}

/**
 * GET /api/sgsst/automatizaciones/logs
 * Obtiene el historial completo de ejecuciones para la empresa activa (incluyendo bandeja estructurada evidenceFiles / evidences).
 */
router.get('/logs', async (req, res) => {
  try {
    const companyId = await getActiveCompanyId(
      req.user.id,
      req.query?.companyId,
      req.user?.role,
      req.user,
    );
    if (!companyId) {
      return res.json([]);
    }

    // Reconciliar logs huérfanos sin latido activo
    await reconcileOrphanedRunningRuns({ companyId });

    const logFilter = { companyId };
    if (req.query?.automationId && mongoose.Types.ObjectId.isValid(String(req.query.automationId))) {
      logFilter.automation = String(req.query.automationId);
    }

    const { activeLogIds } = getActiveRunningSnapshot();
    const activeLogIdsSet = new Set(activeLogIds);

    const rawLogs = await AutomationLog.find(logFilter)
      .sort({ runAt: -1, createdAt: -1 })
      .limit(50) // Capped a las últimas 50 corridas
      .lean();

    const logs = rawLogs.map((l) =>
      normalizeAutomationLogRun(l, activeLogIdsSet, req.user?.role),
    );

    res.json(logs);
  } catch (error) {
    console.error('[API Automatizaciones Logs] Error listing logs:', error);
    res.status(500).json({ error: 'Error al obtener el historial de ejecuciones.' });
  }
});

/**
 * GET /api/sgsst/automatizaciones/runs/:logId
 * Consulta el estado en vivo y los pasos detallados de una corrida individual (para polling paso a paso).
 */
router.get('/runs/:logId', async (req, res) => {
  try {
    const { logId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(String(logId || ''))) {
      return res.status(400).json({ error: 'ID de corrida inválido.' });
    }

    const prelimLog = await AutomationLog.findById(logId)
      .select('_id automation user companyId status isTenshiFlow')
      .lean();
    if (!prelimLog) {
      return res.status(404).json({ error: 'Corrida de automatización no encontrada.' });
    }

    const companyId = await getActiveCompanyId(
      req.user.id,
      req.query?.companyId,
      req.user?.role,
      req.user,
    );
    const hasAccess =
      req.user?.role === 'ADMIN' ||
      (!req.user?.isSubUser && String(prelimLog.user || '') === String(req.user.id || '')) ||
      (companyId && String(prelimLog.companyId || '') === String(companyId));
    if (!hasAccess) {
      return res.status(403).json({ error: 'No tienes permiso para consultar esta ejecución.' });
    }

    if (prelimLog.status === 'running') {
      await reconcileOrphanedRunningRuns({
        automationId: prelimLog.automation || null,
        companyId: prelimLog.companyId || companyId || null,
      });
    }

    const { activeLogIds } = getActiveRunningSnapshot();
    const activeLogIdsSet = new Set(activeLogIds);
    const freshLog = await AutomationLog.findById(logId).lean();
    if (!freshLog) {
      return res.status(404).json({ error: 'Corrida de automatización no encontrada.' });
    }

    res.json(normalizeAutomationLogRun(freshLog, activeLogIdsSet, req.user?.role));
  } catch (error) {
    console.error('[API Automatizaciones Runs] Error getting live run:', error);
    res.status(500).json({ error: 'Error al consultar el estado de la corrida.' });
  }
});

/**
 * GET /api/sgsst/automatizaciones/:id/runs
 * Devuelve el resumen actualizado de la automatización y su histórico completo por flujo (hasta 30 corridas con pasos en vivo y respuesta HTML).
 */
router.get('/:id/runs', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(String(id || ''))) {
      return res.status(400).json({ error: 'ID de automatización inválido.' });
    }

    const companyId = await getActiveCompanyId(
      req.user.id,
      req.query?.companyId,
      req.user?.role,
      req.user,
    );
    let automation = await Automation.findOne({
      _id: id,
      companyId,
      isSystemPreset: { $ne: true },
      isTenshiFlow: { $ne: true },
    }).lean();
    if (!automation) {
      automation = await Automation.findOne({
        _id: id,
        ...(req.user?.role === 'ADMIN' ? {} : { user: req.user.id }),
        isSystemPreset: { $ne: true },
        isTenshiFlow: { $ne: true },
        companyId: { $nin: ['SYSTEM_PRESET', 'TENSHI_GLOBAL'] },
      }).lean();
    }
    if (!automation) {
      return res.status(404).json({ error: 'Automatización no encontrada.' });
    }

    await reconcileOrphanedRunningRuns({
      automationId: automation._id,
      companyId: automation.companyId || companyId || null,
    });

    const refreshedAutomation = await Automation.findById(automation._id)
      .select(
        'name isActive lastRunStatus lastRunAt lastRunResult lastRunLogId agentId agentName cronExpression humanScheduleDescription companyId createdAt updatedAt',
      )
      .lean();

    const parsedLimit = Number.parseInt(String(req.query?.limit || '30'), 10);
    const limit = Number.isFinite(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 50) : 30;

    const { activeAutomationIds, activeLogIds } = getActiveRunningSnapshot();
    const activeAutoSet = new Set(activeAutomationIds);
    const activeLogIdsSet = new Set(activeLogIds);

    const rawLogs = await AutomationLog.find({ automation: automation._id })
      .sort({ runAt: -1, createdAt: -1 })
      .limit(limit)
      .lean();

    res.json({
      automation: refreshedAutomation
        ? {
            ...refreshedAutomation,
            isActivelyRunningInProcess:
              refreshedAutomation.lastRunStatus === 'running' &&
              activeAutoSet.has(String(refreshedAutomation._id)),
          }
        : null,
      runs: rawLogs.map((l) => normalizeAutomationLogRun(l, activeLogIdsSet, req.user?.role)),
    });
  } catch (error) {
    console.error('[API Automatizaciones Runs] Error listing flow runs:', error);
    res.status(500).json({ error: 'Error al obtener el histórico de ejecuciones del flujo.' });
  }
});

module.exports = router;
