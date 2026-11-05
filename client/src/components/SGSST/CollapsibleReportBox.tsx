import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, History, Save, Loader2, Sparkles, FileText } from 'lucide-react';
import { cn } from '~/utils';

interface CollapsibleReportBoxProps {
  title: string | React.ReactNode;
  subtitle?: string;
  icon?: React.ReactNode;
  /** Nodo que se renderiza DESPUÉS del botón de Historial (ej. ExportDropdown) */
  actions?: React.ReactNode;
  headerClassName?: string;
  containerClassName?: string;
  defaultCollapsed?: boolean;
  children: React.ReactNode;
  /** Si se provee, muestra un botón "Historial" antes del área de actions */
  onHistory?: () => void;
  /** Indica si el panel de historial está abierto (para resaltar el botón) */
  isHistoryOpen?: boolean;
  /** Si se provee, muestra un botón "Guardar Informe" antes del Historial */
  onSave?: () => void;
  /** Indica si se está guardando actualmente */
  isSaving?: boolean;
  /** Si true, deshabilita el botón de guardar */
  saveDisabled?: boolean;
  /** Si true, indica que se está generando el informe con IA */
  isLoading?: boolean;
  /** Acción para generar el informe con IA directamente desde el encabezado del editor */
  onAnalyze?: () => void;
  /** Etiqueta personalizada para el botón de IA (por defecto "Generar IA") */
  analyzeLabel?: string;
  /** Si true, deshabilita el botón de Generar IA */
  analyzeDisabled?: boolean;
  /** Si true, oculta el botón de Generar IA en casos excepcionales */
  hideAnalyzeButton?: boolean;
}

const CollapsibleReportBox = ({
  title,
  subtitle = 'Generado por WAPPY AI Engine',
  icon,
  actions,
  headerClassName,
  containerClassName,
  defaultCollapsed = true,
  children,
  onHistory,
  isHistoryOpen = false,
  onSave,
  isSaving = false,
  saveDisabled = false,
  isLoading = false,
  onAnalyze,
  analyzeLabel = 'Generar IA',
  analyzeDisabled = false,
  hideAnalyzeButton = false,
}: CollapsibleReportBoxProps) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [isEditorEmpty, setIsEditorEmpty] = useState(true);
  const [isGeneratingIa, setIsGeneratingIa] = useState(false);
  const contentWrapperRef = useRef<HTMLDivElement>(null);

  const effectiveGenerating = Boolean(isLoading || isGeneratingIa);

  useEffect(() => {
    if (!isLoading) {
      setIsGeneratingIa(false);
    } else {
      setIsCollapsed(false);
    }
  }, [isLoading]);

  // Check if the inner LiveEditor (.live-editor-content / [contenteditable]) has real content
  useEffect(() => {
    const wrapper = contentWrapperRef.current;
    if (!wrapper) return;

    const checkContent = () => {
      const editable =
        wrapper.querySelector<HTMLElement>('.live-editor-content') ||
        wrapper.querySelector<HTMLElement>('[contenteditable="true"]');
      if (!editable) return;

      const html = (editable.innerHTML || '').trim();
      const text = (editable.innerText || editable.textContent || '').trim();
      const hasRichElements = Boolean(
        editable.querySelector('table, h1, h2, h3, img, ul, ol, div[style]'),
      );
      const hasRealContent =
        text.length > 5 || (hasRichElements && html.length > 20 && html !== '<br>');

      setIsEditorEmpty(!hasRealContent);
      if (hasRealContent) {
        setIsCollapsed(false);
        setIsGeneratingIa(false);
      }
    };

    checkContent();

    const observer = new MutationObserver(() => {
      checkContent();
    });

    observer.observe(wrapper, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => observer.disconnect();
  }, []);

  // Listen to global report lifecycle events to auto-expand and reflect AI generation state
  useEffect(() => {
    const handleExpand = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      if (detail && detail.clear) return;
      setIsCollapsed(false);
      if (detail?.html || detail?.content) {
        setIsEditorEmpty(false);
        setIsGeneratingIa(false);
      }
    };

    const handleGeneratingStart = () => {
      setIsCollapsed(false);
      setIsGeneratingIa(true);
    };

    const handleGeneratingChange = (e: Event) => {
      const isGen = Boolean((e as CustomEvent)?.detail?.isGenerating);
      setIsGeneratingIa(isGen);
      if (isGen) {
        setIsCollapsed(false);
      }
    };

    window.addEventListener('wappy-report-loaded', handleExpand);
    window.addEventListener('wappy-live-editor-content-set', handleExpand);
    window.addEventListener('wappy-hydrate-live-editor', handleExpand);
    window.addEventListener('wappy-generar-analisis-ia', handleGeneratingStart);
    window.addEventListener('wappy-generar-analisis-actual', handleGeneratingStart);
    window.addEventListener('wappy-report-generating-change', handleGeneratingChange);

    return () => {
      window.removeEventListener('wappy-report-loaded', handleExpand);
      window.removeEventListener('wappy-live-editor-content-set', handleExpand);
      window.removeEventListener('wappy-hydrate-live-editor', handleExpand);
      window.removeEventListener('wappy-generar-analisis-ia', handleGeneratingStart);
      window.removeEventListener('wappy-generar-analisis-actual', handleGeneratingStart);
      window.removeEventListener('wappy-report-generating-change', handleGeneratingChange);
    };
  }, []);

  return (
    <div
      className={cn(
        'rounded-2xl border-2 border-[#10b981]/20 bg-surface-primary overflow-hidden shadow-xl animate-in fade-in slide-in-from-top-4 duration-500',
        containerClassName,
      )}
    >
      <div
        className={cn(
          'bg-gradient-to-r from-[#10b981]/10 to-transparent dark:from-[#10b981]/20 px-3 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between gap-1.5 sm:gap-2.5 cursor-pointer hover:bg-[#10b981]/5 transition-colors',
          !isCollapsed && 'border-b border-border-medium',
          headerClassName,
        )}
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        {/* Left: icon + title */}
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
          {icon && (
            <div className="p-1 sm:p-2 rounded-xl bg-[#10b981]/20 text-[#10b981] shrink-0">
              {icon}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-[#0d9488] dark:text-[#10b981] flex items-center gap-1.5 sm:gap-2 uppercase tracking-wide text-xs sm:text-sm truncate">
              <span>Análisis IA</span>
              {effectiveGenerating && (
                <span className="inline-flex items-center gap-1 rounded-lg bg-purple-500/15 border border-purple-500/30 px-2 py-0.5 text-[10px] font-bold text-purple-700 dark:text-purple-300 normal-case">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Generando...
                </span>
              )}
              {!effectiveGenerating && !isEditorEmpty && (
                <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 normal-case">
                  Listo
                </span>
              )}
            </h3>
            {title && (
              <p className="text-[10px] sm:text-[11px] text-text-secondary font-semibold uppercase tracking-wider truncate mt-0.5">
                {title}
              </p>
            )}
          </div>
        </div>

        {/* Right: AI generate + save + history + actions + collapse toggle */}
        <div
          className="flex items-center gap-1 sm:gap-2 shrink-0 justify-end"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Generate AI button */}
          {!hideAnalyzeButton && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (effectiveGenerating || analyzeDisabled) return;
                setIsCollapsed(false);
                if (onAnalyze) {
                  setIsGeneratingIa(true);
                  if (typeof window !== 'undefined') {
                    (window as any).__wappyLastAiAnalyzeTriggerTs = Date.now();
                  }
                  onAnalyze();
                } else if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('wappy-generar-analisis-actual'));
                }
              }}
              disabled={effectiveGenerating || analyzeDisabled}
              title={analyzeLabel || 'Generar con IA'}
              aria-label={analyzeLabel || 'Generar con IA'}
              className={cn(
                'group flex items-center justify-center h-9 min-w-[36px] sm:h-10 sm:min-w-[40px] px-2 sm:px-2.5 transition-all duration-300 sm:hover:-rotate-3 sm:hover:scale-105 active:scale-95 shadow-sm shrink-0 border outline-none rounded-xl',
                effectiveGenerating || analyzeDisabled
                  ? 'opacity-50 cursor-not-allowed bg-purple-500/10 border-purple-500/20 text-purple-700 dark:text-purple-300'
                  : 'cursor-pointer bg-purple-500/10 border-purple-500/30 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300',
              )}
            >
              {effectiveGenerating ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 shrink-0" />
              )}
              <div className="hidden sm:flex items-center max-w-0 overflow-hidden opacity-0 group-hover:max-w-[200px] group-hover:opacity-100 group-hover:ml-1.5 transition-all duration-300 ease-in-out whitespace-nowrap">
                <span className="text-xs font-bold tracking-wide">
                  {effectiveGenerating ? 'Generando...' : analyzeLabel}
                </span>
              </div>
            </button>
          )}

          {/* Save button */}
          {onSave && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSave();
              }}
              disabled={saveDisabled || isSaving}
              aria-label="Guardar Informe"
              className={cn(
                'group flex items-center justify-center h-9 min-w-[36px] sm:h-10 sm:min-w-[40px] px-2 sm:px-2.5 transition-all duration-300 sm:hover:-rotate-3 sm:hover:scale-105 active:scale-95 shadow-sm shrink-0 border outline-none rounded-xl',
                saveDisabled || isSaving
                  ? 'opacity-50 cursor-not-allowed bg-surface-primary border-border-medium text-text-tertiary'
                  : 'cursor-pointer bg-teal-500/10 border-teal-500/30 hover:bg-teal-500/20 text-teal-700 dark:text-teal-300',
              )}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
              ) : (
                <Save className="h-4 w-4 shrink-0" />
              )}
              <div className="hidden sm:flex items-center max-w-0 overflow-hidden opacity-0 group-hover:max-w-[200px] group-hover:opacity-100 group-hover:ml-1.5 transition-all duration-300 ease-in-out whitespace-nowrap">
                <span className="text-xs font-bold tracking-wide">Guardar Informe</span>
              </div>
            </button>
          )}

          {/* History button */}
          {onHistory && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onHistory();
              }}
              aria-label="Historial de informes"
              className={cn(
                'group flex items-center justify-center h-9 min-w-[36px] sm:h-10 sm:min-w-[40px] px-2 sm:px-2.5 transition-all duration-300 sm:hover:-rotate-3 sm:hover:scale-105 active:scale-95 shadow-sm shrink-0 cursor-pointer border outline-none rounded-xl',
                isHistoryOpen
                  ? 'bg-orange-500/20 text-orange-700 dark:text-orange-300 border-orange-500/50'
                  : 'bg-orange-500/10 text-orange-700 dark:text-orange-300 hover:bg-orange-500/20 border-orange-500/30',
              )}
            >
              <History className="h-4 w-4 shrink-0" />
              <div className="hidden sm:flex items-center max-w-0 overflow-hidden opacity-0 group-hover:max-w-[200px] group-hover:opacity-100 group-hover:ml-1.5 transition-all duration-300 ease-in-out whitespace-nowrap">
                <span className="text-xs font-bold tracking-wide">Historial</span>
              </div>
            </button>
          )}

          {/* User-provided actions (e.g. ExportDropdown) */}
          {actions}

          {/* Collapse toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsCollapsed(!isCollapsed);
            }}
            className="p-1 sm:p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-xl transition-colors text-[#10b981] focus:outline-none flex items-center justify-center h-8 w-8 sm:h-9 sm:w-9 shrink-0"
          >
            {isCollapsed ? (
              <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5" />
            ) : (
              <ChevronUp className="h-4 w-4 sm:h-5 sm:w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Keep children ALWAYS mounted in the DOM so liveEditorRef.current is never null */}
      <div
        ref={contentWrapperRef}
        className={cn('w-full overflow-hidden bg-transparent', isCollapsed && 'hidden')}
      >
        {effectiveGenerating && (
          <div className="mx-3 mt-3 sm:mx-5 sm:mt-4 flex items-center gap-3 rounded-xl border border-purple-500/30 bg-purple-500/10 px-4 py-3 text-purple-800 dark:text-purple-200 shadow-sm animate-pulse">
            <Loader2 className="h-5 w-5 shrink-0 animate-spin text-purple-600 dark:text-purple-400" />
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-bold">
                Redactando informe técnico con WAPPY IA...
              </p>
              <p className="text-[11px] opacity-80">
                Consolidando contexto normativo y datos de la empresa activa. El documento aparecerá automáticamente aquí en unos segundos.
              </p>
            </div>
            <Sparkles className="h-4 w-4 shrink-0 text-purple-500" />
          </div>
        )}

        {!effectiveGenerating && isEditorEmpty && (
          <div className="mx-3 mt-3 sm:mx-5 sm:mt-4 flex items-center justify-between gap-3 rounded-xl border border-teal-500/25 bg-teal-500/5 px-4 py-2.5 text-text-secondary">
            <div className="flex items-center gap-2.5 min-w-0">
              <FileText className="h-4 w-4 shrink-0 text-teal-600 dark:text-teal-400" />
              <p className="text-xs">
                Sin informe cargado aún — Pulsa el botón morado{' '}
                <strong className="text-purple-600 dark:text-purple-400">Generar IA</strong> aquí
                mismo o en la barra superior para redactarlo, o abre{' '}
                <strong className="text-orange-600 dark:text-orange-400">Historial</strong> para
                cargar versiones previas.
              </p>
            </div>
          </div>
        )}

        {children}
      </div>
    </div>
  );
};

export default CollapsibleReportBox;
