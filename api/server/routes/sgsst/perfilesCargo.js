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
async function generateWithRetry(model, promptParts) {
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(model.apiKey);
  const currentModelName = model.model.replace('models/', '');

  const fallbackOrder = [
    'gemini-3-flash-preview',
    'gemini-3.1-flash-lite-preview',
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite',
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
        generationConfig: model.generationConfig || {},
      });
      return await fallbackModel.generateContent(promptParts);
    } catch (err) {
      console.warn(`[Gemini SDK] Falló ${modelName}: ${err.message}`);
      lastError = err;
    }
  }

  throw new Error(`Todos los modelos fallaron. Último error: ${lastError?.message || 'Desconocido'}`);
}

// ─── Mongoose Schema ──────────────────────────────────────────────────────
const PerfilCargoDataSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  perfilesList: { type: Array, default: [] },
  updatedAt: { type: Date, default: Date.now },
});

PerfilCargoDataSchema.index({ user: 1 }, { unique: true });

const PerfilCargoData =
  mongoose.models.PerfilCargoData ||
  mongoose.model('PerfilCargoData', PerfilCargoDataSchema);

// ─── GET /data ─────────────────────────────────────────────────────────────
router.get('/data', requireJwtAuth, async (req, res) => {
  try {
    const data = await PerfilCargoData.findOne({ user: req.user.id });
    if (data) {
      return res.json({ perfilesList: data.perfilesList || [] });
    }
    res.json({ perfilesList: [] });
  } catch (error) {
    logger.error('[SGSST PerfilesCargo] Load error:', error);
    res.status(500).json({ error: 'Error al cargar datos' });
  }
});

// ─── POST /save ────────────────────────────────────────────────────────────
router.post('/save', requireJwtAuth, async (req, res) => {
  try {
    const { perfilesList } = req.body;
    await PerfilCargoData.findOneAndUpdate(
      { user: req.user.id },
      { $set: { perfilesList, updatedAt: Date.now() } },
      { upsert: true, new: true },
    );
    res.json({ success: true });
  } catch (error) {
    logger.error('[SGSST PerfilesCargo] Save error:', error);
    res.status(500).json({ error: 'Error al guardar datos' });
  }
});

// ─── POST /generate ────────────────────────────────────────────────────────
router.post('/generate', requireJwtAuth, async (req, res) => {
  try {
    const { perfilData, modelName } = req.body;

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
      logger.debug('[SGSST PerfilesCargo] No user Google key found, trying env vars:', err.message);
    }

    if (!resolvedApiKey) {
      resolvedApiKey = process.env.GOOGLE_KEY || process.env.GEMINI_API_KEY;
    }

    if (resolvedApiKey && typeof resolvedApiKey === 'string') {
      resolvedApiKey = resolvedApiKey.split(',')[0].trim();
    }

    if (!resolvedApiKey || resolvedApiKey === 'user_provided') {
      return res.status(400).json({
        error:
          'No se ha configurado la clave API de Google. Por favor, configúrala en la opción de Google del menú principal e intenta nuevamente.',
      });
    }

    const genAI = new GoogleGenerativeAI(resolvedApiKey);
    const model = genAI.getGenerativeModel({ model: modelName || 'gemini-3.1-flash-lite-preview' });
    model.apiKey = resolvedApiKey;

    const currentDate = new Date().toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    let loadedCompanyInfo = null;
    try {
      loadedCompanyInfo = await CompanyInfo.findOne({ user: req.user.id }).lean();
    } catch (e) {
      logger.warn('[SGSST PerfilesCargo] Failed to load company info');
    }

    const companyContext = buildCompanyContextString(loadedCompanyInfo);
    const headerHTML = buildStandardHeader({
      title: 'PERFIL DE CARGO',
      companyInfo: loadedCompanyInfo,
      date: currentDate,
      norm: 'Decreto 1072 de 2015 – Art. 2.2.4.6.28 & Resolución 0312 de 2019',
      responsibleName: req.user?.name,
    });

    const promptText = `
Eres un Experto Senior en Gestión Humana, Seguridad y Salud en el Trabajo (SG-SST) y Psicología Organizacional, especializado en el diseño de perfiles de cargo según la normativa colombiana (Decreto 1072 de 2015, Artículo 2.2.4.6.28, y Resolución 0312 de 2019).

Tu objetivo es generar un **PERFIL DE CARGO COMPLETO, TÉCNICO, PROFESIONAL Y VISUALMENTE ATRACTIVO** en HTML.

**INFORMACIÓN DE LA EMPRESA:**
${companyContext}

**DATOS DEL CARGO A GENERAR:**
- Nombre del Cargo: ${perfilData.nombreCargo || '[PENDIENTE]'}
- Área / Departamento: ${perfilData.area || '[PENDIENTE]'}
- Nivel del Cargo: ${perfilData.nivelCargo || 'Operativo'}
- Tipo de Contrato: ${perfilData.tipoContrato || 'Término indefinido'}
- Jornada Laboral: ${perfilData.jornada || 'Tiempo completo (8 horas/día)'}
- Cargo del Jefe Inmediato: ${perfilData.jefeInmediato || '[PENDIENTE]'}
- Escala Salarial / Rango: ${perfilData.escalasSalarial || 'No especificado'}
- Número de Vacantes: ${perfilData.numVacantes || '1'}
- Descripción General de la Actividad Económica de la empresa: ${loadedCompanyInfo?.generalActivities || loadedCompanyInfo?.economicActivity || 'No especificada'}
- Información adicional / contexto del cargo: ${perfilData.contextoAdicional || 'No proporcionado'}

**INSTRUCCIONES DE ESTRUCTURA Y CONTENIDO OBLIGATORIO (cumple al 100% con Art 2.2.4.6.28 del Decreto 1072):**

**⚠️ REGLA CRÍTICA:** NO incluyas título principal como "PERFIL DE CARGO" ya que el encabezado ya lo tiene. NO repitas Razón Social, NIT, Nivel de Riesgo ni datos de la empresa.

**SECCIONES OBLIGATORIAS — desarróllalas con profundidad y usa tablas HTML elegantes:**

1️⃣ **IDENTIFICACIÓN DEL CARGO**
   Tabla compacta a dos columnas con: Nombre del Cargo, Área/Departamento, Nivel, Reporta a, N° Vacantes, Tipo de Contrato, Jornada, Fecha de vigencia.

2️⃣ **MISIÓN DEL CARGO**
   Párrafo conciso de 2-3 oraciones que explique el propósito estratégico del cargo. Usa el contenedor:
   \`<div style="border-left: 4px solid #0f766e; background-color: #f0fdfa; padding: 16px 20px; border-radius: 0 8px 8px 0; margin-bottom: 20px; font-size: 14px; color: #134e4a; line-height: 1.7;"><strong>Misión:</strong> [texto aquí]</div>\`

3️⃣ **I. FUNCIONES Y RESPONSABILIDADES** (Decreto 1072 — i, ii)
   Tabla de 2 columnas: "Función / Tarea" y "Frecuencia". Incluye mínimo 8-12 funciones detalladas y específicas al cargo y empresa. Las funciones deben ser concretas, con verbos de acción.

4️⃣ **II. HABILIDADES Y COMPETENCIAS** (Decreto 1072 — iii, iv)
   Genera DOS tablas separadas y visualmente diferenciadas:
   - **Tabla A: Competencias Organizacionales** (aplican a todos): Orientación al resultado, Trabajo en equipo, Comunicación asertiva, Adaptabilidad, Ética y transparencia — con nivel requerido (Básico/Intermedio/Avanzado/Experto) y descripción conductual específica.
   - **Tabla B: Competencias Técnicas del Cargo**: mínimo 5 competencias técnicas propias de la función, indicando herramienta/tecnología o área de conocimiento, nivel de dominio y evidencia observable.

5️⃣ **III. REQUISITOS DEL CARGO** (Decreto 1072 — v)
   Tabla única con 3 secciones, separadas por un \`<tr>\` con fondo gris como subtítulo:
   - **Requisitos Educativos**: Formación mínima, Formación deseable, Título requerido.
   - **Requisitos de Experiencia**: Tiempo mínimo de experiencia, Área de experiencia, Experiencia específica valorada.
   - **Requisitos Técnicos**: Manejo de software/equipos, Certificaciones requeridas, Conocimientos normativos exigidos.

6️⃣ **IV. CONDICIONES FÍSICAS Y MENTALES** (Decreto 1072 — v)
   Tabla de valoración con columnas: Condición | Descripción | Nivel de Exigencia (Alto/Medio/Bajo). Cubre: Esfuerzo físico, Postura prolongada, Esfuerzo visual, Capacidad de concentración, Manejo de estrés, Toma de decisiones bajo presión, Trabajo en equipo bajo presión. Sé específico para el cargo.

7️⃣ **V. RIESGOS LABORALES ASOCIADOS** (Decreto 1072 — vi)
   Tabla completa con columnas: Tipo de Peligro (clasificación GTC 45), Descripción del Riesgo Específico, Probabilidad (Alta/Media/Baja), Impacto Potencial. Incluye mínimo 6 riesgos relevantes al cargo y al sector económico de la empresa.

8️⃣ **VI. MEDIDAS PREVENTIVAS Y CONTROLES** (Decreto 1072 — vii)
   Tabla en cascada de jerarquía de controles: Eliminación, Sustitución, Controles de Ingeniería, Controles Administrativos, EPP. Para cada riesgo identificado en la sección anterior, define al menos UN control concreto.

9️⃣ **INDICADORES DE DESEMPEÑO DEL CARGO (KPIs)**
   Tabla con columnas: Indicador | Fórmula de Medición | Meta | Periodicidad. Mínimo 4 KPIs medibles y relevantes al cargo.

🔟 **INDUCCIÓN Y ONBOARDING**
   Lista estructurada con: Programa de inducción (temas clave), duración estimada, formaciones de ley requeridas (SST, SGSST, etc.) y entregables esperados al primer mes, primer trimestre.

**INSTRUCCIONES DE DISEÑO HTML:**
- Tu respuesta DEBE ser EXCLUSIVAMENTE HTML limpio (sin \`\`\`html ni markdown).
- Encabezados de sección: \`<h3 style="color: #0f766e; font-size: 16px; font-weight: 700; text-transform: uppercase; margin: 30px 0 12px 0; padding-bottom: 6px; border-bottom: 2px solid #0f766e;">\`
- Estructura base de TODAS las tablas: \`<table style="width: 100%; table-layout: auto; word-wrap: break-word; border-collapse: separate; border-spacing: 0; border: 1px solid #cbd5e1; border-radius: 8px; margin-bottom: 25px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">\`
- \`<th>\`: \`<th style="background-color: #0f766e; color: #ffffff; padding: 11px 14px; font-size: 12px; font-weight: 700; text-transform: uppercase; text-align: left; border-bottom: 1px solid #065f46;">\`
- \`<td>\`: \`<td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #334155; vertical-align: top;">\`
- Filas alternas: agrega \`background-color: #f8fafc;\` al \`<tr>\` par.
- NO incluyas tablas de firmas. La plataforma las añade automáticamente.
`;

    const result = await generateWithRetry(model, [{ text: promptText }]);
    const response = await result.response;
    const htmlBody = response
      .text()
      .replace(/```html\n? ?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    let fullReport = headerHTML + '<div style="margin-top: 20px;">' + htmlBody + '</div>';

    if (loadedCompanyInfo) {
      fullReport += buildSignatureSection(loadedCompanyInfo);
    }

    res.json({ report: fullReport });
  } catch (error) {
    logger.error('[SGSST PerfilesCargo] Generation error:', error);
    res.status(500).json({ error: 'Error al generar el Perfil de Cargo' });
  }
});

module.exports = router;
