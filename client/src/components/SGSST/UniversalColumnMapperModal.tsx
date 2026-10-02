import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileSpreadsheet,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
  Search,
  BookmarkCheck,
  Trash2,
  Save,
  RotateCcw,
  Eye,
  Columns3,
  Layers,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  TargetFieldDef,
  SheetInfo,
  parseWorkbookSheets,
  autoMatchColumns,
  transformRowsWithMapping,
  saveTemplate,
  getSavedTemplates,
  deleteSavedTemplate,
  SavedTemplate,
} from './columnMapperEngine';

interface UniversalColumnMapperModalProps {
  isOpen: boolean;
  onClose: () => void;
  moduleKey: string;
  moduleTitle: string;
  targetFields: TargetFieldDef[];
  fileData?: ArrayBuffer | null;
  onConfirmImport: (mappedRows: any[], summary: { total: number; valid: number; skipped: number }) => void;
  emptyTemplate?: Record<string, any>;
}

export default function UniversalColumnMapperModal({
  isOpen,
  onClose,
  moduleKey,
  moduleTitle,
  targetFields,
  fileData,
  onConfirmImport,
  emptyTemplate = {},
}: UniversalColumnMapperModalProps) {
  // ─── Estados Principales ──────────────────────────────────────────────────
  const [sheets, setSheets] = useState<SheetInfo[]>([]);
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [selectedSheetIndex, setSelectedSheetIndex] = useState<number>(0);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  
  // ─── Estados de Navegación y Filtros ──────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'mapping' | 'preview'>('mapping');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterMode, setFilterMode] = useState<'all' | 'required' | 'unmapped'>('all');
  
  // ─── Plantillas Guardadas ─────────────────────────────────────────────────
  const [savedTemplates, setSavedTemplates] = useState<SavedTemplate[]>([]);
  const [isSavingTemplate, setIsSavingTemplate] = useState<boolean>(false);
  const [templateNameInput, setTemplateNameInput] = useState<string>('');
  const [selectedTemplateName, setSelectedTemplateName] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // ─── 1. Procesar archivo Excel al abrir ────────────────────────────────────
  useEffect(() => {
    if (!isOpen || !fileData) {
      setSheets([]);
      setWorkbook(null);
      setMapping({});
      return;
    }

    try {
      const parsed = parseWorkbookSheets(fileData);
      setWorkbook(parsed.workbook);
      setSheets(parsed.sheets);
      setSelectedSheetIndex(0);

      if (parsed.sheets.length > 0) {
        const initialMapping = autoMatchColumns(targetFields, parsed.sheets[0].headers);
        setMapping(initialMapping);
      }

      // Cargar plantillas previas de este módulo
      const templates = getSavedTemplates(moduleKey);
      setSavedTemplates(templates);
    } catch (err) {
      console.error('Error al procesar el archivo Excel para mapeo:', err);
    }
  }, [isOpen, fileData, moduleKey, targetFields]);

  // Hoja activa actual
  const currentSheet = sheets[selectedSheetIndex] || null;

  // ─── 2. Cambiar de Hoja ───────────────────────────────────────────────────
  const handleSheetChange = (sheetIdx: number) => {
    setSelectedSheetIndex(sheetIdx);
    if (sheets[sheetIdx]) {
      const newMapping = autoMatchColumns(targetFields, sheets[sheetIdx].headers);
      setMapping(newMapping);
    }
  };

  // ─── 3. Re-ejecutar Auto-emparejado ───────────────────────────────────────
  const handleAutoMatch = () => {
    if (!currentSheet) return;
    const freshMapping = autoMatchColumns(targetFields, currentSheet.headers);
    setMapping(freshMapping);
  };

  // ─── 4. Limpiar Mapeo ─────────────────────────────────────────────────────
  const handleClearMapping = () => {
    const empty: Record<string, string> = {};
    for (const f of targetFields) {
      empty[f.key] = '';
    }
    setMapping(empty);
  };

  // ─── 5. Guardar / Cargar Plantilla ────────────────────────────────────────
  const handleSaveTemplate = () => {
    if (!templateNameInput.trim()) return;
    saveTemplate(moduleKey, templateNameInput.trim(), mapping);
    setSavedTemplates(getSavedTemplates(moduleKey));
    setSelectedTemplateName(templateNameInput.trim());
    setTemplateNameInput('');
    setIsSavingTemplate(false);
  };

  const handleApplyTemplate = (templateName: string) => {
    setSelectedTemplateName(templateName);
    const tmpl = savedTemplates.find(t => t.name === templateName);
    if (tmpl && currentSheet) {
      // Aplicar mapeo solo para las columnas que realmente existan en este archivo
      const validHeaders = new Set(currentSheet.headers);
      const appliedMapping: Record<string, string> = { ...mapping };
      for (const [key, header] of Object.entries(tmpl.mapping)) {
        if (validHeaders.has(header)) {
          appliedMapping[key] = header;
        }
      }
      setMapping(appliedMapping);
    }
  };

  const handleDeleteTemplate = (templateName: string) => {
    deleteSavedTemplate(moduleKey, templateName);
    setSavedTemplates(getSavedTemplates(moduleKey));
    if (selectedTemplateName === templateName) {
      setSelectedTemplateName('');
    }
  };

  // ─── 6. Estadísticas de Mapeo ─────────────────────────────────────────────
  const stats = useMemo(() => {
    const requiredFields = targetFields.filter(f => f.required);
    const mappedRequired = requiredFields.filter(f => Boolean(mapping[f.key]));
    const totalMapped = Object.values(mapping).filter(Boolean).length;
    const isAllRequiredMapped = mappedRequired.length === requiredFields.length;

    return {
      requiredTotal: requiredFields.length,
      requiredMapped: mappedRequired.length,
      totalMapped,
      isAllRequiredMapped,
    };
  }, [targetFields, mapping]);

  // ─── 7. Filtrado de Campos ────────────────────────────────────────────────
  const filteredFields = useMemo(() => {
    return targetFields.filter(field => {
      // Filtro de texto
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesKey = field.key.toLowerCase().includes(q);
        const matchesLabel = field.label.toLowerCase().includes(q);
        const matchesDesc = (field.description || '').toLowerCase().includes(q);
        const mappedCol = (mapping[field.key] || '').toLowerCase();
        const matchesMapped = mappedCol.includes(q);
        if (!matchesKey && !matchesLabel && !matchesDesc && !matchesMapped) {
          return false;
        }
      }

      // Filtro de modo
      if (filterMode === 'required') {
        return field.required;
      }
      if (filterMode === 'unmapped') {
        return !mapping[field.key];
      }

      return true;
    });
  }, [targetFields, searchQuery, filterMode, mapping]);

  // ─── 8. Previsualización de Filas ─────────────────────────────────────────
  const previewData = useMemo(() => {
    if (!currentSheet || !currentSheet.sampleRows || currentSheet.sampleRows.length === 0) {
      return [];
    }
    return currentSheet.sampleRows.map(raw => {
      const transformed: Record<string, any> = {};
      for (const field of targetFields) {
        const mappedCol = mapping[field.key];
        transformed[field.key] = mappedCol && raw[mappedCol] !== undefined ? raw[mappedCol] : '—';
      }
      return transformed;
    });
  }, [currentSheet, mapping, targetFields]);

  // ─── 9. Confirmar e Importar en Código Local ──────────────────────────────
  const handleConfirm = () => {
    if (!workbook || !currentSheet) return;
    setIsProcessing(true);

    setTimeout(() => {
      try {
        const rawSheet = workbook.Sheets[currentSheet.name];
        const result = transformRowsWithMapping(rawSheet, targetFields, mapping, emptyTemplate);

        onConfirmImport(result.mappedRows, {
          total: result.totalRows,
          valid: result.validCount,
          skipped: result.skippedCount,
        });
        onClose();
      } catch (err) {
        console.error('Error durante la transformación de datos:', err);
      } finally {
        setIsProcessing(false);
      }
    }, 50);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-md overflow-hidden animate-fadeIn">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-5xl max-h-[92vh] flex flex-col rounded-3xl bg-white dark:bg-zinc-950 border border-slate-200/90 dark:border-zinc-800/90 shadow-2xl overflow-hidden"
      >
        {/* ─── Encabezado Principal ────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-zinc-800/80 bg-slate-50/70 dark:bg-zinc-900/60 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white flex items-center justify-center shadow-md shadow-teal-500/20 shrink-0">
              <FileSpreadsheet size={20} className="stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-zinc-100 leading-tight">
                  Paralelo de Casillas — Homologador de Excel
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-500/20">
                  100% Certero
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400 font-normal">
                {moduleTitle} • {currentSheet?.totalRows.toLocaleString() || 0} registros detectados
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Selector de Hoja Excel (si hay varias) */}
            {sheets.length > 1 && (
              <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 px-2.5 py-1.5 rounded-xl shadow-2xs">
                <Layers size={14} className="text-teal-600 dark:text-teal-400" />
                <span className="text-[11px] font-bold text-slate-600 dark:text-zinc-400">Hoja:</span>
                <select
                  value={selectedSheetIndex}
                  onChange={(e) => handleSheetChange(Number(e.target.value))}
                  className="bg-transparent text-xs font-bold text-slate-800 dark:text-zinc-200 focus:outline-none cursor-pointer"
                >
                  {sheets.map((sheet, idx) => (
                    <option key={sheet.name} value={idx} className="bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100">
                      {sheet.name} ({sheet.totalRows} filas)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Botón de Cierre en Recuadro */}
            <button
              type="button"
              className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200/80 dark:border-zinc-700/80 bg-white dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-700 transition-all active:scale-95 shadow-2xs shrink-0 cursor-pointer"
              onClick={onClose}
              title="Cerrar homologador"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ─── Barra de Herramientas y Pestañas ─────────────────────────────── */}
        <div className="px-6 py-3 border-b border-slate-100 dark:border-zinc-800/60 bg-white dark:bg-zinc-950 flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Pestañas: Paralelo vs Previsualización */}
          <div className="inline-flex items-center gap-1 p-1 rounded-2xl bg-slate-100/80 dark:bg-zinc-900 border border-slate-200/70 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setActiveTab('mapping')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'mapping'
                  ? 'bg-white dark:bg-zinc-800 text-teal-700 dark:text-teal-300 shadow-2xs border border-slate-200/60 dark:border-zinc-700'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
              }`}
            >
              <Columns3 size={14} />
              <span>Paralelo de Casillas</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-zinc-300 font-semibold">
                {stats.totalMapped}/{targetFields.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'preview'
                  ? 'bg-white dark:bg-zinc-800 text-teal-700 dark:text-teal-300 shadow-2xs border border-slate-200/60 dark:border-zinc-700'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
              }`}
            >
              <Eye size={14} />
              <span>Vista Previa de Filas</span>
            </button>
          </div>

          {/* Acciones de Mapeo Inteligente y Plantillas */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Estado de Requeridos */}
            <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[11px] font-bold ${
              stats.isAllRequiredMapped
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                : 'bg-amber-50 dark:bg-amber-950/40 border-amber-500/30 text-amber-700 dark:text-amber-300'
            }`}>
              {stats.isAllRequiredMapped ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
              <span>{stats.requiredMapped} de {stats.requiredTotal} obligatorios</span>
            </div>

            {/* Botón Auto-emparejar con IA */}
            <button
              type="button"
              onClick={handleAutoMatch}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs shadow-2xs bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white active:scale-95 transition-all cursor-pointer"
              title="Detectar automáticamente coincidencias según los nombres de las columnas"
            >
              <Sparkles size={13} />
              <span>Auto-emparejar</span>
            </button>

            {/* Selector / Guardar Plantilla de Empresa */}
            {savedTemplates.length > 0 && (
              <div className="flex items-center gap-1 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 px-2 py-1 rounded-xl text-xs">
                <BookmarkCheck size={13} className="text-teal-600 dark:text-teal-400" />
                <select
                  value={selectedTemplateName}
                  onChange={(e) => handleApplyTemplate(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-700 dark:text-zinc-200 focus:outline-none cursor-pointer max-w-[130px] truncate"
                >
                  <option value="" disabled>Cargar plantilla...</option>
                  {savedTemplates.map((t) => (
                    <option key={t.name} value={t.name}>
                      {t.name}
                    </option>
                  ))}
                </select>
                {selectedTemplateName && (
                  <button
                    type="button"
                    onClick={() => handleDeleteTemplate(selectedTemplateName)}
                    className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                    title="Eliminar plantilla"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            )}

            {/* Modal / Popover Guardar Plantilla */}
            {isSavingTemplate ? (
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-zinc-900 p-1 rounded-xl border border-slate-200 dark:border-zinc-700 animate-fadeIn">
                <input
                  type="text"
                  placeholder="Ej: Empresa Bolívar"
                  value={templateNameInput}
                  onChange={(e) => setTemplateNameInput(e.target.value)}
                  className="px-2 py-1 text-xs rounded-lg bg-white dark:bg-zinc-800 border-none focus:outline-none focus:ring-1 focus:ring-teal-500 text-slate-800 dark:text-zinc-200 w-32"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleSaveTemplate}
                  disabled={!templateNameInput.trim()}
                  className="px-2 py-1 text-xs font-bold rounded-lg bg-teal-600 text-white hover:bg-teal-500 disabled:opacity-40"
                >
                  Guardar
                </button>
                <button
                  type="button"
                  onClick={() => setIsSavingTemplate(false)}
                  className="p-1 text-slate-400 hover:text-slate-600"
                >
                  <X size={13} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsSavingTemplate(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 text-xs font-bold hover:bg-slate-50 dark:hover:bg-zinc-700 shadow-2xs active:scale-95 transition-all cursor-pointer"
                title="Guardar este mapeo de columnas para reutilizarlo el próximo mes"
              >
                <Save size={13} />
                <span className="hidden sm:inline">Guardar Plantilla</span>
              </button>
            )}

            {/* Limpiar Mapeo */}
            <button
              type="button"
              onClick={handleClearMapping}
              className="p-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-500 hover:text-red-500 hover:bg-slate-50 dark:hover:bg-zinc-700 transition-all cursor-pointer shadow-2xs"
              title="Limpiar todas las asociaciones"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </div>

        {/* ─── Contenido Dinámico (Pestañas) ───────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50 dark:bg-zinc-950/50">
          {activeTab === 'mapping' ? (
            <div className="space-y-4">
              {/* Barra de Búsqueda y Filtros de Campos */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-80">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar campo WAPPY o columna..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs font-medium rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 shadow-2xs"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setFilterMode('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      filterMode === 'all'
                        ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-500/30'
                        : 'bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-50'
                    }`}
                  >
                    Todos ({targetFields.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterMode('required')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      filterMode === 'required'
                        ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-500/30'
                        : 'bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-50'
                    }`}
                  >
                    Obligatorios ({stats.requiredTotal})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterMode('unmapped')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      filterMode === 'unmapped'
                        ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-500/30'
                        : 'bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-50'
                    }`}
                  >
                    Sin Asociar ({targetFields.length - stats.totalMapped})
                  </button>
                </div>
              </div>

              {/* Lista de Filas del Paralelo */}
              <div className="space-y-2.5">
                {filteredFields.map((field) => {
                  const mappedHeader = mapping[field.key] || '';
                  const sampleVal = mappedHeader && currentSheet?.sampleRows?.[0]
                    ? currentSheet.sampleRows[0][mappedHeader]
                    : null;

                  return (
                    <div
                      key={field.key}
                      className={`flex flex-col md:flex-row items-start md:items-center justify-between gap-3 p-3.5 rounded-2xl border transition-all ${
                        mappedHeader
                          ? 'bg-white dark:bg-zinc-900/90 border-slate-200/90 dark:border-zinc-800 shadow-2xs hover:border-teal-400'
                          : field.required
                          ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-300/60 dark:border-amber-900/40'
                          : 'bg-white/60 dark:bg-zinc-900/50 border-slate-200/60 dark:border-zinc-800/60'
                      }`}
                    >
                      {/* Lado Izquierdo: Campo de WAPPY */}
                      <div className="w-full md:w-5/12 flex items-start gap-2.5">
                        <div className={`mt-0.5 w-2.5 h-2.5 rounded-full shrink-0 ${
                          mappedHeader
                            ? 'bg-emerald-500 shadow-xs shadow-emerald-500/50'
                            : field.required
                            ? 'bg-amber-500 animate-pulse'
                            : 'bg-slate-300 dark:bg-zinc-700'
                        }`} />
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-bold text-slate-900 dark:text-zinc-100">
                              {field.label}
                            </span>
                            {field.required && (
                              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300/40">
                                Obligatorio
                              </span>
                            )}
                            {field.type && (
                              <span className="text-[10px] font-medium text-slate-400 dark:text-zinc-500">
                                ({field.type})
                              </span>
                            )}
                          </div>
                          {field.description && (
                            <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5 line-clamp-1">
                              {field.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Flecha Central Conectora */}
                      <div className="hidden md:flex items-center justify-center shrink-0">
                        <div className={`p-1.5 rounded-xl border ${
                          mappedHeader
                            ? 'bg-teal-50 dark:bg-teal-950/50 border-teal-500/30 text-teal-600 dark:text-teal-400'
                            : 'bg-slate-100 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-400'
                        }`}>
                          <ArrowRight size={14} />
                        </div>
                      </div>

                      {/* Lado Derecho: Columna de su Excel */}
                      <div className="w-full md:w-6/12 flex items-center gap-2">
                        <div className="flex-1 relative">
                          <select
                            value={mappedHeader}
                            onChange={(e) => {
                              const val = e.target.value;
                              setMapping(prev => ({ ...prev, [field.key]: val }));
                            }}
                            className={`w-full px-3 py-2 text-xs font-bold rounded-xl border focus:outline-none transition-all cursor-pointer ${
                              mappedHeader
                                ? 'bg-teal-50/50 dark:bg-teal-950/30 border-teal-500/50 text-teal-900 dark:text-teal-200'
                                : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 text-slate-500'
                            }`}
                          >
                            <option value="">-- Omitir / No asociar --</option>
                            {currentSheet?.headers.map((colName) => (
                              <option key={colName} value={colName} className="bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100">
                                Columna: {colName}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Muestra en Vivo de la Celda */}
                        {mappedHeader && (
                          <div className="hidden sm:flex max-w-[140px] truncate px-2 py-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-[10px] text-slate-600 dark:text-zinc-400 font-mono" title={`Muestra: ${String(sampleVal ?? 'Vacío')}`}>
                            {sampleVal !== undefined && sampleVal !== null && sampleVal !== '' ? String(sampleVal) : 'Vacío'}
                          </div>
                        )}

                        {/* Botón Desvincular Rápido */}
                        {mappedHeader && (
                          <button
                            type="button"
                            onClick={() => setMapping(prev => ({ ...prev, [field.key]: '' }))}
                            className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                            title="Desvincular casilla"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* ─── Pestaña 2: Vista Previa de Filas ────────────────────────────── */
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                    Previsualización de los primeros registros transformados
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                    Así se insertarán las filas en la base de datos de WAPPY según tu mapeo actual.
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300">
                  Mostrando {previewData.length} filas de muestra
                </span>
              </div>

              <div className="border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden bg-white dark:bg-zinc-900 shadow-2xs">
                <div className="overflow-x-auto max-h-[50vh]">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-800/60 sticky top-0 z-10 backdrop-blur-sm">
                        <th className="p-3 font-bold text-slate-600 dark:text-zinc-300 w-12 text-center">#</th>
                        {targetFields.filter(f => mapping[f.key]).map(f => (
                          <th key={f.key} className="p-3 font-bold text-slate-700 dark:text-zinc-200 whitespace-nowrap">
                            {f.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60 font-medium">
                      {previewData.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 transition-colors">
                          <td className="p-3 text-slate-400 text-center font-bold">{idx + 1}</td>
                          {targetFields.filter(f => mapping[f.key]).map(f => (
                            <td key={f.key} className="p-3 text-slate-800 dark:text-zinc-200 whitespace-nowrap">
                              {row[f.key] !== '' && row[f.key] !== undefined ? String(row[f.key]) : <span className="text-slate-300 dark:text-zinc-600 italic">—</span>}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ─── Pie de Página y Acciones Finales ─────────────────────────────── */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-zinc-800/80 bg-slate-50/80 dark:bg-zinc-900/60 backdrop-blur-sm flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-zinc-400">
            <Sparkles size={15} className="text-teal-600 dark:text-teal-400 shrink-0" />
            <span>
              <strong>{currentSheet?.totalRows.toLocaleString() || 0}</strong> filas se procesarán en tu navegador a velocidad instantánea (0% tokens consumidos).
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-bold text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-700 transition-all active:scale-95 shadow-2xs cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isProcessing || !stats.isAllRequiredMapped}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer text-white ${
                stats.isAllRequiredMapped && !isProcessing
                  ? 'bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 shadow-teal-600/25'
                  : 'bg-slate-300 dark:bg-zinc-800 cursor-not-allowed opacity-60 text-slate-500'
              }`}
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Procesando archivo...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={15} />
                  <span>Importar {currentSheet?.totalRows.toLocaleString() || 0} Registros</span>
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
