import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '~/utils';

export interface ExpandingButtonProps {
  id?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  label: string;
  icon?: React.ComponentType<{ className?: string }> | React.ReactNode;
  variant?: 'teal' | 'orange' | 'secondary' | 'rose' | 'outline-teal' | 'save' | 'ai';
  disabled?: boolean;
  isLoading?: boolean;
  title?: string;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  size?: 'sm' | 'md';
  alwaysShowLabel?: boolean;
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
  size = 'md',
  alwaysShowLabel = false,
}) => {
  const variantClass = {
    teal: 'bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white border-teal-600/80 shadow-md shadow-teal-600/20',
    orange: 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white border-orange-500/80 shadow-md shadow-orange-500/20',
    ai: 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white border-orange-500/80 shadow-md shadow-orange-500/20',
    secondary: 'bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-700 shadow-sm',
    'outline-teal': 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800/80 hover:bg-teal-100 dark:hover:bg-teal-900/40 shadow-sm',
    rose: 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white border-rose-600/80 shadow-md shadow-rose-600/20',
    save: 'bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white border-teal-600/80 shadow-md shadow-teal-600/20',
  }[variant] || 'bg-teal-600 text-white';

  const sizeClass = size === 'sm'
    ? 'h-7 min-w-[28px] px-2 text-[11px]'
    : 'h-9 min-w-[36px] px-2.5 text-xs';

  const iconSizeClass = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';

  const renderIcon = () => {
    if (isLoading) {
      return <Loader2 className={cn(iconSizeClass, 'animate-spin text-current shrink-0')} />;
    }
    if (!Icon) return null;
    if (React.isValidElement(Icon)) {
      return Icon;
    }
    const Component = Icon as React.ElementType;
    return <Component className={cn(iconSizeClass, 'shrink-0')} />;
  };

  return (
    <button
      id={id}
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      title={title || label}
      aria-label={title || label}
      className={cn(
        'group relative inline-flex shrink-0 cursor-pointer items-center justify-center rounded-xl border font-bold shadow-sm outline-none transition-all duration-300 hover:scale-[1.03] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 overflow-hidden',
        sizeClass,
        variantClass,
        className,
      )}
    >
      <div className="relative flex shrink-0 items-center justify-center">
        {renderIcon()}
      </div>

      {alwaysShowLabel ? (
        <span className="ml-2 whitespace-nowrap">{label}</span>
      ) : (
        <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[320px] group-hover:opacity-100 sm:flex">
          <span className="tracking-wide">{label}</span>
        </div>
      )}
    </button>
  );
};

export default ExpandingButton;
