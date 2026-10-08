const buf = require('buffer');
if (!buf.SlowBuffer) buf.SlowBuffer = buf.Buffer;
const WebSocket = require('ws');
const logger = require('~/config/winston');
const GeminiLiveClient = require('./geminiLive');
const { getUserKey } = require('~/server/services/UserService');
const { EModelEndpoint } = require('librechat-data-provider');
const { saveMessage, saveConvo, getMessages, updateMessage, getAllUserMemories, setMemory, deleteMemory } = require('~/models');
const { v4: uuidv4 } = require('uuid');
const { generateWithKeyRotation, SGSST_FALLBACK_MODELS, LIVE_FALLBACK_MODELS } = require('../sgsst/sgsstGemini');
const mongoose = require('mongoose');
const CompanyInfo = require('~/models/CompanyInfo');
const { syncCompanyMemory } = require('../sgsst/companyInfo');
const { buildSignatureSection, buildStandardHeader, buildWorkerSubHeader } = require('../sgsst/reportHeader');
const fs = require('fs');
const path = require('path');
const SKILLS_DIR = path.resolve(__dirname, '../../../config/skills');
const { resolveInspectionProtocol, INSPECTION_PROTOCOLS } = require('./inspectionProtocols');
const { executeTenshiMcpTool, TOOL_ROUTES } = require('./tenshiMcpDispatcher');

/**
 * Sanitizes voice transcription for common Spanish/SST phonetic misrecognitions
 */
function sanitizeTranscription(text) {
    if (!text || typeof text !== 'string') return '';
    let s = text.trim();

    // 1. REJECT AND DISCARD ANY DEVANAGARI / HINDI / ARABIC / CYRILLIC OR NON-LATIN HALLUCINATION
    if (/[\u0900-\u097F\u0600-\u06FF\u4E00-\u9FFF\u0400-\u04FF]/u.test(s)) {
        logger.warn(`[VoiceSession] Discarding foreign script hallucination from STT: "${s}"`);
        return '';
    }

    // 2. Reject known phantom silence hallucinations produced by STT on ambient noise or breathing
    if (/^(yo juego a la bola|thank you for watching|suscr[ií]bete|bye|oh|ah|ciao|bonjour|hello|hi|por|el|la|de|un|una)\.?$/i.test(s)) {
        logger.warn(`[VoiceSession] Discarding phantom silence hallucination: "${s}"`);
        return '';
    }

    // 2.1 Reject repetitive stutter/loop hallucinations (e.g. "¿Qué ¿Qué ¿Qué")
    if (/^(¿?\s*qu[eé]\s*\??\s*){2,}$/i.test(s)) {
        logger.warn(`[VoiceSession] Discarding repetitive STT loop hallucination: "${s}"`);
        return '';
    }

    // 3. Filter out obvious romanized Hindi/Urdu hallucinated chunks if Gemini STT drifted
    if (/\b(aur|ek\s+chhat|hai\s+na|jo\s+hamara|system\s+hai\s+na)\b/i.test(s)) {
        logger.warn(`[VoiceSession] Discarding romanized Hindi hallucination: "${s}"`);
        return '';
    }

    // Fix affirmative false cognates (e.g. Google STT hearing "bistro" for "listo")
    s = s.replace(/\b(bistro|visto|misto|cristo|pisto|disto)\b/gi, (match) => {
        return match[0] === match[0].toUpperCase() ? 'Listo' : 'listo';
    });

    // Fix report voice triggers
    s = s.replace(/\bgeneral\s+(el\s+|al\s+)?(informe|reporte)\b/gi, 'generar el informe');
    s = s.replace(/\b(has|hazme|as)\s+el\s+(informe|reporte)\b/gi, 'haz el informe');
    s = s.replace(/\b(quiero|dame)\s+el\s+(reporte|informe)\b/gi, 'genera el informe');

    return s;
}

/**
 * Loads and extracts clean technical domain knowledge from agent skills
 */
function getAgentSkillsContent(agentObj, isBiomechanics) {
    const skillsToLoad = new Set();

    if (agentObj && Array.isArray(agentObj.skills) && agentObj.skills.length > 0) {
        agentObj.skills.forEach(s => skillsToLoad.add(s));
    }

    // Force biomechanics essential skills
    const name = (agentObj?.name || '').toLowerCase();
    if (isBiomechanics || name.includes('fisio') || name.includes('biomec') || name.includes('ergon')) {
        skillsToLoad.add('skill-live-biomecanica');
        skillsToLoad.add('skill-metodologia-rosa');
        skillsToLoad.add('skill-ergonomia-owas');
    }

    if (skillsToLoad.size === 0 || !fs.existsSync(SKILLS_DIR)) {
        return '';
    }

    const loadedBlocks = [];
    for (const skillName of skillsToLoad) {
        try {
            const fileName = skillName.endsWith('.md') ? skillName : `${skillName}.md`;
            const filePath = path.join(SKILLS_DIR, fileName);
            if (!fs.existsSync(filePath)) continue;

            const content = fs.readFileSync(filePath, 'utf8');
            let body = content;

            // Strip YAML frontmatter
            const match = content.match(/^---(\s*[\s\S]*?)---(\s*[\s\S]*)$/);
            if (match) {
                body = match[2].trim();
            }

            // Strip written-chat questionnaires, authorization flows, and markdown tables
            const cleanBody = body
                .replace(/<[^>]*>/g, '')
                .replace(/\|[^\n]+\|/g, '')
                .replace(/🔄 PROCESO DE RECOLECCIÓN DE DATOS INTERACTIVO[\s\S]*?(?=📋 Restricciones|##|$)/gi, '')
                .replace(/Información inicial que siempre pedirás[\s\S]*?(?=🔹|---|##|$)/gi, '')
                .replace(/¿autoriza la elaboración[\s\S]*?Sí \/ No/gi, '')
                .replace(/\{\{[^}]+\}\}/g, 'usuario')
                .trim();

            if (cleanBody) {
                const trimmed = cleanBody.length > 2500 ? cleanBody.substring(0, 2500) + '...' : cleanBody;
                loadedBlocks.push(`[SKILL: ${skillName.toUpperCase()}]\n${trimmed}`);
            }
        } catch (err) {
            logger.warn(`[VoiceSession] Error loading skill "${skillName}":`, err.message);
        }
    }

    return loadedBlocks.join('\n\n');
}

/**
 * Strips written-chat artifacts from agent instructions for natural voice interaction
 */
function cleanAgentInstructions(instructions) {
    if (!instructions || typeof instructions !== 'string') return '';
    return instructions
        .replace(/<[^>]*>/g, '')
        .replace(/\|[^\n]+\|/g, '')
        .replace(/Información inicial que siempre pedirás[\s\S]*?(?=🔹|---|##|$)/gi, '')
        .replace(/Preguntas clave\s*\([^)]*\)/gi, '')
        .replace(/Tamaño de la empresa[\s\S]*?actividad económica\./gi, '')
        .replace(/Clase de riesgo ARL[\s\S]*?\./gi, '')
        .replace(/Estado actual de implementación[\s\S]*?\./gi, '')
        .replace(/Rol del usuario dentro del sistema[\s\S]*?\./gi, '')
        .replace(/🔹\s*6\.\s*Información inicial[\s\S]*?(?=🔹|---|##|$)/gi, '')
        .replace(/🔹\s*4\.\s*Estructura recomendada[\s\S]*?(?=🔹|---|##|$)/gi, '')
        .replace(/🔹\s*10\.\s*Ejemplos de inicio[\s\S]*?(?=🔹|---|##|$)/gi, '')
        .replace(/🔹 11\. Reglas de Formato Visual[\s\S]*?(?=🔹|---|##|$)/gi, '')
        .replace(/⚠️ REGLA DE ORO DE TARJETAS[\s\S]*?(?=⚠️|🔹|---|##|$)/gi, '')
        .replace(/⚠️ REGLA DE ORO DE AUTOMATIZACIONES[\s\S]*?(?=⚠️|🔹|---|##|$)/gi, '')
        .replace(/\{\{[^}]+\}\}/g, 'usuario')
        .trim();
}

/**
 * Enriches queries delegated to specialists with professional occupational health & safety structure
 * complying strictly with Rule 6 of AGENTS.md / GEMINI.md, while GUARANTEEING that the user's
 * specific inquiry is ALWAYS preserved 100% intact as the central core.
 */
function enrichTechnicalPrompt(rawPrompt, agent) {
    let q = (rawPrompt || '').trim();
    if (!q) return q;

    // 1. Limpiar vocativos y prefijos de delegación como "pregúntale al abogado que si...", "dile que..."
    let cleanQ = q
        .replace(/^(?:por\s+favor\s+)?(?:dile|preg[uú]ntale|p[ií]dele|consulta(?:le)?|av[ií]sale|comun[ií]cale)\s+(?:a\s+la\s+gente\s+|al\s+agente\s+|al\s+|a\s+la\s+|al\s+doctor\s+|al\s+m[eé]dico\s+|al\s+abogado\s+|al\s+especialista\s+|a\s+[\w\s]+\s+)?(?:que\s+)?/i, '')
        .replace(/^(?:a\s+la\s+gente|al\s+agente|al\s+doctor|al\s+m[eé]dico|al\s+abogado|al\s+especialista)\s+(?:laboral\s+|m[eé]dico\s+|sst\s+)?(?:que\s+)?/i, '')
        .replace(/^que\s+(qu[eé]|c[oó]mo|cu[aá]l|cu[aá]ndo|d[oó]nde|por\s+qu[eé]|si)\s+/i, '$1 ')
        .trim();

    if (!cleanQ) cleanQ = q;

    // Formatear signos de interrogación si parece o contiene pregunta
    if (/^(qu[eé]|c[oó]mo|cu[aá]l|cu[aá]ndo|qui[eé]n|d[oó]nde|por\s+qu[eé]|si)\b/i.test(cleanQ)) {
        if (!cleanQ.startsWith('¿')) cleanQ = '¿' + cleanQ;
        if (!cleanQ.endsWith('?')) cleanQ = cleanQ + '?';
    }

    // Capitalizar primera letra (o después de ¿)
    if (cleanQ.startsWith('¿') && cleanQ.length > 1) {
        cleanQ = '¿' + cleanQ.charAt(1).toUpperCase() + cleanQ.slice(2);
    } else if (cleanQ.length > 0) {
        cleanQ = cleanQ.charAt(0).toUpperCase() + cleanQ.slice(1);
    }

    // 2. Si la consulta ya cuenta con contexto técnico/normativo detallado o es suficientemente extensa,
    // retornarla directamente para no sobrecargar el prompt
    const hasNormativeContext = /\b(concepto\s+t[eé]cnico|decreto\s+\d+|resoluci[oó]n\s+\d+|ley\s+\d+|art[ií]culo\s+\d+|marco\s+legal|normativa|jurisprudencia|est[aá]ndar\s+m[ií]nimo)\b/i.test(cleanQ);
    if (hasNormativeContext && cleanQ.length >= 120) {
        return cleanQ;
    }

    // 3. ESTRUCTURACIÓN TÉCNICA PROFESIONAL OBLIGATORIA (REGLA 6):
    // Preservar la consulta EXACTA del usuario como primer párrafo ineludible
    // y anexar la solicitud de fundamentación técnico-normativa colombiana.
    const cleanCore = cleanQ.replace(/[.?\s]+$/, '');
    const coreQuestion = cleanCore.startsWith('¿') ? `${cleanCore}?` : cleanCore;

    return `${coreQuestion}\n\nPor favor emite concepto técnico ocupacional y jurídico detallado para esta consulta concreta, fundamentado en la normativa colombiana aplicable al SG-SST (Decreto 1072 de 2015, Resoluciones ministeriales vigentes o jurisprudencia) y recomendaciones de aplicación práctica para la empresa.`;
}

/**
 * Translates application routes and active screen contexts into clear, human-readable
 * modules of the SG-SST platform so Tenshi has crystal-clear grounded context.
 */
function formatScreenRouteHuman(route, agent) {
    if (!route && !agent) return 'Plataforma SG-SST WAPPY';
    const r = (route || '').toLowerCase();

    // Si hay especialista activo en pantalla
    if (agent && agent.name) {
        return `Chat activo con Especialista: ${agent.name} (Ruta: ${route || '/c/new'})`;
    }

    if (r.includes('perfil_socio') || r.includes('sociodemografico') || (r.includes('hito2') && !r.includes('perfil_cargo') && !r.includes('condiciones_salud'))) {
        return 'Módulo: Perfil Sociodemográfico y Nómina de Colaboradores (Hito 2 - Huella Biocéntrica)';
    }
    if (r.includes('perfil_cargo') || r.includes('profesigrama')) {
        return 'Módulo: Perfiles de Cargo y Profesiogramas (Hito 2 - Huella Biocéntrica)';
    }
    if (r.includes('condiciones_salud')) {
        return 'Módulo: Condiciones de Salud y Evaluaciones Médicas Ocupacionales (Hito 2)';
    }
    if (r.includes('diagnostico') || r.includes('0312')) {
        return 'Módulo: Diagnóstico Inicial y Estándares Mínimos Resolución 0312 (Hito 1)';
    }
    if (r.includes('matriz_ipevar') || r.includes('peligros') || r.includes('gtc45')) {
        return 'Módulo: Matriz de Riesgos y Peligros IPEVAR / GTC-45 (Hito 1 / Hito 4)';
    }
    if (r.includes('matriz_pesv') || r.includes('vehicles_pesv') || r.includes('pesv')) {
        return 'Módulo: Plan Estratégico de Seguridad Vial PESV (Resolución 20223040040595)';
    }
    if (r.includes('matriz_compatibilidad') || r.includes('chemical')) {
        return 'Módulo: Matriz de Compatibilidad Química y Sustancias Peligrosas SGA (Hito 5)';
    }
    if (r.includes('animo')) {
        return 'Módulo: Termómetro Emocional y Monitoreo de Clima Laboral (Hito 4)';
    }
    if (r.includes('investigacion_atel') || r.includes('atel')) {
        return 'Módulo: Investigación de Incidentes y Accidentes de Trabajo ATEL (Hito 7)';
    }
    if (r.includes('estadisticas')) {
        return 'Módulo: Indicadores y Estadísticas de Siniestralidad y Ausentismo (Hito 7)';
    }
    if (r.includes('control_acpm') || r.includes('/control')) {
        return 'Módulo: Centro de Control de Acciones Correctivas y Preventivas ACPM (Kanban)';
    }
    if (r.includes('copasst')) {
        return 'Módulo: Comité Paritario de Seguridad y Salud en el Trabajo (COPASST - Hito 3)';
    }
    if (r.includes('cocolab')) {
        return 'Módulo: Comité de Convivencia Laboral (COCOLAB - Hito 3)';
    }
    if (r.includes('academia') || r.includes('cursos')) {
        return 'Módulo: Escuela WAPPY / Academia y Cursos de Capacitación (Hito 6)';
    }
    if (r.includes('predictivo')) {
        return 'Módulo: Inteligencia Artificial y Oráculo Predictivo (Hito 8)';
    }
    if (r.includes('/sgsst')) {
        return 'Módulo: Sistema de Gestión SG-SST (Dashboard de Hitos)';
    }
    if (r.includes('/c/') || r.includes('/chat')) {
        return 'Pantalla: Chat de Consultas WAPPY';
    }
    return `Pantalla actual: ${route}`;
}

/**
 * Active voice sessions
 * Map of userId -> VoiceSession
 */
const activeSessions = new Map();

/**
 * Voice Session Manager
 * Manages a voice conversation session between client and Gemini
 */
class VoiceSession {
    constructor(clientWs, userId, apiKeys, config = {}, conversationId = null) {
        this.clientWs = clientWs;
        this.userId = userId;
        this.apiKeys = Array.isArray(apiKeys) ? apiKeys : [apiKeys];
        this.config = config;

        // Context persistence: Use model/endpoint from client (Chat/Agent)
        this.dbModel = config.model;
        this.dbEndpoint = config.endpoint || EModelEndpoint.google;

        // Verify/Set defaults if missing (for DB saving)
        if (!this.dbModel) {
            // Fallback to voice model if no chat model provided
            this.dbModel = process.env.GEMINI_LIVE_MODEL || 'gemini-3.5-flash';
        }

        // Voice Configuration: Separate from DB Config
        this.liveConfig = { ...config };

        // CRITICAL: Ensure we don't pass an Agent ID or incompatible model to Gemini Live (WebSocket)
        // Gemini Live requires specific models (e.g. gemini-2.5-flash-native...).
        // Priority: 
        // 1. Explicit model passed from client (e.g. dropdown in LivePage)
        // 2. User personalization settings (Personalization panel)
        // 3. System default (GEMINI_LIVE_MODEL env)

        let candidateModel = config.model; // Dropdown priority
        let finalModel = null;
        
        const isSupported = (name) => {
            if (!name) return false;
            return name.toLowerCase().includes('gemini-') || ['native-audio', 'live', 'preview'].some(
                validModel => name.toLowerCase().includes(validModel)
            );
        };

        // Try candidate (dropdown)
        if (isSupported(candidateModel)) {
            finalModel = candidateModel;
        } 
        // If dropdown was invalid/missing, try User Personalization fallback
        else if (isSupported(this.config?.userSettings?.liveAnalysis)) {
            logger.warn(`[VoiceSession] Model "${candidateModel}" invalid. Falling back to personal settings: ${this.config.userSettings.liveAnalysis}`);
            finalModel = this.config.userSettings.liveAnalysis;
        } 
        // Neither are valid, completely delete to use GeminiLiveClient fallback
        else {
            logger.warn(`[VoiceSession] Neither requested model nor personalization are compatible for Live. Using system default.`);
            finalModel = null;
        }

        if (finalModel) {
            this.liveConfig.model = finalModel;
            logger.info(`[VoiceSession] Using live model: ${this.liveConfig.model}`);
        } else {
            delete this.liveConfig.model;
        }

        this.conversationId = conversationId;
        this.geminiClient = null;
        this.isActive = false;
        this.activeScreenRoute = config.route || '';
        this.activeScreenAgent = config.agentId || config.agentName ? { id: config.agentId, name: config.agentName || '' } : null;

        // Text accumulation for saving
        this.userTranscriptionText = '';
        this.aiResponseText = '';
        this.aiTranscriptionBuffer = ''; // ← NEW: accumulates AI speech transcription separately
        this.aiAudioChunkCount = 0; // Count audio chunks to know if AI responded with voice
        this.lastMessageId = null; // Track last message ID for parent linking
        this.activeEvidenceMessageId = null; // Track current grouped evidence message ID
        this.manualEvidences = []; // Stored manual evidence photos
        this.phaseEvidences = {}; // Stored structured multi-phase photos and telemetries
        this.lastEvaluatedFrames = []; // Fallback cache of last evaluated frames
        this.lastPhaseEvidences = {}; // Fallback cache of last phase evidences
        this.agentObj = null;
        this.isBiomechanics = false;
        this.toolCalledThisTurn = false;
        this.respondedToolCallIds = new Set(); // Previene duplicar respuestas de herramientas a Gemini Live
        this.pendingAgentForConsultation = null; // Memoria de especialista solicitado en turnos previos
        this.pendingAgentTimestamp = 0;

        logger.info(`[VoiceSession] Created for user: ${userId}, conversationId: ${conversationId || 'NULL'}`);

        // Modo Tenshi: Asistente oficial con control de plataforma por voz
        if (this.config.mode === 'tenshi_voice') {
            this.liveConfig.voice = this.config.voice || 'Aoede';
            this.liveConfig.tools = [
                {
                    functionDeclarations: [
                        {
                            name: "wappy_navegar",
                            description: "Navega de inmediato a cualquier módulo, hito, pantalla o aplicativo de la plataforma WAPPY y Somos SST. DEBES invocar esta función siempre que el usuario te pida ir, ver, abrir o consultar una sección o hito.",
                            parameters: {
                                type: "object",
                                properties: {
                                    modulo: {
                                        type: "string",
                                        description: "Nombre clave del módulo, hito o aplicativo. Hitos 1 al 8: 'diagnostico' (0312), 'participacion_ipevar', 'matriz_ipevar_oficial', 'matriz_pesv_oficial', 'matriz_compatibilidad_oficial', 'vulnerabilidad', 'plan_emergencias', 'responsable', 'politica', 'objetivos', 'legal', 'rhs', 'rit', 'perfil_cargo', 'perfil_socio', 'condiciones_salud', 'copasst', 'cocolab', 'comite_pesv', 'brigada_emergencias', 'animo', 'metodo_owas', 'estudio_puesto', 'peligros', 'permiso_alturas', 'analisis_trabajo_seguro', 'epp_delivery', 'vehicles_pesv', 'heights_lifecycle', 'chemical_registry', 'equipos_emergencia', 'reporte_actos', 'capacitaciones', 'simulacros_emergencia', 'ruta_aprendizaje', 'app_builder', 'estadisticas', 'investigacion_atel', 'control_acpm', 'auditoria', 'alta_direccion', 'investigacion_profunda', 'predictivo'. Aplicativos y Dashboards: 'sgsst', 'planes', 'academia', 'training_admin', 'rutas', 'ruta_admin', 'blog', 'blog_admin', 'events_meet', 'events_meet_admin', 'marketplace' (/marketplace tienda productos SST), 'marketplace_admin', 'agents' (/agents catálogo agentes IA), 'control' (Kanban), 'animo_dashboard', 'live' (/c/new), 'chat_sst', 'roadmap', 'contactanos', 'comunidad', 'matriz', 'embajadores', 'embajadores_dashboard', 'tenshi_admin', 'search', 'privacy', 'terms', 'about'. Portales públicos: 'public_reportar', 'public_animo', 'public_estudio_puesto', 'public_ipevar', 'public_alta_direccion', 'public_atel', 'public_colaborador', 'public_comites', 'public_convivencia', 'public_votaciones', 'public_inspecciones', 'public_brigadistas'."
                                    },
                                    ruta: {
                                        type: "string",
                                        description: "Ruta URL interna exacta (opcional si se especifica modulo). Ejemplos: '/sgsst?hito=hito8&module=predictivo', '/sgsst?hito=hito1&module=diagnostico', '/sgsst?hito=hito2&module=perfil_cargo', '/sgsst?hito=hito3&module=copasst', '/sgsst?hito=hito4&module=peligros', '/sgsst?hito=hito5&module=vehicles_pesv', '/sgsst?hito=hito6&module=capacitaciones', '/sgsst?hito=hito7&module=investigacion_atel', '/planes', '/academia?tab=cursos', '/training/admin', '/ruta-aprendizaje/admin', '/blog', '/blog/admin', '/events-meet', '/marketplace', '/marketplace/admin', '/agents', '/sgsst/control', '/sgsst/animo', '/auditoria', '/c/new', '/chat-sst', '/hoja-de-ruta', '/contactanos', '/comunidad', '/matriz', '/embajadores', '/embajadores/dashboard', '/tenshi/admin', '/privacy', '/terms', '/about'."
                                    }
                                },
                                required: ["modulo"]
                            }
                        },
                        {
                            name: "wappy_consultar_empresas",
                            description: "Consulta y lista todas las empresas que el usuario tiene registradas en WAPPY (hasta 3 empresas). Retorna el total de empresas registradas, el nombre de cada una, su NIT, número de trabajadores, cuál es la empresa activa actualmente y un resumen en texto. Invócala siempre que el usuario pregunte cuántas empresas tiene, cuáles son o pida ver sus empresas.",
                            parameters: {
                                type: "object",
                                properties: {
                                    dummy: { type: "string", description: "Parámetro opcional" }
                                }
                            }
                        },
                        {
                            name: "wappy_seleccionar_empresa",
                            description: "Activa o selecciona una empresa específica en el sistema por su nombre o identificación para trabajar sobre sus datos.",
                            parameters: {
                                type: "object",
                                properties: {
                                    nombre_o_id: {
                                        type: "string",
                                        description: "Nombre de la empresa o identificador."
                                    }
                                },
                                required: ["nombre_o_id"]
                            }
                        },
                        {
                            name: "wappy_activar_empresa",
                            description: "Activa o cambia a una empresa específica registrada en WAPPY por su nombre, NIT o ID para trabajar sobre sus datos y actualizar el contexto activo.",
                            parameters: {
                                type: "object",
                                properties: {
                                    empresa: {
                                        type: "string",
                                        description: "Nombre, NIT o ID de la empresa a activar."
                                    }
                                },
                                required: ["empresa"]
                            }
                        },
                        {
                            name: "wappy_consultar_detalle_empresa",
                            description: "Consulta el perfil y detalle completo de cualquier empresa registrada del usuario (activa o inactiva) por su nombre, NIT o ID. Retorna razón social, NIT, tipo de empresa, representante legal, cédula, responsable SST, licencia, vigencia, sedes, ciudad, nivel de riesgo y ARL.",
                            parameters: {
                                type: "object",
                                properties: {
                                    empresa: {
                                        type: "string",
                                        description: "Nombre, NIT o ID de la empresa a consultar."
                                    }
                                },
                                required: ["empresa"]
                            }
                        },
                        {
                            name: "wappy_retirar_trabajador",
                            description: "Marca a un colaborador como RETIRADO en el SG-SST (Huella Biocéntrica) conservando todo su historial ocupacional y trasladándolo a la pestaña 'Retirados'. Invócala de inmediato cuando el usuario te pida retirar, dar de baja o desvincular a un empleado.",
                            parameters: {
                                type: "object",
                                properties: {
                                    idOrCedula: {
                                        type: "string",
                                        description: "Cédula, ID o nombre del trabajador a retirar."
                                    },
                                    nombre: {
                                        type: "string",
                                        description: "Nombre del trabajador si se conoce."
                                    },
                                    motivoRetiro: {
                                        type: "string",
                                        description: "Motivo del retiro (ej: 'Renuncia voluntaria', 'Terminación de contrato', 'Salida de la empresa')."
                                    },
                                    fechaRetiro: {
                                        type: "string",
                                        description: "Fecha de retiro en formato YYYY-MM-DD (opcional)."
                                    }
                                },
                                required: ["idOrCedula"]
                            }
                        },
                        {
                            name: "wappy_reintegrar_trabajador",
                            description: "Reintegra, reactiva o vuelve a pasar a estado ACTIVO a un trabajador previamente retirado en el SG-SST (Huella Biocéntrica), limpiando su fecha de retiro y actualizando su estado laboral a 'Activo'. Invócala de inmediato cuando el usuario te pida reintegrar, reactivar o volver a contratar a un colaborador.",
                            parameters: {
                                type: "object",
                                properties: {
                                    idOrCedula: {
                                        type: "string",
                                        description: "Cédula, ID o nombre del trabajador a reintegrar."
                                    },
                                    nombre: {
                                        type: "string",
                                        description: "Nombre del trabajador si se conoce."
                                    }
                                },
                                required: ["idOrCedula"]
                            }
                        },
                        {
                            name: "wappy_reactivar_trabajador",
                            description: "Alias de wappy_reintegrar_trabajador para reactivar a un trabajador retirado.",
                            parameters: {
                                type: "object",
                                properties: {
                                    idOrCedula: {
                                        type: "string",
                                        description: "Cédula, ID o nombre del trabajador a reactivar."
                                    }
                                },
                                required: ["idOrCedula"]
                            }
                        },
                        {
                            name: "wappy_actualizar_trabajador",
                            description: "Actualiza los datos de un trabajador en el SG-SST (cargo, área, sede, salario, estado laboral 'Activo' o 'Retirado', motivo de retiro).",
                            parameters: {
                                type: "object",
                                properties: {
                                    idOrCedula: {
                                        type: "string",
                                        description: "Cédula, ID o nombre del trabajador a actualizar."
                                    },
                                    nombre: { type: "string", description: "Nombre actualizado" },
                                    cargo: { type: "string", description: "Cargo" },
                                    estadoLaboral: { type: "string", description: "'Activo' o 'Retirado'" },
                                    motivoRetiro: { type: "string", description: "Motivo del retiro si aplica" }
                                },
                                required: ["idOrCedula"]
                            }
                        },
                        {
                            name: "wappy_consultar_trabajadores",
                            description: "Consulta o busca colaboradores en el SG-SST de la empresa activa (Huella Biocéntrica). Permite buscar por nombre, cédula o filtrar por activos/retirados.",
                            parameters: {
                                type: "object",
                                properties: {
                                    filtro: { type: "string", description: "'Activo', 'Retirado' o 'todos'" },
                                    busqueda: { type: "string", description: "Nombre o cédula para buscar" }
                                }
                            }
                        },
                        {
                            name: "wappy_registrar_trabajador",
                            description: "Registra a un nuevo trabajador en el SG-SST de la empresa.",
                            parameters: {
                                type: "object",
                                properties: {
                                    nombre: { type: "string", description: "Nombre completo" },
                                    cedula: { type: "string", description: "Cédula" },
                                    cargo: { type: "string", description: "Cargo" }
                                },
                                required: ["nombre", "cedula", "cargo"]
                            }
                        },
                        {
                            name: "wappy_mcp_sst",
                            description: "Suite oficial de operaciones y consultas MCP del SG-SST de WAPPY (las 41 herramientas). Permite consultar o alimentar de forma autónoma: diagnóstico 360°, empresa, trabajadores, matriz GTC45, matriz PESV, matriz legal, estándares 0312, comités (COPASST, Convivencia, Brigadas), químicos SGA, vehículos, EPP, reportes de actos y condiciones, perfiles de cargo, casos ATEL, cronograma y tareas, capacitaciones, auditorías y automatizaciones.",
                            parameters: {
                                type: "object",
                                properties: {
                                    herramienta: {
                                        type: "string",
                                        description: "Nombre exacto de la herramienta MCP a ejecutar: 'wappy_resumen_general_360', 'wappy_consultar_perfil_empresa', 'wappy_actualizar_perfil_empresa', 'wappy_consultar_matriz_gtc45', 'wappy_alimentar_matriz_gtc45', 'wappy_consultar_matriz_pesv', 'wappy_alimentar_matriz_pesv', 'wappy_consultar_matriz_legal', 'wappy_registrar_requisito_legal', 'wappy_consultar_diagnostico_0312', 'wappy_evaluar_estandar_0312', 'wappy_consultar_trabajadores', 'wappy_registrar_trabajador', 'wappy_actualizar_trabajador', 'wappy_eliminar_trabajador', 'wappy_consultar_comites', 'wappy_registrar_miembro_comite', 'wappy_consultar_epp', 'wappy_registrar_entrega_epp', 'wappy_consultar_perfiles_cargo', 'wappy_guardar_perfil_cargo', 'wappy_consultar_inventario_quimico', 'wappy_registrar_producto_quimico', 'wappy_consultar_vehiculos', 'wappy_registrar_vehiculo', 'wappy_consultar_reportes_actos_condiciones', 'wappy_registrar_reporte_acto_condicion', 'wappy_consultar_casos_atel', 'wappy_registrar_caso_atel', 'wappy_consultar_cronograma_sst', 'wappy_crear_actividad_cronograma', 'wappy_actualizar_estado_tarea', 'wappy_consultar_capacitaciones', 'wappy_programar_capacitacion', 'wappy_consultar_auditorias', 'wappy_registrar_hallazgo_auditoria', 'wappy_consultar_agentes_y_automatizaciones', 'wappy_programar_automatizacion', 'wappy_consultar_conversaciones', 'wappy_consultar_mensajes_conversacion', 'wappy_consultar_archivos'."
                                    },
                                    parametros: {
                                        type: "object",
                                        description: "Argumentos u opciones para la herramienta.",
                                        properties: {
                                            id: { type: "string", description: "ID del elemento o registro" },
                                            cedula: { type: "string", description: "Cédula o número de documento" },
                                            nombre: { type: "string", description: "Nombre del elemento o persona" },
                                            cargo: { type: "string", description: "Cargo del colaborador" },
                                            filtro: { type: "string", description: "Criterio de filtro" },
                                            estado: { type: "string", description: "Estado ('todo', 'in_progress', 'done', etc.)" },
                                            datos: { type: "string", description: "Detalles adicionales en texto o JSON" }
                                        }
                                    }
                                },
                                required: ["herramienta"]
                            }
                        },
                        {
                            name: "wappy_resumen_general_360",
                            description: "Diagnóstico 360° integral de la empresa en WAPPY: consulta en tiempo real el estado general, cantidad de trabajadores, riesgos GTC-45 y PESV, cumplimiento de matriz legal, puntaje de estándares 0312, comités, EPP, inventario químico, flota vehicular, incidentes ATEL y tareas pendientes del cronograma anual.",
                            parameters: {
                                type: "object",
                                properties: {
                                    dummy: { type: "string", description: "Parámetro opcional" }
                                }
                            }
                        },
                        {
                            name: "gestionar_memoria",
                            description: "Permite consultar, guardar o eliminar datos clave en la memoria permanente del usuario (como datos de la empresa, procesos, notas importantes, preferencias).",
                            parameters: {
                                type: "object",
                                properties: {
                                    accion: {
                                        type: "string",
                                        enum: ["consultar", "guardar", "eliminar"],
                                        description: "Acción a realizar: 'consultar' para leer memorias, 'guardar' para almacenar o actualizar un dato, 'eliminar' para borrar un dato."
                                    },
                                    clave: {
                                        type: "string",
                                        description: "Clave o tema de la memoria (ej: 'empresa_activa', 'macroprocesos', 'politica_sst', etc.)."
                                    },
                                    valor: {
                                        type: "string",
                                        description: "Contenido detallado a guardar cuando la acción sea 'guardar'."
                                    }
                                },
                                required: ["accion"]
                            }
                        },
                        {
                            name: "leer_pantalla",
                            description: "Lee e inspecciona el texto, tablas, registros, tarjetas e informes que están visibles en la pantalla actual del usuario. Úsala siempre que el usuario te pida leerle lo que hay en pantalla, leerle un informe reciente o revisar los datos visibles de un aplicativo.",
                            parameters: {
                                type: "object",
                                properties: {
                                    seccion: {
                                        type: "string",
                                        description: "Sección o informe específico a leer (opcional, ej: 'informe', 'tabla', 'todo')."
                                    }
                                }
                            }
                        },
                        {
                            name: "operar_interfaz_visual",
                            description: "Ejecuta una acción visual interactiva en la pantalla del usuario (hacer clic en un botón, escribir texto en un campo, scroll, abrir plan).",
                            parameters: {
                                type: "object",
                                properties: {
                                    accion: {
                                        type: "string",
                                        description: "Acción a ejecutar: 'click', 'escribir', 'scroll', 'esperar', 'abrir_plan'"
                                    },
                                    indice: {
                                        type: "number",
                                        description: "Índice numérico del elemento del DOM a interactuar."
                                    },
                                    texto: {
                                        type: "string",
                                        description: "Texto a escribir si la acción es 'escribir'."
                                    },
                                    direccion: {
                                        type: "string",
                                        description: "Dirección de scroll: 'arriba' o 'abajo'."
                                    },
                                    detalle: {
                                        type: "string",
                                        description: "Descripción del botón o elemento (ej: 'configurar plan', 'abrir tarjeta')"
                                    }
                                },
                                required: ["accion"]
                            }
                        },
                        {
                            name: "wappy_diligenciar_formulario",
                            description: "Diligencia, autocompleta o redacta automáticamente los campos de un formulario o aplicativo en pantalla (por ejemplo, Investigación ATEL, Hoja de vida PESV, Permiso de alturas, Reporte de actos y condiciones, etc.) con datos proporcionados o inferidos.",
                            parameters: {
                                type: "object",
                                properties: {
                                    modulo: {
                                        type: "string",
                                        description: "Nombre clave del aplicativo o formulario. Ejemplos: 'investigacion_atel', 'vehicles_pesv', 'permiso_alturas', 'reporte_actos', 'metodo_owas'."
                                    },
                                    campos: {
                                        type: "object",
                                        description: "Objeto clave-valor con los campos a rellenar en el formulario.",
                                        properties: {
                                            tipoEvento: { type: "string", description: "Incidente, Accidente Leve o Accidente Grave" },
                                            afectadoNombre: { type: "string", description: "Nombre del afectado" },
                                            afectadoCedula: { type: "string", description: "Cédula o identificación" },
                                            afectadoCargo: { type: "string", description: "Cargo del afectado" },
                                            lugarEvento: { type: "string", description: "Lugar del evento" },
                                            descripcionHechos: { type: "string", description: "Descripción de los hechos" },
                                            consecuencias: { type: "string", description: "Consecuencias o lesiones" },
                                            diasIncapacidad: { type: "number", description: "Días de incapacidad" },
                                            datosExtra: { type: "string", description: "Otros datos del formulario" }
                                        }
                                    },
                                    accion: {
                                        type: "string",
                                        enum: ["llenar", "guardar", "generar_ia"],
                                        description: "Acción a realizar en el formulario: 'llenar' para colocar los datos en pantalla."
                                    }
                                },
                                required: ["modulo", "campos"]
                            }
                        },
                        {
                            name: "wappy_abrir_chat_agente",
                            description: "Abre un nuevo chat con uno de los agentes especialistas de WAPPY (Abogado Laboral, Médico Laboral, Fisioterapeuta Laboral, Ingeniero Químico SST, Coordinador PESV, Psicólogo SST, Terapeuta en Salud Mental, Nutricionista Laboral, Primer Respondiente, Coordinador de Emergencias, Especialista en Bioseguridad, Ingeniero Electricista SST, Coordinador de Tareas Críticas, Ingeniero de Minas SST, Auditor SG-SST, Ingeniero Ambiental, Especialista en Riesgo Climático, Redactor Creativo, Simulador de Accidentes SST, Coordinador de Capacitaciones, Consultor Senior SG-SST, Coordinador IPEVAR, Asistente ATS, Asistente TSA, Creador de Formatos, Asistente ACI) y le envía la consulta concreta del usuario. REQUISITO PREVIO OBLIGATORIO: solo invócala cuando el usuario ya te haya dicho QUÉ quiere consultar. Si el usuario solo dice 'abre un chat con el médico' (sin consulta), NO la invoques: primero pregúntale '¿Qué quieres que le consulte al [especialista]?' y espera su respuesta.",
                            parameters: {
                                type: "object",
                                properties: {
                                    agente: {
                                        type: "string",
                                        description: "Nombre o especialidad del agente. Ejemplos: 'abogado_laboral', 'medico_laboral', 'fisioterapeuta_laboral', 'ingeniero_quimico_sst', 'coordinador_seguridad_vial', 'psicologo_sst', 'terapeuta_salud_mental', 'nutricionista_laboral', 'primer_respondiente', 'coordinador_emergencias', 'especialista_bioseguridad', 'ingeniero_electricista_sst', 'coordinador_tareas_criticas', 'ingeniero_minas_sst', 'auditor_sg_sst', 'ingeniero_ambiental', 'especialista_riesgo_climatico', 'redactor_creativo', 'simulador_accidentes', 'coordinador_capacitaciones', 'profesional_sst', 'agente_sst', 'coordinador_ipevar', 'asistente_ats', 'asistente_permiso_tsa', 'creador_formatos', 'asistente_de_aci'"
                                    },
                                    pregunta: {
                                        type: "string",
                                        description: "Consulta técnica estructurada y profesional para el especialista. Redáctala con claridad técnica profesional incluyendo la temática ocupacional o duda del usuario, solicitud de fundamentación normativa colombiana aplicable (ej. Decretos, Resoluciones) y recomendaciones clave para el SG-SST. Nunca envíes frases telegráficas cortas ni saludos vacíos."
                                    },
                                    nuevo_chat: {
                                        type: "boolean",
                                        description: "true si el usuario pide expresamente abrir un nuevo chat, otro chat o cambiar de especialista/tema; false si continúa en la misma conversación o hace preguntas de seguimiento."
                                    }
                                },
                                required: ["agente", "pregunta"]
                            }
                        },
                        {
                            name: "google_drive",
                            description: "Permite interactuar directamente con el Google Drive del usuario: buscar y listar archivos y carpetas (matrices GTC45, reglamentos, actas, inspecciones, etc.) o leer el contenido de documentos (Excel .xlsx/.xls, Word .docx, PDFs, Google Docs, Google Sheets). INVÓCALA SIEMPRE que el usuario te pida entrar, revisar, ver, buscar o consultar archivos de su Google Drive.",
                            parameters: {
                                type: "object",
                                properties: {
                                    action: {
                                        type: "string",
                                        enum: ["list_files_and_folders", "read_document_content", "create_folder", "write_file"],
                                        description: "Acción a realizar en Google Drive: 'list_files_and_folders' para buscar o listar archivos, 'read_document_content' para leer un archivo específico."
                                    },
                                    query: {
                                        type: "string",
                                        description: "Término de búsqueda para listar archivos (ej: 'matriz', 'gtc45', 'rut', 'politica') o el texto a escribir."
                                    },
                                    fileId: {
                                        type: "string",
                                        description: "El ID del archivo en Google Drive para leer su contenido."
                                    },
                                    fileName: {
                                        type: "string",
                                        description: "El nombre del archivo o carpeta que deseas crear."
                                    },
                                    parentId: {
                                        type: "string",
                                        description: "El ID de la carpeta contenedora en Google Drive (opcional)."
                                    }
                                },
                                required: ["action"]
                            }
                        },
                        {
                            name: "canvas_tool",
                            description: "Crea archivos descargables que el usuario recibe en el chat de Tenshi (con botón de descarga) y en el lienzo Canvas: documentos Word ('text'), hojas de cálculo Excel ('excel'), aplicativos/páginas HTML interactivos ('html') o presentaciones ('presentation'). INVÓCALA siempre que el usuario pida crear, redactar, generar o entregar un documento, informe, protocolo, formato, matriz, tabla, hoja de cálculo, aplicativo, prototipo, landing page, dashboard o página. Cada invocación con accion='crear' genera un archivo NUEVO e independiente.",
                            parameters: {
                                type: "object",
                                properties: {
                                    accion: {
                                        type: "string",
                                        enum: ["crear"],
                                        description: "Siempre 'crear' para generar un archivo nuevo."
                                    },
                                    fileType: {
                                        type: "string",
                                        enum: ["html", "text", "excel", "presentation"],
                                        description: "Tipo de archivo según lo que pida el usuario: 'text' = documento Word (informes, protocolos, políticas, actas, cartas, procedimientos); 'excel' = hoja de cálculo (matrices, listados, indicadores tabulares, cronogramas); 'html' = aplicativo, prototipo o página web interactiva (landing pages, dashboards, calculadoras, apps interactivas); 'presentation' = diapositivas. Si el usuario dice 'landing page', 'prototipo', 'aplicativo', 'página' o 'en HTML', usa 'html'; si dice 'en Word', usa 'text'; si dice 'en Excel', usa 'excel'."
                                    },
                                    title: {
                                        type: "string",
                                        description: "Título fiel a lo que pidió el usuario (ej: 'Protocolo de Despido Laboral', 'Indicadores de Accidentalidad Res. 0312', 'Landing Page de Incapacidades Prolongadas')."
                                    },
                                    content: {
                                        type: "string",
                                        description: "Contenido del archivo (opcional si es 'html' ya que el sistema lo genera automáticamente con Tailwind y gráficos si se omite, obligatorio para text/excel)."
                                    }
                                },
                                required: ["accion", "fileType", "title"]
                            }
                        },
                        {
                            name: "web_search",
                            description: "Busca información actualizada en tiempo real en Internet (noticias, normatividad SST, decretos, resoluciones, estadísticas, documentación técnica, etc.). Utiliza el motor de búsqueda avanzado de WAPPY.",
                            parameters: {
                                type: "object",
                                properties: {
                                    query: {
                                        type: "string",
                                        description: "La consulta de búsqueda a ejecutar en internet. Sé específico e incluye términos clave relevantes (ej: 'Resolución 0312 de 2019 Colombia Mintrabajo', 'que es burnout sintomas prevencion')."
                                    }
                                },
                                required: ["query"]
                            }
                        },
                        {
                            name: "somos_sst",
                            description: "Herramienta oficial de SOMOS SST (anteriormente SGSST). Permite consultar y editar cualquier información en sus 2 MÓDULOS PRINCIPALES: el Motor Bio-Individual (Bio Motor - expediente del trabajador, exámenes médicos, accidentes ATEL, Hitos) y el Ecosistema SG-SST General (matrices GTC45, EPP, alturas, ATS, capacitaciones, políticas, Centro de Control ACPM y estadísticas en tiempo real).",
                            parameters: {
                                type: "object",
                                properties: {
                                    accion: {
                                        type: "string",
                                        description: "Acción a ejecutar: 'actualizar_informacion_empresa', 'consultar_expediente_integral', 'listar_trabajadores', 'resumen_empresa', 'actualizar_examen_medico', 'registrar_accidente_atel', 'actualizar_hito_tarea', 'editar_cualquier_aplicativo', 'generar_informe_html', 'consultar_historial_informes', 'consultar_planes_y_sistema', 'consultar_centro_control_acpm', 'crear_actividad_acpm', 'actualizar_actividad_acpm', 'crear_trabajador'."
                                    },
                                    razon_social: { type: "string", description: "Razón Social o Nombre legal de la empresa" },
                                    tipo_empresa: { type: "string", description: "'Persona Jurídica' o 'Persona Natural'" },
                                    nit: { type: "string", description: "Número de Identificación Tributaria (NIT)" },
                                    representante_legal: { type: "string", description: "Nombre del Representante Legal" },
                                    cedula_representante: { type: "string", description: "Cédula o ID del Representante Legal" },
                                    numero_trabajadores: { type: "number", description: "Número total de trabajadores" },
                                    arl: { type: "string", description: "Nombre de la ARL afiliada" },
                                    actividad_economica: { type: "string", description: "Actividad económica principal" },
                                    nivel_riesgo: { type: "string", description: "Nivel de riesgo ARL (I, II, III, IV, V)" },
                                    ciiu: { type: "string", description: "Código CIIU" },
                                    direccion: { type: "string", description: "Dirección física de la sede principal" },
                                    ciudad: { type: "string", description: "Ciudad o municipio" },
                                    departamento: { type: "string", description: "Departamento" },
                                    telefono: { type: "string", description: "Teléfono de contacto" },
                                    correo: { type: "string", description: "Correo electrónico corporativo" },
                                    datos_json: { type: "string", description: "Datos estructurados en formato JSON o texto para guardado masivo" },
                                    tipo_informe: { type: "string", description: "Tipo de informe formal HTML a generar" },
                                    titulo_informe: { type: "string", description: "Título del informe formal HTML" },
                                    contenido_html: { type: "string", description: "Contenido HTML del informe" },
                                    nombre_o_cargo: { type: "string", description: "Nombre completo del trabajador o cargo" },
                                    identificacion: { type: "string", description: "Cédula o ID del trabajador" },
                                    fecha_examen: { type: "string", description: "Fecha del examen médico (YYYY-MM-DD)" },
                                    concepto_diagnostico: { type: "string", description: "Concepto o aptitud médica laboral" },
                                    restricciones: { type: "string", description: "Restricciones médicas" },
                                    tipo_siniestro: { type: "string", description: "Tipo de evento ATEL: 'AT', 'EL', 'Ausentismo'" },
                                    dias_incapacidad: { type: "string", description: "Días de incapacidad" },
                                    descripcion_hechos: { type: "string", description: "Descripción de los hechos o accidente" },
                                    nombre_aplicativo: {
                                        type: "string",
                                        description: "Nombre del aplicativo a editar: 'empresa', 'cargos', 'estudio_puesto', 'auditoria', 'diagnostico', 'epp', 'alturas', 'ats', 'vehiculos', 'capacitaciones', 'gtc45', 'owas', 'actos', 'vulnerabilidad', 'quimicos', 'kanban', 'politica', 'matriz_legal', 'rhs', 'rit', 'estadisticas'."
                                    },
                                    propiedad_o_ruta: { type: "string", description: "Campo o propiedad a modificar" },
                                    nuevo_valor: { type: "string", description: "Nuevo valor a asignar" },
                                    titulo_actividad: { type: "string", description: "Título de la actividad para el Centro de Control ACPM" },
                                    descripcion_actividad: { type: "string", description: "Detalles o descripción de la actividad ACPM" },
                                    fecha_vencimiento: { type: "string", description: "Fecha de vencimiento (YYYY-MM-DD o 'mañana')" },
                                    estado_actividad: { type: "string", description: "'todo', 'due_soon', 'overdue', 'done'" },
                                    tipo_actividad: { type: "string", description: "'manual', 'medical_exam', 'training', 'other'" }
                                },
                                required: ["accion"]
                            }
                        },
                        {
                            name: "matriz_ipevar",
                            description: "Lee, añade, evalúa o actualiza riesgos laborales directamente en la Matriz GTC-45 / IPEVAR. Usa esta herramienta para leer, documentar o evaluar peligros en la matriz IPEVR / GTC-45.",
                            parameters: {
                                type: "object",
                                properties: {
                                    accion: { type: "string", description: "Acción: 'consultar_contexto_sgsst', 'leer', 'escribir', 'borrar'" },
                                    filtro_proceso: { type: "string", description: "Filtro por proceso o cargo" },
                                    filtro_cargo: { type: "string", description: "Filtro por cargo" },
                                    filtro_actividad: { type: "string", description: "Filtro por actividad" },
                                    filtro_peligro: { type: "string", description: "Filtro por peligro" },
                                    ids_a_borrar: { type: "array", items: { type: "string" }, description: "IDs de riesgos a eliminar cuando accion='borrar'" },
                                    riesgos: {
                                        type: "array",
                                        items: {
                                            type: "object",
                                            properties: {
                                                cargo: { type: "string" },
                                                proceso: { type: "string" },
                                                zona: { type: "string" },
                                                actividad: { type: "string" },
                                                tareas: { type: "string" },
                                                rutinaria: { type: "string", description: "'Sí' o 'No'" },
                                                peligro_descripcion: { type: "string" },
                                                peligro_clasificacion: { type: "string" },
                                                efectos_posibles: { type: "string" },
                                                controles_fuente: { type: "string" },
                                                controles_medio: { type: "string" },
                                                controles_individuo: { type: "string" },
                                                nd: { type: "number" },
                                                ne: { type: "number" },
                                                nc: { type: "number" },
                                                medida_eliminacion: { type: "string" },
                                                medida_sustitucion: { type: "string" },
                                                medida_ingenieria: { type: "string" },
                                                medida_administrativa: { type: "string" },
                                                medida_eppu: { type: "string" },
                                                factores_reduccion: { type: "string" },
                                                nd_cualitativo: { type: "number" },
                                                nro_expuestos: { type: "number" },
                                                peor_consecuencia: { type: "string" },
                                                requisito_legal: { type: "string" }
                                            },
                                            required: ["proceso", "zona", "actividad", "tareas", "rutinaria", "peligro_descripcion", "peligro_clasificacion", "efectos_posibles", "nd", "ne", "nc"]
                                        },
                                        description: "Lista de riesgos a registrar cuando accion='escribir'"
                                    }
                                },
                                required: ["accion"]
                            }
                        },
                        {
                            name: "matriz_pesv",
                            description: "Lee, añade, evalúa o actualiza riesgos viales en la Matriz PESV (Plan Estratégico de Seguridad Vial - Res. 20223040040595).",
                            parameters: {
                                type: "object",
                                properties: {
                                    accion: { type: "string", description: "Acción: 'consultar_contexto_sgsst', 'leer', 'escribir', 'borrar'" },
                                    filtro_proceso: { type: "string" },
                                    filtro_cargo: { type: "string" },
                                    filtro_actor_vial: { type: "string" },
                                    filtro_peligro: { type: "string" },
                                    ids_a_borrar: { type: "array", items: { type: "string" } },
                                    riesgos: {
                                        type: "array",
                                        items: {
                                            type: "object",
                                            properties: {
                                                grupo_trabajo: { type: "string" },
                                                cargo: { type: "string" },
                                                tipo_desplazamiento: { type: "string" },
                                                rol_via: { type: "string" },
                                                factor_riesgo: { type: "string" },
                                                peligro_descripcion: { type: "string" },
                                                np_cualitativo: { type: "string" },
                                                ne_cualitativo: { type: "string" },
                                                nc_cualitativo: { type: "string" },
                                                controles_existentes_descripcion: { type: "string" },
                                                controles_existentes_tipo: { type: "string" },
                                                tratamiento_accion: { type: "string" },
                                                plan_accion_medio: { type: "string" },
                                                plan_accion_vehiculo: { type: "string" },
                                                plan_accion_individuo: { type: "string" },
                                                plan_accion_infraestructura: { type: "string" },
                                                responsable: { type: "string" },
                                                fecha_programacion: { type: "string" },
                                                estado: { type: "string" },
                                                observaciones: { type: "string" }
                                            },
                                            required: ["grupo_trabajo", "cargo", "tipo_desplazamiento", "rol_via", "factor_riesgo", "peligro_descripcion", "np_cualitativo", "ne_cualitativo", "nc_cualitativo"]
                                        },
                                        description: "Lista de riesgos viales a registrar cuando accion='escribir'"
                                    }
                                },
                                required: ["accion"]
                            }
                        },
                        {
                            name: "matriz_compatibilidad",
                            description: "Lee, añade, evalúa o actualiza inventarios de productos químicos en la Matriz de Compatibilidad y Almacenamiento Seguro SGA.",
                            parameters: {
                                type: "object",
                                properties: {
                                    accion: { type: "string", description: "Acción: 'consultar_contexto_sgsst', 'leer', 'escribir', 'borrar'" },
                                    filtro_nombre: { type: "string" },
                                    filtro_ubicacion: { type: "string" },
                                    filtro_clase: { type: "string" },
                                    ids_a_borrar: { type: "array", items: { type: "string" } },
                                    productos: {
                                        type: "array",
                                        items: {
                                            type: "object",
                                            properties: {
                                                nombre: { type: "string" },
                                                fabricante: { type: "string" },
                                                estado_fisico: { type: "string" },
                                                clasificacion_onu: { type: "string" },
                                                pictogramas_sga: { type: "array", items: { type: "string" } },
                                                cantidad_almacenada: { type: "string" },
                                                ubicacion: { type: "string" },
                                                tiene_fds: { type: "string" },
                                                tiene_rotulo: { type: "string" },
                                                incompatibilidades: { type: "string" },
                                                requisitos_almacenamiento: { type: "string" }
                                            },
                                            required: ["nombre", "clasificacion_onu"]
                                        },
                                        description: "Lista de sustancias químicas a registrar cuando accion='escribir'"
                                    }
                                },
                                required: ["accion"]
                            }
                        },
                        {
                            name: "gestor_automatizaciones",
                            description: "Crea, lista, actualiza, ejecuta o elimina automatizaciones de tareas periódicas en segundo plano (/sgsst/automatizaciones).",
                            parameters: {
                                type: "object",
                                properties: {
                                    accion: { type: "string", description: "'crear', 'listar', 'actualizar', 'eliminar', 'ejecutar_ahora', 'ver_logs'" },
                                    nombre: { type: "string", description: "Nombre claro de la automatización" },
                                    agente_objetivo: { type: "string", description: "Agente que ejecutará la tarea periódica" },
                                    prompt_a_ejecutar: { type: "string", description: "Instrucción detallada a ejecutar periódicamente" },
                                    tipo_frecuencia: { type: "string", description: "'daily', 'weekly', 'monthly', 'hourly'" },
                                    configuracion_horario: {
                                        type: "object",
                                        properties: {
                                            hora: { type: "number" },
                                            minuto: { type: "number" },
                                            dias_semana: { type: "array", items: { type: "number" } },
                                            dia_mes: { type: "number" },
                                            intervalo_horas: { type: "number" }
                                        }
                                    },
                                    correos_notificacion: { type: "array", items: { type: "string" } },
                                    automatizacion_id: { type: "string", description: "ID de la automatización para actualizar/eliminar/ejecutar" },
                                    nuevo_estado: { type: "string", description: "'active' o 'inactive'" }
                                },
                                required: ["accion"]
                            }
                        },
                        {
                            name: "google_sheets",
                            description: "Interactúa con Google Sheets: crea hojas de cálculo, lee rangos de celdas, actualiza valores, añade filas y aplica formatos.",
                            parameters: {
                                type: "object",
                                properties: {
                                    action: { type: "string", description: "'create_spreadsheet', 'read_spreadsheet', 'update_spreadsheet_values', 'append_spreadsheet_values', 'format_spreadsheet'" },
                                    spreadsheetId: { type: "string", description: "ID de la hoja de cálculo de Google" },
                                    title: { type: "string", description: "Título de la hoja a crear" },
                                    range: { type: "string", description: "Rango A1 (ej: 'Sheet1!A1:D10')" },
                                    values: {
                                        type: "array",
                                        items: { type: "array", items: { type: "string" } },
                                        description: "Matriz bidimensional de datos a escribir o añadir"
                                    },
                                    sheetId: { type: "number", description: "ID numérico de la pestaña" },
                                    headerColorHex: { type: "string", description: "Color hex de cabecera" }
                                },
                                required: ["action"]
                            }
                        },
                        {
                            name: "google_docs",
                            description: "Interactúa con Google Docs: crea nuevos documentos, lee su texto completo, sobrescribe o añade contenido al final.",
                            parameters: {
                                type: "object",
                                properties: {
                                    action: { type: "string", description: "'create_document', 'read_document', 'write_to_document', 'append_to_document'" },
                                    documentId: { type: "string", description: "ID del documento de Google" },
                                    title: { type: "string", description: "Título del documento a crear" },
                                    text: { type: "string", description: "Contenido de texto o Markdown a redactar" }
                                },
                                required: ["action"]
                            }
                        },
                        {
                            name: "google_slides",
                            description: "Interactúa con Google Slides: crea presentaciones ejecutivas, añade diapositivas y lee la estructura.",
                            parameters: {
                                type: "object",
                                properties: {
                                    action: { type: "string", description: "'create_presentation', 'add_slide', 'read_presentation'" },
                                    presentationId: { type: "string", description: "ID de la presentación de Google Slides" },
                                    title: { type: "string", description: "Título de la presentación o diapositiva" },
                                    bodyText: { type: "string", description: "Texto del cuerpo de la diapositiva" },
                                    slideLayout: { type: "string", description: "'TITLE_AND_BODY', 'TITLE', 'SECTION_HEADER', 'BLANK'" },
                                    slideType: { type: "string", description: "'TITLE_SLIDE' o 'CONTENT_SLIDE'" }
                                },
                                required: ["action"]
                            }
                        },
                        {
                            name: "google_gmail",
                            description: "Envía correos electrónicos o crea borradores en Gmail desde la cuenta del usuario.",
                            parameters: {
                                type: "object",
                                properties: {
                                    action: { type: "string", description: "'send_email' o 'create_draft'" },
                                    to: { type: "string", description: "Dirección de correo electrónico del destinatario" },
                                    subject: { type: "string", description: "Asunto del correo electrónico" },
                                    body: { type: "string", description: "Contenido del mensaje (HTML o texto)" },
                                    cc: { type: "string", description: "Correos en copia" },
                                    bcc: { type: "string", description: "Correos en copia oculta" }
                                },
                                required: ["action", "to", "subject", "body"]
                            }
                        },
                        {
                            name: "google_calendar",
                            description: "Interactúa con Google Calendar: crea eventos/recordatorios, lista eventos por fecha y elimina eventos.",
                            parameters: {
                                type: "object",
                                properties: {
                                    action: { type: "string", description: "'create_event', 'list_events', 'delete_event'" },
                                    title: { type: "string", description: "Título o resumen del evento" },
                                    description: { type: "string", description: "Detalles del evento" },
                                    startTime: { type: "string", description: "Fecha y hora de inicio (ISO)" },
                                    endTime: { type: "string", description: "Fecha y hora de finalización (ISO)" },
                                    timeMin: { type: "string", description: "Fecha de inicio para listar eventos" },
                                    timeMax: { type: "string", description: "Fecha de fin para listar eventos" },
                                    eventId: { type: "string", description: "ID del evento a eliminar" }
                                },
                                required: ["action"]
                            }
                        },
                        {
                            name: "onedrive",
                            description: "Interactúa con Microsoft OneDrive: busca archivos/carpetas, lee documentos (Word, Excel, PDF) y escribe archivos.",
                            parameters: {
                                type: "object",
                                properties: {
                                    action: { type: "string", description: "'list_files_and_folders', 'read_document_content', 'create_folder', 'write_file'" },
                                    query: { type: "string", description: "Término de búsqueda o contenido a escribir" },
                                    fileId: { type: "string", description: "ID del archivo o carpeta en OneDrive" },
                                    fileName: { type: "string", description: "Nombre del archivo o carpeta" },
                                    parentId: { type: "string", description: "ID de la carpeta contenedora" }
                                },
                                required: ["action"]
                            }
                        },
                        {
                            name: "editor_rit",
                            description: "Editor especializado para el Reglamento Interno de Trabajo (RIT): cargar plantilla tradicional/humanista, leer y editar secciones.",
                            parameters: {
                                type: "object",
                                properties: {
                                    accion: { type: "string", description: "'cargar_plantilla', 'leer', 'escribir', 'editar_seccion', 'buscar_reemplazar', 'insertar'" },
                                    tono: { type: "string", description: "'tradicional' o 'humanista'" },
                                    content: { type: "string", description: "Contenido HTML completo" },
                                    fileName: { type: "string", description: "Nombre descriptivo del documento" },
                                    titulo_seccion: { type: "string", description: "Título de la sección a editar" },
                                    nuevo_contenido_seccion: { type: "string", description: "Nuevo contenido de la sección" },
                                    buscar: { type: "string", description: "Texto a buscar" },
                                    reemplazar: { type: "string", description: "Texto de reemplazo" }
                                },
                                required: ["accion"]
                            }
                        },
                        {
                            name: "consultar_analitica_psicosocial",
                            description: "Consulta de forma anónima y consolidada los datos de estado de ánimo, clima laboral y factores de estrés de los trabajadores.",
                            parameters: {
                                type: "object",
                                properties: {
                                    dias: { type: "number", description: "Días de historial hacia atrás (por defecto 30)" },
                                    departamento: { type: "string", description: "Área o departamento a filtrar" }
                                }
                            }
                        },
                        {
                            name: "consultar_analitica_actos_condiciones",
                            description: "Consulta estadísticas de actos y condiciones inseguras, áreas críticas y tendencias de seguridad en el buzón.",
                            parameters: {
                                type: "object",
                                properties: {
                                    accion: { type: "string", description: "'obtener_analisis' o 'marcar_procesado'" },
                                    reportId: { type: "string", description: "ID del reporte a marcar procesado" },
                                    dias: { type: "number", description: "Días de historial a analizar (por defecto 30)" }
                                }
                            }
                        },
                        {
                            name: "consultar_agente_especializado",
                            description: "Delegación y Orquestación Multi-Agente: Abre el chat y consulta a un Agente Especialista del sistema (Médico Laboral, Abogado Laboral, etc.) para resolver dudas técnicas complejas.",
                            parameters: {
                                type: "object",
                                properties: {
                                    nombre_especialista: { type: "string", description: "Nombre o rol del agente especialista a consultar." },
                                    consulta_completa: { type: "string", description: "Consulta técnica detallada para el especialista." },
                                    nuevo_chat: { type: "boolean", description: "true si el usuario pide expresamente abrir un nuevo chat, otro chat o cambiar de tema; false si continúa en la misma conversación." }
                                },
                                required: ["nombre_especialista", "consulta_completa"]
                            }
                        },
                        {
                            name: "wappy_leer_informe_aplicativo",
                            description: "Lee e inspecciona el informe técnico oficial de cualquiera de los 20 aplicativos del SG-SST (Perfiles de Cargo, Matriz IPEVAR / GTC-45, Diagnóstico Res. 0312, Sociodemográfico y Salud, Vulnerabilidad y Emergencias, Ergonomía OWAS, Estudio de Puesto de Trabajo, ATS, Alturas, Matriz Legal, Comités COPASST, Capacitaciones, EPP, Investigación ATEL, PESV, Químicos SGA, Actos y Condiciones, Vehículos, Cronograma, Auditoría Anual). Si se trata de perfiles de cargo, consulta el catálogo completo de todos los cargos de la empresa y el informe del cargo seleccionado o solicitado.",
                            parameters: {
                                type: "object",
                                properties: {
                                    aplicativo: {
                                        type: "string",
                                        description: "Nombre o clave del aplicativo: 'perfil_cargo', 'gtc45', 'diagnostico_0312', 'investigacion_atel', 'pesv', 'quimicos', 'auditoria', 'perfil_socio', 'vulnerabilidad', 'owas', 'estudio_puesto', 'ats', 'alturas', 'legal', 'comites', 'capacitaciones', 'epp', 'actos_condiciones', 'vehiculos', 'cronograma'."
                                    },
                                    cargo: {
                                        type: "string",
                                        description: "Nombre puntual del cargo para consultar su perfil específico (ej: 'Conductor', 'Operario', 'Auxiliar contable', 'Gerente')."
                                    },
                                    id: {
                                        type: "string",
                                        description: "ID opcional del caso o registro a consultar."
                                    }
                                },
                                required: ["aplicativo"]
                            }
                        },
                        {
                            name: "wappy_consultar_cursos",
                            description: "Consulta y lista todos los cursos formativos disponibles en WAPPY Academia / LMS. Retorna los títulos, cantidad de lecciones de cada uno y descripción temática. Invócala cuando el usuario pregunte por los cursos de la academia.",
                            parameters: {
                                type: "object",
                                properties: {
                                    busqueda: {
                                        type: "string",
                                        description: "Término de búsqueda opcional por tema o palabra clave."
                                    }
                                }
                            }
                        },
                        {
                            name: "wappy_leer_curso",
                            description: "Lee e inspecciona el contenido detallado de un curso de WAPPY Academia por su ID o título. Retorna todas sus lecciones con sus contenidos formativos, temario, recursos y exámenes.",
                            parameters: {
                                type: "object",
                                properties: {
                                    curso: {
                                        type: "string",
                                        description: "Título o ID del curso a leer e inspeccionar."
                                    }
                                },
                                required: ["curso"]
                            }
                        },
                        {
                            name: "wappy_consultar_blog",
                            description: "Consulta el catálogo de artículos y publicaciones técnicas en el Blog de WAPPY. Retorna el listado de publicaciones, títulos, etiquetas temáticas y resúmenes.",
                            parameters: {
                                type: "object",
                                properties: {
                                    busqueda: {
                                        type: "string",
                                        description: "Término de búsqueda opcional para filtrar artículos del blog."
                                    }
                                }
                            }
                        },
                        {
                            name: "wappy_leer_articulo_blog",
                            description: "Lee el contenido íntegro y exhaustivo de cualquier artículo del Blog de WAPPY por su ID o título. Retorna todo el texto, análisis técnico y recomendaciones del artículo.",
                            parameters: {
                                type: "object",
                                properties: {
                                    articulo: {
                                        type: "string",
                                        description: "Título o ID del artículo del blog a leer."
                                    }
                                },
                                required: ["articulo"]
                            }
                        },
                        {
                            name: "wappy_activar_herramienta_agente",
                            description: "Activa y ejecuta de inmediato cualquiera de las herramientas especializadas de los agentes de WAPPY ('canvas', 'matriz_ipevar', 'matriz_pesv', 'matriz_compatibilidad', 'gestor_automatizaciones', 'consultar_analitica_psicosocial', 'consultar_analitica_actos_condiciones', 'editor_live', 'generar_imagen_sst'). Invócala cuando el usuario pida abrir o activar una herramienta de un agente.",
                            parameters: {
                                type: "object",
                                properties: {
                                    herramienta: {
                                        type: "string",
                                        description: "Nombre de la herramienta especializada: 'canvas', 'matriz_ipevar', 'matriz_pesv', 'matriz_compatibilidad', 'gestor_automatizaciones', 'consultar_analitica_psicosocial', 'consultar_analitica_actos_condiciones', 'editor_live', 'generar_imagen_sst'."
                                    },
                                    parametros: {
                                        type: "object",
                                        description: "Parámetros o argumentos específicos para la herramienta.",
                                        properties: {
                                            accion: { type: "string", description: "Acción a realizar en la herramienta" },
                                            datos: { type: "string", description: "Datos, contenido o configuración" }
                                        }
                                    }
                                },
                                required: ["herramienta"]
                            }
                        },
                        {
                            name: "wappy_crear_informe",
                            description: "Crea y genera un informe técnico oficial del SG-SST (para cualquiera de los 20 módulos o general) y lo entrega de inmediato en el chat de Tenshi con visualizador y botones de descarga (Word, Excel o HTML interactivo). INVÓCALA SIEMPRE que el usuario te pida crear, generar, redactar o entregar un informe, reporte o dictamen técnico para que lo reciba directamente en su chat sin abrir otros chats.",
                            parameters: {
                                type: "object",
                                properties: {
                                    titulo: {
                                        type: "string",
                                        description: "Título formal del informe (ej: 'Informe Técnico de Investigación ATEL', 'Informe Diagnóstico Res. 0312', 'Informe de Análisis Ergonómico OWAS')."
                                    },
                                    aplicativo: {
                                        type: "string",
                                        description: "Módulo o aplicativo del SG-SST: 'investigacion_atel', 'gtc45', 'diagnostico_0312', 'perfil_cargo', 'perfil_socio', 'vulnerabilidad', 'owas', 'estudio_puesto', 'ats', 'alturas', 'legal', 'comites', 'capacitaciones', 'epp', 'actos_condiciones', 'pesv', 'quimicos', 'vehiculos', 'cronograma', 'auditoria' o 'general'."
                                    },
                                    formato: {
                                        type: "string",
                                        enum: ["html", "text", "excel"],
                                        description: "Formato del informe: 'html' (reporte corporativo interactivo), 'text' (documento Word / Markdown), 'excel' (hoja de cálculo)."
                                    },
                                    contenido: {
                                        type: "string",
                                        description: "Contenido técnico exhaustivo del informe en Markdown o HTML, estructurado con introducción, marco legal colombiano (Decreto 1072, Resoluciones), hallazgos, indicadores, plan de mejora y firmas."
                                    }
                                },
                                required: ["titulo", "aplicativo"]
                            }
                        },
                        {
                            name: "wappy_enviar_correo",
                            description: "Redacta y envía un correo electrónico formal a cualquier destinatario (colaborador, gerencia, ARL o al usuario) utilizando Google Gmail (si está conectado) o el servidor oficial de WAPPY. Puedes enviar mensajes, recordatorios o adjuntar/enviar el informe técnico recién creado.",
                            parameters: {
                                type: "object",
                                properties: {
                                    destinatario: {
                                        type: "string",
                                        description: "Dirección de correo electrónico del destinatario (ej: 'gerencia@empresa.com' o 'mi correo' para enviar al usuario)."
                                    },
                                    asunto: {
                                        type: "string",
                                        description: "Asunto del correo electrónico."
                                    },
                                    mensaje: {
                                        type: "string",
                                        description: "Cuerpo del mensaje o informe a enviar (soporta texto plano o HTML profesional)."
                                    }
                                },
                                required: ["destinatario", "asunto", "mensaje"]
                            }
                        },
                        {
                            name: "wappy_gestionar_agenda",
                            description: "Gestiona la agenda, calendario y compromisos del SG-SST en Google Calendar y en el cronograma de WAPPY. Permite agendar inspecciones, capacitaciones, auditorías, comités COPASST o citas médicas laborales, así como listar eventos próximos y cancelar compromisos.",
                            parameters: {
                                type: "object",
                                properties: {
                                    accion: {
                                        type: "string",
                                        enum: ["agendar_evento", "listar_agenda", "eliminar_evento"],
                                        description: "Acción a realizar: 'agendar_evento' para programar, 'listar_agenda' para ver compromisos próximos, 'eliminar_evento' para cancelar."
                                    },
                                    titulo: {
                                        type: "string",
                                        description: "Título o motivo del evento (ej: 'Inspección de Extintores', 'Capacitación Primeros Auxilios', 'Reunión COPASST')."
                                    },
                                    fecha_inicio: {
                                        type: "string",
                                        description: "Fecha y hora de inicio en formato ISO o YYYY-MM-DD HH:mm (ej: '2026-10-15T09:00:00')."
                                    },
                                    fecha_fin: {
                                        type: "string",
                                        description: "Fecha y hora de finalización en formato ISO (opcional)."
                                    },
                                    descripcion: {
                                        type: "string",
                                        description: "Descripción detallada del evento o cita."
                                    },
                                    tipo: {
                                        type: "string",
                                        description: "Tipo de actividad: 'manual', 'training', 'medical_exam', 'audit_finding', 'copasst_finding', 'other'."
                                    },
                                    id_evento: {
                                        type: "string",
                                        description: "ID del evento para eliminar o consultar."
                                    }
                                },
                                required: ["accion"]
                            }
                        },
                        {
                            name: "wappy_generar_qr",
                            description: "Genera y entrega un código QR interactivo y enlace público directamente en el chat de Tenshi para que los trabajadores reporten desde su celular. Tipos disponibles: 'actos_condiciones' (reporte de actos y condiciones inseguras), 'termometro_psicosocial' (check-in de ánimo, estrés y salud mental), 'estudio_puesto' (auto-reporte ergonómico), 'ipevar' (participación en riesgos GTC-45), 'perfil_salud' (sociodemográfico), 'atel_testimonio' (testimonio de accidentes), 'colaborador_hub' (portal integral del colaborador), 'inspeccion_vehicular' (PESV), 'solicitud_epp', 'copasst_inspecciones', 'votaciones', 'ruta_aprendizaje'.",
                            parameters: {
                                type: "object",
                                properties: {
                                    tipo: {
                                        type: "string",
                                        description: "Tipo de módulo: 'actos_condiciones', 'termometro_psicosocial', 'estudio_puesto', 'ipevar', 'perfil_salud', 'atel_testimonio', 'colaborador_hub', 'inspeccion_vehicular', 'solicitud_epp', 'copasst_inspecciones', 'votaciones', 'ruta_aprendizaje'."
                                    }
                                },
                                required: ["tipo"]
                            }
                        },
                        {
                            name: "wappy_consultar_analitica_psicosocial",
                            description: "Consulta las métricas y telemetría de salud mental, estrés y bienestar del Termómetro Psicosocial de la empresa (total de check-ins, distribución de felicidad, neutralidad y estrés, factores de sobrecarga y recomendaciones preventivas SST).",
                            parameters: {
                                type: "object",
                                properties: {}
                            }
                        },
                        {
                            name: "wappy_consultar_analitica_actos_condiciones",
                            description: "Consulta las estadísticas y métricas analíticas de los reportes preventivos de actos y condiciones inseguras reportados por los colaboradores (desglose por tipo, nivel de riesgo alto/medio/bajo, sedes y áreas con mayor recurrencia).",
                            parameters: {
                                type: "object",
                                properties: {}
                            }
                        },
                        {
                            name: "wappy_consultar_quimico_pubchem",
                            description: "Consulta la API oficial de PubChem (NIH) para obtener el CID, clasificación oficial GHS / SGA, pictogramas de seguridad, palabras de advertencia (Peligro/Atención) y frases de peligro H y consejos P de cualquier sustancia o producto químico conforme al Decreto 1496 de 2018.",
                            parameters: {
                                type: "object",
                                properties: {
                                    nombre: {
                                        type: "string",
                                        description: "Nombre de la sustancia química en español o inglés (ej: benceno, xileno, cloro, acetona, acido sulfurico, thinner)."
                                    }
                                },
                                required: ["nombre"]
                            }
                        },
                        {
                            name: "wappy_geocodificar_emergencias",
                            description: "Consulta la API de OpenStreetMap Nominatim para geolocalizar direcciones de sedes de la empresa y ubicar recursos externos de emergencia cercanos (hospitales, clínicas, estaciones de bomberos, defensa civil, centros de urgencias) para el Plan de Prevención y Preparación ante Emergencias.",
                            parameters: {
                                type: "object",
                                properties: {
                                    query: {
                                        type: "string",
                                        description: "Término de búsqueda o recurso a geolocalizar (ej: 'hospital Chapinero Bogota', 'bomberos cerca de Calle 100 Bogota', 'clinica Medellin')."
                                    }
                                },
                                required: ["query"]
                            }
                        },
                        {
                            name: "wappy_consultar_clima_viento",
                            description: "Consulta la API de Open-Meteo para obtener en tiempo real la velocidad del viento, ráfagas, temperatura y pronóstico diario meteorológico para evaluar riesgos climáticos en trabajos en alturas (Resolución 4272 de 2021), espacios confinados y operaciones en campo.",
                            parameters: {
                                type: "object",
                                properties: {
                                    latitude: {
                                        type: "number",
                                        description: "Latitud geográfica de la sede o frente de obra (ej: 4.6097 para Bogotá, 6.2442 para Medellín)."
                                    },
                                    longitude: {
                                        type: "number",
                                        description: "Longitud geográfica de la sede (ej: -74.0817 para Bogotá, -75.5812 para Medellín)."
                                    }
                                }
                            }
                        },
                        {
                            name: "wappy_delegar_orden_antigravity",
                            description: "Delega una orden de trabajo, investigación profunda o análisis de archivos locales a Google Antigravity en la computadora del usuario. Se utiliza cuando el usuario pide por voz a Tenshi que Antigravity investigue, revise carpetas locales de su computador o desarrolle entregables (Word, Excel, PDF, presentaciones, HTML) para luego reflejarlos en este chat de Tenshi.",
                            parameters: {
                                type: "object",
                                properties: {
                                    instruccion: {
                                        type: "string",
                                        description: "Instrucción o tarea detallada que Antigravity debe realizar."
                                    },
                                    carpeta_o_recurso: {
                                        type: "string",
                                        description: "Ruta de la carpeta local en el computador del usuario o Google Drive que Antigravity debe inspeccionar."
                                    },
                                    tipo_entregable: {
                                        type: "string",
                                        description: "Tipo de documento o entregable esperado: word, excel, pdf, presentacion, html o informe."
                                    },
                                    titulo: {
                                        type: "string",
                                        description: "Título descriptivo de la orden de trabajo."
                                    }
                                },
                                required: ["instruccion"]
                            }
                        }
                    ]
                }
            ];

            this.liveConfig.systemInstruction = `[DIRECTIVA CRÍTICA DE IDIOMA, CONDUCTA Y PROFESIONALISMO]:
- IDIOMA EXCLUSIVO: ESPAÑOL DE COLOMBIA / LATINOAMÉRICA.
- El usuario habla ÚNICA Y EXCLUSIVAMENTE en ESPAÑOL.
- ESTÁ TERMINANTEMENTE PROHIBIDO interpretar o responder en inglés o cualquier otro idioma. Prohibido añadir frases, coletillas o cierres en inglés ("that's all set", "all set", "I've already conveyed...", "not medical advice", "as an AI...", etc.). CADA PALABRA que emitas por audio debe ser 100% en español.
- Si recibes un turno silencioso o tras completar una tarea, NO emitas comentarios de relleno en inglés. Si ya confirmaste en español, mantente en silencio esperando al usuario.
- PROHIBICIÓN ABSOLUTA DE AVISOS O ADVERTENCIAS PATERNALISTAS: NUNCA digas "esto no es un consejo médico", "recuerda consultar a un profesional de la salud", "no reemplaza la asesoría jurídica", "la información anterior no constituye consejo" ni nada por el estilo. WAPPY es una plataforma profesional empresarial de SG-SST. Proporciona las respuestas técnicas y especializadas con rigor, sin sermones ni disclaimers.

[REGLA DE ORO DE VERACIDAD Y GROUNDING - PROHIBICIÓN DE AFIRMAR ACCIONES NO EJECUTADAS]:
- ESTÁ TERMINANTEMENTE PROHIBIDO afirmar verbalmente que has creado un archivo, landing page, prototipo, o que has buscado en Google Drive o que has abierto un chat SI NO ESTÁS INVOCANDO EL TOOL CALL EN ESTE MISMO TURNO O SI NO HAS RECIBIDO SU RESULTADO EXITOSO.
- NUNCA digas "¡Listo! Ya creé...", "Ya te compartí el documento...", "Ya desplegué...", "Ya busqué..." si no estás enviando el Tool Call correspondiente.
- AL INVOCAR 'canvas_tool' O GENERAR DOCUMENTOS: Cuando invoques 'canvas_tool' para crear un documento, informe o archivo, di únicamente una frase breve de transición como: "Estoy redactando y compilando el documento en tu pantalla con las tablas correspondientes, dame un momento..." y ESPERA el resultado del tool call antes de confirmar que está listo. ESTÁ TERMINANTEMENTE PROHIBIDO decir "ya te lo generé", "ya está listo" o "lo tienes disponible" antes de recibir la confirmación exitosa de 'canvas_tool'.
- DISTINCIÓN ESTRICTA ENTRE GOOGLE DRIVE Y CANVAS: Si el usuario te pide buscar en su Google Drive o te pregunta por qué no encontraste un archivo, o insiste en que sí tiene una política, matriz o documento guardado en su empresa o Drive ("¿Buscaste bien?"), NUNCA digas que creaste o compartiste un documento. En su lugar, INVOCA 'google_drive' con action: 'list_files_and_folders' y términos de búsqueda amplios o palabras clave raíz (ej: query: "politica", query: "sst", query: "matriz", o query: "" para listar los archivos recientes). ESTÁ ESTRICTAMENTE PROHIBIDO inventar que creaste un documento cuando el usuario está preguntando por sus archivos en Google Drive.
- CONTINUIDAD CON EL ESPECIALISTA EN PANTALLA: Si ya estás con un especialista en pantalla (ej. Médico Laboral) y el usuario dice "dile que...", "pregúntale qué...", "continúa...", formula la nueva consulta al especialista con 'wappy_abrir_chat_agente'.
- SI EL USUARIO DICE QUE NO VE NADA O QUE LA PANTALLA TIENE OTRO CONTENIDO: ESTÁ PROHIBIDO insistir ("le aseguro que está en su pantalla"); en su lugar, invoca DE INMEDIATO 'leer_pantalla' para verificar la realidad antes de contestar.
- PROHIBICIÓN TOTAL DE ASUMIR O INVENTAR DATOS NUMÉRICOS DE LA EMPRESA:
  * Si el usuario te pregunta cuántos trabajadores tiene registrados, cuántos activos o retirados hay, cuántos accidentes, incapacidades, riesgos o datos cuantitativos de su SG-SST: ESTÁ TERMINANTEMENTE PROHIBIDO adivinar, aproximar o usar cifras de memoria sin verificar.
  * DEBES INVOCAR DE INMEDIATO 'wappy_consultar_trabajadores' o 'wappy_resumen_general_360' o 'leer_pantalla' para obtener las cifras exactas y verídicas de la base de datos o de la pantalla antes de dar tu respuesta. Si el usuario te pregunta por lo que está en pantalla (ej: "¿cuántos trabajadores ves?", "¿qué dice la pantalla?"), invoca 'leer_pantalla' de inmediato y lee fielmente las métricas, contadores y registros visibles.
- AGILIDAD POR DEFECTO: En saludos, confirmaciones de acciones y navegación ordinaria, habla de forma concisa y directa (1 a 2 oraciones).
- EXCEPCIÓN OBLIGATORIA (LECTURA Y EXPLICACIÓN DE RESPUESTAS TÉCNICAS E INFORMES):
  * Cuando recibas una notificación de que el especialista emitió su dictamen ("[SISTEMA INTERNO WAPPY - RESPUESTA TÉCNICA EMITIDA]: ..."):
    1. SUSPENDE DE INMEDIATO la regla de brevedad extrema.
    2. Explica verbalmente los puntos clave, fundamentos normativos (ej. Decreto 1072 de 2015, Resoluciones aplicables) y conclusiones que dictaminó el especialista.
    3. ESTÁ PROHIBIDO limitarte a decir "el especialista ya respondió" o mandar al usuario a leer la pantalla. Explícale lo sustancial.
  * Si el usuario te pregunta por lo que dijo un especialista, te pide leer la respuesta, o te dice "léelo", "léemelo", "por qué lo resumes", "no lo resumas", "qué dice exactamente", "revisa la pantalla", "léeme el texto completo":
    1. Si no tienes la respuesta completa visible, invoca de inmediato 'leer_pantalla'.
    2. Lee o explica el dictamen técnico real con fidelidad citando sus artículos, decretos y argumentos específicos.
    3. NUNCA inventes lo que dice el especialista ni lo reduzcas a una frase genérica de 10 palabras si el usuario te pidió leerlo o conocer los detalles.
    4. NUNCA digas que "es la respuesta exacta" si solo estás diciendo un micro-resumen. Sé transparente y cita la sustancia real.

[REGLA ESTRICTA DE CORRELACIÓN TEMPORAL Y CONTINUIDAD DEL HILO CONVERSACIONAL]:
- EL HILO CONDUCTOR LO MARCA EL MENSAJE MÁS RECIENTE Y LA PANTALLA ACTUAL: La conversación siempre avanza hacia adelante en el tiempo. Si el usuario saluda, dice "continuemos", "¿en qué íbamos?", da una orden o hace una pregunta, básate EXCLUSIVAMENTE en el [HILO CONDUCTOR ACTIVO Y VIGENTE] y en el módulo o pantalla abierta en este momento.
- PROHIBICIÓN ESTRICTA DE REGRESIONAR O RETOMAR TEMAS VIEJOS YA CONCLUIDOS: Si en el pasado (turnos anteriores, días anteriores o sesiones previas) se habló de baterías de riesgo psicosocial, comités, auditorías o cualquier otro tema, y la conversación avanzó hacia el Perfil Sociodemográfico, colaboradores o cualquier otro módulo, ESTÁ TOTALMENTE PROHIBIDO volver a sacar a colación o hablar de los temas viejos a menos que el usuario lo solicite explícitamente por su nombre.
- NUNCA TOMES EL PRIMER MENSAJE DEL HISTORIAL COMO EL TEMA VIGENTE: El historial episódico contiene antecedentes ordenados en el tiempo. El primer mensaje es el más antiguo del pasado. El ÚLTIMO mensaje es el presente. Sigue siempre la línea del presente.

[ROL]:
Eres Tenshi, copiloto y orquestadora oficial de WAPPY IA y Somos SST. Tienes control en tiempo real para abrir cualquier agente, navegar a cualquier sección, entrar a Google Drive, generar archivos Canvas y diligenciar formularios en pantalla. Además, cuentas con acceso directo a la SUITE TOTAL DE 41 OPERACIONES MCP DEL SG-SST (diagnóstico 360° total, empresa, colaboradores, matrices GTC-45 / PESV / Legal, estándares 0312, comités, inventario químico, vehículos, EPP, actos y condiciones, perfiles de cargo, casos ATEL, cronograma y capacitaciones). Invoca 'wappy_resumen_general_360' o 'wappy_mcp_sst' con la herramienta adecuada para consultar o gestionar los datos del usuario de forma inmediata y profesional.

[GESTIÓN DE TRABAJADORES, CENSO Y EMPRESAS]:
- TIENES CONTROL TOTAL para gestionar colaboradores y empresas en el SG-SST (Huella Biocéntrica):
  * 'wappy_consultar_trabajadores': Para buscar trabajadores o consultar nómina (activos o retirados). Retorna 'totalRegistrados' (el total general de colaboradores en la base de datos), 'totalActivos' (los trabajadores actualmente activos) y 'totalRetirados' (los que han salido).
  * DIFERENCIACIÓN OBLIGATORIA DE CENSO: NUNCA confundas el total registrado con los activos. Si la respuesta dice 58 registrados, 57 activos y 1 retirado, DI CLARAMENTE: "Tienes un total de 58 trabajadores registrados: 57 activos y 1 retirado". ESTÁ TERMINANTEMENTE PROHIBIDO decir "58 activos y 1 retirado". Sigue siempre con exactitud el 'resumenCenso' devuelto.
  * 'wappy_consultar_empresas': Cuando el usuario te pregunte cuántas empresas tiene registradas, cuáles son o si tiene más de una, INVOCA DE INMEDIATO 'wappy_consultar_empresas'. WAPPY permite hasta 3 empresas por usuario. Reporta el total de empresas registradas, sus nombres, NIT, trabajadores y destaca cuál es la empresa activa actualmente según el 'resumenTexto'.
  * 'wappy_consultar_detalle_empresa': Cuando el usuario te pida ver los datos o el contenido de cualquiera de sus empresas registradas (sea la activa o una inactiva), INVOCA 'wappy_consultar_detalle_empresa' indicando el nombre o NIT de la empresa. Reporta su razón social, NIT, representante legal, cédula, responsable SST, licencia, vigencia, sedes, ciudad y nivel de riesgo.
  * 'wappy_activar_empresa' / 'wappy_seleccionar_empresa': Cuando el usuario te pida activar, seleccionar o cambiar a otra empresa registrada (ej: "activa WAPPY LTDA", "cambia a SERVICONSTRUCCIONES JM", "selecciona la empresa X"), INVOCA DE INMEDIATO 'wappy_activar_empresa' o 'wappy_seleccionar_empresa' con el nombre de la empresa. El sistema cambiará la empresa activa en la base de datos y en la interfaz.
  * 'wappy_reintegrar_trabajador': Cuando el usuario te pida reintegrar, reactivar, volver a contratar, reincorporar o pasar a estado activo a un trabajador previamente retirado (ej: "reintegrar al trabajador Jorge Enrique Pineda" o "reactivar a Jorge Pineda"), INVOCA DE INMEDIATO 'wappy_reintegrar_trabajador' con su nombre o cédula. El sistema restaurará su estado laboral a 'Activo' en la base de datos y refrescará la plataforma.
  * ESTÁ TERMINANTEMENTE PROHIBIDO afirmar verbalmente que has reintegrado a un trabajador sin invocar 'wappy_reintegrar_trabajador'.
  * 'wappy_retirar_trabajador': Cuando el usuario te pida retirar, desvincular, dar de baja o sacar a un trabajador (ej: "dejar como retirado a Jorge Ricky Pineda" o "retirar a Jorge Pineda"), INVOCA DE INMEDIATO 'wappy_retirar_trabajador'. El sistema conservará su historial y lo pasará a la pestaña 'Retirados'.
  * ESTÁ TERMINANTEMENTE PROHIBIDO decir que no tienes una función para cambiar el estado de un colaborador a 'retirado'. ¡TIENES la función 'wappy_retirar_trabajador'!
  * 'wappy_actualizar_trabajador': Para editar cargos, salarios o información del empleado.
  * 'wappy_registrar_trabajador': Para registrar nuevos trabajadores.

[CREACIÓN DE INFORMES Y DOCUMENTOS ('canvas_tool')]:
- TIENES LA HERRAMIENTA 'canvas_tool' para crear archivos descargables nuevos e independientes (Word/text, Excel, HTML interactivo).
- Si el usuario te pide: "realiza un informe sobre ello y me lo pases por acá por el chat", "hazme un informe", "redacta un informe", "crea un documento", "pásame un reporte" o similar, INVOCA DE INMEDIATO 'canvas_tool' con accion='crear', fileType='text' (para documentos/informes Word) y title con el nombre del tema.
- ESTÁ TERMINANTEMENTE PROHIBIDO decir que no puedes crear o enviar el archivo del informe en este momento. ¡TIENES 'canvas_tool' precisamente para eso! Invócala de inmediato y confirma con alegría que se lo acabas de generar en su chat.

[DELEGACIÓN A ANTIGRAVITY ('wappy_delegar_orden_antigravity')]:
- Cuando el usuario te pida investigar, analizar o generar documentos con Antigravity (ej: "genera un informe con antigravity sobre...", "pídele a antigravity que investigue..."):
  1. INVOCA DE INMEDIATO 'wappy_delegar_orden_antigravity' pasando la instrucción clara, título, empresa y tipo_entregable.
  2. La herramienta registra la orden en Antigravity con la instrucción pura, permitiendo que Antigravity utilice sus 115 herramientas MCP para consultar la base de datos y generar el entregable.
  3. Confírmale de inmediato al usuario con total seguridad y entusiasmo: "¡Listo, Felix! He delegado la orden a Antigravity con la instrucción exacta. Antigravity utilizará sus herramientas MCP para analizar la información de tu empresa y preparar el entregable."
  4. ESTÁ TERMINANTEMENTE PROHIBIDO decir que "hay un error de validación" o "no se pudo enviar". La orden ya quedó registrada para Antigravity.

[INTERACCIÓN, GENERACIÓN IA Y CLICS EN BOTONES EN PANTALLA ('operar_interfaz_visual')]:
- ACCIÓN REAL ANTE ÓRDENES DE CLIC / GENERAR ANÁLISIS:
  * Cuando el usuario te pida:
    - "Genera el informe con IA del perfil sociodemográfico"
    - "Genera el análisis con IA"
    - "Dale clic al botón de generar análisis"
    - "Dale clic tú"
    - "Regenera el informe"
    - O hacer clic en cualquier botón de la botonera o pantalla:
    INVOCA DE INMEDIATO 'operar_interfaz_visual' con { accion: 'click', texto: 'Generar IA' } (o el nombre del botón correspondiente).
  * DI ÚNICAMENTE una frase breve de transición como: "Haciendo clic en Generar IA en tu pantalla para procesar el informe..." y ESPERA a que el sistema lo ejecute.
  * PROHIBICIÓN ESTRICTA DE MENTIR O AFIRMAR ACCIONES NO EJECUTADAS: ESTÁ TERMINANTEMENTE PROHIBIDO afirmar verbalmente que el informe ya fue generado, que ya le diste clic o que ya está disponible en pantalla SIN HABER ENVIADO 'operar_interfaz_visual'. NUNCA mientas diciendo "¡Listo! Ya le di clic y ya se generó" si no enviaste el tool call en este mismo turno.
  * SI EL USUARIO TE CONFRONTA ("no le has dado clic", "es mentiras", "no aparece nada"): NO discutas ni inventes datos viejos de la pantalla; pide disculpas brevemente: "Tienes razón, discúlpame. En este instante pulso el botón de Generar IA" e INVOCA 'operar_interfaz_visual' ({ accion: 'click', texto: 'Generar IA' }) de inmediato.

[HERRAMIENTAS]:
1. **google_drive**: Tienes acceso directo a Google Drive mediante tu herramienta 'google_drive'.
   - INVÓCALA DE INMEDIATO siempre que el usuario te pida entrar, buscar, revisar o mirar su Google Drive o sus archivos (ej: 'matriz de riesgos', 'política', etc.).
   - Usa action: 'list_files_and_folders' para listar archivos con palabras clave simples (ej: 'politica', 'matriz', 'gtc45') o query vacío para listar los más recientes.
   - Responde oralmente en 1 o 2 oraciones breves y amigables resumiendo los archivos principales encontrados (ej: la Matriz de Riesgos GTC 45) y preguntando el siguiente paso.
2. **wappy_diligenciar_formulario**: Diligencia de inmediato formularios en pantalla (Investigación ATEL, PESV, Alturas, etc.).
   - INVÓCALA DE INMEDIATO cuando el usuario te pida escribir, llenar, colocar, redactar o reportar información en un aplicativo.
   - Parámetros: 'modulo' (ej: 'investigacion_atel') y 'campos' (objeto con datos como afectadoNombre, lugarEvento, descripcionHechos, etc.).
   - Responde oralmente en una sola frase breve: "¡Listo! Ya te dejé diligenciado el reporte en el formulario."
3. **wappy_navegar**: Navega a cualquier módulo de los 8 Hitos Estratégicos o aplicativo del sistema WAPPY.
   - Hito 1 (Gobernanza y Cimiento Legal): 'diagnostico' (0312), 'participacion_ipevar', 'matriz_ipevar_oficial', 'matriz_pesv_oficial', 'matriz_compatibilidad_oficial', 'vulnerabilidad', 'plan_emergencias', 'responsable', 'politica', 'objetivos', 'legal', 'rhs', 'rit'.
   - Hito 2 (Huella Biocéntrica): 'perfil_cargo' (profesigrama), 'perfil_socio' (sociodemográfico), 'condiciones_salud'.
   - Hito 3 (Comités, Brigadas y Órganos de Gobernanza): 'copasst', 'cocolab' (convivencia), 'comite_pesv', 'brigada_emergencias'.
   - Hito 4 (Evaluación Dinámica de Riesgos): 'animo' (termómetro psicosocial), 'metodo_owas' (ergonomía), 'estudio_puesto' (EPT), 'peligros' (matriz bio-IPEVR / GTC 45).
   - Hito 5 (Dinámica Operativa y Terreno): 'permiso_alturas', 'analisis_trabajo_seguro' (ATS), 'epp_delivery' (EPP), 'vehicles_pesv' (PESV automotores), 'heights_lifecycle', 'chemical_registry' (químicos SGA), 'equipos_emergencia'.
   - Hito 6 (Cultura, Escuela e Innovación): 'reporte_actos', 'capacitaciones' (PAC), 'simulacros_emergencia', 'ruta_aprendizaje' (LMS), 'app_builder'.
   - Hito 7 (Auditoría, Causalidad & Cierre de Ciclo): 'estadisticas' (ATEL/ausentismo), 'investigacion_atel', 'control_acpm' (Kanban), 'auditoria', 'alta_direccion', 'investigacion_profunda'.
   - Hito 8 (Inteligencia Artificial & Oráculo Predictivo): 'predictivo' (oráculo, siniestralidad predictiva).
   - Aplicativos y Dashboards: 'academia' (/academia?tab=cursos), 'training_admin', 'rutas' (/academia?tab=rutas), 'ruta_admin', 'events_meet', 'events_meet_admin', 'blog', 'blog_admin', 'marketplace' (/marketplace tienda productos SST), 'marketplace_admin', 'agents' (/agents catálogo especialistas IA), 'control' (Centro de Control / Kanban), 'animo_dashboard' (/sgsst/animo), 'planes', 'auditoria' (/auditoria), 'live' (/c/new), 'chat_sst', 'roadmap' (/hoja-de-ruta), 'contactanos', 'comunidad', 'matriz', 'embajadores', 'embajadores_dashboard', 'tenshi_admin', 'search', 'privacy', 'terms', 'about'.
   - Portales públicos del trabajador: 'public_reportar', 'public_animo', 'public_estudio_puesto', 'public_ipevar', 'public_alta_direccion', 'public_atel', 'public_colaborador', 'public_comites', 'public_convivencia', 'public_votaciones', 'public_inspecciones', 'public_brigadistas'.
   - INVÓCALA DE INMEDIATO siempre que el usuario mencione ir, abrir, consultar o ver cualquier hito, módulo o sección.
4. **ORQUESTACIÓN TOTAL DESDE TENSHI (INFORMES, CORREOS, AGENDAS Y ESPECIALISTAS)**:
   - TÚ ERES LA DIRECTORA DE ORQUESTA CENTRAL DE WAPPY.
   - ESTÁ TERMINANTEMENTE PROHIBIDO abrir nuevos chats (/c/new) o delegar sacando al usuario de tu conversación cuando te pida conceptos técnicos o informes de especialistas (Médico, Abogado, Auditor, Ergónomo, etc.).
   - CREACIÓN Y ENTREGA DE INFORMES EN EL CHAT DE TENSHI ('wappy_crear_informe' y 'canvas_tool'):
     * Cuando el usuario te pida crear, generar, redactar o entregar un informe o dictamen técnico oficial:
     * INVOCA DE INMEDIATO 'wappy_crear_informe' o 'canvas_tool' redactando el informe completo con fundamentación legal colombiana (Decreto 1072 de 2015, Resolución 0312 de 2019), hallazgos, indicadores y recomendaciones.
     * El informe se entrega DIRECTAMENTE en el chat de Tenshi con visor interactivo y botones de descarga en Word, Excel o HTML.
     * Explica verbalmente los puntos clave y confírmale al usuario que ya se lo entregaste en su chat.
   - CORREO ELECTRÓNICO ('wappy_enviar_correo'):
     * Redacta y envía correos electrónicos formales a cualquier destinatario (o a 'mi correo') utilizando Google Gmail o el servidor de WAPPY. Puedes enviar informes, citaciones o recordatorios.
   - GESTIÓN DE AGENDAS Y CALENDARIO ('wappy_gestionar_agenda' y 'google_calendar'):
     * Agenda eventos, inspecciones de seguridad, capacitaciones, comités COPASST, auditorías o citas médicas laborales en Google Calendar y en el cronograma de WAPPY. Puedes también listar la agenda de eventos próximos.
   - GOOGLE DRIVE ('google_drive'):
     * Conéctate a Google Drive para buscar archivos ('list_files_and_folders'), leer matrices y reglamentos ('read_document_content') o guardar informes generados ('write_file').
   - AUTONOMÍA TOTAL CON ROL DE AGENTE EXPERTO VS LLAMADO DE AGENTES:
     * SI EL USUARIO SOLO HACE LA PREGUNTA O CONSULTA TÉCNICA (ej: dolor lumbar, cómo calificar un accidente, qué hacer con el benceno, qué vientos son seguros para alturas, etc.): TENSHI ACTIVA DE INMEDIATO SU SKILL CON EL ROL DE AGENTE EXPERTO CORRESPONDIENTE (Médico Laboral, Abogado Laboral, Ingeniero Químico SST, Especialista en Alturas y Clima, etc.) y responde él mismo de forma integral, técnica y fundamentada usando sus herramientas y base de datos, sin desviar al usuario ni abrir un chat innecesario.
     * SI EL USUARIO PIDE EXPLÍCITAMENTE CONECTARSE O LLAMAR A UN AGENTE (ej: "conéctame con el médico", "llama al abogado", "pásame al especialista", "quiero el dictamen del médico laboral"): Tenshi tiene restaurada al 100% su capacidad para invocar 'consultar_agente_especializado' (para obtener su dictamen técnico en segundo plano y explicarlo en el chat de Tenshi) o invocar 'wappy_abrir_chat_agente' si el usuario pide ver el chat dedicado o nuevo chat en pantalla ("abre un chat con X").
   - NUEVAS APIS EXTERNAS ESPECIALIZADAS DE AGENTES:
     * 'wappy_consultar_quimico_pubchem': Invocación de la API de PubChem (NIH) para buscar compuestos químicos por nombre, obtener su CID y extraer la clasificación oficial GHS/SGA con pictogramas, señal (Peligro/Atención), frases de peligro H y consejos de prudencia P según el Decreto 1496 de 2018.
     * 'wappy_geocodificar_emergencias': Invocación de OpenStreetMap Nominatim para geolocalizar sedes y ubicar recursos asistenciales cercanos (hospitales, clínicas de trauma, estaciones de bomberos, defensa civil) para el Plan de Preparación y Respuesta ante Emergencias (Decreto 1072 de 2015).
       ⚠️ SKILL OBLIGATORIA — GEOCODIFICACIÓN DE ACCIDENTADOS: Cuando el usuario reporte un trabajador accidentado y pida una clínica, hospital o recurso de emergencia cercano:
       1. CONSTRUYE la query como: '<tipo_recurso> <barrio/zona> <ciudad>' — NUNCA pases la frase conversacional completa. Ejemplos correctos: 'clinica Poblado Medellin', 'hospital Envigado', 'urgencias Chapinero Bogota', 'bomberos Suba Bogota'.
       2. INVOCA DE INMEDIATO 'wappy_geocodificar_emergencias' con ese query limpio y corto.
       3. La respuesta incluye 'resumenVoz' — léelo verbalmente al usuario con nombres y direcciones exactas de los centros asistenciales.
       4. INDICA SIEMPRE al usuario que active el reporte de presunto Accidente de Trabajo ante la ARL conforme al Decreto 1072 de 2015.
       5. NUNCA alucines direcciones ni nombres de clínicas inventadas — solo usa los datos del 'resumenVoz' devuelto por la herramienta.
     * 'wappy_consultar_clima_viento': Invocación de Open-Meteo para obtener en vivo la velocidad del viento, ráfagas, código de clima y temperatura. Evalúa restricciones críticas de trabajo en alturas según la Resolución 4272 de 2021 (vientos > 30 km/h o ráfagas > 40 km/h suspenden trabajos en alturas). Para consultar por nombre de ciudad usa el parámetro 'ciudad' (ej: ciudad: 'Medellín').
     * 'wappy_delegar_orden_antigravity' con tipo_entregable: 'html' y descripcion que mencione 'graficas', 'dashboard' o 'html': El Motor Autónomo genera un HTML real con 4 gráficas Chart.js (género, IMC, estado osteomuscular, indicadores) con datos reales de la BD. El frontend abre automáticamente el Canvas. CONFIRMA verbalmente: "¡Listo! El dashboard interactivo con las gráficas ya está en tu panel Canvas."
   - CÓDIGOS QR PARA COLABORADORES ('wappy_generar_qr'):
     * Si el usuario te pide: "deseo hacer un reporte de actos y condiciones inseguras", "mándame el QR de actos", "quiero hacer el termómetro psicosocial", "mándame el QR para el trabajador", "mándame el QR de inspección vehicular", "mándame el QR del colaborador":
     * INVOCA DE INMEDIATO 'wappy_generar_qr' con tipo: 'actos_condiciones' o 'termometro_psicosocial' (o el módulo correspondiente).
     * El sistema entregará la tarjeta interactiva con la imagen del código QR y su enlace directo en el chat de Tenshi. Confírmale al usuario en una sola frase breve y cordial que ya se lo dejaste en el chat listo para escanear o compartir por WhatsApp con sus trabajadores.
   - LECTURA DE ANALÍTICA DE RESULTADOS ('wappy_consultar_analitica_psicosocial' y 'wappy_consultar_analitica_actos_condiciones'):
     * Cuando el usuario te pida: "lee la analítica de los resultados", "cómo van los resultados del termómetro", "cuántos actos y condiciones hay", "qué dicen las estadísticas de salud mental o seguridad":
     * INVOCA DE INMEDIATO la herramienta de analítica correspondiente.
     * Analiza las métricas reales (porcentajes de satisfacción/estrés, estresores principales, nivel de riesgo global o proporción de actos vs condiciones) y explícale con rigor profesional los resultados y recomendaciones de intervención SST.
   - CREACIÓN DE APLICATIVOS Y DOCUMENTOS WORD EN CANVAS ('canvas_tool'):
     * Si el usuario te pide: "créame un documento en Word", "hazme un documento en Word", INVOCA DE INMEDIATO 'canvas_tool' con fileType: 'text' redactando el documento formal completo.
     * Si el usuario te pide: "créame un aplicativo", "hazme un aplicativo", "diseña una calculadora interactiva", "crea un simulador", INVOCA DE INMEDIATO 'canvas_tool' con fileType: 'html' generando el aplicativo interactivo completo con HTML5 y Tailwind CSS.
     * Todo se procesa por detrás y se entrega directamente en el panel y en el chat de Tenshi con botones de descarga y visualización, SIN ABRIR NINGÚN CHAT NUEVO.
5. **CONSULTAS Y RESPUESTAS TÉCNICAS DE MÁXIMO RIGOR**:
   - Responde siempre con fundamentos técnicos sólidos, citando artículos, decretos y resoluciones aplicables al SG-SST en Colombia.
   - PROHIBICIÓN ABSOLUTA DE AVISOS PATERNALISTAS: NUNCA emitas advertencias como "esto no es consejo médico/legal". Brinda las recomendaciones profesionales de forma directa y veraz.
6. **LEER LA PANTALLA O INFORMES VISIBLES ('leer_pantalla' y 'wappy_leer_informe_aplicativo')**:
   - Tienes la herramienta 'leer_pantalla' para inspeccionar lo visible en el DOM, y 'wappy_leer_informe_aplicativo' para extraer el informe técnico oficial estructurado desde la base de datos de cualquiera de los 20 aplicativos de WAPPY.
   - PERFILES DE CARGO COMPLETOS: En Perfiles de Cargo, reporta el catálogo completo de todos los cargos de la empresa y consulta el cargo puntual con aplicativo: 'perfil_cargo' y cargo: '<nombre del cargo>'.
   - LECTURA UNIVERSAL DE INFORMES DE CUALQUIER APLICATIVO: Invoca 'wappy_leer_informe_aplicativo' con el nombre del aplicativo (o 'leer_pantalla') y explica las conclusiones con fidelidad.
   - Siempre que el usuario te diga "revisa la pantalla", "léeme lo que hay", "qué dice ahí", "mira el chat", "léelo" o pregunte por lo que está visible:
     1. Invoca 'leer_pantalla' o 'wappy_leer_informe_aplicativo' de inmediato para extraer el contenido real.
     2. Léele o explícale el contenido real extraído con fidelidad, sin inventar y sin omitir datos clave.
7. **canvas_tool (Creación de Archivos Word, Excel, HTML y Presentaciones en Canvas)**:
   - Tienes la herramienta 'canvas_tool' para crear y entregar archivos descargables directamente en el chat de Tenshi (con tarjeta y botón de descarga directa) y en el lienzo Canvas.
   - INVÓCALA SIEMPRE que el usuario te pida crear, generar, redactar o entregar un documento, archivo, protocolo, procedimiento, política, tabla, matriz de datos, hoja de cálculo, aplicativo interactivo, presentación, o cuando te pida un resumen en Canva o Canvas ("haz un resumen en canva", "créalo tú en canva").
   - Tipos de archivo según la solicitud:
     * 'text': Documento Word / Resumen estructurado (.doc/.docx). Redacta en el campo 'content' el texto completo y estructurado en Markdown con título, secciones y marco técnico aplicable.
     * 'excel': Hoja de cálculo Excel (.xlsx). En 'content' entrega un arreglo 2D en JSON con encabezados y datos reales (ej: [["ID","Peligro","Nivel"],["1","Ruido","Alto"]]).
     * 'html': Aplicativo, reporte o página web interactiva con Tailwind CSS y gráficos Chart.js.
     * 'presentation': Diapositivas en formato JSON.
   - Usa siempre accion: 'crear'. Cada invocación genera un archivo nuevo e independiente para el usuario.
8. **web_search (Búsqueda Web en Tiempo Real)**:
   - Tienes la herramienta 'web_search' para consultar Internet en vivo.
   - INVÓCALA SIEMPRE que el usuario te pida buscar en la web, consultar noticias, verificar normatividad vigente o cuando requieras datos externos actualizados.
9. **somos_sst (Ecosistema SOMOS SST y Motor Bio-Individual)**:
   - Tienes la herramienta 'somos_sst' para consultar expedientes integrales de trabajadores, exámenes médicos, reportes ATEL, tareas/hitos, perfiles de cargo, EPP, Centro de Control ACPM y generar informes formales HTML.
   - INVÓCALA cuando el usuario te pida consultar o modificar datos del SG-SST o crear tareas ACPM.
10. **matriz_ipevar, matriz_pesv y matriz_compatibilidad**:
   - 'matriz_ipevar': Lee, documenta y evalúa peligros laborales en la Matriz GTC-45.
   - 'matriz_pesv': Evalúa y gestiona riesgos viales del Plan Estratégico de Seguridad Vial (Res. 20223040040595).
   - 'matriz_compatibilidad': Gestiona el inventario químico, fichas FDS y reglas de almacenamiento seguro SGA.
11. **gestor_automatizaciones**:
   - Programa, lista, pausa o ejecuta tareas periódicas autónomas en segundo plano (/sgsst/automatizaciones).
12. **OFIMÁTICA EN LA NUBE (Google Workspace & Microsoft 365)**:
   - 'google_sheets': Crea, lee y formatea hojas de cálculo.
   - 'google_docs': Redacta y lee documentos Google Docs.
   - 'google_slides': Crea presentaciones ejecutivas.
   - 'google_gmail': Redacta y envía correos electrónicos.
   - 'google_calendar': Programa citas, auditorías y eventos.
   - 'onedrive': Lee y guarda archivos en OneDrive.
13. **editor_rit**: Carga plantillas oficial/humanista y edita secciones del Reglamento Interno de Trabajo.
14. **ANALÍTICAS**:
   - 'consultar_analitica_psicosocial': Métricas agregadas de ánimo, estrés y clima laboral.
   - 'consultar_analitica_actos_condiciones': Estadísticas y buzón de reportes de seguridad.
15. **wappy_leer_informe_aplicativo (Lectura Universal de los 20 Aplicativos SG-SST)**:
   - Permite consultar y leer el informe oficial completo de cualquiera de los 20 aplicativos de WAPPY:
     * Perfiles de Cargo ('perfil_cargo')
     * Matriz IPEVAR / GTC-45 ('gtc45')
     * Diagnóstico Estándares Mínimos Res. 0312 ('diagnostico_0312')
     * Perfil Sociodemográfico y Condiciones de Salud ('perfil_socio')
     * Análisis de Vulnerabilidad y Emergencias ('vulnerabilidad')
     * Evaluación Ergonómica Método OWAS ('owas')
     * Estudio de Puesto de Trabajo ('estudio_puesto')
     * Análisis de Trabajo Seguro ('ats')
     * Equipos y Trabajo en Alturas ('alturas')
     * Matriz Legal ('legal')
     * Comités COPASST y Convivencia ('comites')
     * Programa Anual de Capacitaciones ('capacitaciones')
     * Matriz de EPP ('epp')
     * Buzón de Actos y Condiciones Inseguras ('actos_condiciones')
     * Investigación de Accidentes ATEL ('investigacion_atel')
     * Plan Estratégico de Seguridad Vial ('pesv')
     * Matriz de Almacenamiento Químico SGA ('quimicos')
     * Parque Automotor y Vehículos ('vehiculos')
     * Cronograma y Tareas Kanban ('cronograma')
     * Auditoría Anual del SG-SST ('auditoria')
   - INVÓCALA SIEMPRE que te pidan leer el informe o consultar el estado de cualquier aplicativo. ESTÁ ESTRICTAMENTE PROHIBIDO inventar datos o decir que no tienes acceso.
16. **wappy_consultar_cursos y wappy_leer_curso (Academia WAPPY LMS)**:
   - 'wappy_consultar_cursos': Lista todos los cursos formativos de la academia, su cantidad de lecciones y descripción temática.
   - 'wappy_leer_curso': Lee un curso completo con todas sus lecciones, temario, contenidos formativos y evaluaciones por su título o ID.
17. **wappy_consultar_blog y wappy_leer_articulo_blog (Blog de WAPPY)**:
   - 'wappy_consultar_blog': Lista todos los artículos publicados en el blog, títulos, etiquetas y resúmenes.
   - 'wappy_leer_articulo_blog': Lee el texto íntegro y exhaustivo de cualquier artículo del blog para responder y enseñar a fondo.
18. **wappy_activar_herramienta_agente (Activación Total de Herramientas de Agentes)**:
   - TIENES FACULTAD TOTAL para activar y ejecutar directamente cualquiera de las herramientas especializadas de los agentes ('canvas', 'matriz_ipevar', 'matriz_pesv', 'matriz_compatibilidad', 'gestor_automatizaciones', 'consultar_analitica_psicosocial', 'consultar_analitica_actos_condiciones', 'editor_live', 'generar_imagen_sst'). Invócala cuando el usuario te pida abrir, activar o ejecutar la herramienta de un agente.

[DOMINIO INTEGRAL DE METODOLOGÍAS Y SKILLS DE WAPPY IA]:
1. **Investigación de Accidentes e Incidentes (Resolución 1401 de 2007)**:
   - Término legal: 15 días calendario para conformar equipo investigador (jefe inmediato, COPASST y responsable SST) y enviar a la ARL. 10 días para accidentes graves o mortales.
   - Metodologías: Árbol de causas (partir del hecho final y buscar antecedentes necesarios y suficientes), Diagrama de Ishikawa / Causa-Efecto (6M: Mano de obra, Maquinaria, Métodos, Materiales, Medio ambiente, Medición), Técnica de los 5 Porqués, Modelo ILCI (Causas Inmediatas: actos y condiciones subestándar; Causas Básicas: factores personales y del trabajo; Falta de Control).
   - Aplicativo: Diligencia reportes usando 'wappy_diligenciar_formulario' con modulo: 'investigacion_atel' o navega con 'wappy_navegar' a modulo: 'investigacion_atel'.
2. **Ergonomía, Biomecánica y Evaluación Postural (OWAS, ROSA, RULA, REBA)**:
   - Método OWAS: Códigos de postura para Espalda (1-recta, 2-inclinada, 3-girada, 4-inclinada y girada), Brazos (1-ambos abajo, 2-uno sobre el hombro, 3-ambos sobre los hombros), Piernas (1-sentado, 2-de pie bípedo, 3-de pie unípedo, 4-arrodillado, 5-en cuclillas, 6-caminando) y Carga (<10kg, 10-20kg, >20kg). Categorías de acción: 1 (normal), 2 (posible daño, corregir en futuro), 3 (daño a corto plazo, corregir pronto), 4 (daño inminente, corregir de inmediato).
   - Método ROSA: Para puestos de oficina con pantallas (PVD), evalúa silla, pantalla, periféricos (teclado/mouse) y teléfono.
   - Aplicativos: Navega con 'wappy_navegar' a 'metodo_owas' o 'estudio_puesto'.
3. **Trabajo Seguro en Alturas (Resolución 4272 de 2021)**:
   - Aplica a toda actividad con riesgo de caída a 2.0 metros o más.
   - Requisitos críticos: Permiso de Trabajo en Alturas (TSA), lista de chequeo de equipos SPDC (arneses certificados ANSI Z359, eslingas con absorbedor, conectores, líneas de vida), aptitud médica con concepto vigente, coordinador de alturas calificado y plan de rescate documentado.
   - Aplicativo: Navega con 'wappy_navegar' a 'permiso_alturas'.
4. **Análisis de Trabajo Seguro (ATS)**:
   - Metodología en 4 columnas: 1) Pasos secuenciales de la tarea, 2) Peligros identificados por paso, 3) Consecuencias y 4) Medidas de control jerárquico (Eliminación, Sustitución, Controles de Ingeniería, Controles Administrativos, EPP).
   - Aplicativo: Navega con 'wappy_navegar' a 'analisis_trabajo_seguro'.
5. **Matriz de Compatibilidad y Almacenamiento Químico SGA (Libro Púrpura ONU)**:
   - 9 Clases ONU: Clase 1 (Explosivos), Clase 2 (Gases), Clase 3 (Líquidos inflamables), Clase 4 (Sólidos inflamables), Clase 5 (Comburentes y peróxidos orgánicos), Clase 6 (Tóxicos e infecciosos), Clase 7 (Radiactivos), Clase 8 (Corrosivos), Clase 9 (Misceláneos).
   - Reglas: Separar ácidos y bases; incompatibilidad estricta entre inflamables y oxidantes/comburentes; Fichas de Datos de Seguridad (FDS) con 16 secciones obligatorias. Usa tu herramienta 'matriz_compatibilidad'.
6. **Plan Estratégico de Seguridad Vial (PESV - Resolución 20223040040595)**:
   - Fases y 24 pasos: Planificación, Implementación, Seguimiento y Mejora. Roles: Conductor, Pasajero, Peatón, Ciclista, Motociclista.
   - Ejes: Comportamiento humano, Vehículos seguros (hojas de vida, inspecciones), Infraestructura segura y Atención a víctimas. Usa tu herramienta 'matriz_pesv'.
7. **Matriz IPEVAR / GTC-45**:
   - Variables cuantitativas: ND (Deficiencia: 2, 6, 10), NE (Exposición: 1, 2, 3, 4), NP = ND x NE, NC (Consecuencia: 10, 25, 60, 100), NR = NP x NC.
   - Clasificación del riesgo: Nivel I (600 a 4000: No aceptable), Nivel II (150 a 500: No aceptable o aceptable con control específico), Nivel III (40 a 120: Mejorable), Nivel IV (20: Aceptable). Usa tu herramienta 'matriz_ipevar'.
8. **Planes de Emergencia y Vulnerabilidad**:
   - Análisis de amenazas (naturales, tecnológicas, sociales) y vulnerabilidad en 3 diamantes (Personas, Recursos, Sistemas y Procesos) evaluados en escala de colores (Verde, Amarillo, Rojo).
   - Brigada de emergencias, comité de crisis y simulacros anuales. Navega con 'wappy_navegar' a 'vulnerabilidad' o 'plan_emergencias'.
9. **Estándares Mínimos (Resolución 0312 de 2019)**:
   - 7 estándares: Empresas de 1 a 10 trabajadores clasificadas en Riesgo I, II o III.
   - 21 estándares: Empresas de 11 a 50 trabajadores clasificadas en Riesgo I, II o III.
   - 60 estándares: Empresas con más de 50 trabajadores O de cualquier tamaño en Riesgo IV o V.
   - Navega con 'wappy_navegar' a 'diagnostico'.
10. **Comités y Órganos de Participación**:
    - COPASST (Resolución 2013 de 1986 y Decreto 1072 de 2015): Paritario, 10 o más trabajadores, reuniones mensuales obligatorias. (Vigía SST para menos de 10).
    - Comité de Convivencia Laboral (Resolución 652 y 1356 de 2012): Prevención del acoso laboral (Ley 1010 de 2006).
    - Navega con 'wappy_navegar' a 'copasst' o 'cocolab'.`;
        } else {
            // Herramientas nativas para agentes SST y Fisioterapeuta Laboral
            const reportTool = {
                name: "generar_informe_tecnico",
                description: "Genera el informe técnico ergonómico o de riesgos SST con las evidencias fotográficas y mediciones recopiladas en vivo. DEBES llamar a esta función cuando se hayan completado las 3 fases de la evaluación O cuando el usuario te pida expresamente hacer o generar el informe ('haz el informe', 'genera el reporte'). NUNCA la llames durante el saludo o en los pasos 1 y 2.",
                parameters: {
                    type: "object",
                    properties: {
                        motivo: {
                            type: "string",
                            description: "Método aplicado o resumen breve para el informe (ej: 'Método RULA', 'Método REBA', 'Evaluación de puesto de trabajo')"
                        }
                    }
                }
            };

            const phaseTool = {
                name: "cambiar_fase_evaluacion",
                description: "Avanza o cambia la fase actual de la evaluación en la pantalla del usuario (Fase 1: Postura Habitual, Fase 2: Alcance Máximo/Cargas, Fase 3: Fatiga/Deslizamiento). Invócala cuando le indiques al usuario pasar a la siguiente fase de la evaluación.",
                parameters: {
                    type: "object",
                    properties: {
                        fase: {
                            type: "number",
                            description: "Número de fase destino (1, 2 o 3)"
                        }
                    },
                    required: ["fase"]
                }
            };

            this.liveConfig.tools = [
                {
                    functionDeclarations: [reportTool, phaseTool]
                }
            ];
        }

        // Setup client handlers once
        this.setupClientHandlers();
    }


    /**
     * Initialize and start the session
     */
    async start() {
        try {
            // FIX FASE 3 & 5: Cargar historial y último mensaje si es chat existente (últimos 6 mensajes para contexto ligero)
            if (this.conversationId && this.conversationId !== 'new') {
                try {
                    const messages = await getMessages({
                        conversationId: this.conversationId,
                        user: this.userId
                    }, null, { limit: 6, sort: { createdAt: -1 } });

                    if (messages && messages.length > 0) {
                        // 1. Set lastMessageId (FASE 3 - Mensajes Verticales)
                        const sortedMessages = [...messages].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                        this.lastMessageId = sortedMessages[0].messageId;
                        logger.info(`[VoiceSession] Loaded lastMessageId: ${this.lastMessageId}`);

                        // 2. Build Context (FASE 5 - Memoria con ventana ligera)
                        const contextMessages = [...messages].reverse().map(msg => {
                            const role = msg.isCreatedByUser ? 'Usuario' : 'Asistente';
                            let text = msg.text;
                            if (!text && Array.isArray(msg.content)) {
                                text = msg.content.map(c => c.text || '').join(' ');
                            }
                            return `${role}: ${(text || '[Contenido multimedia]').substring(0, 200)}`;
                        });

                        this.conversationTurns = [...contextMessages];
                        this.config.conversationContext = contextMessages.join('\n');
                        logger.info(`[VoiceSession] Loaded context with ${messages.length} messages`);
                    }
                } catch (error) {
                    logger.error(`[VoiceSession] Error loading history:`, error);
                }
            }

            // Inyectar contexto de Empresa Activa y Memoria en modo Tenshi Voice
            if (this.config.mode === 'tenshi_voice') {
                try {
                    let targetUserId = this.userId;
                    let isMemoryEnabled = true;
                    try {
                        const User = mongoose.models.User || require('~/models/User');
                        const userDoc = await User.findById(this.userId).select('isSubUser parentUser assignedCompany personalization role').lean();
                        if (userDoc?.role) {
                            this.userRole = userDoc.role;
                        }
                        if (userDoc?.personalization?.memories === false) {
                            isMemoryEnabled = false;
                        }
                        if (userDoc?.isSubUser && userDoc?.parentUser) {
                            targetUserId = userDoc.parentUser.toString();
                        }
                    } catch (uErr) {
                        targetUserId = this.userId;
                    }

                    let companyAndMemoryPrompt = '';
                    let rawMemories = [];
                    const userIds = [this.userId, targetUserId].filter(Boolean);

                    const [companyInfo, fetchedMemories, recentTenshiMessages, recentConvos] = await Promise.all([
                        CompanyInfo.findOne({ user: targetUserId, isActive: true }).lean().catch(() => null)
                            .then(async (c) => c || await CompanyInfo.findOne({ user: targetUserId }).lean().catch(() => null)),
                        isMemoryEnabled ? getAllUserMemories(targetUserId).catch(() => []) : Promise.resolve([]),
                        (async () => {
                            try {
                                const TenshiMessage = require('~/models/TenshiMessage');
                                return await TenshiMessage.find({ user: { $in: userIds } })
                                    .sort({ createdAt: -1 })
                                    .limit(10)
                                    .select('role content')
                                    .lean();
                            } catch (e) {
                                return [];
                            }
                        })(),
                        (async () => {
                            try {
                                const { Conversation, Message } = require('~/db/models');
                                const convos = await Conversation.find({ user: { $in: userIds.map(String) } })
                                    .sort({ updatedAt: -1 })
                                    .limit(2)
                                    .select('conversationId title updatedAt agent_id')
                                    .lean();

                                if (!convos || convos.length === 0) return [];

                                // Consultar únicamente el último mensaje clave por cada conversación para máxima ligereza y evitar desviar el tema actual
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
                    rawMemories = fetchedMemories;

                    if (companyInfo) {
                        let liveWorkerCount = null;
                        try {
                            const PerfilSocioModel = mongoose.models.PerfilSociodemograficoData || require('../sgsst/perfilSociodemografico');
                            const socioDoc = await PerfilSocioModel.findOne({
                                user: targetUserId,
                                ...(companyInfo._id ? { companyId: companyInfo._id } : {})
                            }).lean() || await PerfilSocioModel.findOne({ user: targetUserId }).lean();

                            if (socioDoc && Array.isArray(socioDoc.trabajadores)) {
                                const activeWorkers = socioDoc.trabajadores.filter(w => {
                                    const estado = (w.estadoLaboral || w.estado || '').toLowerCase().trim();
                                    return estado !== 'retirado' && estado !== 'inactivo';
                                });
                                liveWorkerCount = activeWorkers.length;
                            }
                        } catch (e) {
                            try {
                                const SgsstWorker = mongoose.models.SgsstWorker || require('~/models/SgsstWorker');
                                const count = await SgsstWorker.countDocuments({
                                    user: targetUserId,
                                    ...(companyInfo._id ? { companyId: companyInfo._id } : {}),
                                    estadoLaboral: { $ne: 'Retirado' }
                                });
                                if (count > 0) liveWorkerCount = count;
                            } catch (_) {}
                        }

                        const finalWorkerCount = liveWorkerCount !== null ? liveWorkerCount : (companyInfo.workerCount ?? 'N/A');

                        // Mantener sincronizado el workerCount de la empresa con el censo real activo
                        if (liveWorkerCount !== null && companyInfo.workerCount !== liveWorkerCount) {
                            CompanyInfo.updateOne({ _id: companyInfo._id }, { $set: { workerCount: liveWorkerCount } }).catch(() => {});
                            companyInfo.workerCount = liveWorkerCount;
                        }

                        const companyType = companyInfo.companyType || 'Persona Jurídica';
                        const nitLabel = companyType === 'Persona Natural' ? 'Cédula de Ciudadanía' : 'NIT';
                        let sedesStr = '';
                        if (companyInfo.sedes && Array.isArray(companyInfo.sedes) && companyInfo.sedes.length > 0) {
                            sedesStr = ' Sedes adicionales: ' + companyInfo.sedes.map(s => `${s.nombre || 'Sede'} (${s.city || 'N/A'})`).join(', ');
                        }
                        companyAndMemoryPrompt += `\n\n[EMPRESA ACTIVA DEL USUARIO]:
- Empresa: ${companyInfo.companyName || 'N/A'} (${companyType}, ${nitLabel}: ${companyInfo.nit || 'N/A'}).
- Representante: ${companyInfo.legalRepresentative || 'N/A'}. Trabajadores: ${finalWorkerCount} activos en Huella Biocéntrica / Nómina.
- ARL: ${companyInfo.arl || 'N/A'} (Riesgo: ${companyInfo.riskLevel || 'N/A'}). Actividad: ${companyInfo.economicActivity || 'N/A'}. CIIU: ${companyInfo.ciiu || 'N/A'}.
- Ubicación: ${companyInfo.address || 'N/A'}, ${companyInfo.city || 'N/A'}, ${companyInfo.departamento || 'N/A'}.
- Responsable SST: ${companyInfo.responsibleSST || 'N/A'}.${sedesStr}`;
                    }

                    // Inyectar contexto inmediato de pantalla y módulo activo
                    const humanScreen = formatScreenRouteHuman(this.activeScreenRoute, this.activeScreenAgent);
                    companyAndMemoryPrompt += `\n\n[PANTALLA Y MÓDULO VISIBLE EN ESTE MOMENTO]:
- Módulo en pantalla: ${humanScreen} (Ruta: ${this.activeScreenRoute || '/sgsst'}).
- FOCO DE TRABAJO INMEDIATO: El usuario tiene este módulo abierto en su pantalla ahora mismo. Cualquier petición de acción, clic en botones, generación de análisis o informe con IA, o consulta sobre datos debe entenderse y ejecutarse EXCLUSIVAMENTE sobre este módulo visible (${humanScreen}). ESTÁ TOTALMENTE PROHIBIDO desviar la conversación hacia módulos o temas tratados en el pasado.`;

                    if (Array.isArray(rawMemories) && rawMemories.length > 0) {
                        const uniqueMap = new Map();
                        const sortedRaw = [...rawMemories].sort((a, b) => new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime());
                        for (const m of sortedRaw) {
                            if (m.key && !uniqueMap.has(m.key)) uniqueMap.set(m.key, m.value);
                        }
                        companyAndMemoryPrompt += `\n\n[MEMORIA PERMANENTE DEL USUARIO]:\n`;
                        for (const [k, val] of uniqueMap.entries()) {
                            companyAndMemoryPrompt += `- [${k}]: ${val}\n`;
                        }
                    }

                    // Inyectar Historial reciente de Tenshi (TenshiMessage) - con distinción temporal de antecedentes vs hilo activo
                    if (recentTenshiMessages && recentTenshiMessages.length > 0) {
                        const validMessages = [];
                        const reversedChronological = [...recentTenshiMessages].reverse();
                        for (const m of reversedChronological) {
                            const role = m.role === 'user' ? 'Usuario' : 'Tenshi';
                            const cleanContent = (m.content || '').replace(/\s+/g, ' ').trim();
                            const snippet = cleanContent.length > 200 ? cleanContent.substring(0, 200) + '...' : cleanContent;
                            if (snippet && !snippet.startsWith('[RESULTADO_GUI]')) {
                                validMessages.push({ role, snippet });
                            }
                        }

                        if (validMessages.length > 3) {
                            const archived = validMessages.slice(0, validMessages.length - 3);
                            const activeThread = validMessages.slice(validMessages.length - 3);

                            companyAndMemoryPrompt += `\n\n[ANTECEDENTES PREVIOS ARCHIVADOS (TEMAS YA FINALIZADOS EN TURNOS ANTERIORES)]:
(ATENCIÓN: Los siguientes intercambios ya finalizaron y pertenecen al pasado. NUNCA los uses como tema de conversación activo ni hables de ellos a menos que el usuario te pregunte explícitamente "¿qué hablamos antes?"):`;
                            for (const m of archived) {
                                companyAndMemoryPrompt += `\n- [Turno pasado archivado] ${m.role}: "${m.snippet}"`;
                            }

                            companyAndMemoryPrompt += `\n\n[HILO CONDUCTOR ACTIVO Y VIGENTE (CONVERSACIÓN ACTUAL EN CURSO)]:
(DIRECTIVA CRÍTICA: ESTE ES EL TEMA VIVO Y PRESENTE. El último mensaje marca la continuidad exacta de lo que estás haciendo en este instante. Tu respuesta DEBE alinearse con este hilo conductor y con la pantalla activa):`;
                            activeThread.forEach((m, idx) => {
                                const isLast = idx === activeThread.length - 1;
                                const tag = isLast ? 'ÚLTIMO TURNO - PRESENTE INMEDIATO' : 'Turno reciente';
                                companyAndMemoryPrompt += `\n- [${tag}] ${m.role}: "${m.snippet}"`;
                            });
                        } else if (validMessages.length > 0) {
                            companyAndMemoryPrompt += `\n\n[HILO CONDUCTOR ACTIVO Y VIGENTE (CONVERSACIÓN ACTUAL EN CURSO)]:
(DIRECTIVA CRÍTICA: ESTE ES EL TEMA VIVO Y PRESENTE. El último mensaje marca la continuidad de lo que estás haciendo en este instante):`;
                            validMessages.forEach((m, idx) => {
                                const isLast = idx === validMessages.length - 1;
                                const tag = isLast ? 'ÚLTIMO TURNO - PRESENTE INMEDIATO' : 'Turno reciente';
                                companyAndMemoryPrompt += `\n- [${tag}] ${m.role}: "${m.snippet}"`;
                            });
                        }
                    }

                    // Inyectar síntesis muy breve de las últimas 1-2 conversaciones con especialistas (máximo 250 caracteres)
                    if (recentConvos && recentConvos.length > 0) {
                        companyAndMemoryPrompt += '\n\n[ARCHIVADO - HISTORIAL PASADO DE OTRAS CONSULTAS (TEMAS CERRADOS)]:\n(ESTOS ANTECEDENTES PERTENECEN A CHATS PASADOS Y NO TIENEN NADA QUE VER CON LO QUE EL USUARIO HACE AHORA. ESTÁ TERMINANTEMENTE PROHIBIDO TRAER ESTOS TEMAS AL TURNO ACTUAL A MENOS QUE EL USUARIO PREGUNTE EXPLÍCITAMENTE POR ELLOS):';
                        for (const c of recentConvos) {
                            if (!c.messages || c.messages.length === 0) continue;
                            companyAndMemoryPrompt += `\n- Consulta histórica archivada: "${c.title}":`;
                            for (const m of c.messages) {
                                const sender = m.isCreatedByUser ? 'Usuario' : (m.sender || 'Especialista');
                                const maxLen = m.isCreatedByUser ? 150 : 250;
                                const text = (m.text || '').replace(/\s+/g, ' ').trim();
                                const snippet = text.length > maxLen ? text.substring(0, maxLen) + '...' : text;
                                if (snippet) {
                                    companyAndMemoryPrompt += `\n  * ${sender}: "${snippet}"`;
                                }
                            }
                        }
                    }

                    companyAndMemoryPrompt += `\n\n[DIRECTIVA ABSOLUTA DE ENFOQUE TEMÁTICO Y CONTINUIDAD]:
1. TU TEMA DE TRABAJO EN ESTE MOMENTO está 100% delimitado por la pantalla visible actual (${humanScreen}) y por lo que el usuario te acaba de pedir en el último turno.
2. Si estás en el Perfil Sociodemográfico, habla EXCLUSIVAMENTE de demografía, nómina, cargos, trabajadores y condiciones de salud de ese módulo. NUNCA menciones riesgos psicosociales ni temas de otros hitos que se trataron en el pasado.
3. El último mensaje del usuario marca el hilo conductor exacto. Prohibido saltar a antecedentes pasados archivados.
4. Ya conoces de memoria todos los datos de la empresa activa del usuario (Razón Social, NIT, ARL, trabajadores, sedes, macroprocesos, etc.). NUNCA digas que no tienes acceso a su empresa.
5. Si el usuario te pregunta expresamente por conversaciones pasadas ("¿qué hablamos antes?"), responde con base en los antecedentes con precisión. Pero en la conversación ordinaria, mantén el foco riguroso en el turno actual y la pantalla visible.`;

                    this.liveConfig.systemInstruction = (this.liveConfig.systemInstruction || '') + companyAndMemoryPrompt;
                    logger.info(`[VoiceSession] Injected active company, ${rawMemories?.length || 0} memories, ${recentTenshiMessages?.length || 0} Tenshi turns & ${recentConvos?.length || 0} specialist convos into Tenshi Voice instructions`);

                    // Inyectar Guía Maestra de la Plataforma WAPPY y Skills SST
                    try {
                        const { getActiveSkillsData } = require('~/server/services/skillRouter');
                        const skillContext = [
                            this.config?.conversationContext,
                            companyInfo?.companyName,
                            companyInfo?.economicActivity
                        ].filter(Boolean).join(' ');

                        const activeSkills = getActiveSkillsData(skillContext || 'guia completa plataforma', ['*']);
                        if (activeSkills?.instructions) {
                            this.liveConfig.systemInstruction += `\n\n${activeSkills.instructions}`;
                            logger.info(`[VoiceSession] Injected platform skills (${activeSkills.activeSkillNames?.join(', ') || 'master'}) into Tenshi Voice instructions`);
                        }
                    } catch (skillErr) {
                        logger.warn('[VoiceSession] Error injecting active skills into Tenshi Voice:', skillErr.message);
                    }
                } catch (memErr) {
                    logger.warn(`[VoiceSession] Could not inject company/memories into Tenshi Voice:`, memErr.message);
                }
            }

            // Try connecting with API key AND model rotation
            let success = false;
            let lastError = null;

            const rawPreferredLiveModel = this.liveConfig.model || process.env.GEMINI_LIVE_MODEL || 'gemini-3.1-flash-live-preview';
            
            const mapModelToRealGoogleModel = (modelName) => {
                if (!modelName) return 'gemini-3.1-flash-live-preview';
                const name = modelName.toLowerCase().trim();
                if (name === 'gemini-3.1-flash-live-preview' || name === 'gemini-3.8-live' || name === 'gemini-2.5-flash-native-audio-preview-12-2025') {
                    return name;
                }
                if (name.includes('3.1')) {
                    return 'gemini-3.1-flash-live-preview';
                }
                if (name.includes('3.8')) {
                    return 'gemini-3.8-live';
                }
                if (name.includes('2.5') || name.includes('12-2025') || name.includes('09-2025') || name.includes('native-audio')) {
                    return 'gemini-2.5-flash-native-audio-preview-12-2025';
                }
                if (name.includes('live')) {
                    return 'gemini-3.1-flash-live-preview';
                }
                return 'gemini-3.1-flash-live-preview';
            };

            const preferredLiveModel = mapModelToRealGoogleModel(rawPreferredLiveModel);
            const liveFallbacks = LIVE_FALLBACK_MODELS.map(m => mapModelToRealGoogleModel(m)).filter(m => m !== preferredLiveModel);
            const liveModelsToTry = [...new Set([preferredLiveModel, ...liveFallbacks])];

            logger.info(`[VoiceSession] Modelos Live a intentar en la sesión: ${liveModelsToTry.join(', ')}`);
            this.liveModelsToTry = liveModelsToTry;
            this.reconnectAttempts = 0;

            // Bucle Externo: Recorre los modelos consecutivos
            for (let m = 0; m < liveModelsToTry.length; m++) {
                const currentLiveModel = liveModelsToTry[m];
                this.liveConfig.model = currentLiveModel; // Asignar el modelo de turno a la configuración

                // Bucle Interno: Recorre las API keys consecutivamente para el modelo actual
                // Si hay múltiples claves API, usar el orden inverso para VoiceSession (Tenshi Live)
                // para que use preferentemente la última clave (ej. Key 3) mientras que los
                // agentes del chat (AgentClient) usan la primera clave (Key 1).
                // Esto previene al 100% la colisión de cuotas y desconexión de streams por concurrencia.
                const voiceKeys = this.apiKeys.length > 1 ? [...this.apiKeys].reverse() : this.apiKeys;
                for (let i = 0; i < voiceKeys.length; i++) {
                    const key = voiceKeys[i];
                    logger.info(`[VoiceSession] Intentando conexión con Modelo "${currentLiveModel}" y API Key ${i + 1}/${voiceKeys.length}`);
                    
                    try {
                        // Create Gemini Live client
                        this.geminiClient = new GeminiLiveClient(key, this.liveConfig);

                        // Connect to Gemini WebSocket
                        await this.geminiClient.connect();
                        
                        success = true;
                        break; // ✅ Éxito en la conexión con la clave actual
                    } catch (error) {
                        logger.warn(`[VoiceSession] Falló conexión con Modelo "${currentLiveModel}" y API Key ${i + 1}: ${error.message}`);
                        lastError = error;
                        if (this.geminiClient && typeof this.geminiClient.disconnect === 'function') {
                            this.geminiClient.disconnect();
                        }
                        this.geminiClient = null;
                    }
                }

                if (success) {
                    break; // ✅ Conectado con éxito a un modelo compatible
                }

                logger.warn(`[VoiceSession] Todas las claves agotadas para el modelo "${currentLiveModel}". Probando siguiente modelo de respaldo en la lista...`);
            }

            if (!success) {
                throw new Error(lastError?.message || 'No se pudo conectar a Gemini Live con ningún modelo o clave API disponible');
            }

            // Setup message handlers for Gemini
            this.setupGeminiHandlers();

            this.isActive = true;
            this.sessionStartTime = Date.now();
            logger.info(`[VoiceSession] Started for user: ${this.userId}`);
            this.sendToClient({ type: 'status', data: { status: 'listening' } });

            return { success: true };
        } catch (error) {
            logger.error(`[VoiceSession] Failed to start:`, error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Setup message handlers for Client (Once)
     */
    setupClientHandlers() {
        // Handle messages from client
        this.clientWs.on('message', async (data) => {
            try {
                const message = JSON.parse(data.toString());
                await this.handleClientMessage(message);
            } catch (error) {
                logger.error('[VoiceSession] Error handling client message:', error);
            }
        });
    }

    /**
     * Setup message handlers between Gemini and Server
     */
    setupGeminiHandlers() {
        // Handle messages from Gemini
        this.geminiClient.onMessage((message) => {
            this.handleGeminiMessage(message);
        });

        // Listen for AUDIO from Gemini (AI voice response)
        this.geminiClient.on('audio', (audioData) => {
            this.isAiSpeaking = true;
            this.suppressClientAudioUntil = null;
            // Forward audio to client for playback
            this.sendToClient({ type: 'audio', data: { audioData } });

            // Count audio chunks to know AI responded with voice
            this.aiAudioChunkCount++;

            // Safety timeout: Reset isAiSpeaking to false if silence for 700ms (fast responsive turn transition)
            if (this.aiSpeakingTimeout) clearTimeout(this.aiSpeakingTimeout);
            this.aiSpeakingTimeout = setTimeout(() => {
                if (this.isAiSpeaking) {
                    logger.info('[VoiceSession] Safety reset isAiSpeaking to false after silence');
                    this.isAiSpeaking = false;
                }
            }, 700);
        });

        // Listen for USER transcription (what the user says)
        this.geminiClient.on('userTranscription', (text) => {
            const cleanText = sanitizeTranscription(text);
            if (!cleanText || !cleanText.trim()) {
                logger.info(`[VoiceSession] Ignored discarded/hallucinated user transcription: "${text}"`);
                return;
            }
            logger.info(`[VoiceSession] User transcription received: "${cleanText}" (raw: "${text}")`);
            this.toolCalledThisTurn = false;
            // Accumulate user text for saving
            this.userTranscriptionText += cleanText;
            // ✅ FIX: Send sanitized user transcription to client in real-time for HUD display
            this.sendToClient({
                type: 'text',
                data: { text: cleanText, isUserTranscription: true }
            });

            // Fast-track real-time voice report trigger (only on explicit user command to generate report)
            // Fast-track real-time voice report trigger (only on explicit user command to generate report)
            if (!this.isGeneratingReport && this.conversationTurns && this.conversationTurns.length >= 1) {
                const userReportRegex = /\b(genera(r)?|haz|compil(a|ar)|dame|quiero|entreg(a|ar)|sacar?)\s+(el\s+|un\s+)?(informe|reporte)\b/i;
                const phoneticApproxRegex = /\b(general)\s+(el\s+|al\s+)?(informe|reporte)\b/i;
                if (userReportRegex.test(cleanText) || phoneticApproxRegex.test(cleanText)) {
                    logger.info(`[VoiceSession] Real-time voice trigger matched in user transcription: "${cleanText}"`);
                    this.isGeneratingReport = true;
                    this.sendToClient({
                        type: 'status',
                        data: { status: 'generating_report', message: 'Compilando informe técnico...' }
                    });
                    this.generateReport(this.config.conversationContext).finally(() => {
                        this.isGeneratingReport = false;
                    });
                }
            }
        });


        const sanitizeAiSpeech = (raw) => {
            if (!raw || typeof raw !== 'string') return raw;
            return raw
                .replace(/\b(that's\s+all\s+set|all\s+set|that\s+is\s+all\s+set)\b\.?/gi, '')
                .replace(/\b(la\s+informaci[oó]n\s+anterior\s+no\s+constituye\s+consejo\s+m[eé]dico[^\.\n]*[\.\n]?)/gi, '')
                .replace(/\b(recuerde?\s+consultar\s+a\s+un\s+(profesional|m[eé]dico)[^\.\n]*[\.\n]?)/gi, '')
                .replace(/\b(this\s+is\s+not\s+medical\s+advice[^\.\n]*[\.\n]?)/gi, '');
        };

        // Listen for AI transcription (what the AI says)
        this.geminiClient.on('aiTranscription', (text) => {
            const cleanText = sanitizeAiSpeech(text);
            logger.info(`[VoiceSession] AI transcription received: "${cleanText}"`);
            // Accumulate AI text (both buffers, so the trigger can find the phrase)
            this.aiResponseText += cleanText;
            this.aiTranscriptionBuffer += cleanText;

            // Forward full cumulative text to client so assistant chat bubble updates in real time
            this.sendToClient({
                type: 'text',
                data: {
                    text: sanitizeAiSpeech(this.aiResponseText),
                    isUserTranscription: false
                }
            });
        });

        // Listen for AI TEXT response
        this.geminiClient.on('aiText', (text) => {
            logger.info(`[VoiceSession] AI text response received: "${text}"`);

            // Filter AI "thinking" text - don't accumulate or send to client
            const shouldSkip = text.startsWith('**') ||
                text.includes('Considering') ||
                text.includes('Analyzing') ||
                text.includes('linguist') ||
                text.includes('Evaluating') ||
                text.includes('Reviewing');

            if (shouldSkip) {
                logger.info(`[VoiceSession] Skipping AI "thinking" text (not user-facing)`);
                return;
            }

            const cleanText = sanitizeAiSpeech(text);
            // Accumulate AI text
            this.aiResponseText += cleanText;
            // Send to client in real-time with correct format
            this.sendToClient({
                type: 'text',
                data: { text: cleanText }
            });
        });

        // Listen for Tool Calls
        this.geminiClient.on('toolCall', async (toolCall) => {
            logger.info('[VoiceSession] Tool Call received:', JSON.stringify(toolCall));
            this.toolCalledThisTurn = true;

            if (toolCall.functionCalls) {
                const toolReq = {
                    user: { id: this.userId, _id: this.userId, role: this.userRole || 'ADMIN' },
                    body: {
                        conversationId: this.conversationId && this.conversationId !== 'new' ? this.conversationId : `tenshi-${this.userId}`
                    }
                };

                for (const fc of toolCall.functionCalls) {
                    // Manejo de cambio de fase interactiva
                    if (fc.name === 'cambiar_fase_evaluacion') {
                        const targetPhase = fc.args?.fase || 2;
                        logger.info(`[VoiceSession] Gemini invoked tool "${fc.name}" with phase: ${targetPhase}`);
                        this.sendToClient({
                            type: 'wappy_action',
                            data: {
                                id: fc.id,
                                name: fc.name,
                                args: fc.args
                            }
                        });
                        if (this.geminiClient) {
                            this.geminiClient.sendToolResponse([{
                                id: fc.id,
                                name: fc.name,
                                response: { result: `Fase ${targetPhase} activada en la pantalla del usuario con éxito.` }
                            }]);
                        }
                        continue;
                    }

                    // Manejo directo de herramienta nativa de informe
                    if (fc.name === 'generar_informe_tecnico' || fc.name === 'generar_informe_ergonomico') {
                        const phaseCount = this.phaseEvidences ? Object.keys(this.phaseEvidences).length : 0;
                        const turnCount = this.conversationTurns ? this.conversationTurns.length : 0;
                        if (turnCount < 2 && phaseCount === 0) {
                            logger.warn(`[VoiceSession] Gemini prematurely called "${fc.name}" on turn ${turnCount} with 0 phases. Rejecting premature call.`);
                            if (this.geminiClient) {
                                this.geminiClient.sendToolResponse([{
                                    id: fc.id,
                                    name: fc.name,
                                    response: { result: "Aún no se puede compilar el informe técnico porque recién estamos iniciando la evaluación de campo. Continúa guiando al usuario en el Paso 1 (Postura Habitual)." }
                                }]);
                            }
                            continue;
                        }

                        logger.info(`[VoiceSession] Gemini invoked native tool "${fc.name}"! Triggering report generation...`);
                        
                        this.sendToClient({
                            type: 'status',
                            data: { status: 'generating_report', message: 'Compilando informe técnico...' }
                        });

                        if (this.geminiClient) {
                            this.geminiClient.sendToolResponse([{
                                id: fc.id,
                                name: fc.name,
                                response: {
                                    output: "Compilación de informe técnico iniciada con éxito en segundo plano.",
                                    result: "Compilación de informe técnico iniciada con éxito en segundo plano."
                                }
                            }]);

                            // Activación verbal inmediata vía realtimeInput para que Gemini Live 3.8 lo anuncie por voz
                            this.geminiClient.sendText('INSTRUCCIÓN: Has iniciado la compilación del informe técnico ergonómico. Confírmale verbalmente al usuario en 1 sola frase breve y entusiasta: "Entendido, estoy procesando las evidencias para compilar tu informe técnico oficial. Por favor espera un momento conectado."');
                        }

                        if (!this.isGeneratingReport) {
                            this.isGeneratingReport = true;
                            this.generateReport(this.config.conversationContext).finally(() => {
                                this.isGeneratingReport = false;
                            });
                        }
                        continue;
                    }

                    // Manejo directo de herramienta de Google Drive en modo voz
                    if (fc.name === 'google_drive') {
                        logger.info(`[VoiceSession] Gemini Live invoked tool "google_drive" with args:`, JSON.stringify(fc.args));
                        this.sendToClient({
                            type: 'status',
                            data: { status: 'loading', message: 'Consultando Google Drive...' }
                        });
                        try {
                            const GoogleDrive = require('~/app/clients/tools/structured/GoogleDrive');
                            const googleDriveTool = new GoogleDrive({ req: toolReq });
                            const driveResult = await googleDriveTool._call(fc.args || { action: 'list_files_and_folders' });
                            logger.info(`[VoiceSession] google_drive executed successfully. Result length: ${driveResult?.length || 0}`);
                            if (this.geminiClient) {
                                this.geminiClient.sendToolResponse([{
                                    id: fc.id,
                                    name: fc.name,
                                    response: { result: driveResult }
                                }]);
                            }
                        } catch (driveErr) {
                            logger.error('[VoiceSession] Error executing google_drive in voice mode:', driveErr);
                            if (this.geminiClient) {
                                this.geminiClient.sendToolResponse([{
                                    id: fc.id,
                                    name: fc.name,
                                    response: { error: `No se pudo acceder a Google Drive: ${driveErr.message}` }
                                }]);
                            }
                        }
                        continue;
                    }

                    // Manejo directo de herramienta de búsqueda web en modo voz
                    if (fc.name === 'web_search') {
                        logger.info(`[VoiceSession] Gemini Live invoked tool "web_search" with args:`, JSON.stringify(fc.args));
                        this.sendToClient({
                            type: 'status',
                            data: { status: 'loading', message: 'Buscando en la web...' }
                        });
                        try {
                            const WebSearch = require('~/app/clients/tools/structured/WebSearch');
                            const webSearchTool = new WebSearch({ req: toolReq });
                            const searchResult = await webSearchTool._call(fc.args);
                            logger.info(`[VoiceSession] web_search executed successfully. Result length: ${searchResult?.length || 0}`);
                            if (this.geminiClient) {
                                this.geminiClient.sendToolResponse([{
                                    id: fc.id,
                                    name: fc.name,
                                    response: { result: searchResult }
                                }]);
                            }
                        } catch (searchErr) {
                            logger.error('[VoiceSession] Error executing web_search in voice mode:', searchErr);
                            if (this.geminiClient) {
                                this.geminiClient.sendToolResponse([{
                                    id: fc.id,
                                    name: fc.name,
                                    response: { error: `No se pudo buscar en la web: ${searchErr.message}` }
                                }]);
                            }
                        }
                        continue;
                    }

                    // Manejo directo de Canvas / Archivos (Word, Excel, HTML, Presentación) en modo voz.
                    if (fc.name === 'canvas_tool' || fc.name === 'canvas') {
                        logger.info(`[VoiceSession] Gemini Live invoked tool "canvas_tool" with title: "${fc.args?.title}", fileType: "${fc.args?.fileType}"`);
                        const userRequestText = (this.userTranscriptionText || '').trim() || this.lastUserRequest || fc.args?.title;
                        const res = await this.executeCanvasTool(fc.args, userRequestText, fc.id);

                        const resultText = res.ok
                            ? `[INSTRUCCIÓN ESTRICTA EN ESPAÑOL]: Confirma al usuario ÚNICAMENTE en español en una sola frase breve y directa: "¡Listo! Ya te generé el ${res.fileTypeLabel} '${res.finalTitle}' en pantalla y tienes los botones para descargarlo o visualizarlo." ESTÁ TERMINANTEMENTE PROHIBIDO RESPONDER EN INGLÉS.`
                            : `[INSTRUCCIÓN ESTRICTA EN ESPAÑOL]: Dile al usuario honestamente en español: "No se pudo crear el archivo '${fc.args?.title}': ${res.failReason}."`;
                        this.sendGeminiToolResponse([{
                            id: fc.id,
                            name: fc.name,
                            response: { result: resultText }
                        }]);
                        continue;
                    }

                    // Manejo directo de selección y activación de empresa en modo voz
                    if (fc.name === 'wappy_seleccionar_empresa' || fc.name === 'wappy_activar_empresa') {
                        const term = fc.args?.nombre_o_id || fc.args?.empresa || fc.args?.nombre || fc.args?.id || fc.args?.companyId || fc.args?.target;
                        logger.info(`[VoiceSession] Gemini Live invoked tool "${fc.name}" with term: "${term}"`);
                        try {
                            let targetUserId = this.userId;
                            try {
                                const User = mongoose.models.User || require('~/models/User');
                                const userDoc = await User.findById(this.userId).select('isSubUser parentUser').lean();
                                if (userDoc?.isSubUser && userDoc?.parentUser) {
                                    targetUserId = userDoc.parentUser.toString();
                                }
                            } catch (uErr) { }

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
                                logger.info(`[VoiceSession] Activated company "${found.companyName}" (${found._id})`);

                                this.sendToClient({
                                    type: 'wappy_action',
                                    data: {
                                        id: fc.id,
                                        name: fc.name,
                                        args: fc.args,
                                        result: { success: true, companyName: found.companyName, companyId: found._id }
                                    }
                                });

                                if (this.geminiClient) {
                                    this.geminiClient.sendToolResponse([{
                                        id: fc.id,
                                        name: fc.name,
                                        response: { result: `Empresa "${found.companyName}" seleccionada y activada con éxito en el sistema.` }
                                    }]);
                                }
                            } else {
                                if (this.geminiClient) {
                                    this.geminiClient.sendToolResponse([{
                                        id: fc.id,
                                        name: fc.name,
                                        response: { error: `No se encontró ninguna empresa registrada con el nombre o identificador "${term}".` }
                                    }]);
                                }
                            }
                        } catch (selErr) {
                            logger.error('[VoiceSession] Error in wappy_seleccionar_empresa:', selErr);
                            if (this.geminiClient) {
                                this.geminiClient.sendToolResponse([{
                                    id: fc.id,
                                    name: fc.name,
                                    response: { error: `Error activando empresa: ${selErr.message}` }
                                }]);
                            }
                        }
                        continue;
                    }

                    // Manejo directo de consulta y guardado de memoria en modo voz
                    if (fc.name === 'gestionar_memoria') {
                        logger.info(`[VoiceSession] Gemini Live invoked tool "gestionar_memoria" with args:`, JSON.stringify(fc.args));
                        try {
                            let targetUserId = this.userId;
                            try {
                                const User = mongoose.models.User || require('~/models/User');
                                const userDoc = await User.findById(this.userId).select('isSubUser parentUser').lean();
                                if (userDoc?.isSubUser && userDoc?.parentUser) {
                                    targetUserId = userDoc.parentUser.toString();
                                }
                            } catch (uErr) { }

                            const accion = fc.args?.accion || 'consultar';
                            const clave = fc.args?.clave;
                            const valor = fc.args?.valor;

                            if (accion === 'guardar' && clave && valor) {
                                await setMemory({ userId: targetUserId, agentId: 'global', key: clave, value: valor });
                                if (this.geminiClient) {
                                    this.geminiClient.sendToolResponse([{
                                        id: fc.id,
                                        name: fc.name,
                                        response: { result: `Dato guardado exitosamente en la memoria bajo la clave "${clave}".` }
                                    }]);
                                }
                            } else if (accion === 'eliminar' && clave) {
                                await deleteMemory({ userId: targetUserId, agentId: 'global', key: clave });
                                if (this.geminiClient) {
                                    this.geminiClient.sendToolResponse([{
                                        id: fc.id,
                                        name: fc.name,
                                        response: { result: `Memoria "${clave}" eliminada con éxito.` }
                                    }]);
                                }
                            } else {
                                const rawMems = await getAllUserMemories(targetUserId);
                                const unique = new Map();
                                (rawMems || []).forEach(m => { if (m.key && !unique.has(m.key)) unique.set(m.key, m.value); });
                                const list = Array.from(unique.entries()).map(([k, v]) => `[${k}]: ${v}`).join('\n');
                                if (this.geminiClient) {
                                    this.geminiClient.sendToolResponse([{
                                        id: fc.id,
                                        name: fc.name,
                                        response: { result: list || 'No hay memorias registradas aún.' }
                                    }]);
                                }
                            }
                        } catch (memErr) {
                            logger.error('[VoiceSession] Error executing gestionar_memoria:', memErr);
                            if (this.geminiClient) {
                                this.geminiClient.sendToolResponse([{
                                    id: fc.id,
                                    name: fc.name,
                                    response: { error: `Error gestionando memoria: ${memErr.message}` }
                                }]);
                            }
                        }
                        continue;
                    }

                    // Manejo directo de Creación y Entrega de Informes en el chat de Tenshi
                    if (fc.name === 'wappy_crear_informe' || fc.name === 'wappy_generar_informe') {
                        logger.info(`[VoiceSession] Gemini Live invoked tool "${fc.name}" with args:`, JSON.stringify(fc.args));
                        this.sendToClient({
                            type: 'status',
                            data: { status: 'loading', message: `Generando ${fc.args?.titulo || 'informe técnico'}...` }
                        });
                        try {
                            const repRes = await executeTenshiMcpTool('wappy_crear_informe', fc.args || {}, this.userId);
                            const repInfo = repRes?.informe || {};
                            const title = repInfo.titulo || fc.args?.titulo || 'Informe Técnico SG-SST';
                            const fileType = repInfo.formato || fc.args?.formato || 'html';
                            const content = repInfo.contenido || fc.args?.contenido || 'Informe técnico oficial generado.';

                            // Entregar archivo en el chat de Tenshi con botones de descarga
                            await this.executeCanvasTool({
                                accion: 'crear',
                                fileType,
                                title,
                                content
                            }, title, fc.id);

                            this.sendToClient({
                                type: 'wappy_action',
                                data: {
                                    id: fc.id,
                                    name: 'wappy_crear_informe',
                                    args: fc.args,
                                    result: repRes
                                }
                            });

                            if (this.geminiClient) {
                                this.sendGeminiToolResponse([{
                                    id: fc.id,
                                    name: fc.name,
                                    response: {
                                        result: `Informe "${title}" generado exitosamente y entregado en el chat de Tenshi con botones para descargar en ${fileType.toUpperCase()} y visor interactivo. Dile al usuario en una sola frase cordial que ya se lo entregaste en su chat para descargarlo o leerlo, y resúmele sus conclusiones principales.`
                                    }
                                }]);
                            }
                        } catch (repErr) {
                            logger.error('[VoiceSession] Error generating report:', repErr);
                            if (this.geminiClient) {
                                this.sendGeminiToolResponse([{
                                    id: fc.id,
                                    name: fc.name,
                                    response: { error: `Error generando informe: ${repErr.message}` }
                                }]);
                            }
                        }
                        continue;
                    }

                    // Manejo directo de Envío de Correos Electrónicos
                    if (fc.name === 'wappy_enviar_correo' || fc.name === 'enviar_correo') {
                        logger.info(`[VoiceSession] Gemini Live invoked tool "${fc.name}" with args:`, JSON.stringify(fc.args));
                        this.sendToClient({
                            type: 'status',
                            data: { status: 'loading', message: `Enviando correo a ${fc.args?.destinatario || ''}...` }
                        });
                        try {
                            const mailRes = await executeTenshiMcpTool('wappy_enviar_correo', fc.args || {}, this.userId);
                            this.sendToClient({
                                type: 'wappy_action',
                                data: {
                                    id: fc.id,
                                    name: 'wappy_enviar_correo',
                                    args: fc.args,
                                    result: mailRes
                                }
                            });

                            if (this.geminiClient) {
                                this.sendGeminiToolResponse([{
                                    id: fc.id,
                                    name: fc.name,
                                    response: {
                                        result: mailRes?.mensaje || `Correo electrónico enviado con éxito a ${fc.args?.destinatario}.`
                                    }
                                }]);
                            }
                        } catch (mailErr) {
                            logger.error('[VoiceSession] Error sending email:', mailErr);
                            if (this.geminiClient) {
                                this.sendGeminiToolResponse([{
                                    id: fc.id,
                                    name: fc.name,
                                    response: { error: `No se pudo enviar el correo: ${mailErr.message}` }
                                }]);
                            }
                        }
                        continue;
                    }

                    // Manejo directo de Gestión de Agendas y Calendario
                    if (fc.name === 'wappy_gestionar_agenda' || fc.name === 'wappy_listar_agenda') {
                        logger.info(`[VoiceSession] Gemini Live invoked tool "${fc.name}" with args:`, JSON.stringify(fc.args));
                        try {
                            const agendaRes = await executeTenshiMcpTool('wappy_gestionar_agenda', fc.args || {}, this.userId);
                            this.sendToClient({
                                type: 'wappy_action',
                                data: {
                                    id: fc.id,
                                    name: 'wappy_gestionar_agenda',
                                    args: fc.args,
                                    result: agendaRes
                                }
                            });

                            if (this.geminiClient) {
                                this.sendGeminiToolResponse([{
                                    id: fc.id,
                                    name: fc.name,
                                    response: {
                                        result: agendaRes?.mensaje || (agendaRes?.eventos ? `Agenda consultada: ${agendaRes.eventos.length} eventos encontrados.` : JSON.stringify(agendaRes))
                                    }
                                }]);
                            }
                        } catch (calErr) {
                            logger.error('[VoiceSession] Error in wappy_gestionar_agenda:', calErr);
                            if (this.geminiClient) {
                                this.sendGeminiToolResponse([{
                                    id: fc.id,
                                    name: fc.name,
                                    response: { error: `Error en la agenda: ${calErr.message}` }
                                }]);
                            }
                        }
                        continue;
                    }

                    // Manejo directo de Códigos QR para Trabajadores
                    if (fc.name === 'wappy_generar_qr' || fc.name === 'generar_qr') {
                        logger.info(`[VoiceSession] Gemini Live invoked tool "${fc.name}" with args:`, JSON.stringify(fc.args));
                        this.sendToClient({
                            type: 'status',
                            data: { status: 'loading', message: 'Generando código QR...' }
                        });
                        try {
                            const qrRes = await executeTenshiMcpTool('wappy_generar_qr', fc.args || {}, this.userId);
                            if (qrRes && qrRes.exito) {
                                try {
                                    const TenshiMessage = require('~/models/TenshiMessage');
                                    await TenshiMessage.create({
                                        user: this.userId,
                                        role: 'assistant',
                                        content: `📱 **Código QR y Enlace Generado**: [${qrRes.titulo}](${qrRes.url})\n\n${qrRes.descripcion}\n\n*${qrRes.instrucciones}*`,
                                        qrCode: qrRes,
                                    });
                                } catch (pErr) {
                                    logger.error('[VoiceSession] Error guardando QR en TenshiMessage:', pErr);
                                }

                                this.sendToClient({
                                    type: 'wappy_action',
                                    data: {
                                        id: fc.id,
                                        name: 'wappy_generar_qr',
                                        args: fc.args,
                                        result: qrRes,
                                        qr: qrRes,
                                    }
                                });

                                if (this.geminiClient) {
                                    this.sendGeminiToolResponse([{
                                        id: fc.id,
                                        name: fc.name,
                                        response: {
                                            result: `Código QR para "${qrRes.titulo}" generado exitosamente y entregado en el chat de Tenshi. Enlace público: ${qrRes.url}. Confírmale al usuario en una sola frase breve y cordial que ya le dejaste el QR y el enlace en su chat para que lo comparta con los trabajadores o lo escanee desde el celular.`
                                        }
                                    }]);
                                }
                            } else {
                                throw new Error(qrRes?.error || 'No se pudo generar el código QR.');
                            }
                        } catch (qrErr) {
                            logger.error('[VoiceSession] Error generating QR code:', qrErr);
                            if (this.geminiClient) {
                                this.sendGeminiToolResponse([{
                                    id: fc.id,
                                    name: fc.name,
                                    response: { error: `No se pudo generar el código QR: ${qrErr.message}` }
                                }]);
                            }
                        }
                        continue;
                    }

                    // Manejo directo de Analítica Psicosocial
                    if (fc.name === 'wappy_consultar_analitica_psicosocial' || fc.name === 'consultar_analitica_psicosocial') {
                        logger.info(`[VoiceSession] Gemini Live invoked tool "${fc.name}"`);
                        try {
                            const psicoRes = await executeTenshiMcpTool('wappy_consultar_analitica_psicosocial', fc.args || {}, this.userId);
                            if (this.geminiClient) {
                                this.sendGeminiToolResponse([{
                                    id: fc.id,
                                    name: fc.name,
                                    response: {
                                        result: JSON.stringify(psicoRes)
                                    }
                                }]);
                            }
                        } catch (pErr) {
                            logger.error('[VoiceSession] Error in analitica psicosocial:', pErr);
                            if (this.geminiClient) {
                                this.sendGeminiToolResponse([{
                                    id: fc.id,
                                    name: fc.name,
                                    response: { error: `Error consultando analítica psicosocial: ${pErr.message}` }
                                }]);
                            }
                        }
                        continue;
                    }

                    // Manejo directo de Analítica de Actos y Condiciones
                    if (fc.name === 'wappy_consultar_analitica_actos_condiciones' || fc.name === 'consultar_analitica_actos_condiciones') {
                        logger.info(`[VoiceSession] Gemini Live invoked tool "${fc.name}"`);
                        try {
                            const actosRes = await executeTenshiMcpTool('wappy_consultar_analitica_actos_condiciones', fc.args || {}, this.userId);
                            if (this.geminiClient) {
                                this.sendGeminiToolResponse([{
                                    id: fc.id,
                                    name: fc.name,
                                    response: {
                                        result: JSON.stringify(actosRes)
                                    }
                                }]);
                            }
                        } catch (aErr) {
                            logger.error('[VoiceSession] Error in analitica actos y condiciones:', aErr);
                            if (this.geminiClient) {
                                this.sendGeminiToolResponse([{
                                    id: fc.id,
                                    name: fc.name,
                                    response: { error: `Error consultando analítica de actos y condiciones: ${aErr.message}` }
                                }]);
                            }
                        }
                        continue;
                    }

                    // Manejo directo de SOMOS SST (Bio Motor y Ecosistema)
                    if (fc.name === 'somos_sst') {
                        logger.info(`[VoiceSession] Gemini Live invoked tool "somos_sst" with args:`, JSON.stringify(fc.args));
                        this.sendToClient({
                            type: 'status',
                            data: { status: 'loading', message: 'Consultando Somos SST...' }
                        });
                        try {
                            const SomosSST = require('~/app/clients/tools/structured/SomosSST');
                            const toolInstance = new SomosSST({ req: toolReq });
                            const toolOutput = await toolInstance._call(fc.args);
                            const outputStr = typeof toolOutput === 'string' ? toolOutput : JSON.stringify(toolOutput);

                            this.sendToClient({
                                type: 'wappy_action',
                                data: { id: fc.id, name: fc.name, args: fc.args, result: toolOutput }
                            });

                            if (this.geminiClient) {
                                this.geminiClient.sendToolResponse([{
                                    id: fc.id,
                                    name: fc.name,
                                    response: { result: outputStr }
                                }]);
                            }
                        } catch (sstErr) {
                            logger.error('[VoiceSession] Error executing somos_sst:', sstErr);
                            if (this.geminiClient) {
                                this.geminiClient.sendToolResponse([{
                                    id: fc.id,
                                    name: fc.name,
                                    response: { error: `Error en somos_sst: ${sstErr.message}` }
                                }]);
                            }
                        }
                        continue;
                    }

                    // Manejo directo de Matriz IPEVAR / GTC-45
                    if (fc.name === 'matriz_ipevar') {
                        logger.info(`[VoiceSession] Gemini Live invoked tool "matriz_ipevar" with args:`, JSON.stringify(fc.args));
                        this.sendToClient({
                            type: 'status',
                            data: { status: 'loading', message: 'Procesando Matriz IPEVAR...' }
                        });
                        try {
                            const MatrizIPEVAR = require('~/app/clients/tools/structured/MatrizIPEVAR');
                            const toolInstance = new MatrizIPEVAR({ req: toolReq });
                            const toolOutput = await toolInstance._call(fc.args);
                            const outputStr = typeof toolOutput === 'string' ? toolOutput : JSON.stringify(toolOutput);

                            this.sendToClient({
                                type: 'wappy_action',
                                data: { id: fc.id, name: fc.name, args: fc.args, result: toolOutput }
                            });

                            if (this.geminiClient) {
                                this.geminiClient.sendToolResponse([{
                                    id: fc.id,
                                    name: fc.name,
                                    response: { result: outputStr }
                                }]);
                            }
                        } catch (ipevarErr) {
                            logger.error('[VoiceSession] Error executing matriz_ipevar:', ipevarErr);
                            if (this.geminiClient) {
                                this.geminiClient.sendToolResponse([{
                                    id: fc.id,
                                    name: fc.name,
                                    response: { error: `Error en matriz_ipevar: ${ipevarErr.message}` }
                                }]);
                            }
                        }
                        continue;
                    }

                    // Manejo directo de Matriz PESV (Seguridad Vial)
                    if (fc.name === 'matriz_pesv') {
                        logger.info(`[VoiceSession] Gemini Live invoked tool "matriz_pesv" with args:`, JSON.stringify(fc.args));
                        this.sendToClient({
                            type: 'status',
                            data: { status: 'loading', message: 'Procesando Matriz PESV...' }
                        });
                        try {
                            const MatrizPESV = require('~/app/clients/tools/structured/MatrizPESV');
                            const toolInstance = new MatrizPESV({ req: toolReq });
                            const toolOutput = await toolInstance._call(fc.args);
                            const outputStr = typeof toolOutput === 'string' ? toolOutput : JSON.stringify(toolOutput);

                            this.sendToClient({
                                type: 'wappy_action',
                                data: { id: fc.id, name: fc.name, args: fc.args, result: toolOutput }
                            });

                            if (this.geminiClient) {
                                this.geminiClient.sendToolResponse([{
                                    id: fc.id,
                                    name: fc.name,
                                    response: { result: outputStr }
                                }]);
                            }
                        } catch (pesvErr) {
                            logger.error('[VoiceSession] Error executing matriz_pesv:', pesvErr);
                            if (this.geminiClient) {
                                this.geminiClient.sendToolResponse([{
                                    id: fc.id,
                                    name: fc.name,
                                    response: { error: `Error en matriz_pesv: ${pesvErr.message}` }
                                }]);
                            }
                        }
                        continue;
                    }

                    // Manejo directo de Matriz de Compatibilidad SGA
                    if (fc.name === 'matriz_compatibilidad') {
                        logger.info(`[VoiceSession] Gemini Live invoked tool "matriz_compatibilidad" with args:`, JSON.stringify(fc.args));
                        this.sendToClient({
                            type: 'status',
                            data: { status: 'loading', message: 'Procesando Matriz SGA...' }
                        });
                        try {
                            const MatrizCompatibilidad = require('~/app/clients/tools/structured/MatrizCompatibilidad');
                            const toolInstance = new MatrizCompatibilidad({ req: toolReq });
                            const toolOutput = await toolInstance._call(fc.args);
                            const outputStr = typeof toolOutput === 'string' ? toolOutput : JSON.stringify(toolOutput);

                            this.sendToClient({
                                type: 'wappy_action',
                                data: { id: fc.id, name: fc.name, args: fc.args, result: toolOutput }
                            });

                            if (this.geminiClient) {
                                this.geminiClient.sendToolResponse([{
                                    id: fc.id,
                                    name: fc.name,
                                    response: { result: outputStr }
                                }]);
                            }
                        } catch (compErr) {
                            logger.error('[VoiceSession] Error executing matriz_compatibilidad:', compErr);
                            if (this.geminiClient) {
                                this.geminiClient.sendToolResponse([{
                                    id: fc.id,
                                    name: fc.name,
                                    response: { error: `Error en matriz_compatibilidad: ${compErr.message}` }
                                }]);
                            }
                        }
                        continue;
                    }

                    // Manejo directo de Gestor de Automatizaciones
                    if (fc.name === 'gestor_automatizaciones') {
                        logger.info(`[VoiceSession] Gemini Live invoked tool "gestor_automatizaciones" with args:`, JSON.stringify(fc.args));
                        this.sendToClient({
                            type: 'status',
                            data: { status: 'loading', message: 'Gestionando automatizaciones...' }
                        });
                        try {
                            const GestorAutomatizaciones = require('~/app/clients/tools/structured/GestorAutomatizaciones');
                            const toolInstance = new GestorAutomatizaciones({ req: toolReq });
                            const toolOutput = await toolInstance._call(fc.args);
                            const outputStr = typeof toolOutput === 'string' ? toolOutput : JSON.stringify(toolOutput);

                            this.sendToClient({
                                type: 'wappy_action',
                                data: { id: fc.id, name: fc.name, args: fc.args, result: toolOutput }
                            });

                            if (this.geminiClient) {
                                this.geminiClient.sendToolResponse([{
                                    id: fc.id,
                                    name: fc.name,
                                    response: { result: outputStr }
                                }]);
                            }
                        } catch (autoErr) {
                            logger.error('[VoiceSession] Error executing gestor_automatizaciones:', autoErr);
                            if (this.geminiClient) {
                                this.geminiClient.sendToolResponse([{
                                    id: fc.id,
                                    name: fc.name,
                                    response: { error: `Error en gestor_automatizaciones: ${autoErr.message}` }
                                }]);
                            }
                        }
                        continue;
                    }

                    // Manejo directo de Google Sheets
                    if (fc.name === 'google_sheets') {
                        logger.info(`[VoiceSession] Gemini Live invoked tool "google_sheets" with args:`, JSON.stringify(fc.args));
                        this.sendToClient({
                            type: 'status',
                            data: { status: 'loading', message: 'Conectando con Google Sheets...' }
                        });
                        try {
                            const GoogleSheets = require('~/app/clients/tools/structured/GoogleSheets');
                            const toolInstance = new GoogleSheets({ req: toolReq });
                            const toolOutput = await toolInstance._call(fc.args);
                            const outputStr = typeof toolOutput === 'string' ? toolOutput : JSON.stringify(toolOutput);
                            if (this.geminiClient) {
                                this.geminiClient.sendToolResponse([{
                                    id: fc.id,
                                    name: fc.name,
                                    response: { result: outputStr }
                                }]);
                            }
                        } catch (sheetsErr) {
                            logger.error('[VoiceSession] Error executing google_sheets:', sheetsErr);
                            if (this.geminiClient) {
                                this.geminiClient.sendToolResponse([{
                                    id: fc.id,
                                    name: fc.name,
                                    response: { error: `Error en google_sheets: ${sheetsErr.message}` }
                                }]);
                            }
                        }
                        continue;
                    }

                    // Manejo directo de Google Docs
                    if (fc.name === 'google_docs') {
                        logger.info(`[VoiceSession] Gemini Live invoked tool "google_docs" with args:`, JSON.stringify(fc.args));
                        this.sendToClient({
                            type: 'status',
                            data: { status: 'loading', message: 'Conectando con Google Docs...' }
                        });
                        try {
                            const GoogleDocs = require('~/app/clients/tools/structured/GoogleDocs');
                            const toolInstance = new GoogleDocs({ req: toolReq });
                            const toolOutput = await toolInstance._call(fc.args);
                            const outputStr = typeof toolOutput === 'string' ? toolOutput : JSON.stringify(toolOutput);
                            if (this.geminiClient) {
                                this.geminiClient.sendToolResponse([{
                                    id: fc.id,
                                    name: fc.name,
                                    response: { result: outputStr }
                                }]);
                            }
                        } catch (docsErr) {
                            logger.error('[VoiceSession] Error executing google_docs:', docsErr);
                            if (this.geminiClient) {
                                this.geminiClient.sendToolResponse([{
                                    id: fc.id,
                                    name: fc.name,
                                    response: { error: `Error en google_docs: ${docsErr.message}` }
                                }]);
                            }
                        }
                        continue;
                    }

                    // Manejo directo de Google Slides
                    if (fc.name === 'google_slides') {
                        logger.info(`[VoiceSession] Gemini Live invoked tool "google_slides" with args:`, JSON.stringify(fc.args));
                        this.sendToClient({
                            type: 'status',
                            data: { status: 'loading', message: 'Conectando con Google Slides...' }
                        });
                        try {
                            const GoogleSlides = require('~/app/clients/tools/structured/GoogleSlides');
                            const toolInstance = new GoogleSlides({ req: toolReq });
                            const toolOutput = await toolInstance._call(fc.args);
                            const outputStr = typeof toolOutput === 'string' ? toolOutput : JSON.stringify(toolOutput);
                            if (this.geminiClient) {
                                this.geminiClient.sendToolResponse([{
                                    id: fc.id,
                                    name: fc.name,
                                    response: { result: outputStr }
                                }]);
                            }
                        } catch (slidesErr) {
                            logger.error('[VoiceSession] Error executing google_slides:', slidesErr);
                            if (this.geminiClient) {
                                this.geminiClient.sendToolResponse([{
                                    id: fc.id,
                                    name: fc.name,
                                    response: { error: `Error en google_slides: ${slidesErr.message}` }
                                }]);
                            }
                        }
                        continue;
                    }

                    // Manejo directo de Google Gmail
                    if (fc.name === 'google_gmail') {
                        logger.info(`[VoiceSession] Gemini Live invoked tool "google_gmail" with args:`, JSON.stringify(fc.args));
                        this.sendToClient({
                            type: 'status',
                            data: { status: 'loading', message: 'Conectando con Gmail...' }
                        });
                        try {
                            const GoogleGmail = require('~/app/clients/tools/structured/GoogleGmail');
                            const toolInstance = new GoogleGmail({ req: toolReq });
                            const toolOutput = await toolInstance._call(fc.args);
                            const outputStr = typeof toolOutput === 'string' ? toolOutput : JSON.stringify(toolOutput);
                            if (this.geminiClient) {
                                this.geminiClient.sendToolResponse([{
                                    id: fc.id,
                                    name: fc.name,
                                    response: { result: outputStr }
                                }]);
                            }
                        } catch (gmailErr) {
                            logger.error('[VoiceSession] Error executing google_gmail:', gmailErr);
                            if (this.geminiClient) {
                                this.geminiClient.sendToolResponse([{
                                    id: fc.id,
                                    name: fc.name,
                                    response: { error: `Error en google_gmail: ${gmailErr.message}` }
                                }]);
                            }
                        }
                        continue;
                    }

                    // Manejo directo de Google Calendar
                    if (fc.name === 'google_calendar') {
                        logger.info(`[VoiceSession] Gemini Live invoked tool "google_calendar" with args:`, JSON.stringify(fc.args));
                        this.sendToClient({
                            type: 'status',
                            data: { status: 'loading', message: 'Conectando con Google Calendar...' }
                        });
                        try {
                            const GoogleCalendar = require('~/app/clients/tools/structured/GoogleCalendar');
                            const toolInstance = new GoogleCalendar({ req: toolReq });
                            const toolOutput = await toolInstance._call(fc.args);
                            const outputStr = typeof toolOutput === 'string' ? toolOutput : JSON.stringify(toolOutput);
                            if (this.geminiClient) {
                                this.geminiClient.sendToolResponse([{
                                    id: fc.id,
                                    name: fc.name,
                                    response: { result: outputStr }
                                }]);
                            }
                        } catch (calErr) {
                            logger.error('[VoiceSession] Error executing google_calendar:', calErr);
                            if (this.geminiClient) {
                                this.geminiClient.sendToolResponse([{
                                    id: fc.id,
                                    name: fc.name,
                                    response: { error: `Error en google_calendar: ${calErr.message}` }
                                }]);
                            }
                        }
                        continue;
                    }

                    // Manejo directo de Microsoft OneDrive
                    if (fc.name === 'onedrive' || fc.name === 'one_drive') {
                        logger.info(`[VoiceSession] Gemini Live invoked tool "${fc.name}" with args:`, JSON.stringify(fc.args));
                        this.sendToClient({
                            type: 'status',
                            data: { status: 'loading', message: 'Conectando con OneDrive...' }
                        });
                        try {
                            const OneDrive = require('~/app/clients/tools/structured/OneDrive');
                            const toolInstance = new OneDrive({ req: toolReq });
                            const toolOutput = await toolInstance._call(fc.args);
                            const outputStr = typeof toolOutput === 'string' ? toolOutput : JSON.stringify(toolOutput);
                            if (this.geminiClient) {
                                this.geminiClient.sendToolResponse([{
                                    id: fc.id,
                                    name: fc.name,
                                    response: { result: outputStr }
                                }]);
                            }
                        } catch (oneErr) {
                            logger.error('[VoiceSession] Error executing onedrive:', oneErr);
                            if (this.geminiClient) {
                                this.geminiClient.sendToolResponse([{
                                    id: fc.id,
                                    name: fc.name,
                                    response: { error: `Error en onedrive: ${oneErr.message}` }
                                }]);
                            }
                        }
                        continue;
                    }

                    // Manejo directo de Editor RIT (Reglamento Interno de Trabajo)
                    if (fc.name === 'editor_rit') {
                        logger.info(`[VoiceSession] Gemini Live invoked tool "editor_rit" with args:`, JSON.stringify(fc.args));
                        this.sendToClient({
                            type: 'status',
                            data: { status: 'loading', message: 'Editando Reglamento Interno de Trabajo...' }
                        });
                        try {
                            const EditorRIT = require('~/app/clients/tools/structured/EditorRIT');
                            const toolInstance = new EditorRIT({ req: toolReq });
                            const toolOutput = await toolInstance._call(fc.args);
                            const outputStr = typeof toolOutput === 'string' ? toolOutput : JSON.stringify(toolOutput);

                            this.sendToClient({
                                type: 'wappy_action',
                                data: { id: fc.id, name: fc.name, args: fc.args, result: toolOutput }
                            });

                            if (this.geminiClient) {
                                this.geminiClient.sendToolResponse([{
                                    id: fc.id,
                                    name: fc.name,
                                    response: { result: outputStr }
                                }]);
                            }
                        } catch (ritErr) {
                            logger.error('[VoiceSession] Error executing editor_rit:', ritErr);
                            if (this.geminiClient) {
                                this.geminiClient.sendToolResponse([{
                                    id: fc.id,
                                    name: fc.name,
                                    response: { error: `Error en editor_rit: ${ritErr.message}` }
                                }]);
                            }
                        }
                        continue;
                    }

                    // Manejo directo de Consultar Analítica Psicosocial
                    if (fc.name === 'consultar_analitica_psicosocial') {
                        logger.info(`[VoiceSession] Gemini Live invoked tool "consultar_analitica_psicosocial" with args:`, JSON.stringify(fc.args));
                        this.sendToClient({
                            type: 'status',
                            data: { status: 'loading', message: 'Consultando analítica psicosocial...' }
                        });
                        try {
                            const ConsultarAnaliticaPsicosocial = require('~/app/clients/tools/structured/ConsultarAnaliticaPsicosocial');
                            const toolInstance = new ConsultarAnaliticaPsicosocial({ req: toolReq });
                            const toolOutput = await toolInstance._call(fc.args);
                            const outputStr = typeof toolOutput === 'string' ? toolOutput : JSON.stringify(toolOutput);
                            if (this.geminiClient) {
                                this.geminiClient.sendToolResponse([{
                                    id: fc.id,
                                    name: fc.name,
                                    response: { result: outputStr }
                                }]);
                            }
                        } catch (psiErr) {
                            logger.error('[VoiceSession] Error executing consultar_analitica_psicosocial:', psiErr);
                            if (this.geminiClient) {
                                this.geminiClient.sendToolResponse([{
                                    id: fc.id,
                                    name: fc.name,
                                    response: { error: `Error en consultar_analitica_psicosocial: ${psiErr.message}` }
                                }]);
                            }
                        }
                        continue;
                    }

                    // Manejo directo de Consultar Analítica de Actos y Condiciones Inseguras
                    if (fc.name === 'consultar_analitica_actos_condiciones') {
                        logger.info(`[VoiceSession] Gemini Live invoked tool "consultar_analitica_actos_condiciones" with args:`, JSON.stringify(fc.args));
                        this.sendToClient({
                            type: 'status',
                            data: { status: 'loading', message: 'Consultando actos y condiciones...' }
                        });
                        try {
                            const ConsultarAnaliticaActosCondiciones = require('~/app/clients/tools/structured/ConsultarAnaliticaActosCondiciones');
                            const toolInstance = new ConsultarAnaliticaActosCondiciones({ req: toolReq });
                            const toolOutput = await toolInstance._call(fc.args);
                            const outputStr = typeof toolOutput === 'string' ? toolOutput : JSON.stringify(toolOutput);
                            if (this.geminiClient) {
                                this.geminiClient.sendToolResponse([{
                                    id: fc.id,
                                    name: fc.name,
                                    response: { result: outputStr }
                                }]);
                            }
                        } catch (actosErr) {
                            logger.error('[VoiceSession] Error executing consultar_analitica_actos_condiciones:', actosErr);
                            if (this.geminiClient) {
                                this.geminiClient.sendToolResponse([{
                                    id: fc.id,
                                    name: fc.name,
                                    response: { error: `Error en consultar_analitica_actos_condiciones: ${actosErr.message}` }
                                }]);
                            }
                        }
                        continue;
                    }

                    // Manejo universal de operaciones MCP de WAPPY (las 41 herramientas oficiales)
                    const isMcpCall =
                        fc.name === 'wappy_mcp_sst' ||
                        fc.name in TOOL_ROUTES ||
                        (fc.name.startsWith('wappy_') &&
                            !['wappy_navegar', 'wappy_seleccionar_empresa', 'wappy_diligenciar_formulario', 'wappy_abrir_chat_agente'].includes(fc.name));

                    if (isMcpCall) {
                        const targetTool = fc.name === 'wappy_mcp_sst' ? (fc.args?.herramienta || fc.args?.tool) : fc.name;
                        const targetArgs = fc.name === 'wappy_mcp_sst' ? (fc.args?.parametros || fc.args?.args || fc.args || {}) : (fc.args || {});

                        logger.info(`[VoiceSession] Gemini Live invoked WAPPY MCP tool "${targetTool}" with args:`, JSON.stringify(targetArgs));
                        this.sendToClient({
                            type: 'status',
                            data: { status: 'loading', message: `Consultando ${targetTool.replace(/_/g, ' ')}...` }
                        });

                        try {
                            const result = await executeTenshiMcpTool(targetTool, targetArgs, this.userId);
                            const resultStr = typeof result === 'string' ? result : JSON.stringify(result, null, 2);

                            this.sendToClient({
                                type: 'wappy_action',
                                data: { id: fc.id, name: targetTool, args: targetArgs, result }
                            });

                            if (this.geminiClient) {
                                this.geminiClient.sendToolResponse([{
                                    id: fc.id,
                                    name: fc.name,
                                    response: { result: resultStr }
                                }]);
                            }
                        } catch (mcpErr) {
                            logger.error(`[VoiceSession] Error executing MCP tool "${targetTool}":`, mcpErr);
                            if (this.geminiClient) {
                                this.geminiClient.sendToolResponse([{
                                    id: fc.id,
                                    name: fc.name,
                                    response: { error: `Error en la operación ${targetTool}: ${mcpErr.message}` }
                                }]);
                            }
                        }
                        continue;
                    }

                    // Navegación inmediata en la plataforma (wappy_navegar)
                    if (fc.name === 'wappy_navegar') {
                        const target = fc.args?.modulo || fc.args?.ruta || 'solicitado';
                        logger.info(`[VoiceSession] Navegación inmediata solicitada hacia "${target}"`);
                        this.sendToClient({
                            type: 'wappy_action',
                            data: {
                                id: fc.id,
                                name: fc.name,
                                args: fc.args
                            }
                        });
                        if (this.geminiClient) {
                            this.geminiClient.sendToolResponse([{
                                id: fc.id,
                                name: fc.name,
                                response: { result: `Navegando de inmediato a la sección ${target} en pantalla.` }
                            }]);
                        }
                        continue;
                    }

                    // Reintegrar / Reactivar trabajador en la plataforma
                    if (fc.name === 'wappy_reintegrar_trabajador' || fc.name === 'wappy_reactivar_trabajador') {
                        const targetWorker = fc.args?.idOrCedula || fc.args?.nombre || 'trabajador';
                        logger.info(`[VoiceSession] Reintegrando trabajador de inmediato: "${targetWorker}"`);
                        this.sendToClient({
                            type: 'wappy_action',
                            data: {
                                id: fc.id,
                                name: fc.name,
                                args: fc.args
                            }
                        });
                        if (this.geminiClient) {
                            this.geminiClient.sendToolResponse([{
                                id: fc.id,
                                name: fc.name,
                                response: { result: `Trabajador "${targetWorker}" reintegrado exitosamente en el sistema y marcado como Activo.` }
                            }]);
                        }
                        continue;
                    }

                    // Operar interfaz visual interactiva (clic, scroll, escribir)
                    if (fc.name === 'operar_interfaz_visual') {
                        const accion = fc.args?.accion || 'click';
                        const detalle = fc.args?.texto || fc.args?.detalle || 'elemento';
                        logger.info(`[VoiceSession] Operación de interfaz visual: accion=${accion}, detalle=${detalle}`);
                        this.sendToClient({
                            type: 'wappy_action',
                            data: {
                                id: fc.id,
                                name: fc.name,
                                args: fc.args
                            }
                        });
                        if (this.geminiClient) {
                            this.geminiClient.sendToolResponse([{
                                id: fc.id,
                                name: fc.name,
                                response: { result: `Acción visual "${accion}" ejecutada de inmediato en pantalla (${detalle}).` }
                            }]);
                        }
                        continue;
                    }

                    // Inspeccionar y leer contenido visible en pantalla (leer_pantalla)
                    if (fc.name === 'leer_pantalla') {
                        logger.info(`[VoiceSession] Invocado leer_pantalla para sección: ${fc.args?.seccion || 'todo'}`);
                        this.sendToClient({
                            type: 'wappy_action',
                            data: {
                                id: fc.id,
                                name: fc.name,
                                args: fc.args
                            }
                        });
                        if (!this.pendingToolCalls) this.pendingToolCalls = new Map();
                        const timeoutId = setTimeout(() => {
                            if (this.pendingToolCalls && this.pendingToolCalls.has(fc.id)) {
                                logger.warn(`[VoiceSession] Tool call ${fc.id} (leer_pantalla) timed out waiting for client`);
                                this.pendingToolCalls.delete(fc.id);
                                if (this.geminiClient) {
                                    this.geminiClient.sendToolResponse([{
                                        id: fc.id,
                                        name: fc.name,
                                        response: { result: "La pantalla se encuentra cargando en este instante o no contiene texto legible." }
                                    }]);
                                }
                            }
                        }, 4000);
                        this.pendingToolCalls.set(fc.id, { timeoutId, name: fc.name });
                        continue;
                    }

                    // Orquestación interna de Consulta a Especialistas (Tenshi como Directora de Orquesta)
                    if (fc.name === 'consultar_agente_especializado') {
                        const agente = fc.args?.nombre_especialista || fc.args?.agente || 'Especialista SG-SST';
                        const rawPregunta = (fc.args?.consulta_completa || fc.args?.pregunta || '').trim();

                        if (!rawPregunta || rawPregunta.length < 4) {
                            logger.warn(`[VoiceSession] Gemini invoked "consultar_agente_especializado" for "${agente}" without concrete question.`);
                            if (this.geminiClient) {
                                this.sendGeminiToolResponse([{
                                    id: fc.id,
                                    name: fc.name,
                                    response: {
                                        result: `Falta la consulta técnica concreta para ${agente}. Pregúntale al usuario qué tema o duda puntual desea plantear antes de consultar.`
                                    }
                                }]);
                            }
                            continue;
                        }

                        const pregunta = enrichTechnicalPrompt(rawPregunta, agente);
                        logger.info(`[VoiceSession] Orquestando internamente consulta a ${agente}: "${pregunta.substring(0, 60)}..."`);
                        this.sendToClient({
                            type: 'status',
                            data: { status: 'loading', message: `Consultando internamente con ${agente}...` }
                        });

                        try {
                            const ConsultarAgenteEspecializado = require('~/app/clients/tools/structured/ConsultarAgenteEspecializado');
                            const agentTool = new ConsultarAgenteEspecializado({ req: toolReq });
                            const specResponse = await agentTool._call({
                                nombre_especialista: agente,
                                consulta_completa: pregunta
                            });

                            logger.info(`[VoiceSession] Dictamen recibido de ${agente} (longitud: ${specResponse?.length || 0})`);

                            // Entregar la respuesta técnica en el chat de Tenshi
                            this.sendToClient({
                                type: 'wappy_action',
                                data: {
                                    id: fc.id,
                                    name: 'wappy_dictamen_especialista',
                                    args: { agente, pregunta },
                                    result: { respuesta: specResponse }
                                }
                            });

                            if (this.geminiClient) {
                                this.sendGeminiToolResponse([{
                                    id: fc.id,
                                    name: fc.name,
                                    response: {
                                        result: `[DICTAMEN TÉCNICO DE ${agente}]:\n${specResponse}\n\n[INSTRUCCIÓN CRÍTICA]: Explica verbalmente de forma clara las conclusiones técnicas que dictaminó ${agente} de forma fiel, sin añadir sermones paternalistas ni disclaimers. Confirma al usuario que ya le dejaste el dictamen completo registrado en el chat de Tenshi.`
                                    }
                                }]);
                            }
                        } catch (specErr) {
                            logger.error(`[VoiceSession] Error orquestando consulta a ${agente}:`, specErr);
                            if (this.geminiClient) {
                                this.sendGeminiToolResponse([{
                                    id: fc.id,
                                    name: fc.name,
                                    response: {
                                        result: `No se pudo conectar en segundo plano con ${agente}: ${specErr.message}. Responde tú misma directamente con tu base de conocimientos en SG-SST (Decreto 1072 de 2015).`
                                    }
                                }]);
                            }
                        }
                        continue;
                    }

                    // Apertura explícita de chat en pantalla solo si el usuario pide ver la pestaña/chat
                    if (fc.name === 'wappy_abrir_chat_agente') {
                        const agente = fc.args?.agente || fc.args?.nombre_especialista;
                        const rawPregunta = (fc.args?.pregunta || fc.args?.consulta_completa || '').trim();

                        if (!rawPregunta || rawPregunta.length < 4) {
                            logger.warn(`[VoiceSession] Gemini invoked "${fc.name}" for agent "${agente}" without concrete question. Asking user for context.`);
                            if (this.geminiClient) {
                                this.sendGeminiToolResponse([{
                                    id: fc.id,
                                    name: fc.name,
                                    response: {
                                        result: `NO se abrió el chat: falta la consulta concreta del usuario. Pregúntale verbalmente al usuario qué tema específico desea plantearle a ${agente || 'el especialista'} antes de abrir el chat.`
                                    }
                                }]);
                            }
                            continue;
                        }

                        // Enriquecer obligatoriamente la consulta con rigor técnico ocupacional (Regla 6)
                        const pregunta = enrichTechnicalPrompt(rawPregunta, agente);

                        const requestedNewChat = Boolean(
                            fc.args?.nuevo_chat ||
                            /\b(nuevo\s+chat|nueva\s+conversaci[oó]n|otro\s+chat|desde\s+cero|otro\s+tema|distinto|cambia|cambiemos)\b/i.test(this.lastUserTranscription || '') ||
                            /\b(nuevo\s+chat|nueva\s+conversaci[oó]n|otro\s+chat|desde\s+cero|otro\s+tema|distinto|cambia|cambiemos)\b/i.test(rawPregunta)
                        );

                        logger.info(`[VoiceSession] Gemini Live invoked "${fc.name}" -> delegating as wappy_abrir_chat_agente: ${agente}, nuevo_chat: ${requestedNewChat}, pregunta estructurada: "${pregunta.substring(0, 70)}..."`);
                        this.sendToClient({
                            type: 'wappy_action',
                            data: {
                                id: fc.id,
                                name: 'wappy_abrir_chat_agente',
                                args: { agente, pregunta, nuevo_chat: requestedNewChat }
                            }
                        });

                        if (this.geminiClient) {
                            this.sendGeminiToolResponse([{
                                id: fc.id,
                                name: fc.name,
                                response: {
                                    result: `Chat con ${agente} abierto en pantalla y consulta enviada con éxito. Confirma en una sola frase breve que ya abriste el chat con ${agente} en pantalla.`
                                }
                            }]);
                        }
                        continue;
                    }

                    // Send action request to client (demás herramientas de interfaz)
                    this.sendToClient({
                        type: 'wappy_action',
                        data: {
                            id: fc.id,
                            name: fc.name,
                            args: fc.args
                        }
                    });

                    // Safety timeout if client doesn't reply in 3 seconds
                    if (!this.pendingToolCalls) this.pendingToolCalls = new Map();
                    const timeoutId = setTimeout(() => {
                        if (this.pendingToolCalls && this.pendingToolCalls.has(fc.id)) {
                            logger.warn(`[VoiceSession] Tool call ${fc.id} (${fc.name}) timed out waiting for client`);
                            this.pendingToolCalls.delete(fc.id);
                            if (this.geminiClient) {
                                this.geminiClient.sendToolResponse([{
                                    id: fc.id,
                                    name: fc.name,
                                    response: { result: "Acción procesada en pantalla" }
                                }]);
                            }
                        }
                    }, 3000);
                    this.pendingToolCalls.set(fc.id, { timeoutId, name: fc.name });
                }
            }
        });

        // Listen for turn complete
        this.geminiClient.on('turnComplete', () => {
            logger.info('[VoiceSession] ========== TURN COMPLETE ==========');
            this.isAiSpeaking = false;
            this.suppressClientAudioUntil = null;
            if (this.aiSpeakingTimeout) {
                clearTimeout(this.aiSpeakingTimeout);
                this.aiSpeakingTimeout = null;
            }
            this.sendToClient({ type: 'status', data: { status: 'turn_complete' } });
            this.sendToClient({ type: 'status', data: { status: 'listening' } });
            // Guardar el turno en segundo plano para máxima respuesta y cero latencia
            this.saveCurrentTurn('TurnComplete').catch(err => {
                logger.error('[VoiceSession] Error in background saveCurrentTurn:', err);
            });
            logger.info('[VoiceSession] ========== END TURN ==========');
        });

        // Listen for Interrupted (User Barge-In)
        this.geminiClient.on('interrupted', () => {
            logger.info('[VoiceSession] ========== USER INTERRUPTED RESPONSE ==========');
            this.toolCalledThisTurn = false;
            this.isAiSpeaking = false;
            this.suppressClientAudioUntil = null;
            if (this.aiSpeakingTimeout) {
                clearTimeout(this.aiSpeakingTimeout);
                this.aiSpeakingTimeout = null;
            }
            this.sendToClient({ type: 'status', data: { status: 'interrupted' } });
            this.sendToClient({ type: 'interrupted', data: {} });
            // Reset temporary AI response buffers for this turn
            this.aiResponseText = '';
            this.aiTranscriptionBuffer = '';
            this.aiAudioChunkCount = 0;
        });

        // Handle Gemini connection close/error to avoid zombie state
        this.geminiClient.on('close', async (code, reason) => {
            const reasonStr = reason ? reason.toString() : '';
            logger.warn(`[VoiceSession] Gemini connection closed: Code ${code}, Reason: ${reasonStr}`);
            if (this.isActive) {
                // Si la desconexión fue inesperada (1011, 1006, etc.) y el cliente sigue conectado, reintentar con el siguiente modelo/clave
                if ((code === 1011 || code === 1006 || code === 1001 || !code) && this.clientWs && this.clientWs.readyState === WebSocket.OPEN) {
                    const reconnected = await this.reconnectGemini(`Code ${code}: ${reasonStr}`);
                    if (reconnected) {
                        return;
                    }
                }

                this.sendToClient({ type: 'status', data: { status: 'idle' } });
                const userMsg = reasonStr
                    ? `Conexión con Gemini finalizada (${code}): ${reasonStr}`
                    : 'Conexión con el motor de voz de Gemini finalizada.';
                this.sendToClient({ type: 'error', data: { message: userMsg } });
                this.stop().catch(err => logger.error('[VoiceSession] Error in stop on Gemini close:', err));
            }
        });

        this.geminiClient.on('error', (error) => {
            logger.error('[VoiceSession] Gemini connection error:', error);
            if (this.isActive) {
                this.sendToClient({ type: 'error', data: { message: error.message || 'Error en la conexión con el motor de voz de Gemini.' } });
                this.stop().catch(err => logger.error('[VoiceSession] Error in stop on Gemini error:', err));
            }
        });

        // Handle client disconnect
        this.clientWs.on('close', () => {
            logger.info(`[VoiceSession] Client disconnected: ${this.userId}`);
            this.stop().catch(err => logger.error('[VoiceSession] Error in stop on close:', err));
        });

        // Handle errors
        this.clientWs.on('error', (error) => {
            logger.error(`[VoiceSession] Client error:`, error);
        });
    }

    /**
     * Reconecta de forma transparente el cliente Gemini Live rotando al siguiente modelo y clave disponible.
     * Evita que la sesión de voz del usuario muera ante cierres temporales del servidor de Google (ej: Error 1011).
     */
    async reconnectGemini(triggerReason = '') {
        if (!this.isActive || !this.clientWs || this.clientWs.readyState !== WebSocket.OPEN) {
            return false;
        }

        if (!this.reconnectAttempts) this.reconnectAttempts = 0;
        if (this.reconnectAttempts >= 3) {
            logger.warn(`[VoiceSession] Límite de reconexiones (${this.reconnectAttempts}) alcanzado.`);
            return false;
        }

        this.reconnectAttempts++;
        logger.info(`[VoiceSession] Reconexión automática de emergencia ${this.reconnectAttempts}/3 tras cierre de Gemini (${triggerReason})...`);

        this.sendToClient({
            type: 'status',
            data: { status: 'reconnecting', message: 'Restableciendo conexión con el motor de voz...' }
        });

        // Limpiar cliente previo
        if (this.geminiClient) {
            try {
                this.geminiClient.removeAllListeners();
                this.geminiClient.disconnect();
            } catch (err) {
                logger.warn('[VoiceSession] Error al desconectar cliente previo de Gemini:', err.message);
            }
            this.geminiClient = null;
        }

        // Rotar al siguiente modelo disponible en la lista
        const currentModel = this.liveConfig.model;
        if (this.liveModelsToTry && this.liveModelsToTry.length > 1) {
            const currentIndex = this.liveModelsToTry.indexOf(currentModel);
            const nextIndex = (currentIndex + 1) % this.liveModelsToTry.length;
            this.liveConfig.model = this.liveModelsToTry[nextIndex];
            logger.info(`[VoiceSession] Rotando modelo Live para reconexión: de "${currentModel}" a "${this.liveConfig.model}"`);
        }

        // Probar claves API disponibles
        const voiceKeys = this.apiKeys && this.apiKeys.length > 1 ? [...this.apiKeys].reverse() : (this.apiKeys || []);
        let connected = false;

        for (let i = 0; i < voiceKeys.length; i++) {
            const key = voiceKeys[i];
            try {
                logger.info(`[VoiceSession] Intento de reconexión con Modelo "${this.liveConfig.model}" y Clave ${i + 1}/${voiceKeys.length}`);
                this.geminiClient = new GeminiLiveClient(key, this.liveConfig);
                await this.geminiClient.connect();
                connected = true;
                break;
            } catch (err) {
                logger.warn(`[VoiceSession] Falló reconexión con Clave ${i + 1}: ${err.message}`);
                if (this.geminiClient) {
                    try { this.geminiClient.disconnect(); } catch {}
                    this.geminiClient = null;
                }
            }
        }

        if (connected && this.geminiClient) {
            logger.info(`[VoiceSession] ✅ Reconexión exitosa a Gemini Live con Modelo "${this.liveConfig.model}"`);
            this.setupGeminiHandlers();
            this.sendToClient({ type: 'status', data: { status: 'listening' } });

            // Si había transcripción del usuario pendiente de respuesta, reenviarla
            const lastUserText = (this.lastUserTranscription || '').trim();
            if (lastUserText && lastUserText.length > 1 && !this.aiResponseText) {
                logger.info(`[VoiceSession] Reenviando última consulta del usuario a Gemini Live: "${lastUserText}"`);
                try {
                    this.geminiClient.sendText(lastUserText);
                } catch (e) {
                    logger.warn('[VoiceSession] Error reenviando texto tras reconexión:', e.message);
                }
            }

            return true;
        }

        logger.error(`[VoiceSession] Reconexión fallida tras intento ${this.reconnectAttempts}/3`);
        return false;
    }

    /**
     * Envía respuestas de herramientas a Gemini Live evitando rigurosamente llamadas duplicadas
     * con el mismo call_id, lo cual provoca cierres abruptos de conexión (Code 1000).
     */
    sendGeminiToolResponse(responses) {
        if (!this.geminiClient) return;
        if (!this.respondedToolCallIds) {
            this.respondedToolCallIds = new Set();
        }
        const filtered = (responses || []).filter(r => {
            if (!r || !r.id) return false;
            if (this.respondedToolCallIds.has(r.id)) {
                logger.warn(`[VoiceSession] Ignorando respuesta duplicada a Gemini Live para tool call ID ${r.id} (${r.name || 'desconocido'})`);
                return false;
            }
            this.respondedToolCallIds.add(r.id);
            return true;
        });
        if (filtered.length > 0) {
            try {
                this.geminiClient.sendToolResponse(filtered);
            } catch (err) {
                logger.error('[VoiceSession] Error en sendGeminiToolResponse:', err);
            }
        }
    }

    /**
     * Handle message from client
     */
    async handleClientMessage(message) {
        const { type, data } = message;

        switch (type) {
            case 'wappy_action_result':
                if (data && data.id && this.geminiClient) {
                    logger.info(`[VoiceSession] Received wappy_action_result from client for tool ${data.name} (id: ${data.id})`, data.result);
                    if (this.pendingToolCalls && this.pendingToolCalls.has(data.id)) {
                        const { timeoutId } = this.pendingToolCalls.get(data.id);
                        clearTimeout(timeoutId);
                        this.pendingToolCalls.delete(data.id);
                        this.sendGeminiToolResponse([
                            {
                                id: data.id,
                                name: data.name,
                                response: { result: data.result || "Acción ejecutada correctamente en la pantalla" }
                            }
                        ]);
                    }
                }
                break;

            case 'audio':
                // Do not process audio if session is stopped or geminiClient is not ready or setup not complete
                if (!this.isActive || !this.geminiClient || !this.geminiClient.setupCompleted) {
                    break;
                }
                // Do not forward client mic audio to Gemini while AI is speaking (prevents speaker echo)
                if (this.isAiSpeaking) {
                    break;
                }
                // Suprimir reenvío de audio del micrófono brevemente tras inyección de texto para permitir que Gemini Live sintetice la respuesta sin ser cancelado por ruido ambiental
                if (this.suppressClientAudioUntil && Date.now() < this.suppressClientAudioUntil) {
                    break;
                }
                // Forward audio to Gemini
                if (data && data.audioData) {
                    this.audioChunkCount = (this.audioChunkCount || 0) + 1;
                    if (this.audioChunkCount === 1 || this.audioChunkCount % 100 === 0) {
                        logger.info(`[VoiceSession] AUDIO recibido del cliente (chunk #${this.audioChunkCount}, ${data.audioData.length} chars)`);
                    }
                    this.geminiClient.sendAudio(data.audioData);
                }
                break;

            case 'speech_end':
                // El cliente detectó fin de voz (noise gate cerrado tras hablar). Sin esta señal,
                // Google no recibe silencio y retiene la respuesta 10-14s (ver Lección 12).
                if (!this.isActive || !this.geminiClient || !this.geminiClient.setupCompleted) {
                    break;
                }
                if (this.isAiSpeaking) {
                    break;
                }
                if (typeof this.geminiClient.sendAudioStreamEnd === 'function') {
                    this.geminiClient.sendAudioStreamEnd();
                }
                break;

            case 'video':
                // Forward video frame to Gemini
                if (data && data.image) {
                    logger.debug(`[VoiceSession] Received video frame (${data.image.length} chars, has telemetry: ${!!data.telemetry})`);
                    this.latestFrame = data.image; // Guarda el último frame capturado para el análisis
                    if (data.telemetry) {
                        this.latestTelemetry = data.telemetry;
                    }
                    
                    // Keep a rolling buffer of up to 4 sampled frames for the report generator
                    if (!this.frameBuffer) this.frameBuffer = [];
                    this.frameCount = (this.frameCount || 0) + 1;
                    if (this.frameCount % 2 === 0) { // Sample every 2nd frame received (roughly 1 frame per 2 seconds)
                        this.frameBuffer.push(data.image);
                        if (this.frameBuffer.length > 4) {
                            this.frameBuffer.shift();
                        }
                    }

                    if (this.geminiClient) {
                        this.geminiClient.sendVideo(data.image);
                    } else {
                        logger.warn('[VoiceSession] Received video but Gemini client is not ready');
                    }
                }
                break;

            case 'evidence-image':
                if (data && (data.image || data.text)) {
                    logger.info(`[VoiceSession] Received evidence payload (has image: ${!!data.image}, has text: ${!!data.text}, has metadata: ${!!data.metadata})`);
                    
                    if (data.image) {
                        this.latestFrame = data.image;
                        if (!this.manualEvidences) {
                            this.manualEvidences = [];
                        }
                        this.manualEvidences.push(data.image);
                        if (this.manualEvidences.length > 10) {
                            this.manualEvidences.shift();
                        }
                    }

                    // Save structured multi-phase evidence with MediaPipe telemetry
                    if (!this.phaseEvidences) {
                        this.phaseEvidences = {};
                    }

                    const phaseIdx = (data.metadata && data.metadata.phaseIndex !== undefined)
                        ? Number(data.metadata.phaseIndex)
                        : (data.phaseIndex !== undefined ? Number(data.phaseIndex) : null);

                    if (phaseIdx !== null && data.image) {
                        this.phaseEvidences[phaseIdx] = {
                            image: data.image,
                            phaseIndex: phaseIdx,
                            phaseName: data.metadata?.phaseName || data.phaseName || `Fase ${phaseIdx + 1}`,
                            telemetry: data.metadata?.telemetry || data.telemetry || null,
                            text: data.text || ''
                        };
                        logger.info(`[VoiceSession] Stored evidence photo for phase ${phaseIdx} (${this.phaseEvidences[phaseIdx].phaseName})`);
                    } else if (data.image) {
                        const existingCount = Object.keys(this.phaseEvidences).length;
                        const assignedIdx = existingCount < 3 ? existingCount : 0;
                        if (!this.phaseEvidences[assignedIdx]) {
                            this.phaseEvidences[assignedIdx] = {
                                image: data.image,
                                phaseIndex: assignedIdx,
                                phaseName: `Fase ${assignedIdx + 1}`,
                                telemetry: data.metadata?.telemetry || null,
                                text: data.text || ''
                            };
                        }
                    }

                    const phaseName = data.metadata?.phaseName || (phaseIdx !== null ? `Fase ${phaseIdx + 1}` : 'Evidencia Fotográfica');
                    const telemetry = data.metadata?.telemetry;
                    let textLines = [`📸 **Evidencia Biomecánica • ${phaseName}**`];

                    if (telemetry) {
                        const parts = [];
                        if (telemetry.neck !== null && telemetry.neck !== undefined) parts.push(`• Flexión Cervical: **${telemetry.neck}°**`);
                        if (telemetry.trunk !== null && telemetry.trunk !== undefined) parts.push(`• Flexión de Tronco: **${telemetry.trunk}°**`);
                        if (telemetry.arm !== null && telemetry.arm !== undefined) parts.push(`• Abducción de Brazo: **${telemetry.arm}°**`);
                        if (telemetry.elbow !== null && telemetry.elbow !== undefined) parts.push(`• Flexión de Codo: **${telemetry.elbow}°**`);
                        if (telemetry.knee !== null && telemetry.knee !== undefined) parts.push(`• Flexión de Rodilla: **${telemetry.knee}°**`);

                        if (parts.length > 0) {
                            textLines.push(`\n📐 **Telemetría Articular MediaPipe:**\n${parts.join('\n')}`);
                        } else if (telemetry.summary) {
                            textLines.push(`\n📐 **Telemetría Articular MediaPipe:**\n${telemetry.summary}`);
                        }
                    } else if (data.text) {
                        textLines.push(`\n${data.text}`);
                    }

                    const messageText = textLines.join('\n');
                    const imageUrl = data.image ? (data.image.startsWith('data:') ? data.image : `data:image/jpeg;base64,${data.image}`) : null;

                    let messageContent = [
                        { type: 'text', text: messageText }
                    ];
                    if (imageUrl) {
                        messageContent.push({
                            type: 'image_url',
                            image_url: { url: imageUrl }
                        });
                    }

                    try {
                        let conversationId = this.conversationId;
                        let isNewConvo = false;
                        if (!conversationId || conversationId === 'new') {
                            conversationId = uuidv4();
                            this.conversationId = conversationId;
                            isNewConvo = true;
                        }

                        const messageId = uuidv4();
                        const messageData = {
                            messageId,
                            conversationId,
                            parentMessageId: this.lastMessageId,
                            text: messageText,
                            content: messageContent,
                            user: this.userId,
                            sender: 'User',
                            isCreatedByUser: true,
                            endpoint: this.dbEndpoint,
                            model: this.dbModel,
                        };

                        const savedMessage = await saveMessage({ user: { id: this.userId } }, messageData, { context: 'VoiceSession - Evidence Save' });
                        if (savedMessage) {
                            this.lastMessageId = messageId;
                            logger.info(`[VoiceSession] Saved new evidence photo message: ${messageId} for phase: ${phaseName}`);
                        }

                        // Send to Gemini Live silently if it's a telemetry alert
                        const isTelemetry = !!data.text && !data.metadata?.phaseName;
                        if (isTelemetry && this.geminiClient) {
                            this.geminiClient.sendImageWithText(data.image || null, data.text, false);
                        }

                        // If it's a phase evidence captured by the user, notify Gemini Live so the AI verbally acknowledges it!
                        if (data.metadata?.phaseName && this.geminiClient && this.isActive && !this.reportGenerated && !this.isGeneratingReport) {
                            const summary = data.metadata?.telemetry?.summary || '';
                            const phaseNum = (data.metadata.phaseIndex ?? 0) + 1;
                            const isLastPhase = phaseNum >= 3;
                            const instructionPrompt = isLastPhase
                                ? `[INSTRUCCIÓN DE SISTEMA]: El usuario acaba de registrar la evidencia fotográfica de la Fase 3 (${data.metadata.phaseName}). Telemetría: ${summary}. Las 3 fases han sido completadas con éxito. Valida en voz alta en 1 sola frase corta lo observado y pregúntale cordialmente si desea que compiles su informe técnico ergonómico oficial ahora mismo.`
                                : `[INSTRUCCIÓN DE SISTEMA]: El usuario acaba de registrar la evidencia fotográfica de la Fase ${phaseNum} (${data.metadata.phaseName}). Telemetría: ${summary}. Valida en voz alta en 1 sola frase corta lo observado, dile qué postura adoptar para la Fase ${phaseNum + 1}, y recuérdale que te avise diciendo "Listo", "Ya" o pulsando el botón de la cámara cuando esté en posición. NO avances ni captures por tu cuenta antes de que el usuario lo indique.`;
                            try {
                                this.geminiClient.sendText(instructionPrompt);
                            } catch (notifyErr) {
                                logger.warn('[VoiceSession] Error notifying Gemini Live of phase capture:', notifyErr.message);
                            }
                        }

                        // Notify client of conversationId if it was new
                        if (isNewConvo) {
                            this.sendToClient({
                                type: 'conversationId',
                                data: { conversationId: this.conversationId }
                            });
                        }

                        // Always notify client so the photo appears immediately in chat!
                        this.sendToClient({
                            type: 'conversationUpdated',
                            data: { conversationId: this.conversationId }
                        });

                    } catch (saveError) {
                        logger.error('[VoiceSession] Error processing evidence image in chat DB:', saveError);
                    }
                }
                break;

            case 'trigger_report':
            case 'generate_report':
                logger.info('[VoiceSession] Manual report generation requested by client via WS.');
                if (this.isGeneratingReport) {
                    logger.info('[VoiceSession] Report generation already in progress. Skipping duplicate request.');
                    break;
                }

                let manualFrames = [];
                if (this.manualEvidences && this.manualEvidences.length > 0) {
                    manualFrames = [...this.manualEvidences];
                } else if (this.frameBuffer && this.frameBuffer.length > 0) {
                    manualFrames = [...this.frameBuffer];
                } else if (this.latestFrame) {
                    manualFrames = [this.latestFrame];
                }

                this.sendToClient({
                    type: 'status',
                    data: { status: 'generating_report', message: 'Compilando informe técnico...' }
                });

                if (this.geminiClient && this.isActive) {
                    try {
                        this.geminiClient.sendText('INSTRUCCIÓN DE SISTEMA: El usuario presionó el botón de generar informe técnico. Confírmale verbalmente en 1 sola frase breve: "Entendido, estoy compilando tu informe técnico ergonómico con las evidencias recopiladas."');
                    } catch (speakErr) {
                        logger.warn('[VoiceSession] Error sending spoken confirmation for manual report trigger:', speakErr.message);
                    }
                }

                this.isGeneratingReport = true;
                this.generateReport(this.config.conversationContext).finally(() => {
                    this.isGeneratingReport = false;
                });
                break;

            case 'config':
                // Update session configuration
                if (data.voice) {
                    logger.info(`[VoiceSession] Config update received. New voice: ${data.voice}`);
                    this.config.voice = data.voice;
                    // Reconnect with new voice
                    await this.reconnect();
                    logger.info(`[VoiceSession] Reconnected with voice: ${this.config.voice}`);
                }
                break;

            case 'message':
                if (data && data.text) {
                    logger.info(`[VoiceSession] Received text message from client: "${data.text.substring(0, 100)}..."`);
                    // Solo registrar como transcripción del usuario si no es un prompt interno del sistema
                    const isInternalSystemMessage = /^\[SISTEMA INTERNO WAPPY/i.test(data.text);
                    if (!isInternalSystemMessage) {
                        this.userTranscriptionText += (this.userTranscriptionText ? '\n' : '') + data.text;
                    }
                    
                    if (this.geminiClient) {
                        // Suprimir reenvío de audio del micrófono durante 3 segundos para que Gemini Live
                        // procese y sintetice el turno de texto sin ser interrumpido/descartado por el VAD ante ruido ambiental
                        this.suppressClientAudioUntil = Date.now() + 3000;
                        this.geminiClient.sendText(data.text);
                    } else {
                        logger.warn('[VoiceSession] Received text message but Gemini client is not ready');
                    }
                }
                break;

            case 'interrupt':
                // User interrupted, stop current Gemini response
                logger.info('[VoiceSession] Manual interrupt command received from client');
                this.isAiSpeaking = false;
                this.suppressClientAudioUntil = null;
                if (this.geminiClient) {
                    this.geminiClient.interrupt();
                }
                this.sendToClient({ type: 'status', data: { status: 'interrupted' } });
                this.sendToClient({ type: 'interrupted', data: {} });
                this.aiResponseText = '';
                this.aiTranscriptionBuffer = '';
                this.aiAudioChunkCount = 0;
                break;

            case 'screen_context':
                if (data) {
                    if (data.conversationId && data.conversationId !== 'new') {
                        this.conversationId = data.conversationId;
                    }
                    if (data.agentId || data.agentName) {
                        this.activeScreenAgent = {
                            id: data.agentId,
                            name: data.agentName
                        };
                    }
                    if (data.route) {
                        this.activeScreenRoute = data.route;
                    }
                    const humanDesc = formatScreenRouteHuman(this.activeScreenRoute, this.activeScreenAgent);
                    logger.info(`[VoiceSession] Updated screen context: conversationId=${this.conversationId}, activeScreenAgent=${JSON.stringify(this.activeScreenAgent)}, route=${this.activeScreenRoute} (${humanDesc})`);
                }
                break;

            default:
                logger.warn(`[VoiceSession] Unknown message type: ${type}`);
        }
    }

    /**
     * Handle message from Gemini
     */
    handleGeminiMessage(message) {
        // This method is now largely deprecated as event listeners handle most of the logic.
        // It remains for backward compatibility or specific cases not covered by new events.
        try {
            // Check for User Transcription (often in a different part of the response object)
            // Based on API behavior, we need to inspect where input transcription lands.
            // For now, we log everything to find it.
            if (message.serverContent && !message.serverContent.modelTurn) {
                logger.debug('[VoiceSession] Non-modelTurn content:', JSON.stringify(message.serverContent));
            }
        } catch (error) {
            logger.error('[VoiceSession] Error handling Gemini message:', error);
        }
    }

    /**
     * Send message to client
     */
    sendToClient(message) {
        if (this.clientWs && this.clientWs.readyState === WebSocket.OPEN) {
            this.clientWs.send(JSON.stringify(message));
        }
    }

    /**
     * Reconnect with new configuration
     */
    async reconnect() {
        if (this.geminiClient) {
            this.geminiClient.disconnect();
        }
        await this.start();
    }

    /**
     * Refine transcription using Gemini Flash Lite
     */
    async refineTranscription(text) {
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite-preview-02-05:generateContent?key=${this.apiKey}`;

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `Please format the following transcription to be more readable, correcting punctuation and capitalization, but keeping the original meaning and words as much as possible. Do not add any conversational filler. Text: "${text}"`
                        }]
                    }]
                })
            });

            const keyName = (this.config?.mode === 'tenshi_voice' || this.agentObj?.id === 'tenshi') ? 'tenshi_google' : EModelEndpoint.google;
            let apiKey = null;
            try {
                apiKey = await getUserKey({ userId: this.userId, name: keyName });
            } catch (e) {
                try {
                    apiKey = await getUserKey({ userId: this.userId, name: EModelEndpoint.google });
                } catch (e2) {}
            }
            logger.debug(`[VoiceSession] Retrieved API Key for refinement (${keyName}): ${apiKey ? 'Success' : 'Failed'}`);

            if (!apiKey) {
                // Handle case where API key is not found, e.g., by sending original text
                this.sendToClient({
                    type: 'text',
                    data: {
                        text: text,
                        isRefined: false
                    }
                });
                return; // Exit early if no API key
            }

            const data = await response.json();

            if (data.candidates && data.candidates[0] && data.candidates[0].content) {
                const refinedText = data.candidates[0].content.parts[0].text;

                this.sendToClient({
                    type: 'text',
                    data: {
                        text: refinedText,
                        isRefined: true
                    }
                });

                logger.debug('[VoiceSession] Transcription refined:', refinedText);

                // Save message to database if conversationId is present (and not tenshi_voice)
                if (this.conversationId && this.config.mode !== 'tenshi_voice') {
                    try {
                        let conversationId = this.conversationId;
                        let isNewConversation = false;

                        // Generate real UUID if conversationId is 'new'
                        if (conversationId === 'new') {
                            conversationId = uuidv4();
                            isNewConversation = true;
                            logger.info(`[VoiceSession] Generated new conversationId: ${conversationId}`);
                        }

                        const messageId = uuidv4();
                        const messageData = {
                            messageId,
                            conversationId,
                            text: refinedText,
                            content: [{ type: 'text', text: refinedText }],
                            user: this.userId,
                            sender: 'User',
                            isCreatedByUser: true,
                            endpoint: this.dbEndpoint, // Ensure endpoint is set
                            model: this.dbModel,
                        };

                        const savedMessage = await saveMessage({ user: { id: this.userId } }, messageData, { context: 'VoiceSession' });

                        if (savedMessage) {
                            // Also save/update the conversation
                            await saveConvo({ user: { id: this.userId } }, {
                                ...savedMessage,
                                ...(this.config.mode === 'live_analysis' ? { tags: ['sgsst-live-analysis'] } : {})
                            }, { context: 'VoiceSession' });

                            logger.info(`[VoiceSession] Saved user message: ${messageId}`);

                            // Update local conversationId and notify client if it was new
                            if (isNewConversation) {
                                this.conversationId = conversationId;
                                this.sendToClient({
                                    type: 'conversationId',
                                    data: { conversationId: this.conversationId }
                                });
                            }
                        } else {
                            logger.error('[VoiceSession] saveMessage returned null/undefined');
                        }
                    } catch (saveError) {
                        logger.error('[VoiceSession] Error saving message:', saveError);
                    }
                }
            }
        } catch (error) {
            logger.error('[VoiceSession] Error refining transcription:', error);
            // Fallback to original text if refinement fails
            this.sendToClient({
                type: 'text',
                data: {
                    text: text,
                    isRefined: false
                }
            });
        }
    }

    /**
     * Save User Message to database
     */
    async saveUserMessage(text) {
        if (!text || this.config.mode === 'tenshi_voice') return null;

        try {
            let conversationId = this.conversationId;
            let isNewConversation = false;

            // If conversation doesn't exist, create a new one
            if (!conversationId || conversationId === 'new') {
                conversationId = uuidv4();
                this.conversationId = conversationId;
                isNewConversation = true;
                logger.info(`[VoiceSession] Generated new conversationId for user message: ${conversationId}`);
            }

            const messageId = uuidv4();

            // Check if user is asking the AI to look at something
            const observationRegex = /(mira|observa|qué ves|analiza|pantalla|imagen|foto|qué hay|describe|veas|vea)/i;
            const isAskingToLook = observationRegex.test(text);
            logger.info(`[VoiceSession] Processing user message: "${text}". isAskingToLook: ${isAskingToLook}, latestFrame: ${!!this.latestFrame}`);

            let messageContent = [{ type: 'text', text: text }];

            // If the user is asking to look at something, and we have a recent frame from the camera/screen
            if (isAskingToLook && this.latestFrame) {
                logger.info('[VoiceSession] User requested visual analysis, attaching latest frame to message.');
                messageContent.push({
                    type: 'image_url',
                    image_url: {
                        url: `data:image/jpeg;base64,${this.latestFrame}`
                    }
                });
                // We consume the frame so it isn't accidentally reused in unrelated future messages
                this.latestFrame = null;
            }

            const messageData = {
                messageId,
                conversationId,
                parentMessageId: this.lastMessageId, // Link to previous message in conversation
                text: text,
                content: messageContent,
                user: this.userId,
                sender: 'User',
                isCreatedByUser: true,
                endpoint: this.dbEndpoint,
                model: this.dbModel,
            };

            const savedMessage = await saveMessage({ user: { id: this.userId } }, messageData, { context: 'VoiceSession - User' });

            if (savedMessage) {
                this.lastMessageId = messageId; // Update for next message
                logger.info(`[VoiceSession] Saved user message: ${messageId}`);
                return { isNewConversation, messageId };
            }
            return null;
        } catch (error) {
            logger.error('[VoiceSession] Error saving user message:', error);
            return null;
        }
    }

    /**
     * Save AI Message to database
     */
    async saveAiMessage(text) {
        if (!this.conversationId || !text || this.config.mode === 'tenshi_voice') return;

        try {
            const messageId = uuidv4();
            const messageData = {
                messageId,
                conversationId: this.conversationId,
                parentMessageId: this.lastMessageId, // Link to user message
                text: text,
                content: [{ type: 'text', text: text }],
                user: this.userId,
                sender: this.agentObj?.name || (this.isBiomechanics ? 'Fisioterapeuta Laboral' : 'Assistant'),
                iconURL: this.agentObj?.avatar?.filepath || this.agentObj?.avatar?.url || undefined,
                isCreatedByUser: false,
                endpoint: this.dbEndpoint,
                model: this.dbModel,
            };

            const savedMessage = await saveMessage({ user: { id: this.userId } }, messageData, { context: 'VoiceSession - AI' });

            if (savedMessage) {
                this.lastMessageId = messageId; // Update for next message
                logger.info(`[VoiceSession] Saved AI message: ${messageId}`);
            }
        } catch (error) {
            logger.error('[VoiceSession] Error saving AI message:', error);
        }
    }

    /**
     * Stop the session
     */
    /**
     * Correct user transcription using Gemini Flash Lite with instant fast-path for common phrases
     */
    async correctTranscription(userText, aiResponseText) {
        try {
            if (!userText || typeof userText !== 'string') {
                return userText;
            }

            // 1. Pre-sanitizer for common voice recognition inaccuracies
            const sanitized = sanitizeTranscription(userText).trim();

            // 2. Fast-path for common Spanish responses (zero latency, no API call required)
            const lower = sanitized.toLowerCase().replace(/[.,!¡?¿]/g, '').trim();
            const quickPhrases = {
                'listo': 'Listo.',
                'si': 'Sí.',
                'sí': 'Sí.',
                'vale': 'Vale.',
                'de una': 'De una.',
                'dale': 'Dale.',
                'ya': 'Ya.',
                'ok': 'OK.',
                'okay': 'OK.',
                'no': 'No.',
                'correcto': 'Correcto.',
                'entendido': 'Entendido.',
                'haz el informe': 'Haz el informe.',
                'genera el informe': 'Genera el informe.',
                'generar el informe': 'Generar el informe.',
                'listo genera el informe': 'Listo, genera el informe.',
                'si genera el informe': 'Sí, genera el informe.',
                'si haz el informe': 'Sí, haz el informe.',
            };

            if (quickPhrases[lower]) {
                logger.info(`[VoiceSession] Transcription fast-path matched: "${userText}" -> "${quickPhrases[lower]}"`);
                return quickPhrases[lower];
            }

            if (sanitized.length <= 3) {
                return sanitized;
            }

            logger.info(`[VoiceSession] Starting transcription correction for: "${sanitized}"`);

            // Use Gemini 3.5 Flash Lite for high performance voice transcription corrections
            const correctionModelName = 'gemini-3.5-flash-lite';

            const prompt = `
            Eres un corrector ortográfico y gramatical experto en español de Colombia/Latinoamérica, especializado en Seguridad y Salud en el Trabajo (SST/HSE).
            Tu tarea es corregir y pulir los errores fonéticos o de puntuación de la transcripción de voz para hacerla fluida, correcta y en perfecto español.

            ÚLTIMA INTERVENCIÓN DE LA IA:
            """
            ${(aiResponseText || '').substring(0, 250)}
            """

            TRANSCRIPCIÓN DE VOZ DEL USUARIO A CORREGIR:
            """
            ${sanitized}
            """

            REGLAS DE ORO:
            1. MANTÉN ESTRICTAMENTE EL TEXTO EN ESPAÑOL. Está absolutamente prohibido traducir cualquier palabra al inglés o a cualquier otro idioma. El usuario habla español.
            2. Si la transcripción dice palabras como "bistro", "visto" o "cristo" en tono de asentimiento, corrígelas a "Listo".
            3. Si el usuario pide el informe con palabras parecidas (ej: "general el informe"), corrígelo a "Generar el informe".
            4. Reconoce y respeta siglas y términos de SST como: "SST", "EPP", "RULA", "REBA", "OWAS", "GTC 45", "ISO 45001", "Decreto 1072", "postura", "ergonomía".
            5. Si el texto original está en español correcto, devuélvelo tal cual sin inventar nada.
            6. DEVUELVE ÚNICA Y EXCLUSIVAMENTE EL TEXTO CORREGIDO EN ESPAÑOL. Sin explicaciones, comillas ni notas.
            `;

            try {
                const timeoutPromise = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Transcription correction timeout')), 1200)
                );
                const correctionPromise = generateWithKeyRotation(correctionModelName, this.userId, prompt, { fastFallback: true });
                const result = await Promise.race([correctionPromise, timeoutPromise]);
                const correctedText = result.response.text().replace(/^["']|["']$/g, '').trim();

                logger.info(`[VoiceSession] Transcription correction result: "${userText}" -> "${correctedText}"`);
                return correctedText;
            } catch (err) {
                logger.debug(`[VoiceSession] Transcription fast fallback to sanitized (${err.message})`);
                return sanitized;
            }
        } catch (error) {
            logger.error('[VoiceSession] Error correcting transcription:', error);
            return sanitizeTranscription(userText); // Fallback to sanitized
        }
    }

    /**
     * Ejecuta la creación de archivos Canvas (Word, Excel, HTML, Presentación)
     * asegurando sincronización con pantalla y entrega en chat de Tenshi.
     */
    async executeCanvasTool(canvasArgs = {}, userRequestText = '', actionId = null) {
        const allowedTypes = ['text', 'excel', 'html', 'presentation'];
        const args = { ...canvasArgs };
        args.accion = 'crear';
        if (!allowedTypes.includes(args.fileType)) args.fileType = 'html';
        if (!args.title || !String(args.title).trim()) args.title = 'Documento SG-SST';

        const fileTypeLabel = { text: 'Word', excel: 'Excel', html: 'HTML', presentation: 'presentación' }[args.fileType];
        const uniqueCanvasId = `tenshi-canvas-${this.userId}-${Date.now()}`;
        const userPrompt = userRequestText || args.content || args.title;
        const toolReq = {
            user: { id: this.userId, _id: this.userId },
            isVoiceSession: true,
            body: {
                conversationId: uniqueCanvasId,
                text: userPrompt,
                userRequestText: userPrompt,
                isVoiceSession: true,
                screenContext: this.activeScreenRoute || '',
                agentContext: this.lastSpecialistResponse || this.activeScreenAgent?.name || '',
            }
        };

        let ok = false;
        let failReason = '';
        let generatedContent = '';
        let finalTitle = args.title;

        // Para documentos de texto ('text'), si no hay contenido explícito o es breve, usar userPrompt para enriquecimiento pesado
        if (args.fileType === 'text' && (!args.content || !String(args.content).trim())) {
            args.content = userPrompt || args.title || 'Informe Técnico SG-SST';
        }

        // Validación previa de JSON para Excel / Presentación
        if ((args.fileType === 'excel' || args.fileType === 'presentation') && typeof args.content === 'string') {
            try {
                JSON.parse(args.content);
            } catch (jsonErr) {
                failReason = `El contenido para ${fileTypeLabel} no es un JSON válido (${jsonErr.message}). Para Excel debe ser un arreglo 2D, ej: [["Columna1","Columna2"],["valor","valor"]].`;
            }
        }
        if (!failReason && !args.content && args.fileType !== 'html') {
            failReason = 'No se envió contenido para el archivo.';
        }

        if (!failReason) {
            this.sendToClient({
                type: 'status',
                data: { status: 'loading', message: `Creando archivo ${fileTypeLabel}...` }
            });
            try {
                const CanvasTool = require('~/app/clients/tools/structured/CanvasTool');
                const canvasTool = new CanvasTool({ req: toolReq });
                const canvasOutput = await canvasTool._call(args);
                let parsedOutput = null;
                try {
                    parsedOutput = typeof canvasOutput === 'string' ? JSON.parse(canvasOutput) : canvasOutput;
                } catch (_) {
                    parsedOutput = null;
                }
                if (parsedOutput?.success === true) {
                    const CanvasSession = require('~/models/CanvasSession');
                    const sessionDoc = await CanvasSession.findOne({ user: this.userId, conversationId: uniqueCanvasId }).lean();
                    if (sessionDoc?.content) {
                        generatedContent = typeof sessionDoc.content === 'string' ? sessionDoc.content : JSON.stringify(sessionDoc.content);
                        finalTitle = sessionDoc.title || finalTitle;
                        ok = true;

                        // Sincronizar en tiempo real con el conversationId activo de pantalla si existe y no es temporal
                        if (this.conversationId && this.conversationId !== 'new' && !this.conversationId.startsWith('tenshi-')) {
                            try {
                                await CanvasSession.findOneAndUpdate(
                                    { user: this.userId, conversationId: this.conversationId },
                                    {
                                        $set: {
                                            content: sessionDoc.content,
                                            title: finalTitle,
                                            fileType: args.fileType,
                                            updatedAt: new Date(),
                                        }
                                    },
                                    { upsert: true, new: true }
                                );
                                logger.info(`[VoiceSession] Synced canvas document with screen conversationId: ${this.conversationId}`);
                            } catch (syncErr) {
                                logger.warn(`[VoiceSession] Could not sync canvas to screen conversationId:`, syncErr);
                            }
                        }
                    } else {
                        failReason = 'El archivo se procesó pero quedó vacío.';
                    }
                } else {
                    failReason = parsedOutput?.error || 'La herramienta de archivos no confirmó la creación.';
                }
            } catch (cErr) {
                logger.error('[VoiceSession] Error in backend CanvasTool execution:', cErr);
                failReason = cErr?.message || 'Error interno al crear el archivo.';
            }
        }

        if (ok) {
            // Guardar en el historial de mensajes de Tenshi antes de notificar al cliente
            if (this.userId) {
                try {
                    const TenshiMessage = require('~/models/TenshiMessage');
                    const fileTypeLabels = {
                        text: 'Documento Word',
                        excel: 'Hoja de Cálculo Excel',
                        html: 'Aplicativo / Reporte HTML',
                        presentation: 'Presentación de Diapositivas',
                    };
                    const label = fileTypeLabels[args.fileType] || 'Archivo SG-SST';
                    await TenshiMessage.create({
                        user: this.userId,
                        role: 'assistant',
                        content: `📁 **${label} generado**: *${finalTitle}*`,
                        file: {
                            title: finalTitle,
                            fileType: args.fileType,
                            content: generatedContent,
                            canvasId: uniqueCanvasId,
                        },
                        htmlReport: args.fileType === 'html' ? generatedContent : undefined,
                    });
                    logger.info(`[VoiceSession] Persisted canvas file message "${finalTitle}" to TenshiMessage for user ${this.userId}`);
                } catch (persistErr) {
                    logger.error('[VoiceSession] Error persisting canvas file to TenshiMessage:', persistErr);
                }
            }

            this.sendToClient({
                type: 'wappy_action',
                data: {
                    id: actionId || `canvas-${Date.now()}`,
                    name: 'canvas_tool',
                    args: {
                        ...args,
                        title: finalTitle,
                        content: generatedContent
                    },
                    content: generatedContent,
                    fileType: args.fileType,
                    title: finalTitle,
                    canvasId: uniqueCanvasId
                }
            });
            this.sendToClient({
                type: 'status',
                data: { status: 'idle', message: '' }
            });
        } else {
            logger.warn(`[VoiceSession] canvas_tool failed: ${failReason}`);
            this.sendToClient({
                type: 'status',
                data: { status: 'idle', message: '' }
            });
        }

        return {
            ok,
            failReason,
            finalTitle,
            fileTypeLabel,
            generatedContent,
            canvasId: uniqueCanvasId
        };
    }

    /**
     * Generate Formal Report using Gemini Flash
     */
    async generateReport(conversationContext) {
        try {
            logger.info('[VoiceSession] Generating formal report...');

            // FETCH CONTEXT FROM DB (Source of Truth)
            // Instead of relying on passed context, we fetch the last 20 messages
            let dbContext = '';
            if (this.conversationId && this.conversationId !== 'new') {
                try {
                    const messages = await getMessages({
                        conversationId: this.conversationId,
                        user: this.userId
                    }, null, { limit: 20, sort: { createdAt: -1 } });

                    if (messages && messages.length > 0) {
                        // Messages come in reverse order (newest first), so reverse them back
                        dbContext = messages.reverse().map(m => {
                            const role = m.isCreatedByUser ? 'User' : 'AI';
                            return `${role}: ${m.text}`;
                        }).join('\n');
                        logger.info(`[VoiceSession] Fetched ${messages.length} messages from DB for context.`);
                    }
                } catch (dbError) {
                    logger.error('[VoiceSession] Error fetching messages for context:', dbError);
                }
            }

            // Fallback to passed context if DB fetch failed or empty
            const finalContext = dbContext || conversationContext;

            logger.info(`[VoiceSession] Final Context length: ${finalContext ? finalContext.length : 0}`);

            if (!finalContext || finalContext.length < 10) {
                logger.warn('[VoiceSession] Context too short, skipping report generation');
                this.sendToClient({
                    type: 'report',
                    data: { html: '<p>No hay suficiente contexto para generar un informe. Por favor, continúe la conversación.</p>' }
                });
                return null;
            }

            // Notify client that generation started
            this.sendToClient({
                type: 'status',
                data: { status: 'generating_report', message: 'Generando informe técnico...' }
            });

            // Use Gemini 3.7 Flash as the primary model for reports (with fallback scale down to 3.6, 3.5, 3.5-lite)
            const reportModelName = SGSST_FALLBACK_MODELS[0];
            logger.info(`[VoiceSession] Report model (with key+model rotation): ${reportModelName}`);

            const currentDate = new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

            // Determine active inspection protocol and comparative matrix instructions
            const activeProtocol = this.agentProtocol || resolveInspectionProtocol(this.agentObj?.name || this.config?.template);
            let templateInstructions = "";

            if (activeProtocol.id === 'biomecanico') {
                templateInstructions = `ENFOQUE DE AUDITORÍA: Análisis Biomecánico Cuantitativo y Ergonómico Multifase en tiempo real aplicando la selección técnica de métodos ergonómicos (Criterios Prevencionar: RULA, REBA u OWAS).
Durante la sesión se ha registrado telemetría de ángulos articulares (Flexión Cervical, Inclinación de Tronco, Abducción de Brazos, Codos y Rodillas) y se estructuró la evaluación a través de un PROTOCOLO MULTIFASE en el ciclo de trabajo:
- Perspectiva de Captura: Documenta si el análisis se ejecutó como "Auto-evaluación (Portátil/Webcam)" o como "Inspección Asistida por Tercero (Smartphone)".
- Método RULA: Para labores de oficina / sedente frente a pantalla o ensamblaje fino donde el riesgo principal recae en miembros superiores y cuello.
- Método REBA: Para labores de pie, posturas forzadas de cuerpo entero, flexión de rodillas, manipulación de carga o posturas dinámicas/inestables.
- Método OWAS: Para tareas dinámicas de alta variabilidad postural en ciclos cambiantes (mantenimiento, construcción, aseo).
- Ecuación NIOSH / Res. 2400: Cuando existió levantamiento manual repetido de cargas (>3 kg).

REQUERIMIENTO ADICIONAL OBLIGATORIO:
1. Debes incluir OBLIGATORIAMENTE la sección especial comparativa multifase inmediatamente después de la tabla de Matriz de Riesgos (antes de la sección 5):
${activeProtocol.reportMatrixHeader}
2. Analiza las imágenes de evidencia capturadas citando explícitamente a qué fase corresponden y contrastando la evolución de la postura desde la fase habitual hasta la postura crítica y la fatiga.`;
            } else {
                templateInstructions = `ENFOQUE DE AUDITORÍA: ${activeProtocol.title} aplicando ${activeProtocol.methodLabel} (${activeProtocol.normRef}).
La inspección en vivo se estructuró y documentó a través de un PROTOCOLO MULTIFASE sistemático:
- Fases evaluadas: ${activeProtocol.phases.join(', ')}.
- Perspectiva de Captura: Documenta si la verificación se ejecutó como auto-inspección autónoma o como inspección asistida con dispositivo móvil.

REQUERIMIENTO ADICIONAL OBLIGATORIO:
1. Debes incluir OBLIGATORIAMENTE la sección comparativa multifase inmediatamente después de la tabla de Matriz de Riesgos (antes de la sección 5):
${activeProtocol.reportMatrixHeader}
2. Analiza las imágenes de evidencia fotográfica capturadas citando explícitamente a qué fase corresponden y contrastando los hallazgos técnicos entre cada etapa de la inspección.`;
            }

            const prompt = `
            INSTRUCCIÓN DE SISTEMA:
            Eres "Wappy-Audit", Consultor Senior HSE con certificación en ISO 45001 y GTC 45. Tu especialidad es producir Informes Técnicos de Evaluación de Riesgos de MÁXIMA CALIDAD PROFESIONAL.

            ${templateInstructions}

            CONTEXTO DE LA INSPECCIÓN:
            La siguiente es la conversación entre el Usuario y el Asistente de IA durante una inspección de seguridad en tiempo real con análisis de video.
            ${finalContext}

            TAREA:
            Genera un INFORME TÉCNICO EXTENSO Y DETALLADO de Evaluación de Riesgos basado en toda la conversación anterior.
            Sé EXHAUSTIVO. Cada sección debe tener al menos 2 párrafos de análisis profundo.

            REQUERIMIENTOS CRÍTICOS:
            1. **IDIOMA:** OBLIGATORIAMENTE EN ESPAÑOL TÉCNICO Y FORMAL.
            2. **FECHA:** Usa esta fecha: ${currentDate}.
            3. **FORMATO:** Solo HTML limpio. CERO bloques de código markdown (\`\`\`html). 
            4. **VERACIDAD VISUAL Y CONTEXTUAL:** Analiza PROFUNDAMENTE las imágenes fotográficas incluidas en este prompt y lee la conversación transcrita. El informe debe basarse en lo que VES en las imágenes y escuchas en la conversación. NO asumas que es una bodega de carga o planta industrial si las imágenes revelan una oficina o un entorno doméstico. Adapta tu análisis a la evidencia real proporcionada.
            5. **EXTENSIÓN Y PRECISIÓN:** El informe debe ser riguroso, formal y técnico, de extensión óptima (aproximadamente 1.000 a 1.500 palabras en español). Desarrolla cada sección con terminología técnica experta, matrices concisas y recomendaciones accionables sin redundancias ni demora.
            6. **MATRIZ DE RIESGOS:** Mantén OBLIGATORIAMENTE un mínimo de 5 peligros. Deduce 5 riesgos especializados basados directamente en LAS IMÁGENES adjuntas y el tema de la conversación. JAMÁS inventes peligros genéricos si no encajan con la evidencia fotográfica enviada.
               - OBLIGATORIAMENTE DEBES INCLUIR en la matriz y en las medidas de control:
                 1. **Riesgo Biomecánico / Ergonómico:** Analizando la postura del trabajador, silla, escritorio o movimientos repetitivos observados en la imagen (e.g. postura sentada prolongada frente a la pantalla, flexión de cuello, etc.).
                 2. **Uso de Elementos de Protección Personal (EPP):** Analizando si el trabajador usa o no EPP adecuado según el entorno observado en las imágenes (e.g., gafas de seguridad, protección auditiva, respiratoria, o EPP específico para oficina/computadores como lentes con filtro de luz azul o soporte ergonómico).


            ESTRUCTURA HTML OBLIGATORIA:

            PRIMERA LÍNEA (ANTES de cualquier otro HTML, sin excepción):
            <div id="wappy-kpi" data-riesgo="[ALTO|MEDIO|BAJO]" data-trabajador="[Nombre completo del trabajador evaluado]" data-cedula="[Cédula o documento del trabajador si fue mencionada, o N/A]" data-cargo="[Nombre del cargo o puesto de trabajo mencionado por el usuario]" data-actividad="[Breve resumen de la actividad laboral evaluada]" data-modalidad="[auto|asistida]" data-accion="[Inmediata|Programada|Preventiva]" data-consecuencia="[Mortal|Incapacitante|Leve]" data-npeligros="[N]" style="display:none"></div>
            - data-riesgo: El nivel de riesgo predominante que encontraste.
            - data-trabajador: Nombre completo del trabajador evaluado (mencionado en el saludo o conversación).
            - data-cedula: Cédula de ciudadanía o identificación del trabajador (si se indicó).
            - data-cargo: Cargo o puesto de trabajo que se indicó al inicio (ej. Desarrollador de Software, Asistente Administrativo, etc.).
            - data-actividad: Breve descripción de la actividad habitual evaluada.
            - data-modalidad: "auto" si el trabajador se auto-evalúa, o "asistida" si un prevencionista o compañero lo evalúa.
            - data-accion: La acción requerida con mayor urgencia.
            - data-consecuencia: La consecuencia máxima posible de materialización del riesgo crítico (Mortal, Incapacitante o Leve).
            - data-npeligros: El número exacto de peligros que listaste en la Matriz de Riesgos (debe ser ≥ 5).

            LUEGO EL CUERPO DEL INFORME:

            <h2>Informe Técnico de Evaluación de Riesgos y Peligros</h2>
            <p><strong>Fecha de Generación:</strong> ${currentDate}</p>
            <p><strong>Modalidad:</strong> Inspección en Vivo con Análisis de Video IA</p>
            <p><strong>Metodología Aplicada:</strong> GTC 45 / ISO 45001 / Decreto 1072 de 2015</p>

            <h3>1. Objeto y Alcance de la Inspección</h3>
            <p>[Describe el propósito de la inspección, qué se quería evaluar, cuál es el entorno de trabajo auditado y cuáles son los límites del análisis. Mínimo 2 párrafos detallados.]</p>

            <h3>2. Descripción Exhaustiva del Entorno Analizado</h3>
            <p>[Describe con precisión técnica el entorno observado: espacio físico, condiciones ambientales (iluminación, temperatura, humedad estimada), herramientas y equipos presentes, número de trabajadores estimado, actividades en ejecución. Usa terminología HSE. Mínimo 3 párrafos.]</p>

            <h3>3. Identificación y Análisis de Actos y Condiciones Inseguras</h3>
            <p>[Analiza detalladamente cada acto inseguro y condición insegura encontrada. Para cada uno: describe el hallazgo, la norma técnica o legal que incumple, y el potencial de daño. Usa viñetas para claridad pero con descripción extensa de cada punto.]</p>
            <ul>
                <li><strong>[Hallazgo 1 - Tipo]:</strong> [Descripción detallada del acto/condición insegura, su causa raíz, consecuencias potenciales y referencia normativa incumplida]</li>
                <li><strong>[Hallazgo 2 - Tipo]:</strong> [Descripción detallada...]</li>
                <li><strong>[Hallazgo N - Tipo]:</strong> [Descripción detallada...]</li>
            </ul>

            <h3>4. Matriz de Identificación de Peligros y Valoración de Riesgos (GTC 45)</h3>
            <p>La siguiente matriz ha sido construida con metodología GTC 45 (Guía Técnica Colombiana), evaluando cada peligro identificado durante la inspección en vivo. El nivel de riesgo se obtiene multiplicando Nivel de Deficiencia (ND) × Nivel de Exposición (NE) = Nivel de Probabilidad (NP), y luego NP × Nivel de Consecuencia (NC) = Nivel de Riesgo (NR).</p>
            <div class="table-responsive" style="overflow-x: auto; width: 100%; margin: 16px 0; -webkit-overflow-scrolling: touch;">
            <table border="0" style="border-collapse: separate; border-spacing: 0; border-radius: 12px; overflow: hidden; border: 1px solid #ddd; width: 100%; min-width: 850px; table-layout: auto; text-align: left; font-size: 0.85em;">
              <thead style="background-color: #004d99; color: white;">
                <tr>
                    <th style="padding: 8px 6px; text-align: center; white-space: normal;">#</th>
                    <th style="padding: 8px 8px; white-space: normal;">Proceso / Zona</th>
                    <th style="padding: 8px 8px; white-space: normal;">Peligro (Descripción)</th>
                    <th style="padding: 8px 8px; white-space: normal;">Clasificación GTC 45</th>
                    <th style="padding: 8px 8px; white-space: normal;">Efectos Posibles</th>
                    <th style="padding: 8px 6px; text-align: center; white-space: normal;">ND</th>
                    <th style="padding: 8px 6px; text-align: center; white-space: normal;">NE</th>
                    <th style="padding: 8px 6px; text-align: center; white-space: normal;">NC</th>
                    <th style="padding: 8px 6px; text-align: center; white-space: normal;">NR</th>
                    <th style="padding: 8px 8px; white-space: normal;">Nivel Riesgo</th>
                    <th style="padding: 8px 8px; white-space: normal;">Aceptabilidad</th>
                </tr>
              </thead>
              <tbody>
                <!-- OBLIGATORIO: Genera al menos 5 filas. Máximo las que el entorno requiera. Para cada peligro: ND (1-10), NE (1-4), NC (10-100), NR = ND×NE×NC, Nivel: I(>600 Crítico), II(200-600 Alto), III(70-200 Medio), IV(<70 Bajo) -->
                <tr style="background:#fff0f0;">
                    <td style="padding: 6px 4px; font-weight:bold; text-align: center;">1</td>
                    <td style="padding: 6px 5px; word-break: break-word;">[Zona/Proceso]</td>
                    <td style="padding: 6px 5px; word-break: break-word;">[Descripción técnica del peligro 1]</td>
                    <td style="padding: 6px 5px; word-break: break-word;">[Ej: Biomecánico / Físico / Psicosocial / Químico / Locativo]</td>
                    <td style="padding: 6px 5px; word-break: break-word;">[Efectos en salud: lesiones posibles]</td>
                    <td style="padding: 6px 3px; text-align:center;">[ND]</td>
                    <td style="padding: 6px 3px; text-align:center;">[NE]</td>
                    <td style="padding: 6px 3px; text-align:center;">[NC]</td>
                    <td style="padding: 6px 3px; text-align:center; font-weight:bold;">[NR]</td>
                    <td style="padding: 6px 5px; font-weight:bold; color:red; word-break: break-word;">I - CRÍTICO</td>
                    <td style="padding: 6px 5px; color:red; font-weight:bold; word-break: break-word;">No aceptable</td>
                </tr>
                <!-- Agrega mínimo 4 filas más con el mismo formato -->
              </tbody>
            </table>
            </div>

            <h3>5. Medidas de Intervención por Jerarquía de Controles (ISO 45001 / GTC 45)</h3>
            <p>Las medidas de control se proponen siguiendo estrictamente la Jerarquía de Controles establecida en la ISO 45001 y la GTC 45: Eliminación → Sustitución → Controles de Ingeniería → Controles Administrativos → Elementos de Protección Personal (EPP).</p>
            <div class="table-responsive" style="overflow-x: auto; width: 100%; margin: 16px 0; -webkit-overflow-scrolling: touch;">
            <table border="0" style="border-collapse: separate; border-spacing: 0; border-radius: 12px; overflow: hidden; border: 1px solid #ddd; width: 100%; min-width: 850px; table-layout: auto; text-align: left; font-size: 0.85em;">
              <thead style="background-color: #004d99; color: white;">
                <tr>
                    <th style="padding: 8px 8px; white-space: normal;">Peligro / Riesgo</th>
                    <th style="padding: 8px 8px; white-space: normal;">Eliminación / Sustitución</th>
                    <th style="padding: 8px 8px; white-space: normal;">Controles Ingeniería</th>
                    <th style="padding: 8px 8px; white-space: normal;">Controles Admin</th>
                    <th style="padding: 8px 8px; white-space: normal;">EPP Requerido</th>
                    <th style="padding: 8px 8px; white-space: normal;">Responsable</th>
                    <th style="padding: 8px 8px; white-space: normal;">Plazo</th>
                </tr>
              </thead>
              <tbody>
                <!-- Una fila por cada peligro identificado en la sección anterior -->
                <tr>
                    <td style="padding: 6px 6px; word-break: break-word;">[Peligro 1]</td>
                    <td style="padding: 6px 6px; word-break: break-word;">[Medida de eliminación/sustitución]</td>
                    <td style="padding: 6px 6px; word-break: break-word;">[Control de ingeniería específico]</td>
                    <td style="padding: 6px 6px; word-break: break-word;">[Procedimiento, capacitación]</td>
                    <td style="padding: 6px 6px; word-break: break-word;">[EPP específico: tipo, norma]</td>
                    <td style="padding: 6px 6px; word-break: break-word;">[Área o cargo responsable]</td>
                    <td style="padding: 6px 6px; word-break: break-word;">[Inmediato / 8 días]</td>
                </tr>
              </tbody>
            </table>
            </div>

            <h3>6. Plan de Acción Inmediata (Riesgos Críticos y Altos)</h3>
            <p>[Lista las acciones que deben tomarse AHORA MISMO o en las próximas 24-48 horas para controlar los riesgos de Nivel I y II. Sé muy específico: qué hacer, quién debe hacerlo, y cómo verificar que se hizo.]</p>
            <ol>
                <li><strong>Acción 1 (Inmediata - 0h):</strong> [Descripción detallada de la acción inmediata]</li>
                <li><strong>Acción 2 (Corto Plazo - 24h):</strong> [Descripción detallada]</li>
                <li><strong>Acción 3 (Corto Plazo - 48h):</strong> [Descripción detallada]</li>
            </ol>

            <h3>7. Análisis de Causas Raíz</h3>
            <p>[Aplica metodología de "Los 5 Por Qué" o Diagrama de Ishikawa para el riesgo más crítico identificado. Explica las causas inmediatas, básicas y sistémicas que generaron las condiciones inseguras encontradas. Mínimo 2 párrafos.]</p>

            <h3>8. Conclusiones Técnicas y Viabilidad Operacional</h3>
            <p>[Emite un dictamen técnico formal sobre el estado de seguridad del área/actividad inspeccionada. Indica si la operación puede continuar, si debe detenerse, o si debe hacerlo con medidas de control específicas. Sé contundente y técnico. Mínimo 2 párrafos.]</p>

            <h3>9. Firmas y Responsabilidades</h3>
            <p>El presente informe ha sido generado mediante inspección asistida por Inteligencia Artificial (Wappy-Audit HSE), con base en la evidencia visual y conversacional recopilada durante la sesión de análisis en vivo.</p>
            `;


            // Gather frames and telemetries from phaseEvidences
            let phaseFrames = [];
            let phaseTelemetryNotes = [];

            if (this.phaseEvidences && Object.keys(this.phaseEvidences).length > 0) {
                const sortedPhaseIndices = Object.keys(this.phaseEvidences)
                    .map(Number)
                    .sort((a, b) => a - b);

                for (const idx of sortedPhaseIndices) {
                    const pe = this.phaseEvidences[idx];
                    if (pe && pe.image) {
                        phaseFrames.push(pe.image);
                        const telemDesc = pe.telemetry?.summary || pe.text || '';
                        phaseTelemetryNotes.push(`• Fase ${idx + 1} (${pe.phaseName}): ${telemDesc || 'Captura de postura registrada'}`);
                    }
                }
            }

            // If some phases didn't have explicit captures, fill from manualEvidences
            if (phaseFrames.length < 3 && this.manualEvidences && this.manualEvidences.length > 0) {
                for (const img of this.manualEvidences) {
                    if (phaseFrames.length >= 3) break;
                    if (!phaseFrames.includes(img)) {
                        phaseFrames.push(img);
                    }
                }
            }

            const framesToUse = phaseFrames.length > 0 
                ? phaseFrames 
                : (this.manualEvidences && this.manualEvidences.length > 0) 
                    ? this.manualEvidences 
                    : (this.frameBuffer && this.frameBuffer.length > 0) 
                        ? this.frameBuffer 
                        : (this.lastEvaluatedFrames && this.lastEvaluatedFrames.length > 0)
                            ? this.lastEvaluatedFrames
                            : this.latestFrame 
                                ? [this.latestFrame] 
                                : [];

            let realTelemetryBlock = '';
            if (phaseTelemetryNotes.length > 0) {
                realTelemetryBlock = `
VALORES REALES DE TELEMETRÍA ARTICULAR REGISTRADOS EN VIVO (MEDICIÓN DIRECTA MEDIAPIPE):
${phaseTelemetryNotes.join('\n')}

REGLA ESTRICTA DE LA MATRIZ ERGONÓMICA:
En la sección "4.1 Matriz Ergonómica Comparativa Multifase", en la columna "Telemetría Articular (Cuello / Tronco / Brazo)", DEBES PLASMAR OBLIGATORIAMENTE estos ángulos articulares medidos en cada una de las fases. NO inventes valores ficticios. Sustenta los puntajes RULA / REBA y el nivel de riesgo directamente sobre estas mediciones reales.
`;
            }

            logger.info(`[VoiceSession] Sending multimodal prompt to model: ${reportModelName} (via rotation)`);
            
            // Multimodal Array of Parts
            const promptParts = [
                { text: `${prompt}\n\n${realTelemetryBlock}` }
            ];

            // Inject visual frames: prefer 3 distinct phase photos
            let injectedFrames = 0;
            for (const b64 of framesToUse.slice(0, 3)) {
                promptParts.push({
                    inlineData: {
                        data: b64,
                        mimeType: "image/jpeg"
                    }
                });
                injectedFrames++;
            }
            logger.info(`[VoiceSession] Injected ${injectedFrames} visual frames (phaseEvidences: ${Object.keys(this.phaseEvidences || {}).length}, manual: ${!!(this.manualEvidences && this.manualEvidences.length > 0)}) into report prompt.`);

            // Call API with the multimodal array
            const result = await generateWithKeyRotation(reportModelName, this.userId, promptParts);
            const response = result.response;
            let reportHtml = response.text().replace(/```html/g, '').replace(/```/g, '').trim();

            // ─── DYNAMIC SIGNATURE AND WORKER DETECTION ──────────────────────
            let finalSignatureHtml = '';
            let companyInfo = null;
            try {
                companyInfo = await CompanyInfo.findOne({ user: this.userId, isActive: true }).lean();
                if (!companyInfo) {
                    companyInfo = await CompanyInfo.findOne({ user: this.userId }).lean();
                }
                let matchedWorker = null;

                if (mongoose.models.PerfilSociodemograficoData) {
                    const profileData = await mongoose.models.PerfilSociodemograficoData.findOne({ user: this.userId }).lean();
                    if (profileData && profileData.trabajadores) {
                        // Find the first worker whose name or identification is explicitly mentioned in the generated HTML
                        matchedWorker = profileData.trabajadores.find(w => {
                            if (w.nombre && reportHtml.includes(w.nombre)) return true;
                            if (w.identificacion && reportHtml.includes(w.identificacion)) return true;
                            return false;
                        });
                        if (matchedWorker) {
                            logger.info(`[VoiceSession] Worker matched in report: ${matchedWorker.nombre}`);
                        }
                    }
                }

                if (companyInfo) {
                    finalSignatureHtml = buildSignatureSection(companyInfo, matchedWorker);
                }
            } catch (err) {
                logger.warn('[VoiceSession] Error generating signatures for LiveAnalysis:', err.message);
            }

            if (finalSignatureHtml) {
                reportHtml += `\n\n${finalSignatureHtml}`;
            }

            // ─── EXTRACT KPI DIV AND CONTEXT METADATA ────────
            const kpiMatch = reportHtml.match(/<div[^>]+id=["']wappy-kpi["'][^>]*>[\s\S]*?<\/div>/i) || reportHtml.match(/<div[^>]+id=["']wappy-kpi["'][^>]*>/i);
            let kpiDiv = '';
            if (kpiMatch) {
                kpiDiv = kpiMatch[0];
                if (!kpiDiv.endsWith('</div>') && !kpiDiv.includes('/>')) {
                    kpiDiv += '</div>';
                }
                reportHtml = reportHtml.replace(kpiMatch[0], '');
            } else {
                kpiDiv = '<div id="wappy-kpi" data-riesgo="MEDIO" data-accion="Programada" data-consecuencia="Incapacitante" data-npeligros="5" style="display:none"></div>';
            }

            // Remove any duplicated title or metadata from Gemini's output
            reportHtml = reportHtml.replace(/<h2>Informe Técnico de Evaluación de Riesgos y Peligros<\/h2>/i, '');
            reportHtml = reportHtml.replace(/<p><strong>Fecha de Generación:<\/strong>.*?<\/p>/i, '');
            reportHtml = reportHtml.replace(/<p><strong>Modalidad:<\/strong>.*?<\/p>/i, '');
            reportHtml = reportHtml.replace(/<p><strong>Metodología Aplicada:<\/strong>.*?<\/p>/i, '');

            // Build photographic evidence section inside body
            let evidenceHtml = '';
            if (framesToUse.length > 0) {
                const activeProtocol = this.agentProtocol || resolveInspectionProtocol(this.agentObj?.name || this.config?.template);
                const phaseLabels = (activeProtocol.phases || []).map(p => typeof p === 'string' ? p : (p.name || p.shortName));
                const sectionTitle = `1. Evidencia Fotográfica y Documental Multifase (${activeProtocol.title})`;

                const imgItems = framesToUse.slice(0, 3).map((b64, idx) => {
                    const phaseData = this.phaseEvidences?.[idx] || this.lastPhaseEvidences?.[idx];
                    const label = phaseData?.phaseName || phaseLabels[idx] || `Fase ${idx + 1}: Evidencia de Inspección`;
                    const telemSummary = phaseData?.telemetry?.summary || '';
                    const telemItems = telemSummary ? telemSummary.split(/\s*•\s*/).filter(Boolean) : [];

                    const telemHtml = telemItems.length > 0 ? `
                        <div style="margin-top:8px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:6px 8px; text-align:left; box-shadow:0 1px 2px rgba(0,0,0,0.03); width:100%; box-sizing:border-box;">
                            <div style="font-size:0.72em; font-weight:700; color:#0f766e; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px; border-bottom:1px solid #e2e8f0; padding-bottom:2px;">
                                📐 Telemetría Articular:
                            </div>
                            ${telemItems.map(item => {
                                const parts = item.split(':');
                                const metricName = parts[0]?.trim() || '';
                                const metricVal = parts.slice(1).join(':').trim() || '';
                                return `
                                <div style="font-size:0.68em; line-height:1.3; color:#334155; margin-bottom:3px; word-break:break-word; overflow-wrap:break-word;">
                                    <span style="font-weight:600; color:#1e293b;">• ${metricName}:</span> 
                                    <span style="color:#0f766e; font-weight:600;">${metricVal}</span>
                                </div>`;
                            }).join('')}
                        </div>` : '';

                    return `
                    <td style="width:33.333%; max-width:33.333%; padding:6px; vertical-align:top; text-align:center; border:none; background:transparent; word-break:break-word; overflow-wrap:break-word; box-sizing:border-box;">
                        <div style="background:#f8fafc; border-radius:8px; border:1px solid #e2e8f0; padding:4px; box-shadow:0 2px 6px rgba(0,0,0,0.04);">
                            <img src="data:image/jpeg;base64,${b64}" alt="Evidencia Fase ${idx+1}" style="width:100%; max-height:220px; object-fit:contain; border-radius:6px; display:block; margin:0 auto;" />
                        </div>
                        <p style="font-size:0.78em; color:#0f766e; font-weight:700; margin-top:8px; margin-bottom:2px; line-height:1.3; word-break:break-word; overflow-wrap:break-word;">${label}</p>
                        ${telemHtml}
                    </td>`;
                }).join('');

                evidenceHtml = `
                    <div style="margin-bottom:24px;">
                        <h3 style="color:#0f766e; font-size:1.1em; text-transform:uppercase; letter-spacing:1px; border-left:4px solid #14b8a6; padding-left:10px; margin-bottom:12px;">${sectionTitle}</h3>
                        <table border="0" style="width:100%; border:none; table-layout:fixed; border-collapse:collapse; margin-top:12px; box-sizing:border-box;">
                            <tr>${imgItems}</tr>
                        </table>
                    </div>`;
            }

            const radicadoId = `LA-${new Date().getFullYear()}-${String(Math.floor(Math.random()*9000)+1000)}`;

            // Extract worker, cargo, actividad & modalidad if present in kpiDiv or conversation turns
            const workerNameMatch = kpiDiv.match(/data-trabajador=["']([^"']+)["']/i);
            const workerIdMatch = kpiDiv.match(/data-cedula=["']([^"']+)["']/i);
            const cargoMatch = kpiDiv.match(/data-cargo=["']([^"']+)["']/i);
            const actividadMatch = kpiDiv.match(/data-actividad=["']([^"']+)["']/i);
            const modalidadMatch = kpiDiv.match(/data-modalidad=["']([^"']+)["']/i);

            const convoText = (this.conversationTurns || []).join('\n');

            let extractedWorkerName = this.config?.workerName || (workerNameMatch && !workerNameMatch[1].includes('[') && workerNameMatch[1] !== 'N/A' 
                ? workerNameMatch[1].trim() 
                : '');
            if (!extractedWorkerName && convoText) {
                const nameRegex = /(?:me llamo|mi nombre es|nombre(?:\s+completo)?\s*(?:es|:))\s*([A-ZÁÉÍÓÚÑa-záéíóúñ\s]{3,40})/i;
                const mName = convoText.match(nameRegex);
                if (mName && mName[1]) {
                    extractedWorkerName = mName[1].replace(/\n.*$/, '').trim();
                }
            }
            if (!extractedWorkerName) {
                extractedWorkerName = this.user?.name || 'Trabajador Evaluado';
            }

            let extractedWorkerId = this.config?.workerId || (workerIdMatch && !workerIdMatch[1].includes('[') && workerIdMatch[1] !== 'N/A'
                ? workerIdMatch[1].trim()
                : '');
            if (!extractedWorkerId && convoText) {
                const docRegex = /(?:c[eé]dula|cc|identificaci[oó]n|documento|doc)[\s:]*([0-9\.\-]{6,15})/i;
                const mDoc = convoText.match(docRegex);
                if (mDoc && mDoc[1]) {
                    extractedWorkerId = mDoc[1].replace(/\D/g, '').trim();
                } else {
                    const digitsMatch = convoText.match(/\b([1-9][0-9]{6,9})\b/);
                    if (digitsMatch) {
                        extractedWorkerId = digitsMatch[1].trim();
                    }
                }
            }

            let extractedCargo = this.config?.cargo || (cargoMatch && !cargoMatch[1].includes('[') ? cargoMatch[1].trim() : '');
            if (!extractedCargo && convoText) {
                const cargoRegex = /(?:cargo|puesto(?:\s+de\s+trabajo)?)\s*(?:es|:)?\s*([A-ZÁÉÍÓÚÑa-záéíóúñ\s]{3,40})/i;
                const mCargo = convoText.match(cargoRegex);
                if (mCargo && mCargo[1]) {
                    extractedCargo = mCargo[1].replace(/\n.*$/, '').trim();
                }
            }
            if (!extractedCargo) {
                extractedCargo = 'Puesto Operativo / Administrativo';
            }

            const extractedActividad = this.config?.actividad || (actividadMatch && !actividadMatch[1].includes('[') ? actividadMatch[1].trim() : 'Evaluación ergonómica y postural en ciclo regular');
            const extractedModalidad = (modalidadMatch && modalidadMatch[1].toLowerCase().includes('asist')) || (convoText.toLowerCase().includes('compañero') || convoText.toLowerCase().includes('asistid')) ? 'asistida' : 'auto';

            // Store extracted worker metadata on the session instance for persistence
            this.extractedWorkerMeta = {
                workerName: extractedWorkerName,
                workerId: extractedWorkerId,
                cargo: extractedCargo,
                actividad: extractedActividad,
                modalidad: extractedModalidad,
            };

            const standardReportTitle = this.isBiomechanics 
                ? 'INFORME TÉCNICO DE ERGONOMÍA Y BIOMECÁNICA' 
                : (activeProtocol?.title ? activeProtocol.title.toUpperCase() : 'INFORME TÉCNICO DE EVALUACIÓN DE RIESGOS');

            // 1. Encabezado institucional de la entidad (100% puro e intacto)
            const standardHeaderHtml = buildStandardHeader({
                title: standardReportTitle,
                companyInfo: companyInfo,
                norm: this.isBiomechanics ? 'Resolución 2400 de 1979 / GTC 45 / ISO 11226 (RULA/REBA)' : (activeProtocol?.normRef || 'Resolución 0312 de 2019 / GTC 45'),
                version: '1.0',
                documentId: radicadoId,
                date: new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' }),
            });

            // 2. Sub-encabezado técnico del trabajador y puesto evaluado
            const workerSubHeaderHtml = buildWorkerSubHeader({
                workerName: extractedWorkerName,
                workerId: extractedWorkerId,
                cargo: extractedCargo,
                actividad: extractedActividad,
                evaluationType: extractedModalidad,
                evaluatorName: extractedModalidad === 'auto' ? 'Auto-reporte asistido por WAPPY Fisio IA' : (this.user?.name || 'Inspector SG-SST'),
            });

            const finalWrappedHtml = `<div class="report-container" style="font-family:'Segoe UI',Arial,sans-serif; max-width:900px; margin:0 auto; color:#111827;">
${kpiDiv}
<style>
.ai-report-content h2, .ai-report-content h3 { color: #0f766e; margin-top: 24px; margin-bottom: 12px; font-weight: 700; border-bottom: 1px solid #ccfbf1; padding-bottom: 6px; }
.ai-report-content p, .ai-report-content li { color: #334155; margin-bottom: 10px; font-size: 0.95em; }
.ai-report-content .table-responsive { width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; margin: 16px 0; border-radius: 10px; border: 1px solid #e2e8f0; }
.ai-report-content table { width: 100%; min-width: 800px; table-layout: auto; border-collapse: separate; border-spacing: 0; margin: 0; font-size: 0.85em; }
.ai-report-content th { background-color: #0f766e; color: #ffffff; padding: 9px 10px; text-align: left; white-space: normal; word-break: normal; }
.ai-report-content td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; color: #1e293b; white-space: normal; word-break: normal; }
.ai-report-content tr:nth-child(even) td { background-color: #f8fafc; }
</style>

${standardHeaderHtml}
${workerSubHeaderHtml}

<div style="background:#ffffff; padding:10px 0; min-height:400px; display:flex; flex-direction:column; color:#1f2937;">
    ${evidenceHtml}

    <div class="ai-report-content" style="line-height:1.7; color:#1f2937;">
      <h2 style="color:#0f766e; font-size:1.4em; font-weight:800; border-bottom:2px solid #14b8a6; padding-bottom:8px; margin-bottom:20px;">${this.isBiomechanics ? 'Informe Técnico de Evaluación Postural y Ergonómica' : 'Informe Técnico de Evaluación de Riesgos y Peligros'}</h2>
      ${reportHtml}
    </div>
</div>
</div>`;

            // Strip any 4+ space indentation so markdown engines never treat tags as code blocks
            reportHtml = finalWrappedHtml.replace(/^[ \t]{4,}/gm, '');

            // Ensure every <table> has a responsive wrapper and horizontal scroll (min-width: 800px, overflow-x: auto)
            if (reportHtml && typeof reportHtml === 'string') {
                reportHtml = reportHtml.replace(/(?:<div[^>]*class=["'][^"']*table-responsive[^"']*["'][^>]*>\s*)?(<table[\s\S]*?<\/table>)(?:\s*<\/div>)?/gi, (match, tableContent) => {
                    let cleanTable = tableContent;
                    // Replace table-layout: fixed with table-layout: auto so columns never crush/overlap
                    cleanTable = cleanTable.replace(/table-layout:\s*fixed;?/gi, 'table-layout: auto;');
                    // Ensure table has min-width: 800px so overflow-x: auto activates when space is constrained
                    if (!cleanTable.includes('min-width')) {
                        cleanTable = cleanTable.replace(/<table\b([^>]*)>/i, (m, attrs) => {
                            if (/style=["']/.test(attrs)) {
                                return `<table ${attrs.replace(/style=["']([^"']*)["']/, 'style="width: 100%; min-width: 800px; table-layout: auto; $1"')}>`;
                            } else {
                                return `<table style="width: 100%; min-width: 800px; table-layout: auto;" ${attrs}>`;
                            }
                        });
                    } else {
                        cleanTable = cleanTable.replace(/<table\b([^>]*)>/i, (m, attrs) => {
                            if (/style=["']/.test(attrs)) {
                                return `<table ${attrs.replace(/style=["']([^"']*)["']/, 'style="table-layout: auto; $1"')}>`;
                            } else {
                                return `<table style="table-layout: auto;" ${attrs}>`;
                            }
                        });
                    }
                    // Ensure th & td allow natural wrapping and never overlap
                    cleanTable = cleanTable.replace(/<(th|td)\b([^>]*)>/gi, (m, tag, attrs) => {
                        if (/style=["']/.test(attrs)) {
                            return `<${tag} ${attrs.replace(/style=["']([^"']*)["']/, 'style="white-space: normal; word-break: normal; $1"')}>`;
                        } else {
                            return `<${tag} style="white-space: normal; word-break: normal;" ${attrs}>`;
                        }
                    });
                    return `<div class="table-responsive" style="overflow-x: auto; width: 100%; margin: 16px 0; -webkit-overflow-scrolling: touch;">${cleanTable}</div>`;
                });
            }
            // ──────────────────────────────────────────────────────────────────

            logger.info(`[VoiceSession] Report generated successfully (${reportHtml.length} chars)`);

            // SAVE REPORT TO DATABASE FIRST (Persistence)
            // This ensures we have a messageId BEFORE sending to client
            let messageId = uuidv4();
            if (this.conversationId && this.conversationId !== 'new') {
                try {
                    // IMPROVED: Convert HTML to Markdown for chat display
                    // The chat UI expects Markdown, not raw HTML
                    const convertHtmlToMarkdown = (html) => {
                        let md = html;

                        // Strip out style blocks, svgs, and hidden tracking elements
                        md = md.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
                        md = md.replace(/<svg[^>]*>[\s\S]*?<\/svg>/gi, '');
                        md = md.replace(/<div id="wappy-kpi"[^>]*>[\s\S]*?<\/div>/gi, '');

                        // Handle tables FIRST (before stripping other tags)
                        // This creates proper Markdown tables
                        const tableRegex = /<table[^>]*>([\s\S]*?)<\/table>/gi;
                        md = md.replace(tableRegex, (match, tableContent) => {
                            const rows = [];
                            const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
                            let rowMatch;
                            let isHeader = true;

                            while ((rowMatch = rowRegex.exec(tableContent)) !== null) {
                                const cells = [];
                                const cellRegex = /<(th|td)[^>]*>([\s\S]*?)<\/\1>/gi;
                                let cellMatch;

                                while ((cellMatch = cellRegex.exec(rowMatch[1])) !== null) {
                                    // Clean cell content
                                    let cellText = cellMatch[2]
                                        .replace(/<[^>]*>/g, '') // Remove inner tags
                                        .replace(/\n/g, ' ')
                                        .trim();
                                    cells.push(cellText || ' ');
                                }

                                if (cells.length > 0) {
                                    rows.push('| ' + cells.join(' | ') + ' |');

                                    // Add separator after header row
                                    if (isHeader) {
                                        rows.push('|' + cells.map(() => '---').join('|') + '|');
                                        isHeader = false;
                                    }
                                }
                            }

                            return '\n' + rows.join('\n') + '\n';
                        });

                        // Handle headings
                        md = md.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '\n# $1\n');
                        md = md.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '\n## $1\n');
                        md = md.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '\n### $1\n');
                        md = md.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '\n#### $1\n');

                        // Handle text formatting
                        md = md.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
                        md = md.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');
                        md = md.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
                        md = md.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');

                        // Handle lists
                        md = md.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n');
                        md = md.replace(/<ul[^>]*>/gi, '\n');
                        md = md.replace(/<\/ul>/gi, '\n');
                        md = md.replace(/<ol[^>]*>/gi, '\n');
                        md = md.replace(/<\/ol>/gi, '\n');

                        // Handle paragraphs and line breaks
                        md = md.replace(/<p[^>]*>(.*?)<\/p>/gis, '\n$1\n');
                        md = md.replace(/<br\s*\/?>/gi, '\n');
                        md = md.replace(/<div[^>]*>/gi, '\n');
                        md = md.replace(/<\/div>/gi, '\n');

                        // Handle images - base64 images replaced with placeholder, URL images to markdown
                        // Base64 images cause display issues in chat (too long)
                        md = md.replace(/<img[^>]*src="data:[^"]*"[^>]*alt="([^"]*)"[^>]*>/gi, '\n\n📷 **[$1]** *(imagen disponible en el informe original)*\n\n');
                        md = md.replace(/<img[^>]*src="data:[^"]*"[^>]*>/gi, '\n\n📷 **[Imagen captada]** *(ver en informe original)*\n\n');
                        // Normal URL images convert to markdown
                        md = md.replace(/<img[^>]*src="(https?:\/\/[^"]*)"[^>]*alt="([^"]*)"[^>]*>/gi, '![$2]($1)');
                        md = md.replace(/<img[^>]*src="(https?:\/\/[^"]*)"[^>]*>/gi, '![image]($1)');

                        // Remove remaining HTML tags
                        md = md.replace(/<[^>]*>/g, '');

                        // Clean up entities
                        md = md.replace(/&nbsp;/g, ' ');
                        md = md.replace(/&amp;/g, '&');
                        md = md.replace(/&lt;/g, '<');
                        md = md.replace(/&gt;/g, '>');

                        // Fix excess newlines
                        md = md.replace(/\n\s*\n\s*\n/g, '\n\n');

                        return md.trim();
                    };

                    const cleanMarkdown = convertHtmlToMarkdown(reportHtml);
                    const reportTitle = this.isBiomechanics 
                        ? 'Informe Técnico de Ergonomía y Biomecánica' 
                        : 'Informe Técnico de Evaluación de Riesgos y Peligros';

                    const chatMessageText = `${cleanMarkdown}\n\n:::canvas{title="${reportTitle}" fileType="text" identifier="informe-ergonomico-${radicadoId}"}\n${reportHtml}\n:::\n`;

                    const reportModelName = SGSST_FALLBACK_MODELS[0]; // Use same model name used for generation
                    const reportSender = this.agentObj?.name || (this.isBiomechanics ? 'Fisioterapeuta Laboral' : 'Assistant');
                    const reportIconURL = this.agentObj?.avatar?.filepath || this.agentObj?.avatar?.url || undefined;
                    const reportMessage = {
                        messageId,
                        conversationId: this.conversationId,
                        parentMessageId: this.lastMessageId,
                        sender: reportSender,
                        iconURL: reportIconURL,
                        user: this.userId,
                        text: chatMessageText, // Clean Markdown + Native Canvas Directive
                        content: [{ type: 'text', text: chatMessageText }],
                        isCreatedByUser: false,
                        isHtmlReport: true, // Marker - this is an HTML report
                        error: false,
                        model: reportModelName,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    };

                    await saveMessage({ user: { id: this.userId } }, reportMessage, { context: 'VoiceSession - Report' });
                    this.lastMessageId = messageId; // Update pointer
                    logger.info(`[VoiceSession] Report saved to DB with sender "${reportSender}". MessageId: ${messageId}`);

                    // Save conversation state so LibreChat updates the conversation list and timestamps
                    try {
                        await saveConvo({ user: { id: this.userId } }, {
                            conversationId: this.conversationId,
                            endpoint: this.dbEndpoint,
                            model: this.dbModel,
                            ...(this.config.mode === 'live_analysis' ? { tags: ['sgsst-live-analysis'] } : {})
                        }, { context: 'VoiceSession - Report' });
                    } catch (convoSaveError) {
                        logger.warn('[VoiceSession] Error updating conversation for report:', convoSaveError.message);
                    }

                    // Sync to LiveEditorSession & Canvas
                    try {
                        const LiveEditorSession = require('~/models/LiveEditorSession');
                        const CompanyInfo = require('~/models/CompanyInfo');
                        const { syncLiveEditorToCanvas } = require('../sgsst/syncBridge');
                        const { getActiveCompanyId } = require('../sgsst/contextHelper');

                        const companyId = this.config.companyId || (await getActiveCompanyId(this.userId));

                        const reportTitle = `Informe de Inspección - ${this.isBiomechanics ? 'BIOMECÁNICA (RULA/REBA)' : 'SST'}`;

                        if (companyId) {
                            await LiveEditorSession.findOneAndUpdate(
                                { conversationId: this.conversationId, companyId },
                                {
                                    $set: {
                                        content: reportHtml,
                                        contentUpdatedAt: new Date(),
                                        companyId,
                                        fileName: reportTitle,
                                    },
                                    $setOnInsert: { user: this.userId },
                                },
                                { upsert: true, new: true }
                            );
                        }

                        await syncLiveEditorToCanvas(this.conversationId, reportHtml, reportTitle, this.userId);
                        logger.info('[VoiceSession] Report synced to LiveEditorSession and Canvas successfully');

                        // If this is a Biomechanics / Ergonomics study, persist to EstudioPuestoTrabajo and sync worker
                        if (this.isBiomechanics && companyId) {
                            try {
                                const EstudioPuestoTrabajo = require('~/models/EstudioPuestoTrabajo');
                                const workerMeta = this.extractedWorkerMeta || {};
                                const rawWorkerId = workerMeta.workerId || '';
                                const cleanWorkerId = rawWorkerId ? String(rawWorkerId).trim() : `CC-${Date.now().toString().slice(-6)}`;
                                const cleanWorkerName = workerMeta.workerName || this.user?.name || 'Trabajador Evaluado';
                                const cleanCargo = workerMeta.cargo || 'Puesto Evaluado';
                                const cleanActividad = workerMeta.actividad || 'Evaluación en vivo';
                                const cleanModalidad = workerMeta.modalidad || 'auto';

                                // Extract RULA & REBA scores and Risk Level from report
                                const rulaMatch = reportHtml.match(/RULA[^\d<]*?(\d+)/i);
                                const rebaMatch = reportHtml.match(/REBA[^\d<]*?(\d+)/i);
                                const rulaScore = rulaMatch ? parseInt(rulaMatch[1], 10) : null;
                                const rebaScore = rebaMatch ? parseInt(rebaMatch[1], 10) : null;

                                let riskLevel = 'Bajo';
                                const riesgoMatch = (kpiDiv || '').match(/data-riesgo=["']([^"']+)["']/i);
                                if (riesgoMatch) {
                                    const rRaw = riesgoMatch[1].toLowerCase();
                                    if (rRaw.includes('crit') || rRaw.includes('crít')) riskLevel = 'Crítico';
                                    else if (rRaw.includes('alt')) riskLevel = 'Alto';
                                    else if (rRaw.includes('med')) riskLevel = 'Medio';
                                    else riskLevel = 'Bajo';
                                } else if (/riesgo\s*(es|:)?\s*cr[ií]tico/i.test(reportHtml) || (rulaScore && rulaScore >= 7) || (rebaScore && rebaScore >= 11)) {
                                    riskLevel = 'Crítico';
                                } else if (/riesgo\s*(es|:)?\s*alto/i.test(reportHtml) || (rulaScore && rulaScore >= 5) || (rebaScore && rebaScore >= 8)) {
                                    riskLevel = 'Alto';
                                } else if (/riesgo\s*(es|:)?\s*medio/i.test(reportHtml) || (rulaScore && rulaScore >= 3) || (rebaScore && rebaScore >= 4)) {
                                    riskLevel = 'Medio';
                                }

                                let actionLevel = 'Nivel 1 - Postura Aceptable';
                                if (riskLevel === 'Crítico') {
                                    actionLevel = 'Nivel 4 - Actuación Inmediata';
                                } else if (riskLevel === 'Alto') {
                                    actionLevel = 'Nivel 3 - Pronta Actuación';
                                } else if (riskLevel === 'Medio') {
                                    actionLevel = 'Nivel 2 - Es Necesaria la Actuación';
                                }

                                const newStudyDoc = new EstudioPuestoTrabajo({
                                    companyId,
                                    user: this.userId,
                                    workerId: cleanWorkerId,
                                    workerName: cleanWorkerName,
                                    cargo: cleanCargo,
                                    actividad: cleanActividad,
                                    evaluationType: cleanModalidad,
                                    evaluatorName: cleanModalidad === 'auto' ? 'Auto-reporte asistido por WAPPY IA' : (this.user?.name || 'Inspector SG-SST'),
                                    channel: 'chat_voice',
                                    modelUsed: reportModelName,
                                    telemetry: this.phaseEvidences?.map(p => p?.telemetry).filter(Boolean) || {},
                                    evidences: (framesToUse || []).slice(0, 3).map((f, idx) => ({
                                        phase: idx + 1,
                                        label: `Fase ${idx + 1}`,
                                        url: `data:image/jpeg;base64,${f}`,
                                        telemetry: this.phaseEvidences?.[idx]?.telemetry || {},
                                    })),
                                    rulaScore,
                                    rebaScore,
                                    actionLevel,
                                    riskLevel,
                                    reportHtml,
                                    status: 'completado',
                                });
                                await newStudyDoc.save();
                                logger.info(`[VoiceSession] EstudioPuestoTrabajo saved with ID: ${newStudyDoc._id}, Risk: ${riskLevel}, Action: ${actionLevel}`);

                                // Sync or update worker in PerfilSociodemograficoData & SgsstWorker
                                const PerfilSociodemograficoData = mongoose.models.PerfilSociodemograficoData;
                                if (PerfilSociodemograficoData) {
                                    let perfilDoc = await PerfilSociodemograficoData.findOne({ companyId });
                                    if (!perfilDoc && this.userId) {
                                        perfilDoc = new PerfilSociodemograficoData({
                                            user: this.userId,
                                            companyId,
                                            trabajadores: [],
                                        });
                                    }

                                    if (perfilDoc) {
                                        const existingIdx = perfilDoc.trabajadores.findIndex(
                                            (w) => w.identificacion && String(w.identificacion).trim() === cleanWorkerId
                                        );
                                        const dateStr = new Date().toLocaleDateString('es-CO');
                                        const eptNote = `Estudio Ergonómico WAPPY IA (${dateStr}): ${cleanCargo}. Actividad: ${cleanActividad}`;

                                        if (existingIdx >= 0) {
                                            const w = perfilDoc.trabajadores[existingIdx];
                                            if (!w.cargo && cleanCargo) w.cargo = cleanCargo;
                                            w.completedByAI = true;
                                            w.diagnosticoMedico = w.diagnosticoMedico ? `${w.diagnosticoMedico} | ${eptNote}` : eptNote;
                                            perfilDoc.markModified('trabajadores');
                                            await perfilDoc.save();
                                            logger.info(`[VoiceSession] Existing worker ${cleanWorkerId} updated with EPT study`);

                                            // Sync SgsstWorker as well
                                            const SgsstWorker = mongoose.models.SgsstWorker;
                                            if (SgsstWorker && this.userId) {
                                                await SgsstWorker.findOneAndUpdate(
                                                    { companyId, documento: cleanWorkerId },
                                                    {
                                                        $set: {
                                                            user: this.userId,
                                                            companyId,
                                                            documento: cleanWorkerId,
                                                            nombre: w.nombre || cleanWorkerName,
                                                            perfilId: cleanWorkerId,
                                                            condicionesSalud: `EPT ergonómico registrado: ${actionLevel}`,
                                                            updatedAt: new Date(),
                                                        },
                                                    },
                                                    { upsert: true, new: true }
                                                ).catch((err) => logger.warn('[VoiceSession] SgsstWorker upsert warning:', err.message));
                                            }
                                        } else {
                                            logger.info(`[VoiceSession] Worker ${cleanWorkerId} not yet in PerfilSociodemograficoData. Study kept in chat/EPT pending worker creation.`);
                                        }
                                    }
                                }
                            } catch (eptErr) {
                                logger.warn('[VoiceSession] Error saving EstudioPuestoTrabajo from voice session:', eptErr.message);
                            }
                        }
                    } catch (syncErr) {
                        logger.warn('[VoiceSession] Error syncing report to LiveEditor/Canvas:', syncErr.message);
                    }

                    this.reportGenerated = true;

                    // CRITICAL: Notify client to invalidate queries so the report appears immediately in the chat!
                    this.sendToClient({
                        type: 'conversationUpdated',
                        data: { conversationId: this.conversationId }
                    });

                    // INTERACTIVITY: Instruct Gemini Live (First Brain) to announce the report
                    if (this.geminiClient && this.isActive) {
                        logger.info('[VoiceSession] Instructing Gemini Live to announce report...');
                        try {
                            this.geminiClient.sendText('INSTRUCCIÓN: El informe técnico ergonómico oficial acaba de ser generado y ya está cargado en el editor de la pantalla del usuario. Avisa al usuario verbalmente en 1 sola frase breve y entusiasta: "Listo, tu informe técnico ha sido generado con éxito y ya está disponible en tu pantalla. Puedes revisarlo ahora mismo." PROHIBIDO LEER O INVENTAR EL CONTENIDO DEL INFORME.');
                        } catch (announceErr) {
                            logger.warn('[VoiceSession] Could not send report announcement to Gemini:', announceErr.message);
                        }
                    }

                } catch (saveError) {
                    logger.error('[VoiceSession] Error saving report to DB:', saveError);
                    // Continue anyway, client will receive report but save might fail if clicked immediately
                }
            }

            // Get the frames evaluated
            const evalFrames = (framesToUse && framesToUse.length > 0)
                ? [...framesToUse.slice(0, 3)]
                : (this.manualEvidences && this.manualEvidences.length > 0)
                    ? [...this.manualEvidences]
                    : (this.frameBuffer && this.frameBuffer.length > 0)
                        ? [...this.frameBuffer]
                        : this.latestFrame
                            ? [this.latestFrame]
                            : [];

            // Cache evaluated frames and phase evidences for fallback in case subsequent report needs them
            if (evalFrames && evalFrames.length > 0) {
                this.lastEvaluatedFrames = [...evalFrames];
            }
            if (this.phaseEvidences && Object.keys(this.phaseEvidences).length > 0) {
                this.lastPhaseEvidences = { ...this.phaseEvidences };
            }

            // Clear manual evidence and phase buffers for next turns/reports
            this.manualEvidences = [];
            this.phaseEvidences = {};

            // Notify client with HTML (for rich rendering in Live editor) AND messageId
            this.sendToClient({
                type: 'report',
                data: {
                    html: reportHtml,
                    messageId: messageId,
                    evaluatedFrames: evalFrames
                }
            });

            return reportHtml;
        } catch (error) {
            logger.error('[VoiceSession] Error generating formal report:', error);
            
            // Critical fallback: Notify client that report generation failed so UI unfreezes!
            this.sendToClient({
                type: 'report',
                data: { 
                    html: `<div style="padding:24px; color:#d32f2f; background-color:#ffebee; border-radius:8px; border:1px solid #ef5350;">
                        <h3 style="margin-top:0;">⚠️ Error de Generación</h3>
                        <p>Ocurrió un error al generar el informe técnico con la Inteligencia Artificial. El sistema experimentó una falla interna: <strong>${error.message}</strong>.</p>
                        <p>No te preocupes, el diagnóstico no se ha perdido. Por favor, vuelve a indicarle al asistente de voz que genere el informe.</p>
                    </div>`,
                    messageId: uuidv4()
                }
            });
            return null;
        }
    }

    /**
     * Tenshi Voice Failsafe: Intercepta intenciones de abrir agentes o navegar
     * en caso de que Gemini Live haya respondido por voz pero omitido el toolCall.
     * CRÍTICO: Se evalúa EXCLUSIVAMENTE el texto hablado por el usuario (currentUserText),
     * NUNCA el texto generado por la IA (currentAiText), para evitar falsos positivos
     * que abran chats espurios o naveguen cuando Tenshi simplemente habla o saluda.
     */
    handleTenshiVoiceFailsafe(currentUserText = '', currentAiText = '') {
        if (this.config.mode !== 'tenshi_voice') return;
        if (this.toolCalledThisTurn) {
            logger.debug('[VoiceSession] [Tenshi Voice Failsafe] Tool was properly called by Gemini. No failsafe needed.');
            return;
        }

        const userText = (currentUserText || '').trim();
        if (!userText || userText.includes('[SISTEMA INTERNO WAPPY')) return;
        const userLower = userText.toLowerCase();

        // 0. Filtro estricto de frases conversacionales cortas: NUNCA disparan delegación de agentes
        const isConversationalCheck = /^(¿?\s*(me\s+escuchas?|me\s+o[yi]es?|est[aá]s\s+ah[ií]|qu[eé]\s+dijo|qu[eé]\s+respondi[oó]|ya\s+respondi[oó]|hola|buenas|gracias|ok|listo|entendido)\s*\??)$/i.test(userLower);
        if (isConversationalCheck) {
            logger.debug(`[VoiceSession] [Tenshi Voice Failsafe] Ignorando frase puramente conversacional: "${userLower}"`);
            return;
        }

        // 1. Failsafe para reintegrar / reactivar trabajadores si Gemini omitió el tool call
        const reinstateMatch = userLower.match(/(?:reintegra|reactiva|reincorporar|volver\s+a\s+contratar|pasa\s+a\s+activo)\s+(?:al\s+trabajador\s+|a\s+)?([a-zñáéíóú\s]+)/i);
        if (reinstateMatch && reinstateMatch[1]) {
            const workerTarget = reinstateMatch[1].replace(/\b(por\s+favor|ya|que|lo|la|le)\b/gi, '').trim();
            if (workerTarget.length >= 3) {
                logger.info(`[VoiceSession] [Tenshi Voice Failsafe] Gemini omitió toolCall! Disparando wappy_reintegrar_trabajador para "${workerTarget}"`);
                this.sendToClient({
                    type: 'wappy_action',
                    data: {
                        id: `failsafe-reinstate-${Date.now()}`,
                        name: 'wappy_reintegrar_trabajador',
                        args: { idOrCedula: workerTarget, nombre: workerTarget }
                    }
                });
                return;
            }
        }

        // 2. Failsafe para clics en 'Generar IA' / 'Generar Análisis' si Gemini omitió el tool call
        const clickAnalyzeMatch = /(?:dale\s+clic|haz\s+clic|pulsa|presiona|genera|generar|regenera|regenerar)\s+(?:en\s+|el\s+)?(?:bot[oó]n\s+)?(?:de\s+)?(?:generar\s+)?(?:an[aá]lisis|informe|ia)/i.test(userLower) ||
            /^(?:dale\s+clic\s+t[uú]|hazlo\s+t[uú]|dale\s+clic)$/i.test(userLower);
        if (clickAnalyzeMatch) {
            logger.info(`[VoiceSession] [Tenshi Voice Failsafe] Gemini omitió toolCall! Disparando operar_interfaz_visual con click a "Generar IA"`);
            this.sendToClient({
                type: 'wappy_action',
                data: {
                    id: `failsafe-click-${Date.now()}`,
                    name: 'operar_interfaz_visual',
                    args: { accion: 'click', texto: 'Generar IA' }
                }
            });
            return;
        }

        // 3. Detección de intención EXPLÍCITA del usuario para abrir chat o consultar un agente especialista
        const explicitAgentCommand = /(abre|abrir|abreme|inicia|iniciar|crea|crear|p[aá]same|cambia|cambiar|ll[eé]vame)\s+(un\s+)?(chat|conversaci[oó]n)?\s*(con|al|a)\s+/i;
        const consultCommand = /(?:intenta\s+ahora\s+)?(preg[uú]ntale|p[ií]dele|dile|consulta|cons[uú]ltale)\s+(?:tambi[eé]n\s+)?(a|al|con)?\s*(el|la)?\s*/i;

        let matchedAgent = null;

        // Soporte multi-turno: Si en el turno anterior el usuario pidió un especialista y ahora formula la pregunta
        if (this.pendingAgentForConsultation && (Date.now() - (this.pendingAgentTimestamp || 0) < 90000)) {
            const isFollowUpQuestion = /^(preg[uú]ntale|pregunta|dile|consulta|que qu[eé]|qu[eé]|c[oó]mo|cu[aá]l|cu[aá]ndo|por\s+qu[eé]|si|sobre|acerca de)\b/i.test(userLower);
            if (isFollowUpQuestion || consultCommand.test(userLower) || (userText.length >= 10 && !isConversationalCheck)) {
                matchedAgent = this.pendingAgentForConsultation;
                logger.info(`[VoiceSession] [Tenshi Voice Failsafe] Multi-turn match: Usando especialista solicitado en turno anterior "${matchedAgent}".`);
            }
        }

        if (!matchedAgent && (explicitAgentCommand.test(userLower) || consultCommand.test(userLower))) {
            const textToInspect = userLower;
            if (/fisioterap|biomec|ergonom|owas|rula|rosa|postur|puesto.*trabajo|dme|músculo|musculo|epicondilitis|tenista|carpo|manguito/i.test(textToInspect)) {
                matchedAgent = 'fisioterapeuta_laboral';
            } else if (/abogado.*rit|reglamento interno.*rit/i.test(textToInspect)) {
                matchedAgent = 'abogado_rit';
            } else if (/debido proceso|proceso disciplinario|descargo/i.test(textToInspect)) {
                matchedAgent = 'abogado_procesos_disciplinarios';
            } else if (/acoso sexual|ley 2365/i.test(textToInspect)) {
                matchedAgent = 'abogado_acoso_sexual';
            } else if (/abogad|jur[ií]dic|disciplinar|ley 1010|contrato|despido|rit|legal|decreto 1072/i.test(textToInspect)) {
                matchedAgent = 'abogado_laboral';
            } else if (/m[eé]dic|doctor|salud ocupacional|restricci[oó]n|ausentism|epidemiol/i.test(textToInspect)) {
                matchedAgent = 'medico_laboral';
            } else if (/qu[ií]mic|sga|fds|hds|sustancia|derrame|hoja.*seguridad/i.test(textToInspect)) {
                matchedAgent = 'ingeniero_quimico_sst';
            } else if (/seguridad vial|vial|pesv|tr[aá]nsito|conductor|veh[ií]cul/i.test(textToInspect)) {
                matchedAgent = 'coordinador_seguridad_vial';
            } else if (/psic[oó]log|psicosocial|bater[ií]a|acoso|clima/i.test(textToInspect)) {
                matchedAgent = 'psicologo_sst';
            } else if (/salud mental|burnout|emocional|terapeuta/i.test(textToInspect)) {
                matchedAgent = 'terapeuta_salud_mental';
            } else if (/nutrici[oó]n|dieta|aliment|cardiovascular/i.test(textToInspect)) {
                matchedAgent = 'nutricionista_laboral';
            } else if (/primer respondiente|primeros auxilios|rcp|botiqu[ií]n|hemorragia/i.test(textToInspect)) {
                matchedAgent = 'primer_respondiente';
            } else if (/emergencia|brigada|simulacro|pae|evacuaci[oó]n/i.test(textToInspect)) {
                matchedAgent = 'coordinador_emergencias';
            } else if (/bioseguridad|biol[oó]gic|vacun|pgirh/i.test(textToInspect)) {
                matchedAgent = 'especialista_bioseguridad';
            } else if (/el[eé]ctric|retie|loto|arco el[eé]ctrico/i.test(textToInspect)) {
                matchedAgent = 'ingeniero_electricista_sst';
            } else if (/\bats\b|an[aá]lisis de trabajo seguro/i.test(textToInspect)) {
                matchedAgent = 'asistente_ats';
            } else if (/permiso.*tsa|permiso.*alturas|permiso de trabajo/i.test(textToInspect)) {
                matchedAgent = 'asistente_permiso_tsa';
            } else if (/tareas cr[ií]ticas|alturas|espacios confinados|caliente|excavaci[oó]n/i.test(textToInspect)) {
                matchedAgent = 'coordinador_tareas_criticas';
            } else if (/minas|miner[ií]a|subterr[aá]nea|t[uú]nel/i.test(textToInspect)) {
                matchedAgent = 'ingeniero_minas_sst';
            } else if (/ipevar|gtc.*45|matriz de peligro/i.test(textToInspect)) {
                matchedAgent = 'coordinador_ipevar';
            } else if (/creador.*formato|formatos sst|plantilla sst/i.test(textToInspect)) {
                matchedAgent = 'creador_formatos';
            } else if (/\baci\b|or[aá]culo.*aci|predictivo aci/i.test(textToInspect)) {
                matchedAgent = 'asistente_de_aci';
            } else if (/auditor|0312|est[aá]ndares|phva/i.test(textToInspect)) {
                matchedAgent = 'auditor_sg_sst';
            } else if (/ambiental|residuos|vertimiento|ecol[oó]g/i.test(textToInspect)) {
                matchedAgent = 'ingeniero_ambiental';
            } else if (/clim[aá]tic|estr[eé]s t[eé]rmico|radiaci[oó]n|uv/i.test(textToInspect)) {
                matchedAgent = 'especialista_riesgo_climatico';
            } else if (/redactor|blog|art[ií]culo/i.test(textToInspect)) {
                matchedAgent = 'redactor_creativo';
            } else if (/simulador|siniestro|accidente|causa ra[ií]z/i.test(textToInspect)) {
                matchedAgent = 'simulador_accidentes';
            } else if (/capacitaci[oó]n|pac|inducci[oó]n/i.test(textToInspect)) {
                matchedAgent = 'coordinador_capacitaciones';
            } else if (/profesional sst/i.test(textToInspect)) {
                matchedAgent = 'profesional_sst';
            } else if (/consultor sst|asesor sst/i.test(textToInspect)) {
                matchedAgent = 'agente_sst';
            }

            // Fallback a especialista activo en pantalla si la consulta fue contextual
            if (!matchedAgent && this.activeScreenAgent) {
                const screenAgentName = (this.activeScreenAgent.name || '').toLowerCase();
                logger.info(`[VoiceSession] [Tenshi Voice Failsafe] Usando especialista activo en pantalla: "${this.activeScreenAgent.name}"`);
                if (/fisioterap|ergonom|biomec/i.test(screenAgentName)) matchedAgent = 'fisioterapeuta_laboral';
                else if (/abogad.*rit|reglamento.*rit/i.test(screenAgentName)) matchedAgent = 'abogado_rit';
                else if (/disciplinario|descargo/i.test(screenAgentName)) matchedAgent = 'abogado_procesos_disciplinarios';
                else if (/acoso.*sexual/i.test(screenAgentName)) matchedAgent = 'abogado_acoso_sexual';
                else if (/abogad|jur[ií]dic|laboral/i.test(screenAgentName)) matchedAgent = 'abogado_laboral';
                else if (/m[eé]dic|salud.*ocupacional/i.test(screenAgentName)) matchedAgent = 'medico_laboral';
                else if (/qu[ií]mic/i.test(screenAgentName)) matchedAgent = 'ingeniero_quimico_sst';
                else if (/vial|pesv/i.test(screenAgentName)) matchedAgent = 'coordinador_seguridad_vial';
                else if (/psic[oó]log/i.test(screenAgentName)) matchedAgent = 'psicologo_sst';
                else if (/salud.*mental|burnout/i.test(screenAgentName)) matchedAgent = 'terapeuta_salud_mental';
                else if (/nutrici[oó]n/i.test(screenAgentName)) matchedAgent = 'nutricionista_laboral';
                else if (/primer.*respondiente/i.test(screenAgentName)) matchedAgent = 'primer_respondiente';
                else if (/emergencia|brigada/i.test(screenAgentName)) matchedAgent = 'coordinador_emergencias';
                else if (/bioseguridad/i.test(screenAgentName)) matchedAgent = 'especialista_bioseguridad';
                else if (/el[eé]ctric/i.test(screenAgentName)) matchedAgent = 'ingeniero_electricista_sst';
                else if (/\bats\b/i.test(screenAgentName)) matchedAgent = 'asistente_ats';
                else if (/alturas|tsa/i.test(screenAgentName)) matchedAgent = 'asistente_permiso_tsa';
                else if (/cr[ií]ticas/i.test(screenAgentName)) matchedAgent = 'coordinador_tareas_criticas';
                else if (/minas/i.test(screenAgentName)) matchedAgent = 'ingeniero_minas_sst';
                else if (/ipevar|gtc.*45/i.test(screenAgentName)) matchedAgent = 'coordinador_ipevar';
                else if (/formato/i.test(screenAgentName)) matchedAgent = 'creador_formatos';
                else if (/auditor|0312/i.test(screenAgentName)) matchedAgent = 'auditor_sg_sst';
                else if (/ambiental/i.test(screenAgentName)) matchedAgent = 'ingeniero_ambiental';
                else if (/clim[aá]tic/i.test(screenAgentName)) matchedAgent = 'especialista_riesgo_climatico';
                else if (/redactor/i.test(screenAgentName)) matchedAgent = 'redactor_creativo';
                else if (/simulador/i.test(screenAgentName)) matchedAgent = 'simulador_accidentes';
                else if (/capacitaci/i.test(screenAgentName)) matchedAgent = 'coordinador_capacitaciones';
                else if (/profesional.*sst/i.test(screenAgentName)) matchedAgent = 'profesional_sst';
                else matchedAgent = this.activeScreenAgent.name;
            }
        }

        if (matchedAgent) {
            // Extraer la pregunta o consulta técnica formulada por el usuario
            let pregunta = '';
            const qMatch = userText.match(/(?:(?:intenta\s+ahora\s+)?(?:preg[uú]ntale|pregunta|dile|p[ií]dele|cons[uú]ltale)\s+(?:tambi[eé]n\s+)?(?:a\s+[^\s]+\s+)?(?:que\s+|qu[eé]\s+)?|sobre\s+|acerca de\s+|para\s+)(.+)/i);
            if (qMatch && qMatch[1] && qMatch[1].trim().length >= 3) {
                pregunta = qMatch[1].trim();
            } else if (this.pendingAgentForConsultation && userText.length >= 5 && !isConversationalCheck) {
                pregunta = userText.trim();
            }

            if (pregunta) {
                pregunta = pregunta
                    .replace(/^(?:a\s+la\s+gente|al\s+agente|al\s+doctor|al\s+m[eé]dico|al\s+abogado|al\s+especialista)\s+(?:laboral\s+|m[eé]dico\s+|sst\s+)?(?:que\s+)?/i, '')
                    .replace(/^que\s+(qu[eé]|c[oó]mo|cu[aá]ndo|d[oó]nde|por\s+qu[eé]|si)\s+/i, '$1 ')
                    .trim();
                if (/^haga\b/i.test(pregunta)) {
                    pregunta = pregunta.replace(/^haga\b/i, 'Por favor elabora');
                }
            }

            // Si el usuario pidió un especialista sin dar la pregunta concreta, guardar y esperar al siguiente turno
            if (!pregunta) {
                logger.info(`[VoiceSession] [Tenshi Voice Failsafe] User asked to open agent "${matchedAgent}" without a query. Storing pending agent for next turn.`);
                this.pendingAgentForConsultation = matchedAgent;
                this.pendingAgentTimestamp = Date.now();
                return;
            }

            // Estructuración profesional obligatoria de la consulta técnica según Regla 6
            const cleanDelegatedPrompt = enrichTechnicalPrompt(pregunta, matchedAgent);

            const requestedNewChat = Boolean(
                /\b(nuevo\s+chat|nueva\s+conversaci[oó]n|otro\s+chat|desde\s+cero|otro\s+tema|distinto|cambia\s+de\s+agente|cambiemos)\b/i.test(userLower)
            );

            this.pendingAgentForConsultation = null;
            logger.info(`[VoiceSession] [Tenshi Voice Failsafe] Gemini omitted toolCall! Dispatching wappy_abrir_chat_agente: ${matchedAgent}, nuevo_chat: ${requestedNewChat}, pregunta: "${cleanDelegatedPrompt.substring(0, 60)}..."`);
            this.sendToClient({
                type: 'wappy_action',
                data: {
                    id: `failsafe-agent-${Date.now()}`,
                    name: 'wappy_abrir_chat_agente',
                    args: {
                        agente: matchedAgent,
                        pregunta: cleanDelegatedPrompt,
                        nuevo_chat: requestedNewChat
                    }
                }
            });
            return;
        }

        // 2. Detección de creación EXPLÍCITA de Prototipos / Landing Pages / Canvas omitidos por Gemini
        // NUNCA disparar por menciones accidentales de "resumen" o contexto interno
        const isExplicitCanvasCreate = /\b(crea|crear|genera|generar|haz|hazme|diseña|diseñame|despliega|desplegar|abrir|abre)\s+(un\s+|una\s+)?(canvas|landing\s*page|prototipo|aplicativo|documento\s+en\s+canvas)\b/i.test(userLower);
        const aiClaimedCreation = /(cre[eé]\s+y\s+desplegu[eé]|ya\s+gener[eé]\s+la\s+landing|aqu[ií]\s+tienes\s+la\s+landing|en\s+pantalla\s+la\s+landing|desplegado\s+como\s+landing)/i.test(currentAiText);

        if (isExplicitCanvasCreate || (aiClaimedCreation && isExplicitCanvasCreate)) {
            logger.info(`[VoiceSession] [Tenshi Voice Failsafe] Detected Canvas/Landing Page generation omitted by Gemini Live. Executing canvas_tool...`);
            let fileType = 'text';
            let title = 'Resumen Ejecutivo SG-SST';
            if (/landing|prototipo|aplicativo|p[aá]gina|html/i.test(userLower)) {
                fileType = 'html';
                title = 'Landing Page Interactiva SG-SST';
            } else if (/excel|matriz|c[aá]lculo|hoja de c[aá]lculo/i.test(userLower)) {
                fileType = 'excel';
                title = 'Matriz de Datos SG-SST';
            } else if (/word|informe.*escrito|documento|protocolo|canva/i.test(userLower)) {
                fileType = 'text';
                title = 'Documento SG-SST';
            }

            const promptToUse = userText || 'Documento técnico y normativo de SG-SST';
            this.executeCanvasTool({
                accion: 'crear',
                fileType,
                title,
                content: promptToUse
            }, promptToUse).catch(err => {
                logger.error('[VoiceSession] [Tenshi Voice Failsafe] Error executing canvas_tool failsafe:', err);
            });
            return;
        }

        // 3. Detección de intención EXPLÍCITA de navegación del usuario
        const explicitNavRegex = /^(ll[eé]vame|vamos|abre|abrir|ir a|ir al|mu[eé]strame|ver|consultar|quiero ver)\s+/i;
        if (explicitNavRegex.test(userLower)) {
            let targetModulo = null;
            let targetRuta = null;

            if (/admin.*curso|gesti[oó]n.*curso|administrar curso/i.test(userLower)) {
                targetModulo = 'training_admin';
                targetRuta = '/training/admin';
            } else if (/admin.*ruta|administrar ruta/i.test(userLower)) {
                targetModulo = 'ruta_admin';
                targetRuta = '/ruta-aprendizaje/admin';
            } else if (/admin.*evento|admin.*meet/i.test(userLower)) {
                targetModulo = 'events_meet_admin';
                targetRuta = '/events-meet/admin';
            } else if (/evento|clase en vivo|meet/i.test(userLower)) {
                targetModulo = 'events_meet';
                targetRuta = '/events-meet';
            } else if (/admin.*blog|crear art[ií]culo|nuevo art[ií]culo/i.test(userLower)) {
                targetModulo = 'blog_admin';
                targetRuta = '/blog/admin';
            } else if (/admin.*tenshi|panel tenshi/i.test(userLower)) {
                targetModulo = 'tenshi_admin';
                targetRuta = '/tenshi/admin';
            } else if (/chat.*sst|chat sst/i.test(userLower)) {
                targetModulo = 'chat_sst';
                targetRuta = '/chat-sst';
            } else if (/dashboard.*[aá]nimo|anal[ií]tica.*[aá]nimo/i.test(userLower)) {
                targetModulo = 'animo_dashboard';
                targetRuta = '/sgsst/animo';
            } else if (/hoja de ruta|roadmap/i.test(userLower)) {
                targetModulo = 'roadmap';
                targetRuta = '/hoja-de-ruta';
            } else if (/cont[aá]ctanos|contacto|soporte/i.test(userLower)) {
                targetModulo = 'contacto';
                targetRuta = '/contactanos';
            } else if (/comunidad/i.test(userLower)) {
                targetModulo = 'comunidad';
                targetRuta = '/comunidad';
            } else if (/embajador/i.test(userLower)) {
                targetModulo = 'embajadores';
                targetRuta = '/embajadores';
            } else if (/matriz\b/i.test(userLower)) {
                targetModulo = 'matriz';
                targetRuta = '/matriz';
            } else if (/academia|curso/i.test(userLower)) {
                targetModulo = 'academia';
                targetRuta = '/academia?tab=cursos';
            } else if (/blog/i.test(userLower)) {
                targetModulo = 'blog';
                targetRuta = '/blog';
            } else if (/planes|precios|suscripci[oó]n|tarifas/i.test(userLower)) {
                targetModulo = 'planes';
                targetRuta = '/planes';
            } else if (/pesv|seguridad vial|veh[ií]culos/i.test(userLower)) {
                targetModulo = 'vehicles_pesv';
                targetRuta = '/sgsst?hito=hito4&module=vehicles_pesv';
            } else if (/qu[ií]mica|sga|compatibilidad/i.test(userLower)) {
                targetModulo = 'chemical_registry';
                targetRuta = '/sgsst?hito=hito4&module=chemical_registry';
            } else if (/diagn[oó]stico|evaluaci[oó]n inicial|0312/i.test(userLower)) {
                targetModulo = 'diagnostico';
                targetRuta = '/sgsst?hito=hito1&module=diagnostico';
            } else if (/responsable sst|asignaci[oó]n responsable/i.test(userLower)) {
                targetModulo = 'responsable';
                targetRuta = '/sgsst?hito=hito1&module=responsable';
            } else if (/pol[ií]tica sst|objetivos sst/i.test(userLower)) {
                targetModulo = 'politica';
                targetRuta = '/sgsst?hito=hito1&module=politica';
            } else if (/matriz legal|requisitos legales/i.test(userLower)) {
                targetModulo = 'legal';
                targetRuta = '/sgsst?hito=hito1&module=legal';
            } else if (/reglamento|rhs|higiene/i.test(userLower)) {
                targetModulo = 'rhs';
                targetRuta = '/sgsst?hito=hito1&module=rhs';
            } else if (/vulnerabilidad|plan.*emergencia/i.test(userLower)) {
                targetModulo = 'vulnerabilidad';
                targetRuta = '/sgsst?hito=hito1&module=vulnerabilidad';
            } else if (/perfil.*cargo|profesigrama/i.test(userLower)) {
                targetModulo = 'perfil_cargo';
                targetRuta = '/sgsst?hito=hito2&module=perfil_cargo';
            } else if (/sociodemogr[aá]fico|perfil socio/i.test(userLower)) {
                targetModulo = 'perfil_socio';
                targetRuta = '/sgsst?hito=hito2&module=perfil_socio';
            } else if (/condiciones de salud|ex[aá]menes m[eé]dicos/i.test(userLower)) {
                targetModulo = 'condiciones_salud';
                targetRuta = '/sgsst?hito=hito2&module=condiciones_salud';
            } else if (/participaci[oó]n ipevar|reportar peligro/i.test(userLower)) {
                targetModulo = 'participacion_ipevar';
                targetRuta = '/sgsst?hito=hito1&module=participacion_ipevar';
            } else if (/peligro|gtc.*45|ipevar/i.test(userLower)) {
                targetModulo = 'peligros';
                targetRuta = '/sgsst?hito=hito3&module=peligros';
            } else if (/permiso.*alturas|permiso.*tsa/i.test(userLower)) {
                targetModulo = 'permiso_alturas';
                targetRuta = '/sgsst?hito=hito4&module=permiso_alturas';
            } else if (/\bats\b|an[aá]lisis de trabajo seguro/i.test(userLower)) {
                targetModulo = 'analisis_trabajo_seguro';
                targetRuta = '/sgsst?hito=hito4&module=analisis_trabajo_seguro';
            } else if (/m[eé]todo owas|owas|ergonom[ií]a laboral/i.test(userLower)) {
                targetModulo = 'metodo_owas';
                targetRuta = '/sgsst?hito=hito4&module=metodo_owas';
            } else if (/epp|entrega.*epp|dotaci[oó]n/i.test(userLower)) {
                targetModulo = 'epp_delivery';
                targetRuta = '/sgsst?hito=hito4&module=epp_delivery';
            } else if (/l[ií]nea de vida|ciclo.*altura|arn[eé]s/i.test(userLower)) {
                targetModulo = 'heights_lifecycle';
                targetRuta = '/sgsst?hito=hito4&module=heights_lifecycle';
            } else if (/capacitaci[oó]n|pac|programa capacitaci[oó]n/i.test(userLower)) {
                targetModulo = 'capacitaciones';
                targetRuta = '/sgsst?hito=hito5&module=capacitaciones';
            } else if (/ruta.*aprendizaje|lms/i.test(userLower)) {
                targetModulo = 'ruta_aprendizaje';
                targetRuta = '/sgsst?hito=hito5&module=ruta_aprendizaje';
            } else if (/reporte de actos|condiciones inseguras/i.test(userLower)) {
                targetModulo = 'reporte_actos';
                targetRuta = '/sgsst?hito=hito5&module=reporte_actos';
            } else if (/app.*builder|constructor.*app|micro.*app/i.test(userLower)) {
                targetModulo = 'app_builder';
                targetRuta = '/sgsst?hito=hito5&module=app_builder';
            } else if (/estad[ií]sticas|indicadores atel/i.test(userLower)) {
                targetModulo = 'estadisticas';
                targetRuta = '/sgsst?hito=hito6&module=estadisticas';
            } else if (/investigaci[oó]n.*accidente|[aá]rbol de causas/i.test(userLower)) {
                targetModulo = 'investigacion_atel';
                targetRuta = '/sgsst?hito=hito6&module=investigacion_atel';
            } else if (/alta direcci[oó]n|revisi[oó]n gerencial/i.test(userLower)) {
                targetModulo = 'alta_direccion';
                targetRuta = '/sgsst?hito=hito6&module=alta_direccion';
            } else if (/investigaci[oó]n profunda/i.test(userLower)) {
                targetModulo = 'investigacion_profunda';
                targetRuta = '/sgsst?hito=hito6&module=investigacion_profunda';
            } else if (/auditor[ií]a/i.test(userLower)) {
                targetModulo = 'auditoria';
                targetRuta = '/auditoria';
            } else if (/predictivo|or[aá]culo/i.test(userLower)) {
                targetModulo = 'predictivo';
                targetRuta = '/sgsst?hito=hito7&module=predictivo';
            } else if (/videollamada|c[aá]mara|en vivo/i.test(userLower)) {
                targetModulo = 'live';
                targetRuta = '/live';
            } else if (/agentes|mercado|cat[aá]logo/i.test(userLower)) {
                targetModulo = 'agents';
                targetRuta = '/agents';
            } else if (/control|kanban|acpm/i.test(userLower)) {
                targetModulo = 'control_acpm';
                targetRuta = '/sgsst/control';
            }

            if (targetModulo) {
                logger.info(`[VoiceSession] [Tenshi Voice Failsafe] Gemini omitted nav tool call. Dispatching wappy_navegar: ${targetModulo}`);
                this.sendToClient({
                    type: 'wappy_action',
                    data: {
                        id: `failsafe-nav-${Date.now()}`,
                        name: 'wappy_navegar',
                        args: {
                            modulo: targetModulo,
                            ruta: targetRuta
                        }
                    }
                });
            }
        }
    }

    async saveCurrentTurn(source = 'Unknown') {
        const currentUserText = this.userTranscriptionText;
        const currentAiText = this.aiResponseText;
        const currentAudioCount = this.aiAudioChunkCount;

        if (!currentUserText.trim() && !currentAiText.trim() && currentAudioCount === 0) {
            return;
        }

        // On Disconnect, do not save if the AI never started responding (to avoid saving partial/unanswered fragments)
        if (source === 'Disconnect' && !currentAiText.trim() && currentAudioCount === 0) {
            logger.info(`[VoiceSession] [${source}] Discarding unanswered user transcription fragment to prevent chat clutter: "${currentUserText}"`);
            this.userTranscriptionText = '';
            this.aiResponseText = '';
            this.aiAudioChunkCount = 0;
            return;
        }

        // MODO TENSHI: Copiloto oficial en ventana flotante/widget.
        // NUNCA crear conversaciones en LibreChat sidebar (Conversation collection).
        // Pero SÍ persistir en el modelo TenshiMessage para que el widget mantenga su historial sincronizado.
        if (this.config.mode === 'tenshi_voice') {
            logger.info(`[VoiceSession] [Tenshi Voice] Turn completed (${source}). User: "${currentUserText}", AI: "${currentAiText}"`);
            this.handleTenshiVoiceFailsafe(currentUserText, currentAiText);

            try {
                const TenshiMessage = require('~/models/TenshiMessage');
                if (this.userId) {
                    if (currentUserText && currentUserText.trim() && !/^\[SISTEMA INTERNO WAPPY/i.test(currentUserText)) {
                        TenshiMessage.create({
                            user: this.userId,
                            role: 'user',
                            content: currentUserText.trim(),
                        }).catch(err => logger.error('[VoiceSession] Error saving Tenshi user message:', err));
                    }
                    if (currentAiText && currentAiText.trim()) {
                        TenshiMessage.create({
                            user: this.userId,
                            role: 'assistant',
                            content: currentAiText.trim(),
                        }).catch(err => logger.error('[VoiceSession] Error saving Tenshi assistant message:', err));
                    }
                }
            } catch (err) {
                logger.error('[VoiceSession] Failed to persist Tenshi voice turn to TenshiMessage:', err);
            }

            this.userTranscriptionText = '';
            this.aiResponseText = '';
            this.aiTranscriptionBuffer = '';
            this.aiAudioChunkCount = 0;
            return;
        }

        logger.info(`[VoiceSession] [${source}] Saving pending turn. User: "${currentUserText}", AI: "${currentAiText}", Audio chunks: ${currentAudioCount}`);

        // Reset text and chunk count IMMEDIATELY to prevent multiple saves/race conditions
        this.userTranscriptionText = '';
        this.aiResponseText = '';
        this.aiAudioChunkCount = 0;

        let messagesSaved = false;
        let isNewConversation = false;

        // FASE FAST-TRACK: TRIGGER REPORT GENERATION (Second Brain) IMMEDIATELY
        const currentTurnContext = `Usuario: ${currentUserText}\nAsistente: ${currentAiText}`;
        if (!this.conversationTurns) {
            this.conversationTurns = [];
        }
        this.conversationTurns.push(currentTurnContext);
        // Ventana deslizante: mantener solo los últimos 6 turnos en memoria activa
        if (this.conversationTurns.length > 6) {
            this.conversationTurns.shift();
        }
        this.config.conversationContext = this.conversationTurns.join('\n');

        if (this.isGeneratingReport) {
            logger.info('[VoiceSession] Report generation already in progress. Skipping trigger.');
            this.aiTranscriptionBuffer = '';
        } else {
            // Check BOTH user voice request (including common phonetic STT variations) AND AI keywords
            const userReportRegex = /\b(genera(r)?|haz|compil(a|ar)|dame|quiero|entreg(a|ar)|sacar?)\s+(el\s+|un\s+)?(informe|reporte)\b/i;
            const phoneticApproxRegex = /\b(general)\s+(el\s+|al\s+)?(informe|reporte)\b/i;
            // ONLY match current active compilation phrase, NEVER future promises ("voy a", "procedo a")
            const aiReportRegex = /\b(estoy\s+compilando|generando\s+el\s+informe\s+t[eé]cnico|informe técnico compilado y en pantalla)\b/i;

            const userRequested = userReportRegex.test(currentUserText) || phoneticApproxRegex.test(currentUserText);
            // Require at least 2 turns for AI keyword confirmation to prevent greeting false positives
            const aiConfirmed = (this.conversationTurns && this.conversationTurns.length >= 2) && (aiReportRegex.test(currentAiText) || aiReportRegex.test(this.aiTranscriptionBuffer));
            const shouldGenerateReport = userRequested || aiConfirmed;

            logger.info(`[VoiceSession] Report trigger check. userRequested: ${userRequested} ("${currentUserText}"), aiConfirmed: ${aiConfirmed}, trigger: ${shouldGenerateReport}`);
            this.aiTranscriptionBuffer = ''; // Reset for next turn

            if (shouldGenerateReport) {
                logger.info('[VoiceSession] Report generation triggered by user or AI keywords.');

                if (userRequested && this.geminiClient && this.isActive) {
                    try {
                        this.geminiClient.sendText('INSTRUCCIÓN DE SISTEMA: El usuario ha solicitado generar el informe técnico. Responde en 1 sola frase corta: "Entendido, estoy compilando tu informe técnico ergonómico con las evidencias recopiladas."');
                    } catch (speakErr) {
                        logger.warn('[VoiceSession] Could not send spoken confirmation:', speakErr.message);
                    }
                }
                
                this.sendToClient({
                    type: 'status',
                    data: { status: 'generating_report', message: 'Compilando informe técnico...' }
                });

                this.isGeneratingReport = true;
                this.generateReport(this.config.conversationContext).finally(() => {
                    this.isGeneratingReport = false;
                });
            }
        }

        // Save user message FIRST
        if (currentUserText.trim()) {
            let textToSave = currentUserText.trim();
            // Refine/correct transcription
            textToSave = await this.correctTranscription(textToSave, currentAiText.trim() || '🎤 [Respuesta de voz]');

            // Filter out isolated cut-off fragments (e.g. "¿Es", "y", "el") that aren't valid standalone utterances
            const stripped = textToSave.replace(/^[¿¡?!\s,.]+|[¿¡?!\s,.]+$/g, '').trim().toLowerCase();
            const validShortWords = new Set(['sí', 'si', 'no', 'ya', 'ok', 'va', 'voy', 'paz', 'fin']);
            const isInvalidFragment = stripped.length <= 3 && !validShortWords.has(stripped);

            if (!isInvalidFragment && textToSave.length > 0) {
                const result = await this.saveUserMessage(textToSave);
                if (result) {
                    messagesSaved = true;
                    isNewConversation = result.isNewConversation;
                }
            } else {
                logger.info(`[VoiceSession] Discarded short/cut-off user transcription fragment: "${textToSave}"`);
            }
        }

        // Save AI response AFTER user message
        if (currentAiText.trim()) {
            await this.saveAiMessage(currentAiText.trim());
            messagesSaved = true;
        } else if (currentAudioCount > 0) {
            await this.saveAiMessage('🎤 [Respuesta de voz]');
            messagesSaved = true;
        }

        if (messagesSaved) {
            try {
                await saveConvo({ user: { id: this.userId } }, {
                    conversationId: this.conversationId,
                    endpoint: this.dbEndpoint,
                    model: this.dbModel,
                    ...(this.config.mode === 'live_analysis' ? { tags: ['sgsst-live-analysis'] } : {})
                }, { context: `VoiceSession - ${source}` });

                if (isNewConversation) {
                    this.sendToClient({
                        type: 'conversationId',
                        data: { conversationId: this.conversationId }
                    });
                }

                this.sendToClient({
                    type: 'conversationUpdated',
                    data: { conversationId: this.conversationId }
                });
            } catch (error) {
                logger.error('[VoiceSession] Error updating conversation:', error);
            }
        }
    }

    async stop() {
        if (!this.isActive) return;
        this.isActive = false;

        logger.info(`[VoiceSession] Stopping session for user: ${this.userId}...`);

        try {
            await this.saveCurrentTurn('Disconnect');
        } catch (saveError) {
            logger.error('[VoiceSession] Error saving pending turn on stop:', saveError);
        }

        this.userTranscriptionText = '';
        this.aiResponseText = '';

        if (this.geminiClient) {
            try {
                this.geminiClient.disconnect();
            } catch (err) {
                logger.error('[VoiceSession] Error disconnecting geminiClient:', err);
            }
            this.geminiClient = null;
        }

        // Remove from active sessions
        if (activeSessions.has(this.userId)) {
            activeSessions.delete(this.userId);
        }

        logger.info(`[VoiceSession] Stopped for user: ${this.userId}`);
    }
}

/**
 * Create a new voice session for a user
 * @param {WebSocket} clientWs
 * @param {string} userId
 * @param {string} conversationId
 * @param {string|Object} configOrVoice - Initial voice name (string) or full config object
 */
async function createSession(clientWs, userId, conversationId, configOrVoice = null) {
    try {
        // Check if user already has active session
        if (activeSessions.has(userId)) {
            logger.warn(`[VoiceSession] User ${userId} already has active session`);
            const existingSession = activeSessions.get(userId);
            await existingSession.stop();
        }

        // Create session config
        let config = {};
        if (configOrVoice) {
            if (typeof configOrVoice === 'string') {
                config.voice = configOrVoice;
                logger.info(`[VoiceSession] Initializing with voice: ${configOrVoice} `);
            } else if (typeof configOrVoice === 'object') {
                config = configOrVoice;
                logger.info(`[VoiceSession] Initializing with custom config`);
            }
        }

        const isTenshi = config && (config.mode === 'tenshi_voice' || config.agentId === 'tenshi');

        let apiKey = null;
        if (isTenshi) {
            // 1. Prioridad: Claves exclusivas de Tenshi desde la base de datos
            try {
                apiKey = await getUserKey({ userId, name: 'tenshi_google' });
                if (apiKey) {
                    logger.info(`[VoiceSession] Usando claves API exclusivas de Tenshi (DB tenshi_google) para el usuario: ${userId}`);
                }
            } catch (tErr) {
                logger.debug(`[VoiceSession] No se encontró clave exclusiva tenshi_google en DB: ${tErr.message}`);
            }

            // 2. Fallback: Clave exclusiva enviada por el cliente (localStorage)
            if (!apiKey && config.tenshiKey) {
                apiKey = config.tenshiKey;
                logger.info(`[VoiceSession] Usando claves API exclusivas de Tenshi (cliente localStorage) para el usuario: ${userId}`);
            }
        }

        // 3. Fallback general: Clave de Google del chat
        if (!apiKey) {
            apiKey = await getUserKey({ userId, name: EModelEndpoint.google });
            if (isTenshi) {
                logger.warn(`[VoiceSession] Tenshi Voice usando claves generales de Google (EModelEndpoint.google) por no tener claves exclusivas.`);
            }
        }

        if (!apiKey) {
            throw new Error('Google API Key not configured');
        }

        // Parse API key if stored as JSON
        let parsedKey = apiKey;
        try {
            const parsed = JSON.parse(apiKey);
            parsedKey = parsed.GOOGLE_API_KEY || parsed;
        } catch (e) {
            // Key is not JSON, use as-is
        }

        if (!parsedKey) {
            throw new Error('Google API Key not configured');
        }

        // Split by comma for rotation support
        const apiKeys = typeof parsedKey === 'string' ? parsedKey.split(',').map(k => k.trim()).filter(Boolean) : [parsedKey];

        if (apiKeys.length === 0) {
            throw new Error('No valid Google API Keys found after parsing');
        }

        // MODO TENSHI VOICE: Orquestadora oficial de WAPPY IA con control de plataforma
        if (config.mode === 'tenshi_voice') {
            logger.info(`[VoiceSession] Initializing Tenshi Voice Mode (Orchestrator, platform control enabled)`);
            const agentObj = {
                id: 'tenshi',
                name: 'Tenshi',
                instructions: 'Orquestadora y Guía Oficial de WAPPY IA'
            };
            const session = new VoiceSession(clientWs, userId, apiKeys, config, conversationId);
            session.agentObj = agentObj;
            session.isBiomechanics = false;
            session.agentProtocol = { id: 'tenshi', title: 'Tenshi Orquestadora', methodLabel: 'Orquestación WAPPY' };

            const result = await session.start();

            if (result.success) {
                activeSessions.set(userId, session);
                return { success: true, session };
            } else {
                return { success: false, error: result.error };
            }
        }

        // Load agent prompt/instructions if applicable
        let agentId = config.agentId;
        if (!agentId && conversationId && conversationId !== 'new') {
            try {
                const { getConvo } = require('~/models');
                const convo = await getConvo({ user: userId }, conversationId);
                if (convo && convo.agent_id) {
                    agentId = convo.agent_id;
                }
            } catch (convoError) {
                logger.error('[VoiceSession] Error loading conversation details:', convoError);
            }
        }

        let agentObj = null;
        if (agentId) {
            try {
                const { getAgent } = require('~/models/Agent');
                agentObj = await getAgent({ id: agentId });
                if (!agentObj) {
                    const { Agent } = require('~/db/models');
                    agentObj = await Agent.findOne({ $or: [{ id: agentId }, { _id: agentId }] }).lean();
                }
            } catch (agentError) {
                logger.error('[VoiceSession] Error loading agent details:', agentError);
            }
        }

        if (!agentObj) {
            try {
                const { Agent } = require('~/db/models');
                // Check if user is in biomechanics / fisioterapeuta mode or template
                const wantsBiomechanics = config.mode === 'live_analysis' || 
                                          config.template === 'biomecanico_mediapipe';
                if (wantsBiomechanics) {
                    agentObj = await Agent.findOne({
                        $or: [
                            { name: /biomec[aá]nic/i },
                            { name: /fisioterapeuta/i },
                            { name: /ergon/i }
                        ]
                    }).lean();
                }
            } catch (err) {
                logger.warn('[VoiceSession] Could not fallback find agent in DB:', err.message);
            }
        }

        // Bulletproof fallback: Load local markdown instructions if agentObj still lacks instructions
        if (!agentObj || !agentObj.instructions) {
            try {
                const fs = require('fs');
                const path = require('path');
                const fisioPath = path.resolve(process.cwd(), 'Agentes/Agentes Wappy/fisioterapeuta_laboral.md');
                if (fs.existsSync(fisioPath)) {
                    const content = fs.readFileSync(fisioPath, 'utf-8');
                    agentObj = {
                        name: 'Especialista en Biomecánica Laboral',
                        instructions: content,
                    };
                    logger.info('[VoiceSession] Successfully loaded Fisioterapeuta instructions from local markdown file');
                }
            } catch (mdErr) {
                logger.warn('[VoiceSession] Could not load markdown fallback:', mdErr.message);
            }
        }

        // Dynamic Inspection Protocol Resolution across all WAPPY Agent Families
        const agentProtocol = resolveInspectionProtocol(agentObj?.name || config.template || 'biomecanico');
        const isBiomechanics = agentProtocol.id === 'biomecanico' ||
            (agentObj && /biomec|fisioterapeuta|ergon|rosa|ipt/i.test(agentObj.name)) ||
            config.template === 'biomecanico_mediapipe';

        logger.info(`[VoiceSession] Live session configured with Agent: ${agentObj?.name || agentId || 'General'} (Protocol: ${agentProtocol.title}, isBiomechanics: ${isBiomechanics})`);

        // Load agent skills and clean core instructions
        const skillsContent = getAgentSkillsContent(agentObj, isBiomechanics);
        const cleanedInstructions = cleanAgentInstructions(agentObj?.instructions);

        // Build rich domain expertise based on agent's real knowledge and skills
        let domainKnowledge = '';
        if (isBiomechanics) {
            domainKnowledge = `
ROL: Eres el Fisioterapeuta Laboral y Especialista en Biomecánica de WAPPY IA.
PROPÓSITO:
Asesorar en vivo mediante visión artificial y voz en la prevención de desórdenes musculoesqueléticos, higiene postural y evaluación ergonómica integral de puestos de trabajo (oficinas, pantallas, teletrabajo o labores operativas).

DIRECTIVA DE LIDERAZGO ACTIVO Y EVALUACIÓN PASO A PASO (OBLIGATORIO):
No actúes como un chatbot pasivo que solo espera preguntas o suelta recomendaciones sueltas. TÚ DIRIGES LA EVALUACIÓN ERGONÓMICA EN CAMPO:
1. Toma el control desde tu primer saludo:
   - PASO PREVIO OBLIGATORIO (IDENTIFICACIÓN DEL TRABAJADOR Y PUESTO - ANTES DE INICIAR FASES):
     En tu primer turno, saluda con calidez y solicita en un solo mensaje fluido:
     "¡Hola! Soy tu Especialista en Ergonomía y Fisioterapeuta Laboral en WAPPY IA. Para vincular este estudio ergonómico al expediente oficial de la empresa, por favor confírmame:
      1. ¿Es una auto-evaluación de tu propio puesto o estás evaluando a un compañero?
      2. Nombre completo y número de cédula del trabajador evaluado.
      3. Cargo y una breve descripción de la actividad cotidiana a evaluar."
     REGLA ESTRICTA: NUNCA inicies el Paso 1 ni pidas adoptar posturas antes de recibir el nombre completo y cédula del trabajador. Si el usuario te responde solo el cargo o actividad sin su nombre o cédula, pídeselos amablemente antes de iniciar.
   - INICIO DE FASES (AL RECIBIR LA IDENTIFICACIÓN COMPLETA):
     Valida cordialmente en una sola frase breve (ej: "¡Perfecto! Expediente preparado para [Nombre del Trabajador]") y da inicio inmediato al Paso 1 llamando a 'cambiar_fase_evaluacion' con fase: 1.
   - REGLA DE ORO DE CAPTURA Y CAMBIO DE FASES (NO CAPTURAR SOLO):
     NUNCA asumas que la postura ya fue adoptada ni avances de fase por tu cuenta antes de tiempo. Para cada paso:
     1. Pide al usuario adoptar la postura correspondiente (Paso 1: Postura habitual digitando; Paso 2: Alcance crítico o tarea más exigente; Paso 3: Postura fatigada o soporte lumbar).
     2. Indica SIEMPRE al final de tu instrucción: "Cuando estés en la postura, avísame diciendo 'Listo', 'Ya' o presiona el botón de la cámara para registrarla."
     3. ESPERA OBLIGATORIAMENTE la confirmación del usuario ("Listo", "Ya", "Adelante", "Ya tomé la postura") o a que el sistema te notifique que el usuario tomó la foto con el botón de la cámara.
     4. Al recibir la confirmación o foto de evidencia, valida brevemente en 1 frase los grados medidos en la telemetría y guía la siguiente fase invocando 'cambiar_fase_evaluacion'.
2. En cada fase, utiliza la telemetría articular (grados de cuello, tronco, brazos) para darle retroalimentación en vivo sobre lo que ves.
3. Al culminar las 3 fases, ofrece compilar el informe técnico oficial e invoca 'generar_informe_tecnico' en cuanto el usuario lo apruebe.

EVALUACIÓN DE PUESTO DE TRABAJO (IPT / OFICINA / PANTALLAS):
Cuando el usuario te muestre su puesto de trabajo o solicite una inspección/evaluación de su puesto:
1. PANTALLA: Verifica que el borde superior esté a la altura de los ojos, a 50-70 cm de distancia (longitud de un brazo), centrada directamente al frente para no rotar el cuello.
2. SILLA: Verifica soporte lumbar, altura adecuada para que los pies descansen completamente planos en el piso con rodillas a 90°-100° (o necesidad de reposapiés), y apoyabrazos alineados con la mesa para descansar antebrazos.
3. TECLADO Y RATÓN: Verifica codos a 90° cerca del cuerpo, antebrazos apoyados y muñecas en posición neutra recta (sin flexión forzada ni extensión).
4. POSTURA DEL TRABAJADOR: Evalúa flexión de cuello, inclinación del tronco y relajación de hombros.

ÁRBOL DE DECISIÓN Y SELECCIÓN DE MÉTODOS ERGONÓMICOS:
- MÉTODO RULA y MÉTODO ROSA: Actívalos cuando el trabajo sea sentado, oficina, pantalla (PVD) o ensamble fino centrado en miembros superiores (cuello, hombros, brazos, muñecas) y mobiliario (silla, pantalla, teclado, mouse).
- MÉTODO REBA: Actívalo para labores de pie, con flexión de tronco profunda, manipulación de cargas o posturas forzadas de cuerpo completo.
- MÉTODO OWAS: Actívalo para labores dinámicas con alta variabilidad de posturas en ciclos de trabajo cambiantes.
- MODULADORES: Ecuación NIOSH para levantamiento repetido de cargas (>3 kg) y JSI/OCRA para movimientos repetitivos de muñeca (>30 acciones/min).

TELEMETRÍA ARTICULAR EN TIEMPO REAL (MEDIAPIPE):
- Cuello (Flexión cervical): Normal <15°, Alerta 15°-25°, Crítico >25°.
- Tronco (Flexión lumbar): Normal <10°, Alerta 10°-20°, Crítico >20°.
- Brazos (Abducción/Elevación): Normal <20°, Alerta 20°-45°, Crítico >45°.
- Codos y Rodillas: Rango neutro 90°-100°.
Explica oralmente y con claridad el hallazgo biomecánico observado en la cámara y cómo corregirlo físicamente de inmediato.

PAUTAS DE ENCUADRE Y MULTIFASE:
- Si el usuario usa portátil/webcam y se corta el cuerpo: Sugiérele amablemente inclinar un poco la pantalla a 45° o dar un paso atrás.
- Si un compañero está grabando con celular: Sugiérele ubicarse en plano lateral (perfil a 90°) a la altura de la cintura.
- CERO INTERROGATORIOS: No preguntes quién graba ni qué dispositivo usa ni hagas cuestionarios de empresa. Observa directamente y evalúa.

${cleanedInstructions ? `\nINSTRUCCIONES Y NORMATIVIDAD DEL AGENTE:\n${cleanedInstructions.substring(0, 1500)}\n` : ''}
GENERACIÓN DEL INFORME TÉCNICO: Cuando el usuario te pida generar, hacer o sacar el informe, reporte o resumen técnico ("haz el informe", "genera el informe", "dame el reporte", "quiero el informe"), DEBES INVOCAR la función 'generar_informe_tecnico'. Mientras se procesa, confirma en una sola frase breve: "Listo, procesando las evidencias bajo el método seleccionado para generar el informe técnico ergonómico." NUNCA invoques 'generar_informe_tecnico' durante el saludo inicial ni antes de evaluar los puestos.`;
        } else {
            domainKnowledge = `
ROL: Eres el asistente especialista "${agentObj?.name || agentProtocol.title}" de WAPPY IA.
ESPECIALIDAD TÉCNICA Y MARCO NORMATIVO: ${agentProtocol.methodLabel} (${agentProtocol.normRef}).
CAPACIDADES: Videollamada interactiva en vivo con visión artificial y auditoría técnica de campo asistida en tiempo real.

PAUTAS DE INSPECCIÓN:
${agentProtocol.framingGuidance}

FASES DE VERIFICACIÓN TÉCNICA:
${agentProtocol.phaseGuidance}

${skillsContent ? `\nCONOCIMIENTO DE SKILLS DEL AGENTE:\n${skillsContent}\n` : ''}
${cleanedInstructions ? `\nINSTRUCCIONES Y NORMATIVIDAD DEL AGENTE:\n${cleanedInstructions.substring(0, 3000)}\n` : `CRITERIOS TÉCNICOS: ${agentProtocol.title}`}`;
        }

        // Live interaction directives
        config.systemInstruction = `
${domainKnowledge}

[DIRECTIVAS DE INTERACCIÓN EN VIVO POR VOZ Y VIDEO]:
1. **IDIOMA EXCLUSIVO: ESPAÑOL.** El usuario y tú se comunican SIEMPRE en español de Colombia/Latinoamérica. NUNCA respondas, transcribas ni traduzcas en árabe, inglés ni ningún otro idioma. Todo lo que dice el usuario está en español.
2. **SALUDO INICIAL Y PASO PREVIO OBLIGATORIO (IDENTIFICACIÓN COMPLETA DEL TRABAJADOR):** En tu primera intervención saluda cordialmente y PREGUNTA de inmediato: "¿Es una auto-evaluación de tu propio puesto o evalúas a un compañero? Confírmame tu nombre completo, número de cédula, cargo y qué actividad principal realizas." NUNCA invoques herramientas de informe en el saludo y NUNCA pidas posturas en tu primer turno. Si el usuario no te da su nombre o cédula, insiste amablemente en pedirlos antes de pasar al Paso 1 para poder vincular el expediente oficial de la empresa.
3. **CONDUCE LA EVALUACIÓN TRAS EL CONTEXTO:** Una vez que el usuario te responda indicando su nombre, cédula, cargo y actividad, valida en una sola frase breve y entusiasta (ej: "¡Perfecto! Expediente preparado para [Nombre]") y da inicio al Paso 1 (Postura Habitual / Línea Base), invocando de inmediato la herramienta 'cambiar_fase_evaluacion' con fase: 1.
   **REGLA DE CAPTURA Y TRANSICIÓN:** En cada paso, explica la postura y solicita al usuario confirmar diciendo "Listo", "Ya" o pulsando el botón de la cámara. NUNCA avances de fase ni captures la imagen solo; espera siempre la confirmación del usuario ("Listo", "Ya", "Adelante") o el aviso del botón de captura antes de avanzar al siguiente paso.
4. **RETROALIMENTACIÓN BIOMECÁNICA PRECISA:** Menciona los ángulos articulares medidos en cámara (cuello, tronco, brazos) y brinda correcciones físicas inmediatas.
5. **CERO CUESTIONARIOS ADMINISTRATIVOS ADICIONALES:** Prohibido preguntar por ARL, tamaño de empresa o porcentajes de implementación. Limítate exclusivamente a preguntar cargo y actividad al inicio y luego concéntrate en la observación de campo.
6. **RESPUESTAS HABLADAS CONCISAS:** Respuestas habladas claras y pedagógicas (2 a 4 oraciones por turno). Sin formato Markdown ni HTML en voz.
7. **GENERACIÓN DE INFORME:** NUNCA generes el informe durante el saludo ni en los pasos 1 o 2. Solo debes invocar 'generar_informe_tecnico' al concluir las 3 fases O cuando el usuario te ordene explícitamente generar el informe ('haz el informe', 'genera el reporte', 'dame el informe').
`.trim();
        
        // Pass the array of keys to VoiceSession
        const session = new VoiceSession(clientWs, userId, apiKeys, config, conversationId);
        session.agentObj = agentObj;
        session.agentProtocol = agentProtocol;
        session.isBiomechanics = isBiomechanics;

        // Start session
        const result = await session.start();

        if (result.success) {
            activeSessions.set(userId, session);
            return { success: true, session };
        } else {
            return { success: false, error: result.error };
        }

    } catch (error) {
        logger.error('[VoiceSession] Error creating session:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get active session for user
 */
function getSession(userId) {
    return activeSessions.get(userId);
}

/**
 * Stop session for user
 */
async function stopSession(userId) {
    const session = activeSessions.get(userId);
    if (session) {
        await session.stop();
        return true;
    }
    return false;
}

module.exports = {
    VoiceSession,
    createSession,
    getSession,
    stopSession,
    activeSessions,
};
