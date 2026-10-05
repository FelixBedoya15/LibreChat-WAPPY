import { memo, useRef, useMemo, useEffect, useState, useCallback } from 'react';
import { useWatch } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { TextareaAutosize } from '@librechat/client';
import { useRecoilState, useRecoilValue } from 'recoil';
import { useQueryClient } from '@tanstack/react-query';
import { Constants, isAssistantsEndpoint, isAgentsEndpoint, QueryKeys, PermissionTypes } from 'librechat-data-provider';
import {
  useChatContext,
  useChatFormContext,
  useAddedChatContext,
  useAssistantsMapContext,
} from '~/Providers';
import {
  useTextarea,
  useAutoSave,
  useLocalize,
  useRequiresKey,
  useHandleKeyUp,
  useQueryParams,
  useSubmitMessage,
  useFocusChatEffect,
  useSelectAgent,
} from '~/hooks';
import useRolePermissions from '~/hooks/Roles/useRolePermissions';
import { mainTextareaId, BadgeItem } from '~/common';
import AttachFileChat from './Files/AttachFileChat';
import FileFormChat from './Files/FileFormChat';
import { cn, removeFocusRings } from '~/utils';
import { claimAutoSubmit } from '~/utils/tenshiSubmitGuard';
import TextareaHeader from './TextareaHeader';
import PromptsCommand from './PromptsCommand';
import AudioRecorder from './AudioRecorder';
import CollapseChat from './CollapseChat';
import StreamAudio from './StreamAudio';
import StopButton from './StopButton';
import SendButton from './SendButton';
import EditBadges from './EditBadges';
import AgentSessionPanel from './AgentSessionPanel';
import BadgeRow from './BadgeRow';
import Mention from './Mention';
import { VoiceModeButton, VoiceModal } from '~/components/Voice';
import store from '~/store';

const ChatForm = memo(({ index = 0 }: { index?: number }) => {
  const submitButtonRef = useRef<HTMLButtonElement | null>(null);
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);
  useFocusChatEffect(textAreaRef);
  const localize = useLocalize();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [, setIsScrollable] = useState(false);
  const [visualRowCount, setVisualRowCount] = useState(1);
  const [isTextAreaFocused, setIsTextAreaFocused] = useState(false);
  const [backupBadges, setBackupBadges] = useState<Pick<BadgeItem, 'id'>[]>([]);

  const SpeechToText = useRecoilValue(store.speechToText);
  const TextToSpeech = useRecoilValue(store.textToSpeech);
  const chatDirection = useRecoilValue(store.chatDirection);
  const automaticPlayback = useRecoilValue(store.automaticPlayback);
  const maximizeChatSpace = useRecoilValue(store.maximizeChatSpace);
  const centerFormOnLanding = useRecoilValue(store.centerFormOnLanding);
  const isTemporary = useRecoilValue(store.isTemporary);

  const [badges, setBadges] = useRecoilState(store.chatBadges);
  const [isEditingBadges, setIsEditingBadges] = useRecoilState(store.isEditingBadges);
  const [showStopButton, setShowStopButton] = useRecoilState(store.showStopButtonByIndex(index));
  const [showPlusPopover, setShowPlusPopover] = useRecoilState(store.showPlusPopoverFamily(index));
  const [showMentionPopover, setShowMentionPopover] = useRecoilState(
    store.showMentionPopoverFamily(index),
  );
  const [showVoiceModal, setShowVoiceModal] = useRecoilState(store.showVoiceModal);
  const { hasPermission } = useRolePermissions();

  const { requiresKey } = useRequiresKey();
  const { onSelect: onSelectAgent } = useSelectAgent();
  const methods = useChatFormContext();
  const {
    files,
    setFiles,
    conversation,
    setConversation,
    isSubmitting,
    filesLoading,
    newConversation,
    handleStopGenerating,
  } = useChatContext();
  const {
    addedIndex,
    generateConversation,
    conversation: addedConvo,
    setConversation: setAddedConvo,
    isSubmitting: isSubmittingAdded,
  } = useAddedChatContext();
  const assistantMap = useAssistantsMapContext();
  const showStopAdded = useRecoilValue(store.showStopButtonByIndex(addedIndex));

  const endpoint = useMemo(
    () => conversation?.endpointType ?? conversation?.endpoint ?? (conversation?.agent_id ? EModelEndpoint.agents : undefined),
    [conversation?.endpointType, conversation?.endpoint, conversation?.agent_id],
  );
  const { conversationId: urlConversationId } = useParams();
  const conversationId = useMemo(
    () => {
      // FASE 4 FIX: Prioritize URL param to avoid "infinite new chats" bug
      if (urlConversationId && urlConversationId !== 'new') {
        return urlConversationId;
      }
      return conversation?.conversationId ?? Constants.NEW_CONVO;
    },
    [conversation?.conversationId, urlConversationId],
  );

  const isRTL = useMemo(
    () => (chatDirection != null ? chatDirection?.toLowerCase() === 'rtl' : false),
    [chatDirection],
  );
  const invalidAssistant = useMemo(
    () =>
      isAssistantsEndpoint(endpoint) &&
      (!(conversation?.assistant_id ?? '') ||
        !assistantMap?.[endpoint ?? '']?.[conversation?.assistant_id ?? '']),
    [conversation?.assistant_id, endpoint, assistantMap],
  );
  const modelToUse = useMemo(() => {
    if (isAgentsEndpoint(endpoint)) {
      return conversation?.agent_id;
    }
    if (isAssistantsEndpoint(endpoint)) {
      return conversation?.assistant_id;
    }
    return conversation?.model;
  }, [endpoint, conversation?.agent_id, conversation?.assistant_id, conversation?.model]);

  const disableInputs = useMemo(
    () => requiresKey || invalidAssistant,
    [requiresKey, invalidAssistant],
  );

  const handleContainerClick = useCallback(() => {
    /** Check if the device is a touchscreen */
    if (window.matchMedia?.('(pointer: coarse)').matches) {
      return;
    }
    textAreaRef.current?.focus();
  }, []);

  const handleFocusOrClick = useCallback(() => {
    if (isCollapsed) {
      setIsCollapsed(false);
    }
  }, [isCollapsed]);

  useAutoSave({
    files,
    setFiles,
    textAreaRef,
    conversationId,
    isSubmitting: isSubmitting || isSubmittingAdded,
  });

  const { submitMessage, submitPrompt } = useSubmitMessage();

  const handleKeyUp = useHandleKeyUp({
    index,
    textAreaRef,
    setShowPlusPopover,
    setShowMentionPopover,
  });
  const {
    isNotAppendable,
    handlePaste,
    handleKeyDown,
    handleCompositionStart,
    handleCompositionEnd,
  } = useTextarea({
    textAreaRef,
    submitButtonRef,
    setIsScrollable,
    disabled: disableInputs,
  });

  useQueryParams({ textAreaRef });

  const { ref, ...registerProps } = methods.register('text', {
    required: true,
    onChange: useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) =>
        methods.setValue('text', e.target.value, { shouldValidate: true }),
      [methods],
    ),
  });

  const textValue = useWatch({ control: methods.control, name: 'text' });

  useEffect(() => {
    if (textAreaRef.current) {
      const style = window.getComputedStyle(textAreaRef.current);
      const lineHeight = parseFloat(style.lineHeight);
      setVisualRowCount(Math.floor(textAreaRef.current.scrollHeight / lineHeight));
    }
  }, [textValue]);

  useEffect(() => {
    if (isEditingBadges && backupBadges.length === 0) {
      setBackupBadges([...badges]);
    }
  }, [isEditingBadges, badges, backupBadges.length]);

  const handleSaveBadges = useCallback(() => {
    setIsEditingBadges(false);
    setBackupBadges([]);
  }, [setIsEditingBadges, setBackupBadges]);

  const handleCancelBadges = useCallback(() => {
    if (backupBadges.length > 0) {
      setBadges([...backupBadges]);
    }
    setIsEditingBadges(false);
    setBackupBadges([]);
  }, [backupBadges, setBadges, setIsEditingBadges]);

  const PENDING_SUBMISSION_TTL_MS = 15000;
  const pendingAgentSubmissionRef = useRef<{ agentId: string; prompt: string; time: number } | null>(
    null,
  );
  const isSubmittingRef = useRef(isSubmitting);
  useEffect(() => {
    isSubmittingRef.current = isSubmitting;
  }, [isSubmitting]);

  /** Coloca el texto en el formulario y ejecuta el envío DIRECTO vía click / submitMessage */
  const sendDelegatedPrompt = useCallback(
    (prompt: string) => {
      if (!claimAutoSubmit(prompt)) {
        console.log('[ChatForm] Prompt ya en proceso, se omite duplicado:', prompt);
        return;
      }

      methods.setValue('text', prompt, { shouldValidate: true });
      if (textAreaRef.current) {
        textAreaRef.current.value = prompt;
        textAreaRef.current.dispatchEvent(new Event('input', { bubbles: true }));
        textAreaRef.current.dispatchEvent(new Event('change', { bubbles: true }));
        textAreaRef.current.focus();
      }

      console.log('[ChatForm] Enviando consulta delegada:', prompt);

      const dispatchClickOrSubmit = () => {
        let submitted = false;

        // 1. Invocar React Hook Form handleSubmit directamente
        try {
          const textVal = methods.getValues('text') || prompt;
          methods.handleSubmit((data) => {
            console.log('[ChatForm] methods.handleSubmit ejecutado exitosamente:', data.text || textVal);
            submitMessage({ text: data.text || textVal });
            submitted = true;
          })();
        } catch (err) {
          console.warn('[ChatForm] Error en methods.handleSubmit:', err);
        }

        // 2. Disparar submitMessage directo del hook como garantía paralela
        try {
          console.log('[ChatForm] Invocando submitMessage directo para:', prompt);
          submitMessage({ text: prompt });
          submitted = true;
        } catch (err) {
          console.warn('[ChatForm] Error en submitMessage directo:', err);
        }

        // 3. Soporte DOM nativo: requestSubmit() o click físico en botón
        try {
          const form = (textAreaRef.current?.closest('form') || document.querySelector('form')) as HTMLFormElement | null;
          const sendBtn = (document.getElementById('send-button') ||
            document.querySelector('button[data-testid="send-button"]') ||
            submitButtonRef.current) as HTMLButtonElement | null;
          if (form && typeof form.requestSubmit === 'function') {
            form.requestSubmit(sendBtn && !sendBtn.disabled ? sendBtn : undefined);
            submitted = true;
          } else if (sendBtn && !sendBtn.disabled) {
            sendBtn.click();
            submitted = true;
          }
        } catch (domErr) {
          console.warn('[ChatForm] Error en DOM requestSubmit/click:', domErr);
        }

        return submitted;
      };

      dispatchClickOrSubmit();

      // Watchdog activo (hasta 25 ticks de 100ms = 2.5s)
      let attempts = 0;
      const maxAttempts = 25;
      const watchdog = setInterval(() => {
        attempts++;
        const currentVal = textAreaRef.current?.value || '';

        // Si el textarea ya se vació o cambió respecto al prompt, se despachó exitosamente
        if (!currentVal || currentVal.trim() === '' || currentVal !== prompt) {
          clearInterval(watchdog);
          console.log('[ChatForm] Auto-envío delegado verificado con éxito tras', attempts, 'intentos.');
          return;
        }

        // Si alcanzó el máximo de intentos y aún tiene texto, reintento final de emergencia
        if (attempts >= maxAttempts) {
          clearInterval(watchdog);
          console.warn('[ChatForm] Watchdog timeout: intentando submitMessage final de emergencia para:', prompt);
          try {
            submitMessage({ text: prompt });
          } catch (finalErr) {
            console.error('[ChatForm] Error en submitMessage final:', finalErr);
          }
          releaseAutoSubmit(prompt);
          return;
        }

        // Si sigue presente, refrescar inputs y reintentar despacho
        if (textAreaRef.current) {
          textAreaRef.current.value = prompt;
          textAreaRef.current.dispatchEvent(new Event('input', { bubbles: true }));
          textAreaRef.current.dispatchEvent(new Event('change', { bubbles: true }));
        }
        methods.setValue('text', prompt, { shouldValidate: true });
        dispatchClickOrSubmit();
      }, 100);
    },
    [methods, submitMessage, textAreaRef, submitButtonRef],
  );

  // Ejecutor robusto de auto-envío para consultas delegadas por Tenshi
  const triggerTenshiSend = useCallback(
    async (promptToSend: string, agentId?: string) => {
      if (!promptToSend || !promptToSend.trim()) return;
      const prompt = promptToSend.trim();

      console.log('[ChatForm] triggerTenshiSend ejecutando para:', prompt, {
        agentId,
        currentAgent: conversation?.agent_id,
        isSubmitting,
      });

      // 1. Si el agente objetivo aún no es el activo, postergar el envío hasta que se asiente en la conversación
      // Solo verificamos divergencia si tanto agentId como conversation?.agent_id están definidos y son diferentes
      if (agentId && conversation?.agent_id && conversation.agent_id !== agentId) {
        console.log('[ChatForm] Agente diferente al actual. Seleccionando agente y postergando sumisión:', agentId);

        // Si estamos en una conversación existente que no es /c/new ni está vacía,
        // NO secuestrar ni enviar a esta conversación vieja (la navegación hacia /c/new está en curso)
        if (window.location.pathname !== '/c/new' && conversation?.conversationId && conversation.conversationId !== 'new') {
          console.warn('[ChatForm] Descartando envío diferido en conversación existente ajena al agente objetivo:', {
            targetAgent: agentId,
            currentAgent: conversation?.agent_id,
          });
          return;
        }

        pendingAgentSubmissionRef.current = { agentId, prompt, time: Date.now() };
        try {
          await onSelectAgent(agentId);
        } catch (err) {
          console.error('[ChatForm] Error al invocar onSelectAgent:', err);
        }
        // Caducidad: si el agente nunca se activa, descartar el envío pendiente para que no se dispare más tarde
        setTimeout(() => {
          const pending = pendingAgentSubmissionRef.current;
          if (pending && pending.prompt === prompt && Date.now() - pending.time >= PENDING_SUBMISSION_TTL_MS) {
            console.warn('[ChatForm] Envío pendiente caducado (el agente no se activó):', agentId);
            pendingAgentSubmissionRef.current = null;
          }
        }, PENDING_SUBMISSION_TTL_MS);
        return;
      }

      // 2. Si el sistema está actualmente respondiendo / generando, detenerlo primero y esperar liberación
      if (isSubmitting || isSubmittingAdded) {
        console.log('[ChatForm] Conversación ocupada por respuesta previa. Deteniendo generación y esperando liberación...');
        handleStopGenerating();
        let waitCount = 0;
        const waitInterval = setInterval(() => {
          waitCount++;
          if (!isSubmittingRef.current || waitCount >= 15) {
            clearInterval(waitInterval);
            sendDelegatedPrompt(prompt);
          }
        }, 100);
        return;
      }

      // 3. El agente ya es el correcto y el canal está libre: enviar de inmediato
      sendDelegatedPrompt(prompt);
    },
    [onSelectAgent, conversation?.agent_id, sendDelegatedPrompt, isSubmitting, isSubmittingAdded, handleStopGenerating],
  );

  // Efecto que ejecuta la consulta pendiente tan pronto como el agente objetivo se asiente en la conversación
  useEffect(() => {
    const pending = pendingAgentSubmissionRef.current;
    if (!pending || conversation?.agent_id !== pending.agentId) {
      return;
    }
    pendingAgentSubmissionRef.current = null;

    if (Date.now() - pending.time >= PENDING_SUBMISSION_TTL_MS) {
      console.warn('[ChatForm] Envío pendiente descartado por antigüedad:', pending.prompt);
      return;
    }

    console.log('[ChatForm] Agente confirmado y activo en conversación. Ejecutando envío diferido:', pending.prompt);
    setTimeout(() => sendDelegatedPrompt(pending.prompt), 100);
  }, [conversation?.agent_id, sendDelegatedPrompt]);

  // Listener para auto-envío de consultas delegadas por Tenshi
  useEffect(() => {
    const handleTenshiSubmit = (e: any) => {
      const { agentId, prompt } = e.detail || {};
      console.log('[ChatForm] tenshi-submit-agent-prompt recibido:', { agentId, prompt });
      if (prompt) {
        triggerTenshiSend(prompt, agentId);
      }
    };

    window.addEventListener('tenshi-submit-agent-prompt', handleTenshiSubmit);
    return () => {
      window.removeEventListener('tenshi-submit-agent-prompt', handleTenshiSubmit);
    };
  }, [triggerTenshiSend]);

  const isMoreThanThreeRows = visualRowCount > 3;

  const baseClasses = useMemo(
    () =>
      cn(
        'md:py-3.5 m-0 w-full resize-none py-[13px] placeholder-black/50 bg-transparent dark:placeholder-white/50 [&:has(textarea:focus)]:shadow-[0_2px_6px_rgba(0,0,0,.05)]',
        isCollapsed ? 'max-h-[52px]' : 'max-h-[45vh] md:max-h-[55vh]',
        isMoreThanThreeRows ? 'pl-5' : 'px-5',
      ),
    [isCollapsed, isMoreThanThreeRows],
  );

  return (
    <form
      onSubmit={methods.handleSubmit(submitMessage)}
      className={cn(
        'mx-auto flex w-full flex-row gap-3 transition-[max-width] duration-300 sm:px-2',
        maximizeChatSpace ? 'max-w-full' : 'md:max-w-3xl xl:max-w-4xl',
        centerFormOnLanding &&
          (conversationId == null || conversationId === Constants.NEW_CONVO) &&
          !isSubmitting &&
          conversation?.messages?.length === 0
          ? 'transition-all duration-200 sm:mb-28'
          : 'sm:mb-10',
      )}
    >
      <div className="relative flex h-full flex-1 items-stretch md:flex-col">
        <div className={cn('flex w-full items-center', isRTL && 'flex-row-reverse')}>
          {showPlusPopover && !isAssistantsEndpoint(endpoint) && (
            <Mention
              conversation={conversation}
              setShowMentionPopover={setShowPlusPopover}
              newConversation={generateConversation}
              textAreaRef={textAreaRef}
              commandChar="+"
              placeholder="com_ui_add_model_preset"
              includeAssistants={false}
            />
          )}
          {showMentionPopover && (
            <Mention
              conversation={conversation}
              setShowMentionPopover={setShowMentionPopover}
              newConversation={newConversation}
              textAreaRef={textAreaRef}
            />
          )}
          <PromptsCommand index={index} textAreaRef={textAreaRef} submitPrompt={submitPrompt} />
          <div
            onClick={handleContainerClick}
            className={cn(
              'relative flex w-full flex-grow flex-col overflow-hidden rounded-t-3xl border pb-4 text-text-primary transition-all duration-200 sm:rounded-3xl sm:pb-0',
              isTextAreaFocused ? 'shadow-xl border-teal-500/50 ring-2 ring-teal-500/10' : 'shadow-lg shadow-slate-200/50 dark:shadow-none',
              isTemporary
                ? 'border-violet-800/60 bg-violet-950/10'
                : 'border-slate-200/90 dark:border-zinc-800/90 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl',
            )}
          >
            <TextareaHeader addedConvo={addedConvo} setAddedConvo={setAddedConvo} />
            <EditBadges
              isEditingChatBadges={isEditingBadges}
              handleCancelBadges={handleCancelBadges}
              handleSaveBadges={handleSaveBadges}
              setBadges={setBadges}
            />
            <FileFormChat conversation={conversation} />
            {endpoint && (
              <div className={cn('flex', isRTL ? 'flex-row-reverse' : 'flex-row')}>
                <TextareaAutosize
                  {...registerProps}
                  ref={(e) => {
                    ref(e);
                    (textAreaRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = e;
                  }}
                  disabled={disableInputs || isNotAppendable}
                  data-ms-editor="false"
                  data-gramm="false"
                  onPaste={handlePaste}
                  onKeyDown={handleKeyDown}
                  onKeyUp={handleKeyUp}
                  onCompositionStart={handleCompositionStart}
                  onCompositionEnd={handleCompositionEnd}
                  id={mainTextareaId}
                  tabIndex={0}
                  data-testid="text-input"
                  rows={1}
                  onFocus={() => {
                    handleFocusOrClick();
                    setIsTextAreaFocused(true);
                  }}
                  onBlur={setIsTextAreaFocused.bind(null, false)}
                  aria-label={localize('com_ui_message_input')}
                  onClick={handleFocusOrClick}
                  style={{ height: 44, overflowY: 'auto' }}
                  className={cn(
                    baseClasses,
                    removeFocusRings,
                    'transition-[max-height] duration-200 disabled:cursor-not-allowed',
                  )}
                />
                <div className="flex flex-col items-start justify-start pt-1.5">
                  <CollapseChat
                    isCollapsed={isCollapsed}
                    isScrollable={isMoreThanThreeRows}
                    setIsCollapsed={setIsCollapsed}
                  />
                </div>
              </div>
            )}
            <div
              className={cn(
                'items-between flex gap-2 pb-2',
                isRTL ? 'flex-row-reverse' : 'flex-row',
              )}
            >
              <div className={`${isRTL ? 'mr-2' : 'ml-2'}`}>
                {hasPermission(PermissionTypes.ATTACHMENTS) && (
                  <AttachFileChat conversation={conversation} disableInputs={disableInputs} />
                )}
              </div>
              {isAgentsEndpoint(endpoint) && conversation?.agent_id && (
                <AgentSessionPanel
                  agentId={conversation.agent_id}
                  conversationId={conversationId}
                />
              )}
              <BadgeRow
                showEphemeralBadges={!isAgentsEndpoint(endpoint) && !isAssistantsEndpoint(endpoint)}
                isSubmitting={isSubmitting || isSubmittingAdded}
                conversationId={conversationId}
                onChange={setBadges}
                isInChat={
                  Array.isArray(conversation?.messages) && conversation.messages.length >= 1
                }
              />
              <div className="mx-auto flex" />
              {SpeechToText && (
                <AudioRecorder
                  methods={methods}
                  ask={submitMessage}
                  textAreaRef={textAreaRef}
                  disabled={disableInputs || isNotAppendable}
                  isSubmitting={isSubmitting}
                />
              )}
              {/* Live Button */}
              {hasPermission(PermissionTypes.LIVE_CHAT) && (
                <VoiceModeButton
                  onClick={() => {
                    console.log('[ChatForm] Opening Live with conversationId:', conversationId);
                    try {
                      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
                      if (AudioContextClass) {
                        if (!(window as any).sharedAudioContext24k) {
                          (window as any).sharedAudioContext24k = new AudioContextClass({ sampleRate: 24000 });
                        }
                        if ((window as any).sharedAudioContext24k.state === 'suspended') {
                          (window as any).sharedAudioContext24k.resume().catch(console.error);
                        }
                        if (!(window as any).sharedAudioContext16k) {
                          (window as any).sharedAudioContext16k = new AudioContextClass({ sampleRate: 16000 });
                        }
                        if ((window as any).sharedAudioContext16k.state === 'suspended') {
                          (window as any).sharedAudioContext16k.resume().catch(console.error);
                        }
                      }
                    } catch (err) {
                      console.error('[ChatForm] Error initializing global audio contexts:', err);
                    }
                    setShowVoiceModal(true);
                  }}
                  disabled={disableInputs || isNotAppendable}
                  isActive={showVoiceModal}
                />
              )}
              <div className={`${isRTL ? 'ml-2' : 'mr-2'}`}>
                {(isSubmitting || isSubmittingAdded) && (showStopButton || showStopAdded) ? (
                  <StopButton stop={handleStopGenerating} setShowStopButton={setShowStopButton} />
                ) : (endpoint || conversation?.agent_id) ? (
                  <SendButton
                    ref={submitButtonRef}
                    control={methods.control}
                    disabled={filesLoading || isSubmitting || disableInputs || isNotAppendable}
                  />
                ) : null}
              </div>
            </div>
            {TextToSpeech && automaticPlayback && <StreamAudio index={index} />}
          </div>
        </div>
      </div>
      {/* Voice Modal */}
      <VoiceModal
        isOpen={showVoiceModal}
        onClose={() => setShowVoiceModal(false)}
        conversationId={conversationId} // Use current conversation
        model={modelToUse ?? undefined}
        endpoint={endpoint ?? undefined}
        agentId={conversation?.agent_id}
        onConversationIdUpdate={(newId) => {
          // Only navigate if we were in a NEW chat (not an existing one)
          const wasNewChat = conversationId === Constants.NEW_CONVO;
          console.log('[ChatForm] Voice created/updated conversation:', newId, 'wasNewChat:', wasNewChat);

          if (wasNewChat) {
            // Update local conversation state IMMEDIATELY so that if user submits, it uses the new ID
            if (setConversation) {
              setConversation((prev) => {
                if (!prev) {
                  return prev;
                }
                return {
                  ...prev,
                  conversationId: newId,
                };
              });
            }

            // Navigate to the new conversation
            navigate(`/c/${newId}`, { replace: true, state: { focusChat: true } });
          }

          // Always invalidate queries to refresh UI
          queryClient.invalidateQueries([QueryKeys.messages, newId]);
          queryClient.invalidateQueries([QueryKeys.allConversations]);
        }}
        onConversationUpdated={(updatedId) => {
          // Use the directly received conversation ID (from WS message) if available, falling back to local state
          const idToInvalidate = updatedId || conversationId;
          if (idToInvalidate && idToInvalidate !== Constants.NEW_CONVO) {
            console.log('[ChatForm] Invalidate queries for messages live update:', idToInvalidate);
            queryClient.invalidateQueries([QueryKeys.messages, idToInvalidate]);
            queryClient.invalidateQueries([QueryKeys.allConversations]);
          }
        }}
      />
    </form>
  );
});

export default ChatForm;
