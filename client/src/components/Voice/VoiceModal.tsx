import { useState, useEffect, useCallback, useRef, useMemo, type FC } from 'react';
import { useRecoilState } from 'recoil';
import { X, Mic, MicOff, Video, VideoOff, RefreshCcw, Monitor, MonitorOff, PhoneOff } from 'lucide-react';
import { TooltipAnchor } from '@librechat/client'; // Assuming TooltipAnchor is available
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
    model?: string;
    endpoint?: string;
}

const VoiceModal: FC<VoiceModalProps> = ({ isOpen, onClose, conversationId, onConversationIdUpdate, onConversationUpdated, model, endpoint }) => {
    const localize = useLocalize();
    const [voiceChatGeneral, setVoiceChatGeneral] = useRecoilState(store.voiceChatGeneral);
    // Initialize with global state, but ensure we listen to updates
    const [selectedVoice, setSelectedVoice] = useState(voiceChatGeneral);
    const [isReady, setIsReady] = useState(false); // New state for connection delay
    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOn, setIsCameraOn] = useState(false);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
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
        initialVoice: voiceChatGeneral, // Pass the persisted voice
        model, // Pass selected model/agent
        endpoint, // Pass selected endpoint
        onAudioReceived: (audioData: string) => {
            handleAudioReceived(audioData);
        },
        onTextReceived: handleTextReceived,
        onStatusChange: handleStatusChange,
        onError: handleError,
    }), [conversationId, onConversationIdUpdate, onConversationUpdated, voiceChatGeneral, model, endpoint]);

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
            stopMediaTracks(); // Stop both camera and screen share
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
        if (isOpen && isConnected && selectedVoice !== voiceChatGeneral) {
            console.log('[VoiceModal] Syncing voice with global setting:', voiceChatGeneral);
            setSelectedVoice(voiceChatGeneral);
            changeVoice(voiceChatGeneral);
        }
    }, [isOpen, isConnected, isConnecting, connect, changeVoice, voiceChatGeneral]);

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
        stopMediaTracks();
        disconnect();
        onClose();
    };

    /**
     * Stop all media tracks (Camera & Screen Share)
     */
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

    const [supportsScreenShare, setSupportsScreenShare] = useState(false);

    useEffect(() => {
        // Check if getDisplayMedia is supported
        if (navigator.mediaDevices && 'getDisplayMedia' in navigator.mediaDevices) {
            setSupportsScreenShare(true);
        }
    }, []);

    /**
     * Start Camera
     */
    const startCamera = async (mode: 'user' | 'environment' = facingMode) => {
        try {
            stopMediaTracks(); // Ensure no other stream is running

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
            startSendingFrames();

        } catch (error) {
            console.error('[VoiceModal] Error starting camera:', error);
            setStatusText('Error accessing camera');
            setIsCameraOn(false);
        }
    };

    /**
     * Start Screen Share
     */
    const startScreenShare = async () => {
        try {
            stopMediaTracks(); // Ensure no other stream is running

            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    width: { ideal: 1280 }, // Higher res for text readability
                    height: { ideal: 720 },
                    frameRate: { ideal: 10 }
                },
                audio: false // We prioritize microphone audio for voice chat
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
            console.error('[VoiceModal] Error starting screen share:', error);
            // Don't set status text for cancellation
            setIsScreenSharing(false);
        }
    };

    const startSendingFrames = () => {
        // Start sending frames
        videoIntervalRef.current = setInterval(() => {
            if (videoRef.current) {
                sendVideoFrame(videoRef.current);
            }
        }, 1000); // 1 FPS is usually enough for vision context and saves bandwidth
    };

    /**
     * Toggle Camera
     */
    const toggleCamera = () => {
        if (isCameraOn) {
            stopMediaTracks();
        } else {
            startCamera();
        }
    };

    /**
     * Toggle Screen Share
     */
    const toggleScreenShare = () => {
        if (isScreenSharing) {
            stopMediaTracks();
        } else {
            startScreenShare();
        }
    };

    /**
     * Switch Camera (Front/Back)
     */
    const switchCamera = () => {
        const newMode = facingMode === 'user' ? 'environment' : 'user';
        setFacingMode(newMode);

        if (isCameraOn) {
            stopMediaTracks();
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
        if (nextStartTimeRef.current < currentTime) {
            nextStartTimeRef.current = currentTime + 0.05; // 50ms jitter buffer
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

        source.onended = () => {
            setIsPlaying(false);
        };

        setIsPlaying(true);
        source.start(nextStartTimeRef.current);
        nextStartTimeRef.current += buffer.duration;
    }

    /**
     * Clear audio queue and stop playback
     */
    const clearAudioQueue = () => {
        if (audioContextRef.current) {
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
        setVoiceChatGeneral(voiceId); // Update global store
        clearAudioQueue();
        changeVoice(voiceId);
        setShowVoiceSelector(false);
    };

    /**
     * Handle orb click
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
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-md transition-all duration-300">
            {/* Main content - Fullscreen */}
            <div className="relative w-full h-full flex flex-col overflow-hidden">

                {/* Loading Overlay */}
                {(!isReady && isOpen) && (
                    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80">
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                            <span className="text-white font-medium text-lg tracking-wide">{localize('com_ui_connecting')}</span>
                        </div>
                    </div>
                )}

                {/* Header */}
                <div className="absolute top-8 left-0 right-0 text-center z-20 pointer-events-none">
                    <h2 className="text-2xl font-light text-white tracking-wider opacity-90">
                        {statusText || (status === 'listening' ? localize('com_nav_voice_listening') :
                            status === 'speaking' ? localize('com_nav_voice_speaking') :
                                status === 'thinking' ? localize('com_nav_voice_thinking') :
                                    localize('com_nav_voice_ready_label'))}
                    </h2>
                </div>

                {/* Video Preview (Background) */}
                <video
                    ref={videoRef}
                    className={`absolute inset-0 w-full h-full object-cover opacity-40 transition-opacity duration-500 ${isCameraOn || isScreenSharing ? 'block' : 'hidden'}`}
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
                <div className="absolute bottom-12 left-0 right-0 flex items-center justify-center gap-6 z-30">

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

export default VoiceModal;
