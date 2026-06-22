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
import MatrizPESVDashboard from './MatrizPESVDashboard';
import ModelSelector, { AI_MODELS } from './ModelSelector';
import ExportDropdown from './ExportDropdown';
import LiveEditor, { type LiveEditorHandle } from '~/components/Liva/Editor/LiveEditor';
import ReportHistory from '~/components/Liva/ReportHistory';
import CollapsibleReportBox from './CollapsibleReportBox';

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
        className="flex h-8 min-w-[160px] max-w-[220px] cursor-pointer items-center gap-1.5 rounded-xl border border-border-medium bg-surface-primary pl-3 pr-2 text-xs text-text-primary transition-all hover:border-sky-400 hover:bg-surface-secondary"
      >
        {selected ? (
          <span className="flex-1 truncate text-left font-semibold text-sky-600 dark:text-sky-400">
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
                ? 'bg-sky-50 font-bold text-sky-600 dark:bg-sky-900/20 dark:text-sky-400'
                : 'text-text-primary hover:bg-surface-secondary hover:text-sky-600 dark:hover:text-sky-400'
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
                  ? 'bg-sky-50 font-bold text-sky-600 dark:bg-sky-900/20 dark:text-sky-400'
                  : 'text-text-primary hover:bg-surface-secondary hover:text-sky-600 dark:hover:text-sky-400'
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
        className="absolute -bottom-1 right-0 flex items-center gap-1 text-[9px] font-bold text-sky-500 opacity-0 transition-opacity hover:text-sky-700 group-hover/cell:opacity-100"
        type="button"
      >
        <Sparkles className="h-3 w-3" /> IA
      </button>
      {open && (
        <div className="absolute right-0 top-full z-[150] mt-1 w-64 space-y-2 rounded-xl border border-border-medium bg-surface-primary p-3 shadow-2xl">
          <p className="text-[10px] font-bold uppercase text-text-secondary">{fieldLabel}</p>
          <input
            autoFocus
            className="w-full rounded-lg border border-border-medium bg-surface-primary px-2 py-1.5 text-xs outline-none focus:border-sky-400"
            placeholder="Instrucción (ej: hazlo más técnico)"
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && apply()}
          />
          <div className="flex gap-2">
            <button
              onClick={apply}
              disabled={loading}
              className="flex-1 rounded-lg bg-sky-500 py-1.5 text-[10px] font-bold text-white hover:bg-sky-600 disabled:opacity-50"
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

const toSentenceCase = (str: string): string => {
  if (!str) return '';
  const trimmed = str.trim();
  if (trimmed.length === 0) return '';
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
};

const getValueByKeys = (obj: any, aliases: string[]): string => {
  for (const alias of aliases) {
    if (obj[alias] !== undefined && obj[alias] !== null) {
      return String(obj[alias]).trim();
    }
    const foundKey = Object.keys(obj).find(
      (k) => k.toLowerCase().replace(/\s+/g, '') === alias.toLowerCase().replace(/\s+/g, '')
    );
    if (foundKey && obj[foundKey] !== undefined && obj[foundKey] !== null) {
      return String(obj[foundKey]).trim();
    }
  }
  return '';
};

export default function MatrizPESVTable({
  conversationId,
}: {
  conversationId: string | null;
}) {
  const { token } = useAuthContext();
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

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isPendingImport = useRef(false);
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
  const [filterActor, setFilterActor] = useState('');
  const [filterNivel, setFilterNivel] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [dashboardHeight, setDashboardHeight] = useState(25);
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

  const actualConvoId = conversationId || 'new';

  const fetchMatrixData = useCallback(async () => {
    if (!conversationId || conversationId === 'new') {
      setMatrixRows([]);
      setChartConclusions({});
      setReportContent(null);
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(`/api/sgsst/pesv-workspace/matrix/${conversationId}`, {
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
    } catch (err) {
      console.error('[MatrizPESV] Fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, token]);

  useEffect(() => {
    if (!conversationId || conversationId === 'new') {
      setMatrixRows([]);
      setChartConclusions({});
      setReportContent('');
      prevConvoIdRef.current = conversationId;
      return;
    }
    if (prevConvoIdRef.current !== conversationId) {
      prevConvoIdRef.current = conversationId;
      fetchMatrixData();
    }
  }, [conversationId, fetchMatrixData]);

  const saveMatrixData = async (updatedRows = matrixRows) => {
    if (!conversationId || conversationId === 'new') return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/sgsst/pesv-workspace/matrix/${conversationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          matrixRows: updatedRows,
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
      }
    } catch (err) {
      console.error('[MatrizPESV] Save error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCellChange = (idx: number, field: keyof MatrixRow, value: any) => {
    isDirtyRef.current = true;
    const updated = [...matrixRows];
    const item = { ...updated[idx], [field]: value };

    // Recalculamos Calificación (NP + NE + NC) y Nivel de Riesgo / Aceptabilidad
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
      observaciones: ''
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
        }
      }
    } catch (err) {
      console.error('[MatrizPESV] Row AI update error:', err);
    } finally {
      setAiRowLoading(null);
    }
  };

  const handleAnalyzeMatrix = async () => {
    setIsAnalyzing(true);
    setReportContent('');
    try {
      const res = await fetch('/api/sgsst/pesv-workspace/ai-analyze-matrix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          matrixRows,
          modelName: selectedModel,
          conversationId: actualConvoId,
        }),
      });
      if (!res.ok) {
        throw new Error('No se pudo generar el informe ejecutivo.');
      }
      const data = await res.json();
      if (data.analysis) {
        setReportContent(data.analysis);
        reportContentRef.current = data.analysis;
        setRefreshTrigger((prev) => prev + 1);
        await saveMatrixData(matrixRows);
      }
    } catch (err) {
      console.error('[PESV] Analyze error:', err);
      alert('Error al generar el informe ejecutivo del PESV.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSelectReport = (report: any) => {
    if (report && report.content) {
      setReportContent(report.content);
      reportContentRef.current = report.content;
      setReportConversationId(report.conversationId || null);
      setReportMessageId(report.messageId || null);
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
        alert(
          `¡Éxito! La IA de Wappy ha reconstruido y mapeado ${data.matrixRows.length} riesgos de tu matriz al formato oficial de Wappy PESV.`
        );
      } else {
        alert('No se pudieron recuperar filas procesadas.');
      }
    } catch (err: any) {
      console.error('[MatrizPESV] AI Import error:', err);
      alert(`Error en la reconstrucción con IA: ${err.message}`);
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
            const isStandard = (
              keys.some(k => k.toLowerCase().replace(/\s+/g, '') === 'grupotrabajo') &&
              keys.some(k => k.toLowerCase().replace(/\s+/g, '') === 'factorriesgo')
            );

            if (isStandard) {
              const combined = [...matrixRows, ...parsed];
              setMatrixRows(combined);
              saveMatrixData(combined);
              alert(`¡Se importaron ${parsed.length} riesgos exitosamente!`);
            } else {
              setPendingRawRows(parsed);
              setIsConfirmModalOpen(true);
            }
          }
        } else {
          const workbook = XLSX.read(data, { type: 'binary' });
          let targetSheetName = '';
          const sheetNames = workbook.SheetNames;
          
          targetSheetName = sheetNames.find(name => 
            name.toUpperCase().includes('3-MATRIZ') || 
            name.toUpperCase().includes('MATRIZ') || 
            name.toUpperCase().includes('PESV')
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

          // 1. Try index-based parsing by scanning for a header row in the first 25 rows
          const gridRows = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1 });
          if (gridRows.length === 0) {
            alert('El archivo Excel está vacío.');
            return;
          }

          let headerRowIdx = -1;
          for (let r = 0; r < Math.min(25, gridRows.length); r++) {
            const row = gridRows[r];
            if (Array.isArray(row) && row.some(cell => {
              const str = String(cell || '').toLowerCase().trim();
              return str.includes('grupo de trabajo') || str.includes('grupotrabajo') || str.includes('clasificacion grupos de trabajo') || str.includes('clasificación grupos de trabajo');
            })) {
              headerRowIdx = r;
              break;
            }
          }

          if (headerRowIdx !== -1) {
            // Build a dynamic column index map from the header row
            // This makes the importer work with ANY column order (Wappy exports or external files like ANSV 2022)
            const headerRow = gridRows[headerRowIdx];
            const colMap: Record<string, number> = {};
            headerRow.forEach((cell: any, idx: number) => {
              const key = String(cell || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
              if (key) colMap[key] = idx;
            });

            // Also check the sub-header row (row after header) for additional keywords
            let startDataRow = headerRowIdx + 1;
            const nextRow = gridRows[startDataRow] || [];
            const hasSubHeader = nextRow.some((cell: any) => {
              const str = String(cell || '').toLowerCase();
              return str.includes('peligros') || str.includes('probabilidad') || str.includes('exposicion') || str.includes('consecuencia') || str.includes('calificacion') || str.includes('individuo');
            });
            if (hasSubHeader) {
              // Merge sub-header into colMap (sub-header takes priority for its own cells)
              nextRow.forEach((cell: any, idx: number) => {
                const key = String(cell || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
                if (key && !colMap[key]) colMap[key] = idx;
              });
              startDataRow++;
            }

            // Helper: get cell value by trying multiple header name variants
            const getCol = (row: any[], ...keys: string[]): string => {
              for (const key of keys) {
                const k = key.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
                if (colMap[k] !== undefined) return String(row[colMap[k]] || '').trim();
              }
              return '';
            };
            // Helper: get cell by index fallback if colMap doesn't find it
            const getColOrIdx = (row: any[], fallbackIdx: number, ...keys: string[]): string => {
              const byKey = getCol(row, ...keys);
              if (byKey) return byKey;
              return String(row[fallbackIdx] || '').trim();
            };

            const mapped: MatrixRow[] = [];
            for (let r = startDataRow; r < gridRows.length; r++) {
              const row = gridRows[r];
              if (!row || row.every((cell: any) => cell === null || cell === undefined || String(cell).trim() === '')) {
                continue;
              }

              // Check if description or cargo is present to avoid importing fully empty placeholder rows
              const peligro_desc = getColOrIdx(row, 5, 'peligros', 'descripcion del peligro', 'peligro_descripcion', 'peligro');
              const cargo = getColOrIdx(row, 1, 'cargos individuales', 'cargo', 'cargos');
              if (!peligro_desc && !cargo) continue;

              // NP: try header names first, then fallbacks by index
              const np_cual = getColOrIdx(row, 6, 'nivel de probabilidad', 'np cualitativo', 'np_cualitativo', 'probabilidad');
              let np_cuant = Number(getColOrIdx(row, 7, 'np cuantitativo', 'np_cuantitativo')) || 0;
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

              const ne_cual = getColOrIdx(row, 8, 'nivel de exposicion', 'ne cualitativo', 'ne_cualitativo', 'exposicion');
              let ne_cuant = Number(getColOrIdx(row, 9, 'ne cuantitativo', 'ne_cuantitativo')) || 0;
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

              const nc_cual = getColOrIdx(row, 10, 'nivel de consecuencia', 'nc cualitativo', 'nc_cualitativo', 'consecuencia');
              let nc_cuant = Number(getColOrIdx(row, 11, 'nc cuantitativo', 'nc_cuantitativo')) || 0;
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

              // Normalize tipo_desplazamiento
              const rawDesp = getColOrIdx(row, 2, 'tipo de desplazamiento', 'tipo_desplazamiento', 'desplazamiento').toLowerCase();
              const tipo_desp: 'Misional' | 'In itinere' = rawDesp.includes('itinere') ? 'In itinere' : 'Misional';

              // Normalize rol_via
              const rawRol = getColOrIdx(row, 3, 'rol en la via', 'rol_via', 'rol en la vía', 'rol').toLowerCase();
              let rol: any = 'Peatón';
              if (rawRol.includes('motocicleta') || rawRol.includes('moto')) rol = 'Conductor de motocicleta';
              else if (rawRol.includes('pesado')) rol = 'Conductor de vehículo pesado';
              else if (rawRol.includes('liviano') || rawRol.includes('automovil') || rawRol.includes('carro')) rol = 'Conductor de vehículo liviano';
              else if (rawRol.includes('peaton') || rawRol.includes('peatón')) rol = 'Peatón';
              else if (rawRol.includes('pasajero')) rol = 'Pasajero';
              else if (rawRol.includes('ciclista') || rawRol.includes('bici')) rol = 'Ciclista';
              else if (rawRol.includes('otro')) rol = 'Otro';
              else {
                const matched = ACTORES_VIALES.find(v => v.toLowerCase().includes(rawRol) || rawRol.includes(v.toLowerCase()));
                if (matched) rol = matched;
              }

              // Normalize factor_riesgo
              const rawFactor = getColOrIdx(row, 4, 'factor de riesgo', 'factor_riesgo', 'identificacion', 'factor').toLowerCase();
              let factor: any = 'Factor Humano';
              if (rawFactor.includes('humano')) factor = 'Factor Humano';
              else if (rawFactor.includes('vehicular') || rawFactor.includes('vehiculo')) factor = 'Factor Vehicular';
              else if (rawFactor.includes('infraestructura')) factor = 'Factor Infraestructura';
              else if (rawFactor.includes('entorno') || rawFactor.includes('otros') || rawFactor.includes('otro')) factor = 'Entorno/Otros';

              // Controles existentes — may be before or after NP/NE/NC depending on file source
              const ctrl_desc = getColOrIdx(row, 15,
                'controles existentes', 'controles_existentes_descripcion', 'interpretacion',
                'diagnostico', 'diagnostico de controles', 'controles existentes / diagnostico');
              const ctrl_tipo = getColOrIdx(row, 16,
                'tipo de controles', 'controles_existentes_tipo', 'tipo controles',
                'tipo de control', 'controles');

              // Tratamiento / Acciones
              const tratamiento = getColOrIdx(row, 17,
                'acciones', 'tratamiento / accion', 'tratamiento_accion', 'accion de tratamiento',
                'tratamiento accion', 'tratamiento');

              // Planes de acción — try by name, then by common external indices
              const plan_medio = getColOrIdx(row, 18,
                'controles - medio', 'plan accion (medio)', 'plan_accion_medio', 'plan de accion medio', 'medio');
              const plan_vehiculo = getColOrIdx(row, 19,
                'controles - vehiculo', 'plan accion (vehiculo)', 'plan_accion_vehiculo', 'plan de accion vehiculo', 'vehiculo');
              const plan_individuo = getColOrIdx(row, 20,
                'cotroles - individuo', 'controles - individuo', 'plan accion (individuo)', 'plan_accion_individuo', 'plan de accion individuo', 'individuo');
              const plan_infra = getColOrIdx(row, 21,
                'controles - infraestructura', 'plan accion (infraestructura)', 'plan_accion_infraestructura', 'plan de accion infraestructura', 'infraestructura');

              // Responsable, fecha, estado, observaciones
              const responsable = getColOrIdx(row, 20, 'responsable');
              const fecha = getColOrIdx(row, 21, 'fecha programacion', 'fecha_programacion', 'fecha / periodicidad', 'fecha');
              const rawEstadoStr = getColOrIdx(row, 22, 'estado').toUpperCase();
              const est: any = rawEstadoStr.includes('CERRADA') ? 'CERRADA' : 'PLANEADA';
              const obs = getColOrIdx(row, 23, 'observaciones', 'observacion');

              mapped.push({
                id: Date.now().toString() + Math.random().toString(36).substring(7),
                grupo_trabajo: toSentenceCase(getColOrIdx(row, 0, 'clasificacion grupos de trabajo', 'clasificación grupos de trabajo', 'grupo de trabajo', 'grupo_trabajo') || 'General'),
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
              // No rows mapped — send all raw rows to AI for reconstruction
              const rawRowsForAI: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });
              if (rawRowsForAI.length === 0) {
                alert('El archivo Excel está vacío o no contiene datos.');
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
            alert(`¡Se importaron exitosamente ${mapped.length} riesgos viales desde el formato oficial!`);
            e.target.value = '';
            return;
          }

          // 2. Header row not found — use all rows of the sheet as raw input for AI
          const rawRowsForAI: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });
          if (rawRowsForAI.length === 0) {
            alert('El archivo Excel está vacío o no contiene datos reconocibles.');
            return;
          }
          setPendingRawRows(rawRowsForAI);
          setIsConfirmModalOpen(true);
          e.target.value = '';
          return;
        }
      } catch (err) {
        console.error('[PESV] Import parsing error:', err);
        alert('Error al leer el archivo. Revisa el formato.');
      }
    };

    if (file.name.endsWith('.json')) {
      reader.readAsText(file);
    } else {
      reader.readAsBinaryString(file);
    }
  };

  const handleExportExcel = () => {
    const dataToExport = matrixRows.map((r) => ({
      'Grupo de Trabajo': r.grupo_trabajo,
      'Cargo': r.cargo,
      'Tipo de Desplazamiento': r.tipo_desplazamiento,
      'Rol en la Vía': r.rol_via,
      'Factor de Riesgo': r.factor_riesgo,
      'Descripción del Peligro': r.peligro_descripcion,
      'Controles Existentes': r.controles_existentes_descripcion,
      'Tipo de Controles': r.controles_existentes_tipo,
      'NP Cualitativo': r.np_cualitativo,
      'NP Cuantitativo': r.np_cuantitativo,
      'NE Cualitativo': r.ne_cualitativo,
      'NE Cuantitativo': r.ne_cuantitativo,
      'NC Cualitativo': r.nc_cualitativo,
      'NC Cuantitativo': r.nc_cuantitativo,
      'Calificación': r.calificacion,
      'Nivel de Riesgo': r.nivel_riesgo,
      'Aceptabilidad': r.aceptabilidad,
      'Tratamiento / Acción': r.tratamiento_accion,
      'Plan Acción (Medio)': r.plan_accion_medio,
      'Plan Acción (Vehículo)': r.plan_accion_vehiculo,
      'Plan Acción (Individuo)': r.plan_accion_individuo,
      'Plan Acción (Infraestructura)': r.plan_accion_infraestructura,
      'Responsable': r.responsable,
      'Fecha / Periodicidad': r.fecha_programacion,
      'Estado': r.estado,
      'Observaciones': r.observaciones
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'PESV Matrix');
    XLSX.writeFile(wb, `Matriz_PESV_Wappy_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleExportTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      {
        'Grupo de Trabajo': 'Operativo',
        'Cargo': 'Conductor de reparto',
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
        'Calificación': 9,
        'Nivel de Riesgo': 'NIVEL DE RIESGO MEDIO o MODERADO',
        'Aceptabilidad': 'ACEPTABLE CON CONTROL ESPECIFICO',
        'Tratamiento / Acción': 'MODIFICAR LOS FACTORES DE EXPOSICION',
        'Plan Acción (Medio)': 'Definir pausas activas obligatorias cada 2 horas de trayecto',
        'Plan Acción (Vehículo)': 'Ninguno',
        'Plan Acción (Individuo)': 'Implementar checklist preoperacional de fatiga y sueño',
        'Plan Acción (Infraestructura)': 'Ninguno',
        'Responsable': 'Responsable PESV',
        'Fecha / Periodicidad': 'Permanente',
        'Estado': 'PLANEADA',
        'Observaciones': 'Revisión semestral'
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
          row.observaciones
        ].some((f) => f?.toLowerCase().includes(q)),
      );
    }
    if (filterProceso) rows = rows.filter(({ row }) => row.grupo_trabajo === filterProceso || row.cargo === filterProceso);
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
  }, [matrixRows, filterText, filterProceso, filterActor, filterNivel, sortField, sortDir]);

  const paginatedRows = useMemo(() => {
    const startIdx = (currentPage - 1) * pageSize;
    const endIdx = startIdx + pageSize;
    return displayRows.slice(startIdx, endIdx);
  }, [displayRows, currentPage, pageSize]);

  const procesosUnicos = useMemo(() => {
    const set = new Set<string>();
    matrixRows.forEach(r => {
      if (r.grupo_trabajo) set.add(r.grupo_trabajo);
      if (r.cargo) set.add(r.cargo);
    });
    return Array.from(set).filter(Boolean);
  }, [matrixRows]);

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

  const getCriticidadLabel = (nr: number) => {
    if (nr >= 200) return { text: 'text-red-700 dark:text-red-400 font-bold', label: '🔴 CRÍTICO' };
    if (nr >= 100) return { text: 'text-orange-600 dark:text-orange-400 font-bold', label: '🟠 ALTO' };
    if (nr >= 40) return { text: 'text-yellow-600 dark:text-yellow-400 font-bold', label: '🟡 MEDIO' };
    return { text: 'text-green-600 dark:text-green-400 font-bold', label: '🟢 BAJO' };
  };

  const renderModals = () => (
    <>
      {isAiImportLoading && (
        <div className="fixed inset-0 z-[999999] flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-md">
          <div className="flex flex-col items-center gap-6 rounded-3xl border border-sky-500/20 bg-surface-secondary/90 p-8 shadow-2xl">
            <div className="relative flex h-16 w-16 items-center justify-center">
              <div className="absolute inset-0 animate-ping rounded-full bg-sky-500/20" />
              <div className="absolute inset-2 animate-pulse rounded-full bg-sky-500/40" />
              <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-text-primary">Adaptando Matriz PESV con IA</h3>
              <p className="mt-2 text-sm text-text-secondary max-w-xs">
                Nuestra IA está mapeando las columnas y recalculando los niveles de criticidad vial para adaptarlos al formato oficial del PESV. Esto puede tomar unos segundos...
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
                Hemos detectado que el archivo cargado no coincide con el formato estándar de Wappy PESV.
              </p>
              <p className="mt-2 text-sm leading-relaxed text-text-secondary font-medium">
                ¿Deseas que la IA de Wappy analice y adapte automáticamente tu matriz para que encaje con nuestro formato oficial de seguridad vial?
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
                className="flex-1 rounded-xl bg-sky-600 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-sky-700"
              >
                Sí, usar IA
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  // ── Guard: no convo ──
  if ((!actualConvoId || actualConvoId === 'new') && matrixRows.length === 0) {
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
          Envía el primer mensaje en el chat del Experto en Riesgo Vial para instanciar la matriz PESV. Los peligros viales se guardarán automáticamente aquí.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex transform items-center justify-center gap-2 rounded-xl border border-sky-500/20 bg-sky-500/10 px-6 py-2.5 font-bold text-sky-600 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-sky-500 hover:text-white"
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

  const renderContent = () => (
    <div
      ref={containerRef}
      className={`flex h-full flex-col border-l border-border-light transition-colors duration-300 ${isMaximized ? 'fixed inset-0 z-[999999] m-0 h-screen w-screen rounded-none bg-surface-primary shadow-2xl' : 'w-full bg-surface-primary'}`}
    >
      {/* ── Toolbar / Header ── */}
      <div
        className="relative z-[300] flex min-w-0 shrink-0 items-center justify-between overflow-visible border-b border-border-light bg-surface-secondary px-4"
        style={{ minHeight: '4rem' }}
      >
        <div className="mr-2 flex min-w-0 flex-shrink items-center gap-3 overflow-hidden text-ellipsis">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-sky-500/20 bg-sky-500/10 text-sky-600 shadow-sm">
            <Truck className="h-5 w-5" />
          </div>
          <div className="min-w-0 overflow-hidden">
            <h2 className="truncate text-sm font-semibold text-text-primary">Matriz PESV Live</h2>
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
            className="group flex h-10 min-w-[40px] flex-shrink-0 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-sky-500/40 bg-surface-primary px-2.5 text-sky-600 shadow-sm outline-none transition-all duration-300 hover:-rotate-3 hover:scale-105 hover:bg-sky-50 dark:text-sky-400 dark:hover:bg-sky-900/20"
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
              {isAnalyzing ? 'Generando…' : 'Análisis PESV'}
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

          {/* Exportar */}
          <ExportDropdown
            content={reportContent || ''}
            fileName={`Informe_PESV_Wappy_${new Date().toISOString().slice(0, 10)}`}
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

      {/* ── Barra de Filtros ── */}
      <div className="relative z-[200] flex shrink-0 flex-wrap items-center gap-2 border-b border-border-light bg-surface-secondary px-4 py-2.5">
        <div className="relative">
          <input
            type="search"
            placeholder="Buscar en la matriz…"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="h-8 min-w-[170px] rounded-xl border border-border-medium bg-surface-primary pl-7 pr-3 text-xs outline-none transition-colors placeholder:text-text-secondary focus:border-sky-400"
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
        {(filterText || filterProceso || filterActor || filterNivel) && (
          <button
            onClick={() => {
              setFilterText('');
              setFilterProceso('');
              setFilterActor('');
              setFilterNivel('');
            }}
            className="flex h-8 cursor-pointer items-center gap-1 rounded-xl border border-red-200 bg-red-50 px-3 text-xs font-medium text-red-600 transition-colors hover:bg-red-100 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400"
          >
            ✕ Limpiar
            <span className="rounded-full bg-red-600 px-1.5 py-0.5 text-[9px] font-black text-white">
              {[filterText, filterProceso, filterActor, filterNivel].filter(Boolean).length}
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
            background: #0ea5e9;
          }
          .dark .custom-scrollbar-ipevar::-webkit-scrollbar-thumb:hover {
            background: #0284c7;
          }
        `}</style>
        {matrixRows.length === 0 && !isLoading ? (
          <div className="flex h-48 flex-col items-center justify-center gap-3 text-text-secondary">
            <Truck className="h-10 w-10 opacity-20" />
            <p className="px-4 text-center text-sm">
              Aún no hay riesgos en la matriz PESV. Pídele al Experto en Riesgo Vial en el chat que los registre o añádelos manualmente.
            </p>
            <button
              onClick={addRow}
              className="mt-2 flex items-center gap-2 rounded-xl bg-sky-600 px-6 py-2.5 font-bold text-white shadow-md transition-colors hover:-translate-y-0.5 hover:bg-sky-700"
            >
              <Plus className="h-5 w-5" /> Añadir Primer Riesgo Vial
            </button>
          </div>
        ) : (
          <div className="min-w-max">
            <table className="w-full border-collapse text-xs">
              <thead className="sticky top-0 z-[100] bg-surface-secondary text-xs font-bold uppercase tracking-wide text-text-secondary border-b border-border-medium">
                <tr>
                  <th
                    className="min-w-[150px] cursor-pointer px-4 py-3 text-left hover:text-sky-600"
                    onClick={() => toggleSort('grupo_trabajo')}
                  >
                    GRUPO TRABAJO <SortIcon field="grupo_trabajo" />
                  </th>
                  <th
                    className="min-w-[150px] cursor-pointer px-4 py-3 text-left hover:text-sky-600"
                    onClick={() => toggleSort('cargo')}
                  >
                    CARGO <SortIcon field="cargo" />
                  </th>
                  <th className="min-w-[140px] px-4 py-3 text-center">DESPLAZAMIENTO</th>
                  <th className="min-w-[180px] px-4 py-3 text-left">ROL EN LA VÍA</th>
                  <th className="min-w-[160px] px-4 py-3 text-left">FACTOR RIESGO</th>
                  <th className="min-w-[220px] border-l-2 border-sky-500/20 px-4 py-3 text-left">DESCRIPCIÓN PELIGRO</th>
                  
                  {/* Controles Existentes */}
                  <th className="min-w-[200px] border-l-2 border-blue-500/20 px-4 py-3 text-left text-blue-700 dark:text-blue-400">CONTROLES EXISTENTES</th>
                  <th className="min-w-[160px] px-4 py-3 text-left text-blue-700 dark:text-blue-400">TIPO CONTROLES</th>
                  
                  {/* Evaluación cualitativa / cuantitativa */}
                  <th className="min-w-[160px] border-l-2 border-purple-500/20 px-4 py-3 text-center text-purple-700 dark:text-purple-400">NP CUALITATIVO</th>
                  <th className="min-w-[80px] px-4 py-3 text-center text-purple-700 dark:text-purple-400">NP CUANT</th>
                  <th className="min-w-[160px] px-4 py-3 text-center text-purple-700 dark:text-purple-400">NE CUALITATIVO</th>
                  <th className="min-w-[80px] px-4 py-3 text-center text-purple-700 dark:text-purple-400">NE CUANT</th>
                  <th className="min-w-[160px] px-4 py-3 text-center text-purple-700 dark:text-purple-400">NC CUALITATIVO</th>
                  <th className="min-w-[80px] px-4 py-3 text-center text-purple-700 dark:text-purple-400">NC CUANT</th>
                  
                  <th className="min-w-[85px] cursor-pointer border-l-2 border-orange-500/20 px-4 py-3 text-center text-orange-700 hover:text-orange-500 dark:text-orange-400" onClick={() => toggleSort('calificacion')}>CALIF <SortIcon field="calificacion" /></th>
                  <th className="min-w-[140px] border-l border-border-light px-4 py-3 text-center text-slate-700 dark:text-slate-400">NIVEL RIESGO</th>
                  <th className="min-w-[160px] border-l border-border-light px-4 py-3 text-center text-slate-700 dark:text-slate-400">ACEPTABILIDAD</th>
                  
                  <th className="min-w-[180px] border-l border-border-light px-4 py-3 text-left text-blue-700 dark:text-blue-400">TRATAMIENTO ACCIÓN</th>
                  
                  {/* Plan de Acción */}
                  <th className="min-w-[200px] border-l-2 border-emerald-500/20 px-4 py-3 text-left text-emerald-700 dark:text-emerald-400">PLAN ACCIÓN (MEDIO)</th>
                  <th className="min-w-[200px] px-4 py-3 text-left text-emerald-700 dark:text-emerald-400">PLAN ACCIÓN (VEHÍCULO)</th>
                  <th className="min-w-[200px] px-4 py-3 text-left text-emerald-700 dark:text-emerald-400">PLAN ACCIÓN (INDIVIDUO)</th>
                  <th className="min-w-[200px] px-4 py-3 text-left text-emerald-700 dark:text-emerald-400">PLAN ACCIÓN (INFRAESTRUCTURA)</th>
                  
                  <th className="min-w-[160px] border-l border-border-light px-4 py-3 text-left">RESPONSABLE</th>
                  <th className="min-w-[140px] px-4 py-3 text-left">FECHA / PERIODICIDAD</th>
                  <th className="min-w-[130px] px-4 py-3 text-center">ESTADO</th>
                  <th className="min-w-[220px] px-4 py-3 text-left">OBSERVACIONES</th>
                  <th className="sticky right-0 z-[200] min-w-[100px] border-l border-border-light bg-surface-secondary px-4 py-3 text-center shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.06)]">ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRows.map(({ row, idx }) => {
                  const crit = getCriticidadLabel(row.calificacion || 0);

                  return (
                    <tr
                      key={row.id || idx}
                      className="hover:bg-surface-secondary/50 group border-b border-border-light transition-colors"
                    >
                      {/* Grupo Trabajo */}
                      <td className="px-4 py-3">
                        <textarea
                          rows={2}
                          className="w-full min-w-[140px] resize border-transparent bg-transparent outline-none focus:border-transparent focus:outline-none focus:ring-0 dark:text-gray-200"
                          value={row.grupo_trabajo || ''}
                          onChange={(e) => handleCellChange(idx, 'grupo_trabajo', e.target.value)}
                        />
                      </td>

                      {/* Cargo */}
                      <td className="px-4 py-3">
                        <textarea
                          rows={2}
                          className="w-full min-w-[140px] resize border-transparent bg-transparent outline-none focus:border-transparent focus:outline-none focus:ring-0 dark:text-gray-200"
                          value={row.cargo || ''}
                          onChange={(e) => handleCellChange(idx, 'cargo', e.target.value)}
                        />
                      </td>

                      {/* Tipo Desplazamiento */}
                      <td className="px-4 py-3 text-center">
                        <select
                          className="border-transparent bg-transparent text-xs outline-none focus:border-transparent focus:outline-none focus:ring-0 dark:text-gray-200 cursor-pointer font-medium"
                          value={row.tipo_desplazamiento || 'Misional'}
                          onChange={(e) => handleCellChange(idx, 'tipo_desplazamiento', e.target.value)}
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
                            <option key={a} value={a}>{a}</option>
                          ))}
                        </select>
                      </td>

                      {/* Factor Riesgo */}
                      <td className="px-4 py-3">
                        <select
                          className="w-full min-w-[140px] border-transparent bg-transparent text-xs outline-none focus:border-transparent focus:outline-none focus:ring-0 dark:text-gray-200 cursor-pointer"
                          value={row.factor_riesgo || 'Factor Humano'}
                          onChange={(e) => handleCellChange(idx, 'factor_riesgo', e.target.value)}
                        >
                          {FACTORES_RIESGO.map((fr) => (
                            <option key={fr} value={fr}>{fr}</option>
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
                          onChange={(v) => handleCellChange(idx, 'controles_existentes_descripcion', v)}
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
                          onChange={(e) => handleCellChange(idx, 'controles_existentes_tipo', e.target.value)}
                        >
                          {CONTROLES_TIPO_OPCIONES.map((o) => (
                            <option key={o} value={o}>{o}</option>
                          ))}
                        </select>
                      </td>

                      {/* NP Cualitativo */}
                      <td className="border-l border-border-light bg-purple-500/5 px-4 py-3 text-center">
                        <select
                          className="w-full min-w-[140px] border-transparent bg-transparent text-xs outline-none focus:border-transparent focus:outline-none focus:ring-0 dark:text-gray-200 cursor-pointer font-semibold text-purple-700 dark:text-purple-400"
                          value={row.np_cualitativo || 'PROBABLE'}
                          onChange={(e) => handleCellChange(idx, 'np_cualitativo', e.target.value)}
                        >
                          {NP_CUALITATIVO_OPCIONES.map((opt) => (
                            <option key={opt.label} value={opt.label} title={opt.desc}>{opt.label}</option>
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
                          onChange={(e) => handleCellChange(idx, 'ne_cualitativo', e.target.value)}
                        >
                          {NE_CUALITATIVO_OPCIONES.map((opt) => (
                            <option key={opt.label} value={opt.label} title={opt.desc}>{opt.label}</option>
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
                          onChange={(e) => handleCellChange(idx, 'nc_cualitativo', e.target.value)}
                        >
                          {NC_CUALITATIVO_OPCIONES.map((opt) => (
                            <option key={opt.label} value={opt.label} title={opt.desc}>{opt.label}</option>
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
                          const color = val.includes('ALTO') || val.includes('CRITICO') || val.includes('CRÍTICO')
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300'
                            : val.includes('MEDIO') || val.includes('MODERADO')
                              ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300'
                              : 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300';
                          return (
                            <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wider ${color}`}>
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
                            <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wider ${color}`}>
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
                          onChange={(e) => handleCellChange(idx, 'tratamiento_accion', e.target.value)}
                        >
                          {TRATAMIENTO_ACCION_OPCIONES.map((o) => (
                            <option key={o} value={o}>{o}</option>
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
                          onChange={(v) => handleCellChange(idx, 'plan_accion_infraestructura', v)}
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
                          className="w-full min-w-[140px] resize border-transparent bg-transparent outline-none focus:border-transparent focus:outline-none focus:ring-0 dark:text-gray-200"
                          value={row.responsable || ''}
                          onChange={(e) => handleCellChange(idx, 'responsable', e.target.value)}
                        />
                      </td>

                      {/* Fecha / Periodicidad */}
                      <td className="px-4 py-3">
                        <textarea
                          rows={2}
                          className="w-full min-w-[140px] resize border-transparent bg-transparent outline-none focus:border-transparent focus:outline-none focus:ring-0 dark:text-gray-200"
                          value={row.fecha_programacion || ''}
                          onChange={(e) => handleCellChange(idx, 'fecha_programacion', e.target.value)}
                        />
                      </td>

                      {/* Estado */}
                      <td className="px-4 py-3 text-center">
                        <select
                          className="border-transparent bg-transparent text-xs outline-none focus:border-transparent focus:outline-none focus:ring-0 dark:text-gray-200 cursor-pointer font-semibold"
                          value={row.estado || 'PLANEADA'}
                          onChange={(e) => handleCellChange(idx, 'estado', e.target.value)}
                        >
                          {ESTADO_OPCIONES.map((o) => (
                            <option key={o} value={o}>{o || 'Ninguno'}</option>
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
        <div className="border-t border-border-light bg-surface-tertiary px-4 py-2 flex items-center justify-between">
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
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="rounded-md border border-border-medium bg-surface-secondary px-2.5 py-1 hover:bg-surface-tertiary disabled:opacity-40 transition-all font-medium disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <span className="px-2">
                Página <strong>{currentPage}</strong> de {Math.ceil(displayRows.length / pageSize) || 1} (Total: {displayRows.length} riesgos)
              </span>
              <button
                disabled={currentPage >= Math.ceil(displayRows.length / pageSize)}
                onClick={() => setCurrentPage(prev => Math.min(Math.ceil(displayRows.length / pageSize), prev + 1))}
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
                  className="rounded-md border border-border-medium bg-surface-secondary px-1.5 py-0.5 outline-none focus:ring-1 focus:ring-sky-500 font-medium"
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

      {/* ── Dashboard analítico y Resizer ── */}
      <div
        onMouseDown={startDrag}
        onTouchStart={startDrag}
        className="group/resizer relative z-20 flex h-4 shrink-0 cursor-row-resize touch-none items-center justify-center border-y border-border-light bg-surface-tertiary transition-colors hover:bg-sky-500/20"
      >
        <div className="h-1 w-12 rounded-full bg-border-heavy group-hover/resizer:bg-sky-500/50" />
      </div>

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

        {/* ── Informe Ejecutivo PESV (LiveEditor) ── */}
        <div id="pesv-report-editor" className="mb-4 mt-6">
          <CollapsibleReportBox
            onHistory={() => setIsHistoryOpen(!isHistoryOpen)}
            isHistoryOpen={isHistoryOpen}
            title="Matriz PESV — Plan Estratégico de Seguridad Vial"
            icon={<FileTextIcon className="h-5 w-5 text-sky-600 dark:text-sky-400" />}
            actions={
              <ExportDropdown
                content={reportContent || ''}
                fileName="Informe_Ejecutivo_PESV"
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
                    Presiona <span className="font-bold text-sky-600">“Análisis PESV”</span> en la barra superior para que la IA genere el Informe Ejecutivo del PESV con auditorías de riesgo y controles recomendados.
                  </p>
                  <div className="mt-2 flex gap-4">
                    <button
                      onClick={handleAnalyzeMatrix}
                      disabled={isAnalyzing || matrixRows.length === 0}
                      className="flex items-center gap-2 rounded-xl border border-sky-400 bg-sky-50 px-4 py-2 text-sm font-bold text-sky-700 transition-colors hover:bg-sky-100 disabled:opacity-50 dark:bg-sky-900/20 dark:text-sky-300"
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
