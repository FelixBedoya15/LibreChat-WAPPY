import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useRecoilValue, useRecoilState } from 'recoil';
import store from '~/store';
import {
  Save, Maximize2, Minimize2, RefreshCw, Plus, Trash2,
  AlertTriangle, ShieldAlert, Zap, ScanSearch, Loader2, Sparkles,
  ChevronDown, Check, FileText as FileTextIcon, History, Upload,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useAuthContext } from '~/hooks';
import { MatrixRow, ANNEX_C_CRITERIA, detectAnnexCType, PSICOSOCIAL_BATTERY } from './MatrizIPEVARConstants';
import MatrizIPEVARDashboard from './MatrizIPEVARDashboard';
import ModelSelector, { AI_MODELS } from './ModelSelector';
import ExportDropdown from './ExportDropdown';
import LiveEditor from '~/components/Liva/Editor/LiveEditor';
import ReportHistory from '~/components/Liva/ReportHistory';
import CollapsibleReportBox from './CollapsibleReportBox';

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
const AnnexCSelector = ({
  row, onSelect, onPsicosocialChange,
}: {
  row: MatrixRow;
  onSelect: (val: number) => void;
  onPsicosocialChange?: (dominio: string, dimension: string, desc: string) => void;
}) => {
  const [open, setOpen] = useState(false);
  const [psiStep, setPsiStep] = useState<'dominio' | 'dimension'>('dominio');
  const [psiDominio, setPsiDominio] = useState<string>(row.psicosocial_dominio || '');
  const ref = useRef<HTMLDivElement>(null);
  const typeKey = detectAnnexCType(row.peligro_clasificacion, row.peligro_descripcion);
  if (!typeKey) return null;
  const entry = ANNEX_C_CRITERIA[typeKey];
  const selected = entry.criteria.find(c => c.value === row.nd_cualitativo);
  const isPsicosocial = typeKey === 'psicosocial';

  const selectedDominioObj = PSICOSOCIAL_BATTERY.find(d => d.id === (psiDominio || row.psicosocial_dominio));

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setPsiStep('dominio');
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSelectDimension = (dim: { id: string; label: string; description: string }) => {
    const domObj = selectedDominioObj;
    if (!domObj) return;
    // Build prefix tag
    const prefix = `[Dominio: ${domObj.label} — Dimensión: ${dim.label}]`;
    // Strip old prefix if already present
    const currentDesc = row.peligro_descripcion || '';
    const withoutPrefix = currentDesc.replace(/^\[Dominio:.*?\]\s*/i, '').trim();
    const newDesc = `${prefix} ${withoutPrefix || 'Descrié la causa o expresión del riesgo...'}`;
    if (onPsicosocialChange) onPsicosocialChange(domObj.id, dim.id, newDesc);
    setOpen(false);
    setPsiStep('dominio');
  };

  return (
    <div ref={ref} className="mt-1 w-full relative z-30">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-1 text-[10px] bg-surface-secondary border border-teal-400/40 rounded-lg px-2 py-1 text-text-primary hover:border-teal-500 transition-all cursor-pointer"
      >
        <span className={`flex-1 text-left truncate ${
          selected ? 'text-teal-600 dark:text-teal-400 font-semibold' : 'text-text-secondary'
        }`}>
          {isPsicosocial
            ? (row.psicosocial_dominio && row.psicosocial_dimension
                ? `${selectedDominioObj?.label || row.psicosocial_dominio}: ${row.psicosocial_dimension}`
                : (selected ? selected.label : `Anexo C — Psicosocial`))
            : (selected ? `${selected.label}` : `Anexo C — ${entry.label}`)}
        </span>
        <ChevronDown className={`h-3 w-3 text-text-secondary shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full mt-1 left-0 w-80 bg-surface-primary dark:bg-surface-secondary border border-border-medium rounded-xl shadow-2xl overflow-hidden py-1 z-50">
          {/* ── PSICOSOCIAL: panel de 2 niveles ── */}
          {isPsicosocial ? (
            <>
              <p className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest text-violet-600 dark:text-violet-400 border-b border-border-light">
                Batería MPS 2010 — {psiStep === 'dominio' ? 'Selecciona el Dominio' : `Dimensiones de ${selectedDominioObj?.label}`}
              </p>
              {entry.note && (
                <p className="px-3 py-1.5 text-[9px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200/40 leading-tight">
                  ⓘ {entry.note.slice(0, 150)}{entry.note.length > 150 ? '…' : ''}
                </p>
              )}
              {/* Nivel de riesgo ND siempre accesible en psicosocial */}
              <div className="px-3 py-2 border-b border-border-light">
                <p className="text-[9px] font-bold text-text-secondary uppercase mb-1">Nivel ND (Calificación)</p>
                <div className="flex gap-1 flex-wrap">
                  {entry.criteria.map(c => (
                    <button key={c.value} type="button"
                      onClick={() => onSelect(c.value)}
                      className={`text-[9px] px-2 py-0.5 rounded-full font-bold border transition-colors ${
                        row.nd_cualitativo === c.value
                          ? 'bg-teal-500 text-white border-teal-600'
                          : 'bg-surface-secondary border-border-medium text-text-primary hover:border-teal-400'
                      }`
                      }>
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
              {/* Dominios */}
              {psiStep === 'dominio' && PSICOSOCIAL_BATTERY.map(dom => (
                <button key={dom.id} type="button"
                  onClick={() => { setPsiDominio(dom.id); setPsiStep('dimension'); }}
                  className={`w-full text-left px-3 py-2 transition-colors hover:bg-surface-secondary flex items-center gap-2 ${
                    row.psicosocial_dominio === dom.id ? 'bg-violet-50 dark:bg-violet-900/20' : ''
                  }`}>
                  <span className="w-3 shrink-0">{row.psicosocial_dominio === dom.id && <Check className="h-3 w-3 text-violet-500" />}</span>
                  <div>
                    <p className="text-[10px] font-bold text-violet-700 dark:text-violet-300">{dom.label}</p>
                    <p className="text-[9px] text-text-secondary leading-tight mt-0.5">{dom.description.slice(0, 80)}…</p>
                  </div>
                </button>
              ))}
              {/* Dimensiones */}
              {psiStep === 'dimension' && selectedDominioObj && (
                <>
                  <button type="button" onClick={() => setPsiStep('dominio')}
                    className="w-full text-left px-3 py-1.5 text-[9px] text-text-secondary hover:text-teal-600 flex items-center gap-1">
                    ← Volver a Dominios
                  </button>
                  {selectedDominioObj.dimensions.map(dim => (
                    <button key={dim.id} type="button"
                      onClick={() => handleSelectDimension(dim)}
                      className={`w-full text-left px-3 py-2 transition-colors hover:bg-surface-secondary flex items-center gap-2 ${
                        row.psicosocial_dimension === dim.id ? 'bg-teal-50 dark:bg-teal-900/20' : ''
                      }`}>
                      <span className="w-3 shrink-0">{row.psicosocial_dimension === dim.id && <Check className="h-3 w-3 text-teal-500" />}</span>
                      <div>
                        <p className="text-[10px] font-bold text-teal-700 dark:text-teal-300">{dim.label}</p>
                        <p className="text-[9px] text-text-secondary leading-tight mt-0.5">{dim.description.slice(0, 90)}…</p>
                      </div>
                    </button>
                  ))}
                </>
              )}
            </>
          ) : (
            /* ── Modo genérico para el resto de tipos ── */
            <>
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
            </>
          )}
        </div>
      )}
    </div>
  );
};

// ── Mini AI Bubble para Textareas ────────────────────────────────────────────
const CellAIBubble = ({ fieldLabel, currentValue, row, token, selectedModel, onResult }: {
  fieldLabel: string; currentValue: string; row: MatrixRow; token?: string; selectedModel?: string; onResult: (v: string) => void;
}) => {
  const [open, setOpen] = useState(false);
  const [instruction, setInstruction] = useState('');
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [open]);

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
          modelName: selectedModel,
        }),
      });
      const data = await res.json();
      if (data.editedText) { onResult(data.editedText); setOpen(false); setInstruction(''); }
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="absolute -bottom-1 right-0 flex items-center gap-1 text-[9px] text-teal-500 hover:text-teal-700 font-bold opacity-0 group-hover/cell:opacity-100 transition-opacity"
        type="button"
      >
        <Sparkles className="h-3 w-3" /> IA
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-1 z-[150] w-64 bg-surface-primary border border-border-medium rounded-xl shadow-2xl p-3 space-y-2">
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
const AITextarea = ({ value, onChange, rows = 2, minW = '180px', placeholder = '', fieldLabel, row, token, selectedModel }: {
  value: string; onChange: (v: string) => void; rows?: number; minW?: string;
  placeholder?: string; fieldLabel: string; row: MatrixRow; token?: string; selectedModel?: string;
}) => (
  <div className="relative group/cell w-full focus-within:z-[100] hover:z-[90] transition-all">
    <textarea
      rows={rows}
      className={`w-full min-w-[${minW}] bg-transparent outline-none focus:outline-none focus:ring-0 focus:border-transparent border-transparent dark:text-gray-200 resize text-sm`}
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
    />
    <CellAIBubble fieldLabel={fieldLabel} currentValue={value} row={row} token={token} selectedModel={selectedModel} onResult={onChange} />
  </div>
);

// ════════════════════════════════════════════════════════════════════════════
export default function MatrizIPEVARTable({ conversationId }: { conversationId: string | null }) {
  const [matrixRows, setMatrixRows] = useState<MatrixRow[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isMaximized, setIsMaximized] = useRecoilState(store.ipevarMaximized);
  const [isLoading, setIsLoading] = useState(false);
  const [aiRowLoading, setAiRowLoading] = useState<number | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [reportContent, setReportContent] = useState<string | null>(null);
  const [editorKey, setEditorKey] = useState(() => Date.now().toString());
  const [isReportExpanded, setIsReportExpanded] = useState(true);
  const [selectedModel, setSelectedModel] = useState(AI_MODELS[0].id);
  const [chartConclusions, setChartConclusions] = useState<Record<string, string>>({});
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [reportConversationId, setReportConversationId] = useState<string | null>(null);
  const [reportMessageId, setReportMessageId] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isPendingImport = useRef(false);

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = evt.target?.result;
        let newRows: MatrixRow[] = [];
        
        if (file.name.endsWith('.json')) {
          newRows = JSON.parse(data as string);
        } else if (file.name.endsWith('.xlsx')) {
          const wb = XLSX.read(data, { type: 'binary' });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const json = XLSX.utils.sheet_to_json(ws);
          
          newRows = json.map((r: any) => ({
            proceso: r['Proceso'] || '',
            zona: r['Zona'] || '',
            actividad: r['Actividad'] || '',
            tareas: r['Tareas'] || '',
            rutinaria: r['Rutinaria'] || 'Sí',
            peligro_descripcion: r['Descripción del Peligro'] || '',
            peligro_clasificacion: r['Clasificación'] || '',
            efectos_posibles: r['Efectos Posibles'] || '',
            controles_fuente: r['Ctrl. Fuente'] || 'Ninguno',
            controles_medio: r['Ctrl. Medio'] || 'Ninguno',
            controles_individuo: r['Ctrl. Individuo'] || 'Ninguno',
            nd: Number(r['ND']) || 0,
            ne: Number(r['NE']) || 0,
            np: Number(r['NP']) || 0,
            nc: Number(r['NC']) || 0,
            nr: Number(r['NR']) || 0,
            interpretacion_nr: r['Interpretación NR'] || '',
            aceptabilidad: r['Aceptabilidad'] || '',
            medida_eliminacion: r['Eliminación'] || 'Ninguno',
            medida_sustitucion: r['Sustitución'] || 'Ninguno',
            medida_ingenieria: r['Ingeniería'] || 'Ninguno',
            medida_administrativa: r['Administrativos'] || 'Ninguno',
            medida_eppu: r['EPP'] || 'Ninguno',
            factores_reduccion: r['Factores Reducción (Anexo E)'] || 'No aplica',
            nd_cualitativo: null,
            id: Date.now().toString() + Math.random().toString(36).substring(7)
          }));
        }
        
        if (newRows.length > 0) {
           const combined = [...matrixRows, ...newRows];
           setMatrixRows(combined);
           if (actualConvoId && actualConvoId !== 'new') {
              saveMatrixData(combined);
           } else {
              isPendingImport.current = true;
           }
           alert(`Importados ${newRows.length} riesgos exitosamente. ${(!actualConvoId || actualConvoId === 'new') ? '\\nImportante: Empieza a chatear (envía un mensaje) para crear el chat y auto-guardar tu matriz instanciada.' : ''}`);
        }
      } catch (err) {
        console.error(err);
        alert('Error al leer el archivo de importación. Verifique el formato.');
      }
      e.target.value = '';
    };
    
    if (file.name.endsWith('.xlsx')) {
      reader.readAsBinaryString(file);
    } else {
       reader.readAsText(file);
    }
  };

  // ── Sync with mobile Header toggle button via Recoil ───────────────
  // Note: custom events removed in favor of store.ipevarMaximized state sharing

  // ── Filters & Sort ──────────────────────────────────────────────────────
  const [filterText, setFilterText] = useState('');
  const [filterProceso, setFilterProceso] = useState('');
  const [filterCalificacion, setFilterCalificacion] = useState('');
  const [filterClasificacion, setFilterClasificacion] = useState('');
  const [sortField, setSortField] = useState<'proceso' | 'nr' | 'peligro_clasificacion' | 'interpretacion_nr' | ''>('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');


  // ── Drag & Resize Drawer ────────────────────────────────────────────────
  const containerRef = useRef<HTMLDivElement>(null);
  const [dashboardHeight, setDashboardHeight] = useState<number>(45); // 45% por defecto

  const startDrag = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    let isTouch = 'touches' in e;
    if (!isTouch) {
      e.preventDefault();
    }

    const onMove = (moveEvent: MouseEvent | TouchEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const clientY = 'touches' in moveEvent ? moveEvent.touches[0].clientY : moveEvent.clientY;
      const newH = rect.bottom - clientY;
      const rawPct = (newH / rect.height) * 100;
      setDashboardHeight(Math.max(10, Math.min(rawPct, 90))); // Restringe entre 10% y 90%
    };

    const onUp = () => {
      if (isTouch) {
        document.removeEventListener('touchmove', onMove);
        document.removeEventListener('touchend', onUp);
      } else {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        document.body.style.cursor = '';
      }
    };

    if (isTouch) {
      document.addEventListener('touchmove', onMove, { passive: false });
      document.addEventListener('touchend', onUp);
    } else {
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
      document.body.style.cursor = 'row-resize';
    }
  }, []);

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
    if (isPendingImport.current && matrixRows.length > 0) {
      saveMatrixData(matrixRows);
      isPendingImport.current = false;
    } else {
      fetchMatrix(actualConvoId);
    }
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
        body: JSON.stringify({ row: matrixRows[index], modelName: selectedModel }),
      });
      const data = await res.json();
      if (data.updatedFields) {
        const newRows = [...matrixRows];
        const original = newRows[index];

        // ─── Campos que el usuario definió desde el chat → NUNCA sobreescribir ───
        const PROTECTED_FIELDS = [
          'proceso', 'zona', 'actividad', 'tareas', 'rutinaria',
          'peligro_descripcion', 'peligro_clasificacion', 'efectos_posibles',
          'controles_fuente', 'controles_medio', 'controles_individuo',
        ] as const;

        const safeUpdate = { ...data.updatedFields };
        for (const field of PROTECTED_FIELDS) {
          // If the original already had a value, restore it — AI cannot change it
          if (original[field]) safeUpdate[field] = original[field];
        }

        newRows[index] = { ...original, ...safeUpdate };
        setMatrixRows(newRows);
      }
    } catch (e) { console.error('[Matriz] AI row update error:', e); }
    finally { setAiRowLoading(null); }
  };

  // ── AI: Crear Informe Ejecutivo (inyecta en LiveEditor) ──────────────────
  const handleAnalyzeMatrix = async () => {
    if (!matrixRows.length) return;
    setIsAnalyzing(true);
    try {
      const res = await fetch('/api/sgsst/gtc45-workspace/ai-analyze-matrix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ matrixRows, modelName: selectedModel }),
      });
      const data = await res.json();
      if (data.analysis) {
        setReportContent(data.analysis);
        setEditorKey(Date.now().toString());
        setIsReportExpanded(true);
        setTimeout(() => document.getElementById('ipevar-report-editor')?.scrollIntoView({ behavior: 'smooth' }), 300);
      }
    } catch (e) { console.error('[Matriz] AI analyze error:', e); }
    finally { setIsAnalyzing(false); }
  };

  const handleSaveReport = useCallback(async () => {
    if (!reportContent || !token) return;
    try {
      const isNew = !reportConversationId || reportConversationId === 'new';
      const res = await fetch('/api/sgsst/diagnostico/save-report', {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(isNew ? {
          content: reportContent,
          title: `Informe IPEVAR GTC-45 - ${new Date().toLocaleDateString('es-CO')}`,
          tags: ['sgsst-matriz-ipevar'],
        } : { conversationId: reportConversationId, messageId: reportMessageId, content: reportContent }),
      });
      if (res.ok) {
        const data = await res.json();
        if (isNew) { setReportConversationId(data.conversationId); setReportMessageId(data.messageId); }
        setRefreshTrigger(prev => prev + 1);
        setIsHistoryOpen(false);
        alert('Informe guardado en el historial de SGSST.');
      }
    } catch (e) { console.error('Error saving report', e); }
  }, [reportContent, token, reportConversationId, reportMessageId]);

  const handleSelectReport = async (reportOrId: any) => {
      let content = '', convId = '', msgId = '';
      if (typeof reportOrId === 'string') {
          convId = reportOrId;
          try {
              const res = await fetch(`/api/messages/${convId}`, { headers: { 'Authorization': `Bearer ${token}` } });
              if (res.ok) {
                  const messages = await res.json();
                  const reportMsg = messages.reverse().find((m: any) =>
                      m.sender === 'SGSST Diagnóstico' || (m.isCreatedByUser === false && m.text?.length > 100)
                  );
                  if (reportMsg) { content = reportMsg.text; msgId = reportMsg.messageId; }
              }
          } catch { /* ignore */ }
      } else if (reportOrId?.content) {
          content = reportOrId.content; convId = reportOrId.conversationId; msgId = reportOrId.messageId;
      }
      if (content) {
          setReportContent(content);
          setReportConversationId(convId); setReportMessageId(msgId);
          setIsHistoryOpen(false);
          setIsReportExpanded(true);
      }
  };

  // ── Excel export ─────────────────────────────────────────────────────────
  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(matrixRows.map(r => ({
      'Proceso': r.proceso, 'Zona': r.zona, 'Actividad': r.actividad, 'Tareas': r.tareas,
      'Rutinaria': r.rutinaria, 'Descripción del Peligro': r.peligro_descripcion,
      'Clasificación': r.peligro_clasificacion, 'Efectos Posibles': r.efectos_posibles,
      'Ctrl. Fuente': r.controles_fuente, 'Ctrl. Medio': r.controles_medio, 'Ctrl. Individuo': r.controles_individuo,
      'ND': r.nd, 'NE': r.ne, 'NP': r.np, 'NC': r.nc, 'NR': r.nr,
      'Interpretación NR': r.interpretacion_nr, 'Aceptabilidad': r.aceptabilidad,
      'Eliminación': r.medida_eliminacion, 'Sustitución': r.medida_sustitucion,
      'Ingeniería': r.medida_ingenieria, 'Administrativos': r.medida_administrativa, 'EPP': r.medida_eppu,
      'Factores Reducción (Anexo E)': r.factores_reduccion,
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Matriz IPEVAR');
    XLSX.writeFile(wb, `Matriz_IPEVAR_GTC45_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  // ── Filtered + Sorted display rows ───────────────────────────────────────
  const displayRows = useMemo(() => {
    let rows = matrixRows.map((row, idx) => ({ row, idx }));

    if (filterText) {
      const q = filterText.toLowerCase();
      rows = rows.filter(({ row }) =>
        [row.proceso, row.actividad, row.peligro_clasificacion, row.peligro_descripcion, row.efectos_posibles]
          .some(f => f?.toLowerCase().includes(q))
      );
    }
    if (filterProceso) rows = rows.filter(({ row }) => row.proceso === filterProceso);
    if (filterCalificacion) rows = rows.filter(({ row }) => row.interpretacion_nr === filterCalificacion);
    if (filterClasificacion) rows = rows.filter(({ row }) => row.peligro_clasificacion === filterClasificacion);

    if (sortField) {
      rows.sort((a, b) => {
        const va = sortField === 'nr' ? Number(a.row.nr) : String(a.row[sortField as keyof MatrixRow] || '');
        const vb = sortField === 'nr' ? Number(b.row.nr) : String(b.row[sortField as keyof MatrixRow] || '');
        // @ts-ignore
        return sortDir === 'asc' ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
      });
    }
    return rows;
  }, [matrixRows, filterText, filterProceso, filterCalificacion, filterClasificacion, sortField, sortDir]);

  const procesosUnicos = useMemo(() => [...new Set(matrixRows.map(r => r.proceso).filter(Boolean))], [matrixRows]);
  const clasificacionesUnicas = useMemo(() => [...new Set(matrixRows.map(r => r.peligro_clasificacion).filter(Boolean))], [matrixRows]);

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const SortIcon = ({ field }: { field: typeof sortField }) =>
    sortField === field ? <span className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span> : <span className="ml-1 opacity-30">↕</span>;

  // ── Guard: no convo ───────────────────────────────────────────────────────
  if ((!actualConvoId || actualConvoId === 'new') && matrixRows.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center bg-surface-primary border-l border-border-light relative">
        {/* Botón para cerrar/minimizar en mobile si está expandido */}
        <button
          onClick={() => setIsMaximized(false)}
          className="absolute top-4 right-4 p-2 rounded-xl border border-border-medium hover:bg-surface-hover text-text-primary transition-all md:hidden"
          aria-label="Cerrar Matriz"
        >
          <Minimize2 className="h-5 w-5" />
        </button>

        <div className="mb-4 rounded-full bg-surface-tertiary p-4 border border-border-medium shadow-sm">
          <AlertTriangle className="h-8 w-8 text-yellow-500" />
        </div>
        <h3 className="mb-2 text-lg font-semibold text-text-primary">Matriz Inactiva</h3>
        <p className="text-sm text-text-secondary max-w-sm mb-6">
          Envía el primer mensaje en el chat para instanciar la matriz IPEVAR. Los riesgos se guardarán automáticamente aquí.
        </p>
        
        <button
           onClick={() => fileInputRef.current?.click()}
           className="flex items-center gap-2 px-6 py-2.5 bg-teal-500/10 text-teal-600 border border-teal-500/20 rounded-xl font-bold shadow-sm hover:bg-teal-500 hover:text-white transition-all transform hover:-translate-y-0.5"
        >
          <Upload className="h-4 w-4" />
          Importar Matriz Existente / Exportada
        </button>
        <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx,.json" onChange={handleImportFile} />

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

  const renderContent = () => (
    <div ref={containerRef} className={`flex flex-col h-full transition-colors duration-300 border-l border-border-light ${isMaximized ? 'fixed inset-0 z-[999999] backdrop-blur-xl bg-surface-primary/95 w-screen h-screen m-0 rounded-none shadow-2xl' : 'bg-surface-primary w-full'}`}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-border-light bg-surface-secondary px-4 shrink-0 min-w-0 relative z-[300] overflow-visible" style={{ minHeight: '4rem' }}>
        <div className="flex items-center gap-3 min-w-0 flex-shrink mr-2 text-ellipsis overflow-hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/10 text-teal-600 border border-teal-500/20 shadow-sm shrink-0">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div className="min-w-0 overflow-hidden">
            <h2 className="text-sm font-semibold text-text-primary truncate">Matriz IPEVAR Live</h2>
            <div className="flex items-center gap-1.5 overflow-hidden">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse shrink-0" />
              <span className="text-xs text-text-secondary truncate">Sincronización Activa</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-visible flex-nowrap shrink-0 py-1">
          {isLoading && <RefreshCw className="h-4 w-4 animate-spin text-text-secondary" />}

          <ModelSelector selectedModel={selectedModel} onSelectModel={setSelectedModel} hideTooltip={true} />

          {/* Analizar Matriz Completa */}
          <button onClick={handleAnalyzeMatrix} disabled={isAnalyzing || matrixRows.length === 0}
            className="group flex flex-shrink-0 items-center justify-center h-10 px-2.5 min-w-[40px] transition-all duration-300 shadow-sm shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border outline-none rounded-xl bg-surface-primary border-purple-500/40 hover:bg-purple-50 dark:hover:bg-purple-900/20 text-purple-600 dark:text-purple-400 hover:-rotate-3 hover:scale-105">
            {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin shrink-0" /> : <FileTextIcon className="h-4 w-4 shrink-0" />}
            <span className="flex items-center max-w-0 overflow-hidden opacity-0 group-hover:max-w-[200px] group-hover:opacity-100 transition-all duration-300 ease-in-out whitespace-nowrap text-sm font-bold tracking-wide group-hover:ml-2">
              {isAnalyzing ? 'Generando…' : 'Análisis IPEVAR'}
            </span>
          </button>

          {/* Importar */}
          <button onClick={() => fileInputRef.current?.click()}
            className="group flex flex-shrink-0 items-center justify-center h-10 px-2.5 min-w-[40px] transition-all duration-300 shadow-sm shrink-0 cursor-pointer border outline-none rounded-xl bg-surface-primary border-border-medium hover:bg-surface-hover text-text-primary hover:-rotate-3 hover:scale-105">
            <Upload className="h-4 w-4 shrink-0" />
            <span className="flex items-center max-w-0 overflow-hidden opacity-0 group-hover:max-w-[200px] group-hover:opacity-100 transition-all duration-300 ease-in-out whitespace-nowrap text-sm font-bold tracking-wide group-hover:ml-2">
              Importar
            </span>
          </button>
          
          <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx,.json" onChange={handleImportFile} />

          {/* Exportar — informe (HTML/Word/PDF) + Matriz (Excel) */}
          <ExportDropdown
            content={reportContent || ''}
            fileName={`Informe_IPEVAR_GTC45_${new Date().toISOString().slice(0,10)}`}
            reportType="general"
            onExportExcel={handleExportExcel}
          />

          {/* Guardar */}
          <button onClick={() => saveMatrixData(matrixRows)}
            className="group flex flex-shrink-0 items-center justify-center h-10 px-2.5 min-w-[40px] transition-all duration-300 shadow-sm shrink-0 cursor-pointer disabled:opacity-50 border outline-none rounded-xl bg-surface-primary border-green-500/40 hover:bg-green-50 dark:hover:bg-green-900/20 text-green-600 dark:text-green-400 hover:-rotate-3 hover:scale-105">
            <Save className="h-4 w-4 shrink-0" />
            <span className="flex items-center max-w-0 overflow-hidden opacity-0 group-hover:max-w-[200px] group-hover:opacity-100 transition-all duration-300 ease-in-out whitespace-nowrap text-sm font-bold tracking-wide group-hover:ml-2">
              {isSaving ? 'Guardando…' : 'Guardar'}
            </span>
          </button>

          {/* Maximizar */}
          <button onClick={() => setIsMaximized(m => !m)}
            className="group flex flex-shrink-0 items-center justify-center h-10 px-2.5 min-w-[40px] transition-all duration-300 shadow-sm shrink-0 cursor-pointer border outline-none rounded-xl bg-surface-primary border-border-medium hover:bg-surface-hover text-text-primary hover:-rotate-3 hover:scale-105">
            {isMaximized ? <Minimize2 className="h-4 w-4 shrink-0" /> : <Maximize2 className="h-4 w-4 shrink-0" />}
            <span className="flex items-center max-w-0 overflow-hidden opacity-0 group-hover:max-w-[200px] group-hover:opacity-100 transition-all duration-300 ease-in-out whitespace-nowrap text-sm font-bold tracking-wide group-hover:ml-2">
              {isMaximized ? 'Restaurar' : 'Expandir'}
            </span>
          </button>
        </div>
      </div>

      {/* Informe ahora va en el LiveEditor de abajo — panel antiguo eliminado */}


      {/* ── Barra de Filtros ──────────────────────────────────────────────── */}
      <div className="shrink-0 flex flex-wrap items-center gap-2 px-4 py-2.5 bg-surface-secondary border-b border-border-light relative z-[200]">
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

        {/* Filtro Clasificación (Peligros) — 2do lugar después de Procesos */}
        <FilterSelect
          value={filterClasificacion}
          onChange={setFilterClasificacion}
          placeholder="Todos los peligros"
          options={clasificacionesUnicas.map(c => ({ value: c, label: c }))}
        />

        {/* Filtro Calificación (NR) */}
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
        {(filterText || filterProceso || filterCalificacion || filterClasificacion) && (
          <button
            onClick={() => { setFilterText(''); setFilterProceso(''); setFilterCalificacion(''); setFilterClasificacion(''); }}
            className="flex items-center gap-1 text-xs h-8 px-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-100 transition-colors cursor-pointer font-medium"
          >
            ✕ Limpiar
            <span className="px-1.5 py-0.5 rounded-full bg-red-600 text-white text-[9px] font-black">
              {[filterText, filterProceso, filterCalificacion, filterClasificacion].filter(Boolean).length}
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
              <thead className="sticky top-0 z-[100] bg-surface-secondary text-xs font-bold text-text-secondary uppercase tracking-wide">
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
                  <th className="px-4 py-3 text-left min-w-[170px] border-l border-border-light text-slate-700 dark:text-slate-400 cursor-pointer hover:text-slate-900" onClick={() => toggleSort('interpretacion_nr')}>
                    SIGNIFICADO EXPLICACIÓN <SortIcon field="interpretacion_nr" />
                  </th>
                  {/* Clasificación visible entre NR y Eliminación */}
                  <th className="px-4 py-3 text-left min-w-[140px] border-l-2 border-teal-500/20 text-teal-700 dark:text-teal-400 cursor-pointer hover:text-teal-500" onClick={() => toggleSort('peligro_clasificacion')}>
                    CLASIFICACIÓN <SortIcon field="peligro_clasificacion" />
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
                  <th className="px-4 py-3 text-center min-w-[100px] sticky right-0 z-[200] bg-surface-secondary shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.06)] border-l border-border-light">ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {displayRows.map(({ row, idx }) => (
                  <tr 
                    key={idx} 
                    className="group border-b border-border-light hover:bg-surface-secondary/50 transition-colors"
                  >
                    {/* Proceso */}
                    <td className="px-4 py-3"><textarea rows={2} className="w-full min-w-[140px] bg-transparent outline-none focus:outline-none focus:ring-0 focus:border-transparent border-transparent dark:text-gray-200 resize" value={row.proceso || ''} onChange={e => handleCellChange(idx, 'proceso', e.target.value)} /></td>
                    <td className="px-4 py-3"><textarea rows={2} className="w-full min-w-[120px] bg-transparent outline-none focus:outline-none focus:ring-0 focus:border-transparent border-transparent dark:text-gray-200 resize" value={row.zona || ''} onChange={e => handleCellChange(idx, 'zona', e.target.value)} /></td>
                    <td className="px-4 py-3"><textarea rows={2} className="w-full min-w-[150px] bg-transparent outline-none focus:outline-none focus:ring-0 focus:border-transparent border-transparent dark:text-gray-200 resize" value={row.actividad || ''} onChange={e => handleCellChange(idx, 'actividad', e.target.value)} /></td>
                    <td className="px-4 py-3"><textarea rows={2} className="w-full min-w-[190px] bg-transparent outline-none focus:outline-none focus:ring-0 focus:border-transparent border-transparent dark:text-gray-200 resize" value={row.tareas || ''} onChange={e => handleCellChange(idx, 'tareas', e.target.value)} /></td>

                    {/* Rutinaria toggle */}
                    <td className="px-4 py-3 text-center align-middle">
                      <button onClick={() => handleCellChange(idx, 'rutinaria', row.rutinaria === 'Sí' ? 'No' : 'Sí')}
                        className={`px-3 py-1 rounded-full text-xs font-bold border-2 transition-all ${row.rutinaria === 'Sí' ? 'bg-teal-50 border-teal-400 text-teal-700' : 'bg-surface-tertiary border-border-medium text-text-secondary'}`}>
                        {row.rutinaria}
                      </button>
                    </td>

                    {/* Peligro */}
                    <td className="px-4 py-3 border-l border-border-light">
                      <AITextarea value={row.peligro_descripcion || ''} onChange={v => handleCellChange(idx, 'peligro_descripcion', v)} minW="210px" fieldLabel="Descripción del Peligro" row={row} token={token} selectedModel={selectedModel} />
                    </td>
                    <td className="px-4 py-3"><textarea rows={2} className="w-full min-w-[140px] bg-transparent outline-none focus:outline-none focus:ring-0 focus:border-transparent border-transparent dark:text-gray-200 resize" value={row.peligro_clasificacion || ''} onChange={e => handleCellChange(idx, 'peligro_clasificacion', e.target.value)} /></td>
                    <td className="px-4 py-3">
                      <AITextarea value={row.efectos_posibles || ''} onChange={v => handleCellChange(idx, 'efectos_posibles', v)} minW="210px" fieldLabel="Efectos Posibles" row={row} token={token} selectedModel={selectedModel} />
                    </td>

                    {/* Controles existentes */}
                    <td className="px-4 py-3 border-l border-border-light bg-blue-500/5">
                      <AITextarea value={row.controles_fuente || ''} onChange={v => handleCellChange(idx, 'controles_fuente', v)} minW="170px" fieldLabel="Controles en la Fuente" row={row} token={token} selectedModel={selectedModel} />
                    </td>
                    <td className="px-4 py-3 bg-blue-500/5">
                      <AITextarea value={row.controles_medio || ''} onChange={v => handleCellChange(idx, 'controles_medio', v)} minW="170px" fieldLabel="Controles en el Medio" row={row} token={token} selectedModel={selectedModel} />
                    </td>
                    <td className="px-4 py-3 bg-blue-500/5">
                      <AITextarea value={row.controles_individuo || ''} onChange={v => handleCellChange(idx, 'controles_individuo', v)} minW="170px" fieldLabel="Controles en el Individuo" row={row} token={token} selectedModel={selectedModel} />
                    </td>

                    {/* Evaluación cuantitativa — ND con Anexo C inline */}
                    <td className="px-4 py-3 border-l border-border-light bg-purple-500/5 align-top relative" style={{ zIndex: Math.min(90 - idx, 100) }}>
                      <input type="number" className="w-14 text-center bg-transparent outline-none focus:outline-none focus:ring-0 border-transparent focus:border-transparent font-mono" value={row.nd} onChange={e => handleCellChange(idx, 'nd', e.target.value)} />
                      <AnnexCSelector row={row}
                        onSelect={v => { handleCellChange(idx, 'nd_cualitativo', v); handleCellChange(idx, 'nd', v); }}
                        onPsicosocialChange={(dominio, dimension, desc) => {
                          handleCellChange(idx, 'psicosocial_dominio', dominio);
                          handleCellChange(idx, 'psicosocial_dimension', dimension);
                          handleCellChange(idx, 'peligro_descripcion', desc);
                        }}
                      />
                    </td>
                    <td className="px-4 py-3 bg-purple-500/5"><input type="number" className="w-12 text-center bg-transparent outline-none focus:outline-none focus:ring-0 border-transparent focus:border-transparent font-mono" value={row.ne} onChange={e => handleCellChange(idx, 'ne', e.target.value)} /></td>
                    <td className="px-4 py-3 font-bold text-center text-purple-600 dark:text-purple-400 bg-purple-500/5">{row.np}</td>
                    <td className="px-4 py-3 bg-purple-500/5"><input type="number" className="w-12 text-center bg-transparent outline-none focus:outline-none focus:ring-0 border-transparent focus:border-transparent font-mono" value={row.nc} onChange={e => handleCellChange(idx, 'nc', e.target.value)} /></td>
                    <td className={`px-4 py-3 text-center font-black border-l-2 border-orange-500/20 bg-orange-500/5 align-middle ${nrColorClass(Number(row.nr))}`}>
                      <div className="text-base">{row.nr}</div>
                    </td>
                    <td className="px-4 py-3 border-l border-border-light align-middle text-[11px] font-medium text-text-secondary whitespace-nowrap">
                      {row.interpretacion_nr === 'I' ? '🔴 Nivel I — No Aceptable' :
                       row.interpretacion_nr === 'II' ? '🟠 Nivel II — Aceptable con control' :
                       row.interpretacion_nr === 'III' ? '🟡 Nivel III — Mejorable' :
                       row.interpretacion_nr === 'IV' ? '🟢 Nivel IV — Aceptable' :
                       row.interpretacion_nr || '—'}
                    </td>

                    {/* Clasificación visible con badge de color */}
                    <td className="px-4 py-3 border-l border-border-light align-middle">
                      {(() => {
                        const c = (row.peligro_clasificacion || '').toLowerCase();
                        const color = c.includes('biome') || c.includes('ergon')
                          ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300'
                          : c.includes('psico')
                          ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/20 dark:text-violet-300'
                          : c.includes('fisic')
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                          : c.includes('quim')
                          ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300'
                          : c.includes('biol')
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300'
                          : c.includes('locati')
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300'
                          : 'bg-surface-tertiary text-text-secondary';
                        return (
                          <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${color}`}>
                            {row.peligro_clasificacion || '—'}
                          </span>
                        );
                      })()}
                    </td>

                    {/* Medidas propuestas */}
                    <td className="px-4 py-3 bg-emerald-500/5 border-l-2 border-emerald-500/20">
                      <AITextarea value={row.medida_eliminacion || ''} onChange={v => handleCellChange(idx, 'medida_eliminacion', v)} minW="190px" fieldLabel="Medida: Eliminación" row={row} token={token} selectedModel={selectedModel} />
                    </td>
                    <td className="px-4 py-3 bg-emerald-500/5">
                      <AITextarea value={row.medida_sustitucion || ''} onChange={v => handleCellChange(idx, 'medida_sustitucion', v)} minW="190px" fieldLabel="Medida: Sustitución" row={row} token={token} selectedModel={selectedModel} />
                    </td>
                    <td className="px-4 py-3 bg-emerald-500/5">
                      <AITextarea value={row.medida_ingenieria || ''} onChange={v => handleCellChange(idx, 'medida_ingenieria', v)} minW="190px" fieldLabel="Medida: Ingeniería" row={row} token={token} selectedModel={selectedModel} />
                    </td>
                    <td className="px-4 py-3 bg-emerald-500/5">
                      <AITextarea value={row.medida_administrativa || ''} onChange={v => handleCellChange(idx, 'medida_administrativa', v)} minW="210px" fieldLabel="Medida: Administrativos" row={row} token={token} selectedModel={selectedModel} />
                    </td>
                    <td className="px-4 py-3 bg-emerald-500/5">
                      <AITextarea value={row.medida_eppu || ''} onChange={v => handleCellChange(idx, 'medida_eppu', v)} minW="170px" fieldLabel="Medida: EPP" row={row} token={token} selectedModel={selectedModel} />
                    </td>

                    {/* Anexo E — Factores de Reducción */}
                    <td className="px-4 py-3 bg-purple-50/50 dark:bg-purple-900/10 border-l-2 border-purple-400/30">
                      <AITextarea value={row.factores_reduccion || ''} onChange={v => handleCellChange(idx, 'factores_reduccion', v)} minW="210px" fieldLabel="Factores de Reducción (Anexo E)" row={row} token={token} selectedModel={selectedModel} />
                    </td>

                    {/* Acciones */}
                    <td className="px-4 py-3 text-center align-middle sticky right-0 z-[150] bg-surface-primary border-l border-border-light shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.06)]">
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

      {/* ── Dashboard analítico y Resizer ───────────────────────────────────── */}
      <div 
        onMouseDown={startDrag}
        onTouchStart={startDrag}
        className="shrink-0 h-4 bg-surface-tertiary border-y border-border-light hover:bg-teal-500/20 cursor-row-resize flex items-center justify-center transition-colors group/resizer relative z-20 touch-none"
      >
        <div className="w-12 h-1 bg-border-heavy rounded-full group-hover/resizer:bg-teal-500/50" />
      </div>

      <div 
        className="shrink-0 bg-surface-primary px-4 py-2 overflow-y-auto"
        style={{ height: `${dashboardHeight}%` }}
      >
        <MatrizIPEVARDashboard
          matrixRows={matrixRows}
          conversationId={actualConvoId}
          token={token || ''}
          savedConclusions={chartConclusions}
          onConclusionSaved={(type, text) => setChartConclusions(prev => ({ ...prev, [type]: text }))}
          isMaximized={isMaximized}
        />

        {/* ── Informe Ejecutivo GTC-45 (LiveEditor) ────────────────────────
          El contenido se genera presionando 'Crear Informe' en el toolbar
        */}
        <div id="ipevar-report-editor" className="mt-6 mb-4">
          <CollapsibleReportBox
            title="Informe Ejecutivo IPEVAR — GTC-45"
            icon={<FileTextIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />}
            actions={
              reportContent ? (
                  <div onClick={e => e.stopPropagation()}>
                    <ExportDropdown
                      content={reportContent}
                      fileName={`Informe_IPEVAR_GTC45_${new Date().toISOString().slice(0,10)}`}
                      reportType="general"
                    />
                  </div>
              ) : undefined
            }
          >
            {isHistoryOpen && (
                <div className="rounded-xl border border-border-medium bg-surface-secondary overflow-hidden mb-4 mx-2 mt-4">
                    <ReportHistory onSelectReport={handleSelectReport} isOpen={isHistoryOpen}
                        toggleOpen={() => setIsHistoryOpen(!isHistoryOpen)} refreshTrigger={refreshTrigger}
                        tags={['sgsst-matriz-ipevar']} />
                </div>
            )}

            <div className="p-2">
              {reportContent ? (
                <div style={{ minHeight: '500px', width: '100%' }}>
                  <LiveEditor
                    key={editorKey}
                    initialContent={reportContent}
                    onUpdate={(content: string) => setReportContent(content)}
                    reportSourceData={{ matrixRows, chartConclusions }}
                    onSave={handleSaveReport}
                    onHistory={() => setIsHistoryOpen(!isHistoryOpen)}
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 gap-4 text-text-secondary">
                  <FileTextIcon className="h-12 w-12 opacity-20" />
                  <p className="text-sm text-center max-w-sm">
                    Presiona{' '}
                    <span className="font-bold text-purple-600">“Análisis IPEVAR”</span>
                    {' '}en la barra superior para que la IA genere el Informe Ejecutivo GTC-45 con análisis de riesgos, controles y recomendaciones.
                  </p>
                  <div className="flex gap-4 mt-2">
                    <button
                      onClick={handleAnalyzeMatrix}
                      disabled={isAnalyzing || matrixRows.length === 0}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl border border-purple-400 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 text-sm font-bold hover:bg-purple-100 transition-colors disabled:opacity-50"
                    >
                      {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileTextIcon className="h-4 w-4" />}
                      {isAnalyzing ? 'Generando informe…' : 'Generar Informe Ahora'}
                    </button>
                    <button
                      onClick={() => setIsHistoryOpen(true)}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl border border-teal-400 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 text-sm font-bold hover:bg-teal-100 transition-colors shadow-sm"
                    >
                      <History className="h-4 w-4" />
                      Cargar desde Historial
                    </button>
                  </div>
                </div>
              )}
            </div>
          </CollapsibleReportBox>
        </div>
      </div>

    </div>
  );

  return isMaximized ? ReactDOM.createPortal(renderContent(), document.body) : renderContent();
}
