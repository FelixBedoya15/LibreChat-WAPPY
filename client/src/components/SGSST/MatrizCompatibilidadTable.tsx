import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useAuthContext } from '~/hooks';
import { useRecoilValue, useRecoilState } from 'recoil';
import { useToastContext } from '@librechat/client';
import store from '~/store';
import {
  Beaker,
  Plus,
  Trash2,
  Save,
  Loader2,
  Maximize2,
  Minimize2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Upload,
  Check,
  AlertTriangle,
  FileText as FileTextIcon,
  Info,
  Pin,
  CheckSquare,
  RefreshCw,
  Grid
} from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  MatrixRow,
  CLASES_ONU,
  ESTADO_OPCIONES,
  SGA_PICTOGRAMS,
  getChemicalCompatibility
} from './MatrizCompatibilidadConstants';
import { exportCompatibilidadToExcel } from './exportCompatibilidad';
import MatrizCompatibilidadDashboard from './MatrizCompatibilidadDashboard';
import ModelSelector, { AI_MODELS } from './ModelSelector';
import ExportDropdown from './ExportDropdown';
import LiveEditor, { type LiveEditorHandle } from '~/components/Liva/Editor/LiveEditor';
import ReportHistory from '~/components/Liva/ReportHistory';
import SGSSTToolbar from './SGSSTToolbar';
import CollapsibleReportBox from './CollapsibleReportBox';

const PICTOGRAMAS_SGA_LIST = SGA_PICTOGRAMS;

const DUMMY_CHEMICAL_ROWS: MatrixRow[] = [
  {
    id: 'dummy-chem-1',
    nombre: 'Hipoclorito de sodio al 13%',
    fabricante: 'Químicos del Cauca S.A.S.',
    estado_fisico: 'Líquido',
    clasificacion_onu: 'Clase 8: Sustancias Corrosivas',
    pictogramas_sga: ['corrosivo', 'medio_ambiente'],
    cantidad_almacenada: '60 Galones',
    ubicacion: 'Bodega de Aseo y Desinfección',
    tiene_fds: 'Sí',
    tiene_rotulo: 'Sí',
    incompatibilidades: 'Ácidos fuertes (libera gas cloro altamente tóxico), amoníaco, agentes reductores y metales.',
    requisitos_almacenamiento: 'Almacenar sobre estiba plástica antiderrame, envase opaco cerrado, ventilación natural y lejos de ácidos.'
  },
  {
    id: 'dummy-chem-2',
    nombre: 'Ácido clorhídrico (ácido muriático) 33%',
    fabricante: 'Sucroal S.A.',
    estado_fisico: 'Líquido',
    clasificacion_onu: 'Clase 8: Sustancias Corrosivas',
    pictogramas_sga: ['corrosivo', 'signo_exclamacion'],
    cantidad_almacenada: '25 Galones',
    ubicacion: 'Bodega de Mantenimiento',
    tiene_fds: 'Sí',
    tiene_rotulo: 'No',
    incompatibilidades: 'Hipocloritos, bases fuertes (hidróxido de sodio), metales activos (genera hidrógeno inflamable).',
    requisitos_almacenamiento: 'Segregar de bases e hipocloritos mediante gabinete anticorrosivo con bandeja de contención al 110%.'
  },
  {
    id: 'dummy-chem-3',
    nombre: 'Thinner acrílico industrial',
    fabricante: 'Pintuco / Orbis',
    estado_fisico: 'Líquido',
    clasificacion_onu: 'Clase 3: Líquidos Inflamables',
    pictogramas_sga: ['inflamable', 'peligro_salud', 'signo_exclamacion'],
    cantidad_almacenada: '40 Galones',
    ubicacion: 'Almacén de Pinturas y Solventes',
    tiene_fds: 'Sí',
    tiene_rotulo: 'Sí',
    incompatibilidades: 'Sustancias comburentes (peróxidos, nitratos), ácidos fuertes y fuentes de ignición o chispas.',
    requisitos_almacenamiento: 'Gabinete certificado FM para líquidos inflamables con puesta a tierra, extintor multipropósito ABC y ventilación mecánica.'
  },
  {
    id: 'dummy-chem-4',
    nombre: 'Peróxido de hidrógeno al 50%',
    fabricante: 'Evonik / Brenntag',
    estado_fisico: 'Líquido',
    clasificacion_onu: 'Clase 5.1: Sustancias Comburentes',
    pictogramas_sga: ['comburente', 'corrosivo'],
    cantidad_almacenada: '15 Garrafas (300 Kg)',
    ubicacion: 'Bodega Planta de Tratamiento',
    tiene_fds: 'No',
    tiene_rotulo: 'Sí',
    incompatibilidades: 'Líquidos inflamables (solventes, thinner), materia orgánica, metales pesados y agentes reductores.',
    requisitos_almacenamiento: 'Aislar estrictamente de inflamables y combustibles (distancia mínima 3m o muro cortafuego), envases con válvula de venteo.'
  },
  {
    id: 'dummy-chem-5',
    nombre: 'Hidróxido de sodio en escamas (soda cáustica)',
    fabricante: 'Brinsa S.A.',
    estado_fisico: 'Sólido',
    clasificacion_onu: 'Clase 8: Sustancias Corrosivas',
    pictogramas_sga: ['corrosivo'],
    cantidad_almacenada: '8 Bultos (200 Kg)',
    ubicacion: 'Bodega Planta de Tratamiento',
    tiene_fds: 'Sí',
    tiene_rotulo: 'Sí',
    incompatibilidades: 'Ácidos fuertes (reacción exotérmica violenta), agua en contacto directo masivo, aluminio y zinc.',
    requisitos_almacenamiento: 'Almacenar en lugar seco sobre estiba plástica, separado de ácidos por compartimento estanco, ducha lavaojos a menos de 10 segundos.'
  }
];

const DropdownSelect = ({
  value,
  onChange,
  options,
  placeholder = 'Seleccionar...',
}: {
  value: string;
  onChange: (val: string) => void;
  options: string[];
  placeholder?: string;
}) => {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      const handleScroll = () => setOpen(false);
      window.addEventListener('scroll', handleScroll, true);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        window.removeEventListener('scroll', handleScroll, true);
      };
    }
  }, [open]);

  const toggleOpen = () => {
    if (!open && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + 4,
        left: rect.left,
        width: Math.max(rect.width, 220),
      });
    }
    setOpen(!open);
  };

  return (
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        onClick={toggleOpen}
        className="flex w-full items-center justify-between rounded-xl border border-border-medium bg-surface-primary px-2.5 py-1.5 text-left text-xs text-text-primary hover:bg-surface-hover focus:outline-none"
      >
        <span className="truncate">{value || placeholder}</span>
        <ChevronDown className="h-3.5 w-3.5 opacity-60 shrink-0 ml-1" />
      </button>
      {open &&
        createPortal(
          <div
            style={{ top: coords.top, left: coords.left, width: coords.width }}
            className="fixed z-[99999] max-h-60 overflow-auto rounded-xl border border-border-medium bg-surface-primary p-1 shadow-xl"
          >
            {options.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  onChange(opt);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors ${
                  value === opt
                    ? 'bg-teal-500/10 font-semibold text-teal-600 dark:text-teal-400'
                    : 'text-text-primary hover:bg-surface-secondary'
                }`}
              >
                <span className="truncate">{opt}</span>
                {value === opt && <Check className="h-3 w-3 shrink-0" />}
              </button>
            ))}
          </div>,
          document.body
        )}
    </div>
  );
};

const PictogramsSelect = ({
  selected = [],
  onChange,
}: {
  selected: string[];
  onChange: (val: string[]) => void;
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const togglePic = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter(i => i !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  return (
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex min-h-[30px] w-full flex-wrap items-center gap-1 rounded-xl border border-border-medium bg-surface-primary px-2 py-1 text-left text-xs text-text-primary hover:bg-surface-hover"
      >
        {selected.length === 0 ? (
          <span className="text-text-secondary opacity-60">Ninguno</span>
        ) : (
          selected.map(id => {
            const pic = PICTOGRAMAS_SGA_LIST.find(p => p.id === id);
            return (
              <span
                key={id}
                title={pic?.name || id}
                className="inline-flex items-center gap-1 rounded bg-red-500/10 px-1.5 py-0.5 text-[10px] font-medium text-red-600 dark:text-red-400 border border-red-500/20"
              >
                {pic?.icon} {pic?.name || id}
              </span>
            );
          })
        )}
      </button>

      {open && (
        <div className="absolute left-0 z-[9999] mt-1 w-56 rounded-xl border border-border-medium bg-surface-primary p-2 shadow-xl">
          <div className="mb-1 text-[10px] font-bold uppercase text-text-secondary px-1">Pictogramas SGA</div>
          {PICTOGRAMAS_SGA_LIST.map((pic) => {
            const isSelected = selected.includes(pic.id);
            return (
              <button
                key={pic.id}
                type="button"
                onClick={() => togglePic(pic.id)}
                className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition-colors ${
                  isSelected
                    ? 'bg-red-500/10 font-bold text-red-600 dark:text-red-400'
                    : 'text-text-primary hover:bg-surface-secondary'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  readOnly
                  className="rounded border-border-medium text-teal-600 focus:ring-0"
                />
                <span className="text-sm">{pic.icon}</span>
                <span>{pic.name}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default function MatrizCompatibilidadTable({
  conversationId,
  isOfficialApp = false,
  onRefreshOfficialList,
}: {
  conversationId: string | null;
  isOfficialApp?: boolean;
  onRefreshOfficialList?: () => void;
}) {
  const { token } = useAuthContext();
  const isSubmitting = useRecoilValue(store.isSubmittingFamily(0));
  const { showToast } = useToastContext();

  const [activeTab, setActiveTab] = useState<'inventario' | 'matriz_cruzada' | 'dashboard' | 'reporte'>('inventario');
  const [officialSubView, setOfficialSubView] = useState<'inventario' | 'matriz_cruzada'>('inventario');
  const [isTableCollapsed, setIsTableCollapsed] = useState(false);
  const [isDashboardCollapsed, setIsDashboardCollapsed] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const [matrixRows, setMatrixRows] = useState<MatrixRow[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(50);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPromoting, setIsPromoting] = useState(false);
  const [isSyncingKanban, setIsSyncingKanban] = useState(false);
  const [isSyncingHito5, setIsSyncingHito5] = useState(false);
  const [aiRowLoading, setAiRowLoading] = useState<number | null>(null);
  
  // Analítica & Reporte
  const [selectedModel, setSelectedModel] = useState(AI_MODELS[0].id);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [reportContent, setReportContent] = useState<string>('');
  const [chartConclusions, setChartConclusions] = useState<Record<string, string>>({});
  const editorRef = useRef<LiveEditorHandle>(null);

  // Maximizar
  const [isMaximized, setIsMaximized] = useRecoilState(store.chemicalCompatibilityMaximized);

  // Estado Modal Importar Excel
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [pendingRawRows, setPendingRawRows] = useState<any[]>([]);
  const [isAiImportLoading, setIsAiImportLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Detalle Celda Grid Cruzado
  const [selectedCrossCell, setSelectedCrossCell] = useState<{
    prodA: MatrixRow;
    prodB: MatrixRow;
    result: any;
  } | null>(null);

  const fetchMatrix = useCallback(async () => {
    if (!conversationId || conversationId === 'new') {
      setMatrixRows([]);
      setChartConclusions({});
      setReportContent('');
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(`/api/sgsst/chemical-compatibility/matrix/${conversationId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMatrixRows(data.matrixRows || []);
        setChartConclusions(data.chartConclusions || {});
        if (data.reportHtml) {
          setReportContent(data.reportHtml);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, token]);

  useEffect(() => {
    fetchMatrix();
  }, [fetchMatrix]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSubmitting) {
      if (conversationId && conversationId !== 'new') {
        interval = setInterval(() => fetchMatrix(), 3000);
      }
    }
    if (!isSubmitting) {
      if (conversationId && conversationId !== 'new') {
        fetchMatrix();
      }
    }
    return () => clearInterval(interval);
  }, [isSubmitting, conversationId, fetchMatrix]);

  // Guardar Matriz en Backend
  const saveMatrix = async (rowsToSave = matrixRows, notify = true, customReportHtml?: string) => {
    if (!conversationId) return;
    setIsSaving(true);
    try {
      const currentReport = customReportHtml !== undefined
        ? customReportHtml
        : (editorRef.current?.getHTML() || reportContent || '');
      const res = await fetch(`/api/sgsst/chemical-compatibility/matrix/${conversationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ matrixRows: rowsToSave, reportHtml: currentReport })
      });
      if (res.ok && notify) {
        showToast({ message: 'Matriz de compatibilidad química guardada exitosamente.', status: 'success', severity: 'success' });
        if (onRefreshOfficialList) onRefreshOfficialList();
      }
    } catch (e) {
      console.error(e);
      if (notify) showToast({ message: 'Error al guardar el inventario.', status: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  // Fijar matriz del chat como Matriz Oficial de Compatibilidad Química
  const handlePromoteToOfficial = async () => {
    if (!conversationId || matrixRows.length === 0) {
      showToast({ message: 'La matriz no tiene productos para fijar en el aplicativo.', status: 'warning' });
      return;
    }
    setIsPromoting(true);
    try {
      const currentReport = editorRef.current?.getHTML() || reportContent || '';
      const res = await fetch('/api/sgsst/chemical-compatibility/set-official', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          sourceConversationId: conversationId,
          matrixRows,
          chartConclusions,
          reportHtml: currentReport,
          officialTitle: 'Matriz Oficial de Compatibilidad Química'
        })
      });
      if (res.ok) {
        showToast({ message: 'Matriz fijada exitosamente en el aplicativo oficial del Hito 1.', status: 'success' });
        if (onRefreshOfficialList) onRefreshOfficialList();
      } else {
        showToast({ message: 'Error al fijar la matriz como oficial.', status: 'error' });
      }
    } catch (e) {
      console.error(e);
      showToast({ message: 'Error al conectar con el servidor.', status: 'error' });
    } finally {
      setIsPromoting(false);
    }
  };

  // Sincronizar desde Inventario Químico del Hito 5
  const handleSyncFromHito5 = async () => {
    setIsSyncingHito5(true);
    try {
      const res = await fetch('/api/sgsst/chemical-compatibility/sync-hito5', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ conversationId })
      });
      const data = await res.json();
      if (res.ok) {
        if (Array.isArray(data.matrixRows) && data.matrixRows.length > 0) {
          setMatrixRows(data.matrixRows);
          if (onRefreshOfficialList) onRefreshOfficialList();
        }
        showToast({ message: data.message || 'Sincronización con Hito 5 completada.', status: 'success' });
      } else {
        showToast({ message: data.error || 'Error al sincronizar con Hito 5.', status: 'error' });
      }
    } catch (e) {
      console.error(e);
      showToast({ message: 'Error al sincronizar con el Hito 5.', status: 'error' });
    } finally {
      setIsSyncingHito5(false);
    }
  };

  // Sincronizar controles químicos y brechas FDS/Rótulo con Centro de Control (Kanban ACPM)
  const handleSyncControlesQuimicos = async () => {
    if (matrixRows.length === 0) {
      showToast({ message: 'No hay productos en la matriz para sincronizar controles.', status: 'warning' });
      return;
    }
    setIsSyncingKanban(true);
    try {
      const res = await fetch('/api/sgsst/chemical-compatibility/sync-controles-quimicos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ matrixRows })
      });
      const data = await res.json();
      if (res.ok) {
        showToast({ message: data.message || 'Controles químicos sincronizados con el Centro de Control.', status: 'success' });
      } else {
        showToast({ message: data.error || 'Error al sincronizar controles químicos.', status: 'error' });
      }
    } catch (e) {
      console.error(e);
      showToast({ message: 'Error al sincronizar con el Centro de Control.', status: 'error' });
    } finally {
      setIsSyncingKanban(false);
    }
  };

  // Datos de prueba (Dummy)
  const handleFillDummy = () => {
    setMatrixRows(DUMMY_CHEMICAL_ROWS);
    saveMatrix(DUMMY_CHEMICAL_ROWS, true);
  };

  // Agregar fila
  const addRow = () => {
    const newRow: MatrixRow = {
      id: Date.now().toString() + Math.random().toString(36).substring(7),
      nombre: '',
      fabricante: 'Desconocido',
      estado_fisico: 'Líquido',
      clasificacion_onu: 'No Peligroso',
      pictogramas_sga: [],
      cantidad_almacenada: '',
      ubicacion: 'Bodega General',
      tiene_fds: 'Sí',
      tiene_rotulo: 'Sí',
      incompatibilidades: 'Ninguna',
      requisitos_almacenamiento: 'Almacenar en lugar ventilado y señalizado'
    };
    const updated = [...matrixRows, newRow];
    setMatrixRows(updated);
  };

  // Eliminar fila
  const deleteRow = (idx: number) => {
    const updated = matrixRows.filter((_, i) => i !== idx);
    setMatrixRows(updated);
    saveMatrix(updated, false);
  };

  // Modificar valor en celda
  const handleCellChange = (idx: number, field: keyof MatrixRow, val: any) => {
    const updated = [...matrixRows];
    updated[idx] = { ...updated[idx], [field]: val };
    setMatrixRows(updated);
  };

  // Completar fila con IA
  const handleAiUpdateRow = async (idx: number) => {
    const row = matrixRows[idx];
    if (!row.nombre) {
      showToast({ message: 'Escribe primero el nombre del producto.', status: 'warning' });
      return;
    }
    setAiRowLoading(idx);
    try {
      const res = await fetch('/api/sgsst/chemical-compatibility/ai-update-row', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ row, modelName: selectedModel })
      });
      if (res.ok) {
        const data = await res.json();
        const updated = [...matrixRows];
        updated[idx] = { ...updated[idx], ...data.updatedFields };
        setMatrixRows(updated);
        saveMatrix(updated, false);
        showToast({ message: 'Producto completado exitosamente con IA.', status: 'success' });
      }
    } catch (e) {
      console.error(e);
      showToast({ message: 'Error al completar con IA.', status: 'error' });
    } finally {
      setAiRowLoading(null);
    }
  };

  // Generar reporte IA completo
  const handleAnalyzeMatrix = async () => {
    if (matrixRows.length === 0) {
      showToast({ message: 'El inventario está vacío.', status: 'warning' });
      return;
    }
    setIsAnalyzing(true);
    try {
      const res = await fetch('/api/sgsst/chemical-compatibility/ai-analyze-matrix', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ matrixRows, modelName: selectedModel, conversationId })
      });
      if (res.ok) {
        const data = await res.json();
        setReportContent(data.analysis);
        if (!isOfficialApp) {
          setActiveTab('reporte');
        }
        showToast({ message: 'Auditoría técnica de compatibilidad química generada con éxito.', status: 'success' });
      }
    } catch (e) {
      console.error(e);
      showToast({ message: 'Error al generar auditoría.', status: 'error' });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Guardar conclusiones del dashboard
  const handleConclusionSaved = (type: string, text: string) => {
    setChartConclusions(prev => ({ ...prev, [type]: text }));
  };

  // Manejo de Excel Import
  const triggerExcelImport = () => {
    fileInputRef.current?.click();
  };

  const handleExcelFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rawJson = XLSX.utils.sheet_to_json<any>(sheet);

        if (rawJson.length === 0) {
          showToast({ message: 'El archivo está vacío.', status: 'warning' });
          return;
        }

        setPendingRawRows(rawJson);
        setIsConfirmModalOpen(true);
      } catch (err) {
        console.error(err);
        showToast({ message: 'Error leyendo el archivo Excel.', status: 'error' });
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const handleConfirmAiImport = async () => {
    setIsConfirmModalOpen(false);
    setIsAiImportLoading(true);
    try {
      const res = await fetch('/api/sgsst/chemical-compatibility/ai-parse-matrix', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ rawRows: pendingRawRows, modelName: selectedModel })
      });
      if (res.ok) {
        const data = await res.json();
        const merged = [...matrixRows, ...data.matrixRows];
        setMatrixRows(merged);
        saveMatrix(merged, false);
        showToast({ message: `Importados ${data.matrixRows.length} productos químicos con IA.`, status: 'success' });
      }
    } catch (e) {
      console.error(e);
      showToast({ message: 'Error al parsear archivo con IA.', status: 'error' });
    } finally {
      setIsAiImportLoading(false);
      setPendingRawRows([]);
    }
  };

  // Manejo de Excel Export
  const handleExportExcel = async () => {
    try {
      await exportCompatibilidadToExcel(matrixRows);
      showToast({ message: 'Excel exportado exitosamente.', status: 'success' });
    } catch (e) {
      console.error(e);
      showToast({ message: 'Error exportando Excel.', status: 'error' });
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      await exportCompatibilidadToExcel([]);
      showToast({ message: 'Plantilla de Compatibilidad Química descargada exitosamente.', status: 'success' });
    } catch (e) {
      console.error(e);
      showToast({ message: 'Error al descargar la plantilla Excel.', status: 'error' });
    }
  };

  // Paginación
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return matrixRows.slice(start, start + pageSize);
  }, [matrixRows, currentPage, pageSize]);

  // ── SUB-RENDER: Tabla de Inventario ──
  const renderInventoryTable = () => (
    <div className="flex flex-col flex-1 gap-4">
      {matrixRows.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-text-secondary py-12">
          <AlertTriangle className="h-12 w-12 opacity-30 text-teal-500 animate-bounce" />
          <p className="text-center text-sm font-semibold max-w-md">
            Aún no hay productos en el inventario químico. Agrégalos manualmente, sincronízalos desde el Hito 5 o pídele al agente en el chat que los documente.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={addRow}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 px-4 py-2 text-xs font-bold text-white shadow-md transition-all active:scale-95"
            >
              <Plus className="h-4 w-4" /> Añadir Producto Químico
            </button>
            <button
              onClick={handleSyncFromHito5}
              disabled={isSyncingHito5}
              className="flex items-center gap-2 rounded-xl bg-white dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 px-4 py-2 text-xs font-bold shadow-sm transition-all active:scale-95"
            >
              {isSyncingHito5 ? <Loader2 className="h-4 w-4 animate-spin text-teal-600" /> : <RefreshCw className="h-4 w-4 text-teal-600" />}
              <span>Traer Inventario del Hito 5</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-border-medium bg-surface-primary shadow-sm">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-border-medium bg-surface-secondary font-bold text-text-secondary uppercase">
                  <th className="px-3 py-3 min-w-[180px]">Nombre del Producto</th>
                  <th className="px-3 py-3 min-w-[140px]">Fabricante</th>
                  <th className="px-3 py-3 min-w-[100px]">Estado</th>
                  <th className="px-3 py-3 min-w-[210px]">Clase ONU Peligro</th>
                  <th className="px-3 py-3 min-w-[180px]">SGA Pictogramas</th>
                  <th className="px-3 py-3 min-w-[110px]">Cant. Almacenada</th>
                  <th className="px-3 py-3 min-w-[140px]">Ubicación</th>
                  <th className="px-3 py-3 min-w-[75px] text-center">FDS</th>
                  <th className="px-3 py-3 min-w-[75px] text-center">Rótulo</th>
                  <th className="px-3 py-3 min-w-[200px]">Incompatibilidades</th>
                  <th className="px-3 py-3 min-w-[220px]">Requisitos Almacenamiento</th>
                  <th className="px-3 py-3 text-center min-w-[110px]">IA / Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-medium">
                {paginatedRows.map((row, idx) => (
                  <tr key={row.id || idx} className="hover:bg-surface-secondary/40 transition-colors">
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={row.nombre}
                        onChange={(e) => handleCellChange(idx, 'nombre', e.target.value)}
                        placeholder="Ej. Hipoclorito de Sodio"
                        className="w-full rounded-xl border-border-medium bg-transparent px-2.5 py-1 text-xs font-semibold text-text-primary focus:border-teal-500 focus:ring-teal-500"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={row.fabricante}
                        onChange={(e) => handleCellChange(idx, 'fabricante', e.target.value)}
                        className="w-full rounded-xl border-border-medium bg-transparent px-2.5 py-1 text-xs text-text-primary focus:border-teal-500 focus:ring-teal-500"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <DropdownSelect
                        value={row.estado_fisico}
                        onChange={(v) => handleCellChange(idx, 'estado_fisico', v)}
                        options={ESTADO_OPCIONES}
                        placeholder="Estado"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <DropdownSelect
                        value={row.clasificacion_onu}
                        onChange={(v) => handleCellChange(idx, 'clasificacion_onu', v)}
                        options={CLASES_ONU}
                        placeholder="Clase ONU"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <PictogramsSelect
                        selected={row.pictogramas_sga || []}
                        onChange={(v) => handleCellChange(idx, 'pictogramas_sga', v)}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={row.cantidad_almacenada}
                        onChange={(e) => handleCellChange(idx, 'cantidad_almacenada', e.target.value)}
                        placeholder="Ej. 10 Gal"
                        className="w-full rounded-xl border-border-medium bg-transparent px-2.5 py-1 text-xs text-text-primary focus:border-teal-500 focus:ring-teal-500"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={row.ubicacion}
                        onChange={(e) => handleCellChange(idx, 'ubicacion', e.target.value)}
                        placeholder="Ej. Bodega Principal"
                        className="w-full rounded-xl border-border-medium bg-transparent px-2.5 py-1 text-xs text-text-primary focus:border-teal-500 focus:ring-teal-500"
                      />
                    </td>
                    <td className="px-3 py-2 text-center">
                      <select
                        value={row.tiene_fds}
                        onChange={(e) => handleCellChange(idx, 'tiene_fds', e.target.value)}
                        className={`rounded-xl border-border-medium bg-transparent py-1 text-xs font-bold focus:border-teal-500 focus:ring-0 ${
                          row.tiene_fds === 'No' ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        <option value="Sí">Sí</option>
                        <option value="No">No</option>
                      </select>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <select
                        value={row.tiene_rotulo}
                        onChange={(e) => handleCellChange(idx, 'tiene_rotulo', e.target.value)}
                        className={`rounded-xl border-border-medium bg-transparent py-1 text-xs font-bold focus:border-teal-500 focus:ring-0 ${
                          row.tiene_rotulo === 'No' ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        <option value="Sí">Sí</option>
                        <option value="No">No</option>
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <textarea
                        rows={2}
                        value={row.incompatibilidades || ''}
                        onChange={(e) => handleCellChange(idx, 'incompatibilidades', e.target.value)}
                        placeholder="Ej. Ácidos fuertes, inflamables"
                        className="w-full rounded-xl border border-border-medium bg-transparent px-2 py-1 text-[11px] text-text-primary focus:border-teal-500 focus:ring-teal-500"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <textarea
                        rows={2}
                        value={row.requisitos_almacenamiento || ''}
                        onChange={(e) => handleCellChange(idx, 'requisitos_almacenamiento', e.target.value)}
                        placeholder="Ej. Dique de contención, ventilación"
                        className="w-full rounded-xl border border-border-medium bg-transparent px-2 py-1 text-[11px] text-text-primary focus:border-teal-500 focus:ring-teal-500"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleAiUpdateRow(idx)}
                          disabled={aiRowLoading === idx}
                          className="group flex h-7 min-w-[28px] items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-300 hover:bg-amber-100 transition-all duration-300 px-1.5 shadow-sm active:scale-95 disabled:opacity-50"
                          title="Autocompletar producto químico con IA (ONU, SGA, Incompatibilidades)"
                        >
                          {aiRowLoading === idx ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
                          ) : (
                            <Sparkles className="h-3.5 w-3.5 shrink-0" />
                          )}
                          <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-1 group-hover:max-w-[80px] group-hover:opacity-100 sm:flex">
                            <span className="text-[10px] font-bold">IA</span>
                          </div>
                        </button>
                        <button
                          onClick={() => deleteRow(idx)}
                          className="group flex h-7 min-w-[28px] items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 transition-all duration-300 px-1.5 shadow-sm active:scale-95"
                          title="Eliminar producto"
                        >
                          <Trash2 className="h-3.5 w-3.5 shrink-0" />
                          <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-1 group-hover:max-w-[80px] group-hover:opacity-100 sm:flex">
                            <span className="text-[10px] font-bold">Borrar</span>
                          </div>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              onClick={addRow}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 px-4 py-2 text-xs font-bold text-white shadow-md transition-all active:scale-95"
            >
              <Plus className="h-4 w-4" /> Añadir Producto Químico
            </button>
            <span className="text-xs text-slate-500 dark:text-zinc-400">
              Total sustancias registradas: <strong>{matrixRows.length}</strong>
            </span>
          </div>
        </>
      )}
    </div>
  );

  // ── SUB-RENDER: Cuadrícula Cruzada de Compatibilidad ──
  const renderCrossMatrixGrid = () => (
    <div className="flex flex-col gap-5 relative">
      <div className="rounded-2xl border border-border-medium bg-surface-primary p-4 shadow-sm">
        <h3 className="text-xs font-bold text-text-primary flex items-center gap-2">
          <Info className="h-4 w-4 text-teal-600" /> Cuadrícula de Compatibilidad Química (NTC 3966 / SGA)
        </h3>
        <p className="mt-1 text-xs text-text-secondary">
          Cruza cada producto del inventario para evaluar la seguridad de almacenamiento conjunto. Haz clic en cualquier celda del semáforo para ver la justificación técnica y distancia de segregación recomendada.
        </p>
      </div>

      {matrixRows.length <= 1 ? (
        <div className="flex flex-col items-center justify-center gap-2 text-text-secondary py-12">
          <AlertTriangle className="h-10 w-10 opacity-30 text-teal-500" />
          <p className="text-xs text-center">Registra al menos 2 productos en el inventario para construir la cuadrícula cruzada de compatibilidad.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <div className="overflow-auto max-w-full rounded-2xl border border-border-medium bg-surface-primary shadow-sm p-4">
            <table className="border-collapse">
              <thead>
                <tr>
                  <th className="border border-border-medium bg-surface-secondary p-3 text-xs font-bold text-text-primary text-center min-w-[130px] max-w-[180px] truncate">
                    Productos
                  </th>
                  {matrixRows.map(p => (
                    <th
                      key={p.id || p.nombre}
                      className="border border-border-medium bg-surface-secondary p-3 text-xs font-bold text-text-primary text-center min-w-[100px] max-w-[150px] truncate"
                      title={`${p.nombre} (${p.clasificacion_onu})`}
                    >
                      {p.nombre}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrixRows.map((rowI) => (
                  <tr key={rowI.id || rowI.nombre}>
                    <td
                      className="border border-border-medium bg-surface-secondary p-3 text-xs font-bold text-text-primary truncate max-w-[180px]"
                      title={`${rowI.nombre} (${rowI.clasificacion_onu})`}
                    >
                      {rowI.nombre}
                    </td>
                    {matrixRows.map((rowJ) => {
                      const compat = getChemicalCompatibility(rowI.clasificacion_onu, rowJ.clasificacion_onu);
                      let bgClass = 'bg-emerald-500 hover:bg-emerald-600';
                      if (compat.status === 'incompatible') bgClass = 'bg-red-500 hover:bg-red-600';
                      else if (compat.status === 'caution') bgClass = 'bg-amber-500 hover:bg-amber-600';

                      return (
                        <td key={rowJ.id || rowJ.nombre} className="border border-border-medium p-2 text-center">
                          <button
                            type="button"
                            onClick={() => setSelectedCrossCell({ prodA: rowI, prodB: rowJ, result: compat })}
                            className={`mx-auto h-6 w-6 rounded-full ${bgClass} shadow-md transition-all hover:scale-110 flex items-center justify-center text-[10px] font-bold text-white`}
                            title={`${rowI.nombre} vs ${rowJ.nombre}: ${compat.status.toUpperCase()}`}
                          >
                            {compat.status === 'incompatible' ? 'X' : compat.status === 'caution' ? '!' : '✓'}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Leyenda */}
          <div className="flex flex-wrap items-center gap-6 justify-center text-xs">
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full bg-emerald-500" />
              <span className="text-text-secondary font-semibold">Compatible (Almacenamiento conjunto permitido)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full bg-amber-500" />
              <span className="text-text-secondary font-semibold">Precaución / Verificar FDS (Sección 7 y 10)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full bg-red-500" />
              <span className="text-text-secondary font-semibold">Incompatible / Segregar estrictamente</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // ── MODO APLICATIVO OFICIAL (HITO 1) ──
  if (isOfficialApp) {
    return (
      <div className="flex flex-col gap-6 w-full">
        {/* Input oculto para importar Excel */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleExcelFileChange}
          accept=".xlsx,.xls"
          className="hidden"
        />

        {/* 1. Barra de Herramientas Flotante Cápsula (SGSSTToolbar) */}
        <SGSSTToolbar
          onHistory={() => setShowHistory(true)}
          onAnalyze={handleAnalyzeMatrix}
          isAnalyzing={isAnalyzing}
          analyzeLabel="Auditar Matriz Química con IA"
          aiButtons={[
            {
              label: 'Traer Inventario Químico del Hito 5',
              onClick: handleSyncFromHito5,
              loading: isSyncingHito5,
              icon: <RefreshCw className="w-4 h-4 text-teal-600 dark:text-teal-400" />,
            },
            {
              label: 'Sincronizar Controles SGA con Centro de Control',
              onClick: handleSyncControlesQuimicos,
              loading: isSyncingKanban,
              icon: <CheckSquare className="w-4 h-4 text-orange-500 dark:text-orange-400" />,
            },
          ]}
          onSaveLocal={() => saveMatrix(matrixRows, true)}
          isSaving={isSaving}
          onImportExcel={triggerExcelImport}
          onExportExcel={handleExportExcel}
          onDownloadTemplate={handleDownloadTemplate}
          onDummy={handleFillDummy}
          selectedModel={selectedModel}
          onSelectModel={setSelectedModel}
        />

        {/* 2. Tarjeta Colapsable: Inventario y Cuadrícula Cruzada */}
        <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-slate-100 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-800/40">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800 flex items-center justify-center text-teal-600 dark:text-teal-400">
                <Beaker className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-100">
                  Inventario y Matriz Cruzada de Compatibilidad Química (SGA / NTC 3966)
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                  {matrixRows.length} sustancias químicas evaluadas • Decreto 1496 de 2018
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Selector de vista interna: Inventario vs Cuadrícula Cruzada */}
              <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700">
                <button
                  type="button"
                  onClick={() => {
                    setOfficialSubView('inventario');
                    setIsTableCollapsed(false);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    officialSubView === 'inventario'
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-zinc-300 hover:bg-white/60 dark:hover:bg-zinc-700'
                  }`}
                >
                  <Beaker className="w-3.5 h-3.5" />
                  <span>Inventario SGA ({matrixRows.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOfficialSubView('matriz_cruzada');
                    setIsTableCollapsed(false);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    officialSubView === 'matriz_cruzada'
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-zinc-300 hover:bg-white/60 dark:hover:bg-zinc-700'
                  }`}
                >
                  <Grid className="w-3.5 h-3.5" />
                  <span>Cuadrícula Cruzada</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsTableCollapsed(!isTableCollapsed)}
                className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-100 transition-all"
                title={isTableCollapsed ? 'Expandir sección' : 'Contraer sección'}
              >
                {isTableCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {!isTableCollapsed && (
            <div className="p-5">
              {isLoading ? (
                <div className="flex items-center justify-center py-12 text-slate-400 gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-teal-600" />
                  <span className="text-xs font-semibold">Cargando Matriz de Compatibilidad Química...</span>
                </div>
              ) : officialSubView === 'inventario' ? (
                renderInventoryTable()
              ) : (
                renderCrossMatrixGrid()
              )}
            </div>
          )}
        </div>

        {/* 3. Tarjeta Colapsable: Dashboard y Analítica Química */}
        <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-800/40">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-100">
                  Dashboard Analítico de Riesgo Químico y Almacenamiento
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                  Distribución por Clase ONU, Pictogramas SGA, Cumplimiento FDS/Rótulo y Semáforo de Segregación
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsDashboardCollapsed(!isDashboardCollapsed)}
              className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-100 transition-all"
            >
              {isDashboardCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>

          {!isDashboardCollapsed && (
            <div className="p-4">
              <MatrizCompatibilidadDashboard
                matrixRows={matrixRows}
                conversationId={conversationId}
                token={token}
                savedConclusions={chartConclusions}
                onConclusionSaved={handleConclusionSaved}
                isMaximized={false}
              />
            </div>
          )}
        </div>

        {/* 4. Informe Ejecutivo en Editor en Vivo (CollapsibleReportBox + LiveEditor) */}
        <CollapsibleReportBox
          title="Informe de Auditoría Técnica y Almacenamiento Seguro de Sustancias Químicas (SGA)"
          hasContent={!!reportContent}
          onSave={async () => {
            const currentHtml = editorRef.current?.getHTML() || reportContent || '';
            setReportContent(currentHtml);
            await saveMatrix(matrixRows, true, currentHtml);
          }}
          isSaving={isSaving}
          exportDropdown={
            <ExportDropdown
              getContent={() => editorRef.current?.getHTML() || reportContent || ''}
              fileName={`Auditoria_Compatibilidad_Quimica_${new Date().toISOString().slice(0, 10)}`}
              title="Auditoría Técnica y Matriz de Compatibilidad Química"
              onExportExcel={handleExportExcel}
            />
          }
        >
          <LiveEditor
            ref={editorRef}
            initialContent={reportContent}
            isGenerating={isAnalyzing}
            placeholder="Haz clic en la varita mágica de la barra superior para generar el Informe de Auditoría Técnica y Matriz de Compatibilidad Química con IA..."
          />
        </CollapsibleReportBox>

        {/* Modal Historial de Informes */}
        {showHistory && (
          <ReportHistory
            tags={['sgsst-matriz-compatibilidad']}
            onSelect={(content) => {
              setReportContent(content);
              setShowHistory(false);
            }}
            onClose={() => setShowHistory(false)}
          />
        )}

        {/* Popup Detalle de Celda Cruzada */}
        {selectedCrossCell && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg rounded-2xl border border-border-medium bg-surface-primary p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-border-medium pb-3">
                <h3 className="text-sm font-bold text-text-primary">Detalle de Almacenamiento Conjunto (NTC 3966)</h3>
                <button
                  onClick={() => setSelectedCrossCell(null)}
                  className="text-text-secondary hover:text-text-primary text-sm font-bold"
                >
                  Cerrar
                </button>
              </div>
              <div className="mt-4 flex flex-col gap-4">
                <div className="flex items-center justify-between rounded-xl bg-surface-secondary p-3 text-xs">
                  <div>
                    <div className="font-bold text-text-primary">{selectedCrossCell.prodA.nombre}</div>
                    <div className="text-[10px] text-text-secondary">{selectedCrossCell.prodA.clasificacion_onu}</div>
                  </div>
                  <div className="text-sm font-bold text-text-secondary">VS</div>
                  <div className="text-right">
                    <div className="font-bold text-text-primary">{selectedCrossCell.prodB.nombre}</div>
                    <div className="text-[10px] text-text-secondary">{selectedCrossCell.prodB.clasificacion_onu}</div>
                  </div>
                </div>
                <div className="text-xs">
                  <strong className="text-text-primary block mb-1">Razón Técnica:</strong>
                  <p className="text-text-secondary bg-surface-secondary/40 p-2.5 rounded-xl border border-border-light">{selectedCrossCell.result.reason}</p>
                </div>
                <div className="text-xs">
                  <strong className="text-text-primary block mb-1">Recomendación de Segregación:</strong>
                  <p className="text-text-secondary bg-surface-secondary/40 p-2.5 rounded-xl border border-border-light">{selectedCrossCell.result.recommendation}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Confirmación Importación Excel con IA */}
        {isConfirmModalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-2xl border border-border-medium bg-surface-primary p-6 shadow-2xl">
              <h3 className="text-sm font-bold text-text-primary">Confirmar Importación con IA</h3>
              <p className="mt-2 text-xs text-text-secondary">
                Se leyeron {pendingRawRows.length} filas del archivo Excel. ¿Deseas usar la IA para mapear y autocompletar estas filas de acuerdo a la clasificación ONU y pictogramas SGA?
              </p>
              <div className="mt-6 flex justify-end gap-2">
                <button
                  onClick={() => {
                    setIsConfirmModalOpen(false);
                    setPendingRawRows([]);
                  }}
                  className="rounded-xl border border-border-medium px-4 py-2 text-xs font-bold text-text-secondary hover:bg-surface-secondary"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmAiImport}
                  className="rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-purple-700"
                >
                  Importar con IA
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── MODO PANEL LATERAL DEL CHAT (HERRAMIENTA) ──
  return (
    <div className={`flex h-full flex-col border-l border-border-light transition-colors duration-300 ${isMaximized ? 'fixed inset-0 z-[999999] m-0 h-screen w-screen rounded-none bg-surface-primary shadow-2xl' : 'w-full h-full bg-surface-primary text-text-primary'}`}>
      {/* ── BARRA SUPERIOR DE ACCIONES ── */}
      <div
        className="relative z-[300] flex min-w-0 shrink-0 flex-wrap items-center justify-between gap-2 border-b border-border-light bg-surface-secondary px-3 py-2 sm:px-4 sm:py-0"
        style={{ minHeight: '4rem' }}
      >
        <div className="flex min-w-0 flex-shrink items-center gap-2 sm:gap-3 overflow-hidden text-ellipsis">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-teal-500/20 bg-teal-500/10 text-teal-600 shadow-sm">
            <Beaker className="h-5 w-5 animate-pulse" />
          </div>
          <div className="min-w-0 overflow-hidden">
            <h2 className="truncate text-sm font-semibold text-text-primary">Matriz de Compatibilidad Química</h2>
            <div className="flex items-center gap-1.5 overflow-hidden">
              <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-green-500" />
              <span className="truncate text-xs text-text-secondary">Sincronizada con Hito 1</span>
            </div>
          </div>
        </div>

        {/* Controles de Acción */}
        <div className="flex shrink-0 flex-wrap items-center gap-1.5 sm:gap-2 overflow-visible py-1">
          <ModelSelector
            selectedModel={selectedModel}
            onSelectModel={setSelectedModel}
            hideTooltip={true}
          />

          {/* Fijar como Matriz Oficial en Hito 1 */}
          <button
            onClick={handlePromoteToOfficial}
            disabled={isPromoting || matrixRows.length === 0}
            className="group flex h-10 min-w-[40px] flex-shrink-0 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-amber-500/40 bg-surface-primary px-2.5 text-amber-600 shadow-sm outline-none transition-all duration-300 hover:-rotate-3 hover:scale-105 hover:bg-amber-50 disabled:opacity-50 dark:text-amber-400 dark:hover:bg-amber-900/20"
            title="Fijar esta matriz como la Matriz Oficial de Compatibilidad Química en el Hito 1"
          >
            {isPromoting ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
            ) : (
              <Pin className="h-4 w-4 shrink-0" />
            )}
            <span className="flex max-w-0 items-center overflow-hidden whitespace-nowrap text-sm font-bold tracking-wide opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[200px] group-hover:opacity-100">
              Fijar en Aplicativo
            </span>
          </button>

          {/* Sincronizar Controles con Centro de Control */}
          <button
            onClick={handleSyncControlesQuimicos}
            disabled={isSyncingKanban || matrixRows.length === 0}
            className="group flex h-10 min-w-[40px] flex-shrink-0 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-orange-500/40 bg-surface-primary px-2.5 text-orange-600 shadow-sm outline-none transition-all duration-300 hover:-rotate-3 hover:scale-105 hover:bg-orange-50 disabled:opacity-50 dark:text-orange-400 dark:hover:bg-orange-900/20"
            title="Sincronizar controles de almacenamiento y brechas FDS/Rótulo con el Centro de Control"
          >
            {isSyncingKanban ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
            ) : (
              <CheckSquare className="h-4 w-4 shrink-0" />
            )}
            <span className="flex max-w-0 items-center overflow-hidden whitespace-nowrap text-sm font-bold tracking-wide opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[200px] group-hover:opacity-100">
              Enviar Controles
            </span>
          </button>

          {/* Añadir Producto */}
          <button
            onClick={addRow}
            className="group flex h-10 min-w-[40px] flex-shrink-0 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-teal-500/40 bg-surface-primary px-2.5 text-teal-600 shadow-sm outline-none transition-all duration-300 hover:-rotate-3 hover:scale-105 hover:bg-teal-50 dark:text-teal-400 dark:hover:bg-teal-900/20"
          >
            <Plus className="h-4 w-4 shrink-0" />
            <span className="flex max-w-0 items-center overflow-hidden whitespace-nowrap text-sm font-bold tracking-wide opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[200px] group-hover:opacity-100">
              Añadir Producto
            </span>
          </button>

          {/* Auditar con IA */}
          <button
            onClick={handleAnalyzeMatrix}
            disabled={isAnalyzing || matrixRows.length === 0}
            className="group flex h-10 min-w-[40px] flex-shrink-0 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-purple-500/40 bg-surface-primary px-2.5 text-purple-600 shadow-sm outline-none transition-all duration-300 hover:-rotate-3 hover:scale-105 hover:bg-purple-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-purple-400 dark:hover:bg-purple-900/20"
          >
            {isAnalyzing ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 shrink-0 text-purple-600 dark:text-purple-400" />
            )}
            <span className="flex max-w-0 items-center overflow-hidden whitespace-nowrap text-sm font-bold tracking-wide opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[200px] group-hover:opacity-100">
              {isAnalyzing ? 'Generando…' : 'Auditar con IA'}
            </span>
          </button>

          {/* Importar */}
          <button
            onClick={triggerExcelImport}
            disabled={isAiImportLoading}
            className="group flex h-10 min-w-[40px] flex-shrink-0 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-border-medium bg-surface-primary px-2.5 text-text-primary shadow-sm outline-none transition-all duration-300 hover:-rotate-3 hover:scale-105 hover:bg-surface-hover"
          >
            {isAiImportLoading ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 shrink-0" />
            )}
            <span className="flex max-w-0 items-center overflow-hidden whitespace-nowrap text-sm font-bold tracking-wide opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[200px] group-hover:opacity-100">
              Importar
            </span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleExcelFileChange}
            accept=".xlsx,.xls"
            className="hidden"
          />

          {/* Exportar */}
          <ExportDropdown
            content={reportContent || ''}
            fileName={`Informe_Compatibilidad_Quimica_${new Date().toISOString().slice(0, 10)}`}
            reportType="general"
            onExportExcel={handleExportExcel}
          />

          {/* Guardar */}
          <button
            onClick={() => saveMatrix()}
            disabled={isSaving}
            className="group flex h-10 min-w-[40px] flex-shrink-0 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-green-500/40 bg-surface-primary px-2.5 text-green-600 shadow-sm outline-none transition-all duration-300 hover:-rotate-3 hover:scale-105 hover:bg-green-50 disabled:opacity-50 dark:text-green-400 dark:hover:bg-green-900/20"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
            ) : (
              <Save className="h-4 w-4 shrink-0" />
            )}
            <span className="flex max-w-0 items-center overflow-hidden whitespace-nowrap text-sm font-bold tracking-wide opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[200px] group-hover:opacity-100">
              {isSaving ? 'Guardando…' : 'Guardar'}
            </span>
          </button>

          {/* Maximizar */}
          <button
            onClick={() => setIsMaximized(!isMaximized)}
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

      {/* ── MENÚ DE PESTAÑAS ── */}
      <div className="flex flex-shrink-0 border-b border-border-medium bg-surface-secondary px-4">
        {(['inventario', 'matriz_cruzada', 'dashboard', 'reporte'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-xs font-bold capitalize transition-all border-b-2 ${
              activeTab === tab
                ? 'border-teal-600 text-teal-600 dark:text-teal-400'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            {tab.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* ── CONTENIDO DE LAS PESTAÑAS ── */}
      <div className="flex-1 overflow-auto bg-surface-secondary/30 custom-scrollbar-ipevar">
        {activeTab === 'inventario' && (
          <div className="h-full flex flex-col p-4">
            {renderInventoryTable()}
          </div>
        )}

        {activeTab === 'matriz_cruzada' && (
          <div className="p-6 h-full flex flex-col gap-6 relative">
            {renderCrossMatrixGrid()}
          </div>
        )}

        {activeTab === 'dashboard' && (
          <MatrizCompatibilidadDashboard
            matrixRows={matrixRows}
            conversationId={conversationId}
            token={token}
            savedConclusions={chartConclusions}
            onConclusionSaved={handleConclusionSaved}
            isMaximized={isMaximized}
          />
        )}

        {activeTab === 'reporte' && (
          <div className="p-6 h-full flex flex-col gap-6">
            {!reportContent ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 text-text-secondary py-16">
                <FileTextIcon className="h-12 w-12 opacity-30 text-purple-600 animate-bounce" />
                <p className="text-center text-sm font-semibold max-w-sm">
                  Aún no se ha generado la Auditoría Técnica e Informe de Almacenamiento Seguro.
                </p>
                <button
                  onClick={handleAnalyzeMatrix}
                  disabled={isAnalyzing || matrixRows.length === 0}
                  className="flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-purple-700 disabled:opacity-50"
                >
                  {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  <span>Auditar con IA ahora</span>
                </button>
              </div>
            ) : (
              <div className="flex-1 flex flex-col gap-4">
                <div className="rounded-2xl border border-border-medium bg-surface-primary p-6 shadow-sm">
                  <LiveEditor
                    initialContent={reportContent}
                    ref={editorRef}
                    isEditable={true}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Popup Detalle Celda Cruzada */}
      {selectedCrossCell && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border-medium bg-surface-primary p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border-medium pb-3">
              <h3 className="text-sm font-bold text-text-primary">Detalle de Almacenamiento Conjunto</h3>
              <button
                onClick={() => setSelectedCrossCell(null)}
                className="text-text-secondary hover:text-text-primary text-sm font-bold"
              >
                Cerrar
              </button>
            </div>
            <div className="mt-4 flex flex-col gap-4">
              <div className="flex items-center justify-between rounded-xl bg-surface-secondary p-3 text-xs">
                <div>
                  <div className="font-bold text-text-primary">{selectedCrossCell.prodA.nombre}</div>
                  <div className="text-[10px] text-text-secondary">{selectedCrossCell.prodA.clasificacion_onu}</div>
                </div>
                <div className="text-sm font-bold text-text-secondary">VS</div>
                <div className="text-right">
                  <div className="font-bold text-text-primary">{selectedCrossCell.prodB.nombre}</div>
                  <div className="text-[10px] text-text-secondary">{selectedCrossCell.prodB.clasificacion_onu}</div>
                </div>
              </div>
              <div className="text-xs">
                <strong className="text-text-primary block mb-1">Razón Técnica:</strong>
                <p className="text-text-secondary bg-surface-secondary/40 p-2.5 rounded-xl border border-border-light">{selectedCrossCell.result.reason}</p>
              </div>
              <div className="text-xs">
                <strong className="text-text-primary block mb-1">Recomendación de Segregación:</strong>
                <p className="text-text-secondary bg-surface-secondary/40 p-2.5 rounded-xl border border-border-light">{selectedCrossCell.result.recommendation}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL IMPORT CONFIRMATION IA ── */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-border-medium bg-surface-primary p-6 shadow-2xl">
            <h3 className="text-sm font-bold text-text-primary">Confirmar Importación con IA</h3>
            <p className="mt-2 text-xs text-text-secondary">
              Se leyeron {pendingRawRows.length} filas del archivo Excel. ¿Deseas usar la IA (Gemini) para mapear y autocompletar estas filas de acuerdo a la clasificación ONU y pictogramas SGA?
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => {
                  setIsConfirmModalOpen(false);
                  setPendingRawRows([]);
                }}
                className="rounded-xl border border-border-medium px-4 py-2 text-xs font-bold text-text-secondary hover:bg-surface-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmAiImport}
                className="rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-purple-700"
              >
                Importar con IA
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
