const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { AuthKeys } = require('librechat-data-provider');
const { requireJwtAuth } = require('../../middleware/');
const CompanyInfo = require('../../../models/CompanyInfo');
const { getUserKey } = require('~/server/services/UserService');
const { logger } = require('~/config');
const { buildStandardHeader, buildCompanyContextString, buildSignatureSection } = require('./reportHeader');

router.post('/generate', requireJwtAuth, async (req, res) => {
    try {
        const { identifiedRisks, workShifts, additionalRules, modelName } = req.body;
        const userId = req.user.id;

        // Fetch company info
        const companyInfo = await CompanyInfo.findOne({ user: userId });
        if (!companyInfo) {
            return res.status(404).json({ error: 'Company information not found. Please complete it first.' });
        }

        // Construct the context based on user inputs
        let additionalContextContext = '';
        if (identifiedRisks) {
            additionalContextContext += `\\n### Riesgos Críticos Identificados:\\n${identifiedRisks}\\n`;
        }
        if (workShifts) {
            additionalContextContext += `\\n### Jornadas Laborales y Turnos:\\n${workShifts}\\n`;
        }
        if (additionalRules) {
            additionalContextContext += `\\n### Directrices Internas / Disposiciones Adicionales:\\n${additionalRules}\\n`;
        }

        const headerHTML = buildStandardHeader({
            title: 'REGLAMENTO DE HIGIENE Y SEGURIDAD INDUSTRIAL',
            companyInfo: companyInfo,
            date: new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' }),
            norm: 'Código Sustantivo del Trabajo / Ley 9 de 1979',
            responsibleName: companyInfo.legalRepresentative || req.user?.name
        });

        const prompt = `Actúa como un experto legal en Seguridad y Salud en el Trabajo (SGSST) en Colombia.
Tu tarea es redactar el REGLAMENTO DE HIGIENE Y SEGURIDAD INDUSTRIAL para la empresa descrita a continuación.
El reglamento debe cumplir estrictamente con el Código Sustantivo del Trabajo, la Ley 9 de 1979, el Decreto 1072 de 2015 y demás normas vigentes aplicables en Colombia.

### Datos de la Empresa
${buildCompanyContextString(companyInfo)}
${additionalContextContext}

### Instrucciones de Formato y Estructura:
1.  **ENCABEZADO**: DEBES usar EXACTAMENTE el siguiente código HTML para el encabezado (INCLÚYELO TAL CUAL al inicio del informe):
${headerHTML}

2.  **Articulado**: Organiza el reglamento en artículos numerados (Artículo 1, Artículo 2, etc.), divididos en capítulos si es necesario (ej. Disposiciones Generales, Obligaciones de la Empresa, Obligaciones de los Trabajadores, Riesgos Identificados, Sanciones, Vigencia).
3.  **Riesgos Específicos**: Asegúrate de mencionar los riesgos propios de la actividad económica de la empresa y los proporcionados en "Riesgos Críticos Identificados" si los hay.
4.  **HTML**: Retorna **solamente** el documento formulado en código HTML, sin incluir ticks de markdown (\`\`\`). Utiliza etiquetas estructuradas como <h1>, <h2>, <p>, <ul>, <li>, <strong>. No uses CSS inline complejo, emplea etiquetas semánticas. No incluyas las etiquetas <html>, <head> o <body>, solo el contenido del documento.
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
            logger.debug('[SGSST RHS] No user Google key found, trying env vars:', err.message);
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

        const result = await model.generateContent(prompt);
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
        logger.error('[SGSST RHS] Error generating RHS:', error);
        res.status(500).json({ error: 'Failed to generate RHS', details: error.message });
    }
});

module.exports = router;
