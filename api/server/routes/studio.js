'use strict';

const express = require('express');
const crypto = require('crypto');
const axios = require('axios');
const passport = require('passport');
const router = express.Router();
const { logger } = require('~/config');
const { resolveApiKeys, generateWithKeyRotation } = require('./sgsst/sgsstGemini');
const geminiPoolManager = require('~/server/services/GeminiPoolManager');

/**
 * Middleware de autenticación flexible para WAPPY Studio:
 * - Acepta token en header Authorization o query ?token= (para EventSource SSE)
 * - Si el token es válido hidrata req.user; si aún se está refrescando, permite usar las claves del sistema (resolveApiKeys) y nunca devuelve texto plano "Unauthorized".
 */
const studioAuth = (req, res, next) => {
  if (!req.headers.authorization && req.query && req.query.token) {
    req.headers.authorization = `Bearer ${req.query.token}`;
  }
  passport.authenticate('jwt', { session: false }, (err, user) => {
    if (!err && user) {
      req.user = user;
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
  const envTextIds = getEnvGoogleModelsList().filter(
    (m) => !m.includes('live') && !m.includes('native-audio') && !m.includes('tts') && !m.includes('transcribe'),
  );
  return envTextIds.length > 0
    ? envTextIds
    : ['gemini-3.6-flash', 'gemini-3.5-flash-lite', 'gemini-3.8-flash'];
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

  if (Array.isArray(bodyCustomKeys)) {
    for (const k of bodyCustomKeys) {
      if (typeof k === 'string' && k.trim().length > 8 && !customList.includes(k.trim())) {
        customList.push(k.trim());
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
      stylePrompt = '',
      multiSpeaker = false,
      modelName,
    } = req.body || {};

    const envTextModels = getStudioTextModelsFromEnv();
    const preferredTextModel =
      (modelName || '').replace('models/', '').trim() ||
      req.user?.personalization?.geminiModels?.sstManagement ||
      envTextModels[0] ||
      'gemini-3.8-flash';

    const { allKeys } = await getCombinedKeysForRequest(req, []);
    const promptInstruction = multiSpeaker
      ? `Eres un guionista experto en podcasts y locución neural para Gemini 3.8 Flash TTS.
Convierte o mejora el siguiente texto en un diálogo dinámico entre dos interlocutores usando exactamente las etiquetas "Alex:" y "Sam:" al inicio de cada intervención.
Inserta efectos vocales orgánicos donde aporten naturalidad: <breath> (respiración), <laugh> (risa suave), |mhm| (asentimiento), |yeah| (acuerdo).
Estilo solicitado: ${stylePrompt || 'Conversacional, fluido y profesional'}.
Devuelve ÚNICAMENTE el guion listo para sintetizar, sin introducciones ni bloques markdown.`
      : `Eres un director de locución profesional experto en Gemini 3.8 Flash TTS.
Mejora y enriquece el siguiente guion para que suene 100% humano, envolvente y con ritmo profesional.
Inserta etiquetas vocales orgánicas de Gemini TTS en las pausas clave: <breath> (toma de aire natural), <laugh> (si aplica), <gasp> (si aplica énfasis).
Estilo solicitado: ${stylePrompt || 'Narración profesional, clara y expresiva'}.
Devuelve ÚNICAMENTE el texto del guion mejorado, sin comentarios adicionales ni comillas.`;

    const inputContent = `${promptInstruction}\n\nTEXTO BASE:\n${text || 'Crea una introducción impactante sobre cómo la Inteligencia Artificial y la prevención transforman el aprendizaje y la seguridad.'}`;

    let enhancedText = '';
    if (allKeys.length > 0) {
      const modelsToTry = Array.from(new Set([preferredTextModel, ...envTextModels]));
      let lastErr = null;
      outer: for (const key of allKeys) {
        for (const mId of modelsToTry) {
          try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(mId)}:generateContent?key=${encodeURIComponent(key)}`;
            const resp = await axios.post(
              url,
              {
                contents: [{ role: 'user', parts: [{ text: inputContent }] }],
                generationConfig: { temperature: 0.5 },
              },
              { timeout: 30000 },
            );
            const candidateText =
              resp.data?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || '';
            if (candidateText.trim()) {
              enhancedText = candidateText.trim();
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

    return res.json({ success: true, text: enhancedText, model: preferredTextModel });
  } catch (error) {
    logger.error('[WappyStudio Script] Error enhancing script:', error);
    return res.status(500).json({
      success: false,
      error: error.response?.data?.error?.message || error.message || 'Error al mejorar el guion con IA.',
    });
  }
});

// ============================================================================
// ENDPOINTS DE COMPOSICIÓN DE VIDEO HTML / GSAP (ESTILO CLAUDE / HYPERFRAMES)
// ============================================================================

/**
 * POST /api/studio/video/generate-html
 * Genera una composición animada en HTML5 + Tailwind + GSAP que puede superponerse
 * sobre un video propio del usuario o reproducirse de forma autónoma con subtítulos sincronizados.
 */
router.post('/video/generate-html', studioAuth, async (req, res) => {
  try {
    const {
      prompt = '',
      scriptText = '',
      aspectRatio = '9:16',
      theme = 'wappy-emerald',
      hasBaseVideo = false,
      showSubtitles = true,
      durationSeconds = 30,
      companyName = 'WAPPY IA',
      modelName,
    } = req.body;

    const envTextModels = getStudioTextModelsFromEnv();
    const preferredTextModel =
      (modelName || '').replace('models/', '').trim() ||
      req.user?.personalization?.geminiModels?.sstManagement ||
      envTextModels[0] ||
      'gemini-3.8-flash';

    const isVertical = aspectRatio === '9:16';
    const width = isVertical ? 1080 : 1920;
    const height = isVertical ? 1920 : 1080;

    const systemInstruction = `Eres un Director de Motion Graphics Senior experto en el sistema de diseño cinematográfico HyperFrames (SKILL hyperframes-motion-design), GSAP 3, Tailwind CSS y animaciones virales estilo Claude / HeyGen.
Tu objetivo es crear una página HTML5 autocontenida, fluida, editable y cinematográfica con relación de aspecto ${aspectRatio} (${width}x${height}) lista para reproducirse en cualquier tamaño de pantalla (normal o pantalla completa) sin desbordarse jamás.

REGLAS ESTRICTAS DE ARQUITECTURA VISUAL Y RESPONSIVIDAD (PROHIBIDO DESBORDAR EL LIENZO):
1. Devuelve ÚNICAMENTE el código HTML completo (desde <!DOCTYPE html> hasta </html>), sin bloques markdown (\`\`\`html).
2. Incluye en el <head>:
   - <script src="https://cdn.tailwindcss.com"></script>
   - <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
   - Google Fonts: 'Plus Jakarta Sans', 'Syne' y 'JetBrains Mono'.
3. GEOMETRÍA AUTO-AJUSTABLE Y CENTRADA (CERO CORRIMIENTO EN PANTALLA COMPLETA O NORMAL):
   - PROHIBIDO usar \`width: 1920px\` o \`width: 1080px\` fijos en \`body\` o contenedores que causen recorte o corrimiento horizontal.
   - \`html, body\` DEBEN tener: \`width: 100vw; height: 100vh; max-width: 100%; max-height: 100%; margin: 0; padding: 0; overflow: hidden; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between;\`
   - Envuelve el contenido visual dentro de un contenedor maestro \`<div id="stage" class="relative w-full h-full flex flex-col justify-between p-5 sm:p-8 overflow-hidden box-border">\` con unidades relativas (\`w-full\`, \`max-w-4xl mx-auto\`, \`clamp()\`, \`grid\`, \`flex\`) para que se vea 100% centrado tanto en vista previa pequeña como en Pantalla Completa.
4. TRANSPARENCIA PARA CAPA DE VIDEO BASE:
   - Si hasBaseVideo es true (${hasBaseVideo}), el <body> DEBE tener \`background: transparent;\` para que el video grabado a cámara del usuario en la capa inferior se vea nítidamente, y tus gráficos/tarjetas/badges se superpongan con glassmorphism (\`backdrop-filter: blur(16px)\`, \`background: rgba(10, 18, 30, 0.78)\`, bordes luminosos).
   - Si hasBaseVideo es false, crea un fondo oscuro animado de alto impacto (\`#060d14\`) con orbes de luz flotantes, rejilla técnica sutil (grid) y viñeta cinematográfica.
5. SISTEMA DE DISEÑO HYPERFRAMES MOTION DESIGN (GSAP TIMELINE MAESTRO SIN BUCLE INFINITO Y COMPATIBLE CON WHATSAPP):
   - Crea SIEMPRE la línea de tiempo maestra asignada a \`window.mainTimeline = gsap.timeline({ repeat: 0 });\`. PROHIBIDO usar \`repeat: -1\` en \`window.mainTimeline\` para que la animación termine exactamente junto con el audio y se detenga en la escena final de cierre (NUNCA apagues con \`opacity: 0\` la escena final de cierre en el último segundo).
   - PROHIBIDO poner la clase \`opacity-0\` o \`style="opacity:0"\` en el HTML estático del encabezado (\`#header-hud\`) ni de la primera escena (\`#scene-1\` y sus hijos). La primera escena DEBE ser 100% visible por defecto en el HTML estático para que al abrir el archivo en el visor de WhatsApp móvil se vea inmediatamente el diseño completo (usa \`master.from("#sc1-card", { opacity: 0, y: 20, ... })\` en lugar de ocultar con \`opacity-0\` en el HTML).
   - Desarrolla una coreografía multicapa de ${durationSeconds} segundos dividida en beats visuales claros (Entrada con impacto, Desarrollo de tarjetas/reglas numeradas, Métricas/HUD y Cierre que permanece visible al terminar).
   - Usa curvas elásticas y expresivas: \`back.out(1.7)\`, \`expo.out\`, \`elastic.out(1, 0.5)\`, \`power3.out\`.
   - Añade atributos \`data-editable="true"\` en todas las tarjetas, insignias y textos importantes para que el editor visual de WAPPY Studio pueda moverlos y editarlos con el mouse.
   - Deja libre la franja inferior (\`padding-bottom: 64px\`) para que los subtítulos dinámicos palabra a palabra no tapen las tarjetas.
6. API DE CONTROL EXTERNO (OBLIGATORIA):
   - Escucha mensajes \`window.addEventListener('message', (e) => { ... })\` para soportar:
     - \`{ type: 'STUDIO_PLAY' }\` -> \`window.mainTimeline?.play(); gsap.globalTimeline.play();\`
     - \`{ type: 'STUDIO_PAUSE' }\` -> \`window.mainTimeline?.pause(); gsap.globalTimeline.pause();\`
     - \`{ type: 'STUDIO_RESTART' }\` -> \`window.mainTimeline?.restart(); gsap.globalTimeline.restart();\`
     - \`{ type: 'STUDIO_SEEK', progress: 0..1 }\` -> \`window.mainTimeline?.progress(e.data.progress);\``;

    const userPrompt = `Diseña una composición animada en HTML + GSAP con estas especificaciones:
- Formato: ${aspectRatio} (${width}x${height})
- Duración objetivo: ${durationSeconds} segundos
- Empresa / Marca: ${companyName}
- Paleta / Tema: ${theme}
- ¿Tiene video base del usuario debajo?: ${hasBaseVideo ? 'SÍ (usar fondo transparente y tarjetas superpuestas en tercio superior e inferior sin tapar el rostro central)' : 'NO (diseñar escena completa a pantalla completa con fondo cinematográfico)'}
- ¿Mostrar barra de subtítulos dinámicos?: ${showSubtitles ? 'SÍ' : 'NO'}
- Instrucción creativa del usuario: ${prompt || 'Cápsula de alto impacto visual con estadísticas, insignias animadas y puntos clave.'}
- Guion / Texto de locución para sincronizar las escenas y subtítulos:
"""
${scriptText || prompt || 'La prevención y la inteligencia artificial transforman la seguridad en el trabajo.'}
"""

Recuerda devolver SOLO el código HTML puro empezando por <!DOCTYPE html>.`;

    const aiResult = await generateWithKeyRotation(
      { model: preferredTextModel, generationConfig: { temperature: 0.4 } },
      req.user,
      userPrompt,
      { systemInstruction },
    );

    let htmlCode = aiResult?.response?.text?.() || '';
    htmlCode = htmlCode
      .replace(/^```html\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    if (!htmlCode.toLowerCase().includes('<html')) {
      throw new Error('El modelo no devolvió un documento HTML válido.');
    }

    res.json({
      success: true,
      htmlCode,
    });
  } catch (error) {
    logger.error('[WappyStudio Video] Error generating HTML composition:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error generando la animación HTML con IA.',
    });
  }
});

/**
 * POST /api/studio/video/render-mp4
 * Opción B: Renderizado MP4 (H.264 + AAC) en servidor mediante Headless Chromium (Puppeteer) + FFmpeg.
 * Une la composición HTML/GSAP + Subtítulos Dinámicos Palabra a Palabra + Pista de Voz WAV en un archivo .mp4 universal.
 */
router.post('/video/render-mp4', studioAuth, async (req, res) => {
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

    const isVertical = aspectRatio === '9:16';
    const width = isVertical ? 540 : 960;
    const height = isVertical ? 960 : 540;
    const safeDuration = Math.min(60, Math.max(3, Number(durationSeconds) || 12));
    // Ajustar FPS inteligentemente para que videos largos (30-45s) se rendericen en ~8-12 segundos sin timeout de Cloudflare
    const defaultFps = safeDuration > 20 ? 12 : 15;
    const targetFps = Math.min(20, Math.max(10, Number(fps) || defaultFps));
    const totalFrames = Math.max(1, Math.round(safeDuration * targetFps));

    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wappy-studio-mp4-'));
    const outputMp4Path = path.join(tempDir, 'output.mp4');
    let audioFilePath = null;

    if (audioBase64 && typeof audioBase64 === 'string') {
      const cleanBase64 = audioBase64.replace(/^data:audio\/[^;]+;base64,/, '');
      audioFilePath = path.join(tempDir, 'voiceover.wav');
      fs.writeFileSync(audioFilePath, Buffer.from(cleanBase64, 'base64'));
    }

    // Inyectar controlador determinista de fotogramas y subtítulos dinámicos palabra a palabra
    const cleanWords = String(scriptText || '')
      .replace(/<[^>]+>/g, '')
      .replace(/\|[^|]+\|/g, '')
      .replace(/^(Alex|Sam):\s*/gim, '')
      .split(/\s+/)
      .filter(Boolean);

    const renderHarnessScript = `
<style id="wappy-mp4-render-styles">
  ${showSubtitles && cleanWords.length > 0 ? '#subtitle-footer, #subtitle-card { display: none !important; }' : ''}
  #orb-1, #orb-2, #orb-3, [class*="blur-"] { filter: blur(18px) !important; }
  .glass-panel, .glass-card, .glass-panel-amber { backdrop-filter: none !important; -webkit-backdrop-filter: none !important; }
</style>
<script id="wappy-mp4-render-harness">
  window.__wappyWords = ${JSON.stringify(cleanWords)};
  window.__wappyShowSubs = ${Boolean(showSubtitles && cleanWords.length > 0)};
  window.__wappySubPos = ${JSON.stringify(subtitlePosition || 'bottom')};
  window.__wappyDuration = ${safeDuration};

  function ensureSubOverlay() {
    if (window.__wappyShowSubs && !document.getElementById('wappy-mp4-sub-overlay')) {
      const posStyle = window.__wappySubPos === 'top'
        ? 'top: 56px;'
        : window.__wappySubPos === 'center'
          ? 'top: 50%; transform: translateY(-50%);'
          : 'bottom: 24px;';
      const subWrap = document.createElement('div');
      subWrap.id = 'wappy-mp4-sub-overlay';
      subWrap.style.cssText = 'position:fixed;left:16px;right:16px;z-index:9999;display:flex;justify-content:center;pointer-events:none;' + posStyle;
      subWrap.innerHTML = '<div id="wappy-mp4-sub-box" style="background:rgba(6,13,20,0.9);border:1px solid rgba(45,212,191,0.35);padding:10px 16px;border-radius:16px;text-align:center;max-width:94%;display:flex;flex-wrap:wrap;justify-content:center;gap:6px;font-family:Plus Jakarta Sans,sans-serif;box-shadow:0 12px 32px rgba(0,0,0,0.6);"></div>';
      document.body.appendChild(subWrap);
    }
  }

  window.addEventListener('DOMContentLoaded', ensureSubOverlay);

  window.__wappySeekTo = function(timeSec) {
    ensureSubOverlay();
    try {
      if (window.mainTimeline && typeof window.mainTimeline.time === 'function') {
        const tlDur = window.mainTimeline.duration() || window.__wappyDuration || 12;
        window.mainTimeline.time(timeSec % tlDur, false);
      }
      if (window.gsap && window.gsap.globalTimeline) {
        window.gsap.globalTimeline.time(timeSec, false);
      }
    } catch (e) {}

    if (window.__wappyShowSubs && window.__wappyWords.length > 0) {
      const box = document.getElementById('wappy-mp4-sub-box');
      if (box) {
        const progress = Math.max(0, Math.min(0.999, timeSec / Math.max(1, window.__wappyDuration)));
        const activeIdx = Math.floor(progress * window.__wappyWords.length);
        const winSize = 5;
        const winStart = Math.floor(activeIdx / winSize) * winSize;
        const slice = window.__wappyWords.slice(winStart, winStart + winSize);
        const activeOffset = activeIdx - winStart;
        box.innerHTML = slice.map((w, i) => {
          if (i === activeOffset) {
            return '<span style="font-size:15px;font-weight:900;text-transform:uppercase;color:#fcd34d;background:rgba(20,184,166,0.32);padding:2px 7px;border-radius:7px;border:1px solid rgba(45,212,191,0.55);">' + w + '</span>';
          }
          return '<span style="font-size:15px;font-weight:800;text-transform:uppercase;color:rgba(255,255,255,0.95);">' + w + '</span>';
        }).join(' ');
      }
    }
  };
</script>`;

    const instrumentedHtml = htmlCode.includes('</body>')
      ? htmlCode.replace('</body>', `${renderHarnessScript}\n</body>`)
      : `${htmlCode}\n${renderHarnessScript}`;

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

    // Detectar ruta de Chromium en Alpine Linux / Docker (igual que WhatsAppManager.js) o variable de entorno
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

    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (_) {}

    return res.json({
      success: true,
      videoBase64,
      mimeType: 'video/mp4',
      durationSeconds: safeDuration,
      fps: targetFps,
      width,
      height,
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
      success: false,
      error: error.message || 'Error renderizando el video MP4 en el servidor.',
    });
  }
});

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
