import React, { useMemo } from 'react';
import { Label } from '@librechat/client';
import { Star, Sparkles } from 'lucide-react';
import type t from 'librechat-data-provider';
import { useLocalize, TranslationKeys, useAgentCategories } from '~/hooks';
import { cn, renderAgentAvatar, getContactDisplayName } from '~/utils';

interface AgentCardProps {
  agent: t.Agent; // The agent data to display
  onClick: () => void; // Callback when card is clicked
  onStartChat?: () => void; // Callback when start chat button is clicked
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
  onStartChat,
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
        'group relative flex h-[260px] w-full flex-col items-center justify-between p-4 pb-4 rounded-3xl border border-slate-200/90 dark:border-zinc-800/90',
        'cursor-pointer shadow-sm transition-all duration-300 hover:border-teal-500/50 hover:shadow-xl hover:-translate-y-1',
        'bg-white dark:bg-zinc-900/90 hover:bg-slate-50/80 dark:hover:bg-zinc-800/90 backdrop-blur-md',
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
          'absolute top-3 left-3 z-10 p-1.5 rounded-xl transition-all duration-200 hover:scale-110 focus:outline-none cursor-pointer',
          isFavorite
            ? 'text-amber-400 fill-amber-400 bg-amber-400/15'
            : 'text-slate-300 dark:text-zinc-600 hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-zinc-800',
        )}
        title={isFavorite ? 'Quitar de favoritos' : 'Marcar como favorito'}
        aria-label={isFavorite ? 'Quitar de favoritos' : 'Marcar como favorito'}
      >
        <Star className={cn('h-4 w-4', isFavorite && 'fill-amber-400 text-amber-400')} />
      </button>

      {/* Center column content */}
      <div className="flex flex-col items-center justify-center text-center w-full my-auto px-1 pt-2">
        {/* Prominent Avatar */}
        <div className="relative mb-2.5 flex-shrink-0 transition-transform duration-300 group-hover:scale-105">
          <div className="rounded-2xl p-1.5 bg-gradient-to-tr from-teal-500/20 to-emerald-500/20 border border-teal-500/30 shadow-inner">
            {renderAgentAvatar(agent, { size: 'md', showBorder: true })}
          </div>
        </div>

        {/* Full Agent Name */}
        <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-zinc-100 text-center w-full px-1 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors leading-snug line-clamp-2">
          {agent.name}
        </h3>

        {/* Category Badge */}
        <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 border border-teal-500/20 max-w-[90%] truncate">
          {categoryLabel || displayName || 'Agente SST'}
        </div>
      </div>

      {/* Bottom micro-button with hover expansion */}
      <div className="w-full flex items-center justify-center pt-2 border-t border-slate-100 dark:border-zinc-800/60">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (onStartChat) {
              onStartChat();
            } else {
              onClick();
            }
          }}
          className="group/btn flex h-7 items-center justify-center rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-300 hover:bg-gradient-to-r hover:from-teal-600 hover:to-emerald-600 hover:text-white transition-all duration-300 px-3 shadow-2xs active:scale-95 cursor-pointer"
        >
          <Sparkles className="h-3.5 w-3.5 shrink-0" />
          <div className="flex max-w-[120px] items-center overflow-hidden whitespace-nowrap transition-all duration-300 ml-1.5">
            <span className="text-[11px] font-bold">Iniciar Chat</span>
          </div>
        </button>
      </div>
    </div>
  );
};

export default AgentCard;

