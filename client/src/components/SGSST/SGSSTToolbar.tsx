import React from 'react';
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
  variant?: 'ai' | 'history' | 'database' | 'save' | 'dummy' | 'excel' | 'default';
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

  // Custom sections
  customSections?: React.ReactNode[];
}

const ToolbarSeparator = () => <div className="bg-border-medium/60 mx-1 h-6 w-px" />;

export const SGSSTToolbar: React.FC<SGSSTToolbarProps> = ({
  historyButtons = [],
  aiButtons = [],
  persistenceButtons = [],
  exportButtons = [],
  testButtons = [],

  onAnalyze,
  isAnalyzing,
  onHistory,
  isHistoryOpen,
  onSave,
  onSaveLocal,
  isSavingLocal,
  hasContent,
  saveDisabled,
  onDummy,

  onImportExcel,
  importExcelLabel,
  importExcelTitle,
  onExportExcel,
  onDownloadTemplate,
  hasData,

  selectedModel,
  onSelectModel,
  exportContent,
  exportFileName,
  onlyExcel,
  customSections = [],
}) => {
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

  // Build effective button lists merging simplified props
  const effectiveHistory = [...historyButtons];
  // onHistory injection removed to prevent duplicate History button
  // since it is now natively included in the Live Editor panel across all apps.

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
        ) : !exportContent && !onExportExcel && !onDownloadTemplate && (onSave || effectivePersistence.length > 0) ? (
          <button
            disabled
            className="group flex h-7 min-w-[28px] shrink-0 cursor-not-allowed items-center justify-center rounded-xl border border-green-500/30 bg-green-500/10 px-2 text-green-700 dark:text-green-300 opacity-40 shadow-xs sm:h-8 sm:min-w-[32px] sm:px-2.5"
          >
            <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 group-hover:ml-1.5 group-hover:max-w-xs group-hover:opacity-100 sm:flex">
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

  const flatMobileItems = React.useMemo(() => {
    const items: Array<
      | { id: string; type: 'button'; content: ToolbarButtonConfig }
      | { id: string; type: 'extra'; content: React.ReactNode }
    > = [];
    allItems.forEach((group) => {
      (group.buttons || []).forEach((btn) => {
        items.push({ id: btn.id, type: 'button', content: btn });
      });
      if (group.extra) {
        items.push({ id: `${group.id}-extra`, type: 'extra', content: group.extra });
      }
    });
    return items;
  }, [allItems]);

  const mobileRows = React.useMemo(() => {
    const result: any[][] = [];
    for (let i = 0; i < flatMobileItems.length; i += 4) {
      result.push(flatMobileItems.slice(i, i + 4));
    }
    return result;
  }, [flatMobileItems]);

  return (
    <div className="bg-surface-secondary/80 mx-auto mb-6 mt-6 flex w-fit flex-col items-center justify-center gap-2 rounded-3xl border border-border-medium p-2 shadow-2xl backdrop-blur-md">
      {/* Desktop View: Single Row */}
      <div className="hidden flex-wrap items-center justify-center sm:flex">
        {allItems.map((group, idx) => (
          <React.Fragment key={group.id}>
            <div className="flex items-center gap-1.5 px-0.5">
              {(group.buttons || []).map((btn) => (
                <ToolbarButton key={btn.id} {...btn} />
              ))}
              {group.extra}
            </div>
            {idx < allItems.length - 1 && <ToolbarSeparator />}
          </React.Fragment>
        ))}
      </div>

      {/* Mobile View: Flat list of max 4 buttons per row, no group separators */}
      <div className="flex flex-col items-center gap-1.5 sm:hidden">
        {mobileRows.map((row, rIdx) => (
          <div key={rIdx} className="flex items-center justify-center gap-1.5">
            {row.map((item) => (
              <React.Fragment key={item.id}>
                {item.type === 'button' ? <ToolbarButton {...item.content} /> : item.content}
              </React.Fragment>
            ))}
          </div>
        ))}
      </div>
    </div>
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
    if (variant === 'ai' || /(ia\b|con ia|inteligencia|dictamen|auditar|analizar)/.test(text)) {
      return active
        ? 'bg-purple-500/20 border-purple-500/50 text-purple-700 dark:text-purple-300 ring-1 ring-purple-500/30'
        : 'bg-purple-500/10 border-purple-500/30 text-purple-700 dark:text-purple-300 hover:bg-purple-500/20';
    }
    if (variant === 'dummy' || /(datos de prueba|dummy|prueba)/.test(text)) {
      return 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20';
    }
    if (/(qr|copiar|compartir|link|portal)/.test(text)) {
      return 'bg-fuchsia-500/10 border-fuchsia-500/30 text-fuchsia-700 dark:text-fuchsia-300 hover:bg-fuchsia-500/20';
    }
    if (/(importar|subir|cargar|plantilla)/.test(text)) {
      return 'bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-300 hover:bg-blue-500/20';
    }
    if (variant === 'excel' || /(exportar|descargar|imprimir|excel|pdf|word|html|informe oficial)/.test(text)) {
      return 'bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-300 hover:bg-green-500/20';
    }
    if (/(sincronizar|actualizar|refrescar|recargar|reintentar)/.test(text)) {
      return 'bg-cyan-500/10 border-cyan-500/30 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-500/20';
    }
    if (variant === 'database' || variant === 'save' || /(guardar|confirmar|aprobar|fijar)/.test(text)) {
      return 'bg-teal-500/10 border-teal-500/30 text-teal-700 dark:text-teal-300 hover:bg-teal-500/20';
    }
    if (/(nuevo|nueva|añadir|agregar|crear|convocar)/.test(text)) {
      return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20';
    }
    if (/(eliminar|borrar|quitar|limpiar)/.test(text)) {
      return 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300 hover:bg-rose-500/20';
    }
    if (variant === 'history' || /(historial|analítica|ver|editar|reportes)/.test(text)) {
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
        'group flex h-7 min-w-[28px] shrink-0 cursor-pointer items-center justify-center rounded-xl border px-2 shadow-xs outline-none transition-all duration-300 ease-in-out sm:hover:-rotate-3 sm:hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 sm:h-8 sm:min-w-[32px] sm:px-2.5',
        getDynamicStyle(),
      )}
    >
      <div className="relative flex flex-shrink-0 items-center justify-center">
        {isLoading || loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin sm:h-4 sm:w-4" />
        ) : (
          <>
            {React.isValidElement(icon) ? (
              icon
            ) : typeof icon === 'string' ? (
              <AnimatedIcon name={icon as IconName} size={16} className="sm:h-4 sm:w-4" />
            ) : typeof icon === 'function' || (typeof icon === 'object' && icon !== null && '$$typeof' in icon) ? (
              React.createElement(icon as any, { className: 'w-3.5 h-3.5 sm:w-4 sm:h-4' })
            ) : null}
            {badge !== undefined && (
              <span className="absolute -right-2.5 -top-2 z-10 flex h-3.5 min-w-[14px] px-0.5 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-sm ring-1 ring-white">
                {badge}
              </span>
            )}
          </>
        )}
      </div>

      {label && (
        <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-1.5 group-hover:max-w-[300px] group-hover:opacity-100 sm:flex">
          <span className="text-xs font-bold tracking-wide">{label}</span>
        </div>
      )}
    </motion.button>
  );
};

export default SGSSTToolbar;
