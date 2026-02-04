import { useRef, useMemo, useState, useCallback, useEffect } from 'react';
import { useAuthContext, useNavScrolling } from '~/hooks';
import { useConversationsInfiniteQuery } from '~/data-provider';
import { Spinner } from '@librechat/client';
import type { ConversationListResponse } from 'librechat-data-provider';
import { useQueryClient, type InfiniteQueryObserverResult } from '@tanstack/react-query';
import { FileText, RefreshCw, X } from 'lucide-react';
import { cn } from '~/utils';

interface ReportHistoryProps {
    onSelectReport: (conversationId: string) => void;
    isOpen: boolean;
    toggleOpen: () => void;
    refreshTrigger?: number; // Optional trigger
}

const ReportHistory = ({ onSelectReport, isOpen, toggleOpen, refreshTrigger }: ReportHistoryProps) => {
    const { isAuthenticated } = useAuthContext();
    // Removed dependency on global search state to prevent filtering issues
    const [showLoading, setShowLoading] = useState(false);

    // Fetch conversations tagged as 'report' - No search filter
    const { data, fetchNextPage, isFetchingNextPage, isLoading, refetch } =
        useConversationsInfiniteQuery(
            {
                tags: ['report'],
            },
            {
                enabled: isAuthenticated,
                staleTime: 0,
                refetchOnMount: true,
            },
        );

    const queryClient = useQueryClient();

    // Fetch conversations tagged as 'report' - No search filter
    const { data, fetchNextPage, isFetchingNextPage, isLoading, refetch } =
        useConversationsInfiniteQuery(
            {
                tags: ['report'],
            },
            {
                enabled: isAuthenticated,
                staleTime: 0,
                refetchOnMount: true,
            },
        );

    const refreshHistory = useCallback(() => {
        // Invalidate to force a hard refresh from server
        queryClient.invalidateQueries(['conversations', { tags: ['report'] }]);
        refetch();
    }, [queryClient, refetch]);

    // Refresh when trigger changes with a small delay to ensure backend indexing
    useEffect(() => {
        if (refreshTrigger && refreshTrigger > 0) {
            const timer = setTimeout(() => {
                refreshHistory();
            }, 500); // 500ms delay
            return () => clearTimeout(timer);
        }
    }, [refreshTrigger, refreshHistory]);

    const handleManualRefresh = () => {
        refreshHistory();
    };

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
                <div className="flex items-center gap-2">
                    <h2 className="font-semibold text-lg text-text-primary">Historial</h2>
                    <button
                        onClick={handleManualRefresh}
                        className="p-1 hover:bg-surface-hover rounded-full transition-colors text-text-secondary hover:text-text-primary"
                        title="Actualizar lista"
                    >
                        <RefreshCw className={cn("w-4 h-4", (isLoading || isFetchingNextPage) && "animate-spin")} />
                    </button>
                </div>
                <button
                    onClick={toggleOpen}
                    className="p-1 hover:bg-surface-hover rounded-full transition-colors"
                >
                    <X className="w-5 h-5 text-text-secondary" />
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
                        onClick={() => onSelectReport(convo.conversationId ?? '')}
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
