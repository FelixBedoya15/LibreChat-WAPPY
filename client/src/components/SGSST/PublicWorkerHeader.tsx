import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  Award,
  ChevronDown,
  X,
  AlertTriangle,
  Heart,
  Activity,
  Users,
  Lock,
  GraduationCap,
  UserCheck,
  Sparkles,
  MessageSquare,
  LayoutGrid,
} from 'lucide-react';

interface PublicWorkerHeaderProps {
  companyId: string;
  companyName?: string;
  companyLogo?: string | null;
  currentModule?: 'colaborador' | 'ipevar' | 'reportar' | 'animo' | 'estudio_puesto' | 'comites' | 'convivencia' | 'perfil_update' | 'lms' | string;
  currentApp?: string;
  title?: string;
  subtitle?: string;
  workerCedula?: string;
}

export const PublicWorkerHeader: React.FC<PublicWorkerHeaderProps> = ({
  companyId,
  companyName = 'Somos SST',
  companyLogo = null,
  currentModule,
  currentApp,
  title,
  subtitle,
  workerCedula,
}) => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Compute resolvedCedula from prop, query parameter, or localStorage
  const resolvedCedula = workerCedula || (() => {
    try {
      const q = new URLSearchParams(window.location.search).get('cedula');
      if (q && q.trim()) return q.trim();
      const directCed = localStorage.getItem('wappy_worker_cedula');
      if (directCed && directCed.trim()) return directCed.trim();
      const rawSession = localStorage.getItem('wappy_worker_session');
      if (rawSession) {
        const parsed = JSON.parse(rawSession);
        if (parsed?.cedula) return String(parsed.cedula).trim();
      }
    } catch (e) {}
    return '';
  })();

  const navigateWithCedula = (basePath: string) => {
    setIsMenuOpen(false);
    if (resolvedCedula) {
      const separator = basePath.includes('?') ? '&' : '?';
      navigate(`${basePath}${separator}cedula=${encodeURIComponent(resolvedCedula)}`);
    } else {
      navigate(basePath);
    }
  };

  // Normalize module across aliases
  const rawMod = (currentModule || currentApp || 'colaborador').toLowerCase();
  const activeModule = 
    rawMod === 'termometro' ? 'animo' :
    rawMod === 'perfil' ? 'perfil_update' :
    rawMod === 'actos' ? 'reportar' :
    rawMod === 'testimonio' ? 'atel' :
    rawMod === 'ruta' ? 'lms' :
    rawMod;

  const modulesList = [
    {
      id: 'colaborador',
      name: 'Mi Pasaporte SST (Puntos & Perfil)',
      desc: 'Consulta tu saldo de puntos, nivel y carnet 360',
      icon: Award,
      path: `/sgsst-public/colaborador/${companyId}${resolvedCedula ? `/${encodeURIComponent(resolvedCedula)}` : ''}`,
      color: 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800',
      badge: 'Hub',
    },
    {
      id: 'ipevar',
      name: 'Reportar Peligro (IPEVAR)',
      desc: 'Reporta peligros que alimentan la Matriz Oficial',
      icon: Users,
      path: `/sgsst-public/ipevar/${companyId}`,
      color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
      badge: '+150 pts',
    },
    {
      id: 'reportar',
      name: 'Reporte de Actos y Condiciones',
      desc: 'Alerta sobre condiciones inseguras con fotos',
      icon: AlertTriangle,
      path: `/sgsst-public/reportar/${companyId}`,
      color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',
      badge: '+50 pts',
    },
    {
      id: 'animo',
      name: 'Termómetro de Ánimo Diario',
      desc: 'Check-in anónimo de bienestar y fatiga',
      icon: Heart,
      path: `/sgsst-public/animo/${companyId}`,
      color: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800',
      badge: '+10 pts',
    },
    {
      id: 'estudio_puesto',
      name: 'Auto-Evaluación Ergonómica',
      desc: 'Medición postural con IA MediaPipe en tu puesto',
      icon: Activity,
      path: `/sgsst-public/estudio-puesto/${companyId}`,
      color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800',
      badge: '+40 pts',
    },
    {
      id: 'comites',
      name: 'Comités & Brigadas',
      desc: 'Firma de asistencia para COPASST, COCOLAB, Brigada y PESV',
      icon: UserCheck,
      path: `/sgsst-public/comites/${companyId}`,
      color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800',
      badge: '+25 pts',
    },
    {
      id: 'convivencia',
      name: 'Canal Confidencial de Convivencia',
      desc: 'Radicación protegida de quejas (Ley 1010 y Ley 2365)',
      icon: Lock,
      path: `/sgsst-public/convivencia/${companyId}`,
      color: 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40 border-violet-200 dark:border-violet-800',
      badge: 'Seguro',
    },
    {
      id: 'perfil_update',
      name: 'Actualizar mis Datos',
      desc: 'Ficha sociodemográfica y contactos de emergencia',
      icon: Shield,
      path: `/sgsst-public/perfil-update/${companyId}`,
      color: 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/40 border-cyan-200 dark:border-cyan-800',
      badge: '+30 pts',
    },
    {
      id: 'lms',
      name: 'Cursos & Capacitaciones (LMS)',
      desc: 'Aprende y certifícate en seguridad laboral',
      icon: GraduationCap,
      path: `/sgsst-public/ruta-aprendizaje/${companyId}`,
      color: 'text-fuchsia-600 dark:text-fuchsia-400 bg-fuchsia-50 dark:bg-fuchsia-950/40 border-fuchsia-200 dark:border-fuchsia-800',
      badge: 'Aprender',
    },
    {
      id: 'atel',
      name: 'Buzón de Testimonios ATEL',
      desc: 'Declaración confidencial en investigación de incidentes y accidentes',
      icon: MessageSquare,
      path: `/sgsst-public/atel-testimonio/${companyId}`,
      color: 'text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800',
      badge: '+30 pts',
    },
  ];

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-surface-primary/90 dark:bg-slate-900/90 border-b border-border-medium/60 shadow-sm transition-all">
      <div className="max-w-4xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
        {/* Brand / Empresa */}
        <div 
          onClick={() => navigate(`/sgsst-public/colaborador/${companyId}${resolvedCedula ? `/${encodeURIComponent(resolvedCedula)}` : ''}`)}
          className="flex items-center gap-2.5 cursor-pointer group shrink-0"
        >
          {companyLogo ? (
            <img 
              src={companyLogo} 
              alt={companyName} 
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/assets/logo.png';
              }}
              className="w-8 h-8 rounded-xl object-contain bg-white dark:bg-slate-800 p-0.5 border border-border-medium shadow-xs" 
            />
          ) : (
            <img 
              src="/assets/logo.png" 
              alt="WAPPY" 
              className="w-8 h-8 rounded-xl object-contain bg-white dark:bg-slate-800 p-0.5 border border-border-medium shadow-xs" 
            />
          )}
          <div className="flex flex-col">
            <span className="text-xs font-black text-text-primary group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors leading-tight line-clamp-1">
              {companyName}
            </span>
            <span className="text-[10px] text-text-secondary flex items-center gap-1 font-medium">
              Somos SST <Sparkles className="w-2.5 h-2.5 text-teal-500" />
            </span>
          </div>
        </div>

        {/* Action Pills */}
        <div className="flex items-center gap-2">
          {/* Botón Pasaporte SST (expandible) */}
          {activeModule !== 'colaborador' && (
            <button
              type="button"
              onClick={() => navigate(`/sgsst-public/colaborador/${companyId}${resolvedCedula ? `/${encodeURIComponent(resolvedCedula)}` : ''}`)}
              title="Mi Pasaporte SST (Puntos & Perfil)"
              className="group flex items-center justify-center h-8 sm:h-9 min-w-[34px] px-2.5 rounded-xl text-xs font-bold bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 hover:bg-teal-100 dark:hover:bg-teal-900/50 transition-all duration-300 active:scale-95 shadow-2xs cursor-pointer"
            >
              <Award className="w-3.5 h-3.5 shrink-0" />
              <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 group-hover:ml-1.5 transition-all duration-300 whitespace-nowrap">
                Mis Puntos
              </span>
            </button>
          )}

          {/* Menú Selector de Aplicativos (expandible) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              title="Ecosistema de Aplicativos SST"
              className="group flex items-center justify-center h-8 sm:h-9 min-w-[34px] px-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-sm active:scale-95 transition-all duration-300 cursor-pointer"
            >
              <LayoutGrid className="w-3.5 h-3.5 shrink-0" />
              <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 group-hover:ml-1.5 transition-all duration-300 whitespace-nowrap">
                Aplicativos
              </span>
              <ChevronDown className={`w-3.5 h-3.5 shrink-0 ml-1 transition-transform duration-200 ${isMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isMenuOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40 bg-black/20 backdrop-blur-xs" 
                  onClick={() => setIsMenuOpen(false)} 
                />
                <div className="absolute right-0 mt-2 w-80 max-h-[80vh] overflow-y-auto z-50 bg-surface-primary dark:bg-slate-900 border border-border-medium rounded-2xl shadow-2xl p-2.5 space-y-1.5 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-2 border-b border-border-medium flex items-center justify-between">
                    <div>
                      <p className="text-xs font-black text-text-primary uppercase tracking-wide">Ecosistema del Colaborador</p>
                      <p className="text-[10px] text-text-secondary">Selecciona un servicio para abrirlo</p>
                    </div>
                    <button 
                      onClick={() => setIsMenuOpen(false)}
                      className="p-1 rounded-lg hover:bg-surface-hover text-text-secondary"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-1 pt-1">
                    {modulesList.map(mod => {
                      const Icon = mod.icon;
                      const isCurrent = mod.id === activeModule;
                      return (
                        <div
                          key={mod.id}
                          onClick={() => navigateWithCedula(mod.path)}
                          className={`p-2.5 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                            isCurrent
                              ? 'bg-teal-50/80 dark:bg-teal-950/40 border-teal-300 dark:border-teal-700'
                              : 'hover:bg-surface-hover border-transparent hover:border-border-medium'
                          }`}
                        >
                          <div className={`p-2 rounded-xl border shrink-0 ${mod.color}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <p className={`text-xs font-bold truncate ${isCurrent ? 'text-teal-700 dark:text-teal-300' : 'text-text-primary'}`}>
                                {mod.name}
                              </p>
                              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-surface-secondary text-text-secondary border border-border-medium shrink-0">
                                {mod.badge}
                              </span>
                            </div>
                            <p className="text-[10px] text-text-secondary line-clamp-1 mt-0.5">
                              {mod.desc}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default PublicWorkerHeader;
