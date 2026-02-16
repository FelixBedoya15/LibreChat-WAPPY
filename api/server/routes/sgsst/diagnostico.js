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
            logger.debug('[SGSST Diagnostico] No user Google key found, trying env vars:', err.message);
        }

        if (!resolvedApiKey) {
            resolvedApiKey = process.env.GOOGLE_KEY || process.env.GEMINI_API_KEY;
        }

        if (!resolvedApiKey) {
            return res.status(400).json({
                error: 'No se ha configurado la clave API de Google. Por favor, configúrala en la opción de Google del chat.',
            });
        }

        // 2. Load company info from DB
        let companyInfoBlock = '';
        try {
            const ci = await CompanyInfo.findOne({ user: req.user.id }).lean();
            if (ci && ci.companyName) {
                companyInfoBlock = `
- Razón Social: ${ci.companyName || 'No registrado'}
- NIT: ${ci.nit || 'No registrado'}
- Representante Legal: ${ci.legalRepresentative || 'No registrado'}
- Número de Trabajadores: ${ci.workerCount || 'No registrado'}
- ARL: ${ci.arl || 'No registrada'}
- Actividad Económica: ${ci.economicActivity || 'No registrada'}
- Código CIIU: ${ci.ciiu || 'No registrado'}
- Nivel de Riesgo: ${ci.riskLevel || 'No registrado'}
- Sector: ${ci.sector || 'No registrado'}
- Dirección: ${ci.address || 'No registrada'}, ${ci.city || ''}
`;
            }
        } catch (ciErr) {
            logger.warn('[SGSST Diagnostico] Error loading company info:', ciErr.message);
        }

        // 3. Initialize the Gemini SDK directly
        const genAI = new GoogleGenerativeAI(resolvedApiKey);

        // Convert numeric riskLevel to readable label
        const riskLabels = { 1: 'I (Mínimo)', 2: 'II (Bajo)', 3: 'III (Medio)', 4: 'IV (Alto)', 5: 'V (Máximo)' };
        const riskLevelLabel = riskLabels[riskLevel] || riskLevel;

        // Build checklist stats
        const completedItems = checklist.filter(item => item.status === 'cumple');
        const partialItems = checklist.filter(item => item.status === 'parcial');
        const nonCompliantItems = checklist.filter(item => item.status === 'no_cumple');
        const notApplicable = checklist.filter(item => item.status === 'no_aplica');
        const pending = checklist.filter(item => item.status === 'pendiente');

        const safeTotal = totalPoints > 0 ? totalPoints : 1; // Prevent division by zero
        const percentage = totalPoints > 0 ? ((score / totalPoints) * 100).toFixed(1) : "0.0";

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

**REGLA CRÍTICA: Debes basar tu informe EXCLUSIVAMENTE en los datos proporcionados a continuación. NO inventes, supongas ni alucines hallazgos. Si un estándar aparece como "cumple", NO lo reportes como No Conformidad. Si aparece como "no_cumple", SÍ repórtalo. Respeta estrictamente las listas de conformidad/no conformidad dadas.**

Analiza los hallazgos de la auditoría interna y genera un INFORME DE AUDITORÍA INTERNA EXTENSO Y PROFESIONAL en formato HTML.

## DATOS DE LA AUDITORÍA

**Información de la Empresa:**
${companyInfoBlock}

**Resumen de Resultados (Doble Calificación):**
1. **Auditoría de Cumplimiento (Dec 1072):**
   - Porcentaje de Conformidad: ${percentage}%
   - Conformidades (Cumple): ${completedItems.length}
   - No Conformidades (No Cumple): ${nonCompliantItems.length}
   - Observaciones (Parcial/No Aplica): ${partialItems.length + notApplicable.length}

2. **Estándares Mínimos (Res 0312):**
   - Puntaje Obtenido: ${weightedScore || 'N/A'}
   - Porcentaje Ponderado: ${weightedPercentage ? parseFloat(weightedPercentage).toFixed(1) : 'N/A'}%

**Detalle de No Conformidades y Hallazgos:**
**NO CONFORMIDADES (Incumplimientos):**
${nonCompliantItems.map(item => {
                const obs = observations && observations[item.id] ? `\n  → OBSERVACIÓN/EVIDENCIA DEL AUDITOR: "${observations[item.id]}"` : '';
                return `- ${item.code} - ${item.name}: ${item.description}${obs}`;
            }).join('\n') || 'Ninguna'}

**CUMPLIMIENTO PARCIAL (Observaciones):**
${partialItems.map(item => {
                const obs = observations && observations[item.id] ? `\n  → OBSERVACIÓN/EVIDENCIA DEL AUDITOR: "${observations[item.id]}"` : '';
                return `- ${item.code} - ${item.name}: ${item.description}${obs}`;
            }).join('\n') || 'Ninguna'}

## INSTRUCCIONES - GENERACIÓN DE INFORME AUDITORÍA DETALLADO

Genera un INFORME DE AUDITORÍA INTERNA MUY DETALLADO en formato HTML RICO Y ESTILIZADO.
**IMPORTANTE:** Usa tablas, colores y "tarjetas" visuales. El diseño debe ser idéntico al de un informe gerencial de alto nivel.

**REGLA SOBRE OBSERVACIONES:** Cuando un estándar tenga una OBSERVACIÓN/EVIDENCIA DEL AUDITOR, DEBES usar ese texto como base principal del hallazgo en el informe. NO inventes detalles diferentes. La observación del auditor refleja la realidad encontrada en campo y debe ser citada o parafraseada con fidelidad.

1. **ENCABEZADO Y CONTEXTO**:
   - Crea una tabla elegante para la información de la empresa y del auditor.
   - Usa un diseño limpio con bordes sutiles.

2. **RESUMEN EJECUTIVO (EXTENSO)**:
   - <div style="background-color: #f8f9fa; padding: 15px; border-left: 5px solid #004d99; margin-bottom: 20px;">
     Redacta un resumen ejecutivo profundo sobre el estado del SG-SST, mencionando explícitamente el cumplimiento del Decreto 1072 y la Resolución 0312.
     </div>

3. **ANÁLISIS DE RESULTADOS (VISUAL Y GRÁFICO)**:
   - **TARJETAS DE PUNTUACIÓN:** Genera dos recuadros (divs) visuales lado a lado para los dos puntajes (Dec 1072 y Res 0312).
   - **GRÁFICOS DE BARRAS (PHVA):** Para cada ciclo (Planear, Hacer, Verificar, Actuar), genera una **BARRA DE PROGRESO** visual (HTML/CSS).
   - **FORTALEZAS:** Lista las fortalezas encontradas.

4. **HALLAZGOS DETALLADOS (TABLA DE NO CONFORMIDADES)**:
   - **OBLIGATORIO:** Debes incluir **TODAS** las "No Conformidades" y "Cumplimientos Parciales" en una tabla detallada.
   - **TABLA HTML:**
     - Columnas: Requisito/Norma | Hallazgo (Descripción) | Tipo (No Conformidad/Observación) | Recomendación.
     - Si hay muchos ítems, la tabla debe ser larga. NO omitas ninguno.

5. **CONCLUSIONES DE AUDITORÍA**:
   - Concepto final sobre la conformidad y eficacia del sistema.
   - Riesgos legales implicados.

6. **RECOMENDACIONES Y PLAN DE MEJORA**:
   - Acciones inmediatas sugeridas.

**ESTILOS OBLIGATORIOS (CSS INLINE):**
- Títulos (h1, h2): Color azul oscuro (#004d99).
- Tablas: width="100%", border-collapse="collapse", th con background-color="#004d99" y color="white".
- Celdas (td): padding="10px", border-bottom="1px solid #ddd".

**FIRMA OBLIGATORIA:**
Al final del informe, firma estrictamente así (SIN IMÁGENES):
<div style="margin-top: 50px; text-align: center;">
    <strong>${userName || req.user?.name || 'Auditor Líder'}</strong><br>
    Auditor Líder SG-SST (Certificado ISO 45001 / Dec. 1072)<br>
    Licencia en Seguridad y Salud en el Trabajo Vigente
</div>
IMPORTANTE: NO incluyas ninguna etiqueta &lt;img&gt; ni placeholders de imagen para la firma. Solo texto.

Genera SOLO el contenido del cuerpo (HTML body tags).`;

        } else {
            // Default Diagnostic Prompt (Resolución 0312)
            promptText = `Eres un experto consultor en Sistemas de Gestión de Seguridad y Salud en el Trabajo (SG-SST) en Colombia.

**Fecha de Emisión:** ${currentDate || new Date().toLocaleDateString('es-CO')}
**Consultor Experto:** ${userName || req.user?.name || 'Usuario del Sistema'}
**Referencia Normativa:** Resolución 0312 de 2019 (Estándares Mínimos, Art. ${applicableArticle})
    
Analiza los resultados de la evaluación según la Resolución 0312 de 2019 y genera un INFORME GERENCIAL completo.

**REGLA CRÍTICA: Debes basar tu informe EXCLUSIVAMENTE en los datos proporcionados a continuación. NO inventes, supongas ni alucines hallazgos. Si un estándar aparece como "CUMPLE", NO lo reportes como incumplido. Respeta estrictamente las listas de cumplimiento/incumplimiento dadas.**

## DATOS DE LA EVALUACIÓN

**Información de la Empresa (Filtros de Evaluación Seleccionados):**
- Tamaño de Empresa: ${companySize === 'small' ? '≤10 trabajadores' : companySize === 'medium' ? '11-50 trabajadores' : '>50 trabajadores'}
- Nivel de Riesgo Seleccionado para Evaluación: ${riskLevelLabel}
- Artículo Aplicable: Artículo ${applicableArticle}
${companyInfoBlock ? `\n**Datos Registrados de la Empresa (referencia, NO usar si contradice los filtros anteriores):**\n${companyInfoBlock}` : ''}

**Resultados:**
- Puntuación Total: ${score}/${totalPoints} (${percentage}%)
- Nivel de Cumplimiento: ${complianceLevel?.level?.toUpperCase() || 'N/A'}
- Total Estándares Evaluados: ${checklist.length}
- Cumplen: ${completedItems.length}
- Cumplen Parcialmente: ${partialItems.length}
- No Cumplen: ${nonCompliantItems.length}
- No Aplican: ${notApplicable.length}
- Pendientes: ${pending.length}

**Estándares que CUMPLEN (Exitosos):**
${completedItems.map(item => {
                return `- ${item.code} - ${item.name} (${item.category.toUpperCase()})`;
            }).join('\n') || 'Ninguno'}

**Estándares que NO CUMPLEN (Críticos):**
${nonCompliantItems.map(item => {
                const obs = observations && observations[item.id] ? `\n  → OBSERVACIÓN DEL EVALUADOR: "${observations[item.id]}"` : '';
                return `- ${item.code} - ${item.name}: ${item.description}${obs}`;
            }).join('\n') || 'Ninguno'}

**Estándares que CUMPLEN PARCIALMENTE:**
${partialItems.map(item => {
                const obs = observations && observations[item.id] ? `\n  → OBSERVACIÓN DEL EVALUADOR: "${observations[item.id]}"` : '';
                return `- ${item.code} - ${item.name}: ${item.description}${obs}`;
            }).join('\n') || 'Ninguno'}

**Estándares que NO APLICAN:**
${notApplicable.map(item => {
                const obs = observations && observations[item.id] ? `\n  → OBSERVACIÓN DEL EVALUADOR: "${observations[item.id]}"` : '';
                return `- ${item.code} - ${item.name}${obs}`;
            }).join('\n') || 'Ninguno'}

## INSTRUCCIONES - GENERACIÓN DE INFORME EXTENSO Y VISUALMENTE PREMIUM

Genera un INFORME GERENCIAL MUY DETALLADO, EXTENSO Y PROFUNDO en formato HTML RICO Y ESTILIZADO.
**IMPORTANTE:** El informe debe verse profesional y hermoso. Usa tablas, colores y "tarjetas" visuales.

**REGLA SOBRE OBSERVACIONES:** Cuando un estándar tenga una OBSERVACIÓN DEL EVALUADOR, DEBES usar ese texto como base principal del hallazgo en el informe. NO inventes detalles diferentes. La observación del evaluador refleja la realidad encontrada en campo y debe ser citada o parafraseada con fidelidad.

1. **ENCABEZADO Y CONTEXTO**:
   - Crea una tabla elegante para la información de la empresa.
   - Usa un diseño limpio con bordes sutiles.

2. **RESUMEN EJECUTIVO (EXTENSO)**:
   - <div style="background-color: #f8f9fa; padding: 15px; border-left: 5px solid #004d99; margin-bottom: 20px;">
     Realiza una descripción detallada, profunda y explicativa del estado actual del SG-SST. Contextualiza el nivel de cumplimiento. NO seas breve.
     </div>

3. **ANÁLISIS DE RESULTADOS (VISUAL Y GRÁFICO)**: 
   - **TARJETAS DE PUNTUACIÓN:** Genera dos recuadros (divs) visuales lado a lado:
     - Uno rojo/verde para el PUNTAJE NUMÉRICO.
     - Uno naranja/amarillo para el NIVEL DE RIESGO.
   - **GRÁFICOS DE BARRAS (PHVA):** Para cada ciclo (Planear, Hacer, Verificar, Actuar), genera una **BARRA DE PROGRESO** visual usando HTML/CSS.
     - Estilo sugerido: Un contenedor gris claro con una barra interna de color (verde/naranja/rojo según cumplimiento) que tenga un ancho % proporcional.
   - **TABLA PHVA:** Crea una tabla HTML con encabezados azules (#004d99) y filas alternadas.
   - Texto explicativo extenso sobre fortalezas y debilidades.

4. **PLAN DE ACCIÓN COMPLETO (TODOS LOS HALLAZGOS)**:
   - **IMPORTANTE:** NO hagas un "Top 5". Debes incluir **TODOS** los estándares que no cumplen.
   - Usa una **TABLA HTML** extensa.
   - Columnas: Estándar | Hallazgo | Acción Correctiva (Detallada) | Responsable | Plazo.
   - Si hay muchos hallazgos, la tabla debe ser larga. NO omitas ninguno.

5. **RIESGOS Y CONSECUENCIAS**:
   - Usa listas con iconos (puedes usar emojis como ⚠️ o ⚖️ sutilmente si encajan, o bullets estilizados) para enumerar consecuencias legales y operativas.
   - Explicación profunda de cada riesgo.

6. **RECOMENDACIONES FINALES**:
   - Hoja de ruta en formato de lista estilizada o tabla de cronograma.

**ESTILOS OBLIGATORIOS (CSS INLINE):**
- Títulos (h1, h2): Color azul oscuro (#004d99).
- Tablas: width="100%", border-collapse="collapse", th con background-color="#004d99" y color="white".
- Celdas (td): padding="10px", border-bottom="1px solid #ddd".
- Texto: Párrafos bien estructurados, no bloques de texto infinito.

**FIRMA OBLIGATORIA:**
Al final del informe, firma estrictamente así (SIN IMÁGENES):
<div style="margin-top: 50px; text-align: center;">
    <strong>${userName || req.user?.name || 'Usuario del Sistema'}</strong><br>
    Consultor Experto en SG-SST<br>
    Licencia en Seguridad y Salud en el Trabajo Vigente
</div>
IMPORTANTE: NO incluyas ninguna etiqueta &lt;img&gt; ni placeholders de imagen para la firma. Solo texto.

Genera SOLO el contenido del cuerpo (HTML body tags).`;
        }

        // Initialize the model
        // 4. Generate the report with Fallback Strategy
        let result;
        let text;

        // Console logs removed as per user request

        const generationConfig = {
            maxOutputTokens: 65536, // Maximum allowed by model
            temperature: 0.7,
        };

        const selectedModel = req.body.modelName || 'gemini-3-flash-preview';

        // Helper: generate with timeout (90 seconds)
        const generateWithTimeout = async (model, prompt, timeoutMs = 180000) => {
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('TIMEOUT: La generación del informe excedió el tiempo límite. Intente de nuevo.')), timeoutMs)
            );
            const genPromise = (async () => {
                const genResult = await model.generateContent(prompt);
                const genResponse = await genResult.response;
                return genResponse.text();
            })();
            return Promise.race([genPromise, timeoutPromise]);
        };

        try {
            console.log(`[SGSST Diagnostico] Attempting Generation with ${selectedModel}`);
            const modelPrimary = genAI.getGenerativeModel({ model: selectedModel, generationConfig });
            text = await generateWithTimeout(modelPrimary, promptText);
        } catch (primaryError) {
            console.warn(`[SGSST Diagnostico] Primary model (${selectedModel}) failed, attempting fallback to gemini-2.0-flash-exp. Error:`, primaryError.message);
            // If it was a timeout, don't retry — inform user immediately
            if (primaryError.message.includes('TIMEOUT')) {
                throw primaryError;
            }
            try {
                // Fallback to previous stable/experimental version
                const modelFallback = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp', generationConfig });
                text = await generateWithTimeout(modelFallback, promptText);
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
