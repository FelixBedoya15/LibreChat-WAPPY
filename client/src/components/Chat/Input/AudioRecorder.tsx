import { useCallback, useRef, useEffect } from 'react';
import { useToastContext, TooltipAnchor, ListeningIcon, Spinner } from '@librechat/client';
import { useLocalize, useSpeechToText, useGetAudioSettings } from '~/hooks';
import { useChatFormContext } from '~/Providers';
import { globalAudioId } from '~/common';
import { cn } from '~/utils';

const isExternalSTT = (speechToTextEndpoint: string) => speechToTextEndpoint === 'external';
export default function AudioRecorder({
  disabled,
  ask,
  methods,
  textAreaRef,
  isSubmitting,
}: {
  disabled: boolean;
  ask: (data: { text: string }) => void;
  methods: ReturnType<typeof useChatFormContext>;
  textAreaRef: React.RefObject<HTMLTextAreaElement>;
  isSubmitting: boolean;
}) {
  const { setValue, reset, getValues } = methods;
  const localize = useLocalize();
  const { showToast } = useToastContext();
  const { speechToTextEndpoint } = useGetAudioSettings();

  const existingTextRef = useRef<string>('');
  const resetTranscriptRef = useRef<(() => void) | null>(null);
  const shouldCloseMicRef = useRef(false);

  const onTranscriptionComplete = useCallback(
    (text: string) => {
      if (isSubmitting) {
        showToast({
          message: localize('com_ui_speech_while_submitting'),
          status: 'error',
        });
        return;
      }
      if (text) {
        const globalAudio = document.getElementById(globalAudioId) as HTMLAudioElement | null;
        if (globalAudio) {
          console.log('Unmuting global audio');
          globalAudio.muted = false;
        }
        /** For external STT, append existing text to the transcription */
        const finalText =
          isExternalSTT(speechToTextEndpoint) && existingTextRef.current
            ? `${existingTextRef.current} ${text}`
            : text;
        ask({ text: finalText });
        reset({ text: '' });
        existingTextRef.current = '';
        // Signal to close microphone (handled in useEffect)
        console.log('[AudioRecorder] Message sent, setting shouldCloseMicRef to true');
        shouldCloseMicRef.current = true;
      }
    },
    [ask, reset, showToast, localize, isSubmitting, speechToTextEndpoint],
  );

  const setText = useCallback(
    (text: string) => {
      let newText = text;
      if (isExternalSTT(speechToTextEndpoint)) {
        /** For external STT, the text comes as a complete transcription, so append to existing */
        newText = existingTextRef.current ? `${existingTextRef.current} ${text}` : text;
      } else {
        /** For browser STT, the transcript is cumulative, so we only need to prepend the existing text once */
        newText = existingTextRef.current ? `${existingTextRef.current} ${text}` : text;
      }
      setValue('text', newText, {
        shouldValidate: true,
      });
    },
    [setValue, speechToTextEndpoint],
  );

  const { isListening, isLoading, startRecording, stopRecording, reset: resetTranscript } = useSpeechToText(
    setText,
    onTranscriptionComplete,
  );

  // Store resetTranscript in ref to avoid TDZ
  useEffect(() => {
    resetTranscriptRef.current = resetTranscript || null;
  }, [resetTranscript]);

  // Monitor text field for manual deletions
  const currentText = getValues('text') || '';
  const previousTextRef = useRef('');

  useEffect(() => {
    // Detect message send: text goes from "something" to empty
    if (previousTextRef.current !== '' && currentText === '' && isListening) {
      console.log('[AudioRecorder] 📤 Message sent detected (text cleared), closing microphone');
      console.log('[AudioRecorder] About to call stopRecording(), isListening:', isListening);
      stopRecording();
      // Force clear text to prevent ghost text
      setValue('text', '', { shouldValidate: true });
      console.log('[AudioRecorder] stopRecording() called');
    }

    // Update previous text
    previousTextRef.current = currentText;
  }, [currentText, isListening, stopRecording]);

  useEffect(() => {
    // If user manually clears the text while mic is on, reset transcript
    if (currentText === '' && isListening && resetTranscriptRef.current) {
      console.log('[AudioRecorder] Text manually deleted, resetting transcript');
      resetTranscriptRef.current();
    }
  }, [currentText, isListening]);

  // Auto-close microphone after sending (using ref to avoid TDZ)
  useEffect(() => {
    console.log('[AudioRecorder] Auto-close check:', {
      shouldClose: shouldCloseMicRef.current,
      isListening,
    });
    if (shouldCloseMicRef.current && isListening) {
      console.log('[AudioRecorder] ✅ Closing microphone after send');
      stopRecording();
      shouldCloseMicRef.current = false;
    }
  }, [isListening, stopRecording]);

  if (!textAreaRef.current) {
    return null;
  }

  const handleStartRecording = async (e?: React.MouseEvent | React.TouchEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    existingTextRef.current = getValues('text') || '';
    startRecording();
  };

  const handleStopRecording = async (e?: React.MouseEvent | React.TouchEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    stopRecording();
    /** For browser STT, clear the reference since text was already being updated */
    if (!isExternalSTT(speechToTextEndpoint)) {
      existingTextRef.current = '';
    }
  };

  const renderIcon = () => {
    if (isListening === true) {
      return <ListeningIcon className="stroke-red-500" />;
    }
    if (isLoading === true) {
      return <Spinner className="stroke-text-secondary" />;
    }
    return <ListeningIcon className="stroke-text-secondary" />;
  };

  return (
    <TooltipAnchor
      description={localize('com_ui_use_micrphone')}
      render={
        <button
          id="audio-recorder"
          type="button"
          aria-label={localize('com_ui_use_micrphone')}
          onClick={isListening === true ? handleStopRecording : handleStartRecording}
          disabled={disabled}
          className={cn(
            'flex size-9 items-center justify-center rounded-full p-1 transition-colors hover:bg-surface-hover',
          )}
          title={localize('com_ui_use_micrphone')}
          aria-pressed={isListening}
        >
          {renderIcon()}
        </button>
      }
    />
  );
}
