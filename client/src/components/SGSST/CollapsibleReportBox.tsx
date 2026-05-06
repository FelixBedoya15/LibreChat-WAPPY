import React, { useState } from 'react';
import { ChevronDown, ChevronUp, History } from 'lucide-react';
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
}: CollapsibleReportBoxProps) => {
    const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

    return (
        <div className={cn("rounded-2xl border-2 border-[#10b981]/20 bg-surface-primary overflow-hidden shadow-xl animate-in fade-in slide-in-from-top-4 duration-500", containerClassName)}>
            <div
                className={cn(
                    "bg-gradient-to-r from-[#10b981]/10 to-transparent dark:from-[#10b981]/20 px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-[#10b981]/5 transition-colors",
                    !isCollapsed && "border-b border-border-medium",
                    headerClassName
                )}
                onClick={() => setIsCollapsed(!isCollapsed)}
            >
                {/* Left: icon + title */}
                <div className="flex flex-wrap items-center gap-3 w-full">
                    {icon && (
                        <div className="p-2 rounded-xl bg-[#10b981]/20 text-[#10b981]">
                            {icon}
                        </div>
                    )}
                    <div>
                        <h3 className="font-bold text-[#0d9488] dark:text-[#10b981] flex items-center gap-2 uppercase tracking-wide">
                            Análisis IA
                        </h3>
                        {title && <p className="text-[10px] text-text-secondary font-semibold uppercase tracking-widest mt-0.5">{title}</p>}
                    </div>
                </div>

                {/* Right: history button + actions + collapse toggle */}
                <div
                    className="flex flex-nowrap items-center gap-2 shrink-0 overflow-visible"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* History button — shown only when onHistory is provided */}
                    {onHistory && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onHistory(); }}
                            title="Historial de informes"
                            className={cn(
                                "flex items-center gap-1.5 h-8 px-3 rounded-xl border text-xs font-bold transition-all duration-200 shadow-sm",
                                isHistoryOpen
                                    ? "bg-teal-100 text-teal-700 border-teal-400 dark:bg-teal-900/30 dark:text-teal-300"
                                    : "bg-surface-primary text-text-primary border-border-medium hover:bg-surface-hover hover:border-teal-400 hover:text-teal-700"
                            )}
                        >
                            <History className="h-4 w-4" />
                            <span className="hidden sm:inline">Historial</span>
                        </button>
                    )}

                    {/* User-provided actions (e.g. ExportDropdown) */}
                    {actions}

                    {/* Collapse toggle */}
                    <button
                        onClick={(e) => { e.stopPropagation(); setIsCollapsed(!isCollapsed); }}
                        className="p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-md transition-colors text-[#10b981] focus:outline-none"
                    >
                        {isCollapsed ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
                    </button>
                </div>
            </div>

            {!isCollapsed && (
                <div className="p-1 overflow-hidden bg-white dark:bg-[#1a1a1a]">
                    {children}
                </div>
            )}
        </div>
    );
};

export default CollapsibleReportBox;
