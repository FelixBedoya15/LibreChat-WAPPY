import React from 'react';
import { Loader2, Bot } from 'lucide-react';

interface DummyGenerateButtonProps {
    onClick: () => void;
    isLoading?: boolean;
    disabled?: boolean;
    text?: string;
    className?: string;
}

export const DummyGenerateButton: React.FC<DummyGenerateButtonProps> = ({
    onClick,
    isLoading = false,
    disabled = false,
    text = "IA Dummy",
    className = ""
}) => {
    return (
        <button
            onClick={onClick}
            disabled={disabled || isLoading}
            className={`group flex items-center px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-full transition-all duration-300 shadow-md font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        >
            {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
                <Bot className="h-5 w-5" />
            )}
            <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 transition-all duration-300 whitespace-nowrap group-hover:ml-2">
                {text}
            </span>
        </button>
    );
};
