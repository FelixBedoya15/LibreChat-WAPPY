const express = require('express');
const requireJwtAuth = require('../../middleware/requireJwtAuth');
const mongoose = require('mongoose');
const KanbanTask = require('../../../models/KanbanTask');
const CompanyInfo = require('../../../models/CompanyInfo');
const SgsstVehicleData = require('../../../models/SgsstVehicleData');
const { logger } = require('~/config');
const { generateWithKeyRotation } = require('./sgsstGemini');
const mammoth = require('mammoth');
const pdf = require('pdf-parse');
const XLSX = require('xlsx');

// Load dynamic models
if (!mongoose.models.PerfilSociodemograficoData) {
  require('./perfilSociodemografico');
}
const PerfilSociodemograficoData = mongoose.models.PerfilSociodemograficoData;

if (!mongoose.models.ProgramaCapacitacionesData) {
  require('./programaCapacitaciones');
}
const ProgramaCapacitacionesData = mongoose.models.ProgramaCapacitacionesData;

if (!mongoose.models.AltaDireccionData) {
  require('./altaDireccion');
}
const AltaDireccionData = mongoose.models.AltaDireccionData;

if (!mongoose.models.ReporteActosData) {
  require('./reporteActos');
}
const ReporteActosData = mongoose.models.ReporteActosData;

const AuditoriaData = require('../../../models/AuditoriaData');
const DiagnosticoData = require('../../../models/DiagnosticoData');
const GTC45WorkspaceSession = require('../../../models/GTC45WorkspaceSession');

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

// Cache to throttle heavy background ETL synchronizations (60 seconds per company)
const lastSyncByCompany = new Map();
const SYNC_THROTTLE_MS = 60 * 1000;

// ─── GET /data — Obtener y sincronizar tareas ───────────────────────────────
router.get('/data', requireJwtAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const companyId = await getActiveCompanyId(userId);
    if (!companyId) {
      return res.status(400).json({ error: 'No se encontró empresa activa' });
    }

    const companyKey = companyId.toString();
    const forceSync = req.query.force === 'true' || req.query.sync === 'true';
    const now = Date.now();
    const lastSync = lastSyncByCompany.get(companyKey) || 0;

    // Fast path: If synced within last 60 seconds and not forced, return cached DB state immediately (< 10ms)
    if (!forceSync && (now - lastSync < SYNC_THROTTLE_MS)) {
      const cachedTasks = await KanbanTask.find({
        user: userId,
        companyId,
        status: { $ne: 'dismissed' },
      }).lean().sort({ dueDate: 1 });
      return res.json(cachedTasks);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activeBioTaskIds = [];
    const activeTrainingIds = [];
    const activeIpevarRefs = new Set();
    const bulkOps = [];
    const tasksToDelete = [];

    // Parallel fetch of all source documents and current Kanban tasks
    const gtcDocPromise = GTC45WorkspaceSession ? (
      companyId
        ? GTC45WorkspaceSession.findOne({
            companyId,
            $or: [{ isOfficial: true }, { conversationId: `official-${companyId}` }],
          }).lean().then(async (doc) => {
            if (doc) return doc;
            return GTC45WorkspaceSession.findOne({
              companyId,
              'matrixRows.0': { $exists: true },
            }).sort({ updatedAt: -1 }).lean();
          })
        : GTC45WorkspaceSession.findOne({
            user: userId,
            $or: [{ companyId: null }, { companyId: { $exists: false } }],
            isOfficial: true,
          }).lean().then(async (doc) => {
            if (doc) return doc;
            return GTC45WorkspaceSession.findOne({
              user: userId,
              $or: [{ companyId: null }, { companyId: { $exists: false } }],
              'matrixRows.0': { $exists: true },
            }).sort({ updatedAt: -1 }).lean();
          })
    ) : Promise.resolve(null);

    const [
      profile,
      vehicles,
      trainingData,
      auditData,
      diagData,
      altaDirDoc,
      actosDoc,
      gtcDoc,
      existingTasks
    ] = await Promise.all([
      PerfilSociodemograficoData ? PerfilSociodemograficoData.findOne({ user: userId, companyId }).lean() : Promise.resolve(null),
      SgsstVehicleData ? SgsstVehicleData.find({ user: userId, companyId }).lean() : Promise.resolve([]),
      ProgramaCapacitacionesData ? ProgramaCapacitacionesData.findOne({ user: userId, companyId }).lean() : Promise.resolve(null),
      AuditoriaData ? AuditoriaData.findOne({ user: userId, companyId }).lean() : Promise.resolve(null),
      DiagnosticoData ? DiagnosticoData.findOne({ user: userId, companyId }).lean() : Promise.resolve(null),
      AltaDireccionData ? AltaDireccionData.findOne({ user: userId, companyId }).lean() : Promise.resolve(null),
      ReporteActosData ? ReporteActosData.findOne({ user: userId, companyId }).lean() : Promise.resolve(null),
      gtcDocPromise,
      KanbanTask.find({ user: userId, companyId }).lean(),
    ]);

    const taskMap = new Map();
    for (const t of (existingTasks || [])) {
      if (t.referenceId) {
        taskMap.set(t.referenceId, t);
      }
    }

    // In-memory sync helper for expiration-based tasks
    const processSyncTask = (taskData) => {
      const { title, description, dueDate, diffDays, type, referenceId, referenceName } = taskData;
      const task = taskMap.get(referenceId);

      // If document is renewed and expires in > 30 days
      if (diffDays > 30) {
        if (task && task.status !== 'done') {
          tasksToDelete.push(task._id);
          taskMap.delete(referenceId);
        }
        return;
      }

      const calculatedStatus = diffDays < 0 ? 'overdue' : 'due_soon';

      if (!task) {
        bulkOps.push({
          insertOne: {
            document: {
              user: userId,
              companyId,
              title,
              description,
              dueDate,
              status: calculatedStatus,
              type,
              referenceId,
              referenceName,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          },
        });
        taskMap.set(referenceId, { referenceId, status: calculatedStatus, dueDate, title, description });
      } else {
        const taskDueDate = task.dueDate ? new Date(task.dueDate) : null;
        const taskDateStr = taskDueDate && !isNaN(taskDueDate.getTime()) ? taskDueDate.toISOString().split('T')[0] : '';
        const newDateStr = dueDate && !isNaN(dueDate.getTime()) ? dueDate.toISOString().split('T')[0] : '';

        if (taskDateStr !== newDateStr) {
          bulkOps.push({
            updateOne: {
              filter: { _id: task._id },
              update: {
                $set: {
                  dueDate,
                  status: calculatedStatus,
                  description,
                  title,
                  updatedAt: new Date(),
                },
                $unset: { completedAt: 1 },
              },
            },
          });
          task.dueDate = dueDate;
          task.status = calculatedStatus;
        } else if (task.status !== 'done' && task.status !== calculatedStatus) {
          bulkOps.push({
            updateOne: {
              filter: { _id: task._id },
              update: {
                $set: {
                  status: calculatedStatus,
                  updatedAt: new Date(),
                },
              },
            },
          });
          task.status = calculatedStatus;
        }
      }
    };

    // 1. Sync worker expirations & biocentric alerts
    if (profile && Array.isArray(profile.trabajadores)) {
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
            processSyncTask({
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
            processSyncTask({
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
            processSyncTask({
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
            processSyncTask({
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
            processSyncTask({
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

          const task = taskMap.get(referenceId);
          const alertsList = w.biocentricAlerts.join(', ');
          const title = `Auditoría Biocéntrica Crítica: ${workerName}`;
          const description = `El índice biocéntrico del trabajador es del ${biocentricScore}%, inferior al límite de 75%. Alertas activas: ${alertsList}. Requiere intervención y seguimiento médico.`;

          if (!task) {
            const dueDate = addDays(today, 7);
            bulkOps.push({
              insertOne: {
                document: {
                  user: userId,
                  companyId,
                  title,
                  description,
                  dueDate,
                  status: 'todo',
                  type: 'other',
                  referenceId,
                  referenceName: workerName,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                },
              },
            });
            taskMap.set(referenceId, { referenceId, status: 'todo', dueDate, title, description });
          } else {
            if (task.description !== description || task.title !== title) {
              bulkOps.push({
                updateOne: {
                  filter: { _id: task._id },
                  update: {
                    $set: { description, title, updatedAt: new Date() },
                  },
                },
              });
              task.description = description;
              task.title = title;
            }
          }
        }
      }
    }

    // Clean up active biocentric tasks that are resolved or in old format (in memory)
    const bioRegex = /^worker-.*-(bio-|biocentric$)/;
    for (const t of (existingTasks || [])) {
      if (t.status !== 'done' && t.referenceId && bioRegex.test(t.referenceId) && !activeBioTaskIds.includes(t.referenceId)) {
        tasksToDelete.push(t._id);
        taskMap.delete(t.referenceId);
      }
    }

    // 2. Sync vehicle expirations
    if (Array.isArray(vehicles)) {
      for (const veh of vehicles) {
        const vehName = `${veh.marca || ''} ${veh.modelo || ''} (${veh.placa || ''})`.trim();

        // A. SOAT
        if (veh.soatVencimiento) {
          const dueDate = parseDateString(veh.soatVencimiento);
          if (dueDate) {
            const diffDays = Math.round((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            processSyncTask({
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
            processSyncTask({
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
    }

    // 3. Sync scheduled training sessions (ProgramaCapacitacionesData)
    if (trainingData && Array.isArray(trainingData.sesiones)) {
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

          const task = taskMap.get(referenceId);
          const title = `Capacitación: ${ses.tema}`;
          const description = `Tema: ${ses.tema}. Responsable: ${ses.responsable || 'No asignado'}. Descripción: ${ses.descripcion || ''}.`;

          if (!task) {
            bulkOps.push({
              insertOne: {
                document: {
                  user: userId,
                  companyId,
                  title,
                  description,
                  dueDate: sesDate,
                  status,
                  type: 'training',
                  referenceId,
                  referenceName: ses.responsable || 'Capacitación',
                  completedAt: ses.estado === 'Completada' ? new Date() : undefined,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                },
              },
            });
            taskMap.set(referenceId, { referenceId, status, dueDate: sesDate, title, description });
          } else {
            const taskDueDate = task.dueDate ? new Date(task.dueDate) : null;
            const taskDateStr = taskDueDate && !isNaN(taskDueDate.getTime()) ? taskDueDate.toISOString().split('T')[0] : '';
            const newDateStr = ses.fecha;

            const updateSet = {};
            if (taskDateStr !== newDateStr) {
              updateSet.dueDate = sesDate;
            }
            if (task.title !== title) {
              updateSet.title = title;
            }
            if (task.status !== 'done' && task.status !== status) {
              updateSet.status = status;
            }
            if (ses.estado === 'Completada' && task.status !== 'done') {
              updateSet.status = 'done';
              updateSet.completedAt = new Date();
            }

            if (Object.keys(updateSet).length > 0) {
              updateSet.updatedAt = new Date();
              bulkOps.push({
                updateOne: {
                  filter: { _id: task._id },
                  update: { $set: updateSet },
                },
              });
              Object.assign(task, updateSet);
            }
          }
        }
      }
    }

    // Clean up active training session tasks that are deleted or canceled (in memory)
    for (const t of (existingTasks || [])) {
      if (t.status !== 'done' && t.referenceId && t.referenceId.startsWith('training_session-') && !activeTrainingIds.includes(t.referenceId)) {
        tasksToDelete.push(t._id);
        taskMap.delete(t.referenceId);
      }
    }

    // 4. Sync Auditoría SG-SST findings (no_cumple & parcial)
    if (auditData && Array.isArray(auditData.statusData)) {
      for (const item of auditData.statusData) {
        if (item.status === 'no_cumple' || item.status === 'parcial') {
          const isNoCumple = item.status === 'no_cumple';
          const code = item.code || item.itemId || '';
          const name = item.name || 'Requisito de Auditoría';
          const referenceId = `audit-${item.itemId || item.id}`;
          const referenceName = `Auditoría SG-SST (${code})`;
          const dueDate = addDays(today, isNoCumple ? 30 : 45);

          const title = `[Auditoría SG-SST] ${code ? code + ' - ' : ''}${name}`;
          const description = isNoCumple
            ? `No Conformidad identificada en Auditoría Interna: ${name}. ${item.description || ''}. Criterio: ${item.criteria || 'Dec. 1072 / Res. 0312'}. ${item.observation ? 'Hallazgo específico: ' + item.observation : 'Requiere formulación de plan de acción correctivo inmediato.'}`
            : `Oportunidad de Mejora identificada en Auditoría Interna: ${name}. ${item.description || ''}. ${item.observation ? 'Observación: ' + item.observation : 'Requiere plan de acción preventivo.'}`;

          const task = taskMap.get(referenceId);
          if (!task) {
            bulkOps.push({
              insertOne: {
                document: {
                  user: userId,
                  companyId,
                  title,
                  description,
                  dueDate,
                  status: 'todo',
                  type: 'audit_finding',
                  priority: isNoCumple ? 'alta' : 'media',
                  actionType: isNoCumple ? 'correctiva' : 'mejora',
                  sourceModule: 'auditoria',
                  referenceId,
                  referenceName,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                },
              },
            });
            taskMap.set(referenceId, { referenceId, status: 'todo', dueDate, title, description, priority: isNoCumple ? 'alta' : 'media', actionType: isNoCumple ? 'correctiva' : 'mejora' });
          } else if (task.status !== 'done' && task.status !== 'dismissed') {
            const updateSet = {};
            if (task.title !== title) updateSet.title = title;
            if (task.description !== description) updateSet.description = description;
            const newPriority = isNoCumple ? 'alta' : 'media';
            const newActionType = isNoCumple ? 'correctiva' : 'mejora';
            if (task.priority !== newPriority) updateSet.priority = newPriority;
            if (task.actionType !== newActionType) updateSet.actionType = newActionType;

            if (Object.keys(updateSet).length > 0) {
              updateSet.updatedAt = new Date();
              bulkOps.push({
                updateOne: {
                  filter: { _id: task._id },
                  update: { $set: updateSet },
                },
              });
              Object.assign(task, updateSet);
            }
          }
        }
      }
    }

    // 5. Sync Diagnóstico Inicial findings (no_cumple & parcial)
    if (diagData && Array.isArray(diagData.statusData)) {
      for (const item of diagData.statusData) {
        if (item.status === 'no_cumple' || item.status === 'parcial') {
          const isNoCumple = item.status === 'no_cumple';
          const code = item.code || item.itemId || '';
          const name = item.name || 'Estándar Mínimo';
          const referenceId = `diag-${item.itemId || item.id}`;
          const referenceName = `Diagnóstico Inicial (${code})`;
          const dueDate = addDays(today, isNoCumple ? 30 : 45);

          const title = `[Diagnóstico Inicial] ${code ? code + ' - ' : ''}${name}`;
          const description = isNoCumple
            ? `Estándar Mínimo No Cumplido según Diagnóstico Inicial. Criterio: ${name}. ${item.description || ''}. ${item.observation ? 'Observación: ' + item.observation : 'Requiere plan de mejoramiento para cumplimiento legal.'}`
            : `Estándar con Cumplimiento Parcial según Diagnóstico Inicial. ${name}. ${item.observation ? 'Observación: ' + item.observation : 'Requiere subsanación para alcanzar conformidad total.'}`;

          const task = taskMap.get(referenceId);
          if (!task) {
            bulkOps.push({
              insertOne: {
                document: {
                  user: userId,
                  companyId,
                  title,
                  description,
                  dueDate,
                  status: 'todo',
                  type: 'diagnostico_finding',
                  priority: isNoCumple ? 'alta' : 'media',
                  actionType: isNoCumple ? 'correctiva' : 'mejora',
                  sourceModule: 'diagnostico',
                  referenceId,
                  referenceName,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                },
              },
            });
            taskMap.set(referenceId, { referenceId, status: 'todo', dueDate, title, description, priority: isNoCumple ? 'alta' : 'media', actionType: isNoCumple ? 'correctiva' : 'mejora' });
          } else if (task.status !== 'done' && task.status !== 'dismissed') {
            const updateSet = {};
            if (task.title !== title) updateSet.title = title;
            if (task.description !== description) updateSet.description = description;
            const newPriority = isNoCumple ? 'alta' : 'media';
            const newActionType = isNoCumple ? 'correctiva' : 'mejora';
            if (task.priority !== newPriority) updateSet.priority = newPriority;
            if (task.actionType !== newActionType) updateSet.actionType = newActionType;

            if (Object.keys(updateSet).length > 0) {
              updateSet.updatedAt = new Date();
              bulkOps.push({
                updateOne: {
                  filter: { _id: task._id },
                  update: { $set: updateSet },
                },
              });
              Object.assign(task, updateSet);
            }
          }
        }
      }
    }

    // 6. Sync Alta Dirección requirements
    if (altaDirDoc && Array.isArray(altaDirDoc.statusData)) {
      for (const item of altaDirDoc.statusData) {
        if (item.status === 'no_cumple' || item.status === 'parcial') {
          const isNoCumple = item.status === 'no_cumple';
          const itemId = item.itemId || 'Item';
          const referenceId = `altadireccion-${itemId}`;
          const referenceName = `Alta Dirección (Punto ${itemId})`;
          const dueDate = addDays(today, isNoCumple ? 20 : 35);

          const title = `[Alta Dirección] Revisión Gerencial Punto ${itemId}`;
          const description = `Compromiso / No conformidad de Revisión por la Alta Dirección: ${item.observation || item.itemText || 'Requiere intervención gerencial y asignación de recursos.'}`;

          const task = taskMap.get(referenceId);
          if (!task) {
            bulkOps.push({
              insertOne: {
                document: {
                  user: userId,
                  companyId,
                  title,
                  description,
                  dueDate,
                  status: 'todo',
                  type: 'alta_direccion_finding',
                  priority: isNoCumple ? 'alta' : 'media',
                  actionType: isNoCumple ? 'correctiva' : 'mejora',
                  sourceModule: 'alta_direccion',
                  referenceId,
                  referenceName,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                },
              },
            });
            taskMap.set(referenceId, { referenceId, status: 'todo', dueDate, title, description, priority: isNoCumple ? 'alta' : 'media', actionType: isNoCumple ? 'correctiva' : 'mejora' });
          } else if (task.status !== 'done' && task.status !== 'dismissed') {
            const updateSet = {};
            if (task.description !== description) updateSet.description = description;
            if (task.title !== title) updateSet.title = title;
            const newPriority = isNoCumple ? 'alta' : 'media';
            const newActionType = isNoCumple ? 'correctiva' : 'mejora';
            if (task.priority !== newPriority) updateSet.priority = newPriority;
            if (task.actionType !== newActionType) updateSet.actionType = newActionType;

            if (Object.keys(updateSet).length > 0) {
              updateSet.updatedAt = new Date();
              bulkOps.push({
                updateOne: {
                  filter: { _id: task._id },
                  update: { $set: updateSet },
                },
              });
              Object.assign(task, updateSet);
            }
          }
        }
      }
    }

    // 7. Sync Actos y Condiciones Inseguras (Purge phantom tasks in memory)
    for (const t of (existingTasks || [])) {
      if (
        t.title === '[Acto Inseguro] Peligro en terreno' ||
        t.title === '[Condición Insegura] Peligro en terreno' ||
        /Detalle:\s*\.?\s*$/i.test(t.description || '')
      ) {
        tasksToDelete.push(t._id);
        if (t.referenceId) taskMap.delete(t.referenceId);
      }
    }

    if (actosDoc && Array.isArray(actosDoc.inboxPublico)) {
      for (const rep of actosDoc.inboxPublico) {
        const desc = (rep.descripcion || '').trim();
        // STRICT FILTER: Do not sync empty, test, or placeholder reports
        if (!desc || desc.length < 5) continue;
        if (rep.estado === 'cerrado' || rep.status === 'processed' || rep.status === 'dismissed' || rep.descartado) continue;

        const isCondicion = rep.tipo === 'condicion';
        const referenceId = `acto-${rep.id}`;
        const referenceName = isCondicion ? 'Condición Insegura' : 'Acto Inseguro';
        const dueDate = addDays(today, 7);

        const title = `[${isCondicion ? 'Condición Insegura' : 'Acto Inseguro'}] ${desc.slice(0, 60)}`;
        const description = `Reporte de seguridad en terreno. Tipo: ${isCondicion ? 'Condición Insegura' : 'Acto Inseguro'}. Ubicación: ${rep.ubicacion || 'En frentes operativos'}. Fecha reporte: ${rep.fecha || 'Reciente'}. Detalle: ${desc}.`;

        const task = taskMap.get(referenceId);
        if (!task) {
          bulkOps.push({
            insertOne: {
              document: {
                user: userId,
                companyId,
                title,
                description,
                dueDate,
                status: 'todo',
                type: 'unsafe_act_finding',
                priority: 'alta',
                actionType: 'correctiva',
                sourceModule: 'reporte_actos',
                referenceId,
                referenceName,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            },
          });
          taskMap.set(referenceId, { referenceId, status: 'todo', dueDate, title, description, priority: 'alta', actionType: 'correctiva' });
        } else if (task.status !== 'done' && task.status !== 'dismissed') {
          const updateSet = {};
          if (task.description !== description) updateSet.description = description;
          if (task.title !== title) updateSet.title = title;

          if (Object.keys(updateSet).length > 0) {
            updateSet.updatedAt = new Date();
            bulkOps.push({
              updateOne: {
                filter: { _id: task._id },
                update: { $set: updateSet },
              },
            });
            Object.assign(task, updateSet);
          }
        }
      }
    }

    // 8. Sync Controles Propuestos y Peligros IPEVAR GTC-45 (Mejor Costo/Beneficio - Anexo E)
    if (gtcDoc && Array.isArray(gtcDoc.matrixRows)) {
      const cleanControlText = (val) => {
        if (!val || typeof val !== 'string') return '';
        const trimmed = val.trim();
        const lower = trimmed.toLowerCase();
        if (['ninguno', 'ninguna', 'no aplica', 'n/a', 'na', 'ninguno.', 'no'].includes(lower)) return '';
        return trimmed;
      };

      for (let i = 0; i < gtcDoc.matrixRows.length; i++) {
        const row = gtcDoc.matrixRows[i];
        const rowId = row.id || `row-${i}`;

        // Extraer controles propuestos
        const controls = [];
        const elim = cleanControlText(row.medida_eliminacion);
        if (elim) controls.push({ category: 'Eliminación', text: elim, hierarchy: 1, actionType: 'correctiva' });

        const sust = cleanControlText(row.medida_sustitucion);
        if (sust) controls.push({ category: 'Sustitución', text: sust, hierarchy: 2, actionType: 'correctiva' });

        const ing = cleanControlText(row.medida_ingenieria);
        if (ing) controls.push({ category: 'Ingeniería', text: ing, hierarchy: 3, actionType: 'correctiva' });

        const adm = cleanControlText(row.medida_administrativa);
        if (adm) controls.push({ category: 'Administrativo', text: adm, hierarchy: 4, actionType: 'preventiva' });

        const epp = cleanControlText(row.medida_eppu);
        if (epp) controls.push({ category: 'EPP', text: epp, hierarchy: 5, actionType: 'preventiva' });

        const isCritical = (row.nd >= 6 && row.nc >= 25) || (row.nr >= 500) ||
          (typeof row.aceptabilidad === 'string' && (row.aceptabilidad.includes('I') || row.aceptabilidad.toLowerCase().includes('no aceptable')));
        const isHigh = (row.nr >= 150) || (typeof row.interpretacion_nr === 'string' && row.interpretacion_nr === 'II');

        // Sincronizar si tiene controles propuestos o si es riesgo crítico/alto
        if (controls.length > 0 || isCritical || isHigh) {
          let bestControl = controls.find((c) => c.category === 'Ingeniería')
            || controls.find((c) => c.category === 'Sustitución')
            || controls.find((c) => c.category === 'Eliminación')
            || controls.find((c) => c.category === 'Administrativo')
            || controls.find((c) => c.category === 'EPP');

          if (!bestControl) {
            bestControl = {
              category: 'Intervención Crítica',
              text: 'Diseñar e implementar controles de mitigación inmediata en la fuente o medio',
              actionType: 'correctiva',
            };
          }

          const otherControls = controls.filter((c) => c !== bestControl);

          let anexoE = '';
          if (row.factores_reduccion && typeof row.factores_reduccion === 'string' && !row.factores_reduccion.toLowerCase().includes('no aplica')) {
            anexoE = row.factores_reduccion.trim();
          } else {
            anexoE = `Control prioritario por relación costo-beneficio según Anexo E (GTC-45): Se prioriza la medida de ${bestControl.category} ('${bestControl.text.replace(/^[*•-]\s*/, '')}') al atacar directamente el origen del peligro (${row.peligro_clasificacion || 'evaluado'}) con protección colectiva y continua para ${row.cargo || 'el personal expuesto'}. Esta intervención mitiga la severidad potencial (${row.peor_consecuencia || 'daño a la salud laboral'}) con el mayor retorno de inversión frente al costo directo e indirecto de incapacidades o contingencias legales.`;
          }

          const dueDate = isCritical ? addDays(today, 15) : isHigh ? addDays(today, 30) : addDays(today, 60);
          const priority = (isCritical || isHigh) ? 'alta' : 'media';
          const actionType = bestControl.actionType || 'correctiva';

          const cleanText = bestControl.text.replace(/^[*•-]\s*/, '').trim();
          const title = `[Control Propuesto · ${bestControl.category}] ${cleanText.length > 70 ? cleanText.substring(0, 67) + '…' : cleanText}`;

          const description = `Control propuesto con mejor relación costo-beneficio según Factores de Reducción (Anexo E GTC-45).
• Proceso: ${row.proceso || 'Operativo'} | Zona/Lugar: ${row.zona || 'Área general'}
• Peligro: ${row.peligro_clasificacion || 'Peligro'} - ${row.peligro_descripcion || 'No especificado'}
• Nivel de Riesgo: ${row.interpretacion_nr ? `Nivel ${row.interpretacion_nr}` : 'Evaluado'} (NR: ${row.nr || 'N/A'}) - ${row.aceptabilidad || ''}
• Cargo Expuesto: ${row.cargo || 'Personal'} (Expuestos: ${row.nro_expuestos || 1})
• Control Óptimo (Costo/Beneficio): [${bestControl.category}] ${bestControl.text}
${otherControls.length > 0 ? `• Controles Complementarios: ${otherControls.map((c) => `[${c.category}] ${c.text}`).join(' | ')}\n` : ''}• Factores de Reducción (Anexo E): ${anexoE}`;

          const referenceId = `ipevar-control-${rowId}`;
          const referenceName = `Matriz IPEVAR (${row.peligro_clasificacion || 'GTC-45'})`;

          activeIpevarRefs.add(referenceId);
          activeIpevarRefs.add(`ipevar-${rowId}`);

          const task = taskMap.get(referenceId) || taskMap.get(`ipevar-${rowId}`);

          if (!task) {
            bulkOps.push({
              insertOne: {
                document: {
                  user: userId,
                  companyId,
                  title,
                  description,
                  dueDate,
                  status: 'todo',
                  type: 'ipevar_finding',
                  priority,
                  actionType,
                  assignedTo: row.cargo || 'Coordinador SST',
                  sourceModule: 'matriz_ipevar',
                  referenceId,
                  referenceName,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                },
              },
            });
            taskMap.set(referenceId, { referenceId, status: 'todo', dueDate, title, description, priority, actionType });
          } else if (task.status !== 'done' && task.status !== 'dismissed') {
            const updateSet = {};
            if (task.referenceId !== referenceId) updateSet.referenceId = referenceId;
            if (task.title !== title) updateSet.title = title;
            if (task.description !== description) updateSet.description = description;
            if (task.priority !== priority) updateSet.priority = priority;
            if (task.actionType !== actionType) updateSet.actionType = actionType;

            if (Object.keys(updateSet).length > 0) {
              updateSet.updatedAt = new Date();
              bulkOps.push({
                updateOne: {
                  filter: { _id: task._id },
                  update: { $set: updateSet },
                },
              });
              Object.assign(task, updateSet);
            }
          }
        }
      }

      if (activeIpevarRefs.size > 0) {
        for (const t of (existingTasks || [])) {
          if (t.sourceModule === 'matriz_ipevar' && ['todo', 'due_soon'].includes(t.status) && t.referenceId && !activeIpevarRefs.has(t.referenceId)) {
            tasksToDelete.push(t._id);
            taskMap.delete(t.referenceId);
          }
        }
      }
    }

    // Single batch deletion for cleaned/orphaned tasks
    if (tasksToDelete.length > 0) {
      const uniqueIds = Array.from(new Set(tasksToDelete.map((id) => id.toString())));
      await KanbanTask.deleteMany({ _id: { $in: uniqueIds } });
    }

    // Single bulk write for all inserts & updates
    if (bulkOps.length > 0) {
      await KanbanTask.bulkWrite(bulkOps, { ordered: false });
    }

    // Update throttle timestamp
    lastSyncByCompany.set(companyKey, Date.now());

    // 9. Fetch and return all active tasks for user and company (exclude dismissed)
    const tasks = await KanbanTask.find({ user: userId, companyId, status: { $ne: 'dismissed' } }).lean().sort({ dueDate: 1 });
    res.json(tasks);
  } catch (error) {
    logger.error('[SGSST Kanban] Load error:', error);
    // Defensive fallback: Try to return existing tasks so the UI never hangs
    try {
      const userId = req.user?.id;
      const companyId = await getActiveCompanyId(userId);
      if (userId && companyId) {
        const fallbackTasks = await KanbanTask.find({ user: userId, companyId, status: { $ne: 'dismissed' } }).lean().sort({ dueDate: 1 });
        return res.json(fallbackTasks);
      }
    } catch (fallbackErr) {
      logger.error('[SGSST Kanban] Fallback load error:', fallbackErr);
    }
    res.status(500).json({ error: 'Error al cargar el tablero de tareas' });
  }
});

// ─── POST /dispatch-actions — Recibir y consolidar acciones de cualquier aplicativo ──
router.post('/dispatch-actions', requireJwtAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const companyId = await getActiveCompanyId(userId);
    if (!companyId) {
      return res.status(400).json({ error: 'No se encontró empresa activa' });
    }

    const { actions, sourceModule } = req.body;
    if (!Array.isArray(actions) || actions.length === 0) {
      return res.status(400).json({ error: 'La lista de acciones es requerida' });
    }

    const createdTasks = [];
    const today = new Date();

    for (const act of actions) {
      if (!act.title) continue;
      const refId = act.referenceId || `${sourceModule || 'app'}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      let dueDate = act.dueDate ? new Date(act.dueDate) : addDays(today, 30);
      if (isNaN(dueDate.getTime())) dueDate = addDays(today, 30);

      let task = await KanbanTask.findOne({ user: userId, companyId, referenceId: refId });
      if (!task) {
        task = await KanbanTask.create({
          user: userId,
          companyId,
          title: act.title,
          description: act.description || '',
          dueDate,
          status: act.status || 'todo',
          type: act.type || `${sourceModule || 'manual'}_finding`,
          priority: act.priority || 'media',
          actionType: act.actionType || 'correctiva',
          assignedTo: act.assignedTo || act.responsible || '',
          sourceModule: sourceModule || act.sourceModule || 'general',
          referenceId: refId,
          referenceName: act.referenceName || sourceModule || 'Plan de Acción ACPM',
        });
      } else {
        task.title = act.title;
        task.description = act.description || task.description;
        task.dueDate = dueDate;
        task.priority = act.priority || task.priority;
        task.actionType = act.actionType || task.actionType;
        if (act.assignedTo || act.responsible) {
          task.assignedTo = act.assignedTo || act.responsible;
        }
        await task.save();
      }
      createdTasks.push(task);
    }

    lastSyncByCompany.delete(companyId.toString());

    res.json({
      success: true,
      count: createdTasks.length,
      tasks: createdTasks,
    });
  } catch (error) {
    logger.error('[SGSST Kanban] Error dispatching actions:', error);
    res.status(500).json({ error: 'Error al despachar acciones al Centro de Control' });
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

    const { _id, title, description, dueDate, status, type, renewalDate, startTime, endTime, allDay, emailAttendees, location } = req.body;

    if (_id) {
      // Find task
      let task = await KanbanTask.findOne({ _id, user: userId, companyId });
      if (!task) {
        return res.status(404).json({ error: 'Actividad no encontrada' });
      }

      const updateData = { title, description, status, type };
      if (startTime !== undefined) updateData.startTime = startTime;
      if (endTime !== undefined) updateData.endTime = endTime;
      if (allDay !== undefined) updateData.allDay = allDay;
      if (emailAttendees !== undefined) updateData.emailAttendees = Array.isArray(emailAttendees) ? emailAttendees : (typeof emailAttendees === 'string' ? emailAttendees.split(',').map(s => s.trim()).filter(Boolean) : []);
      if (location !== undefined) updateData.location = location;

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

      if (req.body.priority) updateData.priority = req.body.priority;
      if (req.body.actionType) updateData.actionType = req.body.actionType;
      if (req.body.assignedTo !== undefined) updateData.assignedTo = req.body.assignedTo;

      const updatedTask = await KanbanTask.findOneAndUpdate(
        { _id, user: userId, companyId },
        { $set: updateData },
        { new: true }
      );

      // Sincronización bidireccional hacia actas de COPASST y Convivencia
      try {
        if (updatedTask && (updatedTask.type === 'copasst_finding' || updatedTask.type === 'convivencia_finding')) {
          const isDone = updatedTask.status === 'done';
          const newStatus = isDone ? 'cumplido' : 'pendiente';

          if (updatedTask.type === 'copasst_finding' && updatedTask.referenceId) {
            const parts = updatedTask.referenceId.split('_');
            if (parts.length >= 3) {
              const actaId = parts[1];
              const compIndex = parseInt(parts[2], 10);
              const { SgsstCopasstActa } = require('../../../models/SgsstCopasst');
              const acta = await SgsstCopasstActa.findById(actaId);
              if (acta && Array.isArray(acta.compromisos) && acta.compromisos[compIndex]) {
                acta.compromisos[compIndex].estado = newStatus;
                await acta.save();
              }
            }
          } else if (updatedTask.type === 'convivencia_finding' && updatedTask.referenceId) {
            const parts = updatedTask.referenceId.split('_');
            if (parts.length >= 3) {
              const actaId = parts[1];
              const compIndex = parseInt(parts[2], 10);
              const { SgsstConvivenciaActa } = require('../../../models/SgsstConvivencia');
              const acta = await SgsstConvivenciaActa.findById(actaId);
              if (acta && Array.isArray(acta.compromisos) && acta.compromisos[compIndex]) {
                acta.compromisos[compIndex].estado = newStatus;
                await acta.save();
              }
            }
          }
        }
      } catch (syncBackErr) {
        logger.debug('[Kanban] Error syncing back to actas:', syncBackErr.message);
      }

      lastSyncByCompany.delete(companyId.toString());
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
        priority: req.body.priority || 'media',
        actionType: req.body.actionType || 'correctiva',
        assignedTo: req.body.assignedTo || '',
        startTime: startTime || '09:00',
        endTime: endTime || '10:00',
        allDay: Boolean(allDay),
        emailAttendees: Array.isArray(emailAttendees) ? emailAttendees : (typeof emailAttendees === 'string' ? emailAttendees.split(',').map(s => s.trim()).filter(Boolean) : []),
        location: location || '',
      });
      lastSyncByCompany.delete(companyId.toString());
      return res.json(task);
    }
  } catch (error) {
    logger.error('[SGSST Kanban] Save error:', error);
    res.status(500).json({ error: 'Error al guardar la tarea' });
  }
});

// ─── POST /bulk-save — Importar múltiples tareas desde Excel ─────────────────
router.post('/bulk-save', requireJwtAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const companyId = await getActiveCompanyId(userId);
    if (!companyId) {
      return res.status(400).json({ error: 'No se encontró empresa activa' });
    }

    const { tasks } = req.body;
    if (!Array.isArray(tasks) || tasks.length === 0) {
      return res.status(400).json({ error: 'Se requiere una lista de tareas' });
    }

    const processedTasks = [];
    for (const t of tasks) {
      if (!t.title || !t.dueDate) continue;

      const trimmedTitle = String(t.title).trim();
      const existing = await KanbanTask.findOne({ companyId, title: trimmedTitle });
      if (existing) {
        existing.description = t.description || existing.description;
        existing.dueDate = new Date(t.dueDate);
        existing.status = t.status || existing.status;
        existing.type = t.type || existing.type;
        if (t.priority) existing.priority = t.priority;
        if (t.actionType) existing.actionType = t.actionType;
        if (t.sourceModule) existing.sourceModule = t.sourceModule;
        if (t.assignedTo) existing.assignedTo = t.assignedTo;
        await existing.save();
        processedTasks.push(existing);
      } else {
        const created = await KanbanTask.create({
          user: userId,
          companyId,
          title: trimmedTitle,
          description: t.description || '',
          dueDate: new Date(t.dueDate),
          status: t.status || 'todo',
          type: t.type || 'manual',
          priority: t.priority || 'media',
          actionType: t.actionType || 'correctiva',
          sourceModule: t.sourceModule || 'Plan ACPM Excel',
          assignedTo: t.assignedTo || '',
        });
        processedTasks.push(created);
      }
    }

    lastSyncByCompany.delete(companyId.toString());
    res.json({ success: true, count: processedTasks.length, tasks: processedTasks });
  } catch (error) {
    logger.error('[SGSST Kanban] Bulk save error:', error);
    res.status(500).json({ error: 'Error al importar tareas en lote' });
  }
});

const { extractTextFromFile, cleanAndParseJson } = require('./fileExtractorHelper');

// ─── POST /import-file ──────────────────────────────────────────────────────
router.post('/import-file', requireJwtAuth, express.json({ limit: '50mb' }), async (req, res) => {
  try {
    const { fileData, fileName, mimeType, modelName } = req.body;
    if (!fileData) return res.status(400).json({ error: 'No se recibieron datos del archivo.' });

    // 1. Convertir Base64 a Buffer en memoria
    const base64Data = fileData.split(';base64,').pop();
    const buffer = Buffer.from(base64Data, 'base64');

    // 2. Extraer texto según tipo de archivo de forma robusta
    const extractedText = await extractTextFromFile({ buffer, fileName, mimeType });

    if (!extractedText || !extractedText.trim()) {
      return res.status(400).json({ error: 'No se pudo extraer texto legible del archivo.' });
    }

    // 3. Configurar e invocar a Gemini
    const personalization = req.user?.personalization?.geminiModels;
    const preferredModel = personalization?.sstManagement || (process.env.GOOGLE_MODELS || 'gemini-3.5-flash-lite').split(',')[0].trim();
    const finalModelName = modelName || preferredModel;

    const modelInstance = {
      model: finalModelName,
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              description: { type: 'string' },
              dueDate: { type: 'string' },
              status: { type: 'string', enum: ['todo', 'due_soon', 'overdue', 'done'] },
              type: { type: 'string', enum: ['manual', 'training', 'medical_exam', 'soat', 'rtm', 'driver_license', 'other'] }
            },
            required: ['title', 'dueDate', 'status', 'type'],
          },
        },
      },
    };

    const promptText = `
    Eres un experto senior en Seguridad y Salud en el Trabajo (SST) en Colombia.
    Tu tarea es leer el siguiente documento adjunto y extraer todas las actividades, capacitaciones, inspecciones, exámenes médicos, renovaciones de documentos (SOAT/RTM) o tareas programadas descritas en él.
    Para cada actividad identificada, mapea la información a la estructura JSON solicitada.
    
    Asegúrate de:
    - Retornar un array JSON conteniendo cada tarea como un objeto.
    - El campo 'dueDate' debe ser una fecha con formato YYYY-MM-DD. Si el documento no especifica una fecha exacta o año, asume el año actual (${new Date().getFullYear()}) y deduce una fecha lógica.
    - El campo 'type' debe ser uno de los siguientes valores: 'manual' (para tareas generales), 'training' (para capacitaciones o cursos), 'medical_exam' (para exámenes médicos), 'soat' (renovación de SOAT), 'rtm' (revisión técnico-mecánica), 'driver_license' (licencia de conducción), 'other' (otros).
    - El campo 'status' debe ser por defecto 'todo'.
    
    DOCUMENTO A ANALIZAR:
    Nombre del archivo: ${fileName || 'Adjunto'}
    
    ${extractedText}
    `;

    const result = await generateWithKeyRotation(modelInstance, req.user?.id || req.user, [{ text: promptText }]);
    const response = await result.response;
    const responseText = response.text();
    const cleanJson = cleanAndParseJson(responseText);

    res.json({ success: true, tasks: Array.isArray(cleanJson) ? cleanJson : [cleanJson] });
  } catch (error) {
    logger.error('[SGSST Kanban] Import error:', error);
    res.status(500).json({ error: error.message || 'Error al procesar el archivo con IA' });
  }
});

// ─── DELETE /delete/:id — Eliminar tarea ─────────────────────────────────────
router.delete('/delete/:id', requireJwtAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const task = await KanbanTask.findOne({ _id: id, user: userId });
    if (!task) {
      return res.status(404).json({ error: 'Tarea no encontrada o sin permisos' });
    }

    // If it was linked to an unsafe act, also clean it from inboxPublico
    if (task.referenceId && task.referenceId.startsWith('acto-') && ReporteActosData) {
      const repId = task.referenceId.replace('acto-', '');
      await ReporteActosData.updateOne(
        { user: userId },
        { $pull: { inboxPublico: { id: repId } } }
      );
    }

    // If it has a sync referenceId, mark as dismissed so auto-sync never recreates it
    if (task.referenceId) {
      task.status = 'dismissed';
      await task.save();
    } else {
      await KanbanTask.deleteOne({ _id: id, user: userId });
    }

    if (task.companyId) {
      lastSyncByCompany.delete(task.companyId.toString());
    }

    return res.json({ success: true });
  } catch (error) {
    logger.error('[SGSST Kanban] Delete error:', error);
    return res.status(500).json({ error: 'Error al eliminar la tarea' });
  }
});

// ─── Helpers para Calendario, ICS y Google Calendar ─────────────────────────
const generateIcsContent = ({ title, description, startDate, endDate, location, companyName }) => {
  const formatIcsDate = (date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };
  const now = new Date();
  const uid = `wappy-sst-${Date.now()}-${Math.random().toString(36).substring(2, 9)}@wappy.club`;
  const cleanTitle = (title || 'Compromiso SG-SST').replace(/\r?\n/g, ' ');
  const cleanDesc = (description || '').replace(/\r?\n/g, '\\n');
  const cleanLoc = (location || `Oficinas ${companyName || 'SG-SST'}`).replace(/\r?\n/g, ' ');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//WAPPY IA//Centro de Control SST//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${formatIcsDate(now)}`,
    `DTSTART:${formatIcsDate(startDate)}`,
    `DTEND:${formatIcsDate(endDate)}`,
    `SUMMARY:${cleanTitle}`,
    `DESCRIPTION:${cleanDesc}`,
    `LOCATION:${cleanLoc}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
};

const generateGoogleCalendarUrl = ({ title, description, startDate, endDate, location }) => {
  const formatGCalDate = (d) => {
    return new Date(d).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };
  const startStr = formatGCalDate(startDate);
  const endStr = formatGCalDate(endDate || new Date(new Date(startDate).getTime() + 3600000));
  const base = 'https://calendar.google.com/calendar/render?action=TEMPLATE';
  const params = new URLSearchParams({
    text: title || 'Compromiso SG-SST',
    dates: `${startStr}/${endStr}`,
    details: description ? `${description}\n\nAgendado desde el Centro de Control SST - WAPPY IA (wappy.club)` : 'Agendado desde el Centro de Control SST - WAPPY IA (wappy.club)',
    location: location || 'Oficinas SG-SST',
  });
  return `${base}&${params.toString()}`;
};

// ─── POST /send-event-email — Enviar citación / invitación por correo ───────
router.post('/send-event-email', requireJwtAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const companyId = await getActiveCompanyId(userId);
    const company = companyId ? await CompanyInfo.findById(companyId).lean() : null;
    const companyName = company?.companyName || 'WAPPY SG-SST';

    const {
      taskId,
      recipients,
      to,
      subject,
      customMessage,
    } = req.body;

    let task = null;
    if (taskId) {
      task = await KanbanTask.findOne({ _id: taskId, user: userId });
    }

    const title = req.body.title || task?.title || 'Compromiso SG-SST';
    const description = req.body.description || task?.description || '';
    const rawDueDate = req.body.dueDate || task?.dueDate || new Date();
    const startTime = req.body.startTime || task?.startTime || '09:00';
    const endTime = req.body.endTime || task?.endTime || '10:00';
    const location = req.body.location || task?.location || companyName;

    // Calcular fechas exactas
    const dateBase = new Date(rawDueDate);
    const dateStr = !isNaN(dateBase.getTime())
      ? dateBase.toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];

    const [sh, sm] = startTime.split(':').map((n) => parseInt(n, 10) || 0);
    const [eh, em] = endTime.split(':').map((n) => parseInt(n, 10) || 0);

    const startDateTime = new Date(`${dateStr}T${String(sh).padStart(2, '0')}:${String(sm).padStart(2, '0')}:00-05:00`);
    const endDateTime = new Date(`${dateStr}T${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}:00-05:00`);

    const gcalUrl = generateGoogleCalendarUrl({
      title,
      description,
      startDate: startDateTime,
      endDate: endDateTime,
      location,
    });

    const icsContent = generateIcsContent({
      title,
      description,
      startDate: startDateTime,
      endDate: endDateTime,
      location,
      companyName,
    });

    // Destinatarios
    let emails = [];
    if (recipients) {
      if (Array.isArray(recipients)) emails = recipients;
      else if (typeof recipients === 'string') emails = recipients.split(',').map((s) => s.trim()).filter(Boolean);
    } else if (to) {
      emails = Array.isArray(to) ? to : String(to).split(',').map((s) => s.trim()).filter(Boolean);
    } else if (task?.emailAttendees && task.emailAttendees.length > 0) {
      emails = task.emailAttendees;
    }

    if (emails.length === 0) {
      return res.status(400).json({ error: 'Debes especificar al menos un correo destinatario.' });
    }

    const fechaFormateada = startDateTime.toLocaleDateString('es-CO', {
      timeZone: 'America/Bogota',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const emailSubject = subject || `[Citación SG-SST] ${title} - ${companyName}`;

    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f6f8; margin: 0; padding: 20px; color: #1f2937; }
    .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 18px; overflow: hidden; border: 1px solid #e5e7eb; box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
    .header { background: linear-gradient(135deg, #0d9488 0%, #047857 100%); padding: 30px 24px; color: #ffffff; text-align: left; }
    .badge { display: inline-block; background: rgba(255,255,255,0.22); color: #ffffff; font-size: 11px; font-weight: 800; padding: 4px 12px; border-radius: 12px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; }
    .title { font-size: 22px; font-weight: 800; margin: 0; line-height: 1.3; }
    .content { padding: 28px 24px; }
    .info-box { background: #f0fdfa; border: 1px solid #ccfbf1; border-radius: 14px; padding: 18px; margin: 20px 0; }
    .info-row { display: flex; margin-bottom: 10px; font-size: 14px; }
    .info-label { font-weight: 700; width: 130px; color: #0f766e; }
    .info-value { flex: 1; color: #134e4a; font-weight: 500; }
    .desc { font-size: 14px; line-height: 1.6; color: #4b5563; margin: 16px 0; }
    .btn-container { text-align: center; margin: 26px 0 16px; }
    .btn-gcal { display: inline-block; background: #0f766e; color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 12px; font-weight: 700; font-size: 14px; box-shadow: 0 2px 6px rgba(15, 118, 110, 0.3); }
    .footer { background: #f9fafb; padding: 18px 24px; text-align: center; font-size: 11px; color: #9ca3af; border-top: 1px solid #f3f4f6; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="badge">Centro de Control SG-SST · ${companyName}</div>
      <h1 class="title">${title}</h1>
    </div>
    <div class="content">
      <p style="font-size: 14px; color: #374151;">
        Estimado(a) colaborador(a), se ha agendado la siguiente actividad obligatoria de Seguridad y Salud en el Trabajo:
      </p>

      <div class="info-box">
        <div class="info-row"><span class="info-label">📅 Fecha:</span><span class="info-value" style="text-transform: capitalize;">${fechaFormateada}</span></div>
        <div class="info-row"><span class="info-label">⏰ Horario:</span><span class="info-value">${startTime} a ${endTime} (Hora Colombia)</span></div>
        ${location ? `<div class="info-row"><span class="info-label">📍 Ubicación:</span><span class="info-value">${location}</span></div>` : ''}
        ${task?.assignedTo ? `<div class="info-row"><span class="info-label">👤 Responsable:</span><span class="info-value">${task.assignedTo}</span></div>` : ''}
      </div>

      ${description ? `<div class="desc"><strong>Detalles y Alcance:</strong><br>${description.replace(/\n/g, '<br>')}</div>` : ''}
      ${customMessage ? `<div class="desc" style="background:#fffbeb; border:1px solid #fef3c7; padding:12px; border-radius:10px; color:#92400e;"><strong>Nota de la Coordinación SST:</strong><br>${customMessage}</div>` : ''}

      <div class="btn-container">
        <a href="${gcalUrl}" class="btn-gcal" target="_blank">
          ➕ Añadir a mi Google Calendar
        </a>
      </div>
      <p style="font-size: 12px; color: #6b7280; text-align: center; margin-top: 6px;">
        También se adjunta el archivo oficial <strong>.ics</strong> para sincronizar automáticamente con Outlook, Apple Calendar o tu dispositivo móvil.
      </p>
    </div>
    <div class="footer">
      Mensaje oficial emitido por el Sistema de Gestión de Seguridad y Salud en el Trabajo (SG-SST) · Plataforma WAPPY IA (wappy.club).
    </div>
  </div>
</body>
</html>
    `;

    // Intentar enviar mediante sendEmail
    const sendEmail = require('../../utils/sendEmail');
    const sentResults = [];

    for (const recipientEmail of emails) {
      try {
        await sendEmail({
          email: recipientEmail,
          subject: emailSubject,
          html: htmlBody,
          attachments: [
            {
              filename: 'invitacion-sst.ics',
              content: icsContent,
              contentType: 'text/calendar; charset=utf-8; method=REQUEST',
            },
          ],
        });
        sentResults.push({ email: recipientEmail, status: 'sent' });
      } catch (mailErr) {
        logger.error(`[Kanban] Error sending email to ${recipientEmail}:`, mailErr);
        sentResults.push({ email: recipientEmail, status: 'error', error: mailErr.message });
      }
    }

    // Actualizar emailAttendees en la tarea si existe
    if (task) {
      const mergedAttendees = Array.from(new Set([...(task.emailAttendees || []), ...emails]));
      task.emailAttendees = mergedAttendees;
      await task.save();
    }

    return res.json({
      success: true,
      mensaje: `Invitación enviada a ${sentResults.filter((r) => r.status === 'sent').length} destinatario(s).`,
      detalles: sentResults,
      googleCalendarUrl: gcalUrl,
    });
  } catch (error) {
    logger.error('[SGSST Kanban] send-event-email error:', error);
    return res.status(500).json({ error: `Error al enviar correo del evento: ${error.message}` });
  }
});

// ─── POST /sync-google-calendar — Sincronizar tarea con Google Calendar ─────
router.post('/sync-google-calendar', requireJwtAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const companyId = await getActiveCompanyId(userId);
    const { taskId } = req.body;

    if (!taskId) {
      return res.status(400).json({ error: 'taskId es requerido para sincronizar.' });
    }

    const task = await KanbanTask.findOne({ _id: taskId, user: userId, companyId });
    if (!task) {
      return res.status(404).json({ error: 'Actividad no encontrada.' });
    }

    const dateBase = new Date(task.dueDate);
    const dateStr = !isNaN(dateBase.getTime())
      ? dateBase.toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];

    const startTime = task.startTime || '09:00';
    const endTime = task.endTime || '10:00';
    const [sh, sm] = startTime.split(':').map((n) => parseInt(n, 10) || 0);
    const [eh, em] = endTime.split(':').map((n) => parseInt(n, 10) || 0);

    const startDateTime = new Date(`${dateStr}T${String(sh).padStart(2, '0')}:${String(sm).padStart(2, '0')}:00-05:00`);
    const endDateTime = new Date(`${dateStr}T${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}:00-05:00`);

    const directWebUrl = generateGoogleCalendarUrl({
      title: task.title,
      description: task.description,
      startDate: startDateTime,
      endDate: endDateTime,
      location: task.location,
    });

    let googleSynced = false;
    let syncedLink = null;
    let message = '';

    try {
      const { upsertCalendarEvent } = require('../../services/googleCalendar');
      const gRes = await upsertCalendarEvent(
        userId,
        {
          syncId: task._id.toString(),
          title: task.title,
          description: task.description,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          location: task.location,
        },
        task._id.toString(),
        companyId
      );

      if (gRes) {
        googleSynced = true;
        syncedLink = gRes.htmlLink || null;
        task.googleEventId = gRes.id || task.googleEventId;
        task.googleHtmlLink = syncedLink || task.googleHtmlLink;
        await task.save();
        message = '¡Evento sincronizado exitosamente con tu Google Calendar!';
      }
    } catch (gCalErr) {
      logger.info(`[Kanban] Google Calendar no vinculado directamente via OAuth: ${gCalErr.message}`);
    }

    if (!googleSynced) {
      message = 'Abre el enlace directo para añadir este evento a tu Google Calendar en 1 clic.';
    }

    return res.json({
      success: true,
      googleSynced,
      googleCalendarUrl: directWebUrl,
      syncedLink,
      mensaje: message,
    });
  } catch (error) {
    logger.error('[SGSST Kanban] sync-google-calendar error:', error);
    return res.status(500).json({ error: `Error al sincronizar con Google Calendar: ${error.message}` });
  }
});

// ─── GET /export-ics/:id — Descarga de archivo .ics ─────────────────────────
router.get('/export-ics/:id', requireJwtAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const task = await KanbanTask.findOne({ _id: id, user: userId });
    if (!task) {
      return res.status(404).json({ error: 'Actividad no encontrada.' });
    }

    const companyId = task.companyId || (await getActiveCompanyId(userId));
    const company = companyId ? await CompanyInfo.findById(companyId).lean() : null;

    const dateBase = new Date(task.dueDate);
    const dateStr = !isNaN(dateBase.getTime())
      ? dateBase.toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];

    const startTime = task.startTime || '09:00';
    const endTime = task.endTime || '10:00';
    const [sh, sm] = startTime.split(':').map((n) => parseInt(n, 10) || 0);
    const [eh, em] = endTime.split(':').map((n) => parseInt(n, 10) || 0);

    const startDateTime = new Date(`${dateStr}T${String(sh).padStart(2, '0')}:${String(sm).padStart(2, '0')}:00-05:00`);
    const endDateTime = new Date(`${dateStr}T${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}:00-05:00`);

    const icsContent = generateIcsContent({
      title: task.title,
      description: task.description,
      startDate: startDateTime,
      endDate: endDateTime,
      location: task.location,
      companyName: company?.companyName,
    });

    const safeFilename = task.title.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 30);
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename || 'evento-sst'}.ics"`);
    return res.send(icsContent);
  } catch (error) {
    logger.error('[SGSST Kanban] export-ics error:', error);
    return res.status(500).json({ error: 'Error al exportar archivo .ics' });
  }
});

module.exports = router;
