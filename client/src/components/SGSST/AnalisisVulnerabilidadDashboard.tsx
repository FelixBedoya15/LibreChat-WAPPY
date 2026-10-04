/**
 * AnalisisVulnerabilidadDashboard.tsx
 * Dashboard analítico y pedagógico del Análisis de Vulnerabilidad y Diamante de Riesgo
 * Cimiento Legal: Decreto 1072 de 2015 (Art. 2.2.4.6.25), Ley 1523 de 2012 y Guía IDIGER
 */
import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  PieChart,
  Target,
  HelpCircle,
  TrendingUp,
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Users,
  Building2,
  Layers,
  Scale,
  Calculator,
  Filter,
  Activity,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react';
import cn from '~/utils/cn';

interface ThreatItem {
  id: string;
  origen: string;
  amenaza: string;
  calificacionAmenaza: 'Posible' | 'Probable' | 'Inminente' | string;
  colorAmenaza?: string;
  personas?: Record<string, number>;
  recursos?: Record<string, number>;
  sistemas?: Record<string, number>;
  puntajePersonas?: number;
  puntajeRecursos?: number;
  puntajeSistemas?: number;
  riskLevel?: 'ALTO' | 'MEDIO' | 'BAJO' | string;
}

interface DashboardProps {
  amenazasList: ThreatItem[];
  calculateThreatGraphics: (threat: any) => {
    colorAmenaza: string;
    ptsPers: number;
    colorPers: string;
    ptsRec: number;
    colorRec: string;
    ptsSist: number;
    colorSist: string;
    riskLevel: string;
    colorConsolidado: string;
  };
}

export default function AnalisisVulnerabilidadDashboard({
  amenazasList,
  calculateThreatGraphics
}: DashboardProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'diamantes' | 'metodologia'>('dashboard');
  const [selectedRiskFilter, setSelectedRiskFilter] = useState<'all' | 'ALTO' | 'MEDIO' | 'BAJO'>('all');
  const [expandedThreatId, setExpandedThreatId] = useState<string | null>(null);

  const totalAmenazas = amenazasList.length;

  // ── 1. Métricas Principales ──
  const stats = useMemo(() => {
    let altos = 0;
    let medios = 0;
    let bajos = 0;

    let sumPers = 0;
    let sumRec = 0;
    let sumSist = 0;

    const origenMap: Record<string, number> = {
      Natural: 0,
      Tecnológico: 0,
      Social: 0
    };

    amenazasList.forEach(item => {
      const calc = calculateThreatGraphics(item);
      if (calc.riskLevel === 'ALTO') altos++;
      else if (calc.riskLevel === 'MEDIO') medios++;
      else bajos++;

      sumPers += calc.ptsPers;
      sumRec += calc.ptsRec;
      sumSist += calc.ptsSist;

      const orig = (item.origen || '').toLowerCase();
      if (orig.includes('tecno') || orig.includes('incend')) origenMap['Tecnológico']++;
      else if (orig.includes('social') || orig.includes('robo')) origenMap['Social']++;
      else origenMap['Natural']++;
    });

    const rankingOrigenes = Object.entries(origenMap)
      .map(([origen, count]) => ({
        origen,
        count,
        pct: totalAmenazas > 0 ? Math.round((count / totalAmenazas) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count);

    const origenPredominante = rankingOrigenes[0] || { origen: 'Sin clasificar', count: 0, pct: 0 };
    const pctAlto = totalAmenazas > 0 ? Math.round((altos / totalAmenazas) * 100) : 0;

    const avgPers = totalAmenazas > 0 ? Math.round((sumPers / totalAmenazas) * 10) / 10 : 0;
    const avgRec = totalAmenazas > 0 ? Math.round((sumRec / totalAmenazas) * 10) / 10 : 0;
    const avgSist = totalAmenazas > 0 ? Math.round((sumSist / totalAmenazas) * 10) / 10 : 0;

    return {
      altos,
      medios,
      bajos,
      rankingOrigenes,
      origenPredominante,
      pctAlto,
      avgPers,
      avgRec,
      avgSist
    };
  }, [amenazasList, totalAmenazas, calculateThreatGraphics]);

  const getOrigenColor = (origen: string) => {
    const o = origen.toLowerCase();
    if (o.includes('tecno')) return { hex: '#ef4444', bg: 'bg-red-500', text: 'text-red-600', light: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300' };
    if (o.includes('social')) return { hex: '#f59e0b', bg: 'bg-amber-500', text: 'text-amber-600', light: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' };
    return { hex: '#10b981', bg: 'bg-emerald-500', text: 'text-emerald-600', light: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' };
  };

  const filteredThreats = useMemo(() => {
    if (selectedRiskFilter === 'all') return amenazasList;
    return amenazasList.filter(a => {
      const calc = calculateThreatGraphics(a);
      return calc.riskLevel === selectedRiskFilter;
    });
  }, [amenazasList, selectedRiskFilter, calculateThreatGraphics]);

  if (amenazasList.length === 0) return null;

  return (
    <div className="w-full max-w-full min-w-0 overflow-hidden rounded-3xl border border-teal-500/30 bg-surface-secondary shadow-md transition-all duration-300 my-4 sm:my-6">
      
      {/* ── HEADER PRINCIPAL CON BOTONERA CÁPSULA WAPPY ADAPTATIVA ── */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between p-4 sm:px-6 sm:py-5 border-b border-border-light gap-3.5 bg-surface-tertiary/60 w-full min-w-0">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white flex items-center justify-center shadow-md shadow-teal-500/20 shrink-0">
            <Shield size={20} className="stroke-[2.2]" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm sm:text-base md:text-lg font-bold text-slate-900 dark:text-zinc-100 leading-tight flex items-center gap-2 flex-wrap">
              <span className="truncate">Análisis de Vulnerabilidad y Diamante de Riesgo</span>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300 border border-teal-300/40 shrink-0">
                Dec. 1072/15 Art. 2.2.4.6.25
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400 font-normal truncate mt-0.5">
              Metodología de Colores (IDIGER / UNGRD) ante amenazas naturales, tecnológicas y sociales
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
              onClick={() => setActiveTab('diamantes')}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer",
                activeTab === 'diamantes'
                  ? "bg-teal-600 text-white shadow-xs font-black"
                  : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100"
              )}
            >
              <Target className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Diamantes de Riesgo ({amenazasList.length})</span>
              <span className="sm:hidden">Diamantes ({amenazasList.length})</span>
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
              <span className="hidden md:inline">¿Cómo se evalúa la vulnerabilidad?</span>
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
              <Layers className="w-3.5 h-3.5 text-teal-600 shrink-0" /> <span className="truncate">Amenazas Evaluadas</span>
            </span>
            <div className="mt-2 flex items-baseline gap-1.5 flex-wrap">
              <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-zinc-100">
                {totalAmenazas}
              </span>
              <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-zinc-400 font-medium truncate">
                escenarios de riesgo
              </span>
            </div>
          </div>

          <div className="p-3 sm:p-3.5 rounded-2xl border border-rose-200/80 dark:border-rose-800/60 bg-rose-50/50 dark:bg-rose-950/20 shadow-xs flex flex-col justify-between min-w-0">
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 dark:text-rose-400 flex items-center gap-1.5 truncate">
              <Flame className="w-3.5 h-3.5 text-rose-600 shrink-0" /> <span className="truncate">Nivel Alto (Rojo)</span>
            </span>
            <div className="mt-2 flex items-baseline justify-between gap-1 flex-wrap">
              <span className="text-xl sm:text-2xl font-black text-rose-900 dark:text-rose-200">
                {stats.altos}
              </span>
              <span className="text-[10px] sm:text-[11px] text-rose-700 dark:text-rose-300 font-bold truncate">
                {stats.pctAlto}% alta prioridad
              </span>
            </div>
          </div>

          <div className="p-3 sm:p-3.5 rounded-2xl border border-teal-200/80 dark:border-teal-800/60 bg-teal-50/50 dark:bg-teal-950/20 shadow-xs flex flex-col justify-between min-w-0">
            <span className="text-[10px] font-black uppercase tracking-wider text-teal-700 dark:text-teal-400 flex items-center gap-1.5 truncate">
              <TrendingUp className="w-3.5 h-3.5 text-teal-600 shrink-0" /> <span className="truncate">Origen Predominante</span>
            </span>
            <div className="mt-2">
              <span className="text-base sm:text-lg font-black text-teal-900 dark:text-teal-200 block truncate">
                {stats.origenPredominante.origen}
              </span>
              <span className="text-[10px] sm:text-[11px] font-bold text-teal-700 dark:text-teal-300 truncate block">
                {stats.origenPredominante.pct}% de incidencia
              </span>
            </div>
          </div>

          <div className="p-3 sm:p-3.5 rounded-2xl border border-blue-200/80 dark:border-blue-800/60 bg-blue-50/50 dark:bg-blue-950/20 shadow-xs flex flex-col justify-between min-w-0">
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 dark:text-blue-400 flex items-center gap-1.5 truncate">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" /> <span className="truncate">Vulnerabilidad Global</span>
            </span>
            <div className="mt-2 flex items-baseline justify-between gap-1 flex-wrap">
              <span className="text-xl sm:text-2xl font-black text-blue-900 dark:text-blue-200">
                {Math.round(((stats.avgPers + stats.avgRec + stats.avgSist) / 3) * 10) / 10}
              </span>
              <span className="text-[10px] sm:text-[11px] text-blue-700 dark:text-blue-300 font-medium truncate">
                escala 0.0 - 3.0
              </span>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            TAB 1: GRÁFICAS & MÉTRICAS
        ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            
            {/* Fila 1: Donut SVG de Orígenes + Barras de Vulnerabilidad por Elemento */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 w-full min-w-0">
              
              {/* Donut SVG de Origen de Amenazas (5 cols) */}
              <div className="xl:col-span-5 p-4 sm:p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-xs flex flex-col justify-between w-full min-w-0">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-xs text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                      <PieChart className="w-4 h-4 text-teal-600" />
                      Distribución por Origen de Amenazas
                    </h3>
                    <span className="text-[10px] font-bold text-slate-400">Total: {totalAmenazas}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">
                    Amenazas clasificadas según la Metodología IDIGER.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-5 my-4">
                  <div className="relative w-36 h-36 shrink-0">
                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90 transform">
                      {(() => {
                        let accumulatedPct = 0;
                        return stats.rankingOrigenes.map((item, idx) => {
                          const strokeDasharray = `${item.pct} ${100 - item.pct}`;
                          const strokeDashoffset = -accumulatedPct;
                          accumulatedPct += item.pct;
                          const colorObj = getOrigenColor(item.origen);
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
                              className="transition-all duration-500 hover:opacity-80"
                            />
                          );
                        });
                      })()}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-xl font-black text-slate-900 dark:text-zinc-100 leading-none">
                        {totalAmenazas}
                      </span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                        Amenazas
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5 w-full max-w-[200px]">
                    {stats.rankingOrigenes.map((item, idx) => {
                      const colorObj = getOrigenColor(item.origen);
                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-[11px] p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${colorObj.bg}`} />
                            <span className="font-semibold text-slate-700 dark:text-zinc-300 truncate">
                              {item.origen}
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
                  🌪️ Naturales (Sismos/Lluvias), ⚡ Tecnológicas (Incendios/Fugas) y 👥 Sociales (Hurtos/Asonadas).
                </div>
              </div>

              {/* Matriz de Vulnerabilidad por Elemento (7 cols) */}
              <div className="xl:col-span-7 p-4 sm:p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-xs flex flex-col justify-between w-full min-w-0">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-xs text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-teal-600" />
                      Vulnerabilidad Media por Elemento (Escala 0.0 a 3.0)
                    </h3>
                    <span className="text-[10px] font-bold text-teal-600 px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/50">
                      3 Dimensiones
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">
                    0.0 a 1.0 = Verde (Baja) • 1.1 a 2.0 = Amarillo (Media) • 2.1 a 3.0 = Rojo (Alta).
                  </p>
                </div>

                <div className="space-y-4 my-4">
                  {/* Personas */}
                  <div>
                    <div className="flex items-center justify-between text-xs font-semibold mb-1 text-slate-700 dark:text-zinc-300">
                      <span className="flex items-center gap-1.5"><Users size={14} className="text-teal-600" /> En las Personas (Organización, Capacitación y Dotación)</span>
                      <span className="font-mono font-bold">{stats.avgPers} / 3.0</span>
                    </div>
                    <div className="h-3 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${Math.min(100, (stats.avgPers / 3.0) * 100)}%` }}
                        className={`h-full rounded-full transition-all duration-500 ${stats.avgPers > 2.0 ? 'bg-rose-500' : stats.avgPers > 1.0 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                      />
                    </div>
                  </div>

                  {/* Recursos */}
                  <div>
                    <div className="flex items-center justify-between text-xs font-semibold mb-1 text-slate-700 dark:text-zinc-300">
                      <span className="flex items-center gap-1.5"><Building2 size={14} className="text-blue-600" /> En los Recursos (Materiales, Equipos y Financiación)</span>
                      <span className="font-mono font-bold">{stats.avgRec} / 3.0</span>
                    </div>
                    <div className="h-3 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${Math.min(100, (stats.avgRec / 3.0) * 100)}%` }}
                        className={`h-full rounded-full transition-all duration-500 ${stats.avgRec > 2.0 ? 'bg-rose-500' : stats.avgRec > 1.0 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                      />
                    </div>
                  </div>

                  {/* Sistemas y Procesos */}
                  <div>
                    <div className="flex items-center justify-between text-xs font-semibold mb-1 text-slate-700 dark:text-zinc-300">
                      <span className="flex items-center gap-1.5"><Layers size={14} className="text-purple-600" /> En los Sistemas y Procesos (Continuidad y Servicios)</span>
                      <span className="font-mono font-bold">{stats.avgSist} / 3.0</span>
                    </div>
                    <div className="h-3 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${Math.min(100, (stats.avgSist / 3.0) * 100)}%` }}
                        className={`h-full rounded-full transition-all duration-500 ${stats.avgSist > 2.0 ? 'bg-rose-500' : stats.avgSist > 1.0 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 pt-2 border-t border-slate-100 dark:border-zinc-800">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> {stats.altos} Amenazas en Nivel ALTO</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> {stats.medios} en Nivel MEDIO</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> {stats.bajos} en Nivel BAJO</span>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            TAB 2: DIAMANTES DE RIESGO MULTI-AMENAZA
        ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'diamantes' && (
          <div className="space-y-4">
            
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-2xs">
              <span className="font-bold text-xs text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                <Filter size={13} className="text-teal-600" />
                Mostrando {filteredThreats.length} de {amenazasList.length} amenazas evaluadas
              </span>

              <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-surface-primary border border-border-medium text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setSelectedRiskFilter('ALTO')}
                  className={cn(
                    "px-2 py-1 rounded-lg transition-all",
                    selectedRiskFilter === 'ALTO' ? "bg-rose-500 text-white font-bold" : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  Nivel Alto ({stats.altos})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRiskFilter('MEDIO')}
                  className={cn(
                    "px-2 py-1 rounded-lg transition-all",
                    selectedRiskFilter === 'MEDIO' ? "bg-amber-500 text-white font-bold" : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  Nivel Medio ({stats.medios})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRiskFilter('BAJO')}
                  className={cn(
                    "px-2 py-1 rounded-lg transition-all",
                    selectedRiskFilter === 'BAJO' ? "bg-emerald-500 text-white font-bold" : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  Nivel Bajo ({stats.bajos})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRiskFilter('all')}
                  className={cn(
                    "px-2 py-1 rounded-lg transition-all",
                    selectedRiskFilter === 'all' ? "bg-slate-200 dark:bg-zinc-700 text-slate-900 dark:text-white" : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  Todas ({amenazasList.length})
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {filteredThreats.map((am, idx) => {
                const calc = calculateThreatGraphics(am);
                const isExpanded = expandedThreatId === am.id;
                const isAlto = calc.riskLevel === 'ALTO';
                const isMedio = calc.riskLevel === 'MEDIO';

                return (
                  <div
                    key={am.id || idx}
                    className={cn(
                      "p-4 rounded-2xl bg-white dark:bg-zinc-900 border shadow-2xs space-y-3 transition-all",
                      isAlto ? "border-rose-400/50 hover:border-rose-500" : isMedio ? "border-amber-400/50 hover:border-amber-500" : "border-emerald-400/40"
                    )}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400">
                          AMENAZA #{idx + 1}
                        </span>
                        <span className="text-xs font-black text-slate-900 dark:text-zinc-100">
                          {am.amenaza || 'Amenaza sin nombre'}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-50 text-slate-600 dark:bg-zinc-800 border border-slate-200/60">
                          Origen: {am.origen}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                          Amenaza: {am.calificacionAmenaza || 'Posible'}
                        </span>
                        <span className={cn(
                          "text-[10px] font-black uppercase px-2.5 py-1 rounded-xl text-white shadow-2xs",
                          isAlto ? "bg-rose-500" : isMedio ? "bg-amber-500" : "bg-emerald-500"
                        )}>
                          RIESGO {calc.riskLevel}
                        </span>
                      </div>
                    </div>

                    {/* Fila Central: Diamante de Riesgo SVG + Puntuaciones */}
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/60 flex flex-wrap items-center justify-between gap-4">
                      
                      {/* Mini Diamante SVG (4 Rombos) */}
                      <div className="flex items-center gap-3">
                        <div className="relative w-16 h-16 shrink-0">
                          <svg viewBox="0 0 100 100" className="w-full h-full">
                            {/* Rombo Izquierdo: Amenaza */}
                            <polygon points="10,50 30,30 50,50 30,70" fill={calc.colorAmenaza === 'ROJO' ? '#ef4444' : calc.colorAmenaza === 'AMARILLO' ? '#f59e0b' : '#10b981'} />
                            {/* Rombo Superior: Personas */}
                            <polygon points="50,10 70,30 50,50 30,30" fill={calc.colorPers === 'ROJO' ? '#ef4444' : calc.colorPers === 'AMARILLO' ? '#f59e0b' : '#10b981'} />
                            {/* Rombo Derecho: Recursos */}
                            <polygon points="90,50 70,30 50,50 70,70" fill={calc.colorRec === 'ROJO' ? '#ef4444' : calc.colorRec === 'AMARILLO' ? '#f59e0b' : '#10b981'} />
                            {/* Rombo Inferior: Sistemas */}
                            <polygon points="50,90 70,70 50,50 30,70" fill={calc.colorSist === 'ROJO' ? '#ef4444' : calc.colorSist === 'AMARILLO' ? '#f59e0b' : '#10b981'} />
                            {/* Círculo Central: Riesgo Consolidado */}
                            <circle cx="50" cy="50" r="12" fill={calc.colorConsolidado} stroke="#ffffff" strokeWidth="2" />
                          </svg>
                        </div>
                        <div>
                          <span className="text-[10px] font-black uppercase text-slate-500 block">Diamante de Riesgo:</span>
                          <span className="text-xs font-bold text-slate-900 dark:text-zinc-100">
                            Rombo Central: {calc.riskLevel}
                          </span>
                        </div>
                      </div>

                      {/* Cinta de Puntuaciones */}
                      <div className="flex items-center gap-3 text-[11px] font-mono flex-wrap">
                        <span className="p-1 px-2 rounded-lg bg-surface-primary border border-border-light">
                          <strong>Personas:</strong> {calc.ptsPers.toFixed(1)} / 3.0 ({calc.colorPers})
                        </span>
                        <span className="p-1 px-2 rounded-lg bg-surface-primary border border-border-light">
                          <strong>Recursos:</strong> {calc.ptsRec.toFixed(1)} / 3.0 ({calc.colorRec})
                        </span>
                        <span className="p-1 px-2 rounded-lg bg-surface-primary border border-border-light">
                          <strong>Sistemas:</strong> {calc.ptsSist.toFixed(1)} / 3.0 ({calc.colorSist})
                        </span>
                      </div>

                    </div>

                    {/* Botón Acordeón */}
                    <div>
                      <button
                        type="button"
                        onClick={() => setExpandedThreatId(isExpanded ? null : am.id)}
                        className="text-[11px] font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1 cursor-pointer"
                      >
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        <span>{isExpanded ? 'Ocultar recomendaciones técnicas' : '👁️ Ver recomendaciones del Plan de Emergencias (PONs)'}</span>
                      </button>

                      {isExpanded && (
                        <div className="mt-3 p-3.5 rounded-2xl bg-surface-secondary/70 border border-teal-500/20 space-y-2 text-[11px] animate-in fade-in duration-200">
                          <div>
                            <span className="text-[9px] font-black uppercase text-teal-700 dark:text-teal-400 block">
                              Acciones Inmediatas Exigibles (Dec. 1072/15 Art. 2.2.4.6.25):
                            </span>
                            <ul className="list-disc list-inside space-y-1 mt-1 text-slate-700 dark:text-zinc-300">
                              <li><strong>Capacitación de Brigada:</strong> Entrenamiento especializado en {am.amenaza} con simulacros periódicos documentados.</li>
                              <li><strong>Inspección de Recursos:</strong> Verificación operativa de botiquines, extintores, sistemas de alarma y rutas de evacuación.</li>
                              <li><strong>Continuidad de Operaciones:</strong> Respaldo de sistemas de energía, comunicaciones de emergencia y puntos de encuentro señalizados.</li>
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
            TAB 3: EXPLICADOR DE METODOLOGÍA IDIGER Y CIMIENTO LEGAL
        ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'metodologia' && (
          <div className="space-y-6">
            
            <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-xs space-y-4">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                  <Scale className="w-4.5 h-4.5 text-teal-600" />
                  Metodología de Análisis de Vulnerabilidad y Diamante de Colores (IDIGER / Dec. 1072/15)
                </h3>
                <p className="text-xs text-slate-600 dark:text-zinc-400 mt-1 leading-relaxed">
                  El <strong>Decreto 1072 de 2015 (Art. 2.2.4.6.25)</strong> exige a toda empresa formular e implementar un <strong>Plan de Prevención, Preparación y Respuesta ante Emergencias</strong> que incluya la identificación sistemática de amenazas y el análisis de vulnerabilidad de las sedes. En Colombia, el estándar oficial es la <strong>Metodología de Colores del IDIGER / UNGRD</strong>:
                </p>
              </div>

              {/* Flujograma Visual en 4 Pasos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 pt-2 w-full min-w-0">
                
                <div className="p-4 rounded-2xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200/70 dark:border-teal-800/60 space-y-2 min-w-0">
                  <div className="w-7 h-7 rounded-xl bg-teal-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                    1
                  </div>
                  <h4 className="font-extrabold text-xs text-slate-900 dark:text-zinc-100">
                    Identificación de Amenazas
                  </h4>
                  <p className="text-[11px] text-slate-600 dark:text-zinc-300 leading-relaxed">
                    Clasificación de eventos de origen Natural, Tecnológico o Social y calificación en: <strong>Posible (Verde)</strong>, <strong>Probable (Amarillo)</strong> o <strong>Inminente (Rojo)</strong>.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/70 dark:border-blue-800/60 space-y-2 min-w-0">
                  <div className="w-7 h-7 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                    2
                  </div>
                  <h4 className="font-extrabold text-xs text-slate-900 dark:text-zinc-100">
                    Calificación de 3 Elementos
                  </h4>
                  <p className="text-[11px] text-slate-600 dark:text-zinc-300 leading-relaxed">
                    Evaluación de cada pregunta en: <br />
                    • <strong>0.0 = Bueno / Existe</strong><br />
                    • <strong>0.5 = Parcial / Regular</strong><br />
                    • <strong>1.0 = Malo / No existe</strong>.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-800/60 space-y-2 min-w-0">
                  <div className="w-7 h-7 rounded-xl bg-amber-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                    3
                  </div>
                  <h4 className="font-extrabold text-xs text-slate-900 dark:text-zinc-100">
                    Diamante de Colores (4 Rombos)
                  </h4>
                  <p className="text-[11px] text-slate-600 dark:text-zinc-300 leading-relaxed">
                    Suma de puntajes por elemento:<br />
                    • <strong>0.0 a 1.0:</strong> Verde (Baja)<br />
                    • <strong>1.1 a 2.0:</strong> Amarillo (Media)<br />
                    • <strong>2.1 a 3.0:</strong> Rojo (Alta).
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-800/60 space-y-2 min-w-0">
                  <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                    4
                  </div>
                  <h4 className="font-extrabold text-xs text-slate-900 dark:text-zinc-100">
                    Nivel Global & PONs
                  </h4>
                  <p className="text-[11px] text-slate-600 dark:text-zinc-300 leading-relaxed">
                    Cálculo del rombo central. Formulación de Procedimientos Operativos Normalizados (PONs) y plan de emergencias ante la ARL.
                  </p>
                </div>

              </div>

              {/* Tabla de Interpretación del Diamante */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200/80 dark:border-zinc-700/80 space-y-3 w-full min-w-0">
                <h4 className="font-bold text-xs text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                  <Calculator size={14} className="text-teal-600" />
                  Regla de Decisión del Diamante de Riesgo (Guía IDIGER)
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px] w-full min-w-0">
                  <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-rose-200/60 dark:border-rose-900/60 space-y-1.5">
                    <span className="font-extrabold text-rose-700 dark:text-rose-400 block">🔴 Riesgo ALTO</span>
                    <p className="text-slate-600 dark:text-zinc-300">
                      Se presenta cuando <strong>3 o 4 rombos son ROJOS</strong>, o cuando hay 2 rombos rojos y 2 amarillos, o 1 rojo y 3 amarillos. Exige medidas de mitigación y protección prioritarias.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-amber-200/60 dark:border-amber-900/60 space-y-1.5">
                    <span className="font-extrabold text-amber-700 dark:text-amber-400 block">🟡 Riesgo MEDIO</span>
                    <p className="text-slate-600 dark:text-zinc-300">
                      Se presenta cuando hay <strong>1 o 2 rombos ROJOS y 1 o 2 AMARILLOS</strong>, o <strong>3 o 4 rombos AMARILLOS</strong>. Requiere acciones preventivas a corto y mediano plazo.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-emerald-200/60 dark:border-emerald-900/60 space-y-1.5">
                    <span className="font-extrabold text-emerald-700 dark:text-emerald-400 block">🟢 Riesgo BAJO</span>
                    <p className="text-slate-600 dark:text-zinc-300">
                      Se presenta cuando la <strong>mayoría de rombos son VERDES</strong> (no más de 1 amarillo y ningún rojo). Se mantienen planes de contingencia y simulacros anuales.
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
