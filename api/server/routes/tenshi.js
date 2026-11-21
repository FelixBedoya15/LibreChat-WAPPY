const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { requireJwtAuth } = require('../middleware');
const TenshiConfig = require('../../models/TenshiConfig');
const TenshiUserAvatar = require('../../models/TenshiUserAvatar');
const TenshiMessage = require('../../models/TenshiMessage');
const TenshiConversation = require('../../models/TenshiConversation');
const LiveDocument = require('../../models/LiveDocument');
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
const Automation = require('../../models/Automation');
const { syncCompanyMemory } = require('./sgsst/companyInfo');
const SomosSST = require('../../app/clients/tools/structured/SomosSST');
const GoogleDrive = require('../../app/clients/tools/structured/GoogleDrive');
const ConsultarAgenteEspecializado = require('../../app/clients/tools/structured/ConsultarAgenteEspecializado');
const CanvasTool = require('../../app/clients/tools/structured/CanvasTool');
const WebScraperLive = require('../../app/clients/tools/structured/WebScraperLive');
const BlogEditor = require('../../app/clients/tools/structured/BlogEditor');
const CanvasSession = require('../../models/CanvasSession');
const { getActiveSkillInstructions, getActiveSkillsData } = require('~/server/services/skillRouter');
const { resolveApiKeys } = require('./sgsst/sgsstGemini');
const { buildTenshiFlowsPromptBlock } = require('~/server/services/tenshiFlowService');
const { getLatestSystemActivity } = require('~/server/services/systemActivityService');
const { executeTenshiMcpTool, TOOL_ROUTES } = require('./voice/tenshiMcpDispatcher');
const {
    ALLOWED_TENSHI_MODELS,
    TENSHI_PANEL_TOOL_IDS,
    sanitizeRequestedTenshiModel,
    buildTenshiModelFallbacks,
    buildTenshiGenerationConfig,
    normalizeConnectorsObject,
    normalizeTenshiPanelToolId,
    selectTenshiTools,
    resolveSelectedNotebooks,
    buildNotebookLmPromptBlock,
    generateSmartTenshiTitle,
    buildCompanyScopeFilter,
    ensureLegacyTenshiConversation,
    evaluateSafeSstCalculator,
    isPureGreetingOrSmallTalk,
} = require('./voice/tenshiSessionHelpers');

const TENSHI_PANEL_TOOL_LABELS = {
    canvas: 'Canvas',
    navegador_wappy: 'Navegador Interno de WAPPY',
    editor_live: 'Editor de Documentos en Vivo',
    editor_rit: 'Editor del Reglamento Interno de Trabajo (RIT)',
    matriz_ipevar: 'Matriz de Peligros IPEVR (GTC-45)',
    matriz_pesv: 'Matriz de Riesgos Viales (PESV)',
    matriz_compatibilidad: 'Matriz de Compatibilidad Química (SGA)',
    consultar_analitica_psicosocial: 'Analítica Psicosocial y Clima Laboral',
    consultar_analitica_actos_condiciones: 'Analítica de Actos y Condiciones Inseguras',
    gestor_automatizaciones: 'Gestor de Automatizaciones y Flujos',
    wappy_investigar_trabajador_360: 'Investigador 360° de Trabajadores (OSINT)',
    blog_editor: 'Editor de Blog',
    generar_imagen_sst: 'Generador de Imágenes SST',
};

const PANEL_OPEN_VERB_REGEX =
    /\b(abre|abrir|ábreme|abreme|activa|activar|actívame|activame|muestra|muéstrame|muestrame|trae|tráeme|traeme|enseña|enséñame|ensename|despliega|pesta[nñ]a|panel)\b/i;

const PANEL_TOPIC_REGEX_MAP = {
    navegador_wappy: /\b(navegador(\s+interno|\s+de)?(\s+wappy)?|browser(\s+wappy)?|explorar\s+wappy|pesta[nñ]a\s+wappy)\b/i,
    editor_live: /\b(editor|live|liveeditor|documentos?\s+(en\s+)?vivo)\b/i,
    editor_rit: /\b(rit|reglamento(\s+interno)?)\b/i,
    matriz_ipevar: /\b(matriz|gtc[\s-]?45|ipevr|ipevar|peligros)\b/i,
    matriz_pesv: /\b(pesv|riesgos?\s+viales|seguridad\s+vial)\b/i,
    matriz_compatibilidad: /\b(compatibilidad|qu[ií]mic[oa]s?|sga)\b/i,
    consultar_analitica_psicosocial: /\b(psicosocial|[aá]nimo|clima\s+laboral|anal[ií]tica)\b/i,
    consultar_analitica_actos_condiciones: /\b(actos|condiciones|buz[oó]n|anal[ií]tica)\b/i,
    gestor_automatizaciones: /\b(panel|pesta[nñ]a|gestor|automatizaciones|tareas)\b/i,
    wappy_investigar_trabajador_360: /\b(investigador|osint|360|portales|investigar)\b/i,
    blog_editor: /\b(blog|art[ií]culos?|editor)\b/i,
};

function isExplicitPanelOpenUserIntent(userTextLower = '', canonicalPanelId = '') {
    const text = String(userTextLower || '').trim();
    if (!text || !PANEL_OPEN_VERB_REGEX.test(text)) {
        return false;
    }
    const topicRegex = PANEL_TOPIC_REGEX_MAP[canonicalPanelId];
    if (!topicRegex) {
        return false;
    }
    if (
        canonicalPanelId === 'gestor_automatizaciones' &&
        !/\b(abre|abrir|ábreme|abreme|muestra|muéstrame|muestrame|trae|tráeme|traeme|despliega|panel|pesta[nñ]a)\b/i.test(text)
    ) {
        return false;
    }
    return topicRegex.test(text);
}
const TenshiPendingAction = require('../../models/TenshiPendingAction');
const TenshiProceduralMemory = require('../../models/TenshiProceduralMemory');
const {
    isGovernedTool,
    stageGovernedAction,
    buildGenerativeWidgetForTool,
    manageProceduralMemory,
    getProceduralMemoryPromptBlock,
    autoSynthesizeProceduralRule,
    searchInstantHistory,
    searchNormativeKnowledgeBase,
} = require('./voice/tenshiOpenBotEngine');

let cachedWorkflowNodesDocsMod = null;
function safeGetWorkflowNodesOverviewPromptBlock() {
    try {
        if (!cachedWorkflowNodesDocsMod) {
            try {
                cachedWorkflowNodesDocsMod = require('~/server/services/workflowNodesDocumentationService');
            } catch (_) {
                cachedWorkflowNodesDocsMod = require('../services/workflowNodesDocumentationService');
            }
        }
        if (typeof cachedWorkflowNodesDocsMod?.getWorkflowNodesOverviewPromptBlock === 'function') {
            return String(cachedWorkflowNodesDocsMod.getWorkflowNodesOverviewPromptBlock() || '').trim();
        }
    } catch (_) {
        // Servicio en carga en frío; nunca lanzar excepción
    }
    return '';
}

function sanitizeSlug(title) {
    if (!title || typeof title !== 'string') return '';
    return title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');
}

async function findMatchingCourse(query) {
    if (!query || typeof query !== 'string') return null;
    const clean = query.trim();
    if (mongoose.isValidObjectId(clean)) {
        const byId = await Course.findById(clean).lean().catch(() => null);
        if (byId) return byId;
    }
    let searchTerm = clean;
    if (/\b(a\s*picar|a\s*pi\s*key|api\s*key)\b/i.test(searchTerm)) {
        searchTerm = 'api key';
    }
    const safeRegex = new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    let course = await Course.findOne({
        $or: [
            { title: safeRegex },
            { description: safeRegex },
            { 'lessons.title': safeRegex }
        ]
    }).lean().catch(() => null);
    if (course) return course;

    const words = searchTerm.split(/\s+/).filter(w => w.length > 3 && !['para', 'curso', 'sobre', 'este', 'como', 'facil', 'abrir', 'abre'].includes(w.toLowerCase()));
    for (const w of words) {
        const wordRegex = new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        course = await Course.findOne({
            $or: [{ title: wordRegex }, { 'lessons.title': wordRegex }]
        }).lean().catch(() => null);
        if (course) return course;
    }
    return null;
}

async function findMatchingBlogPost(query) {
    if (!query || typeof query !== 'string') return null;
    const clean = query.trim();
    if (mongoose.isValidObjectId(clean)) {
        const byId = await BlogPost.findById(clean).lean().catch(() => null);
        if (byId) return byId;
    }
    const safeRegex = new RegExp(clean.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    let post = await BlogPost.findOne({
        $or: [
            { title: safeRegex },
            { slug: safeRegex },
            { tags: safeRegex }
        ]
    }).lean().catch(() => null);
    if (post) return post;

    const words = clean.split(/\s+/).filter(w => w.length > 3 && !['para', 'post', 'blog', 'articulo', 'sobre'].includes(w.toLowerCase()));
    for (const w of words) {
        const wordRegex = new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        post = await BlogPost.findOne({ title: wordRegex }).lean().catch(() => null);
        if (post) return post;
    }
    return null;
}

function withGeminiTimeout(promise, timeoutMs = 19000, label = 'Gemini generateContent') {
    let timer = null;
    const safePromise = Promise.resolve(promise);
    // Evitar UnhandledPromiseRejection si Gemini rechaza después de vencer el timeout local
    safePromise.catch(() => {});
    const timeoutPromise = new Promise((_, reject) => {
        timer = setTimeout(() => {
            const err = new Error(`[Tenshi Timeout] ${label} superó ${timeoutMs}ms`);
            err.status = 504;
            err.isTimeout = true;
            reject(err);
        }, timeoutMs);
    });
    return Promise.race([
        safePromise.finally(() => clearTimeout(timer)),
        timeoutPromise,
    ]);
}

function extractVisualMediaOptions(rawText = '') {
    const text = String(rawText || '').trim();
    let aspectRatio = null;
    if (/\b(9\s*[:x×]\s*16|vertical|reel|stories|historia|tik\s*tok|shorts)\b/i.test(text)) {
        aspectRatio = '9:16';
    } else if (/\b(1\s*[:x×]\s*1|cuadrad[oa]|instagram\s+post)\b/i.test(text)) {
        aspectRatio = '1:1';
    } else if (/\b4\s*[:x×]\s*3\b/i.test(text)) {
        aspectRatio = '4:3';
    } else if (/\b3\s*[:x×]\s*4\b/i.test(text)) {
        aspectRatio = '3:4';
    } else if (/\b(16\s*[:x×]\s*9|horizontal|panor[aá]mic[oa]|widescreen)\b/i.test(text)) {
        aspectRatio = '16:9';
    }

    let style = null;
    if (/\b(afiche|p[oó]ster|poster|cartel|campa[ñn]a\s+de\s+seguridad|se[ñn]alizaci[oó]n|flyer)\b/i.test(text)) {
        style = 'afiche_seguridad';
    } else if (/\b(3d|render\s*3d|pixar|isom[eé]tric[oa]|voxel|chibi)\b/i.test(text)) {
        style = '3d_render';
    } else if (/\b(ilustraci[oó]n|ilustracion|diagrama|infograf[ií]a|vector|esquema|dibujo|caricatura|c[oó]mic)\b/i.test(text)) {
        style = 'ilustracion_tecnica';
    } else if (/\b(fotorrealista|realista|hiperrealista|fotograf[ií]a)\b/i.test(text)) {
        style = 'fotorrealista';
    }

    let cameraMotion = null;
    if (/\b(zoom\s*out|alej[aá]ndose|retroceso)\b/i.test(text)) {
        cameraMotion = 'zoom_out';
    } else if (/\b([oó]rbita|orbit|girando|360)\b/i.test(text)) {
        cameraMotion = 'orbit';
    } else if (/\b(pan\s*right|paneo\s+(?:a\s+la\s+)?derecha)\b/i.test(text)) {
        cameraMotion = 'pan_right';
    } else if (/\b(pan\s*left|paneo\s+(?:a\s+la\s+)?izquierda)\b/i.test(text)) {
        cameraMotion = 'pan_left';
    } else if (/\b(zoom\s*in|acerc[aá]ndose)\b/i.test(text)) {
        cameraMotion = 'zoom_in';
    }

    const skipAntigravity = /\b(sin\s+antigravity|solo\s+(?:con\s+)?(?:google\s+)?flow|directo\s+(?:en|con)\s+(?:google\s+)?flow)\b/i.test(text);
    const forceVideo = /\b(v[ií]deo|video|clip(?:\s+de\s+v[ií]deo)?|cortometraje)\b/i.test(text);
    const forceImage = /\b(im[aá]gen(?:es)?|foto(?:graf[ií]a)?|ilustraci[oó]n|afiche|p[oó]ster|poster|cartel|flyer|banner|infograf[ií]a|dibujo|render(?:\s*3d)?)\b/i.test(text);

    return {
        aspectRatio,
        style,
        cameraMotion,
        skipAntigravity,
        forceVideo,
        forceImage,
    };
}

function cleanVisualMediaPrompt(rawText = '') {
    const trimmed = String(rawText || '').trim();
    if (!trimmed) return '';

    let cleaned = trimmed
        .replace(/^[¿¡\s]+|[?!.\s]+$/g, '')
        .replace(
            /^(?:(?:por\s+favor|porfa(?:vor)?|porfis|oye|hola|tenshi|suri|me\s+puedes|puedes|podr[ií]as|quiero\s+que\s+(?:me\s+)?|necesito\s+que\s+(?:me\s+)?)\s*[,:]?\s*)+/i,
            ''
        )
        .replace(
            /^(?:(?:crea(?:me|r)?|cr[eé]ame|genera(?:me|r)?|gen[eé]rame|haz(?:me)?|h[aá]zme|hacer|dise[ñn]a(?:me|r)?|dis[eé][ñn]ame|dibuja(?:me|r)?|dib[uú]jame|ilustra(?:me|r)?|produce|renderiza(?:me|r)?|elabora(?:me|r)?|quiero|necesito|dame|reg[aá]lame)\s+(?:por\s+favor\s+|porfa\s+)?(?:(?:con|en|usando|por|v[ií]a)\s+(?:google\s+)?(?:antigravity|flow(?:\s+studio)?|imagen|veo|nano\s+banana)\s+)?)?(?:una?|un|el|la)?\s*(?:im[aá]gen(?:es)?|foto(?:graf[ií]a)?|ilustraci[oó]n|afiche|p[oó]ster|poster|cartel|flyer|banner|infograf[ií]a|dibujo|render(?:\s*3d)?|v[ií]deo|video|clip(?:\s+de\s+v[ií]deo)?|cortometraje|animaci[oó]n(?:\s+en\s+v[ií]deo)?)\s*(?:(?:con|en|usando|por|v[ií]a)\s+(?:google\s+)?(?:antigravity|flow(?:\s+studio)?|imagen|veo|nano\s+banana)\s*)*(?:(?:de|sobre|acerca\s+de|mostrando|donde|que\s+muestre|representando)\s+)?/i,
            ''
        )
        .replace(
            /\s*(?:(?:pero\s+)?(?:con|usando|en|por|v[ií]a|desde|solo\s+con)\s+(?:google\s+)?(?:antigravity|flow(?:\s+studio)?|nano\s+banana))\s*[.!?]*$/i,
            ''
        )
        .replace(/^[¿¡\s:,;-]+|[?!.\s]+$/g, '')
        .trim();

    if (cleaned.length < 4) {
        cleaned = trimmed.replace(/^[¿¡\s]+|[?!\s]+$/g, '').trim();
    }
    return cleaned;
}

function isExplicitVisualMediaRetryMessage(rawText = '') {
    const trimmed = String(rawText || '').trim();
    if (!trimmed || trimmed.length > 120) return false;
    if (
        /\b(arl|sura|positiva|bol[ií]var|colmena|axa|colpatria|simit|alturas|antecedentes|incapacidad|c[eé]dula|certificado|informe|reporte|matriz|flujo|trabajador|trabajadores|empresa|correo|drive|agenda|reuni[oó]n|curso|blog)\b/i.test(
            trimmed
        )
    ) {
        return false;
    }
    const retryModifier =
        '(?:nuevamente|de\\s+nuevo|otra\\s+vez|(?:pero\\s+|ahora\\s+)?(?:solo\\s+)?(?:con|usando|en|v[ií]a)\\s+(?:google\\s+)?(?:antigravity|flow(?:\\s+studio)?|vertical|horizontal|cuadrad[oa]|3d|afiche|p[oó]ster|poster|video|v[ií]deo|imagen|9\\s*:\\s*16|16\\s*:\\s*9|1\\s*:\\s*1))';
    const retryPattern = new RegExp(
        `^(?:(?:porfa(?:vor)?|por\\s+favor|tenshi|suri|oye)\\s*[,:]?\\s*)*(?:` +
            `(?:int[eé]ntal[oa]|intenta|vuelve\\s+a\\s+intentar(?:lo|la)?|reintenta(?:r|lo|la)?|prueba(?:lo|la)?|pru[eé]bal[oa]|hazl[oa]|h[aá]zmel[oa]|cr[eé]al[oa]|gen[eé]ral[oa]|dale|rep[ií]te(?:lo|la)?)` +
            `(?:\\s+(?:por\\s+favor|porfa))?(?:\\s+${retryModifier}){1,3}` +
            `|(?:reintenta(?:r|lo|la)?|vuelve\\s+a\\s+intentar(?:lo|la)?|otra\\s+vez|de\\s+nuevo|nuevamente|int[eé]ntal[oa])` +
            `|(?:(?:usa(?:ndo)?|con|hazl[oa]\\s+con|solo\\s+con)\\s+(?:google\\s+)?(?:antigravity|flow(?:\\s+studio)?)(?:\\s+${retryModifier}){0,2})` +
            `|(?:(?:ahora\\s+)?en\\s+(?:vertical|horizontal|cuadrad[oa]|3d|video|v[ií]deo|9\\s*:\\s*16|16\\s*:\\s*9|1\\s*:\\s*1)(?:\\s+${retryModifier}){0,2})` +
            `)[!.\\s,?]*$`,
        'i'
    );
    return retryPattern.test(trimmed);
}

function hasAnyVisualMediaCreationCue(rawText = '') {
    const text = String(rawText || '').trim();
    if (!text) return false;
    const hasActionVerb =
        /\b(crea(?:me|r)?|cr[eé]ame|genera(?:me|r)?|gen[eé]rame|haz(?:me)?|h[aá]zme|hacer|dise[ñn]a(?:me|r)?|dis[eé][ñn]ame|dibuja(?:me|r)?|dib[uú]jame|ilustra(?:me|r)?|produce|renderiza(?:me|r)?|elabora(?:me|r)?|quiero|necesito|dame|reg[aá]lame)\b/i.test(
            text
        );
    const hasMediaNoun =
        /\b(im[aá]gen(?:es)?|foto(?:graf[ií]a)?|ilustraci[oó]n|afiche|p[oó]ster|poster|cartel|flyer|banner|infograf[ií]a|dibujo|render(?:\s*3d)?|v[ií]deo|video|clip(?:\s+de\s+v[ií]deo)?|cortometraje|animaci[oó]n(?:\s+en\s+v[ií]deo)?)\b/i.test(
            text
        );
    if (hasActionVerb && hasMediaNoun) {
        // Excluir preguntas de análisis de archivos adjuntos o certificados
        if (/\b(analiza|revisa|lee|transcribe|describe|audita|verifica|certificado\s+de\s+arl|certificado\s+de\s+alturas)\b/i.test(text)) {
            return false;
        }
        return true;
    }
    return /^(?:por\s+favor\s+|porfa\s+)?(?:una?|un)\s+(?:im[aá]gen|foto(?:graf[ií]a)?|ilustraci[oó]n|afiche|p[oó]ster|poster|v[ií]deo|video|clip)\s+(?:de|sobre|con|mostrando)\b/i.test(
        text
    );
}

function parseDirectVisualMediaRequest(rawText = '', { allowCompound = false, hasCurrentAttachment = false } = {}) {
    const trimmed = String(rawText || '').trim();
    if (!trimmed || trimmed.startsWith('[RESULTADO_GUI]')) return null;

    // Excluir preguntas informativas, de navegación o de mera capacidad sin escena
    if (
        /^\s*¿?\s*(?:c[oó]mo\s+(?:puedo|se\s+puede|hago|crear|generar)|qu[eé]\s+es|expl[ií]came|cu[aá]l\s+es|abre|abrir|ll[eé]vame|ir\s+a|navega(?:r)?|mu[eé]strame\s+mis)\b/i.test(
            trimmed
        ) ||
        /^\s*¿?\s*(?:t[uú]\s+)?(?:puedes|sabes|eres\s+capaz\s+de)\s+(?:crear|generar|hacer|dise[ñn]ar)\s+(?:im[aá]genes?|fotos?|v[ií]deos?|videos?|afiches?)\s*\??\s*$/i.test(
            trimmed
        )
    ) {
        return null;
    }

    // Excluir análisis/auditoría de archivos o fotos adjuntas en el turno actual
    if (
        /\b(analiza(?:r)?|revisa(?:r)?|lee(?:r)?|transcribe|transcribir|describe|describir|audita(?:r)?|verifica(?:r)?|extrae(?:r)?|qu[eé]\s+(?:dice|ves|hay))\b/i.test(
            trimmed
        ) &&
        (hasCurrentAttachment || /\b(est[ae]\s+(?:im[aá]gen|foto|captura|archivo|documento|pdf)|adjunt[oa])\b/i.test(trimmed))
    ) {
        return null;
    }

    // Nunca interceptar solicitudes explícitas de certificados oficiales / consultas de portales
    if (
        /\b(certificado\s+(?:de\s+)?(?:arl|afiliaci[oó]n|alturas|sena|mintrabajo|eps)|descarg(?:a|ar)\s+(?:el\s+)?certificado)\b/i.test(
            trimmed
        )
    ) {
        return null;
    }

    // En fast-path (antes de Gemini) evitar secuestrar entregables documentales o tareas multi-paso
    if (!allowCompound) {
        if (
            /\b(informe|reporte|documento|word|docx|excel|xlsx|hoja\s+de\s+c[aá]lculo|\bpdf\b|canvas|lienzo|aplicativo|dashboard|\bhtml\b|p[aá]gina\s+web|c[oó]digo\s+qr|\bqr\b|presentaci[oó]n|diapositivas|powerpoint|slides|curso\s+lms|art[ií]culo\s+de\s+blog|flujo\s+de\s+trabajo|automatizaci[oó]n|matriz\s+(?:gtc|pesv|legal|ipevr|de\s+riesgos|de\s+peligros|qu[ií]mica)|estudio\s+de\s+puesto|evaluaci[oó]n\s+ergon[oó]mica)\b/i.test(
                trimmed
            ) ||
            /\by\s+(?:env[ií]a(?:lo|la|me)?|m[aá]nda(?:lo|la|me)?|guarda(?:lo|la)?|sube(?:lo|la)?|consulta|verifica|revisa|abre|crea\s+un\s+(?:informe|correo|evento|flujo))\b/i.test(
                trimmed
            )
        ) {
            return null;
        }
    }

    const directVerbImageRe =
        /\b(?:crea(?:me|r)?|cr[eé]ame|genera(?:me|r)?|gen[eé]rame|haz(?:me)?|h[aá]zme|hacer|dise[ñn]a(?:me|r)?|dis[eé][ñn]ame|dibuja(?:me|r)?|dib[uú]jame|ilustra(?:me|r)?|produce|renderiza(?:me|r)?|elabora(?:me|r)?|quiero|necesito|dame|reg[aá]lame)\b[\s\S]{0,42}?\b(im[aá]gen(?:es)?|foto(?:graf[ií]a)?|ilustraci[oó]n|afiche|p[oó]ster|poster|cartel|flyer|banner|infograf[ií]a|dibujo|render(?:\s*3d)?|caricatura)\b/i;
    const directVerbVideoRe =
        /\b(?:crea(?:me|r)?|cr[eé]ame|genera(?:me|r)?|gen[eé]rame|haz(?:me)?|h[aá]zme|hacer|produce|graba(?:me|r)?|anima(?:me|r)?|renderiza(?:me|r)?|elabora(?:me|r)?|quiero|necesito|dame)\b[\s\S]{0,42}?\b(v[ií]deo|video|clip(?:\s+de\s+v[ií]deo)?|cortometraje|animaci[oó]n\s+en\s+v[ií]deo)\b/i;
    const leadingImageRe =
        /^(?:por\s+favor\s+|porfa\s+)?(?:una?|un)\s+(?:im[aá]gen|foto(?:graf[ií]a)?|ilustraci[oó]n|afiche|p[oó]ster|poster|cartel|flyer|infograf[ií]a|dibujo|render(?:\s*3d)?)\s+(?:de|sobre|con|mostrando)\s+\S+/i;
    const leadingVideoRe =
        /^(?:por\s+favor\s+|porfa\s+)?(?:un)\s+(?:v[ií]deo|video|clip(?:\s+de\s+v[ií]deo)?|cortometraje)\s+(?:de|sobre|con|mostrando)\s+\S+/i;

    const imgMatch = trimmed.match(directVerbImageRe) || trimmed.match(leadingImageRe);
    const vidMatch = trimmed.match(directVerbVideoRe) || trimmed.match(leadingVideoRe);
    if (!imgMatch && !vidMatch) return null;

    let isVideo = false;
    if (vidMatch && !imgMatch) {
        isVideo = true;
    } else if (vidMatch && imgMatch) {
        isVideo = (vidMatch.index ?? 9999) < (imgMatch.index ?? 9999);
    }

    const prompt = cleanVisualMediaPrompt(trimmed);
    if (!prompt || prompt.length < 4 || /^(?:esto|eso|aquello|algo|una?\s+im[aá]gen|un\s+v[ií]deo)$/i.test(prompt)) {
        return null;
    }

    const opts = extractVisualMediaOptions(trimmed);
    return {
        isVideo,
        prompt,
        aspectRatio: opts.aspectRatio || '16:9',
        style: opts.style || 'fotorrealista',
        cameraMotion: opts.cameraMotion || 'zoom_in',
        skipAntigravity: Boolean(opts.skipAntigravity),
        recoveredFromHistory: false,
    };
}

function detectVisualMediaGenerationIntent(
    lastText = '',
    allMessages = [],
    { allowCompound = false, hasCurrentAttachment = false } = {}
) {
    const direct = parseDirectVisualMediaRequest(lastText, { allowCompound, hasCurrentAttachment });
    if (direct) return direct;

    if (!isExplicitVisualMediaRetryMessage(lastText) || !Array.isArray(allMessages) || allMessages.length < 2) {
        return null;
    }

    // Retroceder por los mensajes anteriores del usuario saltando solo reintentos consecutivos;
    // detenerse inmediatamente en el primer mensaje real (no reintento) para evitar reutilizar contexto antiguo ajeno.
    let retriesSkipped = 0;
    for (let idx = allMessages.length - 2; idx >= 0; idx--) {
        const msg = allMessages[idx];
        if (!msg || msg.role !== 'user') continue;
        const prevText = String(msg.content || '').trim();
        if (!prevText || prevText.startsWith('[RESULTADO_GUI]')) continue;

        if (isExplicitVisualMediaRetryMessage(prevText) && retriesSkipped < 3) {
            retriesSkipped++;
            continue;
        }

        const prevMedia = parseDirectVisualMediaRequest(prevText, {
            allowCompound: true,
            hasCurrentAttachment: false,
        });
        if (!prevMedia) {
            return null;
        }

        const currentOverrides = extractVisualMediaOptions(lastText);
        const resolvedIsVideo = currentOverrides.forceVideo
            ? true
            : currentOverrides.forceImage
              ? false
              : prevMedia.isVideo;

        return {
            isVideo: resolvedIsVideo,
            prompt: prevMedia.prompt,
            aspectRatio: currentOverrides.aspectRatio || prevMedia.aspectRatio || '16:9',
            style: currentOverrides.style || prevMedia.style || 'fotorrealista',
            cameraMotion: currentOverrides.cameraMotion || prevMedia.cameraMotion || 'zoom_in',
            skipAntigravity: currentOverrides.skipAntigravity || prevMedia.skipAntigravity || false,
            recoveredFromHistory: true,
            originalPromptMessage: prevText,
        };
    }

    return null;
}

async function executeDirectFlowMediaForTenshi({
    isVideo = false,
    prompt = '',
    aspectRatio = '16:9',
    style = 'fotorrealista',
    cameraMotion = 'zoom_in',
    skipAntigravity = false,
    userId,
    companyId = null,
}) {
    const {
        executeFlowImageGeneration,
        executeFlowVideoGeneration,
        buildFlowStudioCanvasHtml,
    } = require('./googleflow');

    const mediaRes = isVideo
        ? await executeFlowVideoGeneration({
              userId,
              companyId,
              prompt,
              aspectRatio,
              cameraMotion,
          })
        : await executeFlowImageGeneration({
              userId,
              companyId,
              prompt,
              aspectRatio,
              style,
              skipAntigravity,
          });

    const studioHtml = buildFlowStudioCanvasHtml(mediaRes);
    const usedAntigravity = /antigravity/i.test(String(mediaRes?.model || ''));
    const engineLabel = mediaRes?.model || (usedAntigravity ? 'Google Antigravity Studio' : 'Google Flow Studio');
    const safeAlt =
        String(prompt || 'Imagen generada')
            .replace(/[\r\n\[\]()]+/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 80) || 'Imagen Google Flow';
    const flowMd = isVideo
        ? `[🎬 Reproducir Video MP4](${mediaRes.publicUrl})`
        : `![${safeAlt}](${mediaRes.publicUrl})`;
    const fileObj = {
        title: isVideo
            ? 'Video Google Flow Studio'
            : usedAntigravity
              ? 'Imagen Google Antigravity Studio'
              : 'Imagen Google Flow Studio',
        fileType: 'html',
        content: studioHtml,
        canvasId: `tenshi-flow-${userId}-${Date.now()}`,
    };
    const responseText = isVideo
        ? `¡Listo! He generado tu video con **${engineLabel}** (formato **${mediaRes.aspectRatio || aspectRatio}**):\n\n${flowMd}\n\nPuedes reproducirlo aquí mismo o abrirlo en el Canvas de Tenshi para descargarlo en MP4.`
        : `¡Listo! He generado tu imagen con **${engineLabel}** (formato **${mediaRes.aspectRatio || aspectRatio}**):\n\n${flowMd}\n\nPuedes verla en detalle o abrirla en el Canvas de Tenshi para descargarla en alta resolución.`;

    return {
        mediaRes,
        studioHtml,
        fileObj,
        flowMd,
        publicUrl: mediaRes.publicUrl,
        engineLabel,
        responseText,
    };
}

function isFlowMatchValidatedFor503Rescue({ flow, matchRes, userText = '', attachedMedia = null, attachedNames = '' }) {
    if (!flow || !flow._id) {
        return { allowed: false, reason: 'invalid_flow' };
    }
    const text = String(userText || '').trim();
    const combinedWithAttachments = `${text} ${String(attachedNames || '').trim()}`.trim();

    // 1. JAMÁS ejecutar un flujo de portales/ARL/SG-SST cuando el usuario pidió crear una imagen, afiche o video
    if (hasAnyVisualMediaCreationCue(text)) {
        return { allowed: false, reason: 'visual_media_intent' };
    }

    // 2. Bloquear coincidencias débiles por palabras genéricas en la descripción del flujo (causa raíz del falso positivo ARL)
    const matchSource = String(matchRes?.matchSource || '').toLowerCase();
    const matchScore = Number(matchRes?.score || 0);
    if (matchSource === 'description') {
        return { allowed: false, reason: 'weak_description_match' };
    }
    if ((matchSource === 'name' || matchSource === 'voice') && matchScore > 0 && matchScore < 70) {
        return { allowed: false, reason: `low_score_${matchScore}` };
    }

    const flowKey = String(flow.key || flow.presetKey || flow.systemPresetKey || '').toLowerCase();
    const flowName = String(flow.name || '').toLowerCase();
    const flowInputs = Array.isArray(flow?.workflowNodes?.inputs) ? flow.workflowNodes.inputs.map(String) : [];

    const textNoNormative = text.replace(/\b20223040040595\b/g, ' ');
    const hasExplicitCedula = /(?:(?<!\d)\d{6,11}(?!\d)|\b\d{1,3}(?:\.\d{3}){2,3}\b)/.test(textNoNormative);
    const hasVerificationIntent =
        /\b(consultar?|consulta|verificar?|verificaci[oó]n|validar?|validaci[oó]n|revisar?|descargar?|obtener|sacar|emitir|certificado|afiliaci[oó]n|afiliado|vigencia|estado\s+de\s+afiliaci[oó]n)\b/i.test(
            text
        );

    // 3. Evidencia textual inequívoca para Flujo ARL
    const isArlFlow =
        flowKey === 'tenshi_flow_verificacion_arl_cedula' ||
        (flowInputs.length === 1 && flowInputs[0] === 'scraper_agy_arl_directo') ||
        (/\barl\b/i.test(flowName) && !/360/i.test(flowName));
    if (isArlFlow) {
        const hasExplicitArlKeyword =
            /\b(arl|certificado\s+de\s+afiliaci[oó]n|afiliaci[oó]n\s+(?:a\s+)?(?:la\s+)?arl|sura|positiva|seguros?\s+bol[ií]var|bol[ií]var|colmena|axa|colpatria)\b/i.test(
                text
            ) || (/\briesgos?\s+laborales?\b/i.test(text) && hasVerificationIntent);
        const hasCedulaPlusIntent = hasExplicitCedula && hasVerificationIntent;
        if (!hasExplicitArlKeyword && !hasCedulaPlusIntent) {
            return { allowed: false, reason: 'missing_arl_evidence' };
        }
        return { allowed: true, reason: 'verified_arl_evidence' };
    }

    // 4. Evidencia textual inequívoca para Alturas / Confinados portal MinTrabajo/SENA
    const isAlturasPortalFlow =
        flowKey === 'tenshi_flow_verificacion_alturas_cedula' ||
        (flowInputs.length === 1 && flowInputs[0] === 'scraper_agy_alto_riesgo');
    if (isAlturasPortalFlow) {
        const hasAlturasKeyword = /\b(alturas?|confinados?|mintrabajo|ministerio\s+del\s+trabajo|sena|4272|0491)\b/i.test(text);
        if (!hasAlturasKeyword || (!hasVerificationIntent && !hasExplicitCedula && !/\b(curso|certificado|vigente|vencid)\b/i.test(text))) {
            return { allowed: false, reason: 'missing_alturas_evidence' };
        }
        return { allowed: true, reason: 'verified_alturas_evidence' };
    }

    // 5. Evidencia textual inequívoca para SIMIT / Vial
    const isSimitFlow =
        flowKey === 'tenshi_flow_verificacion_simit_vial' ||
        (flowInputs.length === 1 && flowInputs[0] === 'scraper_agy_vial_pesv');
    if (isSimitFlow) {
        const hasExplicitPlaca =
            /\b(?!(?:res|dec|ley|art|iso|ntc|cie|emo|epp|arl|rtm|fds|lms|ccl|sga)\b)[a-z]{3}[\s-]?\d{2}[0-9a-z]\b/i.test(text);
        const hasSimitKeyword =
            /\b(simit|comparendos?|multas?\s+(?:de\s+)?tr[aá]nsito|infracciones?\s*(?:viales?|de\s+tr[aá]nsito|pesv)?|runt|placa)\b/i.test(
                text
            );
        if (!hasSimitKeyword && !(hasExplicitPlaca && hasVerificationIntent)) {
            return { allowed: false, reason: 'missing_simit_evidence' };
        }
        return { allowed: true, reason: 'verified_simit_evidence' };
    }

    // 6. Evidencia textual inequívoca para Antecedentes
    const isAntecedentesFlow =
        flowKey === 'tenshi_flow_verificacion_antecedentes' ||
        (flowInputs.length === 1 && flowInputs[0] === 'scraper_agy_antecedentes');
    if (isAntecedentesFlow) {
        if (!/\b(antecedentes?|rama\s+judicial|procesos?\s+judiciales?|contralor[ií]a|procuradur[ií]a|pasado\s+judicial)\b/i.test(text)) {
            return { allowed: false, reason: 'missing_antecedentes_evidence' };
        }
        return { allowed: true, reason: 'verified_antecedentes_evidence' };
    }

    // 7. Evidencia textual inequívoca para Investigación 360 Multi-Portal
    const is360Flow =
        flowKey === 'tenshi_flow_investigacion_integral_360' ||
        flowInputs.filter((x) => x.startsWith('scraper_agy_')).length >= 2;
    if (is360Flow) {
        const explicit360Cue =
            /\b(360|multi[\s-]?portal|todos\s+los\s+(?:certificados|portales)|investigaci[oó]n\s+(?:completa|integral)|verificar?\s+todo|consultar?\s+todo)\b/i.test(
                text
            );
        const portalCueCount = [
            /\b(arl|sura|positiva|bol[ií]var|colmena|axa|colpatria)\b/i.test(text),
            /\b(alturas?|confinados?|mintrabajo|sena|4272)\b/i.test(text),
            /\b(simit|comparendos?|multas?\s+de\s+tr[aá]nsito|runt)\b/i.test(text),
            /\b(antecedentes?|rama\s+judicial|contralor[ií]a|procuradur[ií]a)\b/i.test(text),
        ].filter(Boolean).length;
        if (!explicit360Cue && portalCueCount < 2) {
            return { allowed: false, reason: 'missing_360_evidence' };
        }
        return { allowed: true, reason: 'verified_360_evidence' };
    }

    // 8. Evidencia textual/adjunto inequívoca para Auditoría Forense de Incapacidad
    const isForensicFlow =
        flowKey === 'tenshi_flow_auditoria_forense_incapacidad' ||
        flowInputs.includes('forensic_doc_verifier');
    if (isForensicFlow) {
        const hasForensicText = /\b(incapacidad(?:es)?|licencia\s+m[eé]dica|rethus|1427|forense|autenticidad|adulterad|falso)\b/i.test(text);
        const hasForensicAttachment =
            Boolean(attachedMedia) &&
            /\b(incapacidad|forense|audita|auditor[ií]a|verifica|verificar|revisa|revisar|autenticidad|falso|adulterad|certificado|soporte|m[eé]dic[oa]|eps)\b/i.test(
                combinedWithAttachments
            );
        if (!hasForensicText && !hasForensicAttachment) {
            return { allowed: false, reason: 'missing_forensic_evidence' };
        }
        return { allowed: true, reason: 'verified_forensic_evidence' };
    }

    // 9. Para flujos internos Somos SST u otros flujos: exigir fuente de match fuerte y texto no trivial
    if (!['id', 'presetkey', 'concept_router', 'voice', 'name', 'forensic_attachment_guard'].includes(matchSource)) {
        return { allowed: false, reason: `untrusted_source_${matchSource || 'none'}` };
    }
    if (text.length < 4 && !attachedMedia) {
        return { allowed: false, reason: 'empty_query' };
    }

    return { allowed: true, reason: `verified_${matchSource || 'flow'}` };
}

// Knowledge Retrieval System (RAG)
async function getRelevantTickets(req, userQuery) {
    const trimmedQuery = (userQuery || '').trim();
    if (!trimmedQuery || trimmedQuery.length < 4) return '';
    if (
        trimmedQuery.length <= 28 &&
        /^(hola|buenos|buenas|gracias|muchas\s+gracias|ok|okay|listo|vale|perfecto|claro)(\s+(d[ií]as|tardes|noches|tenshi|suri|wappy|por\s+todo|equip[oa]))?[!.\s,?¡¿]*$/i.test(trimmedQuery)
    ) {
        return '';
    }
    let context = '';

    // 1. Consultar Base de Datos Normativa y Técnica interna de WAPPY (99+ archivos .md: Vademécum 2026, Res 1843/2025, Batería Psicosocial, etc.)
    try {
        const normativeRag = await searchNormativeKnowledgeBase(userQuery, 3);
        if (normativeRag && normativeRag.exito && normativeRag.textoFormateado) {
            context = normativeRag.textoFormateado;
        }
    } catch (_e) {}

    // 2. Try Vector DB (App RAG System) with 2000ms timeout
    if (!context && process.env.RAG_API_URL) {
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
                timeout: 2000
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

    // 3. Fallback to MongoDB Smart Search (Text Index)
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

function extractOptionalUserId(req) {
    if (req.user?.id || req.user?._id) {
        return String(req.user.id || req.user._id);
    }
    const authHeader = req.headers?.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
            const token = authHeader.slice(7).trim();
            if (token && process.env.JWT_SECRET) {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                if (decoded?.id) {
                    return String(decoded.id);
                }
            }
        } catch (_) {}
    }
    return null;
}

async function resolveActiveCompanyForUser(userId, explicitCompanyId = null) {
    if (!userId) return null;
    const CompanyInfoModel = mongoose.models.CompanyInfo || require('../../models/CompanyInfo');
    if (explicitCompanyId && mongoose.Types.ObjectId.isValid(String(explicitCompanyId))) {
        const found = await CompanyInfoModel.findOne({ _id: explicitCompanyId, user: userId }).lean().catch(() => null);
        if (found) return found;
    }
    return await CompanyInfoModel.findOne({ user: userId, isActive: true }).lean().catch(() => null);
}

router.get('/config', async (req, res) => {
    try {
        let config = await TenshiConfig.findOne();
        if (!config) {
            config = await TenshiConfig.create({
                skills: ['skill-admin-metricas-sistema'],
            });
        } else if (Array.isArray(config.skills) && config.skills.length > 0 && !config.skills.includes('skill-admin-metricas-sistema')) {
            config.skills.push('skill-admin-metricas-sistema');
            await config.save().catch(() => {});
        }
        const configObj = config.toObject ? config.toObject() : config;
        const optionalUserId = extractOptionalUserId(req);
        const activeComp = optionalUserId
            ? await resolveActiveCompanyForUser(optionalUserId, req.query.companyId)
            : null;
        const avatarProfile = await TenshiUserAvatar.resolveEffectiveAvatarProfile(
            optionalUserId,
            configObj,
            activeComp?._id ? String(activeComp._id) : null
        );
        res.json({
            ...configObj,
            companyId: avatarProfile.companyId || null,
            userAvatar: avatarProfile.userAvatar,
            defaultAvatarProfile: avatarProfile.defaults,
            effectiveAvatar: avatarProfile.effective,
        });
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

router.get('/user-avatar', requireJwtAuth, async (req, res) => {
    try {
        const targetUserId = (req.user?.isSubUser && req.user?.parentUser)
            ? String(req.user.parentUser)
            : String(req.user?.id || req.user?._id);
        const activeComp = await resolveActiveCompanyForUser(targetUserId, req.query.companyId);
        const compId = activeComp?._id ? String(activeComp._id) : null;
        const profile = await TenshiUserAvatar.resolveEffectiveAvatarProfile(targetUserId, null, compId);
        res.json(profile);
    } catch (error) {
        console.error('Error fetching Tenshi user avatar:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.post('/user-avatar', requireJwtAuth, async (req, res) => {
    try {
        const targetUserId = (req.user?.isSubUser && req.user?.parentUser)
            ? String(req.user.parentUser)
            : String(req.user?.id || req.user?._id);
        const activeComp = await resolveActiveCompanyForUser(
            targetUserId,
            req.body?.companyId || req.query?.companyId
        );
        const compId = activeComp?._id ? String(activeComp._id) : null;
        if (req.body.resetToDefault === true) {
            await TenshiUserAvatar.findOneAndUpdate(
                { user: targetUserId, companyId: compId },
                {
                    $set: {
                        companyId: compId,
                        isCustomized: false,
                        avatarId: '',
                        name: '',
                        gender: '',
                        voice: '',
                        personality: '',
                        personalityPreset: 'consultor',
                    },
                },
                { upsert: true, new: true }
            );
        } else {
            await TenshiUserAvatar.findOneAndUpdate(
                { user: targetUserId, companyId: compId },
                {
                    $set: {
                        companyId: compId,
                        avatarId: req.body.avatarId ?? '',
                        name: req.body.name ?? '',
                        gender: req.body.gender ?? '',
                        voice: req.body.voice ?? '',
                        personality: req.body.personality ?? '',
                        personalityPreset: req.body.personalityPreset ?? 'consultor',
                        isCustomized: true,
                    },
                },
                { upsert: true, new: true }
            );
        }
        const profile = await TenshiUserAvatar.resolveEffectiveAvatarProfile(targetUserId, null, compId);
        res.json(profile);
    } catch (error) {
        console.error('Error saving Tenshi user avatar:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

const TENSHI_DB_MEDIA_BUDGET_BYTES = 4 * 1024 * 1024;
const MAX_GEMINI_INLINE_BYTES = 14 * 1024 * 1024;
const TOTAL_GEMINI_TEXT_CHAR_BUDGET = 60000;
const MIN_GEMINI_TEXT_CHARS_PER_DOC = 8000;

const TENSHI_EXTENSION_TO_MIME = {
    '.pdf': 'application/pdf',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.bmp': 'image/bmp',
    '.tif': 'image/tiff',
    '.tiff': 'image/tiff',
    '.heic': 'image/heic',
    '.heif': 'image/heif',
    '.avif': 'image/avif',
    '.svg': 'image/svg+xml',
    '.mp4': 'video/mp4',
    '.m4v': 'video/mp4',
    '.mov': 'video/quicktime',
    '.webm': 'video/webm',
    '.mkv': 'video/x-matroska',
    '.avi': 'video/x-msvideo',
    '.mpeg': 'video/mpeg',
    '.mpg': 'video/mpeg',
    '.3gp': 'video/3gpp',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.m4a': 'audio/mp4',
    '.ogg': 'audio/ogg',
    '.oga': 'audio/ogg',
    '.aac': 'audio/aac',
    '.flac': 'audio/flac',
    '.opus': 'audio/opus',
    '.weba': 'audio/webm',
    '.wma': 'audio/x-ms-wma',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.doc': 'application/msword',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.xls': 'application/vnd.ms-excel',
    '.xlsm': 'application/vnd.ms-excel.sheet.macroEnabled.12',
    '.xlsb': 'application/vnd.ms-excel.sheet.binary.macroEnabled.12',
    '.ods': 'application/vnd.oasis.opendocument.spreadsheet',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.ppt': 'application/vnd.ms-powerpoint',
    '.csv': 'text/csv',
    '.tsv': 'text/tab-separated-values',
    '.txt': 'text/plain',
    '.md': 'text/markdown',
    '.markdown': 'text/markdown',
    '.json': 'application/json',
    '.xml': 'application/xml',
    '.html': 'text/html',
    '.htm': 'text/html',
    '.rtf': 'application/rtf',
    '.log': 'text/plain',
    '.yaml': 'text/yaml',
    '.yml': 'text/yaml',
    '.sql': 'application/sql',
    '.js': 'text/javascript',
    '.mjs': 'text/javascript',
    '.cjs': 'text/javascript',
    '.ts': 'text/plain',
    '.tsx': 'text/plain',
    '.jsx': 'text/plain',
    '.py': 'text/plain',
    '.sh': 'text/plain',
    '.css': 'text/css',
    '.ini': 'text/plain',
    '.conf': 'text/plain',
};

function getMediaFileExtension(name) {
    if (!name || typeof name !== 'string') return '';
    const clean = name.split('?')[0].split('#')[0].trim().toLowerCase();
    const dotIdx = clean.lastIndexOf('.');
    if (dotIdx === -1) return '';
    return clean.slice(dotIdx);
}

function parseDataUrlParts(rawUrl) {
    if (typeof rawUrl !== 'string') return null;
    const trimmed = rawUrl.trim();
    if (!trimmed.startsWith('data:')) return null;
    const b64Match = trimmed.match(/^data:([^;,]+)(?:;[^;,]*)*;base64,([\s\S]+)$/i);
    if (b64Match) {
        return {
            mimeType: b64Match[1].trim().toLowerCase(),
            isBase64: true,
            payload: b64Match[2].replace(/\s+/g, ''),
        };
    }
    const plainMatch = trimmed.match(/^data:([^;,]+)(?:;[^;,]*)*,([\s\S]*)$/i);
    if (plainMatch) {
        return {
            mimeType: plainMatch[1].trim().toLowerCase(),
            isBase64: false,
            payload: plainMatch[2],
        };
    }
    return null;
}

function inferMimeAndTypeForMediaItem(rawItem, rawDataUrl) {
    const rawName = String(rawItem?.name || rawItem?.fileName || rawItem?.originalname || '').trim();
    const ext = getMediaFileExtension(rawName);
    const extMime = TENSHI_EXTENSION_TO_MIME[ext] || '';
    const declaredMime = String(rawItem?.mimeType || rawItem?.mimetype || '').trim().toLowerCase();
    const parsedHeader = parseDataUrlParts(rawDataUrl);
    const headerMime = parsedHeader?.mimeType || '';
    const declaredType = String(rawItem?.type || '').trim().toLowerCase();

    let resolvedMime = '';
    if (declaredMime && declaredMime !== 'application/octet-stream') {
        resolvedMime = declaredMime;
    } else if (extMime) {
        resolvedMime = extMime;
    } else if (declaredType === 'video') {
        resolvedMime = headerMime.startsWith('video/') ? headerMime : 'video/mp4';
    } else if (declaredType === 'audio') {
        resolvedMime = headerMime.startsWith('audio/') ? headerMime : 'audio/mpeg';
    } else if (declaredType === 'pdf') {
        resolvedMime = 'application/pdf';
    } else if (headerMime && headerMime !== 'application/octet-stream') {
        resolvedMime = headerMime;
    } else if (declaredType === 'image') {
        resolvedMime = 'image/jpeg';
    } else if (declaredType === 'document') {
        resolvedMime = typeof rawItem?.content === 'string' && rawItem.content.trim()
            ? 'text/plain'
            : 'application/octet-stream';
    } else if (rawDataUrl) {
        resolvedMime = 'image/jpeg';
    } else {
        resolvedMime = 'application/octet-stream';
    }

    // SVG siempre se maneja como documento de texto (Gemini rechaza inlineData image/svg+xml)
    let resolvedType;
    if (resolvedMime === 'image/svg+xml' || ext === '.svg') {
        resolvedMime = 'image/svg+xml';
        resolvedType = 'document';
    } else if (resolvedMime.startsWith('image/')) {
        resolvedType = 'image';
    } else if (resolvedMime.startsWith('video/')) {
        resolvedType = 'video';
    } else if (resolvedMime.startsWith('audio/')) {
        resolvedType = 'audio';
    } else if (['image', 'video', 'audio', 'document'].includes(declaredType) && resolvedMime === 'application/octet-stream') {
        resolvedType = declaredType;
    } else {
        resolvedType = 'document';
    }

    const fallbackName = resolvedMime === 'application/pdf'
        ? 'documento_adjunto.pdf'
        : resolvedType === 'video'
            ? 'video_adjunto.mp4'
            : resolvedType === 'audio'
                ? 'audio_adjunto.mp3'
                : resolvedType === 'document'
                    ? 'archivo_adjunto'
                    : 'imagen_adjunta.jpg';

    return {
        name: rawName || fallbackName,
        mimeType: resolvedMime,
        type: resolvedType,
    };
}

function getDataSignature(str) {
    if (typeof str !== 'string' || !str) return '';
    return `${str.length}:${str.slice(0, 128)}:${str.slice(-64)}`;
}

function normalizeIncomingMediaList(msgObj, { requirePayload = true } = {}) {
    if (!msgObj || typeof msgObj !== 'object') return [];

    const rawCandidates = [];
    if (Array.isArray(msgObj.attachments)) {
        rawCandidates.push(...msgObj.attachments);
    }
    if (Array.isArray(msgObj.mediaList)) {
        rawCandidates.push(...msgObj.mediaList);
    }
    if (Array.isArray(msgObj.files)) {
        rawCandidates.push(...msgObj.files);
    }
    if (msgObj.media && typeof msgObj.media === 'object') {
        rawCandidates.push(msgObj.media);
    }
    if (typeof msgObj.image === 'string' && msgObj.image.trim()) {
        rawCandidates.push({
            name: msgObj.media?.name || msgObj.media?.fileName || 'imagen_adjunta.jpg',
            type: 'image',
            dataUrl: msgObj.image.trim(),
        });
    }

    const normalized = [];
    const seenById = new Map();
    const seenByDataSig = new Map();
    const seenByNameSize = new Map();

    const mergeIntoExisting = (existing, incoming) => {
        if (!existing.id && incoming.id) existing.id = incoming.id;
        if (!existing.dataUrl && incoming.dataUrl) existing.dataUrl = incoming.dataUrl;
        if (!existing.base64 && incoming.base64) existing.base64 = incoming.base64;
        if (!existing.buffer && incoming.buffer) existing.buffer = incoming.buffer;
        if (!existing.publicUrl && incoming.publicUrl) existing.publicUrl = incoming.publicUrl;
        if (!existing.thumbnailUrl && incoming.thumbnailUrl) existing.thumbnailUrl = incoming.thumbnailUrl;
        if (existing.duration === undefined && incoming.duration !== undefined) existing.duration = incoming.duration;
        if (!existing.content && incoming.content) existing.content = incoming.content;
        if ((!existing.size || existing.size <= 0) && incoming.size > 0) existing.size = incoming.size;
    };

    for (const rawItem of rawCandidates) {
        if (!rawItem || typeof rawItem !== 'object') continue;

        let rawDataUrl = typeof rawItem.dataUrl === 'string' && rawItem.dataUrl.trim() ? rawItem.dataUrl.trim() : undefined;
        const rawBase64 = typeof rawItem.base64 === 'string' && rawItem.base64.trim() ? rawItem.base64.trim() : undefined;
        let rawBuffer;
        if (Buffer.isBuffer(rawItem.buffer) && rawItem.buffer.length > 0) {
            rawBuffer = rawItem.buffer;
        } else if (rawItem.buffer instanceof Uint8Array && rawItem.buffer.byteLength > 0) {
            rawBuffer = Buffer.from(rawItem.buffer);
        } else if (rawItem.buffer && typeof rawItem.buffer === 'object' && rawItem.buffer.type === 'Buffer' && Array.isArray(rawItem.buffer.data)) {
            rawBuffer = Buffer.from(rawItem.buffer.data);
        }
        const rawPublicUrl = typeof rawItem.publicUrl === 'string' && rawItem.publicUrl.trim() ? rawItem.publicUrl.trim() : undefined;
        const rawThumbnailUrl = typeof rawItem.thumbnailUrl === 'string' && rawItem.thumbnailUrl.trim() ? rawItem.thumbnailUrl.trim() : undefined;
        const rawContent = typeof rawItem.content === 'string' && rawItem.content.trim() ? rawItem.content : undefined;

        const hasPayload = Boolean(rawDataUrl || rawBase64 || rawBuffer || rawPublicUrl || rawContent);
        if (requirePayload && !hasPayload) {
            continue;
        }

        const inferred = inferMimeAndTypeForMediaItem(rawItem, rawDataUrl || rawBase64);
        if (!rawDataUrl && rawBase64) {
            rawDataUrl = rawBase64.startsWith('data:')
                ? rawBase64
                : `data:${inferred.mimeType};base64,${rawBase64.replace(/\s+/g, '')}`;
        }

        const rawId = rawItem.id !== undefined && rawItem.id !== null ? String(rawItem.id).trim() : '';
        const parsedSize = Number(rawItem.size);
        const safeSize = Number.isFinite(parsedSize) && parsedSize >= 0 ? parsedSize : 0;
        const parsedDuration = Number(rawItem.duration);
        const safeDuration = rawItem.duration !== '' && rawItem.duration !== null && rawItem.duration !== undefined && Number.isFinite(parsedDuration) && parsedDuration >= 0
            ? parsedDuration
            : undefined;

        const candidate = {
            ...(rawId ? { id: rawId } : {}),
            name: inferred.name,
            type: inferred.type,
            mimeType: inferred.mimeType,
            size: safeSize,
            ...(rawDataUrl ? { dataUrl: rawDataUrl } : {}),
            ...(rawBase64 ? { base64: rawBase64 } : {}),
            ...(rawBuffer ? { buffer: rawBuffer } : {}),
            ...(rawPublicUrl ? { publicUrl: rawPublicUrl } : {}),
            ...(rawThumbnailUrl ? { thumbnailUrl: rawThumbnailUrl } : {}),
            ...(safeDuration !== undefined ? { duration: safeDuration } : {}),
            ...(rawContent ? { content: rawContent } : {}),
        };

        const dataSig = getDataSignature(rawDataUrl || rawBase64 || '');
        const nameKey = `${inferred.name.toLowerCase()}::${safeSize}`;

        let existingMatch = null;
        if (rawId && seenById.has(rawId)) {
            existingMatch = seenById.get(rawId);
        } else if (dataSig && seenByDataSig.has(dataSig)) {
            const bySig = seenByDataSig.get(dataSig);
            if (!bySig.dataUrl || !candidate.dataUrl || bySig.dataUrl === candidate.dataUrl) {
                existingMatch = bySig;
            }
        } else if (seenByNameSize.has(nameKey)) {
            const byNS = seenByNameSize.get(nameKey);
            // Si uno de los dos es metadata liviana (sin dataUrl) o comparten mismo contenido, deduplicar
            if (!byNS.dataUrl || !candidate.dataUrl || byNS.dataUrl === candidate.dataUrl) {
                existingMatch = byNS;
            }
        }

        if (existingMatch) {
            mergeIntoExisting(existingMatch, candidate);
            if (existingMatch.id && !seenById.has(existingMatch.id)) {
                seenById.set(existingMatch.id, existingMatch);
            }
            const mergedSig = getDataSignature(existingMatch.dataUrl || existingMatch.base64 || '');
            if (mergedSig && !seenByDataSig.has(mergedSig)) {
                seenByDataSig.set(mergedSig, existingMatch);
            }
            continue;
        }

        normalized.push(candidate);
        if (rawId) seenById.set(rawId, candidate);
        if (dataSig) seenByDataSig.set(dataSig, candidate);
        seenByNameSize.set(nameKey, candidate);
    }

    return normalized;
}

function normalizeIncomingMediaPayload(msgObj) {
    const list = normalizeIncomingMediaList(msgObj);
    return list.length > 0 ? list[0] : undefined;
}

function buildMediaFieldsForDb(rawList, legacyImage = undefined, maxTotalBytes = TENSHI_DB_MEDIA_BUDGET_BYTES) {
    const list = Array.isArray(rawList) ? rawList : [];
    let usedBytes = 0;
    const attachmentsForDb = [];

    for (const item of list) {
        if (!item || typeof item !== 'object') continue;
        const dbItem = {
            ...(item.id ? { id: String(item.id) } : {}),
            ...(item.name ? { name: String(item.name) } : {}),
            ...(item.type ? { type: String(item.type) } : {}),
            ...(item.mimeType ? { mimeType: String(item.mimeType) } : {}),
            ...(Number.isFinite(Number(item.size)) && Number(item.size) >= 0 ? { size: Number(item.size) } : {}),
            ...(item.publicUrl ? { publicUrl: String(item.publicUrl) } : {}),
            ...(item.duration !== undefined && item.duration !== '' && Number.isFinite(Number(item.duration)) && Number(item.duration) >= 0
                ? { duration: Number(item.duration) }
                : {}),
        };

        if (typeof item.dataUrl === 'string' && item.dataUrl.length > 0) {
            const dataUrlBytes = Buffer.byteLength(item.dataUrl, 'utf8');
            if (usedBytes + dataUrlBytes <= maxTotalBytes) {
                dbItem.dataUrl = item.dataUrl;
                usedBytes += dataUrlBytes;
            }
        }

        if (typeof item.thumbnailUrl === 'string' && item.thumbnailUrl.length > 0) {
            const thumbBytes = Buffer.byteLength(item.thumbnailUrl, 'utf8');
            if (usedBytes + thumbBytes <= maxTotalBytes) {
                dbItem.thumbnailUrl = item.thumbnailUrl;
                usedBytes += thumbBytes;
            }
        }

        if (typeof item.content === 'string' && item.content.length > 0) {
            const contentBytes = Buffer.byteLength(item.content, 'utf8');
            if (usedBytes + contentBytes <= maxTotalBytes) {
                dbItem.content = item.content;
                usedBytes += contentBytes;
            }
        }

        attachmentsForDb.push(dbItem);
    }

    const mediaForDb = attachmentsForDb.length > 0 ? { ...attachmentsForDb[0] } : undefined;
    const firstImageItem = attachmentsForDb.find((a) => a.type === 'image' && typeof a.dataUrl === 'string' && a.dataUrl.length > 0);
    let imageForDb = firstImageItem ? firstImageItem.dataUrl : undefined;
    if (!imageForDb && attachmentsForDb.length === 0 && typeof legacyImage === 'string' && legacyImage.trim()) {
        const legacyBytes = Buffer.byteLength(legacyImage, 'utf8');
        if (legacyBytes <= maxTotalBytes) {
            imageForDb = legacyImage;
        }
    }

    return {
        attachmentsForDb,
        mediaForDb,
        imageForDb,
        usedBytes,
    };
}

function extractRtfText(buffer) {
    if (!Buffer.isBuffer(buffer) || buffer.length === 0) return '';
    const raw = buffer.toString('latin1');
    const skipDestinations = new Set([
        'fonttbl', 'colortbl', 'stylesheet', 'info', 'pict', 'object', 'header', 'footer',
        'headerl', 'headerr', 'headerf', 'footerl', 'footerr', 'footerf', 'footnote',
        'xe', 'tc', 'rxe', 'bkmkstart', 'bkmkend', 'fldinst', 'xmlopen', 'latentstyles',
        'datastore', 'themedata', 'colorschememapping', 'listtable', 'listoverridetable',
        'revtbl', 'rsidtbl', 'pgdsctbl', 'mmathPr',
    ]);
    const cp1252Extra = {
        0x80: '\u20AC', 0x82: '\u201A', 0x83: '\u0192', 0x84: '\u201E', 0x85: '\u2026',
        0x86: '\u2020', 0x87: '\u2021', 0x88: '\u02C6', 0x89: '\u2030', 0x8A: '\u0160',
        0x8B: '\u2039', 0x8C: '\u0152', 0x8E: '\u017D', 0x91: '\u2018', 0x92: '\u2019',
        0x93: '\u201C', 0x94: '\u201D', 0x95: '\u2022', 0x96: '\u2013', 0x97: '\u2014',
        0x98: '\u02DC', 0x99: '\u2122', 0x9A: '\u0161', 0x9B: '\u203A', 0x9C: '\u0153',
        0x9E: '\u017E', 0x9F: '\u0178',
    };

    const stack = [];
    let skipDepth = -1;
    let ucCount = 1;
    let skipChars = 0;
    const out = [];
    const len = raw.length;

    for (let i = 0; i < len; i++) {
        const ch = raw[i];
        if (ch === '{') {
            stack.push({ uc: ucCount });
            // Revisar si inicia destino ignorado: {\*\... o {\fonttbl...
            let j = i + 1;
            while (j < len && (raw[j] === ' ' || raw[j] === '\r' || raw[j] === '\n')) j++;
            if (skipDepth === -1 && raw[j] === '\\') {
                if (raw[j + 1] === '*') {
                    skipDepth = stack.length;
                } else {
                    let k = j + 1;
                    while (k < len && /[a-zA-Z]/.test(raw[k])) k++;
                    const word = raw.slice(j + 1, k);
                    if (skipDestinations.has(word)) {
                        skipDepth = stack.length;
                    }
                }
            }
            continue;
        }
        if (ch === '}') {
            if (skipDepth === stack.length) {
                skipDepth = -1;
            }
            const popped = stack.pop();
            if (popped) ucCount = popped.uc;
            continue;
        }
        if (skipDepth !== -1) continue;
        if (ch === '\r' || ch === '\n') continue;

        if (ch === '\\') {
            i++;
            if (i >= len) break;
            const next = raw[i];
            if (next === '\\' || next === '{' || next === '}') {
                if (skipChars > 0) skipChars--;
                else out.push(next);
                continue;
            }
            if (next === '~') {
                out.push(' ');
                continue;
            }
            if (next === '-' || next === '_') {
                out.push(next === '_' ? '-' : '');
                continue;
            }
            if (next === "'") {
                const hex = raw.slice(i + 1, i + 3);
                if (/^[0-9a-fA-F]{2}$/.test(hex)) {
                    const byte = parseInt(hex, 16);
                    i += 2;
                    if (skipChars > 0) {
                        skipChars--;
                    } else {
                        out.push(cp1252Extra[byte] || String.fromCharCode(byte));
                    }
                }
                continue;
            }
            if (next === '\r' || next === '\n') {
                out.push('\n');
                continue;
            }
            let wordEnd = i;
            while (wordEnd < len && /[a-zA-Z]/.test(raw[wordEnd])) wordEnd++;
            const word = raw.slice(i, wordEnd);
            let paramEnd = wordEnd;
            if (paramEnd < len && (raw[paramEnd] === '-' || /\d/.test(raw[paramEnd]))) {
                paramEnd++;
                while (paramEnd < len && /\d/.test(raw[paramEnd])) paramEnd++;
            }
            const paramStr = raw.slice(wordEnd, paramEnd);
            i = paramEnd;
            if (i < len && raw[i] === ' ') {
                // El espacio delimitador pertenece al control word
            } else {
                i--;
            }

            if (word === 'par' || word === 'line') {
                out.push('\n');
            } else if (word === 'tab') {
                out.push('\t');
            } else if (word === 'emdash') {
                out.push('—');
            } else if (word === 'endash') {
                out.push('–');
            } else if (word === 'lquote' || word === 'rquote') {
                out.push("'");
            } else if (word === 'ldblquote' || word === 'rdblquote') {
                out.push('"');
            } else if (word === 'bullet') {
                out.push('•');
            } else if (word === 'uc' && paramStr) {
                ucCount = Math.max(0, parseInt(paramStr, 10) || 0);
            } else if (word === 'u' && paramStr) {
                let code = parseInt(paramStr, 10);
                if (code < 0) code += 65536;
                if (Number.isFinite(code) && code >= 0) {
                    out.push(String.fromCharCode(code));
                }
                skipChars = ucCount;
            }
            continue;
        }

        if (skipChars > 0) {
            skipChars--;
            continue;
        }
        out.push(ch);
    }

    return out
        .join('')
        .replace(/[ \t]+\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

async function extractPdfTextFromMediaBuffer(buffer) {
    if (!Buffer.isBuffer(buffer) || buffer.length === 0) return '';
    const pdfLib = require('pdf-parse');
    const PDFParseClass = pdfLib?.PDFParse || (pdfLib?.default && pdfLib.default.PDFParse);
    if (typeof PDFParseClass === 'function') {
        const parser = new PDFParseClass({ data: buffer });
        try {
            const pdfData = await parser.getText();
            return (pdfData && pdfData.text) ? String(pdfData.text).trim() : '';
        } finally {
            if (typeof parser.destroy === 'function') {
                try {
                    await parser.destroy();
                } catch (_) {}
            }
        }
    }
    if (typeof pdfLib === 'function') {
        const pdfData = await pdfLib(buffer);
        return (pdfData && pdfData.text) ? String(pdfData.text).trim() : '';
    }
    if (pdfLib?.default && typeof pdfLib.default === 'function') {
        const pdfData = await pdfLib.default(buffer);
        return (pdfData && pdfData.text) ? String(pdfData.text).trim() : '';
    }
    return '';
}

async function extractSpreadsheetTextFromMediaBuffer(buffer, filename = '', mimeType = '') {
    const lowerName = String(filename || '').toLowerCase();
    const lowerMime = String(mimeType || '').toLowerCase();
    const isClassicOrOds =
        lowerName.endsWith('.xls') ||
        lowerName.endsWith('.ods') ||
        lowerName.endsWith('.xlsb') ||
        lowerMime === 'application/vnd.ms-excel' ||
        lowerMime === 'application/vnd.oasis.opendocument.spreadsheet';

    if (!isClassicOrOds) {
        try {
            const ExcelJS = require('exceljs');
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.load(buffer);
            let excelText = '';
            workbook.eachSheet((worksheet) => {
                excelText += `\n--- Hoja: ${worksheet.name} ---\n`;
                worksheet.eachRow((row, rowNumber) => {
                    const rowVals = Array.isArray(row.values) ? row.values.slice(1).join(' | ') : '';
                    if (rowVals.trim()) {
                        excelText += `Fila ${rowNumber}: ${rowVals}\n`;
                    }
                });
            });
            if (excelText.trim()) {
                return excelText;
            }
        } catch (err) {
            console.warn('[Tenshi Media] ExcelJS extraction fallback to xlsx:', err.message);
        }
    }

    try {
        const XLSX = require('xlsx');
        const wb = XLSX.read(buffer, { type: 'buffer', cellDates: true });
        let xlsxText = '';
        for (const sheetName of wb.SheetNames || []) {
            const ws = wb.Sheets[sheetName];
            if (!ws) continue;
            const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: '' });
            let sheetBody = '';
            for (let rIdx = 0; rIdx < rows.length; rIdx++) {
                const row = Array.isArray(rows[rIdx]) ? rows[rIdx] : [];
                const cells = row.map((c) => (c === null || c === undefined ? '' : String(c).trim()));
                if (cells.some(Boolean)) {
                    sheetBody += `Fila ${rIdx + 1}: ${cells.join(' | ')}\n`;
                }
            }
            if (sheetBody.trim()) {
                xlsxText += `\n--- Hoja: ${sheetName} ---\n${sheetBody}`;
            }
        }
        if (xlsxText.trim()) {
            return xlsxText;
        }
    } catch (xlsxErr) {
        console.warn('[Tenshi Media] SheetJS (xlsx) extraction error:', xlsxErr.message);
    }
    return '';
}

async function extractTextFromMedia(mediaObj) {
    if (!mediaObj || typeof mediaObj !== 'object') return '';
    try {
        let mimeType = String(mediaObj.mimeType || mediaObj.mimetype || '').trim().toLowerCase();
        const filename = String(mediaObj.name || mediaObj.fileName || '').trim().toLowerCase();
        let buffer = null;

        if (Buffer.isBuffer(mediaObj.buffer) && mediaObj.buffer.length > 0) {
            buffer = mediaObj.buffer;
        } else if (typeof mediaObj.dataUrl === 'string' && mediaObj.dataUrl.trim()) {
            const parsed = parseDataUrlParts(mediaObj.dataUrl);
            if (parsed) {
                if (parsed.mimeType && parsed.mimeType !== 'application/octet-stream') {
                    mimeType = mimeType && mimeType !== 'application/octet-stream' ? mimeType : parsed.mimeType;
                }
                if (parsed.isBase64) {
                    buffer = Buffer.from(parsed.payload, 'base64');
                } else {
                    let decoded = parsed.payload;
                    try {
                        decoded = decodeURIComponent(parsed.payload);
                    } catch (_) {}
                    buffer = Buffer.from(decoded, 'utf-8');
                }
            }
        } else if (typeof mediaObj.base64 === 'string' && mediaObj.base64.trim()) {
            const cleanB64 = mediaObj.base64.trim().replace(/^data:[^,]+,/, '').replace(/\s+/g, '');
            buffer = Buffer.from(cleanB64, 'base64');
        }

        if (!mimeType || mimeType === 'application/octet-stream') {
            const extMime = TENSHI_EXTENSION_TO_MIME[getMediaFileExtension(filename)];
            if (extMime) mimeType = extMime;
        }

        if (!buffer || buffer.length === 0) {
            if (typeof mediaObj.content === 'string' && mediaObj.content.trim()) {
                return mediaObj.content;
            }
            return '';
        }

        // 1. RTF documents (.rtf) — evaluar antes de text/* para no entregar código RTF crudo
        if (filename.endsWith('.rtf') || mimeType === 'application/rtf' || mimeType === 'text/rtf') {
            return extractRtfText(buffer);
        }

        // 2. Text, code, HTML & SVG formats (.txt, .csv, .md, .json, .xml, .log, .yaml, .yml, .sql, .html, .htm, .svg)
        if (
            mimeType.startsWith('text/') ||
            mimeType === 'image/svg+xml' ||
            mimeType.includes('csv') ||
            mimeType === 'application/json' ||
            mimeType === 'application/ld+json' ||
            mimeType === 'application/xml' ||
            mimeType === 'application/xhtml+xml' ||
            mimeType === 'application/javascript' ||
            mimeType === 'application/x-yaml' ||
            mimeType === 'application/sql' ||
            /\.(txt|csv|tsv|md|markdown|json|xml|log|ya?ml|sql|html?|svg|ini|conf|js|mjs|cjs|ts|tsx|jsx|py|sh|css)$/i.test(filename)
        ) {
            return buffer.toString('utf-8');
        }

        // 3. Word documents (.docx)
        if (filename.endsWith('.docx') || mimeType.includes('wordprocessingml.document')) {
            try {
                const mammoth = require('mammoth');
                const result = await mammoth.extractRawText({ buffer });
                if (result && result.value) {
                    return result.value;
                }
            } catch (err) {
                console.warn('[Tenshi Media] Mammoth extraction error:', err.message);
            }
        }

        // 4. Spreadsheets (.xlsx, .xls, .ods) — ExcelJS + SheetJS fallback
        if (
            /\.(xlsx|xls|xlsm|xlsb|ods)$/i.test(filename) ||
            mimeType.includes('spreadsheetml') ||
            mimeType === 'application/vnd.ms-excel' ||
            mimeType === 'application/vnd.oasis.opendocument.spreadsheet'
        ) {
            const sheetText = await extractSpreadsheetTextFromMediaBuffer(buffer, filename, mimeType);
            if (sheetText) return sheetText;
        }

        // 5. PDF documents (.pdf) text fallback (pdf-parse v2 y v1)
        if (filename.endsWith('.pdf') || mimeType === 'application/pdf') {
            try {
                const pdfText = await extractPdfTextFromMediaBuffer(buffer);
                if (pdfText) return pdfText;
            } catch (err) {
                console.warn('[Tenshi Media] PDF parse text fallback error:', err.message);
            }
        }
    } catch (e) {
        console.error('[Tenshi Media] Error extracting text from media:', e);
    }
    return '';
}

function allocateCharBudgets(lengths, totalBudget = TOTAL_GEMINI_TEXT_CHAR_BUDGET, minFloor = MIN_GEMINI_TEXT_CHARS_PER_DOC) {
    const n = lengths.length;
    if (n === 0) return [];
    const totalNeeded = lengths.reduce((acc, l) => acc + l, 0);
    if (totalNeeded <= totalBudget) {
        return [...lengths];
    }
    const effectiveFloor = n * minFloor <= totalBudget ? minFloor : Math.floor(totalBudget / n);
    const alloc = lengths.map((len) => Math.min(len, effectiveFloor));
    let remaining = totalBudget - alloc.reduce((acc, a) => acc + a, 0);

    // Repartir el remanente de forma proporcional a la demanda insatisfecha (water-filling)
    for (let pass = 0; pass < 3 && remaining > 0; pass++) {
        const unmetTotal = lengths.reduce((acc, len, idx) => acc + Math.max(0, len - alloc[idx]), 0);
        if (unmetTotal <= 0) break;
        let distributedInPass = 0;
        for (let idx = 0; idx < n && remaining > 0; idx++) {
            const unmet = Math.max(0, lengths[idx] - alloc[idx]);
            if (unmet <= 0) continue;
            const share = Math.min(unmet, Math.floor((remaining * unmet) / unmetTotal));
            if (share > 0) {
                alloc[idx] += share;
                distributedInPass += share;
            }
        }
        remaining -= distributedInPass;
        if (distributedInPass === 0) break;
    }

    // Asignar últimos caracteres por redondeo
    for (let idx = 0; idx < n && remaining > 0; idx++) {
        const unmet = Math.max(0, lengths[idx] - alloc[idx]);
        if (unmet > 0) {
            const extra = Math.min(unmet, remaining);
            alloc[idx] += extra;
            remaining -= extra;
        }
    }
    return alloc;
}

function buildGeminiUserParts({
    lastUserMsg = '',
    attachments = [],
    extractedTexts = [],
    maxInlineBytes = MAX_GEMINI_INLINE_BYTES,
    totalTextBudget = TOTAL_GEMINI_TEXT_CHAR_BUDGET,
    minTextPerDoc = MIN_GEMINI_TEXT_CHARS_PER_DOC,
}) {
    const list = Array.isArray(attachments) ? attachments : [];
    const userParts = [{ text: lastUserMsg || ' ' }];
    if (list.length === 0) {
        return { userParts, inlineBytesUsed: 0, includedInlineCount: 0, omittedInlineCount: 0 };
    }

    const prepared = list.map((att, idx) => {
        const rawExtracted = typeof extractedTexts[idx] === 'string' && extractedTexts[idx].trim()
            ? extractedTexts[idx].trim()
            : typeof att?.content === 'string' && att.content.trim()
                ? att.content.trim()
                : '';

        let inlineMime = '';
        let inlineBase64 = '';
        let decodedBytes = 0;
        let isVideoKeyframe = false;

        const parsedDataUrl = parseDataUrlParts(att?.dataUrl);
        if (parsedDataUrl && parsedDataUrl.isBase64 && parsedDataUrl.payload) {
            inlineBase64 = parsedDataUrl.payload;
            inlineMime = parsedDataUrl.mimeType;
        } else if (typeof att?.base64 === 'string' && att.base64.trim()) {
            inlineBase64 = att.base64.trim().replace(/^data:[^,]+,/, '').replace(/\s+/g, '');
            inlineMime = String(att.mimeType || '').toLowerCase();
        } else if (Buffer.isBuffer(att?.buffer) && att.buffer.length > 0) {
            inlineBase64 = att.buffer.toString('base64');
            inlineMime = String(att.mimeType || '').toLowerCase();
        } else if (typeof att?.dataUrl === 'string' && att.dataUrl.trim().length > 50 && !att.dataUrl.trim().startsWith('data:') && !att.dataUrl.trim().startsWith('http')) {
            inlineBase64 = att.dataUrl.trim().replace(/\s+/g, '');
            inlineMime = String(att.mimeType || 'image/jpeg').toLowerCase();
        }

        const attMimeLower = String(att?.mimeType || '').toLowerCase();
        if ((att?.type === 'video' || attMimeLower.startsWith('video/')) && inlineMime.startsWith('image/') && inlineMime !== 'image/svg+xml') {
            isVideoKeyframe = true;
        } else if (!inlineMime || inlineMime === 'application/octet-stream') {
            inlineMime = attMimeLower;
        }

        const isGeminiNativeBinary = Boolean(
            inlineBase64 &&
            inlineMime &&
            inlineMime !== 'image/svg+xml' &&
            (
                inlineMime.startsWith('image/') ||
                inlineMime.startsWith('video/') ||
                inlineMime.startsWith('audio/') ||
                inlineMime === 'application/pdf'
            )
        );

        if (isGeminiNativeBinary) {
            const pad = inlineBase64.endsWith('==') ? 2 : inlineBase64.endsWith('=') ? 1 : 0;
            decodedBytes = Math.max(0, Math.floor((inlineBase64.length * 3) / 4) - pad);
        }

        const isPdfWithExtractedText = inlineMime === 'application/pdf' && rawExtracted.length >= 45;

        return {
            att,
            idx,
            extractedText: rawExtracted,
            inlineMime,
            inlineBase64,
            decodedBytes,
            isVideoKeyframe,
            isGeminiNativeBinary,
            isPdfWithExtractedText,
            includeInline: false,
            omittedByBudget: false,
        };
    });

    // Presupuesto acumulado de inlineData en 2 niveles:
    // Nivel 1: Archivos visuales/audio/video y PDFs escaneados sin OCR (<45 chars de texto)
    // Nivel 2: PDFs que ya cuentan con texto extraído
    let inlineBytesUsed = 0;
    const tier1 = prepared.filter((p) => p.isGeminiNativeBinary && !p.isPdfWithExtractedText);
    const tier2 = prepared.filter((p) => p.isGeminiNativeBinary && p.isPdfWithExtractedText);

    for (const item of [...tier1, ...tier2]) {
        if (item.decodedBytes > 0 && inlineBytesUsed + item.decodedBytes <= maxInlineBytes) {
            item.includeInline = true;
            inlineBytesUsed += item.decodedBytes;
        } else {
            item.omittedByBudget = true;
        }
    }

    // Presupuesto proporcional de texto entre documentos con texto extraído
    const textEntries = prepared.filter((p) => p.extractedText.length > 0);
    const charBudgets = allocateCharBudgets(
        textEntries.map((p) => p.extractedText.length),
        totalTextBudget,
        minTextPerDoc
    );
    const charLimitByIdx = new Map();
    textEntries.forEach((p, pos) => {
        charLimitByIdx.set(p.idx, charBudgets[pos]);
    });

    let includedInlineCount = 0;
    let omittedInlineCount = 0;
    const totalCount = prepared.length;

    for (const item of prepared) {
        const { att } = item;
        const displayName = att?.name || `archivo_${item.idx + 1}`;
        const displayMime = att?.mimeType || item.inlineMime || 'application/octet-stream';
        const sizeStr = att?.size ? ` | ${Math.round(att.size / 1024)} KB` : '';
        const videoNote = item.isVideoKeyframe
            ? ' (Nota: se envía fotograma clave representativo image/jpeg de este video)'
            : '';

        userParts.push({
            text: `\n📎 [Archivo adjunto ${item.idx + 1}/${totalCount}: "${displayName}" | ${displayMime}${sizeStr}]${videoNote}`,
        });

        if (item.includeInline) {
            userParts.push({
                inlineData: {
                    mimeType: item.inlineMime,
                    data: item.inlineBase64,
                },
            });
            includedInlineCount++;
        } else if (item.omittedByBudget) {
            omittedInlineCount++;
            const sizeMb = (item.decodedBytes / (1024 * 1024)).toFixed(2);
            const noteText = item.extractedText
                ? `[Nota: El binario "${displayName}" (${sizeMb} MB) se omitió del inlineData para respetar el presupuesto multimodal de Gemini; se entrega su texto extraído completo a continuación.]`
                : `[Nota: El binario "${displayName}" (${sizeMb} MB) excedió el presupuesto acumulado de inlineData (${Math.round(maxInlineBytes / (1024 * 1024))} MB) y se omitió para evitar rechazo HTTP 400.]`;
            userParts.push({ text: noteText });
        }

        if (item.extractedText) {
            const limit = charLimitByIdx.get(item.idx) ?? totalTextBudget;
            const truncated = item.extractedText.length > limit
                ? item.extractedText.substring(0, limit) + '\n... [Contenido truncado por longitud]'
                : item.extractedText;
            userParts.push({
                text: `\n📄 [CONTENIDO DEL ARCHIVO ADJUNTO "${displayName}"]:\n\`\`\`\n${truncated}\n\`\`\`\n`,
            });
        }
    }

    return {
        userParts,
        inlineBytesUsed,
        includedInlineCount,
        omittedInlineCount,
    };
}

router.extractTextFromMedia = extractTextFromMedia;
router.normalizeIncomingMediaList = normalizeIncomingMediaList;
router.normalizeIncomingMediaPayload = normalizeIncomingMediaPayload;
router.buildMediaFieldsForDb = buildMediaFieldsForDb;
router.buildGeminiUserParts = buildGeminiUserParts;
router.MAX_GEMINI_INLINE_BYTES = MAX_GEMINI_INLINE_BYTES;
router.TENSHI_DB_MEDIA_BUDGET_BYTES = TENSHI_DB_MEDIA_BUDGET_BYTES;

function cleanEvidenceText(val) {
    if (val === null || val === undefined) return '';
    if (typeof val === 'object') return '';
    const str = String(val).trim();
    if (!str || str === 'undefined' || str === 'null' || str === '[object Object]') return '';
    return str;
}

function cleanEvidenceUrl(val) {
    const str = cleanEvidenceText(val);
    if (!str || str.startsWith('data:')) return null;
    return str;
}

function mergeSanitizedEvidenceFiles(existingList = [], incomingList = []) {
    const merged = Array.isArray(existingList) ? [...existingList] : [];
    const seen = new Set(
        merged
            .map((item) => item?.pdfUrl || item?.imageUrl || item?.pdfFileName || '')
            .filter(Boolean)
    );
    if (!Array.isArray(incomingList)) return merged;

    for (const raw of incomingList) {
        if (!raw || typeof raw !== 'object') continue;
        const pdfUrl = cleanEvidenceUrl(raw.pdfUrl);
        const pdfDownloadUrl = cleanEvidenceUrl(raw.pdfDownloadUrl);
        const pdfAbsoluteUrl = cleanEvidenceUrl(raw.pdfAbsoluteUrl);
        const pdfFileName = cleanEvidenceText(raw.pdfFileName) || null;
        const imageUrl = cleanEvidenceUrl(raw.imageUrl);
        const imageDownloadUrl = cleanEvidenceUrl(raw.imageDownloadUrl);
        const imageAbsoluteUrl = cleanEvidenceUrl(raw.imageAbsoluteUrl);
        const imageFileName = cleanEvidenceText(raw.imageFileName) || null;

        if (
            !pdfUrl &&
            !pdfDownloadUrl &&
            !pdfAbsoluteUrl &&
            !imageUrl &&
            !imageDownloadUrl &&
            !imageAbsoluteUrl &&
            !pdfFileName &&
            !imageFileName
        ) {
            continue;
        }

        const dedupKey = pdfUrl || imageUrl || pdfFileName || imageFileName || `${pdfDownloadUrl || ''}:${imageDownloadUrl || ''}`;
        if (dedupKey && seen.has(dedupKey)) continue;
        if (dedupKey) seen.add(dedupKey);

        merged.push({
            title: cleanEvidenceText(raw.title),
            portal: cleanEvidenceText(raw.portal),
            workerName: cleanEvidenceText(raw.workerName),
            cedula: cleanEvidenceText(raw.cedula),
            cargo: cleanEvidenceText(raw.cargo),
            pdfUrl,
            pdfDownloadUrl,
            pdfAbsoluteUrl,
            pdfFileName,
            imageUrl,
            imageDownloadUrl,
            imageAbsoluteUrl,
            imageFileName,
        });
    }
    return merged;
}

function formatTenshiMessageDto(m) {
    return {
        _id: m._id,
        companyId: m.companyId || null,
        conversationId: m.conversationId || null,
        role: m.role,
        content: m.content,
        image: m.image,
        media: m.media,
        attachments: Array.isArray(m.attachments) && m.attachments.length > 0 ? m.attachments : undefined,
        htmlReport: m.htmlReport,
        file: m.file,
        qrCode: m.qrCode,
        widget: m.widget,
        ...(Array.isArray(m.evidenceFiles) && m.evidenceFiles.length > 0
            ? { evidenceFiles: mergeSanitizedEvidenceFiles([], m.evidenceFiles) }
            : {}),
        createdAt: m.createdAt,
    };
}

function formatTenshiConversationDto(c) {
    if (!c) return null;
    const obj = typeof c.toObject === 'function' ? c.toObject() : c;
    return {
        _id: String(obj._id),
        id: String(obj._id),
        user: obj.user ? String(obj.user) : null,
        companyId: obj.companyId || null,
        title: obj.title || 'Nuevo chat',
        lastMessageAt: obj.lastMessageAt || obj.updatedAt || obj.createdAt,
        messageCount: Number(obj.messageCount || 0),
        modelOverride: obj.modelOverride || null,
        isLegacyDefault: Boolean(obj.isLegacyDefault),
        createdAt: obj.createdAt,
        updatedAt: obj.updatedAt,
    };
}

function resolveTenshiUserContext(req) {
    const targetUserId = (req.user?.isSubUser && req.user?.parentUser)
        ? String(req.user.parentUser)
        : String(req.user?.id || req.user?._id);
    const reqUserId = String(req.user?.id || req.user?._id || targetUserId);
    const userIds = [...new Set([reqUserId, targetUserId].filter(Boolean))];
    return { reqUserId, targetUserId, userIds };
}

// =========================================================================
// MULTI-CHAT DE TENSHI (CONVERSACIONES CRUD — 100% RETROCOMPATIBLE)
// =========================================================================

router.get('/conversations', requireJwtAuth, async (req, res) => {
    try {
        const { reqUserId, targetUserId, userIds } = resolveTenshiUserContext(req);
        const activeComp = await resolveActiveCompanyForUser(targetUserId, req.query.companyId);
        const companyIdStr = activeComp?._id ? String(activeComp._id) : null;

        await ensureLegacyTenshiConversation({
            TenshiConversation,
            TenshiMessage,
            userIds,
            ownerUserId: reqUserId,
            companyIdStr,
        });

        const scope = buildCompanyScopeFilter(userIds, companyIdStr);
        const convos = await TenshiConversation.find(scope)
            .sort({ lastMessageAt: -1, updatedAt: -1 })
            .limit(100)
            .lean();

        const formatted = convos.map(formatTenshiConversationDto);
        const activeDefaultId = formatted.length > 0 ? formatted[0]._id : null;

        res.json({
            conversations: formatted,
            activeDefaultId,
        });
    } catch (error) {
        console.error('Error listing Tenshi conversations:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.post('/conversations', requireJwtAuth, async (req, res) => {
    try {
        const { reqUserId, targetUserId } = resolveTenshiUserContext(req);
        const { companyId, title, modelOverride } = req.body || {};
        const activeComp = await resolveActiveCompanyForUser(targetUserId, companyId);
        const companyIdStr = activeComp?._id ? String(activeComp._id) : null;

        const cleanTitle =
            typeof title === 'string' && title.trim().length > 0
                ? title.trim().slice(0, 120)
                : 'Nuevo chat';
        const validModelOverride = sanitizeRequestedTenshiModel(modelOverride);

        const created = await TenshiConversation.create({
            user: reqUserId,
            companyId: companyIdStr,
            title: cleanTitle,
            lastMessageAt: new Date(),
            messageCount: 0,
            modelOverride: validModelOverride,
            isLegacyDefault: false,
        });

        res.status(201).json({ conversation: formatTenshiConversationDto(created) });
    } catch (error) {
        console.error('Error creating Tenshi conversation:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.patch('/conversations/:id', requireJwtAuth, async (req, res) => {
    try {
        const convoId = String(req.params.id || '').trim();
        if (!mongoose.isValidObjectId(convoId)) {
            return res.status(400).json({ error: 'Invalid conversation ID' });
        }
        const { userIds } = resolveTenshiUserContext(req);
        const convo = await TenshiConversation.findOne({
            _id: convoId,
            user: { $in: userIds },
        });
        if (!convo) {
            return res.status(404).json({ error: 'Conversation not found' });
        }

        const { title, modelOverride } = req.body || {};
        if (title !== undefined) {
            const cleanTitle = String(title || '').replace(/\s+/g, ' ').trim().slice(0, 120);
            if (!cleanTitle) {
                return res.status(400).json({ error: 'Title must be between 1 and 120 characters' });
            }
            convo.title = cleanTitle;
        }
        if (modelOverride !== undefined) {
            convo.modelOverride = modelOverride ? sanitizeRequestedTenshiModel(modelOverride) : null;
        }

        await convo.save();
        res.json({ conversation: formatTenshiConversationDto(convo) });
    } catch (error) {
        console.error('Error updating Tenshi conversation:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.delete('/conversations/:id', requireJwtAuth, async (req, res) => {
    try {
        const convoId = String(req.params.id || '').trim();
        if (!mongoose.isValidObjectId(convoId)) {
            return res.status(400).json({ error: 'Invalid conversation ID' });
        }
        const { userIds } = resolveTenshiUserContext(req);
        const convo = await TenshiConversation.findOne({
            _id: convoId,
            user: { $in: userIds },
        });
        if (!convo) {
            return res.status(404).json({ error: 'Conversation not found' });
        }

        const delMsgRes = await TenshiMessage.deleteMany({
            user: { $in: userIds },
            conversationId: convoId,
        });
        await TenshiConversation.deleteOne({ _id: convo._id });

        res.json({
            success: true,
            deletedId: convoId,
            deletedMessages: delMsgRes?.deletedCount || 0,
        });
    } catch (error) {
        console.error('Error deleting Tenshi conversation:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

const getTenshiMessagesHistoryHandler = async (req, res) => {
    try {
        const { reqUserId, targetUserId, userIds } = resolveTenshiUserContext(req);
        const activeComp = await resolveActiveCompanyForUser(targetUserId, req.query.companyId);
        const companyIdStr = activeComp?._id ? String(activeComp._id) : null;
        const companyScope = buildCompanyScopeFilter(userIds, companyIdStr);

        await ensureLegacyTenshiConversation({
            TenshiConversation,
            TenshiMessage,
            userIds,
            ownerUserId: reqUserId,
            companyIdStr,
        });

        const requestedConvoId =
            typeof req.query.conversationId === 'string' ? req.query.conversationId.trim() : '';

        let resolvedConvo = null;
        let resolvedConvoId = null;
        let resolvedConvoTitle = 'Nuevo chat';

        if (requestedConvoId) {
            if (mongoose.isValidObjectId(requestedConvoId)) {
                resolvedConvo = await TenshiConversation.findOne({
                    _id: requestedConvoId,
                    user: { $in: userIds },
                }).lean();
            }
            resolvedConvoId = requestedConvoId;
            resolvedConvoTitle = resolvedConvo?.title || 'Chat de Tenshi';
        } else {
            resolvedConvo = await TenshiConversation.findOne(companyScope)
                .sort({ lastMessageAt: -1, updatedAt: -1 })
                .lean();
            if (resolvedConvo?._id) {
                resolvedConvoId = String(resolvedConvo._id);
                resolvedConvoTitle = resolvedConvo.title || 'Chat Principal';
            }
        }

        const history = resolvedConvoId
            ? await TenshiMessage.find({
                  $and: [companyScope, { conversationId: resolvedConvoId }],
              })
                  .sort({ createdAt: 1 })
                  .lean()
            : [];

        res.json({
            messages: history.map(formatTenshiMessageDto),
            conversationId: resolvedConvoId,
            conversationTitle: resolvedConvoTitle,
        });
    } catch (error) {
        console.error('Error fetching Tenshi history:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

router.get('/history', requireJwtAuth, getTenshiMessagesHistoryHandler);
router.get('/messages', requireJwtAuth, getTenshiMessagesHistoryHandler);

router.post('/message', requireJwtAuth, async (req, res) => {
    try {
        const {
            role = 'assistant',
            content,
            htmlReport,
            file,
            qrCode,
            widget,
            image,
            media,
            attachments,
            mediaList,
            files,
            companyId,
            conversationId,
            evidenceFiles,
            evidencias,
        } = req.body;
        if (!content || !content.trim()) {
            return res.status(400).json({ error: 'Content is required' });
        }
        const { reqUserId, targetUserId, userIds } = resolveTenshiUserContext(req);
        const activeComp = await resolveActiveCompanyForUser(targetUserId, companyId);
        const companyIdStr = activeComp?._id ? String(activeComp._id) : null;

        let targetConvoId =
            typeof conversationId === 'string' && conversationId.trim() ? conversationId.trim() : null;
        let convoDoc = null;
        if (targetConvoId && mongoose.isValidObjectId(targetConvoId)) {
            convoDoc = await TenshiConversation.findOne({
                _id: targetConvoId,
                user: { $in: userIds },
            });
        }
        if (!convoDoc && !targetConvoId) {
            await ensureLegacyTenshiConversation({
                TenshiConversation,
                TenshiMessage,
                userIds,
                ownerUserId: reqUserId,
                companyIdStr,
            });
            convoDoc = await TenshiConversation.findOne(buildCompanyScopeFilter(userIds, companyIdStr)).sort({
                lastMessageAt: -1,
                updatedAt: -1,
            });
            if (!convoDoc) {
                convoDoc = await TenshiConversation.create({
                    user: reqUserId,
                    companyId: companyIdStr,
                    title: role === 'user' ? generateSmartTenshiTitle(content) : 'Chat Principal',
                    lastMessageAt: new Date(),
                    messageCount: 0,
                    isLegacyDefault: false,
                });
            }
            targetConvoId = String(convoDoc._id);
        }

        const sanitizedEvidenceFiles = mergeSanitizedEvidenceFiles(
            [],
            Array.isArray(evidenceFiles) ? evidenceFiles : evidencias
        );
        const normalizedMediaList = normalizeIncomingMediaList(
            { attachments, mediaList, files, media, image },
            { requirePayload: false }
        );
        const { attachmentsForDb, mediaForDb, imageForDb } = buildMediaFieldsForDb(normalizedMediaList, image);
        const newMsg = await TenshiMessage.create({
            user: req.user.id,
            companyId: companyIdStr,
            conversationId: targetConvoId,
            role,
            content: content.trim(),
            image: imageForDb,
            media: mediaForDb,
            ...(attachmentsForDb.length > 0 ? { attachments: attachmentsForDb } : {}),
            htmlReport,
            file,
            qrCode,
            widget,
            ...(sanitizedEvidenceFiles.length > 0 ? { evidenceFiles: sanitizedEvidenceFiles } : {}),
        });
        if (convoDoc?._id) {
            const updateFields = { lastMessageAt: new Date() };
            if (role === 'user' && convoDoc.title === 'Nuevo chat') {
                updateFields.title = generateSmartTenshiTitle(content, attachmentsForDb);
            }
            await TenshiConversation.updateOne(
                { _id: convoDoc._id },
                { $set: updateFields, $inc: { messageCount: 1 } }
            ).catch(() => {});
        }
        res.json(newMsg);
    } catch (error) {
        console.error('Error creating Tenshi message:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// =========================================================================
// GOBERNANZA HUMAN-IN-THE-LOOP (HITL) & MEMORIA PROCEDURAL (OPENBOT ENGINE)
// =========================================================================

router.get('/governance/pending', requireJwtAuth, async (req, res) => {
    try {
        const targetUserId = (req.user?.isSubUser && req.user?.parentUser) ? String(req.user.parentUser) : String(req.user?.id || req.user?._id);
        const userIds = [req.user.id, targetUserId].filter(Boolean);
        const activeComp = await resolveActiveCompanyForUser(targetUserId, req.query.companyId);
        const pending = await TenshiPendingAction.find({
            user: { $in: userIds },
            ...(activeComp?._id ? { companyId: String(activeComp._id) } : {}),
            status: 'pendiente_aprobacion',
        }).sort({ createdAt: -1 }).limit(20).lean();
        res.json(pending);
    } catch (error) {
        logger.error('[Tenshi Governance] Error fetching pending actions:', error);
        res.status(500).json({ error: 'Error consultando acciones pendientes' });
    }
});

router.post('/governance/:id/approve', requireJwtAuth, async (req, res) => {
    try {
        const actionId = req.params.id;
        const targetUserId = (req.user?.isSubUser && req.user?.parentUser) ? String(req.user.parentUser) : String(req.user?.id || req.user?._id);
        const userIds = [req.user.id, targetUserId].filter(Boolean);

        const pendingAction = await TenshiPendingAction.findOne({
            _id: actionId,
            user: { $in: userIds },
        });

        if (!pendingAction) {
            return res.status(404).json({ error: 'Solicitud de aprobación no encontrada.' });
        }

        if (pendingAction.status !== 'pendiente_aprobacion') {
            return res.json({
                success: true,
                alreadyProcessed: true,
                status: pendingAction.status,
                action: pendingAction,
            });
        }

        const customArgs = req.body?.args ? { ...pendingAction.args, ...req.body.args } : { ...pendingAction.args };
        if (pendingAction.companyId && !customArgs.companyId && !customArgs._companyId) {
            customArgs.companyId = pendingAction.companyId;
            customArgs._companyId = pendingAction.companyId;
        }
        if (
            (pendingAction.toolName === 'wappy_delegar_orden_antigravity' ||
                pendingAction.toolName === 'delegar_orden_antigravity') &&
            !customArgs.sourceModule
        ) {
            customArgs.sourceModule = 'tenshi_chat';
            customArgs.remitente = customArgs.remitente || 'Tenshi Chat Escrito';
        }
        const execResult = await executeTenshiMcpTool(
            pendingAction.toolName,
            {
                ...customArgs,
                _hitlApproved: true,
                ...(pendingAction.companyId ? { _companyId: pendingAction.companyId } : {}),
            },
            targetUserId
        );

        pendingAction.status = execResult?.error ? 'error' : 'aprobada';
        pendingAction.decidedAt = new Date();
        pendingAction.decidedBy = req.user.name || req.user.username || 'Responsable SST';
        pendingAction.executionResult = execResult;
        if (execResult?.error) {
            pendingAction.errorMessage = String(execResult.error);
        }
        await pendingAction.save();

        // Actualizar el estado del widget dentro de TenshiMessage para persistencia en recargas
        await TenshiMessage.updateMany(
            { 'widget.actionId': String(actionId) },
            {
                $set: {
                    'widget.status': pendingAction.status,
                    'widget.data.status': pendingAction.status,
                    'widget.data.decidedBy': pendingAction.decidedBy,
                    'widget.data.decidedAt': pendingAction.decidedAt,
                    'widget.data.executionResult': execResult,
                },
            }
        ).catch(() => {});

        res.json({
            success: !execResult?.error,
            status: pendingAction.status,
            action: pendingAction,
            result: execResult,
        });
    } catch (error) {
        logger.error('[Tenshi Governance] Error approving action:', error);
        res.status(500).json({ error: error.message || 'Error ejecutando la acción autorizada' });
    }
});

router.post('/governance/:id/reject', requireJwtAuth, async (req, res) => {
    try {
        const actionId = req.params.id;
        const targetUserId = (req.user?.isSubUser && req.user?.parentUser) ? String(req.user.parentUser) : String(req.user?.id || req.user?._id);
        const userIds = [req.user.id, targetUserId].filter(Boolean);

        const pendingAction = await TenshiPendingAction.findOne({
            _id: actionId,
            user: { $in: userIds },
        });

        if (!pendingAction) {
            return res.status(404).json({ error: 'Solicitud no encontrada.' });
        }

        pendingAction.status = 'rechazada';
        pendingAction.decidedAt = new Date();
        pendingAction.decidedBy = req.user.name || req.user.username || 'Responsable SST';
        await pendingAction.save();

        await TenshiMessage.updateMany(
            { 'widget.actionId': String(actionId) },
            {
                $set: {
                    'widget.status': 'rechazada',
                    'widget.data.status': 'rechazada',
                    'widget.data.decidedBy': pendingAction.decidedBy,
                    'widget.data.decidedAt': pendingAction.decidedAt,
                },
            }
        ).catch(() => {});

        res.json({
            success: true,
            status: 'rechazada',
            action: pendingAction,
        });
    } catch (error) {
        logger.error('[Tenshi Governance] Error rejecting action:', error);
        res.status(500).json({ error: error.message || 'Error rechazando la acción' });
    }
});

router.get('/procedural-memory', requireJwtAuth, async (req, res) => {
    try {
        const targetUserId = (req.user?.isSubUser && req.user?.parentUser) ? String(req.user.parentUser) : String(req.user?.id || req.user?._id);
        const activeComp = await resolveActiveCompanyForUser(targetUserId, req.query.companyId);
        const includeInactive = req.query.includeInactive === 'true' || req.query.all === 'true';
        const filter = includeInactive ? { user: targetUserId } : { user: targetUserId, isActive: true };
        if (activeComp?._id) {
            const strId = String(activeComp._id);
            filter.companyId = mongoose.Types.ObjectId.isValid(strId)
                ? { $in: [strId, new mongoose.Types.ObjectId(strId)] }
                : strId;
        } else {
            filter.$or = [{ companyId: null }, { companyId: { $exists: false } }];
        }
        const habits = await TenshiProceduralMemory.find(filter)
            .sort({ updatedAt: -1 })
            .limit(50)
            .lean();
        res.json(habits.map((h) => ({
            id: String(h._id),
            _id: String(h._id),
            companyId: h.companyId ? String(h.companyId) : null,
            category: h.category,
            trigger: h.trigger,
            rule: h.rule,
            isActive: h.isActive !== false,
            usageCount: h.usageCount || 0,
            companyName: h.companyName || '',
            updatedAt: h.updatedAt,
            createdAt: h.createdAt,
        })));
    } catch (error) {
        logger.error('[Tenshi Procedural Memory] Error listing habits:', error);
        res.status(500).json({ error: 'Error consultando memoria procedimental' });
    }
});

router.post('/procedural-memory', requireJwtAuth, async (req, res) => {
    try {
        const targetUserId = (req.user?.isSubUser && req.user?.parentUser) ? String(req.user.parentUser) : String(req.user?.id || req.user?._id);
        const { trigger, rule, category = 'habito_operativo', companyId, companyName } = req.body;
        if (!trigger || !rule) {
            return res.status(400).json({ error: 'Se requiere trigger y rule.' });
        }
        const activeComp = await resolveActiveCompanyForUser(targetUserId, companyId || req.query.companyId);
        const effectiveCompanyId = companyId ? String(companyId) : (activeComp?._id ? String(activeComp._id) : null);
        const effectiveCompanyName = companyName || activeComp?.companyName || '';
        const out = await manageProceduralMemory(
            { accion: 'guardar', trigger, regla: rule, categoria: category },
            targetUserId,
            effectiveCompanyId,
            effectiveCompanyName
        );
        if (out.widget?.data?.items) {
            const msgFilter = {
                user: { $in: [req.user.id, targetUserId].filter(Boolean) },
                'widget.widgetType': 'procedural_memory',
                ...(effectiveCompanyId ? { companyId: effectiveCompanyId } : {}),
            };
            await TenshiMessage.updateMany(
                msgFilter,
                { $set: { 'widget.data.items': out.widget.data.items, 'widget.data.habits': out.widget.data.items } }
            ).catch(() => {});
        }
        res.json({ ...out.result, widget: out.widget });
    } catch (error) {
        logger.error('[Tenshi Procedural Memory] Error creating habit:', error);
        res.status(500).json({ error: error.message });
    }
});

router.put('/procedural-memory/:id', requireJwtAuth, async (req, res) => {
    try {
        const targetUserId = (req.user?.isSubUser && req.user?.parentUser) ? String(req.user.parentUser) : String(req.user?.id || req.user?._id);
        const { trigger, rule, category, isActive } = req.body;
        const updateDoc = {};
        if (typeof trigger === 'string' && trigger.trim()) updateDoc.trigger = trigger.trim();
        if (typeof rule === 'string' && rule.trim()) updateDoc.rule = rule.trim();
        if (typeof category === 'string' && category.trim()) updateDoc.category = category.trim();
        if (typeof isActive === 'boolean') updateDoc.isActive = isActive;

        const updated = await TenshiProceduralMemory.findOneAndUpdate(
            { _id: req.params.id, user: targetUserId },
            { $set: updateDoc },
            { new: true }
        ).lean();

        if (!updated) {
            return res.status(404).json({ error: 'Regla no encontrada.' });
        }

        const activeComp = await resolveActiveCompanyForUser(targetUserId, req.query.companyId || updated.companyId);
        const compId = updated.companyId ? String(updated.companyId) : (activeComp?._id ? String(activeComp._id) : null);
        const activeFilter = { user: targetUserId, isActive: true };
        if (compId) {
            activeFilter.companyId = mongoose.Types.ObjectId.isValid(compId)
                ? { $in: [compId, new mongoose.Types.ObjectId(compId)] }
                : compId;
        } else {
            activeFilter.$or = [{ companyId: null }, { companyId: { $exists: false } }];
        }

        const activeHabits = await TenshiProceduralMemory.find(activeFilter)
            .sort({ updatedAt: -1 })
            .limit(30)
            .lean();
        const mappedActive = activeHabits.map((h) => ({
            id: String(h._id),
            _id: String(h._id),
            companyId: h.companyId ? String(h.companyId) : null,
            category: h.category,
            trigger: h.trigger,
            rule: h.rule,
            isActive: h.isActive,
        }));
        await TenshiMessage.updateMany(
            {
                user: { $in: [req.user.id, targetUserId].filter(Boolean) },
                'widget.widgetType': 'procedural_memory',
                ...(compId ? { companyId: compId } : {}),
            },
            { $set: { 'widget.data.items': mappedActive, 'widget.data.habits': mappedActive } }
        ).catch(() => {});

        res.json({
            success: true,
            item: {
                id: String(updated._id),
                _id: String(updated._id),
                companyId: updated.companyId ? String(updated.companyId) : null,
                category: updated.category,
                trigger: updated.trigger,
                rule: updated.rule,
                isActive: updated.isActive !== false,
                usageCount: updated.usageCount || 0,
                updatedAt: updated.updatedAt,
            },
            items: mappedActive,
        });
    } catch (error) {
        logger.error('[Tenshi Procedural Memory] Error updating habit:', error);
        res.status(500).json({ error: error.message });
    }
});

router.delete('/procedural-memory/:id', requireJwtAuth, async (req, res) => {
    try {
        const targetUserId = (req.user?.isSubUser && req.user?.parentUser) ? String(req.user.parentUser) : String(req.user?.id || req.user?._id);
        const deleted = await TenshiProceduralMemory.findOneAndDelete({
            _id: req.params.id,
            user: targetUserId,
        });
        const activeComp = await resolveActiveCompanyForUser(targetUserId, req.query.companyId || deleted?.companyId);
        const compId = deleted?.companyId ? String(deleted.companyId) : (activeComp?._id ? String(activeComp._id) : null);
        const remainingFilter = { user: targetUserId, isActive: true };
        if (compId) {
            remainingFilter.companyId = mongoose.Types.ObjectId.isValid(compId)
                ? { $in: [compId, new mongoose.Types.ObjectId(compId)] }
                : compId;
        } else {
            remainingFilter.$or = [{ companyId: null }, { companyId: { $exists: false } }];
        }
        const remaining = await TenshiProceduralMemory.find(remainingFilter)
            .sort({ updatedAt: -1 })
            .limit(30)
            .lean();
        const mappedRemaining = remaining.map((h) => ({
            id: String(h._id),
            _id: String(h._id),
            companyId: h.companyId ? String(h.companyId) : null,
            category: h.category,
            trigger: h.trigger,
            rule: h.rule,
            isActive: h.isActive,
        }));
        await TenshiMessage.updateMany(
            {
                user: { $in: [req.user.id, targetUserId].filter(Boolean) },
                'widget.widgetType': 'procedural_memory',
                ...(compId ? { companyId: compId } : {}),
            },
            { $set: { 'widget.data.items': mappedRemaining, 'widget.data.habits': mappedRemaining } }
        ).catch(() => {});
        res.json({ success: Boolean(deleted), deleted, items: mappedRemaining });
    } catch (error) {
        logger.error('[Tenshi Procedural Memory] Error deleting habit:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Helper unificado para guardar riesgos evaluados en:
 * 1) La Matriz IPEVR Comunitaria del Hito 1 (ParticipacionIpevarData.participacionesList)
 * 2) La Matriz IPEVR Oficial GTC-45 del Hito 1 (GTC45WorkspaceSession isOfficial: true)
 */
async function saveRisksToHito1Matrices(userId, companyInfo, rawRiesgos = []) {
    const GTC45WorkspaceSession = mongoose.models.GTC45WorkspaceSession || require('../../models/GTC45WorkspaceSession');
    let ParticipacionIpevarData = mongoose.models.ParticipacionIpevarData;
    if (!ParticipacionIpevarData) {
        try {
            require('./sgsst/participacionIpevar');
            ParticipacionIpevarData = mongoose.models.ParticipacionIpevarData;
        } catch (_) {}
    }

    const companyId = companyInfo?._id || null;
    const officialConvoId = `official-${companyId || userId}`;

    // Buscar todas las sesiones oficiales activas de esta empresa para mantenerlas 100% sincronizadas
    let officialSessions = await GTC45WorkspaceSession.find(
        companyId
            ? { $or: [{ user: userId, companyId, isOfficial: true }, { conversationId: officialConvoId }] }
            : { $or: [{ user: userId, isOfficial: true }, { conversationId: officialConvoId }] }
    );

    if (!officialSessions || officialSessions.length === 0) {
        const created = new GTC45WorkspaceSession({
            conversationId: officialConvoId,
            user: userId,
            companyId: companyId || undefined,
            isOfficial: true,
            officialTitle: 'Matriz IPEVR SG-SST',
            matrixRows: [],
        });
        officialSessions = [created];
    }

    let partDoc = null;
    if (ParticipacionIpevarData) {
        partDoc = await ParticipacionIpevarData.findOne({ user: userId, companyId });
        if (!partDoc) {
            partDoc = new ParticipacionIpevarData({
                user: userId,
                companyId,
                participacionesList: [],
                inboxPublico: [],
            });
        }
    }

    const nowIso = new Date().toISOString();
    const todayStr = nowIso.split('T')[0];
    let insertedCount = 0;

    for (const r of rawRiesgos) {
        const nd = Number(r.nd) >= 0 ? Number(r.nd) : 6;
        const ne = Number(r.ne) >= 1 ? Number(r.ne) : 3;
        const np = nd * ne;
        const nc = Number(r.nc) >= 10 ? Number(r.nc) : 25;
        const nr = np * nc;

        const interpretacion_np = np >= 24 ? 'Muy Alto (MA)' : np >= 10 ? 'Alto (A)' : np >= 6 ? 'Medio (M)' : 'Bajo (B)';
        const interpretacion_nr = nr >= 600 ? 'I' : nr >= 150 ? 'II' : nr >= 40 ? 'III' : 'IV';
        const aceptabilidad =
            interpretacion_nr === 'I'
                ? 'No Aceptable'
                : interpretacion_nr === 'II'
                ? 'No Aceptable o Aceptable con control específico'
                : interpretacion_nr === 'III'
                ? 'Mejorable'
                : 'Aceptable';
        const severidadPercibida = nr >= 600 ? 'Crítica' : nr >= 150 ? 'Alta' : nr >= 40 ? 'Media' : 'Baja';

        const rowId = r.id || `gtc45_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const peligroDesc = String(r.peligro_descripcion || r.peligro || 'Peligro identificado').trim();
        const procesoVal = String(r.proceso || r.cargo || 'Operaciones Generales').trim();
        const cargoVal = String(r.cargo || r.proceso || 'Personal Operativo').trim();
        const zonaVal = String(r.zona || 'Instalaciones Principales').trim();
        const actividadVal = String(r.actividad || r.tareas || procesoVal || 'Labor operativa').trim();
        const clasificacionVal = String(
            r.peligro_clasificacion ||
                (/soldadura|humo|qu[ií]mico|gas|vapor/i.test(peligroDesc)
                    ? 'Físico / Químico'
                    : /postura|carga|ergon|repetitiv/i.test(peligroDesc)
                    ? 'Biomecánico'
                    : /ruido|iluminaci|vibraci|radiaci|temperat/i.test(peligroDesc)
                    ? 'Físico'
                    : 'Condiciones de Seguridad')
        ).trim();

        const newRow = {
            id: rowId,
            proceso: procesoVal,
            zona: zonaVal,
            actividad: actividadVal,
            tareas: r.tareas || actividadVal,
            rutinaria: r.rutinaria || 'Sí',
            cargo: cargoVal,
            peligro_descripcion: peligroDesc,
            peligro_clasificacion: clasificacionVal,
            efectos_posibles: r.efectos_posibles || 'Afecciones ocupacionales, fatiga o lesiones asociadas a la exposición',
            controles_fuente: r.controles_fuente || 'Mantenimiento preventivo e inspección de equipos',
            controles_medio: r.controles_medio || 'Señalización, ventilación y demarcación del área',
            controles_individuo: r.controles_individuo || 'Capacitación en estándares seguros y uso de EPP certificado',
            nd,
            ne,
            np,
            interpretacion_np,
            nc,
            nr,
            interpretacion_nr,
            aceptabilidad,
            peor_consecuencia: r.peor_consecuencia || 'Accidente de trabajo o enfermedad laboral',
            requisito_legal: r.requisito_legal || 'Decreto 1072 de 2015 / GTC-45',
            nro_expuestos: Number(r.nro_expuestos) || 1,
            medida_eliminacion: r.medida_eliminacion || 'N/A',
            medida_sustitucion: r.medida_sustitucion || 'N/A',
            medida_ingenieria: r.medida_ingenieria || 'Control técnico en fuente y ventilación/extracción',
            medida_administrativa: r.medida_administrativa || 'Procedimiento de trabajo seguro, inspecciones y pausas activas',
            medida_eppu: r.medida_eppu || 'Dotación y uso obligatorio de EPP certificado según matriz',
            factores_reduccion:
                r.factores_reduccion ||
                'Técnicamente viable y altamente costo-efectiva según Anexo E de la GTC-45. La implementación de controles en fuente/medio reduce el nivel de deficiencia y la probabilidad del riesgo.',
            origen_reporte: `Registrado desde Simulador GTC-45 de Tenshi IA (ND=${nd}, NE=${ne}, NC=${nc} → NR=${nr} Nivel ${interpretacion_nr}).`,
            creadoPor: 'Tenshi IA • Simulador GTC-45',
            fechaRegistro: nowIso,
        };

        for (const sess of officialSessions) {
            if (!Array.isArray(sess.matrixRows)) sess.matrixRows = [];
            const existsIdx = sess.matrixRows.findIndex(
                (existing) =>
                    String(existing.peligro_descripcion || '').toLowerCase() === peligroDesc.toLowerCase() &&
                    String(existing.proceso || '').toLowerCase() === procesoVal.toLowerCase()
            );
            if (existsIdx >= 0) {
                sess.matrixRows[existsIdx] = { ...sess.matrixRows[existsIdx], ...newRow, id: sess.matrixRows[existsIdx].id || rowId };
            } else {
                sess.matrixRows.push(newRow);
            }
            sess.markModified('matrixRows');
        }

        if (partDoc) {
            if (!Array.isArray(partDoc.participacionesList)) partDoc.participacionesList = [];
            const partId = `part-tenshi-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
            const newPartEntry = {
                id: partId,
                title: `${procesoVal} - ${peligroDesc.substring(0, 45)}`,
                updatedAt: nowIso,
                status: 'applied_to_matrix',
                matrixAction: 'create_new',
                matrixRowId: rowId,
                appliedAt: new Date(),
                formData: {
                    fecha: todayStr,
                    area: procesoVal,
                    proceso: procesoVal,
                    zona: zonaVal,
                    actividad: actividadVal,
                    tarea: r.tareas || actividadVal,
                    rutinaria: 'Sí',
                    peligroClasificacion: clasificacionVal,
                    peligros: peligroDesc,
                    efectosPosibles: newRow.efectos_posibles,
                    severidadPercibida,
                    controlesExistentes: newRow.controles_individuo,
                    suficientes: nr < 150,
                    sugeridoEliminacion: newRow.medida_eliminacion,
                    sugeridoIngenieria: newRow.medida_ingenieria,
                    sugeridoAdministrativo: newRow.medida_administrativa,
                    sugeridoEPP: newRow.medida_eppu,
                    actividadGlobal: actividadVal,
                },
                images: { foto1: null, foto2: null, foto3: null },
                video: null,
                trabajadoresList: [{ nombre: 'Simulador GTC-45 (Tenshi IA)', cedula: 'SG-SST', cargo: cargoVal }],
                responsablesList: [{ nombre: companyInfo?.responsibleSST || 'Responsable SG-SST', cedula: '', rol: 'Responsable SST' }],
            };

            const existsPartIdx = partDoc.participacionesList.findIndex(
                (p) =>
                    String(p?.formData?.peligros || '').toLowerCase() === peligroDesc.toLowerCase() &&
                    String(p?.formData?.proceso || '').toLowerCase() === procesoVal.toLowerCase()
            );
            if (existsPartIdx >= 0) {
                partDoc.participacionesList[existsPartIdx] = {
                    ...partDoc.participacionesList[existsPartIdx],
                    ...newPartEntry,
                    id: partDoc.participacionesList[existsPartIdx].id || partId,
                };
            } else {
                partDoc.participacionesList.unshift(newPartEntry);
            }
            partDoc.markModified('participacionesList');
        }

        insertedCount++;
    }

    for (const sess of officialSessions) {
        await sess.save();
    }
    if (partDoc) {
        partDoc.updatedAt = new Date();
        await partDoc.save();
    }

    return {
        exito: true,
        insertedCount,
        totalRiesgosEnMatriz: officialSessions[0]?.matrixRows?.length || 0,
        totalParticipacionesComunitarias: partDoc?.participacionesList?.length || 0,
        mensaje: `Se guardaron ${insertedCount} peligro(s) exitosamente en la Matriz IPEVR Comunitaria y en la Matriz Oficial GTC-45 del Hito 1.`,
    };
}

router.post('/gtc45/save-to-hito1', requireJwtAuth, async (req, res) => {
    try {
        const targetUserId = (req.user?.isSubUser && req.user?.parentUser) ? String(req.user.parentUser) : String(req.user?.id || req.user?._id);
        let companyInfo = await CompanyInfo.findOne({ user: targetUserId, isActive: true }).lean();
        if (!companyInfo) {
            companyInfo = await CompanyInfo.findOne({ user: targetUserId }).lean();
        }
        const payload = req.body || {};
        const riesgos = Array.isArray(payload.riesgos)
            ? payload.riesgos
            : [
                  {
                      peligro_descripcion: payload.peligro || payload.peligro_descripcion || 'Peligro evaluado',
                      proceso: payload.proceso || 'Operaciones Generales',
                      cargo: payload.cargo || payload.proceso || 'Operativo',
                      zona: payload.zona || 'Taller / Instalaciones',
                      nd: payload.nd,
                      ne: payload.ne,
                      nc: payload.nc,
                  },
              ];
        const result = await saveRisksToHito1Matrices(targetUserId, companyInfo, riesgos);
        res.json({ success: true, ...result });
    } catch (error) {
        logger.error('[Tenshi GTC45 Save Hito 1] Error:', error);
        res.status(500).json({ error: error.message || 'Error guardando en la Matriz IPEVR del Hito 1' });
    }
});

router.delete('/history', requireJwtAuth, async (req, res) => {
    try {
        const { targetUserId, userIds } = resolveTenshiUserContext(req);
        const activeComp = await resolveActiveCompanyForUser(targetUserId, req.query.companyId || req.body?.companyId);
        const companyIdStr = activeComp?._id ? String(activeComp._id) : null;
        const companyScope = buildCompanyScopeFilter(userIds, companyIdStr);
        const requestedConvoId =
            typeof (req.query.conversationId || req.body?.conversationId) === 'string'
                ? String(req.query.conversationId || req.body?.conversationId).trim()
                : '';

        if (requestedConvoId) {
            await TenshiMessage.deleteMany({
                $and: [companyScope, { conversationId: requestedConvoId }],
            });
            if (mongoose.isValidObjectId(requestedConvoId)) {
                await TenshiConversation.updateOne(
                    { _id: requestedConvoId, user: { $in: userIds } },
                    { $set: { messageCount: 0 } }
                ).catch(() => {});
            }
        } else {
            await TenshiMessage.deleteMany(companyScope);
            await TenshiConversation.updateMany(companyScope, { $set: { messageCount: 0 } }).catch(() => {});
        }
        res.json({ success: true, conversationId: requestedConvoId || null });
    } catch (error) {
        console.error('Error clearing Tenshi history:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.put('/message/:id', requireJwtAuth, async (req, res) => {
    try {
        const msgId = req.params.id;
        const { content, conversationId } = req.body;
        const { userIds } = resolveTenshiUserContext(req);
        const targetMsg = await TenshiMessage.findOne({ _id: msgId, user: { $in: userIds } });
        if (!targetMsg) {
            return res.status(404).json({ error: 'Message not found' });
        }

        // Update content
        targetMsg.content = content;
        await targetMsg.save();

        const scopedConvoId = targetMsg.conversationId || (typeof conversationId === 'string' ? conversationId.trim() : null);

        // Delete all subsequent messages strictly in the same conversation (or company if legacy)
        const cascadeFilter = {
            user: { $in: userIds },
            companyId: targetMsg.companyId || null,
            createdAt: { $gt: targetMsg.createdAt },
            ...(scopedConvoId ? { conversationId: scopedConvoId } : {}),
        };
        await TenshiMessage.deleteMany(cascadeFilter);

        if (scopedConvoId && mongoose.isValidObjectId(scopedConvoId)) {
            const remaining = await TenshiMessage.countDocuments({
                user: { $in: userIds },
                conversationId: scopedConvoId,
            });
            await TenshiConversation.updateOne(
                { _id: scopedConvoId, user: { $in: userIds } },
                { $set: { messageCount: remaining, lastMessageAt: targetMsg.createdAt || new Date() } }
            ).catch(() => {});
        }

        res.json({ success: true, conversationId: scopedConvoId || null });
    } catch (error) {
        console.error('Error updating Tenshi message:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.delete('/message/:id', requireJwtAuth, async (req, res) => {
    try {
        const msgId = req.params.id;
        const { userIds } = resolveTenshiUserContext(req);
        const targetMsg = await TenshiMessage.findOne({ _id: msgId, user: { $in: userIds } });
        if (!targetMsg) {
            return res.status(404).json({ error: 'Message not found' });
        }

        const scopedConvoId =
            targetMsg.conversationId ||
            (typeof (req.query?.conversationId || req.body?.conversationId) === 'string'
                ? String(req.query?.conversationId || req.body?.conversationId).trim()
                : null);

        // Delete this message and all subsequent ones strictly in the same conversation
        const cascadeFilter = {
            user: { $in: userIds },
            companyId: targetMsg.companyId || null,
            createdAt: { $gte: targetMsg.createdAt },
            ...(scopedConvoId ? { conversationId: scopedConvoId } : {}),
        };
        await TenshiMessage.deleteMany(cascadeFilter);

        if (scopedConvoId && mongoose.isValidObjectId(scopedConvoId)) {
            const remaining = await TenshiMessage.countDocuments({
                user: { $in: userIds },
                conversationId: scopedConvoId,
            });
            const latestRemaining = await TenshiMessage.findOne({
                user: { $in: userIds },
                conversationId: scopedConvoId,
            })
                .sort({ createdAt: -1 })
                .select('createdAt')
                .lean();
            await TenshiConversation.updateOne(
                { _id: scopedConvoId, user: { $in: userIds } },
                {
                    $set: {
                        messageCount: remaining,
                        ...(latestRemaining?.createdAt ? { lastMessageAt: latestRemaining.createdAt } : {}),
                    },
                }
            ).catch(() => {});
        }

        res.json({ success: true, conversationId: scopedConvoId || null });
    } catch (error) {
        console.error('Error deleting Tenshi message:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// A simple chat endpoint for Tenshi
router.post('/chat', requireJwtAuth, async (req, res) => {
    try {
        const {
            messages,
            browserState,
            model: requestedModel,
            enabledTools,
            connectors: rawConnectors,
            selectedNotebooks: bodySelectedNotebooks,
            conversationId: requestedConversationId,
        } = req.body;
        const normalizedConnectors = normalizeConnectorsObject(rawConnectors);
        logger.info(`[Tenshi Backend] /chat request received. Messages count: ${messages?.length}, browserState length: ${browserState?.length || 0}, model: ${requestedModel || 'default'}, enabledTools: ${Array.isArray(enabledTools) ? enabledTools.length : 'legacy'}`);
        const config = await TenshiConfig.findOne().lean();

        if (!config || !config.isActive) {
            return res.status(403).json({ error: 'Tenshi is not active.' });
        }

        let capturedHtmlReport = null;
        let capturedQrCode = null;
        let capturedFile = null;
        let capturedWidget = null;
        let capturedEvidenceFiles = [];
        let capturedDelegatedOrder = null;
        let capturedFlowMarkdown = null;
        let capturedFlowPublicUrl = null;
        let requestedGuiAction = null;
        let requestedGuiActions = null;

        const lastUserMsgPayload = messages[messages.length - 1];
        const userQuery = lastUserMsgPayload?.content || '';
        const userAttachments = normalizeIncomingMediaList(lastUserMsgPayload);
        const reqBodyAttachments = userAttachments.length === 0 ? normalizeIncomingMediaList(req.body) : [];

        // Resolver adjunto(s) activo(s) del turno actual o del turno inmediatamente anterior (ej. sube archivo y luego dice "verifícalo")
        let resolvedAttachedMediaList = userAttachments.length > 0 ? userAttachments : reqBodyAttachments;
        if (resolvedAttachedMediaList.length === 0 && Array.isArray(messages) && messages.length > 1) {
            let userTurnsChecked = 0;
            for (let mIdx = messages.length - 2; mIdx >= 0 && userTurnsChecked < 2; mIdx--) {
                const prevMsg = messages[mIdx];
                if (!prevMsg || prevMsg.role !== 'user') continue;
                userTurnsChecked++;
                const candidatePrevList = normalizeIncomingMediaList(prevMsg);
                if (candidatePrevList.length > 0) {
                    resolvedAttachedMediaList = candidatePrevList;
                    break;
                }
            }
        }

        const dbMediaSourceList = normalizeIncomingMediaList(lastUserMsgPayload, { requirePayload: false });
        const {
            attachmentsForDb: userAttachmentsForDb,
            mediaForDb: userMediaForDb,
            imageForDb: userImageForDb,
        } = buildMediaFieldsForDb(
            dbMediaSourceList.length > 0 ? dbMediaSourceList : reqBodyAttachments,
            lastUserMsgPayload?.image
        );

        const targetUserId = (req.user?.isSubUser && req.user?.parentUser) ? String(req.user.parentUser) : String(req.user?.id || req.user?._id);
        const isLockedSubUser = Boolean(req.user?.isSubUser && req.user?.assignedCompany);
        let companyInfo = null;
        if (isLockedSubUser) {
            companyInfo = await CompanyInfo.findOne({ _id: req.user.assignedCompany, user: targetUserId }).lean().catch(() => null);
        }
        if (!companyInfo && !isLockedSubUser) {
            companyInfo = await resolveActiveCompanyForUser(targetUserId, req.body?.companyId);
        }
        if (!companyInfo && !isLockedSubUser) {
            companyInfo = await CompanyInfo.findOne({ user: targetUserId }).lean().catch(() => null);
        }
        if (companyInfo?._id) {
            req.companyId = String(companyInfo._id);
        }

        // Si en el turno inmediatamente anterior el cliente omitió reenviar el dataUrl pero el mensaje sigue reciente en BD (<10 min), recuperarlo con aislamiento multi-empresa
        if (resolvedAttachedMediaList.length === 0 && Array.isArray(messages) && messages.length > 1) {
            const recentPrevUserHadAttachment = messages
                .slice(-4, -1)
                .some((m) => {
                    if (!m || m.role !== 'user') return false;
                    return Boolean(
                        m.hasAttachment ||
                        m.media?.name ||
                        (Array.isArray(m.attachments) && m.attachments.length > 0) ||
                        (Array.isArray(m.mediaList) && m.mediaList.length > 0) ||
                        (Array.isArray(m.files) && m.files.length > 0)
                    );
                });
            if (recentPrevUserHadAttachment) {
                try {
                    const recentDbMediaMsg = await TenshiMessage.findOne({
                        user: req.user.id,
                        companyId: companyInfo?._id ? String(companyInfo._id) : null,
                        role: 'user',
                        createdAt: { $gte: new Date(Date.now() - 10 * 60 * 1000) },
                        $or: [
                            { 'attachments.0': { $exists: true } },
                            { 'media.dataUrl': { $exists: true, $nin: [null, ''] } },
                            { image: { $exists: true, $nin: [null, ''] } },
                        ],
                    })
                        .sort({ createdAt: -1 })
                        .select('attachments media image')
                        .lean();
                    if (recentDbMediaMsg) {
                        resolvedAttachedMediaList = normalizeIncomingMediaList(recentDbMediaMsg);
                    }
                } catch (_) {}
            }
        }

        req.__tenshiAttachedMediaList = resolvedAttachedMediaList;
        const resolvedAttachedMedia =
            resolvedAttachedMediaList.length > 0
                ? {
                      ...resolvedAttachedMediaList[0],
                      ...(resolvedAttachedMediaList.length > 1 ? { files: resolvedAttachedMediaList } : {}),
                  }
                : null;
        req.__tenshiAttachedMedia = resolvedAttachedMedia;

        const { reqUserId, userIds } = resolveTenshiUserContext(req);
        const activeCompanyIdForConvo = companyInfo?._id ? String(companyInfo._id) : null;
        const rawConvoId =
            typeof requestedConversationId === 'string' ? requestedConversationId.trim() : '';

        let activeTenshiConvo = null;
        if (rawConvoId && rawConvoId !== 'new' && mongoose.isValidObjectId(rawConvoId)) {
            activeTenshiConvo = await TenshiConversation.findOne({
                _id: rawConvoId,
                user: { $in: userIds },
            }).catch(() => null);
        }

        if (!activeTenshiConvo && rawConvoId !== 'new' && (!rawConvoId || /^tenshi-/i.test(rawConvoId))) {
            // Retrocompatibilidad: si no viene conversationId (clientes legacy / chats en curso), usar/migrar conversación activa
            await ensureLegacyTenshiConversation({
                TenshiConversation,
                TenshiMessage,
                userIds,
                ownerUserId: reqUserId,
                companyIdStr: activeCompanyIdForConvo,
            }).catch(() => null);
            if (Array.isArray(messages) && messages.length > 1) {
                activeTenshiConvo = await TenshiConversation.findOne(
                    buildCompanyScopeFilter(userIds, activeCompanyIdForConvo)
                )
                    .sort({ lastMessageAt: -1, updatedAt: -1 })
                    .catch(() => null);
            }
        }

        const isNonGuiUserMsg =
            (Boolean(userQuery) || userAttachmentsForDb.length > 0 || Boolean(userImageForDb)) &&
            !String(userQuery).startsWith('[RESULTADO_GUI]');

        if (!activeTenshiConvo) {
            const initialTitle = isNonGuiUserMsg
                ? generateSmartTenshiTitle(userQuery, userAttachmentsForDb)
                : 'Nuevo chat';
            activeTenshiConvo = await TenshiConversation.create({
                user: reqUserId,
                companyId: activeCompanyIdForConvo,
                title: initialTitle,
                lastMessageAt: new Date(),
                messageCount: 0,
                modelOverride: sanitizeRequestedTenshiModel(requestedModel),
                isLegacyDefault: false,
            });
        } else if (
            isNonGuiUserMsg &&
            (!activeTenshiConvo.title || activeTenshiConvo.title.trim() === 'Nuevo chat')
        ) {
            const smartTitle = generateSmartTenshiTitle(userQuery, userAttachmentsForDb);
            if (smartTitle && smartTitle !== 'Nuevo chat') {
                activeTenshiConvo.title = smartTitle;
                await TenshiConversation.updateOne(
                    { _id: activeTenshiConvo._id },
                    { $set: { title: smartTitle } }
                ).catch(() => {});
            }
        }

        const activeTenshiConvoId = activeTenshiConvo?._id ? String(activeTenshiConvo._id) : null;
        const activeTenshiConvoTitle = activeTenshiConvo?.title || 'Nuevo chat';

        if (!req.body.conversationId || req.body.conversationId === 'new') {
            req.body.conversationId =
                activeTenshiConvoId ||
                ('tenshi-' + targetUserId + (companyInfo?._id ? '-' + String(companyInfo._id) : ''));
        }

        if (isNonGuiUserMsg) {
            TenshiMessage.create({
                user: req.user.id,
                companyId: activeCompanyIdForConvo,
                conversationId: activeTenshiConvoId,
                role: 'user',
                content: userQuery || '📎 Archivo adjunto',
                image: userImageForDb,
                media: userMediaForDb,
                ...(userAttachmentsForDb.length > 0 ? { attachments: userAttachmentsForDb } : {}),
            })
                .then(() => {
                    if (activeTenshiConvoId) {
                        TenshiConversation.updateOne(
                            { _id: activeTenshiConvoId },
                            { $set: { lastMessageAt: new Date() }, $inc: { messageCount: 1 } }
                        ).catch(() => {});
                    }
                })
                .catch(e => console.error('Error saving user TenshiMessage:', e));
        }

        const isMemoryEnabled = req.user?.personalization?.memories !== false;

        const activeCompanyId = companyInfo?._id ? String(companyInfo._id) : null;

        // Fetch dynamic knowledge & user context concurrently via Promise.all for maximum response speed
        const [
            latestBlogs,
            latestCourses,
            ticketContext,
            rawMemories,
            recentTenshiReports,
            liveWorkerCountResult,
            proceduralBlock,
            nbSess,
            avatarProfileResult,
            tenshiFlowsBlock,
            systemActivityResult,
            companyAutomationsList,
        ] = await Promise.all([
            BlogPost.find({ isPublished: true }).sort({ createdAt: -1 }).limit(3).lean().catch(() => []),
            Course.find({ isPublished: true }).sort({ createdAt: -1 }).limit(2).lean().catch(() => []),
            getRelevantTickets(req, userQuery).catch(() => ''),
            isMemoryEnabled ? getAllUserMemories(targetUserId).catch(() => []) : Promise.resolve([]),
            (async () => {
                try {
                    const userFilter = [String(req.user.id), targetUserId].filter(Boolean);
                    const reports = await TenshiMessage.find({
                        user: { $in: userFilter },
                        ...(companyInfo?._id ? { companyId: String(companyInfo._id) } : {}),
                        $or: [
                            { htmlReport: { $exists: true, $nin: [null, ''] } },
                            { 'file.content': { $exists: true, $nin: [null, ''] } }
                        ]
                    })
                        .sort({ createdAt: -1 })
                        .limit(4)
                        .lean();
                    return reports || [];
                } catch (e) {
                    return [];
                }
            })(),
            (isMemoryEnabled && companyInfo)
                ? (async () => {
                      try {
                          const PerfilSocioModel = mongoose.models.PerfilSociodemograficoData || require('./sgsst/perfilSociodemografico');
                          const socioDoc = companyInfo._id
                              ? await PerfilSocioModel.findOne({ user: targetUserId, companyId: companyInfo._id }).lean()
                              : await PerfilSocioModel.findOne({ user: targetUserId }).lean();

                          if (socioDoc && Array.isArray(socioDoc.trabajadores)) {
                              const activeWorkers = socioDoc.trabajadores.filter(w => {
                                  const estado = (w.estadoLaboral || w.estado || '').toLowerCase().trim();
                                  return estado !== 'retirado' && estado !== 'inactivo';
                              });
                              return activeWorkers.length;
                          }
                      } catch (e) {
                          try {
                              const SgsstWorker = mongoose.models.SgsstWorker || require('~/models/SgsstWorker');
                              const count = await SgsstWorker.countDocuments({
                                  user: targetUserId,
                                  ...(companyInfo._id ? { companyId: companyInfo._id } : {}),
                                  estadoLaboral: { $ne: 'Retirado' }
                              });
                              if (count > 0) return count;
                          } catch (_) {}
                      }
                      return null;
                  })()
                : Promise.resolve(null),
            isMemoryEnabled
                ? getProceduralMemoryPromptBlock(targetUserId, companyInfo?._id, 12).catch(() => '')
                : Promise.resolve(''),
            normalizedConnectors?.notebooklm !== false
                ? (async () => {
                      try {
                          const NotebookSession = mongoose.models.NotebookSession || require('~/models/NotebookSession');
                          let sess = companyInfo?._id
                              ? await NotebookSession.findOne({ user: targetUserId, companyId: companyInfo._id }).lean().catch(() => null)
                              : null;
                          if (!sess) {
                              sess = await NotebookSession.findOne({
                                  user: targetUserId,
                                  $or: [{ companyId: null }, { companyId: { $exists: false } }],
                              }).lean().catch(() => null);
                          }
                          if (!sess) {
                              sess = await NotebookSession.findOne({ user: targetUserId }).lean().catch(() => null);
                          }
                          return sess;
                      } catch (_) {
                          return null;
                      }
                  })()
                : Promise.resolve(null),
            TenshiUserAvatar.resolveEffectiveAvatarProfile(
                targetUserId,
                config,
                companyInfo?._id ? String(companyInfo._id) : null
            ),
            buildTenshiFlowsPromptBlock().catch(() => ''),
            getLatestSystemActivity({
                userId: targetUserId,
                companyId: companyInfo?._id || null,
                viewerRole: req.user?.role || '',
                limit: 6,
                timeoutMs: 2000,
            }).catch(() => null),
            (async () => {
                try {
                    if (!activeCompanyId) return [];
                    return await Automation.find({
                        companyId: activeCompanyId,
                        isSystemPreset: { $ne: true },
                        isTenshiFlow: { $ne: true },
                    })
                        .select('_id name status workflowNodes.canvasLayout.nodeConfigs')
                        .sort({ createdAt: -1 })
                        .limit(40)
                        .lean();
                } catch (_) {
                    return [];
                }
            })(),
        ]);

        const blogStr = latestBlogs.map(b => `- BLOG: ${b.title}`).join('\n');
        const courseStr = latestCourses.map(c => `- CURSO: ${c.title}`).join('\n');
        const manualContent = getPlatformManual();

        const effectiveSelectedNotebooks = resolveSelectedNotebooks({
            bodySelectedNotebooks,
            nbSess,
            connectors: normalizedConnectors,
        });
        const nbPromptBlock = buildNotebookLmPromptBlock({
            nbSess,
            selectedNotebooks: effectiveSelectedNotebooks,
            connectors: normalizedConnectors,
        });

        let fullCompanyAndMemoryBlock = '';
        if (isMemoryEnabled) {
            if (companyInfo) {
                const liveWorkerCount = liveWorkerCountResult;
                const finalWorkerCount = liveWorkerCount !== null ? liveWorkerCount : (companyInfo.workerCount ?? 'N/A');

                if (liveWorkerCount !== null && companyInfo.workerCount !== liveWorkerCount) {
                    const CompanyInfoModel = mongoose.models.CompanyInfo || require('~/models/CompanyInfo');
                    CompanyInfoModel.updateOne({ _id: companyInfo._id }, { $set: { workerCount: liveWorkerCount } }).catch(() => {});
                    companyInfo.workerCount = liveWorkerCount;
                }

                const companyType = companyInfo.companyType || 'Persona Jurídica';
                const nitLabel = companyType === 'Persona Natural' ? 'Cédula de Ciudadanía' : 'NIT';
                let sedesStr = '';
                if (companyInfo.sedes && Array.isArray(companyInfo.sedes) && companyInfo.sedes.length > 0) {
                    sedesStr = '\n  * Sedes Adicionales:\n' + companyInfo.sedes.map(s => `    - Sede: ${s.nombre || 'N/A'} (Ciudad: ${s.city || 'N/A'}, Depto: ${s.departamento || 'N/A'}, Dirección: ${s.address || 'N/A'}, Actividades: ${s.generalActivities || 'N/A'})`).join('\n');
                }
                fullCompanyAndMemoryBlock += `### 🏢 [MEMORIA ESTRUCTURADA DUAL — BLOQUE 1: EMPRESA ACTIVA (HECHOS FIJOS SG-SST)]:\n` +
                    `- Razón Social / Nombre: ${companyInfo.companyName || 'N/A'}\n` +
                    `- Tipo de Empresa: ${companyType}\n` +
                    `- ${nitLabel}: ${companyInfo.nit || 'N/A'}\n` +
                    `- Representante Legal: ${companyInfo.legalRepresentative || 'N/A'}` + (companyInfo.legalRepresentativeId ? ` (Cédula: ${companyInfo.legalRepresentativeId})` : '') + `\n` +
                    `- Número de Trabajadores: ${finalWorkerCount} activos en Huella Biocéntrica / Nómina\n` +
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
                fullCompanyAndMemoryBlock += `### 🏢 [MEMORIA ESTRUCTURADA DUAL — BLOQUE 1: EMPRESA ACTIVA]:\nNo se ha registrado una empresa en el Gestor SG-SST aún.\n\n`;
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
                fullCompanyAndMemoryBlock += `### 🧠 [MEMORIA ESTRUCTURADA DUAL — BLOQUE 2: PREFERENCIAS DEL USUARIO Y MEMORIA PERMANENTE]:\n`;
                for (const [k, v] of uniqueMemMap.entries()) {
                    fullCompanyAndMemoryBlock += `📌 [${k}]:\n${v}\n\n`;
                }
            }

            if (proceduralBlock) {
                fullCompanyAndMemoryBlock += `${proceduralBlock}\n`;
            }

            fullCompanyAndMemoryBlock += `### ⚡ REGLA DE ORO DE CONOCIMIENTO CORPORATIVO Y MEMORIA:
- TIENES ACCESO PLENO E INMEDIATO a toda la información de la empresa activa y a la memoria del usuario descritas arriba.
- Conoces de antemano la Razón Social, NIT, Representante Legal, Trabajadores, ARL, Sedes, Macroprocesos y datos de la memoria.
- NUNCA digas "no tengo acceso a la empresa", "no sé qué empresa está activa" ni le pidas al usuario que repita datos que ya están en esta ficha o memoria. Úsalos con total familiaridad y exactitud en todas tus respuestas.`;
        }

        if (nbPromptBlock) {
            fullCompanyAndMemoryBlock += `\n\n${nbPromptBlock}`;
        }

        const { effective: effectiveAvatar } = avatarProfileResult;
        fullCompanyAndMemoryBlock += `\n\n[IDENTIDAD, NOMBRE, SEXO, PERSONALIDAD Y VOCABLO REGIONAL DE TU AVATAR WAPPY CONFIGURADO POR EL USUARIO]:
- Tu nombre oficial y único para este usuario es: "${effectiveAvatar.name}" (sin títulos adicionales ni apellidos después del nombre). Cuando te presentes o te pregunten cómo te llamas, responde únicamente con tu nombre "${effectiveAvatar.name}".
- Tu género/sexo configurado es: "${effectiveAvatar.gender}". Usa concordancia gramatical ${effectiveAvatar.gender === 'femenino' ? 'femenina (ej. "estoy lista", "encantada")' : effectiveAvatar.gender === 'neutro' ? 'neutra e inclusiva' : 'masculina (ej. "estoy listo", "encantado")'} al referirte a ti mismo/a.
- Tu personalidad, carácter y vocablo regional para este usuario es: ${effectiveAvatar.personality}
- REGLA OBLIGATORIA DE VOCABLO Y ACENTO REGIONAL COLOMBIANO: Si en tu personalidad se indica un vocablo regional de Colombia (por ejemplo Paisa, Costeño, Caleño/Valluno, Rolo/Bogotano, Santandereano, Llanero o Pastuso), adopta de forma natural, auténtica y respetuosa los saludos, modismos y expresiones propias de esa región en TODAS tus respuestas.\n`;

        let recentConvosBlock = '';
        if (recentTenshiReports && recentTenshiReports.length > 0) {
            recentConvosBlock = `### 📄 ÚLTIMOS INFORMES Y DOCUMENTOS GENERADOS EN TU PROPIO CHAT DE TENSHI (DEL MÁS RECIENTE AL MÁS ANTIGUO):\n`;
            recentTenshiReports.forEach((r, idx) => {
                const title = r.file?.title || 'Informe Oficial SG-SST';
                const rawHtml = r.file?.content || r.htmlReport || '';
                const cleanSnippet = rawHtml
                    .replace(/<style[\s\S]*?<\/style>/gi, '')
                    .replace(/<script[\s\S]*?<\/script>/gi, '')
                    .replace(/<[^>]+>/g, ' ')
                    .replace(/\s+/g, ' ')
                    .trim()
                    .substring(0, 1800);
                const dateStr = r.createdAt ? new Date(r.createdAt).toLocaleString('es-CO', { timeZone: 'America/Bogota' }) : 'Reciente';
                recentConvosBlock += `\n${idx === 0 ? '🔥 [ÚLTIMO INFORME EN CHAT DE TENSHI]' : `[Informe #${idx + 1}]`} Título: "${title}" (${dateStr})\n  - Mensaje de entrega: "${(r.content || '').substring(0, 300)}"\n  - Contenido/Resumen del informe: ${cleanSnippet}\n`;
            });
            recentConvosBlock += `\n*REGLA DE MEMORIA DE INFORMES PROPIOS*: Estos informes están publicados directamente en TU propio chat de Tenshi. Si el usuario te dice "revisa nuestro chat", "el último informe que hiciste", "envíame el último informe del chat a mi correo" o te pregunta por el informe en vuestro chat, se refiere SIEMPRE al 🔥 [ÚLTIMO INFORME EN CHAT DE TENSHI] listado arriba. NUNCA inventes que no tienes informes ni menciones chats viejos de otros agentes.\n\n`;
        }

        let recentSystemActivityBlock = '';
        const rawSystemItems = Array.isArray(systemActivityResult?.actividadesRecientes)
            ? systemActivityResult.actividadesRecientes
            : [];
        const cleanCurrentQueryNorm = String(userQuery || '').replace(/\s+/g, ' ').trim().toLowerCase();
        const recentSystemItems = rawSystemItems.filter((act) => {
            if (!act || !act.titulo || /\bsesi[oó]n\s+an[oó]nima\b/i.test(act.titulo)) {
                return false;
            }
            if (act.tipo === 'chat_tenshi' && cleanCurrentQueryNorm) {
                const actPrefix = String(act.titulo).replace(/…$/, '').trim().toLowerCase();
                if (actPrefix && cleanCurrentQueryNorm.startsWith(actPrefix)) {
                    return false;
                }
            }
            return true;
        }).slice(0, 5);
        if (recentSystemItems.length > 0) {
            recentSystemActivityBlock = `### ⚡ [ACTIVIDAD RECIENTE REAL EN TODO EL SISTEMA (DEL MÁS RECIENTE AL MÁS ANTIGUO)]:\n`;
            recentSystemItems.forEach((act, idx) => {
                const modLabel = act.modulo || act.tipo || 'Sistema';
                const stateLabel = act.estado ? ` · Estado: ${act.estado}` : '';
                const detailLabel = act.detalle ? ` · ${act.detalle}` : '';
                const dateLabel = act.fecha ? ` (${act.fecha})` : '';
                recentSystemActivityBlock += `${idx === 0 ? '🔥 [ÚLTIMA ACTIVIDAD REAL]' : `#${idx + 1}`} [${modLabel}] "${act.titulo}"${stateLabel}${detailLabel}${dateLabel}\n`;
            });
            recentSystemActivityBlock += `*REGLA*: Si el usuario pregunta "¿qué fue lo último que hice?", "¿en qué quedé?", "¿qué automatización corrí?" o pide continuar su último trabajo, responde con exactitud usando esta lista en tiempo real (priorizando 🔥 [ÚLTIMA ACTIVIDAD REAL]).\n\n`;
        }

        let isAdminUser = req.user?.role === 'ADMIN';
        if (!req.user?.role && req.user?.id) {
            try {
                const UserModel = mongoose.models.User || require('~/models/User');
                const uDoc = await UserModel.findById(req.user.id).select('role').lean();
                if (uDoc?.role === 'ADMIN') isAdminUser = true;
            } catch (_) {}
        }

        const rawSkillsList = (config.skills && config.skills.length > 0) ? [...config.skills] : ['*'];
        if (isAdminUser && !rawSkillsList.includes('*') && !rawSkillsList.includes('skill-admin-metricas-sistema')) {
            rawSkillsList.push('skill-admin-metricas-sistema');
        }
        const skillsList = rawSkillsList.filter(s => s !== 'wappy-cards' && (isAdminUser || s !== 'skill-admin-metricas-sistema'));
        const rawSkillData = getActiveSkillsData(userQuery, skillsList, { isAdmin: isAdminUser });
        const skillInstructions = (rawSkillData.instructions || '').replace(/```wappy-card[\s\S]*?```/gi, '');
        const activeTools = rawSkillData.activeTools || [];
        const activeSkillNames = (rawSkillData.activeSkillNames || []).filter(s => s !== 'wappy-cards');
        logger.info(`[Tenshi Skill Router] Skills activadas por trigger (isAdmin=${isAdminUser}): ${activeSkillNames.join(', ') || 'ninguna'}, herramientas dinámicas: ${activeTools.join(', ') || 'ninguna'}`);

        const nowColombiaStr = new Date().toLocaleString('es-CO', {
            timeZone: 'America/Bogota',
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });

        const adminRoleSystemBlock = isAdminUser
            ? `\n### 👑 MODO SUPER-ADMINISTRADOR ACTIVO (ROL VERIFICADO: ADMIN)\n` +
              `- Has identificado y verificado que el usuario conectado (${req.user.name || req.user.email || 'Admin'}) tiene rol **ADMIN** (Super-Administrador de WAPPY IA).\n` +
              `- Tienes **acceso total y sin restricciones** a todos los módulos de Métricas y Administración global del sistema mediante tus herramientas exclusivas de Admin:\n` +
              `  1. **\`wappy_consultar_metricas_admin\` (Consulta de Todos los Módulos de Métricas de Admin)**:\n` +
              `     * \`modulo="resumen_global"\`: Panorama 360° de toda la plataforma (usuarios activos, adopción SST, embajadores, comisiones, embudo de pagos/checkout, telemetría de Matriz IPEVR, Wappy Studio, Radar ARL Colmena, Comunidad, tickets, leads, planes y promocodes).\n` +
              `     * \`modulo="actividad_usuarios"\`: Métricas de actividad y adopción por usuario (\`totalUsers\`, \`activeThisMonth\`, \`avgAdoptionRate\`, \`powerUsersCount\`, distribución por niveles \`power_user\`/\`avanzado\`/\`intermedio\`/\`explorador\`/\`sin_inicio\`, semáforo \`green\`/\`yellow\`/\`red\`/\`gray\`, e hitos usados por cada usuario).\n` +
              `     * \`modulo="embajadores"\`: Dashboard comercial, red de embajadores, KPIs de referidos, comisiones (\`pending\`, \`approved\`, \`paid\`) y pipeline CRM.\n` +
              `     * \`modulo="pagos"\`: Analítica de pagos y embudo de checkout (\`page_view\`, \`plan_selected\`, \`payment_started\`, \`payment_approved\`, \`totalRevenueCOP\`, \`conversionRate\`, ingresos por plan y eventos recientes).\n` +
              `     * \`modulo="matrizipvr"\`: Telemetría de empresas y riesgos creados en el aplicativo público \`/matrizipvr\`.\n` +
              `     * \`modulo="wappystudio"\`: Telemetría de empresas, audios y videos generados en \`/wappystudio\`.\n` +
              `     * \`modulo="colmena"\`: Radar e intermediación ARL Colmena y negocios en pipeline.\n` +
              `     * \`modulo="comunidad"\`: Estadísticas de ventas Comunidad, compras y auditoría forense.\n` +
              `     * \`modulo="usuarios"\`: Listado y búsqueda de todos los usuarios del sistema, sus planes, vencimientos, referidos y auditoría de conversaciones.\n` +
              `     * \`modulo="empresas"\`: Todas las empresas registradas en Somos SST a nivel global.\n` +
              `     * \`modulo="tickets"\`: Todos los tickets de soporte técnico (pendientes y resueltos).\n` +
              `     * \`modulo="planes_y_promos"\`: Planes, visibilidad de planes, códigos promocionales, leads y permisos por rol.\n` +
              `     * \`modulo="marketplace_admin"\`: Órdenes de compra, productos y cupones de la tienda.\n` +
              `  2. **\`wappy_admin_sistema\` (Ejecución de Acciones de Administrador)**:\n` +
              `     * **Usuarios (\`modulo="usuarios"\`)**: \`crear_usuario\`, \`actualizar_usuario\` (cambiar rol USER/ADMIN, plan, estado active/inactive, fechas, límites de empresas/automatizaciones/subusuarios, puntos, contraseña), \`eliminar_usuario\`, \`actualizacion_masiva\`, \`ver_conversaciones_usuario\`.\n` +
              `     * **Embajadores, Comisiones y CRM (\`modulo="embajadores"\` / \`"comisiones"\` / \`"crm"\`)**: \`atribuir_embajador\`, \`actualizar_comision\` (pending/approved/paid/cancelled), \`eliminar_comision\`, \`renovar_periodo\`, \`actualizar_etapa_crm\`, \`agregar_nota_crm\`, \`generar_propuesta\`, \`enviar_propuesta\`, \`generar_email\`, \`enviar_email\`.\n` +
              `     * **Planes y Códigos Promo (\`modulo="planes"\` / \`"promocodes"\`)**: \`actualizar_plan\`, \`visibilidad_planes\`, \`crear_promocode\`, \`toggle_promocode\`, \`eliminar_promocode\`.\n` +
              `     * **Marketing, Push, Leads y Tickets (\`modulo="marketing"\` / \`"push"\` / \`"leads"\` / \`"tickets"\`)**: \`generar_campana\`, \`enviar_campana\`, \`enviar_notificacion_push\`, \`crear_lead\`, \`eliminar_lead\`, \`responder_ticket\`, \`sugerir_respuesta_ticket\`, \`eliminar_ticket\`.\n` +
              `     * **Ruta Directa (\`ruta\` + \`metodo\` + \`datos\`)**: Puedes invocar cualquier endpoint administrativo de \`/api/admin/*\`, \`/api/referrals/*\`, \`/api/comunidad/*\`, \`/api/marketplace/admin/*\`, \`/api/training/admin/*\`, \`/api/ruta-aprendizaje/admin/*\`, \`/api/blog/*\`, \`/api/events/admin/*\`, \`/api/roadmap/*\`, \`/api/roles/*\` o \`/api/sgsst/sync-agents/*\`.\n`
            : `\n### 🔒 ROL DEL USUARIO CONECTADO: USER (ESTÁNDAR)\n` +
              `- El usuario conectado NO es administrador global (su rol es \`${req.user?.role || 'USER'}\`). Opera exclusivamente dentro de su propia cuenta y sus empresas registradas.\n`;

        let systemMessage = `${config.systemPrompt}

MANUAL DE FUNCIONAMIENTO DE WAPPY IA:
${manualContent}

${fullCompanyAndMemoryBlock}

Hola, estás conversando con el usuario: ${req.user.name || req.user.username || 'Usuario'} (Rol en el sistema: ${isAdminUser ? 'ADMIN — Super Administrador' : (req.user?.role || 'USER')})
${adminRoleSystemBlock}

### 🕒 ZONA HORARIA Y FECHA ACTUAL EN VIVO (COLOMBIA):
- País y Zona Horaria Oficial: Colombia (America/Bogota, UTC-5).
- Fecha y Hora Actual en Colombia: ${nowColombiaStr}.
- REGLA ESTRICTA DE AGENDAMIENTO: Toda hora o fecha que el usuario mencione ("hoy", "mañana", "a las 3pm", "a las 8am", etc.) debe interpretarse e ingresarse SIEMPRE en HORA COLOMBIA (America/Bogota, UTC-5). NUNCA uses UTC ni horarios extranjeros. Al enviar fechas a herramientas como 'google_calendar' o 'wappy_gestionar_agenda', envía la fecha y hora con el offset '-05:00' (ejemplo: '2026-10-16T15:00:00-05:00').

${blogStr ? `ÚLTIMAS PUBLICACIONES DEL BLOG:\n${blogStr}\n` : ''}
${courseStr ? `CURSOS DE FORMACIÓN DISPONIBLES:\n${courseStr}\n` : ''}
${ticketContext ? `CONOCIMIENTO DINÁMICO (Contexto extraído por RAG):\n${ticketContext}\n` : ''}
${recentConvosBlock}
${recentSystemActivityBlock}

### 🎯 ROL Y PERSONALIDAD DE TENSHI
Eres Tenshi, la IA estrella, guía oficial y orquestadora de WAPPY IA. Administras la plataforma central Somos SST (ubicada en /sgsst). Tu personalidad es alegre, carismática, empática, muy espontánea y respetuosa, utilizando modismos paisas colombianos naturales ("parce", "listo", "qué más pues", "bacano", "de una", "hágale").

### ⚡ DIRECTIVAS CRÍTICAS DE VELOCIDAD, ORQUESTACIÓN Y HERRAMIENTAS:
1. **RESPUESTAS INMEDIATAS A PREGUNTAS TEÓRICAS/CONCEPTUALES**: Si el usuario te hace preguntas conceptuales, definiciones teóricas (ej: "¿qué es SST?", "¿qué es un ATS?", "¿cuáles son las obligaciones del empleador?"), saludos o preguntas generales, RESPONDE DIRECTAMENTE EN TEXTO en 1 solo turno de forma concisa y alegre. ¡ESTÁ PROHIBIDO invocar herramientas como 'somos_sst' o 'resumen_empresa' para responder preguntas teóricas!
2. **DIFERENCIACIÓN ESTRICTA DE LOS MODOS DE INTERACCIÓN CON ESPECIALISTAS (REGLA DE ORO)**:
   - **MODO 1 — RESPUESTA DIRECTA DE TENSHI (POR DEFECTO EN EL 90% DE LOS CASOS)**:
     * Si el usuario te hace una consulta técnica, médica, jurídica, ergonómica, química o de SST (ej: "tengo un trabajador con dolor lumbar", "cómo califico este accidente", "qué hago ante un despido con incapacidad") y **NO** te pide explícitamente llamar al especialista ni abrir un chat:
     * **RESPONDE TÚ MISMA DIRECTAMENTE** en 1 sola llamada usando tus competencias integradas de Médico Laboral, Abogado Laboral, Ingeniero SST, etc.
     * **ESTÁ TERMINANTEMENTE PROHIBIDO** despertar subagentes ('consultar_agente_especializado', 'consultar_multiples_especialistas_paralelo') o abrir chats ('wappy_abrir_chat_agente') por iniciativa propia cuando el usuario no lo pidió literalmente.
   - **MODO 2 — DICTAMEN DE SUBAGENTE EFÍMERO EN SEGUNDO PLANO ('consultar_agente_especializado')**:
     * ÚNICAMENTE cuando el usuario pide literalmente el dictamen, concepto u opinión de un especialista **dentro de tu propio chat** sin pedir cambiar de ventana (ej: "Quiero el dictamen formal del Abogado Laboral", "Pregúntale al Médico Laboral qué opina", "Dame el concepto del Psicólogo SST"):
     * Invoca **'consultar_agente_especializado'**. El subagente especialista analizará el caso en segundo plano y tú le entregarás su dictamen consolidado aquí mismo en el chat de Tenshi, **SIN abrir un nuevo chat en pantalla**.
   - **MODO 2B — MESA TÉCNICA MULTI-AGENTE EN PARALELO ('consultar_multiples_especialistas_paralelo')**:
     * ÚNICAMENTE cuando el usuario pida consultar a **2, 3 o 4 especialistas al mismo tiempo / en paralelo** (ej: "mesa técnica", "en paralelo", "pregúntale al psicólogo y al abogado al tiempo", "consúltale simultáneamente al médico laboral, al abogado laboral y a la fisioterapeuta"):
     * Invoca **'consultar_multiples_especialistas_paralelo'** en **1 sola llamada** (máximo 4 especialistas simultáneos) pasando el arreglo \`consultas\` con el especialista y la pregunta detallada para cada uno.
     * Todos los especialistas responderán simultáneamente en segundo plano; luego sintetiza e integra sus conclusiones de forma clara y estructurada en tu respuesta aquí mismo en el chat de Tenshi (y si el usuario pidió un documento, acta o informe formal, compílalo en \`canvas_tool\`).
   - **MODO 3 — ABRIR UN CHAT DEDICADO CON EL AGENTE EN PANTALLA ('wappy_abrir_chat_agente')**:
     * ÚNICAMENTE cuando el usuario te pide explícitamente **abrir un chat**, **ir al chat** o **crear una conversación** con el agente especialista en la interfaz principal (ej: "Ábreme un chat con el agente Médico Laboral", "Abre un chat con el Abogado Laboral", "Llévame al chat del Ingeniero Químico"):
     * Invoca **'wappy_abrir_chat_agente'**. Esta herramienta abrirá en la pantalla principal la ventana de chat dedicada con ese especialista y le enviará la consulta estructurada.
   - **ESTUDIO DE PUESTO DE TRABAJO ERGONÓMICO EN VIVO CON LA FISIOTERAPEUTA ('wappy_iniciar_estudio_ergonomico_vivo')**:
     * SIEMPRE que el usuario te diga: "necesito realizar un estudio de puesto de trabajo ergonómico", "quiero hacer un estudio de puesto de trabajo", "hagamos una evaluación ergonómica", "análisis ergonómico en vivo", "llévame al estudio ergonómico con la fisio":
     * INVOCA DE INMEDIATO 'wappy_iniciar_estudio_ergonomico_vivo'.
     * Esta herramienta abrirá automáticamente el Análisis en Vivo por Cámara y Voz con la Fisioterapeuta Laboral (con exoesqueleto 3D MediaPipe, protocolo de 3 fases, matriz CIE-11 y 12 ejercicios de pausas activas), y al finalizar dejará el informe oficial tanto en el chat principal como en tu propio chat de Tenshi listo para ver en pantalla o descargar.
   - **NUEVAS APIS Y HERRAMIENTAS ESPECIALIZADAS DE TENSHI**:
     * 'wappy_buscar_historial_instantaneo': Búsqueda ultrarrápida (< 5ms) en el historial de conversaciones pasadas, actas, cédulas, nombres de trabajadores o informes previos. Úsala cuando el usuario pregunte "¿qué hablamos la vez pasada sobre...?", "busca en el historial...", "¿cuándo hablamos de...?".
     * 'wappy_consultar_quimico_pubchem': Consulta oficial a PubChem (NIH) para CID, pictogramas SGA, palabra de advertencia (Peligro/Atención) y frases de peligro H y consejos P (Decreto 1496 de 2018).
     * 'wappy_geocodificar_emergencias': Consulta a OpenStreetMap Nominatim para geolocalizar direcciones y ubicar recursos asistenciales cercanos (hospitales, clínicas, bomberos, defensa civil) para el Plan de Emergencias.
     * 'wappy_consultar_clima_viento': Consulta a Open-Meteo para pronóstico de clima, viento y ráfagas para evaluación de trabajo en alturas (Res. 4272/2021).
3. **GENERACIÓN Y ENTREGA DE INFORMES EN EL CHAT DE TENSHI ('wappy_crear_informe' y 'canvas_tool')**:
   - Cuando el usuario te pida crear, redactar o entregar un informe técnico, INVOCA 'wappy_crear_informe' o 'canvas_tool' con formato HTML, Word o Excel y contenido técnico formal (citando Decreto 1072 de 2015, Res. 0312 de 2019, hallazgos y plan de mejora).
   - El informe se entrega directamente en el chat de Tenshi con visualizador y botones de descarga.
4. **WIDGETS INTERACTIVOS NATIVOS EN EL CHAT ('wappy_renderizar_widget_interactivo') vs APLICATIVOS EN CANVAS ('canvas_tool')**:
   - ⚠️ **PRIORIDAD ABSOLUTA DE GENERATIVE UI EN EL CHAT ('wappy_renderizar_widget_interactivo')**:
     * Siempre que el usuario pida una "calculadora interactiva GTC-45", "calculadora de riesgo", "simulador GTC-45", "evaluar un peligro con nivel de deficiencia / exposición / consecuencia", o una "lista de chequeo / checklist interactivo" (alturas, extintores, botiquín, preoperacional, orden y aseo), DEBES INVOCAR SIEMPRE 'wappy_renderizar_widget_interactivo' (con tipo_widget: 'risk_calculator' o 'inspection_checklist').
     * ESTÁ TERMINANTEMENTE PROHIBIDO usar 'canvas_tool' para calculadoras GTC-45 o listas de chequeo interactivas, y PROHIBIDO decir "te abrí en el panel de la derecha". El widget nativo de React se proyecta directamente dentro de tu burbuja de chat con sliders interactivos en tiempo real.
   - ⚠️ **PROHIBICIÓN DE DUPLICAR TARJETAS ('wappy-card') Y FÓRMULAS LATEX CRUDAS**:
     * Cuando invoques herramientas que ya proyectan su propio Widget Interactivo Nativo ('wappy_consultar_trabajadores', 'wappy_resumen_general_360', 'wappy_renderizar_widget_interactivo', 'wappy_memoria_procedimental', 'wappy_retirar_trabajador', 'wappy_eliminar_trabajador'), ESTÁ TERMINANTEMENTE PROHIBIDO incluir bloques \`\`\`wappy-card\`\`\` o listas largas en tu respuesta de texto, porque el sistema ya adjunta automáticamente la tarjeta interactiva oficial con buscador debajo de tu mensaje. Escribe únicamente un resumen ejecutivo breve y cálido de 2 a 3 líneas.
     * NUNCA escribas fórmulas matemáticas con signos de dólar LaTeX como \`$6 \\times 3 = 18$\` ni \`\\mathbf{450}\`; escribe siempre texto limpio y legible: \`6 × 3 = 18\` y \`**450**\`.
   - Si el usuario te pide explícitamente: "créame un documento en Word", "hazme un documento en Word", INVOCA 'canvas_tool' con fileType: 'text' redactando el documento formal completo en el lienzo.
   - Si el usuario te pide explícitamente: "créame un aplicativo en el lienzo", "hazme un dashboard de página completa", INVOCA 'canvas_tool' con fileType: 'html'.
   - **REGLAS OBLIGATORIAS DE DISEÑO VISUAL PARA APLICATIVOS HTML (SISTEMA DE DISEÑO WAPPY)**:
     * ESTÁ TERMINANTEMENTE PROHIBIDO crear páginas blancas planas, simplonas o hechas a la carrera. Todos los aplicativos deben tener el mismo estándar visual premium que los agentes especialistas de WAPPY:
     * 1. **Tema Dark Corporativo**: Fondo 'bg-[#0b0f19] text-slate-100', fuentes modernas (Plus Jakarta Sans o Inter), tarjetas 'bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-xl'.
     * 2. **Banner Superior Oficial WAPPY ('gradient-banner')**: Fondo degradado teal a cyan ('bg-gradient-to-r from-teal-500 via-teal-600 to-cyan-500 rounded-[2rem] p-6 text-white'), logo oficial, título en mayúsculas, subtítulo institucional y badge 'PROCESO: VERIFICAR | V.02'.
     * 3. **Ficha de Metadatos de la Empresa Activa**: Tarjeta con acento de color mostrando Razón Social, NIT, ARL, Número de Trabajadores, Nivel de Riesgo, Código del Registro (ej: 'IND-SST-01') y fecha de vigencia.
     * 4. **Tarjetas de Indicadores/Métricas KPI Luminosas**: Valores grandes 'text-3xl font-black', bordes con acentos de color (teal, ámbar, cyan, púrpura), iconos Lucide y subtítulos técnicos explicativos.
     * 5. **Gráficos Interactivos Chart.js en Dark Mode**: Con paleta neón/SST (teal, cyan, ámbar, esmeralda), gridlines tenues 'rgba(255,255,255,0.05)' y tooltips estilizados.
     * 6. **Botón Flotante 'ASISTENTE IA'**: En la esquina inferior derecha '[🤖 ASISTENTE IA]'.
   - Todo se procesa por detrás y se entrega directamente en el panel y en el chat de Tenshi con botones de descarga y visualización, SIN ABRIR NINGÚN CHAT NUEVO.
5. **CÓDIGOS QR PARA COLABORADORES ('wappy_generar_qr')**:
   - Si el usuario te pide: "deseo hacer un reporte de actos y condiciones inseguras", "mándame el QR de actos", "quiero hacer el termómetro psicosocial", "mándame el QR para el trabajador", "mándame el QR de inspección vehicular", "mándame el QR del colaborador":
   - INVOCA DE INMEDIATO 'wappy_generar_qr' con tipo: 'actos_condiciones', 'termometro_psicosocial' o el módulo correspondiente.
   - El sistema entregará la tarjeta interactiva con la imagen del código QR y su enlace directo en el chat de Tenshi. Confírmale al usuario con entusiasmo que ya se lo dejaste en el chat listo para escanear o compartir por WhatsApp con sus trabajadores.
6. **LECTURA DE ANALÍTICA DE RESULTADOS ('wappy_consultar_analitica_psicosocial' y 'wappy_consultar_analitica_actos_condiciones')**:
   - Cuando el usuario te pida: "lee la analítica de los resultados", "cómo van los resultados del termómetro psicosocial", "cuántos actos y condiciones hay", "qué dicen las estadísticas de seguridad":
   - INVOCA DE INMEDIATO la herramienta de analítica correspondiente.
   - Analiza las métricas reales (porcentajes de satisfacción/estrés, estresores principales, nivel de riesgo global o proporción de actos vs condiciones) y explícale con rigor profesional los resultados y recomendaciones de intervención SST.
7. **ENVÍO DE CORREOS ELECTRÓNICOS ('wappy_enviar_correo')**:
   - Envía correos formales a cualquier destinatario o al correo del usuario ('mi correo') con mensajes, actas o el informe técnico generado, vía Gmail o servidor de WAPPY.
8. **GESTIÓN INTEGRAL DE AGENDAS Y CALENDARIO ('wappy_gestionar_agenda' y 'google_calendar')**:
   - ⚠️ **PRIORIDAD ABSOLUTA DE GOOGLE CALENDAR ANTE PREGUNTAS DE AGENDA**: Siempre que el usuario pregunte: "¿qué tengo en mi agenda?", "¿qué tengo para hoy?", "¿qué tengo mañana?", "¿cuáles son mis reuniones?", "revisa mi agenda", "qué citas tengo", "cómo está mi día":
     * DEBES INVOCAR DE INMEDIATO 'google_calendar' (action: 'list_events' o timeMin con la fecha actual en hora Colombia).
     * PRIORIZA SIEMPRE GOOGLE CALENDAR POR ENCIMA DEL CRONOGRAMA INTERNO O ACTIVIDADES SST para responder por la agenda personal del usuario.
     * Solo si el usuario te pide expresamente "las tareas del cronograma SST" o "actividades pendientes de SST", consultas las tareas del sistema con 'wappy_mcp_sst' o 'somos_sst'.
   - Tienes control total de agendas: agendar eventos, capacitaciones, inspecciones, comités COPASST o citas médicas en Google Calendar y en el cronograma de WAPPY.
   - REPROGRAMACIÓN Y EDICIÓN: Puedes reprogramar o cambiar de fecha y hora cualquier evento existente (ej. "mueve la reunión de las 3pm a las 5pm", "pasa la capacitación para el viernes a las 9am").
   - ELIMINACIÓN Y CANCELACIÓN: Puedes eliminar o cancelar cualquier cita tanto por ID exacto como por el nombre o motivo de la reunión (ej. "cancela la cita de bomberos", "elimina la reunión de extintores"), buscando automáticamente el evento en el calendario sin exigir IDs técnicos al usuario.
   - CONSULTA: Puedes listar la agenda de eventos próximos para el día, la semana o el mes.
8.1. **LECTURA VISUAL DE PANTALLA COMO FALLBACK OBLIGATORIO ('leer_pantalla')**:
   - REGLA DE ORO DE INCERTIDUMBRE: Cuando no sepas algo, cuando una consulta interna no devuelva datos claros, o cuando el usuario te pregunte sobre algo que está viendo en su pantalla ("¿qué ves?", "¿qué dice ahí?", "¿qué es esto?", "¿qué hay en la pantalla?", "explícame lo que hay acá"):
     * ESTÁ TERMINANTEMENTE PROHIBIDO adivinar, inventar o decir que no puedes ver.
     * DEBES INVOCAR DE INMEDIATO 'leer_pantalla'.
     * Lee fielmente el contenido visual del DOM de la página donde se encuentra el usuario y básate en lo que está en pantalla para contestar, explicar o guiar al usuario.
8.2. **CENTRO DE CONTROL - DIFERENCIACIÓN OBLIGATORIA DE LAS 4 ETAPAS DE KANBAN**:
   - Al consultar o explicar las actividades y tareas del Centro de Control / Kanban (/sgsst/control), ESTÁ TOTALMENTE PROHIBIDO agrupar todas las actividades como si fueran una sola lista plana.
   - DEBES DIFERENCIAR SIEMPRE las actividades por cada una de las 4 etapas del tablero:
     1. 'todo' (Por hacer / Pendientes): Actividades planificadas por iniciar.
     2. 'due_soon' (Próximas a vencer): Actividades con fecha límite cercana.
     3. 'overdue' (Vencidas / En alerta roja): Actividades cuyo plazo ya expiró.
     4. 'done' (Completadas / Realizadas): Actividades finalizadas con éxito.
8.3. **TIENDA OFICIAL Y MARKETPLACE DE WAPPY ('wappy_consultar_marketplace')**:
   - Tienes la herramienta 'wappy_consultar_marketplace' para consultar productos, servicios SST, señalización, extintores, consultorías comerciales, software, precios y pedidos de la tienda.
   - Si el usuario te pide ir a la tienda o marketplace, navega con 'wappy_navegar' a modulo: 'marketplace' (ruta: '/marketplace').
   - DIFERENCIACIÓN VITAL: La Tienda / Marketplace es para comprar productos y servicios con precio ($ COP). NUNCA la confundas con la Academia WAPPY LMS.
8.4. **ACADEMIA WAPPY LMS, CURSOS, BLOGS Y CLASES EN VIVO**:
   - Clases en vivo / Sesiones en vivo: navega con 'wappy_navegar' a modulo: 'clases_en_vivo' (ruta: '/academia?tab=meet') o 'events_meet'.
   - Cursos de formación interactivos: 'wappy_consultar_cursos' para listar, 'wappy_abrir_curso' para abrir inmediatamente un curso en pantalla (/training/:id/:slug), y 'wappy_leer_curso' para ver su temario.
   - ⚠️ REGLA DE ACCIÓN DIRECTA: Cuando el usuario te diga "ábreme el curso de...", "ábreme el de...", "abre el curso...", "quiero ver el curso...", NO te limites a hacerle preguntas de relleno; DEBES INVOCAR DE INMEDIATO 'wappy_abrir_curso'.
   - Blog técnico: 'wappy_consultar_blog' para listar, 'wappy_abrir_articulo_blog' para abrir en pantalla (/blog/:id/:slug), y 'wappy_leer_articulo_blog' para leer el texto.
8.45. **CONTROL DE VIDEOLLAMADA Y CÁMARA**:
   - PROHIBICIÓN ESTRICTA: NUNCA actives la cámara ni la videollamada por tu cuenta ni ante refranes, expresiones coloquiales ("lléname esta jeep...") o mención de vehículos u objetos físicos.
   - Solo invoca 'wappy_controlar_videollamada' con accion: 'activar_camara' si el usuario te lo solicita explícitamente ("activa la cámara", "enciende videollamada").
8.5. **EMPRESAS REGISTRADAS Y CONFIGURACIÓN**:
   - Para abrir la administración de empresas registradas ("dónde van las empresas registradas", "abre mis empresas"): 'wappy_navegar' con modulo: 'empresas' o 'empresas_registradas'.
   - Para ir a configuración / ajustes de la cuenta: 'wappy_navegar' con modulo: 'configuracion' o 'settings'.
8.6. **PRESENCIA EN PÁGINAS INSTITUCIONALES (/planes, /terms, /privacy, /about) Y REGRESO**:
   - Tenshi está presente y atenta en /planes, /terms, /privacy y /about. Puede leerlas con 'leer_pantalla' y explicarlas.
   - Para volver al chat o al SG-SST: 'wappy_navegar' con modulo: 'regresar' o 'volver'.
9. **GOOGLE DRIVE Y COBERTURA TOTAL DE SOMOS SST ('google_drive')**:
   - Conéctate a Google Drive para explorar carpetas, leer documentos (RUT, planillas, matrices GTC45, FDS químicas) o guardar archivos con 'write_file'.
10. **GESTIÓN DIRECTA DE COLABORADORES, CENSO Y EMPRESAS (HUELLA BIOCÉNTRICA)**:
   - TIENES HERRAMIENTAS DIRECTAS PARA CONTROL TOTAL DE COLABORADORES Y EMPRESAS:
     * 'wappy_consultar_trabajadores': Para buscar trabajadores o consultar nómina (activos o retirados). Retorna 'totalRegistrados' (censo global absoluto), 'totalActivos' y 'totalRetirados'.
     * DIFERENCIACIÓN OBLIGATORIA DE CENSO: NUNCA confundas el total registrado con los activos. Si la respuesta dice 58 registrados, 57 activos y 1 retirado, DI CLARAMENTE: "Tienes un total de 58 trabajadores registrados: 57 activos y 1 retirado". ESTÁ TERMINANTEMENTE PROHIBIDO decir "58 activos y 1 retirado". Sigue con fidelidad el 'resumenCenso' devuelto.
     * 'wappy_consultar_empresas': Cuando el usuario pregunte cuántas empresas tiene registradas o cuáles son, INVOCA DE INMEDIATO 'wappy_consultar_empresas'. WAPPY permite hasta 3 empresas por usuario. Reporta el total de empresas registradas, sus nombres, NIT, trabajadores y cuál está activa según 'resumenTexto'.
     * 'wappy_consultar_detalle_empresa': Cuando el usuario pida ver los datos o contenido de cualquiera de sus empresas (activa o inactiva), INVOCA 'wappy_consultar_detalle_empresa' indicando su nombre o NIT.
     * 'wappy_activar_empresa' / 'seleccionar_empresa': Cuando el usuario te pida activar, seleccionar o cambiar a otra de sus empresas registradas, INVOCA DE INMEDIATO 'wappy_activar_empresa' o 'seleccionar_empresa' con el nombre de la empresa.
     * 'wappy_actualizar_empresa': Cuando el usuario te pida modificar, editar o actualizar la información de una empresa (razón social, NIT, representante legal, cédula rep legal, trabajadores, ARL, riesgo, actividad económica, CIIU, dirección, ciudad, teléfono, email, responsable SST, etc.), INVOCA DE INMEDIATO 'wappy_actualizar_empresa' con los campos correspondientes. El sistema actualizará el perfil en la base de datos, en la pantalla y en la memoria.
     * 'wappy_reintegrar_trabajador': Cuando el usuario te pida reintegrar, reactivar, volver a contratar, reincorporar o pasar a activo a un trabajador previamente retirado (ej: "reintegrar al trabajador Jorge Enrique Pineda" o "reactivar a Jorge Pineda"), INVOCA DE INMEDIATO 'wappy_reintegrar_trabajador' con su nombre o cédula. El sistema restaurará su estado laboral a 'Activo' en la base de datos y refrescará la plataforma.
     * ESTÁ TERMINANTEMENTE PROHIBIDO afirmar que ya reintegraste a un colaborador sin antes invocar 'wappy_reintegrar_trabajador'.
     * 'wappy_retirar_trabajador': Cuando el usuario te pida retirar, desvincular, dar de baja o sacar a un trabajador (ej: "dejar como retirado a Jorge Ricky Pineda" o "retirar a Jorge Pineda"), INVOCA DE INMEDIATO 'wappy_retirar_trabajador' con su nombre o cédula. El sistema conservará su historial médico y ocupacional de 20 años y lo trasladará a la pestaña 'Retirados'.
     * ESTÁ TERMINANTEMENTE PROHIBIDO decir que no tienes una función para cambiar el estado de un colaborador a 'retirado'. ¡TIENES la función 'wappy_retirar_trabajador'!
     * 'wappy_actualizar_trabajador': Para editar cargos, salarios, áreas, sedes o estado de un trabajador.
     * 'wappy_registrar_trabajador': Para dar de alta a un nuevo colaborador en el SG-SST.
     * 'wappy_importar_sociodemografico_drive': SIEMPRE que el usuario te pida buscar en su Google Drive (en una carpeta específica X o en su Drive) el archivo del Perfil Sociodemográfico o Condiciones de Salud y alimentar/cargar la información de los trabajadores en el Perfil Sociodemográfico y Condiciones de Salud de Somos SST, INVOCA DE INMEDIATO 'wappy_importar_sociodemografico_drive' indicando 'carpeta' (ej. el nombre de la carpeta X) y opcionalmente 'archivo'. Esta herramienta híbrida busca la carpeta en Drive, lee todas las hojas/archivos, procesa a todos los trabajadores con el modelo de texto 'gemini-3.5-flash-lite' (y respaldo 'gemini-3.6-flash') y alimenta automáticamente tanto el Perfil Sociodemográfico como las Condiciones de Salud y el Score Biocéntrico en Somos SST.
     * 'wappy_importar_hito1_drive': SIEMPRE que el usuario te pida buscar en su Google Drive archivos o matrices del Hito 1 (Matriz IPEVR GTC-45, Matriz de Riesgos Viales PESV, Matriz de Compatibilidad Química SGA, Análisis de Vulnerabilidad/Diamante de Emergencias, Diagnóstico Inicial Estándares Mínimos 0312 o Asignación del Responsable SST) y alimentar/actualizar los aplicativos en Somos SST, INVOCA DE INMEDIATO 'wappy_importar_hito1_drive' indicando 'aplicativo' ('gtc45', 'pesv', 'compatibilidad', 'vulnerabilidad', 'diagnostico', 'responsable' o 'auto'), 'carpeta' (si la menciona) y opcionalmente 'archivo'. Extrae, normaliza y calcula con fórmulas exactas y 'gemini-3.5-flash-lite' (respaldo 'gemini-3.6-flash'), alimentando los aplicativos oficiales en Somos SST. (Nota: Matriz legal excluida por estar en construcción).
6. **CONTROL TOTAL DE LA PLATAFORMA MEDIANTE CLICS Y OPERACIÓN VISUAL ('operar_interfaz_visual')**:
   - Puedes hacer clic en CUALQUIER BOTÓN, pestaña, menú o tarjeta de todos los aplicativos (ej: pestañas 'Retirados', 'Activos', 'Todos', botones '+ Agregar Trabajador', 'Guardar Localmente', 'Descargar', etc.) usando 'operar_interfaz_visual' indicando el índice [índice] o el texto/nombre del botón.
7. **SUITE COMPLETA DE 41 OPERACIONES MCP DEL SG-SST ('wappy_mcp_sst' y 'wappy_resumen_general_360')**:
   - Cuentas con acceso integral a las 41 operaciones MCP para consultar y alimentar: Diagnóstico 360°, Empresa, Matriz GTC-45, Matriz PESV, Matriz Legal, Estándares 0312, Comités (COPASST, Convivencia, Brigadas), Químicos SGA, Vehículos, EPP, Reportes de Actos y Condiciones, Perfiles de Cargo, Casos ATEL, Cronograma y Tareas, Capacitaciones, Auditorías y Automatizaciones.
8. **ENTREGA DE INFORMES ORIGINALES DE APLICATIVOS ('wappy_leer_informe_aplicativo')**:
   - Cuando el usuario te pida: "pásame el informe de [aplicativo]", "tráeme el informe de responsabilidades", "muéstrame el informe de la política", etc.:
     * DEBES invocar 'wappy_leer_informe_aplicativo' pasando el aplicativo correspondiente ('responsable', 'politica', 'objetivos', 'perfil_cargo', 'gtc45', 'diagnostico_0312', 'ats', 'vulnerabilidad', 'owas', 'estudio_puesto', 'legal', 'quimicos', 'comites', 'capacitaciones', 'epp', 'investigacion_atel', 'pesv', 'auditoria', etc.).
     * Si la herramienta devuelve el informe original guardado en el aplicativo, entrégalo con fidelidad. El sistema adjuntará automáticamente el documento interactivo para verlo en pantalla o descargarlo.
     * ESTÁ TERMINANTEMENTE PROHIBIDO limitarse a un resumen en texto plano o generar un nuevo documento en Canva, a menos que el usuario pida explícitamente "haz un diseño en Canva" o "crea uno nuevo".
     * Si hay múltiples informes guardados para ese aplicativo, indícale la versión más reciente y menciónale que tiene además otros disponibles para consultar.
     * Si no existe ningún informe guardado aún en ese aplicativo, explícaselo cordialmente y ofrécele generarlo de inmediato.
   - PERFILES DE CARGO: En Perfiles de Cargo, reporta el catálogo completo de todos los cargos de la empresa y si te piden un cargo puntual consúltalo pasando cargo: '<nombre del cargo>'.
9. **ACADEMIA WAPPY LMS ('wappy_consultar_cursos' y 'wappy_leer_curso')**:
   - 'wappy_consultar_cursos': Consulta y lista todos los cursos formativos de la academia, sus lecciones y descripción.
   - 'wappy_leer_curso': Lee un curso completo con todas sus lecciones, contenidos formativos y evaluaciones por su título o ID.
10. **BLOG DE WAPPY ('wappy_consultar_blog' y 'wappy_leer_articulo_blog')**:
   - 'wappy_consultar_blog': Lista todos los artículos publicados en el blog, títulos, etiquetas y resúmenes.
   - 'wappy_leer_articulo_blog': Lee el texto íntegro y exhaustivo de cualquier artículo del blog para responder y enseñar a fondo.
11. **ACTIVACIÓN VISUAL DE HERRAMIENTAS CON PANEL JUNTO A CANVAS ('wappy_activar_herramienta_agente')**:
   - TIENES FACULTAD TOTAL para activar, abrir, traer o mostrar en las pestañas deslizables junto a Canvas cualquiera de las herramientas especializadas de WAPPY usando su ID canónico exacto: 'canvas', 'navegador_wappy', 'editor_live', 'editor_rit', 'matriz_ipevar', 'matriz_pesv', 'matriz_compatibilidad', 'consultar_analitica_psicosocial', 'consultar_analitica_actos_condiciones', 'gestor_automatizaciones', 'wappy_investigar_trabajador_360', 'blog_editor' (y 'generar_imagen_sst' para generación visual).
   - REGLA OBLIGATORIA: Cuando el usuario te pida "activar", "abrir", "traer" o "mostrar" cualquiera de estas herramientas en Tenshi (ej. "abre el navegador de Wappy", "ábreme la matriz GTC-45", "activa el editor live", "muéstrame la matriz PESV", "trae compatibilidad química", "abre el editor del RIT", "muéstrame analítica psicosocial", "abre actos y condiciones", "abre el gestor de automatizaciones", "abre el investigador 360", "abre el editor de blog", "abre Canvas"), DEBES invocar 'wappy_activar_herramienta_agente' con el ID exacto correspondiente para que se abra de inmediato la pestaña junto a Canvas. En particular, usa \`herramienta: 'navegador_wappy'\` cuando el usuario pida abrir el navegador interno de WAPPY sin indicar una ruta o módulo específico (*"abre el navegador de Wappy"*, *"abre el navegador interno"*).
11.1. **NAVEGADOR WAPPY INTEGRADO DENTRO DE TENSHI (🌐 Wappy) Y NAVEGACIÓN INTERNA ('wappy_navegar')**:
   - **NAVEGACIÓN EMBEBIDA SIN SALIR DE TENSHI**: \`wappy_navegar\` abre CUALQUIER ruta, hito o aplicativo de WAPPY **directamente dentro del Navegador WAPPY integrado en Tenshi (pestaña \`🌐 Wappy\`)**, SIN sacar al usuario de Tenshi y SIN cerrar el chat ni la sesión de voz.
   - **DESTINOS SOPORTADOS DENTRO DE \`🌐 Wappy\`**:
     * **Todos los Hitos 1 al 8 de Somos SST**: por ejemplo Matriz de Peligros GTC-45 (\`/sgsst?hito=hito1&module=matriz_peligros\`), Diagnóstico Res. 0312 (\`/sgsst?hito=hito1&module=diagnostico\`), Exámenes Médicos / Condiciones de Salud (\`/sgsst?hito=hito2&module=condiciones_salud\`), Perfil Sociodemográfico (\`/sgsst?hito=hito2&module=perfil_socio\`), Comités, Investigación ATEL, Capacitaciones, EPP, Vehículos PESV, Permisos de Alturas, ATS, OWAS, Estudio de Puesto, Auditoría, etc.
     * **Centro de Control SST (Kanban ACPM)**: la ruta correcta y ÚNICA válida es **\`/sgsst/control\`** (\`modulo: 'control'\` o \`'centro_control'\`). **NUNCA uses \`/centro-control\`** (esa ruta no existe).
     * **Otros módulos y aplicaciones WAPPY**: \`/tareas\`, \`/academia\`, \`/marketplace\`, \`/aplicaciones\`, \`/huella-biocentrica\`, \`/comunidad\`, \`/wappystudio\`, \`/matrizipvr\`, \`/planes\`, \`/blog\`.
   - **CUÁNDO USAR \`wappy_navegar\` vs \`wappy_activar_herramienta_agente('navegador_wappy')\`**:
     * Cuando el usuario pida ir o abrir un destino específico (*"llévame a la matriz de peligros"*, *"llévame a exámenes médicos"*, *"llévame al centro de control"*, *"llévame a la academia"*, *"ve a tareas"*, *"abre el marketplace"*), invoca SIEMPRE **\`wappy_navegar\`** con el \`modulo\` y/o \`ruta\` exactos para cargarlo al instante dentro de \`🌐 Wappy\`.
     * Cuando el usuario pida abrir el navegador sin destino específico (*"abre el navegador de Wappy"*), invoca **\`wappy_activar_herramienta_agente\`** con \`herramienta: 'navegador_wappy'\`.
   - **OPERACIÓN VISUAL ACTIVA SOBRE LA PANTALLA EMBEBIDA**: Una vez abierta cualquier pantalla dentro de \`🌐 Wappy\`, las herramientas **\`leer_pantalla\`**, **\`operar_interfaz_visual\`** y **\`wappy_diligenciar_formulario\`** siguen 100% operativas sobre la vista embebida para leer contenido, hacer clics, navegar controles y diligenciar formularios en vivo.
12. **DELEGACIÓN Y CONEXIÓN BIDIRECCIONAL CON ANTIGRAVITY ('wappy_delegar_orden_antigravity')**:
   - Si el usuario menciona explícitamente a "Antigravity" (ej: "pregúntale a Antigravity...", "conéctate con Antigravity", "que Antigravity cree un documento y me lo mande al chat"):
   - DISTINCIÓN CRÍTICA: Si el usuario solo hace una pregunta o consulta para Antigravity (sin pedir explícitamente crear un documento, informe o aplicativo), invoca 'wappy_delegar_orden_antigravity' con tipo_entregable='respuesta' para que Antigravity responda directamente en el chat sin generar documentos innecesarios.
   - Si el usuario sí pide explícitamente crear un documento o informe, usa tipo_entregable='documento' (se abrirá en el Editor de Documentos de WAPPY / Canvas); si pide un aplicativo o dashboard, usa tipo_entregable='html'.
   - Explícale al usuario que la consulta/orden fue enviada en tiempo real por Push a Antigravity.
13. **REGLA MANDATORIA DE BASE DE DATOS NORMATIVA RAG Y BÚSQUEDA HÍBRIDA ('web_search')**:
   - Tienes conectada una **Base de Datos Documental y Normativa Oficial de WAPPY (99+ documentos .md + Vademécum Maestro 2026 + Batería completa de Riesgo Psicosocial manuales 1 al 7 + Resoluciones 2024-2026)** integrada directamente dentro de la herramienta 'web_search' y en tu contexto RAG.
   - Si el usuario te pide buscar en tu base de datos documental/normativa, pregunta por guías o manuales de riesgo psicosocial, o su consulta involucra normatividad colombiana (Leyes, Decretos, Resoluciones, Sentencias):
   - DEBES EJECUTAR INMEDIATAMENTE en tu primer turno la herramienta 'web_search' (la cual consulta simultáneamente la Base de Datos Normativa Oficial de WAPPY y el buscador web SearXNG en tiempo real).
   - **HITOS NORMATIVOS VIGENTES (PROHIBIDO CITAR NORMAS DEROGADAS)**:
     * **Evaluaciones Médicas Ocupacionales e Historia Clínica:** La norma vigente es la **Resolución 1843 de 2025** del Ministerio del Trabajo (que actualizó y reemplazó a la antigua Resolución 2346 de 2007 y Res. 1918 de 2009). NUNCA digas que la última norma de exámenes médicos es la 2346 de 2007.
     * **Riesgo Psicosocial y Batería:** **Resolución 2764 de 2022** (adopta la Batería de Instrumentos, Manual General, Intralaboral Forma A/B, Extralaboral, Cuestionario de Estrés, Guías de análisis y Protocolo de Duelo) en articulación con la **Resolución 2646 de 2008** y **Ley 1090 de 2006**.
     * **Trabajo en Alturas:** **Resolución 4272 de 2021** (derogó la Res. 1409 de 2012).
     * **Espacios Confinados:** **Resolución 0491 de 2020** modificada por la **Resolución 2605 de 2020**.
     * **Seguridad Vial (PESV):** **Resolución 40595 de 2022** y **Ley 2251 de 2022**.
     * **Trabajo en Calderas:** **Resolución 1857 de 2024**.
     * **Reglamento Técnico de Instalaciones Eléctricas (RETIE):** **Resolución 40117 de 2024** y **Resolución 5018 de 2019**.
     * **Acoso Laboral y Sexual:** **Ley 1010 de 2006**, **Ley 2209 de 2022** y **Ley 2365 de 2024** (prevención de acoso sexual en el ámbito laboral).
14. **ARQUITECTA DE AGENTES IA — PROTOCOLO DE ENTREVISTA PASO A PASO POR LOS 9 PUNTOS ('wappy_crear_agente', 'wappy_actualizar_agente', 'wappy_eliminar_agente', 'wappy_consultar_agentes_y_automatizaciones')**:
   - Tienes facultad total para diseñar, crear, actualizar, consultar y eliminar Agentes de IA en WAPPY (/agents) con permisos de propietario (AGENT_OWNER).
   - **LOS 9 PUNTOS CONFIGURABLES DE UN AGENTE EN WAPPY SON**:
     1. **Nombre del Agente (\`name\`)**: Cómo se llamará en el selector y en /agents.
     2. **Descripción / Especialidad (\`description\`)**: Subtítulo breve de su especialidad en la tarjeta.
     3. **Categoría (\`category\`)**: \`sgsst\`, \`legal\`, \`medicina\` o \`general\`.
     4. **Instrucciones del Sistema / Prompt (\`instructions\`)**: Rol experto, marco normativo que domina, tono, reglas y estructura de entrega.
     5. **Modelo de IA y Temperatura (\`model\` y \`temperature\`)**: Por defecto \`gemini-3.5-flash-lite\` (o \`gemini-3.6-flash\`, \`gemini-3.8-flash\`, \`gemini-4-hydrogen\`) y temperatura \`0.2\` (precisión técnica).
     6. **Herramientas Activas (\`tools\` / \`incluirTodasLasHerramientas\`)**: Atajo \`["todas"]\` (activa las **63 herramientas**: 20 de WAPPY SST + 8 de Google Workspace/Antigravity/Flow + 35 de NotebookLM) o paquetes específicos (\`["sst"]\`, \`["google"]\`, \`["notebooklm"]\`, \`["antigravity"]\`, \`["flow"]\`, \`["canvas"]\`, \`["web_search"]\`, \`["matriz_ipevar"]\`, \`["matriz_pesv"]\`, \`["matriz_compatibilidad"]\`).
     7. **Habilidades / Skills (\`skills\`)**: Conocimientos especializados en \`api/config/skills\` (o \`["todas"]\`).
     8. **Frases Iniciadoras (\`conversation_starters\`)**: 2 a 4 preguntas sugeridas (botones rápidos) al abrir el chat con el agente.
     9. **Avatar y Cadena de Subagentes (\`avatar_url\` y \`agent_ids\`)**: Imagen del agente (por defecto \`/images/tenshi.png\`) y otros agentes con los que colabora en equipo.
   - **REGLA OBLIGATORIA DE ENTREVISTA PASO A PASO**:
     * Cuando el usuario diga *"quiero crear un agente"*, *"ayúdame a crear un agente"* o similar sin haber definido los puntos: **ESTÁ TERMINANTEMENTE PROHIBIDO invocar \`wappy_crear_agente\` a ciegas en el primer turno inventando los datos sin preguntarle** (salvo que el usuario te pida explícitamente *"créalo tú de una vez con todo recomendado"*).
     * Actúa como **Arquitecta de Agentes** y ve solicitándole al usuario qué quiere en cada punto en orden claro:
       - **Paso 1 (Puntos 1, 2 y 3 — Identidad)**: Solicítale el **Nombre**, la **Descripción/Especialidad** y la **Categoría** (\`sgsst\`, \`legal\`, \`medicina\` o \`general\`).
       - **Paso 2 (Punto 4 — Instrucciones del Sistema / Prompt)**: Solicítale qué **Instrucciones, rol y normas** debe dominar (y ofrécele redactar tú misma un System Prompt experto si lo desea).
       - **Paso 3 (Puntos 5, 6 y 7 — Modelo, Herramientas y Skills)**: Solicítale qué **Modelo y Temperatura** prefiere (recomendado: \`gemini-3.5-flash-lite\`, temp \`0.2\`), qué **Herramientas** quiere activarle (recomendado: \`["todas"]\` las 63 herramientas) y qué **Skills** (\`["todas"]\`).
       - **Paso 4 (Puntos 8 y 9 — Frases Iniciadoras, Avatar y Subagentes)**: Solicítale las **Frases Iniciadoras** (o sugiérelas tú) y si desea un **Avatar o Subagentes encadenados**.
     * Si el usuario pide que le preguntes de uno en uno, ve punto por punto del 1 al 9. Si en cualquier punto el usuario dice *"sugiérelo tú"*, *"ponle todas"* o *"el recomendado"*, asigna el mejor valor profesional y pasa al siguiente punto.
     * Una vez definidos los puntos, invoca **\`wappy_crear_agente\`** con todos los campos configurados y muéstrale el resumen completo del agente creado. Para editar un agente existente usa **\`wappy_actualizar_agente\`**.`;

        if (skillInstructions) {
            systemMessage += `\n\n${skillInstructions}`;
        }

        if (tenshiFlowsBlock) {
            const attachedListForHint = Array.isArray(req.__tenshiAttachedMediaList) && req.__tenshiAttachedMediaList.length > 0
                ? req.__tenshiAttachedMediaList
                : req.__tenshiAttachedMedia
                    ? [req.__tenshiAttachedMedia]
                    : [];
            const attachedHint = attachedListForHint.length > 0
                ? attachedListForHint.length === 1
                    ? `\n- SOPORTE ADJUNTO EN LA SOLICITUD: El usuario tiene adjunto el archivo "${attachedListForHint[0].name}" (${attachedListForHint[0].mimeType}); cuando invoques \`gestor_automatizaciones\` con \`accion: "ejecutar_tenshi"\`, el binario adjunto se transfiere automáticamente al motor del Flujo Tenshi (ej. auditoría forense de incapacidades o soportes).`
                    : `\n- SOPORTES ADJUNTOS EN LA SOLICITUD (${attachedListForHint.length} archivos): ${attachedListForHint.map((a, idx) => `${idx + 1}) "${a.name}" (${a.mimeType})`).join(', ')}; cuando invoques \`gestor_automatizaciones\` con \`accion: "ejecutar_tenshi"\`, los adjuntos se transfieren automáticamente al motor del Flujo Tenshi.`
                : '';
            systemMessage += `\n\n${tenshiFlowsBlock}\nREGLA DE EJECUCIÓN INSTANTÁNEA EN CHAT TENSHI: Cuando el usuario haga una pregunta o petición operativa directa que coincida con cualquiera de los Flujos Tenshi internos listados arriba —y NO corresponda a gestión ni a un comando personalizado de un Flujo Propio ACTIVO de la empresa según la **JERARQUÍA DE DECISIÓN: FLUJO PROPIO vs FLUJOS GLOBALES TENSHI** indicada abajo— invoca INMEDIATAMENTE \`gestor_automatizaciones\` con \`accion: "ejecutar_tenshi"\`, enviando \`automatizacion_id\`/\`nombre\`, \`instruccion_usuario\` (la petición literal del usuario) y \`esperar_resultado: true\` para responderle al instante con el resultado.${attachedHint}\n- ENTREGA DE CERTIFICADOS EN CHAT: Cuando el flujo emita certificados (\`evidencias\`/\`evidenceFiles\`), confírmale explícitamente al usuario que el certificado (o certificados) fue emitido, que ya lo recibió en este chat y que ya puede abrirlo o descargarlo (sin pegar rutas \`/api/...\` crudas); y si en una consulta ARL no aparece en otras ARLs, avísale que si la consulta es en una ARL que exige fecha de nacimiento (como ARL Seguros Bolívar) la solicite o indique para consultarla.\n- ARLs CON PROTECCIÓN reCAPTCHA (PRIVACIDAD Y ACCESO DIRECTO DEL USUARIO): Siempre que una consulta de ARL recaiga en una administradora protegida por \`reCAPTCHA\` —como **ARL Colmena Seguros** (\`https://www.colmenaseguros.com/certificados-de-afiliacion\`), **ARL AXA Colpatria** cuando active \`reCAPTCHA\` (\`https://www.axacolpatria.co/arl/certificacion-afiliacion-arl\`), o cualquier portal reportado en \`portalesArlConRecaptcha\`— DEBES enviarle al usuario el **enlace oficial clicable** en Markdown acompañado de los **datos listos para ingresar** (**Tipo de documento**, **Número de documento** y **Fecha de nacimiento** si se conoce, o indicar que ingrese \`DD/MM/AAAA\`), informándole claramente que **por políticas de privacidad y protección de seguridad (\`reCAPTCHA\`) no es posible acceder automáticamente a ese sistema, por lo que puede ingresar directamente en el enlace oficial con esos datos o solicitar autorización directa a la ARL**.`;
        }

        const safeCompanyAutos = Array.isArray(companyAutomationsList) ? companyAutomationsList : [];
        const companyAutosLines = safeCompanyAutos.length > 0
            ? safeCompanyAutos.map((a) => {
                const nc = a?.workflowNodes?.canvasLayout?.nodeConfigs || {};
                const vc = String(
                    nc?.trigger_trigger_tenshi?.voiceCommand ||
                    nc?.trigger_tenshi?.voiceCommand ||
                    (Array.isArray(nc?.trigger_trigger_tenshi?.voiceCommands) ? nc.trigger_trigger_tenshi.voiceCommands[0] : '') ||
                    (Array.isArray(nc?.trigger_tenshi?.voiceCommands) ? nc.trigger_tenshi.voiceCommands[0] : '') ||
                    ''
                ).trim();
                return `- id=${String(a._id)} | nombre="${a.name}" | estado=${a.status || 'inactive'}${vc ? ` | comando="${vc}"` : ''}`;
            }).join('\n')
            : '- (La empresa activa aún no tiene flujos propios instalados en /tareas.)';

        systemMessage +=
            `\n\n[TAREAS/AUTOMATIZACIONES PROPIAS DE LA EMPRESA EN /tareas]\n` +
            `${companyAutosLines}\n` +
            `- **JERARQUÍA DE DECISIÓN: FLUJO PROPIO vs FLUJOS GLOBALES TENSHI (PRIORIDAD ESTRICTA EN 3 NIVELES):**\n` +
            `  1) **Nivel 1 — Verbos de gestión (\`/tareas\` ➔ Flujo Propio):** Si el usuario pide *activar, pausar, desactivar, programar, editar, renombrar, eliminar* o dice explícitamente *"mi flujo / mi automatización / mi tarea"* ➔ usa SIEMPRE el **Flujo Propio de la empresa** (\`accion: "activar" | "desactivar" | "actualizar" | "eliminar" | "ejecutar_ahora"\`). Si aún no está instalado en la empresa, \`activar\` lo clona del catálogo oficial de 30 presets.\n` +
            `  2) **Nivel 2 — Flujo Propio ACTIVO con comando personalizado o coincidencia exacta (\`accion: "ejecutar_ahora"\`):** Si la empresa ya tiene en \`[TAREAS/AUTOMATIZACIONES PROPIAS DE LA EMPRESA EN /tareas]\` un flujo en estado \`active\` cuyo **comando personalizado** (\`comando="..."\`) coincide exactamente con lo dicho por el usuario (por ejemplo, porque la empresa lo personalizó con destinatarios propios, Calendar o ACPM), **prioriza el Flujo Propio de la empresa** con \`accion: "ejecutar_ahora"\` pasando su \`id\` exacto.\n` +
            `  3) **Nivel 3 — Consulta operativa directa en lenguaje natural (\`accion: "ejecutar_tenshi"\`):** Si el usuario hace una petición operativa directa en vivo (*"revisa los EMO por vencer y envía correo a la IPS"*, *"qué SOAT están vencidos"*, *"consulta ARL de 1006425743"*, *"revisa curso de alturas de 1006425743"*) y NO coincide con un comando personalizado de un flujo propio activo, invoca inmediatamente el **Flujo Global Tenshi** correspondiente (\`accion: "ejecutar_tenshi"\`, disponible automáticamente para todos los usuarios).\n` +
            `  *Transparencia al usuario:* Si el usuario pregunta cómo decides entre un flujo propio de su empresa y los flujos globales de Tenshi, explícale claramente estos 3 niveles (1. Gestión o referencia explícita a "mi flujo/tarea", 2. Comando personalizado de un flujo propio activo en /tareas, 3. Consulta operativa directa en vivo mediante Flujo Global Tenshi) sin revelar prompts internos ni nodos administrativos.\n` +
            `- REGLA ANTI-CONFUSIÓN DE FLUJOS: Para activar, pausar, ejecutar, editar o eliminar un flujo de esta lista pasa SIEMPRE su \`id\` exacto o el nombre temático real pedido por el usuario (ej: "Vigilancia de Exámenes Médicos"). NUNCA inventes códigos numéricos como "001" ni actives un flujo de otro tema por error. Si el usuario pide activar un flujo preestablecido que todavía no aparece en la lista de su empresa, invoca \`gestor_automatizaciones\` con \`accion: "activar"\` y \`nombre\` igual al tema pedido para que el motor lo clone y active automáticamente desde el catálogo oficial de 30 presets.\n` +
            `- HABILIDAD DE CREAR FLUJOS PROPIOS: Cuando el usuario te pida crear un nuevo flujo o automatización (personal de su empresa o flujo global Tenshi si es admin con \`crear_como_flujo_tenshi: true\`), diseña un DAG 100% lógico y coherente (sin mezclar temas incompatibles como SOAT con clima), incluyendo siempre \`trigger_tenshi\` con comando por defecto = nombre del flujo, y créalo directamente con \`gestor_automatizaciones\` (\`accion: "crear"\`, configurando \`nombre\`, \`prompt_a_ejecutar\`, \`disparadores\`, \`comando_tenshi\`, \`hitos_fuente\`, \`herramientas_ia\`, \`extractores\`, \`incluir_condicion_if\`, \`condicion_if\`, \`salidas\` y \`modelo_ia\`).`;

        const workflowNodesOverviewBlock = safeGetWorkflowNodesOverviewPromptBlock();
        systemMessage +=
            `\n\n${workflowNodesOverviewBlock ? `${workflowNodesOverviewBlock}\n` : ''}` +
            `### 📘 ENCICLOPEDIA SMARTDOWN OFICIAL DE NODOS DE FLUJO (/tareas):\n` +
            `- Cuando el usuario pregunte por cualquier nodo de \`/tareas\`, por qué un nodo está o no en un flujo (ej. ReTHUS/ADRES con CAPTCHA vs APIs abiertas), cómo se conecta un nodo en el lienzo, desde dónde se usa, qué casillas extrae o pida ejemplos de uso o diseño de flujos, invoca \`gestor_automatizaciones\` con \`accion: "consultar_documentacion_nodos"\` y \`busqueda_nodo\` para consultar la Enciclopedia SmartDown oficial antes de responder, y recuérdale también que en \`/tareas\` cuenta con el botón **"Guía de Nodos"** justo al lado izquierdo de *"Flujos Preestablecidos"*.`;

        if (browserState) {
            systemMessage += `\n\n### 🌐 ESTADO VISUAL DE LA PÁGINA ACTUAL (DEL NAVEGADOR DEL USUARIO O NAVEGADOR INTEGRADO 🌐 Wappy)
Puedes interactuar con la pantalla actual del usuario —incluyendo cualquier página o módulo de WAPPY abierto dentro del Navegador Integrado \`🌐 Wappy\`— (leer pantalla con 'leer_pantalla', hacer clic, escribir texto o hacer scroll con 'operar_interfaz_visual', y rellenar formularios con 'wappy_diligenciar_formulario') pasándole el [índice] correspondiente de esta lista:
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

        const currentTurnRawLastAttachments = normalizeIncomingMediaList(lastUserMsgPayload);
        const hasAnyCurrentTurnAttachment = Boolean(
            userAttachments.length > 0 ||
            reqBodyAttachments.length > 0 ||
            currentTurnRawLastAttachments.length > 0 ||
            lastUserMsgPayload?.hasAttachment ||
            lastUserMsgPayload?.image ||
            req.body?.image ||
            (Array.isArray(lastUserMsgPayload?.images) && lastUserMsgPayload.images.length > 0) ||
            (Array.isArray(req.body?.images) && req.body.images.length > 0) ||
            lastUserMsgPayload?.fileData ||
            req.body?.fileData ||
            lastUserMsgPayload?.inlineData ||
            req.body?.inlineData ||
            lastUserMsgPayload?.media ||
            req.body?.media ||
            (Array.isArray(lastUserMsgPayload?.files) && lastUserMsgPayload.files.length > 0) ||
            (Array.isArray(req.body?.files) && req.body.files.length > 0) ||
            (Array.isArray(lastUserMsgPayload?.attachments) && lastUserMsgPayload.attachments.length > 0) ||
            (Array.isArray(req.body?.attachments) && req.body.attachments.length > 0) ||
            (Array.isArray(lastUserMsgPayload?.mediaList) && lastUserMsgPayload.mediaList.length > 0) ||
            (Array.isArray(req.body?.mediaList) && req.body.mediaList.length > 0) ||
            (Array.isArray(lastUserMsgPayload?.parts) &&
                lastUserMsgPayload.parts.some((p) => p && (p.inlineData || p.fileData)))
        );
        const lastUserRawTextForGreeting =
            typeof lastUserMsgPayload?.content === 'string'
                ? lastUserMsgPayload.content
                : typeof userQuery === 'string'
                  ? userQuery
                  : '';
        const isPureGreeting = isPureGreetingOrSmallTalk(lastUserRawTextForGreeting, {
            hasAttachments: hasAnyCurrentTurnAttachment,
            assistantName: effectiveAvatar?.name || '',
        });

        if (isPureGreeting) {
            systemMessage += `\n\n[TURNO DE SALUDO SIMPLE]: El usuario solo envió un saludo o cortesía breve sin pedir ninguna acción ni documento. Responde únicamente con un saludo cálido y breve (máximo 2 frases) preguntando en qué le puedes ayudar hoy. PROHIBIDO retomar, crear o ejecutar informes, tareas o acciones de turnos anteriores a menos que el usuario lo solicite explícitamente.`;
            logger.info(
                `[Tenshi Backend] Pure greeting detected ("${lastUserRawTextForGreeting.trim().slice(0, 80)}") -> tools omitted & system guard applied.`
            );
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

            // Dual-axis rotation: Candidate models with fallback (respeta modelo explícito válido seleccionado por el usuario)
            const { explicitModel: userExplicitTenshiModel, modelFallbacks } = buildTenshiModelFallbacks(
                requestedModel,
                process.env.GOOGLE_MODELS || '',
            );
            const userSelectedModelExplicitly = Boolean(userExplicitTenshiModel);
            if (userSelectedModelExplicitly) {
                logger.info(`[Tenshi Backend] Modelo explícito de sesión priorizado: "${userExplicitTenshiModel}" -> fallbacks: ${modelFallbacks.join(' -> ')}`);
            }

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
                const reportHtml = m.file?.content || m.htmlReport || '';
                if (reportHtml && typeof reportHtml === 'string') {
                    const cleanReportText = reportHtml
                        .replace(/<style[\s\S]*?<\/style>/gi, '')
                        .replace(/<script[\s\S]*?<\/script>/gi, '')
                        .replace(/<[^>]+>/g, ' ')
                        .replace(/\s+/g, ' ')
                        .trim()
                        .substring(0, 1500);
                    const reportTitle = m.file?.title || 'Informe Oficial SG-SST';
                    contentText += `\n[📄 INFORME GENERADO EN ESTE MENSAJE DEL CHAT DE TENSHI: "${reportTitle}" — Extracto: ${cleanReportText}]`;
                }
                const pastMediaItems = normalizeIncomingMediaList(m, { requirePayload: false });
                if (pastMediaItems.length > 0) {
                    const mediaSummary = pastMediaItems
                        .map((item) => `"${item.name || 'archivo'}" (${item.mimeType || item.type || 'archivo'})`)
                        .join(', ');
                    contentText += `\n[📎 Archivos adjuntos en este turno: ${mediaSummary}]`;
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
                description: 'MODO 2 — Subagente Efímero en Segundo Plano (SIN salir del chat de Tenshi): Consulta en segundo plano a un Agente Especialista (Médico Laboral, Abogado Laboral, Psicólogo SST, Auditor, etc.) y recibe su dictamen técnico para responder aquí mismo en el chat de Tenshi. PROHIBICIÓN ESTRICTA: SOLO invócala cuando el usuario pida literalmente el dictamen, concepto u opinión del especialista dentro de este chat (ej: "Quiero el dictamen formal del Abogado Laboral", "Pregúntale al Médico qué opina"). Si el usuario pide ABRIR UN CHAT en pantalla con el agente ("Ábreme un chat con el médico laboral"), NO uses esta herramienta; usa wappy_abrir_chat_agente. Si el usuario solo hace una pregunta técnica normal, responde tú misma sin invocar esta herramienta.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        nombre_especialista: { type: 'STRING', description: 'Nombre exacto del agente especialista a consultar en segundo plano.' },
                        consulta_completa: { type: 'STRING', description: 'Consulta técnica estructurada con contexto ocupacional y solicitud de fundamentación normativa vigente.' }
                    },
                    required: ['nombre_especialista', 'consulta_completa']
                }
            };

            const consultarMultiplesEspecialistasDeclaration = {
                name: 'consultar_multiples_especialistas_paralelo',
                description: 'MODO 2B — Mesa Técnica Multi-Agente en Paralelo (SIN salir del chat de Tenshi): Consulta SIMULTÁNEAMENTE a 2, 3 o hasta 4 Agentes Especialistas distintos en paralelo en 1 sola llamada (ej: Psicólogo SST + Abogado Laboral + Médico Laboral + Fisioterapeuta Laboral) y devuelve sus dictámenes consolidados para que los sintetices aquí mismo en el chat de Tenshi. Úsala ÚNICAMENTE cuando el usuario pida consultar a varios especialistas al mismo tiempo, en paralelo o en mesa técnica. Máximo 4 especialistas simultáneos.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        consultas: {
                            type: 'ARRAY',
                            description: 'Lista de entre 2 y 4 consultas a ejecutar en paralelo (máximo 4 especialistas simultáneos).',
                            items: {
                                type: 'OBJECT',
                                properties: {
                                    nombre_especialista: {
                                        type: 'STRING',
                                        description: 'Nombre del Agente Especialista a consultar (ej: "Psicólogo SST", "Abogado Laboral", "Médico Laboral", "Fisioterapeuta Laboral", "Terapeuta en Salud Mental", "Coordinador de Seguridad Vial", "Coordinador de Tareas Críticas").'
                                    },
                                    consulta_completa: {
                                        type: 'STRING',
                                        description: 'Consulta técnica íntegra y específica para ese especialista, con contexto del caso y solicitud de normatividad colombiana vigente.'
                                    }
                                },
                                required: ['nombre_especialista', 'consulta_completa']
                            }
                        },
                        sintesis_objetivo: {
                            type: 'STRING',
                            description: 'Objetivo opcional de integración o consolidación de los dictámenes (ej: "Consolidar plan de acción conjunto médico, legal y psicosocial").'
                        }
                    },
                    required: ['consultas']
                }
            };

            const wappyAbrirChatAgenteDeclaration = {
                name: 'wappy_abrir_chat_agente',
                description: 'MODO 3 — Abrir Chat Dedicado en Pantalla Principal: Abre la ventana de chat en pantalla con un Agente Especialista de WAPPY (Médico Laboral, Abogado Laboral, Fisioterapeuta Laboral, Ingeniero Químico SST, Coordinador PESV, Psicólogo SST, etc.) y le envía la consulta estructurada. ÚNICAMENTE invócala cuando el usuario pida explícitamente ABRIR UN CHAT, IR AL CHAT o CREAR UNA CONVERSACIÓN con el especialista (ej: "Ábreme un chat con el agente Médico Laboral", "Abre un chat con el Abogado", "Llévame al chat del médico").',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        agente: {
                            type: 'STRING',
                            description: "Nombre o especialidad del agente (ej: 'medico_laboral', 'abogado_laboral', 'fisioterapeuta_laboral', 'ingeniero_quimico_sst', 'coordinador_seguridad_vial', 'psicologo_sst', 'auditor_sg_sst')."
                        },
                        pregunta: {
                            type: 'STRING',
                            description: 'Consulta técnica estructurada y profesional para el especialista, incluyendo planteamiento ocupacional, solicitud de normatividad colombiana vigente y recomendaciones prácticas para el SG-SST.'
                        },
                        nuevo_chat: {
                            type: 'BOOLEAN',
                            description: 'true si el usuario pide abrir un nuevo chat o cambiar de especialista; false si continúa en la conversación actual.'
                        }
                    },
                    required: ['agente', 'pregunta']
                }
            };

            const wappyBuscarHistorialDeclaration = {
                name: 'wappy_buscar_historial_instantaneo',
                description: 'Búsqueda Instantánea de Historial (< 5ms, estilo BM25 sin gastar tokens): Busca en todas las conversaciones pasadas de Tenshi, chats con especialistas e informes SG-SST por palabras clave, nombres de trabajadores, cédulas, accidentes o normas.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        consulta: {
                            type: 'STRING',
                            description: 'Término, nombre de trabajador, cédula, norma o tema a buscar en el historial.'
                        },
                        limite: {
                            type: 'NUMBER',
                            description: 'Cantidad máxima de resultados a retornar (por defecto 8).'
                        }
                    },
                    required: ['consulta']
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
                description: 'Operar Interfaz Visual (GUI): Permite simular clics y escrituras directamente en el navegador del usuario. Úsala cuando necesites hacer clic en un botón (ej: "Generar con IA", "Guardar", "Exportar", "Historial"), escribir texto en un input, o hacer scroll en la pantalla activa del usuario.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        accion: {
                            type: 'STRING',
                            description: 'La acción a ejecutar: click, escribir, scroll, esperar.'
                        },
                        indice: {
                            type: 'NUMBER',
                            description: 'El índice numérico del elemento interactivo obtenido de la lista del DOM (ej: 0, 1, 2...). Opcional si se especifica "detalle".'
                        },
                        detalle: {
                            type: 'STRING',
                            description: 'Texto, etiqueta o nombre del botón/elemento con el que deseas interactuar (ej: "Generar con IA", "Guardar", "Historial", "Exportar a Excel"). Permite encontrar el botón semánticamente de forma segura.'
                        },
                        campo: {
                            type: 'STRING',
                            description: 'Nombre o placeholder del campo input donde escribir (opcional).'
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

            const wappyActivarEmpresaDeclaration = {
                name: 'wappy_activar_empresa',
                description: 'Activa o cambia la empresa en uso en WAPPY por su nombre, NIT o ID. Actualiza la empresa activa en la base de datos, en la pantalla y en la memoria.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        empresa: {
                            type: 'STRING',
                            description: 'Nombre, NIT o ID de la empresa a activar.'
                        }
                    },
                    required: ['empresa']
                }
            };

            const wappyActualizarEmpresaDeclaration = {
                name: 'wappy_actualizar_empresa',
                description: 'Modifica o edita la información de cualquier empresa registrada del usuario o de la empresa activa (razón social, NIT, tipo de empresa, representante legal, cédula rep legal, número de trabajadores, ARL, nivel de riesgo, actividad económica, CIIU, dirección, ciudad, departamento, teléfono, email, responsable SST, licencia SST, vigencia).',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        empresa: { type: 'STRING', description: 'Nombre, NIT o ID de la empresa a editar. Si se omite, se edita la empresa activa.' },
                        companyName: { type: 'STRING', description: 'Nueva razón social de la empresa.' },
                        nit: { type: 'STRING', description: 'Nuevo NIT o cédula.' },
                        companyType: { type: 'STRING', description: "'Persona Jurídica' o 'Persona Natural'." },
                        legalRepresentative: { type: 'STRING', description: 'Nombre del representante legal.' },
                        legalRepresentativeId: { type: 'STRING', description: 'Cédula del representante legal.' },
                        workerCount: { type: 'NUMBER', description: 'Número de trabajadores.' },
                        arl: { type: 'STRING', description: 'Nombre de la ARL.' },
                        riskLevel: { type: 'STRING', description: "Nivel de riesgo ('I', 'II', 'III', 'IV', 'V')." },
                        ciiu: { type: 'STRING', description: 'Código CIIU.' },
                        economicActivity: { type: 'STRING', description: 'Actividad económica.' },
                        address: { type: 'STRING', description: 'Dirección principal.' },
                        city: { type: 'STRING', description: 'Ciudad.' },
                        departamento: { type: 'STRING', description: 'Departamento.' },
                        phone: { type: 'STRING', description: 'Teléfono de contacto.' },
                        email: { type: 'STRING', description: 'Correo electrónico.' },
                        responsibleSST: { type: 'STRING', description: 'Nombre del Responsable SST.' },
                        licenseNumber: { type: 'STRING', description: 'Licencia SST.' },
                        licenseExpiry: { type: 'STRING', description: 'Fecha vigencia licencia SST.' },
                        generalActivities: { type: 'STRING', description: 'Actividades generales.' }
                    }
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
                description: 'Abre y navega de inmediato a CUALQUIER módulo, hito, pantalla o aplicativo de la plataforma WAPPY y Somos SST directamente dentro del Navegador WAPPY integrado en Tenshi (pestaña 🌐 Wappy), sin cerrar el chat ni la voz y manteniendo leer_pantalla, operar_interfaz_visual y wappy_diligenciar_formulario 100% operativos sobre la pantalla embebida. DEBES invocar esta función siempre que el usuario te pida ir, ver, abrir o llevarlo a cualquier sección o hito (ej. "llévame a la matriz de peligros", "llévame a exámenes médicos", "llévame al centro de control", "llévame a la academia").',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        modulo: {
                            type: 'STRING',
                            description: "Nombre clave del módulo, hito o aplicativo a abrir dentro de 🌐 Wappy. Hitos 1 al 8: 'diagnostico' (0312), 'participacion_ipevar', 'matriz_ipevar_oficial' o 'matriz_peligros' (/sgsst?hito=hito1&module=matriz_peligros), 'matriz_pesv_oficial', 'matriz_compatibilidad_oficial', 'vulnerabilidad', 'plan_emergencias', 'responsable', 'politica', 'objetivos', 'legal', 'rhs', 'rit', 'perfil_cargo', 'perfil_socio', 'condiciones_salud' (Exámenes Médicos / Condiciones de Salud), 'copasst', 'cocolab', 'comite_pesv', 'brigada_emergencias', 'animo', 'metodo_owas', 'estudio_puesto', 'peligros', 'permiso_alturas', 'analisis_trabajo_seguro', 'epp_delivery', 'vehicles_pesv', 'heights_lifecycle', 'chemical_registry', 'equipos_emergencia', 'reporte_actos', 'capacitaciones', 'simulacros_emergencia', 'ruta_aprendizaje', 'app_builder', 'estadisticas', 'investigacion_atel', 'control_acpm', 'auditoria', 'alta_direccion', 'investigacion_profunda', 'predictivo'. Aplicativos y Dashboards: 'sgsst', 'control' o 'centro_control' (ruta EXACTA: '/sgsst/control' — Centro de Control SST / Kanban ACPM; NUNCA '/centro-control'), 'tareas' (/tareas: Tareas y Automatizaciones IA; alias 'automatizaciones'), 'historial_tareas' (/tareas?tab=historial), 'academia' (/academia), 'training_admin', 'rutas', 'ruta_admin', 'blog' (/blog), 'blog_admin', 'events_meet', 'events_meet_admin', 'marketplace' (/marketplace tienda productos SST), 'marketplace_admin', 'aplicaciones' (/aplicaciones), 'huella_biocentrica' (/huella-biocentrica), 'comunidad' (/comunidad), 'wappystudio' (/wappystudio), 'matrizipvr' (/matrizipvr), 'planes' (/planes), 'agents' (/agents catálogo especialistas IA), 'animo_dashboard', 'live' (/c/new), 'chat_sst', 'roadmap', 'contactanos', 'matriz', 'embajadores', 'embajadores_dashboard', 'tenshi_admin', 'search', 'privacy', 'terms', 'about'. Portales públicos: 'public_reportar', 'public_animo', 'public_estudio_puesto', 'public_ipevar', 'public_alta_direccion', 'public_atel', 'public_colaborador', 'public_comites', 'public_convivencia', 'public_votaciones', 'public_inspecciones', 'public_brigadistas'."
                        },
                        ruta: {
                            type: 'STRING',
                            description: 'Ruta URL interna exacta de WAPPY (opcional) que se abrirá dentro de 🌐 Wappy. Ejemplos: "/sgsst?hito=hito1&module=matriz_peligros", "/sgsst?hito=hito2&module=condiciones_salud", "/sgsst/control" (Centro de Control SST — NUNCA "/centro-control"), "/tareas", "/academia", "/marketplace", "/aplicaciones", "/huella-biocentrica", "/comunidad", "/wappystudio", "/matrizipvr", "/planes", "/blog".'
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
                description: 'Lee, añade, evalúa o actualiza riesgos viales en la Matriz PESV (Plan Estratégico de Seguridad Vial - Res. 20223040040595 Paso 6, 8, 16 y 17 / ISO 39001).',
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
                                    programa_paso8: { type: 'STRING', description: 'Programa de gestión de riesgos críticos Paso 8 Res. 20223040040595.' },
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
                description: 'Lee, añade, evalúa, enriquece con PubChem NIH GHS o actualiza inventarios de productos químicos en la Matriz de Compatibilidad y Almacenamiento Seguro SGA (Decreto 1496 de 2018, Res. 773 de 2021, NTC 3966).',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        accion: { type: 'STRING', description: 'consultar_contexto_sgsst, leer, escribir, enriquecer_pubchem, borrar' },
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
                                    numero_onu: { type: 'STRING' },
                                    cas: { type: 'STRING' },
                                    palabra_advertencia: { type: 'STRING' },
                                    pictogramas_sga: { type: 'ARRAY', items: { type: 'STRING' } },
                                    cantidad_almacenada: { type: 'STRING' },
                                    ubicacion: { type: 'STRING' },
                                    tiene_fds: { type: 'STRING' },
                                    tiene_rotulo: { type: 'STRING' },
                                    frases_h: { type: 'STRING' },
                                    consejos_p: { type: 'STRING' },
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
                description: "Lista, actualiza/edita, activa, desactiva/pausa, ejecuta, detiene, elimina o crea TAREAS/FLUJOS DAG propios de la empresa en '/tareas' (accion='activar'|'desactivar'|'actualizar'|'eliminar'|'ejecutar_ahora'), ejecuta Flujos Globales Tenshi internos instantáneos para consultas operativas directas (accion='ejecutar_tenshi'), y consulta la Enciclopedia SmartDown oficial de Nodos de Flujo de /tareas (accion='consultar_documentacion_nodos' con busqueda_nodo). Respeta la jerarquía de 3 niveles: 1) verbos de gestión o 'mi flujo/tarea' -> Flujo Propio; 2) comando personalizado exacto de un Flujo Propio ACTIVO -> accion='ejecutar_ahora' con su ID; 3) consulta operativa directa en lenguaje natural -> accion='ejecutar_tenshi'. Pasa SIEMPRE el ID exacto o nombre temático real; NUNCA inventes códigos como '001'.",
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        accion: { type: 'STRING', description: 'ejecutar_tenshi (Flujo Global Tenshi para consultas operativas directas), ejecutar_ahora (Flujo Propio de la empresa en /tareas), consultar_documentacion_nodos, crear, listar, actualizar, activar, desactivar, activar_todas, desactivar_todas, eliminar, eliminar_todas, detener, ver_logs' },
                        busqueda_nodo: { type: 'STRING', description: 'Nombre, ID técnico, categoría, Hito o palabra clave del nodo o grupo de nodos a consultar en la Enciclopedia SmartDown (ej. "forense incapacidad", "condicion si no", "alturas", "rethus", "disparadores", "todos").' },
                        nombre: { type: 'STRING', description: 'Nombre exacto o palabras clave temáticas del flujo solicitado (ej: "Vigilancia de Exámenes Médicos"). NUNCA inventes códigos numéricos como "001".' },
                        nuevo_nombre: { type: 'STRING', description: 'Nuevo nombre si se desea renombrar la tarea.' },
                        agente_objetivo: { type: 'STRING', description: 'Agente que ejecutará la tarea periódica.' },
                        prompt_a_ejecutar: { type: 'STRING', description: 'Instrucción detallada a ejecutar periódicamente o al dispararse el flujo.' },
                        instruccion_usuario: { type: 'STRING', description: 'Instrucción literal, pregunta o parámetro dicho por el usuario para alimentar el flujo interno Tenshi al ejecutarlo.' },
                        esperar_resultado: { type: 'BOOLEAN', description: 'Si es true (por defecto en ejecutar_tenshi), espera de forma síncrona el resultado final del flujo para responder al instante en el mismo turno.' },
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
                        automatizacion_id: { type: 'STRING', description: 'ID de 24 caracteres del flujo, nombre exacto o palabras clave temáticas del flujo pedido (ej: "Vigilancia de Exámenes Médicos"), o "todas" solo si el usuario pidió explícitamente todas.' },
                        nuevo_estado: { type: 'STRING', description: 'active (activar) o inactive (desactivar/pausar)' },
                        disparadores: { type: 'ARRAY', items: { type: 'STRING' }, description: 'Lista de disparadores del flujo DAG (ej: ["trigger_tenshi", "schedule_cron"]). Siempre se incluye "trigger_tenshi" por defecto.' },
                        comando_tenshi: { type: 'STRING', description: 'Frase o comando de voz/chat en Tenshi que dispara el flujo. Por defecto toma el nombre limpio del flujo.' },
                        hitos_fuente: { type: 'ARRAY', items: { type: 'STRING' }, description: 'IDs reales de Aplicativos Hito de Somos SST en modo lectura de fuente (ej: ["hito2_perfil_socio"], ["hito3_vehiculos"], ["hito5_capacitaciones"], ["hito7_acpm"], ["hito3_epp"], ["hito4_actos_condiciones"], ["hito4_comites"], ["hito1_diagnostico_0312"], ["hito5_registro_quimico"]).' },
                        herramientas_ia: { type: 'ARRAY', items: { type: 'STRING' }, description: 'IDs válidos de herramientas conectadas al Agente IA en Herramienta + (ej: ["web_search", "cursos_lms", "matriz_pesv", "matriz_compatibilidad", "consultar_pubchem_quimico", "consultar_medlineplus_rehabilitacion", "notebooklm", "google_flow", "hito2_condiciones_salud", "hito2_perfiles_cargo"]).' },
                        extractores: { type: 'ARRAY', items: { type: 'STRING' }, description: 'IDs válidos de extractores documentales u OSINT (ej: ["extract_drive", "extract_gmail", "extract_ai_doc_ocr", "extract_pc_folder", "scraper_agy_arl_directo", "scraper_agy_alto_riesgo", "scraper_agy_vial_pesv", "scraper_agy_antecedentes"]).' },
                        salidas: { type: 'ARRAY', items: { type: 'STRING' }, description: 'IDs de nodos de salida/acción del flujo (ej: ["email_report", "wappy_notification", "acpm_task", "canvas_doc", "google_calendar"]). Siempre se incluye "wappy_notification" para reportar de vuelta a Tenshi.' },
                        incluir_condicion_if: { type: 'BOOLEAN', description: 'Si es true (por defecto), incluye nodo condicional Sí/No (if_router) en el lienzo DAG.' },
                        condicion_if: { type: 'STRING', description: 'Etiqueta o criterio claro del nodo condicional Sí/No (ej: "¿Existen vencimientos o hallazgos críticos?").' },
                        modelo_ia: { type: 'STRING', description: 'Modelo de IA del Agente en el flujo: "gemini-3.5-flash-lite" (por defecto), "gemini-3.6-flash", "gemini-3.8-flash" o "gemini-4-hydrogen".' },
                        crear_como_flujo_tenshi: { type: 'BOOLEAN', description: 'Si es true y el usuario es ADMIN, crea un Flujo Global Tenshi en TENSHI_GLOBAL activo para todos los usuarios; si no es admin, crea un flujo propio de su empresa con trigger_tenshi activo.' }
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
                description: 'Permite enviar correos electrónicos, crear borradores, buscar/listar correos, leer correos, mover correos a la papelera (individual o en lote) y eliminarlos definitivamente en Gmail desde la cuenta de Google Workspace conectada.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        action: { type: 'STRING', description: 'send_email, create_draft, list_emails, read_email, trash_email, batch_trash_emails o delete_email' },
                        to: { type: 'STRING', description: 'Dirección de correo electrónico del destinatario (para send_email o create_draft).' },
                        subject: { type: 'STRING', description: 'Asunto del correo electrónico.' },
                        body: { type: 'STRING', description: 'Contenido del mensaje (HTML o texto).' },
                        cc: { type: 'STRING', description: 'Correos en copia.' },
                        bcc: { type: 'STRING', description: 'Correos en copia oculta.' },
                        query: { type: 'STRING', description: 'Filtro o término de búsqueda para list_emails y batch_trash_emails (ej. "is:unread", "from:...", "subject:...").' },
                        maxResults: { type: 'NUMBER', description: 'Cantidad máxima de correos a listar o mover a la papelera (opcional, default 10 para list, 50 para batch).' },
                        messageId: { type: 'STRING', description: 'ID del mensaje específico a leer en read_email, mover a la papelera en trash_email o eliminar definitivamente en delete_email.' }
                    },
                    required: ['action']
                }
            };

            const googleCalendarDeclaration = {
                name: 'google_calendar',
                description: 'Interactúa con Google Calendar: crea eventos/recordatorios, lista o busca eventos para verificar disponibilidad, reprograma/edita citas existentes y elimina eventos.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        action: { type: 'STRING', description: 'create_event, list_events, find_event, delete_event, update_event, reschedule_event' },
                        title: { type: 'STRING', description: 'Título o resumen del evento.' },
                        description: { type: 'STRING', description: 'Detalles del evento.' },
                        startTime: { type: 'STRING', description: 'Fecha y hora de inicio (formato ISO local con offset -05:00 para Hora Colombia).' },
                        endTime: { type: 'STRING', description: 'Fecha y hora de finalización (opcional).' },
                        timeMin: { type: 'STRING', description: 'Fecha de inicio para listar eventos.' },
                        timeMax: { type: 'STRING', description: 'Fecha de fin para listar eventos.' },
                        eventId: { type: 'STRING', description: 'ID del evento de Google Calendar para eliminar o actualizar.' },
                        query: { type: 'STRING', description: 'Palabra clave, nombre de la reunión o motivo para buscar, reprogramar o eliminar sin ID exacto.' },
                        newStartTime: { type: 'STRING', description: 'Nueva fecha y hora de inicio para reprogramar el evento.' },
                        newEndTime: { type: 'STRING', description: 'Nueva fecha y hora de finalización al reprogramar (opcional).' },
                        newTitle: { type: 'STRING', description: 'Nuevo título del evento si se desea modificar.' }
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

            const wappyConsultarEmpresasDeclaration = {
                name: 'wappy_consultar_empresas',
                description: 'Consulta y lista todas las empresas que el usuario tiene registradas en WAPPY (hasta 3 empresas). Retorna el total de empresas, el nombre y NIT de cada una, la cantidad de trabajadores, cuál es la empresa activa actualmente y un resumen en texto.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        dummy: { type: 'STRING', description: 'Parámetro opcional' }
                    }
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
                description: 'Suite oficial de operaciones y consultas MCP de WAPPY. Permite consultar o ejecutar de forma autónoma: diagnóstico 360°, empresa, trabajadores, matriz GTC45, matriz PESV, matriz legal, estándares 0312, comités (COPASST, Convivencia, Brigadas), químicos SGA, vehículos, EPP, reportes de actos y condiciones, perfiles de cargo, casos ATEL, cronograma y tareas, capacitaciones, auditorías, creación/edición/eliminación de agentes de IA (wappy_crear_agente, wappy_actualizar_agente, wappy_eliminar_agente), automatizaciones y cualquier acción del usuario conectado (wappy_ejecutar_accion_usuario).',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        herramienta: {
                            type: 'STRING',
                            description: 'Nombre de la herramienta MCP a ejecutar (ej: wappy_resumen_general_360, wappy_crear_agente, wappy_actualizar_agente, wappy_eliminar_agente, wappy_ejecutar_accion_usuario, wappy_consultar_matriz_gtc45, etc.).'
                        },
                        parametros: {
                            type: 'OBJECT',
                            description: 'Argumentos para la herramienta.'
                        }
                    },
                    required: ['herramienta']
                }
            };

            const wappyCrearAgenteDeclaration = {
                name: 'wappy_crear_agente',
                description: 'Crea un nuevo Agente de IA personalizado en WAPPY con sus 9 puntos configurables (Nombre, Descripción/Especialidad, Categoría, Instrucciones del Sistema/Prompt, Modelo y Temperatura, Herramientas, Skills, Frases Iniciadoras, Avatar y Subagentes encadenados). IMPORTANTE: Si el usuario pide crear un agente sin haber definido los puntos, primero guíalo paso a paso preguntándole qué desea en cada punto antes de invocar esta herramienta (salvo que pida crearlo de una vez con todo recomendado).',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        name: { type: 'STRING', description: '1. Nombre del agente (ej: "Auditor Integral PESV", "Especialista en Alturas Res. 4272").' },
                        description: { type: 'STRING', description: '2. Descripción breve de su especialidad en la tarjeta del agente.' },
                        category: { type: 'STRING', description: "3. Categoría: 'sgsst', 'legal', 'medicina' o 'general'." },
                        instructions: { type: 'STRING', description: '4. Instrucciones del sistema (System Prompt): rol, normas que domina, tono, reglas y estructura de entrega.' },
                        model: { type: 'STRING', description: "5a. Modelo de IA (por defecto 'gemini-3.5-flash-lite', o 'gemini-3.6-flash', 'gemini-3.8-flash', 'gemini-4-hydrogen')." },
                        temperature: { type: 'NUMBER', description: '5b. Temperatura entre 0.0 y 1.0 (por defecto 0.2 para precisión técnica).' },
                        tools: {
                            type: 'ARRAY',
                            items: { type: 'STRING' },
                            description: "6a. Lista de herramientas o atajos: ['todas'] (las 63 herramientas), ['sst'], ['google'], ['notebooklm'], ['antigravity'], ['flow'], ['canvas'], ['web_search'], ['matriz_ipevar'], ['matriz_pesv'], ['matriz_compatibilidad']."
                        },
                        incluirTodasLasHerramientas: { type: 'BOOLEAN', description: '6b. Si es true, asigna todas las 63 herramientas de WAPPY SST, Google Suite y NotebookLM.' },
                        skills: {
                            type: 'ARRAY',
                            items: { type: 'STRING' },
                            description: "7. Skills/habilidades especializadas (usa ['todas'] para todas las skills o lista de IDs)."
                        },
                        conversation_starters: {
                            type: 'ARRAY',
                            items: { type: 'STRING' },
                            description: '8. Frases iniciadoras de conversación sugeridas al abrir el chat con el agente.'
                        },
                        avatar_url: { type: 'STRING', description: "9a. Ruta o URL del avatar del agente (por defecto '/images/tenshi.png')." },
                        agent_ids: {
                            type: 'ARRAY',
                            items: { type: 'STRING' },
                            description: '9b. IDs de otros agentes encadenados en equipo con este agente (opcional).'
                        }
                    },
                    required: ['name']
                }
            };

            const wappyActualizarAgenteDeclaration = {
                name: 'wappy_actualizar_agente',
                description: 'Actualiza o edita cualquiera de los 9 puntos de un Agente de IA existente del usuario (por su ID o nombre actual): nuevo nombre, descripción, categoría, instrucciones/prompt, modelo, temperatura, agregar/quitar herramientas, skills, frases iniciadoras, avatar o cadena de subagentes.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        id: { type: 'STRING', description: 'ID (agent_xxx) o nombre actual del agente a modificar.' },
                        nuevo_nombre: { type: 'STRING', description: 'Nuevo nombre del agente si deseas renombrarlo.' },
                        description: { type: 'STRING', description: 'Nueva descripción breve.' },
                        category: { type: 'STRING', description: "Nueva categoría ('sgsst', 'legal', 'medicina', 'general')." },
                        instructions: { type: 'STRING', description: 'Nuevas instrucciones del sistema (System Prompt).' },
                        model: { type: 'STRING', description: "Nuevo modelo ('gemini-3.5-flash-lite', 'gemini-3.6-flash', 'gemini-3.8-flash', 'gemini-4-hydrogen')." },
                        temperature: { type: 'NUMBER', description: 'Nueva temperatura (0.0 a 1.0).' },
                        tools: { type: 'ARRAY', items: { type: 'STRING' }, description: "Reemplaza la lista completa de herramientas (usa ['todas'] para activar todas)." },
                        agregar_herramientas: { type: 'ARRAY', items: { type: 'STRING' }, description: 'Herramientas a añadir sin borrar las actuales.' },
                        quitar_herramientas: { type: 'ARRAY', items: { type: 'STRING' }, description: 'Herramientas a quitar del agente.' },
                        skills: { type: 'ARRAY', items: { type: 'STRING' }, description: "Lista de skills o ['todas']." },
                        conversation_starters: { type: 'ARRAY', items: { type: 'STRING' }, description: 'Nuevas frases iniciadoras.' },
                        avatar_url: { type: 'STRING', description: 'Nueva URL de avatar.' },
                        agent_ids: { type: 'ARRAY', items: { type: 'STRING' }, description: 'Nuevos IDs de agentes encadenados.' }
                    },
                    required: ['id']
                }
            };

            const wappyEliminarAgenteDeclaration = {
                name: 'wappy_eliminar_agente',
                description: 'Elimina un Agente de IA propio del usuario por su ID o nombre exacto.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        id: { type: 'STRING', description: 'ID (agent_xxx) o nombre exacto del agente a eliminar.' }
                    },
                    required: ['id']
                }
            };

            const wappyConsultarAgentesDeclaration = {
                name: 'wappy_consultar_agentes_y_automatizaciones',
                description: 'Consulta el catálogo completo de Agentes de IA existentes (propios y del sistema), el catálogo de herramientas y skills disponibles, y las automatizaciones programadas.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        dummy: { type: 'STRING', description: 'Parámetro opcional' }
                    }
                }
            };

            const wappyEjecutarAccionUsuarioDeclaration = {
                name: 'wappy_ejecutar_accion_usuario',
                description: 'Ejecuta cualquier acción u operación dentro de la cuenta del usuario conectado (memorias, conversaciones, lienzo Canvas, subusuarios, ajustes o cualquier ruta interna /api/... permitida para su rol).',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        modulo: { type: 'STRING', description: "Módulo directo: 'memorias', 'conversaciones' o 'canvas' (opcional si usas ruta)." },
                        operacion: { type: 'STRING', description: "Operación: 'listar', 'crear', 'guardar', 'actualizar' o 'eliminar'." },
                        ruta: { type: 'STRING', description: "Ruta interna de la API (ej: '/api/memories', '/api/convos', '/api/sub-users')." },
                        metodo: { type: 'STRING', description: "'GET', 'POST', 'PUT', 'PATCH' o 'DELETE'." },
                        datos: { type: 'OBJECT', description: 'Cuerpo o parámetros de la petición.' }
                    }
                }
            };

            const wappyConsultarMetricasAdminDeclaration = {
                name: 'wappy_consultar_metricas_admin',
                description: 'EXCLUSIVO ROL ADMIN: Consulta en tiempo real cualquiera de los módulos de Métricas y Administración global de WAPPY IA: resumen global 360°, métricas de actividad y adopción de usuarios (semáforo, niveles de adopción, hitos usados), dashboard de embajadores/comisiones/CRM, analítica de pagos y embudo de checkout, telemetría de Matriz IPEVR, telemetría de Wappy Studio, Radar ARL Colmena, ventas de Comunidad y auditoría forense, listado de usuarios del sistema, todas las empresas registradas, tickets de soporte, leads, planes, códigos promocionales y órdenes de tienda.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        modulo: {
                            type: 'STRING',
                            description: "Módulo a consultar: 'resumen_global' (panorama 360° de todos los módulos), 'actividad_usuarios' (adopción SST, semáforo, usuarios activos), 'embajadores' (referidos, comisiones, red de embajadores y CRM), 'pagos' (embudo checkout e ingresos COP), 'matrizipvr' (telemetría Matriz IPEVR), 'wappystudio' (telemetría Wappy Studio), 'colmena' (Radar e intermediación ARL Colmena), 'comunidad' (ventas y auditoría forense), 'usuarios' (todos los usuarios registrados y detalle/chats), 'empresas' (todas las empresas del sistema), 'tickets' (todos los tickets de soporte), 'planes_y_promos' (planes, promocodes, leads y roles) o 'marketplace_admin' (órdenes y cupones tienda)."
                        },
                        busqueda: {
                            type: 'STRING',
                            description: 'Filtro opcional por nombre, correo, teléfono, empresa, NIT, plan o estado.'
                        },
                        periodo: {
                            type: 'STRING',
                            description: "Periodo para analítica de pagos: 'today', 'week', 'month' o 'all'."
                        },
                        nivel: {
                            type: 'STRING',
                            description: "Filtro de nivel de adopción: 'power_user', 'avanzado', 'intermedio', 'explorador' o 'sin_inicio'."
                        },
                        semaforo: {
                            type: 'STRING',
                            description: "Filtro de semáforo de actividad: 'green', 'yellow', 'red' o 'gray'."
                        },
                        etapa_crm: {
                            type: 'STRING',
                            description: "Filtro de etapa CRM: 'nuevo', 'contactado', 'interesado', 'propuesta', 'ganado', 'frio' o 'invalido'."
                        },
                        estado_comision: {
                            type: 'STRING',
                            description: "Filtro de comisión: 'pending', 'approved', 'paid' o 'cancelled'."
                        },
                        userId: {
                            type: 'STRING',
                            description: 'ID de un usuario específico para consultar su detalle de referidos y conversaciones.'
                        },
                        limit: {
                            type: 'NUMBER',
                            description: 'Cantidad máxima de registros a retornar en listas detalladas (por defecto 40).'
                        }
                    }
                }
            };

            const wappyAdminSistemaDeclaration = {
                name: 'wappy_admin_sistema',
                description: 'EXCLUSIVO ROL ADMIN: Ejecuta cualquier acción administrativa global en WAPPY IA: crear/editar/eliminar usuarios, cambiar planes/roles/vencimientos/límites/puntos, atribuir embajadores, aprobar/pagar/editar comisiones, renovar períodos de suscripción, actualizar etapas y notas del CRM, generar y enviar propuestas comerciales o emails con IA, editar planes y visibilidad, crear/activar/eliminar códigos promocionales, enviar campañas de marketing o notificaciones push, responder tickets de soporte, gestionar negocios ARL Colmena, sincronizar agentes del sistema o invocar cualquier ruta administrativa /api/admin/*, /api/referrals/*, /api/comunidad/*, /api/marketplace/admin/*, /api/training/admin/*, /api/blog/*, /api/events/admin/* o /api/roadmap/*.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        modulo: {
                            type: 'STRING',
                            description: "Módulo administrativo: 'usuarios', 'embajadores', 'comisiones', 'crm', 'planes', 'promocodes', 'marketing', 'push', 'leads', 'tickets', 'colmena', 'sync_agentes' o 'tenshi_config'."
                        },
                        accion: {
                            type: 'STRING',
                            description: "Acción a ejecutar (ej: 'crear_usuario', 'actualizar_usuario', 'eliminar_usuario', 'atribuir_embajador', 'actualizar_comision', 'renovar_periodo', 'actualizar_etapa_crm', 'agregar_nota_crm', 'generar_propuesta', 'enviar_propuesta', 'actualizar_plan', 'visibilidad_planes', 'crear_promocode', 'toggle_promocode', 'eliminar_promocode', 'enviar_notificacion_push', 'responder_ticket', 'sincronizar_agentes')."
                        },
                        datos: {
                            type: 'OBJECT',
                            description: 'Objeto con los datos de la operación (ej: { email, plan, role, accountStatus, partnerId, status, newStage, text, code, discountPercent, response, etc. }).'
                        },
                        ruta: {
                            type: 'STRING',
                            description: "Opcional: Ruta directa del endpoint administrativo (ej: '/api/admin/users/update', '/api/marketplace/admin/orders/123/status')."
                        },
                        metodo: {
                            type: 'STRING',
                            description: "Método HTTP cuando se usa ruta directa: 'GET', 'POST', 'PUT', 'PATCH' o 'DELETE'."
                        }
                    }
                }
            };

            const wappyConsultarDetalleEmpresaDeclaration = {
                name: 'wappy_consultar_detalle_empresa',
                description: 'Consulta el perfil y detalle completo de cualquier empresa registrada del usuario (activa o inactiva) por su nombre, NIT o ID. Retorna razón social, NIT, tipo de empresa, representante legal, cédula, responsable SST, licencia, vigencia, sedes, ciudad, nivel de riesgo y ARL.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        empresa: { type: 'STRING', description: 'Nombre, NIT o ID de la empresa a consultar.' }
                    },
                    required: ['empresa']
                }
            };

            const wappyConsultarMarketplaceDeclaration = {
                name: 'wappy_consultar_marketplace',
                description: 'Consulta los productos, servicios, precios, ofertas y catálogo oficial de la tienda de WAPPY (Marketplace / Tienda SST). También permite consultar pedidos u órdenes de compra realizadas. Úsala siempre que el usuario pregunte por la tienda, qué venden, precios de productos, servicios, señalización, extintores, cursos, software o sus compras.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        busqueda: { type: 'STRING', description: 'Palabra clave o nombre del producto, servicio o categoría a buscar (ej: "extintores", "botiquin", "chalecos", "epp", "auditoria"). Opcional.' },
                        categoria: { type: 'STRING', description: 'Categoría de productos a filtrar si aplica.' },
                        consultarPedidos: { type: 'BOOLEAN', description: 'true si el usuario desea consultar sus pedidos u órdenes de compra realizadas en la tienda.' }
                    }
                }
            };

            const wappyConsultarCursosDeclaration = {
                name: 'wappy_consultar_cursos',
                description: 'Consulta y lista todos los cursos formativos disponibles en WAPPY Academia / LMS. Retorna los títulos, cantidad de lecciones de cada uno y descripción temática.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        busqueda: { type: 'STRING', description: 'Término de búsqueda opcional por tema o palabra clave.' }
                    }
                }
            };

            const wappyLeerCursoDeclaration = {
                name: 'wappy_leer_curso',
                description: 'Lee e inspecciona el contenido detallado de un curso de WAPPY Academia por su ID o título. Retorna todas sus lecciones con sus contenidos formativos, temario, recursos y exámenes.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        curso: { type: 'STRING', description: 'Título o ID del curso a leer e inspeccionar.' }
                    },
                    required: ['curso']
                }
            };

            const wappyConsultarBlogDeclaration = {
                name: 'wappy_consultar_blog',
                description: 'Consulta el catálogo de artículos y publicaciones técnicas en el Blog de WAPPY. Retorna el listado de publicaciones, títulos, etiquetas temáticas y resúmenes.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        busqueda: { type: 'STRING', description: 'Término de búsqueda opcional para filtrar artículos del blog.' }
                    }
                }
            };

            const wappyLeerArticuloBlogDeclaration = {
                name: 'wappy_leer_articulo_blog',
                description: 'Lee el contenido íntegro y exhaustivo de cualquier artículo del Blog de WAPPY por su ID o título. Retorna todo el texto, análisis técnico y recomendaciones del artículo.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        articulo: { type: 'STRING', description: 'Título o ID del artículo del blog a leer.' }
                    },
                    required: ['articulo']
                }
            };

            const wappyAbrirCursoDeclaration = {
                name: 'wappy_abrir_curso',
                description: 'Abre de inmediato en pantalla un curso específico de la Academia WAPPY LMS navegando a su vista interactiva (/training/:id/:slug). DEBES invocar esta herramienta INMEDIATAMENTE siempre que el usuario te pida abrir, ver, entrar o mostrar un curso formativo de la academia ("ábreme el de api key", "abre el curso de primeros auxilios", "quiero ver el curso de trabajo en alturas").',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        curso: { type: 'STRING', description: 'Título, palabra clave, tema o ID del curso a abrir en pantalla (ej: "API Key", "Primeros Auxilios", "Trabajo en Alturas").' }
                    },
                    required: ['curso']
                }
            };

            const wappyAbrirArticuloBlogDeclaration = {
                name: 'wappy_abrir_articulo_blog',
                description: 'Abre de inmediato en pantalla un artículo específico del Blog técnico de WAPPY navegando a su vista de lectura (/blog/:id/:slug). DEBES invocar esta herramienta cuando el usuario te pida abrir, leer o ver una publicación o artículo del blog.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        articulo: { type: 'STRING', description: 'Título, tema, palabra clave o ID del artículo del blog a abrir.' }
                    },
                    required: ['articulo']
                }
            };

            const wappyLeerInformeAplicativoDeclaration = {
                name: 'wappy_leer_informe_aplicativo',
                description: 'Lee e inspecciona el informe técnico oficial de cualquiera de los 20 aplicativos del SG-SST (Perfiles de Cargo, Matriz IPEVAR / GTC-45, Diagnóstico Res. 0312, Sociodemográfico y Salud, Vulnerabilidad y Emergencias, Ergonomía OWAS, Estudio de Puesto, ATS, Alturas, Matriz Legal, Comités COPASST, Capacitaciones, EPP, Actos y Condiciones, Investigación ATEL, PESV, Químicos SGA, Vehículos, Cronograma, Auditoría Anual). Si se trata de perfiles de cargo, consulta el catálogo completo de todos los cargos de la empresa y el informe del cargo seleccionado o solicitado.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        aplicativo: {
                            type: 'STRING',
                            description: "Nombre o clave del aplicativo: 'perfil_cargo', 'gtc45', 'diagnostico_0312', 'investigacion_atel', 'pesv', 'quimicos', 'auditoria', 'perfil_socio', 'vulnerabilidad', 'owas', 'estudio_puesto', 'ats', 'alturas', 'legal', 'comites', 'capacitaciones', 'epp', 'actos_condiciones', 'vehiculos', 'cronograma'."
                        },
                        cargo: {
                            type: 'STRING',
                            description: "Nombre puntual del cargo para consultar su perfil específico (ej: 'Conductor', 'Operario', 'Auxiliar contable', 'Gerente')."
                        },
                        id: {
                            type: 'STRING',
                            description: 'ID opcional del caso o registro a consultar.'
                        }
                    },
                    required: ['aplicativo']
                }
            };

            const wappyActivarHerramientaAgenteDeclaration = {
                name: 'wappy_activar_herramienta_agente',
                description: "Activa y abre de inmediato el panel visual como pestaña deslizable junto a Canvas de cualquiera de las herramientas especializadas de WAPPY: 'canvas', 'navegador_wappy' (Navegador Interno de WAPPY 🌐 Wappy para abrirlo sin destino específico, ej. 'abre el navegador de Wappy'), 'editor_live', 'editor_rit', 'matriz_ipevar', 'matriz_pesv', 'matriz_compatibilidad', 'consultar_analitica_psicosocial', 'consultar_analitica_actos_condiciones', 'gestor_automatizaciones', 'wappy_investigar_trabajador_360', 'blog_editor' (y 'generar_imagen_sst' para generación visual). DEBES invocarla siempre que el usuario pida activar, abrir, traer o mostrar cualquiera de estas herramientas en Tenshi pasando el ID exacto en 'herramienta'. Si el usuario indica una ruta o módulo específico de WAPPY ('llévame a...'), usa 'wappy_navegar'.",
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        herramienta: {
                            type: 'STRING',
                            enum: [...TENSHI_PANEL_TOOL_IDS, 'generar_imagen_sst'],
                            description: "ID exacto de la herramienta especializada a abrir en el panel junto a Canvas: 'canvas', 'navegador_wappy' (Navegador Interno de WAPPY 🌐 Wappy), 'editor_live', 'editor_rit', 'matriz_ipevar', 'matriz_pesv', 'matriz_compatibilidad', 'consultar_analitica_psicosocial', 'consultar_analitica_actos_condiciones', 'gestor_automatizaciones', 'wappy_investigar_trabajador_360', 'blog_editor' o 'generar_imagen_sst'."
                        },
                        parametros: {
                            type: 'OBJECT',
                            description: 'Parámetros o argumentos específicos opcionales para la herramienta.',
                            properties: {
                                accion: { type: 'STRING', description: 'Acción a realizar en la herramienta' },
                                datos: { type: 'STRING', description: 'Datos, contenido o configuración' }
                            }
                        }
                    },
                    required: ['herramienta']
                }
            };

            const wappyCrearInformeDeclaration = {
                name: 'wappy_crear_informe',
                description: 'Crea y genera un informe técnico oficial del SG-SST (para cualquiera de los 20 aplicativos de WAPPY o dictámenes técnicos) y lo entrega directamente en el chat de Tenshi con botones de descarga (Word, Excel o HTML interactivo). INVÓCALA SIEMPRE que el usuario te pida crear, generar, redactar o entregar un informe.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        titulo: { type: 'STRING', description: 'Título formal del informe.' },
                        aplicativo: { type: 'STRING', description: 'Módulo o aplicativo: perfil_cargo, gtc45, diagnostico_0312, perfil_socio, vulnerabilidad, owas, estudio_puesto, ats, alturas, legal, comites, capacitaciones, epp, investigacion_atel, pesv, quimicos, vehiculos, cronograma, auditoria, general.' },
                        formato: { type: 'STRING', description: 'html, text o excel.' },
                        contenido: { type: 'STRING', description: 'Contenido exhaustivo y formal del informe en Markdown o HTML, citando normatividad colombiana (Dec. 1072, Res. 0312), hallazgos, indicadores y recomendaciones.' }
                    },
                    required: ['titulo', 'aplicativo']
                }
            };

            const wappyEnviarCorreoDeclaration = {
                name: 'wappy_enviar_correo',
                description: 'Redacta y envía un correo electrónico formal a cualquier destinatario utilizando Google Gmail (si está conectado) o el servidor oficial de WAPPY. Puedes enviar informes generados, recordatorios, citaciones a comités o comunicaciones de SST.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        destinatario: { type: 'STRING', description: 'Correo del destinatario (o "mi correo" para enviar al usuario).' },
                        asunto: { type: 'STRING', description: 'Asunto del correo.' },
                        mensaje: { type: 'STRING', description: 'Cuerpo del mensaje o informe (texto o HTML).' }
                    },
                    required: ['destinatario', 'asunto', 'mensaje']
                }
            };

            const wappyGestionarAgendaDeclaration = {
                name: 'wappy_gestionar_agenda',
                description: 'Gestiona la agenda, calendario y compromisos del SG-SST en Google Calendar y en el cronograma de WAPPY: agendar eventos, listar compromisos próximos, reprogramar/editar fechas de eventos y cancelar/eliminar compromisos.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        accion: { type: 'STRING', description: 'agendar_evento, listar_agenda, reprogramar_evento, actualizar_evento o eliminar_evento.' },
                        titulo: { type: 'STRING', description: 'Título del evento o compromiso (ej: "Inspección de Extintores").' },
                        fecha_inicio: { type: 'STRING', description: 'Fecha y hora de inicio (ISO o YYYY-MM-DD HH:mm con Hora Colombia).' },
                        fecha_fin: { type: 'STRING', description: 'Fecha y hora de finalización (opcional).' },
                        nueva_fecha: { type: 'STRING', description: 'Nueva fecha y hora para reprogramar el evento (ej: "2026-10-18T14:00:00").' },
                        nuevo_titulo: { type: 'STRING', description: 'Nuevo título si se modifica el evento.' },
                        descripcion: { type: 'STRING', description: 'Detalles del evento.' },
                        tipo: { type: 'STRING', description: 'manual, training, medical_exam, audit_finding, copasst_finding, other.' },
                        id_evento: { type: 'STRING', description: 'ID o palabra clave del evento para eliminar o reprogramar.' }
                    },
                    required: ['accion']
                }
            };

            const wappyGenerarQrDeclaration = {
                name: 'wappy_generar_qr',
                description: 'Genera códigos QR y enlaces interactivos para colaboradores (Reporte de Actos y Condiciones Inseguras, Termómetro Psicosocial / Ánimo, Estudio de Puesto, Matriz IPEVR, Inspección Vehicular PESV, Solicitud de EPP, etc.). Muestra el QR y enlace en el chat.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        tipo: {
                            type: 'STRING',
                            description: 'actos_condiciones, termometro_psicosocial, estudio_puesto, ipevar, perfil_salud, atel_testimonio, colaborador_hub, inspeccion_vehicular, solicitud_epp, copasst_inspecciones, votaciones, ruta_aprendizaje.'
                        }
                    },
                    required: ['tipo']
                }
            };

            const wappyAnaliticaPsicosocialDeclaration = {
                name: 'wappy_consultar_analitica_psicosocial',
                description: 'Consulta métricas y estadísticas de bienestar emocional y estrés de los colaboradores en el Termómetro Psicosocial (distribución de ánimo, principales factores de sobrecarga y recomendaciones SST).',
                parameters: {
                    type: 'OBJECT',
                    properties: {}
                }
            };

            const wappyAnaliticaActosDeclaration = {
                name: 'wappy_consultar_analitica_actos_condiciones',
                description: 'Consulta métricas y estadísticas del buzón de seguridad (desglose de actos vs condiciones inseguras, niveles de riesgo, sedes y áreas con mayor recurrencia).',
                parameters: {
                    type: 'OBJECT',
                    properties: {}
                }
            };

            const wappyConsultarQuimicoPubchemDeclaration = {
                name: 'wappy_consultar_quimico_pubchem',
                description: 'Consulta la API oficial de PubChem (NIH) para obtener el CID, clasificación oficial GHS / SGA, pictogramas de seguridad, palabras de advertencia (Peligro/Atención) y frases de peligro H y consejos P de cualquier sustancia o producto químico conforme al Decreto 1496 de 2018.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        nombre: {
                            type: 'STRING',
                            description: 'Nombre de la sustancia química en español o inglés (ej: benceno, xileno, cloro, acetona, acido sulfurico, thinner).'
                        }
                    },
                    required: ['nombre']
                }
            };

            const wappyGeocodificarEmergenciasDeclaration = {
                name: 'wappy_geocodificar_emergencias',
                description: 'Consulta la API de OpenStreetMap Nominatim para geolocalizar direcciones de sedes de la empresa y ubicar recursos externos de emergencia cercanos (hospitales, clínicas, estaciones de bomberos, defensa civil, centros de urgencias) para el Plan de Prevención y Preparación ante Emergencias.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        query: {
                            type: 'STRING',
                            description: 'Término de búsqueda o recurso a geolocalizar (ej: hospital Chapinero Bogota, bomberos Medellin).'
                        }
                    },
                    required: ['query']
                }
            };

            const wappyConsultarClimaVientoDeclaration = {
                name: 'wappy_consultar_clima_viento',
                description: 'Consulta la API de Open-Meteo para obtener en tiempo real la velocidad del viento, ráfagas, temperatura y pronóstico diario meteorológico para evaluar riesgos climáticos en trabajos en alturas (Resolución 4272 de 2021), espacios confinados y operaciones en campo.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        latitude: {
                            type: 'NUMBER',
                            description: 'Latitud geográfica (ej: 4.6097 para Bogotá).'
                        },
                        longitude: {
                            type: 'NUMBER',
                            description: 'Longitud geográfica (ej: -74.0817 para Bogotá).'
                        }
                    }
                }
            };

            const wappyDelegarOrdenAntigravityDeclaration = {
                name: 'wappy_delegar_orden_antigravity',
                description: 'Delega una orden de trabajo, investigación profunda o análisis de archivos locales a Google Antigravity en la computadora o entorno de trabajo del usuario. Se utiliza cuando el usuario pide a Tenshi que Antigravity investigue, revise carpetas locales de su computador o desarrolle entregables (Word, Excel, PDF, presentaciones, HTML) para luego reflejarlos en este chat de Tenshi.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        instruccion: {
                            type: 'STRING',
                            description: 'Instrucción o tarea detallada que Antigravity debe realizar (ej: "Analizar los informes de inspección de la carpeta X y redactar el balance consolidado").'
                        },
                        carpeta_o_recurso: {
                            type: 'STRING',
                            description: 'Ruta o nombre de la carpeta local en el computador del usuario o Google Drive que Antigravity debe inspeccionar (ej: "/Users/usuario/Inspecciones", "Carpeta SST").'
                        },
                        tipo_entregable: {
                            type: 'STRING',
                            description: "Tipo de respuesta o entregable esperado según lo que pidió el usuario: 'respuesta' (POR DEFECTO cuando el usuario solo hace una pregunta o consulta y NO pidió explícitamente crear un documento o archivo), 'documento' / 'word' (para documentos o informes en el Editor de Documentos de WAPPY / Canvas), 'html' (para aplicativos interactivos o dashboards), 'excel' o 'presentacion'."
                        },
                        titulo: {
                            type: 'STRING',
                            description: 'Título descriptivo de la orden de trabajo.'
                        },
                        archivos: {
                            type: 'ARRAY',
                            description: 'Lista de rutas, enlaces o nombres de archivos, imágenes, videos o documentos que se deben enviar a Antigravity para su procesamiento.',
                            items: {
                                type: 'STRING'
                            }
                        },
                        entorno_destino: {
                            type: 'STRING',
                            description: "Entorno donde ejecutar la orden si el usuario lo especifica explícitamente: 'local' (en su Mac/PC), 'cloud' (en la nube antigravity.google.com), o 'auto' (automático según conexión)."
                        }
                    },
                    required: ['instruccion']
                }
            };

            const notebooklmListarCuadernosDeclaration = {
                name: "notebooklm_listar_cuadernos",
                description: "Consulta y lista todos los cuadernos vinculados en Google NotebookLM / Gemini Notebook del usuario. Úsala cuando el usuario pregunte qué cuadernos tiene o pida ver sus fuentes bibliográficas.",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        dummy: { type: "STRING", description: "Filtro opcional" }
                    }
                }
            };

            const notebooklmConsultarDeclaration = {
                name: "notebooklm_consultar",
                description: "Realiza una consulta documental fundamentada (Grounded RAG) sobre los cuadernos y fuentes de Google NotebookLM del usuario. Devuelve respuestas directas fundamentadas en sus documentos y citas normativas.",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        cuaderno: { type: "STRING", description: "Nombre o ID del cuaderno a consultar." },
                        pregunta: { type: "STRING", description: "Pregunta o consulta técnica detallada." }
                    },
                    required: ["cuaderno", "pregunta"]
                }
            };

            const notebooklmGenerarStudioDeclaration = {
                name: "notebooklm_generar_studio",
                description: "Genera artefactos de estudio o multimedia en Google NotebookLM: video explicativo ('video'), infografía ('infographic'), presentación de diapositivas ('slide_deck'), tabla de datos ('data_table'), podcast ('audio'), cuestionario ('quiz'), informe ('report'), fichas ('flashcards') o mapa conceptual ('mind_map').",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        cuaderno: { type: "STRING", description: "Nombre o ID del cuaderno." },
                        tipo_artefacto: { type: "STRING", description: "Tipo de contenido: video, infographic, slide_deck, data_table, audio, quiz, report, flashcards o mind_map." },
                        instrucciones: { type: "STRING", description: "Instrucciones de enfoque o temas prioritarios." }
                    },
                    required: ["cuaderno", "tipo_artefacto"]
                }
            };

            const googleFlowGenerarImagenDeclaration = {
                name: "google_flow_generar_imagen",
                description: "Genera imágenes fotorrealistas, afiches de seguridad, diagramas técnicos o ilustraciones 3D con Google Flow Studio (Google Imagen / Nano Banana) y las entrega directamente en el chat y en el Canvas de Tenshi.",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        prompt: { type: "STRING", description: "Descripción visual detallada de la escena u objeto a generar." },
                        aspecto: { type: "STRING", description: "Relación de aspecto: '16:9', '9:16' o '1:1'." },
                        estilo: { type: "STRING", description: "Estilo visual: 'fotorrealista', '3d_render', 'ilustracion_tecnica' o 'afiche_seguridad'." }
                    },
                    required: ["prompt"]
                }
            };

            const googleFlowGenerarVideoDeclaration = {
                name: "google_flow_generar_video",
                description: "Genera un clip de video cinematográfico en MP4 con Google Flow Studio (Google Veo / Flow Camera) y lo entrega con reproductor de video directamente en el chat y en el Canvas de Tenshi.",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        prompt: { type: "STRING", description: "Descripción cinematográfica detallada de la escena y acción del video." },
                        aspecto: { type: "STRING", description: "Relación de aspecto: '16:9' (horizontal) o '9:16' (vertical/Reel)." },
                        movimiento_camara: { type: "STRING", description: "Movimiento de cámara: 'zoom_in', 'zoom_out', 'orbit', 'pan_right' o 'pan_left'." }
                    },
                    required: ["prompt"]
                }
            };

            const wappyIniciarEstudioErgonomicoVivoDeclaration = {
                name: 'wappy_iniciar_estudio_ergonomico_vivo',
                description: 'Inicia y abre de inmediato el Análisis Biomecánico y Estudio de Puesto de Trabajo Ergonómico EN VIVO por cámara y voz con la Fisioterapeuta Laboral (con exoesqueleto MediaPipe 3D, protocolo de 3 fases, matriz CIE-11 y 12 ejercicios de pausas activas ExerciseDB). INVÓCALA SIEMPRE que el usuario diga que necesita, quiere o desea realizar un estudio de puesto de trabajo ergonómico o evaluación ergonómica.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        trabajador: {
                            type: 'STRING',
                            description: 'Nombre del trabajador a evaluar si el usuario lo mencionó (opcional).'
                        },
                        cargo: {
                            type: 'STRING',
                            description: 'Cargo o puesto de trabajo a evaluar si el usuario lo mencionó (opcional).'
                        }
                    }
                }
            };

            const wappyConsultarRehabilitacionMedlinePlusDeclaration = {
                name: 'wappy_consultar_rehabilitacion_medlineplus',
                description: 'Consulta guías oficiales de salud ocupacional en español de MedlinePlus Connect (NIH de EE. UU.) y prescribe pausas activas osteomusculares y ejercicios de Fisioterapia laboral según el segmento anatómico o código CIE-10 (ej: M54.2 cuello, G56.0 túnel carpiano, M54.5 espalda lumbar, M75.1 hombro).',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        codigo: { type: 'STRING', description: 'Código CIE-10 de la patología (ej: M54.2, G56.0, M54.5, M75.1).' },
                        segmento: { type: 'STRING', description: 'Segmento anatómico: cervical, lumbar, muñeca, hombro, codo o ocular.' }
                    }
                }
            };

            const wappyControlarVideollamadaDeclaration = {
                name: 'wappy_controlar_videollamada',
                description: 'Controla la cámara, la videollamada o cuelga la llamada de Tenshi. DEBES invocar esta herramienta cuando el usuario te diga: activa videollamada, activa video, enciende la cámara, activa la cámara, apaga la cámara, desactiva video, cuelga, colgar o terminar llamada.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        accion: {
                            type: 'STRING',
                            description: 'Acción a ejecutar: activar_camara, apagar_camara o colgar_llamada.'
                        }
                    },
                    required: ['accion']
                }
            };

            const wappyImportarSociodemograficoDriveDeclaration = {
                name: 'wappy_importar_sociodemografico_drive',
                description: 'Busca en Google Drive del usuario (dentro de la carpeta indicada o en todo el Drive) el archivo del Perfil Sociodemográfico y/o Condiciones de Salud, extrae todos los trabajadores usando el modelo de texto gemini-3.5-flash-lite (respaldo gemini-3.6-flash) y alimenta masivamente tanto el Perfil Sociodemográfico como las Condiciones de Salud en Somos SST.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        carpeta: {
                            type: 'STRING',
                            description: 'Nombre de la carpeta en Google Drive donde está el perfil sociodemográfico (ej: "SST", "Talento Humano", "Nomina", etc.). Dejar vacío si está en la raíz.'
                        },
                        archivo: {
                            type: 'STRING',
                            description: 'Nombre aproximado del archivo a buscar dentro de la carpeta (opcional, ej: "perfil sociodemografico", "condiciones de salud").'
                        },
                        fileId: {
                            type: 'STRING',
                            description: 'ID exacto del archivo en Google Drive si ya se conoce (opcional).'
                        },
                        texto_extraido: {
                            type: 'STRING',
                            description: 'Texto o contenido ya extraído previamente si ya se leyó el archivo (opcional).'
                        }
                    }
                }
            };

            const wappyImportarHito1DriveDeclaration = {
                name: 'wappy_importar_hito1_drive',
                description: 'Busca en el Google Drive del usuario los archivos de los aplicativos del Hito 1 (Matriz IPEVR GTC-45, Matriz de Riesgos Viales PESV, Matriz de Compatibilidad Química SGA, Análisis de Vulnerabilidad/Diamante de Emergencias, Diagnóstico Inicial 0312 o Asignación del Responsable SST), extrae y normaliza los datos con gemini-3.5-flash-lite (y respaldo gemini-3.6-flash) y alimenta automáticamente los aplicativos oficiales en Somos SST.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        aplicativo: {
                            type: 'STRING',
                            description: "Aplicativo a alimentar: 'gtc45', 'pesv', 'compatibilidad', 'vulnerabilidad', 'diagnostico', 'responsable' o 'auto'."
                        },
                        carpeta: {
                            type: 'STRING',
                            description: 'Nombre de la carpeta en Google Drive donde están los archivos del SG-SST (opcional).'
                        },
                        archivo: {
                            type: 'STRING',
                            description: 'Nombre aproximado del archivo en Google Drive (opcional).'
                        },
                        fileId: {
                            type: 'STRING',
                            description: 'ID exacto del archivo en Google Drive si ya se conoce (opcional).'
                        }
                    }
                }
            };

            const wappyMemoriaProcedimentalDeclaration = {
                name: 'wappy_memoria_procedimental',
                description: 'Gestiona la Memoria Procedural y de Hábitos Operativos de la empresa (estilo OpenBot). Permite guardar, listar o eliminar costumbres, flujos de aprobación, criterios técnicos o reglas operativas específicas de la organización para aplicarlas automáticamente en sesiones futuras.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        accion: {
                            type: 'STRING',
                            description: "Acción a realizar: 'guardar', 'listar' o 'eliminar'."
                        },
                        trigger: {
                            type: 'STRING',
                            description: "Situación o disparador en que aplica el hábito (ej: 'Al cerrar investigación ATEL', 'En informes mensuales', 'Al registrar químicos')."
                        },
                        regla: {
                            type: 'STRING',
                            description: "Regla operativa o hábito a cumplir (ej: 'Notificar siempre primero a la Dra. María antes de archivar')."
                        },
                        categoria: {
                            type: 'STRING',
                            description: "Categoría: 'habito_operativo', 'flujo_aprobacion', 'notificacion', 'criterio_tecnico' o 'preferencia_formato'."
                        },
                        id: {
                            type: 'STRING',
                            description: "ID o palabra clave del hábito a eliminar cuando accion='eliminar'."
                        }
                    },
                    required: ['accion']
                }
            };

            const wappyRenderizarWidgetDeclaration = {
                name: 'wappy_renderizar_widget_interactivo',
                description: 'Generative UI (AG-UI): Proyecta y renderiza una tarjeta o widget interactivo directamente en el chat del usuario (ej: Simulador/Calculadora de Riesgo GTC-45 NDxNExNC con sliders en vivo, o Checklist Interactivo de Inspección SST). Úsala cuando el usuario pida una calculadora interactiva en el chat, simular el nivel de riesgo GTC-45 o una lista de chequeo interactiva.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        tipo_widget: {
                            type: 'STRING',
                            description: "Tipo de widget interactivo: 'risk_calculator' (Simulador GTC-45 NDxNExNC) o 'inspection_checklist' (Lista de verificación interactiva)."
                        },
                        titulo: {
                            type: 'STRING',
                            description: 'Título del widget interactivo.'
                        },
                        subtitulo: {
                            type: 'STRING',
                            description: 'Subtítulo o contexto normativo.'
                        },
                        peligro: {
                            type: 'STRING',
                            description: 'Descripción del peligro a simular (para risk_calculator).'
                        },
                        proceso: {
                            type: 'STRING',
                            description: 'Proceso o cargo evaluado.'
                        },
                        nd: {
                            type: 'NUMBER',
                            description: 'Nivel de Deficiencia inicial (0, 2, 6 o 10).'
                        },
                        ne: {
                            type: 'NUMBER',
                            description: 'Nivel de Exposición inicial (1, 2, 3 o 4).'
                        },
                        nc: {
                            type: 'NUMBER',
                            description: 'Nivel de Consecuencia inicial (10, 25, 60 o 100).'
                        },
                        items: {
                            type: 'ARRAY',
                            items: { type: 'STRING' },
                            description: 'Ítems de verificación para inspection_checklist.'
                        }
                    },
                    required: ['tipo_widget']
                }
            };

            const webScraperLiveDeclaration = {
                name: 'web_scraper_live',
                description: 'Extrae contenido web en vivo desde hasta 5 URLs simultáneas (soporta páginas dinámicas SPA con Chromium/Playwright o fetch + cheerio, selectores CSS personalizados, enlaces relevantes, huella SHA-256 contentHash y evidencias PDF/PNG).',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        urls: { type: 'STRING', description: 'URL o lista de hasta 5 URLs http/https separadas por comas o saltos de línea.' },
                        url: { type: 'STRING', description: 'URL objetivo única (alias opcional).' },
                        scriptEngine: { type: 'STRING', description: "Motor de extracción: 'auto_chrome_dom', 'fetch_cheerio' o 'antigravity_local'." },
                        scriptCode: { type: 'STRING', description: 'Selectores CSS opcionales (ej. "h1, article p").' },
                        includeEvidence: { type: 'BOOLEAN', description: 'Si es true, captura evidencia visual PDF/PNG.' }
                    }
                }
            };

            const blogEditorDeclaration = {
                name: 'blog_editor',
                description: 'Crea, edita, lee, lista o elimina borradores de artículos del blog corporativo en la base de datos. Los artículos nuevos se guardan como borrador (isPublished=false) en HTML enriquecido para revisión humana.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        accion: { type: 'STRING', description: "Acción: 'crear', 'leer', 'listar', 'editar' o 'eliminar'." },
                        title: { type: 'STRING', description: 'Título del artículo.' },
                        description: { type: 'STRING', description: 'Subtítulo o resumen introductorio.' },
                        content: { type: 'STRING', description: 'Contenido completo en HTML enriquecido (sin bloques markdown).' },
                        tags: { type: 'ARRAY', items: { type: 'STRING' }, description: 'Etiquetas del artículo (ej. ["SST", "Normatividad"]).' },
                        postId: { type: 'STRING', description: 'ID del artículo para leer, editar o eliminar.' }
                    },
                    required: ['accion']
                }
            };

            const editorLiveDeclaration = {
                name: 'editor_live',
                description: 'Gestiona Documentos en Vivo (LiveEditor / /documentos-vivo) de la empresa activa: listar, leer, crear, guardar/actualizar o eliminar documentos oficiales del SG-SST exportables a Word/PDF.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        accion: { type: 'STRING', description: "Acción CRUD: 'listar', 'leer', 'crear', 'guardar', 'actualizar' o 'eliminar'." },
                        id: { type: 'STRING', description: 'ID del documento en vivo (para leer, actualizar o eliminar).' },
                        title: { type: 'STRING', description: 'Título del documento.' },
                        content: { type: 'STRING', description: 'Contenido HTML o texto estructurado del documento.' },
                        busqueda: { type: 'STRING', description: 'Término opcional para filtrar al listar.' }
                    },
                    required: ['accion']
                }
            };

            const wappyInvestigarTrabajador360Declaration = {
                name: 'wappy_investigar_trabajador_360',
                description: 'Realiza investigación OSINT 360 oficial de un trabajador colombiano por cédula/nombre/placa en portales públicos oficiales (ARL SURA, Positiva, Seguros Bolívar, Curso de Alturas MinTrabajo, SENA, ADRES/EPS, Pensiones AFP, Rama Judicial, Contraloría y SIMIT PESV) generando evidencias verificables.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        cedula: { type: 'STRING', description: 'Número de documento/cédula del trabajador.' },
                        nombre: { type: 'STRING', description: 'Nombre completo del trabajador (opcional).' },
                        tipo_documento: { type: 'STRING', description: "Tipo de documento: 'CC', 'CE', 'TI', 'PPT' (por defecto 'CC')." },
                        fecha_nacimiento: { type: 'STRING', description: 'Fecha de nacimiento en formato YYYY-MM-DD o DD/MM/AAAA (requerida en ARL Bolívar/AXA).' },
                        placa: { type: 'STRING', description: 'Placa del vehículo si se requiere verificar SIMIT/PESV.' },
                        portales: { type: 'ARRAY', items: { type: 'STRING' }, description: 'Portales específicos a consultar (opcional).' }
                    }
                }
            };

            const forensicAuditDeclaration = {
                name: 'forensic_audit',
                description: 'Ejecuta auditoría forense documental sobre un certificado de incapacidad médica o soporte PDF/imagen adjunto (o texto extraído): analiza metadatos binarios, detección de software de edición (Canva, Photoshop, iLovePDF), consistencia aritmética de días/fechas, dígito de verificación NIT DIAN y verificación oficial IPS REPS (MinSalud) + Contraloría sin CAPTCHA.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        instruccion: { type: 'STRING', description: 'Instrucción específica o enfoque de la auditoría forense.' },
                        texto_documento: { type: 'STRING', description: 'Texto del documento si no hay binario adjunto en este turno.' },
                        nombre_archivo: { type: 'STRING', description: 'Nombre del archivo a auditar (opcional).' }
                    }
                }
            };

            const fileSearchDeclaration = {
                name: 'file_search',
                description: 'Realiza búsqueda semántica RAG y documental sobre los archivos subidos por el usuario, documentos adjuntos, LiveEditor y Canvas guardados en la plataforma.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        query: { type: 'STRING', description: 'Consulta o palabras clave a buscar dentro de los documentos del usuario.' },
                        filename: { type: 'STRING', description: 'Filtro opcional por nombre de archivo.' },
                        limit: { type: 'NUMBER', description: 'Máximo de fragmentos relevantes a retornar (por defecto 6).' }
                    },
                    required: ['query']
                }
            };

            const calculatorDeclaration = {
                name: 'calculator',
                description: 'Calculadora matemática y de indicadores SG-SST (evaluador seguro sin eval). Calcula expresiones aritméticas exactas y fórmulas normativas colombianas: IF, IS, ILI (NTC 3701 / Res. 0312 Art. 30), tasa_accidentalidad, porcentaje_0312, dosis_ruido (Res. 1792 / ACGIH), twa_quimico (Brief & Scala) y ausentismo.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        expresion: { type: 'STRING', description: 'Expresión matemática segura (ej: "(4 * 240000) / 185000", "sqrt(16) + 2^3").' },
                        formula_sst: { type: 'STRING', description: "Fórmula predefinida SST: 'IF', 'IS', 'ILI', 'tasa_accidentalidad', 'porcentaje_0312', 'dosis_ruido', 'twa_quimico' o 'ausentismo'." },
                        variables: { type: 'OBJECT', description: 'Variables numéricas para la fórmula SST (ej: { accidentes: 4, hht: 185000, dias_perdidos: 32, trabajadores: 50 }).' }
                    }
                }
            };

            // Assemble base tools and dynamically triggered tools (strictly excluding Group 7)
            const baseFunctionDeclarations = [
                wappyNavegarDeclaration,
                wappyControlarVideollamadaDeclaration,
                wappyIniciarEstudioErgonomicoVivoDeclaration,
                wappyConsultarRehabilitacionMedlinePlusDeclaration,
                somosSSTDeclaration,
                wappyCrearInformeDeclaration,
                wappyGenerarQrDeclaration,
                analiticaPsicosocialDeclaration,
                analiticaActosCondicionesDeclaration,
                wappyConsultarQuimicoPubchemDeclaration,
                wappyGeocodificarEmergenciasDeclaration,
                wappyConsultarClimaVientoDeclaration,
                wappyDelegarOrdenAntigravityDeclaration,
                notebooklmListarCuadernosDeclaration,
                notebooklmConsultarDeclaration,
                notebooklmGenerarStudioDeclaration,
                googleFlowGenerarImagenDeclaration,
                googleFlowGenerarVideoDeclaration,
                wappyEnviarCorreoDeclaration,
                wappyGestionarAgendaDeclaration,
                googleCalendarDeclaration,
                googleGmailDeclaration,
                googleDriveDeclaration,
                googleSheetsDeclaration,
                googleDocsDeclaration,
                googleSlidesDeclaration,
                oneDriveDeclaration,
                wappyRetirarTrabajadorDeclaration,
                wappyReintegrarTrabajadorDeclaration,
                wappyActualizarTrabajadorDeclaration,
                wappyConsultarTrabajadoresDeclaration,
                wappyRegistrarTrabajadorDeclaration,
                wappyInvestigarTrabajador360Declaration,
                wappyImportarSociodemograficoDriveDeclaration,
                wappyImportarHito1DriveDeclaration,
                wappyConsultarEmpresasDeclaration,
                wappyConsultarDetalleEmpresaDeclaration,
                wappyConsultarMarketplaceDeclaration,
                wappyConsultarCursosDeclaration,
                wappyAbrirCursoDeclaration,
                wappyLeerCursoDeclaration,
                wappyConsultarBlogDeclaration,
                wappyAbrirArticuloBlogDeclaration,
                wappyLeerArticuloBlogDeclaration,
                wappyResumenGeneral360Declaration,
                wappyMcpSstDeclaration,
                wappyCrearAgenteDeclaration,
                wappyActualizarAgenteDeclaration,
                wappyEliminarAgenteDeclaration,
                wappyConsultarAgentesDeclaration,
                wappyEjecutarAccionUsuarioDeclaration,
                wappyLeerInformeAplicativoDeclaration,
                wappyActivarHerramientaAgenteDeclaration,
                consultarAgenteDeclaration,
                consultarMultiplesEspecialistasDeclaration,
                wappyAbrirChatAgenteDeclaration,
                wappyBuscarHistorialDeclaration,
                canvasDeclaration,
                operarGUIDeclaration,
                diligenciarFormularioDeclaration,
                seleccionarEmpresaDeclaration,
                wappyActivarEmpresaDeclaration,
                wappyActualizarEmpresaDeclaration,
                gestionarMemoriaDeclaration,
                wappyMemoriaProcedimentalDeclaration,
                wappyRenderizarWidgetDeclaration,
                leerPantallaDeclaration,
                webScraperLiveDeclaration,
                blogEditorDeclaration,
                editorLiveDeclaration,
                forensicAuditDeclaration,
                fileSearchDeclaration,
                calculatorDeclaration,
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
                web_scraper_live: webScraperLiveDeclaration,
                blog_editor: blogEditorDeclaration,
                editor_live: editorLiveDeclaration,
                editor_rit: editorRITDeclaration,
                wappy_investigar_trabajador_360: wappyInvestigarTrabajador360Declaration,
                forensic_audit: forensicAuditDeclaration,
                file_search: fileSearchDeclaration,
                calculator: calculatorDeclaration,
                consultar_analitica_psicosocial: analiticaPsicosocialDeclaration,
                consultar_analitica_actos_condiciones: analiticaActosCondicionesDeclaration,
            };

            const declarationRegistry = {};
            for (const decl of [
                ...baseFunctionDeclarations,
                ...Object.values(dynamicToolsMap),
                wappyAnaliticaPsicosocialDeclaration,
                wappyAnaliticaActosDeclaration,
                wappyConsultarMetricasAdminDeclaration,
                wappyAdminSistemaDeclaration,
            ]) {
                if (decl && decl.name && !declarationRegistry[decl.name]) {
                    declarationRegistry[decl.name] = decl;
                }
            }

            const lastMsgObj = messages[messages.length - 1];
            const lastUserMsg = lastMsgObj?.content || 'Hola';
            const lastUserLower = String(lastUserMsg || '').toLowerCase();
            const isGuiResultTurn = String(lastUserMsg || '').trim().startsWith('[RESULTADO_GUI]');
            const isInlineWidgetIntent =
                !isGuiResultTurn &&
                (((lastUserLower.includes('calculadora') || lastUserLower.includes('simulador')) &&
                    (lastUserLower.includes('gtc') || lastUserLower.includes('riesgo') || lastUserLower.includes('deficiencia') || lastUserLower.includes('peligro'))) ||
                lastUserLower.includes('checklist interactivo') ||
                lastUserLower.includes('lista de chequeo interactiva'));
            const isWorkerListIntent =
                !isGuiResultTurn &&
                (/\b(lista|listado|censo|nomina|nómina|ver|mostrar|muestrame|muéstrame|dame|cuales\s+son|cuáles\s+son|quienes\s+son|quiénes\s+son|consultar|consulta)\b[\s\S]{0,40}\b(trabajadores|colaboradores|empleados|personal)\b/i.test(lastUserLower) ||
                /\b(trabajadores|colaboradores|empleados)\b[\s\S]{0,30}\b(activos|retirados|registrados|lista|censo|todos|empresa)\b/i.test(lastUserLower));

            const forceGestorAuto = Boolean(
                tenshiFlowsBlock ||
                    workflowNodesOverviewBlock ||
                    safeCompanyAutos.length > 0 ||
                    /\b(nodo|nodos|flujo|flujos|automatizaci|tareas|lienzo|disparador|extractor|rethus|adres|incapacidad|gu[ií]a\s+de\s+nodos)\b/i.test(lastUserLower)
            );

            let toolsToAttach = isPureGreeting
                ? []
                : selectTenshiTools({
                      declarationRegistry,
                      baseDeclarations: baseFunctionDeclarations,
                      dynamicToolsMap,
                      activeTools,
                      enabledTools,
                      connectors: normalizedConnectors,
                      isAdminUser,
                      isInlineWidgetIntent,
                      lastUserLower,
                      forceGestorAuto,
                  });
            logger.info(
                `[Tenshi Backend] Herramientas adjuntas a Gemini (${toolsToAttach.length}, mode=${isPureGreeting ? 'pure_greeting' : Array.isArray(enabledTools) ? 'explicit' : 'legacy'}): ${toolsToAttach.map(t => t.name).join(', ') || '(ninguna)'}`
            );

            // Rotation loop: outer = models, inner = api keys
            let lastError = null;
            let succeeded = false;
            const rawLastAttachments = normalizeIncomingMediaList(lastMsgObj);
            const activeAttachments = rawLastAttachments.length > 0 ? rawLastAttachments : reqBodyAttachments;
            let extractedTexts = [];
            if (activeAttachments.length > 0) {
                extractedTexts = await Promise.all(
                    activeAttachments.map((att) =>
                        extractTextFromMedia(att).catch((errExt) => {
                            logger.warn(`[Tenshi Backend] Error extracting text from "${att?.name || 'media'}":`, errExt.message);
                            return '';
                        })
                    )
                );
            }
            const {
                userParts: baseUserParts,
                inlineBytesUsed,
                includedInlineCount,
                omittedInlineCount,
            } = buildGeminiUserParts({
                lastUserMsg,
                attachments: activeAttachments,
                extractedTexts,
            });
            if (activeAttachments.length > 0) {
                logger.info(
                    `[Tenshi Backend] Prepared ${activeAttachments.length} attachment(s) -> inlineData=${includedInlineCount} (${Math.round(inlineBytesUsed / 1024)} KB), omittedByBudget=${omittedInlineCount}, total userParts=${baseUserParts.length}`
                );
            }

            const currentTurnHasAttachments = userAttachments.length > 0 || reqBodyAttachments.length > 0;
            const activeCompanyIdStr = companyInfo?._id ? String(companyInfo._id) : (req.companyId ? String(req.companyId) : null);
            let directMediaAttempted = false;

            const allowAntigravityMedia = !normalizedConnectors || normalizedConnectors.antigravity !== false;
            const allowGoogleFlowMedia = !normalizedConnectors || normalizedConnectors.google_flow !== false;
            const allowVisualMediaFastPath = allowAntigravityMedia || allowGoogleFlowMedia;

            // Fast-Path determinista para generación directa de imagen/video (Antigravity Local -> Google Flow Studio):
            // Opera de forma independiente a Gemini Texto (inmune a 503/timeouts) e incluye recuperación del prompt desde historial en reintentos cortos ("inténtalo nuevamente", "hazla con antigravity").
            const fastPathMediaIntent = !isGuiResultTurn && !isPureGreeting && allowVisualMediaFastPath
                ? detectVisualMediaGenerationIntent(lastUserMsg, messages, {
                      allowCompound: false,
                      hasCurrentAttachment: currentTurnHasAttachments,
                  })
                : null;

            if (fastPathMediaIntent) {
                directMediaAttempted = true;
                logger.info(
                    `[Tenshi Media Fast-Path] Intención visual directa detectada (tipo=${fastPathMediaIntent.isVideo ? 'video' : 'imagen'}, recuperadoHistorial=${fastPathMediaIntent.recoveredFromHistory}, aspecto=${fastPathMediaIntent.aspectRatio}, estilo=${fastPathMediaIntent.style}, prompt="${fastPathMediaIntent.prompt.slice(0, 120)}")`
                );
                try {
                    const mediaOut = await executeDirectFlowMediaForTenshi({
                        isVideo: fastPathMediaIntent.isVideo,
                        prompt: fastPathMediaIntent.prompt,
                        aspectRatio: fastPathMediaIntent.aspectRatio,
                        style: fastPathMediaIntent.style,
                        cameraMotion: fastPathMediaIntent.cameraMotion,
                        skipAntigravity: !allowAntigravityMedia || fastPathMediaIntent.skipAntigravity,
                        userId: targetUserId,
                        companyId: activeCompanyIdStr,
                    });
                    capturedHtmlReport = mediaOut.studioHtml;
                    capturedFile = mediaOut.fileObj;
                    capturedFlowMarkdown = mediaOut.flowMd;
                    capturedFlowPublicUrl = mediaOut.publicUrl;
                    responseText = mediaOut.responseText;
                    lastError = null;
                    succeeded = true;
                    logger.info(
                        `[Tenshi Media Fast-Path] ✅ ${fastPathMediaIntent.isVideo ? 'Video' : 'Imagen'} generado(a) con ${mediaOut.engineLabel}: ${mediaOut.publicUrl}`
                    );
                } catch (mediaErr) {
                    const realCause = String(mediaErr?.message || 'Error desconocido al invocar los motores visuales.').trim();
                    logger.warn(
                        `[Tenshi Media Fast-Path] ❌ Fallaron Antigravity y Google Flow para ${fastPathMediaIntent.isVideo ? 'video' : 'imagen'}: ${realCause}`
                    );
                    responseText =
                        `⚠️ No fue posible generar ${fastPathMediaIntent.isVideo ? 'el video' : 'la imagen'} en este momento.\n\n` +
                        `**Motivo técnico real:** ${realCause}\n\n` +
                        `💡 Verifica que **Google Antigravity** esté conectado o que tu sesión de **Google Flow** esté activa en **Mi Cuenta → Integraciones** (o intenta describir la escena con un enfoque técnico preventivo).`;
                    lastError = null;
                    succeeded = true;
                }
            }

            const PRIMARY_TEXT_MODEL = 'gemini-3.5-flash-lite';
            const PRIMARY_INITIAL_TIMEOUT_MS = 20000;   // Margen saludable (20s) para 69 tool declarations en gemini-3.5-flash-lite
            const PRIMARY_RETRY_TIMEOUT_MS = 15000;     // 15s en intentos adicionales de clave/pasada sobre el modelo prioritario
            const SECONDARY_MODEL_TIMEOUT_MS = 12500;   // Timeout corto (12.5s) para modelos secundarios (3.6 / 3.8 / 4-hydrogen) si cuelgan
            const MAX_ROTATION_WALL_MS = 46000;         // Tope total antes de activar 503 Rescue y evitar bloqueos >60s
            const rotationStartMs = Date.now();

            const sanitizeInternalSynthesisMarkers = (text) =>
                String(text || '')
                    .replace(/\n*\[Objetivo de s[ií]ntesis solicitado\]:[^\n]*/gi, '')
                    .replace(/\n{3,}/g, '\n\n')
                    .trim();

            const isTransientSynthesisErr = (err) => {
                const status = err?.status || (err?.response && err.response.status) || 0;
                const msg = String(err?.message || '').toLowerCase();
                return (
                    status === 503 ||
                    status === 504 ||
                    status === 429 ||
                    Boolean(err?.isTimeout) ||
                    msg.includes('503') ||
                    msg.includes('504') ||
                    msg.includes('429') ||
                    msg.includes('overloaded') ||
                    msg.includes('service unavailable') ||
                    msg.includes('deadline_exceeded') ||
                    msg.includes('gateway timeout') ||
                    msg.includes('high demand') ||
                    msg.includes('timeout') ||
                    msg.includes('aborted')
                );
            };

            const tryFastSynthesisKeyRetry = async (synthErr, currentKeyIdx, contents, timeoutMs, labelTag) => {
                if (!isTransientSynthesisErr(synthErr) || !Array.isArray(apiKeys) || apiKeys.length === 0) {
                    return null;
                }
                let retryKeyIdx = apiKeys.length > 1 ? (currentKeyIdx + 1) % apiKeys.length : currentKeyIdx;
                if (apiKeys.length > 1 && apiKeys[retryKeyIdx] === apiKeys[currentKeyIdx]) {
                    const distinctIdx = apiKeys.findIndex(
                        (k, idx) => idx !== currentKeyIdx && k && k !== apiKeys[currentKeyIdx]
                    );
                    if (distinctIdx !== -1) retryKeyIdx = distinctIdx;
                }
                const retryApiKey = apiKeys[retryKeyIdx];
                if (!retryApiKey) return null;
                try {
                    logger.warn(
                        `[Tenshi Synthesis Retry] ${labelTag} falló (${synthErr.message}). Reintento rápido en ${PRIMARY_TEXT_MODEL} rotando a clave #${retryKeyIdx + 1}/${apiKeys.length} (timeout=${timeoutMs}ms)...`
                    );
                    const retryGenAI = new GoogleGenerativeAI(retryApiKey);
                    const retryModelConfig = {
                        model: PRIMARY_TEXT_MODEL,
                        systemInstruction: systemMessage,
                        generationConfig: buildTenshiGenerationConfig(PRIMARY_TEXT_MODEL, {
                            hasTools: toolsToAttach.length > 0,
                            temperature: 0.7,
                            maxOutputTokens: 65536,
                        }),
                    };
                    if (toolsToAttach.length > 0) {
                        retryModelConfig.tools = [{ functionDeclarations: toolsToAttach }];
                    }
                    const retryModel = retryGenAI.getGenerativeModel(retryModelConfig);
                    const retryRes = await withGeminiTimeout(
                        retryModel.generateContent({ contents }),
                        timeoutMs,
                        `Tenshi Chat (${PRIMARY_TEXT_MODEL}) synthesis retry key#${retryKeyIdx + 1}`
                    );
                    logger.info(
                        `[Tenshi Synthesis Retry] ✅ Síntesis recuperada para ${labelTag} con clave #${retryKeyIdx + 1}/${apiKeys.length} en ${PRIMARY_TEXT_MODEL}.`
                    );
                    return retryRes;
                } catch (retryErr) {
                    logger.warn(
                        `[Tenshi Synthesis Retry] ❌ Reintento rápido en ${PRIMARY_TEXT_MODEL} (clave #${retryKeyIdx + 1}) también falló: ${retryErr.message}`
                    );
                    return null;
                }
            };

            let pass503Index = 0;
            let saw503InPass = false;
            let sawNon503InPass = false;
            let keyRotationOffset = 0;

            for (let mi = 0; mi < modelFallbacks.length && !succeeded; mi++) {
                const currentModel = modelFallbacks[mi];
                const isPrimaryModel = currentModel === PRIMARY_TEXT_MODEL;
                const isExplicitSelectedFirst = userSelectedModelExplicitly && mi === 0;
                if (mi > 0 && Date.now() - rotationStartMs >= MAX_ROTATION_WALL_MS) {
                    logger.warn(
                        `[Tenshi] Presupuesto de rotación (${MAX_ROTATION_WALL_MS}ms) alcanzado tras ${Date.now() - rotationStartMs}ms; omitiendo modelo secundario "${currentModel}".`
                    );
                    break;
                }

                let primaryTransientFailures = 0;
                let primaryTimeoutFailures = 0;

                for (let i = 0; i < apiKeys.length; i++) {
                    const keyIdx = (i + keyRotationOffset) % apiKeys.length;
                    const apiKey = apiKeys[keyIdx];
                    const attemptStartMs = Date.now();
                    try {
                        const initialTimeoutMs = isExplicitSelectedFirst
                            ? 20000
                            : isPrimaryModel
                              ? pass503Index === 0 && i === 0
                                  ? PRIMARY_INITIAL_TIMEOUT_MS
                                  : PRIMARY_RETRY_TIMEOUT_MS
                              : SECONDARY_MODEL_TIMEOUT_MS;
                        logger.debug(
                            `[Tenshi] Trying Key ${keyIdx + 1}/${apiKeys.length} (pass #${pass503Index + 1}, timeout=${initialTimeoutMs}ms) with model "${currentModel}"`
                        );
                        const genAI = new GoogleGenerativeAI(apiKey);

                        const geminiModelConfig = {
                            model: currentModel,
                            systemInstruction: systemMessage,
                            generationConfig: buildTenshiGenerationConfig(currentModel, {
                                hasTools: toolsToAttach.length > 0,
                                temperature: 0.7,
                                maxOutputTokens: 65536,
                            }),
                        };
                        if (toolsToAttach.length > 0) {
                            geminiModelConfig.tools = [{ functionDeclarations: toolsToAttach }];
                        }
                        const geminiModel = genAI.getGenerativeModel(geminiModelConfig);

                        const userParts = [...baseUserParts];

                        logger.info(`[Tenshi Backend] Sending request to Gemini (${currentModel}) with message: "${lastUserMsg}", parts count: ${userParts.length}`);

                        let currentContents = [
                            ...history,
                            { role: 'user', parts: userParts }
                        ];

                        let responseResult = await withGeminiTimeout(
                            geminiModel.generateContent({ contents: currentContents }),
                            initialTimeoutMs,
                            `Tenshi Chat (${currentModel}) initial`
                        );
                        let candidate = responseResult.response.candidates && responseResult.response.candidates[0];
                        let calls = toolsToAttach.length > 0 ? responseResult.response.functionCalls() : null;
                        logger.info(`[Tenshi Backend] Gemini initial response function calls: ${JSON.stringify(calls)}`);
                        let loops = 0;
                        let activeTurnCanvasConvoId = null;
                        requestedGuiAction = null;
                        requestedGuiActions = null;
                        const enqueuePanelGuiAction = (rawToolName, rawParams = '', customMessage = '') => {
                            const rawStr = typeof rawToolName === 'string' ? rawToolName.trim() : '';
                            const normalizedTool = normalizeTenshiPanelToolId(rawStr);
                            const effectiveTool = normalizedTool || rawStr;
                            if (!effectiveTool) return null;
                            const label = TENSHI_PANEL_TOOL_LABELS[effectiveTool] || effectiveTool;
                            const fallbackMsg =
                                effectiveTool === 'generar_imagen_sst'
                                    ? `¡Listo! Activo el **${label}** para ti.`
                                    : effectiveTool === 'canvas'
                                      ? '¡Listo! Te abro **Canvas** en tu espacio de trabajo interactivo.'
                                      : effectiveTool === 'navegador_wappy'
                                        ? '¡Listo! Te abro el **Navegador Interno de WAPPY (🌐 Wappy)** aquí mismo dentro de Tenshi sin salir de nuestra conversación.'
                                        : `¡Listo! Te abro **${label}** en la pestaña junto a Canvas.`;
                            const guiPayload = {
                                name: 'wappy_activar_herramienta_agente',
                                args: {
                                    herramienta: effectiveTool,
                                    parametros: rawParams !== undefined && rawParams !== null ? rawParams : '',
                                },
                                message: customMessage || fallbackMsg,
                            };
                            requestedGuiAction = guiPayload;
                            if (Array.isArray(requestedGuiActions)) {
                                const alreadyQueued = requestedGuiActions.some(
                                    (a) =>
                                        a?.name === 'wappy_activar_herramienta_agente' &&
                                        a?.args?.herramienta === effectiveTool
                                );
                                if (!alreadyQueued) {
                                    requestedGuiActions.push(guiPayload);
                                }
                            }
                            return guiPayload;
                        };
                        const queuedCalls = [];
                        const executedCallSigs = new Set();

                        while (calls && calls.length > 0 && loops < 7) {
                            loops++;
                            if (
                                calls.length > 1 &&
                                calls.every((c) => c && c.name === 'consultar_agente_especializado')
                            ) {
                                const maxBatch = ConsultarAgenteEspecializado.MAX_PARALLEL_SPECIALISTS || 4;
                                const batchCalls = calls.slice(0, maxBatch);
                                const overflowCalls = calls.slice(maxBatch);
                                for (const extraCall of overflowCalls) {
                                    const sig = `${extraCall.name}:${JSON.stringify(extraCall.args || {})}`;
                                    if (!executedCallSigs.has(sig) && !queuedCalls.some(q => `${q.call.name}:${JSON.stringify(q.call.args || {})}` === sig)) {
                                        queuedCalls.push({ call: extraCall, candidateContent: candidate?.content || null });
                                    }
                                }
                                for (const bc of batchCalls) {
                                    executedCallSigs.add(`${bc.name}:${JSON.stringify(bc.args || {})}`);
                                }
                                logger.info(
                                    `[Tenshi Tool Call] Ejecutando lote paralelo de ${batchCalls.length} llamadas consultar_agente_especializado simultáneamente`
                                );
                                const toolInstance = new ConsultarAgenteEspecializado({ req });
                                const batchConsultas = batchCalls.map((bc) => ({
                                    nombre_especialista: bc.args?.nombre_especialista || bc.args?.agente || '',
                                    consulta_completa: bc.args?.consulta_completa || bc.args?.pregunta || '',
                                }));

                                let parallelRes;
                                try {
                                    parallelRes = await toolInstance.executeParallelSpecialists(batchConsultas, {
                                        maxParallel: batchCalls.length,
                                    });
                                } catch (batchErr) {
                                    logger.error('[Tenshi Tool Error] Error en lote paralelo de especialistas:', batchErr);
                                    parallelRes = {
                                        ok: false,
                                        total: batchCalls.length,
                                        succeededCount: 0,
                                        failedCount: batchCalls.length,
                                        totalDurationMs: 0,
                                        results: batchConsultas.map((q) => ({
                                            ok: false,
                                            requestedName: q.nombre_especialista,
                                            agentName: q.nombre_especialista,
                                            agentId: null,
                                            question: q.consulta_completa,
                                            response: '',
                                            error: batchErr.message,
                                            durationMs: 0,
                                        })),
                                        formattedMarkdown: `❌ Error ejecutando consultas paralelas: ${batchErr.message}`,
                                    };
                                }

                                const rawCandidateParts = (candidate && candidate.content && Array.isArray(candidate.content.parts))
                                    ? candidate.content.parts
                                    : [];
                                let keptFuncCount = 0;
                                const filteredBatchParts = rawCandidateParts.filter((p) => {
                                    if (p && p.functionCall) {
                                        if (keptFuncCount < batchCalls.length && p.functionCall.name === 'consultar_agente_especializado') {
                                            keptFuncCount++;
                                            return true;
                                        }
                                        return false;
                                    }
                                    return true;
                                });
                                const modelParts =
                                    keptFuncCount === batchCalls.length
                                        ? filteredBatchParts
                                        : batchCalls.map((bc) => ({
                                              functionCall: { name: bc.name, args: bc.args },
                                          }));
                                currentContents.push({ role: 'model', parts: modelParts });

                                const fnResponseParts = batchCalls.map((bc, idx) => {
                                    const reqName = ConsultarAgenteEspecializado.cleanString(
                                        bc.args?.nombre_especialista || bc.args?.agente || ''
                                    );
                                    const reqQ = ConsultarAgenteEspecializado.cleanString(
                                        bc.args?.consulta_completa || bc.args?.pregunta || ''
                                    );
                                    const matched =
                                        parallelRes.results.find(
                                            (r) =>
                                                ConsultarAgenteEspecializado.cleanString(r.requestedName) === reqName &&
                                                ConsultarAgenteEspecializado.cleanString(r.question) === reqQ
                                        ) || parallelRes.results[idx];
                                    const textOut = matched
                                        ? matched.ok
                                            ? `✅ [Respuesta de Especialista ${matched.agentName}]:\n${matched.response}`
                                            : `❌ ${matched.error || 'No se pudo obtener respuesta del especialista.'}`
                                        : parallelRes.formattedMarkdown;
                                    return {
                                        functionResponse: {
                                            name: bc.name,
                                            response: {
                                                result: textOut,
                                                ok: Boolean(matched?.ok),
                                                specialist: matched?.agentName || bc.args?.nombre_especialista || '',
                                                durationMs: matched?.durationMs || 0,
                                            },
                                        },
                                    };
                                });
                                currentContents.push({ role: 'user', parts: fnResponseParts });

                                try {
                                    responseResult = await withGeminiTimeout(
                                        geminiModel.generateContent({ contents: currentContents }),
                                        25000,
                                        `Tenshi Chat (${currentModel}) parallel specialists synthesis`
                                    );
                                    candidate = responseResult.response.candidates && responseResult.response.candidates[0];
                                    calls = responseResult.response.functionCalls();
                                    if ((!calls || calls.length === 0) && queuedCalls.length > 0) {
                                        while (queuedCalls.length > 0) {
                                            const nextQueued = queuedCalls.shift();
                                            const nextSig = `${nextQueued.call.name}:${JSON.stringify(nextQueued.call.args || {})}`;
                                            if (!executedCallSigs.has(nextSig)) {
                                                calls = [nextQueued.call];
                                                candidate = nextQueued.candidateContent ? { content: nextQueued.candidateContent } : null;
                                                break;
                                            }
                                        }
                                    }
                                } catch (synthErr) {
                                    const retriedParallelResult = await tryFastSynthesisKeyRetry(
                                        synthErr,
                                        keyIdx,
                                        currentContents,
                                        18000,
                                        'lote paralelo de especialistas'
                                    );
                                    if (retriedParallelResult) {
                                        responseResult = retriedParallelResult;
                                        candidate = responseResult.response.candidates && responseResult.response.candidates[0];
                                        calls = responseResult.response.functionCalls();
                                        if ((!calls || calls.length === 0) && queuedCalls.length > 0) {
                                            while (queuedCalls.length > 0) {
                                                const nextQueued = queuedCalls.shift();
                                                const nextSig = `${nextQueued.call.name}:${JSON.stringify(nextQueued.call.args || {})}`;
                                                if (!executedCallSigs.has(nextSig)) {
                                                    calls = [nextQueued.call];
                                                    candidate = nextQueued.candidateContent ? { content: nextQueued.candidateContent } : null;
                                                    break;
                                                }
                                            }
                                        }
                                    } else {
                                        logger.warn(`[Tenshi Parallel Synthesis Fallback] Error sintetizando lote paralelo (${synthErr.message}). Rescatando dictamen consolidado...`);
                                        const rescuedText = sanitizeInternalSynthesisMarkers(
                                            parallelRes.formattedMarkdown || '✅ Se completaron las consultas paralelas a los especialistas.'
                                        );
                                        responseResult = {
                                            response: {
                                                text: () => rescuedText,
                                                candidates: [],
                                                functionCalls: () => null,
                                            },
                                        };
                                        candidate = null;
                                        calls = null;
                                        break;
                                    }
                                }
                                continue;
                            }

                            if (calls.length > 1) {
                                for (let ci = 1; ci < calls.length; ci++) {
                                    const extraCall = calls[ci];
                                    const sig = `${extraCall.name}:${JSON.stringify(extraCall.args || {})}`;
                                    if (!executedCallSigs.has(sig) && !queuedCalls.some(q => `${q.call.name}:${JSON.stringify(q.call.args || {})}` === sig)) {
                                        queuedCalls.push({ call: extraCall, candidateContent: candidate?.content || null });
                                    }
                                }
                            }
                            const call = calls[0];
                            executedCallSigs.add(`${call.name}:${JSON.stringify(call.args || {})}`);
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
                                } else if (call.name === 'consultar_multiples_especialistas_paralelo') {
                                    const toolInstance = new ConsultarAgenteEspecializado({ req });
                                    const consultas = Array.isArray(call.args?.consultas) ? call.args.consultas : [];
                                    const parallelRes = await toolInstance.executeParallelSpecialists(consultas, {
                                        maxParallel: ConsultarAgenteEspecializado.MAX_PARALLEL_SPECIALISTS || 4,
                                    });
                                    if (parallelRes.ok) {
                                        const sintesisObjetivo = String(call.args?.sintesis_objetivo || '').trim();
                                        toolOutput = sintesisObjetivo
                                            ? `${parallelRes.formattedMarkdown}\n\n[Objetivo de síntesis solicitado]: ${sintesisObjetivo}`
                                            : parallelRes.formattedMarkdown;
                                    } else {
                                        const errDetail = parallelRes.results
                                            .map((r) => `${r.agentName || r.requestedName}: ${r.error || 'sin respuesta'}`)
                                            .join(' | ');
                                        toolOutput = `❌ No se pudo obtener respuesta de los especialistas consultados en paralelo.${errDetail ? ` Detalle: ${errDetail}` : ''}`;
                                    }
                                } else if (call.name === 'canvas_tool' || call.name === 'canvas') {
                                    const rawCanvasAction = String(call.args?.accion || 'crear').toLowerCase().trim();
                                    const isCreatingNewCanvas = rawCanvasAction === 'crear';
                                    const currentReqConvoId = typeof req.body?.conversationId === 'string' ? req.body.conversationId.trim() : '';
                                    const isSyntheticTenshiGlobalId = /^tenshi-[a-f0-9]{12,}(?:-[a-f0-9]{12,})?$/i.test(currentReqConvoId);

                                    let tempCanvasConvoId;
                                    if (isCreatingNewCanvas) {
                                        tempCanvasConvoId = `tenshi-canvas-${targetUserId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
                                    } else if (activeTurnCanvasConvoId) {
                                        tempCanvasConvoId = activeTurnCanvasConvoId;
                                    } else if (currentReqConvoId && currentReqConvoId !== 'new' && !isSyntheticTenshiGlobalId) {
                                        tempCanvasConvoId = currentReqConvoId;
                                    } else {
                                        tempCanvasConvoId = currentReqConvoId && currentReqConvoId !== 'new'
                                            ? currentReqConvoId
                                            : `tenshi-canvas-${targetUserId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
                                    }

                                    const prevBodyConvoId = req.body?.conversationId;
                                    const prevDisableSseEmit = req.__disableSseEmit;
                                    const prevIsFreshTenshiCanvas = req.__isFreshTenshiCanvas;
                                    if (!req.body) req.body = {};
                                    req.body.conversationId = tempCanvasConvoId;
                                    req.__disableSseEmit = true;
                                    req.__isFreshTenshiCanvas = isCreatingNewCanvas;
                                    try {
                                        const toolInstance = new CanvasTool({ req });
                                        toolOutput = await toolInstance._call(call.args);
                                        try {
                                            const parsed = typeof toolOutput === 'string' ? JSON.parse(toolOutput) : toolOutput;
                                            if (parsed?.success) {
                                                activeTurnCanvasConvoId = tempCanvasConvoId;
                                                const sessionDoc = await CanvasSession.findOne({ conversationId: tempCanvasConvoId }).lean();
                                                const fileType = sessionDoc?.fileType || parsed?.fileType || call.args?.fileType || 'html';
                                                const title = sessionDoc?.title || parsed?.title || call.args?.title || call.args?.titulo || 'Documento SG-SST';
                                                const content = sessionDoc?.content ?? call.args?.content ?? '';
                                                capturedFile = {
                                                    title,
                                                    fileType,
                                                    content: typeof content === 'string' ? content : JSON.stringify(content),
                                                    rawContent: content,
                                                    canvasId: tempCanvasConvoId
                                                };
                                                if (fileType === 'html' || (typeof content === 'string' && (content.includes('<html') || content.includes('<!DOCTYPE')))) {
                                                    capturedHtmlReport = content;
                                                }
                                                logger.info(`[Tenshi Backend] Captured Canvas deliverable: "${title}" (${fileType}, ${String(capturedFile.content || '').length} chars, canvasId=${tempCanvasConvoId})`);
                                            }
                                        } catch (canvasCaptureErr) {
                                            logger.warn('[Tenshi Backend] Error capturing CanvasSession after canvas_tool:', canvasCaptureErr?.message || canvasCaptureErr);
                                        }
                                    } finally {
                                        req.body.conversationId = activeTurnCanvasConvoId || prevBodyConvoId;
                                        if (prevDisableSseEmit === undefined) {
                                            delete req.__disableSseEmit;
                                        } else {
                                            req.__disableSseEmit = prevDisableSseEmit;
                                        }
                                        if (prevIsFreshTenshiCanvas === undefined) {
                                            delete req.__isFreshTenshiCanvas;
                                        } else {
                                            req.__isFreshTenshiCanvas = prevIsFreshTenshiCanvas;
                                        }
                                    }
                                } else if (call.name === 'matriz_ipevar') {
                                    const ipevarAction = String(call.args?.accion || '').toLowerCase().trim();
                                    const isOpenIpevarAction = ['abrir', 'mostrar', 'activar', 'open', 'show'].includes(ipevarAction);
                                    if (isOpenIpevarAction || (!requestedGuiAction && isExplicitPanelOpenUserIntent(lastUserLower, 'matriz_ipevar'))) {
                                        enqueuePanelGuiAction('matriz_ipevar', call.args || '');
                                    }
                                    if (isOpenIpevarAction) {
                                        toolOutput = JSON.stringify({ exito: true, herramienta: 'matriz_ipevar', panel_activado: true });
                                        if (loops === 1 && queuedCalls.length === 0) break;
                                    } else if (call.args?.accion === 'escribir' && Array.isArray(call.args?.riesgos) && call.args.riesgos.length > 0) {
                                        const savedRes = await saveRisksToHito1Matrices(targetUserId, companyInfo, call.args.riesgos);
                                        toolOutput = JSON.stringify(savedRes);
                                    } else if (call.args?.accion === 'leer') {
                                        const gtcRes = await executeTenshiMcpTool('wappy_consultar_matriz_gtc45', call.args || {}, targetUserId);
                                        toolOutput = JSON.stringify(gtcRes);
                                    } else {
                                        const MatrizIPEVAR = require('../../app/clients/tools/structured/MatrizIPEVAR');
                                        toolOutput = await new MatrizIPEVAR({ req })._call(call.args);
                                    }
                                } else if (call.name === 'matriz_pesv') {
                                    const pesvAction = String(call.args?.accion || '').toLowerCase().trim();
                                    const isOpenPesvAction = ['abrir', 'mostrar', 'activar', 'open', 'show'].includes(pesvAction);
                                    if (isOpenPesvAction || (!requestedGuiAction && isExplicitPanelOpenUserIntent(lastUserLower, 'matriz_pesv'))) {
                                        enqueuePanelGuiAction('matriz_pesv', call.args || '');
                                    }
                                    if (isOpenPesvAction) {
                                        toolOutput = JSON.stringify({ exito: true, herramienta: 'matriz_pesv', panel_activado: true });
                                        if (loops === 1 && queuedCalls.length === 0) break;
                                    } else {
                                        const MatrizPESV = require('../../app/clients/tools/structured/MatrizPESV');
                                        toolOutput = await new MatrizPESV({ req })._call(call.args);
                                    }
                                } else if (call.name === 'matriz_compatibilidad') {
                                    const compatAction = String(call.args?.accion || '').toLowerCase().trim();
                                    const isOpenCompatAction = ['abrir', 'mostrar', 'activar', 'open', 'show'].includes(compatAction);
                                    if (isOpenCompatAction || (!requestedGuiAction && isExplicitPanelOpenUserIntent(lastUserLower, 'matriz_compatibilidad'))) {
                                        enqueuePanelGuiAction('matriz_compatibilidad', call.args || '');
                                    }
                                    if (isOpenCompatAction) {
                                        toolOutput = JSON.stringify({ exito: true, herramienta: 'matriz_compatibilidad', panel_activado: true });
                                        if (loops === 1 && queuedCalls.length === 0) break;
                                    } else {
                                        const MatrizCompatibilidad = require('../../app/clients/tools/structured/MatrizCompatibilidad');
                                        toolOutput = await new MatrizCompatibilidad({ req })._call(call.args);
                                    }
                                } else if (call.name === 'gestor_automatizaciones') {
                                    if (companyInfo?._id && !req.companyId) {
                                        req.companyId = String(companyInfo._id);
                                    }
                                    const autoAction = String(call.args?.accion || '').toLowerCase().trim();
                                    const isOpenAutoAction = ['abrir', 'mostrar', 'open', 'show'].includes(autoAction);
                                    const isFlowExecutionAction = autoAction === 'ejecutar_tenshi' || autoAction === 'ejecutar_ahora';
                                    if (
                                        isOpenAutoAction ||
                                        (!requestedGuiAction &&
                                            !isFlowExecutionAction &&
                                            isExplicitPanelOpenUserIntent(lastUserLower, 'gestor_automatizaciones'))
                                    ) {
                                        enqueuePanelGuiAction('gestor_automatizaciones', call.args || '');
                                    }
                                    if (isOpenAutoAction) {
                                        toolOutput = JSON.stringify({ exito: true, herramienta: 'gestor_automatizaciones', panel_activado: true });
                                        if (loops === 1 && queuedCalls.length === 0) break;
                                    } else {
                                        const GestorAutomatizaciones = require('../../app/clients/tools/structured/GestorAutomatizaciones');
                                        toolOutput = await new GestorAutomatizaciones({ req })._call(call.args);
                                    }
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
                                } else if (call.name === 'web_scraper_live') {
                                    const scraperTool = new WebScraperLive({
                                        req,
                                        userId: targetUserId,
                                        companyId: activeCompanyIdStr,
                                        isAgent: false,
                                    });
                                    const rawScraperOut = await scraperTool._call(call.args || {});
                                    toolOutput = Array.isArray(rawScraperOut)
                                        ? String(rawScraperOut[0] || '')
                                        : typeof rawScraperOut === 'string'
                                          ? rawScraperOut
                                          : JSON.stringify(rawScraperOut);
                                } else if (call.name === 'blog_editor') {
                                    const blogAction = String(call.args?.accion || '').toLowerCase().trim();
                                    const isOpenBlogAction = ['abrir', 'mostrar', 'activar', 'open', 'show'].includes(blogAction);
                                    if (isOpenBlogAction || (!requestedGuiAction && isExplicitPanelOpenUserIntent(lastUserLower, 'blog_editor'))) {
                                        enqueuePanelGuiAction('blog_editor', call.args || '');
                                    }
                                    if (isOpenBlogAction) {
                                        toolOutput = JSON.stringify({ exito: true, herramienta: 'blog_editor', panel_activado: true });
                                        if (loops === 1 && queuedCalls.length === 0) break;
                                    } else {
                                        const blogTool = new BlogEditor({ req });
                                        toolOutput = await blogTool._call(call.args || {});
                                    }
                                } else if (call.name === 'editor_live') {
                                    const liveAction = String(call.args?.accion || 'listar').toLowerCase().trim();
                                    const mcpCtx = { companyId: activeCompanyIdStr };
                                    const isOpenLivePanelAction = ['abrir', 'mostrar', 'activar', 'open', 'show'].includes(liveAction);
                                    const isExplicitOpenLiveIntent =
                                        isOpenLivePanelAction ||
                                        (!requestedGuiAction &&
                                            ['listar', 'leer', 'ver'].includes(liveAction) &&
                                            isExplicitPanelOpenUserIntent(lastUserLower, 'editor_live'));
                                    if (isExplicitOpenLiveIntent) {
                                        enqueuePanelGuiAction('editor_live', call.args || '');
                                    }
                                    if (liveAction === 'eliminar' || liveAction === 'borrar' || liveAction === 'delete') {
                                        const delId = String(call.args?.id || call.args?.docId || '').trim();
                                        if (!delId) {
                                            toolOutput = JSON.stringify({ error: 'Debes indicar el "id" del documento en vivo a eliminar.' });
                                        } else {
                                            const res = await executeTenshiMcpTool('wappy_eliminar_documento_vivo', { id: delId }, targetUserId, mcpCtx);
                                            toolOutput = JSON.stringify(res);
                                        }
                                    } else if (liveAction === 'crear' || liveAction === 'guardar' || liveAction === 'actualizar' || liveAction === 'editar') {
                                        const saveArgs = {
                                            ...(call.args?.id ? { id: call.args.id } : {}),
                                            title: call.args?.title || call.args?.titulo || 'Documento SG-SST',
                                            content: call.args?.content || call.args?.contenido || '',
                                        };
                                        const res = await executeTenshiMcpTool('wappy_guardar_documento_vivo', saveArgs, targetUserId, mcpCtx);
                                        if (res?.documento?.content) {
                                            capturedFile = {
                                                title: res.documento.title || saveArgs.title,
                                                fileType: 'text',
                                                content: res.documento.content,
                                                canvasId: `live-doc-${res.documento._id || Date.now()}`,
                                            };
                                        }
                                        toolOutput = JSON.stringify(res);
                                    } else if (liveAction === 'leer' && call.args?.id && mongoose.isValidObjectId(call.args.id)) {
                                        const doc = await LiveDocument.findOne({
                                            _id: call.args.id,
                                            user: { $in: userIds },
                                            ...(activeCompanyIdStr ? { companyId: activeCompanyIdStr } : {}),
                                        }).lean();
                                        toolOutput = JSON.stringify(
                                            doc
                                                ? { success: true, documento: doc, ...(isExplicitOpenLiveIntent ? { panel_activado: true } : {}) }
                                                : { error: `No se encontró el documento en vivo con ID ${call.args.id}.` }
                                        );
                                    } else {
                                        const res = await executeTenshiMcpTool('wappy_consultar_documentos_vivo', { limit: 30 }, targetUserId, mcpCtx);
                                        if (call.args?.busqueda && Array.isArray(res?.documentos)) {
                                            const qLower = String(call.args.busqueda).toLowerCase().trim();
                                            res.documentos = res.documentos.filter((d) =>
                                                String(d?.title || '').toLowerCase().includes(qLower) ||
                                                String(d?.content || '').toLowerCase().includes(qLower)
                                            );
                                            res.total = res.documentos.length;
                                        }
                                        toolOutput = JSON.stringify(
                                            isExplicitOpenLiveIntent && res && typeof res === 'object'
                                                ? { ...res, panel_activado: true }
                                                : res
                                        );
                                        if (isOpenLivePanelAction && loops === 1 && queuedCalls.length === 0 && !call.args?.busqueda && !call.args?.id) {
                                            break;
                                        }
                                    }
                                } else if (call.name === 'wappy_investigar_trabajador_360') {
                                    const osintArgs = { ...(call.args || {}) };
                                    if (osintArgs.documento && !osintArgs.cedula) {
                                        osintArgs.cedula = osintArgs.documento;
                                    }
                                    const hasOsintTarget = Boolean(
                                        String(osintArgs.cedula || '').trim() ||
                                        String(osintArgs.nombre || '').trim() ||
                                        String(osintArgs.placa || '').trim()
                                    );
                                    const isOpenOsintIntent = isExplicitPanelOpenUserIntent(lastUserLower, 'wappy_investigar_trabajador_360');
                                    if (!hasOsintTarget || (!requestedGuiAction && isOpenOsintIntent)) {
                                        enqueuePanelGuiAction('wappy_investigar_trabajador_360', osintArgs);
                                    }
                                    if (!hasOsintTarget) {
                                        toolOutput = JSON.stringify({
                                            exito: true,
                                            herramienta: 'wappy_investigar_trabajador_360',
                                            panel_activado: true,
                                        });
                                        if (loops === 1 && queuedCalls.length === 0) break;
                                    } else {
                                        const res = await executeTenshiMcpTool(
                                            'wappy_investigar_trabajador_360',
                                            osintArgs,
                                            targetUserId,
                                            { companyId: activeCompanyIdStr }
                                        );
                                        toolOutput = JSON.stringify(res);
                                    }
                                } else if (call.name === 'forensic_audit') {
                                    const {
                                        analyzeDisabilityCertificateForensics,
                                        verifyColombianNitCheckDigit,
                                    } = require('~/server/services/forensicDocumentService');
                                    const primaryAttached =
                                        req.__tenshiAttachedMedia ||
                                        (Array.isArray(req.__tenshiAttachedMediaList) ? req.__tenshiAttachedMediaList[0] : null);
                                    if (primaryAttached) {
                                        const forensicRes = await analyzeDisabilityCertificateForensics({
                                            attachedMedia: primaryAttached,
                                            userInstruction: call.args?.instruccion || lastUserMsg,
                                            companyId: activeCompanyIdStr || '',
                                            userId: targetUserId,
                                            modelId: currentModel,
                                        });
                                        toolOutput = JSON.stringify(forensicRes);
                                    } else if (call.args?.texto_documento) {
                                        const rawDocText = String(call.args.texto_documento || '');
                                        const nitMatch = rawDocText.match(/\b(\d{8,10})\s*[-–]\s*(\d)\b/);
                                        const nitCheck = nitMatch
                                            ? verifyColombianNitCheckDigit(`${nitMatch[1]}-${nitMatch[2]}`)
                                            : null;
                                        const suspiciousEditors = ['canva', 'ilovepdf', 'photoshop', 'sejda', 'smallpdf', 'wps', 'pdfelement']
                                            .filter((ed) => rawDocText.toLowerCase().includes(ed));
                                        toolOutput = JSON.stringify({
                                            ok: true,
                                            mode: 'text_heuristic_only',
                                            hasBinaryAttachment: false,
                                            nitCheck,
                                            suspiciousEditorsMentioned: suspiciousEditors,
                                            note: 'Evaluación preliminar sobre texto plano. Para auditoría forense completa de metadatos PDF/EXIF, capas de edición y verificación oficial IPS REPS + Contraloría, adjunta el archivo PDF o imagen original.',
                                        });
                                    } else {
                                        const emptyRes = await analyzeDisabilityCertificateForensics({
                                            userInstruction: call.args?.instruccion || lastUserMsg,
                                            companyId: activeCompanyIdStr || '',
                                            userId: targetUserId,
                                            modelId: currentModel,
                                        });
                                        toolOutput = JSON.stringify(emptyRes);
                                    }
                                } else if (call.name === 'file_search') {
                                    const searchQuery = String(call.args?.query || '').trim();
                                    const filenameFilter = String(call.args?.filename || '').trim().toLowerCase();
                                    const maxResults = Math.max(1, Math.min(Number(call.args?.limit) || 6, 15));
                                    if (!searchQuery) {
                                        toolOutput = JSON.stringify({ error: 'Debes indicar "query" para buscar en los archivos.' });
                                    } else {
                                        const snippets = [];
                                        const keywords = searchQuery
                                            .toLowerCase()
                                            .normalize('NFD')
                                            .replace(/[\u0300-\u036f]/g, '')
                                            .split(/\s+/)
                                            .filter((w) => w.length >= 2);
                                        const scoreText = (txt = '') => {
                                            const norm = String(txt).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                                            if (!norm) return 0;
                                            let hits = 0;
                                            for (const kw of keywords) {
                                                if (norm.includes(kw)) hits++;
                                            }
                                            return keywords.length > 0 ? hits / keywords.length : 0;
                                        };

                                        // 1. Buscar en archivos subidos del usuario (RAG Vector DB si está activo + texto en MongoDB File)
                                        try {
                                            const { getFiles } = require('~/models/File');
                                            const userFiles = (await getFiles({ user: { $in: userIds } }, { updatedAt: -1 })) || [];
                                            const filteredFiles = userFiles
                                                .filter((f) => !filenameFilter || String(f?.filename || '').toLowerCase().includes(filenameFilter))
                                                .slice(0, 15);

                                            const embeddedFiles = filteredFiles.filter((f) => f?.embedded && f?.file_id);
                                            if (process.env.RAG_API_URL && embeddedFiles.length > 0) {
                                                const shortJwt = generateShortLivedToken(targetUserId);
                                                if (shortJwt) {
                                                    const ragHits = await Promise.all(
                                                        embeddedFiles.slice(0, 8).map((f) =>
                                                            axios
                                                                .post(
                                                                    `${process.env.RAG_API_URL}/query`,
                                                                    { file_id: f.file_id, query: searchQuery, k: 4 },
                                                                    {
                                                                        headers: {
                                                                            Authorization: `Bearer ${shortJwt}`,
                                                                            'Content-Type': 'application/json',
                                                                        },
                                                                        timeout: 8000,
                                                                    }
                                                                )
                                                                .then((r) => ({ file: f, rows: Array.isArray(r.data) ? r.data : [] }))
                                                                .catch(() => null)
                                                        )
                                                    );
                                                    for (const hit of ragHits) {
                                                        if (!hit) continue;
                                                        for (const row of hit.rows) {
                                                            const [docInfo, distance] = Array.isArray(row) ? row : [row, 0.5];
                                                            if (docInfo?.page_content) {
                                                                snippets.push({
                                                                    source: 'rag_vector',
                                                                    filename: docInfo.metadata?.filename || hit.file.filename,
                                                                    file_id: hit.file.file_id,
                                                                    relevance: Number((1 - Number(distance || 0.4)).toFixed(4)),
                                                                    excerpt: String(docInfo.page_content).slice(0, 900),
                                                                });
                                                            }
                                                        }
                                                    }
                                                }
                                            }

                                            // Fallback búsqueda textual en Mongo File.text
                                            for (const f of filteredFiles) {
                                                if (!f?.text) continue;
                                                const sc = scoreText(f.text);
                                                if (sc > 0) {
                                                    snippets.push({
                                                        source: 'mongo_file',
                                                        filename: f.filename || f.file_id,
                                                        file_id: f.file_id,
                                                        relevance: Number(sc.toFixed(4)),
                                                        excerpt: String(f.text).slice(0, 900),
                                                    });
                                                }
                                            }
                                        } catch (fileErr) {
                                            logger.warn('[Tenshi file_search] Mongo/RAG lookup warning:', fileErr?.message || fileErr);
                                        }

                                        // 2. Buscar en documentos adjuntos de este turno
                                        if (Array.isArray(activeAttachments) && activeAttachments.length > 0) {
                                            activeAttachments.forEach((att, idx) => {
                                                const txt = extractedTexts[idx] || '';
                                                if (!txt) return;
                                                if (filenameFilter && !String(att?.name || '').toLowerCase().includes(filenameFilter)) return;
                                                const sc = scoreText(txt);
                                                if (sc > 0 || snippets.length === 0) {
                                                    snippets.push({
                                                        source: 'turn_attachment',
                                                        filename: att?.name || `adjunto_${idx + 1}`,
                                                        relevance: Number(Math.max(sc, 0.2).toFixed(4)),
                                                        excerpt: String(txt).slice(0, 900),
                                                    });
                                                }
                                            });
                                        }

                                        // 3. Buscar en LiveDocument de la empresa activa
                                        try {
                                            const liveDocs = await LiveDocument.find({
                                                user: { $in: userIds },
                                                ...(activeCompanyIdStr ? { companyId: activeCompanyIdStr } : {}),
                                            })
                                                .sort({ updatedAt: -1 })
                                                .limit(15)
                                                .lean();
                                            for (const ld of liveDocs) {
                                                const plain = `${ld.title || ''} ${String(ld.content || '').replace(/<[^>]+>/g, ' ')}`;
                                                if (filenameFilter && !String(ld.title || '').toLowerCase().includes(filenameFilter)) continue;
                                                const sc = scoreText(plain);
                                                if (sc > 0) {
                                                    snippets.push({
                                                        source: 'live_document',
                                                        filename: ld.title || 'Documento en Vivo',
                                                        documentId: String(ld._id),
                                                        relevance: Number(sc.toFixed(4)),
                                                        excerpt: plain.replace(/\s+/g, ' ').trim().slice(0, 900),
                                                    });
                                                }
                                            }
                                        } catch (_) {}

                                        snippets.sort((a, b) => (b.relevance || 0) - (a.relevance || 0));
                                        const topSnippets = snippets.slice(0, maxResults);
                                        toolOutput = JSON.stringify({
                                            ok: true,
                                            query: searchQuery,
                                            totalMatches: topSnippets.length,
                                            results: topSnippets,
                                            ...(topSnippets.length === 0
                                                ? { message: 'No se encontraron fragmentos coincidentes en los archivos cargados del usuario.' }
                                                : {}),
                                        });
                                    }
                                } else if (call.name === 'calculator') {
                                    const calcRes = evaluateSafeSstCalculator(call.args || {});
                                    toolOutput = JSON.stringify(calcRes);
                                } else if (call.name === 'editor_rit') {
                                    const ritAction = String(call.args?.accion || '').toLowerCase().trim();
                                    const ritActivation = enqueuePanelGuiAction('editor_rit', call.args || '');
                                    if (['abrir', 'mostrar', 'activar', 'open', 'show'].includes(ritAction)) {
                                        toolOutput = JSON.stringify({
                                            exito: true,
                                            herramienta: 'editor_rit',
                                            panel_activado: true,
                                            mensaje: ritActivation?.message || 'Editor del Reglamento Interno de Trabajo (RIT) activado junto a Canvas.',
                                        });
                                        if (loops === 1 && queuedCalls.length === 0) break;
                                    } else {
                                        const prevRitConvoId = req.body?.conversationId;
                                        if (!req.body) req.body = {};
                                        if (!req.body.conversationId || req.body.conversationId === 'new') {
                                            req.body.conversationId = activeTenshiConvoId || `temp-${targetUserId}-${activeCompanyIdStr || 'default'}`;
                                        }
                                        try {
                                            const EditorRIT = require('../../app/clients/tools/structured/EditorRIT');
                                            toolOutput = await new EditorRIT({ req })._call(call.args);
                                        } finally {
                                            req.body.conversationId = prevRitConvoId;
                                        }
                                    }
                                } else if (call.name === 'consultar_analitica_psicosocial' || call.name === 'wappy_consultar_analitica_psicosocial') {
                                    if (!requestedGuiAction && isExplicitPanelOpenUserIntent(lastUserLower, 'consultar_analitica_psicosocial')) {
                                        enqueuePanelGuiAction('consultar_analitica_psicosocial', call.args || '');
                                    }
                                    const res = await executeTenshiMcpTool('wappy_consultar_analitica_psicosocial', call.args || {}, targetUserId);
                                    toolOutput = JSON.stringify(res);
                                } else if (call.name === 'consultar_analitica_actos_condiciones' || call.name === 'wappy_consultar_analitica_actos_condiciones') {
                                    if (!requestedGuiAction && isExplicitPanelOpenUserIntent(lastUserLower, 'consultar_analitica_actos_condiciones')) {
                                        enqueuePanelGuiAction('consultar_analitica_actos_condiciones', call.args || '');
                                    }
                                    const res = await executeTenshiMcpTool('wappy_consultar_analitica_actos_condiciones', call.args || {}, targetUserId);
                                    toolOutput = JSON.stringify(res);
                                } else if (call.name === 'wappy_crear_informe' || call.name === 'wappy_generar_informe') {
                                    const res = await executeTenshiMcpTool('wappy_crear_informe', call.args || {}, targetUserId);
                                    toolOutput = JSON.stringify(res);
                                    if (res?.informe?.contenido) {
                                        const isHtmlInforme = res.informe.formato === 'html' || res.informe.contenido.includes('<html') || res.informe.contenido.includes('<!DOCTYPE');
                                        if (isHtmlInforme) {
                                            capturedHtmlReport = res.informe.contenido;
                                        }
                                        capturedFile = {
                                            title: res.informe.titulo || call.args?.titulo || 'Informe Técnico Oficial SG-SST',
                                            fileType: isHtmlInforme ? 'html' : 'text',
                                            content: res.informe.contenido,
                                            rawContent: res.informe.contenido,
                                            canvasId: `tenshi-informe-${Date.now()}`,
                                        };
                                    }
                                } else if (call.name === 'wappy_generar_qr' || call.name === 'generar_qr') {
                                    const res = await executeTenshiMcpTool('wappy_generar_qr', call.args || {}, targetUserId);
                                    toolOutput = JSON.stringify(res);
                                    if (res && res.exito) {
                                        capturedQrCode = res;
                                    }
                                } else if (call.name === 'wappy_enviar_correo' || call.name === 'enviar_correo') {
                                    const res = await executeTenshiMcpTool('wappy_enviar_correo', call.args || {}, targetUserId);
                                    toolOutput = JSON.stringify(res);
                                } else if (call.name === 'wappy_gestionar_agenda' || call.name === 'wappy_listar_agenda') {
                                    const res = await executeTenshiMcpTool('wappy_gestionar_agenda', call.args || {}, targetUserId);
                                    toolOutput = JSON.stringify(res);
                                } else if (call.name === 'seleccionar_empresa' || call.name === 'wappy_seleccionar_empresa' || call.name === 'wappy_activar_empresa') {
                                    const term = call.args?.nombre_o_id || call.args?.empresa || call.args?.nombre || call.args?.id || call.args?.companyId || call.args?.target;
                                    const buildAccentInsensitiveRegex = (raw) => {
                                        const base = String(raw || '')
                                            .normalize('NFD')
                                            .replace(/[\u0300-\u036f]/g, '')
                                            .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
                                            .replace(/a/gi, '[aáàäâ]')
                                            .replace(/e/gi, '[eéèëê]')
                                            .replace(/i/gi, '[iíìïî]')
                                            .replace(/o/gi, '[oóòöô]')
                                            .replace(/u/gi, '[uúùüû]')
                                            .replace(/n/gi, '[nñ]');
                                        return new RegExp(base, 'i');
                                    };
                                    let found = null;
                                    if (mongoose.isValidObjectId(term)) {
                                        found = await CompanyInfo.findOne({ user: targetUserId, _id: term });
                                    }
                                    if (!found && term) {
                                        const safeRegex = buildAccentInsensitiveRegex(term);
                                        found = await CompanyInfo.findOne({
                                            user: targetUserId,
                                            $or: [
                                                { companyName: safeRegex },
                                                { nit: term }
                                            ]
                                        });
                                    }
                                    if (!found && term) {
                                        const normTerm = String(term).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
                                        const allUserCompanies = await CompanyInfo.find({ user: targetUserId });
                                        found = allUserCompanies.find((c) => {
                                            const normName = String(c.companyName || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
                                            const normNit = String(c.nit || '').toLowerCase();
                                            return normName.includes(normTerm) || normTerm.includes(normName) || (normNit && normNit.includes(normTerm));
                                        }) || null;
                                    }
                                    if (found) {
                                        await CompanyInfo.updateMany({ user: targetUserId }, { isActive: false });
                                        found.isActive = true;
                                        await found.save();
                                        await syncCompanyMemory(targetUserId, found);
                                        toolOutput = JSON.stringify({ success: true, message: `Empresa "${found.companyName}" activada y sincronizada exitosamente con la memoria.`, empresa: found, companyData: found });
                                    } else {
                                        toolOutput = JSON.stringify({ success: false, error: `No se encontró ninguna empresa que coincida con "${term}".` });
                                    }
                                } else if (call.name === 'wappy_actualizar_empresa' || call.name === 'wappy_actualizar_perfil_empresa' || call.name === 'actualizar_empresa') {
                                    const term = call.args?.empresa || call.args?.nombre_o_id || call.args?.id || call.args?.companyId;
                                    let company = null;
                                    if (term) {
                                        if (mongoose.isValidObjectId(term)) {
                                            company = await CompanyInfo.findOne({ user: targetUserId, _id: term });
                                        }
                                        if (!company) {
                                            const accentPattern = String(term)
                                                .normalize('NFD')
                                                .replace(/[\u0300-\u036f]/g, '')
                                                .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
                                                .replace(/a/gi, '[aáàäâ]')
                                                .replace(/e/gi, '[eéèëê]')
                                                .replace(/i/gi, '[iíìïî]')
                                                .replace(/o/gi, '[oóòöô]')
                                                .replace(/u/gi, '[uúùüû]')
                                                .replace(/n/gi, '[nñ]');
                                            const safeRegex = new RegExp(accentPattern, 'i');
                                            company = await CompanyInfo.findOne({
                                                user: targetUserId,
                                                $or: [{ companyName: safeRegex }, { nit: term }]
                                            });
                                        }
                                    }
                                    if (!company) {
                                        company = await CompanyInfo.findOne({ user: targetUserId, isActive: true });
                                    }
                                    if (!company) {
                                        company = await CompanyInfo.findOne({ user: targetUserId });
                                    }
                                    if (!company) {
                                        toolOutput = JSON.stringify({ success: false, error: 'No se encontró ninguna empresa para actualizar.' });
                                    } else {
                                        const updateFields = [
                                            'companyName', 'companyType', 'nit', 'legalRepresentative', 'legalRepresentativeId',
                                            'workerCount', 'arl', 'economicActivity', 'riskLevel', 'ciiu', 'address',
                                            'city', 'departamento', 'phone', 'email', 'generalActivities', 'sector',
                                            'responsibleSST', 'responsibleSSTPhone', 'formationLevel', 'licenseNumber',
                                            'courseStatus', 'licenseExpiry', 'sedes'
                                        ];
                                        for (const f of updateFields) {
                                            if (call.args[f] !== undefined && call.args[f] !== null) {
                                                company[f] = call.args[f];
                                            }
                                        }
                                        await company.save();
                                        if (company.isActive) {
                                            await syncCompanyMemory(targetUserId, company);
                                        }
                                        toolOutput = JSON.stringify({
                                            success: true,
                                            mensaje: `Empresa "${company.companyName}" actualizada exitosamente.`,
                                            empresa: company,
                                            companyData: company
                                        });
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
                                    const cleanBrowserState = typeof browserState === 'string' ? browserState.trim() : '';
                                    if (cleanBrowserState.length > 30) {
                                        toolOutput = JSON.stringify({ success: true, contenido_pantalla: cleanBrowserState });
                                    } else {
                                        toolOutput = JSON.stringify({ success: true, message: 'La pantalla actual no contiene texto o elementos adicionales visibles.' });
                                    }
                                } else if (call.name === 'wappy_diligenciar_formulario') {
                                    const formArgs = call.args && typeof call.args === 'object' ? call.args : {};
                                    const formModulo = typeof formArgs.modulo === 'string' ? formArgs.modulo.trim() : '';
                                    requestedGuiAction = {
                                        name: 'wappy_diligenciar_formulario',
                                        args: formArgs,
                                        message: formModulo
                                            ? `¡Listo! Estoy diligenciando el formulario **${formModulo.replace(/_/g, ' ')}** directamente en pantalla.`
                                            : '¡Listo! Estoy diligenciando el formulario directamente en pantalla.',
                                    };
                                    break;
                                } else if (call.name === 'wappy_navegar') {
                                    const rawNavModulo = typeof call.args?.modulo === 'string' ? call.args.modulo.trim() : '';
                                    const rawNavRuta = typeof call.args?.ruta === 'string' ? call.args.ruta.trim() : '';
                                    const safeNavRuta = /^\/centro[-_]?control\/?$/i.test(rawNavRuta)
                                        ? '/sgsst/control'
                                        : rawNavRuta || undefined;
                                    const safeNavArgs = {
                                        ...(call.args && typeof call.args === 'object' ? call.args : {}),
                                        ...(rawNavModulo ? { modulo: rawNavModulo } : {}),
                                        ...(safeNavRuta ? { ruta: safeNavRuta } : {}),
                                    };
                                    const navDisplayName = rawNavModulo
                                        ? rawNavModulo.replace(/_/g, ' ')
                                        : safeNavRuta || 'WAPPY';
                                    requestedGuiAction = {
                                        name: 'wappy_navegar',
                                        accion: 'navegar',
                                        modulo: rawNavModulo || undefined,
                                        ruta: safeNavRuta,
                                        args: safeNavArgs,
                                        message: `¡De una! Te abro **${navDisplayName}** directamente en el **Navegador WAPPY (🌐 Wappy)** sin salir de nuestra conversación.`,
                                    };
                                    break;
                                } else if (call.name === 'wappy_abrir_curso') {
                                    const query = call.args?.curso || call.args?.course || call.args?.id || call.args?.titulo || '';
                                    const course = await findMatchingCourse(query);
                                    let targetRoute = '/academia?tab=cursos';
                                    let courseTitle = query;
                                    if (course) {
                                        courseTitle = course.title;
                                        targetRoute = `/training/${course._id}/${sanitizeSlug(course.title)}`;
                                    }
                                    const courseMsg = course
                                        ? `¡De una! Abriendo el curso **${courseTitle}** en pantalla.`
                                        : '¡De una! Abriendo el catálogo de cursos de **WAPPY Academia** en pantalla.';
                                    requestedGuiAction = {
                                        name: 'wappy_navegar',
                                        accion: 'navegar',
                                        modulo: 'training',
                                        ruta: targetRoute,
                                        args: { ruta: targetRoute, modulo: 'training' },
                                        message: courseMsg,
                                    };
                                    toolOutput = JSON.stringify({
                                        success: true,
                                        message: course ? `Abriendo curso "${courseTitle}" en pantalla: ${targetRoute}` : 'Abriendo catálogo de cursos de WAPPY Academia.'
                                    });
                                    break;
                                } else if (call.name === 'wappy_abrir_articulo_blog') {
                                    const query = call.args?.articulo || call.args?.slug || call.args?.id || call.args?.titulo || '';
                                    const post = await findMatchingBlogPost(query);
                                    let targetRoute = '/academia?tab=blog';
                                    let postTitle = query;
                                    if (post) {
                                        postTitle = post.title;
                                        targetRoute = `/blog/${post._id}/${sanitizeSlug(post.title)}`;
                                    }
                                    const blogMsg = post
                                        ? `¡De una! Abriendo el artículo **${postTitle}** en pantalla.`
                                        : '¡De una! Abriendo el **Blog de WAPPY** en pantalla.';
                                    requestedGuiAction = {
                                        name: 'wappy_navegar',
                                        accion: 'navegar',
                                        modulo: 'blog',
                                        ruta: targetRoute,
                                        args: { ruta: targetRoute, modulo: 'blog' },
                                        message: blogMsg,
                                    };
                                    toolOutput = JSON.stringify({
                                        success: true,
                                        message: post ? `Abriendo artículo "${postTitle}" en pantalla: ${targetRoute}` : 'Abriendo Blog de WAPPY.'
                                    });
                                    break;
                                } else if (call.name === 'wappy_iniciar_estudio_ergonomico_vivo') {
                                    requestedGuiAction = {
                                        name: 'wappy_iniciar_estudio_ergonomico_vivo',
                                        accion: 'iniciar_estudio_ergonomico_vivo',
                                        args: call.args || {}
                                    };
                                    break;
                                } else if (call.name === 'wappy_abrir_chat_agente') {
                                    requestedGuiAction = {
                                        name: 'wappy_abrir_chat_agente',
                                        accion: 'abrir_chat_agente',
                                        args: call.args || {}
                                    };
                                    break;
                                } else if (call.name === 'wappy_buscar_historial_instantaneo') {
                                    const histOut = await searchInstantHistory(call.args || {}, targetUserId);
                                    toolOutput = JSON.stringify(histOut);
                                } else if (call.name === 'wappy_controlar_videollamada' || call.name === 'controlar_videollamada') {
                                    const rawAccion = call.args?.accion || 'activar_camara';
                                    if (rawAccion === 'activar_camara') {
                                        const userPrompt = (message || '').toLowerCase();
                                        const explicitCam = /\b(activa|activar|enciende|encender|inicia|iniciar|pon|poner|prende|prender|abre|abrir|mostrar|ver)\s+(la\s+)?(c[aá]mara|videollamada|video|visi[oó]n)\b|\b(videollamada|c[aá]mara\s+en\s+vivo|activa\s+c[aá]mara|activa\s+video|prende\s+c[aá]mara)\b/i.test(userPrompt);
                                        if (!explicitCam) {
                                            toolOutput = JSON.stringify({
                                                success: false,
                                                error: 'Cámara NO activada: La videollamada requiere una orden explícita del usuario (ej: "activa la cámara", "inicia videollamada"). NUNCA actives la cámara ante expresiones casuales o refranes.'
                                            });
                                            break;
                                        }
                                    }
                                    const camMsg = rawAccion === 'activar_camara'
                                        ? 'Cámara y videollamada activadas con éxito.'
                                        : rawAccion === 'apagar_camara'
                                        ? 'Cámara apagada con éxito.'
                                        : 'Llamada finalizada y colgada a petición del usuario.';
                                    requestedGuiAction = {
                                        name: 'wappy_controlar_videollamada',
                                        action: 'wappy_controlar_videollamada',
                                        accion: rawAccion,
                                        message: camMsg,
                                    };
                                    toolOutput = JSON.stringify({
                                        success: true,
                                        accion: rawAccion,
                                        message: camMsg
                                    });
                                } else if (call.name === 'operar_interfaz_visual') {
                                    const guiCalls = calls.filter(c => c.name === 'operar_interfaz_visual');
                                    requestedGuiActions = guiCalls.map(c => ({
                                        accion: c.args.accion,
                                        indice: c.args.indice,
                                        texto: c.args.texto,
                                        direccion: c.args.direccion,
                                        detalle: c.args.detalle || c.args.campo,
                                        campo: c.args.campo
                                    }));
                                    requestedGuiAction = requestedGuiActions[0]; // fallback
                                    toolOutput = JSON.stringify({
                                        success: true,
                                        message: `Acción visual programada: ${requestedGuiAction.accion}`
                                    });
                                    break;
                                } else if (call.name === 'wappy_memoria_procedimental') {
                                    const memOut = await manageProceduralMemory(
                                        call.args || {},
                                        targetUserId,
                                        companyInfo?._id,
                                        companyInfo?.companyName || ''
                                    );
                                    if (memOut.widget) {
                                        capturedWidget = memOut.widget;
                                    }
                                    toolOutput = JSON.stringify(memOut.result);
                                } else if (call.name === 'wappy_renderizar_widget_interactivo') {
                                    capturedWidget = buildGenerativeWidgetForTool(
                                        'wappy_renderizar_widget_interactivo',
                                        call.args || {},
                                        { ok: true }
                                    );
                                    toolOutput = JSON.stringify({
                                        success: true,
                                        mensaje: `Widget interactivo "${capturedWidget?.title || 'Simulador SST'}" proyectado exitosamente en el chat del usuario.`,
                                    });
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
                                    if (isGovernedTool('wappy_retirar_trabajador', argsToSend)) {
                                        const staged = await stageGovernedAction('wappy_retirar_trabajador', argsToSend, targetUserId, companyInfo?._id);
                                        capturedWidget = staged.widget;
                                        toolOutput = JSON.stringify(staged.toolResponse);
                                    } else {
                                        const res = await executeTenshiMcpTool('wappy_retirar_trabajador', argsToSend, targetUserId);
                                        toolOutput = JSON.stringify(res);
                                    }
                                } else if (call.name === 'wappy_actualizar_trabajador') {
                                    const rawArgs = call.args || {};
                                    const target = rawArgs.idOrCedula || rawArgs.id || rawArgs.cedula || rawArgs.nombre || rawArgs.identificacion || rawArgs.target || '';
                                    const argsToSend = { ...rawArgs, idOrCedula: target, id: target };
                                    const res = await executeTenshiMcpTool('wappy_actualizar_trabajador', argsToSend, targetUserId);
                                    toolOutput = JSON.stringify(res);
                                } else if (call.name === 'wappy_consultar_trabajadores') {
                                    const res = await executeTenshiMcpTool('wappy_consultar_trabajadores', call.args || {}, targetUserId);
                                    if (!capturedWidget) {
                                        capturedWidget = buildGenerativeWidgetForTool('wappy_consultar_trabajadores', call.args || {}, res);
                                    }
                                    toolOutput = JSON.stringify(res);
                                } else if (call.name === 'wappy_registrar_trabajador') {
                                    const res = await executeTenshiMcpTool('wappy_registrar_trabajador', call.args || {}, targetUserId);
                                    toolOutput = JSON.stringify(res);
                                } else if (call.name === 'wappy_importar_sociodemografico_drive' || call.name === 'wappy_alimentar_sociodemografico_masivo') {
                                    const res = await executeTenshiMcpTool('wappy_importar_sociodemografico_drive', call.args || {}, targetUserId);
                                    toolOutput = JSON.stringify(res);
                                } else if (call.name === 'wappy_importar_hito1_drive') {
                                    const res = await executeTenshiMcpTool('wappy_importar_hito1_drive', call.args || {}, targetUserId);
                                    toolOutput = JSON.stringify(res);
                                } else if (call.name === 'wappy_resumen_general_360') {
                                    const res = await executeTenshiMcpTool('wappy_resumen_general_360', call.args || {}, targetUserId);
                                    if (!capturedWidget) {
                                        capturedWidget = buildGenerativeWidgetForTool('wappy_resumen_general_360', call.args || {}, res);
                                    }
                                    toolOutput = JSON.stringify(res);
                                } else if (call.name === 'notebooklm_listar_cuadernos' || call.name === 'notebooklm_consultar' || call.name === 'notebooklm_generar_studio') {
                                     let mappedTool = 'notebook_list';
                                     let mappedArgs = {};
                                     if (call.name === 'notebooklm_consultar') {
                                         mappedTool = 'chat_ask';
                                         mappedArgs = {
                                             notebook:
                                                 call.args?.cuaderno ||
                                                 call.args?.notebook ||
                                                 effectiveSelectedNotebooks[0]?.id ||
                                                 effectiveSelectedNotebooks[0]?.title ||
                                                 '',
                                             query: call.args?.pregunta || call.args?.query || '',
                                         };
                                     } else if (call.name === 'notebooklm_generar_studio') {
                                         mappedTool = 'studio_generate';
                                         mappedArgs = {
                                             notebook:
                                                 call.args?.cuaderno ||
                                                 call.args?.notebook ||
                                                 effectiveSelectedNotebooks[0]?.id ||
                                                 effectiveSelectedNotebooks[0]?.title ||
                                                 '',
                                             artifact_type: call.args?.tipo_artefacto || call.args?.artifact_type || 'audio',
                                             instructions: call.args?.instrucciones || '',
                                         };
                                     }
                                     const res = await executeTenshiMcpTool(
                                         mappedTool,
                                         mappedArgs,
                                         targetUserId,
                                         {
                                             companyId: activeCompanyIdStr,
                                             selectedNotebooks: effectiveSelectedNotebooks,
                                         }
                                     );
                                     toolOutput = typeof res === 'string' ? res : JSON.stringify(res);
                                 } else if (call.name === 'google_flow_generar_imagen' || call.name === 'google_flow_generar_video' || call.name === 'google_flow') {
                                     const isVideoCall =
                                         call.name === 'google_flow_generar_video' ||
                                         call.args?.accion === 'generar_video';
                                     const flowPrompt = call.args?.prompt || call.args?.descripcion || '';
                                     const flowAspect = call.args?.aspecto || call.args?.aspectRatio || '16:9';
                                     const flowStyle = call.args?.estilo || call.args?.style || 'fotorrealista';
                                     const flowMotion = call.args?.movimiento_camara || call.args?.cameraMotion || 'zoom_in';

                                     const mediaOut = await executeDirectFlowMediaForTenshi({
                                         isVideo: isVideoCall,
                                         prompt: flowPrompt,
                                         aspectRatio: flowAspect,
                                         style: flowStyle,
                                         cameraMotion: flowMotion,
                                         skipAntigravity: !allowAntigravityMedia,
                                         userId: targetUserId,
                                         companyId: activeCompanyIdStr,
                                     });

                                     capturedHtmlReport = mediaOut.studioHtml;
                                     capturedFile = mediaOut.fileObj;
                                     capturedFlowMarkdown = mediaOut.flowMd;
                                     capturedFlowPublicUrl = mediaOut.publicUrl;

                                     toolOutput = JSON.stringify({
                                         success: true,
                                         tipo: mediaOut.mediaRes.type,
                                         url: mediaOut.publicUrl,
                                         modelo: mediaOut.mediaRes.model,
                                         formato: mediaOut.mediaRes.aspectRatio,
                                         markdown_para_incluir_en_tu_respuesta: mediaOut.flowMd,
                                         instruccion: 'Incluye SIEMPRE el código markdown_para_incluir_en_tu_respuesta UNA SOLA VEZ en tu respuesta. PROHIBIDO agregar un segundo enlace [⬇ Descargar] repetido hacia la misma URL, ya que la tarjeta visual de WAPPY ya incluye la vista previa y el botón de descarga.',
                                     });
                                 } else if (
                                     call.name === 'wappy_activar_herramienta_agente' ||
                                     (call.name === 'wappy_mcp_sst' &&
                                         (call.args?.herramienta === 'wappy_activar_herramienta_agente' ||
                                             call.args?.tool === 'wappy_activar_herramienta_agente'))
                                 ) {
                                     const activateArgs =
                                         call.name === 'wappy_mcp_sst'
                                             ? (call.args?.parametros && typeof call.args.parametros === 'object'
                                                   ? call.args.parametros
                                                   : call.args?.args && typeof call.args.args === 'object'
                                                     ? call.args.args
                                                     : {})
                                             : (call.args || {});
                                     const rawHerramienta =
                                         typeof (activateArgs?.herramienta || activateArgs?.tool || activateArgs?.nombre) === 'string'
                                             ? String(activateArgs?.herramienta || activateArgs?.tool || activateArgs?.nombre).trim()
                                             : '';
                                     const normalizedTool = normalizeTenshiPanelToolId(rawHerramienta);
                                     const effectiveTool = normalizedTool || rawHerramienta;
                                     const effectiveParams =
                                         activateArgs?.parametros !== undefined && activateArgs?.parametros !== null
                                             ? activateArgs.parametros
                                             : '';
                                     if (!effectiveTool) {
                                         toolOutput = JSON.stringify({
                                             exito: false,
                                             error: `Debes indicar el ID exacto de la herramienta en "herramienta": ${TENSHI_PANEL_TOOL_IDS.join(', ')} o generar_imagen_sst.`,
                                         });
                                     } else {
                                         const activatedGui = enqueuePanelGuiAction(effectiveTool, effectiveParams);
                                         toolOutput = JSON.stringify({
                                             exito: true,
                                             herramienta: effectiveTool,
                                             parametros: effectiveParams,
                                             panel_activado: true,
                                             mensaje:
                                                 activatedGui?.message ||
                                                 `Herramienta "${effectiveTool}" activada con éxito junto a Canvas.`,
                                             instruccion:
                                                 'El panel visual ya fue activado en la interfaz junto a Canvas. NO vuelvas a invocar wappy_activar_herramienta_agente; responde de forma breve y clara al usuario.',
                                         });
                                         if (loops === 1 && queuedCalls.length === 0) {
                                             break;
                                         }
                                     }
                                 } else if (call.name === 'wappy_mcp_sst' || call.name in TOOL_ROUTES || (call.name.startsWith('wappy_') && !['wappy_navegar', 'wappy_diligenciar_formulario', 'wappy_seleccionar_empresa', 'wappy_activar_empresa'].includes(call.name))) {
                                    const targetTool = call.name === 'wappy_mcp_sst' ? (call.args?.herramienta || call.args?.tool || 'wappy_resumen_general_360') : call.name;
                                    const targetArgs = call.name === 'wappy_mcp_sst' ? (call.args?.parametros || call.args?.args || call.args || {}) : (call.args || {});
                                    if (targetTool === 'wappy_delegar_orden_antigravity' || targetTool === 'delegar_orden_antigravity') {
                                        targetArgs.sourceModule = targetArgs.sourceModule || 'tenshi_chat';
                                        targetArgs.remitente = targetArgs.remitente || 'Tenshi Chat Escrito';
                                        if (companyInfo?.companyName && !targetArgs.empresa) {
                                            targetArgs.empresa = companyInfo.companyName;
                                        }
                                    }
                                    if (isGovernedTool(targetTool, targetArgs)) {
                                        const staged = await stageGovernedAction(targetTool, targetArgs, targetUserId, companyInfo?._id);
                                        capturedWidget = staged.widget;
                                        toolOutput = JSON.stringify(staged.toolResponse);
                                    } else {
                                        const res = await executeTenshiMcpTool(
                                            targetTool,
                                            targetArgs,
                                            targetUserId,
                                            {
                                                companyId: activeCompanyIdStr,
                                                selectedNotebooks: effectiveSelectedNotebooks,
                                            }
                                        );
                                        if ((targetTool === 'wappy_delegar_orden_antigravity' || targetTool === 'delegar_orden_antigravity') && res?.ordenId) {
                                            capturedDelegatedOrder = {
                                                ordenId: res.ordenId,
                                                titulo: res.detalles?.titulo || targetArgs?.titulo || 'Orden Antigravity',
                                                formato: res.detalles?.formatoEntregable || targetArgs?.tipo_entregable || 'html',
                                                estado: res.estado || 'todo',
                                                routedToEnv: res.routedToEnv || 'local',
                                                activeMode: res.activeMode || 'auto',
                                            };
                                        }
                                        if (!capturedWidget) {
                                            capturedWidget = buildGenerativeWidgetForTool(targetTool, targetArgs, res);
                                        }
                                        toolOutput = JSON.stringify(res);
                                    }
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
                                    const rawEvidences =
                                        Array.isArray(parsed.evidencias) && parsed.evidencias.length > 0
                                            ? parsed.evidencias
                                            : Array.isArray(parsed.evidenceFiles) && parsed.evidenceFiles.length > 0
                                            ? parsed.evidenceFiles
                                            : null;
                                    if (rawEvidences) {
                                        capturedEvidenceFiles = mergeSanitizedEvidenceFiles(capturedEvidenceFiles, rawEvidences);
                                    }
                                    if (parsed.informeOriginalHtml) {
                                        capturedHtmlReport = parsed.informeOriginalHtml;
                                        capturedFile = {
                                            title: parsed.titulo || `Informe Oficial de ${parsed.aplicativo || 'SGSST'}`,
                                            fileType: 'html',
                                            content: parsed.informeOriginalHtml,
                                        };
                                    } else if (parsed.htmlCode) {
                                        capturedHtmlReport = parsed.htmlCode;
                                        capturedFile = {
                                            title: parsed.titulo || 'Informe Técnico Oficial',
                                            fileType: 'html',
                                            content: parsed.htmlCode,
                                        };
                                    } else if (parsed.informeCompleto && (parsed.informeCompleto.includes('<html') || parsed.informeCompleto.includes('<div') || parsed.informeCompleto.includes('<table') || parsed.informeCompleto.includes('<!DOCTYPE'))) {
                                        capturedHtmlReport = parsed.informeCompleto;
                                        capturedFile = {
                                            title: parsed.titulo || `Informe Oficial de ${parsed.aplicativo || 'SGSST'}`,
                                            fileType: 'html',
                                            content: parsed.informeCompleto,
                                        };
                                    } else if (parsed.content && (parsed.content.includes('<html') || parsed.content.includes('<!DOCTYPE') || parsed.content.includes('<table'))) {
                                        capturedHtmlReport = parsed.content;
                                        capturedFile = {
                                            title: parsed.title || 'Documento SG-SST',
                                            fileType: 'html',
                                            content: parsed.content,
                                        };
                                    }
                                } else if (typeof toolOutput === 'string' && (toolOutput.includes('<html') || toolOutput.includes('<!DOCTYPE'))) {
                                    capturedHtmlReport = toolOutput;
                                    capturedFile = {
                                        title: 'Documento Oficial SG-SST',
                                        fileType: 'html',
                                        content: toolOutput,
                                    };
                                }
                            } catch (e) { }

                            const rawCandidateParts = (candidate && candidate.content && Array.isArray(candidate.content.parts))
                                ? candidate.content.parts
                                : [];
                            const targetArgsSig = JSON.stringify(call.args || {});
                            let matchedPartIdx = rawCandidateParts.findIndex(
                                (p) =>
                                    p &&
                                    p.functionCall &&
                                    p.functionCall.name === call.name &&
                                    JSON.stringify(p.functionCall.args || {}) === targetArgsSig
                            );
                            if (matchedPartIdx === -1) {
                                matchedPartIdx = rawCandidateParts.findIndex(
                                    (p) => p && p.functionCall && p.functionCall.name === call.name
                                );
                            }
                            const filteredParts = rawCandidateParts.filter((p, idx) => {
                                if (p && p.functionCall) {
                                    return idx === matchedPartIdx;
                                }
                                return true;
                            });
                            const modelParts = filteredParts.length > 0 && matchedPartIdx !== -1
                                ? filteredParts
                                : [{
                                    functionCall: { name: call.name, args: call.args }
                                }];
                            currentContents.push({ role: 'model', parts: modelParts });

                            let parsedResponse;
                            if (typeof toolOutput === 'object' && toolOutput !== null) {
                                parsedResponse = { ...toolOutput };
                            } else if (typeof toolOutput === 'string' && toolOutput.trim().startsWith('{')) {
                                try {
                                    parsedResponse = JSON.parse(toolOutput);
                                } catch (e) {
                                    parsedResponse = { result: toolOutput };
                                }
                            } else {
                                parsedResponse = { result: String(toolOutput || 'Operación completada.') };
                            }

                            // Aligerar el payload antes de enviarlo de vuelta al LLM en functionResponse
                            // para evitar que documentos HTML de 100KB+ provoquen errores 503 por exceso de tokens
                            const lightResponse = (parsedResponse && typeof parsedResponse === 'object')
                                ? { ...parsedResponse }
                                : { result: String(parsedResponse || 'OK') };
                            if (lightResponse.informeOriginalHtml) {
                                delete lightResponse.informeOriginalHtml;
                                lightResponse.notaAdjunto = 'El informe HTML completo ya fue adjuntado automáticamente a la interfaz del chat para que el usuario lo visualice o descargue.';
                            }
                            if (lightResponse.htmlCode) {
                                delete lightResponse.htmlCode;
                                lightResponse.notaAdjunto = 'El documento HTML completo ya fue adjuntado automáticamente a la interfaz del chat.';
                            }
                            if (lightResponse.todosLosInformes && Array.isArray(lightResponse.todosLosInformes)) {
                                lightResponse.todosLosInformes = lightResponse.todosLosInformes.slice(0, 5).map(inf => ({
                                    titulo: inf.titulo,
                                    fecha: inf.fecha,
                                    resumen: typeof inf.resumen === 'string' ? inf.resumen.substring(0, 400) : undefined
                                }));
                            }
                            if (typeof lightResponse.informeCompleto === 'string' && lightResponse.informeCompleto.length > 3500) {
                                lightResponse.informeCompleto = lightResponse.informeCompleto
                                    .replace(/<style[\s\S]*?<\/style>/gi, '')
                                    .replace(/<script[\s\S]*?<\/script>/gi, '')
                                    .replace(/<[^>]+>/g, ' ')
                                    .replace(/\s+/g, ' ')
                                    .trim()
                                    .substring(0, 3500) + '... (resumido para síntesis rápida)';
                            }
                            if (typeof lightResponse.content === 'string' && lightResponse.content.length > 3500) {
                                lightResponse.content = lightResponse.content
                                    .replace(/<style[\s\S]*?<\/style>/gi, '')
                                    .replace(/<script[\s\S]*?<\/script>/gi, '')
                                    .replace(/<[^>]+>/g, ' ')
                                    .replace(/\s+/g, ' ')
                                    .trim()
                                    .substring(0, 3500) + '...';
                            }

                            if (capturedWidget) {
                                // Evitar que el LLM gaste 9s repitiendo 41 trabajadores en una segunda lista (wappy-card)
                                if (Array.isArray(lightResponse.trabajadores) && lightResponse.trabajadores.length > 4) {
                                    lightResponse.trabajadoresMuestra = lightResponse.trabajadores.slice(0, 3).map(w => ({
                                        nombre: w.nombre_completo || w.nombreCompleto || w.nombre,
                                        cedula: w.cedula,
                                        cargo: w.cargo,
                                        estado: w.estadoLaboral
                                    }));
                                    delete lightResponse.trabajadores;
                                }
                                lightResponse.instruccionCriticaWidget = 'IMPORTANTE: El widget interactivo oficial de React YA FUE ADJUNTADO automáticamente debajo de tu burbuja de chat con el listado completo, buscador y controles. PROHIBIDO generar bloques ```wappy-card``` o repetir toda la lista en texto. Responde únicamente con un resumen ejecutivo cálido de 2 a 3 líneas.';
                            }

                            if (
                                (Array.isArray(lightResponse.evidencias) && lightResponse.evidencias.length > 0) ||
                                (Array.isArray(lightResponse.evidenceFiles) && lightResponse.evidenceFiles.length > 0)
                            ) {
                                const srcEv = Array.isArray(lightResponse.evidencias) && lightResponse.evidencias.length > 0
                                    ? lightResponse.evidencias
                                    : lightResponse.evidenceFiles;
                                lightResponse.evidencias = srcEv.map((ev) => ({
                                    title: ev.title || 'Certificado Oficial',
                                    portal: ev.portal || '',
                                    workerName: ev.workerName || '',
                                    cedula: ev.cedula || '',
                                    cargo: ev.cargo || '',
                                    entregadoEnChat: true,
                                }));
                                delete lightResponse.evidenceFiles;
                                lightResponse.instruccionCertificadosChat =
                                    lightResponse.evidencias.length === 1
                                        ? 'IMPORTANTE: El certificado oficial YA FUE EMITIDO Y ENTREGADO directamente en este chat de Tenshi como tarjeta interactiva lista para abrir. Díselo explícitamente al usuario ("el certificado fue emitido, ya lo recibiste aquí en el chat y ya puedes abrirlo") y NO pegues rutas /api/... crudas en el texto.'
                                        : `IMPORTANTE: Los ${lightResponse.evidencias.length} certificados oficiales YA FUERON EMITIDOS Y ENTREGADOS directamente en este chat de Tenshi como tarjetas interactivas listas para abrir. Díselo explícitamente al usuario ("los certificados fueron emitidos, ya los recibiste aquí en el chat y ya puedes abrirlos") y NO pegues rutas /api/... crudas en el texto.`;
                            }

                            currentContents.push({
                                role: 'user',
                                parts: [
                                    {
                                        functionResponse: {
                                            name: call.name,
                                            response: lightResponse
                                        }
                                    }
                                ]
                            });

                            try {
                                const synthesisTimeoutMs =
                                    call.name === 'consultar_multiples_especialistas_paralelo' ||
                                    call.name === 'consultar_agente_especializado'
                                        ? 25000
                                        : isExplicitSelectedFirst || isPrimaryModel
                                          ? PRIMARY_INITIAL_TIMEOUT_MS
                                          : 14000;
                                responseResult = await withGeminiTimeout(
                                    geminiModel.generateContent({ contents: currentContents }),
                                    synthesisTimeoutMs,
                                    `Tenshi Chat (${currentModel}) synthesis`
                                );
                                candidate = responseResult.response.candidates && responseResult.response.candidates[0];
                                calls = responseResult.response.functionCalls();
                                if ((!calls || calls.length === 0) && queuedCalls.length > 0) {
                                    while (queuedCalls.length > 0) {
                                        const nextQueued = queuedCalls.shift();
                                        const nextSig = `${nextQueued.call.name}:${JSON.stringify(nextQueued.call.args || {})}`;
                                        if (!executedCallSigs.has(nextSig)) {
                                            calls = [nextQueued.call];
                                            candidate = nextQueued.candidateContent ? { content: nextQueued.candidateContent } : null;
                                            break;
                                        }
                                    }
                                }
                            } catch (synthErr) {
                                const retrySynthTimeoutMs =
                                    call.name === 'consultar_multiples_especialistas_paralelo' ||
                                    call.name === 'consultar_agente_especializado'
                                        ? 18000
                                        : PRIMARY_RETRY_TIMEOUT_MS;
                                const retriedSynthResult = await tryFastSynthesisKeyRetry(
                                    synthErr,
                                    keyIdx,
                                    currentContents,
                                    retrySynthTimeoutMs,
                                    `herramienta ${call.name}`
                                );
                                if (retriedSynthResult) {
                                    responseResult = retriedSynthResult;
                                    candidate = responseResult.response.candidates && responseResult.response.candidates[0];
                                    calls = responseResult.response.functionCalls();
                                    if ((!calls || calls.length === 0) && queuedCalls.length > 0) {
                                        while (queuedCalls.length > 0) {
                                            const nextQueued = queuedCalls.shift();
                                            const nextSig = `${nextQueued.call.name}:${JSON.stringify(nextQueued.call.args || {})}`;
                                            if (!executedCallSigs.has(nextSig)) {
                                                calls = [nextQueued.call];
                                                candidate = nextQueued.candidateContent ? { content: nextQueued.candidateContent } : null;
                                                break;
                                            }
                                        }
                                    }
                                } else {
                                    logger.warn(`[Tenshi Synthesis Fallback] Error sintetizando respuesta de herramienta ${call.name} (${synthErr.message}). Rescatando resultado directo...`);
                                    // Si la herramienta ya se ejecutó con éxito pero el segundo llamado a Gemini dio 503,
                                    // no perder el resultado ni lanzar error 503 al usuario: construir síntesis limpia en español.
                                    let rescuedText = '';
                                    if (lightResponse.error) {
                                        rescuedText = `Revisé el módulo solicitado: ${lightResponse.error}`;
                                    } else if (lightResponse.titulo || lightResponse.informeCompleto) {
                                        const cleanExtract = String(lightResponse.informeCompleto || lightResponse.resumen || '')
                                            .replace(/<[^>]+>/g, ' ')
                                            .replace(/\s+/g, ' ')
                                            .trim()
                                            .substring(0, 700);
                                        rescuedText = `✅ **Revisión completada: ${lightResponse.titulo || 'Informe del Aplicativo'}**\n\n${cleanExtract ? `${cleanExtract}...\n\n` : ''}Ya tienes el documento técnico oficial adjunto aquí mismo en nuestro chat para que puedas abrirlo, revisarlo en detalle o descargarlo en PDF/Word.`;
                                    } else if (capturedEvidenceFiles.length > 0) {
                                        const certNotice =
                                            capturedEvidenceFiles.length === 1
                                                ? '✅ **El certificado oficial fue emitido y ya lo recibiste aquí en tu chat de Tenshi; ya puedes abrirlo o descargarlo.**'
                                                : `✅ **Los ${capturedEvidenceFiles.length} certificados oficiales fueron emitidos y ya los recibiste aquí en tu chat de Tenshi; ya puedes abrirlos o descargarlos.**`;
                                        const baseRes = String(lightResponse.resultado || '').trim();
                                        rescuedText = baseRes ? `${certNotice}\n\n${baseRes}` : certNotice;
                                    } else if (lightResponse.resultado || lightResponse.mensaje || lightResponse.message || lightResponse.resumen) {
                                        rescuedText = String(lightResponse.resultado || lightResponse.mensaje || lightResponse.message || lightResponse.resumen);
                                    } else if (
                                        (call.name === 'consultar_multiples_especialistas_paralelo' ||
                                            call.name === 'consultar_agente_especializado') &&
                                        typeof lightResponse.result === 'string' &&
                                        lightResponse.result.trim()
                                    ) {
                                        rescuedText = lightResponse.result.trim();
                                    } else if (capturedFile || capturedHtmlReport) {
                                        rescuedText = `✅ Listo, he revisado y cargado el **${capturedFile?.title || 'Informe Oficial SG-SST'}** directamente aquí en nuestro chat para tu revisión.`;
                                    } else {
                                        rescuedText = `✅ He ejecutado la revisión solicitada (${call.name}). Los datos han sido procesados correctamente.`;
                                    }
                                    rescuedText = sanitizeInternalSynthesisMarkers(rescuedText);
                                    responseResult = {
                                        response: {
                                            text: () => rescuedText,
                                            candidates: [],
                                            functionCalls: () => null
                                        }
                                    };
                                    candidate = null;
                                    calls = null;
                                    break;
                                }
                            }
                        }

                        if (!capturedWidget && isWorkerListIntent) {
                            try {
                                const workersRes = await executeTenshiMcpTool('wappy_consultar_trabajadores', { filtro: 'todos' }, targetUserId);
                                capturedWidget = buildGenerativeWidgetForTool('wappy_consultar_trabajadores', { filtro: 'todos' }, workersRes);
                            } catch (wErr) {
                                logger.warn('[Tenshi Worker Widget Fallback] Error consultando trabajadores:', wErr.message);
                            }
                        }

                        if (!capturedWidget && isInlineWidgetIntent) {
                            const ndMatch = lastUserMsg.match(/deficiencia\s*(?:de\s*|:\s*)?(\d+)/i);
                            const neMatch = lastUserMsg.match(/exposici[oó]n\s*(?:de\s*|:\s*)?(\d+)/i);
                            const ncMatch = lastUserMsg.match(/consecuencia\s*(?:de\s*|:\s*)?(\d+)/i);
                            const isChecklist = lastUserLower.includes('checklist') || lastUserLower.includes('lista de chequeo');
                            capturedWidget = buildGenerativeWidgetForTool(
                                'wappy_renderizar_widget_interactivo',
                                isChecklist
                                    ? { tipo_widget: 'inspection_checklist', titulo: 'Lista de Chequeo Interactiva SG-SST' }
                                    : {
                                          tipo_widget: 'risk_calculator',
                                          titulo: 'Calculadora Interactiva GTC-45',
                                          peligro: lastUserMsg,
                                          nd: ndMatch ? Number(ndMatch[1]) : 6,
                                          ne: neMatch ? Number(neMatch[1]) : 3,
                                          nc: ncMatch ? Number(ncMatch[1]) : 25,
                                      },
                                { ok: true }
                            );
                        }

                        try {
                            responseText = responseResult.response.text();
                        } catch (textErr) {
                            responseText = '';
                        }

                        if (responseText) {
                            // SIEMPRE eliminar bloques wappy-card de Tenshi (Tenshi usa exclusivamente TenshiGenerativeWidget)
                            // y limpiar marcadores internos de síntesis para que jamás se filtren a la UI
                            responseText = sanitizeInternalSynthesisMarkers(
                                responseText
                                    .replace(/```(?:wappy-card|card)[\s\S]*?```/gi, '')
                                    .replace(/en el panel de la derecha|en el panel lateral/gi, 'aquí mismo dentro de nuestro chat')
                            );
                            if (capturedEvidenceFiles.length > 0) {
                                responseText = responseText
                                    .replace(/\[([^\]]+)\]\((?:https?:\/\/[^)\s]+)?\/api\/sgsst\/automatizaciones\/evidencias\/[^)\s]+\)/gi, '$1')
                                    .replace(/(?:https?:\/\/[^\s)]+)?\/api\/sgsst\/automatizaciones\/evidencias\/[^\s)]+/gi, '')
                                    .replace(/\n{3,}/g, '\n\n')
                                    .trim();
                            }
                        }

                        if (!responseText && capturedWidget?.widgetType === 'worker_census') {
                            const d = capturedWidget.data || {};
                            responseText = `¡Listo! Aquí tienes el censo actualizado de colaboradores de la empresa (**${d.totalRegistrados || 0} registrados**: **${d.totalActivos || 0} activos** y **${d.totalRetirados || 0} retirados**). Puedes filtrarlos por las pestañas **Todos**, **Activos** y **Retirados** o buscar por nombre, cédula y cargo directamente en la tarjeta interactiva:`;
                        }

                        if (capturedFlowMarkdown && capturedFlowPublicUrl) {
                            if (responseText && !responseText.includes(capturedFlowPublicUrl)) {
                                responseText = `${responseText.trim()}\n\n${capturedFlowMarkdown}`;
                            } else if (!responseText || !responseText.trim()) {
                                responseText = `¡Listo! He generado tu recurso visual en **Google Flow Studio**:\n\n${capturedFlowMarkdown}`;
                            }
                        }

                        if (responseText) {
                            // Limpiar LaTeX crudo ($6 \times 3 = 18$, \mathbf{450}) para que el texto sea 100% legible
                            responseText = responseText
                                .replace(/\\mathbf\{([^}]+)\}/g, '**$1**')
                                .replace(/\\textbf\{([^}]+)\}/g, '**$1**')
                                .replace(/\\times/g, '×')
                                .replace(/\\div/g, '÷')
                                .replace(/\\rightarrow|\\to/g, '→')
                                .replace(/\$([^$\n]+)\$/g, '$1');
                        }

                        if (!responseText || !responseText.trim()) {
                            const hasGuiAction = Boolean(requestedGuiAction || (requestedGuiActions && requestedGuiActions.length > 0));
                            const hasGeneratedArtifact = Boolean(
                                capturedFile ||
                                capturedHtmlReport ||
                                capturedQrCode ||
                                capturedWidget ||
                                capturedEvidenceFiles.length > 0
                            );
                            if (hasGuiAction) {
                                responseText = requestedGuiAction?.message || "Entendido, procedo a realizar una acción en la pantalla...";
                            } else if (capturedEvidenceFiles.length > 0) {
                                responseText =
                                    capturedEvidenceFiles.length === 1
                                        ? '¡Listo! El certificado oficial fue emitido y ya lo recibiste aquí en tu chat de Tenshi; ya puedes abrirlo o descargarlo.'
                                        : `¡Listo! Los ${capturedEvidenceFiles.length} certificados oficiales fueron emitidos y ya los recibiste aquí en tu chat de Tenshi; ya puedes abrirlos o descargarlos.`;
                            } else if (hasGeneratedArtifact) {
                                responseText = "Listo, he generado el recurso solicitado y ya lo tienes disponible aquí en pantalla.";
                            } else {
                                throw new Error(`El modelo "${currentModel}" devolvió una respuesta vacía sin texto ni acción GUI.`);
                            }
                        }
                        logger.info(`[Tenshi Backend] Final responseText: "${responseText}", guiAction: ${JSON.stringify(requestedGuiAction)}`);
                        lastError = null;
                        succeeded = true;
                        break; // Key rotation done — success
                    } catch (geminiError) {
                        lastError = geminiError;
                        const status = geminiError.status || (geminiError.response && geminiError.response.status) || 0;
                        const msg = (geminiError.message || '').toLowerCase();
                        const attemptElapsedMs = Date.now() - attemptStartMs;

                        // Key rotation: 403 / 429 / leaked / invalid key
                        const isRateLimit = status === 429 || msg.includes('429') ||
                            msg.includes('quota') || msg.includes('rate limit') || msg.includes('too many requests');
                        const isQuotaExceeded = status === 403 || msg.includes('leaked') || msg.includes('forbidden');
                        const isInvalidKey = status === 400 && (msg.includes('api_key_invalid') || msg.includes('api key not valid'));

                        if (isRateLimit || isQuotaExceeded || isInvalidKey) {
                            logger.warn(`[Tenshi] Clave #${keyIdx + 1} rechazada (${status || 'quota'}) tras ${attemptElapsedMs}ms. Rotando clave de inmediato...`);
                            continue; // Try next key on same model immediately
                        }

                        // Model fallback: 503 / 504 / 404 / overloaded / deadline exceeded / not found / high demand
                        const is503 =
                            status === 503 ||
                            status === 504 ||
                            Boolean(geminiError.isTimeout) ||
                            msg.includes('503') ||
                            msg.includes('504') ||
                            msg.includes('overloaded') ||
                            msg.includes('service unavailable') ||
                            msg.includes('deadline_exceeded') ||
                            msg.includes('gateway timeout') ||
                            msg.includes('high demand');
                        const is404 = status === 404 || msg.includes('404') || msg.includes('not found') || msg.includes('is not found for api version');

                        if (is503) {
                            saw503InPass = true;
                            if (isPrimaryModel) {
                                primaryTransientFailures++;
                                if (geminiError.isTimeout || status === 504) {
                                    primaryTimeoutFailures++;
                                }
                                const maxKeysForPrimary =
                                    primaryTimeoutFailures > 0
                                        ? Math.min(2, apiKeys.length)
                                        : Math.min(3, apiKeys.length);
                                const withinWallBudget = Date.now() - rotationStartMs < MAX_ROTATION_WALL_MS;
                                if (
                                    i + 1 < apiKeys.length &&
                                    primaryTransientFailures < maxKeysForPrimary &&
                                    withinWallBudget
                                ) {
                                    logger.warn(
                                        `[Tenshi] Modelo prioritario "${currentModel}" (pasada #${pass503Index + 1}, clave #${keyIdx + 1}) falló tras ${attemptElapsedMs}ms (${status || '503'} - ${geminiError.message}). Probando otra clave del pool de inmediato antes de bajar a modelos secundarios...`
                                    );
                                    continue; // Failover inmediato a la siguiente clave en gemini-3.5-flash-lite sin dormir
                                }
                            }
                            logger.warn(
                                `[Tenshi] Modelo "${currentModel}" (pasada #${pass503Index + 1}, clave #${keyIdx + 1}) recibió ${geminiError.isTimeout ? 'timeout 504' : `503 (${status || '503'})`} tras ${attemptElapsedMs}ms (${geminiError.message}). Rotando de inmediato al siguiente modelo...`
                            );
                            break; // Failover inmediato sin sleep bloqueante de 900ms
                        }

                        sawNon503InPass = true;

                        if (is404) {
                            logger.warn(`[Tenshi] Modelo "${currentModel}" no encontrado (${status || '404'} - ${geminiError.message}). Cambiando a modelo fallback...`);
                            break;
                        }

                        logger.warn(`[Tenshi] Error con modelo "${currentModel}" y clave #${keyIdx + 1} tras ${attemptElapsedMs}ms: ${geminiError.message}. Probando siguiente modelo...`);
                        break;
                    }
                }

                const totalRotationElapsedMs = Date.now() - rotationStartMs;
                if (
                    !succeeded &&
                    mi === modelFallbacks.length - 1 &&
                    pass503Index === 0 &&
                    saw503InPass &&
                    !sawNon503InPass &&
                    totalRotationElapsedMs < 30000
                ) {
                    pass503Index = 1;
                    saw503InPass = false;
                    sawNon503InPass = false;
                    keyRotationOffset = apiKeys.length > 1 ? Math.min(2, apiKeys.length - 1) : 0;
                    logger.warn(
                        `[Tenshi] Los ${modelFallbacks.length} modelos devolvieron 503 en la 1ra pasada (${totalRotationElapsedMs}ms). Iniciando 2da pasada rápida (400ms) con otra clave del pool (#${keyRotationOffset + 1}/${apiKeys.length})...`
                    );
                    await new Promise((r) => setTimeout(r, 400));
                    mi = -1;
                }
            }

            // [Tenshi 503 Rescue — Prioridad #1: Generación Determinista de Imagen/Video (Antigravity -> Google Flow)]
            // Se ejecuta ANTES del rescate de flujos SG-SST/ARL para que un pedido visual NUNCA caiga por error a un flujo de portales.
            const lastUserMessageTextForRescue = String(lastMsgObj?.content || userQuery || '').trim();
            if (!succeeded && lastError && !directMediaAttempted && !isGuiResultTurn && !isPureGreeting && allowVisualMediaFastPath) {
                const rescueMediaIntent = detectVisualMediaGenerationIntent(
                    lastUserMessageTextForRescue,
                    messages,
                    {
                        allowCompound: true,
                        hasCurrentAttachment: currentTurnHasAttachments,
                    }
                );
                if (rescueMediaIntent) {
                    directMediaAttempted = true;
                    logger.warn(
                        `[Tenshi 503 Rescue] Ráfaga 503/timeout detectada (${lastError?.message}). Ejecutando rescate visual directo (${rescueMediaIntent.isVideo ? 'video' : 'imagen'}, recuperadoHistorial=${rescueMediaIntent.recoveredFromHistory}, prompt="${rescueMediaIntent.prompt.slice(0, 120)}")...`
                    );
                    try {
                        const mediaOut = await executeDirectFlowMediaForTenshi({
                            isVideo: rescueMediaIntent.isVideo,
                            prompt: rescueMediaIntent.prompt,
                            aspectRatio: rescueMediaIntent.aspectRatio,
                            style: rescueMediaIntent.style,
                            cameraMotion: rescueMediaIntent.cameraMotion,
                            skipAntigravity: !allowAntigravityMedia || rescueMediaIntent.skipAntigravity,
                            userId: targetUserId,
                            companyId: activeCompanyIdStr,
                        });
                        capturedHtmlReport = mediaOut.studioHtml;
                        capturedFile = mediaOut.fileObj;
                        capturedFlowMarkdown = mediaOut.flowMd;
                        capturedFlowPublicUrl = mediaOut.publicUrl;
                        responseText = mediaOut.responseText;
                        succeeded = true;
                        lastError = null;
                        logger.info(
                            `[Tenshi 503 Rescue] ✅ Rescate visual completado con ${mediaOut.engineLabel}: ${mediaOut.publicUrl}`
                        );
                    } catch (mediaRescueErr) {
                        const realCause = String(
                            mediaRescueErr?.message || 'Error desconocido en los motores de generación visual.'
                        ).trim();
                        logger.warn(
                            `[Tenshi 503 Rescue] ❌ Falló rescate visual (Antigravity y Google Flow): ${realCause}`
                        );
                        responseText =
                            `⚠️ No fue posible generar ${rescueMediaIntent.isVideo ? 'el video' : 'la imagen'} en este momento.\n\n` +
                            `**Motivo técnico real:** ${realCause}\n\n` +
                            `💡 Verifica que **Google Antigravity** esté conectado o que tu sesión de **Google Flow** esté activa en **Mi Cuenta → Integraciones** (o reformula la escena con un enfoque técnico preventivo).`;
                        succeeded = true;
                        lastError = null;
                    }
                }
            }

            // [Tenshi 503 Rescue — Prioridad #2: Flujos Tenshi con Validación Textual Estricta Anti-Falsos Positivos]
            if (!succeeded && lastError && !isPureGreeting && capturedEvidenceFiles.length === 0) {
                try {
                    const tenshiFlowSvc = require('~/server/services/tenshiFlowService');
                    const getActiveTenshiFlows =
                        tenshiFlowSvc.getActiveTenshiFlows || tenshiFlowSvc.listActiveTenshiFlows;
                    const {
                        matchTenshiFlowByQuery,
                        executeTenshiFlowInstant,
                        resolveStrictExecutionContext,
                    } = tenshiFlowSvc;
                    const lastUserMessageText = lastUserMessageTextForRescue;
                    const attachedForRescue = req.__tenshiAttachedMedia || resolvedAttachedMedia || null;
                    const attachedNamesForRescue = Array.isArray(req.__tenshiAttachedMediaList) && req.__tenshiAttachedMediaList.length > 0
                        ? req.__tenshiAttachedMediaList.map((a) => a?.name || '').filter(Boolean).join(' ')
                        : attachedForRescue?.name || '';

                    if (
                        typeof getActiveTenshiFlows === 'function' &&
                        typeof executeTenshiFlowInstant === 'function' &&
                        (lastUserMessageText || attachedForRescue)
                    ) {
                        const activeTenshiFlows = await getActiveTenshiFlows();
                        if (Array.isArray(activeTenshiFlows) && activeTenshiFlows.length > 0) {
                            let matchedFlow = null;
                            let matchRes = null;
                            if (lastUserMessageText && typeof matchTenshiFlowByQuery === 'function') {
                                matchRes = await matchTenshiFlowByQuery(lastUserMessageText, activeTenshiFlows);
                                matchedFlow = matchRes?.flow || (matchRes?._id ? matchRes : null);
                            }
                            if (
                                !matchedFlow &&
                                attachedForRescue &&
                                /\b(incapacidad|forense|audita|auditor[ií]a|verifica|verificar|revisa|revisar|autenticidad|falso|adulterad|certificado|soporte|m[eé]dic[oa]|eps)\b/i.test(
                                    `${lastUserMessageText} ${attachedNamesForRescue}`
                                )
                            ) {
                                matchedFlow =
                                    activeTenshiFlows.find(
                                        (f) =>
                                            f?.key === 'tenshi_flow_auditoria_forense_incapacidad' ||
                                            f?.presetKey === 'tenshi_flow_auditoria_forense_incapacidad' ||
                                            f?.systemPresetKey === 'tenshi_flow_auditoria_forense_incapacidad' ||
                                            /forense|incapacidad/i.test(String(f?.name || ''))
                                    ) || null;
                                if (matchedFlow) {
                                    matchRes = {
                                        flow: matchedFlow,
                                        matchSource: 'forensic_attachment_guard',
                                        score: 95,
                                    };
                                }
                            }

                            if (matchedFlow && matchedFlow._id) {
                                const rescueValidation = isFlowMatchValidatedFor503Rescue({
                                    flow: matchedFlow,
                                    matchRes,
                                    userText: lastUserMessageText,
                                    attachedMedia: attachedForRescue,
                                    attachedNames: attachedNamesForRescue,
                                });
                                if (!rescueValidation.allowed) {
                                    logger.info(
                                        `[Tenshi 503 Rescue] Descartado posible falso positivo de Flujo Tenshi "${matchedFlow.name}" (source=${matchRes?.matchSource || 'unknown'}, score=${matchRes?.score ?? 'n/a'}, motivo=${rescueValidation.reason}) para mensaje: "${lastUserMessageText.slice(0, 120)}"`
                                    );
                                    matchedFlow = null;
                                }
                            }

                            if (matchedFlow && matchedFlow._id) {
                                logger.warn(
                                    `[Tenshi 503 Rescue] Ráfaga 503 detectada (${lastError?.message}). Ejecutando rescate determinista validado con Flujo Tenshi "${matchedFlow.name}" (source=${matchRes?.matchSource || 'unknown'}, score=${matchRes?.score ?? 'n/a'})...`
                                );
                                const strictCtx =
                                    typeof resolveStrictExecutionContext === 'function'
                                        ? await resolveStrictExecutionContext({ reqUser: req.user, reqObj: req })
                                        : {
                                              callerUserId: String(req.user?.id || req.user?._id || targetUserId),
                                              tenantOwnerUserId: String(targetUserId),
                                              companyId: companyInfo?._id ? String(companyInfo._id) : req.companyId,
                                              companyName: companyInfo?.companyName || '',
                                              companyDoc: companyInfo || null,
                                          };

                                if (strictCtx && strictCtx.companyId && !strictCtx.error) {
                                    const rescueOut = await executeTenshiFlowInstant({
                                        flow: matchedFlow,
                                        context: strictCtx,
                                        userId: String(targetUserId),
                                        companyId: String(strictCtx.companyId),
                                        automationId: matchedFlow._id,
                                        userInstruction: lastUserMessageText || matchedFlow.name,
                                        attachedMedia: attachedForRescue,
                                        waitTimeoutMs: 60000,
                                        triggerSource: 'tenshi_503_rescue',
                                    });

                                    const rescueEvidences = Array.isArray(rescueOut?.evidenceFiles)
                                        ? rescueOut.evidenceFiles
                                        : Array.isArray(rescueOut?.evidencias)
                                          ? rescueOut.evidencias
                                          : [];
                                    if (rescueEvidences.length > 0) {
                                        capturedEvidenceFiles = mergeSanitizedEvidenceFiles(
                                            capturedEvidenceFiles,
                                            rescueEvidences
                                        );
                                    }

                                    const cleanRescueText = String(
                                        rescueOut?.resultText || rescueOut?.summary || ''
                                    )
                                        .replace(/\[([^\]]+)\]\((?:https?:\/\/[^)\s]+)?\/api\/sgsst\/automatizaciones\/evidencias\/[^)\s]+\)/gi, '$1')
                                        .replace(/(?:https?:\/\/[^\s)]+)?\/api\/sgsst\/automatizaciones\/evidencias\/[^\s)]+/gi, '')
                                        .replace(/\n{3,}/g, '\n\n')
                                        .trim();

                                    if (cleanRescueText || capturedEvidenceFiles.length > 0) {
                                        responseText =
                                            cleanRescueText ||
                                            (capturedEvidenceFiles.length === 1
                                                ? '✅ El certificado oficial fue emitido y ya lo recibiste aquí mismo en tu chat de Tenshi; ya puedes abrirlo o descargarlo.'
                                                : `✅ Los ${capturedEvidenceFiles.length} certificados oficiales fueron emitidos y ya los recibiste aquí mismo en tu chat de Tenshi; ya puedes abrirlos o descargarlos.`);
                                        succeeded = true;
                                        lastError = null;
                                        logger.info(
                                            `[Tenshi 503 Rescue] Rescate determinista completado para "${matchedFlow.name}" (evidencias=${capturedEvidenceFiles.length}).`
                                        );
                                    }
                                }
                            }
                        }
                    }
                } catch (rescueErr) {
                    logger.warn(`[Tenshi 503 Rescue] Falló rescate determinista de Flujo Tenshi: ${rescueErr?.message || rescueErr}`);
                }
            }

            if (!succeeded && lastError) {
                if (capturedEvidenceFiles.length > 0) {
                    responseText =
                        capturedEvidenceFiles.length === 1
                            ? '✅ El certificado oficial fue emitido y ya lo recibiste aquí mismo en tu chat de Tenshi; ya puedes abrirlo o descargarlo.'
                            : `✅ Los ${capturedEvidenceFiles.length} certificados oficiales fueron emitidos y ya los recibiste aquí mismo en tu chat de Tenshi; ya puedes abrirlos o descargarlos.`;
                } else if (capturedFile || capturedHtmlReport) {
                    responseText = `✅ He recuperado el **${capturedFile?.title || 'Informe Oficial SG-SST'}** y ya lo tienes disponible aquí mismo en nuestro chat para abrirlo o descargarlo.`;
                } else {
                    throw new Error(`El servicio de IA experimenta alta demanda en este momento. Por favor intenta nuevamente en unos segundos.`);
                }
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

        const lastUserText = (messages[messages.length - 1]?.content || '').trim();
        const lastUserLower = lastUserText.toLowerCase();
        if (
            !requestedGuiAction &&
            (!requestedGuiActions || requestedGuiActions.length === 0) &&
            !lastUserText.startsWith('[RESULTADO_GUI]') &&
            /\b(estudio\s+de\s+puesto|evaluaci[oó]n\s+ergon[oó]mica|an[aá]lisis\s+ergon[oó]mico|an[aá]lisis\s+biomec[aá]nico|estudio\s+ergon[oó]mico|inspecci[oó]n\s+ergon[oó]mica|puesto\s+de\s+trabajo\s+ergon[oó]mico)/i.test(lastUserLower) &&
            /\b(necesito|quiero|deseo|hacer|realizar|iniciar|empezar|hazme|hagamos|ll[eé]vame|abrir|abre|en\s+vivo|con\s+la\s+fisio)/i.test(lastUserLower)
        ) {
            requestedGuiAction = {
                name: 'wappy_iniciar_estudio_ergonomico_vivo',
                accion: 'iniciar_estudio_ergonomico_vivo',
                args: {}
            };
        }

        if (requestedGuiAction?.name === 'wappy_iniciar_estudio_ergonomico_vivo') {
            responseText = '¡De una! Te llevo en este instante al **Análisis Biomecánico y Estudio de Puesto de Trabajo Ergonómico en Vivo** con nuestra **Fisioterapeuta Laboral** (con cámara, exoesqueleto MediaPipe 3D y protocolo de 3 fases). Al finalizar la evaluación, el informe técnico oficial quedará tanto en el chat principal como aquí mismo en tu chat de Tenshi listo para ver en pantalla o descargar.';
        } else if (requestedGuiAction?.name === 'wappy_abrir_chat_agente') {
            const specLabel = requestedGuiAction.args?.agente || 'el Agente Especialista';
            responseText = `¡De una! Te abro en este instante el chat dedicado en pantalla con **${specLabel}** y le envío tu consulta técnica estructurada.`;
        }

        const oneShotGuiActionNames = new Set([
            'wappy_iniciar_estudio_ergonomico_vivo',
            'wappy_abrir_chat_agente',
            'wappy_navegar',
            'wappy_abrir_curso',
            'wappy_abrir_articulo_blog',
            'wappy_diligenciar_formulario',
            'wappy_controlar_videollamada',
            'wappy_activar_herramienta_agente',
        ]);
        const guiActionName = requestedGuiAction?.name || requestedGuiAction?.action || '';
        const allQueuedGuiActionsAreOneShot =
            !Array.isArray(requestedGuiActions) ||
            requestedGuiActions.length === 0 ||
            requestedGuiActions.every((a) => oneShotGuiActionNames.has(a?.name || a?.action || ''));

        if (
            responseText &&
            (!requestedGuiAction || oneShotGuiActionNames.has(guiActionName)) &&
            allQueuedGuiActionsAreOneShot
        ) {
            await TenshiMessage.create({
                user: req.user.id,
                companyId: activeCompanyIdForConvo,
                conversationId: activeTenshiConvoId,
                role: 'assistant',
                content: responseText,
                htmlReport: capturedHtmlReport || undefined,
                qrCode: capturedQrCode || undefined,
                file: capturedFile || undefined,
                widget: capturedWidget || undefined,
                ...(capturedEvidenceFiles.length > 0 ? { evidenceFiles: capturedEvidenceFiles } : {}),
            })
                .then(() => {
                    if (activeTenshiConvoId) {
                        TenshiConversation.updateOne(
                            { _id: activeTenshiConvoId },
                            { $set: { lastMessageAt: new Date() }, $inc: { messageCount: 1 } }
                        ).catch(() => {});
                    }
                })
                .catch(e => console.error('Error saving assistant TenshiMessage:', e));
        }

        // Enviar respuesta HTTP INMEDIATAMENTE tras guardar TenshiMessage para evitar bloqueos por tareas secundarias
        // o hooks de indexación de Conversation/Message (ej. mongoMeili post('updateOne')).
        if (!res.headersSent) {
            res.json({
                response: responseText,
                conversationId: activeTenshiConvoId,
                conversationTitle: activeTenshiConvoTitle,
                htmlReport: capturedHtmlReport,
                qrCode: capturedQrCode,
                file: capturedFile,
                widget: capturedWidget,
                evidenceFiles: capturedEvidenceFiles,
                delegatedOrder: capturedDelegatedOrder,
                guiAction: requestedGuiAction,
                guiActions: requestedGuiActions
            });
        }

        // Hook turn_finalizer (Auto-Aprendizaje de Habilidades en segundo plano con 0ms de impacto)
        if (lastUserText && targetUserId && !lastUserText.startsWith('[RESULTADO_GUI]')) {
            setImmediate(() => {
                autoSynthesizeProceduralRule(
                    lastUserText,
                    targetUserId,
                    companyInfo?._id || null,
                    companyInfo?.companyName || ''
                ).catch((err) => {
                    logger.warn('[Tenshi Route] autoSynthesizeProceduralRule background error:', err?.message || err);
                });
            });
        }

        // Respaldo simultáneo en el Chat del Agente Tenshi si se generó un archivo o reporte (asíncrono no-bloqueante)
        if ((capturedFile || capturedHtmlReport) && req.user?.id) {
            const syncUserId = String(req.user.id);
            const syncCompanyId = companyInfo?._id || null;
            const syncCapturedFile = capturedFile ? { ...capturedFile } : null;
            const syncCapturedHtmlReport = capturedHtmlReport;
            const syncResponseText = responseText || '';

            setImmediate(async () => {
                try {
                    const { Conversation, Message } = require('~/db/models');
                    const { v4: uuidv4 } = require('uuid');
                    const TENSHI_AGENT_ID = '3579240c-ac93-4f4f-b0e4-95d87fc1ee27';
                    const fileTitle = syncCapturedFile?.title || 'Informe Técnico SG-SST';

                    const tenshiConvo = await Conversation.findOne({
                        user: syncUserId,
                        agent_id: TENSHI_AGENT_ID,
                    })
                        .sort({ updatedAt: -1 })
                        .lean();

                    const convoId = tenshiConvo ? tenshiConvo.conversationId : uuidv4();

                    if (!tenshiConvo) {
                        await Conversation.create({
                            conversationId: convoId,
                            user: syncUserId,
                            title: fileTitle,
                            endpoint: 'agents',
                            agent_id: TENSHI_AGENT_ID,
                            tags: [
                                'tenshi-report',
                                'sgsst',
                                ...(syncCompanyId ? [`company-${String(syncCompanyId)}`] : []),
                            ],
                            createdAt: new Date(),
                            updatedAt: new Date(),
                        });
                    } else {
                        // Usar collection.updateOne para evitar el deadlock del hook post('updateOne') de mongoMeili
                        // (en query middleware doc es UpdateWriteOpResult sin .postUpdateHook y nunca invoca next()).
                        await Conversation.collection.updateOne(
                            { conversationId: convoId },
                            { $set: { title: fileTitle, updatedAt: new Date() } }
                        );
                    }

                    const fileLabel = syncCapturedFile?.fileType === 'html' ? 'Aplicativo / Reporte HTML' : 'Documento SG-SST';
                    await Message.create({
                        messageId: uuidv4(),
                        conversationId: convoId,
                        user: syncUserId,
                        sender: 'Tenshi',
                        text: `📁 **${fileLabel} generado**: *${fileTitle}*\n\n${syncResponseText}\n\nPuedes visualizarlo o descargarlo desde Canvas.`,
                        isCreatedByUser: false,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    });

                    await CanvasSession.findOneAndUpdate(
                        { conversationId: convoId },
                        {
                            $set: {
                                user: syncUserId,
                                ...(syncCompanyId ? { companyId: syncCompanyId } : {}),
                                title: fileTitle,
                                fileType: syncCapturedFile?.fileType || 'html',
                                content: syncCapturedFile?.rawContent ?? syncCapturedFile?.content ?? syncCapturedHtmlReport ?? '',
                                updatedAt: new Date(),
                            },
                            $setOnInsert: {
                                createdAt: new Date(),
                                version: 1,
                            }
                        },
                        { upsert: true, new: true }
                    );
                } catch (syncErr) {
                    logger.warn('[Tenshi Route] Could not sync file to Agent Tenshi conversation:', syncErr?.message || syncErr);
                }
            });
        }
    } catch (error) {
        console.error('CRITICAL Error in Tenshi chat route:', error);
        if (error.response) {
            console.error('Error response data:', error.response.data);
        }
        if (!res.headersSent) {
            res.status(500).json({ error: 'Error generating Tenshi response', details: error.message });
        }
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

// ============================================================================
// PUENTE PERMANENTE PARA TENSHI EN CELULAR (https://wappy.club/wappydots)
// ============================================================================
let wappydotsTunnelState = {
  active: false,
  publicUrl: null,
  lanUrl: 'http://127.0.0.1:3001',
  startedAt: null,
  updatedAt: null,
};

async function loadPersistedWappydotsTunnelState() {
  if (wappydotsTunnelState.publicUrl) {
    return wappydotsTunnelState;
  }
  try {
    if (mongoose.connection && mongoose.connection.db) {
      const doc = await mongoose.connection.db
        .collection('wappydots_tunnel_state')
        .findOne({ _id: 'primary_mac_tunnel' });
      if (doc && doc.publicUrl) {
        wappydotsTunnelState = {
          active: Boolean(doc.active),
          publicUrl: doc.publicUrl,
          lanUrl: doc.lanUrl || 'http://127.0.0.1:3001',
          startedAt: doc.startedAt || null,
          updatedAt: doc.updatedAt || null,
        };
      }
    }
  } catch (_e) {
    // ignore
  }
  return wappydotsTunnelState;
}

/**
 * POST /api/tenshi/wappydots-link
 * Recibe desde la Mac (cloudflare-tunnel.ts) la URL activa del túnel de Tenshi
 */
router.post('/wappydots-link', async (req, res) => {
  try {
    const { publicUrl, lanUrl, active, startedAt, updatedAt } = req.body || {};
    const cleanPublic = typeof publicUrl === 'string' && publicUrl.trim()
      ? publicUrl.trim().replace(/\/$/, '')
      : wappydotsTunnelState.publicUrl;
    const cleanLan = typeof lanUrl === 'string' && lanUrl.trim()
      ? lanUrl.trim().replace(/\/$/, '')
      : wappydotsTunnelState.lanUrl;

    wappydotsTunnelState = {
      active: active !== undefined ? Boolean(active) : Boolean(cleanPublic),
      publicUrl: cleanPublic || null,
      lanUrl: cleanLan || 'http://127.0.0.1:3001',
      startedAt: startedAt || wappydotsTunnelState.startedAt || new Date().toISOString(),
      updatedAt: updatedAt || new Date().toISOString(),
    };

    if (mongoose.connection && mongoose.connection.db) {
      await mongoose.connection.db
        .collection('wappydots_tunnel_state')
        .updateOne(
          { _id: 'primary_mac_tunnel' },
          { $set: { ...wappydotsTunnelState } },
          { upsert: true },
        )
        .catch(() => {});
    }

    return res.json({
      ok: true,
      permanentUrl: 'https://wappy.club/wappydots',
      ...wappydotsTunnelState,
    });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
});

/**
 * GET /api/tenshi/wappydots-link
 * Devuelve la URL activa del túnel para que https://wappy.club/wappydots se conecte automáticamente
 */
router.get('/wappydots-link', async (_req, res) => {
  const state = await loadPersistedWappydotsTunnelState();
  return res.json({
    ok: true,
    permanentUrl: 'https://wappy.club/wappydots',
    ...state,
    directMobileUrl: state.publicUrl ? `${state.publicUrl}/wappydots` : `${state.lanUrl}/wappydots`,
  });
});

/**
 * ALL /api/tenshi/wappydots-proxy/*
 * Proxy de respaldo hacia el túnel activo de la Mac para evitar bloqueos de red móvil
 */
router.all('/wappydots-proxy/*', async (req, res) => {
  try {
    const state = await loadPersistedWappydotsTunnelState();
    const targetBase = state.publicUrl || state.lanUrl;
    if (!targetBase) {
      return res.status(503).json({
        ok: false,
        error: 'El túnel de Wappy Dots en tu Mac aún no ha reportado su enlace activo.',
      });
    }
    const subPath = req.params[0] || '';
    const queryString = req.originalUrl.includes('?')
      ? req.originalUrl.slice(req.originalUrl.indexOf('?'))
      : '';
    const targetUrl = `${targetBase.replace(/\/$/, '')}/${subPath.replace(/^\//, '')}${queryString}`;

    const isBinaryFile = subPath.includes('files/') || /\.(pdf|docx|xlsx|png|jpg|jpeg|zip)$/i.test(subPath);
    const upstreamRes = await axios({
      method: req.method,
      url: targetUrl,
      data: ['POST', 'PUT', 'PATCH'].includes(req.method.toUpperCase()) ? req.body : undefined,
      headers: {
        'Content-Type': req.headers['content-type'] || 'application/json',
        Authorization: req.headers.authorization || 'Bearer wappy-tunnel',
      },
      responseType: isBinaryFile ? 'arraybuffer' : 'json',
      timeout: 90000,
      validateStatus: () => true,
    });

    if (upstreamRes.headers['content-type']) {
      res.setHeader('Content-Type', upstreamRes.headers['content-type']);
    }
    if (upstreamRes.headers['content-disposition']) {
      res.setHeader('Content-Disposition', upstreamRes.headers['content-disposition']);
    }
    return res.status(upstreamRes.status).send(upstreamRes.data);
  } catch (error) {
    return res.status(502).json({
      ok: false,
      error: `Error conectando con el túnel de tu Mac: ${error.message}`,
    });
  }
});

/**
 * POST /api/tenshi/transcribe-dictation
 * Arquitectura Wappy Dots en 4 pasos para transcripción multimodal de dictado con el Pool de 6 Claves Gemini:
 * 1. Recibe el audio grabado (audioBase64 o pcmChunksBase64 a 16kHz).
 * 2. Construye un WAV mono ligero a 16 kHz y verifica el filtro de silencio RMS (rms >= 0.0025).
 * 3. Inyecta el Diccionario Personalizado WAPPY (Tenshi, Antigravity, SG-SST, GTC 45, PESV, etc.) y llama a
 *    gemini-3.5-flash-lite (con rotación automática a gemini-3.8-flash y gemini-3.6-flash entre las 6 claves API).
 * 4. Devuelve el texto limpio, sin muletillas y con puntuación perfecta en español.
 */
router.post('/transcribe-dictation', requireJwtAuth, async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const {
      audioBase64,
      pcmChunksBase64,
      mimeType = 'audio/wav',
      fallbackText = '',
      customVocabulary = [],
    } = req.body || {};

    const { generateWithKeyRotation } = require('./sgsst/sgsstGemini');
    const {
      build16kMonoWavFromPcmChunks,
      applyDomainPhoneticCorrections,
      WAPPY_DICTATION_CUSTOM_VOCABULARY,
    } = require('./voice/voiceSession');

    let finalMimeType = mimeType || 'audio/wav';
    let finalAudioBase64 = typeof audioBase64 === 'string' ? audioBase64.replace(/^data:audio\/[^;]+;base64,/, '') : '';

    if (Array.isArray(pcmChunksBase64) && pcmChunksBase64.length > 0) {
      const pcmBuffers = pcmChunksBase64
        .filter((c) => typeof c === 'string' && c.length > 0)
        .map((c) => Buffer.from(c, 'base64'));
      const wavInfo = build16kMonoWavFromPcmChunks(pcmBuffers);
      if (wavInfo.silent || !wavInfo.wavBase64) {
        return res.json({ ok: true, text: '', silent: true, rms: wavInfo.rms });
      }
      finalAudioBase64 = wavInfo.wavBase64;
      finalMimeType = 'audio/wav';
    } else if (finalAudioBase64 && finalMimeType === 'audio/pcm') {
      const wavInfo = build16kMonoWavFromPcmChunks([Buffer.from(finalAudioBase64, 'base64')]);
      if (wavInfo.silent || !wavInfo.wavBase64) {
        return res.json({ ok: true, text: '', silent: true, rms: wavInfo.rms });
      }
      finalAudioBase64 = wavInfo.wavBase64;
      finalMimeType = 'audio/wav';
    }

    if (!finalAudioBase64 && !fallbackText) {
      return res.json({ ok: true, text: '', silent: true });
    }

    const vocabWords = [
      ...WAPPY_DICTATION_CUSTOM_VOCABULARY,
      ...(Array.isArray(customVocabulary) ? customVocabulary : []),
      ...(req.user?.name ? [req.user.name] : []),
    ].filter(Boolean);
    const vocabPrompt = `\nDiccionario de palabras clave y nombres propios a priorizar si suenan parecido: ${vocabWords.join(', ')}.`;

    const systemPrompt =
      `Eres el motor de transcripción de voz de ultra-alta precisión de WAPPY IA y Tenshi (estilo Wispr Flow / Wappy Dots). ` +
      `Tu única tarea es escuchar el archivo de audio adjunto y devolver EXACTAMENTE lo que el usuario dijo en español, ` +
      `con ortografía perfecta, signos de interrogación/exclamación correctos (¿...?, ¡...!), comas, puntos y mayúsculas adecuadas. ` +
      `Elimina muletillas involuntarias ('eh', 'este', 'mmm') o falsos comienzos tartamudeados, pero conserva el 100% del mensaje real. ` +
      `REGLA ANTI-ALUCINACIÓN ESTRICTA: Si en el audio NO hay ninguna voz humana clara hablando (solo silencio, respiración, soplidos, clics o ruido de fondo ininteligible), ` +
      `devuelve única y exclusivamente la palabra: __SILENCIO__ (ten absolutamente prohibido inventar saludos, preguntas o frases que no estén en el audio). ` +
      `NO respondas a la pregunta del usuario ni agregues comentarios: devuelve SOLO el texto transcrito.` +
      vocabPrompt;

    const userPrompt = fallbackText
      ? `Transcribe el audio adjunto con puntuación perfecta. Borrador fonético orientativo (puede tener errores; guíate por el audio): "${fallbackText}". Devuelve SOLO la transcripción final:`
      : `Transcribe el audio adjunto con puntuación perfecta. Devuelve SOLO la transcripción final:`;

    const parts = finalAudioBase64
      ? [
          {
            inlineData: {
              mimeType: finalMimeType,
              data: finalAudioBase64,
            },
          },
          { text: userPrompt },
        ]
      : [{ text: userPrompt }];

    const result = await generateWithKeyRotation(
      'gemini-3.5-flash-lite',
      userId,
      parts,
      {
        systemInstruction: systemPrompt,
        generationConfig: { maxOutputTokens: 400, temperature: 0.1 },
      }
    );

    const rawOut = (result?.response?.text?.() || '')
      .replace(/^["'«»]+|["'«»]+$/g, '')
      .trim();

    if (
      !rawOut ||
      /(__SILENCIO__|\[DESCARTAR\]|sin\s+audio|no\s+hay\s+voz)/i.test(rawOut)
    ) {
      return res.json({ ok: true, text: '', silent: true });
    }

    const cleaned = applyDomainPhoneticCorrections(rawOut).trim();
    return res.json({
      ok: true,
      text: cleaned,
      model: 'gemini-3.5-flash-lite',
    });
  } catch (err) {
    logger.error('[Tenshi Dictation] Error in /transcribe-dictation:', err);
    return res.status(500).json({
      ok: false,
      error: err.message || 'Error procesando dictado multimodal',
    });
  }
});

module.exports = router;
