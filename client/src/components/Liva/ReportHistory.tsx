import { useRef, useMemo, useState, useCallback, useEffect } from 'react';
import { useAuthContext, useNavScrolling } from '~/hooks';
import { useConversationsInfiniteQuery } from '~/data-provider';
import { Spinner, OGDialog, OGDialogContent, Button } from '@librechat/client';
import type { ConversationListResponse } from 'librechat-data-provider';
import { useQueryClient, type InfiniteQueryObserverResult } from '@tanstack/react-query';
import { FileText, RefreshCw, X, MoreVertical, Edit, Trash } from 'lucide-react';
import { cn } from '~/utils';
import axios from 'axios';

// Simplified Delete Dialog
const DeleteReportDialog = ({
    open,
    onOpenChange,
    onConfirm,
    title,
    loading
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    title: string;
    loading: boolean;
}) => {
    return (
        <OGDialog open={open} onOpenChange={onOpenChange}>
            <OGDialogContent title="¿Eliminar informe?" className="w-11/12 max-w-md">
                <div className="py-4">
                    ¿Deseas eliminar <strong>{title}</strong> de la lista de informes?<br />
                    <span className="text-sm text-text-secondary mt-2 block">
                        Nota: El chat original permanecerá en tu historial de conversaciones.
                    </span>
                </div>
                <div className="flex justify-end gap-3 mt-4">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>
                    <Button variant="destructive" onClick={onConfirm} disabled={loading}>
                        {loading ? <Spinner className="w-4 h-4" /> : 'Eliminar'}
                    </Button>
                </div>
            </OGDialogContent>
        </OGDialog>
    );
};

// Simple Dropdown Component for Context Menu
const MenuDropdown = ({ conversationId, title, onRename, onDelete }: { conversationId: string, title: string, onRename: (name: string) => void, onDelete: () => Promise<void> }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleRenameClick = () => {
        const newName = prompt("Nuevo nombre del informe:", title);
        if (newName && newName !== title) onRename(newName);
        setIsOpen(false);
    };

    const handleDeleteConfirm = async () => {
        setIsDeleting(true);
        await onDelete();
        setIsDeleting(false);
        setShowDeleteDialog(false);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
                <MoreVertical className="w-4 h-4 text-text-secondary" />
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-1 w-32 bg-surface-primary border border-gray-200 dark:border-gray-700 shadow-lg rounded-lg z-50 py-1">
                    <button
                        onClick={(e) => { e.stopPropagation(); handleRenameClick(); }}
                        className="w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-surface-hover flex items-center gap-2"
                    >
                        <Edit className="w-3 h-3" /> Renombrar
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); setIsOpen(false); setShowDeleteDialog(true); }}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                    >
                        <Trash className="w-3 h-3" /> Eliminar
                    </button>
                </div>
            )}

            <DeleteReportDialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
                onConfirm={handleDeleteConfirm}
                title={title}
                loading={isDeleting}
            />
        </div>
    );
};

interface ReportHistoryProps {
    onSelectReport: (conversationId: string) => void;
    isOpen: boolean;
    toggleOpen: () => void;
    refreshTrigger?: number;
    tags?: string[];
}

const ReportHistory = ({ onSelectReport, isOpen, toggleOpen, refreshTrigger, tags = ['report'] }: ReportHistoryProps) => {
    const { isAuthenticated } = useAuthContext();
    // Removed dependency on global search state to prevent filtering issues
    const [showLoading, setShowLoading] = useState(false);



    const queryClient = useQueryClient();

    // Fetch conversations tagged as 'report' - No search filter
    const { data, fetchNextPage, isFetchingNextPage, isLoading, refetch } =
        useConversationsInfiniteQuery(
            {
                tags,
            },
            {
                enabled: isAuthenticated,
                staleTime: 0,
                refetchOnMount: true,
            },
        );

    const refreshHistory = useCallback(() => {
        // Invalidate to force a hard refresh from server
        queryClient.invalidateQueries(['conversations', { tags }]);
        refetch();
    }, [queryClient, refetch, tags]);

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
                    <div key={convo.conversationId} className="relative group">
                        <button
                            onClick={() => onSelectReport(convo.conversationId ?? '')}
                            className="w-full text-left p-3 rounded-lg hover:bg-surface-hover transition-colors border border-transparent hover:border-black/5 pr-8"
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

                        {/* Context Menu Trigger */}
                        <div className="absolute right-2 top-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MenuDropdown
                                conversationId={convo.conversationId}
                                title={convo.title || 'Informe'}
                                onRename={async (newName) => {
                                    try {
                                        await axios.post('/api/convos/update', {
                                            arg: { conversationId: convo.conversationId, title: newName }
                                        });
                                        refreshHistory(); // Refresh to show new name based on invalidation
                                    } catch (e) { console.error(e); }
                                }}
                                onDelete={async () => {
                                    try {
                                        // UNTAG LOGIC: "Remove" from report history but keep chat
                                        const res = await axios.get(`/api/convos/${convo.conversationId}`);
                                        const currentTags = res.data.tags || [];
                                        const newTags = currentTags.filter((t: string) => !tags.includes(t));

                                        await axios.post('/api/convos/update', {
                                            arg: {
                                                conversationId: convo.conversationId,
                                                tags: newTags
                                            }
                                        });
                                        refreshHistory();
                                    } catch (e) {
                                        console.error('Failed to remove report tag', e);
                                    }
                                }}
                            />
                        </div>
                    </div>
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
