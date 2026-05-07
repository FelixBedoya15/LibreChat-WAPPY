import React, { useRef, useState, useCallback, useEffect, type CSSProperties } from 'react';
import ReactDOM from 'react-dom';
import { useAuthContext, useLocalize } from '~/hooks';
import { Spinner } from '@librechat/client';
import { FileText, RefreshCw, X, MoreVertical, Edit, Trash, History } from 'lucide-react';
import { cn } from '~/utils';
import axios from 'axios';

// Must be above the modal's z-[9999999]
const DROPDOWN_Z = 100_000_000;

// ─── Context menu for rename / delete ────────────────────────────────────────
const MenuDropdown = ({
    conversationId, title, onRename, onDelete,
}: {
    conversationId: string; title: string;
    onRename: (name: string) => void; onDelete: () => Promise<void>;
}) => {
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
            zIndex: DROPDOWN_Z,
        });
    };

    useEffect(() => {
        if (!isOpen) return;
        const h = (e: MouseEvent) => {
            const t = e.target as Node;
            if (!buttonRef.current?.contains(t) && !dropdownRef.current?.contains(t)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, [isOpen]);

    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsOpen(false);
        if (!window.confirm(`¿Eliminar "${title}" del historial?\nEsta acción no borra la conversación.`)) return;
        setIsDeleting(true);
        await onDelete();
        setIsDeleting(false);
    };

    const menu = isOpen ? (
        <div ref={dropdownRef} style={menuStyle}
            className="w-36 bg-surface-primary border border-gray-200 dark:border-gray-700 shadow-xl rounded-lg py-1">
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    const n = prompt('Nuevo nombre:', title);
                    if (n && n !== title) onRename(n);
                    setIsOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-surface-hover flex items-center gap-2"
            >
                <Edit className="w-3 h-3" /> Renombrar
            </button>
            <button onClick={handleDelete} disabled={isDeleting}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 disabled:opacity-50">
                {isDeleting ? <Spinner className="w-3 h-3" /> : <Trash className="w-3 h-3" />} Eliminar
            </button>
        </div>
    ) : null;

    return (
        <>
            <button ref={buttonRef}
                onClick={(e) => { e.stopPropagation(); calcMenuStyle(); setIsOpen(o => !o); }}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
                <MoreVertical className="w-4 h-4 text-text-secondary" />
            </button>
            {ReactDOM.createPortal(menu, document.body)}
        </>
    );
};

// ─── Types ────────────────────────────────────────────────────────────────────
interface ConvoItem {
    conversationId: string;
    title: string;
    updatedAt: string;
    tags?: string[];
}

interface ReportHistoryProps {
    onSelectReport: (conversationId: string) => void;
    isOpen: boolean;
    toggleOpen: () => void;
    refreshTrigger?: number;
    tags?: string[];
}

// ─── Main component ───────────────────────────────────────────────────────────
const ReportHistory = ({
    onSelectReport, isOpen, toggleOpen, refreshTrigger, tags = ['report'],
}: ReportHistoryProps) => {
    const { isAuthenticated } = useAuthContext();
    const localize = useLocalize();

    const [conversations, setConversations] = useState<ConvoItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // ─── Fetch directly from the dedicated backend endpoint ───────────────────
    // This completely bypasses React Query's cache, guaranteeing fresh data
    // that is already filtered by the active company on the server.
    const fetchHistory = useCallback(async () => {
        if (!isAuthenticated) return;
        setIsLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            const tagParams = tags.map(t => `tags=${encodeURIComponent(t)}`).join('&');
            const res = await fetch(`/api/sgsst/diagnostico/report-history?${tagParams}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
                cache: 'no-store', // Never use browser cache
            });
            if (!res.ok) {
                setError('Error al cargar el historial');
                setConversations([]);
                return;
            }
            const data = await res.json();
            setConversations(data.conversations || []);
        } catch (e) {
            setError('Error de red al cargar el historial');
            setConversations([]);
        } finally {
            setIsLoading(false);
        }
    }, [isAuthenticated, tags]);

    // Fetch when modal opens
    useEffect(() => {
        if (isOpen) {
            fetchHistory();
        } else {
            // Reset on close so next open is always clean
            setConversations([]);
            setError(null);
        }
    }, [isOpen, fetchHistory]);

    // Re-fetch when parent signals a new report was saved
    useEffect(() => {
        if (refreshTrigger && refreshTrigger > 0 && isOpen) {
            const t = setTimeout(fetchHistory, 600);
            return () => clearTimeout(t);
        }
    }, [refreshTrigger, isOpen, fetchHistory]);

    if (!isOpen) return null;

    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-[9999999] flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={toggleOpen} />

            {/* Modal */}
            <div className="relative w-full max-w-lg bg-surface-primary border border-border-light rounded-[24px] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-border-light bg-surface-secondary/30">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-[14px]">
                            <History className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="font-bold text-xl text-text-primary tracking-tight">
                                {localize('com_ui_history')}
                            </h2>
                            <p className="text-xs text-text-secondary mt-0.5 font-medium">
                                Historial de reportes de esta empresa
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <button onClick={toggleOpen}
                            className="p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors">
                            <X className="w-5 h-5 text-text-secondary" />
                        </button>
                        <button onClick={fetchHistory}
                            className="flex items-center gap-1.5 text-[11px] font-bold uppercase text-text-secondary hover:text-blue-600 tracking-wider">
                            <RefreshCw className={cn('w-3.5 h-3.5', isLoading && 'animate-spin')} />
                            Actualizar
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[60vh]">

                    {/* Loading */}
                    {isLoading && (
                        <div className="flex justify-center p-8"><Spinner /></div>
                    )}

                    {/* Error */}
                    {!isLoading && error && (
                        <div className="flex flex-col items-center justify-center h-32 text-red-500 text-sm gap-2">
                            <p>{error}</p>
                            <button onClick={fetchHistory} className="text-xs underline">Reintentar</button>
                        </div>
                    )}

                    {/* Empty */}
                    {!isLoading && !error && conversations.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-40 text-text-secondary text-sm gap-2">
                            <FileText className="w-8 h-8 mb-2 opacity-50" />
                            <p>{localize('com_ui_no_reports')}</p>
                        </div>
                    )}

                    {/* List */}
                    {!isLoading && conversations.map((convo) => (
                        <div key={convo.conversationId} className="relative group">
                            <button
                                onClick={() => { onSelectReport(convo.conversationId); toggleOpen(); }}
                                className="w-full text-left p-4 rounded-2xl hover:bg-surface-secondary transition-colors border border-transparent hover:border-black/5 pr-10 bg-surface-primary shadow-sm"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="mt-0.5 p-2 bg-surface-tertiary rounded-xl text-[#0d9488] border border-border-light shadow-sm">
                                        <FileText className="w-5 h-5" strokeWidth={1.5} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-[15px] text-text-primary truncate tracking-tight">
                                            {convo.title || localize('com_ui_untitled_report')}
                                        </h3>
                                        <p className="text-[13px] font-medium text-text-secondary mt-1">
                                            {new Date(convo.updatedAt).toLocaleString(undefined, {
                                                dateStyle: 'medium', timeStyle: 'short',
                                            })}
                                        </p>
                                    </div>
                                </div>
                            </button>

                            {/* 3-dot menu — rendered via portal, always above modal */}
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <MenuDropdown
                                    conversationId={convo.conversationId}
                                    title={convo.title || localize('com_ui_report')}
                                    onRename={async (newName) => {
                                        try {
                                            await axios.post('/api/convos/update', {
                                                arg: { conversationId: convo.conversationId, title: newName },
                                            });
                                            fetchHistory();
                                        } catch (e) { console.error(e); }
                                    }}
                                    onDelete={async () => {
                                        try {
                                            const res = await axios.get(`/api/convos/${convo.conversationId}`);
                                            const currentTags: string[] = res.data.tags || [];
                                            // Remove only module tags — keep company tag for future reference
                                            const newTags = currentTags.filter(t => !tags.includes(t));
                                            await axios.post('/api/convos/update', {
                                                arg: { conversationId: convo.conversationId, tags: newTags },
                                            });
                                            fetchHistory();
                                        } catch (e) { console.error(e); }
                                    }}
                                />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="h-2 bg-gradient-to-t from-surface-secondary/50 to-transparent" />
            </div>
        </div>,
        document.body,
    );
};

export default ReportHistory;
