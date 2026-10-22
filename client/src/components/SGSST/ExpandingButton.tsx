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
    teal: 'bg-white dark:bg-gray-900 border-border-medium/40 text-teal-600 dark:text-teal-400 hover:bg-teal-50/50 dark:hover:bg-teal-950/20 shadow-sm',
    orange: 'bg-white dark:bg-gray-900 border-border-medium/40 text-amber-600 dark:text-amber-400 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 shadow-sm',
    ai: 'bg-white dark:bg-gray-900 border-border-medium/40 text-teal-600 dark:text-teal-400 hover:bg-teal-50/50 dark:hover:bg-teal-950/20 shadow-sm',
    secondary: 'bg-white dark:bg-gray-900 border-border-medium/40 text-text-secondary hover:text-text-primary hover:bg-surface-hover shadow-sm',
    'outline-teal': 'bg-teal-500/10 text-teal-600 border-teal-500/20 hover:bg-teal-500/20 dark:bg-teal-950/20 dark:text-teal-400 shadow-sm',
    rose: 'bg-white dark:bg-gray-900 border-border-medium/40 text-rose-600 dark:text-rose-400 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 shadow-sm',
    save: 'bg-white dark:bg-gray-900 border-border-medium/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 shadow-sm',
  }[variant] || 'bg-white dark:bg-gray-900 border-border-medium/40 text-teal-600 dark:text-teal-400 hover:bg-teal-50/50 shadow-sm';

  const sizeClass = size === 'sm'
    ? 'h-8 min-w-[32px] px-2.5 text-[11px]'
    : 'h-9 min-w-[36px] px-3.5 sm:h-10 sm:px-3 sm:min-w-[40px] text-xs sm:text-sm';

  const iconSizeClass = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4 sm:h-4.5 sm:w-4.5';

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
        'group relative inline-flex shrink-0 cursor-pointer items-center justify-center rounded-xl border font-bold shadow-sm outline-none transition-all duration-300 ease-in-out active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 overflow-hidden',
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
