/**
 * BioMatrizIPEVARDashboard.tsx
 * Dashboard analítico para la Matriz IPEVAR Bio-Individual
 * Gráficas: Riesgos por Dominio · Cobertura de Controles · Jerarquía Propuesta · Top Peligros
 * + Conclusiones IA por sección
 */
import React, { useState, useMemo } from 'react';
import { BarChart2, ShieldCheck, Dna, Activity, Sparkles, Loader2, Heart } from 'lucide-react';
import { BioRiskRow } from './BioMatrizIPEVAR';

interface BioDashboardProps {
  rows: BioRiskRow[];
  workerId: string;
  token: string;
  modelName?: string;
}

// ── Barra animada reutilizable ────────────────────────────────────────────────
const Bar = ({
  label, value, max, colorClass, subLabel, labelWidth = 'w-40',
}: {
  label: string; value: number; max: number; colorClass: string;
  subLabel?: string; labelWidth?: string;
}) => {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div className="flex items-center gap-3">
      <div className={`${labelWidth} shrink-0 text-right`}>
        <span className="text-[11px] font-semibold text-text-secondary leading-tight block">
          {label.length > 22 ? label.slice(0, 22) + '…' : label}
        </span>
        {subLabel && <span className="text-[9px] text-text-tertiary">{subLabel}</span>}
      </div>
      <div className="flex-1 bg-surface-tertiary border border-border-light rounded-full h-4 overflow-hidden relative">
        <div
          className={`absolute inset-y-0 left-0 ${colorClass} rounded-full flex items-center justify-end pr-2 transition-all duration-700 ease-out`}
          style={{ width: `${pct > 0 ? Math.max(6, pct) : 0}%` }}
        >
          <span className="text-[9px] font-black text-white leading-none">{value}</span>
        </div>
      </div>
    </div>
  );
};

// ── Pill de clasificación ─────────────────────────────────────────────────────
const ClasificacionPill = ({ clas }: { clas: string }) => {
  const styles: Record<string, string> = {
    Crítico: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-300 dark:border-red-800',
    Alto: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-300 dark:border-orange-800',
    Moderado: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-300 dark:border-yellow-800',
    Bajo: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-300 dark:border-green-800',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black border ${styles[clas] || 'bg-surface-secondary text-text-secondary border-border-light'}`}>
      {clas}
    </span>
  );
};

// ── Campo de conclusión con botón IA ─────────────────────────────────────────
const ConclusionField = ({
  chartType, chartStats, rows, workerId, token, modelName,
}: {
  chartType: string; chartStats: any; rows: BioRiskRow[];
  workerId: string; token: string; modelName?: string;
}) => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/sgsst/workers/worker/${workerId}/ai-chart-conclusion-bio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ chartType, matrixRows: rows, chartStats, modelName }),
      });
      const data = await res.json();
      if (data.conclusion) setText(data.conclusion);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  return (
    <div className="mt-4 pt-3 border-t border-border-light space-y-2">
      <textarea
        className="w-full text-xs text-text-primary bg-surface-primary border border-border-light rounded-xl p-3 resize-y min-h-[64px] outline-none focus:border-teal-400 transition-colors"
        placeholder="Conclusión técnica… presiona ✨ para generarla con IA"
        value={text}
        onChange={e => setText(e.target.value)}
        rows={3}
      />
      <button
        onClick={generate}
        disabled={loading}
        className="group flex items-center justify-center p-2 h-[36px] bg-surface-secondary border border-border-medium rounded-[16px] text-teal-600 transition-all duration-300 hover:bg-teal-50 dark:hover:bg-teal-900/20 cursor-pointer disabled:opacity-50"
      >
        {loading
          ? <Loader2 className="h-4 w-4 animate-spin shrink-0" />
          : <Sparkles className="h-4 w-4 shrink-0" />}
        <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 transition-all duration-300 whitespace-nowrap group-hover:ml-2 text-xs font-bold">
          {loading ? 'Generando…' : 'Generar conclusión con IA'}
        </span>
      </button>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
export default function BioMatrizIPEVARDashboard({ rows, workerId, token, modelName }: BioDashboardProps) {

  // ── Chart A: Riesgos por Dominio Bio ──────────────────────────────────────
  const chartA = useMemo(() => {
    const map: Record<string, { count: number; criticos: number; sumEfectivo: number }> = {};
    rows.forEach(r => {
      const k = r.dominio_bio || 'Sin dominio';
      if (!map[k]) map[k] = { count: 0, criticos: 0, sumEfectivo: 0 };
      map[k].count++;
      if (r.clasificacion_bio === 'Crítico' || r.clasificacion_bio === 'Alto') map[k].criticos++;
      map[k].sumEfectivo += r.indice_bio_riesgo_efectivo || 0;
    });
    return Object.entries(map)
      .map(([dominio, d]) => ({
        dominio,
        count: d.count,
        criticos: d.criticos,
        avgEfectivo: Math.round((d.sumEfectivo / d.count) * 10) / 10,
      }))
      .sort((a, b) => b.avgEfectivo - a.avgEfectivo);
  }, [rows]);

  // ── Chart B: Distribución por Clasificación ────────────────────────────────
  const chartB = useMemo(() => {
    const counts: Record<string, number> = { Crítico: 0, Alto: 0, Moderado: 0, Bajo: 0 };
    rows.forEach(r => { if (r.clasificacion_bio && counts[r.clasificacion_bio] !== undefined) counts[r.clasificacion_bio]++; });
    return Object.entries(counts).map(([clas, count]) => ({ clas, count }));
  }, [rows]);

  // ── Chart C: Cobertura de Controles Existentes ────────────────────────────
  const chartC = useMemo(() => {
    const empty = (v?: string) => !v || ['ninguno', 'ninguna', 'none', 'no aplica', ''].includes((v || '').toLowerCase().trim());
    let fuente = 0, medio = 0, individuo = 0, sinControl = 0;
    rows.forEach(r => {
      const hasFuente = !empty(r.controles_fuente);
      const hasMedio = !empty(r.controles_medio);
      const hasIndividuo = !empty(r.controles_individuo);
      if (hasFuente) fuente++;
      if (hasMedio) medio++;
      if (hasIndividuo) individuo++;
      if (!hasFuente && !hasMedio && !hasIndividuo) sinControl++;
    });
    const total = rows.length || 1;
    return [
      { label: 'C. Fuente', value: fuente, pct: Math.round((fuente / total) * 100), color: 'bg-teal-500' },
      { label: 'C. Medio', value: medio, pct: Math.round((medio / total) * 100), color: 'bg-blue-500' },
      { label: 'C. Individuo', value: individuo, pct: Math.round((individuo / total) * 100), color: 'bg-purple-500' },
      { label: 'Sin control existente', value: sinControl, pct: Math.round((sinControl / total) * 100), color: 'bg-red-400' },
    ];
  }, [rows]);

  // ── Chart D: Jerarquía de Controles Propuestos ────────────────────────────
  const chartD = useMemo(() => {
    const empty = (v?: string) => !v || ['ninguno', 'ninguna', 'none', 'no aplica', ''].includes((v || '').toLowerCase().trim());
    let elim = 0, sust = 0, ing = 0, adm = 0, epp = 0;
    rows.forEach(r => {
      if (!empty(r.medida_eliminacion)) elim++;
      if (!empty(r.medida_sustitucion)) sust++;
      if (!empty(r.medida_ingenieria)) ing++;
      if (!empty(r.medida_administrativa)) adm++;
      if (!empty(r.medida_eppu)) epp++;
    });
    const total = rows.length || 1;
    return [
      { label: '1. Eliminación', value: elim, pct: Math.round((elim / total) * 100), color: 'bg-red-500' },
      { label: '2. Sustitución', value: sust, pct: Math.round((sust / total) * 100), color: 'bg-orange-500' },
      { label: '3. Ingeniería', value: ing, pct: Math.round((ing / total) * 100), color: 'bg-amber-500' },
      { label: '4. Administrativo', value: adm, pct: Math.round((adm / total) * 100), color: 'bg-blue-500' },
      { label: '5. EPP/Colectivos', value: epp, pct: Math.round((epp / total) * 100), color: 'bg-purple-500' },
    ];
  }, [rows]);

  if (rows.length === 0) return null;

  const maxChartA = Math.max(...chartA.map(d => d.avgEfectivo), 1);
  const maxChartB = Math.max(...chartB.map(d => d.count), 1);

  // Alerta de jerarquía invertida (más EPP que eliminación)
  const jerarquiaInvertida = chartD[4]?.value > chartD[0]?.value;

  return (
    <div className="mt-6 space-y-5">
      {/* Title */}
      <div className="flex items-center gap-2 px-1">
        <BarChart2 className="h-5 w-5 text-teal-500" />
        <h3 className="text-sm font-bold text-text-primary uppercase tracking-wide">
          Analítica Bio-IPEVAR — Resumen Ejecutivo
        </h3>
        <span className="text-xs text-text-secondary">({rows.length} riesgo{rows.length !== 1 ? 's' : ''})</span>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

        {/* ── Gráfico A: Índice Efectivo por Dominio ── */}
        <div className="p-5 bg-surface-secondary rounded-2xl border border-border-medium shadow-sm">
          <h4 className="text-xs font-bold text-text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
            <Dna className="h-4 w-4 text-teal-500" />
            Índice Bio-Efectivo Promedio por Dominio
          </h4>
          <div className="space-y-3">
            {chartA.map(d => {
              const colorClass = d.avgEfectivo >= 20 ? 'bg-red-500'
                : d.avgEfectivo >= 12 ? 'bg-orange-500'
                : d.avgEfectivo >= 6 ? 'bg-amber-500'
                : 'bg-green-500';
              return (
                <Bar
                  key={d.dominio}
                  label={d.dominio}
                  value={d.avgEfectivo}
                  max={maxChartA}
                  colorClass={colorClass}
                  subLabel={`${d.count} riesgo${d.count !== 1 ? 's' : ''} · ${d.criticos} crítico/alto`}
                  labelWidth="w-44"
                />
              );
            })}
          </div>
          <ConclusionField chartType="dominio_bio" chartStats={chartA} rows={rows} workerId={workerId} token={token} modelName={modelName} />
        </div>

        {/* ── Gráfico B: Distribución por Clasificación ── */}
        <div className="p-5 bg-surface-secondary rounded-2xl border border-border-medium shadow-sm">
          <h4 className="text-xs font-bold text-text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
            <Activity className="h-4 w-4 text-orange-500" />
            Distribución por Clasificación Bio-Riesgo
          </h4>

          {/* Gráfico de donut visual simplificado */}
          <div className="flex flex-col gap-3">
            {chartB.map(d => (
              <div key={d.clas} className="flex items-center justify-between gap-3">
                <ClasificacionPill clas={d.clas} />
                <div className="flex-1 bg-surface-tertiary border border-border-light rounded-full h-4 overflow-hidden relative">
                  <div
                    className={`absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out flex items-center justify-end pr-2 ${
                      d.clas === 'Crítico' ? 'bg-red-500' :
                      d.clas === 'Alto' ? 'bg-orange-500' :
                      d.clas === 'Moderado' ? 'bg-amber-400' : 'bg-green-500'
                    }`}
                    style={{ width: `${maxChartB > 0 ? Math.max(d.count > 0 ? 6 : 0, (d.count / maxChartB) * 100) : 0}%` }}
                  >
                    {d.count > 0 && <span className="text-[9px] font-black text-white leading-none">{d.count}</span>}
                  </div>
                </div>
                <span className="text-xs font-bold text-text-secondary w-12 text-right shrink-0">
                  {rows.length > 0 ? Math.round((d.count / rows.length) * 100) : 0}%
                </span>
              </div>
            ))}
          </div>

          {/* Alerta crítica */}
          {chartB[0]?.count > 0 && (
            <div className="mt-3 p-3 rounded-xl bg-red-50 dark:bg-red-900/15 border border-red-200 dark:border-red-900/40 text-xs text-red-700 dark:text-red-400">
              ⚠️ {chartB[0].count} riesgo{chartB[0].count !== 1 ? 's' : ''} CRÍTICO{chartB[0].count !== 1 ? 'S' : ''} identificado{chartB[0].count !== 1 ? 's' : ''} — requieren intervención inmediata.
            </div>
          )}

          <ConclusionField chartType="clasificacion_bio" chartStats={chartB} rows={rows} workerId={workerId} token={token} modelName={modelName} />
        </div>

        {/* ── Gráfico C: Cobertura de Controles Existentes ── */}
        <div className="p-5 bg-surface-secondary rounded-2xl border border-border-medium shadow-sm">
          <h4 className="text-xs font-bold text-text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-blue-500" />
            Cobertura de Controles Existentes
          </h4>
          <div className="space-y-3">
            {chartC.map(d => (
              <div key={d.label}>
                <Bar
                  label={d.label}
                  value={d.value}
                  max={rows.length}
                  colorClass={d.color}
                  subLabel={`${d.pct}% de los riesgos`}
                />
              </div>
            ))}
          </div>
          <div className="mt-3 p-3 rounded-xl bg-surface-primary border border-border-light text-xs text-text-secondary">
            {chartC[0]?.value >= chartC[2]?.value
              ? '✅ Los controles priorizan la fuente, alineado con la jerarquía GTC-45.'
              : '⚠️ Más controles en el individuo que en la fuente. Revisar estrategia de prevención.'}
          </div>
          <ConclusionField chartType="controles_existentes" chartStats={chartC} rows={rows} workerId={workerId} token={token} modelName={modelName} />
        </div>

        {/* ── Gráfico D: Jerarquía de Controles Propuestos ── */}
        <div className="p-5 bg-surface-secondary rounded-2xl border border-border-medium shadow-sm">
          <h4 className="text-xs font-bold text-text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
            <Heart className="h-4 w-4 text-red-500" />
            Jerarquía de Controles Propuestos (Dec. 1072)
          </h4>
          <div className="space-y-2">
            {chartD.map(d => (
              <div key={d.label} className="flex items-center gap-3">
                <span className="w-36 text-[11px] font-semibold text-text-secondary text-right shrink-0">{d.label}</span>
                <div className="flex-1 bg-surface-tertiary border border-border-light rounded-full h-4 overflow-hidden relative">
                  <div
                    className={`absolute inset-y-0 left-0 ${d.color} rounded-full flex items-center justify-end pr-2 transition-all duration-700 ease-out`}
                    style={{ width: `${rows.length > 0 ? Math.max(d.value > 0 ? 6 : 0, (d.value / rows.length) * 100) : 0}%` }}
                  >
                    {d.value > 0 && <span className="text-[9px] font-black text-white leading-none">{d.value}</span>}
                  </div>
                </div>
                <span className="text-[10px] font-mono text-text-secondary w-10 text-right shrink-0">{d.pct}%</span>
              </div>
            ))}
          </div>

          {jerarquiaInvertida && (
            <div className="mt-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-700 dark:text-amber-400">
              ⚠️ Jerarquía invertida: se propone más EPP que eliminación. Revisar las medidas de control propuestas.
            </div>
          )}
          {!jerarquiaInvertida && chartD[0]?.value > 0 && (
            <div className="mt-3 p-3 rounded-xl bg-green-50 dark:bg-green-900/15 border border-green-200 dark:border-green-900/40 text-xs text-green-700 dark:text-green-400">
              ✅ La jerarquía de controles prioriza la eliminación del riesgo en la fuente — correctamente alineada con GTC-45.
            </div>
          )}

          <ConclusionField chartType="jerarquia_controles_propuestos" chartStats={chartD} rows={rows} workerId={workerId} token={token} modelName={modelName} />
        </div>

      </div>
    </div>
  );
}
