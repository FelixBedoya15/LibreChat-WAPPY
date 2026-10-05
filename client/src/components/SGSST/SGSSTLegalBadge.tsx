import React, { useState, useEffect, useCallback } from 'react';
import { Scale, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuthContext } from '~/hooks';
import { useToastContext } from '@librechat/client';

interface SGSSTLegalBadgeProps {
  standardCode: string;
  label: string;
  tooltip: string;
  moduleName?: string;
  className?: string;
  iconOnly?: boolean;
}

export const SGSSTLegalBadge: React.FC<SGSSTLegalBadgeProps> = ({
  standardCode,
  label,
  tooltip,
  moduleName,
  className = '',
}) => {
  const { token } = useAuthContext();
  const { showToast } = useToastContext();
  const [isCompliant, setIsCompliant] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Consultar estado inicial en DiagnosticoData
  const checkStatus = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/sgsst/diagnostico/standard-status', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const codeClean = String(standardCode).replace(/^(est\.|art\.|estándar|numeral)\s*/i, '').trim();
        const st = data.statuses?.[codeClean] || data.statuses?.[standardCode];
        if (st === 'cumple') {
          setIsCompliant(true);
        } else if (st === 'pendiente' || st === 'no_cumple') {
          setIsCompliant(false);
        }
      }
    } catch (err) {
      // Ignorar silenciosamente si no hay red o sesión
    }
  }, [token, standardCode]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  // Escuchar eventos globales de sincronización del Diagnóstico
  useEffect(() => {
    const handleSync = (e: any) => {
      const detail = e?.detail;
      const codeClean = String(standardCode).replace(/^(est\.|art\.|estándar|numeral)\s*/i, '').trim();
      if (detail && (detail.standardCode === codeClean || detail.standardCode === standardCode)) {
        if (typeof detail.isCompliant === 'boolean') {
          setIsCompliant(detail.isCompliant);
        } else {
          checkStatus();
        }
      }
    };
    window.addEventListener('sgsst-diagnostic-updated', handleSync);
    return () => window.removeEventListener('sgsst-diagnostic-updated', handleSync);
  }, [standardCode, checkStatus]);

  // Al dar click: alternar estado y registrar en Diagnóstico
  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!token || isLoading) return;

    setIsLoading(true);
    const targetStatus = isCompliant ? 'pendiente' : 'cumple';

    try {
      const res = await fetch('/api/sgsst/diagnostico/toggle-standard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          standardCode,
          targetStatus,
          moduleName: moduleName || label,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const nextState = data.isCompliant ?? (targetStatus === 'cumple');
        setIsCompliant(nextState);

        if (nextState) {
          showToast({
            message: `¡${label} registrado y validado como CUMPLIDO en el Diagnóstico institucional!`,
            status: 'success',
            severity: 'success',
          });
        } else {
          showToast({
            message: `${label} marcado como Pendiente en el Diagnóstico.`,
            status: 'info',
            severity: 'info',
          });
        }

        window.dispatchEvent(
          new CustomEvent('sgsst-diagnostic-updated', {
            detail: {
              standardCode,
              isCompliant: nextState,
            },
          })
        );
      } else {
        throw new Error('Error en servidor');
      }
    } catch (err) {
      showToast({
        message: 'No se pudo actualizar el estado en el Diagnóstico.',
        status: 'error',
        severity: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const activeStyles = isCompliant
    ? 'border-emerald-500/70 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/30 shadow-md shadow-emerald-500/10'
    : 'border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:border-blue-500/60 hover:bg-blue-500/20';

  return (
    <button
      type="button"
      onClick={handleClick}
      title={`${tooltip} (Haz clic para alternar y registrar cumplimiento en el Diagnóstico)`}
      aria-label={`${label} - ${isCompliant ? 'Cumplido en Diagnóstico' : 'Hacer clic para marcar cumplido'}`}
      className={`group flex h-8 min-w-[32px] sm:h-10 sm:min-w-[40px] shrink-0 cursor-pointer items-center justify-center rounded-xl border px-2 sm:px-2.5 shadow-sm outline-none transition-all duration-300 sm:hover:-rotate-3 sm:hover:scale-105 active:scale-95 ${activeStyles} ${className}`}
    >
      <div className="relative flex flex-shrink-0 items-center justify-center">
        {isLoading ? (
          <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
        ) : isCompliant ? (
          <div className="relative flex items-center justify-center">
            <Scale className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600 dark:text-emerald-300 shrink-0" />
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>
        ) : (
          <Scale className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400 shrink-0" />
        )}
      </div>
      <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[280px] group-hover:opacity-100 sm:flex">
        <span className="text-sm font-bold tracking-wide flex items-center gap-1.5">
          {isCompliant ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>{label}</span>
            </>
          ) : (
            <span>{label}</span>
          )}
        </span>
      </div>
    </button>
  );
};

export default SGSSTLegalBadge;
