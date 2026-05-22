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
  title,
  onRename,
  onDelete,
  isPro,
}: {
  title: string;
  onRename: (name: string) => void;
  onDelete: () => Promise<void>;
  isPro?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({});
  const [isDeleting, setIsDeleting] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
    if (isPro === false) {
      alert(
        'La opción de eliminar reportes es exclusiva del Plan Pro. Para generar múltiples reportes, adquiere Premium.',
      );
      return;
    }
    if (
      !window.confirm(`¿Eliminar "${title}" del historial?\nEsta acción no borra la conversación.`)
    )
      return;
    setIsDeleting(true);
    await onDelete();
    setIsDeleting(false);
  };

  const menu = isOpen ? (
    <div
      ref={dropdownRef}
      style={menuStyle}
      className="w-36 rounded-lg border border-gray-200 bg-surface-primary py-1 shadow-xl dark:border-gray-700"
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          const n = prompt('Nuevo nombre:', title);
          if (n && n !== title) onRename(n);
          setIsOpen(false);
        }}
        className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-text-primary hover:bg-surface-hover"
      >
        <Edit className="h-3 w-3" /> Renombrar
      </button>
      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 dark:hover:bg-red-900/20"
      >
        {isDeleting ? <Spinner className="h-3 w-3" /> : <Trash className="h-3 w-3" />} Eliminar
      </button>
    </div>
  ) : null;

  return (
    <>
      <button
        ref={buttonRef}
        onClick={(e) => {
          e.stopPropagation();
          calcMenuStyle();
          setIsOpen((o) => !o);
        }}
        className="rounded-full p-1 transition-colors hover:bg-gray-200 dark:hover:bg-gray-700"
      >
        <MoreVertical className="h-4 w-4 text-text-secondary" />
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
  /** Optional override endpoint for fetching history (e.g. agent tool history without company filter) */
  historyEndpoint?: string;
}

// ─── Main component ───────────────────────────────────────────────────────────
const ReportHistory = ({
  onSelectReport,
  isOpen,
  toggleOpen,
  refreshTrigger,
  tags = ['report'],
  historyEndpoint,
}: ReportHistoryProps) => {
  const { isAuthenticated, user, token: authToken } = useAuthContext();
  const isPro = user?.role === 'ADMIN' || user?.role === 'USER_PRO';
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
      // Use token from AuthContext first (always current), fallback to localStorage
      const token = authToken || localStorage.getItem('token');
      const tagParams = tags.map((t) => `tags=${encodeURIComponent(t)}`).join('&');
      const endpoint = historyEndpoint
        ? `${historyEndpoint}?${tagParams}`
        : `/api/sgsst/diagnostico/report-history?${tagParams}`;
      const res = await fetch(endpoint, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        cache: 'no-store', // Never use browser cache
      });
      if (!res.ok) {
        let errMsg = 'Error al cargar el historial';
        try {
          const errData = await res.json();
          if (errData?.details) errMsg = errData.details;
          else if (errData?.error) errMsg = errData.error;
        } catch {
          /* ignore parse error */
        }
        setError(errMsg);
        setConversations([]);
        return;
      }
      const data = await res.json();
      setConversations(data.conversations || []);
    } catch (_e) {
      setError('Error de red al cargar el historial');
      setConversations([]);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, authToken, tags, historyEndpoint]);

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
      <div className="relative flex w-full max-w-lg flex-col overflow-hidden rounded-[24px] border border-border-light bg-surface-primary shadow-2xl duration-200 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="bg-surface-secondary/30 flex items-center justify-between border-b border-border-light px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="rounded-[14px] bg-blue-100 p-2.5 text-blue-600 dark:bg-blue-900/30">
              <History className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-text-primary">
                {localize('com_ui_history')}
              </h2>
              <p className="mt-0.5 text-xs font-medium text-text-secondary">
                Historial de reportes de esta empresa
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <button
              onClick={toggleOpen}
              className="rounded-full p-1.5 transition-colors hover:bg-black/5 dark:hover:bg-white/10"
            >
              <X className="h-5 w-5 text-text-secondary" />
            </button>
            <button
              onClick={fetchHistory}
              className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-text-secondary hover:text-blue-600"
            >
              <RefreshCw className={cn('h-3.5 w-3.5', isLoading && 'animate-spin')} />
              Actualizar
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="max-h-[60vh] flex-1 space-y-3 overflow-y-auto p-4">
          {/* Loading */}
          {isLoading && (
            <div className="flex justify-center p-8">
              <Spinner />
            </div>
          )}

          {/* Error */}
          {!isLoading && error && (
            <div className="flex h-32 flex-col items-center justify-center gap-2 text-sm text-red-500">
              <p>{error}</p>
              <button onClick={fetchHistory} className="text-xs underline">
                Reintentar
              </button>
            </div>
          )}

          {/* Empty */}
          {!isLoading && !error && conversations.length === 0 && (
            <div className="flex h-40 flex-col items-center justify-center gap-2 text-sm text-text-secondary">
              <FileText className="mb-2 h-8 w-8 opacity-50" />
              <p>{localize('com_ui_no_reports')}</p>
            </div>
          )}

          {/* List */}
          {!isLoading &&
            conversations.map((convo) => (
              <div key={convo.conversationId} className="group relative">
                <button
                  onClick={() => {
                    onSelectReport(convo.conversationId);
                    toggleOpen();
                  }}
                  className="w-full rounded-2xl border border-transparent bg-surface-primary p-4 pr-10 text-left shadow-sm transition-colors hover:border-black/5 hover:bg-surface-secondary"
                >
                  <div className="flex items-start gap-4">
                    <div className="mt-0.5 rounded-xl border border-border-light bg-surface-tertiary p-2 text-[#0d9488] shadow-sm">
                      <FileText className="h-5 w-5" strokeWidth={1.5} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-[15px] font-bold tracking-tight text-text-primary">
                        {convo.title || localize('com_ui_untitled_report')}
                      </h3>
                      <p className="mt-1 text-[13px] font-medium text-text-secondary">
                        {new Date(convo.updatedAt).toLocaleString(undefined, {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </p>
                    </div>
                  </div>
                </button>

                {/* 3-dot menu — rendered via portal, always above modal */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100">
                  <MenuDropdown
                    title={convo.title || localize('com_ui_report')}
                    isPro={isPro}
                    onRename={async (newName) => {
                      try {
                        if (historyEndpoint && historyEndpoint.includes('/canvas/')) {
                          await axios.post(`/api/sgsst/canvas/${convo.conversationId}/rename`, {
                            title: newName,
                          });
                        }
                        await axios.post('/api/convos/update', {
                          arg: { conversationId: convo.conversationId, title: newName },
                        });
                        fetchHistory();
                      } catch (e) {
                        console.error(e);
                      }
                    }}
                    onDelete={async () => {
                      try {
                        if (historyEndpoint && historyEndpoint.includes('/canvas/')) {
                          await axios.delete(`/api/sgsst/canvas/${convo.conversationId}`);
                        }
                        const res = await axios.get(`/api/convos/${convo.conversationId}`);
                        const currentTags: string[] = res.data.tags || [];
                        // Remove only module tags — keep company tag for future reference
                        const newTags = currentTags.filter((t) => !tags.includes(t));
                        await axios.post('/api/convos/update', {
                          arg: { conversationId: convo.conversationId, tags: newTags },
                        });
                        fetchHistory();
                      } catch (e) {
                        console.error(e);
                      }
                    }}
                  />
                </div>
              </div>
            ))}
        </div>

        <div className="from-surface-secondary/50 h-2 bg-gradient-to-t to-transparent" />
      </div>
    </div>,
    document.body,
  );
};

export default ReportHistory;
