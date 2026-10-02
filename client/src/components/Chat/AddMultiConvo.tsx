import { PlusCircle } from 'lucide-react';
import { TooltipAnchor } from '@librechat/client';
import { isAssistantsEndpoint } from 'librechat-data-provider';
import type { TConversation } from 'librechat-data-provider';
import { useChatContext, useAddedChatContext } from '~/Providers';
import { mainTextareaId } from '~/common';
import { useLocalize } from '~/hooks';

function AddMultiConvo() {
  const { conversation } = useChatContext();
  const { setConversation: setAddedConvo } = useAddedChatContext();
  const localize = useLocalize();

  const clickHandler = () => {
    const { title: _t, ...convo } = conversation ?? ({} as TConversation);
    setAddedConvo({
      ...convo,
      title: '',
    });

    const textarea = document.getElementById(mainTextareaId);
    if (textarea) {
      textarea.focus();
    }
  };

  if (!conversation) {
    return null;
  }

  if (isAssistantsEndpoint(conversation.endpoint)) {
    return null;
  }

  return (
    <TooltipAnchor
      id="add-multi-conversation-button"
      aria-label={localize('com_ui_add_multi_conversation')}
      description={localize('com_ui_add_multi_conversation')}
      tabIndex={0}
      role="button"
      onClick={clickHandler}
      data-testid="parameters-button"
      className="inline-flex size-10 flex-shrink-0 items-center justify-center rounded-xl border border-slate-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-900/80 text-slate-600 dark:text-zinc-300 shadow-2xs hover:bg-slate-50 dark:hover:bg-zinc-800 hover:text-teal-600 hover:border-teal-400 active:scale-95 transition-all cursor-pointer disabled:pointer-events-none disabled:opacity-50 radix-state-open:bg-teal-50 dark:radix-state-open:bg-teal-950/40 radix-state-open:border-teal-500"
    >
      <PlusCircle size={16} aria-label={localize('com_ui_plus_icon')} />
    </TooltipAnchor>
  );
}

export default AddMultiConvo;
