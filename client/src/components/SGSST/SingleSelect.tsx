import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, CheckCircle2 } from 'lucide-react';
import { cn } from '~/utils';

const SingleSelect = ({ options, value, onChange, placeholder }: { options: string[], value: string, onChange: (val: string) => void, placeholder?: string }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative w-full" ref={containerRef}>
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="w-full rounded-xl border border-border-medium px-3 py-2 text-sm bg-surface-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all shadow-sm flex items-center justify-between cursor-pointer hover:border-teal-400"
            >
                <span className={!value ? "text-text-tertiary" : ""}>{value || placeholder || "Seleccionar..."}</span>
                <ChevronDown className={cn("h-4 w-4 text-text-tertiary transition-transform duration-200", isOpen && "rotate-180")} />
            </div>

            {isOpen && (
                <div className="absolute z-[60] mt-1 w-full max-h-64 overflow-y-auto bg-surface-secondary border border-border-medium rounded-xl shadow-xl animate-in fade-in slide-in-from-top-2">
                    <div className="p-1">
                        {options.map(opt => (
                            <div
                                key={opt}
                                onClick={() => { onChange(opt); setIsOpen(false); }}
                                className={cn(
                                    "flex items-center justify-between px-3 py-2 text-sm rounded-md cursor-pointer transition-colors",
                                    value === opt ? "bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 font-bold" : "hover:bg-surface-hover text-text-primary"
                                )}
                            >
                                <span>{opt}</span>
                                {value === opt && <CheckCircle2 className="h-4 w-4 text-teal-600" />}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SingleSelect;
