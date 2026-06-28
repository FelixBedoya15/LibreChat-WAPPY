import React, { useMemo } from 'react';
import { Label } from '@librechat/client';
import { Star } from 'lucide-react';
import type t from 'librechat-data-provider';
import { useLocalize, TranslationKeys, useAgentCategories } from '~/hooks';
import { cn, renderAgentAvatar, getContactDisplayName } from '~/utils';

interface AgentCardProps {
  agent: t.Agent; // The agent data to display
  onClick: () => void; // Callback when card is clicked
  isFavorite?: boolean; // Whether agent is favorited
  onToggleFavorite?: (e: React.MouseEvent) => void; // Callback to toggle favorite
  className?: string; // Additional CSS classes
}

/**
 * Card component to display agent information in Image 1 grid style
 */
const AgentCard: React.FC<AgentCardProps> = ({
  agent,
  onClick,
  isFavorite = false,
  onToggleFavorite,
  className = '',
}) => {
  const localize = useLocalize();
  const { categories } = useAgentCategories();

  const categoryLabel = useMemo(() => {
    if (!agent.category) return '';

    const category = categories.find((cat) => cat.value === agent.category);
    if (category) {
      if (category.label && category.label.startsWith('com_')) {
        return localize(category.label as TranslationKeys);
      }
      return category.label;
    }

    return agent.category.charAt(0).toUpperCase() + agent.category.slice(1);
  }, [agent.category, categories, localize]);

  const displayName = getContactDisplayName(agent);

  return (
    <div
      className={cn(
        'group relative flex h-[285px] w-full flex-col items-center justify-between p-6 rounded-2xl border border-border-light dark:border-gray-700/60',
        'cursor-pointer shadow-sm transition-all duration-300 hover:border-teal-500/50 hover:shadow-xl hover:-translate-y-1',
        'bg-white dark:bg-gray-900/90 hover:bg-surface-hover dark:hover:bg-gray-800/90',
        className,
      )}
      onClick={onClick}
      aria-label={localize('com_agents_agent_card_label', {
        name: agent.name,
        description: agent.description ?? '',
      })}
      aria-describedby={`agent-${agent.id}-description`}
      tabIndex={0}
      role="button"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {/* Favorite star button top left */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite?.(e);
        }}
        className={cn(
          'absolute top-4 left-4 z-10 p-1.5 rounded-full transition-all duration-200 hover:scale-110 focus:outline-none',
          isFavorite
            ? 'text-amber-400 fill-amber-400 bg-amber-400/10'
            : 'text-text-secondary/40 hover:text-amber-400 hover:bg-surface-tertiary',
        )}
        title={isFavorite ? 'Quitar de favoritos' : 'Marcar como favorito'}
        aria-label={isFavorite ? 'Quitar de favoritos' : 'Marcar como favorito'}
      >
        <Star className={cn('h-4 w-4', isFavorite && 'fill-amber-400 text-amber-400')} />
      </button>

      {/* Center column content */}
      <div className="flex flex-col items-center text-center w-full mt-2">
        {/* Prominent circular Avatar */}
        <div className="relative mb-3 flex-shrink-0 transition-transform duration-300 group-hover:scale-105">
          <div className="rounded-full p-1 bg-gradient-to-tr from-teal-500/20 to-emerald-500/20 shadow-inner">
            {renderAgentAvatar(agent, { size: 'lg', showBorder: true })}
          </div>
        </div>

        {/* Agent Name */}
        <h3 className="text-base sm:text-lg font-bold text-text-primary line-clamp-1 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors w-full px-2">
          {agent.name}
        </h3>

        {/* Category / Subtitle */}
        <p className="mt-1 text-xs sm:text-sm font-semibold text-teal-600 dark:text-teal-400 line-clamp-1 w-full px-2">
          {categoryLabel || displayName || 'Agente de IA'}
        </p>
      </div>

      {/* Description container with fixed height for 100% uniform cards */}
      <div className="h-10 w-full flex items-center justify-center">
        <p className="text-xs text-text-secondary dark:text-gray-200 line-clamp-2 text-center w-full font-normal">
          {agent.description ?? ''}
        </p>
      </div>
    </div>
  );
};

export default AgentCard;

