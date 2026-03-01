const express = require('express');
const router = express.Router();
const { requireJwtAuth } = require('../../middleware/');
const CompanyInfo = require('../../../models/CompanyInfo');
const { getCustomConfig } = require('../../services/Config');
const { sendMessage } = require('../../services/Endpoints/custom');

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

        const prompt = `Actúa como un experto legal en Seguridad y Salud en el Trabajo (SGSST) en Colombia.
Tu tarea es redactar el REGLAMENTO DE HIGIENE Y SEGURIDAD INDUSTRIAL para la empresa descrita a continuación.
El reglamento debe cumplir estrictamente con el Código Sustantivo del Trabajo, la Ley 9 de 1979, el Decreto 1072 de 2015 y demás normas vigentes aplicables en Colombia.

### Datos de la Empresa
*   **Razón Social:** ${companyInfo.companyName || 'No especificado'}
*   **NIT:** ${companyInfo.nit || 'No especificado'}
*   **Representante Legal:** ${companyInfo.legalRepresentative || 'No especificado'}
*   **Actividad Económica:** ${companyInfo.economicActivity || 'No especificado'}
*   **Clase de Riesgo:** ${companyInfo.riskLevel || 'No especificado'}
*   **Dirección:** ${companyInfo.address || 'No especificado'}
*   **Ciudad:** ${companyInfo.city || 'No especificado'}
${additionalContextContext}

### Instrucciones de Formato y Estructura:
1.  **Encabezado:** Inicia con un título claro (REGLAMENTO DE HIGIENE Y SEGURIDAD INDUSTRIAL), el nombre de la empresa y el NIT.
2.  **Articulado:** Organiza el reglamento en artículos numerados (Artículo 1, Artículo 2, etc.), divididos en capítulos si es necesario (ej. Disposiciones Generales, Obligaciones de la Empresa, Obligaciones de los Trabajadores, Riesgos Identificados, Sanciones, Vigencia).
3.  **Riesgos Específicos:** Asegúrate de mencionar los riesgos propios de la actividad económica de la empresa y los proporcionados en "Riesgos Críticos Identificados" si los hay.
4.  **HTML:** Retorna **solamente** el documento formulado en código HTML, sin incluir ticks de markdown (\`\`\`). Utiliza etiquetas estructuradas como <h1>, <h2>, <p>, <ul>, <li>, <strong>. No uses CSS inline complejo, emplea etiquetas semánticas. No incluyas las etiquetas <html>, <head> o <body>, solo el contenido del documento.
5.  **Tablas de Firmas:** Al final del documento, incluye una sección clara para la firma del Representante Legal, indicando fecha de publicación e implementación.`;

        const reqObj = {
            body: {
                message: prompt,
                endpoint: 'custom',
                model: modelName || 'gemini-3-flash-preview',
                conversationId: 'new',
            },
            user: { id: userId },
            app: req.app,
        };

        let generatedHtml = '';

        const mockRes = {
            write: (data) => {
                const str = data.toString();
                const lines = str.split('\\n');
                lines.forEach((line) => {
                    if (line.startsWith('data: ')) {
                        const jsonStr = line.substring(6);
                        if (jsonStr === '[DONE]') return;
                        try {
                            const parsed = JSON.parse(jsonStr);
                            if (parsed.text) generatedHtml += parsed.text;
                        } catch (e) {
                            // ignore json parse errors for fragments
                        }
                    }
                });
            },
            setHeader: () => { },
            end: () => { },
            status: () => ({ send: () => { } }),
            on: () => { },
        };

        const config = await getCustomConfig();
        const customEndpoint = config?.endpoints?.custom;
        if (!customEndpoint) {
            throw new Error('Custom endpoint configuration missing.');
        }

        await sendMessage(reqObj, mockRes, () => { });

        // Clean up markdown block format
        let cleanedHtml = generatedHtml.replace(/```html/g, '').replace(/```/g, '').trim();

        res.json({ document: cleanedHtml });
    } catch (error) {
        console.error('Error generating RHS:', error);
        res.status(500).json({ error: 'Failed to generate RHS', details: error.message });
    }
});

module.exports = router;
