import { useEffect, useRef, useMemo, useCallback } from 'react';
import { useRecoilState } from 'recoil';
import { useToastContext } from '@librechat/client';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import useGetAudioSettings from './useGetAudioSettings';
import store from '~/store';

import { useParams } from 'react-router-dom';

const useSpeechToTextBrowser = (
  setText: (text: string) => void,
  onTranscriptionComplete: (text: string) => void,
) => {
  const { showToast } = useToastContext();
  const { speechToTextEndpoint } = useGetAudioSettings();
  const isBrowserSTTEnabled = speechToTextEndpoint === 'browser';

  const lastTranscript = useRef<string | null>(null);
  const lastInterim = useRef<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>();
  const [autoSendText] = useRecoilState(store.autoSendText);
  const [languageSTT] = useRecoilState<string>(store.languageSTT);
  const [autoTranscribeAudio] = useRecoilState<boolean>(store.autoTranscribeAudio);

  const {
    listening,
    finalTranscript,
    resetTranscript,
    interimTranscript,
    isMicrophoneAvailable,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();
  const isListening = useMemo(() => listening, [listening]);

  useEffect(() => {
    if (interimTranscript == null || interimTranscript === '') {
      return;
    }

    if (lastInterim.current === interimTranscript) {
      return;
    }

    setText(interimTranscript);
    lastInterim.current = interimTranscript;
  }, [setText, interimTranscript]);

  const { conversation: conversationId } = useParams();

  const correctTranscription = async (text: string) => {
    console.log('[useSpeechToTextBrowser] Attempting to correct:', text);
    try {
      const response = await fetch('/api/speech/correct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, conversationId }),
      });
      if (response.ok) {
        const data = await response.json();
        console.log('[useSpeechToTextBrowser] Correction result:', data.text);
        return data.text || text;
      }
      console.warn('[useSpeechToTextBrowser] Correction failed, using original text');
      return text;
    } catch (error) {
      console.error('[useSpeechToTextBrowser] Correction error:', error);
      return text;
    }
  };

  // Wrapper that resets transcript after completion callback
  const wrappedOnTranscriptionComplete = useCallback(
    (text: string) => {
      onTranscriptionComplete(text);
      // CRITICAL: Reset transcript AFTER every message send (manual OR auto)
      setTimeout(() => {
        resetTranscript();
        lastTranscript.current = null;
        lastInterim.current = null;
      }, 100);
    },
    [onTranscriptionComplete, resetTranscript],
  );

  useEffect(() => {
    if (finalTranscript == null || finalTranscript === '') {
      return;
    }

    if (lastTranscript.current === finalTranscript) {
      return;
    }

    setText(finalTranscript);
    lastTranscript.current = finalTranscript;

    if (autoSendText > -1 && finalTranscript.length > 0) {
      timeoutRef.current = setTimeout(async () => {
        const corrected = await correctTranscription(finalTranscript);
        setText(corrected);
        // Use wrapped version that auto-resets
        wrappedOnTranscriptionComplete(corrected);
      }, autoSendText * 1000);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [setText, wrappedOnTranscriptionComplete, finalTranscript, autoSendText, conversationId]);

  const toggleListening = () => {
    console.log('[useSpeechToTextBrowser] toggleListening called, isListening:', isListening);
    if (!browserSupportsSpeechRecognition) {
      showToast({
        message: 'Browser does not support SpeechRecognition',
        status: 'error',
      });
      return;
    }

    if (!isMicrophoneAvailable) {
      showToast({
        message: 'Microphone is not available',
        status: 'error',
      });
      return;
    }

    if (isListening === true) {
      console.log('[useSpeechToTextBrowser] Stopping microphone');
      SpeechRecognition.stopListening();
      resetTranscript();
      setText(''); // Force clear external text state
    } else {
      console.log('[useSpeechToTextBrowser] Starting microphone');
      SpeechRecognition.startListening({
        language: languageSTT,
        continuous: autoTranscribeAudio,
      });
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && e.altKey && e.code === 'KeyL' && !isBrowserSTTEnabled) {
        toggleListening();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const manualReset = () => {
    resetTranscript();
    setText(''); // Force clear external text state
    lastTranscript.current = null;
    lastInterim.current = null;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  return {
    isListening,
    isLoading: false,
    startRecording: toggleListening,
    stopRecording: toggleListening,
    reset: manualReset,
  };
};

export default useSpeechToTextBrowser;
