import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useRecoilState } from 'recoil';
import { useOutletContext } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useSearchParams, useParams, useNavigate } from 'react-router-dom';
import { TooltipAnchor, Button, NewChatIcon, useMediaQuery } from '@librechat/client';
import {
  PermissionTypes,
  Permissions,
  QueryKeys,
  Constants,
  EModelEndpoint,
  PermissionBits,
  LocalStorageKeys,
  AgentListResponse,
} from 'librechat-data-provider';
import type t from 'librechat-data-provider';
import type { ContextType } from '~/common';
import { useDocumentTitle, useHasAccess, useLocalize, useDefaultConvo, TranslationKeys } from '~/hooks';
import { useGetEndpointsQuery, useGetAgentCategoriesQuery } from '~/data-provider';
import MarketplaceAdminSettings from './MarketplaceAdminSettings';
import { SidePanelProvider, useChatContext } from '~/Providers';
import { SidePanelGroup } from '~/components/SidePanel';
import { OpenSidebar } from '~/components/Chat/Menus';
import { cn, clearMessagesCache } from '~/utils';
import CategoryTabs from './CategoryTabs';
import AgentDetail from './AgentDetail';
import SearchBar from './SearchBar';
import AgentGrid from './AgentGrid';
import store from '~/store';

interface AgentMarketplaceProps {
  className?: string;
}

/**
 * AgentMarketplace - Main component for browsing and discovering agents
 *
 * Provides tabbed navigation for different agent categories,
 * search functionality, and detailed agent view through a modal dialog.
 * Uses URL parameters for state persistence and deep linking.
 */
const AgentMarketplace: React.FC<AgentMarketplaceProps> = ({ className = '' }) => {
  const localize = useLocalize();
  const navigate = useNavigate();
  const { category } = useParams();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const getDefaultConversation = useDefaultConvo();
  const { conversation, newConversation } = useChatContext();

  const isSmallScreen = useMediaQuery('(max-width: 768px)');
  const { navVisible, setNavVisible } = useOutletContext<ContextType>();
  const [hideSidePanel, setHideSidePanel] = useRecoilState(store.hideSidePanel);

  // Get URL parameters
  const searchQuery = searchParams.get('q') || '';
  const selectedAgentId = searchParams.get('agent_id') || '';

  // Animation state
  type Direction = 'left' | 'right';
  // Initialize with a default value to prevent rendering issues
  const [displayCategory, setDisplayCategory] = useState<string>(category || 'all');
  const [nextCategory, setNextCategory] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const [animationDirection, setAnimationDirection] = useState<Direction>('right');

  // Ref for the scrollable container to enable infinite scroll
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Local state
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<t.Agent | null>(null);

  // Set page title
  useDocumentTitle(`${localize('com_agents_marketplace')} | LibreChat`);

  // Ensure right sidebar is always visible in marketplace
  useEffect(() => {
    setHideSidePanel(false);

    // Also try to force expand via localStorage
    localStorage.setItem('hideSidePanel', 'false');
    localStorage.setItem('fullPanelCollapse', 'false');
  }, [setHideSidePanel, hideSidePanel]);

  // Ensure endpoints config is loaded first (required for agent queries)
  useGetEndpointsQuery();

  // Fetch categories using existing query pattern
  const categoriesQuery = useGetAgentCategoriesQuery({
    staleTime: 1000 * 60 * 15, // 15 minutes - categories rarely change
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });

  // Handle initial category when on /agents without a category
  useEffect(() => {
    if (
      !category &&
      window.location.pathname === '/agents' &&
      categoriesQuery.data &&
      displayCategory === 'all'
    ) {
      const hasPromoted = categoriesQuery.data.some((cat) => cat.value === 'promoted');
      if (hasPromoted) {
        // If promoted exists, update display to show it
        setDisplayCategory('promoted');
      }
    }
  }, [category, categoriesQuery.data, displayCategory]);

  /**
   * Handle agent card selection
   *
   * @param agent - The selected agent object
   */
  const handleAgentSelect = (agent: t.Agent) => {
    // Update URL with selected agent
    const newParams = new URLSearchParams(searchParams);
    newParams.set('agent_id', agent.id);
    setSearchParams(newParams);
    setSelectedAgent(agent);
    setIsDetailOpen(true);
  };

  /**
   * Handle closing the agent detail dialog
   */
  const handleDetailClose = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('agent_id');
    setSearchParams(newParams);
    setSelectedAgent(null);
    setIsDetailOpen(false);
  };

  /**
   * Determine ordered tabs to compute indices for direction
   */
  const orderedTabs = useMemo<string[]>(() => {
    const dynamic = (categoriesQuery.data || []).map((c) => c.value);
    // Only include values that actually exist in the categories
    const set = new Set<string>(dynamic);
    return Array.from(set);
  }, [categoriesQuery.data]);

  const getTabIndex = useCallback(
    (tab: string): number => {
      const idx = orderedTabs.indexOf(tab);
      return idx >= 0 ? idx : 0;
    },
    [orderedTabs],
  );

  /**
   * Handle category tab selection changes with directional animation
   */
  const handleTabChange = (tabValue: string) => {
    if (tabValue === displayCategory || isTransitioning) {
      // Ignore redundant or rapid clicks during transition
      return;
    }

    const currentIndex = getTabIndex(displayCategory);
    const newIndex = getTabIndex(tabValue);
    const direction: Direction = newIndex > currentIndex ? 'right' : 'left';

    setAnimationDirection(direction);
    setNextCategory(tabValue);
    setIsTransitioning(true);

    // Update URL immediately, preserving current search params
    const currentSearchParams = searchParams.toString();
    const searchParamsStr = currentSearchParams ? `?${currentSearchParams}` : '';
    if (tabValue === 'promoted') {
      navigate(`/agents${searchParamsStr}`);
    } else {
      navigate(`/agents/${tabValue}${searchParamsStr}`);
    }

    // Complete transition after 300ms
    window.setTimeout(() => {
      setDisplayCategory(tabValue);
      setNextCategory(null);
      setIsTransitioning(false);
    }, 300);
  };

  /**
   * Sync display when URL changes externally (back/forward)
   */
  useEffect(() => {
    if (category && category !== displayCategory && !isTransitioning) {
      // URL changed externally, update display without animation
      setDisplayCategory(category);
    }
  }, [category, displayCategory, isTransitioning]);

  // No longer needed with keyframes

  /**
   * Handle search query changes
   *
   * @param query - The search query string
   */
  const handleSearch = (query: string) => {
    const newParams = new URLSearchParams(searchParams);
    const currentCategory = displayCategory;

    if (query.trim()) {
      newParams.set('q', query.trim());
    } else {
      newParams.delete('q');
    }

    // Always preserve current category when searching or clearing search
    if (currentCategory === 'promoted') {
      navigate(`/agents${newParams.toString() ? `?${newParams.toString()}` : ''}`);
    } else {
      navigate(
        `/agents/${currentCategory}${newParams.toString() ? `?${newParams.toString()}` : ''}`,
      );
    }
  };

  /**
   * Handle new chat button click
   */

  const handleNewChat = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (e.button === 0 && (e.ctrlKey || e.metaKey)) {
      window.open('/c/new', '_blank');
      return;
    }
    clearMessagesCache(queryClient, conversation?.conversationId);
    queryClient.invalidateQueries([QueryKeys.messages]);
    newConversation();
    navigate('/c/new');
  };

  /**
   * Directly start a chat session with an agent and navigate to /c/new
   */
  const handleStartChatForAgent = (agent: t.Agent) => {
    if (agent) {
      const keys = [QueryKeys.agents, { requiredPermission: PermissionBits.EDIT }];
      const listResp = queryClient.getQueryData<AgentListResponse>(keys);
      if (listResp != null) {
        if (!listResp.data.some((a) => a.id === agent.id)) {
          const currentAgents = [agent, ...JSON.parse(JSON.stringify(listResp.data))];
          queryClient.setQueryData<AgentListResponse>(keys, { ...listResp, data: currentAgents });
        }
      }

      localStorage.setItem(`${LocalStorageKeys.AGENT_ID_PREFIX}0`, agent.id);
      clearMessagesCache(queryClient, conversation?.conversationId);
      queryClient.invalidateQueries([QueryKeys.messages]);

      const template = {
        conversationId: Constants.NEW_CONVO as string,
        endpoint: EModelEndpoint.agents,
        agent_id: agent.id,
        title: localize('com_agents_chat_with', { name: agent.name || localize('com_ui_agent') }),
      };

      const currentConvo = getDefaultConversation({
        conversation: { ...(conversation ?? {}), ...template },
        preset: template,
      });

      newConversation({
        template: currentConvo,
        preset: template,
      });
      navigate('/c/new');
    }
  };

  // Check if a detail view should be open based on URL
  useEffect(() => {
    setIsDetailOpen(!!selectedAgentId);
  }, [selectedAgentId]);

  // Layout configuration for SidePanelGroup
  const defaultLayout = useMemo(() => {
    const resizableLayout = localStorage.getItem('react-resizable-panels:layout');
    return typeof resizableLayout === 'string' ? JSON.parse(resizableLayout) : undefined;
  }, []);

  const defaultCollapsed = useMemo(() => {
    const collapsedPanels = localStorage.getItem('react-resizable-panels:collapsed');
    return typeof collapsedPanels === 'string' ? JSON.parse(collapsedPanels) : true;
  }, []);

  const fullCollapse = useMemo(() => localStorage.getItem('fullPanelCollapse') === 'true', []);

  const hasMarketplacePerm = useHasAccess({
    permissionType: PermissionTypes.MARKETPLACE,
    permission: Permissions.USE,
  });
  const hasAgentsPerm = useHasAccess({
    permissionType: PermissionTypes.AGENTS,
    permission: Permissions.USE,
  });
  const hasAccessToMarketplace = hasMarketplacePerm || hasAgentsPerm;

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    if (!hasAccessToMarketplace) {
      timeoutId = setTimeout(() => {
        navigate('/c/new');
      }, 1000);
    }
    return () => {
      clearTimeout(timeoutId);
    };
  }, [hasAccessToMarketplace, navigate]);

  if (!hasAccessToMarketplace) {
    return null;
  }
  return (
    <div className={`relative flex w-full grow overflow-hidden bg-presentation ${className}`}>
      <SidePanelProvider>
        <SidePanelGroup
          defaultLayout={defaultLayout}
          fullPanelCollapse={fullCollapse}
          defaultCollapsed={defaultCollapsed}
        >
          <main className="flex h-full flex-col overflow-hidden" role="main">
            {/* Scrollable container */}
            <div
              ref={scrollContainerRef}
              className="scrollbar-gutter-stable relative flex h-full flex-col overflow-y-auto overflow-x-hidden"
            >
              {/* Simplified header for agents marketplace - only show nav controls when needed */}
              {!isSmallScreen && (
                <div className="sticky top-0 z-20 flex items-center justify-between bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-slate-200/60 dark:border-zinc-800/60 px-4 py-2 font-semibold text-text-primary md:h-14">
                  <div className="mx-1 flex items-center gap-2">
                    {!navVisible && (
                      <>
                        <OpenSidebar setNavVisible={setNavVisible} />
                        <TooltipAnchor
                          description={localize('com_ui_new_chat')}
                          render={
                            <button
                              type="button"
                              data-testid="agents-new-chat-button"
                              aria-label={localize('com_ui_new_chat')}
                              className="inline-flex size-9 items-center justify-center rounded-xl border border-slate-200/80 dark:border-zinc-700/80 bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-700 hover:border-teal-400 active:scale-95 shadow-2xs transition-all cursor-pointer max-md:hidden"
                              onClick={handleNewChat}
                            >
                              <NewChatIcon className="h-4.5 w-4.5 text-teal-600 dark:text-teal-400" />
                            </button>
                          }
                        />
                      </>
                    )}
                  </div>
                </div>
              )}
              {/* Hero Section - SST Header */}
              {!isSmallScreen && (
                <div className="container mx-auto max-w-4xl px-4">
                  <div className={cn('mb-6 text-center', 'mt-8 sm:mt-10')}>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/50 border border-teal-500/30 text-teal-700 dark:text-teal-300 text-xs font-bold mb-3 shadow-2xs">
                      <span>⚡ INTELIGENCIA ARTIFICIAL ESPECIALIZADA</span>
                    </div>
                    <h1 className="mb-2 text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-zinc-100">
                      AGENTES SST
                    </h1>
                    <p className="mx-auto max-w-2xl text-xs sm:text-sm font-medium text-slate-500 dark:text-zinc-400">
                      Potencia la gestión de Seguridad y Salud en el Trabajo con nuestros agentes de Inteligencia Artificial especializados.
                    </p>
                  </div>
                </div>
              )}
              {/* Sticky wrapper for search bar and categories */}
              <div
                className={cn(
                  'sticky z-10 bg-presentation pb-4',
                  isSmallScreen ? 'top-0' : 'top-14',
                )}
              >
                <div className="container mx-auto max-w-4xl px-4">
                  {/* Search bar */}
                  <div className="mx-auto flex max-w-2xl gap-2 pb-6">
                    <SearchBar value={searchQuery} onSearch={handleSearch} />
                    {/* TODO: Remove this once we have a better way to handle admin settings */}
                    {/* Admin Settings */}
                    <MarketplaceAdminSettings />
                  </div>

                  {/* Category tabs */}
                  <CategoryTabs
                    categories={categoriesQuery.data || []}
                    activeTab={displayCategory}
                    isLoading={categoriesQuery.isLoading}
                    onChange={handleTabChange}
                  />
                </div>
              </div>
              {/* Scrollable content area */}
              <div className="container mx-auto max-w-4xl px-4 pb-8">
                {/* Two-pane animated container wrapping category header + grid */}
                <div className="relative overflow-hidden">
                  {/* Current content pane */}
                  <div
                    className={cn(
                      isTransitioning &&
                        (animationDirection === 'right'
                          ? 'motion-safe:animate-slide-out-left'
                          : 'motion-safe:animate-slide-out-right'),
                    )}
                    key={`pane-current-${displayCategory}`}
                  >
                    <div className="pt-4">
                      {/* Agent grid */}
                      <AgentGrid
                        key={`grid-${displayCategory}`}
                        category={displayCategory}
                        searchQuery={searchQuery}
                        onSelectAgent={handleAgentSelect}
                        onStartChat={handleStartChatForAgent}
                        scrollElementRef={scrollContainerRef}
                      />
                    </div>
                  </div>

                  {/* Next content pane, only during transition */}
                  {isTransitioning && nextCategory && (
                    <div
                      className={cn(
                        'absolute inset-0',
                        animationDirection === 'right'
                          ? 'motion-safe:animate-slide-in-right'
                          : 'motion-safe:animate-slide-in-left',
                      )}
                      key={`pane-next-${nextCategory}-${animationDirection}`}
                    >
                      <div className="pt-4">
                        {/* Agent grid */}
                        <AgentGrid
                          key={`grid-${nextCategory}`}
                          category={nextCategory}
                          searchQuery={searchQuery}
                          onSelectAgent={handleAgentSelect}
                          onStartChat={handleStartChatForAgent}
                          scrollElementRef={scrollContainerRef}
                        />
                      </div>
                    </div>
                  )}

                  {/* Note: Using Tailwind keyframes for slide in/out animations */}
                </div>
              </div>
              {/* Agent detail dialog */}
              {isDetailOpen && selectedAgent && (
                <AgentDetail
                  agent={selectedAgent}
                  isOpen={isDetailOpen}
                  onClose={handleDetailClose}
                />
              )}
            </div>
          </main>
        </SidePanelGroup>
      </SidePanelProvider>
    </div>
  );
};

export default AgentMarketplace;
