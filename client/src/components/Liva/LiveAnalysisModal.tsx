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
    onReportReceived?: (html: string) => void;
    onConversationUpdated?: () => void;
}

const LiveAnalysisModal: FC<LiveAnalysisModalProps> = ({ isOpen, onClose, conversationId, onConversationIdUpdate, onTextReceived, onReportReceived, onConversationUpdated }) => {
    const localize = useLocalize();
    const voiceLiveAnalysis = useRecoilValue(store.voiceLiveAnalysis);
    const [selectedVoice, setSelectedVoice] = useState(voiceLiveAnalysis);
    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOn, setIsCameraOn] = useState(true);
    const [statusText, setStatusText] = useState('Initializing...');
    const [isReady, setIsReady] = useState(false);
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
    const [showVoiceSelector, setShowVoiceSelector] = useState(false);
    const [audioAmplitude, setAudioAmplitude] = useState(0);

    const videoRef = useRef<HTMLVideoElement | null>(null);
    const videoIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const wasOpenRef = useRef(false);

    // NEW: Countdown state
    const [countdown, setCountdown] = useState(10);

    // NEW: Track if report has been received
    const [hasReceivedReport, setHasReceivedReport] = useState(false);

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
            onReportReceived?.(html);
        },
        onStatusChange: (newStatus: string) => {
            console.log('[LiveAnalysisModal] Status:', newStatus);
            if (newStatus === 'listening') {
                setStatusText('Listening...');
            } else if (newStatus === 'speaking') {
                setStatusText('AI Speaking...');
            } else if (newStatus === 'thinking') {
                setStatusText('Analizando...');
            } else if (newStatus === 'turn_complete') {
                // Only show completion if we actually got the report
                if (hasReceivedReport) {
                    setStatusText('Análisis Completado');
                } else {
                    setStatusText('Listo'); // Revert to ready if just a normal turn finished
                }
            } else {
                setStatusText(newStatus);
            }
        },
        onError: (err: string) => {
            console.error('[LiveAnalysisModal] Error:', err);
            setStatusText(`Error: ${err}`);
        },
    }), [conversationId, onConversationIdUpdate, voiceLiveAnalysis, onTextReceived, onReportReceived, hasReceivedReport]); // Added hasReceivedReport dependency

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

    // ... (rest of the code) ...

    // Auto-start camera and send initial prompt when READY (after countdown)
    useEffect(() => {
        if (isConnected && isOpen && isReady) { // Wait for isReady (countdown finished)
            startCamera();

            const timer = setTimeout(() => {
                console.log("[LiveAnalysisModal] Sending initial analysis prompt");
                sendTextMessage(`
                    Actúa como un Experto Senior en Prevención de Riesgos Laborales (HSE).
                    MIRA EL VIDEO AHORA MISMO. Tu misión es realizar una "Investigación Exhaustiva" del entorno visual ACTUAL y generar un INFORME TÉCNICO FORMAL.

                    INSTRUCCIONES DE SALIDA:
                    1. **AUDIO (Voz):** Háblame como un colega experto. Explica tus hallazgos, menciona los riesgos críticos y sé directivo. Puedes ser conversacional en el audio.
                    2. **TEXTO (Reporte):** Genera EXCLUSIVAMENTE el contenido del informe en formato HTML.
                       - NO incluyas saludos, despedidas ni preguntas en el texto.
                       - Usa etiquetas HTML semánticas: <h2>, <h3>, <p>, <ul>, <li>, <strong>.
                       - PARA LAS TABLAS: Usa <table>, <thead>, <tbody>, <tr>, <th>, <td> con bordes (style="border-collapse: collapse; width: 100%;").
                       - El texto debe ser un documento formal listo para guardar.

                    ESTRUCTURA OBLIGATORIA DEL REPORTE (HTML):

                    <h2>Análisis de Trabajo Seguro (ATS)</h2>

                    <h3>1. Descripción del Entorno</h3>
                    <p>(Descripción detallada de lo que ves en el video...)</p>

                    <h3>2. Análisis Técnico</h3>
                    <p>(Evaluación profunda...)</p>

                    <h3>3. Matriz de Identificación y Valoración de Riesgos</h3>
                    <table border="1" style="border-collapse: collapse; width: 100%;">
                      <thead>
                        <tr><th>Peligro</th><th>Riesgo</th><th>Probabilidad</th><th>Consecuencia</th><th>Nivel de Riesgo</th></tr>
                      </thead>
                      <tbody>
                        <!-- Filas de la matriz -->
                      </tbody>
                    </table>

                    <h3>4. Jerarquía de Controles</h3>
                    <table border="1" style="border-collapse: collapse; width: 100%;">
                      <thead>
                        <tr><th>Riesgo Identificado</th><th>Eliminación / Sustitución</th><th>Controles de Ingeniería</th><th>Controles Administrativos</th><th>EPP Requerido</th></tr>
                      </thead>
                      <tbody>
                        <!-- Filas de controles -->
                      </tbody>
                    </table>

                    IMPORTANTE:
                    - Sé riguroso en la valoración.
                    - Si no ves riesgos graves, documenta los riesgos leves o ergonómicos presentes.
                `);
            }, 1000); // Short delay after ready

            return () => clearTimeout(timer);
        }
    }, [isConnected, isOpen, isReady, sendTextMessage]); // Depend on isReady

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

            if (videoIntervalRef.current) clearInterval(videoIntervalRef.current);
            videoIntervalRef.current = setInterval(() => {
                if (videoRef.current && videoRef.current.readyState >= 2) {
                    sendVideoFrame(videoRef.current);
                }
            }, 500);
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

    const nextStartTimeRef = useRef<number>(0);
    const [audioQueue, setAudioQueue] = useState<AudioBuffer[]>([]);
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

                {/* Loading Overlay - Countdown */}
                {(!isReady && isOpen) && (
                    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center pointer-events-none">
                        <div className="text-[12rem] font-bold text-white/30 animate-pulse tracking-tighter select-none">
                            {countdown}
                        </div>
                        <div className="mt-4 bg-black/20 backdrop-blur-sm px-6 py-2 rounded-full flex items-center gap-3">
                            <div className="w-4 h-4 border-2 border-white/60 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-white/80 font-medium text-sm tracking-widest uppercase">Estableciendo Conexión</span>
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
