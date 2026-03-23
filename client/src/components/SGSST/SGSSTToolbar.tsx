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
    title: string;
    label: string;
    icon: IconName | string;
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
    onExportExcel?: () => void;
    hasData?: boolean;

    // Model Selector (Special item)
    selectedModel?: string;
    onSelectModel?: (model: string) => void;

    // Export (Special item)
    exportContent?: string;
    exportFileName?: string;

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
    onExportExcel,
    hasData,

    selectedModel,
    onSelectModel,
    exportContent,
    exportFileName,
    customSections = []
}) => {
    // Build effective button lists merging simplified props
    const effectiveHistory = [...historyButtons];
    if (onHistory) {
        effectiveHistory.push({
            id: 'history-default',
            onClick: onHistory,
            title: "Historial",
            label: "Historial",
            icon: "history",
            active: isHistoryOpen,
            variant: "history"
        });
    }

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
    if (onSave) {
        effectivePersistence.push({
            id: 'save-server-default',
            onClick: onSave,
            title: "Guardar en Servidor",
            label: "Guardar Informe",
            icon: "save",
            variant: "save",
            disabled: saveDisabled || !hasContent
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
            title: "Importar desde Excel",
            label: "Importar",
            icon: "upload",
            variant: "excel"
        });
    }
    if (onExportExcel) {
        effectiveExcel.push({
            id: 'excel-export',
            onClick: onExportExcel,
            title: "Exportar a Excel",
            label: "Exportar Excel",
            icon: "download",
            variant: "excel",
            disabled: !hasData
        });
    }

    const allGroups = [
        { id: 'history', buttons: effectiveHistory },
        { id: 'ai', buttons: effectiveAI, extra: onSelectModel && selectedModel ? (
            <ModelSelector selectedModel={selectedModel} onSelectModel={onSelectModel} disabled={isAnalyzing} />
        ) : null },
        { id: 'persistence', buttons: effectivePersistence },
        { id: 'export', buttons: exportButtons, extra: exportContent ? (
            <div title="Exportar Documento">
                <ExportDropdown content={exportContent} fileName={exportFileName || "Documento_SGSST"} />
            </div>
        ) : (!exportContent && (onSave || effectivePersistence.length > 0) ? (
            <button disabled title="Exportar (Genere primero el informe)" className="group flex items-center justify-center h-10 bg-surface-primary border border-border-medium text-text-tertiary rounded-xl opacity-30 shadow-sm shrink-0 cursor-not-allowed px-3">
                <Download className="h-5 w-5" />
                <div className="flex items-center max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 whitespace-nowrap">
                    <span className="text-xs font-bold uppercase tracking-wider">Exportar</span>
                </div>
            </button>
        ) : null) },
        { id: 'excel', buttons: effectiveExcel },
        { id: 'test', buttons: effectiveTest }
    ].filter(g => (g.buttons && g.buttons.length > 0) || g.extra);

    return (
        <div className="mt-6 flex flex-wrap items-center justify-center p-2 rounded-2xl bg-surface-secondary border border-border-medium shadow-lg w-fit mx-auto mb-6">
            {allGroups.map((group, idx) => (
                <React.Fragment key={group.id}>
                    <div className="flex items-center gap-1">
                        {group.buttons.map(btn => (
                            <ToolbarButton key={btn.id} {...btn} />
                        ))}
                        {group.extra}
                    </div>
                    {idx < allGroups.length - 1 && <ToolbarSeparator />}
                </React.Fragment>
            ))}
            {customSections.map((section, idx) => (
                <React.Fragment key={`custom-${idx}`}>
                    <ToolbarSeparator />
                    <div className="flex items-center gap-1">
                        {section}
                    </div>
                </React.Fragment>
            ))}
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
            onClick={onClick}
            disabled={disabled}
            className={cn(
                "group flex items-center justify-center h-10 px-2.5 min-w-[40px] transition-all duration-300 shadow-sm shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border outline-none rounded-xl",
                variantStyles[variant]
            )}
        >
            <div className="relative flex-shrink-0 flex items-center justify-center">
                {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                    <>
                        {typeof icon === 'string' ? (
                            <AnimatedIcon name={icon as IconName} size={20} />
                        ) : (
                            React.createElement(icon as any, { size: 20 })
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
                <div className="flex items-center max-w-0 overflow-hidden opacity-0 group-hover:max-w-[200px] group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 ease-in-out whitespace-nowrap">
                    <span className="text-sm font-bold tracking-wide">{label}</span>
                </div>
            )}
        </motion.button>
    );
};

const ToolbarSeparator = () => <div className="h-6 w-px bg-border-medium/60 mx-1" />;

export default SGSSTToolbar;
