import React from 'react';
import { Loader2 } from 'lucide-react';
import { AnimatedIcon } from '~/components/ui/AnimatedIcon';

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
            className={`group flex items-center px-3 py-2 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white rounded-full transition-all duration-300 shadow-md font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        >
            {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
            ) : (
                <AnimatedIcon name="sparkles" size={20} />
            )}
            <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 transition-all duration-300 whitespace-nowrap group-hover:ml-2">
                {text}
            </span>
        </button>
    );
};
