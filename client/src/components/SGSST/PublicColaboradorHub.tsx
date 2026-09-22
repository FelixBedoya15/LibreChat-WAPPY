import React, { useState, useEffect } from 'react';
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
  Loader2,
  Search,
  Zap,
  Dna,
  Calendar,
  MessageSquare,
} from 'lucide-react';
import PublicWorkerHeader from './PublicWorkerHeader';

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

  const appsGrid = [
    {
      title: 'Reportar Peligro (IPEVAR)',
      desc: 'Alimenta la Matriz Oficial GTC-45',
      points: '+150 pts',
      icon: Users,
      path: `/sgsst-public/ipevar/${companyId}`,
      color: 'from-emerald-500 to-teal-600',
    },
    {
      title: 'Reportar Acto o Condición',
      desc: 'Alerta sobre riesgos con evidencia fotográfica',
      points: '+50 pts',
      icon: AlertTriangle,
      path: `/sgsst-public/reportar/${companyId}`,
      color: 'from-amber-500 to-orange-600',
    },
    {
      title: 'Termómetro de Ánimo Diario',
      desc: 'Check-in anónimo de bienestar emocional',
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
      title: 'Comités & Brigadas',
      desc: 'Firma de asistencia y actas (COPASST/PESV)',
      points: '+25 a +100 pts',
      icon: UserCheck,
      path: `/sgsst-public/comites/${companyId}`,
      color: 'from-indigo-500 to-purple-600',
    },
    {
      title: 'Canal Confidencial de Convivencia',
      desc: 'Quejas protegidas Ley 1010 y Ley 2365 de 2024',
      points: 'Seguro',
      icon: Lock,
      path: `/sgsst-public/convivencia/${companyId}`,
      color: 'from-violet-500 to-purple-700',
    },
    {
      title: 'Actualizar mis Datos',
      desc: 'Ficha sociodemográfica y contactos de emergencia',
      points: '+30 pts',
      icon: Shield,
      path: `/sgsst-public/perfil-update/${companyId}`,
      color: 'from-cyan-500 to-teal-600',
    },
    {
      title: 'Cursos & Capacitaciones (LMS)',
      desc: 'Aula virtual interactiva y certificaciones',
      points: 'Aprender',
      icon: GraduationCap,
      path: `/sgsst-public/ruta-aprendizaje/${companyId}`,
      color: 'from-fuchsia-500 to-pink-600',
    },
    {
      title: 'Buzón de Testimonios ATEL',
      desc: 'Declaración confidencial en investigación de incidentes y accidentes',
      points: '+30 pts',
      icon: MessageSquare,
      path: `/sgsst-public/atel-testimonio/${companyId}`,
      color: 'from-slate-600 to-teal-700',
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

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 space-y-6">
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
            {/* Carnet Digital 360 */}
            <div className="bg-surface-primary dark:bg-slate-900 border border-border-medium rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
              {/* Fondo decorativo */}
              <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-bl from-teal-500/10 via-emerald-500/5 to-transparent rounded-bl-full pointer-events-none" />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-medium/60 pb-6">
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
                    </div>
                    <p className="text-xs text-text-secondary mt-0.5">
                      CC: {data.worker.documento} • {data.worker.cargo}
                    </p>
                    <p className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold mt-0.5 flex items-center gap-1">
                      <Shield className="w-3 h-3" /> {data.company.companyName}
                    </p>
                  </div>
                </div>

                {/* Botón para cambiar de cédula */}
                <button
                  onClick={() => {
                    setData(null);
                    localStorage.removeItem('wappy_worker_cedula');
                    localStorage.removeItem('wappy_worker_session');
                  }}
                  className="self-start sm:self-center px-3 py-1.5 text-xs font-semibold text-text-secondary hover:text-text-primary bg-surface-secondary/60 hover:bg-surface-hover rounded-xl border border-border-medium transition-colors"
                >
                  Consultar otro documento
                </button>
              </div>

              {/* Estadísticas Clave: Puntos + Reducción de Riesgo + FIT */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
                {/* Puntos Acumulados */}
                <div className="bg-surface-secondary/50 dark:bg-slate-800/50 border border-border-medium/70 rounded-2xl p-4 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-text-secondary uppercase tracking-wide flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-teal-500" /> Puntos SST
                    </span>
                    <span className="text-2xl font-black text-teal-600 dark:text-teal-400">
                      {data.worker.percepcionRiesgoScore} <span className="text-xs font-bold text-text-secondary">pts</span>
                    </span>
                  </div>
                  <div className="mt-3 space-y-1">
                    <div className="w-full bg-surface-tertiary rounded-full h-2 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-700 ${getNivelStyle(data.worker.nivel).barColor}`}
                        style={{ width: `${Math.min((data.worker.percepcionRiesgoScore / 500) * 100, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-text-tertiary font-semibold">
                      <span>0 pts</span>
                      <span>Meta: 500 pts</span>
                    </div>
                  </div>
                </div>

                {/* Factor de Reducción en Matriz */}
                <div className="bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/60 rounded-2xl p-4 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-teal-900 dark:text-teal-200 uppercase tracking-wide flex items-center gap-1.5">
                      <TrendingDown className="w-4 h-4 text-teal-600" /> Reducción Bio-Riesgo
                    </span>
                    <span className="text-2xl font-black text-teal-700 dark:text-teal-300">
                      -{data.worker.porcentajeReduccion}%
                    </span>
                  </div>
                  <p className="text-[11px] text-teal-800 dark:text-teal-300/80 mt-2 leading-tight">
                    Tu cultura preventiva reduce hasta un <strong>40%</strong> la probabilidad de materialización de peligros de tu labor.
                  </p>
                </div>

                {/* FIT Score / Huella Biocéntrica */}
                <div className="bg-surface-secondary/50 dark:bg-slate-800/50 border border-border-medium/70 rounded-2xl p-4 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-text-secondary uppercase tracking-wide flex items-center gap-1.5">
                      <Dna className="w-4 h-4 text-cyan-500" /> FIT Score
                    </span>
                    <span className={`text-2xl font-black ${data.worker.fitScore >= 80 ? 'text-emerald-500' : data.worker.fitScore >= 60 ? 'text-amber-500' : 'text-rose-500'}`}>
                      {data.worker.fitScore}%
                    </span>
                  </div>
                  <p className="text-[11px] text-text-secondary mt-2 leading-tight">
                    Índice de aptitud y bienestar integral sin siniestralidad reciente.
                  </p>
                </div>
              </div>
            </div>

            {/* Cuadrícula de Aplicativos Disponibles */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-text-primary uppercase tracking-wide flex items-center gap-2">
                  <Zap className="w-4 h-4 text-teal-500" /> Tus Módulos & Acciones Disponibles
                </h3>
                <span className="text-xs text-text-secondary">Haz clic en un aplicativo</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {appsGrid.map((app, idx) => {
                  const Icon = app.icon;
                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        const targetCed = activeCedula || data?.worker?.documento;
                        const separator = app.path.includes('?') ? '&' : '?';
                        const url = targetCed ? `${app.path}${separator}cedula=${encodeURIComponent(targetCed)}` : app.path;
                        navigate(url);
                      }}
                      className="group bg-surface-primary dark:bg-slate-900 border border-border-medium rounded-2xl p-4 hover:border-teal-400 hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col justify-between gap-3 active:scale-98"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className={`p-2.5 rounded-2xl bg-gradient-to-tr ${app.color} text-white shadow-xs`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                          {app.points}
                        </span>
                      </div>

                      <div>
                        <h4 className="font-bold text-xs text-text-primary group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                          {app.title}
                        </h4>
                        <p className="text-[11px] text-text-secondary line-clamp-2 mt-1">
                          {app.desc}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 text-[11px] font-bold text-teal-600 dark:text-teal-400 pt-1 group-hover:translate-x-1 transition-transform">
                        <span>Ingresar</span>
                        <ArrowRight className="w-3.5 h-3.5" />
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
