import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useRecoilState } from 'recoil';
import store from '~/store';
import {
  Save,
  Maximize2,
  Minimize2,
  RefreshCw,
  Plus,
  Trash2,
  AlertTriangle,
  Beaker,
  Loader2,
  Sparkles,
  ChevronDown,
  Check,
  FileText as FileTextIcon,
  Download,
  Upload,
  Info
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useAuthContext } from '~/hooks';
import { useToastContext } from '@librechat/client';
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

// ── Dropdown Select Component ──
const DropdownSelect = ({
  value,
  onChange,
  options,
  placeholder
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
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

  return (
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full min-h-[36px] cursor-pointer items-center justify-between rounded-xl border border-border-medium bg-surface-primary px-3 py-1.5 text-xs text-text-primary transition-all hover:bg-surface-secondary"
      >
        <span className="truncate">{value || placeholder}</span>
        <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-text-secondary transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-[9999] mt-1 max-h-60 w-max min-w-full overflow-y-auto rounded-xl border border-border-medium bg-surface-primary py-1 shadow-2xl dark:bg-surface-secondary">
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => {
                onChange(opt);
                setOpen(false);
              }}
              className="flex w-full items-center justify-between px-3 py-2 text-left text-xs text-text-primary hover:bg-surface-hover"
            >
              <span>{opt}</span>
              {value === opt && <Check className="h-3.5 w-3.5 text-teal-600" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ── SGA Pictograms MultiSelect Component ──
const PictogramsSelect = ({
  selected,
  onChange
}: {
  selected: string[];
  onChange: (v: string[]) => void;
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

  const togglePic = (key: string) => {
    if (selected.includes(key)) {
      onChange(selected.filter(k => k !== key));
    } else {
      onChange([...selected, key]);
    }
  };

  return (
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full min-h-[36px] cursor-pointer items-center justify-between rounded-xl border border-border-medium bg-surface-primary px-3 py-1.5 text-xs text-text-primary transition-all hover:bg-surface-secondary"
      >
        <span className="truncate">
          {selected.length === 0 
            ? 'Ninguno' 
            : selected.map(k => SGA_PICTOGRAMS.find(p => p.key === k)?.icon || '').join(' ')}
        </span>
        <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-text-secondary transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-[9999] mt-1 max-h-60 w-max min-w-full overflow-y-auto rounded-xl border border-border-medium bg-surface-primary py-1 shadow-2xl dark:bg-surface-secondary">
          {SGA_PICTOGRAMS.map((pic) => {
            const isSel = selected.includes(pic.key);
            return (
              <button
                key={pic.key}
                type="button"
                onClick={() => togglePic(pic.key)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-text-primary hover:bg-surface-hover"
              >
                <input
                  type="checkbox"
                  checked={isSel}
                  readOnly
                  className="rounded border-border-medium text-teal-600 focus:ring-teal-500"
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
  conversationId
}: {
  conversationId: string | null;
}) {
  const { token } = useAuthContext();
  const { showToast } = useToastContext();

  const [activeTab, setActiveTab] = useState<'inventario' | 'matriz_cruzada' | 'dashboard' | 'reporte'>('inventario');
  const [matrixRows, setMatrixRows] = useState<MatrixRow[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [aiRowLoading, setAiRowLoading] = useState<number | null>(null);
  
  // Analítica & Reporte
  const [selectedModel, setSelectedModel] = useState(AI_MODELS[0].id);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [reportContent, setReportContent] = useState<string | null>(null);
  const [chartConclusions, setChartConclusions] = useState<Record<string, string>>({});

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
    if (!conversationId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/sgsst/chemical-compatibility/matrix/${conversationId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMatrixRows(data.matrixRows || []);
        setChartConclusions(data.chartConclusions || {});
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

  // Guardar Matriz en Backend
  const saveMatrix = async (rowsToSave = matrixRows, notify = true) => {
    if (!conversationId) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/sgsst/chemical-compatibility/matrix/${conversationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ matrixRows: rowsToSave })
      });
      if (res.ok && notify) {
        showToast({ message: 'Inventario químico guardado exitosamente.', status: 'success', severity: 'success' });
      }
    } catch (e) {
      console.error(e);
      if (notify) showToast({ message: 'Error al guardar el inventario.', status: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  // Agregar fila
  const addRow = () => {
    const newRow: MatrixRow = {
      nombre: '',
      fabricante: 'Desconocido',
      estado_fisico: 'Líquido',
      clasificacion_onu: 'No Peligroso',
      pictogramas_sga: [],
      cantidad_almacenada: '',
      ubicacion: 'N/A',
      tiene_fds: 'Sí',
      tiene_rotulo: 'Sí',
      incompatibilidades: 'Ninguna',
      requisitos_almacenamiento: 'Ninguno'
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
    setReportContent(null);
    try {
      const res = await fetch('/api/sgsst/chemical-compatibility/ai-analyze-matrix', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ matrixRows, modelName: selectedModel })
      });
      if (res.ok) {
        const data = await res.json();
        setReportContent(data.analysis);
        setActiveTab('reporte');
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
    e.target.value = ''; // Reset file input
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
    if (matrixRows.length === 0) {
      showToast({ message: 'El inventario está vacío.', status: 'warning' });
      return;
    }
    try {
      await exportCompatibilidadToExcel(matrixRows);
      showToast({ message: 'Excel exportado exitosamente.', status: 'success' });
    } catch (e) {
      console.error(e);
      showToast({ message: 'Error exportando Excel.', status: 'error' });
    }
  };

  // Paginación
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return matrixRows.slice(start, start + pageSize);
  }, [matrixRows, currentPage, pageSize]);

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-surface-primary text-text-primary">
      {/* ── BARRA SUPERIOR DE ACCIONES ── */}
      <div className="flex flex-shrink-0 items-center justify-between border-b border-border-medium bg-surface-primary px-4 py-3 shadow-sm max-md:flex-wrap max-md:gap-2">
        <div className="flex items-center gap-2">
          <Beaker className="h-5 w-5 text-teal-600 animate-pulse" />
          <h2 className="text-sm font-bold text-text-primary">Matriz de Compatibilidad Química</h2>
        </div>

        {/* Controles de Acción */}
        <div className="flex items-center gap-2 max-md:w-full max-md:justify-between">
          <ModelSelector selectedModel={selectedModel} onSelectModel={setSelectedModel} />
          
          <div className="flex items-center gap-1.5">
            {/* Importar */}
            <button
              onClick={triggerExcelImport}
              disabled={isAiImportLoading}
              className="flex h-9 items-center gap-1.5 rounded-xl border border-border-medium px-3 text-xs font-semibold hover:bg-surface-secondary"
              title="Importar inventario desde Excel"
            >
              {isAiImportLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-teal-600" />
              ) : (
                <Upload className="h-4 w-4 text-text-secondary" />
              )}
              <span className="max-md:hidden">Importar</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleExcelFileChange}
              accept=".xlsx,.xls"
              className="hidden"
            />

            {/* Exportar */}
            <button
              onClick={handleExportExcel}
              className="flex h-9 items-center gap-1.5 rounded-xl border border-border-medium px-3 text-xs font-semibold hover:bg-surface-secondary"
              title="Exportar inventario a Excel"
            >
              <Download className="h-4 w-4 text-text-secondary" />
              <span className="max-md:hidden">Exportar</span>
            </button>

            {/* Auditar con IA */}
            <button
              onClick={handleAnalyzeMatrix}
              disabled={isAnalyzing || matrixRows.length === 0}
              className="flex h-9 items-center gap-1.5 rounded-xl bg-purple-600 px-3 text-xs font-bold text-white shadow-md hover:bg-purple-700 disabled:opacity-50"
            >
              {isAnalyzing ? (
                <Loader2 className="h-4 w-4 animate-spin text-white" />
              ) : (
                <Sparkles className="h-4 w-4 text-purple-200" />
              )}
              <span>Auditar con IA</span>
            </button>

            {/* Guardar */}
            <button
              onClick={() => saveMatrix()}
              disabled={isSaving}
              className="flex h-9 items-center gap-1.5 rounded-xl bg-teal-600 px-3.5 text-xs font-bold text-white shadow-md hover:bg-teal-700 disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin text-white" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>Guardar</span>
            </button>

            {/* Maximizar */}
            <button
              onClick={() => setIsMaximized(!isMaximized)}
              className="inline-flex size-9 items-center justify-center rounded-xl border border-border-medium hover:bg-surface-secondary"
            >
              {isMaximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
          </div>
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
        
        {/* PESTAÑA 1: INVENTARIO */}
        {activeTab === 'inventario' && (
          <div className="h-full flex flex-col p-4">
            {matrixRows.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 text-text-secondary py-16">
                <AlertTriangle className="h-12 w-12 opacity-30 text-teal-500 animate-bounce" />
                <p className="text-center text-sm font-semibold max-w-sm">
                  Aún no hay productos en el inventario químico. Pídele al Especialista en Riesgo Químico en el chat que los registre o agrégalos manualmente.
                </p>
                <button
                  onClick={addRow}
                  className="flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-teal-700"
                >
                  <Plus className="h-4 w-4" /> Añadir Producto Químico
                </button>
              </div>
            ) : (
              <div className="flex flex-col flex-1 gap-4">
                <div className="overflow-x-auto rounded-2xl border border-border-medium bg-surface-primary shadow-sm">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="border-b border-border-medium bg-surface-secondary font-bold text-text-secondary uppercase">
                        <th className="px-4 py-3 min-w-[200px]">Nombre del Producto</th>
                        <th className="px-4 py-3 min-w-[150px]">Fabricante</th>
                        <th className="px-4 py-3 min-w-[100px]">Estado</th>
                        <th className="px-4 py-3 min-w-[220px]">Clase ONU Peligro</th>
                        <th className="px-4 py-3 min-w-[180px]">SGA Pictogramas</th>
                        <th className="px-4 py-3 min-w-[120px]">Cant. Almacenada</th>
                        <th className="px-4 py-3 min-w-[150px]">Ubicación</th>
                        <th className="px-4 py-3 min-w-[80px] text-center">FDS</th>
                        <th className="px-4 py-3 min-w-[80px] text-center">Rótulo</th>
                        <th className="px-4 py-3 text-center min-w-[130px]">IA / Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-medium">
                      {paginatedRows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-surface-secondary/40 transition-colors">
                          {/* Nombre */}
                          <td className="px-4 py-2">
                            <input
                              type="text"
                              value={row.nombre}
                              onChange={(e) => handleCellChange(idx, 'nombre', e.target.value)}
                              placeholder="Ej. Nitrato de Sodio"
                              className="w-full rounded-xl border-border-medium bg-transparent px-2.5 py-1 text-xs text-text-primary focus:border-teal-500 focus:ring-teal-500"
                            />
                          </td>
                          {/* Fabricante */}
                          <td className="px-4 py-2">
                            <input
                              type="text"
                              value={row.fabricante}
                              onChange={(e) => handleCellChange(idx, 'fabricante', e.target.value)}
                              className="w-full rounded-xl border-border-medium bg-transparent px-2.5 py-1 text-xs text-text-primary focus:border-teal-500 focus:ring-teal-500"
                            />
                          </td>
                          {/* Estado */}
                          <td className="px-4 py-2">
                            <DropdownSelect
                              value={row.estado_fisico}
                              onChange={(v) => handleCellChange(idx, 'estado_fisico', v)}
                              options={ESTADO_OPCIONES}
                              placeholder="Estado"
                            />
                          </td>
                          {/* Clase ONU */}
                          <td className="px-4 py-2">
                            <DropdownSelect
                              value={row.clasificacion_onu}
                              onChange={(v) => handleCellChange(idx, 'clasificacion_onu', v)}
                              options={CLASES_ONU}
                              placeholder="Clase ONU"
                            />
                          </td>
                          {/* Pictogramas */}
                          <td className="px-4 py-2">
                            <PictogramsSelect
                              selected={row.pictogramas_sga || []}
                              onChange={(v) => handleCellChange(idx, 'pictogramas_sga', v)}
                            />
                          </td>
                          {/* Cantidad */}
                          <td className="px-4 py-2">
                            <input
                              type="text"
                              value={row.cantidad_almacenada}
                              onChange={(e) => handleCellChange(idx, 'cantidad_almacenada', e.target.value)}
                              placeholder="Ej. 10 Gal"
                              className="w-full rounded-xl border-border-medium bg-transparent px-2.5 py-1 text-xs text-text-primary focus:border-teal-500 focus:ring-teal-500"
                            />
                          </td>
                          {/* Ubicación */}
                          <td className="px-4 py-2">
                            <input
                              type="text"
                              value={row.ubicacion}
                              onChange={(e) => handleCellChange(idx, 'ubicacion', e.target.value)}
                              placeholder="Ej. Bodega Principal"
                              className="w-full rounded-xl border-border-medium bg-transparent px-2.5 py-1 text-xs text-text-primary focus:border-teal-500 focus:ring-teal-500"
                            />
                          </td>
                          {/* FDS */}
                          <td className="px-4 py-2 text-center">
                            <select
                              value={row.tiene_fds}
                              onChange={(e) => handleCellChange(idx, 'tiene_fds', e.target.value)}
                              className="rounded-xl border-border-medium bg-transparent py-1 text-xs text-text-primary focus:border-teal-500 focus:ring-0"
                            >
                              <option value="Sí">Sí</option>
                              <option value="No">No</option>
                            </select>
                          </td>
                          {/* Rotulado */}
                          <td className="px-4 py-2 text-center">
                            <select
                              value={row.tiene_rotulo}
                              onChange={(e) => handleCellChange(idx, 'tiene_rotulo', e.target.value)}
                              className="rounded-xl border-border-medium bg-transparent py-1 text-xs text-text-primary focus:border-teal-500 focus:ring-0"
                            >
                              <option value="Sí">Sí</option>
                              <option value="No">No</option>
                            </select>
                          </td>
                          {/* IA / Acciones */}
                          <td className="px-4 py-2 flex items-center justify-center gap-1.5 h-full">
                            <button
                              onClick={() => handleAiUpdateRow(idx)}
                              disabled={aiRowLoading === idx}
                              className="flex items-center gap-1 rounded-lg border border-purple-500/30 bg-purple-500/10 px-2 py-1 text-[10px] font-bold text-purple-600 hover:bg-purple-500 hover:text-white disabled:opacity-50"
                              title="Analizar y autocompletar producto con IA"
                            >
                              {aiRowLoading === idx ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Sparkles className="h-3 w-3" />
                              )}
                              <span>IA</span>
                            </button>
                            <button
                              onClick={() => deleteRow(idx)}
                              className="rounded-lg border border-red-500/30 bg-red-500/10 p-1 text-red-600 hover:bg-red-600 hover:text-white"
                              title="Eliminar producto"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between">
                  <button
                    onClick={addRow}
                    className="flex items-center gap-1.5 rounded-xl border border-teal-500/30 bg-teal-500/10 px-4 py-2 text-xs font-bold text-teal-600 hover:bg-teal-600 hover:text-white"
                  >
                    <Plus className="h-4 w-4" /> Añadir Producto
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PESTAÑA 2: MATRIZ CRUZADA */}
        {activeTab === 'matriz_cruzada' && (
          <div className="p-6 h-full flex flex-col gap-6 relative">
            <div className="rounded-2xl border border-border-medium bg-surface-primary p-5 shadow-sm">
              <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                <Info className="h-4 w-4 text-teal-600" /> Cuadrícula de Compatibilidad Química
              </h3>
              <p className="mt-1 text-xs text-text-secondary">
                Cruza cada producto del inventario para evaluar la seguridad de almacenamiento conjunto. Haz click en una celda para ver los detalles.
              </p>
            </div>

            {matrixRows.length <= 1 ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-2 text-text-secondary py-16">
                <AlertTriangle className="h-10 w-10 opacity-30 text-teal-500" />
                <p className="text-xs text-center">Registra al menos 2 productos en el inventario para construir la cuadrícula cruzada.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                <div className="overflow-auto max-w-full rounded-2xl border border-border-medium bg-surface-primary shadow-sm p-4">
                  <table className="border-collapse">
                    <thead>
                      <tr>
                        {/* Celda superior izquierda vacía */}
                        <th className="border border-border-medium bg-surface-secondary p-3 text-xs font-bold text-text-primary text-center min-w-[130px] max-w-[180px] truncate">
                          Productos
                        </th>
                        {/* Headers Columnas (Nombre Productos) */}
                        {matrixRows.map(p => (
                          <th
                            key={p.id}
                            className="border border-border-medium bg-surface-secondary p-3 text-xs font-bold text-text-primary text-center min-w-[100px] max-w-[150px] truncate"
                            title={p.nombre}
                          >
                            {p.nombre}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {matrixRows.map((rowI) => (
                        <tr key={rowI.id}>
                          {/* Headers Filas (Nombre Producto) */}
                          <td
                            className="border border-border-medium bg-surface-secondary p-3 text-xs font-bold text-text-primary truncate max-w-[180px]"
                            title={rowI.nombre}
                          >
                            {rowI.nombre}
                          </td>
                          {/* Celdas cruzadas de compatibilidad */}
                          {matrixRows.map((rowJ) => {
                            const compat = getChemicalCompatibility(rowI.clasificacion_onu, rowJ.clasificacion_onu);
                            let bgClass = 'bg-green-500 hover:bg-green-600';
                            if (compat.status === 'incompatible') bgClass = 'bg-red-500 hover:bg-red-600';
                            else if (compat.status === 'caution') bgClass = 'bg-yellow-500 hover:bg-yellow-600';

                            return (
                              <td key={rowJ.id} className="border border-border-medium p-2 text-center">
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
                <div className="flex items-center gap-6 justify-center text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-green-500" />
                    <span className="text-text-secondary font-semibold">Compatible</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-yellow-500" />
                    <span className="text-text-secondary font-semibold">Precaución / Verificar FDS</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-red-500" />
                    <span className="text-text-secondary font-semibold">Incompatible / Segregar</span>
                  </div>
                </div>
              </div>
            )}

            {/* POPUP / SIDE DRAWER DETALLE DE COMPATIBILIDAD */}
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
                    {/* Cruce */}
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

                    {/* Estatus */}
                    <div className="flex items-center gap-2">
                      <div className={`h-4.5 w-4.5 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${
                        selectedCrossCell.result.status === 'incompatible' 
                          ? 'bg-red-500' 
                          : selectedCrossCell.result.status === 'caution' 
                            ? 'bg-yellow-500' 
                            : 'bg-green-500'
                      }`}>
                        {selectedCrossCell.result.status === 'incompatible' ? 'X' : selectedCrossCell.result.status === 'caution' ? '!' : '✓'}
                      </div>
                      <span className={`text-xs font-bold uppercase tracking-wider ${
                        selectedCrossCell.result.status === 'incompatible' 
                          ? 'text-red-600 dark:text-red-400' 
                          : selectedCrossCell.result.status === 'caution' 
                            ? 'text-yellow-600 dark:text-yellow-400' 
                            : 'text-green-600 dark:text-green-400'
                      }`}>
                        {selectedCrossCell.result.status}
                      </span>
                    </div>

                    {/* Razón Técnica */}
                    <div className="text-xs">
                      <strong className="text-text-primary block mb-1">Razón Técnica:</strong>
                      <p className="text-text-secondary bg-surface-secondary/40 p-2.5 rounded-xl border border-border-light">{selectedCrossCell.result.reason}</p>
                    </div>

                    {/* Recomendación ARL / NTC */}
                    <div className="text-xs">
                      <strong className="text-text-primary block mb-1">Recomendación de Segregación:</strong>
                      <p className="text-text-secondary bg-surface-secondary/40 p-2.5 rounded-xl border border-border-light">{selectedCrossCell.result.recommendation}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PESTAÑA 3: DASHBOARD */}
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

        {/* PESTAÑA 4: REPORTE */}
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
                    ref={useRef<LiveEditorHandle>(null)}
                    isEditable={false}
                  />
                </div>
              </div>
            )}
          </div>
        )}

      </div>

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
