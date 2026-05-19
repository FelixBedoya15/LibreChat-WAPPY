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

  // Score IA (Oráculo H1) — Fuente de verdad post-evaluación IA
  bioScoreIA: { type: Number, default: null },
  bioScoreIAVersion: { type: String, default: '' },     // hash de campos clínicos al momento de evaluar
  bioScoreIAReason: { type: String, default: '' },       // justificación corta del score
  bioScoreIADate: { type: Date, default: null },         // fecha de última evaluación IA
  bioScoreIAAlerts: { type: Array, default: [] },        // alertas estructuradas devueltas por la IA
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

// ─── Helper: Clinical Hash ────────────────────────────────────────────
function buildClinicalHash(w) {
  const crypto = require('crypto');
  const fields = [
    w.imc, w.presionArterial, w.frecuenciaCardiaca, w.enfermedades,
    w.diagnosticoMedico, w.limitacionesBiomecanicas, w.recomendacionesMedicas,
    w.alergiasQuimicas, w.medicamentos, w.fuma, w.alcohol, w.terapiaPsicologica,
    w.cargo, w.edad, w.peso, w.talla
  ].map(v => String(v || '')).join('|');
  return crypto.createHash('md5').update(fields).digest('hex');
}

// ─── Helper: Fire-and-forget IA Worker Evaluation ─────────────────────
async function triggerIAEvaluation(userId, workerId, apiKey, perfilesList) {
  try {
    const companyId = await getActiveCompanyId(userId);
    const doc = await PerfilSociodemograficoData.findOne({ user: userId, companyId });
    if (!doc) return;
    const worker = (doc.trabajadores || []).find(w => w.id === workerId);
    if (!worker) return;

    const profile = (perfilesList || []).find(p =>
      (p.nombreCargo || '').toLowerCase().trim() === (worker.cargo || '').toLowerCase().trim()
    );

    const prompt = `Eres el Motor Bio-Fit WAPPY (Oráculo H1). Evalúa la aptitud laboral del siguiente trabajador aplicando SOLO los datos proporcionados, sin inventar información.

DATOS DEL TRABAJADOR:
- Nombre: ${worker.nombre}, Cargo: ${worker.cargo}, Edad: ${worker.edad}
- IMC: ${worker.imc || 'N/D'}, Presión Arterial: ${worker.presionArterial || 'N/D'}, FC: ${worker.frecuenciaCardiaca || 'N/D'}
- Enfermedades: ${worker.enfermedades || 'Ninguna'}, Diagnóstico: ${worker.diagnosticoMedico || 'Ninguno'}
- Restricciones Biomecánicas: ${worker.limitacionesBiomecanicas || 'Ninguna'}
- Recomendaciones Médicas: ${worker.recomendacionesMedicas || 'Ninguna'}
- Alergias Químicas: ${worker.alergiasQuimicas || 'Ninguna'}
- Medicamentos: ${worker.medicamentos || 'Ninguno'}
- Hábitos: Fuma=${worker.fuma || 'No'}, Alcohol=${worker.alcohol || 'No'}, Terapia=${worker.terapiaPsicologica || 'No'}
- Estrato: ${worker.estrato || 'N/D'}, Personas a cargo: ${worker.personasCargo || '0'}

PERFIL DEL CARGO (${worker.cargo}):
- Exigencia Física: ${profile?.exigenciaFisica || 'N/D'}
- Exigencia Mental: ${profile?.exigenciaMental || 'N/D'}
- Opera Maquinaria: ${profile?.operaMaquinaria || 'No'}
- Nivel: ${profile?.nivelCargo || 'N/D'}

REGLAS DE SCORING (puntuación base: 100):
- IMC >= 30: -10, IMC < 18.5: -5
- PA >= 135/90: -15, FC > 100: -10, FC < 50: -5
- Tabaquismo diario: -10, Etilismo frecuente: -15
- Patología base declarada: -10, Diagnóstico reciente: -5
- Restricción osteomuscular leve: -5 a -10 (severa: -15 a -25)
- Recomendación médica leve: -3 a -6 (severa: -10 a -18)
- Multiplicador x1.5 si cargo físico "Alta" + restricción osteomuscular
- Multiplicador x2.0 si opera maquinaria + restricción neurológica/mental
- Alta vulnerabilidad social (3+ factores): -15
- Cargo mental "Alta" + terapia psicológica: -15 (Burnout)
- Opera maquinaria + sedantes/SNC: -40 (BLOQUEO)

IMPORTANTE: Debes evaluar TODAS y cada una de las reglas anteriores. Crea un objeto en el array 'alertas' por CADA regla que aplique al trabajador. NO las agrupes, NO omitas ninguna. Si el trabajador incumple 6 reglas, el array debe tener exactamente 6 elementos detallados.

Responde ÚNICAMENTE con JSON válido, sin markdown, sin texto extra:
{
  "score": <número 0-100>,
  "aptitud": "<Apto | Apto con Restricciones | No Apto>",
  "razon": "<1-2 frases explicando el score>",
  "alertas": [
    { "titulo": "<nombre>", "descripcion": "<detalle>", "puntos": <número>, "severidad": "<info|warning|critical>", "categoria": "<categoría>" }
  ]
}`;

    const { generateWithKeyRotation } = require('./sgsstGemini');
    const preferredModel = (process.env.GOOGLE_MODELS || 'gemini-2.5-flash').split(',')[0].trim();
    const result = await generateWithKeyRotation(preferredModel, userId, prompt);
    let text = result.response.text().trim().replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(text);

    const newHash = buildClinicalHash(worker);
    const workerIndex = doc.trabajadores.findIndex(w => w.id === workerId);
    if (workerIndex !== -1) {
      const cur = doc.trabajadores[workerIndex]._doc || doc.trabajadores[workerIndex];
      doc.trabajadores[workerIndex] = {
        ...cur,
        bioScoreIA: parsed.score,
        bioScoreIAReason: parsed.razon || '',
        bioScoreIAAptitud: parsed.aptitud || '',
        bioScoreIAAlerts: parsed.alertas || [],
        bioScoreIAVersion: newHash,
        bioScoreIADate: new Date()
      };
      await doc.save();
      logger.info(`[OraculoH1] IA score calculado para ${worker.nombre}: ${parsed.score}%`);
    }
  } catch (err) {
    logger.warn(`[OraculoH1] IA evaluation failed for worker ${workerId}: ${err.message}`);
  }
}

// ─── POST /save — Save worker data ─────────────────────────────
router.post('/save', requireJwtAuth, async (req, res) => {
  try {
    const { trabajadores } = req.body;
    if (!trabajadores) {
      return res.status(400).json({ error: 'Datos requeridos' });
    }

    const companyId = await getActiveCompanyId(req.user.id);

    await PerfilSociodemograficoData.findOneAndUpdate(
      { user: req.user.id, companyId: companyId },
      { $set: { trabajadores, companyId, updatedAt: new Date() } },
      { upsert: true, new: true }
    );

    // Sync FIT Score and health data to the Master Profile (SgsstWorker)
    const SgsstWorker = require('../../../models/SgsstWorker');
    for (const w of trabajadores) {
      if (!w.identificacion) continue;
      const cleanDoc = String(w.identificacion).trim();
      if (!cleanDoc) continue;
      
      await SgsstWorker.updateOne(
        { user: req.user.id, documento: cleanDoc },
        {
          $set: {
            fitScore: w.biocentricScore || 0,
            fitAlerts: w.biocentricAlerts || [],
            condicionesSalud: [w.enfermedades, w.diagnosticoMedico, w.limitacionesBiomecanicas].filter(Boolean).join('; ') || '',
            fechaNacimiento: w.fechaNacimiento || null,
            genero: w.genero || 'No especificado'
          }
        }
      );
    }

    // Trigger async IA re-evaluation for workers whose clinical data changed
    try {
      const apiKey = await getApiKey(req.user.id);
      if (apiKey) {
        // Fetch cargo profiles for cross-referencing
        const PerfilesCargo = mongoose.models.PerfilesCargoData;
        const cargoDoc = PerfilesCargo ? await PerfilesCargo.findOne({ user: req.user.id }).lean() : null;
        const perfilesList = cargoDoc?.perfilesList || [];

        for (const w of trabajadores) {
          if (!w.id) continue;
          const currentHash = buildClinicalHash(w);
          // Only trigger if data changed since last IA evaluation
          if (currentHash !== w.bioScoreIAVersion) {
            // Fire and forget — does not block response
            triggerIAEvaluation(req.user.id, w.id, apiKey, perfilesList).catch(() => {});
          }
        }
      }
    } catch (triggerErr) {
      logger.warn('[OraculoH1] Could not trigger IA evaluation:', triggerErr.message);
    }

    res.json({ success: true });
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

module.exports = router;
