import { useMemo, memo, type FC, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import throttle from 'lodash/throttle';
import { Plus, Bookmark, Shield, Camera, PanelLeft } from 'lucide-react';
import { Spinner, useMediaQuery } from '@librechat/client';
import { List, AutoSizer, CellMeasurer, CellMeasurerCache } from 'react-virtualized';
import { TConversation } from 'librechat-data-provider';
import { useLocalize, TranslationKeys, useNewConvo } from '~/hooks';
import { groupConversationsByDate, clearMessagesCache, cn } from '~/utils';
import store from '~/store';
import Convo from './Convo';

interface ConversationsProps {
  conversations: Array<TConversation | null>;
  moveToTop: () => void;
  toggleNav: () => void;
  containerRef: React.RefObject<HTMLDivElement | List>;
  loadMoreConversations: () => void;
  isLoading: boolean;
  isSearchLoading: boolean;
  subHeaders?: React.ReactNode;
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

type FlattenedItem =
  | { type: 'actions' }
  | { type: 'header'; groupName: string }
  | { type: 'convo'; convo: TConversation }
  | { type: 'loading' };

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
      prevProps.conversation.endpoint === nextProps.conversation.endpoint
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
  subHeaders,
}) => {
  const localize = useLocalize();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { newConversation: newConvo } = useNewConvo();
  const isSmallScreen = useMediaQuery('(max-width: 768px)');
  const convoHeight = isSmallScreen ? 44 : 34;

  const clickHandler = useCallback(
    (event: React.MouseEvent<HTMLButtonElement | HTMLDivElement>) => {
      if (event.button === 0 && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) {
        event.preventDefault();
        clearMessagesCache(queryClient);
        newConvo();
        navigate('/c/new');
        store.set(store.isFullWidth, false);
      }
    },
    [newConvo, navigate, queryClient],
  );

  const ActionButton = ({ icon, label, onClick, className = "" }: { icon: React.ReactNode, label: string, onClick?: (e: any) => void, className?: string }) => (
    <button
      onClick={onClick}
      className={cn(
        "flex h-10 w-full items-center gap-3 rounded-xl border border-border-light/50 bg-white px-3 text-sm font-medium text-text-primary transition-all hover:bg-surface-hover hover:border-border-medium shadow-sm",
        className
      )}
    >
      <div className="flex-shrink-0 text-text-tertiary">
        {icon}
      </div>
      <span className="truncate">{label}</span>
    </button>
  );

  const filteredConversations = useMemo(
    () => rawConversations.filter((c): c is TConversation =>
      c != null && !(c.endpoint && typeof c.endpoint === 'string' && c.endpoint.startsWith('sgsst-'))
    ),
    [rawConversations],
  );

  const groupedConversations = useMemo(
    () => groupConversationsByDate(filteredConversations),
    [filteredConversations],
  );

  const flattenedItems = useMemo(() => {
    const items: FlattenedItem[] = [];
    
    // Prepend Actions
    items.push({ type: 'actions' });

    groupedConversations.forEach(([groupName, convos]) => {
      items.push({ type: 'header', groupName });
      items.push(...convos.map((convo) => ({ type: 'convo' as const, convo })));
    });

    if (isLoading) {
      items.push({ type: 'loading' } as any);
    }
    return items;
  }, [groupedConversations, isLoading]);

  const cache = useMemo(
    () =>
      new CellMeasurerCache({
        fixedWidth: true,
        defaultHeight: convoHeight,
        keyMapper: (index) => {
          const item = flattenedItems[index];
          if (item?.type === 'actions') {
            return 'actions-row';
          }
          if (item?.type === 'header') {
            return `header-${index}`;
          }
          if (item?.type === 'convo') {
            return `convo-${item.convo.conversationId}`;
          }
          if (item?.type === 'loading') {
            return `loading-${index}`;
          }
          return `unknown-${index}`;
        },
      }),
    [flattenedItems, convoHeight],
  );

  const rowRenderer = useCallback(
    ({ index, key, parent, style }) => {
      const item = flattenedItems[index];

      if (!item) {
        return null;
      }

      if (item.type === 'actions') {
        return (
          <CellMeasurer cache={cache} columnIndex={0} key={key} parent={parent} rowIndex={index}>
            {({ registerChild }) => (
              <div ref={registerChild} style={style} className="flex flex-col gap-2 p-1 py-4 w-full">
                <ActionButton 
                  icon={<Plus size={18} />} 
                  label={localize('com_ui_new_chat')} 
                  onClick={clickHandler}
                />
                <div className="w-full">
                  {subHeaders}
                </div>
                <ActionButton 
                  icon={<Bookmark size={18} />} 
                  label="Marcadores" 
                  onClick={() => {}} 
                />
                <ActionButton 
                  icon={<Shield size={18} />} 
                  label="Gestor SG-SST" 
                  onClick={() => navigate('/sgsst')}
                />
                <ActionButton 
                  icon={<Camera size={18} />} 
                  label="Cámara de Riesgo" 
                  onClick={() => navigate('/risk-camera')}
                />
              </div>
            )}
          </CellMeasurer>
        );
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
      let rendering: JSX.Element;
      if (item.type === 'header') {
        rendering = <DateLabel groupName={item.groupName} />;
      } else if (item.type === 'convo') {
        rendering = (
          <MemoizedConvo conversation={item.convo} retainView={moveToTop} toggleNav={toggleNav} />
        );
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
    [cache, flattenedItems, moveToTop, toggleNav, subHeaders, clickHandler, navigate, localize],
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
    </div>
  );
};

export default memo(Conversations);
