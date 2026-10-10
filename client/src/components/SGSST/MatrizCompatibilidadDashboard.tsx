/**
 * MatrizCompatibilidadDashboard.tsx
 * Dashboard analítico y pedagógico de la Matriz de Compatibilidad Química (SGA)
 * Cimiento Legal: Decreto 1496 de 2018, Resolución 773 de 2021 y NTC 3966
 */
import React, { useState, useMemo, useEffect } from 'react';
import {
  BarChart3,
  PieChart,
  Target,
  HelpCircle,
  TrendingUp,
  Shield,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Info,
  Sparkles,
  Loader2,
  ChevronDown,
  ChevronUp,
  Calculator,
  Scale,
  FlaskConical,
  Filter,
  Layers,
  FileSpreadsheet,
  AlertCircle,
  Grid3X3
} from 'lucide-react';
import { MatrixRow, getChemicalCompatibility , CLASES_ONU } from './MatrizCompatibilidadConstants';
import cn from '~/utils/cn';

interface DashboardProps {
  matrixRows: MatrixRow[];
  conversationId: string | null;
  token: string | null;
  savedConclusions: Record<string, string>;
  onConclusionSaved: (type: string, text: string) => void;
  isMaximized: boolean;
}

export default function MatrizCompatibilidadDashboard({
  matrixRows,
  conversationId,
  token,
  savedConclusions,
  onConclusionSaved,
  isMaximized
}: DashboardProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'cruces' | 'metodologia' | 'matriz_guia'>('dashboard');
  const [conclusions, setConclusions] = useState<Record<string, string>>(savedConclusions);
  const [loadingConclusion, setLoadingConclusion] = useState<string | null>(null);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | 'incompatible' | 'caution' | 'compatible'>('all');
  const [expandedCrossId, setExpandedCrossId] = useState<string | null>(null);

  useEffect(() => {
    setConclusions(savedConclusions);
  }, [savedConclusions]);

  // ── 1. Métricas Principales ──
  const totalProducts = matrixRows.length;

  const { fdsCount, rotuloCount } = useMemo(() => {
    let fds = 0;
    let rot = 0;
    matrixRows.forEach(r => {
      if (String(r.tiene_fds || '').toLowerCase().includes('sí') || String(r.tiene_fds || '').toLowerCase().includes('si')) fds++;
      if (String(r.tiene_rotulo || '').toLowerCase().includes('sí') || String(r.tiene_rotulo || '').toLowerCase().includes('si')) rot++;
    });
    return { fdsCount: fds, rotuloCount: rot };
  }, [matrixRows]);

  const fdsCompliancePct = totalProducts > 0 ? Math.round((fdsCount / totalProducts) * 100) : 0;
  const labelCompliancePct = totalProducts > 0 ? Math.round((rotuloCount / totalProducts) * 100) : 0;

  // ── 2. Cálculo Exhaustivo de Cruces (N x N) ──
  const { allPairs, compatibilityStats } = useMemo(() => {
    const pairs: any[] = [];
    let compatible = 0;
    let caution = 0;
    let incompatible = 0;

    for (let i = 0; i < totalProducts; i++) {
      for (let j = i + 1; j < totalProducts; j++) {
        const prodA = matrixRows[i];
        const prodB = matrixRows[j];
        const res = getChemicalCompatibility(prodA.clasificacion_onu, prodB.clasificacion_onu);

        if (res.status === 'incompatible') incompatible++;
        else if (res.status === 'caution') caution++;
        else compatible++;

        pairs.push({
          id: `${prodA.id || i}-${prodB.id || j}`,
          prodA,
          prodB,
          status: res.status,
          label: res.label,
          notes: res.notes,
          segregationRule: res.status === 'incompatible' 
            ? 'Separación física obligatoria mínima de 3 metros o almacenamiento en armarios de seguridad independientes (NTC 3966).'
            : res.status === 'caution'
            ? 'Verificar sección 10 de la Ficha de Datos de Seguridad de ambos productos antes de almacenar en la misma estantería.'
            : 'Almacenamiento conjunto permitido en la misma área o cubeto sin incompatibilidad directa.'
        });
      }
    }

    return {
      allPairs: pairs,
      compatibilityStats: {
        compatible,
        caution,
        incompatible,
        totalPairs: pairs.length
      }
    };
  }, [matrixRows, totalProducts]);

  // ── 3. Distribución por Clases de Peligro ONU ──
  const classDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    matrixRows.forEach(r => {
      const cls = r.clasificacion_onu || 'No Peligroso';
      counts[cls] = (counts[cls] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({
        name,
        count,
        pct: totalProducts > 0 ? Math.round((count / totalProducts) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count);
  }, [matrixRows, totalProducts]);

  const maxClassCount = useMemo(() => {
    return Math.max(...classDistribution.map(d => d.count), 1);
  }, [classDistribution]);

  const getClassColor = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('inflam')) return { hex: '#ef4444', bg: 'bg-red-500', text: 'text-red-600', light: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300' };
    if (n.includes('corrosiv')) return { hex: '#3b82f6', bg: 'bg-blue-500', text: 'text-blue-600', light: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300' };
    if (n.includes('toxic') || n.includes('tóxic')) return { hex: '#a855f7', bg: 'bg-purple-500', text: 'text-purple-600', light: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300' };
    if (n.includes('combur') || n.includes('oxidan')) return { hex: '#f59e0b', bg: 'bg-amber-500', text: 'text-amber-600', light: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' };
    if (n.includes('gas')) return { hex: '#10b981', bg: 'bg-emerald-500', text: 'text-emerald-600', light: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' };
    return { hex: '#64748b', bg: 'bg-slate-500', text: 'text-slate-600', light: 'bg-slate-50 text-slate-700 dark:bg-slate-900/40 dark:text-slate-300' };
  };

  // ── 4. Conclusiones con IA ──
  const generateConclusion = async (chartType: string, chartStats: any) => {
    if (!conversationId) return;
    try {
      setLoadingConclusion(chartType);
      const res = await fetch('/api/sgsst/chemical-compatibility/ai-chart-conclusion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          conversationId,
          chartType,
          matrixRows,
          chartStats
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.conclusion) {
          setConclusions(prev => ({ ...prev, [chartType]: data.conclusion }));
          onConclusionSaved(chartType, data.conclusion);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingConclusion(null);
    }
  };

  const handleManualConclusionChange = (chartType: string, text: string) => {
    setConclusions(prev => ({ ...prev, [chartType]: text }));
    onConclusionSaved(chartType, text);
  };

  const filteredPairs = useMemo(() => {
    if (selectedStatusFilter === 'all') return allPairs;
    return allPairs.filter(p => p.status === selectedStatusFilter);
  }, [allPairs, selectedStatusFilter]);

  if (matrixRows.length === 0) return null;

  return (
    <div className="w-full max-w-full min-w-0 overflow-hidden rounded-3xl border border-teal-500/30 bg-surface-secondary shadow-md transition-all duration-300 my-4 sm:my-6">
      
      {/* ── HEADER PRINCIPAL CON BOTONERA CÁPSULA WAPPY ADAPTATIVA ── */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between p-4 sm:px-6 sm:py-5 border-b border-border-light gap-3.5 bg-surface-tertiary/60 w-full min-w-0">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-600 to-amber-500 text-white flex items-center justify-center shadow-md shadow-teal-500/20 shrink-0">
            <FlaskConical size={20} className="stroke-[2.2]" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm sm:text-base md:text-lg font-bold text-slate-900 dark:text-zinc-100 leading-tight flex items-center gap-2 flex-wrap">
              <span className="truncate">Matriz de Compatibilidad Química</span>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300 border border-teal-300/40 shrink-0">
                SGA • Dec. 1496/18
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400 font-normal truncate mt-0.5">
              Reglas de almacenamiento seguro, segregación física y prevención de reacciones exotérmicas
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
              onClick={() => setActiveTab('cruces')}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer",
                activeTab === 'cruces'
                  ? "bg-teal-600 text-white shadow-xs font-black"
                  : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100"
              )}
            >
              <Target className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cruces Incompatibles ({compatibilityStats.incompatible})</span>
              <span className="sm:hidden">Incompatibles ({compatibilityStats.incompatible})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('matriz_guia')}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer",
                activeTab === 'matriz_guia'
                  ? "bg-teal-600 text-white shadow-xs font-black"
                  : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100"
              )}
            >
              <Grid3X3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Matriz NTC 3966</span>
              <span className="sm:hidden">Matriz</span>
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
              <span className="hidden md:inline">¿Cómo se evalúa la compatibilidad?</span>
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
              <FlaskConical className="w-3.5 h-3.5 text-teal-600 shrink-0" /> <span className="truncate">Químicos en Bodega</span>
            </span>
            <div className="mt-2 flex items-baseline gap-1.5 flex-wrap">
              <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-zinc-100">
                {totalProducts}
              </span>
              <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-zinc-400 font-medium truncate">
                sustancias registradas
              </span>
            </div>
          </div>

          <div className="p-3 sm:p-3.5 rounded-2xl border border-rose-200/80 dark:border-rose-800/60 bg-rose-50/50 dark:bg-rose-950/20 shadow-xs flex flex-col justify-between min-w-0">
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 dark:text-rose-400 flex items-center gap-1.5 truncate">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0" /> <span className="truncate">Incompatibles (Rojo)</span>
            </span>
            <div className="mt-2 flex items-baseline justify-between gap-1 flex-wrap">
              <span className="text-xl sm:text-2xl font-black text-rose-900 dark:text-rose-200">
                {compatibilityStats.incompatible}
              </span>
              <span className="text-[10px] sm:text-[11px] text-rose-700 dark:text-rose-300 font-bold truncate">
                segregación obligatoria
              </span>
            </div>
          </div>

          <div className="p-3 sm:p-3.5 rounded-2xl border border-emerald-200/80 dark:border-emerald-800/60 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-xs flex flex-col justify-between min-w-0">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 truncate">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> <span className="truncate">FDS 16 Secciones</span>
            </span>
            <div className="mt-2 flex items-baseline gap-1.5 flex-wrap">
              <span className="text-xl sm:text-2xl font-black text-emerald-900 dark:text-emerald-200">
                {fdsCompliancePct}%
              </span>
              <span className="text-[10px] sm:text-[11px] text-emerald-700 dark:text-emerald-300 font-bold truncate">
                {fdsCount} de {totalProducts}
              </span>
            </div>
          </div>

          <div className="p-3 sm:p-3.5 rounded-2xl border border-purple-200/80 dark:border-purple-800/60 bg-purple-50/50 dark:bg-purple-950/20 shadow-xs flex flex-col justify-between min-w-0">
            <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 dark:text-purple-400 flex items-center gap-1.5 truncate">
              <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 shrink-0" /> <span className="truncate">Rotulado Conforme</span>
            </span>
            <div className="mt-2 flex items-baseline justify-between gap-1 flex-wrap">
              <span className="text-xl sm:text-2xl font-black text-purple-900 dark:text-purple-200">
                {labelCompliancePct}%
              </span>
              <span className="text-[10px] sm:text-[11px] text-purple-700 dark:text-purple-300 font-medium truncate">
                etiquetas y SGA
              </span>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            TAB 1: GRÁFICAS & MÉTRICAS
        ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            
            {/* Fila 1: Donut SVG de Clases ONU + Semáforo de Cruces Químicos */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 w-full min-w-0">
              
              {/* Donut SVG de Clases ONU (5 cols) */}
              <div className="xl:col-span-5 p-4 sm:p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-xs flex flex-col justify-between w-full min-w-0">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-xs text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                      <PieChart className="w-4 h-4 text-teal-600" />
                      Distribución por Clases ONU / SGA
                    </h3>
                    <span className="text-[10px] font-bold text-slate-400">Total: {totalProducts}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">
                    Clasificación de mercancías y sustancias químicas en bodega.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-5 my-4">
                  <div className="relative w-36 h-36 shrink-0">
                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90 transform">
                      {(() => {
                        let accumulatedPct = 0;
                        return classDistribution.map((item, idx) => {
                          const strokeDasharray = `${item.pct} ${100 - item.pct}`;
                          const strokeDashoffset = -accumulatedPct;
                          accumulatedPct += item.pct;
                          const colorObj = getClassColor(item.name);
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
                        {totalProducts}
                      </span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                        Químicos
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5 w-full max-w-[200px]">
                    {classDistribution.slice(0, 5).map((item, idx) => {
                      const colorObj = getClassColor(item.name);
                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-[11px] p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${colorObj.bg}`} />
                            <span className="font-semibold text-slate-700 dark:text-zinc-300 truncate" title={item.name}>
                              {item.name}
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

                <div className="p-2.5 rounded-2xl bg-teal-50/60 dark:bg-teal-950/20 border border-teal-200/60 text-[11px] text-teal-800 dark:text-teal-300">
                  ⚠️ Cada clase de mercancía peligrosa requiere protocolos de extinción específicos.
                </div>
              </div>

              {/* Semáforo de Cruces de Compatibilidad (7 cols) */}
              <div className="xl:col-span-7 p-4 sm:p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-xs flex flex-col justify-between w-full min-w-0">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-xs text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-amber-600" />
                      Semáforo de Compatibilidad y Segregación
                    </h3>
                    <span className="text-[10px] font-bold text-teal-600 px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/50">
                      Cruces N × N
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">
                    Evaluación binaria de almacenamiento conjunto según la NTC 3966.
                  </p>
                </div>

                {totalProducts <= 1 ? (
                  <div className="p-8 text-center text-slate-400 italic">
                    Registra 2 o más sustancias químicas para calcular los cruces de almacenamiento conjunto.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4">
                    
                    <button
                      type="button"
                      onClick={() => { setSelectedStatusFilter('compatible'); setActiveTab('cruces'); }}
                      className="p-3.5 rounded-2xl border border-emerald-300/40 bg-emerald-50/50 dark:bg-emerald-950/20 hover:bg-emerald-100/40 transition-all text-left cursor-pointer"
                    >
                      <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400">
                        <span className="text-[10px] font-black uppercase">Compatibles</span>
                        <div className="w-3 h-3 rounded-full bg-emerald-500" />
                      </div>
                      <div className="mt-2">
                        <span className="text-2xl font-black text-emerald-900 dark:text-emerald-200">
                          {compatibilityStats.compatible}
                        </span>
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-300 mt-0.5 font-medium">
                          Almacenamiento conjunto permitido
                        </p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => { setSelectedStatusFilter('caution'); setActiveTab('cruces'); }}
                      className="p-3.5 rounded-2xl border border-amber-300/40 bg-amber-50/50 dark:bg-amber-950/20 hover:bg-amber-100/40 transition-all text-left cursor-pointer"
                    >
                      <div className="flex items-center justify-between text-amber-700 dark:text-amber-400">
                        <span className="text-[10px] font-black uppercase">Precaución</span>
                        <div className="w-3 h-3 rounded-full bg-amber-500" />
                      </div>
                      <div className="mt-2">
                        <span className="text-2xl font-black text-amber-900 dark:text-amber-200">
                          {compatibilityStats.caution}
                        </span>
                        <p className="text-[10px] text-amber-600 dark:text-amber-300 mt-0.5 font-medium">
                          Revisar incompatibilidades en FDS
                        </p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => { setSelectedStatusFilter('incompatible'); setActiveTab('cruces'); }}
                      className="p-3.5 rounded-2xl border border-rose-300/40 bg-rose-50/50 dark:bg-rose-950/20 hover:bg-rose-100/40 transition-all text-left cursor-pointer"
                    >
                      <div className="flex items-center justify-between text-rose-700 dark:text-rose-400">
                        <span className="text-[10px] font-black uppercase">Incompatibles</span>
                        <div className="w-3 h-3 rounded-full bg-rose-500" />
                      </div>
                      <div className="mt-2">
                        <span className="text-2xl font-black text-rose-900 dark:text-rose-200">
                          {compatibilityStats.incompatible}
                        </span>
                        <p className="text-[10px] text-rose-600 dark:text-rose-300 mt-0.5 font-bold">
                          Segregar mín. 3m o cubeto indep.
                        </p>
                      </div>
                    </button>

                  </div>
                )}

                <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/60 text-[11px] text-slate-600 dark:text-zinc-300">
                  🧪 Total de cruces binarios calculados: <strong>{compatibilityStats.totalPairs}</strong> pares analizados.
                </div>
              </div>

            </div>

            {/* Fila 2: Cajas de Conclusiones IA */}
            <div className={`grid gap-5 w-full min-w-0 ${isMaximized ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1'}`}>
              
              {/* Conclusión IA 1: Clases ONU */}
              <div className="p-5 bg-surface-secondary rounded-3xl border border-border-medium shadow-sm">
                <div className="flex items-center justify-between border-b border-border-light pb-2">
                  <h4 className="text-xs font-bold text-text-primary uppercase tracking-widest flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-teal-600" />
                    Análisis Técnico IA - Clases de Peligro Químico
                  </h4>
                  <button
                    onClick={() => generateConclusion('clases_onu', { totalProducts, classDistribution })}
                    disabled={loadingConclusion === 'clases_onu' || !totalProducts}
                    className="flex items-center gap-1 text-[11px] font-bold text-teal-600 hover:text-teal-700 disabled:opacity-50 cursor-pointer"
                  >
                    {loadingConclusion === 'clases_onu' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Generar'}
                  </button>
                </div>
                <textarea
                  className="mt-3 w-full text-xs text-text-primary bg-surface-primary border border-border-light rounded-xl p-3 resize-y min-h-[64px] outline-none focus:border-teal-400 transition-colors"
                  rows={3}
                  value={conclusions.clases_onu || ''}
                  onChange={(e) => handleManualConclusionChange('clases_onu', e.target.value)}
                  placeholder="El Especialista en Riesgo Químico evaluará las clases de peligro almacenadas..."
                />
              </div>

              {/* Conclusión IA 2: Cruces y Segregación */}
              <div className="p-5 bg-surface-secondary rounded-3xl border border-border-medium shadow-sm">
                <div className="flex items-center justify-between border-b border-border-light pb-2">
                  <h4 className="text-xs font-bold text-text-primary uppercase tracking-widest flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-rose-600" />
                    Análisis Técnico IA - Matriz de Incompatibilidad
                  </h4>
                  <button
                    onClick={() => generateConclusion('riesgo_compatibilidad', { totalProducts, compatibilityStats })}
                    disabled={loadingConclusion === 'riesgo_compatibilidad' || totalProducts <= 1}
                    className="flex items-center gap-1 text-[11px] font-bold text-teal-600 hover:text-teal-700 disabled:opacity-50 cursor-pointer"
                  >
                    {loadingConclusion === 'riesgo_compatibilidad' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Generar'}
                  </button>
                </div>
                <textarea
                  className="mt-3 w-full text-xs text-text-primary bg-surface-primary border border-border-light rounded-xl p-3 resize-y min-h-[64px] outline-none focus:border-teal-400 transition-colors"
                  rows={3}
                  value={conclusions.riesgo_compatibilidad || ''}
                  onChange={(e) => handleManualConclusionChange('riesgo_compatibilidad', e.target.value)}
                  placeholder="El Especialista en Riesgo Químico evaluará las incompatibilidades y segregaciones..."
                />
              </div>

            </div>

          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            TAB 2: CRUCES INCOMPATIBLES PRIORIZADOS
        ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'cruces' && (
          <div className="space-y-4">
            
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-2xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-xs text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <Filter size={13} className="text-teal-600" />
                  Mostrando {filteredPairs.length} de {allPairs.length} cruces calculados
                </span>
                {selectedStatusFilter !== 'all' && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 dark:bg-zinc-800 dark:text-zinc-200">
                    Filtro: {selectedStatusFilter}
                    <button type="button" onClick={() => setSelectedStatusFilter('all')} className="hover:text-red-600 cursor-pointer ml-1">✕</button>
                  </span>
                )}
              </div>

              <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-surface-primary border border-border-medium text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setSelectedStatusFilter('incompatible')}
                  className={cn(
                    "px-2 py-1 rounded-lg transition-all",
                    selectedStatusFilter === 'incompatible' ? "bg-rose-500 text-white font-bold" : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  Incompatibles ({compatibilityStats.incompatible})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedStatusFilter('caution')}
                  className={cn(
                    "px-2 py-1 rounded-lg transition-all",
                    selectedStatusFilter === 'caution' ? "bg-amber-500 text-white font-bold" : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  Precaución ({compatibilityStats.caution})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedStatusFilter('all')}
                  className={cn(
                    "px-2 py-1 rounded-lg transition-all",
                    selectedStatusFilter === 'all' ? "bg-slate-200 dark:bg-zinc-700 text-slate-900 dark:text-white" : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  Todos ({allPairs.length})
                </button>
              </div>
            </div>

            {filteredPairs.length === 0 ? (
              <div className="p-8 text-center text-slate-400 bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200/80 dark:border-zinc-800 shadow-2xs">
                {selectedStatusFilter === 'incompatible' 
                  ? '🎉 ¡Excelente! No se identificaron cruces incompatibles en el inventario actual.'
                  : 'No se encontraron cruces con el filtro seleccionado.'}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredPairs.map((pair, idx) => {
                  const isIncompatible = pair.status === 'incompatible';
                  const isCaution = pair.status === 'caution';
                  const isExpanded = expandedCrossId === pair.id;

                  return (
                    <div
                      key={pair.id || idx}
                      className={cn(
                        "p-4 rounded-2xl bg-white dark:bg-zinc-900 border shadow-2xs space-y-3 transition-all",
                        isIncompatible ? "border-rose-400/50 hover:border-rose-500" : isCaution ? "border-amber-400/50 hover:border-amber-500" : "border-slate-200/80 dark:border-zinc-800"
                      )}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400">
                            CRUCE #{idx + 1}
                          </span>
                          <span className="text-xs font-bold text-slate-900 dark:text-zinc-100">
                            {pair.prodA.nombre_comercial} <span className="text-slate-400 font-normal">vs</span> {pair.prodB.nombre_comercial}
                          </span>
                        </div>

                        <span className={cn(
                          "text-[10px] font-black uppercase px-2.5 py-1 rounded-xl text-white shadow-2xs",
                          isIncompatible ? "bg-rose-500" : isCaution ? "bg-amber-500" : "bg-emerald-500"
                        )}>
                          {pair.label}
                        </span>
                      </div>

                      {/* Cinta de Regla de Segregación */}
                      <div className={cn(
                        "p-2.5 rounded-xl border flex flex-wrap items-center justify-between text-[11px] gap-2",
                        isIncompatible ? "bg-rose-50/60 dark:bg-rose-950/20 border-rose-200/60 text-rose-800 dark:text-rose-300" : "bg-slate-50 dark:bg-zinc-800/60 border-slate-200/60 text-slate-700 dark:text-zinc-300"
                      )}>
                        <div className="flex items-center gap-2">
                          <ShieldAlert size={14} className={isIncompatible ? "text-rose-600" : "text-amber-600"} />
                          <span className="font-semibold">{pair.segregationRule}</span>
                        </div>
                      </div>

                      {/* Detalle de Sustancias y Clases */}
                      <div className="text-[11px] grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div className="p-2 rounded-xl bg-surface-primary border border-border-light">
                          <span className="text-[9px] font-bold uppercase text-slate-400 block">Sustancia A:</span>
                          <p className="font-bold text-slate-900 dark:text-zinc-100">{pair.prodA.nombre_comercial}</p>
                          <p className="text-[10px] text-slate-500">{pair.prodA.clasificacion_onu || 'Clase no definida'} • ONU {pair.prodA.numero_onu || 'N/A'}</p>
                        </div>
                        <div className="p-2 rounded-xl bg-surface-primary border border-border-light">
                          <span className="text-[9px] font-bold uppercase text-slate-400 block">Sustancia B:</span>
                          <p className="font-bold text-slate-900 dark:text-zinc-100">{pair.prodB.nombre_comercial}</p>
                          <p className="text-[10px] text-slate-500">{pair.prodB.clasificacion_onu || 'Clase no definida'} • ONU {pair.prodB.numero_onu || 'N/A'}</p>
                        </div>
                      </div>

                      {/* Acordeón de Notas Técnicas */}
                      <div>
                        <button
                          type="button"
                          onClick={() => setExpandedCrossId(isExpanded ? null : pair.id)}
                          className="text-[11px] font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1 cursor-pointer"
                        >
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          <span>{isExpanded ? 'Ocultar justificación técnica' : '👁️ Ver justificación de compatibilidad y reactividad'}</span>
                        </button>

                        {isExpanded && (
                          <div className="mt-3 p-3.5 rounded-2xl bg-surface-secondary/70 border border-teal-500/20 space-y-2 text-[11px] animate-in fade-in duration-200">
                            <div>
                              <span className="text-[9px] font-bold uppercase text-slate-400 block">Riesgo Químico Binario:</span>
                              <p className="text-slate-800 dark:text-zinc-200 font-medium">
                                {pair.notes || 'Consulte las Fichas de Datos de Seguridad (Sección 10 Estabilidad y Reactividad) para descartar incompatibilidades específicas entre reactivos.'}
                              </p>
                            </div>
                            <div className="pt-2 border-t border-slate-200/60 dark:border-zinc-700/60">
                              <span className="text-[9px] font-black uppercase text-teal-700 dark:text-teal-400 block">
                                Requerimientos Físicos del Almacén (NTC 3966):
                              </span>
                              <p className="text-slate-600 dark:text-zinc-300">
                                Disponer de diques de contención individuales o cubetos estancos de capacidad igual al 110% del recipiente mayor, kit para control de derrames con absorbente inerte y ventilación natural o mecánica adecuada.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>
            )}

          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            TAB 3: EXPLICADOR DE METODOLOGÍA SGA Y CIMIENTO LEGAL
        ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'metodologia' && (
          <div className="space-y-6">
            
            <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-xs space-y-4">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                  <Scale className="w-4.5 h-4.5 text-teal-600" />
                  Metodología de Compatibilidad Química y Almacenamiento Seguro (SGA / NTC 3966)
                </h3>
                <p className="text-xs text-slate-600 dark:text-zinc-400 mt-1 leading-relaxed">
                  En Colombia, el <strong>Decreto 1496 de 2018</strong> y la <strong>Resolución 773 de 2021</strong> establecen la obligatoriedad del <strong>Sistema Globalmente Armonizado (SGA)</strong> en los lugares de trabajo. Para el almacenamiento seguro, se aplica la matriz de incompatibilidad de la <strong>NTC 3966</strong> y las Guías Técnicas de Almacenamiento Seguro:
                </p>
              </div>

              {/* Flujograma Visual en 4 Pasos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 pt-2 w-full min-w-0">
                
                <div className="p-4 rounded-2xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200/70 dark:border-teal-800/60 space-y-2 min-w-0">
                  <div className="w-7 h-7 rounded-xl bg-teal-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                    1
                  </div>
                  <h4 className="font-extrabold text-xs text-slate-900 dark:text-zinc-100">
                    Inventario & FDS (16s)
                  </h4>
                  <p className="text-[11px] text-slate-600 dark:text-zinc-300 leading-relaxed">
                    Identificación del 100% de productos químicos con Ficha de Datos de Seguridad completa en español (16 secciones) y rotulado visible (Res. 773/21).
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/70 dark:border-blue-800/60 space-y-2 min-w-0">
                  <div className="w-7 h-7 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                    2
                  </div>
                  <h4 className="font-extrabold text-xs text-slate-900 dark:text-zinc-100">
                    Clasificación ONU / SGA
                  </h4>
                  <p className="text-[11px] text-slate-600 dark:text-zinc-300 leading-relaxed">
                    Asignación de la Clase de Peligro principal (1 a 9) y peligros secundarios según el Libro Naranja de la ONU y el SGA Rev. 6/7.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-800/60 space-y-2 min-w-0">
                  <div className="w-7 h-7 rounded-xl bg-amber-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                    3
                  </div>
                  <h4 className="font-extrabold text-xs text-slate-900 dark:text-zinc-100">
                    Cruce Binario (NTC 3966)
                  </h4>
                  <p className="text-[11px] text-slate-600 dark:text-zinc-300 leading-relaxed">
                    Evaluación cruzada de reactividad (Ácidos vs Bases, Inflamables vs Oxidantes). Determinación de colores del semáforo: Verde, Amarillo y Rojo.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-800/60 space-y-2 min-w-0">
                  <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                    4
                  </div>
                  <h4 className="font-extrabold text-xs text-slate-900 dark:text-zinc-100">
                    Segregación & Contención
                  </h4>
                  <p className="text-[11px] text-slate-600 dark:text-zinc-300 leading-relaxed">
                    Separación física mínima de 3 metros para incompatibles, cubetos de retención estancos y kits absorbentes neutralizantes.
                  </p>
                </div>

              </div>

              {/* Tabla de Reglas de Almacenamiento Conjunto */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200/80 dark:border-zinc-700/80 space-y-3 w-full min-w-0">
                <h4 className="font-bold text-xs text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                  <Calculator size={14} className="text-teal-600" />
                  Reglas de Almacenamiento Conjunto (NTC 3966)
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px] w-full min-w-0">
                  <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-emerald-200/60 dark:border-emerald-900/60 space-y-1.5">
                    <span className="font-extrabold text-emerald-700 dark:text-emerald-400 block">🟢 Verde: Compatible</span>
                    <p className="text-slate-600 dark:text-zinc-300">
                      Sustancias que no reaccionan peligrosamente entre sí. Pueden almacenarse juntas en la misma estantería o cubeto de retención general.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-amber-200/60 dark:border-amber-900/60 space-y-1.5">
                    <span className="font-extrabold text-amber-700 dark:text-amber-400 block">🟡 Amarillo: Precaución</span>
                    <p className="text-slate-600 dark:text-zinc-300">
                      Verificar Sección 10 de la FDS. Pueden almacenarse juntas solo si se evalúa la no reactividad en estado líquido o se usan compartimientos intermedios.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-rose-200/60 dark:border-rose-900/60 space-y-1.5">
                    <span className="font-extrabold text-rose-700 dark:text-rose-400 block">🔴 Rojo: Incompatible / Segregar</span>
                    <p className="text-slate-600 dark:text-zinc-300">
                      Reacción violenta, emanación de gases tóxicos o incendio espontáneo. <strong>Obligatoria distancia física mínima de 3 metros, muro cortafuego o almacenamiento en armarios ignífugos separados.</strong>
                    </p>
                  </div>
                </div>

              </div>

            </div>

          </div>
        )}


        {/* ════════════════════════════════════════════════════════════════════
            TAB 4: MATRIZ GUÍA DE ALMACENAMIENTO QUÍMICO MIXTO
        ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'matriz_guia' && (
          <div className="space-y-6">
            <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-xs space-y-4">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                  <Grid3X3 className="w-4.5 h-4.5 text-teal-600" />
                  Matriz Guía de Almacenamiento Químico Mixto
                </h3>
                <p className="text-xs text-slate-600 dark:text-zinc-400 mt-1 leading-relaxed">
                  Basada en la metodología SURA / NTC 3966. Cruce de Clases ONU para determinar las reglas de segregación en bodegas y armarios.
                </p>
              </div>

              <div className="w-full overflow-x-auto scrollbar-thin">
                <div className="min-w-[800px] w-full text-[10px]">
                  {/* Header Row */}
                  <div className="flex font-black text-[9px] uppercase tracking-tighter text-slate-500 border-b-2 border-slate-300 dark:border-zinc-700">
                    <div className="w-32 sm:w-40 p-2 shrink-0 border-r border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50">
                      Clase ONU
                    </div>
                    {CLASES_ONU.filter(c => c !== 'No Peligroso').map((cls) => {
                      const classNum = cls.split(':')[0].replace('Clase ', '');
                      return (
                        <div key={cls} className="flex-1 p-2 text-center border-r border-slate-200 dark:border-zinc-800 break-words" title={cls}>
                          {classNum}
                        </div>
                      );
                    })}
                  </div>

                  {/* Body Rows */}
                  {CLASES_ONU.filter(c => c !== 'No Peligroso').map((clsY) => {
                    const classNumY = clsY.split(':')[0].replace('Clase ', '');
                    return (
                      <div key={clsY} className="flex border-b border-slate-200 dark:border-zinc-800 hover:bg-slate-50/50 dark:hover:bg-zinc-800/20 transition-colors">
                        <div className="w-32 sm:w-40 p-2 shrink-0 border-r border-slate-200 dark:border-zinc-800 text-[10px] sm:text-[11px] font-bold text-slate-700 dark:text-zinc-300 bg-slate-50/50 dark:bg-zinc-900/30 truncate" title={clsY}>
                          {clsY}
                        </div>
                        {CLASES_ONU.filter(c => c !== 'No Peligroso').map((clsX) => {
                          const compat = getChemicalCompatibility(clsY, clsX);
                          let bg = 'bg-slate-100';
                          let title = compat.reason;
                          let text = '';
                          
                          if (compat.status === 'compatible') {
                            bg = 'bg-emerald-500 hover:bg-emerald-400';
                          } else if (compat.status === 'caution') {
                            bg = 'bg-yellow-400 hover:bg-yellow-300';
                          } else if (compat.status === 'incompatible') {
                            bg = 'bg-red-500 hover:bg-red-400';
                          }

                          return (
                            <div key={clsX} className={`flex-1 p-1 border-r border-slate-200 dark:border-zinc-800 flex items-center justify-center cursor-pointer transition-colors ${bg} border-b-0`} title={`${clsY} vs ${clsX}

${compat.reason}`}>
                              <span className="opacity-0">.</span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between text-[10px] font-bold text-slate-600 dark:text-zinc-400 pt-2 border-t border-slate-100 dark:border-zinc-800 gap-3">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-500 shrink-0" /> Pueden almacenarse juntos (Verificar FDS)</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-yellow-400 shrink-0" /> Precaución (Revisar incompatibilidades individuales)</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-500 shrink-0" /> Incompatibles (Separación física requerida)</span>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>

  );
}
