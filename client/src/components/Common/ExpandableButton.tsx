import React from 'react';
import { cn } from '~/utils';

export type ExpandableButtonVariant =
  | 'neutral'
  | 'teal'
  | 'purple'
  | 'emerald'
  | 'amber'
  | 'danger';

export interface ExpandableButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  label: string;
  variant?: ExpandableButtonVariant;
  isActive?: boolean;
}

const variantStyles: Record<ExpandableButtonVariant, { idle: string; active?: string }> = {
  neutral: {
    idle: 'bg-white dark:bg-gray-900 border-border-medium/40 text-text-secondary hover:text-text-primary hover:bg-surface-hover shadow-sm',
    active: 'bg-teal-500/10 text-teal-600 border-teal-500/20 hover:bg-teal-500/20 dark:bg-teal-950/20 dark:text-teal-400 shadow-sm',
  },
  teal: {
    idle: 'bg-white dark:bg-gray-900 border-border-medium/40 text-teal-600 dark:text-teal-400 hover:bg-teal-50/50 dark:hover:bg-teal-950/20 shadow-sm',
    active: 'bg-teal-500/10 text-teal-600 border-teal-500/20 hover:bg-teal-500/20 dark:bg-teal-950/20 dark:text-teal-400 shadow-sm',
  },
  purple: {
    idle: 'bg-white dark:bg-gray-900 border-border-medium/40 text-purple-600 dark:text-purple-400 hover:bg-purple-50/50 dark:hover:bg-purple-950/20 shadow-sm',
    active: 'bg-purple-500/10 text-purple-600 border-purple-500/20 hover:bg-purple-500/20 dark:bg-purple-950/20 dark:text-purple-400 shadow-sm',
  },
  emerald: {
    idle: 'bg-white dark:bg-gray-900 border-border-medium/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 shadow-sm',
    active: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20 dark:bg-emerald-950/20 dark:text-emerald-400 shadow-sm',
  },
  amber: {
    idle: 'bg-white dark:bg-gray-900 border-border-medium/40 text-amber-600 dark:text-amber-400 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 shadow-sm',
    active: 'bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/20 dark:bg-amber-950/20 dark:text-amber-400 shadow-sm',
  },
  danger: {
    idle: 'bg-white dark:bg-gray-900 border-border-medium/40 text-rose-600 dark:text-rose-400 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 shadow-sm',
    active: 'bg-rose-500/10 text-rose-600 border-rose-500/20 hover:bg-rose-500/20 dark:bg-rose-950/20 dark:text-rose-400 shadow-sm',
  },
};

export const ExpandableButton = React.forwardRef<HTMLButtonElement, ExpandableButtonProps>(
  (
    {
      icon,
      label,
      variant = 'neutral',
      isActive = false,
      className,
      disabled,
      title,
      type = 'button',
      ...rest
    },
    ref,
  ) => {
    const config = variantStyles[variant] || variantStyles.neutral;
    const currentStyle = isActive && config.active ? config.active : config.idle;

    return (
      <button
        ref={ref}
        type={type}
        title={title || label}
        disabled={disabled}
        className={cn(
          'group flex items-center justify-center h-9 px-3.5 min-w-[36px] sm:h-10 sm:px-3 sm:min-w-[40px]',
          'rounded-xl border outline-none cursor-pointer select-none',
          'transition-all duration-300 ease-in-out active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed',
          currentStyle,
          className,
        )}
        {...rest}
      >
        <div className="relative flex-shrink-0 flex items-center justify-center">
          {icon}
        </div>
        <div className="hidden sm:flex items-center max-w-0 overflow-hidden opacity-0 group-hover:max-w-[200px] group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 ease-in-out whitespace-nowrap">
          <span className="text-xs sm:text-sm font-bold tracking-wide">{label}</span>
        </div>
      </button>
    );
  },
);

ExpandableButton.displayName = 'ExpandableButton';

export default ExpandableButton;
