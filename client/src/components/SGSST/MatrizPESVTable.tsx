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
  Loader2,
  Sparkles,
  ChevronDown,
  Check,
  FileText as FileTextIcon,
  Upload,
  Download,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useAuthContext } from '~/hooks';
import {
  MatrixRow,
  ACTORES_VIALES,
  FACTORES_RIESGO,
  PROBABILIDAD_ESCALA,
  SEVERIDAD_ESCALA,
} from './MatrizPESVConstants';
import MatrizPESVDashboard from './MatrizPESVDashboard';
import ModelSelector, { AI_MODELS } from './ModelSelector';
import { exportMatrizPESVToExcel } from './exportPESV';
import LiveEditor, { type LiveEditorHandle } from '~/components/Liva/Editor/LiveEditor';

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
        className="flex h-8 min-w-[160px] max-w-[220px] cursor-pointer items-center gap-1.5 rounded-xl border border-border-medium bg-surface-primary pl-3 pr-2 text-xs text-text-primary transition-all hover:border-sky-500 hover:bg-surface-secondary"
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

export default function MatrizPESVTable({ conversationId }: { conversationId: string | null }) {
  const { token } = useAuthContext();
  const [isMaximized, setIsMaximized] = useRecoilState(store.pesvMaximized);
  
  const [rows, setRows] = useState<MatrixRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  // Filters
  const [filterProceso, setFilterProceso] = useState('');
  const [filterActor, setFilterActor] = useState('');
  const [filterNivel, setFilterNivel] = useState('');

  // Local selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'matrix' | 'dashboard'>('matrix');

  // AI & manual conclusions
  const [savedConclusions, setSavedConclusions] = useState<Record<string, string>>({});
  const [selectedAIModel, setSelectedAIModel] = useState(AI_MODELS[0].value);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportHTML, setReportHTML] = useState('');
  const editorRef = useRef<LiveEditorHandle>(null);

  // Modal editor for editing a row
  const [editingRow, setEditingRow] = useState<MatrixRow | null>(null);

  const targetConvoId = conversationId || 'new';

  const fetchMatrix = useCallback(async () => {
    if (!conversationId || conversationId === 'new') {
      setRows([]);
      setSavedConclusions({});
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/sgsst/pesv-workspace/matrix/${conversationId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.matrixRows) {
        setRows(data.matrixRows);
      }
      if (data.chartConclusions) {
        setSavedConclusions(data.chartConclusions);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [conversationId, token]);

  useEffect(() => {
    fetchMatrix();
  }, [fetchMatrix]);

  const saveMatrix = async (updatedRows = rows) => {
    if (!conversationId || conversationId === 'new') return;
    setSaving(true);
    try {
      const res = await fetch(`/api/sgsst/pesv-workspace/matrix/${conversationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ matrixRows: updatedRows })
      });
      const data = await res.json();
      if (data.success) {
        setRows(data.matrixRows);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const getPESVColor = (nr: number) => {
    if (nr >= 200) return { bg: 'bg-red-500', text: 'text-red-600 font-bold', label: 'Crítico' };
    if (nr >= 100) return { bg: 'bg-orange-500', text: 'text-orange-600 font-bold', label: 'Alto' };
    if (nr >= 40) return { bg: 'bg-yellow-500', text: 'text-yellow-600 font-bold', label: 'Medio' };
    return { bg: 'bg-green-500', text: 'text-green-600 font-bold', label: 'Bajo' };
  };

  const processOptions = useMemo(() => {
    const set = new Set(rows.map((r) => r.proceso).filter(Boolean));
    return Array.from(set).map((p) => ({ value: p, label: p }));
  }, [rows]);

  const actorOptions = useMemo(() => {
    return ACTORES_VIALES.map((a) => ({ value: a, label: a }));
  }, []);

  const levelOptions = [
    { value: 'Crítico', label: 'Crítico (>=200)' },
    { value: 'Alto', label: 'Alto (100-199)' },
    { value: 'Medio', label: 'Medio (40-99)' },
    { value: 'Bajo', label: 'Bajo (<40)' },
  ];

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      if (filterProceso && r.proceso !== filterProceso) return false;
      if (filterActor && r.actor_vial !== filterActor) return false;
      if (filterNivel) {
        const nr = (r.probabilidad || 0) * (r.severidad || 0);
        const classification = getPESVColor(nr).label;
        if (classification !== filterNivel) return false;
      }
      return true;
    });
  }, [rows, filterProceso, filterActor, filterNivel]);

  // Bulk deletion
  const handleDeleteSelected = () => {
    if (window.confirm(`¿Estás seguro de eliminar los ${selectedIds.length} peligros seleccionados?`)) {
      const updated = rows.filter((r) => !selectedIds.includes(r.id || ''));
      setRows(updated);
      setSelectedIds([]);
      saveMatrix(updated);
    }
  };

  // Add row
  const handleAddRow = () => {
    const newRow: MatrixRow = {
      id: Date.now().toString() + Math.random().toString(36).substring(7),
      proceso: 'General',
      zona: 'Vías internas / Trayecto',
      actor_vial: 'Conductor de vehículo liviano',
      tipo_desplazamiento: 'Misional',
      factor_riesgo: 'Factor Humano',
      peligro_descripcion: 'Fatiga / Microsueños',
      consecuencias: 'Accidente de tránsito, colisión, traumas, fatalidad.',
      controles_existentes_persona: 'Ninguno',
      controles_existentes_vehiculo: 'Ninguno',
      controles_existentes_via: 'Ninguno',
      probabilidad: 2,
      severidad: 60,
      medida_eliminacion: 'Ninguno',
      medida_sustitucion: 'Ninguno',
      medida_ingenieria: 'Ninguno',
      medida_administrativa: 'Capacitación en higiene del sueño',
      medida_eppu: 'Cinturón de seguridad',
      factores_reduccion: 'Mitiga probabilidad de microsueños mediante concientización.',
      responsable: 'Responsable PESV',
    };
    const updated = [...rows, newRow];
    setRows(updated);
    saveMatrix(updated);
  };

  // Inline inputs change
  const handleRowChange = (id: string, field: keyof MatrixRow, val: any) => {
    const updated = rows.map((r) => {
      if (r.id === id) {
        const updatedRow = { ...r, [field]: val };
        // Recalcular Nivel de Riesgo
        if (field === 'probabilidad' || field === 'severidad') {
          const prob = Number(updatedRow.probabilidad) || 0;
          const sev = Number(updatedRow.severidad) || 0;
          updatedRow.nivel_riesgo = prob * sev;
          const colorObj = getPESVColor(updatedRow.nivel_riesgo);
          updatedRow.interpretacion_nr = colorObj.label;
          updatedRow.aceptabilidad = updatedRow.nivel_riesgo >= 200 ? 'No Aceptable' : 'Aceptable con Control Específico';
        }
        return updatedRow;
      }
      return r;
    });
    setRows(updated);
  };

  // AI Update row
  const handleAIUpdateRow = async (row: MatrixRow) => {
    setLoading(true);
    try {
      const res = await fetch('/api/sgsst/pesv-workspace/ai-update-row', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ row, modelName: selectedAIModel })
      });
      const data = await res.json();
      if (data.updatedFields) {
        const updated = rows.map((r) => {
          if (r.id === row.id) {
            return { ...r, ...data.updatedFields };
          }
          return r;
        });
        setRows(updated);
        saveMatrix(updated);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Excel Import
  const handleExcelImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const ws = workbook.Sheets[workbook.SheetNames[0]];
        const rawJson: any[] = XLSX.utils.sheet_to_json(ws);
        
        setLoading(true);
        const res = await fetch('/api/sgsst/pesv-workspace/ai-parse-matrix', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ rawRows: rawJson, modelName: selectedAIModel })
        });
        const result = await res.json();
        if (result.matrixRows) {
          const merged = [...rows, ...result.matrixRows];
          setRows(merged);
          saveMatrix(merged);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  // AI Generate compliance report
  const handleGenerateReport = async () => {
    setAnalyzing(true);
    setIsReportOpen(true);
    try {
      const res = await fetch('/api/sgsst/pesv-workspace/ai-analyze-matrix', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ matrixRows: rows, modelName: selectedAIModel })
      });
      const data = await res.json();
      if (data.analysis) {
        setReportHTML(data.analysis);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-surface-primary overflow-hidden">
      {/* Table Toolbar / Control Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-border-medium px-4 py-2.5 bg-surface-secondary gap-3 select-none">
        <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400">
          <Truck className="h-5 w-5" />
          <span className="font-bold text-sm">Matriz PESV (Seguridad Vial)</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Tabs */}
          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${activeTab === 'matrix' ? 'bg-sky-500 text-white' : 'hover:bg-surface-hover text-text-secondary'}`}
          >
            Matriz
          </button>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${activeTab === 'dashboard' ? 'bg-sky-500 text-white' : 'hover:bg-surface-hover text-text-secondary'}`}
          >
            Dashboard
          </button>

          <div className="h-4 w-px bg-border-medium" />

          {/* Model Selector */}
          <ModelSelector value={selectedAIModel} onChange={setSelectedAIModel} />

          {/* Expand Button */}
          <button
            onClick={() => setIsMaximized(!isMaximized)}
            className="p-1.5 rounded-xl hover:bg-surface-hover text-text-secondary cursor-pointer transition-colors"
          >
            {isMaximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {activeTab === 'dashboard' ? (
        <div className="flex-1 overflow-y-auto p-4">
          <MatrizPESVDashboard
            matrixRows={rows}
            conversationId={conversationId}
            token={token}
            savedConclusions={savedConclusions}
            onConclusionSaved={(type, text) => setSavedConclusions(prev => ({ ...prev, [type]: text }))}
            isMaximized={isMaximized}
          />
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-between border-b border-border-medium p-3 bg-surface-primary gap-2 z-30">
            <div className="flex items-center gap-2 flex-wrap">
              <FilterSelect
                value={filterProceso}
                onChange={setFilterProceso}
                options={processOptions}
                placeholder="Filtrar Proceso"
              />
              <FilterSelect
                value={filterActor}
                onChange={setFilterActor}
                options={actorOptions}
                placeholder="Filtrar Actor Vial"
              />
              <FilterSelect
                value={filterNivel}
                onChange={setFilterNivel}
                options={levelOptions}
                placeholder="Filtrar Criticidad"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Import Excel */}
              <label className="group flex items-center justify-center p-2 h-[36px] bg-surface-secondary border border-border-medium rounded-[16px] text-text-secondary transition-all hover:bg-surface-hover cursor-pointer">
                <Upload className="h-4 w-4 shrink-0" />
                <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 transition-all duration-300 whitespace-nowrap group-hover:ml-2 text-xs font-bold">Importar Excel</span>
                <input type="file" accept=".xlsx,.xls" onChange={handleExcelImport} className="hidden" />
              </label>

              {/* Export Excel */}
              <button
                onClick={() => exportMatrizPESVToExcel(rows)}
                className="group flex items-center justify-center p-2 h-[36px] bg-surface-secondary border border-border-medium rounded-[16px] text-text-secondary transition-all hover:bg-surface-hover cursor-pointer"
              >
                <Download className="h-4 w-4 shrink-0" />
                <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 transition-all duration-300 whitespace-nowrap group-hover:ml-2 text-xs font-bold">Exportar Excel</span>
              </button>

              {/* AI Report */}
              <button
                onClick={handleGenerateReport}
                className="group flex items-center justify-center p-2 h-[36px] bg-sky-600 rounded-[16px] text-white transition-all hover:bg-sky-700 cursor-pointer"
              >
                <FileTextIcon className="h-4 w-4 shrink-0" />
                <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 transition-all duration-300 whitespace-nowrap group-hover:ml-2 text-xs font-bold">Informe PESV</span>
              </button>

              <div className="h-4 w-px bg-border-medium" />

              {/* Add and Save */}
              <button
                onClick={handleAddRow}
                className="flex items-center gap-1 px-3 py-1.5 bg-sky-500 text-white rounded-xl text-xs font-bold hover:bg-sky-600 transition-colors cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" /> Nuevo Peligro
              </button>
              <button
                onClick={() => saveMatrix()}
                disabled={saving}
                className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 disabled:opacity-50 transition-colors cursor-pointer"
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Guardar
              </button>

              {selectedIds.length > 0 && (
                <button
                  onClick={handleDeleteSelected}
                  className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white rounded-xl text-xs font-bold hover:bg-red-600 transition-colors cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Eliminar ({selectedIds.length})
                </button>
              )}
            </div>
          </div>

          {/* Grid spreadsheet view */}
          <div className="flex-1 overflow-auto min-h-0 bg-surface-secondary">
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
              </div>
            ) : filteredRows.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-text-secondary">
                <AlertTriangle className="h-8 w-8 mb-2 text-yellow-500" />
                <p className="text-xs">No hay peligros viales registrados para este filtro.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse min-w-[2000px] table-fixed">
                <thead className="sticky top-0 bg-surface-secondary z-10 border-b border-border-medium">
                  <tr className="h-10 text-[11px] font-bold text-text-secondary uppercase tracking-wider">
                    <th className="w-12 text-center">Sel</th>
                    <th className="w-48 px-3">Proceso</th>
                    <th className="w-48 px-3">Zona / Trayecto</th>
                    <th className="w-48 px-3">Actor Vial</th>
                    <th className="w-36 px-3 text-center">Desplazamiento</th>
                    <th className="w-40 px-3">Factor de Riesgo</th>
                    <th className="w-72 px-3">Descripción Peligro</th>
                    <th className="w-64 px-3">Efectos / Consecuencias</th>
                    <th className="w-48 px-3">Ctrl. Persona</th>
                    <th className="w-48 px-3">Ctrl. Vehículo</th>
                    <th className="w-48 px-3">Ctrl. Vía / Entorno</th>
                    <th className="w-24 px-3 text-center">Prob (1-4)</th>
                    <th className="w-24 px-3 text-center">Sev (10-100)</th>
                    <th className="w-28 px-3 text-center">NR</th>
                    <th className="w-36 px-3 text-center">Criticidad</th>
                    <th className="w-36 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-light bg-surface-primary">
                  {filteredRows.map((row) => {
                    const nr = (row.probabilidad || 0) * (row.severidad || 0);
                    const color = getPESVColor(nr);

                    return (
                      <tr key={row.id} className="h-12 text-xs hover:bg-surface-secondary/50 group">
                        <td className="text-center">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(row.id || '')}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedIds([...selectedIds, row.id || '']);
                              else setSelectedIds(selectedIds.filter((id) => id !== row.id));
                            }}
                            className="rounded accent-sky-500"
                          />
                        </td>
                        <td className="px-2">
                          <input
                            type="text"
                            value={row.proceso}
                            onChange={(e) => handleRowChange(row.id || '', 'proceso', e.target.value)}
                            className="w-full bg-transparent border-0 focus:ring-1 focus:ring-sky-500 rounded p-1.5 truncate"
                          />
                        </td>
                        <td className="px-2">
                          <input
                            type="text"
                            value={row.zona}
                            onChange={(e) => handleRowChange(row.id || '', 'zona', e.target.value)}
                            className="w-full bg-transparent border-0 focus:ring-1 focus:ring-sky-500 rounded p-1.5 truncate"
                          />
                        </td>
                        <td className="px-2">
                          <select
                            value={row.actor_vial}
                            onChange={(e) => handleRowChange(row.id || '', 'actor_vial', e.target.value)}
                            className="w-full bg-transparent border-0 focus:ring-1 focus:ring-sky-500 rounded p-1"
                          >
                            {ACTORES_VIALES.map((a) => (
                              <option key={a} value={a}>{a}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-2 text-center">
                          <select
                            value={row.tipo_desplazamiento}
                            onChange={(e) => handleRowChange(row.id || '', 'tipo_desplazamiento', e.target.value)}
                            className="bg-transparent border-0 focus:ring-1 focus:ring-sky-500 rounded p-1"
                          >
                            <option value="Misional">Misional</option>
                            <option value="In itinere">In itinere</option>
                          </select>
                        </td>
                        <td className="px-2">
                          <select
                            value={row.factor_riesgo}
                            onChange={(e) => handleRowChange(row.id || '', 'factor_riesgo', e.target.value)}
                            className="w-full bg-transparent border-0 focus:ring-1 focus:ring-sky-500 rounded p-1"
                          >
                            {FACTORES_RIESGO.map((f) => (
                              <option key={f} value={f}>{f}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-2">
                          <input
                            type="text"
                            value={row.peligro_descripcion}
                            onChange={(e) => handleRowChange(row.id || '', 'peligro_descripcion', e.target.value)}
                            className="w-full bg-transparent border-0 focus:ring-1 focus:ring-sky-500 rounded p-1.5 truncate"
                          />
                        </td>
                        <td className="px-2">
                          <input
                            type="text"
                            value={row.consecuencias}
                            onChange={(e) => handleRowChange(row.id || '', 'consecuencias', e.target.value)}
                            className="w-full bg-transparent border-0 focus:ring-1 focus:ring-sky-500 rounded p-1.5 truncate"
                          />
                        </td>
                        <td className="px-2">
                          <input
                            type="text"
                            value={row.controles_existentes_persona}
                            onChange={(e) => handleRowChange(row.id || '', 'controles_existentes_persona', e.target.value)}
                            className="w-full bg-transparent border-0 focus:ring-1 focus:ring-sky-500 rounded p-1.5 truncate"
                          />
                        </td>
                        <td className="px-2">
                          <input
                            type="text"
                            value={row.controles_existentes_vehiculo}
                            onChange={(e) => handleRowChange(row.id || '', 'controles_existentes_vehiculo', e.target.value)}
                            className="w-full bg-transparent border-0 focus:ring-1 focus:ring-sky-500 rounded p-1.5 truncate"
                          />
                        </td>
                        <td className="px-2">
                          <input
                            type="text"
                            value={row.controles_existentes_via}
                            onChange={(e) => handleRowChange(row.id || '', 'controles_existentes_via', e.target.value)}
                            className="w-full bg-transparent border-0 focus:ring-1 focus:ring-sky-500 rounded p-1.5 truncate"
                          />
                        </td>
                        <td className="px-2 text-center">
                          <select
                            value={row.probabilidad}
                            onChange={(e) => handleRowChange(row.id || '', 'probabilidad', Number(e.target.value))}
                            className="bg-transparent border-0 focus:ring-1 focus:ring-sky-500 rounded p-1 font-bold"
                          >
                            {PROBABILIDAD_ESCALA.map((p) => (
                              <option key={p.value} value={p.value}>{p.value}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-2 text-center">
                          <select
                            value={row.severidad}
                            onChange={(e) => handleRowChange(row.id || '', 'severidad', Number(e.target.value))}
                            className="bg-transparent border-0 focus:ring-1 focus:ring-sky-500 rounded p-1 font-bold"
                          >
                            {SEVERIDAD_ESCALA.map((s) => (
                              <option key={s.value} value={s.value}>{s.value}</option>
                            ))}
                          </select>
                        </td>
                        <td className="text-center font-bold">{nr}</td>
                        <td className={`text-center ${color.text}`}>{color.label}</td>
                        <td className="text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Gemini Autocomplete */}
                            <button
                              onClick={() => handleAIUpdateRow(row)}
                              className="p-1 rounded bg-sky-50 dark:bg-sky-900/20 text-sky-600 hover:bg-sky-100 transition-colors cursor-pointer"
                              title="Autocompletar con IA"
                            >
                              <Sparkles className="h-3.5 w-3.5" />
                            </button>
                            {/* Row Edit Modal Trigger */}
                            <button
                              onClick={() => setEditingRow(row)}
                              className="px-2 py-1 bg-surface-secondary border border-border-medium rounded text-[10px] hover:bg-surface-hover transition-colors cursor-pointer"
                            >
                              Editar
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Row Edit Modal */}
      {editingRow && (
        <div className="fixed inset-0 z-[9995] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-surface-primary border border-border-medium rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[85vh] overflow-hidden">
            <div className="border-b border-border-medium p-4 flex justify-between items-center bg-surface-secondary">
              <h3 className="font-bold text-sm text-text-primary">Editar Medidas de Intervención (PESV)</h3>
              <button onClick={() => setEditingRow(null)} className="text-text-secondary hover:text-text-primary text-xs cursor-pointer">Cerrar</button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase font-bold text-text-secondary">Proceso</label>
                  <input type="text" className="w-full bg-surface-primary border border-border-medium rounded-xl p-2 text-xs outline-none" value={editingRow.proceso} onChange={(e) => setEditingRow({ ...editingRow, proceso: e.target.value })} />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-text-secondary">Zona/Trayecto</label>
                  <input type="text" className="w-full bg-surface-primary border border-border-medium rounded-xl p-2 text-xs outline-none" value={editingRow.zona} onChange={(e) => setEditingRow({ ...editingRow, zona: e.target.value })} />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-text-secondary">Descripción del Peligro Vial</label>
                <textarea className="w-full bg-surface-primary border border-border-medium rounded-xl p-2 text-xs outline-none" rows={2} value={editingRow.peligro_descripcion} onChange={(e) => setEditingRow({ ...editingRow, peligro_descripcion: e.target.value })} />
              </div>

              <div className="border-t border-border-medium pt-3 space-y-3">
                <h4 className="text-xs font-bold text-sky-600 uppercase">Jerarquía de Controles Propuestos</h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-text-secondary">Eliminación</label>
                    <input type="text" className="w-full bg-surface-primary border border-border-medium rounded-xl p-2 text-xs outline-none" value={editingRow.medida_eliminacion} onChange={(e) => setEditingRow({ ...editingRow, medida_eliminacion: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-text-secondary">Sustitución</label>
                    <input type="text" className="w-full bg-surface-primary border border-border-medium rounded-xl p-2 text-xs outline-none" value={editingRow.medida_sustitucion} onChange={(e) => setEditingRow({ ...editingRow, medida_sustitucion: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-text-secondary">Controles de Ingeniería / Seguridad Pasiva</label>
                    <input type="text" className="w-full bg-surface-primary border border-border-medium rounded-xl p-2 text-xs outline-none" value={editingRow.medida_ingenieria} onChange={(e) => setEditingRow({ ...editingRow, medida_ingenieria: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-text-secondary">Controles Administrativos (Rutograma, etc.)</label>
                    <input type="text" className="w-full bg-surface-primary border border-border-medium rounded-xl p-2 text-xs outline-none" value={editingRow.medida_administrativa} onChange={(e) => setEditingRow({ ...editingRow, medida_administrativa: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-text-secondary">EPP y Equipos Auxiliares</label>
                    <input type="text" className="w-full bg-surface-primary border border-border-medium rounded-xl p-2 text-xs outline-none" value={editingRow.medida_eppu} onChange={(e) => setEditingRow({ ...editingRow, medida_eppu: e.target.value })} />
                  </div>
                </div>
              </div>

              <div className="border-t border-border-medium pt-3 space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-text-secondary">Responsable de Control</label>
                    <input type="text" className="w-full bg-surface-primary border border-border-medium rounded-xl p-2 text-xs outline-none" value={editingRow.responsable} onChange={(e) => setEditingRow({ ...editingRow, responsable: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-text-secondary">Factores de Reducción (Justificación Costo-Beneficio)</label>
                  <textarea className="w-full bg-surface-primary border border-border-medium rounded-xl p-2 text-xs outline-none" rows={3} value={editingRow.factores_reduccion} onChange={(e) => setEditingRow({ ...editingRow, factores_reduccion: e.target.value })} />
                </div>
              </div>
            </div>

            <div className="border-t border-border-medium p-4 flex justify-end gap-2 bg-surface-secondary">
              <button onClick={() => setEditingRow(null)} className="px-3 py-1.5 rounded-xl border border-border-medium hover:bg-surface-hover text-xs font-semibold cursor-pointer">Cancelar</button>
              <button
                onClick={() => {
                  const updated = rows.map((r) => (r.id === editingRow.id ? editingRow : r));
                  setRows(updated);
                  saveMatrix(updated);
                  setEditingRow(null);
                }}
                className="px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold cursor-pointer"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Compliance HTML Report Modal */}
      {isReportOpen &&
        ReactDOM.createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4">
            <div className="bg-surface-primary border border-border-medium rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden">
              <div className="border-b border-border-medium p-4 flex justify-between items-center bg-surface-secondary">
                <div className="flex items-center gap-2">
                  <FileTextIcon className="h-5 w-5 text-sky-600" />
                  <span className="font-bold text-sm text-text-primary">Informe Ejecutivo PESV</span>
                </div>
                <button onClick={() => setIsReportOpen(false)} className="text-text-secondary hover:text-text-primary text-xs cursor-pointer">Cerrar</button>
              </div>

              <div className="flex-1 min-h-0 relative">
                <LiveEditor
                  ref={editorRef}
                  initialHtml={reportHTML}
                  documentId={`pesv-report-${targetConvoId}`}
                  onChange={() => {}}
                  isRitMode={false}
                />
                {analyzing && (
                  <div className="absolute inset-0 bg-surface-primary/80 flex flex-col items-center justify-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
                    <span className="text-xs text-text-secondary font-bold">Generando auditoría vial con Inteligencia Artificial...</span>
                  </div>
                )}
              </div>

              <div className="border-t border-border-medium p-4 flex justify-end gap-2 bg-surface-secondary select-none">
                <button onClick={() => setIsReportOpen(false)} className="px-4 py-2 rounded-xl border border-border-medium hover:bg-surface-hover text-xs font-semibold cursor-pointer">Cerrar</button>
                <button onClick={() => editorRef.current?.downloadPdf()} disabled={analyzing} className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold cursor-pointer disabled:opacity-50">Descargar PDF</button>
              </div>
            </div>
          </div>,
          document.body
        )
      }
    </div>
  );
}
