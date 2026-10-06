import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBag } from 'lucide-react';
import { TooltipAnchor } from '@librechat/client';
import { cn } from '~/utils';

interface Props {
  isSmallScreen?: boolean;
  isCollapsed?: boolean;
  toggleNav?: () => void;
}

const MarketplaceNavButton = ({
  isSmallScreen = false,
  isCollapsed = false,
  toggleNav,
}: Props) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = location.pathname.startsWith('/marketplace');

  const [hasVisited, setHasVisited] = React.useState<boolean>(() => {
    try {
      return localStorage.getItem('wappy_marketplace_visited') === 'true';
    } catch {
      return false;
    }
  });

  const handleClick = () => {
    try {
      localStorage.setItem('wappy_marketplace_visited', 'true');
      setHasVisited(true);
    } catch {
      // ignore
    }
    navigate('/marketplace');
    if (isSmallScreen && toggleNav) {
      toggleNav();
    }
  };

  if (isCollapsed) {
    return (
      <TooltipAnchor
        description="Tienda WAPPY"
        side="right"
        render={
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleClick}
            className={cn(
              'w-9 h-9 flex items-center justify-center rounded-xl border transition-all duration-200 shadow-2xs mb-1 active:scale-95 cursor-pointer relative',
              isActive
                ? 'bg-teal-50 dark:bg-teal-950/50 border-teal-500 text-teal-600 dark:text-teal-300 font-bold shadow-xs'
                : 'border-slate-200/80 dark:border-zinc-700/80 bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-700 hover:border-teal-400'
            )}
          >
            <ShoppingBag className="h-4.5 w-4.5" />
            {!hasVisited && (
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-teal-500"></span>
              </span>
            )}
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
        'group flex h-10 w-full items-center gap-2.5 rounded-xl border px-3 text-xs transition-all duration-200 shadow-2xs cursor-pointer active:scale-98',
        isActive
          ? 'bg-teal-50/90 dark:bg-teal-950/60 border-teal-500/40 text-teal-800 dark:text-teal-200 font-bold shadow-xs'
          : 'bg-white/80 dark:bg-zinc-900/60 border-slate-200/80 dark:border-zinc-800/80 hover:bg-slate-50 dark:hover:bg-zinc-800 hover:border-teal-400 text-slate-700 dark:text-zinc-300 hover:text-teal-600'
      )}
    >
      <ShoppingBag className={cn("h-4 w-4 shrink-0 transition-colors", isActive ? "text-teal-600 dark:text-teal-400" : "text-slate-500 dark:text-zinc-400 group-hover:text-teal-500")} />
      <span className={cn("font-bold text-xs flex-1 text-left", isActive ? "text-teal-800 dark:text-teal-200" : "text-slate-800 dark:text-zinc-200")}>Tienda</span>
      {!hasVisited && (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-teal-500 text-white animate-pulse">
          NUEVO
        </span>
      )}
    </motion.button>
  );
};

export default MarketplaceNavButton;
