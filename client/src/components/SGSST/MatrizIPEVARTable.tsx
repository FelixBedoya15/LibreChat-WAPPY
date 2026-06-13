import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useRecoilValue, useRecoilState } from 'recoil';
import store from '~/store';
import {
  Save,
  Maximize2,
  Minimize2,
  RefreshCw,
  Plus,
  Trash2,
  AlertTriangle,
  ShieldAlert,
  Zap,
  ScanSearch,
  Loader2,
  Sparkles,
  ChevronDown,
  Check,
  FileText as FileTextIcon,
  History,
  Upload,
  Download,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useAuthContext } from '~/hooks';
import {
  MatrixRow,
  ANNEX_C_CRITERIA,
  detectAnnexCType,
  PSICOSOCIAL_BATTERY,
} from './MatrizIPEVARConstants';
import MatrizIPEVARDashboard from './MatrizIPEVARDashboard';
import ModelSelector, { AI_MODELS } from './ModelSelector';
import ExportDropdown from './ExportDropdown';
import LiveEditor, { type LiveEditorHandle } from '~/components/Liva/Editor/LiveEditor';
import ReportHistory from '~/components/Liva/ReportHistory';
import CollapsibleReportBox from './CollapsibleReportBox';

// ── FilterSelect: dropdown con estilo del sistema (reemplaza <select> nativo) ────────────────
const FilterSelect = ({
  value,
  onChange,
  options,
  placeholder,
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

  const selected = value ? options.find((o) => o.value === value) : null;

  return (
    <div ref={ref} className="relative z-20">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-8 min-w-[160px] max-w-[220px] cursor-pointer items-center gap-1.5 rounded-xl border border-border-medium bg-surface-primary pl-3 pr-2 text-xs text-text-primary transition-all hover:border-teal-400 hover:bg-surface-secondary"
      >
        {selected ? (
          <span className="flex-1 truncate text-left font-semibold text-teal-600 dark:text-teal-400">
            {selected.label}
          </span>
        ) : (
          <span className="flex-1 truncate text-left text-text-secondary">{placeholder}</span>
        )}
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-text-secondary transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1.5 w-max min-w-full max-w-[280px] overflow-hidden rounded-xl border border-border-medium bg-surface-primary py-1 shadow-2xl dark:bg-surface-secondary">
          {/* Opción "Todos" */}
          <button
            type="button"
            onClick={() => {
              onChange('');
              setOpen(false);
            }}
            className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors ${
              !value
                ? 'bg-teal-50 font-bold text-teal-600 dark:bg-teal-900/20 dark:text-teal-400'
                : 'text-text-primary hover:bg-surface-secondary hover:text-teal-600 dark:hover:text-teal-400'
            }`}
          >
            <span className="flex w-3.5 shrink-0 items-center justify-center">
              {!value && <Check className="h-3 w-3" />}
            </span>
            {placeholder}
          </button>
          <div className="my-1 border-t border-border-light" />
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors ${
                value === opt.value
                  ? 'bg-teal-50 font-bold text-teal-600 dark:bg-teal-900/20 dark:text-teal-400'
                  : 'text-text-primary hover:bg-surface-secondary hover:text-teal-600 dark:hover:text-teal-400'
              }`}
            >
              <span className="flex w-3.5 shrink-0 items-center justify-center">
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
  row,
  onSelect,
  onPsicosocialChange,
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

  if (!typeKey) return null;
  const entry = ANNEX_C_CRITERIA[typeKey];
  const selected = entry.criteria.find((c) => c.value === row.nd_cualitativo);
  const isPsicosocial = typeKey === 'psicosocial';

  const selectedDominioObj = PSICOSOCIAL_BATTERY.find(
    (d) => d.id === (psiDominio || row.psicosocial_dominio),
  );

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
    <div ref={ref} className="relative z-30 mt-1 w-full">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full cursor-pointer items-center gap-1 rounded-lg border border-teal-400/40 bg-surface-secondary px-2 py-1 text-[10px] text-text-primary transition-all hover:border-teal-500"
      >
        <span
          className={`flex-1 truncate text-left ${
            selected ? 'font-semibold text-teal-600 dark:text-teal-400' : 'text-text-secondary'
          }`}
        >
          {isPsicosocial
            ? row.psicosocial_dominio && row.psicosocial_dimension
              ? `${selectedDominioObj?.label || row.psicosocial_dominio}: ${row.psicosocial_dimension}`
              : selected
                ? selected.label
                : `Anexo C — Psicosocial`
            : selected
              ? `${selected.label}`
              : `Anexo C — ${entry.label}`}
        </span>
        <ChevronDown
          className={`h-3 w-3 shrink-0 text-text-secondary transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-80 overflow-hidden rounded-xl border border-border-medium bg-surface-primary py-1 shadow-2xl dark:bg-surface-secondary">
          {/* ── PSICOSOCIAL: panel de 2 niveles ── */}
          {isPsicosocial ? (
            <>
              <p className="border-b border-border-light px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest text-violet-600 dark:text-violet-400">
                Batería MPS 2010 —{' '}
                {psiStep === 'dominio'
                  ? 'Selecciona el Dominio'
                  : `Dimensiones de ${selectedDominioObj?.label}`}
              </p>
              {entry.note && (
                <p className="border-b border-amber-200/40 bg-amber-50 px-3 py-1.5 text-[9px] leading-tight text-amber-600 dark:bg-amber-900/20 dark:text-amber-400">
                  ⓘ {entry.note.slice(0, 150)}
                  {entry.note.length > 150 ? '…' : ''}
                </p>
              )}
              {/* Nivel de riesgo ND siempre accesible en psicosocial */}
              <div className="border-b border-border-light px-3 py-2">
                <p className="mb-1 text-[9px] font-bold uppercase text-text-secondary">
                  Nivel ND (Calificación)
                </p>
                <div className="flex flex-wrap gap-1">
                  {entry.criteria.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => onSelect(c.value)}
                      className={`rounded-full border px-2 py-0.5 text-[9px] font-bold transition-colors ${
                        row.nd_cualitativo === c.value
                          ? 'border-teal-600 bg-teal-500 text-white'
                          : 'border-border-medium bg-surface-secondary text-text-primary hover:border-teal-400'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
              {/* Dominios */}
              {psiStep === 'dominio' &&
                PSICOSOCIAL_BATTERY.map((dom) => (
                  <button
                    key={dom.id}
                    type="button"
                    onClick={() => {
                      setPsiDominio(dom.id);
                      setPsiStep('dimension');
                    }}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-surface-secondary ${
                      row.psicosocial_dominio === dom.id ? 'bg-violet-50 dark:bg-violet-900/20' : ''
                    }`}
                  >
                    <span className="w-3 shrink-0">
                      {row.psicosocial_dominio === dom.id && (
                        <Check className="h-3 w-3 text-violet-500" />
                      )}
                    </span>
                    <div>
                      <p className="text-[10px] font-bold text-violet-700 dark:text-violet-300">
                        {dom.label}
                      </p>
                      <p className="mt-0.5 text-[9px] leading-tight text-text-secondary">
                        {dom.description.slice(0, 80)}…
                      </p>
                    </div>
                  </button>
                ))}
              {/* Dimensiones */}
              {psiStep === 'dimension' && selectedDominioObj && (
                <>
                  <button
                    type="button"
                    onClick={() => setPsiStep('dominio')}
                    className="flex w-full items-center gap-1 px-3 py-1.5 text-left text-[9px] text-text-secondary hover:text-teal-600"
                  >
                    ← Volver a Dominios
                  </button>
                  {selectedDominioObj.dimensions.map((dim) => (
                    <button
                      key={dim.id}
                      type="button"
                      onClick={() => handleSelectDimension(dim)}
                      className={`flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-surface-secondary ${
                        row.psicosocial_dimension === dim.id ? 'bg-teal-50 dark:bg-teal-900/20' : ''
                      }`}
                    >
                      <span className="w-3 shrink-0">
                        {row.psicosocial_dimension === dim.id && (
                          <Check className="h-3 w-3 text-teal-500" />
                        )}
                      </span>
                      <div>
                        <p className="text-[10px] font-bold text-teal-700 dark:text-teal-300">
                          {dim.label}
                        </p>
                        <p className="mt-0.5 text-[9px] leading-tight text-text-secondary">
                          {dim.description.slice(0, 90)}…
                        </p>
                      </div>
                    </button>
                  ))}
                </>
              )}
            </>
          ) : (
            /* ── Modo genérico para el resto de tipos ── */
            <>
              <p className="border-b border-border-light px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest text-text-secondary">
                {entry.label}
              </p>
              {entry.note && (
                <p className="border-b border-amber-200/40 bg-amber-50 px-3 py-1.5 text-[9px] leading-tight text-amber-600 dark:bg-amber-900/20 dark:text-amber-400">
                  ⓘ {entry.note.slice(0, 150)}
                  {entry.note.length > 150 ? '…' : ''}
                </p>
              )}
              {entry.criteria.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => {
                    onSelect(c.value);
                    setOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-left transition-colors ${
                    row.nd_cualitativo === c.value
                      ? 'bg-teal-50 dark:bg-teal-900/20'
                      : 'hover:bg-surface-secondary'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 shrink-0">
                      {row.nd_cualitativo === c.value && (
                        <Check className="h-3 w-3 text-teal-500" />
                      )}
                    </span>
                    <span
                      className={`text-[10px] font-bold ${
                        c.value === 10
                          ? 'text-red-600'
                          : c.value === 6
                            ? 'text-orange-500'
                            : c.value === 2
                              ? 'text-yellow-600'
                              : 'text-green-600'
                      }`}
                    >
                      {c.label}
                    </span>
                  </div>
                  <p className="mt-0.5 pl-5 text-[9px] leading-tight text-text-secondary">
                    {c.description}
                  </p>
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
const CellAIBubble = ({
  fieldLabel,
  currentValue,
  row,
  token,
  selectedModel,
  onResult,
}: {
  fieldLabel: string;
  currentValue: string;
  row: MatrixRow;
  token?: string;
  selectedModel?: string;
  onResult: (v: string) => void;
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
      if (data.editedText) {
        onResult(data.editedText);
        setOpen(false);
        setInstruction('');
      }
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="absolute -bottom-1 right-0 flex items-center gap-1 text-[9px] font-bold text-teal-500 opacity-0 transition-opacity hover:text-teal-700 group-hover/cell:opacity-100"
        type="button"
      >
        <Sparkles className="h-3 w-3" /> IA
      </button>
      {open && (
        <div className="absolute right-0 top-full z-[150] mt-1 w-64 space-y-2 rounded-xl border border-border-medium bg-surface-primary p-3 shadow-2xl">
          <p className="text-[10px] font-bold uppercase text-text-secondary">{fieldLabel}</p>
          <input
            autoFocus
            className="w-full rounded-lg border border-border-medium bg-surface-primary px-2 py-1.5 text-xs outline-none focus:border-teal-400"
            placeholder="Instrucción (ej: hazlo más técnico)"
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && apply()}
          />
          <div className="flex gap-2">
            <button
              onClick={apply}
              disabled={loading}
              className="flex-1 rounded-lg bg-teal-500 py-1.5 text-[10px] font-bold text-white hover:bg-teal-600 disabled:opacity-50"
            >
              {loading ? <Loader2 className="mx-auto h-3 w-3 animate-spin" /> : 'Aplicar'}
            </button>
            <button onClick={() => setOpen(false)} className="px-2 text-[10px] text-text-secondary">
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Celda Textarea con AI Bubble ──────────────────────────────────────────────
const AITextarea = ({
  value,
  onChange,
  rows = 2,
  minW = '180px',
  placeholder = '',
  fieldLabel,
  row,
  token,
  selectedModel,
}: {
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  minW?: string;
  placeholder?: string;
  fieldLabel: string;
  row: MatrixRow;
  token?: string;
  selectedModel?: string;
}) => (
  <div className="group/cell relative w-full transition-all focus-within:z-[100] hover:z-[90]">
    <textarea
      rows={rows}
      className={`w-full min-w-[${minW}] resize border-transparent bg-transparent text-sm outline-none focus:border-transparent focus:outline-none focus:ring-0 dark:text-gray-200`}
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
    <CellAIBubble
      fieldLabel={fieldLabel}
      currentValue={value}
      row={row}
      token={token}
      selectedModel={selectedModel}
      onResult={onChange}
    />
  </div>
);

// ════════════════════════════════════════════════════════════════════════════
export default function MatrizIPEVARTable({
  conversationId,
  workerId,
}: {
  conversationId: string | null;
  workerId?: string;
}) {
  const [matrixRows, setMatrixRows] = useState<MatrixRow[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isMaximized, setIsMaximized] = useRecoilState(store.ipevarMaximized);
  const [isLoading, setIsLoading] = useState(false);
  const [aiRowLoading, setAiRowLoading] = useState<number | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [reportContent, setReportContent] = useState<string | null>(null);
  const reportContentRef = useRef<string>('');
  const liveEditorRef = useRef<LiveEditorHandle>(null);
  const [isReportExpanded, setIsReportExpanded] = useState(true);
  const [selectedModel, setSelectedModel] = useState(AI_MODELS[0].id);
  const [chartConclusions, setChartConclusions] = useState<Record<string, string>>({});
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [reportConversationId, setReportConversationId] = useState<string | null>(null);
  const [reportMessageId, setReportMessageId] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isPendingImport = useRef(false);

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [pendingRawRows, setPendingRawRows] = useState<any[]>([]);
  const [isAiImportLoading, setIsAiImportLoading] = useState(false);

  const handleAiImport = async () => {
    if (pendingRawRows.length === 0) return;
    setIsConfirmModalOpen(false);
    setIsAiImportLoading(true);

    try {
      const res = await fetch('/api/sgsst/gtc45-workspace/ai-parse-matrix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ rawRows: pendingRawRows, modelName: selectedModel }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Error al procesar con IA.');
      }

      const data = await res.json();
      if (data.matrixRows && data.matrixRows.length > 0) {
        const combined = [...matrixRows, ...data.matrixRows];
        setMatrixRows(combined);
        if (actualConvoId && actualConvoId !== 'new') {
          saveMatrixData(combined);
        } else {
          isPendingImport.current = true;
        }
        alert(
          `¡Éxito! La IA de Wappy ha reconstruido y mapeado ${data.matrixRows.length} riesgos de tu matriz al formato oficial de Wappy.`
        );
      } else {
        alert('No se pudieron recuperar filas procesadas.');
      }
    } catch (err: any) {
      console.error('[Matriz] AI Import error:', err);
      alert(`Error en la reconstrucción con IA: ${err.message}`);
    } finally {
      setIsAiImportLoading(false);
      setPendingRawRows([]);
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Helper to fill merged cells in place
    const autofillMergedCells = (ws: any) => {
      if (!ws || !ws['!merges']) return;
      ws['!merges'].forEach((merge: any) => {
        const startRow = merge.s.r;
        const startCol = merge.s.c;
        const endRow = merge.e.r;
        const endCol = merge.e.c;

        const startCellAddress = XLSX.utils.encode_cell({ r: startRow, c: startCol });
        const startCell = ws[startCellAddress];
        if (!startCell || startCell.v === undefined) return;

        for (let r = startRow; r <= endRow; r++) {
          for (let c = startCol; c <= endCol; c++) {
            if (r === startRow && c === startCol) continue;
            const cellAddress = XLSX.utils.encode_cell({ r, c });
            ws[cellAddress] = { ...startCell };
          }
        }
      });
    };

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = evt.target?.result;

        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(data as string);
          if (Array.isArray(parsed)) {
            const firstRow = parsed[0] || {};
            const keys = Object.keys(firstRow);
            const isStandard = (
              keys.some(k => k.toLowerCase() === 'proceso') &&
              keys.some(k => k.toLowerCase() === 'actividad') &&
              keys.some(k => k.toLowerCase().includes('peligro'))
            ) || (
              ['proceso', 'actividad', 'peligro_descripcion'].every(k => keys.includes(k))
            );

            if (isStandard) {
              const withIds = parsed.map(r => ({
                ...r,
                id: r.id || Date.now().toString() + Math.random().toString(36).substring(7),
                nd: Number(r.nd) || 0,
                ne: Number(r.ne) || 0,
                np: Number(r.np) || 0,
                nc: Number(r.nc) || 0,
                nr: Number(r.nr) || 0,
              }));
              const combined = [...matrixRows, ...withIds];
              setMatrixRows(combined);
              if (actualConvoId && actualConvoId !== 'new') {
                saveMatrixData(combined);
              } else {
                isPendingImport.current = true;
              }
              alert(`Importados ${withIds.length} riesgos exitosamente.`);
            } else {
              setPendingRawRows(parsed);
              setIsConfirmModalOpen(true);
            }
          } else {
            alert('El archivo JSON debe contener un arreglo de objetos.');
          }
        } else if (file.name.endsWith('.xlsx')) {
          const wb = XLSX.read(data, { type: 'binary' });
          
          let allSheetRows: any[] = [];
          let hasMatrixSheet = false;
          
          for (const sheetName of wb.SheetNames) {
            const ws = wb.Sheets[sheetName];
            
            // 1. Autofill merged cells in the sheet object
            autofillMergedCells(ws);
            
            // 2. Convert to raw arrays
            const rawRows = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1 });
            if (rawRows.length === 0) continue;
            
            // 3. Find if it's a matrix sheet by checking if any row contains GTC-45 keywords
            let headerRowIdx = -1;
            for (let r = 0; r < Math.min(20, rawRows.length); r++) {
              const row = rawRows[r];
              if (Array.isArray(row) && row.some(cell => {
                const str = String(cell || '').toLowerCase();
                return str === 'proceso' || str === 'actividad' || str === 'actividades' || str === 'peligro';
              })) {
                headerRowIdx = r;
                break;
              }
            }
            
            // If no matrix keywords found in the first 20 rows, skip this sheet (it's a reference sheet)
            if (headerRowIdx === -1) continue;
            
            hasMatrixSheet = true;
            
            // 4. Extract and combine headers
            const headers = rawRows[headerRowIdx].map(h => String(h || '').trim());
            let startDataRow = headerRowIdx + 1;
            
            if (rawRows[startDataRow] && rawRows[startDataRow].some(cell => {
              const str = String(cell || '').toLowerCase();
              return str === 'descripcion' || str === 'descripción' || str === 'fuente' || str === 'clasificación' || str === 'clasificacion' || str === 'medio' || str === 'individuo';
            })) {
              const subHeaders = rawRows[startDataRow];
              for (let col = 0; col < headers.length; col++) {
                const subVal = String(subHeaders[col] || '').trim();
                const mainVal = headers[col] || '';
                if (!mainVal && subVal) {
                  headers[col] = subVal;
                } else if (mainVal && subVal && subVal !== mainVal) {
                  headers[col] = `${mainVal} - ${subVal}`;
                }
              }
              startDataRow++;
            }
            
            // 5. Map rows to objects
            for (let r = startDataRow; r < rawRows.length; r++) {
              const row = rawRows[r];
              if (!row || row.every(cell => cell === null || cell === undefined || String(cell).trim() === '')) {
                continue;
              }
              
              const obj: any = { __sheetName: sheetName };
              for (let col = 0; col < headers.length; col++) {
                const key = headers[col] || `Column_${col}`;
                obj[key] = row[col] !== undefined ? row[col] : '';
              }
              allSheetRows.push(obj);
            }
          }
          
          if (!hasMatrixSheet) {
            alert('No se encontró ninguna hoja con formato de matriz (GTC-45) en el archivo Excel.');
            return;
          }
          
          if (allSheetRows.length === 0) {
            alert('El archivo Excel está vacío o no contiene filas de datos.');
            return;
          }

          const firstRow = allSheetRows[0] || {};
          const keys = Object.keys(firstRow);

          const isStandard = (
            keys.some(k => k.toLowerCase() === 'proceso') &&
            keys.some(k => k.toLowerCase() === 'actividad') &&
            keys.some(k => k.toLowerCase().includes('peligro'))
          ) || (
            ['Proceso', 'Actividad', 'Descripción del Peligro'].every(k => keys.includes(k))
          );

          if (isStandard) {
            const newRows = allSheetRows.map((r: any) => ({
              proceso: r['Proceso'] || r['proceso'] || '',
              zona: r['Zona / Lugar'] || r['Zona'] || r['zona'] || '',
              actividad: r['Actividad'] || r['actividad'] || '',
              tareas: r['Tareas'] || r['tareas'] || '',
              rutinaria: r['Rutinaria'] || r['rutinaria'] || 'Sí',
              peligro_descripcion: r['Descripción del Peligro'] || r['Descripción'] || r['peligro_descripcion'] || '',
              peligro_clasificacion: r['Clasificación'] || r['clasificacion'] || '',
              efectos_posibles: r['Efectos Posibles'] || r['efectos_posibles'] || '',
              controles_fuente: r['Ctrl. Fuente'] || r['controles_fuente'] || 'Ninguno',
              controles_medio: r['Ctrl. Medio'] || r['controles_medio'] || 'Ninguno',
              controles_individuo: r['Ctrl. Individuo'] || r['controles_individuo'] || 'Ninguno',
              nd: Number(r['ND']) || Number(r['nd']) || 0,
              ne: Number(r['NE']) || Number(r['ne']) || 0,
              np: Number(r['NP']) || Number(r['np']) || 0,
              nc: Number(r['NC']) || Number(r['nc']) || 0,
              nr: Number(r['NR']) || Number(r['nr']) || 0,
              interpretacion_nr: r['Interpretación NR'] || r['interpretacion_nr'] || '',
              aceptabilidad: r['Aceptabilidad del Riesgo'] || r['Aceptabilidad'] || r['aceptabilidad'] || '',
              medida_eliminacion: r['Eliminación'] || r['medida_eliminacion'] || 'Ninguno',
              medida_sustitucion: r['Sustitución'] || r['medida_sustitucion'] || 'Ninguno',
              medida_ingenieria: r['Ctrl. Ingeniería'] || r['Ingeniería'] || r['medida_ingenieria'] || 'Ninguno',
              medida_administrativa: r['Ctrl. Administrativos'] || r['Administrativos'] || r['medida_administrativa'] || 'Ninguno',
              medida_eppu: r['Equipos/EPP'] || r['EPP'] || r['medida_eppu'] || 'Ninguno',
              factores_reduccion: r['Factores de Reducción'] || r['Factores Reducción (Anexo E)'] || r['factores_reduccion'] || 'No aplica',
              nd_cualitativo: null,
              id: Date.now().toString() + Math.random().toString(36).substring(7),
            }));

            const combined = [...matrixRows, ...newRows];
            setMatrixRows(combined);
            if (actualConvoId && actualConvoId !== 'new') {
              saveMatrixData(combined);
            } else {
              isPendingImport.current = true;
            }
            alert(`Importados ${newRows.length} riesgos exitosamente.`);
          } else {
            setPendingRawRows(allSheetRows);
            setIsConfirmModalOpen(true);
          }
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
  const [sortField, setSortField] = useState<
    'proceso' | 'nr' | 'peligro_clasificacion' | 'interpretacion_nr' | ''
  >('');
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
  const actualConvoId =
    conversation?.conversationId && conversation.conversationId !== 'new'
      ? conversation.conversationId
      : conversationId;
  const isSubmitting = useRecoilValue(store.isSubmittingFamily(0));

  const fetchMatrix = useCallback(
    async (id?: string | null) => {
      try {
        setIsLoading(true);
        // Lógica Bio-individual
        if (workerId) {
          const res = await fetch(`/api/sgsst/workers/worker/${workerId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          if (data?.worker?.riesgosIpevar) setMatrixRows(data.worker.riesgosIpevar);
          return;
        }

        // Lógica por defecto (conversación)
        const targetId = id ?? actualConvoId;
        if (!targetId || targetId === 'new') return;
        const res = await fetch(`/api/sgsst/gtc45-workspace/matrix/${targetId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data?.matrixRows) setMatrixRows(data.matrixRows);
        if (data?.chartConclusions) setChartConclusions(data.chartConclusions);
      } catch (e) {
        console.error('[Matriz] Fetch error:', e);
      } finally {
        setIsLoading(false);
      }
    },
    [actualConvoId, token, workerId],
  );

  useEffect(() => {
    if (workerId) {
      fetchMatrix();
      return;
    }
    if (!actualConvoId || actualConvoId === 'new') return;
    if (isPendingImport.current && matrixRows.length > 0) {
      saveMatrixData(matrixRows);
      isPendingImport.current = false;
    } else {
      fetchMatrix(actualConvoId);
    }
  }, [actualConvoId, workerId]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSubmitting) {
      if (workerId) {
        interval = setInterval(() => fetchMatrix(), 3000);
      } else if (actualConvoId && actualConvoId !== 'new') {
        interval = setInterval(() => fetchMatrix(actualConvoId), 3000);
      }
    }
    if (!isSubmitting) {
      if (workerId) fetchMatrix();
      else if (actualConvoId && actualConvoId !== 'new') fetchMatrix(actualConvoId);
    }
    return () => clearInterval(interval);
  }, [isSubmitting, actualConvoId, workerId]);

  const saveMatrixData = async (rows: MatrixRow[]) => {
    try {
      setIsSaving(true);
      if (workerId) {
        await fetch(`/api/sgsst/workers/${workerId}/ipevar`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ riesgosIpevar: rows }),
        });
        return;
      }

      if (!actualConvoId || actualConvoId === 'new') return;
      await fetch(`/api/sgsst/gtc45-workspace/matrix/${actualConvoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ matrixRows: rows }),
      });
    } catch (e) {
      console.error('[Matriz] Save error:', e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCellChange = (index: number, field: keyof MatrixRow, value: any) => {
    const newRows = [...matrixRows];
    // @ts-ignore
    newRows[index][field] = value;
    if (['nd', 'ne', 'nc'].includes(field as string)) {
      const row = newRows[index];
      row.np = (Number(row.nd) || 0) * (Number(row.ne) || 0);
      row.nr = row.np * (Number(row.nc) || 0);
      if (row.nr >= 500) {
        row.interpretacion_nr = 'I';
        row.aceptabilidad = 'No Aceptable';
      } else if (row.nr >= 150) {
        row.interpretacion_nr = 'II';
        row.aceptabilidad = 'No Aceptable o Aceptable con Control Específico';
      } else if (row.nr >= 40) {
        row.interpretacion_nr = 'III';
        row.aceptabilidad = 'Mejorable';
      } else {
        row.interpretacion_nr = 'IV';
        row.aceptabilidad = 'Aceptable';
      }
    }
    setMatrixRows(newRows);
  };

  const addRow = () => {
    const newRow: MatrixRow = {
      proceso: '',
      zona: '',
      actividad: '',
      tareas: '',
      rutinaria: 'Sí',
      peligro_descripcion: '',
      peligro_clasificacion: '',
      efectos_posibles: '',
      controles_fuente: 'Ninguno',
      controles_medio: 'Ninguno',
      controles_individuo: 'Ninguno',
      nd: 0,
      ne: 0,
      np: 0,
      nc: 0,
      nr: 0,
      interpretacion_nr: '',
      aceptabilidad: '',
      medida_eliminacion: 'Ninguno',
      medida_sustitucion: 'Ninguno',
      medida_ingenieria: 'Ninguno',
      medida_administrativa: 'Ninguno',
      medida_eppu: 'Ninguno',
      factores_reduccion: 'No aplica',
      nd_cualitativo: null,
    };
    setMatrixRows((prev) => [...prev, newRow]);
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
        body: JSON.stringify({ row: matrixRows[index], modelName: selectedModel, workerId }),
      });
      const data = await res.json();
      if (data.updatedFields) {
        const newRows = [...matrixRows];
        const original = newRows[index];

        // ─── Campos que el usuario definió desde el chat → NUNCA sobreescribir ───
        const PROTECTED_FIELDS = [
          'proceso',
          'zona',
          'actividad',
          'tareas',
          'rutinaria',
          'peligro_descripcion',
          'peligro_clasificacion',
          'efectos_posibles',
          'controles_fuente',
          'controles_medio',
          'controles_individuo',
        ] as const;

        const safeUpdate = { ...data.updatedFields };
        for (const field of PROTECTED_FIELDS) {
          // If the original already had a value, restore it — AI cannot change it
          if (original[field]) safeUpdate[field] = original[field];
        }

        newRows[index] = { ...original, ...safeUpdate };
        setMatrixRows(newRows);
      }
    } catch (e) {
      console.error('[Matriz] AI row update error:', e);
    } finally {
      setAiRowLoading(null);
    }
  };

  // ── AI: Crear Informe Ejecutivo (inyecta en LiveEditor) ──────────────────
  const handleAnalyzeMatrix = async () => {
    if (!matrixRows.length) return;
    setIsAnalyzing(true);
    try {
      const res = await fetch('/api/sgsst/gtc45-workspace/ai-analyze-matrix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ matrixRows, modelName: selectedModel, workerId }),
      });
      const data = await res.json();
      if (data.analysis) {
        setReportContent(data.analysis);
        reportContentRef.current = data.analysis;
        liveEditorRef.current?.setHTML(data.analysis);
        setIsReportExpanded(true);
        setTimeout(
          () =>
            document.getElementById('ipevar-report-editor')?.scrollIntoView({ behavior: 'smooth' }),
          300,
        );
      }
    } catch (e) {
      console.error('[Matriz] AI analyze error:', e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveReport = useCallback(async () => {
    const contentToSave = reportContentRef.current || reportContent;
    if (!contentToSave || !token) return;
    try {
      const isNew = !reportConversationId || reportConversationId === 'new';
      const res = await fetch('/api/sgsst/diagnostico/save-report', {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(
          isNew
            ? {
                content: contentToSave,
                title: `Informe IPEVAR GTC-45 - ${new Date().toLocaleDateString('es-CO')}`,
                tags: ['sgsst-matriz-ipevar'],
              }
            : {
                conversationId: reportConversationId,
                messageId: reportMessageId,
                content: contentToSave,
              },
        ),
      });
      if (res.ok) {
        const data = await res.json();
        if (isNew) {
          setReportConversationId(data.conversationId);
          setReportMessageId(data.messageId);
        }
        setRefreshTrigger((prev) => prev + 1);
        setIsHistoryOpen(false);
        alert('Informe guardado en el historial de SGSST.');
      }
    } catch (e) {
      console.error('Error saving report', e);
    }
  }, [reportContent, token, reportConversationId, reportMessageId]);

  const handleSelectReport = async (reportOrId: any) => {
    let content = '',
      convId = '',
      msgId = '';
    if (typeof reportOrId === 'string') {
      convId = reportOrId;
      try {
        const res = await fetch(`/api/messages/${convId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const messages = await res.json();
          const reportMsg = messages
            .reverse()
            .find(
              (m: any) =>
                m.sender === 'SGSST Diagnóstico' ||
                (m.isCreatedByUser === false && m.text?.length > 100),
            );
          if (reportMsg) {
            content = reportMsg.text;
            msgId = reportMsg.messageId;
          }
        }
      } catch {
        /* ignore */
      }
    } else if (reportOrId?.content) {
      content = reportOrId.content;
      convId = reportOrId.conversationId;
      msgId = reportOrId.messageId;
    }
    if (content) {
      setReportContent(content);
      reportContentRef.current = content;
      liveEditorRef.current?.setHTML(content);
      setReportConversationId(convId);
      setReportMessageId(msgId);
      setIsHistoryOpen(false);
      setIsReportExpanded(true);
    }
  };

  // ── Excel export ─────────────────────────────────────────────────────────
  const handleExportExcel = async () => {
    try {
      setIsLoading(true);
      const { exportMatrizIPEVARToExcel } = await import('./exportIPEVAR');
      await exportMatrizIPEVARToExcel(matrixRows);
    } catch (e) {
      console.error('[Matriz] Export error:', e);
      alert(`Error al exportar la matriz: ${e instanceof Error ? e.message : JSON.stringify(e)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportTemplate = async () => {
    try {
      setIsLoading(true);
      const { exportMatrizIPEVARToExcel } = await import('./exportIPEVAR');
      await exportMatrizIPEVARToExcel([]);
    } catch (e) {
      console.error('[Matriz] Template export error:', e);
      alert(`Error al descargar el formato: ${e instanceof Error ? e.message : JSON.stringify(e)}`);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Filtered + Sorted display rows ───────────────────────────────────────
  const displayRows = useMemo(() => {
    let rows = matrixRows.map((row, idx) => ({ row, idx }));

    if (filterText) {
      const q = filterText.toLowerCase();
      rows = rows.filter(({ row }) =>
        [
          row.proceso,
          row.actividad,
          row.peligro_clasificacion,
          row.peligro_descripcion,
          row.efectos_posibles,
        ].some((f) => f?.toLowerCase().includes(q)),
      );
    }
    if (filterProceso) rows = rows.filter(({ row }) => row.proceso === filterProceso);
    if (filterCalificacion)
      rows = rows.filter(({ row }) => row.interpretacion_nr === filterCalificacion);
    if (filterClasificacion)
      rows = rows.filter(({ row }) => row.peligro_clasificacion === filterClasificacion);

    if (sortField) {
      rows.sort((a, b) => {
        const va =
          sortField === 'nr' ? Number(a.row.nr) : String(a.row[sortField as keyof MatrixRow] || '');
        const vb =
          sortField === 'nr' ? Number(b.row.nr) : String(b.row[sortField as keyof MatrixRow] || '');
        // @ts-ignore
        return sortDir === 'asc' ? (va > vb ? 1 : -1) : va < vb ? 1 : -1;
      });
    }
    return rows;
  }, [
    matrixRows,
    filterText,
    filterProceso,
    filterCalificacion,
    filterClasificacion,
    sortField,
    sortDir,
  ]);

  const procesosUnicos = useMemo(
    () => [...new Set(matrixRows.map((r) => r.proceso).filter(Boolean))],
    [matrixRows],
  );
  const clasificacionesUnicas = useMemo(
    () => [...new Set(matrixRows.map((r) => r.peligro_clasificacion).filter(Boolean))],
    [matrixRows],
  );

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const SortIcon = ({ field }: { field: typeof sortField }) =>
    sortField === field ? (
      <span className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>
    ) : (
      <span className="ml-1 opacity-30">↕</span>
    );

  const renderModals = () => (
    <>
      {/* ── AI Adapt Loading Overlay ────────────────────────────────────── */}
      {isAiImportLoading && (
        <div className="fixed inset-0 z-[999999] flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-md">
          <div className="flex flex-col items-center gap-6 rounded-3xl border border-teal-500/20 bg-surface-secondary/90 p-8 shadow-2xl">
            <div className="relative flex h-16 w-16 items-center justify-center">
              <div className="absolute inset-0 animate-ping rounded-full bg-teal-500/20" />
              <div className="absolute inset-2 animate-pulse rounded-full bg-teal-500/40" />
              <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-text-primary">Adaptando Matriz con IA</h3>
              <p className="mt-2 text-sm text-text-secondary max-w-xs">
                Nuestra IA está mapeando las columnas y recalculando los niveles de riesgo según el formato estándar. Esto puede tomar unos segundos...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── AI Confirm Adapt Modal ──────────────────────────────────────── */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-[999998] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md overflow-hidden rounded-3xl border border-border-medium bg-surface-primary shadow-2xl transition-all">
            <div className="relative p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-yellow-500/20 bg-yellow-500/10 text-yellow-600">
                <Sparkles className="h-6 w-6 animate-pulse" />
              </div>
              <h3 className="text-lg font-bold text-text-primary">
                ¿Reconstruir matriz con IA?
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                Hemos detectado que el archivo cargado no coincide con el formato estándar de Wappy.
              </p>
              <p className="mt-2 text-sm leading-relaxed text-text-secondary font-medium">
                ¿Deseas que la IA de Wappy analice y adapte automáticamente tu matriz para que encaje perfectamente con nuestro formato de columnas GTC-45?
              </p>
            </div>
            
            <div className="flex items-center gap-3 bg-surface-secondary px-6 py-4">
              <button
                type="button"
                onClick={() => {
                  setIsConfirmModalOpen(false);
                  setPendingRawRows([]);
                }}
                className="flex-1 rounded-xl border border-border-medium bg-surface-primary py-2.5 text-sm font-semibold text-text-primary transition-all hover:bg-surface-hover"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAiImport}
                className="flex-1 rounded-xl bg-teal-600 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-teal-700"
              >
                Sí, usar IA
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  // ── Guard: no convo ───────────────────────────────────────────────────────
  if (!workerId && (!actualConvoId || actualConvoId === 'new') && matrixRows.length === 0) {
    return (
      <div className="relative flex h-full flex-col items-center justify-center border-l border-border-light bg-surface-primary p-8 text-center">
        {/* Botón para cerrar/minimizar en mobile si está expandido */}
        <button
          onClick={() => setIsMaximized(false)}
          className="absolute right-4 top-4 rounded-xl border border-border-medium p-2 text-text-primary transition-all hover:bg-surface-hover md:hidden"
          aria-label="Cerrar Matriz"
        >
          <Minimize2 className="h-5 w-5" />
        </button>

        <div className="mb-4 rounded-full border border-border-medium bg-surface-tertiary p-4 shadow-sm">
          <AlertTriangle className="h-8 w-8 text-yellow-500" />
        </div>
        <h3 className="mb-2 text-lg font-semibold text-text-primary">Matriz Inactiva</h3>
        <p className="mb-6 max-w-sm text-sm text-text-secondary">
          Envía el primer mensaje en el chat para instanciar la matriz IPEVAR. Los riesgos se
          guardarán automáticamente aquí.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex transform items-center justify-center gap-2 rounded-xl border border-teal-500/20 bg-teal-500/10 px-6 py-2.5 font-bold text-teal-600 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-teal-500 hover:text-white"
          >
            <Upload className="h-4 w-4" />
            Importar Matriz Existente / Exportada
          </button>
          <button
            onClick={handleExportTemplate}
            className="flex transform items-center justify-center gap-2 rounded-xl border border-border-medium bg-surface-primary px-6 py-2.5 font-bold text-text-primary shadow-sm transition-all hover:-translate-y-0.5 hover:bg-surface-hover"
          >
            <Download className="h-4 w-4" />
            Descargar Formato en Blanco (Excel)
          </button>
        </div>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept=".xlsx,.json"
          onChange={handleImportFile}
        />
        {renderModals()}
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
    <div
      ref={containerRef}
      className={`flex h-full flex-col border-l border-border-light transition-colors duration-300 ${isMaximized ? 'fixed inset-0 z-[999999] m-0 h-screen w-screen rounded-none bg-surface-primary shadow-2xl' : 'w-full bg-surface-primary'}`}
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div
        className="relative z-[300] flex min-w-0 shrink-0 items-center justify-between overflow-visible border-b border-border-light bg-surface-secondary px-4"
        style={{ minHeight: '4rem' }}
      >
        <div className="mr-2 flex min-w-0 flex-shrink items-center gap-3 overflow-hidden text-ellipsis">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-teal-500/20 bg-teal-500/10 text-teal-600 shadow-sm">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div className="min-w-0 overflow-hidden">
            <h2 className="truncate text-sm font-semibold text-text-primary">Matriz IPEVAR Live</h2>
            <div className="flex items-center gap-1.5 overflow-hidden">
              <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-green-500" />
              <span className="truncate text-xs text-text-secondary">Sincronización Activa</span>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-nowrap items-center gap-2 overflow-visible py-1">
          {isLoading && <RefreshCw className="h-4 w-4 animate-spin text-text-secondary" />}

          <ModelSelector
            selectedModel={selectedModel}
            onSelectModel={setSelectedModel}
            hideTooltip={true}
          />

          {/* Añadir Fila */}
          <button
            onClick={addRow}
            className="group flex h-10 min-w-[40px] flex-shrink-0 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-teal-500/40 bg-surface-primary px-2.5 text-teal-600 shadow-sm outline-none transition-all duration-300 hover:-rotate-3 hover:scale-105 hover:bg-teal-50 dark:text-teal-400 dark:hover:bg-teal-900/20"
          >
            <Plus className="h-4 w-4 shrink-0" />
            <span className="flex max-w-0 items-center overflow-hidden whitespace-nowrap text-sm font-bold tracking-wide opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[200px] group-hover:opacity-100">
              Añadir Riesgo
            </span>
          </button>

          {/* Analizar Matriz Completa */}
          <button
            onClick={handleAnalyzeMatrix}
            disabled={isAnalyzing || matrixRows.length === 0}
            className="group flex h-10 min-w-[40px] flex-shrink-0 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-purple-500/40 bg-surface-primary px-2.5 text-purple-600 shadow-sm outline-none transition-all duration-300 hover:-rotate-3 hover:scale-105 hover:bg-purple-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-purple-400 dark:hover:bg-purple-900/20"
          >
            {isAnalyzing ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
            ) : (
              <FileTextIcon className="h-4 w-4 shrink-0" />
            )}
            <span className="flex max-w-0 items-center overflow-hidden whitespace-nowrap text-sm font-bold tracking-wide opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[200px] group-hover:opacity-100">
              {isAnalyzing ? 'Generando…' : 'Análisis IPEVAR'}
            </span>
          </button>

          {/* Importar */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="group flex h-10 min-w-[40px] flex-shrink-0 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-border-medium bg-surface-primary px-2.5 text-text-primary shadow-sm outline-none transition-all duration-300 hover:-rotate-3 hover:scale-105 hover:bg-surface-hover"
          >
            <Upload className="h-4 w-4 shrink-0" />
            <span className="flex max-w-0 items-center overflow-hidden whitespace-nowrap text-sm font-bold tracking-wide opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[200px] group-hover:opacity-100">
              Importar
            </span>
          </button>

          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".xlsx,.json"
            onChange={handleImportFile}
          />

          {/* Exportar — informe (HTML/Word/PDF) + Matriz (Excel) */}
          <ExportDropdown
            content={reportContent || ''}
            fileName={`Informe_IPEVAR_GTC45_${new Date().toISOString().slice(0, 10)}`}
            reportType="general"
            onExportExcel={handleExportExcel}
          />

          {/* Guardar */}
          <button
            onClick={() => saveMatrixData(matrixRows)}
            className="group flex h-10 min-w-[40px] flex-shrink-0 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-green-500/40 bg-surface-primary px-2.5 text-green-600 shadow-sm outline-none transition-all duration-300 hover:-rotate-3 hover:scale-105 hover:bg-green-50 disabled:opacity-50 dark:text-green-400 dark:hover:bg-green-900/20"
          >
            <Save className="h-4 w-4 shrink-0" />
            <span className="flex max-w-0 items-center overflow-hidden whitespace-nowrap text-sm font-bold tracking-wide opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[200px] group-hover:opacity-100">
              {isSaving ? 'Guardando…' : 'Guardar'}
            </span>
          </button>

          {/* Maximizar */}
          <button
            onClick={() => setIsMaximized((m) => !m)}
            className="group flex h-10 min-w-[40px] flex-shrink-0 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-border-medium bg-surface-primary px-2.5 text-text-primary shadow-sm outline-none transition-all duration-300 hover:-rotate-3 hover:scale-105 hover:bg-surface-hover"
          >
            {isMaximized ? (
              <Minimize2 className="h-4 w-4 shrink-0" />
            ) : (
              <Maximize2 className="h-4 w-4 shrink-0" />
            )}
            <span className="flex max-w-0 items-center overflow-hidden whitespace-nowrap text-sm font-bold tracking-wide opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[200px] group-hover:opacity-100">
              {isMaximized ? 'Restaurar' : 'Expandir'}
            </span>
          </button>
        </div>
      </div>

      {/* Informe ahora va en el LiveEditor de abajo — panel antiguo eliminado */}

      {/* ── Barra de Filtros ──────────────────────────────────────────────── */}
      <div className="relative z-[200] flex shrink-0 flex-wrap items-center gap-2 border-b border-border-light bg-surface-secondary px-4 py-2.5">
        {/* Búsqueda libre */}
        <div className="relative">
          <input
            type="search"
            placeholder="Buscar en la matriz…"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="h-8 min-w-[170px] rounded-xl border border-border-medium bg-surface-primary pl-7 pr-3 text-xs outline-none transition-colors placeholder:text-text-secondary focus:border-teal-400"
          />
          <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-text-secondary">
            🔍
          </span>
        </div>

        {/* Filtro Proceso */}
        <FilterSelect
          value={filterProceso}
          onChange={setFilterProceso}
          placeholder="Todos los procesos"
          options={procesosUnicos.map((p) => ({ value: p, label: p }))}
        />

        {/* Filtro Clasificación (Peligros) — 2do lugar después de Procesos */}
        <FilterSelect
          value={filterClasificacion}
          onChange={setFilterClasificacion}
          placeholder="Todos los peligros"
          options={clasificacionesUnicas.map((c) => ({ value: c, label: c }))}
        />

        {/* Filtro Calificación (NR) */}
        <FilterSelect
          value={filterCalificacion}
          onChange={setFilterCalificacion}
          placeholder="Todas las calificaciones"
          options={[
            { value: 'I', label: '🔴 Nivel I — No Aceptable' },
            { value: 'II', label: '🟠 Nivel II — Aceptable con control' },
            { value: 'III', label: '🟡 Nivel III — Mejorable' },
            { value: 'IV', label: '🟢 Nivel IV — Aceptable' },
          ]}
        />

        {/* Limpiar filtros */}
        {(filterText || filterProceso || filterCalificacion || filterClasificacion) && (
          <button
            onClick={() => {
              setFilterText('');
              setFilterProceso('');
              setFilterCalificacion('');
              setFilterClasificacion('');
            }}
            className="flex h-8 cursor-pointer items-center gap-1 rounded-xl border border-red-200 bg-red-50 px-3 text-xs font-medium text-red-600 transition-colors hover:bg-red-100 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400"
          >
            ✕ Limpiar
            <span className="rounded-full bg-red-600 px-1.5 py-0.5 text-[9px] font-black text-white">
              {
                [filterText, filterProceso, filterCalificacion, filterClasificacion].filter(Boolean)
                  .length
              }
            </span>
          </button>
        )}
        <span className="ml-auto text-xs font-medium tabular-nums text-text-secondary">
          {displayRows.length} / {matrixRows.length} riesgos
        </span>
      </div>

      {/* ── Tabla ──────────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto">
        {matrixRows.length === 0 && !isLoading ? (
          <div className="flex h-48 flex-col items-center justify-center gap-3 text-text-secondary">
            <ShieldAlert className="h-10 w-10 opacity-20" />
            <p className="px-4 text-center text-sm">
              Aún no hay riesgos en la matriz. Pídele al Experto IPEVAR en el chat que los registre,
              o añádelos manualmente.
            </p>
            <button
              onClick={addRow}
              className="mt-2 flex items-center gap-2 rounded-xl bg-teal-600 px-6 py-2.5 font-bold text-white shadow-md transition-colors hover:-translate-y-0.5 hover:bg-teal-700"
            >
              <Plus className="h-5 w-5" /> Añadir Primer Riesgo
            </button>
          </div>
        ) : (
          <div className="min-w-max">
            <table className="w-full border-collapse text-sm">
              <thead className="sticky top-0 z-[100] bg-surface-secondary text-xs font-bold uppercase tracking-wide text-text-secondary">
                <tr>
                  {/* Identificación */}
                  <th
                    className="min-w-[150px] cursor-pointer px-4 py-3 text-left hover:text-teal-600"
                    onClick={() => toggleSort('proceso')}
                  >
                    PROCESO <SortIcon field="proceso" />
                  </th>
                  <th className="min-w-[130px] px-4 py-3 text-left">ZONA</th>
                  <th className="min-w-[160px] px-4 py-3 text-left">ACTIVIDAD</th>
                  <th className="min-w-[200px] px-4 py-3 text-left">TAREAS</th>
                  <th className="min-w-[90px] px-4 py-3 text-center">RUTINARIA</th>
                  {/* Peligro */}
                  <th className="min-w-[220px] border-l-2 border-teal-500/20 px-4 py-3 text-left">
                    PELIGRO DESC.
                  </th>
                  <th
                    className="min-w-[150px] cursor-pointer px-4 py-3 text-left hover:text-teal-600"
                    onClick={() => toggleSort('peligro_clasificacion')}
                  >
                    CLASIFICACIÓN <SortIcon field="peligro_clasificacion" />
                  </th>
                  <th className="min-w-[220px] px-4 py-3 text-left">EFECTOS POSIBLES</th>
                  {/* Controles Existentes */}
                  <th className="min-w-[180px] border-l-2 border-blue-500/20 px-4 py-3 text-left text-blue-700 dark:text-blue-400">
                    CTRL. FUENTE
                  </th>
                  <th className="min-w-[180px] px-4 py-3 text-left text-blue-700 dark:text-blue-400">
                    CTRL. MEDIO
                  </th>
                  <th className="min-w-[180px] px-4 py-3 text-left text-blue-700 dark:text-blue-400">
                    CTRL. INDIVIDUO
                  </th>
                  {/* Evaluación */}
                  <th className="min-w-[80px] border-l-2 border-purple-500/20 px-4 py-3 text-center text-purple-700 dark:text-purple-400">
                    ND
                  </th>
                  <th className="min-w-[60px] px-4 py-3 text-center text-purple-700 dark:text-purple-400">
                    NE
                  </th>
                  <th className="min-w-[60px] px-4 py-3 text-center text-purple-700 dark:text-purple-400">
                    NP
                  </th>
                  <th className="min-w-[60px] px-4 py-3 text-center text-purple-700 dark:text-purple-400">
                    NC
                  </th>
                  <th
                    className="min-w-[70px] cursor-pointer border-l-2 border-orange-500/20 px-4 py-3 text-center text-orange-700 hover:text-orange-500 dark:text-orange-400"
                    onClick={() => toggleSort('nr')}
                  >
                    NR <SortIcon field="nr" />
                  </th>
                  <th
                    className="min-w-[170px] cursor-pointer border-l border-border-light px-4 py-3 text-left text-slate-700 hover:text-slate-900 dark:text-slate-400"
                    onClick={() => toggleSort('interpretacion_nr')}
                  >
                    SIGNIFICADO EXPLICACIÓN <SortIcon field="interpretacion_nr" />
                  </th>
                  {/* Clasificación visible entre NR y Eliminación */}
                  <th
                    className="min-w-[140px] cursor-pointer border-l-2 border-teal-500/20 px-4 py-3 text-left text-teal-700 hover:text-teal-500 dark:text-teal-400"
                    onClick={() => toggleSort('peligro_clasificacion')}
                  >
                    CLASIFICACIÓN <SortIcon field="peligro_clasificacion" />
                  </th>
                  {/* Medidas */}
                  <th className="min-w-[200px] border-l-2 border-emerald-500/20 px-4 py-3 text-left text-emerald-700 dark:text-emerald-400">
                    ELIMINACIÓN
                  </th>
                  <th className="min-w-[200px] px-4 py-3 text-left text-emerald-700 dark:text-emerald-400">
                    SUSTITUCIÓN
                  </th>
                  <th className="min-w-[200px] px-4 py-3 text-left text-emerald-700 dark:text-emerald-400">
                    INGENIERÍA
                  </th>
                  <th className="min-w-[220px] px-4 py-3 text-left text-emerald-700 dark:text-emerald-400">
                    ADMINISTRATIVOS
                  </th>
                  <th className="min-w-[180px] px-4 py-3 text-left text-emerald-700 dark:text-emerald-400">
                    EPP
                  </th>
                  {/* Anexo E */}
                  <th className="min-w-[220px] border-l-2 border-purple-400/30 bg-purple-50/50 px-4 py-3 text-left text-purple-700 dark:bg-purple-900/10 dark:text-purple-400">
                    FACTORES REDUCCIÓN (Anexo E)
                  </th>
                  {/* Acciones */}
                  <th className="sticky right-0 z-[200] min-w-[100px] border-l border-border-light bg-surface-secondary px-4 py-3 text-center shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.06)]">
                    ACCIONES
                  </th>
                </tr>
              </thead>
              <tbody>
                {displayRows.map(({ row, idx }) => (
                  <tr
                    key={idx}
                    className="hover:bg-surface-secondary/50 group border-b border-border-light transition-colors"
                  >
                    {/* Proceso */}
                    <td className="px-4 py-3">
                      <textarea
                        rows={2}
                        className="w-full min-w-[140px] resize border-transparent bg-transparent outline-none focus:border-transparent focus:outline-none focus:ring-0 dark:text-gray-200"
                        value={row.proceso || ''}
                        onChange={(e) => handleCellChange(idx, 'proceso', e.target.value)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <textarea
                        rows={2}
                        className="w-full min-w-[120px] resize border-transparent bg-transparent outline-none focus:border-transparent focus:outline-none focus:ring-0 dark:text-gray-200"
                        value={row.zona || ''}
                        onChange={(e) => handleCellChange(idx, 'zona', e.target.value)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <textarea
                        rows={2}
                        className="w-full min-w-[150px] resize border-transparent bg-transparent outline-none focus:border-transparent focus:outline-none focus:ring-0 dark:text-gray-200"
                        value={row.actividad || ''}
                        onChange={(e) => handleCellChange(idx, 'actividad', e.target.value)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <textarea
                        rows={2}
                        className="w-full min-w-[190px] resize border-transparent bg-transparent outline-none focus:border-transparent focus:outline-none focus:ring-0 dark:text-gray-200"
                        value={row.tareas || ''}
                        onChange={(e) => handleCellChange(idx, 'tareas', e.target.value)}
                      />
                    </td>

                    {/* Rutinaria toggle */}
                    <td className="px-4 py-3 text-center align-middle">
                      <button
                        onClick={() =>
                          handleCellChange(idx, 'rutinaria', row.rutinaria === 'Sí' ? 'No' : 'Sí')
                        }
                        className={`rounded-full border-2 px-3 py-1 text-xs font-bold transition-all ${row.rutinaria === 'Sí' ? 'border-teal-400 bg-teal-50 text-teal-700' : 'border-border-medium bg-surface-tertiary text-text-secondary'}`}
                      >
                        {row.rutinaria}
                      </button>
                    </td>

                    {/* Peligro */}
                    <td className="border-l border-border-light px-4 py-3">
                      <AITextarea
                        value={row.peligro_descripcion || ''}
                        onChange={(v) => handleCellChange(idx, 'peligro_descripcion', v)}
                        minW="210px"
                        fieldLabel="Descripción del Peligro"
                        row={row}
                        token={token}
                        selectedModel={selectedModel}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <textarea
                        rows={2}
                        className="w-full min-w-[140px] resize border-transparent bg-transparent outline-none focus:border-transparent focus:outline-none focus:ring-0 dark:text-gray-200"
                        value={row.peligro_clasificacion || ''}
                        onChange={(e) =>
                          handleCellChange(idx, 'peligro_clasificacion', e.target.value)
                        }
                      />
                    </td>
                    <td className="px-4 py-3">
                      <AITextarea
                        value={row.efectos_posibles || ''}
                        onChange={(v) => handleCellChange(idx, 'efectos_posibles', v)}
                        minW="210px"
                        fieldLabel="Efectos Posibles"
                        row={row}
                        token={token}
                        selectedModel={selectedModel}
                      />
                    </td>

                    {/* Controles existentes */}
                    <td className="border-l border-border-light bg-blue-500/5 px-4 py-3">
                      <AITextarea
                        value={row.controles_fuente || ''}
                        onChange={(v) => handleCellChange(idx, 'controles_fuente', v)}
                        minW="170px"
                        fieldLabel="Controles en la Fuente"
                        row={row}
                        token={token}
                        selectedModel={selectedModel}
                      />
                    </td>
                    <td className="bg-blue-500/5 px-4 py-3">
                      <AITextarea
                        value={row.controles_medio || ''}
                        onChange={(v) => handleCellChange(idx, 'controles_medio', v)}
                        minW="170px"
                        fieldLabel="Controles en el Medio"
                        row={row}
                        token={token}
                        selectedModel={selectedModel}
                      />
                    </td>
                    <td className="bg-blue-500/5 px-4 py-3">
                      <AITextarea
                        value={row.controles_individuo || ''}
                        onChange={(v) => handleCellChange(idx, 'controles_individuo', v)}
                        minW="170px"
                        fieldLabel="Controles en el Individuo"
                        row={row}
                        token={token}
                        selectedModel={selectedModel}
                      />
                    </td>

                    {/* Evaluación cuantitativa — ND con Anexo C inline */}
                    <td
                      className="relative border-l border-border-light bg-purple-500/5 px-4 py-3 align-top"
                      style={{ zIndex: Math.min(90 - idx, 100) }}
                    >
                      <input
                        type="number"
                        className="w-14 border-transparent bg-transparent text-center font-mono outline-none focus:border-transparent focus:outline-none focus:ring-0"
                        value={row.nd}
                        onChange={(e) => handleCellChange(idx, 'nd', e.target.value)}
                      />
                      <AnnexCSelector
                        row={row}
                        onSelect={(v) => {
                          handleCellChange(idx, 'nd_cualitativo', v);
                          handleCellChange(idx, 'nd', v);
                        }}
                        onPsicosocialChange={(dominio, dimension, desc) => {
                          handleCellChange(idx, 'psicosocial_dominio', dominio);
                          handleCellChange(idx, 'psicosocial_dimension', dimension);
                          handleCellChange(idx, 'peligro_descripcion', desc);
                        }}
                      />
                    </td>
                    <td className="bg-purple-500/5 px-4 py-3">
                      <input
                        type="number"
                        className="w-12 border-transparent bg-transparent text-center font-mono outline-none focus:border-transparent focus:outline-none focus:ring-0"
                        value={row.ne}
                        onChange={(e) => handleCellChange(idx, 'ne', e.target.value)}
                      />
                    </td>
                    <td className="bg-purple-500/5 px-4 py-3 text-center font-bold text-purple-600 dark:text-purple-400">
                      {row.np}
                    </td>
                    <td className="bg-purple-500/5 px-4 py-3">
                      <input
                        type="number"
                        className="w-12 border-transparent bg-transparent text-center font-mono outline-none focus:border-transparent focus:outline-none focus:ring-0"
                        value={row.nc}
                        onChange={(e) => handleCellChange(idx, 'nc', e.target.value)}
                      />
                    </td>
                    <td
                      className={`border-l-2 border-orange-500/20 bg-orange-500/5 px-4 py-3 text-center align-middle font-black ${nrColorClass(Number(row.nr))}`}
                    >
                      <div className="text-base">{row.nr}</div>
                    </td>
                    <td className="whitespace-nowrap border-l border-border-light px-4 py-3 align-middle text-[11px] font-medium text-text-secondary">
                      {row.interpretacion_nr === 'I'
                        ? '🔴 Nivel I — No Aceptable'
                        : row.interpretacion_nr === 'II'
                          ? '🟠 Nivel II — Aceptable con control'
                          : row.interpretacion_nr === 'III'
                            ? '🟡 Nivel III — Mejorable'
                            : row.interpretacion_nr === 'IV'
                              ? '🟢 Nivel IV — Aceptable'
                              : row.interpretacion_nr || '—'}
                    </td>

                    {/* Clasificación visible con badge de color */}
                    <td className="border-l border-border-light px-4 py-3 align-middle">
                      {(() => {
                        const c = (row.peligro_clasificacion || '').toLowerCase();
                        const color =
                          c.includes('biome') || c.includes('ergon')
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
                          <span
                            className={`inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-bold ${color}`}
                          >
                            {row.peligro_clasificacion || '—'}
                          </span>
                        );
                      })()}
                    </td>

                    {/* Medidas propuestas */}
                    <td className="border-l-2 border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
                      <AITextarea
                        value={row.medida_eliminacion || ''}
                        onChange={(v) => handleCellChange(idx, 'medida_eliminacion', v)}
                        minW="190px"
                        fieldLabel="Medida: Eliminación"
                        row={row}
                        token={token}
                        selectedModel={selectedModel}
                      />
                    </td>
                    <td className="bg-emerald-500/5 px-4 py-3">
                      <AITextarea
                        value={row.medida_sustitucion || ''}
                        onChange={(v) => handleCellChange(idx, 'medida_sustitucion', v)}
                        minW="190px"
                        fieldLabel="Medida: Sustitución"
                        row={row}
                        token={token}
                        selectedModel={selectedModel}
                      />
                    </td>
                    <td className="bg-emerald-500/5 px-4 py-3">
                      <AITextarea
                        value={row.medida_ingenieria || ''}
                        onChange={(v) => handleCellChange(idx, 'medida_ingenieria', v)}
                        minW="190px"
                        fieldLabel="Medida: Ingeniería"
                        row={row}
                        token={token}
                        selectedModel={selectedModel}
                      />
                    </td>
                    <td className="bg-emerald-500/5 px-4 py-3">
                      <AITextarea
                        value={row.medida_administrativa || ''}
                        onChange={(v) => handleCellChange(idx, 'medida_administrativa', v)}
                        minW="210px"
                        fieldLabel="Medida: Administrativos"
                        row={row}
                        token={token}
                        selectedModel={selectedModel}
                      />
                    </td>
                    <td className="bg-emerald-500/5 px-4 py-3">
                      <AITextarea
                        value={row.medida_eppu || ''}
                        onChange={(v) => handleCellChange(idx, 'medida_eppu', v)}
                        minW="170px"
                        fieldLabel="Medida: EPP"
                        row={row}
                        token={token}
                        selectedModel={selectedModel}
                      />
                    </td>

                    {/* Anexo E — Factores de Reducción */}
                    <td className="border-l-2 border-purple-400/30 bg-purple-50/50 px-4 py-3 dark:bg-purple-900/10">
                      <AITextarea
                        value={row.factores_reduccion || ''}
                        onChange={(v) => handleCellChange(idx, 'factores_reduccion', v)}
                        minW="210px"
                        fieldLabel="Factores de Reducción (Anexo E)"
                        row={row}
                        token={token}
                        selectedModel={selectedModel}
                      />
                    </td>

                    {/* Acciones */}
                    <td className="sticky right-0 z-[150] border-l border-border-light bg-surface-primary px-4 py-3 text-center align-middle shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.06)]">
                      <div className="flex flex-col items-center gap-2">
                        <button
                          onClick={() => handleAiUpdateRow(idx)}
                          disabled={aiRowLoading === idx}
                          className="group/btn flex items-center gap-1 rounded-lg border border-yellow-300 bg-yellow-50 px-2 py-1 text-[10px] font-bold text-yellow-600 transition-all hover:bg-yellow-100 disabled:opacity-50 dark:bg-yellow-900/20"
                        >
                          {aiRowLoading === idx ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Zap className="h-3.5 w-3.5" />
                          )}
                          <span>IA</span>
                        </button>
                        <button
                          onClick={() => removeRow(idx)}
                          className="rounded-md p-1.5 text-red-400 opacity-0 transition-opacity hover:bg-red-50 group-hover:opacity-100"
                        >
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
          <button
            onClick={addRow}
            className="flex items-center gap-2 text-xs font-medium text-text-secondary transition-colors hover:text-text-primary"
          >
            <Plus className="h-3 w-3" /> Añadir Fila
          </button>
        </div>
      </div>

      {/* ── Dashboard analítico y Resizer ───────────────────────────────────── */}
      <div
        onMouseDown={startDrag}
        onTouchStart={startDrag}
        className="group/resizer relative z-20 flex h-4 shrink-0 cursor-row-resize touch-none items-center justify-center border-y border-border-light bg-surface-tertiary transition-colors hover:bg-teal-500/20"
      >
        <div className="h-1 w-12 rounded-full bg-border-heavy group-hover/resizer:bg-teal-500/50" />
      </div>

      <div
        className="shrink-0 overflow-y-auto bg-surface-primary px-4 py-2"
        style={{ height: `${dashboardHeight}%` }}
      >
        <MatrizIPEVARDashboard
          matrixRows={matrixRows}
          conversationId={actualConvoId}
          token={token || ''}
          savedConclusions={chartConclusions}
          onConclusionSaved={(type, text) =>
            setChartConclusions((prev) => ({ ...prev, [type]: text }))
          }
          isMaximized={isMaximized}
        />

        {/* ── Informe Ejecutivo GTC-45 (LiveEditor) ────────────────────────
          El contenido se genera presionando 'Crear Informe' en el toolbar
        */}
        <div id="ipevar-report-editor" className="mb-4 mt-6">
          <CollapsibleReportBox
            onHistory={() => setIsHistoryOpen(!isHistoryOpen)}
            isHistoryOpen={isHistoryOpen}
            title="Matriz IPEVAR — GTC-45"
            icon={<FileTextIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />}
            actions={
              <ExportDropdown
                content={reportContent || ''}
                fileName="Informe_IPEVAR_GTC45"
                reportType="general"
                onExportExcel={handleExportExcel}
              />
            }
          >
            {isHistoryOpen && (
              <div className="mx-2 mb-4 mt-4 overflow-hidden rounded-2xl border border-border-medium bg-surface-secondary shadow-sm">
                <ReportHistory
                  onSelectReport={handleSelectReport}
                  isOpen={isHistoryOpen}
                  toggleOpen={() => setIsHistoryOpen(!isHistoryOpen)}
                  refreshTrigger={refreshTrigger}
                  tags={['sgsst-matriz-ipevar']}
                />
              </div>
            )}

            <div className="p-2">
              {reportContent ? (
                <div style={{ minHeight: '500px', width: '100%' }}>
                  <LiveEditor
                    ref={liveEditorRef}
                    initialContent={reportContent}
                    onUpdate={(html: string) => {
                      reportContentRef.current = html;
                    }}
                    reportSourceData={{ matrixRows, chartConclusions }}
                    onHistory={() => setIsHistoryOpen(!isHistoryOpen)}
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-4 py-16 text-text-secondary">
                  <FileTextIcon className="h-12 w-12 opacity-20" />
                  <p className="max-w-sm text-center text-sm">
                    Presiona <span className="font-bold text-purple-600">“Análisis IPEVAR”</span> en
                    la barra superior para que la IA genere el Informe Ejecutivo GTC-45 con análisis
                    de riesgos, controles y recomendaciones.
                  </p>
                  <div className="mt-2 flex gap-4">
                    <button
                      onClick={handleAnalyzeMatrix}
                      disabled={isAnalyzing || matrixRows.length === 0}
                      className="flex items-center gap-2 rounded-xl border border-purple-400 bg-purple-50 px-4 py-2 text-sm font-bold text-purple-700 transition-colors hover:bg-purple-100 disabled:opacity-50 dark:bg-purple-900/20 dark:text-purple-300"
                    >
                      {isAnalyzing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <FileTextIcon className="h-4 w-4" />
                      )}
                      {isAnalyzing ? 'Generando informe…' : 'Generar Informe Ahora'}
                    </button>
                    <button
                      onClick={() => setIsHistoryOpen(true)}
                      className="flex items-center gap-2 rounded-xl border border-teal-400 bg-teal-50 px-4 py-2 text-sm font-bold text-teal-700 shadow-sm transition-colors hover:bg-teal-100 dark:bg-teal-900/20 dark:text-teal-300"
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
      {renderModals()}
    </div>
  );

  return isMaximized ? ReactDOM.createPortal(renderContent(), document.body) : renderContent();
}
