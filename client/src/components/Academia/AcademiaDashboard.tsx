import React, { useState, useEffect } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { 
  GraduationCap, 
  BookOpen, 
  Building2, 
  Video, 
  Newspaper
} from 'lucide-react';
import TrainingDashboard from '~/components/Training/TrainingDashboard';
import RutaAprendizajeDashboard from '~/components/RutaAprendizaje/RutaAprendizajeDashboard';
import EventsMeetDashboard from '~/components/EventsMeet/EventsMeetDashboard';
import BlogDashboard from '~/components/Blog/BlogDashboard';

export type AcademiaTab = 'cursos' | 'rutas' | 'meet' | 'blog';

export default function AcademiaDashboard() {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

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

  return (
    <div className="flex-1 flex flex-col min-h-screen h-auto bg-surface-primary relative">
      {/* Floating Top Master Tab Bar */}
      <div className="sticky top-0 z-40 bg-surface-primary/95 backdrop-blur-md border-b border-border-light dark:border-white/10 px-4 sm:px-8 py-3.5 flex flex-col md:flex-row justify-between items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black text-text-primary flex items-center gap-2">
              Academia WAPPY
            </h1>
            <p className="text-[11px] text-text-secondary hidden sm:block">
              Centro integral de capacitación, eventos en vivo y conocimiento SST.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center bg-surface-secondary/80 dark:bg-gray-800/80 p-1 rounded-2xl border border-border-medium/30 shrink-0 overflow-x-auto max-w-full">
          <button
            onClick={() => handleTabChange('cursos')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 whitespace-nowrap cursor-pointer ${
              activeTab === 'cursos'
                ? 'bg-surface-primary text-emerald-600 dark:text-emerald-400 shadow-sm border border-border-medium/40'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Cursos Abiertos</span>
          </button>

          <button
            onClick={() => handleTabChange('rutas')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 whitespace-nowrap cursor-pointer ${
              activeTab === 'rutas'
                ? 'bg-surface-primary text-teal-600 dark:text-teal-400 shadow-sm border border-border-medium/40'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Plan Empresa</span>
          </button>

          <button
            onClick={() => handleTabChange('meet')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 whitespace-nowrap cursor-pointer ${
              activeTab === 'meet'
                ? 'bg-surface-primary text-purple-600 dark:text-purple-400 shadow-sm border border-border-medium/40'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>Clases en Vivo</span>
          </button>

          <button
            onClick={() => handleTabChange('blog')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 whitespace-nowrap cursor-pointer ${
              activeTab === 'blog'
                ? 'bg-surface-primary text-indigo-600 dark:text-indigo-400 shadow-sm border border-border-medium/40'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
            }`}
          >
            <Newspaper className="w-3.5 h-3.5" />
            <span>Artículos & Blog</span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 flex flex-col">
        {activeTab === 'cursos' && (
          <div className="flex-1 animate-in fade-in duration-200">
            <TrainingDashboard />
          </div>
        )}
        {activeTab === 'rutas' && (
          <div className="flex-1 animate-in fade-in duration-200">
            <RutaAprendizajeDashboard />
          </div>
        )}
        {activeTab === 'meet' && (
          <div className="flex-1 animate-in fade-in duration-200">
            <EventsMeetDashboard />
          </div>
        )}
        {activeTab === 'blog' && (
          <div className="flex-1 animate-in fade-in duration-200">
            <BlogDashboard />
          </div>
        )}
      </div>
    </div>
  );
}
