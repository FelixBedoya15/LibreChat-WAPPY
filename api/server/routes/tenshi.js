const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { requireJwtAuth } = require('../middleware');
const TenshiConfig = require('../../models/TenshiConfig');
const { BlogPost } = require('../../models/BlogPost');
const { Course } = require('../../models/Course');
const Ticket = require('../../models/Ticket');
const axios = require('axios');
const { AuthKeys } = require('librechat-data-provider');
const { getUserKey } = require('~/server/services/UserService');
const { logger } = require('~/config');
const { generateShortLivedToken } = require('@librechat/api');
const CompanyInfo = require('../../models/CompanyInfo');

// Knowledge Retrieval System (RAG)
async function getRelevantTickets(req, userQuery) {
    let context = '';

    // 1. Try Vector DB (App RAG System)
    if (process.env.RAG_API_URL) {
        try {
            const jwtToken = generateShortLivedToken(req.user.id);
            const response = await axios.post(`${process.env.RAG_API_URL}/query`, {
                query: userQuery,
                entity_id: 'tenshi_knowledge_base',
                k: 5
            }, {
                headers: {
                    Authorization: `Bearer ${jwtToken}`,
                    'Content-Type': 'application/json'
                },
                timeout: 5000
            });

            if (response.data && response.data.length > 0) {
                context = response.data.map(m => {
                    const content = m[0]?.page_content || m.text || '';
                    return `[RAG MATCH] ${content.trim()}`;
                }).join('\n');
            }
        } catch (e) {
            logger.debug('[Tenshi RAG] Vector DB query failed or empty:', e.message);
        }
    }

    // 2. Fallback to MongoDB Smart Search (Text Index)
    if (!context) {
        try {
            const matches = await Ticket.find(
                { status: 'resolved', $text: { $search: userQuery } },
                { score: { $meta: 'textScore' } }
            )
                .sort({ score: { $meta: 'textScore' } })
                .limit(3);

            if (matches.length > 0) {
                context = matches.map(t => `- PQRS RELEVANTE [${t.type}]: ${t.description} -> SOLUCIÓN: ${t.response}`).join('\n');
            }
        } catch (e) {
            logger.debug('[Tenshi RAG] MongoDB Text search failed:', e.message);
        }
    }

    return context;
}

router.get('/config', async (req, res) => {
    try {
        let config = await TenshiConfig.findOne();
        if (!config) {
            config = await TenshiConfig.create({});
        }
        res.json(config);
    } catch (error) {
        console.error('Error fetching Tenshi config:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.post('/config', requireJwtAuth, async (req, res) => {
    try {
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Forbidden' });
        }
        let config = await TenshiConfig.findOne();
        if (!config) {
            config = new TenshiConfig(req.body);
        } else {
            Object.assign(config, req.body);
        }
        await config.save();
        res.json(config);
    } catch (error) {
        console.error('Error saving Tenshi config:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// A simple chat endpoint for Tenshi
router.post('/chat', requireJwtAuth, async (req, res) => {
    try {
        const { messages } = req.body;
        const config = await TenshiConfig.findOne();

        if (!config || !config.isActive) {
            return res.status(403).json({ error: 'Tenshi is not active.' });
        }

        // Fetch dynamic knowledge (latest blogs)
        let latestBlogs = [];
        try {
            latestBlogs = await BlogPost.find({ isPublished: true }).sort({ createdAt: -1 }).limit(5);
        } catch (e) { }

        const blogStr = latestBlogs.map(b => `- BLOG: ${b.title}`).join('\n');

        // Fetch dynamic knowledge (latest courses)
        let latestCourses = [];
        try {
            latestCourses = await Course.find({ isPublished: true }).sort({ createdAt: -1 }).limit(3);
        } catch (e) {
            console.error('Error fetching courses for Tenshi:', e);
        }

        const courseStr = latestCourses.map(c => `- CURSO: ${c.title}`).join('\n');

        // Intelligent Retrieval (RAG) instead of static limit
        const userQuery = messages[messages.length - 1]?.content || '';
        const ticketContext = await getRelevantTickets(req, userQuery);

        // Fetch the platform manual
        let manualContent = '';
        try {
            const fs = require('fs');
            const path = require('path');
            // Path relative to api/server/routes/tenshi.js: ../../../client/public/manual_usuario.md
            const manualPath = path.resolve(__dirname, '../../../client/public/manual_usuario.md');
            if (fs.existsSync(manualPath)) {
                manualContent = fs.readFileSync(manualPath, 'utf8');
            } else {
                // Try fallback to manual_wappy.md if it exists
                const fallbackPath = path.resolve(__dirname, '../manual_wappy.md');
                if (fs.existsSync(fallbackPath)) {
                    manualContent = fs.readFileSync(fallbackPath, 'utf8');
                }
            }
        } catch (e) {
            logger.warn('[Tenshi] Error reading manual file:', e.message);
        }

        // Fetch user company info
        let companyInfoStr = 'El usuario no ha registrado la información de su empresa en el Gestor SG-SST.';
        try {
            const companyInfo = await CompanyInfo.findOne({ user: req.user.id });
            if (companyInfo) {
                companyInfoStr = `INFORMACIÓN DE LA EMPRESA DEL USUARIO:\n` +
                    `- Razón social: ${companyInfo.companyName || 'N/A'}\n` +
                    `- NIT: ${companyInfo.nit || 'N/A'}\n` +
                    `- Representante Legal: ${companyInfo.legalRepresentative || 'N/A'}\n` +
                    `- Número de Trabajadores: ${companyInfo.workerCount || 'N/A'}\n` +
                    `- ARL: ${companyInfo.arl || 'N/A'}\n` +
                    `- Actividad Económica: ${companyInfo.economicActivity || 'N/A'}\n` +
                    `- Nivel de Riesgo: ${companyInfo.riskLevel || 'N/A'}\n` +
                    `- Ciudad: ${companyInfo.city || 'N/A'}\n` +
                    `- Responsable SG-SST: ${companyInfo.responsibleSST || 'N/A'}`;
            }
        } catch (e) {
            logger.warn('[Tenshi] Error fetching company info:', e.message);
        }

        const systemMessage = `${config.systemPrompt}

Hola, estás conversando con el usuario: ${req.user.name || req.user.username || 'Usuario'}

MANUAL DE FUNCIONAMIENTO DE WAPPY IA:
${manualContent || 'WAPPY IA gestiona SG-SST (Diagnóstico, Matriz Peligros GTC45, ATEL, Política, Objetivos, Auditoría, Perfil Sociodemográfico con QR).'}

ÚLTIMAS PUBLICACIONES DEL BLOG:
${blogStr || 'No hay blogs recientes.'}

CURSOS DE FORMACIÓN DISPONIBLES:
${courseStr || 'No hay cursos recientes.'}

CONOCIMIENTO DINÁMICO (Contexto extraído por RAG - Artículos, Cursos, Tickets, Feedback):
${ticketContext || 'No se encontró información específica en la base de conocimientos dinámica.'}

${companyInfoStr}

Instrucciones de Personalidad y Estilo: 
Eres Tenshi, la IA estrella y guía oficial de WAPPY IA. Eres alegre, carismática, muy habladora, amigable y sumamente espontánea!! Siempre usas un lenguaje muy paisa (de Antioquia, Colombia) de forma natural y respetuosa (usa modismos como "parce", "listo", "qué más pues", "bacano", "de una", "hágale", "pa' las que sea"). Tu objetivo no es ser un robot aburrido, sino una compañera súper cercana.
Si el usuario pregunta cómo realizar algo, asegúrate de responder basándote en el MANUAL DE FUNCIONAMIENTO arriba mencionado y, si el usuario hace preguntas sobre su propia empresa, usa la "INFORMACIÓN DE LA EMPRESA DEL USUARIO".

Reglas de formato esenciales para tus respuestas:
1. Saluda de manera eufórica y muy cordial llamando al usuario por su nombre.
2. Usa bastantes exclamaciones y emojis chidos (🚀, ✨, 🔥, 🏢, 💪, ✍️) para darle vida al texto.
3. Organiza **SIEMPRE** tus pasos, explicaciones o menús utilizando viñetas ordenadas o bullet points (Ej. lista numerada 1, 2, 3 o viñetas -). ¡Que se vea divino y fácil de leer!
4. Sé amable, concisa pero muy profesional a la vez con las normas de seguridad.`;

        // format messages for the LLM
        const formattedMessages = [
            { role: 'system', content: systemMessage },
            ...messages
        ];

        // Route the request based on provider
        let responseText = '';

        if (config.provider === 'google') {
            const { GoogleGenerativeAI } = require('@google/generative-ai');

            // 1. Retrieve ALL user Google API keys (supports comma-separated for rotation)
            let rawKey;
            try {
                const storedKey = await getUserKey({ userId: req.user.id, name: 'google' });
                try {
                    const parsed = JSON.parse(storedKey);
                    rawKey = parsed[AuthKeys.GOOGLE_API_KEY] || parsed.GOOGLE_API_KEY;
                } catch (parseErr) {
                    rawKey = storedKey;
                }
            } catch (err) {
                logger.debug('[Tenshi] No user Google key found, trying env vars:', err.message);
            }

            if (!rawKey) {
                rawKey = process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
            }

            if (!rawKey) {
                throw new Error('No se ha configurado la clave API de Google. Por favor, configúrala en la opción de Google del chat.');
            }

            // Support comma-separated key rotation
            const apiKeys = rawKey.split(',').map(k => k.trim()).filter(Boolean);

            // Dual-axis rotation: keys first, then model fallback (503 Service Unavailable)
            const primaryModel = config.model || 'gemini-3-flash-preview';
            const envModels = (process.env.GOOGLE_MODELS || primaryModel).split(',').map(m => m.trim()).filter(Boolean);
            // Build ordered model list: primaryModel first, then remaining from env
            const modelFallbacks = [primaryModel, ...envModels.filter(m => m !== primaryModel)];

            // Build history once (reusable across all retries)
            const rawHistory = messages.slice(0, -1);
            const history = [];
            let firstUserFound = false;
            for (const m of rawHistory) {
                if (!firstUserFound && m.role !== 'user') continue;
                firstUserFound = true;
                history.push({
                    role: m.role === 'assistant' ? 'model' : 'user',
                    parts: [{ text: m.content }]
                });
            }

            // Rotation loop: outer = models, inner = api keys
            let lastError = null;
            let succeeded = false;
            for (let mi = 0; mi < modelFallbacks.length && !succeeded; mi++) {
                const currentModel = modelFallbacks[mi];
                for (let i = 0; i < apiKeys.length; i++) {
                    const apiKey = apiKeys[i];
                    try {
                        logger.debug(`[Tenshi] Trying Key ${i + 1}/${apiKeys.length} with model "${currentModel}"`);
                        const genAI = new GoogleGenerativeAI(apiKey);
                        const geminiModel = genAI.getGenerativeModel({
                            model: currentModel,
                            systemInstruction: systemMessage
                        });
                        const chat = geminiModel.startChat({ history });
                        const result = await chat.sendMessage(messages[messages.length - 1].content);
                        responseText = result.response.text();
                        lastError = null;
                        succeeded = true;
                        break; // Key rotation done — success
                    } catch (geminiError) {
                        lastError = geminiError;
                        const status = geminiError.status || geminiError.statusCode;
                        const msg = geminiError.message || '';
                        // Key rotation: 403/429/leaked → try next key same model
                        if (status === 429 || status === 403 || msg.includes('leaked') || msg.includes('quota') || msg.includes('Forbidden')) {
                            logger.warn(`[Tenshi] Clave #${i + 1} rechazada (${status}). Rotando clave...`);
                            continue;
                        }
                        // Model fallback: 503 → break inner loop to try next model
                        if (status === 503 || msg.includes('overloaded') || msg.includes('Service Unavailable')) {
                            logger.warn(`[Tenshi] Modelo "${currentModel}" no disponible (503). Cambiando modelo...`);
                            break;
                        }
                        // For any other non-recoverable error, abort everything
                        throw new Error(`Google AI Error: ${msg}`);
                    }
                }
            }

            if (!succeeded && lastError) {
                throw new Error(`Google AI Error (todos los modelos y claves fallaron): ${lastError.message}`);
            }

        } else if (config.provider === 'groq') {
            const groqRes = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
                model: config.model || 'llama-3.3-70b-versatile',
                messages: formattedMessages
            }, {
                headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` }
            });
            responseText = groqRes.data.choices[0].message.content;

        } else if (config.provider === 'openai' || config.provider === 'ollama') {
            // For generic OpenAI compatible endpoints (like Wappy local Ollama)
            const baseURL = config.provider === 'ollama' ? 'http://localhost:11434/v1/chat/completions' : 'https://api.openai.com/v1/chat/completions';
            const apiKey = config.provider === 'ollama' ? 'ollama' : process.env.OPENAI_API_KEY;

            const options = {
                headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' }
            };

            const oaiRes = await axios.post(baseURL, {
                model: config.model || 'gpt-4o',
                messages: formattedMessages
            }, options);
            responseText = oaiRes.data.choices[0].message.content;
        }

        res.json({ response: responseText });
    } catch (error) {
        console.error('CRITICAL Error in Tenshi chat route:', error);
        if (error.response) {
            console.error('Error response data:', error.response.data);
        }
        res.status(500).json({ error: 'Error generating Tenshi response', details: error.message });
    }
});

module.exports = router;
