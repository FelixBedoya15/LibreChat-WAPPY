const express = require('express');
const router = express.Router();
const requireJwtAuth = require('~/server/middleware/requireJwtAuth');
const CompanyInfo = require('~/models/CompanyInfo');
const Automation = require('~/models/Automation');
const AutomationLog = require('~/models/AutomationLog');
const { runAutomation, calculateNextRun } = require('~/server/services/automationScheduler');

// Middleware para verificar que el usuario sea administrador
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'No autorizado. Se requiere rol de Administrador.' });
  }
  next();
};

router.use(requireJwtAuth);
router.use(requireAdmin);

// Auxiliar para obtener el ID de la empresa activa del usuario
async function getActiveCompanyId(userId) {
  let active = await CompanyInfo.findOne({ user: userId, isActive: true });
  if (!active) active = await CompanyInfo.findOne({ user: userId });
  return active ? active._id.toString() : null;
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

    const automations = await Automation.find({ companyId }).sort({ createdAt: -1 });
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
      automation.status = status;
    }

    if (scheduleType !== undefined || scheduleConfig !== undefined || status === 'active') {
      automation.nextRunAt = calculateNextRun(automation.scheduleType, automation.scheduleConfig);
    } else if (status === 'inactive') {
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
 * GET /api/sgsst/automatizaciones/logs
 * Obtiene el historial completo de ejecuciones para la empresa activa.
 */
router.get('/logs', async (req, res) => {
  try {
    const companyId = await getActiveCompanyId(req.user.id);
    if (!companyId) {
      return res.json([]);
    }

    const logs = await AutomationLog.find({ companyId })
      .sort({ runAt: -1 })
      .limit(50); // Capped a las últimas 50 corridas
    res.json(logs);
  } catch (error) {
    console.error('[API Automatizaciones Logs] Error listing logs:', error);
    res.status(500).json({ error: 'Error al obtener el historial de ejecuciones.' });
  }
});

module.exports = router;
