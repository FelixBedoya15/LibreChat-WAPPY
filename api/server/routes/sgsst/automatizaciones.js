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
 * Si el usuario es ADMIN y su empresa activa no tiene automatizaciones configuradas,
 * siembra automáticamente 2 ejemplos profesionales de automatizaciones SST junto con su historial.
 */
async function ensureAdminSampleAutomations(user, companyId, force = false) {
  if (!user || user.role !== 'ADMIN' || !companyId) return;
  if (!force) {
    const existingCount = await Automation.countDocuments({ companyId });
    if (existingCount > 0) return;
  } else {
    const existingSamples = await Automation.countDocuments({
      companyId,
      name: /^\[Ejemplo Admin\]/i,
    });
    if (existingSamples >= 2) return;
  }

  try {
    const auditorAgent = await Agent.findOne({ name: /Auditor SG-SST/i }).select('id name').lean();
    const consultorAgent = await Agent.findOne({ name: /Consultor SG-SST/i }).select('id name').lean();

    const agent1Id = auditorAgent?.id || 'agent_auditor_sg_sst';
    const agent1Name = auditorAgent?.name || 'Auditor SG-SST';
    const agent2Id = consultorAgent?.id || 'agent_consultor_sg_sst';
    const agent2Name = consultorAgent?.name || 'Consultor SG-SST';
    const adminEmail = user.email ? [user.email] : ['admin@wappy.club'];

    const sample1RunAt = new Date(Date.now() - 3 * 3600 * 1000);
    const sample2RunAt = new Date(Date.now() - 26 * 3600 * 1000);

    const sample1Result = `### 📊 Dictamen Ejecutivo Semanal — Estándares Mínimos (Resolución 0312 de 2019)

**Estado General del Sistema:** Cumplimiento **Aceptable (88.5%)** — Ciclo PHVA Activo.

| Dimensión PHVA | Avance Actual | Hallazgos / Pendientes Críticos | Acción Preventiva Recomendada |
| :--- | :---: | :--- | :--- |
| **I. Planear** | 92% | Matriz Legal requiere actualización del trimestre | Ejecutar barrido normativo en Hito 1 |
| **II. Hacer** | 85% | 3 exámenes médicos periódicos próximos a vencer | Notificar a Medicina Laboral (Hito 2) |
| **III. Verificar** | 90% | Acta mensual del COPASST pendiente de firma digital | Convocar cierre de sesión en Hito 3 |
| **IV. Actuar** | 87% | 2 acciones ACPM en seguimiento de eficacia | Validar cierre de evidencias en Centro de Control |

> **Conclusión del Auditor IA:** No se detectan desviaciones críticas sancionables. Se recomienda priorizar la renovación de los certificados de trabajo seguro en alturas que vencen en los próximos 15 días.`;

    const sample2Result = `### 🛡️ Vigilancia Diaria de Controles Operacionales, EPP y Tareas Críticas

**Resumen de Inspección Autónoma (24h):**
* **Matriz de Peligros IPEVAR (GTC 45):** 0 riesgos críticos sin control asignado.
* **Control de Entregas de EPP:** 100% de cobertura en cargos operativos; 2 reposiciones de protección auditiva programadas para esta semana.
* **Permisos de Tareas de Alto Riesgo (Alturas / Energías Peligrosas):** Todos los permisos emitidos cuentan con ATS validado y lista de chequeo preoperacional firmada.

\`\`\`wappy-card
{
  "title": "Alerta Preventiva de Vencimientos (Próximos 7 días)",
  "subtitle": "Seguimiento proactivo generado por Consultor SG-SST",
  "items": [
    {
      "title": "Inspección de Botiquines y Extintores",
      "description": "Programada para el viernes a las 10:00 AM en Bodega Central."
    },
    {
      "title": "Capacitación de Pausas Activas y Ergonomía",
      "description": "Pendiente de confirmación de asistencia del área administrativa."
    }
  ]
}
\`\`\``;

    const auto1 = await Automation.create({
      user: user.id,
      companyId,
      name: '[Ejemplo Admin] Auditoría Semanal de Cumplimiento Res. 0312 y Ciclo PHVA',
      agentId: agent1Id,
      agentName: agent1Name,
      prompt:
        'Realiza una auditoría ejecutiva semanal del estado de cumplimiento de los Estándares Mínimos de la Resolución 0312 de 2019 y Decreto 1072 de 2015 de la empresa activa. Revisa el avance del diagnóstico, tareas vencidas del Plan Anual de Trabajo, estado de actas de comités (COPASST/CCL) y genera una tabla ejecutiva con hallazgos prioritarios y recomendaciones preventivas para la Alta Dirección.',
      scheduleType: 'weekly',
      scheduleConfig: { hour: 8, minute: 0, dayOfWeek: [1] },
      emails: adminEmail,
      status: 'active',
      lastRunAt: sample1RunAt,
      lastRunStatus: 'success',
      lastRunResult: sample1Result,
      nextRunAt: calculateNextRun('weekly', { hour: 8, minute: 0, dayOfWeek: [1] }),
    });

    const auto2 = await Automation.create({
      user: user.id,
      companyId,
      name: '[Ejemplo Admin] Vigilancia Diaria de Vencimientos, EPP y Controles IPEVAR',
      agentId: agent2Id,
      agentName: agent2Name,
      prompt:
        'Analiza diariamente la Matriz de Peligros (GTC 45), el cronograma de capacitaciones, las entregas de Elementos de Protección Personal (EPP) y los controles operacionales pendientes de la empresa. Identifica cualquier alerta temprana de vencimiento en los próximos 7 días y emite un boletín preventivo conciso con acciones recomendadas.',
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
