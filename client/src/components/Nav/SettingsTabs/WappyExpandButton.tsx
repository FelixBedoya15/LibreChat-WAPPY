import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '~/utils';
import {
  WAPPY_SEMANTIC_BUTTON_STYLES,
  resolveSemanticVariant,
  ExpandableButtonVariant,
} from '~/components/Common/ExpandableButton';

export interface WappyExpandButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ComponentType<{ className?: string }> | React.ReactNode;
  label: string;
  variant?: 'teal' | 'red' | 'orange' | 'emerald' | 'blue' | 'neutral' | 'gradient-orange' | 'gradient-teal';
  isLoading?: boolean;
}

const legacyMap: Record<string, ExpandableButtonVariant> = {
  teal: 'teal',
  red: 'danger',
  orange: 'amber',
  emerald: 'emerald',
  blue: 'blue',
  neutral: 'neutral',
  'gradient-orange': 'purple',
  'gradient-teal': 'teal',
};

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
    const mappedDefault = legacyMap[variant] || 'neutral';
    const semanticKey = resolveSemanticVariant(`${label} ${props.title || ''}`, mappedDefault);
    const variantClass =
      (WAPPY_SEMANTIC_BUTTON_STYLES[semanticKey] || WAPPY_SEMANTIC_BUTTON_STYLES.neutral).idle;

    const renderIcon = () => {
      if (isLoading) {
        return <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin shrink-0" />;
      }
      if (!icon) {
        return null;
      }
      if (React.isValidElement(icon)) {
        return icon;
      }
      if (typeof icon === 'function' || (typeof icon === 'object' && icon !== null && '$$typeof' in icon)) {
        const IconComponent = icon as React.ComponentType<{ className?: string }>;
        return <IconComponent className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />;
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
          'group flex h-7 min-w-[28px] sm:h-8 sm:min-w-[32px] items-center justify-center rounded-xl border px-2 sm:px-2.5 transition-all duration-300 ease-in-out sm:hover:-rotate-3 sm:hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0',
          variantClass,
          className,
        )}
        {...props}
      >
        <div className="relative flex shrink-0 items-center justify-center [&>svg]:h-3.5 [&>svg]:w-3.5 sm:[&>svg]:h-4 sm:[&>svg]:w-4">
          {renderIcon()}
        </div>
        <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-1.5 group-hover:max-w-[260px] group-hover:opacity-100 sm:flex">
          <span className="text-xs font-bold tracking-wide">{label}</span>
        </div>
        <span className="sm:hidden text-[11px] font-bold ml-1.5">{label}</span>
      </button>
    );
  },
);

WappyExpandButton.displayName = 'WappyExpandButton';

export default WappyExpandButton;
