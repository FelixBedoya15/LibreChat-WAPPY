import React, { useState, useMemo, useEffect } from 'react';
import { Sparkles, ShieldAlert, CheckCircle2, AlertTriangle, Info, Loader2 } from 'lucide-react';
import { MatrixRow, getChemicalCompatibility } from './MatrizCompatibilidadConstants';

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
  const [conclusions, setConclusions] = useState<Record<string, string>>(savedConclusions);
  const [loadingConclusion, setLoadingConclusion] = useState<string | null>(null);

  useEffect(() => {
    setConclusions(savedConclusions);
  }, [savedConclusions]);

  // ── 1. Métricas Principales ──
  const totalProducts = matrixRows.length;

  const { fdsCount, rotuloCount } = useMemo(() => {
    let fds = 0;
    let rot = 0;
    matrixRows.forEach(r => {
      if (String(r.tiene_fds).toLowerCase() === 'sí') fds++;
      if (String(r.tiene_rotulo).toLowerCase() === 'sí') rot++;
    });
    return { fdsCount: fds, rotuloCount: rot };
  }, [matrixRows]);

  const fdsCompliancePct = totalProducts > 0 ? Math.round((fdsCount / totalProducts) * 100) : 0;
  const labelCompliancePct = totalProducts > 0 ? Math.round((rotuloCount / totalProducts) * 100) : 0;

  // ── 2. Cálculo de Compatibilidad (N x N) ──
  const compatibilityStats = useMemo(() => {
    let compatible = 0;
    let caution = 0;
    let incompatible = 0;
    const pairsCount = (totalProducts * (totalProducts - 1)) / 2;

    if (totalProducts <= 1) {
      return { compatible: 0, caution: 0, incompatible: 0, totalPairs: 0 };
    }

    for (let i = 0; i < totalProducts; i++) {
      for (let j = i + 1; j < totalProducts; j++) {
        const res = getChemicalCompatibility(matrixRows[i].clasificacion_onu, matrixRows[j].clasificacion_onu);
        if (res.status === 'incompatible') incompatible++;
        else if (res.status === 'caution') caution++;
        else compatible++;
      }
    }

    return { compatible, caution, incompatible, totalPairs: pairsCount };
  }, [matrixRows, totalProducts]);

  // ── 3. Distribución por Clase ONU ──
  const classDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    matrixRows.forEach(r => {
      const cls = r.clasificacion_onu || 'No Peligroso';
      counts[cls] = (counts[cls] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [matrixRows]);

  const maxClassCount = useMemo(() => {
    return Math.max(...classDistribution.map(d => d.count), 1);
  }, [classDistribution]);

  // ── 4. Distribución por Pictogramas SGA ──
  const pictogramDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    matrixRows.forEach(r => {
      if (Array.isArray(r.pictogramas_sga)) {
        r.pictogramas_sga.forEach(pic => {
          counts[pic] = (counts[pic] || 0) + 1;
        });
      }
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [matrixRows]);

  const maxPicCount = useMemo(() => {
    return Math.max(...pictogramDistribution.map(d => d.count), 1);
  }, [pictogramDistribution]);

  // ── 5. Generar Conclusión de Gráfico con IA ──
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

  return (
    <div className="flex flex-col gap-6 p-4">
      {/* ── SECCIÓN 1: Tarjetas Métricas de Vidrio (Glassmorphism) ── */}
      <div className={`grid gap-4 ${isMaximized ? 'grid-cols-4' : 'grid-cols-2'}`}>
        {/* Total Productos */}
        <div className="flex flex-col justify-between rounded-2xl border border-teal-500/10 bg-teal-500/5 p-4 shadow-sm backdrop-blur-md">
          <div className="flex items-center justify-between text-teal-600 dark:text-teal-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Productos</span>
            <Info className="h-4 w-4 opacity-65" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-800 dark:text-slate-100">{totalProducts}</span>
            <span className="text-xs text-text-secondary">químicos</span>
          </div>
        </div>

        {/* Incompatibilidades */}
        <div className={`flex flex-col justify-between rounded-2xl border p-4 shadow-sm backdrop-blur-md ${
          compatibilityStats.incompatible > 0 
            ? 'border-red-500/20 bg-red-500/5 text-red-700 dark:text-red-400' 
            : 'border-green-500/20 bg-green-500/5 text-green-700 dark:text-green-400'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider">Cruces Incompatibles</span>
            <ShieldAlert className="h-4 w-4 opacity-65" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold">{compatibilityStats.incompatible}</span>
            <span className="text-xs opacity-75">en rojo</span>
          </div>
        </div>

        {/* FDS Compliance */}
        <div className="flex flex-col justify-between rounded-2xl border border-emerald-500/10 bg-emerald-500/5 p-4 shadow-sm backdrop-blur-md">
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Conformidad FDS</span>
            <CheckCircle2 className="h-4 w-4 opacity-65" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-800 dark:text-slate-100">{fdsCompliancePct}%</span>
            <span className="text-xs text-text-secondary">con FDS 16s</span>
          </div>
        </div>

        {/* Labeling Compliance */}
        <div className="flex flex-col justify-between rounded-2xl border border-purple-500/10 bg-purple-500/5 p-4 shadow-sm backdrop-blur-md">
          <div className="flex items-center justify-between text-purple-600 dark:text-purple-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Rotulado SGA</span>
            <CheckCircle2 className="h-4 w-4 opacity-65" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-800 dark:text-slate-100">{labelCompliancePct}%</span>
            <span className="text-xs text-text-secondary">etiquetados</span>
          </div>
        </div>
      </div>

      {/* ── SECCIÓN 2: Gráficos y Conclusiones de IA ── */}
      <div className={`grid gap-6 ${isMaximized ? 'grid-cols-2' : 'grid-cols-1'}`}>
        
        {/* Gráfico 1: Clases de Peligro ONU */}
        <div className="flex flex-col rounded-2xl border border-border-medium bg-surface-primary p-5 shadow-sm">
          <h3 className="text-sm font-bold text-text-primary">Distribución por Clases de Peligro ONU</h3>
          
          <div className="mt-4 flex flex-col gap-2.5 flex-1 justify-center">
            {classDistribution.length === 0 ? (
              <p className="text-center text-xs text-text-secondary py-8">No hay datos de productos.</p>
            ) : (
              classDistribution.slice(0, 5).map(item => {
                const pct = Math.round((item.count / maxClassCount) * 100);
                return (
                  <div key={item.name} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-xs text-text-secondary">
                      <span className="font-semibold text-text-primary truncate max-w-[240px]">{item.name}</span>
                      <span>{item.count} ({Math.round((item.count / totalProducts)*100)}%)</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-surface-secondary overflow-hidden">
                      <div style={{ width: `${pct}%` }} className="h-full rounded-full bg-teal-500 transition-all duration-300" />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Caja de Conclusión IA */}
          <div className="mt-6 rounded-xl border border-teal-500/10 bg-teal-500/5 p-3 text-xs">
            <div className="flex items-center justify-between border-b border-teal-500/10 pb-2">
              <span className="flex items-center gap-1.5 font-bold text-teal-700 dark:text-teal-400">
                <Sparkles className="h-3.5 w-3.5" /> Análisis IA - Clases de Peligro
              </span>
              <button
                onClick={() => generateConclusion('clases_onu', { totalProducts, classDistribution })}
                disabled={loadingConclusion === 'clases_onu' || !totalProducts}
                className="flex items-center gap-1 text-[10px] font-bold text-teal-600 hover:text-teal-700 disabled:opacity-50"
              >
                {loadingConclusion === 'clases_onu' ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Generar'}
              </button>
            </div>
            <textarea
              className="mt-2 w-full resize-none border-0 bg-transparent p-0 text-xs text-text-secondary focus:ring-0 focus:outline-none"
              rows={3}
              value={conclusions.clases_onu || ''}
              onChange={(e) => handleManualConclusionChange('clases_onu', e.target.value)}
              placeholder="El Especialista en Riesgo Químico analizará las clases de peligro almacenadas..."
            />
          </div>
        </div>

        {/* Gráfico 2: Riesgo de Compatibilidad (Semáforo) */}
        <div className="flex flex-col rounded-2xl border border-border-medium bg-surface-primary p-5 shadow-sm">
          <h3 className="text-sm font-bold text-text-primary">Estatus de Almacenamiento Conjunto (Cruces)</h3>

          <div className="mt-4 flex flex-col gap-3 flex-1 justify-center">
            {totalProducts <= 1 ? (
              <p className="text-center text-xs text-text-secondary py-8">Registre 2 o más productos para calcular cruces.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {/* Compatible */}
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-green-500" />
                  <span className="flex-1 text-xs text-text-secondary">Compatible (Verde)</span>
                  <span className="text-xs font-bold text-text-primary">
                    {compatibilityStats.compatible} ({Math.round((compatibilityStats.compatible / compatibilityStats.totalPairs) * 100)}%)
                  </span>
                </div>
                {/* Caution */}
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-yellow-500" />
                  <span className="flex-1 text-xs text-text-secondary">Precaución / Verificar FDS (Amarillo)</span>
                  <span className="text-xs font-bold text-text-primary">
                    {compatibilityStats.caution} ({Math.round((compatibilityStats.caution / compatibilityStats.totalPairs) * 100)}%)
                  </span>
                </div>
                {/* Incompatible */}
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-red-500" />
                  <span className="flex-1 text-xs text-text-secondary">Incompatible / Segregar (Rojo)</span>
                  <span className="text-xs font-bold text-text-primary">
                    {compatibilityStats.incompatible} ({Math.round((compatibilityStats.incompatible / compatibilityStats.totalPairs) * 100)}%)
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Caja de Conclusión IA */}
          <div className="mt-6 rounded-xl border border-teal-500/10 bg-teal-500/5 p-3 text-xs">
            <div className="flex items-center justify-between border-b border-teal-500/10 pb-2">
              <span className="flex items-center gap-1.5 font-bold text-teal-700 dark:text-teal-400">
                <Sparkles className="h-3.5 w-3.5" /> Análisis IA - Matriz de Cruces
              </span>
              <button
                onClick={() => generateConclusion('riesgo_compatibilidad', { totalProducts, compatibilityStats })}
                disabled={loadingConclusion === 'riesgo_compatibilidad' || totalProducts <= 1}
                className="flex items-center gap-1 text-[10px] font-bold text-teal-600 hover:text-teal-700 disabled:opacity-50"
              >
                {loadingConclusion === 'riesgo_compatibilidad' ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Generar'}
              </button>
            </div>
            <textarea
              className="mt-2 w-full resize-none border-0 bg-transparent p-0 text-xs text-text-secondary focus:ring-0 focus:outline-none"
              rows={3}
              value={conclusions.riesgo_compatibilidad || ''}
              onChange={(e) => handleManualConclusionChange('riesgo_compatibilidad', e.target.value)}
              placeholder="El Especialista en Riesgo Químico analizará el semáforo de compatibilidad y los riesgos de incendios o reacciones químicas..."
            />
          </div>
        </div>

        {/* Gráfico 3: Pictogramas SGA Frecuencia */}
        <div className="flex flex-col rounded-2xl border border-border-medium bg-surface-primary p-5 shadow-sm">
          <h3 className="text-sm font-bold text-text-primary">Frecuencia de Advertencias SGA</h3>

          <div className="mt-4 flex flex-col gap-2.5 flex-1 justify-center">
            {pictogramDistribution.length === 0 ? (
              <p className="text-center text-xs text-text-secondary py-8">No se han registrado advertencias SGA.</p>
            ) : (
              pictogramDistribution.slice(0, 5).map(item => {
                const pct = Math.round((item.count / maxPicCount) * 100);
                return (
                  <div key={item.name} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-xs text-text-secondary">
                      <span className="font-semibold text-text-primary truncate max-w-[240px] capitalize">{item.name}</span>
                      <span>{item.count} productos</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-surface-secondary overflow-hidden">
                      <div style={{ width: `${pct}%` }} className="h-full rounded-full bg-purple-500 transition-all duration-300" />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Caja de Conclusión IA */}
          <div className="mt-6 rounded-xl border border-teal-500/10 bg-teal-500/5 p-3 text-xs">
            <div className="flex items-center justify-between border-b border-teal-500/10 pb-2">
              <span className="flex items-center gap-1.5 font-bold text-teal-700 dark:text-teal-400">
                <Sparkles className="h-3.5 w-3.5" /> Análisis IA - Advertencias SGA
              </span>
              <button
                onClick={() => generateConclusion('pictogramas', { totalProducts, pictogramDistribution })}
                disabled={loadingConclusion === 'pictogramas' || !pictogramDistribution.length}
                className="flex items-center gap-1 text-[10px] font-bold text-teal-600 hover:text-teal-700 disabled:opacity-50"
              >
                {loadingConclusion === 'pictogramas' ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Generar'}
              </button>
            </div>
            <textarea
              className="mt-2 w-full resize-none border-0 bg-transparent p-0 text-xs text-text-secondary focus:ring-0 focus:outline-none"
              rows={3}
              value={conclusions.pictogramas || ''}
              onChange={(e) => handleManualConclusionChange('pictogramas', e.target.value)}
              placeholder="El Especialista en Riesgo Químico evaluará los pictogramas y la toxicidad/reactividad de los productos..."
            />
          </div>
        </div>

        {/* Gráfico 4: Conformidad Legal FDS / Rotulación */}
        <div className="flex flex-col rounded-2xl border border-border-medium bg-surface-primary p-5 shadow-sm">
          <h3 className="text-sm font-bold text-text-primary">Porcentaje de Conformidad Legal (Decreto 1496/2018)</h3>

          <div className="mt-4 flex flex-col gap-4 flex-1 justify-center">
            {totalProducts === 0 ? (
              <p className="text-center text-xs text-text-secondary py-8">Registre productos para calcular la conformidad.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {/* FDS */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-text-secondary font-semibold">Fichas de Datos de Seguridad (FDS)</span>
                    <span className="font-bold text-emerald-600">{fdsCompliancePct}% ({fdsCount}/{totalProducts})</span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-surface-secondary overflow-hidden">
                    <div style={{ width: `${fdsCompliancePct}%` }} className="h-full rounded-full bg-emerald-500 transition-all duration-300" />
                  </div>
                </div>

                {/* Rotulado */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-text-secondary font-semibold">Etiquetas con Rotulado SGA</span>
                    <span className="font-bold text-purple-600">{labelCompliancePct}% ({rotuloCount}/{totalProducts})</span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-surface-secondary overflow-hidden">
                    <div style={{ width: `${labelCompliancePct}%` }} className="h-full rounded-full bg-purple-500 transition-all duration-300" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Caja de Conclusión IA */}
          <div className="mt-6 rounded-xl border border-teal-500/10 bg-teal-500/5 p-3 text-xs">
            <div className="flex items-center justify-between border-b border-teal-500/10 pb-2">
              <span className="flex items-center gap-1.5 font-bold text-teal-700 dark:text-teal-400">
                <Sparkles className="h-3.5 w-3.5" /> Análisis IA - Conformidad Legal
              </span>
              <button
                onClick={() => generateConclusion('cumplimiento', { totalProducts, fdsCompliancePct, labelCompliancePct })}
                disabled={loadingConclusion === 'cumplimiento' || !totalProducts}
                className="flex items-center gap-1 text-[10px] font-bold text-teal-600 hover:text-teal-700 disabled:opacity-50"
              >
                {loadingConclusion === 'cumplimiento' ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Generar'}
              </button>
            </div>
            <textarea
              className="mt-2 w-full resize-none border-0 bg-transparent p-0 text-xs text-text-secondary focus:ring-0 focus:outline-none"
              rows={3}
              value={conclusions.cumplimiento || ''}
              onChange={(e) => handleManualConclusionChange('cumplimiento', e.target.value)}
              placeholder="El Especialista en Riesgo Químico evaluará las brechas en la documentación FDS y en el rotulado de envases..."
            />
          </div>
        </div>

      </div>
    </div>
  );
}
