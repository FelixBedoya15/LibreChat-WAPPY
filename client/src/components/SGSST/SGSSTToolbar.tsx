import React, { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Loader2, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '~/utils';
import { AnimatedIcon, IconName } from '~/components/ui/AnimatedIcon';
import ModelSelector from './ModelSelector';
import ExportDropdown from './ExportDropdown';

export interface ToolbarButtonConfig {
  id?: string;
  onClick: () => void;
  title?: string;
  label: string;
  icon: IconName | string | React.ComponentType<any> | React.ReactNode;
  variant?: 'ai' | 'history' | 'database' | 'save' | 'dummy' | 'excel' | 'default' | string;
  disabled?: boolean;
  active?: boolean;
  isLoading?: boolean;
  loading?: boolean;
  badge?: number | string;
}

interface SGSSTToolbarProps {
  // Standard groups configurations
  historyButtons?: ToolbarButtonConfig[];
  aiButtons?: ToolbarButtonConfig[];
  persistenceButtons?: ToolbarButtonConfig[];
  exportButtons?: ToolbarButtonConfig[];
  testButtons?: ToolbarButtonConfig[];

  // Backwards compatibility / Simplified props
  onAnalyze?: () => void;
  isAnalyzing?: boolean;
  onHistory?: () => void;
  isHistoryOpen?: boolean;
  onSave?: () => void;
  onSaveLocal?: () => void;
  isSavingLocal?: boolean;
  hasContent?: boolean;
  saveDisabled?: boolean;
  onDummy?: () => void;

  // Excel (Special items)
  onImportExcel?: () => void;
  importExcelLabel?: string;
  importExcelTitle?: string;
  onExportExcel?: () => void;
  onDownloadTemplate?: () => void;
  hasData?: boolean;

  // Model Selector (Special item)
  selectedModel?: string;
  onSelectModel?: (model: string) => void;

  // Export (Special item)
  exportContent?: string;
  exportFileName?: string;
  onlyExcel?: boolean;

  // Custom sections & children
  customSections?: React.ReactNode[];
  children?: React.ReactNode;
  disableHeroPortal?: boolean;
}

export const SGSSTToolbar: React.FC<SGSSTToolbarProps> = ({
  historyButtons = [],
  aiButtons = [],
  persistenceButtons = [],
  exportButtons = [],
  testButtons = [],

  onAnalyze,
  isAnalyzing,
  onSave,
  onSaveLocal,
  isSavingLocal,
  onDummy,

  onImportExcel,
  importExcelLabel,
  importExcelTitle,
  onExportExcel,
  onDownloadTemplate,

  selectedModel,
  onSelectModel,
  exportContent,
  exportFileName,
  onlyExcel,
  customSections = [],
  children,
  disableHeroPortal = false,
}) => {
  const anchorRef = useRef<HTMLSpanElement | null>(null);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  // Listener global para ejecutar la generación IA de este módulo cuando Tenshi la ordene
  React.useEffect(() => {
    if (!onAnalyze) return;
    const handleTrigger = () => {
      if (!isAnalyzing) {
        onAnalyze();
      }
    };
    window.addEventListener('wappy-generar-analisis-ia', handleTrigger);
    window.addEventListener('wappy-generar-analisis-actual', handleTrigger);
    return () => {
      window.removeEventListener('wappy-generar-analisis-ia', handleTrigger);
      window.removeEventListener('wappy-generar-analisis-actual', handleTrigger);
    };
  }, [onAnalyze, isAnalyzing]);

  useLayoutEffect(() => {
    if (disableHeroPortal || typeof document === 'undefined') {
      setPortalTarget(null);
      return;
    }
    const anchor = anchorRef.current;
    if (!anchor) return;

    const scopeRoot =
      anchor.closest('[data-sgsst-category-body]') ||
      anchor.parentElement?.parentElement ||
      document.body;

    const slots = Array.from(
      scopeRoot.querySelectorAll<HTMLElement>('[data-sgsst-hero-toolbar-slot]'),
    );
    const availableSlot = slots.find((s) => !s.dataset.claimed);

    if (availableSlot) {
      availableSlot.dataset.claimed = 'true';
      setPortalTarget(availableSlot);
      return () => {
        delete availableSlot.dataset.claimed;
      };
    } else {
      setPortalTarget(null);
    }
  }, [disableHeroPortal]);

  // Build effective button lists merging simplified props
  const effectiveHistory = [...historyButtons];

  const effectiveAI = [...aiButtons];
  if (onAnalyze) {
    effectiveAI.push({
      id: 'ai-default',
      onClick: onAnalyze,
      title: 'Generar con IA',
      label: 'Generar IA',
      icon: 'sparkles',
      variant: 'ai',
      isLoading: isAnalyzing,
      disabled: isAnalyzing,
    });
  }

  const effectivePersistence = [...persistenceButtons];
  if (onSaveLocal) {
    effectivePersistence.push({
      id: 'save-local-default',
      onClick: onSaveLocal,
      title: 'Guardar Localmente',
      label: 'Guardar Datos',
      icon: 'database',
      variant: 'database',
      isLoading: isSavingLocal,
      disabled: isSavingLocal,
    });
  }

  const effectiveTest = [...testButtons];
  if (onDummy) {
    effectiveTest.push({
      id: 'dummy-default',
      onClick: onDummy,
      title: 'Generar Datos de Prueba',
      label: 'Datos de Prueba',
      icon: 'robot',
      variant: 'dummy',
    });
  }

  const effectiveExcel: ToolbarButtonConfig[] = [];
  if (onImportExcel) {
    effectiveExcel.push({
      id: 'excel-import',
      onClick: onImportExcel,
      title: importExcelTitle || 'Importar desde Excel',
      label: importExcelLabel || 'Importar Excel',
      icon: 'upload',
      variant: 'excel',
    });
  }

  const allGroups = [
    { id: 'history', buttons: effectiveHistory },
    {
      id: 'ai',
      buttons: effectiveAI,
      extra:
        onSelectModel && selectedModel ? (
          <ModelSelector
            selectedModel={selectedModel}
            onSelectModel={onSelectModel}
            disabled={isAnalyzing}
          />
        ) : null,
    },
    { id: 'persistence', buttons: effectivePersistence },
    {
      id: 'export',
      buttons: exportButtons,
      extra:
        exportContent || onExportExcel || onDownloadTemplate ? (
          <div>
            <ExportDropdown
              content={exportContent || ''}
              fileName={exportFileName || 'Documento_SGSST'}
              onExportExcel={onExportExcel}
              onDownloadTemplate={onDownloadTemplate}
              onlyExcel={onlyExcel}
            />
          </div>
        ) : !exportContent &&
          !onExportExcel &&
          !onDownloadTemplate &&
          (onSave || effectivePersistence.length > 0) ? (
          <button
            disabled
            className="group flex h-9 min-w-[36px] shrink-0 cursor-not-allowed items-center justify-center rounded-xl border border-green-500/30 bg-green-500/10 px-2.5 text-green-700 dark:text-green-300 opacity-40 shadow-xs sm:h-10 sm:min-w-[40px] sm:px-3"
          >
            <Download className="h-4 w-4" />
            <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 group-hover:ml-2 group-hover:max-w-xs group-hover:opacity-100 sm:flex">
              {/* eslint-disable-next-line i18next/no-literal-string */}
              <span className="text-xs font-bold tracking-wide">Exportar</span>
            </div>
          </button>
        ) : null,
    },
    { id: 'excel', buttons: effectiveExcel },
    { id: 'test', buttons: effectiveTest },
  ].filter((g) => (g.buttons && g.buttons.length > 0) || g.extra);

  const allItems = React.useMemo(
    () => [
      ...allGroups,
      ...customSections.map((section, idx) => ({
        id: `custom-${idx}`,
        buttons: [],
        extra: section,
      })),
    ],
    [allGroups, customSections],
  );

  const toolbarContent = (
    <div className="flex flex-wrap items-center gap-2">
      {allItems.map((group) => (
        <React.Fragment key={group.id}>
          {(group.buttons || []).map((btn, bIdx) => (
            <ToolbarButton key={btn.id || `${group.id}-${bIdx}`} {...btn} />
          ))}
          {group.extra}
        </React.Fragment>
      ))}
      {children}
    </div>
  );

  return (
    <>
      <span ref={anchorRef} className="hidden" aria-hidden="true" />
      {portalTarget ? createPortal(toolbarContent, portalTarget) : toolbarContent}
    </>
  );
};

export const ToolbarButton: React.FC<ToolbarButtonConfig> = ({
  id,
  onClick,
  title,
  label,
  icon,
  disabled,
  active,
  variant = 'default',
  isLoading,
  loading,
  badge,
}) => {
  const getDynamicStyle = () => {
    const text = `${label || ''} ${title || ''}`.toLowerCase();
    if (variant === 'ai' || variant === 'purple' || /(ia\b|con ia|inteligencia|dictamen|auditar|analizar)/.test(text)) {
      return active
        ? 'bg-purple-500/20 border-purple-500/50 text-purple-700 dark:text-purple-300 ring-1 ring-purple-500/30'
        : 'bg-purple-500/10 border-purple-500/30 text-purple-700 dark:text-purple-300 hover:bg-purple-500/20';
    }
    if (variant === 'dummy' || variant === 'amber' || /(datos de prueba|dummy|prueba)/.test(text)) {
      return 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20';
    }
    if (variant === 'fuchsia' || /(qr|copiar|compartir|link|portal)/.test(text)) {
      return 'bg-fuchsia-500/10 border-fuchsia-500/30 text-fuchsia-700 dark:text-fuchsia-300 hover:bg-fuchsia-500/20';
    }
    if (variant === 'blue' || /(importar|subir|cargar|plantilla)/.test(text)) {
      return 'bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-300 hover:bg-blue-500/20';
    }
    if (variant === 'excel' || variant === 'green' || /(exportar|descargar|imprimir|excel|pdf|word|html|informe oficial)/.test(text)) {
      return 'bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-300 hover:bg-green-500/20';
    }
    if (variant === 'cyan' || /(sincronizar|actualizar|refrescar|recargar|reintentar)/.test(text)) {
      return 'bg-cyan-500/10 border-cyan-500/30 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-500/20';
    }
    if (variant === 'database' || variant === 'save' || variant === 'teal' || /(guardar|confirmar|aprobar|fijar)/.test(text)) {
      return active
        ? 'bg-teal-500/20 border-teal-500/50 text-teal-700 dark:text-teal-300 ring-1 ring-teal-500/30'
        : 'bg-teal-500/10 border-teal-500/30 text-teal-700 dark:text-teal-300 hover:bg-teal-500/20';
    }
    if (variant === 'emerald' || /(nuevo|nueva|añadir|agregar|crear|convocar)/.test(text)) {
      return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20';
    }
    if (variant === 'rose' || /(eliminar|borrar|quitar|limpiar)/.test(text)) {
      return 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300 hover:bg-rose-500/20';
    }
    if (variant === 'history' || variant === 'orange' || /(historial|analítica|ver|editar|reportes)/.test(text)) {
      return active
        ? 'bg-orange-500/20 border-orange-500/50 text-orange-700 dark:text-orange-300 ring-1 ring-orange-500/30'
        : 'bg-orange-500/10 border-orange-500/30 text-orange-700 dark:text-orange-300 hover:bg-orange-500/20';
    }
    return active
      ? 'bg-teal-500/20 border-teal-500/50 text-teal-700 dark:text-teal-300 ring-1 ring-teal-500/30'
      : 'bg-slate-500/10 dark:bg-zinc-800/80 border-slate-300/60 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:bg-slate-500/20';
  };

  return (
    <motion.button
      id={id}
      data-action={id || 'toolbar-button'}
      data-clickable="true"
      whileHover="hover"
      whileTap="tap"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      disabled={disabled}
      title={title}
      aria-label={title || label}
      className={cn(
        'group flex h-9 min-w-[36px] shrink-0 cursor-pointer items-center justify-center rounded-xl border px-2.5 shadow-xs outline-none transition-all duration-300 ease-in-out sm:hover:-rotate-3 sm:hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 sm:h-10 sm:min-w-[40px] sm:px-3',
        getDynamicStyle(),
      )}
    >
      <div className="relative flex flex-shrink-0 items-center justify-center">
        {isLoading || loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            {React.isValidElement(icon) ? (
              icon
            ) : typeof icon === 'string' ? (
              <AnimatedIcon name={icon as IconName} size={18} />
            ) : typeof icon === 'function' || (typeof icon === 'object' && icon !== null && '$$typeof' in icon) ? (
              React.createElement(icon as any, { className: 'w-4 h-4' })
            ) : null}
            {badge !== undefined && (
              <span className="absolute -right-2.5 -top-2 z-10 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-1 ring-white">
                {badge}
              </span>
            )}
          </>
        )}
      </div>

      {label && (
        <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[300px] group-hover:opacity-100 sm:flex">
          <span className="text-sm font-bold tracking-wide">{label}</span>
        </div>
      )}
    </motion.button>
  );
};

export default SGSSTToolbar;
