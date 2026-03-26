const express = require('express');
const requireJwtAuth = require('../../middleware/requireJwtAuth');
const { getUserKey } = require('~/server/services/UserService');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const CompanyInfo = require('../../../models/CompanyInfo');
const { buildStandardHeader, buildSignatureSection, buildCompanyContextString } = require('./reportHeader');
const { logger } = require('~/config');

const router = express.Router();
const mongoose = require('mongoose');

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

    const personalization = req.user?.personalization?.geminiModels;
    const preferredModel = personalization?.sstManagement || 'gemini-2.0-flash';
    const finalModelName = modelName || preferredModel;
    const genAI = new GoogleGenerativeAI(resolvedApiKey);
    const model = genAI.getGenerativeModel({ model: finalModelName });

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
      title: 'PERFIL DE CARGO EXTENSO (GTC 45)',
      companyInfo: loadedCompanyInfo,
      date: currentDate,
      norm: 'Art. 16 de la Resolución 1843 de 2025 & GTC 45:2012',
      responsibleName: req.user?.name,
    });

    const eppText = perfilData.eppSeleccionados?.length > 0
      ? perfilData.eppSeleccionados.join(', ')
      : 'Específicos según riesgo';

    const entrenamientoText = perfilData.entrenamientosSeleccionados?.length > 0
      ? perfilData.entrenamientosSeleccionados.join(', ')
      : 'SST Básico';

    const promptText = `
Eres un Experto Senior en Gestión Humana, Seguridad y Salud en el Trabajo (SG-SST) y Psicología Organizacional con 20 años de experiencia. Tu especialidad es el diseño técnico de perfiles de cargo altamente detallados según la normativa colombiana actual, integrando rigurosamente la **Guía Técnica Colombiana GTC 45 (2012)** y la **Resolución 1843 de 2025 (Art. 16)**.

Tu objetivo es generar el **PERFIL DE CARGO MÁS COMPLETO, EXTENSO Y TÉCNICO POSIBLE** en formato HTML. No escatimes en detalles. Desarrolla cada punto con profundidad académica y práctica.

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
- EPP Seleccionados por el usuario: ${eppText}
- Entrenamientos Seleccionados por el usuario: ${entrenamientoText}
- Contexto Adicional proporcionado: ${perfilData.contextoAdicional || 'No proporcionado'}

**INSTRUCCIONES DE CONTENIDO CRÍTICO:**

1.  **EXTENSIÓN Y PROFUNDIDAD:** Cada sección debe ser rica en texto. Si mencionas una función, explica su impacto. Si mencionas un riesgo, detalla su origen y control según la jerarquía de la GTC 45.
2.  **RIESGOS Y CONTROLES (GTC 45):** Identifica **TODOS** los peligros que apliquen razonablemente al cargo. Clasifícalos según la tabla de peligros de la GTC 45 (Biológico, Físico, Químico, Psicosocial, Biomecánico, Condiciones de Seguridad, Fenómenos Naturales). Para cada peligro, describe controles existentes en la fuente, el medio y la persona.
3.  **NORMATIVA:** Debes mencionar y alinearte explícitamente con el Art. 16 de la Resolución 1843 de 2025.

**ESTRUCTURA OBLIGATORIA (HTML):**

1️⃣ **IDENTIFICACIÓN TÉCNICA DEL CARGO**
   Tabla detallada que incluya también: Código de cargo (si aplica), Versión del perfil, Nivel de Riesgo ARL asignado.

2️⃣ **MISIÓN Y PROPÓSITO ESTRATÉGICO**
   Un texto extenso (mínimo 2 párrafos de 5 líneas) que conecte el cargo con los objetivos de la empresa y la seguridad laboral.

3️⃣ **I. MATRIZ DE FUNCIONES, RESPONSABILIDADES Y RENDICIÓN DE CUENTAS**
   Tabla con 3 columnas: Función Detallada, Periodicidad (Diaria/Semanal/Mensual), y Responsabilidad SST asociada. Incluye al menos 12-15 funciones altamente específicas.

4️⃣ **II. PERFIL DE COMPETENCIAS (SABER, HACER, SER)**
   - **Competencias Técnicas (Saber):** Tabla extensa con conocimientos académicos, normativos y de herramientas.
   - **Competencias del Cargo (Hacer):** Habilidades prácticas.
   - **Competencias Blandas/Socioemocionales (Ser):** Liderazgo, inteligencia emocional, etc.

5️⃣ **III. REQUISITOS DE INGRESO (PROFESIOGRAMA)**
   Tabla con subtítulos para Formación, Experiencia mínima (meses/años), Experiencia específica y **Capacitaciones Obligatorias de Ley**.

6️⃣ **IV. REQUISITOS FÍSICOS Y MENTALES (EXIGENCIAS BIOMECÁNICAS)**
   Detalla posturas (sentado, de pie, caminata), levantamiento de cargas (pesos exactos máximos de ley), exigencia visual, auditiva y carga mental cognitiva.

7️⃣ **V. MATRIZ DE PELIGROS, RIESGOS Y CONTROLES (BASADA EN GTC 45)**
   Tabla con columnas: Clasificación del Peligro | Peligro Específico | Descripción de la Actividad de Riesgo | **Controles Existentes (Fuente, Medio, Persona)** | Efectos Posibles en la Salud.
   *Debe ser la sección más larga del informe.*

8️⃣ **VI. PLAN DE ENTRENAMIENTO Y ELEMENTOS DE PROTECCIÓN (EPP)**
   - Tabla de EPP detallando el tipo de protección (ej. Gafas con filtro UV y antiempañante Z87+). Integra los EPP seleccionados: ${eppText}.
   - Tabla de formación continua y entrenamientos. Integra: ${entrenamientoText}.

9️⃣ **VII. INDICADORES DE GESTIÓN (KPIs)**
   Mínimo 5 indicadores con nombre, fórmula, meta esperada y frecuencia.

🔟 **VIII. AUTORIDAD Y TOMA DE DECISIONES**
   ¿Qué puede decidir el cargo? ¿En qué momentos tiene autoridad para detener un trabajo por riesgo inminente?

**DISEÑO HTML PREMIUM:**
- Usa tablas elegantes, sombreados sutiles en las cabeceras (\`#0f766e\`), y tipografía legible.
- **NO** incluyas bloques de código \`\`\`html. Responde directamente con el código.
- **NO** incluyas firmas.
`;

    const result = await generateWithKeyRotation(model, req.user?.id || req.user, [{ text: promptText }]);
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
