const express = require('express');
const requireJwtAuth = require('../../middleware/requireJwtAuth');
const { buildStandardHeader, buildSignatureSection } = require('./reportHeader');
const { logger } = require('~/config');
const mongoose = require('mongoose');
const CompanyInfo = require('../../../models/CompanyInfo');

const router = express.Router();

// ─── Helper: Obtener Empresa Activa ──────────────────────────────────────────
async function getActiveCompanyId(userId) {
    let active = await CompanyInfo.findOne({ user: userId, isActive: true });
    if (!active) active = await CompanyInfo.findOne({ user: userId });
    return active ? active._id : null;
}

const SesionCapacitacionSchema = new mongoose.Schema({
  id: { type: String, required: true },
  tema: { type: String, required: true },
  fecha: { type: String, required: true },
  hora: { type: String, default: '' },
  duracion: { type: String, default: '' },
  responsable: { type: String, default: '' },
  descripcion: { type: String, default: '' },
  estado: { type: String, enum: ['Programada', 'Completada', 'Cancelada'], default: 'Programada' },
  trabajadoresRegistrados: { type: Array, default: [] }, // Array of objects { nombre, cedula, cargo, asistio }
  evidencias: { type: Array, default: [] }, // Array of base64 images
  createdAt: { type: Date, default: Date.now },
});

const ProgramaCapacitacionesDataSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'CompanyInfo', required: false },
  sesiones: [SesionCapacitacionSchema],
  planPersonalizado: { type: Array, default: [] }, // [{ workerId, capId, estado, fechaProgramada, fechaCompletada, sesionId }]
  updatedAt: { type: Date, default: Date.now },
});

ProgramaCapacitacionesDataSchema.index({ user: 1, companyId: 1 }, { unique: true });

const ProgramaCapacitacionesData = mongoose.models.ProgramaCapacitacionesData || 
  mongoose.model('ProgramaCapacitacionesData', ProgramaCapacitacionesDataSchema);

router.get('/data', requireJwtAuth, async (req, res) => {
  try {
    const companyId = await getActiveCompanyId(req.user.id);
    const data = await ProgramaCapacitacionesData.findOne({ user: req.user.id, companyId: companyId });
    if (data) {
      return res.json({ sesiones: data.sesiones || [] });
    }
    return res.json({ sesiones: [] });
  } catch (error) {
    logger.error('[SGSST Capacitaciones] Load error:', error);
    res.status(500).json({ error: 'Error al cargar cronograma de capacitaciones' });
  }
});

router.post('/save', requireJwtAuth, async (req, res) => {
  try {
    const { sesiones } = req.body;
    const companyId = await getActiveCompanyId(req.user.id);
    await ProgramaCapacitacionesData.findOneAndUpdate(
      { user: req.user.id, companyId: companyId },
      { $set: { sesiones: sesiones || [], companyId, updatedAt: Date.now() } },
      { upsert: true, new: true }
    );
    res.json({ success: true });
  } catch (error) {
    logger.error('[SGSST Capacitaciones] Save error:', error);
    res.status(500).json({ error: 'Error al guardar cronograma' });
  }
});

router.post('/generate-acta', requireJwtAuth, async (req, res) => {
  try {
    const { sesion } = req.body;
    if (!sesion) return res.status(400).json({ error: 'Sesion faltante' });

    let loadedCompanyInfo = null;
    try {
      loadedCompanyInfo = await CompanyInfo.findOne({ user: req.user.id }).lean();
    } catch (e) {
      logger.warn('Failed to load company info for Acta');
    }

    const headerHTML = buildStandardHeader({
      title: 'ACTA DE CAPACITACIÓN Y ENTRENAMIENTO EN SST',
      companyInfo: loadedCompanyInfo,
      date: new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' }),
      norm: 'Decreto 1072 de 2015 (Art. 2.2.4.6.11) / Resolución 0312 de 2019',
      responsibleName: req.user?.name
    });

    let htmlBody = `
      <div style="border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden; margin-bottom: 25px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr>
            <th style="background: #0f766e; color: #fff; padding: 10px;text-align: left; width: 30%;">TEMA TRATADO</th>
            <td style="padding: 10px; background: #f8fafc; color: #334155; font-weight: bold;">${sesion.tema || 'N/A'}</td>
          </tr>
          <tr>
            <th style="background: #0f766e; color: #fff; padding: 10px;text-align: left;">FECHA Y HORA</th>
            <td style="padding: 10px; color: #334155;">${sesion.fecha || ''} ${sesion.hora ? '- ' + sesion.hora : ''}</td>
          </tr>
          <tr>
            <th style="background: #0f766e; color: #fff; padding: 10px;text-align: left;">DURACIÓN</th>
            <td style="padding: 10px; background: #f8fafc; color: #334155;">${sesion.duracion || 'N/A'}</td>
          </tr>
          <tr>
            <th style="background: #0f766e; color: #fff; padding: 10px;text-align: left;">CAPACITADOR / RESPONSABLE</th>
            <td style="padding: 10px; color: #334155; font-weight: bold;">${sesion.responsable || 'N/A'}</td>
          </tr>
          <tr>
            <th style="background: #0f766e; color: #fff; padding: 10px;text-align: left;">OBJETIVO / DESCRIPCIÓN</th>
            <td style="padding: 10px; background: #f8fafc; color: #334155; line-height: 1.5;">${sesion.descripcion || 'Sin descripción'}</td>
          </tr>
        </table>
      </div>
      
      <h3 style="color: #0f766e; font-size: 16px; margin-bottom: 10px; border-bottom: 2px solid #0f766e; padding-bottom: 5px;">REGISTRO DE ASISTENCIA Y APROBACIÓN</h3>
      <table style="width: 100%; border-collapse: collapse; border: 1px solid #cbd5e1; font-size: 11px; text-align: center; margin-bottom: 30px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
        <thead>
          <tr style="background: #0f766e; color: white;">
            <th style="padding: 8px; border-bottom: 1px solid #1e40af;">N°</th>
            <th style="padding: 8px; border-bottom: 1px solid #1e40af; text-align: left;">NOMBRE COMPLETO</th>
            <th style="padding: 8px; border-bottom: 1px solid #1e40af;">CÉDULA</th>
            <th style="padding: 8px; border-bottom: 1px solid #1e40af; text-align: left;">CARGO</th>
            <th style="padding: 8px; border-bottom: 1px solid #1e40af;">ASISTIÓ</th>
            <th style="padding: 8px; border-bottom: 1px solid #1e40af;">FIRMA DIGITAL</th>
          </tr>
        </thead>
        <tbody>
    `;

    const trabajadores = sesion.trabajadoresRegistrados || [];
    if (trabajadores.length === 0) {
      htmlBody += `<tr><td colspan="6" style="padding: 15px; color: #64748b;">No hay trabajadores registrados en esta sesión.</td></tr>`;
    } else {
      trabajadores.forEach((t, i) => {
        const bg = i % 2 === 0 ? '#ffffff' : '#f8fafc';
        htmlBody += `
          <tr style="background-color: ${bg}; border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px; color: #334155;">${i + 1}</td>
            <td style="padding: 10px; font-weight: bold; text-align: left; color: #1e293b;">${t.nombre || 'N/A'}</td>
            <td style="padding: 10px; color: #334155;">${t.cedula || 'N/A'}</td>
            <td style="padding: 10px; text-align: left; color: #334155;">${t.cargo || 'N/A'}</td>
            <td style="padding: 10px;">${t.asistio ? '✅ SÍ' : '❌ NO'}</td>
            <td style="padding: 10px; min-width: 150px; min-height: 50px; vertical-align: middle;">
              ${t.asistio ? `<div class="signature-placeholder" data-signature-id="dyn_asistente_${i}" style="border-bottom: 1px dashed #94a3b8; height: 35px; width: 80%; margin: 0 auto; display: flex; align-items: center; justify-content: center; cursor: pointer;"><span style="color: #cbd5e1; font-size: 10px;">Clic para insertar firma</span></div>` : '<span style="color: #cbd5e1;">Ausente</span>'}
            </td>
          </tr>
        `;
      });
    }

    htmlBody += `
        </tbody>
      </table>
    `;

    // Evidencias (fotos)
    let imagesHtml = '';
    const evidencias = sesion.evidencias || [];
    if (evidencias.length > 0) {
      imagesHtml = `
        <div style="margin-top: 30px; margin-bottom: 20px; page-break-inside: avoid;">
          <h3 style="color: #0f766e; border-bottom: 2px solid #0f766e; padding-bottom: 5px; font-size: 15px;">ANEXO: EVIDENCIA FOTOGRÁFICA</h3>
          <div style="display: flex; gap: 15px; flex-wrap: wrap; margin-top: 15px;">`;
      
      evidencias.forEach((src, i) => {
        imagesHtml += `
          <div style="flex: 1; min-width: 250px; text-align: center; border: 1px solid #cbd5e1; padding: 10px; border-radius: 6px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
            <img src="${src}" style="width: 100%; height: auto; max-width: 300px; border-radius: 4px; object-fit: contain; margin-bottom: 5px;" alt="Evidencia ${i + 1}" />
            <br><span style="font-size: 11px; color: #64748b;">Evidencia ${i + 1} de capacitación</span>
          </div>
        `;
      });
      imagesHtml += `</div></div>`;
    }

    let fullReport = headerHTML + '<div style="margin-top: 20px;">' + htmlBody + '</div>' + imagesHtml;
    
    // Auto-inject Manager/SST signatures
    if (loadedCompanyInfo) {
      fullReport += buildSignatureSection(loadedCompanyInfo);
    }

    res.json({ report: fullReport });
  } catch (error) {
    logger.error('[SGSST Capacitaciones] Generate error:', error);
    res.status(500).json({ error: 'Error al generar acta de capacitación' });
  }
});

// ─── Catálogo de Capacitaciones SG-SST ──────────────────────────────────────
const CATALOGO_CAPACITACIONES = [
  { id: 'CAP-01', tema: 'Inducción y Reinducción SST', normativa: 'Res. 0312/2019', frecuencia: 'Anual', aplicaTodos: true },
  { id: 'CAP-02', tema: 'Identificación de Peligros (GTC 45)', normativa: 'Decreto 1072/2015', frecuencia: 'Anual', aplicaTodos: true },
  { id: 'CAP-03', tema: 'Uso y Mantenimiento de EPP', normativa: 'Res. 1843/2025', frecuencia: 'Anual', aplicaTodos: false },
  { id: 'CAP-04', tema: 'Primeros Auxilios Básicos', normativa: 'Res. 0312/2019', frecuencia: 'Anual', aplicaTodos: false },
  { id: 'CAP-05', tema: 'Plan de Emergencias y Evacuación', normativa: 'NSR-10 / Decreto 1072', frecuencia: 'Semestral', aplicaTodos: true },
  { id: 'CAP-06', tema: 'Ergonomía y Pausas Activas', normativa: 'GTC 256', frecuencia: 'Anual', aplicaTodos: false },
  { id: 'CAP-07', tema: 'Trabajo en Alturas — Autorizado', normativa: 'Res. 4272/2021', frecuencia: 'Renovación', aplicaTodos: false },
  { id: 'CAP-08', tema: 'Trabajo en Alturas — Coordinador', normativa: 'Res. 4272/2021', frecuencia: 'Renovación', aplicaTodos: false },
  { id: 'CAP-09', tema: 'Espacios Confinados', normativa: 'Res. 0491/2020', frecuencia: 'Renovación', aplicaTodos: false },
  { id: 'CAP-10', tema: 'Riesgo Psicosocial y Estrés Laboral', normativa: 'Res. 2764/2022', frecuencia: 'Anual', aplicaTodos: false },
  { id: 'CAP-11', tema: 'Seguridad Vial (PESV)', normativa: 'Res. 40595/2015', frecuencia: 'Anual', aplicaTodos: false },
  { id: 'CAP-12', tema: 'Reporte de Actos y Condiciones Inseguras', normativa: 'Decreto 1072/2015', frecuencia: 'Anual', aplicaTodos: true },
  { id: 'CAP-13', tema: 'Manejo de Sustancias Químicas (GHS)', normativa: 'GTC 7 / NTC-ISO 11014', frecuencia: 'Anual', aplicaTodos: false },
  { id: 'CAP-14', tema: 'Manejo de Herramientas Eléctricas', normativa: 'RETIE 2013', frecuencia: 'Anual', aplicaTodos: false },
  { id: 'CAP-15', tema: 'Prevención y Control de Incendios', normativa: 'NFPA 10 / NTC 3808', frecuencia: 'Anual', aplicaTodos: false },
];

const ENTRENAMIENTO_TO_CAP = {
  'Inducción y Reinducción en SST': 'CAP-01',
  'Identificación de Peligros y Riesgos (GTC 45)': 'CAP-02',
  'Uso y Mantenimiento de EPP': 'CAP-03',
  'Primeros Auxilios Básicos': 'CAP-04',
  'Prevención y Control de Incendios (Extintores)': 'CAP-15',
  'Plan de Emergencias y Evacuación': 'CAP-05',
  'Ergonomía y Pausas Activas': 'CAP-06',
  'Manejo de Sustancias Químicas (GHS)': 'CAP-13',
  'Riesgo Psicosocial y Manejo del Estrés': 'CAP-10',
  'Seguridad Vial (PESV)': 'CAP-11',
  'Reporte de Actos y Condiciones Inseguras': 'CAP-12',
  'Trabajador Autorizado para Trabajo en Alturas': 'CAP-07',
  'Coordinador de Trabajo Seguro en Alturas': 'CAP-08',
  'Administrador del Programa de Protección Contra Caídas': 'CAP-08',
  'Trabajador Entrante para Espacios Confinados': 'CAP-09',
  'Vigía de Seguridad para Espacios Confinados': 'CAP-09',
  'Supervisor de Trabajo en Espacios Confinados': 'CAP-09',
  'Administrador de Programa para Espacios Confinados': 'CAP-09',
  'Manejo Seguro de Herramientas Eléctricas y Manuales': 'CAP-14',
  'Mantenimiento Preventivo de Equipos': 'CAP-14',
  'Buenas Prácticas de Manufactura (BPM)': 'CAP-13',
};

const BIOTAG_CONTRAINDICACIONES = {
  'Vertigo': ['CAP-07', 'CAP-08'],
  'Epilepsia': ['CAP-07', 'CAP-08'],
  'Cardiopatia': ['CAP-07'],
};

const BIOTAG_RECOMENDACIONES = {
  'Restriccion_Mental': 'CAP-10',
  'Lumbalgia': 'CAP-06', 'Hernia_Discal': 'CAP-06', 'No_Carga_Peso': 'CAP-06',
  'Restriccion_Hombro': 'CAP-06', 'Restriccion_Rodilla': 'CAP-06', 'No_Bipedestacion': 'CAP-06',
  'EPOC': 'CAP-13', 'Asma': 'CAP-13', 'Alergia_Quimica': 'CAP-13',
  'HTA': 'CAP-06', 'Hipoacusia': 'CAP-03',
};

function calcularTemasAplicables(worker, perfilCargo) {
  const capMap = {};

  // 1. Obligatorios para todos
  ['CAP-01', 'CAP-02', 'CAP-05', 'CAP-12'].forEach(id => {
    capMap[id] = { aplica: true, razon: 'Normativo — aplica a todos los trabajadores', excluida: false, prioridad: 'Alta' };
  });

  // 2. Por perfil de cargo
  if (perfilCargo) {
    (perfilCargo.entrenamientosSeleccionados || []).forEach(ent => {
      const capId = ENTRENAMIENTO_TO_CAP[ent];
      if (capId && !capMap[capId]) {
        capMap[capId] = { aplica: true, razon: `Perfil de Cargo: ${perfilCargo.nombreCargo}`, excluida: false, prioridad: 'Alta' };
      }
    });
    if ((perfilCargo.eppSeleccionados || []).length > 0 && !capMap['CAP-03']) {
      capMap['CAP-03'] = { aplica: true, razon: `EPP requerido en cargo: ${perfilCargo.nombreCargo}`, excluida: false, prioridad: 'Media' };
    }
  }

  // 3. Por BioTags Oráculo H1 — recomendaciones
  (worker.bioTagsIA || []).forEach(tag => {
    const capId = BIOTAG_RECOMENDACIONES[tag];
    if (capId && !capMap[capId]) {
      capMap[capId] = { aplica: true, razon: `Oráculo H1: ${tag} detectado`, excluida: false, prioridad: 'Alta' };
    }
  });

  // 4. Por BioTags — contraindicaciones (sobreescriben)
  (worker.bioTagsIA || []).forEach(tag => {
    const capIds = BIOTAG_CONTRAINDICACIONES[tag] || [];
    capIds.forEach(capId => {
      capMap[capId] = { aplica: false, razon: `Oráculo H1: CONTRAINDICADO — ${tag}`, excluida: true, prioridad: 'Alta' };
    });
  });

  // 5. Licencia de conducción → PESV
  if (worker.licenciaConduccion && !capMap['CAP-11']) {
    capMap['CAP-11'] = { aplica: true, razon: 'Conductor con licencia activa — Riesgo Vial', excluida: false, prioridad: 'Alta' };
  }

  // 6. Brigadista
  if (worker.esBrigadista && worker.esBrigadista !== 'No') {
    if (!capMap['CAP-04']) capMap['CAP-04'] = { aplica: true, razon: 'Brigadista activo — Primeros Auxilios obligatorio', excluida: false, prioridad: 'Alta' };
    if (!capMap['CAP-15']) capMap['CAP-15'] = { aplica: true, razon: 'Brigadista activo — Control de Incendios', excluida: false, prioridad: 'Alta' };
  }

  return CATALOGO_CAPACITACIONES.map(cat => ({
    capId: cat.id,
    ...(capMap[cat.id] || { aplica: false, razon: 'No aplica según perfil actual', excluida: false, prioridad: 'Baja' }),
  }));
}

// ─── GET /plan-trabajador ─────────────────────────────────────────────────────
router.get('/plan-trabajador', requireJwtAuth, async (req, res) => {
  try {
    const companyId = await getActiveCompanyId(req.user.id);

    // Dynamically retrieve models to avoid initialization timing issues
    const PerfilSocio = mongoose.models.PerfilSociodemograficoData || mongoose.model('PerfilSociodemograficoData');
    const PerfilCargo = mongoose.models.PerfilCargoData || mongoose.model('PerfilCargoData');
    const SgsstWorker = mongoose.models.SgsstWorker || mongoose.model('SgsstWorker');

    // Fetch all collections in parallel
    const [socioDoc, cargoDoc, programaDoc, sgsstWorkers] = await Promise.all([
      PerfilSocio.findOne({ user: req.user.id, companyId }).lean(),
      PerfilCargo.findOne({ user: req.user.id, companyId }).lean(),
      ProgramaCapacitacionesData.findOne({ user: req.user.id, companyId }).lean(),
      SgsstWorker.find({ user: req.user.id, companyId }).lean()
    ]);

    const legacyWorkers = socioDoc?.trabajadores || [];
    const perfilesCargo = cargoDoc?.perfilesList || [];
    const planPersonalizado = programaDoc?.planPersonalizado || [];
    
    // Combine legacy workers and SgsstWorkers, preferring SgsstWorkers as the source of truth
    const workerMap = new Map();
    
    // Add legacy workers first
    legacyWorkers.forEach(w => {
      workerMap.set(String(w.identificacion || w.id).trim(), { ...w, isLegacy: true });
    });
    
    // Overwrite/add new SgsstWorkers
    sgsstWorkers.forEach(w => {
      const docId = String(w.documento || w._id).trim();
      const existing = workerMap.get(docId) || {};
      workerMap.set(docId, {
        ...existing,
        ...w,
        id: w._id || w.id, // Ensure we have a valid ID for React
        nombre: w.nombre || existing.nombre,
        cargo: existing.cargo || '', // We will map perfilId later
        perfilId: w.perfilId || existing.perfilId,
        bioTagsIA: w.fitAlerts && w.fitAlerts.length > 0 ? w.fitAlerts : existing.bioTagsIA,
        aptitud: existing.aptitud || 'Sin evaluar'
      });
    });

    const trabajadores = Array.from(workerMap.values());

    console.log(`[DEBUG] GET /plan-trabajador -> userId: ${req.user.id}, companyId: ${companyId}`);
    console.log(`[DEBUG] socioDoc exists: ${!!socioDoc}, SgsstWorkers: ${sgsstWorkers.length}, Total combined: ${trabajadores.length}`);
    console.log(`[DEBUG] cargoDoc exists: ${!!cargoDoc}, perfilesCargo.length: ${perfilesCargo.length}`);

    // Build enriched plan per worker
    const trabajadoresConPlan = trabajadores.map(worker => {
      // Find matching cargo profile by cargo name OR perfilId
      const perfilCargo = perfilesCargo.find(
        p => (worker.perfilId && String(p.id) === String(worker.perfilId)) || 
             (p.nombreCargo && worker.cargo && p.nombreCargo.toLowerCase().trim() === worker.cargo.toLowerCase().trim())
      ) || null;

      // Ensure worker.cargo is set for the frontend if we found it via perfilId
      if (perfilCargo && !worker.cargo) {
        worker.cargo = perfilCargo.nombreCargo;
      }

      const temas = calcularTemasAplicables(worker, perfilCargo);

      // Merge with saved plan states
      const temasConEstado = temas.map(t => {
        const saved = planPersonalizado.find(p => p.workerId === worker.id && p.capId === t.capId);
        return {
          ...t,
          estado: saved?.estado || (t.aplica ? 'Pendiente' : 'NoAplica'),
          fechaProgramada: saved?.fechaProgramada || '',
          fechaCompletada: saved?.fechaCompletada || '',
          sesionId: saved?.sesionId || '',
        };
      });

      return {
        id: worker.id,
        nombre: worker.nombre,
        cargo: worker.cargo || 'Sin cargo',
        aptitud: worker.bioScoreIAAptitud || 'Sin evaluar',
        bioTagsIA: worker.bioTagsIA || [],
        perfilCargoId: perfilCargo?.id || null,
        temas: temasConEstado,
        completoPct: Math.round(
          (temasConEstado.filter(t => t.estado === 'Completada').length /
            Math.max(temasConEstado.filter(t => t.aplica).length, 1)) * 100
        ),
      };
    });

    // --- DEBUG: Find ALL workers for this user regardless of companyId
    const allUserWorkers = await SgsstWorker.find({ user: req.user.id }).select('_id nombre companyId documento').lean();

    res.json({
      trabajadores: trabajadoresConPlan,
      catalogo: CATALOGO_CAPACITACIONES,
      totalTrabajadores: trabajadoresConPlan.length,
      debugData: {
        userId: req.user.id,
        companyId,
        socioDocExists: !!socioDoc,
        rawTrabajadoresLength: legacyWorkers.length,
        cargoDocExists: !!cargoDoc,
        rawPerfilesLength: perfilesCargo.length,
        sgsstWorkersWithCompanyId: sgsstWorkers.length,
        allUserWorkers: allUserWorkers
      }
    });
  } catch (error) {
    logger.error('[SGSST CapacitacionesPlan] plan-trabajador error:', error);
    res.status(500).json({ error: 'Error al construir el plan de capacitaciones' });
  }
});

// ─── POST /save-plan ──────────────────────────────────────────────────────────
router.post('/save-plan', requireJwtAuth, async (req, res) => {
  try {
    const { planPersonalizado } = req.body;
    const companyId = await getActiveCompanyId(req.user.id);
    await ProgramaCapacitacionesData.findOneAndUpdate(
      { user: req.user.id, companyId },
      { $set: { planPersonalizado: planPersonalizado || [], companyId, updatedAt: Date.now() } },
      { upsert: true, new: true }
    );
    res.json({ success: true });
  } catch (error) {
    logger.error('[SGSST CapacitacionesPlan] save-plan error:', error);
    res.status(500).json({ error: 'Error al guardar el plan personalizado' });
  }
});

// ─── POST /generate-programa ──────────────────────────────────────────────────
router.post('/generate-programa', requireJwtAuth, async (req, res) => {
  try {
    const { modelName } = req.body;
    const companyId = await getActiveCompanyId(req.user.id);

    let companyInfo = null;
    try { companyInfo = await CompanyInfo.findOne({ user: req.user.id }).lean(); } catch (e) {}

    const [socioDoc, cargoDoc, programaDoc] = await Promise.all([
      mongoose.models.PerfilSociodemograficoData?.findOne({ user: req.user.id, companyId }).lean(),
      mongoose.models.PerfilCargoData?.findOne({ user: req.user.id, companyId }).lean(),
      ProgramaCapacitacionesData.findOne({ user: req.user.id, companyId }).lean(),
    ]);

    const trabajadores = socioDoc?.trabajadores || [];
    const perfilesCargo = cargoDoc?.perfilesList || [];
    const sesiones = programaDoc?.sesiones || [];

    const resumen = trabajadores.map(w => {
      const pc = perfilesCargo.find(p => p.nombreCargo?.toLowerCase() === w.cargo?.toLowerCase());
      const temas = calcularTemasAplicables(w, pc).filter(t => t.aplica).map(t => {
        const cat = CATALOGO_CAPACITACIONES.find(c => c.id === t.capId);
        return cat ? cat.tema : t.capId;
      });
      return `- ${w.nombre || 'N/A'} (${w.cargo || 'S/C'}) [${w.bioScoreIAAptitud || 'Sin evaluar'}]: ${temas.join(', ')}`;
    }).join('\n');

    const { generateWithKeyRotation } = require('./sgsstGemini');
    const preferredModel = modelName || (process.env.GOOGLE_MODELS || 'gemini-2.5-flash').split(',')[0].trim();

    const prompt = `Eres un experto en SG-SST Colombia. Genera el PROGRAMA ANUAL DE CAPACITACIÓN Y ENTRENAMIENTO en formato HTML premium según el Decreto 1072/2015 (Art. 2.2.4.6.11) y Res. 0312/2019.

EMPRESA: ${companyInfo?.companyName || 'N/A'} | NIT: ${companyInfo?.nit || 'N/A'} | AÑO: ${new Date().getFullYear()}

TRABAJADORES Y TEMAS ASIGNADOS:\n${resumen || 'Sin trabajadores registrados'}

SESIONES PROGRAMADAS: ${sesiones.length} sesiones en cronograma.

ESTRUCTURA OBLIGATORIA (incluye los 6 elementos del Decreto 1072):
1. OBJETIVOS del programa (prevención AT/EL, cumplimiento normativo)
2. ALCANCE (dependientes, contratistas, cooperados, en misión - Art. 2.2.4.6.11)
3. TEMAS OBLIGATORIOS por cargo y riesgo (tabla: tema, normativa, horas, frecuencia)
4. CRONOGRAMA ANUAL (tabla: tema x mes x responsable x modalidad)
5. RESPONSABLES (personal idóneo: ARL, SENA, externos certificados)
6. RECURSOS (presupuesto estimado, técnicos, humanos)
7. INDICADORES: Cobertura (%), Cumplimiento (%), Eficacia evaluada
8. MATRIZ POR TRABAJADOR (tabla: trabajador x temas asignados x estado)

DISEÑO: tablas elegantes, cabeceras #0f766e, tipografía clara. NO uses bloques de código. Devuelve solo HTML.`;

    const result = await generateWithKeyRotation(preferredModel, req.user.id, prompt);
    let htmlBody = result.response.text().replace(/```html\n?/g, '').replace(/```\n?/g, '').trim();

    const { buildStandardHeader, buildSignatureSection } = require('./reportHeader');
    const header = buildStandardHeader({
      title: `PROGRAMA ANUAL DE CAPACITACIÓN Y ENTRENAMIENTO SG-SST — ${new Date().getFullYear()}`,
      companyInfo,
      date: new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' }),
      norm: 'Decreto 1072/2015 Art. 2.2.4.6.11 — Resolución 0312/2019',
      responsibleName: req.user?.name,
    });

    let fullReport = header + '<div style="margin-top:20px;">' + htmlBody + '</div>';
    if (companyInfo) fullReport += buildSignatureSection(companyInfo);

    res.json({ report: fullReport });
  } catch (error) {
    logger.error('[SGSST CapacitacionesPlan] generate-programa error:', error);
    res.status(500).json({ error: 'Error al generar el programa anual' });
  }
});

module.exports = router;
