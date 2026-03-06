import { memo } from 'react';
import { showThinkingAtom } from '~/store/showThinking';
import FontSizeSelector from './FontSizeSelector';
import { ForkSettings } from './ForkSettings';
import ChatDirection from './ChatDirection';
import ToggleSwitch from '../ToggleSwitch';
import store from '~/store';

const toggleSwitchConfigs = [
  {
    stateAtom: store.enterToSend,
    localizationKey: 'com_nav_enter_to_send',
    switchId: 'enterToSend',
    hoverCardText: 'com_nav_info_enter_to_send',
    key: 'enterToSend',
  },
  {
    stateAtom: store.maximizeChatSpace,
    localizationKey: 'com_nav_maximize_chat_space',
    switchId: 'maximizeChatSpace',
    hoverCardText: undefined,
    key: 'maximizeChatSpace',
  },
  {
    stateAtom: store.centerFormOnLanding,
    localizationKey: 'com_nav_center_chat_input',
    switchId: 'centerFormOnLanding',
    hoverCardText: undefined,
    key: 'centerFormOnLanding',
  },
  {
    stateAtom: showThinkingAtom,
    localizationKey: 'com_nav_show_thinking',
    switchId: 'showThinking',
    hoverCardText: undefined,
    key: 'showThinking',
  },
  {
    stateAtom: store.showCode,
    localizationKey: 'com_nav_show_code',
    switchId: 'showCode',
    hoverCardText: undefined,
    key: 'showCode',
  },
  {
    stateAtom: store.LaTeXParsing,
    localizationKey: 'com_nav_latex_parsing',
    switchId: 'latexParsing',
    hoverCardText: 'com_nav_info_latex_parsing',
    key: 'latexParsing',
  },
  {
    stateAtom: store.saveDrafts,
    localizationKey: 'com_nav_save_drafts',
    switchId: 'saveDrafts',
    hoverCardText: 'com_nav_info_save_draft',
    key: 'saveDrafts',
  },
  {
    stateAtom: store.showScrollButton,
    localizationKey: 'com_nav_scroll_button',
    switchId: 'showScrollButton',
    hoverCardText: undefined,
    key: 'showScrollButton',
  },
  {
    stateAtom: store.saveBadgesState,
    localizationKey: 'com_nav_save_badges_state',
    switchId: 'showBadges',
    hoverCardText: 'com_nav_info_save_badges_state',
    key: 'showBadges',
  },
  {
    stateAtom: store.modularChat,
    localizationKey: 'com_nav_modular_chat',
    switchId: 'modularChat',
    hoverCardText: undefined,
    key: 'modularChat',
  },
];

function Chat() {
  return (
    <div className="flex flex-col gap-4 text-sm text-text-primary">
      {/* Tarjeta de Visualización */}
      <div className="rounded-2xl border border-gray-200 bg-surface-primary px-6 py-5 shadow-sm dark:border-gray-700">
        <h3 className="mb-4 text-lg font-medium text-text-primary">Visualización</h3>
        <div className="flex flex-col gap-4">
          <FontSizeSelector />
          <div className="h-px bg-gray-200 dark:bg-gray-700" />
          <ChatDirection />
        </div>
      </div>

      {/* Tarjeta de Funcionalidad */}
      <div className="rounded-2xl border border-gray-200 bg-surface-primary px-6 py-5 shadow-sm dark:border-gray-700">
        <h3 className="mb-4 text-lg font-medium text-text-primary">Funcionalidad del Chat</h3>
        <div className="flex flex-col gap-4">
          {toggleSwitchConfigs.map((config, index) => (
            <div key={config.key}>
              <ToggleSwitch
                stateAtom={config.stateAtom}
                localizationKey={config.localizationKey as any}
                hoverCardText={config.hoverCardText as any}
                switchId={config.switchId}
              />
              {index < toggleSwitchConfigs.length - 1 && (
                <div className="mt-4 h-px bg-gray-200 dark:bg-gray-700" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Tarjeta de Configuración de Bifurcación */}
      <div className="rounded-2xl border border-gray-200 bg-surface-primary px-6 py-5 shadow-sm dark:border-gray-700">
        <ForkSettings />
      </div>
    </div>
  );
}

export default memo(Chat);
