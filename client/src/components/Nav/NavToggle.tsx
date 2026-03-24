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
        // Sits centered on the 1px divider line
        'absolute top-1/2 -translate-y-1/2 transition-none',
        // Offset so the button straddles the border equally
        side === 'left' ? '-right-4' : '-left-4',
        'z-[2000]',
        className,
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
        className="flex items-center justify-center border-none bg-transparent p-0 outline-none cursor-pointer"
        tabIndex={0}
      >
        <motion.div
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className={cn(
            'flex h-6 w-6 items-center justify-center rounded-full border transition-colors duration-200 shadow-sm',
            'bg-surface-primary border-border-medium/50 hover:border-teal-400 text-text-secondary hover:text-teal-600',
          )}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {side === 'left' ? (
              navVisible
                ? <polyline points="15 18 9 12 15 6" />
                : <polyline points="9 18 15 12 9 6" />
            ) : (
              navVisible
                ? <polyline points="9 18 15 12 9 6" />
                : <polyline points="15 18 9 12 15 6" />
            )}
          </svg>
        </motion.div>
      </button>
    </div>
  );
}
