const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { AuthKeys } = require('librechat-data-provider');
const { requireJwtAuth } = require('../../middleware/');
const CompanyInfo = require('../../../models/CompanyInfo');
const { getUserKey } = require('~/server/services/UserService');
const { logger } = require('~/config');
const { buildStandardHeader, buildCompanyContextString, buildSignatureSection } = require('./reportHeader');

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


router.post('/generate-chapter', requireJwtAuth, async (req, res) => {
    try {
        const { chapterTitle, userInput, chapterIndex, isLast, previousHtml, modelName } = req.body;
        const userId = req.user.id;

        // Fetch company info
        const companyInfo = await CompanyInfo.findOne({ user: userId });
        if (!companyInfo) {
            return res.status(404).json({ error: 'Company information not found. Please complete it first.' });
        }

        let prompt;

        // Ensure we don't send endless context, max 10000 chars of prior history to save tokens
        const truncatedContext = previousHtml ? previousHtml.substring(Math.max(0, previousHtml.length - 10000)) : '';

        if (chapterIndex === 0) {
            const headerHTML = buildStandardHeader({
                title: 'REGLAMENTO INTERNO DE TRABAJO',
                companyInfo: companyInfo,
                date: new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' }),
                norm: 'Código Sustantivo del Trabajo',
                responsibleName: companyInfo.legalRepresentative || req.user?.name
            });

            prompt = `Actúa como un abogado experto en derecho laboral corporativo en Colombia.
Estás redactando paso a paso el REGLAMENTO INTERNO DE TRABAJO (RIT) para la siguiente empresa:
${buildCompanyContextString(companyInfo)}

INICIO DEL REGLAMENTO.
En esta primera interacción, DEBES comenzar obligatoriamente con el siguiente código HTML de encabezado:
${headerHTML}

Luego del encabezado, redacta de forma muy extensa, estricta y profesional, el "${chapterTitle}".
Si el usuario proporcionó instrucciones para este capítulo, aplícalas obligatoriamente:
---
${userInput || '(Sin instrucciones específicas, aplica la ley estándar colombiana para este tema)'}
---

Instrucciones de formato:
1. Retorna SOLO tú respuesta en código HTML, sin markdown \`\`\`.
2. Utiliza <h2> para el título del capítulo y <h3> para los artículos (Ej: <h3>Artículo 1º. - Condiciones</h3>).
3. El texto debe ser muy extenso, cubriendo legalmente todas las ramificaciones de este capítulo. 
4. No incluyas las etiquetas <html>, <head> o <body>. No generes sección de firmas.`;

        } else {
            prompt = `Actúa como un abogado experto en derecho laboral corporativo en Colombia.
Estás redactando paso a paso un extenso REGLAMENTO INTERNO DE TRABAJO (RIT).

Este es el contenido generado hasta ahora (OJO: es sólo para darte contexto general, NO LO VUELVAS A ESCRIBIR en tu respuesta):
---
... (contexto previo truncado) ...
${truncatedContext}
---

Tu única tarea AHORA es:
Escribir de manera extensa, seria y profesional, y en formato HTML, exclusivamente el siguiente capítulo: "${chapterTitle}".
Instrucciones del usuario específicas para este capítulo:
---
${userInput || '(Sin instrucciones específicas para este capítulo, desarrolla exhaustivamente según CST y ley colombiana vigente)'}
---

Instrucciones Críticas de Contenido y Formato:
1. Retorna SOLO el código HTML de este nuevo capítulo. NO retornes ni repitas el contexto anterior.
2. Utiliza <h2> para el título del capítulo y <h3> para los artículos (sigue la numeración correlativa aproximada calculando los artículos anteriores).
3. Si el capítulo habla de "Seguridad y Salud en el Trabajo (SG-SST)", integra fuertemente obligaciones sobre reporte de ATEL, uso de EPP y cumplimiento normativo.
4. Si el capítulo es de "Faltas y Sanciones", incluye una escala rigurosa, dividiendo faltas leves (llamados, suspensión) y faltas graves como justa causa de despido (ej. violar normas SST o normas de convivencia/acoso).
5. Omitir markdown de bloque \`\`\`html.`;
        }

        // Retrieve the user's Google API key
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
            logger.debug('[SGSST RIT] No user Google key found, trying env vars:', err.message);
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

        const genAI = new GoogleGenerativeAI(resolvedApiKey);
        const model = genAI.getGenerativeModel({ model: modelName || 'gemini-3-flash-preview' });

        const result = await generateWithRetry(model, prompt);
        const response = await result.response;
        const generatedHtml = response.text();

        // Clean up markdown block format
        let cleanedHtml = generatedHtml.replace(/```html\n?/g, '').replace(/```\n?/g, '').trim();

        // Strip out HTML document wrappers if they exist
        const bodyMatch = cleanedHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
        if (bodyMatch) {
            cleanedHtml = bodyMatch[1].trim();
        }
        cleanedHtml = cleanedHtml
            .replace(/<!DOCTYPE[^>]*>/gi, '')
            .replace(/<html[^>]*>/gi, '').replace(/<\/html>/gi, '')
            .replace(/<head>[\s\S]*?<\/head>/gi, '')
            .replace(/<body[^>]*>/gi, '').replace(/<\/body>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .trim();

        res.json({ chapterHtml: cleanedHtml });
    } catch (error) {
        logger.error('[SGSST RIT] Error generating RIT chapter:', error);
        res.status(500).json({ error: 'Failed to generate RIT chapter', details: error.message });
    }
});

router.post('/generate-signature', requireJwtAuth, async (req, res) => {
    try {
        const companyInfo = await CompanyInfo.findOne({ user: req.user.id });
        if (!companyInfo) {
            return res.status(404).json({ error: 'Company information not found.' });
        }
        res.json({ signatureHtml: buildSignatureSection(companyInfo) });
    } catch (error) {
        logger.error('[SGSST RIT] Error generating RIT signature:', error);
        res.status(500).json({ error: 'Failed to generate RIT signature', details: error.message });
    }
});

module.exports = router;
