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
        await audioContext.audioWorklet.addModule('/audio-processor.js');
        audioContextRef.current = audioContext;
        return audioContext;
    };

    /**
     * Start Audio Capture
     */
    const startAudioCapture = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    sampleRate: 16000,
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                }
            });
            streamRef.current = stream;

            const audioContext = await initAudioContext();
            const source = audioContext.createMediaStreamSource(stream);
            const workletNode = new AudioWorkletNode(audioContext, 'pcm-processor');

            workletNode.port.onmessage = (event) => {
                if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                    // Convert ArrayBuffer to Base64
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

            source.connect(workletNode);
            workletNode.connect(audioContext.destination); // Necessary to keep the processor alive? Usually not for input only, but sometimes yes.
            // Actually, for input-only worklets, we don't need to connect to destination if we don't want to hear ourselves.
            // But we need to keep the graph active. connecting to destination might cause feedback loop if not careful.
            // Better to not connect to destination if we don't want playback.
            // source.connect(workletNode); 
            // workletNodeRef.current = workletNode;

            // To keep it alive without outputting audio:
            // workletNode.connect(audioContext.destination); 
            // But we mute the destination? No.
            // Chrome requires the node to be connected to destination or have a parameter being automated to run.
            // Let's try connecting but maybe we need to mute it?
            // Actually, getUserMedia stream -> Worklet -> (Processing) -> PostMessage.
            // If we connect to destination, the user will hear themselves.
            // We can create a GainNode with gain 0.
            const gainNode = audioContext.createGain();
            gainNode.gain.value = 0;
            workletNode.connect(gainNode);
            gainNode.connect(audioContext.destination);

            workletNodeRef.current = workletNode;
            setStatus('listening');

        } catch (error) {
            console.error('[VoiceSession] Error starting audio capture:', error);
            options.onError?.('Failed to access microphone');
        }
    };

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
        // Don't close AudioContext, reuse it
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
    };
};
