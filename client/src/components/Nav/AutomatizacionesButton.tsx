import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Cpu } from 'lucide-react';
import { TooltipAnchor } from '@librechat/client';
import { cn } from '~/utils';

interface Props {
  isSmallScreen?: boolean;
  isCollapsed?: boolean;
  toggleNav?: () => void;
}

const AutomatizacionesButton = ({
  isSmallScreen = false,
  isCollapsed = false,
  toggleNav,
}: Props) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = location.pathname.startsWith('/sgsst/automatizaciones');

  const handleClick = () => {
    navigate('/sgsst/automatizaciones');
    if (isSmallScreen && toggleNav) {
      toggleNav();
    }
  };

  if (isCollapsed) {
    return (
      <TooltipAnchor
        description="Automatizaciones"
        side="right"
        render={
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleClick}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl border transition-all duration-200 shadow-sm",
              isActive
                ? "bg-purple-100/50 border-purple-400 text-purple-600"
                : "bg-surface-primary border-border-medium/50 hover:bg-surface-hover hover:border-purple-400 text-text-primary"
            )}
          >
            <Cpu className="h-5 w-5 text-purple-500" />
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
        "group flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-sm transition-all duration-200 shadow-sm",
        isActive
          ? "bg-purple-50/50 border-purple-400/50 text-purple-700 dark:text-purple-400 dark:bg-purple-900/40"
          : "bg-white dark:bg-surface-primary border-border-medium/30 hover:bg-surface-hover hover:border-purple-400 text-text-secondary hover:text-purple-600"
      )}
    >
      <Cpu className="h-4 w-4 shrink-0 text-purple-500" />
      <span className="font-semibold text-text-primary text-[13px]">Automatizaciones</span>
    </motion.button>
  );
};

export default AutomatizacionesButton;
