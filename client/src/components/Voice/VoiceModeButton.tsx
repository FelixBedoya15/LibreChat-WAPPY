import type { FC } from 'react';
import { TooltipAnchor } from '@librechat/client';
import { useLocalize } from '~/hooks';

interface VoiceModeButtonProps {
    onClick: () => void;
    disabled?: boolean;
    isActive?: boolean;
    className?: string;
}

const VoiceModeButton: FC<VoiceModeButtonProps> = ({ onClick, disabled = false, isActive = false, className = '' }) => {
    const localize = useLocalize();

    return (
        <TooltipAnchor
            description={localize('com_nav_voice_mode')}
            aria-label={localize('com_nav_voice_mode')}
        >
            <button
                onClick={onClick}
                disabled={disabled}
                className={`group relative rounded-lg p-2.5 transition-all hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
                aria-label={localize('com_nav_voice_mode')}
                type="button"
            >
                {/* Waveform icon - changes color when active */}
                <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className={`transition-colors ${isActive
                        ? 'text-green-500'
                        : 'text-text-secondary group-hover:text-text-primary'
                        }`}
                >
                    <path
                        d="M12 3v18M9 6v12M6 9v6M15 6v12M18 9v6M3 12h18"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </button>
        </TooltipAnchor>
    );
};

export default VoiceModeButton;
