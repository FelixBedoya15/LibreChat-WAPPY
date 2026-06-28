import React, { useMemo } from 'react';
import { Label } from '@librechat/client';
import { Star } from 'lucide-react';
import type t from 'librechat-data-provider';
import { useLocalize, TranslationKeys, useAgentCategories } from '~/hooks';
import { cn, renderAgentAvatar, getContactDisplayName } from '~/utils';

interface AgentCardProps {
  agent: t.Agent; // The agent data to display
  onClick: () => void; // Callback when card is clicked
  className?: string; // Additional CSS classes
}

/**
 * Card component to display agent information in Image 1 grid style
 */
const AgentCard: React.FC<AgentCardProps> = ({ agent, onClick, className = '' }) => {
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
        'group relative flex flex-col items-center justify-between min-h-[220px] p-6 rounded-2xl border border-border-light',
        'cursor-pointer shadow-sm transition-all duration-300 hover:border-teal-500/50 hover:shadow-xl hover:-translate-y-1',
        'bg-surface-primary dark:bg-surface-secondary hover:bg-surface-hover',
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
      {/* Favorite star icon top left/right */}
      <div className="absolute top-4 left-4 text-text-secondary/40 group-hover:text-amber-400 transition-colors">
        <Star className="h-4 w-4" />
      </div>

      {/* Center column content */}
      <div className="flex flex-col items-center text-center w-full mt-2">
        {/* Prominent circular Avatar */}
        <div className="relative mb-4 flex-shrink-0 transition-transform duration-300 group-hover:scale-105">
          <div className="rounded-full p-1 bg-gradient-to-tr from-teal-500/20 to-emerald-500/20 shadow-inner">
            {renderAgentAvatar(agent, { size: 'lg', showBorder: true })}
          </div>
        </div>

        {/* Agent Name */}
        <h3 className="text-base sm:text-lg font-bold text-text-primary line-clamp-1 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
          {agent.name}
        </h3>

        {/* Category / Subtitle */}
        <p className="mt-1 text-xs sm:text-sm font-medium text-text-secondary line-clamp-1">
          {categoryLabel || displayName || agent.description || 'Agente de IA'}
        </p>
      </div>

      {/* Description or extra badge if available */}
      {agent.description && (
        <p className="mt-2 text-xs text-text-secondary/80 line-clamp-2 text-center w-full">
          {agent.description}
        </p>
      )}
    </div>
  );
};

export default AgentCard;

