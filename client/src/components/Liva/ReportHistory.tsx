import React, { useRef, useMemo, useState, useCallback, useEffect, type CSSProperties } from 'react';
import ReactDOM from 'react-dom';
import { useAuthContext, useNavScrolling, useLocalize } from '~/hooks';
import { useConversationsInfiniteQuery } from '~/data-provider';
import { Spinner } from '@librechat/client';
import type { ConversationListResponse } from 'librechat-data-provider';
import { useQueryClient, type InfiniteQueryObserverResult } from '@tanstack/react-query';
import { FileText, RefreshCw, X, MoreVertical, Edit, Trash, History } from 'lucide-react';
import { cn } from '~/utils';
import axios from 'axios';

const MenuDropdown = ({ conversationId, title, onRename, onDelete }: { conversationId: string, title: string, onRename: (name: string) => void, onDelete: () => Promise<void> }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [menuStyle, setMenuStyle] = useState<CSSProperties>({});
    const [isDeleting, setIsDeleting] = useState(false);

    const buttonRef = useRef<HTMLButtonElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const localize = useLocalize();

    const calcMenuStyle = () => {
        if (!buttonRef.current) return;
        const rect = buttonRef.current.getBoundingClientRect();
        setMenuStyle({
            position: 'fixed',
            top: rect.bottom + 4,
            right: window.innerWidth - rect.right,
            zIndex: 999999,
        });
    };

    useEffect(() => {
        if (!isOpen) return;
        const handleClickOutside = (e: MouseEvent) => {
            const t = e.target as Node;
            if (!buttonRef.current?.contains(t) && !dropdownRef.current?.contains(t)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const handleRenameClick = () => {
        const newName = prompt('Nuevo nombre para el reporte:', title);
        if (newName && newName !== title) onRename(newName);
        setIsOpen(false);
    };

    const handleDeleteClick = async (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsOpen(false);
        const confirmed = window.confirm(`¿Eliminar "${title}" del historial?\nEsta acción no borra la conversación, solo la saca del historial de reportes.`);
        if (!confirmed) return;
        setIsDeleting(true);
        await onDelete();
        setIsDeleting(false);
    };

    const menu = isOpen ? (
        <div
            ref={dropdownRef}
            style={menuStyle}
            className="w-36 bg-surface-primary border border-gray-200 dark:border-gray-700 shadow-lg rounded-lg py-1"
        >
            <button
                onClick={(e) => { e.stopPropagation(); handleRenameClick(); }}
                className="w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-surface-hover flex items-center gap-2"
            >
                <Edit className="w-3 h-3" /> Renombrar
            </button>
            <button
                onClick={handleDeleteClick}
                disabled={isDeleting}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 disabled:opacity-50"
            >
                {isDeleting ? <Spinner className="w-3 h-3" /> : <Trash className="w-3 h-3" />} Eliminar
            </button>
        </div>
    ) : null;

    return (
        <>
            <button
                ref={buttonRef}
                onClick={(e) => { e.stopPropagation(); calcMenuStyle(); setIsOpen(o => !o); }}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
                <MoreVertical className="w-4 h-4 text-text-secondary" />
            </button>

            {ReactDOM.createPortal(menu, document.body)}
        </>
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
    const localize = useLocalize();
    // Removed dependency on global search state to prevent filtering issues
    const [showLoading, setShowLoading] = useState(false);

    // activeCompanyId: resolved async, starts null — query runs immediately without it
    const [activeCompanyId, setActiveCompanyId] = useState<string | null>(null);
    const [companyResolved, setCompanyResolved] = useState(false);

    useEffect(() => {
        if (!isAuthenticated) return;
        let isMounted = true;
        const fetchCompany = async () => {
            try {
                const token = localStorage.getItem('token');
                const headers = token ? { Authorization: `Bearer ${token}` } : {};
                const res = await fetch('/api/sgsst/company-info', { headers });
                if (res.ok && isMounted) {
                    const data = await res.json();
                    if (data && data._id) {
                        setActiveCompanyId(data._id);
                    }
                }
            } catch (e) {
                console.error('[ReportHistory] Could not fetch company', e);
            } finally {
                if (isMounted) setCompanyResolved(true);
            }
        };
        fetchCompany();
        // Timeout fallback: if company fetch takes too long, still show results
        const timeout = setTimeout(() => { if (isMounted) setCompanyResolved(true); }, 3000);
        return () => { isMounted = false; clearTimeout(timeout); };
    }, [isAuthenticated]);

    const queryClient = useQueryClient();

    // Always fetch using the module tag alone — filtering by company is done client-side
    const { data, fetchNextPage, isFetchingNextPage, isLoading, refetch } =
        useConversationsInfiniteQuery(
            { tags },
            {
                enabled: isAuthenticated,
                staleTime: 0,
                refetchOnMount: true,
            },
        );

    const refreshHistory = useCallback(() => {
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

    // Client-side filter: once company is resolved, only show reports for active company.
    // Reports without any company tag are treated as legacy (primary company only).
    const conversations = useMemo(() => {
        const all = data ? data.pages.flatMap((page) => page.conversations) : [];
        if (!companyResolved || !activeCompanyId) {
            // Company not yet known — show everything to avoid blank state
            return all;
        }
        const companyTag = `company-${activeCompanyId}`;
        return all.filter((c: any) => {
            const cTags: string[] = c.tags || [];
            const hasAnyCompanyTag = cTags.some(t => t.startsWith('company-'));
            // Show if it belongs to the active company, OR if it has no company tag at all (legacy)
            return cTags.includes(companyTag) || !hasAnyCompanyTag;
        });
    }, [data, activeCompanyId, companyResolved]);

    if (!isOpen) return null;

    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-[9999999] flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop to handle click outside */}
            <div 
                className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
                onClick={toggleOpen}
            />

            {/* Popup Card */}
            <div className="relative w-full max-w-lg bg-surface-primary border border-border-light rounded-[24px] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-border-light bg-surface-secondary/30">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-[14px]">
                            <History className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="font-bold text-xl text-text-primary tracking-tight">{localize('com_ui_history')}</h2>
                            <p className="text-xs text-text-secondary mt-0.5 font-medium">Historial de reportes generados</p>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <button
                            onClick={toggleOpen}
                            className="p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors group"
                        >
                            <X className="w-5 h-5 text-text-secondary group-hover:text-text-primary transition-colors" />
                        </button>
                        <button
                            onClick={handleManualRefresh}
                            className="flex items-center gap-1.5 text-[11px] font-bold uppercase text-text-secondary hover:text-blue-600 transition-colors tracking-wider"
                            title={localize('com_ui_refresh_list')}
                        >
                            <RefreshCw className={cn("w-3.5 h-3.5", (isLoading || isFetchingNextPage) && "animate-spin")} />
                            Actualizar
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[60vh]">
                {isLoading && (
                    <div className="flex justify-center p-4">
                        <Spinner />
                    </div>
                )}

                {!isLoading && conversations.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-40 text-text-secondary text-sm">
                        <FileText className="w-8 h-8 mb-2 opacity-50" />
                        <p>{localize('com_ui_no_reports')}</p>
                    </div>
                )}

                {conversations.map((convo) => (
                    <div key={convo.conversationId} className="relative group">
                        <button
                            onClick={() => {
                                onSelectReport(convo.conversationId ?? '');
                                toggleOpen(); // Close modal upon selection
                            }}
                            className="w-full text-left p-4 rounded-2xl hover:bg-surface-secondary transition-colors border border-transparent hover:border-black/5 pr-8 bg-surface-primary shadow-sm"
                        >
                            <div className="flex items-start gap-4">
                                <div className="mt-0.5 p-2 bg-surface-tertiary rounded-xl text-[#0d9488] border border-border-light shadow-sm">
                                    <FileText className="w-5 h-5" strokeWidth={1.5} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-[15px] text-text-primary truncate tracking-tight">
                                        {convo.title || localize('com_ui_untitled_report')}
                                    </h3>
                                    <p className="text-[13px] font-medium text-text-secondary mt-1 max-w-[90%] truncate">
                                        {new Date(convo.updatedAt).toLocaleString(undefined, {
                                            dateStyle: 'medium',
                                            timeStyle: 'short',
                                        })}
                                    </p>
                                </div>
                            </div>
                        </button>

                        {/* Context Menu Trigger */}
                        <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MenuDropdown
                                conversationId={convo.conversationId}
                                title={convo.title || localize('com_ui_report')}
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
                    <div className="flex justify-center p-4">
                        <Spinner className="w-5 h-5 text-[#0d9488]" />
                    </div>
                )}
            </div>
            {/* Minimal footer line to round out the popup elegantly */}
            <div className="h-2 bg-gradient-to-t from-surface-secondary/50 to-transparent" />
        </div>
        </div>,
        document.body
    );
};

export default ReportHistory;
