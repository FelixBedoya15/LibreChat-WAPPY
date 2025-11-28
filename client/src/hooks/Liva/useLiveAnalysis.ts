import { useState, useCallback } from 'react';
import { useVoiceSession } from '../useVoiceSession';

interface UseLiveAnalysisProps {
    conversationId?: string;
}

export const useLiveAnalysis = ({ conversationId }: UseLiveAnalysisProps = {}) => {
    const [analysisResult, setAnalysisResult] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    const {
        connect,
        disconnect,
        sendVideoFrame,
        sendTextMessage,
        status,
        isConnected,
        isConnecting
    } = useVoiceSession({
        conversationId,
        onTextReceived: (text) => {
            setAnalysisResult(prev => prev + text);
        },
        onError: (err) => {
            console.error("Live Analysis Error:", err);
            setError(err);
        },
        onStatusChange: (newStatus) => {
            console.log("Live Analysis Status:", newStatus);
        }
    });

    const startAnalysis = useCallback(() => {
        setAnalysisResult('');
        setError(null);
        connect();
    }, [connect]);

    const stopAnalysis = useCallback(() => {
        disconnect();
    }, [disconnect]);

    return {
        startAnalysis,
        stopAnalysis,
        sendVideoFrame,
        sendTextMessage,
        analysisResult,
        error,
        isConnected,
        isConnecting,
        status
    };
};
