import React, { useCallback, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { PermissionTypes, Permissions } from 'librechat-data-provider';
import { useLocalize, useHasAccess, AuthContext } from '~/hooks';
import { motion } from 'framer-motion';
import { AnimatedIcon } from '~/components/ui/AnimatedIcon';
import { cn } from '~/utils';

interface AgentMarketplaceButtonProps {
  isSmallScreen?: boolean;
  toggleNav: () => void;
}

export default function AgentMarketplaceButton({
  isSmallScreen,
  toggleNav,
}: AgentMarketplaceButtonProps) {
  const navigate = useNavigate();
  const localize = useLocalize();
  const authContext = useContext(AuthContext);

  const hasAccessToAgents = useHasAccess({
    permissionType: PermissionTypes.AGENTS,
    permission: Permissions.USE,
  });

  const hasAccessToMarketplace = useHasAccess({
    permissionType: PermissionTypes.MARKETPLACE,
    permission: Permissions.USE,
  });

  const handleAgentMarketplace = useCallback(() => {
    navigate('/agents');
    if (isSmallScreen) {
      toggleNav();
    }
  }, [navigate, isSmallScreen, toggleNav]);

  // Check if auth is ready (avoid race conditions)
  const authReady =
    authContext?.isAuthenticated !== undefined &&
    (authContext?.isAuthenticated === false || authContext?.user !== undefined);

  // Show agent marketplace when marketplace permission is enabled, auth is ready, and user has access to agents
  const showAgentMarketplace = authReady && hasAccessToAgents && hasAccessToMarketplace;

  if (!showAgentMarketplace) {
    return null;
  }

  return (
    <motion.button
        whileTap="tap"
        onClick={handleAgentMarketplace}
        className={cn(
            "group relative flex items-center justify-center h-10 px-2.5 min-w-[40px] transition-all duration-300 shadow-sm shrink-0 cursor-pointer border outline-none rounded-xl sm:hover:scale-105 sm:hover:-rotate-3",
            "bg-surface-primary border-border-medium hover:bg-surface-hover hover:border-teal-400 text-text-primary"
        )}
    >
        <div className="relative flex-shrink-0 flex items-center justify-center">
            <AnimatedIcon name="layout-list" size={20} />
        </div>
        <div className="hidden sm:flex absolute top-full mt-2 left-1/2 -translate-x-1/2 items-center max-w-0 overflow-hidden opacity-0 group-hover:max-w-[170px] group-hover:opacity-100 transition-all duration-300 ease-in-out whitespace-nowrap bg-teal-600 text-white px-3 py-1.5 rounded-lg shadow-xl pointer-events-none z-[110] border border-teal-500/50">
            <span className="text-[10px] font-bold uppercase tracking-wider">{localize('com_agents_marketplace')}</span>
        </div>
    </motion.button>
  );
}
