import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { QueryKeys } from 'librechat-data-provider';
import { useLocalize, useNewConvo } from '~/hooks';
import { clearMessagesCache } from '~/utils';
import store from '~/store';
import { Plus, Bookmark, Shield, Camera, PanelLeft } from 'lucide-react';
import { cn } from '~/utils';

export default function NewChat({
  index = 0,
  toggleNav,
}: {
  index?: number;
  toggleNav: () => void;
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

  return (
    <div className="flex flex-col w-full px-2 py-4 gap-2 overflow-visible">
      {/* Top Row: Toggle (Left) and Quick Actions (Right) */}
      <div className="flex items-center justify-between h-10 mb-2 w-full">
        {/* Toggle Button (Left) */}
        <button
          onClick={toggleNav}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-border-light/50 bg-white text-text-tertiary hover:bg-surface-hover transition-all shadow-sm"
          title={localize('com_nav_close_sidebar')}
        >
          <PanelLeft size={20} />
        </button>

        {/* Quick Actions (Right) */}
        <div className="flex items-center gap-1">
          <button
            onClick={clickHandler}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border-light/50 bg-white text-text-tertiary hover:bg-surface-hover transition-all shadow-sm"
            title={localize('com_ui_new_chat')}
          >
            <Plus size={18} />
          </button>
          <button
            onClick={() => {}} // Handle Bookmark quick access
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border-light/50 bg-white text-text-tertiary hover:bg-surface-hover transition-all shadow-sm"
            title="Marcadores"
          >
            <Bookmark size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
