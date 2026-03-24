import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { QueryKeys } from 'librechat-data-provider';
import { Plus } from 'lucide-react';
import { TooltipAnchor } from '@librechat/client';
import { useLocalize, useNewConvo } from '~/hooks';
import { clearMessagesCache } from '~/utils';
import store from '~/store';
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

  // Collapsed: icon-only square matching right panel style
  if (isCollapsed) {
    return (
      <TooltipAnchor
        description={localize('com_ui_new_chat')}
        side="right"
        render={
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={clickHandler}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-transparent bg-teal-600 hover:bg-teal-700 text-white transition-all duration-300 shadow-sm mb-1 sm:hover:scale-105 sm:hover:-rotate-3"
          >
            <Plus className="h-5 w-5" />
          </motion.button>
        }
      />
    );
  }

  // Expanded: full-width teal button with icon left-aligned + label
  return (
    <>
      <div className="flex py-2 mb-1 px-1 w-full">
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={clickHandler}
          className="group flex w-full items-center justify-center gap-3 rounded-xl border border-transparent bg-teal-600 hover:bg-teal-700 px-4 py-3 text-sm font-semibold text-white transition-all duration-300 shadow-sm"
        >
          <Plus className="h-5 w-5 shrink-0" />
          <span>{localize('com_ui_new_chat')}</span>
        </motion.button>
      </div>
      {subHeaders != null ? subHeaders : null}
    </>
  );
}
