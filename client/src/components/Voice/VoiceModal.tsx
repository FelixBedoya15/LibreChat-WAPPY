import { useState, useEffect, useCallback, useRef, type FC } from 'react';
import { X, Mic, MicOff } from 'lucide-react';
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
    const [showVoiceSelector, setShowVoiceSelector] = useState(false);
    const [audioAmplitude, setAudioAmplitude] = useState(0);
    const [statusText, setStatusText] = useState('');

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const audioQueueRef = useRef<AudioBuffer[]>([]);

    // Voice session WebSocket
    const {
        isConnected,
        isConnecting,
        status,
        connect,
        disconnect,
        sendAudio,
        changeVoice,
        interrupt,
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

    // Connect when modal opens
    useEffect(() => {
        if (isOpen && !isConnected && !isConnecting) {
            connect();
            startAudioCapture();
        }

        return () => {
            if (isConnected) {
                stopAudioCapture();
                disconnect();
            }
        };
    }, [isOpen]);

    /**
     * Start capturing audio from microphone
     */
    const startAudioCapture = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    sampleRate: 16000,
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true,
                },
            });

            // Setup audio context for visualization
            const audioContext = new AudioContext({ sampleRate: 16000 });
            audioContextRef.current = audioContext;

            const source = audioContext.createMediaStreamSource(stream);
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            source.connect(analyser);

            // Monitor audio amplitude for visualization
            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            const updateAmplitude = () => {
                if (!isOpen) return;

                analyser.getByteFrequencyData(dataArray);
                const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
                setAudioAmplitude(average / 255);

                requestAnimationFrame(updateAmplitude);
            };
            updateAmplitude();

            // Setup MediaRecorder for audio chunks
            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'audio/webm;codecs=opus',
            });
            mediaRecorderRef.current = mediaRecorder;

            mediaRecorder.ondataavailable = async (event) => {
                if (event.data.size > 0 && !isMuted) {
                    // Convert to base64 and send
                    const arrayBuffer = await event.data.arrayBuffer();
                    const base64 = btoa(
                        String.fromCharCode(...new Uint8Array(arrayBuffer))
                    );
                    sendAudio(base64);
                }
            };

            // Send audio chunks every 100ms
            mediaRecorder.start(100);

        } catch (error) {
            console.error('[VoiceModal] Error starting audio capture:', error);
            handleError('No se pudo acceder al micrófono');
        }
    };

    /**
     * Stop audio capture
     */
    const stopAudioCapture = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
            mediaRecorderRef.current = null;
        }

        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
    };

    /**
     * Handle received audio from Gemini
     */
    function handleAudioReceived(audioData: string) {
        try {
            if (!audioContextRef.current) {
                audioContextRef.current = new AudioContext({ sampleRate: 24000 });
            }

            // Decode base64 to audio buffer
            const binaryString = atob(audioData);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }

            // Decode audio and play
            audioContextRef.current.decodeAudioData(bytes.buffer).then((audioBuffer) => {
                playAudio(audioBuffer);
            });

        } catch (error) {
            console.error('[VoiceModal] Error playing audio:', error);
        }
    }

    /**
     * Play audio buffer
     */
    function playAudio(audioBuffer: AudioBuffer) {
        if (!audioContextRef.current) return;

        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContextRef.current.destination);
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
                <div className="absolute top-12 text-center">
                    <p className="text-lg text-text-secondary">{statusText}</p>
                </div>

                {/* Voice orb */}
                <div className="flex-1 flex items-center justify-center">
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
                <div className="absolute bottom-12 flex items-center space-x-6">
                    {/* Mute/unmute button */}
                    <button
                        onClick={toggleMute}
                        className={`p-4 rounded-full transition-all ${isMuted
                            ? 'bg-red-500 hover:bg-red-600'
                            : 'bg-surface-secondary hover:bg-surface-hover'
                            }`}
                        aria-label={isMuted ? 'Activar micrófono' : 'Silenciar micrófono'}
                    >
                        {isMuted ? (
                            <MicOff className="w-6 h-6 text-white" />
                        ) : (
                            <Mic className="w-6 h-6 text-text-primary" />
                        )}
                    </button>

                    {/* Close button */}
                    <button
                        onClick={onClose}
                        className="p-4 rounded-full bg-surface-secondary hover:bg-surface-hover transition-colors"
                        aria-label="Cerrar modo de voz"
                    >
                        <X className="w-6 h-6 text-text-primary" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VoiceModal;
