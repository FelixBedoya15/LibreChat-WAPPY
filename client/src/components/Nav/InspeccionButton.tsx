import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Briefcase } from 'lucide-react';
import { TooltipAnchor } from '@librechat/client';
import { cn } from '~/utils';

interface Props {
  isSmallScreen?: boolean;
  isCollapsed?: boolean;
  toggleNav?: () => void;
}

const InspeccionButton = ({ isSmallScreen = false, isCollapsed = false, toggleNav }: Props) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = location.pathname.startsWith('/inspeccion');

  const handleClick = () => {
    navigate('/inspeccion');
    if (isSmallScreen && toggleNav) toggleNav();
  };

  if (isCollapsed) {
    return (
      <TooltipAnchor description="Inspección MinTrabajo" side="right" render={
        <motion.button whileTap={{ scale: 0.95 }} onClick={handleClick} className={cn('flex h-10 w-10 items-center justify-center rounded-xl border transition-all duration-200 shadow-sm', isActive ? 'bg-blue-100/50 border-blue-400 text-blue-600' : 'bg-surface-primary border-border-medium/50 hover:bg-surface-hover hover:border-blue-400 text-text-primary')}>
          <Briefcase className="h-5 w-5" />
        </motion.button>
      } />
    );
  }

  return (
    <motion.button whileTap={{ scale: 0.98 }} onClick={handleClick} className={cn('group flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-sm transition-all duration-200 shadow-sm', isActive ? 'bg-blue-50/50 border-blue-400/50 text-blue-700 dark:text-blue-400 dark:bg-blue-900/40' : 'bg-white dark:bg-surface-primary border-border-medium/30 hover:bg-surface-hover hover:border-blue-400 text-text-secondary hover:text-blue-600')}>
      <Briefcase className="h-4 w-4 shrink-0" />
      <span className="font-semibold text-text-primary text-[13px]">Inspección MinTrabajo</span>
    </motion.button>
  );
};

export default InspeccionButton;
