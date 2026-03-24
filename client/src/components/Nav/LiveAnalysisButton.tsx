import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocalize } from '~/hooks';
import { motion } from 'framer-motion';
import { AnimatedIcon } from '~/components/ui/AnimatedIcon';
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
                "group relative flex items-center h-11 px-3 w-full gap-3 transition-all duration-300 shadow-sm shrink-0 cursor-pointer border outline-none rounded-xl sm:hover:scale-[1.02] sm:hover:-rotate-1",
                "bg-white dark:bg-gray-800 border-border-medium hover:bg-surface-hover text-text-primary",
                isCollapsed && "justify-center px-0"
            )}
        >
            <div className="relative flex-shrink-0 flex items-center justify-center">
                <AnimatedIcon name="camera" size={18} className="text-text-secondary group-hover:text-teal-500 transition-colors" />
            </div>
            {!isCollapsed && <span className="text-sm font-semibold leading-tight mt-0.5">Cámara de Riesgo</span>}
            {isCollapsed && (
                <div className="hidden sm:flex absolute left-full ml-3 items-center max-w-0 overflow-hidden opacity-0 group-hover:max-w-[170px] group-hover:opacity-100 transition-all duration-300 ease-in-out whitespace-nowrap bg-teal-600 text-white px-3 py-2 rounded-lg shadow-2xl pointer-events-none z-[110]">
                    <span className="text-xs font-semibold">Cámara de Riesgo</span>
                </div>
            )}
        </motion.button>
    );
}
