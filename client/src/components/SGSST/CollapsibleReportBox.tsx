import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '~/utils';

interface CollapsibleReportBoxProps {
    title: string | React.ReactNode;
    subtitle?: string;
    icon?: React.ReactNode;
    actions?: React.ReactNode;
    headerClassName?: string;
    containerClassName?: string;
    defaultCollapsed?: boolean;
    children: React.ReactNode;
}

const CollapsibleReportBox = ({
    title,
    subtitle = "Generado por WAPPY AI Engine",
    icon,
    actions,
    headerClassName,
    containerClassName,
    defaultCollapsed = false,
    children
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
                
                <div className="flex flex-nowrap items-center gap-4 shrink-0 overflow-visible" onClick={(e) => e.stopPropagation()}>
                    {actions}
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
