import { useState } from 'react';
import { GearIcon } from '@librechat/client';
import type { Action } from 'librechat-data-provider';
import { cn } from '~/utils';

export default function Action({ action, onClick }: { action: Action; onClick: () => void }) {
  const [isHovering, setIsHovering] = useState(false);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick();
        }
      }}
      className="group flex w-full h-10 items-center rounded-xl border border-border-medium/50 bg-surface-primary text-sm transition-all duration-300 hover:border-teal-400 hover:bg-surface-hover hover:scale-[1.02] shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      aria-label={`Action for ${action.metadata.domain}`}
    >
      <div
        className="grow overflow-hidden text-ellipsis whitespace-nowrap px-3 py-2 font-medium text-text-primary"
        style={{ wordBreak: 'break-all' }}
      >
        {action.metadata.domain}
      </div>
      <div
        className={cn(
          'h-10 w-10 min-w-10 items-center justify-center rounded-xl transition-all duration-300 group-hover:bg-teal-500/10 text-text-tertiary group-hover:text-teal-600',
          isHovering ? 'flex' : 'hidden',
        )}
        aria-label="Settings"
      >
        <GearIcon className="icon-sm" aria-hidden="true" />
      </div>
    </div>
  );
}
