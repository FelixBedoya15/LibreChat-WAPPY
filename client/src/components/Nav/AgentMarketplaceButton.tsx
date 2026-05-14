import React, { useCallback, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { PermissionTypes, Permissions } from 'librechat-data-provider';
import { useLocalize, useHasAccess, AuthContext } from '~/hooks';
import { motion } from 'framer-motion';
import { Store } from 'lucide-react';
import { TooltipAnchor } from '@librechat/client';
import { cn } from '~/utils';

interface AgentMarketplaceButtonProps {
  isSmallScreen?: boolean;
  isCollapsed?: boolean;
  toggleNav: () => void;
}

export default function AgentMarketplaceButton({
  isSmallScreen,
  isCollapsed,
  toggleNav,
}: AgentMarketplaceButtonProps) {
  const navigate = useNavigate();
  const localize = useLocalize();
  const authContext = useContext(AuthContext);

  const hasAccessToAgents = useHasAccess({
    permissionType: PermissionTypes.AGENTS,
    permission: Permissions.USE,
  });

  const handleAgentMarketplace = useCallback(() => {
    navigate('/agents');
    if (isSmallScreen) {
      toggleNav();
    }
  }, [navigate, isSmallScreen, toggleNav]);

  const authReady =
    authContext?.isAuthenticated !== undefined &&
    (authContext?.isAuthenticated === false || authContext?.user !== undefined);

  const showAgentMarketplace = authReady && hasAccessToAgents;

  if (!showAgentMarketplace) {
    return null;
  }

  if (isCollapsed) {
    return (
      <TooltipAnchor
        description={localize('com_agents_marketplace')}
        side="right"
        render={
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleAgentMarketplace}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border-medium/50 bg-surface-primary hover:bg-surface-hover hover:border-teal-400 text-text-primary transition-all duration-300 shadow-sm mb-1 sm:hover:scale-105 sm:hover:-rotate-3"
          >
            <Store className="h-5 w-5" />
          </motion.button>
        }
      />
    );
  }

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={handleAgentMarketplace}
      className="group flex w-full items-center gap-2.5 rounded-xl border border-border-medium/30 bg-white dark:bg-surface-primary px-3 py-2.5 text-sm text-text-secondary transition-all duration-200 shadow-sm hover:bg-surface-hover hover:border-teal-400 hover:text-teal-600"
    >
      <Store className="h-4 w-4 shrink-0" />
      <span className="font-semibold text-text-primary text-[13px]">{localize('com_agents_marketplace')}</span>
    </motion.button>
  );
}
