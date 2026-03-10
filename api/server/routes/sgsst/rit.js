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


router.post('/generate', requireJwtAuth, async (req, res) => {
    try {
        const { scheduleRules, specialConditions, additionalBenefits, modelName } = req.body;
        const userId = req.user.id;

        // Fetch company info
        const companyInfo = await CompanyInfo.findOne({ user: userId });
        if (!companyInfo) {
            return res.status(404).json({ error: 'Company information not found. Please complete it first.' });
        }

        // Construct the context based on user inputs
        let additionalContextContext = '';
        if (scheduleRules) {
            additionalContextContext += `\\n### Horarios de Trabajo y Descansos:\\n${scheduleRules}\\n`;
        }
        if (specialConditions) {
            additionalContextContext += `\\n### Condiciones Especiales:\\n${specialConditions}\\n`;
        }
        if (additionalBenefits) {
            additionalContextContext += `\\n### Beneficios Adicionales o Disposiciones Extra:\\n${additionalBenefits}\\n`;
        }

        const headerHTML = buildStandardHeader({
            title: 'REGLAMENTO INTERNO DE TRABAJO',
            companyInfo: companyInfo,
            date: new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' }),
            norm: 'Código Sustantivo del Trabajo',
            responsibleName: companyInfo.legalRepresentative || req.user?.name
        });

        const prompt = `Actúa como un abogado experto en derecho laboral corporativo en Colombia.
Tu tarea es redactar el REGLAMENTO INTERNO DE TRABAJO (RIT) para la empresa descrita a continuación.
El reglamento debe cumplir estrictamente con el Código Sustantivo del Trabajo de Colombia y las actualizaciones de la Reforma Laboral (ej. Ley 2466 de 2025).

### Datos de la Empresa
${buildCompanyContextString(companyInfo)}
${additionalContextContext}

### Instrucciones de Formato y Estructura:
1.  **ENCABEZADO**: DEBES usar EXACTAMENTE el siguiente código HTML para el encabezado (INCLÚYELO TAL CUAL al inicio del informe):
${headerHTML}

2.  **Organización legal mínima**: Debes abordar (pero no limitarte) a: Condiciones de admisión, Período de Prueba, Horario de Trabajo y Jornada Laboral, Días de Descanso Legal, Vacaciones Remuneradas, Permisos y Licencias (incluyendo licencia de paternidad modernizada, calamidad doméstica y luto), Salario y Lugar/Días de Pago, Prescripciones de Orden y Seguridad, Obligaciones Especiales para la Empresa y para los Trabajadores, Prohibiciones, Faltas Graves y Leves, Escala de Sanciones Disciplinarias, Procedimiento de Comprobación de Faltas y Mecanismos de Prevención de Acoso Laboral (Ley 1010).
3.  **Personalización**: Aplica directamente las condiciones especiales, horarios y beneficios si la empresa proveyó esos datos. Si no, genera estándares legales (Ej 47 o 42 horas según la reducción progresiva de la jornada laboral en Colombia).
4.  **HTML**: Retorna **solamente** el documento formulado en código HTML, sin incluir ticks de markdown (\`\`\`). Utiliza etiquetas estructuradas como <h1>, <h2>, <p>, <ul>, <ol>, <li>, <strong>. No uses CSS inline complejo. No incluyas las etiquetas <html>, <head> o <body>, solo el contenido del documento.
5.  **FIRMA**: El sistema añadirá la sección de firmas automáticamente. NO la generes tú.`;

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

        if (companyInfo) {
            cleanedHtml += buildSignatureSection(companyInfo);
        }

        res.json({ document: cleanedHtml });
    } catch (error) {
        logger.error('[SGSST RIT] Error generating RIT:', error);
        res.status(500).json({ error: 'Failed to generate RIT', details: error.message });
    }
});

module.exports = router;
