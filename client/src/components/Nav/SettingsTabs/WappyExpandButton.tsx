import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '~/utils';

export interface WappyExpandButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ComponentType<{ className?: string }> | React.ReactNode;
  label: string;
  variant?: 'teal' | 'red' | 'orange' | 'emerald' | 'blue' | 'neutral';
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
      teal: 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900/60 border-teal-200/80 dark:border-teal-800/80 shadow-teal-500/10 hover:border-teal-400',
      red: 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 border-red-200/80 dark:border-red-900/40 shadow-red-500/10 hover:border-red-400',
      orange: 'bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/50 border-orange-200/80 dark:border-orange-800/80 shadow-orange-500/10 hover:border-orange-400',
      emerald: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border-emerald-200/80 dark:border-emerald-800/80 shadow-emerald-500/10 hover:border-emerald-400',
      blue: 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 border-blue-200/80 dark:border-blue-800/80 shadow-blue-500/10 hover:border-blue-400',
      neutral: 'bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-700 border-slate-200 dark:border-zinc-700 shadow-slate-200/30 hover:border-slate-400',
    };

    const renderIcon = () => {
      if (isLoading) {
        return <Loader2 className="w-4 h-4 animate-spin shrink-0" />;
      }
      if (!icon) {
        return null;
      }
      if (React.isValidElement(icon)) {
        return icon;
      }
      if (typeof icon === 'function' || (typeof icon === 'object' && icon !== null && '$$typeof' in icon)) {
        const IconComponent = icon as React.ComponentType<{ className?: string }>;
        return <IconComponent className="w-4 h-4 shrink-0" />;
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
          'group flex h-9 min-w-[36px] items-center justify-center rounded-xl border px-2.5 shadow-2xs transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0',
          variantStyles[variant],
          className,
        )}
        {...props}
      >
        <div className="relative flex shrink-0 items-center justify-center">
          {renderIcon()}
        </div>
        <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[260px] group-hover:opacity-100 sm:flex">
          <span className="text-xs font-bold tracking-wide">{label}</span>
        </div>
        {/* En móvil mostrar texto compacto para usabilidad táctil */}
        <span className="sm:hidden text-xs font-bold ml-1.5">{label}</span>
      </button>
    );
  },
);

WappyExpandButton.displayName = 'WappyExpandButton';

export default WappyExpandButton;
