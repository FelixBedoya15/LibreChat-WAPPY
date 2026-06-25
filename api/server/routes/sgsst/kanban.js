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

if (!mongoose.models.ProgramaCapacitacionesData) {
  require('./programaCapacitaciones');
}
const ProgramaCapacitacionesData = mongoose.models.ProgramaCapacitacionesData;

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

    const activeBioTaskIds = [];

    // 1. Sync worker expirations & biocentric alerts
    const profile = await PerfilSociodemograficoData.findOne({ user: userId, companyId }).lean();
    if (profile && profile.trabajadores) {
      for (const w of profile.trabajadores) {
        const workerName = w.nombre || 'Trabajador';
        const workerId = w._id || w.id;
        const biocentricScore = w.biocentricScore !== undefined ? w.biocentricScore : 100;

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

        // F. Biocentric Health Alerts (If biocentricScore < 75) - Consolidated into ONE card per worker
        if (biocentricScore < 75 && w.biocentricAlerts && w.biocentricAlerts.length > 0) {
          const referenceId = `worker-${workerId}-biocentric`;
          activeBioTaskIds.push(referenceId);

          let task = await KanbanTask.findOne({ user: userId, companyId, referenceId });
          const alertsList = w.biocentricAlerts.join(', ');
          const title = `Auditoría Biocéntrica Crítica: ${workerName}`;
          const description = `El índice biocéntrico del trabajador es del ${biocentricScore}%, inferior al límite de 75%. Alertas activas: ${alertsList}. Requiere intervención y seguimiento médico.`;

          if (!task) {
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + 7);
            await KanbanTask.create({
              user: userId,
              companyId,
              title,
              description,
              dueDate,
              status: 'todo',
              type: 'other',
              referenceId,
              referenceName: workerName,
            });
          } else {
            // Update details if alerts changed
            if (task.description !== description || task.title !== title) {
              task.description = description;
              task.title = title;
              await task.save();
            }
          }
        }
      }
    }

    // Clean up active biocentric tasks that are resolved or in old format
    await KanbanTask.deleteMany({
      user: userId,
      companyId,
      status: { $ne: 'done' },
      referenceId: {
        $regex: /^worker-.*-(bio-|biocentric$)/,
        $nin: activeBioTaskIds
      }
    });

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

    // 3. Sync scheduled training sessions (ProgramaCapacitacionesData)
    const trainingData = await ProgramaCapacitacionesData.findOne({ user: userId, companyId }).lean();
    const activeTrainingIds = [];
    if (trainingData && trainingData.sesiones) {
      for (const ses of trainingData.sesiones) {
        if (ses.estado === 'Cancelada') continue;

        const sesDate = parseDateString(ses.fecha);
        if (sesDate) {
          const diffTime = sesDate.getTime() - today.getTime();
          const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

          let status = 'todo';
          if (ses.estado === 'Completada') {
            status = 'done';
          } else {
            if (diffDays < 0) {
              status = 'overdue';
            } else if (diffDays <= 7) {
              status = 'due_soon';
            }
          }

          const referenceId = `training_session-${ses.id}`;
          activeTrainingIds.push(referenceId);

          let task = await KanbanTask.findOne({ user: userId, companyId, referenceId });
          if (!task) {
            await KanbanTask.create({
              user: userId,
              companyId,
              title: `Capacitación: ${ses.tema}`,
              description: `Tema: ${ses.tema}. Responsable: ${ses.responsable || 'No asignado'}. Descripción: ${ses.descripcion || ''}.`,
              dueDate: sesDate,
              status,
              type: 'training',
              referenceId,
              referenceName: ses.responsable || 'Capacitación',
              completedAt: ses.estado === 'Completada' ? new Date() : undefined
            });
          } else {
            const taskDateStr = task.dueDate.toISOString().split('T')[0];
            const newDateStr = ses.fecha;

            let hasChanged = false;
            if (taskDateStr !== newDateStr) {
              task.dueDate = sesDate;
              hasChanged = true;
            }
            if (task.title !== `Capacitación: ${ses.tema}`) {
              task.title = `Capacitación: ${ses.tema}`;
              hasChanged = true;
            }
            if (task.status !== 'done' && task.status !== status) {
              task.status = status;
              hasChanged = true;
            }
            if (ses.estado === 'Completada' && task.status !== 'done') {
              task.status = 'done';
              task.completedAt = new Date();
              hasChanged = true;
            }

            if (hasChanged) {
              await task.save();
            }
          }
        }
      }
    }

    // Clean up active training session tasks that are deleted or canceled
    await KanbanTask.deleteMany({
      user: userId,
      companyId,
      status: { $ne: 'done' },
      referenceId: {
        $regex: /^training_session-/,
        $nin: activeTrainingIds
      }
    });

    // 4. Fetch and return all tasks for user and company
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

    const { _id, title, description, dueDate, status, type, renewalDate } = req.body;

    if (_id) {
      // Find task
      let task = await KanbanTask.findOne({ _id, user: userId, companyId });
      if (!task) {
        return res.status(404).json({ error: 'Actividad no encontrada' });
      }

      const updateData = { title, description, status, type };

      // If a renewal date is provided and this is a synchronized task with a referenceId
      if (renewalDate && task.referenceId) {
        const parts = task.referenceId.split('-');
        const refType = parts[0]; // 'worker' or 'vehicle'
        const refId = parts[1];
        const refField = parts[2]; // e.g. 'medical_exam', 'soat', etc.

        if (refType === 'worker') {
          const profile = await PerfilSociodemograficoData.findOne({ user: userId, companyId });
          if (profile && profile.trabajadores) {
            const worker = profile.trabajadores.find(t => String(t._id || t.id) === String(refId));
            if (worker) {
              // Map reference field to worker model fields
              let fieldName = '';
              if (refField === 'medical_exam') fieldName = 'fechaExamenMedico';
              else if (refField === 'heights_auth') fieldName = 'fechaCursoAlturasAutorizado';
              else if (refField === 'heights_coord') fieldName = 'fechaCursoAlturasCoordinador';
              else if (refField === 'licencia_conduccion') fieldName = 'licenciaConduccionVencimiento';
              else if (refField === 'licencia_sst') fieldName = 'licenciaVencimiento';

              if (fieldName) {
                worker[fieldName] = renewalDate;
                profile.markModified('trabajadores');
                await profile.save();

                // Recalculate next due date
                if (refField === 'medical_exam' || refField === 'heights_auth' || refField === 'heights_coord') {
                  const examDate = parseDateString(renewalDate);
                  if (examDate) {
                    updateData.dueDate = addDays(examDate, 365);
                  }
                } else {
                  updateData.dueDate = parseDateString(renewalDate);
                }

                // Complete the task card
                updateData.status = 'done';
                updateData.completedAt = new Date();
              } else if (refField === 'bio' || refField === 'biocentric') {
                // Biocentric alert task closed
                updateData.status = 'done';
                updateData.completedAt = new Date();
                updateData.dueDate = parseDateString(renewalDate) || new Date();
              }
            }
          }
        } else if (refType === 'vehicle') {
          const vehicle = await SgsstVehicleData.findOne({ _id: refId, user: userId, companyId });
          if (vehicle) {
            if (refField === 'soat') {
              vehicle.soatVencimiento = renewalDate;
            } else if (refField === 'rtm') {
              vehicle.tecnomecanicaVencimiento = renewalDate;
            }
            await vehicle.save();

            // Set due date directly to the new vehicle doc expiration date
            updateData.dueDate = parseDateString(renewalDate);

            // Complete the task card
            updateData.status = 'done';
            updateData.completedAt = new Date();
          }
        } else if (parts[0] === 'training' && parts[1] === 'session') {
          const sessionId = parts[2];
          const trainingData = await ProgramaCapacitacionesData.findOne({ user: userId, companyId });
          if (trainingData && trainingData.sesiones) {
            const session = trainingData.sesiones.find(s => s.id === sessionId);
            if (session) {
              session.estado = 'Completada';
              if (renewalDate) {
                session.fecha = renewalDate;
              }
              trainingData.markModified('sesiones');
              await trainingData.save();

              // Complete task in Kanban
              updateData.status = 'done';
              updateData.completedAt = new Date();
              if (renewalDate) {
                updateData.dueDate = parseDateString(renewalDate);
              }
            }
          }
        }
      } else {
        if (dueDate) {
          updateData.dueDate = new Date(dueDate);
        }
        if (status === 'done') {
          updateData.completedAt = new Date();
        } else if (status) {
          updateData.completedAt = null;
        }
      }

      const updatedTask = await KanbanTask.findOneAndUpdate(
        { _id, user: userId, companyId },
        { $set: updateData },
        { new: true }
      );
      return res.json(updatedTask);
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
