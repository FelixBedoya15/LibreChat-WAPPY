import { useRef, useMemo, useState, useCallback, useEffect } from 'react';
import { useRecoilValue } from 'recoil';
import { useAuthContext, useNavScrolling } from '~/hooks';
import { useConversationsInfiniteQuery } from '~/data-provider';
import { Conversations } from '~/components/Conversations';
import { Spinner } from '@librechat/client';
import store from '~/store';
import type { ConversationListResponse } from 'librechat-data-provider';
import type { InfiniteQueryObserverResult } from '@tanstack/react-query';

// Extended props to handle report selection
interface ReportHistoryProps {
    onSelectReport: (conversationId: string) => void;
    isOpen: boolean;
    toggleOpen: () => void;
}

const ReportHistory = ({ onSelectReport, isOpen, toggleOpen }: ReportHistoryProps) => {
    const { isAuthenticated } = useAuthContext();
    const search = useRecoilValue(store.search);
    const [tags, setTags] = useState<string[]>([]); // Future: filter by 'Report' tag
    const [showLoading, setShowLoading] = useState(false);

    // Fetch conversations
    const { data, fetchNextPage, isFetchingNextPage, isLoading, isFetching, refetch } =
        useConversationsInfiniteQuery(
            {
                tags: tags.length === 0 ? undefined : tags,
                search: search.debouncedQuery || undefined,
            },
            {
                enabled: isAuthenticated,
                staleTime: 30000,
                cacheTime: 300000,
            },
        );

    const computedHasNextPage = useMemo(() => {
        if (data?.pages && data.pages.length > 0) {
            const lastPage = data.pages[data.pages.length - 1];
            return lastPage.nextCursor !== null;
        }
        return false;
    }, [data?.pages]);

    const { moveToTop } = useNavScrolling<ConversationListResponse>({
        setShowLoading,
        fetchNextPage: async (options) => {
            if (computedHasNextPage) {
                return fetchNextPage(options);
            }
            return Promise.resolve({} as InfiniteQueryObserverResult<ConversationListResponse, unknown>);
        },
        isFetchingNext: isFetchingNextPage,
    });

    const conversations = useMemo(() => {
        return data ? data.pages.flatMap((page) => page.conversations) : [];
    }, [data]);

    const loadMoreConversations = useCallback(() => {
        if (isFetchingNextPage || !computedHasNextPage) {
            return;
        }
        fetchNextPage();
    }, [isFetchingNextPage, computedHasNextPage, fetchNextPage]);

    const listRef = useRef<any>(null);

    // Filter conversations to only show those likely to be reports?
    // For now, we show all, but we can customize this.

    // Custom toggleNav to select conversation
    const handleConversationClick = useCallback(() => {
        // This is a bit tricker because Conversations component handles click internal nav.
        // We might need to wrap or intercept navigation, but Conversations uses <Convo> which uses existing routing.
        // Ideally, we want to stay on LivePage and just load the content.
        // BUT, Conversations component assumes it navigates to /c/:id.
        // If we want to intercept, we might need to modify Convo or manage url change in LivePage.
    }, []);

    // NOTE: The existing Conversations component uses <a href> or navigate to /c/:id.
    // If the user clicks a conversation, the URL changes to /c/:conversationId.
    // In LivePage, we need to detect this URL change and load the content IF we are in Live Mode.
    // OR, we assume clicking history navigates AWAY from LivePage to ChatPage?
    // The user requirement: "historial de informes que pueda volver a verlos ademas que se pueden editar y guardar".
    // If they go to standard ChatPage, they can verify/edit.
    // BUT maybe they want it IN the LivePage editor?
    // Beause LivePage has the specific "Editor" view (CKEditor/RichText).
    // The ChatPage handles it as chat bubbles.
    // So we definitely want to load it into LivePage.

    // Issue: Reusing `Conversations` component means it will try to navigate.
    // If `LivePage` is at `/live`, clicking a convo link `/c/123` will unmount `LivePage`.
    // Solution: modify `Conversations` or `Convo` to accept an `onClick` override?
    // Checking `Convo.tsx` (not visible yet) would confirm.
    // Assuming we can't easily change `Convo` without affecting global nav.
    // Maybe we just let it navigate, and if the user wants to "Edit as Report", they do it there?
    // NO, the user wants "historial ... ademas que se pueden editar y guardar". The LiveEditor is better for this.

    // Workaround: We can't easily reuse `Conversations` if it hardcodes links.
    // Let's assume for now we reuse it, but we need to handle the navigation or make `LivePage` handle `/c/:id` route?
    // Actually, `LivePage` is likely a separate route.
    // If I cannot reuse `Conversations` easily for "Select only", I might need to copy the logic or accept that it navigates.
    // However, if I use `toggleNav` input of `Conversations`, maybe I can use that?
    // `Convo` calls `toggleNav` on click.
    // But it also has an anchor or div with onClick that navigates.

    // Let's assume we create a simplified list for now if reusing is hard, OR we try to intercept.
    // For this step, I'll blindly reuse `Conversations` and see.
    // To properly support "Select to Load into Editor", `LivePage` needs to match `/c/:conversationId` route OR we manually fetch content when ID is selected.
    // If `Conversations` navigates, we lost the `LivePage` context.

    // Better approach: Create a simple list rendering for reports here avoiding the global navigation component if it's strictly coupled to Chat UI.
    // I'll stick to `Conversations` for visual consistency, but if it navigates away, I might need to suggest the user "Copy to Live Editor" or similar.
    // Wait, if I am on `/live`, and I go to `/c/123`, I am in normal chat.
    // User wants to see history "que pueda volver a verlos ... editar".
    // Maybe sticking to Chat UI is fine?
    // But they asked this in context of Live Analysis.
    // I think they want the list IN the side, and clicking it puts the text in the main editor.

    // I'll create a simple list effectively duplicating `Conversations` logic but with custom click handler.
    // Since `Conversations` is complex (virtualized), I'll try to just map `data.pages` to a simple list first.

    return (
        <div className={`fixed inset-y-0 left-0 bg-surface-primary-alt w-64 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 z-50 shadow-xl border-r border-black/10`}>
            <div className="flex items-center justify-between p-4 border-b border-black/5">
                <h3 className="font-bold text-lg">Historial</h3>
                <button onClick={toggleOpen} className="p-1 hover:bg-black/5 rounded">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>

            <div className="overflow-y-auto h-full pb-20">
                {isLoading ? (
                    <div className="p-4 text-center text-sm text-gray-500">Cargando...</div>
                ) : (
                    <div className="flex flex-col">
                        {conversations.map(convo => (
                            <div
                                key={convo.conversationId}
                                onClick={() => onSelectReport(convo.conversationId)}
                                className="px-4 py-3 border-b border-black/5 cursor-pointer hover:bg-black/5 transition-colors"
                            >
                                <div className="font-medium text-sm truncate">{convo.title || 'Sin título'}</div>
                                <div className="text-xs text-gray-400 mt-1">
                                    {new Date(convo.updatedAt || convo.createdAt).toLocaleDateString()}
                                </div>
                            </div>
                        ))}

                        {computedHasNextPage && (
                            <button onClick={() => fetchNextPage()} disabled={isFetchingNextPage} className="w-full py-2 text-xs text-blue-500 hover:underline">
                                {isFetchingNextPage ? 'Cargando más...' : 'Ver más antiguos'}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReportHistory;
