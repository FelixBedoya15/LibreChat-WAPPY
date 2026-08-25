import React, { useState, useEffect } from 'react';
import { useLocation, useSearchParams, useNavigate, useOutletContext } from 'react-router-dom';
import { 
  GraduationCap, 
  BookOpen, 
  Building2, 
  Video, 
  Newspaper,
  Shield,
  Layers
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
      {/* Master Top Header with Centro de Control style + Transparent Glassmorphism on Scroll */}
      <header className="sticky top-0 z-50 bg-white/70 dark:bg-gray-950/70 backdrop-blur-xl border-b border-border-medium/30 dark:border-white/10 px-4 sm:px-6 pt-4 pb-3.5 shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          
          {/* Header Left: Badge, Title with Gradient, and Subtitle */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              {!navVisible && (
                <div className="hidden md:block mr-1">
                  <OpenSidebar setNavVisible={setNavVisible} />
                </div>
              )}
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400 border border-teal-200/50 dark:border-teal-800/40 uppercase tracking-wider">
                <Layers className="w-3 h-3" />
                Módulo de Formación & Conocimiento
              </span>
            </div>
            
            <h1 className="text-xl sm:text-2xl font-extrabold flex items-center gap-2.5 bg-clip-text text-transparent bg-gradient-to-r from-teal-600 via-emerald-600 to-purple-600 dark:from-teal-400 dark:via-emerald-400 dark:to-purple-400">
              <GraduationCap className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-500 shrink-0" />
              Academia WAPPY
            </h1>
            <p className="text-xs text-text-secondary mt-0.5 hidden sm:block">
              Centro integral de capacitación continua, rutas corporativas, eventos sincrónicos y blog técnico.
            </p>
          </div>

          {/* Header Right: Master Tabs Selector + Admin Button */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full lg:w-auto">
            {/* Master Tabs Container */}
            <div className="flex items-center bg-gray-100/90 dark:bg-gray-800/80 p-1.5 rounded-2xl border border-border-medium/30 shrink-0 w-full sm:w-auto overflow-x-auto no-scrollbar">
              <button
                onClick={() => handleTabChange('cursos')}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer whitespace-nowrap ${
                  activeTab === 'cursos'
                    ? 'bg-white dark:bg-gray-900 text-teal-600 dark:text-teal-400 shadow-sm border border-border-medium/40'
                    : 'text-text-secondary hover:text-text-primary hover:bg-white/50 dark:hover:bg-gray-700/40'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-teal-500" />
                <span>Cursos Abiertos</span>
              </button>

              <button
                onClick={() => handleTabChange('rutas')}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer whitespace-nowrap ${
                  activeTab === 'rutas'
                    ? 'bg-white dark:bg-gray-900 text-emerald-600 dark:text-emerald-400 shadow-sm border border-border-medium/40'
                    : 'text-text-secondary hover:text-text-primary hover:bg-white/50 dark:hover:bg-gray-700/40'
                }`}
              >
                <Building2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Plan Empresa</span>
              </button>

              <button
                onClick={() => handleTabChange('meet')}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer whitespace-nowrap ${
                  activeTab === 'meet'
                    ? 'bg-white dark:bg-gray-900 text-purple-600 dark:text-purple-400 shadow-sm border border-border-medium/40'
                    : 'text-text-secondary hover:text-text-primary hover:bg-white/50 dark:hover:bg-gray-700/40'
                }`}
              >
                <Video className="w-3.5 h-3.5 text-purple-500" />
                <span>Clases en Vivo</span>
              </button>

              <button
                onClick={() => handleTabChange('blog')}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer whitespace-nowrap ${
                  activeTab === 'blog'
                    ? 'bg-white dark:bg-gray-900 text-indigo-600 dark:text-indigo-400 shadow-sm border border-border-medium/40'
                    : 'text-text-secondary hover:text-text-primary hover:bg-white/50 dark:hover:bg-gray-700/40'
                }`}
              >
                <Newspaper className="w-3.5 h-3.5 text-indigo-500" />
                <span>Artículos & Blog</span>
              </button>
            </div>

            {/* Administrar / Iniciar Sesión Button */}
            {isAdmin ? (
              <button
                onClick={() => navigate(getAdminPath())}
                className="group flex items-center justify-center gap-2 bg-white/80 dark:bg-gray-900/80 hover:bg-gray-50 dark:hover:bg-gray-800 px-3.5 py-2 border border-border-medium/50 dark:border-white/10 text-text-primary rounded-2xl transition-all duration-200 shadow-sm cursor-pointer shrink-0 text-xs font-bold uppercase tracking-wider"
                title="Administrar sección actual"
              >
                <Shield className="w-3.5 h-3.5 text-teal-500" />
                <span>Administrar</span>
              </button>
            ) : !user ? (
              <button
                onClick={() => navigate('/login')}
                className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-2xl transition-all duration-200 font-bold text-xs uppercase tracking-wider shadow-sm shrink-0"
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
