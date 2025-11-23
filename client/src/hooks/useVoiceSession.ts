import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuthContext } from '~/hooks/AuthContext';

interface VoiceMessage {
    type: 'audio' | 'text' | 'status' | 'error' | 'interrupted';
    data: any;
}

interface UseVoiceSessionOptions {
    onAudioReceived?: (audioData: string) => void;
    onTextReceived?: (text: string) => void;
    onStatusChange?: (status: string) => void;
    onError?: (error: string) => void;
}

export const useVoiceSession = (options: UseVoiceSessionOptions = {}) => {
    const { token } = useAuthContext();
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [status, setStatus] = useState<'idle' | 'connecting' | 'ready' | 'listening' | 'thinking' | 'speaking'>('idle');

    const wsRef = useRef<WebSocket | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const workletNodeRef = useRef<AudioWorkletNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const videoCanvasRef = useRef<HTMLCanvasElement | null>(null);

    /**
     * Initialize Audio Context and Worklet
     */
    const initAudioContext = async () => {
        if (audioContextRef.current) return audioContextRef.current;

        const audioContext = new AudioContext({ sampleRate: 16000 });

        // AudioWorklet code embedded as string to avoid loading issues
        const workletCode = `
            class PCMProcessor extends AudioWorkletProcessor {
                process(inputs, outputs, parameters) {
                    const input = inputs[0];
                    if (!input || !input.length) return true;
                    const channelData = input[0];
                    const pcmData = new Int16Array(channelData.length);
                    for (let i = 0; i < channelData.length; i++) {
                        const s = Math.max(-1, Math.min(1, channelData[i]));
                        pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
                    }
                    this.port.postMessage(pcmData.buffer, [pcmData.buffer]);
                    return true;
                }
            }
            registerProcessor('pcm-processor', PCMProcessor);
        `;

        const blob = new Blob([workletCode], { type: 'application/javascript' });
        const workletUrl = URL.createObjectURL(blob);

        try {
            await audioContext.audioWorklet.addModule(workletUrl);
        } finally {
            URL.revokeObjectURL(workletUrl);
        }

        audioContextRef.current = audioContext;
        return audioContext;
    };

    /**
     * Start Audio Capture
     */
    const inputAnalyserRef = useRef<AnalyserNode | null>(null);

    /**
     * Start Audio Capture
     */
    const startAudioCapture = async () => {
        try {
            console.log('[VoiceSession] Starting audio capture...');

            // 1. Get Microphone Stream
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    channelCount: 1,
                    sampleRate: 16000,
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                },
                video: false
            });
            streamRef.current = stream;

            // 2. Initialize or Reuse AudioContext
            let audioContext = audioContextRef.current;
            if (!audioContext || audioContext.state === 'closed') {
                console.log('[VoiceSession] Creating new AudioContext (16kHz)');
                audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
                    sampleRate: 16000,
                });
                audioContextRef.current = audioContext;

                // Load AudioWorklet Module ONLY when creating context
                const workletCode = `
                    class PCMProcessor extends AudioWorkletProcessor {
                        process(inputs, outputs, parameters) {
                            const input = inputs[0];
                            if (input.length > 0) {
                                const inputChannel = input[0];
                                const int16Data = new Int16Array(inputChannel.length);
                                for (let i = 0; i < inputChannel.length; i++) {
                                    const s = Math.max(-1, Math.min(1, inputChannel[i]));
                                    int16Data[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
                                }
                                this.port.postMessage(int16Data.buffer);
                            }
                            return true;
                        }
                    }
                    registerProcessor('pcm-processor', PCMProcessor);
                `;

                const blob = new Blob([workletCode], { type: 'application/javascript' });
                const workletUrl = URL.createObjectURL(blob);

                try {
                    await audioContext.audioWorklet.addModule(workletUrl);
                    console.log('[VoiceSession] AudioWorklet module loaded');
                } finally {
                    URL.revokeObjectURL(workletUrl);
                }
            } else if (audioContext.state === 'suspended') {
                console.log('[VoiceSession] Resuming AudioContext');
                await audioContext.resume();
            }

            // 3. Create Audio Graph
            const source = audioContext.createMediaStreamSource(stream);
            const workletNode = new AudioWorkletNode(audioContext, 'pcm-processor');

            // Input Analyser for Visualization
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            inputAnalyserRef.current = analyser;

            // Connect: Source -> Analyser -> Worklet -> Gain(0) -> Destination
            source.connect(analyser);
            analyser.connect(workletNode);

            workletNode.port.onmessage = (event) => {
                if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                    const bytes = new Uint8Array(event.data);
                    let binary = '';
                    for (let i = 0; i < bytes.byteLength; i++) {
                        binary += String.fromCharCode(bytes[i]);
                    }
                    const base64 = btoa(binary);

                    wsRef.current.send(JSON.stringify({
                        type: 'audio',
                        data: { audioData: base64 }
                    }));
                }
            };

            // Keep worklet alive
            const gainNode = audioContext.createGain();
            gainNode.gain.value = 0;
            workletNode.connect(gainNode);
            gainNode.connect(audioContext.destination);

            workletNodeRef.current = workletNode;

            // Only set status to listening if we are already connected/ready
            // (Avoid overriding 'connecting' status if called too early)
            if (status === 'ready' || status === 'speaking') {
                setStatus('listening');
            }

        } catch (error: any) {
            console.error('[VoiceSession] Error starting audio capture:', error);
            let errorMessage = 'Failed to access microphone';
            if (error.name === 'NotAllowedError') errorMessage = 'Microphone permission denied';
            if (error.name === 'NotFoundError') errorMessage = 'No microphone found';
            if (error.name === 'NotReadableError') errorMessage = 'Microphone is busy';
            if (error.name === 'OverconstrainedError') errorMessage = 'Microphone constraints not satisfied';

            options.onError?.(`${errorMessage}: ${error.message}`);
        }
    };

    /**
     * Get current input volume (0-1)
     */
    const getInputVolume = useCallback(() => {
        if (!inputAnalyserRef.current) return 0;
        const dataArray = new Uint8Array(inputAnalyserRef.current.frequencyBinCount);
        inputAnalyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        // Normalize and apply a slight boost curve
        return Math.min(1, (average / 128));
    }, []);

    /**
     * Stop Audio Capture
     */
    const stopAudioCapture = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (workletNodeRef.current) {
            workletNodeRef.current.disconnect();
            workletNodeRef.current = null;
        }
        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
    };

    /**
     * Send Video Frame
     */
    const sendVideoFrame = useCallback((videoElement: HTMLVideoElement) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

        if (!videoCanvasRef.current) {
            videoCanvasRef.current = document.createElement('canvas');
        }

        const canvas = videoCanvasRef.current;
        const context = canvas.getContext('2d');
        if (!context) return;

        // Resize canvas to a reasonable size for AI (e.g., 640x480 or smaller)
        // Gemini handles various sizes, but smaller is faster.
        const width = 320;
        const height = 240;

        if (canvas.width !== width) canvas.width = width;
        if (canvas.height !== height) canvas.height = height;

        context.drawImage(videoElement, 0, 0, width, height);

        // Get JPEG base64
        const base64 = canvas.toDataURL('image/jpeg', 0.7).split(',')[1];

        wsRef.current.send(JSON.stringify({
            type: 'video',
            data: { image: base64 }
        }));

    }, []);

    /**
     * Connect to voice WebSocket
     */
    const connect = useCallback(async () => {
        if (isConnected || isConnecting) return;

        setIsConnecting(true);
        setStatus('connecting');

        try {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const host = window.location.host;
            const wsUrl = `${protocol}//${host}/ws/voice?token=${encodeURIComponent(token || '')}`;

            console.log('[VoiceSession] Connecting to:', wsUrl);
            const ws = new WebSocket(wsUrl);
            wsRef.current = ws;

            ws.onopen = async () => {
                console.log('[VoiceSession] Connected');
                setIsConnected(true);
                setIsConnecting(false);
                setStatus('ready');

                // Start audio capture immediately upon connection for "Live" feel
                await startAudioCapture();
            };

            ws.onmessage = (event) => {
                try {
                    const message: VoiceMessage = JSON.parse(event.data);
                    handleMessage(message);
                } catch (error) {
                    console.error('[VoiceSession] Error parsing message:', error);
                }
            };

            ws.onerror = (error) => {
                console.error('[VoiceSession] WebSocket error:', error);
                options.onError?.('WebSocket connection error');
                setStatus('idle');
            };

            ws.onclose = (event) => {
                console.log('[VoiceSession] WebSocket closed:', event.code, event.reason);
                setIsConnected(false);
                setIsConnecting(false);
                setStatus('idle');
                stopAudioCapture();
                wsRef.current = null;
            };

        } catch (error) {
            console.error('[VoiceSession] Connection error:', error);
            setIsConnecting(false);
            setStatus('idle');
            options.onError?.('Failed to connect');
        }
    }, [isConnected, isConnecting, token, options]);

    /**
     * Handle incoming WebSocket message
     */
    const handleMessage = useCallback((message: VoiceMessage) => {
        switch (message.type) {
            case 'audio':
                if (message.data.audioData) {
                    options.onAudioReceived?.(message.data.audioData);
                    setStatus('speaking');
                }
                break;

            case 'text':
                if (message.data.text) {
                    options.onTextReceived?.(message.data.text);
                }
                break;

            case 'status':
                const newStatus = message.data.status;
                if (newStatus === 'ready') setStatus('ready');
                else if (newStatus === 'listening') setStatus('listening');
                options.onStatusChange?.(newStatus);
                break;

            case 'interrupted':
                // Handle interruption (stop playback, clear queues)
                setStatus('listening');
                options.onStatusChange?.('interrupted');
                break;

            case 'error':
                options.onError?.(message.data.message);
                break;
        }
    }, [options]);

    /**
     * Change voice
     */
    const changeVoice = useCallback((voice: string) => {
        if (!wsRef.current) return;
        wsRef.current.send(JSON.stringify({
            type: 'config',
            data: { voice },
        }));
    }, []);

    /**
     * Disconnect
     */
    const disconnect = useCallback(() => {
        stopAudioCapture();
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
        setIsConnected(false);
        setStatus('idle');
    }, []);

    // Cleanup
    useEffect(() => {
        return () => {
            stopAudioCapture();
            if (wsRef.current) wsRef.current.close();
        };
    }, []);

    return {
        isConnected,
        isConnecting,
        status,
        connect,
        disconnect,
        sendVideoFrame,
        changeVoice,
        getInputVolume,
    };
};
