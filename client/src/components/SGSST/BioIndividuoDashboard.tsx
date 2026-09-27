import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuthContext } from '~/hooks';
import {
  ArrowLeft, User, Activity, AlertTriangle, Shield,
  Calendar, FileText, Dna, TrendingUp, TrendingDown,
  Clock, Award, Zap, ChevronDown, ChevronRight, BarChart2,
  CheckCircle2, Heart, Eye, ShieldAlert, Pill, Briefcase,
  MapPin, Building2, RefreshCw, Stethoscope, Sparkles, Loader2, History,
} from 'lucide-react';
import { useToastContext } from '@librechat/client';
import BioMatrizIPEVAR from './BioMatrizIPEVAR';
import BioMatrizIPEVARDashboard from './BioMatrizIPEVARDashboard';
import { ToolbarButton } from './SGSSTToolbar';
import CollapsibleReportBox from './CollapsibleReportBox';
import LiveEditor, { type LiveEditorHandle } from '~/components/Liva/Editor/LiveEditor';
import ReportHistory from '~/components/Liva/ReportHistory';
import ExportDropdown from './ExportDropdown';
import ModelSelector from './ModelSelector';

// ─── FIT Gauge ────────────────────────────────────────────────────────────────
const FitGauge = ({ score, alerts = [] }: { score: number; alerts?: string[] }) => {
  const color = score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444';
  const label = score >= 70 ? 'ÓPTIMO' : score >= 40 ? 'MODERADO' : 'CRÍTICO';
  const r = 52;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;

  return (
    <div className="flex flex-col items-center justify-between h-full gap-4">
      <div className="w-full text-center">
        <p className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-widest flex items-center justify-center gap-1.5">
          <Dna className="h-3.5 w-3.5" /> Índice Biocéntrico Integral
        </p>
        <p className="text-[11px] text-text-tertiary mt-0.5">Compatibilidad clínica vs perfil de riesgo del cargo</p>
      </div>

      <div className="relative w-36 h-36 my-1">
        <svg className="w-36 h-36 -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={r} fill="none" stroke="currentColor" strokeWidth="10" className="text-surface-hover/60" />
          <circle
            cx="60"
            cy="60"
            r={r}
            fill="none"
            strokeWidth="10"
            style={{
              stroke: color,
              strokeDasharray: `${dash} ${circ}`,
              strokeLinecap: 'round',
              transition: 'stroke-dasharray 1s ease',
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <p className="text-3xl font-black tracking-tight" style={{ color }}>{score}%</p>
          <p className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">FIT SCORE</p>
          <span
            className="text-[9px] font-black px-2 py-0.5 rounded-full mt-0.5 uppercase tracking-wider text-white"
            style={{ backgroundColor: color }}
          >
            {label}
          </span>
        </div>
      </div>

      {alerts.length > 0 ? (
        <div className="flex flex-col gap-1.5 w-full">
          {alerts.map(alert => (
            <div
              key={alert}
              className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/25 rounded-xl shadow-2xs"
            >
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-300">{alert}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center gap-1.5 py-1 px-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-700 dark:text-emerald-300 text-xs font-semibold w-full">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span>Perfil biocéntrico balanceado</span>
        </div>
      )}
    </div>
  );
};

// ─── Perception Score Badge ───────────────────────────────────────────────────
const PercepcionScore = ({ score }: { score: number }) => {
  const factorReduccion = Math.min(score / 500, 0.40);
  const level = score >= 200
    ? { label: 'Cultura Preventiva Alta', Icon: TrendingDown, color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-50/80 dark:bg-emerald-950/30', border: 'border-emerald-200 dark:border-emerald-800', barColor: '#10b981' }
    : score >= 50
    ? { label: 'Cultura Preventiva Media', Icon: Activity, color: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-50/80 dark:bg-amber-950/30', border: 'border-amber-200 dark:border-amber-800', barColor: '#f59e0b' }
    : score > 0
    ? { label: 'Cultura en Desarrollo', Icon: TrendingUp, color: 'text-teal-700 dark:text-teal-300', bg: 'bg-teal-50/80 dark:bg-teal-950/30', border: 'border-teal-200 dark:border-teal-800', barColor: '#0d9488' }
    : { label: 'Nivel Inicial / Sin Eventos', Icon: Award, color: 'text-slate-700 dark:text-zinc-300', bg: 'bg-slate-50/80 dark:bg-zinc-800/50', border: 'border-slate-200 dark:border-zinc-700', barColor: '#94a3b8' };

  return (
    <div className={`rounded-2xl p-4 border shadow-sm ${level.bg} ${level.border}`}>
      <div className="flex items-center justify-between mb-2">
        <p className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${level.color}`}>
          <level.Icon className="h-3.5 w-3.5" />
          Percepción del Riesgo
        </p>
        <span className={`text-xl font-black ${level.color}`}>{score} pts</span>
      </div>
      <div className="w-full bg-surface-secondary/80 rounded-full h-2 mb-2 overflow-hidden border border-border-light/60">
        <div
          className="h-2 rounded-full transition-all duration-700"
          style={{ width: `${Math.min((score / 500) * 100, 100)}%`, backgroundColor: level.barColor }}
        />
      </div>
      <div className="flex items-center justify-between text-[11px] text-text-tertiary">
        <span>Estado: <strong className="text-text-primary">{level.label}</strong></span>
        {score > 0 ? (
          <span className="font-bold text-teal-600 dark:text-teal-400">
            Reducción IPEVR: -{(factorReduccion * 100).toFixed(0)}%
          </span>
        ) : (
          <span className="italic">Modulador activo al reportar</span>
        )}
      </div>
    </div>
  );
};

// ─── Parser de Ficha Clínica y Sociodemográfica ─────────────────────────────
const parseHealthProfile = (worker: any) => {
  const socio = worker?.socioRaw || {};
  const rawStr = worker?.condicionesSalud || '';
  const parsedMap: Record<string, string> = {};

  if (rawStr) {
    rawStr.split(';').forEach((chunk: string) => {
      const idx = chunk.indexOf(':');
      if (idx !== -1) {
        const k = chunk.slice(0, idx).trim().toLowerCase();
        const v = chunk.slice(idx + 1).trim();
        parsedMap[k] = v;
      }
    });
  }

  const isNeg = (val?: string) => {
    if (!val) return true;
    const v = val.trim().toLowerCase();
    const negs = [
      'ninguno', 'ninguna', 'ninguna conocida', 'ninguna reportada', 'no',
      'niega', 'sin hallazgos', 'normal', 'no aplica', 'n/a', 'sano', 'sin patologías', 'sin patologias', 'sin antecedentes'
    ];
    return negs.includes(v) || v.startsWith('ningun');
  };

  const getField = (directVal?: string, mapKeys: string[] = []) => {
    if (directVal && !isNeg(directVal)) return directVal;
    for (const k of mapKeys) {
      const v = parsedMap[k];
      if (v && !isNeg(v)) return v;
    }
    return '';
  };

  const diag = socio.diagnosticoMedico || parsedMap['diagnóstico médico'] || parsedMap['diagnostico medico'] || '';
  const recs = getField(socio.recomendacionesMedicas, ['recomendaciones médicas', 'recomendaciones medicas']);
  const lims = getField(socio.limitacionesBiomecanicas, ['limitaciones biomecánicas', 'limitaciones biomecanicas']);
  const enfs = getField(socio.enfermedades, ['enfermedades/antecedentes', 'enfermedades', 'antecedentes']);
  const meds = getField(socio.medicamentos, ['medicamentos']);
  const algs = getField(socio.alergiasQuimicas, ['alergias químicas/físicas', 'alergias quimicas/fisicas', 'alergias']);
  const fuma = (socio.fuma || parsedMap['fuma'] || '').trim().toLowerCase();
  const alcohol = (socio.alcohol || parsedMap['alcohol'] || '').trim().toLowerCase();

  let aptitud = 'Apto para el Cargo';
  let aptitudBadge = 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/80';
  let aptitudIcon = CheckCircle2;

  const lowDiag = diag.toLowerCase();
  if (lowDiag.includes('no apto')) {
    aptitud = 'No Apto para el Cargo';
    aptitudBadge = 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800/80';
    aptitudIcon = AlertTriangle;
  } else if (lowDiag.includes('restricci') || lims) {
    aptitud = 'Apto con Restricciones Laborales';
    aptitudBadge = 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/80';
    aptitudIcon = AlertTriangle;
  } else if (lowDiag.includes('recomendaci') || recs) {
    aptitud = 'Apto con Recomendaciones Preventivas';
    aptitudBadge = 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800/80';
    aptitudIcon = CheckCircle2;
  } else if (diag && !isNeg(diag)) {
    aptitud = diag;
  }

  const findings: Array<{ label: string; text: string; icon: any; colorClass: string }> = [];

  if (recs) {
    findings.push({
      label: 'Recomendación Preventiva',
      text: recs,
      icon: Eye,
      colorClass: 'bg-blue-50/80 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800/60',
    });
  }

  if (lims) {
    findings.push({
      label: 'Limitación Biomecánica',
      text: lims,
      icon: AlertTriangle,
      colorClass: 'bg-amber-50/80 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/60',
    });
  }

  if (enfs) {
    findings.push({
      label: 'Patología / Antecedente',
      text: enfs,
      icon: Heart,
      colorClass: 'bg-rose-50/80 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800/60',
    });
  }

  if (meds) {
    findings.push({
      label: 'Tratamiento Médico',
      text: meds,
      icon: Pill,
      colorClass: 'bg-purple-50/80 dark:bg-purple-950/30 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800/60',
    });
  }

  if (algs) {
    findings.push({
      label: 'Alergias Identificadas',
      text: algs,
      icon: ShieldAlert,
      colorClass: 'bg-orange-50/80 dark:bg-orange-950/30 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-800/60',
    });
  }

  const isHealthyHabits = fuma === 'no' || alcohol === 'no';

  return {
    aptitud,
    aptitudBadge,
    aptitudIcon,
    findings,
    isHealthyHabits,
    fuma,
    alcohol,
  };
};

const calculateAge = (dob: any) => {
  if (!dob) return null;
  const birth = new Date(dob);
  if (isNaN(birth.getTime())) return null;
  const diff = Date.now() - birth.getTime();
  const ageDt = new Date(diff);
  return Math.abs(ageDt.getUTCFullYear() - 1970);
};

// ─── Historial de eventos ─────────────────────────────────────────────────────
const MODULO_LABELS: Record<string, { label: string; color: string }> = {
  actos: { label: 'Reporte Actos', color: 'text-orange-500' },
  participacion_ipevar: { label: 'Participación IPEVR', color: 'text-teal-500' },
  atel: { label: 'ATEL', color: 'text-red-500' },
  capacitacion: { label: 'Capacitación', color: 'text-blue-500' },
  ats: { label: 'ATS', color: 'text-purple-500' },
  perfil_socio: { label: 'Perfil Sociodemográfico', color: 'text-emerald-500' },
  comites: { label: 'Comités SST', color: 'text-indigo-500' },
  termometro_animo: { label: 'Termómetro Psicosocial', color: 'text-cyan-500' },
  estudio_puesto: { label: 'Auto-evaluación EPT', color: 'text-violet-500' },
  disciplinario: { label: 'Proceso Disciplinario', color: 'text-rose-600' },
  convivencia: { label: 'Comité Convivencia', color: 'text-pink-500' },
};

const PercepcionHistorial = ({ historial }: { historial: any[] }) => {
  const [expanded, setExpanded] = useState(false);
  if (!historial || historial.length === 0) return null;
  const visible = expanded ? historial : historial.slice(-5).reverse();

  return (
    <div className="bg-surface-secondary border border-border-medium rounded-2xl p-4 shadow-sm">
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-between text-left">
        <p className="text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
          <Award className="h-3.5 w-3.5 text-teal-600" />
          Historial de Aportes a la Percepción del Riesgo
        </p>
        {expanded ? <ChevronDown className="h-3.5 w-3.5 text-text-tertiary" /> : <ChevronRight className="h-3.5 w-3.5 text-text-tertiary" />}
      </button>
      <div className="mt-3 space-y-1.5">
        {visible.map((h, i) => {
          const mod = MODULO_LABELS[h.modulo] || { label: h.modulo, color: 'text-text-secondary' };
          const isPositive = h.puntos >= 0;
          return (
            <div key={i} className="flex items-center justify-between text-xs py-1.5 border-b border-border-light dark:border-white/5 last:border-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className={`text-[10px] font-bold shrink-0 ${mod.color}`}>{mod.label}</span>
                <span className="text-text-secondary truncate max-w-[280px]" title={h.accion}>{h.accion}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`font-bold ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
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
        <button onClick={() => setExpanded(!expanded)} className="text-[10px] font-bold text-teal-600 hover:text-teal-700 mt-2">
          {expanded ? 'Ver menos' : `Ver ${historial.length - 5} eventos anteriores`}
        </button>
      )}
    </div>
  );
};

// ─── Componente Principal ──────────────────────────────────────────────────────
interface BioIndividuoDashboardProps {
  workerId: string;
  onBack: () => void;
}

export default function BioIndividuoDashboard({ workerId, onBack }: BioIndividuoDashboardProps) {
  const { token } = useAuthContext();
  const { showToast } = useToastContext();
  const [worker, setWorker] = useState<any>(null);
  const [companyInfo, setCompanyInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'matriz' | 'analytics'>('matriz');

  // ─── Estado del Editor & Informe IA ──────────────────────────────────────────
  const [reportContent, setReportContent] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSavingReport, setIsSavingReport] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [reportConversationId, setReportConversationId] = useState<string | null>(null);
  const [reportMessageId, setReportMessageId] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.8-flash');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const liveEditorRef = useRef<LiveEditorHandle>(null);
  const reportContentRef = useRef<string>('');

  const fetchWorker = useCallback(async () => {
    try {
      setIsLoading(true);
      const [res, socioRes, compRes] = await Promise.all([
        fetch(`/api/sgsst/workers/worker/${workerId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/sgsst/perfil-sociodemografico/data', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/sgsst/company-info', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      let compData: any = null;
      if (compRes.ok) {
        compData = await compRes.json();
        setCompanyInfo(compData);
      }

      if (res.ok) {
        const data = await res.json();
        let w = data.worker || {};

        if (socioRes.ok) {
          const socioData = await socioRes.json();
          const trabajadores = socioData.perfiles || socioData.trabajadores || [];
          const socio = trabajadores.find((t: any) =>
            String(t.identificacion || t.documento || '').trim() === String(w.documento || '').trim()
          );
          if (socio) {
            w = {
              ...w,
              cargo: w.cargo || socio.cargo || '',
              area: socio.area || socio.proceso || w.area || '',
              sede: socio.sede || w.sede || '',
              edad: socio.edad || '',
              fechaNacimiento: w.fechaNacimiento || socio.fechaNacimiento || null,
              eps: socio.eps || w.eps || '',
              afp: socio.afp || w.afp || '',
              estadoPila: socio.estadoPila || w.estadoPila || 'Pendiente de soporte PILA',
              arl: compData?.arl || socio.arl || w.arl || '',
              rh: socio.rh || socio.grupoSanguineo || '',
              diagnosticoMedico: socio.diagnosticoMedico || '',
              recomendacionesMedicas: socio.recomendacionesMedicas || '',
              enfermedades: socio.enfermedades || '',
              medicamentos: socio.medicamentos || '',
              limitacionesBiomecanicas: socio.limitacionesBiomecanicas || '',
              alergiasQuimicas: socio.alergiasQuimicas || '',
              fuma: socio.fuma || '',
              alcohol: socio.alcohol || '',
              fitScore: socio.biocentricScore ?? w.fitScore ?? 0,
              fitAlerts: socio.biocentricAlerts ?? w.fitAlerts ?? [],
              condicionesSalud: w.condicionesSalud || socio.condicionesSalud || socio.diagnosticoMedico || '',
              socioRaw: socio,
            };
          }
        }

        if (!w.arl && compData?.arl) {
          w.arl = compData.arl;
        }

        if (w.bioReportContent && !reportContentRef.current) {
          setReportContent(w.bioReportContent);
          reportContentRef.current = w.bioReportContent;
        }

        setWorker(w);
      } else {
        const errData = await res.json().catch(() => ({}));
        console.error('[BioIndividuoDashboard] Error loading worker:', res.status, errData);
        showToast({ message: errData.error || 'No se pudo cargar el perfil del trabajador', status: 'error' });
      }
    } catch (e) {
      console.error('[BioIndividuoDashboard] Network/Fetch error:', e);
      showToast({ message: 'Error de conexión al cargar datos del trabajador', status: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [workerId, token, showToast]);

  useEffect(() => { fetchWorker(); }, [fetchWorker]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchWorker();
    setIsRefreshing(false);
  };

  const handleAnalyzeBioReport = async () => {
    if (!token || !worker) return;
    const rows = worker.riesgosBioIndividual || [];
    if (!rows.length) {
      showToast({
        message: 'No hay riesgos registrados en la matriz Bio-Individual para analizar.',
        status: 'warning',
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const mappedRows = rows.map((r: any) => ({
        id: r.id,
        dominio_bio: r.dominio_bio || 'Osteomuscular',
        dimension_bio: r.dimension_bio || '',
        origen_riesgo: r.origen_riesgo || 'Inherente a la Tarea',
        peligro_cargo: r.peligro_cargo || '',
        actividad_expuesta: r.actividad_expuesta || '',
        efectos_posibles: r.efectos_posibles || '',
        factor_individual: r.factor_individual || '',
        controles_fuente: r.controles_fuente || '',
        controles_medio: r.controles_medio || '',
        controles_individuo: r.controles_individuo || '',
        fit_score: r.fit_score || worker.fitScore || 0,
        percepcion_riesgo_pts: r.percepcion_riesgo_pts || worker.percepcionRiesgoScore || 0,
        nivel_susceptibilidad: r.nivel_susceptibilidad || 1,
        nivel_exposicion: r.nivel_exposicion || 1,
        indice_bio_riesgo_bruto: r.indice_bio_riesgo_bruto || ((r.nivel_susceptibilidad || 1) * (r.nivel_exposicion || 1)),
        factor_reduccion_percepcion: r.factor_reduccion_percepcion || 0,
        indice_bio_riesgo_efectivo: r.indice_bio_riesgo_efectivo || r.indice_bio_riesgo_bruto || 1,
        clasificacion_bio: r.clasificacion_bio || 'Moderado',
        intervencion_prioritaria: !!r.intervencion_prioritaria,
        medida_eliminacion: r.medida_eliminacion || '',
        medida_sustitucion: r.medida_sustitucion || '',
        medida_ingenieria: r.medida_ingenieria || '',
        medida_administrativa: r.medida_administrativa || '',
        medida_eppu: r.medida_eppu || '',
        factores_reduccion_texto: r.factores_reduccion_texto || '',
        plan_accion_bio: r.plan_accion_bio || '',
        restricciones_laborales: r.restricciones_laborales || '',
        seguimiento_medico: r.seguimiento_medico || 'Anual',
      }));

      const res = await fetch('/api/sgsst/gtc45-workspace/ai-analyze-matrix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          matrixRows: mappedRows,
          workerId: worker._id,
          isBioIndividual: true,
          workerData: {
            nombre: worker.nombre,
            documento: worker.documento,
            cargo: worker.cargo,
            fechaNacimiento: worker.fechaNacimiento,
            genero: worker.genero,
            fechaIngreso: worker.fechaIngreso,
            condicionesSalud: worker.condicionesSalud,
            fitScore: worker.fitScore,
            fitAlerts: worker.fitAlerts,
            percepcionRiesgoScore: worker.percepcionRiesgoScore,
            eps: worker.eps,
            afp: worker.afp,
            estadoPila: worker.estadoPila,
          },
          modelName: selectedModel,
          instruction: `Emitir dictamen técnico biocéntrico de altísimo nivel pericial bajo la Metodología Bio-Individual WAPPY (Centricidad en el Trabajador), enfocado específicamente en el colaborador ${worker.nombre}, cargo ${worker.cargo || 'Operativo'}, analizando sus antecedentes clínicos (${worker.condicionesSalud || 'Ninguno registrado'}), la amortiguación del modulador activo de percepción del riesgo, los 8 dominios bio-fisiológicos y formulando el plan individualizado de preservación y readaptación ergonómica.`,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.analysis) {
          setReportContent(data.analysis);
          reportContentRef.current = data.analysis;
          liveEditorRef.current?.setHTML(data.analysis);

          // Persistir en el documento del colaborador
          await fetch(`/api/sgsst/workers/${worker._id}/bio-ipevar`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              riesgosBioIndividual: worker.riesgosBioIndividual,
              bioChartConclusions: worker.bioChartConclusions,
              bioReportContent: data.analysis,
            }),
          }).catch(() => {});

          showToast({
            message: '¡Dictamen Biocéntrico generado con IA exitosamente!',
            status: 'success',
          });

          setTimeout(() => {
            document.getElementById('bio-report-editor')?.scrollIntoView({ behavior: 'smooth' });
          }, 300);
        }
      } else {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Error al generar dictamen con IA');
      }
    } catch (e: any) {
      console.error('[BioIndividuo] AI report error:', e);
      showToast({
        message: e.message || 'Error al generar informe bio-individual con IA',
        status: 'error',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveReport = async () => {
    const contentToSave = reportContentRef.current || reportContent;
    if (!contentToSave || !token || !worker) return;

    setIsSavingReport(true);
    try {
      const isNew = !reportConversationId || reportConversationId === 'new';
      const res = await fetch('/api/sgsst/diagnostico/save-report', {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(
          isNew
            ? {
                content: contentToSave,
                title: `Dictamen Bio-IPEVR - ${worker.nombre} - ${new Date().toLocaleDateString('es-CO')}`,
                tags: ['sgsst-bio-ipevar', `worker-${worker._id}`],
              }
            : {
                conversationId: reportConversationId,
                messageId: reportMessageId,
                content: contentToSave,
              }
        ),
      });

      if (res.ok) {
        const data = await res.json();
        if (isNew) {
          setReportConversationId(data.conversationId);
          setReportMessageId(data.messageId);
        }

        // Actualizar bioReportContent en SgsstWorker
        await fetch(`/api/sgsst/workers/${worker._id}/bio-ipevar`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            riesgosBioIndividual: worker.riesgosBioIndividual,
            bioChartConclusions: worker.bioChartConclusions,
            bioReportContent: contentToSave,
          }),
        }).catch(() => {});

        setRefreshTrigger((prev) => prev + 1);
        setIsHistoryOpen(false);
        showToast({
          message: '¡Informe guardado en el historial de SGSST exitosamente!',
          status: 'success',
        });
      } else {
        throw new Error('Error al guardar el informe');
      }
    } catch (e: any) {
      console.error('[BioIndividuo] Save error:', e);
      showToast({
        message: e.message || 'No se pudo guardar el informe.',
        status: 'error',
      });
    } finally {
      setIsSavingReport(false);
    }
  };

  const handleSelectReport = async (reportOrId: any) => {
    let content = '', convId = '', msgId = '';
    if (typeof reportOrId === 'string') {
      convId = reportOrId;
      try {
        const res = await fetch(`/api/messages/${convId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const messages = await res.json();
          const reportMsg = messages
            .reverse()
            .find(
              (m: any) =>
                m.sender === 'SGSST Diagnóstico' ||
                (m.isCreatedByUser === false && m.text?.length > 100)
            );
          if (reportMsg) {
            content = reportMsg.text;
            msgId = reportMsg.messageId;
          }
        }
      } catch (e) {
        console.error('[BioIndividuo] Load message error:', e);
      }
    } else if (reportOrId?.content) {
      content = reportOrId.content;
      convId = reportOrId.conversationId;
      msgId = reportOrId.messageId;
    }

    if (content) {
      setReportContent(content);
      reportContentRef.current = content;
      setReportConversationId(convId);
      setReportMessageId(msgId);
      liveEditorRef.current?.setHTML(content);
      setIsHistoryOpen(false);
      showToast({
        message: 'Informe cargado desde el historial.',
        status: 'success',
      });
    }
  };

  const healthProfile = useMemo(() => parseHealthProfile(worker), [worker]);
  const workerAge = useMemo(() => calculateAge(worker?.fechaNacimiento) || worker?.edad, [worker]);

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center py-20 gap-3 text-text-secondary">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-500" />
        <span className="text-xs font-semibold text-text-secondary">Cargando perfil bio-individual 360°...</span>
      </div>
    );
  }

  if (!worker) {
    return (
      <div className="p-12 text-center flex flex-col items-center justify-center gap-4 bg-surface-primary border border-border-medium rounded-2xl shadow-sm my-6">
        <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/40 text-red-500 flex items-center justify-center font-bold text-lg">
          !
        </div>
        <div>
          <p className="text-text-primary text-sm font-bold">Colaborador no encontrado</p>
          <p className="text-text-secondary text-xs mt-1 max-w-sm">
            No se pudo sincronizar la información del trabajador seleccionado. Verifica que esté registrado en el censo sociodemográfico.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 p-1.5 rounded-2xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-slate-200/80 dark:border-zinc-800 shadow-md">
          <ToolbarButton
            id="err-back"
            onClick={onBack}
            label="Volver al Hub"
            icon={ArrowLeft}
            title="Volver al Hub"
            variant="default"
          />
          <ToolbarButton
            id="err-retry"
            onClick={handleRefresh}
            label="Reintentar"
            icon={RefreshCw}
            title="Reintentar conexión"
            variant="ai"
            isLoading={isRefreshing}
          />
        </div>
      </div>
    );
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
  const termometroAnimo: any[] = (worker.termometro_animo && worker.termometro_animo.length > 0)
    ? worker.termometro_animo
    : (worker.percepcionRiesgoHistorial || []).filter((h: any) => h.modulo === 'termometro_animo');
  const riesgosBio: any[] = worker.riesgosBioIndividual || [];
  const riesgosCriticos = riesgosBio.filter(r => r.clasificacion_bio === 'Crítico').length;
  const riesgosAltos = riesgosBio.filter(r => r.clasificacion_bio === 'Alto').length;

  return (
    <div className="w-full space-y-6 animate-in fade-in slide-in-from-right-8 duration-300 overflow-y-auto pb-10">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border-medium pb-4">
        <div className="flex items-center gap-3 min-w-0">
          {/* Botonera Cápsula Estilo WAPPY */}
          <div className="inline-flex items-center gap-1.5 p-1.5 rounded-2xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-slate-200/80 dark:border-zinc-800 shadow-md shadow-slate-200/30 dark:shadow-none shrink-0">
            <ToolbarButton
              id="bio-back"
              onClick={onBack}
              label="Volver al Hub"
              icon={ArrowLeft}
              title="Volver al Hub de Colaboradores"
              variant="default"
            />
            <ToolbarButton
              id="bio-refresh"
              onClick={handleRefresh}
              label="Actualizar"
              icon={RefreshCw}
              title="Recargar ficha 360° del colaborador"
              variant="default"
              isLoading={isRefreshing}
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-black text-text-primary flex items-center gap-2 truncate">
                <Dna className="h-6 w-6 text-teal-600 shrink-0" />
                <span className="truncate">{worker.nombre}</span>
              </h2>
              {worker.cargo && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 truncate">
                  <Briefcase className="w-3 h-3 shrink-0" />
                  <span className="truncate">{worker.cargo}</span>
                </span>
              )}
            </div>
            <p className="text-xs text-text-secondary mt-0.5 flex items-center gap-2 flex-wrap">
              <span>C.C. {worker.documento}</span>
              {(worker.area || worker.sede) && (
                <>
                  <span>•</span>
                  <span>{worker.area || worker.sede}</span>
                </>
              )}
              <span>•</span>
              <span className="text-teal-600 dark:text-teal-400 font-semibold">Perfil 360° Bio-Individual</span>
            </p>
          </div>
        </div>
      </div>

      {/* ── FIT + Ficha Técnica + Percepción ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* FIT Gauge (Columna Izquierda: 3 cols) */}
        <div className="lg:col-span-3 bg-surface-secondary border border-border-medium rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <FitGauge score={fitScore} alerts={fitAlerts} />
        </div>

        {/* Datos Laborales & Salud Ocupacional (Columna Central: 6 cols) */}
        <div className="lg:col-span-6 flex flex-col gap-3">
          {/* Card 1: Datos Laborales & Operativos */}
          <div className="bg-surface-secondary border border-border-medium rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3 border-b border-border-light dark:border-white/5 pb-2">
              <h3 className="font-bold text-xs text-text-secondary uppercase tracking-widest flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-teal-600" /> Datos Laborales & Puesto de Trabajo
              </h3>
              {worker.cargo && (
                <span className="text-[11px] font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded-lg border border-teal-200 dark:border-teal-800/80">
                  {worker.cargo}
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3 text-xs">
              <div>
                <span className="text-text-tertiary block font-semibold text-[10px] uppercase">Identificación</span>
                <span className="text-text-primary font-bold">{worker.documento}</span>
              </div>
              <div>
                <span className="text-text-tertiary block font-semibold text-[10px] uppercase">Área / Proceso</span>
                <span className="text-text-primary font-medium">{worker.area || 'Operaciones / Planta'}</span>
              </div>
              <div>
                <span className="text-text-tertiary block font-semibold text-[10px] uppercase">Sede de Trabajo</span>
                <span className="text-text-primary font-medium">{worker.sede || 'Principal'}</span>
              </div>
              <div>
                <span className="text-text-tertiary block font-semibold text-[10px] uppercase">Género & Edad</span>
                <span className="text-text-primary font-medium">
                  {worker.genero || '—'}{workerAge ? ` · ${workerAge} años` : ''}
                </span>
              </div>
              <div>
                <span className="text-text-tertiary block font-semibold text-[10px] uppercase">Fecha de Ingreso</span>
                <span className="text-text-primary font-medium">
                  {worker.fechaIngreso ? new Date(worker.fechaIngreso).toLocaleDateString('es-CO') : '—'}
                </span>
              </div>
              <div>
                <span className="text-text-tertiary block font-semibold text-[10px] uppercase">ARL (Empresa)</span>
                <span className="text-teal-700 dark:text-teal-300 font-bold flex items-center gap-1 truncate">
                  <Shield className="w-3 h-3 text-teal-600 shrink-0" />
                  {companyInfo?.arl || worker.arl || 'Empresa (General)'}
                </span>
              </div>
            </div>

            {/* Bloque Seguridad Social (EPS, AFP y Estado PILA) */}
            <div className="mt-3 pt-3 border-t border-border-light dark:border-white/5 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex flex-wrap items-center gap-3">
                <div>
                  <span className="text-text-tertiary block text-[9px] font-bold uppercase">EPS</span>
                  <span className="font-semibold text-text-primary">{worker.eps || 'Por registrar'}</span>
                </div>
                <div className="h-6 w-px bg-border-light dark:bg-white/10 hidden sm:block" />
                <div>
                  <span className="text-text-tertiary block text-[9px] font-bold uppercase">Fondo de Pensiones (AFP)</span>
                  <span className="font-semibold text-text-primary">{worker.afp || 'Por registrar'}</span>
                </div>
              </div>
              <div>
                <span className="text-text-tertiary block text-[9px] font-bold uppercase text-right sm:text-left">Soporte PILA</span>
                {(() => {
                  const status = (worker.estadoPila || 'Pendiente de soporte PILA').trim();
                  const isVerified = status.toLowerCase().includes('verificad') || status.toLowerCase().includes('al día') || status.toLowerCase().includes('al dia');
                  const isMora = status.toLowerCase().includes('mora') || status.toLowerCase().includes('sin cobertura');
                  const badgeClass = isVerified
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                    : isMora
                    ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                    : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
                  return (
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badgeClass}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isVerified ? 'bg-emerald-500' : isMora ? 'bg-rose-500' : 'bg-amber-500'}`} />
                      {status}
                    </span>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Card 2: Concepto de Salud Ocupacional & Hallazgos */}
          <div className="bg-surface-secondary border border-border-medium rounded-2xl p-4 shadow-sm flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs text-text-secondary uppercase tracking-widest flex items-center gap-1.5">
                <Stethoscope className="h-3.5 w-3.5 text-teal-600" /> Salud Ocupacional & Hallazgos
              </h3>
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${healthProfile.aptitudBadge}`}>
                <healthProfile.aptitudIcon className="w-3.5 h-3.5 shrink-0" />
                <span>{healthProfile.aptitud}</span>
              </div>
            </div>

            {/* Hallazgos Relevantes */}
            {healthProfile.findings.length > 0 ? (
              <div className="space-y-1.5 mt-1">
                {healthProfile.findings.map((f, idx) => (
                  <div key={idx} className={`p-2.5 rounded-xl border text-xs ${f.colorClass} flex items-start gap-2.5 shadow-2xs`}>
                    <f.icon className="w-4 h-4 shrink-0 mt-0.5 opacity-90" />
                    <div className="flex-1 min-w-0">
                      <span className="font-bold text-[10px] uppercase tracking-wider block opacity-80">{f.label}</span>
                      <p className="font-semibold text-xs leading-snug mt-0.5">{f.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Examen Ocupacional Vigente: Sin antecedentes patológicos ni restricciones laborales activas.</span>
              </div>
            )}

            {/* Hábitos de Vida */}
            {healthProfile.isHealthyHabits && (
              <div className="flex items-center gap-2 text-[11px] text-text-tertiary pt-1 border-t border-border-light dark:border-white/5">
                <span className="font-bold text-text-secondary">Hábitos:</span>
                {healthProfile.fuma === 'no' && <span className="bg-surface-primary px-2 py-0.5 rounded-md border border-border-light">🚭 No fumador</span>}
                {healthProfile.alcohol === 'no' && <span className="bg-surface-primary px-2 py-0.5 rounded-md border border-border-light">🍷 Hábitos saludables</span>}
              </div>
            )}
          </div>
        </div>

        {/* Percepción Score + Resumen Bio-Riesgos (Columna Derecha: 3 cols) */}
        <div className="lg:col-span-3 flex flex-col gap-3 justify-between">
          <PercepcionScore score={percepcionScore} />

          {/* Resumen Bio-Riesgos */}
          <div className="bg-surface-secondary border border-border-medium rounded-2xl p-4 shadow-sm">
            <p className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-teal-600" /> Resumen Bio-Riesgos
            </p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
                <p className="text-2xl font-black text-red-600 dark:text-red-400">{riesgosCriticos}</p>
                <p className="text-[10px] font-bold text-red-700 dark:text-red-300 uppercase">Críticos</p>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <p className="text-2xl font-black text-amber-600 dark:text-amber-400">{riesgosAltos}</p>
                <p className="text-[10px] font-bold text-amber-700 dark:text-amber-300 uppercase">Altos</p>
              </div>
              <div className="p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/20">
                <p className="text-2xl font-black text-teal-600 dark:text-teal-300">{riesgosBio.length}</p>
                <p className="text-[10px] font-bold text-teal-700 dark:text-teal-300 uppercase">Total</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Hoja de Vida Preventiva 360° — Trazabilidad de Módulos ── */}
      <div className="bg-surface-secondary border border-border-medium rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-4">
          <h3 className="font-bold text-sm text-text-primary uppercase tracking-wider flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500" /> Hoja de Vida Preventiva 360° — Trazabilidad de Módulos
          </h3>
          <span className="text-[11px] font-medium text-text-tertiary">
            Conexión en tiempo real con reportes, inspecciones y formación
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            { title: 'ATEL', subtitle: 'Accidentes / Enfermedades', icon: '🚨', items: atel, emptyMsg: 'Sin eventos ATEL' },
            { title: 'Actos / Condiciones', subtitle: 'Reportes en terreno', icon: '⚠️', items: actos, emptyMsg: 'Sin reportes' },
            { title: 'IPEVR', subtitle: 'Participación activa', icon: '🎯', items: participaciones, emptyMsg: 'Sin registros' },
            { title: 'Capacitaciones', subtitle: 'Formación SST', icon: '📚', items: capacitaciones, emptyMsg: 'Sin cursos' },
            { title: 'Termómetro Psicosocial', subtitle: 'Bienestar & Clima', icon: '❤️', items: termometroAnimo, emptyMsg: 'Sin check-ins' },
          ].map(({ title, subtitle, icon, items, emptyMsg }) => {
            const hasItems = items.length > 0;
            return (
              <div
                key={title}
                className="bg-surface-primary border border-border-light dark:border-white/5 rounded-2xl p-3 flex flex-col justify-between shadow-2xs hover:shadow-sm transition-all"
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-base">{icon}</span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                      hasItems
                        ? 'bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-300 border border-teal-200 dark:border-teal-800'
                        : 'bg-surface-secondary text-text-tertiary border border-border-light dark:border-white/10'
                    }`}>
                      {items.length}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-text-primary leading-tight">{title}</p>
                  <p className="text-[10px] text-text-tertiary truncate">{subtitle}</p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-border-light dark:border-white/5 min-h-[50px] flex flex-col justify-center">
                  {!hasItems ? (
                    <p className="text-[11px] text-text-tertiary italic text-center py-1">{emptyMsg}</p>
                  ) : (
                    <div className="space-y-1.5">
                      {items.slice(-2).reverse().map((item: any, idx: number) => (
                        <div key={idx} className="text-[11px] bg-surface-secondary/70 rounded-lg p-1.5 border border-border-light dark:border-white/5">
                          <p className="font-semibold text-text-secondary truncate" title={item.descripcion || item.nombre || item.tipo}>
                            {item.descripcion || item.nombre || item.tipo || 'Evento registrado'}
                          </p>
                          {item.fecha && (
                            <span className="text-[9px] font-medium text-text-tertiary block mt-0.5">
                              {new Date(item.fecha).toLocaleDateString('es-CO')}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Historial Percepción ── */}
      {percepcionHistorial.length > 0 && (
        <PercepcionHistorial historial={percepcionHistorial} />
      )}

      {/* ── Tabs: Matriz | Analytics ── */}
      <div className="bg-surface-primary border border-border-light dark:border-white/5 rounded-3xl shadow-sm overflow-visible">
        {/* Tab nav */}
        <div className="flex border-b border-border-light dark:border-white/5 bg-surface-secondary/40 rounded-t-3xl p-2 gap-2">
          <button
            onClick={() => setActiveTab('matriz')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all active:scale-95 ${
              activeTab === 'matriz'
                ? 'bg-teal-50 dark:bg-teal-950/50 border border-teal-500 text-teal-600 dark:text-teal-300 shadow-sm'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover/50'
            }`}
          >
            <Activity className="h-4 w-4" />
            Evaluación Bio-Individual
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all active:scale-95 ${
              activeTab === 'analytics'
                ? 'bg-teal-50 dark:bg-teal-950/50 border border-teal-500 text-teal-600 dark:text-teal-300 shadow-sm'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover/50'
            }`}
          >
            <BarChart2 className="h-4 w-4" />
            Analítica & Conclusiones
          </button>
        </div>

        {/* Tab content */}
        <div className="p-5">
          {activeTab === 'matriz' && (
            <>
              <div className="mb-4">
                <h3 className="text-lg font-black text-text-primary flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-teal-600" />
                  Evaluación Bio-Individual de Riesgos
                </h3>
                <p className="text-xs text-text-secondary mt-1">
                  Metodología Bio-Individual WAPPY · Fórmula: NS × NE × (1 - Factor percepción)
                </p>
              </div>
              <BioMatrizIPEVAR workerId={workerId} initialWorker={worker} />
            </>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-light dark:border-white/5 pb-4">
                <div>
                  <h3 className="text-lg font-black text-text-primary flex items-center gap-2">
                    <BarChart2 className="h-5 w-5 text-teal-500" />
                    Analítica Bio-IPEVR & Dictamen Técnico Biocéntrico
                  </h3>
                  <p className="text-xs text-text-secondary mt-1">
                    Visualización de los 8 dominios bio-fisiológicos, susceptibilidad clínica (NS), exposición (NE), modulador de percepción del riesgo y dictamen biocéntrico con IA.
                  </p>
                </div>

                <div className="inline-flex items-center gap-2 p-1.5 rounded-2xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-slate-200/80 dark:border-zinc-800 shadow-md shadow-slate-200/30 dark:shadow-none shrink-0 self-start md:self-auto">
                  <ModelSelector
                    selectedModel={selectedModel}
                    onSelectModel={setSelectedModel}
                    disabled={isAnalyzing}
                  />
                  <ToolbarButton
                    id="btn-gen-bio-report"
                    onClick={handleAnalyzeBioReport}
                    label={isAnalyzing ? 'Generando…' : 'Generar Informe con IA'}
                    icon={isAnalyzing ? Loader2 : Sparkles}
                    title="Elaborar dictamen técnico biocéntrico con IA"
                    variant="ai"
                    isLoading={isAnalyzing}
                    disabled={isAnalyzing || (!worker?.riesgosBioIndividual?.length)}
                  />
                  <ToolbarButton
                    id="btn-bio-report-history"
                    onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                    label="Historial"
                    icon={History}
                    title="Historial de informes guardados"
                    variant="history"
                    active={isHistoryOpen}
                  />
                </div>
              </div>

              {/* 5 Gráficas analíticas de Bio-IPEVAR */}
              <BioMatrizIPEVARDashboard
                rows={worker?.riesgosBioIndividual || []}
                workerId={workerId}
                token={token || ''}
                modelName={selectedModel}
                conclusions={worker?.bioChartConclusions || {}}
                onConclusionSaved={fetchWorker}
              />

              {(!worker?.riesgosBioIndividual || worker.riesgosBioIndividual.length === 0) && (
                <div className="text-center py-12 text-text-tertiary text-sm bg-surface-secondary/40 rounded-2xl border border-dashed border-border-medium">
                  <BarChart2 className="h-10 w-10 mx-auto opacity-20 mb-2" />
                  <p className="font-semibold text-text-secondary">Sin matriz de riesgos bio-individuales para graficar.</p>
                  <p className="text-xs mt-1">Genera primero la evaluación en la pestaña "Evaluación Bio-Individual".</p>
                </div>
              )}

              {/* ── Collapsible Report Box con LiveEditor y ExportDropdown ── */}
              <div id="bio-report-editor" className="mt-8">
                <CollapsibleReportBox
                  onSave={handleSaveReport}
                  isSaving={isSavingReport}
                  saveDisabled={isSavingReport || (!reportContent && !reportContentRef.current)}
                  onHistory={() => setIsHistoryOpen(!isHistoryOpen)}
                  isHistoryOpen={isHistoryOpen}
                  title={`Dictamen Técnico Biocéntrico — ${worker.nombre}`}
                  icon={<FileText className="h-5 w-5 text-teal-600 dark:text-teal-400" />}
                  defaultCollapsed={false}
                  actions={
                    <ExportDropdown
                      content={reportContentRef.current || reportContent || ''}
                      fileName={`Dictamen_Biocentrico_${worker.documento}_${worker.nombre.replace(/\s+/g, '_')}`}
                      reportType="general"
                    />
                  }
                >
                  {isHistoryOpen && (
                    <div className="mx-2 mb-4 mt-4 overflow-hidden rounded-2xl border border-border-medium bg-surface-secondary shadow-sm">
                      <ReportHistory
                        onSelectReport={handleSelectReport}
                        isOpen={isHistoryOpen}
                        toggleOpen={() => setIsHistoryOpen(!isHistoryOpen)}
                        refreshTrigger={refreshTrigger}
                        tags={['sgsst-bio-ipevar', `worker-${worker._id}`]}
                      />
                    </div>
                  )}

                  <div className="p-2">
                    {reportContent ? (
                      <div style={{ minHeight: '520px', width: '100%' }}>
                        <LiveEditor
                          ref={liveEditorRef}
                          paperMode={true}
                          initialContent={reportContent}
                          onUpdate={(html: string) => {
                            reportContentRef.current = html;
                          }}
                          reportSourceData={{
                            worker,
                            riesgos: worker?.riesgosBioIndividual,
                            conclusiones: worker?.bioChartConclusions,
                          }}
                          onHistory={() => setIsHistoryOpen(!isHistoryOpen)}
                        />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-4 py-16 text-text-secondary">
                        <div className="w-14 h-14 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 flex items-center justify-center text-teal-600 shadow-inner">
                          <FileText className="h-7 w-7 opacity-80" />
                        </div>
                        <div className="max-w-md text-center">
                          <h4 className="text-sm font-bold text-text-primary mb-1">
                            Dictamen Técnico Biocéntrico WAPPY
                          </h4>
                          <p className="text-xs text-text-secondary leading-relaxed">
                            Presiona <span className="font-bold text-teal-600">“Generar Informe con IA”</span> para que la IA emita el dictamen pericial biocéntrico bajo la Metodología Bio-Individual WAPPY (Centricidad en el Trabajador), analizando los 8 dominios bio-fisiológicos, susceptibilidad clínica (NS), exposición (NE), modulador activo de percepción del riesgo y plan individualizado de readaptación para {worker.nombre}.
                          </p>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
                          <button
                            type="button"
                            onClick={handleAnalyzeBioReport}
                            disabled={isAnalyzing || (!worker?.riesgosBioIndividual?.length)}
                            title="Generar Informe con IA"
                            className="group flex h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 px-5 py-2 text-xs font-bold text-white shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                          >
                            {isAnalyzing ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Sparkles className="h-4 w-4" />
                            )}
                            <span>{isAnalyzing ? 'Generando informe…' : 'Generar Informe con IA'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsHistoryOpen(true)}
                            title="Cargar desde Historial"
                            className="flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-2 text-xs font-bold text-slate-700 dark:text-zinc-200 shadow-sm hover:bg-slate-100 dark:hover:bg-zinc-700 transition-all active:scale-95 cursor-pointer"
                          >
                            <History className="h-4 w-4" />
                            <span>Cargar desde Historial</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </CollapsibleReportBox>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
