import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '~/utils';

export interface WappyExpandButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ComponentType<{ className?: string }> | React.ReactNode;
  label: string;
  variant?: 'teal' | 'red' | 'orange' | 'emerald' | 'blue' | 'neutral' | 'gradient-orange' | 'gradient-teal';
  isLoading?: boolean;
}

export const WappyExpandButton = forwardRef<HTMLButtonElement, WappyExpandButtonProps>(
  (
    {
      icon,
      label,
      variant = 'teal',
      isLoading = false,
      className,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const variantStyles = {
      teal: 'bg-white dark:bg-gray-900 border-border-medium/40 text-teal-600 dark:text-teal-400 hover:bg-teal-50/50 dark:hover:bg-teal-950/20 shadow-sm',
      red: 'bg-white dark:bg-gray-900 border-border-medium/40 text-rose-600 dark:text-rose-400 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 shadow-sm',
      orange: 'bg-white dark:bg-gray-900 border-border-medium/40 text-amber-600 dark:text-amber-400 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 shadow-sm',
      emerald: 'bg-white dark:bg-gray-900 border-border-medium/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 shadow-sm',
      blue: 'bg-white dark:bg-gray-900 border-border-medium/40 text-blue-600 dark:text-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 shadow-sm',
      neutral: 'bg-white dark:bg-gray-900 border-border-medium/40 text-text-secondary hover:text-text-primary hover:bg-surface-hover shadow-sm',
      'gradient-orange': 'bg-white dark:bg-gray-900 border-border-medium/40 text-amber-600 dark:text-amber-400 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 shadow-sm',
      'gradient-teal': 'bg-white dark:bg-gray-900 border-border-medium/40 text-teal-600 dark:text-teal-400 hover:bg-teal-50/50 dark:hover:bg-teal-950/20 shadow-sm',
    };

    const renderIcon = () => {
      if (isLoading) {
        return <Loader2 className="w-4 h-4 sm:w-4.5 sm:h-4.5 animate-spin shrink-0" />;
      }
      if (!icon) {
        return null;
      }
      if (React.isValidElement(icon)) {
        return icon;
      }
      if (typeof icon === 'function' || (typeof icon === 'object' && icon !== null && '$$typeof' in icon)) {
        const IconComponent = icon as React.ComponentType<{ className?: string }>;
        return <IconComponent className="w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0" />;
      }
      return null;
    };

    return (
      <button
        ref={ref}
        type="button"
        disabled={disabled || isLoading}
        title={props.title || label}
        className={cn(
          'group flex h-9 min-w-[36px] sm:h-10 sm:min-w-[40px] items-center justify-center rounded-xl border px-3.5 sm:px-3 shadow-sm transition-all duration-300 ease-in-out active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0',
          variantStyles[variant],
          className,
        )}
        {...props}
      >
        <div className="relative flex shrink-0 items-center justify-center">
          {renderIcon()}
        </div>
        <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[260px] group-hover:opacity-100 sm:flex">
          <span className="text-xs sm:text-sm font-bold tracking-wide">{label}</span>
        </div>
        {/* En móvil mostrar texto compacto para usabilidad táctil */}
        <span className="sm:hidden text-xs font-bold ml-1.5">{label}</span>
      </button>
    );
  },
);

WappyExpandButton.displayName = 'WappyExpandButton';

export default WappyExpandButton;
