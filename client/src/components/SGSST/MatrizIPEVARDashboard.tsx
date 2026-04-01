/**
 * MatrizIPEVARDashboard.tsx
 * Dashboard analítico de la Matriz IPEVAR — 4 gráficas + conclusiones IA
 */
import React, { useState, useMemo } from 'react';
import { BarChart2, ShieldCheck, Heart, MapPin, Sparkles, Loader2 } from 'lucide-react';
import { MatrixRow, DISEASE_KEYWORDS, getNRColor, detectAnnexCType } from './MatrizIPEVARConstants';

interface DashboardProps {
  matrixRows: MatrixRow[];
  conversationId: string | null;
  token: string;
  savedConclusions: Record<string, string>;
  onConclusionSaved: (chartType: string, text: string) => void;
  isMaximized?: boolean;
}

// ── Barra animada reutilizable ────────────────────────────────────────────────
const Bar = ({ label, value, max, color, labelWidth = 'w-36' }: {
  label: string; value: number; max: number; color: string; labelWidth?: string;
}) => {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className={`text-[11px] font-semibold text-text-secondary shrink-0 text-right ${labelWidth}`}
        title={label}>{label.length > 24 ? label.slice(0, 24) + '…' : label}</span>
      <div className="flex-1 bg-surface-tertiary border border-border-light rounded-full h-4 overflow-hidden relative">
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
    <div className="mt-4 pt-4 border-t border-border-light space-y-2">
      <textarea
        className="w-full text-xs text-text-primary bg-surface-primary border border-border-light rounded-xl p-3 resize-y min-h-[64px] outline-none focus:border-teal-400 transition-colors"
        placeholder="Conclusión técnica… presiona ✨ para generarla con IA"
        value={text}
        onChange={e => setText(e.target.value)}
        onBlur={handleBlur}
        rows={3}
      />
      <button onClick={generate} disabled={loading || !conversationId}
        className="group flex items-center justify-center p-2 h-[36px] bg-surface-secondary border border-border-medium rounded-[16px] text-teal-600 transition-all duration-300 hover:bg-teal-50 dark:hover:bg-teal-900/20 cursor-pointer disabled:opacity-50">
        {loading ? <Loader2 className="h-4 w-4 animate-spin shrink-0" />
          : <Sparkles className="h-4 w-4 shrink-0" />}
        <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 transition-all duration-300 whitespace-nowrap group-hover:ml-2 text-xs font-bold">
          {loading ? 'Generando…' : 'Generar con IA'}
        </span>
      </button>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
const MatrizIPEVARDashboard = ({ matrixRows, conversationId, token, savedConclusions, onConclusionSaved, isMaximized }: DashboardProps) => {

  // ── Chart A: NR por Clasificación ────────────────────────────────────────
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

  // ── Chart B: Jerarquía de Controles ─────────────────────────────────────
  const chartB = useMemo(() => {
    const empty = (v?: string) => !v || ['ninguno', 'ninguna', 'none', 'no aplica', ''].includes(v.toLowerCase().trim());
    let fuente = 0, medio = 0, individuo = 0;
    matrixRows.forEach(r => {
      if (!empty(r.controles_fuente)) fuente++;
      if (!empty(r.controles_medio)) medio++;
      if (!empty(r.controles_individuo)) individuo++;
    });
    const total = matrixRows.length || 1;
    return [
      { label: 'En la Fuente (Eliminación/Sustitución)', value: fuente, pct: Math.round((fuente / total) * 100) },
      { label: 'En el Medio (Ingeniería)', value: medio, pct: Math.round((medio / total) * 100) },
      { label: 'En el Individuo (EPP/Admin)', value: individuo, pct: Math.round((individuo / total) * 100) },
    ];
  }, [matrixRows]);

  // ── Chart C: Enfermedades Potenciales ───────────────────────────────────
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

  // ── Chart D: Mapa de Calor por Proceso ──────────────────────────────────
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

  if (matrixRows.length === 0) return null;

  const maxChartA = Math.max(...chartA.map(d => d.avg), 1);
  const maxChartD = Math.max(...chartD.map(d => d.avg), 1);

  return (
    <div className="mt-6 mb-6 space-y-6">
      {/* Title */}
      <div className="flex items-center gap-2 px-1">
        <BarChart2 className="h-5 w-5 text-teal-500" />
        <h3 className="text-sm font-bold text-text-primary uppercase tracking-wide">
          Analítica IPEVAR — Resumen Ejecutivo GTC-45
        </h3>
        <span className="text-xs text-text-secondary">({matrixRows.length} riesgos)</span>
      </div>

      <div className={`grid gap-5 ${isMaximized ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1'}`}>

        {/* ── Gráfico A: NR por Clasificación ── */}
        <div className="p-5 bg-surface-secondary rounded-2xl border border-border-medium shadow-sm">
          <h4 className="text-xs font-bold text-text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-teal-500 inline-block" />
            Riesgos por Tipo de Peligro (NR Promedio)
          </h4>
          <div className="space-y-3">
            {chartA.slice(0, 8).map(d => {
              const col = getNRColor(d.avg);
              return <Bar key={d.clas} label={`${d.clas} (${d.count})`} value={d.avg} max={maxChartA} color={col.bg} />;
            })}
          </div>
          <ConclusionField chartType="clasificacion" chartStats={chartA} matrixRows={matrixRows}
            conversationId={conversationId} token={token}
            saved={savedConclusions.clasificacion || ''} onSaved={t => onConclusionSaved('clasificacion', t)} />
        </div>

        {/* ── Gráfico B: Jerarquía de Controles ── */}
        <div className="p-5 bg-surface-secondary rounded-2xl border border-border-medium shadow-sm">
          <h4 className="text-xs font-bold text-text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-blue-500" />
            Cobertura de la Jerarquía de Controles
          </h4>
          <div className="space-y-3">
            {chartB.map(d => (
              <div key={d.label}>
                <Bar label={`${d.label}`} value={d.value} max={matrixRows.length} color="bg-blue-500" />
                <p className="text-[10px] text-text-secondary text-right mt-0.5">{d.pct}% de los riesgos tienen este control</p>
              </div>
            ))}
          </div>
          <div className="mt-3 p-3 rounded-xl bg-surface-primary border border-border-light text-xs text-text-secondary">
            {chartB[0]?.pct < chartB[2]?.pct
              ? '⚠️ La jerarquía está invertida: más controles en el individuo (EPP) que en la fuente. Revisar GTC-45 §5.3.'
              : '✅ La intervención prioriza los controles en la fuente según la jerarquía GTC-45.'}
          </div>
          <ConclusionField chartType="controles" chartStats={chartB} matrixRows={matrixRows}
            conversationId={conversationId} token={token}
            saved={savedConclusions.controles || ''} onSaved={t => onConclusionSaved('controles', t)} />
        </div>

        {/* ── Gráfico C: Enfermedades Potenciales ── */}
        <div className="p-5 bg-surface-secondary rounded-2xl border border-border-medium shadow-sm">
          <h4 className="text-xs font-bold text-text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
            <Heart className="h-4 w-4 text-red-500" />
            Enfermedades Laborales Potenciales
          </h4>
          {chartC.length === 0
            ? <p className="text-xs text-text-secondary italic">No se identificaron enfermedades potenciales en los efectos documentados.</p>
            : (
              <div className="space-y-2">
                {chartC.map(d => (
                  <div key={d.name} className="flex items-center gap-3 p-2.5 rounded-xl border border-border-light bg-surface-primary">
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${d.nivel === 'alto' ? 'bg-red-500' : d.nivel === 'medio' ? 'bg-orange-400' : 'bg-green-500'}`} />
                    <span className="text-xs font-semibold text-text-primary flex-1">{d.name}</span>
                    <span className="text-[10px] font-mono text-text-secondary">{d.count} riesgo{d.count > 1 ? 's' : ''}</span>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                      d.nivel === 'alto' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      : d.nivel === 'medio' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                      : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    }`}>
                      {d.nivel === 'alto' ? 'Sin control' : d.nivel === 'medio' ? 'Parcial' : 'Controlada'}
                    </span>
                  </div>
                ))}
              </div>
            )
          }
          <ConclusionField chartType="enfermedades" chartStats={chartC} matrixRows={matrixRows}
            conversationId={conversationId} token={token}
            saved={savedConclusions.enfermedades || ''} onSaved={t => onConclusionSaved('enfermedades', t)} />
        </div>

        {/* ── Gráfico D: Mapa de Calor por Proceso ── */}
        <div className="p-5 bg-surface-secondary rounded-2xl border border-border-medium shadow-sm">
          <h4 className="text-xs font-bold text-text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-purple-500" />
            Nivel de Riesgo por Proceso / Área
          </h4>
          <div className="space-y-3">
            {chartD.slice(0, 8).map(d => {
              const col = getNRColor(d.avg);
              return (
                <div key={d.proc}>
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
  );
};

export default MatrizIPEVARDashboard;
