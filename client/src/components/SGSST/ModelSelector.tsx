import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Brain, ChevronDown, Check } from 'lucide-react';
import { cn } from '~/utils';

// Fallback model list (used only when query hasn't loaded yet)
export const AI_MODELS = [
  { id: 'gemini-3.5-flash-lite', name: 'Gemini 3.5 Flash Lite' },
  { id: 'gemini-3.6-flash', name: 'Gemini 3.6 Flash' },
  { id: 'gemini-3.5-flash', name: 'Gemini 3.5 Flash' },
  { id: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash Lite' },
  { id: 'gemini-2.5-flash-native-audio-preview-12-2025', name: 'Gemini 2.5 Audio (Dic)' },
  { id: 'gemini-2.5-flash-native-audio-preview-09-2025', name: 'Gemini 2.5 Audio (Sep)' },
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
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const availableModels = AI_MODELS;
  const currentModelName =
    availableModels.find((m) => m.id === selectedModel)?.name || selectedModel;

  const calcPos = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    }
  };

  const openDropdown = () => {
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
      style={{ position: 'fixed', top: dropdownPos.top, right: dropdownPos.right, zIndex: 9999999 }}
      className="w-64 overflow-hidden rounded-xl border border-border-medium bg-surface-primary shadow-xl duration-200 animate-in fade-in slide-in-from-top-2"
    >
      <div className="bg-surface-tertiary/30 border-b border-border-light p-2">
        {/* eslint-disable-next-line i18next/no-literal-string */}
        <span className="px-2 text-xs font-semibold uppercase tracking-wider text-text-secondary">
          Modelo de Inteligencia Artificial
        </span>
      </div>
      <div className="max-h-60 overflow-y-auto p-1">
        {availableModels.map((model) => (
          <button
            key={model.id}
            onClick={() => {
              onSelectModel(model.id);
              setIsOpen(false);
            }}
            className={cn(
              'flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition-colors',
              selectedModel === model.id
                ? 'bg-teal-50 font-medium text-teal-700 dark:bg-teal-900/20 dark:text-teal-300'
                : 'text-text-primary hover:bg-surface-hover',
            )}
          >
            <span>{model.name}</span>
            {selectedModel === model.id && (
              <Check className="h-4 w-4 text-teal-600 dark:text-teal-400" />
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
          'group flex h-8 min-w-[32px] flex-shrink-0 shrink-0 cursor-pointer items-center justify-center rounded-xl border px-2 shadow-sm outline-none transition-all duration-300 hover:-rotate-3 hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 sm:h-10 sm:min-w-[40px] sm:px-2.5',
          isOpen
            ? 'border-teal-500/50 bg-surface-hover text-text-primary ring-2 ring-teal-500/20'
            : 'border-border-medium bg-surface-primary text-text-primary hover:bg-surface-hover',
        )}
      >
        <div className="relative flex flex-shrink-0 items-center justify-center">
          <Brain className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
        <div className="flex max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[200px] group-hover:opacity-100">
          <span className="mr-1 text-sm font-bold tracking-wide">
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
