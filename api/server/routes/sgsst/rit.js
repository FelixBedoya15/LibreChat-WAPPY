const express = require('express');
const router = express.Router();
const { requireJwtAuth } = require('../../middleware/');
const CompanyInfo = require('../../../models/CompanyInfo');
const { getCustomConfig } = require('../../services/Config');
const { sendMessage } = require('../../services/Endpoints/custom');

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

        const prompt = `Actúa como un abogado experto en derecho laboral corporativo en Colombia.
Tu tarea es redactar el REGLAMENTO INTERNO DE TRABAJO (RIT) para la empresa descrita a continuación.
El reglamento debe cumplir estrictamente con el Código Sustantivo del Trabajo de Colombia y las actualizaciones de la Reforma Laboral (ej. Ley 2466 de 2025).

### Datos de la Empresa
*   **Razón Social:** ${companyInfo.companyName || 'No especificado'}
*   **NIT:** ${companyInfo.nit || 'No especificado'}
*   **Representante Legal:** ${companyInfo.legalRepresentative || 'No especificado'}
*   **Actividad Económica:** ${companyInfo.economicActivity || 'No especificado'}
*   **Ciudad:** ${companyInfo.city || 'No especificado'}
*   **Dirección:** ${companyInfo.address || 'No especificado'}
${additionalContextContext}

### Instrucciones de Formato y Estructura:
1.  **Encabezado:** Inicia con un título claro (REGLAMENTO INTERNO DE TRABAJO), el nombre de la empresa y NIT.
2.  **Organización legal mínima:** Debes abordar (pero no limitarte) a: Condiciones de admisión, Período de Prueba, Horario de Trabajo y Jornada Laboral, Días de Descanso Legal, Vacaciones Remuneradas, Permisos y Licencias (incluyendo licencia de paternidad modernizada, calamidad doméstica y luto), Salario y Lugar/Días de Pago, Prescripciones de Orden y Seguridad, Obligaciones Especiales para la Empresa y para los Trabajadores, Prohibiciones, Faltas Graves y Leves, Escala de Sanciones Disciplinarias, Procedimiento de Comprobación de Faltas y Mecanismos de Prevención de Acoso Laboral (Ley 1010).
3.  **Personalización:** Aplica directamente las condiciones especiales, horarios y beneficios si la empresa proveyó esos datos. Si no, genera estándares legales (Ej 47 o 42 horas según la reducción progresiva de la jornada laboral en Colombia).
4.  **HTML:** Retorna **solamente** el documento formulado en código HTML, sin incluir ticks de markdown (\`\`\`). Utiliza etiquetas estructuradas como <h1>, <h2>, <p>, <ul>, <ol>, <li>, <strong>. No uses CSS inline complejo. No incluyas las etiquetas <html>, <head> o <body>, solo el contenido del documento.
5.  **Tablas de Firmas:** Al final del documento, incluye una sección para la firma del Empleador/Representante Legal.`;

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
        console.error('Error generating RIT:', error);
        res.status(500).json({ error: 'Failed to generate RIT', details: error.message });
    }
});

module.exports = router;
