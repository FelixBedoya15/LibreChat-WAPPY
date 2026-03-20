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
    'gemini-3.1-flash-lite-preview', 'gemini-3-flash-preview', 'gemini-2.5-flash', 'gemini-2.5-flash-lite'
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
        amenazasList: data.formData?.amenazasList || [],
        evaluadoresList: data.evaluadoresList || [],
        images: data.images || { foto1: null, foto2: null, foto3: null },
      });
    }
    res.json({ amenazasList: [], evaluadoresList: [], images: { foto1: null, foto2: null, foto3: null } });
  } catch (error) {
    logger.error('[SGSST Vulnerabilidad] Load error:', error);
    res.status(500).json({ error: 'Error al cargar datos' });
  }
});

// ─── POST /save ───────────────────────────────────────────────────────────
router.post('/save', requireJwtAuth, async (req, res) => {
  try {
    const { amenazasList, evaluadoresList, images } = req.body;
    await AnalisisVulnerabilidadData.findOneAndUpdate(
      { user: req.user.id },
      { $set: { "formData.amenazasList": amenazasList, evaluadoresList, images, updatedAt: Date.now() } },
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
    const { amenazasList, evaluadoresList, images, modelName } = req.body;

    const evaluadoresStr = evaluadoresList?.map(r => `${r.nombre || 'Sin nombre'} - ${r.rol || 'Evaluador'} (CC: ${r.cedula || 'N/A'})`).join(', ') || '[PENDIENTE]';

    if (!amenazasList || !Array.isArray(amenazasList) || amenazasList.length === 0) {
      return res.status(400).json({ error: 'Debe proveer al menos una amenaza en la lista.' });
    }

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
    const model = genAI.getGenerativeModel({ model: modelName || 'gemini-3.1-flash-lite-preview' });

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

    function getHex(color) {
      if (color === 'ROJO') return '#dc2626';
      if (color === 'AMARILLO') return '#facc15';
      if (color === 'VERDE') return '#16a34a';
      return '#e2e8f0';
    }

    let diamantesHtml = '<div style="display:flex; flex-wrap:wrap; justify-content:center; gap: 40px; padding: 20px 0;">';
    let resumenConsolidadoContexto = '';

    amenazasList.forEach((am, index) => {
      // Calculate vulnerability scores
      const ptsPers = parseFloat(am.puntajePersonas || 0);
      const ptsRec = parseFloat(am.puntajeRecursos || 0);
      const ptsSist = parseFloat(am.puntajeSistemas || 0);
      
      const amenazaColor = am.nivelAmenaza === 'Inminente' ? 'ROJO' : (am.nivelAmenaza === 'Probable' ? 'AMARILLO' : 'VERDE');
      const colorPers = getRiskColor(ptsPers);
      const colorRec = getRiskColor(ptsRec);
      const colorSist = getRiskColor(ptsSist);
      
      const riskLevel = calculateRiskLevel(amenazaColor, colorPers, colorRec, colorSist);

      diamantesHtml += `
        <div style="text-align:center; min-width: 250px;">
          <h4 style="color:#0f766e; margin-bottom: 15px; font-size: 15px; text-transform:uppercase;">${index + 1}. ${escapeHtml(am.amenaza)}</h4>
          <div style="position:relative; width:160px; height:160px; margin: 0 auto; transform: rotate(45deg);">
            <div style="position:absolute; top:0; left:0; width:75px; height:75px; border:2px solid #333; background-color:${getHex(amenazaColor)};">
               <div style="transform: rotate(-45deg); display:flex; align-items:center; justify-content:center; width:100%; height:100%; font-weight:bold; color:${amenazaColor==='AMARILLO'?'#000':'#fff'}; font-size:10px;">AMENAZA</div>
            </div>
            <div style="position:absolute; top:83px; left:0; width:75px; height:75px; border:2px solid #333; background-color:${getHex(colorPers)};">
               <div style="transform: rotate(-45deg); display:flex; align-items:center; justify-content:center; width:100%; height:100%; font-weight:bold; color:${colorPers==='AMARILLO'?'#000':'#fff'}; font-size:10px;">PERSONAS</div>
            </div>
            <div style="position:absolute; top:0; left:83px; width:75px; height:75px; border:2px solid #333; background-color:${getHex(colorRec)};">
               <div style="transform: rotate(-45deg); display:flex; align-items:center; justify-content:center; width:100%; height:100%; font-weight:bold; color:${colorRec==='AMARILLO'?'#000':'#fff'}; font-size:10px;">RECURSOS</div>
            </div>
            <div style="position:absolute; top:83px; left:83px; width:75px; height:75px; border:2px solid #333; background-color:${getHex(colorSist)};">
               <div style="transform: rotate(-45deg); display:flex; align-items:center; justify-content:center; width:100%; height:100%; font-weight:bold; color:${colorSist==='AMARILLO'?'#000':'#fff'}; font-size:10px;">SISTEMAS</div>
            </div>
          </div>
          <div style="margin-top:25px; font-weight:bold; font-size:13px; color:${riskLevel==='ALTO'?'#dc2626':(riskLevel==='MEDIO'?'#ca8a04':'#16a34a')}">Riesgo Global: ${riskLevel}</div>
        </div>
      `;

      resumenConsolidadoContexto += `
--- AMENAZA ${index + 1}: ${am.amenaza} ---
- Origen: ${am.origenAmenaza}
- Calificación Amenaza: ${am.nivelAmenaza} -> Color: ${amenazaColor}
- Descripción del Riesgo / Contexto local: ${am.descripcionGlobal || 'Sin descripción'}
- VULNERABILIDAD EN PERSONAS: ${ptsPers.toFixed(2)}/3.0 -> Color: ${colorPers}
- VULNERABILIDAD EN RECURSOS: ${ptsRec.toFixed(2)}/3.0 -> Color: ${colorRec}
- VULNERABILIDAD EN SISTEMAS: ${ptsSist.toFixed(2)}/3.0 -> Color: ${colorSist}
- RIESGO GLOBAL PARA ESTA AMENAZA: ${riskLevel}
`;
    });
    
    diamantesHtml += '</div>';

    function escapeHtml(unsafe) {
      if (!unsafe) return '';
      return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    }

    const promptText = `
Eres un Experto Consultor Senior en Gestión del Riesgo de Desastres y Seguridad y Salud en el Trabajo (SST) colombiano, con un enfoque altamente técnico, estratégico e innovador.

Tu objetivo es redactar un **INFORME MAESTRO DE ANÁLISIS DE VULNERABILIDAD MULTI-AMENAZA** que sea EXHAUSTIVO, PROFUNDO y de ALTO IMPACTO GERENCIAL. No aceptaré un informe pobre o genérico. Debes analizar cada detalle con rigor profesional basándote en el Diamante de Colores.

**CONTEXTO GENERAL:**
- Evaluadores del Comité/SST: ${evaluadoresStr}

**LISTADO DE AMENAZAS EVALUADAS (DATOS OFICIALES PARA TU ANÁLISIS):**
${resumenConsolidadoContexto}

**INSTRUCCIONES DE FORMATO HTML:**
- Responde EXCLUSIVAMENTE en HTML limpio, listo para inyectarse en el DOM. NO uses \`\`\`html.
- TODAS las tablas: \`<table style="width:100%;table-layout:fixed;word-wrap:break-word;border-collapse:separate;border-spacing:0;border:1px solid #ccfbf1;border-radius:8px;margin-bottom:25px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.05);">\`
- Headers (<th>): \`<th style="background-color:#0f766e;color:#fff;padding:12px 14px;font-size:13px;font-weight:700;text-transform:uppercase;text-align:left;">\`
- Celdas (<td>): \`<td style="padding:10px 14px;border-bottom:1px solid #f0fdfa;font-size:13px;color:#334155;vertical-align:top;background-color:#fff;">\`

**ESTRUCTURA DEL INFORME QUE DEBES GENERAR:**

NO repitas el título principal ni los datos de la empresa. NO intentes dibujar el diamante visual. NO INCLUVAS bloques de firma ni nombres de personas al final (ya los agrega el sistema automáticamente).

1️⃣ **Introducción Técnica y Alcance**
Un párrafo extenso y formal explicando la metodología de Diamante de Colores (Personas, Recursos, Sistemas, Amenaza), citando la relevancia de la preparación organizacional ante emergencias según la normativa colombiana actual.

2️⃣ **Análisis Forense Detallado por Amenaza (ITERATIVO)**
Por cada una de las amenazas listadas arriba, crea una sección con el título de la amenaza en un \`<h3 style="color:#0f766e; margin-top:30px; border-bottom:1px solid #ccc; padding-bottom:5px;">\`.
Debajo del título deberás crear:
- **Resumen Analítico Estratégico:** Al menos 2 párrafos analizando el escenario de riesgo. Por qué esa combinación de factores (ej. Amenaza Inminente + Vulnerabilidad en Recursos) representa un peligro crítico para la continuidad del negocio y la integridad de la vida. Sé muy descriptivo y profesional.
- **Matriz de Vulnerabilidad Específica:** Una tabla con 3 filas (Personas, Recursos, Sistemas). Para cada una:
    - Muestra el Puntaje y Color que yo te proveí.
    - **Inferencia de Hallazgos:** Deduce técnicamente cuáles son las fallas probables (ej. falta de brigadas, equipos sin mantenimiento, ausencia de backups) que justifican este resultado en el contexto de esa amenaza específica.

3️⃣ **Plan Integrado de Intervención y Mejora (Matriz de Decisiones)**
Una tabla exhaustiva que agrupa las acciones para mitigar TODAS las deficiencias detectadas (especialmente amarillos y rojos).
Columnas de la tabla:
- **Amenaza / Factor:** Qué estamos tratando.
- **Amenaza Asociada:** Nombre de la amenaza.
- **Acción Preventiva / Correctiva:** Una descripción técnica detallada y de alta calidad (no pongas "capacitar", pon "Realizar entrenamiento teórico-práctico en técnicas de escape y rescate...").
- **Jerarquía de Control:** Administrativo, Ingeniería, o Protección.
- **Prioridad / Plazo Sugerido:** Inmediato (Rojos), Corto Plazo (Amarillos).

4️⃣ **Dictamen Final y Declaratoria de Preparación**
Cierra con una declaratoria técnica robusta que determine el nivel de exposición de la entidad. Debe sonar como la conclusión de un auditor experto firmando un peritaje. (RECUERDA: Solo el texto, nada de firmas o nombres finales).
\`;

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

    let fullReport = headerHTML + diamantesHtml + '<div style="margin-top:20px;">' + htmlBody + '</div>' + imagesHtml;
    if (loadedCompanyInfo) fullReport += buildSignatureSection(loadedCompanyInfo);

    res.json({ report: fullReport });
  } catch (error) {
    logger.error('[SGSST Vulnerabilidad] Generation error:', error);
    res.status(500).json({ error: 'Error al generar el análisis' });
  }
});

module.exports = router;
