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

    // 4. Sync Auditoría SG-SST findings (no_cumple & parcial)
    const auditData = await AuditoriaData.findOne({ user: userId, companyId }).lean();
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

          let task = await KanbanTask.findOne({ user: userId, companyId, referenceId });
          if (!task) {
            await KanbanTask.create({
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
            });
          } else if (task.status !== 'done') {
            if (task.title !== title || task.description !== description) {
              task.title = title;
              task.description = description;
              task.priority = isNoCumple ? 'alta' : 'media';
              task.actionType = isNoCumple ? 'correctiva' : 'mejora';
              await task.save();
            }
          }
        }
      }
    }

    // 5. Sync Diagnóstico Inicial findings (no_cumple & parcial)
    const diagData = await DiagnosticoData.findOne({ user: userId, companyId }).lean();
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

          let task = await KanbanTask.findOne({ user: userId, companyId, referenceId });
          if (!task) {
            await KanbanTask.create({
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
            });
          } else if (task.status !== 'done') {
            if (task.title !== title || task.description !== description) {
              task.title = title;
              task.description = description;
              task.priority = isNoCumple ? 'alta' : 'media';
              task.actionType = isNoCumple ? 'correctiva' : 'mejora';
              await task.save();
            }
          }
        }
      }
    }

    // 6. Sync Alta Dirección requirements
    if (AltaDireccionData) {
      const altaDirDoc = await AltaDireccionData.findOne({ user: userId, companyId }).lean();
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

            let task = await KanbanTask.findOne({ user: userId, companyId, referenceId });
            if (!task) {
              await KanbanTask.create({
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
              });
            } else if (task.status !== 'done') {
              if (task.description !== description || task.title !== title) {
                task.description = description;
                task.title = title;
                await task.save();
              }
            }
          }
        }
      }
    }

    // 7. Sync Actos y Condiciones Inseguras (Only genuine reports with real content)
    if (ReporteActosData) {
      // Purge any legacy/phantom auto-generated tasks with empty detail or placeholder title
      await KanbanTask.deleteMany({
        user: userId,
        companyId,
        $or: [
          { title: '[Acto Inseguro] Peligro en terreno' },
          { title: '[Condición Insegura] Peligro en terreno' },
          { description: { $regex: /Detalle:\s*\.?\s*$/i } },
        ]
      });

      const actosDoc = await ReporteActosData.findOne({ user: userId, companyId }).lean();
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

          let task = await KanbanTask.findOne({ user: userId, companyId, referenceId });
          if (!task) {
            await KanbanTask.create({
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
            });
          } else if (task.status !== 'done' && task.status !== 'dismissed') {
            if (task.description !== description || task.title !== title) {
              task.description = description;
              task.title = title;
              await task.save();
            }
          }
        }
      }
    }

    // 8. Sync Peligros Críticos IPEVAR (Nivel I - No Aceptable)
    if (GTC45WorkspaceSession) {
      const gtcDoc = await GTC45WorkspaceSession.findOne({
        $or: [{ user: userId, isOfficial: true }, { companyId, isOfficial: true }]
      }).lean();
      if (gtcDoc && Array.isArray(gtcDoc.matrixRows)) {
        for (let i = 0; i < gtcDoc.matrixRows.length; i++) {
          const row = gtcDoc.matrixRows[i];
          const isCritical = (row.nd >= 6 && row.nc >= 25) || (row.nr >= 500) ||
            (typeof row.aceptabilidad === 'string' && (row.aceptabilidad.includes('I') || row.aceptabilidad.toLowerCase().includes('no aceptable')));
          if (isCritical) {
            const rowId = row.id || `row-${i}`;
            const referenceId = `ipevar-${rowId}`;
            const referenceName = `Matriz IPEVAR (${row.peligro_clasificacion || 'Peligro'})`;
            const dueDate = addDays(today, 15);

            const title = `[Peligro Crítico GTC-45] ${row.peligro_clasificacion || 'Peligro'} - ${row.proceso || 'Operativo'}`;
            const description = `Peligro evaluado en Nivel I (No Aceptable / Situación Crítica). Proceso: ${row.proceso || ''}. Actividad/Tarea: ${row.actividad || ''} - ${row.tareas || ''}. Peligro: ${row.peligro_descripcion || ''}. Control Propuesto: ${row.medida_eliminacion && row.medida_eliminacion !== 'Ninguno' ? row.medida_eliminacion : row.medida_ingenieria && row.medida_ingenieria !== 'Ninguno' ? row.medida_ingenieria : row.medida_administrativa || 'Intervención inmediata'}.`;

            let task = await KanbanTask.findOne({ user: userId, companyId, referenceId });
            if (!task) {
              await KanbanTask.create({
                user: userId,
                companyId,
                title,
                description,
                dueDate,
                status: 'todo',
                type: 'ipevar_finding',
                priority: 'alta',
                actionType: 'correctiva',
                sourceModule: 'matriz_ipevar',
                referenceId,
                referenceName,
              });
            } else if (task.status !== 'done' && task.status !== 'dismissed') {
              if (task.description !== description || task.title !== title) {
                task.description = description;
                task.title = title;
                await task.save();
              }
            }
          }
        }
      }
    }

    // 9. Fetch and return all active tasks for user and company (exclude dismissed)
    const tasks = await KanbanTask.find({ user: userId, companyId, status: { $ne: 'dismissed' } }).sort({ dueDate: 1 });
    res.json(tasks);
  } catch (error) {
    logger.error('[SGSST Kanban] Load error:', error);
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

      if (req.body.priority) updateData.priority = req.body.priority;
      if (req.body.actionType) updateData.actionType = req.body.actionType;
      if (req.body.assignedTo !== undefined) updateData.assignedTo = req.body.assignedTo;

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
        priority: req.body.priority || 'media',
        actionType: req.body.actionType || 'correctiva',
        assignedTo: req.body.assignedTo || '',
      });
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

    const createdTasks = [];
    for (const t of tasks) {
      if (!t.title || !t.dueDate) continue;

      const created = await KanbanTask.create({
        user: userId,
        companyId,
        title: t.title,
        description: t.description || '',
        dueDate: new Date(t.dueDate),
        status: t.status || 'todo',
        type: t.type || 'manual',
      });
      createdTasks.push(created);
    }

    res.json({ success: true, count: createdTasks.length, tasks: createdTasks });
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
    const preferredModel = personalization?.sstManagement || (process.env.GOOGLE_MODELS || 'gemini-3.5-flash').split(',')[0].trim();
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

    res.json({ success: true });
  } catch (error) {
    logger.error('[SGSST Kanban] Delete error:', error);
    res.status(500).json({ error: 'Error al eliminar la tarea' });
  }
});

module.exports = router;
