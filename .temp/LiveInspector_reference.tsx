// Archivo decodificado del repositorio Video-Live para referencia
// Este archivo contiene la configuración funcional de Gemini Live

import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { createPcmBlob, decodeAudioData, base64ToUint8Array, blobToBase64 } from '../utils/audioUtils';
import { Video, Mic, Activity, StopCircle, PlayCircle, FileText, AlertTriangle } from 'lucide-react';

export const LiveInspector: React.FC = () => {
    const [active, setActive] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [status, setStatus] = useState<'idle' | 'connecting' | 'connected'>('idle');
    const [transcript, setTranscript] = useState<string>("");

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Refs for managing streaming state without closure staleness
    const isStreamingRef = useRef(false);

    // Audio Contexts
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const outputNodeRef = useRef<GainNode | null>(null);

    // State refs for cleanups
    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    const frameIntervalRef = useRef<number | null>(null);
    const nextStartTimeRef = useRef<number>(0);
    const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    const transcriptRef = useRef<HTMLDivElement>(null);

    // Auto-scroll transcript
    useEffect(() => {
        if (transcriptRef.current) {
            transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
        }
    }, [transcript]);

    const startSession = async () => {
        setError(null);
        setStatus('connecting');
        setTranscript("");
        isStreamingRef.current = true;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    sampleRate: 16000,
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true,
                },
                video: {
                    width: 640,
                    height: 480
                }
            });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play();
            }

            // Initialize Audio Contexts
            inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            outputNodeRef.current = outputAudioContextRef.current.createGain();
            outputNodeRef.current.connect(outputAudioContextRef.current.destination);

            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

            const sessionPromise = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                config: {
                    responseModalities: [Modality.AUDIO],
                    // Correct configuration for transcription: empty object
                    outputAudioTranscription: {},
                    systemInstruction: `Eres un experto inspector de Seguridad y Salud en el Trabajo (SST) analizando video en tiempo real.
            
            OBJETIVO PRINCIPAL:
            Identificar riesgos ergonómicos y peligros físicos en el video y proporcionar correcciones inmediatas.

            INSTRUCCIONES CLAVE:
            1. NO ESPERES A QUE TE HABLEN. Comienza a narrar y analizar lo que ves INMEDIATAMENTE tras la conexión.
            2. Si ves a una persona, analiza su postura: espalda, cuello, muñecas, levantamiento de cargas.
            3. Detecta: movimientos repetitivos, posturas forzadas, falta de EPP (casco, gafas, guantes).
            4. Si no ves riesgos, di: "Monitoreando área... Sin riesgos visibles por el momento."
            5. Sé conciso y directo.

            Habla en Español claro y profesional.`,
                    speechConfig: {
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
                    },
                },
                callbacks: {
                    onopen: () => {
                        setStatus('connected');
                        setActive(true);
                        setTranscript("Conectado. Iniciando análisis de video y audio...\n");

                        // Audio Input Processing
                        if (!inputAudioContextRef.current) return;
                        const source = inputAudioContextRef.current.createMediaStreamSource(stream);
                        const scriptProcessor = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);

                        scriptProcessor.onaudioprocess = (e) => {
                            if (!isStreamingRef.current) return; // Use Ref to check active state safely

                            const inputData = e.inputBuffer.getChannelData(0);
                            const pcmBlob = createPcmBlob(inputData);
                            sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
                        };

                        source.connect(scriptProcessor);
                        scriptProcessor.connect(inputAudioContextRef.current.destination);
                    },
                    onmessage: async (msg: LiveServerMessage) => {
                        // 1. Handle Text Transcription
                        const text = msg.server Content?.outputTranscription?.text;
                        if (text) {
                            setTranscript(prev => prev + text);
                        }
                        if (msg.serverContent?.turnComplete) {
                            setTranscript(prev => prev + "\n\n");
                        }

                        // 2. Handle Audio Output
                        const base64Audio = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                        if (base64Audio && outputAudioContextRef.current && outputNodeRef.current) {
                            const ctx = outputAudioContextRef.current;

                            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);

                            try {
                                const audioBuffer = await decodeAudioData(
                                    base64ToUint8Array(base64Audio),
                                    ctx,
                                    24000
                                );

                                const source = ctx.createBufferSource();
                                source.buffer = audioBuffer;
                                source.connect(outputNodeRef.current);

                                source.addEventListener('ended', () => {
                                    sourcesRef.current.delete(source);
                                });

                                source.start(nextStartTimeRef.current);
                                nextStartTimeRef.current += audioBuffer.duration;
                                sourcesRef.current.add(source);
                            } catch (err) {
                                console.error("Audio decode error", err);
                            }
                        }

                        // Handle Interruption
                        if (msg.serverContent?.interrupted) {
                            sourcesRef.current.forEach(src => {
                                try { src.stop(); } catch (e) { }
                            });
                            sourcesRef.current.clear();
                            nextStartTimeRef.current = 0;
                            setTranscript(prev => prev + "\n[Interrumpido]\n");
                        }
                    },
                    onclose: (e) => {
                        console.log("Session closed", e);
                        setStatus('idle');
                        setActive(false);
                        isStreamingRef.current = false;
                    },
                    onerror: (e) => {
                        console.error("Session error", e);
                        setError("Error en la conexión Live API. Revisa la consola.");
                        setStatus('idle');
                        setActive(false);
                        isStreamingRef.current = false;
                    }
                }
            });

            sessionPromiseRef.current = sessionPromise;

            // Video Frame Streaming Loop
            const interval = window.setInterval(async () => {
                if (!isStreamingRef.current) return;

                if (videoRef.current && canvasRef.current && sessionPromiseRef.current) {
                    const video = videoRef.current;
                    const canvas = canvasRef.current;
                    const ctx = canvas.getContext('2d');

                    if (ctx && video.videoWidth > 0) {
                        canvas.width = video.videoWidth * 0.5;
                        canvas.height = video.videoHeight * 0.5;
                        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                        canvas.toBlob(async (blob) => {
                            if (blob) {
                                const base64 = await blobToBase64(blob);
                                sessionPromiseRef.current?.then(session => {
                                    session.sendRealtimeInput({
                                        media: { mimeType: 'image/jpeg', data: base64 }
                                    });
                                });
                            }
                        }, 'image/jpeg', 0.6);
                    }
                }
            }, 500);

            frameIntervalRef.current = interval;

        } catch (err) {
            console.error(err);
            setError("Error al iniciar: Verifique permisos de cámara/micrófono.");
            setStatus('idle');
            setActive(false);
            isStreamingRef.current = false;
        }
    };

    const stopSession = async () => {
        isStreamingRef.current = false;
        setActive(false);
        setStatus('idle');

        if (frameIntervalRef.current) {
            clearInterval(frameIntervalRef.current);
            frameIntervalRef.current = null;
        }

        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(t => t.stop());
            videoRef.current.srcObject = null;
        }

        if (sessionPromiseRef.current) {
            try {
                const session = await sessionPromiseRef.current;
                session.close();
            } catch (e) {
                console.error("Error closing session", e);
            }
            sessionPromiseRef.current = null;
        }

        if (inputAudioContextRef.current) {
            inputAudioContextRef.current.close();
            inputAudioContextRef.current = null;
        }
        if (outputAudioContextRef.current) {
            outputAudioContextRef.current.close();
            outputAudioContextRef.current = null;
        }

        // Clear audio sources
        sourcesRef.current.forEach(src => {
            try { src.stop(); } catch (e) { }
        });
        sourcesRef.current.clear();
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopSession();
        };
    }, []);

    return (
        <div className="h-full flex flex-col items-center justify-start p-4 w-full max-w-5xl mx-auto gap-4">
            {/* UI components omitted for brevity */}
        </div>
    );
};
