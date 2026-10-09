/**
 * MatrizIPEVARDashboard.tsx
 * Dashboard analítico y pedagógico de la Matriz IPEVR (GTC-45)
 * Cimiento Legal: Decreto 1072 de 2015 (Art. 2.2.4.6.15 y 2.2.4.6.24) & Resolución 0312 de 2019
 * Totalmente Adaptativo y Responsive (Mobile, Tablet, Desktop)
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
  AlertTriangle,
  Flame,
  CheckCircle2,
  Heart,
  MapPin,
  Sparkles,
  Loader2,
  ChevronDown,
  ChevronUp,
  Calculator,
  Scale,
  FileSpreadsheet,
  Info,
  Filter,
  Layers,
  ArrowRight,
  Activity
} from 'lucide-react';
import { MatrixRow, DISEASE_KEYWORDS, getNRColor } from './MatrizIPEVARConstants';
import cn from '~/utils/cn';

interface DashboardProps {
  matrixRows: MatrixRow[];
  conversationId: string | null;
  token: string;
  savedConclusions: Record<string, string>;
  onConclusionSaved: (chartType: string, text: string) => void;
  isMaximized?: boolean;
}

// ── Barra horizontal animada ──────────────────────────────────────────────────
const Bar = ({ label, value, max, color, labelWidth = 'w-24 sm:w-36 md:w-44' }: {
  label: string; value: number; max: number; color: string; labelWidth?: string;
}) => {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div className="flex items-center gap-2 sm:gap-3 w-full min-w-0">
      <span className={`text-[11px] font-semibold text-text-secondary shrink-0 text-right truncate ${labelWidth}`}
        title={label}>{label}</span>
      <div className="flex-1 min-w-0 bg-surface-tertiary border border-border-light rounded-full h-4 overflow-hidden relative">
        <div className={`absolute inset-y-0 left-0 ${color} rounded-full flex items-center justify-end pr-2 transition-all duration-700 ease-out`}
          style={{ width: `${pct > 0 ? Math.max(6, pct) : 0}%` }}>
          <span className="text-[9px] font-black text-white leading-none">{value}</span>
        </div>
      </div>
    </div>
  );
};

// ── Campo de conclusión con botón IA ─────────────────────────────────────────
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
      const res = await fetch('/api/sgsst/gtc45-workspace/ai-chart-conclusion', {
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
    await fetch('/api/sgsst/gtc45-workspace/ai-chart-conclusion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ conversationId, chartType, matrixRows: [], chartStats: {}, manualText: text }),
    }).catch(() => {});
    onSaved(text);
  };

  return (
    <div className="mt-4 pt-4 border-t border-border-light space-y-2 w-full min-w-0">
      <textarea
        className="w-full text-xs text-text-primary bg-surface-primary border border-border-light rounded-xl p-3 resize-y min-h-[64px] outline-none focus:border-teal-400 transition-colors"
        placeholder="Conclusión técnica GTC-45… presiona ✨ para generarla con IA"
        value={text}
        onChange={e => setText(e.target.value)}
        onBlur={handleBlur}
        rows={3}
      />
      <button onClick={generate} disabled={loading || !conversationId}
        className="group flex items-center justify-center p-2 h-[34px] bg-surface-secondary border border-border-medium rounded-xl text-teal-600 transition-all duration-300 hover:bg-teal-50 dark:hover:bg-teal-900/20 cursor-pointer disabled:opacity-50">
        {loading ? <Loader2 className="h-4 w-4 animate-spin shrink-0" />
          : <Sparkles className="h-4 w-4 shrink-0" />}
        <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 transition-all duration-300 whitespace-nowrap group-hover:ml-2 text-xs font-bold">
          {loading ? 'Generando…' : 'Generar Conclusión con IA'}
        </span>
      </button>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
export default function MatrizIPEVARDashboard({
  matrixRows,
  conversationId,
  token,
  savedConclusions,
  onConclusionSaved,
  isMaximized
}: DashboardProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'riesgos' | 'metodologia'>('dashboard');
  const [selectedHeatmapCell, setSelectedHeatmapCell] = useState<string | null>(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null);
  const [expandedRiskId, setExpandedRiskId] = useState<string | null>(null);

  // ── 1. Métricas Principales ──
  const totalRiesgos = matrixRows.length;

  const stats = useMemo(() => {
    let criticosNivelI = 0;
    let altosNivelII = 0;
    let mediosNivelIII = 0;
    let bajosNivelIV = 0;

    const catMap: Record<string, number> = {};

    matrixRows.forEach(r => {
      const nr = Number(r.nr) || 0;
      if (nr >= 600) criticosNivelI++;
      else if (nr >= 150) altosNivelII++;
      else if (nr >= 40) mediosNivelIII++;
      else bajosNivelIV++;

      const cat = r.peligro_clasificacion?.trim() || 'Condiciones de Seguridad';
      catMap[cat] = (catMap[cat] || 0) + 1;
    });

    const rankingCategorias = Object.entries(catMap)
      .map(([cat, count]) => ({
        cat,
        count,
        pct: totalRiesgos > 0 ? Math.round((count / totalRiesgos) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count);

    const peligroMasFrecuente = rankingCategorias[0] || { cat: 'Sin clasificar', count: 0, pct: 0 };
    const pctCritico = totalRiesgos > 0 ? Math.round((criticosNivelI / totalRiesgos) * 100) : 0;

    return {
      criticosNivelI,
      altosNivelII,
      mediosNivelIII,
      bajosNivelIV,
      rankingCategorias,
      peligroMasFrecuente,
      pctCritico
    };
  }, [matrixRows, totalRiesgos]);

  const getCatColor = (cat: string) => {
    const c = cat.toLowerCase();
    if (c.includes('biomec')) return { hex: '#0d9488', bg: 'bg-teal-500', text: 'text-teal-600', light: 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300' };
    if (c.includes('físic') || c.includes('fisic')) return { hex: '#3b82f6', bg: 'bg-blue-500', text: 'text-blue-600', light: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300' };
    if (c.includes('quím') || c.includes('quim')) return { hex: '#eab308', bg: 'bg-yellow-500', text: 'text-yellow-600', light: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-300' };
    if (c.includes('psico')) return { hex: '#a855f7', bg: 'bg-purple-500', text: 'text-purple-600', light: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300' };
    if (c.includes('biol')) return { hex: '#f43f5e', bg: 'bg-rose-500', text: 'text-rose-600', light: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300' };
    if (c.includes('seguridad') || c.includes('locativ') || c.includes('mec')) return { hex: '#f59e0b', bg: 'bg-amber-500', text: 'text-amber-600', light: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' };
    return { hex: '#64748b', bg: 'bg-slate-500', text: 'text-slate-600', light: 'bg-slate-50 text-slate-700 dark:bg-slate-900/40 dark:text-slate-300' };
  };

  // ── 2. Matriz Térmica 4x4 Oficial GTC-45 ──
  const heatmapData = useMemo(() => {
    const ncRows = [
      { nc: 100, label: 'Mortal (100)' },
      { nc: 60, label: 'Muy Grave (60)' },
      { nc: 25, label: 'Grave (25)' },
      { nc: 10, label: 'Leve (10)' }
    ];
    const npCols = [
      { npLabel: 'Muy Alto (24-40)', min: 24, max: 40 },
      { npLabel: 'Alto (10-20)', min: 10, max: 20 },
      { npLabel: 'Medio (6-8)', min: 6, max: 8 },
      { npLabel: 'Bajo (2-4)', min: 2, max: 4 }
    ];
    const levels = [
      ['I', 'I', 'I', 'II'],
      ['I', 'I', 'II', 'II'],
      ['I', 'II', 'III', 'III'],
      ['II', 'III', 'III', 'IV']
    ];

    return ncRows.map((r, rIdx) => {
      return npCols.map((c, cIdx) => {
        const cellKey = `${rIdx}-${cIdx}`;
        const level = levels[rIdx][cIdx];
        const matchingRows = matrixRows.filter(row => {
          const rowNC = Number(row.nc) || 0;
          const rowNP = Number(row.np) || 0;
          const matchNC = rowNC === r.nc || (r.nc === 100 && rowNC >= 100) || (r.nc === 10 && rowNC <= 10 && rowNC > 0);
          const matchNP = rowNP >= c.min && rowNP <= c.max;
          return matchNC && matchNP;
        });

        return {
          rIdx,
          cIdx,
          cellKey,
          level,
          ncLabel: r.label,
          npLabel: c.npLabel,
          count: matchingRows.length,
          rows: matchingRows
        };
      });
    });
  }, [matrixRows]);

  // ── 3. Charts Clásicos Reutilizables ──
  const chartA = useMemo(() => {
    const map: Record<string, { count: number; totalNR: number; max: number }> = {};
    matrixRows.forEach(r => {
      const k = r.peligro_clasificacion?.trim() || 'Sin clasificar';
      if (!map[k]) map[k] = { count: 0, totalNR: 0, max: 0 };
      map[k].count++;
      map[k].totalNR += Number(r.nr) || 0;
      map[k].max = Math.max(map[k].max, Number(r.nr) || 0);
    });
    return Object.entries(map)
      .map(([clas, d]) => ({ clas, count: d.count, avg: Math.round(d.totalNR / d.count), max: d.max }))
      .sort((a, b) => b.avg - a.avg);
  }, [matrixRows]);

  const chartB = useMemo(() => {
    const empty = (v?: string) => !v || ['ninguno', 'ninguna', 'none', 'no aplica', ''].includes(v.toLowerCase().trim());
    let fuente = 0, medio = 0, individuo = 0;
    matrixRows.forEach(r => {
      if (!empty(r.controles_fuente) || !empty(r.medida_eliminacion) || !empty(r.medida_sustitucion)) fuente++;
      if (!empty(r.controles_medio) || !empty(r.medida_ingenieria)) medio++;
      if (!empty(r.controles_individuo) || !empty(r.medida_administrativa) || !empty(r.medida_eppu)) individuo++;
    });
    const total = matrixRows.length || 1;
    return [
      { label: 'En Fuente (Eliminación/Sust.)', value: fuente, pct: Math.round((fuente / total) * 100) },
      { label: 'En Medio (Ingeniería)', value: medio, pct: Math.round((medio / total) * 100) },
      { label: 'En Individuo (EPP/Admin)', value: individuo, pct: Math.round((individuo / total) * 100) },
    ];
  }, [matrixRows]);

  const chartC = useMemo(() => {
    const empty = (v?: string) => !v || ['ninguno', 'ninguna', 'none', ''].includes(v.toLowerCase().trim());
    return DISEASE_KEYWORDS.map(d => {
      const matches = matrixRows.filter(r => {
        const haystack = `${r.efectos_posibles} ${r.peligro_descripcion}`.toLowerCase();
        return d.keywords.some(kw => haystack.includes(kw));
      });
      if (matches.length === 0) return null;
      const noControl = matches.filter(r =>
        empty(r.medida_eliminacion) && empty(r.medida_sustitucion) &&
        empty(r.medida_ingenieria) && empty(r.medida_administrativa) && empty(r.medida_eppu)
      ).length;
      const nivel = noControl === matches.length ? 'alto' : noControl > 0 ? 'medio' : 'bajo';
      return { name: d.name, count: matches.length, noControl, nivel };
    }).filter(Boolean) as { name: string; count: number; noControl: number; nivel: string }[];
  }, [matrixRows]);

  const chartD = useMemo(() => {
    const map: Record<string, { totalNR: number; count: number; criticos: number }> = {};
    matrixRows.forEach(r => {
      const k = r.proceso?.trim() || 'Sin proceso';
      if (!map[k]) map[k] = { totalNR: 0, count: 0, criticos: 0 };
      map[k].count++;
      map[k].totalNR += Number(r.nr) || 0;
      if (Number(r.nr) >= 150) map[k].criticos++;
    });
    return Object.entries(map)
      .map(([proc, d]) => ({ proc, avg: Math.round(d.totalNR / d.count), count: d.count, criticos: d.criticos }))
      .sort((a, b) => b.avg - a.avg);
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
    if (selectedCategoryFilter) {
      rows = rows.filter(r => (r.peligro_clasificacion?.trim() || '') === selectedCategoryFilter);
    }
    return rows.sort((a, b) => (Number(b.nr) || 0) - (Number(a.nr) || 0));
  }, [matrixRows, selectedHeatmapCell, selectedCategoryFilter, heatmapData]);

  if (matrixRows.length === 0) return null;

  const maxChartA = Math.max(...chartA.map(d => d.avg), 1);
  const maxChartD = Math.max(...chartD.map(d => d.avg), 1);

  return (
    <div className="w-full max-w-full min-w-0 overflow-hidden rounded-3xl border border-teal-500/30 bg-surface-secondary shadow-md transition-all duration-300 my-4 sm:my-6">
      
      {/* ── HEADER PRINCIPAL CON BOTONERA CÁPSULA WAPPY ADAPTATIVA ── */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between p-4 sm:px-6 sm:py-5 border-b border-border-light gap-3.5 bg-surface-tertiary/60 w-full min-w-0">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white flex items-center justify-center shadow-md shadow-teal-500/20 shrink-0">
            <Target size={20} className="stroke-[2.2]" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm sm:text-base md:text-lg font-bold text-slate-900 dark:text-zinc-100 leading-tight flex items-center gap-2 flex-wrap">
              <span className="truncate">Matriz IPEVR — Evaluación GTC-45</span>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300 border border-teal-300/40 shrink-0">
                Dec. 1072/15 Art. 2.2.4.6.15
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400 font-normal truncate mt-0.5">
              Identificación de peligros, estimación matemática y jerarquía legal de controles
            </p>
          </div>
        </div>

        {/* Botonera de 3 Vistas con soporte para scroll horizontal en móviles */}
        <div className="w-full lg:w-auto overflow-x-auto scrollbar-none py-0.5">
          <div className="inline-flex items-center gap-1 p-1 rounded-2xl bg-surface-primary border border-border-medium text-[11px] font-bold shadow-2xs whitespace-nowrap">
            <button
              type="button"
              onClick={() => setActiveTab('dashboard')}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer",
                activeTab === 'dashboard'
                  ? "bg-teal-600 text-white shadow-xs font-black"
                  : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100"
              )}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Gráficas & Métricas</span>
              <span className="sm:hidden">Gráficas</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('riesgos')}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer",
                activeTab === 'riesgos'
                  ? "bg-teal-600 text-white shadow-xs font-black"
                  : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100"
              )}
            >
              <Target className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Riesgos Priorizados ({matrixRows.length})</span>
              <span className="sm:hidden">Riesgos ({matrixRows.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('metodologia')}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer",
                activeTab === 'metodologia'
                  ? "bg-teal-600 text-white shadow-xs font-black"
                  : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100"
              )}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span className="hidden md:inline">¿Cómo se define el riesgo?</span>
              <span className="md:hidden">Metodología Legal</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── CUERPO DEL DASHBOARD RESPONSIVE ── */}
      <div className="p-4 sm:p-6 bg-surface-primary/30 space-y-6 text-xs w-full min-w-0">
        
        {/* 1. Tarjetas Superiores de Métricas Clave (2 columnas en móvil/tablet, 4 en desktop) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5 w-full min-w-0">
          <div className="p-3 sm:p-3.5 rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-900/40 shadow-xs flex flex-col justify-between min-w-0">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500 flex items-center gap-1.5 truncate">
              <Layers className="w-3.5 h-3.5 text-teal-600 shrink-0" /> <span className="truncate">Peligros Totales</span>
            </span>
            <div className="mt-2 flex items-baseline gap-1.5 flex-wrap">
              <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-zinc-100">
                {totalRiesgos}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium truncate">
                filas evaluadas
              </span>
            </div>
          </div>

          <div className="p-3 sm:p-3.5 rounded-2xl border border-rose-200/80 dark:border-rose-800/60 bg-rose-50/50 dark:bg-rose-950/20 shadow-xs flex flex-col justify-between min-w-0">
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 dark:text-rose-400 flex items-center gap-1.5 truncate">
              <Flame className="w-3.5 h-3.5 text-rose-600 shrink-0" /> <span className="truncate">Nivel I (No Aceptable)</span>
            </span>
            <div className="mt-2 flex items-baseline justify-between gap-1 flex-wrap">
              <span className="text-xl sm:text-2xl font-black text-rose-900 dark:text-rose-200">
                {stats.criticosNivelI}
              </span>
              <span className="text-[10px] sm:text-[11px] text-rose-700 dark:text-rose-300 font-bold truncate">
                {stats.pctCritico}% de alta criticidad
              </span>
            </div>
          </div>

          <div className="p-3 sm:p-3.5 rounded-2xl border border-teal-200/80 dark:border-teal-800/60 bg-teal-50/50 dark:bg-teal-950/20 shadow-xs flex flex-col justify-between min-w-0">
            <span className="text-[10px] font-black uppercase tracking-wider text-teal-700 dark:text-teal-400 flex items-center gap-1.5 truncate">
              <TrendingUp className="w-3.5 h-3.5 text-teal-600 shrink-0" /> <span className="truncate">Peligro Dominante</span>
            </span>
            <div className="mt-2 min-w-0">
              <span className="text-base sm:text-lg font-black text-teal-900 dark:text-teal-200 block truncate" title={stats.peligroMasFrecuente.cat}>
                {stats.peligroMasFrecuente.cat}
              </span>
              <span className="text-[10px] sm:text-[11px] font-bold text-teal-700 dark:text-teal-300 block truncate">
                {stats.peligroMasFrecuente.pct}% de incidencia
              </span>
            </div>
          </div>

          <div className="p-3 sm:p-3.5 rounded-2xl border border-blue-200/80 dark:border-blue-800/60 bg-blue-50/50 dark:bg-blue-950/20 shadow-xs flex flex-col justify-between min-w-0">
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 dark:text-blue-400 flex items-center gap-1.5 truncate">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" /> <span className="truncate">Control en Fuente</span>
            </span>
            <div className="mt-2 flex items-baseline justify-between gap-1 flex-wrap">
              <span className="text-xl sm:text-2xl font-black text-blue-900 dark:text-blue-200">
                {chartB[0]?.value || 0}
              </span>
              <span className="text-[10px] sm:text-[11px] text-blue-700 dark:text-blue-300 font-medium truncate">
                {chartB[0]?.pct || 0}% de cobertura
              </span>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            TAB 1: GRÁFICAS & MÉTRICAS
        ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 w-full min-w-0">
            
            {/* Fila 1: Donut SVG Interactivo + Matriz Térmica 4x4 (Stack en laptop/tablet, split en xl:) */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 w-full min-w-0">
              
              {/* Gráfico Donut SVG de Peligros GTC-45 (5 cols en xl:, 100% en pantallas menores) */}
              <div className="xl:col-span-5 p-4 sm:p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-xs flex flex-col justify-between min-w-0 w-full">
                <div>
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <h3 className="font-extrabold text-xs text-slate-900 dark:text-zinc-100 flex items-center gap-2 truncate">
                      <PieChart className="w-4 h-4 text-teal-600 shrink-0" />
                      <span className="truncate">Distribución de Peligros GTC-45</span>
                    </h3>
                    <span className="text-[10px] font-bold text-slate-400 shrink-0">Total: {totalRiesgos}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">
                    Proporción de peligros por clasificación técnica oficial.
                  </p>
                </div>

                {/* Donut Chart SVG Adaptativo */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 my-4 w-full min-w-0">
                  <div className="relative w-32 h-32 sm:w-36 sm:h-36 shrink-0">
                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90 transform">
                      {(() => {
                        let accumulatedPct = 0;
                        return stats.rankingCategorias.map((item, idx) => {
                          const strokeDasharray = `${item.pct} ${100 - item.pct}`;
                          const strokeDashoffset = -accumulatedPct;
                          accumulatedPct += item.pct;
                          const colorObj = getCatColor(item.cat);
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
                              onClick={() => {
                                setSelectedCategoryFilter(item.cat);
                                setActiveTab('riesgos');
                              }}
                            />
                          );
                        });
                      })()}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-xl font-black text-slate-900 dark:text-zinc-100 leading-none">
                        {totalRiesgos}
                      </span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                        Riesgos
                      </span>
                    </div>
                  </div>

                  {/* Leyenda del Donut */}
                  <div className="space-y-1.5 w-full sm:max-w-[220px] min-w-0">
                    {stats.rankingCategorias.slice(0, 5).map((item, idx) => {
                      const colorObj = getCatColor(item.cat);
                      return (
                        <div
                          key={idx}
                          onClick={() => {
                            setSelectedCategoryFilter(item.cat);
                            setActiveTab('riesgos');
                          }}
                          className="flex items-center justify-between text-[11px] p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer min-w-0"
                        >
                          <div className="flex items-center gap-2 truncate min-w-0 flex-1">
                            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${colorObj.bg}`} />
                            <span className="font-semibold text-slate-700 dark:text-zinc-300 truncate" title={item.cat}>
                              {item.cat}
                            </span>
                          </div>
                          <span className="font-bold text-slate-900 dark:text-zinc-100 ml-2 shrink-0">
                            {item.pct}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="p-2.5 rounded-2xl bg-teal-50/60 dark:bg-teal-950/20 border border-teal-200/60 text-[11px] text-teal-800 dark:text-teal-300">
                  💡 Haz clic en cualquier categoría para filtrar los riesgos evaluados.
                </div>
              </div>

              {/* Matriz Térmica Oficial GTC-45 (7 cols en xl:, 100% en pantallas menores) */}
              <div className="xl:col-span-7 p-4 sm:p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-xs flex flex-col justify-between min-w-0 w-full overflow-hidden">
                <div>
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <h3 className="font-extrabold text-xs text-slate-900 dark:text-zinc-100 flex items-center gap-2 truncate">
                      <Flame className="w-4 h-4 text-rose-600 shrink-0" />
                      <span className="truncate">Matriz Térmica GTC-45 (Consecuencia vs Probabilidad)</span>
                    </h3>
                    <span className="text-[10px] font-bold text-teal-600 px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/50 shrink-0">
                      Mapa de Calor
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">
                    Haz clic en cualquier cuadrante para filtrar los riesgos ubicados en esa coordenada.
                  </p>
                </div>

                {/* Heatmap 4x4 Grid Adaptativo */}
                <div className="w-full overflow-x-auto scrollbar-thin my-3">
                  <div className="min-w-[360px] sm:min-w-[460px] w-full text-[10px]">
                    <div className="grid grid-cols-5 gap-1 sm:gap-1.5 mb-1.5 font-bold text-slate-400 text-center">
                      <div className="text-left text-[9px] uppercase truncate">NC \ NP</div>
                      <div className="truncate">Muy Alta</div>
                      <div className="truncate">Alta</div>
                      <div className="truncate">Media</div>
                      <div className="truncate">Baja</div>
                    </div>

                    {heatmapData.map((row, rIdx) => (
                      <div key={rIdx} className="grid grid-cols-5 gap-1 sm:gap-1.5 mb-1.5 items-center">
                        <div className="font-bold text-slate-600 dark:text-zinc-400 text-[10px] truncate pr-1" title={row[0].ncLabel}>
                          {row[0].ncLabel}
                        </div>
                        {row.map((cell) => {
                          const isSelected = selectedHeatmapCell === cell.cellKey;
                          let cellBg = 'bg-slate-100 dark:bg-zinc-800 text-slate-600';
                          if (cell.level === 'I') cellBg = 'bg-red-500 text-white border-red-600 hover:bg-red-600 shadow-sm';
                          else if (cell.level === 'II') cellBg = 'bg-orange-500 text-white border-orange-600 hover:bg-orange-600 shadow-sm';
                          else if (cell.level === 'III') cellBg = 'bg-yellow-400 text-slate-900 border-yellow-500 hover:bg-yellow-500 shadow-sm';
                          else if (cell.level === 'IV') cellBg = 'bg-emerald-500 text-white border-emerald-600 hover:bg-emerald-600 shadow-sm';

                          return (
                            <button
                              key={cell.cellKey}
                              type="button"
                              onClick={() => {
                                setSelectedHeatmapCell(isSelected ? null : cell.cellKey);
                                setActiveTab('riesgos');
                              }}
                              className={cn(
                                "h-11 sm:h-12 rounded-xl border flex flex-col items-center justify-center transition-all p-1 cursor-pointer w-full min-w-0",
                                cellBg,
                                isSelected ? "ring-2 ring-teal-500 font-black scale-95 shadow-sm" : "border-slate-200/40 dark:border-zinc-700/40"
                              )}
                            >
                              <span className="font-extrabold text-[9px] uppercase truncate w-full text-center">
                                Nivel {cell.level}
                              </span>
                              <span className="text-[11px] font-black truncate w-full text-center">
                                {cell.count > 0 ? `${cell.count} r.` : '—'}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between text-[10px] font-bold text-slate-500 pt-2 border-t border-slate-100 dark:border-zinc-800 gap-1.5">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" /> Zona I: No Aceptable</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" /> Zona II: Control</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-yellow-400 shrink-0" /> Zona III: Mejorable</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" /> Zona IV: Aceptable</span>
                </div>
              </div>

            </div>

            {/* Fila 2: Gráficos de Controles, Enfermedades y Procesos */}
            <div className={`grid gap-5 ${isMaximized ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1'} w-full min-w-0`}>
              
              {/* Gráfico A: NR Promedio por Clasificación */}
              <div className="p-4 sm:p-5 bg-surface-secondary rounded-3xl border border-border-medium shadow-sm w-full min-w-0">
                <h4 className="text-xs font-bold text-text-primary uppercase tracking-widest mb-4 flex items-center gap-2 truncate">
                  <span className="w-2 h-2 rounded-full bg-teal-500 shrink-0 inline-block" />
                  <span className="truncate">Riesgos por Tipo de Peligro (NR Promedio)</span>
                </h4>
                <div className="space-y-3 w-full min-w-0">
                  {chartA.slice(0, 8).map(d => {
                    const col = getNRColor(d.avg);
                    return <Bar key={d.clas} label={`${d.clas} (${d.count})`} value={d.avg} max={maxChartA} color={col.bg} />;
                  })}
                </div>
                <ConclusionField chartType="clasificacion" chartStats={chartA} matrixRows={matrixRows}
                  conversationId={conversationId} token={token}
                  saved={savedConclusions.clasificacion || ''} onSaved={t => onConclusionSaved('clasificacion', t)} />
              </div>

              {/* Gráfico B: Cobertura de la Jerarquía de Controles */}
              <div className="p-4 sm:p-5 bg-surface-secondary rounded-3xl border border-border-medium shadow-sm w-full min-w-0">
                <h4 className="text-xs font-bold text-text-primary uppercase tracking-widest mb-4 flex items-center gap-2 truncate">
                  <ShieldCheck className="h-4 w-4 text-blue-500 shrink-0" />
                  <span className="truncate">Jerarquía Legal de Intervención (Dec. 1072/15)</span>
                </h4>
                <div className="space-y-3 w-full min-w-0">
                  {chartB.map(d => (
                    <div key={d.label} className="w-full min-w-0">
                      <Bar label={`${d.label}`} value={d.value} max={matrixRows.length} color="bg-blue-500" />
                      <p className="text-[10px] text-text-secondary text-right mt-0.5">{d.pct}% con esta medida</p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 p-3 rounded-xl bg-surface-primary border border-border-light text-xs text-text-secondary">
                  {chartB[0]?.pct < chartB[2]?.pct
                    ? '⚠️ Alerta: Jerarquía invertida (más medidas en EPP que en fuente). El Decreto 1072 exige priorizar controles de ingeniería.'
                    : '✅ Cumplimiento Legal: La intervención prioriza los controles en la fuente y medio según la jerarquía normativa.'}
                </div>
                <ConclusionField chartType="controles" chartStats={chartB} matrixRows={matrixRows}
                  conversationId={conversationId} token={token}
                  saved={savedConclusions.controles || ''} onSaved={t => onConclusionSaved('controles', t)} />
              </div>

              {/* Gráfico C: Enfermedades Laborales Potenciales */}
              <div className="p-4 sm:p-5 bg-surface-secondary rounded-3xl border border-border-medium shadow-sm w-full min-w-0">
                <h4 className="text-xs font-bold text-text-primary uppercase tracking-widest mb-4 flex items-center gap-2 truncate">
                  <Heart className="h-4 w-4 text-red-500 shrink-0" />
                  <span className="truncate">Enfermedades Potenciales (Dec. 1477/14)</span>
                </h4>
                {chartC.length === 0 ? (
                  <p className="text-xs text-text-secondary italic">No se identificaron patologías críticas en los efectos documentados.</p>
                ) : (
                  <div className="space-y-2 w-full min-w-0">
                    {chartC.map(d => (
                      <div key={d.name} className="flex items-center gap-3 p-2.5 rounded-2xl border border-border-light bg-surface-primary min-w-0">
                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${d.nivel === 'alto' ? 'bg-red-500' : d.nivel === 'medio' ? 'bg-orange-400' : 'bg-green-500'}`} />
                        <span className="text-xs font-semibold text-text-primary flex-1 truncate">{d.name}</span>
                        <span className="text-[10px] font-mono text-text-secondary shrink-0">{d.count} r.</span>
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full shrink-0 ${
                          d.nivel === 'alto' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            : d.nivel === 'medio' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                            : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        }`}>
                          {d.nivel === 'alto' ? 'Sin control' : d.nivel === 'medio' ? 'Parcial' : 'Controlada'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                <ConclusionField chartType="enfermedades" chartStats={chartC} matrixRows={matrixRows}
                  conversationId={conversationId} token={token}
                  saved={savedConclusions.enfermedades || ''} onSaved={t => onConclusionSaved('enfermedades', t)} />
              </div>

              {/* Gráfico D: Nivel de Riesgo por Proceso */}
              <div className="p-4 sm:p-5 bg-surface-secondary rounded-3xl border border-border-medium shadow-sm w-full min-w-0">
                <h4 className="text-xs font-bold text-text-primary uppercase tracking-widest mb-4 flex items-center gap-2 truncate">
                  <MapPin className="h-4 w-4 text-purple-500 shrink-0" />
                  <span className="truncate">Promedio NR x Proceso</span>
                </h4>
                <div className="space-y-3 w-full min-w-0">
                  {chartD.slice(0, 8).map(d => {
                    const col = getNRColor(d.avg);
                    return (
                      <div key={d.proc} className="w-full min-w-0">
                        <Bar label={d.proc} value={d.avg} max={maxChartD} color={col.bg} />
                        {d.criticos > 0 && (
                          <p className="text-[10px] text-red-500 font-semibold text-right mt-0.5">
                            ⚠ {d.criticos} crítico{d.criticos > 1 ? 's' : ''} en este proceso
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
                <ConclusionField chartType="procesos" chartStats={chartD} matrixRows={matrixRows}
                  conversationId={conversationId} token={token}
                  saved={savedConclusions.procesos || ''} onSaved={t => onConclusionSaved('procesos', t)} />
              </div>

            </div>

          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            TAB 2: RIESGOS PRIORIZADOS (CON FÓRMULA MATEMÁTICA Y TRANSPARENCIA)
        ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'riesgos' && (
          <div className="space-y-4 w-full min-w-0">
            
            {/* Barra de Filtros Activos */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-2xs w-full min-w-0">
              <div className="flex items-center gap-2 flex-wrap min-w-0">
                <span className="font-bold text-xs text-slate-700 dark:text-zinc-300 flex items-center gap-1.5 truncate">
                  <Filter size={13} className="text-teal-600 shrink-0" />
                  <span>Mostrando {filteredRows.length} de {matrixRows.length} riesgos evaluados</span>
                </span>
                {selectedHeatmapCell && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 dark:bg-teal-900/60 dark:text-teal-300 shrink-0">
                    Cuadrante: {selectedHeatmapCell}
                    <button type="button" onClick={() => setSelectedHeatmapCell(null)} className="hover:text-red-600 cursor-pointer ml-1">✕</button>
                  </span>
                )}
                {selectedCategoryFilter && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300 shrink-0">
                    {selectedCategoryFilter}
                    <button type="button" onClick={() => setSelectedCategoryFilter(null)} className="hover:text-red-600 cursor-pointer ml-1">✕</button>
                  </span>
                )}
              </div>

              {(selectedHeatmapCell || selectedCategoryFilter) && (
                <button
                  type="button"
                  onClick={() => { setSelectedHeatmapCell(null); setSelectedCategoryFilter(null); }}
                  className="text-[11px] font-bold text-teal-600 hover:text-teal-700 cursor-pointer shrink-0"
                >
                  Restablecer filtros
                </button>
              )}
            </div>

            {/* Listado de Tarjetas de Riesgos */}
            <div className="space-y-3 w-full min-w-0">
              {filteredRows.map((r, idx) => {
                const nrVal = Number(r.nr) || 0;
                const nrCol = getNRColor(nrVal);
                const isExpanded = expandedRiskId === r.id;
                const colorObj = getCatColor(r.peligro_clasificacion || '');

                return (
                  <div
                    key={r.id || idx}
                    className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-2xs space-y-3 transition-all hover:border-teal-500/40 w-full min-w-0"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap min-w-0 flex-1">
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 shrink-0">
                          PRIORIDAD #{idx + 1}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 ${colorObj.light}`}>
                          {r.peligro_clasificacion || 'Peligro'}
                        </span>
                        <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 truncate">
                          {r.proceso} • {r.zona_lugar || 'Sede'} • {r.actividad}
                        </span>
                      </div>

                      {/* Badge de Nivel de Riesgo GTC-45 */}
                      <span className={`text-[11px] font-black px-2.5 py-1 rounded-xl ${nrCol.bg} text-white shadow-2xs shrink-0`}>
                        Nivel {r.interpretacion_nr || (nrVal >= 600 ? 'I' : nrVal >= 150 ? 'II' : nrVal >= 40 ? 'III' : 'IV')} (NR: {nrVal})
                      </span>
                    </div>

                    {/* Cinta de Fórmula Matemática GTC-45 */}
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/60 dark:border-zinc-700/60 flex flex-wrap items-center justify-between text-[11px] gap-2 w-full min-w-0">
                      <div className="flex items-center gap-1.5 font-mono text-slate-700 dark:text-zinc-300 flex-wrap">
                        <Calculator size={13} className="text-teal-600 shrink-0" />
                        <span className="font-semibold">Fórmula GTC-45:</span>
                        <span className="font-bold text-teal-700 dark:text-teal-400">ND ({r.nd || '—'})</span> × <span className="font-bold text-teal-700 dark:text-teal-400">NE ({r.ne || '—'})</span> = 
                        <span className="font-black text-slate-900 dark:text-white">NP {r.np || '—'}</span> • 
                        <span className="font-black text-slate-900 dark:text-white">NP ({r.np || '—'})</span> × <span className="font-bold text-teal-700 dark:text-teal-400">NC ({r.nc || '—'})</span> = 
                        <span className="font-black text-rose-600 dark:text-rose-400">NR {nrVal}</span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 italic shrink-0">
                        {r.aceptabilidad_riesgo || (nrVal >= 600 ? 'No Aceptable' : nrVal >= 150 ? 'Control específico' : 'Mejorable / Aceptable')}
                      </span>
                    </div>

                    {/* Descripción y Efectos Posibles */}
                    <div className="text-[11px] text-slate-700 dark:text-zinc-300 grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 w-full min-w-0">
                      <div className="min-w-0">
                        <span className="text-[9px] font-bold uppercase text-slate-400 block truncate">Peligro y Fuente:</span>
                        <p className="font-semibold text-slate-900 dark:text-zinc-100 break-words">{r.peligro_descripcion || r.tarea}</p>
                      </div>
                      <div className="min-w-0">
                        <span className="text-[9px] font-bold uppercase text-slate-400 block truncate">Efectos Posibles en la Salud:</span>
                        <p className="font-medium text-slate-700 dark:text-zinc-300 break-words">{r.efectos_posibles || 'Molestias o incidentes laborales'}</p>
                      </div>
                    </div>

                    {/* Acordeón de Medidas de Intervención */}
                    <div>
                      <button
                        type="button"
                        onClick={() => setExpandedRiskId(isExpanded ? null : r.id)}
                        className="text-[11px] font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1 cursor-pointer"
                      >
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        <span>{isExpanded ? 'Ocultar medidas de intervención' : '👁️ Ver controles existentes y jerarquía de intervención'}</span>
                      </button>

                      {isExpanded && (
                        <div className="mt-3 p-3.5 rounded-2xl bg-surface-secondary/70 border border-teal-500/20 space-y-2.5 text-[11px] animate-in fade-in duration-200 w-full min-w-0">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 border-b border-border-light pb-2.5 w-full min-w-0">
                            <div className="min-w-0">
                              <span className="text-[9px] font-bold uppercase text-slate-400 block">En la Fuente:</span>
                              <p className="text-slate-800 dark:text-zinc-200 break-words">{r.controles_fuente || 'Ninguno'}</p>
                            </div>
                            <div className="min-w-0">
                              <span className="text-[9px] font-bold uppercase text-slate-400 block">En el Medio:</span>
                              <p className="text-slate-800 dark:text-zinc-200 break-words">{r.controles_medio || 'Ninguno'}</p>
                            </div>
                            <div className="min-w-0">
                              <span className="text-[9px] font-bold uppercase text-slate-400 block">En el Individuo:</span>
                              <p className="text-slate-800 dark:text-zinc-200 break-words">{r.controles_individuo || 'Ninguno'}</p>
                            </div>
                          </div>

                          <div>
                            <span className="text-[9px] font-black uppercase text-teal-700 dark:text-teal-400 block">
                              Jerarquía de Medidas Propuestas (Dec. 1072/15 Art. 2.2.4.6.24):
                            </span>
                            <ul className="list-disc list-inside space-y-0.5 mt-1 text-slate-700 dark:text-zinc-300">
                              {r.medida_eliminacion && <li><strong>Eliminación:</strong> {r.medida_eliminacion}</li>}
                              {r.medida_sustitucion && <li><strong>Sustitución:</strong> {r.medida_sustitucion}</li>}
                              {r.medida_ingenieria && <li><strong>Ingeniería:</strong> {r.medida_ingenieria}</li>}
                              {r.medida_administrativa && <li><strong>Administrativos / Señalización:</strong> {r.medida_administrativa}</li>}
                              {r.medida_eppu && <li><strong>EPP:</strong> {r.medida_eppu}</li>}
                            </ul>
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
            TAB 3: EXPLICADOR DE METODOLOGÍA GTC-45 Y CIMIENTO LEGAL
        ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'metodologia' && (
          <div className="space-y-6 w-full min-w-0">
            
            <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-xs space-y-4 w-full min-w-0">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                  <Scale className="w-4.5 h-4.5 text-teal-600 shrink-0" />
                  <span>Metodología Oficial de Valoración de Riesgos (Guía Técnica Colombiana GTC-45)</span>
                </h3>
                <p className="text-xs text-slate-600 dark:text-zinc-400 mt-1 leading-relaxed">
                  El <strong>Decreto 1072 de 2015 (Art. 2.2.4.6.15)</strong> y la <strong>Resolución 0312 de 2019 (Estándares 4.1.1 y 4.2.1)</strong> establecen que la empresa debe aplicar una metodología sistemática con alcance sobre todos los procesos y centros de trabajo. En WAPPY, la estimación se realiza mediante el modelo matemático de la <strong>GTC-45</strong>:
                </p>
              </div>

              {/* Flujograma Visual en 4 Pasos Responsive */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 pt-2 w-full min-w-0">
                
                <div className="p-4 rounded-2xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200/70 dark:border-teal-800/60 space-y-2 min-w-0">
                  <div className="w-7 h-7 rounded-xl bg-teal-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                    1
                  </div>
                  <h4 className="font-extrabold text-xs text-slate-900 dark:text-zinc-100">
                    Caracterización Integral
                  </h4>
                  <p className="text-[11px] text-slate-600 dark:text-zinc-300 leading-relaxed">
                    Identificación de procesos, zonas, actividades rutinarias y no rutinarias, cargos involucrados y peligros según la Tabla 1 de la GTC-45.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/70 dark:border-blue-800/60 space-y-2 min-w-0">
                  <div className="w-7 h-7 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                    2
                  </div>
                  <h4 className="font-extrabold text-xs text-slate-900 dark:text-zinc-100">
                    Estimación de Probabilidad
                  </h4>
                  <p className="text-[11px] text-slate-600 dark:text-zinc-300 leading-relaxed">
                    Cálculo del <strong>Nivel de Probabilidad</strong>: <br />
                    <span className="font-mono font-bold text-teal-700 dark:text-teal-400">NP = ND × NE</span>.<br />
                    Multiplica la deficiencia de los controles (ND) por la frecuencia de exposición (NE).
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-800/60 space-y-2 min-w-0">
                  <div className="w-7 h-7 rounded-xl bg-amber-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                    3
                  </div>
                  <h4 className="font-extrabold text-xs text-slate-900 dark:text-zinc-100">
                    Nivel de Riesgo Oficial
                  </h4>
                  <p className="text-[11px] text-slate-600 dark:text-zinc-300 leading-relaxed">
                    Cálculo del <strong>Nivel de Riesgo</strong>: <br />
                    <span className="font-mono font-bold text-rose-600 dark:text-rose-400">NR = NP × NC</span>.<br />
                    Determina la aceptabilidad en 4 niveles (I: No Aceptable, II: Control, III: Mejorable, IV: Aceptable).
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-800/60 space-y-2 min-w-0">
                  <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                    4
                  </div>
                  <h4 className="font-extrabold text-xs text-slate-900 dark:text-zinc-100">
                    Jerarquía de Controles
                  </h4>
                  <p className="text-[11px] text-slate-600 dark:text-zinc-300 leading-relaxed">
                    Obligatoriedad legal del <strong>Dec. 1072 Art. 2.2.4.6.24</strong>: primero eliminar o sustituir el peligro; luego controles de ingeniería; solo al final administrativos y EPP.
                  </p>
                </div>

              </div>

              {/* Tabla de Parámetros GTC-45 Responsive */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200/80 dark:border-zinc-700/80 space-y-3 w-full min-w-0">
                <h4 className="font-bold text-xs text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                  <Calculator size={14} className="text-teal-600 shrink-0" />
                  <span>Tabla de Variables y Criterios Matemáticos de la GTC-45</span>
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] w-full min-w-0">
                  <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-700/60 space-y-1.5 min-w-0">
                    <span className="font-extrabold text-teal-700 dark:text-teal-400 block">Nivel de Deficiencia (ND)</span>
                    <ul className="space-y-1 text-slate-600 dark:text-zinc-300">
                      <li>• <strong>ND = 10 (Muy Alto):</strong> Peligros determinantes muy probables o sin controles.</li>
                      <li>• <strong>ND = 6 (Alto):</strong> Peligros que dan lugar a consecuencias significativas.</li>
                      <li>• <strong>ND = 2 (Medio):</strong> Peligros con consecuencias de menor importancia.</li>
                    </ul>
                  </div>

                  <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-700/60 space-y-1.5 min-w-0">
                    <span className="font-extrabold text-teal-700 dark:text-teal-400 block">Nivel de Exposición (NE)</span>
                    <ul className="space-y-1 text-slate-600 dark:text-zinc-300">
                      <li>• <strong>NE = 4 (Continua):</strong> Sin interrupción durante la jornada.</li>
                      <li>• <strong>NE = 3 (Frecuente):</strong> Varias veces durante la jornada por tiempos cortos.</li>
                      <li>• <strong>NE = 2 (Ocasional):</strong> Alguna vez durante la jornada por periodo corto.</li>
                      <li>• <strong>NE = 1 (Esporádica):</strong> De manera eventual.</li>
                    </ul>
                  </div>

                  <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-700/60 space-y-1.5 min-w-0">
                    <span className="font-extrabold text-teal-700 dark:text-teal-400 block">Nivel de Consecuencia (NC)</span>
                    <ul className="space-y-1 text-slate-600 dark:text-zinc-300">
                      <li>• <strong>NC = 100 (Mortal):</strong> Muerte de 1 o más colaboradores.</li>
                      <li>• <strong>NC = 60 (Muy Grave):</strong> Lesiones o enfermedades graves (Invalidez).</li>
                      <li>• <strong>NC = 25 (Grave):</strong> Incapacidad laboral temporal (ILT).</li>
                      <li>• <strong>NC = 10 (Leve):</strong> Molestias sin incapacidad médica.</li>
                    </ul>
                  </div>

                  <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-700/60 space-y-1.5 min-w-0">
                    <span className="font-extrabold text-rose-600 dark:text-rose-400 block">Nivel de Riesgo (NR = NP × NC)</span>
                    <ul className="space-y-1 text-slate-600 dark:text-zinc-300">
                      <li>• <strong className="text-rose-600">Nivel I (4000 - 600):</strong> No Aceptable. Situación crítica, suspensión inmediata.</li>
                      <li>• <strong className="text-amber-600">Nivel II (500 - 150):</strong> Control específico. Intervención urgente.</li>
                      <li>• <strong className="text-yellow-600">Nivel III (120 - 40):</strong> Mejorable. Rentabilidad preventiva.</li>
                      <li>• <strong className="text-emerald-600">Nivel IV (20):</strong> Aceptable. Mantener medidas actuales.</li>
                    </ul>
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
