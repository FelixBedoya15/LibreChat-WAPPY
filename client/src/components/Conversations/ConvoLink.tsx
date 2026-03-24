import React from 'react';
import { cn } from '~/utils';

interface ConvoLinkProps {
  isActiveConvo: boolean;
  title: string | null;
  onRename: () => void;
  isSmallScreen: boolean;
  localize: (key: any, options?: any) => string;
  children: React.ReactNode;
}

const ConvoLink: React.FC<ConvoLinkProps> = ({
  isActiveConvo,
  title,
  onRename,
  isSmallScreen,
  localize,
  children,
}) => {
  return (
    <div
      className={cn(
        'flex grow items-center gap-2 overflow-hidden rounded-lg px-2',
        isActiveConvo ? 'bg-surface-active-alt' : '',
      )}
      title={title ?? undefined}
      aria-current={isActiveConvo ? 'page' : undefined}
      style={{ width: '100%' }}
    >
      {children}
      <div
        className="relative flex-1 grow overflow-hidden whitespace-nowrap group/label"
        onDoubleClick={(e) => {
          if (isSmallScreen) {
            return;
          }
          e.preventDefault();
          e.stopPropagation();
          onRename();
        }}
        aria-label={title || localize('com_ui_untitled')}
      >
        <span className="truncate block font-medium group-hover:text-teal-600 transition-colors duration-300">
          {title || localize('com_ui_untitled')}
        </span>
        
        {/* Floating Premium Label */}
        <div className="absolute left-0 top-0 mt-8 flex items-center max-w-0 overflow-hidden opacity-0 group-hover/label:max-w-[300px] group-hover/label:opacity-100 transition-all duration-300 ease-in-out whitespace-nowrap bg-teal-600 text-white px-3 py-1.5 rounded-lg shadow-2xl pointer-events-none z-[110] border border-teal-500/50">
          <span className="text-[10px] font-bold uppercase tracking-wider">{title || localize('com_ui_untitled')}</span>
        </div>
      </div>
      <div
        className={cn(
          'absolute bottom-0 right-0 top-0 w-20 rounded-r-lg bg-gradient-to-l pointer-events-none',
          isActiveConvo
            ? 'from-surface-active-alt'
            : 'from-surface-primary-alt from-0% to-transparent group-hover:from-surface-active-alt group-hover:from-40%',
        )}
        aria-hidden="true"
      />
    </div>
  );
};

export default ConvoLink;
