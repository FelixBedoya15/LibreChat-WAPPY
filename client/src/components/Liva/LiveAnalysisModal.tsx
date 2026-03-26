import { useState, useEffect, useCallback, useRef, useMemo, type FC } from 'react';
import { useRecoilState, useSetRecoilState } from 'recoil';
import { X, Mic, MicOff, Video, VideoOff, RefreshCcw, Monitor, MonitorOff, PhoneOff, Smartphone } from 'lucide-react';
import { TooltipAnchor } from '@librechat/client';
import store from '~/store';
import VoiceOrb from '../Voice/VoiceOrb';
import VoiceSelector from '../Voice/VoiceSelector';
import { useLiveAnalysisSession } from '~/hooks/useLiveAnalysisSession';
import { useLocalize } from '~/hooks';

interface LiveAnalysisModalProps {
    isOpen: boolean;
    onClose: () => void;
    conversationId?: string;
    onConversationIdUpdate?: (newId: string) => void;
    onTextReceived?: (text: string) => void;
    onReportReceived?: (html: string) => void;
    onConversationUpdated?: () => void;
    selectedModel?: string;
}

const LiveAnalysisModal: FC<LiveAnalysisModalProps> = ({ isOpen, onClose, conversationId, onConversationIdUpdate, onTextReceived, onReportReceived, onConversationUpdated, selectedModel }) => {
    const localize = useLocalize();
    const [voiceLiveAnalysis, setVoiceLiveAnalysis] = useRecoilState(store.voiceLiveAnalysis);
    const setShowModalState = useSetRecoilState(store.showLiveAnalysisModal);
    const [selectedVoice, setSelectedVoice] = useState(voiceLiveAnalysis);
    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOn, setIsCameraOn] = useState(true);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [statusText, setStatusText] = useState('Initializing...');
    const [isReady, setIsReady] = useState(false);
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
    const [showVoiceSelector, setShowVoiceSelector] = useState(false);
    const [audioAmplitude, setAudioAmplitude] = useState(0);

    const videoRef = useRef<HTMLVideoElement | null>(null);
    const videoIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const snapshotRef = useRef<string | null>(null); // NEW: Ref to store captured image

    // NEW: Countdown state
    // UPDATED: Faster countdown for better UX
    const [countdown, setCountdown] = useState(3);

    // NEW: Track if report has been received
    const [hasReceivedReport, setHasReceivedReport] = useState(false);

    const [supportsScreenShare, setSupportsScreenShare] = useState(false);

    useEffect(() => {
        // Check if getDisplayMedia is supported
        if (navigator.mediaDevices && 'getDisplayMedia' in navigator.mediaDevices) {
            setSupportsScreenShare(true);
        }
    }, []);

    // Helper to capture video frame
    const captureSnapshot = useCallback(() => {
        if (videoRef.current) {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = videoRef.current.videoWidth;
                canvas.height = videoRef.current.videoHeight;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
                    return canvas.toDataURL('image/png');
                }
            } catch (e) {
                console.error("Error capturing snapshot:", e);
            }
        }
        return null;
    }, []);

    const sessionOptions = useMemo(() => ({
        conversationId,
        onConversationIdUpdate,
        disableAudio: false,
        initialVoice: voiceLiveAnalysis,
        selectedModel,
        onAudioReceived: (audioData: string) => {
            handleAudioReceived(audioData);
        },
        onTextReceived: (text: string) => {
            onTextReceived?.(text);
        },
        onReportReceived: (html: string) => {
            setHasReceivedReport(true); // Mark report as received

            // Construct the Final Report with Header, Date, and Image
            const dateStr = new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            const timeStr = new Date().toLocaleTimeString('es-ES');

            let finalHtml = `
                <div style="font-family: sans-serif; max-width: 100%;">
                    <h1 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">Informe de Análisis de Riesgos y Peligros</h1>
                    
                    <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px; text-align: left;">
                        <p><strong>Fecha de Emisión:</strong> ${dateStr} a las ${timeStr}</p>
                        <p><strong>Tipo de Actividad:</strong> Identificación de Riesgos en Vivo (Live Analysis)</p>
                    </div>
            `;

            if (snapshotRef.current) {
                finalHtml += `
                    <div style="margin-bottom: 25px; text-align: center;">
                        <h3 style="text-align: left; color: #7f8c8d;">1. Evidencia Visual Captada</h3>
                        <img src="${snapshotRef.current}" alt="Evidencia del Entorno" style="max-width: 100%; height: auto; border-radius: 8px; border: 1px solid #ddd; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" />
                        <p style="font-size: 0.9em; color: #7f8c8d; margin-top: 5px;">Figura 1: Captura del entorno analizado en tiempo real.</p>
                    </div>
                `;
            }

            // Append the AI generated content (ensure it starts correctly)
            finalHtml += `
                <div class="ai-report-content">
                    ${html}
                </div>
                </div>
            `;

            onReportReceived?.(finalHtml);
        },
        onStatusChange: (newStatus: string) => {
            console.log('[LiveAnalysisModal] Status:', newStatus);
            switch (newStatus) {
                case 'listening':
                    setStatusText('Escuchando...');
                    break;
                case 'speaking':
                    setStatusText('Hablando...');
                    break;
                case 'thinking':
                    setStatusText('Analizando...');
                    break;
                case 'connecting':
                    setStatusText('Conectando...');
                    break;
                case 'connected':
                    setStatusText('Conectado');
                    break;
                case 'generating_report':
                    setStatusText('Generando Reporte...');
                    break;
                case 'ready':
                    setStatusText('Listo');
                    break;
                case 'turn_complete':
                    // Only show completion if we actually got the report
                    if (hasReceivedReport) {
                        setStatusText('Análisis Completado');
                    } else {
                        setStatusText('Listo');
                    }
                    break;
                default:
                    setStatusText(newStatus);
            }
        },
        onError: (err: string) => {
            console.error('[LiveAnalysisModal] Error:', err);
            setStatusText(`Error: ${err}`);
        },
    }), [conversationId, onConversationIdUpdate, voiceLiveAnalysis, onTextReceived, onReportReceived, hasReceivedReport, selectedModel]);

    const {
        isConnected,
        isConnecting,
        status,
        connect,
        disconnect,
        sendVideoFrame,
        sendTextMessage,
        setMuted,
        changeVoice,
        getInputVolume,
    } = useLiveAnalysisSession(sessionOptions);

    // Connection Delay Logic with Countdown
    useEffect(() => {
        if (isOpen && isConnected) {
            setIsReady(false);
            setCountdown(3); 

            const interval = setInterval(() => {
                setCountdown((prev) => {
                    if (prev <= 1) return 1;
                    return prev - 1;
                });
            }, 1000);

            const timer = setTimeout(() => {
                setIsReady(true);
                clearInterval(interval);
            }, 3000); 

            return () => {
                clearTimeout(timer);
                clearInterval(interval);
            };
        } else {
            setIsReady(false);
            setCountdown(3);
        }
    }, [isOpen, isConnected]);

    // NEW: Sync visible state with Recoil for Tenshi hiding
    useEffect(() => {
        setShowModalState(isOpen);
    }, [isOpen, setShowModalState]);

    // Connect on mount if open
    useEffect(() => {
        if (!isOpen) return;

        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }

        connect();

        return () => {
            stopMediaTracks();
            disconnect();
            if (audioContextRef.current) {
                audioContextRef.current.close();
                audioContextRef.current = null;
            }
        };
    }, [isOpen]);

    // Ensure voice is updated when connected
    useEffect(() => {
        if (isOpen && isConnected && selectedVoice !== voiceLiveAnalysis) {
            console.log('[LiveAnalysisModal] Syncing voice with global setting:', voiceLiveAnalysis);
            setSelectedVoice(voiceLiveAnalysis);
            changeVoice(voiceLiveAnalysis);
        }
    }, [isOpen, isConnected, voiceLiveAnalysis, changeVoice]);

    // Auto-start camera and send initial prompt when READY (after countdown)
    useEffect(() => {
        if (isConnected && isOpen && isReady) { // Wait for isReady (countdown finished)
            // Default to camera on start
            startCamera();

            const timer = setTimeout(() => {
                console.log("[LiveAnalysisModal] Sending initial analysis prompt");

                // DATA CAPTURE
                snapshotRef.current = captureSnapshot(); // Capture image NOW
                const currentDate = new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

                sendTextMessage(`
                    Actúa como un Auditor Líder Experto en Seguridad y Salud en el Trabajo (SST/HSE) certificado.
                    
                    CONTEXTO:
                    Estás realizando una inspección técnica formal basada en la evidencia visual que estás viendo AHORA MISMO en el video.
                    Fecha del reporte: ${currentDate}.

                    TU MISIÓN:
                    Generar un INFORME TÉCNICO DETALLADO Y EXTENSO sobre los hallazgos.

                    INSTRUCCIONES DE RESPUESTA:
                    1. **AUDIO**: Háblame profesionalmente como si estuvieras dictando el resumen ejecutivo a un colega. Sé directo sobre los peligros críticos.
                    2. **TEXTO (HTML)**: Genera el cuerpo del informe. Sé MUY EXTENSO. Usa un lenguaje técnico, formal y preciso.
                    
                    ESTRUCTURA OBLIGATORIA DEL CONTENIDO HTML (No incluyas <html> ni importes CSS, solo el contenido del body):

                    <h2>2. Descripción Detallada del Procedimiento / Actividad</h2>
                    <p>[Describe exhaustivamente qué está sucediendo, el entorno, las herramientas visibles, el personal, y las condiciones ambientales. Mínimo 2 párrafos detallados].</p>

                    <h2>3. Identificación y Análisis de Hallazgos</h2>
                    <p>[Analiza condición por condición. Usa viñetas para listar observaciones específicas].</p>
                    <ul>
                        <li><strong>Observación 1:</strong> [Detalle]</li>
                        <li><strong>Observación 2:</strong> [Detalle]</li>
                    </ul>

                    <h2>4. Matriz de Valoración de Riesgos y Peligros (GTC 45 / Norma Técnica)</h2>
                    <table border="0" style="border-collapse: separate; border-spacing: 0; border-radius: 12px; overflow: hidden; border: 1px solid #ddd; width: 100%; text-align: left;">
                      <thead style="background-color: #ecf0f1;">
                        <tr>
                            <th style="padding: 8px;">Proceso / Zona</th>
                            <th style="padding: 8px;">Peligro (Descripción)</th>
                            <th style="padding: 8px;">Clasificación</th>
                            <th style="padding: 8px;">Efectos Posibles</th>
                            <th style="padding: 8px;">Nivel de Riesgo</th>
                        </tr>
                      </thead>
                      <tbody>
                        <!-- Genera al menos 3 filas si es posible -->
                        <tr>
                            <td style="padding: 8px;">[Ej: Soldadura]</td>
                            <td style="padding: 8px;">[Ej: Humos metálicos]</td>
                            <td style="padding: 8px;">[Ej: Químico]</td>
                            <td style="padding: 8px;">[Ej: Neumoconiosis]</td>
                            <td style="padding: 8px; font-weight: bold; color: red;">[Ej: Alto]</td>
                        </tr>
                      </tbody>
                    </table>

                    <h2>5. Medidas de Intervención Recomendadas (Jerarquía de Controles)</h2>
                    <p>[Propone soluciones detalladas para cada hallazgo].</p>
                    <table border="0" style="border-collapse: separate; border-spacing: 0; border-radius: 12px; overflow: hidden; border: 1px solid #ddd; width: 100%; text-align: left;">
                      <thead style="background-color: #ecf0f1;">
                        <tr>
                            <th style="padding: 8px;">Eliminación / Sustitución</th>
                            <th style="padding: 8px;">Controles de Ingeniería</th>
                            <th style="padding: 8px;">Controles Administrativos</th>
                            <th style="padding: 8px;">EPP Requeridos</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                            <td style="padding: 8px;">[Propuesta...]</td>
                            <td style="padding: 8px;">[Propuesta...]</td>
                            <td style="padding: 8px;">[Propuesta...]</td>
                            <td style="padding: 8px;">[Propuesta...]</td>
                        </tr>
                      </tbody>
                    </table>

                    <h2>6. Conclusiones y Cierre</h2>
                    <p>[Conclusión técnica final sobre la viabilidad de la operación o la urgencia de las correcciones].</p>

                    NOTA FINAL:
                    - NO uses frases genéricas como "veo una persona". Describe "trabajador operando maquinaria sin guantes de carnaza".
                    - Sé lo más extenso posible en los párrafos descriptivos.
                    - Utiliza formato HTML limpio para tablas y listas.
                `);
            }, 1000); // Short delay after ready

            return () => clearTimeout(timer);
        }
    }, [isConnected, isOpen, isReady, sendTextMessage, captureSnapshot]);

    const handleClose = () => {
        stopMediaTracks();
        disconnect();
        onClose();
    };

    const stopMediaTracks = () => {
        if (videoIntervalRef.current) {
            clearInterval(videoIntervalRef.current);
            videoIntervalRef.current = null;
        }

        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }

        setIsCameraOn(false);
        setIsScreenSharing(false);
    };

    const startCamera = async (mode: 'user' | 'environment' = facingMode) => {
        try {
            stopMediaTracks(); // Ensure clean switch

            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 320 },
                    height: { ideal: 240 },
                    frameRate: { ideal: 15 },
                    facingMode: mode
                },
                audio: false
            });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play().catch(e => console.error("Error playing video:", e));
            }

            setIsCameraOn(true);
            startSendingFrames();

        } catch (error) {
            console.error('[LiveAnalysisModal] Error starting camera:', error);
            setStatusText('Error accessing camera');
            setIsCameraOn(false);
        }
    };

    const startScreenShare = async () => {
        try {
            stopMediaTracks(); // Ensure clean switch

            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    frameRate: { ideal: 10 }
                },
                audio: false
            });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play();
            }

            // Handle user clicking "Stop Sharing" in browser UI
            stream.getVideoTracks()[0].onended = () => {
                stopMediaTracks();
            };

            setIsScreenSharing(true);
            startSendingFrames();

        } catch (error) {
            console.error('[LiveAnalysisModal] Error starting screen share:', error);
            setIsScreenSharing(false);
        }
    };

    const startSendingFrames = () => {
        if (videoIntervalRef.current) clearInterval(videoIntervalRef.current);
        videoIntervalRef.current = setInterval(() => {
            if (videoRef.current && videoRef.current.readyState >= 2) {
                sendVideoFrame(videoRef.current);
            }
        }, 500); // Keep 2 FPS for analysis
    };


    const toggleCamera = () => {
        if (isCameraOn) {
            stopMediaTracks();
        } else {
            startCamera();
        }
    };

    const toggleScreenShare = () => {
        if (isScreenSharing) {
            stopMediaTracks();
        } else {
            startScreenShare();
        }
    };

    const switchCamera = () => {
        const newMode = facingMode === 'user' ? 'environment' : 'user';
        setFacingMode(newMode);
        if (isCameraOn) {
            stopMediaTracks();
            setTimeout(() => startCamera(newMode), 200);
        }
    };

    const toggleMute = () => {
        const newMuted = !isMuted;
        setIsMuted(newMuted);
        setMuted(newMuted);
    };

    const nextStartTimeRef = useRef<number>(0);
    const outputAnalyserRef = useRef<AnalyserNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    useEffect(() => {
        const updateAmplitude = () => {
            let vol = 0;

            if (status === 'speaking' && outputAnalyserRef.current) {
                const dataArray = new Uint8Array(outputAnalyserRef.current.frequencyBinCount);
                outputAnalyserRef.current.getByteFrequencyData(dataArray);
                const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
                vol = Math.min(1, (average / 255) * 2);
            } else if (status === 'listening' || status === 'ready') {
                vol = getInputVolume();
            }

            setAudioAmplitude(vol);
            animationFrameRef.current = requestAnimationFrame(updateAmplitude);
        };

        updateAmplitude();

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [status, getInputVolume]);

    function handleAudioReceived(audioData: string) {
        try {
            if (!audioContextRef.current) return;
            if (audioContextRef.current.state === 'suspended') audioContextRef.current.resume();

            const binaryString = atob(audioData);
            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);

            const float32Data = new Float32Array(len / 2);
            const dataView = new DataView(bytes.buffer);
            for (let i = 0; i < len / 2; i++) float32Data[i] = dataView.getInt16(i * 2, true) / 32768.0;

            const audioBuffer = audioContextRef.current.createBuffer(1, float32Data.length, 24000);
            audioBuffer.getChannelData(0).set(float32Data);

            scheduleAudio(audioBuffer);
        } catch (error) {
            console.error('[LiveAnalysisModal] Error processing audio:', error);
        }
    }

    function scheduleAudio(buffer: AudioBuffer) {
        if (!audioContextRef.current) return;

        const currentTime = audioContextRef.current.currentTime;
        if (nextStartTimeRef.current < currentTime) {
            nextStartTimeRef.current = currentTime + 0.05;
        }

        const source = audioContextRef.current.createBufferSource();
        source.buffer = buffer;

        if (!outputAnalyserRef.current) {
            const analyser = audioContextRef.current.createAnalyser();
            analyser.fftSize = 256;
            outputAnalyserRef.current = analyser;
            analyser.connect(audioContextRef.current.destination);
        }

        source.connect(outputAnalyserRef.current);
        source.start(nextStartTimeRef.current);

        nextStartTimeRef.current += buffer.duration;
    }

    const handleVoiceChange = (voiceId: string) => {
        setSelectedVoice(voiceId);
        changeVoice(voiceId);
        setShowVoiceSelector(false);
    };

    const handleOrbClick = () => {
        if (status === 'ready' || status === 'idle' || status === 'listening') {
            setShowVoiceSelector(!showVoiceSelector);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-md transition-all duration-300">
            {/* Main content - Fullscreen */}
            <div className="relative w-full h-full flex flex-col overflow-hidden">

                {/* Technical Loading Overlay - Hud Style */}
                {(!isReady && isOpen) && (
                    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/95">
                        <div className="relative">
                            {/* Circular progress background */}
                            <svg className="w-64 h-64 -rotate-90 transform">
                                <circle
                                    cx="128"
                                    cy="128"
                                    r="120"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    fill="transparent"
                                    className="text-white/5"
                                />
                                <circle
                                    cx="128"
                                    cy="128"
                                    r="120"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                    fill="transparent"
                                    strokeDasharray={754}
                                    strokeDashoffset={754 - (754 * (3 - countdown) / 3)}
                                    className="text-teal-500 transition-all duration-1000 ease-linear"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-7xl font-mono font-bold text-white tracking-tighter">
                                    00:{countdown.toString().padStart(2, '0')}
                                </span>
                                <span className="text-[10px] text-teal-400 font-mono mt-2 tracking-[0.3em] uppercase opacity-80 animate-pulse">
                                    Initializing Stream
                                </span>
                            </div>
                        </div>

                        <div className="mt-12 w-64 space-y-4">
                            <div className="flex justify-between text-[10px] text-white/40 font-mono uppercase tracking-widest">
                                <span>Securing Channel</span>
                                <span>{Math.round((3 - countdown) * 33.3)}%</span>
                            </div>
                            <div className="h-0.5 w-full bg-white/10 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-teal-500 transition-all duration-1000 ease-linear"
                                    style={{ width: `${(3 - countdown) * 33.3}%` }}
                                />
                            </div>
                            <div className="grid grid-cols-1 gap-1">
                                <p className="text-[9px] text-teal-500/60 font-mono truncate animate-[pulse_2s_infinite]">
                                    {'>'} ACCESS_KEY: ENABLED
                                </p>
                                <p className="text-[9px] text-teal-500/60 font-mono truncate animate-[pulse_2.5s_infinite]">
                                    {'>'} ENCRYPTION_LAYER: 256-BIT_AES
                                </p>
                                <p className="text-[9px] text-teal-500/60 font-mono truncate animate-[pulse_3s_infinite]">
                                    {'>'} AUDIT_PROCOCOL: SST_v3.4
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* HUD Overlay - Top Elements */}
                <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-40 pointer-events-none">
                    {/* Top Left: LIVE Indicator & Metadata */}
                    <div className="flex flex-col gap-1 md:gap-3">
                        <div className="flex items-center gap-2 md:gap-3 bg-black/40 backdrop-blur-md px-2 md:px-3 py-1 md:py-1.5 rounded-lg border border-white/10 shadow-xl">
                            <div className="flex items-center gap-1.5 md:gap-2">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
                                </span>
                                <span className="text-[9px] md:text-[11px] font-bold text-white uppercase tracking-wider">LIVE STREAM</span>
                            </div>
                            <div className="w-[1px] h-3 bg-white/20"></div>
                            <div className="text-[9px] md:text-[11px] font-mono text-white/70">
                                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </div>
                        </div>

                        <div className="flex flex-col gap-0.5 md:gap-1 px-1">
                            <h2 className="text-white text-[11px] md:text-sm font-bold tracking-wide flex items-center gap-1.5 md:gap-2">
                                <span className="w-1 md:w-1.5 h-1 md:h-1.5 bg-teal-500 rounded-full"></span>
                                <span className="truncate max-w-[150px] md:max-w-none">AUDITORÍA SST EN VIVO</span>
                            </h2>
                            <p className="text-white/40 text-[8px] md:text-[10px] font-mono tracking-tighter uppercase">
                                PROCESO: PELIGROS
                            </p>
                        </div>
                    </div>

                    {/* Top Center: Status Display */}
                    <div className="absolute left-1/2 -translate-x-1/2 top-8 flex flex-col items-center gap-2">
                         <div className="bg-black/60 backdrop-blur-xl px-6 py-2 rounded-full border border-white/20 shadow-2xl flex items-center gap-3">
                            {status === 'thinking' && <RefreshCcw className="w-4 h-4 text-teal-400 animate-spin" />}
                            <h2 className="text-sm md:text-base font-medium text-white tracking-widest uppercase">
                                {statusText || (status === 'listening' ? localize('com_nav_voice_listening') :
                                    status === 'speaking' ? localize('com_nav_voice_speaking') :
                                        status === 'thinking' ? localize('com_nav_voice_thinking') :
                                            localize('com_nav_voice_ready_label'))}
                            </h2>
                        </div>
                    </div>

                    {/* Top Right: Call Info / Timer */}
                    <div className="flex flex-col items-end gap-1 md:gap-3 text-right">
                        <div className="bg-black/40 backdrop-blur-md px-2 md:px-4 py-1 md:py-2 rounded-lg border border-white/10 shadow-xl flex flex-col items-end">
                            <span className="text-[8px] md:text-[10px] text-white/40 font-mono uppercase tracking-widest">Model: {selectedModel?.split('-')[0] || 'Gemini'}</span>
                            <span className="text-[8px] md:text-[10px] text-teal-500 font-mono uppercase tracking-widest hidden sm:inline">Active Link: {conversationId?.slice(0, 8) || 'SESSION_NEW'}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-white/60">
                            <Monitor className="w-2.5 md:w-3 h-2.5 md:h-3" />
                            <span className="text-[9px] md:text-xs font-mono">1080p / 15FPS</span>
                        </div>
                    </div>
                </div>

                {/* Video Preview (Main Focus) */}
                <div className="absolute inset-0 z-0 overflow-hidden bg-surface-primary">
                    <video
                        ref={videoRef}
                        className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000 ${isCameraOn || isScreenSharing ? 'opacity-100 scale-100 blur-0' : 'opacity-0 scale-110 blur-xl'}`}
                        muted
                        playsInline
                    />
                    
                    {/* Video Effects Overlays */}
                    {(isCameraOn || isScreenSharing) && (
                        <>
                            {/* CRT/Scanline pattern */}
                            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.02),rgba(0,255,0,0.01),rgba(0,0,118,0.02))] bg-[length:100%_2px,3px_100%] opacity-20"></div>
                            
                            {/* Vignette */}
                            <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_150px_rgba(0,0,0,0.5)]"></div>

                            {/* Camera Corners/Focus Brackets */}
                            <div className="absolute top-12 left-12 w-8 h-8 border-t-2 border-l-2 border-white/40 rounded-tl-sm pointer-events-none"></div>
                            <div className="absolute top-12 right-12 w-8 h-8 border-t-2 border-r-2 border-white/40 rounded-tr-sm pointer-events-none"></div>
                            <div className="absolute bottom-32 left-12 w-8 h-8 border-b-2 border-l-2 border-white/40 rounded-bl-sm pointer-events-none"></div>
                            <div className="absolute bottom-32 right-12 w-8 h-8 border-b-2 border-r-2 border-white/40 rounded-br-sm pointer-events-none"></div>

                            {/* Thinking Scanner Effect */}
                            {status === 'thinking' && (
                                <div className="absolute top-0 left-0 w-full h-1 bg-teal-400/50 shadow-[0_0_15px_rgba(45,212,191,0.8)] z-10 animate-[scan_2s_ease-in-out_infinite] pointer-events-none"></div>
                            )}
                        </>
                    )}
                </div>

                {/* Voice Orb & Floating UI */}
                <div className="flex-1 flex flex-col items-center justify-center z-10 relative">
                    <div 
                        onClick={handleOrbClick} 
                        className={`cursor-pointer transition-all duration-500 transform ${status === 'speaking' ? 'scale-110' : 'scale-100'}`}
                    >
                        <VoiceOrb
                            status={status === 'ready' ? 'idle' : status}
                            amplitude={audioAmplitude}
                            className="drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]"
                        />
                    </div>
                    
                    {/* Localize Status Description */}
                    <p className="mt-8 text-white/40 text-[10px] font-mono tracking-[0.5em] uppercase select-none">
                        {status === 'speaking' ? 'AI Voice Active' : status === 'listening' ? 'Analyzing Audio' : 'Secure Channel Idle'}
                    </p>

                    {showVoiceSelector && (
                        <div className="absolute top-full mt-8 bg-surface-primary border border-white/10 rounded-xl shadow-2xl p-2 min-w-[200px] z-50 overflow-hidden">
                            <div className="px-3 py-2 border-b border-light/10 text-[10px] uppercase tracking-widest text-white/40 font-bold mb-1">
                                Select System Voice
                            </div>
                            <VoiceSelector
                                selectedVoice={selectedVoice}
                                onVoiceChange={handleVoiceChange}
                            />
                        </div>
                    )}
                </div>

                {/* Bottom Main Interaction Bar */}
                <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8 z-30 flex flex-col items-center gap-6">
                    
                    {/* Control Bar - Premium Glassmorphism */}
                    <div className="flex items-center justify-center gap-2 md:gap-4 bg-black/60 backdrop-blur-2xl px-4 md:px-8 py-3 md:py-5 rounded-[2rem] md:rounded-[2.5rem] border border-white/10 shadow-2xl transition-all hover:bg-black/70 group">
                        
                        {/* Camera Toggle */}
                        <TooltipAnchor
                            description={isCameraOn ? localize('com_ui_voice_camera_off') : localize('com_ui_voice_camera_on')}
                            render={
                                <button
                                    onClick={toggleCamera}
                                    disabled={isScreenSharing}
                                    className={`p-4 rounded-full transition-all duration-300 transform active:scale-95 ${isCameraOn
                                        ? 'bg-white text-black shadow-lg shadow-white/20'
                                        : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'
                                        } ${isScreenSharing ? 'opacity-20 cursor-not-allowed' : ''}`}
                                >
                                    {isCameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                                </button>
                            }
                        />

                        {/* Camera Switch */}
                        {isCameraOn && (
                            <TooltipAnchor
                                description={localize('com_ui_switch_camera')}
                                render={
                                    <button
                                        onClick={switchCamera}
                                        className="p-4 rounded-full bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-all transform active:rotate-180 duration-500"
                                    >
                                        <RefreshCcw className="w-5 h-5" />
                                    </button>
                                }
                            />
                        )}

                        <div className="w-[1px] h-8 bg-white/10 mx-2"></div>

                        {/* Microphone Toggle (Center Piece) */}
                        <TooltipAnchor
                            description={isMuted ? localize('com_nav_voice_unmute') : localize('com_nav_voice_mute')}
                            render={
                                <button
                                    onClick={toggleMute}
                                    className={`p-5 rounded-full transition-all duration-500 transform active:scale-90 ${isMuted
                                        ? 'bg-red-500/20 text-red-500 border border-red-500/50 backdrop-blur-md'
                                        : 'bg-white text-black shadow-xl shadow-white/10 scale-110 border-4 border-white'
                                        }`}
                                >
                                    {isMuted ? <MicOff className="w-7 h-7" /> : (
                                        <div className="relative">
                                            <Mic className="w-7 h-7" />
                                            {status === 'listening' && (
                                                <span className="absolute -top-3 -right-3 flex h-4 w-4">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-4 w-4 bg-teal-500"></span>
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </button>
                            }
                        />

                        <div className="w-[1px] h-8 bg-white/10 mx-2"></div>

                        {/* Screen Share Toggle */}
                        {supportsScreenShare && (
                            <TooltipAnchor
                                description={isScreenSharing ? localize('com_ui_voice_screen_share_stop') : localize('com_ui_voice_screen_share_start')}
                                render={
                                    <button
                                        onClick={toggleScreenShare}
                                        disabled={isCameraOn}
                                        className={`p-4 rounded-full transition-all duration-300 transform active:scale-95 ${isScreenSharing
                                            ? 'bg-blue-500 text-white shadow-lg'
                                            : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'
                                            } ${isCameraOn ? 'opacity-20 cursor-not-allowed' : ''}`}
                                    >
                                        {isScreenSharing ? <MonitorOff className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
                                    </button>
                                }
                            />
                        )}

                        {/* End Call Button */}
                        <TooltipAnchor
                            description={localize('com_ui_voice_end_call')}
                            render={
                                <button
                                    onClick={handleClose}
                                    className="p-4 rounded-full bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/30 transition-all duration-300 transform hover:scale-110 active:scale-95 border border-red-400/20"
                                >
                                    <PhoneOff className="w-5 h-5" />
                                </button>
                            }
                        />
                    </div>

                    {/* Footer Info */}
                    <div className="flex items-center gap-6 text-[9px] font-mono text-white/30 uppercase tracking-[0.4em] pointer-events-none">
                        <span>Encrypted Protocol SSL-V3</span>
                        <span>•</span>
                        <span>Forensic SST Audit Mode</span>
                        <span>•</span>
                        <span>Biometric Link Active</span>
                    </div>
                </div>

                {/* Additional CSS Animations */}
                <style dangerouslySetInnerHTML={{ __html: `
                    @keyframes scan {
                        0% { top: 0; opacity: 0; }
                        5% { opacity: 1; }
                        95% { opacity: 1; }
                        100% { top: 100%; opacity: 0; }
                    }
                    @keyframes pulse-soft {
                        0%, 100% { opacity: 0.4; }
                        50% { opacity: 1; }
                    }
                `}} />
            </div>
        </div>
    );
};

export default LiveAnalysisModal;
