import { useRef, useMemo, useState, useCallback } from 'react';
import { useRecoilValue } from 'recoil';
import { useAuthContext, useNavScrolling } from '~/hooks';
import { useConversationsInfiniteQuery } from '~/data-provider';
import { Spinner } from '@librechat/client';
import store from '~/store';
import type { ConversationListResponse } from 'librechat-data-provider';
import type { InfiniteQueryObserverResult } from '@tanstack/react-query';
import { FileText, MessageSquare } from 'lucide-react';
import { cn } from '~/utils';

interface ReportHistoryProps {
    onSelectReport: (conversationId: string) => void;
    isOpen: boolean;
    toggleOpen: () => void;
    refreshTrigger?: number; // Optional trigger
}

const ReportHistory = ({ onSelectReport, isOpen, toggleOpen, refreshTrigger }: ReportHistoryProps) => {
    const { isAuthenticated } = useAuthContext();
    const search = useRecoilValue(store.search);
    const [showLoading, setShowLoading] = useState(false);

    // Fetch conversations tagged as 'report'
    const { data, fetchNextPage, isFetchingNextPage, isLoading, refetch } =
        useConversationsInfiniteQuery(
            {
                tags: ['report'],
                search: search.debouncedQuery || undefined,
            },
            {
                enabled: isAuthenticated,
                staleTime: 0,
                refetchOnMount: true,
            },
        );

    // Refresh when trigger changes
    useEffect(() => {
        if (refreshTrigger && refreshTrigger > 0) {
            refetch();
        }
    }, [refreshTrigger, refetch]);

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

    return (
        <div
            className={cn(
                "fixed inset-y-0 left-0 z-[200] w-72 bg-surface-primary border-r border-black/10 transform transition-transform duration-300 ease-in-out flex flex-col shadow-2xl",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}
        >
            <div className="flex items-center justify-between p-4 border-b border-black/10">
                <h2 className="font-semibold text-lg text-text-primary">Historial</h2>
                <button
                    onClick={toggleOpen}
                    className="p-1 hover:bg-surface-hover rounded-full transition-colors"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 text-text-secondary"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                        />
                    </svg>
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {isLoading && (
                    <div className="flex justify-center p-4">
                        <Spinner />
                    </div>
                )}

                {!isLoading && conversations.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-40 text-text-secondary text-sm">
                        <FileText className="w-8 h-8 mb-2 opacity-50" />
                        <p>No hay informes disponibles.</p>
                    </div>
                )}

                {conversations.map((convo) => (
                    <button
                        key={convo.conversationId}
                        onClick={() => onSelectReport(convo.conversationId)}
                        className="w-full text-left p-3 rounded-lg hover:bg-surface-hover transition-colors border border-transparent hover:border-black/5 group"
                    >
                        <div className="flex items-start gap-3">
                            <div className="mt-1 p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded text-blue-600 dark:text-blue-400">
                                <FileText className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-medium text-sm text-text-primary truncate">
                                    {convo.title || 'Informe sin título'}
                                </h3>
                                <p className="text-xs text-text-secondary mt-0.5 truncate">
                                    {new Date(convo.updatedAt).toLocaleString(undefined, {
                                        dateStyle: 'short',
                                        timeStyle: 'short',
                                    })}
                                </p>
                            </div>
                        </div>
                    </button>
                ))}

                {isFetchingNextPage && (
                    <div className="flex justify-center p-2">
                        <Spinner className="w-4 h-4" />
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReportHistory;
