import React from 'react';
import { Loader2, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '~/utils';
import { AnimatedIcon, IconName } from '~/components/ui/AnimatedIcon';
import ModelSelector from './ModelSelector';
import ExportDropdown from './ExportDropdown';

export interface ToolbarButtonConfig {
    id: string;
    onClick: () => void;
    title?: string;
    label: string;
    icon: IconName | string | React.ComponentType<any>;
    variant?: 'ai' | 'history' | 'database' | 'save' | 'dummy' | 'excel' | 'default';
    disabled?: boolean;
    active?: boolean;
    isLoading?: boolean;
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
    hasData,

    selectedModel,
    onSelectModel,
    exportContent,
    exportFileName,
    onlyExcel,
    customSections = []
}) => {
    // Build effective button lists merging simplified props
    const effectiveHistory = [...historyButtons];
    // onHistory injection removed to prevent duplicate History button 
    // since it is now natively included in the Live Editor panel across all apps.

    const effectiveAI = [...aiButtons];
    if (onAnalyze) {
        effectiveAI.push({
            id: 'ai-default',
            onClick: onAnalyze,
            title: "Generar con IA",
            label: "Generar IA",
            icon: "sparkles",
            variant: "ai",
            isLoading: isAnalyzing,
            disabled: isAnalyzing
        });
    }

    const effectivePersistence = [...persistenceButtons];
    if (onSaveLocal) {
        effectivePersistence.push({
            id: 'save-local-default',
            onClick: onSaveLocal,
            title: "Guardar Localmente",
            label: "Guardar Datos",
            icon: "database",
            variant: "database",
            isLoading: isSavingLocal,
            disabled: isSavingLocal
        });
    }


    const effectiveTest = [...testButtons];
    if (onDummy) {
        effectiveTest.push({
            id: 'dummy-default',
            onClick: onDummy,
            title: "Generar Datos de Prueba",
            label: "Datos de Prueba",
            icon: "robot",
            variant: "dummy"
        });
    }

    const effectiveExcel: ToolbarButtonConfig[] = [];
    if (onImportExcel) {
        effectiveExcel.push({
            id: 'excel-import',
            onClick: onImportExcel,
            title: importExcelTitle || "Importar desde Excel",
            label: importExcelLabel || "Importar Excel",
            icon: "upload",
            variant: "excel"
        });
    }

    const allGroups = [
        { id: 'history', buttons: effectiveHistory },
        { id: 'ai', buttons: effectiveAI, extra: onSelectModel && selectedModel ? (
            <ModelSelector selectedModel={selectedModel} onSelectModel={onSelectModel} disabled={isAnalyzing} />
        ) : null },
        { id: 'persistence', buttons: effectivePersistence },
        { id: 'export', buttons: exportButtons, extra: (exportContent || onExportExcel) ? (
            <div>
                <ExportDropdown content={exportContent || ''} fileName={exportFileName || "Documento_SGSST"} onExportExcel={onExportExcel} onlyExcel={onlyExcel} />
            </div>
        ) : (!exportContent && !onExportExcel && (onSave || effectivePersistence.length > 0) ? (
            <button disabled className="group flex items-center justify-center h-8 px-2 min-w-[32px] sm:h-10 sm:px-2.5 sm:min-w-[40px] bg-surface-primary border border-border-medium text-text-tertiary rounded-xl opacity-30 shadow-sm shrink-0 cursor-not-allowed">
                <Download className="h-4 w-4 sm:h-5 sm:w-5" />
                <div className="hidden sm:flex items-center max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 whitespace-nowrap">
                    <span className="text-xs font-bold uppercase tracking-wider">Exportar</span>
                </div>
            </button>
        ) : null) },
        { id: 'excel', buttons: effectiveExcel },
        { id: 'test', buttons: effectiveTest }
    ].filter(g => (g.buttons && g.buttons.length > 0) || g.extra);

    const allItems = React.useMemo(() => [
        ...allGroups,
        ...customSections.map((section, idx) => ({ id: `custom-${idx}`, buttons: [], extra: section }))
    ], [allGroups, customSections]);

    const rows = React.useMemo(() => {
        const result: any[][] = [];
        let currentRow: any[] = [];
        let rowCount = 0;

        allItems.forEach(group => {
            const groupSize = (group.buttons?.length || 0) + (group.extra ? 1 : 0);
            if (rowCount + groupSize > 5 && currentRow.length > 0) {
                result.push(currentRow);
                currentRow = [group];
                rowCount = groupSize;
            } else {
                currentRow.push(group);
                rowCount += groupSize;
            }
        });
        if (currentRow.length > 0) result.push(currentRow);
        return result;
    }, [allItems]);

    return (
        <div className="mt-6 flex flex-col items-center justify-center p-2 rounded-3xl bg-surface-secondary/80 backdrop-blur-md border border-border-medium shadow-2xl w-fit mx-auto mb-6 gap-2">
            {/* Desktop View: Single Row */}
            <div className="hidden sm:flex flex-wrap items-center justify-center">
                {allItems.map((group, idx) => (
                    <React.Fragment key={group.id}>
                        <div className="flex items-center gap-1.5 px-0.5">
                            {(group.buttons || []).map(btn => (
                                <ToolbarButton key={btn.id} {...btn} />
                            ))}
                            {group.extra}
                        </div>
                        {idx < allItems.length - 1 && <ToolbarSeparator />}
                    </React.Fragment>
                ))}
            </div>

            {/* Mobile View: Multi-row logic (max 5 buttons per row, group-aware) */}
            <div className="flex sm:hidden flex-col items-center gap-2">
                {rows.map((row, rIdx) => (
                    <div key={rIdx} className="flex items-center justify-center gap-1">
                        {row.map((group, gIdx) => (
                            <React.Fragment key={group.id}>
                                <div className="flex items-center gap-1.5 px-0.5">
                                    {(group.buttons || []).map(btn => (
                                        <ToolbarButton key={btn.id} {...btn} />
                                    ))}
                                    {group.extra}
                                </div>
                                {gIdx < row.length - 1 && <ToolbarSeparator />}
                            </React.Fragment>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
};

export const ToolbarButton: React.FC<ToolbarButtonConfig> = ({
    onClick,
    title,
    label,
    icon,
    disabled,
    active,
    variant = 'default',
    isLoading,
    badge
}) => {
    const variantStyles = {
        ai: "bg-teal-600 hover:bg-teal-700 text-white shadow-md",
        history: active 
            ? "bg-teal-100 text-teal-700 dark:bg-teal-900/10 border-teal-400" 
            : "bg-surface-primary text-text-primary hover:bg-surface-hover hover:border-teal-400 border-border-medium",
        database: "bg-surface-primary border-border-medium hover:bg-surface-hover hover:border-blue-400 text-blue-600",
        save: "bg-surface-primary border-border-medium hover:bg-surface-hover hover:border-purple-400 text-purple-600",
        dummy: "bg-orange-500 hover:bg-orange-600 text-white shadow-md",
        excel: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md",
        default: active 
            ? "bg-blue-50 text-blue-700 dark:bg-blue-900/10 border-blue-400" 
            : "bg-surface-primary border-border-medium hover:bg-surface-hover text-text-primary"
    };

    return (
        <motion.button
            whileHover="hover"
            whileTap="tap"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClick(); }}
            disabled={disabled}
            className={cn(
                "group flex items-center justify-center h-8 px-2 min-w-[32px] sm:h-10 sm:px-2.5 sm:min-w-[40px] transition-all duration-300 shadow-sm shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border outline-none rounded-xl sm:hover:-rotate-3 sm:hover:scale-105",
                variantStyles[variant]
            )}
        >
            <div className="relative flex-shrink-0 flex items-center justify-center">
                {isLoading ? (
                    <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                ) : (
                    <>
                        {typeof icon === 'string' ? (
                            <AnimatedIcon name={icon as IconName} size={18} className="sm:w-5 sm:h-5" />
                        ) : (
                            React.createElement(icon as any, { className: "w-4 h-4 sm:w-5 sm:h-5" })
                        )}
                        {badge !== undefined && (
                            <span className="absolute -top-3 -right-3 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white z-10">
                                {badge}
                            </span>
                        )}
                    </>
                )}
            </div>
            
            {label && (
                <div className="hidden sm:flex items-center max-w-0 overflow-hidden opacity-0 group-hover:max-w-[200px] group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 ease-in-out whitespace-nowrap">
                    <span className="text-sm font-bold tracking-wide">{label}</span>
                </div>
            )}
        </motion.button>
    );
};

const ToolbarSeparator = () => <div className="h-6 w-px bg-border-medium/60 mx-1" />;

export default SGSSTToolbar;
