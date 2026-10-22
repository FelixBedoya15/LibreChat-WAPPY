import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Loader2,
  Activity,
  Users,
  Sliders,
  CheckSquare,
  Brain,
  Plus,
  Trash2,
  ExternalLink,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';

export interface TenshiWidgetPayload {
  widgetType:
    | 'hitl_approval'
    | 'kpi_360'
    | 'worker_census'
    | 'risk_calculator'
    | 'inspection_checklist'
    | 'procedural_memory'
    | string;
  title?: string;
  subtitle?: string;
  status?: 'pendiente_aprobacion' | 'aprobada' | 'rechazada' | 'error' | string;
  actionId?: string;
  data?: any;
}

interface TenshiGenerativeWidgetProps {
  widget: TenshiWidgetPayload;
  token?: string;
  onNavigate?: (route: string) => void;
  onStatusUpdated?: (actionId: string, newStatus: string) => void;
  onSendPrompt?: (promptText: string) => void;
}

const ND_OPTIONS = [
  { value: 10, label: '10 · Muy Alto (MA)' },
  { value: 6, label: '6 · Alto (A)' },
  { value: 2, label: '2 · Medio (M)' },
  { value: 0, label: '0 · Bajo (B)' },
];

const NE_OPTIONS = [
  { value: 4, label: '4 · Continua (EC)' },
  { value: 3, label: '3 · Frecuente (EF)' },
  { value: 2, label: '2 · Ocasional (EO)' },
  { value: 1, label: '1 · Esporádica (EE)' },
];

const NC_OPTIONS = [
  { value: 100, label: '100 · Mortal / Catastrófico' },
  { value: 60, label: '60 · Muy Grave' },
  { value: 25, label: '25 · Grave' },
  { value: 10, label: '10 · Leve' },
];

function computeGtc45Level(nr: number) {
  if (nr >= 600) {
    return {
      roman: 'I',
      label: 'I — No Aceptable (Crítico)',
      color: 'bg-red-500/15 text-red-600 dark:text-red-300 border-red-500/40',
      action: 'Suspender actividad hasta reducir el riesgo. Intervención inmediata.',
    };
  }
  if (nr >= 150) {
    return {
      roman: 'II',
      label: 'II — No Aceptable o Aceptable con Control Específico',
      color: 'bg-orange-500/15 text-orange-600 dark:text-orange-300 border-orange-500/40',
      action: 'Corregir y adoptar medidas de control de inmediato.',
    };
  }
  if (nr >= 40) {
    return {
      roman: 'III',
      label: 'III — Mejorable',
      color: 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/40',
      action: 'Mejorar el control existente.',
    };
  }
  return {
    roman: 'IV',
    label: 'IV — Aceptable',
    color: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/40',
    action: 'Mantener las medidas de control existentes.',
  };
}

export const TenshiGenerativeWidget: React.FC<TenshiGenerativeWidgetProps> = ({
  widget,
  token,
  onNavigate,
  onStatusUpdated,
  onSendPrompt,
}) => {
  // ── 1. HITL Approval State ──
  const [hitlStatus, setHitlStatus] = useState<string>(widget?.status || 'pendiente_aprobacion');
  const [hitlLoading, setHitlLoading] = useState<boolean>(false);
  const [hitlFeedback, setHitlFeedback] = useState<string>('');

  // ── 2. Worker Census State ──
  const [workerFilter, setWorkerFilter] = useState<'all' | 'active' | 'retired'>('all');
  const [workerSearch, setWorkerSearch] = useState<string>('');

  // ── 3. GTC-45 Calculator State ──
  const [peligroDesc, setPeligroDesc] = useState<string>(
    widget?.data?.peligro || 'Exposición a ruido / postura prolongada',
  );
  const [procesoCargo, setProcesoCargo] = useState<string>(
    widget?.data?.proceso || 'Operaciones Generales',
  );
  const [nd, setNd] = useState<number>(
    typeof widget?.data?.nd === 'number' ? widget.data.nd : 6,
  );
  const [ne, setNe] = useState<number>(
    typeof widget?.data?.ne === 'number' ? widget.data.ne : 3,
  );
  const [nc, setNc] = useState<number>(
    typeof widget?.data?.nc === 'number' ? widget.data.nc : 25,
  );
  const [savingGtc45, setSavingGtc45] = useState<boolean>(false);
  const [savedGtc45Msg, setSavedGtc45Msg] = useState<string>('');
  const [savedGtc45Error, setSavedGtc45Error] = useState<string>('');

  // ── 4. Inspection Checklist State ──
  const initialChecklist = Array.isArray(widget?.data?.items) ? widget.data.items : [];
  const [checklistItems, setChecklistItems] = useState<
    Array<{ id: string; label: string; checked: boolean }>
  >(initialChecklist);

  // ── 5. Procedural Memory State ──
  const initialMemories =
    Array.isArray(widget?.data?.items) && widget.data.items.length > 0
      ? widget.data.items
      : widget?.data?.latestHabit
        ? [widget.data.latestHabit]
        : [];
  const [memories, setMemories] = useState<Array<any>>(initialMemories);
  const [showNewHabit, setShowNewHabit] = useState<boolean>(false);
  const [newTrigger, setNewTrigger] = useState<string>('');
  const [newRule, setNewRule] = useState<string>('');
  const [savingHabit, setSavingHabit] = useState<boolean>(false);

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  // Sincronizar hábitos vivos desde MongoDB cuando se monta el widget de memoria procedural
  useEffect(() => {
    if (widget?.widgetType !== 'procedural_memory') return;
    let mounted = true;
    axios
      .get('/api/tenshi/procedural-memory', { headers: authHeaders })
      .then((res) => {
        if (!mounted) return;
        if (Array.isArray(res.data) && res.data.length > 0) {
          setMemories(
            res.data.map((h: any) => ({
              id: String(h.id || h._id),
              category: h.category || 'habito_empresa',
              trigger: h.trigger,
              rule: h.rule,
            })),
          );
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [widget?.widgetType, token]);

  if (!widget || !widget.widgetType) return null;

  // ── Handler for Direct GTC-45 Save to Hito 1 (Matriz IPEVR Comunitaria + Matriz Oficial) ──
  const handleSaveGtc45ToHito1 = async () => {
    if (savingGtc45) return;
    setSavingGtc45(true);
    setSavedGtc45Msg('');
    setSavedGtc45Error('');
    try {
      const res = await axios.post(
        '/api/tenshi/gtc45/save-to-hito1',
        {
          peligro: peligroDesc,
          proceso: procesoCargo,
          cargo: procesoCargo,
          nd,
          ne,
          nc,
        },
        { headers: authHeaders },
      );
      if (res.data?.success || res.data?.exito) {
        setSavedGtc45Msg(
          res.data?.mensaje ||
            '✅ Guardado en la Matriz IPEVR Comunitaria y Matriz Oficial GTC-45 (Hito 1).',
        );
        window.dispatchEvent(new CustomEvent('wappy-reload-sgsst-data'));
        window.dispatchEvent(new CustomEvent('ipevar-official-updated'));
      } else {
        setSavedGtc45Error('No se pudo guardar en la matriz del Hito 1.');
      }
    } catch (err: any) {
      setSavedGtc45Error(
        err?.response?.data?.error || err?.message || 'Error al guardar en la Matriz IPEVR.',
      );
    } finally {
      setSavingGtc45(false);
    }
  };

  // ── Handlers for HITL Approval ──
  const handleApproveHitl = async () => {
    const id = widget.actionId || widget.data?.actionId;
    if (!id || hitlLoading) return;
    setHitlLoading(true);
    setHitlFeedback('');
    try {
      const res = await axios.post(`/api/tenshi/governance/${id}/approve`, {}, { headers: authHeaders });
      if (res.data?.success) {
        setHitlStatus('aprobada');
        setHitlFeedback(res.data?.message || 'Operación autorizada y ejecutada exitosamente.');
        onStatusUpdated?.(id, 'aprobada');
        window.dispatchEvent(new CustomEvent('wappy-reload-sgsst-data'));
        window.dispatchEvent(new CustomEvent('ipevar-official-updated'));
      }
    } catch (err: any) {
      setHitlStatus('error');
      setHitlFeedback(
        err?.response?.data?.error || err?.message || 'Error al ejecutar la acción autorizada.',
      );
    } finally {
      setHitlLoading(false);
    }
  };

  const handleRejectHitl = async () => {
    const id = widget.actionId || widget.data?.actionId;
    if (!id || hitlLoading) return;
    setHitlLoading(true);
    setHitlFeedback('');
    try {
      const res = await axios.post(`/api/tenshi/governance/${id}/reject`, {}, { headers: authHeaders });
      if (res.data?.success) {
        setHitlStatus('rechazada');
        setHitlFeedback(res.data?.message || 'Operación cancelada por el usuario.');
        onStatusUpdated?.(id, 'rechazada');
      }
    } catch (err: any) {
      setHitlFeedback(err?.response?.data?.error || err?.message || 'Error al rechazar.');
    } finally {
      setHitlLoading(false);
    }
  };

  // ── Handlers for Procedural Memory ──
  const handleAddHabit = async () => {
    if (!newTrigger.trim() || !newRule.trim() || savingHabit) return;
    setSavingHabit(true);
    try {
      const res = await axios.post(
        '/api/tenshi/procedural-memory',
        { trigger: newTrigger.trim(), rule: newRule.trim(), category: 'habito_empresa' },
        { headers: authHeaders },
      );
      if (res.data?.widget?.data?.items) {
        setMemories(res.data.widget.data.items);
      } else {
        setMemories((prev) => [
          {
            id: String(Date.now()),
            category: 'habito_empresa',
            trigger: newTrigger.trim(),
            rule: newRule.trim(),
          },
          ...prev,
        ]);
      }
      setNewTrigger('');
      setNewRule('');
      setShowNewHabit(false);
    } catch {
      // ignore
    } finally {
      setSavingHabit(false);
    }
  };

  const handleDeleteHabit = async (habitId: string) => {
    try {
      await axios.delete(`/api/tenshi/procedural-memory/${habitId}`, { headers: authHeaders });
      setMemories((prev) => prev.filter((m) => String(m.id) !== String(habitId)));
    } catch {
      // ignore
    }
  };

  // ============================================================================
  // RENDER 1: HUMAN-IN-THE-LOOP GOVERNANCE CARD (`hitl_approval`)
  // ============================================================================
  if (widget.widgetType === 'hitl_approval') {
    const isPending = hitlStatus === 'pendiente_aprobacion';
    const isApproved = hitlStatus === 'aprobada';
    const isRejected = hitlStatus === 'rechazada';

    return (
      <div className="mt-2.5 overflow-hidden rounded-2xl border border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-white/95 to-orange-500/5 p-3.5 shadow-md dark:from-amber-950/40 dark:via-zinc-900/95 dark:to-zinc-900">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-300">
              <ShieldAlert className="h-4 w-4" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Gobernanza SG-SST · Human-in-the-Loop
                </span>
                {widget.data?.module && (
                  <span className="rounded-full bg-slate-200/80 px-2 py-0.5 text-[9px] font-bold text-slate-700 dark:bg-zinc-800 dark:text-zinc-300">
                    {widget.data.module}
                  </span>
                )}
              </div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                {widget.title || 'Autorización de Operación Crítica'}
              </h4>
            </div>
          </div>

          <span
            className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
              isApproved
                ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                : isRejected
                  ? 'bg-red-500/20 text-red-700 dark:text-red-300'
                  : 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
            }`}
          >
            {isApproved
              ? '✅ Aprobada'
              : isRejected
                ? '❌ Rechazada'
                : '⏳ Pendiente'}
          </span>
        </div>

        <p className="mt-2 text-xs text-slate-700 dark:text-zinc-200">
          {widget.subtitle || 'Confirma si deseas aplicar este cambio permanente en la base de datos.'}
        </p>

        {widget.data?.args && Object.keys(widget.data.args).length > 0 && (
          <div className="mt-2 rounded-xl border border-slate-200/80 bg-white/80 p-2 text-[11px] text-slate-600 dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-300">
            <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
              {Object.entries(widget.data.args)
                .filter(([k]) => !k.startsWith('_'))
                .slice(0, 6)
                .map(([k, v]) => (
                  <div key={k} className="truncate">
                    <span className="font-semibold text-slate-500 dark:text-zinc-400">{k}: </span>
                    <span className="font-mono font-bold text-slate-800 dark:text-zinc-200">
                      {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {hitlFeedback && (
          <div
            className={`mt-2 rounded-xl px-2.5 py-1.5 text-[11px] font-medium ${
              isApproved
                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                : 'bg-red-500/15 text-red-700 dark:text-red-300'
            }`}
          >
            {hitlFeedback}
          </div>
        )}

        {isPending && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={hitlLoading}
              onClick={handleApproveHitl}
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white disabled:opacity-60"
            >
              {hitlLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5" />
              )}
              <span>Autorizar y Ejecutar</span>
            </button>

            <button
              type="button"
              disabled={hitlLoading}
              onClick={handleRejectHitl}
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 bg-white dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 shadow-sm disabled:opacity-60"
            >
              <XCircle className="h-3.5 w-3.5 text-red-500" />
              <span>Rechazar</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  // ============================================================================
  // RENDER 2: KPI 360° EXECUTIVE CARD (`kpi_360`)
  // ============================================================================
  if (widget.widgetType === 'kpi_360') {
    const d = widget.data || {};
    const score = Number(d.cumplimiento0312) || 0;

    return (
      <div className="mt-2.5 overflow-hidden rounded-2xl border border-teal-500/30 bg-white/95 p-3.5 shadow-md dark:border-teal-500/25 dark:bg-zinc-900/95">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-300">
              <Activity className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                {widget.title || 'Tablero 360° SG-SST'}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                {widget.subtitle || 'Indicadores en vivo'}
              </p>
            </div>
          </div>
          <span className="rounded-xl bg-teal-500/15 px-2.5 py-1 text-xs font-extrabold text-teal-700 dark:text-teal-300">
            {score.toFixed(1)}% Res. 0312
          </span>
        </div>

        {/* Barra de progreso Res. 0312 */}
        <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-zinc-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-500"
            style={{ width: `${Math.min(100, Math.max(5, score))}%` }}
          />
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200/70 bg-slate-50/70 p-2 dark:border-zinc-800 dark:bg-zinc-800/50">
            <div className="text-[10px] font-semibold text-slate-500 dark:text-zinc-400">
              Trabajadores
            </div>
            <div className="text-sm font-extrabold text-slate-900 dark:text-white">
              {d.trabajadoresActivos ?? 0}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200/70 bg-slate-50/70 p-2 dark:border-zinc-800 dark:bg-zinc-800/50">
            <div className="text-[10px] font-semibold text-slate-500 dark:text-zinc-400">
              Peligros GTC-45
            </div>
            <div className="text-sm font-extrabold text-slate-900 dark:text-white">
              {d.peligrosGtc45 ?? 0}{' '}
              {d.riesgosCriticos > 0 && (
                <span className="text-[10px] font-bold text-red-500">
                  ({d.riesgosCriticos} crít.)
                </span>
              )}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200/70 bg-slate-50/70 p-2 dark:border-zinc-800 dark:bg-zinc-800/50">
            <div className="text-[10px] font-semibold text-slate-500 dark:text-zinc-400">
              Plan de Trabajo
            </div>
            <div className="text-sm font-extrabold text-slate-900 dark:text-white">
              {d.tareasCompletadas ?? 0}/{d.tareasTotales ?? 0}
            </div>
          </div>
        </div>

        {onNavigate && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => onNavigate('/sgsst')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Abrir SG-SST</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('/sgsst/ipevar')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 bg-white dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 shadow-sm"
            >
              <span>Matriz GTC-45</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  // ============================================================================
  // RENDER 3: WORKER CENSUS CARD (`worker_census`)
  // ============================================================================
  if (widget.widgetType === 'worker_census') {
    const allWorkers: Array<any> = Array.isArray(widget.data?.workers) ? widget.data.workers : [];
    const q = workerSearch.trim().toLowerCase();
    const filtered = allWorkers.filter((w) => {
      const statusStr = String(w.status || w.estado || 'Activo');
      if (workerFilter === 'active' && /retirad/i.test(statusStr)) return false;
      if (workerFilter === 'retired' && !/retirad/i.test(statusStr)) return false;
      if (q) {
        const fullName = String(w.nombre_completo || w.nombre || w.name || '').toLowerCase();
        const docId = String(w.documentId || w.cedula || '').toLowerCase();
        const pos = String(w.position || w.cargo || w.area || '').toLowerCase();
        const eps = String(w.eps || '').toLowerCase();
        return fullName.includes(q) || docId.includes(q) || pos.includes(q) || eps.includes(q);
      }
      return true;
    });

    const totalCount = widget.data?.totalRegistrados ?? allWorkers.length;
    const activeCount =
      widget.data?.totalActivos ??
      allWorkers.filter((w) => !/retirad/i.test(String(w.status || w.estado || ''))).length;
    const retiredCount =
      widget.data?.totalRetirados ??
      allWorkers.filter((w) => /retirad/i.test(String(w.status || w.estado || ''))).length;

    return (
      <div className="mt-2.5 overflow-hidden rounded-2xl border border-teal-500/30 bg-white/95 p-3.5 shadow-md dark:border-teal-500/25 dark:bg-zinc-900/95">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-300">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                {widget.title || 'Nómina y Censo de Colaboradores'}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                {widget.subtitle || `${totalCount} colaboradores registrados`}
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-1 rounded-xl bg-slate-100 p-1 dark:bg-zinc-800">
            {(['all', 'active', 'retired'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setWorkerFilter(tab)}
                className={`rounded-lg px-2 py-1 text-[10px] font-bold transition-all ${
                  workerFilter === tab
                    ? 'bg-teal-50 dark:bg-teal-950/50 border border-teal-500 text-teal-600 dark:text-teal-300 font-bold'
                    : 'text-slate-600 dark:text-zinc-400'
                }`}
              >
                {tab === 'all'
                  ? `Todos (${totalCount})`
                  : tab === 'active'
                  ? `Activos (${activeCount})`
                  : `Retirados (${retiredCount})`}
              </button>
            ))}
          </div>
        </div>

        {/* Buscador interactivo en tiempo real */}
        <div className="mt-2.5">
          <input
            type="text"
            value={workerSearch}
            onChange={(e) => setWorkerSearch(e.target.value)}
            placeholder="🔍 Buscar por nombre, cédula, cargo o EPS..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/90 px-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-100"
          />
        </div>

        <div className="mt-2.5 max-h-60 space-y-1.5 overflow-y-auto pr-1">
          {filtered.length === 0 ? (
            <div className="py-4 text-center text-xs text-slate-400 dark:text-zinc-500">
              No se encontraron colaboradores con ese criterio.
            </div>
          ) : (
            filtered.map((w, idx) => {
              const displayName =
                w.nombre_completo ||
                w.nombreCompleto ||
                (w.name && w.name !== 'Colaborador' ? w.name : '') ||
                w.nombre ||
                `Colaborador ${idx + 1}`;
              const docId = w.documentId || w.cedula || 'S/N';
              const areaOrPos = w.area || w.position || w.cargo || 'Operaciones';
              const epsText = w.eps ? ` · EPS: ${w.eps}` : '';
              const statusStr = String(w.status || w.estado || 'Activo');
              const isRetired = /retirad/i.test(statusStr);

              return (
                <div
                  key={w.id || idx}
                  className="flex items-center justify-between gap-2 rounded-xl border border-slate-200/70 bg-slate-50/60 px-2.5 py-2 text-xs transition-colors hover:border-teal-500/40 dark:border-zinc-800 dark:bg-zinc-800/40"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-bold text-slate-800 dark:text-zinc-100">
                      {w.index ?? idx + 1}. {displayName}
                    </div>
                    <div className="truncate text-[10px] text-slate-500 dark:text-zinc-400">
                      CC: {docId} · Área: {areaOrPos}
                      {epsText}
                    </div>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      isRetired
                        ? 'bg-slate-200 text-slate-600 dark:bg-zinc-700 dark:text-zinc-300'
                        : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300'
                    }`}
                  >
                    {isRetired ? 'Retirado' : '✅ Activo'}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {onNavigate && (
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 dark:border-zinc-800">
            <span className="text-[10px] font-semibold text-slate-400 dark:text-zinc-500">
              Mostrando {filtered.length} de {allWorkers.length} colaboradores
            </span>
            <button
              type="button"
              onClick={() => onNavigate('/sgsst?hito=hito2')}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 px-3 py-1.5 text-[11px] font-bold text-white shadow-sm transition-all hover:from-teal-500 hover:to-teal-600 active:scale-95"
            >
              <ExternalLink className="h-3 w-3" />
              <span>Ver en Huella Biocéntrica</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  // ============================================================================
  // RENDER 4: INTERACTIVE GTC-45 RISK SIMULATOR (`risk_calculator`)
  // ============================================================================
  if (widget.widgetType === 'risk_calculator') {
    const np = nd * ne;
    const nr = np * nc;
    const level = computeGtc45Level(nr);

    return (
      <div className="mt-2.5 overflow-hidden rounded-2xl border border-orange-500/30 bg-white/95 p-3.5 shadow-md dark:border-orange-500/25 dark:bg-zinc-900/95">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-500/15 text-orange-600 dark:text-orange-300">
            <Sliders className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
              {widget.title || 'Simulador GTC-45 Interactivo'}
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400">
              Ajusta ND × NE × NC en tiempo real
            </p>
          </div>
        </div>

        <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <input
            type="text"
            value={peligroDesc}
            onChange={(e) => setPeligroDesc(e.target.value)}
            placeholder="Descripción del peligro..."
            className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
          <input
            type="text"
            value={procesoCargo}
            onChange={(e) => setProcesoCargo(e.target.value)}
            placeholder="Proceso o cargo..."
            className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>

        <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 dark:text-zinc-400">
              Nivel Deficiencia (ND)
            </label>
            <select
              value={nd}
              onChange={(e) => setNd(Number(e.target.value))}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold text-slate-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            >
              {ND_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 dark:text-zinc-400">
              Nivel Exposición (NE)
            </label>
            <select
              value={ne}
              onChange={(e) => setNe(Number(e.target.value))}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold text-slate-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            >
              {NE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 dark:text-zinc-400">
              Nivel Consecuencia (NC)
            </label>
            <select
              value={nc}
              onChange={(e) => setNc(Number(e.target.value))}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold text-slate-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            >
              {NC_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={`mt-3 rounded-xl border p-2.5 ${level.color}`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-extrabold">
              NP = {np} · NR = {nr} ({level.label})
            </span>
            <span className="text-[10px] font-semibold">{level.action}</span>
          </div>
        </div>

        {savedGtc45Msg && (
          <div className="mt-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/15 px-3 py-2 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
            {savedGtc45Msg}
          </div>
        )}

        {savedGtc45Error && (
          <div className="mt-2.5 rounded-xl border border-red-500/30 bg-red-500/15 px-3 py-2 text-[11px] font-bold text-red-600 dark:text-red-300">
            {savedGtc45Error}
          </div>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={savingGtc45}
            onClick={handleSaveGtc45ToHito1}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white disabled:opacity-60"
          >
            {savingGtc45 ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            <span>
              {savingGtc45
                ? 'Guardando en Matriz IPEVR...'
                : savedGtc45Msg
                  ? 'Actualizar en Matriz IPEVR (Hito 1)'
                  : 'Guardar en Matriz IPEVR (Hito 1)'}
            </span>
          </button>

          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('/sgsst?hito=hito1')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 bg-white dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 shadow-sm"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Ver en Hito 1</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER 5: INTERACTIVE INSPECTION CHECKLIST (`inspection_checklist`)
  // ============================================================================
  if (widget.widgetType === 'inspection_checklist') {
    const doneCount = checklistItems.filter((i) => i.checked).length;
    const totalCount = checklistItems.length || 1;
    const pct = Math.round((doneCount / totalCount) * 100);

    return (
      <div className="mt-2.5 overflow-hidden rounded-2xl border border-teal-500/30 bg-white/95 p-3.5 shadow-md dark:border-zinc-800 dark:bg-zinc-900/95">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-300">
              <CheckSquare className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                {widget.title || 'Lista de Chequeo Interactiva'}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                {doneCount} de {checklistItems.length} verificados ({pct}%)
              </p>
            </div>
          </div>
        </div>

        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-zinc-800">
          <div
            className="h-full rounded-full bg-teal-500 transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="mt-2.5 space-y-1.5">
          {checklistItems.map((item) => (
            <label
              key={item.id}
              className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-slate-200/70 bg-slate-50/70 px-2.5 py-1.5 text-xs transition-all hover:bg-slate-100 dark:border-zinc-800 dark:bg-zinc-800/40 dark:hover:bg-zinc-800"
            >
              <input
                type="checkbox"
                checked={item.checked}
                onChange={() =>
                  setChecklistItems((prev) =>
                    prev.map((it) => (it.id === item.id ? { ...it, checked: !it.checked } : it)),
                  )
                }
                className="h-3.5 w-3.5 rounded accent-teal-600"
              />
              <span
                className={
                  item.checked
                    ? 'line-through text-slate-400 dark:text-zinc-500'
                    : 'font-medium text-slate-800 dark:text-zinc-200'
                }
              >
                {item.label}
              </span>
            </label>
          ))}
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER 6: PROCEDURAL MEMORY & COMPANY HABITS (`procedural_memory`)
  // ============================================================================
  if (widget.widgetType === 'procedural_memory') {
    return (
      <div className="mt-2.5 overflow-hidden rounded-2xl border border-purple-500/30 bg-white/95 p-3.5 shadow-md dark:border-purple-500/25 dark:bg-zinc-900/95">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-300">
              <Brain className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                {widget.title || 'Memoria Procedural y Hábitos de Empresa'}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                {memories.length} reglas operativas activas en Tenshi
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onNavigate && onNavigate('/kanban?tab=memoria')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-xs shadow-sm transition-all active:scale-95 bg-white dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700"
            >
              <ExternalLink className="h-3.5 w-3.5 text-purple-500" />
              <span>Centro de Control</span>
            </button>
            <button
              type="button"
              onClick={() => setShowNewHabit((v) => !v)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Nuevo Hábito</span>
            </button>
          </div>
        </div>

        {showNewHabit && (
          <div className="mt-2.5 space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-2.5 dark:border-zinc-800 dark:bg-zinc-800/60">
            <input
              type="text"
              value={newTrigger}
              onChange={(e) => setNewTrigger(e.target.value)}
              placeholder="Cuando ocurra... (ej: Se programe trabajo en alturas)"
              className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            />
            <input
              type="text"
              value={newRule}
              onChange={(e) => setNewRule(e.target.value)}
              placeholder="Regla obligatoria... (ej: Exigir curso vigente y revisión de arnés)"
              className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                disabled={savingHabit}
                onClick={handleAddHabit}
                className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
              >
                <span>Guardar Hábito</span>
              </button>
            </div>
          </div>
        )}

        <div className="mt-2.5 max-h-52 space-y-1.5 overflow-y-auto pr-1">
          {memories.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 p-3 text-center text-xs text-slate-400 dark:border-zinc-800">
              Aún no hay hábitos registrados. Dime: &ldquo;Recuerda que siempre que...&rdquo;
            </div>
          ) : (
            memories.map((m) => (
              <div
                key={m.id}
                className="flex items-start justify-between gap-2 rounded-xl border border-slate-200/80 bg-slate-50/70 p-2 text-xs dark:border-zinc-800 dark:bg-zinc-800/40"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-purple-700 dark:text-purple-300">
                    ⚡ Cuando: {m.trigger}
                  </div>
                  <div className="mt-0.5 text-slate-700 dark:text-zinc-200">→ {m.rule}</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteHabit(m.id)}
                  className="group flex h-7 min-w-[28px] items-center justify-center rounded-lg transition-all duration-300 px-1.5 shadow-sm active:scale-95 text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-1 group-hover:max-w-[100px] group-hover:opacity-100 sm:flex">
                    <span className="text-[10px] font-bold">Eliminar</span>
                  </div>
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  return null;
};

export default TenshiGenerativeWidget;
