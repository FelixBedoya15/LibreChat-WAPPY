import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Trello, 
  Plus, 
  Trash2, 
  Calendar, 
  User, 
  AlertTriangle, 
  CheckCircle2, 
  ExternalLink, 
  ChevronDown, 
  ChevronRight,
  Send,
  Loader2,
  Sparkles,
  ShieldCheck,
  ListTodo
} from 'lucide-react';
import { Button, useToastContext } from '@librechat/client';
import { useAuthContext } from '~/hooks';
import { cn } from '~/utils';

export interface ActionPlanItem {
  id?: string;
  title: string;
  description?: string;
  responsible?: string;
  dueDate?: string;
  priority?: 'alta' | 'media' | 'baja';
  actionType?: 'correctiva' | 'preventiva' | 'mejora';
  type?: string;
  status?: 'todo' | 'done';
}

interface AcpmActionPlanBoxProps {
  sourceModule: string;
  sourceTitle: string;
  initialActions?: ActionPlanItem[];
  defaultExpanded?: boolean;
  onActionsDispatched?: (count: number) => void;
  className?: string;
}

export default function AcpmActionPlanBox({
  sourceModule,
  sourceTitle,
  initialActions = [],
  defaultExpanded = true,
  onActionsDispatched,
  className = '',
}: AcpmActionPlanBoxProps) {
  const { token } = useAuthContext();
  const { showToast } = useToastContext();

  const [isExpanded, setIsExpanded] = useState<boolean>(defaultExpanded);
  const [actions, setActions] = useState<ActionPlanItem[]>(initialActions);
  const [isDispatching, setIsDispatching] = useState<boolean>(false);
  const [dispatchedSuccess, setDispatchedSuccess] = useState<boolean>(false);

  // New item form state
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newResp, setNewResp] = useState('');
  const [newDueDate, setNewDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [newPriority, setNewPriority] = useState<'alta' | 'media' | 'baja'>('media');
  const [newActionType, setNewActionType] = useState<'correctiva' | 'preventiva' | 'mejora'>('correctiva');

  // Sync if initialActions updates from parent (e.g. AI analysis generated actions)
  useEffect(() => {
    if (initialActions && initialActions.length > 0) {
      setActions(prev => {
        // Keep user additions, add new ones from parent
        const existingTitles = new Set(prev.map(p => p.title.trim().toLowerCase()));
        const toAdd = initialActions.filter(ia => !existingTitles.has(ia.title.trim().toLowerCase()));
        return [...prev, ...toAdd];
      });
    }
  }, [initialActions]);

  const handleAddAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      showToast({ message: 'El título de la acción es obligatorio', status: 'warning' });
      return;
    }

    const newItem: ActionPlanItem = {
      id: `act-${Date.now()}`,
      title: newTitle.trim(),
      description: newDesc.trim(),
      responsible: newResp.trim(),
      dueDate: newDueDate,
      priority: newPriority,
      actionType: newActionType,
      status: 'todo',
    };

    setActions(prev => [...prev, newItem]);
    setNewTitle('');
    setNewDesc('');
    setNewResp('');
    setShowAddForm(false);
    showToast({ message: 'Acción agregada al plan', status: 'success' });
  };

  const handleRemoveAction = (idx: number) => {
    setActions(prev => prev.filter((_, i) => i !== idx));
  };

  const handleDispatchToCentroControl = async () => {
    if (actions.length === 0) {
      showToast({ message: 'No hay acciones en el plan para enviar', status: 'warning' });
      return;
    }

    try {
      setIsDispatching(true);

      const resolveTaskType = (mod: string, itemType?: string) => {
        if (itemType) return itemType;
        if (mod === 'auditoria') return 'audit_finding';
        if (mod === 'diagnostico') return 'diagnostico_finding';
        if (mod === 'alta_direccion') return 'alta_direccion_finding';
        if (mod === 'reporte_actos') return 'unsafe_act_finding';
        if (mod === 'ipevar' || mod === 'gtc45') return 'ipevar_finding';
        if (mod === 'atel') return 'atel_finding';
        if (mod === 'ats') return 'ats_finding';
        if (mod === 'alturas') return 'alturas_finding';
        if (mod === 'ergonomia' || mod === 'owas') return 'ergonomia_finding';
        if (mod === 'vulnerabilidad') return 'vulnerabilidad_finding';
        if (mod === 'pesv') return 'pesv_inspection_finding';
        return `${mod}_finding`;
      };

      const payload = {
        sourceModule,
        actions: actions.map(a => ({
          title: a.title,
          description: a.description || `Acción formulada desde ${sourceTitle}`,
          dueDate: a.dueDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
          type: resolveTaskType(sourceModule, a.type),
          priority: a.priority || 'media',
          actionType: a.actionType || 'correctiva',
          assignedTo: a.responsible || '',
          referenceId: a.id ? `${sourceModule}-${a.id}` : `${sourceModule}-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          referenceName: sourceTitle,
          sourceModule,
        }))
      };

      const res = await axios.post('/api/sgsst/kanban/dispatch-actions', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data?.success) {
        setDispatchedSuccess(true);
        showToast({
          message: `¡${res.data.count} acciones despachadas con éxito al Centro de Control!`,
          status: 'success',
          severity: 'success'
        });
        if (onActionsDispatched) {
          onActionsDispatched(res.data.count);
        }
      }
    } catch (err: any) {
      console.error('[AcpmActionPlanBox] Dispatch error:', err);
      showToast({
        message: err.response?.data?.error || 'Error al despachar acciones al Centro de Control',
        status: 'error'
      });
    } finally {
      setIsDispatching(false);
    }
  };

  return (
    <div className={cn(
      "w-full rounded-2xl border transition-all duration-300 overflow-hidden shadow-sm",
      "bg-gradient-to-b from-surface-primary/95 to-surface-secondary/60 dark:from-gray-900/90 dark:to-gray-950/70 border-teal-500/20 dark:border-teal-500/10",
      className
    )}>
      {/* Header Bar */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between p-4 px-5 bg-teal-500/[0.04] dark:bg-teal-500/[0.02] cursor-pointer hover:bg-teal-500/[0.08] transition-colors border-b border-border-light dark:border-white/5"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
            <Trello className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                Plan de Acción ACPM · {sourceTitle}
              </h3>
              <span className="inline-flex items-center px-2 py-0.2 rounded-full text-[10px] font-extrabold bg-teal-500/15 text-teal-700 dark:text-teal-300">
                {actions.length} {actions.length === 1 ? 'Acción' : 'Acciones'}
              </span>
            </div>
            <p className="text-xs text-text-secondary mt-0.5">
              Formulación de acciones preventivas, correctivas o de mejora para el Centro de Control (Decreto 1072 Art. 2.2.4.6.33).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {actions.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDispatchToCentroControl();
              }}
              disabled={isDispatching}
              title="Despachar acciones a Kanban"
              aria-label="Despachar a Kanban"
              className="group hidden sm:flex h-8 min-w-[32px] shrink-0 cursor-pointer items-center justify-center rounded-xl border border-teal-600/30 bg-gradient-to-r from-teal-600 to-emerald-600 px-2 text-white shadow-sm outline-none transition-all duration-300 hover:scale-105 hover:from-teal-500 hover:to-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <div className="relative flex shrink-0 items-center justify-center">
                {isDispatching ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                ) : (
                  <Send className="w-3.5 h-3.5 text-white" />
                )}
              </div>
              <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-1.5 group-hover:max-w-[160px] group-hover:opacity-100 sm:flex">
                <span className="text-xs font-bold tracking-wide">Despachar a Kanban</span>
              </div>
            </button>
          )}

          <div className="p-1 rounded-lg text-text-secondary hover:text-text-primary">
            {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-5 flex flex-col gap-4">
          {/* Actions List */}
          {actions.length === 0 ? (
            <div className="p-6 text-center rounded-xl bg-surface-secondary/40 border border-dashed border-border-medium/40 flex flex-col items-center justify-center gap-2">
              <ListTodo className="w-8 h-8 text-text-secondary/60" />
              <p className="text-xs text-text-secondary font-medium">
                No hay acciones registradas en este plan. Agrega una acción manual o utiliza el generador asistido por IA.
              </p>
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                title="Agregar Primera Acción"
                aria-label="Agregar Primera Acción"
                className="group mt-1 flex h-8 min-w-[32px] shrink-0 cursor-pointer items-center justify-center rounded-xl border border-teal-500/30 bg-surface-primary px-2 text-teal-600 shadow-xs outline-none transition-all duration-300 hover:scale-105 hover:bg-teal-50/50 hover:border-teal-500/50 dark:text-teal-400 dark:hover:bg-teal-950/30 sm:h-9 sm:min-w-[36px] sm:px-2.5"
              >
                <div className="relative flex shrink-0 items-center justify-center">
                  <Plus className="h-4 w-4" />
                </div>
                <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[180px] group-hover:opacity-100 sm:flex">
                  <span className="text-xs font-bold tracking-wide">Agregar Primera Acción</span>
                </div>
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {actions.map((act, idx) => (
                <div 
                  key={act.id || idx}
                  className="p-3.5 rounded-xl bg-surface-primary/80 dark:bg-gray-800/60 border border-border-light dark:border-white/5 hover:border-teal-500/30 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-text-primary">
                        {act.title}
                      </span>
                      {act.priority && (
                        <span className={cn(
                          "text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-full border",
                          act.priority === 'alta' ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400" :
                          act.priority === 'baja' ? "bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400" :
                          "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400"
                        )}>
                          {act.priority}
                        </span>
                      )}
                      {act.actionType && (
                        <span className="text-[9px] font-semibold capitalize px-1.5 py-0.2 rounded-full bg-surface-secondary text-text-secondary border border-border-medium/30">
                          {act.actionType}
                        </span>
                      )}
                    </div>

                    {act.description && (
                      <p className="text-xs text-text-secondary mt-1 line-clamp-2">
                        {act.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 mt-2 text-[11px] text-text-secondary flex-wrap">
                      {act.responsible && (
                        <span className="inline-flex items-center gap-1">
                          <User className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                          {act.responsible}
                        </span>
                      )}
                      {act.dueDate && (
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                          Límite: {act.dueDate}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      onClick={() => handleRemoveAction(idx)}
                      className="p-1.5 rounded-lg text-text-secondary hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                      title="Eliminar acción"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add Action Form */}
          {showAddForm ? (
            <form onSubmit={handleAddAction} className="p-4 rounded-xl bg-surface-secondary/50 border border-teal-500/20 flex flex-col gap-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
                  Nueva Acción para el Centro de Control
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-xs text-text-secondary hover:text-text-primary"
                >
                  Cancelar
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <label className="text-[11px] font-semibold text-text-secondary block mb-1">
                    Acción / Medida a Implementar *
                  </label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Ej. Rediseño ergonómico de estación de empaque / Mantenimiento correctivo de línea de vida"
                    className="w-full text-xs px-3 py-2 rounded-xl bg-surface-primary border border-border-medium/50 text-text-primary focus:outline-hidden focus:ring-2 focus:ring-teal-500/30"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-[11px] font-semibold text-text-secondary block mb-1">
                    Descripción / Causa / Justificación
                  </label>
                  <textarea
                    rows={2}
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Detalles sobre por qué se implementa y controles específicos a aplicar..."
                    className="w-full text-xs px-3 py-2 rounded-xl bg-surface-primary border border-border-medium/50 text-text-primary focus:outline-hidden focus:ring-2 focus:ring-teal-500/30"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-text-secondary block mb-1">
                    Responsable de Ejecución
                  </label>
                  <input
                    type="text"
                    value={newResp}
                    onChange={(e) => setNewResp(e.target.value)}
                    placeholder="Ej. Líder de Mantenimiento / Responsable SST"
                    className="w-full text-xs px-3 py-2 rounded-xl bg-surface-primary border border-border-medium/50 text-text-primary focus:outline-hidden focus:ring-2 focus:ring-teal-500/30"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-text-secondary block mb-1">
                    Fecha Límite
                  </label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl bg-surface-primary border border-border-medium/50 text-text-primary focus:outline-hidden focus:ring-2 focus:ring-teal-500/30"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-text-secondary block mb-1">
                    Prioridad
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="w-full text-xs px-3 py-2 rounded-xl bg-surface-primary border border-border-medium/50 text-text-primary focus:outline-hidden focus:ring-2 focus:ring-teal-500/30"
                  >
                    <option value="alta">Alta (Crítico / No Conforme)</option>
                    <option value="media">Media (Oportunidad de Mejora)</option>
                    <option value="baja">Baja (Preventivo rutinario)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-text-secondary block mb-1">
                    Tipo de Acción
                  </label>
                  <select
                    value={newActionType}
                    onChange={(e) => setNewActionType(e.target.value as any)}
                    className="w-full text-xs px-3 py-2 rounded-xl bg-surface-primary border border-border-medium/50 text-text-primary focus:outline-hidden focus:ring-2 focus:ring-teal-500/30"
                  >
                    <option value="correctiva">Correctiva</option>
                    <option value="preventiva">Preventiva</option>
                    <option value="mejora">Mejora Continua</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-2">
                <button
                  type="submit"
                  title="Confirmar y Guardar Acción"
                  aria-label="Confirmar y Guardar Acción"
                  className="group flex h-8 min-w-[32px] shrink-0 cursor-pointer items-center justify-center rounded-xl border border-teal-600/30 bg-gradient-to-r from-teal-600 to-teal-700 px-2 text-white shadow-sm outline-none transition-all duration-300 hover:scale-105 hover:from-teal-500 hover:to-teal-600 active:scale-95 sm:h-9 sm:min-w-[36px] sm:px-2.5"
                >
                  <div className="relative flex shrink-0 items-center justify-center">
                    <CheckCircle2 className="h-4 w-4 text-white" />
                  </div>
                  <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[220px] group-hover:opacity-100 sm:flex">
                    <span className="text-xs font-bold tracking-wide">Confirmar y Guardar Acción</span>
                  </div>
                </button>
              </div>
            </form>
          ) : (
            <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-border-light dark:border-white/5">
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                title="Agregar Acción al Plan"
                aria-label="Agregar Acción al Plan"
                className="group flex h-8 min-w-[32px] shrink-0 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-surface-secondary px-2 text-text-primary shadow-xs outline-none transition-all duration-300 hover:scale-105 hover:bg-surface-tertiary dark:border-zinc-700 sm:h-9 sm:min-w-[36px] sm:px-2.5"
              >
                <div className="relative flex shrink-0 items-center justify-center">
                  <Plus className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                </div>
                <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[180px] group-hover:opacity-100 sm:flex">
                  <span className="text-xs font-bold tracking-wide">Agregar Acción al Plan</span>
                </div>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDispatchToCentroControl}
                  disabled={isDispatching || actions.length === 0}
                  title={`Despachar ${actions.length} ${actions.length === 1 ? 'Acción' : 'Acciones'} al Centro de Control`}
                  aria-label={`Despachar ${actions.length} ${actions.length === 1 ? 'Acción' : 'Acciones'} al Centro de Control`}
                  className="group flex h-8 min-w-[32px] shrink-0 cursor-pointer items-center justify-center rounded-xl border border-teal-600/30 bg-gradient-to-r from-teal-600 to-emerald-600 px-2 text-white shadow-sm outline-none transition-all duration-300 hover:scale-105 hover:from-teal-500 hover:to-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 sm:h-9 sm:min-w-[36px] sm:px-2.5"
                >
                  <div className="relative flex shrink-0 items-center justify-center">
                    {isDispatching ? (
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                    ) : (
                      <Send className="h-4 w-4 text-white" />
                    )}
                  </div>
                  <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[280px] group-hover:opacity-100 sm:flex">
                    <span className="text-xs font-bold tracking-wide">
                      {isDispatching
                        ? 'Despachando...'
                        : `Despachar ${actions.length} ${actions.length === 1 ? 'Acción' : 'Acciones'} al Centro de Control`}
                    </span>
                  </div>
                </button>

                <a
                  href="/sgsst?tab=acpm"
                  title="Abrir Centro de Control"
                  aria-label="Abrir Centro de Control"
                  className="group flex h-8 min-w-[32px] shrink-0 cursor-pointer items-center justify-center rounded-xl border border-teal-500/30 bg-surface-secondary px-2 text-teal-600 shadow-xs outline-none transition-all duration-300 hover:scale-105 hover:bg-teal-50/50 hover:border-teal-500/50 dark:text-teal-400 dark:hover:bg-teal-950/30 sm:h-9 sm:min-w-[36px] sm:px-2.5"
                >
                  <div className="relative flex shrink-0 items-center justify-center">
                    <ExternalLink className="h-4 w-4" />
                  </div>
                  <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[180px] group-hover:opacity-100 sm:flex">
                    <span className="text-xs font-bold tracking-wide">Abrir Centro de Control</span>
                  </div>
                </a>
              </div>
            </div>
          )}

          {dispatchedSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-between text-xs animate-in fade-in">
              <span className="flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Las acciones han sido integradas al tablero Kanban del Centro de Control (ACPM).
              </span>
              <a
                href="/sgsst?tab=acpm"
                className="font-bold underline flex items-center gap-1 hover:text-emerald-900 dark:hover:text-emerald-200"
              >
                Ver en Kanban <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
