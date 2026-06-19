/**
 * MatrizPESVDashboard.tsx
 * Dashboard analítico de la Matriz PESV — 4 gráficas viales + conclusiones IA
 */
import React, { useState, useMemo } from 'react';
import { BarChart2, ShieldCheck, Truck, MapPin, Sparkles, Loader2 } from 'lucide-react';
import { MatrixRow } from './MatrizPESVConstants';

interface DashboardProps {
  matrixRows: MatrixRow[];
  conversationId: string | null;
  token: string;
  savedConclusions: Record<string, string>;
  onConclusionSaved: (chartType: string, text: string) => void;
  isMaximized?: boolean;
}

const getPESVColor = (calificacion: number) => {
  if (calificacion >= 12) return { bg: 'bg-red-500', text: 'text-red-500' };
  if (calificacion >= 8) return { bg: 'bg-orange-500', text: 'text-orange-500' };
  return { bg: 'bg-green-500', text: 'text-green-500' };
};

const Bar = ({ label, value, max, color, labelWidth = 'w-44' }: {
  label: string; value: number; max: number; color: string; labelWidth?: string;
}) => {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className={`text-[11px] font-semibold text-text-secondary shrink-0 text-right ${labelWidth}`}
        >{label.length > 28 ? label.slice(0, 28) + '…' : label}</span>
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
        placeholder="Conclusión vial… presiona ✨ para generarla con IA"
        value={text}
        onChange={e => setText(e.target.value)}
        onBlur={handleBlur}
        rows={3}
      />
      <button onClick={generate} disabled={loading || !conversationId}
        className="group flex items-center justify-center p-2 h-[36px] bg-surface-secondary border border-border-medium rounded-[16px] text-sky-600 transition-all duration-300 hover:bg-sky-50 dark:hover:bg-sky-900/20 cursor-pointer disabled:opacity-50">
        {loading ? <Loader2 className="h-4 w-4 animate-spin shrink-0" />
          : <Sparkles className="h-4 w-4 shrink-0" />}
        <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 transition-all duration-300 whitespace-nowrap group-hover:ml-2 text-xs font-bold">
          {loading ? 'Generando…' : 'Generar con IA'}
        </span>
      </button>
    </div>
  );
};

const MatrizPESVDashboard = ({ matrixRows, conversationId, token, savedConclusions, onConclusionSaved, isMaximized }: DashboardProps) => {

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
      { label: 'Control en el Individuo (Persona)', value: persona, pct: Math.round((persona / total) * 100) },
      { label: 'Control en el Medio', value: medio, pct: Math.round((medio / total) * 100) },
      { label: 'Control en el Vehículo', value: vehiculo, pct: Math.round((vehiculo / total) * 100) },
      { label: 'Control en la Vía / Infraestructura', value: infra, pct: Math.round((infra / total) * 100) },
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

  if (matrixRows.length === 0) return null;

  const maxChartA = 15;
  const maxChartB = 15;
  const maxChartD = 15;

  return (
    <div className="mt-6 mb-6 space-y-6">
      <div className="flex items-center gap-2 px-1">
        <BarChart2 className="h-5 w-5 text-sky-500" />
        <h3 className="text-sm font-bold text-text-primary uppercase tracking-wide">
          Analítica PESV — Caracterización Vial
        </h3>
        <span className="text-xs text-text-secondary">({matrixRows.length} peligros viales)</span>
      </div>

      <div className={`grid gap-5 ${isMaximized ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1'}`}>

        {/* Chart A: Actor Vial */}
        <div className="p-5 bg-surface-secondary rounded-2xl border border-border-medium shadow-sm">
          <h4 className="text-xs font-bold text-text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-sky-500 inline-block" />
            Calificación Promedio por Actor Vial (Rango 3-15)
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

        {/* Chart B: Factor de Riesgo */}
        <div className="p-5 bg-surface-secondary rounded-2xl border border-border-medium shadow-sm">
          <h4 className="text-xs font-bold text-text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
            <Truck className="h-4 w-4 text-sky-600" />
            Calificación por Factor PESV
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
        <div className="p-5 bg-surface-secondary rounded-2xl border border-border-medium shadow-sm">
          <h4 className="text-xs font-bold text-text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            Cobertura de Controles Existentes (Persona / Vehículo / Vía)
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

        {/* Chart D: Tipo Desplazamiento */}
        <div className="p-5 bg-surface-secondary rounded-2xl border border-border-medium shadow-sm">
          <h4 className="text-xs font-bold text-text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-orange-500" />
            Nivel de Calificación por Tipo de Desplazamiento
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
  );
};

export default MatrizPESVDashboard;
