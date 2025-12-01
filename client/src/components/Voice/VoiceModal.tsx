import { useState, useEffect, useCallback, useRef, type FC } from 'react';
import { useRecoilValue } from 'recoil';
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
    const voiceChatGeneral = useRecoilValue(store.voiceChatGeneral);
    const [selectedVoice, setSelectedVoice] = useState(voiceChatGeneral);
    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOn, setIsCameraOn] = useState(false);
    const [showVoiceSelector, setShowVoiceSelector] = useState(false);
    const [audioAmplitude, setAudioAmplitude] = useState(0);
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
        changeVoice,
        getInputVolume,
        setMuted,
    } = useVoiceSession({
        conversationId,
        onConversationIdUpdate,
        onConversationUpdated,
        onAudioReceived: (audioData) => {
            handleAudioReceived(audioData);
        },
        onTextReceived: handleTextReceived,
        onStatusChange: handleStatusChange,
        onError: handleError,
    });

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
            // Ensure voice is updated on reconnect
            changeVoice(voiceChatGeneral);
        }
    }, [isOpen, isConnected, isConnecting, connect, changeVoice, voiceChatGeneral]);

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

            setAudioQueue(prev => [...prev, audioBuffer]);

        } catch (error) {
            console.error('[VoiceModal] Error processing audio:', error);
        }
    }

    // Process Audio Queue
    useEffect(() => {
        if (!isPlaying && audioQueue.length > 0 && audioContextRef.current) {
            const buffer = audioQueue[0];
            setAudioQueue(prev => prev.slice(1));
            playAudio(buffer);
        }
    }, [audioQueue, isPlaying]);

    /**
     * Play audio buffer
     */
    function playAudio(audioBuffer: AudioBuffer) {
        if (!audioContextRef.current) return;

        setIsPlaying(true);
        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBuffer;

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

        source.start();
    }

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
            <div className="relative flex flex-col items-center justify-center w-full h-full p-8">
                {/* Status text */}
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
