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
            className="group flex h-9 min-w-[36px] shrink-0 cursor-not-allowed items-center justify-center rounded-xl border border-border-medium/40 bg-white dark:bg-gray-900 px-3.5 text-text-tertiary opacity-40 shadow-sm sm:h-10 sm:min-w-[40px] sm:px-3"
          >
            <Download className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
            <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 group-hover:ml-2 group-hover:max-w-xs group-hover:opacity-100 sm:flex">
              {/* eslint-disable-next-line i18next/no-literal-string */}
              <span className="text-xs sm:text-sm font-bold tracking-wide">Exportar</span>
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
  const variantStyles = {
    ai: active
      ? 'bg-teal-500/10 text-teal-600 border-teal-500/20 hover:bg-teal-500/20 dark:bg-teal-950/20 dark:text-teal-400'
      : 'bg-white dark:bg-gray-900 border-border-medium/40 text-teal-600 dark:text-teal-400 hover:bg-teal-50/50 dark:hover:bg-teal-950/20',
    history: active
      ? 'bg-teal-500/10 text-teal-600 border-teal-500/20 hover:bg-teal-500/20 dark:bg-teal-950/20 dark:text-teal-400'
      : 'bg-white dark:bg-gray-900 border-border-medium/40 text-text-secondary hover:text-text-primary hover:bg-surface-hover',
    database:
      'bg-white dark:bg-gray-900 border-border-medium/40 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 text-blue-600 dark:text-blue-400',
    save: 'bg-white dark:bg-gray-900 border-border-medium/40 hover:bg-purple-50/50 dark:hover:bg-purple-950/20 text-purple-600 dark:text-purple-400',
    dummy: 'bg-white dark:bg-gray-900 border-border-medium/40 text-amber-600 dark:text-amber-400 hover:bg-amber-50/50 dark:hover:bg-amber-950/20',
    excel: 'bg-white dark:bg-gray-900 border-border-medium/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20',
    default: active
      ? 'bg-teal-500/10 text-teal-600 border-teal-500/20 hover:bg-teal-500/20 dark:bg-teal-950/20 dark:text-teal-400'
      : 'bg-white dark:bg-gray-900 border-border-medium/40 text-text-secondary hover:text-text-primary hover:bg-surface-hover',
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
        'group flex h-9 min-w-[36px] shrink-0 cursor-pointer items-center justify-center rounded-xl border px-3.5 shadow-sm outline-none transition-all duration-300 ease-in-out active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 sm:h-10 sm:min-w-[40px] sm:px-3',
        variantStyles[variant],
      )}
    >
      <div className="relative flex flex-shrink-0 items-center justify-center">
        {isLoading || loading ? (
          <Loader2 className="h-4 w-4 animate-spin sm:h-4.5 sm:w-4.5" />
        ) : (
          <>
            {React.isValidElement(icon) ? (
              icon
            ) : typeof icon === 'string' ? (
              <AnimatedIcon name={icon as IconName} size={18} className="sm:h-4.5 sm:w-4.5" />
            ) : typeof icon === 'function' || (typeof icon === 'object' && icon !== null && '$$typeof' in icon) ? (
              React.createElement(icon as any, { className: 'w-4 h-4 sm:w-4.5 sm:h-4.5' })
            ) : null}
            {badge !== undefined && (
              <span className="absolute -right-3 -top-3 z-10 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
                {badge}
              </span>
            )}
          </>
        )}
      </div>

      {label && (
        <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[340px] group-hover:opacity-100 sm:flex">
          <span className="text-xs sm:text-sm font-bold tracking-wide">{label}</span>
        </div>
      )}
    </motion.button>
  );
};

export default SGSSTToolbar;
