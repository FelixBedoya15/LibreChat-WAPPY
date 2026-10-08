import React, { useState, useRef, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { Brain, ChevronDown, Check } from 'lucide-react';
import { cn } from '~/utils';
import { useGetEndpointsQuery } from '~/data-provider';
import { EModelEndpoint } from 'librechat-data-provider';

// Modern official Gemini Flash model lineup
export const AI_MODELS = [
  { id: 'gemini-3.6-flash', name: 'Gemini 3.6 Flash (Recomendado)' },
  { id: 'gemini-3.5-flash', name: 'Gemini 3.5 Flash' },
  { id: 'gemini-3.5-flash-lite', name: 'Gemini 3.5 Flash Lite' },
];

interface ModelSelectorProps {
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
  disabled?: boolean;
  hideTooltip?: boolean;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedModel,
  onSelectModel,
  disabled,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState<{
    top?: number;
    bottom?: number;
    right?: number;
    isUp?: boolean;
    maxHeight?: number;
  }>({ top: 0, right: 0, isUp: false });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { data: endpointsConfig } = useGetEndpointsQuery();

  const availableModels = useMemo(() => {
    const googleModels = endpointsConfig?.[EModelEndpoint.google]?.models;
    if (Array.isArray(googleModels) && googleModels.length > 0) {
      const filtered = googleModels
        .map((m: any) => {
          const id = typeof m === 'string' ? m : m?.id || m?.value || '';
          return id.replace('models/', '').trim();
        })
        .filter((id: string) => id && !id.includes('live') && !id.includes('native-audio') && !id.includes('preview') && !id.includes('3.1') && !id.includes('3.7') && !id.includes('3.8'));

      if (filtered.length > 0) {
        const formatName = (id: string) => {
          if (id === 'gemini-3.6-flash') return 'Gemini 3.6 Flash';
          if (id === 'gemini-3.5-flash') return 'Gemini 3.5 Flash';
          if (id === 'gemini-3.5-flash-lite') return 'Gemini 3.5 Flash Lite';
          return id.split('-').map((s: string) => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
        };
        const unique = Array.from(new Set(filtered));
        return unique.map((id: string) => ({ id, name: formatName(id) }));
      }
    }
    return AI_MODELS;
  }, [endpointsConfig]);

  const currentModelName =
    availableModels.find((m) => m.id === selectedModel)?.name ||
    (selectedModel === 'gemini-3.6-flash' ? 'Gemini 3.6 Flash' :
     selectedModel === 'gemini-3.5-flash' ? 'Gemini 3.5 Flash' :
     selectedModel === 'gemini-3.5-flash-lite' ? 'Gemini 3.5 Flash Lite' :
     availableModels[0]?.name || selectedModel);

  // Auto-normalize if selectedModel is obsolete or not in available models
  useEffect(() => {
    if (availableModels.length > 0 && selectedModel) {
      const isPresent = availableModels.some((m) => m.id === selectedModel);
      if (!isPresent && (selectedModel.includes('3.8') || selectedModel.includes('3.7') || selectedModel.includes('3.1') || selectedModel.includes('2.5') || selectedModel.includes('2.0') || selectedModel.includes('1.5'))) {
        onSelectModel(availableModels[0].id);
      }
    }
  }, [availableModels, selectedModel, onSelectModel]);

  const calcPos = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const estimatedHeight = 260; // 5 models + header
      const openUpwards = spaceBelow < estimatedHeight && spaceAbove > spaceBelow;

      // Ensure right offset doesn't push the 256px wide menu off the left of the screen
      const rightOffset = Math.max(8, Math.min(window.innerWidth - rect.right, window.innerWidth - 270));

      if (openUpwards) {
        setDropdownPos({
          top: undefined,
          bottom: Math.max(8, window.innerHeight - rect.top + 8),
          right: rightOffset,
          isUp: true,
          maxHeight: Math.max(160, Math.min(spaceAbove - 20, 320)),
        });
      } else {
        setDropdownPos({
          top: rect.bottom + 8,
          bottom: undefined,
          right: rightOffset,
          isUp: false,
          maxHeight: Math.max(160, Math.min(spaceBelow - 20, 320)),
        });
      }
    }
  };

  const openDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    calcPos();
    setIsOpen((o) => !o);
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const inButton = buttonRef.current?.contains(target);
      const inDropdown = dropdownRef.current?.contains(target);
      if (!inButton && !inDropdown) setIsOpen(false);
    };
    const handleScroll = () => calcPos();
    const handleResize = () => calcPos();

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen]);

  const dropdown = isOpen ? (
    <div
      ref={dropdownRef}
      style={{
        position: 'fixed',
        ...(dropdownPos.isUp
          ? { bottom: `${dropdownPos.bottom}px` }
          : { top: `${dropdownPos.top}px` }),
        right: `${dropdownPos.right}px`,
        maxHeight: dropdownPos.maxHeight ? `${dropdownPos.maxHeight}px` : undefined,
        zIndex: 9999999,
      }}
      className={cn(
        'w-64 overflow-hidden rounded-xl border border-border-medium bg-surface-primary shadow-2xl duration-200 animate-in fade-in flex flex-col',
        dropdownPos.isUp ? 'slide-in-from-bottom-2' : 'slide-in-from-top-2',
      )}
    >
      <div className="bg-surface-tertiary/40 border-b border-border-light p-2.5 shrink-0">
        {/* eslint-disable-next-line i18next/no-literal-string */}
        <span className="px-1 text-[11px] font-bold uppercase tracking-wider text-text-secondary">
          Modelo de Inteligencia Artificial
        </span>
      </div>
      <div
        className="overflow-y-auto p-1.5 flex-1 divide-y divide-border-light/20"
        style={{
          maxHeight: dropdownPos.maxHeight ? `${dropdownPos.maxHeight - 44}px` : '240px',
        }}
      >
        {availableModels.map((model) => (
          <button
            key={model.id}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelectModel(model.id);
              setIsOpen(false);
            }}
            className={cn(
              'flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs transition-colors cursor-pointer',
              selectedModel === model.id
                ? 'bg-teal-50 font-bold text-teal-700 dark:bg-teal-900/30 dark:text-teal-300'
                : 'text-text-primary hover:bg-surface-hover font-medium',
            )}
          >
            <span className="truncate pr-2">{model.name}</span>
            {selectedModel === model.id && (
              <Check className="h-3.5 w-3.5 shrink-0 text-teal-600 dark:text-teal-400" />
            )}
          </button>
        ))}
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        ref={buttonRef}
        onClick={openDropdown}
        disabled={disabled}
        className={cn(
          'group flex h-8 min-w-[32px] flex-shrink-0 shrink-0 cursor-pointer items-center justify-center rounded-xl border px-2 shadow-sm outline-none transition-all duration-300 hover:-rotate-3 hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 sm:h-9 sm:min-w-[36px] sm:px-2.5',
          isOpen
            ? 'border-teal-500/50 bg-surface-hover text-text-primary ring-2 ring-teal-500/20'
            : 'border-border-medium bg-surface-primary text-text-primary hover:bg-surface-hover',
        )}
      >
        <div className="relative flex flex-shrink-0 items-center justify-center">
          <Brain className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
        <div
          className={cn(
            'flex max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[200px] group-hover:opacity-100',
            isOpen && 'ml-2 max-w-[200px] opacity-100',
          )}
        >
          <span className="mr-1 text-xs font-bold tracking-wide">
            {currentModelName.replace('Gemini ', '')}
          </span>
          <ChevronDown
            className={cn(
              'h-4 w-4 text-text-secondary transition-transform duration-200',
              isOpen && 'rotate-180',
            )}
          />
        </div>
      </button>

      {ReactDOM.createPortal(dropdown, document.body)}
    </>
  );
};

export default ModelSelector;
