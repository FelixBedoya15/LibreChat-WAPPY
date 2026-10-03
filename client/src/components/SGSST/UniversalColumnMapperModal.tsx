import React, { useState, useEffect, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom';
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
  Download,
  ChevronDown,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useToastContext } from '@librechat/client';
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
  exportModuleDataToExcel,
} from './columnMapperEngine';

interface UniversalColumnMapperModalProps {
  isOpen: boolean;
  onClose: () => void;
  moduleKey?: string;
  moduleTitle: string;
  targetFields: TargetFieldDef[];
  fileData?: ArrayBuffer | null;
  fileBuffer?: ArrayBuffer | null;
  onConfirmImport?: (mappedRows: any[], summary: { total: number; valid: number; skipped: number }) => void;
  onConfirm?: (mappedRows: any[]) => void;
  emptyTemplate?: Record<string, any>;
}

interface WappyColumnSelectProps {
  fieldKey: string;
  fieldLabel: string;
  value: string;
  options: string[];
  sampleRow?: Record<string, any> | null;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  onChange: (val: string) => void;
}

const WappyColumnSelect: React.FC<WappyColumnSelectProps> = ({
  fieldKey,
  fieldLabel,
  value,
  options,
  sampleRow,
  isOpen,
  onOpen,
  onClose,
  onChange,
}) => {
  const [filterText, setFilterText] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setFilterText('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  const filteredOptions = useMemo(() => {
    if (!filterText.trim()) return options;
    const q = filterText.toLowerCase().trim();
    return options.filter(opt => opt.toLowerCase().includes(q));
  }, [options, filterText]);

  return (
    <div className="relative flex-1 min-w-0" ref={dropdownRef}>
      {/* Botón Disparador Estilo WAPPY */}
      <button
        type="button"
        onClick={() => {
          if (isOpen) onClose();
          else onOpen();
        }}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer active:scale-[0.99] text-left shadow-2xs ${
          value
            ? 'bg-teal-50/70 dark:bg-teal-950/40 border-teal-500/50 text-teal-900 dark:text-teal-200 hover:border-teal-500'
            : 'bg-white dark:bg-zinc-900 border-slate-200/90 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 hover:border-teal-500/50 hover:bg-slate-50 dark:hover:bg-zinc-800/80'
        }`}
        title={value ? `Columna seleccionada: ${value}` : 'Asociar una columna de su Excel'}
      >
        <div className="flex items-center gap-2 truncate flex-1 min-w-0">
          {value ? (
            <>
              <CheckCircle2 size={13} className="text-teal-600 dark:text-teal-400 shrink-0" />
              <span className="truncate">{value}</span>
            </>
          ) : (
            <span className="text-slate-400 dark:text-zinc-500 font-normal italic truncate">
              -- Omitir / No asociar --
            </span>
          )}
        </div>
        <ChevronDown
          size={13}
          className={`text-slate-400 dark:text-zinc-500 transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-teal-600 dark:text-teal-400' : ''
          }`}
        />
      </button>

      {/* Menú Desplegable WAPPY con Búsqueda Integrada */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 mt-1.5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 shadow-2xl z-50 overflow-hidden py-1.5 backdrop-blur-md min-w-[280px]"
          >
            {/* Buscador de Columna si hay más de 5 opciones */}
            {options.length > 5 && (
              <div className="p-2 border-b border-slate-100 dark:border-zinc-800">
                <div className="relative">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar columna..."
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                    className="w-full pl-8 pr-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 focus:outline-none focus:border-teal-500"
                    autoFocus
                  />
                  {filterText && (
                    <button
                      type="button"
                      onClick={() => setFilterText('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X size={11} />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Lista Desplegable */}
            <div className="max-h-60 overflow-y-auto py-1">
              {/* Opción Omitir */}
              <button
                type="button"
                onClick={() => {
                  onChange('');
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-3 py-1.5 text-xs text-left cursor-pointer transition-colors ${
                  !value
                    ? 'bg-slate-100 dark:bg-zinc-800/80 text-slate-800 dark:text-zinc-200 font-bold'
                    : 'text-slate-400 dark:text-zinc-500 hover:bg-slate-50 dark:hover:bg-zinc-800/50 hover:text-red-500'
                }`}
              >
                <span className="italic">-- Omitir / No asociar --</span>
                {!value && <CheckCircle2 size={13} className="text-slate-500 shrink-0" />}
              </button>

              <div className="my-1 border-t border-slate-100 dark:border-zinc-800/80" />

              {/* Opciones de Columnas del Excel */}
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-2 text-center text-xs text-slate-400 dark:text-zinc-500 italic">
                  No se encontraron columnas con "{filterText}"
                </div>
              ) : (
                filteredOptions.map((opt) => {
                  const isSelected = opt === value;
                  const sampleVal = sampleRow && sampleRow[opt] !== undefined && String(sampleRow[opt]).trim() !== ''
                    ? String(sampleRow[opt]).trim()
                    : null;

                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => {
                        onChange(opt);
                        onClose();
                      }}
                      className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-xs text-left cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-200 font-bold'
                          : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800/80'
                      }`}
                    >
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="truncate">{opt}</span>
                        {sampleVal && (
                          <span className="text-[10px] text-slate-400 dark:text-zinc-500 truncate max-w-[240px]">
                            Ej: <span className="font-mono">{sampleVal.length > 28 ? sampleVal.slice(0, 28) + '...' : sampleVal}</span>
                          </span>
                        )}
                      </div>
                      {isSelected && (
                        <CheckCircle2 size={13} className="text-teal-600 dark:text-teal-400 shrink-0" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function UniversalColumnMapperModal({
  isOpen,
  onClose,
  moduleKey,
  moduleTitle,
  targetFields,
  fileData,
  fileBuffer,
  onConfirmImport,
  onConfirm,
  emptyTemplate = {},
}: UniversalColumnMapperModalProps) {
  const { showToast } = useToastContext();
  const effectiveFileData = fileData || fileBuffer;
  const effectiveModuleKey = moduleKey || moduleTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  // ─── Estados Principales ──────────────────────────────────────────────────
  const [sheets, setSheets] = useState<SheetInfo[]>([]);
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [selectedSheetIndex, setSelectedSheetIndex] = useState<number>(0);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  
  // ─── Estados de Navegación y Filtros ──────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'mapping' | 'preview'>('mapping');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterMode, setFilterMode] = useState<'all' | 'required' | 'unmapped'>('all');
  const [activeDropdownKey, setActiveDropdownKey] = useState<string | null>(null);
  
  // ─── Plantillas Guardadas ─────────────────────────────────────────────────
  const [savedTemplates, setSavedTemplates] = useState<SavedTemplate[]>([]);
  const [isSavingTemplate, setIsSavingTemplate] = useState<boolean>(false);
  const [templateNameInput, setTemplateNameInput] = useState<string>('');
  const [selectedTemplateName, setSelectedTemplateName] = useState<string>('');
  const [isTemplateMenuOpen, setIsTemplateMenuOpen] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isSheetMenuOpen, setIsSheetMenuOpen] = useState<boolean>(false);
  const sheetDropdownRef = useRef<HTMLDivElement>(null);
  const templateDropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar menús al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sheetDropdownRef.current && !sheetDropdownRef.current.contains(event.target as Node)) {
        setIsSheetMenuOpen(false);
      }
      if (templateDropdownRef.current && !templateDropdownRef.current.contains(event.target as Node)) {
        setIsTemplateMenuOpen(false);
      }
    };
    if (isSheetMenuOpen || isTemplateMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSheetMenuOpen, isTemplateMenuOpen]);

  // ─── 1. Procesar archivo Excel al abrir ────────────────────────────────────
  useEffect(() => {
    if (!isOpen || !effectiveFileData) {
      setSheets([]);
      setWorkbook(null);
      setMapping({});
      return;
    }

    try {
      const parsed = parseWorkbookSheets(effectiveFileData);
      setWorkbook(parsed.workbook);
      setSheets(parsed.sheets);
      setSelectedSheetIndex(0);

      if (parsed.sheets.length > 0) {
        const initialMapping = autoMatchColumns(targetFields, parsed.sheets[0].headers);
        setMapping(initialMapping);
      }

      // Cargar plantillas previas de este módulo
      const templates = getSavedTemplates(effectiveModuleKey);
      setSavedTemplates(templates);
    } catch (err) {
      console.error('Error al procesar el archivo Excel para mapeo:', err);
    }
  }, [isOpen, effectiveFileData, effectiveModuleKey, targetFields]);

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
    const matchedCount = Object.values(freshMapping).filter(Boolean).length;
    if (matchedCount > 0) {
      showToast({
        message: `¡Auto-emparejado exitoso! Se vincularon ${matchedCount} de ${targetFields.length} columnas.`,
        status: 'success',
      });
    } else {
      showToast({
        message: 'No se encontraron coincidencias automáticas en las cabeceras de esta hoja.',
        status: 'warning',
      });
    }
  };

  // ─── 4. Limpiar Mapeo ─────────────────────────────────────────────────────
  const handleClearMapping = () => {
    const empty: Record<string, string> = {};
    for (const f of targetFields) {
      empty[f.key] = '';
    }
    setMapping(empty);
    showToast({
      message: 'Se han desvinculado todas las casillas.',
      status: 'info',
    });
  };

  // ─── 5. Guardar / Cargar Plantilla ────────────────────────────────────────
  const handleSaveTemplate = () => {
    if (!templateNameInput.trim()) return;
    saveTemplate(effectiveModuleKey, templateNameInput.trim(), mapping);
    setSavedTemplates(getSavedTemplates(effectiveModuleKey));
    setSelectedTemplateName(templateNameInput.trim());
    setTemplateNameInput('');
    setIsSavingTemplate(false);
    showToast({
      message: `Plantilla "${templateNameInput.trim()}" guardada exitosamente.`,
      status: 'success',
    });
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
      showToast({
        message: `Plantilla "${templateName}" aplicada.`,
        status: 'info',
      });
    }
  };

  const handleDeleteTemplate = (templateName: string) => {
    deleteSavedTemplate(effectiveModuleKey, templateName);
    setSavedTemplates(getSavedTemplates(effectiveModuleKey));
    if (selectedTemplateName === templateName) {
      setSelectedTemplateName('');
    }
    showToast({
      message: `Plantilla "${templateName}" eliminada.`,
      status: 'info',
    });
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
    if (!currentSheet) return;
    setIsProcessing(true);

    setTimeout(() => {
      try {
        const rowsSource = currentSheet.allRows && currentSheet.allRows.length > 0
          ? currentSheet.allRows
          : (workbook ? workbook.Sheets[currentSheet.name] : []);

        const result = transformRowsWithMapping(rowsSource, targetFields, mapping, emptyTemplate);

        if (onConfirmImport) {
          onConfirmImport(result.mappedRows, {
            total: result.totalRows,
            valid: result.validCount,
            skipped: result.skippedCount,
          });
        } else if (onConfirm) {
          onConfirm(result.mappedRows);
        }
        onClose();
      } catch (err) {
        console.error('Error durante la transformación de datos:', err);
      } finally {
        setIsProcessing(false);
      }
    }, 50);
  };

  if (!isOpen) return null;
  if (typeof document === 'undefined') return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-md overflow-hidden animate-fadeIn">
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
                <span className="shrink-0 whitespace-nowrap px-2.5 py-0.5 rounded-xl text-[10px] font-bold bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-500/30 shadow-2xs">
                  Mapeo Asistido
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400 font-normal">
                {moduleTitle} • {currentSheet?.totalRows.toLocaleString() || 0} registros detectados
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Selector de Hoja Excel Personalizado (Sin estilos toscos de navegador) */}
            {sheets.length > 1 && (
              <div className="relative" ref={sheetDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsSheetMenuOpen(prev => !prev)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 shadow-sm hover:border-teal-500/50 hover:bg-slate-50 dark:hover:bg-zinc-800/80 transition-all cursor-pointer text-xs font-bold text-slate-800 dark:text-zinc-200 active:scale-95"
                  title="Cambiar de hoja de Excel"
                >
                  <Layers size={14} className="text-teal-600 dark:text-teal-400 shrink-0" />
                  <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 shrink-0">Hoja:</span>
                  <span className="max-w-[160px] sm:max-w-[220px] truncate text-slate-900 dark:text-zinc-100 font-bold">
                    {currentSheet?.name}
                  </span>
                  <span className="text-[10px] text-teal-700 dark:text-teal-300 font-bold px-1.5 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-500/20 shrink-0">
                    {currentSheet?.totalRows} filas
                  </span>
                  <ChevronDown size={13} className={`text-slate-400 transition-transform duration-200 shrink-0 ${isSheetMenuOpen ? 'rotate-180 text-teal-600' : ''}`} />
                </button>

                <AnimatePresence>
                  {isSheetMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 5, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 5, scale: 0.97 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-1.5 w-72 max-w-[90vw] rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xl py-1.5 z-50 overflow-hidden max-h-64 overflow-y-auto"
                    >
                      <div className="px-3 py-1.5 border-b border-slate-100 dark:border-zinc-800 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                        Seleccionar Hoja de Trabajo
                      </div>
                      {sheets.map((sheet, idx) => {
                        const isSelected = idx === selectedSheetIndex;
                        return (
                          <button
                            key={sheet.name}
                            type="button"
                            onClick={() => {
                              handleSheetChange(idx);
                              setIsSheetMenuOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold transition-colors text-left cursor-pointer ${
                              isSelected
                                ? 'bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 font-bold'
                                : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800'
                            }`}
                          >
                            <span className="truncate flex-1 mr-2">{sheet.name}</span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400">
                                {sheet.totalRows} filas
                              </span>
                              {isSelected && <CheckCircle2 size={13} className="text-teal-600 dark:text-teal-400" />}
                            </div>
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
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
          <div className="inline-flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-100/90 dark:bg-zinc-900/90 border border-slate-200/80 dark:border-zinc-800 shadow-sm">
            <button
              type="button"
              onClick={() => setActiveTab('mapping')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 ${
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 ${
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
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-bold ${
              stats.isAllRequiredMapped
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                : 'bg-amber-50 dark:bg-amber-950/40 border-amber-500/30 text-amber-700 dark:text-amber-300'
            }`}>
              {stats.isAllRequiredMapped ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
              <span>{stats.requiredMapped} de {stats.requiredTotal} obligatorios</span>
            </div>

            {/* Botón Auto-emparejar (Expandible al hover - WAPPY Style) */}
            <button
              type="button"
              onClick={handleAutoMatch}
              className="group flex h-9 min-w-[36px] items-center justify-center rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-sm active:scale-95 transition-all duration-300 px-2.5 cursor-pointer"
              title="Detectar automáticamente coincidencias según los nombres de las columnas"
            >
              <Sparkles size={14} className="shrink-0" />
              <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-1.5 group-hover:max-w-[120px] group-hover:opacity-100 sm:flex">
                <span className="text-[11px] font-bold">Auto-emparejar</span>
              </div>
            </button>

            {/* Botón Descargar Plantilla Oficial Excel (Expandible al hover - WAPPY Style) */}
            <button
              type="button"
              onClick={() => {
                exportModuleDataToExcel({
                  targetFields,
                  data: [],
                  fileName: `Plantilla_${moduleTitle.replace(/[^a-zA-Z0-9]/g, '_')}`,
                  sheetName: 'Formato Oficial',
                  isTemplate: true,
                });
              }}
              className="group flex h-9 min-w-[36px] items-center justify-center rounded-xl border border-slate-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-700 transition-all duration-300 px-2.5 shadow-2xs active:scale-95 cursor-pointer"
              title="Descargar archivo Excel en blanco con las columnas oficiales listas para diligenciar"
            >
              <Download size={14} className="shrink-0 text-teal-600 dark:text-teal-400" />
              <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-1.5 group-hover:max-w-[140px] group-hover:opacity-100 sm:flex">
                <span className="text-[11px] font-bold">Descargar Formato</span>
              </div>
            </button>

            {/* Selector / Guardar Plantilla de Empresa Personalizado */}
            {savedTemplates.length > 0 && (
              <div className="relative" ref={templateDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsTemplateMenuOpen(prev => !prev)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all text-xs font-bold active:scale-95 shadow-2xs cursor-pointer"
                  title="Cargar mapeo guardado previamente"
                >
                  <BookmarkCheck size={14} className="text-teal-600 dark:text-teal-400 shrink-0" />
                  <span className="truncate max-w-[120px]">
                    {selectedTemplateName || 'Plantillas'}
                  </span>
                  <ChevronDown size={12} className={`text-slate-400 transition-transform ${isTemplateMenuOpen ? 'rotate-180 text-teal-600' : ''}`} />
                </button>

                <AnimatePresence>
                  {isTemplateMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 4, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 4, scale: 0.98 }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-0 mt-1.5 w-56 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xl py-1.5 z-50 overflow-hidden"
                    >
                      <div className="px-3 py-1 border-b border-slate-100 dark:border-zinc-800 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                        Plantillas de Empresa
                      </div>
                      {savedTemplates.map((t) => (
                        <div
                          key={t.name}
                          className={`flex items-center justify-between px-3 py-1.5 text-xs transition-colors ${
                            selectedTemplateName === t.name
                              ? 'bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 font-bold'
                              : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              handleApplyTemplate(t.name);
                              setIsTemplateMenuOpen(false);
                            }}
                            className="flex-1 text-left truncate cursor-pointer font-semibold"
                          >
                            {t.name}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTemplate(t.name);
                            }}
                            className="p-1 text-slate-400 hover:text-red-500 transition-colors cursor-pointer shrink-0"
                            title="Eliminar plantilla"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Guardar Plantilla (Expandible al hover - WAPPY Style) */}
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
                  className="px-2 py-1 text-xs font-bold rounded-lg bg-teal-600 text-white hover:bg-teal-500 disabled:opacity-40 cursor-pointer"
                >
                  Guardar
                </button>
                <button
                  type="button"
                  onClick={() => setIsSavingTemplate(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X size={13} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsSavingTemplate(true)}
                className="group flex h-9 min-w-[36px] items-center justify-center rounded-xl border border-slate-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-700 transition-all duration-300 px-2.5 shadow-2xs active:scale-95 cursor-pointer"
                title="Guardar este mapeo de columnas para reutilizarlo el próximo mes"
              >
                <Save size={14} className="shrink-0 text-slate-500 dark:text-zinc-400 group-hover:text-teal-600 dark:group-hover:text-teal-400" />
                <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-1.5 group-hover:max-w-[130px] group-hover:opacity-100 sm:flex">
                  <span className="text-[11px] font-bold">Guardar Plantilla</span>
                </div>
              </button>
            )}

            {/* Limpiar Mapeo (Expandible al hover - WAPPY Style) */}
            <button
              type="button"
              onClick={handleClearMapping}
              className="group flex h-9 min-w-[36px] items-center justify-center rounded-xl border border-slate-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-800 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-all duration-300 px-2.5 shadow-2xs active:scale-95 cursor-pointer"
              title="Limpiar todas las asociaciones"
            >
              <RotateCcw size={14} className="shrink-0" />
              <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-1.5 group-hover:max-w-[110px] group-hover:opacity-100 sm:flex">
                <span className="text-[11px] font-bold text-red-600 dark:text-red-400">Limpiar Todo</span>
              </div>
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
                        activeDropdownKey === field.key ? 'relative z-30 ring-2 ring-teal-500/30' : 'relative z-0'
                      } ${
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
                        <WappyColumnSelect
                          fieldKey={field.key}
                          fieldLabel={field.label}
                          value={mappedHeader}
                          options={currentSheet?.headers || []}
                          sampleRow={currentSheet?.sampleRows?.[0] || null}
                          isOpen={activeDropdownKey === field.key}
                          onOpen={() => setActiveDropdownKey(field.key)}
                          onClose={() => setActiveDropdownKey(null)}
                          onChange={(val) => {
                            setMapping(prev => ({ ...prev, [field.key]: val }));
                          }}
                        />

                        {/* Muestra en Vivo de la Celda */}
                        {mappedHeader && (
                          <div className="hidden sm:flex max-w-[130px] truncate px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-zinc-800/80 border border-slate-200/80 dark:border-zinc-700/80 text-[10px] text-slate-600 dark:text-zinc-400 font-mono shadow-2xs shrink-0" title={`Muestra: ${String(sampleVal ?? 'Vacío')}`}>
                            {sampleVal !== undefined && sampleVal !== null && sampleVal !== '' ? String(sampleVal) : 'Vacío'}
                          </div>
                        )}

                        {/* Micro-Botón Desvincular Rápido (Expandible al hover) */}
                        {mappedHeader && (
                          <button
                            type="button"
                            onClick={() => setMapping(prev => ({ ...prev, [field.key]: '' }))}
                            className="group flex h-8 min-w-[32px] items-center justify-center rounded-xl transition-all duration-300 px-1.5 text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 active:scale-95 cursor-pointer shrink-0 border border-slate-200/70 dark:border-zinc-800"
                            title="Desvincular casilla"
                          >
                            <X size={13} className="shrink-0" />
                            <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-1 group-hover:max-w-[80px] group-hover:opacity-100 sm:flex">
                              <span className="text-[10px] font-bold">Quitar</span>
                            </div>
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
            {/* Botón Cancelar (WAPPY Expandible al Hover) */}
            <button
              type="button"
              onClick={onClose}
              className="group flex h-9 min-w-[36px] items-center justify-center rounded-xl border border-slate-200/90 dark:border-zinc-700/80 bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 shadow-sm active:scale-95 transition-all duration-300 px-2.5 cursor-pointer"
              title="Cancelar importación"
            >
              <X size={15} className="shrink-0 transition-transform duration-300 group-hover:rotate-90 text-slate-500 group-hover:text-red-600" />
              <div className="hidden sm:flex items-center max-w-0 overflow-hidden opacity-0 group-hover:max-w-[100px] group-hover:opacity-100 group-hover:ml-1.5 transition-all duration-300 ease-in-out whitespace-nowrap">
                <span className="text-xs font-bold text-slate-700 dark:text-zinc-200 group-hover:text-red-600">Cancelar</span>
              </div>
              <span className="sm:hidden text-xs font-bold ml-1.5">Cancelar</span>
            </button>

            {/* Botón Importar Registros (WAPPY Expandible al Hover) */}
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isProcessing || !stats.isAllRequiredMapped}
              className={`group flex h-9 sm:h-10 min-w-[40px] items-center justify-center rounded-xl font-bold text-xs shadow-md transition-all duration-300 active:scale-95 cursor-pointer px-3 text-white ${
                stats.isAllRequiredMapped && !isProcessing
                  ? 'bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 shadow-teal-600/25 sm:hover:scale-105'
                  : 'bg-slate-300 dark:bg-zinc-800 cursor-not-allowed opacity-60 text-slate-500'
              }`}
              title={stats.isAllRequiredMapped ? `Importar ${currentSheet?.totalRows.toLocaleString() || 0} registros` : 'Faltan campos obligatorios por asociar'}
            >
              {isProcessing ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
              ) : (
                <CheckCircle2 size={16} className="shrink-0" />
              )}
              <div className={`hidden sm:flex items-center overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out ${
                isProcessing
                  ? 'ml-2 max-w-[260px] opacity-100'
                  : 'max-w-0 opacity-0 group-hover:ml-2 group-hover:max-w-[260px] group-hover:opacity-100'
              }`}>
                <span className="text-xs font-bold tracking-wide">
                  {isProcessing ? 'Procesando archivo...' : `Importar ${currentSheet?.totalRows.toLocaleString() || 0} Registros`}
                </span>
              </div>
              <span className="sm:hidden text-xs font-bold ml-1.5">
                {isProcessing ? 'Procesando...' : `Importar (${currentSheet?.totalRows || 0})`}
              </span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}
