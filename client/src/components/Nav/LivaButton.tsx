import React, { useCallback } from 'react';
import { Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TooltipAnchor, Button } from '@librechat/client';
import { useLocalize } from '~/hooks';

interface LivaButtonProps {
    isSmallScreen?: boolean;
    toggleNav: () => void;
}

export default function LivaButton({
    isSmallScreen,
    toggleNav,
}: LivaButtonProps) {
    const navigate = useNavigate();
    const localize = useLocalize();

    const handleNavigate = useCallback(() => {
        navigate('/liva');
        if (isSmallScreen) {
            toggleNav();
        }
    }, [navigate, isSmallScreen, toggleNav]);

    return (
        <TooltipAnchor
            description="LIVA - Live Assessment"
            render={
                <Button
                    variant="outline"
                    data-testid="nav-liva-button"
                    aria-label="LIVA"
                    className="rounded-full border-none bg-transparent p-2 hover:bg-surface-hover md:rounded-xl"
                    onClick={handleNavigate}
                >
                    <Eye className="icon-lg text-text-primary" />
                </Button>
            }
        />
    );
}
