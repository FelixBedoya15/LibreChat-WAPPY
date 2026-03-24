import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { QueryKeys } from 'librechat-data-provider';
import { useLocalize, useNewConvo } from '~/hooks';
import { clearMessagesCache } from '~/utils';
import store from '~/store';
import { Plus, Bookmark, Shield, Camera, LayoutPanelLeft } from 'lucide-react';
import { cn } from '~/utils';

export default function NewChat({
  index = 0,
  toggleNav,
  subHeaders,
}: {
  index?: number;
  toggleNav: () => void;
  subHeaders?: React.ReactNode;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { newConversation: newConvo } = useNewConvo();
  const localize = useLocalize();

  const clickHandler = useCallback(
    (event: React.MouseEvent<HTMLButtonElement | HTMLDivElement>) => {
      if (event.button === 0 && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) {
        event.preventDefault();
        index === 0 ? newConvo() : clearMessagesCache(queryClient);
        navigate('/c/new');
        store.set(store.isFullWidth, false);
      }
    },
    [index, newConvo, navigate, queryClient],
  );

  const ActionButton = ({ icon, label, onClick, className = "" }: { icon: React.ReactNode, label: string, onClick?: (e: any) => void, className?: string }) => (
    <button
      onClick={onClick}
      className={cn(
        "flex h-10 w-full items-center gap-3 rounded-xl border border-border-light/50 bg-white px-3 text-sm font-medium text-text-primary transition-all hover:bg-surface-hover hover:border-border-medium shadow-sm",
        className
      )}
    >
      <div className="flex-shrink-0 text-text-tertiary">
        {icon}
      </div>
      <span className="truncate">{label}</span>
    </button>
  );

  return (
    <div className="flex flex-col w-full px-2 py-4 gap-2 overflow-visible">
      {/* Top Row: Toggle */}
      <div className="flex items-center h-10 mb-2">
        <button
          onClick={toggleNav}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-border-light/50 bg-white text-text-tertiary hover:bg-surface-hover transition-all shadow-sm"
          title={localize('com_nav_close_sidebar')}
        >
          <LayoutPanelLeft size={20} />
        </button>
      </div>

      {/* Vertical Stack */}
      <div className="flex flex-col gap-2 w-full">
        <ActionButton 
          icon={<Plus size={18} />} 
          label={localize('com_ui_new_chat')} 
          onClick={clickHandler}
          className="bg-white"
        />
        
        {/* Search Bar Container */}
        <div className="w-full">
          {subHeaders}
        </div>

        <ActionButton 
          icon={<Bookmark size={18} />} 
          label="Marcadores" 
          onClick={() => {}} // Handle navigation or trigger
        />

        <ActionButton 
          icon={<Shield size={18} />} 
          label="Gestor SG-SST" 
          onClick={() => navigate('/sgsst')}
        />

        <ActionButton 
          icon={<Camera size={18} />} 
          label="Cámara de Riesgo" 
          onClick={() => navigate('/risk-camera')}
        />
      </div>
    </div>
  );
}
