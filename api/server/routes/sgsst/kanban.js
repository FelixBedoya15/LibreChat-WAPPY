const express = require('express');
const requireJwtAuth = require('../../middleware/requireJwtAuth');
const mongoose = require('mongoose');
const KanbanTask = require('../../../models/KanbanTask');
const CompanyInfo = require('../../../models/CompanyInfo');
const SgsstVehicleData = require('../../../models/SgsstVehicleData');
const { logger } = require('~/config');

// Load dynamic models
if (!mongoose.models.PerfilSociodemograficoData) {
  require('./perfilSociodemografico');
}
const PerfilSociodemograficoData = mongoose.models.PerfilSociodemograficoData;

const router = express.Router();

// ─── Helper: Obtener Empresa Activa ──────────────────────────────────────────
async function getActiveCompanyId(userId) {
  let active = await CompanyInfo.findOne({ user: userId, isActive: true });
  if (!active) active = await CompanyInfo.findOne({ user: userId });
  return active ? active._id : null;
}

// Helper to parse dates
const parseDateString = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const parts = dateStr.trim().split('-');
  if (parts.length !== 3) return null;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
  const d = new Date(year, month, day);
  d.setHours(0, 0, 0, 0);
  return d;
};

// Helper to add days
const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

// ─── GET /data — Obtener y sincronizar tareas ───────────────────────────────
router.get('/data', requireJwtAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const companyId = await getActiveCompanyId(userId);
    if (!companyId) {
      return res.status(400).json({ error: 'No se encontró empresa activa' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Sync worker expirations
    const profile = await PerfilSociodemograficoData.findOne({ user: userId, companyId }).lean();
    if (profile && profile.trabajadores) {
      for (const w of profile.trabajadores) {
        const workerName = w.nombre || 'Trabajador';
        const workerId = w._id || w.id;

        // A. Medical Exam (Expires 365 days after last exam)
        if (w.fechaExamenMedico) {
          const lastExam = parseDateString(w.fechaExamenMedico);
          if (lastExam) {
            const dueDate = addDays(lastExam, 365);
            const diffDays = Math.round((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            await handleSyncTask(userId, companyId, {
              title: `Examen médico periódico: ${workerName}`,
              description: `Último examen médico reportado el ${w.fechaExamenMedico}.`,
              dueDate,
              diffDays,
              type: 'medical_exam',
              referenceId: `worker-${workerId}-medical_exam`,
              referenceName: workerName,
            });
          }
        }

        // B. Heights Course - Authorized (Expires 365 days after)
        if (w.fechaCursoAlturasAutorizado) {
          const lastAuth = parseDateString(w.fechaCursoAlturasAutorizado);
          if (lastAuth) {
            const dueDate = addDays(lastAuth, 365);
            const diffDays = Math.round((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            await handleSyncTask(userId, companyId, {
              title: `Curso Alturas Autorizado: ${workerName}`,
              description: `Último curso de alturas autorizado el ${w.fechaCursoAlturasAutorizado}.`,
              dueDate,
              diffDays,
              type: 'training',
              referenceId: `worker-${workerId}-heights_auth`,
              referenceName: workerName,
            });
          }
        }

        // C. Heights Course - Coordinator (Expires 365 days after)
        if (w.fechaCursoAlturasCoordinador) {
          const lastCoord = parseDateString(w.fechaCursoAlturasCoordinador);
          if (lastCoord) {
            const dueDate = addDays(lastCoord, 365);
            const diffDays = Math.round((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            await handleSyncTask(userId, companyId, {
              title: `Curso Alturas Coordinador: ${workerName}`,
              description: `Último curso de alturas coordinador el ${w.fechaCursoAlturasCoordinador}.`,
              dueDate,
              diffDays,
              type: 'training',
              referenceId: `worker-${workerId}-heights_coord`,
              referenceName: workerName,
            });
          }
        }

        // D. Driver License Expiration (Direct expiration date)
        if (w.licenciaConduccionVencimiento) {
          const dueDate = parseDateString(w.licenciaConduccionVencimiento);
          if (dueDate) {
            const diffDays = Math.round((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            await handleSyncTask(userId, companyId, {
              title: `Licencia conducción: ${workerName}`,
              description: `Vence el ${w.licenciaConduccionVencimiento}.`,
              dueDate,
              diffDays,
              type: 'driver_license',
              referenceId: `worker-${workerId}-licencia_conduccion`,
              referenceName: workerName,
            });
          }
        }

        // E. SST License Expiration (Direct expiration date)
        if (w.licenciaVencimiento) {
          const dueDate = parseDateString(w.licenciaVencimiento);
          if (dueDate) {
            const diffDays = Math.round((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            await handleSyncTask(userId, companyId, {
              title: `Licencia SST: ${workerName}`,
              description: `Vence el ${w.licenciaVencimiento}.`,
              dueDate,
              diffDays,
              type: 'driver_license',
              referenceId: `worker-${workerId}-licencia_sst`,
              referenceName: workerName,
            });
          }
        }
      }
    }

    // 2. Sync vehicle expirations
    const vehicles = await SgsstVehicleData.find({ user: userId, companyId }).lean();
    for (const veh of vehicles) {
      const vehName = `${veh.marca} ${veh.modelo} (${veh.placa})`;

      // A. SOAT
      if (veh.soatVencimiento) {
        const dueDate = parseDateString(veh.soatVencimiento);
        if (dueDate) {
          const diffDays = Math.round((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          await handleSyncTask(userId, companyId, {
            title: `SOAT Vehículo: ${veh.placa}`,
            description: `SOAT para vehículo ${vehName}. Vence el ${veh.soatVencimiento}.`,
            dueDate,
            diffDays,
            type: 'soat',
            referenceId: `vehicle-${veh._id}-soat`,
            referenceName: veh.placa,
          });
        }
      }

      // B. RTM
      if (veh.tecnomecanicaVencimiento) {
        const dueDate = parseDateString(veh.tecnomecanicaVencimiento);
        if (dueDate) {
          const diffDays = Math.round((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          await handleSyncTask(userId, companyId, {
            title: `RTM Vehículo: ${veh.placa}`,
            description: `Revisión Técnico-Mecánica para vehículo ${vehName}. Vence el ${veh.tecnomecanicaVencimiento}.`,
            dueDate,
            diffDays,
            type: 'rtm',
            referenceId: `vehicle-${veh._id}-rtm`,
            referenceName: veh.placa,
          });
        }
      }
    }

    // 3. Fetch and return all tasks for user and company
    const tasks = await KanbanTask.find({ user: userId, companyId }).sort({ dueDate: 1 });
    res.json(tasks);
  } catch (error) {
    logger.error('[SGSST Kanban] Load error:', error);
    res.status(500).json({ error: 'Error al cargar el tablero de tareas' });
  }
});

// Helper to handle synchronization of specific tasks
async function handleSyncTask(userId, companyId, taskData) {
  const { title, description, dueDate, diffDays, type, referenceId, referenceName } = taskData;

  // Find existing task for this reference
  let task = await KanbanTask.findOne({ user: userId, companyId, referenceId });

  // If document is renewed and expires in > 30 days
  if (diffDays > 30) {
    if (task && task.status !== 'done') {
      // Auto-delete pending task since it's no longer urgent / has been updated
      await KanbanTask.deleteOne({ _id: task._id });
    }
    return;
  }

  const calculatedStatus = diffDays < 0 ? 'overdue' : 'due_soon';

  if (!task) {
    // Create new task
    await KanbanTask.create({
      user: userId,
      companyId,
      title,
      description,
      dueDate,
      status: calculatedStatus,
      type,
      referenceId,
      referenceName,
    });
  } else {
    // If the expiration date has changed (new cycle), reopen task
    const taskDateStr = task.dueDate.toISOString().split('T')[0];
    const newDateStr = dueDate.toISOString().split('T')[0];

    if (taskDateStr !== newDateStr) {
      task.dueDate = dueDate;
      task.status = calculatedStatus;
      task.description = description;
      task.completedAt = undefined;
      await task.save();
    } else if (task.status !== 'done' && task.status !== calculatedStatus) {
      // Update status if it changed from due_soon to overdue
      task.status = calculatedStatus;
      await task.save();
    }
  }
}

// ─── POST /save — Crear o actualizar tarea ──────────────────────────────────
router.post('/save', requireJwtAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const companyId = await getActiveCompanyId(userId);
    if (!companyId) {
      return res.status(400).json({ error: 'No se encontró empresa activa' });
    }

    const { _id, title, description, dueDate, status, type } = req.body;

    if (_id) {
      // Update existing
      const updateData = { title, description, status, type };
      if (dueDate) {
        updateData.dueDate = new Date(dueDate);
      }
      if (status === 'done') {
        updateData.completedAt = new Date();
      } else {
        updateData.completedAt = null;
      }

      const task = await KanbanTask.findOneAndUpdate(
        { _id, user: userId, companyId },
        { $set: updateData },
        { new: true }
      );
      return res.json(task);
    } else {
      // Create new manual task
      if (!title || !dueDate) {
        return res.status(400).json({ error: 'Título y fecha de vencimiento son requeridos' });
      }

      const task = await KanbanTask.create({
        user: userId,
        companyId,
        title,
        description,
        dueDate: new Date(dueDate),
        status: status || 'todo',
        type: type || 'manual',
      });
      return res.json(task);
    }
  } catch (error) {
    logger.error('[SGSST Kanban] Save error:', error);
    res.status(500).json({ error: 'Error al guardar la tarea' });
  }
});

// ─── DELETE /delete/:id — Eliminar tarea ─────────────────────────────────────
router.delete('/delete/:id', requireJwtAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await KanbanTask.deleteOne({ _id: id, user: userId });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Tarea no encontrada o sin permisos' });
    }

    res.json({ success: true });
  } catch (error) {
    logger.error('[SGSST Kanban] Delete error:', error);
    res.status(500).json({ error: 'Error al eliminar la tarea' });
  }
});

module.exports = router;
