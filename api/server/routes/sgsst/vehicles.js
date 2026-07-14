const express = require('express');
const requireJwtAuth = require('../../middleware/requireJwtAuth');
const mongoose = require('mongoose');
const CompanyInfo = require('../../../models/CompanyInfo');
const SgsstWorker = require('../../../models/SgsstWorker');
const SgsstVehicleData = require('../../../models/SgsstVehicleData');
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

// ─── GET /data — Obtener lista de vehículos ──────────────────────────────────
router.get('/data', requireJwtAuth, async (req, res) => {
  try {
    const companyId = await getActiveCompanyId(req.user.id);
    if (!companyId) {
      return res.status(400).json({ error: 'No se encontró empresa activa' });
    }
    const data = await SgsstVehicleData.find({ user: req.user.id, companyId });
    res.json(data);
  } catch (error) {
    logger.error('[SGSST Vehicles] Load error:', error);
    res.status(500).json({ error: 'Error al cargar vehículos' });
  }
});

// ─── POST /save — Registrar/Actualizar vehículo e inspecciones ───────────────
router.post('/save', requireJwtAuth, async (req, res) => {
  try {
    const { 
      placa, marca, referencia, modelo, anio, tipo,
      conductorId, conductorNombre, soatVencimiento, tecnomecanicaVencimiento,
      ultimoMantenimiento, proximoMantenimiento, kilometrajeActual, inspecciones 
    } = req.body;

    const companyId = await getActiveCompanyId(req.user.id);
    if (!companyId) {
      return res.status(400).json({ error: 'No se encontró empresa activa' });
    }

    const updatedDoc = await SgsstVehicleData.findOneAndUpdate(
      { user: req.user.id, companyId, placa: placa.trim().toUpperCase() },
      {
        $set: {
          marca,
          referencia,
          modelo,
          anio,
          tipo,
          conductorId,
          conductorNombre,
          soatVencimiento,
          tecnomecanicaVencimiento,
          ultimoMantenimiento,
          proximoMantenimiento,
          kilometrajeActual,
          inspecciones: inspecciones || [],
          updatedAt: Date.now()
        }
      },
      { upsert: true, new: true }
    );

    // Sincronizar el estado del vehículo con el conductor asignado
    await syncVehicleWithIpevar(req.user.id, companyId, conductorId, updatedDoc);

    res.json({ success: true, data: updatedDoc });
  } catch (error) {
    logger.error('[SGSST Vehicles] Save error:', error);
    res.status(500).json({ error: 'Error al guardar vehículo' });
  }
});

// ─── POST /sync-manual — Sincronizar manualmente con IPEVAR ─────────────────
router.post('/sync-manual', requireJwtAuth, async (req, res) => {
  try {
    const { placa } = req.body;
    const companyId = await getActiveCompanyId(req.user.id);
    const doc = await SgsstVehicleData.findOne({ user: req.user.id, companyId, placa: placa.trim().toUpperCase() });
    if (!doc) {
      return res.status(404).json({ error: 'Vehículo no encontrado' });
    }

    await syncVehicleWithIpevar(req.user.id, companyId, doc.conductorId, doc);
    res.json({ success: true });
  } catch (error) {
    logger.error('[SGSST Vehicles] Manual sync error:', error);
    res.status(500).json({ error: 'Error en sincronización manual' });
  }
});

// ─── Lógica de Sincronización PESV -> IPEVAR ─────────────────────────────────
async function syncVehicleWithIpevar(userId, companyId, conductorId, vehicleDoc) {
  try {
    const worker = await SgsstWorker.findOne({ user: userId, companyId, perfilId: conductorId });
    if (!worker) {
      logger.debug(`[SGSST Vehicles Sync] SgsstWorker no encontrado para id ${conductorId}`);
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Evaluar estado del vehículo
    let isNonConformant = false;

    // 1. Validar SOAT
    if (vehicleDoc.soatVencimiento) {
      const soatDate = parseDateString(vehicleDoc.soatVencimiento);
      if (soatDate && soatDate < today) isNonConformant = true;
    }

    // 2. Validar Tecnomecánica
    if (vehicleDoc.tecnomecanicaVencimiento) {
      const tecnoDate = parseDateString(vehicleDoc.tecnomecanicaVencimiento);
      if (tecnoDate && tecnoDate < today) isNonConformant = true;
    }

    // 3. Validar última inspección pre-operacional
    const ultInspeccion = (vehicleDoc.inspecciones || []).slice(-1)[0];
    if (ultInspeccion && ultInspeccion.resultado === 'Rechazado') {
      isNonConformant = true;
    }

    // Gestionar fitAlerts del conductor
    const newAlertsSet = new Set(worker.fitAlerts || []);
    const alertLabel = `Vehículo No Conforme - PESV (${vehicleDoc.placa})`;

    if (isNonConformant) {
      newAlertsSet.add(alertLabel);
    } else {
      newAlertsSet.delete(alertLabel);
    }

    // Recorrer los riesgos bio-individuales para buscar relacionados con el PESV
    const updatedRiesgos = (worker.riesgosBioIndividual || []).map(risk => {
      const isDrivingRisk = risk.dominio_bio === 'Seguridad' || 
                           (risk.controles_individuo && /vial|tránsito|conducción|pesv/i.test(risk.controles_individuo)) ||
                           (risk.dimension_bio && /vial|tránsito|conducción|pesv/i.test(risk.dimension_bio));
      
      if (isDrivingRisk) {
        if (isNonConformant) {
          return {
            ...risk,
            plan_accion_bio: `❌ ALERTA PESV: Vehículo (${vehicleDoc.placa}) con SOAT/RTM VENCIDO o inspección pre-operacional RECHAZADA.`,
            nivel_susceptibilidad: Math.min(5, (risk.nivel_susceptibilidad || 1) + 1)
          };
        } else {
          return {
            ...risk,
            plan_accion_bio: `✅ PESV: Vehículo (${vehicleDoc.placa}) e inspección vehicular en estado conforme.`,
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

    logger.info(`[SGSST Vehicles Sync] Sincronización exitosa para conductor ${worker.nombre}. Alerta activa: ${isNonConformant}`);
  } catch (err) {
    logger.error('[SGSST Vehicles Sync] Error syncing vehicle with IPEVAR:', err.message);
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

// ─── POST /generate ───────────────────────────────────────────────────────
router.post('/generate', requireJwtAuth, async (req, res) => {
  try {
    const { 
      placa, marca, referencia, modelo, anio, tipo,
      conductorNombre, soatVencimiento, tecnomecanicaVencimiento,
      ultimoMantenimiento, proximoMantenimiento, kilometrajeActual, inspecciones,
      modelName 
    } = req.body;

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
      logger.warn('Failed to load company info for Vehicles');
    }

    const currentDate = new Date().toLocaleDateString('es-CO', {
      year: 'numeric', month: 'long', day: 'numeric',
    });

    const headerHTML = buildStandardHeader({
      title: 'INFORME DE CONTROL OPERACIONAL Y HOJA DE VIDA DE VEHÍCULO (PESV)',
      companyInfo: loadedCompanyInfo,
      date: currentDate,
      norm: 'Ley 1503 de 2011 / Decreto 1072 de 2015 / Resolución 20223040040595 de 2022',
      responsibleName: req.user?.name,
    });

    const inspectionsStr = (inspecciones || []).map(ins => 
      `- Fecha: ${ins.fecha} | Kilometraje: ${ins.kilometraje || 'N/A'} | Conductor: ${ins.conductorNombre || conductorNombre || 'N/A'} | Resultado: ${ins.resultado} | Firma: ${ins.firmaConductor ? 'FIRMADO' : 'PENDIENTE'}`
    ).join('\n') || '[Sin inspecciones registradas]';

    const promptText = `
${headerHTML}
Eres un Experto Técnico Senior en Seguridad Vial y Seguridad y Salud en el Trabajo (SST), especializado en el Plan Estratégico de Seguridad Vial (PESV) colombiano.
Tu objetivo es redactar un **INFORME DE CONTROL OPERACIONAL Y HOJA DE VIDA DE VEHÍCULO** estructurado y profesional.

**DATOS DEL VEHÍCULO:**
- Placa: ${placa}
- Marca / Referencia: ${marca} ${referencia || ''}
- Modelo / Año: ${modelo} / ${anio || 'N/A'}
- Tipo de Vehículo: ${tipo || 'No especificado'}
- Conductor Asignado: ${conductorNombre || 'No asignado'}
- Kilometraje Actual: ${kilometrajeActual || 'N/A'}

**VENCIMIENTOS LEGALES:**
- SOAT Vencimiento: ${soatVencimiento || 'N/A'}
- Revisión Técnico-Mecánica Vencimiento: ${tecnomecanicaVencimiento || 'N/A'}
- Mantenimiento: Último: ${ultimoMantenimiento || 'N/A'} | Próximo: ${proximoMantenimiento || 'N/A'}

**HISTORIAL DE INSPECCIONES PRE-OPERACIONALES:**
${inspectionsStr}

**INSTRUCCIONES DE REDACCIÓN:**
1. Genera un informe técnico completo en formato HTML que continúe después del encabezado anterior.
2. Usa tablas HTML estructuradas y estilos CSS inline modernos y profesionales (sin repetir etiquetas HTML o HEAD, solo estructura de cuerpo o contenedores div y table).
3. Incluye las siguientes secciones:
   - **Diagnóstico General de Cumplimiento**: Evaluación del estado documental del vehículo (SOAT, RTM, mantenimientos).
   - **Auditoría de Inspecciones**: Análisis de los registros de inspecciones diarias e indicación de si existen hallazgos críticos de seguridad (ej. inspecciones rechazadas).
   - **Plan de Acción y Recomendaciones (PESV)**: Medidas preventivas de seguridad vial tanto para la organización como para el conductor asignado.
4. NUNCA inventes inspecciones, placas, fechas o firmas que no estén listados en los datos.
`;

    const result = await generateWithKeyRotation(finalModelName, req.user.id, promptText);
    res.json({ report: result.response.text() });
  } catch (error) {
    logger.error('[SGSST Vehicles Generate] Error:', error);
    res.status(500).json({ error: error.message || 'Error al generar informe del vehículo' });
  }
});

module.exports = router;
