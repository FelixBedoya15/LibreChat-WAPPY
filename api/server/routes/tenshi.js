const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { requireJwtAuth } = require('../middleware');
const TenshiConfig = require('../../models/TenshiConfig');
const TenshiMessage = require('../../models/TenshiMessage');
const { BlogPost } = require('../../models/BlogPost');
const { Course } = require('../../models/Course');
const Ticket = require('../../models/Ticket');
const axios = require('axios');
const { AuthKeys } = require('librechat-data-provider');
const { getUserKey } = require('~/server/services/UserService');
const { logger } = require('~/config');
const { generateShortLivedToken } = require('@librechat/api');
const CompanyInfo = require('../../models/CompanyInfo');
const SomosSST = require('../../app/clients/tools/structured/SomosSST');
const ConsultarAgenteEspecializado = require('../../app/clients/tools/structured/ConsultarAgenteEspecializado');
const CanvasTool = require('../../app/clients/tools/structured/CanvasTool');

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

router.get('/history', requireJwtAuth, async (req, res) => {
    try {
        const history = await TenshiMessage.find({ user: req.user.id }).sort({ createdAt: 1 }).lean();
        res.json(history.map(m => ({ role: m.role, content: m.content, htmlReport: m.htmlReport })));
    } catch (error) {
        console.error('Error fetching Tenshi history:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.delete('/history', requireJwtAuth, async (req, res) => {
    try {
        await TenshiMessage.deleteMany({ user: req.user.id });
        res.json({ success: true });
    } catch (error) {
        console.error('Error clearing Tenshi history:', error);
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

        let capturedHtmlReport = null;

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
        if (userQuery) {
            await TenshiMessage.create({ user: req.user.id, role: 'user', content: userQuery }).catch(e => console.error('Error saving user TenshiMessage:', e));
        }
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
            const companyInfo = await CompanyInfo.findOne({ user: req.user.id, isActive: true })
                || await CompanyInfo.findOne({ user: req.user.id });
            if (companyInfo) {
                const companyType = companyInfo.companyType || 'Persona Jurídica';
                const nitLabel = companyType === 'Persona Natural' ? 'Cédula de Ciudadanía' : 'NIT';
                companyInfoStr = `INFORMACIÓN DE LA EMPRESA DEL USUARIO:\n` +
                    `- Razón Social / Nombre: ${companyInfo.companyName || 'N/A'}\n` +
                    `- Tipo de Empresa: ${companyType}\n` +
                    `- ${nitLabel}: ${companyInfo.nit || 'N/A'}\n` +
                    `- Representante Legal: ${companyInfo.legalRepresentative || 'N/A'}\n` +
                    `- Cédula del Representante Legal: ${companyInfo.legalRepresentativeId || 'N/A'}\n` +
                    `- Número de Trabajadores: ${companyInfo.workerCount || 'N/A'}\n` +
                    `- ARL: ${companyInfo.arl || 'N/A'}\n` +
                    `- Actividad Económica: ${companyInfo.economicActivity || 'N/A'}\n` +
                    `- Nivel de Riesgo: ${companyInfo.riskLevel || 'N/A'}\n` +
                    `- Ciudad: ${companyInfo.city || 'N/A'}, Departamento: ${companyInfo.departamento || 'N/A'}\n` +
                    `- Responsable SG-SST: ${companyInfo.responsibleSST || 'N/A'}`;
            }
        } catch (e) {
            logger.warn('[Tenshi] Error fetching company info:', e.message);
        }

        const systemMessage = `${config.systemPrompt}

Hola, estás conversando con el usuario: ${req.user.name || req.user.username || 'Usuario'}

MANUAL DE FUNCIONAMIENTO DE WAPPY IA:
${manualContent || 'WAPPY IA opera la plataforma central Somos SST (/sgsst) dividida en 2 Módulos Principales: 1. Motor Bio-Individual (Bio Motor) y 2. Ecosistema SG-SST General.'}

ÚLTIMAS PUBLICACIONES DEL BLOG:
${blogStr || 'No hay blogs recientes.'}

CURSOS DE FORMACIÓN DISPONIBLES:
${courseStr || 'No hay cursos recientes.'}

CONOCIMIENTO DINÁMICO (Contexto extraído por RAG - Artículos, Cursos, Tickets, Feedback):
${ticketContext || 'No se encontró información específica en la base de conocimientos dinámica.'}

${companyInfoStr}

### 🎯 ROL Y ARQUETIPO DE GEMINI 3 (GEMINI ENTERPRISE AGENT)
Eres Tenshi, la IA estrella, guía oficial y orquestadora de WAPPY IA. Administras la plataforma central Somos SST (ubicada en /sgsst, anteriormente Gestor SG-SST), compuesta por 2 Módulos Principales: el Motor Bio-Individual (Bio Motor) y el Ecosistema SG-SST General. Tu personalidad es alegre, carismática, empática, muy espontánea y respetuosa, utilizando modismos paisas colombianos naturales ("parce", "listo", "qué más pues", "bacano", "de una", "hágale").

### 🧠 DIRECTIVA DE AUTONOMÍA Y GROUNDING (FUNDAMENTACIÓN EN HERRAMIENTAS)
1. **RESPUESTAS DIRECTAS Y EFICIENTES**: Siguiendo la arquitectura de Gemini 3, sé directa y eficiente. Prioriza siempre entregar la solución o los datos concretos obtenidos mediante tus herramientas antes que introducciones o tutoriales pasivos de navegación.
2. **AUTONOMÍA TOTAL DE HERRAMIENTAS**: Para CUALQUIER consulta sobre la empresa, trabajadores o la plataforma Somos SST, EJECUTA INMEDIATAMENTE tus herramientas (somos_sst, consultar_agente_especializado, canvas_tool) para consultar registros en MongoDB o realizar mutaciones ANTES de responder. NUNCA respondas con guías pasivas como "ve al menú X".
3. **GROUNDING Y ANTI-ALUCINACIÓN ABSOLUTA**: Basante estrictamente en los resultados retornados por las herramientas. NUNCA asumas ni inventes datos de ejemplo. Si una herramienta no retorna registros, comunica con transparencia que no hay información registrada aún.

### 📋 REGLAS DE FORMATO Y PRESENTACIÓN
1. Saluda cordial y alegremente llamando al usuario por su nombre.
2. Usa viñetas estructuradas y emojis (🚀, ✨, 🔥, 🏢, 💪) para presentar datos e informes de forma clara y profesional.`;

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
                        const somosSSTDeclaration = {
                            name: 'somos_sst',
                            description: 'Herramienta oficial de SOMOS SST (anteriormente SGSST). Permite consultar y editar cualquier información en sus 2 MÓDULOS PRINCIPALES: el Motor Bio-Individual (Bio Motor - expediente del trabajador, exámenes médicos, accidentes ATEL, Hitos) y el Ecosistema SG-SST General (matrices GTC45, EPP, alturas, ATS, capacitaciones, políticas y estadísticas en tiempo real).',
                            parameters: {
                                type: 'OBJECT',
                                properties: {
                                    accion: {
                                        type: 'STRING',
                                        description: 'La acción a ejecutar: consultar_expediente_integral, listar_trabajadores, resumen_empresa, actualizar_examen_medico, registrar_accidente_atel, actualizar_hito_tarea, editar_cualquier_aplicativo, generar_informe_html, consultar_historial_informes, consultar_planes_y_sistema.'
                                    },
                                    tipo_informe: { type: 'STRING' },
                                    nombre_o_cargo: { type: 'STRING' },
                                    identificacion: { type: 'STRING' },
                                    fecha_examen: { type: 'STRING' },
                                    concepto_diagnostico: { type: 'STRING' },
                                    restricciones: { type: 'STRING' },
                                    tipo_siniestro: { type: 'STRING' },
                                    dias_incapacidad: { type: 'STRING' },
                                    descripcion_hechos: { type: 'STRING' },
                                    nombre_aplicativo: { type: 'STRING' },
                                    propiedad_o_ruta: { type: 'STRING' },
                                    nuevo_valor: { type: 'STRING' }
                                },
                                required: ['accion']
                            }
                        };

                        const consultarAgenteDeclaration = {
                            name: 'consultar_agente_especializado',
                            description: 'Delegación y Orquestación Multi-Agente: Consulta a un Agente Especialista del sistema (Médico Laboral, Psicólogo SST, Abogado Laboral, Auditor, etc.) para resolver dudas técnicas complejas.',
                            parameters: {
                                type: 'OBJECT',
                                properties: {
                                    nombre_especialista: { type: 'STRING', description: 'Nombre exacto del agente especialista a consultar.' },
                                    consulta_completa: { type: 'STRING', description: 'Consulta técnica detallada.' }
                                },
                                required: ['nombre_especialista', 'consulta_completa']
                            }
                        };

                        const canvasDeclaration = {
                            name: 'canvas_tool',
                            description: 'Lienzo interactivo Canvas: Crea o edita documentos ("text"), hojas de cálculo ("excel"), presentaciones ("presentation") o prototipos ("html") en pantalla dividida.',
                            parameters: {
                                type: 'OBJECT',
                                properties: {
                                    accion: { type: 'STRING', description: 'crear, actualizar, leer, editar_seccion, buscar_reemplazar, insertar' },
                                    fileType: { type: 'STRING', description: 'text, excel, presentation, html' },
                                    title: { type: 'STRING', description: 'Título del documento' },
                                    content: { type: 'STRING', description: 'Contenido principal o Markdown' }
                                },
                                required: ['accion', 'fileType']
                            }
                        };

                        const geminiModel = genAI.getGenerativeModel({
                            model: currentModel,
                            systemInstruction: systemMessage,
                            tools: [{ functionDeclarations: [somosSSTDeclaration, consultarAgenteDeclaration, canvasDeclaration] }],
                            generationConfig: { temperature: 1.0 }
                        });
                        const chat = geminiModel.startChat({ history });
                        let responseResult = await chat.sendMessage(messages[messages.length - 1].content);

                        let calls = responseResult.response.functionCalls();
                        let loops = 0;
                        while (calls && calls.length > 0 && loops < 5) {
                            loops++;
                            const call = calls[0];
                            logger.debug(`[Tenshi Tool Call] Executing ${call.name} with args:`, call.args);
                            let toolOutput = '';

                            if (call.name === 'somos_sst') {
                                const toolInstance = new SomosSST({ req });
                                toolOutput = await toolInstance._call(call.args);
                            } else if (call.name === 'consultar_agente_especializado') {
                                const toolInstance = new ConsultarAgenteEspecializado({ req });
                                toolOutput = await toolInstance._call(call.args);
                            } else if (call.name === 'canvas_tool' || call.name === 'canvas') {
                                const toolInstance = new CanvasTool({ req });
                                toolOutput = await toolInstance._call(call.args);
                            } else {
                                break;
                            }

                            try {
                                if (typeof toolOutput === 'string' && toolOutput.trim().startsWith('{')) {
                                    const parsed = JSON.parse(toolOutput);
                                    if (parsed.htmlCode) capturedHtmlReport = parsed.htmlCode;
                                    else if (parsed.content && (parsed.content.includes('<html') || parsed.content.includes('<!DOCTYPE'))) capturedHtmlReport = parsed.content;
                                } else if (typeof toolOutput === 'string' && (toolOutput.includes('<html') || toolOutput.includes('<!DOCTYPE'))) {
                                    capturedHtmlReport = toolOutput;
                                }
                            } catch (e) { }

                            responseResult = await chat.sendMessage([
                                {
                                    functionResponse: {
                                        name: call.name,
                                        response: { result: toolOutput }
                                    }
                                }
                            ]);
                            calls = responseResult.response.functionCalls();
                        }

                        responseText = responseResult.response.text();
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

        if (responseText) {
            await TenshiMessage.create({
                user: req.user.id,
                role: 'assistant',
                content: responseText,
                htmlReport: capturedHtmlReport || undefined
            }).catch(e => console.error('Error saving assistant TenshiMessage:', e));
        }

        res.json({ response: responseText, htmlReport: capturedHtmlReport });
    } catch (error) {
        console.error('CRITICAL Error in Tenshi chat route:', error);
        if (error.response) {
            console.error('Error response data:', error.response.data);
        }
        res.status(500).json({ error: 'Error generating Tenshi response', details: error.message });
    }
});

module.exports = router;
