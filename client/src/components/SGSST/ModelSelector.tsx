import React, { useState, useRef, useEffect } from 'react';
import { Brain, ChevronDown, Check } from 'lucide-react';
import { cn } from '~/utils';

export const AI_MODELS = [
    { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash Preview' },
    { id: 'gemini-3.1-flash-lite-preview', name: 'Gemini 3.1 Flash Lite Preview' },
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
    { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite' }
];

interface ModelSelectorProps {
    selectedModel: string;
    onSelectModel: (modelId: string) => void;
    disabled?: boolean;
    hideTooltip?: boolean;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ selectedModel, onSelectModel, disabled, hideTooltip }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const currentModelName = AI_MODELS.find(m => m.id === selectedModel)?.name || selectedModel;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className="relative" ref={containerRef}>
            <button
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={cn(
                    "group flex flex-shrink-0 items-center justify-center h-10 px-2.5 min-w-[40px] transition-all duration-300 shadow-sm shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border outline-none rounded-xl",
                    isOpen ? "bg-surface-hover ring-2 ring-teal-500/20 border-teal-500/50 text-text-primary" : "bg-surface-primary border-border-medium hover:bg-surface-hover text-text-primary"
                )}
            >
                <div className="relative flex-shrink-0 flex items-center justify-center">
                    <Brain className="h-5 w-5" />
                </div>
                <div className="flex items-center max-w-0 overflow-hidden opacity-0 group-hover:max-w-[200px] group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 ease-in-out whitespace-nowrap">
                    <span className="text-sm font-bold tracking-wide mr-1">
                        {currentModelName.replace('Gemini ', '')}
                    </span>
                    <ChevronDown className={cn("h-4 w-4 text-text-secondary transition-transform duration-200", isOpen && "rotate-180")} />
                </div>
            </button>

            {isOpen && (
                <div className="absolute top-full mt-2 right-0 w-64 bg-surface-primary border border-border-medium rounded-xl shadow-lg z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-2 border-b border-border-light bg-surface-tertiary/30">
                        <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider px-2">
                            Modelo de Inteligencia Artificial
                        </span>
                    </div>
                    <div className="p-1 max-h-60 overflow-y-auto">
                        {AI_MODELS.map((model) => (
                            <button
                                key={model.id}
                                onClick={() => {
                                    onSelectModel(model.id);
                                    setIsOpen(false);
                                }}
                                className={cn(
                                    "w-full flex items-center justify-between px-3 py-2.5 text-sm rounded-lg transition-colors text-left",
                                    selectedModel === model.id
                                        ? "bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 font-medium"
                                        : "text-text-primary hover:bg-surface-hover"
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
            )}
        </div>
    );
};

export default ModelSelector;
