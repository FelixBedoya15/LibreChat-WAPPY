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
          title="Cambiar de colaborador"
          className="group flex items-center justify-center h-8 min-w-[30px] px-2 rounded-xl border border-teal-300/70 dark:border-teal-700/70 bg-teal-100/60 dark:bg-teal-900/40 text-teal-800 dark:text-teal-200 hover:bg-teal-200/70 dark:hover:bg-teal-800/60 transition-all duration-300 shadow-2xs cursor-pointer active:scale-95 shrink-0"
        >
          <ArrowRight className="w-3.5 h-3.5 shrink-0 rotate-180" />
          <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 group-hover:ml-1.5 transition-all duration-300 whitespace-nowrap text-[11px] font-bold">
            Cambiar
          </span>
        </button>
      )}
    </div>
  );
};

export default WorkerSessionBadge;
