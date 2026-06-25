import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trello } from 'lucide-react';
import { TooltipAnchor } from '@librechat/client';
import { cn } from '~/utils';
import { useAuthContext } from '~/hooks';

interface Props {
  isSmallScreen?: boolean;
  isCollapsed?: boolean;
  toggleNav?: () => void;
}

const KanbanButton = ({
  isSmallScreen = false,
  isCollapsed = false,
  toggleNav,
}: Props) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthContext();
  const isActive = location.pathname.startsWith('/kanban');
  const isAdmin = user?.role === 'ADMIN';

  // Only render for ADMIN
  if (!isAdmin) {
    return null;
  }

  const handleClick = () => {
    navigate('/kanban');
    if (isSmallScreen && toggleNav) {
      toggleNav();
    }
  };

  if (isCollapsed) {
    return (
      <TooltipAnchor
        description="Tablero Kanban"
        side="right"
        render={
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleClick}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl border transition-all duration-200 shadow-sm relative",
              isActive
                ? "bg-teal-100/50 border-teal-400 text-teal-600"
                : "bg-surface-primary border-border-medium/50 hover:bg-surface-hover hover:border-teal-400 text-text-primary"
            )}
          >
            <Trello className="h-5 w-5" />
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
          ? "bg-teal-50/50 border-teal-400/50 text-teal-700 dark:text-teal-400 dark:bg-teal-900/40"
          : "bg-white dark:bg-surface-primary border-border-medium/30 hover:bg-surface-hover hover:border-teal-400 text-text-secondary hover:text-teal-600"
      )}
    >
      <Trello className="h-4 w-4 shrink-0" />
      <span className="font-semibold text-text-primary text-[13px] flex-1 text-left">Tablero Kanban</span>
    </motion.button>
  );
};

export default KanbanButton;
