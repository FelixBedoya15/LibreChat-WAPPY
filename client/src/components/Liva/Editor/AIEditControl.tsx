import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Check, Loader2 } from 'lucide-react';
import { cn } from '~/utils';

interface AIEditControlProps {
    onAIEdit: (prompt: string) => Promise<void>;
    isGenerating?: boolean;
}

const AIEditControl = ({ onAIEdit, isGenerating = false }: AIEditControlProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [prompt, setPrompt] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    // Close on click outside
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim()) return;

        await onAIEdit(prompt);
        setPrompt('');
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={containerRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors",
                    isOpen
                        ? "bg-purple-200 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                        : "bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:hover:bg-purple-900/50"
                )}
            >
                {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                AI Edit
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 z-50 rounded-lg border border-gray-200 bg-white p-3 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">AI Assistant</span>
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>

                        <input
                            ref={inputRef}
                            type="text"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="e.g., Fix grammar, Make it shorter..."
                            className="w-full rounded border border-gray-300 bg-transparent px-2 py-1.5 text-sm focus:border-purple-500 focus:outline-none dark:border-gray-600 dark:text-white"
                        />

                        <div className="flex justify-end gap-2">
                            <button
                                type="submit"
                                disabled={!prompt.trim() || isGenerating}
                                className="flex items-center gap-1 rounded bg-purple-600 px-3 py-1 text-xs font-medium text-white hover:bg-purple-700 disabled:opacity-50"
                            >
                                <Sparkles className="w-3 h-3" />
                                Generate
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default AIEditControl;
