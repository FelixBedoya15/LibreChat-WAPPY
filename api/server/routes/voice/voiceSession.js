const buf = require('buffer');
if (!buf.SlowBuffer) buf.SlowBuffer = buf.Buffer;
const WebSocket = require('ws');
const logger = require('~/config/winston');
const GeminiLiveClient = require('./geminiLive');
const { getUserKey } = require('~/server/services/UserService');
const geminiPoolManager = require('~/server/services/GeminiPoolManager');
const { EModelEndpoint } = require('librechat-data-provider');
const { saveMessage, saveConvo, getMessages, updateMessage, getAllUserMemories, setMemory, deleteMemory } = require('~/models');
const { v4: uuidv4 } = require('uuid');
const { generateWithKeyRotation, SGSST_FALLBACK_MODELS, LIVE_FALLBACK_MODELS } = require('../sgsst/sgsstGemini');
const mongoose = require('mongoose');
const CompanyInfo = require('~/models/CompanyInfo');
const TenshiMessage = require('~/models/TenshiMessage');
const TenshiUserAvatar = require('~/models/TenshiUserAvatar');
const { Course } = require('~/models/Course');
const { BlogPost } = require('~/models/BlogPost');
const { syncCompanyMemory } = require('../sgsst/companyInfo');
const { buildSignatureSection, buildStandardHeader, buildWorkerSubHeader } = require('../sgsst/reportHeader');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const SKILLS_DIR = path.resolve(__dirname, '../../../config/skills');
const { resolveInspectionProtocol, INSPECTION_PROTOCOLS } = require('./inspectionProtocols');
const {
    executeTenshiMcpTool,
    TOOL_ROUTES,
    isNotebookLmAuthError,
    markNotebookSessionInvalid,
} = require('./tenshiMcpDispatcher');
const { buildTenshiFlowsPromptBlock } = require('~/server/services/tenshiFlowService');
const {
    isGovernedTool,
    stageGovernedAction,
    buildGenerativeWidgetForTool,
    manageProceduralMemory,
    getProceduralMemoryPromptBlock,
    autoSynthesizeProceduralRule,
    searchInstantHistory,
} = require('./tenshiOpenBotEngine');

let cachedGetLatestSystemActivity = null;
function resolveGetLatestSystemActivity() {
    if (typeof cachedGetLatestSystemActivity === 'function') {
        return cachedGetLatestSystemActivity;
    }
    try {
        const mod = require('~/server/services/systemActivityService');
        if (typeof mod?.getLatestSystemActivity === 'function') {
            cachedGetLatestSystemActivity = mod.getLatestSystemActivity;
            return cachedGetLatestSystemActivity;
        }
    } catch (_err) {
        // Servicio en carga paralela o no disponible aún
    }
    return null;
}

let cachedWorkflowNodesDocsMod = null;
function safeGetWorkflowNodesOverviewPromptBlock() {
    try {
        if (!cachedWorkflowNodesDocsMod) {
            try {
                cachedWorkflowNodesDocsMod = require('~/server/services/workflowNodesDocumentationService');
            } catch (_e1) {
                cachedWorkflowNodesDocsMod = require('../../services/workflowNodesDocumentationService');
            }
        }
        if (typeof cachedWorkflowNodesDocsMod?.getWorkflowNodesOverviewPromptBlock === 'function') {
            return String(cachedWorkflowNodesDocsMod.getWorkflowNodesOverviewPromptBlock() || '').trim();
        }
    } catch (_err) {
        // Servicio en carga paralela o en frío; jamás lanzar excepción
    }
    return '';
}

const LIVE_KEY_COOLDOWN_MS = 15 * 60 * 1000;
const liveQuotaCooldowns = new Map();

function isVoiceKeyCooledDown(key) {
    if (!key) return true;
    const expiry = liveQuotaCooldowns.get(key);
    if (!expiry) return false;
    if (Date.now() >= expiry) {
        liveQuotaCooldowns.delete(key);
        return false;
    }
    return true;
}

function markVoiceKeyCooldown(key, reason = '') {
    if (!key) return;
    const msg = String(reason || '');
    if (/1011|quota|exceeded|resource_exhausted|rate[\s_-]?limit|too many requests|leaked|api[\s_-]?key[\s_-]?invalid|billing|403|400/i.test(msg)) {
        liveQuotaCooldowns.set(key, Date.now() + LIVE_KEY_COOLDOWN_MS);
        const tail = key.length > 6 ? key.slice(-4) : '***';
        logger.warn(`[VoiceSession] Cooldown 15m aplicado a Live API key (...${tail}) por: ${msg.slice(0, 140)}`);
    }
}

function orderVoiceKeysByCooldown(keys = []) {
    if (!Array.isArray(keys) || keys.length <= 1) return Array.isArray(keys) ? keys : [];
    const reversed = [...keys].reverse();
    const fresh = [];
    const cooled = [];
    for (const k of reversed) {
        if (isVoiceKeyCooledDown(k)) cooled.push(k);
        else fresh.push(k);
    }
    return [...fresh, ...cooled];
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

function buildAccentInsensitiveRegex(str) {
    const clean = String(str || '')
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
    const pattern = clean
        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        .replace(/a/gi, '[aáàäâã]')
        .replace(/e/gi, '[eéèëê]')
        .replace(/i/gi, '[iíìïî]')
        .replace(/o/gi, '[oóòöôõ]')
        .replace(/u/gi, '[uúùüû]')
        .replace(/n/gi, '[nñ]');
    return new RegExp(pattern, 'i');
}

async function findCompanyByTermForUser(targetUserId, term) {
    if (!targetUserId || !term) return null;
    const rawTerm = String(term).trim();
    if (!rawTerm) return null;

    if (mongoose.isValidObjectId(rawTerm)) {
        const byId = await CompanyInfo.findOne({ user: targetUserId, _id: rawTerm });
        if (byId) return byId;
    }

    const accentRegex = buildAccentInsensitiveRegex(rawTerm);
    const directMatch = await CompanyInfo.findOne({
        user: targetUserId,
        $or: [
            { companyName: accentRegex },
            { nit: rawTerm },
            { nit: accentRegex },
        ],
    });
    if (directMatch) return directMatch;

    const norm = (s) =>
        String(s || '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9\s]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

    const stopWords = new Set(['de', 'del', 'la', 'el', 'los', 'las', 'y', 'e', 'o', 'en', 'sas', 'ltda', 'sa', 'empresa', 'compania']);
    const normTerm = norm(rawTerm);
    const words = normTerm.split(' ').filter((w) => w.length >= 2 && !stopWords.has(w));
    if (words.length === 0) return null;

    const allCompanies = await CompanyInfo.find({ user: targetUserId });
    if (!allCompanies || allCompanies.length === 0) return null;

    const fullMatch = allCompanies.find((c) => {
        const hay = `${norm(c.companyName)} ${norm(c.nit)}`;
        return words.every((w) => hay.includes(w));
    });
    if (fullMatch) return fullMatch;

    let best = null;
    let bestScore = 0;
    for (const c of allCompanies) {
        const hay = `${norm(c.companyName)} ${norm(c.nit)}`;
        const score = words.filter((w) => hay.includes(w)).length;
        if (score > bestScore) {
            bestScore = score;
            best = c;
        }
    }
    return bestScore > 0 ? best : null;
}

async function getActiveCompanyForUser(userId) {
    if (!userId) return null;
    try {
        let targetUserId = userId;
        let assignedCompanyId = null;
        let isSubUser = false;
        try {
            const User = mongoose.models.User || require('~/models/User');
            const userDoc = await User.findById(userId).select('isSubUser parentUser assignedCompany').lean();
            if (userDoc?.isSubUser && userDoc?.parentUser) {
                isSubUser = true;
                targetUserId = userDoc.parentUser.toString();
                if (userDoc?.assignedCompany) {
                    assignedCompanyId = userDoc.assignedCompany.toString();
                }
            }
        } catch (_) {}
        if (isSubUser && assignedCompanyId) {
            return await CompanyInfo.findOne({ _id: assignedCompanyId, user: targetUserId })
                .select('_id companyName nit')
                .lean()
                .catch(() => null);
        }
        return await CompanyInfo.findOne({ user: targetUserId, isActive: true })
            .select('_id companyName nit')
            .lean()
            .catch(() => null);
    } catch (_) {
        return null;
    }
}

async function resolveActiveCompanyId(userId) {
    const activeComp = await getActiveCompanyForUser(userId);
    return activeComp?._id ? String(activeComp._id) : null;
}

function normalizeTenshiConversationId(val) {
    if (typeof val !== 'string') return null;
    const trimmed = val.trim();
    if (!trimmed || trimmed === 'new' || trimmed === 'null' || trimmed === 'undefined') {
        return null;
    }
    return trimmed;
}

function extractNotebookRef(entry) {
    if (typeof entry === 'string') {
        const clean = entry.trim();
        return clean ? { id: clean, title: clean, emoji: '' } : null;
    }
    if (entry && typeof entry === 'object') {
        const id = String(entry.id || entry.notebookId || entry.notebook_id || entry.title || entry.name || '').trim();
        const title = String(entry.title || entry.name || id || '').trim();
        if (!id) return null;
        return {
            id,
            title: title || id,
            emoji: entry.emoji ? String(entry.emoji) : '',
        };
    }
    return null;
}

function sanitizeSelectedNotebooks(raw) {
    if (!Array.isArray(raw)) return [];
    const result = [];
    const seen = new Set();
    for (const entry of raw) {
        const ref = extractNotebookRef(entry);
        if (!ref || seen.has(ref.id)) continue;
        seen.add(ref.id);
        if (typeof entry === 'string') {
            result.push(ref.id);
        } else {
            result.push({
                id: ref.id,
                title: ref.title,
                ...(ref.emoji ? { emoji: ref.emoji } : {}),
            });
        }
    }
    return result;
}

function getTenshiConversationModelSafe() {
    if (mongoose.models && mongoose.models.TenshiConversation) {
        return mongoose.models.TenshiConversation;
    }
    try {
        const mod = require('~/models/TenshiConversation');
        const model = mod?.TenshiConversation || mod?.default || mod;
        if (model && typeof model.findOne === 'function') {
            return model;
        }
    } catch (_err) {
        // Modelo TenshiConversation aún no cargado o no disponible en sesiones legadas
    }
    return null;
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

/**
 * Sanitizes voice transcription for common Spanish/SST phonetic misrecognitions
 * and blocks multilingual / silence / pretraining-corpus hallucinations from Gemini Live ASR.
 */
/**
 * Sanitizes an individual streaming sub-token from Gemini Live's `inputTranscription`
 * WITHOUT trimming leading/trailing spaces (so sub-word syllables like "Anti" + "gravity"
 * or "al" + "berto" are never split, and standalone articles like " la " are never deleted).
 */
function sanitizeStreamingChunk(rawChunk) {
    if (!rawChunk || typeof rawChunk !== 'string') return '';
    // Reject non-Latin script hallucinations immediately
    if (/[\u0370-\u03FF\u0400-\u04FF\u0590-\u05FF\u0600-\u06FF\u0900-\u097F\u0E00-\u0E7F\u1100-\u11FF\u3040-\u30FF\u3130-\u318F\u4E00-\u9FFF\uAC00-\uD7AF]/u.test(rawChunk)) {
        logger.warn(`[VoiceSession] Discarding foreign script streaming chunk from STT: "${rawChunk}"`);
        return '';
    }
    // Strip ASR timestamp leaks
    if (/\[\s*\d+m\d+s\d*ms\s*\]/i.test(rawChunk)) {
        return rawChunk.replace(/\[\s*\d+m\d+s\d*ms\s*\][\s\S]*$/i, '');
    }
    return rawChunk;
}

/**
 * Applies deterministic 0ms phonetic repairs for WAPPY, Tenshi, Antigravity,
 * and Colombian SG-SST domain terminology that Google's context-blind streaming ASR distorts.
 */
function applyDomainPhoneticCorrections(text) {
    if (!text || typeof text !== 'string') return '';
    let s = text;

    // 1. Tenshi brand & greeting variations (including Italian/Portuguese ASR phonetic approximations like "vecchi", "vechi", "beki", "venci")
    s = s.replace(/\b(ventiola|venti\s+hola|tenchi\s+hola|denchi\s+hola|bencini\s+hola|vecchi\s+hola|vechi\s+hola)\b/gi, 'Tenshi, hola');
    s = s.replace(/\b(hola\s+)?(tenchi|denchi|densi|bencini|benchini|pensi|tensi|tenci|teshi|tensy|vecchi|vechi|beki|venci|ten\s+si|ten\s+chi|ven\s+y\s+si|chenchi|zenchi|tenzhi)\b/gi, (_, holaPrefix) => {
        return holaPrefix ? `${holaPrefix}Tenshi` : 'Tenshi';
    });

    // 2. Antigravity brand & delegation variations (including Italian/Spanish split syllables like "a te, graviti", "a ti, graviti", "ate graviti")
    s = s.replace(/\b(le\s+pregunt[eé]\s+a\s+)(un\s+talento\s+que\s+habita(?:\s+y)?|talento\s+que\s+habita|anti\s*gravity|anti\s*graviti|antigravite|antigraviti|anti\s*gravedad|a\s+t[ei]\s*,?\s*gravit[iy]|at[ei]\s+gravit[iy]|tigravity|tigra\s+biti)\b/gi, 'pregúntale a Antigravity');
    s = s.replace(/\b(un\s+talento\s+que\s+habita(?:\s+y)?|talento\s+que\s+habita|anti\s*gravity|anti\s*graviti|antigravite|antigraviti|anti\s*gravedad|a\s+t[ei]\s*,?\s*gravit[iy]|at[ei]\s+gravit[iy]|tigravity|tigra\s+biti|antigra\s+vit[iy])\b/gi, 'Antigravity');
    s = s.replace(/\b(preg[uú]ntale\s+a\s+Antigravity)\s+y\s+qu[eé]\b/gi, '$1 qué');

    // 2b. Italian/Portuguese phonetic leaks when Gemini Live ASR transcribes Spanish speech without languageCode
    s = s.replace(/\bperch[eé]\s+non\b/gi, 'por qué no');
    s = s.replace(/\bperch[eé]\b/gi, 'por qué');
    s = s.replace(/\bche\s+non\b/gi, 'que no');
    s = s.replace(/\bnon\s+risponde\b/gi, 'no responde');
    s = s.replace(/\brisponde\b/gi, 'responde');
    s = s.replace(/\bnon\s+(me|te|se|le|lo|la|es|est[aá]|hay|tiene|puedo|quiero|funciona|sale|abre|env[ií]a)\b/gi, 'no $1');
    s = s.replace(/\bche\s+(no|me|te|se|le|lo|la|los|las|es|est[aá]|son|hay|tiene|hace|dice|pasa|quiero|puedo|vamos|hago|pas[oó]|responde)\b/gi, 'que $1');
    s = s.replace(/\bquesto\b/gi, 'esto');
    s = s.replace(/\bquesta\b/gi, 'esta');
    s = s.replace(/\bsempre\b/gi, 'siempre');
    s = s.replace(/\banche\b/gi, 'también');
    s = s.replace(/\badesso\b/gi, 'ahora');

    // 3. WAPPY brand variations
    s = s.replace(/\b(wappi|guapi|huapi|wap\s*pi|wapy|guapy)\b/gi, 'WAPPY');

    // 4. Colombian SG-SST & Specialist phonetic distortions observed in production logs
    s = s.replace(/\b(el\s+may\s+colabora|may\s+colabora|m[eé]dico\s+colabora|m[eé]dica\s+colabora)\b/gi, 'el Médico Laboral');
    s = s.replace(/\b(busquen?\s+a\s+web|busca(?:r)?\s+a\s+web|busquen?\s+en\s+a\s+web|buscar\s+en\s+a\s+web)\b/gi, 'busque en la web');
    s = s.replace(/\b(en\s+a\s+web)\b/gi, 'en la web');
    s = s.replace(/\b(expl[ií]came\s+la\s+masa\s+a\s+fondo|la\s+masa\s+a\s+fondo|masa\s+a\s+fondo)\b/gi, (m) =>
        /^expl/i.test(m) ? 'explícame más a fondo' : 'más a fondo'
    );
    s = s.replace(/\b(me\s+hice\s+salberto|me\s+dice\s+salberto|me\s+dices\s+salberto)\b/gi, 'me dices Alberto');
    s = s.replace(/\b(matriz\s+hiper(?:\s*b|\s*v)?|matriz\s+iper\w*|iper\s*bar|ipebar)\b/gi, 'Matriz IPEVAR');
    s = s.replace(/\b(je\s*te\s*se\s*45|gtc\s*cuarenta\s+y\s+cinco)\b/gi, 'GTC-45');
    s = s.replace(/\b(copas\s*st|copast)\b/gi, 'COPASST');
    s = s.replace(/\b(furad|fura\s*t)\b/gi, 'FURAT');
    s = s.replace(/\b(pe\s*ese\s*ve|pes\s*b)\b/gi, 'PESV');
    s = s.replace(/\b(decreto\s+diez\s+setenta\s+y\s+dos)\b/gi, 'Decreto 1072');
    s = s.replace(/\b(resoluci[oó]n\s+cero\s+tres\s+doce|resoluci[oó]n\s+tres\s+doce)\b/gi, 'Resolución 0312');

    return s;
}

/**
 * Sanitizes voice transcription for common Spanish/SST phonetic misrecognitions
 * and blocks multilingual / silence / pretraining-corpus hallucinations from Gemini Live ASR.
 */
function sanitizeTranscription(text) {
    if (!text || typeof text !== 'string') return '';
    let s = text.trim();
    if (!s) return '';

    // 1. REJECT ANY NON-LATIN SCRIPT HALLUCINATION (Devanagari, Arabic, Cyrillic, CJK, Korean Hangul, Japanese Hiragana/Katakana, Hebrew, Thai, Greek)
    if (/[\u0370-\u03FF\u0400-\u04FF\u0590-\u05FF\u0600-\u06FF\u0900-\u097F\u0E00-\u0E7F\u1100-\u11FF\u3040-\u30FF\u3130-\u318F\u4E00-\u9FFF\uAC00-\uD7AF]/u.test(s)) {
        logger.warn(`[VoiceSession] Discarding foreign script hallucination from STT: "${s}"`);
        return '';
    }

    // 2. STRIP OR REJECT ASR TIMESTAMP HALLUCINATIONS (e.g. "[ 0m39s409ms ]")
    if (/\[\s*\d+m\d+s\d*ms\s*\]/i.test(s)) {
        logger.warn(`[VoiceSession] Discarding ASR timestamp hallucination from STT: "${s}"`);
        s = s.replace(/\[\s*\d+m\d+s\d*ms\s*\][\s\S]*$/i, '').trim();
        if (!s) return '';
    }

    // 3. REJECT KNOWN SILENCE / MOVIE SUBTITLE / PRETRAINING CORPUS HALLUCINATIONS (Spanish, English, French, German, Portuguese)
    if (
        /^(yo juego a la bola|yo me llamo juan(\s*,\s*mucho gusto)?|mucho gusto|yo soy de argentina|thank you(\s+for\s+watching)?|suscr[ií]bete(\s+al\s+canal)?|subt[ií]tulos(\s+realizados)?\s+por.*|amara\.org|check\s+check(\.?\s*para\s+cambiar)?|oui(\.?\s*qu'est-ce\s+qu'on\s+a\s+ici\s*\??)?|bye|oh|ah|uh|um|hmm|mm|eh|ada|as|ciao|bonjour|hello|hi|confused|six\s+times|right\s+now|you\s+know|so)\.?$/i.test(s) ||
        /\b(yo me llamo juan|yo soy de argentina|se subieron a la tarima|a eso de la medianoche|subt[ií]tulos realizados por|recuerdo cada palabra del juramento|la noche se acerca y ahora mi vig[ií]a comienza|soy el escudo que resguarda el reino de los hombres|mi vig[ií]a comienza|reino de los hombres|qu'est-ce qu'on a ici|check check\.?\s*para cambiar)\b/i.test(s)
    ) {
        logger.warn(`[VoiceSession] Discarding phantom silence/subtitle hallucination: "${s}"`);
        return '';
    }

    // 4. REJECT FOREIGN LANGUAGE DRIFT (French, German, Portuguese, Romanized Hindi/Urdu, and pure-English ambient phantoms)
    if (
        /\b(qu'est-ce|qu'on|c'est\s+quoi|je\s+suis|avec\s+moi|merci\s+beaucoup)\b/i.test(s) ||
        /\b(händisch|erarbeitet|nicht|auch|wird|haben|einer|einem|diese[rmns]?)\b/i.test(s) ||
        /\b(não|você|vocês|então|isso|tá\s+vendo|a\s+gente\s+tá|acontecer\s+agora|negócio|arrumar|depois\s+que)\b/i.test(s) ||
        /\b(aur|ek\s+chhat|hai\s+na|jo\s+hamara|system\s+hai\s+na)\b/i.test(s) ||
        /^(?:for\s+\w+\s+is\s+here|claude\s+is\s+here|thanks?\s+for\s+watching|please\s+subscribe|you're\s+welcome|see\s+you\s+(?:soon|later|next\s+time)|i\s+(?:am|will|have|don't|can't)\s+[a-z'\s]+|this\s+is\s+(?:a|the)\s+[a-z'\s]+|it\s+is\s+[a-z'\s]+|that\s+is\s+[a-z'\s]+)\.?$/i.test(s)
    ) {
        logger.warn(`[VoiceSession] Discarding foreign language drift hallucination: "${s}"`);
        return '';
    }

    // 5. REJECT OR COLLAPSE DEGENERATE WORD / PHRASE REPETITION LOOPS (e.g. "un un un un...", "¿Qué ¿Qué ¿Qué")
    if (/^(¿?\s*qu[eé]\s*\??\s*){2,}$/i.test(s)) {
        logger.warn(`[VoiceSession] Discarding repetitive STT loop hallucination: "${s}"`);
        return '';
    }

    // If a word repeats 4+ times in a row (e.g. "un un un un..."), truncate from the stutter loop onward
    const stutterMatch = s.match(/\b([a-záéíóúñü]{1,12})\b(?:\s+\1\b){3,}/i);
    if (stutterMatch && stutterMatch.index !== undefined) {
        logger.warn(`[VoiceSession] Truncating degenerate word-loop hallucination in STT: "${s.substring(0, 120)}..."`);
        s = s.substring(0, stutterMatch.index).trim();
        if (!s) return '';
    }

    // Collapse any 3-word stutter (e.g. "el el el" -> "el")
    s = s.replace(/\b([a-záéíóúñü]{1,12})\b(?:\s+\1\b){2,}/gi, '$1');

    // Fix affirmative false cognates (e.g. Google STT hearing "bistro" for "listo")
    s = s.replace(/\b(bistro|visto|misto|cristo|pisto|disto)\b/gi, (match) => {
        return match[0] === match[0].toUpperCase() ? 'Listo' : 'listo';
    });

    // Fix report voice triggers
    s = s.replace(/\bgeneral\s+(el\s+|al\s+)?(informe|reporte)\b/gi, 'generar el informe');
    s = s.replace(/\b(has|hazme|as)\s+el\s+(informe|reporte)\b/gi, 'haz el informe');
    s = s.replace(/\b(quiero|dame)\s+el\s+(reporte|informe)\b/gi, 'genera el informe');

    // Apply WAPPY / Tenshi / Antigravity / SG-SST phonetic domain corrections
    s = applyDomainPhoneticCorrections(s);

    return s.trim();
}

/**
 * Sanitizes the accumulated multi-chunk transcription buffer to eliminate cross-chunk loops,
 * ASR timestamp leaks, movie/subtitle hallucinations, and phonetic distortions.
 */
function sanitizeAccumulatedTranscription(fullText) {
    if (!fullText || typeof fullText !== 'string') return '';
    let s = fullText.trim();
    if (!s) return '';

    // 1. Cut off any ASR timestamp hallucination tail
    s = s.replace(/\[\s*\d+m\d+s\d*ms\s*\][\s\S]*$/i, '').trim();

    // 2. Cut off any known silence / movie subtitle hallucination tail that got appended
    s = s.replace(/(?:yo me llamo juan|yo soy de argentina|y se subieron a la tarima|a eso de la medianoche|händisch erarbeitet|é o que a gente tá vendo|recuerdo cada palabra del juramento|la noche se acerca y ahora mi vig[ií]a comienza|soy el escudo que resguarda el reino de los hombres|qu'est-ce qu'on a ici|check check\.?\s*para cambiar|subt[ií]tulos realizados por|amara\.org)[\s\S]*$/i, '').trim();

    // 3. Cut off degenerate 4+ word repetition loops across chunk boundaries
    const loopMatch = s.match(/\b([a-záéíóúñü]{1,12})\b(?:\s+\1\b){3,}/i);
    if (loopMatch && loopMatch.index !== undefined) {
        s = s.substring(0, loopMatch.index).trim();
    }

    // 4. Deduplicate consecutive repeated sentences/phrases (e.g. "Hola cómo estás. Hola cómo estás.")
    s = s.replace(/([a-záéíóúñü0-9,\s]{8,80}?[.!?])\s*(?:\1\s*)+/gi, '$1 ');

    // 5. Normalize whitespace
    s = s.replace(/\s{2,}/g, ' ').trim();

    // 6. Run full-sentence phonetic & hallucination sanitizer now that all sub-word tokens are joined
    s = sanitizeTranscription(s);

    return s;
}

/**
 * Custom dictionary for WAPPY / Tenshi / Antigravity / SG-SST Multimodal Dictation (Wappy Dots Architecture)
 */
const WAPPY_DICTATION_CUSTOM_VOCABULARY = [
    'Suri',
    'Tenshi',
    'WAPPY',
    'Wappy Dots',
    'NotebookLM',
    'Google Flow',
    'Antigravity',
    'SG-SST',
    'SOMOS SST',
    'GTC 45',
    'IPEVR',
    'Matriz IPEVAR',
    'PESV',
    'COPASST',
    'COCOLAB',
    'FURAT',
    'FUREP',
    'ATEL',
    'Res. 0312',
    'Resolución 0312',
    'Decreto 1072',
    'Resolución 1843',
    'Resolución 4272',
    'Resolución 2764',
    'ISO 45001',
    'RULA',
    'REBA',
    'OWAS',
    'NIOSH',
    'OCRA',
    'EPP',
    'ACPM',
    'Canvas',
    'LiveEditor',
    'Médico Laboral',
    'Abogado Laboral',
    'Fisioterapeuta Laboral',
    'Psicólogo Especialista SST',
    'Ingeniero Químico',
];

/**
 * Computes Root Mean Square (RMS) energy of a 16-bit signed little-endian PCM buffer.
 */
function calculatePcm16LeRms(pcmBuf) {
    if (!pcmBuf || !Buffer.isBuffer(pcmBuf) || pcmBuf.length < 2) return 0;
    const samples = Math.floor(pcmBuf.length / 2);
    if (samples === 0) return 0;
    let sumSquares = 0;
    for (let i = 0; i < samples * 2; i += 2) {
        const sample = pcmBuf.readInt16LE(i) / 32768.0;
        sumSquares += sample * sample;
    }
    return Math.sqrt(sumSquares / samples);
}

/**
 * Builds an in-memory 16kHz 16-bit Mono WAV (RIFF/WAVE) from accumulated PCM chunks
 * and applies Wappy Dots' RMS silence filter (rms < 0.0025 => silent).
 */
function build16kMonoWavFromPcmChunks(pcmChunks) {
    if (!Array.isArray(pcmChunks) || pcmChunks.length === 0) {
        return { silent: true, rms: 0, wavBase64: null, byteLength: 0, durationSec: 0, reason: 'empty', signature: null };
    }

    // Trim leading and trailing silent chunks (keeping 1 chunk margin on each end to preserve initial consonants & final syllables)
    let firstActiveIdx = 0;
    while (firstActiveIdx < pcmChunks.length && calculatePcm16LeRms(pcmChunks[firstActiveIdx]) < 0.0025) {
        firstActiveIdx++;
    }
    if (firstActiveIdx >= pcmChunks.length) {
        return { silent: true, rms: 0, wavBase64: null, byteLength: 0, durationSec: 0, reason: 'all_silent', signature: null };
    }
    let lastActiveIdx = pcmChunks.length - 1;
    while (lastActiveIdx > firstActiveIdx && calculatePcm16LeRms(pcmChunks[lastActiveIdx]) < 0.0025) {
        lastActiveIdx--;
    }

    const startIdx = Math.max(0, firstActiveIdx - 1);
    const endIdx = Math.min(pcmChunks.length - 1, lastActiveIdx + 1);
    const trimmedPcm = Buffer.concat(pcmChunks.slice(startIdx, endIdx + 1));
    const durationSec = +(trimmedPcm.length / 32000).toFixed(2);

    // Minimum ~100ms of 16kHz 16-bit mono PCM (3200 bytes)
    if (trimmedPcm.length < 3200) {
        return { silent: true, rms: 0, wavBase64: null, byteLength: trimmedPcm.length, durationSec, reason: 'too_short', signature: null };
    }

    const rms = calculatePcm16LeRms(trimmedPcm);
    if (rms < 0.003) {
        return {
            silent: true,
            rms,
            wavBase64: null,
            byteLength: trimmedPcm.length,
            durationSec,
            reason: 'below_min_rms',
            signature: null,
        };
    }

    // Filtro anti-ruido corto (respiración, suspiro, clic, golpe de micrófono):
    // Si dura < 0.45s y RMS < 0.06, o tiene < 16000 bytes PCM (~0.50s) con energía marginal (< 0.055), descartar como ruido de fondo
    if ((durationSec < 0.45 && rms < 0.06) || (trimmedPcm.length < 16000 && rms < 0.055)) {
        return {
            silent: true,
            rms,
            wavBase64: null,
            byteLength: trimmedPcm.length,
            durationSec,
            reason: 'short_low_energy_noise',
            signature: null,
        };
    }

    const signature = crypto.createHash('sha1').update(trimmedPcm).digest('hex').slice(0, 16);

    const wavHeader = Buffer.alloc(44);
    wavHeader.write('RIFF', 0);
    wavHeader.writeUInt32LE(36 + trimmedPcm.length, 4);
    wavHeader.write('WAVE', 8);
    wavHeader.write('fmt ', 12);
    wavHeader.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
    wavHeader.writeUInt16LE(1, 20);  // AudioFormat (1 = PCM)
    wavHeader.writeUInt16LE(1, 22);  // NumChannels (1 = mono)
    wavHeader.writeUInt32LE(16000, 24); // SampleRate (16000 Hz)
    wavHeader.writeUInt32LE(32000, 28); // ByteRate (16000 * 1 * 2)
    wavHeader.writeUInt16LE(2, 32);  // BlockAlign (1 * 2)
    wavHeader.writeUInt16LE(16, 34); // BitsPerSample (16)
    wavHeader.write('data', 36);
    wavHeader.writeUInt32LE(trimmedPcm.length, 40);

    const wavBuffer = Buffer.concat([wavHeader, trimmedPcm]);
    return {
        silent: false,
        rms,
        wavBase64: wavBuffer.toString('base64'),
        byteLength: trimmedPcm.length,
        durationSec,
        reason: null,
        signature,
    };
}

/**
 * Loads and extracts clean technical domain knowledge from agent skills
 */
function getAgentSkillsContent(agentObj, isBiomechanics) {
    const skillsToLoad = new Set();

    if (agentObj && Array.isArray(agentObj.skills) && agentObj.skills.length > 0) {
        agentObj.skills.forEach(s => skillsToLoad.add(s));
    }

    // Force biomechanics essential skills only for Fisioterapeuta
    const name = (agentObj?.name || '').toLowerCase();
    if (isBiomechanics || name.includes('fisio')) {
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

    const cleanCore = cleanQ.replace(/[.?\s]+$/, '');
    const coreQuestion = cleanCore.startsWith('¿') ? `${cleanCore}?` : cleanCore;

    const hasNormativeSubject = /\b(norma|normativa|normatividad|decreto|resoluci[oó]n|ley|circular|art[ií]culo|c[oó]digo|est[aá]ndar|smlmv|uvt|jurisprudencia|sentencia|legal|requisito|cumplimiento|accidente|incapacidad|fuero|acoso|pesv|alturas|confinad|qu[ií]mic|retie|ergonom|m[eé]dic|sgsst|sg-sst)\b/i.test(cleanQ);

    if (hasNormativeSubject) {
        return `${coreQuestion}\n\nPor favor verifica previamente en la web con la herramienta 'web_search' la normatividad colombiana VIGENTE aplicable a esta consulta (revisando decretos, resoluciones ministeriales y sentencias recientes, descartando normas derogadas como Res 1409/2012 o Res 1111/2017) y emite tu concepto técnico ocupacional y jurídico fundamentado con recomendaciones prácticas para el SG-SST de la empresa.`;
    }

    if (cleanQ.length >= 120) {
        return cleanQ;
    }

    return `${coreQuestion}\n\nPor favor emite concepto técnico ocupacional y jurídico detallado para esta consulta concreta, fundamentado en la normativa colombiana aplicable al SG-SST (Decreto 1072 de 2015, Resoluciones ministeriales vigentes verificadas con web_search) y recomendaciones de aplicación práctica para la empresa.`;
}

/**
 * Translates application routes and active screen contexts into clear, human-readable
 * modules of the SG-SST platform so Tenshi has crystal-clear grounded context.
 */
function formatScreenRouteHuman(route, agent, isHeroMode = false) {
    if (isHeroMode) {
        return 'Modo Hero de Tenshi (Asistente Principal con Chat y Canvas Integrado)';
    }
    if (!route && !agent) return 'Modo Hero de Tenshi (Asistente Principal con Chat y Canvas Integrado)';
    const r = (route || '').toLowerCase().trim();

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
    if (r.includes('/tareas') || r.includes('automatizaciones')) {
        return 'Módulo: Tareas (tareas programadas de agentes IA, antes Automatizaciones IA)';
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
    if (r.startsWith('/c/') || r === '/' || r === '/c' || r.includes('/c/') || r.includes('/chat')) {
        return 'Modo Hero de Tenshi (Asistente Principal con Chat y Canvas Integrado)';
    }
    return `Pantalla actual: ${route}`;
}

/**
 * Determina de forma determinista si una solicitud de informe/reporte debe redirigirse
 * al editor nativo de un aplicativo Somos SST (/sgsst) en lugar de generar un entregable en Canvas.
 * NUNCA redirige por palabras genéricas aisladas como "módulo" o "pantalla", ni cuando el usuario
 * solicita entregables Canvas/HTML/Word/Excel/interactivos o se encuentra en Modo Hero (/c/new).
 */
function shouldRedirectReportToSgsstApp(reqLower, toolArgs = {}, activeScreenRoute = '', isHeroMode = false) {
    const text = String(reqLower || '').toLowerCase();
    const route = String(activeScreenRoute || '').toLowerCase().trim();
    const isOnSgsstApp = !Boolean(isHeroMode) && route.startsWith('/sgsst');

    const mentionsExplicitAppButtonOrEditor = /\b(bot[oó]n\s+(?:de\s+)?generar(?:\s+con)?\s+ia|editor\s+del\s+aplicativo)\b/i.test(text);

    // a) Entregable explícito de Canvas / archivo descargable / interactivo
    const explicitCanvasDeliverableRegex = /\b(en\s+canvas|canvas|en\s+word|word|docx?|en\s+excel|excel|xlsx?|html|interactiv[oa]|descargable|landing|prototipo|presentaci[oó]n|diapositivas|pptx|pdf|tablero|dashboard|calculadora|simulador)\b/i;
    const requestedFileType = String(toolArgs?.fileType || toolArgs?.formato || '').toLowerCase().trim();
    const isExplicitCanvasDeliverable =
        explicitCanvasDeliverableRegex.test(text) ||
        ['html', 'excel', 'presentation'].includes(requestedFileType);

    if (isExplicitCanvasDeliverable) {
        return Boolean(isOnSgsstApp && mentionsExplicitAppButtonOrEditor);
    }

    // Aplicativos específicos de Somos SST con editor nativo de análisis IA
    const namedSgsstAppRegex = /\b(responsable|pol[ií]tica|objetivos|matriz\s+legal|reglamento\s+interno|\brit\b|perfil\s+(?:de\s+)?cargo|diagn[oó]stico|0312|vulnerab\w*)\b/i;
    const mentionsAplicativoOrEditor = /\b(aplicativo|editor\s+del\s+aplicativo)\b/i.test(text);
    const hasReportIntent = /\b(informe|an[aá]lisis|reporte|generar\s+(?:con\s+)?ia)\b/i.test(text);

    // b) Fuera de /sgsst o en Modo Hero: solo redirigir si nombra explícitamente un aplicativo SG-SST
    //    junto con "aplicativo" o "editor del aplicativo" (y sin pedir HTML/Word/Excel/Canvas/interactivo).
    if (!isOnSgsstApp) {
        return namedSgsstAppRegex.test(text) && mentionsAplicativoOrEditor;
    }

    // c) En /sgsst (sin Modo Hero): solo redirigir si pide el botón/editor del aplicativo
    //    o el informe del aplicativo en pantalla / aplicativo SG-SST nombrado (nunca por "módulo" o "pantalla" solas).
    if (mentionsExplicitAppButtonOrEditor) {
        return true;
    }

    if (
        hasReportIntent &&
        (/\b(del\s+aplicativo|de\s+este\s+aplicativo|en\s+el\s+aplicativo|aplicativo\s+en\s+pantalla)\b/i.test(text) ||
            namedSgsstAppRegex.test(text))
    ) {
        return true;
    }

    return false;
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
            this.dbModel = process.env.GEMINI_LIVE_MODEL || 'gemini-3.6-flash';
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
        this.isHeroMode = Boolean(config.isHeroMode);
        this.activeScreenRoute = config.route || '';
        this.activeScreenAgent = !this.isHeroMode && (config.agentId || config.agentName)
            ? { id: config.agentId, name: config.agentName || '' }
            : null;

        // Text accumulation for saving
        this.userTranscriptionText = '';
        this.lastUserTranscription = '';
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
        this.lastGeneratedCanvasFile = null; // Entregable Canvas generado durante el turno para adjuntar al mensaje final
        this.pendingHangupAfterTurn = false; // Cierre diferido tras terminar locución de despedida
        this.hangupFarewellAlreadySpoken = false;
        this.pendingHangupTimer = null;
        // Wappy Dots 4-Step Multimodal 16kHz WAV Audio Capture Buffers & Deduplication
        this.currentTurnPcmChunks = [];
        this.currentTurnPcmBytes = 0;
        this.currentTurnPreRollChunks = [];
        this.currentTurnSpeechDetected = false;
        this.currentAudioTurnId = 0;
        this.earlyCorrectionPromise = null;
        this.wavTranscriptionCache = new Map();
        this.wavTranscriptionInFlight = new Map();
        this.activeToolCount = 0;
        this.lastUserAudioAt = 0;
        this.aiGenerationComplete = false;
        this.lastAiAudioAt = 0;
        this.audioStreamEndWatchdog = null;
        this.userMeta = null;
        this.activeCompanyId = config?.companyId ? String(config.companyId) : null;
        this.activeTenshiConversationId = normalizeTenshiConversationId(config?.tenshiConversationId);
        this.selectedTenshiNotebooks = sanitizeSelectedNotebooks(config?.selectedNotebooks);

        logger.info(`[VoiceSession] Created for user: ${userId}, conversationId: ${conversationId || 'NULL'}, tenshiConversationId: ${this.activeTenshiConversationId || 'NULL'}`);

        // Modo Tenshi: Asistente oficial con control de plataforma por voz
        if (this.config.mode === 'tenshi_voice') {
            this.liveConfig.voice = 'Puck';
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
                                        description: "Nombre clave del módulo, hito o aplicativo. Hitos 1 al 8: 'contexto_organizacion' (DOFA y partes interesadas), 'diagnostico' (0312), 'responsable', 'politica', 'objetivos', 'legal', 'rhs', 'rit', 'participacion_ipevar', 'matriz_ipevar_oficial', 'matriz_pesv_oficial', 'matriz_compatibilidad_oficial', 'oportunidades_sst', 'vulnerabilidad', 'plan_emergencias', 'perfil_cargo', 'perfil_socio', 'condiciones_salud', 'oraculo_predictivo', 'copasst', 'cocolab', 'comite_pesv', 'brigada_emergencias', 'peligros', 'metodo_owas', 'estudio_puesto', 'animo', 'compras_sst', 'contratistas_proveedores', 'gestion_cambio', 'analisis_trabajo_seguro', 'permiso_alturas', 'heights_lifecycle', 'epp_delivery', 'chemical_registry', 'vehicles_pesv', 'equipos_emergencia', 'comunicaciones_sst', 'capacitaciones', 'ruta_aprendizaje', 'reporte_actos', 'simulacros_emergencia', 'app_builder', 'estadisticas', 'investigacion_atel', 'control_acpm', 'auditoria', 'alta_direccion', 'investigacion_profunda', 'predictivo'. Aplicativos y Dashboards: 'sgsst', 'planes' (/planes planes de suscripción), 'academia' (/academia?tab=cursos), 'training_admin', 'rutas' (/academia?tab=rutas), 'ruta_admin', 'blog' (/academia?tab=blog), 'blog_admin', 'clases_en_vivo' (/academia?tab=meet clases en vivo de la academia), 'events_meet', 'events_meet_admin', 'marketplace' (/marketplace o /tienda tienda productos SST), 'tienda', 'marketplace_admin', 'agents' (/agents catálogo agentes IA), 'control' (/sgsst/control Centro de Control / Kanban de actividades ACPM), 'tareas' (/tareas: sección 'Tareas' debajo de Centro de Control; tareas programadas de agentes IA, antes 'Automatizaciones'; alias 'automatizaciones'), 'historial_tareas' (/tareas?tab=historial), 'animo_dashboard', 'empresas' (/sgsst?modal=empresas donde van las empresas registradas), 'empresas_registradas', 'configuracion' (sección de configuración y ajustes del usuario), 'settings', 'live' (/c/new), 'chat_sst', 'regresar' (para volver al chat desde planes/términos/privacidad/about), 'volver', 'roadmap', 'contactanos', 'comunidad', 'matriz', 'embajadores', 'embajadores_dashboard', 'tenshi_admin', 'search', 'privacy' (/privacy política de privacidad), 'terms' (/terms términos de servicio), 'about' (/about acerca de nosotros). Portales públicos: 'public_reportar', 'public_animo', 'public_estudio_puesto', 'public_ipevar', 'public_alta_direccion', 'public_atel', 'public_colaborador', 'public_comites', 'public_convivencia', 'public_votaciones', 'public_inspecciones', 'public_brigadistas'."
                                    },
                                    ruta: {
                                        type: "string",
                                        description: "Ruta URL interna exacta (opcional si se especifica modulo). Ejemplos: '/sgsst?hito=hito8&module=predictivo', '/sgsst?hito=hito1&module=diagnostico', '/sgsst?hito=hito2&module=perfil_cargo', '/sgsst?hito=hito3&module=copasst', '/sgsst?hito=hito4&module=peligros', '/sgsst?hito=hito5&module=vehicles_pesv', '/sgsst?hito=hito6&module=capacitaciones', '/sgsst?hito=hito7&module=investigacion_atel', '/planes', '/academia?tab=cursos', '/academia?tab=meet', '/academia?tab=blog', '/training/admin', '/ruta-aprendizaje/admin', '/blog', '/blog/admin', '/events-meet', '/marketplace', '/tienda', '/marketplace/admin', '/agents', '/sgsst/control', '/sgsst/animo', '/auditoria', '/c/new', '/chat-sst', '/hoja-de-ruta', '/contactanos', '/comunidad', '/matriz', '/embajadores', '/embajadores/dashboard', '/tenshi/admin', '/privacy', '/terms', '/about'."
                                    }
                                },
                                required: ["modulo"]
                            }
                        },
                        {
                            name: "wappy_controlar_videollamada",
                            description: "Controla la cámara, la videollamada o cuelga/desactiva el modo Live de Tenshi. DEBES invocar esta herramienta únicamente cuando el usuario diga explícitamente: 'activa videollamada', 'activa video', 'enciende la cámara', 'activa la cámara', 'apaga la cámara', 'desactiva video', 'cuelga la llamada', 'colgar', 'terminar llamada', 'finalizar llamada', o cuando el usuario pronuncie palabras explícitas de despedida ('hasta luego', 'gracias por todo', 'eso es todo por hoy', 'chao', 'adiós', 'nos vemos', 'hasta pronto', 'hasta mañana'). PROHIBICIÓN ESTRICTA: NUNCA uses 'colgar_llamada' ante silencio, ruido de micrófono, ni ante un simple 'no', 'nada', 'ok' o 'listo' tras preguntar '¿qué más necesitas?', ni cuando el usuario pida hacer una pausa ('para', 'detente', 'espera', 'un momento', 'silencio').",
                            parameters: {
                                type: "object",
                                properties: {
                                    accion: {
                                        type: "string",
                                        enum: ["activar_camara", "apagar_camara", "colgar_llamada"],
                                        description: "Acción a ejecutar: 'activar_camara' (enciende la cámara o videollamada en vivo), 'apagar_camara' (apaga la cámara y sigue la llamada solo por voz), 'colgar_llamada' (termina el modo Live SOLO cuando el usuario pronuncie palabras explícitas de colgar o despedida como 'cuelga la llamada', 'terminar llamada', 'hasta luego', 'gracias por todo', 'chao', 'adiós' o 'nos vemos'; JAMÁS ante silencio, ruido o un simple 'no')."
                                    }
                                },
                                required: ["accion"]
                            }
                        },
                        {
                            name: "generar_informe_inspeccion_camara",
                            description: "Genera el Informe Oficial de Inspección Visual de Campo con las 3 evidencias fotográficas capturadas por la cámara (o retenidas en memoria si la cámara acaba de apagarse). DEBES INVOCAR ESTA HERRAMIENTA OBLIGATORIAMENTE cuando el usuario tenga la cámara encendida o la haya tenido encendida recientemente y te pida hacer o generar un informe sobre un objeto físico, EPP (gafas, casco, botas, etc.), extintor, maquinaria, herramienta, condición o acto inseguro de campo ('haz el informe de mis gafas', 'genera el informe de la inspección', 'reporte de esta condición').",
                            parameters: {
                                type: "object",
                                properties: {
                                    motivo: {
                                        type: "string",
                                        description: "Objeto, elemento o condición inspeccionada (ej: 'Inspección de Gafas de Seguridad', 'Inspección de Extintor PQS', 'Inspección de EPP en Obra')."
                                    }
                                },
                                required: ["motivo"]
                            }
                        },
                        {
                            name: "generar_informe_tecnico",
                            description: "Compila y genera el informe técnico oficial de inspección o evaluación con las evidencias capturadas en vivo. DEBES invocarla cuando el usuario te pida compilar, hacer o generar el informe de la inspección o de lo que se observó en cámara.",
                            parameters: {
                                type: "object",
                                properties: {
                                    motivo: {
                                        type: "string",
                                        description: "Resumen o título de la inspección realizada."
                                    }
                                }
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
                            name: "wappy_consultar_marketplace",
                            description: "Consulta y lista los productos, servicios, consultorías virtuales, software y plantillas disponibles en la tienda oficial de WAPPY (Marketplace / Tienda SST), con sus precios regulares, precios en oferta, categorías y descripciones. Invócala siempre que el usuario pregunte por la tienda, compras, marketplace, productos, precios, ofertas o servicios de SST.",
                            parameters: {
                                type: "object",
                                properties: {
                                    busqueda: { type: "string", description: "Término de búsqueda o palabra clave del producto (opcional)." },
                                    categoria: { type: "string", description: "Categoría de producto o servicio (opcional)." }
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
                            name: "wappy_actualizar_empresa",
                            description: "Modifica o edita la información de cualquier empresa registrada del usuario o de la empresa activa (razón social, NIT, tipo de empresa, representante legal, cédula rep legal, número de trabajadores, ARL, nivel de riesgo, actividad económica, CIIU, dirección, ciudad, departamento, teléfono, email, responsable SST, licencia SST, vigencia).",
                            parameters: {
                                type: "object",
                                properties: {
                                    empresa: { type: "string", description: "Nombre, NIT o ID de la empresa a editar. Si se omite, se edita la empresa activa actual." },
                                    companyName: { type: "string", description: "Nueva razón social de la empresa." },
                                    nit: { type: "string", description: "Nuevo NIT o cédula de la empresa." },
                                    companyType: { type: "string", description: "'Persona Jurídica' o 'Persona Natural'." },
                                    legalRepresentative: { type: "string", description: "Nombre del representante legal." },
                                    legalRepresentativeId: { type: "string", description: "Cédula del representante legal." },
                                    workerCount: { type: "number", description: "Número de trabajadores." },
                                    arl: { type: "string", description: "Nombre de la ARL (Sura, Positiva, Colmena, Bolívar, etc.)." },
                                    riskLevel: { type: "string", description: "Nivel de riesgo ('I', 'II', 'III', 'IV', 'V')." },
                                    ciiu: { type: "string", description: "Código CIIU." },
                                    economicActivity: { type: "string", description: "Actividad económica." },
                                    address: { type: "string", description: "Dirección principal." },
                                    city: { type: "string", description: "Ciudad." },
                                    departamento: { type: "string", description: "Departamento." },
                                    phone: { type: "string", description: "Teléfono de contacto." },
                                    email: { type: "string", description: "Correo electrónico." },
                                    responsibleSST: { type: "string", description: "Nombre del Responsable SST." },
                                    licenseNumber: { type: "string", description: "Licencia SST." },
                                    licenseExpiry: { type: "string", description: "Fecha vigencia licencia SST." },
                                    generalActivities: { type: "string", description: "Actividades generales." }
                                }
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
                            name: "wappy_importar_sociodemografico_drive",
                            description: "Busca en el Google Drive del usuario (dentro de una carpeta específica X o en todo Drive) el archivo del Perfil Sociodemográfico y/o Condiciones de Salud, extrae a todos los trabajadores usando el modelo de texto gemini-3.5-flash-lite (y respaldo gemini-3.6-flash) y alimenta masivamente tanto el Perfil Sociodemográfico como las Condiciones de Salud en Somos SST.",
                            parameters: {
                                type: "object",
                                properties: {
                                    carpeta: { type: "string", description: "Nombre de la carpeta en Google Drive donde está el perfil sociodemográfico (ej: 'SST', 'Nomina', 'Talento Humano')." },
                                    archivo: { type: "string", description: "Nombre aproximado del archivo a buscar dentro de la carpeta (opcional)." },
                                    fileId: { type: "string", description: "ID exacto del archivo en Google Drive si ya se conoce (opcional)." }
                                }
                            }
                        },
                        {
                            name: "wappy_importar_hito1_drive",
                            description: "Busca en el Google Drive del usuario los archivos de los aplicativos del Hito 1 (Matriz IPEVR GTC-45, Matriz de Riesgos Viales PESV, Matriz de Compatibilidad Química SGA, Análisis de Vulnerabilidad/Diamante de Emergencias, Diagnóstico Inicial 0312 o Asignación del Responsable SST), extrae y normaliza los datos con gemini-3.5-flash-lite (y respaldo gemini-3.6-flash) y alimenta automáticamente los aplicativos oficiales en Somos SST.",
                            parameters: {
                                type: "object",
                                properties: {
                                    aplicativo: { type: "string", description: "Aplicativo a alimentar: 'gtc45', 'pesv', 'compatibilidad', 'vulnerabilidad', 'diagnostico', 'responsable' o 'auto'." },
                                    carpeta: { type: "string", description: "Nombre de la carpeta en Google Drive donde están los archivos del SG-SST (opcional)." },
                                    archivo: { type: "string", description: "Nombre aproximado del archivo en Google Drive (opcional)." },
                                    fileId: { type: "string", description: "ID exacto del archivo en Google Drive si ya se conoce (opcional)." }
                                }
                            }
                        },
                        {
                            name: "wappy_mcp_sst",
                            description: "Operaciones y consultas MCP de WAPPY SG-SST, agentes IA y automatizaciones.",
                            parameters: {
                                type: "object",
                                properties: {
                                    herramienta: {
                                        type: "string",
                                        description: "Tool MCP: 'wappy_resumen_general_360','wappy_consultar_perfil_empresa','wappy_actualizar_perfil_empresa','wappy_consultar_matriz_gtc45','wappy_alimentar_matriz_gtc45','wappy_consultar_matriz_pesv','wappy_alimentar_matriz_pesv','wappy_consultar_matriz_legal','wappy_registrar_requisito_legal','wappy_consultar_diagnostico_0312','wappy_evaluar_estandar_0312','wappy_consultar_trabajadores','wappy_registrar_trabajador','wappy_actualizar_trabajador','wappy_eliminar_trabajador','wappy_consultar_comites','wappy_registrar_miembro_comite','wappy_consultar_epp','wappy_registrar_entrega_epp','wappy_consultar_perfiles_cargo','wappy_guardar_perfil_cargo','wappy_consultar_inventario_quimico','wappy_registrar_producto_quimico','wappy_consultar_vehiculos','wappy_registrar_vehiculo','wappy_consultar_reportes_actos_condiciones','wappy_registrar_reporte_acto_condicion','wappy_consultar_casos_atel','wappy_registrar_caso_atel','wappy_consultar_cronograma_sst','wappy_crear_actividad_cronograma','wappy_actualizar_estado_tarea','wappy_consultar_capacitaciones','wappy_programar_capacitacion','wappy_consultar_auditorias','wappy_registrar_hallazgo_auditoria','wappy_consultar_agentes_y_automatizaciones','wappy_crear_agente','wappy_actualizar_agente','wappy_eliminar_agente','wappy_ejecutar_accion_usuario','wappy_programar_automatizacion','wappy_consultar_conversaciones','wappy_consultar_mensajes_conversacion','wappy_consultar_archivos'."
                                    },
                                    parametros: {
                                        type: "object",
                                        description: "Argumentos de la herramienta MCP.",
                                        properties: {
                                            id: { type: "string" },
                                            cedula: { type: "string" },
                                            nombre: { type: "string" },
                                            name: { type: "string" },
                                            description: { type: "string" },
                                            category: { type: "string", description: "'sgsst'|'legal'|'medicina'|'general'" },
                                            instructions: { type: "string" },
                                            model: { type: "string", description: "'gemini-3.5-flash-lite'|'gemini-3.6-flash'|'gemini-3.8-flash'|'gemini-4-hydrogen'" },
                                            temperature: { type: "number" },
                                            tools: { type: "array", items: { type: "string" } },
                                            incluirTodasLasHerramientas: { type: "boolean" },
                                            skills: { type: "array", items: { type: "string" } },
                                            conversation_starters: { type: "array", items: { type: "string" } },
                                            avatar_url: { type: "string" },
                                            agent_ids: { type: "array", items: { type: "string" } },
                                            cargo: { type: "string" },
                                            filtro: { type: "string" },
                                            estado: { type: "string" },
                                            datos: { type: "string" }
                                        }
                                    }
                                },
                                required: ["herramienta"]
                            }
                        },
                        {
                            name: "wappy_crear_agente",
                            description: "Crea un Agente de IA con sus 9 puntos. Entrevista primero si el usuario no ha definido los puntos.",
                            parameters: {
                                type: "object",
                                properties: {
                                    name: { type: "string", description: "Nombre del agente" },
                                    description: { type: "string", description: "Especialidad breve" },
                                    category: { type: "string", description: "'sgsst'|'legal'|'medicina'|'general'" },
                                    instructions: { type: "string", description: "System Prompt / instrucciones" },
                                    model: { type: "string", description: "'gemini-3.5-flash-lite'|'gemini-3.6-flash'|'gemini-3.8-flash'|'gemini-4-hydrogen'" },
                                    temperature: { type: "number", description: "0.0-1.0 (defecto 0.2)" },
                                    tools: { type: "array", items: { type: "string" }, description: "['todas'] o ['sst','google','notebooklm','antigravity','flow','canvas','web_search','matriz_ipevar','matriz_pesv','matriz_compatibilidad']" },
                                    incluirTodasLasHerramientas: { type: "boolean" },
                                    skills: { type: "array", items: { type: "string" } },
                                    conversation_starters: { type: "array", items: { type: "string" } },
                                    avatar_url: { type: "string" },
                                    agent_ids: { type: "array", items: { type: "string" } }
                                },
                                required: ["name"]
                            }
                        },
                        {
                            name: "wappy_actualizar_agente",
                            description: "Edita los 9 puntos de un Agente de IA existente por ID o nombre.",
                            parameters: {
                                type: "object",
                                properties: {
                                    id: { type: "string", description: "ID (agent_xxx) o nombre actual" },
                                    nuevo_nombre: { type: "string" },
                                    description: { type: "string" },
                                    category: { type: "string" },
                                    instructions: { type: "string" },
                                    model: { type: "string", description: "'gemini-3.5-flash-lite'|'gemini-3.6-flash'|'gemini-3.8-flash'|'gemini-4-hydrogen'" },
                                    temperature: { type: "number" },
                                    tools: { type: "array", items: { type: "string" } },
                                    agregar_herramientas: { type: "array", items: { type: "string" } },
                                    quitar_herramientas: { type: "array", items: { type: "string" } },
                                    skills: { type: "array", items: { type: "string" } },
                                    conversation_starters: { type: "array", items: { type: "string" } },
                                    avatar_url: { type: "string" },
                                    agent_ids: { type: "array", items: { type: "string" } }
                                },
                                required: ["id"]
                            }
                        },
                        {
                            name: "wappy_eliminar_agente",
                            description: "Elimina un Agente de IA propio del usuario por su ID o nombre exacto.",
                            parameters: {
                                type: "object",
                                properties: {
                                    id: { type: "string", description: "ID (agent_xxx) o nombre exacto del agente a eliminar." }
                                },
                                required: ["id"]
                            }
                        },
                        {
                            name: "wappy_consultar_agentes_y_automatizaciones",
                            description: "Consulta el catálogo completo de Agentes de IA existentes (propios y del sistema), el catálogo de herramientas y skills disponibles, y las automatizaciones programadas.",
                            parameters: {
                                type: "object",
                                properties: {
                                    dummy: { type: "string", description: "Parámetro opcional" }
                                }
                            }
                        },
                        {
                            name: "wappy_ejecutar_accion_usuario",
                            description: "Ejecuta cualquier acción u operación dentro de la cuenta del usuario conectado (memorias, conversaciones, lienzo Canvas, subusuarios, ajustes o cualquier ruta interna /api/... permitida para su rol).",
                            parameters: {
                                type: "object",
                                properties: {
                                    modulo: { type: "string", description: "Módulo directo: 'memorias', 'conversaciones' o 'canvas' (opcional si usas ruta)." },
                                    operacion: { type: "string", description: "Operación: 'listar', 'crear', 'guardar', 'actualizar' o 'eliminar'." },
                                    ruta: { type: "string", description: "Ruta interna de la API (ej: '/api/memories', '/api/convos', '/api/sub-users')." },
                                    metodo: { type: "string", description: "'GET', 'POST', 'PUT', 'PATCH' o 'DELETE'." },
                                    datos: { type: "object", description: "Cuerpo o parámetros de la petición." }
                                }
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
                            name: "wappy_memoria_procedimental",
                            description: "Gestiona la Memoria Procedural y de Hábitos Operativos de la empresa (estilo OpenBot). Permite guardar, listar o eliminar costumbres, flujos de aprobación o reglas operativas de la organización para aplicarlas automáticamente en sesiones futuras.",
                            parameters: {
                                type: "object",
                                properties: {
                                    accion: {
                                        type: "string",
                                        enum: ["guardar", "listar", "eliminar"],
                                        description: "Acción a realizar: 'guardar', 'listar' o 'eliminar'."
                                    },
                                    trigger: {
                                        type: "string",
                                        description: "Situación o disparador en que aplica el hábito (ej: 'Al cerrar investigación ATEL', 'En informes mensuales')."
                                    },
                                    regla: {
                                        type: "string",
                                        description: "Regla operativa o hábito a cumplir (ej: 'Notificar siempre primero a la Dra. María')."
                                    },
                                    categoria: {
                                        type: "string",
                                        description: "Categoría: 'habito_operativo', 'flujo_aprobacion', 'notificacion', 'criterio_tecnico' o 'preferencia_formato'."
                                    },
                                    id: {
                                        type: "string",
                                        description: "ID o palabra clave del hábito a eliminar."
                                    }
                                },
                                required: ["accion"]
                            }
                        },
                        {
                            name: "wappy_renderizar_widget_interactivo",
                            description: "Generative UI (AG-UI): Proyecta y renderiza una tarjeta o widget interactivo directamente en el chat del usuario (ej: Simulador/Calculadora de Riesgo GTC-45 NDxNExNC con sliders en vivo, o Checklist Interactivo de Inspección SST).",
                            parameters: {
                                type: "object",
                                properties: {
                                    tipo_widget: {
                                        type: "string",
                                        enum: ["risk_calculator", "inspection_checklist"],
                                        description: "Tipo de widget: 'risk_calculator' (Simulador GTC-45) o 'inspection_checklist' (Lista de verificación interactiva)."
                                    },
                                    titulo: {
                                        type: "string",
                                        description: "Título del widget interactivo."
                                    },
                                    subtitulo: {
                                        type: "string",
                                        description: "Subtítulo o contexto normativo."
                                    },
                                    peligro: {
                                        type: "string",
                                        description: "Descripción del peligro a simular."
                                    },
                                    proceso: {
                                        type: "string",
                                        description: "Proceso o cargo evaluado."
                                    },
                                    nd: {
                                        type: "number",
                                        description: "Nivel de Deficiencia inicial (0, 2, 6 o 10)."
                                    },
                                    ne: {
                                        type: "number",
                                        description: "Nivel de Exposición inicial (1, 2, 3 o 4)."
                                    },
                                    nc: {
                                        type: "number",
                                        description: "Nivel de Consecuencia inicial (10, 25, 60 o 100)."
                                    }
                                },
                                required: ["tipo_widget"]
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
                                        description: "Descripción del botón o campo de destino (ej: 'Generar IA', 'Generar informe', 'peligros', 'alcance', 'compromisos', 'abrir tarjeta')"
                                    },
                                    campo: {
                                        type: "string",
                                        description: "Nombre o etiqueta del campo a diligenciar si la acción es 'escribir' (ej: 'peligros', 'alcance', 'compromisos', 'objetivos', 'afectadoNombre')."
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
                            description: "MODO 3: Abre chat en pantalla con un especialista solo si el usuario pide abrir/ir a su chat y ya dijo qué consultar. Si solo pide el dictamen sin cambiar de pantalla usa 'consultar_agente_especializado'.",
                            parameters: {
                                type: "object",
                                properties: {
                                    agente: {
                                        type: "string",
                                        description: "Especialidad/nombre ('tenshi','abogado_laboral','medico_laboral','fisioterapeuta_laboral','ingeniero_quimico_sst','coordinador_seguridad_vial','psicologo_sst','terapeuta_salud_mental','nutricionista_laboral','primer_respondiente','coordinador_emergencias','especialista_bioseguridad','ingeniero_electricista_sst','coordinador_tareas_criticas','ingeniero_minas_sst','auditor_sg_sst','ingeniero_ambiental','especialista_riesgo_climatico','redactor_creativo','simulador_accidentes','coordinador_capacitaciones','profesional_sst','agente_sst')."
                                    },
                                    pregunta: {
                                        type: "string",
                                        description: "Consulta técnica estructurada con marco normativo colombiano."
                                    },
                                    nuevo_chat: {
                                        type: "boolean",
                                        description: "true para nuevo chat; false para continuar el hilo."
                                    }
                                },
                                required: ["agente", "pregunta"]
                            }
                        },
                        {
                            name: "wappy_iniciar_estudio_ergonomico_vivo",
                            description: "Inicia y abre de inmediato el Análisis Biomecánico y Estudio de Puesto de Trabajo Ergonómico EN VIVO por cámara y voz con la Fisioterapeuta Laboral (con exoesqueleto MediaPipe 3D, protocolo de 3 fases, matriz CIE-11 y 12 ejercicios de pausas activas ExerciseDB). INVÓCALA SIEMPRE que el usuario te diga que necesita, quiere o desea realizar/hacer un estudio de puesto de trabajo ergonómico, evaluación ergonómica en vivo o análisis biomecánico.",
                            parameters: {
                                type: "object",
                                properties: {
                                    trabajador: {
                                        type: "string",
                                        description: "Nombre del trabajador a evaluar si el usuario lo mencionó (opcional)."
                                    },
                                    cargo: {
                                        type: "string",
                                        description: "Cargo o puesto de trabajo a evaluar si el usuario lo mencionó (opcional)."
                                    }
                                }
                            }
                        },
                        {
                            name: "google_drive",
                            description: "Interactúa con Google Drive SOLO si el usuario dice 'Drive'/'Google Drive'. Para informes SG-SST usa siempre 'wappy_leer_informe_aplicativo'.",
                            parameters: {
                                type: "object",
                                properties: {
                                    action: {
                                        type: "string",
                                        enum: ["list_files_and_folders", "read_document_content", "create_folder", "write_file"],
                                        description: "Acción en Google Drive."
                                    },
                                    query: { type: "string", description: "Búsqueda o texto." },
                                    fileId: { type: "string", description: "ID del archivo." },
                                    fileName: { type: "string", description: "Nombre de archivo/carpeta." },
                                    parentId: { type: "string", description: "ID carpeta padre." }
                                },
                                required: ["action"]
                            }
                        },
                        {
                            name: "canvas_tool",
                            description: "Crea archivos descargables en el chat/Canvas: Word ('text'), Excel ('excel'), HTML interactivo ('html') o presentación ('presentation'). PROHIBIDO para informes de aplicativos SG-SST (usa 'wappy_generar_analisis_aplicativo' u 'operar_interfaz_visual').",
                            parameters: {
                                type: "object",
                                properties: {
                                    accion: { type: "string", enum: ["crear"], description: "Siempre 'crear'." },
                                    fileType: {
                                        type: "string",
                                        enum: ["html", "text", "excel", "presentation"],
                                        description: "'text'=Word, 'excel'=Excel, 'html'=app/landing, 'presentation'=diapositivas."
                                    },
                                    title: { type: "string", description: "Título del archivo." },
                                    content: { type: "string", description: "Contenido (opcional en 'html'; requerido en 'text'/'excel')." }
                                },
                                required: ["accion", "fileType", "title"]
                            }
                        },
                        {
                            name: "web_search",
                            description: "Consulta simultáneamente la Base de Datos Documental y Normativa Oficial de WAPPY (99+ documentos .md: Vademécum 2026, Resolución 1843 de 2025, Batería de Riesgo Psicosocial completa, manuales, sentencias y decretos) y busca información actualizada en tiempo real en Internet (SearXNG). Úsala SIEMPRE que el usuario pregunte por normatividad, guías, manuales o te pida buscar en tu base de datos.",
                            parameters: {
                                type: "object",
                                properties: {
                                    query: {
                                        type: "string",
                                        description: "La consulta de búsqueda a ejecutar en la base de datos normativa y en internet (ej: 'Resolución 1843 de 2025 exámenes médicos ocupacionales', 'batería riesgo psicosocial manual intralaboral')."
                                    }
                                },
                                required: ["query"]
                            }
                        },
                        {
                            name: "somos_sst",
                            description: "Consulta y edita el Motor Bio-Individual (trabajadores, exámenes, ATEL, hitos) y Ecosistema SOMOS SST (matrices, EPP, alturas, ATS, ACPM, informes HTML).",
                            parameters: {
                                type: "object",
                                properties: {
                                    accion: {
                                        type: "string",
                                        description: "'actualizar_informacion_empresa','consultar_expediente_integral','listar_trabajadores','resumen_empresa','actualizar_examen_medico','registrar_accidente_atel','actualizar_hito_tarea','editar_cualquier_aplicativo','generar_informe_html','consultar_historial_informes','consultar_planes_y_sistema','consultar_centro_control_acpm','crear_actividad_acpm','actualizar_actividad_acpm','crear_trabajador'."
                                    },
                                    razon_social: { type: "string" },
                                    tipo_empresa: { type: "string", description: "'Persona Jurídica'|'Persona Natural'" },
                                    nit: { type: "string" },
                                    representante_legal: { type: "string" },
                                    cedula_representante: { type: "string" },
                                    numero_trabajadores: { type: "number" },
                                    arl: { type: "string" },
                                    actividad_economica: { type: "string" },
                                    nivel_riesgo: { type: "string", description: "I-V" },
                                    ciiu: { type: "string" },
                                    direccion: { type: "string" },
                                    ciudad: { type: "string" },
                                    departamento: { type: "string" },
                                    telefono: { type: "string" },
                                    correo: { type: "string" },
                                    datos_json: { type: "string" },
                                    tipo_informe: { type: "string" },
                                    titulo_informe: { type: "string" },
                                    contenido_html: { type: "string" },
                                    nombre_o_cargo: { type: "string" },
                                    identificacion: { type: "string" },
                                    fecha_examen: { type: "string", description: "YYYY-MM-DD" },
                                    concepto_diagnostico: { type: "string" },
                                    restricciones: { type: "string" },
                                    tipo_siniestro: { type: "string", description: "'AT'|'EL'|'Ausentismo'" },
                                    dias_incapacidad: { type: "string" },
                                    descripcion_hechos: { type: "string" },
                                    nombre_aplicativo: {
                                        type: "string",
                                        description: "'empresa'|'cargos'|'estudio_puesto'|'auditoria'|'diagnostico'|'epp'|'alturas'|'ats'|'vehiculos'|'capacitaciones'|'gtc45'|'owas'|'actos'|'vulnerabilidad'|'quimicos'|'kanban'|'politica'|'matriz_legal'|'rhs'|'rit'|'estadisticas'."
                                    },
                                    propiedad_o_ruta: { type: "string" },
                                    nuevo_valor: { type: "string" },
                                    titulo_actividad: { type: "string" },
                                    descripcion_actividad: { type: "string" },
                                    fecha_vencimiento: { type: "string", description: "YYYY-MM-DD" },
                                    estado_actividad: { type: "string", description: "'todo'|'due_soon'|'overdue'|'done'" },
                                    tipo_actividad: { type: "string", description: "'manual'|'medical_exam'|'training'|'other'" }
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
                            description: "Gestiona Tareas/Flujos en /tareas (activar, pausar/desactivar, listar, actualizar, ejecutar o eliminar) pasando SIEMPRE el nombre exacto o palabras temáticas dichas por el usuario (o ID / 'todas') sin inventar códigos ni activar un flujo distinto si no hay coincidencia exacta; ejecuta al instante cualquiera de los 16 Flujos Tenshi globales (accion='ejecutar_tenshi' — 6 OSINT/Forense + 10 Somos SST activos para todos los usuarios); crea flujos DAG completos coherentes (accion='crear' solo cuando el usuario lo pida explícitamente) con disparadores, comando Tenshi, Hitos fuente, herramientas IA, extractores, condición SI/NO, salidas y modelo IA vigente; y consulta la Enciclopedia SmartDown oficial de Nodos de /tareas (accion='consultar_documentacion_nodos' con busqueda_nodo).",
                            parameters: {
                                type: "object",
                                properties: {
                                    accion: { type: "string", description: "'ejecutar_tenshi','consultar_documentacion_nodos','crear','listar','actualizar','activar','desactivar','activar_todas','desactivar_todas','eliminar','eliminar_todas','ejecutar_ahora','detener','ver_logs'" },
                                    busqueda_nodo: { type: "string", description: "Nombre, ID técnico, categoría, Hito o palabra clave del nodo o grupo de nodos a consultar en la Enciclopedia SmartDown (ej. 'forense incapacidad', 'condicion si no', 'alturas', 'rethus', 'disparadores', 'todos')" },
                                    nombre: { type: "string", description: "Nombre exacto, frase temática o comando de activación dicho por el usuario (o título del nuevo flujo al crear). Jamás inventar códigos." },
                                    nuevo_nombre: { type: "string", description: "Nuevo nombre si se desea renombrar un flujo existente" },
                                    agente_objetivo: { type: "string", description: "Agente IA que ejecutará el flujo (ej. 'Consultor SG-SST', 'Médico Laboral', 'Auditor SG-SST', 'Tenshi')" },
                                    prompt_a_ejecutar: { type: "string", description: "Instrucción técnica detallada que ejecutará el Agente IA dentro del flujo DAG al crear o actualizar" },
                                    instruccion_usuario: { type: "string", description: "Instrucción literal, pregunta o parámetro dicho por el usuario para alimentar el flujo al ejecutarlo" },
                                    esperar_resultado: { type: "boolean", description: "Si es true (por defecto en ejecutar_tenshi), espera de forma síncrona el resultado final del flujo para responder al instante" },
                                    tipo_frecuencia: { type: "string", description: "'daily'|'weekly'|'monthly'|'hourly'" },
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
                                    automatizacion_id: { type: "string", description: "ID de 24 caracteres, nombre exacto, comando Tenshi o palabras temáticas dichas por el usuario, o 'todas'. Jamás inventar códigos ni elegir un flujo diferente." },
                                    nuevo_estado: { type: "string", description: "'active'|'inactive'" },
                                    disparadores: {
                                        type: "array",
                                        items: { type: "string" },
                                        description: "Lista de disparadores del flujo DAG al crear (ej. 'schedule_cron', 'trigger_tenshi', 'trigger_email', 'trigger_qr_worker', 'trigger_webhook')."
                                    },
                                    comando_tenshi: {
                                        type: "string",
                                        description: "Frase o comando descriptivo de voz/chat Tenshi para invocar el nuevo flujo cuando usa 'trigger_tenshi' (sin códigos inventados)."
                                    },
                                    hitos_fuente: {
                                        type: "array",
                                        items: { type: "string" },
                                        description: "IDs de Hitos/módulos de Somos SST a conectar como fuentes del DAG (ej. 'hito1_diagnostico_0312', 'hito2_perfil_socio', 'hito2_condiciones_salud', 'hito2_matriz_ipevar', 'hito3_epp', 'hito3_alturas', 'hito4_actos_condiciones', 'hito5_capacitaciones', 'hito7_estadisticas_atel', 'hito7_acpm')."
                                    },
                                    herramientas_ia: {
                                        type: "array",
                                        items: { type: "string" },
                                        description: "IDs de herramientas especializadas conectadas al Agente IA en el DAG (ej. 'scraper_agy_arl_directo', 'scraper_agy_alto_riesgo', 'scraper_agy_vial_pesv', 'scraper_agy_antecedentes', 'forensic_doc_verifier', 'google_drive', 'google_gmail', 'google_calendar', 'google_flow', 'web_search')."
                                    },
                                    extractores: {
                                        type: "array",
                                        items: { type: "string" },
                                        description: "Nodos extractores previos al Agente IA en el DAG (ej. 'extract_drive', 'extract_gmail', 'extract_ai_doc_ocr', 'extract_pc_folder')."
                                    },
                                    salidas: {
                                        type: "array",
                                        items: { type: "string" },
                                        description: "Nodos de salida/acción al completar el DAG (ej. 'wappy_notification', 'email_report', 'acpm_task', 'canvas_doc', 'google_calendar', 'google_sheets')."
                                    },
                                    incluir_condicion_if: {
                                        type: "boolean",
                                        description: "Si es true, inserta una compuerta lógica Condición SI/NO (if_router) en el flujo DAG."
                                    },
                                    condicion_if: {
                                        type: "string",
                                        description: "Condición o regla lógica de la compuerta SI/NO del DAG (ej. '¿Existen vencimientos críticos o hallazgos abiertos?')."
                                    },
                                    modelo_ia: {
                                        type: "string",
                                        description: "Modelo Gemini vigente del sistema para el nodo LLM del DAG: 'gemini-3.5-flash-lite' (por defecto), 'gemini-3.6-flash', 'gemini-3.8-flash' o 'gemini-4-hydrogen'."
                                    },
                                    crear_como_flujo_tenshi: {
                                        type: "boolean",
                                        description: "Si es true (requiere permiso), crea el flujo DAG como Flujo Tenshi instantáneo; por defecto false (flujo en /tareas de la empresa activa)."
                                    }
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
                            description: "Envía correos electrónicos, crea borradores, busca/lista correos, lee correos, mueve correos a la papelera (individual o en lote) y los elimina definitivamente en Gmail desde la cuenta del usuario.",
                            parameters: {
                                type: "object",
                                properties: {
                                    action: { type: "string", description: "'send_email', 'create_draft', 'list_emails', 'read_email', 'trash_email', 'batch_trash_emails' o 'delete_email'" },
                                    to: { type: "string", description: "Dirección de correo electrónico del destinatario (para send_email o create_draft)" },
                                    subject: { type: "string", description: "Asunto del correo electrónico" },
                                    body: { type: "string", description: "Contenido del mensaje (HTML o texto)" },
                                    cc: { type: "string", description: "Correos en copia" },
                                    bcc: { type: "string", description: "Correos en copia oculta" },
                                    query: { type: "string", description: "Término de búsqueda o filtro para list_emails y batch_trash_emails (ej. 'is:unread', 'from:...', 'subject:...')" },
                                    maxResults: { type: "number", description: "Cantidad máxima de correos a listar o mover a la papelera (default 10 para list, 50 para batch)" },
                                    messageId: { type: "string", description: "ID del correo específico para read_email, trash_email o delete_email" }
                                },
                                required: ["action"]
                            }
                        },
                        {
                            name: "google_calendar",
                            description: "Interactúa con Google Calendar: crea eventos/recordatorios, lista o busca eventos para verificar disponibilidad, reprograma/edita citas existentes y elimina eventos.",
                            parameters: {
                                type: "object",
                                properties: {
                                    action: { type: "string", description: "'create_event', 'list_events', 'find_event', 'delete_event', 'update_event', 'reschedule_event'" },
                                    title: { type: "string", description: "Título o resumen del evento" },
                                    description: { type: "string", description: "Detalles del evento" },
                                    startTime: { type: "string", description: "Fecha y hora de inicio (ISO con Hora Colombia)" },
                                    endTime: { type: "string", description: "Fecha y hora de finalización (ISO)" },
                                    timeMin: { type: "string", description: "Fecha de inicio para listar eventos" },
                                    timeMax: { type: "string", description: "Fecha de fin para listar eventos" },
                                    eventId: { type: "string", description: "ID del evento a eliminar o reprogramar" },
                                    query: { type: "string", description: "Palabra clave o nombre del evento para buscar, reprogramar o eliminar sin ID exacto" },
                                    newStartTime: { type: "string", description: "Nueva fecha y hora de inicio para reprogramar el evento" },
                                    newEndTime: { type: "string", description: "Nueva fecha y hora de fin al reprogramar (opcional)" },
                                    newTitle: { type: "string", description: "Nuevo título si se modifica el evento" }
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
                            description: "MODO 2 — Subagente Efímero en Segundo Plano (SIN abrir otro chat en pantalla): Consulta internamente en segundo plano a un Agente Especialista del sistema (Médico Laboral, Abogado Laboral, Psicólogo SST, Auditor, etc.) y recibe su dictamen técnico para explicarlo verbalmente y dejarlo en el chat de Tenshi. PROHIBICIÓN ESTRICTA: SOLO invócala cuando el usuario pida literalmente el dictamen, concepto u opinión del especialista (ej: 'Quiero el dictamen formal del Abogado Laboral', 'Pregúntale al Médico qué opina'). Si el usuario pide ABRIR UN CHAT en pantalla ('Ábreme un chat con el médico laboral'), usa 'wappy_abrir_chat_agente'. Si el usuario solo hace una consulta técnica normal, responde tú misma directamente sin invocar esta herramienta.",
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
                            name: "consultar_multiples_especialistas_paralelo",
                            description: "MODO 2B — Mesa Técnica Multi-Agente en Paralelo (SIN cambiar de pantalla): Consulta SIMULTÁNEAMENTE en segundo plano a entre 2 y 4 Agentes Especialistas distintos (ej: Psicólogo SST + Abogado Laboral + Médico Laboral) ejecutando sus tareas en paralelo. Devuelve los dictámenes consolidados en el chat de Tenshi para que expliques las conclusiones por voz. Úsala SIEMPRE que el usuario pida consultar a 2 o más especialistas al tiempo, en paralelo o en una mesa técnica.",
                            parameters: {
                                type: "object",
                                properties: {
                                    consultas: {
                                        type: "array",
                                        description: "Lista de 2 a 4 consultas simultáneas en paralelo.",
                                        items: {
                                            type: "object",
                                            properties: {
                                                nombre_especialista: {
                                                    type: "string",
                                                    description: "Nombre o rol del especialista (ej: 'Psicólogo SST', 'Abogado Laboral', 'Médico Laboral', 'Terapeuta en Salud Mental', 'Fisioterapeuta Laboral', 'Auditor SG-SST')."
                                                },
                                                consulta_completa: {
                                                    type: "string",
                                                    description: "Consulta técnica concreta para este especialista."
                                                }
                                            },
                                            required: ["nombre_especialista", "consulta_completa"]
                                        }
                                    },
                                    sintesis_objetivo: {
                                        type: "string",
                                        description: "Objetivo opcional de la síntesis conjunta."
                                    }
                                },
                                required: ["consultas"]
                            }
                        },
                        {
                            name: "wappy_leer_informe_aplicativo",
                            description: "Lee el último informe guardado en el Historial de SOMOS SST para cualquier aplicativo o cargo. Úsala siempre para leer/consultar/enviar informes existentes.",
                            parameters: {
                                type: "object",
                                properties: {
                                    aplicativo: {
                                        type: "string",
                                        description: "'responsable','condiciones_salud','perfil_socio','politica','objetivos','diagnostico_0312','perfil_cargo','gtc45','investigacion_atel','pesv','quimicos','auditoria','vulnerabilidad','owas','estudio_puesto','ats','alturas','legal','comites','capacitaciones','epp','actos_condiciones','vehiculos','cronograma','alta_direccion','rit'."
                                    },
                                    cargo: { type: "string", description: "Cargo puntual si aplicativo='perfil_cargo'." },
                                    id: { type: "string", description: "ID opcional." }
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
                            name: "wappy_abrir_curso",
                            description: "Abre de inmediato en pantalla un curso específico de la Academia WAPPY LMS navegando a su vista interactiva (/training/:id/:slug). DEBES invocar esta herramienta INMEDIATAMENTE siempre que el usuario te pida abrir, ver, entrar o mostrar un curso formativo de la academia ('ábreme el de api key', 'abre el curso de primeros auxilios', 'quiero ver el curso de trabajo en alturas').",
                            parameters: {
                                type: "object",
                                properties: {
                                    curso: {
                                        type: "string",
                                        description: "Título, palabra clave, tema o ID del curso a abrir en pantalla (ej: 'API Key', 'Primeros Auxilios', 'Trabajo en Alturas')."
                                    }
                                },
                                required: ["curso"]
                            }
                        },
                        {
                            name: "wappy_abrir_articulo_blog",
                            description: "Abre de inmediato en pantalla un artículo específico del Blog técnico de WAPPY navegando a su vista de lectura (/blog/:id/:slug). DEBES invocar esta herramienta cuando el usuario te pida abrir, leer o ver una publicación o artículo del blog.",
                            parameters: {
                                type: "object",
                                properties: {
                                    articulo: {
                                        type: "string",
                                        description: "Título, tema, palabra clave o ID del artículo del blog a abrir."
                                    }
                                },
                                required: ["articulo"]
                            }
                        },
                        {
                            name: "wappy_activar_herramienta_agente",
                            description: "Activa y abre de inmediato en una pestaña dedicada junto a Canvas dentro de Tenshi cualquiera de las 12 herramientas especializadas con panel de los agentes de WAPPY: 'canvas', 'editor_live' (Editor en Vivo / documentos Word), 'editor_rit' (Editor de Reglamento Interno de Trabajo), 'matriz_ipevar' (Matriz GTC-45 IPEVR), 'matriz_pesv' (Matriz PESV), 'matriz_compatibilidad' (Matriz de Compatibilidad Química SGA), 'consultar_analitica_psicosocial' (Analítica Psicosocial y Clima/Ánimo), 'consultar_analitica_actos_condiciones' (Analítica de Actos y Condiciones Inseguras), 'gestor_automatizaciones' (Gestor de Automatizaciones y Tareas), 'wappy_investigar_trabajador_360' (Investigación OSINT 360° de trabajador), 'blog_editor' (Editor de Blog) y 'generar_imagen_sst' (Generador de Imágenes SST). Invócala SIEMPRE que el usuario pida activar, abrir o traer en pantalla una de estas herramientas.",
                            parameters: {
                                type: "object",
                                properties: {
                                    herramienta: {
                                        type: "string",
                                        enum: [
                                            "canvas",
                                            "editor_live",
                                            "editor_rit",
                                            "matriz_ipevar",
                                            "matriz_pesv",
                                            "matriz_compatibilidad",
                                            "consultar_analitica_psicosocial",
                                            "consultar_analitica_actos_condiciones",
                                            "gestor_automatizaciones",
                                            "wappy_investigar_trabajador_360",
                                            "blog_editor",
                                            "generar_imagen_sst"
                                        ],
                                        description: "ID canónico exacto de la herramienta con panel a abrir en pestaña junto a Canvas dentro de Tenshi: 'canvas', 'editor_live', 'editor_rit', 'matriz_ipevar', 'matriz_pesv', 'matriz_compatibilidad', 'consultar_analitica_psicosocial', 'consultar_analitica_actos_condiciones', 'gestor_automatizaciones', 'wappy_investigar_trabajador_360', 'blog_editor', 'generar_imagen_sst'."
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
                            description: "Crea un informe técnico SG-SST descargable (Word/Excel/HTML) para entregar en el chat de Tenshi. PROHIBIDO si piden generar informe de un aplicativo en pantalla (usa 'wappy_generar_analisis_aplicativo').",
                            parameters: {
                                type: "object",
                                properties: {
                                    titulo: { type: "string", description: "Título formal del informe." },
                                    aplicativo: { type: "string", description: "'investigacion_atel','gtc45','diagnostico_0312','perfil_cargo','perfil_socio','vulnerabilidad','owas','estudio_puesto','ats','alturas','legal','comites','capacitaciones','epp','actos_condiciones','pesv','quimicos','vehiculos','cronograma','auditoria','general'." },
                                    formato: { type: "string", enum: ["html", "text", "excel"], description: "'html'|'text'|'excel'." },
                                    contenido: { type: "string", description: "Contenido técnico con marco legal e indicadores." }
                                },
                                required: ["titulo", "aplicativo"]
                            }
                        },
                        {
                            name: "wappy_generar_analisis_aplicativo",
                            description: "Genera UN NUEVO informe IA dentro de un aplicativo SG-SST ('Generar con IA'). NUNCA la uses para leer o enviar informes existentes (usa 'wappy_leer_informe_aplicativo').",
                            parameters: {
                                type: "object",
                                properties: {
                                    aplicativo: { type: "string", description: "'responsable','politica','objetivos','legal','rit','perfil_cargo','diagnostico','vulnerabilidad','comites','capacitaciones','epp','quimicos','vehiculos','auditoria'." },
                                    instruccion_adicional: { type: "string" }
                                },
                                required: ["aplicativo"]
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
                            description: "Gestiona citas y eventos en Google Calendar y cronograma WAPPY (agendar, listar, reprogramar, actualizar, eliminar).",
                            parameters: {
                                type: "object",
                                properties: {
                                    accion: { type: "string", enum: ["agendar_evento", "listar_agenda", "reprogramar_evento", "actualizar_evento", "eliminar_evento"] },
                                    titulo: { type: "string" },
                                    fecha_inicio: { type: "string", description: "ISO / YYYY-MM-DD HH:mm Hora Colombia" },
                                    fecha_fin: { type: "string" },
                                    nueva_fecha: { type: "string" },
                                    nuevo_titulo: { type: "string" },
                                    descripcion: { type: "string" },
                                    tipo: { type: "string", description: "'manual'|'training'|'medical_exam'|'audit_finding'|'copasst_finding'|'other'" },
                                    id_evento: { type: "string", description: "ID o palabra clave" }
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
                                properties: {
                                    empresa_id: {
                                        type: "string",
                                        description: "ID o nombre opcional de la empresa a consultar."
                                    }
                                }
                            }
                        },
                        {
                            name: "wappy_consultar_analitica_actos_condiciones",
                            description: "Consulta las estadísticas y métricas analíticas de los reportes preventivos de actos y condiciones inseguras reportados por los colaboradores (desglose por tipo, nivel de riesgo alto/medio/bajo, sedes y áreas con mayor recurrencia).",
                            parameters: {
                                type: "object",
                                properties: {
                                    empresa_id: {
                                        type: "string",
                                        description: "ID o nombre opcional de la empresa a consultar."
                                    }
                                }
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
                            description: "Delega una orden a Google Antigravity (incluye fotos/video de cámara si está activa). PROHIBIDO usarla si el usuario no dice explícitamente 'Antigravity' (sin 'Antigravity' usa canvas_tool).",
                            parameters: {
                                type: "object",
                                properties: {
                                    instruccion: { type: "string" },
                                    carpeta_o_recurso: { type: "string", description: "Ruta PC o Google Drive" },
                                    tipo_entregable: { type: "string", description: "'respuesta' (defecto consulta), 'copia_archivo', 'documento'/'word', 'html', 'excel', 'presentacion'." },
                                    titulo: { type: "string" },
                                    archivos: { type: "array", items: { type: "string" } },
                                    entorno_destino: { type: "string", description: "'local'|'cloud'|'auto'" }
                                },
                                required: ["instruccion"]
                            }
                        },
                        {
                            name: "notebooklm_listar_cuadernos",
                            description: "Consulta y lista todos los cuadernos vinculados en Google NotebookLM / Gemini Notebook del usuario. Úsala siempre que el usuario te pregunte qué cuadernos tiene, cuáles están en su NotebookLM o pida ver sus fuentes bibliográficas.",
                            parameters: {
                                type: "object",
                                properties: {
                                    dummy: { type: "string", description: "Parámetro opcional de búsqueda o filtro" }
                                }
                            }
                        },
                        {
                            name: "notebooklm_consultar",
                            description: "Realiza una consulta documental fundamentada (Grounded RAG) sobre los cuadernos y fuentes de Google NotebookLM / Gemini Notebook del usuario. Extrae respuestas directas con citas bibliográficas normativas verificables. Úsala de inmediato cuando el usuario pregunte por sus apuntes, normatividad cargada en NotebookLM o pida resolver dudas con base en sus documentos.",
                            parameters: {
                                type: "object",
                                properties: {
                                    cuaderno: {
                                        type: "string",
                                        description: "Nombre, título o ID del cuaderno a consultar en NotebookLM."
                                    },
                                    pregunta: {
                                        type: "string",
                                        description: "Pregunta o consulta técnica detallada que se contrastará contra los documentos del cuaderno."
                                    }
                                },
                                required: ["cuaderno", "pregunta"]
                            }
                        },
                        {
                            name: "notebooklm_generar_studio",
                            description: "Genera artefactos de estudio o multimedia en el Studio de Google NotebookLM a partir de las fuentes del cuaderno: video explicativo ('video'), infografía ('infographic'), presentación de diapositivas ('slide_deck'), tabla de datos ('data_table'), podcast ('audio'), cuestionario ('quiz'), informe ejecutivo ('report'), fichas ('flashcards') o mapa conceptual ('mind_map').",
                            parameters: {
                                type: "object",
                                properties: {
                                    cuaderno: {
                                        type: "string",
                                        description: "Nombre o ID del cuaderno en NotebookLM."
                                    },
                                    tipo_artefacto: {
                                        type: "string",
                                        description: "Tipo de contenido a generar: 'video', 'infographic', 'slide_deck', 'data_table', 'audio' (podcast), 'quiz' (cuestionario), 'report' (informe), 'flashcards' (fichas) o 'mind_map' (mapa conceptual)."
                                    },
                                    instrucciones: {
                                        type: "string",
                                        description: "Instrucciones de enfoque o temas prioritarios para la generación."
                                    }
                                },
                                required: ["cuaderno", "tipo_artefacto"]
                            }
                        },
{
          "name": "notebooklm_crear_cuaderno",
          "description": "Crea un nuevo cuaderno en Google NotebookLM / Gemini Notebook con el título especificado. Úsala cuando el usuario te pida crear o abrir un nuevo cuaderno de investigación o SST.",
          "parameters": {
                    "type": "object",
                    "properties": {
                          "titulo": {
                                    "type": "string",
                                    "description": "Título o nombre del nuevo cuaderno a crear en NotebookLM."
                          }
                    },
                    "required": [
                          "titulo"
                    ]
          }
},
{
          "name": "notebooklm_listar_fuentes",
          "description": "Lista todas las fuentes, documentos PDF, textos y enlaces cargados dentro de un cuaderno específico de Google NotebookLM.",
          "parameters": {
                    "type": "object",
                    "properties": {
                          "cuaderno": {
                                    "type": "string",
                                    "description": "Nombre o ID del cuaderno en NotebookLM."
                          }
                    },
                    "required": [
                          "cuaderno"
                    ]
          }
},
{
          "name": "notebooklm_agregar_fuente",
          "description": "Agrega una nueva fuente documental (enlace web/YouTube o texto/nota) a un cuaderno existente de Google NotebookLM.",
          "parameters": {
                    "type": "object",
                    "properties": {
                          "cuaderno": {
                                    "type": "string",
                                    "description": "Nombre o ID del cuaderno en NotebookLM."
                          },
                          "tipo_fuente": {
                                    "type": "string",
                                    "description": "Tipo de fuente: 'url' (enlace web o YouTube) o 'text' (texto plano o nota)."
                          },
                          "url": {
                                    "type": "string",
                                    "description": "URL del enlace web o video de YouTube (si tipo_fuente es 'url')."
                          },
                          "texto": {
                                    "type": "string",
                                    "description": "Texto completo de la nota o documento a incorporar (si tipo_fuente es 'text')."
                          },
                          "titulo": {
                                    "type": "string",
                                    "description": "Título descriptivo de la fuente o nota."
                          }
                    },
                    "required": [
                          "cuaderno",
                          "tipo_fuente"
                    ]
          }
},
{
          "name": "notebooklm_estado_studio",
          "description": "Consulta el avance o estado de una generación en el Studio de Google NotebookLM (podcast de audio, cuestionario, informe, etc.) por su task_id.",
          "parameters": {
                    "type": "object",
                    "properties": {
                          "task_id": {
                                    "type": "string",
                                    "description": "ID de la tarea retornado al solicitar la generación en el Studio."
                          },
                          "cuaderno": {
                                    "type": "string",
                                    "description": "Nombre o ID del cuaderno (opcional)."
                          }
                    },
                    "required": [
                          "task_id"
                    ]
          }
},
{
          "name": "notebooklm_listar_artefactos",
          "description": "Lista todos los artefactos generados en el Studio de un cuaderno (audios generados, podcasts, cuestionarios, informes, guías de estudio, etc.).",
          "parameters": {
                    "type": "object",
                    "properties": {
                          "cuaderno": {
                                    "type": "string",
                                    "description": "Nombre o ID del cuaderno en NotebookLM."
                          }
                    },
                    "required": [
                          "cuaderno"
                    ]
          }
},
{
          "name": "notebooklm_descargar_artefacto",
          "description": "Obtiene el enlace o descarga un artefacto generado en el Studio de Google NotebookLM (audio MP3, podcast, cuestionario, etc.) por su ID.",
          "parameters": {
                    "type": "object",
                    "properties": {
                          "artifact_id": {
                                    "type": "string",
                                    "description": "ID del artefacto generado en el Studio."
                          },
                          "cuaderno": {
                                    "type": "string",
                                    "description": "Nombre o ID del cuaderno en NotebookLM."
                          }
                    },
                    "required": [
                          "artifact_id"
                    ]
          }
},
{
          "name": "notebooklm_investigar_web",
          "description": "Inicia una investigación profunda en la web (Deep Research) mediante Google NotebookLM para descubrir e incorporar fuentes sobre un tema de SST.",
          "parameters": {
                    "type": "object",
                    "properties": {
                          "cuaderno": {
                                    "type": "string",
                                    "description": "Nombre o ID del cuaderno en NotebookLM."
                          },
                          "consulta": {
                                    "type": "string",
                                    "description": "Tema o pregunta de investigación web para recopilar fuentes."
                          },
                          "modo": {
                                    "type": "string",
                                    "description": "Modo de investigación: 'fast' o 'deep'."
                          }
                    },
                    "required": [
                          "cuaderno",
                          "consulta"
                    ]
          }
},
{
          "name": "notebooklm_importar_investigacion",
          "description": "Importa los resultados de una investigación web profunda como fuentes definitivas dentro del cuaderno de NotebookLM.",
          "parameters": {
                    "type": "object",
                    "properties": {
                          "cuaderno": {
                                    "type": "string",
                                    "description": "Nombre o ID del cuaderno en NotebookLM."
                          },
                          "task_id": {
                                    "type": "string",
                                    "description": "ID de la tarea de investigación obtenido con notebooklm_investigar_web."
                          }
                    },
                    "required": [
                          "cuaderno",
                          "task_id"
                    ]
          }
},
{
          "name": "google_flow_generar_imagen",
          "description": "Genera una imagen fotorrealista o ilustración en alta resolución con Google Flow Studio (Nano Banana 2 Lite) y la descarga en el servidor de WAPPY con retención de 30 días (/images/flow_img_*.jpg) para mostrarla en el chat o usarla en Canvas.",
          "parameters": {
                    "type": "object",
                    "properties": {
                          "prompt": {
                                    "type": "string",
                                    "description": "Descripción visual detallada de la imagen a generar."
                          },
                          "aspecto": {
                                    "type": "string",
                                    "enum": [
                                              "16:9",
                                              "9:16",
                                              "1:1"
                                    ],
                                    "description": "Relación de aspecto: '16:9' (horizontal), '9:16' (vertical) o '1:1' (cuadrada)."
                          },
                          "estilo": {
                                    "type": "string",
                                    "enum": [
                                              "fotorrealista",
                                              "3d_render",
                                              "ilustracion_tecnica",
                                              "afiche_seguridad"
                                    ],
                                    "description": "Estilo visual de la imagen."
                          }
                    },
                    "required": [
                          "prompt"
                    ]
          }
},
{
          "name": "google_flow_generar_video",
          "description": "Genera un clip de video cinematográfico en MP4 con Google Flow Studio (Veo 3.1 Lite) y lo descarga en el servidor de WAPPY con retención de 30 días (/images/flow_vid_*.mp4) para reproducirlo en pantalla o incrustarlo en Canvas.",
          "parameters": {
                    "type": "object",
                    "properties": {
                          "prompt": {
                                    "type": "string",
                                    "description": "Descripción cinematográfica detallada del video a generar."
                          },
                          "aspecto": {
                                    "type": "string",
                                    "enum": [
                                              "16:9",
                                              "9:16"
                                    ],
                                    "description": "Relación de aspecto: '16:9' (horizontal) o '9:16' (vertical/Reels)."
                          },
                          "movimiento_camara": {
                                    "type": "string",
                                    "enum": [
                                              "zoom_in",
                                              "zoom_out",
                                              "orbit",
                                              "pan_right",
                                              "pan_left"
                                    ],
                                    "description": "Movimiento de cámara en la escena."
                          }
                    },
                    "required": [
                          "prompt"
                    ]
          }
},
{
          "name": "google_flow_listar_recursos",
          "description": "Lista todas las imágenes, videos, infografías y podcasts descargados en el servidor de WAPPY desde Google Flow (flow_*) y Google NotebookLM (nlm_*) en los últimos 30 días, con sus URLs locales (/images/...) listas para usarse en cualquier lienzo de Canvas (Word, Presentaciones, Aplicativos HTML).",
          "parameters": {
                    "type": "object",
                    "properties": {
                          "filtro": {
                                    "type": "string",
                                    "enum": [
                                              "all",
                                              "flow",
                                              "notebooklm"
                                    ],
                                    "description": "Filtro de fuente: 'all' (todos), 'flow' (solo Google Flow) o 'notebooklm' (solo Google NotebookLM)."
                          }
                    }
          }
},
{
          "name": "wappy_consultar_rehabilitacion_medlineplus",
          "description": "Consulta en vivo la API oficial en español de MedlinePlus Connect (NIH / Biblioteca Nacional de Medicina de EE. UU.) para obtener guías de salud ocupacional, folletos de prevención y recomendaciones de ejercicios y pausas activas de Fisioterapia laboral (ExerciseDB) según el código CIE-10 (ej: M54.2 para cervicalgia, G56.0 para túnel del carpo, M54.5 para dolor de espalda, M75.1 para manguito rotador) o el segmento anatómico (cervical, lumbar, muñeca, hombro, codo).",
          "parameters": {
                    "type": "object",
                    "properties": {
                          "codigo": {
                                    "type": "string",
                                    "description": "Código CIE-10 de la patología osteomuscular (ej: M54.2, G56.0, M54.5, M75.1, M77.1)."
                          },
                          "segmento": {
                                    "type": "string",
                                    "description": "Segmento anatómico o zona muscular a intervenir: 'cervical', 'lumbar', 'muñeca', 'hombro', 'codo' u 'ocular'."
                          }
                    }
          }
},
{
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
},
{
    name: "wappy_buscar_historial_instantaneo",
    description: "Búsqueda Instantánea de Historial (< 5ms, estilo BM25 sin gastar tokens): Busca en todas las conversaciones pasadas de Tenshi, chats con especialistas e informes SG-SST por palabras clave, nombres de trabajadores, cédulas, accidentes o normas.",
    parameters: {
        type: "object",
        properties: {
            consulta: {
                type: "string",
                description: "Término, nombre de trabajador, cédula, norma o tema a buscar en el historial."
            },
            limite: {
                type: "number",
                description: "Cantidad máxima de resultados a retornar (por defecto 8)."
            }
        },
        required: ["consulta"]
    }
}
                    ]
                }
            ];
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

            this.liveConfig.systemInstruction = `[ZONA HORARIA Y FECHA ACTUAL EN COLOMBIA]:
- Operas en Colombia (America/Bogota, UTC-5). Fecha y hora actual: ${nowColombiaStr}.
- Toda fecha u hora ("hoy", "mañana", "a las 3pm") debe interpretarse y enviarse SIEMPRE en hora Colombia con offset '-05:00' (ej: '2026-10-16T15:00:00-05:00') en 'google_calendar' y 'wappy_gestionar_agenda'.

[CONDUCTA Y PROFESIONALISMO]:
- Si ya confirmaste en español o recibes un turno silencioso, mantente en silencio esperando al usuario sin rellenos.
- PROHIBICIÓN ABSOLUTA DE DISCLAIMERS PATERNALISTAS: Nunca digas "esto no es consejo médico/jurídico", "recuerda consultar a un profesional" ni "como IA". WAPPY es una plataforma empresarial profesional de SG-SST; responde con rigor técnico directo.

[CONTROL DE VIDEOLLAMADA Y COLGAR POR VOZ ('wappy_controlar_videollamada')]:
- Activar cámara/video ("activa videollamada/cámara/video", "enciende/pon la cámara"): SOLO bajo solicitud explícita e inequívoca; invoca 'wappy_controlar_videollamada' ({ accion: 'activar_camara' }) y confirma breve: "¡Listo! Iniciando videollamada en vivo." NUNCA actives cámara por tu cuenta ni ante menciones casuales o coloquiales.
- Apagar cámara ("apaga/desactiva la cámara/video/videollamada"): invoca { accion: 'apagar_camara' } y confirma: "Cámara apagada, continuamos por voz."
- Colgar/despedida explícita ("cuelga/termina/finaliza la llamada", "hasta luego", "gracias por todo", "eso es todo por hoy", "chao", "adiós", "nos vemos", "hasta pronto/mañana"): invoca { accion: 'colgar_llamada' } y despídete UNA SOLA VEZ en una frase breve.
- PROHIBIDO colgar o despedirse por silencio, ruido, sonidos ininteligibles o respuestas sueltas ("no", "nada", "ok", "listo"); ante "no" suelto di solo "Quedo atento cuando necesites algo más." SIN colgar. JAMÁS verbalices JSONs ni estados internos ("call_closing", "silentWait").
- PAUSAR/INTERRUMPIR NO ES COLGAR: Ante "para", "detente", "espera", "un momento", "silencio", "cállate", "basta", "no sigas", "ya" o "para ahí", detente, NO invoques 'wappy_controlar_videollamada' y di solo: "De acuerdo, te escucho." o "Listo, dime."

[VERACIDAD, GROUNDING, PANTALLA Y LECTURA DE DICTÁMENES]:
- PROHIBIDO afirmar que creaste un archivo, landing, informe, buscaste en Drive, pulsaste un botón o abriste un chat si NO invocaste el tool call en este mismo turno o no recibiste su resultado exitoso.
- AL INVOCAR 'canvas_tool': Di solo una frase breve de transición ("Estoy redactando y compilando el documento en tu pantalla con las tablas correspondientes, dame un momento...") y ESPERA la confirmación exitosa antes de decir que está listo.
- GOOGLE DRIVE VS CANVAS: Si preguntan por archivos propios en Google Drive o insisten en que existe un documento allí ("¿buscaste bien?"), NUNCA digas que creaste un documento; invoca 'google_drive' ({ action: 'list_files_and_folders' }) con palabras clave raíz (ej: "politica", "sst", "matriz" o "").
- LECTURA VISUAL DE PANTALLA ('leer_pantalla'): Cuando no sepas algo, el usuario diga que no ve lo que afirmas o pregunte por la pantalla ("¿qué ves?", "¿qué dice ahí?", "¿cuántos trabajadores ves?"), NO adivines ni insistas; invoca DE INMEDIATO 'leer_pantalla' y responde fielmente con lo visible.
- CERO CIFRAS INVENTADAS: Ante preguntas numéricas del SG-SST (trabajadores activos/retirados, accidentes, incapacidades, riesgos), invoca 'wappy_consultar_trabajadores', 'wappy_resumen_general_360' o 'leer_pantalla' antes de responder.
- AGILIDAD VS LECTURA DE DICTÁMENES: En saludos, confirmaciones y navegación sé conciso (1–2 oraciones). EXCEPCIÓN: Al recibir "[SISTEMA INTERNO WAPPY - RESPUESTA TÉCNICA EMITIDA]" o si piden "léelo/no lo resumas/qué dice exactamente", suspende la brevedad, usa 'leer_pantalla' si falta texto y explica fielmente los puntos clave, artículos, decretos y conclusiones sin reducirlo a una frase genérica.

[AGENDA PERSONAL, KANBAN, MÓDULOS Y PÁGINAS INSTITUCIONALES]:
- AGENDA PERSONAL ("¿qué tengo hoy/mañana?", "mis reuniones", "revisa mi agenda"): PRIORIZA SIEMPRE 'google_calendar' (action: 'list_events' con timeMin en hora Colombia) sobre el cronograma SST; indica si no hay eventos y menciona pendientes SST si aplica. Para "tareas del cronograma SST", usa 'wappy_mcp_sst' o 'somos_sst'.
- CENTRO DE CONTROL / KANBAN (/sgsst/control): PROHIBIDO listar tareas como lista plana; diferencia SIEMPRE las 4 etapas: 1) 'todo' (Por hacer), 2) 'due_soon' (Próximas a vencer), 3) 'overdue' (Vencidas), 4) 'done' (Completadas).
- NAVEGACIÓN ('wappy_navegar'): Marketplace/Tienda ('marketplace' -> /marketplace, consulta con 'wappy_consultar_marketplace' y consultarPedidos: true); Academia ('academia' -> /academia?tab=cursos, abrir curso con \`wappy_abrir_curso\`); Clases en Vivo/Meet ('clases_en_vivo' o 'events_meet' -> /academia?tab=meet); Blog ('blog' -> /blog, \`wappy_consultar_blog\`/\`wappy_abrir_articulo_blog\`/\`wappy_leer_articulo_blog\`); Empresas registradas ('empresas' o 'empresas_registradas'); Configuración ('configuracion' o 'settings'); Páginas institucionales donde puedes usar 'leer_pantalla': /planes ('planes'), /terms ('terms'), /privacy ('privacy'), /about ('about'); Regresar ('regresar', 'volver', 'chat_sst' o 'sgsst').

[CORRELACIÓN TEMPORAL Y CONTINUIDAD]:
- El hilo conductor lo marca el ÚLTIMO mensaje ([HILO CONDUCTOR ACTIVO Y VIGENTE]) y la pantalla abierta ahora. PROHIBIDO regresar a temas concluidos del pasado salvo solicitud explícita del usuario.

[ROL, EMPRESAS Y GESTIÓN DE TRABAJADORES]:
- Eres Tenshi, copiloto y orquestadora oficial de WAPPY IA y Somos SST, con control total de navegación, agentes, Drive, Canvas, formularios y la SUITE DE 41 OPERACIONES MCP DEL SG-SST ('wappy_resumen_general_360', 'wappy_mcp_sst').
- CENSO DE TRABAJADORES: 'wappy_consultar_trabajadores' retorna 'totalRegistrados', 'totalActivos' y 'totalRetirados'. NUNCA confundas registrados con activos (ej: "58 registrados: 57 activos y 1 retirado"); sigue exacto 'resumenCenso'.
- CICLO LABORAL: Retirar/desvincular -> invoca SIEMPRE 'wappy_retirar_trabajador' (conserva historial en 'Retirados'). Reintegrar/reactivar -> invoca SIEMPRE 'wappy_reintegrar_trabajador' (prohibido afirmarlo sin invocarla). Editar cargo/salario/datos -> 'wappy_actualizar_trabajador'.
- EMPRESAS (hasta 3 por usuario): Listar -> 'wappy_consultar_empresas' (reporta 'resumenTexto' y cuál está activa). Detalle (activa o inactiva) -> 'wappy_consultar_detalle_empresa'. Activar/cambiar empresa ("activa SERVICONSTRUCCIONES", "cambia a WAPPY SA") -> 'wappy_activar_empresa' o 'wappy_seleccionar_empresa'. Editar datos (NIT, ARL, representante, dirección, teléfono, etc.) -> 'wappy_actualizar_empresa'.

[ARQUITECTA DE AGENTES IA — ENTREVISTA PASO A PASO POR 9 PUNTOS ('wappy_crear_agente', 'wappy_actualizar_agente', 'wappy_eliminar_agente', 'wappy_consultar_agentes_y_automatizaciones')]:
- Tienes control total de propiedad (AGENT_OWNER) sobre Agentes en /agents. Los 9 puntos son: 1) Nombre ('name'), 2) Descripción ('description'), 3) Categoría ('category': 'sgsst'|'legal'|'medicina'|'general'), 4) Instrucciones/Prompt ('instructions'), 5) Modelo y Temperatura ('model': defecto 'gemini-3.5-flash-lite', o 'gemini-3.6-flash'/'gemini-3.8-flash'/'gemini-4-hydrogen'; 'temperature': 0.2), 6) Herramientas ('tools'/'incluirTodasLasHerramientas': ['todas'] = 63 herramientas, o ['sst'],['google'],['notebooklm'],['antigravity'],['flow'],['canvas'],['web_search']), 7) Skills ('skills': ['todas'] o específicas), 8) Frases Iniciadoras ('conversation_starters': 2–4), 9) Avatar y Subagentes ('avatar_url': defecto '/images/tenshi.png', 'agent_ids').
- ENTREVISTA OBLIGATORIA (salvo que pida "créalo ya tú misma con todo recomendado"): PROHIBIDO crear a ciegas en el 1er turno; guía en 4 pasos conversacionales: Paso 1 (Puntos 1–3 Identidad), Paso 2 (Punto 4 Rol/Normativa), Paso 3 (Puntos 5–7 Motor, Herramientas y Skills), Paso 4 (Puntos 8–9 Frases, Avatar y Subagentes). Si dice "sugiérelo tú"/"ponle todas", completa con criterio experto y avanza; al terminar invoca 'wappy_crear_agente'. Para editar usa 'wappy_actualizar_agente'.

[DECISIÓN DETERMINISTA DE INFORMES, CANVAS, CLICS Y ESPECIALISTAS]:
Clasifica cualquier pedido de informe/acción en estos 4 casos exactos:
1. MÓDULO APLICATIVO EN PANTALLA (/sgsst?...) ("haz el informe del aplicativo/responsable/política/objetivos", "dale clic en generar IA/análisis", "dale clic tú", "regenera el informe"):
   - Invoca DE INMEDIATO 'operar_interfaz_visual' ({ accion: 'click', detalle: 'Generar IA', texto: 'Generar IA' }) o 'wappy_generar_analisis_aplicativo'. Di solo "Generando el informe con IA en tu pantalla..." y espera resultado. PROHIBIDO usar 'canvas_tool', 'wappy_crear_informe' o 'generar_informe_inspeccion_camara'.
   - Si el usuario confronta ("no le has dado clic", "es mentiras"), discúlpate brevemente e invoca 'operar_interfaz_visual' al instante sin inventar datos viejos.
   - Para llenar/escribir campos en formularios: invoca 'operar_interfaz_visual' ({ accion: 'escribir', detalle: '<campo>', texto: '<contenido>' }) o 'wappy_diligenciar_formulario' y confirma oralmente.
2. INSPECCIÓN FÍSICA CON CÁMARA (3 fotos de evidencia: gafas, extintor, máquina, condición insegura, o reclamo tras cámara):
   - Invoca 'generar_informe_inspeccion_camara' o 'generar_informe_tecnico' con el motivo (se respalda en chat flotante y chat del Agente Tenshi).
3. ESPECIALISTAS TÉCNICOS:
   - MODO 1 (90%, duda técnica general): responde tú directo con sustento normativo sin llamar subagentes.
   - MODO 2 (dictamen de 1 especialista): invoca 'consultar_agente_especializado' en segundo plano.
   - MODO 2B (2–4 especialistas al tiempo / mesa técnica): invoca 'consultar_multiples_especialistas_paralelo' en 1 sola llamada (NUNCA digas "dame un momentico y ya le pregunto" sin invocar la herramienta en el mismo turno).
   - MODO 3 (abrir chat en pantalla con especialista o continuar con el especialista visible "dile que...", "pregúntale..."): invoca 'wappy_abrir_chat_agente'. Si el usuario pide abrir chat SIN haber formulado duda concreta, PROHIBIDO inventar una pregunta de relleno; pregunta en 1 frase: "¿Qué duda o tema específico deseas plantearle al especialista antes de abrir el chat?"
   - Incluye en 'consulta_completa' verificar con 'web_search' la vigencia normativa colombiana.
4. DOCUMENTOS, REPORTES Y APLICATIVOS NUEVOS ('canvas_tool' / 'wappy_crear_informe'):
   - Si pide informe Word/Excel/HTML/presentación fuera de un aplicativo /sgsst, invoca DE INMEDIATO 'canvas_tool' (accion='crear', fileType='text'|'excel'|'html', title=...) SIN abrir chats nuevos. Nunca digas que no puedes crear/enviar archivos.
   - Todo aplicativo HTML debe usar el SISTEMA DE DISEÑO PREMIUM WAPPY (dark corporativo bg-[#0b0f19], banner gradiente teal-cyan con logo, ficha empresa activa NIT/ARL/riesgo, tarjetas KPI neón, Chart.js oscuro, botón flotante 'ASISTENTE IA'); PROHIBIDO crear páginas blancas planas.

[BASE DE DATOS NORMATIVA RAG Y VIGENCIA 2024-2026 ('web_search')]:
- 'web_search' consulta simultáneamente la Base Documental WAPPY (99+ docs: Vademécum 2026, Res. 1843/2025, Batería Psicosocial manuales 1–7, Sentencias CSJ 2025) y la web en tiempo real. Invócala siempre que pidan buscar en tu base o verificar vigencia legal.
- NORMAS VIGENTES OBLIGATORIAS (prohibido citar derogadas): Exámenes médicos/HC: **Res. 1843 de 2025** (reemplazó Res. 2346/2007 y 1918/2009); Psicosocial: **Res. 2764 de 2022**, **Res. 2646 de 2008**, **Ley 1090 de 2006**; Alturas: **Res. 4272 de 2021** (derogó 1409/2012); Estándares Mínimos: **Res. 0312 de 2019** (derogó 1111/2017); Espacios Confinados: **Res. 0491 y 2605 de 2020**; PESV: **Res. 40595 de 2022** y **Ley 2251 de 2022**; Calderas: **Res. 1857 de 2024**; RETIE: **Res. 40117 de 2024** y **Res. 5018 de 2019**; Acoso Laboral/Sexual: **Ley 1010/2006**, **Ley 2209/2022**, **Ley 2365/2024**.

[DELEGACIÓN A ANTIGRAVITY ('wappy_delegar_orden_antigravity')]:
- INVOCA EXCLUSIVAMENTE SI EL USUARIO DICE LITERALMENTE "ANTIGRAVITY". Si pide crear HTML/dashboard/reporte sin decir "Antigravity", usa 'canvas_tool'.
- CÁMARA/VIDEO EN VIVO: Al invocarla con cámara activa o evidencias capturadas, el sistema adjunta automáticamente fotos y video en vivo para Antigravity; NUNCA digas que no puedes enviarlos.
- TIPO DE ENTREGABLE: Para preguntas/consultas sin pedir archivo -> tipo_entregable='respuesta' (sin pedir informes). Solo usa 'documento'|'word'|'html'|'excel'|'presentacion' si piden crear un archivo. Confirma breve: "¡Listo! He enviado la consulta/orden a Antigravity en tiempo real."

[HERRAMIENTAS OPERATIVAS]:
1. **SOMOS SST VS DRIVE**: Para leer/consultar/enviar un informe SG-SST sin mencionar "Drive", usa SIEMPRE \`wappy_leer_informe_aplicativo\` (y \`wappy_enviar_correo\` si piden enviarlo); PROHIBIDO \`wappy_generar_analisis_aplicativo\` salvo que pidan generar uno nuevo.
2. **ESTUDIO ERGONÓMICO EN VIVO**: Activa \`wappy_iniciar_estudio_ergonomico_vivo\` si falta cámara; exige SIEMPRE (1) autoevaluación/compañero, (2) nombre + cédula, (3) cargo/actividad. Guía 3 fases con \`cambiar_fase_evaluacion\` (1, 2, 3) con retroalimentación articular y cierra con \`generar_informe_tecnico\`.
3. **APIS EXTERNAS, QR, ANALÍTICA, OFIMÁTICA Y MULTIMEDIA**: \`wappy_consultar_quimico_pubchem\`, \`wappy_consultar_clima_viento\` (alturas Res. 4272: >30 km/h o ráfagas >40 km/h suspenden), \`wappy_geocodificar_emergencias\` (query corta '<tipo> <barrio> <ciudad>', lee \`resumenVoz\` real y recuerda reportar ARL), \`wappy_generar_qr\`, \`wappy_consultar_analitica_psicosocial\`, \`wappy_consultar_analitica_actos_condiciones\`, \`wappy_gestionar_agenda\`, \`google_calendar\`, \`google_gmail\` (\`batch_trash_emails\`/\`trash_email\`), \`google_sheets/docs/slides\`, \`onedrive\`, \`editor_rit\`, \`somos_sst\`, \`matriz_ipevar\`, \`matriz_pesv\`, \`matriz_compatibilidad\`, \`notebooklm_*\`, \`wappy_consultar_rehabilitacion_medlineplus\`, \`google_flow_*\`.
4. **DRIVE IMPORT**: Perfil sociodemográfico/salud desde Drive -> \`wappy_importar_sociodemografico_drive\`. Matrices Hito 1 (gtc45, pesv, compatibilidad, vulnerabilidad, diagnostico, responsable; matriz legal en construcción) -> \`wappy_importar_hito1_drive\`.
5. **TAREAS / FLUJOS ('gestor_automatizaciones')**: Para los 16 Flujos Tenshi globales usa \`accion: 'ejecutar_tenshi'\` (\`automatizacion_id\`/\`nombre\`, \`instruccion_usuario\` literal, \`esperar_resultado: true\`). Para preguntas sobre nodos de \`/tareas\` (ReTHUS/ADRES CAPTCHA vs APIs, conexiones, puertos, casillas, Operativo vs En Construcción, diseño), usa \`accion: 'consultar_documentacion_nodos'\` con \`busqueda_nodo\` y recuerda el botón "Guía de Nodos" junto a "Flujos Preestablecidos" en \`/tareas\`. En tareas de empresa pasa el nombre exacto SIN inventar códigos; usa \`accion: 'crear'\` (DAG con \`disparadores\`, \`comando_tenshi\`, \`hitos_fuente\`, \`herramientas_ia\`, \`extractores\`, \`salidas\`, \`incluir_condicion_if\`, \`condicion_if\`, \`modelo_ia\`, \`crear_como_flujo_tenshi\`) solo para flujos nuevos; "desactiva/pausa/apaga" -> \`desactivar\`/\`desactivar_todas\` (NUNCA \`eliminar\`).
6. **ACTIVAR PANELES EN PESTAÑA JUNTO A CANVAS ('wappy_activar_herramienta_agente')**: Invoca de inmediato con el ID canónico exacto en \`herramienta\`: \`canvas\`, \`editor_live\`, \`editor_rit\`, \`matriz_ipevar\`, \`matriz_pesv\`, \`matriz_compatibilidad\`, \`consultar_analitica_psicosocial\`, \`consultar_analitica_actos_condiciones\`, \`gestor_automatizaciones\`, \`wappy_investigar_trabajador_360\`, \`blog_editor\` o \`generar_imagen_sst\`.

[METODOLOGÍAS SST]:
1. **ATEL (Res. 1401/2007)**: 15 días equipo investigador + ARL; 10 días graves/mortales; Árbol de causas, Ishikawa 6M, 5 Porqués, ILCI.
2. **Ergonomía**: OWAS Espalda(1-4), Brazos(1-3), Piernas(1-6), Carga(<10/10-20/>20kg), Cat. 1-4; ROSA PVD; RULA/REBA.
3. **Alturas (Res. 4272/2021)**: >=2.0m, TSA, SPDC ANSI Z359, aptitud médica, coordinador y rescate.
4. **ATS**: 4 columnas (Pasos, Peligros, Consecuencias, Jerarquía controles).
5. **Químicos SGA (Libro Púrpura ONU)**: 9 clases, separar ácidos/bases e inflamables/comburentes, FDS 16 secciones.
6. **PESV (Res. 20223040040595)**: Fases, 24 pasos, 4 ejes.
7. **GTC-45 (IPEVAR)**: ND(2,6,10)xNE(1-4)=NP; NR=NPxNC(10,25,60,100); Nivel I(600-4000), II(150-500), III(40-120), IV(20).
8. **Emergencias**: Amenazas + vulnerabilidad en 3 diamantes (Personas, Recursos, Sistemas/Procesos).
9. **Res. 0312/2019**: <=10 trab Riesgo I-III (7 est.); 11-50 I-III (21 est.); >50 o IV-V (60 est.).
10. **Comités**: COPASST (Res. 2013/1986, Dec. 1072/2015, >=10 trab o Vigía); Convivencia (Res. 652 y 1356/2012, Ley 1010/2006).`;
            this.baseSystemInstruction = this.liveConfig.systemInstruction;
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


    async _loadUserMetaOnce() {
        if (this.userMeta) {
            return this.userMeta;
        }
        try {
            const User = mongoose.models.User || require('~/models/User');
            const doc = await User.findById(this.userId)
                .select('role isSubUser parentUser assignedCompany personalization')
                .lean();
            this.userMeta = {
                role: doc?.role || this.userRole || 'USER',
                isSubUser: Boolean(doc?.isSubUser),
                parentUser: doc?.parentUser ? String(doc.parentUser) : null,
                assignedCompany: doc?.assignedCompany ? String(doc.assignedCompany) : null,
                memoriesEnabled: doc?.personalization?.memories !== false,
            };
            if (doc?.role) {
                this.userRole = doc.role;
            }
        } catch (_err) {
            this.userMeta = {
                role: this.userRole || 'USER',
                isSubUser: false,
                parentUser: null,
                assignedCompany: null,
                memoriesEnabled: true,
            };
        }
        return this.userMeta;
    }

    /**
     * Resuelve de forma 100% defensiva el ID de conversación activa de Tenshi Chat (Multi-Chat).
     * 1) Si el cliente envió tenshiConversationId (init / screen_context / config), se usa directamente.
     * 2) Si no viene, intenta localizar la conversación más reciente del usuario/empresa en TenshiConversation.
     * 3) Si el modelo aún no existe o no hay conversación previa, devuelve null sin romper sesiones legadas.
     */
    async resolveTenshiConversationId(activeCompId = null, userIdsOverride = null) {
        if (this.activeTenshiConversationId) {
            return this.activeTenshiConversationId;
        }
        if (!this.userId) return null;
        try {
            const TenshiConversation = getTenshiConversationModelSafe();
            if (!TenshiConversation) return null;

            const compId = activeCompId !== undefined && activeCompId !== null
                ? String(activeCompId)
                : (this.activeCompanyId || (await resolveActiveCompanyId(this.userId)));
            const userFilter = Array.isArray(userIdsOverride) && userIdsOverride.length > 0
                ? { $in: userIdsOverride }
                : this.userId;

            const latestConvo = await TenshiConversation.findOne({
                user: userFilter,
                ...(compId ? { companyId: compId } : {}),
                archived: { $ne: true },
                isArchived: { $ne: true },
            })
                .sort({ lastMessageAt: -1, updatedAt: -1, createdAt: -1 })
                .select('_id conversationId')
                .lean()
                .catch(() => null);

            if (latestConvo) {
                const resolvedId = normalizeTenshiConversationId(
                    latestConvo.conversationId
                        ? String(latestConvo.conversationId)
                        : (latestConvo._id ? String(latestConvo._id) : null)
                );
                if (resolvedId) {
                    return resolvedId;
                }
            }
        } catch (_convoErr) {
            // Fallback silencioso a null para sesiones legadas
        }
        return null;
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
                    const userMeta = await this._loadUserMetaOnce();
                    const targetUserId = (userMeta.isSubUser && userMeta.parentUser) ? userMeta.parentUser : this.userId;
                    const isMemoryEnabled = userMeta.memoriesEnabled !== false;

                    let companyAndMemoryPrompt = '';
                    if (this.userRole === 'ADMIN') {
                        const decls = this.liveConfig?.tools?.[0]?.functionDeclarations;
                        if (Array.isArray(decls)) {
                            const adminVoiceTools = [
                                {
                                    name: "wappy_consultar_metricas_admin",
                                    description: "EXCLUSIVO ROL ADMIN: Consulta en tiempo real cualquiera de los módulos de Métricas y Administración global de WAPPY IA: resumen global 360°, métricas de actividad y adopción de usuarios (semáforo, niveles de adopción, hitos usados), dashboard de embajadores/comisiones/CRM, analítica de pagos y embudo de checkout, telemetría de Matriz IPEVR, telemetría de Wappy Studio, Radar ARL Colmena, ventas de Comunidad y auditoría forense, listado de usuarios del sistema, todas las empresas registradas, tickets de soporte, leads, planes, códigos promocionales y órdenes de tienda.",
                                    parameters: {
                                        type: "object",
                                        properties: {
                                            modulo: {
                                                type: "string",
                                                description: "Módulo a consultar: 'resumen_global', 'actividad_usuarios', 'embajadores', 'pagos', 'matrizipvr', 'wappystudio', 'colmena', 'comunidad', 'usuarios', 'empresas', 'tickets', 'planes_y_promos' o 'marketplace_admin'."
                                            },
                                            busqueda: { type: "string", description: "Filtro opcional por nombre, correo, teléfono, empresa, NIT, plan o estado." },
                                            periodo: { type: "string", description: "Periodo para pagos: 'today', 'week', 'month' o 'all'." },
                                            nivel: { type: "string", description: "Filtro de adopción: 'power_user', 'avanzado', 'intermedio', 'explorador' o 'sin_inicio'." },
                                            semaforo: { type: "string", description: "Filtro de semáforo: 'green', 'yellow', 'red' o 'gray'." },
                                            etapa_crm: { type: "string", description: "Filtro CRM: 'nuevo', 'contactado', 'interesado', 'propuesta', 'ganado', 'frio' o 'invalido'." },
                                            estado_comision: { type: "string", description: "Filtro comisión: 'pending', 'approved', 'paid' o 'cancelled'." },
                                            userId: { type: "string", description: "ID de un usuario para ver detalle y conversaciones." }
                                        }
                                    }
                                },
                                {
                                    name: "wappy_admin_sistema",
                                    description: "EXCLUSIVO ROL ADMIN: Ejecuta cualquier acción administrativa global en WAPPY IA: crear/editar/eliminar usuarios, cambiar planes/roles/vencimientos/límites/puntos, atribuir embajadores, aprobar/pagar/editar comisiones, renovar períodos de suscripción, actualizar etapas y notas del CRM, generar y enviar propuestas comerciales o emails con IA, editar planes y visibilidad, crear/activar/eliminar códigos promocionales, enviar campañas de marketing o notificaciones push, responder tickets de soporte, gestionar negocios ARL Colmena, sincronizar agentes del sistema o invocar cualquier ruta administrativa /api/admin/*, /api/referrals/* o /api/comunidad/*.",
                                    parameters: {
                                        type: "object",
                                        properties: {
                                            modulo: {
                                                type: "string",
                                                description: "Módulo administrativo: 'usuarios', 'embajadores', 'comisiones', 'crm', 'planes', 'promocodes', 'marketing', 'push', 'leads', 'tickets', 'colmena', 'sync_agentes' o 'tenshi_config'."
                                            },
                                            accion: {
                                                type: "string",
                                                description: "Acción a ejecutar (ej: 'crear_usuario', 'actualizar_usuario', 'eliminar_usuario', 'atribuir_embajador', 'actualizar_comision', 'renovar_periodo', 'actualizar_etapa_crm', 'agregar_nota_crm', 'generar_propuesta', 'enviar_propuesta', 'actualizar_plan', 'visibilidad_planes', 'crear_promocode', 'toggle_promocode', 'eliminar_promocode', 'enviar_notificacion_push', 'responder_ticket', 'sincronizar_agentes')."
                                            },
                                            datos: {
                                                type: "object",
                                                description: "Datos de la operación administrativa."
                                            },
                                            ruta: {
                                                type: "string",
                                                description: "Ruta directa opcional (ej: '/api/admin/users/update')."
                                            },
                                            metodo: {
                                                type: "string",
                                                description: "'GET', 'POST', 'PUT', 'PATCH' o 'DELETE'."
                                            }
                                        }
                                    }
                                }
                            ];
                            for (const admTool of adminVoiceTools) {
                                if (!decls.some((d) => d.name === admTool.name)) {
                                    decls.push(admTool);
                                }
                            }
                        }
                        companyAndMemoryPrompt += `\n\n👑 [MODO SUPER-ADMINISTRADOR ACTIVO — ROL VERIFICADO: ADMIN]:
- Has identificado y verificado que el usuario conectado tiene rol **ADMIN** (Super-Administrador de WAPPY IA).
- Tienes acceso total por voz a todos los módulos de Métricas y Administración del sistema:
  1. Para consultar cualquier métrica administrativa, invoca \`wappy_consultar_metricas_admin\` indicando el \`modulo\`:
     * \`resumen_global\`: Panorama 360° de toda la plataforma.
     * \`actividad_usuarios\`: Adopción SST por usuario, usuarios activos este mes, semáforo (\`green\`, \`yellow\`, \`red\`, \`gray\`), niveles (\`power_user\`, \`avanzado\`, \`intermedio\`, \`explorador\`, \`sin_inicio\`) e hitos usados.
     * \`embajadores\`: Dashboard comercial, embajadores, comisiones (\`pending\`, \`approved\`, \`paid\`) y CRM.
     * \`pagos\`: Embudo de checkout, conversión e ingresos en COP.
     * \`matrizipvr\`, \`wappystudio\`, \`colmena\`, \`comunidad\`: Telemetría de aplicativos públicos y Radar ARL Colmena.
     * \`usuarios\`, \`empresas\`, \`tickets\`, \`planes_y_promos\`, \`marketplace_admin\`: Usuarios, empresas globales, soporte, planes, promocodes, leads y tienda.
  2. Para ejecutar cualquier acción de administrador (crear/editar/eliminar usuarios, cambiar planes o roles, atribuir embajadores, aprobar/pagar comisiones, renovar períodos, mover etapas CRM, agregar notas CRM, generar/enviar propuestas IA, gestionar códigos promocionales, planes, marketing, notificaciones push o responder tickets), invoca \`wappy_admin_sistema\`.`;
                    } else {
                        companyAndMemoryPrompt += `\n\n🔒 [ROL DEL USUARIO CONECTADO: USER ESTÁNDAR]:
- El usuario conectado NO es administrador global (rol: ${this.userRole || 'USER'}). Opera exclusivamente dentro de su propia cuenta y sus empresas registradas.`;
                    }
                    let rawMemories = [];
                    const userIds = [this.userId, targetUserId].filter(Boolean);

                    const companyInfo = await (async () => {
                        if (userMeta.isSubUser && userMeta.assignedCompany) {
                            return await CompanyInfo.findOne({ _id: userMeta.assignedCompany, user: targetUserId }).lean().catch(() => null);
                        }
                        if (this.config.companyId && mongoose.isValidObjectId(this.config.companyId)) {
                            const byId = await CompanyInfo.findOne({ _id: this.config.companyId, user: targetUserId }).lean().catch(() => null);
                            if (byId) return byId;
                        }
                        return await CompanyInfo.findOne({ user: targetUserId, isActive: true }).lean().catch(() => null)
                            .then(async (c) => c || await CompanyInfo.findOne({ user: targetUserId }).lean().catch(() => null));
                    })();
                    const activeCompId = companyInfo?._id ? String(companyInfo._id) : null;
                    this.activeCompanyId = activeCompId;

                    const activeCompMatch = activeCompId
                        ? (mongoose.Types.ObjectId.isValid(activeCompId)
                            ? { $in: [activeCompId, new mongoose.Types.ObjectId(activeCompId)] }
                            : activeCompId)
                        : { $in: [null, ''] };
                    const briefingScope = { user: targetUserId, companyId: activeCompMatch };
                    const colNowStr = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
                    const startOfToday = new Date(`${colNowStr}T00:00:00-05:00`);
                    const endOfToday = new Date(`${colNowStr}T23:59:59.999-05:00`);
                    const startOfTomorrow = new Date(endOfToday.getTime() + 1);
                    const endOfTomorrow = new Date(endOfToday.getTime() + 24 * 3600 * 1000);
                    const needsWorkerCount = Boolean(companyInfo && (companyInfo.workerCount === undefined || companyInfo.workerCount === null));
                    const activeTenshiConvoId = await this.resolveTenshiConversationId(activeCompId, userIds);

                    const [
                        fetchedMemories,
                        recentTenshiMessages,
                        recentTenshiReports,
                        countedWorkers,
                        nbSess,
                        procMemBlock,
                        resolvedAvatar,
                        briefingResults,
                        tenshiFlowsBlock,
                    ] = await Promise.all([
                        isMemoryEnabled ? getAllUserMemories(targetUserId).catch(() => []) : Promise.resolve([]),
                        (async () => {
                            try {
                                const TenshiMessage = require('~/models/TenshiMessage');
                                return await TenshiMessage.find({
                                    user: { $in: userIds },
                                    ...(activeCompId ? { companyId: activeCompId } : {}),
                                    conversationId: activeTenshiConvoId || null,
                                })
                                    .sort({ createdAt: -1 })
                                    .limit(6)
                                    .select('role content image media file htmlReport createdAt')
                                    .lean();
                            } catch (e) {
                                return [];
                            }
                        })(),
                        (async () => {
                            try {
                                const TenshiMessage = require('~/models/TenshiMessage');
                                return await TenshiMessage.find({
                                    user: { $in: userIds },
                                    ...(activeCompId ? { companyId: activeCompId } : {}),
                                    conversationId: activeTenshiConvoId || null,
                                    $or: [
                                        { htmlReport: { $exists: true, $nin: [null, ''] } },
                                        { 'file.content': { $exists: true, $nin: [null, ''] } }
                                    ]
                                })
                                    .sort({ createdAt: -1 })
                                    .limit(1)
                                    .select('role content file htmlReport createdAt')
                                    .lean();
                            } catch (e) {
                                return [];
                            }
                        })(),
                        needsWorkerCount
                            ? (mongoose.models.SgsstWorker || require('~/models/SgsstWorker')).countDocuments({
                                user: targetUserId,
                                ...(companyInfo._id ? { companyId: companyInfo._id } : {}),
                                estadoLaboral: { $ne: 'Retirado' }
                            }).catch(() => 0)
                            : Promise.resolve(null),
                        (mongoose.models.NotebookSession || require('~/models/NotebookSession')).findOne({ user: targetUserId }).lean().catch(() => null),
                        getProceduralMemoryPromptBlock(targetUserId, companyInfo?._id, 6).catch((procErr) => {
                            logger.warn('[VoiceSession] Failed loading procedural memory block:', procErr.message);
                            return '';
                        }),
                        TenshiUserAvatar.resolveEffectiveAvatarProfile(this.userId, null, activeCompId).catch((avErr) => {
                            logger.warn('[VoiceSession] Could not load TenshiUserAvatar:', avErr.message);
                            return null;
                        }),
                        (async () => {
                            try {
                                const KanbanTask = mongoose.models.KanbanTask || require('~/models/KanbanTask');
                                const { getCalendarClient } = require('~/server/services/googleCalendar');
                                const fetchGoogleCalendarEvents = async () => {
                                    try {
                                        global.__wappyGcalBriefingCache = global.__wappyGcalBriefingCache || new Map();
                                        const cacheKey = `${String(targetUserId)}:${activeCompId || 'default'}:${colNowStr}`;
                                        const cached = global.__wappyGcalBriefingCache.get(cacheKey);
                                        if (cached && Date.now() - cached.ts < 90000) {
                                            return cached.items;
                                        }
                                        const cal = await getCalendarClient(String(targetUserId), activeCompId);
                                        if (!cal) return [];
                                        const resCal = await cal.events.list({
                                            calendarId: 'primary',
                                            timeMin: startOfToday.toISOString(),
                                            timeMax: endOfTomorrow.toISOString(),
                                            singleEvents: true,
                                            orderBy: 'startTime',
                                            maxResults: 15,
                                        });
                                        const items = resCal?.data?.items || [];
                                        global.__wappyGcalBriefingCache.set(cacheKey, { ts: Date.now(), items });
                                        return items;
                                    } catch (_calErr) {
                                        return [];
                                    }
                                };
                                const calendarPromiseWithTimeout = Promise.race([
                                    fetchGoogleCalendarEvents(),
                                    new Promise((resolve) => setTimeout(() => resolve([]), 600)),
                                ]);
                                const getSystemActivityFn = resolveGetLatestSystemActivity();
                                const systemActivityPromise = getSystemActivityFn
                                    ? (() => {
                                        let activityTimer = null;
                                        return Promise.race([
                                            getSystemActivityFn({
                                                userId: targetUserId,
                                                companyId: activeCompId,
                                                viewerRole: '',
                                                limit: 4,
                                                timeoutMs: 2000,
                                            }).catch(() => null),
                                            new Promise((resolve) => {
                                                activityTimer = setTimeout(() => resolve(null), 2200);
                                            }),
                                        ]).finally(() => {
                                            if (activityTimer) clearTimeout(activityTimer);
                                        });
                                    })()
                                    : Promise.resolve(null);
                                const [todayTasks, tomorrowTasks, overdueTasks, todoTasks, systemActivity, gcalEvents] = await Promise.all([
                                    KanbanTask.find({
                                        ...briefingScope,
                                        type: { $ne: 'antigravity_delegation' },
                                        status: { $nin: ['done', 'dismissed'] },
                                        dueDate: { $gte: startOfToday, $lte: endOfToday },
                                    }).sort({ dueDate: 1 }).limit(5).select('title dueDate priority').lean().catch(() => []),
                                    KanbanTask.find({
                                        ...briefingScope,
                                        type: { $ne: 'antigravity_delegation' },
                                        status: { $nin: ['done', 'dismissed'] },
                                        dueDate: { $gte: startOfTomorrow, $lte: endOfTomorrow },
                                    }).sort({ dueDate: 1 }).limit(5).select('title dueDate priority').lean().catch(() => []),
                                    KanbanTask.find({
                                        ...briefingScope,
                                        type: { $ne: 'antigravity_delegation' },
                                        status: { $nin: ['done', 'dismissed'] },
                                        $or: [{ status: 'overdue' }, { dueDate: { $lt: startOfToday } }],
                                    }).sort({ dueDate: -1 }).limit(5).select('title dueDate').lean().catch(() => []),
                                    KanbanTask.find({
                                        ...briefingScope,
                                        type: { $ne: 'antigravity_delegation' },
                                        status: { $in: ['todo', 'in_progress', 'due_soon'] },
                                    }).sort({ updatedAt: -1 }).limit(5).select('title status dueDate').lean().catch(() => []),
                                    systemActivityPromise,
                                    calendarPromiseWithTimeout,
                                ]);
                                return { todayTasks, tomorrowTasks, overdueTasks, todoTasks, systemActivity, gcalEvents };
                            } catch (briefErr) {
                                logger.warn('[VoiceSession] Could not build daily briefing context:', briefErr.message);
                                return null;
                            }
                        })(),
                        buildTenshiFlowsPromptBlock().catch(() => ''),
                    ]);
                    rawMemories = fetchedMemories;

                    if (companyInfo) {
                        let finalWorkerCount = (companyInfo.workerCount !== undefined && companyInfo.workerCount !== null)
                            ? companyInfo.workerCount
                            : 'N/A';

                        if (finalWorkerCount === 'N/A' && typeof countedWorkers === 'number' && countedWorkers > 0) {
                            finalWorkerCount = countedWorkers;
                            CompanyInfo.updateOne({ _id: companyInfo._id }, { $set: { workerCount: countedWorkers } }).catch(() => {});
                            companyInfo.workerCount = countedWorkers;
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
                    const currentRoute = this.activeScreenRoute || '/c/new';
                    const isOnSgsstApp = !this.isHeroMode && currentRoute.startsWith('/sgsst');
                    const humanScreen = formatScreenRouteHuman(
                        currentRoute,
                        this.isHeroMode ? null : this.activeScreenAgent,
                        this.isHeroMode
                    );
                    if (isOnSgsstApp) {
                        companyAndMemoryPrompt += `\n\n[PANTALLA Y MÓDULO VISIBLE EN ESTE MOMENTO]:
- Módulo en pantalla: ${humanScreen} (Ruta: ${currentRoute}).
- FOCO DE TRABAJO INMEDIATO: El usuario tiene este módulo abierto en su pantalla ahora mismo. Cualquier petición de acción, clic en botones, generación de análisis o informe con IA, o consulta sobre datos debe entenderse y ejecutarse EXCLUSIVAMENTE sobre este módulo visible (${humanScreen}). ESTÁ TOTALMENTE PROHIBIDO desviar la conversación hacia módulos o temas tratados en el pasado.`;
                    } else {
                        companyAndMemoryPrompt += `\n\n[PANTALLA Y MÓDULO VISIBLE EN ESTE MOMENTO]:
- Pantalla activa: ${humanScreen} (Ruta: ${currentRoute}${this.isHeroMode ? ', Modo Hero de Tenshi ACTIVO' : ''}).
- ENTORNO ACTUAL: El usuario está en **Modo Hero de Tenshi / Chat Principal** (NO está dentro de un formulario o aplicativo de \`/sgsst\`).
- REGLA OBLIGATORIA DE ENTREGABLES: Cualquier solicitud de informe, reporte, documento, HTML interactivo, módulo interactivo, tablero, Word, Excel o presentación DEBE resolverse INVOCANDO DIRECTAMENTE \`canvas_tool\` (o \`wappy_crear_informe\`) para entregarlo con visor y botones Ver/Descargar en el chat y Canvas de Tenshi.
- PROHIBICIÓN ABSOLUTA EN MODO HERO / CHAT PRINCIPAL: NO existe ningún botón "Generar IA" visible aquí. ESTÁ TERMINANTEMENTE PROHIBIDO invocar \`operar_interfaz_visual\` para pulsar "Generar IA" o hacer clics sobre la interfaz oculta detrás del Modo Hero. Tampoco desvíes la conversación hacia módulos o temas tratados en el pasado.`;
                    }

                    let memoriesChars = 0;
                    if (Array.isArray(rawMemories) && rawMemories.length > 0) {
                        const uniqueMap = new Map();
                        const sortedRaw = [...rawMemories].sort((a, b) => new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime());
                        for (const m of sortedRaw) {
                            if (m.key && !uniqueMap.has(m.key)) uniqueMap.set(m.key, m.value);
                        }
                        let memSection = `\n\n[MEMORIA PERMANENTE DEL USUARIO]:\n`;
                        for (const [k, val] of uniqueMap.entries()) {
                            const cleanVal = String(val ?? '').replace(/\s+/g, ' ').trim();
                            memSection += `- [${k}]: ${cleanVal}\n`;
                        }
                        memoriesChars = memSection.length;
                        companyAndMemoryPrompt += memSection;
                    }

                    const selectedNbRefs = Array.isArray(this.selectedTenshiNotebooks)
                        ? this.selectedTenshiNotebooks.map(extractNotebookRef).filter(Boolean)
                        : [];
                    if (nbSess && Array.isArray(nbSess.cookies) && nbSess.cookies.length > 0) {
                        const cachedNbs = Array.isArray(nbSess.cachedNotebooks) ? nbSess.cachedNotebooks : [];
                        if (nbSess.isValid === false) {
                            companyAndMemoryPrompt += `\n\n[ESTADO DE GOOGLE NOTEBOOKLM (SESIÓN CADUCADA)]:\n` +
                                `- La sesión privada de Google NotebookLM del usuario figura como CADUCADA (isValid=false). Si pide consultar un cuaderno, puedes intentar la herramienta una vez o avisarle con honestidad que su sesión de NotebookLM expiró y debe reconectarla en 1 clic desde la píldora "Cuadernos".\n`;
                        } else {
                            companyAndMemoryPrompt += `\n\n[ACCESO TOTAL DE TENSHI A GOOGLE NOTEBOOKLM (SEGUNDO CEREBRO)]:\n` +
                                `- Tenshi tiene acceso TOTAL a TODOS los cuadernos de Google NotebookLM del usuario.\n`;
                            if (cachedNbs.length > 0) {
                                companyAndMemoryPrompt += `- Cuadernos disponibles (${cachedNbs.length}): ` +
                                    cachedNbs.slice(0, 8).map((nb) => `${nb.emoji || '📓'} "${nb.title}" (ID: ${nb.id}, ${nb.sources_count || 0} fuentes)`).join(' | ') + `.\n`;
                            }
                        }
                        if (selectedNbRefs.length > 0) {
                            const cachedById = new Map(cachedNbs.map((nb) => [String(nb.id || ''), nb]));
                            const formattedSelected = selectedNbRefs
                                .map((ref) => {
                                    const match = cachedById.get(ref.id);
                                    const label = match?.title || ref.title;
                                    return `${match?.emoji || ref.emoji || '📌'} "${label}" (ID: ${ref.id})`;
                                })
                                .join(' | ');
                            companyAndMemoryPrompt += `- CUADERNOS SELECCIONADOS ACTIVOS EN ESTA SESIÓN (${selectedNbRefs.length}): ${formattedSelected}. Prioriza estos cuadernos al consultar NotebookLM salvo que el usuario indique otro cuaderno explícitamente.\n`;
                        }
                    } else if (selectedNbRefs.length > 0) {
                        companyAndMemoryPrompt += `\n\n[CUADERNOS DE NOTEBOOKLM SELECCIONADOS EN ESTA SESIÓN (${selectedNbRefs.length})]: ` +
                            selectedNbRefs.map((ref) => `"${ref.title}" (ID: ${ref.id})`).join(' | ') + `.\n`;
                    }

                    if (procMemBlock) {
                        companyAndMemoryPrompt += procMemBlock;
                    }
                    companyAndMemoryPrompt += `\n\n[CAPACIDADES INTERACTIVAS OPENBOT (WIDGETS, HÁBITOS Y GOBERNANZA HITL)]:
- Si el usuario te enseña una regla operativa o hábito de su empresa ("siempre que...", "recuerda que para..."), usa \`wappy_memoria_procedimental\` (accion="guardar"). Si pregunta qué hábitos o reglas recuerdas, usa accion="listar".
- Si el usuario pide una calculadora interactiva de riesgos GTC-45 o una lista de chequeo interactiva en el chat, usa \`wappy_renderizar_widget_interactivo\`.
- Las acciones destructivas o críticas están protegidas por Gobernanza Human-in-the-Loop mediante Tarjeta de Aprobación en el chat.`;

                    // Inyectar Historial reciente de Tenshi (TenshiMessage) - UNIFICADO Y VIVO (Últimos 6 turnos activos)
                    const injectedReportMessageIds = new Set();
                    if (recentTenshiMessages && recentTenshiMessages.length > 0) {
                        const validMessages = [];
                        const reversedChronological = [...recentTenshiMessages].reverse();
                        for (const m of reversedChronological) {
                            const role = m.role === 'user' ? 'Usuario' : 'Tenshi';
                            const cleanContent = (m.content || '').replace(/\s+/g, ' ').trim();
                            const hasReport = Boolean(m.file || m.htmlReport);
                            const maxLen = hasReport ? 450 : 280;
                            let snippet = cleanContent.length > maxLen ? cleanContent.substring(0, maxLen) + '...' : cleanContent;
                            if (hasReport) {
                                if (m._id) injectedReportMessageIds.add(String(m._id));
                                const rawHtml = m.file?.content || m.htmlReport || '';
                                const cleanReportText = rawHtml
                                    .replace(/<style[\s\S]*?<\/style>/gi, '')
                                    .replace(/<script[\s\S]*?<\/script>/gi, '')
                                    .replace(/<[^>]+>/g, ' ')
                                    .replace(/\s+/g, ' ')
                                    .trim()
                                    .substring(0, 400);
                                if (cleanReportText) {
                                    snippet += ` | Extracto del Informe "${m.file?.title || 'Informe Oficial SG-SST'}": ${cleanReportText}`;
                                }
                            }
                            if (snippet && !snippet.startsWith('[RESULTADO_GUI]')) {
                                let extraLabel = '';
                                if (m.image || m.media) extraLabel = ' [con evidencia/foto de cámara]';
                                if (hasReport) extraLabel = ` [📄 CON INFORME GENERADO EN TU CHAT DE TENSHI: "${m.file?.title || 'Informe Oficial SG-SST'}"]`;
                                validMessages.push({ role: `${role}${extraLabel}`, snippet });
                            }
                        }

                        if (validMessages.length > 0) {
                            companyAndMemoryPrompt += `\n\n[HISTORIAL CONVERSACIONAL RECIENTE DE TU PROPIO CHAT DE TENSHI (ÚLTIMOS ${validMessages.length} TURNOS ACTIVOS)]:`;
                            validMessages.forEach((m, idx) => {
                                const isLast = idx === validMessages.length - 1;
                                const tag = isLast ? 'ÚLTIMO TURNO - PRESENTE INMEDIATO' : `Turno previo ${idx + 1}`;
                                companyAndMemoryPrompt += `\n- [${tag}] ${m.role}: "${m.snippet}"`;
                            });
                        }
                    }

                    // Inyectar último informe oficial generado en el chat de Tenshi (solo si no quedó ya incluido en los últimos 6 turnos)
                    const uninjectedReports = (recentTenshiReports || []).filter(
                        (r) => !r?._id || !injectedReportMessageIds.has(String(r._id))
                    );
                    if (uninjectedReports.length > 0) {
                        companyAndMemoryPrompt += `\n\n[📄 ÚLTIMO INFORME OFICIAL PUBLICADO EN TU CHAT DE TENSHI]:`;
                        uninjectedReports.slice(0, 1).forEach((r, idx) => {
                            const title = r.file?.title || 'Informe Oficial SG-SST';
                            const rawHtml = r.file?.content || r.htmlReport || '';
                            const cleanExtract = rawHtml
                                .replace(/<style[\s\S]*?<\/style>/gi, '')
                                .replace(/<script[\s\S]*?<\/script>/gi, '')
                                .replace(/<[^>]+>/g, ' ')
                                .replace(/\s+/g, ' ')
                                .trim()
                                .substring(0, 500);
                            const dateStr = r.createdAt ? new Date(r.createdAt).toLocaleString('es-CO', { timeZone: 'America/Bogota' }) : 'Reciente';
                            companyAndMemoryPrompt += `\n- ${idx === 0 ? '🔥 [ÚLTIMO INFORME EN CHAT DE TENSHI]' : `[Informe #${idx + 1}]`} Título: "${title}" (${dateStr}) -> Resumen: ${cleanExtract}`;
                        });
                    }

                    // ─── BRIEFING EJECUTIVO DIARIO Y MEMORIA AUTOBIOGRÁFICA (ESTILO DOT) ───
                    let lastTitle = null;
                    let todayList = 'Sin eventos en Google Calendar ni tareas con vencimiento exacto hoy';
                    let tomorrowList = 'Ningún evento o tarea vence mañana';
                    let overdueList = '';
                    let todoList = '';
                    if (briefingResults) {
                        const { todayTasks, tomorrowTasks, overdueTasks, todoTasks, systemActivity, gcalEvents } = briefingResults;
                        const fmtTime = (d) => d ? new Date(d).toLocaleTimeString('es-CO', { timeZone: 'America/Bogota', hour: '2-digit', minute: '2-digit', hour12: true }) : '';
                        const gcalToday = [];
                        const gcalTomorrow = [];
                        for (const ev of (gcalEvents || [])) {
                            const startRaw = ev.start?.dateTime || ev.start?.date;
                            if (!startRaw) continue;
                            const evDate = new Date(startRaw);
                            const evDateStr = evDate.toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
                            const timeLabel = ev.start?.dateTime ? fmtTime(evDate) : 'Todo el día';
                            const label = `${ev.summary || 'Evento sin título'} (${timeLabel})`;
                            if (evDateStr === colNowStr) gcalToday.push(label);
                            else gcalTomorrow.push(label);
                        }

                        const sanitizeActivityText = (val) => String(val || '').replace(/\s+/g, ' ').trim();
                        const isForbiddenActivityTitle = (raw) => {
                            const cleaned = sanitizeActivityText(raw)
                                .replace(/^\[.*?\]\s*/, '')
                                .replace(/^["']+|["']+$/g, '')
                                .trim();
                            return (
                                !cleaned ||
                                /^(new chat|nueva conversaci[oó]n|nuevo chat|untitled|sin t[ií]tulo)$/i.test(cleaned) ||
                                /\bsesi[oó]n\s+an[oó]nima\b/i.test(cleaned)
                            );
                        };
                        const formatActivityLabel = (act) => {
                            const rawTitulo = sanitizeActivityText(act?.titulo).replace(/^["']+|["']+$/g, '').trim();
                            if (isForbiddenActivityTitle(rawTitulo)) return null;
                            const shortTitulo = rawTitulo.length > 100 ? rawTitulo.slice(0, 97).trim() + '...' : rawTitulo;
                            const modulo = sanitizeActivityText(act?.modulo);
                            return modulo ? `"${shortTitulo}" (${modulo})` : `"${shortTitulo}"`;
                        };

                        const recentActivitiesRaw = Array.isArray(systemActivity?.actividadesRecientes)
                            ? systemActivity.actividadesRecientes
                            : [];
                        const validRecentActivities = recentActivitiesRaw.filter((a) => a && !isForbiddenActivityTitle(a.titulo));
                        const primaryAct = (systemActivity?.ultimaActividad && !isForbiddenActivityTitle(systemActivity.ultimaActividad.titulo))
                            ? systemActivity.ultimaActividad
                            : (validRecentActivities[0] || null);

                        if (primaryAct) {
                            lastTitle = formatActivityLabel(primaryAct);
                        } else {
                            const fallbackReportTitle = sanitizeActivityText(recentTenshiReports?.[0]?.file?.title)
                                .replace(/^["']+|["']+$/g, '')
                                .trim();
                            if (!isForbiddenActivityTitle(fallbackReportTitle)) {
                                const shortFallback = fallbackReportTitle.length > 100
                                    ? fallbackReportTitle.slice(0, 97).trim() + '...'
                                    : fallbackReportTitle;
                                lastTitle = `"${shortFallback}"`;
                            }
                        }

                        let otherActivitiesLine = '';
                        if (recentActivitiesRaw.length > 1 && validRecentActivities.length > 0) {
                            const primaryTitleNorm = primaryAct ? sanitizeActivityText(primaryAct.titulo).toLowerCase() : '';
                            const primaryModNorm = primaryAct ? sanitizeActivityText(primaryAct.modulo).toLowerCase() : '';
                            const primaryTs = primaryAct ? String(primaryAct.timestamp || primaryAct.fechaIso || '') : '';
                            const additional = [];
                            for (let i = 0; i < validRecentActivities.length && additional.length < 3; i += 1) {
                                const act = validRecentActivities[i];
                                const actTitleNorm = sanitizeActivityText(act.titulo).toLowerCase();
                                const actModNorm = sanitizeActivityText(act.modulo).toLowerCase();
                                const actTs = String(act.timestamp || act.fechaIso || '');
                                if (
                                    primaryAct &&
                                    actTitleNorm === primaryTitleNorm &&
                                    actModNorm === primaryModNorm &&
                                    (!primaryTs || !actTs || actTs === primaryTs)
                                ) {
                                    continue;
                                }
                                const t = sanitizeActivityText(act.titulo).replace(/^["']+|["']+$/g, '').trim();
                                const shortT = t.length > 55 ? t.slice(0, 52).trim() + '...' : t;
                                const mod = sanitizeActivityText(act.modulo);
                                const fecha = sanitizeActivityText(act.fecha);
                                additional.push(`${mod ? `[${mod}] ` : ''}"${shortT}"${fecha ? ` (${fecha})` : ''}`);
                            }
                            if (additional.length > 0) {
                                otherActivitiesLine = `\n- Otras actividades recientes en el sistema: ${additional.join('; ')}.`;
                            }
                        }

                        todayList = [
                            ...gcalToday.map(e => `[Google Calendar] ${e}`),
                            ...(todayTasks || []).map(t => `[Centro de Control] ${t.title} (${fmtTime(t.dueDate)})`),
                        ].join('; ') || 'Sin reuniones en Google Calendar para hoy';
                        tomorrowList = [
                            ...gcalTomorrow.map(e => `[Google Calendar] ${e}`),
                            ...(tomorrowTasks || []).map(t => `[Centro de Control] ${t.title} (${fmtTime(t.dueDate)})`),
                        ].join('; ') || 'Ninguna reunión o tarea programada para mañana';
                        overdueList = (overdueTasks || []).map(t => t.title).join(', ');
                        todoList = (todoTasks || []).map(t => t.title).join(', ');

                        companyAndMemoryPrompt += `\n\n[MEMORIA AUTOBIOGRÁFICA Y BRIEFING EJECUTIVO DEL DÍA (ESTILO DOT - DATOS REALES EN TIEMPO REAL)]:
- Empresa activa actual: ${companyInfo?.companyName || 'Tu Empresa'}.
- Último informe o gestión real realizada: ${lastTitle || 'Avance en el SG-SST'}.${otherActivitiesLine}
- Agenda REAL de HOY (${colNowStr} - Google Calendar + Centro de Control): ${todayList}.
- Agenda REAL de MAÑANA: ${tomorrowList}.${todoList ? `\n- Tareas por hacer / en curso en Centro de Control ACPM: ${todoList}.` : ''}${overdueList ? `\n- Tareas vencidas que requieren atención en Centro de Control ACPM (${overdueTasks.length} recientes): ${overdueList}.` : ''}
- REGLA OBLIGATORIA DE PRIMER SALUDO (ESTILO DOT CON DATOS REALES — CERO TOOL CALLS EN EL SALUDO):
  En tu PRIMERA respuesta de la llamada (cuando el usuario saluda o inicia la conversación):
  * PROHIBICIÓN ESTRICTA DE INVOCAR HERRAMIENTAS EN EL SALUDO: NO invoques NINGUNA herramienta ('google_calendar', 'wappy_consultar_trabajadores', 'somos_sst', etc.) durante el saludo inicial ni ante ruido de micrófono, porque todos los datos reales del briefing ya están inyectados aquí.
  1) Saluda cálidamente al usuario por su nombre y menciona su empresa activa (${companyInfo?.companyName || 'su empresa'}).
  2) Pregúntale cómo le fue con su última gestión real (${lastTitle || 'su gestión reciente en el SG-SST'}). ESTÁ TERMINANTEMENTE PROHIBIDO decir "New Chat".
  3) Infórmale con precisión lo que REALMENTE tiene hoy en Google Calendar (${todayList}) y recuérdale brevemente si tiene tareas por hacer o vencidas en su Centro de Control ACPM (${todoList || overdueList || 'sin pendientes'}). NUNCA digas que "no tiene tareas pendientes" si arriba aparecen datos.`;
                    }

                    // ─── MODO DE PERSONALIDAD ADAPTATIVA DE TENSHI (1 CLIC) + AVATAR WAPPY DEL USUARIO ───
                    let effectiveAvatar = resolvedAvatar?.effective || null;
                    if (effectiveAvatar) {
                        this.config.voice = effectiveAvatar.voice || this.config?.voice || 'Puck';
                        this.liveConfig.voice = this.config.voice;
                        companyAndMemoryPrompt += `\n\n[IDENTIDAD, NOMBRE, SEXO, PERSONALIDAD Y VOCABLO REGIONAL DEL AVATAR WAPPY DE ESTE USUARIO]:
- Tu nombre oficial y único es "${effectiveAvatar.name}" (sin títulos adicionales ni sufijos). Preséntate y responde siempre bajo el nombre de "${effectiveAvatar.name}".
- Tu sexo/género es "${effectiveAvatar.gender}". Habla siempre de ti mismo/a con concordancia gramatical ${effectiveAvatar.gender === 'femenino' ? 'femenina ("lista", "encantada")' : effectiveAvatar.gender === 'neutro' ? 'neutra' : 'masculina ("listo", "encantado")'}.
- Personalidad y vocablo regional asignado por el usuario: ${effectiveAvatar.personality}
- REGLA OBLIGATORIA DE VOCABLO Y ENTONACIÓN REGIONAL COLOMBIANA EN VOZ: Si la personalidad del usuario especifica un vocablo o acento regional de Colombia (como Paisa, Costeño, Caleño/Valluno, Rolo/Bogotano, Santandereano, Llanero o Pastuso), habla durante toda la llamada usando naturalmente la cadencia, el entusiasmo y las expresiones típicas de esa región colombiana.`;
                    }

                    const initialPersonality = (this.config?.personality || effectiveAvatar?.personalityPreset || 'consultor').toLowerCase();
                    if (initialPersonality === 'express') {
                        companyAndMemoryPrompt += `\n\n[MODO DE PERSONALIDAD ACTIVO: ⚡ EJECUTIVO EXPRESS]:
Responde SIEMPRE en máximo 1 a 2 frases ultra-directas y al grano. Prioriza datos puntuales, cifras y acciones inmediatas sin introducciones largas.`;
                    } else if (initialPersonality === 'auditor') {
                        companyAndMemoryPrompt += `\n\n[MODO DE PERSONALIDAD ACTIVO: ⚖️ MODO AUDITOR]:
Responde con rigor normativo estricto, citando artículos exactos del Decreto 1072 de 2015, Resolución 0312 de 2019, GTC 45 o normas aplicables, verificando cumplimiento legal y evidencias.`;
                    } else {
                        companyAndMemoryPrompt += `\n\n[MODO DE PERSONALIDAD ACTIVO: 🛡️ CONSULTOR SENIOR]:
Responde con calidez ejecutiva, criterio técnico integral en SG-SST y recomendaciones prácticas para la empresa.`;
                    }

                    companyAndMemoryPrompt += `\n\n[DIRECTIVA ABSOLUTA DE ENFOQUE TEMÁTICO, ESCUCHA ACTIVA Y CONTINUIDAD]:
1. EN EL PRIMER TURNO DE LA LLAMADA: Entrega SIEMPRE el Briefing Ejecutivo del Día (empresa activa, pregunta cómo le fue con la última gestión ${lastTitle || '"reciente"'}, menciona la agenda de hoy y los vencimientos de mañana).
2. EN LOS TURNOS SIGUIENTES: Tu tema de trabajo está delimitado por la pantalla visible actual (${humanScreen}) y por lo que el usuario te pida en ese turno.
3. ESCUCHA PACIENTE SIN CORTAR AL USUARIO: Si la frase del usuario quedó claramente inconclusa o termina en conector/preposición (ej: "Tengo una tarea, perdón, una tarea...", "tengo pendiente una actividad que es asistir a...", "quiero que..."), NO dispares navegaciones precipitadas ni cambies de pantalla antes de escuchar la idea completa; si ya estás en el módulo mencionado en pantalla, NO vuelvas a invocar \`wappy_navegar\` hacia ese mismo módulo. Si el usuario menciona una tarea o actividad del Centro de Control/Cronograma, consulta directamente sus tareas (\`wappy_consultar_cronograma_sst\` o \`somos_sst\`) en lugar de solo navegar.
4. Ya conoces de memoria todos los datos de la empresa activa del usuario (Razón Social, NIT, ARL, trabajadores, sedes, macroprocesos, etc.). NUNCA digas que no tienes acceso a su empresa.`;

                    if (tenshiFlowsBlock) {
                        companyAndMemoryPrompt +=
                            `\n\n${tenshiFlowsBlock}\n` +
                            `JERARQUÍA 3 NIVELES (FLUJO PROPIO VS GLOBAL TENSHI): ` +
                            `NIVEL 1 (activar/pausar/editar/eliminar/"mi flujo"): opera sobre el Flujo Propio en \`/tareas\` con el nombre exacto del usuario. ` +
                            `NIVEL 2 (comando exacto de Flujo Propio ACTIVO): ejecuta \`gestor_automatizaciones\` (\`accion: "ejecutar_ahora"\`). ` +
                            `NIVEL 3 (consulta natural operativa): ejecuta el Flujo Global Tenshi con \`accion: "ejecutar_tenshi"\`, \`instruccion_usuario\` literal y \`esperar_resultado: true\` (incluye Alturas híbrido Somos SST -> MinTrabajo).`;
                    }

                    const workflowNodesOverviewBlock = safeGetWorkflowNodesOverviewPromptBlock();
                    if (workflowNodesOverviewBlock) {
                        companyAndMemoryPrompt += `\n\n${workflowNodesOverviewBlock}`;
                    }

                    const basePromptText = this.baseSystemInstruction || this.liveConfig.systemInstruction || '';
                    this.liveConfig.systemInstruction = basePromptText + companyAndMemoryPrompt;
                    this.initialBriefingSummary = {
                        companyName: companyInfo?.companyName || 'tu empresa',
                        lastTitle: lastTitle || 'el último informe del SG-SST',
                        todayList,
                        tomorrowList,
                        overdueList,
                    };
                    logger.info(
                        `[VoiceSession] Injected Tenshi Voice context (totalChars=${this.liveConfig.systemInstruction.length}, base=${basePromptText.length}, dynamic=${companyAndMemoryPrompt.length}, memories=${memoriesChars}, flows=${(tenshiFlowsBlock || '').length}, nodes=${(workflowNodesOverviewBlock || '').length}, personality=${initialPersonality}, memCount=${rawMemories?.length || 0}, turns=${recentTenshiMessages?.length || 0})`
                    );

                    // Guía Maestra de la Plataforma y Metodologías SST ya están incorporadas en systemInstruction base (máxima fluidez y baja latencia)
                } catch (memErr) {
                    logger.warn(`[VoiceSession] Could not inject company/memories into Tenshi Voice:`, memErr.message);
                }
            }

            // Try connecting with API key AND model rotation
            let success = false;
            let lastError = null;

            // Modelo Live estricto: Primario 3.1 (gemini-3.1-flash-live-preview) y Respaldo 3.8 (gemini-3.8-live)
            const rawPreferredLiveModel = this.liveConfig.liveModel || this.liveConfig.preferredLiveModel || process.env.GEMINI_LIVE_MODEL || 'gemini-3.1-flash-live-preview';
            
            const mapModelToRealGoogleModel = (modelName) => {
                if (!modelName) return 'gemini-3.1-flash-live-preview';
                const name = modelName.toLowerCase().trim();
                if (name === 'gemini-3.8-live' || name.includes('3.8-live') || name.includes('3.8_live')) {
                    return 'gemini-3.8-live';
                }
                if (name === 'gemini-2.5-flash-native-audio-preview-12-2025' || name.includes('native-audio')) {
                    return 'gemini-2.5-flash-native-audio-preview-12-2025';
                }
                return 'gemini-3.1-flash-live-preview';
            };

            const preferredLiveModel = mapModelToRealGoogleModel(rawPreferredLiveModel);
            const liveModelsToTry = preferredLiveModel === 'gemini-3.8-live'
                ? ['gemini-3.8-live', 'gemini-3.1-flash-live-preview', 'gemini-2.5-flash-native-audio-preview-12-2025']
                : ['gemini-3.1-flash-live-preview', 'gemini-3.8-live', 'gemini-2.5-flash-native-audio-preview-12-2025'];

            logger.info(`[VoiceSession] Modelos Live a intentar en la sesión: ${liveModelsToTry.join(', ')}`);
            this.liveModelsToTry = liveModelsToTry;
            this.reconnectAttempts = 0;

            // Bucle Externo: Recorre los modelos consecutivos
            for (let m = 0; m < liveModelsToTry.length; m++) {
                const currentLiveModel = liveModelsToTry[m];
                this.liveConfig.model = currentLiveModel; // Asignar el modelo de turno a la configuración
                let modelDisableCompression = Boolean(this.config?.disableContextCompression);

                // Bucle Interno: Recorre las API keys consecutivamente para el modelo actual
                // Si hay múltiples claves API, usar el orden inverso para VoiceSession (Tenshi Live)
                // para que use preferentemente la última clave (ej. Key 3) mientras que los
                // agentes del chat (AgentClient) usan la primera clave (Key 1).
                // Esto previene al 100% la colisión de cuotas y desconexión de streams por concurrencia.
                const voiceKeys = orderVoiceKeysByCooldown(this.apiKeys);
                for (let i = 0; i < voiceKeys.length; i++) {
                    const key = voiceKeys[i];
                    this.lastUsedLiveKey = key;
                    logger.info(`[VoiceSession] Intentando conexión con Modelo "${currentLiveModel}" y API Key ${i + 1}/${voiceKeys.length}`);
                    
                    try {
                        // Create Gemini Live client
                        const attemptConfig = {
                            ...this.liveConfig,
                            model: currentLiveModel,
                            disableContextCompression: modelDisableCompression,
                        };
                        this.geminiClient = new GeminiLiveClient(key, attemptConfig);

                        // Connect to Gemini WebSocket
                        await this.geminiClient.connect();
                        this.liveConfig.disableContextCompression = modelDisableCompression;
                        
                        success = true;
                        break; // ✅ Éxito en la conexión con la clave actual
                    } catch (error) {
                        const is1007BeforeSetup =
                            error?.code === 1007 || /Code:\s*1007\b/i.test(String(error?.message || ''));
                        if (this.geminiClient && typeof this.geminiClient.disconnect === 'function') {
                            this.geminiClient.disconnect();
                        }
                        this.geminiClient = null;

                        // Si el modelo rechazó setup con Code 1007 teniendo contextWindowCompression activo, reintentar sin compresión
                        if (is1007BeforeSetup && !modelDisableCompression) {
                            logger.warn(
                                `[VoiceSession] Modelo "${currentLiveModel}" falló antes de setupComplete con Code 1007 con contextWindowCompression activo; reintentando con disableContextCompression=true...`
                            );
                            modelDisableCompression = true;
                            try {
                                const retryConfig = {
                                    ...this.liveConfig,
                                    model: currentLiveModel,
                                    disableContextCompression: true,
                                };
                                this.geminiClient = new GeminiLiveClient(key, retryConfig);
                                await this.geminiClient.connect();
                                this.liveConfig.disableContextCompression = true;
                                success = true;
                                break;
                            } catch (retryError) {
                                logger.warn(
                                    `[VoiceSession] Reintento sin contextWindowCompression falló con Modelo "${currentLiveModel}" y API Key ${i + 1}: ${retryError.message}`
                                );
                                markVoiceKeyCooldown(key, retryError.message);
                                lastError = retryError;
                                if (this.geminiClient && typeof this.geminiClient.disconnect === 'function') {
                                    this.geminiClient.disconnect();
                                }
                                this.geminiClient = null;
                                continue;
                            }
                        }

                        logger.warn(`[VoiceSession] Falló conexión con Modelo "${currentLiveModel}" y API Key ${i + 1}: ${error.message}`);
                        markVoiceKeyCooldown(key, error.message);
                        lastError = error;
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
     * Cancela el watchdog de cierre automático de audioStreamEnd en servidor
     */
    clearAudioStreamEndWatchdog() {
        if (this.audioStreamEndWatchdog) {
            clearTimeout(this.audioStreamEndWatchdog);
            this.audioStreamEndWatchdog = null;
        }
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
            if (this.bargeInSuppressAiAudioUntil && Date.now() < this.bargeInSuppressAiAudioUntil) {
                return;
            }
            this.clearAudioStreamEndWatchdog();
            if (!this.turnHadAiOutput) {
                this.triggerEarlyUserTranscriptionCorrection('ai_audio_start');
            }
            this.isAiSpeaking = true;
            this.aiGenerationComplete = false;
            this.lastAiAudioAt = Date.now();
            this.turnHadAiOutput = true;
            this.suppressClientAudioUntil = null;
            // Forward audio to client for playback
            this.sendToClient({ type: 'audio', data: { audioData } });

            // Count audio chunks to know AI responded with voice
            this.aiAudioChunkCount++;

            // Safety timeout: Reset isAiSpeaking to false tras 1200ms sin nuevos chunks de audio IA (cero ventanas muertas)
            if (this.aiSpeakingTimeout) clearTimeout(this.aiSpeakingTimeout);
            this.aiSpeakingTimeout = setTimeout(() => {
                this.aiSpeakingTimeout = null;
                if (this.isAiSpeaking) {
                    logger.info('[VoiceSession] Safety reset isAiSpeaking to false after 1200ms silence');
                    this.isAiSpeaking = false;
                }
            }, 1200);
        });

        // Listen for GENERATION COMPLETE (Gemini terminó de generar audio, 20-25s antes de turnComplete)
        this.geminiClient.on('generationComplete', () => {
            logger.info('[VoiceSession] ========== GENERATION COMPLETE ==========');
            this.aiGenerationComplete = true;
            if (this.aiSpeakingTimeout) {
                clearTimeout(this.aiSpeakingTimeout);
                this.aiSpeakingTimeout = null;
            }
            if (this.isAiSpeaking) {
                // Margen corto de drenaje (450ms) por si playback_ended no llega antes
                this.aiSpeakingTimeout = setTimeout(() => {
                    this.aiSpeakingTimeout = null;
                    if (this.isAiSpeaking && this.aiGenerationComplete) {
                        logger.info('[VoiceSession] Released isAiSpeaking after generationComplete drain (450ms)');
                        this.isAiSpeaking = false;
                    }
                }, 450);
            }
            this.sendToClient({ type: 'status', data: { status: 'generation_complete' } });
        });

        // Listen for USER transcription (what the user says)
        this.geminiClient.on('userTranscription', (text) => {
            const safeChunk = sanitizeStreamingChunk(text);
            if (!safeChunk || !safeChunk.trim()) {
                return;
            }
            // Proteger la burbuja real del usuario mientras una herramienta está ejecutándose ante suspiros/ruidos cortos
            if (this.activeToolCount > 0 && (this.currentTurnPcmBytes || 0) < 16000) {
                logger.info(`[VoiceSession] Ignoring short streaming STT fragment while ${this.activeToolCount} tool(s) are running (${this.currentTurnPcmBytes || 0}B PCM): "${safeChunk.trim()}"`);
                return;
            }
            this.bargeInSuppressAiAudioUntil = 0;
            this.isAiSpeaking = false;
            this.toolCalledThisTurn = false;

            const now = Date.now();
            const silenceGapMs = this.lastUserTranscriptionAt ? (now - this.lastUserTranscriptionAt) : 0;

            // Si la IA ya había empezado a responder en este turno (y fue interrumpida) o pasaron > 10s de silencio
            // tras una consulta previa completa, reiniciar el acumulador para no pegar ruido nuevo a la pregunta anterior
            if (this.turnHadAiOutput || (silenceGapMs > 10000 && (this.userTranscriptionText || '').trim().length > 35)) {
                this.userTranscriptionText = '';
                this.rawUserTranscriptionStream = '';
                this.earlyCorrectedSnapshot = null;
                this.turnHadAiOutput = false;
            }
            this.lastUserTranscriptionAt = now;

            if (!this.rawUserTranscriptionStream) {
                this.rawUserTranscriptionStream = '';
            }
            // Preservar los espacios nativos del tokenizador streaming de Google (para no partir palabras a la mitad
            // ni eliminar artículos sueltos como "la", "el", "de", "por"). Solo insertar espacio si la frase previa cerró en puntuación.
            if (
                this.rawUserTranscriptionStream &&
                /[.,;!?]$/.test(this.rawUserTranscriptionStream) &&
                !/^\s/.test(safeChunk)
            ) {
                this.rawUserTranscriptionStream += ' ';
            }
            this.rawUserTranscriptionStream += safeChunk;

            const sanitizedFull = sanitizeAccumulatedTranscription(this.rawUserTranscriptionStream);
            if (!sanitizedFull) {
                logger.info(`[VoiceSession] Ignored discarded/hallucinated user transcription buffer: "${this.rawUserTranscriptionStream}"`);
                return;
            }

            this.userTranscriptionText = sanitizedFull;
            this.lastUserTranscription = this.userTranscriptionText.trim();
            logger.info(`[VoiceSession] User transcription accumulated: "${this.lastUserTranscription}" (raw chunk: "${text}")`);

            // ✅ FIX: Send accumulated sanitized user transcription to client in real-time for HUD display & keyword matching
            this.sendToClient({
                type: 'text',
                data: { text: this.lastUserTranscription, isUserTranscription: true }
            });

            // Programar corrección contextual temprana (~550ms tras el último fragmento de voz del usuario)
            // para que la burbuja del usuario se pula en ~0.5s sin esperar 15s hasta turnComplete
            if (this.earlyCorrectionTimer) {
                clearTimeout(this.earlyCorrectionTimer);
            }
            this.earlyCorrectionTimer = setTimeout(() => {
                this.earlyCorrectionTimer = null;
                this.triggerEarlyUserTranscriptionCorrection('user_pause');
            }, 550);

            // Detección en caliente de activación de Modo Fisioterapeuta / Ergonomía / Estudio de Puesto
            const fisioTriggers = /\b(fisioterapeuta|fisioterapia|ergonom[ií]a|ergon[oó]mic[ao]|estudio\s+(de\s+)?puesto|higiene\s+postural|biomec[aá]nic[ao]|evaluaci[oó]n\s+postural)\b/i;
            if (!this.isBiomechanics && !this.isFisioMode && fisioTriggers.test(this.lastUserTranscription)) {
                this.enableFisioterapeutaMode('voz');
            }

            // Fast-track real-time voice report trigger (only on explicit user command to generate report)
            if (!this.isGeneratingReport && this.conversationTurns && this.conversationTurns.length >= 1) {
                const userReportRegex = /\b(genera(r)?|haz|compil(a|ar)|dame|quiero|entreg(a|ar)|sacar?)\s+(el\s+|un\s+)?(informe|reporte)\b/i;
                const phoneticApproxRegex = /\b(general)\s+(el\s+|al\s+)?(informe|reporte)\b/i;
                if (userReportRegex.test(this.lastUserTranscription) || phoneticApproxRegex.test(this.lastUserTranscription)) {
                    logger.info(`[VoiceSession] Real-time voice trigger matched in user transcription: "${this.lastUserTranscription}"`);
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
            if (!this.aiResponseText) {
                this.triggerEarlyUserTranscriptionCorrection('ai_transcription_start');
            }
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
            this.clearAudioStreamEndWatchdog();
            this.toolCalledThisTurn = true;
            if (toolCall.functionCalls && Array.isArray(toolCall.functionCalls)) {
                if (!this.currentTurnToolCalls) this.currentTurnToolCalls = [];
                for (const callItem of toolCall.functionCalls) {
                    if (callItem && callItem.name) {
                        this.currentTurnToolCalls.push({
                            name: callItem.name,
                            args: callItem.args || {},
                        });
                    }
                }
            }
            this.triggerEarlyUserTranscriptionCorrection('tool_call');

            if (toolCall.functionCalls) {
                this.activeToolCount = (this.activeToolCount || 0) + 1;
                try {
                const userMeta = await this._loadUserMetaOnce();
                const resolvedCompId = (userMeta.isSubUser && userMeta.assignedCompany)
                    ? userMeta.assignedCompany
                    : (this.activeCompanyId || (this.config?.companyId ? String(this.config.companyId) : null) || (await resolveActiveCompanyId(this.userId)));
                if (resolvedCompId && !this.activeCompanyId) {
                    this.activeCompanyId = String(resolvedCompId);
                }
                const toolReq = {
                    user: {
                        id: this.userId,
                        _id: this.userId,
                        role: this.userRole || userMeta?.role || 'USER',
                        isSubUser: Boolean(userMeta?.isSubUser),
                        parentUser: userMeta?.parentUser || undefined,
                        assignedCompany: userMeta?.assignedCompany || undefined,
                    },
                    companyId: resolvedCompId || undefined,
                    isVoiceSession: true,
                    body: {
                        companyId: resolvedCompId || undefined,
                        conversationId: this.conversationId && this.conversationId !== 'new' ? this.conversationId : `tenshi-${this.userId}`,
                        ...(this.activeTenshiConversationId ? { tenshiConversationId: this.activeTenshiConversationId } : {}),
                        ...(Array.isArray(this.selectedTenshiNotebooks) && this.selectedTenshiNotebooks.length > 0
                            ? { selectedNotebooks: [...this.selectedTenshiNotebooks] }
                            : {}),
                    }
                };

                // Bonus — Paralelismo nativo cuando Gemini Live manda múltiples consultar_agente_especializado en el mismo toolCall
                const isNativeParallelSpecialistsBatch =
                    Array.isArray(toolCall.functionCalls) &&
                    toolCall.functionCalls.length >= 2 &&
                    toolCall.functionCalls.every((item) => item && item.name === 'consultar_agente_especializado');

                if (isNativeParallelSpecialistsBatch) {
                    const MAX_PARALLEL = 4;
                    const cappedCalls = toolCall.functionCalls.slice(0, MAX_PARALLEL);
                    const overflowCalls = toolCall.functionCalls.slice(MAX_PARALLEL);
                    const batchStates = cappedCalls.map((item, idx) => ({
                        index: idx,
                        label: String(item.args?.nombre_especialista || item.args?.agente || `Especialista ${idx + 1}`).trim(),
                        icon: '⏳',
                    }));
                    const emitBatchPill = () => {
                        const summary = batchStates.map((s) => `${s.icon} ${s.label}`).join(' · ');
                        this.sendToClient({
                            type: 'status',
                            data: {
                                status: 'loading',
                                message: `⚡ Mesa Técnica: ${summary}`,
                                toolName: 'consultar_agente_especializado',
                            },
                        });
                    };

                    logger.info(
                        `[VoiceSession] ⚡ Paralelismo nativo activado para ${cappedCalls.length} llamadas simultáneas a consultar_agente_especializado (overflow: ${overflowCalls.length})`
                    );
                    emitBatchPill();

                    const activeCompId = await resolveActiveCompanyId(this.userId);
                    const perVoiceCap = Math.max(1800, Math.floor(8500 / cappedCalls.length));

                    const settled = await Promise.allSettled(
                        cappedCalls.map((fcItem, idx) =>
                            this._executeSingleSpecialistToolCall(fcItem, toolReq, {
                                suppressLoadingPill: true,
                                suppressHistorySynced: true,
                                suppressIdle: true,
                                deferToolResponse: true,
                                activeCompIdOverride: activeCompId,
                                maxVoiceChars: perVoiceCap,
                                onProgress: (state, resolvedName) => {
                                    if (batchStates[idx]) {
                                        if (resolvedName) batchStates[idx].label = resolvedName;
                                        batchStates[idx].icon = state === 'completed' ? '✅' : state === 'error' ? '⚠️' : '⏳';
                                        emitBatchPill();
                                    }
                                },
                            })
                        )
                    );

                    const batchResponses = [];
                    let anySucceeded = false;

                    settled.forEach((outcome, idx) => {
                        const fcItem = cappedCalls[idx];
                        if (outcome.status === 'fulfilled' && outcome.value?.toolResponse) {
                            if (outcome.value.ok) anySucceeded = true;
                            batchResponses.push(outcome.value.toolResponse);
                        } else {
                            const errMsg = outcome.status === 'rejected'
                                ? (outcome.reason?.message || 'Error inesperado en consulta paralela')
                                : 'No se obtuvo respuesta del especialista';
                            batchResponses.push({
                                id: fcItem.id,
                                name: fcItem.name,
                                response: {
                                    result: `[FALLO AL CONSULTAR ESPECIALISTA ${batchStates[idx]?.label || 'Especialista'}]: ${errMsg}\n\n[INSTRUCCIÓN CRÍTICA DE HONESTIDAD EN ESPAÑOL]: NO afirmes que ya se consultó este especialista. Informa con honestidad el inconveniente.`,
                                },
                            });
                        }
                    });

                    for (const extraFc of overflowCalls) {
                        batchResponses.push({
                            id: extraFc.id,
                            name: extraFc.name,
                            response: {
                                result: `Límite máximo de ${MAX_PARALLEL} especialistas en paralelo alcanzado en este turno. Sintetiza primero los ${MAX_PARALLEL} dictámenes recibidos y ofrece consultar este especialista adicional si el usuario lo desea.`,
                            },
                        });
                    }

                    if (anySucceeded) {
                        const batchTenshiConvoId = await this.resolveTenshiConversationId(resolvedCompId);
                        this.sendToClient({
                            type: 'status',
                            data: {
                                status: 'history_synced',
                                hasFile: false,
                                ...(batchTenshiConvoId ? { conversationId: batchTenshiConvoId, tenshiConversationId: batchTenshiConvoId } : {}),
                            },
                        });
                    }
                    this.sendToClient({
                        type: 'status',
                        data: { status: 'idle', message: '' },
                    });

                    if (this.geminiClient && batchResponses.length > 0) {
                        this.sendGeminiToolResponse(batchResponses);
                    }
                    return;
                }

                for (const fc of toolCall.functionCalls) {
                    const immediateToolLabels = {
                        canvas_tool: `✍️ Redactando "${fc.args?.title || 'Informe Técnico'}"...`,
                        canvas: `✍️ Redactando "${fc.args?.title || 'Informe Técnico'}"...`,
                        wappy_crear_informe: `📄 Generando "${fc.args?.titulo || 'Informe Técnico'}"...`,
                        wappy_generar_informe: `📄 Generando "${fc.args?.titulo || 'Informe Técnico'}"...`,
                        wappy_leer_informe_aplicativo: `🔍 Leyendo Historial SOMOS SST (${fc.args?.aplicativo || 'Empresa'})...`,
                        wappy_enviar_correo: `📧 Enviando correo a ${fc.args?.destinatario || 'tu bandeja'}...`,
                        enviar_correo: `📧 Enviando correo a ${fc.args?.destinatario || 'tu bandeja'}...`,
                        wappy_gestionar_agenda: '📅 Sincronizando Agenda SG-SST...',
                        wappy_listar_agenda: '📅 Consultando Agenda SG-SST...',
                        wappy_generar_analisis_aplicativo: `⚡ Procesando análisis IA (${fc.args?.aplicativo || 'SOMOS SST'})...`,
                        wappy_abrir_chat_agente: '🤝 Conectando con especialista...',
                        wappy_consultar_especialista: '🩺 Consultando especialista...',
                        consultar_agente_especializado: `🩺 Consultando a ${fc.args?.nombre_especialista || 'especialista'}...`,
                        consultar_multiples_especialistas_paralelo: '⚡ Mesa Técnica Multi-Agente en paralelo...',
                        wappy_seleccionar_empresa: '🏢 Cambiando empresa activa...',
                        wappy_activar_empresa: '🏢 Activando empresa...',
                        wappy_delegar_orden_antigravity: '🚀 Delegando orden a Antigravity...',
                        delegar_orden_antigravity: '🚀 Delegando orden a Antigravity...',
                        wappy_buscar_historial_instantaneo: '🔎 Buscando en tu historial instantáneo...',
                        operar_interfaz_visual: '✨ Tenshi operando tu pantalla...',
                        gestor_automatizaciones: fc.args?.accion === 'ejecutar_tenshi'
                            ? '⚡ Ejecutando flujo instantáneo...'
                            : fc.args?.accion === 'consultar_documentacion_nodos' ||
                              ['documentacion_nodos', 'manual_nodos', 'guia_nodos', 'nodos', 'explicar_nodo', 'catalogo_nodos'].includes(String(fc.args?.accion || '').toLowerCase())
                                ? '📘 Consultando enciclopedia de nodos...'
                                : '⚙️ Gestionando automatizaciones...',
                    };
                    const immediateLabel = immediateToolLabels[fc.name] || `⚡ Ejecutando ${fc.name.replace(/^wappy_/, '').replace(/_/g, ' ')}...`;
                    this.sendToClient({
                        type: 'status',
                        data: { status: 'loading', message: immediateLabel, toolName: fc.name }
                    });

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
                                response: { 
                                    result: `Fase ${targetPhase} activada en la pantalla del usuario con éxito. INSTRUCCIÓN CRÍTICA DE RETROALIMENTACIÓN: Antes de pedir la siguiente postura, EXPLICA Y ANALIZA ORALMENTE en 1-2 oraciones lo que observaste en la postura de la fase anterior: menciona los ángulos articulares medidos (cuello, tronco o brazos), indica si la postura estuvo forzada o neutral y dale una recomendación física inmediata. Luego, pide al usuario adoptar la postura del Paso ${targetPhase}.`
                                }
                            }]);
                        }
                        continue;
                    }

                    // Manejo directo de herramienta nativa de informe
                    if (fc.name === 'generar_informe_tecnico' || fc.name === 'generar_informe_ergonomico' || fc.name === 'generar_informe_inspeccion_camara') {
                        const phaseCount = this.phaseEvidences ? Object.keys(this.phaseEvidences).length : 0;
                        const turnCount = this.conversationTurns ? this.conversationTurns.length : 0;
                        const hasFrames = (this.manualEvidences && this.manualEvidences.length > 0) || this.latestFrame;
                        const isTenshiOrFisio = this.config.mode === 'tenshi_voice' || this.isBiomechanics || this.isFisioMode;

                        // Solo rechazar si es un cliente estándar sin fotos NI frames NI turnos y NO es Tenshi ni Fisio
                        if (!isTenshiOrFisio && turnCount < 1 && phaseCount === 0 && !hasFrames) {
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

                        if (fc.args?.motivo) {
                            this.currentInspectionSubject = fc.args.motivo;
                        }

                        logger.info(`[VoiceSession] Gemini invoked native tool "${fc.name}" (motivo: ${this.currentInspectionSubject || 'N/A'})! Triggering report generation...`);
                        
                        this.sendToClient({
                            type: 'status',
                            data: { status: 'generating_report', message: 'Compilando informe técnico...' }
                        });

                        if (this.geminiClient) {
                            this.geminiClient.sendToolResponse([{
                                id: fc.id,
                                name: fc.name,
                                response: {
                                    output: "Compilación de informe técnico oficial iniciada en segundo plano. IMPORTANTE: El informe se está procesando actualmente y tardará unos segundos. PROHIBIDO afirmar, inventar o insinuar que el informe ya está listo hasta recibir la señal del sistema.",
                                    result: "Compilación de informe técnico oficial iniciada en segundo plano. PROHIBIDO afirmar que el informe ya está listo hasta recibir la confirmación explícita del sistema."
                                }
                            }]);

                            // Activación verbal inmediata vía realtimeInput
                            const verbalText = this.config.mode === 'tenshi_voice'
                                ? `INSTRUCCIÓN: Has iniciado la compilación del informe técnico de inspección (${this.currentInspectionSubject || 'inspección visual SST'}). Confírmale verbalmente al usuario en 1 sola frase breve y entusiasta: "Entendido, estoy procesando las evidencias fotográficas de la inspección para compilar tu informe técnico oficial. Por favor espera un momento conectado." PROHIBIDO DECIR QUE EL INFORME YA ESTÁ LISTO O TERMINADO.`
                                : 'INSTRUCCIÓN: Has iniciado la compilación del informe técnico ergonómico. Confírmale verbalmente al usuario en 1 sola frase breve y entusiasta: "Entendido, estoy procesando las evidencias para compilar tu informe técnico oficial. Por favor espera un momento conectado." PROHIBIDO DECIR QUE EL INFORME YA ESTÁ LISTO O TERMINADO.';
                            this.geminiClient.sendText(verbalText);
                        }

                        if (!this.isGeneratingReport) {
                            this.isGeneratingReport = true;
                            this.generateReport(this.config.conversationContext).finally(() => {
                                this.isGeneratingReport = false;
                            });
                        }
                        continue;
                    }

                    // Manejo directo de las 11 herramientas de Google NotebookLM / Gemini Notebook en modo voz
                    if (fc.name.startsWith('notebooklm_') || fc.name.startsWith('notebook_') || fc.name.startsWith('source_') || fc.name.startsWith('studio_') || fc.name.startsWith('research_')) {
                        logger.info(`[VoiceSession] Gemini Live invoked NotebookLM tool "${fc.name}" with args:`, JSON.stringify(fc.args));
                        this.sendToClient({
                            type: 'status',
                            data: { status: 'loading', message: `Consultando Google NotebookLM (${fc.name.replace(/_/g, ' ')})...` }
                        });
                        try {
                            let mappedTool = fc.name;
                            let mappedArgs = { ...(fc.args || {}) };
                            delete mappedArgs.dummy;
                            if (fc.name === 'notebooklm_listar_cuadernos' || fc.name === 'notebook_list') {
                                mappedTool = 'notebook_list';
                                mappedArgs = {};
                            } else if (fc.name === 'notebooklm_crear_cuaderno' || fc.name === 'notebook_create') {
                                mappedTool = 'notebook_create';
                                mappedArgs = { title: fc.args?.titulo || fc.args?.title || 'Nuevo Cuaderno SST' };
                            } else if (fc.name === 'notebooklm_renombrar_cuaderno' || fc.name === 'notebook_rename') {
                                mappedTool = 'notebook_rename';
                                mappedArgs = { notebook: fc.args?.cuaderno || fc.args?.notebook || '', new_title: fc.args?.nuevo_titulo || fc.args?.new_title || fc.args?.titulo || fc.args?.title || '' };
                            } else if (fc.name === 'notebooklm_consultar' || fc.name === 'chat_ask') {
                                mappedTool = 'chat_ask';
                                mappedArgs = { notebook: fc.args?.cuaderno || fc.args?.notebook || '', query: fc.args?.pregunta || fc.args?.query || fc.args?.question || '' };
                            } else if (fc.name === 'notebooklm_listar_fuentes' || fc.name === 'source_list') {
                                mappedTool = 'source_list';
                                mappedArgs = { notebook: fc.args?.cuaderno || fc.args?.notebook || '' };
                            } else if (fc.name === 'notebooklm_agregar_fuente' || fc.name === 'source_add') {
                                mappedTool = 'source_add';
                                mappedArgs = { notebook: fc.args?.cuaderno || fc.args?.notebook || '', source_type: fc.args?.tipo_fuente || fc.args?.source_type || 'url', url: fc.args?.url, text: fc.args?.texto || fc.args?.text, title: fc.args?.titulo || fc.args?.title };
                            } else if (fc.name === 'notebooklm_generar_studio' || fc.name === 'studio_generate') {
                                mappedTool = 'studio_generate';
                                mappedArgs = { notebook: fc.args?.cuaderno || fc.args?.notebook || '', artifact_type: fc.args?.tipo_artefacto || fc.args?.artifact_type || 'audio', instructions: fc.args?.instrucciones || fc.args?.instructions || '' };
                            } else if (fc.name === 'notebooklm_estado_studio' || fc.name === 'studio_status') {
                                mappedTool = 'studio_status';
                                mappedArgs = { task_id: fc.args?.task_id || '', notebook: fc.args?.cuaderno || fc.args?.notebook };
                            } else if (fc.name === 'notebooklm_listar_artefactos' || fc.name === 'studio_list') {
                                mappedTool = 'studio_list';
                                mappedArgs = { notebook: fc.args?.cuaderno || fc.args?.notebook || '' };
                            } else if (fc.name === 'notebooklm_descargar_artefacto' || fc.name === 'studio_download') {
                                mappedTool = 'studio_download';
                                mappedArgs = { artifact_id: fc.args?.artifact_id || '', notebook: fc.args?.cuaderno || fc.args?.notebook, output_path: fc.args?.output_path };
                            } else if (fc.name === 'notebooklm_investigar_web' || fc.name === 'research_start') {
                                mappedTool = 'research_start';
                                mappedArgs = { notebook: fc.args?.cuaderno || fc.args?.notebook || '', query: fc.args?.consulta || fc.args?.query || '', mode: fc.args?.modo || fc.args?.mode || 'fast' };
                            } else if (fc.name === 'notebooklm_importar_investigacion' || fc.name === 'research_import') {
                                mappedTool = 'research_import';
                                mappedArgs = { notebook: fc.args?.cuaderno || fc.args?.notebook || '', task_id: fc.args?.task_id || '' };
                            }
                            const selectedNbRefs = Array.isArray(this.selectedTenshiNotebooks)
                                ? this.selectedTenshiNotebooks.map(extractNotebookRef).filter(Boolean)
                                : [];
                            const toolsUsingNotebook = new Set([
                                'chat_ask',
                                'notebook_rename',
                                'source_list',
                                'source_add',
                                'studio_generate',
                                'studio_status',
                                'studio_list',
                                'studio_download',
                                'research_start',
                                'research_import',
                            ]);

                            let nbResult;
                            let multiAuthExpired = false;
                            if (
                                mappedTool === 'chat_ask' &&
                                !String(mappedArgs.notebook || '').trim() &&
                                selectedNbRefs.length > 1
                            ) {
                                const cappedSelected = selectedNbRefs.slice(0, 4);
                                const settled = await Promise.allSettled(
                                    cappedSelected.map((ref) =>
                                        executeTenshiMcpTool(
                                            'chat_ask',
                                            { notebook: ref.id, query: mappedArgs.query || '' },
                                            this.userId
                                        )
                                    )
                                );
                                const sections = [];
                                for (let idx = 0; idx < settled.length; idx++) {
                                    const out = settled[idx];
                                    const ref = cappedSelected[idx];
                                    const label = ref.title || ref.id;
                                    if (out.status === 'fulfilled') {
                                        if (out.value && typeof out.value === 'object' && out.value.authExpired) {
                                            multiAuthExpired = true;
                                            nbResult = out.value;
                                            break;
                                        }
                                        const val = typeof out.value === 'string' ? out.value : JSON.stringify(out.value);
                                        sections.push(`[Cuaderno "${label}"]:\n${val}`);
                                    } else {
                                        if (isNotebookLmAuthError(out.reason?.message)) {
                                            multiAuthExpired = true;
                                            nbResult = { ok: false, authExpired: true, error: out.reason?.message };
                                            break;
                                        }
                                        sections.push(`[Cuaderno "${label}"]: Error consultando (${out.reason?.message || 'sin respuesta'})`);
                                    }
                                }
                                if (!multiAuthExpired) {
                                    nbResult = sections.join('\n\n---\n\n');
                                }
                            } else {
                                if (
                                    toolsUsingNotebook.has(mappedTool) &&
                                    !String(mappedArgs.notebook || '').trim() &&
                                    selectedNbRefs.length > 0
                                ) {
                                    mappedArgs.notebook = selectedNbRefs[0].id;
                                }
                                nbResult = await executeTenshiMcpTool(mappedTool, mappedArgs, this.userId);
                            }

                            const nbErrText =
                                (nbResult && typeof nbResult === 'object'
                                    ? String(nbResult.error || nbResult.result?.error || '')
                                    : typeof nbResult === 'string' && /^error\b/i.test(nbResult.trim())
                                    ? nbResult
                                    : ''
                                ).trim();
                            const nbAuthExpired =
                                multiAuthExpired ||
                                Boolean(nbResult && typeof nbResult === 'object' && nbResult.authExpired) ||
                                isNotebookLmAuthError(nbErrText || (typeof nbResult === 'string' ? nbResult : ''));
                            const nbFailed =
                                !nbResult ||
                                (typeof nbResult === 'object' && nbResult.ok === false) ||
                                Boolean(nbErrText) ||
                                nbAuthExpired;

                            if (nbAuthExpired) {
                                logger.warn(`[VoiceSession] 🔐 Google NotebookLM auth expired during "${fc.name}" (mapped="${mappedTool}"): ${nbErrText || 'sesión expirada'}`);
                                try {
                                    const NotebookSession = mongoose.models.NotebookSession || require('~/models/NotebookSession');
                                    await markNotebookSessionInvalid(NotebookSession, this.userId);
                                } catch (_) {}
                                const authExpiredMsg =
                                    (nbResult && typeof nbResult === 'object' && nbResult.mensaje) ||
                                    'Tu sesión de Google NotebookLM caducó. Reconecta tu cuenta en 1 clic desde la píldora "Cuadernos" o en Mi Cuenta → Integraciones → Google NotebookLM.';
                                this.sendToClient({
                                    type: 'status',
                                    data: { status: 'idle', message: '' },
                                });
                                this.sendToClient({
                                    type: 'notebooklm_auth_expired',
                                    data: {
                                        toolName: fc.name,
                                        mappedTool,
                                        authExpired: true,
                                        isValid: false,
                                        reason: nbErrText || 'Sesión de Google NotebookLM caducada (token CSRF o cookies expiradas)',
                                        message: authExpiredMsg,
                                    },
                                });
                                if (this.geminiClient) {
                                    this.sendGeminiToolResponse([{
                                        id: fc.id,
                                        name: fc.name,
                                        response: {
                                            ok: false,
                                            authExpired: true,
                                            mensaje: `${authExpiredMsg} [INSTRUCCIÓN CRÍTICA DE HONESTIDAD EN ESPAÑOL]: La consulta a Google NotebookLM falló porque la sesión de Google caducó. ESTÁ PROHIBIDO afirmar que consultaste el cuaderno o que entregaste un artefacto. Informa claramente en español que la sesión de Google NotebookLM expiró y que puede reconectarla en 1 clic desde la píldora "Cuadernos".`,
                                        },
                                    }]);
                                }
                                continue;
                            }

                            if (nbFailed) {
                                logger.warn(`[VoiceSession] ⚠️ NotebookLM tool "${fc.name}" failed: ${nbErrText || 'sin resultado'}`);
                                this.sendToClient({
                                    type: 'status',
                                    data: { status: 'idle', message: '' },
                                });
                                const failMsg =
                                    (nbResult && typeof nbResult === 'object' && nbResult.mensaje) ||
                                    nbErrText ||
                                    'No se pudo completar la consulta en Google NotebookLM.';
                                if (this.geminiClient) {
                                    this.sendGeminiToolResponse([{
                                        id: fc.id,
                                        name: fc.name,
                                        response: {
                                            ok: false,
                                            authExpired: false,
                                            error: failMsg,
                                            mensaje: `${failMsg} [INSTRUCCIÓN CRÍTICA DE HONESTIDAD EN ESPAÑOL]: NO digas que la operación se completó ni que entregaste un artefacto. Informa brevemente el error real en español.`,
                                        },
                                    }]);
                                }
                                continue;
                            }

                            logger.info(`[VoiceSession] ✅ NotebookLM tool "${fc.name}" executed successfully.`);
                            this.sendToClient({
                                type: 'status',
                                data: { status: 'idle', message: '' },
                            });
                            this.sendToClient({
                                type: 'wappy_action',
                                data: {
                                    id: fc.id,
                                    name: fc.name,
                                    args: {
                                        ...(fc.args || {}),
                                        ...(mappedArgs.notebook ? { notebook: mappedArgs.notebook } : {}),
                                        ...(selectedNbRefs.length > 0 ? { selectedNotebooks: [...this.selectedTenshiNotebooks] } : {}),
                                    },
                                    result: nbResult,
                                }
                            });
                            if (this.geminiClient) {
                                this.sendGeminiToolResponse([{
                                    id: fc.id,
                                    name: fc.name,
                                    response: { result: typeof nbResult === 'string' ? nbResult : JSON.stringify(nbResult) }
                                }]);
                            }
                        } catch (nbErr) {
                            logger.error(`[VoiceSession] Error executing NotebookLM tool "${fc.name}":`, nbErr);
                            this.sendToClient({
                                type: 'status',
                                data: { status: 'idle', message: '' },
                            });
                            const caughtAuthExpired = isNotebookLmAuthError(nbErr?.message);
                            if (caughtAuthExpired) {
                                try {
                                    const NotebookSession = mongoose.models.NotebookSession || require('~/models/NotebookSession');
                                    await markNotebookSessionInvalid(NotebookSession, this.userId);
                                } catch (_) {}
                                const authExpiredMsg =
                                    'Tu sesión de Google NotebookLM caducó. Reconecta tu cuenta en 1 clic desde la píldora "Cuadernos" o en Mi Cuenta → Integraciones → Google NotebookLM.';
                                this.sendToClient({
                                    type: 'notebooklm_auth_expired',
                                    data: {
                                        toolName: fc.name,
                                        authExpired: true,
                                        isValid: false,
                                        reason: nbErr?.message || 'Sesión de Google NotebookLM caducada',
                                        message: authExpiredMsg,
                                    },
                                });
                                if (this.geminiClient) {
                                    this.sendGeminiToolResponse([{
                                        id: fc.id,
                                        name: fc.name,
                                        response: {
                                            ok: false,
                                            authExpired: true,
                                            mensaje: `${authExpiredMsg} [INSTRUCCIÓN CRÍTICA DE HONESTIDAD EN ESPAÑOL]: Informa claramente en español que la sesión de Google NotebookLM expiró y que debe reconectarla en 1 clic desde la píldora "Cuadernos".`,
                                        },
                                    }]);
                                }
                            } else if (this.geminiClient) {
                                this.sendGeminiToolResponse([{
                                    id: fc.id,
                                    name: fc.name,
                                    response: {
                                        ok: false,
                                        authExpired: false,
                                        error: `No se pudo consultar Google NotebookLM: ${nbErr.message}`,
                                        mensaje: `No se pudo consultar Google NotebookLM: ${nbErr.message}`,
                                    },
                                }]);
                            }
                        }
                        continue;
                    }

                    // Manejo directo de Google Flow Studio (Veo 3.1 Lite & Nano Banana 2 Lite) y Biblioteca Multimedia 30 días en modo voz
                    if (fc.name.startsWith('google_flow')) {
                        logger.info(`[VoiceSession] Gemini Live invoked Google Flow tool "${fc.name}" with args:`, fc.args);
                        try {
                            const {
                                executeFlowImageGeneration,
                                executeFlowVideoGeneration,
                                listDownloadedMediaLibrary,
                            } = require('~/server/routes/googleflow');
                            const TenshiMessage = require('~/models/TenshiMessage');

                            if (fc.name === 'google_flow_listar_recursos' || fc.args?.accion === 'listar_recursos') {
                                const filtro = fc.args?.filtro || fc.args?.filtro_fuente || 'all';
                                const items = await listDownloadedMediaLibrary(filtro);
                                const summary = items.length === 0
                                    ? 'No hay recursos multimedia descargados de Google Flow o NotebookLM en los últimos 30 días.'
                                    : `Hay ${items.length} recursos multimedia disponibles en el servidor (retención 30 días):\n` +
                                      items.slice(0, 15).map((it, idx) => `${idx + 1}. [${it.source}] ${it.label} (${it.mediaType}) -> ${it.publicUrl} (${it.daysRemaining}d restantes)`).join('\n');

                                this.sendToClient({
                                    type: 'wappy_action',
                                    data: { id: fc.id, name: fc.name, args: fc.args, result: summary }
                                });
                                if (this.geminiClient) {
                                    this.sendGeminiToolResponse([{
                                        id: fc.id,
                                        name: fc.name,
                                        response: { result: summary }
                                    }]);
                                }
                                continue;
                            }

                            const isVideo = fc.name === 'google_flow_generar_video' || fc.args?.accion === 'generar_video';
                            const prompt = fc.args?.prompt || fc.args?.descripcion || 'Escena profesional de Seguridad y Salud en el Trabajo';
                            const aspecto = fc.args?.aspecto || '16:9';

                            this.sendToClient({
                                type: 'status',
                                data: {
                                    status: 'loading',
                                    message: isVideo
                                        ? 'Generando video en Google Flow Studio (Veo 3.1 Lite)...'
                                        : 'Generando imagen en Google Flow Studio (Nano Banana 2 Lite)...'
                                }
                            });

                            if (isVideo) {
                                const vidRes = await executeFlowVideoGeneration({
                                    userId: this.userId,
                                    prompt,
                                    aspectRatio: aspecto,
                                    cameraMotion: fc.args?.movimiento_camara || 'zoom_in',
                                });
                                const mdContent = `🎬 **Video generado con Google Flow Studio (Veo 3.1 Lite)**\n\n[🎬 Reproducir Video (${vidRes.filename})](${vidRes.publicUrl}${vidRes.posterUrl ? `?poster=${encodeURIComponent(vidRes.posterUrl)}` : ''})\n\n💾 **Guardado en WAPPY (30 días):** \`${vidRes.publicUrl}\``;
                                if (this.userId) {
                                    const activeCompId = await resolveActiveCompanyId(this.userId);
                                    const tenshiConvoId = await this.resolveTenshiConversationId(activeCompId);
                                    await TenshiMessage.create({
                                        user: this.userId,
                                        companyId: activeCompId,
                                        conversationId: tenshiConvoId || null,
                                        role: 'assistant',
                                        content: mdContent,
                                    }).catch(() => {});
                                }
                                this.sendToClient({
                                    type: 'wappy_action',
                                    data: { id: fc.id, name: fc.name, args: fc.args, result: mdContent, publicUrl: vidRes.publicUrl }
                                });
                                this.sendToClient({ type: 'status', data: { status: 'idle', message: '' } });
                                if (this.geminiClient) {
                                    this.sendGeminiToolResponse([{
                                        id: fc.id,
                                        name: fc.name,
                                        response: { result: `Video generado y descargado exitosamente en ${vidRes.publicUrl} (guardado por 30 días y listo para reproducirse en el chat o insertarse en Canvas). Confírmaselo al usuario en español.` }
                                    }]);
                                }
                            } else {
                                const imgRes = await executeFlowImageGeneration({
                                    userId: this.userId,
                                    prompt,
                                    aspectRatio: aspecto,
                                    style: fc.args?.estilo || 'fotorrealista',
                                });
                                const mdContent = `✨ **Imagen generada con Google Flow Studio (Nano Banana 2 Lite)**\n\n![${prompt.slice(0, 80)}](${imgRes.publicUrl})\n\n💾 **Guardado en WAPPY (30 días):** \`${imgRes.publicUrl}\``;
                                if (this.userId) {
                                    const activeCompId = await resolveActiveCompanyId(this.userId);
                                    const tenshiConvoId = await this.resolveTenshiConversationId(activeCompId);
                                    await TenshiMessage.create({
                                        user: this.userId,
                                        companyId: activeCompId,
                                        conversationId: tenshiConvoId || null,
                                        role: 'assistant',
                                        content: mdContent,
                                    }).catch(() => {});
                                }
                                this.sendToClient({
                                    type: 'wappy_action',
                                    data: { id: fc.id, name: fc.name, args: fc.args, result: mdContent, publicUrl: imgRes.publicUrl }
                                });
                                this.sendToClient({ type: 'status', data: { status: 'idle', message: '' } });
                                if (this.geminiClient) {
                                    this.sendGeminiToolResponse([{
                                        id: fc.id,
                                        name: fc.name,
                                        response: { result: `Imagen generada y descargada exitosamente en ${imgRes.publicUrl} (guardada por 30 días y lista para verse en pantalla o insertarse en Canvas). Confírmaselo al usuario en español.` }
                                    }]);
                                }
                            }
                        } catch (flowErr) {
                            logger.error(`[VoiceSession] Error executing Google Flow tool "${fc.name}":`, flowErr);
                            this.sendToClient({ type: 'status', data: { status: 'idle', message: '' } });
                            if (this.geminiClient) {
                                this.sendGeminiToolResponse([{
                                    id: fc.id,
                                    name: fc.name,
                                    response: { error: `No se pudo ejecutar Google Flow: ${flowErr.message}` }
                                }]);
                            }
                        }
                        continue;
                    }

                    // Manejo directo de herramienta de Google Drive en modo voz
                    if (fc.name === 'google_drive') {
                        const userContextLower = `${this.userTranscriptionText || ''} ${this.lastUserTranscription || ''} ${fc.args?.query || ''}`.toLowerCase();
                        const explicitlyMentionsDrive = /\b(drive|google\s+drive|mi\s+nube|carpetas?\s+de\s+drive)\b/i.test(`${this.userTranscriptionText || ''} ${this.lastUserTranscription || ''}`);
                        const asksForSstReport = /\b(informe|reporte|an[aá]lisis|condiciones\s+de\s+salud|responsable|pol[ií]tica|objetivos|diagn[oó]stico|0312|sociodemogr[aá]fico|vulnerabilidad|emergencia|auditor[ií]a|gtc\s*45|ipevar|pesv|matriz\s+legal|rit|reglamento|perfil|estudio\s+de\s+puesto|owas|somos\s+sst|historial)\b/i.test(userContextLower);

                        if (!explicitlyMentionsDrive && asksForSstReport && (!fc.args?.action || fc.args.action === 'list_files_and_folders')) {
                            let redirectedApp = fc.args?.query || 'responsable';
                            if (/condiciones\s+de\s+salud|salud/i.test(userContextLower)) redirectedApp = 'condiciones_salud';
                            else if (/sociodemogr/i.test(userContextLower)) redirectedApp = 'perfil_socio';
                            else if (/responsab/i.test(userContextLower)) redirectedApp = 'responsable';
                            else if (/pol[ií]tica/i.test(userContextLower)) redirectedApp = 'politica';
                            else if (/objetivo|indicador/i.test(userContextLower)) redirectedApp = 'objetivos';
                            else if (/diagn[oó]stico|0312/i.test(userContextLower)) redirectedApp = 'diagnostico_0312';
                            else if (/gtc|ipevar|peligro/i.test(userContextLower)) redirectedApp = 'gtc45';
                            else if (/pesv|vial/i.test(userContextLower)) redirectedApp = 'pesv';
                            else if (/vulnerab|emergencia/i.test(userContextLower)) redirectedApp = 'vulnerabilidad';
                            else if (/auditor/i.test(userContextLower)) redirectedApp = 'auditoria';
                            else if (/legal/i.test(userContextLower)) redirectedApp = 'legal';
                            else if (/rit|reglamento/i.test(userContextLower)) redirectedApp = 'rit';
                            else if (/cargo|profesiograma/i.test(userContextLower)) redirectedApp = 'perfil_cargo';

                            logger.info(`[VoiceSession] PRIORIDAD SOMOS SST: Interceptando google_drive -> wappy_leer_informe_aplicativo para "${redirectedApp}" (el usuario no mencionó Drive).`);
                            try {
                                const reportRes = await executeTenshiMcpTool('wappy_leer_informe_aplicativo', { aplicativo: redirectedApp }, this.userId);
                                if (reportRes && typeof reportRes === 'object') {
                                    const rawHtml = reportRes.informeOriginalHtml || reportRes.informeCompleto;
                                    if (rawHtml && (rawHtml.includes('<html') || rawHtml.includes('<div') || rawHtml.includes('<table'))) {
                                        this.lastGeneratedReportHtml = rawHtml;
                                        this.lastGeneratedCanvasFile = {
                                            title: reportRes.titulo || `Informe Oficial de ${reportRes.aplicativo || redirectedApp}`,
                                            fileType: 'html',
                                            content: rawHtml,
                                        };
                                        this.sendToClient({
                                            type: 'canvas_file_generated',
                                            data: this.lastGeneratedCanvasFile
                                        });
                                    }
                                }
                                const safeRes = { ...(reportRes || {}) };
                                delete safeRes.informeOriginalHtml;
                                const safeStr = JSON.stringify(safeRes).slice(0, 5500);
                                this.sendGeminiToolResponse([{
                                    id: fc.id,
                                    name: fc.name,
                                    response: { result: `[CONSULTADO EN HISTORIAL OFICIAL DE SOMOS SST / WAPPY]: ${safeStr}` }
                                }]);
                            } catch (redirErr) {
                                logger.error('[VoiceSession] Error in SOMOS SST redirect from google_drive:', redirErr);
                                this.sendGeminiToolResponse([{
                                    id: fc.id,
                                    name: fc.name,
                                    response: { error: `Error consultando informe en SOMOS SST: ${redirErr.message}` }
                                }]);
                            }
                            continue;
                        }

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
                                this.sendGeminiToolResponse([{
                                    id: fc.id,
                                    name: fc.name,
                                    response: { result: String(driveResult || '').slice(0, 6000) }
                                }]);
                            }
                        } catch (driveErr) {
                            logger.error('[VoiceSession] Error executing google_drive in voice mode:', driveErr);
                            if (this.geminiClient) {
                                this.sendGeminiToolResponse([{
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

                    // Manejo directo de videollamada y colgar por voz con GUARDIA ESTRICTA
                    if (fc.name === 'wappy_controlar_videollamada' || fc.name === 'controlar_videollamada') {
                        const accion = fc.args?.accion || 'activar_camara';
                        logger.info(`[VoiceSession] Gemini Live invoked tool "${fc.name}" with accion: ${accion}`);

                        const recentUserText = `${this.userTranscriptionText || ''} ${this.lastUserTranscription || ''} ${this.lastUserRequest || ''}`.toLowerCase().trim();

                        // GUARDIA DE SEGURIDAD ESTRICTA 1: La cámara NUNCA debe encenderse sin orden explícita del usuario
                        if (accion === 'activar_camara') {
                            const explicitCameraKeywords = /\b(activa|activar|enciende|encender|inicia|iniciar|pon|poner|prende|prender|abre|abrir|mostrar|ver)\s+(la\s+)?(c[aá]mara|videollamada|video|visi[oó]n)\b|\b(videollamada|c[aá]mara\s+en\s+vivo|activa\s+c[aá]mara|activa\s+video|prende\s+c[aá]mara)\b/i;
                            const isExplicitCamera = explicitCameraKeywords.test(recentUserText);

                            if (!isExplicitCamera) {
                                logger.warn(`[VoiceSession] RECHAZADA activación alucinada de cámara. Texto del usuario: "${recentUserText}"`);
                                if (this.geminiClient) {
                                    this.sendGeminiToolResponse([{
                                        id: fc.id,
                                        name: fc.name,
                                        response: {
                                            error: "Cámara NO activada: La cámara y videollamada requieren una orden explícita del usuario (ej: 'activa la cámara', 'enciende la cámara', 'inicia videollamada'). NUNCA actives la cámara por tu cuenta ante menciones casuales, refranes o de objetos sin orden explícita."
                                        }
                                    }]);
                                }
                                continue;
                            }
                        }

                        // GUARDIA DE SEGURIDAD ESTRICTA 2: NUNCA colgar la llamada ante ruido, silencio, pausa ("para", "espera") o un "no"/"ok" suelto.
                        // Solo permitir colgar cuando el usuario pronuncie explícitamente una orden de colgar o despedida real en el turno actual.
                        if (accion === 'colgar_llamada') {
                            const currentTrimmed = sanitizeAccumulatedTranscription(this.userTranscriptionText || '').trim();
                            const isPauseSpeechOnly = /^(para|p[aá]rate|detente|espera|esp[eé]rate|un\s+momento|momento|silencio|c[aá]llate|basta|ya|no\s+sigas|para\s+ah[ií]|aguanta|alto|pausa)[.!?,]*$/i.test(currentTrimmed);
                            const isBareNegativeOrAck = /^(?:no+|nada|ninguno|ninguna|no\s*,?\s*nada|no\s*,?\s*gracias|nada\s+m[aá]s|ok+|oki+|dale|listo|bien|bueno|aj[aá]|mm+|eh+|ah+)[.!?,]*$/i.test(currentTrimmed);
                            const explicitHangupOrFarewell = /\b(cuelga|colgar|termina(r)?\s+(la\s+)?(llamada|sesi[oó]n|comunicaci[oó]n|conversaci[oó]n)|finaliza(r)?\s+(la\s+)?(llamada|sesi[oó]n|comunicaci[oó]n|conversaci[oó]n)|corta(r)?\s+(la\s+)?llamada|desconecta(r)?(\s+la\s+llamada)?|apaga(r)?\s+tenshi|hasta\s+(luego|pronto|ma[ñn]ana|la\s+pr[oó]xima)|nos\s+vemos|(muchas\s+)?gracias\s+por\s+todo|eso\s+(es|era|fue)\s+todo(\s+por\s+hoy|\s*,?\s*gracias)?|nada\s+m[aá]s\s+por\s+(hoy|ahora)|adi[oó]s|chao|chau|bye|feliz\s+(noche|tarde|d[ií]a)|buenas\s+noches|descansa\s+tenshi)\b/i;

                            const shouldRejectHangup =
                                !currentTrimmed ||
                                isPauseSpeechOnly ||
                                isBareNegativeOrAck ||
                                !explicitHangupOrFarewell.test(currentTrimmed);

                            if (shouldRejectHangup) {
                                const aiAlreadySpokeThisTurn =
                                    (this.aiTranscriptionBuffer || this.aiResponseText || '').trim().length > 0 ||
                                    (this.aiAudioChunkCount || 0) > 5;
                                logger.warn(
                                    `[VoiceSession] RECHAZADO colgar_llamada no solicitado. currentTrimmed="${currentTrimmed}", isPause=${isPauseSpeechOnly}, aiAlreadySpoke=${aiAlreadySpokeThisTurn}`
                                );
                                if (this.geminiClient) {
                                    const rejectionPayload = (aiAlreadySpokeThisTurn || !isPauseSpeechOnly)
                                        ? { ok: false, sessionRemainsActive: true, silentWait: true }
                                        : { ok: false, sessionRemainsActive: true };
                                    this.sendGeminiToolResponse([{
                                        id: fc.id,
                                        name: fc.name,
                                        response: rejectionPayload
                                    }]);
                                }
                                continue;
                            }

                            const alreadySaidGoodbye = /\b(chao|chau|adi[oó]s|hasta\s+(luego|pronto|ma[ñn]ana|la\s+pr[oó]xima)|excelente\s+(d[ií]a|tarde|noche)|feliz\s+(d[ií]a|tarde|noche)|nos\s+vemos|gusto\s+ayudarte)\b/i.test(
                                this.aiTranscriptionBuffer || this.aiResponseText || ''
                            );

                            this.pendingHangupAfterTurn = true;
                            this.hangupFarewellAlreadySpoken = alreadySaidGoodbye;
                            this.hangupToolSentAt = Date.now();
                            this.schedulePendingHangup(
                                alreadySaidGoodbye ? 1200 : 6000,
                                alreadySaidGoodbye ? 'already_said_goodbye_drain' : 'hangup_safety_timer',
                                fc.id
                            );

                            if (this.geminiClient) {
                                this.sendGeminiToolResponse([{
                                    id: fc.id,
                                    name: fc.name,
                                    response: {
                                        ok: true,
                                        status: 'call_closing',
                                        farewellAlreadySpoken: alreadySaidGoodbye
                                    }
                                }]);
                            }
                            continue;
                        }

                        this.sendToClient({
                            type: 'wappy_action',
                            data: {
                                id: fc.id,
                                name: 'wappy_controlar_videollamada',
                                args: { accion }
                            }
                        });
                        if (this.geminiClient) {
                            const respText = accion === 'activar_camara'
                                ? "Cámara y videollamada activadas con éxito en la pantalla del usuario."
                                : accion === 'apagar_camara'
                                ? "Cámara apagada con éxito. Continuando únicamente por audio."
                                : "Llamada finalizada y colgada a petición del usuario.";
                            this.sendGeminiToolResponse([{
                                id: fc.id,
                                name: fc.name,
                                response: { result: respText }
                            }]);
                        }
                        continue;
                    }

                    // Manejo directo de abrir curso en WAPPY Academia LMS (/training/:id/:slug)
                    if (fc.name === 'wappy_abrir_curso' || fc.name === 'abrir_curso') {
                        const query = fc.args?.curso || fc.args?.course || fc.args?.id || fc.args?.titulo || fc.args?.title || '';
                        logger.info(`[VoiceSession] Gemini Live invoked tool "${fc.name}" with query: "${query}"`);
                        try {
                            const course = await findMatchingCourse(query);
                            if (course) {
                                const slug = sanitizeSlug(course.title);
                                const targetRoute = `/training/${course._id}/${slug}`;
                                logger.info(`[VoiceSession] Abriendo curso "${course.title}" en ruta: ${targetRoute}`);
                                this.sendToClient({
                                    type: 'wappy_action',
                                    data: {
                                        id: fc.id,
                                        name: 'wappy_navegar',
                                        args: { ruta: targetRoute, modulo: 'training' }
                                    }
                                });
                                if (this.geminiClient) {
                                    this.sendGeminiToolResponse([{
                                        id: fc.id,
                                        name: fc.name,
                                        response: {
                                            result: `Curso "${course.title}" abierto con éxito en la pantalla del usuario en la ruta ${targetRoute}. Confirma al usuario en una sola frase breve y entusiasta: "¡Listo! Ya te abrí el curso '${course.title}' en pantalla para que continúes tus lecciones."`
                                        }
                                    }]);
                                }
                            } else {
                                this.sendToClient({
                                    type: 'wappy_action',
                                    data: {
                                        id: fc.id,
                                        name: 'wappy_navegar',
                                        args: { ruta: '/academia?tab=cursos', modulo: 'academia' }
                                    }
                                });
                                if (this.geminiClient) {
                                    this.sendGeminiToolResponse([{
                                        id: fc.id,
                                        name: fc.name,
                                        response: {
                                            result: `No encontré un curso específico para "${query}", pero te he abierto el catálogo de cursos de WAPPY Academia (/academia?tab=cursos) en pantalla. Confirma brevemente al usuario.`
                                        }
                                    }]);
                                }
                            }
                        } catch (courseErr) {
                            logger.error('[VoiceSession] Error executing wappy_abrir_curso:', courseErr);
                            if (this.geminiClient) {
                                this.sendGeminiToolResponse([{
                                    id: fc.id,
                                    name: fc.name,
                                    response: { error: `Error abriendo curso: ${courseErr.message}` }
                                }]);
                            }
                        }
                        continue;
                    }

                    // Manejo directo de abrir artículo de blog (/blog/:id/:slug)
                    if (fc.name === 'wappy_abrir_articulo_blog' || fc.name === 'abrir_articulo_blog' || fc.name === 'abrir_blog') {
                        const query = fc.args?.articulo || fc.args?.slug || fc.args?.id || fc.args?.titulo || '';
                        logger.info(`[VoiceSession] Gemini Live invoked tool "${fc.name}" with query: "${query}"`);
                        try {
                            const post = await findMatchingBlogPost(query);
                            if (post) {
                                const slug = sanitizeSlug(post.title);
                                const targetRoute = `/blog/${post._id}/${slug}`;
                                logger.info(`[VoiceSession] Abriendo artículo de blog "${post.title}" en ruta: ${targetRoute}`);
                                this.sendToClient({
                                    type: 'wappy_action',
                                    data: {
                                        id: fc.id,
                                        name: 'wappy_navegar',
                                        args: { ruta: targetRoute, modulo: 'blog' }
                                    }
                                });
                                if (this.geminiClient) {
                                    this.sendGeminiToolResponse([{
                                        id: fc.id,
                                        name: fc.name,
                                        response: {
                                            result: `Artículo "${post.title}" abierto con éxito en la pantalla del usuario en la ruta ${targetRoute}. Confirma al usuario en una sola frase breve.`
                                        }
                                    }]);
                                }
                            } else {
                                this.sendToClient({
                                    type: 'wappy_action',
                                    data: {
                                        id: fc.id,
                                        name: 'wappy_navegar',
                                        args: { ruta: '/academia?tab=blog', modulo: 'blog' }
                                    }
                                });
                                if (this.geminiClient) {
                                    this.sendGeminiToolResponse([{
                                        id: fc.id,
                                        name: fc.name,
                                        response: {
                                            result: `No encontré el artículo exacto "${query}", pero te he abierto la sección de Blog de WAPPY (/academia?tab=blog) en pantalla.`
                                        }
                                    }]);
                                }
                            }
                        } catch (blogErr) {
                            logger.error('[VoiceSession] Error executing wappy_abrir_articulo_blog:', blogErr);
                            if (this.geminiClient) {
                                this.sendGeminiToolResponse([{
                                    id: fc.id,
                                    name: fc.name,
                                    response: { error: `Error abriendo artículo del blog: ${blogErr.message}` }
                                }]);
                            }
                        }
                        continue;
                    }

                    // Manejo directo de Canvas / Archivos (Word, Excel, HTML, Presentación) en modo voz.
                    if (fc.name === 'canvas_tool' || fc.name === 'canvas') {
                        const userRequestText = (this.userTranscriptionText || '').trim() || this.lastUserRequest || fc.args?.title || '';
                        const reqLower = `${userRequestText} ${this.lastUserTranscription || ''} ${fc.args?.title || ''}`.toLowerCase();

                        // DESAMBIGUACIÓN DETERMINISTA: Solo redirigir al editor nativo de un aplicativo /sgsst
                        // cuando realmente corresponde (nunca por "módulo"/"pantalla" ni cuando piden Canvas/HTML/Word/Excel/interactivo o están en Modo Hero).
                        const isAppReport = shouldRedirectReportToSgsstApp(
                            reqLower,
                            fc.args,
                            this.activeScreenRoute,
                            this.isHeroMode
                        );

                        if (isAppReport) {
                            logger.info(`[VoiceSession] canvas_tool redirected to wappy_generar_analisis_aplicativo for app report ("${userRequestText}", route="${this.activeScreenRoute}", isHeroMode=${this.isHeroMode})`);
                            let app = 'actual';
                            if (/pol[ií]tica/i.test(reqLower)) app = 'politica';
                            else if (/objetivo/i.test(reqLower)) app = 'objetivos';
                            else if (/legal/i.test(reqLower)) app = 'legal';
                            else if (/rit|reglamento/i.test(reqLower)) app = 'rit';
                            else if (/cargo/i.test(reqLower)) app = 'perfil_cargo';
                            else if (/diagn[oó]stico|0312/i.test(reqLower)) app = 'diagnostico';
                            else if (/emergencia|vulnerab/i.test(reqLower)) app = 'vulnerabilidad';
                            else if (/responsable/i.test(reqLower)) app = 'responsable';

                            const isOnSgsstAppNow = !this.isHeroMode && String(this.activeScreenRoute || '').startsWith('/sgsst');

                            // Disparar click real en "Generar IA" únicamente si estamos realmente dentro de /sgsst (sin Modo Hero)
                            if (isOnSgsstAppNow) {
                                this.sendToClient({
                                    type: 'wappy_action',
                                    data: {
                                        id: fc.id,
                                        name: 'operar_interfaz_visual',
                                        args: { accion: 'click', detalle: 'Generar IA', texto: 'Generar IA' }
                                    }
                                });
                            }

                            if (app !== 'actual') {
                                this.sendToClient({
                                    type: 'wappy_action',
                                    data: {
                                        id: `${fc.id}-app`,
                                        name: 'wappy_generar_analisis_aplicativo',
                                        args: { aplicativo: app, instruccion_adicional: userRequestText }
                                    }
                                });
                            }

                            if (this.geminiClient) {
                                this.sendGeminiToolResponse([{
                                    id: fc.id,
                                    name: fc.name,
                                    response: { result: `Generación de Análisis IA ejecutada exitosamente dentro del aplicativo${app !== 'actual' ? ` "${app}"` : ' en pantalla'}. Confirma al usuario en una sola frase breve y entusiasta: "¡Listo! Ya activé la generación del informe con Inteligencia Artificial directamente en el editor del aplicativo en tu pantalla."` }
                                }]);
                            }
                            continue;
                        }

                        logger.info(`[VoiceSession] Gemini Live invoked tool "canvas_tool" with title: "${fc.args?.title}", fileType: "${fc.args?.fileType}"`);
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

                            const found = await findCompanyByTermForUser(targetUserId, term);
                            if (found) {
                                await CompanyInfo.updateMany({ user: targetUserId }, { isActive: false });
                                found.isActive = true;
                                await found.save();
                                const prevCompId = this.activeCompanyId;
                                this.activeCompanyId = String(found._id);
                                if (prevCompId && prevCompId !== this.activeCompanyId) {
                                    this.activeTenshiConversationId = null;
                                }
                                if (this.config) this.config.companyId = String(found._id);
                                await syncCompanyMemory(targetUserId, found);
                                logger.info(`[VoiceSession] Activated company "${found.companyName}" (${found._id})`);

                                this.sendToClient({
                                    type: 'wappy_action',
                                    data: {
                                        id: fc.id,
                                        name: fc.name,
                                        args: fc.args,
                                        result: { success: true, companyName: found.companyName, companyId: found._id, companyData: found, empresa: found }
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

                    // Manejo directo de actualización o edición de empresa
                    if (fc.name === 'wappy_actualizar_empresa' || fc.name === 'wappy_actualizar_perfil_empresa') {
                        const term = fc.args?.empresa || fc.args?.nombre_o_id || fc.args?.id || fc.args?.companyId;
                        logger.info(`[VoiceSession] Gemini Live invoked tool "${fc.name}" with args:`, JSON.stringify(fc.args));
                        try {
                            let targetUserId = this.userId;
                            try {
                                const User = mongoose.models.User || require('~/models/User');
                                const userDoc = await User.findById(this.userId).select('isSubUser parentUser').lean();
                                if (userDoc?.isSubUser && userDoc?.parentUser) {
                                    targetUserId = userDoc.parentUser.toString();
                                }
                            } catch (uErr) { }

                            let company = null;
                            if (term) {
                                company = await findCompanyByTermForUser(targetUserId, term);
                            }
                            if (!company) {
                                company = await CompanyInfo.findOne({ user: targetUserId, isActive: true });
                            }
                            if (!company) {
                                company = await CompanyInfo.findOne({ user: targetUserId });
                            }

                            if (!company) {
                                if (this.geminiClient) {
                                    this.geminiClient.sendToolResponse([{
                                        id: fc.id,
                                        name: fc.name,
                                        response: { error: 'No se encontró ninguna empresa para actualizar en tu cuenta.' }
                                    }]);
                                }
                                continue;
                            }

                            const updateFields = [
                                'companyName', 'companyType', 'nit', 'legalRepresentative', 'legalRepresentativeId',
                                'workerCount', 'arl', 'economicActivity', 'riskLevel', 'ciiu', 'address',
                                'city', 'departamento', 'phone', 'email', 'generalActivities', 'sector',
                                'responsibleSST', 'responsibleSSTPhone', 'formationLevel', 'licenseNumber',
                                'courseStatus', 'licenseExpiry', 'sedes'
                            ];

                            const modifiedList = [];
                            for (const f of updateFields) {
                                if (fc.args[f] !== undefined && fc.args[f] !== null) {
                                    company[f] = fc.args[f];
                                    modifiedList.push(`${f}: ${fc.args[f]}`);
                                }
                            }

                            await company.save();
                            if (company.isActive) {
                                await syncCompanyMemory(targetUserId, company);
                            }

                            this.sendToClient({
                                type: 'wappy_action',
                                data: {
                                    id: fc.id,
                                    name: fc.name,
                                    args: fc.args,
                                    result: {
                                        success: true,
                                        mensaje: `Empresa "${company.companyName}" actualizada con éxito.`,
                                        empresa: company,
                                        companyData: company
                                    }
                                }
                            });

                            if (this.geminiClient) {
                                this.geminiClient.sendToolResponse([{
                                    id: fc.id,
                                    name: fc.name,
                                    response: {
                                        result: `Datos de la empresa "${company.companyName}" actualizados exitosamente en el sistema (${modifiedList.join(', ') || 'sin cambios'}).`
                                    }
                                }]);
                            }
                        } catch (actErr) {
                            logger.error('[VoiceSession] Error in wappy_actualizar_empresa:', actErr);
                            if (this.geminiClient) {
                                this.geminiClient.sendToolResponse([{
                                    id: fc.id,
                                    name: fc.name,
                                    response: { error: `Error actualizando empresa: ${actErr.message}` }
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

                    // Manejo de Memoria Procedural y de Hábitos de Empresa (OpenBot)
                    if (fc.name === 'wappy_memoria_procedimental') {
                        try {
                            const companyInfo = await getActiveCompanyForUser(this.userId);
                            const activeCompId = companyInfo?._id ? String(companyInfo._id) : null;
                            const memRes = await manageProceduralMemory(
                                fc.args || {},
                                this.userId,
                                activeCompId,
                                companyInfo?.companyName || '',
                            );
                            if (memRes.widget) {
                                try {
                                    const tenshiConvoId = await this.resolveTenshiConversationId(activeCompId);
                                    await TenshiMessage.create({
                                        user: this.userId,
                                        companyId: activeCompId,
                                        conversationId: tenshiConvoId || null,
                                        role: 'assistant',
                                        content: `🧠 **Memoria Procedural de Hábitos Operativos**\n${memRes.mensaje || 'Hábitos actualizados.'}`,
                                        source: 'voice',
                                        widget: memRes.widget,
                                    });
                                } catch (saveErr) {
                                    logger.warn('[VoiceSession] Failed saving procedural memory widget message:', saveErr.message);
                                }
                            }
                            this.sendToClient({
                                type: 'wappy_action',
                                data: { id: fc.id, name: fc.name, args: fc.args, result: memRes, widget: memRes.widget }
                            });
                            if (this.geminiClient) {
                                this.sendGeminiToolResponse([{
                                    id: fc.id,
                                    name: fc.name,
                                    response: { result: JSON.stringify({ exito: memRes.exito, mensaje: memRes.mensaje }) }
                                }]);
                            }
                        } catch (procErr) {
                            logger.error('[VoiceSession] Error in wappy_memoria_procedimental:', procErr);
                            if (this.geminiClient) {
                                this.sendGeminiToolResponse([{
                                    id: fc.id,
                                    name: fc.name,
                                    response: { error: `Error en memoria procedimental: ${procErr.message}` }
                                }]);
                            }
                        }
                        continue;
                    }

                    // Manejo de Widgets Interactivos Generative UI (OpenBot AG-UI)
                    if (fc.name === 'wappy_renderizar_widget_interactivo') {
                        try {
                            const widget = buildGenerativeWidgetForTool(fc.name, fc.args || {}, null);
                            if (widget) {
                                try {
                                    const activeCompId = await resolveActiveCompanyId(this.userId);
                                    const tenshiConvoId = await this.resolveTenshiConversationId(activeCompId);
                                    await TenshiMessage.create({
                                        user: this.userId,
                                        companyId: activeCompId,
                                        conversationId: tenshiConvoId || null,
                                        role: 'assistant',
                                        content: `✨ **${widget.title || 'Widget Interactivo'}**\n_${widget.subtitle || 'Interactúa directamente en la tarjeta inferior.'}_`,
                                        source: 'voice',
                                        widget,
                                    });
                                } catch (saveErr) {
                                    logger.warn('[VoiceSession] Failed saving interactive widget message:', saveErr.message);
                                }
                            }
                            this.sendToClient({
                                type: 'wappy_action',
                                data: { id: fc.id, name: fc.name, args: fc.args, result: { exito: true }, widget }
                            });
                            if (this.geminiClient) {
                                this.sendGeminiToolResponse([{
                                    id: fc.id,
                                    name: fc.name,
                                    response: { result: `Widget interactivo "${widget?.title || fc.args?.tipo_widget}" desplegado en el chat del usuario. Invita al usuario a interactuar con él en pantalla.` }
                                }]);
                            }
                        } catch (widErr) {
                            logger.error('[VoiceSession] Error in wappy_renderizar_widget_interactivo:', widErr);
                            if (this.geminiClient) {
                                this.sendGeminiToolResponse([{
                                    id: fc.id,
                                    name: fc.name,
                                    response: { error: `Error renderizando widget: ${widErr.message}` }
                                }]);
                            }
                        }
                        continue;
                    }

                    // Manejo directo de Creación y Entrega de Informes en el chat de Tenshi
                    if (fc.name === 'wappy_crear_informe' || fc.name === 'wappy_generar_informe') {
                        const userRequestText = (this.userTranscriptionText || '').trim() || this.lastUserRequest || fc.args?.titulo || '';
                        const reqLower = `${userRequestText} ${this.lastUserTranscription || ''} ${fc.args?.titulo || ''} ${fc.args?.modulo || ''}`.toLowerCase();

                        // DESAMBIGUACIÓN DETERMINISTA: Solo redirigir al editor nativo de un aplicativo /sgsst
                        // cuando realmente corresponde (nunca por "módulo"/"pantalla" ni cuando piden Canvas/HTML/Word/Excel/interactivo o están en Modo Hero).
                        const isAppReport = shouldRedirectReportToSgsstApp(
                            reqLower,
                            fc.args,
                            this.activeScreenRoute,
                            this.isHeroMode
                        );

                        if (isAppReport) {
                            logger.info(`[VoiceSession] wappy_crear_informe redirected to wappy_generar_analisis_aplicativo for app report ("${userRequestText}", route="${this.activeScreenRoute}", isHeroMode=${this.isHeroMode})`);
                            let app = fc.args?.modulo || fc.args?.aplicativo || 'responsable';
                            if (/pol[ií]tica/i.test(reqLower)) app = 'politica';
                            else if (/objetivo/i.test(reqLower)) app = 'objetivos';
                            else if (/legal/i.test(reqLower)) app = 'legal';
                            else if (/rit|reglamento/i.test(reqLower)) app = 'rit';
                            else if (/cargo/i.test(reqLower)) app = 'perfil_cargo';
                            else if (/diagn[oó]stico|0312/i.test(reqLower)) app = 'diagnostico';
                            else if (/emergencia|vulnerab/i.test(reqLower)) app = 'vulnerabilidad';

                            this.sendToClient({
                                type: 'wappy_action',
                                data: {
                                    id: fc.id,
                                    name: 'wappy_generar_analisis_aplicativo',
                                    args: { aplicativo: app, instruccion_adicional: userRequestText }
                                }
                            });
                            if (this.geminiClient) {
                                this.sendGeminiToolResponse([{
                                    id: fc.id,
                                    name: fc.name,
                                    response: { result: `Generación de Análisis IA ejecutada exitosamente dentro del aplicativo "${app}". Confirma al usuario en una sola frase breve y entusiasta: "¡Listo! Ya activé la generación del informe con Inteligencia Artificial directamente en el editor del aplicativo en tu pantalla."` }
                                }]);
                            }
                            continue;
                        }

                        logger.info(`[VoiceSession] Gemini Live invoked tool "${fc.name}" with args:`, JSON.stringify(fc.args));
                        this.sendToClient({
                            type: 'status',
                            data: { status: 'loading', message: `Generando ${fc.args?.titulo || 'informe técnico'}...` }
                        });
                        try {
                            const repRes = await executeTenshiMcpTool('wappy_crear_informe', fc.args || {}, this.userId);
                            const repInfo = repRes?.informe || {};
                            const title = repInfo.titulo || fc.args?.titulo || 'Informe Técnico SG-SST';
                            const rawFileType = String(repInfo.formato || fc.args?.formato || 'html').toLowerCase();
                            const fileType = ['text', 'excel', 'html', 'presentation'].includes(rawFileType) ? rawFileType : 'html';
                            const content = repInfo.contenido || fc.args?.contenido || 'Informe técnico oficial generado.';

                            // Entregar archivo en el chat de Tenshi con botones de descarga
                            const canvasRes = await this.executeCanvasTool({
                                accion: 'crear',
                                fileType,
                                title,
                                content
                            }, userRequestText || title, fc.id);

                            if (canvasRes?.ok) {
                                const finalTitle = canvasRes.finalTitle || title;
                                const finalContent = canvasRes.generatedContent || content;
                                this.sendToClient({
                                    type: 'wappy_action',
                                    data: {
                                        id: fc.id,
                                        name: 'wappy_crear_informe',
                                        args: {
                                            ...(fc.args || {}),
                                            titulo: finalTitle,
                                            formato: fileType,
                                        },
                                        title: finalTitle,
                                        fileType,
                                        content: finalContent,
                                        canvasId: canvasRes.canvasId,
                                        result: {
                                            ...(repRes || {}),
                                            informe: {
                                                ...(repInfo || {}),
                                                titulo: finalTitle,
                                                formato: fileType,
                                                contenido: finalContent,
                                            }
                                        }
                                    }
                                });

                                if (this.geminiClient) {
                                    this.sendGeminiToolResponse([{
                                        id: fc.id,
                                        name: fc.name,
                                        response: {
                                            result: `[INSTRUCCIÓN ESTRICTA EN ESPAÑOL]: Informe "${finalTitle}" generado exitosamente y entregado en el chat de Tenshi con botones para descargar en ${fileType.toUpperCase()} y visor interactivo. Dile al usuario ÚNICAMENTE en español en una sola frase cordial que ya se lo entregaste en su chat para descargarlo o visualizarlo, y resúmele sus conclusiones principales. ESTÁ TERMINANTEMENTE PROHIBIDO RESPONDER EN INGLÉS.`
                                        }
                                    }]);
                                }
                            } else {
                                const failMsg = canvasRes?.failReason || 'No se pudo compilar ni adjuntar el informe en el chat.';
                                logger.warn(`[VoiceSession] wappy_crear_informe failed in executeCanvasTool: ${failMsg}`);
                                if (this.geminiClient) {
                                    this.sendGeminiToolResponse([{
                                        id: fc.id,
                                        name: fc.name,
                                        response: {
                                            error: `[INSTRUCCIÓN ESTRICTA EN ESPAÑOL]: Dile al usuario honestamente en español que no se pudo generar ni entregar el informe "${title}": ${failMsg}. NO afirmes que ya se entregó.`
                                        }
                                    }]);
                                }
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

                    // Generación automática de análisis/informe en el editor nativo del aplicativo SG-SST
                    if (fc.name === 'wappy_generar_analisis_aplicativo') {
                        const app = fc.args?.aplicativo || 'responsable';
                        const userTurnCtx = `${this.userTranscriptionText || ''} ${this.lastUserTranscription || ''} ${fc.args?.instruccion_adicional || ''}`.toLowerCase();
                        const asksToSendOrReadExisting = /\b(env[ií]a(me|lo|r)?|m[aá]nda(me|lo|r)?|correo|gmail|[uú]ltimo\s+informe|historial|l[eé]e(me|lo)?|qu[eé]\s+dice|consulta(r)?|busca(r)?|mu[eé]stra(me)?|ver\s+el\s+informe)\b/i.test(userTurnCtx) &&
                            !/\b(genera\s+uno\s+nuevo|crea\s+uno\s+nuevo|haz\s+uno\s+nuevo|nuevo\s+informe|volver\s+a\s+generar|regenera)\b/i.test(userTurnCtx);

                        if (asksToSendOrReadExisting) {
                            logger.warn(`[VoiceSession] Interceptando "wappy_generar_analisis_aplicativo" -> "wappy_leer_informe_aplicativo" para "${app}" porque el usuario pidió consultar/enviar un informe existente ("${userTurnCtx.trim()}").`);
                            try {
                                const reportRes = await executeTenshiMcpTool('wappy_leer_informe_aplicativo', { aplicativo: app }, this.userId);
                                let rawHtml = '';
                                if (reportRes && typeof reportRes === 'object') {
                                    rawHtml = reportRes.informeOriginalHtml || reportRes.informeCompleto || '';
                                    if (rawHtml && (rawHtml.includes('<html') || rawHtml.includes('<div') || rawHtml.includes('<table'))) {
                                        this.lastGeneratedReportHtml = rawHtml;
                                        this.lastGeneratedCanvasFile = {
                                            title: reportRes.titulo || `Informe Oficial de ${reportRes.aplicativo || app}`,
                                            fileType: 'html',
                                            content: rawHtml,
                                        };
                                        this.sendToClient({
                                            type: 'canvas_file_generated',
                                            data: this.lastGeneratedCanvasFile
                                        });
                                    }
                                }

                                // Si el usuario pidió enviarlo por correo y dio un correo o dijo "mi correo", enviarlo de inmediato
                                const wantsEmail = /\b(env[ií]a(me|lo|r)?|m[aá]nda(me|lo|r)?|correo|gmail)\b/i.test(userTurnCtx);
                                const emailMatch = userTurnCtx.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
                                const mentionsMyEmail = /\b(mi\s+correo|a\s+mi\s+mail)\b/i.test(userTurnCtx);

                                if (wantsEmail && (emailMatch || mentionsMyEmail)) {
                                    const destEmail = emailMatch ? emailMatch[0] : 'mi correo';
                                    const mailRes = await executeTenshiMcpTool('wappy_enviar_correo', {
                                        destinatario: destEmail,
                                        asunto: reportRes?.titulo || `Informe Oficial: ${reportRes?.aplicativo || app}`,
                                        mensaje: `Adjunto encontrará el último informe oficial de ${reportRes?.aplicativo || app} extraído del Historial de SOMOS SST.`,
                                        aplicativo: app,
                                        titulo: reportRes?.titulo || `Informe de ${app}`,
                                        reportHtml: rawHtml || undefined,
                                    }, this.userId);

                                    this.sendGeminiToolResponse([{
                                        id: fc.id,
                                        name: fc.name,
                                        response: {
                                            result: `Se consultó el último informe del Historial de "${reportRes?.aplicativo || app}" ("${reportRes?.titulo || app}") sin crear uno nuevo y se envió por correo exitosamente: ${mailRes?.mensaje || 'Enviado'}. Confírmale al usuario que le enviaste el último informe existente en su Historial.`
                                        }
                                    }]);
                                    continue;
                                }

                                const safeRes = { ...(reportRes || {}) };
                                delete safeRes.informeOriginalHtml;
                                const safeStr = JSON.stringify(safeRes).slice(0, 5500);
                                this.sendGeminiToolResponse([{
                                    id: fc.id,
                                    name: fc.name,
                                    response: {
                                        result: `Se extrajo el último informe existente del Historial de SOMOS SST para "${app}" (NO se creó un informe nuevo). Si el usuario pidió enviarlo por correo, invoca ahora 'wappy_enviar_correo' o pregúntale a qué correo desea enviarlo si no lo indicó. Resumen del informe: ${safeStr}`
                                    }
                                }]);
                            } catch (readErr) {
                                logger.error('[VoiceSession] Error intercepting wappy_generar_analisis_aplicativo to read existing report:', readErr);
                                this.sendGeminiToolResponse([{
                                    id: fc.id,
                                    name: fc.name,
                                    response: { error: `No se pudo leer el informe del historial: ${readErr.message}` }
                                }]);
                            }
                            continue;
                        }

                        logger.info(`[VoiceSession] Gemini Live invoked "wappy_generar_analisis_aplicativo" for: ${app}`);
                        this.sendToClient({
                            type: 'wappy_action',
                            data: {
                                id: fc.id,
                                name: 'wappy_generar_analisis_aplicativo',
                                args: fc.args || {}
                            }
                        });
                        if (this.geminiClient) {
                            this.sendGeminiToolResponse([{
                                id: fc.id,
                                name: fc.name,
                                response: {
                                    result: `Generación de Análisis IA ejecutada exitosamente dentro del aplicativo "${app}". Confirma al usuario en una sola frase breve y entusiasta que ya estás generando el análisis directamente en el editor del aplicativo.`
                                }
                            }]);
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
                            const mailArgs = { ...(fc.args || {}) };
                            if (!mailArgs.reportHtml && this.lastGeneratedReportHtml) {
                                mailArgs.reportHtml = this.lastGeneratedReportHtml;
                            }
                            if (!mailArgs.reportHtml && this.lastGeneratedCanvasFile?.content) {
                                mailArgs.reportHtml = this.lastGeneratedCanvasFile.content;
                            }
                            if (!mailArgs.titulo && this.lastGeneratedCanvasFile?.title) {
                                mailArgs.titulo = this.lastGeneratedCanvasFile.title;
                            }
                            const mailRes = await executeTenshiMcpTool('wappy_enviar_correo', mailArgs, this.userId);
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
                                let agendaOutput = '';
                                if (agendaRes?.eventos) {
                                    if (agendaRes.eventos.length === 0) {
                                        agendaOutput = 'No hay ningún evento ni compromiso agendado en el sistema para este periodo.';
                                    } else {
                                        agendaOutput = `Se encontraron ${agendaRes.eventos.length} compromiso(s) agendado(s):\n` +
                                            agendaRes.eventos.map(e => `- ${e.titulo} (${e.fecha ? new Date(e.fecha).toLocaleString('es-CO') : 'Sin fecha'}): ${e.descripcion || 'Sin descripción'}`).join('\n');
                                    }
                                } else {
                                    agendaOutput = agendaRes?.mensaje || JSON.stringify(agendaRes);
                                }

                                this.sendGeminiToolResponse([{
                                    id: fc.id,
                                    name: fc.name,
                                    response: {
                                        result: agendaOutput
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
                                    const activeCompId = await resolveActiveCompanyId(this.userId);
                                    const tenshiConvoId = await this.resolveTenshiConversationId(activeCompId);
                                    await TenshiMessage.create({
                                        user: this.userId,
                                        companyId: activeCompId,
                                        conversationId: tenshiConvoId || null,
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
                        const rawAct = String(fc.args?.accion || '').toLowerCase().trim().replace(/\s+/g, '_');
                        const isTenshiFlowAction = ['ejecutar_tenshi', 'tenshi', 'flujo_tenshi', 'run_tenshi'].includes(rawAct);
                        const isAsyncFlowExecution = [
                            'ejecutar_tenshi',
                            'tenshi',
                            'flujo_tenshi',
                            'run_tenshi',
                            'ejecutar_ahora',
                            'ejecutar',
                            'correr',
                            'run',
                            'run_now',
                            'disparar',
                        ].includes(rawAct);

                        if (isAsyncFlowExecution) {
                            const runId = 'tflow_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
                            toolReq.__tenshiFlowRunId = runId;
                            toolReq.__tenshiFlowStartedEmitted = true;
                            toolReq.__tenshiFlowVoiceManaged = true;
                            const flowToolReq = {
                                ...toolReq,
                                __tenshiFlowRunId: runId,
                                __tenshiFlowStartedEmitted: true,
                                __tenshiFlowVoiceManaged: true,
                            };

                            const stripLeadingEmoji = (val) =>
                                String(val || '')
                                    .replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}\uFE0F\u200D\s]+/u, '')
                                    .trim();

                            const rawAutoId = String(fc.args?.automatizacion_id || '').trim();
                            const fallbackAutoLabel =
                                fc.args?.nombre ||
                                (rawAutoId && !/^[0-9a-fA-F]{24}$/.test(rawAutoId) ? rawAutoId : '') ||
                                'Flujo Tenshi';
                            let flowLabel = String(fallbackAutoLabel || 'Flujo Tenshi').trim();

                            if (isTenshiFlowAction) {
                                try {
                                    const quickQuery = String(
                                        fc.args?.automatizacion_id || fc.args?.nombre || fc.args?.instruccion_usuario || '',
                                    ).trim();
                                    if (quickQuery) {
                                        const { matchTenshiFlowByQuery } = require('~/server/services/tenshiFlowService');
                                        if (typeof matchTenshiFlowByQuery === 'function') {
                                            const quickMatch = await Promise.race([
                                                matchTenshiFlowByQuery(quickQuery),
                                                new Promise((resolve) => setTimeout(() => resolve(null), 350)),
                                            ]);
                                            if (quickMatch?.flow?.name) {
                                                flowLabel = String(quickMatch.flow.name).trim();
                                            }
                                        }
                                    }
                                } catch (quickMatchErr) {
                                    logger.warn('[VoiceSession] Quick matchTenshiFlowByQuery fallback:', quickMatchErr?.message || quickMatchErr);
                                }
                            }

                            flowLabel = stripLeadingEmoji(flowLabel) || 'Flujo Tenshi';
                            const indicaciones = String(
                                fc.args?.instruccion_usuario || fc.args?.nombre || fc.args?.automatizacion_id || 'según tu solicitud',
                            )
                                .trim()
                                .slice(0, 260);

                            this.sendToClient({
                                type: 'status',
                                data: { status: 'loading', message: '⚡ Iniciando: ' + flowLabel },
                            });

                            try {
                                const mcpBridge = require('~/server/routes/mcpBridge');
                                if (typeof mcpBridge?.broadcastAntigravityEvent === 'function') {
                                    mcpBridge.broadcastAntigravityEvent(this.userId, 'tenshi_flow_started', {
                                        runId,
                                        flowName: flowLabel,
                                        indicaciones,
                                        action: rawAct,
                                        channel: 'voice',
                                        startedAt: new Date().toISOString(),
                                    });
                                }
                            } catch (sseStartErr) {
                                logger.warn('[VoiceSession] No se pudo emitir SSE tenshi_flow_started:', sseStartErr?.message || sseStartErr);
                            }

                            if (this.geminiClient) {
                                this.geminiClient.sendToolResponse([{
                                    id: fc.id,
                                    name: fc.name,
                                    response: {
                                        status: 'iniciado_en_curso',
                                        flujo: flowLabel,
                                        indicaciones,
                                        result: `Tarea "${flowLabel}" iniciada en este instante con las indicaciones: "${indicaciones}". INSTRUCCIÓN CRÍTICA DE VOZ: Responde YA en 1 sola frase corta, cálida y natural confirmándole al usuario que ya vas a realizar esta tarea con esas indicaciones exactas y que en unos segundos le entregas el resultado apenas termine. PROHIBIDO inventar, adivinar o adelantar el resultado todavía; cuando finalice recibirás la señal automática del sistema con el resultado real.`,
                                    },
                                }]);
                            }

                            const toolRespondedAt = Date.now();
                            const fcId = fc.id;
                            const fcName = fc.name;
                            const flowArgs = fc.args ? { ...fc.args } : {};

                            (async () => {
                                const waitBeforeVoiceInjection = async () => {
                                    const elapsedSinceAck = Date.now() - toolRespondedAt;
                                    if (elapsedSinceAck < 850 && this.geminiClient && this.isActive && !this.isStopped) {
                                        await new Promise((resolve) => setTimeout(resolve, 850 - elapsedSinceAck));
                                    }
                                    let waitedMs = 0;
                                    while (
                                        this.isAiSpeaking &&
                                        waitedMs < 4000 &&
                                        this.geminiClient &&
                                        this.isActive &&
                                        !this.isStopped
                                    ) {
                                        await new Promise((resolve) => setTimeout(resolve, 250));
                                        waitedMs += 250;
                                    }
                                };

                                try {
                                    const GestorAutomatizaciones = require('~/app/clients/tools/structured/GestorAutomatizaciones');
                                    const toolInstance = new GestorAutomatizaciones({ req: flowToolReq });
                                    const toolOutput = await toolInstance._call(flowArgs);

                                    let parsed = null;
                                    if (typeof toolOutput === 'string') {
                                        try {
                                            parsed = JSON.parse(toolOutput);
                                        } catch (_parseErr) {
                                            parsed = null;
                                        }
                                    } else if (toolOutput && typeof toolOutput === 'object') {
                                        parsed = toolOutput;
                                    }

                                    const resolvedFlowName =
                                        stripLeadingEmoji(parsed?.flujo || parsed?.nombre || flowLabel) || flowLabel;
                                    const evidencias = Array.isArray(parsed?.evidencias)
                                        ? parsed.evidencias
                                        : Array.isArray(parsed?.evidenceFiles)
                                            ? parsed.evidenceFiles
                                            : [];
                                    const rawResultText = String(
                                        parsed?.resultado ||
                                        parsed?.mensaje ||
                                        parsed?.advertencia ||
                                        parsed?.error ||
                                        (typeof toolOutput === 'string' ? toolOutput : ''),
                                    )
                                        .replace(/\n{3,}/g, '\n\n')
                                        .trim();
                                    const resultText =
                                        rawResultText.length > 3200
                                            ? `${rawResultText.slice(0, 3200)}...`
                                            : rawResultText;

                                    this.sendToClient({
                                        type: 'wappy_action',
                                        data: { id: fcId, name: fcName, args: flowArgs, result: toolOutput },
                                    });

                                    try {
                                        const mcpBridge = require('~/server/routes/mcpBridge');
                                        if (typeof mcpBridge?.broadcastAntigravityEvent === 'function') {
                                            mcpBridge.broadcastAntigravityEvent(this.userId, 'tenshi_flow_completed', {
                                                runId,
                                                flowName: resolvedFlowName,
                                                indicaciones,
                                                success: !parsed?.error,
                                                hasEvidences: Array.isArray(evidencias) && evidencias.length > 0,
                                                channel: 'voice',
                                                completedAt: new Date().toISOString(),
                                            });
                                        }
                                    } catch (sseEndErr) {
                                        logger.warn('[VoiceSession] No se pudo emitir SSE tenshi_flow_completed:', sseEndErr?.message || sseEndErr);
                                    }

                                    await waitBeforeVoiceInjection();

                                    if (this.geminiClient && this.isActive && !this.isStopped) {
                                        const evCount = Array.isArray(evidencias) ? evidencias.length : 0;
                                        const evNote =
                                            evCount === 1
                                                ? '\nCERTIFICADOS ADJUNTOS: Se emitió y entregó 1 certificado oficial en PDF/PNG directamente en el chat de Tenshi. Confírmale explícitamente al usuario que el certificado oficial ya quedó adjunto en su chat listo para abrir o descargar (NO leas rutas /api/... en voz alta).'
                                                : evCount > 1
                                                    ? `\nCERTIFICADOS ADJUNTOS: Se emitieron y entregaron ${evCount} certificados oficiales en PDF/PNG directamente en el chat de Tenshi. Confírmale explícitamente al usuario que los ${evCount} certificados oficiales ya quedaron adjuntos en su chat listos para abrir o descargar (NO leas rutas /api/... en voz alta).`
                                                    : '';
                                        const finalVoiceInjection = parsed?.error
                                            ? `[SISTEMA INTERNO WAPPY - RESULTADO DE FLUJO COMPLETADO]: La tarea "${resolvedFlowName}" finalizó con novedad o error: ${resultText || String(parsed.error)}.\nINSTRUCCIÓN CRÍTICA DE VOZ (ESPAÑOL): Infórmale brevemente y con claridad en español natural lo ocurrido al usuario sin inventar datos ni hablar en inglés.`
                                            : `[SISTEMA INTERNO WAPPY - RESULTADO DE FLUJO COMPLETADO]: La tarea "${resolvedFlowName}" (indicaciones: "${indicaciones}") acaba de finalizar con el siguiente resultado real:\n${resultText || 'Ejecución completada correctamente.'}${evNote}\nINSTRUCCIÓN CRÍTICA DE VOZ (ESPAÑOL): Narra AHORA al usuario en español natural, claro y ejecutivo el resultado real obtenido (estados, fechas, hallazgos clave y cualquier dato importante), sin leer URLs técnicas ni hablar en inglés.`;
                                        this.geminiClient.sendText(finalVoiceInjection);
                                    }
                                } catch (bgErr) {
                                    logger.error('[VoiceSession] Error executing gestor_automatizaciones in background:', bgErr);
                                    try {
                                        const mcpBridge = require('~/server/routes/mcpBridge');
                                        if (typeof mcpBridge?.broadcastAntigravityEvent === 'function') {
                                            mcpBridge.broadcastAntigravityEvent(this.userId, 'tenshi_flow_completed', {
                                                runId,
                                                flowName: flowLabel,
                                                indicaciones,
                                                success: false,
                                                hasEvidences: false,
                                                error: bgErr?.message || 'Error ejecutando el flujo',
                                                channel: 'voice',
                                                completedAt: new Date().toISOString(),
                                            });
                                        }
                                    } catch (_sseErr) {}

                                    await waitBeforeVoiceInjection();

                                    if (this.geminiClient && this.isActive && !this.isStopped) {
                                        this.geminiClient.sendText(
                                            `[SISTEMA INTERNO WAPPY - ERROR EN FLUJO]: La tarea "${flowLabel}" no pudo completarse por un error técnico: ${String(bgErr?.message || 'Error inesperado').slice(0, 400)}.\nINSTRUCCIÓN CRÍTICA DE VOZ (ESPAÑOL): Avísale brevemente y con amabilidad al usuario en español que ocurrió ese inconveniente y pregúntale si desea reintentar.`,
                                        );
                                    }
                                }
                            })();

                            continue;
                        }

                        this.sendToClient({
                            type: 'status',
                            data: {
                                status: 'loading',
                                message: fc.args?.accion === 'consultar_documentacion_nodos' ||
                                  ['documentacion_nodos', 'manual_nodos', 'guia_nodos', 'nodos', 'explicar_nodo', 'catalogo_nodos'].includes(rawAct)
                                    ? '📘 Consultando enciclopedia de nodos...'
                                    : 'Gestionando automatizaciones...'
                            }
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

                    // Búsqueda Instantánea de Historial (< 5ms, estilo BM25 en MongoDB)
                    // DEBE ejecutarse ANTES del bloque genérico `fc.name.startsWith('wappy_')` para no delegarse a tenshiMcpDispatcher
                    if (fc.name === 'wappy_buscar_historial_instantaneo') {
                        logger.info(`[VoiceSession] Gemini Live invoked "wappy_buscar_historial_instantaneo" with args:`, JSON.stringify(fc.args));
                        try {
                            const activeCompId = await resolveActiveCompanyId(this.userId);
                            const histRes = await searchInstantHistory(fc.args || {}, this.userId, activeCompId);
                            this.sendToClient({
                                type: 'status',
                                data: { status: 'idle', message: '' },
                            });
                            if (this.geminiClient) {
                                this.sendGeminiToolResponse([{
                                    id: fc.id,
                                    name: fc.name,
                                    response: { result: JSON.stringify(histRes) }
                                }]);
                            }
                        } catch (histErr) {
                            logger.error('[VoiceSession] Error in wappy_buscar_historial_instantaneo:', histErr);
                            this.sendToClient({
                                type: 'status',
                                data: { status: 'idle', message: '' },
                            });
                            if (this.geminiClient) {
                                this.sendGeminiToolResponse([{
                                    id: fc.id,
                                    name: fc.name,
                                    response: { error: histErr.message }
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
                            ![
                                'wappy_navegar',
                                'wappy_seleccionar_empresa',
                                'wappy_diligenciar_formulario',
                                'wappy_abrir_chat_agente',
                                'wappy_iniciar_estudio_ergonomico_vivo',
                                'wappy_buscar_historial_instantaneo',
                            ].includes(fc.name));

                    if (isMcpCall) {
                        const targetTool = fc.name === 'wappy_mcp_sst' ? (fc.args?.herramienta || fc.args?.tool) : fc.name;
                        const targetArgs = { ...(fc.name === 'wappy_mcp_sst' ? (fc.args?.parametros || fc.args?.args || fc.args || {}) : (fc.args || {})) };

                        if (
                            TOOL_ROUTES[targetTool]?.isNotebookLM &&
                            !targetArgs.notebook &&
                            !targetArgs.cuaderno &&
                            Array.isArray(this.selectedTenshiNotebooks) &&
                            this.selectedTenshiNotebooks.length > 0
                        ) {
                            const firstNbRef = extractNotebookRef(this.selectedTenshiNotebooks[0]);
                            if (firstNbRef?.id) {
                                targetArgs.notebook = firstNbRef.id;
                            }
                        }

                        if (targetTool === 'wappy_buscar_historial_instantaneo') {
                            logger.info(`[VoiceSession] Redirecting wappy_mcp_sst -> "wappy_buscar_historial_instantaneo" with args:`, JSON.stringify(targetArgs));
                            try {
                                const activeCompId = await resolveActiveCompanyId(this.userId);
                                const histRes = await searchInstantHistory(targetArgs || {}, this.userId, activeCompId);
                                this.sendToClient({ type: 'status', data: { status: 'idle', message: '' } });
                                if (this.geminiClient) {
                                    this.sendGeminiToolResponse([{
                                        id: fc.id,
                                        name: fc.name,
                                        response: { result: JSON.stringify(histRes) },
                                    }]);
                                }
                            } catch (histErr) {
                                logger.error('[VoiceSession] Error in redirected wappy_buscar_historial_instantaneo:', histErr);
                                this.sendToClient({ type: 'status', data: { status: 'idle', message: '' } });
                                if (this.geminiClient) {
                                    this.sendGeminiToolResponse([{
                                        id: fc.id,
                                        name: fc.name,
                                        response: { error: histErr.message },
                                    }]);
                                }
                            }
                            continue;
                        }

                        logger.info(`[VoiceSession] Gemini Live invoked WAPPY MCP tool "${targetTool}" with args:`, JSON.stringify(targetArgs));

                        // REGLA DE PROTECCIÓN: Solo redirigir si el usuario pidió generar el análisis IA nativo de un aplicativo interno de WAPPY
                        // NOTA IMPORTANTE: En modo voz en español, Google ASR (`inputAudioTranscription`) suele transcribir fonéticamente
                        // la palabra inglesa "Antigravity" como frases en español ("un talento que habita", "a ti gravity", "anti gravedad"),
                        // mientras que el modelo nativo de audio de Gemini Live sí escucha "Antigravity" y llama a `wappy_delegar_orden_antigravity`.
                        // Por tanto, JAMÁS redirigir `wappy_delegar_orden_antigravity` hacia `executeCanvasTool`.
                        if (targetTool === 'wappy_delegar_orden_antigravity' || targetTool === 'delegar_orden_antigravity') {
                            const rawUserContext = `${this.userTranscriptionText || ''} ${this.lastUserTranscription || ''}`.trim();
                            const fullUserContext = `${rawUserContext} ${targetArgs?.instruccion || ''} ${targetArgs?.titulo || ''}`.toLowerCase();
                            const explicitlyMentionsAntigravity =
                                !rawUserContext ||
                                /\b(antigrav\w*|anti[\s-]*grav\w*)\b/i.test(fullUserContext);
                            if (!explicitlyMentionsAntigravity) {
                                const isAppReport = shouldRedirectReportToSgsstApp(
                                    rawUserContext.toLowerCase(),
                                    targetArgs,
                                    this.activeScreenRoute,
                                    this.isHeroMode
                                );
                                if (isAppReport) {
                                    logger.warn(`[VoiceSession] Gemini Live intentó delegar orden de aplicativo a Antigravity ("${rawUserContext}"). Redirigiendo a wappy_generar_analisis_aplicativo.`);
                                    let app = 'responsable';
                                    if (/pol[ií]tica/i.test(rawUserContext)) app = 'politica';
                                    else if (/objetivo/i.test(rawUserContext)) app = 'objetivos';
                                    else if (/legal/i.test(rawUserContext)) app = 'legal';
                                    else if (/rit|reglamento/i.test(rawUserContext)) app = 'rit';
                                    else if (/cargo/i.test(rawUserContext)) app = 'perfil_cargo';
                                    else if (/diagn[oó]stico|0312/i.test(rawUserContext)) app = 'diagnostico';
                                    else if (/emergencia|vulnerab/i.test(rawUserContext)) app = 'vulnerabilidad';

                                    this.sendToClient({
                                        type: 'wappy_action',
                                        data: {
                                            id: fc.id,
                                            name: 'wappy_generar_analisis_aplicativo',
                                            args: { aplicativo: app, instruccion_adicional: targetArgs.instruccion || '' }
                                        }
                                    });
                                    if (this.geminiClient) {
                                        this.sendGeminiToolResponse([{
                                            id: fc.id,
                                            name: fc.name,
                                            response: { result: `Generación de Análisis IA ejecutada exitosamente dentro del aplicativo "${app}". Confirma al usuario en una sola frase breve y entusiasta: "¡Listo! Ya activé la generación del informe con Inteligencia Artificial directamente en el editor del aplicativo en tu pantalla."` }
                                        }]);
                                    }
                                    continue;
                                }
                            }

                            targetArgs.sourceModule = targetArgs.sourceModule || 'tenshi_voice';
                            targetArgs.remitente = targetArgs.remitente || 'Tenshi Voz en Vivo';
                            if (this.activeTenshiConversationId && !targetArgs.tenshiConversationId) {
                                targetArgs.tenshiConversationId = this.activeTenshiConversationId;
                            }
                            if (Array.isArray(this.selectedTenshiNotebooks) && this.selectedTenshiNotebooks.length > 0 && !targetArgs.selectedNotebooks) {
                                targetArgs.selectedNotebooks = [...this.selectedTenshiNotebooks];
                            }
                            const camMedia = this.persistLiveCameraMediaForAntigravity();
                            if (camMedia && Array.isArray(camMedia.mediaUrls) && camMedia.mediaUrls.length > 0) {
                                const existingArchivos = Array.isArray(targetArgs.archivos) ? targetArgs.archivos : [];
                                targetArgs.archivos = Array.from(new Set([...existingArchivos, ...camMedia.mediaUrls]));
                                targetArgs.instruccion = `${targetArgs.instruccion || ''}\n[CÁMARA EN VIVO DE TENSHI ACTIVA — Evidencia visual adjunta en tiempo real (${camMedia.mediaUrls.length} archivos de foto/video): ${camMedia.mediaUrls.join(', ')}${camMedia.telemetry ? ` | Telemetría en vivo: ${camMedia.telemetry}` : ''}]`.trim();
                                logger.info(`[VoiceSession] Attached ${camMedia.mediaUrls.length} live camera media file(s) (photos + video clip) to Antigravity order: ${camMedia.mediaUrls.join(', ')}`);
                            }
                        }

                        this.sendToClient({
                            type: 'status',
                            data: { status: 'loading', message: `Consultando ${targetTool.replace(/_/g, ' ')}...` }
                        });

                        try {
                            // Gobernanza Human-in-the-Loop (HITL) — Acciones críticas requieren autorización humana en tarjeta interactiva
                            if (isGovernedTool(targetTool, targetArgs)) {
                                const companyInfo = await getActiveCompanyForUser(this.userId);
                                const activeCompId = companyInfo?._id ? String(companyInfo._id) : null;
                                const staged = await stageGovernedAction(targetTool, targetArgs, this.userId, activeCompId);
                                if (staged.widget) {
                                    try {
                                        const tenshiConvoId = await this.resolveTenshiConversationId(activeCompId);
                                        await TenshiMessage.create({
                                            user: this.userId,
                                            companyId: activeCompId,
                                            conversationId: tenshiConvoId || null,
                                            role: 'assistant',
                                            content: `🛡️ **Control de Gobernanza SG-SST (Aprobación Requerida)**\nHe preparado la solicitud **${staged.widget.title}**: _${staged.widget.subtitle}_.\nPor seguridad, autoriza la operación haciendo clic en **"Autorizar y Ejecutar"** en la tarjeta inferior.`,
                                            source: 'voice',
                                            widget: staged.widget,
                                        });
                                    } catch (saveErr) {
                                        logger.warn('[VoiceSession] Failed saving HITL widget message:', saveErr.message);
                                    }
                                }
                                this.sendToClient({
                                    type: 'wappy_action',
                                    data: { id: fc.id, name: targetTool, args: targetArgs, result: staged, widget: staged.widget }
                                });
                                if (this.geminiClient) {
                                    this.sendGeminiToolResponse([{
                                        id: fc.id,
                                        name: fc.name,
                                        response: { result: staged.instruccion_ia || staged.mensaje }
                                    }]);
                                }
                                continue;
                            }

                            const result = await executeTenshiMcpTool(targetTool, targetArgs, this.userId);

                            // Honestidad para alias wappy_notebooklm_* / wappy_consultar_cuaderno* cuando caduca la sesión de NotebookLM
                            if (result && typeof result === 'object' && result.authExpired) {
                                logger.warn(`[VoiceSession] 🔐 NotebookLM alias "${targetTool}" auth expired: ${result.error || 'sesión expirada'}`);
                                const authExpiredMsg =
                                    result.mensaje ||
                                    'Tu sesión de Google NotebookLM caducó. Reconecta tu cuenta en 1 clic desde la píldora "Cuadernos" o en Mi Cuenta → Integraciones → Google NotebookLM.';
                                this.sendToClient({ type: 'status', data: { status: 'idle', message: '' } });
                                this.sendToClient({
                                    type: 'notebooklm_auth_expired',
                                    data: {
                                        toolName: targetTool,
                                        authExpired: true,
                                        isValid: false,
                                        reason: result.error || 'Sesión de Google NotebookLM caducada',
                                        message: authExpiredMsg,
                                    },
                                });
                                if (this.geminiClient) {
                                    this.sendGeminiToolResponse([{
                                        id: fc.id,
                                        name: fc.name,
                                        response: {
                                            ok: false,
                                            authExpired: true,
                                            mensaje: `${authExpiredMsg} [INSTRUCCIÓN CRÍTICA DE HONESTIDAD EN ESPAÑOL]: NO digas que consultaste el cuaderno ni que entregaste un artefacto. Indica claramente en español que la sesión de Google NotebookLM caducó y debe reconectarse en 1 clic desde la píldora "Cuadernos".`,
                                        },
                                    }]);
                                }
                                continue;
                            }

                            let rawHtml = '';
                            if (result && typeof result === 'object') {
                                if (result.informeOriginalHtml || (result.informeCompleto && (result.informeCompleto.includes('<html') || result.informeCompleto.includes('<div') || result.informeCompleto.includes('<table')))) {
                                    rawHtml = result.informeOriginalHtml || result.informeCompleto;
                                    this.lastGeneratedReportHtml = rawHtml;
                                    this.lastGeneratedCanvasFile = {
                                        title: result.titulo || `Informe Oficial de ${result.aplicativo || 'SGSST'}`,
                                        fileType: 'html',
                                        content: rawHtml,
                                    };
                                    this.sendToClient({
                                        type: 'canvas_file_generated',
                                        data: this.lastGeneratedCanvasFile
                                    });
                                }
                            }

                            // Construir Widget Generative UI si aplica (ej. Resumen 360° o Censo de Trabajadores)
                            // PROTECCIÓN ESTRICTA: Para 'wappy_consultar_trabajadores', SOLO mostrar el widget de lista de trabajadores
                            // si el usuario lo solicitó explícitamente en su transcripción (nunca durante el saludo inicial o ruido de micrófono).
                            const userTurnTextForWidget = `${this.userTranscriptionText || ''} ${this.lastUserTranscription || ''}`.trim();
                            const userExplicitlyAskedForWorkers =
                                targetTool !== 'wappy_consultar_trabajadores' ||
                                /\b(trabajador\w*|colaborador\w*|emplead\w*|n[oó]mina|censo|personal|plantilla|sociodemogr[aá]f\w*|cu[aá]ntos|qui[eé]nes|lista)\b/i.test(userTurnTextForWidget);

                            const autoWidget = userExplicitlyAskedForWorkers
                                ? buildGenerativeWidgetForTool(targetTool, targetArgs, result)
                                : null;
                            if (autoWidget) {
                                try {
                                    const activeCompId = await resolveActiveCompanyId(this.userId);
                                    const tenshiConvoId = await this.resolveTenshiConversationId(activeCompId);
                                    await TenshiMessage.create({
                                        user: this.userId,
                                        companyId: activeCompId,
                                        conversationId: tenshiConvoId || null,
                                        role: 'assistant',
                                        content: `📊 **${autoWidget.title}** — _${autoWidget.subtitle || 'Vista interactiva en tiempo real'}_`,
                                        source: 'voice',
                                        widget: autoWidget,
                                    });
                                } catch (saveWidErr) {
                                    logger.warn('[VoiceSession] Failed saving autoWidget message:', saveWidErr.message);
                                }
                            }

                            // Persistir tarjeta resumen en el chat de Tenshi cuando se crea o actualiza un Agente IA
                            if (
                                (targetTool === 'wappy_crear_agente' || targetTool === 'wappy_actualizar_agente') &&
                                result?.exito &&
                                result?.agente
                            ) {
                                try {
                                    const ag = result.agente;
                                    const actionLabel = targetTool === 'wappy_crear_agente' ? 'Agente IA Creado Exitosamente' : 'Agente IA Actualizado Exitosamente';
                                    const startersText = Array.isArray(ag.conversation_starters) && ag.conversation_starters.length > 0
                                        ? ag.conversation_starters.map((s) => `  - "${s}"`).join('\n')
                                        : '  - _(Sin frases iniciadoras configuradas)_';
                                    const summaryMd =
                                        `🤖 **${actionLabel}: ${ag.name}** (\`${ag.id}\`)\n\n` +
                                        `- **1. Nombre:** ${ag.name}\n` +
                                        `- **2. Descripción:** ${ag.description || 'Especialista WAPPY IA'}\n` +
                                        `- **3. Categoría:** \`${ag.category || 'general'}\`\n` +
                                        `- **4. Instrucciones (System Prompt):** ${String(ag.instructions || '').slice(0, 280)}${String(ag.instructions || '').length > 280 ? '...' : ''}\n` +
                                        `- **5. Modelo:** \`${ag.model || 'gemini-3.5-flash-lite'}\` (${ag.provider || 'google'})\n` +
                                        `- **6. Herramientas Activas:** **${ag.totalHerramientas || 0}** herramientas (${ag.tieneNotebookLM ? 'incluye Google Suite, WAPPY SST y 35 de NotebookLM' : (ag.tools || []).slice(0, 8).join(', ')})\n` +
                                        `- **7. Skills Cargadas:** ${Array.isArray(ag.skills) && ag.skills.length > 0 ? `${ag.skills.length} skills activas` : 'Estándar'}\n` +
                                        `- **8. Frases Iniciadoras:**\n${startersText}\n` +
                                        `- **9. Subagentes Encadenados:** ${Array.isArray(ag.agent_ids) && ag.agent_ids.length > 0 ? ag.agent_ids.join(', ') : 'Ninguno'}`;
                                    const activeCompId = await resolveActiveCompanyId(this.userId);
                                    const tenshiConvoId = await this.resolveTenshiConversationId(activeCompId);
                                    await TenshiMessage.create({
                                        user: this.userId,
                                        companyId: activeCompId,
                                        conversationId: tenshiConvoId || null,
                                        role: 'assistant',
                                        content: summaryMd,
                                        source: 'voice',
                                    });
                                } catch (saveAgErr) {
                                    logger.warn('[VoiceSession] Failed saving agent creation summary message:', saveAgErr.message);
                                }
                            }

                            this.sendToClient({
                                type: 'wappy_action',
                                data: { id: fc.id, name: targetTool, args: targetArgs, result, widget: autoWidget || undefined }
                            });

                            // Si la herramienta fue wappy_leer_informe_aplicativo y el usuario en este turno pidió enviarlo por correo con dirección o "mi correo", despachar el correo de inmediato
                            let autoEmailSummary = '';
                            if (targetTool === 'wappy_leer_informe_aplicativo') {
                                const userTurnCtx = `${this.userTranscriptionText || ''} ${this.lastUserTranscription || ''}`.toLowerCase();
                                const wantsEmail = /\b(env[ií]a(me|lo|r)?|m[aá]nda(me|lo|r)?|correo|gmail)\b/i.test(userTurnCtx);
                                const emailMatch = userTurnCtx.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
                                const mentionsMyEmail = /\b(mi\s+correo|a\s+mi\s+mail)\b/i.test(userTurnCtx);

                                if (wantsEmail && (emailMatch || mentionsMyEmail)) {
                                    const destEmail = emailMatch ? emailMatch[0] : 'mi correo';
                                    try {
                                        const mailRes = await executeTenshiMcpTool('wappy_enviar_correo', {
                                            destinatario: destEmail,
                                            asunto: result?.titulo || `Informe Oficial: ${result?.aplicativo || targetArgs?.aplicativo || 'SG-SST'}`,
                                            mensaje: `Adjunto encontrará el último informe oficial de ${result?.aplicativo || targetArgs?.aplicativo || 'SG-SST'} extraído del Historial de SOMOS SST.`,
                                            aplicativo: targetArgs?.aplicativo || result?.aplicativo,
                                            titulo: result?.titulo,
                                            reportHtml: rawHtml || undefined,
                                        }, this.userId);
                                        autoEmailSummary = `\n[ENVÍO AUTOMÁTICO DE CORREO COMPLETADO]: ${mailRes?.mensaje || `Informe enviado con éxito a ${destEmail}`}. Confirma verbalmente al usuario que ya le enviaste el informe a su correo.`;
                                    } catch (autoMailErr) {
                                        logger.warn('[VoiceSession] Auto-email after wappy_leer_informe_aplicativo failed:', autoMailErr.message);
                                    }
                                }
                            }

                            // Sanitizar payload para Gemini Live (evitar Code 1007 por exceso de HTML crudo)
                            let safePayload = result;
                            if (result && typeof result === 'object' && !Array.isArray(result)) {
                                safePayload = { ...result };
                                delete safePayload.informeOriginalHtml;
                                if (typeof safePayload.informeCompleto === 'string' && safePayload.informeCompleto.length > 3500) {
                                    safePayload.informeCompleto = safePayload.informeCompleto
                                        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
                                        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
                                        .replace(/<[^>]+>/g, ' ')
                                        .replace(/\s+/g, ' ')
                                        .trim()
                                        .slice(0, 3500);
                                }
                            }
                            let resultStr = typeof safePayload === 'string' ? safePayload : JSON.stringify(safePayload);
                            if (resultStr.length > 5500) {
                                resultStr = resultStr.slice(0, 5500) + '... [Resumen truncado para voz]';
                            }
                            if (autoEmailSummary) {
                                resultStr += autoEmailSummary;
                            }

                            if (this.geminiClient) {
                                this.sendGeminiToolResponse([{
                                    id: fc.id,
                                    name: fc.name,
                                    response: { result: resultStr }
                                }]);
                            }
                        } catch (mcpErr) {
                            logger.error(`[VoiceSession] Error executing MCP tool "${targetTool}":`, mcpErr);
                            if (this.geminiClient) {
                                this.sendGeminiToolResponse([{
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
                        const detalle = fc.args?.detalle || fc.args?.campo || fc.args?.texto || 'elemento';
                        const texto = fc.args?.texto;
                        const isBlockedGenerateAiClick =
                            (this.isHeroMode || !String(this.activeScreenRoute || '').startsWith('/sgsst')) &&
                            String(accion).toLowerCase() === 'click' &&
                            /generar\s*(con\s*)?ia|generar\s*an[aá]lisis|bot[oó]n\s+de\s+generar/i.test(`${detalle} ${texto || ''}`);

                        if (isBlockedGenerateAiClick) {
                            logger.warn(`[VoiceSession] Bloqueado click ciego "${detalle}" vía operar_interfaz_visual fuera de /sgsst (isHeroMode=${this.isHeroMode}, route="${this.activeScreenRoute || '/c/new'}")`);
                            if (this.geminiClient) {
                                this.sendGeminiToolResponse([{
                                    id: fc.id,
                                    name: fc.name,
                                    response: {
                                        result: "No existe botón 'Generar IA' porque el usuario está en Modo Hero de Tenshi (no dentro de un formulario /sgsst). Invoca inmediatamente 'canvas_tool' para generar el informe o aplicativo HTML/Word/Excel en el Canvas y chat de Tenshi."
                                    }
                                }]);
                            }
                            continue;
                        }

                        logger.info(`[VoiceSession] Operación de interfaz visual: accion=${accion}, detalle=${detalle}${texto ? `, texto="${texto.substring(0, 40)}..."` : ''}`);
                        this.sendToClient({
                            type: 'wappy_action',
                            data: {
                                id: fc.id,
                                name: fc.name,
                                args: {
                                    ...fc.args,
                                    accion,
                                    detalle,
                                    texto,
                                    campo: fc.args?.campo || detalle,
                                    indice: fc.args?.indice
                                }
                            }
                        });
                        if (this.geminiClient) {
                            this.sendGeminiToolResponse([{
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
                        await this._executeSingleSpecialistToolCall(fc, toolReq);
                        continue;
                    }

                    // Mesa Técnica Multi-Agente en Paralelo (MODO 2B — 2 a 4 especialistas simultáneos)
                    if (fc.name === 'consultar_multiples_especialistas_paralelo') {
                        const rawConsultas = Array.isArray(fc.args?.consultas) ? fc.args.consultas : [];
                        const sintesisObjetivo = String(fc.args?.sintesis_objetivo || '').trim();

                        const normalizeSpecialistKey = (s) =>
                            String(s || '')
                                .toLowerCase()
                                .normalize('NFD')
                                .replace(/[\u0300-\u036f]/g, '')
                                .replace(/[^a-z0-9 ]/g, '')
                                .replace(/\s+/g, ' ')
                                .trim();

                        const seenConsultas = new Set();
                        const validRaw = [];
                        for (const item of rawConsultas) {
                            const rawAgent = String(item?.nombre_especialista || item?.agente || '').trim();
                            const rawQ = String(item?.consulta_completa || item?.pregunta || '').trim();
                            if (!rawAgent || rawQ.length < 4) continue;
                            const dedupeKey = `${normalizeSpecialistKey(rawAgent)}::${normalizeSpecialistKey(rawQ)}`;
                            if (seenConsultas.has(dedupeKey)) continue;
                            seenConsultas.add(dedupeKey);
                            validRaw.push({ rawAgent, rawQ });
                            if (validRaw.length >= 4) break;
                        }

                        if (validRaw.length === 0) {
                            logger.warn('[VoiceSession] Gemini invoked "consultar_multiples_especialistas_paralelo" without valid consultas.');
                            this.sendToClient({
                                type: 'status',
                                data: { status: 'idle', message: '' },
                            });
                            if (this.geminiClient) {
                                this.sendGeminiToolResponse([{
                                    id: fc.id,
                                    name: fc.name,
                                    response: {
                                        result: 'Faltan las consultas técnicas concretas y los especialistas válidos para la Mesa Técnica en paralelo. Pregúntale brevemente al usuario qué especialistas desea consultar y cuál es la duda técnica puntual.'
                                    }
                                }]);
                            }
                            continue;
                        }

                        const enriched = validRaw.map(({ rawAgent, rawQ }) => ({
                            nombre_especialista: rawAgent,
                            consulta_completa: enrichTechnicalPrompt(rawQ, rawAgent),
                        }));

                        logger.info(
                            `[VoiceSession] ⚡ Iniciando Mesa Técnica Multi-Agente en paralelo (${enriched.length} especialista${enriched.length === 1 ? '' : 's'}): ${enriched.map((c) => c.nombre_especialista).join(', ')}`
                        );

                        const specialistStates = enriched.map((c, idx) => ({
                            index: idx,
                            requestedName: c.nombre_especialista,
                            label: c.nombre_especialista,
                            icon: '⏳',
                        }));

                        const formatParallelPill = () =>
                            `⚡ Mesa Técnica: ${specialistStates.map((s) => `${s.icon} ${s.label}`).join(' · ')}`;

                        this.sendToClient({
                            type: 'status',
                            data: {
                                status: 'loading',
                                message: `⚡ Mesa Técnica en paralelo (${enriched.length} especialista${enriched.length === 1 ? '' : 's'})...`,
                                toolName: fc.name,
                            }
                        });

                        const onSpecialistUpdate = (update = {}) => {
                            try {
                                let target = null;
                                if (typeof update.index === 'number' && specialistStates[update.index]) {
                                    target = specialistStates[update.index];
                                } else {
                                    const reqKey = normalizeSpecialistKey(
                                        update.requestedName || update.nombre_especialista || update.agentName || update.name
                                    );
                                    if (reqKey) {
                                        target = specialistStates.find(
                                            (s) =>
                                                normalizeSpecialistKey(s.requestedName) === reqKey ||
                                                normalizeSpecialistKey(s.label) === reqKey
                                        );
                                    }
                                }
                                if (target) {
                                    if (update.agentName && String(update.agentName).trim()) {
                                        target.label = String(update.agentName).trim();
                                    }
                                    const st = String(update.status || update.state || '').toLowerCase();
                                    if (st === 'completed' || st === 'done' || st === 'success' || st === 'ok' || update.ok === true) {
                                        target.icon = '✅';
                                    } else if (st === 'error' || st === 'failed' || st === 'fail' || update.ok === false) {
                                        target.icon = '⚠️';
                                    } else {
                                        target.icon = '⏳';
                                    }
                                }
                                this.sendToClient({
                                    type: 'status',
                                    data: {
                                        status: 'loading',
                                        message: formatParallelPill(),
                                        toolName: fc.name,
                                    }
                                });
                            } catch (cbErr) {
                                logger.warn('[VoiceSession] Error actualizando status pill en onSpecialistUpdate:', cbErr.message);
                            }
                        };

                        try {
                            const ConsultarAgenteEspecializado = require('~/app/clients/tools/structured/ConsultarAgenteEspecializado');
                            const agentTool = new ConsultarAgenteEspecializado({ req: toolReq });
                            const parallelRes = await this._invokeParallelSpecialistsStructured(agentTool, enriched, {
                                maxParallel: 4,
                                onSpecialistUpdate,
                            });

                            const formattedMarkdown = String(parallelRes?.formattedMarkdown || '').trim();
                            const hasSuccess = Boolean(
                                parallelRes &&
                                parallelRes.ok &&
                                (parallelRes.succeededCount || 0) > 0 &&
                                formattedMarkdown.length > 0
                            );

                            if (hasSuccess) {
                                const activeCompId = await resolveActiveCompanyId(this.userId);
                                const tenshiConvoId = await this.resolveTenshiConversationId(activeCompId);
                                let savedDoc = null;
                                try {
                                    savedDoc = await TenshiMessage.create({
                                        user: this.userId,
                                        companyId: activeCompId,
                                        conversationId: tenshiConvoId || null,
                                        role: 'assistant',
                                        content: formattedMarkdown,
                                    });
                                } catch (saveParallelErr) {
                                    logger.error('[VoiceSession] Error persistiendo mesa técnica paralela en TenshiMessage:', saveParallelErr);
                                }

                                logger.info(
                                    `[VoiceSession] ✅ Mesa Técnica completada (${parallelRes.succeededCount}/${parallelRes.total} exitosos en ${parallelRes.totalDurationMs || 0}ms, messageId: ${savedDoc?._id || 'N/A'})`
                                );

                                this.sendToClient({
                                    type: 'wappy_action',
                                    data: {
                                        id: fc.id,
                                        name: 'wappy_mesa_tecnica_paralela',
                                        args: { consultas: enriched, sintesis_objetivo: sintesisObjetivo },
                                        result: {
                                            ok: parallelRes.ok,
                                            total: parallelRes.total,
                                            succeededCount: parallelRes.succeededCount,
                                            failedCount: parallelRes.failedCount,
                                            totalDurationMs: parallelRes.totalDurationMs,
                                            formattedMarkdown,
                                            messageId: savedDoc?._id ? String(savedDoc._id) : undefined,
                                            ...(tenshiConvoId ? { conversationId: tenshiConvoId, tenshiConversationId: tenshiConvoId } : {}),
                                            results: (parallelRes.results || []).map((r) => ({
                                                ok: r.ok,
                                                agentName: r.agentName,
                                                question: r.question,
                                                response: r.response,
                                                error: r.error,
                                                durationMs: r.durationMs,
                                            })),
                                        },
                                    },
                                });

                                this.sendToClient({
                                    type: 'status',
                                    data: {
                                        status: 'history_synced',
                                        hasFile: false,
                                        ...(tenshiConvoId ? { conversationId: tenshiConvoId, tenshiConversationId: tenshiConvoId } : {}),
                                    },
                                });
                                this.sendToClient({
                                    type: 'status',
                                    data: { status: 'idle', message: '' },
                                });

                                const safeConsolidated = formattedMarkdown.length > 9000
                                    ? `${formattedMarkdown.slice(0, 9000)}\n\n[...Dictamen consolidado completo guardado en el chat de Tenshi]`
                                    : formattedMarkdown;
                                const objetivoBlock = sintesisObjetivo
                                    ? `\n[OBJETIVO DE SÍNTESIS]: ${sintesisObjetivo}`
                                    : '';
                                const failedSpecialists = (parallelRes.results || [])
                                    .filter((r) => !r.ok)
                                    .map((r) => `${r.agentName || r.requestedName} (${r.error || 'sin respuesta'})`);
                                const partialWarning = failedSpecialists.length > 0
                                    ? `\n[NOTA DE TRANSPARENCIA]: No se obtuvo dictamen de: ${failedSpecialists.join('; ')}. Indícalo con honestidad sin inventar su concepto.`
                                    : '';

                                if (this.geminiClient) {
                                    this.sendGeminiToolResponse([{
                                        id: fc.id,
                                        name: fc.name,
                                        response: {
                                            result: `[MESA TÉCNICA MULTI-AGENTE COMPLETADA — ${parallelRes.succeededCount}/${parallelRes.total} ESPECIALISTAS]:\n${safeConsolidated}${objetivoBlock}${partialWarning}\n\n[INSTRUCCIÓN CRÍTICA EN ESPAÑOL]: Presenta verbalmente en español una síntesis ejecutiva clara mencionando los hallazgos clave de cada especialista consultado, sin sermones ni disclaimers. Confirma al usuario que el dictamen completo quedó guardado en el chat de Tenshi y que, si lo desea, puedes convertirlo en un informe formal en Canvas. ESTÁ PROHIBIDO responder en inglés.`
                                        }
                                    }]);
                                }
                            } else {
                                const errorSummary = (parallelRes?.results || [])
                                    .map((r) => `- ${r.agentName || r.requestedName || 'Especialista'}: ${r.error || r.response || 'sin respuesta'}`)
                                    .join('\n');
                                logger.warn(`[VoiceSession] ⚠️ Mesa Técnica paralela falló por completo:\n${errorSummary}`);

                                this.sendToClient({
                                    type: 'status',
                                    data: { status: 'idle', message: '' },
                                });

                                if (this.geminiClient) {
                                    this.sendGeminiToolResponse([{
                                        id: fc.id,
                                        name: fc.name,
                                        response: {
                                            result: `[FALLO EN MESA TÉCNICA MULTI-AGENTE]: No se logró obtener dictamen de los especialistas solicitados.\n${errorSummary || 'Error interno de conexión con los especialistas.'}\n\n[INSTRUCCIÓN CRÍTICA DE HONESTIDAD EN ESPAÑOL]: NO digas que ya consultaste a los especialistas ni que dejaste el dictamen en el chat. Informa con total honestidad el inconveniente exacto, ofrece reintentar con los nombres válidos si aplica o responde tú misma directamente con rigor técnico en SG-SST en español.`
                                        }
                                    }]);
                                }
                            }
                        } catch (parallelErr) {
                            logger.error('[VoiceSession] Error orquestando Mesa Técnica Multi-Agente:', parallelErr);
                            this.sendToClient({
                                type: 'status',
                                data: { status: 'idle', message: '' },
                            });
                            if (this.geminiClient) {
                                this.sendGeminiToolResponse([{
                                    id: fc.id,
                                    name: fc.name,
                                    response: {
                                        result: `[FALLO EN MESA TÉCNICA MULTI-AGENTE]: Error interno al coordinar los especialistas (${parallelErr.message}).\n\n[INSTRUCCIÓN CRÍTICA DE HONESTIDAD EN ESPAÑOL]: NO afirmes que ya se consultó a los especialistas. Informa brevemente el fallo técnico y responde tú misma directamente con tu base de conocimientos en SG-SST (Decreto 1072 de 2015 y normatividad vigente) en español.`
                                    }
                                }]);
                            }
                        }
                        continue;
                    }

                    // Iniciar Estudio de Puesto de Trabajo Ergonómico en Vivo con la Fisioterapeuta Laboral
                    if (fc.name === 'wappy_iniciar_estudio_ergonomico_vivo') {
                        logger.info(`[VoiceSession] Gemini Live invoked "wappy_iniciar_estudio_ergonomico_vivo" with args:`, JSON.stringify(fc.args));
                        await this.enableFisioterapeutaMode('herramienta_estudio_ergonomico');
                        this.sendToClient({
                            type: 'wappy_action',
                            data: {
                                id: fc.id,
                                name: 'wappy_iniciar_estudio_ergonomico_vivo',
                                args: fc.args || {}
                            }
                        });
                        if (this.geminiClient) {
                            this.sendGeminiToolResponse([{
                                id: fc.id,
                                name: fc.name,
                                response: {
                                    result: `Análisis en Vivo de Estudio de Puesto de Trabajo Ergonómico con la Fisioterapeuta Laboral abierto en pantalla. Confirma al usuario en 1 sola frase entusiasta que ya estás abriendo la cámara en vivo con la Fisioterapeuta Laboral y que al finalizar le dejarás el informe tanto en el chat principal como en tu chat de Tenshi.`
                                }
                            }]);
                        }
                        continue;
                    }

                    // Apertura explícita de chat en pantalla solo si el usuario pide ver la pestaña/chat
                    if (fc.name === 'wappy_abrir_chat_agente') {
                        const agente = fc.args?.agente || fc.args?.nombre_especialista;
                        const rawPregunta = (fc.args?.pregunta || fc.args?.consulta_completa || '').trim();

                        const isGenericPlaceholder = (text) => {
                            if (!text || text.length < 5) return true;
                            const norm = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
                            return /^(derecho laboral|medicina laboral|fisioterapia|ergonomia|salud ocupacional|asesoria|concepto profesional|hacer una consulta|una consulta|una pregunta|consulta general|seguridad vial|riesgo quimico|primeros auxilios|salud mental|riesgo psicosocial|tareas criticas|alturas|normatividad|normativa|decreto 1072|resolucion 0312)$/i.test(norm) ||
                                /^(hola|buenos dias|buenas tardes|buenas noches|como estas|quiere hacer una consulta|desea consultar algo|para hacer una consulta|solicito asesoria|consulta tecnica)\.?$/i.test(norm);
                        };

                        if (!rawPregunta || isGenericPlaceholder(rawPregunta)) {
                            logger.warn(`[VoiceSession] Gemini invoked "${fc.name}" for agent "${agente}" without concrete question ("${rawPregunta}"). Asking user for context.`);
                            if (this.geminiClient) {
                                this.sendGeminiToolResponse([{
                                    id: fc.id,
                                    name: fc.name,
                                    response: {
                                        result: `NO se abrió el chat: falta la consulta concreta del usuario. Pregúntale verbalmente al usuario: "¿Qué tema o duda específica deseas plantearle al especialista antes de conectarte?" y espera a que el usuario te formule su pregunta real antes de abrir el chat.`
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
                                args: {
                                    agente,
                                    pregunta,
                                    nuevo_chat: requestedNewChat,
                                    ...(this.activeTenshiConversationId ? { tenshiConversationId: this.activeTenshiConversationId } : {}),
                                    ...(Array.isArray(this.selectedTenshiNotebooks) && this.selectedTenshiNotebooks.length > 0
                                        ? { selectedNotebooks: [...this.selectedTenshiNotebooks] }
                                        : {}),
                                }
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
                } finally {
                    this.activeToolCount = Math.max(0, (this.activeToolCount || 1) - 1);
                }
            }
        });

        // Listen for turn complete
        this.geminiClient.on('turnComplete', () => {
            logger.info('[VoiceSession] ========== TURN COMPLETE ==========');
            this.clearAudioStreamEndWatchdog();
            const turnSpokeGoodbye =
                this.hangupFarewellAlreadySpoken ||
                (this.aiAudioChunkCount || 0) > 0 ||
                /\b(chao|chau|adi[oó]s|hasta\s+(luego|pronto|ma[ñn]ana|la\s+pr[oó]xima)|excelente\s+(d[ií]a|tarde|noche)|feliz\s+(d[ií]a|tarde|noche)|nos\s+vemos|gusto\s+ayudarte)\b/i.test(
                    this.aiTranscriptionBuffer || this.aiResponseText || ''
                );
            if (
                this.pendingHangupAfterTurn &&
                (turnSpokeGoodbye || (this.hangupToolSentAt && Date.now() - this.hangupToolSentAt > 450))
            ) {
                this.schedulePendingHangup(
                    this.hangupFarewellAlreadySpoken ? 550 : 750,
                    'turn_complete_drain'
                );
            }
            this.isAiSpeaking = false;
            this.aiGenerationComplete = false;
            this.bargeInSuppressAiAudioUntil = 0;
            this.turnHadAiOutput = false;
            this.suppressClientAudioUntil = null;
            if (this.aiSpeakingTimeout) {
                clearTimeout(this.aiSpeakingTimeout);
                this.aiSpeakingTimeout = null;
            }
            this.sendToClient({ type: 'status', data: { status: 'turn_complete' } });
            if (!this.pendingHangupAfterTurn) {
                this.sendToClient({ type: 'status', data: { status: 'listening' } });
            }
            // Guardar el turno en segundo plano para máxima respuesta y cero latencia
            this.saveCurrentTurn('TurnComplete').catch(err => {
                logger.error('[VoiceSession] Error in background saveCurrentTurn:', err);
            });
            logger.info('[VoiceSession] ========== END TURN ==========');
        });

        // Listen for Interrupted (User Barge-In)
        this.geminiClient.on('interrupted', () => {
            this.clearAudioStreamEndWatchdog();
            this.aiGenerationComplete = false;
            if (this.activeToolCount > 0) {
                logger.info(`[VoiceSession] ========== USER INTERRUPTED (while ${this.activeToolCount} tool(s) running — preserving active user turn) ==========`);
                this.isAiSpeaking = false;
                if (this.aiSpeakingTimeout) {
                    clearTimeout(this.aiSpeakingTimeout);
                    this.aiSpeakingTimeout = null;
                }
                return;
            }
            logger.info('[VoiceSession] ========== USER INTERRUPTED RESPONSE ==========');
            this.isAiSpeaking = false;
            this.bargeInSuppressAiAudioUntil = 0;
            this.suppressClientAudioUntil = null;
            if (this.aiSpeakingTimeout) {
                clearTimeout(this.aiSpeakingTimeout);
                this.aiSpeakingTimeout = null;
            }
            this.sendToClient({ type: 'status', data: { status: 'interrupted' } });
            this.sendToClient({ type: 'interrupted', data: {} });
        });

        this.receivedGoAway = false;
        this.geminiClient.on('goAway', () => {
            this.receivedGoAway = true;
        });

        // Handle Gemini connection close/error to avoid zombie state
        this.geminiClient.on('close', async (code, reason) => {
            const reasonStr = reason ? reason.toString() : '';
            logger.warn(`[VoiceSession] Gemini connection closed: Code ${code}, Reason: ${reasonStr}`);
            if (code === 1011) {
                markVoiceKeyCooldown(this.lastUsedLiveKey, reasonStr || '1011');
            }
            if (this.isActive) {
                // Si la desconexión fue inesperada (1011, 1008/GoAway, 1007, 1006, etc.) y el cliente sigue conectado, reintentar con el siguiente modelo/clave
                const shouldReconnect =
                    this.receivedGoAway ||
                    code === 1011 || code === 1008 || code === 1007 || code === 1006 || code === 1001 || !code;
                if (shouldReconnect && this.clientWs && this.clientWs.readyState === WebSocket.OPEN) {
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

        // Limpiar cliente previo y timers activos
        this.activeToolCount = 0;
        this.isAiSpeaking = false;
        this.aiGenerationComplete = false;
        this.clearAudioStreamEndWatchdog();
        if (this.aiSpeakingTimeout) {
            clearTimeout(this.aiSpeakingTimeout);
            this.aiSpeakingTimeout = null;
        }
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

        // Probar claves API disponibles priorizando claves sin cooldown 1011
        const voiceKeys = orderVoiceKeysByCooldown(this.apiKeys || []);
        let connected = false;
        let modelDisableCompression = Boolean(this.config?.disableContextCompression);

        for (let i = 0; i < voiceKeys.length; i++) {
            const key = voiceKeys[i];
            this.lastUsedLiveKey = key;
            try {
                logger.info(`[VoiceSession] Intento de reconexión con Modelo "${this.liveConfig.model}" y Clave ${i + 1}/${voiceKeys.length}`);
                this.geminiClient = new GeminiLiveClient(key, {
                    ...this.liveConfig,
                    disableContextCompression: modelDisableCompression,
                });
                await this.geminiClient.connect();
                this.liveConfig.disableContextCompression = modelDisableCompression;
                connected = true;
                break;
            } catch (err) {
                const is1007BeforeSetup =
                    err?.code === 1007 || /Code:\s*1007\b/i.test(String(err?.message || ''));
                if (this.geminiClient) {
                    try { this.geminiClient.disconnect(); } catch {}
                    this.geminiClient = null;
                }
                if (is1007BeforeSetup && !modelDisableCompression) {
                    logger.warn(
                        `[VoiceSession] Reconexión con Modelo "${this.liveConfig.model}" falló antes de setupComplete con Code 1007; reintentando con disableContextCompression=true...`
                    );
                    modelDisableCompression = true;
                    try {
                        this.geminiClient = new GeminiLiveClient(key, {
                            ...this.liveConfig,
                            disableContextCompression: true,
                        });
                        await this.geminiClient.connect();
                        this.liveConfig.disableContextCompression = true;
                        connected = true;
                        break;
                    } catch (retryErr) {
                        logger.warn(`[VoiceSession] Reintento sin contextWindowCompression falló con Clave ${i + 1}: ${retryErr.message}`);
                        markVoiceKeyCooldown(key, retryErr.message);
                        if (this.geminiClient) {
                            try { this.geminiClient.disconnect(); } catch {}
                            this.geminiClient = null;
                        }
                        continue;
                    }
                }
                logger.warn(`[VoiceSession] Falló reconexión con Clave ${i + 1}: ${err.message}`);
                markVoiceKeyCooldown(key, err.message);
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
     * Invoca un especialista retornando el contrato estructurado oficial, con fallback defensivo a _call().
     */
    async _invokeSingleSpecialistStructured(agentTool, { nombre_especialista, consulta_completa }) {
        const startedAt = Date.now();
        if (typeof agentTool.callSingleSpecialistStructured === 'function') {
            const structured = await agentTool.callSingleSpecialistStructured({
                nombre_especialista,
                consulta_completa,
            });
            const rawResp = String(structured?.response || '').trim();
            const failedByPrefix = !rawResp || rawResp.startsWith('❌');
            const isOk = Boolean(structured?.ok) && !failedByPrefix;
            return {
                ok: isOk,
                requestedName: structured?.requestedName || nombre_especialista,
                agentName: structured?.agentName || nombre_especialista,
                agentId: structured?.agentId || null,
                question: structured?.question || consulta_completa,
                response: rawResp,
                error: isOk ? undefined : (structured?.error || rawResp || 'Error interno consultando al especialista'),
                durationMs: typeof structured?.durationMs === 'number' ? structured.durationMs : (Date.now() - startedAt),
            };
        }

        // Fallback defensivo si la instancia solo expone _call()
        const rawText = String(
            (await agentTool._call({ nombre_especialista, consulta_completa })) || ''
        ).trim();
        const durationMs = Date.now() - startedAt;
        const isErr = !rawText || rawText.startsWith('❌');
        if (isErr) {
            return {
                ok: false,
                requestedName: nombre_especialista,
                agentName: nombre_especialista,
                agentId: null,
                question: consulta_completa,
                response: rawText,
                error: rawText || 'El especialista devolvió una respuesta vacía.',
                durationMs,
            };
        }
        const headerMatch = rawText.match(/^✅\s*\[Respuesta de Especialista ([^\]]+)\]:\s*/i);
        const resolvedName = headerMatch?.[1]?.trim() || nombre_especialista;
        const cleanBody = headerMatch ? rawText.slice(headerMatch[0].length).trim() : rawText;
        return {
            ok: Boolean(cleanBody) && !cleanBody.startsWith('❌'),
            requestedName: nombre_especialista,
            agentName: resolvedName,
            agentId: null,
            question: consulta_completa,
            response: cleanBody,
            error: !cleanBody || cleanBody.startsWith('❌') ? (cleanBody || 'Respuesta vacía del especialista.') : undefined,
            durationMs,
        };
    }

    /**
     * Invoca múltiples especialistas en paralelo con el contrato oficial y fallback defensivo via Promise.allSettled.
     */
    async _invokeParallelSpecialistsStructured(agentTool, consultas, { maxParallel = 4, onSpecialistUpdate } = {}) {
        const capped = Array.isArray(consultas) ? consultas.slice(0, maxParallel) : [];
        if (typeof agentTool.executeParallelSpecialists === 'function') {
            return await agentTool.executeParallelSpecialists(capped, { maxParallel, onSpecialistUpdate });
        }

        // Fallback defensivo si executeParallelSpecialists aún no existe en ConsultarAgenteEspecializado
        const batchStart = Date.now();
        const settled = await Promise.allSettled(
            capped.map(async (item, index) => {
                try {
                    onSpecialistUpdate?.({
                        index,
                        status: 'running',
                        requestedName: item.nombre_especialista,
                    });
                } catch (_) {}
                const single = await this._invokeSingleSpecialistStructured(agentTool, item);
                try {
                    onSpecialistUpdate?.({
                        index,
                        status: single.ok ? 'completed' : 'error',
                        ok: single.ok,
                        requestedName: single.requestedName,
                        agentName: single.agentName,
                        durationMs: single.durationMs,
                    });
                } catch (_) {}
                return single;
            })
        );

        const results = settled.map((outcome, idx) => {
            if (outcome.status === 'fulfilled') return outcome.value;
            const reqName = capped[idx]?.nombre_especialista || `Especialista ${idx + 1}`;
            const errMsg = outcome.reason?.message || 'Error inesperado consultando al especialista';
            return {
                ok: false,
                requestedName: reqName,
                agentName: reqName,
                agentId: null,
                question: capped[idx]?.consulta_completa || '',
                response: `❌ ${errMsg}`,
                error: errMsg,
                durationMs: Date.now() - batchStart,
            };
        });

        const succeededCount = results.filter((r) => r.ok).length;
        const failedCount = results.length - succeededCount;
        const totalDurationMs = Date.now() - batchStart;
        const sections = results.map((r) => {
            if (r.ok) {
                return `### 🩺 ${r.agentName}\n\n${r.response}`;
            }
            return `### ⚠️ ${r.agentName || r.requestedName}\n\n_No fue posible obtener dictamen: ${r.error || r.response || 'sin respuesta'}._`;
        });
        const formattedMarkdown =
            `⚡ **Mesa Técnica Multi-Agente en Paralelo** (${succeededCount}/${results.length} especialistas · ${(totalDurationMs / 1000).toFixed(1)}s)\n\n` +
            sections.join('\n\n---\n\n');

        return {
            ok: succeededCount > 0,
            total: results.length,
            succeededCount,
            failedCount,
            totalDurationMs,
            results,
            formattedMarkdown,
        };
    }

    /**
     * Ejecuta una consulta individual a consultar_agente_especializado con manejo estricto de errores,
     * persistencia en MongoDB (TenshiMessage), emisión de wappy_dictamen_especialista y sincronización history_synced.
     */
    async _executeSingleSpecialistToolCall(fc, toolReq, options = {}) {
        const {
            suppressLoadingPill = false,
            suppressHistorySynced = false,
            suppressIdle = false,
            deferToolResponse = false,
            activeCompIdOverride = undefined,
            maxVoiceChars = 6500,
            onProgress = null,
        } = options;

        const agente = fc.args?.nombre_especialista || fc.args?.agente || 'Especialista SG-SST';
        const rawPregunta = (fc.args?.consulta_completa || fc.args?.pregunta || '').trim();

        if (!rawPregunta || rawPregunta.length < 4) {
            logger.warn(`[VoiceSession] Gemini invoked "consultar_agente_especializado" for "${agente}" without concrete question.`);
            if (onProgress) onProgress('error', agente);
            if (!suppressIdle) {
                this.sendToClient({
                    type: 'status',
                    data: { status: 'idle', message: '' },
                });
            }
            const missingToolResponse = {
                id: fc.id,
                name: fc.name,
                response: {
                    result: `Falta la consulta técnica concreta para ${agente}. Pregúntale al usuario qué tema o duda puntual desea plantear antes de consultar.`
                }
            };
            if (!deferToolResponse && this.geminiClient) {
                this.sendGeminiToolResponse([missingToolResponse]);
            }
            return { ok: false, toolResponse: missingToolResponse };
        }

        const pregunta = enrichTechnicalPrompt(rawPregunta, agente);
        logger.info(`[VoiceSession] Orquestando internamente consulta a ${agente}: "${pregunta.substring(0, 60)}..."`);

        if (!suppressLoadingPill) {
            this.sendToClient({
                type: 'status',
                data: {
                    status: 'loading',
                    message: `🩺 Consultando internamente con ${agente}...`,
                    toolName: fc.name,
                }
            });
        }

        try {
            const ConsultarAgenteEspecializado = require('~/app/clients/tools/structured/ConsultarAgenteEspecializado');
            const agentTool = new ConsultarAgenteEspecializado({ req: toolReq });
            const res = await this._invokeSingleSpecialistStructured(agentTool, {
                nombre_especialista: agente,
                consulta_completa: pregunta,
            });

            const cleanResponseText = String(res?.response || '').trim();
            const isFailed = !res || !res.ok || !cleanResponseText || cleanResponseText.startsWith('❌');
            const finalAgentName = res?.agentName || agente;

            if (isFailed) {
                const failureReason = String(res?.error || cleanResponseText || 'Error interno consultando al especialista').trim();
                logger.warn(`[VoiceSession] ⚠️ Fallo en consulta a ${finalAgentName}: ${failureReason.substring(0, 180)}`);
                if (onProgress) onProgress('error', finalAgentName);
                if (!suppressIdle) {
                    this.sendToClient({
                        type: 'status',
                        data: { status: 'idle', message: '' },
                    });
                }

                // NO emitir wappy_dictamen_especialista ni persistir error como dictamen en TenshiMessage
                const failToolResponse = {
                    id: fc.id,
                    name: fc.name,
                    response: {
                        result: `[FALLO AL CONSULTAR ESPECIALISTA ${finalAgentName}]: ${failureReason}\n\n[INSTRUCCIÓN CRÍTICA DE HONESTIDAD EN ESPAÑOL]: NO se pudo obtener el dictamen de ${finalAgentName}. ESTÁ PROHIBIDO decir que ya lo consultaste o que dejaste su dictamen en el chat. Informa con honestidad el fallo ocurrido y, si aplica, ofrece reintentar con el especialista correcto o responde tú misma directamente con rigor técnico en SG-SST (Decreto 1072 de 2015 / normatividad vigente) en español.`
                    }
                };
                if (!deferToolResponse && this.geminiClient) {
                    this.sendGeminiToolResponse([failToolResponse]);
                }
                return { ok: false, res, toolResponse: failToolResponse };
            }

            logger.info(`[VoiceSession] ✅ Dictamen recibido de ${finalAgentName} (longitud: ${cleanResponseText.length}, duración: ${res.durationMs || 0}ms)`);
            if (onProgress) onProgress('completed', finalAgentName);

            // Persistir el dictamen completo en MongoDB (TenshiMessage)
            const formattedMsg = `🩺 **Dictamen Técnico Especializado — ${finalAgentName}**:\n\n${cleanResponseText}`;
            const activeCompId = activeCompIdOverride !== undefined
                ? activeCompIdOverride
                : (await resolveActiveCompanyId(this.userId));
            const tenshiConvoId = await this.resolveTenshiConversationId(activeCompId);

            let savedDoc = null;
            try {
                savedDoc = await TenshiMessage.create({
                    user: this.userId,
                    companyId: activeCompId,
                    conversationId: tenshiConvoId || null,
                    role: 'assistant',
                    content: formattedMsg,
                });
            } catch (saveSpecErr) {
                logger.error(`[VoiceSession] Error persistiendo dictamen de ${finalAgentName} en TenshiMessage:`, saveSpecErr);
            }

            const savedMessageId = savedDoc?._id ? String(savedDoc._id) : undefined;

            // Entregar la respuesta técnica instantáneamente en Hero Chat / chat de Tenshi
            this.sendToClient({
                type: 'wappy_action',
                data: {
                    id: fc.id,
                    name: 'wappy_dictamen_especialista',
                    args: {
                        agente: finalAgentName,
                        pregunta,
                        respuesta: cleanResponseText,
                        messageId: savedMessageId,
                        durationMs: res.durationMs,
                        ...(tenshiConvoId ? { conversationId: tenshiConvoId, tenshiConversationId: tenshiConvoId } : {}),
                    },
                    result: {
                        ok: true,
                        agente: finalAgentName,
                        pregunta,
                        respuesta: cleanResponseText,
                        messageId: savedMessageId,
                        durationMs: res.durationMs,
                        ...(tenshiConvoId ? { conversationId: tenshiConvoId, tenshiConversationId: tenshiConvoId } : {}),
                    },
                },
            });

            if (!suppressHistorySynced) {
                this.sendToClient({
                    type: 'status',
                    data: {
                        status: 'history_synced',
                        hasFile: false,
                        ...(tenshiConvoId ? { conversationId: tenshiConvoId, tenshiConversationId: tenshiConvoId } : {}),
                    },
                });
            }
            if (!suppressIdle) {
                this.sendToClient({
                    type: 'status',
                    data: { status: 'idle', message: '' },
                });
            }

            const responseForVoice = cleanResponseText.length > maxVoiceChars
                ? `${cleanResponseText.slice(0, maxVoiceChars)}\n\n[...Dictamen completo visible y guardado en el chat de Tenshi]`
                : cleanResponseText;

            const successToolResponse = {
                id: fc.id,
                name: fc.name,
                response: {
                    result: `[DICTAMEN TÉCNICO DE ${finalAgentName}]:\n${responseForVoice}\n\n[INSTRUCCIÓN CRÍTICA EN ESPAÑOL]: Explica verbalmente en español de forma clara y fiel las conclusiones clave que dictaminó ${finalAgentName}, sin añadir sermones paternalistas ni disclaimers. Confirma al usuario que el dictamen completo ya quedó guardado en el chat de Tenshi. ESTÁ PROHIBIDO responder en inglés.`
                }
            };
            if (!deferToolResponse && this.geminiClient) {
                this.sendGeminiToolResponse([successToolResponse]);
            }
            return { ok: true, res, savedDoc, toolResponse: successToolResponse };
        } catch (specErr) {
            logger.error(`[VoiceSession] Error orquestando consulta a ${agente}:`, specErr);
            if (onProgress) onProgress('error', agente);
            if (!suppressIdle) {
                this.sendToClient({
                    type: 'status',
                    data: { status: 'idle', message: '' },
                });
            }
            const catchToolResponse = {
                id: fc.id,
                name: fc.name,
                response: {
                    result: `[FALLO AL CONSULTAR ESPECIALISTA ${agente}]: No se pudo conectar en segundo plano (${specErr.message}).\n\n[INSTRUCCIÓN CRÍTICA DE HONESTIDAD EN ESPAÑOL]: NO digas que ya consultaste al especialista ni que dejaste su dictamen en el chat. Informa brevemente el inconveniente técnico y responde tú misma directamente con tu base de conocimientos en SG-SST (Decreto 1072 de 2015 y normatividad vigente) en español.`
                }
            };
            if (!deferToolResponse && this.geminiClient) {
                this.sendGeminiToolResponse([catchToolResponse]);
            }
            return { ok: false, error: specErr.message, toolResponse: catchToolResponse };
        }
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
                    const resultStr = typeof data.result === 'object' ? JSON.stringify(data.result) : String(data.result || '');
                    logger.info(`[VoiceSession] Received wappy_action_result from client for tool ${data.name} (id: ${data.id}): ${resultStr.substring(0, 150)}`);
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

            case 'barge_in':
                logger.info('[VoiceSession] 🗣️ Barge-in recibido del cliente → interrumpiendo salida de IA y habilitando voz del usuario');
                this.clearAudioStreamEndWatchdog();
                this.isAiSpeaking = false;
                this.aiGenerationComplete = false;
                this.activeToolCount = 0;
                this.suppressClientAudioUntil = null;
                this.bargeInSuppressAiAudioUntil = Date.now() + 900;
                if (this.aiSpeakingTimeout) {
                    clearTimeout(this.aiSpeakingTimeout);
                    this.aiSpeakingTimeout = null;
                }
                break;

            case 'playback_ended': {
                const msSinceLastAiAudio = this.lastAiAudioAt ? (Date.now() - this.lastAiAudioAt) : Infinity;
                if (this.aiGenerationComplete || msSinceLastAiAudio >= 350) {
                    if (this.isAiSpeaking) {
                        logger.info(
                            `[VoiceSession] 🔊 playback_ended recibido (aiGenerationComplete=${Boolean(this.aiGenerationComplete)}, msSinceLastAiAudio=${Number.isFinite(msSinceLastAiAudio) ? msSinceLastAiAudio : 'N/A'}ms) → liberando isAiSpeaking de inmediato`
                        );
                        this.isAiSpeaking = false;
                    }
                    if (this.aiSpeakingTimeout) {
                        clearTimeout(this.aiSpeakingTimeout);
                        this.aiSpeakingTimeout = null;
                    }
                }
                break;
            }

            case 'audio':
                // Do not process audio if session is stopped or geminiClient is not ready or setup not complete
                if (!this.isActive || !this.geminiClient || !this.geminiClient.setupCompleted) {
                    break;
                }
                // No reenviar audio mientras la IA habla o mientras una herramienta está ejecutándose (salvo barge_in explícito previo)
                if (this.isAiSpeaking || this.activeToolCount > 0) {
                    break;
                }
                // Suprimir reenvío de audio del micrófono brevemente tras inyección de texto para permitir que Gemini Live sintetice la respuesta sin ser cancelado por ruido ambiental
                if (this.suppressClientAudioUntil && Date.now() < this.suppressClientAudioUntil) {
                    break;
                }
                // Forward audio to Gemini + Capture 16kHz PCM for Wappy Dots Multimodal WAV Transcription
                if (data && data.audioData) {
                    const nowAudio = Date.now();
                    // Si la IA ya había hablado en el turno previo (p. ej. turnComplete tarda 25s pero isAiSpeaking ya es false),
                    // limpiar banderas obsoletas y abrir turno nuevo de PCM limpio si pasaron > 600ms desde último audio usuario
                    if (this.turnHadAiOutput) {
                        const shouldOpenCleanTurn = !this.lastUserAudioAt || (nowAudio - this.lastUserAudioAt > 600);
                        this.turnHadAiOutput = false;
                        this.toolCalledThisTurn = false;
                        this.aiGenerationComplete = false;
                        if (shouldOpenCleanTurn) {
                            this.userTranscriptionText = '';
                            this.rawUserTranscriptionStream = '';
                            this.earlyCorrectedSnapshot = null;
                            this.currentTurnPcmChunks = [];
                            this.currentTurnPcmBytes = 0;
                            this.currentTurnPreRollChunks = [];
                            this.currentTurnSpeechDetected = false;
                            this.currentAudioTurnId = (this.currentAudioTurnId || 0) + 1;
                        }
                    }
                    this.lastUserAudioAt = nowAudio;

                    try {
                        const pcmBuf = Buffer.from(data.audioData, 'base64');
                        if (pcmBuf.length >= 2) {
                            const chunkRms = calculatePcm16LeRms(pcmBuf);
                            if (!this.currentTurnSpeechDetected) {
                                if (chunkRms >= 0.003) {
                                    this.currentTurnSpeechDetected = true;
                                    if (Array.isArray(this.currentTurnPreRollChunks) && this.currentTurnPreRollChunks.length > 0) {
                                        for (const pre of this.currentTurnPreRollChunks) {
                                            this.currentTurnPcmChunks.push(pre);
                                            this.currentTurnPcmBytes += pre.length;
                                        }
                                        this.currentTurnPreRollChunks = [];
                                    }
                                } else {
                                    if (!this.currentTurnPreRollChunks) this.currentTurnPreRollChunks = [];
                                    this.currentTurnPreRollChunks.push(pcmBuf);
                                    if (this.currentTurnPreRollChunks.length > 4) {
                                        this.currentTurnPreRollChunks.shift();
                                    }
                                }
                            }
                            // Acumular audio de voz del turno actual (máx ~30 segundos = 960,000 bytes a 16kHz 16-bit mono)
                            if (this.currentTurnSpeechDetected && this.currentTurnPcmBytes < 960000) {
                                this.currentTurnPcmChunks.push(pcmBuf);
                                this.currentTurnPcmBytes += pcmBuf.length;
                            }
                        }
                    } catch (_) {}

                    this.audioChunkCount = (this.audioChunkCount || 0) + 1;
                    if (this.audioChunkCount === 1 || this.audioChunkCount % 100 === 0) {
                        logger.info(`[VoiceSession] AUDIO recibido del cliente (chunk #${this.audioChunkCount}, ${data.audioData.length} chars, turnPcmBytes: ${this.currentTurnPcmBytes || 0})`);
                    }
                    this.geminiClient.sendAudio(data.audioData);

                    // Watchdog de servidor (750ms): garantiza cierre de turno automático con audioStreamEnd
                    // si el cliente dejó de enviar paquetes sin emitir speech_end (evita pausas de 10-17s)
                    if (this.currentTurnSpeechDetected && this.currentTurnPcmBytes >= 6400) {
                        this.clearAudioStreamEndWatchdog();
                        this.audioStreamEndWatchdog = setTimeout(() => {
                            this.audioStreamEndWatchdog = null;
                            if (
                                !this.isActive ||
                                !this.geminiClient ||
                                !this.geminiClient.setupCompleted ||
                                this.isAiSpeaking ||
                                this.activeToolCount > 0 ||
                                this.turnHadAiOutput
                            ) {
                                return;
                            }
                            if (!this.currentTurnSpeechDetected || (this.currentTurnPcmBytes || 0) < 6400) {
                                return;
                            }
                            if (Array.isArray(this.currentTurnPcmChunks) && this.currentTurnPcmChunks.length > 0) {
                                const watchdogWavCheck = build16kMonoWavFromPcmChunks(this.currentTurnPcmChunks);
                                if (watchdogWavCheck.silent) {
                                    logger.info(
                                        `[VoiceSession] 🔇 Watchdog servidor ignoró ruido corto/silencio (${watchdogWavCheck.durationSec}s, RMS=${watchdogWavCheck.rms.toFixed(4)}, ${this.currentTurnPcmBytes || 0}B PCM, reason=${watchdogWavCheck.reason})`
                                    );
                                    return;
                                }
                            }
                            const nowWd = Date.now();
                            if (this.lastAudioStreamEndAt && nowWd - this.lastAudioStreamEndAt <= 800) {
                                return;
                            }
                            logger.info(
                                `[VoiceSession] ⏱️ Watchdog servidor (750ms sin nuevos paquetes PCM, ${this.currentTurnPcmBytes}B) → disparando audioStreamEnd`
                            );
                            this.triggerEarlyUserTranscriptionCorrection('server_watchdog');
                            if (typeof this.geminiClient.sendAudioStreamEnd === 'function') {
                                this.lastAudioStreamEndAt = nowWd;
                                this.geminiClient.sendAudioStreamEnd();
                            }
                        }, 750);
                    }
                }
                break;

            case 'speech_end':
                // El cliente detectó fin de voz real. Ejecutamos la transcripción multimodal Wappy Dots (16kHz WAV)
                // y enviamos audioStreamEnd si hay habla real acumulada (descartando ruido corto < 0.45s / baja energía).
                this.clearAudioStreamEndWatchdog();
                if (!this.isActive || !this.geminiClient || !this.geminiClient.setupCompleted) {
                    break;
                }
                if (this.isAiSpeaking || this.activeToolCount > 0) {
                    break;
                }
                {
                    const hasFreshUserSpeech = Boolean(
                        this.currentTurnSpeechDetected && (this.currentTurnPcmBytes || 0) >= 6400
                    );
                    // No bloquear por turnHadAiOutput/toolCalledThisTurn obsoletos si ya llegó habla real nueva del usuario
                    if ((this.turnHadAiOutput || this.toolCalledThisTurn) && !hasFreshUserSpeech) {
                        break;
                    }
                    if (hasFreshUserSpeech && (this.turnHadAiOutput || this.toolCalledThisTurn)) {
                        this.turnHadAiOutput = false;
                        this.toolCalledThisTurn = false;
                    }
                    this.bargeInSuppressAiAudioUntil = 0;
                    if (Array.isArray(this.currentTurnPcmChunks) && this.currentTurnPcmChunks.length > 0) {
                        const endWavCheck = build16kMonoWavFromPcmChunks(this.currentTurnPcmChunks);
                        if (endWavCheck.silent) {
                            logger.info(
                                `[VoiceSession] 🔇 Ignorando speech_end por ruido corto/silencio (${endWavCheck.durationSec}s, RMS=${endWavCheck.rms.toFixed(4)}, ${this.currentTurnPcmBytes || 0}B PCM, reason=${endWavCheck.reason})`
                            );
                            this.currentTurnPcmChunks = [];
                            this.currentTurnPcmBytes = 0;
                            this.currentTurnPreRollChunks = [];
                            this.currentTurnSpeechDetected = false;
                            this.currentAudioTurnId = (this.currentAudioTurnId || 0) + 1;
                            if (!this.userTranscriptionText || this.userTranscriptionText.trim().length < 18) {
                                this.userTranscriptionText = '';
                                this.rawUserTranscriptionStream = '';
                            }
                            break;
                        }
                    }
                    this.triggerEarlyUserTranscriptionCorrection('speech_end');
                    if (
                        ((this.userTranscriptionText && this.userTranscriptionText.trim().length > 0) ||
                            hasFreshUserSpeech) &&
                        typeof this.geminiClient.sendAudioStreamEnd === 'function' &&
                        (!this.lastAudioStreamEndAt || Date.now() - this.lastAudioStreamEndAt > 800)
                    ) {
                        this.lastAudioStreamEndAt = Date.now();
                        this.geminiClient.sendAudioStreamEnd();
                    }
                }
                break;

            case 'video':
                // Forward video frame to Gemini
                if (data && data.image) {
                    logger.debug(`[VoiceSession] Received video frame (${data.image.length} chars, has telemetry: ${!!data.telemetry})`);
                    this.latestFrame = data.image; // Guarda el último frame capturado para el análisis
                    this.lastVideoFrameAt = Date.now();
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

            case 'video-clip':
                if (data && data.video) {
                    this.latestVideoClip = {
                        base64: data.video,
                        mimeType: data.mimeType || 'video/webm',
                        telemetry: data.telemetry || this.latestTelemetry || null,
                        capturedAt: Date.now(),
                    };
                    logger.debug(`[VoiceSession] Received live video clip (${data.video.length} chars, mime: ${this.latestVideoClip.mimeType})`);
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

                    if (data.image && this.geminiClient) {
                        this.geminiClient.sendVideo(data.image);
                        logger.info('[VoiceSession] Forwarded evidence image directly to Gemini Multimodal Live API');
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
                        let isNewConvo = false;
                        let conversationId = (this.isFisioMode && this.fisioConversationId) ? this.fisioConversationId : this.conversationId;
                        if (!conversationId || conversationId === 'new') {
                            conversationId = uuidv4();
                            if (this.isFisioMode) {
                                this.fisioConversationId = conversationId;
                            } else {
                                this.conversationId = conversationId;
                            }
                            isNewConvo = true;
                        }

                        const messageId = uuidv4();
                        const messageData = {
                            messageId,
                            conversationId,
                            parentMessageId: this.isFisioMode ? this.fisioLastMessageId : this.lastMessageId,
                            text: messageText,
                            content: messageContent,
                            user: this.userId,
                            sender: 'User',
                            isCreatedByUser: true,
                            endpoint: this.isFisioMode ? 'agents' : this.dbEndpoint,
                            model: this.dbModel,
                        };

                        const savedMessage = await saveMessage({ user: { id: this.userId } }, messageData, { context: 'VoiceSession - Evidence Save' });
                        if (savedMessage) {
                            if (this.isFisioMode) {
                                this.fisioLastMessageId = messageId;
                            } else {
                                this.lastMessageId = messageId;
                            }
                            logger.info(`[VoiceSession] Saved new evidence photo message: ${messageId} for phase: ${phaseName} (conversationId: ${conversationId}, agent: ${this.isFisioMode ? 'Fisioterapeuta' : 'Tenshi'})`);
                        }

                        if (this.isFisioMode) {
                            const workerName = (this.extractedWorkerMeta && this.extractedWorkerMeta.workerName) || this.user?.name || 'Colaborador';
                            try {
                                await saveConvo({ user: { id: this.userId } }, {
                                    conversationId,
                                    endpoint: 'agents',
                                    agent_id: this.fisioAgent?.id || 'fisioterapeuta_laboral',
                                    title: `Estudio Ergonómico — ${workerName}`,
                                    model: this.dbModel,
                                    tags: ['sgsst-live-analysis', 'fisioterapeuta-laboral']
                                }, { context: 'VoiceSession - Fisio Evidence Convo' });
                            } catch (convoErr) {
                                logger.warn('[VoiceSession] Error updating fisio conversation:', convoErr.message);
                            }
                        }

                        // Send to Gemini Live silently if it's a telemetry alert
                        const isTelemetry = !!data.text && !data.metadata?.phaseName;
                        if (isTelemetry && this.geminiClient && this.geminiClient.setupCompleted) {
                            if (data.image) {
                                this.geminiClient.sendVideo(data.image);
                            }
                        }

                        // If it's a phase evidence captured by the user, notify Gemini Live so the AI verbally acknowledges it!
                        if (data.metadata?.phaseName && this.geminiClient && this.geminiClient.setupCompleted && this.isActive && !this.reportGenerated && !this.isGeneratingReport) {
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
                                data: { conversationId }
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
                        const reportSubjectLabel = this.isBiomechanics ? 'ergonómico oficial' : (this.currentInspectionSubject ? `de ${this.currentInspectionSubject}` : 'técnico oficial');
                        this.geminiClient.sendText(`INSTRUCCIÓN DE SISTEMA: El usuario ha solicitado compilar el informe técnico. Confírmale verbalmente en 1 sola frase breve y entusiasta: "Entendido, estoy procesando las evidencias para compilar tu informe técnico ${reportSubjectLabel}. Por favor espera un momento conectado." PROHIBIDO AFIRMAR QUE YA ESTÁ LISTO.`);
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
                if (data && Object.prototype.hasOwnProperty.call(data, 'tenshiConversationId')) {
                    this.activeTenshiConversationId = normalizeTenshiConversationId(data.tenshiConversationId);
                    logger.info(`[VoiceSession] Config update: activeTenshiConversationId=${this.activeTenshiConversationId}`);
                }
                if (data && (Array.isArray(data.selectedNotebooks) || Array.isArray(data.selectedTenshiNotebooks))) {
                    this.selectedTenshiNotebooks = sanitizeSelectedNotebooks(
                        Array.isArray(data.selectedNotebooks) ? data.selectedNotebooks : data.selectedTenshiNotebooks
                    );
                    logger.info(`[VoiceSession] Config update: selectedTenshiNotebooks=${this.selectedTenshiNotebooks.length}`);
                }
                if (data && data.voice) {
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
                    this.clearAudioStreamEndWatchdog();
                    // Solo registrar como transcripción del usuario si no es un prompt interno del sistema
                    const isInternalSystemMessage = /^\[SISTEMA INTERNO WAPPY/i.test(data.text);
                    if (!isInternalSystemMessage) {
                        this.userTranscriptionText += (this.userTranscriptionText ? '\n' : '') + data.text;
                        this.lastUserTranscription = data.text;
                    }
                    
                    if (this.geminiClient) {
                        // Suprimir reenvío de audio del micrófono durante 4 segundos para que Gemini Live
                        // procese y sintetice el turno de texto sin ser interrumpido/descartado por el VAD ante ruido ambiental
                        this.suppressClientAudioUntil = Date.now() + 4000;
                        try {
                            this.geminiClient.sendAudioStreamEnd();
                        } catch (_) {}
                        this.geminiClient.sendText(data.text);
                    } else {
                        logger.warn('[VoiceSession] Received text message but Gemini client is not ready');
                    }
                }
                break;

            case 'interrupt':
                // User interrupted, stop current Gemini response
                logger.info('[VoiceSession] Manual interrupt command received from client');
                this.clearAudioStreamEndWatchdog();
                this.isAiSpeaking = false;
                this.aiGenerationComplete = false;
                this.suppressClientAudioUntil = null;
                if (this.aiSpeakingTimeout) {
                    clearTimeout(this.aiSpeakingTimeout);
                    this.aiSpeakingTimeout = null;
                }
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
                    if (typeof data.isHeroMode === 'boolean') {
                        this.isHeroMode = data.isHeroMode;
                    }
                    if (data.conversationId && data.conversationId !== 'new') {
                        this.conversationId = data.conversationId;
                    }
                    if (Object.prototype.hasOwnProperty.call(data, 'tenshiConversationId')) {
                        this.activeTenshiConversationId = normalizeTenshiConversationId(data.tenshiConversationId);
                    }
                    if (Array.isArray(data.selectedNotebooks)) {
                        this.selectedTenshiNotebooks = sanitizeSelectedNotebooks(data.selectedNotebooks);
                    } else if (Array.isArray(data.selectedTenshiNotebooks)) {
                        this.selectedTenshiNotebooks = sanitizeSelectedNotebooks(data.selectedTenshiNotebooks);
                    }
                    if (typeof data.route === 'string' && data.route.trim()) {
                        this.activeScreenRoute = data.route.trim();
                    }
                    if (data.isHeroMode === true || this.isHeroMode === true) {
                        this.activeScreenAgent = null;
                    } else if (data.agentId || data.agentName) {
                        this.activeScreenAgent = {
                            id: data.agentId,
                            name: data.agentName
                        };
                    } else if (data.agentId === null || data.agentName === null) {
                        this.activeScreenAgent = null;
                    }
                    const humanDesc = formatScreenRouteHuman(this.activeScreenRoute, this.activeScreenAgent, this.isHeroMode);
                    logger.info(`[VoiceSession] Updated screen context: conversationId=${this.conversationId}, tenshiConversationId=${this.activeTenshiConversationId}, selectedNotebooks=${this.selectedTenshiNotebooks.length}, isHeroMode=${this.isHeroMode}, activeScreenAgent=${JSON.stringify(this.activeScreenAgent)}, route=${this.activeScreenRoute} (${humanDesc})`);
                }
                break;

            case 'set_personality':
                if (data && data.personality) {
                    const pMode = String(data.personality).toLowerCase();
                    this.config.personality = pMode;
                    logger.info(`[VoiceSession] Personality mode updated in hot session to: ${pMode}`);
                    if (this.geminiClient && this.geminiClient.setupCompleted) {
                        const modeDirective = pMode === 'express'
                            ? '[SISTEMA INTERNO WAPPY - CAMBIO DE MODO EN CALIENTE]: El usuario activó el modo "⚡ Ejecutivo Express". A partir de este momento, responde SIEMPRE en máximo 1 a 2 frases ultra-directas y al grano, priorizando cifras y acciones inmediatas. NO respondas en voz alta a este aviso; aplícalo en tu siguiente turno.'
                            : pMode === 'auditor'
                            ? '[SISTEMA INTERNO WAPPY - CAMBIO DE MODO EN CALIENTE]: El usuario activó el modo "⚖️ Modo Auditor". A partir de este momento, responde con rigor normativo estricto citando artículos del Decreto 1072 de 2015, Resolución 0312 de 2019 y normas aplicables. NO respondas en voz alta a este aviso; aplícalo en tu siguiente turno.'
                            : '[SISTEMA INTERNO WAPPY - CAMBIO DE MODO EN CALIENTE]: El usuario activó el modo "🛡️ Consultor Senior". A partir de este momento, responde con calidez ejecutiva, criterio técnico integral y recomendaciones prácticas. NO respondas en voz alta a este aviso; aplícalo en tu siguiente turno.';
                        try {
                            this.geminiClient.sendText(modeDirective);
                        } catch (_) {}
                    }
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
            if (!text || !String(text).trim()) {
                return;
            }
            const prompt = `Please format the following transcription to be more readable, correcting punctuation and capitalization, but keeping the original meaning and words as much as possible. Do not add any conversational filler. Text: "${text}"`;
            const result = await generateWithKeyRotation(
                'gemini-3.5-flash-lite',
                this.userId,
                prompt,
                {
                    fastFallback: true,
                    timeoutMs: 3600,
                    generationConfig: { maxOutputTokens: 256, temperature: 0.1 },
                }
            );
            const refinedText = (result?.response?.text?.() || '').trim();

            if (refinedText) {

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
     * Ejecuta transcripción multimodal Wappy Dots (16kHz Mono WAV + Pool de Claves con gemini-3.5-flash-lite -> gemini-3.6-flash)
     * apenas el usuario termina de hablar (~300-600ms), deduplicada por firma SHA-1 del buffer WAV para 0 llamadas duplicadas.
     */
    triggerEarlyUserTranscriptionCorrection(reason = 'stream_pause') {
        if (this.earlyCorrectionTimer) {
            clearTimeout(this.earlyCorrectionTimer);
            this.earlyCorrectionTimer = null;
        }
        const rawSnapshot = (this.userTranscriptionText || this.rawUserTranscriptionStream || '').trim();
        if (/^\[SISTEMA INTERNO WAPPY/i.test(rawSnapshot)) {
            return;
        }
        const pcmChunksSnapshot = Array.isArray(this.currentTurnPcmChunks) && this.currentTurnPcmChunks.length > 0
            ? [...this.currentTurnPcmChunks]
            : [];
        const pcmBytesSnapshot = this.currentTurnPcmBytes || 0;
        const turnIdSnapshot = this.currentAudioTurnId || 0;
        const hasRealSpeechAudio = this.currentTurnSpeechDetected && pcmBytesSnapshot >= 9600;

        // Omitir llamadas por ruido breve o silencios en pausa
        if (reason === 'user_pause' && (!hasRealSpeechAudio || pcmBytesSnapshot < 16000)) {
            return;
        }
        if ((!rawSnapshot || rawSnapshot.length < 2) && !hasRealSpeechAudio) {
            return;
        }

        // Pre-filtro anti-ruido corto antes de llamar a Gemini o pintar burbuja fantasma (ej. respiración 0.32s RMS=0.0476 -> "3 meses.")
        let prebuiltWavInfo = null;
        if (pcmChunksSnapshot.length > 0) {
            prebuiltWavInfo = build16kMonoWavFromPcmChunks(pcmChunksSnapshot);
            if (prebuiltWavInfo.silent) {
                logger.info(
                    `[VoiceSession] 🔇 Descartando ruido corto/silencio antes de transcribir WAV (${reason}, ${prebuiltWavInfo.durationSec}s, RMS=${prebuiltWavInfo.rms.toFixed(4)}, ${pcmBytesSnapshot}B PCM, reason=${prebuiltWavInfo.reason}, raw="${rawSnapshot}")`
                );
                const silentSnapshot = {
                    resolved: true,
                    raw: rawSnapshot,
                    corrected: '',
                    isSilence: true,
                    pcmBytes: pcmBytesSnapshot,
                    pcmSignature: null,
                    turnId: turnIdSnapshot,
                    timestamp: Date.now(),
                };
                this.earlyCorrectedSnapshot = silentSnapshot;
                if (rawSnapshot && (this.userTranscriptionText || '').trim() === rawSnapshot) {
                    this.userTranscriptionText = '';
                    this.rawUserTranscriptionStream = '';
                }
                return Promise.resolve(silentSnapshot);
            }
        }

        const wavSignature = prebuiltWavInfo?.signature || null;

        // Deduplicar llamadas concurrentes en el mismo turno para evitar cascada sobre el pool
        if (this.earlyCorrectionPromise) {
            return this.earlyCorrectionPromise;
        }

        // Si ya tenemos un resultado calculado para la misma firma WAV o el mismo turno/buffer (incluyendo silencio confirmado), reutilizarlo con 0 llamadas extra
        if (
            this.earlyCorrectedSnapshot &&
            ((wavSignature && this.earlyCorrectedSnapshot.pcmSignature === wavSignature) ||
                (this.earlyCorrectedSnapshot.turnId === turnIdSnapshot &&
                    Math.abs(pcmBytesSnapshot - (this.earlyCorrectedSnapshot.pcmBytes || 0)) <= 4096))
        ) {
            return Promise.resolve(this.earlyCorrectedSnapshot);
        }

        const toolCallsSnapshot = Array.isArray(this.currentTurnToolCalls) ? [...this.currentTurnToolCalls] : [];
        const cacheKey = wavSignature
            ? `wav:${wavSignature}`
            : `txt:${turnIdSnapshot}:${rawSnapshot}:${Math.floor(pcmBytesSnapshot / 8192)}`;

        if (this.earlyCorrectionInFlightKey === cacheKey) {
            return this.earlyCorrectionPromise;
        }
        this.earlyCorrectionInFlightKey = cacheKey;

        const promise = this.correctTranscription(
            rawSnapshot,
            this.aiResponseText || '',
            toolCallsSnapshot,
            pcmChunksSnapshot,
            prebuiltWavInfo
        )
            .then((corrected) => {
                const cleanCorrected = (corrected || '').trim();
                const isSilence = !cleanCorrected;
                const snapshot = {
                    resolved: true,
                    raw: rawSnapshot,
                    corrected: cleanCorrected,
                    isSilence,
                    pcmBytes: pcmBytesSnapshot,
                    pcmSignature: wavSignature,
                    turnId: turnIdSnapshot,
                    cacheKey,
                    timestamp: Date.now(),
                };
                // Guardar SIEMPRE el snapshot (tanto texto real como [SILENCIO] verificado) para que TURN COMPLETE reutilice con 0 llamadas duplicadas
                if ((this.currentAudioTurnId || 0) === turnIdSnapshot) {
                    this.earlyCorrectedSnapshot = snapshot;
                }

                const currentActiveRaw = (this.userTranscriptionText || this.rawUserTranscriptionStream || '').trim();
                if (isSilence) {
                    // Si el transcriptor WAV confirmó silencio/ruido, limpiar alucinación cruda sin reemplazar la burbuja real previa
                    if (
                        (this.currentAudioTurnId || 0) === turnIdSnapshot &&
                        rawSnapshot &&
                        currentActiveRaw === rawSnapshot
                    ) {
                        this.userTranscriptionText = '';
                        this.rawUserTranscriptionStream = '';
                    }
                    return snapshot;
                }

                // Si seguimos en el mismo turno de habla del usuario, actualizar en vivo la burbuja inmediatamente
                if (
                    (this.currentAudioTurnId || 0) === turnIdSnapshot &&
                    (currentActiveRaw === rawSnapshot || !currentActiveRaw || currentActiveRaw === this.userTranscriptionText) &&
                    cleanCorrected !== rawSnapshot
                ) {
                    this.userTranscriptionText = cleanCorrected;
                    this.lastUserTranscription = cleanCorrected;
                    logger.info(`[VoiceSession] ⚡ Wappy Dots Multimodal WAV transcription (${reason}, ${pcmBytesSnapshot}B PCM): "${rawSnapshot}" -> "${cleanCorrected}"`);
                    this.sendToClient({
                        type: 'text',
                        data: {
                            text: cleanCorrected,
                            isUserTranscription: true,
                            replaceLastUserBubble: true,
                        },
                    });
                }
                return snapshot;
            })
            .catch(() => ({
                resolved: false,
                raw: rawSnapshot,
                corrected: '',
                isSilence: false,
                pcmBytes: pcmBytesSnapshot,
                pcmSignature: wavSignature,
                turnId: turnIdSnapshot,
            }))
            .finally(() => {
                if (this.earlyCorrectionInFlightKey === cacheKey) {
                    this.earlyCorrectionInFlightKey = null;
                }
                if (this.earlyCorrectionPromise === promise) {
                    this.earlyCorrectionPromise = null;
                }
            });

        this.earlyCorrectionPromise = promise;
        return promise;
    }

    /**
     * Transcripción Multimodal de Voz 16kHz WAV con el Pool de Gemini (Arquitectura Wappy Dots):
     * 1. Convierte los chunks PCM 16kHz 16-bit mono a WAV en memoria con filtro anti-ruido corto (<0.45s & RMS<0.06) y firma SHA-1.
     * 2. Deduplica por firma SHA-1 del buffer recortado (0 llamadas duplicadas entre speech_end/tool_call y TURN COMPLETE).
     * 3. Envía EXCLUSIVAMENTE el audio WAV 16kHz (SIN pasar rawLiveText ni aiReplyHint al prompt para eliminar sesgo de alucinaciones)
     *    a gemini-3.5-flash-lite con rotación limpia a gemini-3.6-flash (modelos activos de GOOGLE_MODELS en .env) ante 503/timeout.
     * 4. Devuelve exactamente [SILENCIO] -> '' si solo hay ruido ambiental, respiración o audio ininteligible.
     *    Solo usa rawLiveText como último respaldo si fallan todos los intentos al API WAV.
     */
    async correctTranscription(userText, aiResponseText, toolCalls = [], pcmChunks = null, prebuiltWavInfo = null) {
        try {
            const rawInput = typeof userText === 'string' ? userText : '';
            const sanitized = sanitizeAccumulatedTranscription(rawInput).trim();
            const hasPcmChunks = Array.isArray(pcmChunks) && pcmChunks.length > 0;
            const wavInfo = prebuiltWavInfo || (hasPcmChunks
                ? build16kMonoWavFromPcmChunks(pcmChunks)
                : { silent: true, rms: 0, wavBase64: null, byteLength: 0, durationSec: 0, reason: 'no_pcm', signature: null });

            // Si recibimos audio real de micrófono y el filtro RMS / anti-ruido corto determinó silencio/ruido,
            // descartar SIEMPRE sin gastar tokens y sin filtrar alucinaciones de rawLiveText (ej. "3 meses.")
            if (hasPcmChunks && wavInfo.silent) {
                logger.info(
                    `[VoiceSession] 🔇 Audio descartado en correctTranscription (${wavInfo.durationSec}s, RMS=${wavInfo.rms.toFixed(4)}, ${wavInfo.byteLength}B, reason=${wavInfo.reason}, raw="${rawInput}")`
                );
                return '';
            }

            // Si no hay audio con voz real NI texto válido, descartar sin gastar tokens
            if (wavInfo.silent && !sanitized) {
                return '';
            }

            // Deduplicación estricta por firma SHA-1 del WAV (caché de 60s + deduplicación de promesas en vuelo)
            if (!this.wavTranscriptionCache) this.wavTranscriptionCache = new Map();
            if (!this.wavTranscriptionInFlight) this.wavTranscriptionInFlight = new Map();

            const wavSig = wavInfo.signature;
            if (wavSig) {
                const cached = this.wavTranscriptionCache.get(wavSig);
                if (cached && Date.now() - cached.at < 60000) {
                    logger.info(
                        `[VoiceSession] ♻️ Reutilizando transcripción WAV cacheada (sig=${wavSig}, ${wavInfo.durationSec}s): "${cached.text}"`
                    );
                    return cached.text;
                }
                if (this.wavTranscriptionInFlight.has(wavSig)) {
                    logger.info(`[VoiceSession] ♻️ Esperando transcripción WAV ya en vuelo (sig=${wavSig})`);
                    return await this.wavTranscriptionInFlight.get(wavSig);
                }
            }

            // Fast-path para respuestas cortas exactas SOLO si no hubo audio PCM (o si el audio real es corto y tiene energía clara)
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
                'hola': 'Hola.',
                'hola tenshi': 'Hola, Tenshi.',
                'hola suri': 'Hola, Suri.',
                'tenshi hola': 'Tenshi, hola.',
                'suri hola': 'Suri, hola.',
                'haz el informe': 'Haz el informe.',
                'genera el informe': 'Genera el informe.',
                'generar el informe': 'Generar el informe.',
                'listo genera el informe': 'Listo, genera el informe.',
                'si genera el informe': 'Sí, genera el informe.',
                'si haz el informe': 'Sí, haz el informe.',
            };

            if (quickPhrases[lower] && (!hasPcmChunks || (wavInfo.durationSec < 1.6 && wavInfo.rms >= 0.06))) {
                logger.info(`[VoiceSession] Transcription fast-path matched: "${rawInput}" -> "${quickPhrases[lower]}"`);
                if (wavSig) {
                    this.wavTranscriptionCache.set(wavSig, { text: quickPhrases[lower], at: Date.now() });
                }
                return quickPhrases[lower];
            }

            const validShortWords = new Set(['sí', 'si', 'no', 'ya', 'ok', 'va', 'voy', 'paz', 'fin', 'hola']);
            if (wavInfo.silent && lower.length <= 3 && !validShortWords.has(lower)) {
                logger.info(`[VoiceSession] Discarding short silent noise fragment in correctTranscription: "${sanitized}"`);
                return '';
            }

            // Escalera de modelos estrictamente alineada con GOOGLE_MODELS de .env (verify-ai-models):
            // 1) gemini-3.5-flash-lite  2) gemini-3.6-flash (rotación limpia ante 503/429/timeout)
            const envActiveTextModels = (process.env.GOOGLE_MODELS || '')
                .split(',')
                .map((m) => m.trim().replace(/^models\//i, ''))
                .filter((m) => m && !/live|native-audio|tts|transcribe/i.test(m));
            const wavModelLadder = ['gemini-3.5-flash-lite', 'gemini-3.6-flash'].filter(
                (m) => envActiveTextModels.length === 0 || envActiveTextModels.includes(m)
            );
            const modelsToTry = wavModelLadder.length > 0 ? wavModelLadder : ['gemini-3.5-flash-lite', 'gemini-3.6-flash'];

            const customVocab = Array.from(new Set([
                ...WAPPY_DICTATION_CUSTOM_VOCABULARY,
                ...(this.user?.name ? [this.user.name] : []),
                ...(this.initialBriefingSummary?.companyName ? [this.initialBriefingSummary.companyName] : []),
            ].filter(Boolean)));
            const vocabLine = `\nGlosario de nombres propios y siglas técnicas SST/WAPPY a escribir exactamente así si se escuchan en el audio: ${customVocab.join(', ')}.`;

            // ── CAMINO 1 (PRINCIPAL - ARQUITECTURA WAPPY DOTS): Lectura Multimodal EXCLUSIVA del Audio WAV 16kHz ──
            // PROHIBIDO inyectar rawLiveText o aiReplyHint aquí (evita repetir alucinaciones como "3 meses." o "For Claude is here.")
            if (!wavInfo.silent && wavInfo.wavBase64) {
                const runWavTranscription = async () => {
                    const systemInstruction =
                        `Eres el motor de transcripción de voz de ultra-alta precisión de WAPPY IA y Suri/Tenshi (arquitectura Wappy Dots). ` +
                        `Escucha EXCLUSIVAMENTE el archivo de audio adjunto (16kHz Mono WAV) y transcribe literalmente lo que pronuncia la voz humana en español de Colombia/Latinoamérica, ` +
                        `con ortografía perfecta, signos de interrogación/exclamación (¿...?, ¡...!), comas, puntos y mayúsculas adecuadas. ` +
                        `Elimina únicamente muletillas involuntarias ('eh', 'este', 'mmm') conservando el 100% del mensaje real. ` +
                        `REGLA ANTI-ALUCINACIÓN ESTRICTA: Si en el audio NO hay voz humana inteligible hablando en español ` +
                        `(solo silencio, ruido ambiental, ventilador, respiración, suspiros, tos, clics o murmullo ininteligible), ` +
                        `devuelve EXACTAMENTE y ÚNICAMENTE el token: [SILENCIO] (prohibido inventar saludos, cifras, frases en inglés o palabras que no estén claramente pronunciadas en el audio). ` +
                        `NO respondas al usuario ni agregues explicaciones: devuelve SOLO la transcripción exacta o [SILENCIO].` +
                        vocabLine;

                    const userPrompt =
                        `Transcribe exclusivamente lo que escuchas en el audio WAV adjunto en español (Colombia/LatAm) con puntuación perfecta. ` +
                        `Si solo hay ruido de fondo, respiración o audio ininteligible, responde exactamente: [SILENCIO]`;

                    const multimodalParts = [
                        {
                            inlineData: {
                                mimeType: 'audio/wav',
                                data: wavInfo.wavBase64,
                            },
                        },
                        {
                            text: userPrompt,
                        },
                    ];

                    let lastWavErr = null;
                    for (let i = 0; i < modelsToTry.length; i++) {
                        const candidateModel = modelsToTry[i];
                        const attemptTimeoutMs = i === 0 ? 3400 : 4200;
                        logger.info(
                            `[VoiceSession] 🎙️ Transcribiendo audio WAV 16kHz multimodal (${wavInfo.durationSec}s, RMS=${wavInfo.rms.toFixed(4)}, sig=${wavSig}) con Pool Gemini (${candidateModel}, intento ${i + 1}/${modelsToTry.length})...`
                        );
                        try {
                            const timeoutPromise = new Promise((_, reject) =>
                                setTimeout(() => reject(new Error(`Multimodal WAV transcription timeout (${candidateModel})`)), attemptTimeoutMs + 400)
                            );
                            const correctionPromise = generateWithKeyRotation(
                                candidateModel,
                                this.userId,
                                multimodalParts,
                                {
                                    systemInstruction,
                                    fastFallback: true,
                                    timeoutMs: attemptTimeoutMs,
                                    generationConfig: { maxOutputTokens: 256, temperature: 0.0 },
                                }
                            );
                            const result = await Promise.race([correctionPromise, timeoutPromise]);
                            const rawOut = (result?.response?.text?.() || '')
                                .replace(/^["'«»]+|["'«»]+$/g, '')
                                .trim();

                            if (
                                !rawOut ||
                                /(\[SILENCIO\]|__SILENCIO__|\[DESCARTAR\]|^silencio\.?$|sin\s+audio|no\s+hay\s+voz)/i.test(rawOut)
                            ) {
                                logger.info(`[VoiceSession] 🔇 Multimodal WAV transcriber (${candidateModel}) devolvió [SILENCIO] (descartado raw="${rawInput}")`);
                                return { ok: true, text: '' };
                            }

                            const correctedText = applyDomainPhoneticCorrections(rawOut).trim();
                            logger.info(`[VoiceSession] ✅ Multimodal 16kHz WAV transcription (${candidateModel}): "${rawInput}" -> "${correctedText}"`);
                            return { ok: true, text: correctedText };
                        } catch (wavErr) {
                            lastWavErr = wavErr;
                            logger.warn(
                                `[VoiceSession] ⚠️ Multimodal WAV transcription falló en "${candidateModel}" (${wavErr.message})${i + 1 < modelsToTry.length ? ` — rotando a "${modelsToTry[i + 1]}"...` : ''}`
                            );
                        }
                    }
                    throw lastWavErr || new Error('All WAV transcription models failed');
                };

                const wavPromise = runWavTranscription()
                    .then((res) => {
                        const finalStr = res?.text || '';
                        if (wavSig) {
                            this.wavTranscriptionCache.set(wavSig, { text: finalStr, at: Date.now() });
                            if (this.wavTranscriptionCache.size > 16) {
                                const oldestKey = this.wavTranscriptionCache.keys().next().value;
                                if (oldestKey) this.wavTranscriptionCache.delete(oldestKey);
                            }
                        }
                        return finalStr;
                    })
                    .catch((allWavErr) => {
                        logger.warn(`[VoiceSession] Multimodal WAV transcription exhausted all models (${allWavErr.message}); using rawLiveText last-resort fallback`);
                        return sanitized || '';
                    })
                    .finally(() => {
                        if (wavSig && this.wavTranscriptionInFlight.get(wavSig) === wavPromise) {
                            this.wavTranscriptionInFlight.delete(wavSig);
                        }
                    });

                if (wavSig) {
                    this.wavTranscriptionInFlight.set(wavSig, wavPromise);
                }
                return await wavPromise;
            }

            // ── CAMINO 2 (ÚLTIMO RESPALDO SIN AUDIO WAV): Corrección textual solo si no existía buffer WAV ──
            if (!sanitized) return '';
            logger.info(`[VoiceSession] Starting text-only fallback transcription correction (no WAV buffer): "${sanitized}"`);
            const userNameHint = this.user?.name ? `Nombre real del usuario: "${this.user.name}".` : '';
            const toolCallsHint = Array.isArray(toolCalls) && toolCalls.length > 0
                ? `\nAcciones/herramientas ejecutadas en este turno: ${JSON.stringify(toolCalls).substring(0, 400)}`
                : '';
            const prompt = `Eres un corrector fonético, ortográfico y contextual experto en español de Colombia/Latinoamérica para el ecosistema WAPPY (asistente de voz "Suri" / "Tenshi", agente de escritorio "Antigravity", plataforma SG-SST).
${userNameHint}
${vocabLine}
${toolCallsHint}
TRANSCRIPCIÓN CRUDA A CORREGIR:
"""
${sanitized}
"""
Devuelve ÚNICA Y EXCLUSIVAMENTE el texto corregido en español con puntuación perfecta (¿...?), o [SILENCIO] si es ruido/alucinación. Sin comillas ni explicaciones.`;

            for (let i = 0; i < modelsToTry.length; i++) {
                const candidateModel = modelsToTry[i];
                try {
                    const timeoutPromise = new Promise((_, reject) =>
                        setTimeout(() => reject(new Error(`Transcription text fallback timeout (${candidateModel})`)), 2600)
                    );
                    const correctionPromise = generateWithKeyRotation(
                        candidateModel,
                        this.userId,
                        prompt,
                        { fastFallback: true, timeoutMs: 2400, generationConfig: { maxOutputTokens: 256, temperature: 0.0 } }
                    );
                    const result = await Promise.race([correctionPromise, timeoutPromise]);
                    const rawOut = (result?.response?.text?.() || '').replace(/^["'«»]+|["'«»]+$/g, '').trim();

                    if (!rawOut || /(\[SILENCIO\]|__SILENCIO__|\[DESCARTAR\])/i.test(rawOut)) {
                        return '';
                    }

                    const correctedText = applyDomainPhoneticCorrections(rawOut).trim();
                    logger.info(`[VoiceSession] Text fallback correction (${candidateModel}): "${rawInput}" -> "${correctedText}"`);
                    return correctedText;
                } catch (err) {
                    logger.debug(`[VoiceSession] Text fallback failed on "${candidateModel}" (${err.message})`);
                }
            }
            return sanitized;
        } catch (error) {
            logger.error('[VoiceSession] Error correcting transcription:', error);
            return sanitizeAccumulatedTranscription(userText);
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
                agentContext: this.lastSpecialistResponse || (this.isHeroMode ? '' : this.activeScreenAgent?.name) || '',
            }
        };

        let ok = false;
        let failReason = '';
        let generatedContent = '';
        let finalTitle = args.title;

        // Para documentos ('text', 'presentation', 'excel', 'html'), si no hay contenido explícito o es breve/texto plano,
        // usar userPrompt o args.title para que Camino B de CanvasTool sintetice el documento/presentación/hoja de cálculo completa.
        if (!args.content || (typeof args.content === 'string' && !args.content.trim())) {
            args.content = userPrompt || args.title || `Archivo ${fileTypeLabel} SG-SST`;
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
                        this.lastGeneratedReportHtml = generatedContent;
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
            // Guardar para adjuntar al mensaje final del turno de Tenshi (para que quede de último y unificado con la voz)
            this.lastGeneratedCanvasFile = {
                title: finalTitle,
                fileType: args.fileType,
                content: generatedContent,
                canvasId: uniqueCanvasId,
            };

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
     * Consulta en tiempo real la API pública de ExerciseDB (oss.exercisedb.dev - 1,500 ejercicios)
     * y la API clínica de NIH (clinicaltables.nlm.nih.gov) para construir la matriz CIE-11 / Decreto 1477
     * y una batería integral de 12 fichas visuales con GIFs animados reales de cuerpo completo.
     */
    async buildBiomechanicsPrescriptionBlock() {
        // Catálogo base verificado en CDN oficial de ExerciseDB (HTTP 200 image/gif)
        const gifs = {
            neckPush: 'https://static.exercisedb.dev/media/oQRJYkC.gif',       // Side push neck stretch (Elevador escápula / Trapecio)
            neckSide: 'https://static.exercisedb.dev/media/x2chWLO.gif',       // Neck side stretch (Cervical lateral)
            upperBack: 'https://static.exercisedb.dev/media/GSDioYu.gif',      // Upper back stretch (Dorsal / Romboides)
            chestShoulder: 'https://static.exercisedb.dev/media/QoHIhPl.gif',  // Behind head chest stretch (Apertura torácica)
            rearDeltoid: 'https://static.exercisedb.dev/media/xifhB5W.gif',    // Rear deltoid stretch (Hombro / Manguito rotador)
            tricepsElbow: 'https://static.exercisedb.dev/media/uOV3Itw.gif',   // Triceps & elbow stretch (Descarga codo / brazo)
            wristPull: 'https://static.exercisedb.dev/media/UtmIqcI.gif',      // Side wrist pull stretch (Túnel carpiano)
            wristCircles: 'https://static.exercisedb.dev/media/2zNKRUB.gif',   // Wrist circles (Movilidad sinovial carpo)
            seatedLumbar: 'https://static.exercisedb.dev/media/QFmz6ch.gif',   // Seated lower back stretch (Descompresión lumbar)
            spineTwist: 'https://static.exercisedb.dev/media/2jl9K55.gif',     // Spine twist (Rotación espinal)
            piriformis: 'https://static.exercisedb.dev/media/QY39eBr.gif',     // Seated piriformis stretch (Ciático / Cadera en silla)
            calfAnkle: 'https://static.exercisedb.dev/media/17bqEXD.gif',      // Seated calf stretch (Retorno venoso / Pantorrilla)
        };

        let icdCervicalLabel = 'M54.2 - Cervicalgia postural';
        let icdLumbarLabel = 'M54.5 - Lumbago / Dolor lumbar bajo';
        let icdCarpalLabel = 'G56.0 - Síndrome del túnel carpiano';
        let icdSciaticaLabel = 'M54.3 - Ciática / Síndrome piramidal';

        try {
            const fetchWithTimeout = (url, ms = 3000) => {
                const controller = new AbortController();
                const timer = setTimeout(() => controller.abort(), ms);
                return fetch(url, { signal: controller.signal })
                    .then(r => r.json())
                    .finally(() => clearTimeout(timer));
            };

            const [neckRes, backRes, wristRes, icdCervRes, icdLumbRes, icdCarpRes, icdSciaRes] = await Promise.allSettled([
                fetchWithTimeout('https://oss.exercisedb.dev/api/v1/exercises?bodyParts=neck'),
                fetchWithTimeout('https://oss.exercisedb.dev/api/v1/exercises/search?search=back%20stretch'),
                fetchWithTimeout('https://oss.exercisedb.dev/api/v1/exercises/search?search=wrist'),
                fetchWithTimeout('https://clinicaltables.nlm.nih.gov/api/icd10cm/v3/search?sf=code,name&terms=cervicalgia'),
                fetchWithTimeout('https://clinicaltables.nlm.nih.gov/api/icd10cm/v3/search?sf=code,name&terms=lumbago'),
                fetchWithTimeout('https://clinicaltables.nlm.nih.gov/api/icd10cm/v3/search?sf=code,name&terms=carpal+tunnel'),
                fetchWithTimeout('https://clinicaltables.nlm.nih.gov/api/icd10cm/v3/search?sf=code,name&terms=sciatica'),
            ]);

            if (neckRes.status === 'fulfilled' && neckRes.value?.data?.length > 0) {
                gifs.neckPush = neckRes.value.data[0]?.gifUrl || gifs.neckPush;
                if (neckRes.value.data[1]?.gifUrl) gifs.neckSide = neckRes.value.data[1].gifUrl;
            }
            if (backRes.status === 'fulfilled' && backRes.value?.data?.length > 0) {
                const upper = backRes.value.data.find(x => x.name?.includes('upper back'));
                const seated = backRes.value.data.find(x => x.name?.includes('seated lower back'));
                if (upper?.gifUrl) gifs.upperBack = upper.gifUrl;
                if (seated?.gifUrl) gifs.seatedLumbar = seated.gifUrl;
            }
            if (wristRes.status === 'fulfilled' && wristRes.value?.data?.length > 0) {
                const wristStretch = wristRes.value.data.find(x => x.name?.includes('stretch'));
                const circles = wristRes.value.data.find(x => x.name?.includes('circles'));
                if (wristStretch?.gifUrl) gifs.wristPull = wristStretch.gifUrl;
                if (circles?.gifUrl) gifs.wristCircles = circles.gifUrl;
            }
            if (icdCervRes.status === 'fulfilled' && Array.isArray(icdCervRes.value?.[3]) && icdCervRes.value[3][0]) {
                icdCervicalLabel = `${icdCervRes.value[3][0][0]} - ${icdCervRes.value[3][0][1]}`;
            }
            if (icdLumbRes.status === 'fulfilled' && Array.isArray(icdLumbRes.value?.[3]) && icdLumbRes.value[3][0]) {
                icdLumbarLabel = `${icdLumbRes.value[3][0][0]} - ${icdLumbRes.value[3][0][1]}`;
            }
            if (icdCarpRes.status === 'fulfilled' && Array.isArray(icdCarpRes.value?.[3]) && icdCarpRes.value[3][0]) {
                icdCarpalLabel = `${icdCarpRes.value[3][0][0]} - ${icdCarpRes.value[3][0][1]}`;
            }
            if (icdSciaRes.status === 'fulfilled' && Array.isArray(icdSciaRes.value?.[3]) && icdSciaRes.value[3][0]) {
                icdSciaticaLabel = `${icdSciaRes.value[3][0][0]} - ${icdSciaRes.value[3][0][1]}`;
            }

            logger.info(`[VoiceSession] Live ExerciseDB API (12 full-body GIFs) & NIH ICD API queried successfully.`);
        } catch (apiErr) {
            logger.warn('[VoiceSession] Live ExerciseDB/ICD API fallback used:', apiErr.message);
        }

        const exercisesList = [
            {
                num: 1,
                title: 'Estiramiento de Trapecio y Elevador de Escápula',
                codeBadge: 'CIE-11: FA80',
                badgeBg: '#ccfbf1',
                badgeColor: '#0f766e',
                gifUrl: gifs.neckPush,
                fallbackSvg: '/images/exercises/trapezius-stretch.svg',
                muscles: 'Elevador de la escápula (<code>levator scapulae</code>), trapecio superior, ECOM.',
                angleFix: 'Alivia sobrecarga por flexión cervical (> 20°-35°) e inclinación cefálica.',
                dosage: '2 series de 15 segundos por lado cada 90 min.',
                step: 'Sentado con espalda recta, inclinar suavemente la oreja hacia el hombro asistiendo con la mano.',
            },
            {
                num: 2,
                title: 'Elongación Cervical Lateral Libre',
                codeBadge: 'CIE-10: M54.2',
                badgeBg: '#e0f2fe',
                badgeColor: '#0369a1',
                gifUrl: gifs.neckSide,
                fallbackSvg: '/images/exercises/cervical-chin-tuck.svg',
                muscles: 'Escalenos anterior/medio, esplenio del cuello y fascia cervical.',
                angleFix: 'Descomprime vértebras C3-C7 ante postura estática frente a monitor.',
                dosage: '2 series de 15 segundos por lado con respiración pausada.',
                step: 'Descender hombros y realizar inclinación lateral pura sin rotar el mentón.',
            },
            {
                num: 3,
                title: 'Extensión Dorsal y Retracción Escapular',
                codeBadge: 'CIE-10: M50 / M54.6',
                badgeBg: '#fef3c7',
                badgeColor: '#b45309',
                gifUrl: gifs.upperBack,
                fallbackSvg: '/images/exercises/cervical-chin-tuck.svg',
                muscles: 'Trapecio medio, romboides mayor/menor y erectores torácicos.',
                angleFix: 'Corrige cifosis dorsal y adelantamiento cefálico ("Tech Neck").',
                dosage: '2 series de 15 segundos cada 90 minutos de labor continua.',
                step: 'Entrelazar manos al frente, movilizar escápulas y alinear el eje dorsocervical.',
            },
            {
                num: 4,
                title: 'Apertura Torácica y Pectoral Bilateral',
                codeBadge: 'CIE-11: FB40.1',
                badgeBg: '#e0f2fe',
                badgeColor: '#0369a1',
                gifUrl: gifs.chestShoulder,
                fallbackSvg: '/images/exercises/scapular-retraction.svg',
                muscles: 'Pectoral mayor y menor, deltoides anterior, porción larga del bíceps.',
                angleFix: 'Revierte hombros redondeados (antepulsión) y abducción sostenida.',
                dosage: '2 series de 15 segundos con inhalación diafragmática profunda.',
                step: 'Manos detrás de la nuca, proyectar codos hacia atrás abriendo la caja torácica.',
            },
            {
                num: 5,
                title: 'Estiramiento Cruzado de Deltoides y Manguito Rotador',
                codeBadge: 'CIE-10: M75.1',
                badgeBg: '#ffedd5',
                badgeColor: '#c2410c',
                gifUrl: gifs.rearDeltoid,
                fallbackSvg: '/images/exercises/scapular-retraction.svg',
                muscles: 'Deltoides posterior, infraespinoso, redondo menor y cápsula articular.',
                angleFix: 'Alivia fatiga por abducción de brazos (> 45°) o alcances repetitivos.',
                dosage: '2 series de 15 segundos por cada brazo.',
                step: 'Cruzar el brazo extendido frente al pecho y presionar suavemente a la altura del codo.',
            },
            {
                num: 6,
                title: 'Elongación Miofascial de Tríceps y Codo',
                codeBadge: 'CIE-11: FB52.2',
                badgeBg: '#fae8ff',
                badgeColor: '#a21caf',
                gifUrl: gifs.tricepsElbow,
                fallbackSvg: '/images/exercises/scapular-retraction.svg',
                muscles: 'Tríceps braquial, ancóneo, dorsal ancho superior y fascia del codo.',
                angleFix: 'Descarga articulación humerocubital tras flexión rígida fuera de 90°-100°.',
                dosage: '2 series de 15 segundos por brazo.',
                step: 'Elevar el brazo flexionando el codo tras la cabeza y empujar suavemente con la mano opuesta.',
            },
            {
                num: 7,
                title: 'Tracción de Flexores/Extensores y Túnel Carpiano',
                codeBadge: 'CIE-11: 8C10.0',
                badgeBg: '#f3e8ff',
                badgeColor: '#7e22ce',
                gifUrl: gifs.wristPull,
                fallbackSvg: '/images/exercises/wrist-carpal-stretch.svg',
                muscles: 'Flexor radial/ulnar del carpo, palmar largo y nervio mediano.',
                angleFix: 'Previene atrapamiento del nervio mediano (G56.0) y epicondilitis (M77.1).',
                dosage: '2 series de 15 segundos en cada mano cada 90 minutos.',
                step: 'Extender brazo al frente y traccionar suavemente los dedos liberando el túnel del carpo.',
            },
            {
                num: 8,
                title: 'Circunducción y Movilidad Sinovial de Muñecas',
                codeBadge: 'CIE-10: M65.4',
                badgeBg: '#ede9fe',
                badgeColor: '#6d28d9',
                gifUrl: gifs.wristCircles,
                fallbackSvg: '/images/exercises/wrist-carpal-stretch.svg',
                muscles: 'Retináculo flexor/extensor, tendones intrínsecos de mano y carpo.',
                angleFix: 'Reduce rigidez por digitación intensiva y uso continuo de mouse.',
                dosage: '2 series de 10 giros lentos en sentido horario y antihorario.',
                step: 'Realizar círculos amplios y controlados con ambas muñecas manteniendo antebrazos estables.',
            },
            {
                num: 9,
                title: 'Descompresión Lumbar en Silla (Flexión Controlada)',
                codeBadge: 'CIE-11: FA81',
                badgeBg: '#dcfce7',
                badgeColor: '#15803d',
                gifUrl: gifs.seatedLumbar,
                fallbackSvg: '/images/exercises/lumbar-decompression.svg',
                muscles: 'Erectores espinales (<code>erector spinae</code>), cuadrado lumbar, fascia toracolumbar.',
                angleFix: 'Alivia presión intradiscal L4-L5 y L5-S1 por inclinación de tronco (> 20°).',
                dosage: '2 series de 15 segundos cada 90 minutos de trabajo sedente.',
                step: 'Sentado firme en la silla, descender el tronco suavemente entre las rodillas relajando la zona lumbar.',
            },
            {
                num: 10,
                title: 'Rotación Axial Descompresiva de Columna (Spine Twist)',
                codeBadge: 'CIE-10: M54.5',
                badgeBg: '#d1fae5',
                badgeColor: '#047857',
                gifUrl: gifs.spineTwist,
                fallbackSvg: '/images/exercises/lumbar-decompression.svg',
                muscles: 'Multífidos, oblicuos internos/externos y rotadores vertebrales.',
                angleFix: 'Libera rigidez facetaria dorsolumbar tras posturas asimétricas o estáticas.',
                dosage: '2 repeticiones de 12 segundos por cada lado.',
                step: 'Con pelvis estable en la silla, girar suavemente el torso exhalando sin forzar el rango articular.',
            },
            {
                num: 11,
                title: 'Estiramiento de Piriforme y Nervio Ciático en Silla',
                codeBadge: 'CIE-10: M54.3',
                badgeBg: '#ffe4e6',
                badgeColor: '#be123c',
                gifUrl: gifs.piriformis,
                fallbackSvg: '/images/exercises/lumbar-decompression.svg',
                muscles: 'Músculo piriforme (<code>piriformis</code>), glúteo medio/mayor y nervio ciático.',
                angleFix: 'Previene síndrome piramidal y adormecimiento glúteo por sedestación > 2 horas.',
                dosage: '2 series de 15 segundos por cada pierna en la misma silla.',
                step: 'Cruzar el tobillo sobre la rodilla opuesta formando un "4" e inclinar levemente la espalda recta hacia adelante.',
            },
            {
                num: 12,
                title: 'Activación de Bomba Venosa de Pantorrilla y Tobillo',
                codeBadge: 'CIE-11: BD53',
                badgeBg: '#cffafe',
                badgeColor: '#0e7490',
                gifUrl: gifs.calfAnkle,
                fallbackSvg: '/images/exercises/lumbar-decompression.svg',
                muscles: 'Gastrocnemio, sóleo (<code>calves</code>), tibial anterior y retorno venoso.',
                angleFix: 'Previene estasis venosa periférica, edema maleolar y fatiga de miembros inferiores.',
                dosage: '2 series de 15 segundos por pierna cada 90-120 minutos.',
                step: 'Extender rodilla en silla y traccionar la punta del pie en dorsiflexión activando la bomba sóleo-gemelar.',
            },
        ];

        const cardsHtml = exercisesList.map(ex => `
        <div style="background:#ffffff; border:1px solid #cbd5e1; border-radius:12px; padding:14px; box-shadow:0 2px 8px rgba(0,0,0,0.06); display:flex; flex-direction:column;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; gap:6px;">
            <span style="font-weight:700; color:#0f766e; font-size:0.92em;">${ex.num}. ${ex.title}</span>
            <span style="background:${ex.badgeBg}; color:${ex.badgeColor}; padding:2px 8px; border-radius:6px; font-size:0.72em; font-weight:700; white-space:nowrap;">${ex.codeBadge}</span>
          </div>
          <div style="text-align:center; margin:6px 0; border-radius:8px; overflow:hidden; background:#ffffff; border:1px solid #e2e8f0; padding:6px;">
            <img src="${ex.gifUrl}" onerror="this.onerror=null; this.src='${ex.fallbackSvg}';" alt="${ex.title} - ExerciseDB GIF" style="width:100%; max-width:210px; height:auto; display:block; margin:0 auto; border-radius:6px;" />
          </div>
          <div style="font-size:0.82em; color:#334155; line-height:1.48; margin-top:8px;">
            <p style="margin:2px 0;"><strong>🎯 Músculos Diana:</strong> ${ex.muscles}</p>
            <p style="margin:2px 0;"><strong>📐 Efecto Biomecánico:</strong> ${ex.angleFix}</p>
            <p style="margin:2px 0;"><strong>⏱️ Dosificación:</strong> ${ex.dosage}</p>
            <p style="margin:2px 0; color:#0f766e;"><strong>💡 Técnica:</strong> ${ex.step}</p>
          </div>
        </div>`).join('\n');

        return `
    <div class="clinical-biomechanics-prescription" style="margin-top:28px; margin-bottom:24px;">
      <h3 style="color:#0f766e; font-size:1.25em; font-weight:700; border-bottom:1.5px solid #ccfbf1; padding-bottom:6px; margin-top:24px;">
        4.1 Correlación Diagnóstica Ocupacional Integral (API CIE-11 OMS / NIH Clinical Tables & Decreto 1477 de 2014)
      </h3>
      <p style="color:#475569; font-size:0.9em; margin-bottom:12px;">
        Con base en la telemetría articular de las 3 fases de la inspección, se vinculan los hallazgos biomecánicos de cuerpo completo con los códigos diagnósticos estandarizados de la <strong>API Clínica CIE-11 (OMS) / ICD-10-CM</strong> y la Tabla de Enfermedades Laborales de Colombia (Decreto 1477 de 2014):
      </p>
      <div class="table-responsive" style="overflow-x:auto; width:100%; margin:14px 0; -webkit-overflow-scrolling:touch;">
        <table style="width:100%; min-width:800px; border-collapse:separate; border-spacing:0; border-radius:10px; overflow:hidden; border:1px solid #e2e8f0; font-size:0.85em;">
          <thead style="background:#0f766e; color:#ffffff;">
            <tr>
              <th style="padding:9px 10px; font-weight:700;">Segmento / Desviación Biomecánica</th>
              <th style="padding:9px 10px; font-weight:700;">Código CIE-11 (OMS)</th>
              <th style="padding:9px 10px; font-weight:700;">Código CIE-10 (Dec. 1477 / API)</th>
              <th style="padding:9px 10px; font-weight:700;">Diagnóstico Clínico Ocupacional</th>
              <th style="padding:9px 10px; font-weight:700;">Criterio de Vigilancia Epidemiológica (PVE)</th>
            </tr>
          </thead>
          <tbody>
            <tr style="background:#f0fdfa;">
              <td style="padding:8px 10px; font-weight:600; color:#0f766e;">Columna Cervical (Flexión > 20°-35°)</td>
              <td style="padding:8px 10px; font-family:monospace; font-weight:700; color:#0284c7;">FA80 / ME84.0</td>
              <td style="padding:8px 10px; font-family:monospace; font-weight:700; color:#0369a1;">M54.2 / M50</td>
              <td style="padding:8px 10px;">${icdCervicalLabel} / Trastorno de disco cervical ("Tech Neck")</td>
              <td style="padding:8px 10px;">Nivelar borde superior del monitor a la altura de los ojos y pausas de retracción/elongación cervical.</td>
            </tr>
            <tr>
              <td style="padding:8px 10px; font-weight:600; color:#0f766e;">Cintura Escapular y Hombros (Abducción > 45°)</td>
              <td style="padding:8px 10px; font-family:monospace; font-weight:700; color:#0284c7;">FB40.1</td>
              <td style="padding:8px 10px; font-family:monospace; font-weight:700; color:#0369a1;">M75.1 / M75.8</td>
              <td style="padding:8px 10px;">Síndrome de manguito rotador / Pinzamiento subacromial y deltoideo</td>
              <td style="padding:8px 10px;">Acercar periféricos a zona de alcance óptimo y regular apoyabrazos a 90°.</td>
            </tr>
            <tr style="background:#f0fdfa;">
              <td style="padding:8px 10px; font-weight:600; color:#0f766e;">Codo y Antebrazo (Flexión Rígida / Extensión)</td>
              <td style="padding:8px 10px; font-family:monospace; font-weight:700; color:#0284c7;">FB52.2</td>
              <td style="padding:8px 10px; font-family:monospace; font-weight:700; color:#0369a1;">M77.1 / M77.0</td>
              <td style="padding:8px 10px;">Epicondilitis lateral (codo de tenista) y epitrocleítis ocupacional</td>
              <td style="padding:8px 10px;">Evitar apoyo sobre bordes duros de escritorio y realizar elongación de extensores/tríceps.</td>
            </tr>
            <tr>
              <td style="padding:8px 10px; font-weight:600; color:#0f766e;">Muñeca, Carpo y Dedos (Tipeo / Desviación Ulnar)</td>
              <td style="padding:8px 10px; font-family:monospace; font-weight:700; color:#0284c7;">8C10.0 / FB40.3</td>
              <td style="padding:8px 10px; font-family:monospace; font-weight:700; color:#0369a1;">G56.0 / M65.4</td>
              <td style="padding:8px 10px;">${icdCarpalLabel} / Tenosinovitis estiloides radial (De Quervain)</td>
              <td style="padding:8px 10px;">Mouse vertical/ergonómico, alineación neutra de carpo y tracción neurodinámica cada 90 min.</td>
            </tr>
            <tr style="background:#f0fdfa;">
              <td style="padding:8px 10px; font-weight:600; color:#0f766e;">Columna Dorsal / Torácica (Cifosis Postural)</td>
              <td style="padding:8px 10px; font-family:monospace; font-weight:700; color:#0284c7;">ME84.1</td>
              <td style="padding:8px 10px; font-family:monospace; font-weight:700; color:#0369a1;">M54.6</td>
              <td style="padding:8px 10px;">Dorsalgia miofascial por antepulsión escapular sostenida</td>
              <td style="padding:8px 10px;">Apoyo dorsal completo en respaldo y ejercicios de apertura torácica e interescapular.</td>
            </tr>
            <tr>
              <td style="padding:8px 10px; font-weight:600; color:#0f766e;">Columna Lumbar, Pelvis y Ciático (Tronco > 20°)</td>
              <td style="padding:8px 10px; font-family:monospace; font-weight:700; color:#0284c7;">FA81 / ME84.3</td>
              <td style="padding:8px 10px; font-family:monospace; font-weight:700; color:#0369a1;">M54.5 / M54.3</td>
              <td style="padding:8px 10px;">${icdLumbarLabel} / ${icdSciaticaLabel}</td>
              <td style="padding:8px 10px;">Soporte lumbar regulable, descompresión axial en silla y elongación de músculo piriforme.</td>
            </tr>
            <tr style="background:#f0fdfa;">
              <td style="padding:8px 10px; font-weight:600; color:#0f766e;">Miembros Inferiores, Rodillas y Circulación</td>
              <td style="padding:8px 10px; font-family:monospace; font-weight:700; color:#0284c7;">BD53 / FA20</td>
              <td style="padding:8px 10px; font-family:monospace; font-weight:700; color:#0369a1;">I87.2 / M25.5</td>
              <td style="padding:8px 10px;">Insuficiencia venosa periférica funcional por estasis postural y gonalgia</td>
              <td style="padding:8px 10px;">Uso de reposapiés ergonómico, ángulo poplíteo libre a 90°-100° y activación de bomba sóleo-gemelar.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 style="color:#0f766e; font-size:1.25em; font-weight:700; border-bottom:1.5px solid #ccfbf1; padding-bottom:6px; margin-top:28px;">
        5.1 Programa Visual Completo de Pausas Activas y Rehabilitación (12 Ejercicios en Vivo desde ExerciseDB API)
      </h3>
      <p style="color:#475569; font-size:0.9em; margin-bottom:16px;">
        Batería terapéutica integral de <strong>12 ejercicios biomecánicos de cuerpo completo</strong> (Cuello, Hombros, Codos, Muñecas, Espalda Dorsal, Zona Lumbar, Cadera/Ciático y Retorno Venoso) obtenida desde <strong>ExerciseDB API (<code>oss.exercisedb.dev</code>)</strong> con animaciones GIF paso a paso:
      </p>
      
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(250px, 1fr)); gap:16px; margin:16px 0;">
        ${cardsHtml}
      </div>
    </div>
        `;
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

            // Fallback para Tenshi Voice: consultar TenshiMessage si dbContext sigue vacío
            if (!dbContext && (this.config?.mode === 'tenshi_voice' || !this.conversationId || this.conversationId === 'new')) {
                try {
                    const TenshiMessage = require('~/models/TenshiMessage');
                    const activeCompId = await resolveActiveCompanyId(this.userId);
                    const tenshiConvoId = await this.resolveTenshiConversationId(activeCompId);
                    const tenshiMsgs = await TenshiMessage.find({
                        user: this.userId,
                        ...(activeCompId ? { companyId: activeCompId } : {}),
                        conversationId: tenshiConvoId || null,
                    })
                        .sort({ createdAt: -1 })
                        .limit(20)
                        .lean();
                    if (tenshiMsgs && tenshiMsgs.length > 0) {
                        dbContext = tenshiMsgs.reverse().map(m => {
                            const role = m.role === 'user' ? 'User' : 'Tenshi (AI)';
                            return `${role}: ${m.content}`;
                        }).join('\n');
                        logger.info(`[VoiceSession] Fetched ${tenshiMsgs.length} TenshiMessages for report context.`);
                    }
                } catch (tenshiDbErr) {
                    logger.error('[VoiceSession] Error fetching TenshiMessage context for report:', tenshiDbErr);
                }
            }

            // Fallback a conversationTurns o contexto sintético derivado de evidencias
            let finalContext = dbContext || (this.conversationTurns && this.conversationTurns.length > 0 ? this.conversationTurns.join('\n') : '') || conversationContext;

            // Si hay evidencias visuales capturadas (fases o fotos manuales) o modo biomecánico, asegurar contexto sólido para nunca abortar
            const hasPhases = this.phaseEvidences && Object.keys(this.phaseEvidences).length > 0;
            const hasManual = this.manualEvidences && this.manualEvidences.length > 0;
            if ((!finalContext || finalContext.length < 10) && (hasPhases || hasManual || this.isBiomechanics)) {
                finalContext = `Evaluación ergonómica y biomecánica en vivo realizada con la Fisioterapeuta Laboral en Tenshi. Se cuenta con registro fotográfico directo de ${hasPhases ? Object.keys(this.phaseEvidences).length : (hasManual ? this.manualEvidences.length : 1)} fase(s) posturales con telemetría articular MediaPipe para la emisión pericial del Informe Técnico de Estudio de Puesto de Trabajo (EPT).`;
            }

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

            // Wait 550ms so any client-side final phase snapshot (e.g. Phase 3 auto/manual capture) arrives via WebSocket
            await new Promise((resolve) => setTimeout(resolve, 550));

            // Use Gemini 3.7 Flash as the primary model for reports (with fallback scale down to 3.6, 3.5, 3.5-lite)
            const reportModelName = SGSST_FALLBACK_MODELS[0];
            logger.info(`[VoiceSession] Report model (with key+model rotation): ${reportModelName}`);

            const currentDate = new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

            // Determine active inspection protocol and comparative matrix instructions
            const activeProtocol = this.agentProtocol || resolveInspectionProtocol(this.agentObj?.name || this.config?.template);
            const isErgonomicContext = activeProtocol.id === 'biomecanico' ||
                this.isBiomechanics ||
                (this.phaseEvidences && Object.keys(this.phaseEvidences).length > 0) ||
                activeProtocol.id === 'auditoria';

            let templateInstructions = "";

            if (activeProtocol.id === 'biomecanico' || this.isBiomechanics) {
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
2. Analiza las imágenes de evidencia capturadas citando explícitamente a qué fase corresponden y contrastando la evolución de la postura desde la fase habitual hasta la postura crítica y la fatiga.
3. CODIFICACIÓN CLÍNICA OFICIAL (CIE-11 OMS Y DECRETO 1477 DE 2014):
Para cada desviación o sobreesfuerzo angular detectado en la telemetría multifase (ej. Flexión Cervical > 20° o > 35°, Inclinación de Tronco > 20°, Abducción de Hombros > 45°, Codos fuera de 90°-100°), debes correlacionar explícitamente en la Matriz de Peligros (columna Efectos Posibles):
- Código CIE-11 (OMS): e.g., FA80 (Cervicalgia / Síndrome miofascial cervical), FA81 (Lumbalgia / Trastornos discales lumbares), FB40.1 (Tendinopatía de manguito rotador / Pinzamiento subacromial), 8C10.0 (Síndrome del túnel carpiano), FB52.2 (Epicondilitis lateral).
- Código CIE-10 (Tabla de Enfermedades Laborales Colombia Dec. 1477/2014): e.g., M50, M54.2, M54.5, M75.1, G56.0, M77.1.
4. PROGRAMA DE REHABILITACIÓN Y PAUSAS ACTIVAS BIOMECÁNICAS (CRITERIOS EXERCISEDB):
En la Sección 5 y 6 del informe (Medidas de Intervención y Plan de Acción), debes incorporar OBLIGATORIAMENTE una subsección técnica formal titulada:
"<h4>Prescripción Biomecánica de Pausas Activas y Rehabilitación Postural (Criterios Clínicos ExerciseDB)</h4>"
con una tabla HTML limpia y estilizada que incluya:
- Región Anatómica en Riesgo (Cervical, Lumbar, Cintura Escapular, Muñeca/Antebrazo).
- Ejercicio Terapéutico Específico (e.g. "Retracción Cervical y Extensión Dorsal", "Estiramiento Activo de Trapecio Superior y Escalenos", "Apertura Escapular con Rotación Externa", "Deslizamiento Neural del Nervio Mediano").
- Músculos Diana / Biomecánica Aliviada (e.g. Trapecio Superior, ECOM, Pectoral Menor, Extensores de Muñeca).
- Dosificación Clínica Prescrita (Series, Repeticiones/Tiempo sostenido, Frecuencia: e.g., "2 series de 15 segundos cada 90 minutos de labor continua").
- Técnica de Ejecución Ergonómica y Recomendaciones de Autocuidado.`;
            } else {
                const defaultPhases = ['Fase 1: Panorama General y Metodología 5S', 'Fase 2: Fuentes de Peligro y Actos Inseguros', 'Fase 3: Protecciones Colectivas y Uso de EPP'];
                const phasesText = (activeProtocol?.phases && Array.isArray(activeProtocol.phases) && activeProtocol.phases.length > 0)
                    ? activeProtocol.phases.join(', ')
                    : defaultPhases.join(', ');
                const matrixHeader = activeProtocol?.reportMatrixHeader || INSPECTION_PROTOCOLS.auditoria_gtc45.reportMatrixHeader;

                templateInstructions = `ENFOQUE DE AUDITORÍA: ${activeProtocol?.title || 'Inspección de Seguridad y Condiciones Locativas SST'} aplicando ${activeProtocol?.methodLabel || 'GTC 45 / ISO 45001 / 5S'} (${activeProtocol?.normRef || 'GTC 45 / Dec. 1072/2015 / Res. 0312'}).
La inspección en vivo se estructuró y documentó a través de un PROTOCOLO MULTIFASE sistemático:
- Fases evaluadas: ${phasesText}.
- Perspectiva de Captura: Documenta si la verificación se ejecutó como auto-inspección autónoma o como inspección asistida con dispositivo móvil.

REQUERIMIENTO ADICIONAL OBLIGATORIO:
1. Debes incluir OBLIGATORIAMENTE la sección comparativa multifase inmediatamente después de la tabla de Matriz de Riesgos (antes de la sección 5):
${matrixHeader}
2. Analiza las imágenes de evidencia fotográfica capturadas citando explícitamente a qué fase corresponden y contrastando los hallazgos técnicos entre cada etapa de la inspección.
3. CODIFICACIÓN CLÍNICA OFICIAL (CIE-11 OMS Y DECRETO 1477 DE 2014):
En la fila obligatoria de Riesgo Biomecánico de la Matriz de Peligros, correlaciona las lesiones musculoesqueléticas con sus códigos oficiales CIE-11 (FA80 Cervicalgia, FA81 Lumbalgia, FB40.1 Manguito rotador, 8C10.0 Túnel carpiano) y CIE-10 (M54.2, M54.5, M75.1, G56.0).
4. PLAN DE PAUSAS ACTIVAS BIOMECÁNICAS (EXERCISEDB):
En la Sección 5 incorpora medidas específicas de pausas activas terapéuticas según criterios ExerciseDB para cuello, espalda y extremidades superiores.`;
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
                    : (this.cachedCameraEvidences && this.cachedCameraEvidences.length > 0)
                        ? this.cachedCameraEvidences
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
                if (this.config.companyId && mongoose.isValidObjectId(this.config.companyId)) {
                    companyInfo = await CompanyInfo.findOne({ _id: this.config.companyId, user: this.userId }).lean();
                }
                if (!companyInfo) {
                    companyInfo = await CompanyInfo.findOne({ user: this.userId, isActive: true }).lean();
                }
                if (!companyInfo) {
                    companyInfo = await CompanyInfo.findOne({ user: this.userId }).lean();
                }
                let matchedWorker = null;

                if (mongoose.models.PerfilSociodemograficoData) {
                    const profileData = await mongoose.models.PerfilSociodemograficoData.findOne({
                        user: this.userId,
                        ...(companyInfo?._id ? { companyId: companyInfo._id } : {}),
                    }).lean();
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
                const defaultPhases = ['Fase 1: Panorama General y 5S', 'Fase 2: Fuentes de Peligro', 'Fase 3: Protecciones y EPP'];
                const phaseLabels = (activeProtocol?.phases && Array.isArray(activeProtocol.phases) && activeProtocol.phases.length > 0)
                    ? activeProtocol.phases.map(p => typeof p === 'string' ? p : (p.name || p.shortName))
                    : defaultPhases;
                const sectionTitle = `1. Evidencia Fotográfica y Documental Multifase (${activeProtocol?.title || 'Inspección de Seguridad SST'})`;

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

            // INYECCIÓN VISUAL GARANTIZADA: Tarjetas ExerciseDB con GIFs reales de la API y Matriz CIE-11 / Dec. 1477
            // Condicionado estrictamente a Biomecánica / Fisioterapeuta para no inflar informes generales de SST a 270KB innecesariamente
            const isBiomechanicReport = Boolean(this.isBiomechanics || this.isFisioMode || activeProtocol?.id === 'biomecanico');
            if (isBiomechanicReport && !reportHtml.includes('static.exercisedb.dev') && !reportHtml.includes('clinical-biomechanics-prescription')) {
                const prescriptionBlock = await this.buildBiomechanicsPrescriptionBlock();
                if (reportHtml.includes('<h3>6.')) {
                    reportHtml = reportHtml.replace('<h3>6.', `${prescriptionBlock}\n<h3>6.`);
                } else if (reportHtml.includes('<h3>7.')) {
                    reportHtml = reportHtml.replace('<h3>7.', `${prescriptionBlock}\n<h3>7.`);
                } else if (reportHtml.includes('<h3>8.')) {
                    reportHtml = reportHtml.replace('<h3>8.', `${prescriptionBlock}\n<h3>8.`);
                } else if (reportHtml.includes('<h3>5.')) {
                    reportHtml = reportHtml.replace('<h3>5.', `<h3>5.\n${prescriptionBlock}`);
                } else {
                    reportHtml += `\n${prescriptionBlock}`;
                }
            }

            const finalWrappedHtml = `<div class="report-container" style="font-family:'Segoe UI',Arial,sans-serif; max-width:900px; width:100%; box-sizing:border-box; overflow-x:hidden; margin:0 auto; color:#111827;">
${kpiDiv}
<style>
@media (max-width: 640px) { .report-container { padding: 0 4px !important; } }
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

                        // Handle images - base64 images replaced with placeholder, URL images or relative /images/ to markdown
                        md = md.replace(/<img[^>]*src="data:[^"]*"[^>]*alt="([^"]*)"[^>]*>/gi, '\n\n📷 **[$1]** *(imagen disponible en el informe original)*\n\n');
                        md = md.replace(/<img[^>]*src="data:[^"]*"[^>]*>/gi, '\n\n📷 **[Imagen captada]** *(ver en informe original)*\n\n');
                        // Normal URL images or local /images/ paths convert to markdown
                        md = md.replace(/<img[^>]*src="((?:https?:\/\/|\/)[^"]*)"[^>]*alt="([^"]*)"[^>]*>/gi, '![$2]($1)');
                        md = md.replace(/<img[^>]*src="((?:https?:\/\/|\/)[^"]*)"[^>]*>/gi, '![image]($1)');

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

                    this.lastGeneratedReportHtml = reportHtml;

                    const cleanMarkdown = convertHtmlToMarkdown(reportHtml);
                    const reportTitle = this.isBiomechanics 
                        ? 'Informe Técnico de Ergonomía y Biomecánica' 
                        : (this.currentInspectionSubject ? `Informe Técnico de ${this.currentInspectionSubject}` : 'Informe Técnico de Evaluación de Riesgos y Peligros');

                    const chatMessageText = `${cleanMarkdown}\n\n:::canvas{title="${reportTitle}" fileType="text" identifier="informe-ergonomico-${radicadoId}"}\n${reportHtml}\n:::\n`;

                    // REGLA CRÍTICA: SIEMPRE abrir y crear una conversación NUEVA dedicada para informes y estudios ergonómicos
                    const targetConversationId = uuidv4();
                    this.conversationId = targetConversationId;
                    const targetAgentId = this.isFisioMode ? (this.fisioAgent?.id || 'fisioterapeuta_laboral') : (this.agentObj?.id || 'tenshi');
                    const reportSender = this.isFisioMode ? (this.fisioAgent?.name || 'Fisioterapeuta Laboral') : (this.agentObj?.name || (this.isBiomechanics ? 'Fisioterapeuta Laboral' : 'Tenshi'));
                    const reportIconURL = this.isFisioMode ? (this.fisioAgent?.avatar?.filepath || this.fisioAgent?.avatar?.url) : (this.agentObj?.avatar?.filepath || this.agentObj?.avatar?.url || undefined);
                    const reportMessage = {
                        messageId,
                        conversationId: targetConversationId,
                        parentMessageId: null,
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

                    try {
                        const workerName = (this.extractedWorkerMeta && this.extractedWorkerMeta.workerName) || this.user?.name || 'Colaborador';
                        const convoTitle = this.isBiomechanics ? `Estudio Ergonómico — ${workerName}` : `${reportTitle} — ${workerName}`;
                        await saveConvo({ user: { id: this.userId } }, {
                            conversationId: targetConversationId,
                            endpoint: 'agents',
                            agent_id: targetAgentId,
                            title: convoTitle,
                            model: this.dbModel,
                            tags: this.isBiomechanics ? ['tenshi-report', 'estudio-ergonomico', 'sgsst-live-analysis'] : ['tenshi-report', 'inspeccion-sst', 'sgsst-live-analysis']
                        }, { context: 'VoiceSession - NewReportConvo' });

                        await saveMessage({ user: { id: this.userId } }, reportMessage, { context: 'VoiceSession - Report' });
                        if (this.isFisioMode) {
                            this.fisioLastMessageId = messageId;
                        } else {
                            this.lastMessageId = messageId;
                        }
                        logger.info(`[VoiceSession] Brand new report conversation created: "${targetConversationId}" with sender "${reportSender}". MessageId: ${messageId}`);
                    } catch (saveMsgErr) {
                        logger.warn('[VoiceSession] Could not save new report message in convo:', saveMsgErr.message);
                    }

                    // Get the frames evaluated immediately (available for all subsequent syncs)
                    const evalFrames = (framesToUse && framesToUse.length > 0)
                        ? [...framesToUse.slice(0, 3)]
                        : (this.manualEvidences && this.manualEvidences.length > 0)
                            ? [...this.manualEvidences]
                            : (this.frameBuffer && this.frameBuffer.length > 0)
                                ? [...this.frameBuffer]
                                : this.latestFrame
                                    ? [this.latestFrame]
                                    : [];

                    // Cache evaluated frames and phase evidences for fallback
                    if (evalFrames && evalFrames.length > 0) {
                        this.lastEvaluatedFrames = [...evalFrames];
                    }
                    if (this.phaseEvidences && Object.keys(this.phaseEvidences).length > 0) {
                        this.lastPhaseEvidences = { ...this.phaseEvidences };
                    }

                    const savedPhaseEvidences = { ...this.lastPhaseEvidences };
                    this.manualEvidences = [];
                    this.phaseEvidences = {};
                    this.reportGenerated = true;

                    // 1. CRITICAL: NOTIFY CLIENT IMMEDIATELY so UI unfreezes without waiting for secondary syncs!
                    this.sendToClient({
                        type: 'report',
                        data: {
                            html: reportHtml,
                            messageId: messageId,
                            conversationId: targetConversationId,
                            evaluatedFrames: evalFrames
                        }
                    });

                    this.sendToClient({
                        type: 'conversationUpdated',
                        data: { conversationId: targetConversationId, isNewReport: true }
                    });

                    // 2. INSTRUCT GEMINI LIVE TO ANNOUNCE REPORT COMPLETION
                    if (this.geminiClient && this.isActive) {
                        logger.info('[VoiceSession] Instructing Gemini Live to announce report...');
                        try {
                            const reportTypeLabel = this.isBiomechanics ? 'ergonómico oficial' : 'técnico oficial de inspección';
                            this.geminiClient.sendText(`INSTRUCCIÓN: El informe ${reportTypeLabel} acaba de ser generado y ya está cargado en el editor de la pantalla del usuario. Avisa al usuario verbalmente en 1 sola frase breve y entusiasta: "Listo, tu informe técnico ha sido generado con éxito y ya está disponible en tu pantalla y en el chat para consultarlo o descargarlo." PROHIBIDO LEER O INVENTAR EL CONTENIDO DEL INFORME.`);
                        } catch (announceErr) {
                            logger.warn('[VoiceSession] Could not send report announcement to Gemini:', announceErr.message);
                        }
                    }

                    // Save conversation state so LibreChat updates the conversation list and timestamps
                    if (targetConversationId && targetConversationId !== 'new') {
                        try {
                            const workerName = (this.extractedWorkerMeta && this.extractedWorkerMeta.workerName) || this.user?.name || 'Colaborador';
                            const convoTitle = this.isBiomechanics ? `Estudio Ergonómico — ${workerName}` : reportTitle;
                            await saveConvo({ user: { id: this.userId } }, {
                                conversationId: targetConversationId,
                                endpoint: 'agents',
                                agent_id: targetAgentId,
                                title: convoTitle,
                                model: this.dbModel,
                                tags: this.isBiomechanics ? ['sgsst-live-analysis', 'fisioterapeuta-laboral'] : ['sgsst-live-analysis']
                            }, { context: 'VoiceSession - Report' });
                        } catch (convoSaveError) {
                            logger.warn('[VoiceSession] Error updating conversation for report:', convoSaveError.message);
                        }
                    }

                    // Sync to LiveEditorSession & Canvas
                    try {
                        const LiveEditorSession = require('~/models/LiveEditorSession');
                        const CompanyInfo = require('~/models/CompanyInfo');
                        const { syncLiveEditorToCanvas } = require('../sgsst/syncBridge');
                        const { getActiveCompanyId } = require('../sgsst/contextHelper');

                        const companyId = this.config.companyId || (await getActiveCompanyId(this.userId));

                        const reportTitleSync = `Informe de Inspección - ${this.isBiomechanics ? 'BIOMECÁNICA (RULA/REBA)' : 'SST'}`;
                        const targetConvoId = this.conversationId || `tenshi-${this.userId}`;

                        if (companyId) {
                            await LiveEditorSession.findOneAndUpdate(
                                { conversationId: targetConvoId, companyId },
                                {
                                    $set: {
                                        content: reportHtml,
                                        contentUpdatedAt: new Date(),
                                        companyId,
                                        fileName: reportTitleSync,
                                    },
                                    $setOnInsert: { user: this.userId },
                                },
                                { upsert: true, new: true }
                            );
                        }

                        await syncLiveEditorToCanvas(targetConvoId, reportHtml, reportTitleSync, this.userId);
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

                                const telemArray = Array.isArray(savedPhaseEvidences)
                                    ? savedPhaseEvidences.map(p => p?.telemetry).filter(Boolean)
                                    : Object.values(savedPhaseEvidences || {}).map(p => p?.telemetry).filter(Boolean);

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
                                    telemetry: telemArray.length > 0 ? telemArray : {},
                                    evidences: (evalFrames || []).slice(0, 3).map((f, idx) => ({
                                        phase: idx + 1,
                                        label: `Fase ${idx + 1}`,
                                        url: typeof f === 'string' && f.startsWith('data:') ? f : `data:image/jpeg;base64,${f}`,
                                        telemetry: (savedPhaseEvidences && (savedPhaseEvidences[idx]?.telemetry || Object.values(savedPhaseEvidences)[idx]?.telemetry)) || {},
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

                    // Respaldo simultáneo en los DOS TENSHIS (widget flotante y agente en barra lateral)
                    if (this.userId && reportHtml && reportHtml.length > 50) {
                        const workerNameForTenshi = (this.extractedWorkerMeta && this.extractedWorkerMeta.workerName) || this.user?.name || 'Colaborador';
                        const tenshiReportTitle = this.isBiomechanics
                            ? `Informe de Estudio de Puesto de Trabajo Ergonómico — ${workerNameForTenshi}`
                            : (this.currentInspectionSubject ? `Informe Técnico de ${this.currentInspectionSubject} — ${workerNameForTenshi}` : `Informe Técnico Oficial de Inspección SST — ${workerNameForTenshi}`);
                        const tenshiReportDesc = this.isBiomechanics
                            ? `🩺 **${tenshiReportTitle}**\n\nHe registrado el informe oficial de tu **Estudio de Puesto de Trabajo Ergonómico en Vivo** realizado con la Fisioterapeuta Laboral (con las 3 fases posturales, telemetría MediaPipe 3D, matriz diagnóstica CIE-11 y 12 ejercicios de pausas activas ExerciseDB). Puedes **verlo en pantalla** o **descargarlo** directamente desde aquí:`
                            : `📋 **${tenshiReportTitle}**\n\nHe registrado el informe técnico oficial de la **Inspección Visual de Campo** con las evidencias fotográficas capturadas y la matriz de evaluación técnica de riesgos. Puedes **verlo en pantalla** o **descargarlo** directamente desde aquí:`;

                        // 1. Respaldo en Tenshi en su chat (Widget Flotante / TenshiMessage)
                        try {
                            const TenshiMessage = require('~/models/TenshiMessage');
                            const activeCompId = await resolveActiveCompanyId(this.userId);
                            const tenshiConvoId = await this.resolveTenshiConversationId(activeCompId);
                            await TenshiMessage.create({
                                user: this.userId,
                                companyId: activeCompId,
                                conversationId: tenshiConvoId || null,
                                role: 'assistant',
                                content: tenshiReportDesc,
                                htmlReport: reportHtml,
                                file: {
                                    title: tenshiReportTitle,
                                    fileType: 'html',
                                    content: reportHtml,
                                    canvasId: `tenshi-report-${Date.now()}`,
                                },
                            });
                            logger.info(`[VoiceSession] Report also persisted in TenshiMessage for user: ${this.userId}`);
                        } catch (tenshiSaveErr) {
                            logger.warn('[VoiceSession] Could not persist report in TenshiMessage:', tenshiSaveErr.message);
                        }

                        // 2. Respaldo en CanvasSession para la nueva conversación dedicada
                        try {
                            const CanvasSession = require('~/models/CanvasSession');
                            const convoId = targetConversationId;

                            await CanvasSession.findOneAndUpdate(
                                { conversationId: convoId },
                                {
                                    $set: {
                                        user: String(this.userId),
                                        title: tenshiReportTitle,
                                        fileType: 'html',
                                        content: reportHtml,
                                        updatedAt: new Date(),
                                    },
                                    $setOnInsert: {
                                        createdAt: new Date(),
                                        version: 1,
                                    }
                                },
                                { upsert: true, new: true }
                            );

                            logger.info(`[VoiceSession] Report successfully backed up in Agent Tenshi chat (conversationId: ${convoId})`);
                        } catch (agentTenshiSyncErr) {
                            logger.warn('[VoiceSession] Could not persist report in Agent Tenshi conversation:', agentTenshiSyncErr.message);
                        }
                    }

                } catch (saveError) {
                    logger.error('[VoiceSession] Error saving report to DB:', saveError);
                    // Continue anyway, client already received report
                }

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
    schedulePendingHangup(delayMs = 800, reason = 'hangup', actionId = null) {
        if (!this.pendingHangupAfterTurn) return;
        if (this.pendingHangupTimer) {
            clearTimeout(this.pendingHangupTimer);
            this.pendingHangupTimer = null;
        }
        const safeDelay = Math.max(250, Number(delayMs) || 800);
        this.pendingHangupTimer = setTimeout(() => {
            this.pendingHangupTimer = null;
            if (!this.pendingHangupAfterTurn) return;
            this.pendingHangupAfterTurn = false;
            this.hangupFarewellAlreadySpoken = false;
            logger.info(`[VoiceSession] Despachando colgar_llamada (${reason}).`);
            this.sendToClient({
                type: 'wappy_action',
                data: {
                    id: actionId || `hangup-${reason}-${Date.now()}`,
                    name: 'wappy_controlar_videollamada',
                    args: { accion: 'colgar_llamada' }
                }
            });
        }, safeDelay);
    }

    handleTenshiVoiceFailsafe(currentUserText = '', currentAiText = '', toolCalledOverride = null) {
        if (this.config.mode !== 'tenshi_voice') return;

        // Si ya se programó un cierre de llamada tras el toolCall de despedida, asegurar drenaje corto tras concluir el turno
        if (this.pendingHangupAfterTurn) {
            this.schedulePendingHangup(500, 'failsafe_turn_complete');
            return;
        }

        const effectiveToolCalled = toolCalledOverride !== null ? Boolean(toolCalledOverride) : Boolean(this.toolCalledThisTurn);
        if (effectiveToolCalled) {
            logger.debug('[VoiceSession] [Tenshi Voice Failsafe] Tool was properly called by Gemini. No failsafe needed.');
            return;
        }

        const userText = sanitizeAccumulatedTranscription(currentUserText || '').trim();
        if (!userText || userText.includes('[SISTEMA INTERNO WAPPY')) return;
        const userLower = userText.toLowerCase();

        // 0.1. Failsafe prioritario para videollamada y despedida/colgar por voz (evaluado ANTES del filtro conversacional corto)
        const isPauseWord = /^(para|p[aá]rate|detente|espera|esp[eé]rate|un\s+momento|momento|silencio|c[aá]llate|basta|ya|no\s+sigas|para\s+ah[ií]|aguanta|alto|pausa)[.!?,]*$/i.test(userLower.trim());
        const isBareNegativeOrAck = /^(?:no+|nada|ninguno|ninguna|no\s*,?\s*nada|no\s*,?\s*gracias|nada\s+m[aá]s|ok+|oki+|dale|listo|bien|bueno|aj[aá]|mm+|eh+|ah+|gracias|muchas\s+gracias)[.!?,]*$/i.test(userLower.trim());

        const isActivarVideo = /\b(activa|activar|enciende|encender|inicia|iniciar|pon|poner|prende|prender|abre|abrir)\s+(la\s+)?(videollamada|c[aá]mara|video|visi[oó]n)\b/i.test(userLower) ||
            /\b(videollamada|activa\s+c[aá]mara|activa\s+video)\b/i.test(userLower);

        const isApagarVideo = /\b(apaga|apagar|desactiva|desactivar|quita|quitar|cierra|cerrar)\s+(la\s+)?(c[aá]mara|video|videollamada)\b/i.test(userLower);

        const isColgarLlamada = !isPauseWord && !isBareNegativeOrAck && (
            /\b(cuelga|colgar|termina|terminar|finaliza|finalizar|corta|cortar|desconecta|desconectar)\s+(la\s+)?(llamada|comunicaci[oó]n|sesi[oó]n|conversaci[oó]n)\b/i.test(userLower) ||
            /\b(apaga(r)?\s+tenshi|hasta\s+(luego|pronto|ma[ñn]ana|la\s+pr[oó]xima)|nos\s+vemos|(muchas\s+)?gracias\s+por\s+todo|eso\s+(es|era|fue)\s+todo(\s+por\s+hoy|\s*,?\s*gracias)?|nada\s+m[aá]s\s+por\s+(hoy|ahora))\b/i.test(userLower) ||
            /^(cuelga|colgar|terminar\s+llamada|finalizar\s+llamada|adi[oó]s(\s+tenshi)?|chao(\s+tenshi)?|chau(\s+tenshi)?|bye(\s+tenshi)?|hasta\s+luego(\s+tenshi)?|nos\s+vemos(\s+tenshi)?|(muchas\s+)?gracias\s+por\s+todo(\s+tenshi)?|feliz\s+(noche|tarde|d[ií]a)\s*(,?\s*(tenshi|hasta\s+luego|gracias|chao|adi[oó]s))?|buenas\s+noches\s*(,?\s*(tenshi|hasta\s+luego|gracias|descansa))?)[.!?,]*$/i.test(userLower.trim())
        );

        if (isActivarVideo) {
            logger.info(`[VoiceSession] [Tenshi Voice Failsafe] Activando videollamada por voz: "${userText}"`);
            this.sendToClient({
                type: 'wappy_action',
                data: {
                    id: `failsafe-video-${Date.now()}`,
                    name: 'wappy_controlar_videollamada',
                    args: { accion: 'activar_camara' }
                }
            });
            return;
        } else if (isApagarVideo) {
            logger.info(`[VoiceSession] [Tenshi Voice Failsafe] Apagando cámara por voz: "${userText}"`);
            this.sendToClient({
                type: 'wappy_action',
                data: {
                    id: `failsafe-video-${Date.now()}`,
                    name: 'wappy_controlar_videollamada',
                    args: { accion: 'apagar_camara' }
                }
            });
            return;
        } else if (isColgarLlamada) {
            logger.info(`[VoiceSession] [Tenshi Voice Failsafe] Despedida / Colgando llamada por voz: "${userText}"`);
            this.pendingHangupAfterTurn = true;
            this.schedulePendingHangup(650, 'failsafe_hangup');
            return;
        }

        // 0. Filtro estricto de frases conversacionales cortas: NUNCA disparan delegación de agentes
        const isConversationalCheck = /^(¿?\s*(me\s+escuchas?|me\s+o[yi]es?|est[aá]s\s+ah[ií]|qu[eé]\s+dijo|qu[eé]\s+respondi[oó]|ya\s+respondi[oó]|hola|buenas|gracias|ok|listo|entendido)\s*\??)$/i.test(userLower);
        if (isConversationalCheck) {
            logger.debug(`[VoiceSession] [Tenshi Voice Failsafe] Ignorando frase puramente conversacional: "${userLower}"`);
            return;
        }

        // 0.2. Failsafe para consulta de agenda personal / Google Calendar (prioridad absoluta)
        const isAgendaQuery = /\b(qu[eé]\s+tengo\s+(hoy|mañana|en\s+mi\s+agenda|programado|para\s+hoy|para\s+mañana)|revisa\s+mi\s+agenda|mis\s+reuniones|mis\s+citas|c[oó]mo\s+est[aá]\s+mi\s+d[ií]a|agenda\s+de\s+(hoy|mañana))\b/i.test(userLower);
        if (isAgendaQuery) {
            logger.info(`[VoiceSession] [Tenshi Voice Failsafe] Gemini omitió toolCall de agenda. Disparando google_calendar para: "${userText}"`);
            this.sendToClient({
                type: 'status',
                data: { status: 'loading', message: 'Consultando tu agenda en Google Calendar...' }
            });
            try {
                const GoogleCalendar = require('~/app/clients/tools/structured/GoogleCalendar');
                const toolInstance = new GoogleCalendar({ req: { user: { id: this.userId } } });
                toolInstance._call({ action: 'list_events' })
                    .then(events => {
                        const outputStr = typeof events === 'string' ? events : JSON.stringify(events);
                        this.sendToClient({
                            type: 'wappy_action',
                            data: {
                                id: `failsafe-cal-${Date.now()}`,
                                name: 'google_calendar',
                                args: { action: 'list_events' },
                                result: outputStr
                            }
                        });
                    })
                    .catch(err => {
                        logger.warn('[VoiceSession] [Tenshi Voice Failsafe] Error en failsafe google_calendar:', err.message);
                    });
            } catch (errCal) {
                logger.warn('[VoiceSession] [Tenshi Voice Failsafe] Error instanciando google_calendar:', errCal.message);
            }
            return;
        }

        // 0.3. Failsafe para lectura de pantalla ante preguntas de lo que hay visible
        const isReadScreenQuery = /\b(qu[eé]\s+(ves|dice|hay\s+en\s+(la\s+)?pantalla)|l[eé]eme\s+(la\s+)?pantalla|expl[ií]came\s+lo\s+que\s+hay|qu[eé]\s+es\s+esto)\b/i.test(userLower);
        if (isReadScreenQuery) {
            logger.info(`[VoiceSession] [Tenshi Voice Failsafe] Detección de lectura de pantalla. Disparando leer_pantalla...`);
            this.sendToClient({
                type: 'wappy_action',
                data: {
                    id: `failsafe-readscreen-${Date.now()}`,
                    name: 'leer_pantalla',
                    args: { accion: 'leer' }
                }
            });
            return;
        }

        // 0.4. Failsafe prioritario para abrir cursos de la Academia WAPPY LMS (/training/:id/:slug)
        const isAbrirCursoQuery = /\b(abre|abrir|[aá]breme|mu[eé]strame|ver|entrar\s+al|quiero\s+ver)\s+(el\s+)?(curso|tutorial|capacitaci[oó]n)?\s*(de|del)?\s*([a-z0-9ñáéíóú\s\-]+)/i.test(userLower) &&
            !/\b(c[aá]mara|video|videollamada|m[oó]dulo|hito|agenda|calendario|pantalla)\b/i.test(userLower);
        if (isAbrirCursoQuery) {
            const courseTermMatch = userLower.match(/(?:abre|abrir|[aá]breme|mu[eé]strame|ver|entrar\s+al|quiero\s+ver)\s+(?:el\s+)?(?:curso|tutorial|capacitaci[oó]n)?\s*(?:de|del)?\s*([a-z0-9ñáéíóú\s\-]+)/i);
            const rawTerm = courseTermMatch ? courseTermMatch[1].trim() : userText;
            logger.info(`[VoiceSession] [Tenshi Voice Failsafe] Gemini omitió wappy_abrir_curso. Buscando curso para: "${rawTerm}"`);
            findMatchingCourse(rawTerm).then(course => {
                let targetRoute = '/academia?tab=cursos';
                if (course) {
                    const slug = sanitizeSlug(course.title);
                    targetRoute = `/training/${course._id}/${slug}`;
                    logger.info(`[VoiceSession] [Tenshi Voice Failsafe] Curso encontrado: "${course.title}". Navegando a: ${targetRoute}`);
                }
                this.sendToClient({
                    type: 'wappy_action',
                    data: {
                        id: `failsafe-course-${Date.now()}`,
                        name: 'wappy_navegar',
                        args: { ruta: targetRoute, modulo: 'training' }
                    }
                });
            }).catch(cErr => {
                logger.warn('[VoiceSession] [Tenshi Voice Failsafe] Error buscando curso:', cErr.message);
            });
            return;
        }

        // 0.45. Failsafe prioritario para abrir artículo de Blog (/blog/:id/:slug)
        const isAbrirBlogQuery = /\b(abre|abrir|[aá]breme|mu[eé]strame|leer|quiero\s+leer)\s+(el\s+)?(art[ií]culo|blog|post)\s*(de|del)?\s*([a-z0-9ñáéíóú\s\-]+)/i.test(userLower);
        if (isAbrirBlogQuery) {
            const blogTermMatch = userLower.match(/(?:abre|abrir|[aá]breme|mu[eé]strame|leer|quiero\s+leer)\s+(?:el\s+)?(?:art[ií]culo|blog|post)\s*(?:de|del)?\s*([a-z0-9ñáéíóú\s\-]+)/i);
            const rawBlogTerm = blogTermMatch ? blogTermMatch[1].trim() : userText;
            logger.info(`[VoiceSession] [Tenshi Voice Failsafe] Gemini omitió wappy_abrir_articulo_blog. Buscando blog para: "${rawBlogTerm}"`);
            findMatchingBlogPost(rawBlogTerm).then(post => {
                let targetRoute = '/academia?tab=blog';
                if (post) {
                    const slug = sanitizeSlug(post.title);
                    targetRoute = `/blog/${post._id}/${slug}`;
                    logger.info(`[VoiceSession] [Tenshi Voice Failsafe] Artículo encontrado: "${post.title}". Navegando a: ${targetRoute}`);
                }
                this.sendToClient({
                    type: 'wappy_action',
                    data: {
                        id: `failsafe-blog-${Date.now()}`,
                        name: 'wappy_navegar',
                        args: { ruta: targetRoute, modulo: 'blog' }
                    }
                });
            }).catch(bErr => {
                logger.warn('[VoiceSession] [Tenshi Voice Failsafe] Error buscando blog:', bErr.message);
            });
            return;
        }

        // 0.5. Failsafe prioritario para iniciar Estudio de Puesto de Trabajo Ergonómico en Vivo con la Fisioterapeuta
        const liveEptMatch =
            /\b(estudio\s+de\s+puesto|evaluaci[oó]n\s+ergon[oó]mica|an[aá]lisis\s+ergon[oó]mico|an[aá]lisis\s+biomec[aá]nico|estudio\s+ergon[oó]mico|inspecci[oó]n\s+ergon[oó]mica|puesto\s+de\s+trabajo\s+ergon[oó]mico)/i.test(userLower) &&
            /\b(necesito|quiero|deseo|hacer|realizar|iniciar|empezar|hazme|hagamos|ll[eé]vame|abrir|abre|en\s+vivo|con\s+la\s+fisio)/i.test(userLower);
        if (liveEptMatch) {
            logger.info(`[VoiceSession] [Tenshi Voice Failsafe] Disparando wappy_iniciar_estudio_ergonomico_vivo para: "${userText}"`);
            this.enableFisioterapeutaMode('failsafe_live_ept').catch((err) => logger.warn('[VoiceSession] Error in failsafe enableFisioterapeutaMode:', err.message));
            this.sendToClient({
                type: 'wappy_action',
                data: {
                    id: `failsafe-live-ept-${Date.now()}`,
                    name: 'wappy_iniciar_estudio_ergonomico_vivo',
                    args: {}
                }
            });
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

        // 2. Failsafe para clics en 'Generar IA' / 'Generar Análisis' / informe del aplicativo si Gemini omitió el tool call
        // SOLO cuando el usuario está dentro de un formulario /sgsst (NUNCA en Modo Hero ni /c/new ni si pide entregable Canvas/HTML/Word/Excel)
        const isOnSgsstAppNow = !this.isHeroMode && String(this.activeScreenRoute || '').startsWith('/sgsst');
        const hasCanvasDeliverableIntent = /\b(html|interactiv[oa]|canvas|word|docx?|excel|xlsx?|presentaci[oó]n|diapositivas|pptx|pdf|descargable|landing|prototipo|tablero|dashboard|calculadora|simulador)\b/i.test(userLower);
        const clickAnalyzeMatch = /(?:dale\s+clic|haz\s+clic|pulsa|presiona|genera|generar|regenera|regenerar|haz|hacer|realiza|realizar)\s+(?:en\s+|el\s+)?(?:bot[oó]n\s+)?(?:de\s+)?(?:generar\s+)?(?:an[aá]lisis|informe|ia|aplicativo|m[oó]dulo)/i.test(userLower) ||
            /\b(informe|an[aá]lisis)\s+(del|de\s+este)\s+(aplicativo|m[oó]dulo|formulario)\b/i.test(userLower) ||
            /^(?:dale\s+clic\s+t[uú]|hazlo\s+t[uú]|dale\s+clic)$/i.test(userLower);
        if (clickAnalyzeMatch && isOnSgsstAppNow && !hasCanvasDeliverableIntent) {
            logger.info(`[VoiceSession] [Tenshi Voice Failsafe] Gemini omitió toolCall! Disparando operar_interfaz_visual con click a "Generar IA"`);
            this.sendToClient({
                type: 'wappy_action',
                data: {
                    id: `failsafe-click-${Date.now()}`,
                    name: 'operar_interfaz_visual',
                    args: { accion: 'click', texto: 'Generar IA', detalle: 'Generar IA' }
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
                const normP = pregunta.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
                const isGeneric = /^(hacer\s+una\s+consulta|hacer\s+una\s+pregunta|una\s+consulta|una\s+pregunta|consultar|preguntar|hablar|ver|abrir|conectarme|asesoria|concepto|derecho\s+laboral|medicina\s+laboral)$/i.test(normP);
                if (isGeneric || pregunta.length < 5) {
                    pregunta = '';
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
                        nuevo_chat: requestedNewChat,
                        ...(this.activeTenshiConversationId ? { tenshiConversationId: this.activeTenshiConversationId } : {}),
                        ...(Array.isArray(this.selectedTenshiNotebooks) && this.selectedTenshiNotebooks.length > 0
                            ? { selectedNotebooks: [...this.selectedTenshiNotebooks] }
                            : {}),
                    }
                }
            });
            return;
        }

        // 2a. Detección de generación de informes o análisis dentro de un aplicativo SG-SST
        const hasNamedSgsstApp = /\b(responsable|pol[ií]tica|objetivos|matriz\s+legal|reglamento\s+interno|\brit\b|perfil\s+(?:de\s+)?cargo|diagn[oó]stico|0312|vulnerab\w*)\b/i.test(userLower);
        const excludesCanvasFormats = !/\b(html|interactiv[oa]|canvas|word|docx?|excel|xlsx?|presentaci[oó]n|diapositivas|pptx|descargable|landing|prototipo|tablero|dashboard|calculadora|simulador)\b/i.test(userLower);
        const matchesAppAnalysisPattern =
            /\b(genera|generar|crea|crear|haz|hazme|redacta|redactar)\s+.*(informe|an[aá]lisis|documento).*(\baplicativo\b|responsable|pol[ií]tica|objetivos|matriz\s+legal|reglamento\s+interno|\brit\b|perfil\s+(?:de\s+)?cargo|diagn[oó]stico|0312|vulnerab\w*)/i.test(userLower) ||
            /\b(genera|generar|crea|crear|haz|hazme|redacta|redactar)\s+(el\s+|un\s+)?(informe|an[aá]lisis)\s+(de|del|en)\s+(responsable|pol[ií]tica|objetivos|matriz\s+legal|legal|rit|perfil\s+(?:de\s+)?cargo|diagn[oó]stico|0312|vulnerab\w*)/i.test(userLower);
        const isAppAnalysisRequest =
            excludesCanvasFormats &&
            matchesAppAnalysisPattern &&
            (hasNamedSgsstApp || isOnSgsstAppNow);

        if (isAppAnalysisRequest) {
            let app = 'responsable';
            if (/pol[ií]tica/i.test(userLower)) app = 'politica';
            else if (/objetivo/i.test(userLower)) app = 'objetivos';
            else if (/legal/i.test(userLower)) app = 'legal';
            else if (/rit|reglamento/i.test(userLower)) app = 'rit';
            else if (/cargo/i.test(userLower)) app = 'perfil_cargo';
            else if (/diagn[oó]stico|0312/i.test(userLower)) app = 'diagnostico';
            else if (/emergencia|vulnerab/i.test(userLower)) app = 'vulnerabilidad';
            else if (/responsable/i.test(userLower)) app = 'responsable';

            logger.info(`[VoiceSession] [Tenshi Voice Failsafe] Detected application analysis request for "${app}". Dispatching wappy_generar_analisis_aplicativo...`);
            this.sendToClient({
                type: 'wappy_action',
                data: {
                    id: `failsafe-app-report-${Date.now()}`,
                    name: 'wappy_generar_analisis_aplicativo',
                    args: { aplicativo: app, instruccion_adicional: userText }
                }
            });
            return;
        }

        // 2b. Detección de creación EXPLÍCITA de Prototipos / Landing Pages / Canvas omitidos por Gemini
        // NUNCA disparar por menciones de módulos o informes de aplicativos SG-SST
        const isExplicitCanvasCreate = (
            /\b(crea|crear|genera|generar|haz|hazme|diseña|diseñame|despliega|desplegar|abrir|abre)\s+(un\s+|una\s+)?(canvas|landing\s*page|prototipo|documento\s+en\s+canvas)\b/i.test(userLower) ||
            (/\b(crea|crear|genera|generar|haz|hazme|diseña)\s+(un\s+)?aplicativo\s+interactivo\b/i.test(userLower) && !/\b(sgsst|responsable|informe|matriz|m[oó]dulo)\b/i.test(userLower))
        ) && !/\b(responsable|pol[ií]tica|objetivos|matriz\s+legal|rit|perfil|diagn[oó]stico)\b/i.test(userLower);
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

            if (/automatizaci[oó]n|automatizaciones/i.test(userLower) || (/\btareas\b/i.test(userLower) && !/cronograma|acpm|kanban|cr[ií]ticas?|control/i.test(userLower))) {
                // Sección 'Tareas' (antes 'Automatizaciones IA'), debajo de Centro de Control
                targetModulo = 'tareas';
                targetRuta = /historial|reportes|corridas|logs/i.test(userLower) ? '/tareas?tab=historial' : '/tareas';
            } else if (/admin.*curso|gesti[oó]n.*curso|administrar curso/i.test(userLower)) {
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
            } else if (/hito\s*([1-8])/i.test(userLower)) {
                const hNum = userLower.match(/hito\s*([1-8])/i)[1];
                targetModulo = `hito${hNum}`;
                targetRuta = `/sgsst?hito=hito${hNum}`;
            } else if (/contexto|partes interesadas|dofa|pestel/i.test(userLower)) {
                targetModulo = 'contexto_organizacion';
                targetRuta = '/sgsst?hito=hito1&module=contexto_organizacion';
            } else if (/diagn[oó]stico|evaluaci[oó]n inicial|0312/i.test(userLower)) {
                targetModulo = 'diagnostico';
                targetRuta = '/sgsst?hito=hito1&module=diagnostico';
            } else if (/responsable sst|asignaci[oó]n responsable/i.test(userLower)) {
                targetModulo = 'responsable';
                targetRuta = '/sgsst?hito=hito1&module=responsable';
            } else if (/pol[ií]tica(\s+sst)?/i.test(userLower)) {
                targetModulo = 'politica';
                targetRuta = '/sgsst?hito=hito1&module=politica';
            } else if (/objetivos?(\s+sst)?|metas?(\s+sst)?|indicadores?(\s+sst)?/i.test(userLower)) {
                targetModulo = 'objetivos';
                targetRuta = '/sgsst?hito=hito1&module=objetivos';
            } else if (/matriz legal|requisitos legales/i.test(userLower)) {
                targetModulo = 'legal';
                targetRuta = '/sgsst?hito=hito1&module=legal';
            } else if (/rhs|reglamento.*higiene/i.test(userLower)) {
                targetModulo = 'rhs';
                targetRuta = '/sgsst?hito=hito1&module=rhs';
            } else if (/rit|reglamento.*interno/i.test(userLower)) {
                targetModulo = 'rit';
                targetRuta = '/sgsst?hito=hito1&module=rit';
            } else if (/participaci[oó]n ipevar|reportar peligro/i.test(userLower)) {
                targetModulo = 'participacion_ipevar';
                targetRuta = '/sgsst?hito=hito1&module=participacion_ipevar';
            } else if (/matriz gtc|matriz ipevar|gtc 45 oficial/i.test(userLower)) {
                targetModulo = 'matriz_ipevar_oficial';
                targetRuta = '/sgsst?hito=hito1&module=matriz_ipevar_oficial';
            } else if (/matriz pesv|matriz vial/i.test(userLower)) {
                targetModulo = 'matriz_pesv_oficial';
                targetRuta = '/sgsst?hito=hito1&module=matriz_pesv_oficial';
            } else if (/matriz compatibilidad/i.test(userLower)) {
                targetModulo = 'matriz_compatibilidad_oficial';
                targetRuta = '/sgsst?hito=hito1&module=matriz_compatibilidad_oficial';
            } else if (/oportunidades|riesgos del sistema/i.test(userLower)) {
                targetModulo = 'oportunidades_sst';
                targetRuta = '/sgsst?hito=hito1&module=oportunidades_sst';
            } else if (/vulnerabilidad/i.test(userLower)) {
                targetModulo = 'vulnerabilidad';
                targetRuta = '/sgsst?hito=hito1&module=vulnerabilidad';
            } else if (/plan.*emergencia|ppre/i.test(userLower)) {
                targetModulo = 'plan_emergencias';
                targetRuta = '/sgsst?hito=hito1&module=plan_emergencias';
            } else if (/perfil.*cargo|profesigrama/i.test(userLower)) {
                targetModulo = 'perfil_cargo';
                targetRuta = '/sgsst?hito=hito2&module=perfil_cargo';
            } else if (/sociodemogr[aá]fico|perfil socio/i.test(userLower)) {
                targetModulo = 'perfil_socio';
                targetRuta = '/sgsst?hito=hito2&module=perfil_socio';
            } else if (/condiciones de salud|ex[aá]menes m[eé]dicos/i.test(userLower)) {
                targetModulo = 'condiciones_salud';
                targetRuta = '/sgsst?hito=hito2&module=condiciones_salud';
            } else if (/compatibilidad.*cargo|dictamen.*cargo|or[aá]culo.*cargo/i.test(userLower)) {
                targetModulo = 'oraculo_predictivo';
                targetRuta = '/sgsst?hito=hito2&module=oraculo_predictivo';
            } else if (/copasst|vig[ií]a/i.test(userLower)) {
                targetModulo = 'copasst';
                targetRuta = '/sgsst?hito=hito3&module=copasst';
            } else if (/cocolab|convivencia/i.test(userLower)) {
                targetModulo = 'cocolab';
                targetRuta = '/sgsst?hito=hito3&module=cocolab';
            } else if (/comit[eé].*pesv|comit[eé].*seguridad vial|csv/i.test(userLower)) {
                targetModulo = 'comite_pesv';
                targetRuta = '/sgsst?hito=hito3&module=comite_pesv';
            } else if (/brigada|comit[eé].*crisis|sci/i.test(userLower)) {
                targetModulo = 'brigada_emergencias';
                targetRuta = '/sgsst?hito=hito3&module=brigada_emergencias';
            } else if (/peligro|gtc.*45|ipevar/i.test(userLower)) {
                targetModulo = 'peligros';
                targetRuta = '/sgsst?hito=hito4&module=peligros';
            } else if (/m[eé]todo owas|owas|ergonom[ií]a laboral/i.test(userLower)) {
                targetModulo = 'metodo_owas';
                targetRuta = '/sgsst?hito=hito4&module=metodo_owas';
            } else if (/estudio.*puesto|\bept\b/i.test(userLower)) {
                targetModulo = 'estudio_puesto';
                targetRuta = '/sgsst?hito=hito4&module=estudio_puesto';
            } else if (/term[oó]metro|[aá]nimo/i.test(userLower)) {
                targetModulo = 'animo';
                targetRuta = '/sgsst?hito=hito4&module=animo';
            } else if (/compras|adquisiciones/i.test(userLower)) {
                targetModulo = 'compras_sst';
                targetRuta = '/sgsst?hito=hito5&module=compras_sst';
            } else if (/contratistas|proveedores/i.test(userLower)) {
                targetModulo = 'contratistas_proveedores';
                targetRuta = '/sgsst?hito=hito5&module=contratistas_proveedores';
            } else if (/gesti[oó]n.*cambio|\bmoc\b/i.test(userLower)) {
                targetModulo = 'gestion_cambio';
                targetRuta = '/sgsst?hito=hito5&module=gestion_cambio';
            } else if (/\bats\b|an[aá]lisis de trabajo seguro/i.test(userLower)) {
                targetModulo = 'analisis_trabajo_seguro';
                targetRuta = '/sgsst?hito=hito5&module=analisis_trabajo_seguro';
            } else if (/permiso.*alturas|permiso.*tsa/i.test(userLower)) {
                targetModulo = 'permiso_alturas';
                targetRuta = '/sgsst?hito=hito5&module=permiso_alturas';
            } else if (/l[ií]nea de vida|ciclo.*altura|arn[eé]s/i.test(userLower)) {
                targetModulo = 'heights_lifecycle';
                targetRuta = '/sgsst?hito=hito5&module=heights_lifecycle';
            } else if (/epp|entrega.*epp|dotaci[oó]n/i.test(userLower)) {
                targetModulo = 'epp_delivery';
                targetRuta = '/sgsst?hito=hito5&module=epp_delivery';
            } else if (/qu[ií]mica|registro.*qu[ií]mico|inventario.*qu[ií]mico/i.test(userLower)) {
                targetModulo = 'chemical_registry';
                targetRuta = '/sgsst?hito=hito5&module=chemical_registry';
            } else if (/pesv|seguridad vial|veh[ií]culos|automotores/i.test(userLower)) {
                targetModulo = 'vehicles_pesv';
                targetRuta = '/sgsst?hito=hito5&module=vehicles_pesv';
            } else if (/equipos.*emergencia|extintores/i.test(userLower)) {
                targetModulo = 'equipos_emergencia';
                targetRuta = '/sgsst?hito=hito5&module=equipos_emergencia';
            } else if (/comunicaciones|matriz.*comunicaci[oó]n/i.test(userLower)) {
                targetModulo = 'comunicaciones_sst';
                targetRuta = '/sgsst?hito=hito6&module=comunicaciones_sst';
            } else if (/capacitaci[oó]n|pac|programa capacitaci[oó]n/i.test(userLower)) {
                targetModulo = 'capacitaciones';
                targetRuta = '/sgsst?hito=hito6&module=capacitaciones';
            } else if (/ruta.*aprendizaje|lms/i.test(userLower)) {
                targetModulo = 'ruta_aprendizaje';
                targetRuta = '/sgsst?hito=hito6&module=ruta_aprendizaje';
            } else if (/reporte de actos|condiciones inseguras/i.test(userLower)) {
                targetModulo = 'reporte_actos';
                targetRuta = '/sgsst?hito=hito6&module=reporte_actos';
            } else if (/simulacros?/i.test(userLower)) {
                targetModulo = 'simulacros_emergencia';
                targetRuta = '/sgsst?hito=hito6&module=simulacros_emergencia';
            } else if (/app.*builder|constructor.*app|micro.*app/i.test(userLower)) {
                targetModulo = 'app_builder';
                targetRuta = '/sgsst?hito=hito6&module=app_builder';
            } else if (/estad[ií]sticas|indicadores atel|ausentismo/i.test(userLower)) {
                targetModulo = 'estadisticas';
                targetRuta = '/sgsst?hito=hito7&module=estadisticas';
            } else if (/investigaci[oó]n.*accidente|[aá]rbol de causas/i.test(userLower)) {
                targetModulo = 'investigacion_atel';
                targetRuta = '/sgsst?hito=hito7&module=investigacion_atel';
            } else if (/alta direcci[oó]n|revisi[oó]n gerencial/i.test(userLower)) {
                targetModulo = 'alta_direccion';
                targetRuta = '/sgsst?hito=hito7&module=alta_direccion';
            } else if (/investigaci[oó]n profunda/i.test(userLower)) {
                targetModulo = 'investigacion_profunda';
                targetRuta = '/sgsst?hito=hito7&module=investigacion_profunda';
            } else if (/auditor[ií]a/i.test(userLower)) {
                targetModulo = 'auditoria';
                targetRuta = '/auditoria';
            } else if (/predictivo|or[aá]culo/i.test(userLower)) {
                targetModulo = 'predictivo';
                targetRuta = '/sgsst?hito=hito8&module=predictivo';
            } else if (/videollamada|c[aá]mara|en vivo/i.test(userLower)) {
                targetModulo = 'live';
                targetRuta = '/live';
            } else if (/agentes|mercado|cat[aá]logo/i.test(userLower)) {
                targetModulo = 'agents';
                targetRuta = '/agents';
            } else if (/control|kanban|acpm/i.test(userLower)) {
                targetModulo = 'control_acpm';
                targetRuta = '/sgsst/control';
            } else if (/tienda|marketplace/i.test(userLower)) {
                targetModulo = 'marketplace';
                targetRuta = '/marketplace';
            } else if (/clases?\s+en\s+vivo|sesiones?\s+en\s+vivo/i.test(userLower)) {
                targetModulo = 'clases_en_vivo';
                targetRuta = '/academia?tab=meet';
            } else if (/empresas?\s+registradas?|mis\s+empresas|donde\s+van\s+las\s+empresas/i.test(userLower)) {
                targetModulo = 'empresas';
                targetRuta = '/sgsst?modal=empresas';
            } else if (/configuraci[oó]n|ajustes|settings|preferencias/i.test(userLower)) {
                targetModulo = 'configuracion';
                targetRuta = '/settings';
            } else if (/regresar|volver|ir\s+al\s+chat/i.test(userLower)) {
                targetModulo = 'regresar';
                targetRuta = '/c/new';
            } else if (/t[eé]rminos(\s+de\s+servicio)?/i.test(userLower)) {
                targetModulo = 'terms';
                targetRuta = '/terms';
            } else if (/privacidad|pol[ií]tica\s+de\s+privacidad/i.test(userLower)) {
                targetModulo = 'privacy';
                targetRuta = '/privacy';
            } else if (/acerca\s+de|qui[eé]nes\s+somos|about/i.test(userLower)) {
                targetModulo = 'about';
                targetRuta = '/about';
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
        if (this.earlyCorrectionTimer) {
            clearTimeout(this.earlyCorrectionTimer);
            this.earlyCorrectionTimer = null;
        }
        const rawUserSnapshot = this.userTranscriptionText || this.rawUserTranscriptionStream || '';
        const currentUserText = sanitizeAccumulatedTranscription(rawUserSnapshot);
        const currentAiText = this.aiResponseText;
        const currentAudioCount = this.aiAudioChunkCount;
        const currentAiBufferSnapshot = this.aiTranscriptionBuffer || '';
        const turnToolCalls = Array.isArray(this.currentTurnToolCalls) ? [...this.currentTurnToolCalls] : [];
        const turnHadToolCall = Boolean(this.toolCalledThisTurn || turnToolCalls.length > 0);
        this.toolCalledThisTurn = false;
        const turnPcmChunks = Array.isArray(this.currentTurnPcmChunks) && this.currentTurnPcmChunks.length > 0
            ? [...this.currentTurnPcmChunks]
            : [];
        const turnPcmBytes = this.currentTurnPcmBytes || 0;
        const turnAudioId = this.currentAudioTurnId || 0;
        const turnWavInfo = turnPcmChunks.length > 0
            ? build16kMonoWavFromPcmChunks(turnPcmChunks)
            : { silent: true, rms: 0, wavBase64: null, byteLength: 0, durationSec: 0, reason: 'no_pcm', signature: null };
        const turnHadSpeechAudio = Boolean(this.currentTurnSpeechDetected && turnPcmBytes >= 6400 && !turnWavInfo.silent);
        const inFlightEarlyPromise = this.earlyCorrectionPromise;
        let earlySnapshot = this.earlyCorrectedSnapshot;

        // Limpiar inmediatamente los acumuladores de turno para evitar condiciones de carrera si el usuario vuelve a hablar
        this.userTranscriptionText = '';
        this.rawUserTranscriptionStream = '';
        this.aiResponseText = '';
        this.aiTranscriptionBuffer = '';
        this.aiAudioChunkCount = 0;
        this.currentTurnToolCalls = [];
        this.earlyCorrectedSnapshot = null;
        this.currentTurnPcmChunks = [];
        this.currentTurnPcmBytes = 0;
        this.currentTurnPreRollChunks = [];
        this.currentTurnSpeechDetected = false;
        this.currentAudioTurnId = turnAudioId + 1;

        if (!currentUserText.trim() && !turnHadSpeechAudio && !currentAiText.trim() && currentAudioCount === 0 && !this.lastGeneratedCanvasFile) {
            return;
        }

        // On Disconnect, do not save if the AI never started responding (to avoid saving partial/unanswered fragments)
        if (source === 'Disconnect' && !currentAiText.trim() && currentAudioCount === 0 && turnToolCalls.length === 0) {
            logger.info(`[VoiceSession] [${source}] Discarding unanswered user transcription fragment to prevent chat clutter: "${currentUserText}"`);
            return;
        }

        // Si había una transcripción multimodal temprana en vuelo (speech_end / tool_call / ai_audio_start),
        // esperarla para reutilizar su resultado exacto (incluyendo [SILENCIO]) sin duplicar la llamada a Gemini WAV
        if (inFlightEarlyPromise) {
            try {
                const earlyResult = await Promise.race([
                    inFlightEarlyPromise,
                    new Promise((resolve) => setTimeout(() => resolve(null), 4800)),
                ]);
                if (earlyResult && typeof earlyResult === 'object' && earlyResult.resolved) {
                    earlySnapshot = earlyResult;
                } else if (typeof earlyResult === 'string' && earlyResult.trim()) {
                    earlySnapshot = {
                        resolved: true,
                        raw: currentUserText.trim(),
                        corrected: earlyResult.trim(),
                        isSilence: false,
                        pcmBytes: turnPcmBytes,
                        pcmSignature: turnWavInfo.signature || null,
                        turnId: turnAudioId,
                    };
                }
            } catch (_) {}
        }

        const canReuseEarlySnapshot = Boolean(
            earlySnapshot &&
            earlySnapshot.resolved &&
            (
                (turnWavInfo.signature && earlySnapshot.pcmSignature === turnWavInfo.signature) ||
                (earlySnapshot.turnId === turnAudioId &&
                    Math.abs((earlySnapshot.pcmBytes || 0) - turnPcmBytes) <= 8192)
            )
        );

        // MODO TENSHI: Copiloto oficial en ventana flotante/widget.
        // NUNCA crear conversaciones en LibreChat sidebar (Conversation collection).
        // Pero SÍ persistir en el modelo TenshiMessage para que el widget mantenga su historial sincronizado.
        if (this.config.mode === 'tenshi_voice') {
            let finalUserText = currentUserText.trim();
            let verifiedSilence = false;
            const isInternalPrompt = /^\[SISTEMA INTERNO WAPPY/i.test(finalUserText);
            if (!isInternalPrompt && (finalUserText || turnHadSpeechAudio || turnPcmChunks.length > 0)) {
                // Reutilizar SIEMPRE la transcripción multimodal temprana del mismo buffer WAV (0 llamadas duplicadas)
                if (canReuseEarlySnapshot) {
                    finalUserText = (earlySnapshot.corrected || '').trim();
                    verifiedSilence = Boolean(earlySnapshot.isSilence || !finalUserText);
                } else if (turnPcmChunks.length > 0 && turnWavInfo.silent) {
                    // Audio grabado del turno es silencio o ruido corto (<0.45s & RMS<0.06): descartar sin llamar a Gemini ni guardar burbuja fantasma
                    finalUserText = '';
                    verifiedSilence = true;
                } else {
                    const corrected = await this.correctTranscription(
                        finalUserText,
                        currentAiText,
                        turnToolCalls,
                        turnPcmChunks,
                        turnPcmChunks.length > 0 ? turnWavInfo : null
                    );
                    finalUserText = (corrected || '').trim();
                    verifiedSilence = !finalUserText;
                }
                // Actualizar en vivo la burbuja del usuario SOLO si hubo voz humana válida diferente al crudo
                if (finalUserText && finalUserText !== currentUserText.trim()) {
                    this.lastUserTranscription = finalUserText;
                    this.sendToClient({
                        type: 'text',
                        data: {
                            text: finalUserText,
                            isUserTranscription: true,
                            replaceLastUserBubble: true,
                        },
                    });
                }
            }

            logger.info(`[VoiceSession] [Tenshi Voice] Turn completed (${source}). User: "${finalUserText}" (raw: "${currentUserText}", pcmBytes: ${turnPcmBytes}${verifiedSilence ? ', verifiedSilence=true' : ''}), AI: "${currentAiText}"`);
            if (finalUserText || !verifiedSilence) {
                this.handleTenshiVoiceFailsafe(finalUserText || (verifiedSilence ? '' : currentUserText), currentAiText, turnHadToolCall);
            }

            try {
                const TenshiMessage = require('~/models/TenshiMessage');
                if (this.userId) {
                    const activeCompId = await resolveActiveCompanyId(this.userId);
                    const tenshiConvoId = await this.resolveTenshiConversationId(activeCompId);
                    let savedTenshiMessage = false;
                    if (finalUserText && !/^\[SISTEMA INTERNO WAPPY/i.test(finalUserText)) {
                        const createdUserMsg = await TenshiMessage.create({
                            user: this.userId,
                            companyId: activeCompId,
                            conversationId: tenshiConvoId || null,
                            role: 'user',
                            content: finalUserText,
                        }).catch(err => {
                            logger.error('[VoiceSession] Error saving Tenshi user message:', err);
                            return null;
                        });
                        if (createdUserMsg) savedTenshiMessage = true;
                    }
                    const canvasFileToAttach = this.lastGeneratedCanvasFile || null;
                    this.lastGeneratedCanvasFile = null;

                    if (currentAiText && currentAiText.trim()) {
                        const createdAiMsg = await TenshiMessage.create({
                            user: this.userId,
                            companyId: activeCompId,
                            conversationId: tenshiConvoId || null,
                            role: 'assistant',
                            content: currentAiText.trim(),
                            file: canvasFileToAttach || undefined,
                            htmlReport: canvasFileToAttach?.fileType === 'html' ? canvasFileToAttach.content : undefined,
                        }).catch(err => {
                            logger.error('[VoiceSession] Error saving Tenshi assistant message:', err);
                            return null;
                        });
                        if (createdAiMsg) savedTenshiMessage = true;
                    } else if (canvasFileToAttach) {
                        const fileLabel = canvasFileToAttach.fileType === 'html' ? 'Aplicativo / Reporte HTML' : 'Documento SG-SST';
                        const createdCanvasMsg = await TenshiMessage.create({
                            user: this.userId,
                            companyId: activeCompId,
                            conversationId: tenshiConvoId || null,
                            role: 'assistant',
                            content: `📁 **${fileLabel} generado**: *${canvasFileToAttach.title}*`,
                            file: canvasFileToAttach,
                            htmlReport: canvasFileToAttach.fileType === 'html' ? canvasFileToAttach.content : undefined,
                        }).catch(err => {
                            logger.error('[VoiceSession] Error saving Tenshi canvas file message:', err);
                            return null;
                        });
                        if (createdCanvasMsg) savedTenshiMessage = true;
                    }

                    // Notificar al cliente DESPUÉS de persistir en MongoDB para que /api/tenshi/history ya traiga file y htmlReport
                    if (savedTenshiMessage) {
                        this.sendToClient({
                            type: 'status',
                            data: {
                                status: 'history_synced',
                                hasFile: Boolean(canvasFileToAttach),
                                ...(tenshiConvoId ? { conversationId: tenshiConvoId, tenshiConversationId: tenshiConvoId } : {}),
                            },
                        });
                    }

                    // Sincronizar en la conversación del Agente Tenshi (Sidebar de agentes) si se generó un archivo Canvas o reporte
                    if (canvasFileToAttach) {
                        try {
                            const { Conversation, Message } = require('~/db/models');
                            const CanvasSession = require('~/models/CanvasSession');
                            const TENSHI_AGENT_ID = '3579240c-ac93-4f4f-b0e4-95d87fc1ee27';

                            let tenshiConvo = await Conversation.findOne({
                                user: String(this.userId),
                                agent_id: TENSHI_AGENT_ID,
                                ...(activeCompId ? { tags: { $in: [`company-${activeCompId}`, `company:${activeCompId}`] } } : {}),
                            }).sort({ updatedAt: -1 });

                            const convoId = tenshiConvo ? tenshiConvo.conversationId : uuidv4();

                            if (!tenshiConvo) {
                                tenshiConvo = await Conversation.create({
                                    conversationId: convoId,
                                    user: String(this.userId),
                                    title: canvasFileToAttach.title || 'Documento SG-SST',
                                    endpoint: 'agents',
                                    agent_id: TENSHI_AGENT_ID,
                                    tags: ['tenshi-canvas', 'sgsst', ...(activeCompId ? [`company-${activeCompId}`, `company:${activeCompId}`] : [])],
                                    createdAt: new Date(),
                                    updatedAt: new Date(),
                                });
                            } else {
                                // Evitar deadlock de mongoMeili post('updateOne') en Mongoose 8 cuando MEILI_HOST está activo
                                await Conversation.collection.updateOne(
                                    { conversationId: convoId },
                                    { $set: { title: canvasFileToAttach.title, updatedAt: new Date() } }
                                );
                            }

                            const fileLabel = canvasFileToAttach.fileType === 'html' ? 'Aplicativo / Reporte HTML' : 'Documento SG-SST';
                            await Message.create({
                                messageId: uuidv4(),
                                conversationId: convoId,
                                user: String(this.userId),
                                sender: 'Tenshi',
                                text: `📁 **${fileLabel} generado**: *${canvasFileToAttach.title}*\n\nPuedes visualizarlo o descargarlo desde Canvas.`,
                                isCreatedByUser: false,
                                createdAt: new Date(),
                                updatedAt: new Date(),
                            });

                            await CanvasSession.findOneAndUpdate(
                                { conversationId: convoId },
                                {
                                    $set: {
                                        user: String(this.userId),
                                        title: canvasFileToAttach.title,
                                        fileType: canvasFileToAttach.fileType || 'text',
                                        content: canvasFileToAttach.content || '',
                                        updatedAt: new Date(),
                                    },
                                    $setOnInsert: {
                                        createdAt: new Date(),
                                        version: 1,
                                    }
                                },
                                { upsert: true, new: true }
                            );
                            logger.info(`[VoiceSession] Canvas file synced to Agent Tenshi sidebar (${convoId})`);
                        } catch (agentTenshiSyncErr) {
                            logger.warn('[VoiceSession] Error syncing canvas file to Agent Tenshi conversation:', agentTenshiSyncErr.message);
                        }
                    }

                    // Sincronizar en la conversación del Agente Fisioterapeuta si el modo ergonómico está activo
                    if (this.isFisioMode && this.fisioConversationId) {
                        try {
                            const { Conversation, Message } = require('~/db/models');
                            const targetAgentId = this.fisioAgent?.id || 'fisioterapeuta_laboral';

                            await Conversation.findOneAndUpdate(
                                { conversationId: this.fisioConversationId },
                                {
                                    conversationId: this.fisioConversationId,
                                    user: this.userId,
                                    title: 'Evaluación y Estudio Ergonómico en Vivo',
                                    endpoint: 'agents',
                                    agent_id: targetAgentId,
                                    tags: ['fisioterapeuta-live-ept', 'sgsst-ept'],
                                    updatedAt: new Date(),
                                },
                                { upsert: true, new: true }
                            );

                            if (finalUserText && !/^\[SISTEMA INTERNO WAPPY/i.test(finalUserText)) {
                                const uMsgId = uuidv4();
                                await Message.create({
                                    messageId: uMsgId,
                                    conversationId: this.fisioConversationId,
                                    user: this.userId,
                                    sender: 'User',
                                    text: finalUserText,
                                    isCreatedByUser: true,
                                });
                                this.fisioLastMessageId = uMsgId;
                            }

                            if (currentAiText && currentAiText.trim()) {
                                const aMsgId = uuidv4();
                                await Message.create({
                                    messageId: aMsgId,
                                    conversationId: this.fisioConversationId,
                                    parentMessageId: this.fisioLastMessageId,
                                    user: this.userId,
                                    sender: this.fisioAgent?.name || 'Fisioterapeuta Laboral',
                                    text: currentAiText.trim(),
                                    isCreatedByUser: false,
                                });
                                this.fisioLastMessageId = aMsgId;
                            }
                        } catch (fisioSyncErr) {
                            logger.warn('[VoiceSession] Error syncing turn to Fisioterapeuta conversation:', fisioSyncErr.message);
                        }
                    }
                }
            } catch (err) {
                logger.error('[VoiceSession] Failed to persist Tenshi voice turn to TenshiMessage:', err);
            }

            // Acumular el turno en la memoria de la sesión para que Tenshi mantenga contexto (sin inyectar silencios/alucinaciones descartadas)
            const effectiveTurnUserText = finalUserText || (verifiedSilence ? '' : currentUserText);
            if (effectiveTurnUserText || (currentAiText && currentAiText.trim())) {
                const currentTurnContext = `Usuario: ${effectiveTurnUserText}\nAsistente: ${currentAiText}`;
                if (!this.conversationTurns) {
                    this.conversationTurns = [];
                }
                this.conversationTurns.push(currentTurnContext);
                if (this.conversationTurns.length > 10) {
                    this.conversationTurns.shift();
                }
                this.config.conversationContext = this.conversationTurns.join('\n');
            }

            // Fast-track trigger de informe en Tenshi si el usuario lo solicitó verbalmente o la IA lo confirmó
            if (!this.isGeneratingReport) {
                const userReportRegex = /\b(genera(r)?|haz|compil(a|ar)|dame|quiero|entreg(a|ar)|sacar?)\s+(el\s+|un\s+)?(informe|reporte)\b/i;
                const aiReportRegex = /\b(estoy\s+compilando|generando\s+el\s+informe\s+t[eé]cnico|informe técnico compilado y en pantalla)\b/i;
                const userRequested = Boolean(effectiveTurnUserText) && userReportRegex.test(effectiveTurnUserText);
                const aiConfirmed = (this.conversationTurns && this.conversationTurns.length >= 2) && (aiReportRegex.test(currentAiText) || aiReportRegex.test(currentAiBufferSnapshot));
                if (userRequested || aiConfirmed) {
                    logger.info(`[VoiceSession] Tenshi voice turn triggered report compilation. userRequested: ${userRequested}, aiConfirmed: ${aiConfirmed}`);
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

            if (finalUserText && finalUserText.length >= 18 && this.userId) {
                const rawVoiceText = finalUserText;
                setImmediate(() => {
                    autoSynthesizeProceduralRule(rawVoiceText, this.userId).catch(() => {});
                });
            }

            return;
        }

        logger.info(`[VoiceSession] [${source}] Saving pending turn. User: "${currentUserText}", AI: "${currentAiText}", Audio chunks: ${currentAudioCount}`);

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
            const aiConfirmed = (this.conversationTurns && this.conversationTurns.length >= 2) && (aiReportRegex.test(currentAiText) || aiReportRegex.test(currentAiBufferSnapshot));
            const shouldGenerateReport = userRequested || aiConfirmed;

            logger.info(`[VoiceSession] Report trigger check. userRequested: ${userRequested} ("${currentUserText}"), aiConfirmed: ${aiConfirmed}, trigger: ${shouldGenerateReport}`);

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
        if (currentUserText.trim() || turnHadSpeechAudio) {
            let textToSave = currentUserText.trim();
            if (canReuseEarlySnapshot) {
                textToSave = (earlySnapshot.corrected || '').trim();
            } else if (turnPcmChunks.length > 0 && turnWavInfo.silent) {
                textToSave = '';
            } else {
                textToSave = await this.correctTranscription(
                    textToSave,
                    currentAiText.trim() || '🎤 [Respuesta de voz]',
                    turnToolCalls,
                    turnPcmChunks,
                    turnPcmChunks.length > 0 ? turnWavInfo : null
                );
            }
            if (textToSave && textToSave.trim() !== currentUserText.trim()) {
                this.sendToClient({
                    type: 'text',
                    data: {
                        text: textToSave.trim(),
                        isUserTranscription: true,
                        replaceLastUserBubble: true,
                    },
                });
            }

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

    /**
     * Activa dinámicamente el Modo Fisioterapeuta Laboral / Estudio Ergonómico en vivo
     */
    async enableFisioterapeutaMode(reason = 'comando_usuario') {
        if (this.isBiomechanics && this.isFisioMode) {
            return;
        }

        logger.info(`[VoiceSession] Activando Modo Fisioterapeuta / Ergonomía en vivo (motivo: ${reason})`);
        this.isBiomechanics = true;
        this.isFisioMode = true;

        try {
            const { Agent } = require('~/db/models');
            const fisioAgent = await Agent.findOne({
                $or: [
                    { name: /fisioterapeuta/i },
                    { name: /biomec[aá]nic/i },
                    { name: /ergon/i }
                ]
            }).lean();

            if (fisioAgent) {
                this.fisioAgent = fisioAgent;
                this.agentObj = fisioAgent;
                this.activeAgentId = fisioAgent.id;
            } else {
                this.fisioAgent = {
                    id: 'fisioterapeuta_laboral',
                    name: 'Fisioterapeuta Laboral',
                };
                this.agentObj = this.fisioAgent;
                this.activeAgentId = 'fisioterapeuta_laboral';
            }

            if (!this.fisioConversationId) {
                this.fisioConversationId = uuidv4();
                this.fisioLastMessageId = null;
            }

            if (this.geminiClient && this.geminiClient.setupCompleted) {
                const fisioDirective = `[DIRECTIVA CRÍTICA - PROTOCOLO OFICIAL DE EVALUACIÓN ERGONÓMICA / FISIOTERAPEUTA LABORAL]:
Has asumido el rol de la Especialista en Ergonomía y Fisioterapeuta Laboral en vivo con la cámara activa.
1. SALUDO INICIAL Y 3 PREGUNTAS OBLIGATORIAS:
   Saluda con calidez y solicita en un solo mensaje fluido:
   "¡Hola! Soy tu Especialista en Ergonomía y Fisioterapeuta Laboral en WAPPY IA. Para vincular este estudio ergonómico al expediente oficial de la empresa, por favor confírmame:
    1. ¿Es una auto-evaluación de tu propio puesto o estás evaluando a un compañero?
    2. Nombre completo y número de cédula del trabajador evaluado.
    3. Cargo y una breve descripción de la actividad cotidiana a evaluar."
   REGLA ESTRICTA: NUNCA inicies el Paso 1 ni pidas adoptar posturas antes de recibir estos datos (nombre, cédula y cargo). Si el usuario omite alguno, pídelo amablemente antes de iniciar.
2. TRANSICIÓN ENTRE FASES (CON RETROALIMENTACIÓN BIOMECÁNICA):
   - Al recibir la identificación completa, confirma cordialmente e inicia el Paso 1 con 'cambiar_fase_evaluacion' (fase: 1).
   - En cada paso, pide al usuario adoptar la postura y esperar a que diga 'Listo', 'Ya' o pulse el botón de la cámara.
   - AL PASAR DE FASE: EXPLICA Y ANALIZA ORALMENTE lo que observas en la postura utilizando la telemetría articular (grados de flexión de cuello, tronco, brazos). Comenta si la postura está forzada o neutral y dale una recomendación física inmediata ANTES de avanzar al siguiente paso.
3. INFORME TÉCNICO OFICIAL:
   Al culminar las 3 fases (tras analizar la postura fatigada de la Fase 3), ofrece compilar el informe técnico oficial e invoca 'generar_informe_tecnico' en cuanto el usuario lo apruebe.`;
                this.geminiClient.sendText(fisioDirective);
            }

            this.sendToClient({
                type: 'agent_switched',
                data: {
                    agentName: this.fisioAgent?.name || 'Fisioterapeuta Laboral',
                    agentId: this.activeAgentId,
                    isBiomechanics: true,
                    isFisioMode: true,
                    conversationId: this.fisioConversationId,
                    badge: '🩺 Fisioterapeuta Laboral IA'
                }
            });

        } catch (err) {
            logger.error('[VoiceSession] Error activando Modo Fisioterapeuta:', err);
        }
    }

    persistLiveCameraMediaForAntigravity() {
        const savedUrls = [];
        try {
            const hasLatestFrame = Boolean(this.latestFrame && typeof this.latestFrame === 'string');
            const hasFrameBuffer = Array.isArray(this.frameBuffer) && this.frameBuffer.length > 0;
            const hasManualEvidences = Array.isArray(this.manualEvidences) && this.manualEvidences.length > 0;
            const phaseEvValues = this.phaseEvidences && typeof this.phaseEvidences === 'object' ? Object.values(this.phaseEvidences) : [];
            const hasPhaseEvidences = phaseEvValues.length > 0;
            const hasVideoClip = Boolean(
                this.latestVideoClip &&
                this.latestVideoClip.base64 &&
                (!this.latestVideoClip.capturedAt || Date.now() - this.latestVideoClip.capturedAt <= 5 * 60 * 1000)
            );

            if (!hasLatestFrame && !hasFrameBuffer && !hasManualEvidences && !hasPhaseEvidences && !hasVideoClip) {
                return { mediaUrls: [], telemetry: null };
            }

            const imagesDir = path.join(process.cwd(), 'client', 'public', 'images');
            fs.mkdirSync(imagesDir, { recursive: true });

            const ts = Date.now();
            const stripBase64Prefix = (b64) => String(b64 || '').replace(/^data:[^;]+;base64,/, '');
            const seenBase64 = new Set();

            // a) Save latestFrame -> tenshi_cam_live_${ts}.jpg
            if (hasLatestFrame) {
                const rawB64 = stripBase64Prefix(this.latestFrame);
                if (rawB64) {
                    const fileName = `tenshi_cam_live_${ts}.jpg`;
                    fs.writeFileSync(path.join(imagesDir, fileName), Buffer.from(rawB64, 'base64'));
                    savedUrls.push(`/images/${fileName}`);
                    seenBase64.add(rawB64);
                }
            }

            // b) Save up to the last 2 frames from frameBuffer (if different from latestFrame)
            if (hasFrameBuffer) {
                const recentFrames = this.frameBuffer
                    .filter((f) => f && typeof f === 'string' && f !== this.latestFrame)
                    .slice(-2);
                recentFrames.forEach((frameB64, idx) => {
                    const rawB64 = stripBase64Prefix(frameB64);
                    if (rawB64 && !seenBase64.has(rawB64)) {
                        const fileName = `tenshi_cam_seq_${ts}_${idx}.jpg`;
                        fs.writeFileSync(path.join(imagesDir, fileName), Buffer.from(rawB64, 'base64'));
                        savedUrls.push(`/images/${fileName}`);
                        seenBase64.add(rawB64);
                    }
                });
            }

            // c) Save up to 2 photos from manualEvidences or Object.values(phaseEvidences)
            const evidenceCandidates = [];
            if (hasManualEvidences) {
                for (const ev of this.manualEvidences) {
                    const img = typeof ev === 'string' ? ev : ev?.image;
                    if (img && typeof img === 'string') evidenceCandidates.push(img);
                }
            }
            if (hasPhaseEvidences) {
                for (const pev of phaseEvValues) {
                    const img = typeof pev === 'string' ? pev : pev?.image;
                    if (img && typeof img === 'string') evidenceCandidates.push(img);
                }
            }
            const uniqueEvidences = [];
            for (const cand of evidenceCandidates.slice().reverse()) {
                const rawB64 = stripBase64Prefix(cand);
                if (rawB64 && !seenBase64.has(rawB64)) {
                    seenBase64.add(rawB64);
                    uniqueEvidences.push(rawB64);
                    if (uniqueEvidences.length >= 2) break;
                }
            }
            uniqueEvidences.forEach((rawB64, idx) => {
                const fileName = `tenshi_cam_ev_${ts}_${idx}.jpg`;
                fs.writeFileSync(path.join(imagesDir, fileName), Buffer.from(rawB64, 'base64'));
                savedUrls.push(`/images/${fileName}`);
            });

            // d) Save latestVideoClip if captured within the last 5 minutes
            if (hasVideoClip) {
                const rawClipB64 = stripBase64Prefix(this.latestVideoClip.base64);
                if (rawClipB64) {
                    const ext = String(this.latestVideoClip.mimeType || '').includes('mp4') ? 'mp4' : 'webm';
                    const fileName = `tenshi_cam_clip_${ts}.${ext}`;
                    fs.writeFileSync(path.join(imagesDir, fileName), Buffer.from(rawClipB64, 'base64'));
                    savedUrls.push(`/images/${fileName}`);
                }
            }
        } catch (err) {
            logger.error('[VoiceSession] Error persisting live camera media for Antigravity:', err);
        }

        const rawTelemetry = this.latestTelemetry || this.latestVideoClip?.telemetry || null;
        const formattedTelemetry = rawTelemetry
            ? (typeof rawTelemetry === 'object' ? (rawTelemetry.summary || JSON.stringify(rawTelemetry)) : String(rawTelemetry))
            : null;

        return { mediaUrls: savedUrls, telemetry: formattedTelemetry };
    }

    async stop() {
        if (!this.isActive) return;
        this.isActive = false;
        this.isAiSpeaking = false;
        this.aiGenerationComplete = false;
        this.activeToolCount = 0;
        this.pendingHangupAfterTurn = false;
        this.hangupFarewellAlreadySpoken = false;
        this.hangupToolSentAt = 0;
        this.clearAudioStreamEndWatchdog();
        if (this.aiSpeakingTimeout) {
            clearTimeout(this.aiSpeakingTimeout);
            this.aiSpeakingTimeout = null;
        }
        if (this.earlyCorrectionTimer) {
            clearTimeout(this.earlyCorrectionTimer);
            this.earlyCorrectionTimer = null;
        }
        if (this.pendingHangupTimer) {
            clearTimeout(this.pendingHangupTimer);
            this.pendingHangupTimer = null;
        }

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

        // Extract clean API keys (supports JSON objects, stringified JSON, comma-separated lists)
        const apiKeys = geminiPoolManager.extractCleanApiKeys(apiKey);

        if (!apiKeys || apiKeys.length === 0) {
            throw new Error('Google API Key not configured');
        }

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
            session.agentProtocol = {
                ...INSPECTION_PROTOCOLS.auditoria_gtc45,
                id: 'tenshi_inspeccion',
                title: 'Inspección de Seguridad y Condiciones Locativas SST - Tenshi',
                methodLabel: 'Inspección Visual de Campo / GTC 45 / ISO 45001'
            };

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

        const wantsBiomechanics = Boolean(
            config.template === 'biomecanico_mediapipe'
        );

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

            // Fallback a archivo markdown si agentId coincide con algún especialista
            if (!agentObj) {
                try {
                    const fs = require('fs');
                    const path = require('path');
                    const cleanId = String(agentId).toLowerCase().replace(/[^a-z0-9_-]/g, '_');
                    const candidateFiles = [
                        `${cleanId}.md`,
                        `${cleanId.replace(/-/g, '_')}.md`,
                    ];
                    for (const cf of candidateFiles) {
                        const filePath = path.resolve(process.cwd(), 'Agentes/Agentes Wappy', cf);
                        if (fs.existsSync(filePath)) {
                            const content = fs.readFileSync(filePath, 'utf-8');
                            const titleMatch = content.match(/^#\s+(.+)$/m);
                            const agentTitle = titleMatch ? titleMatch[1].trim() : cf.replace('.md', '').replace(/_/g, ' ');
                            agentObj = {
                                id: agentId,
                                name: agentTitle,
                                instructions: content,
                            };
                            logger.info(`[VoiceSession] Loaded agent from local markdown: ${agentTitle} (${cf})`);
                            break;
                        }
                    }
                } catch (mdErr) {
                    logger.warn('[VoiceSession] Could not find markdown agent for ID:', agentId, mdErr.message);
                }
            }
        }

        // Si no hay agente y el usuario pidió explícitamente modo biomecánico / EPT
        if (!agentObj && wantsBiomechanics) {
            try {
                const { Agent } = require('~/db/models');
                agentObj = await Agent.findOne({
                    $or: [
                        { name: /biomec[aá]nic/i },
                        { name: /fisioterapeuta/i },
                        { name: /ergon/i }
                    ]
                }).lean();
            } catch (err) {
                logger.warn('[VoiceSession] Could not fallback find biomechanics agent in DB:', err.message);
            }

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
                        logger.info('[VoiceSession] Successfully loaded Fisioterapeuta instructions from local markdown file for biomechanics mode');
                    }
                } catch (mdErr) {
                    logger.warn('[VoiceSession] Could not load markdown fallback for fisio:', mdErr.message);
                }
            }
        }

        // Si no hay agente y NO es biomecánica, cargar Consultor General SST
        if (!agentObj) {
            try {
                const fs = require('fs');
                const path = require('path');
                const sstPath = path.resolve(process.cwd(), 'Agentes/Agentes Wappy/profesional_sst.md');
                if (fs.existsSync(sstPath)) {
                    const content = fs.readFileSync(sstPath, 'utf-8');
                    agentObj = {
                        name: 'Consultor General SG-SST',
                        instructions: content,
                    };
                    logger.info('[VoiceSession] Defaulted to Consultor General SG-SST (profesional_sst.md)');
                }
            } catch (mdErr) {
                logger.warn('[VoiceSession] Could not load general sst markdown fallback:', mdErr.message);
            }
        }

        // Dynamic Inspection Protocol Resolution across all WAPPY Agent Families
        const rawAgentName = (agentObj?.name || '').toLowerCase();
        const isExplicitOtherSpecialist = /consultor|auditor|qu[ií]mic|abogad|m[eé]dic|psic[oó]log|vial|pesv|emergencia|electric|ambiental|nutricion|bioseguridad|profesional\s+sst/i.test(rawAgentName);

        const isBiomechanics = !isExplicitOtherSpecialist && (
            wantsBiomechanics ||
            config.template === 'biomecanico_mediapipe' ||
            /fisioterapeuta/i.test(rawAgentName) ||
            /fisioterapeuta/i.test(agentObj?.id || '')
        );
        const agentProtocol = isBiomechanics
            ? INSPECTION_PROTOCOLS.biomecanico
            : resolveInspectionProtocol(agentObj?.name || config.template || 'auditoria_gtc45');

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
        const liveDirectives = isBiomechanics
            ? `
[DIRECTIVAS DE INTERACCIÓN EN VIVO POR VOZ Y VIDEO - EVALUACIÓN ERGONÓMICA]:
1. **IDIOMA EXCLUSIVO: ESPAÑOL.** El usuario y tú se comunican SIEMPRE en español de Colombia/Latinoamérica. NUNCA respondas, transcribas ni traduzcas en árabe, inglés ni ningún otro idioma. Todo lo que dice el usuario está en español.
2. **SALUDO INICIAL Y PASO PREVIO OBLIGATORIO (IDENTIFICACIÓN COMPLETA DEL TRABAJADOR):** En tu primera intervención saluda cordialmente y PREGUNTA de inmediato: "¿Es una auto-evaluación de tu propio puesto o evalúas a un compañero? Confírmame tu nombre completo, número de cédula, cargo y qué actividad principal realizas." NUNCA invoques herramientas de informe en el saludo y NUNCA pidas posturas en tu primer turno. Si el usuario no te da su nombre o cédula, insiste amablemente en pedirlos antes de pasar al Paso 1 para poder vincular el expediente oficial de la empresa.
3. **CONDUCE LA EVALUACIÓN TRAS EL CONTEXTO:** Una vez que el usuario te responda indicando su nombre, cédula, cargo y actividad, valida en una sola frase breve y entusiasta (ej: "¡Perfecto! Expediente preparado para [Nombre]") y da inicio al Paso 1 (Postura Habitual / Línea Base), invocando de inmediato la herramienta 'cambiar_fase_evaluacion' con fase: 1.
   **REGLA DE CAPTURA Y TRANSICIÓN:** En cada paso, explica la postura y solicita al usuario confirmar diciendo "Listo", "Ya" o pulsando el botón de la cámara. NUNCA avances de fase ni captures la imagen solo; espera siempre la confirmación del usuario ("Listo", "Ya", "Adelante") o el aviso del botón de captura antes de avanzar al siguiente paso.
4. **RETROALIMENTACIÓN BIOMECÁNICA PRECISA:** Menciona los ángulos articulares medidos en cámara (cuello, tronco, brazos) y brinda correcciones físicas inmediatas.
5. **CERO CUESTIONARIOS ADMINISTRATIVOS ADICIONALES:** Prohibido preguntar por ARL, tamaño de empresa o porcentajes de implementación. Limítate exclusivamente a preguntar cargo y actividad al inicio y luego concéntrate en la observación de campo.
6. **RESPUESTAS HABLADAS CONCISAS:** Respuestas habladas claras y pedagógicas (2 a 4 oraciones por turno). Sin formato Markdown ni HTML en voz.
7. **GENERACIÓN DE INFORME:** NUNCA generes el informe durante el saludo ni en los pasos 1 o 2. Solo debes invocar 'generar_informe_tecnico' al concluir las 3 fases O cuando el usuario te ordene explícitamente generar el informe ('haz el informe', 'genera el reporte', 'dame el informe').
`
            : `
[DIRECTIVAS DE INTERACCIÓN EN VIVO POR VOZ Y VIDEO - ESPECIALISTA ${agentProtocol.title.toUpperCase()}]:
1. **IDIOMA EXCLUSIVO: ESPAÑOL.** El usuario y tú se comunican SIEMPRE en español de Colombia/Latinoamérica. NUNCA respondas, transcribas ni traduzcas en árabe, inglés ni ningún otro idioma. Todo lo que dice el usuario está en español.
2. **SALUDO INICIAL Y CONTEXTO DEL ROL:** Saluda cordialmente según tu rol de especialista (${agentObj?.name || agentProtocol.title}) y pregunta en qué puedes asesorar o qué duda, equipo o área desea revisar hoy el usuario.
3. **ASESORÍA EN VIVO SEGÚN TU ROL (SIN FASES):** Atiende al usuario según tu especialidad técnica (${agentObj?.name || agentProtocol.title}). Observa por la cámara lo que el usuario te muestre, analiza riesgos, condiciones o normativas colombianas aplicables y responde de inmediato a sus preguntas. NO hables de fases, etapas ni autoevaluación (las fases son exclusivas de la evaluación biomecánica ergonómica).
4. **CERO CONFUSIÓN DE ROLES:** No hables de ángulos corporales, ni RULA, ni REBA ni de posturas. Céntrate 100% en tu especialidad (${agentProtocol.title}).
5. **RESPUESTAS HABLADAS CONCISAS:** Respuestas habladas directas, pedagógicas y técnicas (2 a 4 oraciones por turno). Sin Markdown ni HTML en la voz.
6. **GENERACIÓN DE INFORME:** Si el usuario te solicita expresamente compilar un reporte o informe técnico con los hallazgos observados, invoca 'generar_informe_tecnico'.
`;

        config.systemInstruction = `
${domainKnowledge}

${liveDirectives}
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
    formatScreenRouteHuman,
    shouldRedirectReportToSgsstApp,
    build16kMonoWavFromPcmChunks,
    calculatePcm16LeRms,
    applyDomainPhoneticCorrections,
    WAPPY_DICTATION_CUSTOM_VOCABULARY,
};
