import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useRecoilValue } from 'recoil';
import store from '~/store';
import {
  Save, Maximize2, Minimize2, RefreshCw, Plus, Trash2,
  AlertTriangle, ShieldAlert, Zap, ScanSearch, Loader2, Sparkles,
  ChevronDown, Check,
} from 'lucide-react';
import { useAuthContext } from '~/hooks';
import { MatrixRow, ANNEX_C_CRITERIA, detectAnnexCType } from './MatrizIPEVARConstants';
import MatrizIPEVARDashboard from './MatrizIPEVARDashboard';

// ── FilterSelect: dropdown con estilo del sistema (reemplaza <select> nativo) ────────────────
const FilterSelect = ({
  value, onChange, options, placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const selected = value ? options.find(o => o.value === value) : null;

  return (
    <div ref={ref} className="relative z-20">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 h-8 pl-3 pr-2 rounded-xl border border-border-medium bg-surface-primary text-xs text-text-primary hover:border-teal-400 hover:bg-surface-secondary transition-all cursor-pointer min-w-[160px] max-w-[220px]"
      >
        {selected ? (
          <span className="flex-1 text-left truncate text-teal-600 dark:text-teal-400 font-semibold">{selected.label}</span>
        ) : (
          <span className="flex-1 text-left truncate text-text-secondary">{placeholder}</span>
        )}
        <ChevronDown className={`h-3.5 w-3.5 text-text-secondary shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full mt-1.5 left-0 min-w-full w-max max-w-[280px] bg-surface-primary dark:bg-surface-secondary border border-border-medium rounded-xl shadow-2xl overflow-hidden py-1 z-50">
          {/* Opción "Todos" */}
          <button
            type="button"
            onClick={() => { onChange(''); setOpen(false); }}
            className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 transition-colors ${
              !value
                ? 'text-teal-600 dark:text-teal-400 font-bold bg-teal-50 dark:bg-teal-900/20'
                : 'text-text-primary hover:bg-surface-secondary hover:text-teal-600 dark:hover:text-teal-400'
            }`}
          >
            <span className="w-3.5 shrink-0 flex items-center justify-center">
              {!value && <Check className="h-3 w-3" />}
            </span>
            {placeholder}
          </button>
          <div className="my-1 border-t border-border-light" />
          {options.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 transition-colors ${
                value === opt.value
                  ? 'text-teal-600 dark:text-teal-400 font-bold bg-teal-50 dark:bg-teal-900/20'
                  : 'text-text-primary hover:bg-surface-secondary hover:text-teal-600 dark:hover:text-teal-400'
              }`}
            >
              <span className="w-3.5 shrink-0 flex items-center justify-center">
                {value === opt.value && <Check className="h-3 w-3" />}
              </span>
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Selector Anexo C: ND Cualitativo (con estilo del sistema) ─────────────────
const AnnexCSelector = ({ row, onSelect }: { row: MatrixRow; onSelect: (val: number) => void }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const typeKey = detectAnnexCType(row.peligro_clasificacion, row.peligro_descripcion);
  if (!typeKey) return null;
  const entry = ANNEX_C_CRITERIA[typeKey];
  const selected = entry.criteria.find(c => c.value === row.nd_cualitativo);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className="mt-1 w-full relative z-30">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-1 text-[10px] bg-surface-secondary border border-teal-400/40 rounded-lg px-2 py-1 text-text-primary hover:border-teal-500 transition-all cursor-pointer"
      >
        <span className={`flex-1 text-left truncate ${selected ? 'text-teal-600 dark:text-teal-400 font-semibold' : 'text-text-secondary'}`}>
          {selected ? `${selected.label}` : `Anexo C — ${entry.label}`}
        </span>
        <ChevronDown className={`h-3 w-3 text-text-secondary shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full mt-1 left-0 w-72 bg-surface-primary dark:bg-surface-secondary border border-border-medium rounded-xl shadow-2xl overflow-hidden py-1 z-50">
          <p className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest text-text-secondary border-b border-border-light">{entry.label}</p>
          {entry.note && (
            <p className="px-3 py-1.5 text-[9px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200/40 leading-tight">
              ⓘ {entry.note.slice(0, 150)}{entry.note.length > 150 ? '…' : ''}
            </p>
          )}
          {entry.criteria.map(c => (
            <button
              key={c.value}
              type="button"
              onClick={() => { onSelect(c.value); setOpen(false); }}
              className={`w-full text-left px-3 py-2 transition-colors ${
                row.nd_cualitativo === c.value
                  ? 'bg-teal-50 dark:bg-teal-900/20'
                  : 'hover:bg-surface-secondary'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-3.5 shrink-0">{row.nd_cualitativo === c.value && <Check className="h-3 w-3 text-teal-500" />}</span>
                <span className={`text-[10px] font-bold ${
                  c.value === 10 ? 'text-red-600' : c.value === 6 ? 'text-orange-500' :
                  c.value === 2 ? 'text-yellow-600' : 'text-green-600'
                }`}>{c.label}</span>
              </div>
              <p className="text-[9px] text-text-secondary mt-0.5 pl-5 leading-tight">{c.description}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Mini AI Bubble para Textareas ────────────────────────────────────────────
const CellAIBubble = ({ fieldLabel, currentValue, row, token, onResult }: {
  fieldLabel: string; currentValue: string; row: MatrixRow; token?: string; onResult: (v: string) => void;
}) => {
  const [open, setOpen] = useState(false);
  const [instruction, setInstruction] = useState('');
  const [loading, setLoading] = useState(false);

  const apply = async () => {
    if (!instruction.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/live/ai-edit-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          selectedText: currentValue || `[Campo vacío: ${fieldLabel}]`,
          instruction,
          reportSourceData: { currentRow: row, field: fieldLabel },
        }),
      });
      const data = await res.json();
      if (data.editedText) { onResult(data.editedText); setOpen(false); setInstruction(''); }
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="absolute -bottom-1 right-0 flex items-center gap-1 text-[9px] text-teal-500 hover:text-teal-700 font-bold opacity-0 group-hover/cell:opacity-100 transition-opacity"
        type="button"
      >
        <Sparkles className="h-3 w-3" /> IA
      </button>
      {open && (
        <div className="absolute bottom-6 right-0 z-50 w-64 bg-surface-primary border border-border-medium rounded-xl shadow-2xl p-3 space-y-2">
          <p className="text-[10px] font-bold text-text-secondary uppercase">{fieldLabel}</p>
          <input
            autoFocus
            className="w-full text-xs border border-border-medium rounded-lg px-2 py-1.5 bg-surface-primary outline-none focus:border-teal-400"
            placeholder="Instrucción (ej: hazlo más técnico)"
            value={instruction}
            onChange={e => setInstruction(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && apply()}
          />
          <div className="flex gap-2">
            <button onClick={apply} disabled={loading}
              className="flex-1 text-[10px] font-bold bg-teal-500 text-white rounded-lg py-1.5 hover:bg-teal-600 disabled:opacity-50">
              {loading ? <Loader2 className="h-3 w-3 animate-spin mx-auto" /> : 'Aplicar'}
            </button>
            <button onClick={() => setOpen(false)} className="text-[10px] text-text-secondary px-2">✕</button>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Celda Textarea con AI Bubble ──────────────────────────────────────────────
const AITextarea = ({ value, onChange, rows = 2, minW = '180px', placeholder = '', fieldLabel, row, token }: {
  value: string; onChange: (v: string) => void; rows?: number; minW?: string;
  placeholder?: string; fieldLabel: string; row: MatrixRow; token?: string;
}) => (
  <div className="relative group/cell w-full">
    <textarea
      rows={rows}
      className={`w-full min-w-[${minW}] bg-transparent outline-none dark:text-gray-200 resize-y text-sm`}
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
    />
    <CellAIBubble fieldLabel={fieldLabel} currentValue={value} row={row} token={token} onResult={onChange} />
  </div>
);

// ════════════════════════════════════════════════════════════════════════════
export default function MatrizIPEVARTable({ conversationId }: { conversationId: string | null }) {
  const [matrixRows, setMatrixRows] = useState<MatrixRow[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [aiRowLoading, setAiRowLoading] = useState<number | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState('');
  const [chartConclusions, setChartConclusions] = useState<Record<string, string>>({});

  // ── Filters & Sort ──────────────────────────────────────────────────────
  const [filterText, setFilterText] = useState('');
  const [filterProceso, setFilterProceso] = useState('');
  const [filterNivel, setFilterNivel] = useState('');
  const [filterCalificacion, setFilterCalificacion] = useState('');
  const [sortField, setSortField] = useState<'proceso' | 'nr' | 'peligro_clasificacion' | ''>('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const { token } = useAuthContext();
  const conversation = useRecoilValue(store.conversationByIndex(0));
  const actualConvoId = conversation?.conversationId && conversation.conversationId !== 'new'
    ? conversation.conversationId : conversationId;
  const isSubmitting = useRecoilValue(store.isSubmittingFamily(0));

  const fetchMatrix = useCallback(async (id?: string | null) => {
    const targetId = id ?? actualConvoId;
    if (!targetId || targetId === 'new') return;
    try {
      setIsLoading(true);
      const res = await fetch(`/api/sgsst/gtc45-workspace/matrix/${targetId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data?.matrixRows) setMatrixRows(data.matrixRows);
      if (data?.chartConclusions) setChartConclusions(data.chartConclusions);
    } catch (e) { console.error('[Matriz] Fetch error:', e); }
    finally { setIsLoading(false); }
  }, [actualConvoId, token]);

  useEffect(() => {
    if (!actualConvoId || actualConvoId === 'new') return;
    fetchMatrix(actualConvoId);
  }, [actualConvoId]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSubmitting && actualConvoId && actualConvoId !== 'new') {
      interval = setInterval(() => fetchMatrix(actualConvoId), 3000);
    }
    if (!isSubmitting && actualConvoId && actualConvoId !== 'new') fetchMatrix(actualConvoId);
    return () => clearInterval(interval);
  }, [isSubmitting, actualConvoId]);

  const saveMatrixData = async (rows: MatrixRow[]) => {
    if (!actualConvoId || actualConvoId === 'new') return;
    try {
      setIsSaving(true);
      await fetch(`/api/sgsst/gtc45-workspace/matrix/${actualConvoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ matrixRows: rows }),
      });
    } catch (e) { console.error('[Matriz] Save error:', e); }
    finally { setIsSaving(false); }
  };

  const handleCellChange = (index: number, field: keyof MatrixRow, value: any) => {
    const newRows = [...matrixRows];
    // @ts-ignore
    newRows[index][field] = value;
    if (['nd', 'ne', 'nc'].includes(field as string)) {
      const row = newRows[index];
      row.np = (Number(row.nd) || 0) * (Number(row.ne) || 0);
      row.nr = row.np * (Number(row.nc) || 0);
      if (row.nr >= 500) { row.interpretacion_nr = 'I'; row.aceptabilidad = 'No Aceptable'; }
      else if (row.nr >= 150) { row.interpretacion_nr = 'II'; row.aceptabilidad = 'No Aceptable o Aceptable con Control Específico'; }
      else if (row.nr >= 40) { row.interpretacion_nr = 'III'; row.aceptabilidad = 'Mejorable'; }
      else { row.interpretacion_nr = 'IV'; row.aceptabilidad = 'Aceptable'; }
    }
    setMatrixRows(newRows);
  };

  const addRow = () => {
    const newRow: MatrixRow = {
      proceso: '', zona: '', actividad: '', tareas: '', rutinaria: 'Sí',
      peligro_descripcion: '', peligro_clasificacion: '', efectos_posibles: '',
      controles_fuente: 'Ninguno', controles_medio: 'Ninguno', controles_individuo: 'Ninguno',
      nd: 0, ne: 0, np: 0, nc: 0, nr: 0, interpretacion_nr: '', aceptabilidad: '',
      medida_eliminacion: 'Ninguno', medida_sustitucion: 'Ninguno', medida_ingenieria: 'Ninguno',
      medida_administrativa: 'Ninguno', medida_eppu: 'Ninguno',
      factores_reduccion: 'No aplica', nd_cualitativo: null,
    };
    setMatrixRows(prev => [...prev, newRow]);
  };

  const removeRow = (index: number) => {
    const newRows = matrixRows.filter((_, i) => i !== index);
    setMatrixRows(newRows);
    saveMatrixData(newRows);
  };

  // ── AI: Actualizar fila ───────────────────────────────────────────────────
  const handleAiUpdateRow = async (index: number) => {
    setAiRowLoading(index);
    try {
      const res = await fetch('/api/sgsst/gtc45-workspace/ai-update-row', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ row: matrixRows[index] }),
      });
      const data = await res.json();
      if (data.updatedFields) {
        const newRows = [...matrixRows];
        newRows[index] = { ...newRows[index], ...data.updatedFields };
        setMatrixRows(newRows);
      }
    } catch (e) { console.error('[Matriz] AI row update error:', e); }
    finally { setAiRowLoading(null); }
  };

  // ── AI: Analizar toda la matriz ───────────────────────────────────────────
  const handleAnalyzeMatrix = async () => {
    if (!matrixRows.length) return;
    setIsAnalyzing(true);
    setAnalysisResult('');
    try {
      const res = await fetch('/api/sgsst/gtc45-workspace/ai-analyze-matrix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ matrixRows }),
      });
      const data = await res.json();
      if (data.analysis) setAnalysisResult(data.analysis);
    } catch (e) { console.error('[Matriz] AI analyze error:', e); }
    finally { setIsAnalyzing(false); }
  };

  // ── Filtered + Sorted display rows ───────────────────────────────────────
  const displayRows = useMemo(() => {
    const getNivel = (nr: number) => nr >= 150 ? 'critico' : nr >= 50 ? 'alto' : nr >= 20 ? 'medio' : 'bajo';
    let rows = matrixRows.map((row, idx) => ({ row, idx }));

    if (filterText) {
      const q = filterText.toLowerCase();
      rows = rows.filter(({ row }) =>
        [row.proceso, row.actividad, row.peligro_clasificacion, row.peligro_descripcion, row.efectos_posibles]
          .some(f => f?.toLowerCase().includes(q))
      );
    }
    if (filterProceso) rows = rows.filter(({ row }) => row.proceso === filterProceso);
    if (filterNivel) rows = rows.filter(({ row }) => getNivel(Number(row.nr) || 0) === filterNivel);
    if (filterCalificacion) rows = rows.filter(({ row }) => row.interpretacion_nr === filterCalificacion);

    if (sortField) {
      rows.sort((a, b) => {
        const va = sortField === 'nr' ? Number(a.row.nr) : String(a.row[sortField as keyof MatrixRow] || '');
        const vb = sortField === 'nr' ? Number(b.row.nr) : String(b.row[sortField as keyof MatrixRow] || '');
        // @ts-ignore
        return sortDir === 'asc' ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
      });
    }
    return rows;
  }, [matrixRows, filterText, filterProceso, filterNivel, filterCalificacion, sortField, sortDir]);

  const procesosUnicos = useMemo(() => [...new Set(matrixRows.map(r => r.proceso).filter(Boolean))], [matrixRows]);

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const SortIcon = ({ field }: { field: typeof sortField }) =>
    sortField === field ? <span className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span> : <span className="ml-1 opacity-30">↕</span>;

  // ── Guard: no convo ───────────────────────────────────────────────────────
  if (!actualConvoId || actualConvoId === 'new') {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center bg-surface-primary border-l border-border-light">
        <div className="mb-4 rounded-full bg-surface-tertiary p-4 border border-border-medium shadow-sm">
          <AlertTriangle className="h-8 w-8 text-yellow-500" />
        </div>
        <h3 className="mb-2 text-lg font-semibold text-text-primary">Matriz Inactiva</h3>
        <p className="text-sm text-text-secondary max-w-sm">
          Envía el primer mensaje en el chat para instanciar la matriz IPEVAR. Los riesgos se guardarán automáticamente aquí.
        </p>
      </div>
    );
  }

  const nrColorClass = (nr: number) => {
    if (nr >= 500) return 'text-red-700 dark:text-red-400';
    if (nr >= 150) return 'text-red-500 dark:text-red-400';
    if (nr >= 50) return 'text-orange-500';
    if (nr >= 20) return 'text-yellow-500';
    return 'text-green-500';
  };

  return (
    <div className={`flex flex-col h-full bg-surface-primary transition-all duration-300 border-l border-border-light ${isMaximized ? 'fixed inset-0 z-[9999] backdrop-blur-xl' : 'w-full'}`}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-border-light bg-surface-secondary px-4 py-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/10 text-teal-600 border border-teal-500/20 shadow-sm">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-text-primary">Matriz IPEVAR Live</h2>
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs text-text-secondary">Sincronización Activa</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isLoading && <RefreshCw className="h-4 w-4 animate-spin text-text-secondary" />}

          {/* Analizar Matriz Completa */}
          <button onClick={handleAnalyzeMatrix} disabled={isAnalyzing || matrixRows.length === 0}
            className="group flex items-center justify-center p-2 h-[38px] bg-surface-primary border-2 border-purple-500/60 rounded-[18px] text-purple-600 dark:text-purple-400 transition-all duration-300 shadow-sm hover:bg-purple-50 dark:hover:bg-purple-900/20 cursor-pointer disabled:opacity-50">
            {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin shrink-0" /> : <ScanSearch className="h-4 w-4 shrink-0" />}
            <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 transition-all duration-300 whitespace-nowrap group-hover:ml-2 font-bold text-[13px]">
              {isAnalyzing ? 'Analizando…' : 'Analizar Matriz con IA'}
            </span>
          </button>

          {/* Guardar */}
          <button onClick={() => saveMatrixData(matrixRows)}
            className="group flex items-center justify-center p-2 h-[38px] bg-[#f8f9f8] border-2 border-[#129A61] rounded-[18px] text-[#129A61] transition-all duration-300 shadow-sm hover:bg-[#f0f9f3] cursor-pointer">
            <Save className="h-4 w-4 stroke-[2.5] shrink-0" />
            <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 transition-all duration-300 whitespace-nowrap group-hover:ml-2 font-bold text-[14px]">
              {isSaving ? 'Guardando…' : 'Guardar'}
            </span>
          </button>

          {/* Maximizar */}
          <button onClick={() => setIsMaximized(m => !m)}
            className="group flex items-center justify-center p-2 h-[38px] bg-[#f8f9f8] border-2 border-border-medium/80 rounded-[18px] text-text-secondary transition-all duration-300 shadow-sm hover:bg-white hover:text-text-primary hover:border-border-heavy cursor-pointer">
            {isMaximized ? <Minimize2 className="h-4 w-4 shrink-0 stroke-[2.5]" /> : <Maximize2 className="h-4 w-4 shrink-0 stroke-[2.5]" />}
            <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 transition-all duration-300 whitespace-nowrap group-hover:ml-2 font-bold text-[14px]">
              {isMaximized ? 'Restaurar' : 'Expandir'}
            </span>
          </button>
        </div>
      </div>

      {/* ── Panel: resultado de análisis IA de toda la matriz ────────────────── */}
      {analysisResult && (
        <div className="shrink-0 mx-4 mt-3 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-300/40 rounded-xl text-sm text-text-primary leading-relaxed">
          <p className="text-[10px] font-bold text-purple-600 uppercase tracking-wider mb-1">Análisis IA — Matriz Completa</p>
          {analysisResult}
          <button onClick={() => setAnalysisResult('')} className="mt-2 text-[10px] text-text-secondary hover:text-text-primary">Cerrar ✕</button>
        </div>
      )}


      {/* ── Barra de Filtros ──────────────────────────────────────────────── */}
      <div className="shrink-0 flex flex-wrap items-center gap-2 px-4 py-2.5 bg-surface-secondary border-b border-border-light">
        {/* Búsqueda libre */}
        <div className="relative">
          <input
            type="search"
            placeholder="Buscar en la matriz…"
            value={filterText}
            onChange={e => setFilterText(e.target.value)}
            className="text-xs h-8 pl-7 pr-3 rounded-xl border border-border-medium bg-surface-primary outline-none focus:border-teal-400 transition-colors min-w-[170px] placeholder:text-text-secondary"
          />
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-secondary text-xs pointer-events-none">🔍</span>
        </div>

        {/* Filtro Proceso */}
        <FilterSelect
          value={filterProceso}
          onChange={setFilterProceso}
          placeholder="Todos los procesos"
          options={procesosUnicos.map(p => ({ value: p, label: p }))}
        />

        {/* Filtro Nivel NR */}
        <FilterSelect
          value={filterNivel}
          onChange={setFilterNivel}
          placeholder="Todos los niveles"
          options={[
            { value: 'critico', label: '🔴 Crítico (NR ≥ 150)' },
            { value: 'alto',    label: '🟠 Alto (NR ≥ 50)' },
            { value: 'medio',   label: '🟡 Mejorable (NR ≥ 20)' },
            { value: 'bajo',    label: '🟢 Aceptable (NR < 20)' },
          ]}
        />

        {/* Filtro Calificación */}
        <FilterSelect
          value={filterCalificacion}
          onChange={setFilterCalificacion}
          placeholder="Todas las calificaciones"
          options={[
            { value: 'I',   label: '🔴 Nivel I — No Aceptable' },
            { value: 'II',  label: '🟠 Nivel II — Aceptable con control' },
            { value: 'III', label: '🟡 Nivel III — Mejorable' },
            { value: 'IV',  label: '🟢 Nivel IV — Aceptable' },
          ]}
        />

        {/* Limpiar filtros */}
        {(filterText || filterProceso || filterNivel || filterCalificacion) && (
          <button
            onClick={() => { setFilterText(''); setFilterProceso(''); setFilterNivel(''); setFilterCalificacion(''); }}
            className="flex items-center gap-1 text-xs h-8 px-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-100 transition-colors cursor-pointer font-medium"
          >
            ✕ Limpiar
            <span className="px-1.5 py-0.5 rounded-full bg-red-600 text-white text-[9px] font-black">
              {[filterText, filterProceso, filterNivel, filterCalificacion].filter(Boolean).length}
            </span>
          </button>
        )}
        <span className="ml-auto text-xs text-text-secondary font-medium tabular-nums">
          {displayRows.length} / {matrixRows.length} riesgos
        </span>
      </div>


      {/* ── Tabla ──────────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto">
        {matrixRows.length === 0 && !isLoading ? (
          <div className="flex h-48 flex-col items-center justify-center gap-3 text-text-secondary">
            <ShieldAlert className="h-10 w-10 opacity-20" />
            <p className="text-sm">Aún no hay riesgos en la matriz. Pídele al Experto IPEVAR que los registre.</p>
          </div>
        ) : (
          <div className="min-w-max">
            <table className="w-full text-sm border-collapse">
              <thead className="sticky top-0 z-10 bg-surface-secondary text-xs font-bold text-text-secondary uppercase tracking-wide">
                <tr>
                  {/* Identificación */}
                  <th className="px-4 py-3 text-left cursor-pointer hover:text-teal-600 min-w-[150px]" onClick={() => toggleSort('proceso')}>
                    PROCESO <SortIcon field="proceso" />
                  </th>
                  <th className="px-4 py-3 text-left min-w-[130px]">ZONA</th>
                  <th className="px-4 py-3 text-left min-w-[160px]">ACTIVIDAD</th>
                  <th className="px-4 py-3 text-left min-w-[200px]">TAREAS</th>
                  <th className="px-4 py-3 text-center min-w-[90px]">RUTINARIA</th>
                  {/* Peligro */}
                  <th className="px-4 py-3 text-left min-w-[220px] border-l-2 border-teal-500/20">PELIGRO DESC.</th>
                  <th className="px-4 py-3 text-left min-w-[150px] cursor-pointer hover:text-teal-600" onClick={() => toggleSort('peligro_clasificacion')}>
                    CLASIFICACIÓN <SortIcon field="peligro_clasificacion" />
                  </th>
                  <th className="px-4 py-3 text-left min-w-[220px]">EFECTOS POSIBLES</th>
                  {/* Controles Existentes */}
                  <th className="px-4 py-3 text-left min-w-[180px] border-l-2 border-blue-500/20 text-blue-700 dark:text-blue-400">CTRL. FUENTE</th>
                  <th className="px-4 py-3 text-left min-w-[180px] text-blue-700 dark:text-blue-400">CTRL. MEDIO</th>
                  <th className="px-4 py-3 text-left min-w-[180px] text-blue-700 dark:text-blue-400">CTRL. INDIVIDUO</th>
                  {/* Evaluación */}
                  <th className="px-4 py-3 text-center min-w-[80px] border-l-2 border-purple-500/20 text-purple-700 dark:text-purple-400">ND</th>
                  <th className="px-4 py-3 text-center min-w-[60px] text-purple-700 dark:text-purple-400">NE</th>
                  <th className="px-4 py-3 text-center min-w-[60px] text-purple-700 dark:text-purple-400">NP</th>
                  <th className="px-4 py-3 text-center min-w-[60px] text-purple-700 dark:text-purple-400">NC</th>
                  <th className="px-4 py-3 text-center min-w-[70px] border-l-2 border-orange-500/20 text-orange-700 dark:text-orange-400 cursor-pointer hover:text-orange-500" onClick={() => toggleSort('nr')}>
                    NR <SortIcon field="nr" />
                  </th>
                  {/* Medidas */}
                  <th className="px-4 py-3 text-left min-w-[200px] border-l-2 border-emerald-500/20 text-emerald-700 dark:text-emerald-400">ELIMINACIÓN</th>
                  <th className="px-4 py-3 text-left min-w-[200px] text-emerald-700 dark:text-emerald-400">SUSTITUCIÓN</th>
                  <th className="px-4 py-3 text-left min-w-[200px] text-emerald-700 dark:text-emerald-400">INGENIERÍA</th>
                  <th className="px-4 py-3 text-left min-w-[220px] text-emerald-700 dark:text-emerald-400">ADMINISTRATIVOS</th>
                  <th className="px-4 py-3 text-left min-w-[180px] text-emerald-700 dark:text-emerald-400">EPP</th>
                  {/* Anexo E */}
                  <th className="px-4 py-3 text-left min-w-[220px] border-l-2 border-purple-400/30 text-purple-700 dark:text-purple-400 bg-purple-50/50 dark:bg-purple-900/10">
                    FACTORES REDUCCIÓN (Anexo E)
                  </th>
                  {/* Acciones */}
                  <th className="px-4 py-3 text-center min-w-[100px] sticky right-0 bg-surface-secondary">ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {displayRows.map(({ row, idx }) => (
                  <tr key={idx} className="group border-b border-border-light hover:bg-surface-secondary/50 transition-colors">
                    {/* Proceso */}
                    <td className="px-4 py-3"><textarea rows={2} className="w-full min-w-[140px] bg-transparent outline-none dark:text-gray-200 resize-y" value={row.proceso || ''} onChange={e => handleCellChange(idx, 'proceso', e.target.value)} /></td>
                    <td className="px-4 py-3"><textarea rows={2} className="w-full min-w-[120px] bg-transparent outline-none dark:text-gray-200 resize-y" value={row.zona || ''} onChange={e => handleCellChange(idx, 'zona', e.target.value)} /></td>
                    <td className="px-4 py-3"><textarea rows={2} className="w-full min-w-[150px] bg-transparent outline-none dark:text-gray-200 resize-y" value={row.actividad || ''} onChange={e => handleCellChange(idx, 'actividad', e.target.value)} /></td>
                    <td className="px-4 py-3"><textarea rows={2} className="w-full min-w-[190px] bg-transparent outline-none dark:text-gray-200 resize-y" value={row.tareas || ''} onChange={e => handleCellChange(idx, 'tareas', e.target.value)} /></td>

                    {/* Rutinaria toggle */}
                    <td className="px-4 py-3 text-center align-middle">
                      <button onClick={() => handleCellChange(idx, 'rutinaria', row.rutinaria === 'Sí' ? 'No' : 'Sí')}
                        className={`px-3 py-1 rounded-full text-xs font-bold border-2 transition-all ${row.rutinaria === 'Sí' ? 'bg-teal-50 border-teal-400 text-teal-700' : 'bg-surface-tertiary border-border-medium text-text-secondary'}`}>
                        {row.rutinaria}
                      </button>
                    </td>

                    {/* Peligro */}
                    <td className="px-4 py-3 border-l border-border-light">
                      <AITextarea value={row.peligro_descripcion || ''} onChange={v => handleCellChange(idx, 'peligro_descripcion', v)} minW="210px" fieldLabel="Descripción del Peligro" row={row} token={token} />
                    </td>
                    <td className="px-4 py-3"><textarea rows={2} className="w-full min-w-[140px] bg-transparent outline-none dark:text-gray-200 resize-y" value={row.peligro_clasificacion || ''} onChange={e => handleCellChange(idx, 'peligro_clasificacion', e.target.value)} /></td>
                    <td className="px-4 py-3">
                      <AITextarea value={row.efectos_posibles || ''} onChange={v => handleCellChange(idx, 'efectos_posibles', v)} minW="210px" fieldLabel="Efectos Posibles" row={row} token={token} />
                    </td>

                    {/* Controles existentes */}
                    <td className="px-4 py-3 border-l border-border-light bg-blue-500/5">
                      <AITextarea value={row.controles_fuente || ''} onChange={v => handleCellChange(idx, 'controles_fuente', v)} minW="170px" fieldLabel="Controles en la Fuente" row={row} token={token} />
                    </td>
                    <td className="px-4 py-3 bg-blue-500/5">
                      <AITextarea value={row.controles_medio || ''} onChange={v => handleCellChange(idx, 'controles_medio', v)} minW="170px" fieldLabel="Controles en el Medio" row={row} token={token} />
                    </td>
                    <td className="px-4 py-3 bg-blue-500/5">
                      <AITextarea value={row.controles_individuo || ''} onChange={v => handleCellChange(idx, 'controles_individuo', v)} minW="170px" fieldLabel="Controles en el Individuo" row={row} token={token} />
                    </td>

                    {/* Evaluación cuantitativa — ND con Anexo C inline */}
                    <td className="px-4 py-3 border-l border-border-light bg-purple-500/5 align-top">
                      <input type="number" className="w-14 text-center bg-transparent outline-none font-mono" value={row.nd} onChange={e => handleCellChange(idx, 'nd', e.target.value)} />
                      <AnnexCSelector row={row} onSelect={v => { handleCellChange(idx, 'nd_cualitativo', v); handleCellChange(idx, 'nd', v); }} />
                    </td>
                    <td className="px-4 py-3 bg-purple-500/5"><input type="number" className="w-12 text-center bg-transparent outline-none font-mono" value={row.ne} onChange={e => handleCellChange(idx, 'ne', e.target.value)} /></td>
                    <td className="px-4 py-3 font-bold text-center text-purple-600 dark:text-purple-400 bg-purple-500/5">{row.np}</td>
                    <td className="px-4 py-3 bg-purple-500/5"><input type="number" className="w-12 text-center bg-transparent outline-none font-mono" value={row.nc} onChange={e => handleCellChange(idx, 'nc', e.target.value)} /></td>
                    <td className={`px-4 py-3 text-center font-black border-l-2 border-orange-500/20 bg-orange-500/5 align-middle ${nrColorClass(Number(row.nr))}`}>
                      <div className="text-base">{row.nr}</div>
                      <div className="text-[9px] font-normal text-current opacity-70">{row.interpretacion_nr}</div>
                    </td>

                    {/* Medidas propuestas */}
                    <td className="px-4 py-3 bg-emerald-500/5 border-l-2 border-emerald-500/20">
                      <AITextarea value={row.medida_eliminacion || ''} onChange={v => handleCellChange(idx, 'medida_eliminacion', v)} minW="190px" fieldLabel="Medida: Eliminación" row={row} token={token} />
                    </td>
                    <td className="px-4 py-3 bg-emerald-500/5">
                      <AITextarea value={row.medida_sustitucion || ''} onChange={v => handleCellChange(idx, 'medida_sustitucion', v)} minW="190px" fieldLabel="Medida: Sustitución" row={row} token={token} />
                    </td>
                    <td className="px-4 py-3 bg-emerald-500/5">
                      <AITextarea value={row.medida_ingenieria || ''} onChange={v => handleCellChange(idx, 'medida_ingenieria', v)} minW="190px" fieldLabel="Medida: Ingeniería" row={row} token={token} />
                    </td>
                    <td className="px-4 py-3 bg-emerald-500/5">
                      <AITextarea value={row.medida_administrativa || ''} onChange={v => handleCellChange(idx, 'medida_administrativa', v)} minW="210px" fieldLabel="Medida: Administrativos" row={row} token={token} />
                    </td>
                    <td className="px-4 py-3 bg-emerald-500/5">
                      <AITextarea value={row.medida_eppu || ''} onChange={v => handleCellChange(idx, 'medida_eppu', v)} minW="170px" fieldLabel="Medida: EPP" row={row} token={token} />
                    </td>

                    {/* Anexo E — Factores de Reducción */}
                    <td className="px-4 py-3 bg-purple-50/50 dark:bg-purple-900/10 border-l-2 border-purple-400/30">
                      <AITextarea value={row.factores_reduccion || ''} onChange={v => handleCellChange(idx, 'factores_reduccion', v)} minW="210px" fieldLabel="Factores de Reducción (Anexo E)" row={row} token={token} />
                    </td>

                    {/* Acciones */}
                    <td className="px-4 py-3 text-center align-middle sticky right-0 bg-surface-primary border-l border-border-light">
                      <div className="flex flex-col items-center gap-2">
                        <button onClick={() => handleAiUpdateRow(idx)} disabled={aiRowLoading === idx}
                          className="group/btn flex items-center gap-1 px-2 py-1 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 text-yellow-600 text-[10px] font-bold hover:bg-yellow-100 transition-all disabled:opacity-50">
                          {aiRowLoading === idx
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : <Zap className="h-3.5 w-3.5" />}
                          <span>IA</span>
                        </button>
                        <button onClick={() => removeRow(idx)}
                          className="p-1.5 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 rounded-md">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="border-t border-border-light bg-surface-tertiary px-4 py-2">
          <button onClick={addRow} className="flex items-center gap-2 text-xs font-medium text-text-secondary hover:text-text-primary transition-colors">
            <Plus className="h-3 w-3" /> Añadir Fila
          </button>
        </div>
      </div>

      {/* ── Dashboard analítico ─────────────────────────────────────────────── */}
      <div className="shrink-0 border-t border-border-light bg-surface-primary px-4 py-2 overflow-y-auto max-h-[60vh]">
        <MatrizIPEVARDashboard
          matrixRows={matrixRows}
          conversationId={actualConvoId}
          token={token || ''}
          savedConclusions={chartConclusions}
          onConclusionSaved={(type, text) => setChartConclusions(prev => ({ ...prev, [type]: text }))}
        />
      </div>

    </div>
  );
}
