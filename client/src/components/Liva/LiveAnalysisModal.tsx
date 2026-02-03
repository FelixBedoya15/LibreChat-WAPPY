import { useState, useEffect, useCallback, useRef, useMemo, type FC } from 'react';
import { useRecoilValue } from 'recoil';
import { X, Mic, MicOff, Video, VideoOff, RefreshCcw, Monitor, MonitorOff, PhoneOff } from 'lucide-react';
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
}

const LiveAnalysisModal: FC<LiveAnalysisModalProps> = ({ isOpen, onClose, conversationId, onConversationIdUpdate, onTextReceived, onReportReceived, onConversationUpdated }) => {
    const localize = useLocalize();
    const voiceLiveAnalysis = useRecoilValue(store.voiceLiveAnalysis);
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
    const [countdown, setCountdown] = useState(10);

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
    }), [conversationId, onConversationIdUpdate, voiceLiveAnalysis, onTextReceived, onReportReceived, hasReceivedReport]);

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
            setCountdown(10);

            const interval = setInterval(() => {
                setCountdown((prev) => {
                    if (prev <= 1) return 1;
                    return prev - 1;
                });
            }, 1000);

            const timer = setTimeout(() => {
                setIsReady(true);
                clearInterval(interval);
            }, 10000); // 10 seconds delay

            return () => {
                clearTimeout(timer);
                clearInterval(interval);
            };
        } else {
            setIsReady(false);
            setCountdown(10);
        }
    }, [isOpen, isConnected]);

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
                    <table border="1" style="border-collapse: collapse; width: 100%; text-align: left;">
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
                    <table border="1" style="border-collapse: collapse; width: 100%; text-align: left;">
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

                {/* Loading Overlay - Countdown */}
                {(!isReady && isOpen) && (
                    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center pointer-events-none bg-black/80">
                        <div className="text-[10rem] md:text-[12rem] font-bold text-white/30 animate-pulse tracking-tighter select-none">
                            {countdown}
                        </div>
                        <div className="mt-4 bg-black/20 backdrop-blur-sm px-6 py-2 rounded-full flex items-center gap-3">
                            <div className="w-4 h-4 border-2 border-white/60 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-white/80 font-medium text-sm tracking-widest uppercase">Estableciendo Conexión</span>
                        </div>
                    </div>
                )}

                {/* Header / Status */}
                <div className="absolute top-8 left-0 right-0 text-center z-20 pointer-events-none">
                    <h2 className="text-xl md:text-2xl font-light text-white tracking-wider opacity-90">
                        {statusText || (status === 'listening' ? localize('com_nav_voice_listening') :
                            status === 'speaking' ? localize('com_nav_voice_speaking') :
                                status === 'thinking' ? localize('com_nav_voice_thinking') :
                                    localize('com_nav_voice_ready_label'))}
                    </h2>
                </div>

                {/* Video Preview (Background) */}
                <video
                    ref={videoRef}
                    className={`absolute inset-0 w-full h-full object-cover opacity-60 transition-opacity duration-500 ${isCameraOn || isScreenSharing ? 'block' : 'hidden'}`}
                    muted
                    playsInline
                />

                {/* Voice Orb (Center) */}
                <div className="flex-1 flex items-center justify-center z-10 relative">
                    <div onClick={handleOrbClick} className="cursor-pointer transition-transform hover:scale-105 active:scale-95">
                        <VoiceOrb
                            status={status === 'ready' ? 'idle' : status}
                            amplitude={audioAmplitude}
                        />
                    </div>
                    {showVoiceSelector && (
                        <div className="absolute top-full mt-8 bg-surface-primary rounded-xl shadow-2xl p-2 min-w-[200px]">
                            <VoiceSelector
                                selectedVoice={selectedVoice}
                                onVoiceChange={handleVoiceChange}
                            />
                        </div>
                    )}
                </div>

                {/* Bottom Control Bar */}
                <div className="absolute bottom-12 left-0 right-0 flex items-center justify-center gap-6 z-30 px-4">

                    {/* Camera Toggle */}
                    <TooltipAnchor
                        description={isCameraOn ? localize('com_ui_voice_camera_off') : localize('com_ui_voice_camera_on')}
                        render={
                            <button
                                onClick={toggleCamera}
                                disabled={isScreenSharing}
                                className={`p-4 rounded-full transition-all duration-300 ${isCameraOn
                                    ? 'bg-white text-black shadow-lg shadow-white/20'
                                    : 'bg-white/10 text-white hover:bg-white/20 backdrop-blur-md'
                                    } ${isScreenSharing ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {isCameraOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
                            </button>
                        }
                    />

                    {/* Camera Switch (Only if camera is on) */}
                    {isCameraOn && (
                        <TooltipAnchor
                            description={localize('com_ui_switch_camera')}
                            render={
                                <button
                                    onClick={switchCamera}
                                    className="p-4 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all"
                                >
                                    <RefreshCcw className="w-6 h-6" />
                                </button>
                            }
                        />
                    )}

                    {/* Screen Share Toggle */}
                    {supportsScreenShare && (
                        <TooltipAnchor
                            description={isScreenSharing ? localize('com_ui_voice_screen_share_stop') : localize('com_ui_voice_screen_share_start')}
                            render={
                                <button
                                    onClick={toggleScreenShare}
                                    disabled={isCameraOn}
                                    className={`p-4 rounded-full transition-all duration-300 ${isScreenSharing
                                        ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                                        : 'bg-white/10 text-white hover:bg-white/20 backdrop-blur-md'
                                        } ${isCameraOn ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {isScreenSharing ? <MonitorOff className="w-6 h-6" /> : <Monitor className="w-6 h-6" />}
                                </button>
                            }
                        />
                    )}

                    {/* Microphone Toggle (Large Center) */}
                    <TooltipAnchor
                        description={isMuted ? localize('com_nav_voice_unmute') : localize('com_nav_voice_mute')}
                        render={
                            <button
                                onClick={toggleMute}
                                className={`p-6 rounded-full transition-all duration-300 mx-2 ${isMuted
                                    ? 'bg-white/10 text-white hover:bg-white/20 backdrop-blur-md border border-white/20'
                                    : 'bg-white text-black shadow-xl shadow-white/10 scale-110'
                                    }`}
                            >
                                {isMuted ? <MicOff className="w-8 h-8" /> : (
                                    <div className="relative">
                                        <Mic className="w-8 h-8" />
                                        {status === 'listening' && (
                                            <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                            </span>
                                        )}
                                    </div>
                                )}
                            </button>
                        }
                    />

                    {/* End Call Button */}
                    <TooltipAnchor
                        description={localize('com_ui_voice_end_call')}
                        render={
                            <button
                                onClick={handleClose}
                                className="p-4 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30 transition-all duration-300 transform hover:scale-105"
                            >
                                <PhoneOff className="w-6 h-6" />
                            </button>
                        }
                    />

                </div>
            </div>
        </div>
    );
};

export default LiveAnalysisModal;
