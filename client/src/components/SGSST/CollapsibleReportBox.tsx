import React, { useState } from 'react';
import { ChevronDown, ChevronUp, History, Save, Loader2 } from 'lucide-react';
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
}

const CollapsibleReportBox = ({
    title,
    subtitle = "Generado por WAPPY AI Engine",
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
}: CollapsibleReportBoxProps) => {
    const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

    return (
        <div className={cn("rounded-2xl border-2 border-[#10b981]/20 bg-surface-primary overflow-hidden shadow-xl animate-in fade-in slide-in-from-top-4 duration-500", containerClassName)}>
            <div
                className={cn(
                    "bg-gradient-to-r from-[#10b981]/10 to-transparent dark:from-[#10b981]/20 px-4 sm:px-6 py-3 sm:py-3.5 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5 cursor-pointer hover:bg-[#10b981]/5 transition-colors",
                    !isCollapsed && "border-b border-border-medium",
                    headerClassName
                )}
                onClick={() => setIsCollapsed(!isCollapsed)}
            >
                {/* Left: icon + title */}
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {icon && (
                        <div className="p-1.5 sm:p-2 rounded-xl bg-[#10b981]/20 text-[#10b981] shrink-0">
                            {icon}
                        </div>
                    )}
                    <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-[#0d9488] dark:text-[#10b981] flex items-center gap-2 uppercase tracking-wide text-xs sm:text-sm">
                            Análisis IA
                        </h3>
                        {title && <p className="text-[10px] sm:text-[11px] text-text-secondary font-semibold uppercase tracking-wider truncate mt-0.5">{title}</p>}
                    </div>
                </div>

                {/* Right: history button + actions + collapse toggle */}
                <div
                    className="flex flex-wrap items-center gap-2 shrink-0 justify-end"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Save button */}
                    {onSave && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onSave(); }}
                            disabled={saveDisabled || isSaving}
                            aria-label="Guardar Informe"
                            className={cn(
                                "group flex items-center justify-center h-8 min-w-[32px] sm:h-10 sm:min-w-[40px] px-2 sm:px-2.5 transition-all duration-300 shadow-sm shrink-0 border outline-none rounded-xl",
                                saveDisabled || isSaving ? "opacity-50 cursor-not-allowed bg-surface-primary border-border-medium text-text-tertiary" : "cursor-pointer bg-surface-primary border-border-medium hover:bg-surface-hover hover:border-purple-400 text-purple-600 sm:hover:-rotate-3 sm:hover:scale-105"
                            )}
                        >
                            {isSaving ? <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 animate-spin" /> : <Save className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />}
                            <div className="hidden sm:flex items-center max-w-0 overflow-hidden opacity-0 group-hover:max-w-[200px] group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 ease-in-out whitespace-nowrap">
                                <span className="text-sm font-bold tracking-wide">Guardar Informe</span>
                            </div>
                        </button>
                    )}

                    {/* History button */}
                    {onHistory && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onHistory(); }}
                            aria-label="Historial de informes"
                            className={cn(
                                "group flex items-center justify-center h-8 min-w-[32px] sm:h-10 sm:min-w-[40px] px-2 sm:px-2.5 transition-all duration-300 shadow-sm shrink-0 cursor-pointer border outline-none rounded-xl sm:hover:-rotate-3 sm:hover:scale-105",
                                isHistoryOpen
                                    ? "bg-teal-100 text-teal-700 dark:bg-teal-900/10 border-teal-400"
                                    : "bg-surface-primary text-text-primary hover:bg-surface-hover hover:border-teal-400 border-border-medium"
                            )}
                        >
                            <History className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                            <div className="hidden sm:flex items-center max-w-0 overflow-hidden opacity-0 group-hover:max-w-[200px] group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 ease-in-out whitespace-nowrap">
                                <span className="text-sm font-bold tracking-wide">Historial</span>
                            </div>
                        </button>
                    )}

                    {/* User-provided actions (e.g. ExportDropdown) */}
                    {actions}

                    {/* Collapse toggle */}
                    <button
                        onClick={(e) => { e.stopPropagation(); setIsCollapsed(!isCollapsed); }}
                        className="p-1.5 sm:p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-xl transition-colors text-[#10b981] focus:outline-none flex items-center justify-center h-8 w-8 sm:h-10 sm:w-10 shrink-0"
                    >
                        {isCollapsed ? <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5" /> : <ChevronUp className="h-4 w-4 sm:h-5 sm:w-5" />}
                    </button>
                </div>
            </div>

            {!isCollapsed && (
                <div className="w-full overflow-hidden bg-transparent">
                    {children}
                </div>
            )}
        </div>
    );
};

export default CollapsibleReportBox;
