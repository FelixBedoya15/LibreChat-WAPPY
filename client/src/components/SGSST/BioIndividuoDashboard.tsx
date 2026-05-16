import React, { useState, useEffect, useCallback } from 'react';
import { useAuthContext } from '~/hooks';
import {
  ArrowLeft, User, Activity, AlertTriangle, Shield,
  Calendar, FileText, Dna, TrendingUp, TrendingDown,
  Clock, Award, Zap, ChevronDown, ChevronRight,
} from 'lucide-react';
import { useToastContext } from '@librechat/client';
import BioMatrizIPEVAR from './BioMatrizIPEVAR';

// ─── FIT Gauge ────────────────────────────────────────────────────────────────
const FitGauge = ({ score, alerts = [] }: { score: number; alerts?: string[] }) => {
  const color = score >= 70 ? '#22c55e' : score >= 40 ? '#f59e0b' : '#ef4444';
  const label = score >= 70 ? 'ÓPTIMO' : score >= 40 ? 'MODERADO' : 'CRÍTICO';
  const r = 52;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-36 h-36">
        <svg className="w-36 h-36 -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={r} fill="none" stroke="currentColor" strokeWidth="10" className="text-surface-hover" />
          <circle cx="60" cy="60" r={r} fill="none" strokeWidth="10"
            style={{ stroke: color, strokeDasharray: `${dash} ${circ}`, strokeLinecap: 'round', transition: 'stroke-dasharray 1s ease' }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <p className="text-3xl font-black" style={{ color }}>{score}%</p>
          <p className="text-[10px] font-bold text-text-secondary mt-0.5">FIT</p>
          <p className="text-[9px] font-bold" style={{ color }}>{label}</p>
        </div>
      </div>
      <div>
        <p className="text-xs font-bold text-teal-600 dark:text-teal-400 text-center uppercase tracking-wide flex items-center justify-center gap-1">
          <Dna className="h-3 w-3" /> Índice Biocéntrico Integral
        </p>
        <p className="text-[10px] text-text-tertiary text-center mt-0.5">Evaluación clínica vs exigencias del cargo</p>
      </div>
      {alerts.length > 0 && (
        <div className="flex flex-col gap-1.5 w-full">
          {alerts.map(alert => (
            <div key={alert} className="flex items-center gap-2 px-2.5 py-1.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" />
              <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400">{alert}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Perception Score Badge ───────────────────────────────────────────────────
const PercepcionScore = ({ score }: { score: number }) => {
  const factorReduccion = Math.min(score / 500, 0.40);
  const level = score >= 200 ? { label: 'Alta', Icon: TrendingDown, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-800' }
    : score >= 50 ? { label: 'Media', Icon: Activity, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800' }
    : { label: 'Baja', Icon: TrendingUp, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800' };

  return (
    <div className={`rounded-xl p-4 border ${level.bg} ${level.border}`}>
      <div className="flex items-center justify-between mb-2">
        <p className={`text-xs font-bold uppercase tracking-wide flex items-center gap-1.5 ${level.color}`}>
          <level.Icon className="h-3.5 w-3.5" />
          Percepción del Riesgo
        </p>
        <span className={`text-lg font-black ${level.color}`}>{score} pts</span>
      </div>
      <div className="w-full bg-surface-secondary rounded-full h-2 mb-1.5">
        <div className="h-2 rounded-full transition-all duration-700" style={{ width: `${Math.min((score / 500) * 100, 100)}%`, backgroundColor: level.color.includes('green') ? '#22c55e' : level.color.includes('amber') ? '#f59e0b' : '#ef4444' }} />
      </div>
      <p className="text-[10px] text-text-tertiary">
        Nivel <strong>{level.label}</strong> · Reduce el índice bio-riesgo en <strong>{(factorReduccion * 100).toFixed(0)}%</strong>
      </p>
    </div>
  );
};

// ─── Historial de eventos ─────────────────────────────────────────────────────
const MODULO_LABELS: Record<string, { label: string; color: string }> = {
  actos: { label: 'Reporte Actos', color: 'text-orange-500' },
  participacion_ipevar: { label: 'Participación IPEVAR', color: 'text-teal-500' },
  atel: { label: 'ATEL', color: 'text-red-500' },
  capacitacion: { label: 'Capacitación', color: 'text-blue-500' },
  ats: { label: 'ATS', color: 'text-purple-500' },
};

const PercepcionHistorial = ({ historial }: { historial: any[] }) => {
  const [expanded, setExpanded] = useState(false);
  if (!historial || historial.length === 0) return null;
  const visible = expanded ? historial : historial.slice(-5).reverse();

  return (
    <div className="bg-surface-secondary border border-border-medium rounded-xl p-4">
      <button onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-left">
        <p className="text-xs font-bold text-text-secondary uppercase tracking-wide flex items-center gap-1.5">
          <Award className="h-3.5 w-3.5 text-teal-500" />
          Historial de Percepción del Riesgo
        </p>
        {expanded ? <ChevronDown className="h-3.5 w-3.5 text-text-tertiary" /> : <ChevronRight className="h-3.5 w-3.5 text-text-tertiary" />}
      </button>
      <div className="mt-3 space-y-1.5">
        {visible.map((h, i) => {
          const mod = MODULO_LABELS[h.modulo] || { label: h.modulo, color: 'text-text-secondary' };
          const isPositive = h.puntos >= 0;
          return (
            <div key={i} className="flex items-center justify-between text-xs py-1.5 border-b border-border-light last:border-0">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold ${mod.color}`}>{mod.label}</span>
                <span className="text-text-tertiary truncate max-w-[200px]">{h.accion}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`font-bold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                  {isPositive ? '+' : ''}{h.puntos} pts
                </span>
                <span className="text-text-tertiary text-[10px]">
                  {h.fecha ? new Date(h.fecha).toLocaleDateString('es-CO') : ''}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      {historial.length > 5 && (
        <button onClick={() => setExpanded(!expanded)} className="text-[10px] text-teal-500 hover:text-teal-600 mt-2">
          {expanded ? 'Ver menos' : `Ver ${historial.length - 5} más`}
        </button>
      )}
    </div>
  );
};

// ─── Hoja de Vida Section ─────────────────────────────────────────────────────
const HojaVidaSection = ({ title, items, emptyMsg, color = 'teal' }: {
  title: string; items: any[]; emptyMsg: string; color?: string;
}) => {
  if (items.length === 0) return (
    <div className="text-xs text-text-tertiary italic py-1">{emptyMsg}</div>
  );
  return (
    <div className="space-y-1.5">
      {items.slice(-5).reverse().map((item, i) => (
        <div key={i} className="flex items-start gap-2 text-xs py-1 border-b border-border-light last:border-0">
          <Clock className="h-3 w-3 text-text-tertiary shrink-0 mt-0.5" />
          <span className="text-text-secondary flex-1">{item.descripcion || item.nombre || item.tipo || '—'}</span>
          {item.fecha && <span className="text-text-tertiary text-[10px] shrink-0">{new Date(item.fecha).toLocaleDateString('es-CO')}</span>}
        </div>
      ))}
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────
interface BioIndividuoDashboardProps {
  workerId: string;
  onBack: () => void;
}

export default function BioIndividuoDashboard({ workerId, onBack }: BioIndividuoDashboardProps) {
  const { token } = useAuthContext();
  const { showToast } = useToastContext();
  const [worker, setWorker] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchWorker = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/sgsst/workers/worker/${workerId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setWorker(data.worker);
      }
    } catch {
      showToast({ message: 'Error cargando datos del trabajador', status: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [workerId, token]);

  useEffect(() => { fetchWorker(); }, [fetchWorker]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20 gap-3 text-text-secondary">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-500" />
        <span className="text-sm">Cargando perfil 360°...</span>
      </div>
    );
  }

  if (!worker) {
    return <div className="p-8 text-center text-red-500 text-sm">Trabajador no encontrado.</div>;
  }

  const fitAlerts: string[] = worker.fitAlerts || [];
  const fitScore: number = worker.fitScore || 0;
  const percepcionScore: number = worker.percepcionRiesgoScore || 0;
  const percepcionHistorial: any[] = worker.percepcionRiesgoHistorial || [];
  const atel: any[] = worker.atel || [];
  const actos: any[] = worker.actos_inseguros || [];
  const participaciones: any[] = worker.participaciones_ipevar || [];
  const capacitaciones: any[] = worker.capacitaciones || [];
  const ats: any[] = worker.ats || [];
  const riesgosBio: any[] = worker.riesgosBioIndividual || [];
  const riesgosCriticos = riesgosBio.filter(r => r.clasificacion_bio === 'Crítico').length;
  const riesgosAltos = riesgosBio.filter(r => r.clasificacion_bio === 'Alto').length;

  return (
    <div className="w-full space-y-6 animate-in fade-in slide-in-from-right-8 duration-300 overflow-y-auto pb-10">
      {/* ── Header ── */}
      <div className="flex items-center gap-4 border-b border-border-medium pb-4">
        <button onClick={onBack}
          className="p-2 bg-surface-secondary border border-border-medium rounded-xl hover:bg-surface-hover text-text-secondary transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h2 className="text-xl font-black text-text-primary flex items-center gap-2">
            <Dna className="h-6 w-6 text-teal-600" />
            Perfil 360° Bio-Individual: {worker.nombre}
          </h2>
          <p className="text-xs text-text-secondary mt-0.5">CC: {worker.documento} · Hoja de vida integral acumulada de todos los módulos</p>
        </div>
      </div>

      {/* ── FIT + Info + Percepción ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* FIT Gauge */}
        <div className="bg-surface-secondary border border-border-medium rounded-2xl p-5 shadow-sm flex flex-col items-center gap-4">
          <FitGauge score={fitScore} alerts={fitAlerts} />
        </div>

        {/* Datos + Condiciones */}
        <div className="flex flex-col gap-3">
          <div className="bg-surface-secondary border border-border-medium rounded-2xl p-4 shadow-sm">
            <h3 className="font-bold text-xs text-text-secondary uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-teal-600" /> Datos Generales
            </h3>
            <div className="space-y-2 text-xs">
              {[
                { label: 'Nombre', value: worker.nombre },
                { label: 'Documento', value: worker.documento },
                { label: 'Género', value: worker.genero || '—' },
                { label: 'Ingreso', value: worker.fechaIngreso ? new Date(worker.fechaIngreso).toLocaleDateString('es-CO') : '—' },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between">
                  <span className="text-text-tertiary font-semibold">{label}</span>
                  <span className="text-text-primary font-medium">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-xl p-3">
            <h3 className="font-bold text-xs text-red-700 dark:text-red-400 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5" /> Condiciones de Salud
            </h3>
            <p className="text-xs font-medium text-red-800 dark:text-red-300">
              {worker.condicionesSalud || 'Ninguna condición registrada.'}
            </p>
          </div>
        </div>

        {/* Percepción Score + Resumen Riesgos */}
        <div className="flex flex-col gap-3">
          <PercepcionScore score={percepcionScore} />

          {riesgosBio.length > 0 && (
            <div className="bg-surface-secondary border border-border-medium rounded-xl p-4">
              <p className="text-xs font-bold text-text-secondary uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-teal-500" /> Resumen Bio-Riesgos
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-center">
                  <p className={`text-2xl font-black ${riesgosCriticos > 0 ? 'text-red-500' : 'text-green-500'}`}>{riesgosCriticos}</p>
                  <p className="text-[10px] text-text-tertiary">Críticos</p>
                </div>
                <div className="text-center">
                  <p className={`text-2xl font-black ${riesgosAltos > 0 ? 'text-orange-500' : 'text-green-500'}`}>{riesgosAltos}</p>
                  <p className="text-[10px] text-text-tertiary">Altos</p>
                </div>
                <div className="text-center col-span-2">
                  <p className="text-2xl font-black text-text-primary">{riesgosBio.length}</p>
                  <p className="text-[10px] text-text-tertiary">Total registrados</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Hoja de Vida Integral ── */}
      <div className="bg-surface-secondary border border-border-medium rounded-2xl p-5 shadow-sm">
        <h3 className="font-bold text-sm text-text-primary uppercase tracking-wide mb-4 flex items-center gap-2">
          <Zap className="h-4 w-4 text-amber-500" /> Hoja de Vida Integral — Eventos de Todos los Módulos
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { title: '🚨 ATEL (Accidentes / Enfermedades)', items: atel, emptyMsg: 'Sin registros ATEL' },
            { title: '⚠️ Actos/Condiciones Inseguras', items: actos, emptyMsg: 'Sin reportes' },
            { title: '🎯 Participación IPEVAR Bio-Individual', items: participaciones, emptyMsg: 'Sin participaciones registradas' },
            { title: '📚 Capacitaciones Completadas', items: capacitaciones, emptyMsg: 'Sin capacitaciones' },
            { title: '🛡️ Análisis Trabajo Seguro (ATS)', items: ats, emptyMsg: 'Sin participaciones ATS' },
          ].map(({ title, items, emptyMsg }) => (
            <div key={title}>
              <p className="text-xs font-bold text-text-secondary mb-2">{title}</p>
              <HojaVidaSection title={title} items={items} emptyMsg={emptyMsg} />
            </div>
          ))}
        </div>
      </div>

      {/* ── Historial Percepción ── */}
      {percepcionHistorial.length > 0 && (
        <PercepcionHistorial historial={percepcionHistorial} />
      )}

      {/* ── Matriz IPEVAR Bio-Individual ── */}
      <div className="bg-surface-secondary border border-teal-200 dark:border-teal-800/50 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-black text-text-primary flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-teal-600" />
              Evaluación Bio-Individual de Riesgos
            </h3>
            <p className="text-xs text-text-secondary mt-1">
              Metodología Bio-Individual WAPPY · Fórmula: NS × NE × (1 - Factor percepción)
            </p>
          </div>
        </div>
        <BioMatrizIPEVAR workerId={workerId} />
      </div>
    </div>
  );
}
