import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocalize } from '~/hooks';
import { motion } from 'framer-motion';
import { AnimatedIcon } from '~/components/ui/AnimatedIcon';
import { cn } from '~/utils';

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

    const handleLiveAnalysis = React.useCallback(() => {
        navigate('/live');
        if (isSmallScreen) {
            toggleNav();
        }
    }, [navigate, isSmallScreen, toggleNav]);

    return (
        <motion.button
            whileTap="tap"
            onClick={handleLiveAnalysis}
            className={cn(
                "group relative flex items-center h-10 px-3 min-w-[40px] transition-all duration-300 shadow-sm shrink-0 cursor-pointer border outline-none rounded-xl w-full gap-3",
                "bg-surface-secondary border-border-medium hover:bg-surface-hover hover:border-teal-400 text-text-primary"
            )}
        >
            <div className="relative flex-shrink-0 flex items-center justify-center">
                <AnimatedIcon name="camera" size={20} className="text-text-secondary group-hover:text-teal-500 transition-colors" />
            </div>
            <span className="text-sm font-medium leading-tight">Cámara de Riesgo</span>
        </motion.button>
    );
}
