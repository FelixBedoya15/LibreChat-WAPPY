import React from 'react';
import { UserCheck, Shield, ArrowRight } from 'lucide-react';

interface WorkerSessionBadgeProps {
  nombre: string;
  cedula: string;
  cargo?: string;
  companyName?: string;
  onClear?: () => void;
  className?: string;
}

export const WorkerSessionBadge: React.FC<WorkerSessionBadgeProps> = ({
  nombre,
  cedula,
  cargo,
  companyName,
  onClear,
  className = '',
}) => {
  const getInitials = (name: string) => {
    return (name || 'Trabajador')
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0]?.toUpperCase())
      .join('');
  };

  return (
    <div
      className={`p-3.5 sm:p-4 rounded-2xl bg-teal-50/80 dark:bg-teal-950/40 border border-teal-200/80 dark:border-teal-800/60 shadow-xs flex items-center justify-between gap-3 text-xs animate-in fade-in duration-200 ${className}`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
          {getInitials(nombre)}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-extrabold text-teal-950 dark:text-teal-200 text-sm truncate">
              {nombre}
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
              <UserCheck className="w-3 h-3" /> Autenticado
            </span>
          </div>
          <p className="text-[11px] text-teal-700 dark:text-teal-300/90 truncate mt-0.5 font-medium">
            CC: {cedula} {cargo ? `• ${cargo}` : ''} {companyName ? `• ${companyName}` : ''}
          </p>
        </div>
      </div>

      {onClear && (
        <button
          type="button"
          onClick={onClear}
          className="text-[11px] font-bold text-teal-700 dark:text-teal-300 hover:text-teal-900 dark:hover:text-teal-100 hover:underline px-2 py-1 rounded-lg hover:bg-teal-100/60 dark:hover:bg-teal-900/50 transition-colors shrink-0"
        >
          Cambiar
        </button>
      )}
    </div>
  );
};

export default WorkerSessionBadge;
