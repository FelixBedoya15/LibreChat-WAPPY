import React, { memo, useCallback, useEffect, useState } from 'react';
import { useRecoilValue } from 'recoil';
import { useForm } from 'react-hook-form';
import { Spinner } from '@librechat/client';
import { useParams } from 'react-router-dom';
import { Constants, buildTree } from 'librechat-data-provider';
import type { TMessage } from 'librechat-data-provider';
import type { ChatFormValues } from '~/common';
import { ChatContext, AddedChatContext, useFileMapContext, ChatFormProvider } from '~/Providers';
import { useChatHelpers, useAddedResponse, useSSE } from '~/hooks';
import ConversationStarters from './Input/ConversationStarters';
import { useGetMessagesByConvoId, useGetAgentByIdQuery } from '~/data-provider';
import MessagesView from './Messages/MessagesView';
import Presentation from './Presentation';
import ChatForm from './Input/ChatForm';
import Landing from './Landing';
import Header from './Header';
import Footer from './Footer';
import { cn } from '~/utils';
import store from '~/store';
import MatrizIPEVARTable from '../SGSST/MatrizIPEVARTable';
const isMobileScreen = () => window.innerWidth <= 768;

function LoadingSpinner() {
  return (
    <div className="relative flex-1 overflow-hidden overflow-y-auto">
      <div className="relative flex h-full items-center justify-center">
        <Spinner className="text-text-primary" />
      </div>
    </div>
  );
}

function ChatView({ index = 0 }: { index?: number }) {
  const { conversationId } = useParams();
  const rootSubmission = useRecoilValue(store.submissionByIndex(index));
  const addedSubmission = useRecoilValue(store.submissionByIndex(index + 1));
  const centerFormOnLanding = useRecoilValue(store.centerFormOnLanding);

  const fileMap = useFileMapContext();

  const { data: messagesTree = null, isLoading } = useGetMessagesByConvoId(conversationId ?? '', {
    select: useCallback(
      (data: TMessage[]) => {
        const dataTree = buildTree({ messages: data, fileMap });
        return dataTree?.length === 0 ? null : (dataTree ?? null);
      },
      [fileMap],
    ),
    enabled: !!fileMap,
  });

  const chatHelpers = useChatHelpers(index, conversationId);
  const addedChatHelpers = useAddedResponse({ rootIndex: index });

  useSSE(rootSubmission, chatHelpers, false);
  useSSE(addedSubmission, addedChatHelpers, true);

  const methods = useForm<ChatFormValues>({
    defaultValues: { text: '' },
  });

  const conversation = useRecoilValue(store.conversationByIndex(index));

  const { data: agent } = useGetAgentByIdQuery(conversation?.agent_id as string | undefined, {
    enabled: !!conversation?.agent_id && conversation?.endpoint === 'agents',
  });

  // ── IPEVAR Persistence Hack para Multi-Agentes (@) ───────────────────────
  // Si inicias con un Agente que tiene la herramienta, y luego usas `@` para
  // llamar a un psicólogo, el `agent` activo cambia y pierdes sus tools. Esto
  // memoriza que en ESTA conversación la matriz estaba activa, y no la oculta.
  const activeConvosRef = React.useRef<Set<string>>(new Set());

  const currentIsIPEVARActive = React.useMemo(() => {
    // Check if the tool is assigned to the current plugin/conversation
    // tools can be TPlugin[] or string[]
    const tools = conversation?.tools ?? [];
    const hasToolByKey = tools.some((t) =>
      typeof t === 'string' ? t === 'matriz_ipevar' : t.pluginKey === 'matriz_ipevar',
    );
    if (hasToolByKey) return true;

    // Check if tool is assigned to the current Agent
    const agentTools = agent?.tools ?? [];
    const hasAgentToolByKey = agentTools.some(
      (t: string | { pluginKey?: string }) =>
        typeof t === 'string' ? t === 'matriz_ipevar' : t.pluginKey === 'matriz_ipevar',
    );
    if (hasAgentToolByKey) return true;

    // Fallback: detect from message history if the tool was actually called
    if (
      messagesTree?.some(
        (msg) =>
          msg.plugin?.plugin === 'matriz_ipevar' ||
          msg.plugins?.some((p) => p.plugin === 'matriz_ipevar'),
      )
    ) return true;

    return false;
  }, [conversation?.tools, messagesTree, agent?.tools]);

  const isIPEVARActive = React.useMemo(() => {
    if (currentIsIPEVARActive) return true;
    if (conversationId && activeConvosRef.current.has(conversationId)) return true;
    return false;
  }, [currentIsIPEVARActive, conversationId]);

  useEffect(() => {
    if (currentIsIPEVARActive && conversationId) {
      activeConvosRef.current.add(conversationId);
    }
  }, [currentIsIPEVARActive, conversationId]);

  // ── Emit active state to Header mobile button ─────────────────────────────
  useEffect(() => {
    const isMatrixRealized = isIPEVARActive && !!conversationId && conversationId !== Constants.NEW_CONVO;
    window.dispatchEvent(new CustomEvent('ipevar:active', { detail: { active: isMatrixRealized } }));
  }, [isIPEVARActive, conversationId]);

  // ── Mobile: track whether IPEVAR panel is expanded ────────────────────────
  const [mobileExpanded, setMobileExpanded] = useState(false);
  useEffect(() => {
    const handler = (e: Event) => {
      setMobileExpanded((e as CustomEvent).detail?.isMaximized ?? false);
    };
    window.addEventListener('ipevar:maximized', handler);
    return () => window.removeEventListener('ipevar:maximized', handler);
  }, []);

  let content: JSX.Element | null | undefined;
  const isLandingPage =
    (!messagesTree || messagesTree.length === 0) &&
    (conversationId === Constants.NEW_CONVO || !conversationId);
  const isNavigating = (!messagesTree || messagesTree.length === 0) && conversationId != null;

  if (isLoading && conversationId !== Constants.NEW_CONVO) {
    content = <LoadingSpinner />;
  } else if ((isLoading || isNavigating) && !isLandingPage) {
    content = <LoadingSpinner />;
  } else if (!isLandingPage) {
    content = <MessagesView messagesTree={messagesTree} />;
  } else {
    content = <Landing centerFormOnLanding={centerFormOnLanding} />;
  }

  return (
    <ChatFormProvider {...methods}>
      <ChatContext.Provider value={chatHelpers}>
        <AddedChatContext.Provider value={addedChatHelpers}>
          <Presentation>
            <div className="flex h-full w-full flex-col">
              {!isLoading && <Header />}
              <>
                <div className="flex h-full w-full overflow-hidden">
                  <div
                    className={cn(
                      'flex flex-col flex-1',
                      isLandingPage
                        ? 'items-center justify-end sm:justify-center'
                        : 'h-full overflow-y-auto',
                    )}
                  >
                    {content}
                    <div
                      className={cn(
                        'w-full',
                        isLandingPage && 'max-w-3xl transition-all duration-200 xl:max-w-4xl',
                      )}
                    >
                      <ChatForm index={index} />
                      {isLandingPage ? <ConversationStarters /> : <Footer />}
                    </div>
                  </div>
                  {isIPEVARActive && (
                    <div className={cn(
                      'h-full flex-shrink-0 border-l border-border-medium shadow-l bg-surface-primary gt45-matrix-panel',
                      // Desktop: always visible at half width
                      // Mobile: hidden by default, only shown when mobileExpanded
                      isMobileScreen()
                        ? mobileExpanded
                          ? 'fixed inset-0 z-[9990] w-full'
                          : 'hidden'
                        : 'w-1/2',
                    )}>
                      <MatrizIPEVARTable key={conversationId ?? 'new'} conversationId={conversationId ?? null} />
                    </div>
                  )}
                </div>
                {isLandingPage && <Footer />}
              </>
            </div>
          </Presentation>
        </AddedChatContext.Provider>
      </ChatContext.Provider>
    </ChatFormProvider>
  );
}

export default memo(ChatView);
