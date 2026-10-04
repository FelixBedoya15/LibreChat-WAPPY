/**
 * MatrizPESVDashboard.tsx
 * Dashboard analítico y pedagógico del Plan Estratégico de Seguridad Vial (PESV)
 * Cimiento Legal: Ley 1503 de 2011, Ley 2050 de 2020 y Resolución 20223040040595 de 2022 del MinTransporte
 */
import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  PieChart,
  Target,
  HelpCircle,
  TrendingUp,
  Shield,
  ShieldCheck,
  Truck,
  MapPin,
  Sparkles,
  Loader2,
  ChevronDown,
  ChevronUp,
  Calculator,
  Scale,
  Car,
  AlertTriangle,
  Flame,
  Filter,
  Layers,
  Activity
} from 'lucide-react';
import { MatrixRow } from './MatrizPESVConstants';
import cn from '~/utils/cn';

interface DashboardProps {
  matrixRows: MatrixRow[];
  conversationId: string | null;
  token: string;
  savedConclusions: Record<string, string>;
  onConclusionSaved: (chartType: string, text: string) => void;
  isMaximized?: boolean;
}

const getPESVColor = (calificacion: number) => {
  if (calificacion >= 12) return { bg: 'bg-rose-500', text: 'text-rose-500', hex: '#f43f5e', border: 'border-rose-400/40', light: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300' };
  if (calificacion >= 8) return { bg: 'bg-amber-500', text: 'text-amber-500', hex: '#f59e0b', border: 'border-amber-400/40', light: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' };
  return { bg: 'bg-emerald-500', text: 'text-emerald-500', hex: '#10b981', border: 'border-emerald-400/40', light: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' };
};

const Bar = ({ label, value, max, color, labelWidth = 'w-28 sm:w-44' }: {
  label: string; value: number; max: number; color: string; labelWidth?: string;
}) => {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <span className={`text-[11px] font-semibold text-text-secondary shrink-0 text-right truncate ${labelWidth}`}
        title={label}>{label.length > 28 ? label.slice(0, 28) + '…' : label}</span>
      <div className="flex-1 bg-surface-tertiary border border-border-light rounded-full h-4 overflow-hidden relative">
        <div className={`absolute inset-y-0 left-0 ${color} rounded-full flex items-center justify-end pr-2 transition-all duration-700 ease-out`}
          style={{ width: `${pct > 0 ? Math.max(6, pct) : 0}%` }}>
          <span className="text-[9px] font-black text-white leading-none">{value}</span>
        </div>
      </div>
    </div>
  );
};

const ConclusionField = ({ chartType, chartStats, matrixRows, conversationId, token, saved, onSaved }: {
  chartType: string; chartStats: any; matrixRows: MatrixRow[];
  conversationId: string | null; token: string;
  saved: string; onSaved: (text: string) => void;
}) => {
  const [text, setText] = useState(saved || '');
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    if (!conversationId) return;
    setLoading(true);
    try {
      const res = await fetch('/api/sgsst/pesv-workspace/ai-chart-conclusion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ conversationId, chartType, matrixRows, chartStats }),
      });
      const data = await res.json();
      if (data.conclusion) { setText(data.conclusion); onSaved(data.conclusion); }
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  const handleBlur = async () => {
    if (!conversationId || !text.trim()) return;
    await fetch('/api/sgsst/pesv-workspace/ai-chart-conclusion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ conversationId, chartType, matrixRows: [], chartStats: {}, manualText: text }),
    }).catch(() => {});
    onSaved(text);
  };

  return (
    <div className="mt-4 pt-4 border-t border-border-light space-y-2">
      <textarea
        className="w-full text-xs text-text-primary bg-surface-primary border border-border-light rounded-xl p-3 resize-y min-h-[64px] outline-none focus:border-sky-500 transition-colors"
        placeholder="Conclusión técnica vial PESV… presiona ✨ para generarla con IA"
        value={text}
        onChange={e => setText(e.target.value)}
        onBlur={handleBlur}
        rows={3}
      />
      <button onClick={generate} disabled={loading || !conversationId}
        className="group flex items-center justify-center p-2 h-[34px] bg-surface-secondary border border-border-medium rounded-xl text-sky-600 transition-all duration-300 hover:bg-sky-50 dark:hover:bg-sky-900/20 cursor-pointer disabled:opacity-50">
        {loading ? <Loader2 className="h-4 w-4 animate-spin shrink-0" />
          : <Sparkles className="h-4 w-4 shrink-0" />}
        <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 transition-all duration-300 whitespace-nowrap group-hover:ml-2 text-xs font-bold">
          {loading ? 'Generando…' : 'Generar Conclusión Vial'}
        </span>
      </button>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
export default function MatrizPESVDashboard({
  matrixRows,
  conversationId,
  token,
  savedConclusions,
  onConclusionSaved,
  isMaximized
}: DashboardProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'peligros' | 'metodologia'>('dashboard');
  const [selectedHeatmapCell, setSelectedHeatmapCell] = useState<string | null>(null);
  const [selectedActorFilter, setSelectedActorFilter] = useState<string | null>(null);
  const [expandedRiskId, setExpandedRiskId] = useState<string | null>(null);

  const totalPeligros = matrixRows.length;

  // ── 1. Métricas Principales ──
  const stats = useMemo(() => {
    let criticos = 0;
    let moderados = 0;
    let aceptables = 0;

    const actorMap: Record<string, number> = {};
    const factorMap: Record<string, number> = {};

    matrixRows.forEach(r => {
      const score = Number(r.calificacion) || 0;
      if (score >= 12) criticos++;
      else if (score >= 8) moderados++;
      else aceptables++;

      const actor = r.rol_via?.trim() || 'Conductor';
      actorMap[actor] = (actorMap[actor] || 0) + 1;

      const factor = r.factor_riesgo?.trim() || 'Factor Humano';
      factorMap[factor] = (factorMap[factor] || 0) + 1;
    });

    const rankingFactores = Object.entries(factorMap)
      .map(([factor, count]) => ({
        factor,
        count,
        pct: totalPeligros > 0 ? Math.round((count / totalPeligros) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count);

    const rankingActores = Object.entries(actorMap)
      .map(([actor, count]) => ({
        actor,
        count,
        pct: totalPeligros > 0 ? Math.round((count / totalPeligros) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count);

    const factorPredominante = rankingFactores[0] || { factor: 'Sin clasificar', count: 0, pct: 0 };
    const pctCritico = totalPeligros > 0 ? Math.round((criticos / totalPeligros) * 100) : 0;

    return {
      criticos,
      moderados,
      aceptables,
      rankingFactores,
      rankingActores,
      factorPredominante,
      pctCritico
    };
  }, [matrixRows, totalPeligros]);

  const getFactorColor = (factor: string) => {
    const f = factor.toLowerCase();
    if (f.includes('humano') || f.includes('comportam') || f.includes('persona')) return { hex: '#0284c7', bg: 'bg-sky-500', text: 'text-sky-600', light: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300' };
    if (f.includes('vehic') || f.includes('vehíc') || f.includes('mecán')) return { hex: '#f59e0b', bg: 'bg-amber-500', text: 'text-amber-600', light: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' };
    if (f.includes('infra') || f.includes('vía') || f.includes('via') || f.includes('entorn')) return { hex: '#10b981', bg: 'bg-emerald-500', text: 'text-emerald-600', light: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' };
    if (f.includes('velocidad') || f.includes('clima') || f.includes('operacion')) return { hex: '#f43f5e', bg: 'bg-rose-500', text: 'text-rose-600', light: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300' };
    return { hex: '#8b5cf6', bg: 'bg-purple-500', text: 'text-purple-600', light: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300' };
  };

  // ── 2. Matriz Térmica PESV (Severidad vs Frecuencia/Probabilidad) ──
  const heatmapData = useMemo(() => {
    // Filas Severidad: Fatal/Catastrófica (5), Grave/Incapacitante (3), Leve (1)
    const sevRows = [
      { sev: 5, label: 'Catastrófica (5)' },
      { sev: 3, label: 'Grave (3)' },
      { sev: 1, label: 'Leve (1)' }
    ];
    // Columnas Probabilidad/Frecuencia: Alta (3), Media (2), Baja (1)
    const probCols = [
      { prob: 3, label: 'Alta / Diaria (3)' },
      { prob: 2, label: 'Media / Semanal (2)' },
      { prob: 1, label: 'Baja / Ocasional (1)' }
    ];

    return sevRows.map((r, rIdx) => {
      return probCols.map((c, cIdx) => {
        const cellKey = `${rIdx}-${cIdx}`;
        // Calificación teórica en PESV = Severidad * Frecuencia
        const theoreticalScore = r.sev * c.prob; // 15, 10, 5, 9, 6, 3, 3, 2, 1
        let level = 'Aceptable';
        if (theoreticalScore >= 10) level = 'Crítico';
        else if (theoreticalScore >= 6) level = 'Moderado';

        const matchingRows = matrixRows.filter(row => {
          const score = Number(row.calificacion) || 0;
          if (level === 'Crítico') return score >= 12;
          if (level === 'Moderado') return score >= 8 && score < 12;
          return score < 8;
        });

        return {
          rIdx,
          cIdx,
          cellKey,
          level,
          theoreticalScore,
          sevLabel: r.label,
          probLabel: c.label,
          count: matchingRows.length,
          rows: matchingRows
        };
      });
    });
  }, [matrixRows]);

  // ── 3. Charts Clásicos Reutilizables ──
  const chartA = useMemo(() => {
    const map: Record<string, { count: number; totalScore: number; max: number }> = {};
    matrixRows.forEach(r => {
      const k = r.rol_via?.trim() || 'Sin clasificar';
      if (!map[k]) map[k] = { count: 0, totalScore: 0, max: 0 };
      map[k].count++;
      map[k].totalScore += Number(r.calificacion) || 0;
      map[k].max = Math.max(map[k].max, Number(r.calificacion) || 0);
    });
    return Object.entries(map)
      .map(([actor, d]) => ({ actor, count: d.count, avg: Math.round((d.totalScore / d.count) * 10) / 10, max: d.max }))
      .sort((a, b) => b.avg - a.avg);
  }, [matrixRows]);

  const chartB = useMemo(() => {
    const map: Record<string, { count: number; totalScore: number; max: number }> = {};
    matrixRows.forEach(r => {
      const k = r.factor_riesgo?.trim() || 'Otros';
      if (!map[k]) map[k] = { count: 0, totalScore: 0, max: 0 };
      map[k].count++;
      map[k].totalScore += Number(r.calificacion) || 0;
      map[k].max = Math.max(map[k].max, Number(r.calificacion) || 0);
    });
    return Object.entries(map)
      .map(([factor, d]) => ({ factor, count: d.count, avg: Math.round((d.totalScore / d.count) * 10) / 10, max: d.max }))
      .sort((a, b) => b.avg - a.avg);
  }, [matrixRows]);

  const chartC = useMemo(() => {
    let persona = 0, medio = 0, vehiculo = 0, infra = 0;
    matrixRows.forEach(r => {
      const t = String(r.controles_existentes_tipo || '').toUpperCase();
      if (t.includes('INDIVIDUO') || t.includes('PERSONA')) persona++;
      if (t.includes('MEDIO')) medio++;
      if (t.includes('VEHICULO') || t.includes('VEHÍCULO')) vehiculo++;
      if (t.includes('INFRAESTRUCTURA') || t.includes('VIA') || t.includes('VÍA')) infra++;
    });
    const total = matrixRows.length || 1;
    return [
      { label: 'Control en el Individuo (Comportamiento)', value: persona, pct: Math.round((persona / total) * 100) },
      { label: 'Control en el Vehículo (Inspección/Mantenimiento)', value: vehiculo, pct: Math.round((vehiculo / total) * 100) },
      { label: 'Control en la Vía / Infraestructura', value: infra, pct: Math.round((infra / total) * 100) },
      { label: 'Control Operacional (Velocidad/Rutas)', value: medio, pct: Math.round((medio / total) * 100) },
    ];
  }, [matrixRows]);

  const chartD = useMemo(() => {
    const map: Record<string, { count: number; totalScore: number }> = {};
    matrixRows.forEach(r => {
      const k = r.tipo_desplazamiento || 'Misional';
      if (!map[k]) map[k] = { count: 0, totalScore: 0 };
      map[k].count++;
      map[k].totalScore += Number(r.calificacion) || 0;
    });
    return Object.entries(map).map(([type, d]) => ({
      type,
      count: d.count,
      avg: Math.round((d.totalScore / d.count) * 10) / 10
    }));
  }, [matrixRows]);

  const filteredRows = useMemo(() => {
    let rows = [...matrixRows];
    if (selectedHeatmapCell) {
      const [rIdxStr, cIdxStr] = selectedHeatmapCell.split('-');
      const rIdx = parseInt(rIdxStr, 10);
      const cIdx = parseInt(cIdxStr, 10);
      const cell = heatmapData[rIdx]?.[cIdx];
      if (cell) {
        rows = cell.rows;
      }
    }
    if (selectedActorFilter) {
      rows = rows.filter(r => (r.rol_via?.trim() || '') === selectedActorFilter);
    }
    return rows.sort((a, b) => (Number(b.calificacion) || 0) - (Number(a.calificacion) || 0));
  }, [matrixRows, selectedHeatmapCell, selectedActorFilter, heatmapData]);

  if (matrixRows.length === 0) return null;

  const maxChartA = 15;
  const maxChartB = 15;
  const maxChartD = 15;

  return (
    <div className="w-full overflow-hidden rounded-3xl border border-sky-500/30 bg-surface-secondary shadow-md transition-all duration-300 mt-6 mb-6">
      
      {/* ── HEADER PRINCIPAL CON BOTONERA CÁPSULA WAPPY ── */}
      <div className="flex flex-wrap items-center justify-between px-5 py-4 border-b border-border-light gap-3 bg-surface-tertiary/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-sky-500/20 shrink-0">
            <Truck size={20} className="stroke-[2.2]" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-zinc-100 leading-tight flex items-center gap-2">
              Matriz PESV — Evaluación de Riesgos Viales
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-900/60 text-sky-800 dark:text-sky-300 border border-sky-300/40">
                Res. 20223040040595 de 2022
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400 font-normal">
              Paso 8: Caracterización y valoración de factores viales (Humano, Vehículo, Vía y Entorno)
            </p>
          </div>
        </div>

        {/* Botonera de 3 Vistas */}
        <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-surface-primary border border-border-medium text-[11px] font-bold shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer",
              activeTab === 'dashboard'
                ? "bg-sky-600 text-white shadow-xs font-black"
                : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100"
            )}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Gráficas & Métricas</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('peligros')}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer",
              activeTab === 'peligros'
                ? "bg-sky-600 text-white shadow-xs font-black"
                : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100"
            )}
          >
            <Target className="w-3.5 h-3.5" />
            <span>Peligros Priorizados ({matrixRows.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('metodologia')}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer",
              activeTab === 'metodologia'
                ? "bg-sky-600 text-white shadow-xs font-black"
                : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100"
            )}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>¿Cómo se evalúa el riesgo vial?</span>
          </button>
        </div>
      </div>

      {/* ── CUERPO DEL DASHBOARD ── */}
      <div className="p-5 sm:p-6 bg-surface-primary/30 space-y-6 text-xs">
        
        {/* 1. Tarjetas Superiores de Métricas Clave */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-900/40 shadow-xs flex flex-col justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500 flex items-center gap-1.5">
              <Car className="w-3.5 h-3.5 text-sky-600" /> Peligros Viales
            </span>
            <div className="mt-2">
              <span className="text-2xl font-black text-slate-900 dark:text-zinc-100">
                {totalPeligros}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-zinc-400 ml-1.5 font-medium">
                escenarios viales
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl border border-rose-200/80 dark:border-rose-800/60 bg-rose-50/50 dark:bg-rose-950/20 shadow-xs flex flex-col justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-rose-600" /> Riesgo Vial Crítico (≥12)
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-black text-rose-900 dark:text-rose-200">
                {stats.criticos}
              </span>
              <span className="text-[11px] text-rose-700 dark:text-rose-300 font-bold">
                {stats.pctCritico}% de alta severidad
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl border border-sky-200/80 dark:border-sky-800/60 bg-sky-50/50 dark:bg-sky-950/20 shadow-xs flex flex-col justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-sky-700 dark:text-sky-400 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-sky-600" /> Factor Dominante
            </span>
            <div className="mt-2">
              <span className="text-lg font-black text-sky-900 dark:text-sky-200 block truncate" title={stats.factorPredominante.factor}>
                {stats.factorPredominante.factor}
              </span>
              <span className="text-[11px] font-bold text-sky-700 dark:text-sky-300">
                {stats.factorPredominante.pct}% de incidencia
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl border border-emerald-200/80 dark:border-emerald-800/60 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-xs flex flex-col justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Enfoque Seguro
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-black text-emerald-900 dark:text-emerald-200">
                {chartC[1]?.value || 0}
              </span>
              <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium">
                {chartC[1]?.pct || 0}% en vehículos
              </span>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            TAB 1: GRÁFICAS & MÉTRICAS
        ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            
            {/* Fila 1: Donut SVG Interactivo de Factores + Matriz Térmica Vial */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              
              {/* Donut SVG de Factores de Riesgo (5 cols) */}
              <div className="lg:col-span-5 p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-xs text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                      <PieChart className="w-4 h-4 text-sky-600" />
                      Distribución por Factores PESV
                    </h3>
                    <span className="text-[10px] font-bold text-slate-400">Total: {totalPeligros}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">
                    Factores viales según la Resolución 20223040040595 de 2022.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-5 my-4">
                  <div className="relative w-36 h-36 shrink-0">
                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90 transform">
                      {(() => {
                        let accumulatedPct = 0;
                        return stats.rankingFactores.map((item, idx) => {
                          const strokeDasharray = `${item.pct} ${100 - item.pct}`;
                          const strokeDashoffset = -accumulatedPct;
                          accumulatedPct += item.pct;
                          const colorObj = getFactorColor(item.factor);
                          return (
                            <circle
                              key={idx}
                              cx="50"
                              cy="50"
                              r="38"
                              fill="transparent"
                              stroke={colorObj.hex}
                              strokeWidth="18"
                              strokeDasharray={strokeDasharray}
                              strokeDashoffset={strokeDashoffset}
                              className="transition-all duration-500 hover:opacity-80 cursor-pointer"
                            />
                          );
                        });
                      })()}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-xl font-black text-slate-900 dark:text-zinc-100 leading-none">
                        {totalPeligros}
                      </span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                        Escenarios
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5 w-full max-w-[200px]">
                    {stats.rankingFactores.slice(0, 5).map((item, idx) => {
                      const colorObj = getFactorColor(item.factor);
                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-[11px] p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${colorObj.bg}`} />
                            <span className="font-semibold text-slate-700 dark:text-zinc-300 truncate" title={item.factor}>
                              {item.factor}
                            </span>
                          </div>
                          <span className="font-bold text-slate-900 dark:text-zinc-100 ml-2">
                            {item.pct}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="p-2.5 rounded-2xl bg-sky-50/60 dark:bg-sky-950/20 border border-sky-200/60 text-[11px] text-sky-800 dark:text-sky-300">
                  🚦 Los 4 pilares: Factor Humano, Vehículos, Vías e Infraestructura y Gestión de Velocidad.
                </div>
              </div>

              {/* Matriz Térmica Vial PESV (7 cols) */}
              <div className="lg:col-span-7 p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-xs text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                      <Flame className="w-4 h-4 text-rose-600" />
                      Matriz de Riesgo Vial (Severidad vs Frecuencia de Desplazamiento)
                    </h3>
                    <span className="text-[10px] font-bold text-sky-600 px-2 py-0.5 rounded-md bg-sky-50 dark:bg-sky-950/50">
                      Mapa Vial
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">
                    Cruce de impacto lesional y exposición en la vía según la metodología oficial.
                  </p>
                </div>

                <div className="overflow-x-auto my-3">
                  <div className="min-w-[420px] text-[10px]">
                    <div className="grid grid-cols-4 gap-1 mb-1 font-bold text-slate-400 text-center">
                      <div className="text-left text-[9px] uppercase">Severidad \ Probabilidad</div>
                      <div>Alta / Diaria (3)</div>
                      <div>Media / Semanal (2)</div>
                      <div>Baja / Ocasional (1)</div>
                    </div>

                    {heatmapData.map((row, rIdx) => (
                      <div key={rIdx} className="grid grid-cols-4 gap-1 mb-1 items-center">
                        <div className="font-bold text-slate-600 dark:text-zinc-400 text-[10px] truncate" title={row[0].sevLabel}>
                          {row[0].sevLabel}
                        </div>
                        {row.map((cell) => {
                          const isSelected = selectedHeatmapCell === cell.cellKey;
                          let cellBg = 'bg-slate-100 dark:bg-zinc-800 text-slate-600';
                          if (cell.level === 'Crítico') cellBg = 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-400/40 hover:bg-rose-500/30';
                          else if (cell.level === 'Moderado') cellBg = 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-400/40 hover:bg-amber-500/30';
                          else cellBg = 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-400/40 hover:bg-emerald-500/30';

                          return (
                            <button
                              key={cell.cellKey}
                              type="button"
                              onClick={() => {
                                setSelectedHeatmapCell(isSelected ? null : cell.cellKey);
                                setActiveTab('peligros');
                              }}
                              className={cn(
                                "h-11 rounded-xl border flex flex-col items-center justify-center transition-all p-1 cursor-pointer",
                                cellBg,
                                isSelected ? "ring-2 ring-sky-500 font-black scale-95 shadow-sm" : "border-slate-200/40 dark:border-zinc-700/40"
                              )}
                            >
                              <span className="font-extrabold text-[9px] uppercase">
                                {cell.level}
                              </span>
                              <span className="text-[11px] font-black">
                                {cell.count > 0 ? `${cell.count} escenarios` : '—'}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 pt-2 border-t border-slate-100 dark:border-zinc-800">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Riesgo Crítico (≥12 pts)</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Riesgo Moderado (8-11 pts)</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Riesgo Aceptable (3-7 pts)</span>
                </div>
              </div>

            </div>

            {/* Fila 2: Gráficos de Actores, Controles y Desplazamientos */}
            <div className={`grid gap-5 ${isMaximized ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1'}`}>
              
              {/* Chart A: Actor Vial */}
              <div className="p-5 bg-surface-secondary rounded-3xl border border-border-medium shadow-sm">
                <h4 className="text-xs font-bold text-text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-sky-500 inline-block" />
                  Calificación Promedio por Actor Vial (Escala 3-15)
                </h4>
                <div className="space-y-3">
                  {chartA.map(d => {
                    const col = getPESVColor(d.avg);
                    return <Bar key={d.actor} label={`${d.actor} (${d.count})`} value={d.avg} max={maxChartA} color={col.bg} />;
                  })}
                </div>
                <ConclusionField chartType="actor_vial" chartStats={chartA} matrixRows={matrixRows}
                  conversationId={conversationId} token={token}
                  saved={savedConclusions.actor_vial || ''} onSaved={t => onConclusionSaved('actor_vial', t)} />
              </div>

              {/* Chart B: Factores de Riesgo Vial */}
              <div className="p-5 bg-surface-secondary rounded-3xl border border-border-medium shadow-sm">
                <h4 className="text-xs font-bold text-text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Truck className="h-4 w-4 text-sky-600" />
                  Calificación por Factor de Riesgo Vial
                </h4>
                <div className="space-y-3">
                  {chartB.map(d => {
                    const col = getPESVColor(d.avg);
                    return <Bar key={d.factor} label={`${d.factor} (${d.count})`} value={d.avg} max={maxChartB} color={col.bg} />;
                  })}
                </div>
                <ConclusionField chartType="factor_riesgo" chartStats={chartB} matrixRows={matrixRows}
                  conversationId={conversationId} token={token}
                  saved={savedConclusions.factor_riesgo || ''} onSaved={t => onConclusionSaved('factor_riesgo', t)} />
              </div>

              {/* Chart C: Cobertura de Controles */}
              <div className="p-5 bg-surface-secondary rounded-3xl border border-border-medium shadow-sm">
                <h4 className="text-xs font-bold text-text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  Cobertura del Enfoque Sistema Seguro
                </h4>
                <div className="space-y-3">
                  {chartC.map(d => (
                    <div key={d.label}>
                      <Bar label={`${d.label}`} value={d.value} max={matrixRows.length} color="bg-emerald-500" />
                      <p className="text-[10px] text-text-secondary text-right mt-0.5">{d.pct}% de los peligros viales cuentan con controles</p>
                    </div>
                  ))}
                </div>
                <ConclusionField chartType="controles" chartStats={chartC} matrixRows={matrixRows}
                  conversationId={conversationId} token={token}
                  saved={savedConclusions.controles || ''} onSaved={t => onConclusionSaved('controles', t)} />
              </div>

              {/* Chart D: Desplazamientos Misionales vs In-Itinere */}
              <div className="p-5 bg-surface-secondary rounded-3xl border border-border-medium shadow-sm">
                <h4 className="text-xs font-bold text-text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-orange-500" />
                  Nivel de Calificación: Desplazamiento Misional vs In-Itinere
                </h4>
                <div className="space-y-3">
                  {chartD.map(d => {
                    const col = getPESVColor(d.avg);
                    return <Bar key={d.type} label={`${d.type} (${d.count})`} value={d.avg} max={maxChartD} color={col.bg} />;
                  })}
                </div>
                <ConclusionField chartType="tipo_desplazamiento" chartStats={chartD} matrixRows={matrixRows}
                  conversationId={conversationId} token={token}
                  saved={savedConclusions.tipo_desplazamiento || ''} onSaved={t => onConclusionSaved('tipo_desplazamiento', t)} />
              </div>

            </div>

          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            TAB 2: PELIGROS VIALES PRIORIZADOS
        ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'peligros' && (
          <div className="space-y-4">
            
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-2xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-xs text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <Filter size={13} className="text-sky-600" />
                  Mostrando {filteredRows.length} de {matrixRows.length} peligros viales
                </span>
                {selectedHeatmapCell && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 dark:bg-sky-900/60 dark:text-sky-300">
                    Celda térmica: {selectedHeatmapCell}
                    <button type="button" onClick={() => setSelectedHeatmapCell(null)} className="hover:text-red-600 cursor-pointer ml-1">✕</button>
                  </span>
                )}
              </div>

              {selectedHeatmapCell && (
                <button
                  type="button"
                  onClick={() => setSelectedHeatmapCell(null)}
                  className="text-[11px] font-bold text-sky-600 hover:text-sky-700 cursor-pointer"
                >
                  Restablecer filtros
                </button>
              )}
            </div>

            <div className="space-y-3">
              {filteredRows.map((r, idx) => {
                const score = Number(r.calificacion) || 0;
                const col = getPESVColor(score);
                const isExpanded = expandedRiskId === r.id;

                return (
                  <div
                    key={r.id || idx}
                    className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-2xs space-y-3 transition-all hover:border-sky-500/40"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400">
                          PRIORIDAD #{idx + 1}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border border-sky-200/60">
                          Actor: {r.rol_via || 'Conductor'}
                        </span>
                        <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                          {r.tipo_desplazamiento || 'Misional'} • {r.factor_riesgo || 'Vial'}
                        </span>
                      </div>

                      <span className={`text-[11px] font-black px-2.5 py-1 rounded-xl ${col.bg} text-white shadow-2xs`}>
                        {score >= 12 ? 'CRÍTICO' : score >= 8 ? 'MODERADO' : 'ACEPTABLE'} (Puntaje: {score})
                      </span>
                    </div>

                    {/* Cinta de Fórmula PESV */}
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/60 dark:border-zinc-700/60 flex flex-wrap items-center justify-between text-[11px] gap-2">
                      <div className="flex items-center gap-2 font-mono text-slate-700 dark:text-zinc-300">
                        <Calculator size={13} className="text-sky-600 shrink-0" />
                        <span>Fórmula PESV:</span>
                        <span className="font-bold text-sky-700 dark:text-sky-400">Frecuencia ({r.probabilidad_frecuencia || '—'})</span> × 
                        <span className="font-bold text-sky-700 dark:text-sky-400"> Severidad ({r.impacto_severidad || '—'})</span> = 
                        <span className="font-black text-rose-600 dark:text-rose-400"> Calificación {score}</span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 italic">
                        {r.nivel_riesgo_residual || (score >= 12 ? 'Acción Correctiva Inmediata' : 'Vigilancia y Capacitación')}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-700 dark:text-zinc-300 grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                      <div>
                        <span className="text-[9px] font-bold uppercase text-slate-400 block">Peligro Vial Identificado:</span>
                        <p className="font-semibold text-slate-900 dark:text-zinc-100">{r.peligro_vial_descripcion || r.descripcion_riesgo}</p>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold uppercase text-slate-400 block">Posibles Consecuencias:</span>
                        <p className="font-medium text-slate-700 dark:text-zinc-300">{r.peores_consecuencias || 'Colisión, volcamiento o lesiones a terceros'}</p>
                      </div>
                    </div>

                    <div>
                      <button
                        type="button"
                        onClick={() => setExpandedRiskId(isExpanded ? null : r.id)}
                        className="text-[11px] font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1 cursor-pointer"
                      >
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        <span>{isExpanded ? 'Ocultar medidas del Sistema Seguro' : '👁️ Ver medidas del Sistema Seguro (Humano, Vehículo, Vía)'}</span>
                      </button>

                      {isExpanded && (
                        <div className="mt-3 p-3.5 rounded-2xl bg-surface-secondary/70 border border-sky-500/20 space-y-2 text-[11px] animate-in fade-in duration-200">
                          <div>
                            <span className="text-[9px] font-bold uppercase text-slate-400 block">Controles Existentes:</span>
                            <p className="text-slate-800 dark:text-zinc-200">{r.controles_existentes_detalle || 'Inspección preoperacional diaria'}</p>
                          </div>
                          <div>
                            <span className="text-[9px] font-bold uppercase text-sky-700 dark:text-sky-400 block">Medidas de Intervención Vial (Paso 8 y 9):</span>
                            <p className="text-slate-700 dark:text-zinc-300 font-medium">{r.medida_propuesta || r.acciones_plan_anual || 'Capacitación en manejo defensivo y revisión técnico-mecánica periódica.'}</p>
                          </div>
                        </div>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>

          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            TAB 3: EXPLICADOR DE METODOLOGÍA PESV Y CIMIENTO LEGAL
        ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'metodologia' && (
          <div className="space-y-6">
            
            <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-xs space-y-4">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                  <Scale className="w-4.5 h-4.5 text-sky-600" />
                  Metodología del Plan Estratégico de Seguridad Vial (Resolución 20223040040595 de 2022)
                </h3>
                <p className="text-xs text-slate-600 dark:text-zinc-400 mt-1 leading-relaxed">
                  Bajo la <strong>Ley 1503 de 2011</strong>, <strong>Ley 2050 de 2020</strong> y la <strong>Resolución 20223040040595 de 2022</strong> del Ministerio de Transporte, el PESV se estructura en 4 fases articuladas al SG-SST (Planificar, Hacer, Verificar, Actuar). En el <strong>Paso 8</strong> se efectúa la evaluación y valoración de riesgos viales:
                </p>
              </div>

              {/* Flujograma Visual en 4 Pasos */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2">
                
                <div className="p-4 rounded-2xl bg-sky-50/50 dark:bg-sky-950/20 border border-sky-200/70 dark:border-sky-800/60 space-y-2">
                  <div className="w-7 h-7 rounded-xl bg-sky-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                    1
                  </div>
                  <h4 className="font-extrabold text-xs text-slate-900 dark:text-zinc-100">
                    Caracterización Vial
                  </h4>
                  <p className="text-[11px] text-slate-600 dark:text-zinc-300 leading-relaxed">
                    Identificación del censo de conductores, roles en la vía (conductor, peatón, motociclista) y rutas misionales e in-itinere (Paso 6 y 7).
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/70 dark:border-blue-800/60 space-y-2">
                  <div className="w-7 h-7 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                    2
                  </div>
                  <h4 className="font-extrabold text-xs text-slate-900 dark:text-zinc-100">
                    Matriz de Riesgos Viales
                  </h4>
                  <p className="text-[11px] text-slate-600 dark:text-zinc-300 leading-relaxed">
                    Ponderación de <strong>Frecuencia de Desplazamiento × Severidad Lesional</strong> para priorizar escenarios de mayor riesgo de colisión o atropellamiento (Paso 8).
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-800/60 space-y-2">
                  <div className="w-7 h-7 rounded-xl bg-amber-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                    3
                  </div>
                  <h4 className="font-extrabold text-xs text-slate-900 dark:text-zinc-100">
                    Enfoque Sistema Seguro
                  </h4>
                  <p className="text-[11px] text-slate-600 dark:text-zinc-300 leading-relaxed">
                    Principio rector: el cuerpo humano tiene una tolerancia limitada a la energía cinética. Se diseñan vehículos seguros, velocidades seguras e infraestructura vial tolerante al error humano.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-800/60 space-y-2">
                  <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                    4
                  </div>
                  <h4 className="font-extrabold text-xs text-slate-900 dark:text-zinc-100">
                    Plan Anual e Indicadores
                  </h4>
                  <p className="text-[11px] text-slate-600 dark:text-zinc-300 leading-relaxed">
                    Monitoreo periódico de la tasa de siniestralidad vial, cumplimiento de inspecciones preoperacionales y programas de mantenimiento preventivo de flota (Paso 9 y 10).
                  </p>
                </div>

              </div>

              {/* Tabla de Criterios PESV */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200/80 dark:border-zinc-700/80 space-y-3">
                <h4 className="font-bold text-xs text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                  <Calculator size={14} className="text-sky-600" />
                  Niveles de Calificación Vial y Acciones Exigibles
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px]">
                  <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-rose-200/60 dark:border-rose-900/60 space-y-1.5">
                    <span className="font-extrabold text-rose-700 dark:text-rose-400 block">Riesgo Crítico (12 - 15 Puntos)</span>
                    <p className="text-slate-600 dark:text-zinc-300">
                      Rutas de alta siniestralidad, exceso de velocidad o vehículos pesados con interacción peatonal. <strong>Exige intervención inmediata en el Plan Anual PESV, monitoreo telemático y reinducción al conductor.</strong>
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-amber-200/60 dark:border-amber-900/60 space-y-1.5">
                    <span className="font-extrabold text-amber-700 dark:text-amber-400 block">Riesgo Moderado (8 - 11 Puntos)</span>
                    <p className="text-slate-600 dark:text-zinc-300">
                      Rutas interurbanas con condiciones climáticas variables o fatiga en trayectos medios. <strong>Requiere regulación de tiempos de descanso, control de jornada y mantenimiento preventivo.</strong>
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-emerald-200/60 dark:border-emerald-900/60 space-y-1.5">
                    <span className="font-extrabold text-emerald-700 dark:text-emerald-400 block">Riesgo Aceptable (3 - 7 Puntos)</span>
                    <p className="text-slate-600 dark:text-zinc-300">
                      Desplazamientos cortos de baja velocidad en entornos controlados. <strong>Se mantienen inspecciones preoperacionales y hábitos seguros de conducción defensiva.</strong>
                    </p>
                  </div>
                </div>

              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  );
}
