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
    <>
      <div className={cn(
        "flex py-2 mb-1 px-1 bg-surface-secondary border border-border-medium rounded-2xl shadow-sm overflow-visible relative z-20 hover:z-[100] gap-1 transition-all duration-300",
        isCollapsed 
          ? "flex-col items-center w-auto min-h-0 mx-auto px-0" 
          : "flex-row items-center justify-between min-h-[56px] h-auto flex-wrap"
      )}>
        <div className={cn(
            "flex items-center gap-1 overflow-visible justify-center w-full",
            isCollapsed ? "flex-col" : "flex-row flex-wrap"
        )}>
          <motion.button
            whileTap="tap"
            onClick={clickHandler}
            className={cn(
              "group relative flex items-center justify-center h-10 px-2.5 min-w-[40px] transition-all duration-300 shadow-sm shrink-0 cursor-pointer border outline-none rounded-xl sm:hover:scale-105 sm:hover:-rotate-3",
              "bg-teal-600 hover:bg-teal-700 text-white border-transparent",
              isCollapsed ? "w-10" : "flex-1"
            )}
          >
            <div className="relative flex-shrink-0 flex items-center justify-center">
              <AnimatedIcon name="plus" size={20} />
            </div>
            {!isCollapsed && <span className="ml-2 text-sm font-bold uppercase tracking-wider">{localize('com_ui_new_chat')}</span>}
            <div className={cn(
                "hidden sm:flex absolute items-center max-w-0 overflow-hidden opacity-0 group-hover:max-w-[150px] group-hover:opacity-100 transition-all duration-300 ease-in-out whitespace-nowrap bg-teal-600 text-white px-3 py-1.5 rounded-lg shadow-xl pointer-events-none z-[110]",
                "left-full ml-2"
            )}>
              <span className="text-[10px] font-bold uppercase tracking-wider">{localize('com_ui_new_chat')}</span>
            </div>
          </motion.button>
        </div>
      </div>
      {!isCollapsed && subHeaders != null ? subHeaders : null}
    </>
  );
}
