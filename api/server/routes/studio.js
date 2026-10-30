'use strict';

const express = require('express');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const axios = require('axios');
const passport = require('passport');
const router = express.Router();
const { logger } = require('~/config');
const { resolveApiKeys, generateWithKeyRotation } = require('./sgsst/sgsstGemini');
const geminiPoolManager = require('~/server/services/GeminiPoolManager');
const {
  ARCHETYPE_ROTATION,
  resolveArchetypeFromEffect,
  alignTimelineMapWithWavBuffer,
  buildSmartScenePlanFromScript,
  generateCreativeScenePlanWithAi,
  compileAntigravityMasterReelHtml,
} = require('./wappyReelEngine');

let mcpBridge = null;
try {
  mcpBridge = require('./mcpBridge');
} catch (_) {
  /* optional bridge reference */
}

/**
 * Middleware de autenticación flexible para WAPPY Studio:
 * - Acepta token JWT en header Authorization o query ?token= (para EventSource SSE)
 * - Acepta claves de Antigravity por usuario (`wpy_live_...`) o visitante (`wpy_guest_...`) vía header/query/body
 * - Si el token es válido hidrata req.user; si aún se está refrescando, permite usar las claves del sistema (resolveApiKeys) y nunca devuelve texto plano "Unauthorized".
 */
const studioAuth = (req, res, next) => {
  if (!req.headers.authorization && req.query && req.query.token) {
    req.headers.authorization = `Bearer ${req.query.token}`;
  }
  passport.authenticate('jwt', { session: false }, async (err, user) => {
    if (!err && user) {
      user.id = String(user._id || user.id);
      req.user = user;
      return next();
    }

    // Si es visitante o pasa su clave wpy_live_... / wpy_guest_... en header, query o body
    const authHeader = req.headers.authorization || '';
    const bearerWpy = authHeader.toLowerCase().startsWith('bearer wpy_')
      ? authHeader.slice(7).trim()
      : null;
    const rawWpyKey =
      req.headers['x-antigravity-api-key'] ||
      req.headers['x-api-key'] ||
      (typeof req.query?.apiKey === 'string' ? req.query.apiKey.trim() : null) ||
      (typeof req.body?.antigravityApiKey === 'string' ? req.body.antigravityApiKey.trim() : null) ||
      (typeof req.body?.apiKey === 'string' && req.body.apiKey.trim().startsWith('wpy_') ? req.body.apiKey.trim() : null) ||
      (typeof req.body?.guestKey === 'string' && req.body.guestKey.trim().startsWith('wpy_guest_') ? req.body.guestKey.trim() : null) ||
      bearerWpy;

    if (rawWpyKey && mcpBridge && typeof mcpBridge.authenticateApiKey === 'function') {
      try {
        const keyAuth = await mcpBridge.authenticateApiKey(rawWpyKey);
        if (keyAuth && keyAuth.user) {
          req.user = keyAuth.user;
          req.apiKey = keyAuth.apiKey;
        }
      } catch (_) {}
    }

    return next();
  })(req, res, next);
};

/**
 * Catálogo oficial de metadatos de Modelos Gemini TTS (cargados dinámicamente desde GOOGLE_MODELS en .env)
 */
const STUDIO_MODELS_METADATA = {
  'gemini-3.8-flash-tts': {
    id: 'gemini-3.8-flash-tts',
    name: 'Gemini 3.8 Flash TTS',
    badge: 'Recomendado / Cuota Activa',
    badgeColor: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border-indigo-500/30',
    rateLimitLabel: '3 RPM • 10 RPD',
    quotaLabel: '✓ Activo (14 voces)',
    description:
      'Máxima fluidez natural, diseño de voz, vocal bursts (<breath>, <laugh>) y soporte para las 14 voces.',
    supportsMultiSpeaker: true,
    supportsVocalBursts: true,
    supportedVoices: [
      'Kore',
      'Puck',
      'Charon',
      'Fenrir',
      'Zephyr',
      'Orus',
      'Aoede',
      'Leda',
      'Callisto',
      'Europa',
      'Ganymede',
      'Io',
      'Titan',
      'Prometheus',
    ],
  },
  'gemini-3.1-flash-tts-preview': {
    id: 'gemini-3.1-flash-tts-preview',
    name: 'Gemini 3.1 Flash TTS Preview',
    badge: 'Preview 3.1 / Cuota Activa',
    badgeColor: 'bg-purple-500/15 text-purple-600 dark:text-purple-300 border-purple-500/30',
    rateLimitLabel: '3 RPM • 10 RPD',
    quotaLabel: '14 voces',
    description:
      'Arquitectura Gemini 3.1 con prosodia refinada, tono expresivo y respuesta ágil (14 voces).',
    supportsMultiSpeaker: true,
    supportsVocalBursts: true,
    supportedVoices: [
      'Kore',
      'Puck',
      'Charon',
      'Fenrir',
      'Zephyr',
      'Orus',
      'Aoede',
      'Leda',
      'Callisto',
      'Europa',
      'Ganymede',
      'Io',
      'Titan',
      'Prometheus',
    ],
  },
  'gemini-2.5-flash-preview-tts': {
    id: 'gemini-2.5-flash-preview-tts',
    name: 'Gemini 2.5 Flash TTS',
    badge: 'Reemplazo de 2.5 Pro',
    badgeColor: 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30',
    rateLimitLabel: '3 RPM • 10 RPD (2.5 Pro: 0/0)',
    quotaLabel: '5 voces',
    description:
      'Reemplazo oficial y funcional de 2.5 Pro (no disponible en API). Activa únicamente las 5 voces fundamentales.',
    supportsMultiSpeaker: true,
    supportsVocalBursts: false,
    supportedVoices: ['Kore', 'Puck', 'Charon', 'Fenrir', 'Aoede'],
  },
  'gemini-3.8-flash-lite-tts': {
    id: 'gemini-3.8-flash-lite-tts',
    name: 'Gemini 3.8 Flash-Lite TTS',
    badge: 'Ultra Rápido',
    badgeColor: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30',
    rateLimitLabel: 'Baja Latencia',
    quotaLabel: '6 voces',
    description:
      'Optimizado para lecturas masivas con mínima latencia continua (6 voces rápidas).',
    supportsMultiSpeaker: false,
    supportsVocalBursts: true,
    supportedVoices: ['Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr', 'Aoede'],
  },
};

function getEnvGoogleModelsList() {
  const defaultEnv =
    'gemini-3.6-flash,gemini-3.5-flash-lite,gemini-3.8-flash,gemini-3.8-live,gemini-3.1-flash-live-preview,gemini-2.5-flash-native-audio-preview-12-2025,gemini-3.8-flash-tts,gemini-3.1-flash-tts-preview,gemini-2.5-flash-preview-tts,gemini-3.8-flash-lite-tts';
  return (process.env.GOOGLE_MODELS || defaultEnv)
    .split(',')
    .map((m) => m.trim().replace('models/', ''))
    .filter(Boolean);
}

function getStudioTtsModelsFromEnv() {
  const envTtsIds = getEnvGoogleModelsList().filter((m) => m.includes('tts'));
  const orderedIds =
    envTtsIds.length > 0
      ? envTtsIds
      : [
          'gemini-3.8-flash-tts',
          'gemini-3.1-flash-tts-preview',
          'gemini-2.5-flash-preview-tts',
          'gemini-3.8-flash-lite-tts',
        ];
  return orderedIds.map(
    (id) =>
      STUDIO_MODELS_METADATA[id] || {
        id,
        name: id,
        badge: 'GOOGLE_MODELS',
        badgeColor: 'bg-teal-500/15 text-teal-600 dark:text-teal-300 border-teal-500/30',
        rateLimitLabel: '3 RPM • 10 RPD',
        quotaLabel: '14 voces',
        description: `Modelo TTS configurado en GOOGLE_MODELS (${id}).`,
        supportsMultiSpeaker: !id.includes('lite'),
        supportsVocalBursts: !id.includes('2.5'),
        supportedVoices: [
          'Kore',
          'Puck',
          'Charon',
          'Fenrir',
          'Zephyr',
          'Orus',
          'Aoede',
          'Leda',
          'Callisto',
          'Europa',
          'Ganymede',
          'Io',
          'Titan',
          'Prometheus',
        ],
      },
  );
}

function getStudioTextModelsFromEnv() {
  const fastDefaults = ['gemini-3.5-flash-lite', 'gemini-3.6-flash'];
  const envTextIds = getEnvGoogleModelsList().filter(
    (m) =>
      !m.includes('live') &&
      !m.includes('native-audio') &&
      !m.includes('tts') &&
      !m.includes('transcribe') &&
      !m.includes('2.5') &&
      !m.includes('3.8-flash'),
  );
  return Array.from(new Set([...fastDefaults, ...envTextIds]));
}

function resolveStudioFastTextModels(preferredModel = '') {
  const cleanPref = String(preferredModel || '')
    .replace(/^models\//i, '')
    .trim();
  const isValidTextPref =
    cleanPref &&
    !cleanPref.includes('tts') &&
    !cleanPref.includes('live') &&
    !cleanPref.includes('native-audio') &&
    !cleanPref.includes('transcribe') &&
    !cleanPref.includes('2.5') &&
    !cleanPref.includes('3.8-flash');

  const baseList = getStudioTextModelsFromEnv();
  return isValidTextPref ? Array.from(new Set([cleanPref, ...baseList])) : baseList;
}

const STUDIO_VOICES = [
  {
    id: 'Kore',
    name: 'Kore',
    gender: 'Femenino',
    tone: 'Cálida, Serena y Profesional',
    recommendedFor: 'Audiolibros, Narración, Tutoriales, Inducción SST',
    tag: 'Más popular',
  },
  {
    id: 'Puck',
    name: 'Puck',
    gender: 'Masculino',
    tone: 'Enérgico, Dinámico y Joven',
    recommendedFor: 'Podcasts, Reels, Contenido Creativo, Diálogos',
    tag: 'Muy expresivo',
  },
  {
    id: 'Charon',
    name: 'Charon',
    gender: 'Masculino',
    tone: 'Barítono, Grave, Maduro y Solemne',
    recommendedFor: 'Documentales, Historia, Suspenso, Directivos',
    tag: 'Voz profunda',
  },
  {
    id: 'Fenrir',
    name: 'Fenrir',
    gender: 'Masculino',
    tone: 'Claro, Elocuente y Periodístico',
    recommendedFor: 'Noticias, Informes, Presentaciones, Boletines',
    tag: 'Profesional',
  },
  {
    id: 'Zephyr',
    name: 'Zephyr',
    gender: 'Femenino',
    tone: 'Dulce, Aterciopelada y Relajante',
    recommendedFor: 'Meditación, ASMR, Cuentos, Bienestar',
    tag: 'Calma',
  },
  {
    id: 'Orus',
    name: 'Orus',
    gender: 'Masculino',
    tone: 'Firme, Imperial, Épico y Reflexivo',
    recommendedFor: 'Ficción Épica, Liderazgo, Ensayos, Cultura Vial',
    tag: 'Imperial',
  },
  {
    id: 'Aoede',
    name: 'Aoede',
    gender: 'Femenino',
    tone: 'Melódica, Expresiva, Artística y Cálida',
    recommendedFor: 'Poesía, Literatura, Storytelling, Sensibilización',
    tag: 'Melódica',
  },
  {
    id: 'Leda',
    name: 'Leda',
    gender: 'Femenino',
    tone: 'Cercana, Maternal, Madura y Envolvente',
    recommendedFor: 'Audiolibros Largos, Relatos, Bienvenida',
    tag: 'Narradora',
  },
  {
    id: 'Callisto',
    name: 'Callisto',
    gender: 'Femenino',
    tone: 'Elegante, Sofisticada y Articulada',
    recommendedFor: 'Divulgación Científica, Conferencias, Auditorías',
    tag: 'Sofisticada',
  },
  {
    id: 'Europa',
    name: 'Europa',
    gender: 'Femenino',
    tone: 'Brillante, Luminosa, Alegre y Asertiva',
    recommendedFor: 'Marketing, Anuncios, E-Learning, Campañas',
    tag: 'Enérgica',
  },
  {
    id: 'Ganymede',
    name: 'Ganymede',
    gender: 'Masculino',
    tone: 'Resonante, Equilibrado, Sabio y Seguro',
    recommendedFor: 'Educación Superior, Cursos, Capacitación Técnica',
    tag: 'Resonante',
  },
  {
    id: 'Io',
    name: 'Io',
    gender: 'Femenino',
    tone: 'Vivaz, Espontánea, Fresca y Amigable',
    recommendedFor: 'Redes Sociales, Vlogs, Asistentes, Reels',
    tag: 'Fresca',
  },
  {
    id: 'Titan',
    name: 'Titan',
    gender: 'Masculino',
    tone: 'Imponente, Cinematográfico y Potente',
    recommendedFor: 'Tráilers, Introducciones, Impacto, Alertas',
    tag: 'Cinematográfica',
  },
  {
    id: 'Prometheus',
    name: 'Prometheus',
    gender: 'Masculino',
    tone: 'Noble, Pensativo, Filosófico y Clásico',
    recommendedFor: 'Filosofía, Análisis Profundo, Crónicas',
    tag: 'Sabio',
  },
];

const STUDIO_PRESETS = [
  {
    id: 'orus-solemn',
    name: 'Narración Solemne (Orus)',
    voiceName: 'Orus',
    style:
      'Voz firme, templada, reflexiva y madura de narrador de crónica histórica, dicción solemne, pausas medidas y respiraciones naturales.',
    speed: '0.95x',
  },
  {
    id: 'aoede-poetic',
    name: 'Cuento Poético (Aoede)',
    voiceName: 'Aoede',
    style:
      'Voz melódica, cálida, expresiva y artística para relato literario y sensibilización, con matices emocionales suaves.',
    speed: '0.95x',
  },
  {
    id: 'titan-trailer',
    name: 'Tráiler Cinematográfico (Titan)',
    voiceName: 'Titan',
    style:
      'Voz imponente, profunda, cinematográfica y épica de tráiler de película, con pausas dramáticas e impacto.',
    speed: '0.95x',
  },
  {
    id: 'kore-audiobook',
    name: 'Narrador de Audiolibro (Kore)',
    voiceName: 'Kore',
    style:
      'Voz cálida, serena, clara y envolvente de narradora profesional de audiolibros y cursos formativos, con ritmo fluido.',
    speed: '1.0x',
  },
  {
    id: 'puck-podcast',
    name: 'Host de Podcast Dinámico (Puck)',
    voiceName: 'Puck',
    style:
      'Host de podcast carismático, enérgico, cercano y espontáneo, con entonación conversacional moderna.',
    speed: '1.05x',
  },
  {
    id: 'charon-documentary',
    name: 'Documental Profundo (Charon)',
    voiceName: 'Charon',
    style:
      'Tono barítono, solemne, reflexivo y cinematográfico de narrador de documental, con pausas medidas.',
    speed: '0.95x',
  },
  {
    id: 'fenrir-news',
    name: 'Noticiero Profesional (Fenrir)',
    voiceName: 'Fenrir',
    style:
      'Periodista claro, objetivo, seguro y elocuente de noticiero central, dicción neutral y fluida.',
    speed: '1.05x',
  },
  {
    id: 'zephyr-asmr',
    name: 'Meditación y ASMR (Zephyr)',
    voiceName: 'Zephyr',
    style:
      'Voz suave, serena, dulce y sumamente relajante para meditación guiada, mindfulness y bienestar.',
    speed: '0.9x',
  },
  {
    id: 'screenplay-dialogue',
    name: 'Guion / Diálogo Alex & Sam',
    voiceName: 'Kore',
    multiSpeaker: true,
    speaker1: { name: 'Alex', voiceName: 'Puck', style: 'Entusiasta y curioso' },
    speaker2: { name: 'Sam', voiceName: 'Kore', style: 'Experta, clara y cercana' },
    style: 'Diálogo interactivo de podcast entre dos especialistas con alternancia natural.',
    speed: '1.0x',
  },
];

const STUDIO_VOCAL_BURSTS = [
  {
    tag: '<breath>',
    label: 'Respiración natural',
    description: 'Inserta una toma de aire orgánica entre frases',
  },
  {
    tag: '<laugh>',
    label: 'Risa / Carcajada',
    description: 'Añade una risa espontánea o carcajada suave',
  },
  {
    tag: '<gasp>',
    label: 'Sorpresa / Jadear',
    description: 'Efecto de inhalación rápida de asombro',
  },
  {
    tag: '|mhm|',
    label: 'Asentimiento (|mhm|)',
    description: 'Confirmación conversacional natural',
  },
  {
    tag: '|yeah|',
    label: 'Aceptación (|yeah|)',
    description: 'Interjección de acuerdo en diálogos',
  },
];

/**
 * Almacén en memoria para trabajos asíncronos de larga duración (hasta 60 min)
 * con limpieza automática tras 2 horas para no ocupar RAM en el VPS.
 */
const activeJobs = new Map();

function cleanupOldJobs() {
  const now = Date.now();
  const MAX_AGE_MS = 2 * 60 * 60 * 1000; // 2 horas
  for (const [jobId, job] of activeJobs.entries()) {
    if (now - job.createdAt > MAX_AGE_MS) {
      activeJobs.delete(jobId);
    }
  }
}

setInterval(cleanupOldJobs, 15 * 60 * 1000).unref();

/**
 * Extrae claves personalizadas enviadas desde el cliente (si las hay) y las combina
 * con las claves del usuario/sistema en WAPPY (`resolveApiKeys`).
 */
async function getCombinedKeysForRequest(req, bodyCustomKeys) {
  const customList = [];

  const headerRaw = req.headers['x-gemini-api-keys'];
  if (headerRaw) {
    // Acepta JSON (["k1","k2"]) o texto separado por comas ("k1,k2") que envía el cliente
    let headerList = [];
    try {
      const parsed = JSON.parse(headerRaw);
      headerList = Array.isArray(parsed) ? parsed : [];
    } catch {
      headerList = String(headerRaw).split(',');
    }
    for (const k of headerList) {
      if (typeof k === 'string' && k.trim().length > 8 && !customList.includes(k.trim())) {
        customList.push(k.trim());
      }
    }
  }

  const candidateArrays = [
    bodyCustomKeys,
    req.body?.customKeys,
    req.body?.apiKeys,
  ];
  for (const arr of candidateArrays) {
    if (Array.isArray(arr)) {
      for (const k of arr) {
        if (typeof k === 'string' && k.trim().length > 8 && !customList.includes(k.trim())) {
          customList.push(k.trim());
        }
      }
    }
  }

  let systemOrUserKeys = [];
  try {
    systemOrUserKeys = await resolveApiKeys(req.user);
  } catch (err) {
    logger.debug(`[WappyStudio] No user/system keys resolved: ${err.message}`);
  }

  // Garantizar que el pool completo de claves de los administradores del sistema esté disponible
  // incluso cuando se invoca desde /wappystudio sin token en localStorage o cuando getSystemGoogleKey() solo devolvió 1 clave
  if (systemOrUserKeys.length <= 1) {
    try {
      const mongoose = require('mongoose');
      const { getUserKey } = require('~/server/services/UserService');
      const User = mongoose.models?.User || mongoose.model('User');
      const admins = await User.find({ role: 'ADMIN' }).select('_id').lean();
      for (const admin of admins || []) {
        for (const keyName of ['google', 'tenshi_google']) {
          try {
            const stored = await getUserKey({ userId: String(admin._id), name: keyName });
            const extracted = geminiPoolManager.extractCleanApiKeys(stored);
            for (const ak of extracted) {
              if (ak && !systemOrUserKeys.includes(ak)) {
                systemOrUserKeys.push(ak);
              }
            }
          } catch (_) {
            /* ignore */
          }
        }
      }
    } catch (poolErr) {
      logger.debug(`[WappyStudio] Admin pool expansion skipped: ${poolErr.message}`);
    }
  }

  const envFallbackRaw = [process.env.GOOGLE_KEY, process.env.GEMINI_API_KEY]
    .filter(Boolean)
    .join(',');
  const envFallbackKeys = envFallbackRaw
    .split(',')
    .map((k) => k.trim())
    .filter((k) => k.length > 8 && k !== 'user_provided');

  const combined = [...customList];
  for (const k of [...systemOrUserKeys, ...envFallbackKeys]) {
    if (k && !combined.includes(k)) {
      combined.push(k);
    }
  }
  return {
    customKeysCount: customList.length,
    systemKeysCount: combined.length - customList.length,
    allKeys: combined,
  };
}

/**
 * Limpia cualquier directriz o metadato de estilo residual que el usuario o el sistema
 * haya podido pegar o arrastrar dentro del texto del guión, garantizando que Gemini TTS
 * NUNCA lea instrucciones en voz alta como parte de la locución.
 */
function sanitizeScriptText(rawText) {
  if (!rawText) return '';
  let clean = String(rawText).trim();

  // 1. Eliminar formato con paréntesis: "Lee en voz alta con el siguiente estilo (...):\n\nTexto"
  clean = clean.replace(/^(?:(?:por\s+favor\s+)?(?:lee|habla|locuta|interpreta|recita|say|read|speak)\s+(?:esto\s+)?(?:en\s+voz\s+alta\s+)?(?:con\s+el\s+siguiente\s+estilo|con\s+estilo)?\s*\([^)]*\)[\s:—–-]*)/i, '');

  // 2. Eliminar directivas en su propia línea: "Lee en voz alta con el siguiente estilo: ...\n\nTexto"
  clean = clean.replace(/^(?:(?:por\s+favor\s+)?(?:lee|habla|locuta|interpreta|recita|say|read|speak)\s+(?:esto\s+)?(?:en\s+voz\s+alta\s+)?(?:con\s+el\s+siguiente\s+estilo|con\s+estilo)?[^:\n]*:[^\n]*(?:\n+|$))/i, '');

  // 3. Eliminar etiquetas de estilo o directrices de director
  clean = clean.replace(/^(?:directrices?\s+de\s+estilo|estilo|style|tono|tone|director['’]?s\s*notes?)[\s:—–-]+(?:[^\n]+(?:\n+|$))/i, '');
  clean = clean.replace(/^\[(?:estilo|style|instrucciones|director|notas?):[^\]]+\]\s*/i, '');

  return clean.trim();
}

/**
 * Divide un texto largo en fragmentos (chunks) respetando saltos de párrafo y oraciones
 */
function splitTextIntoChunks(text, maxWordsPerChunk = 150) {
  const clean = sanitizeScriptText(text);
  if (!clean) return [];

  const safeLimit = Math.max(40, Math.min(300, Number(maxWordsPerChunk) || 150));
  const paragraphs = clean.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

  const chunks = [];
  let currentWords = [];

  const flushCurrent = () => {
    if (currentWords.length > 0) {
      const chunkText = currentWords.join(' ').trim();
      chunks.push({
        index: chunks.length,
        text: chunkText,
        wordCount: currentWords.length,
        snippet: chunkText.length > 90 ? `${chunkText.slice(0, 90)}...` : chunkText,
      });
      currentWords = [];
    }
  };

  for (const para of paragraphs) {
    // Dividir por fin de oración manteniendo signos de puntuación
    const sentences = para.split(/(?<=[.!?…])\s+/);
    for (const sentence of sentences) {
      const words = sentence.trim().split(/\s+/).filter(Boolean);
      if (words.length === 0) continue;

      if (currentWords.length + words.length <= safeLimit) {
        currentWords.push(...words);
      } else if (words.length > safeLimit) {
        flushCurrent();
        for (let i = 0; i < words.length; i += safeLimit) {
          const slice = words.slice(i, i + safeLimit);
          chunks.push({
            index: chunks.length,
            text: slice.join(' '),
            wordCount: slice.length,
            snippet: slice.join(' ').slice(0, 90),
          });
        }
      } else {
        flushCurrent();
        currentWords.push(...words);
      }
    }
  }

  flushCurrent();
  return chunks;
}

/**
 * Crea un encabezado RIFF/WAVE de 44 bytes para envolver audio PCM crudo (24kHz, 16-bit, mono)
 */
function createWavHeader(pcmByteLength, sampleRate = 24000, numChannels = 1, bitsPerSample = 16) {
  const header = Buffer.alloc(44);
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;

  header.write('RIFF', 0);
  header.writeUInt32LE(36 + pcmByteLength, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  header.writeUInt16LE(1, 20); // AudioFormat (1 = PCM)
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(pcmByteLength, 40);

  return header;
}

/**
 * Extrae limpiamente el flujo PCM y parámetros del formato de un buffer WAV/RIFF
 * navegando la estructura de subchunks ('fmt ', 'data') en lugar de asumir 44 bytes ciegos.
 */
function extractPcmFromBuffer(rawBuffer, fallbackSampleRate = 24000) {
  if (!rawBuffer || rawBuffer.length === 0) {
    throw new Error('Buffer de audio vacío devuelto por Gemini TTS.');
  }

  const isRiffWav =
    rawBuffer.length > 44 &&
    rawBuffer.slice(0, 4).toString('ascii') === 'RIFF' &&
    rawBuffer.slice(8, 12).toString('ascii') === 'WAVE';

  let pcmBuffer;
  let sampleRate = fallbackSampleRate;
  let numChannels = 1;
  let bitsPerSample = 16;

  if (isRiffWav) {
    let offset = 12;
    let dataOffset = -1;
    let dataSize = -1;

    while (offset + 8 <= rawBuffer.length) {
      const chunkId = rawBuffer.slice(offset, offset + 4).toString('ascii');
      const chunkSize = rawBuffer.readUInt32LE(offset + 4);

      if (chunkId === 'fmt ') {
        if (chunkSize >= 16 && offset + 8 + 16 <= rawBuffer.length) {
          numChannels = rawBuffer.readUInt16LE(offset + 8 + 2) || 1;
          sampleRate = rawBuffer.readUInt32LE(offset + 8 + 4) || fallbackSampleRate;
          bitsPerSample = rawBuffer.readUInt16LE(offset + 8 + 14) || 16;
        }
      } else if (chunkId === 'data') {
        dataOffset = offset + 8;
        dataSize = Math.min(chunkSize, rawBuffer.length - dataOffset);
        break;
      }

      offset += 8 + chunkSize + (chunkSize % 2);
    }

    if (dataOffset !== -1 && dataSize > 0) {
      pcmBuffer = rawBuffer.slice(dataOffset, dataOffset + dataSize);
    } else {
      pcmBuffer = rawBuffer.slice(44);
    }
  } else {
    pcmBuffer = rawBuffer;
  }

  // Asegurar alineación par de 16 bits (2 bytes por muestra)
  if (pcmBuffer.length % 2 !== 0) {
    pcmBuffer = pcmBuffer.slice(0, pcmBuffer.length - 1);
  }

  return { pcmBuffer, sampleRate, numChannels, bitsPerSample };
}

/**
 * Aplica micro-fade in y micro-fade out (15-20ms) a un buffer PCM 16-bit LE
 * garantizando cruce por cero en los extremos y eliminando cualquier clic/pop en los cortes.
 */
function applyMicroFadeToPcm(pcmBuffer, sampleRate = 24000, fadeDurationMs = 20) {
  if (!pcmBuffer || pcmBuffer.length < 4) return pcmBuffer;

  const bytesPerSample = 2; // 16-bit LE
  const totalSamples = Math.floor(pcmBuffer.length / bytesPerSample);
  const fadeSamples = Math.min(Math.floor((sampleRate * fadeDurationMs) / 1000), Math.floor(totalSamples / 4));

  if (fadeSamples <= 0) return pcmBuffer;

  const result = Buffer.from(pcmBuffer);

  // Fade-in lineal
  for (let i = 0; i < fadeSamples; i++) {
    const factor = i / fadeSamples;
    const sample = result.readInt16LE(i * bytesPerSample);
    const smoothed = Math.round(sample * factor);
    result.writeInt16LE(Math.max(-32768, Math.min(32767, smoothed)), i * bytesPerSample);
  }

  // Fade-out lineal
  for (let i = 0; i < fadeSamples; i++) {
    const factor = (fadeSamples - 1 - i) / fadeSamples;
    const sampleIndex = totalSamples - fadeSamples + i;
    const sample = result.readInt16LE(sampleIndex * bytesPerSample);
    const smoothed = Math.round(sample * factor);
    result.writeInt16LE(Math.max(-32768, Math.min(32767, smoothed)), sampleIndex * bytesPerSample);
  }

  return result;
}

/**
 * Aplica una rampa de desvanecimiento suave (fade out) a los últimos milisegundos de un buffer PCM
 */
function applyFinalTailFade(pcmBuffer, sampleRate = 24000, fadeDurationMs = 35) {
  if (!pcmBuffer || pcmBuffer.length < 4) return pcmBuffer;

  const bytesPerSample = 2;
  const totalSamples = Math.floor(pcmBuffer.length / bytesPerSample);
  const fadeSamples = Math.min(Math.floor((sampleRate * fadeDurationMs) / 1000), Math.floor(totalSamples / 2));

  if (fadeSamples <= 0) return pcmBuffer;

  const result = Buffer.from(pcmBuffer);

  for (let i = 0; i < fadeSamples; i++) {
    const factor = (fadeSamples - 1 - i) / fadeSamples;
    const sampleIndex = totalSamples - fadeSamples + i;
    const sample = result.readInt16LE(sampleIndex * bytesPerSample);
    const smoothed = Math.round(sample * factor);
    result.writeInt16LE(Math.max(-32768, Math.min(32767, smoothed)), sampleIndex * bytesPerSample);
  }

  return result;
}

/**
 * Genera un buffer de silencio digital PCM 16-bit (ceros) para pausas naturales entre fragmentos
 */
function createPcmSilence(durationMs = 220, sampleRate = 24000) {
  const bytesPerSample = 2;
  const sampleCount = Math.floor((sampleRate * durationMs) / 1000);
  return Buffer.alloc(sampleCount * bytesPerSample);
}

/**
 * Garantiza que un buffer de audio tenga cabecera WAV estándar, muestras alineadas y micro-fade anti-pop
 */
function normalizeAudioBufferToWav(rawBuffer, fallbackSampleRate = 24000) {
  const { pcmBuffer: rawPcm, sampleRate, numChannels, bitsPerSample } = extractPcmFromBuffer(
    rawBuffer,
    fallbackSampleRate,
  );

  // Aplicar micro-fade para garantizar que no haya clics en bordes
  const pcmBuffer = applyMicroFadeToPcm(rawPcm, sampleRate, 18);

  const header = createWavHeader(pcmBuffer.length, sampleRate, numChannels, bitsPerSample);
  const wavBuffer = Buffer.concat([header, pcmBuffer]);

  const bytesPerSecond = (sampleRate * numChannels * bitsPerSample) / 8;
  const durationSeconds = Math.max(
    1,
    Math.round((pcmBuffer.length / bytesPerSecond) * 10) / 10,
  );

  return { wavBuffer, pcmBuffer, durationSeconds, sampleRate };
}

/**
 * Obtiene los modelos TTS en orden de respaldo desde GOOGLE_MODELS en .env
 */
function getTtsFallbackModelIds() {
  return getStudioTtsModelsFromEnv().map((m) => m.id);
}

const FUNDAMENTAL_VOICES_2_5 = ['Kore', 'Puck', 'Charon', 'Fenrir', 'Aoede'];

function resolveCompatibleVoice(voiceName, modelId) {
  const cleanVoice = (voiceName || 'Kore').trim();
  if (modelId.includes('2.5')) {
    return FUNDAMENTAL_VOICES_2_5.includes(cleanVoice) ? cleanVoice : 'Kore';
  }
  if (modelId.includes('lite')) {
    const liteVoices = ['Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr', 'Aoede'];
    return liteVoices.includes(cleanVoice) ? cleanVoice : 'Kore';
  }
  return cleanVoice;
}

/**
 * Construye las partes (`contents[0].parts`) compatibles al 100% con el esquema Protobuf REST v1beta de Gemini TTS:
 * - En modo 1 Voz (Single-Speaker): envía `[{ text }]` limpio sin `speech_metadata` (evita el error 400 y ahorra 1 round-trip completo).
 * - En modo 2 Voces (Multi-Speaker): asigna `speech_metadata: { speaker }` a cada intervención de `Alex` / `Sam`
 *   (y si el usuario dejó activo el modo diálogo en un texto normal sin prefijos `Alex:`/`Sam:`, alterna las oraciones automáticamente entre ambos hablantes para que jamás falle con error 400).
 */
function buildGeminiTtsPayloadParts(
  cleanText,
  { multiSpeaker = false, speaker1Name = 'Alex', speaker2Name = 'Sam', supportsMultiSpeaker = true } = {},
) {
  if (!multiSpeaker || !supportsMultiSpeaker) {
    return {
      useMultiSpeaker: false,
      parts: [{ text: cleanText }],
      inlineText: cleanText,
    };
  }

  const s1 = (speaker1Name || 'Alex').trim();
  const s2 = (speaker2Name || 'Sam').trim();
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const turnRegex = new RegExp(
    `(?:^|\\n)\\s*(${esc(s1)}|${esc(s2)}|Hablante\\s*1|Hablante\\s*2|Speaker\\s*1|Speaker\\s*2)\\s*:\\s*`,
    'gi',
  );

  const turns = [];
  const matches = Array.from(cleanText.matchAll(turnRegex));

  if (matches.length > 0) {
    // Si hay texto previo antes de la primera etiqueta de hablante, asignarlo al hablante 1
    const firstIdx = matches[0].index || 0;
    const leadingText = cleanText.slice(0, firstIdx).trim();
    if (leadingText) {
      turns.push({ speaker: s1, text: leadingText });
    }
    for (let i = 0; i < matches.length; i++) {
      const m = matches[i];
      const rawSpeaker = (m[1] || '').trim().toLowerCase();
      const speaker =
        rawSpeaker === s2.toLowerCase() || rawSpeaker.endsWith('2') ? s2 : s1;
      const start = (m.index || 0) + m[0].length;
      const end = i + 1 < matches.length ? matches[i + 1].index || cleanText.length : cleanText.length;
      const segmentText = cleanText.slice(start, end).trim();
      if (segmentText) {
        turns.push({ speaker, text: segmentText });
      }
    }
  } else {
    // El usuario activó Modo Diálogo (2 Voces) sobre un guion sin etiquetas Alex:/Sam::
    // dividir por oraciones y alternar entre Alex y Sam automáticamente
    const sentences = cleanText
      .split(/(?<=[.!?…])\s+|\n+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (sentences.length <= 1) {
      return {
        useMultiSpeaker: false,
        parts: [{ text: cleanText }],
        inlineText: cleanText,
      };
    }
    sentences.forEach((sentence, idx) => {
      turns.push({
        speaker: idx % 2 === 0 ? s1 : s2,
        text: sentence,
      });
    });
  }

  if (turns.length === 0) {
    return {
      useMultiSpeaker: false,
      parts: [{ text: cleanText }],
      inlineText: cleanText,
    };
  }

  return {
    useMultiSpeaker: true,
    parts: turns.map((t) => ({
      text: t.text,
      speech_metadata: { speaker: t.speaker },
    })),
    inlineText: turns.map((t) => `${t.speaker}: ${t.text}`).join('\n'),
  };
}

/**
 * Sintetiza un fragmento de texto en Gemini TTS con rotación automática de claves y modelos (desde GOOGLE_MODELS)
 */
async function synthesizeChunkWithFailover({
  text,
  voiceName = 'Kore',
  stylePrompt = '',
  model = 'gemini-3.8-flash-tts',
  multiSpeaker = false,
  speaker1 = { name: 'Alex', voiceName: 'Puck' },
  speaker2 = { name: 'Sam', voiceName: 'Kore' },
  keys = [],
  preferredKeyOffset = 0,
  onFailover,
}) {
  if (!keys || keys.length === 0) {
    throw new Error(
      'No hay claves API de Gemini disponibles. Configura tu clave en el botón "Claves API" o en tu perfil de WAPPY.',
    );
  }

  const cleanText = sanitizeScriptText(text);
  if (!cleanText) {
    throw new Error('El texto a sintetizar no contiene palabras válidas.');
  }

  const envTtsModelIds = getTtsFallbackModelIds();
  const preferredModel = (model || envTtsModelIds[0] || 'gemini-3.8-flash-tts')
    .replace('models/', '')
    .trim();
  const modelsToTry = [
    preferredModel,
    ...envTtsModelIds.filter((m) => m !== preferredModel),
  ];

  let lastError = null;

  for (let mIdx = 0; mIdx < modelsToTry.length; mIdx++) {
    const currentModel = modelsToTry[mIdx];

    for (let kStep = 0; kStep < keys.length; kStep++) {
      const kIdx = (Math.max(0, preferredKeyOffset) + kStep) % keys.length;
      const apiKey = keys[kIdx];
      try {
        const s1Name = speaker1?.name || 'Alex';
        const s2Name = speaker2?.name || 'Sam';
        const payloadSpec = buildGeminiTtsPayloadParts(cleanText, {
          multiSpeaker,
          speaker1Name: s1Name,
          speaker2Name: s2Name,
          supportsMultiSpeaker: !currentModel.includes('lite'),
        });

        let speechConfig;
        if (payloadSpec.useMultiSpeaker) {
          speechConfig = {
            multiSpeakerVoiceConfig: {
              speakerVoiceConfigs: [
                {
                  speaker: s1Name,
                  voiceConfig: {
                    prebuiltVoiceConfig: {
                      voiceName: resolveCompatibleVoice(speaker1?.voiceName || 'Puck', currentModel),
                    },
                  },
                },
                {
                  speaker: s2Name,
                  voiceConfig: {
                    prebuiltVoiceConfig: {
                      voiceName: resolveCompatibleVoice(speaker2?.voiceName || 'Kore', currentModel),
                    },
                  },
                },
              ],
            },
          };
        } else {
          const fallbackVoice = multiSpeaker ? speaker1?.voiceName || voiceName : voiceName;
          speechConfig = {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: resolveCompatibleVoice(fallbackVoice, currentModel),
              },
            },
          };
        }

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent`;

        let response;
        try {
          response = await axios.post(
            url,
            {
              contents: [{ role: 'user', parts: payloadSpec.parts }],
              generationConfig: {
                responseModalities: ['AUDIO'],
                speechConfig,
              },
            },
            {
              headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': apiKey,
              },
              timeout: 55000,
            },
          );
        } catch (apiErr) {
          const apiStatus = apiErr.response?.status || apiErr.status || 0;
          const apiMsg = apiErr.response?.data?.error?.message || apiErr.message || '';
          const msgLow = apiMsg.toLowerCase();

          // Si un modelo específico (ej. 2.5) rechaza speech_metadata.speaker en multiSpeaker, reintentar con texto en línea o voz primaria
          if (
            apiStatus === 400 &&
            payloadSpec.useMultiSpeaker &&
            (msgLow.includes('speech_metadata') || msgLow.includes('multi-speaker') || msgLow.includes('speaker'))
          ) {
            logger.warn(
              `[WappyStudio TTS] Ajustando formato multi-speaker en ${currentModel} para compatibilidad inmediata...`,
            );
            try {
              response = await axios.post(
                url,
                {
                  contents: [{ role: 'user', parts: [{ text: payloadSpec.inlineText }] }],
                  generationConfig: {
                    responseModalities: ['AUDIO'],
                    speechConfig,
                  },
                },
                {
                  headers: {
                    'Content-Type': 'application/json',
                    'x-goog-api-key': apiKey,
                  },
                  timeout: 55000,
                },
              );
            } catch (_) {
              const singleVoiceConfig = {
                voiceConfig: {
                  prebuiltVoiceConfig: {
                    voiceName: resolveCompatibleVoice(speaker1?.voiceName || voiceName, currentModel),
                  },
                },
              };
              response = await axios.post(
                url,
                {
                  contents: [{ role: 'user', parts: [{ text: cleanText.replace(/^(Alex|Sam):\s*/gim, '') }] }],
                  generationConfig: {
                    responseModalities: ['AUDIO'],
                    speechConfig: singleVoiceConfig,
                  },
                },
                {
                  headers: {
                    'Content-Type': 'application/json',
                    'x-goog-api-key': apiKey,
                  },
                  timeout: 55000,
                },
              );
            }
          } else {
            throw apiErr;
          }
        }

        const parts = response.data?.candidates?.[0]?.content?.parts || [];
        const audioPart = parts.find(
          (p) => p.inlineData && p.inlineData.data,
        );

        if (!audioPart) {
          throw new Error('La respuesta de Gemini no incluyó datos de audio (inlineData).');
        }

        const rawBuffer = Buffer.from(audioPart.inlineData.data, 'base64');
        const { wavBuffer, pcmBuffer, durationSeconds } = normalizeAudioBufferToWav(rawBuffer, 24000);

        geminiPoolManager.reportKeySuccess(apiKey, currentModel);

        return {
          wavBuffer,
          pcmBuffer,
          audioBase64: wavBuffer.toString('base64'),
          durationSeconds,
          usedModel: currentModel,
          usedKeyIndex: kIdx,
        };
      } catch (err) {
        const status = err.response?.status || err.status || 0;
        const apiMessage =
          err.response?.data?.error?.message || err.message || 'Error desconocido en Gemini TTS';
        lastError = new Error(apiMessage);

        const msgLower = apiMessage.toLowerCase();
        const isQuotaOrKeyErr =
          status === 429 ||
          status === 403 ||
          (status === 400 && (msgLower.includes('api_key') || msgLower.includes('key not valid')));
        const isModelUnavailable =
          status === 404 ||
          status === 503 ||
          msgLower.includes('not found') ||
          msgLower.includes('overloaded') ||
          msgLower.includes('not supported');

        if (isQuotaOrKeyErr) {
          logger.warn(
            `[WappyStudio TTS] Clave #${kIdx + 1} agotada/rechazada (${status}) en ${currentModel}. Rotando clave...`,
          );
          if (typeof onFailover === 'function' && kIdx + 1 < keys.length) {
            onFailover({
              fromIndex: kIdx,
              toIndex: kIdx + 1,
              label: `Clave #${kIdx + 2}`,
              reason: status === 429 ? 'Límite de cuota 429 alcanzado' : `Estado ${status}`,
            });
          }
          continue;
        }

        if (isModelUnavailable) {
          logger.warn(
            `[WappyStudio TTS] Modelo ${currentModel} no disponible (${status}: ${apiMessage}). Rotando a siguiente modelo TTS...`,
          );
          break; // Avanza al siguiente modelo en modelsToTry
        }

        // Si el error es por una voz no soportada en ese modelo, probar siguiente modelo
        if (status === 400 && msgLower.includes('voice')) {
          logger.warn(`[WappyStudio TTS] Voz no soportada en ${currentModel}, probando respaldo...`);
          break;
        }

        throw lastError;
      }
    }
  }

  throw lastError || new Error('No se pudo sintetizar el audio con las claves y modelos disponibles.');
}

// ============================================================================
// ENDPOINTS DE CATÁLOGO Y GESTIÓN DE CLAVES
// ============================================================================

/**
 * GET /api/studio/catalog
 * Devuelve los modelos TTS y de texto leídos dinámicamente desde GOOGLE_MODELS en .env
 */
router.get('/catalog', studioAuth, (req, res) => {
  res.json({
    models: getStudioTtsModelsFromEnv(),
    textModels: getStudioTextModelsFromEnv(),
    googleModelsEnv: getEnvGoogleModelsList(),
    voices: STUDIO_VOICES,
    presets: STUDIO_PRESETS,
    vocalBursts: STUDIO_VOCAL_BURSTS,
  });
});

/**
 * GET /api/studio/keys-status
 */
router.get('/keys-status', studioAuth, async (req, res) => {
  try {
    const { customKeysCount, systemKeysCount, allKeys } = await getCombinedKeysForRequest(req, []);
    const keysInfo = allKeys.map((k, idx) => ({
      index: idx,
      label: idx < customKeysCount ? `Clave Local #${idx + 1}` : `Clave WAPPY #${idx - customKeysCount + 1}`,
      maskedKey: k.length > 10 ? `${k.slice(0, 6)}••••••••${k.slice(-4)}` : '••••••••',
      status: idx === 0 ? 'active' : 'standby',
    }));

    res.json({
      totalKeys: allKeys.length,
      customKeysCount,
      systemKeysCount,
      autoRotationEnabled: allKeys.length > 1,
      keys: keysInfo,
    });
  } catch (error) {
    logger.error('[WappyStudio] Error checking keys status:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/studio/keys-validate
 */
router.post('/keys-validate', studioAuth, async (req, res) => {
  try {
    const { customKeys = [], apiKey } = req.body || {};
    const rawList = Array.isArray(customKeys) ? [...customKeys] : [];
    if (typeof apiKey === 'string') rawList.push(apiKey);
    const cleanKeys = rawList.map((k) => String(k || '').trim()).filter((k) => k.length > 8);

    if (cleanKeys.length === 0) {
      return res.status(400).json({ error: 'No se proporcionaron claves para validar.' });
    }

    const results = [];
    for (const key of cleanKeys) {
      try {
        const checkUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}&pageSize=5`;
        const resp = await axios.get(checkUrl, { timeout: 10000 });
        if (resp.status === 200 && Array.isArray(resp.data?.models)) {
          results.push({ valid: true, maskedKey: `${key.slice(0, 6)}...${key.slice(-4)}` });
        } else {
          results.push({ valid: false, error: 'Respuesta inesperada de Google API' });
        }
      } catch (err) {
        results.push({
          valid: false,
          error: err.response?.data?.error?.message || err.message || 'Clave inválida',
        });
      }
    }

    // `valid` refleja la primera clave (contrato usado por el modal "Claves IA" del cliente)
    res.json({ results, valid: Boolean(results[0]?.valid), error: results[0]?.error });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// ENDPOINTS DE SÍNTESIS TTS (CORTA Y LARGA DURACIÓN HASTA 1 HORA)
// ============================================================================

/**
 * POST /api/studio/tts/estimate
 */
router.post('/tts/estimate', studioAuth, (req, res) => {
  try {
    const { text = '', maxWordsPerChunk = 150 } = req.body;
    const clean = String(text || '').trim();
    if (!clean) {
      return res.json({
        totalWords: 0,
        totalChars: 0,
        chunkCount: 0,
        estimatedSeconds: 0,
        estimatedMinutes: 0,
        chunksPreview: [],
      });
    }

    const words = clean.split(/\s+/).filter(Boolean);
    const chunks = splitTextIntoChunks(clean, maxWordsPerChunk);
    // Promedio de locución en español: ~145 palabras por minuto
    const estimatedSeconds = Math.max(2, Math.round((words.length / 145) * 60));
    const estimatedMinutes = Math.round((estimatedSeconds / 60) * 10) / 10;

    res.json({
      totalWords: words.length,
      totalChars: clean.length,
      chunkCount: chunks.length,
      estimatedSeconds,
      estimatedMinutes,
      chunksPreview: chunks.map((c) => ({
        index: c.index,
        wordCount: c.wordCount,
        snippet: c.snippet,
      })),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/studio/tts/synthesize
 * Síntesis directa de muestra, audición de voz o primer fragmento
 */
router.post('/tts/synthesize', studioAuth, async (req, res) => {
  try {
    const {
      text,
      voiceName = 'Kore',
      stylePrompt = '',
      model = 'gemini-3.8-flash-tts',
      multiSpeaker = false,
      speaker1,
      speaker2,
      customKeys,
    } = req.body;

    if (!text || !String(text).trim()) {
      return res.status(400).json({ error: 'El texto a sintetizar es obligatorio.' });
    }

    const { allKeys } = await getCombinedKeysForRequest(req, customKeys);

    const result = await synthesizeChunkWithFailover({
      text: String(text).slice(0, 4500),
      voiceName,
      stylePrompt,
      model,
      multiSpeaker,
      speaker1,
      speaker2,
      keys: allKeys,
    });

    res.json({
      success: true,
      audioBase64: result.audioBase64,
      durationSeconds: result.durationSeconds,
      usedModel: result.usedModel,
      usedKeyIndex: result.usedKeyIndex,
    });
  } catch (error) {
    logger.error('[WappyStudio TTS] Error synthesizing chunk:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error al sintetizar el audio con Gemini TTS.',
    });
  }
});

/**
 * POST /api/studio/tts/jobs
 * Inicia un trabajo asíncrono para textos largos (hasta 1 hora de duración)
 */
router.post('/tts/jobs', studioAuth, async (req, res) => {
  try {
    const {
      text,
      voiceName = 'Kore',
      stylePrompt = '',
      model = 'gemini-3.8-flash-tts',
      multiSpeaker = false,
      speaker1,
      speaker2,
      maxWordsPerChunk = 150,
      customKeys,
    } = req.body;

    if (!text || !String(text).trim()) {
      return res.status(400).json({ error: 'El texto es obligatorio para iniciar el trabajo.' });
    }

    const { allKeys } = await getCombinedKeysForRequest(req, customKeys);
    if (allKeys.length === 0) {
      return res.status(400).json({
        error: 'No se encontraron claves API de Gemini. Configura una clave primero.',
      });
    }

    const chunks = splitTextIntoChunks(String(text), maxWordsPerChunk);
    if (chunks.length === 0) {
      return res.status(400).json({ error: 'El texto no contiene palabras válidas.' });
    }

    const totalWords = chunks.reduce((acc, c) => acc + c.wordCount, 0);
    const estimatedTotalSeconds = Math.max(3, Math.round((totalWords / 145) * 60));

    const jobId = `tts_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const job = {
      id: jobId,
      userId: String(req.user?.id || req.user?._id || 'studio_user'),
      createdAt: Date.now(),
      status: 'processing', // 'processing' | 'paused' | 'completed' | 'failed' | 'cancelled'
      voiceName,
      stylePrompt,
      model,
      multiSpeaker,
      speaker1,
      speaker2,
      keys: allKeys,
      totalChunks: chunks.length,
      currentChunkIndex: 0,
      completedChunks: 0,
      estimatedTotalSeconds,
      generatedTotalSeconds: 0,
      progressPercent: 0,
      chunks: chunks.map((c) => ({
        index: c.index,
        text: c.text,
        wordCount: c.wordCount,
        status: 'pending',
        durationSeconds: 0,
        pcmBuffer: null,
        audioBase64: null,
      })),
      masterWavBuffer: null,
      error: null,
      failoverNotice: null,
      sseClients: new Set(),
    };

    activeJobs.set(jobId, job);

    // Lanzar procesamiento asíncrono en segundo plano sin bloquear el event loop
    processJobAsync(job).catch((err) => {
      logger.error(`[WappyStudio Job ${jobId}] Unhandled error:`, err);
    });

    res.json({
      jobId,
      totalChunks: job.totalChunks,
      estimatedTotalSeconds: job.estimatedTotalSeconds,
    });
  } catch (error) {
    logger.error('[WappyStudio] Error starting async TTS job:', error);
    res.status(500).json({ error: error.message });
  }
});

function emitJobEvent(job, eventName, data) {
  const payload = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const clientRes of job.sseClients) {
    try {
      clientRes.write(payload);
    } catch {
      job.sseClients.delete(clientRes);
    }
  }
}

async function processJobAsync(job) {
  let nextIdx = 0;
  let aborted = false;
  const concurrency = Math.min(2, Math.max(1, job.keys.length), job.chunks.length);

  async function runChunkWorker() {
    while (!aborted) {
      if (job.status === 'cancelled' || job.status === 'failed') {
        aborted = true;
        return;
      }

      while (job.status === 'paused') {
        await new Promise((r) => setTimeout(r, 600));
        if (job.status === 'cancelled' || job.status === 'failed') {
          aborted = true;
          return;
        }
      }

      const i = nextIdx++;
      if (i >= job.chunks.length) {
        return;
      }

      const chunk = job.chunks[i];
      if (!chunk || chunk.status === 'completed') continue;

      job.currentChunkIndex = i;
      chunk.status = 'processing';
      emitJobEvent(job, 'chunk_start', { chunkIndex: i });

      try {
        const synthResult = await synthesizeChunkWithFailover({
          text: chunk.text,
          voiceName: job.voiceName,
          stylePrompt: job.stylePrompt,
          model: job.model,
          multiSpeaker: job.multiSpeaker,
          speaker1: job.speaker1,
          speaker2: job.speaker2,
          keys: job.keys,
          preferredKeyOffset: i,
          onFailover: (notice) => {
            job.failoverNotice = { ...notice, timestamp: Date.now() };
            emitJobEvent(job, 'api_key_failover', job.failoverNotice);
          },
        });

        chunk.status = 'completed';
        chunk.durationSeconds = synthResult.durationSeconds;
        chunk.pcmBuffer = synthResult.pcmBuffer;
        chunk.audioBase64 = synthResult.audioBase64;

        job.completedChunks = job.chunks.filter((c) => c.status === 'completed').length;
        job.generatedTotalSeconds =
          Math.round(
            job.chunks
              .filter((c) => c.status === 'completed')
              .reduce((sum, c) => sum + (c.durationSeconds || 0), 0) * 10,
          ) / 10;
        job.progressPercent = Math.round((job.completedChunks / job.totalChunks) * 100);

        emitJobEvent(job, 'chunk_complete', {
          chunkIndex: i,
          durationSeconds: chunk.durationSeconds,
          audioBase64: chunk.audioBase64,
          progressPercent: job.progressPercent,
          generatedTotalSeconds: job.generatedTotalSeconds,
        });
      } catch (err) {
        aborted = true;
        chunk.status = 'failed';
        job.status = 'failed';
        job.error = err.message || 'Fallo al sintetizar fragmento';
        emitJobEvent(job, 'job_failed', { error: job.error, chunkIndex: i });
        return;
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => runChunkWorker()));

  if (job.status === 'cancelled' || job.status === 'failed') {
    return;
  }

  // Todos los fragmentos completados: ensamblar archivo WAV maestro continuo y libre de chasquidos
  try {
    const rawChunks = job.chunks.map((c) => c.pcmBuffer).filter(Boolean);
    const sampleRate = 24000;
    const interChunkSilence = createPcmSilence(220, sampleRate); // 220 ms de pausa natural entre oraciones/párrafos

    const processedBuffers = [];

    for (let cIdx = 0; cIdx < rawChunks.length; cIdx++) {
      let chunkPcm = rawChunks[cIdx];
      // Asegurar paridad exacta de 16-bit
      if (chunkPcm.length % 2 !== 0) {
        chunkPcm = chunkPcm.slice(0, chunkPcm.length - 1);
      }

      // Aplicar micro-fade in y fade out para garantizar cruce por cero absoluto
      const smoothedChunk = applyMicroFadeToPcm(chunkPcm, sampleRate, 20);
      processedBuffers.push(smoothedChunk);

      // Si no es el último fragmento, insertar una breve pausa natural de respiración/frase
      if (cIdx < rawChunks.length - 1) {
        processedBuffers.push(interChunkSilence);
      }
    }

    let combinedPcm = Buffer.concat(processedBuffers);

    // Fade out final suave de 35ms al cierre absoluto del archivo para evitar el 'pop' final
    combinedPcm = applyFinalTailFade(combinedPcm, sampleRate, 35);

    if (combinedPcm.length % 2 !== 0) {
      combinedPcm = combinedPcm.slice(0, combinedPcm.length - 1);
    }

    const masterHeader = createWavHeader(combinedPcm.length, sampleRate, 1, 16);
    job.masterWavBuffer = Buffer.concat([masterHeader, combinedPcm]);

    // Recalcular duración total exacta incluyendo silencios naturales
    const totalSilenceSeconds = Math.max(0, rawChunks.length - 1) * 0.22;
    job.generatedTotalSeconds =
      Math.round(
        (job.chunks
          .filter((c) => c.status === 'completed')
          .reduce((sum, c) => sum + (c.durationSeconds || 0), 0) +
          totalSilenceSeconds) *
          10,
      ) / 10;

    job.status = 'completed';
    job.progressPercent = 100;

    // Liberar buffers individuales PCM para ahorrar RAM
    for (const c of job.chunks) {
      c.pcmBuffer = null;
    }

    emitJobEvent(job, 'job_completed', {
      id: job.id,
      totalDurationSeconds: job.generatedTotalSeconds,
      downloadUrl: `/api/studio/tts/jobs/${job.id}/download`,
    });
  } catch (err) {
    job.status = 'failed';
    job.error = `Error ensamblando el audio maestro: ${err.message}`;
    emitJobEvent(job, 'job_failed', { error: job.error });
  }
}

/**
 * GET /api/studio/tts/jobs/:jobId/stream
 * Stream SSE de eventos de progreso en tiempo real
 */
router.get('/tts/jobs/:jobId/stream', studioAuth, (req, res) => {
  const job = activeJobs.get(req.params.jobId);
  if (!job) {
    return res.status(404).json({ error: 'Trabajo no encontrado.' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  // Enviar snapshot inicial
  const snapshot = {
    id: job.id,
    status: job.status,
    totalChunks: job.totalChunks,
    currentChunkIndex: job.currentChunkIndex,
    completedChunks: job.completedChunks,
    estimatedTotalSeconds: job.estimatedTotalSeconds,
    generatedTotalSeconds: job.generatedTotalSeconds,
    progressPercent: job.progressPercent,
    downloadUrl: job.status === 'completed' ? `/api/studio/tts/jobs/${job.id}/download` : undefined,
    chunks: job.chunks.map((c) => ({
      index: c.index,
      wordCount: c.wordCount,
      status: c.status,
      durationSeconds: c.durationSeconds,
      audioBase64: c.audioBase64,
    })),
  };

  res.write(`event: snapshot\ndata: ${JSON.stringify(snapshot)}\n\n`);
  job.sseClients.add(res);

  req.on('close', () => {
    job.sseClients.delete(res);
  });
});

/**
 * POST /api/studio/tts/jobs/:jobId/control
 * Pausar, reanudar o cancelar un trabajo en curso
 */
router.post('/tts/jobs/:jobId/control', studioAuth, (req, res) => {
  const job = activeJobs.get(req.params.jobId);
  if (!job) {
    return res.status(404).json({ error: 'Trabajo no encontrado.' });
  }

  const { action } = req.body;
  if (action === 'pause' && job.status === 'processing') {
    job.status = 'paused';
  } else if (action === 'resume' && job.status === 'paused') {
    job.status = 'processing';
  } else if (action === 'cancel') {
    job.status = 'cancelled';
  }

  emitJobEvent(job, 'job_status', { status: job.status });
  res.json({ success: true, status: job.status });
});

/**
 * GET /api/studio/tts/jobs/:jobId/download
 * Descarga el archivo WAV Maestro ensamblado
 */
router.get('/tts/jobs/:jobId/download', async (req, res) => {
  const job = activeJobs.get(req.params.jobId);
  if (!job || !job.masterWavBuffer) {
    return res.status(404).json({ error: 'El archivo maestro de audio aún no está disponible.' });
  }

  res.setHeader('Content-Type', 'audio/wav');
  res.setHeader('Content-Disposition', `attachment; filename="wappy-studio-${job.id}.wav"`);
  res.setHeader('Content-Length', job.masterWavBuffer.length);
  return res.send(job.masterWavBuffer);
});

/**
 * POST /api/studio/script/enhance
 * Mejora o genera un guion de locución con efectos vocales (<breath>, <laugh>, |mhm|) usando GOOGLE_MODELS.
 */
router.post('/script/enhance', studioAuth, async (req, res) => {
  try {
    const {
      text = '',
      scriptText = '',
      stylePrompt = '',
      multiSpeaker = false,
      podcastOnly = false,
      minMinutes = 0,
      episodeTitle = '',
      modelName,
      customKeys,
      apiKeys,
    } = req.body || {};
    const baseText = text || scriptText || '';
    const isLongPodcast = Boolean(podcastOnly) || Number(minMinutes) >= 5;

    const modelsToTry = resolveStudioFastTextModels(
      modelName || req.user?.personalization?.geminiModels?.sstManagement,
    );
    const preferredTextModel = modelsToTry[0] || 'gemini-3.5-flash-lite';

    const { allKeys } = await getCombinedKeysForRequest(req, customKeys || apiKeys);
    const lengthMandate = isLongPodcast
      ? `\nREGLA OBLIGATORIA DE DURACIÓN (MÍNIMO 5 MINUTOS): El guion completo DEBE tener un mínimo estricto de 750 a 900 palabras reales (~5 a 6 minutos de locución hablada). Desarrolla el tema a profundidad con introducción magnética, análisis técnico y normativo (SG-SST, Decreto 1072, Res. 0312, GTC 45 o estándar aplicable), casos reales de campo, preguntas y respuestas entre los interlocutores, errores comunes a evitar y cierre memorable con conclusiones prácticas.`
      : '';

    const promptInstruction = multiSpeaker
      ? `Eres un guionista experto en podcasts y locución neural para Gemini 3.8 Flash TTS.
Convierte, expande o mejora el siguiente texto en un episodio completo de podcast dinámico entre dos interlocutores usando exactamente las etiquetas "Alex:" y "Sam:" al inicio de cada intervención.${lengthMandate}
Inserta efectos vocales orgánicos donde aporten naturalidad: <breath> (respiración), <laugh> (risa suave), |mhm| (asentimiento), |yeah| (acuerdo).
Estilo solicitado: ${stylePrompt || 'Conversacional, fluido y profesional'}.${episodeTitle ? `\nTítulo del Episodio: ${episodeTitle}` : ''}
Devuelve ÚNICAMENTE el guion listo para sintetizar, sin introducciones ni bloques markdown.`
      : `Eres un director de locución profesional experto en Gemini 3.8 Flash TTS.
Mejora, expande y enriquece el siguiente guion para que suene 100% humano, envolvente y con ritmo profesional.${lengthMandate}
Inserta etiquetas vocales orgánicas de Gemini TTS en las pausas clave: <breath> (toma de aire natural), <laugh> (si aplica), <gasp> (si aplica énfasis).
Estilo solicitado: ${stylePrompt || 'Narración profesional, clara y expresiva'}.${episodeTitle ? `\nTítulo del Episodio: ${episodeTitle}` : ''}
Devuelve ÚNICAMENTE el texto del guion mejorado, sin comentarios adicionales ni comillas.`;

    const inputContent = `${promptInstruction}\n\nTEXTO O TEMA BASE:\n${baseText || 'Crea un episodio completo de podcast sobre cómo la Inteligencia Artificial y la cultura preventiva transforman la Seguridad y Salud en el Trabajo.'}`;

    let enhancedText = '';
    let usedModel = preferredTextModel;
    if (allKeys.length > 0) {
      let lastErr = null;
      const keysToUse = allKeys.slice(0, 4);
      outer: for (const key of keysToUse) {
        for (const mId of modelsToTry) {
          try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(mId)}:generateContent?key=${encodeURIComponent(key)}`;
            const resp = await axios.post(
              url,
              {
                contents: [{ role: 'user', parts: [{ text: inputContent }] }],
                generationConfig: { temperature: 0.6 },
              },
              { timeout: isLongPodcast ? 35000 : 15000 },
            );
            const candidateText =
              resp.data?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || '';
            if (candidateText.trim()) {
              enhancedText = candidateText.trim();
              usedModel = mId;
              break outer;
            }
          } catch (e) {
            lastErr = e;
          }
        }
      }
      if (!enhancedText && lastErr) throw lastErr;
    } else {
      const aiResult = await generateWithKeyRotation(
        { model: preferredTextModel, generationConfig: { temperature: 0.5 } },
        req.user,
        inputContent,
      );
      enhancedText = (aiResult?.response?.text?.() || '').trim();
    }

    if (!enhancedText) {
      throw new Error('No se pudo generar el guion mejorado.');
    }

    return res.json({
      success: true,
      text: enhancedText,
      scriptText: enhancedText,
      model: usedModel,
      usedModel,
    });
  } catch (error) {
    logger.error('[WappyStudio Script] Error enhancing script:', error);
    return res.status(500).json({
      success: false,
      error: error.response?.data?.error?.message || error.message || 'Error al mejorar el guion con IA.',
    });
  }
});

// ============================================================================
// ENDPOINTS DE COMPOSICIÓN DE VIDEO HTML / GSAP (ESTILO WAPPY IA / HYPERFRAMES)
// ============================================================================

const WAPPY_ASSET_CACHE = new Map();
function getPublicAssetDataUri(relPath, mime = 'image/png') {
  if (WAPPY_ASSET_CACHE.has(relPath)) return WAPPY_ASSET_CACHE.get(relPath);
  const candidates = [
    path.join(process.cwd(), 'client', 'public', relPath),
    path.join(process.cwd(), 'client', 'dist', relPath),
    path.join(__dirname, '..', '..', '..', 'client', 'public', relPath),
    path.join(__dirname, '..', '..', '..', 'client', 'dist', relPath),
  ];
  for (const fullPath of candidates) {
    try {
      if (fs.existsSync(fullPath)) {
        const b64 = fs.readFileSync(fullPath).toString('base64');
        const uri = `data:${mime};base64,${b64}`;
        WAPPY_ASSET_CACHE.set(relPath, uri);
        return uri;
      }
    } catch (_) {}
  }
  return '';
}

function getPublicAssetText(relPath) {
  const cacheKey = `txt:${relPath}`;
  if (WAPPY_ASSET_CACHE.has(cacheKey)) return WAPPY_ASSET_CACHE.get(cacheKey);
  const candidates = [
    path.join(process.cwd(), 'client', 'public', relPath),
    path.join(process.cwd(), 'client', 'dist', relPath),
    path.join(__dirname, '..', '..', '..', 'client', 'public', relPath),
    path.join(__dirname, '..', '..', '..', 'client', 'dist', relPath),
  ];
  for (const fullPath of candidates) {
    try {
      if (fs.existsSync(fullPath)) {
        const txt = fs.readFileSync(fullPath, 'utf8');
        WAPPY_ASSET_CACHE.set(cacheKey, txt);
        return txt;
      }
    } catch (_) {}
  }
  return '';
}

function inlineWappyPublicAssetsInHtml(rawHtml, { inlineVendorScripts = false } = {}) {
  if (!rawHtml || typeof rawHtml !== 'string') return '';
  let html = rawHtml;
  const assetMap = [
    { regex: /(["'(])(?:\.\/|\/)?assets\/(?:wappy\/)?tenshi\.png(["')])/gi, rel: 'assets/wappy/tenshi.png' },
    { regex: /(["'(])(?:\.\/|\/)?assets\/(?:wappy\/)?felix_avatar_3d\.png(["')])/gi, rel: 'assets/wappy/felix_avatar_3d.png' },
    { regex: /(["'(])(?:\.\/|\/)?assets\/(?:wappy\/)?wappy-cat-logo\.png(["')])/gi, rel: 'assets/wappy/wappy-cat-logo.png' },
    { regex: /(["'(])(?:\.\/|\/)?assets\/(?:wappy\/)?antigravity_logo\.png(["')])/gi, rel: 'assets/wappy/antigravity_logo.png' },
    { regex: /(["'(])(?:\.\/|\/)?assets\/Wappy\.png(["')])/gi, rel: 'assets/Wappy.png' },
  ];
  for (const item of assetMap) {
    const dataUri = getPublicAssetDataUri(item.rel, 'image/png');
    if (dataUri) {
      html = html.replace(item.regex, (_, q1, q2) => `${q1}${dataUri}${q2}`);
    }
  }
  if (inlineVendorScripts) {
    const escapeInline = (code) => code.replace(/<\/script/gi, '<\\/script');
    const threeCode = getPublicAssetText('assets/wappy/three.min.js');
    if (threeCode) {
      html = html.replace(
        /<script[^>]*src=["'][^"']*three(\.min)?\.js["'][^>]*>\s*<\/script>/gi,
        () => `<script id="wappy-inline-three">${escapeInline(threeCode)}</script>`,
      );
    }
    const gsapCode = getPublicAssetText('assets/gsap.min.js');
    if (gsapCode) {
      html = html.replace(
        /<script[^>]*src=["'][^"']*gsap(\.min)?\.js["'][^>]*>\s*<\/script>/gi,
        () => `<script id="wappy-inline-gsap">${escapeInline(gsapCode)}</script>`,
      );
    }
  }
  return html;
}

/**
 * Calcula el mapa exacto de tiempos (Beats + Palabras ponderadas por sílabas y pausas)
 * para que las escenas visuales y los subtítulos sincronicen al milisegundo con la voz.
 */
function computeServerScriptTimelineMap(scriptText, totalDurationSeconds = 30) {
  const safeTotal = Math.max(4, Number(totalDurationSeconds) || 30);
  const raw = String(scriptText || '')
    .replace(/^(Alex|Sam|Hablante\s*\d+|Speaker\s*\d+):\s*/gim, '')
    .trim();

  const rawSegments = raw
    .split(/(?<=[.!?…])\s+|\n+|<breath>/gi)
    .map((s) =>
      s
        .replace(/<[^>]+>/g, '')
        .replace(/\|[^|]+\|/g, '')
        .trim(),
    )
    .filter(Boolean);

  if (rawSegments.length === 0) {
    rawSegments.push('Prevención inteligente y seguridad en el trabajo con WAPPY IA.');
  }

  // Unir exclamaciones muy cortas (ej: "¡Atención!") con la frase siguiente
  const merged = [];
  for (let i = 0; i < rawSegments.length; i++) {
    const seg = rawSegments[i];
    if (seg.length < 18 && i + 1 < rawSegments.length) {
      rawSegments[i + 1] = `${seg} ${rawSegments[i + 1]}`;
    } else {
      merged.push(seg);
    }
  }

  // Agrupar en máximo 7 beats visuales para mantener ritmo cinematográfico limpio
  const maxBeats = 7;
  const beatsRaw = [];
  if (merged.length <= maxBeats) {
    beatsRaw.push(...merged);
  } else {
    const groupSize = Math.ceil(merged.length / maxBeats);
    for (let i = 0; i < merged.length; i += groupSize) {
      beatsRaw.push(merged.slice(i, i + groupSize).join(' '));
    }
  }

  const wordTimings = [];
  const beatObjects = [];
  let totalWeight = 0;

  const tempBeats = beatsRaw.map((text, bIdx) => {
    const words = text.split(/\s+/).filter(Boolean);
    const wList = words.map((w) => {
      const cleanLen = w.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9]/g, '').length;
      let weight = Math.max(2, cleanLen);
      if (/[,;:]$/.test(w)) weight += 4;
      if (/[.!?…]$/.test(w)) weight += 9;
      return { word: w, weight };
    });
    // Pausa natural de cierre de frase / respiración entre beats
    if (wList.length > 0) {
      wList[wList.length - 1].weight += 7;
    }
    const beatWeight = wList.reduce((acc, item) => acc + item.weight, 0) || 10;
    totalWeight += beatWeight;
    return { text, bIdx, wList, beatWeight };
  });

  let accWeight = 0;
  for (let i = 0; i < tempBeats.length; i++) {
    const b = tempBeats[i];
    const startPct = accWeight / Math.max(1, totalWeight);
    const endPct = (accWeight + b.beatWeight) / Math.max(1, totalWeight);
    const startSec = Number((startPct * safeTotal).toFixed(2));
    const endSec = Number((endPct * safeTotal).toFixed(2));
    const durationSec = Number(Math.max(0.8, endSec - startSec).toFixed(2));

    let wordAcc = accWeight;
    for (const wItem of b.wList) {
      const wStartPct = wordAcc / Math.max(1, totalWeight);
      wordAcc += wItem.weight;
      const wEndPct = wordAcc / Math.max(1, totalWeight);
      wordTimings.push({
        word: wItem.word,
        startPct: Number(wStartPct.toFixed(4)),
        endPct: Number(wEndPct.toFixed(4)),
        beatIndex: i,
      });
    }
    accWeight += b.beatWeight;

    beatObjects.push({
      index: i + 1,
      text: b.text,
      startSec,
      endSec,
      durationSec,
      startPct: Number(startPct.toFixed(4)),
      endPct: Number(endPct.toFixed(4)),
    });
  }

  return { beats: beatObjects, wordTimings, totalDurationSeconds: safeTotal };
}

function postProcessGeneratedVideoHtml(rawHtml, timelineMap) {
  let html = inlineWappyPublicAssetsInHtml(rawHtml);
  // Corregir bug común de LLMs: subtitles.reverse() muta el arreglo en cada frame de GSAP onUpdate
  html = html.replace(/subtitles\.reverse\(\)/g, 'subtitles.slice().reverse()');
  // Si el HTML aún no tiene el helper de sincronización, inyectarlo
  if (!html.includes('window.__wappyTimelineBeats')) {
    const syncHelper = `<script id="wappy-beat-sync-helper">
  window.__wappyTimelineBeats = ${JSON.stringify(timelineMap.beats)};
  window.__wappyWordTimings = ${JSON.stringify(timelineMap.wordTimings)};
</script>`;
    if (html.includes('</head>')) {
      html = html.replace('</head>', `${syncHelper}\n</head>`);
    } else {
      html = `${syncHelper}\n${html}`;
    }
  }
  return html;
}

/**
 * POST /api/studio/video/compile-master-reel
 * Compila instantáneamente (<10ms) el Motor Maestro 60-FPS de Antigravity (7 Arquetipos + Three.js WappyAvatarVoxel3D)
 * a partir del guion actual y el audio WAV (si existe), sin esperar llamada a LLM.
 */
router.post('/video/compile-master-reel', studioAuth, async (req, res) => {
  try {
    const {
      scriptText = '',
      scriptSteps = [],
      headline = '',
      headlineText = '',
      badgeText = '',
      subtitleText = '',
      accentColor = '',
      theme = 'dark-tech-hud',
      effects = [],
      aspectRatio = '9:16',
      hasBaseVideo = false,
      showSubtitles = true,
      durationSeconds = 30,
      companyName = 'WAPPY IA',
      audioBase64,
    } = req.body || {};

    const safeDuration = Math.max(6, Math.min(180, Number(durationSeconds) || 30));
    const effectiveHeadline = headlineText || headline || '';
    const effectiveScript =
      scriptText ||
      effectiveHeadline ||
      '¡Atención equipo! Antes de intervenir cualquier tablero o red eléctrica, recuerda que tu vida depende de las Cinco Reglas de Oro. Primero: Cortar de forma efectiva todas las fuentes de tensión. Segundo: Bloquear y etiquetar los aparatos de corte con tu candado personal LOTO. Tercero: Verificar la ausencia de tensión con un detector calibrado. Cuarto: Poner a tierra y en cortocircuito todas las posibles fuentes de corriente. Y quinto: Delimitar y señalizar la zona de trabajo. En WAPPY IA cuidamos lo más valioso: que regreses sano y salvo a casa.';

    let timelineMap = computeServerScriptTimelineMap(effectiveScript, safeDuration);

    if (audioBase64 && typeof audioBase64 === 'string') {
      try {
        const cleanB64 = audioBase64.replace(/^data:audio\/[^;]+;base64,/, '');
        const wavBuf = Buffer.from(cleanB64, 'base64');
        timelineMap = alignTimelineMapWithWavBuffer(timelineMap, wavBuf);
      } catch (_) {}
    }

    const scenePlan = buildSmartScenePlanFromScript(effectiveScript, timelineMap.beats, {
      companyName,
      theme,
      selectedEffects: Array.isArray(effects) ? effects : [],
      scriptSteps: Array.isArray(scriptSteps) ? scriptSteps : [],
      badgeText,
      headlineText: effectiveHeadline,
      subtitleText,
    });

    let htmlCode = compileAntigravityMasterReelHtml(scenePlan, timelineMap, {
      aspectRatio,
      hasBaseVideo,
      companyName,
      showSubtitles,
      theme,
      selectedArtDirection: theme,
      accentColor,
    });

    htmlCode = postProcessGeneratedVideoHtml(htmlCode, timelineMap);

    return res.json({
      success: true,
      htmlCode,
      timelineMap,
      scenePlan,
    });
  } catch (error) {
    logger.error('[WappyStudio Video] Error compiling master reel:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Error compilando el motor maestro de video.',
    });
  }
});

/**
 * Catálogo Oficial de las 7 Skills de Diseño UI/UX y Producción de Video de Google Antigravity + 4 Direcciones de Arte + 19 Efectos Virales
 */
const ANTIGRAVITY_VIDEO_SKILLS_CATALOG = [
  {
    id: 'protocolo-produccion-videos',
    name: 'Sistema de las 7 Piezas + Brandbook WAPPY IA',
    category: 'Producción & Dirección',
    description:
      'Portada magnética de 0.00s a 2.00s, guión segundo a segundo, Avatar 3D y 3 vistas previas.',
  },
  {
    id: 'animaciones-17-efectos-reels',
    name: '19 Efectos Virales & Transiciones 60 FPS',
    category: 'Motion Graphics 60-FPS',
    description:
      'Orbit 3D, Frame Break, UI World, Digital Zoom Reticle, iPhone Dynamic Island, Headline Wall, Zoom-Through, Chart Grow, Signature Pad y CTA Bubbles.',
  },
  {
    id: 'animaciones-wappy-brand',
    name: 'Identidad Visual Oficial WAPPY IA',
    category: 'Brand & Avatares 3D',
    description:
      'Verde Lima Eléctrico (#C7F303), Negro Oliva (#0E1300), Turquesa SST (#0D9488), Cielo Cloud (#5BB8F5) y Crema Editorial (#F6F5EF).',
  },
  {
    id: 'animaciones-dark-tech-hud',
    name: 'Dark Tech Cyberpunk & HUD Glassmorphism',
    category: 'HUD & Telemetría',
    description:
      'Escenario cósmico #0C192E -> #020409, retícula de escaneo láser, radar holográfico y tarjetas HUD con esquinas técnicas.',
  },
  {
    id: 'animaciones-explicativas-sst',
    name: 'Explicativos Normativos & SST para Dummies',
    category: 'Normativa & Legal SST',
    description:
      'Análisis técnico de decretos, resoluciones (Res. 0312, Dec. 1072, GTC 45, RETIE) y contraste de mitos vs realidad legal.',
  },
  {
    id: 'hyperframes-motion-design',
    name: 'HyperFrames Motion Design & GSAP Cinematográfico',
    category: 'Motor Determinista GSAP',
    description:
      'Coreografía cinematográfica con suavizado elástico E.spring, jerarquía tipográfica XL y sincronización de fotogramas a 60 FPS.',
  },
  {
    id: 'wappy-ui-design-system',
    name: 'WAPPY 14-Group UI Design System & Glassmorphism',
    category: 'Diseño UI/UX Premium',
    description:
      'Los 14 grupos semánticos de color, tarjetas Glassmorphism de alto contraste, micro-animaciones SVG y geometría sin desbordamiento.',
  },
];

const ANTIGRAVITY_ART_DIRECTIONS = [
  {
    id: 'dark-tech-hud',
    name: 'Dark Tech HUD Cyberpunk',
    palette: ['#0C192E', '#020409', '#22D3EE', '#C7F303'],
  },
  {
    id: 'wappy-lima-oliva',
    name: 'WAPPY Brand Lima & Oliva',
    palette: ['#1D2D04', '#0E1300', '#C7F303', '#0D9488'],
  },
  {
    id: 'cielo-wappy-cloud',
    name: 'Cielo WAPPY Cloud & Turquesa',
    palette: ['#0D3B66', '#030D1A', '#5BB8F5', '#C7F303'],
  },
  {
    id: 'crema-editorial-sst',
    name: 'Editorial SST Normativo',
    palette: ['#132A2E', '#040B0D', '#0D9488', '#F6F5EF'],
  },
];

const ANTIGRAVITY_EFFECTS_CATALOG = [
  { id: '19-cover-2s', name: '19 Portada Magnética (2s)', archetype: 'hook-vs-wall', description: 'Miniatura de alto impacto (0.0s-2.0s) con titular gigante e insignias clave.' },
  { id: 'felix-voxel-3d', name: 'Avatar 3D Lip-Sync', archetype: 'iphone-split-showcase', description: 'Presentador Avatar 3D con gestos y sincronía labial reactiva al audio.' },
  { id: 'tenshi-3d', name: 'Tenshi 3D', archetype: 'tenshi-specialists-grid', description: 'Oráculo IA flotante con halo esmeralda/cyan y telemetría reactiva.' },
  { id: '01-orbit', name: '01 Órbita 3D', archetype: 'pentagon-orbital', description: 'Anillo orbital 3D de insignias e iconos gravitatorios alrededor del concepto central.' },
  { id: '02-frame-break', name: '02 Frame Break', archetype: 'tenshi-specialists-grid', description: 'Ruptura de marco con profundidad 3D y desborde fuera de la tarjeta.' },
  { id: '04-digital-zoom', name: '04 Digital Zoom', archetype: 'chart-grow-math', description: 'Acercamiento táctico con retícula HUD y mira de precisión sobre datos críticos.' },
  { id: '05-phone-mockup', name: '05 Mockup iPhone', archetype: 'iphone-split-showcase', description: 'Celular 3D con Dynamic Island mostrando alertas y controles SST en vivo.' },
  { id: '07-zoom-through', name: '07 Zoom-Through', archetype: 'pentagon-orbital', description: 'Transición inmersiva sin corte atravesando la escena hacia el siguiente punto.' },
  { id: '08-chart-grow', name: '08 Chart Grow', archetype: 'chart-grow-math', description: 'Barras e indicadores KPI que crecen dinámicamente con rebote spring.' },
  { id: '10-glass-type', name: '10 Cristal 3D', archetype: 'tenshi-specialists-grid', description: 'Tipografía y tarjetas Glassmorphism con refracción translúcida y borde luminoso.' },
  { id: '11-giro-3d', name: '11 Giro 3D', archetype: 'pentagon-orbital', description: 'Rotación en perspectiva Y/X con destello neón al cambiar de escena.' },
  { id: '13-checklist-sst', name: '13 Checklist SST', archetype: 'signature-pad-live', description: 'Lista secuencial 1-2-3 con verificación animada y sello de cumplimiento.' },
  { id: '17-paper-cut', name: '17 Paper Cut', archetype: 'signature-pad-live', description: 'Recorte editorial en capas con textura y sombra proyectada.' },
  { id: '18-dolly-zoom', name: '18 Dolly Zoom', archetype: 'pentagon-orbital', description: 'Efecto vértigo cinematográfico contrayendo el fondo mientras destaca el titular.' },
  { id: 'visor-normativo', name: 'Visor Normativo Subrayado', archetype: 'signature-pad-live', description: 'Expediente legal (Decreto 1072 / Res. 0312) con resaltador fluorescente en vivo.' },
  { id: 'pentagono-gtc45', name: 'Pentágono GTC-45', archetype: 'pentagon-orbital', description: 'Radar pentagonal de peligros y valoración de riesgos GTC-45.' },
  { id: 'sfx-pack', name: 'SFX Whoosh+Pop+Ding', archetype: 'cta-viral-bubbles', description: 'Diseño sonoro sincronizado: whoosh en transiciones, pop en tarjetas y ding en checks.' },
  { id: '01-orbit-3d', name: '01 Orbit 3D Pentágono', archetype: 'pentagon-orbital', description: 'Órbita 3D pentagonal.' },
  { id: '03-ui-world', name: '03 UI World & Tenshi Grid', archetype: 'tenshi-specialists-grid', description: 'Mundo de interfaz 3D.' },
  { id: '05-phone-island', name: '05 iPhone Mockup Dynamic Island', archetype: 'iphone-split-showcase', description: 'Mockup iPhone Dynamic Island.' },
  { id: '06-headline-wall', name: '06 Headline Wall & VS Hook', archetype: 'hook-vs-wall', description: 'Muro de titulares y contraste VS.' },
  { id: '09-doodle-boil', name: '09 Doodle / Firma SVG en Vivo', archetype: 'signature-pad-live', description: 'Firma SVG animada.' },
  { id: '12-couch-wall', name: '12 Social Bubbles & CTA Viral', archetype: 'cta-viral-bubbles', description: 'Burbujas sociales y CTA viral.' },
  { id: '13-checklist-live', name: '13 Checklist & Pad LOTO', archetype: 'signature-pad-live', description: 'Checklist interactivo en vivo.' },
  { id: '14-corte-zoom', name: '14 Corte con Zoom & Contraste', archetype: 'hook-vs-wall', description: 'Corte dinámico con zoom.' },
  { id: '15-zoom-out', name: '15 Zoom Out Panorámico', archetype: 'cta-viral-bubbles', description: 'Zoom out panorámico.' },
  { id: '16-green-screen', name: '16 Split Showcase & QR Scan', archetype: 'iphone-split-showcase', description: 'Pantalla dividida y QR.' },
  { id: '18-vertigo-dolly', name: '18 Vértigo Dolly Zoom', archetype: 'pentagon-orbital', description: 'Efecto vértigo.' },
  { id: '19-cover-story', name: '19 Portada Magnética 2s', archetype: 'hook-vs-wall', description: 'Portada magnética de 2s.' },
];

/**
 * Resuelve el userId objetivo para Antigravity tanto si el usuario tiene sesión JWT (`req.user`)
 * como si envía su clave `antigravityApiKey` (`wpy_live_...` o `wpy_guest_...`).
 */
async function resolveStudioTargetUser(req) {
  const explicitKey =
    req.headers?.['x-antigravity-api-key'] ||
    req.headers?.['x-api-key'] ||
    (typeof req.query?.apiKey === 'string' ? req.query.apiKey.trim() : '') ||
    (typeof req.body?.antigravityApiKey === 'string' ? req.body.antigravityApiKey.trim() : '') ||
    (typeof req.body?.apiKey === 'string' && req.body.apiKey.trim().startsWith('wpy_') ? req.body.apiKey.trim() : '') ||
    (typeof req.body?.guestKey === 'string' && req.body.guestKey.trim().startsWith('wpy_guest_') ? req.body.guestKey.trim() : '');

  if (explicitKey && mcpBridge && typeof mcpBridge.authenticateApiKey === 'function') {
    try {
      const auth = await mcpBridge.authenticateApiKey(explicitKey);
      if (auth?.user) {
        const uid = String((auth.user.isSubUser && auth.user.parentUser) ? auth.user.parentUser : (auth.user._id || auth.user.id));
        return {
          userId: uid,
          isGuest: Boolean(auth.user.isGuest),
          apiKey: explicitKey,
          user: auth.user,
        };
      }
    } catch (_) {}
  }

  if (req?.user && (req.user._id || req.user.id)) {
    const uid = String((req.user.isSubUser && req.user.parentUser) ? req.user.parentUser : (req.user._id || req.user.id));
    return {
      userId: uid,
      isGuest: Boolean(req.user.isGuest),
      apiKey: req.apiKey?.rawKey || explicitKey || null,
      user: req.user,
    };
  }

  return {
    userId: '',
    isGuest: true,
    apiKey: null,
    user: null,
  };
}

function getAntigravityBridgeStatus(req, explicitUserId = '') {
  let activeListeners = 0;
  let userListeners = 0;
  const targetUid = String(
    explicitUserId ||
      (req?.user ? ((req.user.isSubUser && req.user.parentUser) ? req.user.parentUser : (req.user._id || req.user.id || '')) : ''),
  );
  try {
    const clientsMap = mcpBridge?.antigravityStreamClients;
    if (clientsMap && typeof clientsMap.forEach === 'function') {
      clientsMap.forEach((set, uid) => {
        let count = 0;
        for (const c of set || []) {
          if (c?.__wappyClientType !== 'browser') count++;
        }
        activeListeners += count;
        if (targetUid && String(uid) === targetUid) {
          userListeners += count;
        }
      });
    }
  } catch (_) {}

  return {
    connected: userListeners > 0,
    daemonListening: userListeners > 0 || activeListeners > 0,
    userDaemonConnected: userListeners > 0,
    activeListeners,
    userListeners,
    userId: targetUid || null,
    engine: 'antigravity-master-reel-60fps',
    skillsLoaded: ANTIGRAVITY_VIDEO_SKILLS_CATALOG.length,
    effectsCount: ANTIGRAVITY_EFFECTS_CATALOG.length,
    timestamp: new Date().toISOString(),
  };
}

function notifyStudioAntigravityBridge(req, eventType, payload = {}, explicitUserId = '') {
  const status = getAntigravityBridgeStatus(req, explicitUserId);
  try {
    if (mcpBridge && typeof mcpBridge.broadcastAntigravityEvent === 'function') {
      const targetUserId = String(
        explicitUserId ||
          (req?.user ? ((req.user.isSubUser && req.user.parentUser) ? req.user.parentUser : (req.user._id || req.user.id || '')) : ''),
      );
      const eventData = {
        source: 'wappy-studio',
        eventType,
        timestamp: new Date().toISOString(),
        ...payload,
      };
      if (targetUserId) {
        mcpBridge.broadcastAntigravityEvent(targetUserId, 'studio_antigravity_event', eventData);
      }
    }
  } catch (err) {
    logger.debug(`[WappyStudio Antigravity] SSE broadcast skipped: ${err.message}`);
  }
  return status;
}

/**
 * Si el usuario o visitante (`wpy_live_...` o `wpy_guest_...`) tiene un daemon de Antigravity conectado
 * en `mcpBridge.antigravityStreamClients`, registra la orden en `KanbanTask` y emite `event: nueva_orden`
 * para que su Antigravity local la procese con las 7 Skills y al llamar `/api/mcp-bridge/antigravity/completar`
 * actualice la pantalla en vivo vía SSE (`orden_completada`).
 */
async function delegateStudioOrderToAntigravityIfConnected(req, targetUserId, orderSpec = {}) {
  if (!targetUserId || req.body?.delegateToDaemon === false) {
    return null;
  }
  try {
    const mongoose = require('mongoose');
    const KanbanTask = mongoose.models.KanbanTask || require('~/models/KanbanTask');
    const clientsMap = mcpBridge?.antigravityStreamClients;
    const userSet = clientsMap && typeof clientsMap.get === 'function' ? clientsMap.get(String(targetUserId)) : null;
    let listenerCount = 0;
    for (const c of userSet || []) {
      if (c?.__wappyClientType !== 'browser') listenerCount++;
    }

    if (listenerCount === 0 && !req.body?.forceDelegateOrder) {
      return { delegated: false, listeners: 0 };
    }

    const title = orderSpec.title || 'Wappy Studio · Producción de Reel 60-FPS en Antigravity';
    const instruction = orderSpec.instruction || 'Generar composición HTML5 animada a 60 FPS aplicando las 7 Skills de WAPPY IA.';
    const outputType = orderSpec.outputType || 'html';

    let kanbanTask = null;
    if (mongoose.Types.ObjectId.isValid(String(targetUserId))) {
      kanbanTask = await KanbanTask.create({
        user: new mongoose.Types.ObjectId(String(targetUserId)),
        title,
        description: `[DELEGADO DESDE WAPPY STUDIO A ANTIGRAVITY]\nInstrucción: ${instruction}\nRecurso Objetivo: Wappy Studio 60-FPS Reel Engine\nFormato Esperado: ${outputType}`,
        status: 'todo',
        dueDate: new Date(Date.now() + 2 * 3600 * 1000),
        type: 'antigravity_delegation',
        priority: 'alta',
        sourceModule: 'wappy_studio',
      });
    }

    const ordenId = kanbanTask?._id ? kanbanTask._id.toString() : `studio-agy-${Date.now()}`;
    const orderPushPayload = {
      id: ordenId,
      ordenId,
      titulo: title,
      instruccion: instruction,
      descripcion: kanbanTask?.description || instruction,
      recursoObjetivo: 'Wappy Studio 60-FPS Reel Engine (7 Skills)',
      formatoEntregable: outputType,
      estado: 'todo',
      prioridad: 'alta',
      origen: 'wappy_studio',
      fechaCreacion: kanbanTask?.createdAt || new Date().toISOString(),
    };

    const pushed =
      mcpBridge && typeof mcpBridge.broadcastAntigravityEvent === 'function'
        ? mcpBridge.broadcastAntigravityEvent(String(targetUserId), 'nueva_orden', orderPushPayload)
        : 0;

    return {
      delegated: pushed > 0 || Boolean(kanbanTask),
      ordenId,
      listeners: pushed,
    };
  } catch (err) {
    logger.debug(`[WappyStudio Antigravity] Order delegation skipped: ${err.message}`);
    return null;
  }
}

/**
 * Lee en vivo los 7 archivos SKILL.md oficiales desde `.agents/skills/` para empaquetarlos e instalarlos en Antigravity.
 */
function buildWappySkillsBundlePayload(originUrl = 'https://wappy.club') {
  const skillsBaseDirs = [
    path.join(process.cwd(), '.agents', 'skills'),
    path.resolve(__dirname, '..', '..', '..', '.agents', 'skills'),
  ];

  const skillsPayload = ANTIGRAVITY_VIDEO_SKILLS_CATALOG.map((meta) => {
    let markdownContent = '';
    for (const baseDir of skillsBaseDirs) {
      const skillFile = path.join(baseDir, meta.id, 'SKILL.md');
      try {
        if (fs.existsSync(skillFile)) {
          markdownContent = fs.readFileSync(skillFile, 'utf8');
          break;
        }
      } catch (_) {}
    }
    return {
      id: meta.id,
      name: meta.name,
      category: meta.category,
      description: meta.description,
      relativePath: `${meta.id}/SKILL.md`,
      targetDirs: [
        `~/.gemini/config/skills/${meta.id}/SKILL.md`,
        `~/.gemini/antigravity/skills/${meta.id}/SKILL.md`,
      ],
      content: markdownContent,
    };
  });

  return {
    ok: true,
    success: true,
    bundleName: 'WAPPY IA · Pack Oficial de 7 Skills de Diseño UI/UX y Video 60-FPS para Google Antigravity',
    version: '2.0.0',
    generatedAt: new Date().toISOString(),
    originUrl,
    totalSkills: skillsPayload.length,
    installTargets: [
      '~/.gemini/config/skills',
      '~/.gemini/antigravity/skills',
    ],
    installCommand: `curl -fsSL "${originUrl}/api/studio/antigravity/skills-installer.js" | node`,
    brandbookSummary: {
      colors: {
        electricLime: '#C7F303',
        deepOlive: '#0E1300',
        sstTeal: '#0D9488',
        editorialCream: '#F6F5EF',
        darkTechHud: '#0C192E',
        cyberCyan: '#22D3EE',
      },
      fonts: ['Outfit ExtraBold', 'Plus Jakarta Sans', 'JetBrains Mono'],
      sevenPiecesRule:
        '1. Dirección de Arte (9:16 o 16:9), 2. Identidad WAPPY + Avatar 3D, 3. Normativa SST verificada, 4. Portada Magnética 0-2s, 5. Motion Graphics 60-FPS E.spring, 6. Diseño Sonoro Lip-Sync PCM16, 7. Vistas Previas y Render MP4.',
    },
    installInstructions: {
      quickOneLineCommand: `curl -fsSL "${originUrl}/api/studio/antigravity/skills-installer.js" | node`,
      promptForAntigravity:
        'Instala en mi entorno local de Google Antigravity las 7 Skills oficiales de Diseño UI/UX y Producción de Video 60-FPS de WAPPY IA contenidas en este archivo JSON (guardando cada `content` en `~/.gemini/config/skills/<id>/SKILL.md` y `~/.gemini/antigravity/skills/<id>/SKILL.md`) y úsalas siempre que diseñemos o animemos reels para Wappy Studio.',
    },
    skills: skillsPayload,
  };
}

/**
 * POST /api/studio/antigravity/guest-key (y GET /api/studio/antigravity/guest-key)
 * - Si el usuario tiene sesión JWT activa (`req.user` registrado), busca o crea su `UserApiKey` real (`wpy_live_...`).
 * - Si es un visitante sin cuenta (o envía `guestKey: "wpy_guest_..."`), valida o genera una clave única `wpy_guest_<24_hex>`
 *   y calcula su `userId` determinista (`ObjectId` de 24 hex) para que su puente SSE y órdenes funcionen aislados de otros usuarios.
 */
async function handleStudioAntigravityGuestOrUserKey(req, res) {
  try {
    const proto = req.headers['x-forwarded-proto'] || req.protocol || 'https';
    const host = req.headers['x-forwarded-host'] || req.get('host') || 'wappy.club';
    const originUrl = `${proto}://${host}`.replace(/https?:\/\/wappy-ia\.com/gi, 'https://wappy.club');

    // Caso 1: Usuario registrado autenticado con JWT real
    if (req.user && (req.user._id || req.user.id) && !req.user.isGuest) {
      const UserApiKey = require('~/models/UserApiKey');
      const targetUserId = String((req.user.isSubUser && req.user.parentUser) ? req.user.parentUser : (req.user._id || req.user.id));

      let existingKeyDoc = await UserApiKey.findOne({
        user: targetUserId,
        isActive: true,
        rawKey: { $exists: true, $nin: [null, ''] },
      })
        .sort({ createdAt: -1 })
        .lean();

      if (!existingKeyDoc || !existingKeyDoc.rawKey || existingKeyDoc.rawKey.includes('...')) {
        const randomHex = crypto.randomBytes(24).toString('hex');
        const rawApiKey = `wpy_live_${randomHex}`;
        const keyPrefix = `wpy_live_${randomHex.slice(0, 6)}...`;
        const keyHash = crypto.createHash('sha256').update(rawApiKey).digest('hex');

        const created = await UserApiKey.create({
          user: targetUserId,
          name: 'Wappy Studio & Antigravity Key',
          keyPrefix,
          keyHash,
          rawKey: rawApiKey,
          scopes: ['mcp:read', 'mcp:write', 'sgsst', 'profile'],
          isActive: true,
        });
        existingKeyDoc = created.toObject();
      }

      const bridge = getAntigravityBridgeStatus(req, targetUserId);
      const oneLineCommand = `curl -fsSL "${originUrl}/api/studio/antigravity/skills-installer.js" | node - --key=${existingKeyDoc.rawKey} --url=${originUrl}`;

      return res.json({
        ok: true,
        success: true,
        isGuest: false,
        apiKey: existingKeyDoc.rawKey,
        userId: targetUserId,
        connected: bridge.userDaemonConnected,
        activeListeners: bridge.userListeners,
        oneLineCommand,
        bridge,
      });
    }

    // Caso 2: Visitante sin cuenta (o clave wpy_guest_ existente)
    const incomingGuestKey = String(
      req.body?.guestKey ||
        req.body?.antigravityApiKey ||
        req.body?.apiKey ||
        req.query?.guestKey ||
        req.query?.apiKey ||
        req.headers['x-antigravity-api-key'] ||
        req.headers['x-api-key'] ||
        '',
    ).trim();

    let guestKey = incomingGuestKey;
    if (!guestKey.startsWith('wpy_guest_') || guestKey.length < 20 || !/^wpy_guest_[a-zA-Z0-9_-]{10,}$/.test(guestKey)) {
      guestKey = `wpy_guest_${crypto.randomBytes(12).toString('hex')}`;
    }

    const derivedObjectId = crypto.createHash('md5').update(guestKey).digest('hex').slice(0, 24);
    const bridge = getAntigravityBridgeStatus(req, derivedObjectId);
    const oneLineCommand = `curl -fsSL "${originUrl}/api/studio/antigravity/skills-installer.js" | node - --key=${guestKey} --url=${originUrl}`;

    return res.json({
      ok: true,
      success: true,
      isGuest: true,
      apiKey: guestKey,
      guestKey,
      userId: derivedObjectId,
      connected: bridge.userDaemonConnected,
      activeListeners: bridge.userListeners,
      oneLineCommand,
      bridge,
    });
  } catch (error) {
    logger.error('[WappyStudio Antigravity] Error in guest-key endpoint:', error);
    return res.status(500).json({
      ok: false,
      success: false,
      error: error.message || 'Error generando clave de conexión para Antigravity.',
    });
  }
}

router.post('/antigravity/guest-key', studioAuth, handleStudioAntigravityGuestOrUserKey);
router.get('/antigravity/guest-key', studioAuth, handleStudioAntigravityGuestOrUserKey);

/**
 * GET /api/studio/antigravity/skills-bundle.json
 * Devuelve el Pack Oficial de las 7 Skills de Diseño UI/UX y Video 60-FPS de WAPPY IA listas para importar en Google Antigravity.
 */
router.get('/antigravity/skills-bundle.json', (req, res) => {
  try {
    const proto = req.headers['x-forwarded-proto'] || req.protocol || 'https';
    const host = req.headers['x-forwarded-host'] || req.get('host') || 'wappy.club';
    const originUrl = `${proto}://${host}`.replace(/https?:\/\/wappy-ia\.com/gi, 'https://wappy.club');
    const payload = buildWappySkillsBundlePayload(originUrl);

    if (req.query.download === '1' || req.query.download === 'true') {
      res.setHeader('Content-Disposition', 'attachment; filename="WAPPY-Skills-Diseno-y-Video-Antigravity.json"');
    }
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.send(JSON.stringify(payload, null, 2));
  } catch (error) {
    logger.error('[WappyStudio Antigravity] Error serving skills-bundle.json:', error);
    return res.status(500).json({ ok: false, error: 'Error construyendo el paquete de 7 Skills.' });
  }
});

/**
 * GET /api/studio/antigravity/skills-installer.js
 * Script Node.js auto-contenido que instala las 7 Skills de Diseño y Video en ~/.gemini/config/skills/ y ~/.gemini/antigravity/skills/,
 * y si recibe --key=wpy_... descarga e inicia automáticamente el puente reactivo wappy-push-daemon.js.
 */
router.get('/antigravity/skills-installer.js', (req, res) => {
  const proto = req.headers['x-forwarded-proto'] || req.protocol || 'https';
  const host = req.headers['x-forwarded-host'] || req.get('host') || 'wappy.club';
  const defaultOrigin = `${proto}://${host}`.replace(/https?:\/\/wappy-ia\.com/gi, 'https://wappy.club');

  const installerScript = `#!/usr/bin/env node
/**
 * WAPPY IA · Instalador Oficial de las 7 Skills de Diseño y Video 60-FPS + Puente Reactivo Google Antigravity
 */
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const https = require('https');
const http = require('http');
const { spawn } = require('child_process');

const args = process.argv.slice(2);
let apiKey = process.env.WAPPY_API_KEY || '';
let originUrl = process.env.WAPPY_URL || ${JSON.stringify(defaultOrigin)};

for (const arg of args) {
  if (arg.startsWith('--key=')) apiKey = arg.slice(6).trim();
  else if (arg.startsWith('--url=')) originUrl = arg.slice(6).trim();
}

function fetchUrl(urlStr) {
  return new Promise((resolve, reject) => {
    const client = urlStr.startsWith('https') ? https : http;
    client.get(urlStr, (resp) => {
      if (resp.statusCode >= 300 && resp.statusCode < 400 && resp.headers.location) {
        return resolve(fetchUrl(resp.headers.location));
      }
      if (resp.statusCode < 200 || resp.statusCode >= 300) {
        return reject(new Error('HTTP ' + resp.statusCode + ' al descargar ' + urlStr));
      }
      const chunks = [];
      resp.on('data', (c) => chunks.push(c));
      resp.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    }).on('error', reject);
  });
}

(async () => {
  try {
    console.log('\\n🚀 [WAPPY IA <-> Google Antigravity] Descargando Pack Oficial de 7 Skills de Diseño y Video 60-FPS...');
    const bundleRaw = await fetchUrl(originUrl.replace(/\\/$/, '') + '/api/studio/antigravity/skills-bundle.json');
    const bundle = JSON.parse(bundleRaw);
    const skills = Array.isArray(bundle.skills) ? bundle.skills : [];

    const targetRoots = [
      path.join(os.homedir(), '.gemini', 'config', 'skills'),
      path.join(os.homedir(), '.gemini', 'antigravity', 'skills'),
    ];

    for (const rootDir of targetRoots) {
      fs.mkdirSync(rootDir, { recursive: true });
      for (const sk of skills) {
        if (!sk.id || !sk.content) continue;
        const skDir = path.join(rootDir, sk.id);
        fs.mkdirSync(skDir, { recursive: true });
        fs.writeFileSync(path.join(skDir, 'SKILL.md'), sk.content, 'utf8');
      }
    }

    console.log('✅ ' + skills.length + ' Skills instaladas en ~/.gemini/config/skills y ~/.gemini/antigravity/skills:');
    for (const sk of skills) {
      console.log('   • ' + sk.id + ' (' + sk.name + ')');
    }

    if (apiKey && apiKey.startsWith('wpy_')) {
      console.log('\\n🔌 Configurando Puente Reactivo WAPPY <-> Antigravity para clave ' + apiKey.slice(0, 14) + '...');
      const agyDir = path.join(os.homedir(), '.gemini', 'antigravity');
      fs.mkdirSync(agyDir, { recursive: true });

      const envPath = path.join(agyDir, 'wappy-env.json');
      let currentEnv = {};
      try {
        if (fs.existsSync(envPath)) currentEnv = JSON.parse(fs.readFileSync(envPath, 'utf8'));
      } catch (_) {}
      currentEnv.WAPPY_API_KEY = apiKey;
      currentEnv.WAPPY_URL = originUrl.replace(/\\/$/, '');
      fs.writeFileSync(envPath, JSON.stringify(currentEnv, null, 2), 'utf8');

      const daemonCode = await fetchUrl(originUrl.replace(/\\/$/, '') + '/api/mcp-bridge/antigravity/daemon.js');
      const daemonPath = path.join(agyDir, 'wappy-push-daemon.js');
      if (daemonCode && daemonCode.length > 200) {
        fs.writeFileSync(daemonPath, daemonCode, 'utf8');
        try { fs.chmodSync(daemonPath, 0o755); } catch (_) {}
      }

      if (fs.existsSync(daemonPath)) {
        const child = spawn(process.execPath, [daemonPath, '--daemon'], {
          detached: true,
          stdio: 'ignore',
          env: { ...process.env, WAPPY_API_KEY: apiKey, WAPPY_URL: originUrl.replace(/\\/$/, '') },
        });
        child.unref();
        console.log('✅ Daemon Reactivo SSE iniciado en segundo plano (PID: ' + child.pid + '). ¡Wappy Studio ya está conectado!');
      }
    } else {
      console.log('\\n💡 Tip: Pasa --key=wpy_... para conectar también el Daemon Reactivo en tiempo real.');
    }
  } catch (err) {
    console.error('❌ Error en el instalador de WAPPY Studio:', err.message);
    process.exit(1);
  }
})();
`;

  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache');
  return res.send(installerScript);
});

/**
 * GET /api/studio/antigravity/status
 * Devuelve el estado en tiempo real del puente Google Antigravity + catálogo de las 7 Skills y 19 Efectos.
 */
router.get('/antigravity/status', studioAuth, async (req, res) => {
  const resolved = await resolveStudioTargetUser(req);
  const bridge = getAntigravityBridgeStatus(req, resolved.userId);
  return res.json({
    ok: true,
    success: true,
    isGuest: resolved.isGuest,
    userId: resolved.userId || null,
    bridge,
    skills: ANTIGRAVITY_VIDEO_SKILLS_CATALOG,
    artDirections: ANTIGRAVITY_ART_DIRECTIONS,
    effectsCatalog: ANTIGRAVITY_EFFECTS_CATALOG,
  });
});

/**
 * POST /api/studio/antigravity/super-prompt
 * Construye con Inteligencia Artificial (Gemini) el Super-Prompt Maestro de las 7 Piezas + Escaleta Estructurada por Escenas (60 FPS)
 * integrando TODA la información recolectada en la interfaz (guion TTS, escaleta de tiempos y pausas, dirección de arte,
 * efectos seleccionados, insignia, titular, subtítulo, color de acento, voz, estilo vocal e instrucciones del usuario).
 */
router.post('/antigravity/super-prompt', studioAuth, async (req, res) => {
  try {
    const {
      idea = '',
      prompt = '',
      userPrompt = '',
      scriptText = '',
      scriptSteps = [],
      selectedArtDirection = '',
      artDirection: bodyArtDirection = '',
      theme = '',
      selectedSkillEffects = [],
      selectedEffects = [],
      effects = [],
      aspectRatio = '9:16',
      durationSeconds = 30,
      badgeText = 'CÁPSULA INTERACTIVA WAPPY',
      headlineText = '',
      subtitleText = '',
      accentColor = '#14b8a6',
      voiceName = 'Kore',
      stylePrompt = '',
      companyName = 'WAPPY IA',
      modelName,
      customKeys,
      apiKeys,
    } = req.body || {};

    const artDirection =
      selectedArtDirection || bodyArtDirection || theme || 'dark-tech-hud';
    const artMeta =
      ANTIGRAVITY_ART_DIRECTIONS.find((a) => a.id === artDirection) ||
      ANTIGRAVITY_ART_DIRECTIONS[0];

    const chosenEffects =
      Array.isArray(selectedSkillEffects) && selectedSkillEffects.length > 0
        ? selectedSkillEffects
        : Array.isArray(selectedEffects) && selectedEffects.length > 0
          ? selectedEffects
          : Array.isArray(effects) && effects.length > 0
            ? effects
            : [
                '19-cover-2s',
                'felix-voxel-3d',
                '05-phone-mockup',
                '07-zoom-through',
                '13-checklist-sst',
                'sfx-pack',
              ];

    const chosenEffectsDetailed = chosenEffects.map((effId) => {
      const found = ANTIGRAVITY_EFFECTS_CATALOG.find(
        (item) =>
          item.id === effId ||
          item.name.toLowerCase() === String(effId || '').toLowerCase(),
      );
      return found
        ? `${found.name} (${found.id}: ${found.description || found.archetype})`
        : String(effId);
    });

    const safeDuration = Math.max(8, Math.min(180, Number(durationSeconds) || 28));
    const customUserDirective = String(userPrompt || idea || prompt || '').trim();
    const seedTopic =
      String(scriptText || customUserDirective || headlineText || '').trim() ||
      'Las 5 Reglas de Oro y prevención inteligente en Seguridad y Salud en el Trabajo con WAPPY IA';

    const { allKeys } = await getCombinedKeysForRequest(req, customKeys || apiKeys);
    const modelsToTry = resolveStudioFastTextModels(
      modelName || req.user?.personalization?.geminiModels?.sstManagement,
    );
    const keysToTry = allKeys.slice(0, 4);

    let structuredScript = String(scriptText || '').trim();
    let usedModel = modelsToTry[0] || 'gemini-3.5-flash-lite';
    let usedAi = false;

    // 1. Si el guión está vacío o es muy corto (< 18 palabras), pedir a Gemini que redacte la locución completa primero
    if (!structuredScript || structuredScript.split(/\s+/).length < 18) {
      const targetWords = Math.max(35, Math.round(safeDuration * 2.4));
      const scriptPrompt = `Eres el Director Creativo de WAPPY IA y Google Antigravity.
Escribe un guión de locución en español de aproximadamente ${targetWords} palabras (para ${safeDuration} segundos), dividido en 4 a 6 párrafos cortos separados por salto de línea, sobre: "${seedTopic}".
Reglas obligatorias:
1. El primer párrafo (0.00s - 2.00s) debe ser un gancho magnético de alto impacto.
2. Los párrafos intermedios deben desarrollar los puntos clave con lenguaje claro, preciso y profesional.
3. El último párrafo debe ser un cierre inspirador con llamado a la acción.
4. Devuelve ÚNICAMENTE el texto limpio de la locución separado por saltos de línea, sin títulos ni acotaciones.`;

      if (keysToTry.length > 0) {
        outerScriptLoop: for (const key of keysToTry) {
          for (const mId of modelsToTry) {
            try {
              const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(mId)}:generateContent?key=${encodeURIComponent(key)}`;
              const resp = await axios.post(
                url,
                {
                  contents: [{ role: 'user', parts: [{ text: scriptPrompt }] }],
                  generationConfig: { temperature: 0.45 },
                },
                { timeout: 8500 },
              );
              const candidate =
                resp.data?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || '';
              if (candidate.trim().length > 30) {
                structuredScript = stripVoiceStyleLeakageFromScript(candidate.trim());
                usedModel = mId;
                usedAi = true;
                break outerScriptLoop;
              }
            } catch (_) {
              /* try next */
            }
          }
        }
      }

      if (!structuredScript || structuredScript.split(/\s+/).length < 18) {
        structuredScript = [
          `¿Sabías que el exceso de confianza es el enemigo número uno en terreno? Hoy activamos el blindaje inteligente de ${companyName} para proteger tu vida.`,
          `Primero: Verifica el aislamiento total y aplica bloqueo certificado antes de intervenir cualquier equipo crítico.`,
          `Segundo: Escanea en vivo el permiso de trabajo y valida el estándar técnico con trazabilidad digital al cien por ciento.`,
          `Tercero: Comprueba ausencia de riesgo residual con instrumentos calibrados y señalización perimetral activa.`,
          `Porque en ${companyName} tu familia te espera sana y salva en casa. Comenta SOMOS SST y transforma tu gestión preventiva hoy mismo.`,
        ].join('\n\n');
      }
    }

    const timelineMap = computeServerScriptTimelineMap(structuredScript, safeDuration);
    const baseScenes = buildSmartScenePlanFromScript(structuredScript, timelineMap.beats, {
      companyName,
      selectedEffects: chosenEffects,
      scriptSteps,
      badgeText,
      headlineText,
      subtitleText,
    });

    // 2. SIEMPRE invocar a Gemini IA con TODA la información recolectada para diseñar el Super-Prompt de las 7 Piezas + Escaleta Cinematográfica
    const currentStepsContext =
      Array.isArray(scriptSteps) && scriptSteps.length > 0
        ? scriptSteps
            .map(
              (s, i) =>
                `  Tramo ${i + 1} [${s.timeRange || `${baseScenes[i]?.startSec || 0}s-${baseScenes[i]?.endSec || 5}s`}] | Título actual: "${s.title || ''}" | Efecto: "${s.visualEffect || s.effect || ''}" | Locución/Pausas: "${s.narration || s.voiceover || s.text || ''}"`,
            )
            .join('\n')
        : '  (Sin tramos manuales previos; estructurar según los beats del guion)';

    const beatsContext = timelineMap.beats
      .map(
        (b, idx) =>
          `  Beat ${idx + 1} [${b.startSec}s - ${b.endSec}s] (Duración: ${b.durationSec}s | Efecto sugerido: ${chosenEffects[idx % chosenEffects.length]}): "${b.text}"`,
      )
      .join('\n');

    const superPromptAiInstruction = `Eres el Director de Arte y Arquitecto Principal de Motion Graphics 60-FPS de WAPPY IA y Google Antigravity.
Tu misión es analizar TODA la información recolectada del usuario en WAPPY Studio y generar un Super-Prompt Técnico Maestro (Sistema de las 7 Piezas) y la Escaleta Cinematográfica enriquecida para nuestro motor HTML5 + GSAP + Three.js a 60 FPS.

DATOS RECOLECTADOS DE LA INTERFAZ DEL USUARIO:
- Formato y Resolución: ${aspectRatio} (${aspectRatio === '16:9' ? '1920x1080 Horizontal YouTube/LMS' : '1080x1920 Vertical Reels/TikTok'}) a 60 FPS
- Duración Total Sincronizada: ${safeDuration} segundos
- Dirección de Arte Seleccionada: ${artMeta.name} (ID: ${artDirection} | Paleta: ${artMeta.palette.join(', ')})
- Color de Acento Seleccionado: ${accentColor}
- Insignia Superior (Badge): "${badgeText || 'CÁPSULA INTERACTIVA WAPPY'}"
- Titular Principal de Portada: "${headlineText || ''}"
- Subtítulo de Capa: "${subtitleText || ''}"
- Voz Neural Seleccionada: ${voiceName} ${stylePrompt ? `(Estilo vocal: ${stylePrompt})` : ''}
- Efectos Virales Antigravity Seleccionados (${chosenEffects.length}):
  ${chosenEffectsDetailed.join('\n  ')}
${customUserDirective ? `- Instrucción / Idea Adicional del Usuario: "${customUserDirective}"` : ''}

GUION COMPLETO DE LOCUCIÓN:
"""
${structuredScript}
"""

ESCALETA DE TIEMPOS Y PAUSAS CONFIGURADA POR EL USUARIO:
${currentStepsContext}

BEATS ACÚSTICOS PONDERADOS (${timelineMap.beats.length} escenas):
${beatsContext}

REGLAS OBLIGATORIAS DE DIRECCIÓN DE ARTE WAPPY IA:
1. NUNCA uses nombres propios como "Félix" ni etiquetas promocionales como "¡GRATIS!". Nombra siempre al presentador como "Avatar 3D".
2. La Escena 1 debe iniciar con la Portada Magnética (0.0s - 2.0s) con titular de alto impacto e insignias técnicas coherentes con el guion.
3. Adapta todos los títulos, tarjetas comparativas (riesgo vs solución), nodos e instrucciones de cámara 100% al tema real del guion (no uses textos genéricos si el guion habla de un tema específico).
4. En cada escena incluye etiquetas de respiración y pausa vocal (\`[pausa 0.5s]\`, \`<breath>\`) para sincronía labial del Avatar 3D.

Devuelve ÚNICAMENTE un objeto JSON válido (sin bloques markdown \`\`\`json) con esta estructura exacta:
{
  "conceptTitle": "Título creativo y técnico específico para esta producción",
  "executiveCreativeDirection": "Párrafo detallado (3-4 líneas) explicando la atmósfera visual, iluminación, uso de la paleta ${artDirection}, tipografía y narrativa visual específica para este guion",
  "avatarChoreography": "Instrucción precisa de cómo actúa el Avatar 3D, sincronía labial con la voz ${voiceName} y gestos hacia las tarjetas en cada cambio de escena",
  "normativeAndTechnicalFocus": ["Concepto o norma clave 1 extraída del guion", "Concepto o norma clave 2", "Concepto o norma clave 3"],
  "soundAndPacingDesign": "Estrategia de ritmo, pausas dramáticas y efectos sonoros (whoosh, pop, ding) para los ${safeDuration}s",
  "scenes": [
    {
      "stepNumber": 1,
      "timeRange": "0.0s-2.0s",
      "title": "Título potente de la escena",
      "eyebrow": "INSIGNIA CORTA EN MAYÚSCULAS (máx 28 chars)",
      "titleBefore": "2-3 palabras iniciales (máx 22 chars)",
      "titleHighlight": "Concepto clave resaltado (máx 20 chars)",
      "highlightStyle": "lime",
      "narration": "Texto exacto de locución de este tramo con [pausa 0.5s] y <breath>",
      "visualEffect": "Nombre del efecto aplicado de la lista seleccionada",
      "archetype": "hook-vs-wall | iphone-split-showcase | signature-pad-live | chart-grow-math | pentagon-orbital | tenshi-specialists-grid | cta-viral-bubbles",
      "cameraAndMotion": "Descripción técnica de la transición GSAP, movimiento de cámara 3D, entrada elástica E.spring y elementos en pantalla en este tramo",
      "badCardTitle": "Riesgo o problema específico de este tramo (máx 26 chars)",
      "badCardDesc": "Consecuencia real en 1 línea (máx 58 chars)",
      "goodCardTitle": "Solución o control clave (máx 26 chars)",
      "goodCardDesc": "Beneficio concreto en 1 línea (máx 58 chars)",
      "sideCards": [
        { "icon": "⚡", "title": "Punto clave 1 (máx 24 chars)", "desc": "Detalle específico (máx 48 chars)" },
        { "icon": "🔒", "title": "Punto clave 2 (máx 24 chars)", "desc": "Detalle específico (máx 48 chars)" },
        { "icon": "🛡️", "title": "Punto clave 3 (máx 24 chars)", "desc": "Detalle específico (máx 48 chars)" }
      ]
    }
  ]
}`;

    let aiParsed = null;
    if (keysToTry.length > 0) {
      outerAiLoop: for (const key of keysToTry) {
        for (const mId of modelsToTry) {
          try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(mId)}:generateContent?key=${encodeURIComponent(key)}`;
            const resp = await axios.post(
              url,
              {
                contents: [{ role: 'user', parts: [{ text: superPromptAiInstruction }] }],
                generationConfig: {
                  temperature: 0.4,
                  responseMimeType: 'application/json',
                },
              },
              { timeout: 9500 },
            );
            const rawText =
              resp.data?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || '';
            const cleaned = rawText
              .replace(/^```json\s*/i, '')
              .replace(/^```\s*/i, '')
              .replace(/\s*```$/i, '')
              .trim();
            const firstBrace = cleaned.indexOf('{');
            const lastBrace = cleaned.lastIndexOf('}');
            if (firstBrace !== -1 && lastBrace > firstBrace) {
              const candidateObj = JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
              if (
                candidateObj &&
                (candidateObj.executiveCreativeDirection || Array.isArray(candidateObj.scenes))
              ) {
                aiParsed = candidateObj;
                usedModel = mId;
                usedAi = true;
                break outerAiLoop;
              }
            }
          } catch (_) {
            /* try next model/key */
          }
        }
      }
    }

    const aiScenes = Array.isArray(aiParsed?.scenes) ? aiParsed.scenes : [];

    // 3. Combinar las escenas generadas por Gemini IA con las métricas de tiempo deterministas
    const scenesBreakdown = baseScenes.map((sc, idx) => {
      const aiSc = aiScenes[idx] || {};
      const userStep =
        Array.isArray(scriptSteps) && scriptSteps[idx] && typeof scriptSteps[idx] === 'object'
          ? scriptSteps[idx]
          : null;
      const chosenEffId = chosenEffects[idx % chosenEffects.length];
      const catalogEff = ANTIGRAVITY_EFFECTS_CATALOG.find((e) => e.id === chosenEffId);
      const effectiveVisualEffect =
        aiSc.visualEffect ||
        userStep?.visualEffect ||
        catalogEff?.name ||
        chosenEffId ||
        sc.archetype;
      const resolvedArchetype = resolveArchetypeFromEffect(
        aiSc.archetype || effectiveVisualEffect || chosenEffId,
        idx,
        idx === 0,
        idx === baseScenes.length - 1,
      );

      return {
        ...sc,
        archetype: resolvedArchetype,
        visualEffect: effectiveVisualEffect,
        cameraAndMotion:
          aiSc.cameraAndMotion ||
          `Entrada elástica E.spring (60 FPS) con ${effectiveVisualEffect}, tarjetas Glassmorphism y Avatar 3D sincronizado al beat.`,
        eyebrow: String(aiSc.eyebrow || sc.eyebrow).slice(0, 32),
        titleBefore: String(aiSc.titleBefore || sc.titleBefore).slice(0, 26),
        titleHighlight: String(aiSc.titleHighlight || sc.titleHighlight).slice(0, 26),
        highlightStyle: ['lime', 'cyan', 'red'].includes(aiSc.highlightStyle)
          ? aiSc.highlightStyle
          : sc.highlightStyle,
        badCardTitle: aiSc.badCardTitle || sc.badCardTitle,
        badCardDesc: aiSc.badCardDesc || sc.badCardDesc,
        goodCardTitle: aiSc.goodCardTitle || sc.goodCardTitle,
        goodCardDesc: aiSc.goodCardDesc || sc.goodCardDesc,
        sideCards:
          Array.isArray(aiSc.sideCards) && aiSc.sideCards.length >= 3
            ? aiSc.sideCards.slice(0, 3).map((c, cIdx) => ({
                icon: c.icon || sc.sideCards[cIdx]?.icon || '⚡',
                title: c.title || sc.sideCards[cIdx]?.title || 'Control Clave',
                desc: c.desc || sc.sideCards[cIdx]?.desc || '',
                color: sc.sideCards[cIdx]?.color || 'cyan',
              }))
            : sc.sideCards,
      };
    });

    const normalizedSteps = scenesBreakdown.map((sc, idx) => {
      const aiSc = aiScenes[idx] || {};
      const startLabel = idx === 0 ? '0.0s' : `${Number(sc.startSec || 0).toFixed(1)}s`;
      const endLabel =
        idx === 0 && Number(sc.endSec || 0) < 2.2
          ? '2.0s'
          : `${Number(sc.endSec || 0).toFixed(1)}s`;
      const rawNarration = String(aiSc.narration || sc.subtitle || '').trim();
      const hasBreath = rawNarration.includes('<breath>');
      const hasPause = rawNarration.includes('[pausa');
      const enrichedNarration = `${idx > 0 && !hasPause ? '[pausa 0.5s] ' : ''}${rawNarration}${!hasBreath ? ' <breath>' : ''}`.trim();

      return {
        id: `step-${idx + 1}`,
        stepNumber: idx + 1,
        type: idx === 0 ? 'HOOK' : idx === scenesBreakdown.length - 1 ? 'CTA' : 'BODY',
        tag: sc.eyebrow,
        eyebrow: sc.eyebrow,
        badgeText: idx === 0 ? badgeText || sc.eyebrow : sc.eyebrow,
        headlineText: `${sc.titleBefore} ${sc.titleHighlight}`.trim(),
        titleBefore: sc.titleBefore,
        titleHighlight: sc.titleHighlight,
        highlightStyle: sc.highlightStyle,
        voiceover: sc.subtitle,
        text: sc.subtitle,
        narration: enrichedNarration,
        timeRange: aiSc.timeRange || `${startLabel}-${endLabel}`,
        title: aiSc.title || `${sc.titleBefore} ${sc.titleHighlight}`.trim(),
        pauseTag: idx === 0 ? '[pausa 0.5s]' : '<breath>',
        visualEffect: sc.visualEffect,
        cameraAndMotion: sc.cameraAndMotion,
        badCardTitle: sc.badCardTitle,
        badCardDesc: sc.badCardDesc,
        goodCardTitle: sc.goodCardTitle,
        goodCardDesc: sc.goodCardDesc,
        sideCards: sc.sideCards,
        startSec: sc.startSec,
        endSec: sc.endSec,
        durationSec: sc.durationSec,
        archetype: sc.archetype,
        effect: sc.visualEffect,
      };
    });

    const normativeList =
      Array.isArray(aiParsed?.normativeAndTechnicalFocus) &&
      aiParsed.normativeAndTechnicalFocus.length > 0
        ? aiParsed.normativeAndTechnicalFocus
        : ['Resolución 0312 de 2019', 'Decreto 1072 de 2015', 'GTC 45', 'Estándar Técnico WAPPY IA'];

    const sevenPieces = {
      piece1_artDirection: {
        aspectRatio,
        resolution: aspectRatio === '16:9' ? '1920x1080' : '1080x1920',
        fps: 60,
        artDirection,
        artDirectionName: artMeta.name,
        accentColor,
      },
      piece2_brandIdentity: {
        primaryLime: '#C7F303',
        deepOlive: '#0E1300',
        sstTeal: '#0D9488',
        cyberDark: '#0C192E',
        accentColor,
        typography: 'Outfit ExtraBold + Plus Jakarta Sans + JetBrains Mono',
        avatar: 'Avatar 3D (Three.js Lip-Sync Reactivo)',
      },
      piece3_audienceAndNorms: {
        audience: 'Equipos Operativos, Líderes SG-SST, Prevencionistas y Comunidad WAPPY IA',
        regulations: normativeList,
      },
      piece4_magneticCoverAndScript: {
        coverWindow: '0.00s - 2.00s',
        badgeText: badgeText || normalizedSteps[0]?.eyebrow || 'CÁPSULA INTERACTIVA WAPPY',
        headlineText:
          headlineText ||
          aiParsed?.conceptTitle ||
          normalizedSteps[0]?.headlineText ||
          'PRODUCCIÓN WAPPY STUDIO',
        subtitleText: subtitleText || normalizedSteps[0]?.voiceover || '',
        totalScenes: normalizedSteps.length,
      },
      piece5_motionGraphics60fps: {
        engine: 'Deterministic 60-FPS E.spring + GSAP Timeline + 7 Kinetic Archetypes',
        selectedEffects: chosenEffectsDetailed,
        archetypesSequence: scenesBreakdown.map((s) => s.archetype),
      },
      piece6_soundDesign: {
        voiceName,
        stylePrompt: stylePrompt || 'Narración profesional sincronizada',
        pacingNotes:
          aiParsed?.soundAndPacingDesign ||
          'Sincronía palabra por palabra con envolvente PCM16 RMS a 60 FPS y SFX sutiles (whoosh, pop, ding).',
      },
      piece7_renderPreviews: {
        previewTimestampsSec: [
          0.8,
          Number((safeDuration * 0.5).toFixed(1)),
          Number(Math.max(1.5, safeDuration - 1.2).toFixed(1)),
        ],
      },
    };

    const superPrompt = [
      `# SUPER-PROMPT MAESTRO IA · WAPPY STUDIO & GOOGLE ANTIGRAVITY (60 FPS)`,
      `- **Proyecto:** ${aiParsed?.conceptTitle || sevenPieces.piece4_magneticCoverAndScript.headlineText}`,
      `- **Motor IA & Formato:** Generado con \`${usedModel}\` • ${aspectRatio} (${sevenPieces.piece1_artDirection.resolution} a 60 FPS) • Duración: ${safeDuration}s`,
      `- **Pieza 1 & 2 — Dirección de Arte e Identidad:** \`${artMeta.name}\` (\`${artDirection}\` | Paleta: ${artMeta.palette.join(', ')} | Acento: \`${accentColor}\`)`,
      `  ${aiParsed?.executiveCreativeDirection || `Escenario cinematográfico ${artMeta.name} con tarjetas Glassmorphism de alto contraste, tipografía Outfit ExtraBold y jerarquía limpia sin desbordamiento.`}`,
      `- **Pieza 3 — Enfoque Técnico y Conceptos Clave:** ${normativeList.join(' • ')}`,
      `- **Pieza 4 — Portada Magnética (0.00s - 2.00s):** Insignia \`${sevenPieces.piece4_magneticCoverAndScript.badgeText}\` | Titular: "${sevenPieces.piece4_magneticCoverAndScript.headlineText}"${sevenPieces.piece4_magneticCoverAndScript.subtitleText ? ` | Subtítulo: "${sevenPieces.piece4_magneticCoverAndScript.subtitleText}"` : ''}`,
      `- **Pieza 5 — Coreografía Avatar 3D & Efectos Activos (${chosenEffects.length} FX):**`,
      `  • **Avatar 3D:** ${aiParsed?.avatarChoreography || `Presentador Avatar 3D en zona segura con sincronía labial PCM16 a 60 FPS con la voz ${voiceName} y gestos dinámicos hacia las tarjetas.`}`,
      `  • **Efectos Inyectados:** ${chosenEffects.map((id) => ANTIGRAVITY_EFFECTS_CATALOG.find((e) => e.id === id)?.name || id).join(', ')}`,
      `- **Pieza 6 — Diseño Sonoro y Prosodia (${voiceName}):** ${sevenPieces.piece6_soundDesign.pacingNotes}`,
      ``,
      `## Escaleta Cinematográfica Sincronizada Segundo a Segundo (${normalizedSteps.length} Escenas)`,
      ...normalizedSteps.map(
        (st) =>
          `${st.stepNumber}. **[${st.timeRange} | Efecto: \`${st.visualEffect}\` | Arquetipo: \`${st.archetype}\`]** — *${st.title}*\n   - **Titular en Pantalla:** \`[${st.eyebrow}]\` ${st.titleBefore} **${st.titleHighlight}**\n   - **Cámara & Motion 60-FPS:** ${st.cameraAndMotion}\n   - **Tarjetas Clave:** ❌ *${st.badCardTitle}* vs ✅ *${st.goodCardTitle}* (${(st.sideCards || []).map((c) => `${c.icon} ${c.title}`).join(' · ')})\n   - **Locución Sincronizada:** "${st.narration}"`,
      ),
    ].join('\n');

    const resolvedTarget = await resolveStudioTargetUser(req);
    const bridge = notifyStudioAntigravityBridge(
      req,
      'super_prompt_generated',
      {
        aspectRatio,
        artDirection,
        durationSeconds: safeDuration,
        scenesCount: normalizedSteps.length,
        usedAi,
        usedModel,
      },
      resolvedTarget.userId,
    );

    return res.json({
      ok: true,
      success: true,
      usedAi,
      usedModel,
      superPrompt,
      structuredScript,
      scriptText: structuredScript,
      scriptSteps: normalizedSteps,
      scenesBreakdown,
      sevenPieces,
      timelineMap,
      bridge,
    });
  } catch (error) {
    logger.error('[WappyStudio Antigravity] Error generating super-prompt:', error);
    return res.status(500).json({
      ok: false,
      success: false,
      error: error.message || 'Error generando el Super-Prompt de Antigravity.',
    });
  }
});

/**
 * Handler compartido para POST /api/studio/video/generate-html y POST /api/studio/antigravity/generate-html
 * Genera una composición animada con el Motor Maestro 60-FPS de Antigravity (HyperFrames + Three.js WappyAvatarVoxel3D + 7 Arquetipos Dinámicos)
 * sincronizada milimétricamente con las pausas reales de la voz WAV y envolvente RMS de lip-sync.
 */
async function handleGenerateMasterReelHtml(req, res) {
  try {
    const {
      prompt = '',
      superPrompt = '',
      scriptText = '',
      scriptSteps = [],
      scenesBreakdown = [],
      effects = [],
      selectedEffects = [],
      selectedSkillEffects = [],
      aspectRatio = '9:16',
      theme = 'dark-tech-hud',
      selectedArtDirection = '',
      hasBaseVideo = false,
      showSubtitles = true,
      durationSeconds = 30,
      companyName = 'WAPPY IA',
      badgeText = '',
      headlineText = '',
      subtitleText = '',
      accentColor = '',
      modelName,
      audioBase64,
      customKeys,
      apiKeys,
    } = req.body || {};

    const modelsToTry = resolveStudioFastTextModels(
      modelName || req.user?.personalization?.geminiModels?.sstManagement,
    );
    const preferredTextModel = modelsToTry[0] || 'gemini-3.5-flash-lite';

    const safeDuration = Math.max(6, Math.min(180, Number(durationSeconds) || 30));
    const stepsScript = Array.isArray(scriptSteps) && scriptSteps.length > 0
      ? scriptSteps.map((s) => (typeof s === 'string' ? s : s?.voiceover || s?.narration || s?.text || '')).filter(Boolean).join('\n\n')
      : '';
    const effectiveScript =
      scriptText ||
      stepsScript ||
      prompt ||
      superPrompt ||
      'La prevención y la inteligencia artificial transforman la seguridad en el trabajo con WAPPY IA.';

    let timelineMap = computeServerScriptTimelineMap(effectiveScript, safeDuration);

    // Si el cliente envió el audio WAV sintetizado, detectar silencios reales y extraer envolvente RMS 60-FPS
    if (audioBase64 && typeof audioBase64 === 'string') {
      try {
        const cleanB64 = audioBase64.replace(/^data:audio\/[^;]+;base64,/, '');
        const wavBuf = Buffer.from(cleanB64, 'base64');
        timelineMap = alignTimelineMapWithWavBuffer(timelineMap, wavBuf);
      } catch (wavErr) {
        logger.debug('[WappyStudio Video] WAV alignment fallback:', wavErr.message);
      }
    }

    const { allKeys } = await getCombinedKeysForRequest(req, customKeys || apiKeys);
    const keysToUse = allKeys.slice(0, 4);
    let usedModel = preferredTextModel;

    const aiGeneratorFn = async (planPrompt) => {
      if (keysToUse.length > 0) {
        for (const key of keysToUse) {
          for (const mId of modelsToTry) {
            try {
              const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(mId)}:generateContent?key=${encodeURIComponent(key)}`;
              const resp = await axios.post(
                url,
                {
                  contents: [{ role: 'user', parts: [{ text: planPrompt }] }],
                  generationConfig: {
                    temperature: 0.35,
                    responseMimeType: 'application/json',
                  },
                },
                { timeout: 9500 },
              );
              const candidateText =
                resp.data?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || '';
              if (candidateText.trim()) {
                usedModel = mId;
                return candidateText.trim();
              }
            } catch (_) {
              /* try next model/key */
            }
          }
        }
      }
      const aiResult = await generateWithKeyRotation(
        { model: preferredTextModel, generationConfig: { temperature: 0.35 } },
        req.user,
        planPrompt,
      );
      return (aiResult?.response?.text?.() || '').trim();
    };

    const chosenEffects =
      Array.isArray(selectedSkillEffects) && selectedSkillEffects.length > 0
        ? selectedSkillEffects
        : Array.isArray(selectedEffects) && selectedEffects.length > 0
          ? selectedEffects
          : Array.isArray(effects)
            ? effects
            : [];
    const effectiveTheme = selectedArtDirection || theme || 'dark-tech-hud';

    const scenePlan = await generateCreativeScenePlanWithAi(
      effectiveScript,
      timelineMap.beats,
      {
        companyName,
        prompt: superPrompt || prompt,
        theme: effectiveTheme,
        selectedEffects: chosenEffects,
        scriptSteps: Array.isArray(scriptSteps) && scriptSteps.length > 0 ? scriptSteps : scenesBreakdown,
        badgeText,
        headlineText,
        subtitleText,
      },
      aiGeneratorFn,
    );

    let htmlCode = compileAntigravityMasterReelHtml(scenePlan, timelineMap, {
      aspectRatio,
      hasBaseVideo,
      companyName,
      showSubtitles,
      theme: effectiveTheme,
      selectedArtDirection: effectiveTheme,
      accentColor,
    });

    htmlCode = postProcessGeneratedVideoHtml(htmlCode, timelineMap);

    const resolvedTarget = await resolveStudioTargetUser(req);
    const delegation = await delegateStudioOrderToAntigravityIfConnected(req, resolvedTarget.userId, {
      title: `Wappy Studio · Generar Animación 60-FPS (${aspectRatio})`,
      instruction: `${superPrompt || prompt || effectiveScript}\n\n[Nota para Antigravity]: Aplica las 7 Skills de Diseño y Video 60-FPS de WAPPY IA y completa la orden con formato="html".`,
      outputType: 'html',
    });

    const bridge = notifyStudioAntigravityBridge(
      req,
      'html_generated',
      {
        aspectRatio,
        theme: effectiveTheme,
        scenesCount: scenePlan.length,
        durationSeconds: timelineMap.totalDurationSeconds,
        usedModel,
        ordenId: delegation?.ordenId || null,
      },
      resolvedTarget.userId,
    );

    return res.json({
      ok: true,
      success: true,
      engine: 'antigravity-master-reel-60fps',
      usedModel,
      htmlCode,
      timelineMap,
      scenePlan,
      scenesBreakdown: scenePlan,
      delegation,
      bridge,
    });
  } catch (error) {
    logger.error('[WappyStudio Video] Error generating HTML composition:', error);
    return res.status(500).json({
      ok: false,
      success: false,
      error: error.message || 'Error generando la animación HTML con IA.',
    });
  }
}

router.post('/video/generate-html', studioAuth, handleGenerateMasterReelHtml);
router.post('/antigravity/generate-html', studioAuth, handleGenerateMasterReelHtml);

/**
 * POST /api/studio/antigravity/edit-html
 * Aplica correcciones y ajustes en vivo sobre el HTML 60-FPS generado (colores, dirección de arte,
 * tamaños tipográficos, textos de tarjetas, arquetipos o CSS personalizado) preservando el motor
 * determinista (window.__wappySeekTo, window.__wappyRenderTick, WappyAvatarVoxel3D y sincronización WAV).
 */
router.post('/antigravity/edit-html', studioAuth, async (req, res) => {
  try {
    const {
      htmlCode = '',
      currentHtml = '',
      editInstruction = '',
      correctionPrompt = '',
      prompt = '',
      superPrompt = '',
      scriptText = '',
      scriptSteps = [],
      scenesBreakdown = [],
      durationSeconds = 30,
      audioBase64,
      aspectRatio = '9:16',
      showSubtitles = true,
      theme = '',
      selectedArtDirection = '',
      effects = [],
      selectedEffects = [],
      selectedSkillEffects = [],
      badgeText = '',
      headlineText = '',
      subtitleText = '',
      accentColor = '',
      companyName = 'WAPPY IA',
      customKeys,
      apiKeys,
      modelName,
    } = req.body || {};

    const instruction = String(editInstruction || correctionPrompt || prompt || '').trim();
    const sourceHtml = String(htmlCode || currentHtml || '').trim();

    if (!instruction && !sourceHtml && !scriptText) {
      return res.status(400).json({
        ok: false,
        success: false,
        error: 'Se requiere una instrucción de edición (editInstruction) o el código HTML actual.',
      });
    }

    const lowerInst = instruction.toLowerCase();
    let detectedTheme = selectedArtDirection || theme || 'dark-tech-hud';
    if (/cielo|azul|sky|cloud|claro/.test(lowerInst)) {
      detectedTheme = 'cielo-wappy-cloud';
    } else if (/crema|editorial|papel|dummies/.test(lowerInst)) {
      detectedTheme = 'crema-editorial-sst';
    } else if (/lima|oliva|verde|brand/.test(lowerInst)) {
      detectedTheme = 'wappy-lima-oliva';
    } else if (/dark|cyber|hud|oscuro/.test(lowerInst)) {
      detectedTheme = 'dark-tech-hud';
    }

    let detectedAspect = aspectRatio;
    if (/16:9|horizontal|youtube/.test(lowerInst)) {
      detectedAspect = '16:9';
    } else if (/9:16|vertical|reel|tiktok/.test(lowerInst)) {
      detectedAspect = '9:16';
    }

    // Construir reglas CSS adicionales según la instrucción del usuario
    const customCssRules = [];
    if (/grande|gigante|aumenta.*t[ií]tulo|m[aá]s grande|agranda/.test(lowerInst)) {
      customCssRules.push('.title-hero { font-size: 72px !important; } .sub-hero { font-size: 31px !important; }');
    }
    if (/peque[ñn]o|reduce.*t[ií]tulo/.test(lowerInst)) {
      customCssRules.push('.title-hero { font-size: 52px !important; } .sub-hero { font-size: 24px !important; }');
    }
    if (/ocultar.*avatar|sin.*avatar|quitar.*avatar/.test(lowerInst)) {
      customCssRules.push('#avatar-host-container { display: none !important; }');
    }
    if (/avatar.*grande|agrandar.*avatar/.test(lowerInst)) {
      customCssRules.push('#avatar-host-container { transform: scale(1.18) !important; }');
    }

    const chosenEffects =
      Array.isArray(selectedSkillEffects) && selectedSkillEffects.length > 0
        ? selectedSkillEffects
        : Array.isArray(selectedEffects) && selectedEffects.length > 0
          ? selectedEffects
          : Array.isArray(effects)
            ? effects
            : [];

    const safeDuration = Math.max(6, Math.min(180, Number(durationSeconds) || 30));
    const effectiveScript =
      scriptText ||
      (Array.isArray(scriptSteps) && scriptSteps.length > 0
        ? scriptSteps.map((s) => (typeof s === 'string' ? s : s?.voiceover || s?.narration || s?.text || '')).filter(Boolean).join('\n\n')
        : '') ||
      'La prevención y la inteligencia artificial transforman la seguridad en el trabajo con WAPPY IA.';

    let timelineMap = computeServerScriptTimelineMap(effectiveScript, safeDuration);
    if (audioBase64 && typeof audioBase64 === 'string') {
      try {
        const cleanB64 = audioBase64.replace(/^data:audio\/[^;]+;base64,/, '');
        const wavBuf = Buffer.from(cleanB64, 'base64');
        timelineMap = alignTimelineMapWithWavBuffer(timelineMap, wavBuf);
      } catch (_) {}
    }

    const { allKeys } = await getCombinedKeysForRequest(req, customKeys || apiKeys);
    const keysToUse = allKeys.slice(0, 4);
    const modelsToTry = resolveStudioFastTextModels(
      modelName || req.user?.personalization?.geminiModels?.sstManagement,
    );

    const aiGeneratorFn = async (planPrompt) => {
      const enrichedPrompt = `${planPrompt}\n\nINSTRUCCIÓN PRIORITARIA DE CORRECCIÓN DEL USUARIO: "${instruction}". Aplica exactamente este cambio en los textos, títulos, badges o datos de las escenas.`;
      if (keysToUse.length > 0) {
        for (const key of keysToUse) {
          for (const mId of modelsToTry) {
            try {
              const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(mId)}:generateContent?key=${encodeURIComponent(key)}`;
              const resp = await axios.post(
                url,
                {
                  contents: [{ role: 'user', parts: [{ text: enrichedPrompt }] }],
                  generationConfig: {
                    temperature: 0.35,
                    responseMimeType: 'application/json',
                  },
                },
                { timeout: 9500 },
              );
              const candidateText =
                resp.data?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || '';
              if (candidateText.trim()) {
                return candidateText.trim();
              }
            } catch (_) {
              /* try next */
            }
          }
        }
      }
      return '';
    };

    const scenePlan = await generateCreativeScenePlanWithAi(
      effectiveScript,
      timelineMap.beats,
      {
        companyName,
        prompt: `${superPrompt || ''}\nEdición solicitada: ${instruction}`,
        theme: detectedTheme,
        selectedEffects: chosenEffects,
        scriptSteps: Array.isArray(scriptSteps) && scriptSteps.length > 0 ? scriptSteps : scenesBreakdown,
        badgeText,
        headlineText,
        subtitleText,
      },
      aiGeneratorFn,
    );

    let updatedHtml = compileAntigravityMasterReelHtml(scenePlan, timelineMap, {
      aspectRatio: detectedAspect,
      companyName,
      showSubtitles,
      theme: detectedTheme,
      selectedArtDirection: detectedTheme,
      accentColor,
      customCss: customCssRules.join('\n'),
    });

    updatedHtml = postProcessGeneratedVideoHtml(updatedHtml, timelineMap);

    const summaryOfChanges = [
      `Instrucción aplicada: "${instruction || 'Actualización de escenas y dirección de arte'}"`,
      `Dirección de arte activa: ${detectedTheme} (${detectedAspect})`,
      `Escenas sincronizadas a 60 FPS: ${scenePlan.length}`,
    ].join(' • ');

    const resolvedTarget = await resolveStudioTargetUser(req);
    const delegation = await delegateStudioOrderToAntigravityIfConnected(req, resolvedTarget.userId, {
      title: `Wappy Studio · Editar Animación 60-FPS (${detectedAspect})`,
      instruction: `Edición solicitada en Wappy Studio: "${instruction}".\nDirección de arte: ${detectedTheme}.\nGuión base:\n${effectiveScript}`,
      outputType: 'html',
    });

    const bridge = notifyStudioAntigravityBridge(
      req,
      'html_edited',
      {
        instruction,
        theme: detectedTheme,
        aspectRatio: detectedAspect,
        scenesCount: scenePlan.length,
        ordenId: delegation?.ordenId || null,
      },
      resolvedTarget.userId,
    );

    return res.json({
      ok: true,
      success: true,
      htmlCode: updatedHtml,
      summaryOfChanges,
      timelineMap,
      scenePlan,
      scenesBreakdown: scenePlan,
      delegation,
      bridge,
    });
  } catch (error) {
    logger.error('[WappyStudio Antigravity] Error editing HTML composition:', error);
    return res.status(500).json({
      ok: false,
      success: false,
      error: error.message || 'Error aplicando la edición sobre la animación HTML.',
    });
  }
});

/**
 * Handler compartido para POST /api/studio/video/render-mp4 y POST /api/studio/antigravity/render-mp4
 * Renderizado MP4 (H.264 + AAC) en servidor mediante Headless Chromium (Puppeteer) + FFmpeg.
 * Une la composición HTML/GSAP + Subtítulos Dinámicos Palabra a Palabra + Pista de Voz WAV en un archivo .mp4 universal.
 */
async function handleRenderMasterReelMp4(req, res) {
  const { spawn } = require('child_process');
  let browser = null;
  let tempDir = null;
  try {
    const {
      htmlCode,
      audioBase64,
      scriptText = '',
      showSubtitles = true,
      subtitlePosition = 'bottom',
      aspectRatio = '9:16',
      durationSeconds = 12,
      fps = 15,
    } = req.body || {};

    if (!htmlCode || typeof htmlCode !== 'string') {
      return res.status(400).json({
        ok: false,
        success: false,
        error: 'Se requiere el código HTML de la composición para renderizar el MP4.',
      });
    }

    // Resolver binario de FFmpeg (soporta entorno local macOS y contenedor Alpine/Docker)
    const ffmpegCandidates = [
      process.env.FFMPEG_PATH,
      '/usr/bin/ffmpeg',
      '/usr/local/bin/ffmpeg',
      path.join(os.homedir(), '.local', 'bin', 'ffmpeg'),
    ].filter(Boolean);

    let ffmpegBin = null;
    for (const candidate of ffmpegCandidates) {
      if (fs.existsSync(candidate)) {
        ffmpegBin = candidate;
        break;
      }
    }

    // Si estamos en contenedor Alpine Linux y aún no tiene ffmpeg instalado en caliente, instalarlo automáticamente
    if (!ffmpegBin && fs.existsSync('/etc/alpine-release')) {
      try {
        const { execSync } = require('child_process');
        logger.info('[WappyStudio Render MP4] Instalando ffmpeg en contenedor Alpine...');
        execSync('apk add --no-cache ffmpeg', { timeout: 60000 });
        if (fs.existsSync('/usr/bin/ffmpeg')) {
          ffmpegBin = '/usr/bin/ffmpeg';
        }
      } catch (apkErr) {
        logger.warn('[WappyStudio Render MP4] No se pudo auto-instalar ffmpeg via apk:', apkErr.message);
      }
    }
    if (!ffmpegBin) {
      ffmpegBin = 'ffmpeg';
    }

    const isVertical = aspectRatio !== '16:9';
    const width = isVertical ? 540 : 960;
    const height = isVertical ? 960 : 540;
    let safeDuration = Math.min(60, Math.max(3, Number(durationSeconds) || 12));

    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wappy-studio-mp4-'));
    const outputMp4Path = path.join(tempDir, 'output.mp4');
    let audioFilePath = null;
    let wavBuf = null;

    if (audioBase64 && typeof audioBase64 === 'string') {
      const cleanBase64 = audioBase64.replace(/^data:audio\/[^;]+;base64,/, '');
      wavBuf = Buffer.from(cleanBase64, 'base64');
      audioFilePath = path.join(tempDir, 'voiceover.wav');
      fs.writeFileSync(audioFilePath, wavBuf);
    }

    // Inyectar controlador determinista de fotogramas y subtítulos dinámicos alineados con los silencios reales del WAV
    let timelineMap = computeServerScriptTimelineMap(scriptText, safeDuration);
    if (wavBuf) {
      try {
        timelineMap = alignTimelineMapWithWavBuffer(timelineMap, wavBuf);
        if (timelineMap.totalDurationSeconds > 3) {
          safeDuration = Math.min(60, timelineMap.totalDurationSeconds);
        }
      } catch (_) {}
    }

    // Ajustar FPS inteligentemente para que videos largos (30-45s) se rendericen en ~8-12 segundos sin timeout de Cloudflare
    const defaultFps = safeDuration > 20 ? 12 : 15;
    const targetFps = Math.min(20, Math.max(10, Number(fps) || defaultFps));
    const totalFrames = Math.max(1, Math.round(safeDuration * targetFps));
    const cleanWords = timelineMap.wordTimings.map((w) => w.word);

    const renderHarnessScript = `
<style id="wappy-mp4-render-styles">
  ${showSubtitles && cleanWords.length > 0 ? '#subtitle-footer, #subtitle-card, #subtitle-container, #subtitle-box, footer[id*="subtitle"] { display: none !important; }' : ''}
  #orb-1, #orb-2, #orb-3, [class*="blur-"] { filter: blur(18px) !important; }
  .glass-panel, .glass-card, .glass-panel-amber { backdrop-filter: none !important; -webkit-backdrop-filter: none !important; }
</style>
<script id="wappy-mp4-render-harness">
  window.__wappyWords = ${JSON.stringify(cleanWords)};
  window.__wappyTimelineBeats = ${JSON.stringify(timelineMap.beats)};
  window.__wappyWordTimings = ${JSON.stringify(timelineMap.wordTimings)};
  ${timelineMap.vozData ? `window.VOZ = ${JSON.stringify(timelineMap.vozData)};` : ''}
  window.__wappyShowSubs = ${Boolean(showSubtitles && cleanWords.length > 0)};
  window.__wappySubPos = ${JSON.stringify(subtitlePosition || 'bottom')};
  window.__wappyDuration = ${safeDuration};
  window.__wappyVoicePlaying = true;
  window.__wappyCurrentTime = 0;

  function ensureSubOverlay() {
    if (window.__wappyShowSubs && !document.getElementById('wappy-mp4-sub-overlay')) {
      const posStyle = window.__wappySubPos === 'top'
        ? 'top: 56px;'
        : window.__wappySubPos === 'center'
          ? 'top: 50%; transform: translateY(-50%);'
          : 'bottom: 20px;';
      const subWrap = document.createElement('div');
      subWrap.id = 'wappy-mp4-sub-overlay';
      subWrap.style.cssText = 'position:fixed;left:16px;right:16px;z-index:9999;display:flex;justify-content:center;pointer-events:none;' + posStyle;
      subWrap.innerHTML = '<div id="wappy-mp4-sub-box" style="background:rgba(5,12,18,0.92);border:1px solid rgba(199,243,3,0.45);padding:9px 15px;border-radius:15px;text-align:center;max-width:94%;display:flex;flex-wrap:wrap;justify-content:center;gap:6px;font-family:Plus Jakarta Sans,sans-serif;box-shadow:0 12px 32px rgba(0,0,0,0.65);"></div>';
      document.body.appendChild(subWrap);
    }
  }

  window.addEventListener('DOMContentLoaded', ensureSubOverlay);

  window.__wappySeekTo = function(timeSec) {
    ensureSubOverlay();
    window.__wappyCurrentTime = timeSec;
    window.__wappyVoicePlaying = true;
    const progress = Math.max(0, Math.min(0.9999, timeSec / Math.max(1, window.__wappyDuration)));
    try {
      if (window.mainTimeline && typeof window.mainTimeline.progress === 'function') {
        window.mainTimeline.progress(progress, false);
      }
      if (window.gsap && window.gsap.globalTimeline) {
        const gDur = window.gsap.globalTimeline.duration() || window.__wappyDuration;
        window.gsap.globalTimeline.time(Math.min(timeSec, gDur), false);
      }
      if (typeof window.__wappyRenderTick === 'function') {
        window.__wappyRenderTick(timeSec, window.__wappyDuration);
      }
    } catch (e) {}

    if (window.__wappyShowSubs && window.__wappyWords.length > 0) {
      const box = document.getElementById('wappy-mp4-sub-box');
      if (box) {
        const timings = window.__wappyWordTimings || [];
        let activeIdx = -1;
        for (let i = 0; i < timings.length; i++) {
          if (progress >= timings[i].startPct && progress <= timings[i].endPct) {
            activeIdx = i;
            break;
          }
        }
        if (activeIdx === -1) {
          activeIdx = Math.min(window.__wappyWords.length - 1, Math.floor(progress * window.__wappyWords.length));
        }
        const winSize = 5;
        const winStart = Math.floor(activeIdx / winSize) * winSize;
        const slice = window.__wappyWords.slice(winStart, winStart + winSize);
        const activeOffset = activeIdx - winStart;
        box.innerHTML = slice.map((w, i) => {
          if (i === activeOffset) {
            return '<span style="font-size:15px;font-weight:900;text-transform:uppercase;color:#080c04;background:#c7f303;padding:2px 8px;border-radius:7px;box-shadow:0 0 14px rgba(199,243,3,0.45);">' + w + '</span>';
          }
          return '<span style="font-size:15px;font-weight:800;text-transform:uppercase;color:rgba(255,255,255,0.96);">' + w + '</span>';
        }).join(' ');
      }
    }
  };
</script>`;

    const safeHtml = inlineWappyPublicAssetsInHtml(htmlCode, { inlineVendorScripts: true }).replace(
      /subtitles\.reverse\(\)/g,
      'subtitles.slice().reverse()',
    );
    const instrumentedHtml = safeHtml.includes('</body>')
      ? safeHtml.replace('</body>', `${renderHarnessScript}\n</body>`)
      : `${safeHtml}\n${renderHarnessScript}`;

    const puppeteer = require('puppeteer');
    const launchOptions = {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--no-first-run',
        '--no-zygote',
      ],
    };

    if (process.env.PUPPETEER_EXECUTABLE_PATH && fs.existsSync(process.env.PUPPETEER_EXECUTABLE_PATH)) {
      launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
    } else if (fs.existsSync('/usr/bin/chromium-browser')) {
      launchOptions.executablePath = '/usr/bin/chromium-browser';
    } else if (fs.existsSync('/usr/bin/chromium')) {
      launchOptions.executablePath = '/usr/bin/chromium';
    }

    browser = await puppeteer.launch(launchOptions);
    const page = await browser.newPage();
    await page.setViewport({ width, height, deviceScaleFactor: 1 });
    await page.setContent(instrumentedHtml, { waitUntil: 'load', timeout: 25000 });
    await new Promise((r) => setTimeout(r, 400));
    await page.evaluate(() => {
      if (window.mainTimeline && typeof window.mainTimeline.pause === 'function') {
        window.mainTimeline.pause();
      }
      if (window.gsap && window.gsap.globalTimeline) {
        window.gsap.globalTimeline.pause();
      }
    });

    const ffmpegArgs = [
      '-y',
      '-f',
      'image2pipe',
      '-vcodec',
      'mjpeg',
      '-framerate',
      String(targetFps),
      '-i',
      '-',
    ];

    if (audioFilePath) {
      ffmpegArgs.push('-i', audioFilePath, '-c:a', 'aac', '-b:a', '160k', '-shortest');
    }

    ffmpegArgs.push(
      '-c:v',
      'libx264',
      '-preset',
      'ultrafast',
      '-crf',
      '22',
      '-pix_fmt',
      'yuv420p',
      '-movflags',
      '+faststart',
      outputMp4Path,
    );

    const ffmpegProc = spawn(ffmpegBin, ffmpegArgs);
    let ffmpegStderr = '';
    ffmpegProc.stderr.on('data', (chunk) => {
      ffmpegStderr += chunk.toString();
    });

    const ffmpegExitPromise = new Promise((resolve, reject) => {
      ffmpegProc.on('error', reject);
      ffmpegProc.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`FFmpeg finalizó con código ${code}: ${ffmpegStderr.slice(-300)}`));
      });
    });

    for (let f = 0; f < totalFrames; f++) {
      const currentTime = f / targetFps;
      await page.evaluate((t) => {
        if (typeof window.__wappySeekTo === 'function') {
          window.__wappySeekTo(t);
        }
      }, currentTime);

      const frameBuffer = await page.screenshot({
        type: 'jpeg',
        quality: 84,
        optimizeForSpeed: true,
        captureBeyondViewport: false,
      });
      const canContinue = ffmpegProc.stdin.write(frameBuffer);
      if (!canContinue) {
        await new Promise((r) => ffmpegProc.stdin.once('drain', r));
      }
    }

    ffmpegProc.stdin.end();
    await ffmpegExitPromise;
    await browser.close();
    browser = null;

    const mp4Buffer = fs.readFileSync(outputMp4Path);
    const videoBase64 = mp4Buffer.toString('base64');

    // Guardar copia pública en client/public/images/ para descarga directa y proyección en Tenshi / Antigravity
    let downloadUrl = '';
    const fileName = `studio_reel_${Date.now()}.mp4`;
    try {
      const publicImagesDir = path.join(process.cwd(), 'client', 'public', 'images');
      if (!fs.existsSync(publicImagesDir)) {
        fs.mkdirSync(publicImagesDir, { recursive: true });
      }
      const publicFilePath = path.join(publicImagesDir, fileName);
      fs.writeFileSync(publicFilePath, mp4Buffer);
      downloadUrl = `/images/${fileName}`;
    } catch (saveErr) {
      logger.debug(`[WappyStudio Render MP4] Public copy skipped: ${saveErr.message}`);
    }

    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (_) {}

    const resolvedTarget = await resolveStudioTargetUser(req);
    const delegation = await delegateStudioOrderToAntigravityIfConnected(req, resolvedTarget.userId, {
      title: `Wappy Studio · Render MP4 Finalizado (${aspectRatio})`,
      instruction: `Video MP4 renderizado desde Wappy Studio (${safeDuration}s, ${width}x${height}). URL pública: ${downloadUrl}`,
      outputType: 'respuesta',
    });

    const bridge = notifyStudioAntigravityBridge(
      req,
      'mp4_rendered',
      {
        downloadUrl,
        fileName,
        durationSeconds: safeDuration,
        aspectRatio,
        width,
        height,
        ordenId: delegation?.ordenId || null,
      },
      resolvedTarget.userId,
    );

    return res.json({
      ok: true,
      success: true,
      videoBase64,
      downloadUrl,
      fileName,
      mimeType: 'video/mp4',
      durationSeconds: safeDuration,
      fps: targetFps,
      width,
      height,
      delegation,
      bridge,
    });
  } catch (error) {
    if (browser) {
      try {
        await browser.close();
      } catch (_) {}
    }
    if (tempDir) {
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (_) {}
    }
    logger.error('[WappyStudio Render MP4] Error rendering MP4:', error);
    return res.status(500).json({
      ok: false,
      success: false,
      error: error.message || 'Error renderizando el video MP4 en el servidor.',
    });
  }
}

router.post('/video/render-mp4', studioAuth, handleRenderMasterReelMp4);
router.post('/antigravity/render-mp4', studioAuth, handleRenderMasterReelMp4);

/**
 * POST /api/studio/video/render-serverless
 * Despacha el paquete (HTML + Audio + Video Base) al Worker GPU Serverless (Modal.com / RunPod)
 */
router.post('/video/render-serverless', studioAuth, async (req, res) => {
  try {
    const {
      htmlCode,
      audioBase64,
      aspectRatio = '9:16',
      durationSeconds = 15,
      fps = 30,
      workerUrl,
      workerToken,
    } = req.body;

    const targetUrl = (workerUrl || process.env.STUDIO_GPU_WORKER_URL || '').trim();
    const targetToken = (workerToken || process.env.STUDIO_GPU_WORKER_TOKEN || '').trim();

    if (!targetUrl) {
      return res.status(400).json({
        success: false,
        needsWorkerConfig: true,
        error:
          'Aún no has conectado la URL de tu Worker GPU Serverless (Modal.com / RunPod). Puedes usar la exportación directa del navegador o pegar tu endpoint de Modal en "Configurar GPU Serverless".',
      });
    }

    const isVertical = aspectRatio === '9:16';
    const response = await axios.post(
      targetUrl,
      {
        html: htmlCode,
        audioBase64: audioBase64 || null,
        width: isVertical ? 1080 : 1920,
        height: isVertical ? 1920 : 1080,
        durationSeconds: Math.min(180, Math.max(2, Number(durationSeconds) || 15)),
        fps: Number(fps) || 30,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          ...(targetToken ? { Authorization: `Bearer ${targetToken}` } : {}),
        },
        timeout: 180000,
      },
    );

    res.json({
      success: true,
      ...response.data,
    });
  } catch (error) {
    logger.error('[WappyStudio Render GPU] Error dispatching to serverless worker:', error);
    res.status(500).json({
      success: false,
      error:
        error.response?.data?.error ||
        error.message ||
        'Error al conectar con el Worker GPU Serverless.',
    });
  }
});

module.exports = router;
