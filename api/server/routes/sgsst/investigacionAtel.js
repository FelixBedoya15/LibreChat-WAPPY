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

/**
 * POST /api/sgsst/investigacion-atel/generate
 * Generates an Investigation ATEL report based on form data and images.
 */
router.post('/generate', requireJwtAuth, async (req, res) => {
    try {
        const {
            tipoEvento, // Incidente, Accidente Leve, Accidente Grave, Accidente Mortal, Enfermedad Laboral
            fechaEvento,
            horaEvento,
            lugarEvento,
            descripcionHechos,
            afectadoNombre,
            afectadoCedula,
            afectadoCargo,
            testigos, // array of { nombre, cedula, cargo, testimonio }
            userName,
            images,
            modelName
        } = req.body;

        if (!descripcionHechos) {
            return res.status(400).json({ error: 'La descripción de los hechos es requerida' });
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
            logger.debug('[SGSST InvestigacionATEL] No user Google key found, trying env vars:', err.message);
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

        // 2. Load company info context
        let companyInfoBlock = '';
        let loadedCompanyInfo = null;
        try {
            const ci = await CompanyInfo.findOne({ user: req.user.id }).lean();
            loadedCompanyInfo = ci;
            if (ci && ci.companyName) {
                companyInfoBlock = buildCompanyContextString(ci);
            }
        } catch (ciErr) {
            logger.warn('Error loading company info:', ciErr.message);
        }

        // 3. Prepare Image Parts (if provided)
        const imageParts = [];
        if (images) {
            for (let i = 1; i <= 4; i++) {
                const imgKey = `foto${i}`;
                if (images[imgKey] && images[imgKey].startsWith('data:image/')) {
                    try {
                        const regex = /^data:(image\/[a-zA-Z]*);base64,([^\"]*)$/;
                        const matches = images[imgKey].match(regex);
                        if (matches && matches.length === 3) {
                            imageParts.push({
                                inlineData: {
                                    mimeType: matches[1],
                                    data: matches[2]
                                }
                            });
                        }
                    } catch (err) {
                        logger.warn(`Error processing image ${i}:`, err.message);
                    }
                }
            }
        }

        const dateStr = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });

        const headerHtml = buildStandardHeader({
            title: `INFORME DE INVESTIGACIÓN: ${tipoEvento?.toUpperCase() || 'EVENTO ATEL'}`,
            companyInfo: loadedCompanyInfo,
            date: dateStr,
            norm: 'Resolución 1401 de 2007',
            responsibleName: userName || req.user?.name,
        });

        // Testigos formatter
        let testigosBlock = '';
        if (testigos && testigos.length > 0) {
            testigosBlock = testigos.map((t, i) => `
Testigo ${i + 1}: ${t.nombre || 'N/A'} (CC: ${t.cedula || 'N/A'}) - Cargo: ${t.cargo || 'N/A'}
Versión: "${t.testimonio || 'No aportada'}"
`).join('\n');
        } else {
            testigosBlock = "No hubo testigos documentados.";
        }

        // Construir un super-prompt con diseño visual inyectado
        const systemPromptText = `Eres un experto Investigador de Accidentes y Enfermedades Laborales registrado bajo la normatividad colombiana (Resolución 1401 de 2007).
        
Recibes la siguiente información sobre un evento de tipo: **${tipoEvento || 'Indeterminado'}**:

**DATOS DEL EVENTO:**
- Fecha y Hora: ${fechaEvento || 'N/A'} a las ${horaEvento || 'N/A'}
- Lugar/Área: ${lugarEvento || 'N/A'}
- Afectado: ${afectadoNombre || 'N/A'} (CC: ${afectadoCedula || 'N/A'}) - Cargo: ${afectadoCargo || 'N/A'}

**TESTIGOS Y VERSIONES:**
${testigosBlock}

**DESCRIPCIÓN DE LOS HECHOS (Relato inicial):**
"${descripcionHechos}"

**DATOS DE EMPRESA:**
${companyInfoBlock}

${imageParts.length > 0 ? "*(Tienes acceso visual a las fotos del evento adjuntas)*" : ""}

## INSTRUCCIONES ESTRICTAS:
Genera un informe técnico DE DIAGRAMACIÓN GRÁFICA AVANZADA EN HTML para la investigación de este evento.
El informe debe ser profesional, analítico y verse MUY VISUAL AL ESTILO "DASHBOARD".

1. **ENCABEZADO:**
   Incluye EXACTAMENTE el siguiente código HTML como encabezado:
   ${headerHtml}

2. **ANÁLISIS DESCRIPTIVO:**
   Redacta una narración pericial técnica estructurando qué ocurrió antes, durante y después del evento, fusionando la descripción inicial de los hechos con los testimonios y lo que deduces de las imágenes (si hay).

3. **METODOLOGÍA 1: LOS 5 PORQUÉS (Visualmente como una escalera o tarjetas anidadas):**
   Utiliza etiquetas DIV, estilos CSS en línea (flexbox y bordes de colores) para mostrar cómo se llega a la causa raíz. 
   - Diseño recomendado: Un listado descendente donde cada tarjeta esté visualmente conectada por una línea o flecha. Fondo de las tarjetas: gris claro o azul pastel.

4. **METODOLOGÍA 2: DIAGRAMA ESPINA DE PESCADO - ISHIKAWA (Estético y Diagramado con CSS Grid):**
   Usa Flexbox o Grid para crear la espina.
   - Categorías: Hombre, Máquina, Entorno, Material, Método.
   - Diseña un bloque que simule la "cabeza" del pescado (El Problema/Accidente) y filas/flechas que simulen las espinas. **DEBE PARECER UN DIAGRAMA**. NO hagas solo una lista simple; utiliza \`display: flex\`, \`border\`, y \`background-color\`.

5. **METODOLOGÍA 3: ÁRBOL DE CAUSAS:**
   Construye un pequeño esquema jerárquico tipo organigrama hacia abajo (de las lesiones a los hechos, utilizando \`display: flex\` centrado y bordes).

6. **PLAN DE ACCIÓN Y MEDIDAS DE INTERVENCIÓN:**
   Tabla estructurada y colorida (NO "striped" o rayas por fila para proteger el modo oscuro), aplicando jerarquía de controles (Eliminación, Sustitución, Controles de Ingeniería, Administrativos, EPP).
   - Columnas: Control Propuesto / Tipo en Jerarquía / Responsable / Fecha de Cierre.

**REGLAS DE DISEÑO:**
- **PRECAUCIÓN MODO OSCURO:** NUNCA apliques un color de fondo (por ejemplo, gris claro) a una caja, tabla o div **sin aplicarle explícitamente y al mismo tiempo un \`color: #000;\` o su equivalente oscuro invertido**.
- Si no encuentras culpabilidad, atribúyelo a factores del entorno o falta de controles organizacionales. Siempre debe existir una causa raíz en base a la historia narrada.
- Las gráficas creadas solo con HTML/CSS deben quedar visualmente impactantes. 
- NO insertes firmas al final, nosotros nos encargaremos de eso automáticamente. No generes etiquetas <html> o <body>. Simplemente devuelve el contenido interno.
`;

        const genAI = new GoogleGenerativeAI(resolvedApiKey);
        const selectedModel = modelName || 'gemini-3-flash-preview';
        const model = genAI.getGenerativeModel({
            model: selectedModel,
            generationConfig: { maxOutputTokens: 65000, temperature: 0.6 }
        });

        const parts = [systemPromptText, ...imageParts];

        console.log(`[SGSST InvestigacionATEL] Generating report via fallback logic. Initial model: ${selectedModel}`);

        // Timeout wrapper
        const generateWithTimeout = async (mod, prmpt, timeoutMs = 180000) => {
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('TIMEOUT: La generación excedió el tiempo límite.')), timeoutMs)
            );
            const genPromise = (async () => {
                const genResult = await generateWithRetry(mod, prmpt);
                const genResponse = await genResult.response;
                return genResponse.text();
            })();
            return Promise.race([genPromise, timeoutPromise]);
        };

        const resultText = await generateWithTimeout(model, parts);

        let cleanedReport = resultText
            .replace(/```html/g, '')
            .replace(/```/g, '')
            .replace(/<!DOCTYPE[^>]*>/gi, '')
            .replace(/<html[^>]*>/gi, '').replace(/<\/html>/gi, '')
            .replace(/<head>[\s\S]*?<\/head>/gi, '')
            .replace(/<body[^>]*>/gi, '').replace(/<\/body>/gi, '')
            .trim();

        if (loadedCompanyInfo) {
            cleanedReport += buildSignatureSection(loadedCompanyInfo);
        }

        res.json({
            report: cleanedReport,
            conversationId: crypto.randomUUID(),
        });

    } catch (error) {
        logger.error('[SGSST InvestigacionATEL] Generation error:', error);
        res.status(500).json({ error: `Error generando el informe: ${error.message}` });
    }
});

/**
 * POST /api/sgsst/investigacion-atel/save-report
 */
router.post('/save-report', requireJwtAuth, async (req, res) => {
    try {
        const { content, title, tags } = req.body;
        if (!content) return res.status(400).json({ error: 'Content is required' });

        const conversationId = crypto.randomUUID();
        const messageId = crypto.randomUUID();
        const dateStr = new Date().toLocaleString('es-CO');
        const reportTitle = title || `Investigación ATEL - ${dateStr}`;
        const reportTags = tags || ['sgsst-investigacion-atel'];

        await saveConvo(req, {
            conversationId,
            title: reportTitle,
            endpoint: 'sgsst-investigacion-atel',
            model: 'sgsst-investigacion-atel',
        }, { context: 'SGSST Investigacion ATEL Save' });

        await saveMessage(req, {
            messageId,
            conversationId,
            text: content,
            sender: 'SGSST Investigación ATEL',
            isCreatedByUser: false,
            parentMessageId: '00000000-0000-0000-0000-000000000000',
        }, { context: 'SGSST ATEL message' });

        try {
            await updateTagsForConversation(req.user.id, conversationId, reportTags);
        } catch (tagErr) { }

        res.status(201).json({ conversationId, messageId, title: reportTitle });
    } catch (error) {
        logger.error('[SGSST InvestigacionATEL save-report] Error:', error);
        res.status(500).json({ error: 'Error saving report' });
    }
});

/**
 * PUT /api/sgsst/investigacion-atel/save-report
 */
router.put('/save-report', requireJwtAuth, async (req, res) => {
    try {
        const { conversationId, messageId, content } = req.body;
        if (!conversationId || !messageId || !content) {
            return res.status(400).json({ error: 'Missing parameters' });
        }
        await updateMessageText(req, { messageId, text: content });
        res.json({ success: true, conversationId, messageId });
    } catch (error) {
        res.status(500).json({ error: 'Error updating report' });
    }
});

module.exports = router;
