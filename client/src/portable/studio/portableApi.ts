/**
 * Capa de API portable de WAPPY Studio.
 *
 * En /wappystudio (landing pública) y en el archivo HTML descargable, el mismo componente
 * WappyStudioDashboard funciona con las Claves IA del propio usuario llamando a Gemini
 * directamente desde el navegador. Esta capa intercepta `fetch('/api/studio/...')` y
 * `EventSource` y replica la lógica de `api/server/routes/studio.js`
 * (síntesis TTS con rotación de claves/modelos, trabajos largos con progreso, ensamblado WAV
 * sin chasquidos, generación de escenas HTML con IA y validación de claves).
 *
 * Solo el render MP4 (Puppeteer + FFmpeg) requiere el servidor; si no hay conexión se informa.
 */
import { getPortableGoogleModels, setPortableGoogleModels } from './shims/dataProvider';

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta';
const KEYS_STORAGE = 'wappy_gemini_api_keys';
const nativeFetch: typeof fetch = window.fetch.bind(window);
const NativeEventSource = window.EventSource;

// ─── Claves IA ──────────────────────────────────────────────────────────────
export function readPortableKeys(): string[] {
  try {
    const raw = localStorage.getItem(KEYS_STORAGE) || '';
    if (!raw.trim()) return [];
    let list: any[];
    try {
      const parsed = JSON.parse(raw);
      list = Array.isArray(parsed) ? parsed : String(parsed).split(',');
    } catch {
      list = raw.split(',');
    }
    return list
      .map((k) => (typeof k === 'string' ? k : k?.key || ''))
      .map((k: string) => k.trim())
      .filter((k: string) => k.length > 15);
  } catch {
    return [];
  }
}

function requireKeys(): string[] {
  const keys = readPortableKeys();
  if (keys.length === 0) {
    window.dispatchEvent(new CustomEvent('wappy-portable-missing-keys'));
    throw new Error(
      'Configura tu Clave IA de Google Gemini (botón "Claves IA") para generar voz y videos. Es gratuita en aistudio.google.com.',
    );
  }
  return keys;
}

function ttsModelIds(): string[] {
  const ids = getPortableGoogleModels().filter((m) => m.includes('tts'));
  return ids.length ? ids : ['gemini-3.8-flash-tts', 'gemini-3.1-flash-tts-preview', 'gemini-2.5-flash-preview-tts', 'gemini-3.8-flash-lite-tts'];
}

function textModelIds(): string[] {
  const fastDefaults = ['gemini-3.5-flash-lite', 'gemini-3.6-flash'];
  const ids = getPortableGoogleModels().filter(
    (m) =>
      !m.includes('live') &&
      !m.includes('native-audio') &&
      !m.includes('tts') &&
      !m.includes('transcribe') &&
      !m.includes('2.5') &&
      !m.includes('3.8-flash'),
  );
  return Array.from(new Set([...fastDefaults, ...ids]));
}

// ─── Utilidades de texto (espejo de studio.js) ──────────────────────────────
function sanitizeScriptText(rawText: string): string {
  if (!rawText) return '';
  let clean = String(rawText).trim();
  clean = clean.replace(/^(?:(?:por\s+favor\s+)?(?:lee|habla|locuta|interpreta|recita|say|read|speak)\s+(?:esto\s+)?(?:en\s+voz\s+alta\s+)?(?:con\s+el\s+siguiente\s+estilo|con\s+estilo)?\s*\([^)]*\)[\s:—–-]*)/i, '');
  clean = clean.replace(/^(?:(?:por\s+favor\s+)?(?:lee|habla|locuta|interpreta|recita|say|read|speak)\s+(?:esto\s+)?(?:en\s+voz\s+alta\s+)?(?:con\s+el\s+siguiente\s+estilo|con\s+estilo)?[^:\n]*:[^\n]*(?:\n+|$))/i, '');
  clean = clean.replace(/^(?:directrices?\s+de\s+estilo|estilo|style|tono|tone|director['’]?s\s*notes?)[\s:—–-]+(?:[^\n]+(?:\n+|$))/i, '');
  clean = clean.replace(/^\[(?:estilo|style|instrucciones|director|notas?):[^\]]+\]\s*/i, '');
  return clean.trim();
}

interface Chunk {
  index: number;
  text: string;
  wordCount: number;
  snippet: string;
}

function splitTextIntoChunks(text: string, maxWordsPerChunk = 150): Chunk[] {
  const clean = sanitizeScriptText(text);
  if (!clean) return [];
  const safeLimit = Math.max(40, Math.min(300, Number(maxWordsPerChunk) || 150));
  const paragraphs = clean.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const chunks: Chunk[] = [];
  let currentWords: string[] = [];
  const flush = () => {
    if (currentWords.length > 0) {
      const t = currentWords.join(' ').trim();
      chunks.push({ index: chunks.length, text: t, wordCount: currentWords.length, snippet: t.length > 90 ? `${t.slice(0, 90)}...` : t });
      currentWords = [];
    }
  };
  for (const para of paragraphs) {
    for (const sentence of para.split(/(?<=[.!?…])\s+/)) {
      const words = sentence.trim().split(/\s+/).filter(Boolean);
      if (words.length === 0) continue;
      if (currentWords.length + words.length <= safeLimit) {
        currentWords.push(...words);
      } else if (words.length > safeLimit) {
        flush();
        for (let i = 0; i < words.length; i += safeLimit) {
          const slice = words.slice(i, i + safeLimit);
          chunks.push({ index: chunks.length, text: slice.join(' '), wordCount: slice.length, snippet: slice.join(' ').slice(0, 90) });
        }
      } else {
        flush();
        currentWords.push(...words);
      }
    }
  }
  flush();
  return chunks;
}

// ─── Audio PCM / WAV ────────────────────────────────────────────────────────
function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function bytesToB64(bytes: Uint8Array): string {
  let bin = '';
  const step = 0x8000;
  for (let i = 0; i < bytes.length; i += step) {
    bin += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + step)));
  }
  return btoa(bin);
}

function wavHeader(pcmLength: number, sampleRate = 24000, channels = 1, bits = 16): Uint8Array {
  const buf = new ArrayBuffer(44);
  const v = new DataView(buf);
  const w = (o: number, s: string) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  w(0, 'RIFF');
  v.setUint32(4, 36 + pcmLength, true);
  w(8, 'WAVE');
  w(12, 'fmt ');
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, channels, true);
  v.setUint32(24, sampleRate, true);
  v.setUint32(28, (sampleRate * channels * bits) / 8, true);
  v.setUint16(32, (channels * bits) / 8, true);
  v.setUint16(34, bits, true);
  w(36, 'data');
  v.setUint32(40, pcmLength, true);
  return new Uint8Array(buf);
}

function extractPcm(raw: Uint8Array) {
  let pcm = raw;
  let sampleRate = 24000;
  const ascii = (o: number) => String.fromCharCode(raw[o], raw[o + 1], raw[o + 2], raw[o + 3]);
  if (raw.length > 44 && ascii(0) === 'RIFF' && ascii(8) === 'WAVE') {
    const v = new DataView(raw.buffer, raw.byteOffset, raw.byteLength);
    let off = 12;
    pcm = raw.subarray(44);
    while (off + 8 <= raw.length) {
      const id = ascii(off);
      const size = v.getUint32(off + 4, true);
      if (id === 'fmt ' && size >= 16) sampleRate = v.getUint32(off + 12, true) || 24000;
      if (id === 'data') {
        pcm = raw.subarray(off + 8, Math.min(raw.length, off + 8 + size));
        break;
      }
      off += 8 + size + (size % 2);
    }
  }
  if (pcm.length % 2 !== 0) pcm = pcm.subarray(0, pcm.length - 1);
  return { pcm: new Uint8Array(pcm), sampleRate };
}

function microFade(pcm: Uint8Array, sampleRate = 24000, ms = 20, fadeIn = true): Uint8Array {
  const out = new Uint8Array(pcm);
  const v = new DataView(out.buffer);
  const total = Math.floor(out.length / 2);
  const n = Math.min(Math.floor((sampleRate * ms) / 1000), Math.floor(total / 4));
  for (let i = 0; i < n; i++) {
    if (fadeIn) v.setInt16(i * 2, Math.round(v.getInt16(i * 2, true) * (i / n)), true);
    const idx = total - n + i;
    v.setInt16(idx * 2, Math.round(v.getInt16(idx * 2, true) * ((n - 1 - i) / n)), true);
  }
  return out;
}

function concatBytes(parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((s, p) => s + p.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const p of parts) {
    out.set(p, off);
    off += p.length;
  }
  return out;
}

const FUNDAMENTAL_VOICES_2_5 = ['Kore', 'Puck', 'Charon', 'Fenrir', 'Aoede'];
function compatibleVoice(voice: string, model: string) {
  const v = (voice || 'Kore').trim();
  if (model.includes('2.5')) return FUNDAMENTAL_VOICES_2_5.includes(v) ? v : 'Kore';
  if (model.includes('lite')) return ['Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr', 'Aoede'].includes(v) ? v : 'Kore';
  return v;
}

async function geminiPost(model: string, key: string, body: any, timeoutMs = 90000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const resp = await nativeFetch(`${GEMINI_BASE}/models/${model}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    const data = await resp.json().catch(() => ({}));
    return { status: resp.status, ok: resp.ok, data };
  } finally {
    clearTimeout(timer);
  }
}

interface SynthOpts {
  text: string;
  voiceName?: string;
  stylePrompt?: string;
  model?: string;
  multiSpeaker?: boolean;
  speaker1?: { name?: string; voiceName?: string };
  speaker2?: { name?: string; voiceName?: string };
  preferredKeyOffset?: number;
  onFailover?: (n: any) => void;
}

function buildGeminiTtsPayloadParts(
  cleanText: string,
  opts: { multiSpeaker?: boolean; speaker1Name?: string; speaker2Name?: string; supportsMultiSpeaker?: boolean },
) {
  if (!opts.multiSpeaker || !opts.supportsMultiSpeaker) {
    return { useMultiSpeaker: false, parts: [{ text: cleanText }], inlineText: cleanText };
  }
  const s1 = (opts.speaker1Name || 'Alex').trim();
  const s2 = (opts.speaker2Name || 'Sam').trim();
  const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const turnRegex = new RegExp(
    `(?:^|\\n)\\s*(${esc(s1)}|${esc(s2)}|Hablante\\s*1|Hablante\\s*2|Speaker\\s*1|Speaker\\s*2)\\s*:\\s*`,
    'gi',
  );
  const turns: { speaker: string; text: string }[] = [];
  const matches = Array.from(cleanText.matchAll(turnRegex));

  if (matches.length > 0) {
    const firstIdx = matches[0].index || 0;
    const leadingText = cleanText.slice(0, firstIdx).trim();
    if (leadingText) turns.push({ speaker: s1, text: leadingText });
    for (let i = 0; i < matches.length; i++) {
      const m = matches[i];
      const rawSpeaker = (m[1] || '').trim().toLowerCase();
      const speaker = rawSpeaker === s2.toLowerCase() || rawSpeaker.endsWith('2') ? s2 : s1;
      const start = (m.index || 0) + m[0].length;
      const end = i + 1 < matches.length ? matches[i + 1].index || cleanText.length : cleanText.length;
      const segmentText = cleanText.slice(start, end).trim();
      if (segmentText) turns.push({ speaker, text: segmentText });
    }
  } else {
    const sentences = cleanText
      .split(/(?<=[.!?…])\s+|\n+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (sentences.length <= 1) {
      return { useMultiSpeaker: false, parts: [{ text: cleanText }], inlineText: cleanText };
    }
    sentences.forEach((sentence, idx) => {
      turns.push({ speaker: idx % 2 === 0 ? s1 : s2, text: sentence });
    });
  }

  if (turns.length === 0) {
    return { useMultiSpeaker: false, parts: [{ text: cleanText }], inlineText: cleanText };
  }

  return {
    useMultiSpeaker: true,
    parts: turns.map((t) => ({ text: t.text, speech_metadata: { speaker: t.speaker } })),
    inlineText: turns.map((t) => `${t.speaker}: ${t.text}`).join('\n'),
  };
}

async function synthesizeChunk(opts: SynthOpts) {
  const keys = requireKeys();
  const cleanText = sanitizeScriptText(opts.text);
  if (!cleanText) throw new Error('El texto a sintetizar no contiene palabras válidas.');
  const envIds = ttsModelIds();
  const preferred = (opts.model || envIds[0]).replace('models/', '').trim();
  const modelsToTry = [preferred, ...envIds.filter((m) => m !== preferred)];
  let lastError: Error | null = null;

  for (const model of modelsToTry) {
    for (let kStep = 0; kStep < keys.length; kStep++) {
      const k = (Math.max(0, opts.preferredKeyOffset || 0) + kStep) % keys.length;
      const s1Name = opts.speaker1?.name || 'Alex';
      const s2Name = opts.speaker2?.name || 'Sam';
      const payloadSpec = buildGeminiTtsPayloadParts(cleanText, {
        multiSpeaker: opts.multiSpeaker,
        speaker1Name: s1Name,
        speaker2Name: s2Name,
        supportsMultiSpeaker: !model.includes('lite'),
      });
      const speechConfig = payloadSpec.useMultiSpeaker
        ? {
            multiSpeakerVoiceConfig: {
              speakerVoiceConfigs: [
                { speaker: s1Name, voiceConfig: { prebuiltVoiceConfig: { voiceName: compatibleVoice(opts.speaker1?.voiceName || 'Puck', model) } } },
                { speaker: s2Name, voiceConfig: { prebuiltVoiceConfig: { voiceName: compatibleVoice(opts.speaker2?.voiceName || 'Kore', model) } } },
              ],
            },
          }
        : {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: compatibleVoice((opts.multiSpeaker ? opts.speaker1?.voiceName : opts.voiceName) || 'Kore', model),
              },
            },
          };

      try {
        let r = await geminiPost(model, keys[k], {
          contents: [{ role: 'user', parts: payloadSpec.parts }],
          generationConfig: { responseModalities: ['AUDIO'], speechConfig },
        });
        if (!r.ok && r.status === 400 && payloadSpec.useMultiSpeaker) {
          r = await geminiPost(model, keys[k], {
            contents: [{ role: 'user', parts: [{ text: payloadSpec.inlineText }] }],
            generationConfig: { responseModalities: ['AUDIO'], speechConfig },
          });
        }
        if (!r.ok) {
          const err: any = new Error(r.data?.error?.message || `Error ${r.status} en Gemini TTS`);
          err.status = r.status;
          throw err;
        }
        const audioPart = (r.data?.candidates?.[0]?.content?.parts || []).find((p: any) => p.inlineData?.data);
        if (!audioPart) throw new Error('La respuesta de Gemini no incluyó datos de audio.');
        const { pcm: rawPcm, sampleRate } = extractPcm(b64ToBytes(audioPart.inlineData.data));
        const pcm = microFade(rawPcm, sampleRate, 18);
        const wav = concatBytes([wavHeader(pcm.length, sampleRate), pcm]);
        return {
          pcm,
          sampleRate,
          audioBase64: bytesToB64(wav),
          durationSeconds: Math.max(1, Math.round((pcm.length / (sampleRate * 2)) * 10) / 10),
          usedModel: model,
          usedKeyIndex: k,
        };
      } catch (e: any) {
        const status = e?.status || 0;
        const msg = String(e?.message || '').toLowerCase();
        lastError = e instanceof Error ? e : new Error(String(e));
        const keyErr = status === 429 || status === 403 || (status === 400 && (msg.includes('api_key') || msg.includes('key not valid')));
        const modelErr = status === 404 || status === 503 || msg.includes('not found') || msg.includes('overloaded') || msg.includes('not supported') || e?.name === 'AbortError';
        if (keyErr) {
          if (kStep + 1 < keys.length) opts.onFailover?.({ fromIndex: k, toIndex: (k + 1) % keys.length, label: `Clave #${((k + 1) % keys.length) + 1}`, reason: status === 429 ? 'Límite de cuota 429 alcanzado' : `Estado ${status}` });
          continue;
        }
        if (modelErr || (status === 400 && msg.includes('voice'))) break;
        throw lastError;
      }
    }
  }
  throw lastError || new Error('No se pudo sintetizar el audio con las claves y modelos disponibles.');
}

// ─── Trabajos largos (hasta 60 min) con eventos estilo SSE ──────────────────
interface LocalJob {
  id: string;
  status: 'processing' | 'paused' | 'completed' | 'failed' | 'cancelled';
  opts: SynthOpts;
  chunks: (Chunk & { status: string; durationSeconds: number; pcm?: Uint8Array | null; audioBase64?: string | null })[];
  totalChunks: number;
  currentChunkIndex: number;
  completedChunks: number;
  estimatedTotalSeconds: number;
  generatedTotalSeconds: number;
  progressPercent: number;
  downloadUrl?: string;
  listeners: Set<(event: string, data: any) => void>;
  history: { event: string; data: any }[];
}

const localJobs = new Map<string, LocalJob>();

function emit(job: LocalJob, event: string, data: any) {
  job.history.push({ event, data });
  job.listeners.forEach((l) => l(event, data));
}

async function processJob(job: LocalJob) {
  for (let i = 0; i < job.chunks.length; i++) {
    if (job.status === 'cancelled') return;
    while (job.status === 'paused') {
      await new Promise((r) => setTimeout(r, 600));
      if ((job.status as string) === 'cancelled') return;
    }
    const chunk = job.chunks[i];
    if (chunk.status === 'completed') continue;
    job.currentChunkIndex = i;
    chunk.status = 'processing';
    emit(job, 'chunk_start', { chunkIndex: i });
    try {
      const r = await synthesizeChunk({ ...job.opts, text: chunk.text, preferredKeyOffset: i, onFailover: (n) => emit(job, 'api_key_failover', { ...n, timestamp: Date.now() }) });
      chunk.status = 'completed';
      chunk.durationSeconds = r.durationSeconds;
      chunk.pcm = r.pcm;
      chunk.audioBase64 = r.audioBase64;
      job.completedChunks = job.chunks.filter((c) => c.status === 'completed').length;
      job.generatedTotalSeconds = Math.round(job.chunks.reduce((s, c) => s + (c.status === 'completed' ? c.durationSeconds : 0), 0) * 10) / 10;
      job.progressPercent = Math.round((job.completedChunks / job.totalChunks) * 100);
      emit(job, 'chunk_complete', { chunkIndex: i, durationSeconds: r.durationSeconds, audioBase64: r.audioBase64, progressPercent: job.progressPercent, generatedTotalSeconds: job.generatedTotalSeconds });
    } catch (err: any) {
      chunk.status = 'failed';
      job.status = 'failed';
      emit(job, 'job_failed', { error: err?.message || 'Fallo al sintetizar fragmento', chunkIndex: i });
      return;
    }
  }

  // Ensamblado del WAV maestro con micro-fades y pausas naturales de 220 ms
  const silence = new Uint8Array(Math.floor(24000 * 0.22) * 2);
  const parts: Uint8Array[] = [];
  job.chunks.forEach((c, idx) => {
    if (!c.pcm) return;
    parts.push(microFade(c.pcm, 24000, 20));
    if (idx < job.chunks.length - 1) parts.push(silence);
  });
  let pcm = concatBytes(parts);
  pcm = microFade(pcm, 24000, 35, false);
  const wav = concatBytes([wavHeader(pcm.length), pcm]);
  job.chunks.forEach((c) => (c.pcm = null));
  job.downloadUrl = URL.createObjectURL(new Blob([wav], { type: 'audio/wav' }));
  job.generatedTotalSeconds = Math.round((pcm.length / 48000) * 10) / 10;
  job.status = 'completed';
  job.progressPercent = 100;
  emit(job, 'job_completed', { id: job.id, totalDurationSeconds: job.generatedTotalSeconds, downloadUrl: job.downloadUrl });
}

class PortableJobEventSource {
  private handlers = new Map<string, Set<(ev: MessageEvent) => void>>();
  private listener: ((event: string, data: any) => void) | null = null;
  readyState = 1;
  onerror: ((ev: any) => void) | null = null;

  constructor(private job: LocalJob) {
    this.listener = (event, data) => this.dispatch(event, data);
    setTimeout(() => {
      this.dispatch('snapshot', {
        id: job.id,
        status: job.status,
        totalChunks: job.totalChunks,
        currentChunkIndex: job.currentChunkIndex,
        completedChunks: job.completedChunks,
        estimatedTotalSeconds: job.estimatedTotalSeconds,
        generatedTotalSeconds: job.generatedTotalSeconds,
        progressPercent: job.progressPercent,
        downloadUrl: job.downloadUrl,
        chunks: job.chunks.map((c) => ({ index: c.index, wordCount: c.wordCount, status: c.status, durationSeconds: c.durationSeconds, audioBase64: c.audioBase64 })),
      });
      job.history.forEach((h) => this.dispatch(h.event, h.data));
      if (this.listener) job.listeners.add(this.listener);
    }, 0);
  }

  private dispatch(event: string, data: any) {
    const ev = new MessageEvent(event, { data: JSON.stringify(data) });
    this.handlers.get(event)?.forEach((h) => h(ev));
  }

  addEventListener(event: string, handler: (ev: MessageEvent) => void) {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set());
    this.handlers.get(event)!.add(handler);
  }

  removeEventListener(event: string, handler: (ev: MessageEvent) => void) {
    this.handlers.get(event)?.delete(handler);
  }

  close() {
    this.readyState = 2;
    if (this.listener) this.job.listeners.delete(this.listener);
    this.listener = null;
  }
}

// ─── Generación de escenas HTML con IA (espejo de /video/generate-html) ─────
function computePortableScriptTimelineMap(scriptText: string, totalDurationSeconds = 30) {
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

  const merged: string[] = [];
  for (let i = 0; i < rawSegments.length; i++) {
    const seg = rawSegments[i];
    if (seg.length < 18 && i + 1 < rawSegments.length) {
      rawSegments[i + 1] = `${seg} ${rawSegments[i + 1]}`;
    } else {
      merged.push(seg);
    }
  }

  const maxBeats = 7;
  const beatsRaw: string[] = [];
  if (merged.length <= maxBeats) {
    beatsRaw.push(...merged);
  } else {
    const groupSize = Math.ceil(merged.length / maxBeats);
    for (let i = 0; i < merged.length; i += groupSize) {
      beatsRaw.push(merged.slice(i, i + groupSize).join(' '));
    }
  }

  const wordTimings: { word: string; startPct: number; endPct: number; beatIndex: number }[] = [];
  const beatObjects: {
    index: number;
    text: string;
    startSec: number;
    endSec: number;
    durationSec: number;
    startPct: number;
    endPct: number;
  }[] = [];
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
    if (wList.length > 0) wList[wList.length - 1].weight += 7;
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

function buildHtmlPrompts(b: any) {
  const aspectRatio = b.aspectRatio || '9:16';
  const isVertical = aspectRatio === '9:16';
  const width = isVertical ? 1080 : 1920;
  const height = isVertical ? 1920 : 1080;
  const hasBaseVideo = Boolean(b.hasBaseVideo);
  const durationSeconds = Math.max(6, Math.min(180, Number(b.durationSeconds) || 30));
  const companyName = b.companyName || 'WAPPY IA';
  const effectiveScript =
    b.scriptText ||
    b.prompt ||
    'La prevención y la inteligencia artificial transforman la seguridad en el trabajo con WAPPY IA.';
  const timelineMap = computePortableScriptTimelineMap(effectiveScript, durationSeconds);
  const beatsScheduleText = timelineMap.beats
    .map(
      (beat) =>
        `  * ESCENA #scene-${beat.index} [Desde ${beat.startSec}s hasta ${beat.endSec}s (duración ${beat.durationSec}s)]: "${beat.text}"`,
    )
    .join('\n');

  const systemInstruction = `Eres el Director de Motion Graphics Senior de WAPPY IA, experto en los sistemas oficiales "animaciones-17-efectos-reels", "animaciones-wappy-brand", "animaciones-dark-tech-hud", "animaciones-explicativas-sst" y "hyperframes-motion-design" (GSAP 3 + Tailwind CSS + SVG Duotone + HUD Táctico).
Tu objetivo es crear una composición HTML5 autocontenida, cinematográfica y 100% sincronizada segundo a segundo con la voz para relación de aspecto ${aspectRatio} (${width}x${height}).

REGLAS ESTRICTAS DE ARQUITECTURA VISUAL, IDENTIDAD WAPPY Y SINCRONIZACIÓN DE VOZ:
1. Devuelve ÚNICAMENTE el código HTML completo (desde <!DOCTYPE html> hasta </html>), sin bloques markdown (\`\`\`html).
2. Incluye en el <head>:
   - <script src="https://cdn.tailwindcss.com"></script>
   - <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
   - Google Fonts: 'Outfit' (800, 900), 'Plus Jakarta Sans' (500, 700, 800) y 'JetBrains Mono' (600, 700).
3. IDENTIDAD VISUAL OFICIAL DE WAPPY IA:
   - Paleta oficial: Verde Lima Eléctrico (\`#c7f303\`), Turquesa SST (\`#14b8a6\` / \`#0d9488\`), Cian HUD (\`#06b6d4\`), Ámbar Alerta (\`#f59e0b\`) y Cosmos Oscuro (\`#050d0a\` a \`#060d14\`).
   - Titulares Cinéticos en 'Outfit' ExtraBold/Black con píldoras de resaltado luminoso: \`<span class="inline-block px-3 py-0.5 rounded-xl bg-[#c7f303] text-[#0a1004] font-black shadow-[0_0_24px_rgba(199,243,3,0.45)]">PALABRA CLAVE</span>\`.
   - TOP HUD TÁCTICO (#header-hud): Ecualizador animado + insignia \`ECOSISTEMA IA • SG-SST\` + radar SVG giratorio o \`• WAPPY.CLUB\`.
   - RIQUEZA VISUAL OBLIGATORIA: Cada escena debe incluir tarjetas comparativas (Tradicional Rojo vs WAPPY IA Lima), Mockup de Celular con Dynamic Island, Telemetría HUD con barras de progreso, e Iconos SVG Duotone grandes animados.
4. SINCRONIZACIÓN EXACTA ESCENA POR ESCENA CON LA VOZ:
   - Tienes ${timelineMap.beats.length} escenas obligatorias sincronizadas con la voz:
${beatsScheduleText}
   - En \`window.mainTimeline = gsap.timeline({ repeat: 0 });\`:
     * Posiciona cada \`#scene-i\` en su \`startSec\` exacto.
     * \`#scene-1\` DEBE estar visible por defecto en el HTML estático (sin \`opacity-0\`).
     * La última escena (\`#scene-${timelineMap.beats.length}\`) NUNCA debe ocultarse al terminar.
   - PROHIBIDO crear un \`<footer id="subtitle-container">\` propio ni usar \`subtitles.reverse()\`. Deja \`padding-bottom: 78px\` en \`#stage\`.
5. API DE CONTROL EXTERNO:
   - Escucha \`window.addEventListener('message', (e) => { ... })\` para \`STUDIO_PLAY\`, \`STUDIO_PAUSE\`, \`STUDIO_RESTART\` y \`STUDIO_SEEK\` (\`window.mainTimeline?.progress(e.data.progress)\`).`;

  const userPrompt = `Diseña una composición animada de nivel estudio en HTML + GSAP sincronizada exactamente con este mapa de locución:
- Formato: ${aspectRatio} (${width}x${height})
- Duración exacta del audio: ${durationSeconds} segundos
- Empresa / Marca: ${companyName}
- Tema visual: ${b.theme || 'wappy-emerald'}
- ¿Tiene video base debajo?: ${hasBaseVideo ? 'SÍ (fondo transparente)' : 'NO (fondo cósmico WAPPY Dark Tech + partículas)'}
- Instrucción creativa del usuario: ${b.prompt || 'Reel estilo WAPPY IA oficial con tarjetas interactivas, iconos SVG duotone animados y telemetría HUD.'}
- MAPA EXACTO DE ESCENAS Y TIEMPOS DE VOZ:
${beatsScheduleText}

Devuelve SOLO el código HTML puro empezando por <!DOCTYPE html>.`;
  return { systemInstruction, userPrompt, timelineMap };
}

async function generateHtml(b: any) {
  const keys = requireKeys();
  const { systemInstruction, userPrompt, timelineMap } = buildHtmlPrompts(b);
  const envIds = textModelIds();
  const preferred = String(b.modelName || envIds[0]).replace('models/', '').trim();
  const models = [preferred, ...envIds.filter((m) => m !== preferred)];
  let lastErr = 'No se pudo generar la escena HTML con IA.';
  for (const model of models) {
    for (const key of keys) {
      const r = await geminiPost(model, key, {
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        generationConfig: { temperature: 0.35 },
      }, 180000).catch((e) => ({ ok: false, status: 0, data: { error: { message: e?.message } } }) as any);
      if (r.ok) {
        let html = (r.data?.candidates?.[0]?.content?.parts || []).map((p: any) => p.text || '').join('');
        html = html.replace(/^```html\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
        if (!html.toLowerCase().includes('<html')) throw new Error('El modelo no devolvió un documento HTML válido.');
        html = html.replace(/subtitles\.reverse\(\)/g, 'subtitles.slice().reverse()');
        const syncHelper = `<script id="wappy-beat-sync-helper">window.__wappyTimelineBeats=${JSON.stringify(timelineMap.beats)};window.__wappyWordTimings=${JSON.stringify(timelineMap.wordTimings)};</script>`;
        html = html.includes('</head>') ? html.replace('</head>', `${syncHelper}\n</head>`) : `${syncHelper}\n${html}`;
        return html;
      }
      lastErr = r.data?.error?.message || `Error ${r.status}`;
      if (r.status === 429 || r.status === 403) continue; // rotar clave
      break; // rotar modelo
    }
  }
  throw new Error(lastErr);
}

async function enhanceScript(opts: any) {
  const keys = requireKeys();
  const envModels = textModelIds();
  const preferred = String(opts.modelName || envModels[0] || 'gemini-3.5-flash-lite')
    .replace('models/', '')
    .trim();
  const models = Array.from(new Set([preferred, ...envModels]));
  const promptInstruction = opts.multiSpeaker
    ? `Eres un guionista experto en podcasts y locución neural para Gemini 3.8 Flash TTS.
Convierte o mejora el siguiente texto en un diálogo dinámico entre dos interlocutores usando exactamente las etiquetas "Alex:" y "Sam:" al inicio de cada intervención.
Inserta efectos vocales orgánicos donde aporten naturalidad: <breath> (respiración), <laugh> (risa suave), |mhm| (asentimiento), |yeah| (acuerdo).
Estilo solicitado: ${opts.stylePrompt || 'Conversacional, fluido y profesional'}.
Devuelve ÚNICAMENTE el guion listo para sintetizar, sin introducciones ni bloques markdown.`
    : `Eres un director de locución profesional experto en Gemini 3.8 Flash TTS.
Mejora y enriquece el siguiente guion para que suene 100% humano, envolvente y con ritmo profesional.
Inserta etiquetas vocales orgánicas de Gemini TTS en las pausas clave: <breath> (toma de aire natural), <laugh> (si aplica), <gasp> (si aplica énfasis).
Estilo solicitado: ${opts.stylePrompt || 'Narración profesional, clara y expresiva'}.
Devuelve ÚNICAMENTE el texto del guion mejorado, sin comentarios adicionales ni comillas.`;

  const rawInputText = opts.text || opts.scriptText || '';
  const inputContent = `${promptInstruction}\n\nTEXTO BASE:\n${rawInputText || 'Crea una introducción impactante sobre cómo la Inteligencia Artificial y la prevención transforman el aprendizaje y la seguridad.'}`;

  let lastErr = 'Error al mejorar el guion con IA.';
  for (const model of models) {
    for (const key of keys) {
      const r = await geminiPost(model, key, {
        contents: [{ role: 'user', parts: [{ text: inputContent }] }],
        generationConfig: { temperature: 0.5 },
      });
      if (r.ok) {
        const text = (
          r.data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text || '').join('') || ''
        ).trim();
        if (text) return { text, model };
      }
      lastErr = r.data?.error?.message || `Error ${r.status}`;
      if (r.status === 429 || r.status === 403) continue;
      break;
    }
  }
  throw new Error(lastErr);
}

// ─── Router de endpoints ────────────────────────────────────────────────────
const json = (data: any, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

let serverChecked: Promise<boolean> | null = null;
function isServerAvailable(): Promise<boolean> {
  if (location.protocol === 'file:') return Promise.resolve(false);
  if (!serverChecked) {
    serverChecked = nativeFetch('/api/studio/catalog', { cache: 'no-store' })
      .then(async (r) => {
        const ok = r.ok && (r.headers.get('content-type') || '').includes('json');
        if (ok) {
          const data = await r.json().catch(() => null);
          if (Array.isArray(data?.googleModelsEnv)) setPortableGoogleModels(data.googleModelsEnv);
        }
        return ok;
      })
      .catch(() => false);
  }
  return serverChecked;
}

async function handleStudioRequest(url: URL, init?: RequestInit): Promise<Response> {
  const path = url.pathname.replace(/^\/api\/studio/, '');
  const method = (init?.method || 'GET').toUpperCase();
  let body: any = {};
  if (init?.body && typeof init.body === 'string') {
    try {
      body = JSON.parse(init.body);
    } catch {
      body = {};
    }
  }

  try {
    if (path === '/catalog') {
      if (await isServerAvailable()) {
        return nativeFetch(url.pathname + url.search, init);
      }
      return json({ googleModelsEnv: getPortableGoogleModels() });
    }
    if (path === '/keys-status') {
      const keys = readPortableKeys();
      if (keys.length === 0 && (await isServerAvailable())) {
        return nativeFetch(url.pathname + url.search, init);
      }
      return json({
        totalKeys: keys.length,
        customKeysCount: keys.length,
        systemKeysCount: 0,
        autoRotationEnabled: keys.length > 1,
        keys: keys.map((k, idx) => ({ index: idx, label: `Clave Local #${idx + 1}`, maskedKey: `${k.slice(0, 6)}••••••••${k.slice(-4)}`, status: idx === 0 ? 'active' : 'standby' })),
      });
    }
    if (path === '/keys-validate') {
      const list = [...(Array.isArray(body.customKeys) ? body.customKeys : []), ...(body.apiKey ? [body.apiKey] : [])]
        .map((k: string) => String(k || '').trim())
        .filter((k: string) => k.length > 8);
      if (!list.length) return json({ error: 'No se proporcionaron claves para validar.' }, 400);
      const results: { valid: boolean; error?: string }[] = [];
      for (const key of list) {
        try {
          const r = await nativeFetch(`${GEMINI_BASE}/models?pageSize=5`, { headers: { 'x-goog-api-key': key } });
          const d = await r.json().catch(() => ({}));
          results.push(r.ok && Array.isArray(d.models) ? { valid: true } : { valid: false, error: d?.error?.message || 'Clave inválida' });
        } catch (e: any) {
          results.push({ valid: false, error: e?.message || 'Sin conexión' });
        }
      }
      return json({ results, valid: Boolean(results[0]?.valid), error: results[0]?.error });
    }
    if (path === '/tts/estimate') {
      const clean = String(body.text || '').trim();
      const words = clean ? clean.split(/\s+/).filter(Boolean) : [];
      const chunks = splitTextIntoChunks(clean, body.maxWordsPerChunk);
      const estimatedSeconds = clean ? Math.max(2, Math.round((words.length / 145) * 60)) : 0;
      return json({
        totalWords: words.length,
        totalChars: clean.length,
        chunkCount: chunks.length,
        estimatedSeconds,
        estimatedMinutes: Math.round((estimatedSeconds / 60) * 10) / 10,
        chunksPreview: chunks.map((c) => ({ index: c.index, wordCount: c.wordCount, snippet: c.snippet })),
      });
    }
    if (path === '/tts/synthesize') {
      if (!String(body.text || '').trim()) return json({ error: 'El texto a sintetizar es obligatorio.' }, 400);
      if (readPortableKeys().length === 0 && (await isServerAvailable())) {
        return nativeFetch(url.pathname + url.search, init);
      }
      const r = await synthesizeChunk({ ...body, text: String(body.text).slice(0, 4500) });
      return json({ success: true, audioBase64: r.audioBase64, durationSeconds: r.durationSeconds, usedModel: r.usedModel, usedKeyIndex: r.usedKeyIndex });
    }
    if (path === '/tts/jobs' && method === 'POST') {
      if (readPortableKeys().length === 0 && (await isServerAvailable())) {
        return nativeFetch(url.pathname + url.search, init);
      }
      requireKeys();
      const chunks = splitTextIntoChunks(String(body.text || ''), body.maxWordsPerChunk);
      if (!chunks.length) return json({ error: 'El texto no contiene palabras válidas.' }, 400);
      const totalWords = chunks.reduce((s, c) => s + c.wordCount, 0);
      const job: LocalJob = {
        id: `tts_local_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
        status: 'processing',
        opts: body,
        chunks: chunks.map((c) => ({ ...c, status: 'pending', durationSeconds: 0, pcm: null, audioBase64: null })),
        totalChunks: chunks.length,
        currentChunkIndex: 0,
        completedChunks: 0,
        estimatedTotalSeconds: Math.max(3, Math.round((totalWords / 145) * 60)),
        generatedTotalSeconds: 0,
        progressPercent: 0,
        listeners: new Set(),
        history: [],
      };
      localJobs.set(job.id, job);
      processJob(job).catch(() => {});
      return json({ jobId: job.id, totalChunks: job.totalChunks, estimatedTotalSeconds: job.estimatedTotalSeconds });
    }
    const jobMatch = path.match(/^\/tts\/jobs\/([^/]+)\/(control|download)$/);
    if (jobMatch) {
      const job = localJobs.get(jobMatch[1]);
      if (!job) {
        if (await isServerAvailable()) return nativeFetch(url.pathname + url.search, init);
        return json({ error: 'Trabajo no encontrado.' }, 404);
      }
      if (jobMatch[2] === 'control') {
        const a = body.action;
        if (a === 'pause' && job.status === 'processing') job.status = 'paused';
        else if (a === 'resume' && job.status === 'paused') job.status = 'processing';
        else if (a === 'cancel') job.status = 'cancelled';
        emit(job, 'job_status', { status: job.status });
        return json({ success: true, status: job.status });
      }
      if (!job.downloadUrl) return json({ error: 'El archivo maestro de audio aún no está disponible.' }, 404);
      return nativeFetch(job.downloadUrl);
    }
    if (path === '/script/enhance') {
      if (await isServerAvailable()) {
        return nativeFetch(url.pathname + url.search, init);
      }
      const res = await enhanceScript(body);
      return json({ success: true, text: res.text, scriptText: res.text, model: res.model, usedModel: res.model });
    }
    if (path === '/antigravity/super-prompt') {
      if (await isServerAvailable()) {
        return nativeFetch(url.pathname + url.search, init);
      }
      const keys = requireKeys();
      const models = textModelIds();
      const dur = Math.max(6, Math.round(Number(body.durationSeconds) || 24));
      const steps = Array.isArray(body.scriptSteps) ? body.scriptSteps : [];
      const promptText = `Eres el Director de Arte y Arquitecto de Motion Graphics 60-FPS de WAPPY IA y Google Antigravity.
Construye un Super-Prompt Técnico Maestro (Sistema de las 7 Piezas) usando TODA esta información del usuario:
- Formato: ${body.aspectRatio || '9:16'} (${dur}s)
- Dirección de Arte: ${body.artDirection || 'dark-tech-hud'} | Acento: ${body.accentColor || '#14b8a6'}
- Insignia: "${body.badgeText || ''}" | Titular: "${body.headlineText || ''}" | Subtítulo: "${body.subtitleText || ''}"
- Voz: ${body.voiceName || 'Kore'} | Estilo: "${body.stylePrompt || ''}"
- Efectos Virales Seleccionados: ${(body.selectedEffects || []).join(', ')}
- Guion: """${body.scriptText || ''}"""
- Escaleta actual: ${JSON.stringify(steps)}
${body.userPrompt ? `- Nota adicional del usuario: "${body.userPrompt}"` : ''}

Devuelve un Super-Prompt estructurado en Markdown con las 7 Piezas de WAPPY IA y la escaleta escena por escena sincronizada segundo a segundo.`;
      for (const model of models) {
        for (const key of keys) {
          const r = await geminiPost(
            model,
            key,
            {
              contents: [{ role: 'user', parts: [{ text: promptText }] }],
              generationConfig: { temperature: 0.4 },
            },
            15000,
          ).catch(() => ({ ok: false, data: {} }) as any);
          if (r.ok) {
            const sp = (r.data?.candidates?.[0]?.content?.parts || [])
              .map((p: any) => p.text || '')
              .join('')
              .trim();
            if (sp) {
              return json({
                ok: true,
                success: true,
                usedAi: true,
                usedModel: model,
                superPrompt: sp,
                scriptSteps: steps,
              });
            }
          }
        }
      }
      return json({ error: 'No se pudo generar el Super-Prompt con IA en modo offline.' }, 500);
    }
    if (
      path === '/video/generate-html' ||
      path === '/antigravity/generate-html' ||
      path === '/antigravity/edit-html' ||
      path === '/video/compile-master-reel' ||
      path.startsWith('/antigravity/')
    ) {
      if (await isServerAvailable()) {
        return nativeFetch(url.pathname + url.search, init);
      }
      if (path === '/video/generate-html' || path === '/antigravity/generate-html') {
        const htmlCode = await generateHtml(body);
        return json({ success: true, htmlCode });
      }
      return json({ error: `Conectarse a internet es necesario para ${path}.` }, 503);
    }
    if (path === '/video/render-mp4' || path === '/video/render-serverless') {
      if (await isServerAvailable()) return nativeFetch(url.pathname, init);
      return json({ success: false, error: 'El video MP4 se ensambla en el servidor de WAPPY: abre WAPPY Studio en wappy.club con conexión a internet. Sin conexión puedes descargar la Cápsula HTML5 (incluye voz y animación).' }, 503);
    }
    if (await isServerAvailable()) {
      return nativeFetch(url.pathname + url.search, init);
    }
    return json({ error: `Endpoint portable no soportado: ${path}` }, 404);
  } catch (err: any) {
    return json({ success: false, error: err?.message || 'Error en WAPPY Studio portable.' }, 500);
  }
}

/** Instala la capa portable (idempotente). */
export function installPortableStudioApi() {
  if ((window as any).__wappyPortableApiInstalled) return;
  (window as any).__wappyPortableApiInstalled = true;

  (window as any).fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    const raw = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    let url: URL | null = null;
    try {
      url = new URL(raw, location.protocol === 'file:' ? 'https://wappy.club/' : location.href);
    } catch {
      url = null;
    }
    if (url && url.pathname.startsWith('/api/studio/') && (raw.startsWith('/') || url.origin === location.origin || location.protocol === 'file:')) {
      return handleStudioRequest(url, init);
    }
    return nativeFetch(input as any, init);
  };

  (window as any).EventSource = function PortableEventSource(this: any, url: string, cfg?: any) {
    const m = String(url).match(/\/api\/studio\/tts\/jobs\/([^/?]+)\/stream/);
    if (m && localJobs.has(m[1])) return new PortableJobEventSource(localJobs.get(m[1]) as LocalJob);
    return new NativeEventSource(url, cfg);
  } as any;

  isServerAvailable();
}
