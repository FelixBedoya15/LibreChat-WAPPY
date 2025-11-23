import { Circle } from 'lucide-react';
import type { FC } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '~/components/ui';
import { useLocalize } from '~/hooks';

interface VoiceModeButtonProps {
    onClick: () => void;
    disabled?: boolean;
    className?: string;
}

const VoiceModeButton: FC<VoiceModeButtonProps> = ({ onClick, disabled = false, className = '' }) => {
    const localize = useLocalize();

    return (
        <TooltipProvider delayDuration={300}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        onClick={onClick}
                        disabled={disabled}
                        className={`group relative rounded-lg p-2.5 transition-all hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
                        aria-label={localize('com_nav_voice_mode')}
                        type="button"
                    >
                        {/* Waveform icon - similar to ChatGPT */}
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className="text-text-secondary group-hover:text-text-primary transition-colors"
                        >
                            <path
                                d="M12 3v18M9 6v12M6 9v6M15 6v12M18 9v6M3 12h18"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>

                        {/* Pulsing indicator when active */}
                        {!disabled && (
                            <span className="absolute -top-0.5 -right-0.5">
                                <Circle className="h-2 w-2 fill-green-500 text-green-500 animate-pulse" />
                            </span>
                        )}
                    </button>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={5}>
                    {localize('com_nav_voice_mode')}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};

export default VoiceModeButton;
