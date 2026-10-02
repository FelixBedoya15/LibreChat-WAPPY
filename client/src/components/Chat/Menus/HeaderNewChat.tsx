import { QueryKeys } from 'librechat-data-provider';
import { useQueryClient } from '@tanstack/react-query';
import { TooltipAnchor, Button, NewChatIcon } from '@librechat/client';
import { useChatContext } from '~/Providers';
import { clearMessagesCache } from '~/utils';
import { useLocalize } from '~/hooks';

export default function HeaderNewChat() {
  const localize = useLocalize();
  const queryClient = useQueryClient();
  const { conversation, newConversation } = useChatContext();

  const clickHandler: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    if (e.button === 0 && (e.ctrlKey || e.metaKey)) {
      window.open('/c/new', '_blank');
      return;
    }
    clearMessagesCache(queryClient, conversation?.conversationId);
    queryClient.invalidateQueries([QueryKeys.messages]);
    newConversation();
  };

  return (
    <TooltipAnchor
      description={localize('com_ui_new_chat')}
      render={
        <Button
          size="icon"
          variant="outline"
          className="inline-flex size-10 flex-shrink-0 items-center justify-center rounded-xl border border-slate-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-900/80 text-teal-600 dark:text-teal-400 shadow-2xs hover:bg-teal-50/50 dark:hover:bg-teal-950/30 hover:border-teal-400 active:scale-95 transition-all cursor-pointer disabled:pointer-events-none disabled:opacity-50"
          onClick={clickHandler}
        >
          <NewChatIcon />
        </Button>
      }
    />
  );
}
