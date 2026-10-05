import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Shield,
  Award,
  TrendingDown,
  Activity,
  AlertTriangle,
  Heart,
  Users,
  Lock,
  GraduationCap,
  UserCheck,
  Sparkles,
  ArrowRight,
  History,
  CheckCircle,
  CheckCircle2,
  Loader2,
  Search,
  Zap,
  Dna,
  Calendar,
  MessageSquare,
  FileText,
  Stethoscope,
  Briefcase,
  RefreshCw,
  Vote,
  ClipboardCheck,
  Car,
  Flame,
  HeartPulse,
  Package,
} from 'lucide-react';
import PublicWorkerHeader from './PublicWorkerHeader';

const calculateAge = (dob: any) => {
  if (!dob) return null;
  const birth = new Date(dob);
  if (isNaN(birth.getTime())) return null;
  const diff = Date.now() - birth.getTime();
  const ageDt = new Date(diff);
  return Math.abs(ageDt.getUTCFullYear() - 1970);
};

const FitGauge = ({ score, alerts }: { score: number; alerts: string[] }) => {
  const isOptimal = score >= 80;
  const isModerate = score >= 60;
  const color = isOptimal ? '#10b981' : isModerate ? '#f59e0b' : '#ef4444';
  const label = isOptimal ? 'ÓPTIMO' : isModerate ? 'MODERADO' : 'CRÍTICO';

  return (
    <div className="flex flex-col items-center justify-between h-full">
      <div className="text-center mb-2">
        <h3 className="font-bold text-xs text-teal-600 dark:text-teal-400 uppercase tracking-widest flex items-center justify-center gap-1.5">
          <Activity className="h-3.5 w-3.5" /> Índice Biocéntrico Integral
        </h3>
        <p className="text-[10px] text-text-tertiary">Compatibilidad clínica vs perfil de riesgo del cargo</p>
      </div>

      <div className="relative w-28 h-28 my-2 flex items-center justify-center">
        <svg className="w-28 h-28 -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={48} fill="none" stroke="currentColor" strokeWidth="8" className="text-surface-hover/60 dark:text-white/5" />
          <circle
            cx="60"
            cy="60"
            r={48}
            fill="none"
            strokeWidth="8"
            style={{
              stroke: color,
              strokeDasharray: `${(score / 100) * 2 * Math.PI * 48} ${2 * Math.PI * 48}`,
              strokeLinecap: 'round',
              transition: 'stroke-dasharray 1s ease',
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-black tracking-tight" style={{ color }}>{score}%</span>
          <span className="text-[8px] font-bold text-text-secondary uppercase tracking-wider">FIT SCORE</span>
          <span
            className="text-[8px] font-black px-1.5 py-0.5 rounded-full mt-0.5 uppercase tracking-wider text-white"
            style={{ backgroundColor: color }}
          >
            {label}
          </span>
        </div>
      </div>

      <div className="w-full space-y-1 mt-2">
        {alerts.length === 0 ? (
          <div className="flex items-center gap-2 p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold shadow-2xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span className="truncate">Aptitud Operativa Óptima</span>
          </div>
        ) : (
          alerts.slice(0, 2).map((a, i) => (
            <div key={i} className="flex items-center gap-2 p-2 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-900 dark:text-amber-200 text-[11px] font-bold shadow-2xs">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="truncate">{a}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const PercepcionScore = ({ score }: { score: number }) => {
  const factorReduccion = Math.min(score / 500, 0.40);
  const level = score >= 500 ? { label: 'Líder Biocéntrico 360°', color: 'text-emerald-600 dark:text-emerald-400', barColor: '#10b981' }
    : score >= 300 ? { label: 'Guardián de la Vida', color: 'text-teal-600 dark:text-teal-400', barColor: '#0d9488' }
    : score >= 100 ? { label: 'Colaborador Comprometido', color: 'text-amber-600 dark:text-amber-400', barColor: '#f59e0b' }
    : { label: 'Nivel Inicial / Sin Eventos', color: 'text-rose-600 dark:text-rose-400', barColor: '#f43f5e' };

  return (
    <div className="bg-surface-primary dark:bg-slate-900 border border-border-medium rounded-2xl p-4 shadow-sm flex flex-col justify-between">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
          <Award className="h-4 w-4 text-teal-600" /> Percepción del Riesgo
        </span>
        <span className={`text-xl font-black ${level.color}`}>{score} pts</span>
      </div>
      <div className="w-full bg-surface-secondary dark:bg-slate-800 rounded-full h-2 mb-2 overflow-hidden border border-border-light/60">
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

const parseHealthProfile = (worker: any) => {
  const socio = worker || {};
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
  }

  const findings: { label: string; text: string; icon: any; colorClass: string }[] = [];
  if (recs) {
    findings.push({
      label: 'Recomendación Preventiva',
      text: recs,
      icon: Activity,
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

  const isHealthyHabits = fuma === 'no' || alcohol === 'no' || fuma === 'no fumador';

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

export default function PublicColaboradorHub() {
  const { companyId, cedula: paramCedula } = useParams<{ companyId: string; cedula?: string }>();
  const navigate = useNavigate();

  const getInitialCedula = () => {
    if (paramCedula) return paramCedula;
    const directCed = localStorage.getItem('wappy_worker_cedula');
    if (directCed) return directCed;
    try {
      const rawSession = localStorage.getItem('wappy_worker_session');
      if (rawSession) {
        const parsed = JSON.parse(rawSession);
        if (parsed?.cedula) return parsed.cedula;
      }
    } catch (e) {}
    return '';
  };

  const initialCedula = getInitialCedula();
  const [inputCedula, setInputCedula] = useState(initialCedula);
  const [activeCedula, setActiveCedula] = useState<string | null>(initialCedula || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [llamadosAtel, setLlamadosAtel] = useState<any[]>([]);

  const fetchLlamadosAtel = async (ced: string) => {
    if (!ced.trim() || !companyId) return;
    try {
      const res = await axios.get(`/api/public-sgsst/atel/llamados-testigo/${companyId}/${ced.trim()}`);
      setLlamadosAtel(res.data?.llamados || []);
    } catch (e) {
      console.warn('Could not fetch ATEL witness calls:', e);
    }
  };

  const healthProfile = useMemo(() => parseHealthProfile(data?.worker), [data?.worker]);
  const workerAge = useMemo(() => calculateAge(data?.worker?.fechaNacimiento) || data?.worker?.edad, [data?.worker]);
  const riesgosBio = data?.worker?.riesgosBioIndividual || [];
  const riesgosCriticos = riesgosBio.filter((r: any) => r.clasificacion_bio === 'Crítico').length;
  const riesgosAltos = riesgosBio.filter((r: any) => r.clasificacion_bio === 'Alto').length;
  const termometroAnimo = (data?.worker?.termometro_animo && data?.worker?.termometro_animo.length > 0)
    ? data.worker.termometro_animo
    : (data?.worker?.historial || []).filter((h: any) => h.modulo === 'termometro_animo');

  const fetchWorkerInfo = async (ced: string) => {
    if (!ced.trim() || !companyId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`/api/public-sgsst/colaborador-info/${companyId}/${ced.trim()}`);
      setData(res.data);
      setActiveCedula(ced.trim());
      localStorage.setItem('wappy_worker_cedula', ced.trim());
      if (res.data?.worker) {
        const fullSession = {
          companyId,
          companyName: res.data.company?.companyName || 'Somos SST',
          nombre: res.data.worker.nombre,
          cedula: res.data.worker.documento || ced.trim(),
          cargo: res.data.worker.cargo,
          fitScore: res.data.worker.fitScore,
          nivel: res.data.worker.nivel,
        };
        localStorage.setItem('wappy_worker_session', JSON.stringify(fullSession));
      }
      // Consultar citaciones pendientes como testigo en ATEL
      fetchLlamadosAtel(ced.trim());
    } catch (err: any) {
      console.error('Error fetching worker info:', err);
      setError(err.response?.data?.error || 'No se encontró registro con esa cédula en esta empresa.');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const ced = paramCedula || getInitialCedula();
    if (ced && companyId) {
      setActiveCedula(ced);
      setInputCedula(ced);
      fetchWorkerInfo(ced);
    }
  }, [companyId, paramCedula]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputCedula.trim()) {
      fetchWorkerInfo(inputCedula.trim());
    }
  };

  const getInitials = (name: string) => {
    return (name || 'Trabajador')
      .split(' ')
      .slice(0, 2)
      .map(n => n[0]?.toUpperCase())
      .join('');
  };

  const getNivelStyle = (nivel: string) => {
    switch (nivel) {
      case 'Líder Biocéntrico 360°':
        return {
          bg: 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md',
          badgeBg: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300',
          barColor: 'bg-gradient-to-r from-teal-400 to-emerald-500',
          textColor: 'text-emerald-600 dark:text-emerald-400',
        };
      case 'Guardián de la Vida':
        return {
          bg: 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-md',
          badgeBg: 'bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border-teal-300',
          barColor: 'bg-gradient-to-r from-teal-500 to-cyan-400',
          textColor: 'text-teal-600 dark:text-teal-400',
        };
      case 'Colaborador Comprometido':
        return {
          bg: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md',
          badgeBg: 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300',
          barColor: 'bg-gradient-to-r from-amber-400 to-orange-500',
          textColor: 'text-amber-600 dark:text-amber-400',
        };
      default:
        return {
          bg: 'bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-md',
          badgeBg: 'bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 border-red-300',
          barColor: 'bg-gradient-to-r from-rose-400 to-red-500',
          textColor: 'text-rose-600 dark:text-rose-400',
        };
    }
  };

  const appCategories = [
    {
      id: 'prevencion',
      title: 'Prevención y Reportes en Terreno',
      subtitle: 'Identificación activa de peligros, condiciones inseguras e incidentes',
      badgeColor: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
      icon: AlertTriangle,
      apps: [
        {
          title: 'Reportar Peligro (IPEVR)',
          desc: 'Alimenta la Matriz Oficial GTC-45 en tiempo real',
          points: '+150 pts',
          icon: Users,
          path: `/sgsst-public/ipevar/${companyId}`,
          color: 'from-emerald-500 to-teal-600',
        },
        {
          title: 'Reportar Acto o Condición',
          desc: 'Alerta sobre condiciones de riesgo con evidencia fotográfica',
          points: '+50 pts',
          icon: AlertTriangle,
          path: `/sgsst-public/reportar/${companyId}`,
          color: 'from-amber-500 to-orange-600',
        },
        {
          title: 'Buzón de Testimonios ATEL',
          desc: 'Declaración confidencial en investigación de incidentes y accidentes',
          points: llamadosAtel.length > 0 ? '🚨 Llamado Activo' : '+30 pts',
          icon: MessageSquare,
          path: `/sgsst-public/atel-testimonio/${companyId}${
            llamadosAtel.length > 0
              ? `?investigacionId=${llamadosAtel[0].investigacionId}&cedula=${activeCedula || ''}`
              : ''
          }`,
          color: llamadosAtel.length > 0 ? 'from-red-600 to-rose-700' : 'from-slate-600 to-teal-700',
        },
      ],
    },
    {
      id: 'copasst',
      title: 'COPASST / Vigía de SST',
      subtitle: 'Comité Paritario de Seguridad y Salud en el Trabajo (Res. 2013/1986 y Dec. 1072)',
      badgeColor: 'bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/20',
      icon: UserCheck,
      apps: [
        {
          title: 'Actas Mensuales COPASST',
          desc: 'Firma digital de actas oficiales, quórum y compromisos mensuales',
          points: '+50 a +100 pts',
          icon: UserCheck,
          path: `/sgsst-public/comites/${companyId}?tipo=copasst`,
          color: 'from-teal-600 to-emerald-700',
        },
        {
          title: 'Elecciones Paritarias COPASST',
          desc: 'Votación secreta para elegir representantes de los colaboradores al COPASST',
          points: '+20 pts',
          icon: Vote,
          path: `/sgsst-public/votaciones/${companyId}?tipo=copasst`,
          color: 'from-emerald-600 to-teal-700',
        },
        {
          title: 'Inspecciones COPASST',
          desc: 'Rondas ágiles de inspección preventiva en puestos, áreas y locaciones',
          points: '+50 pts',
          icon: ClipboardCheck,
          path: `/sgsst-public/copasst-inspecciones/${companyId}`,
          color: 'from-teal-700 to-cyan-700',
        },
      ],
    },
    {
      id: 'cocolab',
      title: 'Comité de Convivencia Laboral (CCL)',
      subtitle: 'Prevención del acoso laboral (Ley 1010) y acoso sexual laboral (Ley 2365 de 2024)',
      badgeColor: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20',
      icon: Lock,
      apps: [
        {
          title: 'Actas Trimestrales de Convivencia',
          desc: 'Firma digital reservada de actas ordinarias y extraordinarias del CCL',
          points: '+50 a +100 pts',
          icon: UserCheck,
          path: `/sgsst-public/comites/${companyId}?tipo=cocolab`,
          color: 'from-purple-600 to-indigo-700',
        },
        {
          title: 'Elecciones Convivencia Laboral',
          desc: 'Votación paritaria secreta para elegir representantes al Comité de Convivencia',
          points: '+20 pts',
          icon: Vote,
          path: `/sgsst-public/votaciones/${companyId}?tipo=cocolab`,
          color: 'from-indigo-600 to-violet-700',
        },
        {
          title: 'Canal Confidencial de Convivencia',
          desc: 'Radicación protegida de quejas por acoso laboral y sexual laboral',
          points: '100% Confidencial',
          icon: Lock,
          path: `/sgsst-public/convivencia/${companyId}`,
          color: 'from-violet-600 to-purple-800',
        },
      ],
    },
    {
      id: 'epp',
      title: 'Dotación y Elementos de Protección Personal (EPP)',
      subtitle: 'Solicitud, reposición por desgaste, trazabilidad en bodega y entregas',
      badgeColor: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
      icon: Package,
      apps: [
        {
          title: 'Solicitud de EPP y Dotación',
          desc: 'Solicita EPP por desgaste, daño, pérdida, cambio de talla o dotación legal periódica',
          points: '+25 pts',
          icon: Package,
          path: `/sgsst-public/solicitud-epp/${companyId}`,
          color: 'from-emerald-600 to-teal-700',
        },
        {
          title: 'Mis Solicitudes & Entregas',
          desc: 'Trazabilidad en tiempo real del estado de aprobación y entrega de tus EPPs en bodega',
          points: 'Trazabilidad',
          icon: History,
          path: `/sgsst-public/solicitud-epp/${companyId}`,
          color: 'from-teal-600 to-emerald-800',
        },
      ],
    },
    {
      id: 'pesv',
      title: 'Seguridad Vial y PESV',
      subtitle: 'Inspección preoperacional diaria de automotores y gestión vial (Res. 20223040040595)',
      badgeColor: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20',
      icon: Car,
      apps: [
        {
          title: 'Inspección Preoperacional Diaria PESV',
          desc: 'Verificación técnica diaria obligatoria antes de iniciar marcha (motos, autos, camperos, camionetas, camiones)',
          points: '+40 pts',
          icon: Car,
          path: `/sgsst-public/inspeccion-vehicular/${companyId}`,
          color: 'from-blue-600 to-indigo-700',
        },
        {
          title: 'Comité de Seguridad Vial (PESV)',
          desc: 'Gestión vial, actas CSV y metas trimestrales Res. 20223040040595',
          points: '+40 pts',
          icon: Car,
          path: `/sgsst-public/comites/${companyId}?tipo=pesv`,
          color: 'from-cyan-600 to-blue-600',
        },
      ],
    },
    {
      id: 'brigada',
      title: 'Emergencias y Brigada',
      subtitle: 'Preparación, simulacros y Sistema Comando de Incidentes (SCI)',
      badgeColor: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20',
      icon: Flame,
      apps: [
        {
          title: 'Brigada de Emergencias & SCI',
          desc: 'Actas de comité de crisis, simulacros y preparación Dec. 1072',
          points: '+35 pts',
          icon: Flame,
          path: `/sgsst-public/comites/${companyId}?tipo=brigada`,
          color: 'from-amber-600 to-rose-600',
        },
        {
          title: 'Hoja de Vida de Brigadista',
          desc: 'Credencial digital SCI, especialidad técnica, dotación y rol de emergencias',
          points: '+40 pts',
          icon: HeartPulse,
          path: `/sgsst-public/brigadista/${companyId}`,
          color: 'from-red-600 to-rose-700',
        },
      ],
    },
    {
      id: 'salud',
      title: 'Salud, Ergonomía y Perfil Bio-Individual',
      subtitle: 'Cuidado postural, bienestar mental y actualización sociodemográfica',
      badgeColor: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20',
      icon: Heart,
      apps: [
        {
          title: 'Termómetro Psicosocial',
          desc: 'Check-in de bienestar y clima laboral (cada 7 días)',
          points: '+10 pts',
          icon: Heart,
          path: `/sgsst-public/animo/${companyId}`,
          color: 'from-rose-500 to-pink-600',
        },
        {
          title: 'Auto-Evaluación Ergonómica',
          desc: 'Medición postural con IA MediaPipe en puesto',
          points: '+40 pts',
          icon: Activity,
          path: `/sgsst-public/estudio-puesto/${companyId}`,
          color: 'from-blue-500 to-indigo-600',
        },
        {
          title: 'Actualizar mis Datos',
          desc: 'Ficha sociodemográfica y contactos de emergencia',
          points: '+30 pts',
          icon: Shield,
          path: `/sgsst-public/perfil-update/${companyId}`,
          color: 'from-cyan-500 to-teal-600',
        },
      ],
    },
    {
      id: 'escuela',
      title: 'Escuela y Capacitación SST',
      subtitle: 'Formación continua, rutas de aprendizaje y certificaciones',
      badgeColor: 'bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-300 border-fuchsia-500/20',
      icon: GraduationCap,
      apps: [
        {
          title: 'Cursos & Capacitaciones (LMS)',
          desc: 'Aula virtual interactiva y certificaciones',
          points: 'Aprender',
          icon: GraduationCap,
          path: `/sgsst-public/ruta-aprendizaje/${companyId}`,
          color: 'from-fuchsia-500 to-pink-600',
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-text-primary flex flex-col font-sans transition-colors">
      {/* Header Universal */}
      <PublicWorkerHeader 
        companyId={companyId || ''} 
        companyName={data?.company?.companyName || 'Somos SST'}
        companyLogo={data?.company?.logoUrl}
        currentModule="colaborador"
        workerCedula={activeCedula || undefined}
      />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 space-y-6">
        {/* Formulario de Consulta de Cédula si no hay colaborador cargado */}
        {!data && (
          <div className="bg-surface-primary dark:bg-slate-900 border border-border-medium rounded-3xl p-6 sm:p-8 shadow-xl max-w-lg mx-auto text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-white shadow-lg">
              <Award className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-text-primary">Mi Pasaporte SST</h2>
              <p className="text-xs sm:text-sm text-text-secondary mt-1">
                Ingresa tu documento de identidad para consultar tus puntos acumulados, rango de seguridad y nivel de reducción del riesgo.
              </p>
            </div>

            <form onSubmit={handleSearch} className="space-y-4">
              <div>
                <input
                  type="text"
                  value={inputCedula}
                  onChange={e => setInputCedula(e.target.value)}
                  placeholder="Número de cédula sin puntos"
                  className="w-full text-center text-lg font-bold tracking-wider px-4 py-3.5 rounded-2xl border border-border-medium bg-surface-secondary/40 focus:ring-2 focus:ring-teal-500 focus:outline-hidden transition-all"
                  autoFocus
                />
              </div>

              {error && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300 font-medium">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !inputCedula.trim()}
                className="w-full py-3.5 rounded-2xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Consultando...
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" /> Abrir Mi Pasaporte
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Dashboard Bio-Individual si el trabajador está cargado */}
        {data && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Banner Alerta de Citación a Testigo en Investigación ATEL */}
            {llamadosAtel.length > 0 && (
              <div className="bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 rounded-3xl p-5 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 border border-white/20 animate-in slide-in-from-top-3">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 shadow-inner">
                    <AlertTriangle className="w-6 h-6 text-white animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="bg-white text-rose-700 text-[10px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider shadow-2xs">
                        🚨 Citación Oficial Requerida
                      </span>
                      <span className="text-xs font-bold text-white/90">
                        Investigación ATEL • {llamadosAtel[0].tipoEvento}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-white/95 mt-1">
                      Has sido convocado formalmente como testigo en la investigación de un evento laboral ocurrido el <strong>{llamadosAtel[0].fechaEvento}</strong> ({llamadosAtel[0].afectado}). Se requiere tu testimonio para esclarecer los hechos.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => navigate(`/sgsst-public/atel-testimonio/${companyId}?investigacionId=${llamadosAtel[0].investigacionId}&cedula=${activeCedula || ''}`)}
                  className="px-5 py-2.5 rounded-xl bg-white text-rose-700 hover:bg-rose-50 font-black text-xs shadow-lg transition-all shrink-0 active:scale-95 flex items-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" /> Rendir Testimonio Ahora (+30 pts)
                </button>
              </div>
            )}

            {/* Carnet Digital 360 Header */}
            <div className="bg-surface-primary dark:bg-slate-900 border border-border-medium rounded-3xl p-6 sm:p-7 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-bl from-teal-500/10 via-emerald-500/5 to-transparent rounded-bl-full pointer-events-none" />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white flex items-center justify-center text-xl font-black shadow-md shrink-0">
                    {getInitials(data.worker.nombre)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="text-xl sm:text-2xl font-black text-text-primary">{data.worker.nombre}</h1>
                      <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border ${getNivelStyle(data.worker.nivel).badgeBg}`}>
                        {data.worker.nivel}
                      </span>
                      {data.worker.esBrigadista === 'Sí' && (
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300 flex items-center gap-1">
                          <Flame className="w-3 h-3 text-rose-600" /> Brigadista
                        </span>
                      )}
                      {data.worker.esComiteSeguridadVial === 'Sí' && (
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-950/60 text-cyan-800 dark:text-cyan-300 border border-cyan-300 flex items-center gap-1">
                          <Car className="w-3 h-3 text-cyan-600" /> PESV
                        </span>
                      )}
                      {data.worker.esCopasst === 'Sí' && (
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border border-indigo-300 flex items-center gap-1">
                          <Award className="w-3 h-3 text-indigo-600" /> COPASST
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-text-secondary mt-0.5">
                      CC: {data.worker.documento} • {data.worker.cargo}
                    </p>
                    <p className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold mt-0.5 flex items-center gap-1">
                      <Shield className="w-3 h-3" /> {data.company.companyName}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => activeCedula && fetchWorkerInfo(activeCedula)}
                    title="Actualizar datos"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-surface-secondary dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 shadow-2xs transition-all active:scale-95"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Actualizar</span>
                  </button>
                </div>
              </div>
            </div>

            {/* ── FIT + Ficha Técnica + Percepción ── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* FIT Gauge (Columna Izquierda: 3 cols) */}
              <div className="lg:col-span-3 bg-surface-primary dark:bg-slate-900 border border-border-medium rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                <FitGauge score={data.worker.fitScore || 0} alerts={data.worker.fitAlerts || []} />
              </div>

              {/* Datos Laborales & Salud Ocupacional (Columna Central: 6 cols) */}
              <div className="lg:col-span-6 flex flex-col gap-3">
                {/* Card 1: Datos Laborales & Operativos */}
                <div className="bg-surface-primary dark:bg-slate-900 border border-border-medium rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3 border-b border-border-light dark:border-white/5 pb-2">
                    <h3 className="font-bold text-xs text-text-secondary uppercase tracking-widest flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5 text-teal-600" /> Datos Laborales & Puesto de Trabajo
                    </h3>
                    {data.worker.cargo && (
                      <span className="text-[11px] font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded-lg border border-teal-200 dark:border-teal-800/80">
                        {data.worker.cargo}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3 text-xs">
                    <div>
                      <span className="text-text-tertiary block font-semibold text-[10px] uppercase">Identificación</span>
                      <span className="text-text-primary font-bold">{data.worker.documento}</span>
                    </div>
                    <div>
                      <span className="text-text-tertiary block font-semibold text-[10px] uppercase">Área / Proceso</span>
                      <span className="text-text-primary font-medium">{data.worker.area || 'Operaciones / Planta'}</span>
                    </div>
                    <div>
                      <span className="text-text-tertiary block font-semibold text-[10px] uppercase">Sede de Trabajo</span>
                      <span className="text-text-primary font-medium">{data.worker.sede || 'Principal'}</span>
                    </div>
                    <div>
                      <span className="text-text-tertiary block font-semibold text-[10px] uppercase">Género & Edad</span>
                      <span className="text-text-primary font-medium">
                        {data.worker.genero || '—'}{workerAge ? ` · ${workerAge} años` : ''}
                      </span>
                    </div>
                    <div>
                      <span className="text-text-tertiary block font-semibold text-[10px] uppercase">Fecha de Ingreso</span>
                      <span className="text-text-primary font-medium">
                        {data.worker.fechaIngreso ? new Date(data.worker.fechaIngreso).toLocaleDateString('es-CO') : '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-text-tertiary block font-semibold text-[10px] uppercase">ARL (Empresa)</span>
                      <span className="text-teal-700 dark:text-teal-300 font-bold flex items-center gap-1 truncate">
                        <Shield className="w-3 h-3 text-teal-600 shrink-0" />
                        {data.company?.arl || data.worker?.arl || 'Empresa (General)'}
                      </span>
                    </div>
                  </div>

                  {/* Bloque Seguridad Social (EPS, AFP y Estado PILA) */}
                  <div className="mt-3 pt-3 border-t border-border-light dark:border-white/5 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex flex-wrap items-center gap-3">
                      <div>
                        <span className="text-text-tertiary block text-[9px] font-bold uppercase">EPS</span>
                        <span className="font-semibold text-text-primary">{data.worker.eps || 'Por registrar'}</span>
                      </div>
                      <div className="h-6 w-px bg-border-light dark:bg-white/10 hidden sm:block" />
                      <div>
                        <span className="text-text-tertiary block text-[9px] font-bold uppercase">Fondo de Pensiones (AFP)</span>
                        <span className="font-semibold text-text-primary">{data.worker.afp || 'Por registrar'}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-text-tertiary block text-[9px] font-bold uppercase text-right sm:text-left">Soporte PILA</span>
                      {(() => {
                        const status = (data.worker.estadoPila || 'Pendiente de soporte PILA').trim();
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
                <div className="bg-surface-primary dark:bg-slate-900 border border-border-medium rounded-2xl p-4 shadow-sm flex flex-col gap-2.5">
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
                      {healthProfile.fuma && <span className="bg-surface-secondary dark:bg-slate-800 px-2 py-0.5 rounded-md border border-border-light dark:border-white/10">🚭 No fumador</span>}
                      {healthProfile.alcohol && <span className="bg-surface-secondary dark:bg-slate-800 px-2 py-0.5 rounded-md border border-border-light dark:border-white/10">🍷 Hábitos saludables</span>}
                    </div>
                  )}
                </div>
              </div>

              {/* Percepción Score + Resumen Bio-Riesgos (Columna Derecha: 3 cols) */}
              <div className="lg:col-span-3 flex flex-col gap-3 justify-between">
                <PercepcionScore score={data.worker.percepcionRiesgoScore || 0} />

                {/* Resumen Bio-Riesgos */}
                <div className="bg-surface-primary dark:bg-slate-900 border border-border-medium rounded-2xl p-4 shadow-sm">
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
            <div className="bg-surface-primary dark:bg-slate-900 border border-border-medium rounded-2xl p-5 shadow-sm">
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
                  { title: 'ATEL', subtitle: 'Accidentes / Enfermedades', icon: '🚨', items: data.worker.atel || [], emptyMsg: 'Sin eventos ATEL' },
                  { title: 'Actos / Condiciones', subtitle: 'Reportes en terreno', icon: '⚠️', items: data.worker.actos_inseguros || [], emptyMsg: 'Sin reportes' },
                  { title: 'IPEVR', subtitle: 'Participación activa', icon: '🎯', items: data.worker.participaciones_ipevar || [], emptyMsg: 'Sin registros' },
                  { title: 'Capacitaciones', subtitle: 'Formación SST', icon: '📚', items: data.worker.capacitaciones || [], emptyMsg: 'Sin cursos' },
                  { title: 'Termómetro Psicosocial', subtitle: 'Bienestar & Clima', icon: '❤️', items: termometroAnimo, emptyMsg: 'Sin check-ins' },
                ].map(({ title, subtitle, icon, items, emptyMsg }) => {
                  const hasItems = items.length > 0;
                  return (
                    <div
                      key={title}
                      className="bg-surface-secondary/60 dark:bg-slate-800/50 border border-border-light dark:border-white/5 rounded-2xl p-3 flex flex-col justify-between shadow-2xs hover:shadow-sm transition-all"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-base">{icon}</span>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                            hasItems
                              ? 'bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-300 border border-teal-200 dark:border-teal-800'
                              : 'bg-surface-primary dark:bg-slate-900 text-text-tertiary border border-border-light dark:border-white/10'
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
                              <div key={idx} className="text-[11px] bg-surface-primary dark:bg-slate-900 rounded-lg p-1.5 border border-border-light dark:border-white/5">
                                <p className="font-semibold text-text-secondary truncate" title={item.descripcion || item.nombre || item.tipo || item.accion}>
                                  {item.descripcion || item.nombre || item.tipo || item.accion || 'Evento registrado'}
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

            {/* Cuadrícula de Aplicativos Disponibles Organizados por Temas */}
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-medium/60 pb-3">
                <div>
                  <h3 className="text-base font-black text-text-primary uppercase tracking-wide flex items-center gap-2">
                    <Zap className="w-4 h-4 text-teal-500" /> Tus Módulos & Acciones Disponibles
                  </h3>
                  <p className="text-xs text-text-secondary mt-0.5">
                    Organizados por áreas de gestión para facilitar tu participación en el SG-SST
                  </p>
                </div>
                <span className="text-xs font-semibold text-teal-600 dark:text-teal-400">
                  Haz clic en un aplicativo para ingresar
                </span>
              </div>

              <div className="space-y-6">
                {appCategories.map((cat) => {
                  const CatIcon = cat.icon;
                  return (
                    <div
                      key={cat.id}
                      className="bg-surface-primary/60 dark:bg-slate-900/50 border border-border-light dark:border-white/5 rounded-3xl p-4 sm:p-5 shadow-xs space-y-4"
                    >
                      {/* Encabezado de la Categoría Temática */}
                      <div className="flex items-center justify-between gap-3 border-b border-border-light/80 dark:border-slate-800 pb-3">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-xl border ${cat.badgeColor}`}>
                            <CatIcon className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-xs sm:text-sm font-black text-text-primary uppercase tracking-wide">
                              {cat.title}
                            </h4>
                            <p className="text-[11px] text-text-secondary">
                              {cat.subtitle}
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-surface-secondary dark:bg-slate-800 text-text-secondary border border-border-light dark:border-slate-700 shrink-0">
                          {cat.apps.length} {cat.apps.length === 1 ? 'módulo' : 'módulos'}
                        </span>
                      </div>

                      {/* Tarjetas de la Categoría */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                        {cat.apps.map((app, idx) => {
                          const Icon = app.icon;
                          return (
                            <div
                              key={idx}
                              onClick={() => {
                                const targetCed = activeCedula || data?.worker?.documento;
                                const separator = app.path.includes('?') ? '&' : '?';
                                const url = targetCed
                                  ? `${app.path}${separator}cedula=${encodeURIComponent(targetCed)}`
                                  : app.path;
                                navigate(url);
                              }}
                              className="group bg-surface-primary dark:bg-slate-900 border border-border-medium rounded-2xl p-4 hover:border-teal-400 hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col justify-between gap-3 active:scale-98"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div
                                  className={`p-2.5 rounded-2xl bg-gradient-to-tr ${app.color} text-white shadow-xs`}
                                >
                                  <Icon className="w-5 h-5" />
                                </div>
                                <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                                  {app.points}
                                </span>
                              </div>

                              <div>
                                <h5 className="font-bold text-xs text-text-primary group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                                  {app.title}
                                </h5>
                                <p className="text-[11px] text-text-secondary line-clamp-2 mt-1">
                                  {app.desc}
                                </p>
                              </div>

                              <div className="pt-2 flex items-center justify-between border-t border-border-light/60 dark:border-slate-800/60 mt-auto">
                                <span className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">
                                  Módulo
                                </span>
                                <div className="inline-flex items-center justify-center h-7 min-w-[28px] px-2 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200/80 dark:border-teal-800 text-[11px] font-bold transition-all duration-300 group-hover:bg-teal-600 group-hover:text-white group-hover:border-teal-600 shadow-2xs">
                                  <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 group-hover:mr-1 transition-all duration-300 whitespace-nowrap">
                                    Ingresar
                                  </span>
                                  <ArrowRight className="w-3.5 h-3.5 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Historial de Puntos y Actividades */}
            {data.worker.historial && data.worker.historial.length > 0 && (
              <div className="bg-surface-primary dark:bg-slate-900 border border-border-medium rounded-3xl p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-black text-text-primary uppercase tracking-wide flex items-center gap-2">
                  <History className="w-4 h-4 text-teal-500" /> Historial Reciente de Puntos
                </h3>

                <div className="divide-y divide-border-light dark:divide-slate-800">
                  {data.worker.historial.map((item: any, i: number) => {
                    const isPositive = Number(item.puntos) >= 0;
                    return (
                      <div key={i} className="py-3 flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${isPositive ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400'}`}>
                            {isPositive ? '+' : ''}{item.puntos}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-text-primary truncate">{item.accion}</p>
                            <p className="text-[10px] text-text-secondary flex items-center gap-1.5 mt-0.5">
                              <span className="capitalize font-semibold">{item.modulo?.replace('_', ' ')}</span>
                              <span>•</span>
                              <span>{new Date(item.fecha).toLocaleDateString('es-CO')}</span>
                            </p>
                          </div>
                        </div>

                        <span className={`font-black text-sm shrink-0 ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                          {isPositive ? `+${item.puntos}` : item.puntos} pts
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-[11px] text-text-tertiary border-t border-border-medium/40 mt-auto">
        Plataforma Inteligente de Seguridad y Salud en el Trabajo &mdash; Somos SST / WAPPY
      </footer>
    </div>
  );
}
