import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '~/utils';

export interface ExpandingButtonProps {
  id?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  label: string;
  icon: React.ComponentType<{ className?: string }> | React.ReactNode;
  variant?: 'teal' | 'orange' | 'secondary' | 'rose' | 'outline-teal';
  disabled?: boolean;
  isLoading?: boolean;
  title?: string;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

export const ExpandingButton: React.FC<ExpandingButtonProps> = ({
  id,
  onClick,
  label,
  icon: Icon,
  variant = 'teal',
  disabled = false,
  isLoading = false,
  title,
  type = 'button',
  className = '',
}) => {
  const variantClass = {
    teal: 'bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white border-teal-600/80 shadow-md shadow-teal-600/20',
    orange: 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white border-orange-500/80 shadow-md shadow-orange-500/20',
    secondary: 'bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-700 shadow-sm',
    'outline-teal': 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800/80 hover:bg-teal-100 dark:hover:bg-teal-900/40 shadow-sm',
    rose: 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white border-rose-600/80 shadow-md shadow-rose-600/20',
  }[variant];

  return (
    <button
      id={id}
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      title={title || label}
      aria-label={title || label}
      className={cn(
        'group flex h-8 min-w-[32px] sm:h-9 sm:min-w-[36px] shrink-0 cursor-pointer items-center justify-center rounded-xl border px-2 sm:px-2.5 shadow-sm outline-none transition-all duration-300 hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50',
        variantClass,
        className,
      )}
    >
      <div className="relative flex shrink-0 items-center justify-center">
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-current" />
        ) : React.isValidElement(Icon) ? (
          Icon
        ) : typeof Icon === 'function' ? (
          <Icon className="h-4 w-4" />
        ) : null}
      </div>

      <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[280px] group-hover:opacity-100 sm:flex">
        <span className="text-xs font-bold tracking-wide">{label}</span>
      </div>

      <span className="text-xs font-bold sm:hidden ml-1.5">{label}</span>
    </button>
  );
};

export default ExpandingButton;
