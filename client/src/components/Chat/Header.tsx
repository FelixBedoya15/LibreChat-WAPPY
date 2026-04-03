import { useMemo, useState, useEffect } from 'react';
import { useMediaQuery } from '@librechat/client';
import { useOutletContext } from 'react-router-dom';
import { getConfigDefaults, PermissionTypes, Permissions } from 'librechat-data-provider';
import { Maximize2, Minimize2 } from 'lucide-react';
import type { ContextType } from '~/common';
import ModelSelector from './Menus/Endpoints/ModelSelector';
import { PresetsMenu, HeaderNewChat, OpenSidebar } from './Menus';
import { useGetStartupConfig } from '~/data-provider';
import ExportAndShareMenu from './ExportAndShareMenu';
import BookmarkMenu from './Menus/BookmarkMenu';
import { TemporaryChat } from './TemporaryChat';
import AddMultiConvo from './AddMultiConvo';
import { useHasAccess } from '~/hooks';

const defaultInterface = getConfigDefaults().interface;

export default function Header() {
  const { data: startupConfig } = useGetStartupConfig();
  const { navVisible, setNavVisible } = useOutletContext<ContextType>();

  const interfaceConfig = useMemo(
    () => startupConfig?.interface ?? defaultInterface,
    [startupConfig],
  );

  const hasAccessToBookmarks = useHasAccess({
    permissionType: PermissionTypes.BOOKMARKS,
    permission: Permissions.USE,
  });

  const hasAccessToMultiConvo = useHasAccess({
    permissionType: PermissionTypes.MULTI_CONVO,
    permission: Permissions.USE,
  });

  const isSmallScreen = useMediaQuery('(max-width: 768px)');

  // ── IPEVAR Matrix expand state (synced via CustomEvent) ──────────────────
  const [ipevarMaximized, setIpevarMaximized] = useState(false);
  const [isIPEVARActive, setIsIPEVARActive] = useState(false);

  useEffect(() => {
    const onMaximized = (e: Event) => {
      setIpevarMaximized((e as CustomEvent).detail?.isMaximized ?? false);
    };
    const onActive = (e: Event) => {
      setIsIPEVARActive((e as CustomEvent).detail?.active ?? false);
    };
    window.addEventListener('ipevar:maximized', onMaximized);
    window.addEventListener('ipevar:active', onActive);
    return () => {
      window.removeEventListener('ipevar:maximized', onMaximized);
      window.removeEventListener('ipevar:active', onActive);
    };
  }, []);

  const toggleIpevar = () => {
    const next = !ipevarMaximized;
    setIpevarMaximized(next);
    window.dispatchEvent(new CustomEvent('ipevar:toggle', { detail: { isMaximized: next } }));
  };

  return (
    <div className="sticky top-0 z-10 flex h-14 w-full items-center justify-between bg-surface-primary p-2 font-semibold text-text-primary">
      <div className="hide-scrollbar flex w-full items-center justify-between gap-2 overflow-x-auto">
        <div className="mx-1 flex items-center gap-2">
          <div
            className={`flex items-center gap-2 ${!isSmallScreen ? 'transition-all duration-200 ease-in-out' : ''
              } ${!navVisible
                ? 'translate-x-0 opacity-100'
                : 'pointer-events-none translate-x-[-100px] opacity-0'
              }`}
          >
            <OpenSidebar setNavVisible={setNavVisible} className="max-md:hidden" />
            {!isSmallScreen && <HeaderNewChat />}
          </div>
          <div
            className={`flex items-center gap-2 ${!isSmallScreen ? 'transition-all duration-200 ease-in-out' : ''
              } ${!navVisible ? 'translate-x-0' : 'translate-x-[-100px]'}`}
          >
            <ModelSelector startupConfig={startupConfig} />
            {interfaceConfig.presets === true && interfaceConfig.modelSelect && <PresetsMenu />}
            {hasAccessToBookmarks === true && <BookmarkMenu />}
            {hasAccessToMultiConvo === true && <AddMultiConvo />}
             {isSmallScreen && (
               <>
                 {/* Botón expandir Matriz IPEVAR — solo mobile y solo cuando la herramienta está activa */}
                 {isIPEVARActive && (
                   <button
                     onClick={toggleIpevar}
                     className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-transparent border border-border-medium text-text-primary h-9 w-9 hover:bg-surface-hover"
                     aria-label={ipevarMaximized ? 'Minimizar Matriz IPEVAR' : 'Expandir Matriz IPEVAR'}
                   >
                     {ipevarMaximized
                       ? <Minimize2 className="h-4 w-4" />
                       : <Maximize2 className="h-4 w-4" />}
                   </button>
                 )}
                 <HeaderNewChat />
                 <ExportAndShareMenu
                   isSharedButtonEnabled={startupConfig?.sharedLinksEnabled ?? false}
                 />
                 <TemporaryChat />
               </>
             )}
          </div>
        </div>
        {!isSmallScreen && (
          <div className="flex items-center gap-2">
            <ExportAndShareMenu
              isSharedButtonEnabled={startupConfig?.sharedLinksEnabled ?? false}
            />
            <TemporaryChat />
          </div>
        )}
      </div>
      {/* Empty div for spacing */}
      <div />
    </div>
  );
}
