import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import {
  MessageSquare,
  ChevronDown,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Search,
  Loader2,
  Clock,
} from 'lucide-react';
import { ExpandableButton } from '~/components/Common/ExpandableButton';
import { cn } from '~/utils';
import { safeGetItem, safeSetItem } from '~/utils/safeStorage';
import { TENSHI_POPOVER_EVENT, announceTenshiPopoverOpen } from './TenshiSessionControls';

/* ─── Types ──────────────────────────────────────────────────────────────── */

export interface TenshiConversationItem {
  id: string;
  title: string;
  messageCount: number;
  updatedAt?: string;
  createdAt?: string;
}

const ACTIVE_CONVO_STORAGE_PREFIX = 'wappy_tenshi_active_convo_v1:';

function getActiveConvoStorageKey(companyId?: string | null): string {
  const cleanCid = String(companyId || '').trim() || 'default';
  return `${ACTIVE_CONVO_STORAGE_PREFIX}${cleanCid}`;
}

function normalizeConversationItem(raw: any): TenshiConversationItem | null {
  if (!raw || typeof raw !== 'object') return null;
  const id = String(raw.conversationId || raw._id || raw.id || '').trim();
  if (!id) return null;
  const rawTitle = String(raw.title || raw.name || '').trim();
  const countVal = Number(raw.messageCount ?? raw.messagesCount ?? raw.count ?? 0);
  return {
    id,
    title: rawTitle || 'Nuevo chat',
    messageCount: Number.isFinite(countVal) && countVal >= 0 ? countVal : 0,
    updatedAt:
      typeof raw.updatedAt === 'string'
        ? raw.updatedAt
        : typeof raw.lastMessageAt === 'string'
          ? raw.lastMessageAt
          : typeof raw.createdAt === 'string'
            ? raw.createdAt
            : undefined,
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : undefined,
  };
}

function normalizeConversationList(payload: any): TenshiConversationItem[] {
  const arr = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.conversations)
      ? payload.conversations
      : Array.isArray(payload?.items)
        ? payload.items
        : Array.isArray(payload?.data)
          ? payload.data
          : [];
  const out: TenshiConversationItem[] = [];
  const seen = new Set<string>();
  for (const item of arr) {
    const normalized = normalizeConversationItem(item);
    if (normalized && !seen.has(normalized.id)) {
      seen.add(normalized.id);
      out.push(normalized);
    }
  }
  return out;
}

function formatRelativeDate(iso?: string): string {
  if (!iso) return '';
  const ts = Date.parse(iso);
  if (!Number.isFinite(ts)) return '';
  const diffMs = Date.now() - ts;
  if (diffMs < 60_000) return 'Ahora';
  const diffMins = Math.floor(diffMs / 60_000);
  if (diffMins < 60) return `Hace ${diffMins} min`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `Hace ${diffHours} h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Ayer';
  if (diffDays < 7) return `Hace ${diffDays} d`;
  try {
    return new Date(ts).toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'short',
    });
  } catch {
    return '';
  }
}

/* ─── Hook: useTenshiConversations ───────────────────────────────────────── */

export interface UseTenshiConversationsOptions {
  token?: string | null;
  isAuthenticated: boolean;
  activeCompanyId?: string;
}

export function useTenshiConversations({
  token,
  isAuthenticated,
  activeCompanyId,
}: UseTenshiConversationsOptions) {
  const [conversations, setConversations] = useState<TenshiConversationItem[]>([]);
  const [activeConversationId, setActiveConversationIdState] = useState<string | null>(() => {
    const saved = safeGetItem(getActiveConvoStorageKey(activeCompanyId));
    return saved && saved.trim() ? saved.trim() : null;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);

  const activeConversationIdRef = useRef<string | null>(activeConversationId);
  activeConversationIdRef.current = activeConversationId;

  const activeCompanyIdRef = useRef<string>(activeCompanyId || '');
  activeCompanyIdRef.current = activeCompanyId || '';

  const setActiveConversationId = useCallback((id: string | null, companyOverride?: string) => {
    const cleanId = id && id.trim() ? id.trim() : null;
    activeConversationIdRef.current = cleanId;
    setActiveConversationIdState(cleanId);
    const key = getActiveConvoStorageKey(
      companyOverride !== undefined ? companyOverride : activeCompanyIdRef.current,
    );
    if (cleanId) {
      safeSetItem(key, cleanId);
    }
  }, []);

  const buildAuthHeaders = useCallback(
    () => (token ? { Authorization: `Bearer ${token}` } : {}),
    [token],
  );

  const buildCompanyQuery = useCallback((overrideCid?: string) => {
    const cid =
      overrideCid !== undefined
        ? overrideCid
        : activeCompanyIdRef.current ||
          (typeof window !== 'undefined' ? localStorage.getItem('wappy_active_company_id') || '' : '');
    return cid ? `?companyId=${encodeURIComponent(cid)}` : '';
  }, []);

  const fetchConversations = useCallback(
    async (opts?: { overrideCompanyId?: string; preferredId?: string | null }) => {
      if (!isAuthenticated || !token) return [] as TenshiConversationItem[];
      const targetCid =
        opts?.overrideCompanyId !== undefined
          ? opts.overrideCompanyId
          : activeCompanyIdRef.current;
      try {
        setIsLoading(true);
        const res = await axios.get(`/api/tenshi/conversations${buildCompanyQuery(targetCid)}`, {
          headers: buildAuthHeaders(),
        });
        const list = normalizeConversationList(res.data);
        setConversations(list);

        const desiredId =
          opts?.preferredId !== undefined
            ? opts.preferredId
            : activeConversationIdRef.current || safeGetItem(getActiveConvoStorageKey(targetCid));

        if (desiredId && list.some((c) => c.id === desiredId)) {
          setActiveConversationId(desiredId, targetCid);
        } else if (list.length > 0) {
          setActiveConversationId(list[0].id, targetCid);
        } else {
          setActiveConversationId(null, targetCid);
        }
        return list;
      } catch (err) {
        console.warn('[TenshiConversations] Error fetching conversations:', err);
        return [] as TenshiConversationItem[];
      } finally {
        setIsLoading(false);
      }
    },
    [isAuthenticated, token, buildCompanyQuery, buildAuthHeaders, setActiveConversationId],
  );

  // Refetch conversations whenever auth or company changes
  useEffect(() => {
    if (!isAuthenticated || !token) return;
    const savedForCompany = safeGetItem(getActiveConvoStorageKey(activeCompanyId));
    fetchConversations({
      overrideCompanyId: activeCompanyId || '',
      preferredId: savedForCompany && savedForCompany.trim() ? savedForCompany.trim() : null,
    });
  }, [isAuthenticated, token, activeCompanyId, fetchConversations]);

  const createConversation = useCallback(
    async (title?: string): Promise<TenshiConversationItem | null> => {
      if (!isAuthenticated || !token) return null;
      const cid = activeCompanyIdRef.current || undefined;
      try {
        setIsMutating(true);
        const res = await axios.post(
          '/api/tenshi/conversations',
          {
            companyId: cid,
            title: (title || '').trim() || 'Nuevo chat',
          },
          { headers: buildAuthHeaders() },
        );
        const rawCreated = res.data?.conversation || res.data?.data || res.data;
        const created = normalizeConversationItem(rawCreated);
        if (created) {
          setConversations((prev) => [created, ...prev.filter((c) => c.id !== created.id)]);
          setActiveConversationId(created.id);
          return created;
        }
        await fetchConversations();
        return null;
      } catch (err) {
        console.error('[TenshiConversations] Error creating conversation:', err);
        return null;
      } finally {
        setIsMutating(false);
      }
    },
    [isAuthenticated, token, buildAuthHeaders, setActiveConversationId, fetchConversations],
  );

  const renameConversation = useCallback(
    async (conversationId: string, newTitle: string): Promise<boolean> => {
      const cleanTitle = newTitle.trim();
      if (!conversationId || !cleanTitle || !isAuthenticated || !token) return false;
      const cid = activeCompanyIdRef.current || undefined;

      // Optimistic update
      setConversations((prev) =>
        prev.map((c) => (c.id === conversationId ? { ...c, title: cleanTitle } : c)),
      );
      try {
        setIsMutating(true);
        const res = await axios.patch(
          `/api/tenshi/conversations/${encodeURIComponent(conversationId)}`,
          { title: cleanTitle, companyId: cid },
          { headers: buildAuthHeaders() },
        );
        const rawUpdated = res.data?.conversation || res.data?.data || res.data;
        const updated = normalizeConversationItem(rawUpdated);
        if (updated) {
          setConversations((prev) =>
            prev.map((c) => (c.id === conversationId ? { ...c, ...updated } : c)),
          );
        }
        return true;
      } catch (err) {
        console.error('[TenshiConversations] Error renaming conversation:', err);
        await fetchConversations();
        return false;
      } finally {
        setIsMutating(false);
      }
    },
    [isAuthenticated, token, buildAuthHeaders, fetchConversations],
  );

  const deleteConversation = useCallback(
    async (conversationId: string): Promise<{ nextActiveId: string | null }> => {
      if (!conversationId || !isAuthenticated || !token) {
        return { nextActiveId: activeConversationIdRef.current };
      }
      const wasActive = activeConversationIdRef.current === conversationId;
      let remainingAfterDelete: TenshiConversationItem[] = [];

      setConversations((prev) => {
        remainingAfterDelete = prev.filter((c) => c.id !== conversationId);
        return remainingAfterDelete;
      });

      try {
        setIsMutating(true);
        await axios.delete(
          `/api/tenshi/conversations/${encodeURIComponent(conversationId)}${buildCompanyQuery()}`,
          { headers: buildAuthHeaders() },
        );

        if (wasActive) {
          if (remainingAfterDelete.length > 0) {
            const nextId = remainingAfterDelete[0].id;
            setActiveConversationId(nextId);
            return { nextActiveId: nextId };
          }
          // Último chat eliminado: crear uno vacío limpio automáticamente
          const fresh = await createConversation('Nuevo chat');
          if (fresh) {
            return { nextActiveId: fresh.id };
          }
          setActiveConversationId(null);
          return { nextActiveId: null };
        }
        return { nextActiveId: activeConversationIdRef.current };
      } catch (err) {
        console.error('[TenshiConversations] Error deleting conversation:', err);
        await fetchConversations();
        return { nextActiveId: activeConversationIdRef.current };
      } finally {
        setIsMutating(false);
      }
    },
    [
      isAuthenticated,
      token,
      buildCompanyQuery,
      buildAuthHeaders,
      setActiveConversationId,
      createConversation,
      fetchConversations,
    ],
  );

  const syncConversationFromChatResponse = useCallback(
    (returnedId?: string | null, returnedTitle?: string | null) => {
      const cleanId = returnedId && String(returnedId).trim() ? String(returnedId).trim() : null;
      const cleanTitle =
        returnedTitle && String(returnedTitle).trim() ? String(returnedTitle).trim() : null;

      if (cleanId) {
        setActiveConversationId(cleanId);
        setConversations((prev) => {
          const exists = prev.some((c) => c.id === cleanId);
          if (exists) {
            return prev.map((c) =>
              c.id === cleanId
                ? {
                    ...c,
                    title: cleanTitle || c.title,
                    updatedAt: new Date().toISOString(),
                  }
                : c,
            );
          }
          return [
            {
              id: cleanId,
              title: cleanTitle || 'Conversación con Tenshi',
              messageCount: 1,
              updatedAt: new Date().toISOString(),
            },
            ...prev,
          ];
        });
      } else if (cleanTitle && activeConversationIdRef.current) {
        const curId = activeConversationIdRef.current;
        setConversations((prev) =>
          prev.map((c) => (c.id === curId ? { ...c, title: cleanTitle } : c)),
        );
      }

      // Refrescar lista del servidor inmediatamente para sincronizar títulos, orden y contadores
      fetchConversations({ preferredId: cleanId || activeConversationIdRef.current });
    },
    [setActiveConversationId, fetchConversations],
  );

  return {
    conversations,
    activeConversationId,
    activeConversationIdRef,
    isLoadingConversations: isLoading,
    isMutatingConversations: isMutating,
    setActiveConversationId,
    refreshConversations: fetchConversations,
    createConversation,
    renameConversation,
    deleteConversation,
    syncConversationFromChatResponse,
  };
}

/* ─── Dropdown Portal Positioning ────────────────────────────────────────── */

interface DropdownCoords {
  left: number;
  top: number;
  width: number;
  maxHeight: number;
}

function computeDownwardCoords(
  triggerEl: HTMLElement | null,
  desiredWidth = 308,
): DropdownCoords | null {
  if (!triggerEl || typeof window === 'undefined') return null;
  const rect = triggerEl.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const margin = 12;
  const width = Math.min(desiredWidth, vw - margin * 2);

  let left = rect.left;
  if (left + width > vw - margin) {
    left = vw - margin - width;
  }
  if (left < margin) {
    left = margin;
  }

  const top = Math.min(vh - 220, rect.bottom + 6);
  const maxHeight = Math.max(200, Math.min(440, vh - top - margin));

  return { left, top, width, maxHeight };
}

/* ─── Component: TenshiConversationSwitcher ──────────────────────────────── */

export interface TenshiConversationSwitcherProps {
  conversations: TenshiConversationItem[];
  activeConversationId: string | null;
  isLoading?: boolean;
  isMutating?: boolean;
  compact?: boolean;
  fullWidthOnMobile?: boolean;
  onSelectConversation: (conversationId: string) => void;
  onCreateConversation: () => Promise<void> | void;
  onRenameConversation: (conversationId: string, newTitle: string) => Promise<boolean> | void;
  onDeleteConversation: (conversationId: string) => Promise<void> | void;
}

export default function TenshiConversationSwitcher({
  conversations,
  activeConversationId,
  isLoading = false,
  isMutating = false,
  compact = false,
  fullWidthOnMobile = false,
  onSelectConversation,
  onCreateConversation,
  onRenameConversation,
  onDeleteConversation,
}: TenshiConversationSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const renameInputRef = useRef<HTMLInputElement | null>(null);
  const [coords, setCoords] = useState<DropdownCoords | null>(null);

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeConversationId) || null,
    [conversations, activeConversationId],
  );

  const filteredConversations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) => (c.title || '').toLowerCase().includes(q));
  }, [conversations, searchQuery]);

  const updateCoords = useCallback(() => {
    if (!isOpen) {
      setCoords(null);
      return;
    }
    setCoords(computeDownwardCoords(triggerRef.current, 308));
  }, [isOpen]);

  useEffect(() => {
    updateCoords();
    if (!isOpen) return;
    window.addEventListener('resize', updateCoords);
    window.addEventListener('scroll', updateCoords, true);
    return () => {
      window.removeEventListener('resize', updateCoords);
      window.removeEventListener('scroll', updateCoords, true);
    };
  }, [isOpen, updateCoords]);

  useEffect(() => {
    if (editingId) {
      setTimeout(() => {
        renameInputRef.current?.focus();
        renameInputRef.current?.select();
      }, 15);
    }
  }, [editingId]);

  // Cierre mutuo cuando otro popover de Tenshi se abre
  useEffect(() => {
    const handleOtherPopoverOpen = (e: Event) => {
      const source = (e as CustomEvent)?.detail?.source;
      if (source !== 'conversation-switcher') {
        setIsOpen(false);
      }
    };
    window.addEventListener(TENSHI_POPOVER_EVENT, handleOtherPopoverOpen);
    return () => window.removeEventListener(TENSHI_POPOVER_EVENT, handleOtherPopoverOpen);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setEditingId(null);
      setConfirmDeleteId(null);
      setSearchQuery('');
      return;
    }
    const handleOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      if (popoverRef.current?.contains(target)) return;
      if (triggerRef.current?.contains(target)) return;
      setIsOpen(false);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (editingId) {
          setEditingId(null);
          setEditingTitle('');
        } else if (confirmDeleteId) {
          setConfirmDeleteId(null);
        } else {
          setIsOpen(false);
        }
      }
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, editingId, confirmDeleteId]);

  const handleCommitRename = async (id: string) => {
    const trimmed = editingTitle.trim();
    if (!trimmed) {
      setEditingId(null);
      setEditingTitle('');
      return;
    }
    setEditingId(null);
    setEditingTitle('');
    await onRenameConversation(id, trimmed);
  };

  const handleConfirmDelete = async (id: string) => {
    setConfirmDeleteId(null);
    await onDeleteConversation(id);
  };

  const handleCreate = async () => {
    setIsOpen(false);
    await onCreateConversation();
  };

  const displayTitle = activeConversation?.title || 'Chat actual';

  const renderDropdown = () => {
    if (!isOpen || !coords) return null;
    return createPortal(
      <div
        ref={popoverRef}
        onClick={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
        style={{
          position: 'fixed',
          left: `${coords.left}px`,
          top: `${coords.top}px`,
          width: `${coords.width}px`,
          maxWidth: 'calc(100vw - 24px)',
          maxHeight: `${coords.maxHeight}px`,
          zIndex: 2147483646,
        }}
        className={cn(
          'flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 dark:border-zinc-700/80',
          'bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl shadow-2xl shadow-black/20',
          'animate-in fade-in-0 zoom-in-95 duration-150',
        )}
      >
        {/* Cabecera: Botón destacado + Nuevo chat */}
        <div className="shrink-0 border-b border-slate-200/70 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900/70 p-2.5 space-y-2">
          <button
            type="button"
            disabled={isMutating}
            onClick={handleCreate}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-extrabold tracking-wide text-emerald-700 dark:text-emerald-300 transition-all hover:bg-emerald-500/20 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          >
            {isMutating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Plus className="h-3.5 w-3.5" />
            )}
            <span>Nuevo chat</span>
          </button>

          {/* Buscador solo si hay más de 4 chats */}
          {conversations.length > 4 && (
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar conversación..."
                className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/90 py-1.5 pl-8 pr-7 text-xs text-slate-800 dark:text-zinc-100 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Limpiar búsqueda"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Lista de chats */}
        <div className="min-h-0 flex-1 overflow-y-auto p-2 space-y-1">
          {isLoading && conversations.length === 0 ? (
            <div className="flex items-center justify-center gap-2 py-6 text-xs text-slate-400 dark:text-zinc-400">
              <Loader2 className="h-4 w-4 animate-spin text-teal-500" />
              <span>Cargando chats...</span>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400 dark:text-zinc-500">
              {searchQuery
                ? 'Sin coincidencias para tu búsqueda.'
                : 'Aún no hay conversaciones guardadas.'}
            </div>
          ) : (
            filteredConversations.map((convo) => {
              const isActive = convo.id === activeConversationId;
              const isEditing = editingId === convo.id;
              const isConfirmingDelete = confirmDeleteId === convo.id;
              const relDate = formatRelativeDate(convo.updatedAt || convo.createdAt);

              return (
                <div
                  key={convo.id}
                  className={cn(
                    'group rounded-xl border p-2 transition-all',
                    isActive
                      ? 'border-emerald-500/40 bg-emerald-500/10 shadow-2xs'
                      : 'border-transparent hover:border-slate-200/80 dark:hover:border-zinc-700/80 hover:bg-slate-100/70 dark:hover:bg-zinc-800/70',
                  )}
                >
                  {isEditing ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        ref={renameInputRef}
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleCommitRename(convo.id);
                          } else if (e.key === 'Escape') {
                            e.preventDefault();
                            setEditingId(null);
                            setEditingTitle('');
                          }
                        }}
                        maxLength={80}
                        className="min-w-0 flex-1 rounded-lg border border-teal-500/60 bg-white dark:bg-zinc-900 px-2 py-1 text-xs font-semibold text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-teal-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleCommitRename(convo.id)}
                        title="Guardar nombre"
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-teal-500/35 bg-teal-500/15 text-teal-700 dark:text-teal-300 hover:bg-teal-500/25 cursor-pointer"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(null);
                          setEditingTitle('');
                        }}
                        title="Cancelar"
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-slate-300/60 dark:border-zinc-700 bg-slate-500/10 text-slate-600 dark:text-zinc-300 hover:bg-slate-500/20 cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : isConfirmingDelete ? (
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-xs font-bold text-rose-700 dark:text-rose-300">
                        ¿Eliminar este chat?
                      </span>
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleConfirmDelete(convo.id)}
                          className="rounded-lg border border-rose-500/40 bg-rose-500/15 px-2.5 py-1 text-[11px] font-extrabold text-rose-700 dark:text-rose-300 hover:bg-rose-500/25 cursor-pointer"
                        >
                          Sí
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="rounded-lg border border-slate-300/60 dark:border-zinc-700 bg-slate-500/10 px-2.5 py-1 text-[11px] font-bold text-slate-600 dark:text-zinc-300 hover:bg-slate-500/20 cursor-pointer"
                        >
                          No
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          onSelectConversation(convo.id);
                          setIsOpen(false);
                        }}
                        className="flex min-w-0 flex-1 items-start gap-2 text-left cursor-pointer"
                      >
                        <span
                          className={cn(
                            'mt-1.5 h-2 w-2 flex-shrink-0 rounded-full',
                            isActive
                              ? 'bg-emerald-500 ring-2 ring-emerald-500/25'
                              : 'bg-slate-300 dark:bg-zinc-600',
                          )}
                        />
                        <div className="min-w-0 flex-1">
                          <p
                            className={cn(
                              'truncate text-xs leading-snug',
                              isActive
                                ? 'font-bold text-emerald-700 dark:text-emerald-300'
                                : 'font-semibold text-slate-700 dark:text-zinc-200',
                            )}
                          >
                            {convo.title}
                          </p>
                          <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-zinc-400">
                            <span>
                              {convo.messageCount}{' '}
                              {convo.messageCount === 1 ? 'mensaje' : 'mensajes'}
                            </span>
                            {relDate && (
                              <>
                                <span>·</span>
                                <span className="inline-flex items-center gap-0.5">
                                  <Clock className="h-2.5 w-2.5" />
                                  {relDate}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </button>

                      {/* Acciones inline: Renombrar y Eliminar */}
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmDeleteId(null);
                            setEditingId(convo.id);
                            setEditingTitle(convo.title);
                          }}
                          title="Renombrar chat"
                          aria-label={`Renombrar ${convo.title}`}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-transparent text-slate-400 transition-colors hover:border-orange-500/30 hover:bg-orange-500/10 hover:text-orange-600 dark:hover:text-orange-400 cursor-pointer"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingId(null);
                            setConfirmDeleteId(convo.id);
                          }}
                          title="Eliminar chat"
                          aria-label={`Eliminar ${convo.title}`}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-transparent text-slate-400 transition-colors hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Pie informativo discreto */}
        {conversations.length > 0 && (
          <div className="shrink-0 border-t border-slate-200/70 dark:border-zinc-800 px-3 py-1.5 text-[10px] font-medium text-slate-400 dark:text-zinc-500 flex items-center justify-between">
            <span>
              {conversations.length} {conversations.length === 1 ? 'chat' : 'chats'} en Tenshi
            </span>
            <span>Multi-chat por empresa</span>
          </div>
        )}
      </div>,
      document.body,
    );
  };

  return (
    <>
      <div
        className={cn(
          'flex min-w-0 items-center gap-1.5',
          fullWidthOnMobile ? 'w-full sm:w-auto' : '',
        )}
      >
        <button
          ref={triggerRef}
          type="button"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          title={`Chat activo: ${displayTitle}`}
          onClick={() => {
            setIsOpen((prev) => {
              const next = !prev;
              if (next) {
                announceTenshiPopoverOpen('conversation-switcher');
              }
              return next;
            });
          }}
          className={cn(
            'inline-flex h-8 min-w-0 items-center gap-1.5 rounded-xl border px-2.5 text-xs font-bold transition-all active:scale-95 cursor-pointer',
            fullWidthOnMobile ? 'flex-1 sm:flex-initial' : '',
            isOpen
              ? 'border-teal-500/50 bg-teal-500/20 text-teal-800 dark:text-teal-200 ring-1 ring-teal-500/30'
              : 'border-teal-500/30 bg-teal-500/10 text-teal-800 dark:text-teal-200 hover:bg-teal-500/20',
          )}
        >
          <MessageSquare className="h-3.5 w-3.5 flex-shrink-0 text-teal-600 dark:text-teal-400" />
          <span
            className={cn(
              'truncate text-left',
              fullWidthOnMobile
                ? 'flex-1 sm:max-w-[175px]'
                : compact
                  ? 'max-w-[155px]'
                  : 'max-w-[140px] sm:max-w-[180px]',
            )}
          >
            {displayTitle}
          </span>
          <ChevronDown
            className={cn(
              'h-3.5 w-3.5 flex-shrink-0 text-teal-600/80 dark:text-teal-400/80 transition-transform duration-200',
              isOpen && 'rotate-180',
            )}
          />
        </button>

        {compact ? (
          <button
            type="button"
            disabled={isMutating}
            onClick={handleCreate}
            title="Nuevo chat en Tenshi"
            aria-label="Nuevo chat en Tenshi"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-emerald-500/35 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 transition-all duration-200 hover:bg-emerald-500/20 sm:hover:-rotate-3 sm:hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {isMutating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Plus className="h-3.5 w-3.5" />
            )}
          </button>
        ) : (
          <ExpandableButton
            type="button"
            variant="emerald"
            size="sm"
            disabled={isMutating}
            icon={
              isMutating ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Plus className="h-3.5 w-3.5" />
              )
            }
            label="Nuevo chat"
            title="Nuevo chat en Tenshi"
            onClick={handleCreate}
          />
        )}
      </div>

      {renderDropdown()}
    </>
  );
}
