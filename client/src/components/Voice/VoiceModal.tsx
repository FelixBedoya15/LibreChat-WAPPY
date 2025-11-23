import { useState, useEffect, useCallback, useRef, type FC } from 'react';
import { X, Mic, MicOff, Video, VideoOff } from 'lucide-react';
import VoiceOrb from './VoiceOrb';
import VoiceSelector from './VoiceSelector';
import { useVoiceSession } from '~/hooks/useVoiceSession';
import { useLocalize } from '~/hooks';

interface VoiceModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const VoiceModal: FC<VoiceModalProps> = ({ isOpen, onClose }) => {
    const localize = useLocalize();
    const [selectedVoice, setSelectedVoice] = useState('sol');
    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOn, setIsCameraOn] = useState(false);
    const [showVoiceSelector, setShowVoiceSelector] = useState(false);
    const [audioAmplitude, setAudioAmplitude] = useState(0);
    const [statusText, setStatusText] = useState('');

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
    } = useVoiceSession({
        onAudioReceived: handleAudioReceived,
        onTextReceived: handleTextReceived,
        onStatusChange: handleStatusChange,
        onError: handleError,
    });

    // Update status text based on current status
    useEffect(() => {
        switch (status) {
            case 'connecting':
                setStatusText('Conectando...');
                break;
            case 'ready':
                setStatusText('Listo para escuchar');
                break;
            case 'listening':
                setStatusText('Escuchando...');
                break;
            case 'thinking':
                setStatusText('Pensando...');
                break;
            case 'speaking':
                setStatusText('Hablando...');
                break;
            default:
                setStatusText('');
        }
    }, [status]);

    // Connect on mount, disconnect on unmount
    useEffect(() => {
        connect();
        return () => {
            stopCamera();
            disconnect();
        };
    }, []); // Empty dependency array to run only once on mount

    const handleClose = () => {
        disconnect();
        onClose();
    };

    // Handle Camera
    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'user'
                }
            });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play();
            }

            setIsCameraOn(true);

            // Start sending frames
            videoIntervalRef.current = setInterval(() => {
                if (videoRef.current && isConnected) {
                    sendVideoFrame(videoRef.current);
                }
            }, 1000); // 1 FPS is enough for "Live" context usually, can increase if needed

        } catch (error) {
            console.error('[VoiceModal] Error starting camera:', error);
            handleError('No se pudo acceder a la cámara');
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }

        if (videoIntervalRef.current) {
            clearInterval(videoIntervalRef.current);
            videoIntervalRef.current = null;
        }

        setIsCameraOn(false);
    };

    const toggleCamera = () => {
        if (isCameraOn) {
            stopCamera();
        } else {
            startCamera();
        }
    };

    const [audioQueue, setAudioQueue] = useState<AudioBuffer[]>([]);
    const [isPlaying, setIsPlaying] = useState(false);

    /**
     * Handle received audio from Gemini
     */
    function handleAudioReceived(audioData: string) {
        try {
            if (!audioContextRef.current) {
                audioContextRef.current = new AudioContext({ sampleRate: 24000 });
            }

            // Resume context if suspended (common browser policy)
            if (audioContextRef.current.state === 'suspended') {
                audioContextRef.current.resume();
            }

            // Decode base64 to binary
            const binaryString = atob(audioData);
            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }

            // Convert PCM 16-bit LE to Float32 using DataView for explicit endianness
            const dataView = new DataView(bytes.buffer);
            const float32Data = new Float32Array(len / 2);

            for (let i = 0; i < len / 2; i++) {
                const int16 = dataView.getInt16(i * 2, true); // true = Little Endian
                float32Data[i] = int16 / 32768.0;
            }

            // Create AudioBuffer
            const audioBuffer = audioContextRef.current.createBuffer(1, float32Data.length, 24000);
            audioBuffer.getChannelData(0).set(float32Data);

            console.log(`[VoiceModal] Received audio chunk: ${float32Data.length} samples`);

            // Add to queue
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

        // Connect to analyzer for visualization
        const analyser = audioContextRef.current.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyser.connect(audioContextRef.current.destination);

        // Visualize output audio
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const updateAmplitude = () => {
            if (!isPlaying) return;
            analyser.getByteFrequencyData(dataArray);
            const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
            // Boost the visual amplitude a bit
            setAudioAmplitude(Math.min(1, (average / 255) * 2));
            requestAnimationFrame(updateAmplitude);
        };
        requestAnimationFrame(updateAmplitude);

        source.onended = () => {
            setIsPlaying(false);
            setAudioAmplitude(0); // Reset amplitude
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
        setIsMuted(!isMuted);
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
                            <Mic className="w-6 h-6" />
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
