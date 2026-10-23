const express = require('express');
const router = express.Router();
const requireJwtAuth = require('~/server/middleware/requireJwtAuth');
const CompanyInfo = require('~/models/CompanyInfo');
const Automation = require('~/models/Automation');
const AutomationLog = require('~/models/AutomationLog');
const { Agent } = require('~/db/models');
const { runAutomation, calculateNextRun, stopAutomation } = require('~/server/services/automationScheduler');

const UserPlan = require('~/db/models/UserPlan');

router.use(requireJwtAuth);

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

// Auxiliar para obtener el ID de la empresa activa del usuario
async function getActiveCompanyId(userId) {
  let active = await CompanyInfo.findOne({ user: userId, isActive: true });
  if (!active) active = await CompanyInfo.findOne({ user: userId });
  return active ? active._id.toString() : null;
}

/**
 * Si el usuario es ADMIN y su empresa activa no tiene automatizaciones configuradas (o fuerza recarga),
 * siembra automáticamente 2 ejemplos reales de automatización Drive -> Somos SST junto con su historial.
 */
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
        'Conéctate a mi Google Drive usando la herramienta google_drive (list_files_and_folders y read_document_content) y revisa la carpeta o archivos recientes de "Perfil Sociodemográfico" y "Condiciones de Salud / Exámenes Médicos". Lee los documentos nuevos o actualizados (Excel, Google Sheets o PDF), identifica qué trabajadores tienen información nueva o modificada (datos sociodemográficos, condiciones de salud o conceptos de aptitud médica) y, con esa información extraída, ejecuta inmediatamente la herramienta somos_sst (acciones alimentar_sociodemografico_masivo, importar_sociodemografico_drive o actualizar_examen_medico) para actualizar directamente el aplicativo de Perfil Sociodemográfico y Condiciones de Salud en Somos SST. Al finalizar, entrégame un resumen detallado de los archivos leídos y los trabajadores actualizados.',
      scheduleType: 'daily',
      scheduleConfig: { hour: 18, minute: 0 },
      emails: adminEmail,
      status: 'active',
      lastRunAt: sample1RunAt,
      lastRunStatus: 'success',
      lastRunResult: sample1Result,
      nextRunAt: calculateNextRun('daily', { hour: 18, minute: 0 }),
    });

    const auto2 = await Automation.create({
      user: user.id,
      companyId,
      name: '[Ejemplo Admin] Vigilar Drive y Registrar Accidentes ATEL, Inspecciones y Actos Inseguros',
      agentId: agent2Id,
      agentName: agent2Name,
      prompt:
        'Vigila en Google Drive (usando google_drive: list_files_and_folders y read_document_content) los archivos o carpetas donde se suban reportes de Accidentes/Incidentes de Trabajo (FURAT/ATEL), Inspecciones de Seguridad o Reportes de Actos y Condiciones Inseguras. Cuando detectes un archivo nuevo o actualizado: 1) Si contiene un accidente o incidente laboral nuevo, extrae todos los datos del evento (trabajador, fecha, gravedad, parte del cuerpo, días de incapacidad y descripción) y regístralo en el aplicativo de Accidentes ATEL de Somos SST usando somos_sst (acción registrar_accidente_atel). 2) Si contiene actos/condiciones inseguras o hallazgos de inspecciones, aliméntalos en el aplicativo correspondiente de Somos SST usando somos_sst (acción editar_cualquier_aplicativo con nombre_aplicativo="actos" o "auditoria" y crear_actividad_acpm en el Centro de Control). Genera un informe con cada registro inyectado en los aplicativos.',
      scheduleType: 'daily',
      scheduleConfig: { hour: 7, minute: 30 },
      emails: adminEmail,
      status: 'active',
      lastRunAt: sample2RunAt,
      lastRunStatus: 'success',
      lastRunResult: sample2Result,
      nextRunAt: calculateNextRun('daily', { hour: 7, minute: 30 }),
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
 * GET /api/sgsst/automatizaciones
 * Lista todas las automatizaciones configuradas para la empresa activa del usuario.
 */
router.get('/', async (req, res) => {
  try {
    const companyId = await getActiveCompanyId(req.user.id);
    if (!companyId) {
      return res.json([]);
    }

    if (req.user?.role === 'ADMIN') {
      await ensureAdminSampleAutomations(req.user, companyId);
    }

    // Auto-recuperar tareas bloqueadas en 'running' por más de 10 minutos
    // (alineado con el timeout de 8-10 min del scheduler; antes 3 min marcaba como fallidas corridas aún activas)
    const staleRunningCutoff = new Date(Date.now() - 10 * 60 * 1000);
    await Automation.updateMany(
      { companyId, lastRunStatus: 'running', updatedAt: { $lt: staleRunningCutoff } },
      { $set: { lastRunStatus: 'failed', lastRunResult: 'Tiempo de ejecución límite agotado.' } }
    );

    const automations = await Automation.find({ companyId }).sort({ createdAt: -1 }).lean();
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
    const { name, agentId, agentName, prompt, scheduleType, scheduleConfig, emails } = req.body;

    if (!name || !agentId || !prompt) {
      return res.status(400).json({ error: 'Faltan campos obligatorios: name, agentId y prompt son necesarios.' });
    }

    const { limit: effectiveLimit, plan: userPlanName } = await getEffectiveAutomationLimit(req.user.id, req.user.role);
    if (effectiveLimit <= 0) {
      return res.status(403).json({
        error: 'Las automatizaciones de tareas periódicas son exclusivas del Plan Wappy Pro. Actualiza tu suscripción para habilitar tareas autónomas.'
      });
    }

    const activeCount = await Automation.countDocuments({ user: req.user.id, status: 'active' });
    if (activeCount >= effectiveLimit) {
      return res.status(400).json({
        error: `Límite de ${effectiveLimit} automatización(es) activa(s) alcanzado para tu plan actual (${userPlanName === 'pro' ? 'Wappy Pro' : userPlanName}). Para activar más tareas, puedes adquirir un paquete de 5 automatizaciones adicionales por solo $25.000 COP/mes.`
      });
    }

    const companyId = await getActiveCompanyId(req.user.id);
    if (!companyId) {
      return res.status(400).json({ error: 'No se encontró una empresa asociada para su usuario. Registre su empresa primero.' });
    }

    const nextRunAt = calculateNextRun(scheduleType || 'daily', scheduleConfig || {});

    const automation = await Automation.create({
      user: req.user.id,
      companyId,
      name,
      agentId,
      agentName,
      prompt,
      scheduleType: scheduleType || 'daily',
      scheduleConfig: scheduleConfig || { hour: 8, minute: 0 },
      emails: emails || [],
      status: 'active',
      nextRunAt
    });

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
    const { name, agentId, agentName, prompt, scheduleType, scheduleConfig, emails, status } = req.body;

    const companyId = await getActiveCompanyId(req.user.id);
    const automation = await Automation.findOne({ _id: id, companyId });

    if (!automation) {
      return res.status(404).json({ error: 'No se encontró la automatización.' });
    }

    // Actualizar campos si vienen en el body
    if (name !== undefined) automation.name = name;
    if (agentId !== undefined) automation.agentId = agentId;
    if (agentName !== undefined) automation.agentName = agentName;
    if (prompt !== undefined) automation.prompt = prompt;
    if (scheduleType !== undefined) automation.scheduleType = scheduleType;
    if (scheduleConfig !== undefined) automation.scheduleConfig = scheduleConfig;
    if (emails !== undefined) automation.emails = emails;
    
    // Si cambia el estado, o cambia la configuración del schedule, recalculamos nextRunAt
    if (status !== undefined) {
      if (status === 'active' && automation.status !== 'active') {
        const { limit: effectiveLimit, plan: userPlanName } = await getEffectiveAutomationLimit(req.user.id, req.user.role);
        const activeCount = await Automation.countDocuments({ user: req.user.id, status: 'active' });
        if (activeCount >= effectiveLimit) {
          return res.status(400).json({
            error: `No se puede activar: Límite de ${effectiveLimit} automatización(es) activa(s) alcanzado para tu plan actual (${userPlanName === 'pro' ? 'Wappy Pro' : userPlanName}). Adquiere 5 adicionales por $25.000 COP/mes.`
          });
        }
      }
      automation.status = status;
    }

    if (automation.status === 'active') {
      if (scheduleType !== undefined || scheduleConfig !== undefined || status === 'active' || !automation.nextRunAt) {
        automation.nextRunAt = calculateNextRun(automation.scheduleType, automation.scheduleConfig);
      }
    } else {
      automation.nextRunAt = null;
    }

    await automation.save();
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
    const companyId = await getActiveCompanyId(req.user.id);

    const result = await Automation.deleteOne({ _id: id, companyId });
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
    const companyId = await getActiveCompanyId(req.user.id);

    const automation = await Automation.findOne({ _id: id, companyId });
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
    const companyId = await getActiveCompanyId(req.user.id);

    const automation = await Automation.findOne({ _id: id, companyId });
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
    const companyId = await getActiveCompanyId(req.user.id);
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
 * Obtiene el historial completo de ejecuciones para la empresa activa.
 */
router.get('/logs', async (req, res) => {
  try {
    const companyId = await getActiveCompanyId(req.user.id);
    if (!companyId) {
      return res.json([]);
    }

    if (req.user?.role === 'ADMIN') {
      await ensureAdminSampleAutomations(req.user, companyId);
    }

    // Auto-recuperar logs bloqueados en 'running' por más de 3 minutos
    const staleRunningCutoff = new Date(Date.now() - 10 * 60 * 1000);
    await AutomationLog.updateMany(
      { companyId, status: 'running', createdAt: { $lt: staleRunningCutoff } },
      { $set: { status: 'failed', error: 'Tiempo de ejecución límite superado.' } }
    );

    const logs = await AutomationLog.find({ companyId })
      .sort({ runAt: -1 })
      .limit(50) // Capped a las últimas 50 corridas
      .lean();
    res.json(logs);
  } catch (error) {
    console.error('[API Automatizaciones Logs] Error listing logs:', error);
    res.status(500).json({ error: 'Error al obtener el historial de ejecuciones.' });
  }
});

module.exports = router;
