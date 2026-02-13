import React, { useState, useRef, useEffect } from 'react';
import { Brain, ChevronDown, Check } from 'lucide-react';
import { cn } from '~/utils';

export const AI_MODELS = [
    { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash Preview' },
    { id: 'gemini-2.5-flash-preview-09-2025', name: 'Gemini 2.5 Flash Preview' },
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
    { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite' },
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
];

interface ModelSelectorProps {
    selectedModel: string;
    onSelectModel: (modelId: string) => void;
    disabled?: boolean;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ selectedModel, onSelectModel, disabled }) => {
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
                    "group flex items-center gap-2 px-3 py-2 bg-surface-primary border border-border-medium hover:bg-surface-hover text-text-primary rounded-full transition-all duration-300 shadow-sm font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed",
                    isOpen && "bg-surface-hover ring-2 ring-blue-500/20 border-blue-500/50"
                )}
                title="Seleccionar Modelo de IA"
            >
                <Brain className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <span className="hidden sm:inline-block max-w-[100px] truncate">
                    {currentModelName.replace('Gemini ', '')}
                </span>
                <ChevronDown className={cn("h-4 w-4 text-text-secondary transition-transform duration-200", isOpen && "rotate-180")} />
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
                                        ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium"
                                        : "text-text-primary hover:bg-surface-hover"
                                )}
                            >
                                <span>{model.name}</span>
                                {selectedModel === model.id && (
                                    <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />
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
