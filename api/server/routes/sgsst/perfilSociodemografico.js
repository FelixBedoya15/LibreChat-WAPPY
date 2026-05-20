const express = require('express');
const { generateWithKeyRotation, resolveApiKeys } = require('./sgsstGemini');
const router = express.Router();
const mongoose = require('mongoose');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { AuthKeys } = require('librechat-data-provider');
const { logger } = require('~/config');
const requireJwtAuth = require('~/server/middleware/requireJwtAuth');
const { getUserKey } = require('~/server/services/UserService');
const CompanyInfo = require('~/models/CompanyInfo');
const { buildStandardHeader, buildCompanyContextString, buildSignatureSection } = require('./reportHeader');


// ─── Helper: Obtener Empresa Activa ──────────────────────────────────────────
async function getActiveCompanyId(userId) {
    let active = await CompanyInfo.findOne({ user: userId, isActive: true });
    if (!active) active = await CompanyInfo.findOne({ user: userId });
    return active ? active._id : null;
}

// ─── Mongoose Schema ─────────────────────────────────────────────────
const WorkerEntrySchema = new mongoose.Schema({
  id: String,
  nombre: String,
  identificacion: String,
  edad: Number,
  genero: String,
  estadoCivil: String,
  nivelEscolaridad: String,
  direccion: String,
  telefono: String,
  cargo: String,
  fechaExamenMedico: String,
  fechaCursoAlturasAutorizado: String,
  fechaCursoAlturasCoordinador: String,
  diagnosticoMedico: String,
  recomendacionesMedicas: String,
  fechaSeguimiento: String,
  completedByAI: { type: Boolean, default: false },
  consentimientoFirmaDigital: { type: String, default: 'No' },
  firmaDigital: { type: String, default: null },
  // New extended sociodemographic fields
  emergenciaContacto: { type: String, default: '' },
  tipoSangre: { type: String, default: '' },
  enfermedades: { type: String, default: '' },
  medicamentos: { type: String, default: '' },
  fuma: { type: String, default: '' },
  alcohol: { type: String, default: '' },
  terapiaPsicologica: { type: String, default: '' },
  personasCargo: { type: mongoose.Schema.Types.Mixed, default: '' },
  estrato: { type: String, default: '' },
  vivienda: { type: String, default: '' },
  soatVencimiento: { type: String, default: '' },
  tecnicomecanicaVencimiento: { type: String, default: '' },
  licenciaSST: { type: String, default: '' },
  licenciaVencimiento: { type: String, default: '' },
  curso50h: { type: String, default: '' },
  curso20h: { type: String, default: '' },
  // Biomonitoring / Fisiología
  peso: { type: String, default: '' },
  talla: { type: String, default: '' },
  imc: { type: String, default: '' },
  presionArterial: { type: String, default: '' },
  frecuenciaCardiaca: { type: String, default: '' },
  limitacionesBiomecanicas: { type: String, default: '' },
  alergiasQuimicas: { type: String, default: '' },

  // Bio-Fit Engine (Índice Biocéntrico Integral)
  biocentricScore: { type: Number, default: 100 },
  biocentricAlerts: { type: Array, default: [] },
  biocentricIsLethal: { type: Boolean, default: false },

  // Conducción
  licenciaConduccion: { type: String, default: '' },
  licenciaConduccionVencimiento: { type: String, default: '' },

  // Comités SG-SST
  esCopasst: { type: String, default: 'No' },
  esComiteConvivencia: { type: String, default: 'No' },
  esBrigadista: { type: String, default: 'No' },
  esComiteSeguridadVial: { type: String, default: 'No' },

  // Formación
  formacion: { type: Array, default: [] },


  // Oráculo Predictivo H1 — Dictamen IA persistido
  dictamenPredictivoH1: { type: String, default: '' },

  // Análisis Semántico IA (Opción B)
  bioScoreIAVersion: { type: String, default: '' },     // hash de campos clínicos al momento de evaluar
  bioScoreIAReason: { type: String, default: '' },       // justificación corta
  bioScoreIADate: { type: Date, default: null },         // fecha de última evaluación IA
  bioTagsIA: { type: Array, default: [] },               // etiquetas clínicas detectadas por la IA (ej: ['Lumbalgia', 'Estrés Moderado'])
  bioScoreIAAptitud: { type: String, default: '' },      // "Apto", "Apto con Restricciones", "No Apto"
}, { _id: false });

const PerfilSociodemograficoDataSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'CompanyInfo', required: false },
  trabajadores: [WorkerEntrySchema],
  actualizacionesPendientes: { type: Array, default: [] },
  actualizacionesPendientesSalud: { type: Array, default: [] },
  updatedAt: { type: Date, default: Date.now },
});

PerfilSociodemograficoDataSchema.index({ user: 1, companyId: 1 }, { unique: true });

const PerfilSociodemograficoData = mongoose.models.PerfilSociodemograficoData || mongoose.model('PerfilSociodemograficoData', PerfilSociodemograficoDataSchema);

// ─── Helper: Get API Key ─────────────────────────────────────────────
async function getApiKey(userId) {
  let resolvedApiKey;
  try {
    const storedKey = await getUserKey({ userId, name: 'google' });
    try {
      const parsed = JSON.parse(storedKey);
      resolvedApiKey = parsed[AuthKeys.GOOGLE_API_KEY] || parsed.GOOGLE_API_KEY;
    } catch {
      resolvedApiKey = storedKey;
    }
  } catch {
    logger.debug('[SGSST PerfilSociodemografico] No user Google key, trying env');
  }
  if (!resolvedApiKey) {
    resolvedApiKey = process.env.GOOGLE_KEY || process.env.GEMINI_API_KEY;
  }
  if (resolvedApiKey && typeof resolvedApiKey === 'string') {
    resolvedApiKey = resolvedApiKey.split(',')[0].trim();
  }
  return resolvedApiKey;
}

// ─── GET /profile/:workerId — Public profile page (for QR scanning) ──────────
// No JWT required — designed to be publicly accessible via QR code scan
router.get('/profile/:workerId', async (req, res) => {
  try {
    const { workerId } = req.params;
    const { type } = req.query; // 'health' or default

    // Search across all users' data for this worker ID
    const allData = await PerfilSociodemograficoData.find({}).lean();
    let worker = null;
    for (const doc of allData) {
      const found = (doc.trabajadores || []).find(t => t.id === workerId);
      if (found) { worker = found; break; }
    }

    if (!worker) {
      return res.status(404).send('<!DOCTYPE html><html><body style="font-family:system-ui;text-align:center;padding:40px;"><h2>Perfil no encontrado</h2><p>El trabajador con ID <strong>' + workerId + '</strong> no existe o fue eliminado.</p></body></html>');
    }

    const mapsLink = worker.direccion
      ? 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(worker.direccion)
      : null;

    const isHealth = type === 'health';
    const profileTitle = isHealth ? 'Historial Clínico Ocupacional' : 'Perfil Sociodemográfico';
    const nameStr = worker.nombre || 'Sin Nombre';

    let html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${profileTitle}: ${nameStr}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: system-ui, -apple-system, sans-serif; background: #f1f5f9; color: #0f172a; padding: 16px; min-height: 100vh; }
  .card { background: white; border-radius: 20px; padding: 28px 24px; box-shadow: 0 8px 32px rgba(0,0,0,0.10); max-width: 440px; margin: 0 auto; }
  .header { text-align: center; padding-bottom: 20px; margin-bottom: 20px; border-bottom: 2px solid #e2e8f0; }
  .avatar { width: 64px; height: 64px; border-radius: 50%; background: linear-gradient(135deg,${isHealth ? '#0d9488,#0f766e' : '#0ea5e9,#6366f1'}); display: flex; align-items: center; justify-content: center; font-size: 28px; font-weight: 800; color: white; margin: 0 auto 12px; }
  h1 { font-size: 22px; font-weight: 800; color: ${isHealth ? '#115e59' : '#1e40af'}; line-height: 1.2; margin-bottom: 6px; }
  .badge { display: inline-block; background: ${isHealth ? '#ccfbf1' : '#dbeafe'}; color: ${isHealth ? '#0f766e' : '#0f766e'}; padding: 5px 14px; border-radius: 999px; font-size: 12px; font-weight: 700; letter-spacing: 0.04em; }
  .section { margin-bottom: 18px; }
  .section-title { font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 10px; padding-bottom: 6px; border-bottom: 1px solid #f1f5f9; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .field { background: #f8fafc; border-radius: 10px; padding: 10px 12px; }
  .field-full { background: #f8fafc; border-radius: 10px; padding: 10px 12px; grid-column: span 2; }
  .field .label, .field-full .label { font-size: 10px; font-weight: 600; color: #94a3b8; text-transform: uppercase; display: block; margin-bottom: 3px; }
  .field .value, .field-full .value { font-size: 14px; font-weight: 700; color: #1e293b; }
  
  .dates-box { background: ${isHealth ? '#fff1f2' : '#fffbeb'}; border: 1px solid ${isHealth ? '#fecdd3' : '#fde68a'}; border-radius: 12px; padding: 14px; }
  .date-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; padding: 8px 0; border-bottom: 1px dashed ${isHealth ? '#fecdd3' : '#fde68a'}; }
  .date-row:last-child { border-bottom: none; padding-bottom: 0; }
  .date-label { font-size: 12px; color: ${isHealth ? '#9f1239' : '#92400e'}; font-weight: 600; flex: 1; }
  .date-value { font-size: 13px; color: ${isHealth ? '#881337' : '#78350f'}; font-weight: 800; white-space: nowrap; }
  .maps-btn { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; padding: 14px; background: linear-gradient(135deg, #2563eb, #4f46e5); color: white; text-align: center; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 15px; margin-top: 20px; transition: opacity 0.2s; }
  .maps-btn:hover { opacity: 0.9; }
  .footer { text-align: center; margin-top: 20px; font-size: 11px; color: #94a3b8; }
</style>
</head>
<body>
<div class="card">
  <div class="header">
    <div class="avatar">${nameStr.charAt(0).toUpperCase()}</div>
    <div style="font-size:10px; font-weight:bold; color:#64748b; letter-spacing:1px; text-transform:uppercase; margin-bottom:4px;">${profileTitle}</div>
    <h1>${nameStr}</h1>
    <span class="badge">${worker.cargo || 'Sin Cargo'}</span>
  </div>

  ${isHealth ? `
  <!-- ================= TARJETA DE EMERGENCIA ================= -->

  <!-- ALERTA CRÍTICA DE EMERGENCIA -->
  <div style="background: linear-gradient(135deg, #dc2626, #b91c1c); border-radius: 14px; padding: 16px; margin-bottom: 18px; color: white;">
    <div style="font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; opacity: 0.85; margin-bottom: 10px;">⚠️ Información de Emergencia</div>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
      <div>
        <div style="font-size: 10px; font-weight: 600; opacity: 0.75; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 3px;">Tipo de Sangre</div>
        <div style="font-size: 22px; font-weight: 900;">${worker.tipoSangre || '—'}</div>
      </div>
      <div>
        <div style="font-size: 10px; font-weight: 600; opacity: 0.75; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 3px;">Teléfono</div>
        <div style="font-size: 16px; font-weight: 800;">${worker.telefono || '—'}</div>
      </div>
    </div>
    ${worker.emergenciaContacto ? `
    <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.25);">
      <div style="font-size: 10px; font-weight: 600; opacity: 0.75; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 3px;">📞 Contacto de Emergencia</div>
      <div style="font-size: 15px; font-weight: 800;">${worker.emergenciaContacto}</div>
    </div>` : ''}
  </div>

  <!-- ALERTAS MÉDICAS -->
  ${(worker.alergiasQuimicas || worker.limitacionesBiomecanicas || worker.enfermedades || worker.medicamentos) ? `
  <div class="section">
    <div class="section-title" style="color: #dc2626;">🚨 Alertas Médicas</div>
    <div class="grid">
      ${worker.alergiasQuimicas ? `
      <div class="field-full" style="background:#fff1f2; border: 1px solid #fecdd3;">
        <span class="label" style="color:#e11d48;">Alergias Químicas</span>
        <span class="value" style="color:#9f1239;">${worker.alergiasQuimicas}</span>
      </div>` : ''}
      ${worker.limitacionesBiomecanicas ? `
      <div class="field-full" style="background:#fff7ed; border: 1px solid #fed7aa;">
        <span class="label" style="color:#c2410c;">Restricciones / Limitaciones</span>
        <span class="value" style="color:#9a3412;">${worker.limitacionesBiomecanicas}</span>
      </div>` : ''}
      ${worker.enfermedades ? `
      <div class="field-full">
        <span class="label">Enfermedades Preexistentes</span>
        <span class="value">${worker.enfermedades}</span>
      </div>` : ''}
      ${worker.medicamentos ? `
      <div class="field-full">
        <span class="label">Medicamentos de Consumo</span>
        <span class="value">${worker.medicamentos}</span>
      </div>` : ''}
    </div>
  </div>` : ''}

  <!-- CARGO Y PROFESION -->
  <div class="section">
    <div class="section-title">💼 Cargo y Perfil Profesional</div>
    <div class="grid">
      <div class="field-full"><span class="label">Cargo</span><span class="value">${worker.cargo || '—'}</span></div>
      <div class="field"><span class="label">Cédula</span><span class="value">${worker.identificacion || '—'}</span></div>
      <div class="field"><span class="label">Dirección Domicilio</span><span class="value">${worker.direccion || '—'}</span></div>
    </div>
  </div>

  <!-- CAPACITACIONES Y CERTIFICACIONES -->
  <div class="section">
    <div class="section-title">🎓 Capacitaciones y Certificaciones</div>
    <div class="dates-box">
      <div class="date-row">
        <span class="date-label">Alturas — Trab. Autorizado</span>
        <span class="date-value">${worker.fechaCursoAlturasAutorizado || 'N/A'}</span>
      </div>
      <div class="date-row">
        <span class="date-label">Alturas — Coordinador</span>
        <span class="date-value">${worker.fechaCursoAlturasCoordinador || 'N/A'}</span>
      </div>
      ${worker.fechaExamenMedico ? `
      <div class="date-row">
        <span class="date-label">Examen Médico Ocupacional</span>
        <span class="date-value">${worker.fechaExamenMedico}</span>
      </div>` : ''}
      ${worker.licenciaSST ? `
      <div class="date-row">
        <span class="date-label">Licencia SST</span>
        <span class="date-value">${worker.licenciaSST}</span>
      </div>` : ''}
      ${worker.curso50h ? `
      <div class="date-row">
        <span class="date-label">Curso 50 Horas</span>
        <span class="date-value">${worker.curso50h}</span>
      </div>` : ''}
      ${worker.curso20h ? `
      <div class="date-row">
        <span class="date-label">Curso 20 Horas</span>
        <span class="date-value">${worker.curso20h}</span>
      </div>` : ''}
    </div>
  </div>

  <!-- COMITÉS SGSST -->
  ${(worker.esCopasst && worker.esCopasst !== 'No') || (worker.esComiteConvivencia && worker.esComiteConvivencia !== 'No') || (worker.esBrigadista && worker.esBrigadista !== 'No') || (worker.esComiteSeguridadVial && worker.esComiteSeguridadVial !== 'No') ? `
  <div class="section">
    <div class="section-title">🛡️ Participación en Comités SG-SST</div>
    <div class="grid">
      ${(worker.esCopasst && worker.esCopasst !== 'No') ? `<div class="field"><span class="label">COPASST</span><span class="value" style="color:#0f766e;">${worker.esCopasst}</span></div>` : ''}
      ${(worker.esComiteConvivencia && worker.esComiteConvivencia !== 'No') ? `<div class="field"><span class="label">Comité Convivencia</span><span class="value" style="color:#0f766e;">${worker.esComiteConvivencia}</span></div>` : ''}
      ${(worker.esBrigadista && worker.esBrigadista !== 'No') ? `<div class="field"><span class="label">Brigadista</span><span class="value" style="color:#0f766e;">${worker.esBrigadista}</span></div>` : ''}
      ${(worker.esComiteSeguridadVial && worker.esComiteSeguridadVial !== 'No') ? `<div class="field"><span class="label">Comité Seg. Vial</span><span class="value" style="color:#0f766e;">${worker.esComiteSeguridadVial}</span></div>` : ''}
    </div>
  </div>` : ''}
  
  ${mapsLink
        ? `<a href="${mapsLink}" class="maps-btn" target="_blank" rel="noopener noreferrer">
             <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
             </svg>
             Ver Dirección en Google Maps
           </a>`
        : ''
      }
  ` : `
  <!-- ================= VISTA SOCIODEMOGRÁFICA ================= -->
  <div class="section">
    <div class="section-title">Información Personal</div>
    <div class="grid">
      <div class="field"><span class="label">Cédula</span><span class="value">${worker.identificacion || '—'}</span></div>
      <div class="field"><span class="label">Edad</span><span class="value">${worker.edad ? worker.edad + ' años' : '—'}</span></div>
      <div class="field"><span class="label">Género</span><span class="value">${worker.genero || '—'}</span></div>
      <div class="field"><span class="label">Estado Civil</span><span class="value">${worker.estadoCivil || '—'}</span></div>
      <div class="field"><span class="label">Escolaridad</span><span class="value">${worker.nivelEscolaridad || '—'}</span></div>
      <div class="field"><span class="label">Teléfono</span><span class="value">${worker.telefono || '—'}</span></div>
      <div class="field-full"><span class="label">Contacto de Emergencia</span><span class="value">${worker.emergenciaContacto || '—'}</span></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Información Socioeconómica</div>
    <div class="grid">
        <div class="field"><span class="label">Vivienda</span><span class="value">${worker.vivienda || '—'}</span></div>
        <div class="field"><span class="label">Estrato</span><span class="value">${worker.estrato || '—'}</span></div>
        <div class="field-full"><span class="label">Personas a Cargo</span><span class="value">${worker.personasCargo !== undefined && worker.personasCargo !== '' ? worker.personasCargo : '—'}</span></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Certificaciones Operativas</div>
    <div class="dates-box">
      <div class="date-row">
        <span class="date-label">Alturas — Trab. Autorizado</span>
        <span class="date-value">${worker.fechaCursoAlturasAutorizado || 'N/A'}</span>
      </div>
      <div class="date-row">
        <span class="date-label">Alturas — Coordinador</span>
        <span class="date-value">${worker.fechaCursoAlturasCoordinador || 'N/A'}</span>
      </div>
      <div class="date-row" style="border-top: 1px solid #fde68a;">
        <span class="date-label">Consentimiento Firma Digital</span>
        <span class="date-value">${worker.consentimientoFirmaDigital === 'Sí' ? 'Autorizado' : 'No Autorizado'}</span>
      </div>
      ${worker.consentimientoFirmaDigital === 'Sí' && worker.firmaDigital ? `
      <div style="margin-top: 15px; text-align: center;">
        <span style="display: block; font-size: 11px; color: #64748b; margin-bottom: 5px; text-transform: uppercase;">Firma Registrada</span>
        <img src="${worker.firmaDigital}" alt="Firma del trabajador" style="max-height: 80px; max-width: 100%; border-bottom: 1px solid #cbd5e1; padding-bottom: 5px;" />
      </div>` : ''}
    </div>
  </div>

  ${mapsLink
        ? `<a href="${mapsLink}" class="maps-btn" target="_blank" rel="noopener noreferrer">
        📍 Ver Dirección en Google Maps
      </a>`
        : `<div style="text-align:center;padding:14px;background:#f1f5f9;border-radius:12px;margin-top:20px;color:#94a3b8;font-size:13px;font-weight:600;">Sin dirección registrada</div>`
  }`}

  <div class="footer">Perfil generado por SGSST · WAPPY IA</div>
</div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (error) {
    logger.error('[SGSST PerfilSociodemografico] Profile page error:', error);
    res.status(500).send('Error al cargar perfil');
  }
});

// ─── GET /data — Load saved worker data ─────────────────────────────
router.get('/data', requireJwtAuth, async (req, res) => {
  try {
    const companyId = await getActiveCompanyId(req.user.id);
    const data = await PerfilSociodemograficoData.findOne({ user: req.user.id, companyId: companyId });
    if (data) {
      return res.json({
        trabajadores: data.trabajadores || [],
        actualizacionesPendientes: data.actualizacionesPendientes || [],
        actualizacionesPendientesSalud: data.actualizacionesPendientesSalud || []
      });
    } else {
      res.json({ trabajadores: [], actualizacionesPendientes: [], actualizacionesPendientesSalud: [] });
    }
  } catch (error) {
    logger.error('[SGSST PerfilSociodemografico] Load error:', error);
    res.status(500).json({ error: 'Error al cargar datos' });
  }
});

// ─── Helper: Clinical Hash — compares only the text fields the AI analyzes ────
function buildClinicalHash(w) {
  const crypto = require('crypto');
  const fields = [
    w.limitacionesBiomecanicas, w.recomendacionesMedicas, w.diagnosticoMedico,
    w.enfermedades, w.alergiasQuimicas, w.medicamentos, w.cargo
  ].map(v => String(v || '')).join('|');
  return crypto.createHash('md5').update(fields).digest('hex');
}

/**
 * ─── Semantic Tagging via IA ─────────────────────────────────────────────────
 * The AI only reads complex medical text (restrictions, diagnoses, recommendations)
 * and returns structured semantic tags. ALL math (scoring, multipliers) is done
 * by the deterministic system in the frontend (calcFit).
 */
async function runIASemanticTagging(worker, userId) {
  const textFields = [
    worker.limitacionesBiomecanicas,
    worker.recomendacionesMedicas,
    worker.diagnosticoMedico,
    worker.enfermedades,
    worker.alergiasQuimicas,
    worker.medicamentos
  ].filter(v => v && String(v).trim().length > 2 && !String(v).toLowerCase().includes('ninguna') && !String(v).toLowerCase().includes('ninguno'));

  // If all text fields are empty/null, no need to call IA
  if (textFields.length === 0) {
    return { tags: [], razon: 'Sin hallazgos clínicos complejos en texto libre.', aptitud: 'Apto' };
  }

  const prompt = `Eres un médico ocupacional experto del sistema WAPPY. Analiza el siguiente perfil clínico de un trabajador y extrae etiquetas clínicas estandarizadas.

PERFIL DEL TRABAJADOR (${worker.nombre || 'Sin nombre'} — Cargo: ${worker.cargo || 'N/D'}):
- Limitaciones Biomecánicas: "${worker.limitacionesBiomecanicas || 'Ninguna'}"
- Recomendaciones Médicas: "${worker.recomendacionesMedicas || 'Ninguna'}"
- Diagnóstico Médico: "${worker.diagnosticoMedico || 'Ninguno'}"
- Enfermedades Actuales: "${worker.enfermedades || 'Ninguna'}"
- Alergias/Sensibilidades Químicas: "${worker.alergiasQuimicas || 'Ninguna'}"
- Medicamentos actuales: "${worker.medicamentos || 'Ninguno'}"

TU TAREA:
Lee el texto libre de cada campo (aunque no use términos médicos exactos, ej: "dolor en la parte baja" = Lumbalgia) y clasifica cada hallazgo usando el siguiente catálogo de etiquetas:

ETIQUETAS DISPONIBLES (usa EXACTAMENTE estos nombres):
- "Lumbalgia" — dolor lumbar, dolor en la espalda baja, parte baja de la espalda, zona lumbar
- "Hernia_Discal" — hernia de disco, hernia discal, disco degenerado
- "Cervicalgia" — dolor cervical, cuello, nuca, parte superior de la espalda
- "Epicondilitis" — codo de tenista, dolor en el codo, epicondilo
- "Tunel_Carpiano" — túnel carpiano, muñeca, hormigueo en mano
- "Restriccion_Hombro" — manguito rotador, hombro, rotador
- "Restriccion_Rodilla" — rodilla, menisco, ligamento
- "No_Carga_Peso" — no levantar, no cargar, peso máximo, limitación de carga
- "No_Bipedestacion" — no estar de pie, no bipedestación prolongada
- "No_Sedestacion" — no sentarse mucho, no sedestación prolongada
- "Hipoacusia" — pérdida auditiva, hipoacusia, no ruido, protección auditiva
- "Vision_Reducida" — visión reducida, usa lentes, problema de visión
- "HTA" — hipertensión, presión alta, tensión arterial elevada
- "Cardiopatia" — cardiopatía, problema cardíaco, insuficiencia cardíaca, angina
- "Diabetes" — diabetes, glucosa elevada, resistencia a la insulina
- "Epilepsia" — epilepsia, convulsiones, crisis epiléptica
- "Vertigo" — vértigo, mareo, pérdida de equilibrio, no alturas
- "EPOC" — EPOC, bronquitis crónica, enfermedad pulmonar
- "Asma" — asma, dificultad respiratoria, broncoespasmo
- "Alergia_Quimica" — alergia a químicos, dermatitis química, sensibilidad química
- "Medicamento_SNC" — medicamento psiquiátrico, sedante, pastillas para dormir, ansiolítico, antidepresivo
- "Restriccion_Mental" — ansiedad, depresión, estrés severo, psicoterapia activa, no turno nocturno
- "Patologia_Cronica" — enfermedad crónica declarada no clasificada arriba
- "Diagnostico_Reciente" — diagnóstico reciente, nuevo diagnóstico, bajo seguimiento médico
- "Recomendacion_Leve" — pausas activas, fisioterapia, ergonomía, control médico periódico
- "Sin_Hallazgos" — todo normal, sin restricciones, ninguna, sin hallazgos

INSTRUCCIONES ESTRICTAS:
1. Incluye una etiqueta por CADA hallazgo real que encuentres en el texto.
2. Si el texto dice "sin restricciones" o similar, devuelve solo ["Sin_Hallazgos"].
3. Redacta una "razon" profesional de 2-3 líneas explicando los hallazgos clínicos.
4. Determina la "aptitud" global: "Apto", "Apto con Restricciones" o "No Apto".

Responde ÚNICAMENTE con JSON válido (sin markdown, sin texto extra):
{
  "tags": ["Etiqueta1", "Etiqueta2"],
  "razon": "<Texto médico-profesional aquí>",
  "aptitud": "<Apto | Apto con Restricciones | No Apto>"
}`;

  const { generateWithKeyRotation } = require('./sgsstGemini');
  const preferredModel = (process.env.GOOGLE_MODELS || 'gemini-2.5-flash').split(',')[0].trim();
  const result = await generateWithKeyRotation(preferredModel, userId, prompt);
  let text = result.response.text().trim().replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(text);
}

// ─── Helper: Evaluate all workers in a doc using IA tagging ─────────────────
async function triggerIAEvaluation(userId, workerId, apiKey, perfilesList) {
  try {
    const companyId = await getActiveCompanyId(userId);
    const doc = await PerfilSociodemograficoData.findOne({ user: userId, companyId });
    if (!doc) return;
    const worker = (doc.trabajadores || []).find(w => w.id === workerId);
    if (!worker) return;

    const parsed = await runIASemanticTagging(worker, userId);
    const newHash = buildClinicalHash(worker);
    const workerIndex = doc.trabajadores.findIndex(w => w.id === workerId);
    if (workerIndex !== -1) {
      const cur = doc.trabajadores[workerIndex]._doc || doc.trabajadores[workerIndex];
      doc.trabajadores[workerIndex] = {
        ...cur,
        bioTagsIA: parsed.tags || [],
        bioScoreIAReason: parsed.razon || '',
        bioScoreIAAptitud: parsed.aptitud || '',
        bioScoreIAVersion: newHash,
        bioScoreIADate: new Date()
      };
      await doc.save();
      logger.info(`[OraculoH1] IA tags generados para ${worker.nombre}: [${(parsed.tags || []).join(', ')}]`);
    }
    return doc.trabajadores[workerIndex];
  } catch (err) {
    logger.warn(`[OraculoH1] IA tagging failed for worker ${workerId}: ${err.message}`);
    return null;
  }
}

// ─── POST /save — Save worker data + run IA tagging synchronously ──────────
router.post('/save', requireJwtAuth, async (req, res) => {
  try {
    const { trabajadores } = req.body;
    if (!trabajadores) {
      return res.status(400).json({ error: 'Datos requeridos' });
    }

    const companyId = await getActiveCompanyId(req.user.id);

    // First save the raw data with recalculated bio-fit values
    const updatedWithBio = await recalculateAndSyncAllWorkers(req.user.id, companyId, trabajadores);

    await PerfilSociodemograficoData.findOneAndUpdate(
      { user: req.user.id, companyId: companyId },
      { $set: { trabajadores: updatedWithBio, companyId, updatedAt: new Date() } },
      { upsert: true, new: true }
    );

    // Sync basic health data to master SgsstWorker profile
    const SgsstWorker = require('../../../models/SgsstWorker');
    for (const w of updatedWithBio) {
      if (!w.identificacion) continue;
      const cleanDoc = String(w.identificacion).trim();
      if (!cleanDoc) continue;
      await SgsstWorker.updateOne(
        { user: req.user.id, companyId, documento: cleanDoc },
        {
          $set: {
            condicionesSalud: [w.enfermedades, w.diagnosticoMedico, w.limitacionesBiomecanicas].filter(Boolean).join('; ') || '',
            fechaNacimiento: w.fechaNacimiento || null,
            genero: w.genero || 'No especificado'
          }
        }
      );
    }

    // ── IA Semantic Tagging (synchronous — awaited so frontend gets results) ──
    // Only runs for workers whose complex text fields have changed
    let updatedWorkers = [...updatedWithBio];
    try {
      const apiKey = await getApiKey(req.user.id);
      if (apiKey) {
        const PerfilesCargo = mongoose.models.PerfilesCargoData;
        const cargoDoc = PerfilesCargo ? await PerfilesCargo.findOne({ user: req.user.id }).lean() : null;
        const perfilesList = cargoDoc?.perfilesList || [];

        // Re-fetch the saved doc to get current IA version hashes
        const savedDoc = await PerfilSociodemograficoData.findOne({ user: req.user.id, companyId }).lean();
        const savedWorkers = savedDoc?.trabajadores || [];

        const evalPromises = updatedWithBio.map(async (w) => {
          if (!w.id) return w;
          const currentHash = buildClinicalHash(w);
          const savedWorker = savedWorkers.find(sw => sw.id === w.id);
          const savedHash = savedWorker?.bioScoreIAVersion || '';
          // Only call IA if text fields changed
          if (currentHash !== savedHash) {
            const result = await runIASemanticTagging(w, req.user.id).catch(() => null);
            if (result) {
              const updated = {
                ...w,
                bioTagsIA: result.tags || [],
                bioScoreIAReason: result.razon || '',
                bioScoreIAAptitud: result.aptitud || '',
                bioScoreIAVersion: currentHash,
                bioScoreIADate: new Date()
              };
              logger.info(`[OraculoH1] IA tags generados para ${w.nombre}: [${(result.tags || []).join(', ')}]`);
              return updated;
            }
          }
          return { ...w, ...(savedWorker ? { bioTagsIA: savedWorker.bioTagsIA, bioScoreIAReason: savedWorker.bioScoreIAReason, bioScoreIAAptitud: savedWorker.bioScoreIAAptitud, bioScoreIAVersion: savedWorker.bioScoreIAVersion, bioScoreIADate: savedWorker.bioScoreIADate } : {}) };
        });

        updatedWorkers = await Promise.all(evalPromises);

        // Recalculate bio score again to reflect any newly generated IA tags
        updatedWorkers = await recalculateAndSyncAllWorkers(req.user.id, companyId, updatedWorkers);

        // Persist the IA tags and updated scores back to DB
        await PerfilSociodemograficoData.findOneAndUpdate(
          { user: req.user.id, companyId },
          { $set: { trabajadores: updatedWorkers, updatedAt: new Date() } },
          { new: true }
        );
      }
    } catch (iaErr) {
      logger.warn('[OraculoH1] IA tagging error (continuing without IA):', iaErr.message);
    }

    // Return the updated workers (with IA tags and biocentric scores) so frontend can refresh immediately
    res.json({ success: true, trabajadores: updatedWorkers });
  } catch (error) {
    logger.error('[SGSST PerfilSociodemografico] Save error:', error);
    res.status(500).json({ error: 'Error al guardar datos' });
  }
});

// ─── POST /evaluate-ia/:workerId — Force IA re-evaluation ───────────────
router.post('/evaluate-ia/:workerId', requireJwtAuth, async (req, res) => {
  try {
    const { workerId } = req.params;
    const apiKey = await getApiKey(req.user.id);
    if (!apiKey) return res.status(400).json({ error: 'No API Key configurada' });

    const PerfilesCargo = mongoose.models.PerfilesCargoData;
    const cargoDoc = PerfilesCargo ? await PerfilesCargo.findOne({ user: req.user.id }).lean() : null;
    const perfilesList = cargoDoc?.perfilesList || [];

    // Run async but wait for it in this case (manual trigger)
    await triggerIAEvaluation(req.user.id, workerId, apiKey, perfilesList);
    res.json({ success: true, message: 'Evaluación IA completada' });
  } catch (error) {
    logger.error('[OraculoH1] evaluate-ia error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ─── POST /inbox/approve ─────────────────────────────────────────────
router.post('/inbox/approve', requireJwtAuth, async (req, res) => {
  try {
    const { updateId, workerId, changes, inboxType } = req.body;
    if (!updateId || !workerId || !changes || !inboxType) return res.status(400).json({ error: 'Faltan parámetros' });

    const companyId = await getActiveCompanyId(req.user.id);
    const doc = await PerfilSociodemograficoData.findOne({ user: req.user.id, companyId: companyId });
    if (!doc) return res.status(404).json({ error: 'No se encontró la empresa' });

    // Encontrar y actualizar el trabajador
    const workerIndex = doc.trabajadores.findIndex(w => String(w.id) === String(workerId));
    if (workerIndex !== -1) {
      // Merge changes into the existing worker object
      const currentWorker = doc.trabajadores[workerIndex]._doc || doc.trabajadores[workerIndex];
      doc.trabajadores[workerIndex] = { ...currentWorker, ...changes };
    }

    // Remover la petición de la bandeja correspondiente
    if (inboxType === 'social') {
      doc.actualizacionesPendientes = (doc.actualizacionesPendientes || []).filter(u => u.id !== updateId);
    } else if (inboxType === 'health') {
      doc.actualizacionesPendientesSalud = (doc.actualizacionesPendientesSalud || []).filter(u => u.id !== updateId);
    }

    // Recalculate and sync with SgsstWorker on inbox approval
    doc.trabajadores = await recalculateAndSyncAllWorkers(req.user.id, companyId, doc.trabajadores);

    await doc.save();
    res.json({ success: true, actualizacionesPendientes: doc.actualizacionesPendientes, actualizacionesPendientesSalud: doc.actualizacionesPendientesSalud });
  } catch (error) {
    logger.error('Inbox approve error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ─── POST /inbox/dismiss ─────────────────────────────────────────────
router.post('/inbox/dismiss', requireJwtAuth, async (req, res) => {
  try {
    const { updateId, inboxType } = req.body;
    if (!updateId || !inboxType) return res.status(400).json({ error: 'Faltan parámetros' });

    const companyId = await getActiveCompanyId(req.user.id);
    const doc = await PerfilSociodemograficoData.findOne({ user: req.user.id, companyId: companyId });
    if (!doc) return res.status(404).json({ error: 'No se encontró la empresa' });

    if (inboxType === 'social') {
      doc.actualizacionesPendientes = (doc.actualizacionesPendientes || []).filter(u => u.id !== updateId);
    } else if (inboxType === 'health') {
      doc.actualizacionesPendientesSalud = (doc.actualizacionesPendientesSalud || []).filter(u => u.id !== updateId);
    }
    
    await doc.save();
    res.json({ success: true, actualizacionesPendientes: doc.actualizacionesPendientes, actualizacionesPendientesSalud: doc.actualizacionesPendientesSalud });
  } catch (error) {
    logger.error('Inbox dismiss error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ─── POST /generate-full — Generate 5 workers with dummy data ────────
router.post('/generate-full', requireJwtAuth, async (req, res) => {
  try {
    const { modelName } = req.body;
    const apiKey = await getApiKey(req.user.id);
    if (!apiKey) return res.status(400).json({ error: 'No API Key' });

    let companyContext = '';
    const ci = await CompanyInfo.findOne({ user: req.user.id }).lean();
    if (ci) {
      companyContext = `Empresa: ${ci.companyName || 'Empresa'}\\nActividad: ${ci.economicActivity || 'General'}`;
    }

    const personalization = req.user?.personalization?.geminiModels;
    const preferredModel = personalization?.sstManagement || (process.env.GOOGLE_MODELS || 'gemini-2.5-flash').split(',')[0].trim();
    const finalModelName = modelName || preferredModel;
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: finalModelName });

    const systemPrompt = `Eres un experto en Recursos Humanos y SST en Colombia.
Tu tarea es generar la estructura inicial de un Perfil Sociodemográfico para la siguiente empresa:
${companyContext}

Genera un arreglo JSON de exactamente 5 a 10 trabajadores colombianos ficticios distribuidos en distintos cargos (operativos y administrativos).
Campos para cada trabajador (asegúrate de incluir datos coherentes y de usar direcciones tipo 'Calle 45 # 12-34, Bogotá', o 'Carrera 15 #20-10, Medellín'):
  "nombre": Nombre completo ficticio,
  "identificacion": Cédula ficticia de 8-10 dígitos,
  "edad": Número entre 18 y 60,
  "genero": "Masculino", "Femenino", o "Otro",
  "estadoCivil": "Soltero/a", "Casado/a", "Unión Libre", "Divorciado/a", "Viudo/a",
  "nivelEscolaridad": "Primaria", "Bachiller", "Técnico", "Tecnólogo", "Universitario", "Posgrado",
  "direccion": Dirección de domicilio tipo Colombia,
  "telefono": Teléfono ficticio (ej. 3001234567),
  "cargo": Cargo ficticio dentro de la empresa,
  "fechaExamenMedico": Fecha en formato "YYYY-MM-DD" de su último examen médico ocupacional,
  "fechaCursoAlturasAutorizado": Fecha en formato "YYYY-MM-DD" o nulo/vacío si no aplica para el cargo,
  "fechaCursoAlturasCoordinador": Fecha en formato "YYYY-MM-DD" o nulo/vacío si no aplica para el cargo

Esquema JSON Requerido (DEBES responder solo json, sin markdown):
{
  "trabajadores": [
    { ... }
  ]
}`;

    const result = await generateWithKeyRotation(model, req.user?.id || req.user, systemPrompt);
    let text = result.response.text().trim();
    text = text.replace(/```json\\n?/g, '').replace(/```\\n?/g, '').trim();

    const parsed = JSON.parse(text);

    const finalWorkers = (parsed.trabajadores || []).map(w => ({
      ...w,
      id: w.id || require('crypto').randomUUID(),
      completedByAI: true
    }));

    res.json({ trabajadores: finalWorkers });
  } catch (error) {
    logger.error('[SGSST PerfilSociodemografico] Generate-full error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ─── POST /analyze — Generate AI Exec Report for Sociodemographic ─────────────────────────────
router.post('/analyze', requireJwtAuth, async (req, res) => {
  try {
    const { trabajadores, currentDate, userName, modelName = (process.env.GOOGLE_MODELS || 'gemini-2.5-flash').split(',')[0].trim() } = req.body;

    if (!trabajadores || !Array.isArray(trabajadores) || trabajadores.length === 0) {
      return res.status(400).json({ error: 'No hay trabajadores para analizar.' });
    }

    const resolvedApiKey = await getApiKey(req.user.id);
    if (!resolvedApiKey) {
      return res.status(400).json({ error: 'No se ha configurado la clave API de Google.' });
    }

    let loadedCompanyInfo = null;
    try {
      loadedCompanyInfo = await CompanyInfo.findOne({ user: req.user.id }).lean();
    } catch (ciErr) {
      logger.warn('[SGSST PerfilSociodemografico] Error loading company info:', ciErr.message);
    }

    const genAI = new GoogleGenerativeAI(resolvedApiKey);

    const empresa = loadedCompanyInfo?.companyName || 'EMPRESA';
    const nit = loadedCompanyInfo?.nit || 'NIT';
    const representante = loadedCompanyInfo?.legalRepresentative || userName || 'No registrado';
    const fechaEmision = currentDate || new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });

    const headerHTML = buildStandardHeader({
      title: 'INFORME EJECUTIVO DEL PERFIL SOCIODEMOGRÁFICO',
      companyInfo: loadedCompanyInfo,
      date: fechaEmision,
      norm: 'Gestión de Sistema de Seguridad y Salud en el Trabajo',
      responsibleName: representante
    });

    // Pre-process summary for prompt
    let numMen = 0;
    let numWomen = 0;
    let edadPromedio = 0;
    let totalEdades = 0;
    let escolaridades = {};

    let currentDateTrunc = new Date();

    // Calculate some basic warning/expirations
    let vencimientosMedico = [];
    let resumenPatologias = {};

    trabajadores.forEach(w => {
      if (w.genero === 'Masculino') numMen++;
      else if (w.genero === 'Femenino') numWomen++;

      if (w.edad) totalEdades += Number(w.edad);
      if (w.nivelEscolaridad) {
        if (!escolaridades[w.nivelEscolaridad]) escolaridades[w.nivelEscolaridad] = 0;
        escolaridades[w.nivelEscolaridad]++;
      }

      if (w.diagnosticoMedico && w.diagnosticoMedico !== 'Apto / Sin Hallazgos') {
        const cat = w.diagnosticoMedico.split(' - ')[0] || 'Otros';
        resumenPatologias[cat] = (resumenPatologias[cat] || 0) + 1;
      }

      // Exámenes Médicos - Alert if > 1 year
      if (w.fechaExamenMedico) {
        try {
          const diffTime = Math.abs(currentDateTrunc - new Date(w.fechaExamenMedico));
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          if (diffDays >= 300) { // close to 1 year
            vencimientosMedico.push(`${w.nombre} (${w.cargo}) - Último: ${w.fechaExamenMedico}`);
          }
        } catch (e) { }
      } else {
        vencimientosMedico.push(`${w.nombre} (${w.cargo}) - Sin examen reportado`);
      }
    });

    if (trabajadores.length > 0) {
      edadPromedio = Math.round(totalEdades / trabajadores.length);
    }

    const promptText = `Eres un Experto en SST Especializado en perfiles sociodemográficos.
Se ha evaluado la base de datos de los trabajadores de la empresa.

** Resumen de Hallazgos Sociodemográficos:**
                        - Total trabajadores: ${trabajadores.length}
                        - Hombres: ${numMen}, Mujeres: ${numWomen}
                        - Edad Promedio: ${edadPromedio} años
                        - Escolaridad principal: ${JSON.stringify(escolaridades)}
                        - Resumen de Hallazgos Médicos por categoría: ${JSON.stringify(resumenPatologias)}
                        - Trabajadores con alerta sobre examen médico periódico: ${vencimientosMedico.length}

                        ** Atención Especial Requerida(Examenes médicos prontos a vencer / Vencidos o no reportados):**
                        ${vencimientosMedico.slice(0, 10).map(v => '- ' + v).join('\n')}

                        ** Tu tarea:**
                        Escribe un INFORME EJECUTIVO profesional(en formato HTML) que analice este perfil sociodemográfico de la empresa y dé recomendaciones al área de Talento Humano y SST.
ESTRUSTRA EXACTA REQUERIDA(en div y HTML limpio sin markdown):
                             1. Un resumen analítico del capital humano, enfocándose en la distribución de género, edad y escolaridad. (Ej.Qué implica tener una población madura vs joven, o riesgos relativos al estado de la escolaridad).
                             2. Análisis de las Condiciones de Salud: Interpreta el "Resumen de Hallazgos Médicos por categoría" y explica los riesgos para la productividad y el bienestar. No menciones nombres propios aquí, habla de tendencias.
                             3. Plan de Acción SST: Basado en los hallazgos médicos y exámenes vencidos, propón actividades de P&P (Promoción y Prevención).
                             4. Asegúrese de referenciar obligaciones en SST sobre Cursos de Alturas si se requiere.
                             5. Recomendaciones finales orientadas al bienestar social y físico.

Usa un tono corporativo.Retorna SOLAMENTE CÓDIGO HTML VÁLIDO SIN etiquetas markdown de bloque HTML.No incluyas un título principal(<code>h1</code>) porque ya está en el encabezado.

** ESTILOS OBLIGATORIOS(CSS INLINE) - PRECAUCIÓN MODO OSCURO:**
- ** Regla Crítica:** NO uses clases de Tailwind, usa exclusivamente CSS inline.
- Los contenedores principales(divs, cajas, tarjetas) deben tener style = "width: 100%; box-sizing: border-box;" para no quedar angostos.
- Cada vez que apliques un background - color a un elemento(tr, td, div), ** DEBES OBLIGATORIAMENTE ** especificar color: #000; o color: #fff;.
                        - Títulos(h2, h3): Color azul oscuro(#0f766e) con color: #0f766e; explícito.
- Tablas generadas por la IA DEBEN estar envueltas dentro de un < div style = "overflow-x: auto; width: 100%; margin-bottom: 20px;" >.La tabla debe tener los estilos: width: 100 %; min - width: 700px; border - collapse: separate; border - spacing: 0; border - radius: 12px; border: 1px solid #ddd;, th con background - color="#0f766e" y color = "white".
- Celdas(td): padding = "10px", border - bottom="1px solid #ddd"(sin background - color predeterminado para que hereden el modo oscuro).`;

    const personalization = req.user?.personalization?.geminiModels;
    const preferredModel = personalization?.sstManagement || (process.env.GOOGLE_MODELS || 'gemini-2.5-flash').split(',')[0].trim();
    const finalModelName = modelName || preferredModel;
    const model = genAI.getGenerativeModel({ model: finalModelName });
    const result = await generateWithKeyRotation(model, req.user?.id || req.user, promptText);
    let aiHtml = result.response.text().trim();
    aiHtml = aiHtml.replace(/```html\n?/gi, '').replace(/```\n?/gi, '').trim();

    const bodyMatch = aiHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (bodyMatch) {
        aiHtml = bodyMatch[1].trim();
    }
    aiHtml = aiHtml
        .replace(/<!DOCTYPE[^>]*>/gi, '')
        .replace(/<html[^>]*>/gi, '').replace(/<\/html>/gi, '')
        .replace(/<head>[\s\S]*?<\/head>/gi, '')
        .replace(/<body[^>]*>/gi, '').replace(/<\/body>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .trim();

    let fullReport = `${headerHTML}
                        <div class="mt-8 space-y-6">
                            ${aiHtml}
                        </div>`;

    if (loadedCompanyInfo) {
      fullReport += buildSignatureSection(loadedCompanyInfo);
    }

    res.json({ report: fullReport });
  } catch (error) {
    logger.error('[SGSST PerfilSociodemografico] Analyze error:', error);
    res.status(500).json({ error: error.message });
  }
});


// ─── Bio-Fit Engine Backend ──────────────────────────────────────────────────
function calculateBiocentricFitBackend(w, perfilesList) {
  let score = 100;
  let alerts = [];
  let isLethal = false;
  const auditItems = [];

  const addAudit = (cat, title, desc, pts, sev) => {
    score -= pts;
    alerts.push(title);
    auditItems.push({ category: cat, title, description: desc, pointsDeducted: pts, severity: sev });
  };

  const cargo = perfilesList.find(c => c.nombreCargo === w.cargo);
  if (!cargo) {
    return { score: 0, alerts: ['No hay rol asignado'], auditItems: [], isLethal: false };
  }

  // 1. Biometría y Signos Vitales
  if (w.imc) {
    const imc = parseFloat(w.imc);
    if (!isNaN(imc)) {
      if (imc >= 30) {
        addAudit('Clínico', 'Obesidad detectada', `El IMC de ${imc} indica obesidad, aumentando el riesgo cardiovascular y metabólico.`, 10, 'warning');
      } else if (imc < 18.5) {
        addAudit('Clínico', 'Bajo peso', `El IMC de ${imc} sugiere déficit nutricional o patología subyacente.`, 5, 'info');
      }
    }
  }

  if (w.presionArterial) {
    const [sisStr, diaStr] = w.presionArterial.split('/');
    const sis = parseInt(sisStr || '0', 10);
    const dia = parseInt(diaStr || '0', 10);
    if (!isNaN(sis) && !isNaN(dia)) {
      if (sis >= 135 || dia >= 90) {
        addAudit('Clínico', 'Riesgo de Hipertensión', `Presión de ${w.presionArterial} por encima de rangos óptimos. Requiere seguimiento médico.`, 15, 'warning');
      }
    }
  }

  if (w.frecuenciaCardiaca) {
    const fc = parseInt(w.frecuenciaCardiaca, 10);
    if (!isNaN(fc)) {
      if (fc > 100) {
        addAudit('Clínico', 'Taquicardia en reposo', `Frecuencia cardíaca de ${fc} lpm indica posible estrés cardiovascular o metabólico.`, 10, 'warning');
      } else if (fc < 50) {
        addAudit('Clínico', 'Bradicardia', `Frecuencia inusualmente baja (${fc} lpm), puede requerir valoración cardiológica.`, 5, 'info');
      }
    }
  }

  // 2. Hábitos
  if (w.fuma === 'Sí, diario') {
    addAudit('Clínico', 'Tabaquismo Activo', 'Consumo diario de tabaco impacta la capacidad pulmonar y oxigenación celular.', 10, 'warning');
  }
  if (w.alcohol === 'Sí (Frecuente)') {
    addAudit('Psicosocial', 'Etilismo Frecuente', 'Aumenta significativamente la accidentabilidad y vulnerabilidad hepática.', 15, 'warning');
  }

  // 3. CAMPOS DE TEXTO LIBRE → IA SEMÁNTICA
  const TAG_RULES_CS = {
    Lumbalgia:            { pts: 10, sev: 'warning',  cat: 'Osteomuscular',      label: 'Lumbalgia',                   desc: 'Restricción lumbar. Limita carga de peso y posturas prolongadas.' },
    Hernia_Discal:        { pts: 15, sev: 'critical', cat: 'Osteomuscular',      label: 'Hernia Discal',               desc: 'Condición discal que puede agravarse con esfuerzo físico.' },
    Cervicalgia:          { pts: 8,  sev: 'warning',  cat: 'Osteomuscular',      label: 'Cervicalgia',                 desc: 'Restricción cervical. Limita posiciones de cuello sostenidas.' },
    Epicondilitis:        { pts: 8,  sev: 'warning',  cat: 'Osteomuscular',      label: 'Epicondilitis',               desc: 'Inflamación en el codo. Limita movimientos repetitivos del antebrazo.' },
    Tunel_Carpiano:       { pts: 8,  sev: 'warning',  cat: 'Osteomuscular',      label: 'Túnel Carpiano',              desc: 'Compresión del nervio mediano. Limita trabajo manual repetitivo.' },
    Restriccion_Hombro:   { pts: 10, sev: 'warning',  cat: 'Osteomuscular',      label: 'Restricción de Hombro',       desc: 'Limitación en el complejo del hombro.' },
    Restriccion_Rodilla:  { pts: 10, sev: 'warning',  cat: 'Osteomuscular',      label: 'Restricción de Rodilla',      desc: 'Limitación articular en rodilla.' },
    No_Carga_Peso:        { pts: 8,  sev: 'warning',  cat: 'Restricción Física', label: 'No Carga de Peso',            desc: 'Restricción médica explícita de levantamiento o carga.' },
    No_Bipedestacion:     { pts: 5,  sev: 'info',     cat: 'Restricción Física', label: 'No Bipedestación',            desc: 'Limitación para permanecer de pie por períodos extendidos.' },
    No_Sedestacion:       { pts: 5,  sev: 'info',     cat: 'Restricción Física', label: 'No Sedestación',              desc: 'Limitación para permanecer sentado por períodos extendidos.' },
    Hipoacusia:           { pts: 8,  sev: 'warning',  cat: 'Sensorial',          label: 'Hipoacusia',                  desc: 'Pérdida auditiva. Requiere protección auditiva y evaluación.' },
    Vision_Reducida:      { pts: 5,  sev: 'info',     cat: 'Sensorial',          label: 'Visión Reducida',             desc: 'Disminución visual. Requiere corrección óptica adecuada.' },
    HTA:                  { pts: 15, sev: 'warning',  cat: 'Clínico',            label: 'Hipertensión Arterial',       desc: 'Tensión arterial elevada. Requiere seguimiento médico.' },
    Cardiopatia:          { pts: 20, sev: 'critical', cat: 'Clínico',            label: 'Cardiopatía',                 desc: 'Condición cardíaca. Limita esfuerzos físicos intensos.' },
    Diabetes:             { pts: 10, sev: 'warning',  cat: 'Clínico',            label: 'Diabetes',                    desc: 'Condición metabólica que requiere control glucémico.' },
    Epilepsia:            { pts: 25, sev: 'critical', cat: 'Neurológico',        label: 'Epilepsia / Convulsiones',    desc: 'Alto riesgo en maquinaria y alturas.' },
    Vertigo:              { pts: 18, sev: 'critical', cat: 'Neurológico',        label: 'Vértigo / Mareo',             desc: 'Riesgo de caída o desequilibrio durante operación de equipos.' },
    EPOC:                 { pts: 15, sev: 'warning',  cat: 'Respiratorio',       label: 'EPOC / Bronquitis',           desc: 'Enfermedad pulmonar. Limita exposición a polvo y químicos.' },
    Asma:                 { pts: 10, sev: 'warning',  cat: 'Respiratorio',       label: 'Asma',                        desc: 'Hipersensibilidad bronquial. Limita exposición a irritantes.' },
    Alergia_Quimica:      { pts: 10, sev: 'warning',  cat: 'Inmunológico',       label: 'Alergia Química',             desc: 'Sensibilidad a químicos. Requiere EPP específico.' },
    Medicamento_SNC:      { pts: 15, sev: 'critical', cat: 'Farmacológico',      label: 'Medicamento Depresor SNC',    desc: 'Sedantes incompatibles con maquinaria. Alerta de seguridad.' },
    Restriccion_Mental:   { pts: 12, sev: 'warning',  cat: 'Psicosocial',        label: 'Restricción de Salud Mental', desc: 'Condición mental que puede afectar concentración y decisiones.' },
    Patologia_Cronica:    { pts: 10, sev: 'warning',  cat: 'Clínico',            label: 'Patología Crónica',           desc: 'Enfermedad crónica base que requiere vigilancia epidemiológica.' },
    Diagnostico_Reciente: { pts: 5,  sev: 'info',     cat: 'Clínico',            label: 'Diagnóstico Reciente',        desc: 'Diagnóstico médico reciente. Amerita seguimiento.' },
    Recomendacion_Leve:   { pts: 3,  sev: 'info',     cat: 'Preventivo',         label: 'Recomendación Médica',        desc: 'Recomendación preventiva activa que debe gestionarse por SST.' },
  };

  const iaTags = w.bioTagsIA || [];
  const hasIATags = iaTags.length > 0 && !iaTags.includes('Sin_Hallazgos');
  const hasAnyText = [
    w.limitacionesBiomecanicas, w.recomendacionesMedicas,
    w.diagnosticoMedico, w.enfermedades, w.alergiasQuimicas, w.medicamentos
  ].some(v => v && String(v).trim().length > 2 && !String(v).toLowerCase().includes('ninguna') && !String(v).toLowerCase().includes('ninguno'));

  if (hasAnyText) {
    if (hasIATags) {
      iaTags.forEach(tag => {
        const rule = TAG_RULES_CS[tag];
        if (!rule) return;
        let pts = rule.pts;
        if ((tag === 'Lumbalgia' || tag === 'Hernia_Discal' || tag === 'Restriccion_Hombro' || tag === 'Restriccion_Rodilla') && cargo.exigenciaFisica === 'Alta') {
          pts = Math.round(pts * 1.5);
        }
        if ((tag === 'Epilepsia' || tag === 'Vertigo' || tag === 'Medicamento_SNC' || tag === 'Restriccion_Mental') && cargo.operaMaquinaria === 'Sí') {
          pts = Math.round(pts * 2.0);
        }
        if (tag === 'Restriccion_Mental' && cargo.exigenciaMental === 'Alta') {
          pts = Math.round(pts * 1.5);
        }
        addAudit(rule.cat, rule.label, rule.desc + (pts !== rule.pts ? ' ⚠️ Agravado por exigencias del cargo.' : ''), pts, rule.sev);
      });
    } else {
      const hasEnf = w.enfermedades && w.enfermedades.trim() && !w.enfermedades.toLowerCase().includes('ninguna');
      const hasDiag = w.diagnosticoMedico && w.diagnosticoMedico.trim() && !w.diagnosticoMedico.toLowerCase().includes('ninguno') && !w.diagnosticoMedico.toLowerCase().includes('apto');
      const hasRestr = w.limitacionesBiomecanicas && w.limitacionesBiomecanicas.trim() && !w.limitacionesBiomecanicas.toLowerCase().includes('ninguna');
      const hasRec = w.recomendacionesMedicas && w.recomendacionesMedicas.trim() && !w.recomendacionesMedicas.toLowerCase().includes('ninguna');
      const hasAl = w.alergiasQuimicas && w.alergiasQuimicas.trim() && !w.alergiasQuimicas.toLowerCase().includes('ninguna');
      if (hasEnf) addAudit('Clínico', 'Patología Base (pendiente IA)', `${w.enfermedades}`, 10, 'warning');
      if (hasDiag && !hasEnf) addAudit('Clínico', 'Diagnóstico Médico (pendiente IA)', `${w.diagnosticoMedico}`, 5, 'info');
      if (hasRestr) addAudit('Físico', 'Restricción Biomecánica (pendiente IA)', `${w.limitacionesBiomecanicas}`, 8, 'warning');
      if (hasRec) addAudit('Preventivo', 'Recomendación Médica (pendiente IA)', `${w.recomendacionesMedicas}`, 3, 'info');
      if (hasAl) addAudit('Clínico', 'Alergia Química (pendiente IA)', `${w.alergiasQuimicas}`, 8, 'warning');
    }
  }

  const hasEnfermedad = !hasIATags && w.enfermedades && w.enfermedades.trim() && !w.enfermedades.toLowerCase().includes('ninguna');
  const hasDiagnostico = !hasIATags && w.diagnosticoMedico && w.diagnosticoMedico.trim() && !w.diagnosticoMedico.toLowerCase().includes('ninguno') && !w.diagnosticoMedico.toLowerCase().includes('apto');
  const hasBiomecanica = !hasIATags && w.limitacionesBiomecanicas && w.limitacionesBiomecanicas.length > 2 && !w.limitacionesBiomecanicas.toLowerCase().includes('ninguna');

  // 4. Vulnerabilidad Sociodemográfica y Psicosocial
  let vulnerabilidadSocial = 0;
  let socialDesc = [];
  if (['1', '2'].includes(String(w.estrato || ''))) {
    vulnerabilidadSocial++;
    socialDesc.push('estrato socioeconómico bajo');
  }
  if (w.personasCargo && Number(w.personasCargo) >= 3) {
    vulnerabilidadSocial++;
    socialDesc.push('alta carga de dependientes');
  }
  if (w.estadoCivil && (w.estadoCivil.toLowerCase().includes('solter') || w.estadoCivil.toLowerCase().includes('viud') || w.estadoCivil.toLowerCase().includes('divorciad'))) {
    if (w.personasCargo && Number(w.personasCargo) > 0) {
      vulnerabilidadSocial++;
      socialDesc.push('monoparentalidad');
    }
  }
  if (w.vivienda && (w.vivienda.toLowerCase().includes('arrendada') || w.vivienda.toLowerCase().includes('invasión'))) {
    vulnerabilidadSocial++;
    socialDesc.push('inestabilidad habitacional');
  }

  if (vulnerabilidadSocial >= 3) {
    addAudit('Vigilancia Epidemiológica', 'Vulnerabilidad Sociodemográfica', `Factores estresores: ${socialDesc.join(', ')}. Sugerido apoyo psicosocial.`, 0, 'info');
  } else if (vulnerabilidadSocial >= 2) {
    addAudit('Vigilancia Epidemiológica', 'Factores Psicosociales Externos', `Factores detectados: ${socialDesc.join(', ')}.`, 0, 'info');
  }

  if (w.nivelEscolaridad && w.nivelEscolaridad.toLowerCase().includes('primaria')) {
    addAudit('Vigilancia Epidemiológica', 'Escolaridad Básica', 'Puede requerir métodos de capacitación más visuales y acompañamiento cercano en SST.', 0, 'info');
  }

  // 5. Cruce vs. Exigencias del Cargo
  if (cargo.exigenciaFisica === 'Alta') {
    if (w.edad && Number(w.edad) > 55) {
      addAudit('Preventivo', 'Alerta Ergonómica por Edad', 'La edad avanzada requiere monitoreo preventivo ante altas exigencias físicas.', 0, 'info');
    }
    if (hasEnfermedad || hasDiagnostico) {
      addAudit('Operativo', 'Patología en Rol Exigente', 'La carga física intensa puede agravar la patología base.', 10, 'critical');
    }
    if (hasBiomecanica) {
      addAudit('Operativo', 'Restricción Biomecánica Crítica', 'Peligro inminente de lesión osteomuscular por incompatibilidad con el esfuerzo.', 20, 'critical');
    }
  }

  if (cargo.exigenciaMental === 'Alta') {
    if (w.terapiaPsicologica === 'Sí') {
      addAudit('Psicosocial', 'Alerta de Burnout', 'Rol de alta tensión mental sumado a necesidad clínica de psicoterapia.', 15, 'critical');
    }
    if (vulnerabilidadSocial >= 2) {
      addAudit('Vigilancia Epidemiológica', 'Contexto Psicosocial Estresante', 'La vulnerabilidad social sumada al rol estresante requiere vigilancia activa.', 0, 'info');
    }
  }

  if (cargo.operaMaquinaria === 'Sí' && !hasIATags) {
    const medLower = (w.medicamentos || '').toLowerCase();
    const hasMedsLethal = medLower.includes('psiquiátrico') || medLower.includes('dormir') || medLower.includes('sedante') || medLower.includes('ansiolítico');
    if (hasMedsLethal || w.alcohol === 'Sí (Frecuente)') {
      isLethal = true;
      addAudit('Operativo', '🛑 BLOQUEO PREVENTIVO', 'Uso de sustancias depresoras del SNC es incompatible con operación de maquinaria.', 40, 'critical');
    }
  }

  // 6. Entrenamiento y Formación Legal
  if (cargo.entrenamientosSeleccionados && cargo.entrenamientosSeleccionados.length > 0) {
    const req = cargo.entrenamientosSeleccionados.length;
    if (req > 0 && !w.curso50h && !w.curso20h) {
      let penalty = 5;
      penalty += req;
      const criticalKeywords = ['alturas', 'confinado', '50 horas', '50h', '20 horas', '20h', 'licencia', 'emergencia', 'rescate', 'primeros auxilios', 'coordinador'];
      const hasCritical = cargo.entrenamientosSeleccionados.some(c => criticalKeywords.some(k => String(c).toLowerCase().includes(k)));
      if (hasCritical) penalty += 5;
      addAudit('Entrenamiento', 'Brecha Formativa SST', `Cursos obligatorios sin acreditar: ${cargo.entrenamientosSeleccionados.join(', ')}.`, penalty, 'warning');
    }
  }

  return { score: Math.max(0, score), alerts: Array.from(new Set(alerts)), auditItems, isLethal };
}

async function recalculateAndSyncAllWorkers(userId, companyId, trabajadoresList) {
  try {
    const PerfilesCargo = mongoose.models.PerfilCargoData;
    const cargoDoc = PerfilesCargo ? await PerfilesCargo.findOne({ user: userId, companyId }).lean() : null;
    const perfilesList = cargoDoc?.perfilesList || [];

    const SgsstWorker = require('../../../models/SgsstWorker');

    const updatedWorkers = trabajadoresList.map(w => {
      const rawWorker = w._doc || w;
      
      const fitResult = calculateBiocentricFitBackend(rawWorker, perfilesList);
      
      return {
        ...rawWorker,
        biocentricScore: fitResult.score,
        biocentricAlerts: fitResult.alerts,
        biocentricIsLethal: fitResult.isLethal
      };
    });

    // Sincronizar en lote a SgsstWorker
    for (const w of updatedWorkers) {
      if (!w.identificacion) continue;
      const cleanDoc = String(w.identificacion).trim();
      if (!cleanDoc) continue;

      const conditionsStr = [w.enfermedades, w.diagnosticoMedico, w.limitacionesBiomecanicas]
        .filter(Boolean)
        .join('; ') || '';

      await SgsstWorker.updateOne(
        { user: userId, companyId, documento: cleanDoc },
        {
          $set: {
            nombre: w.nombre,
            genero: w.genero || 'No especificado',
            fechaNacimiento: w.fechaNacimiento || null,
            condicionesSalud: conditionsStr,
            fitScore: w.biocentricScore,
            fitAlerts: w.biocentricAlerts,
            updatedAt: Date.now()
          }
        }
      );
    }

    return updatedWorkers;
  } catch (err) {
    logger.error('[SGSST BioFit Backend] recalculateAndSyncAllWorkers error:', err);
    return trabajadoresList;
  }
}

router.recalculateAndSyncAllWorkers = recalculateAndSyncAllWorkers;

module.exports = router;
