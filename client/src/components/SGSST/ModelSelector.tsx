import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Brain, ChevronDown, Check } from 'lucide-react';
import { cn } from '~/utils';

// Fallback model list (used only when query hasn't loaded yet)
export const AI_MODELS = [
    { id: 'gemini-3.5-flash', name: 'Gemini 3.5 Flash' },
    { id: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash Lite' },
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
    { id: 'gemini-2.5-flash-native-audio-preview-12-2025', name: 'Gemini 2.5 Audio (Dic)' },
    { id: 'gemini-2.5-flash-native-audio-preview-09-2025', name: 'Gemini 2.5 Audio (Sep)' },
];

interface ModelSelectorProps {
    selectedModel: string;
    onSelectModel: (modelId: string) => void;
    disabled?: boolean;
    hideTooltip?: boolean;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ selectedModel, onSelectModel, disabled }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 });
    const buttonRef = useRef<HTMLButtonElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const availableModels = AI_MODELS;
    const currentModelName = availableModels.find(m => m.id === selectedModel)?.name || selectedModel;

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
        setIsOpen(o => !o);
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
            className="w-64 rounded-xl border border-border-medium bg-surface-primary shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
        >
            <div className="p-2 border-b border-border-light bg-surface-tertiary/30">
                <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider px-2">
                    Modelo de Inteligencia Artificial
                </span>
            </div>
            <div className="p-1 max-h-60 overflow-y-auto">
                {availableModels.map((model) => (
                    <button
                        key={model.id}
                        onClick={() => { onSelectModel(model.id); setIsOpen(false); }}
                        className={cn(
                            'w-full flex items-center justify-between px-3 py-2.5 text-sm rounded-xl transition-colors text-left',
                            selectedModel === model.id
                                ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 font-medium'
                                : 'text-text-primary hover:bg-surface-hover'
                        )}
                    >
                        <span>{model.name}</span>
                        {selectedModel === model.id && <Check className="h-4 w-4 text-teal-600 dark:text-teal-400" />}
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
                    'group flex flex-shrink-0 items-center justify-center h-10 px-2.5 min-w-[40px] transition-all duration-300 shadow-sm shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border outline-none rounded-xl hover:-rotate-3 hover:scale-105',
                    isOpen
                        ? 'bg-surface-hover ring-2 ring-teal-500/20 border-teal-500/50 text-text-primary'
                        : 'bg-surface-primary border-border-medium hover:bg-surface-hover text-text-primary'
                )}
            >
                <div className="relative flex-shrink-0 flex items-center justify-center">
                    <Brain className="h-5 w-5" />
                </div>
                <div className="flex items-center max-w-0 overflow-hidden opacity-0 group-hover:max-w-[200px] group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 ease-in-out whitespace-nowrap">
                    <span className="text-sm font-bold tracking-wide mr-1">
                        {currentModelName.replace('Gemini ', '')}
                    </span>
                    <ChevronDown className={cn('h-4 w-4 text-text-secondary transition-transform duration-200', isOpen && 'rotate-180')} />
                </div>
            </button>

            {ReactDOM.createPortal(dropdown, document.body)}
        </>
    );
};

export default ModelSelector;
