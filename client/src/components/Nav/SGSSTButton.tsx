import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';
import { TooltipAnchor } from '@librechat/client';
import { cn } from '~/utils';

export default function SGSSTButton({
    toggleNav,
    isSmallScreen,
    isCollapsed,
}: {
    toggleNav: () => void;
    isSmallScreen?: boolean;
    isCollapsed?: boolean;
}) {
    const navigate = useNavigate();
    const location = useLocation();
    const isActive = location.pathname.startsWith('/sgsst');

    const handleClick = () => {
        navigate('/sgsst');
        if (isSmallScreen) {
            toggleNav();
        }
    };

    if (isCollapsed) {
        return (
            <TooltipAnchor
              description="Somos SST"
              side="right"
              render={
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleClick}
                  className={cn(
                    "w-9 h-9 flex items-center justify-center rounded-xl border transition-all duration-200 shadow-2xs mb-1 active:scale-95 cursor-pointer",
                    isActive
                      ? "bg-teal-50 dark:bg-teal-950/50 border-teal-500 text-teal-600 dark:text-teal-300 font-bold shadow-xs"
                      : "border-slate-200/80 dark:border-zinc-700/80 bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-700 hover:border-teal-400"
                  )}
                >
                  <ShieldCheck className="h-4.5 w-4.5" />
                </motion.button>
              }
            />
        );
    }

    return (
        <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleClick}
            className={cn(
                "group flex h-10 w-full items-center gap-2.5 rounded-xl border px-3 text-xs transition-all duration-200 shadow-2xs cursor-pointer active:scale-98",
                isActive
                    ? "bg-teal-50/90 dark:bg-teal-950/60 border-teal-500/40 text-teal-800 dark:text-teal-200 font-bold shadow-xs"
                    : "bg-white/80 dark:bg-zinc-900/60 border-slate-200/80 dark:border-zinc-800/80 hover:bg-slate-50 dark:hover:bg-zinc-800 hover:border-teal-400 text-slate-700 dark:text-zinc-300 hover:text-teal-600"
            )}
        >
            <ShieldCheck className={cn("h-4 w-4 shrink-0 transition-colors", isActive ? "text-teal-600 dark:text-teal-400" : "text-slate-500 dark:text-zinc-400 group-hover:text-teal-500")} />
            <span className={cn("font-bold text-xs", isActive ? "text-teal-800 dark:text-teal-200" : "text-slate-800 dark:text-zinc-200")}>Somos SST</span>
        </motion.button>
    );
}
