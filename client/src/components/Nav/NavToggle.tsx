import { motion } from 'framer-motion';
import { TooltipAnchor } from '@librechat/client';
import { useLocalize } from '~/hooks';
import { cn } from '~/utils';

export default function NavToggle({
  onToggle,
  navVisible,
  isHovering,
  setIsHovering,
  side = 'left',
  className = '',
  translateX = true,
}: {
  onToggle: () => void;
  navVisible: boolean;
  isHovering: boolean;
  setIsHovering: (isHovering: boolean) => void;
  side?: 'left' | 'right';
  className?: string;
  translateX?: boolean;
}) {
  const localize = useLocalize();
  
  return (
    <div
      className={cn(
        className,
        '-translate-y-1/2 transition-all duration-300 z-50',
        navVisible && translateX ? (side === 'left' ? 'translate-x-[260px]' : '-translate-x-[260px]') : 'translate-x-0',
      )}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <button
        aria-label={side === 'left' ? localize('com_ui_chat_history') : localize('com_ui_controls')}
        aria-expanded={navVisible}
        aria-controls={side === 'left' ? 'chat-history-nav' : 'controls-nav'}
        id={`toggle-${side}-nav`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onToggle();
        }}
        className="flex items-center justify-center p-0 border-none bg-transparent outline-none cursor-pointer"
        tabIndex={0}
      >
        <motion.div
           whileHover={{ scale: 1.1, rotate: side === 'left' ? -5 : 5, zIndex: 100 }}
           whileTap={{ scale: 0.9 }}
           className={cn(
             "group flex h-10 w-8 items-center justify-center rounded-xl border transition-all duration-300",
             "bg-surface-primary border-border-medium/50 hover:border-teal-400 text-text-secondary hover:text-teal-600 shadow-sm"
           )}
        >
          <div className={cn(
            "transition-transform duration-300",
            navVisible ? (side === 'left' ? "rotate-0" : "rotate-0") : (side === 'left' ? "rotate-180" : "rotate-180")
          )}>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              {side === 'left' ? (
                <polyline points="15 18 9 12 15 6"></polyline>
              ) : (
                <polyline points="9 18 15 12 9 6"></polyline>
              )}
            </svg>
          </div>
        </motion.div>
      </button>
    </div>
  );
}
