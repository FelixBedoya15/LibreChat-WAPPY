const express = require('express');
const requireJwtAuth = require('../../middleware/requireJwtAuth');
const mongoose = require('mongoose');
const CompanyInfo = require('../../../models/CompanyInfo');
const SgsstWorker = require('../../../models/SgsstWorker');
const SgsstEppData = require('../../../models/SgsstEppData');
const { logger } = require('~/config');
const { generateWithKeyRotation } = require('./sgsstGemini');
const { buildStandardHeader } = require('./reportHeader');

const router = express.Router();

// ─── Helper: Obtener Empresa Activa ──────────────────────────────────────────
async function getActiveCompanyId(userId) {
  let active = await CompanyInfo.findOne({ user: userId, isActive: true });
  if (!active) active = await CompanyInfo.findOne({ user: userId });
  return active ? active._id : null;
}

// ─── Helper: Traer Firma Registrada del Trabajador ──────────────────────────
async function getWorkerRegisteredSignature(userId, companyId, workerId) {
  try {
    const PerfilSocioModel = mongoose.models.PerfilSociodemograficoData;
    if (!PerfilSocioModel) return null;
    const doc = await PerfilSocioModel.findOne({ user: userId, companyId }).lean();
    if (!doc || !doc.trabajadores) return null;
    const worker = doc.trabajadores.find(w => w.id === workerId);
    return worker ? worker.firmaDigital : null;
  } catch (err) {
    logger.error('[SGSST EPP Helper] Error fetching worker signature:', err.message);
    return null;
  }
}

// ─── GET /data — Obtener entregas de EPP ────────────────────────────────────
router.get('/data', requireJwtAuth, async (req, res) => {
  try {
    const companyId = await getActiveCompanyId(req.user.id);
    if (!companyId) {
      return res.status(400).json({ error: 'No se encontró empresa activa' });
    }
    const data = await SgsstEppData.find({ user: req.user.id, companyId });
    res.json(data);
  } catch (error) {
    logger.error('[SGSST EPP] Load error:', error);
    res.status(500).json({ error: 'Error al cargar entregas de EPP' });
  }
});

// ─── POST /save — Registrar/Actualizar entrega de EPP ────────────────────────
router.post('/save', requireJwtAuth, async (req, res) => {
  try {
    const { workerId, documento, nombreTrabajador, cargo, entregas } = req.body;
    const companyId = await getActiveCompanyId(req.user.id);
    if (!companyId) {
      return res.status(400).json({ error: 'No se encontró empresa activa' });
    }

    // Traer la firma del trabajador si ya está registrada en perfil sociodemográfico
    const registeredSignature = await getWorkerRegisteredSignature(req.user.id, companyId, workerId);

    // Mapear cada entrega para inyectar la firma si el usuario no mandó una nueva firma en la entrega actual
    const updatedEntregas = (entregas || []).map(ent => {
      if (!ent.firmaTrabajador && registeredSignature) {
        return { ...ent, firmaTrabajador: registeredSignature };
      }
      return ent;
    });

    const updatedDoc = await SgsstEppData.findOneAndUpdate(
      { user: req.user.id, companyId, workerId },
      {
        $set: {
          documento,
          nombreTrabajador,
          cargo,
          entregas: updatedEntregas,
          updatedAt: Date.now()
        }
      },
      { upsert: true, new: true }
    );

    // Lanzar sincronización con IPEVAR en segundo plano
    await syncEppWithIpevar(req.user.id, companyId, workerId, updatedDoc);

    res.json({ success: true, data: updatedDoc });
  } catch (error) {
    logger.error('[SGSST EPP] Save error:', error);
    res.status(500).json({ error: 'Error al guardar entrega de EPP' });
  }
});

// ─── POST /sync-manual — Disparar sincronización manual ──────────────────────
router.post('/sync-manual', requireJwtAuth, async (req, res) => {
  try {
    const { workerId } = req.body;
    const companyId = await getActiveCompanyId(req.user.id);
    const doc = await SgsstEppData.findOne({ user: req.user.id, companyId, workerId });
    if (!doc) {
      return res.status(404).json({ error: 'No se encontraron entregas de EPP para este trabajador' });
    }

    await syncEppWithIpevar(req.user.id, companyId, workerId, doc);
    res.json({ success: true });
  } catch (error) {
    logger.error('[SGSST EPP] Manual sync error:', error);
    res.status(500).json({ error: 'Error en sincronización manual' });
  }
});

// ─── Función de Sincronización con la Matriz Bio-IPEVAR (SgsstWorker) ─────────
async function syncEppWithIpevar(userId, companyId, workerId, eppDoc) {
  try {
    const worker = await SgsstWorker.findOne({ user: userId, companyId, perfilId: workerId });
    if (!worker) {
      logger.debug(`[SGSST EPP Sync] SgsstWorker no encontrado para id ${workerId}`);
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Evaluar si tiene EPPs vencidos o inspecciones de alturas pendientes
    let hasExpiredRegular = false;
    let hasExpiredAlturas = false;
    let totalAlertsCount = 0;

    (eppDoc.entregas || []).forEach(ent => {
      // Comparar fechas
      if (ent.fechaVencimiento) {
        const vto = parseDateString(ent.fechaVencimiento);
        if (vto && vto < today) {
          if (ent.tipo === 'Alturas') hasExpiredAlturas = true;
          else hasExpiredRegular = true;
          totalAlertsCount++;
        }
      }
      if (ent.tipo === 'Alturas' && ent.fechaProximaInspeccion) {
        const prox = parseDateString(ent.fechaProximaInspeccion);
        if (prox && prox < today) {
          hasExpiredAlturas = true;
          totalAlertsCount++;
        }
      }
    });

    // 1. Gestionar las fitAlerts en el perfil de salud SgsstWorker
    const newAlertsSet = new Set(worker.fitAlerts || []);
    const alertLabelRegular = 'EPP Convencional Vencido';
    const alertLabelAlturas = 'Equipo de Alturas Vencido o Sin Certificar';

    if (hasExpiredRegular) {
      newAlertsSet.add(alertLabelRegular);
    } else {
      newAlertsSet.delete(alertLabelRegular);
    }

    if (hasExpiredAlturas) {
      newAlertsSet.add(alertLabelAlturas);
    } else {
      newAlertsSet.delete(alertLabelAlturas);
    }

    // 2. Modular el fitScore en función de los EPPs vencidos (Castigo de -10 pts por alerta)
    // Partimos de un score base recalculado del Perfil Sociodemográfico o mantenemos el actual.
    // Para simplificar, restamos 10 puntos por cada tipo de alerta activa, asegurando rango [0, 100].
    let fitPenalty = 0;
    if (hasExpiredRegular) fitPenalty += 10;
    if (hasExpiredAlturas) fitPenalty += 15; // Mayor peso por alturas

    // Buscamos sincronizar con la matriz bio-individual (riesgosBioIndividual)
    const updatedRiesgos = (worker.riesgosBioIndividual || []).map(risk => {
      const eppRequired = risk.controles_individuo && /EPP|arnés|eslinga|casco|gafas/i.test(risk.controles_individuo);
      if (eppRequired) {
        // Si hay alertas activas de EPP, marcamos el control como inefectivo
        if (hasExpiredRegular || hasExpiredAlturas) {
          return {
            ...risk,
            plan_accion_bio: '❌ ALERTA: EPP Requerido se encuentra VENCIDO o pendiente de entrega.',
            nivel_susceptibilidad: Math.min(5, (risk.nivel_susceptibilidad || 1) + 1) // Incrementa susceptibilidad
          };
        } else {
          return {
            ...risk,
            plan_accion_bio: '✅ EPP Verificado y al día.',
            nivel_susceptibilidad: Math.max(1, (risk.nivel_susceptibilidad || 2) - 1) // Reduce susceptibilidad
          };
        }
      }
      return risk;
    });

    // Guardar cambios en el SgsstWorker
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

    logger.info(`[SGSST EPP Sync] Sincronización exitosa para trabajador ${worker.nombre}. Alertas: ${totalAlertsCount}`);

  } catch (err) {
    logger.error('[SGSST EPP Sync] Error syncing EPP with IPEVAR:', err.message);
  }
}

// Auxiliar de parsing
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

// ─── POST /generate ───────────────────────────────────────────────────────
router.post('/generate', requireJwtAuth, async (req, res) => {
  try {
    const { workerId, nombreTrabajador, cargo, entregas, modelName } = req.body;
    const companyId = await getActiveCompanyId(req.user.id);
    if (!companyId) {
      return res.status(400).json({ error: 'No se encontró empresa activa' });
    }

    const personalization = req.user?.personalization?.geminiModels;
    const preferredModel = personalization?.sstManagement || (process.env.GOOGLE_MODELS || 'gemini-3.5-flash').split(',')[0].trim();
    const finalModelName = modelName || preferredModel;

    let loadedCompanyInfo = null;
    try {
      loadedCompanyInfo = await CompanyInfo.findOne({ user: req.user.id }).lean();
    } catch (e) {
      logger.warn('Failed to load company info for EPP');
    }

    const currentDate = new Date().toLocaleDateString('es-CO', {
      year: 'numeric', month: 'long', day: 'numeric',
    });

    const headerHTML = buildStandardHeader({
      title: 'INFORME DE ENTREGA Y SEGUIMIENTO DE EPP',
      companyInfo: loadedCompanyInfo,
      date: currentDate,
      norm: 'Art. 85 Ley 9 de 1979 / Resolución 2400 de 1979 / Dec. 1072 de 2015',
      responsibleName: req.user?.name,
    });

    const entregasStr = (entregas || []).map(e => 
      `- EPP: ${e.nombre} | Fecha: ${e.fechaEntrega} | Vence: ${e.fechaVencimiento || 'N/A'} | Estado: ${e.estado} | Firma: ${e.firmaTrabajador ? 'FIRMADO' : 'PENDIENTE'}`
    ).join('\n') || '[Sin entregas registradas]';

    const promptText = `
${headerHTML}
Eres un Experto Técnico Senior en Seguridad y Salud en el Trabajo (SST) colombiano.
Tu objetivo es redactar un **INFORME DE CUMPLIMIENTO, ENTREGA Y SEGUIMIENTO DE EPP** estructurado y profesional para el siguiente trabajador:

**DATOS DEL TRABAJADOR:**
- Nombre: ${nombreTrabajador}
- Cargo: ${cargo || 'No asignado'}
- Empresa: ${loadedCompanyInfo?.companyName || 'No registrada'}

**HISTORIAL DE ENTREGAS:**
${entregasStr}

**INSTRUCCIONES DE REDACCIÓN:**
1. Genera un informe exhaustivo en formato HTML que continúe después del encabezado anterior.
2. Usa tablas HTML estructuradas y estilos CSS inline discretos y modernos (sin repetir etiquetas HTML o HEAD, solo estructura de cuerpo o contenedores div y table).
3. Incluye las siguientes secciones:
   - **Resumen Ejecutivo**: Análisis general del cumplimiento.
   - **Evaluación de Estado e Integridad**: Estado de los EPPs entregados y si hay vencidos.
   - **Plan de Acción y Recomendaciones**: Instrucciones para el trabajador y la empresa para garantizar la protección continua.
4. NUNCA inventes entregas, fechas, firmas o datos que no estén listados en el historial.
`;

    const result = await generateWithKeyRotation(finalModelName, req.user.id, promptText);
    res.json({ report: result.response.text() });
  } catch (error) {
    logger.error('[SGSST EPP Generate] Error:', error);
    res.status(500).json({ error: error.message || 'Error al generar informe de EPP' });
  }
});

module.exports = router;
