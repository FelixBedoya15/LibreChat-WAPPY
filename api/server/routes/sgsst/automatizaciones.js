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
} = require('~/server/services/automationScheduler');
const { inspectNodeLiveData } = require('~/server/services/workflowNodeInspectorService');

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
    if (!automationId || !mongoose.Types.ObjectId.isValid(automationId)) {
      return res.status(400).json({ error: 'El parámetro automationId es obligatorio y debe ser válido.' });
    }

    const automation = await Automation.findOne({
      _id: automationId,
      isSystemPreset: { $ne: true },
    }).lean();

    if (!automation) {
      return res.status(404).json({ error: 'Automatización no encontrada.' });
    }
    if (automation.status !== 'active') {
      return res.status(403).json({ error: 'La automatización está inactiva o pausada.' });
    }

    const triggers = Array.isArray(automation.workflowNodes?.triggers)
      ? automation.workflowNodes.triggers
      : automation.workflowNodes?.trigger
        ? [automation.workflowNodes.trigger]
        : [];
    if (!triggers.includes('trigger_webhook')) {
      return res.status(400).json({
        error: 'Esta automatización no tiene habilitado el disparador Webhook (trigger_webhook).',
      });
    }

    const nodeConfigs =
      automation.workflowNodes?.canvasLayout?.nodeConfigs ||
      automation.workflowNodes?.nodeConfigs ||
      {};
    const configuredSecret = String(
      nodeConfigs?.trigger_root?.webhookSecret ||
        nodeConfigs?.trigger_trigger_webhook?.webhookSecret ||
        nodeConfigs?.trigger_webhook?.webhookSecret ||
        '',
    ).trim();

    if (configuredSecret) {
      const authHeader = String(req.headers?.authorization || '');
      const bearerToken = authHeader.replace(/^Bearer\s+/i, '').trim();
      const candidateSecret =
        req.headers?.['x-wappy-secret'] ||
        (bearerToken !== authHeader ? bearerToken : '') ||
        req.query?.secret ||
        req.body?.secret ||
        '';
      if (!safeSecretEquals(configuredSecret, candidateSecret)) {
        return res.status(401).json({ error: 'Secreto de Webhook inválido o no autorizado.' });
      }
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

// Auxiliar para obtener el ID de la empresa objetivo/activa del usuario (respeta ?companyId= o body.companyId validando pertenencia)
async function getActiveCompanyId(userId, explicitCompanyId = null, userRole = '') {
  const cleanExplicit =
    explicitCompanyId && String(explicitCompanyId).trim() !== 'SYSTEM_PRESET'
      ? String(explicitCompanyId).trim()
      : '';
  if (cleanExplicit && mongoose.Types.ObjectId.isValid(cleanExplicit)) {
    const query =
      userRole === 'ADMIN'
        ? { _id: cleanExplicit }
        : { _id: cleanExplicit, user: userId };
    const matched = await CompanyInfo.findOne(query).select('_id').lean();
    if (matched?._id) {
      return matched._id.toString();
    }
  }
  let active = await CompanyInfo.findOne({ user: userId, isActive: true }).select('_id').lean();
  if (!active) active = await CompanyInfo.findOne({ user: userId }).select('_id').lean();
  return active ? active._id.toString() : null;
}

// Catálogo oficial auditado de 54 Tareas Preestablecidas del Sistema (Flujos Autónomos de WAPPY IA)
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
        const cleanTarget = String(targetName || '').toLowerCase();
        const exact = allAgents.find((a) => a.name && a.name.toLowerCase() === cleanTarget);
        if (exact) return { id: exact.id, name: exact.name };
        const partial = allAgents.find((a) => a.name && a.name.toLowerCase().includes(cleanTarget));
        if (partial) return { id: partial.id, name: partial.name };
        const consultor = allAgents.find((a) => /Consultor SG-SST/i.test(a.name));
        if (consultor) return { id: consultor.id, name: consultor.name };
        return { id: allAgents[0].id, name: allAgents[0].name };
      };

      const ops = DEFAULT_SYSTEM_PRESETS.map((preset) => {
        const ag = resolveAgentForPreset(preset.agentTargetName);
        return {
          updateOne: {
            filter: { isSystemPreset: true, presetKey: preset.presetKey },
            update: {
              $set: {
                presetCategory: preset.presetCategory,
                presetDescription: preset.presetDescription,
                name: preset.name,
                agentId: ag.id,
                agentName: ag.name,
                prompt: preset.prompt,
                scheduleType: preset.scheduleType,
                scheduleConfig: preset.scheduleConfig,
                workflowNodes: preset.workflowNodes,
              },
              $setOnInsert: {
                companyId: 'SYSTEM_PRESET',
                isSystemPreset: true,
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
      _syncedPresetsVersion = SYSTEM_WORKFLOW_PRESETS_VERSION;
    } catch (err) {
      console.error('[API Automatizaciones] Error asegurando 54 Tareas Preestablecidas del Sistema:', err);
    } finally {
      _syncPresetsPromise = null;
    }
  })();

  return _syncPresetsPromise;
}
async function ensureAdminSampleAutomations(user, companyId, force = false) {
  if (!user || user.role !== 'ADMIN' || !companyId) return;
  if (!force) {
    const existingCount = await Automation.countDocuments({ companyId });
    if (existingCount > 0) return;
  } else {
    // Si fuerza recarga desde el botón Admin, reemplazamos los ejemplos previos [Ejemplo Admin]
    const oldSamples = await Automation.find({
      companyId,
      name: /^\[Ejemplo Admin\]/i,
    }).select('_id').lean();
    if (oldSamples.length > 0) {
      const oldIds = oldSamples.map((s) => s._id);
      await AutomationLog.deleteMany({ automation: { $in: oldIds } });
      await Automation.deleteMany({ _id: { $in: oldIds } });
    }
  }

  try {
    const medicoAgent = await Agent.findOne({ name: /Médico Laboral|Consultor SG-SST/i }).select('id name').lean();
    const consultorAgent = await Agent.findOne({ name: /Consultor SG-SST/i }).select('id name').lean();

    const agent1Id = medicoAgent?.id || 'agent_medico_laboral';
    const agent1Name = medicoAgent?.name || 'Médico Laboral';
    const agent2Id = consultorAgent?.id || 'agent_consultor_sg_sst';
    const agent2Name = consultorAgent?.name || 'Consultor SG-SST';
    const adminEmail = user.email ? [user.email] : ['admin@wappy.club'];

    const sample1RunAt = new Date(Date.now() - 2 * 3600 * 1000);
    const sample2RunAt = new Date(Date.now() - 14 * 3600 * 1000);

    const sample1Result = `### 📂 Sincronización Google Drive → Perfil Sociodemográfico y Exámenes Médicos (Somos SST)

**Carpeta vigilada en Google Drive:** \`SG-SST / Perfil Sociodemográfico y EMO\`
**Herramientas ejecutadas:** \`google_drive\` (\`list_files_and_folders\`, \`read_document_content\`) → \`somos_sst\` (\`alimentar_sociodemografico_masivo\`, \`actualizar_examen_medico\`)

| Archivo Detectado en Drive | Novedad Identificada | Aplicativo Alimentado en WAPPY | Estado de Sincronización |
| :--- | :--- | :--- | :---: |
| \`Actualizacion_Sociodemografica_Octubre.xlsx\` | 4 colaboradores actualizaron dirección, EPS, turno de trabajo y contacto de emergencia | **Hito 2: Perfil Sociodemográfico y Condiciones de Salud** | ✅ Sincronizado (4 perfiles actualizados) |
| \`Concepto_Aptitud_Carlos_Ramirez.pdf\` | Examen médico periódico con recomendación ergonómica postural | **Hito 2: Seguimiento de Exámenes Médicos Ocupacionales** | ✅ Registrado + Alerta en Centro de Control |

> **Dictamen del Agente:** Se compararon las marcas de tiempo y cédulas contra la base de datos de **Somos SST**. Los 4 expedientes modificados en el archivo de Drive y el concepto médico ocupacional ya quedaron asentados automáticamente en los aplicativos correspondientes sin duplicar registros.`;

    const sample2Result = `### 🚨 Vigilancia de Carpeta Drive → Aplicativos de Accidentes (ATEL), Inspecciones y Actos Inseguros

**Carpeta vigilada en Google Drive:** \`SG-SST / Reportes de Campo, Inspecciones y ATEL\`
**Herramientas ejecutadas:** \`google_drive\` (\`list_files_and_folders\`, \`read_document_content\`) → \`somos_sst\` (\`registrar_accidente_atel\`, \`editar_cualquier_aplicativo\`, \`crear_actividad_acpm\`)

* **1. Reporte de Accidente / Incidente detectado:** \`FURAT_Preliminar_Bodega_Norte.pdf\`
  * **Acción ejecutada en WAPPY:** Se extrajo la información del suceso (lesión leve en mano derecha por manipulación de estiba, 2 días de incapacidad) y se alimentó automáticamente el **Aplicativo de Investigación de Accidentes e Incidentes (ATEL — Hito 7)** mediante \`registrar_accidente_atel\`.
* **2. Reporte de Actos y Condiciones Inseguras:** \`Inspeccion_Locativa_y_Actos_Semana42.xlsx\`
  * **Acción ejecutada en WAPPY:** Se identificaron 2 condiciones locativas (cableado expuesto en pasillo 3 y extintor multipropósito despresurizado) y se inyectaron en el **Aplicativo de Reporte de Actos y Condiciones Inseguras (Hito 4)** y **Plan de Acción ACPM (Centro de Control)**.

\`\`\`wappy-card
{
  "title": "Automatización Drive → Aplicativos WAPPY Completada",
  "subtitle": "2 archivos nuevos procesados e inyectados en Somos SST",
  "items": [
    {
      "title": "Aplicativo ATEL (Hito 7)",
      "description": "1 nuevo caso de accidente de trabajo registrado desde FURAT_Preliminar_Bodega_Norte.pdf."
    },
    {
      "title": "Aplicativo Actos y Condiciones + ACPM (Hito 4)",
      "description": "2 hallazgos locativos cargados desde Inspeccion_Locativa_y_Actos_Semana42.xlsx con tarea correctiva asignada."
    }
  ]
}
\`\`\``;

    const auto1 = await Automation.create({
      user: user.id,
      companyId,
      name: '[Ejemplo Admin] Vigilar Drive y Alimentar Perfil Sociodemográfico y Exámenes en Somos SST',
      agentId: agent1Id,
      agentName: agent1Name,
      prompt:
        'Conéctate a mi Google Drive usando la herramienta google_drive (list_files_and_folders y read_document_content) y revisa la carpeta o archivos recientes de "Perfil Sociodemográfico" y "Condiciones de Salud / Exámenes Médicos". Si Google Drive no está vinculado a esta empresa o no existen archivos nuevos reales, infórmalo de inmediato y detén el proceso sin simular ni inventar datos. Si existen documentos reales nuevos o actualizados (Excel, Google Sheets o PDF), identifica qué trabajadores tienen información nueva o modificada y ejecuta la herramienta somos_sst (acciones alimentar_sociodemografico_masivo, importar_sociodemografico_drive o actualizar_examen_medico) exclusivamente para esta empresa. Al finalizar, entrégame un resumen en Markdown de los archivos reales leídos y los trabajadores actualizados.',
      scheduleType: 'daily',
      scheduleConfig: { hour: 18, minute: 0 },
      workflowNodes: {
        trigger: 'schedule_cron',
        triggers: ['schedule_cron', 'trigger_tenshi'],
        extractors: ['extract_drive', 'extract_sst_workers'],
        aiEngine: 'wappy',
        aiModel: 'gemini-3.6-flash',
        memoryNode: 'wappy_memory_company',
        memories: ['wappy_memory_company', 'wappy_memory_antiduplicate'],
        inputs: ['google_drive', 'somos_sst_trabajadores', 'somos_sst_examenes'],
        includeIfNode: true,
        hitos: ['hito2_perfil_socio', 'hito2_examenes_medicos'],
        outputs: ['somos_sst_update', 'email_report', 'wappy_notification'],
        canvasLayout: {
          nodeConfigs: {
            if_router: {
              ifConditionLabel: '¿Hay Archivos Nuevos de EMO / Sociodemográfico en Drive?',
              ifConditionType: 'critical_findings',
              ifRuleExpression: 'actualizado, nuevo, concepto, restricción, examen',
            },
            out_somos_sst_update: { ifBranch: 'yes' },
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
      name: '[Ejemplo Admin] Vigilar Drive y Registrar Accidentes ATEL, Inspecciones y Actos Inseguros',
      agentId: agent2Id,
      agentName: agent2Name,
      prompt:
        'Revisa en Google Drive (usando google_drive: list_files_and_folders y read_document_content) los archivos o carpetas donde se suban reportes de Accidentes/Incidentes de Trabajo (FURAT/ATEL), Inspecciones de Seguridad o Reportes de Actos y Condiciones Inseguras. Si Google Drive no está vinculado a esta empresa o no existen archivos nuevos reales, infórmalo con total transparencia y detén el proceso sin simular ni inventar datos ni crear nuevas tareas programadas. Solo cuando detectes un archivo real nuevo o actualizado en Drive: 1) Si contiene un accidente o incidente laboral nuevo, extrae los datos reales del evento y regístralo en el aplicativo de Accidentes ATEL de Somos SST usando somos_sst (acción registrar_accidente_atel). 2) Si contiene actos/condiciones inseguras o hallazgos reales de inspecciones, aliméntalos en el aplicativo correspondiente de Somos SST. Genera un informe en Markdown únicamente con los archivos reales procesados.',
      scheduleType: 'daily',
      scheduleConfig: { hour: 7, minute: 30 },
      workflowNodes: {
        trigger: 'schedule_cron',
        triggers: ['schedule_cron', 'trigger_tenshi'],
        extractors: ['extract_drive', 'extract_sst_workers'],
        aiEngine: 'wappy',
        aiModel: 'gemini-3.8-flash',
        memoryNode: 'wappy_memory_company',
        memories: ['wappy_memory_company', 'wappy_memory_antiduplicate'],
        inputs: ['google_drive', 'somos_sst_trabajadores', 'consultar_analitica_actos_condiciones'],
        includeIfNode: true,
        hitos: ['hito7_investigacion_atel', 'hito4_actos_condiciones', 'hito7_acpm'],
        outputs: ['somos_sst_update', 'canvas_doc', 'acpm_task', 'email_report', 'wappy_notification'],
        canvasLayout: {
          nodeConfigs: {
            extractor_extract_drive: { driveFolderName: 'Accidentes' },
            hito_hito7_investigacion_atel: { hitoOperationMode: 'write_register' },
            if_router: {
              ifConditionLabel: '¿Hay FURAT o Inspección Nueva en Drive?',
              ifConditionType: 'critical_findings',
              ifRuleExpression: 'furat, accidente, incidente, hallazgo, condición insegura',
            },
            out_somos_sst_update: { ifBranch: 'yes' },
            out_canvas_doc: { ifBranch: 'yes' },
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
    const companyId = await getActiveCompanyId(req.user.id, explicitCompanyId, req.user?.role);

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
 * Dispara automatizaciones del usuario/empresa con `'trigger_tenshi'` cuyo `voiceCommand` o nombre de tarea coincida.
 */
router.post('/trigger-tenshi', async (req, res) => {
  try {
    const commandText = String(req.body?.commandText || req.body?.text || '').trim();
    const explicitAutomationId = req.body?.automationId ? String(req.body.automationId).trim() : '';
    if (!commandText && !explicitAutomationId) {
      return res.status(400).json({ error: 'El parámetro commandText es obligatorio.' });
    }

    const companyId = await getActiveCompanyId(
      req.user.id,
      req.body?.companyId || req.query?.companyId,
      req.user?.role,
    );

    const norm = (str) =>
      String(str || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    const queryFilter = {
      isSystemPreset: { $ne: true },
      status: 'active',
      ...(companyId ? { companyId } : { user: req.user.id }),
    };

    const candidates = await Automation.find(queryFilter).lean();
    const cmdNorm = norm(commandText);

    const matched = candidates.filter((auto) => {
      if (explicitAutomationId && String(auto._id) === explicitAutomationId) {
        return true;
      }
      const triggers = Array.isArray(auto?.workflowNodes?.triggers)
        ? auto.workflowNodes.triggers
        : auto?.workflowNodes?.trigger
          ? [auto.workflowNodes.trigger]
          : [];
      if (!triggers.includes('trigger_tenshi')) {
        return false;
      }

      const nodeConfigs =
        auto?.workflowNodes?.canvasLayout?.nodeConfigs ||
        auto?.workflowNodes?.nodeConfigs ||
        {};
      const configuredCmd = norm(
        nodeConfigs?.trigger_root?.voiceCommand ||
          nodeConfigs?.trigger_trigger_tenshi?.voiceCommand ||
          nodeConfigs?.trigger_tenshi?.voiceCommand ||
          '',
      );
      const taskNameNorm = norm(auto.name || '');

      if (configuredCmd && (cmdNorm.includes(configuredCmd) || configuredCmd.includes(cmdNorm))) {
        return true;
      }
      if (taskNameNorm && (cmdNorm.includes(taskNameNorm) || taskNameNorm.includes(cmdNorm))) {
        return true;
      }
      return !configuredCmd && candidates.filter((c) => (c?.workflowNodes?.triggers || []).includes('trigger_tenshi')).length === 1;
    });

    if (matched.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No se encontró ninguna automatización activa con disparador de voz/texto Tenshi que coincida con ese comando.',
      });
    }

    for (const auto of matched) {
      setImmediate(() => {
        runAutomation(auto, {
          triggerSource: 'tenshi_voice',
          eventPayload: {
            commandText,
            invokedBy: req.user?.email || req.user?.id,
            invokedAt: new Date().toISOString(),
          },
        }).catch((tErr) => {
          console.error('[Trigger Tenshi] Error ejecutando flujo:', tErr?.message || tErr);
        });
      });
    }

    return res.json({
      success: true,
      triggeredCount: matched.length,
      automations: matched.map((a) => ({ _id: a._id, name: a.name })),
      message: `Disparado(s) ${matched.length} flujo(s) por comando Tenshi.`,
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

    const outputSummary = await executeDownstreamOutputs({
      automation: automation || {
        _id: log.automation,
        name: 'Automatización Aprobada',
        user: log.user,
        companyId: log.companyId,
        prompt: log.prompt || '',
        emails: req.user?.email ? [req.user.email] : [],
      },
      user: req.user,
      companyId: log.companyId || automation?.companyId || null,
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

    if (log.automation) {
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
      log: log.toObject(),
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

    if (log.automation) {
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
      log: log.toObject(),
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
    );

    // Si se pasa un automationId opcional, usarlo como base de respaldo para campos no enviados en el body
    let existingDoc = null;
    if (automationId) {
      try {
        existingDoc = await Automation.findById(automationId).lean();
      } catch (_) {}
    }

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
        companyId: resolvedCompanyId || existingDoc?.companyId || null,
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
    const presets = await Automation.find({ isSystemPreset: true })
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

    const preset = await Automation.findOne({ _id: id, isSystemPreset: true });
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
    const result = await Automation.deleteOne({ _id: id, isSystemPreset: true });
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
    const { activateImmediately = false, emails, companyId: explicitCompanyId } = req.body || {};

    const companyId = await getActiveCompanyId(
      req.user.id,
      explicitCompanyId || req.query?.companyId,
      req.user?.role,
    );
    if (!companyId) {
      return res.status(400).json({ error: 'No se encontró una empresa asociada para su usuario. Registre su empresa primero.' });
    }

    const preset = await Automation.findOne({ _id: id, isSystemPreset: true }).lean();
    if (!preset) {
      return res.status(404).json({ error: 'No se encontró la plantilla de tarea preestablecida.' });
    }

    const { limit: effectiveLimit } = await getEffectiveAutomationLimit(req.user.id, req.user.role);
    const activeCount = await Automation.countDocuments({
      user: req.user.id,
      isSystemPreset: { $ne: true },
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

/**
 * GET /api/sgsst/automatizaciones
 * Lista todas las automatizaciones configuradas para la empresa activa del usuario.
 */
router.get('/', async (req, res) => {
  try {
    const companyId = await getActiveCompanyId(req.user.id, req.query?.companyId, req.user?.role);
    if (!companyId) {
      return res.json([]);
    }

    if (req.user?.role === 'ADMIN') {
      await ensureSimpleAdminFlow(req.user, companyId);
    }

    // Auto-recuperar tareas bloqueadas en 'running' por más de 10 minutos
    const staleRunningCutoff = new Date(Date.now() - 10 * 60 * 1000);
    await Automation.updateMany(
      { companyId, isSystemPreset: { $ne: true }, lastRunStatus: 'running', updatedAt: { $lt: staleRunningCutoff } },
      { $set: { lastRunStatus: 'failed', lastRunResult: 'Tiempo de ejecución límite agotado.' } }
    );

    const findQuery = {
      companyId,
      isSystemPreset: { $ne: true },
      ...(req.user?.role !== 'ADMIN' ? { adminOnly: { $ne: true } } : {}),
    };

    const automations = await Automation.find(findQuery)
      .sort({ adminOnly: -1, createdAt: -1 })
      .lean();
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
    );
    let automation = await Automation.findOne({
      _id: id,
      companyId,
      isSystemPreset: { $ne: true },
    });
    if (!automation) {
      automation = await Automation.findOne({
        _id: id,
        ...(req.user?.role === 'ADMIN' ? {} : { user: req.user.id }),
        isSystemPreset: { $ne: true },
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
    const companyId = await getActiveCompanyId(
      req.user.id,
      req.query?.companyId || req.body?.companyId,
      req.user?.role,
    );

    let result = await Automation.deleteOne({ _id: id, companyId, isSystemPreset: { $ne: true } });
    if (result.deletedCount === 0) {
      result = await Automation.deleteOne({
        _id: id,
        ...(req.user?.role === 'ADMIN' ? {} : { user: req.user.id }),
        isSystemPreset: { $ne: true },
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
    const companyId = await getActiveCompanyId(
      req.user.id,
      req.body?.companyId || req.query?.companyId,
      req.user?.role,
    );

    let automation = await Automation.findOne({ _id: id, companyId, isSystemPreset: { $ne: true } });
    if (!automation) {
      automation = await Automation.findOne({
        _id: id,
        ...(req.user?.role === 'ADMIN' ? {} : { user: req.user.id }),
        isSystemPreset: { $ne: true },
      });
    }
    if (!automation) {
      return res.status(404).json({ error: 'Automatización no encontrada.' });
    }

    if (automation.lastRunStatus === 'running') {
      const twoMinAgo = new Date(Date.now() - 2 * 60 * 1000);
      if (automation.updatedAt && automation.updatedAt > twoMinAgo) {
        return res.status(400).json({ error: 'Esta automatización ya se encuentra ejecutándose en segundo plano.' });
      }
      console.log(`[API Run Manual] Forzando ejecución para "${automation.name}" tras detectar estado previo no concluido.`);
    }

    // Marcar como corriendo
    await Automation.updateOne({ _id: automation._id }, { $set: { lastRunStatus: 'running' } });

    // Ejecutar en background de forma inmediata
    runAutomation(automation, true).catch(err => {
      console.error('[API Run Manual] Error en corrida background:', err);
    });

    res.json({ success: true, message: 'Ejecución iniciada correctamente en segundo plano.' });
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
    const companyId = await getActiveCompanyId(
      req.user.id,
      req.body?.companyId || req.query?.companyId,
      req.user?.role,
    );

    let automation = await Automation.findOne({ _id: id, companyId, isSystemPreset: { $ne: true } });
    if (!automation) {
      automation = await Automation.findOne({
        _id: id,
        ...(req.user?.role === 'ADMIN' ? {} : { user: req.user.id }),
        isSystemPreset: { $ne: true },
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
    );
    if (!companyId) {
      return res.status(400).json({ error: 'No se encontró una empresa asociada para su usuario.' });
    }
    await ensureAdminSampleAutomations(req.user, companyId, true);
    const automations = await Automation.find({ companyId }).sort({ createdAt: -1 }).lean();
    res.json({ success: true, automations });
  } catch (error) {
    console.error('[API Automatizaciones] Error seeding admin examples:', error);
    res.status(500).json({ error: 'Error al generar las automatizaciones de ejemplo.' });
  }
});

/**
 * GET /api/sgsst/automatizaciones/logs
 * Obtiene el historial completo de ejecuciones para la empresa activa (incluyendo bandeja estructurada evidenceFiles / evidences).
 */
router.get('/logs', async (req, res) => {
  try {
    const companyId = await getActiveCompanyId(req.user.id, req.query?.companyId, req.user?.role);
    if (!companyId) {
      return res.json([]);
    }

    // Auto-recuperar logs bloqueados en 'running' por más de 10 minutos
    const staleRunningCutoff = new Date(Date.now() - 10 * 60 * 1000);
    await AutomationLog.updateMany(
      { companyId, status: 'running', createdAt: { $lt: staleRunningCutoff } },
      { $set: { status: 'failed', error: 'Tiempo de ejecución límite superado.' } }
    );

    const logFilter = { companyId };
    if (req.query?.automationId && mongoose.Types.ObjectId.isValid(String(req.query.automationId))) {
      logFilter.automation = String(req.query.automationId);
    }

    const rawLogs = await AutomationLog.find(logFilter)
      .sort({ runAt: -1 })
      .limit(50) // Capped a las últimas 50 corridas
      .lean();

    const logs = rawLogs.map((l) => {
      const files =
        Array.isArray(l.evidenceFiles) && l.evidenceFiles.length > 0
          ? l.evidenceFiles
          : Array.isArray(l.evidences)
            ? l.evidences
            : [];
      return {
        ...l,
        evidenceFiles: files,
        evidences: files,
      };
    });

    res.json(logs);
  } catch (error) {
    console.error('[API Automatizaciones Logs] Error listing logs:', error);
    res.status(500).json({ error: 'Error al obtener el historial de ejecuciones.' });
  }
});

module.exports = router;
