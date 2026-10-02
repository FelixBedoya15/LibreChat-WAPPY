import type { FC } from 'react';
import { BookCopy } from 'lucide-react';
import { TooltipAnchor } from '@librechat/client';
import { Content, Portal, Root, Trigger } from '@radix-ui/react-popover';
import { EditPresetDialog, PresetItems } from './Presets';
import { useLocalize, usePresets } from '~/hooks';
import { useChatContext } from '~/Providers';

const PresetsMenu: FC = () => {
  const localize = useLocalize();
  const {
    presetsQuery,
    onSetDefaultPreset,
    onFileSelected,
    onSelectPreset,
    onChangePreset,
    clearAllPresets,
    onDeletePreset,
    submitPreset,
    exportPreset,
  } = usePresets();
  const { preset } = useChatContext();
  return (
    <Root>
      <Trigger asChild>
        <TooltipAnchor
          id="presets-button"
          aria-label={localize('com_endpoint_examples')}
          description={localize('com_endpoint_examples')}
          tabIndex={0}
          role="button"
          data-testid="presets-button"
          className="inline-flex size-10 flex-shrink-0 items-center justify-center rounded-xl border border-slate-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-900/80 text-slate-600 dark:text-zinc-300 shadow-2xs hover:bg-slate-50 dark:hover:bg-zinc-800 hover:text-teal-600 hover:border-teal-400 active:scale-95 transition-all cursor-pointer disabled:pointer-events-none disabled:opacity-50 radix-state-open:bg-teal-50 dark:radix-state-open:bg-teal-950/40 radix-state-open:border-teal-500"
        >
          <BookCopy size={16} aria-label="Preset Icon" />
        </TooltipAnchor>
      </Trigger>
      <Portal>
        <div
          style={{
            position: 'fixed',
            left: '0px',
            top: '0px',
            transform: 'translate3d(268px, 50px, 0px)',
            minWidth: 'max-content',
            zIndex: 'auto',
          }}
        >
          <Content
            side="bottom"
            align="center"
            className="mt-2 max-h-[495px] overflow-x-hidden rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-700 dark:text-white md:min-w-[400px]"
          >
            <PresetItems
              presets={presetsQuery.data}
              onSetDefaultPreset={onSetDefaultPreset}
              onSelectPreset={onSelectPreset}
              onChangePreset={onChangePreset}
              onDeletePreset={onDeletePreset}
              clearAllPresets={clearAllPresets}
              onFileSelected={onFileSelected}
            />
          </Content>
        </div>
      </Portal>
      {preset && <EditPresetDialog submitPreset={submitPreset} exportPreset={exportPreset} />}
    </Root>
  );
};

export default PresetsMenu;
