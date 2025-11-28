import React, { useCallback } from 'react';
import { Camera } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TooltipAnchor, Button } from '@librechat/client';
import { useLocalize } from '~/hooks';

interface LiveButtonProps {
    isSmallScreen?: boolean;
    toggleNav: () => void;
}

export default function LiveButton({
    isSmallScreen,
    toggleNav,
}: LiveButtonProps) {
    const navigate = useNavigate();
    const localize = useLocalize();

    const handleNavigate = useCallback(() => {
        navigate('/live');
        if (isSmallScreen) {
            toggleNav();
        }
    }, [navigate, isSmallScreen, toggleNav]);

    return (
        <TooltipAnchor
            description="LIVE - Video Assessment"
            render={
                <Button
                    variant="outline"
                    data-testid="nav-live-button"
                    aria-label="LIVE"
                    className="rounded-full border-none bg-transparent p-2 hover:bg-surface-hover md:rounded-xl"
                    onClick={handleNavigate}
                >
                    <Camera className="icon-lg text-text-primary" />
                </Button>
            }
        />
    );
}
