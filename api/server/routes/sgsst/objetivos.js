const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { AuthKeys } = require('librechat-data-provider');
const { logger } = require('~/config');
const requireJwtAuth = require('~/server/middleware/requireJwtAuth');
const { getUserKey } = require('~/server/services/UserService');
const CompanyInfo = require('~/models/CompanyInfo');
const { Conversation, Message } = require('~/db/models');
const { buildStandardHeader, buildCompanyContextString, buildSignatureSection } = require('./reportHeader');
const auditoriaMap = require('./auditoriaMap');

// ─── HELPER: Google Gemini Fallback ───────────────────────────────────────
async function generateWithRetry(model, promptText, maxRetries = 3 /* fallback modes */) {
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


/**
 * Helper to fetch the latest saved report for a given user and tag.
 */
async function fetchLatestReportText(userId, tag) {
    try {
        const convo = await Conversation.findOne({ user: userId, tags: tag }).sort({ createdAt: -1 }).lean();
        if (convo) {
            const msg = await Message.findOne({ conversationId: convo.conversationId, isCreatedByUser: false }).sort({ createdAt: -1 }).lean();
            if (msg && msg.text) {
                return msg.text;
            }
        }
    } catch (e) {
        logger.warn(`[SGSST Objetivos] Error fetching last report for tag ${tag}:`, e.message);
    }
    return null;
}

/**
 * POST /api/sgsst/objetivos/generate
 * Generates SGSST Objectives using AI, pulling data from Matriz and ATEL if available.
 */
router.post('/generate', requireJwtAuth, async (req, res) => {
    try {
        const {
            policySummary, // User provided or empty
            diagnosticSummary, // User provided or empty
            additionalNorms,
            modelName,
        } = req.body;

        // 1. Retrieve the user's Google API key
        let resolvedApiKey;
        try {
            const storedKey = await getUserKey({ userId: req.user.id, name: 'google' });
            try {
                const parsed = JSON.parse(storedKey);
                resolvedApiKey = parsed[AuthKeys.GOOGLE_API_KEY] || parsed.GOOGLE_API_KEY;
            } catch (parseErr) {
                resolvedApiKey = storedKey;
            }
        } catch (err) {
            logger.debug('[SGSST Objetivos] No user Google key found, trying env vars:', err.message);
        }

        if (!resolvedApiKey) {
            resolvedApiKey = process.env.GOOGLE_KEY || process.env.GEMINI_API_KEY;
        }

        if (resolvedApiKey && typeof resolvedApiKey === 'string') {
            resolvedApiKey = resolvedApiKey.split(',')[0].trim();
        }

        if (!resolvedApiKey) {
            return res.status(400).json({
                error: 'No se ha configurado la clave API de Google. Por favor, configúrala en la opción de Google del chat.',
            });
        }

        // 2. Load company info
        let companyInfoBlock = '';
        let loadedCompanyInfo = null;
        try {
            const ci = await CompanyInfo.findOne({ user: req.user.id }).lean();
            loadedCompanyInfo = ci;
            if (ci && ci.companyName) {
                companyInfoBlock = buildCompanyContextString(ci);
            }
        } catch (ciErr) {
            logger.warn('[SGSST Objetivos] Error loading company info:', ciErr.message);
        }

        // 3. Fetch Política SST Fallback
        let politicaContext = policySummary || 'No hay datos previos de la Política SST registrados.';
        if (!policySummary) {
            const polText = await fetchLatestReportText(req.user.id, 'sgsst-politica');
            if (polText) {
                politicaContext = `Política SST Actual:\n${polText.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').substring(0, 1500)}...`;
            }
        }

        // 4. Fetch Matriz de Peligros Fallback
        let matrixContext = 'No hay datos de matriz de peligros registrados.';
        const matText = await fetchLatestReportText(req.user.id, 'sgsst-matriz-peligros');
        if (matText) {
            matrixContext = `Documento de Identificación de Peligros y Valoración de Riesgos GTC45 más reciente (Extrae los riesgos de nivel V, IV o III mencionados aquí):\n${matText.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').substring(0, 2000)}...`;
        }

        // 5. Fetch ATEL Statistics Fallback
        let atelContext = 'No hay datos de accidentabilidad (ATEL) registrados para el año en curso.';
        const atelText = await fetchLatestReportText(req.user.id, 'sgsst-estadisticas-atel');
        if (atelText) {
            atelContext = `Estadísticas ATEL registradas en el periodo (Extrae exactamente si hubieron accidentes o no, los diagnósticos y las ausencias reportadas):\n${atelText.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').substring(0, 1500)}...`;
        }

        // 6. Fetch Auditoria Fallback
        let auditoriaContext = 'No hay datos de auditoría recientes registrados.';
        const audText = await fetchLatestReportText(req.user.id, 'sgsst-auditoria');
        if (audText) {
            // Try to extract the JSON state if it exists
            const stateMatch = audText.match(/<!-- SGSST_AUDIT_DATA_V1:(.*?) -->/);
            if (stateMatch && stateMatch[1]) {
                try {
                    const stateData = JSON.parse(stateMatch[1]);
                    const failedItems = stateData.statuses?.filter(s => s.status === 'no_cumple' || s.status === 'parcial') || [];
                    if (failedItems.length > 0) {
                        const fallasTextuales = failedItems.map(f => `[${f.itemId}] ${auditoriaMap[f.itemId] || 'Norma no especificada'}`).join(', ');
                        auditoriaContext = `La última auditoría encontró hallazgos Críticos/No Conformidades en los siguientes estándares de la Resolución 0312: ${fallasTextuales}. Formula objetivos para subsanarlos textualmente.`;
                    } else {
                        auditoriaContext = 'La última auditoría tuvo 100% de cumplimiento. Formula objetivos de mantenimiento y mejora continua de los estándares de la Resolución 0312 evaluados.';
                    }
                } catch (e) {
                    let plainText = audText.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
                    auditoriaContext = `Resultados de la última Auditoría Interna:\n${plainText.substring(0, 2000)}...`;
                }
            } else {
                let plainText = audText.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
                auditoriaContext = `Resultados de la última Auditoría Interna:\n${plainText.substring(0, 2000)}...`;
            }
        }

        // 5. Initialize Gemini
        const genAI = new GoogleGenerativeAI(resolvedApiKey);
        const model = genAI.getGenerativeModel({ model: modelName || 'gemini-3-flash-preview' });

        const currentDate = new Date().toLocaleDateString('es-CO', {
            year: 'numeric', month: 'long', day: 'numeric',
        });

        const headerHTML = buildStandardHeader({
            title: 'OBJETIVOS DEL SISTEMA DE GESTIÓN (SG-SST)',
            companyInfo: loadedCompanyInfo,
            date: currentDate,
            norm: 'Decreto 1072 de 2015 / Resolución 0312 de 2019',
            responsibleName: req.user?.name,
        });

        const promptText = `Eres un experto consultor en Sistemas de Gestión de Seguridad y Salud en el Trabajo (SG-SST) en Colombia.

**Fecha de Emisión:** ${currentDate}

## CONTEXTO DE LA EMPRESA
${companyInfoBlock}

## FUENTES DE INFORMACIÓN INTEGRADAS (BASE ESTRICTA PARA LOS OBJETIVOS)
**1. Matriz de Peligros GTC 45 (Riesgos Prioritarios Identificados):**
${matrixContext}

**2. Estadísticas ATEL (Accidentalidad y Ausentismo Reciente):**
${atelContext}

**3. Informe de la Última Auditoría:**
${auditoriaContext}

**4. Política SST Actual:**
${politicaContext}

**5. Resultados del Diagnóstico Inicial (Si el usuario los propuso):**
${diagnosticSummary || 'El usuario no proporcionó el diagnóstico. Concéntrate en la mejora continua por defecto.'}

**Marco Normativo Adicional:**
${additionalNorms || 'Decreto 1072 de 2015, Resolución 0312 de 2019'}

## INSTRUCCIONES ESTRICTAS Y OBLIGATORIAS DE GENERACIÓN

Genera el documento formal de OBJETIVOS DEL SISTEMA DE GESTIÓN (SG-SST) en formato HTML.
**REGLA DE ORO:** TIENES ESTRICTAMENTE PROHIBIDO INVENTAR TEXTO GENÉRICO, PORCENTAJES ALEATORIOS (ej. "reducir 50%") O FRASES DE CAJÓN (ej. "intervenir las causas raíz"). Eres un transcriptor analítico: DEBES tomar los textos LITERALES de las fuentes de información y convertirlos en objetivos.

1. **ENCABEZADO**: DEBES usar EXACTAMENTE el siguiente código HTML para el encabezado (INCLÚYELO TAL CUAL al inicio del informe):
${headerHTML}

2. **INTRODUCCIÓN**: Breve declaración indicando que los objetivos están alineados con la Política de SST, la matriz de peligros, las auditorías previas y las estadísticas presentadas. IMPORTANTÍSIMO MENCIONAR CON EXACTITUD EL NOMBRE DE LOS TEXTOS PROVISTOS QUE NO SE CUMPLEN.

3. **OBJETIVOS GENERALES Y ESPECÍFICOS (Mínimo 5)**:
   - **Objetivo General**: Específico al giro exacto de la empresa, nombrando su misión principal.
   - **Objetivos de Peligros (Extraídos de la Matriz)**: MENCIONA EXACTAMENTE el nombre del Peligro y su Efecto Posible textual, de acuerdo con el documento de Matriz provisto (Si aparece). 
     * *Ejemplo Obligatorio:* "Implementar controles de ingeniería para el riesgo [NOMBRE DEL RIESGO EXACTO] con el fin de prevenir [EFECTO POSIBLE EXACTO] en el proceso [NOMBRE DEL PROCESO]."
   - **Objetivos de Accidentalidad (Extraídos de ATEL)**: Si hubo accidentes, crea un objetivo citando su información textual. Si NO hubo, crea un objetivo de mantenimiento.
     * *Ejemplo Obligatorio (Si hay ATEL):* "Implementar un plan para erradicar las consecuencias de [CONSECUENCIA DEL EVENTO] presentadas tras los eventos con causas de [CAUSA]."
     * *Ejemplo Obligatorio (Cero ATEL):* "Fortalecer la cultura de prevención para mantener en cero (0) el índice de accidentalidad."
   - **Objetivos de Auditoría (Hallazgos Críticos)**: Redacta un objetivo enfocado TEXTUALMENTE en solucionar las No Conformidades mencionadas (Ej. "Subsanar la no conformidad sobre el Reporte de Accidentes" o "Afiliación de Trabajadores"). JAMÁS MENCIONES SU ID INTERNO (aud_X_X_X) en el producto final. Sólo usa EL NOMBRE Y DESCRIPCIÓN en español de lo que no cumple.
   - **CERO GENERALIDADES NI MENTIRAS**: Si recibiste de la base de datos "No hay datos", no hagas objetivos refiriendo "los 3 accidentes ocurridos". Solo usa la info provista.

4. **METAS E INDICADORES (TABLA INTERACTIVA)**:
   Genera una tabla HTML atractiva. Asocia cada Objetivo Específico con su respectiva Meta (ej. 100%, >80%, cero accidentes por [CAUSA ESPECÍFICA]) y su Indicador de medición.

5. **COMUNICACIÓN Y REVISIÓN**:
   Un párrafo indicando la obligación de comunicar los objetivos a todos los trabajadores y revisarlos mínimo una vez al año, tal como exige la norma.

6. **FIRMA**:
   El sistema añadirá la sección de firmas automáticamente. NO la generes tú.

IMPORTANTE: Genera SOLO fragmentos HTML del cuerpo (body). NO incluyas <!DOCTYPE>, <html>, <head>, <body>, <style>, ni etiquetas de documento completo.
MUY IMPORTANTE: NO incluyas tablas de firmas, espacios de aceptación, ni nombres de representantes o responsables al final del documento, ya que el sistema los añadirá automáticamente de forma estandarizada.
Usa etiquetas HTML semánticas (<h1>, <h2>, <p>, <table>, etc).
Para estilos, usa atributos style inline. PRECAUCIÓN MODO OSCURO: Cuando uses \`background-color\`, OBLIGATORIAMENTE declara \`color: #000;\` (fondo claro) o \`color: #fff;\` (fondo oscuro). NO uses clases de Tailwind.
El diseño debe ser elegante con acentos en azul oscuro (#004d99). Tablas deben tener \`width="100%"\`, \`overflow: hidden\`, y colores de cabecera sólidos.
Las tablas DEBEN estar envueltas dentro de un \`<div style="overflow-x: auto; width: 100%; margin-bottom: 20px;">\` y la etiqueta de la tabla debe tener \`min-width: 650px;\` para que desplace lateralmente en celulares.`;

        // 6. Generate the content
        const result = await generateWithRetry(model, promptText);
        const response = await result.response;
        const objectivesHtml = response.text();

        // 7. Clean up
        let cleanedHtml = objectivesHtml
            .replace(/```html\n?/g, '')
            .replace(/```\n?/g, '')
            .trim();

        const bodyMatch = cleanedHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
        if (bodyMatch) cleanedHtml = bodyMatch[1].trim();

        cleanedHtml = cleanedHtml
            .replace(/<!DOCTYPE[^>]*>/gi, '')
            .replace(/<html[^>]*>/gi, '').replace(/<\/html>/gi, '')
            .replace(/<head>[\s\S]*?<\/head>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .trim();

        if (loadedCompanyInfo) {
            cleanedHtml += buildSignatureSection(loadedCompanyInfo);
        }

        res.json({ objectives: cleanedHtml });

    } catch (error) {
        logger.error('[SGSST Objetivos] Generation error:', error);
        res.status(500).json({ error: 'Error al generar los Objetivos SST' });
    }
});

module.exports = router;
