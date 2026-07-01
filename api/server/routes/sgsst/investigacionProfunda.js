const express = require('express');
const { generateWithKeyRotation, resolveApiKeys } = require('./sgsstGemini');
const crypto = require('crypto');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { AuthKeys } = require('librechat-data-provider');
const { logger } = require('~/config');
const requireJwtAuth = require('~/server/middleware/requireJwtAuth');
const { getUserKey } = require('~/server/services/UserService');
const { saveConvo } = require('~/models/Conversation');
const { saveMessage, updateMessageText } = require('~/models/Message');
const CompanyInfo = require('~/models/CompanyInfo');
const Notification = require('~/models/Notification');
const { buildStandardHeader, buildCompanyContextString, buildSignatureSection } = require('./reportHeader');

async function getActiveCompanyId(userId) {
    let active = await CompanyInfo.findOne({ user: userId, isActive: true });
    if (!active) active = await CompanyInfo.findOne({ user: userId });
    return active ? active._id : null;
}

// ─── POST /api/sgsst/investigacion-profunda/generate ─────────────────────────
router.post('/generate', requireJwtAuth, async (req, res) => {
    try {
        const {
            topic,
            modelName,
            userName,
        } = req.body;

        if (!topic) {
            return res.status(400).json({ error: 'El tema o consulta de investigación es requerido.' });
        }

        // ── Resolve API Key ──
        let resolvedApiKey;
        try {
            const storedKey = await getUserKey({ userId: req.user.id, name: 'google' });
            try {
                const parsed = JSON.parse(storedKey);
                resolvedApiKey = parsed[AuthKeys.GOOGLE_API_KEY] || parsed.GOOGLE_API_KEY;
            } catch {
                resolvedApiKey = storedKey;
            }
        } catch (err) {
            logger.debug('[InvestigacionProfunda] No user Google key:', err.message);
        }
        if (!resolvedApiKey) {
            resolvedApiKey = process.env.GOOGLE_KEY || process.env.GEMINI_API_KEY;
        }
        if (resolvedApiKey && typeof resolvedApiKey === 'string') {
            resolvedApiKey = resolvedApiKey.split(',')[0].trim();
        }
        if (!resolvedApiKey) {
            return res.status(400).json({ error: 'No se ha configurado la clave API de Google.' });
        }

        // ── Company Info ──
        let companyInfoBlock = '';
        let loadedCompanyInfo = null;
        try {
            const ci = await CompanyInfo.findOne({ user: req.user.id }).lean();
            loadedCompanyInfo = ci;
            if (ci?.companyName) companyInfoBlock = buildCompanyContextString(ci);
        } catch (ciErr) {
            logger.warn('[InvestigacionProfunda] Error loading company info:', ciErr.message);
        }

        const dateStr = new Date().toLocaleString('es-CO');
        const reportTitle = `Investigación Profunda - ${topic.substring(0, 30)}... (${dateStr})`;
        const conversationId = crypto.randomUUID();
        const messageId = crypto.randomUUID();

        // 1. Save conversation atomically
        const reportTags = ['sgsst-investigacion-profunda'];
        if (loadedCompanyInfo?._id) {
            reportTags.push(`company-${loadedCompanyInfo._id.toString()}`);
        }

        await saveConvo(req, {
            conversationId,
            title: reportTitle,
            endpoint: 'sgsst-investigacion-profunda',
            model: 'sgsst-investigacion-profunda',
            tags: reportTags,
        }, { context: 'SGSST Investigacion Profunda Save' });

        // 2. Save placeholder message with a nice loader styling
        const placeholderText = `
            <div style="padding: 20px; border-radius: 12px; border: 1px dashed #0f766e; background-color: #f0fdfa; display: flex; flex-direction: column; align-items: center; gap: 15px; text-align: center; margin: 20px 0;">
                <div style="width: 40px; height: 40px; border: 4px solid #ccfbf1; border-top: 4px solid #0f766e; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                <div style="color: #0f766e; font-weight: 700; font-size: 16px;">🔍 Realizando Investigación SST en Segundo Plano...</div>
                <div style="font-size: 13px; color: #115e59; max-width: 500px;">
                    Estamos consultando la base de datos interna y cruzando la legislación colombiana (Decreto 1072, etc.). 
                    <strong>Puedes cerrar esta pestaña o seguir chateando con otros agentes.</strong> Te notificaremos cuando el informe esté completo.
                </div>
            </div>
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `.trim();

        await saveMessage(req, {
            messageId,
            conversationId,
            text: placeholderText,
            sender: 'SGSST Investigación Profunda',
            isCreatedByUser: false,
            parentMessageId: '00000000-0000-0000-0000-000000000000',
        }, { context: 'SGSST Deep Research placeholder' });

        // 3. Immediately return status 201 to the client
        res.status(201).json({ conversationId, messageId, title: reportTitle });

        // 4. Run the deep research task asynchronously in the background
        (async () => {
            try {
                // Initialize model
                const personalization = req.user?.personalization?.geminiModels;
                const preferredModel = personalization?.sstManagement || (process.env.GOOGLE_MODELS || 'gemini-3.5-flash').split(',')[0].trim();
                const finalModelName = modelName || preferredModel;
                const genAI = new GoogleGenerativeAI(resolvedApiKey);
                const model = genAI.getGenerativeModel({
                    model: finalModelName,
                    generationConfig: { maxOutputTokens: 65000, temperature: 0.65 },
                });

                // Standard header (dynamic concatenation to prevent recitation block)
                const headerHTML = buildStandardHeader({
                    title: 'INFORME DE INVESTIGACIÓN PROFUNDA SST',
                    companyInfo: loadedCompanyInfo,
                    date: dateStr,
                    norm: 'Decreto 1072 de 2015 / Resolución 0312 de 2019',
                    responsibleName: userName || req.user?.name,
                });

                const systemPromptText = `Eres un Asesor Legal y Consultor Senior experto en Sistemas de Gestión de Seguridad y Salud en el Trabajo (SG-SST) en Colombia.
Tu objetivo es redactar un informe formal, riguroso y exhaustivo en respuesta a la consulta planteada por el usuario.

## CONTEXTO DE LA EMPRESA
${companyInfoBlock || 'No se tiene información detallada de la empresa. Asume estándares generales del sector.'}

## CONSULTA DE INVESTIGACIÓN DE ALTA COMPLEJIDAD
"${topic}"

## INSTRUCCIONES DE REDACCIÓN
Genera un informe formal en formato HTML. El diseño debe ser premium, elegante y de nivel directivo.
- Usa tablas de datos simples si es necesario.
- Divide el análisis en capítulos lógicos (ej. Contexto, Análisis Normativo Aplicable, Impacto Organizacional, Recomendaciones de Control).
- No inventes leyes. Cita exactamente el Decreto 1072 de 2015 o la Resolución 0312 de 2019 según aplique.
- **ENCABEZADO:** No generes ningún encabezado del documento ni logos. El sistema los insertará automáticamente.
- **FIRMA:** No generes firmas al final, el sistema las agregará.
- Retorna SOLO el contenido HTML interno listo para renderizar (no uses etiquetas <html>, <head> ni <body>, ni ticks de markdown \`\`\`).`;

                const generateWithTimeout = async (model, prompt, timeoutMs = 300000) => {
                    const timeoutPromise = new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('TIMEOUT: La generación del informe de investigación profunda excedió el tiempo límite.')), timeoutMs)
                    );
                    const genPromise = (async () => {
                        const genResult = await generateWithKeyRotation(model, req.user?.id || req.user, prompt);
                        return genResult.response.text();
                    })();
                    return Promise.race([genPromise, timeoutPromise]);
                };

                console.log(`[InvestigacionProfunda] Iniciando generación en background. Modelo: ${finalModelName}`);
                const resultText = await generateWithTimeout(model, systemPromptText);

                let cleanedReport = resultText
                    .replace(/```html/g, '')
                    .replace(/```/g, '')
                    .replace(/<!DOCTYPE[^>]*>/gi, '')
                    .replace(/<html[^>]*>/gi, '').replace(/<\/html>/gi, '')
                    .replace(/<head>[\s\S]*?<\/head>/gi, '')
                    .replace(/<body[^>]*>/gi, '').replace(/<\/body>/gi, '')
                    .trim();

                // Concatena el encabezado y firmas
                cleanedReport = headerHTML + '\n' + cleanedReport;

                if (loadedCompanyInfo) {
                    cleanedReport += buildSignatureSection(loadedCompanyInfo);
                }

                // Update the placeholder message in MongoDB
                // Since saveMessage accepts req, we wrap the update message operation
                await updateMessageText(req, { messageId, text: cleanedReport });

                // Create the system notification for the user
                await Notification.create({
                    user: req.user.id,
                    type: 'system_update',
                    title: '🔍 ¡Investigación Profunda SST Lista!',
                    body: `La investigación sobre "${topic.substring(0, 40)}..." ha concluido. Abre la conversación para ver el informe.`,
                    metadata: { conversationId, messageId }
                });

                console.log(`[InvestigacionProfunda] Generación en background completada para convo ${conversationId}`);
            } catch (bgErr) {
                logger.error('[InvestigacionProfunda Background Worker] Error:', bgErr);
                try {
                    await updateMessageText(req, {
                        messageId,
                        text: `
                            <div style="padding: 20px; border-radius: 12px; border: 1px solid #fca5a5; background-color: #fef2f2; color: #991b1b; margin: 20px 0;">
                                <strong style="display: block; margin-bottom: 8px;">❌ Error en la generación del informe</strong>
                                <span style="font-size: 13px;">No pudimos completar la investigación debido al siguiente error: ${bgErr.message}</span>
                            </div>
                        `.trim()
                    });
                } catch (updateErr) {
                    logger.error('[InvestigacionProfunda] Error setting error text:', updateErr);
                }
            }
        })();

    } catch (error) {
        logger.error('[InvestigacionProfunda Route Error] Error:', error);
        res.status(500).json({ error: 'Error al iniciar la generación de la investigación' });
    }
});

// ─── GET /api/sgsst/investigacion-profunda/status/:conversationId/:messageId ─
router.get('/status/:conversationId/:messageId', requireJwtAuth, async (req, res) => {
    try {
        const { conversationId, messageId } = req.params;
        const Message = require('~/models/Message');
        const msg = await Message.findOne({ conversationId, messageId }).lean();
        if (!msg) {
            return res.status(404).json({ error: 'Mensaje no encontrado' });
        }
        const isCompleted = !msg.text.includes('Realizando Investigación SST en Segundo Plano...');
        const isError = msg.text.includes('Error en la generación del informe');
        res.json({
            text: msg.text,
            isCompleted,
            isError
        });
    } catch (error) {
        logger.error('[InvestigacionProfunda Status Error]:', error);
        res.status(500).json({ error: 'Error al consultar estado' });
    }
});

module.exports = router;
