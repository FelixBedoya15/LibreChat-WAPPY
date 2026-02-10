const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { AuthKeys } = require('librechat-data-provider');
const { logger } = require('~/config');
const requireJwtAuth = require('~/server/middleware/requireJwtAuth');
const { getUserKey } = require('~/server/services/UserService');
const { saveConvo } = require('~/models/Conversation');
const { saveMessage, updateMessageText, getMessages } = require('~/models/Message');
const { updateTagsForConversation } = require('~/models/ConversationTag');

/**
 * POST /api/sgsst/diagnostico/analyze
 * Analyzes the SGSST checklist and generates a management report.
 * Uses the same Google API key the user configures in chat settings.
 */
router.post('/analyze', requireJwtAuth, async (req, res) => {
    try {
        const {
            companySize,
            riskLevel,
            applicableArticle,
            checklist,
            score,
            totalPoints,
            complianceLevel,
            userName,
            currentDate,
            observations,
        } = req.body;

        // 1. Retrieve the user's Google API key (same one used by chat)
        let resolvedApiKey;
        try {
            const storedKey = await getUserKey({ userId: req.user.id, name: 'google' });
            // The stored key is a JSON string like {"GOOGLE_API_KEY": "AIza..."}
            // We need to extract the actual API key from it
            try {
                const parsed = JSON.parse(storedKey);
                resolvedApiKey = parsed[AuthKeys.GOOGLE_API_KEY] || parsed.GOOGLE_API_KEY;
            } catch (parseErr) {
                // If it's not JSON, treat it as a raw API key string
                resolvedApiKey = storedKey;
            }
        } catch (err) {
            logger.debug('[SGSST] No user Google key found, trying env vars:', err.message);
        }

        // 2. Fallback to environment variables
        if (!resolvedApiKey) {
            resolvedApiKey = process.env.GOOGLE_KEY || process.env.GEMINI_API_KEY;
        }

        if (!resolvedApiKey) {
            return res.status(400).json({
                error: 'No se ha configurado la clave API de Google. Por favor, configúrala en la opción de Google del chat.',
            });
        }

        // 3. Initialize the Gemini SDK directly (same SDK used by GoogleClient internally)
        const genAI = new GoogleGenerativeAI(resolvedApiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-preview-09-2025' });

        // Build the prompt for analysis
        const completedItems = checklist.filter(item => item.status === 'cumple');
        const partialItems = checklist.filter(item => item.status === 'parcial');
        const nonCompliantItems = checklist.filter(item => item.status === 'no_cumple');
        const notApplicable = checklist.filter(item => item.status === 'no_aplica');
        const pending = checklist.filter(item => item.status === 'pendiente');

        const percentage = ((score / totalPoints) * 100).toFixed(1);

        const promptText = `Eres un experto consultor en Sistemas de Gestión de Seguridad y Salud en el Trabajo (SG-SST) en Colombia.

**Fecha de Emisión:** ${currentDate || new Date().toLocaleDateString('es-CO')}
**Consultor Experto:** ${userName || req.user?.name || 'Usuario del Sistema'}
**Referencia Normativa:** Resolución 0312 de 2019 (Estándares Mínimos, Art. ${applicableArticle})
    
Analiza los resultados de la evaluación según la Resolución 0312 de 2019 y genera un INFORME GERENCIAL completo.

## DATOS DE LA EVALUACIÓN

**Información de la Empresa:**
- Tamaño: ${companySize === 'small' ? '≤10 trabajadores' : companySize === 'medium' ? '11-50 trabajadores' : '>50 trabajadores'}
- Nivel de Riesgo: ${riskLevel}
- Artículo Aplicable: Artículo ${applicableArticle}

**Resultados:**
- Puntuación Total: ${score}/${totalPoints} (${percentage}%)
- Nivel de Cumplimiento: ${complianceLevel.level.toUpperCase()}
- Total Estándares Evaluados: ${checklist.length}
- Cumplen: ${completedItems.length}
- Cumplen Parcialmente: ${partialItems.length}
- No Cumplen: ${nonCompliantItems.length}
- No Aplican: ${notApplicable.length}
- Pendientes: ${pending.length}

**Estándares que NO CUMPLEN (Críticos):**
${nonCompliantItems.map(item => {
            const obs = observations && observations[item.id] ? ` (Observación: ${observations[item.id]})` : '';
            return `- ${item.code} - ${item.name}: ${item.description}${obs}`;
        }).join('\n') || 'Ninguno'}

**Estándares que CUMPLEN PARCIALMENTE:**
${partialItems.map(item => {
            const obs = observations && observations[item.id] ? ` (Observación: ${observations[item.id]})` : '';
            return `- ${item.code} - ${item.name}: ${item.description}${obs}`;
        }).join('\n') || 'Ninguno'}

**Estándares que NO APLICAN:**
${notApplicable.map(item => {
            const obs = observations && observations[item.id] ? ` (Observación: ${observations[item.id]})` : '';
            return `- ${item.code} - ${item.name}${obs}`;
        }).join('\n') || 'Ninguno'}

## INSTRUCCIONES

Genera un informe gerencial en formato HTML con las siguientes secciones:

1. **RESUMEN EJECUTIVO**: Breve descripción del estado actual del SG-SST

2. **ANÁLISIS DE RESULTADOS**: 
   - Interpretación del nivel de cumplimiento
   - Distribución por ejes PHVA (Planear, Hacer, Verificar, Actuar)
   - Principales fortalezas identificadas
   - Áreas críticas de incumplimiento

3. **PLAN DE ACCIÓN PRIORITARIO**:
   - Para cada estándar crítico que no cumple, proporciona:
     - Acción correctiva específica
     - Responsable sugerido
     - Plazo recomendado
     - Recursos necesarios
   - Ordena por prioridad (mayor puntaje = mayor prioridad)

4. **RIESGOS Y CONSECUENCIAS**:
   - Consecuencias legales del incumplimiento
   - Riesgos operacionales
   - Posibles sanciones según la normatividad colombiana

5. **RECOMENDACIONES FINALES**:
   - Próximos pasos inmediatos
   - Cronograma sugerido de implementación
   - Métricas de seguimiento

IMPORTANTE: Genera SOLO fragmentos HTML del cuerpo (body). NO incluyas <!DOCTYPE>, <html>, <head>, <body>, <style>, ni etiquetas de documento completo.
Usa directamente etiquetas HTML semánticas (<h1>, <h2>, <h3>, <p>, <ul>, <li>, <table>, <strong>, etc).
Para estilos, usa atributos style inline en los elementos (ejemplo: <h1 style="color:#004d99;">).
El informe debe ser profesional, específico y accionable.`;

        // 4. Generate the report
        const result = await model.generateContent(promptText);
        const response = await result.response;
        const report = response.text();

        // Clean up: remove code blocks, full HTML document wrappers
        let cleanedReport = report
            .replace(/```html\n?/g, '')
            .replace(/```\n?/g, '')
            .trim();

        // Strip full HTML document structure if AI still generates it
        const bodyMatch = cleanedReport.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
        if (bodyMatch) {
            cleanedReport = bodyMatch[1].trim();
        }
        // Remove DOCTYPE, html, head, style tags
        cleanedReport = cleanedReport
            .replace(/<!DOCTYPE[^>]*>/gi, '')
            .replace(/<html[^>]*>/gi, '').replace(/<\/html>/gi, '')
            .replace(/<head>[\s\S]*?<\/head>/gi, '')
            .replace(/<body[^>]*>/gi, '').replace(/<\/body>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .trim();

        res.json({
            report: cleanedReport,
            summary: {
                score,
                totalPoints,
                percentage: parseFloat(percentage),
                level: complianceLevel.level,
                compliant: completedItems.length,
                partial: partialItems.length,
                nonCompliant: nonCompliantItems.length,
            }
        });

    } catch (error) {
        logger.error('[SGSST Diagnostico] Analysis error:', error);
        res.status(500).json({ error: 'Error generating analysis' });
    }
});

/**
 * POST /api/sgsst/diagnostico/save-report
 * Saves a new SGSST diagnostic report as a conversation+message and tags it.
 */
router.post('/save-report', requireJwtAuth, async (req, res) => {
    try {
        const { content, title } = req.body;
        if (!content) {
            return res.status(400).json({ error: 'Content is required' });
        }

        const conversationId = crypto.randomUUID();
        const messageId = crypto.randomUUID();
        const dateStr = new Date().toLocaleString('es-CO');
        const reportTitle = title || `Diagnóstico SGSST - ${dateStr}`;

        // 1. Save conversation
        await saveConvo(req, {
            conversationId,
            title: reportTitle,
            endpoint: 'sgsst-diagnostico',
            model: 'sgsst-diagnostico',
        }, { context: 'SGSST save-report' });

        // 2. Save message with the report content
        await saveMessage(req, {
            messageId,
            conversationId,
            text: content,
            sender: 'SGSST Diagnóstico',
            isCreatedByUser: false,
            parentMessageId: '00000000-0000-0000-0000-000000000000',
        }, { context: 'SGSST save-report message' });

        // 3. Tag the conversation
        try {
            await updateTagsForConversation(
                req.user.id,
                conversationId,
                ['sgsst-diagnostico'],
            );
        } catch (tagErr) {
            logger.warn('[SGSST] Error tagging conversation:', tagErr);
        }

        res.status(201).json({
            conversationId,
            messageId,
            title: reportTitle,
        });
    } catch (error) {
        logger.error('[SGSST save-report] Error:', error);
        res.status(500).json({ error: 'Error saving report' });
    }
});

/**
 * PUT /api/sgsst/diagnostico/save-report
 * Updates an existing SGSST diagnostic report message.
 */
router.put('/save-report', requireJwtAuth, async (req, res) => {
    try {
        const { conversationId, messageId, content } = req.body;
        if (!conversationId || !messageId || !content) {
            return res.status(400).json({ error: 'conversationId, messageId, and content are required' });
        }

        await updateMessageText(req, { messageId, text: content });

        res.json({ success: true, conversationId, messageId });
    } catch (error) {
        logger.error('[SGSST save-report update] Error:', error);
        res.status(500).json({ error: 'Error updating report' });
    }
});

/**
 * GET /api/sgsst/diagnostico/checklist
 * Returns the applicable checklist items based on filters
 */
router.get('/checklist', (req, res) => {
    const { size = 'medium', risk = '3' } = req.query;

    // The checklist data is handled on the frontend
    // This endpoint can be used for future server-side filtering
    res.json({
        message: 'Checklist data is managed on the frontend',
        filters: { size, risk }
    });
});

module.exports = router;
