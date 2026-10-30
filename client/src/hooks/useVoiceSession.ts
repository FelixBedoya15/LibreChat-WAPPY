import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuthContext } from '~/hooks/AuthContext';

interface VoiceMessage {
    type: 'audio' | 'text' | 'status' | 'error' | 'interrupted' | 'conversationId' | 'conversationUpdated' | 'report' | 'wappy_action' | 'agent_switched' | 'tenshi_report_delivered' | 'canvas_file_generated';
    data: any;
}

interface UseVoiceSessionOptions {
    onAudioReceived?: (audioData: string) => void;
    onTextReceived?: (text: string, isUserTranscription?: boolean, replaceLastUserBubble?: boolean) => void;
    onReportReceived?: (html: string, messageId?: string, evaluatedFrames?: string[], conversationId?: string, isNewReport?: boolean) => void;
    onWappyAction?: (action: { id: string; name: string; args: any }) => void;
    onAgentSwitched?: (data: { agentName: string; agentId: string; isBiomechanics: boolean; isFisioMode: boolean; conversationId?: string; badge?: string }) => void;
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
    const noiseFloorRef = useRef<number>(0.003);
    const activeSpeechChunksRef = useRef<number>(0);
    const bargeInFramesRef = useRef<number>(0);
    const bargeInIgnoreAudioUntilRef = useRef<number>(0);
    const lastVoiceTimeRef = useRef<number>(0);
    const speechStartTimeRef = useRef<number>(0);
    const preRollChunksRef = useRef<Float32Array[]>([]);
    // true mientras el noise gate está transmitiendo una locución; al cerrarse se emite speech_end una sola vez
    const isTransmittingSpeechRef = useRef(false);
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

            // 3. Helper: codificar y enviar PCM int16 a 16kHz al servidor via WebSocket
            let sendCount = 0;
            let resamplePhase = 0;

            const encodeAndSend = (float32Array: Float32Array) => {
                const currentSampleRate = audioContext?.sampleRate || 16000;
                let dataToEncode = float32Array;

                // Re-muestreo continuo anti-aliasing con ventana promediada (evita distorsión Nyquist de consonantes s/c/t/d/b a 44.1kHz o 48kHz)
                if (currentSampleRate !== 16000 && currentSampleRate > 0) {
                    const ratio = currentSampleRate / 16000;
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
                    dataToEncode = resampled;
                } else {
                    resamplePhase = 0;
                }

                if (dataToEncode.length === 0) return;

                // Normalización suave de presencia vocal (AGC ligero con limitador hiperbólico para micrófonos bajos)
                let chunkSumSq = 0;
                for (let j = 0; j < dataToEncode.length; j++) {
                    chunkSumSq += dataToEncode[j] * dataToEncode[j];
                }
                const chunkRms = Math.sqrt(chunkSumSq / dataToEncode.length);
                const gain = (chunkRms > 0.008 && chunkRms < 0.09)
                    ? Math.min(2.1, 0.095 / chunkRms)
                    : 1.0;

                const int16Data = new Int16Array(dataToEncode.length);
                for (let j = 0; j < dataToEncode.length; j++) {
                    const raw = dataToEncode[j] * gain;
                    const s = Math.abs(raw) > 0.85 ? Math.tanh(raw) : Math.max(-1, Math.min(1, raw));
                    int16Data[j] = s < 0 ? s * 0x8000 : s * 0x7FFF;
                }
                const bytes = new Uint8Array(int16Data.buffer);
                let binary = '';
                for (let i = 0; i < bytes.byteLength; i++) {
                    binary += String.fromCharCode(bytes[i]);
                }
                const base64 = btoa(binary);
                wsRef.current?.send(JSON.stringify({ type: 'audio', data: { audioData: base64 } }));

                sendCount++;
                if (sendCount === 1 || sendCount % 50 === 0) {
                    console.log(`[VoiceSession] Voz humana 16kHz enviada al servidor (chunk #${sendCount}, ${base64.length} chars, inRate: ${currentSampleRate})`);
                }
            };

            const sendPCMChunk = (float32Array: Float32Array) => {
                // Permitir ejecución en 'listening', 'ready' y también en 'speaking' para detectar interrupción natural (Barge-In)
                if (
                    statusRef.current !== 'listening' &&
                    statusRef.current !== 'ready' &&
                    statusRef.current !== 'speaking'
                ) {
                    return;
                }
                // Grace period: descartar primeros 200ms de captura para abrir el canal de audio con silencio limpio sin pops
                if (listeningStartTimeRef.current && (Date.now() - listeningStartTimeRef.current < 200)) return;
                // Si el usuario silenció manualmente su micrófono (Mute físico/botón), no procesar ni interrumpir
                if (isHardwareMutedRef.current) {
                    isTransmittingSpeechRef.current = false;
                    bargeInFramesRef.current = 0;
                    return;
                }
                if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

                // ── Voice Activity Detection (VAD) con Barge-In Anti-Eco y Cierre Rápido ──
                // Calcular energía RMS (Root Mean Square) del chunk de audio
                let sumSquare = 0;
                for (let k = 0; k < float32Array.length; k++) {
                    const sample = float32Array[k];
                    sumSquare += sample * sample;
                }
                const rms = Math.sqrt(sumSquare / float32Array.length);

                // Si Tenshi está hablando actualmente, evaluar Barge-In (interrupción natural por voz del usuario)
                if (isPlayingAudioRef.current || isAutoMutedRef.current) {
                    // Conservar los últimos 6 chunks (~380ms) en pre-roll para no perder la primera sílaba al interrumpir
                    preRollChunksRef.current.push(new Float32Array(float32Array));
                    if (preRollChunksRef.current.length > 6) {
                        preRollChunksRef.current.shift();
                    }

                    // Umbral anti-eco: exige voz humana clara por encima del residuo de cancelación de eco durante 3 chunks (~190ms)
                    const bargeInThreshold = Math.max(0.030, noiseFloorRef.current * 3.0);
                    if (rms >= bargeInThreshold) {
                        bargeInFramesRef.current += 1;
                    } else {
                        bargeInFramesRef.current = Math.max(0, bargeInFramesRef.current - 1);
                    }

                    if (bargeInFramesRef.current < 3) {
                        return;
                    }

                    // 🗣️ Barge-In confirmado: callar a Tenshi en 0ms y abrir el canal para la nueva frase del usuario
                    console.log('[VoiceSession] 🗣️ Barge-in detectado → deteniendo voz de Tenshi y escuchando al usuario');
                    bargeInFramesRef.current = 0;
                    serverFinishedRef.current = true;
                    isPlayingAudioRef.current = false;
                    isAutoMutedRef.current = false;
                    bargeInIgnoreAudioUntilRef.current = Date.now() + 280;
                    if (autoMuteTimeoutRef.current) {
                        clearTimeout(autoMuteTimeoutRef.current);
                        autoMuteTimeoutRef.current = null;
                    }
                    statusRef.current = 'listening';
                    setStatus('listening');
                    try {
                        wsRef.current.send(JSON.stringify({ type: 'barge_in' }));
                    } catch (_) {}
                    optionsRef.current.onStatusChange?.('interrupted');
                } else {
                    bargeInFramesRef.current = 0;
                }

                // Umbral de activación vocal ultra-sensible (no recorta consonantes suaves iniciales como "T-", "p-", "s-")
                const voiceThreshold = Math.max(0.0045, noiseFloorRef.current * 1.65);
                const now = Date.now();
                const continuousSpeechMs = isTransmittingSpeechRef.current && speechStartTimeRef.current
                    ? (now - speechStartTimeRef.current)
                    : 0;

                const isSteadyBackgroundNoise = continuousSpeechMs > 15000 && rms < voiceThreshold * 1.3;
                const isSpeechNow = rms >= voiceThreshold && !isSteadyBackgroundNoise;

                // Adaptación asimétrica del piso de ruido:
                if (rms < noiseFloorRef.current) {
                    // Baja rápido hacia el silencio real
                    noiseFloorRef.current = noiseFloorRef.current * 0.85 + rms * 0.15;
                } else if (rms < 0.016) {
                    // Energía baja o siseo residual del AGC al callar: se adapta suavemente
                    noiseFloorRef.current = noiseFloorRef.current * 0.94 + rms * 0.06;
                } else {
                    // Durante voz clara: casi fijo para NO elevar el umbral mientras el usuario habla
                    noiseFloorRef.current = noiseFloorRef.current * 0.998 + rms * 0.002;
                }
                noiseFloorRef.current = Math.min(0.011, Math.max(0.001, noiseFloorRef.current));

                if (isSpeechNow) {
                    lastVoiceTimeRef.current = now;
                    activeSpeechChunksRef.current += 1;
                    if (!isTransmittingSpeechRef.current) {
                        speechStartTimeRef.current = now;
                    }
                }

                // Cola acústica continua de 900ms para NO cortar pausas entre palabras dentro de una misma oración,
                // seguida de 450ms de silencio digital limpio para que el VAD nativo de Google cierre el turno sin recortar sílabas.
                const timeSinceLastVoice = now - lastVoiceTimeRef.current;
                const isInNaturalTail = !isSteadyBackgroundNoise && timeSinceLastVoice < 900;
                const isInSilenceFlushWindow = !isSteadyBackgroundNoise && timeSinceLastVoice >= 900 && timeSinceLastVoice < 1350;
                const shouldTransmitAudio = isSpeechNow || isInNaturalTail;

                if (!shouldTransmitAudio) {
                    // Guardar siempre los últimos 10 chunks (~420ms) en pre-roll para no cortar nunca la primera sílaba
                    preRollChunksRef.current.push(new Float32Array(float32Array));
                    if (preRollChunksRef.current.length > 10) {
                        preRollChunksRef.current.shift();
                    }

                    // Mientras estamos en la ventana de cierre (900ms - 1350ms tras hablar), enviar silencio digital limpio
                    // al VAD de Gemini Live y emitir speech_end una única vez si hubo habla real (>= 6 chunks)
                    if (isInSilenceFlushWindow && isTransmittingSpeechRef.current) {
                        encodeAndSend(new Float32Array(float32Array.length));
                        return;
                    }

                    if (isTransmittingSpeechRef.current) {
                        const hadRealSpeech = activeSpeechChunksRef.current >= 6;
                        isTransmittingSpeechRef.current = false;
                        speechStartTimeRef.current = 0;
                        activeSpeechChunksRef.current = 0;
                        bargeInIgnoreAudioUntilRef.current = 0;
                        if (hadRealSpeech) {
                            try {
                                wsRef.current.send(JSON.stringify({ type: 'speech_end' }));
                                console.log('[VoiceSession] Fin de voz detectado → speech_end enviado');
                            } catch (e) {
                                console.warn('[VoiceSession] No se pudo enviar speech_end:', e);
                            }
                        }
                    }
                    return;
                }

                if (!isTransmittingSpeechRef.current) {
                    speechStartTimeRef.current = now;
                }
                isTransmittingSpeechRef.current = true;

                // Si acabamos de detectar voz tras silencio o pausa, vaciar primero el pre-roll buffer (~240ms previos)
                if (preRollChunksRef.current.length > 0) {
                    const flushed = [...preRollChunksRef.current];
                    preRollChunksRef.current = [];
                    for (const pastChunk of flushed) {
                        encodeAndSend(pastChunk);
                    }
                }

                encodeAndSend(float32Array);
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
        isStartingAudioRef.current = false;
        listeningStartTimeRef.current = 0;
        lastVoiceTimeRef.current = 0;
        preRollChunksRef.current = [];
        isTransmittingSpeechRef.current = false;
        noiseFloorRef.current = 0.003;
        // Detener tracks del micrófono
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        // Desconectar el nodo worklet
        if (workletNodeRef.current) {
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
            if (options.route) {
                wsUrl += `&route=${encodeURIComponent(options.route)}`;
            }
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
                    activeSpeechChunksRef.current = 0;
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

            case 'status':
                const newStatus = message.data.status;
                setStatus(newStatus);
                statusRef.current = newStatus;
                optionsRef.current.onStatusChange?.(newStatus, message.data?.message);

                if (newStatus === 'listening') {
                    if (!listeningStartTimeRef.current) {
                        listeningStartTimeRef.current = Date.now();
                    }
                }

                if (newStatus === 'listening' || newStatus === 'turn_complete') {
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
        if (!isPlaying) {
            if (serverFinishedRef.current) {
                console.log('[VoiceSession] Playback finished & server turn complete - unmuting microphone immediately');
                isAutoMutedRef.current = false;
                statusRef.current = 'listening';
                setStatus('listening');
                optionsRef.current.onStatusChange?.('listening');
                if (autoMuteTimeoutRef.current) {
                    clearTimeout(autoMuteTimeoutRef.current);
                    autoMuteTimeoutRef.current = null;
                }
            } else {
                // El servidor sigue procesando el resto del turno (ej: pausa breve tras "Comprendo perfectamente.")
                // Mantener micrófono auto-muteado hasta recibir turn_complete (o máximo 3.5s) para que el ruido ambiente no corte a Tenshi
                if (autoMuteTimeoutRef.current) {
                    clearTimeout(autoMuteTimeoutRef.current);
                }
                autoMuteTimeoutRef.current = setTimeout(() => {
                    isAutoMutedRef.current = false;
                    statusRef.current = 'listening';
                    setStatus('listening');
                    optionsRef.current.onStatusChange?.('listening');
                    autoMuteTimeoutRef.current = null;
                }, 3500);
            }
        }
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
     * Send active screen context to server (conversationId, active agent, current route)
     */
    const sendScreenContext = useCallback((contextData: { conversationId?: string; agentId?: string; agentName?: string; route?: string }) => {
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

