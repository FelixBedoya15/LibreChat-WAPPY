import React, { useState, useEffect } from 'react';
import { useLocation, useSearchParams, useNavigate, useOutletContext } from 'react-router-dom';
import { 
  GraduationCap, 
  BookOpen, 
  Building2, 
  Video, 
  Newspaper,
  Shield
} from 'lucide-react';
import { useAuthContext } from '~/hooks/AuthContext';
import { OpenSidebar } from '~/components/Chat/Menus';
import type { ContextType } from '~/common';
import TrainingDashboard from '~/components/Training/TrainingDashboard';
import RutaAprendizajeDashboard from '~/components/RutaAprendizaje/RutaAprendizajeDashboard';
import EventsMeetDashboard from '~/components/EventsMeet/EventsMeetDashboard';
import BlogDashboard from '~/components/Blog/BlogDashboard';

export type AcademiaTab = 'cursos' | 'rutas' | 'meet' | 'blog';

export default function AcademiaDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuthContext();
  const ADMIN_EMAILS = ['cristhian@mauricioposadac.com', 'mauricioposadac@gmail.com', 'felix.bedoya15@gmail.com'];
  const isAdmin = user?.role === 'ADMIN' || (!!user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase()));
  const outletContext = useOutletContext<ContextType>();
  const navVisible = outletContext?.navVisible ?? true;
  const setNavVisible = outletContext?.setNavVisible ?? (() => {});

  const getInitialTab = (): AcademiaTab => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'rutas' || tabParam === 'empresa') return 'rutas';
    if (tabParam === 'meet' || tabParam === 'envivo' || tabParam === 'clases') return 'meet';
    if (tabParam === 'blog' || tabParam === 'articulos') return 'blog';
    if (tabParam === 'cursos' || tabParam === 'aula') return 'cursos';

    if (location.pathname.startsWith('/ruta-aprendizaje')) return 'rutas';
    if (location.pathname.startsWith('/events-meet')) return 'meet';
    if (location.pathname.startsWith('/blog')) return 'blog';
    if (location.pathname.startsWith('/training')) return 'cursos';
    return 'cursos';
  };

  const [activeTab, setActiveTab] = useState<AcademiaTab>(getInitialTab);

  useEffect(() => {
    setActiveTab(getInitialTab());
  }, [location.pathname, searchParams]);

  const handleTabChange = (tab: AcademiaTab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const getAdminPath = () => {
    switch (activeTab) {
      case 'cursos':
        return '/training/admin';
      case 'rutas':
        return '/ruta-aprendizaje/admin';
      case 'meet':
        return '/events-meet/admin';
      case 'blog':
        return '/blog/admin';
      default:
        return '/training/admin';
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen h-auto bg-surface-primary relative overflow-x-hidden">
      {/* Master Top Navigation Bar */}
      <header className="sticky top-0 z-50 bg-surface-primary/85 dark:bg-black/60 backdrop-blur-xl border-b border-border-light/60 dark:border-white/10 px-3 sm:px-6 py-2.5 transition-all">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2.5 sm:gap-4">
          
          {/* Left: Brand Badge & OpenSidebar */}
          <div className="flex items-center justify-between w-full md:w-auto gap-3">
            <div className="flex items-center gap-2.5">
              {!navVisible && (
                <div className="hidden md:block">
                  <OpenSidebar setNavVisible={setNavVisible} />
                </div>
              )}
              <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
                <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 shrink-0" />
                <span className="text-xs sm:text-sm font-black text-text-primary tracking-tight">
                  Academia WAPPY
                </span>
              </div>
            </div>

            {/* Mobile Admin / Login Button (shown on mobile right) */}
            <div className="md:hidden">
              {isAdmin ? (
                <button
                  onClick={() => navigate(getAdminPath())}
                  className="flex items-center gap-1.5 bg-surface-secondary dark:bg-white/10 px-3 py-1 rounded-full border border-border-light dark:border-white/10 text-text-primary text-xs font-bold transition-colors"
                >
                  <Shield className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Admin</span>
                </button>
              ) : !user ? (
                <button
                  onClick={() => navigate('/login')}
                  className="bg-emerald-600 text-white px-3 py-1 rounded-full text-xs font-bold"
                >
                  Ingresar
                </button>
              ) : null}
            </div>
          </div>

          {/* Center: Responsive Tabs */}
          <nav aria-label="Secciones de Academia" className="w-full md:w-auto flex justify-center overflow-x-auto no-scrollbar py-0.5">
            <div className="flex items-center gap-1 bg-surface-secondary/70 dark:bg-white/5 p-1 rounded-full border border-border-medium/20 shrink-0 max-w-full">
              <button
                onClick={() => handleTabChange('cursos')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 whitespace-nowrap cursor-pointer ${
                  activeTab === 'cursos'
                    ? 'bg-surface-primary dark:bg-surface-secondary text-emerald-600 dark:text-emerald-400 shadow-sm border border-border-medium/40'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover/50'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Cursos Abiertos</span>
              </button>

              <button
                onClick={() => handleTabChange('rutas')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 whitespace-nowrap cursor-pointer ${
                  activeTab === 'rutas'
                    ? 'bg-surface-primary dark:bg-surface-secondary text-teal-600 dark:text-teal-400 shadow-sm border border-border-medium/40'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover/50'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Plan Empresa</span>
              </button>

              <button
                onClick={() => handleTabChange('meet')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 whitespace-nowrap cursor-pointer ${
                  activeTab === 'meet'
                    ? 'bg-surface-primary dark:bg-surface-secondary text-purple-600 dark:text-purple-400 shadow-sm border border-border-medium/40'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover/50'
                }`}
              >
                <Video className="w-3.5 h-3.5" />
                <span>Clases en Vivo</span>
              </button>

              <button
                onClick={() => handleTabChange('blog')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 whitespace-nowrap cursor-pointer ${
                  activeTab === 'blog'
                    ? 'bg-surface-primary dark:bg-surface-secondary text-indigo-600 dark:text-indigo-400 shadow-sm border border-border-medium/40'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover/50'
                }`}
              >
                <Newspaper className="w-3.5 h-3.5" />
                <span>Artículos & Blog</span>
              </button>
            </div>
          </nav>

          {/* Right: Desktop Admin / Login Button */}
          <div className="hidden md:flex items-center gap-3">
            {isAdmin ? (
              <button
                onClick={() => navigate(getAdminPath())}
                className="group flex items-center gap-2 bg-surface-primary/80 dark:bg-white/10 backdrop-blur-md px-4 py-1.5 border border-border-light dark:border-white/10 hover:bg-surface-hover dark:hover:bg-white/20 text-text-primary rounded-full transition-all duration-300 shadow-sm hover:scale-105 cursor-pointer"
                title="Administrar sección actual"
              >
                <Shield className="w-4 h-4 text-emerald-500" />
                <span className="font-bold text-xs uppercase tracking-wider">Administrar</span>
              </button>
            ) : !user ? (
              <button
                onClick={() => navigate('/login')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-1.5 rounded-full transition-all duration-300 font-bold text-xs uppercase tracking-wider shadow-sm hover:scale-105"
              >
                Iniciar Sesión
              </button>
            ) : null}
          </div>

        </div>
      </header>

      {/* Main Tab Content */}
      <main className="flex-1 flex flex-col relative">
        {activeTab === 'cursos' && (
          <div className="flex-1 animate-in fade-in duration-200">
            <TrainingDashboard hideFloatingHeader={true} />
          </div>
        )}
        {activeTab === 'rutas' && (
          <div className="flex-1 animate-in fade-in duration-200">
            <RutaAprendizajeDashboard hideFloatingHeader={true} />
          </div>
        )}
        {activeTab === 'meet' && (
          <div className="flex-1 animate-in fade-in duration-200">
            <EventsMeetDashboard hideFloatingHeader={true} />
          </div>
        )}
        {activeTab === 'blog' && (
          <div className="flex-1 animate-in fade-in duration-200">
            <BlogDashboard hideFloatingHeader={true} />
          </div>
        )}
      </main>
    </div>
  );
}
