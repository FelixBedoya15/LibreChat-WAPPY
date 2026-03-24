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
              description="Gestor SG-SST"
              side="right"
              render={
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleClick}
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-xl border transition-all duration-300 shadow-sm mb-1 sm:hover:scale-105 sm:hover:-rotate-3",
                    isActive
                      ? "bg-teal-100/50 border-teal-400 text-teal-600 shadow-inner"
                      : "bg-surface-primary border-border-medium/50 hover:bg-surface-hover hover:border-teal-400 text-text-primary"
                  )}
                >
                  <ShieldCheck className="h-5 w-5" />
                </motion.button>
              }
            />
        );
    }

    return (
        <motion.button
            whileHover={{ scale: 1.02, rotate: -1, zIndex: 10 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleClick}
            className={cn(
                "group flex w-full items-center gap-3 rounded-xl border p-3 text-sm transition-all duration-300 shadow-sm",
                isActive
                    ? "bg-teal-50/50 border-teal-400/50 text-teal-700 shadow-inner"
                    : "bg-white dark:bg-surface-primary border-border-medium/30 hover:bg-surface-hover hover:border-teal-400 text-text-secondary hover:text-teal-600"
            )}
        >
            <div className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors",
                isActive
                    ? "bg-white border-teal-200 text-teal-600 shadow-sm"
                    : "bg-surface-secondary border-border-medium/50 group-hover:border-teal-200 text-text-tertiary group-hover:text-teal-500"
            )}>
                <ShieldCheck className="h-5 w-5" />
            </div>
            <span className="font-bold tracking-tight text-text-primary text-[13px]">Gestor SG-SST</span>
        </motion.button>
    );
}
