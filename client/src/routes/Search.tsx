import { useEffect, useMemo } from 'react';
import { useRecoilValue } from 'recoil';
import { Spinner, useToastContext } from '@librechat/client';
import MinimalMessagesWrapper from '~/components/Chat/Messages/MinimalMessages';
import { useNavScrolling, useLocalize, useAuthContext } from '~/hooks';
import SearchMessage from '~/components/Chat/Messages/SearchMessage';
import { useMessagesInfiniteQuery } from '~/data-provider';
import { useFileMapContext, ChatContext, AddedChatContext, MessagesViewProvider } from '~/Providers';
import { cn } from '~/utils';
import store from '~/store';

export default function Search() {
  const localize = useLocalize();
  const fileMap = useFileMapContext();
  const { showToast } = useToastContext();
  const { isAuthenticated } = useAuthContext();
  const search = useRecoilValue(store.search);
  const searchQuery = search.debouncedQuery;

  const mockChatHelpers = useMemo(() => ({
    ask: () => {},
    index: 0,
    regenerate: () => {},
    isSubmitting: false,
    conversation: {},
    latestMessage: null,
    setAbortScroll: () => {},
    handleContinue: () => {},
    setLatestMessage: () => {},
    abortScroll: false,
    getMessages: () => [],
    setMessages: () => {},
  }), []);

  const mockAddedChatHelpers = useMemo(() => ({
    isSubmitting: false,
  }), []);

  const {
    data: searchMessages,
    isLoading,
    isError,
    fetchNextPage,
    isFetchingNextPage,
    hasNextPage: _hasNextPage,
  } = useMessagesInfiniteQuery(
    {
      search: searchQuery || undefined,
    },
    {
      enabled: isAuthenticated && !!searchQuery,
      staleTime: 30000,
      cacheTime: 300000,
    },
  );

  const { containerRef } = useNavScrolling({
    nextCursor: searchMessages?.pages[searchMessages.pages.length - 1]?.nextCursor,
    setShowLoading: () => ({}),
    fetchNextPage: fetchNextPage,
    isFetchingNext: isFetchingNextPage,
  });

  const messages = useMemo(() => {
    const msgs =
      searchMessages?.pages.flatMap((page) =>
        page.messages.map((message) => {
          if (!message.files || !fileMap) {
            return message;
          }
          return {
            ...message,
            files: message.files.map((file) => fileMap[file.file_id ?? ''] ?? file),
          };
        }),
      ) || [];

    return msgs.length === 0 ? null : msgs;
  }, [fileMap, searchMessages?.pages]);

  useEffect(() => {
    if (isError && searchQuery) {
      showToast({ message: 'An error occurred during search', status: 'error' });
    }
  }, [isError, searchQuery, showToast]);

  // Full-page spinner only on the very first load (no data yet in cache)
  const isTrueInitialLoad = isLoading && !searchMessages;

  if (!searchQuery) {
    return null;
  }

  if (isTrueInitialLoad) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <Spinner className="text-text-primary" />
      </div>
    );
  }

  // Subtle top bar while fetching more pages
  const showTopLoader = isLoading || isFetchingNextPage;

  return (
    <ChatContext.Provider value={mockChatHelpers as any}>
      <AddedChatContext.Provider value={mockAddedChatHelpers as any}>
        <MessagesViewProvider>
          <MinimalMessagesWrapper ref={containerRef} className="relative flex h-full pt-4">
            {/* Subtle top progress bar while typing or loading */}
            <div
              className={cn(
                'absolute top-0 left-0 right-0 h-0.5 z-10 overflow-hidden',
                showTopLoader ? 'opacity-100' : 'opacity-0',
                'transition-opacity duration-300',
              )}
            >
              <div className="h-full w-full bg-gradient-to-r from-transparent via-teal-500 to-transparent animate-pulse" />
            </div>

            {messages == null ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="rounded-lg bg-white p-6 text-lg text-gray-500 dark:border-gray-800/50 dark:bg-gray-800 dark:text-gray-300">
                  {localize('com_ui_nothing_found')}
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <SearchMessage key={msg.messageId} message={msg} />
                ))}
                {isFetchingNextPage && (
                  <div className="flex justify-center py-4">
                    <Spinner className="text-text-primary" />
                  </div>
                )}
              </>
            )}
            <div className="absolute bottom-0 left-0 right-0 h-[5%] bg-gradient-to-t from-gray-50 to-transparent dark:from-gray-800" />
          </MinimalMessagesWrapper>
        </MessagesViewProvider>
      </AddedChatContext.Provider>
    </ChatContext.Provider>
  );
}
