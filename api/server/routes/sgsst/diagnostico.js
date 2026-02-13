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
const CompanyInfo = require('~/models/CompanyInfo');

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
            type = 'diagnostico', // Default to diagnostico for backward compatibility
        } = req.body;

        // Validate checklist
        if (!checklist || !Array.isArray(checklist) || checklist.length === 0) {
            return res.status(400).json({ error: 'La lista de verificación es inválida o está vacía.' });
        }

        // ... (API Key retrieval logic remains the same) ...

        // 3. Initialize the Gemini SDK directly
        const genAI = new GoogleGenerativeAI(resolvedApiKey);

        // Build checklist stats
        const completedItems = checklist.filter(item => item.status === 'cumple');
        const partialItems = checklist.filter(item => item.status === 'parcial');
        const nonCompliantItems = checklist.filter(item => item.status === 'no_cumple');
        const notApplicable = checklist.filter(item => item.status === 'no_aplica');
        const pending = checklist.filter(item => item.status === 'pendiente');

        const safeTotal = totalPoints > 0 ? totalPoints : 1; // Prevent division by zero
        const percentage = totalPoints > 0 ? ((score / totalPoints) * 100).toFixed(1) : "0.0";

        // ... (Company Info loading remains the same) ...

        let promptText = '';

        if (type === 'auditoria') {
            const { weightedScore = 0, weightedPercentage = 0 } = req.body;
            console.log('[SGSST Audit Analysis] Payload:', {
                score,
                totalPoints,
                weightedScore,
                weightedPercentage,
                checklistLength: checklist?.length
            });

            promptText = `Eres un Auditor Líder experto en Sistemas de Gestión de Seguridad y Salud en el Trabajo (SG-SST) en Colombia, certificado en ISO 45001 y Decreto 1072 de 2015.

**Fecha de Auditoría:** ${currentDate || new Date().toLocaleDateString('es-CO')}
**Auditor Líder:** ${userName || req.user?.name || 'Usuario del Sistema'}
**Criterios de Auditoría:** Decreto 1072 de 2015 (Capítulo 6), Resolución 0312 de 2019.

Analiza los hallazgos de la auditoría interna y genera un INFORME DE AUDITORÍA completo.

## DATOS DE LA AUDITORÍA

**Información de la Empresa:**
${companyInfoBlock}

**Resumen de Resultados (Doble Calificación):**
1. **Auditoría de Cumplimiento (Dec 1072):**
   - Porcentaje de Conformidad: ${percentage}%
   - Total Requisitos Evaluados: ${checklist.length}
   - Conformidades (Cumple): ${completedItems.length}
   - No Conformidades Mayores/Menores: ${nonCompliantItems.length + partialItems.length}
   - Observaciones (No Aplica): ${notApplicable.length}

2. **Estándares Mínimos (Res 0312):**
   - Puntaje Obtenido: ${weightedScore || 'N/A'}
   - Porcentaje Ponderado: ${weightedPercentage ? parseFloat(weightedPercentage).toFixed(1) : 'N/A'}%

**Detalle de No Conformidades y Hallazgos:**
**NO CONFORMIDADES (Incumplimientos):**
${nonCompliantItems.map(item => {
                const obs = observations && observations[item.id] ? ` (Evidencia/Obs: ${observations[item.id]})` : '';
                return `- ${item.code} - ${item.name}: ${item.description}${obs}`;
            }).join('\n') || 'Ninguna'}

**OBSERVACIONES / OPORTUNIDADES DE MEJORA (Parciales):**
${partialItems.map(item => {
                const obs = observations && observations[item.id] ? ` (Evidencia/Obs: ${observations[item.id]})` : '';
                return `- ${item.code} - ${item.name}: ${item.description}${obs}`;
            }).join('\n') || 'Ninguna'}

## INSTRUCCIONES

Genera un INFORME DE AUDITORÍA INTERNA en formato HTML con las siguientes secciones obligatorias:

1. **OBJETIVO Y ALCANCE**:
   - Objetivo: Verificar el cumplimiento del SG-SST frente al Decreto 1072 y la mejora continua.
   - Alcance: Todos los procesos del SG-SST evaluados.

2. **RESUMEN EJECUTIVO**: Concepto global sobre la eficacia del sistema, mencionando ambos puntajes (Cumplimiento Dec 1072 y Ponderado Res 0312).

3. **FORTALEZAS**: Aspectos positivos destacados.

4. **HALLAZGOS DETALLADOS**:
   - Análisis de las No Conformidades detectadas.
   - Análisis de debilidades en el ciclo PHVA.

5. **CONCLUSIONES DE AUDITORÍA**:
   - ¿El sistema es conforme con los requisitos propios y legales?
   - ¿El sistema se implementa y mantiene eficazmente?

6. **RECOMENDACIONES**: Acciones para abordar hallazgos y mejora continua.

IMPORTANTE: Genera SOLO fragmentos HTML del cuerpo (body). Usa etiquetas <h2>, <h3>, <p>, <ul>, <li>, <strong>. Estilos inline profesionales (ej: color azul corporativo para títulos).`;

        } else {
            // Default Diagnostic Prompt (Resolución 0312)
            promptText = `Eres un experto consultor en Sistemas de Gestión de Seguridad y Salud en el Trabajo (SG-SST) en Colombia.

**Fecha de Emisión:** ${currentDate || new Date().toLocaleDateString('es-CO')}
**Consultor Experto:** ${userName || req.user?.name || 'Usuario del Sistema'}
**Referencia Normativa:** Resolución 0312 de 2019 (Estándares Mínimos, Art. ${applicableArticle})
    
Analiza los resultados de la evaluación según la Resolución 0312 de 2019 y genera un INFORME GERENCIAL completo.

## DATOS DE LA EVALUACIÓN

**Información de la Empresa:**
- Tamaño: ${companySize === 'small' ? '≤10 trabajadores' : companySize === 'medium' ? '11-50 trabajadores' : '>50 trabajadores'}
- Nivel de Riesgo: ${riskLevel}
- Artículo Aplicable: Artículo ${applicableArticle}
${companyInfoBlock}

**Resultados:**
- Puntuación Total: ${score}/${totalPoints} (${percentage}%)
- Nivel de Cumplimiento: ${complianceLevel?.level?.toUpperCase() || 'N/A'}
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
        }

        // 4. Generate the report with Fallback Strategy
        let result;
        let text;

        try {
            console.log('[SGSST Diagnostico] Attempting Generation with gemini-3-flash-preview');
            const modelPrimary = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });
            result = await modelPrimary.generateContent(promptText);
            const response = await result.response;
            text = response.text();
        } catch (primaryError) {
            console.warn('[SGSST Diagnostico] Primary model (gemini-3-flash-preview) failed, attempting fallback to gemini-2.0-flash-exp. Error:', primaryError.message);
            try {
                // Fallback to previous stable/experimental version
                const modelFallback = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
                result = await modelFallback.generateContent(promptText);
                const response = await result.response;
                text = response.text();
            } catch (fallbackError) {
                console.error('[SGSST Diagnostico] All models failed.');
                throw fallbackError; // Re-throw to main catch
            }
        }

        // Clean up: remove code blocks, full HTML document wrappers
        let cleanedReport = text
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
            conversationId: crypto.randomUUID(), // Return new ID for UI
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
        console.error('[SGSST CRITICAL ERROR] Diagnostic Analysis Failed:', {
            message: error.message,
            stack: error.stack,
            payloadSummary: {
                checklistLength: checklist?.length,
                score,
                totalPoints,
                modelName: 'gemini-2.5-flash-preview-09-2025 (+fallback)'
            }
        });
        logger.error('[SGSST Diagnostico] Analysis error:', error);
        res.status(500).json({ error: `Error generando análisis: ${error.message}` });
    }
});

/**
 * POST /api/sgsst/diagnostico/save-report
 * Saves a new SGSST diagnostic report as a conversation+message and tags it.
 */
router.post('/save-report', requireJwtAuth, async (req, res) => {
    try {
        const { content, title, tags } = req.body;
        if (!content) {
            return res.status(400).json({ error: 'Content is required' });
        }

        const conversationId = crypto.randomUUID();
        const messageId = crypto.randomUUID();
        const dateStr = new Date().toLocaleString('es-CO');
        const reportTitle = title || `Diagnóstico SGSST - ${dateStr}`;
        const reportTags = tags || ['sgsst-diagnostico'];

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
                reportTags,
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
