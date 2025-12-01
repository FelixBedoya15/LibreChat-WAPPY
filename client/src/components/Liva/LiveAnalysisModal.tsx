import { useState, useEffect, useCallback, useRef, type FC } from 'react';
import { X, Mic, MicOff, Video, VideoOff, RefreshCcw } from 'lucide-react';
import { useVoiceSession } from '~/hooks/useVoiceSession';
import { useLocalize } from '~/hooks';

interface LiveAnalysisModalProps {
    isOpen: boolean;
    onClose: () => void;
    conversationId?: string;
    onConversationIdUpdate?: (newId: string) => void;
    onTextReceived?: (text: string) => void;
}

const LiveAnalysisModal: FC<LiveAnalysisModalProps> = ({ isOpen, onClose, conversationId, onConversationIdUpdate, onTextReceived }) => {
    const localize = useLocalize();
    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOn, setIsCameraOn] = useState(true); // Default to ON for analysis
    const [statusText, setStatusText] = useState('');
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

    const videoRef = useRef<HTMLVideoElement | null>(null);
    const videoIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);

    // Voice session WebSocket
    const {
        isConnected,
        isConnecting,
        status,
        connect,
        disconnect,
        sendVideoFrame,
        sendTextMessage,
        setMuted,
    } = useVoiceSession({
        conversationId,
        onConversationIdUpdate,
        disableAudio: false, // Enable audio for conversational mode
        onAudioReceived: (audioData) => {
            handleAudioReceived(audioData);
        },
        onTextReceived: (text) => {
            // Forward AI text to parent (LivePage) to update report
            onTextReceived?.(text);
        },
        onStatusChange: (newStatus) => {
            console.log('[LiveAnalysisModal] Status:', newStatus);
            if (newStatus === 'listening') {
                setStatusText('Listening...');
            } else if (newStatus === 'speaking') {
                setStatusText('AI Speaking...');
            } else if (newStatus === 'thinking') {
                setStatusText('Analyzing...');
            } else {
                setStatusText(newStatus);
            }
        },
        onError: (err) => {
            console.error('[LiveAnalysisModal] Error:', err);
            setStatusText(`Error: ${err}`);
        },
    });

    // Connect on mount if open
    useEffect(() => {
        if (!isOpen) return;

        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }

        connect();

        return () => {
            stopCamera();
            disconnect();
            if (audioContextRef.current) {
                audioContextRef.current.close();
                audioContextRef.current = null;
            }
        };
    }, [isOpen]); // Connect when opened

    // Auto-start camera and send initial prompt when connected
    useEffect(() => {
        if (isConnected && isOpen) {
            startCamera();

            // Send initial prompt after a delay to ensure video is ready
            const timer = setTimeout(() => {
                console.log("[LiveAnalysisModal] Sending initial analysis prompt");
                // Comprehensive prompt for Risk Analysis with Strict Structure
                sendTextMessage(`
                    Actúa como un Experto Senior en Prevención de Riesgos Laborales (HSE).
                    Tu misión es realizar una "Investigación Exhaustiva" del entorno en video y generar un INFORME TÉCNICO FORMAL.

                    INSTRUCCIONES DE SALIDA:
                    1. **AUDIO (Voz):** Háblame como un colega experto. Explica tus hallazgos, menciona los riesgos críticos y sé directivo. Puedes ser conversacional en el audio.
                    2. **TEXTO (Reporte):** Genera EXCLUSIVAMENTE el contenido del informe en formato Markdown.
                       - NO incluyas saludos, despedidas ni preguntas en el texto ("¿Desea algo más?").
                       - El texto debe ser puramente técnico y objetivo.

                    ESTRUCTURA OBLIGATORIA DEL REPORTE (Markdown):

                    # Análisis de Trabajo Seguro (ATS)

                    ## 1. Descripción del Entorno
                    (Descripción detallada de maquinaria, personal, condiciones ambientales, orden y aseo).

                    ## 2. Análisis Técnico
                    (Evaluación profunda de condiciones inseguras y actos subestándar observados).

                    ## 3. Matriz de Identificación y Valoración de Riesgos
                    | Peligro | Riesgo | Probabilidad (Alta/Media/Baja) | Consecuencia | Nivel de Riesgo |
                    |---|---|---|---|---|
                    | (Ej: Cable suelto) | (Ej: Caída a nivel) | Media | Lesión leve | Medio |
                    | ... | ... | ... | ... | ... |

                    ## 4. Jerarquía de Controles
                    | Riesgo Identificado | Eliminación / Sustitución | Controles de Ingeniería | Controles Administrativos | EPP Requerido |
                    |---|---|---|---|---|
                    | ... | ... | ... | ... | ... |

                    IMPORTANTE:
                    - DEBES usar tablas Markdown para las secciones 3 y 4.
                    - Sé riguroso en la valoración.
                    - Si no ves riesgos graves, documenta los riesgos leves o ergonómicos presentes.
                `);
            }, 2000);

            return () => clearTimeout(timer);
        }
    }, [isConnected, isOpen, sendTextMessage]);

    const handleClose = () => {
        stopCamera();
        disconnect();
        onClose();
    };

    const startCamera = async (mode: 'user' | 'environment' = facingMode) => {
        try {
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

            // Start sending frames
            if (videoIntervalRef.current) clearInterval(videoIntervalRef.current);
            videoIntervalRef.current = setInterval(() => {
                if (videoRef.current && videoRef.current.readyState >= 2) {
                    sendVideoFrame(videoRef.current);
                }
            }, 200); // 5 FPS

        } catch (error) {
            console.error('[LiveAnalysisModal] Error starting camera:', error);
            setStatusText('Error accessing camera');
            setIsCameraOn(false);
        }
    };

    const stopCamera = () => {
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
    };

    const toggleCamera = () => {
        if (isCameraOn) stopCamera();
        else startCamera();
    };

    const switchCamera = () => {
        const newMode = facingMode === 'user' ? 'environment' : 'user';
        setFacingMode(newMode);
        if (isCameraOn) {
            stopCamera();
            setTimeout(() => startCamera(newMode), 200);
        }
    };

    const toggleMute = () => {
        const newMuted = !isMuted;
        setIsMuted(newMuted);
        setMuted(newMuted);
    };

    // Audio Playback Logic
    const [audioQueue, setAudioQueue] = useState<AudioBuffer[]>([]);
    const [isPlaying, setIsPlaying] = useState(false);

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
            setAudioQueue(prev => [...prev, audioBuffer]);
        } catch (error) {
            console.error('[LiveAnalysisModal] Error processing audio:', error);
        }
    }

    useEffect(() => {
        if (!isPlaying && audioQueue.length > 0 && audioContextRef.current) {
            const buffer = audioQueue[0];
            setAudioQueue(prev => prev.slice(1));
            playAudio(buffer);
        }
    }, [audioQueue, isPlaying]);

    function playAudio(buffer: AudioBuffer) {
        if (!audioContextRef.current) return;
        setIsPlaying(true);
        const source = audioContextRef.current.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContextRef.current.destination);
        source.onended = () => setIsPlaying(false);
        source.start();
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30 backdrop-blur-sm">
            <div className="relative flex flex-col items-center justify-center w-full h-full p-4">
                {/* Status */}
                <div className="absolute top-8 text-center z-10 bg-black/50 px-4 py-2 rounded-full backdrop-blur-md">
                    <p className="text-lg text-white font-medium">{statusText || 'Connecting...'}</p>
                </div>

                {/* Video Fullscreen with Opacity for Transparency */}
                <video
                    ref={videoRef}
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${isCameraOn ? 'opacity-50' : 'opacity-0 hidden'}`}
                    muted
                    playsInline
                />

                {/* Controls */}
                <div className="absolute bottom-12 flex items-center space-x-6 z-20 bg-black/40 p-4 rounded-full backdrop-blur-md border border-white/10">
                    <button onClick={toggleCamera} className={`p-4 rounded-full transition-all ${isCameraOn ? 'bg-white text-black' : 'bg-gray-800 text-white'}`}>
                        {isCameraOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
                    </button>

                    {isCameraOn && (
                        <button onClick={switchCamera} className="p-4 rounded-full bg-gray-800 text-white hover:bg-gray-700 transition-colors">
                            <RefreshCcw className="w-6 h-6" />
                        </button>
                    )}

                    <button onClick={toggleMute} className={`p-4 rounded-full transition-all ${isMuted ? 'bg-red-500 text-white' : 'bg-white text-black'}`}>
                        {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                    </button>

                    <button onClick={handleClose} className="p-4 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LiveAnalysisModal;
