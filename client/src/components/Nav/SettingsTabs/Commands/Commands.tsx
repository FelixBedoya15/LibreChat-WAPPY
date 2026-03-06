import { memo } from 'react';
import { InfoHoverCard, ESide } from '@librechat/client';
import { PermissionTypes, Permissions } from 'librechat-data-provider';
import { useLocalize, useHasAccess } from '~/hooks';
import ToggleSwitch from '../ToggleSwitch';
import store from '~/store';

const commandSwitchConfigs = [
  {
    stateAtom: store.atCommand,
    localizationKey: 'com_nav_at_command_description' as const,
    switchId: 'atCommand',
    key: 'atCommand',
    permissionType: undefined,
  },
  {
    stateAtom: store.plusCommand,
    localizationKey: 'com_nav_plus_command_description' as const,
    switchId: 'plusCommand',
    key: 'plusCommand',
    permissionType: PermissionTypes.MULTI_CONVO,
  },
  {
    stateAtom: store.slashCommand,
    localizationKey: 'com_nav_slash_command_description' as const,
    switchId: 'slashCommand',
    key: 'slashCommand',
    permissionType: PermissionTypes.PROMPTS,
  },
] as const;

function Commands() {
  const localize = useLocalize();

  const hasAccessToPrompts = useHasAccess({
    permissionType: PermissionTypes.PROMPTS,
    permission: Permissions.USE,
  });

  const hasAccessToMultiConvo = useHasAccess({
    permissionType: PermissionTypes.MULTI_CONVO,
    permission: Permissions.USE,
  });

  const getShowSwitch = (permissionType?: PermissionTypes) => {
    if (!permissionType) {
      return true;
    }
    if (permissionType === PermissionTypes.MULTI_CONVO) {
      return hasAccessToMultiConvo === true;
    }
    if (permissionType === PermissionTypes.PROMPTS) {
      return hasAccessToPrompts === true;
    }
    return true;
  };

  return (
    <div className="flex flex-col gap-4 text-sm text-text-primary">
      <div className="rounded-2xl border border-gray-200 bg-surface-primary px-6 py-5 shadow-sm dark:border-gray-700">
        <div className="mb-4 flex items-center gap-2">
          <h3 className="text-lg font-medium text-text-primary">
            {localize('com_nav_chat_commands')}
          </h3>
          <InfoHoverCard side={ESide.Bottom} text={localize('com_nav_chat_commands_info')} />
        </div>
        <div className="flex flex-col gap-4">
          {commandSwitchConfigs.map((config, index) => (
            <div key={config.key}>
              <ToggleSwitch
                stateAtom={config.stateAtom}
                localizationKey={config.localizationKey}
                switchId={config.switchId}
                showSwitch={getShowSwitch(config.permissionType)}
              />
              {index < commandSwitchConfigs.length - 1 && (
                <div className="mt-4 h-px bg-gray-200 dark:bg-gray-700" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default memo(Commands);
