import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { QueryKeys } from 'librechat-data-provider';
import { useLocalize, useNewConvo } from '~/hooks';
import { clearMessagesCache } from '~/utils';
import store from '~/store';
import { AnimatedIcon } from '~/components/ui/AnimatedIcon';
import { motion } from 'framer-motion';
import { cn } from '~/utils';

export default function NewChat({
  index = 0,
  toggleNav,
  subHeaders,
  isSmallScreen,
  headerButtons,
  isCollapsed,
}: {
  index?: number;
  toggleNav: () => void;
  isSmallScreen?: boolean;
  subHeaders?: React.ReactNode;
  headerButtons?: React.ReactNode;
  isCollapsed?: boolean;
}) {
  const queryClient = useQueryClient();
  /** Note: this component needs an explicit index passed if using more than one */
  const { newConversation: newConvo } = useNewConvo(index);
  const navigate = useNavigate();
  const localize = useLocalize();
  const { conversation } = store.useCreateConversationAtom(index);

  const clickHandler: React.MouseEventHandler<HTMLButtonElement> = useCallback(
    (e) => {
      if (e.button === 0 && (e.ctrlKey || e.metaKey)) {
        window.open('/c/new', '_blank');
        return;
      }
      clearMessagesCache(queryClient, conversation?.conversationId);
      queryClient.invalidateQueries([QueryKeys.messages]);
      newConvo();
      navigate('/c/new', { state: { focusChat: true } });
      if (isSmallScreen) {
        toggleNav();
      }
    },
    [queryClient, conversation, newConvo, navigate, toggleNav, isSmallScreen],
  );

  return (
    <div className={cn("flex flex-col gap-2 p-1 transition-all duration-300", isCollapsed && "items-center")}>
      <div className={cn("flex items-center gap-2", isCollapsed ? "flex-col" : "flex-row w-full")}>
        {/* Toggle Button */}
        <button
          onClick={toggleNav}
          className={cn(
            "flex items-center justify-center h-10 w-10 shrink-0 transition-colors rounded-xl border border-border-light/50 bg-white hover:bg-surface-hover hover:border-border-medium shadow-sm",
            isCollapsed && "order-first"
          )}
        >
          <AnimatedIcon name="sidebar" size={20} className={cn("transition-transform", isCollapsed && "rotate-180")} />
        </button>

        {/* New Chat Button */}
        <motion.button
          whileTap="tap"
          onClick={clickHandler}
          className={cn(
            "group relative flex items-center justify-center h-10 transition-all duration-300 shadow-sm shrink-0 cursor-pointer border border-teal-600/30 outline-none rounded-xl bg-teal-600 text-white hover:bg-teal-700",
            isCollapsed ? "w-10" : "flex-1 px-4"
          )}
        >
          <AnimatedIcon name="plus" size={20} />
          {!isCollapsed && <span className="ml-2 whitespace-nowrap text-sm font-bold uppercase tracking-tight">{localize('com_ui_new_chat')}</span>}
        </motion.button>
      </div>

      {/* Search Bar & Extra Buttons */}
      {!isCollapsed && (
        <div className="flex flex-col gap-1 w-full">
          {subHeaders}
          <div className="flex flex-row flex-wrap gap-1 mt-1 justify-center">
            {headerButtons}
          </div>
        </div>
      )}

      {isCollapsed && (
        <div className="flex flex-col gap-2 mt-2">
          {headerButtons}
        </div>
      )}
    </div>
  );
}
