import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuthContext } from '~/hooks/AuthContext';

interface VoiceMessage {
    type: 'audio' | 'text' | 'status' | 'error';
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
    const audioQueueRef = useRef<string[]>([]);

    /**
     * Connect to voice WebSocket
     */
    const connect = useCallback(async () => {
        if (isConnected || isConnecting) {
            return;
        }

        setIsConnecting(true);
        setStatus('connecting');

        try {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const host = window.location.host;
            const wsUrl = `${protocol}//${host}/ws/voice?token=${encodeURIComponent(token)}`;

            console.log('[VoiceSession] Connecting to:', wsUrl);
            const ws = new WebSocket(wsUrl);
            wsRef.current = ws;

            ws.onopen = () => {
                console.log('[VoiceSession] Connected to voice WebSocket');
                setIsConnected(true);
                setIsConnecting(false);
                setStatus('ready');
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
                wsRef.current = null;
            };

        } catch (error) {
            console.error('[VoiceSession] Connection error:', error);
            setIsConnecting(false);
            setStatus('idle');
            options.onError?.('Failed to connect to voice service');
        }
    }, [isConnected, isConnecting, token, options]);

    /**
     * Handle incoming WebSocket message
     */
    const handleMessage = useCallback((message: VoiceMessage) => {
        switch (message.type) {
            case 'audio':
                // Audio response from Gemini
                if (message.data.audioData) {
                    options.onAudioReceived?.(message.data.audioData);
                    audioQueueRef.current.push(message.data.audioData);
                    setStatus('speaking');
                }
                break;

            case 'text':
                // Text response (transcription or thinking)
                if (message.data.text) {
                    options.onTextReceived?.(message.data.text);
                }
                break;

            case 'status':
                // Status update
                const newStatus = message.data.status;
                if (newStatus === 'ready') {
                    setStatus('ready');
                } else if (newStatus === 'turn_complete') {
                    setStatus('ready');
                } else if (newStatus === 'interrupted') {
                    setStatus('listening');
                }
                options.onStatusChange?.(newStatus);
                break;

            case 'error':
                // Error message
                options.onError?.(message.data.message);
                break;
        }
    }, [options]);

    /**
     * Send audio data to Gemini
     */
    const sendAudio = useCallback((audioData: string) => {
        if (!isConnected || !wsRef.current) {
            console.warn('[VoiceSession] Cannot send audio, not connected');
            return;
        }

        const message = {
            type: 'audio',
            data: { audioData },
        };

        wsRef.current.send(JSON.stringify(message));
        setStatus('listening');
    }, [isConnected]);

    /**
     * Change voice
     */
    const changeVoice = useCallback((voice: string) => {
        if (!isConnected || !wsRef.current) {
            return;
        }

        const message = {
            type: 'config',
            data: { voice },
        };

        wsRef.current.send(JSON.stringify(message));
    }, [isConnected]);

    /**
     * Send interrupt signal
     */
    const interrupt = useCallback(() => {
        if (!isConnected || !wsRef.current) {
            return;
        }

        const message = {
            type: 'interrupt',
            data: {},
        };

        wsRef.current.send(JSON.stringify(message));
        setStatus('listening');
    }, [isConnected]);

    /**
     * Disconnect from voice WebSocket
     */
    const disconnect = useCallback(() => {
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
        setIsConnected(false);
        setStatus('idle');
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, []);

    return {
        isConnected,
        isConnecting,
        status,
        connect,
        disconnect,
        sendAudio,
        changeVoice,
        interrupt,
    };
};
