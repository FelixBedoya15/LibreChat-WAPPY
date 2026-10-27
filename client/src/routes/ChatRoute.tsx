import { useEffect } from 'react';
import { Spinner } from '@librechat/client';
import { useParams, useNavigate } from 'react-router-dom';
import { Constants, EModelEndpoint } from 'librechat-data-provider';
import { useGetModelsQuery } from 'librechat-data-provider/react-query';
import type { TPreset } from 'librechat-data-provider';
import { useGetConvoIdQuery, useGetStartupConfig, useGetEndpointsQuery } from '~/data-provider';
import { useNewConvo, useAppStartup, useAssistantListMap, useIdChangeEffect } from '~/hooks';
import { getDefaultModelSpec, getModelSpecPreset, logger } from '~/utils';
import { ToolCallsMapProvider } from '~/Providers';
import ChatView from '~/components/Chat/ChatView';
import TenshiAvatar from '~/components/Tenshi/TenshiAvatar';
import useAuthRedirect from './useAuthRedirect';
import temporaryStore from '~/store/temporary';
import { useRecoilCallback } from 'recoil';
import store from '~/store';

export default function ChatRoute() {
  const { data: startupConfig } = useGetStartupConfig();
  const { isAuthenticated, user } = useAuthRedirect();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.isSubUser) {
      const subPerms = user.subUserPermissions || [];
      const hasChat = subPerms.includes('chat:wappy_general') || subPerms.includes('chat:sst_specialist');
      if (!hasChat) {
        const hasSgsst = subPerms.some(p => p.startsWith('sgsst:') || p.startsWith('audit:') || p.startsWith('kanban:'));
        const hasLms = subPerms.some(p => p.startsWith('lms:'));
        if (hasSgsst) {
          navigate('/sgsst', { replace: true });
        } else if (hasLms) {
          navigate('/academia', { replace: true });
        } else {
          navigate('/sgsst', { replace: true });
        }
      }
    }
  }, [user, navigate]);

  const setIsTemporary = useRecoilCallback(
    ({ set }) =>
      (value: boolean) => {
        set(temporaryStore.isTemporary, value);
      },
    [],
  );
  useAppStartup({ startupConfig, user });

  const index = 0;
  const { conversationId = '' } = useParams();
  useIdChangeEffect(conversationId);
  const { hasSetConversation, conversation } = store.useCreateConversationAtom(index);
  const { newConversation } = useNewConvo();

  const modelsQuery = useGetModelsQuery({
    enabled: isAuthenticated,
    refetchOnMount: 'always',
  });
  const initialConvoQuery = useGetConvoIdQuery(conversationId, {
    enabled:
      isAuthenticated && conversationId !== Constants.NEW_CONVO && !hasSetConversation.current,
    retry: false,
  });
  const endpointsQuery = useGetEndpointsQuery({ enabled: isAuthenticated });
  const assistantListMap = useAssistantListMap();

  const isTemporaryChat = conversation && conversation.expiredAt ? true : false;

  useEffect(() => {
    if (conversationId !== Constants.NEW_CONVO && !isTemporaryChat) {
      setIsTemporary(false);
    } else if (isTemporaryChat) {
      setIsTemporary(isTemporaryChat);
    }
  }, [conversationId, isTemporaryChat, setIsTemporary]);

  /** This effect is mainly for the first conversation state change on first load of the page.
   *  Adjusting this may have unintended consequences on the conversation state.
   */
  useEffect(() => {
    const shouldSetConvo =
      (startupConfig && !hasSetConversation.current && !modelsQuery.data?.initial) ?? false;
    /* Early exit if startupConfig is not loaded and conversation is already set and only initial models have loaded */
    if (!shouldSetConvo) {
      return;
    }

    if (conversationId === Constants.NEW_CONVO && endpointsQuery.data && modelsQuery.data) {
      const result = getDefaultModelSpec(startupConfig);
      const spec = result?.default ?? result?.last;
      logger.log('conversation', 'ChatRoute, new convo effect', conversation);
      newConversation({
        modelsData: modelsQuery.data,
        template: conversation ? conversation : undefined,
        ...(spec ? { preset: getModelSpecPreset(spec) } : {}),
      });

      hasSetConversation.current = true;
    } else if (initialConvoQuery.data && endpointsQuery.data && modelsQuery.data) {
      logger.log('conversation', 'ChatRoute initialConvoQuery', initialConvoQuery.data);
      newConversation({
        template: initialConvoQuery.data,
        /* this is necessary to load all existing settings */
        preset: initialConvoQuery.data as TPreset,
        modelsData: modelsQuery.data,
        keepLatestMessage: true,
      });
      hasSetConversation.current = true;
    } else if (initialConvoQuery.isFetched && !initialConvoQuery.data && endpointsQuery.data && modelsQuery.data) {
      logger.log('conversation', 'ChatRoute convo not found fallback', conversationId);
      const result = getDefaultModelSpec(startupConfig);
      const spec = result?.default ?? result?.last;
      newConversation({
        modelsData: modelsQuery.data,
        template: { conversationId },
        ...(spec ? { preset: getModelSpecPreset(spec) } : {}),
      });
      hasSetConversation.current = true;
    } else if (
      conversationId === Constants.NEW_CONVO &&
      assistantListMap[EModelEndpoint.assistants] &&
      assistantListMap[EModelEndpoint.azureAssistants]
    ) {
      const result = getDefaultModelSpec(startupConfig);
      const spec = result?.default ?? result?.last;
      logger.log('conversation', 'ChatRoute new convo, assistants effect', conversation);
      newConversation({
        modelsData: modelsQuery.data,
        template: conversation ? conversation : undefined,
        ...(spec ? { preset: getModelSpecPreset(spec) } : {}),
      });
      hasSetConversation.current = true;
    } else if (
      assistantListMap[EModelEndpoint.assistants] &&
      assistantListMap[EModelEndpoint.azureAssistants]
    ) {
      if (initialConvoQuery.data) {
        logger.log('conversation', 'ChatRoute convo, assistants effect', initialConvoQuery.data);
        newConversation({
          template: initialConvoQuery.data,
          preset: initialConvoQuery.data as TPreset,
          modelsData: modelsQuery.data,
          keepLatestMessage: true,
        });
        hasSetConversation.current = true;
      } else if (initialConvoQuery.isFetched && !initialConvoQuery.data) {
        logger.log('conversation', 'ChatRoute convo not found assistants fallback', conversationId);
        const result = getDefaultModelSpec(startupConfig);
        const spec = result?.default ?? result?.last;
        newConversation({
          modelsData: modelsQuery.data,
          template: { conversationId },
          ...(spec ? { preset: getModelSpecPreset(spec) } : {}),
        });
        hasSetConversation.current = true;
      }
    }
    /* Creates infinite render if all dependencies included due to newConversation invocations exceeding call stack before hasSetConversation.current becomes truthy */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    startupConfig,
    initialConvoQuery.data,
    initialConvoQuery.isFetched,
    endpointsQuery.data,
    modelsQuery.data,
    assistantListMap,
  ]);

  if (endpointsQuery.isLoading || modelsQuery.isLoading) {
    return (
      <div
        className="flex h-screen flex-col items-center justify-center gap-4 bg-gradient-to-b from-teal-50/40 via-white to-amber-50/30 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 px-4 text-center"
        aria-live="polite"
        role="status"
      >
        <TenshiAvatar
          size={128}
          mood="working"
          showHaloEffect={true}
          showHUD={true}
          interactive={true}
          statusText="Sincronizando Ecosistema WAPPY IA..."
        />
        <div className="mt-4 max-w-md">
          <h2 className="bg-gradient-to-r from-teal-600 via-emerald-500 to-amber-500 bg-clip-text text-xl font-black tracking-tight text-transparent">
            WAPPY IA
          </h2>
          <p className="mt-1 text-xs font-medium text-slate-600 dark:text-zinc-400">
            Ecosistema de Inteligencia Artificial para Productividad Empresarial y Gestión SG-SST.
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // if not a conversation
  if (conversation?.conversationId === Constants.SEARCH) {
    return null;
  }
  // if conversationId not match
  if (conversation?.conversationId !== conversationId && !conversation) {
    return null;
  }
  // if conversationId is null
  if (!conversationId) {
    return null;
  }

  return (
    <ToolCallsMapProvider conversationId={conversation.conversationId ?? ''}>
      <ChatView index={index} />
    </ToolCallsMapProvider>
  );
}
