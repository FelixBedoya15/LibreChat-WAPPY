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
}

export const useVoiceSession = (options: UseVoiceSessionOptions = {}) => {
    const { token } = useAuthContext();
    const { conversationId, disableAudio } = options;
    // ... (rest of state)

    // ...

    ws.onopen = async () => {
        console.log('[VoiceSession] Connected');
        setIsConnected(true);
        setIsConnecting(false);
        setStatus('ready');

        // Start audio capture immediately upon connection for "Live" feel
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
    }, [isConnected, isConnecting, token, options]);

/**
 * Handle incoming WebSocket message
 */
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

                // AUTO-MUTE: Mute microphone when AI starts speaking
                // This prevents feedback loop where mic captures AI audio from speakers
                console.log('[VoiceSession] AI speaking - auto-muting microphone');
                isMutedRef.current = true;

                // Safety: Auto-unmute after 10 seconds if status doesn't change
                if (autoMuteTimeoutRef.current) {
                    clearTimeout(autoMuteTimeoutRef.current);
                }
                autoMuteTimeoutRef.current = setTimeout(() => {
                    console.log('[VoiceSession] Safety auto-unmute timeout');
                    isMutedRef.current = false;
                    autoMuteTimeoutRef.current = null; // Clear ref after timeout
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

            // AUTO-UNMUTE: Unmute when AI finishes speaking
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
            // Handle interruption (stop playback, clear queues)
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

    // Stop audio capture (cleans: stream, worklet, audioContext)
    stopAudioCapture();

    // Close WebSocket
    if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
    }

    // Clear timeout if exists
    if (autoMuteTimeoutRef.current) {
        clearTimeout(autoMuteTimeoutRef.current);
        autoMuteTimeoutRef.current = null;
    }

    // Reset all refs to clean state
    isMutedRef.current = false;
    inputAnalyserRef.current = null;
    videoCanvasRef.current = null;

    // Reset states
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
