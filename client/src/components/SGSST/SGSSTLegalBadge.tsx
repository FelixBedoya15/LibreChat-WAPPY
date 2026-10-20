import React, { useState, useEffect, useCallback } from 'react';
import { Scale, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuthContext } from '~/hooks';
import { useToastContext, TooltipAnchor } from '@librechat/client';

export const ISO_45001_MAPPING: Record<string, { isoClause: string; isoTitle: string; resCode: string }> = {
  // Hito 1: Gobernanza y Cimiento Legal
  '1.1.1': { isoClause: 'Num. 5.3', isoTitle: 'Roles, responsabilidades y autoridades en la organización', resCode: 'Est. 1.1.1' },
  '1.1.2': { isoClause: 'Num. 5.3', isoTitle: 'Responsabilidades y rendición de cuentas', resCode: 'Est. 1.1.2' },
  '1.1.4': { isoClause: 'Num. 5.1', isoTitle: 'Liderazgo, compromiso y aseguramiento legal', resCode: 'Est. 1.1.4' },
  '1.1.5': { isoClause: 'Num. 6.1.1', isoTitle: 'Identificación y gestión de actividades de alto riesgo', resCode: 'Est. 1.1.5' },
  '2.1.1': { isoClause: 'Num. 5.2', isoTitle: 'Política de la Seguridad y Salud en el Trabajo', resCode: 'Est. 2.1.1' },
  '2.2.1': { isoClause: 'Num. 6.2', isoTitle: 'Objetivos de la SST y planificación para lograrlos', resCode: 'Est. 2.2.1' },
  '2.3.1': { isoClause: 'Num. 9.1.2', isoTitle: 'Evaluación inicial del cumplimiento', resCode: 'Est. 2.3.1' },
  '2.4.1': { isoClause: 'Num. 6.1.4', isoTitle: 'Planificación de acciones y plan de trabajo anual', resCode: 'Est. 2.4.1' },
  '2.5.1': { isoClause: 'Num. 7.5.3', isoTitle: 'Control y retención de la información documentada', resCode: 'Est. 2.5.1' },
  '2.6.1': { isoClause: 'Num. 5.3', isoTitle: 'Rendición de cuentas anual sobre el desempeño', resCode: 'Est. 2.6.1' },
  '2.7.1': { isoClause: 'Num. 6.1.3', isoTitle: 'Determinación de requisitos legales y otros requisitos', resCode: 'Est. 2.7.1' },
  '2.8.1': { isoClause: 'Num. 7.4', isoTitle: 'Mecanismos de comunicación interna y externa', resCode: 'Est. 2.8.1' },
  '2.10.1': { isoClause: 'Num. 8.1.4', isoTitle: 'Compras y adquisiciones de bienes y servicios', resCode: 'Est. 2.10.1' },
  '2.11.1': { isoClause: 'Num. 8.1.4.2', isoTitle: 'Coordinación y control de contratistas', resCode: 'Est. 2.11.1' },
  '2.12.1': { isoClause: 'Num. 8.1.3', isoTitle: 'Gestión del cambio operacional y técnico', resCode: 'Est. 2.12.1' },
  '4.1': { isoClause: 'Num. 4.1 / 4.2', isoTitle: 'Contexto de la organización y partes interesadas', resCode: 'Est. 2.1.1' },
  '4.2': { isoClause: 'Num. 4.2', isoTitle: 'Necesidades y expectativas de las partes interesadas', resCode: 'Est. 2.1.1' },
  'oportunidades': { isoClause: 'Num. 6.1.1 / 6.1.2.3', isoTitle: 'Riesgos del sistema de gestión y oportunidades de SST', resCode: 'Est. 2.4.1' },
  'iso_6.1.1': { isoClause: 'Num. 6.1.1 / 6.1.2.3', isoTitle: 'Riesgos del sistema de gestión y oportunidades de SST', resCode: 'Est. 2.4.1' },
  '7.4': { isoClause: 'Num. 7.4', isoTitle: 'Mecanismos y matriz de comunicación interna y externa', resCode: 'Est. 2.8.1' },
  '8.1.3': { isoClause: 'Num. 8.1.3', isoTitle: 'Gestión del cambio (MOC)', resCode: 'Est. 2.12.1' },
  '8.1.4': { isoClause: 'Num. 8.1.4.2', isoTitle: 'Compras, contratistas y contratación externa', resCode: 'Est. 2.11.1' },
  '8.1.4.1': { isoClause: 'Num. 8.1.4.1', isoTitle: 'Gestión de compras y adquisiciones en SST', resCode: 'Est. 2.10.1' },

  // Hito 2: Huella Biocéntrica
  '1.1.3': { isoClause: 'Num. 7.2', isoTitle: 'Competencia, funciones y perfiles de cargo', resCode: 'Est. 1.1.3' },
  '3.1.1': { isoClause: 'Num. 9.1.1', isoTitle: 'Seguimiento y perfil sociodemográfico', resCode: 'Est. 3.1.1' },
  '3.1.2': { isoClause: 'Num. 8.1.2', isoTitle: 'Actividades de promoción y prevención de la salud', resCode: 'Est. 3.1.2' },
  '3.1.3': { isoClause: 'Num. 7.2', isoTitle: 'Perfiles de cargo y profesiogramas', resCode: 'Est. 3.1.3' },
  '3.1.4': { isoClause: 'Num. 9.1.1', isoTitle: 'Evaluación médica y condiciones de salud', resCode: 'Est. 3.1.4' },

  // Hito 3: Comités, Brigadas y Gobernanza
  '1.1.6': { isoClause: 'Num. 5.4', isoTitle: 'Consulta y participación de los trabajadores (COPASST/Vigía/PESV)', resCode: 'Est. 1.1.6' },
  '1.1.7': { isoClause: 'Num. 7.2', isoTitle: 'Capacitación y competencia de miembros de comités', resCode: 'Est. 1.1.7' },
  '1.1.8': { isoClause: 'Num. 5.4', isoTitle: 'Consulta, participación y comité de convivencia laboral', resCode: 'Est. 1.1.8' },
  '5.1.2': { isoClause: 'Num. 8.2', isoTitle: 'Preparación y brigada de emergencias', resCode: 'Est. 5.1.2' },

  // Hito 4: Evaluación Dinámica de Riesgos
  '3.1.5': { isoClause: 'Num. 6.1.2', isoTitle: 'Evaluación de riesgos ergonómicos y biomecánicos (OWAS/EPT)', resCode: 'Est. 3.1.5' },
  '3.1.6': { isoClause: 'Num. 6.1.2', isoTitle: 'Evaluación y vigilancia de factores psicosociales', resCode: 'Est. 3.1.6' },
  '4.1.1': { isoClause: 'Num. 6.1.2', isoTitle: 'Identificación de peligros y valoración de riesgos (IPEVAR/GTC 45/PESV)', resCode: 'Est. 4.1.1' },
  '4.1.2': { isoClause: 'Num. 5.4', isoTitle: 'Participación en IPEVR y reporte de actos y condiciones', resCode: 'Est. 4.1.2' },
  '4.1.3': { isoClause: 'Num. 8.1.2', isoTitle: 'Control de sustancias químicas peligrosas y SGA', resCode: 'Est. 4.1.3' },
  '4.1.4': { isoClause: 'Num. 9.1.1', isoTitle: 'Mediciones higiénicas y ambientales en el trabajo', resCode: 'Est. 4.1.4' },

  // Hito 5: Dinámica Operativa y Terreno
  '4.2.1': { isoClause: 'Num. 8.1.2', isoTitle: 'Mantenimiento preventivo y correctivo de equipos', resCode: 'Est. 4.2.1' },
  '4.2.2': { isoClause: 'Num. 9.1.1', isoTitle: 'Inspecciones periódicas de instalaciones y seguridad', resCode: 'Est. 4.2.2' },
  '4.2.3': { isoClause: 'Num. 8.1.2', isoTitle: 'Controles operacionales en tareas de alto riesgo (Alturas/ATS)', resCode: 'Est. 4.2.3' },
  '4.2.4': { isoClause: 'Num. 8.1.2', isoTitle: 'Suministro y control de elementos de protección personal (EPP)', resCode: 'Est. 4.2.4' },
  '4.2.6': { isoClause: 'Num. 8.1.2', isoTitle: 'Entrega, inspección y reposición de EPP', resCode: 'Est. 4.2.6' },
  '5.1.1': { isoClause: 'Num. 8.2', isoTitle: 'Preparación y respuesta ante emergencias (PPRE/Vulnerabilidad/Equipos/Simulacros)', resCode: 'Est. 5.1.1' },

  // Hito 6: Cultura, Escuela e Innovación
  '1.2.1': { isoClause: 'Num. 7.2', isoTitle: 'Competencia y programa anual de capacitación', resCode: 'Est. 1.2.1' },

  // Hito 7: Auditoría, Causalidad y Mejora Continua
  '3.1.7': { isoClause: 'Num. 7.5.3', isoTitle: 'Custodia médica y confidencialidad documental', resCode: 'Est. 3.1.7' },
  '3.1.8': { isoClause: 'Num. 10.2', isoTitle: 'Rehabilitación y reubicación laboral', resCode: 'Est. 3.1.8' },
  '3.2.1': { isoClause: 'Num. 10.2', isoTitle: 'Reporte e investigación de accidentes laborales', resCode: 'Est. 3.2.1' },
  '3.2.2': { isoClause: 'Num. 10.2', isoTitle: 'Investigación técnica de incidentes y accidentes (ATEL)', resCode: 'Est. 3.2.2' },
  '3.2.3': { isoClause: 'Num. 9.1.1', isoTitle: 'Registro y seguimiento de estadísticas de accidentalidad', resCode: 'Est. 3.2.3' },
  '3.3.1': { isoClause: 'Num. 9.1.1', isoTitle: 'Medición de severidad, frecuencia y ausentismo laboral', resCode: 'Est. 3.3.1' },
  '6.1.1': { isoClause: 'Num. 9.1.1', isoTitle: 'Indicadores del sistema de gestión de la SST', resCode: 'Est. 6.1.1' },
  '6.1.2': { isoClause: 'Num. 9.2', isoTitle: 'Auditoría interna del sistema de gestión de la SST', resCode: 'Est. 6.1.2' },
  '6.1.3': { isoClause: 'Num. 9.3', isoTitle: 'Revisión por la alta dirección', resCode: 'Est. 6.1.3' },
  '6.1.4': { isoClause: 'Num. 9.1.1', isoTitle: 'Planificación preventiva y analítica predictiva', resCode: 'Est. 6.1.4' },
  '7.1.1': { isoClause: 'Num. 10.2', isoTitle: 'Acciones preventivas, correctivas y de mejora (ACPM)', resCode: 'Est. 7.1.1' },
  '7.1.2': { isoClause: 'Num. 10.3', isoTitle: 'Acciones de mejora de la revisión gerencial', resCode: 'Est. 7.1.2' },
  '7.1.3': { isoClause: 'Num. 10.2', isoTitle: 'Acciones correctivas derivadas de investigaciones ATEL', resCode: 'Est. 7.1.3' },
};

function resolveISO45001Info(
  standardCode: string,
  rawLabel: string,
  rawTooltip: string,
  isoClauseProp?: string
) {
  // Si el label ya inicia con ISO 45001, respetarlo
  if (rawLabel.trim().toUpperCase().startsWith('ISO 45001')) {
    return {
      displayLabel: rawLabel,
      displayTooltip: rawTooltip,
    };
  }

  const cleanCode = String(standardCode).replace(/^(est\.|art\.|estándar|numeral)\s*/i, '').trim();
  const mapping = ISO_45001_MAPPING[cleanCode];
  const isoClause = isoClauseProp || (mapping ? mapping.isoClause : 'Num. 9.1.2');
  const isoTitle = mapping ? mapping.isoTitle : '';

  // Formatear label con ISO 45001 DE PRIMERA
  let formattedLabel = rawLabel;
  if (rawLabel.includes('CUMPLE')) {
    const prefix = rawLabel.replace(/:\s*CUMPLE.*$/i, '').trim();
    formattedLabel = `ISO 45001 ${isoClause} · ${prefix}: CUMPLE`;
  } else {
    formattedLabel = `ISO 45001 ${isoClause} · ${rawLabel}`;
  }

  // Formatear tooltip con ISO 45001 DE PRIMERA
  let formattedTooltip = rawTooltip;
  if (!rawTooltip.toUpperCase().includes('ISO 45001')) {
    const isoPrefix = `ISO 45001:2018 ${isoClause}${isoTitle ? ` (${isoTitle})` : ''} · `;
    formattedTooltip = `${isoPrefix}${rawTooltip}`;
  }

  return {
    displayLabel: formattedLabel,
    displayTooltip: formattedTooltip,
  };
}

interface SGSSTLegalBadgeProps {
  standardCode: string;
  label: string;
  tooltip: string;
  moduleName?: string;
  className?: string;
  iconOnly?: boolean;
  isoClause?: string;
}

export const SGSSTLegalBadge: React.FC<SGSSTLegalBadgeProps> = ({
  standardCode,
  label,
  tooltip,
  moduleName,
  className = '',
  isoClause,
}) => {
  const { token } = useAuthContext();
  const { showToast } = useToastContext();
  const [isCompliant, setIsCompliant] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { displayLabel, displayTooltip } = resolveISO45001Info(standardCode, label, tooltip, isoClause);

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
            message: `¡${displayLabel} registrado y validado como CUMPLIDO en el Diagnóstico institucional!`,
            status: 'success',
            severity: 'success',
          });
        } else {
          showToast({
            message: `${displayLabel} marcado como Pendiente en el Diagnóstico.`,
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
    <TooltipAnchor
      description={`${displayTooltip} (Haz clic para alternar y registrar cumplimiento en el Diagnóstico)`}
      render={
        <button
          type="button"
          onClick={handleClick}
          aria-label={`${displayLabel} - ${isCompliant ? 'Cumplido en Diagnóstico' : 'Hacer clic para marcar cumplido'}`}
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
          <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[500px] group-hover:opacity-100 sm:flex">
            <span className="text-sm font-bold tracking-wide flex items-center gap-1.5">
              {isCompliant ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{displayLabel}</span>
                </>
              ) : (
                <span>{displayLabel}</span>
              )}
            </span>
          </div>
        </button>
      }
    />
  );
};

export default SGSSTLegalBadge;
