import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuthContext } from '~/hooks/AuthContext';
import {
    SileroVadProcessor,
    SILERO_FRAME_SAMPLES,
    SILERO_SAMPLE_RATE,
} from '~/utils/sileroVad';

interface VoiceMessage {
    type: 'audio' | 'text' | 'status' | 'error' | 'interrupted' | 'conversationId' | 'conversationUpdated' | 'report' | 'wappy_action' | 'agent_switched' | 'tenshi_report_delivered' | 'canvas_file_generated' | 'notebooklm_auth_expired';
    data: any;
}

interface UseVoiceSessionOptions {
    onAudioReceived?: (audioData: string) => void;
    onTextReceived?: (text: string, isUserTranscription?: boolean, replaceLastUserBubble?: boolean) => void;
    onReportReceived?: (html: string, messageId?: string, evaluatedFrames?: string[], conversationId?: string, isNewReport?: boolean) => void;
    onWappyAction?: (action: { id: string; name: string; args: any }) => void;
    onAgentSwitched?: (data: { agentName: string; agentId: string; isBiomechanics: boolean; isFisioMode: boolean; conversationId?: string; badge?: string }) => void;
    onNotebookLmAuthExpired?: (data: { toolName?: string; mappedTool?: string; authExpired: boolean; isValid: boolean; reason?: string; message?: string }) => void;
    onStatusChange?: (status: string, message?: string) => void;
    onError?: (error: string) => void;
    conversationId?: string;
    onConversationIdUpdate?: (newId: string) => void;
    onConversationUpdated?: (conversationId?: string) => void;
    disableAudio?: boolean;
    mode?: 'chat' | 'live_analysis' | 'tenshi_voice' | string;
    initialVoice?: string;
    model?: string;
    endpoint?: string;
    template?: string;
    agentId?: string;
    token?: string;
    companyId?: string;
    workerName?: string;
    workerId?: string;
    cargo?: string;
    actividad?: string;
    route?: string;
    isHeroMode?: boolean;
    agentName?: string;
    personality?: string;
}

export const useVoiceSession = (options: UseVoiceSessionOptions = {}) => {
    const { token: authContextToken } = useAuthContext();
    const token = options.token || authContextToken;
    const { conversationId, disableAudio } = options;

    const optionsRef = useRef(options);
    useEffect(() => {
        optionsRef.current = options;
    }, [options]);

    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [status, setStatus] = useState<'idle' | 'connecting' | 'ready' | 'listening' | 'thinking' | 'speaking'>('idle');

    const wsRef = useRef<WebSocket | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const workletNodeRef = useRef<AudioWorkletNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const videoCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const isHardwareMutedRef = useRef(false);
    const isAutoMutedRef = useRef(false);
    const isPlayingAudioRef = useRef(false);
    const serverFinishedRef = useRef(false);
    const autoMuteTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const inputAnalyserRef = useRef<AnalyserNode | null>(null);
    const isStartingAudioRef = useRef(false);
    const listeningStartTimeRef = useRef(0);
    const noiseFloorRef = useRef<number>(0.005);
    const activeSpeechDurationMsRef = useRef<number>(0);
    const onsetSpeechMsRef = useRef<number>(0);
    const bargeInDurationMsRef = useRef<number>(0);
    const recentWindowPeakRmsRef = useRef<number>(0);
    const recentWindowStartAtRef = useRef<number>(0);
    const bargeInIgnoreAudioUntilRef = useRef<number>(0);
    const lastVoiceTimeRef = useRef<number>(0);
    const silenceDurationMsRef = useRef<number>(0);
    const speechStartTimeRef = useRef<number>(0);
    const preRollChunksRef = useRef<Float32Array[]>([]);
    // true mientras el noise gate está transmitiendo una locución; al cerrarse se emite speech_end una sola vez
    const isTransmittingSpeechRef = useRef(false);
    // Silero VAD v5 neuronal en navegador (carga lazy al iniciar captura, fallback automático calibrado si falla)
    const sileroVadRef = useRef<SileroVadProcessor | null>(null);
    const captureGenerationRef = useRef<number>(0);
    const statusRef = useRef(status);
    useEffect(() => {
        statusRef.current = status;
    }, [status]);

    /**
     * Start Audio Capture
     */
    const startAudioCapture = async () => {
        if (isStartingAudioRef.current || streamRef.current) {
            console.log('[VoiceSession] startAudioCapture ya en progreso o stream activo, ignorando llamada duplicada.');
            return;
        }
        isStartingAudioRef.current = true;
        try {
            console.log('[VoiceSession] Starting audio capture...');
            isAutoMutedRef.current = false;
            isPlayingAudioRef.current = false;

            // 1. Get Microphone Stream con Supresión Avanzada de Ruido y Aislamiento de Voz
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    // Parámetros avanzados para aislar voz humana y cancelar ruido de fondo (Chromium/Safari)
                    googEchoCancellation: true,
                    googAutoGainControl: true,
                    googNoiseSuppression: true,
                    googHighpassFilter: true,
                    voiceIsolation: true,
                } as MediaTrackConstraints,
                video: false
            });
            streamRef.current = stream;
            if (isHardwareMutedRef.current) {
                stream.getAudioTracks().forEach((track) => {
                    track.enabled = false;
                });
            }
            console.log('[VoiceSession] Micrófono obtenido con supresión de ruido, tracks:', stream.getAudioTracks().map(t => t.label));

            // 2. Inicializar o Reutilizar AudioContext a 16kHz
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioContextClass) throw new Error('AudioContext no disponible en este browser');

            let audioContext = audioContextRef.current;
            const sharedCtx = (window as any).sharedAudioContext16k;
            let workletAlreadyLoaded = false;

            if (!audioContext || audioContext.state === 'closed') {
                if (sharedCtx && sharedCtx.state !== 'closed') {
                    console.log('[VoiceSession] Reutilizando AudioContext 16kHz existente, estado:', sharedCtx.state);
                    audioContext = sharedCtx;
                    workletAlreadyLoaded = !!(window as any).sharedAudioWorkletFastLoaded;
                } else {
                    console.log('[VoiceSession] Creando nuevo AudioContext (16kHz o nativo)');
                    try {
                        audioContext = new AudioContextClass({ sampleRate: 16000 });
                    } catch (e) {
                        console.log('[VoiceSession] sampleRate 16000 no admitido directamente en este navegador, usando tasa nativa del dispositivo');
                        audioContext = new AudioContextClass();
                    }
                    (window as any).sharedAudioWorkletFastLoaded = false;
                }
                audioContextRef.current = audioContext;
                (window as any).sharedAudioContext16k = audioContext;
            } else {
                workletAlreadyLoaded = !!(window as any).sharedAudioWorkletFastLoaded;
            }

            if (!audioContext) throw new Error('AudioContext no disponible después de la inicialización');

            // Reanudar si estaba suspendido
            if (audioContext.state === 'suspended') {
                console.log('[VoiceSession] Reanudando AudioContext 16kHz suspendido');
                await audioContext.resume();
            }
            console.log('[VoiceSession] AudioContext 16kHz listo, estado:', audioContext.state, '| sampleRate:', audioContext.sampleRate);

            // 3. Pipeline 16kHz compartido (anti-aliasing → frames exactos de 512 muestras = 32ms → Silero VAD v5 / fallback → Int16 WS)
            const captureGeneration = ++captureGenerationRef.current;

            // Carga lazy de Silero VAD v5 neuronal (sin bloquear la apertura del micrófono; fallback automático mientras carga o si falla)
            if (!sileroVadRef.current) {
                sileroVadRef.current = new SileroVadProcessor();
            } else {
                sileroVadRef.current.reset();
            }
            const sileroVad = sileroVadRef.current;
            sileroVad.init().then((ok) => {
                if (captureGeneration !== captureGenerationRef.current) return;
                if (ok) {
                    console.log('[VoiceSession] 🧠 Silero VAD v5 neuronal activo (16kHz / 512 muestras = 32ms)');
                } else {
                    console.log('[VoiceSession] Silero VAD no disponible → usando detector adaptativo calibrado (fallback)');
                }
            });

            let sendCount = 0;
            let resamplePhase = 0;
            let frame16kPending = new Float32Array(0);
            const queuedFrames16k: Float32Array[] = [];
            let isDrainingFrames = false;

            const resampleTo16k = (float32Array: Float32Array): Float32Array => {
                const currentSampleRate = audioContext?.sampleRate || SILERO_SAMPLE_RATE;
                if (currentSampleRate === SILERO_SAMPLE_RATE || currentSampleRate <= 0) {
                    resamplePhase = 0;
                    return float32Array;
                }

                // Re-muestreo continuo anti-aliasing con ventana promediada (evita distorsión Nyquist de consonantes s/c/t/d/b a 44.1kHz o 48kHz)
                const ratio = currentSampleRate / SILERO_SAMPLE_RATE;
                const availableSamples = float32Array.length - resamplePhase;
                const newLength = Math.max(0, Math.floor(availableSamples / ratio));
                const resampled = new Float32Array(newLength);
                let srcIdx = resamplePhase;
                for (let i = 0; i < newLength; i++) {
                    if (ratio > 1.05) {
                        // Filtro anti-aliasing de diezmado (promediado ponderado en la ventana [srcIdx, srcIdx + ratio])
                        const start = srcIdx;
                        const end = Math.min(float32Array.length, srcIdx + ratio);
                        const iStart = Math.floor(start);
                        const iEnd = Math.floor(end);
                        let sum = 0;
                        let weightSum = 0;
                        for (let k = iStart; k <= iEnd && k < float32Array.length; k++) {
                            const segStart = Math.max(start, k);
                            const segEnd = Math.min(end, k + 1);
                            const w = Math.max(0, segEnd - segStart);
                            if (w > 0) {
                                sum += float32Array[k] * w;
                                weightSum += w;
                            }
                        }
                        resampled[i] = weightSum > 0 ? (sum / weightSum) : (float32Array[iStart] || 0);
                    } else {
                        const idx = Math.floor(srcIdx);
                        const frac = srcIdx - idx;
                        const s0 = float32Array[idx] || 0;
                        const s1 = (idx + 1 < float32Array.length) ? float32Array[idx + 1] : s0;
                        resampled[i] = s0 + frac * (s1 - s0);
                    }
                    srcIdx += ratio;
                }
                resamplePhase = Math.max(0, srcIdx - float32Array.length);
                return resampled;
            };

            const encodeAndSend16k = (pcm16k: Float32Array) => {
                if (pcm16k.length === 0) return;
                if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

                // Normalización suave de presencia vocal SOLO sobre voz real (jamás amplificar ruido ambiente/silencio digital)
                let chunkSumSq = 0;
                for (let j = 0; j < pcm16k.length; j++) {
                    chunkSumSq += pcm16k[j] * pcm16k[j];
                }
                const chunkRms = Math.sqrt(chunkSumSq / pcm16k.length);
                const agcMinVoiceRms = Math.max(0.018, noiseFloorRef.current * 2.0);
                const gain = (chunkRms > agcMinVoiceRms && chunkRms < 0.09)
                    ? Math.min(1.65, 0.09 / chunkRms)
                    : 1.0;

                const int16Data = new Int16Array(pcm16k.length);
                for (let j = 0; j < pcm16k.length; j++) {
                    const raw = pcm16k[j] * gain;
                    const s = Math.abs(raw) > 0.85 ? Math.tanh(raw) : Math.max(-1, Math.min(1, raw));
                    int16Data[j] = s < 0 ? s * 0x8000 : s * 0x7FFF;
                }
                const bytes = new Uint8Array(int16Data.buffer);
                let binary = '';
                for (let i = 0; i < bytes.byteLength; i++) {
                    binary += String.fromCharCode(bytes[i]);
                }
                const base64 = btoa(binary);
                wsRef.current.send(JSON.stringify({ type: 'audio', data: { audioData: base64 } }));

                sendCount++;
                if (sendCount === 1 || sendCount % 100 === 0) {
                    const currentSampleRate = audioContext?.sampleRate || SILERO_SAMPLE_RATE;
                    console.log(
                        `[VoiceSession] Voz humana 16kHz enviada al servidor (frame #${sendCount}, ${base64.length} chars, inRate: ${currentSampleRate}, vad: ${sileroVad.isReady ? 'silero-v5' : 'fallback'})`
                    );
                }
            };

            const processFrame16k = (frame512: Float32Array, speechProb: number | null) => {
                if (captureGeneration !== captureGenerationRef.current) return;
                if (
                    statusRef.current !== 'listening' &&
                    statusRef.current !== 'ready' &&
                    statusRef.current !== 'speaking'
                ) {
                    return;
                }
                if (isHardwareMutedRef.current) return;
                if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

                const frameDurationMs = (frame512.length / SILERO_SAMPLE_RATE) * 1000; // 32ms exactos
                const maxPreRollChunks = Math.max(8, Math.ceil(320 / frameDurationMs)); // 320ms pre-roll (10 frames)
                const useSilero = speechProb !== null && Number.isFinite(speechProb);
                const prob = useSilero ? speechProb : 0;

                // Energía RMS del frame 16kHz (usada para rechazar eco lejano en barge-in, pico vocal y fallback)
                let sumSquare = 0;
                for (let k = 0; k < frame512.length; k++) {
                    const sample = frame512[k];
                    sumSquare += sample * sample;
                }
                const rms = Math.sqrt(sumSquare / frame512.length);
                const now = Date.now();

                // ── 1. Barge-In natural y responsivo mientras Tenshi habla ──
                if (isPlayingAudioRef.current || isAutoMutedRef.current) {
                    const maxBargeInPreRoll = Math.max(10, Math.ceil(384 / frameDurationMs));
                    const isBargeInFrame = useSilero
                        ? (prob >= 0.68 && rms >= 0.022)
                        : (rms >= Math.max(0.035, noiseFloorRef.current * 2.8));
                    const requiredBargeInMs = useSilero ? 220 : 240;

                    if (isBargeInFrame) {
                        bargeInDurationMsRef.current += frameDurationMs;
                    } else {
                        bargeInDurationMsRef.current = Math.max(0, bargeInDurationMsRef.current - frameDurationMs * 1.5);
                    }

                    if (bargeInDurationMsRef.current < requiredBargeInMs) {
                        preRollChunksRef.current.push(new Float32Array(frame512));
                        if (preRollChunksRef.current.length > maxBargeInPreRoll) {
                            preRollChunksRef.current.shift();
                        }
                        return;
                    }

                    // 🗣️ Barge-In confirmado: callar a Tenshi y abrir canal inmediatamente con pre-roll completo
                    console.log(
                        `[VoiceSession] 🗣️ Barge-in confirmado (${Math.round(bargeInDurationMsRef.current)}ms, ` +
                        `${useSilero ? `Silero prob=${prob.toFixed(2)}, ` : ''}RMS=${rms.toFixed(4)}) → deteniendo voz de Tenshi`
                    );
                    const confirmedMs = bargeInDurationMsRef.current;
                    bargeInDurationMsRef.current = 0;
                    serverFinishedRef.current = true;
                    isPlayingAudioRef.current = false;
                    isAutoMutedRef.current = false;
                    bargeInIgnoreAudioUntilRef.current = now + 280;
                    if (autoMuteTimeoutRef.current) {
                        clearTimeout(autoMuteTimeoutRef.current);
                        autoMuteTimeoutRef.current = null;
                    }
                    statusRef.current = 'listening';
                    setStatus('listening');
                    // Pre-confirmar onset para que la frase de interrupción entre sin demora
                    onsetSpeechMsRef.current = Math.max(128, confirmedMs);
                    activeSpeechDurationMsRef.current = Math.max(128, confirmedMs);
                    lastVoiceTimeRef.current = now;
                    silenceDurationMsRef.current = 0;
                    try {
                        wsRef.current.send(JSON.stringify({ type: 'barge_in' }));
                    } catch (_) {}
                    optionsRef.current.onStatusChange?.('interrupted');
                } else {
                    bargeInDurationMsRef.current = 0;
                }

                // ── 2. Piso de ruido adaptativo calibrado (TOPE ESTRICTO <= 0.016, jamás 0.032) ──
                if (rms < noiseFloorRef.current) {
                    noiseFloorRef.current = noiseFloorRef.current * 0.88 + rms * 0.12;
                } else if (!isTransmittingSpeechRef.current && (useSilero ? prob < 0.20 : rms < 0.024)) {
                    noiseFloorRef.current = noiseFloorRef.current * 0.96 + rms * 0.04;
                } else if (!useSilero) {
                    noiseFloorRef.current = noiseFloorRef.current * 0.998 + rms * 0.002;
                }
                noiseFloorRef.current = Math.min(0.016, Math.max(0.003, noiseFloorRef.current));

                // ── 3. Detección híbrida estilo Gemini Live (Silero neuronal v5 + fallback calibrado) ──
                const openThreshold = Math.max(0.012, noiseFloorRef.current * 1.85);
                const holdThreshold = Math.max(0.008, noiseFloorRef.current * 1.35);
                const continuousSpeechMs = isTransmittingSpeechRef.current && speechStartTimeRef.current
                    ? (now - speechStartTimeRef.current)
                    : 0;

                if (!useSilero && isTransmittingSpeechRef.current) {
                    if (!recentWindowStartAtRef.current || now - recentWindowStartAtRef.current > 2500) {
                        recentWindowStartAtRef.current = now;
                        recentWindowPeakRmsRef.current = rms;
                    } else if (rms > recentWindowPeakRmsRef.current) {
                        recentWindowPeakRmsRef.current = rms;
                    }
                }

                // Protección contra ruido plano SOLO en fallback (Silero neuronal ya rechaza ventiladores/AC/teclado)
                const isSteadyBackgroundNoise =
                    !useSilero &&
                    isTransmittingSpeechRef.current &&
                    continuousSpeechMs > 6000 &&
                    rms < 0.025 &&
                    recentWindowPeakRmsRef.current < 0.028;

                if (isSteadyBackgroundNoise) {
                    noiseFloorRef.current = Math.min(0.016, Math.max(noiseFloorRef.current, rms * 1.05));
                }

                // Compuerta cerrada: evaluar apertura de voz
                if (!isTransmittingSpeechRef.current) {
                    const requiredOnsetMs = useSilero ? 64 : 96; // Silero: 2 frames (64ms); Fallback: 3 frames (96ms)
                    const isClearVocalPeak = useSilero && rms >= 0.045 && prob >= 0.30;
                    const isOpenFrame = useSilero ? (prob >= 0.48 || isClearVocalPeak) : (rms >= openThreshold);

                    if (isClearVocalPeak) {
                        // Pico vocal claro confirmado con probabilidad neuronal: abrir sin espera extra
                        onsetSpeechMsRef.current = Math.max(onsetSpeechMsRef.current + frameDurationMs, requiredOnsetMs);
                        lastVoiceTimeRef.current = now;
                    } else if (isOpenFrame) {
                        onsetSpeechMsRef.current += frameDurationMs;
                        lastVoiceTimeRef.current = now;
                    } else {
                        onsetSpeechMsRef.current = Math.max(0, onsetSpeechMsRef.current - frameDurationMs * 1.5);
                    }

                    if (onsetSpeechMsRef.current < requiredOnsetMs) {
                        preRollChunksRef.current.push(new Float32Array(frame512));
                        if (preRollChunksRef.current.length > maxPreRollChunks) {
                            preRollChunksRef.current.shift();
                        }
                        return;
                    }

                    // Compuerta abierta: voz humana confirmada → vaciar pre-roll de 320ms + frame actual
                    isTransmittingSpeechRef.current = true;
                    speechStartTimeRef.current = now - onsetSpeechMsRef.current;
                    activeSpeechDurationMsRef.current = onsetSpeechMsRef.current;
                    lastVoiceTimeRef.current = now;
                    silenceDurationMsRef.current = 0;
                    recentWindowStartAtRef.current = now;
                    recentWindowPeakRmsRef.current = rms;

                    if (preRollChunksRef.current.length > 0) {
                        const flushed = [...preRollChunksRef.current];
                        preRollChunksRef.current = [];
                        for (const pastFrame of flushed) {
                            encodeAndSend16k(pastFrame);
                        }
                    }
                    encodeAndSend16k(frame512);
                    return;
                }

                // Compuerta abierta: mantener voz con histéresis suave (prob >= 0.30 en Silero, holdThreshold en fallback)
                const isSpeechNow = useSilero
                    ? (prob >= 0.30)
                    : (!isSteadyBackgroundNoise && rms >= holdThreshold);

                if (isSpeechNow) {
                    lastVoiceTimeRef.current = now;
                    silenceDurationMsRef.current = 0;
                    activeSpeechDurationMsRef.current += frameDurationMs;
                    if (preRollChunksRef.current.length > 0) {
                        preRollChunksRef.current = [];
                    }
                } else {
                    silenceDurationMsRef.current += frameDurationMs;
                }

                // Cierre rápido estilo Gemini Live:
                // - Cola natural de 380ms (conserva pausas breves entre palabras y consonantes finales)
                // - Ventana de silencio digital limpio de 220ms (380ms–600ms) enviando ceros PCM (coincide con silenceDurationMs: 500 de Google)
                const timeSinceLastVoice = Math.max(
                    silenceDurationMsRef.current,
                    lastVoiceTimeRef.current ? (now - lastVoiceTimeRef.current) : 0
                );
                const isInNaturalTail = !isSteadyBackgroundNoise && timeSinceLastVoice < 380;
                const isInSilenceFlushWindow = !isSteadyBackgroundNoise && timeSinceLastVoice >= 380 && timeSinceLastVoice < 600;
                const shouldTransmitAudio = isSpeechNow || isInNaturalTail;

                if (!shouldTransmitAudio) {
                    preRollChunksRef.current.push(new Float32Array(frame512));
                    if (preRollChunksRef.current.length > maxPreRollChunks) {
                        preRollChunksRef.current.shift();
                    }

                    // Ventana de cierre (380ms – 600ms): enviar ceros PCM puros para disparar VAD de Google al instante
                    if (isInSilenceFlushWindow) {
                        encodeAndSend16k(new Float32Array(frame512.length));
                        return;
                    }

                    const speechDurationMs = Math.round(activeSpeechDurationMsRef.current);
                    const hadRealSpeech = !isSteadyBackgroundNoise && activeSpeechDurationMsRef.current >= 160;
                    isTransmittingSpeechRef.current = false;
                    speechStartTimeRef.current = 0;
                    activeSpeechDurationMsRef.current = 0;
                    onsetSpeechMsRef.current = 0;
                    silenceDurationMsRef.current = 0;
                    recentWindowPeakRmsRef.current = 0;
                    recentWindowStartAtRef.current = 0;
                    bargeInIgnoreAudioUntilRef.current = 0;
                    if (hadRealSpeech) {
                        try {
                            wsRef.current.send(JSON.stringify({ type: 'speech_end' }));
                            console.log(
                                `[VoiceSession] Fin de voz detectado (${speechDurationMs}ms, ${useSilero ? 'Silero-v5' : 'Fallback'}) → speech_end enviado`
                            );
                        } catch (e) {
                            console.warn('[VoiceSession] No se pudo enviar speech_end:', e);
                        }
                    } else if (isSteadyBackgroundNoise) {
                        console.log(`[VoiceSession] Ruido ambiente constante detectado → compuerta cerrada (noiseFloor=${noiseFloorRef.current.toFixed(4)})`);
                    }
                    return;
                }

                encodeAndSend16k(frame512);
            };

            const drainFrameQueue = async () => {
                if (isDrainingFrames) return;
                isDrainingFrames = true;
                try {
                    while (queuedFrames16k.length > 0) {
                        if (captureGeneration !== captureGenerationRef.current) {
                            queuedFrames16k.length = 0;
                            break;
                        }
                        const frame512 = queuedFrames16k.shift()!;
                        let speechProb: number | null = null;
                        if (sileroVad.isReady) {
                            speechProb = await sileroVad.processChunk16k(frame512);
                            if (captureGeneration !== captureGenerationRef.current) {
                                queuedFrames16k.length = 0;
                                break;
                            }
                            if (speechProb === null && sileroVad.isReady) {
                                speechProb = sileroVad.lastSpeechProb;
                            }
                        }
                        processFrame16k(frame512, speechProb);
                    }
                } finally {
                    isDrainingFrames = false;
                }
            };

            const sendPCMChunk = (float32Array: Float32Array) => {
                if (captureGeneration !== captureGenerationRef.current) return;
                // Permitir ejecución en 'listening', 'ready' y también en 'speaking' para detectar interrupción natural (Barge-In)
                if (
                    statusRef.current !== 'listening' &&
                    statusRef.current !== 'ready' &&
                    statusRef.current !== 'speaking'
                ) {
                    frame16kPending = new Float32Array(0);
                    return;
                }
                // Grace period: descartar primeros 200ms de captura para abrir el canal de audio con silencio limpio sin pops
                if (listeningStartTimeRef.current && (Date.now() - listeningStartTimeRef.current < 200)) return;
                // Si el usuario silenció manualmente su micrófono (Mute físico/botón), no procesar ni interrumpir
                if (isHardwareMutedRef.current) {
                    isTransmittingSpeechRef.current = false;
                    bargeInDurationMsRef.current = 0;
                    onsetSpeechMsRef.current = 0;
                    activeSpeechDurationMsRef.current = 0;
                    silenceDurationMsRef.current = 0;
                    frame16kPending = new Float32Array(0);
                    queuedFrames16k.length = 0;
                    return;
                }
                if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

                // Re-muestrear a 16kHz una sola vez y segmentar en frames exactos de 512 muestras (32ms)
                const pcm16k = resampleTo16k(float32Array);
                if (pcm16k.length === 0) return;

                let combined: Float32Array;
                if (frame16kPending.length === 0) {
                    combined = pcm16k;
                } else {
                    combined = new Float32Array(frame16kPending.length + pcm16k.length);
                    combined.set(frame16kPending, 0);
                    combined.set(pcm16k, frame16kPending.length);
                }

                let offset = 0;
                while (offset + SILERO_FRAME_SAMPLES <= combined.length) {
                    const frame512 = combined.slice(offset, offset + SILERO_FRAME_SAMPLES);
                    offset += SILERO_FRAME_SAMPLES;

                    if (sileroVad.isReady || isDrainingFrames) {
                        if (queuedFrames16k.length >= 12) {
                            queuedFrames16k.shift();
                        }
                        queuedFrames16k.push(frame512);
                    } else {
                        processFrame16k(frame512, null);
                    }
                }
                frame16kPending = offset < combined.length ? combined.slice(offset) : new Float32Array(0);

                if (queuedFrames16k.length > 0 && !isDrainingFrames) {
                    void drainFrameQueue();
                }
            };

            // 4. Crear grafo de audio con filtrado de banda de voz (85Hz - 7000Hz)
            const source = audioContext.createMediaStreamSource(stream);
            let audioInputNode: AudioNode = source;

            // Filtro paso alto a 85Hz: elimina ruidos mecánicos sub-acústicos, golpes de mesa, vibraciones y zumbido de ventiladores/AC
            try {
                const highPassFilter = audioContext.createBiquadFilter();
                highPassFilter.type = 'highpass';
                highPassFilter.frequency.value = 85;
                highPassFilter.Q.value = 0.707;
                source.connect(highPassFilter);
                audioInputNode = highPassFilter;
            } catch (hpErr) {
                console.warn('[VoiceSession] No se pudo crear HighPassFilter, usando source directo:', hpErr);
            }

            // Filtro paso bajo a 7000Hz: elimina siseos, estática de alta frecuencia y aliasing
            try {
                const lowPassFilter = audioContext.createBiquadFilter();
                lowPassFilter.type = 'lowpass';
                lowPassFilter.frequency.value = 7000;
                lowPassFilter.Q.value = 0.707;
                audioInputNode.connect(lowPassFilter);
                audioInputNode = lowPassFilter;
            } catch (lpErr) {
                console.warn('[VoiceSession] No se pudo crear LowPassFilter:', lpErr);
            }

            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            inputAnalyserRef.current = analyser;
            audioInputNode.connect(analyser);

            let useWorklet = false;
            if (audioContext.audioWorklet) {
                try {
                    if (!workletAlreadyLoaded) {
                        const workletCode = `
                            class PCMProcessorFast extends AudioWorkletProcessor {
                                constructor() {
                                    super();
                                    this.bufferSize = 1024;
                                    this.buffer = new Float32Array(this.bufferSize);
                                    this.bufferIndex = 0;
                                }
                                process(inputs) {
                                    const input = inputs[0];
                                    if (!input || !input[0]) return true;
                                    const inputChannel = input[0];
                                    for (let i = 0; i < inputChannel.length; i++) {
                                        this.buffer[this.bufferIndex++] = inputChannel[i];
                                        if (this.bufferIndex >= this.bufferSize) {
                                            this.port.postMessage(this.buffer.slice(0));
                                            this.bufferIndex = 0;
                                        }
                                    }
                                    return true;
                                }
                            }
                            registerProcessor('pcm-processor-fast', PCMProcessorFast);
                        `;
                        const blob = new Blob([workletCode], { type: 'application/javascript' });
                        const workletUrl = URL.createObjectURL(blob);
                        await audioContext.audioWorklet.addModule(workletUrl);
                        URL.revokeObjectURL(workletUrl);
                        (window as any).sharedAudioWorkletFastLoaded = true;
                        console.log('[VoiceSession] AudioWorklet low-latency (1024) cargado exitosamente');
                    } else {
                        console.log('[VoiceSession] Reutilizando AudioWorklet low-latency ya cargado');
                    }

                    const workletNode = new AudioWorkletNode(audioContext, 'pcm-processor-fast');
                    workletNode.port.onmessage = (event) => {
                        sendPCMChunk(new Float32Array(event.data));
                    };
                    analyser.connect(workletNode);
                    // Keep worklet alive silently
                    const gainNode = audioContext.createGain();
                    gainNode.gain.value = 0;
                    workletNode.connect(gainNode);
                    gainNode.connect(audioContext.destination);
                    workletNodeRef.current = workletNode;
                    useWorklet = true;
                    console.log('[VoiceSession] Usando AudioWorklet para captura');
                } catch (workletError) {
                    console.warn('[VoiceSession] AudioWorklet falló, usando ScriptProcessor como fallback:', workletError);
                }
            }

            if (!useWorklet) {
                // Fallback: ScriptProcessorNode (funciona en todos los browsers incluyendo Safari)
                console.log('[VoiceSession] Usando ScriptProcessorNode (fallback 1024)');
                const bufferSize = 1024;
                const scriptProcessor = audioContext.createScriptProcessor(bufferSize, 1, 1);
                scriptProcessor.onaudioprocess = (event) => {
                    const inputData = event.inputBuffer.getChannelData(0);
                    sendPCMChunk(new Float32Array(inputData));
                };
                analyser.connect(scriptProcessor);
                // Silenciar salida para evitar cualquier retorno o eco de micrófono a bocinas
                const silentGain = audioContext.createGain();
                silentGain.gain.value = 0;
                scriptProcessor.connect(silentGain);
                silentGain.connect(audioContext.destination);
                // Guardar en workletNodeRef para poder desconectarlo después
                (workletNodeRef as any).current = scriptProcessor;
            }

            // Audio capture successfully setup and awaiting server listening state
            console.log('[VoiceSession] Audio capture listo y precalentado, a la espera del estado listening del backend');

        } catch (error: any) {
            console.error('[VoiceSession] Error starting audio capture:', error);
            let errorMessage = 'Failed to access microphone';
            if (error.name === 'NotAllowedError') errorMessage = 'Microphone permission denied';
            if (error.name === 'NotFoundError') errorMessage = 'No microphone found';
            if (error.name === 'NotReadableError') errorMessage = 'Microphone is busy';
            if (error.name === 'OverconstrainedError') errorMessage = 'Microphone constraints not satisfied';

            options.onError?.(`${errorMessage}: ${error.message}`);
        } finally {
            isStartingAudioRef.current = false;
        }
    };

    /**
     * Get current input volume (0-1)
     */
    const getInputVolume = useCallback(() => {
        if (!inputAnalyserRef.current) return 0;
        const dataArray = new Uint8Array(inputAnalyserRef.current.frequencyBinCount);
        inputAnalyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        return Math.min(1, (average / 128));
    }, []);

    /**
     * Send Interrupt message to stop AI response
     */
    const sendInterrupt = useCallback(() => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
        wsRef.current.send(JSON.stringify({
            type: 'interrupt',
            data: {}
        }));
    }, []);

    /**
     * Stop Audio Capture
     */
    const stopAudioCapture = () => {
        captureGenerationRef.current += 1;
        isStartingAudioRef.current = false;
        listeningStartTimeRef.current = 0;
        lastVoiceTimeRef.current = 0;
        silenceDurationMsRef.current = 0;
        preRollChunksRef.current = [];
        isTransmittingSpeechRef.current = false;
        noiseFloorRef.current = 0.005;
        activeSpeechDurationMsRef.current = 0;
        onsetSpeechMsRef.current = 0;
        bargeInDurationMsRef.current = 0;
        recentWindowPeakRmsRef.current = 0;
        recentWindowStartAtRef.current = 0;
        if (sileroVadRef.current) {
            sileroVadRef.current.reset();
        }
        // Detener tracks del micrófono
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        // Desconectar el nodo worklet
        if (workletNodeRef.current) {
            try {
                if ('port' in workletNodeRef.current && workletNodeRef.current.port) {
                    workletNodeRef.current.port.onmessage = null;
                }
            } catch (_) {}
            workletNodeRef.current.disconnect();
            workletNodeRef.current = null;
        }
        // FIX 3: NO cerrar el AudioContext — solo suspenderlo
        // Cerrarlo destruye el módulo AudioWorklet registrado y obliga a recargarlo
        // en la siguiente llamada, lo que puede fallar o crear race conditions
        if (audioContextRef.current && audioContextRef.current.state === 'running') {
            audioContextRef.current.suspend().catch(console.error);
        }
        // NO borrar sharedAudioContext16k para permitir reutilización
        inputAnalyserRef.current = null;
    };

    /**
     * Send Video Frame with optional canvas overlay and telemetry
     */
    const sendVideoFrame = useCallback((videoElement: HTMLVideoElement, telemetry?: string, overlayCanvas?: HTMLCanvasElement | null) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

        if (!videoCanvasRef.current) {
            videoCanvasRef.current = document.createElement('canvas');
        }

        const canvas = videoCanvasRef.current;
        const context = canvas.getContext('2d');
        if (!context) return;

        const width = 480;
        const height = 360;

        if (canvas.width !== width) canvas.width = width;
        if (canvas.height !== height) canvas.height = height;

        context.drawImage(videoElement, 0, 0, width, height);

        // Composite MediaPipe skeleton overlay if provided
        if (overlayCanvas && overlayCanvas.width > 0 && overlayCanvas.height > 0) {
            context.drawImage(overlayCanvas, 0, 0, width, height);
        }

        const base64 = canvas.toDataURL('image/jpeg', 0.75).split(',')[1];

        wsRef.current.send(JSON.stringify({
            type: 'video',
            data: { 
                image: base64,
                ...(telemetry ? { telemetry } : {})
            }
        }));

    }, []);

    /**
     * Send live Video Clip (MediaRecorder segment) over WebSocket
     */
    const sendVideoClip = useCallback((base64Video: string, mimeType = 'video/webm', telemetry?: string) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
        wsRef.current.send(JSON.stringify({
            type: 'video-clip',
            data: {
                video: base64Video,
                mimeType,
                ...(telemetry ? { telemetry } : {}),
            },
        }));
    }, []);

    /**
     * Connect to voice WebSocket
     */
    const connect = useCallback(async () => {
        if (isConnected || isConnecting) return;

        setIsConnecting(true);
        setStatus('connecting');
        optionsRef.current.onStatusChange?.('connecting');

        // Pre-warm audio capture immediately during user gesture to avoid Safari/iOS delays
        if (!disableAudio && !streamRef.current) {
            startAudioCapture().catch((err) => {
                console.warn('[VoiceSession] Pre-warm audio capture failed, will retry on open:', err);
            });
        }

        try {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const host = window.location.host;
            let wsUrl = `${protocol}//${host}/ws/voice?token=${encodeURIComponent(token || '')}&conversationId=${encodeURIComponent(conversationId || '')}&mode=${encodeURIComponent(options.mode || 'chat')}`;

            if (options.initialVoice) {
                wsUrl += `&initialVoice=${encodeURIComponent(options.initialVoice)}`;
            }
            if (options.model) {
                wsUrl += `&model=${encodeURIComponent(options.model)}`;
            }
            if (options.endpoint) {
                wsUrl += `&endpoint=${encodeURIComponent(options.endpoint)}`;
            }
            if (options.template) {
                wsUrl += `&template=${encodeURIComponent(options.template)}`;
            }
            if (options.agentId) {
                wsUrl += `&agentId=${encodeURIComponent(options.agentId)}`;
            }
            if (options.mode === 'tenshi_voice') {
                try {
                    const localTenshiKey = typeof window !== 'undefined' ? localStorage.getItem('librechat_user_key_tenshi_google') || '' : '';
                    if (localTenshiKey) {
                        wsUrl += `&tenshiKey=${encodeURIComponent(localTenshiKey)}`;
                    }
                } catch (e) {}
            }
            if (options.companyId) {
                wsUrl += `&companyId=${encodeURIComponent(options.companyId)}`;
            }
            if (options.workerName) {
                wsUrl += `&workerName=${encodeURIComponent(options.workerName)}`;
            }
            if (options.workerId) {
                wsUrl += `&workerId=${encodeURIComponent(options.workerId)}`;
            }
            if (options.cargo) {
                wsUrl += `&cargo=${encodeURIComponent(options.cargo)}`;
            }
            if (options.actividad) {
                wsUrl += `&actividad=${encodeURIComponent(options.actividad)}`;
            }
            const effectiveRoute =
                optionsRef.current.route ||
                options.route ||
                (typeof window !== 'undefined' ? `${window.location.pathname}${window.location.search}` : '');
            if (effectiveRoute) {
                wsUrl += `&route=${encodeURIComponent(effectiveRoute)}`;
            }
            const effectiveHeroMode =
                typeof optionsRef.current.isHeroMode === 'boolean'
                    ? optionsRef.current.isHeroMode
                    : typeof options.isHeroMode === 'boolean'
                    ? options.isHeroMode
                    : typeof document !== 'undefined' && document.documentElement.dataset.tenshiHero === 'true';
            wsUrl += `&isHeroMode=${effectiveHeroMode ? 'true' : 'false'}`;
            if (options.agentName) {
                wsUrl += `&agentName=${encodeURIComponent(options.agentName)}`;
            }
            if (options.personality) {
                wsUrl += `&personality=${encodeURIComponent(options.personality)}`;
            }

            console.log('[VoiceSession] Connecting to:', wsUrl);
            const ws = new WebSocket(wsUrl);
            wsRef.current = ws;

            ws.onopen = async () => {
                console.log('[VoiceSession] WebSocket conectado, esperando confirmación listening del backend...');
                setIsConnected(true);
                setIsConnecting(false);
                statusRef.current = 'connecting';
                setStatus('connecting');
                optionsRef.current.onStatusChange?.('connecting');

                if (!disableAudio && !streamRef.current) {
                    await startAudioCapture();
                }
            };

            ws.onmessage = (event) => {
                try {
                    const message: VoiceMessage = JSON.parse(event.data);
                    handleMessage(message);
                } catch (error) {
                    console.error('[VoiceSession] Error parsing message:', error);
                }
            };

            ws.onerror = (error) => {
                console.error('[VoiceSession] WebSocket error:', error);
                options.onError?.('WebSocket connection error');
                setStatus('idle');
                optionsRef.current.onStatusChange?.('idle');
            };

            ws.onclose = (event) => {
                console.log('[VoiceSession] WebSocket closed:', event.code, event.reason);
                setIsConnected(false);
                setIsConnecting(false);
                listeningStartTimeRef.current = 0;
                setStatus('idle');
                optionsRef.current.onStatusChange?.('idle');
                stopAudioCapture();
                wsRef.current = null;
            };

        } catch (error) {
            console.error('[VoiceSession] Connection error:', error);
            setIsConnecting(false);
            setStatus('idle');
            options.onError?.('Failed to connect');
        }
    }, [isConnected, isConnecting, token, conversationId, disableAudio, options]);

    /**
     * Handle incoming messages from WebSocket
     */
    const handleMessage = useCallback(async (message: VoiceMessage) => {
        switch (message.type) {
            case 'audio':
                if (message.data.audioData) {
                    // Descartar únicamente paquetes en tránsito durante los primeros 280ms tras un barge-in
                    if (bargeInIgnoreAudioUntilRef.current && Date.now() < bargeInIgnoreAudioUntilRef.current) {
                        break;
                    }
                    isTransmittingSpeechRef.current = false;
                    activeSpeechDurationMsRef.current = 0;
                    onsetSpeechMsRef.current = 0;
                    silenceDurationMsRef.current = 0;
                    recentWindowPeakRmsRef.current = 0;
                    recentWindowStartAtRef.current = 0;
                    statusRef.current = 'speaking';
                    setStatus('speaking');
                    isAutoMutedRef.current = true;
                    serverFinishedRef.current = false;
                    optionsRef.current.onAudioReceived?.(message.data.audioData);

                    if (autoMuteTimeoutRef.current) {
                        clearTimeout(autoMuteTimeoutRef.current);
                    }
                    // Timeout de seguridad prolongado (8s) SOLO como salvaguarda si el cliente externo no llama a setIsPlayingAudio(false)
                    autoMuteTimeoutRef.current = setTimeout(() => {
                        if (!isPlayingAudioRef.current) {
                            console.log('[VoiceSession] Safety auto-unmute timeout (8s)');
                            isAutoMutedRef.current = false;
                            statusRef.current = 'listening';
                            setStatus('listening');
                            optionsRef.current.onStatusChange?.('listening');
                            autoMuteTimeoutRef.current = null;
                        }
                    }, 8000);
                }
                break;

            case 'text':
                if (message.data.text) {
                    if (message.data.isUserTranscription) {
                        bargeInIgnoreAudioUntilRef.current = 0;
                    }
                    optionsRef.current.onTextReceived?.(
                        message.data.text,
                        message.data.isUserTranscription ?? false,
                        Boolean(message.data.replaceLastUserBubble)
                    );
                }
                break;

            case 'report':
                if (message.data.html) {
                    console.log('[VoiceSession] Report received', message.data.conversationId ? `for conversation: ${message.data.conversationId}` : '');
                    optionsRef.current.onReportReceived?.(
                        message.data.html,
                        message.data.messageId,
                        message.data.evaluatedFrames,
                        message.data.conversationId,
                        message.data.isNewReport
                    );
                    
                    // Unfreeze state and microphone cleanly
                    isAutoMutedRef.current = false;
                    isPlayingAudioRef.current = false;
                    serverFinishedRef.current = true;
                    statusRef.current = 'listening';
                    setStatus('listening');
                    optionsRef.current.onStatusChange?.('listening');
                }
                break;


            case 'wappy_action':
                if (message.data) {
                    console.log('[VoiceSession] wappy_action received:', message.data);
                    optionsRef.current.onWappyAction?.(message.data);
                }
                break;

            case 'status': {
                const newStatus = message.data.status;
                if (newStatus === 'history_synced') {
                    // Señal de sincronización de historial en BD: notificar sin sobrescribir statusRef (preserva captura de micrófono)
                    optionsRef.current.onStatusChange?.(newStatus, message.data?.message);
                    break;
                }
                if (newStatus === 'generation_complete') {
                    // Fin real de generación del modelo (llega mucho antes que turn_complete en gemini-3.1-flash-live-preview):
                    // marcar serverFinishedRef = true y liberar el micrófono sin propagar textos raros a la UI.
                    serverFinishedRef.current = true;
                    if (!isPlayingAudioRef.current) {
                        isAutoMutedRef.current = false;
                        if (autoMuteTimeoutRef.current) {
                            clearTimeout(autoMuteTimeoutRef.current);
                            autoMuteTimeoutRef.current = null;
                        }
                        if (
                            (statusRef.current as string) !== 'loading' &&
                            (statusRef.current as string) !== 'generating_report' &&
                            statusRef.current !== 'idle'
                        ) {
                            statusRef.current = 'listening';
                            setStatus('listening');
                            optionsRef.current.onStatusChange?.('listening');
                        }
                    }
                    break;
                }
                if (newStatus === 'turn_complete') {
                    serverFinishedRef.current = true;
                    optionsRef.current.onStatusChange?.(newStatus, message.data?.message);
                    if (!isPlayingAudioRef.current) {
                        isAutoMutedRef.current = false;
                        statusRef.current = 'listening';
                        setStatus('listening');
                        if (autoMuteTimeoutRef.current) {
                            clearTimeout(autoMuteTimeoutRef.current);
                            autoMuteTimeoutRef.current = null;
                        }
                    }
                    break;
                }
                setStatus(newStatus);
                statusRef.current = newStatus;
                optionsRef.current.onStatusChange?.(newStatus, message.data?.message);

                if (newStatus === 'listening') {
                    if (!listeningStartTimeRef.current) {
                        listeningStartTimeRef.current = Date.now();
                    }
                    serverFinishedRef.current = true;
                    if (!isPlayingAudioRef.current) {
                        isAutoMutedRef.current = false;
                        statusRef.current = 'listening';
                        setStatus('listening');
                        if (autoMuteTimeoutRef.current) {
                            clearTimeout(autoMuteTimeoutRef.current);
                            autoMuteTimeoutRef.current = null;
                        }
                    }
                }
                break;
            }

            case 'interrupted':
                setStatus('listening');
                optionsRef.current.onStatusChange?.('interrupted');
                console.log('[VoiceSession] AI interrupted event from server');
                serverFinishedRef.current = true;
                isPlayingAudioRef.current = false;
                isAutoMutedRef.current = false;
                if (autoMuteTimeoutRef.current) {
                    clearTimeout(autoMuteTimeoutRef.current);
                    autoMuteTimeoutRef.current = null;
                }
                break;

            case 'error':
                optionsRef.current.onError?.(message.data?.message);
                setStatus('idle');
                setIsConnected(false);
                stopAudioCapture();
                break;

            case 'conversationId':
                if (message.data.conversationId) {
                    optionsRef.current.onConversationIdUpdate?.(message.data.conversationId);
                }
                break;

            case 'conversationUpdated':
                console.log('[VoiceSession] Conversation updated event received from WS');
                if (optionsRef.current.onConversationUpdated) {
                    console.log('[VoiceSession] Executing onConversationUpdated callback with ID:', message.data?.conversationId);
                    optionsRef.current.onConversationUpdated(message.data?.conversationId);
                } else {
                    console.warn('[VoiceSession] No onConversationUpdated callback defined');
                }
                break;
            case 'agent_switched':
                console.log('[VoiceSession] Agent switched event received:', message.data);
                optionsRef.current.onAgentSwitched?.(message.data);
                break;

            case 'tenshi_report_delivered':
                console.log('[VoiceSession] Tenshi report delivered event received:', message.data);
                if (typeof window !== 'undefined' && message.data) {
                    window.dispatchEvent(
                        new CustomEvent('tenshi-antigravity-delivered', { detail: message.data })
                    );
                }
                break;

            case 'canvas_file_generated':
                console.log('[VoiceSession] Canvas file generated event received:', message.data);
                if (typeof window !== 'undefined' && message.data) {
                    window.dispatchEvent(
                        new CustomEvent('tenshi-canvas-file-generated', { detail: message.data })
                    );
                }
                break;

            case 'notebooklm_auth_expired':
                console.warn('[VoiceSession] 🔐 NotebookLM auth expired event received:', message.data);
                optionsRef.current.onNotebookLmAuthExpired?.(message.data);
                if (typeof window !== 'undefined') {
                    window.dispatchEvent(
                        new CustomEvent('notebooklm_auth_expired', { detail: message.data })
                    );
                    window.dispatchEvent(
                        new CustomEvent('wappy-notebooklm-auth-expired', { detail: message.data })
                    );
                    window.dispatchEvent(
                        new CustomEvent('wappy-notebooklm-updated', {
                            detail: {
                                ...(message.data || {}),
                                authExpired: true,
                                sessionExpired: true,
                                isValid: false,
                            },
                        })
                    );
                }
                break;
        }
    }, []);

    /**
     * Change voice
     */
    const changeVoice = useCallback((voice: string) => {
        if (!wsRef.current) return;
        wsRef.current.send(JSON.stringify({
            type: 'config',
            data: { voice },
        }));
    }, []);

    /**
     * Disconnect
     */
    const disconnect = useCallback(() => {
        console.log('[VoiceSession] Disconnecting and cleaning up...');

        stopAudioCapture();

        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }

        if (autoMuteTimeoutRef.current) {
            clearTimeout(autoMuteTimeoutRef.current);
            autoMuteTimeoutRef.current = null;
        }

        isHardwareMutedRef.current = false;
        isAutoMutedRef.current = false;
        isPlayingAudioRef.current = false;
        serverFinishedRef.current = false;
        inputAnalyserRef.current = null;
        videoCanvasRef.current = null;

        setIsConnected(false);
        setIsConnecting(false);
        setStatus('idle');

        console.log('[VoiceSession] Cleanup complete, ready for reconnection');
    }, []);

    // Cleanup
    useEffect(() => {
        return () => {
            stopAudioCapture();
            if (autoMuteTimeoutRef.current) {
                clearTimeout(autoMuteTimeoutRef.current);
                autoMuteTimeoutRef.current = null;
            }
            if (sileroVadRef.current) {
                sileroVadRef.current.dispose().catch(() => {});
                sileroVadRef.current = null;
            }
            if (wsRef.current) wsRef.current.close();
        };
    }, []);

    /**
     * Mute/Unmute
     */
    const setMuted = useCallback((muted: boolean, releaseHardware = false) => {
        isHardwareMutedRef.current = muted;
        if (streamRef.current) {
            streamRef.current.getAudioTracks().forEach((track) => {
                track.enabled = !muted;
            });
        }
        if (muted) {
            console.log('[VoiceSession] Mic Muted: audio tracks disabled.');
            if (isTransmittingSpeechRef.current && wsRef.current?.readyState === WebSocket.OPEN) {
                isTransmittingSpeechRef.current = false;
                try {
                    wsRef.current.send(JSON.stringify({ type: 'speech_end' }));
                } catch (_) {}
            }
        } else {
            console.log('[VoiceSession] Mic Unmuted: audio tracks enabled.');
        }

        if (releaseHardware && muted) {
            console.log('[VoiceSession] Hardware Mute: Releasing microphone to system.');
            stopAudioCapture();
        } else if (!muted) {
            if (isConnected && !streamRef.current) {
                startAudioCapture();
            }
        }
    }, [isConnected]);

    /**
     * Send Text Message
     */
    const sendTextMessage = useCallback((text: string) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
        wsRef.current.send(JSON.stringify({
            type: 'message',
            data: { text }
        }));
    }, []);

    /**
     * Send Evidence Image with structured metadata
     */
    const sendEvidenceImage = useCallback((base64: string, text?: string, metadata?: any) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
        wsRef.current.send(JSON.stringify({
            type: 'evidence-image',
            data: { image: base64, text, metadata }
        }));
    }, []);

    const setIsPlayingAudio = useCallback((isPlaying: boolean) => {
        isPlayingAudioRef.current = isPlaying;
        console.log('[VoiceSession] setIsPlayingAudio:', isPlaying, 'serverFinished:', serverFinishedRef.current);

        if (isPlaying) {
            if (autoMuteTimeoutRef.current) {
                clearTimeout(autoMuteTimeoutRef.current);
                autoMuteTimeoutRef.current = null;
            }
            return;
        }

        // Notificar de inmediato al backend que terminó la reproducción local para liberar isAiSpeaking = false al instante
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            try {
                wsRef.current.send(JSON.stringify({ type: 'playback_ended' }));
            } catch (_) {}
        }

        if (autoMuteTimeoutRef.current) {
            clearTimeout(autoMuteTimeoutRef.current);
            autoMuteTimeoutRef.current = null;
        }

        // Si el micrófono ya está desmuteado y escuchando (ej. barge-in o cierre limpio), no reprogramar transición redundante
        if (!isAutoMutedRef.current && statusRef.current === 'listening') {
            return;
        }

        const unmuteDelayMs = serverFinishedRef.current ? 120 : 700;
        if (serverFinishedRef.current) {
            console.log('[VoiceSession] Playback finished & server finished → unmuting mic in 120ms (acoustic echo drain)');
        } else {
            console.log('[VoiceSession] Playback finished awaiting generation_complete → safety unmute in 700ms');
        }

        autoMuteTimeoutRef.current = setTimeout(() => {
            autoMuteTimeoutRef.current = null;
            if (
                isPlayingAudioRef.current ||
                !wsRef.current ||
                wsRef.current.readyState !== WebSocket.OPEN ||
                statusRef.current === 'idle'
            ) {
                return;
            }
            isAutoMutedRef.current = false;
            if (
                (statusRef.current as string) !== 'loading' &&
                (statusRef.current as string) !== 'generating_report'
            ) {
                statusRef.current = 'listening';
                setStatus('listening');
                optionsRef.current.onStatusChange?.('listening');
            }
        }, unmuteDelayMs);
    }, []);

    /**
     * Send Wappy Action Result to server for toolResponse
     */
    const sendWappyActionResult = useCallback((id: string, name: string, result: string) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
        wsRef.current.send(JSON.stringify({
            type: 'wappy_action_result',
            data: { id, name, result }
        }));
    }, []);

    /**
     * Send active screen context to server (conversationId, active agent, current route, hero mode, Tenshi multi-chat & NotebookLM notebooks)
     */
    const sendScreenContext = useCallback((contextData: {
        conversationId?: string;
        tenshiConversationId?: string;
        selectedTenshiNotebooks?: Array<{
            id: string;
            title: string;
            emoji?: string;
            sources_count?: number;
            updated_at?: string;
        }>;
        agentId?: string;
        agentName?: string;
        route?: string;
        isHeroMode?: boolean;
    }) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
        wsRef.current.send(JSON.stringify({
            type: 'screen_context',
            data: contextData
        }));
    }, []);

    /**
     * Send personality mode change in hot session
     */
    const sendPersonality = useCallback((personality: string) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
        wsRef.current.send(JSON.stringify({
            type: 'set_personality',
            data: { personality }
        }));
    }, []);

    /**
     * Trigger Report Generation manually via WebSocket
     */
    const triggerReport = useCallback((): boolean => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            console.warn('[VoiceSession] Cannot trigger report via WS: socket is not open');
            return false;
        }
        console.log('[VoiceSession] Manually requesting report generation via WS');
        wsRef.current.send(JSON.stringify({
            type: 'trigger_report',
        }));
        return true;
    }, []);

    return {
        isConnected,
        isConnecting,
        status,
        connect,
        disconnect,
        sendVideoFrame,
        sendVideoClip,
        sendTextMessage,
        sendEvidenceImage,
        changeVoice,
        getInputVolume,
        setMuted,
        setIsPlayingAudio,
        sendInterrupt,
        sendWappyActionResult,
        sendScreenContext,
        sendPersonality,
        triggerReport,
    };
};

