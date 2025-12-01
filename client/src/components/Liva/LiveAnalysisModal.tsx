import { useState, useEffect, useCallback, useRef, useMemo, type FC } from 'react';
import { useRecoilValue } from 'recoil';
import { X, Mic, MicOff, Video, VideoOff, RefreshCcw } from 'lucide-react';
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
    onConversationUpdated?: () => void; // Added this prop based on the instruction's destructuring
}

const LiveAnalysisModal: FC<LiveAnalysisModalProps> = ({ isOpen, onClose, conversationId, onConversationIdUpdate, onTextReceived, onConversationUpdated }) => {
    const localize = useLocalize();
    const voiceLiveAnalysis = useRecoilValue(store.voiceLiveAnalysis);
    const [selectedVoice, setSelectedVoice] = useState(voiceLiveAnalysis);
    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOn, setIsCameraOn] = useState(true); // Default to ON for analysis
    const [statusText, setStatusText] = useState('Initializing...');
    const [isReady, setIsReady] = useState(false); // New state for connection delay
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
    const [showVoiceSelector, setShowVoiceSelector] = useState(false);
    const [audioAmplitude, setAudioAmplitude] = useState(0);

    const videoRef = useRef<HTMLVideoElement | null>(null);
    const videoIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const wasOpenRef = useRef(false); // To track if the modal was previously open

    // Memoize options
    const sessionOptions = useMemo(() => ({
        conversationId,
        onConversationIdUpdate,
        disableAudio: false,
        initialVoice: voiceLiveAnalysis, // Pass the initial voice from the store
        // mode: 'live_analysis', // Mode is now hardcoded in the dedicated hook/server
        onAudioReceived: (audioData: string) => {
            handleAudioReceived(audioData);
        },
        onTextReceived: (text: string) => {
            // Forward AI text to parent (LivePage) to update report
            onTextReceived?.(text);
        },
        onStatusChange: (newStatus: string) => {
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
        onError: (err: string) => {
            console.error('[LiveAnalysisModal] Error:', err);
            setStatusText(`Error: ${err}`);
        },
    }), [conversationId, onConversationIdUpdate, voiceLiveAnalysis, onTextReceived]);

    // Live Analysis session WebSocket (Dedicated)
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

    // Connection Delay Logic
    useEffect(() => {
        if (isOpen && isConnected) {
            setIsReady(false);
            const timer = setTimeout(() => {
                setIsReady(true);
            }, 3000); // 3 seconds delay
            return () => clearTimeout(timer);
        } else {
            setIsReady(false);
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
            stopCamera();
            disconnect();
            if (audioContextRef.current) {
                audioContextRef.current.close();
                audioContextRef.current = null;
            }
        };
    }, [isOpen]); // Connect when opened

    // Ensure voice is updated when connected
    useEffect(() => {
        if (isOpen && isConnected && selectedVoice !== voiceLiveAnalysis) {
            console.log('[LiveAnalysisModal] Syncing voice with global setting:', voiceLiveAnalysis);
            setSelectedVoice(voiceLiveAnalysis);
            changeVoice(voiceLiveAnalysis);
        }
    }, [isOpen, isConnected, voiceLiveAnalysis, changeVoice]);

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
            }, 100); // 10 FPS for better precision

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

    // Audio Playback Logic with Jitter Buffer
    const nextStartTimeRef = useRef<number>(0);
    const [audioQueue, setAudioQueue] = useState<AudioBuffer[]>([]); // Keep for visualizer if needed, or remove if unused
    const outputAnalyserRef = useRef<AnalyserNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    // Unified Animation Loop
    useEffect(() => {
        const updateAmplitude = () => {
            let vol = 0;

            if (status === 'speaking' && outputAnalyserRef.current) {
                // Visualize Output (Gemini)
                const dataArray = new Uint8Array(outputAnalyserRef.current.frequencyBinCount);
                outputAnalyserRef.current.getByteFrequencyData(dataArray);
                const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
                vol = Math.min(1, (average / 255) * 2);
            } else if (status === 'listening' || status === 'ready') {
                // Visualize Input (User)
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
        // If next start time is in the past (gap in speech), reset to now + small buffer
        if (nextStartTimeRef.current < currentTime) {
            nextStartTimeRef.current = currentTime + 0.05; // 50ms jitter buffer
        }

        const source = audioContextRef.current.createBufferSource();
        source.buffer = buffer;

        // Create/Reuse Analyser
        if (!outputAnalyserRef.current) {
            const analyser = audioContextRef.current.createAnalyser();
            analyser.fftSize = 256;
            outputAnalyserRef.current = analyser;
            analyser.connect(audioContextRef.current.destination);
        }

        source.connect(outputAnalyserRef.current);
        source.start(nextStartTimeRef.current);

        // Update next start time
        nextStartTimeRef.current += buffer.duration;
    }

    const clearAudioQueue = () => {
        if (audioContextRef.current) {
            audioContextRef.current.suspend().then(() => {
                nextStartTimeRef.current = 0;
                audioContextRef.current?.resume();
            });
        }
    };

    const handleVoiceChange = (voiceId: string) => {
        setSelectedVoice(voiceId);
        // Update global store (if we had a setter for live analysis voice, but we only read it. 
        // Assuming we should update it or just local state? 
        // For now, let's just change the voice in session)
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
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="relative w-full h-full bg-black/40 backdrop-blur-xl flex flex-col overflow-hidden">

                {/* Loading Overlay - Minimalist */}
                {(!isReady && isOpen) && (
                    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center pointer-events-none">
                        <div className="bg-black/40 backdrop-blur-sm px-6 py-3 rounded-full flex items-center gap-3 shadow-lg">
                            <div className="w-5 h-5 border-2 border-white/80 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-white font-medium text-sm">Conectando...</span>
                        </div>
                    </div>
                )}

                {/* Status */}
                <div className="absolute top-12 text-center z-10 w-full px-4">
                    <p className="text-xl font-medium text-white/90 tracking-wide">{statusText || 'Ready'}</p>
                </div>

                {/* Video Fullscreen with Opacity for Transparency */}
                <video
                    ref={videoRef}
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${isCameraOn ? 'opacity-50' : 'opacity-0 hidden'}`}
                    muted
                    playsInline
                />

                {/* Voice Orb & Selector */}
                <div className="flex-1 flex items-center justify-center z-10">
                    <div onClick={handleOrbClick} className="cursor-pointer">
                        <VoiceOrb
                            status={status === 'ready' ? 'idle' : status}
                            amplitude={audioAmplitude}
                        />
                    </div>
                    {showVoiceSelector && (
                        <div className="absolute">
                            <VoiceSelector
                                selectedVoice={selectedVoice}
                                onVoiceChange={handleVoiceChange}
                            />
                        </div>
                    )}
                </div>

                {/* Controls */}
                <div className="absolute bottom-12 left-0 right-0 flex items-center justify-center space-x-8 z-20">
                    <button onClick={toggleCamera} className={`p-4 rounded-full transition-all duration-300 ${isCameraOn ? 'bg-white text-black shadow-lg scale-110' : 'bg-white/10 hover:bg-white/20 text-white backdrop-blur-md'}`}>
                        {isCameraOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
                    </button>

                    {isCameraOn && (
                        <button onClick={switchCamera} className="p-4 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all">
                            <RefreshCcw className="w-6 h-6" />
                        </button>
                    )}

                    <button onClick={toggleMute} className={`p-4 rounded-full transition-all duration-300 ${isMuted ? 'bg-red-500/80 hover:bg-red-600 text-white shadow-lg' : 'bg-white/10 hover:bg-white/20 text-white backdrop-blur-md'}`}>
                        {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                    </button>

                    <button onClick={handleClose} className="p-4 rounded-full bg-white/10 hover:bg-red-500/20 text-white hover:text-red-400 backdrop-blur-md transition-all">
                        <X className="w-6 h-6" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LiveAnalysisModal;
