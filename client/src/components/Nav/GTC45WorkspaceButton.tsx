import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Network } from 'lucide-react';
import { useMediaQuery, TooltipAnchor } from '@librechat/client';

export default function GTC45WorkspaceButton({
  isSmallScreen,
  toggleNav,
  isCollapsed
}: {
  isSmallScreen: boolean;
  toggleNav: () => void;
  isCollapsed: boolean;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const isAgentGTC45Path = location.pathname.startsWith('/sgsst/agente-gtc45');

  const clickHandler = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    navigate('/sgsst/agente-gtc45');
    if (isSmallScreen) {
      toggleNav();
    }
  };

  if (isCollapsed) {
    return (
      <TooltipAnchor
        description="Agente GTC-45 (PRO)"
        side="right"
        render={
          <a
            className="group flex h-10 w-10 items-center justify-center rounded-xl bg-surface-primary hover:bg-surface-hover text-text-primary transition-all duration-300 shadow-sm mb-1 sm:hover:scale-105"
            href="/sgsst/agente-gtc45"
            onClick={clickHandler}
          >
            <Network className="w-5 h-5 text-teal-600" />
          </a>
        }
      />
    );
  }

  return (
    <a
      className={`group flex items-center gap-2 rounded-xl py-2 px-3 text-sm transition-colors duration-200 ${
        isAgentGTC45Path 
          ? 'bg-teal-500/10 text-teal-700 dark:text-teal-400 font-semibold' 
          : 'bg-transparent hover:bg-surface-hover text-text-secondary hover:text-text-primary font-medium'
      }`}
      href="/sgsst/agente-gtc45"
      onClick={clickHandler}
    >
      <div className={`flex items-center justify-center p-1.5 rounded-lg shadow-sm ${isAgentGTC45Path ? 'bg-teal-500 text-white' : 'bg-surface-primary border border-border-light text-teal-600 dark:text-teal-400 group-hover:border-teal-400 transition-colors'}`}>
        <Network className="w-4 h-4" />
      </div>
      <span className="truncate">Agente GTC-45</span>
      <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300 shadow-sm ring-1 ring-inset ring-teal-500/20">
        PRO
      </span>
    </a>
  );
}
