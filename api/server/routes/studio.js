'use strict';

const express = require('express');
const crypto = require('crypto');
const axios = require('axios');
const router = express.Router();
const { requireJwtAuth } = require('~/server/middleware');
const { logger } = require('~/config');
const { resolveApiKeys, generateWithKeyRotation } = require('./sgsst/sgsstGemini');
const geminiPoolManager = require('~/server/services/GeminiPoolManager');

/**
 * Catálogo oficial verificado de Modelos Gemini TTS, Voces, Presets y Vocal Bursts
 */
const STUDIO_MODELS = [
  {
    id: 'gemini-3.8-flash-tts',
    name: 'Gemini 3.8 Flash TTS',
    badge: 'Recomendado / Estable',
    badgeColor: 'bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/30',
    quotaLabel: 'Alta Fidelidad • 14 Voces',
    description:
      'Modelo insignia de síntesis de voz con máxima fluidez natural, diseño de voz, diálogo dual (2 hablantes) y efectos vocales (<breath>, <laugh>).',
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
  {
    id: 'gemini-3.8-flash-lite-tts',
    name: 'Gemini 3.8 Flash-Lite TTS',
    badge: 'Ultra Rápido',
    badgeColor: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
    quotaLabel: 'Baja Latencia • 6 Voces',
    description:
      'Optimizado para lecturas extensas, cápsulas SST masivas y doblaje rápido con mínima latencia continua.',
    supportsMultiSpeaker: false,
    supportsVocalBursts: true,
    supportedVoices: ['Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr', 'Aoede'],
  },
  {
    id: 'gemini-3.1-flash-tts-preview',
    name: 'Gemini 3.1 Flash TTS Preview',
    badge: 'Preview 3.1',
    badgeColor: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30',
    quotaLabel: 'Prosodia Refinada • 14 Voces',
    description:
      'Arquitectura Gemini 3.1 con prosodia expresiva, pausas orgánicas y soporte completo para las 14 voces.',
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
  {
    id: 'gemini-2.5-flash-preview-tts',
    name: 'Gemini 2.5 Flash TTS',
    badge: 'Respaldo Estable',
    badgeColor: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
    quotaLabel: 'Respaldo • 8 Voces Base',
    description:
      'Motor clásico de respaldo funcional para síntesis de voz controlada y diálogos.',
    supportsMultiSpeaker: true,
    supportsVocalBursts: false,
    supportedVoices: ['Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr', 'Orus', 'Aoede', 'Leda'],
  },
];

const STUDIO_VOICES = [
  {
    id: 'Kore',
    name: 'Kore',
    gender: 'Femenino',
    tone: 'Cálida, Serena y Profesional',
    recommendedFor: 'Inducciones SST, Cursos LMS, Audiolibros, Tutoriales',
    tag: 'Más popular',
  },
  {
    id: 'Puck',
    name: 'Puck',
    gender: 'Masculino',
    tone: 'Enérgico, Dinámico y Joven',
    recommendedFor: 'Reels Virales, Podcasts, Cápsulas de Seguridad, Diálogos',
    tag: 'Muy expresivo',
  },
  {
    id: 'Charon',
    name: 'Charon',
    gender: 'Masculino',
    tone: 'Barítono, Grave, Maduro y Solemne',
    recommendedFor: 'Normativa Legal, Documentales, Investigación ATEL, Directivos',
    tag: 'Voz profunda',
  },
  {
    id: 'Fenrir',
    name: 'Fenrir',
    gender: 'Masculino',
    tone: 'Claro, Elocuente y Periodístico',
    recommendedFor: 'Boletines SST, Informes Gerenciales, Presentaciones, Noticias',
    tag: 'Profesional',
  },
  {
    id: 'Zephyr',
    name: 'Zephyr',
    gender: 'Femenino',
    tone: 'Dulce, Aterciopelada y Relajante',
    recommendedFor: 'Pausas Activas, Bienestar Psicosocial, Mindfulness, Meditación',
    tag: 'Calma / Bienestar',
  },
  {
    id: 'Orus',
    name: 'Orus',
    gender: 'Masculino',
    tone: 'Firme, Imperial, Épico y Reflexivo',
    recommendedFor: 'Liderazgo en Seguridad, Relatos Épicos, Cultura Preventiva',
    tag: 'Imperial / Firme',
  },
  {
    id: 'Aoede',
    name: 'Aoede',
    gender: 'Femenino',
    tone: 'Melódica, Expresiva, Artística y Cálida',
    recommendedFor: 'Sensibilización, Storytelling, Lecciones Interactivas',
    tag: 'Melódica',
  },
  {
    id: 'Leda',
    name: 'Leda',
    gender: 'Femenino',
    tone: 'Cercana, Maternal, Madura y Envolvente',
    recommendedFor: 'Bienvenida Corporativa, Relatos, Guía Paso a Paso',
    tag: 'Narradora',
  },
  {
    id: 'Callisto',
    name: 'Callisto',
    gender: 'Femenino',
    tone: 'Elegante, Sofisticada y Articulada',
    recommendedFor: 'Divulgación Científica, Auditorías, Alta Dirección',
    tag: 'Sofisticada',
  },
  {
    id: 'Europa',
    name: 'Europa',
    gender: 'Femenino',
    tone: 'Brillante, Luminosa, Alegre y Asertiva',
    recommendedFor: 'Marketing, Campañas de Autocuidado, Anuncios Internos',
    tag: 'Enérgica',
  },
  {
    id: 'Ganymede',
    name: 'Ganymede',
    gender: 'Masculino',
    tone: 'Resonante, Equilibrado, Sabio y Seguro',
    recommendedFor: 'Educación Superior, Conferencias Magistrales, Capacitación Técnica',
    tag: 'Resonante',
  },
  {
    id: 'Io',
    name: 'Io',
    gender: 'Femenino',
    tone: 'Vivaz, Espontánea, Fresca y Amigable',
    recommendedFor: 'TikTok / Reels, Redes Sociales, Tips Rápidos de Prevención',
    tag: 'Fresca / Reels',
  },
  {
    id: 'Titan',
    name: 'Titan',
    gender: 'Masculino',
    tone: 'Imponente, Cinematográfico y Potente',
    recommendedFor: 'Tráilers de Campaña, Alertas Críticas, Impacto Visual',
    tag: 'Cinematográfica',
  },
  {
    id: 'Prometheus',
    name: 'Prometheus',
    gender: 'Masculino',
    tone: 'Noble, Pensativo, Filosófico y Clásico',
    recommendedFor: 'Análisis Profundo, Crónicas, Ética del Cuidado',
    tag: 'Sabio',
  },
];

const STUDIO_PRESETS = [
  {
    id: 'sst-induccion',
    name: 'Inducción Corporativa SST (Kore)',
    voiceName: 'Kore',
    style:
      'Instructora experta en Seguridad y Salud en el Trabajo en Colombia, voz cálida, clara, empática y profesional, con pausas didácticas.',
    speed: '1.0x',
  },
  {
    id: 'reel-viral',
    name: 'Reel Dinámico Estilo Claude (Puck)',
    voiceName: 'Puck',
    style:
      'Creador de contenido tecnológico dinámico, ritmo ágil, entusiasta, persuasivo y con énfasis claro en los datos clave.',
    speed: '1.05x',
  },
  {
    id: 'orus-solemn',
    name: 'Narración Épica / Cultura Vial (Orus)',
    voiceName: 'Orus',
    style:
      'Voz firme, templada, reflexiva y madura de narrador de documental épico, dicción solemne, pausas medidas y respiraciones naturales.',
    speed: '0.95x',
  },
  {
    id: 'news-boletin',
    name: 'Boletín Legal / Normativo (Fenrir)',
    voiceName: 'Fenrir',
    style:
      'Periodista claro, objetivo, seguro y elocuente de noticiero central, dicción neutral y fluida.',
    speed: '1.05x',
  },
  {
    id: 'pausa-mental',
    name: 'Pausa Activa & Bienestar (Zephyr)',
    voiceName: 'Zephyr',
    style:
      'Voz suave, serena, dulce y sumamente relajante para regulación emocional y respiración consciente, ritmo pausado.',
    speed: '0.9x',
  },
  {
    id: 'documentary',
    name: 'Investigación / Documental (Charon)',
    voiceName: 'Charon',
    style:
      'Tono solemne, reflexivo y cinematográfico de narrador de documental técnico, pausas medidas.',
    speed: '0.95x',
  },
  {
    id: 'screenplay',
    name: 'Podcast / Diálogo Alex & Sam (2 Voces)',
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
    label: 'Risa suave',
    description: 'Añade una risa espontánea y natural',
  },
  {
    tag: '<gasp>',
    label: 'Sorpresa / Asombro',
    description: 'Efecto de inhalación rápida de sorpresa',
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
    try {
      const parsed = JSON.parse(headerRaw);
      if (Array.isArray(parsed)) {
        for (const k of parsed) {
          if (typeof k === 'string' && k.trim().length > 8) {
            customList.push(k.trim());
          }
        }
      }
    } catch {
      /* ignore malformed header */
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
    if (req.user) {
      systemOrUserKeys = await resolveApiKeys(req.user);
    }
  } catch (err) {
    logger.debug(`[WappyStudio] No user/system keys resolved: ${err.message}`);
  }

  const combined = [...customList];
  for (const k of systemOrUserKeys) {
    if (k && !combined.includes(k)) {
      combined.push(k);
    }
  }
  return {
    customKeysCount: customList.length,
    systemKeysCount: systemOrUserKeys.length,
    allKeys: combined,
  };
}

/**
 * Divide un texto largo en fragmentos (chunks) respetando saltos de párrafo y oraciones
 */
function splitTextIntoChunks(text, maxWordsPerChunk = 150) {
  const clean = (text || '').trim();
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
 * Garantiza que un buffer de audio tenga cabecera WAV y devuelve { wavBuffer, pcmBuffer, durationSeconds }
 */
function normalizeAudioBufferToWav(rawBuffer, sampleRate = 24000) {
  if (!rawBuffer || rawBuffer.length === 0) {
    throw new Error('Buffer de audio vacío devuelto por Gemini TTS.');
  }

  const isRiffWav =
    rawBuffer.length > 44 &&
    rawBuffer.slice(0, 4).toString('ascii') === 'RIFF' &&
    rawBuffer.slice(8, 12).toString('ascii') === 'WAVE';

  let pcmBuffer;
  let wavBuffer;

  if (isRiffWav) {
    wavBuffer = rawBuffer;
    pcmBuffer = rawBuffer.slice(44);
  } else {
    pcmBuffer = rawBuffer;
    const header = createWavHeader(pcmBuffer.length, sampleRate, 1, 16);
    wavBuffer = Buffer.concat([header, pcmBuffer]);
  }

  // 24000 muestras/seg * 2 bytes (16-bit) = 48000 bytes/seg
  const durationSeconds = Math.max(1, Math.round((pcmBuffer.length / (sampleRate * 2)) * 10) / 10);

  return { wavBuffer, pcmBuffer, durationSeconds };
}

/**
 * Modelos TTS en orden de respaldo ante error 404 o 503
 */
const TTS_FALLBACK_MODELS = [
  'gemini-3.8-flash-tts',
  'gemini-3.8-flash-lite-tts',
  'gemini-3.1-flash-tts-preview',
  'gemini-2.5-flash-preview-tts',
];

const FUNDAMENTAL_VOICES = ['Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr', 'Orus', 'Aoede', 'Leda'];

function resolveCompatibleVoice(voiceName, modelId) {
  const cleanVoice = (voiceName || 'Kore').trim();
  if (modelId.includes('2.5')) {
    return FUNDAMENTAL_VOICES.includes(cleanVoice) ? cleanVoice : 'Kore';
  }
  if (modelId.includes('lite')) {
    const liteVoices = ['Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr', 'Aoede'];
    return liteVoices.includes(cleanVoice) ? cleanVoice : 'Kore';
  }
  return cleanVoice;
}

/**
 * Sintetiza un fragmento de texto en Gemini TTS con rotación automática de claves y modelos
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
  onFailover,
}) {
  if (!keys || keys.length === 0) {
    throw new Error(
      'No hay claves API de Gemini disponibles. Configura tu clave en el botón "Claves API" o en tu perfil de WAPPY.',
    );
  }

  const preferredModel = (model || 'gemini-3.8-flash-tts').replace('models/', '').trim();
  const modelsToTry = [
    preferredModel,
    ...TTS_FALLBACK_MODELS.filter((m) => m !== preferredModel),
  ];

  let lastError = null;

  for (let mIdx = 0; mIdx < modelsToTry.length; mIdx++) {
    const currentModel = modelsToTry[mIdx];

    for (let kIdx = 0; kIdx < keys.length; kIdx++) {
      const apiKey = keys[kIdx];
      try {
        const promptText = stylePrompt && stylePrompt.trim()
          ? `Lee en voz alta con el siguiente estilo (${stylePrompt.trim()}):\n\n${text.trim()}`
          : text.trim();

        let speechConfig;
        if (multiSpeaker && !currentModel.includes('lite')) {
          speechConfig = {
            multiSpeakerVoiceConfig: {
              speakerVoiceConfigs: [
                {
                  speaker: speaker1?.name || 'Alex',
                  voiceConfig: {
                    prebuiltVoiceConfig: {
                      voiceName: resolveCompatibleVoice(speaker1?.voiceName || 'Puck', currentModel),
                    },
                  },
                },
                {
                  speaker: speaker2?.name || 'Sam',
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
          speechConfig = {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: resolveCompatibleVoice(voiceName, currentModel),
              },
            },
          };
        }

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent`;
        const payload = {
          contents: [
            {
              role: 'user',
              parts: [{ text: promptText }],
            },
          ],
          generationConfig: {
            responseModalities: ['AUDIO'],
            speechConfig,
          },
        };

        const response = await axios.post(url, payload, {
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
          },
          timeout: 65000,
        });

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
 */
router.get('/catalog', requireJwtAuth, (req, res) => {
  res.json({
    models: STUDIO_MODELS,
    voices: STUDIO_VOICES,
    presets: STUDIO_PRESETS,
    vocalBursts: STUDIO_VOCAL_BURSTS,
  });
});

/**
 * GET /api/studio/keys-status
 */
router.get('/keys-status', requireJwtAuth, async (req, res) => {
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
router.post('/keys-validate', requireJwtAuth, async (req, res) => {
  try {
    const { customKeys = [] } = req.body;
    const cleanKeys = Array.isArray(customKeys)
      ? customKeys.map((k) => String(k || '').trim()).filter((k) => k.length > 8)
      : [];

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

    res.json({ results });
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
router.post('/tts/estimate', requireJwtAuth, (req, res) => {
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
router.post('/tts/synthesize', requireJwtAuth, async (req, res) => {
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
router.post('/tts/jobs', requireJwtAuth, async (req, res) => {
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
      userId: String(req.user.id || req.user._id),
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
  for (let i = 0; i < job.chunks.length; i++) {
    // Verificar si fue cancelado
    if (job.status === 'cancelled') {
      return;
    }

    // Esperar mientras esté en pausa
    while (job.status === 'paused') {
      await new Promise((r) => setTimeout(r, 600));
      if (job.status === 'cancelled') return;
    }

    const chunk = job.chunks[i];
    if (chunk.status === 'completed') continue;

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
      chunk.status = 'failed';
      job.status = 'failed';
      job.error = err.message || 'Fallo al sintetizar fragmento';
      emitJobEvent(job, 'job_failed', { error: job.error, chunkIndex: i });
      return;
    }
  }

  // Todos los fragmentos completados: ensamblar archivo WAV maestro continuo
  try {
    const pcmBuffers = job.chunks.map((c) => c.pcmBuffer).filter(Boolean);
    const totalPcmLength = pcmBuffers.reduce((acc, b) => acc + b.length, 0);
    const masterHeader = createWavHeader(totalPcmLength, 24000, 1, 16);
    job.masterWavBuffer = Buffer.concat([masterHeader, ...pcmBuffers]);
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
router.get('/tts/jobs/:jobId/stream', requireJwtAuth, (req, res) => {
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
router.post('/tts/jobs/:jobId/control', requireJwtAuth, (req, res) => {
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

// ============================================================================
// ENDPOINTS DE COMPOSICIÓN DE VIDEO HTML / GSAP (ESTILO CLAUDE / HYPERFRAMES)
// ============================================================================

/**
 * POST /api/studio/video/generate-html
 * Genera una composición animada en HTML5 + Tailwind + GSAP que puede superponerse
 * sobre un video propio del usuario o reproducirse de forma autónoma con subtítulos sincronizados.
 */
router.post('/video/generate-html', requireJwtAuth, async (req, res) => {
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
    } = req.body;

    const isVertical = aspectRatio === '9:16';
    const width = isVertical ? 1080 : 1920;
    const height = isVertical ? 1920 : 1080;

    const systemInstruction = `Eres un Director de Motion Graphics Senior experto en HyperFrames, GSAP 3, Tailwind CSS y animaciones virales estilo Claude / HeyGen.
Tu objetivo es crear una página HTML5 autocontenida, fluida y cinematográfica (${width}x${height}px) lista para reproducirse en un reproductor interactivo y grabarse con FFmpeg/Chromium.

REGLAS ESTRICTAS DE ARQUITECTURA VISUAL:
1. Devuelve ÚNICAMENTE el código HTML completo (desde <!DOCTYPE html> hasta </html>), sin bloques markdown (\`\`\`html).
2. Incluye en el <head>:
   - <script src="https://cdn.tailwindcss.com"></script>
   - <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
   - Google Fonts: 'Plus Jakarta Sans' y 'JetBrains Mono'.
3. TRANSPARENCIA PARA CAPA DE VIDEO BASE:
   - Si hasBaseVideo es true (${hasBaseVideo}), el <body> DEBE tener background: transparent; para que el video grabado a cámara del usuario que está en la capa inferior se vea nítidamente, y tus gráficos/tarjetas/badges/subtítulos se superpongan con glassmorphism (backdrop-filter: blur(12px), bg-slate-950/75, bordes luminosos).
   - Si hasBaseVideo es false, crea un fondo oscuro animado de alto impacto con orbes de luz flotantes, rejilla sutil (grid) y partículas suaves.
4. ANIMACIÓN GSAP TIMELINE GLOBAL (window.mainTimeline):
   - Crea una línea de tiempo maestra en GSAP: \`window.mainTimeline = gsap.timeline({ repeat: -1, yoyo: false });\`
   - Divide la animación en escenas dinámicas a lo largo de ${durationSeconds} segundos.
   - Usa curvas orgánicas: \`back.out(1.7)\`, \`elastic.out(1, 0.5)\`, \`power3.out\`.
   - Añade tarjetas flotantes con métricas, badges con iconos SVG, resaltadores fluorescentes y llamadas a la acción.
5. API DE CONTROL EXTERNO (OBLIGATORIA):
   - Escucha mensajes \`window.addEventListener('message', (e) => { ... })\` para soportar:
     - \`{ type: 'STUDIO_PLAY' }\` -> \`window.mainTimeline?.play()\`
     - \`{ type: 'STUDIO_PAUSE' }\` -> \`window.mainTimeline?.pause()\`
     - \`{ type: 'STUDIO_RESTART' }\` -> \`window.mainTimeline?.restart()\`
     - \`{ type: 'STUDIO_SEEK', progress: 0..1 }\` -> \`window.mainTimeline?.progress(e.data.progress)\``;

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
      { model: 'gemini-3.6-flash', generationConfig: { temperature: 0.4 } },
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
 * POST /api/studio/video/render-serverless
 * Despacha el paquete (HTML + Audio + Video Base) al Worker GPU Serverless (Modal.com / RunPod)
 */
router.post('/video/render-serverless', requireJwtAuth, async (req, res) => {
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
