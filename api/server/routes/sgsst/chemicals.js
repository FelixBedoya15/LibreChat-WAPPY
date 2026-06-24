const express = require('express');
const requireJwtAuth = require('../../middleware/requireJwtAuth');
const mongoose = require('mongoose');
const CompanyInfo = require('../../../models/CompanyInfo');
const SgsstWorker = require('../../../models/SgsstWorker');
const SgsstChemicalData = require('../../../models/SgsstChemicalData');
const { logger } = require('~/config');

const router = express.Router();

// ─── Helper: Obtener Empresa Activa ──────────────────────────────────────────
async function getActiveCompanyId(userId) {
  let active = await CompanyInfo.findOne({ user: userId, isActive: true });
  if (!active) active = await CompanyInfo.findOne({ user: userId });
  return active ? active._id : null;
}

// ─── GET /data — Obtener inventario de productos químicos ───────────────────
router.get('/data', requireJwtAuth, async (req, res) => {
  try {
    const companyId = await getActiveCompanyId(req.user.id);
    if (!companyId) {
      return res.status(400).json({ error: 'No se encontró empresa activa' });
    }
    // Como los productos químicos se consolidan por empresa, buscamos el doc de la empresa
    let doc = await SgsstChemicalData.findOne({ user: req.user.id, companyId });
    if (!doc) {
      doc = await SgsstChemicalData.create({
        user: req.user.id,
        companyId,
        productos: []
      });
    }
    res.json(doc.productos || []);
  } catch (error) {
    logger.error('[SGSST Chemicals] Load error:', error);
    res.status(500).json({ error: 'Error al cargar productos químicos' });
  }
});

// ─── POST /save — Registrar/Actualizar productos químicos ────────────────────
router.post('/save', requireJwtAuth, async (req, res) => {
  try {
    const { productos } = req.body;
    const companyId = await getActiveCompanyId(req.user.id);
    if (!companyId) {
      return res.status(400).json({ error: 'No se encontró empresa activa' });
    }

    const updatedDoc = await SgsstChemicalData.findOneAndUpdate(
      { user: req.user.id, companyId },
      {
        $set: {
          productos: productos || [],
          updatedAt: Date.now()
        }
      },
      { upsert: true, new: true }
    );

    // Sincronizar todos los productos con los trabajadores expuestos
    await syncChemicalsWithIpevar(req.user.id, companyId, updatedDoc.productos || []);

    res.json({ success: true, data: updatedDoc.productos || [] });
  } catch (error) {
    logger.error('[SGSST Chemicals] Save error:', error);
    res.status(500).json({ error: 'Error al guardar productos químicos' });
  }
});

// ─── POST /sync-manual — Sincronizar manualmente con IPEVAR ─────────────────
router.post('/sync-manual', requireJwtAuth, async (req, res) => {
  try {
    const companyId = await getActiveCompanyId(req.user.id);
    const doc = await SgsstChemicalData.findOne({ user: req.user.id, companyId });
    if (!doc) {
      return res.status(404).json({ error: 'No se encontraron productos químicos' });
    }

    await syncChemicalsWithIpevar(req.user.id, companyId, doc.productos || []);
    res.json({ success: true });
  } catch (error) {
    logger.error('[SGSST Chemicals] Manual sync error:', error);
    res.status(500).json({ error: 'Error en sincronización manual' });
  }
});

// ─── Lógica de Sincronización Químicos -> IPEVAR ─────────────────────────────
async function syncChemicalsWithIpevar(userId, companyId, productosList) {
  try {
    // 1. Mapear de manera inversa: qué trabajadores están expuestos a qué productos químicos
    // Y determinar si el trabajador está expuesto a un químico no conforme (sin FDS o sin Rótulo)
    const workerStatusMap = {};

    productosList.forEach(prod => {
      const isProductNonConformant = prod.tieneFds === 'No' || prod.tieneRotuloSga === 'No';
      (prod.trabajadoresExpuestos || []).forEach(workerId => {
        if (!workerStatusMap[workerId]) {
          workerStatusMap[workerId] = {
            hasNonConformant: false,
            nonConformantNames: []
          };
        }
        if (isProductNonConformant) {
          workerStatusMap[workerId].hasNonConformant = true;
          workerStatusMap[workerId].nonConformantNames.push(prod.nombre);
        }
      });
    });

    // 2. Buscar todos los SgsstWorkers expuestos a químicos para modular sus riesgos
    const exposedWorkerIds = Object.keys(workerStatusMap);
    
    // Obtener todos los trabajadores de la empresa
    const workers = await SgsstWorker.find({ user: userId, companyId });

    for (const worker of workers) {
      const workerId = worker.perfilId;
      const newAlertsSet = new Set(worker.fitAlerts || []);
      const alertLabel = 'Exposición a Químico Sin FDS/Rótulo';

      const status = workerStatusMap[workerId];
      const isExposedNonConformant = status ? status.hasNonConformant : false;

      if (isExposedNonConformant) {
        newAlertsSet.add(alertLabel);
      } else {
        newAlertsSet.delete(alertLabel);
      }

      // Recorrer los riesgos bio-individuales para buscar relacionados con disolventes/químicos
      const updatedRiesgos = (worker.riesgosBioIndividual || []).map(risk => {
        const isChemicalRisk = (risk.controles_individuo && /químico|quimico|solvente|sustancia|vapor|gases|humos/i.test(risk.controles_individuo)) ||
                              (risk.dimension_bio && /químico|quimico|solvente|sustancia|vapor|gases|humos/i.test(risk.dimension_bio));
        
        if (isChemicalRisk) {
          if (isExposedNonConformant) {
            const chemicalNames = (status.nonConformantNames || []).slice(0, 2).join(', ');
            return {
              ...risk,
              plan_accion_bio: `❌ ALERTA QUÍMICOS: Exposición a disolvente/producto químico (${chemicalNames}) sin Ficha de Seguridad (FDS) o Rótulo SGA.`,
              nivel_susceptibilidad: Math.min(5, (risk.nivel_susceptibilidad || 1) + 1)
            };
          } else {
            return {
              ...risk,
              plan_accion_bio: '✅ QUÍMICOS: FDS y rotulado de sustancias químicas manipuladas verificado y conforme.',
              nivel_susceptibilidad: Math.max(1, (risk.nivel_susceptibilidad || 2) - 1)
            };
          }
        }
        return risk;
      });

      // Actualizar worker en la DB
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
    }

    logger.info(`[SGSST Chemicals Sync] Sincronización exitosa. Trabajadores expuestos actualizados: ${exposedWorkerIds.length}`);
  } catch (err) {
    logger.error('[SGSST Chemicals Sync] Error syncing chemicals with IPEVAR:', err.message);
  }
}

module.exports = router;
