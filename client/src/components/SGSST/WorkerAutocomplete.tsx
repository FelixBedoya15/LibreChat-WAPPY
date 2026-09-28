import React, { useState, useRef, useEffect } from 'react';
import { User, Briefcase, CreditCard } from 'lucide-react';
import { cn } from '~/utils';

export interface WorkerItem {
  nombre: string;
  identificacion?: string;
  cargo?: string;
  area?: string;
  eps?: string;
  arl?: string;
  [key: string]: any;
}

export interface WorkerAutocompleteProps {
  value: string;
  onChange: (val: string) => void;
  onSelect?: (worker: WorkerItem) => void;
  data?: WorkerItem[];
  searchKey?: 'nombre' | 'identificacion';
  placeholder?: string;
  className?: string;
  wrapperClassName?: string;
  disabled?: boolean;
}

export const WorkerAutocomplete: React.FC<WorkerAutocompleteProps> = ({
  value,
  onChange,
  onSelect,
  data = [],
  searchKey = 'nombre',
  placeholder = 'Buscar o seleccionar trabajador...',
  className,
  wrapperClassName,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const safeData = Array.isArray(data) ? data : [];

  const filteredOptions = safeData.filter((w) => {
    if (!w) return false;
    const searchVal = w[searchKey];
    if (!value || !value.trim()) return true;
    return (
      (searchVal && String(searchVal).toLowerCase().includes(String(value).toLowerCase())) ||
      (w.nombre && String(w.nombre).toLowerCase().includes(String(value).toLowerCase())) ||
      (w.identificacion && String(w.identificacion).toLowerCase().includes(String(value).toLowerCase()))
    );
  });

  const exactMatch =
    value &&
    filteredOptions.find(
      (w) => String(w[searchKey] || '').toLowerCase() === String(value).toLowerCase(),
    );

  return (
    <div className={cn('relative', wrapperClassName || 'w-full')} ref={wrapperRef}>
      <input
        type="text"
        value={value}
        disabled={disabled}
        onChange={(e) => {
          onChange(e.target.value);
          setIsOpen(true);
        }}
        onClick={() => {
          if (!disabled) setIsOpen(true);
        }}
        onFocus={() => {
          if (!disabled) setIsOpen(true);
        }}
        placeholder={placeholder}
        autoComplete="off"
        className={cn(
          'w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-slate-800 dark:text-zinc-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition-all',
          className,
        )}
      />

      {isOpen && filteredOptions.length > 0 && (
        <ul className="absolute z-50 left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl py-1 text-left origin-top animate-in fade-in zoom-in-95 duration-200 divide-y divide-slate-100 dark:divide-zinc-800/60">
          {filteredOptions.map((w, idx) => (
            <li
              key={idx}
              className="px-3.5 py-2.5 text-xs hover:bg-teal-50 dark:hover:bg-teal-950/40 cursor-pointer transition-colors flex items-start gap-2.5 group"
              onClick={() => {
                if (onSelect) {
                  onSelect(w);
                } else {
                  onChange(w[searchKey] || w.nombre || '');
                }
                setIsOpen(false);
              }}
            >
              <div className="p-1.5 rounded-lg bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5 group-hover:bg-teal-100">
                <User className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-slate-800 dark:text-zinc-100 group-hover:text-teal-700 dark:group-hover:text-teal-300 truncate">
                  {w.nombre}
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500 dark:text-zinc-400 flex-wrap">
                  {w.identificacion && (
                    <span className="flex items-center gap-1 font-mono">
                      <CreditCard className="w-2.5 h-2.5 text-slate-400" />
                      CC: {w.identificacion}
                    </span>
                  )}
                  {w.cargo && (
                    <span className="flex items-center gap-1 text-slate-600 dark:text-zinc-300">
                      <Briefcase className="w-2.5 h-2.5 text-slate-400" />
                      {w.cargo}
                    </span>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default WorkerAutocomplete;
