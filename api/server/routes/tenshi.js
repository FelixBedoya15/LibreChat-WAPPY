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
const { generateShortLivedToken, Tokenizer } = require('@librechat/api');
const { getAllUserMemories, setMemory, deleteMemory } = require('~/models');
const CompanyInfo = require('../../models/CompanyInfo');
const { syncCompanyMemory } = require('./sgsst/companyInfo');
const SomosSST = require('../../app/clients/tools/structured/SomosSST');
const GoogleDrive = require('../../app/clients/tools/structured/GoogleDrive');
const ConsultarAgenteEspecializado = require('../../app/clients/tools/structured/ConsultarAgenteEspecializado');
const CanvasTool = require('../../app/clients/tools/structured/CanvasTool');
const { getActiveSkillInstructions, getActiveSkillsData } = require('~/server/services/skillRouter');
const { resolveApiKeys } = require('./sgsst/sgsstGemini');
const { executeTenshiMcpTool, TOOL_ROUTES } = require('./voice/tenshiMcpDispatcher');

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
        const targetUserId = (req.user?.isSubUser && req.user?.parentUser) ? String(req.user.parentUser) : String(req.user?.id || req.user?._id);
        const userIds = [req.user.id, targetUserId].filter(Boolean);
        const history = await TenshiMessage.find({ user: { $in: userIds } }).sort({ createdAt: 1 }).lean();
        res.json(history.map(m => ({
            _id: m._id,
            role: m.role,
            content: m.content,
            htmlReport: m.htmlReport,
            file: m.file,
            createdAt: m.createdAt,
        })));
    } catch (error) {
        console.error('Error fetching Tenshi history:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.post('/message', requireJwtAuth, async (req, res) => {
    try {
        const { role = 'assistant', content, htmlReport, file } = req.body;
        if (!content || !content.trim()) {
            return res.status(400).json({ error: 'Content is required' });
        }
        const newMsg = await TenshiMessage.create({
            user: req.user.id,
            role,
            content: content.trim(),
            htmlReport,
            file,
        });
        res.json(newMsg);
    } catch (error) {
        console.error('Error creating Tenshi message:', error);
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

        const targetUserId = (req.user?.isSubUser && req.user?.parentUser) ? String(req.user.parentUser) : String(req.user?.id || req.user?._id);
        if (!req.body.conversationId) {
            req.body.conversationId = `tenshi-${targetUserId}`;
        }

        // Fetch dynamic knowledge concurrently via Promise.all for maximum response speed
        const [latestBlogs, latestCourses, ticketContext, companyInfo, rawMemories, recentConvos] = await Promise.all([
            BlogPost.find({ isPublished: true }).sort({ createdAt: -1 }).limit(3).lean().catch(() => []),
            Course.find({ isPublished: true }).sort({ createdAt: -1 }).limit(2).lean().catch(() => []),
            getRelevantTickets(req, userQuery).catch(() => ''),
            (async () => {
                let info = null;
                if (req.user?.isSubUser && req.user?.assignedCompany) {
                    info = await CompanyInfo.findOne({ _id: req.user.assignedCompany, user: targetUserId }).lean().catch(() => null);
                }
                if (!info) {
                    info = await CompanyInfo.findOne({ user: targetUserId, isActive: true }).lean().catch(() => null);
                }
                if (!info) {
                    info = await CompanyInfo.findOne({ user: targetUserId }).lean().catch(() => null);
                }
                return info;
            })(),
            (async () => {
                try {
                    const { Conversation, Message } = require('~/db/models');
                    const userFilter = [String(req.user.id), targetUserId].filter(Boolean);
                    const convos = await Conversation.find({ user: { $in: userFilter } })
                        .sort({ updatedAt: -1 })
                        .limit(3)
                        .select('conversationId title updatedAt agent_id')
                        .lean();

                    if (!convos || convos.length === 0) return [];

                    return await Promise.all(
                        convos.map(async (c) => {
                            const msgs = await Message.find({ conversationId: c.conversationId })
                                .sort({ createdAt: -1 })
                                .limit(2)
                                .select('text sender isCreatedByUser')
                                .lean()
                                .catch(() => []);
                            return {
                                title: c.title || 'Consulta técnica',
                                messages: msgs.reverse(),
                            };
                        })
                    );
                } catch (e) {
                    return [];
                }
            })()
        ]);

        const blogStr = latestBlogs.map(b => `- BLOG: ${b.title}`).join('\n');
        const courseStr = latestCourses.map(c => `- CURSO: ${c.title}`).join('\n');
        const manualContent = getPlatformManual();

        const isMemoryEnabled = req.user?.personalization?.memories !== false;

        let fullCompanyAndMemoryBlock = '';
        if (isMemoryEnabled) {
            if (companyInfo) {
                const companyType = companyInfo.companyType || 'Persona Jurídica';
                const nitLabel = companyType === 'Persona Natural' ? 'Cédula de Ciudadanía' : 'NIT';
                let sedesStr = '';
                if (companyInfo.sedes && Array.isArray(companyInfo.sedes) && companyInfo.sedes.length > 0) {
                    sedesStr = '\n  * Sedes Adicionales:\n' + companyInfo.sedes.map(s => `    - Sede: ${s.nombre || 'N/A'} (Ciudad: ${s.city || 'N/A'}, Depto: ${s.departamento || 'N/A'}, Dirección: ${s.address || 'N/A'}, Actividades: ${s.generalActivities || 'N/A'})`).join('\n');
                }
                fullCompanyAndMemoryBlock += `### 🏢 INFORMACIÓN DE LA EMPRESA ACTIVA DEL USUARIO (DATOS OFICIALES SG-SST):\n` +
                    `- Razón Social / Nombre: ${companyInfo.companyName || 'N/A'}\n` +
                    `- Tipo de Empresa: ${companyType}\n` +
                    `- ${nitLabel}: ${companyInfo.nit || 'N/A'}\n` +
                    `- Representante Legal: ${companyInfo.legalRepresentative || 'N/A'}` + (companyInfo.legalRepresentativeId ? ` (Cédula: ${companyInfo.legalRepresentativeId})` : '') + `\n` +
                    `- Número de Trabajadores: ${companyInfo.workerCount ?? 'N/A'}\n` +
                    `- ARL: ${companyInfo.arl || 'N/A'} (Nivel de Riesgo ARL: ${companyInfo.riskLevel || 'N/A'})\n` +
                    `- Actividad Económica: ${companyInfo.economicActivity || 'N/A'}\n` +
                    `- Código CIIU: ${companyInfo.ciiu || 'N/A'}\n` +
                    `- Sector: ${companyInfo.sector || 'N/A'}\n` +
                    `- Ubicación Sede Principal: ${companyInfo.address || 'N/A'} (Ciudad: ${companyInfo.city || 'N/A'}, Departamento: ${companyInfo.departamento || 'N/A'})\n` +
                    `- Responsable SG-SST: ${companyInfo.responsibleSST || 'N/A'}` + (companyInfo.licenseNumber ? ` (Licencia SST: ${companyInfo.licenseNumber}, Vigencia: ${companyInfo.licenseExpiry || 'N/A'})` : '') + `\n` +
                    `- Nivel de Formación SST: ${companyInfo.formationLevel || 'N/A'}\n` +
                    `- Estado Curso 50/20H: ${companyInfo.courseStatus || 'N/A'}\n` +
                    `- Descripción General de Actividades: ${companyInfo.generalActivities || 'N/A'}` +
                    (sedesStr ? `${sedesStr}\n\n` : '\n\n');
            } else {
                fullCompanyAndMemoryBlock += `### 🏢 INFORMACIÓN DE LA EMPRESA ACTIVA:\nNo se ha registrado una empresa en el Gestor SG-SST aún.\n\n`;
            }

            // Deduplicate user memories by key (most recent first)
            const uniqueMemMap = new Map();
            if (Array.isArray(rawMemories)) {
                const sorted = [...rawMemories].sort((a, b) => new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime());
                for (const m of sorted) {
                    if (m.key && !uniqueMemMap.has(m.key)) {
                        uniqueMemMap.set(m.key, m.value);
                    }
                }
            }

            if (uniqueMemMap.size > 0) {
                fullCompanyAndMemoryBlock += `### 🧠 MEMORIAS REGISTRADAS DEL USUARIO (BASE DE CONOCIMIENTO PERMANENTE / MEMORIA WAPPY):\n`;
                for (const [k, v] of uniqueMemMap.entries()) {
                    fullCompanyAndMemoryBlock += `📌 [${k}]:\n${v}\n\n`;
                }
            }

            fullCompanyAndMemoryBlock += `### ⚡ REGLA DE ORO DE CONOCIMIENTO CORPORATIVO Y MEMORIA:
- TIENES ACCESO PLENO E INMEDIATO a toda la información de la empresa activa y a la memoria del usuario descritas arriba.
- Conoces de antemano la Razón Social, NIT, Representante Legal, Trabajadores, ARL, Sedes, Macroprocesos y datos de la memoria.
- NUNCA digas "no tengo acceso a la empresa", "no sé qué empresa está activa" ni le pidas al usuario que repita datos que ya están en esta ficha o memoria. Úsalos con total familiaridad y exactitud en todas tus respuestas.`;
        }

        let recentConvosBlock = '';
        if (recentConvos && recentConvos.length > 0) {
            recentConvosBlock = `### 💬 ACTIVIDAD RECIENTE Y CONSULTAS CON ESPECIALISTAS EN WAPPY:\n`;
            for (const c of recentConvos) {
                if (!c.messages || c.messages.length === 0) continue;
                recentConvosBlock += `\n- Consulta: "${c.title}":\n`;
                for (const m of c.messages) {
                    const sender = m.isCreatedByUser ? 'Usuario' : (m.sender || 'Especialista');
                    const maxLen = m.isCreatedByUser ? 300 : 3500;
                    const snippet = text.length > maxLen ? text.substring(0, maxLen) + '...' : text;
                    if (snippet) {
                        recentConvosBlock += `  * ${sender}: "${snippet}"\n`;
                    }
                }
            }
            recentConvosBlock += `\n*REGLA DE CONTINUIDAD Y MEMORIA*: Tienes pleno conocimiento de estas consultas previas con los especialistas. Si el usuario te pregunta por lo que se habló o se consultó previamente (ej: batería de riesgo psicosocial, matriz de compatibilidad, etc.), respóndele con este contexto exacto.\n\n`;
        }

        const skillsList = (config.skills && config.skills.length > 0) ? config.skills : ['*'];
        const { instructions: skillInstructions, activeTools, activeSkillNames } = getActiveSkillsData(userQuery, skillsList);
        logger.info(`[Tenshi Skill Router] Skills activadas por trigger: ${activeSkillNames.join(', ') || 'ninguna'}, herramientas dinámicas: ${activeTools.join(', ') || 'ninguna'}`);

        let systemMessage = `${config.systemPrompt}

Hola, estás conversando con el usuario: ${req.user.name || req.user.username || 'Usuario'}

MANUAL DE FUNCIONAMIENTO DE WAPPY IA:
${manualContent}

${blogStr ? `ÚLTIMAS PUBLICACIONES DEL BLOG:\n${blogStr}\n` : ''}
${courseStr ? `CURSOS DE FORMACIÓN DISPONIBLES:\n${courseStr}\n` : ''}
${ticketContext ? `CONOCIMIENTO DINÁMICO (Contexto extraído por RAG):\n${ticketContext}\n` : ''}
${fullCompanyAndMemoryBlock}
${recentConvosBlock}

### 🎯 ROL Y PERSONALIDAD DE TENSHI
Eres Tenshi, la IA estrella, guía oficial y orquestadora de WAPPY IA. Administras la plataforma central Somos SST (ubicada en /sgsst). Tu personalidad es alegre, carismática, empática, muy espontánea y respetuosa, utilizando modismos paisas colombianos naturales ("parce", "listo", "qué más pues", "bacano", "de una", "hágale").

### ⚡ DIRECTIVAS CRÍTICAS DE VELOCIDAD Y HERRAMIENTAS:
1. **RESPUESTAS INMEDIATAS A PREGUNTAS TEÓRICAS/CONCEPTUALES**: Si el usuario te hace preguntas conceptuales, definiciones teóricas (ej: "¿qué es SST?", "¿qué es un ATS?", "¿cuáles son las obligaciones del empleador?"), saludos o preguntas generales, RESPONDE DIRECTAMENTE EN TEXTO en 1 solo turno de forma concisa y alegre. ¡ESTÁ PROHIBIDO invocar herramientas como 'somos_sst' o 'resumen_empresa' para responder preguntas teóricas!
2. **USO DE HERRAMIENTAS EXCLUSIVAMENTE CUANDO SE SOLICITE**: Ejecuta 'somos_sst', 'google_drive', 'consultar_agente_especializado' o 'canvas_tool' ÚNICAMENTE cuando el usuario te pida consultar datos reales guardados de su empresa/trabajadores, explorar su Google Drive, crear actividades en el Centro de Control ACPM o generar un informe formal HTML.
3. **GENERACIÓN DE INFORMES**: Si el usuario te pide un informe o reporte formal, usa 'somos_sst' con 'generar_informe_html', y en tu respuesta da un resumen de 2 viñetas e indícale que use el botón para descargarlo.
4. **GOOGLE DRIVE, INFORMACIÓN DE EMPRESA Y COBERTURA TOTAL DE SOMOS SST**:
   - Tienes acceso nativo a 'google_drive' ('list_files_and_folders', 'read_document_content') para navegar carpetas y leer documentos (RUT, Cámara de Comercio, planillas, matrices GTC45, FDS químicas, etc.).
   - Si lees documentos con datos de la empresa (RUT, cámara de comercio, actas), debes llamar a 'somos_sst' con 'actualizar_informacion_empresa' para autocompletar la Razón Social, NIT, Tipo de Empresa, Representante Legal, ARL, Nivel de Riesgo, CIIU, Dirección, etc.
   - Tienes control y acceso sobre la totalidad de los 34 aplicativos de Somos SST: Perfiles de Cargo ('cargos'), Estudio de Puesto de Trabajo ('estudio_puesto'), Auditoría Interna ('auditoria'), Diagnóstico Res. 0312 ('diagnostico'), Matriz GTC-45 / IPEVAR, PESV, Químicos SGA, Alturas, ATS, EPP, Capacitaciones, Reglamentos RIT/RHS, etc., pudiendo actualizarlos con 'editar_cualquier_aplicativo' y disparar tareas con 'crear_actividad_acpm'.
5. **GESTIÓN DIRECTA DE COLABORADORES Y NÓMINA SG-SST (HUELLA BIOCÉNTRICA)**:
   - TIENES HERRAMIENTAS DIRECTAS PARA CONTROL TOTAL DE COLABORADORES:
     * 'wappy_reintegrar_trabajador': Cuando el usuario te pida reintegrar, reactivar, volver a contratar, reincorporar o pasar a activo a un trabajador previamente retirado (ej: "reintegrar al trabajador Jorge Enrique Pineda" o "reactivar a Jorge Pineda"), INVOCA DE INMEDIATO 'wappy_reintegrar_trabajador' con su nombre o cédula. El sistema restaurará su estado laboral a 'Activo' en la base de datos y refrescará la plataforma.
     * ESTÁ TERMINANTEMENTE PROHIBIDO afirmar que ya reintegraste a un colaborador sin antes invocar 'wappy_reintegrar_trabajador'.
     * 'wappy_retirar_trabajador': Cuando el usuario te pida retirar, desvincular, dar de baja o sacar a un trabajador (ej: "dejar como retirado a Jorge Ricky Pineda" o "retirar a Jorge Pineda"), INVOCA DE INMEDIATO 'wappy_retirar_trabajador' con su nombre o cédula. El sistema conservará su historial médico y ocupacional de 20 años y lo trasladará a la pestaña 'Retirados'.
     * ESTÁ TERMINANTEMENTE PROHIBIDO decir que no tienes una función para cambiar el estado de un colaborador a 'retirado'. ¡TIENES la función 'wappy_retirar_trabajador'!
     * 'wappy_actualizar_trabajador': Para editar cargos, salarios, áreas, sedes o estado de un trabajador.
     * 'wappy_consultar_trabajadores': Para buscar trabajadores o consultar nómina (activos, retirados, o todos).
     * 'wappy_registrar_trabajador': Para dar de alta a un nuevo colaborador en el SG-SST.
6. **CONTROL TOTAL DE LA PLATAFORMA MEDIANTE CLICS Y OPERACIÓN VISUAL ('operar_interfaz_visual')**:
   - Puedes hacer clic en CUALQUIER BOTÓN, pestaña, menú o tarjeta de todos los aplicativos (ej: pestañas 'Retirados', 'Activos', 'Todos', botones '+ Agregar Trabajador', 'Guardar Localmente', 'Descargar', etc.) usando 'operar_interfaz_visual' indicando el índice [índice] o el texto/nombre del botón.
7. **SUITE COMPLETA DE 41 OPERACIONES MCP DEL SG-SST ('wappy_mcp_sst' y 'wappy_resumen_general_360')**:
   - Cuentas con acceso integral a las 41 operaciones MCP para consultar y alimentar: Diagnóstico 360°, Empresa, Matriz GTC-45, Matriz PESV, Matriz Legal, Estándares 0312, Comités (COPASST, Convivencia, Brigadas), Químicos SGA, Vehículos, EPP, Reportes de Actos y Condiciones, Perfiles de Cargo, Casos ATEL, Cronograma y Tareas, Capacitaciones, Auditorías y Automatizaciones.`;

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
                const clientTenshiKey = req.body?.tenshiKey || req.headers?.['x-tenshi-key'];
                if (clientTenshiKey) {
                    apiKeys = clientTenshiKey.split(',').map(k => k.trim()).filter(Boolean);
                }
            }

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
                'gemini-3.6-flash',
                'gemini-3.5-flash',
                'gemini-3.5-flash-lite'
            ].filter(Boolean);
            const modelFallbacks = [...new Set(candidateModels)];

            // Build history once (reusable across all retries) con ventana deslizante de los últimos 16 mensajes
            // para evitar saturación de contexto, envenenamiento y alucinaciones en conversaciones largas
            const rawHistory = messages.length > 16 ? messages.slice(-16, -1) : messages.slice(0, -1);
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

            // Base function declarations (always available to Tenshi)
            const somosSSTDeclaration = {
                name: 'somos_sst',
                description: 'Herramienta oficial de SOMOS SST (anteriormente SGSST). Permite consultar y editar cualquier información en sus 2 MÓDULOS PRINCIPALES: el Motor Bio-Individual (Bio Motor - expediente del trabajador, exámenes médicos, accidentes ATEL, Hitos) y el Ecosistema SG-SST General (matrices GTC45, EPP, alturas, ATS, capacitaciones, políticas, Centro de Control ACPM y estadísticas en tiempo real).',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        accion: {
                            type: 'STRING',
                            description: 'La acción a ejecutar: actualizar_informacion_empresa, consultar_expediente_integral, listar_trabajadores, resumen_empresa, actualizar_examen_medico, registrar_accidente_atel, actualizar_hito_tarea, editar_cualquier_aplicativo, generar_informe_html, consultar_historial_informes, consultar_planes_y_sistema, consultar_centro_control_acpm, crear_actividad_acpm, actualizar_actividad_acpm, crear_trabajador, retirar_trabajador, actualizar_trabajador, eliminar_trabajador.'
                        },
                        razon_social: { type: 'STRING', description: 'Razón Social o Nombre legal de la empresa' },
                        tipo_empresa: { type: 'STRING', description: '"Persona Jurídica" o "Persona Natural"' },
                        nit: { type: 'STRING', description: 'Número de Identificación Tributaria (NIT)' },
                        representante_legal: { type: 'STRING', description: 'Nombre del Representante Legal' },
                        cedula_representante: { type: 'STRING', description: 'Cédula o ID del Representante Legal' },
                        numero_trabajadores: { type: 'NUMBER', description: 'Número de trabajadores' },
                        arl: { type: 'STRING', description: 'Nombre de la Administradora de Riesgos Laborales (ARL)' },
                        actividad_economica: { type: 'STRING', description: 'Actividad económica principal' },
                        nivel_riesgo: { type: 'STRING', description: 'Nivel de riesgo ARL (I, II, III, IV, V)' },
                        ciiu: { type: 'STRING', description: 'Código CIIU' },
                        direccion: { type: 'STRING', description: 'Dirección física de la sede principal' },
                        ciudad: { type: 'STRING', description: 'Ciudad o municipio' },
                        departamento: { type: 'STRING', description: 'Departamento' },
                        telefono: { type: 'STRING', description: 'Teléfono de contacto' },
                        correo: { type: 'STRING', description: 'Correo electrónico corporativo' },
                        datos_json: { type: 'STRING', description: 'Datos estructurados en formato JSON o string para guardado masivo' },
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
                        nombre_aplicativo: { 
                            type: 'STRING',
                            description: 'Nombre del aplicativo a editar: "empresa", "cargos" (perfiles de cargo), "estudio_puesto" (EPT), "auditoria", "diagnostico", "epp", "alturas", "ats", "vehiculos", "capacitaciones", "gtc45", "owas", "actos", "vulnerabilidad", "quimicos", "kanban", "politica", "matriz_legal", "rhs", "rit", "estadisticas".'
                        },
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

            const googleDriveDeclaration = {
                name: 'google_drive',
                description: 'Permite interactuar con Google Drive del usuario: buscar archivos y carpetas, leer el contenido de documentos (PDFs, Word .docx, Excel .xlsx/.xls, Google Docs, Google Sheets) y crear o actualizar documentos.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        action: {
                            type: 'STRING',
                            description: 'La acción a realizar: "list_files_and_folders", "read_document_content", "create_folder", "write_file".'
                        },
                        query: {
                            type: 'STRING',
                            description: 'Término de búsqueda para listar archivos (nombre, palabra clave) o el texto a escribir.'
                        },
                        fileId: {
                            type: 'STRING',
                            description: 'El ID del archivo o carpeta para leer o actualizar.'
                        },
                        fileName: {
                            type: 'STRING',
                            description: 'El nombre del archivo o carpeta que deseas crear.'
                        },
                        parentId: {
                            type: 'STRING',
                            description: 'El ID de la carpeta contenedora en Google Drive (opcional).'
                        }
                    },
                    required: ['action']
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

            const diligenciarFormularioDeclaration = {
                name: 'wappy_diligenciar_formulario',
                description: 'Diligenciar Formulario: Autocompleta o redacta automáticamente campos de un formulario o aplicativo en pantalla (Investigación ATEL, PESV, Alturas, Reporte de Actos, etc.) con datos estructurados.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        modulo: {
                            type: 'STRING',
                            description: 'Nombre del aplicativo o formulario (ej: "investigacion_atel", "vehicles_pesv", "permiso_alturas", "reporte_actos").'
                        },
                        campos: {
                            type: 'OBJECT',
                            description: 'Objeto clave-valor con los campos y sus datos a rellenar en el formulario.'
                        },
                        accion: {
                            type: 'STRING',
                            description: 'Acción a realizar: "llenar", "guardar" o "generar_ia".'
                        }
                    },
                    required: ['modulo', 'campos']
                }
            };

            const seleccionarEmpresaDeclaration = {
                name: 'seleccionar_empresa',
                description: 'Permite cambiar o activar la empresa en uso en la plataforma WAPPY por su nombre, NIT o ID. Si el usuario te pide cambiar de empresa o activar otra empresa, invoca esta función.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        nombre_o_id: {
                            type: 'STRING',
                            description: 'Nombre de la empresa, NIT o ID a seleccionar y activar.'
                        }
                    },
                    required: ['nombre_o_id']
                }
            };

            const gestionarMemoriaDeclaration = {
                name: 'gestionar_memoria',
                description: 'Permite consultar, guardar o eliminar datos clave en la memoria permanente del usuario (como datos de la empresa, procesos, notas importantes, directrices). Úsala si el usuario te pide guardar o recordar un dato en su memoria.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        accion: {
                            type: 'STRING',
                            description: 'Acción a realizar: "consultar", "guardar" o "eliminar".'
                        },
                        clave: {
                            type: 'STRING',
                            description: 'Clave o tema de la memoria (ej: "empresa_activa", "macroprocesos", "nota", etc.).'
                        },
                        valor: {
                            type: 'STRING',
                            description: 'Contenido a guardar cuando la acción sea "guardar".'
                        }
                    },
                    required: ['accion']
                }
            };

            const leerPantallaDeclaration = {
                name: 'leer_pantalla',
                description: 'Lee e inspecciona el texto, tablas, registros, tarjetas e informes que están visibles en la pantalla actual del usuario. Úsala siempre que el usuario te pida leerle lo que hay en pantalla, leerle un informe reciente o revisar los datos visibles de un aplicativo.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        seccion: {
                            type: 'STRING',
                            description: 'Sección o informe específico a leer (opcional: "informe", "tabla", "formulario", "todo").'
                        }
                    }
                }
            };

            const wappyNavegarDeclaration = {
                name: 'wappy_navegar',
                description: 'Navega de inmediato a cualquier módulo, hito, pantalla o aplicativo de la plataforma WAPPY y Somos SST. DEBES invocar esta función siempre que el usuario te pida ir, ver, abrir o consultar una sección o hito.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        modulo: {
                            type: 'STRING',
                            description: "Nombre clave del módulo, hito o aplicativo. Hitos 1 al 8: 'diagnostico' (0312), 'participacion_ipevar', 'matriz_ipevar_oficial', 'matriz_pesv_oficial', 'matriz_compatibilidad_oficial', 'vulnerabilidad', 'plan_emergencias', 'responsable', 'politica', 'objetivos', 'legal', 'rhs', 'rit', 'perfil_cargo', 'perfil_socio', 'condiciones_salud', 'copasst', 'cocolab', 'comite_pesv', 'brigada_emergencias', 'animo', 'metodo_owas', 'estudio_puesto', 'peligros', 'permiso_alturas', 'analisis_trabajo_seguro', 'epp_delivery', 'vehicles_pesv', 'heights_lifecycle', 'chemical_registry', 'equipos_emergencia', 'reporte_actos', 'capacitaciones', 'simulacros_emergencia', 'ruta_aprendizaje', 'app_builder', 'estadisticas', 'investigacion_atel', 'control_acpm', 'auditoria', 'alta_direccion', 'investigacion_profunda', 'predictivo'. Aplicativos y Dashboards: 'sgsst', 'planes', 'academia', 'training_admin', 'rutas', 'ruta_admin', 'blog', 'blog_admin', 'events_meet', 'events_meet_admin', 'marketplace' (/marketplace tienda productos SST), 'marketplace_admin', 'agents' (/agents catálogo especialistas IA), 'control' (Kanban), 'animo_dashboard', 'live' (/c/new), 'chat_sst', 'roadmap', 'contactanos', 'comunidad', 'matriz', 'embajadores', 'embajadores_dashboard', 'tenshi_admin', 'search', 'privacy', 'terms', 'about'. Portales públicos: 'public_reportar', 'public_animo', 'public_estudio_puesto', 'public_ipevar', 'public_alta_direccion', 'public_atel', 'public_colaborador', 'public_comites', 'public_convivencia', 'public_votaciones', 'public_inspecciones', 'public_brigadistas'."
                        },
                        ruta: {
                            type: 'STRING',
                            description: 'Ruta URL interna exacta (opcional).'
                        }
                    },
                    required: ['modulo']
                }
            };

            // Dynamic function declarations (activated via Skill Triggers based on user intent)
            const matrizIPEVARDeclaration = {
                name: 'matriz_ipevar',
                description: 'Lee, añade, evalúa o actualiza riesgos laborales directamente en la Matriz GTC-45 de la conversación actual. Usa esta herramienta para leer, documentar o evaluar peligros en la matriz IPEVR / GTC-45.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        accion: { type: 'STRING', description: 'consultar_contexto_sgsst, leer, escribir, borrar' },
                        filtro_proceso: { type: 'STRING', description: 'Filtro por proceso o cargo.' },
                        filtro_cargo: { type: 'STRING', description: 'Filtro por cargo.' },
                        filtro_actividad: { type: 'STRING', description: 'Filtro por actividad.' },
                        filtro_peligro: { type: 'STRING', description: 'Filtro por peligro.' },
                        ids_a_borrar: { type: 'ARRAY', items: { type: 'STRING' }, description: 'IDs de riesgos a eliminar cuando accion="borrar".' },
                        riesgos: {
                            type: 'ARRAY',
                            items: {
                                type: 'OBJECT',
                                properties: {
                                    cargo: { type: 'STRING' },
                                    proceso: { type: 'STRING' },
                                    zona: { type: 'STRING' },
                                    actividad: { type: 'STRING' },
                                    tareas: { type: 'STRING' },
                                    rutinaria: { type: 'STRING', description: 'Sí o No' },
                                    peligro_descripcion: { type: 'STRING' },
                                    peligro_clasificacion: { type: 'STRING' },
                                    efectos_posibles: { type: 'STRING' },
                                    controles_fuente: { type: 'STRING' },
                                    controles_medio: { type: 'STRING' },
                                    controles_individuo: { type: 'STRING' },
                                    nd: { type: 'NUMBER' },
                                    ne: { type: 'NUMBER' },
                                    nc: { type: 'NUMBER' },
                                    medida_eliminacion: { type: 'STRING' },
                                    medida_sustitucion: { type: 'STRING' },
                                    medida_ingenieria: { type: 'STRING' },
                                    medida_administrativa: { type: 'STRING' },
                                    medida_eppu: { type: 'STRING' },
                                    factores_reduccion: { type: 'STRING' },
                                    nd_cualitativo: { type: 'NUMBER' },
                                    nro_expuestos: { type: 'NUMBER' },
                                    peor_consecuencia: { type: 'STRING' },
                                    requisito_legal: { type: 'STRING' }
                                },
                                required: ['proceso', 'zona', 'actividad', 'tareas', 'rutinaria', 'peligro_descripcion', 'peligro_clasificacion', 'efectos_posibles', 'nd', 'ne', 'nc']
                            },
                            description: 'Lista de riesgos a registrar cuando accion="escribir".'
                        }
                    },
                    required: ['accion']
                }
            };

            const matrizPESVDeclaration = {
                name: 'matriz_pesv',
                description: 'Lee, añade, evalúa o actualiza riesgos viales en la Matriz PESV (Plan Estratégico de Seguridad Vial - Res. 20223040040595).',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        accion: { type: 'STRING', description: 'consultar_contexto_sgsst, leer, escribir, borrar' },
                        filtro_proceso: { type: 'STRING' },
                        filtro_cargo: { type: 'STRING' },
                        filtro_actor_vial: { type: 'STRING' },
                        filtro_peligro: { type: 'STRING' },
                        ids_a_borrar: { type: 'ARRAY', items: { type: 'STRING' } },
                        riesgos: {
                            type: 'ARRAY',
                            items: {
                                type: 'OBJECT',
                                properties: {
                                    grupo_trabajo: { type: 'STRING' },
                                    cargo: { type: 'STRING' },
                                    tipo_desplazamiento: { type: 'STRING' },
                                    rol_via: { type: 'STRING' },
                                    factor_riesgo: { type: 'STRING' },
                                    peligro_descripcion: { type: 'STRING' },
                                    np_cualitativo: { type: 'STRING' },
                                    ne_cualitativo: { type: 'STRING' },
                                    nc_cualitativo: { type: 'STRING' },
                                    controles_existentes_descripcion: { type: 'STRING' },
                                    controles_existentes_tipo: { type: 'STRING' },
                                    tratamiento_accion: { type: 'STRING' },
                                    plan_accion_medio: { type: 'STRING' },
                                    plan_accion_vehiculo: { type: 'STRING' },
                                    plan_accion_individuo: { type: 'STRING' },
                                    plan_accion_infraestructura: { type: 'STRING' },
                                    responsable: { type: 'STRING' },
                                    fecha_programacion: { type: 'STRING' },
                                    estado: { type: 'STRING' },
                                    observaciones: { type: 'STRING' }
                                },
                                required: ['grupo_trabajo', 'cargo', 'tipo_desplazamiento', 'rol_via', 'factor_riesgo', 'peligro_descripcion', 'np_cualitativo', 'ne_cualitativo', 'nc_cualitativo']
                            },
                            description: 'Lista de riesgos viales a registrar cuando accion="escribir".'
                        }
                    },
                    required: ['accion']
                }
            };

            const matrizCompatibilidadDeclaration = {
                name: 'matriz_compatibilidad',
                description: 'Lee, añade, evalúa o actualiza inventarios de productos químicos en la Matriz de Compatibilidad y Almacenamiento Seguro SGA.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        accion: { type: 'STRING', description: 'consultar_contexto_sgsst, leer, escribir, borrar' },
                        filtro_nombre: { type: 'STRING' },
                        filtro_ubicacion: { type: 'STRING' },
                        filtro_clase: { type: 'STRING' },
                        ids_a_borrar: { type: 'ARRAY', items: { type: 'STRING' } },
                        productos: {
                            type: 'ARRAY',
                            items: {
                                type: 'OBJECT',
                                properties: {
                                    nombre: { type: 'STRING' },
                                    fabricante: { type: 'STRING' },
                                    estado_fisico: { type: 'STRING' },
                                    clasificacion_onu: { type: 'STRING' },
                                    pictogramas_sga: { type: 'ARRAY', items: { type: 'STRING' } },
                                    cantidad_almacenada: { type: 'STRING' },
                                    ubicacion: { type: 'STRING' },
                                    tiene_fds: { type: 'STRING' },
                                    tiene_rotulo: { type: 'STRING' },
                                    incompatibilidades: { type: 'STRING' },
                                    requisitos_almacenamiento: { type: 'STRING' }
                                },
                                required: ['nombre', 'clasificacion_onu']
                            },
                            description: 'Lista de sustancias químicas a registrar cuando accion="escribir".'
                        }
                    },
                    required: ['accion']
                }
            };

            const gestorAutomatizacionesDeclaration = {
                name: 'gestor_automatizaciones',
                description: 'Crea, lista, actualiza, ejecuta o elimina automatizaciones de tareas periódicas en segundo plano (/sgsst/automatizaciones).',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        accion: { type: 'STRING', description: 'crear, listar, actualizar, eliminar, ejecutar_ahora, ver_logs' },
                        nombre: { type: 'STRING', description: 'Nombre claro de la automatización.' },
                        agente_objetivo: { type: 'STRING', description: 'Agente que ejecutará la tarea periódica.' },
                        prompt_a_ejecutar: { type: 'STRING', description: 'Instrucción detallada a ejecutar periódicamente.' },
                        tipo_frecuencia: { type: 'STRING', description: 'daily, weekly, monthly, hourly' },
                        configuracion_horario: {
                            type: 'OBJECT',
                            properties: {
                                hora: { type: 'NUMBER' },
                                minuto: { type: 'NUMBER' },
                                dias_semana: { type: 'ARRAY', items: { type: 'NUMBER' } },
                                dia_mes: { type: 'NUMBER' },
                                intervalo_horas: { type: 'NUMBER' }
                            }
                        },
                        correos_notificacion: { type: 'ARRAY', items: { type: 'STRING' } },
                        automatizacion_id: { type: 'STRING', description: 'ID de la automatización para actualizar/eliminar/ejecutar.' },
                        nuevo_estado: { type: 'STRING', description: 'active o inactive' }
                    },
                    required: ['accion']
                }
            };

            const googleSheetsDeclaration = {
                name: 'google_sheets',
                description: 'Interactúa con Google Sheets: crea hojas de cálculo, lee rangos de celdas, actualiza valores, añade filas y aplica formatos.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        action: { type: 'STRING', description: 'create_spreadsheet, read_spreadsheet, update_spreadsheet_values, append_spreadsheet_values, format_spreadsheet' },
                        spreadsheetId: { type: 'STRING', description: 'ID de la hoja de cálculo de Google.' },
                        title: { type: 'STRING', description: 'Título de la hoja a crear.' },
                        range: { type: 'STRING', description: 'Rango A1 (ej: "Sheet1!A1:D10").' },
                        values: {
                            type: 'ARRAY',
                            items: { type: 'ARRAY', items: { type: 'STRING' } },
                            description: 'Matriz bidimensional de datos a escribir o añadir.'
                        },
                        sheetId: { type: 'NUMBER', description: 'ID numérico de la pestaña.' },
                        headerColorHex: { type: 'STRING', description: 'Color hex de cabecera.' }
                    },
                    required: ['action']
                }
            };

            const googleDocsDeclaration = {
                name: 'google_docs',
                description: 'Interactúa con Google Docs: crea nuevos documentos, lee su texto completo, sobrescribe o añade contenido al final.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        action: { type: 'STRING', description: 'create_document, read_document, write_to_document, append_to_document' },
                        documentId: { type: 'STRING', description: 'ID del documento de Google.' },
                        title: { type: 'STRING', description: 'Título del documento a crear.' },
                        text: { type: 'STRING', description: 'Contenido de texto o Markdown a redactar.' }
                    },
                    required: ['action']
                }
            };

            const googleSlidesDeclaration = {
                name: 'google_slides',
                description: 'Interactúa con Google Slides: crea presentaciones ejecutivas, añade diapositivas y lee la estructura.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        action: { type: 'STRING', description: 'create_presentation, add_slide, read_presentation' },
                        presentationId: { type: 'STRING', description: 'ID de la presentación de Google Slides.' },
                        title: { type: 'STRING', description: 'Título de la presentación o diapositiva.' },
                        bodyText: { type: 'STRING', description: 'Texto del cuerpo de la diapositiva.' },
                        slideLayout: { type: 'STRING', description: 'TITLE_AND_BODY, TITLE, SECTION_HEADER, BLANK' },
                        slideType: { type: 'STRING', description: 'TITLE_SLIDE o CONTENT_SLIDE' }
                    },
                    required: ['action']
                }
            };

            const googleGmailDeclaration = {
                name: 'google_gmail',
                description: 'Envía correos electrónicos o crea borradores en Gmail desde la cuenta del usuario.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        action: { type: 'STRING', description: 'send_email o create_draft' },
                        to: { type: 'STRING', description: 'Dirección de correo electrónico del destinatario.' },
                        subject: { type: 'STRING', description: 'Asunto del correo electrónico.' },
                        body: { type: 'STRING', description: 'Contenido del mensaje (HTML o texto).' },
                        cc: { type: 'STRING', description: 'Correos en copia.' },
                        bcc: { type: 'STRING', description: 'Correos en copia oculta.' }
                    },
                    required: ['action', 'to', 'subject', 'body']
                }
            };

            const googleCalendarDeclaration = {
                name: 'google_calendar',
                description: 'Interactúa con Google Calendar: crea eventos/recordatorios, lista eventos por fecha y elimina eventos.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        action: { type: 'STRING', description: 'create_event, list_events, delete_event' },
                        title: { type: 'STRING', description: 'Título o resumen del evento.' },
                        description: { type: 'STRING', description: 'Detalles del evento.' },
                        startTime: { type: 'STRING', description: 'Fecha y hora de inicio (ISO).' },
                        endTime: { type: 'STRING', description: 'Fecha y hora de finalización (ISO).' },
                        timeMin: { type: 'STRING', description: 'Fecha de inicio para listar eventos.' },
                        timeMax: { type: 'STRING', description: 'Fecha de fin para listar eventos.' },
                        eventId: { type: 'STRING', description: 'ID del evento a eliminar.' }
                    },
                    required: ['action']
                }
            };

            const oneDriveDeclaration = {
                name: 'onedrive',
                description: 'Interactúa con Microsoft OneDrive: busca archivos/carpetas, lee documentos (Word, Excel, PDF) y escribe archivos.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        action: { type: 'STRING', description: 'list_files_and_folders, read_document_content, create_folder, write_file' },
                        query: { type: 'STRING', description: 'Término de búsqueda o contenido a escribir.' },
                        fileId: { type: 'STRING', description: 'ID del archivo o carpeta en OneDrive.' },
                        fileName: { type: 'STRING', description: 'Nombre del archivo o carpeta.' },
                        parentId: { type: 'STRING', description: 'ID de la carpeta contenedora.' }
                    },
                    required: ['action']
                }
            };

            const webSearchDeclaration = {
                name: 'web_search',
                description: 'Busca información actualizada en tiempo real en Internet (noticias, normatividad SST, decretos, resoluciones de Mintrabajo, estadísticas oficiales, documentación técnica, etc.). Utiliza el motor de búsqueda avanzado de WAPPY.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        query: {
                            type: 'STRING',
                            description: 'La consulta de búsqueda a ejecutar en internet. Sé específico e incluye términos clave relevantes (ej: "Resolución 0312 de 2019 Colombia Mintrabajo").'
                        }
                    },
                    required: ['query']
                }
            };

            const editorRITDeclaration = {
                name: 'editor_rit',
                description: 'Editor especializado para el Reglamento Interno de Trabajo (RIT): cargar plantilla tradicional/humanista, leer y editar secciones.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        accion: { type: 'STRING', description: 'cargar_plantilla, leer, escribir, editar_seccion, buscar_reemplazar, insertar' },
                        tono: { type: 'STRING', description: 'tradicional o humanista' },
                        content: { type: 'STRING', description: 'Contenido HTML completo.' },
                        fileName: { type: 'STRING', description: 'Nombre descriptivo del documento.' },
                        titulo_seccion: { type: 'STRING', description: 'Título de la sección a editar.' },
                        nuevo_contenido_seccion: { type: 'STRING', description: 'Nuevo contenido de la sección.' },
                        buscar: { type: 'STRING', description: 'Texto a buscar.' },
                        reemplazar: { type: 'STRING', description: 'Texto de reemplazo.' }
                    },
                    required: ['accion']
                }
            };

            const analiticaPsicosocialDeclaration = {
                name: 'consultar_analitica_psicosocial',
                description: 'Consulta de forma anónima y consolidada los datos de estado de ánimo, clima laboral y factores de estrés de los trabajadores.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        dias: { type: 'NUMBER', description: 'Días de historial hacia atrás (por defecto 30).' },
                        departamento: { type: 'STRING', description: 'Área o departamento a filtrar.' }
                    }
                }
            };

            const analiticaActosCondicionesDeclaration = {
                name: 'consultar_analitica_actos_condiciones',
                description: 'Consulta estadísticas de actos y condiciones inseguras, áreas críticas y tendencias de seguridad en el buzón.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        accion: { type: 'STRING', description: 'obtener_analisis o marcar_procesado' },
                        reportId: { type: 'STRING', description: 'ID del reporte a marcar procesado.' },
                        dias: { type: 'NUMBER', description: 'Días de historial a analizar (por defecto 30).' }
                    }
                }
            };

            const wappyRetirarTrabajadorDeclaration = {
                name: 'wappy_retirar_trabajador',
                description: 'Marca a un trabajador o colaborador como RETIRADO en el SG-SST (Huella Biocéntrica / Perfil Sociodemográfico). Conserva todo su historial médico y ocupacional de 20 años según el Decreto 1072 de 2015, y traslada su ficha a la pestaña "Retirados". Invócala de inmediato cuando el usuario te pida retirar, desvincular o dar de baja a un empleado de la empresa.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        idOrCedula: { type: 'STRING', description: 'Cédula, ID o nombre del trabajador a retirar (ej: "80123456", "Jorge Ricky Pineda" o "Jorge Pineda").' },
                        nombre: { type: 'STRING', description: 'Nombre del trabajador si se conoce.' },
                        motivoRetiro: { type: 'STRING', description: 'Motivo del retiro (ej: "Renuncia voluntaria", "Terminación de contrato", "Salida de la empresa").' },
                        fechaRetiro: { type: 'STRING', description: 'Fecha de retiro en formato YYYY-MM-DD (opcional).' }
                    },
                    required: ['idOrCedula']
                }
            };

            const wappyReintegrarTrabajadorDeclaration = {
                name: 'wappy_reintegrar_trabajador',
                description: 'Reintegra, reactiva o vuelve a pasar a estado ACTIVO a un trabajador previamente retirado en el SG-SST (Huella Biocéntrica / Perfil Sociodemográfico), limpiando su fecha de retiro y actualizando su estado laboral a "Activo". Invócala de inmediato cuando el usuario te pida reintegrar, reactivar o volver a contratar a un colaborador.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        idOrCedula: { type: 'STRING', description: 'Cédula, ID o nombre del trabajador a reintegrar (ej: "80123456" o "Jorge Enrique Pineda").' },
                        nombre: { type: 'STRING', description: 'Nombre del trabajador si se conoce.' }
                    },
                    required: ['idOrCedula']
                }
            };

            const wappyActualizarTrabajadorDeclaration = {
                name: 'wappy_actualizar_trabajador',
                description: 'Actualiza los datos de un trabajador en el SG-SST (cargo, área, sede, salario, estado laboral "Activo" o "Retirado", EPS, AFP, teléfono, etc.).',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        idOrCedula: { type: 'STRING', description: 'Cédula, ID o nombre del trabajador a actualizar.' },
                        nombre: { type: 'STRING', description: 'Nombre completo actualizado.' },
                        cargo: { type: 'STRING', description: 'Cargo u ocupación.' },
                        estadoLaboral: { type: 'STRING', description: '"Activo" o "Retirado".' },
                        motivoRetiro: { type: 'STRING', description: 'Motivo del retiro si aplica.' },
                        area: { type: 'STRING', description: 'Área de trabajo.' },
                        sede: { type: 'STRING', description: 'Sede.' }
                    },
                    required: ['idOrCedula']
                }
            };

            const wappyConsultarTrabajadoresDeclaration = {
                name: 'wappy_consultar_trabajadores',
                description: 'Consulta o busca colaboradores en el SG-SST de la empresa activa (Huella Biocéntrica). Permite buscar por nombre, cédula o filtrar por activos o retirados.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        filtro: { type: 'STRING', description: '"Activo", "Retirado", o "todos".' },
                        busqueda: { type: 'STRING', description: 'Nombre o cédula para buscar un colaborador específico.' }
                    }
                }
            };

            const wappyRegistrarTrabajadorDeclaration = {
                name: 'wappy_registrar_trabajador',
                description: 'Registra y da de alta a un nuevo colaborador en la nómina del SG-SST de la empresa.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        nombre: { type: 'STRING', description: 'Nombre completo del trabajador.' },
                        cedula: { type: 'STRING', description: 'Número de cédula o documento de identidad.' },
                        cargo: { type: 'STRING', description: 'Cargo u ocupación.' },
                        tipoContrato: { type: 'STRING', description: 'Tipo de contrato.' }
                    },
                    required: ['nombre', 'cedula', 'cargo']
                }
            };

            const wappyResumenGeneral360Declaration = {
                name: 'wappy_resumen_general_360',
                description: 'Diagnóstico 360° integral de la empresa en WAPPY: consulta en tiempo real el estado general, cantidad de trabajadores, riesgos GTC-45 y PESV, cumplimiento de matriz legal, puntaje de estándares 0312, comités, EPP, inventario químico, flota vehicular, incidentes ATEL y tareas pendientes.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        dummy: { type: 'STRING', description: 'Parámetro opcional' }
                    }
                }
            };

            const wappyMcpSstDeclaration = {
                name: 'wappy_mcp_sst',
                description: 'Suite oficial de operaciones y consultas MCP del SG-SST de WAPPY (las 41 herramientas). Permite consultar o alimentar de forma autónoma: diagnóstico 360°, empresa, trabajadores, matriz GTC45, matriz PESV, matriz legal, estándares 0312, comités (COPASST, Convivencia, Brigadas), químicos SGA, vehículos, EPP, reportes de actos y condiciones, perfiles de cargo, casos ATEL, cronograma y tareas, capacitaciones, auditorías y automatizaciones.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        herramienta: {
                            type: 'STRING',
                            description: 'Nombre de la herramienta MCP a ejecutar (ej: wappy_resumen_general_360, wappy_consultar_matriz_gtc45, wappy_consultar_comites, etc.).'
                        },
                        parametros: {
                            type: 'OBJECT',
                            description: 'Argumentos para la herramienta.'
                        }
                    },
                    required: ['herramienta']
                }
            };

            // Assemble base tools and dynamically triggered tools (strictly excluding Group 7)
            const baseFunctionDeclarations = [
                wappyNavegarDeclaration,
                somosSSTDeclaration,
                wappyRetirarTrabajadorDeclaration,
                wappyReintegrarTrabajadorDeclaration,
                wappyActualizarTrabajadorDeclaration,
                wappyConsultarTrabajadoresDeclaration,
                wappyRegistrarTrabajadorDeclaration,
                wappyResumenGeneral360Declaration,
                wappyMcpSstDeclaration,
                googleDriveDeclaration,
                consultarAgenteDeclaration,
                canvasDeclaration,
                operarGUIDeclaration,
                diligenciarFormularioDeclaration,
                seleccionarEmpresaDeclaration,
                gestionarMemoriaDeclaration,
                leerPantallaDeclaration
            ];

            const dynamicToolsMap = {
                matriz_ipevar: matrizIPEVARDeclaration,
                matriz_pesv: matrizPESVDeclaration,
                matriz_compatibilidad: matrizCompatibilidadDeclaration,
                gestor_automatizaciones: gestorAutomatizacionesDeclaration,
                google_sheets: googleSheetsDeclaration,
                google_docs: googleDocsDeclaration,
                google_slides: googleSlidesDeclaration,
                google_gmail: googleGmailDeclaration,
                google_calendar: googleCalendarDeclaration,
                onedrive: oneDriveDeclaration,
                one_drive: oneDriveDeclaration,
                web_search: webSearchDeclaration,
                editor_rit: editorRITDeclaration,
                consultar_analitica_psicosocial: analiticaPsicosocialDeclaration,
                consultar_analitica_actos_condiciones: analiticaActosCondicionesDeclaration,
            };

            const toolsToAttach = [...baseFunctionDeclarations];
            for (const toolName of activeTools) {
                const decl = dynamicToolsMap[toolName];
                if (decl && !toolsToAttach.some(d => d.name === decl.name)) {
                    toolsToAttach.push(decl);
                }
            }
            logger.info(`[Tenshi Backend] Herramientas adjuntas a Gemini (${toolsToAttach.length}): ${toolsToAttach.map(t => t.name).join(', ')}`);

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
                            systemInstruction: systemMessage,
                            tools: [{ functionDeclarations: toolsToAttach }],
                            generationConfig: { temperature: 0.7 }
                        });

                        const lastUserMsg = messages[messages.length - 1]?.content || 'Hola';
                        logger.info(`[Tenshi Backend] Sending request to Gemini (${currentModel}) with message: "${lastUserMsg}"`);

                        let currentContents = [
                            ...history,
                            { role: 'user', parts: [{ text: lastUserMsg }] }
                        ];

                        let responseResult = await geminiModel.generateContent({ contents: currentContents });
                        let candidate = responseResult.response.candidates && responseResult.response.candidates[0];
                        let calls = responseResult.response.functionCalls();
                        logger.info(`[Tenshi Backend] Gemini initial response function calls: ${JSON.stringify(calls)}`);
                        let loops = 0;
                        requestedGuiAction = null;
                        requestedGuiActions = null;

                        while (calls && calls.length > 0 && loops < 5) {
                            loops++;
                            const call = calls[0];
                            logger.info(`[Tenshi Tool Call] Executing ${call.name} with args:`, call.args);
                            let toolOutput = '';

                            try {
                                if (call.name === 'somos_sst') {
                                    const toolInstance = new SomosSST({ req });
                                    toolOutput = await toolInstance._call(call.args);
                                } else if (call.name === 'google_drive') {
                                    const toolInstance = new GoogleDrive({ req });
                                    toolOutput = await toolInstance._call(call.args);
                                } else if (call.name === 'consultar_agente_especializado') {
                                    const toolInstance = new ConsultarAgenteEspecializado({ req });
                                    toolOutput = await toolInstance._call(call.args);
                                } else if (call.name === 'canvas_tool' || call.name === 'canvas') {
                                    const toolInstance = new CanvasTool({ req });
                                    toolOutput = await toolInstance._call(call.args);
                                } else if (call.name === 'matriz_ipevar') {
                                    const MatrizIPEVAR = require('../../app/clients/tools/structured/MatrizIPEVAR');
                                    toolOutput = await new MatrizIPEVAR({ req })._call(call.args);
                                } else if (call.name === 'matriz_pesv') {
                                    const MatrizPESV = require('../../app/clients/tools/structured/MatrizPESV');
                                    toolOutput = await new MatrizPESV({ req })._call(call.args);
                                } else if (call.name === 'matriz_compatibilidad') {
                                    const MatrizCompatibilidad = require('../../app/clients/tools/structured/MatrizCompatibilidad');
                                    toolOutput = await new MatrizCompatibilidad({ req })._call(call.args);
                                } else if (call.name === 'gestor_automatizaciones') {
                                    const GestorAutomatizaciones = require('../../app/clients/tools/structured/GestorAutomatizaciones');
                                    toolOutput = await new GestorAutomatizaciones({ req })._call(call.args);
                                } else if (call.name === 'google_sheets') {
                                    const GoogleSheetsTool = require('../../app/clients/tools/structured/GoogleSheets');
                                    toolOutput = await new GoogleSheetsTool({ req })._call(call.args);
                                } else if (call.name === 'google_docs') {
                                    const GoogleDocsTool = require('../../app/clients/tools/structured/GoogleDocs');
                                    toolOutput = await new GoogleDocsTool({ req })._call(call.args);
                                } else if (call.name === 'google_slides') {
                                    const GoogleSlidesTool = require('../../app/clients/tools/structured/GoogleSlides');
                                    toolOutput = await new GoogleSlidesTool({ req })._call(call.args);
                                } else if (call.name === 'google_gmail') {
                                    const GoogleGmailTool = require('../../app/clients/tools/structured/GoogleGmail');
                                    toolOutput = await new GoogleGmailTool({ req })._call(call.args);
                                } else if (call.name === 'google_calendar') {
                                    const GoogleCalendarTool = require('../../app/clients/tools/structured/GoogleCalendar');
                                    toolOutput = await new GoogleCalendarTool({ req })._call(call.args);
                                } else if (call.name === 'onedrive' || call.name === 'one_drive') {
                                    const OneDriveTool = require('../../app/clients/tools/structured/OneDrive');
                                    toolOutput = await new OneDriveTool({ req })._call(call.args);
                                } else if (call.name === 'web_search') {
                                    const WebSearchTool = require('../../app/clients/tools/structured/WebSearch');
                                    toolOutput = await new WebSearchTool({ req })._call(call.args);
                                } else if (call.name === 'editor_rit') {
                                    const EditorRIT = require('../../app/clients/tools/structured/EditorRIT');
                                    toolOutput = await new EditorRIT({ req })._call(call.args);
                                } else if (call.name === 'consultar_analitica_psicosocial') {
                                    const ConsultarAnaliticaPsicosocial = require('../../app/clients/tools/structured/ConsultarAnaliticaPsicosocial');
                                    toolOutput = await new ConsultarAnaliticaPsicosocial({ req })._call(call.args);
                                } else if (call.name === 'consultar_analitica_actos_condiciones') {
                                    const ConsultarAnaliticaActosCondiciones = require('../../app/clients/tools/structured/ConsultarAnaliticaActosCondiciones');
                                    toolOutput = await new ConsultarAnaliticaActosCondiciones({ req })._call(call.args);
                                } else if (call.name === 'seleccionar_empresa' || call.name === 'wappy_seleccionar_empresa') {
                                    const term = call.args?.nombre_o_id;
                                    let query = { user: targetUserId };
                                    if (mongoose.isValidObjectId(term)) {
                                        query._id = term;
                                    } else {
                                        const safeRegex = new RegExp(String(term || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
                                        query.$or = [
                                            { companyName: safeRegex },
                                            { nit: term }
                                        ];
                                    }
                                    const found = await CompanyInfo.findOne(query);
                                    if (found) {
                                        await CompanyInfo.updateMany({ user: targetUserId }, { isActive: false });
                                        found.isActive = true;
                                        await found.save();
                                        await syncCompanyMemory(targetUserId, found);
                                        toolOutput = JSON.stringify({ success: true, message: `Empresa "${found.companyName}" activada y sincronizada exitosamente con la memoria.` });
                                    } else {
                                        toolOutput = JSON.stringify({ success: false, error: `No se encontró ninguna empresa que coincida con "${term}".` });
                                    }
                                } else if (call.name === 'gestionar_memoria') {
                                    const accion = call.args?.accion || 'consultar';
                                    const clave = call.args?.clave;
                                    const valor = call.args?.valor;
                                    if (accion === 'guardar' && clave && valor) {
                                        const tokenCount = Tokenizer.getTokenCount(valor, 'o200k_base') || 0;
                                        await setMemory({ userId: targetUserId, agentId: 'global', key: clave, value: valor, tokenCount });
                                        toolOutput = JSON.stringify({ success: true, message: `Dato guardado exitosamente en la memoria bajo la clave "${clave}".` });
                                    } else if (accion === 'eliminar' && clave) {
                                        await deleteMemory({ userId: targetUserId, agentId: 'global', key: clave });
                                        toolOutput = JSON.stringify({ success: true, message: `Memoria "${clave}" eliminada con éxito.` });
                                    } else {
                                        const rawMems = await getAllUserMemories(targetUserId);
                                        const unique = new Map();
                                        (rawMems || []).forEach(m => { if (m.key && !unique.has(m.key)) unique.set(m.key, m.value); });
                                        const list = Array.from(unique.entries()).map(([k, v]) => `[${k}]: ${v}`).join('\n\n');
                                        toolOutput = JSON.stringify({ success: true, memorias: list || 'No hay memorias registradas aún.' });
                                    }
                                } else if (call.name === 'leer_pantalla') {
                                    if (browserState && browserState.length > 30) {
                                        toolOutput = JSON.stringify({ success: true, contenido_pantalla: browserState });
                                    } else {
                                        toolOutput = JSON.stringify({ success: true, message: 'La pantalla actual no contiene texto o elementos adicionales visibles.' });
                                    }
                                } else if (call.name === 'wappy_diligenciar_formulario') {
                                    requestedGuiAction = {
                                        name: 'wappy_diligenciar_formulario',
                                        args: call.args
                                    };
                                    break;
                                } else if (call.name === 'wappy_navegar') {
                                    requestedGuiAction = {
                                        name: 'wappy_navegar',
                                        accion: 'navegar',
                                        modulo: call.args?.modulo,
                                        ruta: call.args?.ruta,
                                        args: call.args
                                    };
                                    break;
                                } else if (call.name === 'operar_interfaz_visual') {
                                    const guiCalls = calls.filter(c => c.name === 'operar_interfaz_visual');
                                    requestedGuiActions = guiCalls.map(c => ({
                                        accion: c.args.accion,
                                        indice: c.args.indice,
                                        texto: c.args.texto,
                                        direccion: c.args.direccion
                                    }));
                                    requestedGuiAction = requestedGuiActions[0]; // fallback
                                } else if (call.name === 'wappy_reintegrar_trabajador' || call.name === 'wappy_reactivar_trabajador') {
                                    const rawArgs = call.args || {};
                                    const target = rawArgs.idOrCedula || rawArgs.id || rawArgs.cedula || rawArgs.nombre || rawArgs.identificacion || rawArgs.target || '';
                                    const argsToSend = {
                                        ...rawArgs,
                                        idOrCedula: target,
                                        id: target,
                                        nombre: rawArgs.nombre || target
                                    };
                                    const res = await executeTenshiMcpTool('wappy_reintegrar_trabajador', argsToSend, targetUserId);
                                    toolOutput = JSON.stringify(res);
                                } else if (call.name === 'wappy_retirar_trabajador' || call.name === 'wappy_eliminar_trabajador') {
                                    const rawArgs = call.args || {};
                                    const target = rawArgs.idOrCedula || rawArgs.id || rawArgs.cedula || rawArgs.nombre || rawArgs.identificacion || rawArgs.target || '';
                                    const argsToSend = {
                                        ...rawArgs,
                                        idOrCedula: target,
                                        id: target,
                                        nombre: rawArgs.nombre || target
                                    };
                                    const res = await executeTenshiMcpTool('wappy_retirar_trabajador', argsToSend, targetUserId);
                                    toolOutput = JSON.stringify(res);
                                } else if (call.name === 'wappy_actualizar_trabajador') {
                                    const rawArgs = call.args || {};
                                    const target = rawArgs.idOrCedula || rawArgs.id || rawArgs.cedula || rawArgs.nombre || rawArgs.identificacion || rawArgs.target || '';
                                    const argsToSend = { ...rawArgs, idOrCedula: target, id: target };
                                    const res = await executeTenshiMcpTool('wappy_actualizar_trabajador', argsToSend, targetUserId);
                                    toolOutput = JSON.stringify(res);
                                } else if (call.name === 'wappy_consultar_trabajadores') {
                                    const res = await executeTenshiMcpTool('wappy_consultar_trabajadores', call.args || {}, targetUserId);
                                    toolOutput = JSON.stringify(res);
                                } else if (call.name === 'wappy_registrar_trabajador') {
                                    const res = await executeTenshiMcpTool('wappy_registrar_trabajador', call.args || {}, targetUserId);
                                    toolOutput = JSON.stringify(res);
                                } else if (call.name === 'wappy_resumen_general_360') {
                                    const res = await executeTenshiMcpTool('wappy_resumen_general_360', call.args || {}, targetUserId);
                                    toolOutput = JSON.stringify(res);
                                } else if (call.name === 'wappy_mcp_sst' || call.name in TOOL_ROUTES || (call.name.startsWith('wappy_') && !['wappy_navegar', 'wappy_diligenciar_formulario', 'wappy_seleccionar_empresa'].includes(call.name))) {
                                    const targetTool = call.name === 'wappy_mcp_sst' ? (call.args?.herramienta || call.args?.tool || 'wappy_resumen_general_360') : call.name;
                                    const targetArgs = call.name === 'wappy_mcp_sst' ? (call.args?.parametros || call.args?.args || call.args || {}) : (call.args || {});
                                    const res = await executeTenshiMcpTool(targetTool, targetArgs, targetUserId);
                                    toolOutput = JSON.stringify(res);
                                } else {
                                    break;
                                }
                            } catch (toolExecErr) {
                                logger.error(`[Tenshi Tool Error] Error ejecutando ${call.name}:`, toolExecErr);
                                toolOutput = JSON.stringify({ error: `Error ejecutando ${call.name}: ${toolExecErr.message}` });
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

                            const modelParts = (candidate && candidate.content && candidate.content.parts) || [{
                                functionCall: { name: call.name, args: call.args }
                            }];
                            currentContents.push({ role: 'model', parts: modelParts });

                            let parsedResponse;
                            if (typeof toolOutput === 'object' && toolOutput !== null) {
                                parsedResponse = toolOutput;
                            } else if (typeof toolOutput === 'string' && toolOutput.trim().startsWith('{')) {
                                try {
                                    parsedResponse = JSON.parse(toolOutput);
                                } catch (e) {
                                    parsedResponse = { result: toolOutput };
                                }
                            } else {
                                parsedResponse = { result: String(toolOutput || 'Operación completada.') };
                            }

                            currentContents.push({
                                role: 'user',
                                parts: [
                                    {
                                        functionResponse: {
                                            name: call.name,
                                            response: parsedResponse
                                        }
                                    }
                                ]
                            });

                            responseResult = await geminiModel.generateContent({ contents: currentContents });
                            candidate = responseResult.response.candidates && responseResult.response.candidates[0];
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
