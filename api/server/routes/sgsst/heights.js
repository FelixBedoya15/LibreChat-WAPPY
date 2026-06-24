const express = require('express');
const requireJwtAuth = require('../../middleware/requireJwtAuth');
const mongoose = require('mongoose');
const CompanyInfo = require('../../../models/CompanyInfo');
const SgsstWorker = require('../../../models/SgsstWorker');
const SgsstHeightsData = require('../../../models/SgsstHeightsData');
const { logger } = require('~/config');

const router = express.Router();

// ─── Helper: Obtener Empresa Activa ──────────────────────────────────────────
async function getActiveCompanyId(userId) {
  let active = await CompanyInfo.findOne({ user: userId, isActive: true });
  if (!active) active = await CompanyInfo.findOne({ user: userId });
  return active ? active._id : null;
}

// ─── GET /data — Obtener equipos de alturas ──────────────────────────────────
router.get('/data', requireJwtAuth, async (req, res) => {
  try {
    const companyId = await getActiveCompanyId(req.user.id);
    if (!companyId) {
      return res.status(400).json({ error: 'No se encontró empresa activa' });
    }
    const data = await SgsstHeightsData.find({ user: req.user.id, companyId });
    res.json(data);
  } catch (error) {
    logger.error('[SGSST Heights] Load error:', error);
    res.status(500).json({ error: 'Error al cargar equipos de alturas' });
  }
});

// ─── POST /save — Registrar/Actualizar equipos ───────────────────────────────
router.post('/save', requireJwtAuth, async (req, res) => {
  try {
    const { workerId, nombreTrabajador, cargo, equipos } = req.body;
    const companyId = await getActiveCompanyId(req.user.id);
    if (!companyId) {
      return res.status(400).json({ error: 'No se encontró empresa activa' });
    }

    const updatedDoc = await SgsstHeightsData.findOneAndUpdate(
      { user: req.user.id, companyId, workerId },
      {
        $set: {
          nombreTrabajador,
          cargo,
          equipos: equipos || [],
          updatedAt: Date.now()
        }
      },
      { upsert: true, new: true }
    );

    // Sincronizar estado de los equipos de alturas con la matriz IPEVAR del trabajador
    await syncHeightsWithIpevar(req.user.id, companyId, workerId, updatedDoc);

    res.json({ success: true, data: updatedDoc });
  } catch (error) {
    logger.error('[SGSST Heights] Save error:', error);
    res.status(500).json({ error: 'Error al guardar equipos de alturas' });
  }
});

// ─── POST /sync-manual — Sincronizar manualmente con IPEVAR ─────────────────
router.post('/sync-manual', requireJwtAuth, async (req, res) => {
  try {
    const { workerId } = req.body;
    const companyId = await getActiveCompanyId(req.user.id);
    const doc = await SgsstHeightsData.findOne({ user: req.user.id, companyId, workerId });
    if (!doc) {
      return res.status(404).json({ error: 'No se encontraron equipos para este trabajador' });
    }

    await syncHeightsWithIpevar(req.user.id, companyId, workerId, doc);
    res.json({ success: true });
  } catch (error) {
    logger.error('[SGSST Heights] Manual sync error:', error);
    res.status(500).json({ error: 'Error en sincronización manual' });
  }
});

// ─── Lógica de Sincronización Alturas -> IPEVAR ──────────────────────────────
async function syncHeightsWithIpevar(userId, companyId, workerId, heightsDoc) {
  try {
    const worker = await SgsstWorker.findOne({ user: userId, companyId, perfilId: workerId });
    if (!worker) {
      logger.debug(`[SGSST Heights Sync] SgsstWorker no encontrado para id ${workerId}`);
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let hasExpiredHeights = false;

    (heightsDoc.equipos || []).forEach(eq => {
      // 1. Validar estado general o inspección vencida/rechazada
      if (eq.estado === 'Vencido' || eq.estado === 'Requiere Inspección' || eq.estado === 'Retirado' || eq.resultadoInspeccion === 'Rechazado') {
        hasExpiredHeights = true;
      }
      
      // 2. Validar fecha próxima inspección
      if (eq.fechaProximaInspeccion) {
        const prox = parseDateString(eq.fechaProximaInspeccion);
        if (prox && prox < today) {
          hasExpiredHeights = true;
        }
      }
    });

    // Gestionar fitAlerts del trabajador
    const newAlertsSet = new Set(worker.fitAlerts || []);
    const alertLabel = 'Equipamiento de Alturas No Conforme';

    if (hasExpiredHeights) {
      newAlertsSet.add(alertLabel);
    } else {
      newAlertsSet.delete(alertLabel);
    }

    // Recorrer los riesgos bio-individuales para buscar relacionados con trabajo en alturas
    const updatedRiesgos = (worker.riesgosBioIndividual || []).map(risk => {
      const isHeightsRisk = (risk.controles_individuo && /altura|caída|caidas|eslinga|arnes/i.test(risk.controles_individuo)) ||
                            (risk.dimension_bio && /altura|caída|caidas|eslinga|arnes/i.test(risk.dimension_bio));
      
      if (isHeightsRisk) {
        if (hasExpiredHeights) {
          return {
            ...risk,
            plan_accion_bio: '❌ ALERTA ALTURAS: El equipamiento asignado de protección contra caídas se encuentra VENCIDO o RECHAZADO.',
            nivel_susceptibilidad: Math.min(5, (risk.nivel_susceptibilidad || 1) + 1)
          };
        } else {
          return {
            ...risk,
            plan_accion_bio: '✅ ALTURAS: Equipamiento de alturas verificado e inspeccionado de manera conforme.',
            nivel_susceptibilidad: Math.max(1, (risk.nivel_susceptibilidad || 2) - 1)
          };
        }
      }
      return risk;
    });

    await SgsstWorker.updateOne(
      { _id: worker._id },
      {
        $set: {
          fitAlerts: Array.from(newAlertsSet),
          riesgosBioIndividual: updatedRiesgos,
          updatedAt: Date.now()
        }
      }
    );

    logger.info(`[SGSST Heights Sync] Sincronización exitosa para trabajador ${worker.nombre}. Alerta activa: ${hasExpiredHeights}`);
  } catch (err) {
    logger.error('[SGSST Heights Sync] Error syncing heights with IPEVAR:', err.message);
  }
}

// Auxiliar de parsing de fecha
function parseDateString(dateStr) {
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
}

module.exports = router;
