import React from 'react';
import * as Ariakit from '@ariakit/react';
import { ChevronRight, Cpu } from 'lucide-react';
import { useLocalize } from '~/hooks';
import { cn } from '~/utils';

interface ModelSubMenuProps {
    models: string[];
    selectedModel: string;
    onSelectModel: (model: string) => void;
}

const ModelSubMenu = React.forwardRef<HTMLDivElement, ModelSubMenuProps>(
    ({ models, selectedModel, onSelectModel, ...props }, ref) => {
        const localize = useLocalize();

        const menuStore = Ariakit.useMenuStore({
            focusLoop: true,
            showTimeout: 100,
            placement: 'right',
        });

        return (
            <div ref={ref}>
                <Ariakit.MenuProvider store={menuStore}>
                    <Ariakit.MenuItem
                        {...props}
                        hideOnClick={false}
                        render={
                            <Ariakit.MenuButton
                                onMouseEnter={() => {
                                    menuStore.show();
                                }}
                                className="flex w-full cursor-pointer items-center justify-between rounded-lg p-2 hover:bg-surface-hover"
                            />
                        }
                    >
                        <div className="flex items-center gap-2">
                            <Cpu className="icon-md" />
                            <span>{localize('com_ui_model')}</span>
                            <ChevronRight className="ml-auto h-3 w-3 text-text-secondary" />
                        </div>
                        <span className="text-xs text-text-secondary truncate max-w-[100px] text-right font-normal">
                            {selectedModel}
                        </span>
                    </Ariakit.MenuItem>

                    <Ariakit.Menu
                        portal={true}
                        unmountOnHide={true}
                        className={cn(
                            'animate-popover-left z-50 ml-3 flex max-h-[300px] min-w-[220px] flex-col overflow-y-auto rounded-xl',
                            'border border-border-light bg-surface-secondary px-1.5 py-1 shadow-lg scrollbar-thin scrollbar-thumb-border-medium',
                        )}
                    >
                        <div className="px-2 py-1.5 border-b border-border-light mb-1 border-opacity-50">
                            <div className="text-xs font-semibold text-text-secondary">
                                {localize('com_ui_select_model')}
                            </div>
                        </div>
                        {models.map((model) => (
                            <Ariakit.MenuItem
                                key={model}
                                onClick={(event) => {
                                    event.preventDefault();
                                    event.stopPropagation();
                                    onSelectModel(model);
                                    menuStore.hide();
                                }}
                                className={cn(
                                    'mb-0.5 flex items-center justify-between rounded-lg px-2 py-2',
                                    'cursor-pointer text-text-primary outline-none transition-colors text-sm',
                                    'hover:bg-black/[0.075] dark:hover:bg-white/10',
                                    'data-[active-item]:bg-black/[0.075] dark:data-[active-item]:bg-white/10',
                                )}
                            >
                                <div className="flex items-center gap-2">
                                    <div className="flex h-4 w-4 items-center justify-center">
                                        <Ariakit.MenuItemCheck checked={selectedModel === model} />
                                    </div>
                                    <span className={cn(selectedModel === model ? 'font-medium text-blue-500' : '')}>
                                        {model}
                                    </span>
                                </div>
                            </Ariakit.MenuItem>
                        ))}
                    </Ariakit.Menu>
                </Ariakit.MenuProvider>
            </div>
        );
    },
);

ModelSubMenu.displayName = 'ModelSubMenu';

export default React.memo(ModelSubMenu);
