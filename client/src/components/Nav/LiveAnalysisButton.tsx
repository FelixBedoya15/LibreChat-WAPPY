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
              description="Cámara de Riesgo"
              side="right"
              render={
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLiveAnalysis}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-border-medium/50 bg-surface-primary hover:bg-surface-hover hover:border-teal-400 text-text-primary transition-all duration-300 shadow-sm mb-1 sm:hover:scale-105 sm:hover:-rotate-3"
                >
                  <Camera className="h-5 w-5" />
                </motion.button>
              }
            />
        );
    }

    return (
        <motion.button
            whileHover={{ scale: 1.02, rotate: -1, zIndex: 10 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLiveAnalysis}
            className="group flex w-full items-center gap-3 rounded-xl border border-border-medium/30 bg-white dark:bg-surface-primary p-3 text-sm text-text-secondary transition-all duration-300 shadow-sm hover:bg-surface-hover hover:border-teal-400 hover:text-teal-600"
        >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border-medium/50 bg-surface-secondary group-hover:border-teal-200 text-text-tertiary group-hover:text-teal-500 transition-colors">
                <Camera className="h-5 w-5" />
            </div>
            <span className="font-bold tracking-tight text-text-primary text-[13px]">Cámara de Riesgo</span>
        </motion.button>
    );
}
