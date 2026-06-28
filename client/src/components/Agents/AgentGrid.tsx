import React, { useMemo, useEffect } from 'react';
import { Spinner } from '@librechat/client';
import { PermissionBits } from 'librechat-data-provider';
import type t from 'librechat-data-provider';
import { useMarketplaceAgentsInfiniteQuery } from '~/data-provider/Agents';
import { useAgentCategories, useLocalize } from '~/hooks';
import { useInfiniteScroll } from '~/hooks/useInfiniteScroll';
import { useHasData } from './SmartLoader';
import ErrorDisplay from './ErrorDisplay';
import AgentCard from './AgentCard';

interface AgentGridProps {
  category: string; // Currently selected category
  searchQuery: string; // Current search query
  onSelectAgent: (agent: t.Agent) => void; // Callback when agent is selected
  scrollElementRef?: React.RefObject<HTMLElement>; // Parent scroll container ref for infinite scroll
}

/**
 * Component for displaying a grid of agent cards
 */
const AgentGrid: React.FC<AgentGridProps> = ({
  category,
  searchQuery,
  onSelectAgent,
  scrollElementRef,
}) => {
  const localize = useLocalize();

  // Get category data from API
  const { categories } = useAgentCategories();

  // Build query parameters based on current state
  const queryParams = useMemo(() => {
    const params: {
      requiredPermission: number;
      category?: string;
      search?: string;
      limit: number;
      promoted?: 0 | 1;
    } = {
      requiredPermission: PermissionBits.VIEW, // View permission for marketplace viewing
      limit: 12,
    };

    // Handle search
    if (searchQuery) {
      params.search = searchQuery;
      // Include category filter for search if it's not 'all' or 'promoted'
      if (category !== 'all' && category !== 'promoted') {
        params.category = category;
      }
    } else {
      // Handle category-based queries
      if (category === 'promoted') {
        params.promoted = 1;
      } else if (category !== 'all' && category !== 'favorites') {
        params.category = category;
      }
      // For 'all' category, no additional filters needed
    }

    return params;
  }, [category, searchQuery]);

  // Use infinite query for marketplace agents
  const {
    data,
    isLoading,
    error,
    isFetching,
    fetchNextPage,
    hasNextPage,
    refetch,
    isFetchingNextPage,
  } = useMarketplaceAgentsInfiniteQuery(queryParams);

  // State for favorite agents stored in localStorage
  const [favoriteAgentIds, setFavoriteAgentIds] = React.useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('wappy_favorite_agents');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch (e) {
      return new Set();
    }
  });

  const getAgentUniqueId = (agent: t.Agent): string => {
    return agent.id || (agent as any)._id || agent.name || '';
  };

  const toggleFavorite = (agent: t.Agent) => {
    const agentId = getAgentUniqueId(agent);
    if (!agentId) return;
    setFavoriteAgentIds((prev) => {
      const next = new Set(prev);
      if (next.has(agentId)) {
        next.delete(agentId);
      } else {
        next.add(agentId);
      }
      try {
        localStorage.setItem('wappy_favorite_agents', JSON.stringify(Array.from(next)));
      } catch (e) {
        // ignore
      }
      return next;
    });
  };

  // Flatten all pages, deduplicate, and sort favorited agents first
  const currentAgents = useMemo(() => {
    if (!data?.pages) return [];
    const flattened = data.pages.flatMap((page) => page.data || []);
    
    // Deduplicate agents by unique ID
    const uniqueMap = new Map<string, t.Agent>();
    for (const agent of flattened) {
      const id = getAgentUniqueId(agent);
      if (id && !uniqueMap.has(id)) {
        uniqueMap.set(id, agent);
      }
    }
    let unique = Array.from(uniqueMap.values());

    if (category === 'favorites') {
      unique = unique.filter((agent) => favoriteAgentIds.has(getAgentUniqueId(agent)));
    }

    return unique.sort((a, b) => {
      const aFav = favoriteAgentIds.has(getAgentUniqueId(a));
      const bFav = favoriteAgentIds.has(getAgentUniqueId(b));
      if (aFav && !bFav) return -1;
      if (!aFav && bFav) return 1;
      return 0;
    });
  }, [data?.pages, favoriteAgentIds, category]);

  // Check if we have meaningful data to prevent unnecessary loading states
  const hasData = useHasData(data?.pages?.[0]);

  // Set up infinite scroll
  const { setScrollElement } = useInfiniteScroll({
    hasNextPage,
    isLoading: isFetching || isFetchingNextPage,
    fetchNextPage: () => {
      if (hasNextPage && !isFetching) {
        fetchNextPage();
      }
    },
    threshold: 0.8, // Trigger when 80% scrolled
    throttleMs: 200,
  });

  // Connect the scroll element when it's provided
  useEffect(() => {
    const scrollElement = scrollElementRef?.current;
    if (scrollElement) {
      setScrollElement(scrollElement);
    }
  }, [scrollElementRef, setScrollElement]);

  /**
   * Get category display name from API data or use fallback
   */
  const getCategoryDisplayName = (categoryValue: string) => {
    const categoryData = categories.find((cat) => cat.value === categoryValue);
    if (categoryData) {
      return categoryData.label;
    }

    // Fallback for special categories or unknown categories
    if (categoryValue === 'promoted') {
      return localize('com_agents_top_picks');
    }
    if (categoryValue === 'all') {
      return 'All';
    }

    // Simple capitalization for unknown categories
    return categoryValue.charAt(0).toUpperCase() + categoryValue.slice(1);
  };

  // Simple loading spinner
  const loadingSpinner = (
    <div className="flex justify-center py-12">
      <Spinner className="h-8 w-8 text-primary" />
    </div>
  );

  // Handle error state with enhanced error display
  if (error) {
    return (
      <ErrorDisplay
        error={error || 'Unknown error occurred'}
        onRetry={() => refetch()}
        context={{
          searchQuery,
          category,
        }}
      />
    );
  }

  // Main content component with proper semantic structure
  const mainContent = (
    <div
      className="space-y-6"
      role="tabpanel"
      id={`category-panel-${category}`}
      aria-labelledby={`category-tab-${category}`}
      aria-live="polite"
      aria-busy={isLoading && !hasData}
    >
      {/* Handle empty results with enhanced accessibility */}
      {(!currentAgents || currentAgents.length === 0) && !isLoading && !isFetching ? (
        <div
          className="py-12 text-center text-text-secondary"
          role="status"
          aria-live="polite"
        >
          <h3 className="mb-2 text-lg font-medium">
            {category === 'favorites'
              ? 'No tienes agentes marcados como favoritos ⭐'
              : localize('com_agents_empty_state_heading')}
          </h3>
          {category === 'favorites' && (
            <p className="text-sm text-text-secondary/80">
              Haz clic en la estrella de cualquier agente para guardarlo en tu lista de favoritos.
            </p>
          )}
        </div>
      ) : (
        <>
          {/* Announcement for screen readers */}
          <div id="search-results-count" className="sr-only" aria-live="polite" aria-atomic="true">
            {localize('com_agents_grid_announcement', {
              count: currentAgents?.length || 0,
              category: getCategoryDisplayName(category),
            })}
          </div>

          {/* Agent grid - 4 per row on large screens */}
          {currentAgents && currentAgents.length > 0 && (
            <div
              className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
              role="grid"
              aria-label={localize('com_agents_grid_announcement', {
                count: currentAgents.length,
                category: getCategoryDisplayName(category),
              })}
            >
              {currentAgents.map((agent: t.Agent, index: number) => {
                const agentId = getAgentUniqueId(agent);
                return (
                  <div key={`${agentId}-${index}`} role="gridcell">
                    <AgentCard
                      agent={agent}
                      onClick={() => onSelectAgent(agent)}
                      isFavorite={favoriteAgentIds.has(agentId)}
                      onToggleFavorite={() => toggleFavorite(agent)}
                    />
                  </div>
                );
              })}
            </div>
          )}

          {/* Loading indicator when fetching more with accessibility */}
          {isFetchingNextPage && (
            <div
              className="flex justify-center py-8"
              role="status"
              aria-live="polite"
              aria-label={localize('com_agents_loading')}
            >
              <Spinner className="h-6 w-6 text-primary" />
              <span className="sr-only">{localize('com_agents_loading')}</span>
            </div>
          )}

          {/* End of results indicator */}
          {!hasNextPage && currentAgents && currentAgents.length > 0 && (
            <div className="mt-8 text-center">
              <p className="text-sm text-text-secondary">
                {localize('com_agents_no_more_results')}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );

  if (isLoading || (isFetching && !isFetchingNextPage)) {
    return loadingSpinner;
  }
  return mainContent;
};

export default AgentGrid;
