const express = require('express');
const requireJwtAuth = require('../../middleware/requireJwtAuth');
const { getUserKey } = require('~/server/services/UserService');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const CompanyInfo = require('../../../models/CompanyInfo');
const { buildStandardHeader, buildSignatureSection, buildCompanyContextString } = require('./reportHeader');
const { logger } = require('~/config');

const router = express.Router();
const mongoose = require('mongoose');

// ─── HELPER: Google Gemini Fallback ───────────────────────────────────────
async function generateWithRetry(model, promptText) {
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(model.apiKey);
  const currentModelName = model.model.replace('models/', '');

  const fallbackOrder = [
    'gemini-3-flash-preview',
    'gemini-3.1-flash-lite-preview',
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite'
  ];

  let modelsToTry = [currentModelName];
  for (const m of fallbackOrder) {
    if (m !== currentModelName) modelsToTry.push(m);
  }

  let lastError;
  for (const modelName of modelsToTry) {
    if (!modelName) continue;
    try {
      if (modelName !== currentModelName) {
        console.warn(`[Gemini SDK] Cambiando a modelo de respaldo: ${modelName}...`);
      }
      const fallbackModel = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: model.generationConfig || {}
      });
      return await fallbackModel.generateContent(promptText);
    } catch (err) {
      console.warn(`[Gemini SDK] Falló ${modelName}: ${err.message}`);
      lastError = err;
    }
  }

  throw new Error(`Todos los modelos generativos fallaron. Último error: ${lastError?.message || 'Desconocido'}`);
}

// ─── Mongoose Schema ─────────────────────────────────────────────────────
const AnalisisTrabajoSeguroDataSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  formData: { type: Object, default: {} },
  trabajadoresList: { type: Array, default: [] },
  responsablesList: { type: Array, default: [] },
  images: { type: Object, default: {} },
  updatedAt: { type: Date, default: Date.now },
});
AnalisisTrabajoSeguroDataSchema.index({ user: 1 }, { unique: true });

const AnalisisTrabajoSeguroData = mongoose.models.AnalisisTrabajoSeguroData ||
  mongoose.model('AnalisisTrabajoSeguroData', AnalisisTrabajoSeguroDataSchema);

// ─── GET /data ────────────────────────────────────────────────────────────
router.get('/data', requireJwtAuth, async (req, res) => {
  try {
    const data = await AnalisisTrabajoSeguroData.findOne({ user: req.user.id });
    if (data) {
      return res.json({
        formData: data.formData || {},
        trabajadoresList: data.trabajadoresList || [],
        responsablesList: data.responsablesList || [],
        images: data.images || { foto1: null, foto2: null, foto3: null },
      });
    }
    res.json({ formData: {}, trabajadoresList: [], responsablesList: [], images: { foto1: null, foto2: null, foto3: null } });
  } catch (error) {
    logger.error('[SGSST ATS] Load error:', error);
    res.status(500).json({ error: 'Error al cargar datos ATS' });
  }
});

// ─── POST /save ───────────────────────────────────────────────────────────
router.post('/save', requireJwtAuth, async (req, res) => {
  try {
    const { formData, trabajadoresList, responsablesList, images } = req.body;
    await AnalisisTrabajoSeguroData.findOneAndUpdate(
      { user: req.user.id },
      { $set: { formData, trabajadoresList, responsablesList, images, updatedAt: Date.now() } },
      { upsert: true, new: true }
    );
    res.json({ success: true });
  } catch (error) {
    logger.error('[SGSST ATS] Save error:', error);
    res.status(500).json({ error: 'Error al guardar datos ATS' });
  }
});

// ─── POST /generate ───────────────────────────────────────────────────────
router.post('/generate', requireJwtAuth, async (req, res) => {
  try {
    const { formData, trabajadoresList, responsablesList, images, modelName } = req.body;

    const trabajadoresStr = trabajadoresList?.map(t =>
      `${t.nombre || 'Sin nombre'} (CC: ${t.cedula || 'N/A'})`).join(', ') || '[PENDIENTE]';
    const responsablesStr = responsablesList?.map(r =>
      `${r.nombre || 'Sin nombre'} - ${r.rol || 'Sin Rol'} (CC: ${r.cedula || 'N/A'})`).join(', ') || '[PENDIENTE]';

    let resolvedApiKey = null;
    try {
      const storedKey = await getUserKey({ userId: req.user.id, name: 'google' });
      try {
        const parsed = JSON.parse(storedKey);
        resolvedApiKey = parsed['google'] || parsed.apiKey || parsed.GOOGLE_API_KEY;
      } catch {
        resolvedApiKey = storedKey;
      }
    } catch (err) {
      logger.debug('[SGSST ATS] No user Google key found:', err.message);
    }

    if (!resolvedApiKey) resolvedApiKey = process.env.GOOGLE_KEY || process.env.GEMINI_API_KEY;
    if (resolvedApiKey && typeof resolvedApiKey === 'string') resolvedApiKey = resolvedApiKey.split(',')[0].trim();

    if (!resolvedApiKey || resolvedApiKey === 'user_provided') {
      return res.status(400).json({
        error: 'No se ha configurado la clave API de Google. Por favor, configúrala en la opción de Google del menú principal.',
      });
    }

    const genAI = new GoogleGenerativeAI(resolvedApiKey);
    const model = genAI.getGenerativeModel({ model: modelName || 'gemini-3-flash-preview' });

    const currentDate = new Date().toLocaleDateString('es-CO', {
      year: 'numeric', month: 'long', day: 'numeric',
    });

    let loadedCompanyInfo = null;
    try {
      loadedCompanyInfo = await CompanyInfo.findOne({ user: req.user.id }).lean();
    } catch (e) {
      logger.warn('Failed to load company info for ATS');
    }

    const headerHTML = buildStandardHeader({
      title: 'ANÁLISIS DE TRABAJO SEGURO (ATS)',
      companyInfo: loadedCompanyInfo,
      date: currentDate,
      norm: 'Resolución 0312 de 2019 / Decreto 1072 de 2015 / GTC 45',
      responsibleName: req.user?.name,
    });

    const promptText = `
Eres un Experto Técnico Senior en Seguridad y Salud en el Trabajo (SST) colombiano, especializado en la elaboración de Análisis de Trabajo Seguro (ATS) según los lineamientos del Decreto 1072 de 2015, la Resolución 0312 de 2019 y la Guía Técnica Colombiana GTC 45.

Tu objetivo es redactar un **ANÁLISIS DE TRABAJO SEGURO (ATS) EXHAUSTIVO, TÉCNICO Y DE ALTA CALIDAD**, listo para imprimir y firmar.

**REGLA CRÍTICA SOBRE PERSONAL:**
SOLO puedes incluir a las personas listadas. NO inventes personal adicional.
- Trabajadores que ejecutan la tarea: ${trabajadoresStr}
- Supervisor / Líderes de área: ${responsablesStr}
- Responsable SG-SST: ${loadedCompanyInfo?.responsibleSST || 'No registrado'}

**REGLA GLOBAL DE CERO INVENCIONES (ANTI-ALUCINACIÓN):**
NUNCA inventes pasos, equipos, herramientas, valores, medidas o condiciones que no estén especificados por el usuario. Si un dato no está disponible, escribe literalmente: *<span style="color:#64748b; font-style:italic;">"No especificado en la solicitud – Debe definirse antes de iniciar la tarea"</span>*.

**DATOS APORTADOS PARA EL ATS:**
- Fecha de ejecución: ${formData.fecha || '[PENDIENTE]'} | Hora inicio: ${formData.horaInicio || '[PENDIENTE]'}
- Contexto preoperacional:
    * Charla de Seguridad (5 minutos): ${formData.seguridadSocial === 'Sí' ? '✅ Realizada antes de iniciar' : '❌ No realizada'}
    * Equipo y Herramientas Inspeccionados: ${formData.aptitudMedica === 'Sí' ? '✅ Pre-inspección completada' : '❌ Pendiente de inspección'}
    * Condiciones del Área Verificadas: ${formData.certificacionAlturas === 'Sí' ? '✅ Área apta para operar' : '❌ Condiciones no verificadas'}
- Tarea a Analizar (Descripción completa): ${formData.actividadGlobal || '[INFORMACIÓN PENDIENTE]'}
- Contexto fotográfico: ${formData.foto1Desc || 'Sin descripción'} | ${formData.foto2Desc || 'Sin descripción'} | ${formData.foto3Desc || 'Sin descripción'}

**ESTRUCTURA OBLIGATORIA DEL ATS (usa tablas HTML para absolutamente todo):**

NO generes un título principal como "ANÁLISIS DE TRABAJO SEGURO", el encabezado ya está incluido. TAMPOCO repitas el nombre de la empresa, NIT o nivel de riesgo.

1️⃣ **Identificación de la Tarea**
Tabla con: Tipo de tarea, Área/Proceso, Fecha y hora de ejecución, Categoría de riesgo estimada, Número de trabajadores, Duración estimada.
Luego, un bloque de contexto (obligatorio):
\`<div style="border-left: 4px solid #1d4ed8; background-color: #eff6ff; padding: 16px 20px; border-radius: 0 8px 8px 0; margin-bottom: 25px; margin-top: -10px; font-size: 13.5px; color: #1e3a8a; line-height: 1.6;"><strong>Resumen Técnico de la Tarea:</strong> [ANÁLISIS PROFUNDO DE LA NATURALEZA, COMPLEJIDAD Y NIVEL DE RIESGO INTRÍNSECO DE LA LABOR A EJECUTAR]</div>\`

2️⃣ **Verificación Preoperacional y Recursos Requeridos**
Tabla con 2 secciones separadas:
- Sección A: Chequeo preoperacional (Estado de la Charla de Seguridad, Inspección de Equipos, Verificación del Área) con resultado ✅/❌ según los datos suministrados.
- Sección B: Listado de todos los equipos, herramientas, materiales y EPP que se deducen como NECESARIOS para ejecutar la tarea descrita.

3️⃣ **Análisis Paso a Paso de la Tarea (Núcleo del ATS)**
Esta es la tabla más importante. Desarrolla CADA paso de la tarea con MÁXIMO DETALLE TÉCNICO.
Columnas obligatorias:
- **N° Paso**: Número secuencial.
- **Descripción Detallada del Paso**: Qué acción exacta se ejecuta, cómo, con qué.
- **Peligros Identificados (GTC 45)**: Clasificación estricta: Físico, Químico, Biológico, Psicosocial, Biomecánico, Condiciones de Seguridad o Fenómenos Naturales.
- **Consecuencias / Efectos Posibles**: Qué accidente o daño podría ocurrir.
- **Medidas de Control (Jerarquía)**: Eliminación → Sustitución → Ingeniería → Administrativo → EPP.
- **Responsable del Control**: Quién supervisa ese paso (de los listados).

REGLA: Genera un mínimo de 8 pasos. Si la tarea es compleja, genera tantos como necesite. NUNCA hagas resúmenes ni compactes pasos diferentes en uno solo.

4️⃣ **Matriz de Riesgo Residual (Después de Controles)**
Tabla valorando el riesgo residual DESPUÉS de aplicar los controles de la tabla anterior. Sigue metodología simple.
Columnas: Paso, Peligro, Probabilidad residual (Alta/Media/Baja), Impacto (Alto/Medio/Bajo), Nivel de Riesgo Residual (Crítico/Moderado/Aceptable), Acción requerida.

5️⃣ **EPP Obligatorio Detallado**
Tabla listando CADA elemento de protección personal que el trabajador DEBE usar durante TODA la tarea. Columnas: EPP, Norma técnica aplicable (NTC / ANSI / EN), Verificación de uso ✅/❌.

6️⃣ **Plan de Respuesta ante Emergencias**
Tabla con los pasos de acción inmediata en caso de: 1) Accidente/Lesión de un trabajador, 2) Incendio o explosión, 3) Derrame de material peligroso (si aplica). Incluye números de emergencia y equipos de respuesta disponibles en sitio.

7️⃣ **Informe Técnico de Gestión del Riesgo (Análisis y Recomendaciones del Experto SST)**
**REGLA OBLIGATORIA:** Extenso, múltiples párrafos, muy técnico y profundo. NO un párrafo corto.
Analiza: La complejidad intrínseca de la tarea y su potencial de daño. Relación de la tarea con el sistema de gestión SST. Recomendaciones operativas, de ingeniería y administrativas para garantizar la seguridad sostenible. Controles complementarios sugeridos. Referencia normativa aplicable.

8️⃣ **Declaración de Comprensión y Autorización (Bloque Gráfico)**
Tabla de verificación final:
\`<div style="border: 2px solid #1d4ed8; border-radius: 8px; padding: 25px; text-align: center; margin-top: 35px; margin-bottom: 25px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); background-color: #f0f9ff;">\`
- Título: \`<h4 style="color: #1d4ed8; font-size: 16px; font-weight: bold; text-transform: uppercase; margin-top: 0;">AUTORIZACIÓN DE INICIO DE TRABAJO</h4>\`
- Párrafo declarando que los trabajadores conocen los riesgos, han recibido la charla de seguridad y se comprometen a cumplir las medidas establecidas en el ATS.
- Botón: \`<div style="display: inline-block; background-color: #16a34a; color: white; padding: 12px 24px; border-radius: 6px; font-weight: bold; font-size: 16px; margin: 15px 0;">AUTORIZADO PARA INICIAR</div>\` (usa rojo #dc2626 y texto "INICIO NO AUTORIZADO" si hay ítems del preoperacional sin cumplir).
- Nota final en pequeño: *"Este ATS pierde vigencia si las condiciones de la tarea cambian. En ese caso, debe elaborarse uno nuevo."*

**INSTRUCCIONES DE DISEÑO HTML y TABLAS:**
- Respuesta EXCLUSIVAMENTE en código HTML limpio.
- TODAS las tablas: \`<table style="width: 100%; table-layout: fixed; word-wrap: break-word; border-collapse: separate; border-spacing: 0; border: 1px solid #cbd5e1; border-radius: 8px; margin-bottom: 25px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">\`
- Encabezados (<th>): \`<th style="background-color: #1d4ed8; color: #ffffff; padding: 12px 14px; font-size: 13px; font-weight: 700; text-transform: uppercase; text-align: left; border-bottom: 1px solid #1e40af; word-wrap: break-word;">\`
- Celdas (<td>): \`<td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #f1f5f9; font-size: 13px; color: #334155; vertical-align: top; word-wrap: break-word; overflow-wrap: break-word; background-color: #ffffff;">\`
- Filas alternas con: background-color: #f8fafc; para mejor legibilidad.
- NO agregues tablas de firmas ni botones adicionales; la plataforma los incluye automáticamente.
`;

    const parts = [{ text: promptText }];

    if (images) {
      Object.keys(images).forEach((key, index) => {
        const b64 = images[key];
        if (b64) {
          const match = b64.match(/^data:(image\/\w+);base64,(.+)$/);
          if (match && match.length === 3) {
            parts.push({ inlineData: { data: match[2], mimeType: match[1] } });
            parts.push({ text: `(Fotografía de contexto ${index + 1}: ${key})` });
          }
        }
      });
    }

    const result = await generateWithRetry(model, parts);
    const response = await result.response;
    const htmlBody = response.text().replace(/```html\n ? /g, '').replace(/```\n?/g, '').trim();

    // Images annex
    let imagesHtml = '';
    if (images.foto1 || images.foto2 || images.foto3) {
      imagesHtml = `
        <div style="margin-top: 30px; margin-bottom: 30px;">
          <h3 style="color: #1d4ed8; border-bottom: 2px solid #1d4ed8; padding-bottom: 5px;">ANEXO: REGISTRO FOTOGRÁFICO DEL ÁREA Y TAREA</h3>
          <div style="display: flex; gap: 20px; flex-wrap: wrap; margin-top: 15px;">`;

      const labels = ['Vista General del Área de Trabajo', 'Detalle de Equipos / Herramientas', 'Condiciones del Entorno'];
      ['foto1', 'foto2', 'foto3'].forEach((k, i) => {
        if (images[k]) {
          imagesHtml += `
            <div style="flex: 1; min-width: 250px; border: 1px solid #ddd; padding: 10px; border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
              <img src="${images[k]}" style="width: 100%; height: auto; max-width: 300px; border-radius: 4px; object-fit: contain; margin-bottom: 10px;" alt="Foto ${i + 1}" />
              <strong style="color: #1d4ed8; font-size: 14px; display: block;">${labels[i]}</strong>
              <span style="font-size: 12px; color: #555;">Fotografía de contexto para el ATS</span>
            </div>`;
        }
      });
      imagesHtml += `</div></div>`;
    }

    // Signatures
    let extraSignatures = '';
    if (trabajadoresList?.length || responsablesList?.length) {
      extraSignatures += '<div style="margin-top: 50px; page-break-inside: avoid;">';
      extraSignatures += '<h4 style="text-align: center; color: #1e293b; margin-bottom: 20px;">FIRMAS DE PARTICIPANTES – ANÁLISIS DE TRABAJO SEGURO</h4>';
      extraSignatures += '<table style="width: 100%; border-collapse: collapse;"><tr>';

      let count = 0;
      const addSig = (name, role, idType, cedula) => {
        if (count > 0 && count % 2 === 0) extraSignatures += '</tr><tr>';
        extraSignatures += `
          <td style="width: 50%; padding: 20px; text-align: center; vertical-align: bottom;">
            <div class="signature-placeholder" data-signature-id="dyn_${idType}_${count}" style="border-bottom: 2px solid #333; width: 80%; margin: 0 auto 10px auto; min-height: 80px; display: flex; align-items: center; justify-content: center; background-color: #f9f9f9; cursor: pointer; border-radius: 8px 8px 0 0; transition: all 0.3s ease;">
              <span style="color: #999; font-size: 12px;">Haga clic para insertar FIRMA DIGITAL</span>
            </div>
            <div style="font-weight: 800; font-size: 14px; color: #1e293b; text-transform: uppercase;">${name}</div>
            <div style="font-size: 12px; color: #64748b; font-weight: 600;">${role}</div>
            <div style="font-size: 11px; color: #94a3b8;">CC: ${cedula}</div>
          </td>`;
        count++;
      };

      trabajadoresList?.forEach(t => { if (t.nombre) addSig(t.nombre, 'Trabajador Ejecutor', 'trabajador', t.cedula || 'N/A'); });
      responsablesList?.forEach(r => { if (r.nombre) addSig(r.nombre, r.rol || 'Supervisor / Responsable', 'responsable', r.cedula || 'N/A'); });

      if (count % 2 !== 0) extraSignatures += '<td style="width: 50%;"></td>';
      extraSignatures += '</tr></table></div>';
    }

    let fullReport = headerHTML + '<div style="margin-top: 20px;">' + htmlBody + '</div>' + imagesHtml + extraSignatures;
    if (loadedCompanyInfo) fullReport += buildSignatureSection(loadedCompanyInfo);

    res.json({ report: fullReport });
  } catch (error) {
    logger.error('[SGSST ATS] Generation error:', error);
    res.status(500).json({ error: 'Error al generar el Análisis de Trabajo Seguro' });
  }
});

module.exports = router;
