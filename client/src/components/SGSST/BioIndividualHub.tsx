import React, { useState, useEffect, useCallback } from 'react';
import { useAuthContext } from '~/hooks';
import { useToastContext } from '@librechat/client';
import {
  Users, ChevronDown, ChevronRight, Activity, AlertTriangle,
  Loader2, Dna, TrendingUp, TrendingDown, Shield, Clock,
} from 'lucide-react';
import BioIndividuoDashboard from './BioIndividuoDashboard';

// ─── Types ───────────────────────────────────────────────────────────────────
interface Perfil {
  id: string;
  nombreCargo: string;
  area: string;
}

interface Worker {
  _id: string;
  nombre: string;
  documento: string;
  genero?: string;
  fechaNacimiento?: string;
  condicionesSalud?: string;
  fitScore?: number;
  fitAlerts?: string[];
  percepcionRiesgoScore?: number;
  riesgosBioIndividual?: any[];
  perfilId: string;
}

interface PerfilGroup {
  perfil: Perfil;
  workers: Worker[];
  isExpanded: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const calcularEdad = (fechaNacimiento?: string): number | null => {
  if (!fechaNacimiento) return null;
  const hoy = new Date();
  const nac = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
  return edad;
};

const CLASIFICACION_COLOR: Record<string, string> = {
  Crítico: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800',
  Alto: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800',
  Moderado: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
  Bajo: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800',
};

const FitGauge = ({ score }: { score: number }) => {
  const color = score >= 70 ? 'text-green-500' : score >= 40 ? 'text-amber-500' : 'text-red-500';
  const ring = score >= 70 ? 'stroke-green-500' : score >= 40 ? 'stroke-amber-500' : 'stroke-red-500';
  const r = 28;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div className="relative flex items-center justify-center w-16 h-16">
      <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r={r} fill="none" stroke="currentColor" strokeWidth="6" className="text-surface-secondary" />
        <circle cx="32" cy="32" r={r} fill="none" strokeWidth="6" className={ring}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
      </svg>
      <div className={`absolute text-center ${color}`}>
        <p className="text-xs font-black leading-none">{score}%</p>
        <p className="text-[9px] font-bold leading-none mt-0.5">FIT</p>
      </div>
    </div>
  );
};

const PercepcionBadge = ({ score }: { score: number }) => {
  const level = score >= 200 ? { label: 'Alta', icon: TrendingDown, color: 'text-green-600 bg-green-50 dark:bg-green-900/20' }
    : score >= 50 ? { label: 'Media', icon: Activity, color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20' }
    : { label: 'Baja', icon: TrendingUp, color: 'text-red-600 bg-red-50 dark:bg-red-900/20' };
  const Icon = level.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${level.color}`}>
      <Icon className="h-2.5 w-2.5" />
      Percepción {level.label}
    </span>
  );
};

// ─── Worker Card ─────────────────────────────────────────────────────────────
const WorkerCard = ({ worker, onVerDashboard }: { worker: Worker; onVerDashboard: (id: string) => void }) => {
  const edad = calcularEdad(worker.fechaNacimiento);
  const fitScore = worker.fitScore || 0;
  const percepcionPts = worker.percepcionRiesgoScore || 0;
  const riesgos = worker.riesgosBioIndividual || [];
  const riesgosCriticos = riesgos.filter(r => r.clasificacion_bio === 'Crítico' || r.clasificacion_bio === 'Alto').length;

  // Top clasificación
  const topClasificacion = riesgos.length > 0
    ? (riesgos.find(r => r.clasificacion_bio === 'Crítico')?.clasificacion_bio
      || riesgos.find(r => r.clasificacion_bio === 'Alto')?.clasificacion_bio
      || riesgos[0]?.clasificacion_bio)
    : null;

  const initials = worker.nombre.split(' ').slice(0, 2).map(n => n[0]?.toUpperCase()).join('');

  return (
    <div className="group bg-surface-primary border border-border-medium rounded-2xl p-4 hover:border-teal-400 hover:shadow-lg transition-all duration-200 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white font-black text-sm shrink-0">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-text-primary text-sm truncate">{worker.nombre}</p>
          <p className="text-xs text-text-secondary">CC: {worker.documento}</p>
          <p className="text-xs text-text-tertiary">
            {worker.genero || '—'}{edad ? ` · ${edad} años` : ''}
          </p>
        </div>
        {topClasificacion && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${CLASIFICACION_COLOR[topClasificacion] || ''}`}>
            {topClasificacion}
          </span>
        )}
      </div>

      {/* FIT + Percepción */}
      <div className="flex items-center gap-3">
        <FitGauge score={fitScore} />
        <div className="flex flex-col gap-1.5">
          <p className="text-[10px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wide flex items-center gap-1">
            <Dna className="h-3 w-3" /> Índice Biocéntrico
          </p>
          <PercepcionBadge score={percepcionPts} />
          {riesgos.length > 0 && (
            <p className="text-[10px] text-text-secondary flex items-center gap-1">
              <Shield className="h-2.5 w-2.5" />
              {riesgos.length} riesgo{riesgos.length !== 1 ? 's' : ''}
              {riesgosCriticos > 0 && <span className="text-red-500 font-bold">· {riesgosCriticos} prioritario{riesgosCriticos !== 1 ? 's' : ''}</span>}
            </p>
          )}
        </div>
      </div>

      {/* Alertas clínicas */}
      {(worker.fitAlerts || []).length > 0 && (
        <div className="flex flex-wrap gap-1">
          {(worker.fitAlerts || []).slice(0, 3).map(alert => (
            <span key={alert} className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 text-[9px] font-semibold rounded-full">
              <AlertTriangle className="h-2 w-2" /> {alert}
            </span>
          ))}
        </div>
      )}

      {/* Condiciones de salud */}
      {worker.condicionesSalud && worker.condicionesSalud.trim() && (
        <p className="text-[10px] text-text-tertiary line-clamp-1 italic">{worker.condicionesSalud}</p>
      )}

      {/* CTA */}
      <button
        onClick={() => onVerDashboard(worker._id)}
        className="mt-auto w-full py-2 px-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white text-xs font-bold rounded-xl hover:from-teal-600 hover:to-cyan-700 transition-all hover:-translate-y-0.5 active:scale-95 shadow-sm flex items-center justify-center gap-1.5"
      >
        <Activity className="h-3.5 w-3.5" /> Ver 360° Bio-Individual
      </button>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function BioIndividualHub() {
  const { token } = useAuthContext();
  const { showToast } = useToastContext();
  const [groups, setGroups] = useState<PerfilGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  const fetchData = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      // 1. Fetch perfiles de cargo
      const perfilesRes = await fetch('/api/sgsst/perfiles-cargo/data', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const perfilesData = await perfilesRes.json();
      const perfilesList: Perfil[] = perfilesData.perfilesList || [];

      // 2. Fetch perfil sociodemografico para saber qué cargo tiene cada trabajador
      const socioRes = await fetch('/api/sgsst/perfil-sociodemografico/data', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const socioData = await socioRes.json();
      const trabajadores = socioData.perfiles || socioData.trabajadores || [];

      // 3. Fetch SgsstWorkers (hoja de vida bio-individual)
      const workersAll: Worker[] = [];
      for (const perfil of perfilesList) {
        try {
          const wRes = await fetch(`/api/sgsst/workers/${perfil.id}?perfilNombre=${encodeURIComponent(perfil.nombreCargo)}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (wRes.ok) {
            const wData = await wRes.json();
            const ws = wData.workers || [];
            workersAll.push(...ws.map((w: any) => ({ ...w, perfilId: perfil.id })));
          }
        } catch { /* skip */ }
      }

      // 4. Merge fitScore & fitAlerts from sociodemografico
      const enrichedWorkers = workersAll.map(w => {
        const socio = trabajadores.find((t: any) =>
          String(t.identificacion || t.documento || '').trim() === String(w.documento || '').trim()
        );
        return {
          ...w,
          fitScore: socio?.biocentricScore ?? w.fitScore ?? 0,
          fitAlerts: socio?.biocentricAlerts ?? w.fitAlerts ?? [],
          condicionesSalud: w.condicionesSalud || socio?.condicionesSalud || socio?.diagnosticoMedico || '',
          fechaNacimiento: w.fechaNacimiento || socio?.fechaNacimiento || '',
          genero: w.genero || socio?.genero || '',
        };
      });

      // 5. Group by perfilId
      const grouped: PerfilGroup[] = perfilesList
        .map(perfil => ({
          perfil,
          workers: enrichedWorkers.filter(w => w.perfilId === perfil.id),
          isExpanded: true,
        }))
        .filter(g => g.workers.length > 0);

      setGroups(grouped);
    } catch (e) {
      console.error('[BioIndividualHub] Load error:', e);
      showToast({ message: 'Error cargando datos del hub bio-individual', status: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [token, lastRefresh]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const toggleGroup = (perfilId: string) => {
    setGroups(prev => prev.map(g =>
      g.perfil.id === perfilId ? { ...g, isExpanded: !g.isExpanded } : g
    ));
  };

  // ─── Vista: Dashboard 360° ────────────────────────────────────────────────
  if (selectedWorkerId) {
    return (
      <BioIndividuoDashboard
        workerId={selectedWorkerId}
        onBack={() => {
          setSelectedWorkerId(null);
          setLastRefresh(Date.now()); // Re-fetch for updated fitScore
        }}
      />
    );
  }

  // ─── Vista: Hub de Cargos ─────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48 gap-3 text-text-secondary">
        <Loader2 className="h-6 w-6 animate-spin text-teal-500" />
        <span className="text-sm">Cargando hub bio-individual...</span>
      </div>
    );
  }

  const totalWorkers = groups.reduce((acc, g) => acc + g.workers.length, 0);
  const totalCriticos = groups.reduce((acc, g) =>
    acc + g.workers.reduce((wa, w) =>
      wa + (w.riesgosBioIndividual || []).filter(r => r.clasificacion_bio === 'Crítico').length, 0), 0);

  return (
    <div className="flex flex-col gap-6 p-4">
      {/* ── Resumen ── */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-surface-secondary rounded-xl p-3 text-center border border-border-light">
          <p className="text-2xl font-black text-teal-500">{totalWorkers}</p>
          <p className="text-xs text-text-secondary mt-0.5">Trabajadores</p>
        </div>
        <div className="bg-surface-secondary rounded-xl p-3 text-center border border-border-light">
          <p className="text-2xl font-black text-text-primary">{groups.length}</p>
          <p className="text-xs text-text-secondary mt-0.5">Cargos activos</p>
        </div>
        <div className="bg-surface-secondary rounded-xl p-3 text-center border border-border-light">
          <p className={`text-2xl font-black ${totalCriticos > 0 ? 'text-red-500' : 'text-green-500'}`}>{totalCriticos}</p>
          <p className="text-xs text-text-secondary mt-0.5">Riesgos críticos</p>
        </div>
      </div>

      {/* ── Sin datos ── */}
      {groups.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-border-medium rounded-2xl text-text-secondary gap-4">
          <Users className="h-12 w-12 opacity-20" />
          <div className="text-center">
            <p className="font-semibold text-sm">Sin trabajadores registrados</p>
            <p className="text-xs opacity-70 mt-1 max-w-xs">
              Registra trabajadores en el módulo <strong>Perfil Sociodemográfico</strong> y asígnales un cargo para que aparezcan aquí.
            </p>
          </div>
        </div>
      )}

      {/* ── Grupos por cargo ── */}
      {groups.map(({ perfil, workers, isExpanded }) => (
        <div key={perfil.id} className="border border-border-medium rounded-2xl overflow-hidden">
          {/* Cargo header */}
          <button
            onClick={() => toggleGroup(perfil.id)}
            className="w-full flex items-center justify-between px-4 py-3 bg-surface-secondary hover:bg-surface-hover transition-colors"
          >
            <div className="flex items-center gap-3">
              {isExpanded ? <ChevronDown className="h-4 w-4 text-teal-500" /> : <ChevronRight className="h-4 w-4 text-text-secondary" />}
              <div className="text-left">
                <p className="font-bold text-text-primary text-sm">{perfil.nombreCargo}</p>
                <p className="text-xs text-text-secondary">{perfil.area}</p>
              </div>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 rounded-full border border-teal-200 dark:border-teal-800">
              {workers.length} trabajador{workers.length !== 1 ? 'es' : ''}
            </span>
          </button>

          {/* Workers grid */}
          {isExpanded && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-3 bg-surface-primary/50">
              {workers.map(worker => (
                <WorkerCard
                  key={worker._id}
                  worker={worker}
                  onVerDashboard={setSelectedWorkerId}
                />
              ))}
            </div>
          )}
        </div>
      ))}

      {/* ── Footer ── */}
      {totalWorkers > 0 && (
        <p className="text-center text-xs text-text-tertiary flex items-center justify-center gap-1.5">
          <Clock className="h-3 w-3" />
          Actualizado al abrir · Los puntos de percepción se actualizan automáticamente desde los módulos de Actos, ATEL y Capacitaciones.
        </p>
      )}
    </div>
  );
}
