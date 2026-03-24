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
          className="inline-flex size-10 items-center justify-center rounded-xl border border-border-light bg-transparent text-text-primary transition-all ease-in-out hover:bg-surface-tertiary disabled:pointer-events-none disabled:opacity-50 md:size-icon md:bg-surface-secondary md:p-2 md:hover:bg-surface-hover"
          onClick={clickHandler}
        >
          <NewChatIcon />
        </Button>
      }
    />
  );
}
