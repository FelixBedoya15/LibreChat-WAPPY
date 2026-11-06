import React, { useState, useEffect, useCallback } from 'react';
import { request } from 'librechat-data-provider';
import { Check, RefreshCw, Search, BookOpen, ExternalLink } from 'lucide-react';
import { cn } from '~/utils';
import type { NotebookLMNotebookItem } from '~/hooks/Agents/useAgentSessionOverrides';

interface AgentNotebookLMPickerProps {
  agentId?: string;
  agentName?: string;
}

export default function AgentNotebookLMPicker({ agentId, agentName }: AgentNotebookLMPickerProps) {
  const [connected, setConnected] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [notebooks, setNotebooks] = useState<NotebookLMNotebookItem[]>([]);
  const [assignedIds, setAssignedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(false);

  const loadNotebooks = useCallback(
    async (forceRefresh = false) => {
      if (!agentId) return;
      setLoading(true);
      try {
        const qs = new URLSearchParams();
        qs.set('agentId', agentId);
        if (forceRefresh) qs.set('refresh', '1');
        const res: any = await request.get(`/api/notebooklm/notebooks?${qs.toString()}`);
        if (res && typeof res === 'object') {
          setConnected(Boolean(res.connected));
          setEmail(res.email || null);
          const list: NotebookLMNotebookItem[] = Array.isArray(res.notebooks) ? res.notebooks : [];
          setNotebooks(list);
          if (Array.isArray(res.assignedNotebooks)) {
            setAssignedIds(res.assignedNotebooks.map((n: any) => String(n.id)));
          }
        }
      } catch (_err) {
        // ignore
      } finally {
        setLoading(false);
      }
    },
    [agentId],
  );

  useEffect(() => {
    if (agentId) {
      loadNotebooks(false);
    }
  }, [agentId, loadNotebooks]);

  const toggleNotebook = async (nb: NotebookLMNotebookItem) => {
    if (!agentId) return;
    const exists = assignedIds.includes(nb.id);
    const nextIds = exists ? assignedIds.filter((id) => id !== nb.id) : [...assignedIds, nb.id];
    setAssignedIds(nextIds);
    const selectedObjects = notebooks.filter((item) => nextIds.includes(item.id));
    setSaving(true);
    try {
      await request.put(`/api/notebooklm/agent-notebooks/${encodeURIComponent(agentId)}`, {
        notebooks: selectedObjects,
      });
    } catch (_err) {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  if (!agentId) return null;

  const filtered = notebooks.filter((nb) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return nb.title.toLowerCase().includes(q) || nb.id.toLowerCase().includes(q);
  });

  const assignedList = notebooks.filter((nb) => assignedIds.includes(nb.id));

  return (
    <div className="mb-4">
      <div className="mb-1.5 flex items-center justify-between">
        <label className="text-token-text-primary flex items-center gap-1.5 text-sm font-medium">
          <BookOpen className="h-4 w-4 text-emerald-500" />
          <span>Segundo Cerebro (NotebookLM)</span>
        </label>
        <span
          className={cn(
            'rounded-full px-2 py-0.5 text-[10px] font-bold',
            assignedIds.length > 0
              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
              : 'bg-surface-tertiary text-text-secondary',
          )}
        >
          {assignedIds.length > 0
            ? `${assignedIds.length} cuaderno${assignedIds.length === 1 ? '' : 's'}`
            : 'Todos disponibles'}
        </span>
      </div>

      <div className="rounded-xl border border-border-light bg-surface-secondary/60 p-2.5">
        <p className="mb-2 text-[11px] leading-relaxed text-text-secondary">
          Asigna cuadernos específicos de Google NotebookLM como fuente de información para{' '}
          <strong className="text-text-primary">{agentName || 'este agente'}</strong>.{' '}
          <span className="text-emerald-600 dark:text-emerald-400 font-medium">
            (Tenshi siempre conserva acceso total a todos tus cuadernos).
          </span>
        </p>

        {assignedList.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1">
            {assignedList.map((nb) => (
              <span
                key={nb.id}
                className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300"
              >
                📓 <span className="max-w-[160px] truncate">{nb.title}</span>
                <button
                  type="button"
                  onClick={() => toggleNotebook(nb)}
                  className="ml-0.5 text-emerald-600 hover:text-red-500 dark:text-emerald-400"
                  title="Quitar cuaderno"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              const next = !expanded;
              setExpanded(next);
              if (next && notebooks.length === 0) {
                loadNotebooks(true);
              }
            }}
            className="btn btn-neutral border-token-border-light flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg text-xs font-medium shadow-sm transition-all"
          >
            <BookOpen className="h-3.5 w-3.5 text-emerald-500" />
            <span>
              {expanded
                ? 'Ocultar cuadernos'
                : `Seleccionar cuadernos (${notebooks.length} disponibles)`}
            </span>
          </button>
          <button
            type="button"
            onClick={() => loadNotebooks(true)}
            disabled={loading}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-light bg-surface-primary text-text-secondary hover:text-text-primary"
            title="Sincronizar cuadernos de Google NotebookLM"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin text-emerald-500')} />
          </button>
        </div>

        {expanded && (
          <div className="mt-2.5 border-t border-border-light pt-2.5">
            {!connected && notebooks.length === 0 && !loading ? (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 text-center text-xs text-amber-700 dark:text-amber-300">
                Conecta tu cuenta de Google NotebookLM desde el botón <strong>G</strong> en la barra
                de chat para ver tus cuadernos.
              </div>
            ) : (
              <>
                <div className="relative mb-2">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-secondary" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar cuaderno..."
                    className="w-full rounded-lg border border-border-light bg-surface-primary py-1.5 pl-8 pr-2.5 text-xs text-text-primary placeholder:text-text-secondary focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div className="max-h-48 space-y-1 overflow-y-auto pr-0.5">
                  {filtered.map((nb) => {
                    const isChecked = assignedIds.includes(nb.id);
                    return (
                      <div
                        key={nb.id}
                        onClick={() => toggleNotebook(nb)}
                        className={cn(
                          'flex cursor-pointer items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5 text-xs transition-all',
                          isChecked
                            ? 'border-emerald-500/40 bg-emerald-500/10 font-medium text-emerald-800 dark:text-emerald-200'
                            : 'border-border-light/60 bg-surface-primary text-text-primary hover:bg-surface-hover',
                        )}
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-2">
                          <div
                            className={cn(
                              'flex h-4 w-4 shrink-0 items-center justify-center rounded border',
                              isChecked
                                ? 'border-emerald-500 bg-emerald-500 text-white'
                                : 'border-border-medium bg-surface-secondary',
                            )}
                          >
                            {isChecked && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="truncate">{nb.title}</div>
                            <div className="text-[10px] text-text-secondary">
                              {nb.sourcesCount} fuente{nb.sourcesCount === 1 ? '' : 's'}
                            </div>
                          </div>
                        </div>
                        {nb.url && (
                          <a
                            href={nb.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-text-secondary hover:text-emerald-500"
                            title="Abrir en NotebookLM"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
                {email && (
                  <div className="mt-1.5 flex items-center justify-between text-[10px] text-text-secondary">
                    <span className="truncate">Cuenta: {email}</span>
                    {saving && <span className="text-emerald-500">Guardando...</span>}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
