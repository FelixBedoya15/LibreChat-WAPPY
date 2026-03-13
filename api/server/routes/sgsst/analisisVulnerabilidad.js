const express = require('express');
const requireJwtAuth = require('../../middleware/requireJwtAuth');
const { getUserKey } = require('~/server/services/UserService');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const CompanyInfo = require('../../../models/CompanyInfo');
const { buildStandardHeader, buildSignatureSection } = require('./reportHeader');
const { logger } = require('~/config');

const router = express.Router();
const mongoose = require('mongoose');

// ─── HELPER: Google Gemini Fallback ───────────────────────────────────────
async function generateWithRetry(model, promptText) {
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(model.apiKey);
  const currentModelName = model.model.replace('models/', '');

  const fallbackOrder = [
    'gemini-3-flash-preview', 'gemini-3.1-flash-lite-preview', 'gemini-2.5-flash', 'gemini-2.5-flash-lite'
  ];
  let modelsToTry = [currentModelName];
  for (const m of fallbackOrder) { if (m !== currentModelName) modelsToTry.push(m); }

  let lastError;
  for (const modelName of modelsToTry) {
    if (!modelName) continue;
    try {
      if (modelName !== currentModelName) console.warn(`[Gemini SDK] Cambiando a: ${modelName}...`);
      const fallbackModel = genAI.getGenerativeModel({ model: modelName, generationConfig: model.generationConfig || {} });
      return await fallbackModel.generateContent(promptText);
    } catch (err) { console.warn(`[Gemini SDK] Falló ${modelName}: ${err.message}`); lastError = err; }
  }
  throw new Error(`Todos los modelos fallaron. Último error: ${lastError?.message || 'Desconocido'}`);
}

// ─── Mongoose Schema ─────────────────────────────────────────────────────
const AnalisisVulnerabilidadDataSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  formData: { type: Object, default: {} },
  evaluadoresList: { type: Array, default: [] },
  images: { type: Object, default: {} },
  updatedAt: { type: Date, default: Date.now },
});
AnalisisVulnerabilidadDataSchema.index({ user: 1 }, { unique: true });
const AnalisisVulnerabilidadData = mongoose.models.AnalisisVulnerabilidadData || mongoose.model('AnalisisVulnerabilidadData', AnalisisVulnerabilidadDataSchema);

// ─── GET /data ────────────────────────────────────────────────────────────
router.get('/data', requireJwtAuth, async (req, res) => {
  try {
    const data = await AnalisisVulnerabilidadData.findOne({ user: req.user.id });
    if (data) {
      return res.json({
        formData: data.formData || {},
        evaluadoresList: data.evaluadoresList || [],
        images: data.images || { foto1: null, foto2: null, foto3: null },
      });
    }
    res.json({ formData: {}, evaluadoresList: [], images: { foto1: null, foto2: null, foto3: null } });
  } catch (error) {
    logger.error('[SGSST Vulnerabilidad] Load error:', error);
    res.status(500).json({ error: 'Error al cargar datos' });
  }
});

// ─── POST /save ───────────────────────────────────────────────────────────
router.post('/save', requireJwtAuth, async (req, res) => {
  try {
    const { formData, evaluadoresList, images } = req.body;
    await AnalisisVulnerabilidadData.findOneAndUpdate(
      { user: req.user.id },
      { $set: { formData, evaluadoresList, images, updatedAt: Date.now() } },
      { upsert: true, new: true }
    );
    res.json({ success: true });
  } catch (error) {
    logger.error('[SGSST Vulnerabilidad] Save error:', error);
    res.status(500).json({ error: 'Error al guardar datos' });
  }
});

// ─── Helper for Diamante de Colores ──────────────────────────────────────
function getRiskColor(points) {
  if (points >= 0.0 && points <= 1.0) return 'VERDE';
  if (points >= 1.1 && points <= 2.0) return 'AMARILLO';
  if (points >= 2.1 && points <= 3.0) return 'ROJO';
  return 'VERDE';
}

function calculateRiskLevel(amenazaColor, persColor, recColor, sistColor) {
  let rojos = 0, amarillos = 0, verdes = 0;
  const colors = [amenazaColor, persColor, recColor, sistColor];
  
  colors.forEach(c => {
    if (c === 'ROJO') rojos++;
    else if (c === 'AMARILLO') amarillos++;
    else verdes++;
  });

  if (rojos >= 3 || (rojos >= 2 && amarillos >= 2) || (rojos >= 1 && amarillos === 3)) return 'ALTO';
  if ((rojos >= 1 && amarillos >= 1) || (amarillos >= 3)) return 'MEDIO';
  return 'BAJO';
}

// ─── POST /generate ───────────────────────────────────────────────────────
router.post('/generate', requireJwtAuth, async (req, res) => {
  try {
    const { formData, evaluadoresList, images, modelName } = req.body;

    const evaluadoresStr = evaluadoresList?.map(r => `${r.nombre || 'Sin nombre'} - ${r.rol || 'Evaluador'} (CC: ${r.cedula || 'N/A'})`).join(', ') || '[PENDIENTE]';

    // Calculate vulnerability scores
    const ptsPers = parseFloat(formData.puntajePersonas || 0);
    const ptsRec = parseFloat(formData.puntajeRecursos || 0);
    const ptsSist = parseFloat(formData.puntajeSistemas || 0);
    
    // Interpretar la amenaza (Posible=Verde, Probable=Amarillo, Inminente=Rojo)
    const amenazaColor = formData.nivelAmenaza === 'Inminente' ? 'ROJO' : (formData.nivelAmenaza === 'Probable' ? 'AMARILLO' : 'VERDE');
    const colorPers = getRiskColor(ptsPers);
    const colorRec = getRiskColor(ptsRec);
    const colorSist = getRiskColor(ptsSist);
    
    const riskLevel = calculateRiskLevel(amenazaColor, colorPers, colorRec, colorSist);

    let resolvedApiKey = null;
    try {
      const storedKey = await getUserKey({ userId: req.user.id, name: 'google' });
      try { const parsed = JSON.parse(storedKey); resolvedApiKey = parsed['google'] || parsed.apiKey || parsed.GOOGLE_API_KEY; }
      catch { resolvedApiKey = storedKey; }
    } catch (err) {}

    if (!resolvedApiKey) resolvedApiKey = process.env.GOOGLE_KEY || process.env.GEMINI_API_KEY;
    if (resolvedApiKey && typeof resolvedApiKey === 'string') resolvedApiKey = resolvedApiKey.split(',')[0].trim();

    if (!resolvedApiKey || resolvedApiKey === 'user_provided') {
      return res.status(400).json({ error: 'No se ha configurado la clave API de Google.' });
    }

    const genAI = new GoogleGenerativeAI(resolvedApiKey);
    const model = genAI.getGenerativeModel({ model: modelName || 'gemini-3-flash-preview' });

    const currentDate = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });

    let loadedCompanyInfo = null;
    try { loadedCompanyInfo = await CompanyInfo.findOne({ user: req.user.id }).lean(); }
    catch (e) {}

    const headerHTML = buildStandardHeader({
      title: 'ANÁLISIS DE VULNERABILIDAD - PLAN DE EMERGENCIAS',
      companyInfo: loadedCompanyInfo,
      date: currentDate,
      norm: 'Decreto 1072 de 2015 / Resolución 0312 de 2019 / Diamante de Colores',
      responsibleName: req.user?.name,
    });

    const diamanteHtml = `
      <div style="text-align:center; padding: 30px 0;">
        <h3 style="color:#0f172a; margin-bottom: 20px;">DIAMANTE DE RIESGOS CONSOLIDADO</h3>
        <div style="position:relative; width:220px; height:220px; margin: 0 auto; transform: rotate(45deg);">
          <!-- Top: Amenaza -->
          <div style="position:absolute; top:0; left:0; width:105px; height:105px; border:2px solid #333; background-color:${getHex(amenazaColor)};">
             <div style="transform: rotate(-45deg); display:flex; align-items:center; justify-content:center; width:100%; height:100%; font-weight:bold; color:${amenazaColor==='AMARILLO'?'#000':'#fff'}; font-size:12px;">AMENAZA</div>
          </div>
          <!-- Left: Personas -->
          <div style="position:absolute; top:115px; left:0; width:105px; height:105px; border:2px solid #333; background-color:${getHex(colorPers)};">
             <div style="transform: rotate(-45deg); display:flex; align-items:center; justify-content:center; width:100%; height:100%; font-weight:bold; color:${colorPers==='AMARILLO'?'#000':'#fff'}; font-size:12px;">PERSONAS</div>
          </div>
          <!-- Right: Recursos -->
          <div style="position:absolute; top:0; left:115px; width:105px; height:105px; border:2px solid #333; background-color:${getHex(colorRec)};">
             <div style="transform: rotate(-45deg); display:flex; align-items:center; justify-content:center; width:100%; height:100%; font-weight:bold; color:${colorRec==='AMARILLO'?'#000':'#fff'}; font-size:12px;">RECURSOS</div>
          </div>
          <!-- Bottom: Sistemas -->
          <div style="position:absolute; top:115px; left:115px; width:105px; height:105px; border:2px solid #333; background-color:${getHex(colorSist)};">
             <div style="transform: rotate(-45deg); display:flex; align-items:center; justify-content:center; width:100%; height:100%; font-weight:bold; color:${colorSist==='AMARILLO'?'#000':'#fff'}; font-size:12px;">SISTEMAS</div>
          </div>
        </div>
      </div>
    `;

    function getHex(color) {
      if (color === 'ROJO') return '#dc2626';
      if (color === 'AMARILLO') return '#facc15';
      if (color === 'VERDE') return '#16a34a';
      return '#e2e8f0';
    }

    const promptText = `
Eres un Experto Senior en Gestión del Riesgo de Desastres y Seguridad y Salud en el Trabajo (SST) colombiano, especializado en crear Planes de Emergencia y Contingencia usando la Metodología del Diamante de Colores (Rombos).

Tu objetivo es redactar un **ANÁLISIS DE VULNERABILIDAD TÉCNICO Y PROFUNDO** basándote EXACTAMENTE en los datos ya calculados.

**CONTEXTO DE LA EVALUACIÓN:**
- Evaluadores del Comité/SST: ${evaluadoresStr}
- Amenaza Identificada: ${formData.amenaza || '[No especificada]'}
- Origen de la Amenaza: ${formData.origenAmenaza || '[No especificado]'} (Natural, Tecnológico o Social)
- Calificación Amenaza: ${formData.nivelAmenaza} -> Color: ${amenazaColor}
- Descripción del Riesgo: ${formData.descripcionGlobal || 'Sin descripción'}

**CALIFICACIÓN DE VULNERABILIDAD (Pre-calculada, NO alterar):**
- VULNERABILIDAD EN PERSONAS: ${ptsPers.toFixed(2)}/3.0 -> Color: ${colorPers}
- VULNERABILIDAD EN RECURSOS: ${ptsRec.toFixed(2)}/3.0 -> Color: ${colorRec}
- VULNERABILIDAD EN SISTEMAS: ${ptsSist.toFixed(2)}/3.0 -> Color: ${colorSist}

**NIVEL DE RIESGO GLOBAL CONSOLIDADO:**
Riesgo: **${riskLevel}**

**INSTRUCCIONES (Responde EXCLUSIVAMENTE en HTML limpio):**

NO repitas el título principal ni los datos de la empresa; el encabezado ya está incluido.
El diamante visual ya está incluido y NO debes intentar dibujarlo de nuevo. Tu trabajo es rellenar con análisis exhaustivo las tablas y evaluaciones de texto.

1️⃣ **Identificación y Análisis de la Amenaza**
Tabla con: Tipo de Amenaza, Origen, Calificación, Probabilidad de ocurrencia, Impacto estimado en la operación.
Luego, un párrafo largo y muy técnico analizando el comportamiento de esta amenaza en el contexto particular de la empresa, historia de eventos similares y posibles cadenas de eventos (efectos dominó).

2️⃣ **Evaluación Analítica de Vulnerabilidad por Aspectos**
Crea 3 sub-tablas (una por cada aspecto: Personas, Recursos, Sistemas).
En cada tabla, analiza por qué se obtuvo ese nivel (Malo, Regular o Bueno). Evalúa los siguientes puntos críticos que llevaron a ese color:
- **En Personas (${colorPers}):** Organización del comité, capacitación, entrenamiento de brigadas, dotación.
- **En Recursos (${colorRec}):** Extintores, camillas, botiquines, sistemas de alarma, redes contra incendio, herramientas.
- **En Sistemas (${colorSist}):** Servicios públicos, sistemas alternos de energía, comunicaciones, rutas de evacuación, planes de contingencia documentados.

3️⃣ **Interpretación del Diamante de Riesgos**
\`<div style="border-left: 4px solid #0f766e; background-color: #f0fdfa; padding: 16px 20px; border-radius: 0 8px 8px 0; margin-bottom: 25px; font-size: 13.5px; color: #134e4a; line-height: 1.6;"><strong>Interpretación Técnica del Nivel de Riesgo ${riskLevel}:</strong> [ANÁLISIS DE LA CONJUGACIÓN DE LOS 4 COLORES. QUÉ SIGNIFICA QUE EL RIESGO SEA BAJO, MEDIO O ALTO PARA LA CONTINUIDAD DEL NEGOCIO Y LA SEGURIDAD HUMANA EN ESTA ENTIDAD ESPECÍFICA]</div>\`

4️⃣ **Plan de Intervención y Reducción de la Vulnerabilidad (OBLIGATORIO Y EXTENSO)**
Tabla completa con las acciones específicas que la empresa DEBE TOMAR de inmediato para cambiar los colores Rojos o Amarillos a Verde en el próximo año.
Columnas: Aspecto a mejorar (Personas/Recursos/Sistemas), Acción Recomendada (detallada), Plazo, Responsable.
Ejemplo: Si Recursos está en Rojo, debe haber acciones gruesas (compra de gabinetes contra incendio, cambio de alarmas, etc.).

5️⃣ **Dictamen Final y Declaratoria del Evaluador**
Tabla de cierre formal:
\`<div style="border: 2px solid #0f766e; border-radius: 8px; padding: 25px; text-align: center; margin-top: 35px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); background-color: #f0fdfa;">\`
- Título: \`<h4 style="color: #0f766e; font-size: 16px; font-weight: bold; text-transform: uppercase;">DICTAMEN DE ANÁLISIS DE VULNERABILIDAD</h4>\`
- Botón de nivel de riesgo: Usa #dc2626 para ALTO, #facc15 para MEDIO (texto negro), #16a34a para BAJO. Ej: \`<div style="display:inline-block;background-color:[COLOR];color:white;padding:12px 24px;border-radius:6px;font-weight:bold;">RIESGO GLOBAL: ${riskLevel}</div>\`
- Conclusión final formal sobre la viabilidad de la respuesta a emergencias.

**INSTRUCCIONES DE FORMATO HTML:**
- TODAS las tablas: \`<table style="width:100%;table-layout:fixed;word-wrap:break-word;border-collapse:separate;border-spacing:0;border:1px solid #ccfbf1;border-radius:8px;margin-bottom:25px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.05);">\`
- Headers (<th>): \`<th style="background-color:#0f766e;color:#fff;padding:12px 14px;font-size:13px;font-weight:700;text-transform:uppercase;text-align:left;">\`
- Celdas (<td>): \`<td style="padding:10px 14px;border-bottom:1px solid #f0fdfa;font-size:13px;color:#334155;vertical-align:top;background-color:#fff;">\`
- NO INVENTES posturas corporales o cosas ajenas. Esto es sobre EMERGENCIAS (incendios, sismos, derrames, atentados, inundaciones).
`;

    const parts = [{ text: promptText }];

    if (images) {
      Object.keys(images).forEach((key, index) => {
        const b64 = images[key];
        if (b64) {
          const match = b64.match(/^data:(image\/\w+);base64,(.+)$/);
          if (match) {
            parts.push({ inlineData: { data: match[2], mimeType: match[1] } });
            parts.push({ text: `(Evidencia visual de la vulnerabilidad ${index + 1}: ${key})` });
          }
        }
      });
    }

    const result = await generateWithRetry(model, parts);
    const response = await result.response;
    const htmlBody = response.text().replace(/```html\n ? /g, '').replace(/```\n?/g, '').trim();

    // Photos annex
    let imagesHtml = '';
    if (images?.foto1 || images?.foto2 || images?.foto3) {
      imagesHtml = `<div style="margin-top:30px;margin-bottom:30px;">
        <h3 style="color:#0f766e;border-bottom:2px solid #0f766e;padding-bottom:5px;">ANEXO FOTOGRÁFICO DE INFRAESTRUCTURA Y VULNERABILIDAD</h3>
        <div style="display:flex;gap:20px;flex-wrap:wrap;margin-top:15px;">`;
      const labels = ['Vista General de Fachada/Área', 'Evidencia de Vulnerabilidad 1', 'Evidencia de Vulnerabilidad 2'];
      ['foto1', 'foto2', 'foto3'].forEach((k, i) => {
        if (images[k]) {
          imagesHtml += `<div style="flex:1;min-width:250px;border:1px solid #ddd;padding:10px;border-radius:8px;text-align:center;">
            <img src="${images[k]}" style="width:100%;height:auto;max-width:300px;border-radius:4px;object-fit:contain;margin-bottom:10px;" alt="Foto ${i + 1}" />
            <strong style="color:#0f766e;font-size:14px;display:block;">${labels[i]}</strong>
            <span style="font-size:12px;color:#555;">Evidencia de campo del análisis</span></div>`;
        }
      });
      imagesHtml += `</div></div>`;
    }

    // Signatures
    let extraSignatures = '';
    if (evaluadoresList?.length) {
      extraSignatures += '<div style="margin-top:50px;page-break-inside:avoid;">';
      extraSignatures += '<h4 style="text-align:center;color:#1e293b;margin-bottom:20px;">FIRMAS – EQUIPO EVALUADOR DE VULNERABILIDAD</h4>';
      extraSignatures += '<table style="width:100%;border-collapse:collapse;"><tr>';
      let count = 0;
      evaluadoresList.forEach(r => {
        if (r.nombre) {
          if (count > 0 && count % 2 === 0) extraSignatures += '</tr><tr>';
          extraSignatures += `<td style="width:50%;padding:20px;text-align:center;vertical-align:bottom;">
            <div class="signature-placeholder" data-signature-id="dyn_evaluator_${count}" style="border-bottom:2px solid #333;width:80%;margin:0 auto 10px auto;min-height:80px;display:flex;align-items:center;justify-content:center;background-color:#f9f9f9;cursor:pointer;border-radius:8px 8px 0 0;">
              <span style="color:#999;font-size:12px;">Haga clic para insertar FIRMA DIGITAL</span></div>
            <div style="font-weight:800;font-size:14px;color:#1e293b;text-transform:uppercase;">${r.nombre}</div>
            <div style="font-size:12px;color:#64748b;font-weight:600;">${r.rol || 'Evaluador'}</div>
            <div style="font-size:11px;color:#94a3b8;">CC: ${r.cedula || 'N/A'}</div></td>`;
          count++;
        }
      });
      if (count % 2 !== 0) extraSignatures += '<td style="width:50%;"></td>';
      extraSignatures += '</tr></table></div>';
    }

    let fullReport = headerHTML + diamanteHtml + '<div style="margin-top:20px;">' + htmlBody + '</div>' + imagesHtml + extraSignatures;
    if (loadedCompanyInfo) fullReport += buildSignatureSection(loadedCompanyInfo);

    res.json({ report: fullReport });
  } catch (error) {
    logger.error('[SGSST Vulnerabilidad] Generation error:', error);
    res.status(500).json({ error: 'Error al generar el análisis' });
  }
});

module.exports = router;
