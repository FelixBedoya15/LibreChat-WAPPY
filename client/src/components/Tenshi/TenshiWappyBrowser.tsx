import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Globe,
  Loader2,
  Maximize2,
  Minimize2,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';
import { ExpandableButton } from '~/components/Common/ExpandableButton';
import { setTenshiEmbeddedBrowserFrame } from '~/components/Chat/TenshiPageController';
import {
  TENSHI_POPOVER_EVENT,
  announceTenshiPopoverOpen,
} from './TenshiSessionControls';
import {
  TENSHI_BROWSER_FRAME_NAME,
  WAPPY_BROWSER_DESTINATIONS,
  formatWappyBrowserTitle,
  normalizeToEmbedUrl,
  stripTenshiEmbedParam,
} from '~/utils/tenshiEmbed';
import { cn } from '~/utils';

export interface TenshiWappyBrowserHandle {
  navigateTo: (rawRoute: string, sgsstModule?: string) => void;
  reload: () => void;
  getContentWindow: () => Window | null;
  getCurrentUrl: () => string;
  dispatchToFrame: (eventName: string, detail?: unknown) => boolean;
}

export interface TenshiWappyBrowserProps {
  initialUrl?: string;
  isVisible: boolean;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onOpenOutside: (cleanUrl: string) => void;
  onBackToChat: () => void;
  onUrlChange?: (cleanUrl: string, titleInfo: { shortLabel: string; fullTitle: string }) => void;
}

function splitCleanUrlParts(cleanUrl: string): { pathname: string; search: string } {
  const withoutHash = String(cleanUrl || '/sgsst').split('#')[0];
  const qIdx = withoutHash.indexOf('?');
  if (qIdx === -1) {
    return { pathname: withoutHash || '/sgsst', search: '' };
  }
  return {
    pathname: withoutHash.slice(0, qIdx) || '/sgsst',
    search: withoutHash.slice(qIdx),
  };
}

function normalizeSearchText(text: string): string {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export const TenshiWappyBrowser = forwardRef<TenshiWappyBrowserHandle, TenshiWappyBrowserProps>(
  (
    {
      initialUrl = '/sgsst',
      isVisible,
      isFullscreen,
      onToggleFullscreen,
      onOpenOutside,
      onBackToChat,
      onUrlChange,
    },
    ref,
  ) => {
    const initialEmbedUrl = useMemo(() => normalizeToEmbedUrl(initialUrl), [initialUrl]);
    const initialCleanUrl = useMemo(() => stripTenshiEmbedParam(initialEmbedUrl), [initialEmbedUrl]);

    const [iframeSrc, setIframeSrc] = useState<string>(initialEmbedUrl);
    const iframeSrcRef = useRef<string>(iframeSrc);
    iframeSrcRef.current = iframeSrc;

    const [currentCleanUrl, setCurrentCleanUrl] = useState<string>(initialCleanUrl);
    const currentCleanUrlRef = useRef<string>(currentCleanUrl);
    currentCleanUrlRef.current = currentCleanUrl;

    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [hasLoadedOnce, setHasLoadedOnce] = useState<boolean>(false);
    const iframeLoadedRef = useRef<boolean>(false);
    const iframeRef = useRef<HTMLIFrameElement | null>(null);
    const isVisibleRef = useRef<boolean>(isVisible);
    isVisibleRef.current = isVisible;

    const onUrlChangeRef = useRef(onUrlChange);
    onUrlChangeRef.current = onUrlChange;

    // Popover selector de destinos WAPPY
    const [isPickerOpen, setIsPickerOpen] = useState<boolean>(false);
    const [destinationSearch, setDestinationSearch] = useState<string>('');
    const pickerTriggerRef = useRef<HTMLButtonElement | null>(null);
    const pickerPopoverRef = useRef<HTMLDivElement | null>(null);
    const searchInputRef = useRef<HTMLInputElement | null>(null);
    const [pickerCoords, setPickerCoords] = useState<{
      left: number;
      top: number;
      width: number;
      maxHeight: number;
    } | null>(null);

    const currentTitle = useMemo(() => {
      const { pathname, search } = splitCleanUrlParts(currentCleanUrl);
      return formatWappyBrowserTitle(pathname, search);
    }, [currentCleanUrl]);

    const applyUrlSync = useCallback((nextCleanUrl: string) => {
      const sanitized = stripTenshiEmbedParam(nextCleanUrl);
      if (sanitized !== currentCleanUrlRef.current) {
        currentCleanUrlRef.current = sanitized;
        setCurrentCleanUrl(sanitized);
      }
      const { pathname, search } = splitCleanUrlParts(sanitized);
      const titleInfo = formatWappyBrowserTitle(pathname, search);
      onUrlChangeRef.current?.(sanitized, titleInfo);
    }, []);

    const syncFromIframeLocation = useCallback(() => {
      const iframe = iframeRef.current;
      if (!iframe) return;
      try {
        const win = iframe.contentWindow;
        if (!win || !win.location) return;
        const href = win.location.href;
        if (!href || href === 'about:blank') return;
        const raw = `${win.location.pathname || '/'}${win.location.search || ''}${win.location.hash || ''}`;
        const clean = stripTenshiEmbedParam(raw);
        if (clean !== currentCleanUrlRef.current) {
          applyUrlSync(clean);
        }
      } catch {
        // Ignorar errores transitorios si el iframe está recargando
      }
    }, [applyUrlSync]);

    // Registrar o liberar el iframe en TenshiPageController según visibilidad
    useEffect(() => {
      if (isVisible && iframeRef.current) {
        setTenshiEmbeddedBrowserFrame(iframeRef.current);
      } else {
        setTenshiEmbeddedBrowserFrame(null);
      }
      return () => {
        setTenshiEmbeddedBrowserFrame(null);
      };
    }, [isVisible]);

    // Sincronización periódica ligera de URL SOLO cuando la pestaña Wappy es visible
    useEffect(() => {
      if (!isVisible) return;
      syncFromIframeLocation();
      const interval = window.setInterval(syncFromIframeLocation, 800);
      return () => window.clearInterval(interval);
    }, [isVisible, syncFromIframeLocation]);

    // Si se cierra visibilidad, cerrar el popover selector de destinos
    useEffect(() => {
      if (!isVisible) {
        setIsPickerOpen(false);
      }
    }, [isVisible]);

    // Notificar título inicial al padre al montar
    useEffect(() => {
      const { pathname, search } = splitCleanUrlParts(currentCleanUrlRef.current);
      const titleInfo = formatWappyBrowserTitle(pathname, search);
      onUrlChangeRef.current?.(currentCleanUrlRef.current, titleInfo);
    }, []);

    const dispatchToFrame = useCallback((eventName: string, detail?: unknown): boolean => {
      try {
        const win = iframeRef.current?.contentWindow;
        if (!win) return false;
        const CustomEventCtor = ((win as any).CustomEvent || CustomEvent) as typeof CustomEvent;
        win.dispatchEvent(
          new CustomEventCtor(eventName, detail !== undefined ? { detail } : undefined),
        );
        return true;
      } catch {
        return false;
      }
    }, []);

    const navigateTo = useCallback(
      (rawRoute: string, explicitSgsstModule?: string) => {
        const embedUrl = normalizeToEmbedUrl(rawRoute);
        const cleanUrl = stripTenshiEmbedParam(embedUrl);
        applyUrlSync(cleanUrl);

        const iframe = iframeRef.current;
        if (iframe && iframeLoadedRef.current) {
          try {
            const win = iframe.contentWindow;
            if (win && win.location) {
              const currentPath = (win.location.pathname || '').replace(/\/+$/, '') || '/';
              const { pathname: targetPathRaw, search: targetSearch } = splitCleanUrlParts(cleanUrl);
              const targetPath = targetPathRaw.replace(/\/+$/, '') || '/';
              const targetParams = new URLSearchParams(targetSearch);
              const resolvedModule = (explicitSgsstModule || targetParams.get('module') || '').trim();

              // Navegación instantánea sin recargar documento cuando ya estamos en Somos SST (/sgsst)
              if (currentPath === '/sgsst' && targetPath === '/sgsst' && resolvedModule) {
                const dispatched = dispatchToFrame('navigate-sgsst', { module: resolvedModule });
                if (dispatched) {
                  setIsLoading(false);
                  return;
                }
              }

              setIsLoading(true);
              if (embedUrl === iframeSrcRef.current) {
                win.location.assign(embedUrl);
              } else {
                iframeSrcRef.current = embedUrl;
                setIframeSrc(embedUrl);
              }
              return;
            }
          } catch {
            // Fallback por atributo src
          }
        }

        setIsLoading(true);
        iframeSrcRef.current = embedUrl;
        setIframeSrc(embedUrl);
      },
      [applyUrlSync, dispatchToFrame],
    );

    const handleReload = useCallback(() => {
      setIsLoading(true);
      const iframe = iframeRef.current;
      try {
        if (iframe?.contentWindow) {
          iframe.contentWindow.location.reload();
          return;
        }
      } catch {
        // Fallback reasignando src
      }
      if (iframe) {
        iframe.src = iframeSrcRef.current;
      }
    }, []);

    const handleBack = useCallback(() => {
      try {
        iframeRef.current?.contentWindow?.history.back();
        window.setTimeout(syncFromIframeLocation, 220);
      } catch {
        // ignore history error
      }
    }, [syncFromIframeLocation]);

    const handleForward = useCallback(() => {
      try {
        iframeRef.current?.contentWindow?.history.forward();
        window.setTimeout(syncFromIframeLocation, 220);
      } catch {
        // ignore history error
      }
    }, [syncFromIframeLocation]);

    useImperativeHandle(
      ref,
      () => ({
        navigateTo,
        reload: handleReload,
        getContentWindow: () => {
          try {
            return iframeRef.current?.contentWindow || null;
          } catch {
            return null;
          }
        },
        getCurrentUrl: () => currentCleanUrlRef.current,
        dispatchToFrame,
      }),
      [navigateTo, handleReload, dispatchToFrame],
    );

    const handleIframeLoad = useCallback(() => {
      iframeLoadedRef.current = true;
      setHasLoadedOnce(true);
      setIsLoading(false);
      if (isVisibleRef.current && iframeRef.current) {
        setTenshiEmbeddedBrowserFrame(iframeRef.current);
      }
      syncFromIframeLocation();
    }, [syncFromIframeLocation]);

    // Posicionamiento del popover de destinos (viewport-safe)
    const updatePickerPosition = useCallback(() => {
      if (!isPickerOpen) {
        setPickerCoords(null);
        return;
      }
      const trigger = pickerTriggerRef.current;
      if (!trigger || typeof window === 'undefined') {
        setPickerCoords(null);
        return;
      }
      const rect = trigger.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) {
        setIsPickerOpen(false);
        setPickerCoords(null);
        return;
      }
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const margin = 8;
      const width = Math.min(348, Math.max(260, vw - margin * 2));
      const left = Math.max(margin, Math.min(rect.left, vw - width - margin));
      const top = Math.min(vh - 220, rect.bottom + 6);
      const maxHeight = Math.max(200, Math.min(440, vh - top - 12));
      setPickerCoords({ left, top, width, maxHeight });
    }, [isPickerOpen]);

    useEffect(() => {
      updatePickerPosition();
      if (!isPickerOpen) return;
      window.addEventListener('resize', updatePickerPosition);
      window.addEventListener('scroll', updatePickerPosition, true);
      const focusTimer = window.setTimeout(() => {
        searchInputRef.current?.focus();
      }, 40);
      return () => {
        window.removeEventListener('resize', updatePickerPosition);
        window.removeEventListener('scroll', updatePickerPosition, true);
        window.clearTimeout(focusTimer);
      };
    }, [isPickerOpen, updatePickerPosition]);

    // Cierre mutuo con otros popovers de Tenshi
    useEffect(() => {
      const handleOtherPopover = (e: Event) => {
        const source = (e as CustomEvent)?.detail?.source;
        if (source !== 'wappy-browser-picker') {
          setIsPickerOpen(false);
        }
      };
      window.addEventListener(TENSHI_POPOVER_EVENT, handleOtherPopover);
      return () => window.removeEventListener(TENSHI_POPOVER_EVENT, handleOtherPopover);
    }, []);

    // Cierre al hacer clic fuera o Escape
    useEffect(() => {
      if (!isPickerOpen) return;
      const handlePointerDown = (e: MouseEvent | TouchEvent) => {
        const target = e.target as Node | null;
        if (!target) return;
        if (pickerPopoverRef.current?.contains(target)) return;
        if (pickerTriggerRef.current?.contains(target)) return;
        setIsPickerOpen(false);
      };
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.stopPropagation();
          setIsPickerOpen(false);
        }
      };
      document.addEventListener('mousedown', handlePointerDown);
      document.addEventListener('touchstart', handlePointerDown);
      document.addEventListener('keydown', handleKeyDown, true);
      return () => {
        document.removeEventListener('mousedown', handlePointerDown);
        document.removeEventListener('touchstart', handlePointerDown);
        document.removeEventListener('keydown', handleKeyDown, true);
      };
    }, [isPickerOpen]);

    const filteredGroups = useMemo(() => {
      const q = normalizeSearchText(destinationSearch);
      if (!q) return WAPPY_BROWSER_DESTINATIONS;
      return WAPPY_BROWSER_DESTINATIONS.map((group) => ({
        ...group,
        items: group.items.filter((item) => {
          const haystack = normalizeSearchText(
            `${item.label} ${item.subtitle} ${item.route} ${item.keywords}`,
          );
          return haystack.includes(q);
        }),
      })).filter((group) => group.items.length > 0);
    }, [destinationSearch]);

    const handleSelectDestination = (route: string, sgsstModule?: string) => {
      setIsPickerOpen(false);
      setDestinationSearch('');
      navigateTo(route, sgsstModule);
    };

    const togglePicker = () => {
      setIsPickerOpen((prev) => {
        const next = !prev;
        if (next) {
          announceTenshiPopoverOpen('wappy-browser-picker');
        }
        return next;
      });
    };

    return (
      <div className="flex h-full min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden bg-surface-primary dark:bg-zinc-950 text-text-primary">
        {/* Micro-barra de navegación superior ultra-compacta */}
        <div className="flex shrink-0 items-center gap-1 sm:gap-1.5 border-b border-slate-200/75 dark:border-zinc-800/85 bg-slate-50/95 dark:bg-zinc-900/95 backdrop-blur-md px-1.5 sm:px-2.5 py-1.5 min-w-0 max-w-full">
          {/* Izquierda: Atrás, Adelante y Recargar */}
          <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
            <button
              type="button"
              onClick={handleBack}
              title="Atrás en el navegador WAPPY"
              aria-label="Atrás"
              className="inline-flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-xl border border-slate-300/60 dark:border-zinc-700 bg-slate-500/10 dark:bg-zinc-800/80 text-slate-700 dark:text-zinc-300 hover:bg-slate-500/20 transition-all active:scale-95 cursor-pointer"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={handleForward}
              title="Adelante en el navegador WAPPY"
              aria-label="Adelante"
              className="inline-flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-xl border border-slate-300/60 dark:border-zinc-700 bg-slate-500/10 dark:bg-zinc-800/80 text-slate-700 dark:text-zinc-300 hover:bg-slate-500/20 transition-all active:scale-95 cursor-pointer"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={handleReload}
              title="Recargar página actual"
              aria-label="Recargar"
              className="inline-flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-500/20 transition-all active:scale-95 cursor-pointer"
            >
              <RefreshCw className={cn('h-3.5 w-3.5', isLoading && 'animate-spin')} />
            </button>
          </div>

          {/* Centro: Selector de Destinos WAPPY */}
          <button
            ref={pickerTriggerRef}
            type="button"
            aria-haspopup="dialog"
            aria-expanded={isPickerOpen}
            onClick={togglePicker}
            title={`Destino actual: ${currentTitle.fullTitle} (${currentCleanUrl}) · Clic para saltar a otro módulo`}
            className={cn(
              'flex h-8 sm:h-9 min-w-0 flex-1 items-center justify-between gap-1.5 rounded-xl border px-2 sm:px-2.5 text-left transition-all active:scale-[0.99] cursor-pointer',
              isPickerOpen
                ? 'border-sky-500/50 bg-sky-500/20 text-sky-800 dark:text-sky-200 ring-1 ring-sky-500/30'
                : 'border-sky-500/30 bg-sky-500/10 text-sky-800 dark:text-sky-200 hover:bg-sky-500/15',
            )}
          >
            <div className="flex min-w-0 items-center gap-1.5">
              <Globe className="h-3.5 w-3.5 shrink-0 text-sky-600 dark:text-sky-400" />
              <span className="truncate text-[11px] sm:text-xs font-bold leading-none">
                {currentTitle.fullTitle}
              </span>
            </div>
            <ChevronDown
              className={cn(
                'h-3.5 w-3.5 shrink-0 text-sky-600/80 dark:text-sky-400/80 transition-transform duration-200',
                isPickerOpen && 'rotate-180',
              )}
            />
          </button>

          {/* Derecha: Pantalla completa (Grupo 12), Abrir fuera (Grupo 5), Volver a Chat (Grupo 14) */}
          <div className="flex shrink-0 items-center gap-1">
            <ExpandableButton
              type="button"
              variant="orange"
              size="sm"
              icon={
                isFullscreen ? (
                  <Minimize2 className="h-3.5 w-3.5" />
                ) : (
                  <Maximize2 className="h-3.5 w-3.5" />
                )
              }
              label={isFullscreen ? 'Restaurar' : 'Pantalla completa'}
              title={
                isFullscreen
                  ? 'Restaurar vista dividida con Tenshi (Esc)'
                  : 'Expandir navegador a pantalla completa'
              }
              onClick={onToggleFullscreen}
            />
            <ExpandableButton
              type="button"
              variant="cyan"
              size="sm"
              icon={<ExternalLink className="h-3.5 w-3.5" />}
              label="Abrir fuera"
              title="Salir de Tenshi y abrir esta vista en WAPPY normal"
              onClick={() => onOpenOutside(currentCleanUrlRef.current)}
            />
            <ExpandableButton
              type="button"
              variant="neutral"
              size="sm"
              icon={<ArrowLeft className="h-3.5 w-3.5" />}
              label="Volver a Chat"
              title="Volver al chat con Tenshi"
              onClick={onBackToChat}
            />
          </div>
        </div>

        {/* Cuerpo del iframe same-origin persistente */}
        <div className="relative flex-1 min-h-0 w-full overflow-hidden bg-surface-primary dark:bg-zinc-950">
          {isLoading && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 z-20 h-0.5 overflow-hidden bg-teal-500/15"
            >
              <div className="h-full w-1/2 animate-pulse bg-gradient-to-r from-teal-500 via-emerald-400 to-sky-500" />
            </div>
          )}

          {!hasLoadedOnce && isLoading && (
            <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-2.5 bg-surface-primary/90 dark:bg-zinc-950/90 backdrop-blur-xs p-4 text-center">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
              <p className="text-xs font-extrabold text-text-primary">
                Cargando {currentTitle.shortLabel}...
              </p>
              <p className="max-w-xs text-[11px] font-medium text-text-secondary">
                Conectando vista integrada de WAPPY sin salir de Tenshi
              </p>
            </div>
          )}

          <iframe
            ref={iframeRef}
            name={TENSHI_BROWSER_FRAME_NAME}
            src={iframeSrc}
            title={currentTitle.fullTitle}
            onLoad={handleIframeLoad}
            className="block h-full w-full border-0 bg-surface-primary"
            allow="clipboard-read; clipboard-write; microphone; camera"
          />
        </div>

        {/* Popover Glassmorphism de Destinos WAPPY (en portal por encima de fullscreen) */}
        {isPickerOpen &&
          pickerCoords &&
          typeof document !== 'undefined' &&
          createPortal(
            <div
              ref={pickerPopoverRef}
              role="dialog"
              aria-label="Seleccionar módulo o destino de WAPPY"
              onClick={(e) => e.stopPropagation()}
              onTouchEnd={(e) => e.stopPropagation()}
              style={{
                position: 'fixed',
                left: `${pickerCoords.left}px`,
                top: `${pickerCoords.top}px`,
                width: `${pickerCoords.width}px`,
                maxWidth: 'calc(100vw - 16px)',
                maxHeight: `${pickerCoords.maxHeight}px`,
                zIndex: 2147483647,
              }}
              className={cn(
                'flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 dark:border-zinc-700/80',
                'bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl shadow-2xl shadow-black/25',
                'animate-in fade-in-0 zoom-in-95 duration-150',
              )}
            >
              {/* Buscador rápido */}
              <div className="shrink-0 border-b border-slate-200/70 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-900/80 p-2.5">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={destinationSearch}
                    onChange={(e) => setDestinationSearch(e.target.value)}
                    placeholder="Buscar módulo (GTC 45, 0312, Academia, Tareas...)"
                    className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/90 py-1.5 pl-8 pr-7 text-xs text-slate-800 dark:text-zinc-100 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none"
                  />
                  {destinationSearch && (
                    <button
                      type="button"
                      onClick={() => setDestinationSearch('')}
                      aria-label="Limpiar búsqueda"
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 cursor-pointer"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Lista agrupada con scroll interno */}
              <div className="min-h-0 flex-1 overflow-y-auto p-2 space-y-2.5">
                {filteredGroups.length === 0 ? (
                  <p className="py-6 text-center text-xs text-slate-400 dark:text-zinc-500">
                    No se encontraron módulos para “{destinationSearch}”.
                  </p>
                ) : (
                  filteredGroups.map((group) => (
                    <div key={group.id}>
                      <p className="mb-1 px-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                        {group.title}
                      </p>
                      <div className="space-y-0.5">
                        {group.items.map((dest) => {
                          const isCurrent =
                            stripTenshiEmbedParam(dest.route) ===
                            stripTenshiEmbedParam(currentCleanUrl);
                          return (
                            <button
                              key={dest.id}
                              type="button"
                              onClick={() =>
                                handleSelectDestination(dest.route, dest.sgsstModule)
                              }
                              className={cn(
                                'flex w-full items-center justify-between gap-2 rounded-xl border px-2.5 py-1.5 text-left transition-all cursor-pointer',
                                isCurrent
                                  ? 'border-teal-500/40 bg-teal-500/15 text-teal-800 dark:text-teal-200'
                                  : 'border-transparent text-slate-700 dark:text-zinc-200 hover:border-slate-200/70 dark:hover:border-zinc-700/70 hover:bg-slate-100/80 dark:hover:bg-zinc-800/80',
                              )}
                            >
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-bold leading-tight">
                                  {dest.label}
                                </p>
                                <p className="truncate text-[10px] text-slate-500 dark:text-zinc-400 leading-tight mt-0.5">
                                  {dest.subtitle}
                                </p>
                              </div>
                              {isCurrent && (
                                <Check className="h-3.5 w-3.5 shrink-0 text-teal-600 dark:text-teal-400" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>,
            document.body,
          )}
      </div>
    );
  },
);

TenshiWappyBrowser.displayName = 'TenshiWappyBrowser';

export default TenshiWappyBrowser;
