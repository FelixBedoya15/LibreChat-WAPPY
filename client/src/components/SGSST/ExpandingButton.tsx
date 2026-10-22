import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '~/utils';
import {
  WAPPY_SEMANTIC_BUTTON_STYLES,
  resolveSemanticVariant,
  ExpandableButtonVariant,
} from '~/components/Common/ExpandableButton';

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

const legacyMap: Record<string, ExpandableButtonVariant> = {
  teal: 'teal',
  orange: 'amber',
  ai: 'purple',
  secondary: 'neutral',
  'outline-teal': 'cyan',
  rose: 'danger',
  save: 'teal',
};

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
  const mappedDefault = legacyMap[variant] || 'neutral';
  const semanticKey = resolveSemanticVariant(`${label} ${title || ''}`, mappedDefault);
  const variantClass =
    (WAPPY_SEMANTIC_BUTTON_STYLES[semanticKey] || WAPPY_SEMANTIC_BUTTON_STYLES.neutral).idle;

  const sizeClass =
    size === 'sm'
      ? 'h-6.5 min-w-[26px] px-1.5 sm:h-7 sm:min-w-[28px] sm:px-2 text-[10px]'
      : 'h-7 min-w-[28px] px-2 sm:h-8 sm:px-2.5 sm:min-w-[32px] text-xs';

  const iconSizeClass = size === 'sm' ? 'h-3 w-3 sm:h-3.5 sm:w-3.5' : 'h-3.5 w-3.5 sm:h-4 sm:w-4';

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
        'group relative inline-flex shrink-0 cursor-pointer items-center justify-center rounded-xl border font-bold outline-none transition-all duration-300 ease-in-out sm:hover:-rotate-3 sm:hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 overflow-hidden',
        sizeClass,
        variantClass,
        className,
      )}
    >
      <div className="relative flex shrink-0 items-center justify-center [&>svg]:h-3.5 [&>svg]:w-3.5 sm:[&>svg]:h-4 sm:[&>svg]:w-4">
        {renderIcon()}
      </div>

      {alwaysShowLabel ? (
        <span className="ml-1.5 whitespace-nowrap">{label}</span>
      ) : (
        <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-1.5 group-hover:max-w-[300px] group-hover:opacity-100 sm:flex">
          <span className="tracking-wide">{label}</span>
        </div>
      )}
    </button>
  );
};

export default ExpandingButton;
