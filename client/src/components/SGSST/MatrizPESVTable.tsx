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
  Truck,
  Zap,
  Loader2,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Check,
  FileText as FileTextIcon,
  History,
  Upload,
  Download,
  X,
  Star,
  BarChart3,
  FileSpreadsheet,
  Briefcase,
  CheckSquare,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useAuthContext } from '~/hooks';
import { useToastContext } from '@librechat/client';
import {
  MatrixRow,
  ACTORES_VIALES,
  FACTORES_RIESGO,
  NP_CUALITATIVO_OPCIONES,
  NE_CUALITATIVO_OPCIONES,
  NC_CUALITATIVO_OPCIONES,
  ESTADO_OPCIONES,
  TRATAMIENTO_ACCION_OPCIONES,
  CONTROLES_TIPO_OPCIONES,
  mapNPCualitativoToNum,
  mapNECualitativoToNum,
  mapNCCualitativoToNum,
  getNPCualitativoLabel,
  getNECualitativoLabel,
  getNCCualitativoLabel,
  getInterpretacionPESV,
  normalizeControlTipo,
} from './MatrizPESVConstants';
import { exportMatrizPESVToExcel } from './exportPESV';
import MatrizPESVDashboard from './MatrizPESVDashboard';
import ModelSelector, { AI_MODELS } from './ModelSelector';
import ExportDropdown from './ExportDropdown';
import LiveEditor, { type LiveEditorHandle } from '~/components/Liva/Editor/LiveEditor';
import ReportHistory from '~/components/Liva/ReportHistory';
import CollapsibleReportBox from './CollapsibleReportBox';
import SGSSTToolbar from './SGSSTToolbar';

const toSentenceCase = (str: string): string => {
  if (!str) return '';
  const trimmed = str.trim();
  if (trimmed.length === 0) return '';
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
};

// ── FilterSelect: dropdown con estilo del sistema ──
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

// ── Mini AI Bubble para Textareas ──
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
        className="absolute -bottom-1 right-0 flex items-center gap-1 text-[9px] font-bold text-teal-600 dark:text-teal-400 opacity-0 transition-opacity hover:text-teal-700 group-hover/cell:opacity-100"
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
              className="flex-1 rounded-lg bg-teal-600 py-1.5 text-[10px] font-bold text-white hover:bg-teal-700 disabled:opacity-50"
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

// ── Celda Textarea con AI Bubble ──
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
      className="w-full resize border-transparent bg-transparent text-sm font-medium text-gray-900 placeholder:text-gray-400 outline-none focus:border-transparent focus:outline-none focus:ring-0 dark:text-gray-100 dark:placeholder:text-gray-500"
      style={{ minWidth: minW }}
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

// ── AICargoCell: Dropdown sincronizado con Perfiles de Cargo (Hito 2) ──
const AICargoCell = ({
  value,
  onChange,
  cargosList,
  onCreateNew,
}: {
  value: string;
  onChange: (v: string) => void;
  cargosList: string[];
  onCreateNew?: (newCargo: string) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(value || '');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setQuery(value || '');
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutside);
    }
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isOpen, value]);

  const normalizedList = useMemo(() => {
    const set = new Set<string>();
    (cargosList || []).forEach((c) => {
      const clean = (c || '').trim();
      if (
        clean &&
        clean.toLowerCase() !== 'cargo / rol…' &&
        clean.toLowerCase() !== 'cargo / rol...' &&
        clean.toLowerCase() !== 'cargo / rol'
      ) {
        set.add(toSentenceCase(clean));
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
  }, [cargosList]);

  const isActivelySearching = useMemo(() => {
    const q = query.trim().toLowerCase();
    const v = (value || '').trim().toLowerCase();
    return q.length > 0 && q !== v;
  }, [query, value]);

  const displayedCargos = useMemo(() => {
    if (!isActivelySearching) {
      return normalizedList;
    }
    const q = query.trim().toLowerCase();
    return normalizedList.filter((c) => c.toLowerCase().includes(q));
  }, [normalizedList, isActivelySearching, query]);

  const exactMatch = useMemo(() => {
    const q = query.trim().toLowerCase();
    return normalizedList.some((c) => c.toLowerCase() === q);
  }, [normalizedList, query]);

  const handleSelect = (selectedCargo: string) => {
    const clean = selectedCargo.trim();
    setQuery(clean);
    onChange(clean);
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextVal = e.target.value;
    setQuery(nextVal);
    if (!isOpen) setIsOpen(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setQuery(value || '');
      setIsOpen(false);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (displayedCargos.length === 1 && isActivelySearching) {
        handleSelect(displayedCargos[0]);
      } else if (query.trim()) {
        const newName = toSentenceCase(query.trim());
        handleSelect(newName);
        if (!exactMatch && onCreateNew) {
          onCreateNew(newName);
        }
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className="group/cell relative w-full transition-all focus-within:z-[100] hover:z-[90]"
    >
      <div className="relative flex items-center">
        <input
          type="text"
          placeholder="Cargo / Rol…"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          className="w-full min-w-[140px] rounded-lg border border-transparent bg-transparent py-1.5 pl-2 pr-12 text-xs font-semibold text-teal-700 dark:text-teal-300 outline-none transition-colors hover:border-border-medium focus:border-teal-500 focus:bg-surface-primary dark:focus:bg-surface-secondary"
        />
        {query && (
          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.stopPropagation();
              setQuery('');
              if (!isOpen) setIsOpen(true);
            }}
            className="absolute right-6 top-1/2 -translate-y-1/2 rounded p-0.5 text-text-tertiary opacity-40 transition-opacity hover:text-red-500 hover:opacity-100 cursor-pointer"
            title="Limpiar búsqueda"
          >
            <X className="h-3 w-3" />
          </button>
        )}
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setIsOpen((prev) => !prev)}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-1 text-text-tertiary opacity-40 transition-opacity hover:text-teal-600 hover:opacity-100 group-hover/cell:opacity-100 cursor-pointer"
          title="Ver cargos disponibles"
        >
          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180 text-teal-600' : ''}`}
          />
        </button>
      </div>

      {isOpen && (
        <div className="custom-scrollbar-ipevar absolute left-0 top-full z-[140] mt-1.5 max-h-64 w-64 overflow-hidden rounded-xl border border-border-medium bg-surface-primary p-1.5 shadow-2xl dark:bg-surface-secondary">
          <div className="flex items-center justify-between border-b border-border-light/60 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
            <span>
              {isActivelySearching
                ? `Coincidencias (${displayedCargos.length} de ${normalizedList.length})`
                : `Cargos Registrados (${normalizedList.length})`}
            </span>
            {isActivelySearching && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="text-[10px] font-semibold text-teal-600 hover:underline dark:text-teal-400 cursor-pointer normal-case"
              >
                Ver todos
              </button>
            )}
          </div>

          <div className="custom-scrollbar-ipevar max-h-48 overflow-y-auto py-1">
            {value && !isActivelySearching && (
              <button
                type="button"
                onClick={() => handleSelect('')}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1 text-left text-[11px] text-text-tertiary hover:bg-surface-tertiary hover:text-red-500 transition-colors cursor-pointer border-b border-border-light/40 mb-1"
              >
                <X className="h-3 w-3 shrink-0 text-red-400" />
                <span className="italic">Quitar cargo (dejar vacío)</span>
              </button>
            )}

            {displayedCargos.length === 0 && (
              <div className="px-3 py-2 text-xs text-text-tertiary italic">
                {normalizedList.length === 0
                  ? 'No hay cargos registrados aún'
                  : 'No se encontraron coincidencias'}
              </div>
            )}

            {displayedCargos.map((cargo) => {
              const isSelected = cargo.toLowerCase() === value?.toLowerCase();
              return (
                <button
                  key={cargo}
                  type="button"
                  onClick={() => handleSelect(cargo)}
                  className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-teal-500/15 font-bold text-teal-700 dark:text-teal-300'
                      : 'text-text-primary hover:bg-surface-tertiary hover:text-teal-600 dark:hover:text-teal-400'
                  }`}
                >
                  <span className="flex items-center gap-2 truncate">
                    <Briefcase className="h-3.5 w-3.5 shrink-0 text-teal-600 dark:text-teal-400" />
                    <span className="truncate">{cargo}</span>
                  </span>
                  {isSelected && (
                    <Check className="h-3.5 w-3.5 shrink-0 text-teal-600 dark:text-teal-400 ml-1" />
                  )}
                </button>
              );
            })}
          </div>

          {query.trim() && !exactMatch && (
            <button
              type="button"
              onClick={() => {
                const newName = toSentenceCase(query.trim());
                handleSelect(newName);
                if (onCreateNew) {
                  onCreateNew(newName);
                }
              }}
              className="mt-1 flex w-full items-center gap-1.5 rounded-lg border-t border-border-light px-2.5 py-1.5 text-left text-xs font-semibold text-teal-600 hover:bg-teal-500/10 dark:text-teal-400 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Crear perfil "{toSentenceCase(query.trim())}"</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default function MatrizPESVTable({
  conversationId,
  isOfficialApp = false,
  onRefreshOfficialList,
}: {
  conversationId: string | null;
  isOfficialApp?: boolean;
  onRefreshOfficialList?: () => void;
}) {
  const { token, user } = useAuthContext();
  const userId = user?.id;
  const { showToast } = useToastContext();
  const isSubmitting = useRecoilValue(store.isSubmittingFamily(0));
  const conversation = useRecoilValue(store.conversationByIndex(0));

  const [matrixRows, setMatrixRows] = useState<MatrixRow[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isMaximized, setIsMaximized] = useRecoilState(store.pesvMaximized);
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

  // Estados de conexión con Aplicativo Oficial y ecosistema
  const [isTableExpanded, setIsTableExpanded] = useState(true);
  const [isDashboardExpanded, setIsDashboardExpanded] = useState(false);
  const [isCurrentConvoOfficial, setIsCurrentConvoOfficial] = useState(false);
  const [isSettingOfficial, setIsSettingOfficial] = useState(false);
  const [availableCargos, setAvailableCargos] = useState<string[]>([]);
  const [isAutoAssigningCargos, setIsAutoAssigningCargos] = useState(false);
  const [isSyncingControles, setIsSyncingControles] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isDirtyRef = useRef(false);
  const prevConvoIdRef = useRef<string | null>(null);
  const matrixRowsRef = useRef<MatrixRow[]>(matrixRows);

  useEffect(() => {
    matrixRowsRef.current = matrixRows;
  }, [matrixRows]);

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [pendingRawRows, setPendingRawRows] = useState<any[]>([]);
  const [isAiImportLoading, setIsAiImportLoading] = useState(false);

  // Filters & Sorting States
  const [filterText, setFilterText] = useState('');
  const [filterProceso, setFilterProceso] = useState('');
  const [filterCargo, setFilterCargo] = useState('');
  const [filterActor, setFilterActor] = useState('');
  const [filterNivel, setFilterNivel] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [dashboardHeight, setDashboardHeight] = useState(35);
  const containerRef = useRef<HTMLDivElement>(null);

  const dragStartRef = useRef<{ y: number; height: number } | null>(null);

  const startDrag = (e: React.MouseEvent | React.TouchEvent) => {
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    dragStartRef.current = { y: clientY, height: dashboardHeight };
    document.addEventListener('mousemove', handleDrag);
    document.addEventListener('mouseup', endDrag);
    document.addEventListener('touchmove', handleDrag, { passive: false });
    document.addEventListener('touchend', endDrag);
  };

  const handleDrag = (e: MouseEvent | TouchEvent) => {
    if (!dragStartRef.current || !containerRef.current) return;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const deltaY = clientY - dragStartRef.current.y;
    const totalH = containerRef.current.clientHeight;
    if (totalH === 0) return;
    const deltaPercent = (deltaY / totalH) * 100;
    let newH = dragStartRef.current.height - deltaPercent;
    if (newH < 10) newH = 10;
    if (newH > 80) newH = 80;
    setDashboardHeight(newH);
  };

  const endDrag = () => {
    dragStartRef.current = null;
    document.removeEventListener('mousemove', handleDrag);
    document.removeEventListener('mouseup', endDrag);
    document.removeEventListener('touchmove', handleDrag);
    document.removeEventListener('touchend', endDrag);
  };

  const actualConvoId =
    !isOfficialApp && conversation?.conversationId && conversation.conversationId !== 'new'
      ? conversation.conversationId
      : conversationId || 'new';

  // Cargar Cargos de la Empresa desde Perfiles de Cargo (Hito 2)
  useEffect(() => {
    if (!token) return;
    fetch('/api/sgsst/perfiles-cargo/data', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.perfilesList && Array.isArray(data.perfilesList)) {
          const names = data.perfilesList
            .map((p: any) => p.nombreCargo)
            .filter(Boolean)
            .map((c: string) => toSentenceCase(c));
          setAvailableCargos([...new Set(names)]);
        }
      })
      .catch((err) => console.error('[MatrizPESVTable] Error loading perfiles de cargo:', err));
  }, [token]);

  const fetchMatrixData = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      if (isOfficialApp) {
        const res = await fetch('/api/sgsst/pesv-workspace/official', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.matrixRows) {
            const normalized = data.matrixRows.map((r: any) => ({
              ...r,
              controles_existentes_tipo: normalizeControlTipo(r.controles_existentes_tipo),
            }));
            setMatrixRows(normalized);
          }
          if (data.chartConclusions) setChartConclusions(data.chartConclusions);
          if (data.reportHtml) {
            setReportContent(data.reportHtml);
            reportContentRef.current = data.reportHtml;
          }
        }
        return;
      }

      if (!actualConvoId || actualConvoId === 'new') {
        setMatrixRows([]);
        setChartConclusions({});
        setReportContent(null);
        return;
      }

      const res = await fetch(`/api/sgsst/pesv-workspace/matrix/${actualConvoId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.matrixRows) {
          const normalized = data.matrixRows.map((r: any) => ({
            ...r,
            controles_existentes_tipo: normalizeControlTipo(r.controles_existentes_tipo),
          }));
          setMatrixRows(normalized);
        }
        if (data.chartConclusions) {
          setChartConclusions(data.chartConclusions);
        }
        if (data.reportHtml) {
          setReportContent(data.reportHtml);
          reportContentRef.current = data.reportHtml;
        } else {
          setReportContent(null);
          reportContentRef.current = '';
        }
      }

      // Verificar si este chat es la matriz oficial PESV del sistema
      if (token && actualConvoId && actualConvoId !== 'new' && !actualConvoId.startsWith('temp-')) {
        fetch('/api/sgsst/pesv-workspace/official', {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((r) => r.json())
          .then((offData) => {
            if (
              offData?.hasOfficial &&
              (offData?.sourceConversationId === actualConvoId ||
                offData?.conversationId === actualConvoId)
            ) {
              setIsCurrentConvoOfficial(true);
            } else {
              setIsCurrentConvoOfficial(false);
            }
          })
          .catch(() => {});
      }
    } catch (err) {
      console.error('[MatrizPESV] Fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [actualConvoId, token, isOfficialApp]);

  useEffect(() => {
    if (isOfficialApp) {
      fetchMatrixData();
      return;
    }
    if (!actualConvoId || actualConvoId === 'new') {
      setMatrixRows([]);
      setChartConclusions({});
      setReportContent('');
      prevConvoIdRef.current = actualConvoId;
      return;
    }
    if (prevConvoIdRef.current !== actualConvoId) {
      prevConvoIdRef.current = actualConvoId;
      fetchMatrixData();
    }
  }, [actualConvoId, isOfficialApp, fetchMatrixData]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSubmitting) {
      if (isOfficialApp) {
        interval = setInterval(() => fetchMatrixData(), 3000);
      } else if (actualConvoId && actualConvoId !== 'new') {
        interval = setInterval(() => fetchMatrixData(), 3000);
      }
    } else {
      if (isOfficialApp) {
        fetchMatrixData();
      } else if (actualConvoId && actualConvoId !== 'new') {
        fetchMatrixData();
      }
    }
    return () => clearInterval(interval);
  }, [isSubmitting, actualConvoId, isOfficialApp, fetchMatrixData]);

  const saveMatrixData = async (updatedRows = matrixRows) => {
    if (!token) return;
    setIsSaving(true);
    try {
      const normalizedRows = updatedRows.map((r) => ({
        ...r,
        grupo_trabajo: toSentenceCase(r.grupo_trabajo),
        cargo: toSentenceCase(r.cargo),
      }));

      if (isOfficialApp) {
        const res = await fetch('/api/sgsst/pesv-workspace/official', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            matrixRows: normalizedRows,
            chartConclusions,
            reportHtml: reportContentRef.current || reportContent || '',
          }),
        });
        if (res.ok) {
          setMatrixRows(normalizedRows);
          isDirtyRef.current = false;
          window.dispatchEvent(new CustomEvent('pesv-official-updated'));
          if (onRefreshOfficialList) onRefreshOfficialList();
        }
        return;
      }

      const targetConvoId =
        !actualConvoId || actualConvoId === 'new'
          ? userId
            ? `temp-pesv-${userId}`
            : null
          : actualConvoId;
      if (!targetConvoId) return;

      const res = await fetch(`/api/sgsst/pesv-workspace/matrix/${targetConvoId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          matrixRows: normalizedRows,
          chartConclusions,
          reportHtml: reportContentRef.current || reportContent || '',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.matrixRows) {
          const normalized = data.matrixRows.map((r: any) => ({
            ...r,
            controles_existentes_tipo: normalizeControlTipo(r.controles_existentes_tipo),
          }));
          setMatrixRows(normalized);
        }
        isDirtyRef.current = false;
        window.dispatchEvent(new CustomEvent('pesv-official-updated'));
      }
    } catch (err) {
      console.error('[MatrizPESV] Save error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSetAsOfficial = async () => {
    if (!token) return;
    const targetConvoId =
      !actualConvoId || actualConvoId === 'new'
        ? userId
          ? `temp-pesv-${userId}`
          : null
        : actualConvoId;
    if (!targetConvoId) return;

    try {
      setIsSettingOfficial(true);
      const res = await fetch('/api/sgsst/pesv-workspace/set-official', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          sourceConversationId: targetConvoId,
          matrixRows,
          chartConclusions,
          reportHtml: reportContentRef.current || reportContent || '',
        }),
      });

      if (res.ok) {
        setIsCurrentConvoOfficial(true);
        showToast({
          message: '¡Matriz PESV establecida en el Aplicativo Institucional (Hito 1) exitosamente!',
          status: 'success',
        });
        window.dispatchEvent(new CustomEvent('pesv-official-updated'));
        if (onRefreshOfficialList) onRefreshOfficialList();
      } else {
        throw new Error('Error al establecer matriz PESV');
      }
    } catch (err) {
      console.error('[MatrizPESVTable] Error set-official:', err);
      showToast({ message: 'No se pudo fijar la matriz PESV.', status: 'error' });
    } finally {
      setIsSettingOfficial(false);
    }
  };

  // Auto-Asignar Cargos con IA
  const handleAutoAssignCargos = async (customRows?: MatrixRow[]) => {
    const rowsToProcess = customRows || matrixRows;
    if (rowsToProcess.length === 0) {
      showToast({
        message: 'No hay riesgos viales en la matriz para clasificar cargos.',
        status: 'warning',
      });
      return;
    }
    try {
      setIsAutoAssigningCargos(true);
      const targetConvoId = isOfficialApp
        ? 'official'
        : !actualConvoId || actualConvoId === 'new'
          ? userId
            ? `temp-pesv-${userId}`
            : null
          : actualConvoId;

      const res = await fetch('/api/sgsst/pesv-workspace/auto-assign-cargos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          matrixRows: rowsToProcess,
          conversationId: targetConvoId,
          modelName: selectedModel,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Error al auto-asignar cargos con IA');
      }
      if (data.matrixRows && Array.isArray(data.matrixRows)) {
        setMatrixRows(data.matrixRows);
        isDirtyRef.current = true;
        if (isOfficialApp) {
          await fetch('/api/sgsst/pesv-workspace/official', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ matrixRows: data.matrixRows }),
          });
          window.dispatchEvent(new CustomEvent('pesv-official-updated'));
          if (onRefreshOfficialList) onRefreshOfficialList();
        }
        showToast({
          message:
            data.message ||
            `Cargos asignados automáticamente con IA a ${data.matrixRows.length} riesgos viales.`,
          status: 'success',
        });
      }
    } catch (error: any) {
      console.error('[MatrizPESVTable] Error auto-assigning cargos:', error);
      showToast({
        message: error.message || 'Error al auto-asignar cargos con IA.',
        status: 'error',
      });
    } finally {
      setIsAutoAssigningCargos(false);
    }
  };

  // Sincronizar Planes de Acción PESV con Centro de Control (Kanban ACPM)
  const handleSyncControlesPESV = async () => {
    if (matrixRows.length === 0) {
      showToast({
        message: 'No hay riesgos viales en la matriz para sincronizar controles.',
        status: 'warning',
      });
      return;
    }
    try {
      setIsSyncingControles(true);
      const targetConvoId = isOfficialApp
        ? 'official'
        : !actualConvoId || actualConvoId === 'new'
          ? userId
            ? `temp-pesv-${userId}`
            : null
          : actualConvoId;

      const res = await fetch('/api/sgsst/pesv-workspace/sync-controles-pesv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          matrixRows,
          conversationId: targetConvoId,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Error al sincronizar planes de acción PESV');
      }
      if (data.matrixRows && Array.isArray(data.matrixRows)) {
        setMatrixRows(data.matrixRows);
      }
      window.dispatchEvent(new CustomEvent('kanban-tasks-updated'));
      showToast({
        message:
          data.message ||
          `¡Se sincronizaron ${data.syncedCount || 0} planes de acción viales con el Centro de Control ACPM!`,
        status: 'success',
      });
    } catch (error: any) {
      console.error('[MatrizPESVTable] Error syncing controles PESV:', error);
      showToast({
        message: error.message || 'Error al sincronizar planes de acción PESV.',
        status: 'error',
      });
    } finally {
      setIsSyncingControles(false);
    }
  };

  const handleCreateNewCargo = async (index: number, newCargo: string) => {
    const cleanCargo = toSentenceCase(newCargo);
    if (!cleanCargo) return;
    setAvailableCargos((prev) => [...new Set([...prev, cleanCargo])]);
    if (!token) return;
    try {
      const row = matrixRows[index] || ({} as MatrixRow);
      const res = await fetch('/api/sgsst/perfiles-cargo/ensure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          nombreCargo: cleanCargo,
          proceso: row.grupo_trabajo,
          actividad: `Desplazamiento ${row.tipo_desplazamiento || 'Misional'} como ${row.rol_via || 'Actor vial'}`,
          tareas: row.peligro_descripcion,
          medida_ingenieria: row.plan_accion_vehiculo,
          medida_administrativa: row.plan_accion_medio,
          medida_eppu: row.plan_accion_individuo,
        }),
      });
      const data = await res.json();
      if (data.created) {
        showToast({
          message: `¡Perfil "${cleanCargo}" creado y sincronizado en Perfiles de Cargo (Hito 2)!`,
          status: 'success',
        });
      }
    } catch (err) {
      console.error('[MatrizPESVTable] Error al crear perfil de cargo:', err);
    }
  };

  const handleDummyData = () => {
    const dummyRows: MatrixRow[] = [
      {
        id: Date.now().toString() + '-1',
        grupo_trabajo: 'Operativo / Logística',
        cargo: 'Conductor de vehículo pesado',
        tipo_desplazamiento: 'Misional',
        rol_via: 'Conductor de vehículo pesado',
        factor_riesgo: 'Factor Humano',
        peligro_descripcion:
          'Fatiga extrema, microsueños y exceso de horas continuas de conducción en rutas intermunicipales',
        controles_existentes_descripcion: 'Capacitación semestral en manejo defensivo y pausas',
        controles_existentes_tipo: 'INDIVIDUO',
        np_cualitativo: 'MUY PROBABLE',
        np_cuantitativo: 5,
        ne_cualitativo: 'CONTINUA',
        ne_cuantitativo: 5,
        nc_cualitativo: 'GRAVE',
        nc_cuantitativo: 5,
        calificacion: 15,
        nivel_riesgo: 'NIVEL DE RIESGO ALTO o CRITICO',
        aceptabilidad: 'NO ACEPTABLE',
        tratamiento_accion: 'MODIFICAR LOS FACTORES DE EXPOSICION',
        plan_accion_medio:
          'Reprogramación de turnos y establecimiento de puntos seguros de descanso obligatorio cada 2 horas (Paso 18)',
        plan_accion_vehiculo:
          'Instalación de sensor de fatiga ocular y alerta sonora de cambio de carril en cabina',
        plan_accion_individuo:
          'Aplicación diaria de test de fatiga y somnolencia previo al despacho y exámenes médicos con énfasis psicosensométrico',
        plan_accion_infraestructura:
          'Georreferenciación de zonas de parada segura autorizadas en rutograma vial',
        responsable: 'Líder del PESV / Jefe de Transporte',
        fecha_programacion: 'Inmediato / Mensual',
        estado: 'PLANEADA',
        observaciones: 'Riesgo crítico prioritario bajo Resolución 20223040040595 Paso 6 y Paso 16',
      },
      {
        id: Date.now().toString() + '-2',
        grupo_trabajo: 'Comercial y Mensajería',
        cargo: 'Mensajero motorizado',
        tipo_desplazamiento: 'Misional',
        rol_via: 'Conductor de motocicleta',
        factor_riesgo: 'Factor Humano',
        peligro_descripcion:
          'Exceso de velocidad y adelantamiento entre carriles en tráfico urbano denso bajo presión de entregas',
        controles_existentes_descripcion: 'Entrega de casco certificado y chaleco reflectivo',
        controles_existentes_tipo: 'INDIVIDUO',
        np_cualitativo: 'MUY PROBABLE',
        np_cuantitativo: 5,
        ne_cualitativo: 'CONTINUA',
        ne_cuantitativo: 5,
        nc_cualitativo: 'GRAVE',
        nc_cuantitativo: 5,
        calificacion: 15,
        nivel_riesgo: 'NIVEL DE RIESGO ALTO o CRITICO',
        aceptabilidad: 'NO ACEPTABLE',
        tratamiento_accion: 'IMPLEMENTAR CONTROLES EN LA FUENTE Y EL MEDIO',
        plan_accion_medio:
          'Monitoreo GPS de telemetría con alertas de velocidad máxima permitida (50 km/h urbano) según Paso 16',
        plan_accion_vehiculo:
          'Mantenimiento preventivo de sistema de frenos CBS/ABS y llantas de alto agarre en piso húmedo',
        plan_accion_individuo:
          'Curso teórico-práctico de técnicas de frenado de emergencia en motocicleta y dotación de chaqueta con protecciones certificadas',
        plan_accion_infraestructura:
          'Actualización de matriz de rutas urbanas evitando corredores de alta accidentalidad',
        responsable: 'Líder del PESV / Coordinador SST',
        fecha_programacion: 'Trimestral',
        estado: 'PLANEADA',
        observaciones: 'Integrado con telemetría vehicular y programa de gestión de la velocidad',
      },
      {
        id: Date.now().toString() + '-3',
        grupo_trabajo: 'Operativo / Distribución',
        cargo: 'Conductor de reparto',
        tipo_desplazamiento: 'Misional',
        rol_via: 'Conductor de vehículo liviano',
        factor_riesgo: 'Factor Vehicular',
        peligro_descripcion:
          'Falla mecánica súbita en sistema de frenos o dirección por desgaste no detectado antes de iniciar marcha',
        controles_existentes_descripcion: 'Revisión técnico-mecánica anual legal',
        controles_existentes_tipo: 'VEHICULO',
        np_cualitativo: 'PROBABLE',
        np_cuantitativo: 3,
        ne_cualitativo: 'CONTINUA',
        ne_cuantitativo: 5,
        nc_cualitativo: 'GRAVE',
        nc_cuantitativo: 5,
        calificacion: 13,
        nivel_riesgo: 'NIVEL DE RIESGO ALTO o CRITICO',
        aceptabilidad: 'NO ACEPTABLE',
        tratamiento_accion: 'IMPLEMENTAR CONTROLES EN LA FUENTE Y EL MEDIO',
        plan_accion_medio:
          'Bloqueo automático de orden de salida si el vehículo presenta hallazgos críticos en la inspección diaria',
        plan_accion_vehiculo:
          'Ejecución de plan de mantenimiento preventivo cada 5.000 km registrado en Hoja de Vida Automotores (Hito 5 - Paso 17)',
        plan_accion_individuo:
          'Diligenciamiento obligatorio de inspección preoperacional diaria en el aplicativo WAPPY (Paso 16)',
        plan_accion_infraestructura:
          'Demarcación de bahía exclusiva de inspección preoperacional con iluminación adecuada en patio',
        responsable: 'Jefe de Mantenimiento / Conductor',
        fecha_programacion: 'Diario / Permanente',
        estado: 'PLANEADA',
        observaciones: 'Articulado con módulo Hoja de Vida Automotores (PESV) en Hito 5',
      },
      {
        id: Date.now().toString() + '-4',
        grupo_trabajo: 'Administrativo y Ventas',
        cargo: 'Asesor comercial',
        tipo_desplazamiento: 'Misional',
        rol_via: 'Conductor de vehículo liviano',
        factor_riesgo: 'Factor Humano',
        peligro_descripcion:
          'Distracción cognitiva y visual por uso de teléfono celular y WhatsApp mientras conduce hacia clientes',
        controles_existentes_descripcion: 'Divulgación de política de seguridad vial',
        controles_existentes_tipo: 'INDIVIDUO',
        np_cualitativo: 'PROBABLE',
        np_cuantitativo: 3,
        ne_cualitativo: 'OCASIONAL',
        ne_cuantitativo: 3,
        nc_cualitativo: 'MODERADO',
        nc_cuantitativo: 3,
        calificacion: 9,
        nivel_riesgo: 'NIVEL DE RIESGO MEDIO o MODERADO',
        aceptabilidad: 'ACEPTABLE CON CONTROL ESPECIFICO',
        tratamiento_accion: 'MODIFICAR LOS FACTORES DE EXPOSICION',
        plan_accion_medio:
          'Protocolo de cero llamadas operativas durante desplazamientos reportados en agenda comercial',
        plan_accion_vehiculo:
          'Verificación de soporte fijo y sistema manos libres solo para navegación por voz',
        plan_accion_individuo:
          'Campaña de sensibilización en riesgos por distracción vial y auditoría aleatoria de cumplimiento',
        plan_accion_infraestructura: 'Ninguno',
        responsable: 'Líder del PESV / Talento Humano',
        fecha_programacion: 'Semestral',
        estado: 'PLANEADA',
        observaciones: 'Cumplimiento política de prevención de la distracción (Paso 8)',
      },
      {
        id: Date.now().toString() + '-5',
        grupo_trabajo: 'Administrativo y Operativo',
        cargo: 'Auxiliar administrativo',
        tipo_desplazamiento: 'In itinere',
        rol_via: 'Peatón',
        factor_riesgo: 'Factor Infraestructura',
        peligro_descripcion:
          'Atropellamiento en cruce vial de acceso a la sede por falta de paso peatonal demarcado y baja iluminación nocturna',
        controles_existentes_descripcion: 'Señalización interna en portería',
        controles_existentes_tipo: 'INFRAESTRUCTURA',
        np_cualitativo: 'PROBABLE',
        np_cuantitativo: 3,
        ne_cualitativo: 'OCASIONAL',
        ne_cuantitativo: 3,
        nc_cualitativo: 'MODERADO',
        nc_cuantitativo: 3,
        calificacion: 9,
        nivel_riesgo: 'NIVEL DE RIESGO MEDIO o MODERADO',
        aceptabilidad: 'ACEPTABLE CON CONTROL ESPECIFICO',
        tratamiento_accion: 'IMPLEMENTAR CONTROLES EN LA FUENTE Y EL MEDIO',
        plan_accion_medio:
          'Socialización de rutas seguras casa-trabajo (In itinere) y puntos seguros de cruce peatonal',
        plan_accion_vehiculo:
          'Límite máximo de 10 km/h para todos los vehículos que ingresan o salen del parqueadero institucional',
        plan_accion_individuo:
          'Capacitación en comportamiento seguro del actor vial vulnerable (peatón y ciclista)',
        plan_accion_infraestructura:
          'Instalación de reflectores LED en acceso peatonal, espejo convexo y demarcación de cebra y reductor en portería (Paso 19)',
        responsable: 'Coordinador SST / Servicios Generales',
        fecha_programacion: 'Mensual',
        estado: 'PLANEADA',
        observaciones: 'Protección prioritaria de actores viales vulnerables',
      },
    ];

    setMatrixRows(dummyRows);
    isDirtyRef.current = true;
    saveMatrixData(dummyRows);
    showToast({
      message: 'Datos de prueba PESV (Res. 20223040040595) generados y guardados exitosamente.',
      status: 'success',
    });
  };

  const handleCellChange = (idx: number, field: keyof MatrixRow, value: any) => {
    isDirtyRef.current = true;
    const updated = [...matrixRows];
    const item = { ...updated[idx], [field]: value };

    if (
      field === 'np_cualitativo' ||
      field === 'ne_cualitativo' ||
      field === 'nc_cualitativo' ||
      field === 'np_cuantitativo' ||
      field === 'ne_cuantitativo' ||
      field === 'nc_cuantitativo'
    ) {
      if (field === 'np_cualitativo') {
        item.np_cuantitativo = mapNPCualitativoToNum(value);
      } else if (field === 'ne_cualitativo') {
        item.ne_cuantitativo = mapNECualitativoToNum(value);
      } else if (field === 'nc_cualitativo') {
        item.nc_cuantitativo = mapNCCualitativoToNum(value);
      } else if (field === 'np_cuantitativo') {
        item.np_cualitativo = getNPCualitativoLabel(Number(value)) as any;
      } else if (field === 'ne_cuantitativo') {
        item.ne_cualitativo = getNECualitativoLabel(Number(value)) as any;
      } else if (field === 'nc_cuantitativo') {
        item.nc_cualitativo = getNCCualitativoLabel(Number(value)) as any;
      }

      const np = Number(item.np_cuantitativo) || 3;
      const ne = Number(item.ne_cuantitativo) || 3;
      const nc = Number(item.nc_cuantitativo) || 3;
      const calif = np + ne + nc;
      item.calificacion = calif;

      const interp = getInterpretacionPESV(calif);
      item.nivel_riesgo = interp.nivel;
      item.aceptabilidad = interp.aceptabilidad;
    }

    updated[idx] = item;
    setMatrixRows(updated);
  };

  const addRow = () => {
    isDirtyRef.current = true;
    const newRow: MatrixRow = {
      id: Date.now().toString() + Math.random().toString(36).substring(7),
      grupo_trabajo: 'Operativo',
      cargo: 'Conductor',
      tipo_desplazamiento: 'Misional',
      rol_via: 'Conductor de vehículo liviano',
      factor_riesgo: 'Factor Humano',
      peligro_descripcion: 'Fatiga extrema y microsueños durante conducción nocturna',
      np_cualitativo: 'PROBABLE',
      np_cuantitativo: 3,
      ne_cualitativo: 'OCASIONAL',
      ne_cuantitativo: 3,
      nc_cualitativo: 'MODERADO',
      nc_cuantitativo: 3,
      calificacion: 9,
      nivel_riesgo: 'NIVEL DE RIESGO MEDIO o MODERADO',
      aceptabilidad: 'ACEPTABLE CON CONTROL ESPECIFICO',
      controles_existentes_descripcion: 'Capacitación básica en conducción defensiva',
      controles_existentes_tipo: 'INDIVIDUO',
      tratamiento_accion: 'MODIFICAR LOS FACTORES DE EXPOSICION',
      plan_accion_medio: 'Definir pausas activas obligatorias cada 2 horas de trayecto',
      plan_accion_vehiculo: 'Ninguno',
      plan_accion_individuo: 'Implementar checklist preoperacional de fatiga y sueño',
      plan_accion_infraestructura: 'Ninguno',
      responsable: 'Responsable PESV',
      fecha_programacion: 'Permanente',
      estado: 'PLANEADA',
      observaciones: '',
    };
    const newRows = [...matrixRows, newRow];
    setMatrixRows(newRows);
    saveMatrixData(newRows);
  };

  const removeRow = (idx: number) => {
    if (window.confirm('¿Deseas eliminar este peligro vial?')) {
      isDirtyRef.current = true;
      const updated = matrixRows.filter((_, i) => i !== idx);
      setMatrixRows(updated);
      saveMatrixData(updated);
    }
  };

  const handleAiUpdateRow = async (idx: number) => {
    setAiRowLoading(idx);
    const rowToUpdate = matrixRows[idx];
    try {
      const res = await fetch('/api/sgsst/pesv-workspace/ai-update-row', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ row: rowToUpdate, modelName: selectedModel }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.updatedFields) {
          const updated = [...matrixRows];
          updated[idx] = { ...updated[idx], ...data.updatedFields };
          setMatrixRows(updated);
          saveMatrixData(updated);
          showToast({
            message: `¡Fila #${idx + 1} actualizada con IA según Res. 20223040040595!`,
            status: 'success',
          });
        }
      }
    } catch (err) {
      console.error('[MatrizPESV] Row AI update error:', err);
      showToast({ message: 'Error al actualizar fila con IA.', status: 'error' });
    } finally {
      setAiRowLoading(null);
    }
  };

  const handleAnalyzeMatrix = async () => {
    if (matrixRows.length === 0) return;
    setIsAnalyzing(true);
    try {
      const res = await fetch('/api/sgsst/pesv-workspace/ai-analyze-matrix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          matrixRows,
          modelName: selectedModel,
          conversationId: isOfficialApp ? 'official' : actualConvoId,
        }),
      });
      if (!res.ok) {
        throw new Error('No se pudo generar el informe ejecutivo.');
      }
      const data = await res.json();
      if (data.analysis) {
        setReportContent(data.analysis);
        reportContentRef.current = data.analysis;
        liveEditorRef.current?.setHTML(data.analysis);
        setIsReportExpanded(true);
        setRefreshTrigger((prev) => prev + 1);
        await saveMatrixData(matrixRows);
        setTimeout(
          () =>
            document.getElementById('pesv-report-editor')?.scrollIntoView({ behavior: 'smooth' }),
          300,
        );
      }
    } catch (err) {
      console.error('[PESV] Analyze error:', err);
      showToast({ message: 'Error al generar el informe ejecutivo del PESV.', status: 'error' });
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
                title: `Informe Ejecutivo PESV (Res. 40595) - ${new Date().toLocaleDateString('es-CO')}`,
                tags: ['sgsst-matriz-pesv'],
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
        showToast({
          message: 'Informe PESV guardado en el historial de SGSST exitosamente.',
          status: 'success',
        });
      }
    } catch (e) {
      console.error('Error saving PESV report', e);
      showToast({ message: 'Error al guardar el informe PESV.', status: 'error' });
    }
  }, [reportContent, token, reportConversationId, reportMessageId, showToast]);

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

  const handleAiImport = async () => {
    if (pendingRawRows.length === 0) return;
    setIsConfirmModalOpen(false);
    setIsAiImportLoading(true);

    try {
      const res = await fetch('/api/sgsst/pesv-workspace/ai-parse-matrix', {
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
        const normalized = data.matrixRows.map((r: any) => ({
          ...r,
          grupo_trabajo: toSentenceCase(r.grupo_trabajo),
          cargo: toSentenceCase(r.cargo),
        }));
        const combined = [...matrixRows, ...normalized];
        setMatrixRows(combined);
        isDirtyRef.current = false;
        saveMatrixData(combined);
        showToast({
          message: `¡Éxito! La IA de Wappy ha reconstruido y mapeado ${data.matrixRows.length} riesgos viales al formato oficial PESV.`,
          status: 'success',
        });
      } else {
        showToast({ message: 'No se pudieron recuperar filas procesadas.', status: 'warning' });
      }
    } catch (err: any) {
      console.error('[MatrizPESV] AI Import error:', err);
      showToast({
        message: `Error en la reconstrucción con IA: ${err.message}`,
        status: 'error',
      });
    } finally {
      setIsAiImportLoading(false);
      setPendingRawRows([]);
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
            const isStandard =
              keys.some((k) => k.toLowerCase().replace(/\s+/g, '') === 'grupotrabajo') &&
              keys.some((k) => k.toLowerCase().replace(/\s+/g, '') === 'factorriesgo');

            if (isStandard) {
              const combined = [...matrixRows, ...parsed];
              setMatrixRows(combined);
              saveMatrixData(combined);
              showToast({
                message: `¡Se importaron ${parsed.length} riesgos viales exitosamente!`,
                status: 'success',
              });
            } else {
              setPendingRawRows(parsed);
              setIsConfirmModalOpen(true);
            }
          }
        } else {
          const workbook = XLSX.read(data, { type: 'binary' });
          let targetSheetName = '';
          const sheetNames = workbook.SheetNames;

          targetSheetName =
            sheetNames.find(
              (name) =>
                name.toUpperCase().includes('3-MATRIZ') ||
                name.toUpperCase().includes('MATRIZ') ||
                name.toUpperCase().includes('PESV'),
            ) || '';

          if (!targetSheetName) {
            for (const name of sheetNames) {
              const ws = workbook.Sheets[name];
              const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
              const colCount = range.e.c - range.s.c + 1;
              if (colCount > 15) {
                targetSheetName = name;
                break;
              }
            }
          }

          if (!targetSheetName) {
            targetSheetName = sheetNames[0];
          }

          const ws = workbook.Sheets[targetSheetName];
          autofillMergedCells(ws);

          const gridRows = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1 });
          if (gridRows.length === 0) {
            showToast({ message: 'El archivo Excel está vacío.', status: 'warning' });
            return;
          }

          let headerRowIdx = -1;
          for (let r = 0; r < Math.min(25, gridRows.length); r++) {
            const row = gridRows[r];
            if (
              Array.isArray(row) &&
              row.some((cell) => {
                const str = String(cell || '').toLowerCase().trim();
                return (
                  str.includes('grupo de trabajo') ||
                  str.includes('grupotrabajo') ||
                  str.includes('clasificacion grupos de trabajo') ||
                  str.includes('clasificación grupos de trabajo')
                );
              })
            ) {
              headerRowIdx = r;
              break;
            }
          }

          if (headerRowIdx !== -1) {
            const headerRow = gridRows[headerRowIdx];
            const colMap: Record<string, number> = {};
            headerRow.forEach((cell: any, idx: number) => {
              const key = String(cell || '')
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .trim();
              if (key) colMap[key] = idx;
            });

            let startDataRow = headerRowIdx + 1;
            const nextRow = gridRows[startDataRow] || [];
            const hasSubHeader = nextRow.some((cell: any) => {
              const str = String(cell || '').toLowerCase();
              return (
                str.includes('peligros') ||
                str.includes('probabilidad') ||
                str.includes('exposicion') ||
                str.includes('consecuencia') ||
                str.includes('calificacion') ||
                str.includes('individuo')
              );
            });
            if (hasSubHeader) {
              nextRow.forEach((cell: any, idx: number) => {
                const key = String(cell || '')
                  .toLowerCase()
                  .normalize('NFD')
                  .replace(/[\u0300-\u036f]/g, '')
                  .trim();
                if (key && !colMap[key]) colMap[key] = idx;
              });
              startDataRow++;
            }

            const getCol = (row: any[], ...keys: string[]): string => {
              for (const key of keys) {
                const k = key
                  .toLowerCase()
                  .normalize('NFD')
                  .replace(/[\u0300-\u036f]/g, '')
                  .trim();
                if (colMap[k] !== undefined) return String(row[colMap[k]] || '').trim();
              }
              return '';
            };
            const getColOrIdx = (row: any[], fallbackIdx: number, ...keys: string[]): string => {
              const byKey = getCol(row, ...keys);
              if (byKey) return byKey;
              return String(row[fallbackIdx] || '').trim();
            };

            const mapped: MatrixRow[] = [];
            for (let r = startDataRow; r < gridRows.length; r++) {
              const row = gridRows[r];
              if (
                !row ||
                row.every(
                  (cell: any) => cell === null || cell === undefined || String(cell).trim() === '',
                )
              ) {
                continue;
              }

              const peligro_desc = getColOrIdx(
                row,
                5,
                'peligros',
                'descripcion del peligro',
                'peligro_descripcion',
                'peligro',
              );
              const cargo = getColOrIdx(row, 1, 'cargos individuales', 'cargo', 'cargos');
              if (!peligro_desc && !cargo) continue;

              const np_cual = getColOrIdx(
                row,
                6,
                'nivel de probabilidad',
                'np cualitativo',
                'np_cualitativo',
                'probabilidad',
              );
              const np_cuant = Number(getColOrIdx(row, 7, 'np cuantitativo', 'np_cuantitativo')) || 0;
              let final_np_cual = 'PROBABLE';
              let final_np_cuant = 3;
              if (np_cual && isNaN(Number(np_cual))) {
                final_np_cuant = mapNPCualitativoToNum(np_cual);
                final_np_cual = getNPCualitativoLabel(final_np_cuant);
              } else if (np_cuant) {
                final_np_cuant = np_cuant;
                final_np_cual = getNPCualitativoLabel(np_cuant);
              } else if (np_cual && !isNaN(Number(np_cual))) {
                final_np_cuant = Number(np_cual);
                final_np_cual = getNPCualitativoLabel(final_np_cuant);
              }

              const ne_cual = getColOrIdx(
                row,
                8,
                'nivel de exposicion',
                'ne cualitativo',
                'ne_cualitativo',
                'exposicion',
              );
              const ne_cuant = Number(getColOrIdx(row, 9, 'ne cuantitativo', 'ne_cuantitativo')) || 0;
              let final_ne_cual = 'OCASIONAL';
              let final_ne_cuant = 3;
              if (ne_cual && isNaN(Number(ne_cual))) {
                final_ne_cuant = mapNECualitativoToNum(ne_cual);
                final_ne_cual = getNECualitativoLabel(final_ne_cuant);
              } else if (ne_cuant) {
                final_ne_cuant = ne_cuant;
                final_ne_cual = getNECualitativoLabel(ne_cuant);
              } else if (ne_cual && !isNaN(Number(ne_cual))) {
                final_ne_cuant = Number(ne_cual);
                final_ne_cual = getNECualitativoLabel(final_ne_cuant);
              }

              const nc_cual = getColOrIdx(
                row,
                10,
                'nivel de consecuencia',
                'nc cualitativo',
                'nc_cualitativo',
                'consecuencia',
              );
              const nc_cuant = Number(getColOrIdx(row, 11, 'nc cuantitativo', 'nc_cuantitativo')) || 0;
              let final_nc_cual = 'MODERADO';
              let final_nc_cuant = 3;
              if (nc_cual && isNaN(Number(nc_cual))) {
                final_nc_cuant = mapNCCualitativoToNum(nc_cual);
                final_nc_cual = getNCCualitativoLabel(final_nc_cuant);
              } else if (nc_cuant) {
                final_nc_cuant = nc_cuant;
                final_nc_cual = getNCCualitativoLabel(nc_cuant);
              } else if (nc_cual && !isNaN(Number(nc_cual))) {
                final_nc_cuant = Number(nc_cual);
                final_nc_cual = getNCCualitativoLabel(final_nc_cuant);
              }

              const calif = final_np_cuant + final_ne_cuant + final_nc_cuant;
              const interp = getInterpretacionPESV(calif);

              const rawDesp = getColOrIdx(
                row,
                2,
                'tipo de desplazamiento',
                'tipo_desplazamiento',
                'desplazamiento',
              ).toLowerCase();
              const tipo_desp: 'Misional' | 'In itinere' = rawDesp.includes('itinere')
                ? 'In itinere'
                : 'Misional';

              const rawRol = getColOrIdx(
                row,
                3,
                'rol en la via',
                'rol_via',
                'rol en la vía',
                'rol',
              ).toLowerCase();
              let rol: any = 'Peatón';
              if (rawRol.includes('motocicleta') || rawRol.includes('moto'))
                rol = 'Conductor de motocicleta';
              else if (rawRol.includes('pesado')) rol = 'Conductor de vehículo pesado';
              else if (
                rawRol.includes('liviano') ||
                rawRol.includes('automovil') ||
                rawRol.includes('carro')
              )
                rol = 'Conductor de vehículo liviano';
              else if (rawRol.includes('peaton') || rawRol.includes('peatón')) rol = 'Peatón';
              else if (rawRol.includes('pasajero')) rol = 'Pasajero';
              else if (rawRol.includes('ciclista') || rawRol.includes('bici')) rol = 'Ciclista';
              else if (rawRol.includes('otro')) rol = 'Otro';
              else {
                const matched = ACTORES_VIALES.find(
                  (v) => v.toLowerCase().includes(rawRol) || rawRol.includes(v.toLowerCase()),
                );
                if (matched) rol = matched;
              }

              const rawFactor = getColOrIdx(
                row,
                4,
                'factor de riesgo',
                'factor_riesgo',
                'identificacion',
                'factor',
              ).toLowerCase();
              let factor: any = 'Factor Humano';
              if (rawFactor.includes('humano')) factor = 'Factor Humano';
              else if (rawFactor.includes('vehicular') || rawFactor.includes('vehiculo'))
                factor = 'Factor Vehicular';
              else if (rawFactor.includes('infraestructura')) factor = 'Factor Infraestructura';
              else if (
                rawFactor.includes('entorno') ||
                rawFactor.includes('otros') ||
                rawFactor.includes('otro')
              )
                factor = 'Entorno/Otros';

              const ctrl_desc = getColOrIdx(
                row,
                15,
                'controles existentes',
                'controles_existentes_descripcion',
                'interpretacion',
                'diagnostico',
                'diagnostico de controles',
                'controles existentes / diagnostico',
              );
              const ctrl_tipo = getColOrIdx(
                row,
                16,
                'tipo de controles',
                'controles_existentes_tipo',
                'tipo controles',
                'tipo de control',
                'controles',
              );
              const tratamiento = getColOrIdx(
                row,
                17,
                'acciones',
                'tratamiento / accion',
                'tratamiento_accion',
                'accion de tratamiento',
                'tratamiento accion',
                'tratamiento',
              );
              const plan_medio = getColOrIdx(
                row,
                18,
                'controles - medio',
                'plan accion (medio)',
                'plan_accion_medio',
                'plan de accion medio',
                'medio',
              );
              const plan_vehiculo = getColOrIdx(
                row,
                19,
                'controles - vehiculo',
                'plan accion (vehiculo)',
                'plan_accion_vehiculo',
                'plan de accion vehiculo',
                'vehiculo',
              );
              const plan_individuo = getColOrIdx(
                row,
                20,
                'cotroles - individuo',
                'controles - individuo',
                'plan accion (individuo)',
                'plan_accion_individuo',
                'plan de accion individuo',
                'individuo',
              );
              const plan_infra = getColOrIdx(
                row,
                21,
                'controles - infraestructura',
                'plan accion (infraestructura)',
                'plan_accion_infraestructura',
                'plan de accion infraestructura',
                'infraestructura',
              );
              const responsable = getColOrIdx(row, 20, 'responsable');
              const fecha = getColOrIdx(
                row,
                21,
                'fecha programacion',
                'fecha_programacion',
                'fecha / periodicidad',
                'fecha',
              );
              const rawEstadoStr = getColOrIdx(row, 22, 'estado').toUpperCase();
              const est: any = rawEstadoStr.includes('CERRADA') ? 'CERRADA' : 'PLANEADA';
              const obs = getColOrIdx(row, 23, 'observaciones', 'observacion');

              mapped.push({
                id: Date.now().toString() + Math.random().toString(36).substring(7),
                grupo_trabajo: toSentenceCase(
                  getColOrIdx(
                    row,
                    0,
                    'clasificacion grupos de trabajo',
                    'clasificación grupos de trabajo',
                    'grupo de trabajo',
                    'grupo_trabajo',
                  ) || 'General',
                ),
                cargo: toSentenceCase(cargo || 'General'),
                tipo_desplazamiento: tipo_desp,
                rol_via: rol,
                factor_riesgo: factor,
                peligro_descripcion: peligro_desc,
                controles_existentes_descripcion: ctrl_desc || 'Ninguno',
                controles_existentes_tipo: normalizeControlTipo(ctrl_tipo),
                np_cualitativo: final_np_cual as any,
                np_cuantitativo: final_np_cuant,
                ne_cualitativo: final_ne_cual as any,
                ne_cuantitativo: final_ne_cuant,
                nc_cualitativo: final_nc_cual as any,
                nc_cuantitativo: final_nc_cuant,
                calificacion: calif,
                nivel_riesgo: interp.nivel,
                aceptabilidad: interp.aceptabilidad,
                tratamiento_accion: tratamiento || 'Ninguno',
                plan_accion_medio: plan_medio || 'Ninguno',
                plan_accion_vehiculo: plan_vehiculo || 'Ninguno',
                plan_accion_individuo: plan_individuo || 'Ninguno',
                plan_accion_infraestructura: plan_infra || 'Ninguno',
                responsable: responsable || 'Responsable PESV',
                fecha_programacion: fecha || 'Permanente',
                estado: est,
                observaciones: obs,
              });
            }

            if (mapped.length === 0) {
              const rawRowsForAI: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });
              if (rawRowsForAI.length === 0) {
                showToast({
                  message: 'El archivo Excel está vacío o no contiene datos.',
                  status: 'warning',
                });
                return;
              }
              setPendingRawRows(rawRowsForAI);
              setIsConfirmModalOpen(true);
              e.target.value = '';
              return;
            }

            const combined = [...matrixRows, ...mapped];
            setMatrixRows(combined);
            saveMatrixData(combined);
            showToast({
              message: `¡Se importaron exitosamente ${mapped.length} riesgos viales desde el formato oficial!`,
              status: 'success',
            });
            e.target.value = '';
            return;
          }

          const rawRowsForAI: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });
          if (rawRowsForAI.length === 0) {
            showToast({
              message: 'El archivo Excel está vacío o no contiene datos reconocibles.',
              status: 'warning',
            });
            return;
          }
          setPendingRawRows(rawRowsForAI);
          setIsConfirmModalOpen(true);
          e.target.value = '';
          return;
        }
      } catch (err) {
        console.error('[PESV] Import parsing error:', err);
        showToast({
          message: 'Error al leer el archivo. Revisa el formato.',
          status: 'error',
        });
      }
    };

    if (file.name.endsWith('.json')) {
      reader.readAsText(file);
    } else {
      reader.readAsBinaryString(file);
    }
  };

  const handleExportExcel = async () => {
    try {
      await exportMatrizPESVToExcel(matrixRows);
      showToast({ message: 'Matriz PESV exportada a Excel exitosamente', status: 'success' });
    } catch (e: any) {
      console.error('Error al exportar Matriz PESV:', e);
      showToast({ message: `Error al exportar a Excel: ${e?.message || e}`, status: 'error' });
    }
  };

  const handleExportTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      {
        'Grupo de Trabajo': 'Operativo',
        Cargo: 'Conductor de reparto',
        'Tipo de Desplazamiento': 'Misional',
        'Rol en la Vía': 'Conductor de vehículo liviano',
        'Factor de Riesgo': 'Factor Humano',
        'Descripción del Peligro': 'Fatiga extrema y microsueños durante conducción nocturna',
        'Controles Existentes': 'Capacitación básica en conducción defensiva',
        'Tipo de Controles': 'INDIVIDUO',
        'NP Cualitativo': 'PROBABLE',
        'NP Cuantitativo': 3,
        'NE Cualitativo': 'OCASIONAL',
        'NE Cuantitativo': 3,
        'NC Cualitativo': 'MODERADO',
        'NC Cuantitativo': 3,
        Calificación: 9,
        'Nivel de Riesgo': 'NIVEL DE RIESGO MEDIO o MODERADO',
        Aceptabilidad: 'ACEPTABLE CON CONTROL ESPECIFICO',
        'Tratamiento / Acción': 'MODIFICAR LOS FACTORES DE EXPOSICION',
        'Plan Acción (Medio)': 'Definir pausas activas obligatorias cada 2 horas de trayecto',
        'Plan Acción (Vehículo)': 'Ninguno',
        'Plan Acción (Individuo)': 'Implementar checklist preoperacional de fatiga y sueño',
        'Plan Acción (Infraestructura)': 'Ninguno',
        Responsable: 'Responsable PESV',
        'Fecha / Periodicidad': 'Permanente',
        Estado: 'PLANEADA',
        Observaciones: 'Revisión semestral',
      },
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Plantilla PESV');
    XLSX.writeFile(wb, 'Plantilla_Matriz_PESV.xlsx');
  };

  // ── Filtrado y Ordenación en Memoria ──
  const displayRows = useMemo(() => {
    let rows = matrixRows.map((row, idx) => ({ row, idx }));
    const q = filterText.toLowerCase().trim();

    if (q) {
      rows = rows.filter(({ row }) =>
        [
          row.grupo_trabajo,
          row.cargo,
          row.rol_via,
          row.factor_riesgo,
          row.peligro_descripcion,
          row.controles_existentes_descripcion,
          row.plan_accion_medio,
          row.plan_accion_vehiculo,
          row.plan_accion_individuo,
          row.plan_accion_infraestructura,
          row.responsable,
          row.observaciones,
        ].some((f) => f?.toLowerCase().includes(q)),
      );
    }
    if (filterProceso) rows = rows.filter(({ row }) => row.grupo_trabajo === filterProceso);
    if (filterCargo) rows = rows.filter(({ row }) => row.cargo === filterCargo);
    if (filterActor) rows = rows.filter(({ row }) => row.rol_via === filterActor);
    if (filterNivel) {
      rows = rows.filter(({ row }) => {
        const calif = row.calificacion || 0;
        const classification = calif >= 12 ? 'Alto' : calif >= 8 ? 'Medio' : 'Bajo';
        return classification === filterNivel;
      });
    }

    if (sortField) {
      rows.sort((a, b) => {
        let va = a.row[sortField as keyof MatrixRow];
        let vb = b.row[sortField as keyof MatrixRow];
        if (sortField === 'nivel_riesgo' || sortField === 'calificacion') {
          va = a.row.calificacion || 0;
          vb = b.row.calificacion || 0;
        }
        if (typeof va === 'number' && typeof vb === 'number') {
          return sortDir === 'asc' ? va - vb : vb - va;
        }
        va = String(va || '').toLowerCase();
        vb = String(vb || '').toLowerCase();
        return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
      });
    }
    return rows;
  }, [
    matrixRows,
    filterText,
    filterProceso,
    filterCargo,
    filterActor,
    filterNivel,
    sortField,
    sortDir,
  ]);

  const paginatedRows = useMemo(() => {
    const startIdx = (currentPage - 1) * pageSize;
    const endIdx = startIdx + pageSize;
    return displayRows.slice(startIdx, endIdx);
  }, [displayRows, currentPage, pageSize]);

  const procesosUnicos = useMemo(
    () => [...new Set(matrixRows.map((r) => r.grupo_trabajo).filter(Boolean))],
    [matrixRows],
  );
  const cargosUnicos = useMemo(
    () => [...new Set([...matrixRows.map((r) => r.cargo).filter(Boolean), ...availableCargos])],
    [matrixRows, availableCargos],
  );

  const toggleSort = (field: string) => {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const SortIcon = ({ field }: { field: string }) =>
    sortField === field ? (
      <span className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>
    ) : (
      <span className="ml-1 opacity-30">↕</span>
    );

  const getCriticidadLabel = (calif: number) => {
    if (calif >= 12)
      return { text: 'text-red-700 dark:text-red-400 font-bold', label: '🔴 CRÍTICO' };
    if (calif >= 8)
      return { text: 'text-orange-600 dark:text-orange-400 font-bold', label: '🟡 MEDIO' };
    return { text: 'text-green-600 dark:text-green-400 font-bold', label: '🟢 BAJO' };
  };

  const renderModals = () => (
    <>
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept=".xlsx,.xls,.json"
        onChange={handleImportFile}
      />

      {isAiImportLoading && (
        <div className="fixed inset-0 z-[999999] flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-md">
          <div className="flex flex-col items-center gap-6 rounded-3xl border border-teal-500/20 bg-surface-secondary/90 p-8 shadow-2xl">
            <div className="relative flex h-16 w-16 items-center justify-center">
              <div className="absolute inset-0 animate-ping rounded-full bg-teal-500/20" />
              <div className="absolute inset-2 animate-pulse rounded-full bg-teal-500/40" />
              <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-text-primary">Adaptando Matriz PESV con IA</h3>
              <p className="mt-2 text-sm text-text-secondary max-w-xs">
                Nuestra IA está mapeando las columnas y recalculando los niveles de criticidad vial
                para adaptarlos al formato oficial del PESV (Res. 20223040040595)...
              </p>
            </div>
          </div>
        </div>
      )}

      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-[999998] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md overflow-hidden rounded-3xl border border-border-medium bg-surface-primary shadow-2xl transition-all">
            <div className="relative p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-yellow-500/20 bg-yellow-500/10 text-yellow-600">
                <Sparkles className="h-6 w-6 animate-pulse" />
              </div>
              <h3 className="text-lg font-bold text-text-primary">
                ¿Reconstruir matriz vial con IA?
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                Hemos detectado que el archivo cargado no coincide con el formato estándar de Wappy
                PESV.
              </p>
              <p className="mt-2 text-sm leading-relaxed text-text-secondary font-medium">
                ¿Deseas que la IA de Wappy analice y adapte automáticamente tu matriz para que
                encaje con nuestro formato oficial de seguridad vial?
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

  // ── Guard: no convo en modo chat ──
  if (!isOfficialApp && (!actualConvoId || actualConvoId === 'new') && matrixRows.length === 0) {
    return (
      <div className="relative flex h-full flex-col items-center justify-center border-l border-border-light bg-surface-primary p-8 text-center">
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
        <h3 className="mb-2 text-lg font-semibold text-text-primary">Matriz PESV Inactiva</h3>
        <p className="mb-6 max-w-sm text-sm text-text-secondary">
          Envía el primer mensaje en el chat del Experto en Riesgo Vial para instanciar la matriz
          PESV. Los peligros viales se guardarán automáticamente aquí y en el aplicativo oficial del
          Hito 1.
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
            Descargar Plantilla Vacía (Excel)
          </button>
        </div>
        {renderModals()}
      </div>
    );
  }

  const renderContent = () => (
    <div
      ref={containerRef}
      className={`flex flex-col transition-colors duration-300 ${
        isMaximized
          ? 'fixed inset-0 z-[999999] m-0 h-screen w-screen rounded-none bg-surface-primary shadow-2xl'
          : isOfficialApp
            ? 'w-full bg-transparent gap-6'
            : 'w-full h-full border-l border-border-light bg-surface-primary'
      }`}
    >
      {/* ── 1. Barra Flotante de Herramientas SGSST (Modo Aplicativo Oficial) ── */}
      {isOfficialApp && !isMaximized && (
        <>
          <SGSSTToolbar
            onHistory={() => setIsHistoryOpen(!isHistoryOpen)}
            isHistoryOpen={isHistoryOpen}
            onAnalyze={handleAnalyzeMatrix}
            isAnalyzing={isAnalyzing}
            aiButtons={[
              {
                id: 'auto-assign-cargos-pesv-official',
                onClick: () => handleAutoAssignCargos(),
                title:
                  'Auto-asignar cargos con IA a todas las filas viales según los perfiles de la empresa (Hito 2)',
                label: isAutoAssigningCargos ? 'Asignando Cargos…' : 'Auto-Asignar Cargos IA',
                icon: Briefcase,
                variant: 'ai',
                disabled: isAutoAssigningCargos || matrixRows.length === 0,
                isLoading: isAutoAssigningCargos,
              },
              {
                id: 'sync-controles-pesv-official',
                onClick: handleSyncControlesPESV,
                title:
                  'Sincronizar los Planes de Acción Viales (Medio, Vehículo, Individuo, Infraestructura) con el Centro de Control (Kanban ACPM)',
                label: isSyncingControles
                  ? 'Sincronizando…'
                  : 'Sincronizar Planes PESV con Centro de Control',
                icon: CheckSquare,
                variant: 'ai',
                disabled: isSyncingControles || matrixRows.length === 0,
                isLoading: isSyncingControles,
              },
            ]}
            selectedModel={selectedModel}
            onSelectModel={setSelectedModel}
            onSaveLocal={() => {
              saveMatrixData(matrixRows);
              showToast({
                message: 'Matriz PESV guardada y sincronizada exitosamente.',
                status: 'success',
              });
            }}
            hasContent={!!reportContent || matrixRows.length > 0}
            onImportExcel={() => fileInputRef.current?.click()}
            onExportExcel={handleExportExcel}
            onDownloadTemplate={handleExportTemplate}
            exportContent={reportContent || ''}
            exportFileName={`Informe_PESV_Res40595_${new Date().toISOString().slice(0, 10)}`}
            onDummy={handleDummyData}
          />

          {isHistoryOpen && (
            <div className="overflow-hidden rounded-2xl border border-border-medium bg-surface-secondary shadow-sm">
              <ReportHistory
                onSelectReport={handleSelectReport}
                isOpen={isHistoryOpen}
                toggleOpen={() => setIsHistoryOpen(!isHistoryOpen)}
                refreshTrigger={refreshTrigger}
                tags={['sgsst-matriz-pesv']}
              />
            </div>
          )}
        </>
      )}

      {/* ── 2. Contenedor de la Matriz PESV (Tarjeta con Acabado Premium Somos SST) ── */}
      <div
        className={
          isOfficialApp && !isMaximized
            ? 'overflow-hidden rounded-2xl border border-border-medium bg-surface-secondary shadow-sm transition-all duration-300'
            : 'flex flex-col flex-1 min-h-0'
        }
      >
        {isOfficialApp && !isMaximized ? (
          <div className="flex flex-wrap items-center justify-between p-4 bg-surface-tertiary/50 border-b border-border-light gap-3">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setIsTableExpanded(!isTableExpanded)}
                className="flex items-center gap-2 text-left font-semibold text-text-primary hover:text-teal-600 transition-colors"
              >
                {isTableExpanded ? (
                  <ChevronDown className="h-5 w-5 text-text-secondary" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-text-secondary" />
                )}
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
                  <Truck className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-base font-bold text-text-primary">
                    Matriz de Riesgos Viales PESV Live (Res. 20223040040595)
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                      Sincronización Activa con Flota Automotor (Hito 5), Cargos (Hito 2) y ACPM
                    </span>
                  </div>
                </div>
              </button>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Riesgos Viales Evaluados */}
              <div
                title={`${matrixRows.length} ${matrixRows.length === 1 ? 'Riesgo Vial Evaluado' : 'Riesgos Viales Evaluados'}`}
                className="group flex h-8 min-w-[32px] sm:h-10 sm:min-w-[40px] shrink-0 cursor-default items-center justify-center rounded-xl border border-teal-500/30 bg-teal-500/10 text-teal-700 dark:text-teal-300 px-2 sm:px-2.5 shadow-sm outline-none transition-all duration-300 sm:hover:-rotate-3 sm:hover:scale-105"
              >
                <div className="relative flex flex-shrink-0 items-center justify-center">
                  <FileSpreadsheet className="h-4 w-4 sm:h-5 sm:w-5 text-teal-600 dark:text-teal-400 shrink-0" />
                  <span className="absolute -right-2.5 -top-2 z-10 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-teal-600 text-[10px] font-bold text-white shadow-sm ring-2 ring-surface-primary">
                    {matrixRows.length}
                  </span>
                </div>
                <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[220px] group-hover:opacity-100 sm:flex">
                  <span className="text-sm font-bold tracking-wide">
                    {matrixRows.length}{' '}
                    {matrixRows.length === 1 ? 'Riesgo Vial Evaluado' : 'Riesgos Viales Evaluados'}
                  </span>
                </div>
              </div>

              {/* Añadir Riesgo */}
              <button
                type="button"
                onClick={addRow}
                title="Añadir Riesgo Vial"
                aria-label="Añadir Riesgo Vial"
                className="group flex h-8 min-w-[32px] shrink-0 cursor-pointer items-center justify-center rounded-xl border border-teal-500/40 bg-surface-primary px-2 text-teal-600 shadow-sm outline-none transition-all duration-300 hover:bg-teal-50 hover:border-teal-500 dark:text-teal-400 dark:hover:bg-teal-900/20 sm:h-10 sm:min-w-[40px] sm:px-2.5 sm:hover:-rotate-3 sm:hover:scale-105"
              >
                <div className="relative flex flex-shrink-0 items-center justify-center">
                  <Plus className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                </div>
                <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[200px] group-hover:opacity-100 sm:flex">
                  <span className="text-sm font-bold tracking-wide">Añadir Riesgo</span>
                </div>
              </button>

              {/* Importar Excel */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Importar Excel"
                aria-label="Importar Excel"
                className="group flex h-8 min-w-[32px] shrink-0 cursor-pointer items-center justify-center rounded-xl border border-emerald-600 bg-emerald-600 hover:bg-emerald-700 text-white px-2 shadow-sm outline-none transition-all duration-300 sm:h-10 sm:min-w-[40px] sm:px-2.5 sm:hover:-rotate-3 sm:hover:scale-105"
              >
                <div className="relative flex flex-shrink-0 items-center justify-center">
                  <Upload className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                </div>
                <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[200px] group-hover:opacity-100 sm:flex">
                  <span className="text-sm font-bold tracking-wide">Importar Excel</span>
                </div>
              </button>

              {/* Asignar Cargos IA */}
              {matrixRows.length > 0 && (
                <button
                  type="button"
                  onClick={() => handleAutoAssignCargos()}
                  disabled={isAutoAssigningCargos}
                  title="Auto-asignar cargos con IA según los perfiles de la empresa"
                  aria-label="Asignar Cargos con IA"
                  className="group flex h-8 min-w-[32px] shrink-0 cursor-pointer items-center justify-center rounded-xl border border-teal-500/40 bg-teal-500/10 hover:bg-teal-500/20 text-teal-700 dark:text-teal-300 px-2 shadow-sm outline-none transition-all duration-300 disabled:opacity-50 sm:h-10 sm:min-w-[40px] sm:px-2.5 sm:hover:-rotate-3 sm:hover:scale-105"
                >
                  <div className="relative flex flex-shrink-0 items-center justify-center">
                    {isAutoAssigningCargos ? (
                      <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 animate-spin text-teal-600 dark:text-teal-400" />
                    ) : (
                      <Briefcase className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 text-teal-600 dark:text-teal-400" />
                    )}
                  </div>
                  <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[200px] group-hover:opacity-100 sm:flex">
                    <span className="text-sm font-bold tracking-wide">
                      {isAutoAssigningCargos ? 'Asignando Cargos…' : 'Asignar Cargos IA'}
                    </span>
                  </div>
                </button>
              )}

              {/* Pantalla Completa */}
              <button
                type="button"
                onClick={() => setIsMaximized(true)}
                title="Pantalla Completa"
                aria-label="Pantalla Completa"
                className="group flex h-8 min-w-[32px] shrink-0 cursor-pointer items-center justify-center rounded-xl border border-border-medium bg-surface-primary hover:bg-surface-hover text-text-primary px-2 shadow-sm outline-none transition-all duration-300 sm:h-10 sm:min-w-[40px] sm:px-2.5 sm:hover:-rotate-3 sm:hover:scale-105"
              >
                <div className="relative flex flex-shrink-0 items-center justify-center">
                  <Maximize2 className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                </div>
                <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[200px] group-hover:opacity-100 sm:flex">
                  <span className="text-sm font-bold tracking-wide">Pantalla Completa</span>
                </div>
              </button>
            </div>
          </div>
        ) : (
          /* ── Header Clásico para Chat / Pantalla Completa ── */
          <div
            className="relative z-[300] flex min-w-0 shrink-0 flex-wrap items-center justify-between gap-2 border-b border-border-light bg-surface-secondary px-3 py-2 sm:px-4 sm:py-0"
            style={{ minHeight: '4rem' }}
          >
            <div className="flex min-w-0 flex-shrink items-center gap-2 sm:gap-3 overflow-hidden text-ellipsis">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-teal-500/20 bg-teal-500/10 text-teal-600 shadow-sm">
                <Truck className="h-5 w-5" />
              </div>
              <div className="min-w-0 overflow-hidden">
                <h2 className="truncate text-sm font-semibold text-text-primary">
                  Matriz PESV Live
                </h2>
                <div className="flex items-center gap-1.5 overflow-hidden">
                  <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-green-500" />
                  <span className="truncate text-xs text-text-secondary">
                    Sincronización Activa (Res. 40595)
                  </span>
                </div>
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-1.5 sm:gap-2 overflow-visible py-1">
              {isLoading && <RefreshCw className="h-4 w-4 animate-spin text-text-secondary" />}

              <ModelSelector
                selectedModel={selectedModel}
                onSelectModel={setSelectedModel}
                hideTooltip={true}
              />

              {/* Añadir Fila */}
              <button
                type="button"
                onClick={addRow}
                title="Añadir Riesgo Vial"
                className="group flex h-8 min-w-[32px] sm:h-10 sm:min-w-[40px] flex-shrink-0 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-teal-500/40 bg-surface-primary px-2 sm:px-2.5 text-teal-600 shadow-sm outline-none transition-all duration-300 hover:bg-teal-50 hover:border-teal-500 dark:text-teal-400 dark:hover:bg-teal-900/20 sm:hover:-rotate-3 sm:hover:scale-105"
              >
                <Plus className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                <span className="flex max-w-0 items-center overflow-hidden whitespace-nowrap text-sm font-bold tracking-wide opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[200px] group-hover:opacity-100">
                  Añadir Riesgo
                </span>
              </button>

              {/* Analizar Matriz Completa */}
              <button
                type="button"
                onClick={handleAnalyzeMatrix}
                disabled={isAnalyzing || matrixRows.length === 0}
                title="Análisis PESV con IA"
                className="group flex h-8 min-w-[32px] sm:h-10 sm:min-w-[40px] flex-shrink-0 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-purple-500/40 bg-surface-primary px-2 sm:px-2.5 text-purple-600 shadow-sm outline-none transition-all duration-300 hover:bg-purple-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-purple-400 dark:hover:bg-purple-900/20 sm:hover:-rotate-3 sm:hover:scale-105"
              >
                {isAnalyzing ? (
                  <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 animate-spin" />
                ) : (
                  <FileTextIcon className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                )}
                <span className="flex max-w-0 items-center overflow-hidden whitespace-nowrap text-sm font-bold tracking-wide opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[200px] group-hover:opacity-100">
                  {isAnalyzing ? 'Generando…' : 'Análisis PESV'}
                </span>
              </button>

              {/* Importar */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Importar Excel"
                className="group flex h-8 min-w-[32px] sm:h-10 sm:min-w-[40px] flex-shrink-0 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-border-medium bg-surface-primary px-2 sm:px-2.5 text-text-primary shadow-sm outline-none transition-all duration-300 hover:bg-surface-hover sm:hover:-rotate-3 sm:hover:scale-105"
              >
                <Upload className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                <span className="flex max-w-0 items-center overflow-hidden whitespace-nowrap text-sm font-bold tracking-wide opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[200px] group-hover:opacity-100">
                  Importar
                </span>
              </button>

              {/* Exportar */}
              <ExportDropdown
                content={reportContent || ''}
                fileName={`Informe_PESV_Wappy_${new Date().toISOString().slice(0, 10)}`}
                reportType="general"
                onExportExcel={handleExportExcel}
              />

              {/* Auto-Asignar Cargos con IA */}
              {matrixRows.length > 0 && (
                <button
                  type="button"
                  onClick={() => handleAutoAssignCargos()}
                  disabled={isAutoAssigningCargos}
                  title="Auto-asignar cargos con IA a todas las filas según los perfiles de la empresa"
                  className="group flex h-8 min-w-[32px] sm:h-10 sm:min-w-[40px] flex-shrink-0 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-teal-500/40 bg-teal-500/10 hover:bg-teal-500/20 px-2 sm:px-2.5 text-teal-700 dark:text-teal-300 shadow-sm outline-none transition-all duration-300 disabled:opacity-50 sm:hover:-rotate-3 sm:hover:scale-105"
                >
                  {isAutoAssigningCargos ? (
                    <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 animate-spin text-teal-600 dark:text-teal-400" />
                  ) : (
                    <Briefcase className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 text-teal-600 dark:text-teal-400" />
                  )}
                  <span className="flex max-w-0 items-center overflow-hidden whitespace-nowrap text-sm font-bold tracking-wide opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[240px] group-hover:opacity-100">
                    {isAutoAssigningCargos ? 'Asignando Cargos…' : '⚡ Auto-Asignar Cargos IA'}
                  </span>
                </button>
              )}

              {/* Sincronizar Planes PESV con Centro de Control */}
              {matrixRows.length > 0 && (
                <button
                  type="button"
                  onClick={handleSyncControlesPESV}
                  disabled={isSyncingControles}
                  title="Sincronizar Planes de Acción PESV con el Centro de Control (Kanban ACPM)"
                  className="group flex h-8 min-w-[32px] sm:h-10 sm:min-w-[40px] flex-shrink-0 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-indigo-500/40 bg-indigo-500/10 hover:bg-indigo-500/20 px-2 sm:px-2.5 text-indigo-700 dark:text-indigo-300 shadow-sm outline-none transition-all duration-300 disabled:opacity-50 sm:hover:-rotate-3 sm:hover:scale-105"
                >
                  {isSyncingControles ? (
                    <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 animate-spin text-indigo-600 dark:text-indigo-400" />
                  ) : (
                    <CheckSquare className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 text-indigo-600 dark:text-indigo-400" />
                  )}
                  <span className="flex max-w-0 items-center overflow-hidden whitespace-nowrap text-sm font-bold tracking-wide opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[340px] group-hover:opacity-100">
                    {isSyncingControles
                      ? 'Sincronizando…'
                      : 'Sincronizar Planes PESV con Centro de Control'}
                  </span>
                </button>
              )}

              {/* Guardar */}
              <button
                type="button"
                onClick={() => saveMatrixData(matrixRows)}
                title="Guardar Matriz PESV"
                className="group flex h-8 min-w-[32px] sm:h-10 sm:min-w-[40px] flex-shrink-0 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-green-500/40 bg-surface-primary px-2 sm:px-2.5 text-green-600 shadow-sm outline-none transition-all duration-300 hover:bg-green-50 disabled:opacity-50 dark:text-green-400 dark:hover:bg-green-900/20 sm:hover:-rotate-3 sm:hover:scale-105"
              >
                <Save className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                <span className="flex max-w-0 items-center overflow-hidden whitespace-nowrap text-sm font-bold tracking-wide opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[200px] group-hover:opacity-100">
                  {isSaving ? 'Guardando…' : 'Guardar'}
                </span>
              </button>

              {/* Botón Establecer como Matriz Oficial (cuando se visualiza dentro de un chat) */}
              {!isOfficialApp &&
                matrixRows.length > 0 &&
                (isCurrentConvoOfficial ? (
                  <div
                    title="Esta matriz PESV está activa en el Aplicativo Institucional (Hito 1)"
                    className="group flex h-8 min-w-[32px] sm:h-10 sm:min-w-[40px] flex-shrink-0 shrink-0 cursor-default items-center justify-center rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-2 sm:px-2.5 text-emerald-600 dark:text-emerald-400 shadow-sm outline-none transition-all duration-300 sm:hover:-rotate-3 sm:hover:scale-105"
                  >
                    <div className="relative flex flex-shrink-0 items-center justify-center">
                      <Star className="h-4 w-4 sm:h-5 sm:w-5 fill-emerald-500 text-emerald-500 shrink-0" />
                      <span className="absolute -right-1 -top-1 flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                      </span>
                    </div>
                    <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[200px] group-hover:opacity-100 sm:flex">
                      <span className="text-sm font-bold tracking-wide">Matriz Activa</span>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleSetAsOfficial}
                    disabled={isSettingOfficial}
                    title="Fijar en el Aplicativo SG-SST (Hito 1)"
                    className="group flex h-8 min-w-[32px] sm:h-10 sm:min-w-[40px] flex-shrink-0 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-amber-500/50 bg-amber-500/10 hover:bg-amber-500/20 px-2 sm:px-2.5 text-amber-700 dark:text-amber-300 shadow-sm outline-none transition-all duration-300 disabled:opacity-50 sm:hover:-rotate-3 sm:hover:scale-105"
                  >
                    {isSettingOfficial ? (
                      <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 animate-spin text-amber-500" />
                    ) : (
                      <Star className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 fill-amber-500/30 text-amber-500" />
                    )}
                    <span className="flex max-w-0 items-center overflow-hidden whitespace-nowrap text-sm font-bold tracking-wide opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[240px] group-hover:opacity-100">
                      {isSettingOfficial ? 'Guardando…' : 'Fijar en Aplicativo'}
                    </span>
                  </button>
                ))}

              {/* Maximizar */}
              <button
                type="button"
                onClick={() => setIsMaximized((m) => !m)}
                title={isMaximized ? 'Restaurar pantalla' : 'Pantalla completa'}
                className="group flex h-8 min-w-[32px] sm:h-10 sm:min-w-[40px] flex-shrink-0 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-border-medium bg-surface-primary px-2 sm:px-2.5 text-text-primary shadow-sm outline-none transition-all duration-300 hover:bg-surface-hover sm:hover:-rotate-3 sm:hover:scale-105"
              >
                {isMaximized ? (
                  <Minimize2 className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                ) : (
                  <Maximize2 className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                )}
                <span className="flex max-w-0 items-center overflow-hidden whitespace-nowrap text-sm font-bold tracking-wide opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[200px] group-hover:opacity-100">
                  {isMaximized ? 'Restaurar' : 'Expandir'}
                </span>
              </button>
            </div>
          </div>
        )}

        {(!isOfficialApp || isMaximized || isTableExpanded) && (
          <div className="flex flex-col flex-1 min-h-0 bg-surface-primary">
            {/* ── Barra de Filtros ── */}
            <div className="relative z-[200] flex shrink-0 flex-wrap items-center gap-2 border-b border-border-light bg-surface-secondary px-4 py-2.5">
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

              {/* Filtro Grupo / Proceso */}
              <FilterSelect
                value={filterProceso}
                onChange={setFilterProceso}
                placeholder="Todos los grupos"
                options={procesosUnicos.map((p) => ({ value: p, label: p }))}
              />

              {/* Filtro Cargo */}
              <FilterSelect
                value={filterCargo}
                onChange={setFilterCargo}
                placeholder="Todos los cargos"
                options={cargosUnicos.map((c) => ({ value: c, label: c }))}
              />

              {/* Filtro Actor Vial */}
              <FilterSelect
                value={filterActor}
                onChange={setFilterActor}
                placeholder="Todos los actores"
                options={ACTORES_VIALES.map((a) => ({ value: a, label: a }))}
              />

              {/* Filtro Criticidad */}
              <FilterSelect
                value={filterNivel}
                onChange={setFilterNivel}
                placeholder="Todas las criticidades"
                options={[
                  { value: 'Alto', label: '🔴 Alto o Crítico (12-15)' },
                  { value: 'Medio', label: '🟡 Medio o Moderado (8-11)' },
                  { value: 'Bajo', label: '🟢 Bajo (3-7)' },
                ]}
              />

              {/* Limpiar filtros */}
              {(filterText || filterProceso || filterCargo || filterActor || filterNivel) && (
                <button
                  onClick={() => {
                    setFilterText('');
                    setFilterProceso('');
                    setFilterCargo('');
                    setFilterActor('');
                    setFilterNivel('');
                  }}
                  className="flex h-8 cursor-pointer items-center gap-1 rounded-xl border border-red-200 bg-red-50 px-3 text-xs font-medium text-red-600 transition-colors hover:bg-red-100 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400"
                >
                  ✕ Limpiar
                  <span className="rounded-full bg-red-600 px-1.5 py-0.5 text-[9px] font-black text-white">
                    {
                      [filterText, filterProceso, filterCargo, filterActor, filterNivel].filter(
                        Boolean,
                      ).length
                    }
                  </span>
                </button>
              )}
              <span className="ml-auto text-xs font-medium tabular-nums text-text-secondary">
                {displayRows.length} / {matrixRows.length} peligros viales
              </span>
            </div>

            {/* ── Tabla de spreadsheet ── */}
            <div className="flex-1 overflow-auto custom-scrollbar-ipevar">
              <style>{`
                .custom-scrollbar-ipevar::-webkit-scrollbar {
                  height: 10px;
                  width: 10px;
                }
                .custom-scrollbar-ipevar::-webkit-scrollbar-track {
                  background: #f1f5f9;
                }
                .dark .custom-scrollbar-ipevar::-webkit-scrollbar-track {
                  background: #1e293b;
                }
                .custom-scrollbar-ipevar::-webkit-scrollbar-thumb {
                  background: #cbd5e1;
                  border-radius: 6px;
                  border: 2px solid #f1f5f9;
                }
                .dark .custom-scrollbar-ipevar::-webkit-scrollbar-thumb {
                  background: #475569;
                  border: 2px solid #1e293b;
                }
                .custom-scrollbar-ipevar::-webkit-scrollbar-thumb:hover {
                  background: #0d9488;
                }
                .dark .custom-scrollbar-ipevar::-webkit-scrollbar-thumb:hover {
                  background: #0f766e;
                }
                .custom-scrollbar-ipevar textarea,
                .custom-scrollbar-ipevar input:not([type="checkbox"]) {
                  -webkit-text-fill-color: #0f172a;
                }
                .dark .custom-scrollbar-ipevar textarea,
                .dark .custom-scrollbar-ipevar input:not([type="checkbox"]) {
                  -webkit-text-fill-color: #f8fafc;
                }
              `}</style>
              {matrixRows.length === 0 && !isLoading ? (
                <div className="flex h-56 flex-col items-center justify-center gap-3 text-text-secondary p-6">
                  <Truck className="h-10 w-10 opacity-20" />
                  <p className="px-4 text-center text-sm max-w-md">
                    Aún no hay riesgos viales en la matriz PESV. Pídele al Experto en Riesgo Vial en
                    el chat que los registre, genera datos de prueba o añádelos manualmente.
                  </p>
                  <div className="mt-1 flex flex-wrap items-center justify-center gap-3">
                    <button
                      onClick={addRow}
                      className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 px-5 py-2.5 text-xs font-bold text-white shadow-md transition-all active:scale-95"
                    >
                      <Plus className="h-4 w-4" /> Añadir Primer Riesgo Vial
                    </button>
                    <button
                      onClick={handleDummyData}
                      className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 px-5 py-2.5 text-xs font-bold text-white shadow-md transition-all active:scale-95"
                    >
                      <Sparkles className="h-4 w-4" /> Cargar Ejemplo Res. 40595
                    </button>
                  </div>
                </div>
              ) : (
                <div className="min-w-max">
                  <table className="w-full border-collapse text-xs text-gray-900 dark:text-gray-100">
                    <thead className="sticky top-0 z-[100] bg-surface-secondary text-xs font-bold uppercase tracking-wide text-text-secondary border-b border-border-medium">
                      <tr>
                        <th
                          className="min-w-[150px] cursor-pointer px-4 py-3 text-left hover:text-teal-600"
                          onClick={() => toggleSort('grupo_trabajo')}
                        >
                          GRUPO TRABAJO <SortIcon field="grupo_trabajo" />
                        </th>
                        <th
                          className="min-w-[170px] cursor-pointer px-4 py-3 text-left hover:text-teal-600"
                          onClick={() => toggleSort('cargo')}
                        >
                          CARGO (HITO 2) <SortIcon field="cargo" />
                        </th>
                        <th className="min-w-[140px] px-4 py-3 text-center">DESPLAZAMIENTO</th>
                        <th className="min-w-[180px] px-4 py-3 text-left">ROL EN LA VÍA</th>
                        <th className="min-w-[160px] px-4 py-3 text-left">FACTOR RIESGO</th>
                        <th className="min-w-[220px] border-l-2 border-teal-500/20 px-4 py-3 text-left">
                          DESCRIPCIÓN PELIGRO
                        </th>

                        {/* Controles Existentes */}
                        <th className="min-w-[200px] border-l-2 border-blue-500/20 px-4 py-3 text-left text-blue-700 dark:text-blue-400">
                          CONTROLES EXISTENTES
                        </th>
                        <th className="min-w-[160px] px-4 py-3 text-left text-blue-700 dark:text-blue-400">
                          TIPO CONTROLES
                        </th>

                        {/* Evaluación cualitativa / cuantitativa */}
                        <th className="min-w-[160px] border-l-2 border-purple-500/20 px-4 py-3 text-center text-purple-700 dark:text-purple-400">
                          NP CUALITATIVO
                        </th>
                        <th className="min-w-[80px] px-4 py-3 text-center text-purple-700 dark:text-purple-400">
                          NP CUANT
                        </th>
                        <th className="min-w-[160px] px-4 py-3 text-center text-purple-700 dark:text-purple-400">
                          NE CUALITATIVO
                        </th>
                        <th className="min-w-[80px] px-4 py-3 text-center text-purple-700 dark:text-purple-400">
                          NE CUANT
                        </th>
                        <th className="min-w-[160px] px-4 py-3 text-center text-purple-700 dark:text-purple-400">
                          NC CUALITATIVO
                        </th>
                        <th className="min-w-[80px] px-4 py-3 text-center text-purple-700 dark:text-purple-400">
                          NC CUANT
                        </th>

                        <th
                          className="min-w-[85px] cursor-pointer border-l-2 border-orange-500/20 px-4 py-3 text-center text-orange-700 hover:text-orange-500 dark:text-orange-400"
                          onClick={() => toggleSort('calificacion')}
                        >
                          CALIF <SortIcon field="calificacion" />
                        </th>
                        <th className="min-w-[140px] border-l border-border-light px-4 py-3 text-center text-slate-700 dark:text-slate-400">
                          NIVEL RIESGO
                        </th>
                        <th className="min-w-[160px] border-l border-border-light px-4 py-3 text-center text-slate-700 dark:text-slate-400">
                          ACEPTABILIDAD
                        </th>

                        <th className="min-w-[180px] border-l border-border-light px-4 py-3 text-left text-blue-700 dark:text-blue-400">
                          TRATAMIENTO ACCIÓN
                        </th>

                        {/* Plan de Acción */}
                        <th className="min-w-[200px] border-l-2 border-emerald-500/20 px-4 py-3 text-left text-emerald-700 dark:text-emerald-400">
                          PLAN ACCIÓN (MEDIO)
                        </th>
                        <th className="min-w-[200px] px-4 py-3 text-left text-emerald-700 dark:text-emerald-400">
                          PLAN ACCIÓN (VEHÍCULO)
                        </th>
                        <th className="min-w-[200px] px-4 py-3 text-left text-emerald-700 dark:text-emerald-400">
                          PLAN ACCIÓN (INDIVIDUO)
                        </th>
                        <th className="min-w-[200px] px-4 py-3 text-left text-emerald-700 dark:text-emerald-400">
                          PLAN ACCIÓN (INFRAESTRUCTURA)
                        </th>

                        <th className="min-w-[160px] border-l border-border-light px-4 py-3 text-left">
                          RESPONSABLE
                        </th>
                        <th className="min-w-[140px] px-4 py-3 text-left">FECHA / PERIODICIDAD</th>
                        <th className="min-w-[130px] px-4 py-3 text-center">ESTADO</th>
                        <th className="min-w-[220px] px-4 py-3 text-left">OBSERVACIONES</th>
                        <th className="sticky right-0 z-[200] min-w-[100px] border-l border-border-light bg-surface-secondary px-4 py-3 text-center shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.06)]">
                          ACCIONES
                        </th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-900 dark:text-gray-100">
                      {paginatedRows.map(({ row, idx }) => {
                        const crit = getCriticidadLabel(row.calificacion || 0);

                        return (
                          <tr
                            key={row.id || idx}
                            className="hover:bg-surface-secondary/50 group border-b border-border-light transition-colors text-gray-900 dark:text-gray-100"
                          >
                            {/* Grupo Trabajo */}
                            <td className="px-4 py-3">
                              <textarea
                                rows={2}
                                className="w-full min-w-[140px] resize border-transparent bg-transparent text-sm font-medium text-gray-900 placeholder:text-gray-400 outline-none focus:border-transparent focus:outline-none focus:ring-0 dark:text-gray-100 dark:placeholder:text-gray-500"
                                value={row.grupo_trabajo || ''}
                                onChange={(e) =>
                                  handleCellChange(idx, 'grupo_trabajo', e.target.value)
                                }
                              />
                            </td>

                            {/* Cargo Sincronizado con Perfiles de Cargo */}
                            <td className="px-4 py-3">
                              <AICargoCell
                                value={row.cargo || ''}
                                onChange={(v) => handleCellChange(idx, 'cargo', v)}
                                cargosList={cargosUnicos}
                                onCreateNew={(newCargo) => handleCreateNewCargo(idx, newCargo)}
                              />
                            </td>

                            {/* Tipo Desplazamiento */}
                            <td className="px-4 py-3 text-center">
                              <select
                                className="border-transparent bg-transparent text-xs outline-none focus:border-transparent focus:outline-none focus:ring-0 text-gray-900 dark:text-gray-100 cursor-pointer font-medium"
                                value={row.tipo_desplazamiento || 'Misional'}
                                onChange={(e) =>
                                  handleCellChange(idx, 'tipo_desplazamiento', e.target.value)
                                }
                              >
                                <option value="Misional">Misional</option>
                                <option value="In itinere">In itinere</option>
                              </select>
                            </td>

                            {/* Rol en la Vía */}
                            <td className="px-4 py-3">
                              <select
                                className="w-full min-w-[160px] border-transparent bg-transparent text-xs outline-none focus:border-transparent focus:outline-none focus:ring-0 dark:text-gray-200 cursor-pointer"
                                value={row.rol_via || 'Peatón'}
                                onChange={(e) => handleCellChange(idx, 'rol_via', e.target.value)}
                              >
                                {ACTORES_VIALES.map((a) => (
                                  <option key={a} value={a}>
                                    {a}
                                  </option>
                                ))}
                              </select>
                            </td>

                            {/* Factor Riesgo */}
                            <td className="px-4 py-3">
                              <select
                                className="w-full min-w-[140px] border-transparent bg-transparent text-xs outline-none focus:border-transparent focus:outline-none focus:ring-0 dark:text-gray-200 cursor-pointer"
                                value={row.factor_riesgo || 'Factor Humano'}
                                onChange={(e) =>
                                  handleCellChange(idx, 'factor_riesgo', e.target.value)
                                }
                              >
                                {FACTORES_RIESGO.map((fr) => (
                                  <option key={fr} value={fr}>
                                    {fr}
                                  </option>
                                ))}
                              </select>
                            </td>

                            {/* Descripción Peligro */}
                            <td className="border-l border-border-light px-4 py-3">
                              <AITextarea
                                value={row.peligro_descripcion || ''}
                                onChange={(v) => handleCellChange(idx, 'peligro_descripcion', v)}
                                minW="210px"
                                fieldLabel="Descripción del Peligro Vial"
                                row={row}
                                token={token}
                                selectedModel={selectedModel}
                              />
                            </td>

                            {/* Controles Existentes */}
                            <td className="border-l border-border-light bg-blue-500/5 px-4 py-3">
                              <AITextarea
                                value={row.controles_existentes_descripcion || ''}
                                onChange={(v) =>
                                  handleCellChange(idx, 'controles_existentes_descripcion', v)
                                }
                                minW="180px"
                                fieldLabel="Controles Existentes / Diagnóstico"
                                row={row}
                                token={token}
                                selectedModel={selectedModel}
                              />
                            </td>

                            {/* Tipo Controles */}
                            <td className="bg-blue-500/5 px-4 py-3">
                              <select
                                className="w-full min-w-[140px] border-transparent bg-transparent text-xs outline-none focus:border-transparent focus:outline-none focus:ring-0 dark:text-gray-200 cursor-pointer"
                                value={row.controles_existentes_tipo || 'Ninguno'}
                                onChange={(e) =>
                                  handleCellChange(idx, 'controles_existentes_tipo', e.target.value)
                                }
                              >
                                {CONTROLES_TIPO_OPCIONES.map((o) => (
                                  <option key={o} value={o}>
                                    {o}
                                  </option>
                                ))}
                              </select>
                            </td>

                            {/* NP Cualitativo */}
                            <td className="border-l border-border-light bg-purple-500/5 px-4 py-3 text-center">
                              <select
                                className="w-full min-w-[140px] border-transparent bg-transparent text-xs outline-none focus:border-transparent focus:outline-none focus:ring-0 dark:text-gray-200 cursor-pointer font-semibold text-purple-700 dark:text-purple-400"
                                value={row.np_cualitativo || 'PROBABLE'}
                                onChange={(e) =>
                                  handleCellChange(idx, 'np_cualitativo', e.target.value)
                                }
                              >
                                {NP_CUALITATIVO_OPCIONES.map((opt) => (
                                  <option key={opt.label} value={opt.label} title={opt.desc}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            </td>

                            {/* NP Cuantitativo */}
                            <td className="bg-purple-500/5 px-4 py-3 text-center font-mono font-bold text-purple-700 dark:text-purple-400">
                              {row.np_cuantitativo || 3}
                            </td>

                            {/* NE Cualitativo */}
                            <td className="bg-purple-500/5 px-4 py-3 text-center">
                              <select
                                className="w-full min-w-[140px] border-transparent bg-transparent text-xs outline-none focus:border-transparent focus:outline-none focus:ring-0 dark:text-gray-200 cursor-pointer font-semibold text-purple-700 dark:text-purple-400"
                                value={row.ne_cualitativo || 'OCASIONAL'}
                                onChange={(e) =>
                                  handleCellChange(idx, 'ne_cualitativo', e.target.value)
                                }
                              >
                                {NE_CUALITATIVO_OPCIONES.map((opt) => (
                                  <option key={opt.label} value={opt.label} title={opt.desc}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            </td>

                            {/* NE Cuantitativo */}
                            <td className="bg-purple-500/5 px-4 py-3 text-center font-mono font-bold text-purple-700 dark:text-purple-400">
                              {row.ne_cuantitativo || 3}
                            </td>

                            {/* NC Cualitativo */}
                            <td className="bg-purple-500/5 px-4 py-3 text-center">
                              <select
                                className="w-full min-w-[140px] border-transparent bg-transparent text-xs outline-none focus:border-transparent focus:outline-none focus:ring-0 dark:text-gray-200 cursor-pointer font-semibold text-purple-700 dark:text-purple-400"
                                value={row.nc_cualitativo || 'MODERADO'}
                                onChange={(e) =>
                                  handleCellChange(idx, 'nc_cualitativo', e.target.value)
                                }
                              >
                                {NC_CUALITATIVO_OPCIONES.map((opt) => (
                                  <option key={opt.label} value={opt.label} title={opt.desc}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            </td>

                            {/* NC Cuantitativo */}
                            <td className="bg-purple-500/5 px-4 py-3 text-center font-mono font-bold text-purple-700 dark:text-purple-400">
                              {row.nc_cuantitativo || 3}
                            </td>

                            {/* Calificación */}
                            <td className="border-l-2 border-orange-500/20 bg-orange-500/5 px-4 py-3 text-center align-middle font-black text-orange-700 dark:text-orange-400">
                              <div className="text-base">{row.calificacion || 9}</div>
                            </td>

                            {/* Nivel de Riesgo */}
                            <td className="border-l border-border-light text-center px-4 py-3 align-middle bg-surface-primary dark:bg-surface-secondary">
                              {(() => {
                                const val = crit.label || '—';
                                const color =
                                  val.includes('ALTO') ||
                                  val.includes('CRITICO') ||
                                  val.includes('CRÍTICO')
                                    ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300'
                                    : val.includes('MEDIO') || val.includes('MODERADO')
                                      ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300'
                                      : 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300';
                                return (
                                  <span
                                    className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wider ${color}`}
                                  >
                                    {val}
                                  </span>
                                );
                              })()}
                            </td>

                            {/* Aceptabilidad */}
                            <td className="border-l border-border-light text-center px-4 py-3 align-middle bg-surface-primary dark:bg-surface-secondary">
                              {(() => {
                                const val = row.aceptabilidad || 'ACEPTABLE';
                                const color = val.includes('NO ACEPTABLE')
                                  ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300'
                                  : val.includes('ESPECIFICO') || val.includes('ESPECÍFICO')
                                    ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300'
                                    : 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300';
                                return (
                                  <span
                                    className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wider ${color}`}
                                  >
                                    {val}
                                  </span>
                                );
                              })()}
                            </td>

                            {/* Tratamiento Acción */}
                            <td className="border-l border-border-light bg-blue-500/5 px-4 py-3">
                              <select
                                className="w-full min-w-[160px] border-transparent bg-transparent text-xs outline-none focus:border-transparent focus:outline-none focus:ring-0 dark:text-gray-200 cursor-pointer"
                                value={row.tratamiento_accion || 'Ninguno'}
                                onChange={(e) =>
                                  handleCellChange(idx, 'tratamiento_accion', e.target.value)
                                }
                              >
                                {TRATAMIENTO_ACCION_OPCIONES.map((o) => (
                                  <option key={o} value={o}>
                                    {o}
                                  </option>
                                ))}
                              </select>
                            </td>

                            {/* Plan Acción Medio */}
                            <td className="border-l border-border-light bg-emerald-500/5 px-4 py-3">
                              <AITextarea
                                value={row.plan_accion_medio || ''}
                                onChange={(v) => handleCellChange(idx, 'plan_accion_medio', v)}
                                minW="190px"
                                fieldLabel="Plan de Acción - Medio"
                                row={row}
                                token={token}
                                selectedModel={selectedModel}
                              />
                            </td>

                            {/* Plan Acción Vehículo */}
                            <td className="bg-emerald-500/5 px-4 py-3">
                              <AITextarea
                                value={row.plan_accion_vehiculo || ''}
                                onChange={(v) => handleCellChange(idx, 'plan_accion_vehiculo', v)}
                                minW="190px"
                                fieldLabel="Plan de Acción - Vehículo"
                                row={row}
                                token={token}
                                selectedModel={selectedModel}
                              />
                            </td>

                            {/* Plan Acción Individuo */}
                            <td className="bg-emerald-500/5 px-4 py-3">
                              <AITextarea
                                value={row.plan_accion_individuo || ''}
                                onChange={(v) => handleCellChange(idx, 'plan_accion_individuo', v)}
                                minW="190px"
                                fieldLabel="Plan de Acción - Individuo"
                                row={row}
                                token={token}
                                selectedModel={selectedModel}
                              />
                            </td>

                            {/* Plan Acción Infraestructura */}
                            <td className="bg-emerald-500/5 px-4 py-3">
                              <AITextarea
                                value={row.plan_accion_infraestructura || ''}
                                onChange={(v) =>
                                  handleCellChange(idx, 'plan_accion_infraestructura', v)
                                }
                                minW="190px"
                                fieldLabel="Plan de Acción - Infraestructura"
                                row={row}
                                token={token}
                                selectedModel={selectedModel}
                              />
                            </td>

                            {/* Responsable */}
                            <td className="border-l border-border-light px-4 py-3">
                              <textarea
                                rows={2}
                                className="w-full min-w-[140px] resize border-transparent bg-transparent text-sm font-medium text-gray-900 placeholder:text-gray-400 outline-none focus:border-transparent focus:outline-none focus:ring-0 dark:text-gray-100 dark:placeholder:text-gray-500"
                                value={row.responsable || ''}
                                onChange={(e) =>
                                  handleCellChange(idx, 'responsable', e.target.value)
                                }
                              />
                            </td>

                            {/* Fecha / Periodicidad */}
                            <td className="px-4 py-3">
                              <textarea
                                rows={2}
                                className="w-full min-w-[140px] resize border-transparent bg-transparent text-sm font-medium text-gray-900 placeholder:text-gray-400 outline-none focus:border-transparent focus:outline-none focus:ring-0 dark:text-gray-100 dark:placeholder:text-gray-500"
                                value={row.fecha_programacion || ''}
                                onChange={(e) =>
                                  handleCellChange(idx, 'fecha_programacion', e.target.value)
                                }
                              />
                            </td>

                            {/* Estado */}
                            <td className="px-4 py-3 text-center">
                              <select
                                className="border-transparent bg-transparent text-xs outline-none focus:border-transparent focus:outline-none focus:ring-0 text-gray-900 dark:text-gray-100 cursor-pointer font-semibold"
                                value={row.estado || 'PLANEADA'}
                                onChange={(e) => handleCellChange(idx, 'estado', e.target.value)}
                              >
                                {ESTADO_OPCIONES.map((o) => (
                                  <option key={o} value={o}>
                                    {o || 'Ninguno'}
                                  </option>
                                ))}
                              </select>
                            </td>

                            {/* Observaciones */}
                            <td className="px-4 py-3">
                              <AITextarea
                                value={row.observaciones || ''}
                                onChange={(v) => handleCellChange(idx, 'observaciones', v)}
                                minW="210px"
                                fieldLabel="Observaciones del Riesgo Vial"
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
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="border-t border-border-light bg-surface-tertiary px-4 py-2 flex items-center justify-between gap-4 flex-wrap">
                <button
                  onClick={addRow}
                  className="flex items-center gap-2 text-xs font-medium text-text-secondary transition-colors hover:text-text-primary"
                >
                  <Plus className="h-3 w-3" /> Añadir Fila
                </button>

                {displayRows.length > 0 && (
                  <div className="flex items-center gap-2 text-xs text-text-secondary select-none">
                    <button
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      className="rounded-md border border-border-medium bg-surface-secondary px-2.5 py-1 hover:bg-surface-tertiary disabled:opacity-40 transition-all font-medium disabled:cursor-not-allowed"
                    >
                      Anterior
                    </button>
                    <span className="px-2">
                      Página <strong>{currentPage}</strong> de{' '}
                      {Math.ceil(displayRows.length / pageSize) || 1} (Total: {displayRows.length}{' '}
                      riesgos)
                    </span>
                    <button
                      disabled={currentPage >= Math.ceil(displayRows.length / pageSize)}
                      onClick={() =>
                        setCurrentPage((prev) =>
                          Math.min(Math.ceil(displayRows.length / pageSize), prev + 1),
                        )
                      }
                      className="rounded-md border border-border-medium bg-surface-secondary px-2.5 py-1 hover:bg-surface-tertiary disabled:opacity-40 transition-all font-medium disabled:cursor-not-allowed"
                    >
                      Siguiente
                    </button>

                    <div className="ml-4 flex items-center gap-1.5">
                      <span>Mostrar:</span>
                      <select
                        value={pageSize}
                        onChange={(e) => {
                          setPageSize(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                        className="rounded-md border border-border-medium bg-surface-secondary px-1.5 py-0.5 outline-none focus:ring-1 focus:ring-teal-500 font-medium"
                      >
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                        <option value={200}>200</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── 3. Dashboard Analítico y Resizer ── */}
      {!isOfficialApp && (
        <div
          onMouseDown={startDrag}
          onTouchStart={startDrag}
          className="group/resizer relative z-20 flex h-4 shrink-0 cursor-row-resize touch-none items-center justify-center border-y border-border-light bg-surface-tertiary transition-colors hover:bg-teal-500/20"
        >
          <div className="h-1 w-12 rounded-full bg-border-heavy group-hover/resizer:bg-teal-500/50" />
        </div>
      )}

      {isOfficialApp && !isMaximized ? (
        <div className="overflow-hidden rounded-2xl border border-border-medium bg-surface-secondary shadow-sm transition-all duration-300">
          <button
            type="button"
            onClick={() => setIsDashboardExpanded(!isDashboardExpanded)}
            className="w-full flex items-center justify-between p-4 bg-surface-tertiary/50 hover:bg-surface-tertiary transition-colors"
          >
            <div className="flex items-center gap-2.5">
              {isDashboardExpanded ? (
                <ChevronDown className="h-5 w-5 text-text-secondary" />
              ) : (
                <ChevronRight className="h-5 w-5 text-text-secondary" />
              )}
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div className="text-left">
                <span className="text-base font-bold text-text-primary">
                  Dashboard y Analítica de Riesgos Viales (PESV Res. 40595)
                </span>
                <p className="text-xs text-text-secondary">
                  Distribución por actores viales, factores de riesgo, niveles de criticidad y
                  conclusiones analíticas con IA.
                </p>
              </div>
            </div>
            <div
              title="Visualización Gráfica PESV"
              className="group flex h-8 min-w-[32px] sm:h-10 sm:min-w-[40px] shrink-0 cursor-default items-center justify-center rounded-xl border border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400 px-2 sm:px-2.5 shadow-sm outline-none transition-all duration-300 sm:hover:-rotate-3 sm:hover:scale-105"
            >
              <div className="relative flex flex-shrink-0 items-center justify-center">
                <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 dark:text-purple-400 shrink-0" />
              </div>
              <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[200px] group-hover:opacity-100 sm:flex">
                <span className="text-sm font-bold tracking-wide">Visualización Gráfica</span>
              </div>
            </div>
          </button>

          {isDashboardExpanded && (
            <div className="p-4 border-t border-border-light bg-surface-primary">
              <MatrizPESVDashboard
                matrixRows={matrixRows}
                conversationId={actualConvoId}
                token={token || ''}
                savedConclusions={chartConclusions}
                onConclusionSaved={(type, text) =>
                  setChartConclusions((prev) => ({ ...prev, [type]: text }))
                }
                isMaximized={isMaximized}
              />
            </div>
          )}
        </div>
      ) : (
        <div
          className="shrink-0 overflow-y-auto bg-surface-primary px-4 py-2"
          style={{ height: `${dashboardHeight}%` }}
        >
          <MatrizPESVDashboard
            matrixRows={matrixRows}
            conversationId={actualConvoId}
            token={token || ''}
            savedConclusions={chartConclusions}
            onConclusionSaved={(type, text) =>
              setChartConclusions((prev) => ({ ...prev, [type]: text }))
            }
            isMaximized={isMaximized}
          />

          {/* ── Informe Ejecutivo PESV (LiveEditor) en modo Chat / Maximizado ── */}
          <div id="pesv-report-editor" className="mb-4 mt-6">
            <CollapsibleReportBox
              onSave={handleSaveReport}
              onHistory={() => setIsHistoryOpen(!isHistoryOpen)}
              isHistoryOpen={isHistoryOpen}
              title="Informe Ejecutivo PESV — Plan Estratégico de Seguridad Vial"
              icon={<FileTextIcon className="h-5 w-5 text-teal-600 dark:text-teal-400" />}
              actions={
                <ExportDropdown
                  content={reportContent || ''}
                  fileName={`Informe_Ejecutivo_PESV_${new Date().toISOString().slice(0, 10)}`}
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
                    tags={['sgsst-matriz-pesv']}
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
                      Presiona <span className="font-bold text-teal-600">“Análisis PESV”</span> en
                      la barra superior para que la IA genere el Informe Ejecutivo del PESV con
                      auditorías de riesgo vial y controles recomendados.
                    </p>
                    <div className="mt-2 flex gap-4">
                      <button
                        type="button"
                        onClick={handleAnalyzeMatrix}
                        disabled={isAnalyzing || matrixRows.length === 0}
                        className="group flex h-10 items-center justify-center gap-2 rounded-xl border border-teal-600 bg-teal-600 px-4 py-2 text-sm font-bold text-white shadow-md transition-all duration-300 hover:bg-teal-700 disabled:opacity-50 sm:hover:-rotate-3 sm:hover:scale-105 cursor-pointer"
                      >
                        {isAnalyzing ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Sparkles className="h-4 w-4" />
                        )}
                        <span>{isAnalyzing ? 'Generando informe…' : 'Generar Informe con IA'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsHistoryOpen(true)}
                        className="group flex h-10 items-center justify-center gap-2 rounded-xl border border-border-medium bg-surface-primary px-4 py-2 text-sm font-bold text-text-primary shadow-sm transition-all duration-300 hover:bg-surface-hover sm:hover:-rotate-3 sm:hover:scale-105 cursor-pointer"
                      >
                        <History className="h-4 w-4" />
                        <span>Cargar desde Historial</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </CollapsibleReportBox>
          </div>
        </div>
      )}

      {/* ── 4. Informe Ejecutivo PESV Standalone en Modo Oficial ── */}
      {isOfficialApp && !isMaximized && (
        <div id="pesv-report-editor" className="mb-6">
          <CollapsibleReportBox
            onSave={handleSaveReport}
            onHistory={() => setIsHistoryOpen(!isHistoryOpen)}
            isHistoryOpen={isHistoryOpen}
            title="Informe Ejecutivo PESV — Plan Estratégico de Seguridad Vial (Res. 20223040040595)"
            icon={<FileTextIcon className="h-5 w-5 text-teal-600 dark:text-teal-400" />}
            actions={
              <ExportDropdown
                content={reportContent || ''}
                fileName={`Informe_Ejecutivo_PESV_${new Date().toISOString().slice(0, 10)}`}
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
                  tags={['sgsst-matriz-pesv']}
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
                    Presiona <span className="font-bold text-teal-600">“Generar IA”</span> en la
                    barra superior para que la IA elabore el Informe Ejecutivo del PESV con
                    evaluación de actores viales, causas de siniestralidad y planes de acción bajo
                    la Resolución 20223040040595.
                  </p>
                  <div className="mt-2 flex gap-4">
                    <button
                      type="button"
                      onClick={handleAnalyzeMatrix}
                      disabled={isAnalyzing || matrixRows.length === 0}
                      title="Generar Informe con IA"
                      className="group flex h-10 items-center justify-center gap-2 rounded-xl border border-teal-600 bg-teal-600 px-4 py-2 text-sm font-bold text-white shadow-md transition-all duration-300 hover:bg-teal-700 disabled:opacity-50 sm:hover:-rotate-3 sm:hover:scale-105 cursor-pointer"
                    >
                      {isAnalyzing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4" />
                      )}
                      <span>{isAnalyzing ? 'Generando informe…' : 'Generar Informe con IA'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsHistoryOpen(true)}
                      title="Cargar desde Historial"
                      className="group flex h-10 items-center justify-center gap-2 rounded-xl border border-border-medium bg-surface-primary px-4 py-2 text-sm font-bold text-text-primary shadow-sm transition-all duration-300 hover:bg-surface-hover sm:hover:-rotate-3 sm:hover:scale-105 cursor-pointer"
                    >
                      <History className="h-4 w-4" />
                      <span>Cargar desde Historial</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </CollapsibleReportBox>
        </div>
      )}

      {renderModals()}
    </div>
  );

  return isMaximized ? ReactDOM.createPortal(renderContent(), document.body) : renderContent();
}
