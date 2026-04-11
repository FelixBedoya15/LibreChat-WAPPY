import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { ChevronDown, CheckCircle2 } from 'lucide-react';
import { cn } from '~/utils';

/**
 * SingleSelect — Dropdown that uses position:fixed via ReactDOM.createPortal
 * so it always escapes overflow:hidden/auto ancestor containers.
 * Automatically detects whether to open upward or downward based on available viewport space.
 */
const SingleSelect = ({
    options,
    value,
    onChange,
    placeholder,
}: {
    options: string[];
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
    const triggerRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const DROPDOWN_MAX_H = 256; // max-h-64 in px
    const MARGIN = 6;

    const calcStyle = () => {
        if (!triggerRef.current) return;
        const rect = triggerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom - MARGIN;
        const spaceAbove = rect.top - MARGIN;

        // Open upward if not enough space below AND there's room above
        const openUpward = spaceBelow < Math.min(DROPDOWN_MAX_H, 150) && spaceAbove > spaceBelow;

        setDropdownStyle({
            position: 'fixed',
            left: rect.left,
            width: rect.width,
            zIndex: 99999,
            ...(openUpward
                ? { bottom: window.innerHeight - rect.top + MARGIN }
                : { top: rect.bottom + MARGIN }),
        });
    };

    const handleToggle = () => {
        calcStyle();
        setIsOpen(o => !o);
    };

    useEffect(() => {
        if (!isOpen) return;
        const handleClickOutside = (e: MouseEvent) => {
            const t = e.target as Node;
            if (!triggerRef.current?.contains(t) && !dropdownRef.current?.contains(t)) {
                setIsOpen(false);
            }
        };
        const handleScroll = () => calcStyle();
        const handleResize = () => calcStyle();

        document.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('scroll', handleScroll, true);
        window.addEventListener('resize', handleResize);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', handleScroll, true);
            window.removeEventListener('resize', handleResize);
        };
    }, [isOpen]);

    const dropdown = isOpen ? (
        <div
            ref={dropdownRef}
            style={dropdownStyle}
            className="max-h-64 overflow-y-auto bg-surface-primary border border-border-medium rounded-xl shadow-xl animate-in fade-in slide-in-from-top-2 duration-150"
        >
            <div className="p-1">
                {options.map(opt => (
                    <div
                        key={opt}
                        onClick={() => { onChange(opt); setIsOpen(false); }}
                        className={cn(
                            'flex items-center justify-between px-3 py-2 text-sm rounded-md cursor-pointer transition-colors',
                            value === opt
                                ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 font-bold'
                                : 'hover:bg-surface-hover text-text-primary',
                        )}
                    >
                        <span>{opt}</span>
                        {value === opt && <CheckCircle2 className="h-4 w-4 text-teal-600" />}
                    </div>
                ))}
            </div>
        </div>
    ) : null;

    return (
        <>
            <div
                ref={triggerRef}
                onClick={handleToggle}
                className="w-full rounded-xl border border-border-medium px-3 py-2 text-sm bg-surface-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all shadow-sm flex items-center justify-between cursor-pointer hover:border-teal-400"
            >
                <span className={!value ? 'text-text-tertiary' : ''}>
                    {value || placeholder || 'Seleccionar...'}
                </span>
                <ChevronDown
                    className={cn(
                        'h-4 w-4 text-text-tertiary transition-transform duration-200',
                        isOpen && 'rotate-180',
                    )}
                />
            </div>

            {ReactDOM.createPortal(dropdown, document.body)}
        </>
    );
};

export default SingleSelect;
