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

// ─── OWAS Risk Category Table (252 combinations) ────────────────────────
// Returns category 1-4 based on back(1-4), arms(1-3), legs(1-7), load(1-3)
// Based on official OWAS table published by Finnish Institute of Occupational Health
const OWAS_TABLE = {
  // Format: `${back}${arms}${legs}${load}` -> category
  // Back=1 (Straight)
  '1111':1,'1112':1,'1113':1,'1121':1,'1122':1,'1123':1,'1131':1,'1132':1,'1133':1,
  '1141':1,'1142':1,'1143':1,'1151':1,'1152':1,'1153':1,'1161':1,'1162':1,'1163':1,
  '1171':1,'1172':1,'1173':1,'1211':1,'1212':1,'1213':1,'1221':1,'1222':1,'1223':1,
  '1231':1,'1232':1,'1233':1,'1241':1,'1242':1,'1243':1,'1251':1,'1252':1,'1253':1,
  '1261':1,'1262':1,'1263':1,'1271':1,'1272':1,'1273':1,'1311':1,'1312':1,'1313':1,
  '1321':1,'1322':1,'1323':1,'1331':1,'1332':1,'1333':1,'1341':1,'1342':1,'1343':1,
  '1351':1,'1352':1,'1353':1,'1361':1,'1362':1,'1363':1,'1371':1,'1372':1,'1373':1,
  // Back=2 (Bent forward)
  '2111':2,'2112':2,'2113':3,'2121':2,'2122':2,'2123':3,'2131':2,'2132':2,'2133':3,
  '2141':2,'2142':2,'2143':3,'2151':2,'2152':2,'2153':3,'2161':2,'2162':2,'2163':3,
  '2171':2,'2172':2,'2173':3,'2211':2,'2212':2,'2213':3,'2221':2,'2222':2,'2223':3,
  '2231':2,'2232':2,'2233':3,'2241':2,'2242':2,'2243':3,'2251':2,'2252':2,'2253':3,
  '2261':2,'2262':2,'2263':3,'2271':2,'2272':2,'2273':3,'2311':2,'2312':3,'2313':3,
  '2321':2,'2322':3,'2323':3,'2331':2,'2332':3,'2333':4,'2341':2,'2342':3,'2343':4,
  '2351':2,'2352':3,'2353':4,'2361':2,'2362':3,'2363':4,'2371':2,'2372':3,'2373':4,
  // Back=3 (Twisted/Bent sideways)
  '3111':1,'3112':1,'3113':1,'3121':1,'3122':1,'3123':2,'3131':1,'3132':1,'3133':2,
  '3141':1,'3142':1,'3143':2,'3151':1,'3152':1,'3153':2,'3161':1,'3162':1,'3163':2,
  '3171':1,'3172':1,'3173':2,'3211':1,'3212':1,'3213':2,'3221':1,'3222':1,'3223':2,
  '3231':1,'3232':1,'3233':2,'3241':1,'3242':1,'3243':2,'3251':1,'3252':1,'3253':2,
  '3261':1,'3262':1,'3263':2,'3271':1,'3272':1,'3273':2,'3311':1,'3312':1,'3313':2,
  '3321':1,'3322':1,'3323':2,'3331':1,'3332':1,'3333':2,'3341':1,'3342':1,'3343':2,
  '3351':1,'3352':1,'3353':2,'3361':1,'3362':1,'3363':2,'3371':1,'3372':1,'3373':2,
  // Back=4 (Bent and twisted)
  '4111':2,'4112':3,'4113':3,'4121':2,'4122':3,'4123':3,'4131':2,'4132':3,'4133':4,
  '4141':2,'4142':3,'4143':4,'4151':2,'4152':3,'4153':4,'4161':2,'4162':3,'4163':4,
  '4171':2,'4172':3,'4173':4,'4211':2,'4212':3,'4213':4,'4221':2,'4222':3,'4223':4,
  '4231':2,'4232':3,'4233':4,'4241':2,'4242':3,'4243':4,'4251':2,'4252':3,'4253':4,
  '4261':2,'4262':3,'4263':4,'4271':2,'4272':3,'4273':4,'4311':2,'4312':3,'4313':4,
  '4321':2,'4322':3,'4323':4,'4331':2,'4332':3,'4333':4,'4341':2,'4342':3,'4343':4,
  '4351':2,'4352':3,'4353':4,'4361':2,'4362':3,'4363':4,'4371':2,'4372':3,'4373':4,
};

function getOwasCategory(back, arms, legs, load) {
  const key = `${back}${arms}${legs}${load}`;
  return OWAS_TABLE[key] || 1;
}

// ─── Mongoose Schema ─────────────────────────────────────────────────────
const MetodoOwasDataSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  formData: { type: Object, default: {} },
  observaciones: { type: Array, default: [] },
  trabajadoresList: { type: Array, default: [] },
  responsablesList: { type: Array, default: [] },
  images: { type: Object, default: {} },
  updatedAt: { type: Date, default: Date.now },
});
MetodoOwasDataSchema.index({ user: 1 }, { unique: true });
const MetodoOwasData = mongoose.models.MetodoOwasData || mongoose.model('MetodoOwasData', MetodoOwasDataSchema);

// ─── GET /data ────────────────────────────────────────────────────────────
router.get('/data', requireJwtAuth, async (req, res) => {
  try {
    const data = await MetodoOwasData.findOne({ user: req.user.id });
    if (data) {
      return res.json({
        formData: data.formData || {},
        observaciones: data.observaciones || [],
        trabajadoresList: data.trabajadoresList || [],
        responsablesList: data.responsablesList || [],
        images: data.images || { foto1: null, foto2: null, foto3: null },
      });
    }
    res.json({ formData: {}, observaciones: [], trabajadoresList: [], responsablesList: [], images: { foto1: null, foto2: null, foto3: null } });
  } catch (error) {
    logger.error('[SGSST OWAS] Load error:', error);
    res.status(500).json({ error: 'Error al cargar datos OWAS' });
  }
});

// ─── POST /save ───────────────────────────────────────────────────────────
router.post('/save', requireJwtAuth, async (req, res) => {
  try {
    const { formData, observaciones, trabajadoresList, responsablesList, images } = req.body;
    await MetodoOwasData.findOneAndUpdate(
      { user: req.user.id },
      { $set: { formData, observaciones, trabajadoresList, responsablesList, images, updatedAt: Date.now() } },
      { upsert: true, new: true }
    );
    res.json({ success: true });
  } catch (error) {
    logger.error('[SGSST OWAS] Save error:', error);
    res.status(500).json({ error: 'Error al guardar datos OWAS' });
  }
});

// ─── POST /generate ───────────────────────────────────────────────────────
router.post('/generate', requireJwtAuth, async (req, res) => {
  try {
    const { formData, observaciones, trabajadoresList, responsablesList, images, modelName } = req.body;

    // Calculate OWAS categories for each observation
    const obsWithCategories = (observaciones || []).map((obs, i) => {
      const cat = getOwasCategory(obs.espalda, obs.brazos, obs.piernas, obs.carga);
      return { ...obs, categoria: cat, numero: i + 1 };
    });

    const totalObs = obsWithCategories.length;
    const catCounts = { 1: 0, 2: 0, 3: 0, 4: 0 };
    obsWithCategories.forEach(o => { catCounts[o.categoria] = (catCounts[o.categoria] || 0) + 1; });
    const dominantCategory = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '1';

    const trabajadoresStr = trabajadoresList?.map(t => `${t.nombre || 'Sin nombre'} (CC: ${t.cedula || 'N/A'})`).join(', ') || '[PENDIENTE]';
    const responsablesStr = responsablesList?.map(r => `${r.nombre || 'Sin nombre'} - ${r.rol || 'Sin Rol'} (CC: ${r.cedula || 'N/A'})`).join(', ') || '[PENDIENTE]';

    const obsTableRows = obsWithCategories.map(o => `
      Obs. #${o.numero}: Espalda=${o.espaldaLabel||o.espalda}, Brazos=${o.brazosLabel||o.brazos}, Piernas=${o.piernasLabel||o.piernas}, Carga=${o.cargaLabel||o.carga} → Código: ${o.espalda}${o.brazos}${o.piernas}${o.carga} → Categoría ${o.categoria}`).join('\n') || '[Sin observaciones registradas]';

    let resolvedApiKey = null;
    try {
      const storedKey = await getUserKey({ userId: req.user.id, name: 'google' });
      try { const parsed = JSON.parse(storedKey); resolvedApiKey = parsed['google'] || parsed.apiKey || parsed.GOOGLE_API_KEY; }
      catch { resolvedApiKey = storedKey; }
    } catch (err) { logger.debug('[SGSST OWAS] No user Google key:', err.message); }

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
    catch (e) { logger.warn('Failed to load company info for OWAS'); }

    const headerHTML = buildStandardHeader({
      title: 'EVALUACIÓN ERGONÓMICA – MÉTODO OWAS',
      companyInfo: loadedCompanyInfo,
      date: currentDate,
      norm: 'GTC 45 (2012) / NTP 452 INSST / Resolución 0312 de 2019',
      responsibleName: req.user?.name,
    });

    const catColors = { 1: '#16a34a', 2: '#ca8a04', 3: '#ea580c', 4: '#dc2626' };
    const catActions = {
      1: 'No se requieren acciones correctivas.',
      2: 'Se requieren acciones correctivas en el corto plazo.',
      3: 'Se requieren acciones correctivas tan pronto como sea posible.',
      4: 'Se requieren acciones correctoras de forma INMEDIATA.'
    };

    const promptText = `
Eres un Ergónomo y Experto Senior en Seguridad y Salud en el Trabajo (SST), especializado en evaluación de carga postural mediante el Método OWAS (Ovako Working Posture Analysis System), la GTC 45 y la Resolución 0312 de 2019 de Colombia.

Tu objetivo es redactar un **INFORME TÉCNICO COMPLETO DE EVALUACIÓN ERGONÓMICA POR MÉTODO OWAS**, exhaustivo y con alto rigor técnico.

**CONTEXTO DE LA EVALUACIÓN:**
- Trabajador(es) Evaluado(s): ${trabajadoresStr}
- Evaluador / Supervisor SST: ${responsablesStr}
- Responsable SG-SST: ${loadedCompanyInfo?.responsibleSST || 'No registrado'}
- Cargo / Puesto evaluado: ${formData.cargo || '[No especificado]'}
- Tarea específica analizada: ${formData.tareaDescripcion || '[No especificada]'}
- Área / Proceso: ${formData.area || '[No especificada]'}
- Fecha de evaluación: ${formData.fecha || currentDate}
- Total de observaciones realizadas: ${totalObs}
- Frecuencia de observación: ${formData.frecuenciaObservacion || 'Cada 30 segundos'}
- Descripción adicional del entorno: ${formData.actividadGlobal || 'No especificado'}

**RESULTADOS NUMÉRICOS OWAS CALCULADOS (Pre-calculados por el sistema, no los recalcules):**
${obsTableRows}

**RESUMEN ESTADÍSTICO OWAS:**
- Total observaciones: ${totalObs}
- Categoría 1 (Sin riesgo): ${catCounts[1]} obs. (${totalObs > 0 ? Math.round(catCounts[1]/totalObs*100) : 0}%)
- Categoría 2 (Riesgo Moderado): ${catCounts[2]} obs. (${totalObs > 0 ? Math.round(catCounts[2]/totalObs*100) : 0}%)
- Categoría 3 (Riesgo Alto): ${catCounts[3]} obs. (${totalObs > 0 ? Math.round(catCounts[3]/totalObs*100) : 0}%)
- Categoría 4 (Riesgo Crítico/Inmediato): ${catCounts[4]} obs. (${totalObs > 0 ? Math.round(catCounts[4]/totalObs*100) : 0}%)
- Categoría DOMINANTE de la evaluación: **Categoría ${dominantCategory}** → ${catActions[dominantCategory]}

**INSTRUCCIONES (TU TAREA – Responde EXCLUSIVAMENTE en HTML limpio):**

NO repitas el título principal ni los datos de la empresa; el encabezado ya está incluido.

1️⃣ **Contexto del Puesto de Trabajo y Descripción de la Tarea**
Tabla con: Cargo/Puesto, Área, Tarea evaluada, Duración jornada estimada, Número observaciones, Frecuencia muestreo.
Bloque de contexto obligatorio: \`<div style="border-left: 4px solid #7c3aed; background-color: #f5f3ff; padding: 16px 20px; border-radius: 0 8px 8px 0; margin-bottom: 25px; font-size: 13.5px; color: #3b0764; line-height: 1.6;"><strong>Naturaleza Ergonómica de la Tarea:</strong> [ANÁLISIS TÉCNICO DE LA COMPLEJIDAD POSTURAL INTRÍNSECA DE ESTA TAREA, FACTORES DE RIESGO BIOMECÁNICO PRESENTES Y ENFOQUE DE INTERVENCIÓN]</div>\`

2️⃣ **Tabla de Codificación OWAS – Registro Completo de Observaciones**
Tabla EXHAUSTIVA con CADA observación registrada. Columnas: N°, Descripción postura observada, Código Espalda (1-4), Código Brazos (1-3), Código Piernas (1-7), Carga/Fuerza (1-3), Código OWAS (4 dígitos), Categoría de Riesgo. Cada fila de categoría 3 o 4 usa color de fondo rojo/naranja. (Recuerda: usa EXACTAMENTE los valores pre-calculados arriba, NO los recalcules).

3️⃣ **Análisis de Frecuencia por Segmento Corporal**
Tres sub-tablas separadas:
- Distribución de posturas de Espalda (cuántas observaciones en cada código 1,2,3,4 y %)
- Distribución de posturas de Brazos (cuántas en 1,2,3 y %)
- Distribución de posturas de Piernas (cuántas en 1,2,3,4,5,6,7 y %)
Para cada código, incluye el nombre descriptivo de la postura y una conclusión corta.

4️⃣ **Gráfico de Resultados (Representación HTML)**
Crea una representación visual de barras usando divs con anchos proporcionales (NO imágenes, NO scripts externos) mostrando el porcentaje de cada categoría de riesgo OWAS. Usa los colores: Verde=#16a34a, Amarillo=#ca8a04, Naranja=#ea580c, Rojo=#dc2626. Ejemplo de barra: \`<div style="background:#16a34a;width:XX%;height:28px;display:inline-block;border-radius:4px;"></div>\`

5️⃣ **Diagnóstico Ergonómico por Segmento Corporal**
Tabla analizando el riesgo específico para cada segmento: Espalda, Brazos, Hombros, Piernas/Rodillas, considerando los patrones de las posturas más frecuentes. Columnas: Segmento, Postura más frecuente observada, Carga biomecánica acumulada, Lesión/Enfermedad probable a largo plazo, Nivel de urgencia de intervención.

6️⃣ **Plan de Acción Ergonómico Detallado (Jerarquía de Controles)**
Tabla extensa con medidas de control ordenadas por jerarquía, enfocadas en las categorías de mayor riesgo detectadas:
- Controles de Ingeniería (rediseño del puesto, herramientas, alturas de trabajo)
- Controles Administrativos (rotación de puestos, pausas activas programadas, capacitación)
- EPP (fajas lumbares si aplica, rodilleras, etc.)
Para cada medida: Tipo de control, Descripción detallada, Segmento corporal beneficiado, Prioridad, Responsable.

7️⃣ **Informe Analítico del Ergónomo (Evaluación Completa y Recomendaciones)**
REGLA: EXTREMADAMENTE extenso, múltiples párrafos. Debe incluir:
- Análisis de la carga postural acumulada a lo largo de la jornada
- Relación de las posturas identificadas con enfermedades laborales típicas (dolor lumbar, síndrome del manguito rotador, condromalacia patelar, etc.)
- Evaluación del cumplimiento normativo según GTC 45 y Decreto 1072
- Estrategias de implementación del programa de vigilancia epidemiológica osteomuscular
- Conclusiones técnicas específicas por perfil de riesgo identificado

8️⃣ **Dictamen Ergonómico Final (Bloque Gráfico)**
\`<div style="border: 2px solid #7c3aed; border-radius: 8px; padding: 25px; text-align: center; margin-top: 35px; margin-bottom: 25px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); background-color: #faf5ff;">\`
- Título: \`<h4 style="color: #7c3aed; font-size: 16px; font-weight: bold; text-transform: uppercase; margin-top: 0;">DICTAMEN ERGONÓMICO – MÉTODO OWAS</h4>\`
- Categoría dominante con su color correspondiente
- Botón de nivel de riesgo: usa ${catColors[dominantCategory]} como color de fondo y la acción "${catActions[dominantCategory]}"
- Texto final: Indicación de seguimiento y periodicidad de re-evaluación recomendada.

**INSTRUCCIONES DE DISEÑO HTML:**
- Respuesta EXCLUSIVAMENTE en HTML limpio.
- TODAS las tablas: \`<table style="width:100%;table-layout:fixed;word-wrap:break-word;border-collapse:separate;border-spacing:0;border:1px solid #c4b5fd;border-radius:8px;margin-bottom:25px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.05);">\`
- Headers (<th>): \`<th style="background-color:#7c3aed;color:#fff;padding:12px 14px;font-size:13px;font-weight:700;text-transform:uppercase;text-align:left;">\`
- Celdas (<td>): \`<td style="padding:10px 14px;border-bottom:1px solid #ede9fe;font-size:13px;color:#334155;vertical-align:top;background-color:#fff;">\`
- NO agregues tablas de firmas; la plataforma las incluye automáticamente.
`;

    const parts = [{ text: promptText }];

    if (images) {
      Object.keys(images).forEach((key, index) => {
        const b64 = images[key];
        if (b64) {
          const match = b64.match(/^data:(image\/\w+);base64,(.+)$/);
          if (match) {
            parts.push({ inlineData: { data: match[2], mimeType: match[1] } });
            parts.push({ text: `(Fotografía del puesto de trabajo ${index + 1}: ${key})` });
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
        <h3 style="color:#7c3aed;border-bottom:2px solid #7c3aed;padding-bottom:5px;">ANEXO: REGISTRO FOTOGRÁFICO DEL PUESTO DE TRABAJO</h3>
        <div style="display:flex;gap:20px;flex-wrap:wrap;margin-top:15px;">`;
      const labels = ['Puesto de Trabajo (Vista General)', 'Postura durante la Tarea', 'Herramientas y Entorno'];
      ['foto1', 'foto2', 'foto3'].forEach((k, i) => {
        if (images[k]) {
          imagesHtml += `<div style="flex:1;min-width:250px;border:1px solid #ddd;padding:10px;border-radius:8px;text-align:center;">
            <img src="${images[k]}" style="width:100%;height:auto;max-width:300px;border-radius:4px;object-fit:contain;margin-bottom:10px;" alt="Foto ${i + 1}" />
            <strong style="color:#7c3aed;font-size:14px;display:block;">${labels[i]}</strong>
            <span style="font-size:12px;color:#555;">Registro fotográfico OWAS</span></div>`;
        }
      });
      imagesHtml += `</div></div>`;
    }

    // Signatures
    let extraSignatures = '';
    if (trabajadoresList?.length || responsablesList?.length) {
      extraSignatures += '<div style="margin-top:50px;page-break-inside:avoid;">';
      extraSignatures += '<h4 style="text-align:center;color:#1e293b;margin-bottom:20px;">FIRMAS – EVALUACIÓN ERGONÓMICA OWAS</h4>';
      extraSignatures += '<table style="width:100%;border-collapse:collapse;"><tr>';
      let count = 0;
      const addSig = (name, role, idType, cedula) => {
        if (count > 0 && count % 2 === 0) extraSignatures += '</tr><tr>';
        extraSignatures += `<td style="width:50%;padding:20px;text-align:center;vertical-align:bottom;">
          <div class="signature-placeholder" data-signature-id="dyn_${idType}_${count}" style="border-bottom:2px solid #333;width:80%;margin:0 auto 10px auto;min-height:80px;display:flex;align-items:center;justify-content:center;background-color:#f9f9f9;cursor:pointer;border-radius:8px 8px 0 0;">
            <span style="color:#999;font-size:12px;">Haga clic para insertar FIRMA DIGITAL</span></div>
          <div style="font-weight:800;font-size:14px;color:#1e293b;text-transform:uppercase;">${name}</div>
          <div style="font-size:12px;color:#64748b;font-weight:600;">${role}</div>
          <div style="font-size:11px;color:#94a3b8;">CC: ${cedula}</div></td>`;
        count++;
      };
      trabajadoresList?.forEach(t => { if (t.nombre) addSig(t.nombre, 'Trabajador Evaluado', 'trabajador', t.cedula || 'N/A'); });
      responsablesList?.forEach(r => { if (r.nombre) addSig(r.nombre, r.rol || 'Evaluador / Ergónomo', 'resp', r.cedula || 'N/A'); });
      if (count % 2 !== 0) extraSignatures += '<td style="width:50%;"></td>';
      extraSignatures += '</tr></table></div>';
    }

    let fullReport = headerHTML + '<div style="margin-top:20px;">' + htmlBody + '</div>' + imagesHtml + extraSignatures;
    if (loadedCompanyInfo) fullReport += buildSignatureSection(loadedCompanyInfo);

    res.json({ report: fullReport });
  } catch (error) {
    logger.error('[SGSST OWAS] Generation error:', error);
    res.status(500).json({ error: 'Error al generar el informe OWAS' });
  }
});

module.exports = router;
