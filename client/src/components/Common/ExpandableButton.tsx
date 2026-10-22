import React from 'react';
import { cn } from '~/utils';

export type ExpandableButtonVariant =
  | 'neutral'
  | 'teal'
  | 'purple'
  | 'emerald'
  | 'amber'
  | 'blue'
  | 'danger'
  | 'white';

export interface ExpandableButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  label: string;
  variant?: ExpandableButtonVariant;
  isActive?: boolean;
  size?: 'sm' | 'md';
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
  blue: {
    idle: 'bg-white dark:bg-gray-900 border-border-medium/40 text-blue-600 dark:text-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 shadow-sm',
    active: 'bg-blue-500/10 text-blue-600 border-blue-500/20 hover:bg-blue-500/20 dark:bg-blue-950/20 dark:text-blue-400 shadow-sm',
  },
  danger: {
    idle: 'bg-white dark:bg-gray-900 border-border-medium/40 text-rose-600 dark:text-rose-400 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 shadow-sm',
    active: 'bg-rose-500/10 text-rose-600 border-rose-500/20 hover:bg-rose-500/20 dark:bg-rose-950/20 dark:text-rose-400 shadow-sm',
  },
  white: {
    idle: 'bg-white text-teal-800 border-white/60 hover:bg-teal-50 shadow-sm',
    active: 'bg-teal-50 text-teal-900 border-white shadow-sm',
  },
};

export const ExpandableButton = React.forwardRef<HTMLButtonElement, ExpandableButtonProps>(
  (
    {
      icon,
      label,
      variant = 'neutral',
      isActive = false,
      size = 'md',
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
    const sizeClasses =
      size === 'sm'
        ? 'h-8 px-2.5 min-w-[32px] sm:h-8.5 sm:px-2.5 sm:min-w-[34px]'
        : 'h-9 px-3.5 min-w-[36px] sm:h-10 sm:px-3 sm:min-w-[40px]';
    const textClasses =
      size === 'sm'
        ? 'text-[11px] font-bold tracking-wide'
        : 'text-xs sm:text-sm font-bold tracking-wide';

    return (
      <button
        ref={ref}
        type={type}
        title={title || label}
        disabled={disabled}
        className={cn(
          'group flex items-center justify-center shrink-0',
          sizeClasses,
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
        <div className="hidden sm:flex items-center max-w-0 overflow-hidden opacity-0 group-hover:max-w-[220px] group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 ease-in-out whitespace-nowrap">
          <span className={textClasses}>{label}</span>
        </div>
      </button>
    );
  },
);

ExpandableButton.displayName = 'ExpandableButton';

export default ExpandableButton;
