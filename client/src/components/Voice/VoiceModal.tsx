import { useState, useEffect, useCallback, useRef, useMemo, type FC } from 'react';
import { useRecoilState } from 'recoil';
import { X, Mic, MicOff, Video, VideoOff, RefreshCcw } from 'lucide-react';
import store from '~/store';
import VoiceOrb from './VoiceOrb';
import VoiceSelector from './VoiceSelector';
import { useVoiceSession } from '~/hooks/useVoiceSession';
import { useLocalize } from '~/hooks';

interface VoiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    conversationId?: string;
    onConversationIdUpdate?: (newId: string) => void;
    onConversationUpdated?: () => void;
}

const VoiceModal: FC<VoiceModalProps> = ({ isOpen, onClose, conversationId, onConversationIdUpdate, onConversationUpdated }) => {
    const localize = useLocalize();
    const [voiceChatGeneral, setVoiceChatGeneral] = useRecoilState(store.voiceChatGeneral);
    // Initialize with global state, but ensure we listen to updates
    const [selectedVoice, setSelectedVoice] = useState(voiceChatGeneral);
    const [isReady, setIsReady] = useState(false); // New state for connection delay
    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOn, setIsCameraOn] = useState(false);
    const [showVoiceSelector, setShowVoiceSelector] = useState(false);
    const [audioAmplitude, setAudioAmplitude] = useState(0);
    const [statusText, setStatusText] = useState('');

    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

    const videoRef = useRef<HTMLVideoElement | null>(null);
    const videoIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);

    // Memoize options to prevent infinite loop in useEffect
    const sessionOptions = useMemo(() => ({
        conversationId,
        onConversationIdUpdate,
        onConversationUpdated,
        onAudioReceived: (audioData: string) => {
            handleAudioReceived(audioData);
        },
        onTextReceived: handleTextReceived,
        onStatusChange: handleStatusChange,
        onError: handleError,
    }), [conversationId, onConversationIdUpdate, onConversationUpdated]);

    // Voice session WebSocket
    const {
        isConnected,
        isConnecting,
        status,
        connect,
        disconnect,
        sendVideoFrame,
        changeVoice,
        getInputVolume,
        setMuted,
    } = useVoiceSession(sessionOptions);

    // Track previous isOpen state to detect reopening
    const prevIsOpenRef = useRef(isOpen);

    // Connect on mount, disconnect on unmount
    useEffect(() => {
        // Don't connect if modal is not open
        if (!isOpen) return;

        // Initialize AudioContext on mount (user interaction likely triggered modal open)
        if (!audioContextRef.current) {
            audioContextRef.current = new AudioContext({ sampleRate: 24000 });
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
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Detect modal reopening (closed → open transition)
    useEffect(() => {
        const wasOpen = prevIsOpenRef.current;
        prevIsOpenRef.current = isOpen;

        // Only reconnect if modal was closed and now is opening
        if (!wasOpen && isOpen && !isConnected && !isConnecting) {
            console.log('[VoiceModal] Modal reopened, reconnecting...');
            connect();
        }

        // Ensure voice is updated when connected
        // Only run this if voiceChatGeneral changes externally or on initial connect
        if (isOpen && isConnected && selectedVoice !== voiceChatGeneral) {
            console.log('[VoiceModal] Syncing voice with global setting:', voiceChatGeneral);
            setSelectedVoice(voiceChatGeneral);
            changeVoice(voiceChatGeneral);
        }
    }, [isOpen, isConnected, isConnecting, connect, changeVoice, voiceChatGeneral]); // Removed selectedVoice from deps to avoid loop

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

    const handleClose = () => {
        stopCamera();
        disconnect();
        onClose();
    };

    /**
     * Start Camera
     */
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
                videoRef.current.play();
            }

            setIsCameraOn(true);

            // Start sending frames
            videoIntervalRef.current = setInterval(() => {
                if (videoRef.current) {
                    sendVideoFrame(videoRef.current);
                }
            }, 1000 / 5); // 5 FPS

        } catch (error) {
            console.error('[VoiceModal] Error starting camera:', error);
            setStatusText('Error accessing camera');
            setIsCameraOn(false);
        }
    };

    /**
     * Stop Camera
     */
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

    /**
     * Toggle Camera
     */
    const toggleCamera = () => {
        if (isCameraOn) {
            stopCamera();
        } else {
            startCamera();
        }
    };

    /**
     * Switch Camera (Front/Back)
     */
    const switchCamera = () => {
        const newMode = facingMode === 'user' ? 'environment' : 'user';
        setFacingMode(newMode);

        if (isCameraOn) {
            stopCamera();
            // Small delay to ensure camera is fully stopped before restarting
            setTimeout(() => {
                startCamera(newMode);
            }, 200);
        }
    };

    const [audioQueue, setAudioQueue] = useState<AudioBuffer[]>([]);
    const [isPlaying, setIsPlaying] = useState(false);
    const outputAnalyserRef = useRef<AnalyserNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    // Unified Animation Loop
    useEffect(() => {
        const updateAmplitude = () => {
            let vol = 0;

            if (status === 'speaking' && isPlaying && outputAnalyserRef.current) {
                // Visualize Output (Gemini)
                const dataArray = new Uint8Array(outputAnalyserRef.current.frequencyBinCount);
                outputAnalyserRef.current.getByteFrequencyData(dataArray);
                const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
                vol = Math.min(1, (average / 255) * 2);
            } else if (status === 'listening' || status === 'ready') {
                // Visualize Input (User)
                vol = getInputVolume();
            }

            // Smooth transition could be added here if needed
            setAudioAmplitude(vol);
            animationFrameRef.current = requestAnimationFrame(updateAmplitude);
        };

        updateAmplitude();

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [status, isPlaying, getInputVolume]);

    // Audio Playback Logic with Jitter Buffer
    const nextStartTimeRef = useRef<number>(0);

    /**
     * Handle received audio from Gemini
     */
    function handleAudioReceived(audioData: string) {
        try {
            if (!audioContextRef.current) {
                audioContextRef.current = new AudioContext({ sampleRate: 24000 });
            }

            if (audioContextRef.current.state === 'suspended') {
                audioContextRef.current.resume();
            }

            const binaryString = atob(audioData);
            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }

            const dataView = new DataView(bytes.buffer);
            const float32Data = new Float32Array(len / 2);

            for (let i = 0; i < len / 2; i++) {
                const int16 = dataView.getInt16(i * 2, true);
                float32Data[i] = int16 / 32768.0;
            }

            const audioBuffer = audioContextRef.current.createBuffer(1, float32Data.length, 24000);
            audioBuffer.getChannelData(0).set(float32Data);

            scheduleAudio(audioBuffer);

        } catch (error) {
            console.error('[VoiceModal] Error processing audio:', error);
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

        source.onended = () => {
            setIsPlaying(false);
        };

        setIsPlaying(true);
        source.start(nextStartTimeRef.current);

        // Update next start time
        nextStartTimeRef.current += buffer.duration;

        // Keep track of sources to stop them if needed
        // (Simplified: we rely on context.suspend or close for full stop, but for voice change we might want to be more granular.
        // For now, clearing the queue state is enough if we weren't using scheduleAudio directly.
        // With scheduleAudio, we can't easily cancel scheduled nodes without tracking them.
        // FIX: To clear audio immediately, we can suspend and resume the context or close/reopen.)
    }

    /**
     * Clear audio queue and stop playback
     */
    const clearAudioQueue = () => {
        if (audioContextRef.current) {
            // Suspend and resume to cancel scheduled events is one way, but closing is cleaner for a full reset
            // Or just let it play out? No, user wants immediate change.
            // Easiest: Close and recreate context, or just accept the latency of one buffer.
            // Better: Track the current source node?
            // Let's try suspending the context briefly.
            audioContextRef.current.suspend().then(() => {
                nextStartTimeRef.current = 0;
                audioContextRef.current?.resume();
            });
        }
    };

    /**
     * Handle received text (transcription)
     */
    function handleTextReceived(text: string) {
        console.log('[VoiceModal] Transcription:', text);
    }

    /**
     * Handle status changes
     */
    function handleStatusChange(newStatus: string) {
        console.log('[VoiceModal] Status changed:', newStatus);
    }

    /**
     * Handle errors
     */
    function handleError(error: string) {
        console.error('[VoiceModal] Error:', error);
        setStatusText(`Error: ${error}`);
    }

    /**
     * Toggle mute
     */
    const toggleMute = () => {
        const newMuted = !isMuted;
        setIsMuted(newMuted);
        setMuted(newMuted);
    };

    /**
     * Handle voice change
     */
    const handleVoiceChange = (voiceId: string) => {
        setSelectedVoice(voiceId);
        setVoiceChatGeneral(voiceId); // Update global store to prevent sync loop
        clearAudioQueue(); // Stop current voice immediately
        changeVoice(voiceId);
        setShowVoiceSelector(false);
    };

    /**
     * Handle orb click to show voice selector
     */
    const handleOrbClick = () => {
        if (status === 'ready' || status === 'idle') {
            setShowVoiceSelector(!showVoiceSelector);
        }
    };

    if (!isOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-90 backdrop-blur-sm">
            {/* Main content */}
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col h-[600px]">

                {/* Loading Overlay */}
                {(!isReady && isOpen) && (
                    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
                        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-lg font-medium text-gray-700 dark:text-gray-200">Conectando...</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Estableciendo conexión segura</p>
                    </div>
                )}

                {/* Header */}text */}
                <div className="absolute top-12 text-center z-10">
                    <p className="text-lg text-text-secondary">{statusText}</p>
                </div>

                {/* Video Preview (Hidden if off, or shown as background/overlay) */}
                <video
                    ref={videoRef}
                    className={`absolute inset-0 w-full h-full object-cover opacity-30 transition-opacity duration-500 ${isCameraOn ? 'block' : 'hidden'}`}
                    muted
                    playsInline
                />

                {/* Voice orb */}
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
                <div className="absolute bottom-12 flex items-center space-x-6 z-10">
                    {/* Camera toggle */}
                    <button
                        onClick={toggleCamera}
                        className={`p-4 rounded-full transition-all ${isCameraOn
                            ? 'bg-white text-black hover:bg-gray-200'
                            : 'bg-surface-secondary hover:bg-surface-hover text-text-primary'
                            }`}
                        aria-label={isCameraOn ? 'Apagar cámara' : 'Encender cámara'}
                    >
                        {isCameraOn ? (
                            <Video className="w-6 h-6" />
                        ) : (
                            <VideoOff className="w-6 h-6" />
                        )}
                    </button>

                    {/* Switch Camera Button (Only visible when camera is on) */}
                    {isCameraOn && (
                        <button
                            onClick={switchCamera}
                            className="p-4 rounded-full bg-surface-secondary hover:bg-surface-hover transition-colors text-text-primary"
                            aria-label="Cambiar cámara"
                        >
                            <RefreshCcw className="w-6 h-6" />
                        </button>
                    )}

                    {/* Mute/unmute button */}
                    <button
                        onClick={toggleMute}
                        className={`p-4 rounded-full transition-all ${isMuted
                            ? 'bg-red-500 hover:bg-red-600 text-white'
                            : 'bg-surface-secondary hover:bg-surface-hover text-text-primary'
                            }`}
                        aria-label={isMuted ? 'Activar micrófono' : 'Silenciar micrófono'}
                    >
                        {isMuted ? (
                            <MicOff className="w-6 h-6" />
                        ) : (
                            <div className="relative">
                                <Mic className="w-6 h-6" />
                                {/* Active indicator dot */}
                                {!isMuted && status === 'listening' && (
                                    <span className="absolute top-0 right-0 block h-2 w-2 rounded-full ring-2 ring-white bg-green-400 transform translate-x-1/2 -translate-y-1/2" />
                                )}
                            </div>
                        )}
                    </button>

                    {/* Close button */}
                    <button
                        onClick={handleClose}
                        className="p-4 rounded-full bg-surface-secondary hover:bg-surface-hover transition-colors text-text-primary"
                        aria-label="Cerrar modo de voz"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VoiceModal;
