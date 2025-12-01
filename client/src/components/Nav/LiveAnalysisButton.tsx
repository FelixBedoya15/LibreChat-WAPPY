import React, { useCallback } from 'react';
import { Camera } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TooltipAnchor, Button } from '@librechat/client';
import { useLocalize } from '~/hooks';

interface LiveAnalysisButtonProps {
    isSmallScreen?: boolean;
    toggleNav: () => void;
}

export default function LiveAnalysisButton({
    isSmallScreen,
    toggleNav,
}: LiveAnalysisButtonProps) {
    const navigate = useNavigate();
    const localize = useLocalize();

    const handleLiveAnalysis = useCallback(() => {
        navigate('/live');
        if (isSmallScreen) {
            toggleNav();
        }
    }, [navigate, isSmallScreen, toggleNav]);

    return (
        <TooltipAnchor
            description="Live Analysis"
            render={
                <Button
                    variant="outline"
                    data-testid="nav-live-analysis-button"
                    aria-label="Live Analysis"
                    className="rounded-full border-none bg-transparent p-2 hover:bg-surface-hover md:rounded-xl"
                    onClick={handleLiveAnalysis}
                >
                    <Camera className="icon-lg text-text-primary" />
                </Button>
            }
        />
    );
}
