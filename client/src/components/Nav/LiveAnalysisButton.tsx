import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Camera } from 'lucide-react';
import { TooltipAnchor } from '@librechat/client';
import { cn } from '~/utils';

interface LiveAnalysisButtonProps {
    isSmallScreen?: boolean;
    isCollapsed?: boolean;
    toggleNav: () => void;
}

export default function LiveAnalysisButton({
    isSmallScreen,
    isCollapsed,
    toggleNav,
}: LiveAnalysisButtonProps) {
    const navigate = useNavigate();

    const handleLiveAnalysis = React.useCallback(() => {
        navigate('/live');
        if (isSmallScreen) {
            toggleNav();
        }
    }, [navigate, isSmallScreen, toggleNav]);

    if (isCollapsed) {
        return (
            <TooltipAnchor
              description="Análisis en Vivo"
              side="right"
              render={
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLiveAnalysis}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-border-medium/50 bg-surface-primary hover:bg-surface-hover hover:border-teal-400 text-text-primary transition-all duration-200 shadow-sm"
                >
                  <Camera className="h-5 w-5" />
                </motion.button>
              }
            />
        );
    }

    return (
        <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleLiveAnalysis}
            className="group flex w-full items-center gap-2.5 rounded-xl border border-border-medium/30 bg-white dark:bg-surface-primary px-3 py-2.5 text-sm text-text-secondary transition-all duration-200 shadow-sm hover:bg-surface-hover hover:border-teal-400 hover:text-teal-600"
        >
            <Camera className="h-4 w-4 shrink-0" />
            <span className="font-semibold text-text-primary text-[13px]">Análisis en Vivo</span>
        </motion.button>
    );
}
