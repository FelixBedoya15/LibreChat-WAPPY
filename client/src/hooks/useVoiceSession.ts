import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuthContext } from '~/hooks/AuthContext';

interface VoiceMessage {
    type: 'audio' | 'text' | 'status' | 'error' | 'interrupted' | 'conversationId' | 'conversationUpdated';
    data: any;
}

interface UseVoiceSessionOptions {
    onAudioReceived?: (audioData: string) => void;
    onTextReceived?: (text: string) => void;
    onStatusChange?: (status: string) => void;
    onError?: (error: string) => void;
    conversationId?: string;
    onConversationIdUpdate?: (newId: string) => void;
    onConversationUpdated?: () => void;
    disableAudio?: boolean;
    disableAudio?: boolean;
    mode?: 'chat' | 'live_analysis';
    initialVoice?: string;
}

export const useVoiceSession = (options: UseVoiceSessionOptions = {}) => {
    const { token } = useAuthContext();
    const { conversationId, disableAudio } = options;
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [status, setStatus] = useState<'idle' | 'connecting' | 'ready' | 'listening' | 'thinking' | 'speaking'>('idle');

    const wsRef = useRef<WebSocket | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const workletNodeRef = useRef<AudioWorkletNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const videoCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const isMutedRef = useRef(false);
    const autoMuteTimeoutRef = useRef<NodeJS.Timeout | null>(null);
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
                        constructor() {
                            super();
                            this.bufferSize = 2048; // Send ~128ms chunks at 16kHz
                            this.buffer = new Float32Array(this.bufferSize);
                            this.bufferIndex = 0;
                        }

                        process(inputs, outputs, parameters) {
                            const input = inputs[0];
                            if (!input || !input.length) return true;
                            
                            const inputChannel = input[0];
                            
                            for (let i = 0; i < inputChannel.length; i++) {
                                this.buffer[this.bufferIndex++] = inputChannel[i];
                                
                                // When buffer is full, flush it
                                if (this.bufferIndex >= this.bufferSize) {
                                    const int16Data = new Int16Array(this.bufferSize);
                                    for (let j = 0; j < this.bufferSize; j++) {
                                        const s = Math.max(-1, Math.min(1, this.buffer[j]));
                                        int16Data[j] = s < 0 ? s * 0x8000 : s * 0x7FFF;
                                    }
                                    
                                    this.port.postMessage(int16Data.buffer);
                                    this.bufferIndex = 0;
                                }
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
                if (isMutedRef.current) return; // Do not send audio if muted

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
            if (audioContextRef.current.state !== 'closed') {
                audioContextRef.current.close().catch(console.error);
            }
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

        const width = 320;
        const height = 240;

        if (canvas.width !== width) canvas.width = width;
        if (canvas.height !== height) canvas.height = height;

        context.drawImage(videoElement, 0, 0, width, height);

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
            let wsUrl = `${protocol}//${host}/ws/voice?token=${encodeURIComponent(token || '')}&conversationId=${encodeURIComponent(conversationId || '')}&mode=${encodeURIComponent(options.mode || 'chat')}`;

            if (options.initialVoice) {
                wsUrl += `&initialVoice=${encodeURIComponent(options.initialVoice)}`;
            }

            console.log('[VoiceSession] Connecting to:', wsUrl);
            const ws = new WebSocket(wsUrl);
            wsRef.current = ws;

            ws.onopen = async () => {
                console.log('[VoiceSession] Connected');
                setIsConnected(true);
                setIsConnecting(false);
                setStatus('ready');

                if (!disableAudio) {
                    await startAudioCapture();
                }
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
    }, [isConnected, isConnecting, token, conversationId, disableAudio, options]); // Added deps

    // FIX: Use ref to access latest options without reconnecting WebSocket
    const optionsRef = useRef(options);
    useEffect(() => {
        optionsRef.current = options;
    }, [options]);

    /**
     * Handle incoming messages from WebSocket
     */
    const handleMessage = useCallback(async (message: VoiceMessage) => {
        switch (message.type) {
            case 'audio':
                if (message.data.audioData) {
                    optionsRef.current.onAudioReceived?.(message.data.audioData);
                    setStatus('speaking');

                    console.log('[VoiceSession] AI speaking - auto-muting microphone');
                    isMutedRef.current = true;

                    if (autoMuteTimeoutRef.current) {
                        clearTimeout(autoMuteTimeoutRef.current);
                    }
                    autoMuteTimeoutRef.current = setTimeout(() => {
                        console.log('[VoiceSession] Safety auto-unmute timeout');
                        isMutedRef.current = false;
                        autoMuteTimeoutRef.current = null;
                    }, 10000);
                }
                break;

            case 'text':
                if (message.data.text) {
                    optionsRef.current.onTextReceived?.(message.data.text);
                }
                break;

            case 'status':
                const newStatus = message.data.status;
                setStatus(newStatus);
                optionsRef.current.onStatusChange?.(newStatus);

                if (newStatus === 'listening' || newStatus === 'turn_complete') {
                    console.log('[VoiceSession] AI finished speaking - auto-unmuting microphone');
                    isMutedRef.current = false;
                    if (autoMuteTimeoutRef.current) {
                        clearTimeout(autoMuteTimeoutRef.current);
                        autoMuteTimeoutRef.current = null;
                    }
                }
                break;

            case 'interrupted':
                setStatus('listening');
                optionsRef.current.onStatusChange?.('interrupted');
                break;

            case 'error':
                optionsRef.current.onError?.(message.data.message);
                break;

            case 'conversationId':
                if (message.data.conversationId) {
                    optionsRef.current.onConversationIdUpdate?.(message.data.conversationId);
                }
                break;

            case 'conversationUpdated':
                console.log('[VoiceSession] Conversation updated event received from WS');
                if (optionsRef.current.onConversationUpdated) {
                    console.log('[VoiceSession] Executing onConversationUpdated callback');
                    optionsRef.current.onConversationUpdated();
                } else {
                    console.warn('[VoiceSession] No onConversationUpdated callback defined');
                }
                break;
        }
    }, []);

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
        console.log('[VoiceSession] Disconnecting and cleaning up...');

        stopAudioCapture();

        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }

        if (autoMuteTimeoutRef.current) {
            clearTimeout(autoMuteTimeoutRef.current);
            autoMuteTimeoutRef.current = null;
        }

        isMutedRef.current = false;
        inputAnalyserRef.current = null;
        videoCanvasRef.current = null;

        setIsConnected(false);
        setIsConnecting(false);
        setStatus('idle');

        console.log('[VoiceSession] Cleanup complete, ready for reconnection');
    }, []);

    // Cleanup
    useEffect(() => {
        return () => {
            stopAudioCapture();
            if (wsRef.current) wsRef.current.close();
        };
    }, []);

    /**
     * Mute/Unmute
     */
    const setMuted = useCallback((muted: boolean) => {
        isMutedRef.current = muted;
    }, []);

    /**
     * Send Text Message
     */
    const sendTextMessage = useCallback((text: string) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
        wsRef.current.send(JSON.stringify({
            type: 'message',
            data: { text }
        }));
    }, []);

    return {
        isConnected,
        isConnecting,
        status,
        connect,
        disconnect,
        sendVideoFrame,
        sendTextMessage,
        changeVoice,
        getInputVolume,
        setMuted,
    };
};
