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
const { getActiveSkillInstructions } = require('~/server/services/skillRouter');
const { resolveApiKeys } = require('./sgsst/sgsstGemini');

// Knowledge Retrieval System (RAG)
async function getRelevantTickets(req, userQuery) {
    if (!userQuery || userQuery.length < 5) return '';
    let context = '';

    // 1. Try Vector DB (App RAG System) with ultra-fast 500ms timeout
    if (process.env.RAG_API_URL) {
        try {
            const jwtToken = generateShortLivedToken(req.user.id);
            const response = await axios.post(`${process.env.RAG_API_URL}/query`, {
                query: userQuery,
                entity_id: 'tenshi_knowledge_base',
                k: 3
            }, {
                headers: {
                    Authorization: `Bearer ${jwtToken}`,
                    'Content-Type': 'application/json'
                },
                timeout: 500
            });

            if (response.data && response.data.length > 0) {
                context = response.data.map(m => {
                    const content = m[0]?.page_content || m.text || '';
                    return `[RAG MATCH] ${content.trim()}`;
                }).join('\n');
            }
        } catch (e) {
            // Silently ignore RAG timeout/connection error for speed
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
                .limit(2)
                .lean();

            if (matches.length > 0) {
                context = matches.map(t => `- PQRS RELEVANTE [${t.type}]: ${t.description} -> SOLUCIÓN: ${t.response}`).join('\n');
            }
        } catch (e) {}
    }

    return context;
}

// In-memory cache for static platform manual
let cachedManualContent = null;
function getPlatformManual() {
    if (cachedManualContent !== null) return cachedManualContent;
    try {
        const fs = require('fs');
        const path = require('path');
        const manualPath = path.resolve(__dirname, '../../../client/public/manual_usuario.md');
        if (fs.existsSync(manualPath)) {
            let content = fs.readFileSync(manualPath, 'utf8');
            if (content.length > 3000) content = content.substring(0, 3000) + '\n...(manual truncado para eficiencia)';
            cachedManualContent = content;
            return cachedManualContent;
        }
    } catch (e) {}
    cachedManualContent = 'WAPPY IA opera la plataforma central Somos SST (/sgsst) dividida en 2 Módulos Principales: 1. Motor Bio-Individual (Bio Motor) y 2. Ecosistema SG-SST General.';
    return cachedManualContent;
}

router.get('/config', async (req, res) => {
    try {
        let config = await TenshiConfig.findOne().lean();
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
        res.json(history.map(m => ({ _id: m._id, role: m.role, content: m.content, htmlReport: m.htmlReport })));
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

router.put('/message/:id', requireJwtAuth, async (req, res) => {
    try {
        const msgId = req.params.id;
        const { content } = req.body;
        const targetMsg = await TenshiMessage.findOne({ _id: msgId, user: req.user.id });
        if (!targetMsg) {
            return res.status(404).json({ error: 'Message not found' });
        }

        // Update content
        targetMsg.content = content;
        await targetMsg.save();

        // Delete all subsequent messages
        await TenshiMessage.deleteMany({
            user: req.user.id,
            createdAt: { $gt: targetMsg.createdAt }
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error updating Tenshi message:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.delete('/message/:id', requireJwtAuth, async (req, res) => {
    try {
        const msgId = req.params.id;
        const targetMsg = await TenshiMessage.findOne({ _id: msgId, user: req.user.id });
        if (!targetMsg) {
            return res.status(404).json({ error: 'Message not found' });
        }

        // Delete this message and all subsequent ones
        await TenshiMessage.deleteMany({
            user: req.user.id,
            createdAt: { $gte: targetMsg.createdAt }
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting Tenshi message:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// A simple chat endpoint for Tenshi
router.post('/chat', requireJwtAuth, async (req, res) => {
    try {
        const { messages, browserState } = req.body;
        logger.info(`[Tenshi Backend] /chat request received. Messages count: ${messages?.length}, browserState length: ${browserState?.length || 0}`);
        const config = await TenshiConfig.findOne().lean();

        if (!config || !config.isActive) {
            return res.status(403).json({ error: 'Tenshi is not active.' });
        }

        let capturedHtmlReport = null;
        let requestedGuiAction = null;
        let requestedGuiActions = null;

        const userQuery = messages[messages.length - 1]?.content || '';
        if (userQuery && !userQuery.startsWith('[RESULTADO_GUI]')) {
            TenshiMessage.create({ user: req.user.id, role: 'user', content: userQuery }).catch(e => console.error('Error saving user TenshiMessage:', e));
        }

        // Fetch dynamic knowledge concurrently via Promise.all for maximum response speed
        const [latestBlogs, latestCourses, ticketContext, companyInfo] = await Promise.all([
            BlogPost.find({ isPublished: true }).sort({ createdAt: -1 }).limit(3).lean().catch(() => []),
            Course.find({ isPublished: true }).sort({ createdAt: -1 }).limit(2).lean().catch(() => []),
            getRelevantTickets(req, userQuery).catch(() => ''),
            CompanyInfo.findOne({ user: req.user.id, isActive: true }).lean().catch(() => null)
        ]);

        const blogStr = latestBlogs.map(b => `- BLOG: ${b.title}`).join('\n');
        const courseStr = latestCourses.map(c => `- CURSO: ${c.title}`).join('\n');
        const manualContent = getPlatformManual();

        let companyInfoStr = 'El usuario no ha registrado la información de su empresa en el Gestor SG-SST.';
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

        const skillInstructions = getActiveSkillInstructions(userQuery, config.skills || []);

        let systemMessage = `${config.systemPrompt}

Hola, estás conversando con el usuario: ${req.user.name || req.user.username || 'Usuario'}

MANUAL DE FUNCIONAMIENTO DE WAPPY IA:
${manualContent}

${blogStr ? `ÚLTIMAS PUBLICACIONES DEL BLOG:\n${blogStr}\n` : ''}
${courseStr ? `CURSOS DE FORMACIÓN DISPONIBLES:\n${courseStr}\n` : ''}
${ticketContext ? `CONOCIMIENTO DINÁMICO (Contexto extraído por RAG):\n${ticketContext}\n` : ''}
${companyInfoStr}

### 🎯 ROL Y PERSONALIDAD DE TENSHI
Eres Tenshi, la IA estrella, guía oficial y orquestadora de WAPPY IA. Administras la plataforma central Somos SST (ubicada en /sgsst). Tu personalidad es alegre, carismática, empática, muy espontánea y respetuosa, utilizando modismos paisas colombianos naturales ("parce", "listo", "qué más pues", "bacano", "de una", "hágale").

### ⚡ DIRECTIVAS CRÍTICAS DE VELOCIDAD Y HERRAMIENTAS:
1. **RESPUESTAS INMEDIATAS A PREGUNTAS TEÓRICAS/CONCEPTUALES**: Si el usuario te hace preguntas conceptuales, definiciones teóricas (ej: "¿qué es SST?", "¿qué es un ATS?", "¿cuáles son las obligaciones del empleador?"), saludos o preguntas generales, RESPONDE DIRECTAMENTE EN TEXTO en 1 solo turno de forma concisa y alegre. ¡ESTÁ PROHIBIDO invocar herramientas como 'somos_sst' o 'resumen_empresa' para responder preguntas teóricas!
2. **USO DE HERRAMIENTAS EXCLUSIVAMENTE CUANDO SE SOLICITE**: Ejecuta 'somos_sst', 'consultar_agente_especializado' o 'canvas_tool' ÚNICAMENTE cuando el usuario te pida consultar datos reales guardados de su empresa/trabajadores, crear actividades en el Centro de Control ACPM o generar un informe formal HTML.
3. **GENERACIÓN DE INFORMES**: Si el usuario te pide un informe o reporte formal, usa 'somos_sst' con 'generar_informe_html', y en tu respuesta da un resumen de 2 viñetas e indícale que use el botón para descargarlo.`;

        if (skillInstructions) {
            systemMessage += `\n\n${skillInstructions}`;
        }

        if (browserState) {
            systemMessage += `\n\n### 🌐 ESTADO VISUAL DE LA PÁGINA ACTUAL (DEL NAVEGADOR DEL USUARIO)
Puedes interactuar con la pantalla del usuario (hacer clic, rellenar formularios, escribir texto, hacer scroll) utilizando la herramienta 'operar_interfaz_visual' pasándole el [índice] correspondiente de esta lista:
${browserState}

REGLAS EXTRAS PARA OPERAR LA INTERFAZ:
- NUNCA utilices la herramienta 'operar_interfaz_visual' para responder a saludos simples ("hola", "buenos días", etc.), despedidas o preguntas de texto puro que no requieran ninguna navegación ni interacción con la pantalla.
- Sé sumamente proactivo: si el usuario te dice que quiere, desea, necesita o te pide ayuda para realizar una tarea o acción (ej: "deseo crear un trabajador", "ayúdame a ver Z", "quiero registrar Y"), NO le expliques los pasos en texto. En lugar de eso, utiliza de inmediato la herramienta 'operar_interfaz_visual' para navegar, hacer clics y guiarlo o hacerlo por él en la pantalla. ¡El usuario quiere ver la automatización en vivo en su navegador!
- Persistencia del objetivo: Una vez que el usuario inicia una solicitud de tarea (ej: crear un trabajador), debes mantener la ejecución de esa tarea a lo largo de todos los turnos subsiguientes. Aunque recibas un mensaje de actualización '[RESULTADO_GUI]', debes analizar el nuevo DOM y seguir llamando a 'operar_interfaz_visual' de forma ininterrumpida hasta que el objetivo final (como guardar el formulario) se haya cumplido por completo. No te detengas a medio camino.
- NUNCA mientas ni alucines diciendo que has creado registros, guardado datos o hecho cambios en el "backend" o "base de datos" por tu cuenta si no has llamado a una herramienta real para ello. Si el usuario te pide hacer algo, hazlo interactivamente en la pantalla usando 'operar_interfaz_visual' (por ejemplo, navegando, haciendo clic en '+ Agregar Trabajador', y rellenando los campos) de manera que se vea en el navegador.
- Si tienes que buscar, pulsar o seleccionar algo, haz scroll o clics progresivamente llamando a 'operar_interfaz_visual' tantas veces como sea necesario en turnos sucesivos.
- NUNCA inventes índices de elementos que no aparezcan en la lista.
- FLUJO OBLIGATORIO PARA EDITAR UN TRABAJADOR EN PERFIL SOCIODEMOGRÁFICO O CONDICIONES DE SALUD:
  1. Cuando llegues al módulo (ej: Perfil Sociodemográfico), NO hagas clic en 'Guardar Localmente' todavía.
  2. Primero haz scroll hacia ABAJO en la lista para encontrar la tarjeta del trabajador específico (busca su nombre o cédula).
  3. Cuando veas la tarjeta del trabajador, haz clic en ella para expandir su formulario.
  4. Rellena o edita los campos del formulario (nombre, cédula, cargo, etc.) con la acción 'escribir'.
  5. SOLO DESPUÉS de haber rellenado los campos, haz scroll hacia ARRIBA para encontrar el botón 'Guardar Localmente' en la barra de herramientas y haz clic en él.
  6. Confirma que el guardado fue exitoso antes de reportar éxito al usuario.
- REGLA ANTI-TEXTO Y ANTI-ALUCINACIÓN: Si recibes un [RESULTADO_GUI], SIEMPRE debes responder llamando a 'operar_interfaz_visual' con la siguiente acción concreta. NUNCA respondas con texto inventando que realizaste una acción que no ejecutaste con una herramienta real. NUNCA digas "ya registré a Fabian" ni "quedó guardado" si no ejecutaste los pasos del flujo completo incluyendo el clic en Guardar.
- CAPACIDAD DE ACCIÓN EN LOTE (PARALELO): Puedes llamar a la herramienta 'operar_interfaz_visual' múltiples veces en la misma respuesta (en paralelo) si deseas ejecutar una secuencia de pasos lógicos seguidos (ej: hacer clic en una tarjeta, escribir en un campo, y luego hacer clic en guardar). Esto ahorra tiempo de red y ejecuta todo de una vez. Preferible usar esto para rellenar formularios rápidamente.`;
        }

        // format messages for the LLM
        const formattedMessages = [
            { role: 'system', content: systemMessage },
            ...messages
        ];

        // Route the request based on provider
        let responseText = '';

        if (config.provider === 'google') {
            const { GoogleGenerativeAI } = require('@google/generative-ai');

            // 1. Retrieve API keys with Tenshi priority and fallback to general keys / env
            let apiKeys = [];
            try {
                const tenshiKey = await getUserKey({ userId: req.user.id || req.user, name: 'tenshi_google' });
                if (tenshiKey) {
                    try {
                        const parsed = JSON.parse(tenshiKey);
                        const keyVal = parsed[AuthKeys.GOOGLE_API_KEY] || parsed.GOOGLE_API_KEY || tenshiKey;
                        apiKeys = keyVal.split(',').map(k => k.trim()).filter(Boolean);
                    } catch (e) {
                        apiKeys = tenshiKey.split(',').map(k => k.trim()).filter(Boolean);
                    }
                }
            } catch (err) {}

            if (!apiKeys || apiKeys.length === 0) {
                apiKeys = await resolveApiKeys(req.user.id || req.user);
            }

            if (!apiKeys || apiKeys.length === 0) {
                throw new Error('No se ha configurado la clave API de Google. Por favor, configúrala en la opción de Google del chat.');
            }

            // Dual-axis rotation: Candidate models with fallback
            const envModels = (process.env.GOOGLE_MODELS || '')
                .split(',')
                .map(m => m.trim().replace('models/', ''))
                .filter(m => m && !m.includes('live') && !m.includes('native-audio'));

            const configuredModel = (config.model || '').replace('models/', '').trim();
            const candidateModels = [
                configuredModel,
                ...envModels,
                'gemini-3.7-flash',
                'gemini-3.6-flash',
                'gemini-3.5-flash',
                'gemini-3.5-flash-lite'
            ].filter(Boolean);
            const modelFallbacks = [...new Set(candidateModels)];

            // Build history once (reusable across all retries), cleaning up old DOM states
            const rawHistory = messages.slice(0, -1);
            const history = [];
            let firstUserFound = false;
            for (const m of rawHistory) {
                if (!firstUserFound && m.role !== 'user') continue;
                firstUserFound = true;
                
                let contentText = m.content || '';
                if (m.role === 'user' && contentText.startsWith('[RESULTADO_GUI]')) {
                    const delimiterIndex = contentText.indexOf('Estado actual de la pantalla:');
                    if (delimiterIndex !== -1) {
                        contentText = contentText.substring(0, delimiterIndex).trim();
                    }
                }

                history.push({
                    role: m.role === 'assistant' ? 'model' : 'user',
                    parts: [{ text: contentText || ' ' }]
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
                            description: 'Herramienta oficial de SOMOS SST (anteriormente SGSST). Permite consultar y editar cualquier información en sus 2 MÓDULOS PRINCIPALES: el Motor Bio-Individual (Bio Motor - expediente del trabajador, exámenes médicos, accidentes ATEL, Hitos) y el Ecosistema SG-SST General (matrices GTC45, EPP, alturas, ATS, capacitaciones, políticas, Centro de Control ACPM y estadísticas en tiempo real).',
                            parameters: {
                                type: 'OBJECT',
                                properties: {
                                    accion: {
                                        type: 'STRING',
                                        description: 'La acción a ejecutar: consultar_expediente_integral, listar_trabajadores, resumen_empresa, actualizar_examen_medico, registrar_accidente_atel, actualizar_hito_tarea, editar_cualquier_aplicativo, generar_informe_html, consultar_historial_informes, consultar_planes_y_sistema, consultar_centro_control_acpm, crear_actividad_acpm, actualizar_actividad_acpm.'
                                    },
                                    tipo_informe: { type: 'STRING' },
                                    titulo_informe: { type: 'STRING' },
                                    contenido_html: { type: 'STRING' },
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
                                    nuevo_valor: { type: 'STRING' },
                                    titulo_actividad: { type: 'STRING', description: 'Título de la actividad para el Centro de Control ACPM' },
                                    descripcion_actividad: { type: 'STRING', description: 'Detalles o descripción de la actividad ACPM' },
                                    fecha_vencimiento: { type: 'STRING', description: 'Fecha de vencimiento (YYYY-MM-DD o "mañana")' },
                                    estado_actividad: { type: 'STRING', description: 'todo, due_soon, overdue, done' },
                                    tipo_actividad: { type: 'STRING', description: 'manual, medical_exam, training, other' }
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

                        const operarGUIDeclaration = {
                            name: 'operar_interfaz_visual',
                            description: 'Operar Interfaz Visual (GUI): Permite simular clics y escrituras directamente en el navegador del usuario. Úsala cuando necesites hacer clic en un botón, escribir texto en un input, o hacer scroll en la pantalla activa del usuario.',
                            parameters: {
                                type: 'OBJECT',
                                properties: {
                                    accion: {
                                        type: 'STRING',
                                        description: 'La acción a ejecutar: click, escribir, scroll, esperar.'
                                    },
                                    indice: {
                                        type: 'NUMBER',
                                        description: 'El índice numérico del elemento interactivo obtenido de la lista del DOM (ej: 0, 1, 2...). Requerido para "click" y "escribir".'
                                    },
                                    texto: {
                                        type: 'STRING',
                                        description: 'El texto a escribir (obligatorio si la acción es "escribir").'
                                    },
                                    direccion: {
                                        type: 'STRING',
                                        description: 'La dirección del scroll: "arriba" o "abajo" (obligatorio si la acción es "scroll").'
                                    }
                                },
                                required: ['accion']
                            }
                        };

                        const geminiModel = genAI.getGenerativeModel({
                            model: currentModel,
                            systemInstruction: systemMessage,
                            tools: [{ functionDeclarations: [somosSSTDeclaration, consultarAgenteDeclaration, canvasDeclaration, operarGUIDeclaration] }],
                            generationConfig: { temperature: 0.7 }
                        });
                        const chat = geminiModel.startChat({ history });

                        const lastUserMsg = messages[messages.length - 1]?.content || 'Hola';
                        logger.info(`[Tenshi Backend] Sending request to Gemini (${currentModel}) with message: "${lastUserMsg}"`);
                        let responseResult = await chat.sendMessage(lastUserMsg);

                        let calls = responseResult.response.functionCalls();
                        logger.info(`[Tenshi Backend] Gemini initial response function calls: ${JSON.stringify(calls)}`);
                        let loops = 0;
                        requestedGuiAction = null;
                        requestedGuiActions = null;

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
                            } else if (call.name === 'operar_interfaz_visual') {
                                const guiCalls = calls.filter(c => c.name === 'operar_interfaz_visual');
                                requestedGuiActions = guiCalls.map(c => ({
                                    accion: c.args.accion,
                                    indice: c.args.indice,
                                    texto: c.args.texto,
                                    direccion: c.args.direccion
                                }));
                                requestedGuiAction = requestedGuiActions[0]; // fallback
                                break;
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
                                        response: { result: typeof toolOutput === 'string' ? toolOutput : JSON.stringify(toolOutput) }
                                    }
                                }
                            ]);
                            calls = responseResult.response.functionCalls();
                        }

                        try {
                            responseText = responseResult.response.text();
                            if (!responseText || !responseText.trim()) {
                                responseText = "Entendido, procedo a realizar una acción en la pantalla...";
                            }
                        } catch (textErr) {
                            responseText = "Entendido, procedo a realizar una acción en la pantalla...";
                        }
                        logger.info(`[Tenshi Backend] Final responseText: "${responseText}", guiAction: ${JSON.stringify(requestedGuiAction)}`);
                        lastError = null;
                        succeeded = true;
                        break; // Key rotation done — success
                    } catch (geminiError) {
                        lastError = geminiError;
                        const status = geminiError.status || (geminiError.response && geminiError.response.status) || 0;
                        const msg = (geminiError.message || '').toLowerCase();

                        // Key rotation: 403 / 429 / leaked / invalid key
                        const isRateLimit = status === 429 || msg.includes('429') ||
                            msg.includes('quota') || msg.includes('rate limit') || msg.includes('too many requests');
                        const isQuotaExceeded = status === 403 || msg.includes('leaked') || msg.includes('forbidden');
                        const isInvalidKey = status === 400 && (msg.includes('api_key_invalid') || msg.includes('api key not valid'));

                        if (isRateLimit || isQuotaExceeded || isInvalidKey) {
                            logger.warn(`[Tenshi] Clave #${i + 1} rechazada (${status || 'quota'}). Rotando clave...`);
                            continue; // Try next key on same model
                        }

                        // Model fallback: 503 / 404 / overloaded / not found
                        const is503 = status === 503 || msg.includes('503') || msg.includes('overloaded') || msg.includes('service unavailable');
                        const is404 = status === 404 || msg.includes('404') || msg.includes('not found') || msg.includes('is not found for api version');

                        if (is503 || is404) {
                            logger.warn(`[Tenshi] Modelo "${currentModel}" no disponible (${status || 'error'}). Cambiando modelo...`);
                            break; // Try next model in outer loop
                        }

                        logger.warn(`[Tenshi] Error con modelo "${currentModel}" y clave #${i + 1}: ${geminiError.message}. Probando siguiente modelo...`);
                        break;
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

        if (responseText && !requestedGuiAction && (!requestedGuiActions || requestedGuiActions.length === 0)) {
            await TenshiMessage.create({
                user: req.user.id,
                role: 'assistant',
                content: responseText,
                htmlReport: capturedHtmlReport || undefined
            }).catch(e => console.error('Error saving assistant TenshiMessage:', e));
        }

        res.json({ response: responseText, htmlReport: capturedHtmlReport, guiAction: requestedGuiAction, guiActions: requestedGuiActions });
    } catch (error) {
        console.error('CRITICAL Error in Tenshi chat route:', error);
        if (error.response) {
            console.error('Error response data:', error.response.data);
        }
        res.status(500).json({ error: 'Error generating Tenshi response', details: error.message });
    }
});

/**
 * GET /api/tenshi/skills
 * Devuelve las skills disponibles para Tenshi:
 * - Skills con scope: 'tenshi'
 * - Skills sin scope definido (scope: 'all')
 * Excluye las skills con scope: 'agents'
 */
router.get('/skills', async (req, res) => {
  const fs = require('fs');
  const path = require('path');
  const yaml = require('js-yaml');
  const SKILLS_DIR = path.join(__dirname, '../../config/skills');

  if (!fs.existsSync(SKILLS_DIR)) {
    return res.json([]);
  }

  try {
    const files = fs.readdirSync(SKILLS_DIR);
    const skills = [];
    for (const file of files) {
      if (file.endsWith('.md')) {
        const content = fs.readFileSync(path.join(SKILLS_DIR, file), 'utf8');
        const match = content.match(/^---([\s\S]*?)---([\s\S]*)$/);
        if (match) {
          try {
            const frontmatter = yaml.load(match[1]);
            const scope = frontmatter.scope || 'all';
            // Exclude skills scoped exclusively to agents chat panel
            if (scope === 'agents') continue;
            skills.push({
              id: file.replace('.md', ''),
              name: frontmatter.name || file.replace('.md', ''),
              description: frontmatter.description || '',
              triggers: frontmatter.triggers || [],
              scope,
            });
          } catch (e) {
            // ignore
          }
        }
      }
    }
    res.json(skills);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
