import { useEffect, useCallback, useRef } from 'react';
import { useRecoilValue } from 'recoil';
import { useSearchParams } from 'react-router-dom';
import { QueryClient, useQueryClient } from '@tanstack/react-query';
import {
  Constants,
  QueryKeys,
  EModelEndpoint,
  isAgentsEndpoint,
  tQueryParamsSchema,
  isAssistantsEndpoint,
  PermissionBits,
} from 'librechat-data-provider';
import type {
  TPreset,
  TEndpointsConfig,
  TStartupConfig,
  AgentListResponse,
} from 'librechat-data-provider';
import type { ZodAny } from 'zod';
import { getConvoSwitchLogic, getModelSpecIconURL, removeUnavailableTools, logger } from '~/utils';
import { useAuthContext, useAgentsMap, useDefaultConvo, useSubmitMessage } from '~/hooks';
import { useChatContext, useChatFormContext } from '~/Providers';
import { useGetAgentByIdQuery } from '~/data-provider';
import store from '~/store';

/**
 * Parses query parameter values, converting strings to their appropriate types.
 * Handles boolean strings, numbers, and preserves regular strings.
 */
const parseQueryValue = (value: string) => {
  if (value === 'true') {
    return true;
  }
  if (value === 'false') {
    return false;
  }
  if (!isNaN(Number(value))) {
    return Number(value);
  }
  return value;
};

/**
 * Processes and validates URL query parameters using schema definitions.
 * Extracts valid settings based on tQueryParamsSchema and handles special endpoint cases
 * for assistants and agents.
 */
const processValidSettings = (queryParams: Record<string, string>) => {
  const validSettings = {} as TPreset;

  Object.entries(queryParams).forEach(([key, value]) => {
    try {
      const schema = tQueryParamsSchema.shape[key] as ZodAny | undefined;
      if (schema) {
        const parsedValue = parseQueryValue(value);
        const validValue = schema.parse(parsedValue);
        validSettings[key] = validValue;
      }
    } catch (error) {
      console.warn(`Invalid value for setting ${key}:`, error);
    }
  });

  if (
    validSettings.assistant_id != null &&
    validSettings.assistant_id &&
    !isAssistantsEndpoint(validSettings.endpoint)
  ) {
    validSettings.endpoint = EModelEndpoint.assistants;
  }
  if (
    validSettings.agent_id != null &&
    validSettings.agent_id &&
    !isAgentsEndpoint(validSettings.endpoint)
  ) {
    validSettings.endpoint = EModelEndpoint.agents;
  }

  return validSettings;
};

const injectAgentIntoAgentsMap = (queryClient: QueryClient, agent: any) => {
  const editCacheKey = [QueryKeys.agents, { requiredPermission: PermissionBits.EDIT }];
  const editCache = queryClient.getQueryData<AgentListResponse>(editCacheKey);

  if (editCache?.data && !editCache.data.some((cachedAgent) => cachedAgent.id === agent.id)) {
    // Inject agent into EDIT cache so dropdown can display it
    const updatedCache = {
      ...editCache,
      data: [agent, ...editCache.data],
    };
    queryClient.setQueryData(editCacheKey, updatedCache);
    logger.log('agent', 'Injected URL agent into cache:', agent);
  }
};

/**
 * Hook that processes URL query parameters to initialize chat with specified settings and prompt.
 * Handles model switching, prompt auto-filling, and optional auto-submission with race condition protection.
 * Supports immediate or deferred submission based on whether settings need to be applied first.
 */
export default function useQueryParams({
  textAreaRef,
}: {
  textAreaRef: React.RefObject<HTMLTextAreaElement>;
}) {
  const maxAttempts = 50;
  const attemptsRef = useRef(0);
  const MAX_SETTINGS_WAIT_MS = 1000;
  const processedRef = useRef(false);
  const pendingSubmitRef = useRef(false);
  const settingsAppliedRef = useRef(false);
  const submissionHandledRef = useRef(false);
  const promptTextRef = useRef<string | null>(null);
  const validSettingsRef = useRef<TPreset | null>(null);
  const settingsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const methods = useChatFormContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const getDefaultConversation = useDefaultConvo();
  const modularChat = useRecoilValue(store.modularChat);
  const availableTools = useRecoilValue(store.availableTools);
  const { submitMessage } = useSubmitMessage();

  const queryClient = useQueryClient();
  const { conversation, newConversation, isSubmitting, handleStopGenerating } = useChatContext();

  const lastProcessedQueryRef = useRef<string>('');
  const isSubmittingRef = useRef(isSubmitting);
  useEffect(() => {
    isSubmittingRef.current = isSubmitting;
  }, [isSubmitting]);

  const urlAgentId = searchParams.get('agent_id') || '';
  const { data: urlAgent } = useGetAgentByIdQuery(urlAgentId);

  /**
   * Applies settings from URL query parameters to create a new conversation.
   * Handles model spec lookup, endpoint normalization, and conversation switching logic.
   * Ensures tools compatibility and preserves existing conversation when appropriate.
   */
  const newQueryConvo = useCallback(
    (_newPreset?: TPreset) => {
      if (!_newPreset) {
        return;
      }
      let newPreset = removeUnavailableTools(_newPreset, availableTools);
      if (newPreset.spec != null && newPreset.spec !== '') {
        const startupConfig = queryClient.getQueryData<TStartupConfig>([QueryKeys.startupConfig]);
        const modelSpecs = startupConfig?.modelSpecs?.list ?? [];
        const spec = modelSpecs.find((s) => s.name === newPreset.spec);
        if (!spec) {
          return;
        }
        const { preset } = spec;
        preset.iconURL = getModelSpecIconURL(spec);
        preset.spec = spec.name;
        newPreset = preset;
      }

      let newEndpoint = newPreset.endpoint ?? '';
      const endpointsConfig = queryClient.getQueryData<TEndpointsConfig>([QueryKeys.endpoints]);

      if (newEndpoint && endpointsConfig && !endpointsConfig[newEndpoint]) {
        const normalizedNewEndpoint = newEndpoint.toLowerCase();
        for (const [key, value] of Object.entries(endpointsConfig)) {
          if (
            value &&
            value.type === EModelEndpoint.custom &&
            key.toLowerCase() === normalizedNewEndpoint
          ) {
            newEndpoint = key;
            newPreset.endpoint = key;
            newPreset.endpointType = EModelEndpoint.custom;
            break;
          }
        }
      }

      const {
        template,
        shouldSwitch,
        isNewModular,
        newEndpointType,
        isCurrentModular,
        isExistingConversation,
      } = getConvoSwitchLogic({
        newEndpoint,
        modularChat,
        conversation,
        endpointsConfig,
      });

      let resetParams = {};
      if (newPreset.spec == null) {
        template.spec = null;
        template.iconURL = null;
        template.modelLabel = null;
        resetParams = { spec: null, iconURL: null, modelLabel: null };
        newPreset = { ...newPreset, ...resetParams };
      }

      const isTargetingNew =
        window.location.pathname.includes('/c/new') ||
        searchParams.has('submit') ||
        searchParams.has('prompt') ||
        (newPreset.agent_id != null && conversation?.agent_id != null && newPreset.agent_id !== conversation?.agent_id);

      const isModular = !isTargetingNew && isCurrentModular && isNewModular && shouldSwitch;
      if (!isTargetingNew && isExistingConversation && isModular) {
        template.endpointType = newEndpointType as EModelEndpoint | undefined;

        const currentConvo = getDefaultConversation({
          /* target endpointType is necessary to avoid endpoint mixing */
          conversation: {
            ...(conversation ?? {}),
            endpointType: template.endpointType,
            ...resetParams,
          },
          preset: template,
          cleanOutput: newPreset.spec != null && newPreset.spec !== '',
        });

        /* We don't reset the latest message, only when changing settings mid-converstion */
        logger.log('conversation', 'Switching conversation from query params', currentConvo);
        newConversation({
          template: currentConvo,
          preset: newPreset,
          keepLatestMessage: true,
          keepAddedConvos: true,
        });
        return;
      }

      newConversation({
        template: {
          conversationId: Constants.NEW_CONVO as string,
          endpoint: newPreset.endpoint,
          agent_id: newPreset.agent_id,
        },
        preset: newPreset,
        keepAddedConvos: true,
      });
    },
    [
      queryClient,
      modularChat,
      conversation,
      availableTools,
      newConversation,
      getDefaultConversation,
    ],
  );

  /**
   * Checks if all settings from URL parameters have been successfully applied to the conversation.
   * Compares values from validSettings against the current conversation state, handling special properties.
   * Returns true only when all relevant settings match the target values.
   */
  const areSettingsApplied = useCallback(() => {
    if (!validSettingsRef.current || !conversation) {
      return false;
    }

    for (const [key, value] of Object.entries(validSettingsRef.current)) {
      if (['presetOverride', 'iconURL', 'spec', 'modelLabel'].includes(key)) {
        continue;
      }

      if (key === 'endpoint') {
        const currentEndpoint = conversation.endpoint ?? conversation.endpointType;
        if (currentEndpoint === value || (value === EModelEndpoint.agents && conversation.agent_id)) {
          continue;
        }
      }

      if (conversation[key] !== value) {
        return false;
      }
    }

    return true;
  }, [conversation]);

  /**
   * Processes message submission exactly once, preventing duplicate submissions.
   * Sets the prompt text, submits the message, and cleans up URL parameters afterward.
   * Has internal guards to ensure it only executes once regardless of how many times it's called.
   */
  const processSubmission = useCallback(() => {
    if (submissionHandledRef.current || !promptTextRef.current) {
      return;
    }

    submissionHandledRef.current = true;
    pendingSubmitRef.current = false;
    if (settingsTimeoutRef.current) {
      clearTimeout(settingsTimeoutRef.current);
      settingsTimeoutRef.current = null;
    }

    const textToSend = promptTextRef.current;

    // 1. Establecer valor de inmediato en React Hook Form y textarea físico
    methods.setValue('text', textToSend, { shouldValidate: true });
    if (textAreaRef.current) {
      textAreaRef.current.value = textToSend;
      textAreaRef.current.dispatchEvent(new Event('input', { bubbles: true }));
      textAreaRef.current.dispatchEvent(new Event('change', { bubbles: true }));
      textAreaRef.current.focus();
    }

    // 2. Si la conversación está ocupada / generando, detenerla
    if (isSubmittingRef.current) {
      console.log('[useQueryParams] Deteniendo respuesta previa antes de enviar consulta URL...');
      try {
        handleStopGenerating();
      } catch (stopErr) {
        console.warn('[useQueryParams] Error al detener generación previa:', stopErr);
      }
    }

    const executeSend = () => {
      console.log('[useQueryParams] Ejecutando envío único para:', textToSend);
      try {
        submitMessage({ text: textToSend });
      } catch (err) {
        console.warn('[useQueryParams] Error en submitMessage directo:', err);
      }

      // Limpieza segura del textarea y remoción silenciosa de query params
      setTimeout(() => {
        methods.reset();
        methods.setValue('text', '');
        if (textAreaRef.current) {
          textAreaRef.current.value = '';
          textAreaRef.current.dispatchEvent(new Event('input', { bubbles: true }));
          textAreaRef.current.dispatchEvent(new Event('change', { bubbles: true }));
        }
        const cleanUrl = window.location.pathname + (window.location.hash || '');
        window.history.replaceState({}, '', cleanUrl);
      }, 350);
    };

    if (isSubmittingRef.current) {
      setTimeout(executeSend, 200);
    } else {
      executeSend();
    }
  }, [methods, submitMessage, textAreaRef, handleStopGenerating]);

  useEffect(() => {
    const searchString = searchParams.toString();
    const hasIncomingQuery =
      searchParams.has('prompt') ||
      searchParams.has('q') ||
      searchParams.has('submit') ||
      (searchParams.has('agent_id') && !processedRef.current);

    // Solo reiniciar el ciclo si la cadena de búsqueda cambió realmente
    if (hasIncomingQuery && lastProcessedQueryRef.current !== searchString) {
      lastProcessedQueryRef.current = searchString;
      processedRef.current = false;
      attemptsRef.current = 0;
      submissionHandledRef.current = false;
      pendingSubmitRef.current = false;
      settingsAppliedRef.current = false;
    }

    const processQueryParams = () => {
      const queryParams: Record<string, string> = {};
      searchParams.forEach((value, key) => {
        queryParams[key] = value;
      });

      // Support both 'prompt' and 'q' as query parameters, with 'prompt' taking precedence
      const decodedPrompt = queryParams.prompt || queryParams.q || '';
      const shouldAutoSubmit = queryParams.submit?.toLowerCase() === 'true';
      delete queryParams.prompt;
      delete queryParams.q;
      delete queryParams.submit;
      const validSettings = processValidSettings(queryParams);

      return { decodedPrompt, validSettings, shouldAutoSubmit };
    };

    const intervalId = setInterval(() => {
      if (processedRef.current || attemptsRef.current >= maxAttempts) {
        clearInterval(intervalId);
        if (attemptsRef.current >= maxAttempts) {
          console.warn('Max attempts reached, failed to process parameters');
        }
        return;
      }

      attemptsRef.current += 1;

      if (!textAreaRef.current) {
        return;
      }
      const startupConfig = queryClient.getQueryData<TStartupConfig>([QueryKeys.startupConfig]);
      if (!startupConfig) {
        return;
      }

      const { decodedPrompt, validSettings, shouldAutoSubmit } = processQueryParams();

      /** Mark processing as complete and clean up without remounting React Router */
      const success = () => {
        processedRef.current = true;
        clearInterval(intervalId);

        // Limpiar URL silenciosamente en historial solo si no hay sumisión pendiente
        if (!pendingSubmitRef.current) {
          window.history.replaceState({}, '', window.location.pathname);
        }
      };

      // Store settings for later comparison
      if (Object.keys(validSettings).length > 0) {
        validSettingsRef.current = validSettings;
      }

      // Escribir INMEDIATAMENTE el texto en el formulario y en el textarea para que sea visible
      if (decodedPrompt) {
        promptTextRef.current = decodedPrompt;
        methods.setValue('text', decodedPrompt, { shouldValidate: true });
        if (textAreaRef.current) {
          textAreaRef.current.value = decodedPrompt;
          textAreaRef.current.focus();
          textAreaRef.current.setSelectionRange(decodedPrompt.length, decodedPrompt.length);
        }
      }

      // Handle auto-submission
      if (shouldAutoSubmit && decodedPrompt) {
        pendingSubmitRef.current = true;
        if (settingsTimeoutRef.current) {
          clearTimeout(settingsTimeoutRef.current);
        }
        settingsTimeoutRef.current = setTimeout(() => {
          if (!submissionHandledRef.current) {
            console.log('[useQueryParams] Fallback auto-envío tras espera de configuración:', decodedPrompt);
            processSubmission();
          }
        }, MAX_SETTINGS_WAIT_MS);
      } else if (!decodedPrompt) {
        submissionHandledRef.current = true;
      }

      if (Object.keys(validSettings).length > 0) {
        newQueryConvo(validSettings);
      }

      success();
    }, 100);

    return () => {
      clearInterval(intervalId);
    };
  }, [
    searchParams,
    methods,
    textAreaRef,
    newQueryConvo,
    queryClient,
    processSubmission,
  ]);

  useEffect(() => {
    // Only proceed if we've already processed URL parameters but haven't yet handled submission
    if (
      !processedRef.current ||
      submissionHandledRef.current ||
      settingsAppliedRef.current ||
      !validSettingsRef.current ||
      !conversation
    ) {
      return;
    }

    const allSettingsApplied = areSettingsApplied();

    if (allSettingsApplied) {
      settingsAppliedRef.current = true;

      if (pendingSubmitRef.current) {
        if (settingsTimeoutRef.current) {
          clearTimeout(settingsTimeoutRef.current);
          settingsTimeoutRef.current = null;
        }

        console.log('Settings fully applied, processing submission');
        processSubmission();
      }
    }
  }, [conversation, processSubmission, areSettingsApplied]);

  const { isAuthenticated } = useAuthContext();
  const agentsMap = useAgentsMap({ isAuthenticated });
  useEffect(() => {
    if (urlAgent) {
      injectAgentIntoAgentsMap(queryClient, urlAgent);
    }
  }, [urlAgent, queryClient, agentsMap]);
}
