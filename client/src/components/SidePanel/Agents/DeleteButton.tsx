import { useFormContext } from 'react-hook-form';
import {
  Label,
  Button,
  OGDialog,
  TrashIcon,
  useToastContext,
  OGDialogTrigger,
  OGDialogTemplate,
} from '@librechat/client';
import type { Agent, AgentCreateParams } from 'librechat-data-provider';
import type { UseMutationResult } from '@tanstack/react-query';
import { logger, getDefaultAgentFormValues } from '~/utils';
import { useLocalize, useSetIndexOptions } from '~/hooks';
import { useDeleteAgentMutation } from '~/data-provider';
import { useChatContext } from '~/Providers';
import { isEphemeralAgent } from '~/common';

export default function DeleteButton({
  agent_id,
  setCurrentAgentId,
  createMutation,
}: {
  agent_id: string;
  setCurrentAgentId: React.Dispatch<React.SetStateAction<string | undefined>>;
  createMutation: UseMutationResult<Agent, Error, AgentCreateParams>;
}) {
  const localize = useLocalize();
  const { reset } = useFormContext();
  const { showToast } = useToastContext();
  const { conversation } = useChatContext();
  const { setOption } = useSetIndexOptions();

  const deleteAgent = useDeleteAgentMutation({
    onSuccess: (_, vars, context) => {
      const updatedList = context as Agent[] | undefined;
      if (!updatedList) {
        return;
      }

      showToast({
        message: localize('com_ui_agent_deleted'),
        status: 'success',
      });

      if (createMutation.data?.id ?? '') {
        logger.log('agents', 'resetting createMutation');
        createMutation.reset();
      }

      const firstAgent = updatedList[0] as Agent | undefined;
      if (!firstAgent) {
        setCurrentAgentId(undefined);
        reset(getDefaultAgentFormValues());
        return setOption('agent_id')('');
      }

      if (vars.agent_id === conversation?.agent_id) {
        setOption('model')('');
        return setOption('agent_id')(firstAgent.id);
      }

      const currentAgent = updatedList.find((agent) => agent.id === conversation?.agent_id);

      if (currentAgent) {
        setCurrentAgentId(currentAgent.id);
      }

      setCurrentAgentId(firstAgent.id);
    },
    onError: (error) => {
      console.error(error);
      showToast({
        message: localize('com_ui_agent_delete_error'),
        status: 'error',
      });
    },
  });

  if (isEphemeralAgent(agent_id)) {
    return null;
  }

  return (
    <OGDialog>
      <OGDialogTrigger asChild>
        <button
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-red-200/80 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 hover:border-red-300 shadow-2xs active:scale-95 transition-all cursor-pointer"
          aria-label={localize('com_ui_delete') + ' ' + localize('com_ui_agent')}
          type="button"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </OGDialogTrigger>
      <OGDialogTemplate
        title={localize('com_ui_delete') + ' ' + localize('com_ui_agent')}
        className="max-w-[450px]"
        main={
          <>
            <div className="flex w-full flex-col items-center gap-2">
              <div className="grid w-full items-center gap-2">
                <Label htmlFor="delete-agent" className="text-left text-sm font-medium">
                  {localize('com_ui_delete_agent_confirm')}
                </Label>
              </div>
            </div>
          </>
        }
        selection={{
          selectHandler: () => deleteAgent.mutate({ agent_id }),
          selectClasses: 'bg-red-600 hover:bg-red-700 dark:hover:bg-red-800 text-white',
          selectText: localize('com_ui_delete'),
        }}
      />
    </OGDialog>
  );
}
