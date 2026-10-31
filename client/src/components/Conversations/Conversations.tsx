import { useState, useEffect, useMemo, memo, type FC, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import throttle from 'lodash/throttle';
import {
  Pin,
  FolderArchive,
  ChevronDown,
  Sparkles,
  Archive,
  Check,
  X,
  ShieldCheck,
} from 'lucide-react';
import { Spinner, useMediaQuery, useToastContext } from '@librechat/client';
import { List, AutoSizer, CellMeasurer, CellMeasurerCache } from 'react-virtualized';
import { TConversation, QueryKeys, request } from 'librechat-data-provider';
import { useLocalize, TranslationKeys } from '~/hooks';
import {
  getPinnedConvoIds,
  partitionConversationsForSidebar,
  togglePinnedConvoLocal,
  updateConvoInAllQueries,
} from '~/utils';
import Convo from './Convo';

interface ConversationsProps {
  conversations: Array<TConversation | null>;
  moveToTop: () => void;
  toggleNav: () => void;
  containerRef: React.RefObject<HTMLDivElement | List>;
  loadMoreConversations: () => void;
  isLoading: boolean;
  isSearchLoading: boolean;
  isCollapsed?: boolean;
  headerContent?: React.ReactNode;
}

const LoadingSpinner = memo(() => {
  const localize = useLocalize();

  return (
    <div className="mx-auto mt-2 flex items-center justify-center gap-2">
      <Spinner className="text-text-primary" />
      <span className="animate-pulse text-text-primary">{localize('com_ui_loading')}</span>
    </div>
  );
});

LoadingSpinner.displayName = 'LoadingSpinner';

const DateLabel: FC<{ groupName: string }> = memo(({ groupName }) => {
  const localize = useLocalize();
  return (
    <div className="mt-2 pl-2 pt-1 text-text-secondary" style={{ fontSize: '0.7rem' }}>
      {localize(groupName as TranslationKeys) || groupName}
    </div>
  );
});

DateLabel.displayName = 'DateLabel';

const PinnedHeader: FC<{ count: number }> = memo(({ count }) => (
  <div className="mt-2 mb-0.5 flex items-center justify-between px-2 pt-1">
    <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#0D9488] dark:text-teal-400">
      <Pin className="size-3 rotate-45 text-[#0D9488] dark:text-teal-400" />
      <span>Anclados</span>
    </div>
    <span className="rounded-full bg-teal-500/15 px-1.5 py-0.5 text-[10px] font-bold text-[#0D9488] dark:text-teal-300">
      {count}
    </span>
  </div>
));

PinnedHeader.displayName = 'PinnedHeader';

const InactiveAccordionRow: FC<{
  count: number;
  isExpanded: boolean;
  onToggle: () => void;
  onOpenOrganize: () => void;
}> = memo(({ count, isExpanded, onToggle, onOpenOrganize }) => (
  <div className="my-1.5 mx-1 overflow-hidden rounded-xl border border-teal-500/25 bg-teal-500/[0.06] p-1.5 transition-all dark:border-teal-500/20 dark:bg-teal-500/[0.08]">
    <div className="flex items-center justify-between gap-1">
      <button
        type="button"
        onClick={onToggle}
        className="flex min-w-0 flex-1 items-center gap-1.5 rounded-lg px-1.5 py-1 text-left transition-colors hover:bg-teal-500/10"
        aria-expanded={isExpanded}
      >
        <FolderArchive className="size-3.5 shrink-0 text-[#0D9488] dark:text-teal-400" />
        <span className="truncate text-[11px] font-semibold text-text-primary">
          Inactivos (+3 días)
        </span>
        <span className="shrink-0 rounded-full bg-teal-500/15 px-1.5 py-0.2 text-[10px] font-bold text-[#0D9488] dark:text-teal-300">
          {count}
        </span>
        <ChevronDown
          className={`size-3.5 shrink-0 text-text-secondary transition-transform duration-200 ${
            isExpanded ? 'rotate-180 text-[#0D9488] dark:text-teal-400' : ''
          }`}
        />
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onOpenOrganize();
        }}
        title="Unir en Compendio con IA o Archivar inactivos (+3 días)"
        className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-[#0D9488] px-2 py-1 text-[10px] font-bold text-white shadow-sm transition-all hover:bg-teal-700 active:scale-95"
      >
        <span>✨ Unir / Organizar</span>
      </button>
    </div>
  </div>
));

InactiveAccordionRow.displayName = 'InactiveAccordionRow';

type FlattenedItem =
  | { type: 'header'; groupName: string }
  | { type: 'pinned_header'; count: number }
  | { type: 'inactive_accordion'; count: number; isExpanded: boolean }
  | { type: 'convo'; convo: TConversation }
  | { type: 'loading' }
  | { type: 'custom_header' };

const MemoizedConvo = memo(
  ({
    conversation,
    retainView,
    toggleNav,
  }: {
    conversation: TConversation;
    retainView: () => void;
    toggleNav: () => void;
  }) => {
    return <Convo conversation={conversation} retainView={retainView} toggleNav={toggleNav} />;
  },
  (prevProps, nextProps) => {
    return (
      prevProps.conversation.conversationId === nextProps.conversation.conversationId &&
      prevProps.conversation.title === nextProps.conversation.title &&
      prevProps.conversation.endpoint === nextProps.conversation.endpoint &&
      prevProps.conversation.tags === nextProps.conversation.tags
    );
  },
);

const Conversations: FC<ConversationsProps> = ({
  conversations: rawConversations,
  moveToTop,
  toggleNav,
  containerRef,
  loadMoreConversations,
  isLoading,
  isSearchLoading,
  isCollapsed,
  headerContent,
}) => {
  const localize = useLocalize();
  const navigate = useNavigate();
  const params = useParams();
  const queryClient = useQueryClient();
  const { showToast } = useToastContext();
  const isSmallScreen = useMediaQuery('(max-width: 768px)');
  const convoHeight = isSmallScreen ? 44 : 34;

  const [pinnedIds, setPinnedIds] = useState<Set<string>>(() => getPinnedConvoIds());
  const [isInactiveExpanded, setIsInactiveExpanded] = useState(false);
  const [isOrganizeModalOpen, setIsOrganizeModalOpen] = useState(false);
  const [selectedDays, setSelectedDays] = useState<3 | 7 | 15>(3);
  const [selectedConvoIds, setSelectedConvoIds] = useState<Set<string>>(new Set());
  const [isConsolidating, setIsConsolidating] = useState<
    'merge_and_archive' | 'archive_only' | null
  >(null);

  useEffect(() => {
    const refreshPinned = () => {
      setPinnedIds(new Set(getPinnedConvoIds()));
    };
    window.addEventListener('wappy-pinned-updated', refreshPinned);
    window.addEventListener('storage', refreshPinned);
    return () => {
      window.removeEventListener('wappy-pinned-updated', refreshPinned);
      window.removeEventListener('storage', refreshPinned);
    };
  }, []);

  const filteredConversations = useMemo(
    () =>
      (Array.isArray(rawConversations) ? rawConversations : []).filter(
        (c): c is TConversation =>
          c != null &&
          !(c.endpoint && typeof c.endpoint === 'string' && c.endpoint.startsWith('sgsst-')),
      ),
    [rawConversations],
  );

  const { pinnedConvos, recentGroups, inactiveGroups, inactiveConvos } = useMemo(
    () => partitionConversationsForSidebar(filteredConversations, pinnedIds, 3),
    [filteredConversations, pinnedIds],
  );

  const { inactiveConvos: modalCandidateConvos } = useMemo(
    () => partitionConversationsForSidebar(filteredConversations, pinnedIds, selectedDays),
    [filteredConversations, pinnedIds, selectedDays],
  );

  useEffect(() => {
    if (isOrganizeModalOpen) {
      setSelectedConvoIds(
        new Set(
          modalCandidateConvos
            .map((c) => c?.conversationId)
            .filter((id): id is string => Boolean(id)),
        ),
      );
    }
  }, [isOrganizeModalOpen, selectedDays, modalCandidateConvos]);

  const handleToggleInactive = useCallback(() => {
    setIsInactiveExpanded((prev) => !prev);
  }, []);

  const handleOpenOrganizeModal = useCallback(() => {
    setSelectedDays(3);
    setIsOrganizeModalOpen(true);
  }, []);

  const handleToggleCandidateConvo = useCallback((convoId: string) => {
    setSelectedConvoIds((prev) => {
      const next = new Set(prev);
      if (next.has(convoId)) {
        next.delete(convoId);
      } else {
        next.add(convoId);
      }
      return next;
    });
  }, []);

  const handleQuickPinFromModal = useCallback(
    async (convo: TConversation) => {
      const convoId = convo.conversationId;
      if (!convoId) {
        return;
      }
      togglePinnedConvoLocal(convoId, true);
      updateConvoInAllQueries(queryClient, convoId, (c) => ({
        ...c,
        tags: Array.from(new Set([...(Array.isArray(c.tags) ? c.tags : []), 'pinned'])),
      }));
      showToast({
        message: '📌 Chat anclado y protegido',
        status: 'success',
      });
      try {
        await request.post('/api/convos/pin', {
          conversationId: convoId,
          isPinned: true,
        });
      } catch {
        // Optimistic pin already applied
      }
    },
    [queryClient, showToast],
  );

  const handleConsolidate = useCallback(
    async (mode: 'merge_and_archive' | 'archive_only') => {
      const conversationIds = Array.from(selectedConvoIds);
      if (conversationIds.length === 0) {
        showToast({
          message: 'Selecciona al menos una conversación para organizar.',
          status: 'warning',
        });
        return;
      }

      setIsConsolidating(mode);
      try {
        const res: any = await request.post('/api/convos/consolidate-inactive', {
          days: selectedDays,
          mode,
          conversationIds,
        });
        await queryClient.invalidateQueries([QueryKeys.allConversations]);
        await queryClient.invalidateQueries([QueryKeys.archivedConversations]);
        setIsOrganizeModalOpen(false);
        setIsInactiveExpanded(false);

        if (mode === 'merge_and_archive') {
          showToast({
            message:
              res?.message ||
              `✨ ${conversationIds.length} chats unidos en un Compendio Maestro y archivados.`,
            status: 'success',
          });
          const masterId = res?.masterConversation?.conversationId;
          if (masterId) {
            navigate(`/c/${masterId}`);
          }
        } else {
          showToast({
            message:
              res?.message ||
              `📦 ${conversationIds.length} chats inactivos movidos a Archivados.`,
            status: 'success',
          });
          if (params.conversationId && selectedConvoIds.has(params.conversationId)) {
            navigate('/c/new');
          }
        }
      } catch (error: any) {
        showToast({
          message:
            error?.response?.data?.error ||
            error?.message ||
            'Error al organizar las conversaciones inactivas.',
          status: 'error',
        });
      } finally {
        setIsConsolidating(null);
      }
    },
    [selectedConvoIds, selectedDays, queryClient, showToast, navigate, params.conversationId],
  );

  const flattenedItems = useMemo(() => {
    const items: FlattenedItem[] = [];
    if (headerContent) {
      items.push({ type: 'custom_header' });
    }
    if (pinnedConvos.length > 0) {
      items.push({ type: 'pinned_header', count: pinnedConvos.length });
      items.push(...pinnedConvos.map((convo) => ({ type: 'convo' as const, convo })));
    }
    recentGroups.forEach(([groupName, convos]) => {
      items.push({ type: 'header', groupName });
      items.push(...convos.map((convo) => ({ type: 'convo' as const, convo })));
    });
    if (inactiveConvos.length > 0) {
      items.push({
        type: 'inactive_accordion',
        count: inactiveConvos.length,
        isExpanded: isInactiveExpanded,
      });
      if (isInactiveExpanded) {
        inactiveGroups.forEach(([groupName, convos]) => {
          items.push({ type: 'header', groupName });
          items.push(...convos.map((convo) => ({ type: 'convo' as const, convo })));
        });
      }
    }

    if (isLoading) {
      items.push({ type: 'loading' } as any);
    }
    return items;
  }, [
    headerContent,
    pinnedConvos,
    recentGroups,
    inactiveConvos.length,
    isInactiveExpanded,
    inactiveGroups,
    isLoading,
  ]);

  const cache = useMemo(
    () =>
      new CellMeasurerCache({
        fixedWidth: true,
        defaultHeight: convoHeight,
        keyMapper: (index) => {
          const item = flattenedItems[index];
          if (!item) {
            return `empty-${index}`;
          }
          if (item.type === 'pinned_header') {
            return `pinned-header-${item.count}`;
          }
          if (item.type === 'inactive_accordion') {
            return `inactive-accordion-${item.count}-${item.isExpanded}`;
          }
          if (item.type === 'header') {
            return `header-${item.groupName}-${index}`;
          }
          if (item.type === 'convo') {
            return `convo-${item.convo.conversationId}`;
          }
          if (item.type === 'loading') {
            return `loading-${index}`;
          }
          if (item.type === 'custom_header') {
            return 'custom_header';
          }
          return `unknown-${index}`;
        },
      }),
    [flattenedItems, convoHeight],
  );

  useEffect(() => {
    cache.clearAll();
    const listInstance = containerRef?.current as any;
    if (listInstance && typeof listInstance.recomputeRowHeights === 'function') {
      listInstance.recomputeRowHeights();
    }
  }, [cache, isInactiveExpanded, flattenedItems, containerRef]);

  const rowRenderer = useCallback(
    ({ index, key, parent, style }) => {
      const item = flattenedItems[index];
      if (!item) {
        return null;
      }
      if (item.type === 'loading') {
        return (
          <CellMeasurer cache={cache} columnIndex={0} key={key} parent={parent} rowIndex={index}>
            {({ registerChild }) => (
              <div ref={registerChild} style={style}>
                <LoadingSpinner />
              </div>
            )}
          </CellMeasurer>
        );
      }
      let rendering: JSX.Element | null = null;
      if (item.type === 'pinned_header') {
        rendering = <PinnedHeader count={item.count} />;
      } else if (item.type === 'inactive_accordion') {
        rendering = (
          <InactiveAccordionRow
            count={item.count}
            isExpanded={item.isExpanded}
            onToggle={handleToggleInactive}
            onOpenOrganize={handleOpenOrganizeModal}
          />
        );
      } else if (item.type === 'header') {
        rendering = <DateLabel groupName={item.groupName} />;
      } else if (item.type === 'convo') {
        rendering = (
          <MemoizedConvo conversation={item.convo} retainView={moveToTop} toggleNav={toggleNav} />
        );
      } else if (item.type === 'custom_header') {
        rendering = <>{headerContent}</>;
      }
      return (
        <CellMeasurer cache={cache} columnIndex={0} key={key} parent={parent} rowIndex={index}>
          {({ registerChild }) => (
            <div ref={registerChild} style={style}>
              {rendering}
            </div>
          )}
        </CellMeasurer>
      );
    },
    [
      cache,
      flattenedItems,
      moveToTop,
      toggleNav,
      headerContent,
      handleToggleInactive,
      handleOpenOrganizeModal,
    ],
  );

  const getRowHeight = useCallback(
    ({ index }: { index: number }) => cache.getHeight(index, 0),
    [cache],
  );

  const throttledLoadMore = useMemo(
    () => throttle(loadMoreConversations, 300),
    [loadMoreConversations],
  );

  const handleRowsRendered = useCallback(
    ({ stopIndex }: { stopIndex: number }) => {
      if (stopIndex >= flattenedItems.length - 8) {
        throttledLoadMore();
      }
    },
    [flattenedItems.length, throttledLoadMore],
  );

  return (
    <div className="relative flex h-full flex-col pb-2 text-sm text-text-primary">
      {isSearchLoading ? (
        <div className="flex flex-1 items-center justify-center">
          <Spinner className="text-text-primary" />
          <span className="ml-2 text-text-primary">{localize('com_ui_loading')}</span>
        </div>
      ) : (
        <div className="flex-1">
          <AutoSizer>
            {({ width, height }) => (
              <List
                ref={containerRef as React.RefObject<List>}
                width={width}
                height={height}
                deferredMeasurementCache={cache}
                rowCount={flattenedItems.length}
                rowHeight={getRowHeight}
                rowRenderer={rowRenderer}
                overscanRowCount={10}
                className="outline-none"
                style={{ outline: 'none' }}
                aria-label="Conversations"
                onRowsRendered={handleRowsRendered}
                tabIndex={-1}
              />
            )}
          </AutoSizer>
        </div>
      )}

      {isOrganizeModalOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            onClick={() => !isConsolidating && setIsOrganizeModalOpen(false)}
          >
            <div
              className="relative flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-teal-500/30 bg-surface-primary text-text-primary shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3 border-b border-border-light bg-gradient-to-r from-teal-500/10 via-teal-500/5 to-transparent px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#0D9488] text-white shadow-md">
                    <Sparkles className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-text-primary">
                      ✨ Unir y Organizar Chats Inactivos
                    </h3>
                    <p className="text-xs text-text-secondary">
                      Limpia tu barra lateral sin perder ningún contexto ni hallazgo.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={Boolean(isConsolidating)}
                  onClick={() => setIsOrganizeModalOpen(false)}
                  className="rounded-lg p-1.5 text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary disabled:opacity-50"
                  aria-label="Cerrar modal"
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
                {/* Protection notice */}
                <div className="flex items-center gap-2.5 rounded-xl border border-teal-500/25 bg-teal-500/10 px-3.5 py-2.5 text-xs text-teal-800 dark:text-teal-200">
                  <ShieldCheck className="size-4 shrink-0 text-[#0D9488] dark:text-teal-400" />
                  <span>
                    Tienes <strong>{modalCandidateConvos.length} chats</strong> con más de{' '}
                    <strong>{selectedDays} días</strong> sin abrirse. Tus chats{' '}
                    <strong>Anclados 📌 ({pinnedConvos.length}) están protegidos</strong> y no se
                    tocan.
                  </span>
                </div>

                {/* Days threshold selector */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-text-secondary">
                    Antigüedad de inactividad:
                  </span>
                  <div className="flex items-center gap-1.5">
                    {([3, 7, 15] as const).map((d) => (
                      <button
                        key={d}
                        type="button"
                        disabled={Boolean(isConsolidating)}
                        onClick={() => setSelectedDays(d)}
                        className={`rounded-lg px-3 py-1 text-xs font-bold transition-all ${
                          selectedDays === d
                            ? 'bg-[#0D9488] text-white shadow-sm'
                            : 'border border-border-medium bg-surface-secondary text-text-secondary hover:text-text-primary'
                        }`}
                      >
                        +{d} días
                      </button>
                    ))}
                  </div>
                </div>

                {/* Candidate conversations list */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-text-secondary">
                      Chats seleccionados ({selectedConvoIds.size} de {modalCandidateConvos.length})
                    </span>
                    {modalCandidateConvos.length > 0 && (
                      <button
                        type="button"
                        disabled={Boolean(isConsolidating)}
                        onClick={() => {
                          if (selectedConvoIds.size === modalCandidateConvos.length) {
                            setSelectedConvoIds(new Set());
                          } else {
                            setSelectedConvoIds(
                              new Set(
                                modalCandidateConvos
                                  .map((c) => c.conversationId)
                                  .filter((id): id is string => Boolean(id)),
                              ),
                            );
                          }
                        }}
                        className="font-semibold text-[#0D9488] hover:underline dark:text-teal-400"
                      >
                        {selectedConvoIds.size === modalCandidateConvos.length
                          ? 'Desmarcar todos'
                          : 'Seleccionar todos'}
                      </button>
                    )}
                  </div>

                  {modalCandidateConvos.length === 0 ? (
                    <div className="rounded-xl border border-border-light bg-surface-secondary/50 p-6 text-center text-xs text-text-secondary">
                      No hay conversaciones inactivas con más de {selectedDays} días.
                    </div>
                  ) : (
                    <div className="max-h-52 space-y-1.5 overflow-y-auto rounded-xl border border-border-light bg-surface-secondary/40 p-2">
                      {modalCandidateConvos.map((convo) => {
                        const id = convo.conversationId || '';
                        const isChecked = selectedConvoIds.has(id);
                        const dateStr = convo.updatedAt
                          ? new Date(convo.updatedAt).toLocaleDateString('es-CO', {
                              day: '2-digit',
                              month: 'short',
                            })
                          : '';
                        return (
                          <div
                            key={id}
                            onClick={() => !isConsolidating && handleToggleCandidateConvo(id)}
                            className={`flex cursor-pointer items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-xs transition-colors ${
                              isChecked
                                ? 'bg-teal-500/10 text-text-primary'
                                : 'bg-transparent text-text-secondary opacity-65 hover:bg-surface-hover'
                            }`}
                          >
                            <div className="flex min-w-0 flex-1 items-center gap-2.5">
                              <div
                                className={`flex size-4 shrink-0 items-center justify-center rounded border transition-colors ${
                                  isChecked
                                    ? 'border-[#0D9488] bg-[#0D9488] text-white'
                                    : 'border-border-heavy bg-transparent'
                                }`}
                              >
                                {isChecked && <Check className="size-3" />}
                              </div>
                              <span className="truncate font-medium">
                                {convo.title || localize('com_ui_untitled')}
                              </span>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                              {dateStr && (
                                <span className="text-[10px] text-text-secondary">{dateStr}</span>
                              )}
                              <button
                                type="button"
                                title="Anclar este chat para protegerlo"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleQuickPinFromModal(convo);
                                }}
                                className="rounded p-1 text-text-secondary transition-colors hover:bg-teal-500/15 hover:text-[#0D9488]"
                              >
                                <Pin className="size-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex flex-col gap-2 border-t border-border-light bg-surface-secondary/30 px-5 py-4">
                <button
                  type="button"
                  disabled={Boolean(isConsolidating) || selectedConvoIds.size === 0}
                  onClick={() => handleConsolidate('merge_and_archive')}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0D9488] px-4 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isConsolidating === 'merge_and_archive' ? (
                    <>
                      <Spinner className="size-4 text-white" />
                      <span>Uniendo y resumiendo con IA...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="size-4" />
                      <span>
                        ✨ Unir en 1 Compendio con IA y Archivar sueltos ({selectedConvoIds.size})
                      </span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  disabled={Boolean(isConsolidating) || selectedConvoIds.size === 0}
                  onClick={() => handleConsolidate('archive_only')}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-border-medium bg-surface-primary px-4 py-2 text-xs font-semibold text-text-primary transition-all hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isConsolidating === 'archive_only' ? (
                    <>
                      <Spinner className="size-4" />
                      <span>Archivando conversaciones...</span>
                    </>
                  ) : (
                    <>
                      <Archive className="size-3.5 text-text-secondary" />
                      <span>
                        📦 Solo Archivar todos (+{selectedDays} días)
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};

export default memo(Conversations);
