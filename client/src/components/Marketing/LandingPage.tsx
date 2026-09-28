import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Brain,
  Activity,
  FileSpreadsheet,
  AlertTriangle,
  Bot,
  Zap,
  Camera,
  Layers,
  GraduationCap,
  Award,
  Users,
  ChevronRight,
  TrendingUp,
  Clock,
  ExternalLink,
  MessageSquare,
  Shield,
  FileCheck2,
  Building2,
  FileText,
  UserCheck,
  Flame,
  HelpCircle,
  Menu,
  X,
  Sun,
  Moon,
  Compass,
  Briefcase,
  Play,
  Database,
  Code2,
  QrCode,
  HeartPulse,
  Scale,
  Video,
  FileBadge
} from 'lucide-react';
import { useAuthContext } from '~/hooks';

export default function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthContext();

  // Dark/Light Theme local state
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('color-theme');
      if (savedTheme) {
        return savedTheme === 'dark';
      }
      return document.documentElement.classList.contains('dark') ||
             window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      root.classList.remove('light');
      localStorage.setItem('color-theme', 'dark');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
      localStorage.setItem('color-theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark((prev) => !prev);

  // Mobile menu toggle
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Track Selector: 'bio' (Motor Bio-Individual) vs 'org' (Salud Organizacional)
  const [activeTrack, setActiveTrack] = useState<'bio' | 'org'>('bio');

  // Agent category filter
  const [activeAgentCategory, setActiveAgentCategory] = useState<string>('todos');

  // Video Demo Modal
  const [videoModalOpen, setVideoModalOpen] = useState(false);

  // Agents Roster
  const agentsList = [
    {
      id: 'tenshi',
      name: 'Tenshi IA',
      category: 'orquestador',
      categoryLabel: 'Orquestador Nativo',
      avatar: '/assets/tenshi.png',
      badge: 'Motor Estrella',
      desc: 'Consulta tu base de datos en tiempo real, gestiona expedientes, actualiza hitos y redacta informes ejecutivos en Somos SST.',
      prompt: '"Tenshi, actualiza los vencimientos del Centro de Control ACPM y genera el resumen gerencial..."',
      isStar: true,
    },
    {
      id: 'profesional_sst',
      name: 'Profesional SST Integral',
      category: 'prevencion',
      categoryLabel: 'Prevención & Liderazgo',
      avatar: '/images/profesional_sst.png',
      badge: 'GTC 45 / Dec. 1072',
      desc: 'Estructuración y supervisión integral del SG-SST, matrices de riesgos, planes anuales de trabajo y comités paritarios.',
      prompt: '"Estructura el plan anual de trabajo 2026 para una constructora de 85 trabajadores..."',
    },
    {
      id: 'abogado_laboral',
      name: 'Abogado Laboral RIT',
      category: 'legal',
      categoryLabel: 'Legal & Normativo',
      avatar: '/images/abogado_laboral.png',
      badge: 'Jornada 42 Horas',
      desc: 'Asesoría en litigios laborales, descargos, redacción de RIT con reformas vigentes y respuesta a requerimientos del MinTrabajo.',
      prompt: '"Revisa la cláusula de desconexión laboral y las obligaciones del RIT bajo Ley 2191..."',
    },
    {
      id: 'riesgo_vial',
      name: 'Coordinador PESV',
      category: 'prevencion',
      categoryLabel: 'Seguridad Vial',
      avatar: '/images/riesgo_vial.png',
      badge: 'Res. 20223040040595',
      desc: 'Diagnóstico de flota vehicular, análisis de rutas críticas, matriz de riesgos viales (NP+NE+NC) y planes de acción PESV.',
      prompt: '"Evalúa el nivel de diseño de nuestro PESV para una empresa de transporte intermunicipal..."',
    },
    {
      id: 'riesgo_quimico',
      name: 'Especialista Químico & SGA',
      category: 'prevencion',
      categoryLabel: 'Riesgo Químico',
      avatar: '/images/riesgo_quimico.png',
      badge: 'Decreto 1496 / SGA',
      desc: 'Clasificación de sustancias químicas por pictogramas ONU, compatibilidad y matrices de segregación verde/amarillo/rojo.',
      prompt: '"Genera la matriz de compatibilidad para ácido sulfúrico, hipoclorito de sodio y alcohol etílico..."',
    },
    {
      id: 'psicologo_sst',
      name: 'Psicólogo de Riesgo Psicosocial',
      category: 'salud',
      categoryLabel: 'Salud Mental & Clima',
      avatar: '/images/psicologo_sst.png',
      badge: 'Batería MinTrabajo',
      desc: 'Interpretación de estrés ocupacional, factores intra y extralaborales, síndrome de burnout y protocolos de intervención.',
      prompt: '"Diseña un protocolo de prevención de burnout para líderes de operaciones con alta carga horaria..."',
    },
    {
      id: 'auditor_sg_sst',
      name: 'Auditor Líder SG-SST',
      category: 'auditoria',
      categoryLabel: 'Auditoría & Calidad',
      avatar: '/images/auditor_sg_sst.png',
      badge: 'ISO 45001 / Res. 0312',
      desc: 'Simulación de auditorías de estándares mínimos, hallazgos de no conformidad, planes de mejora y trazabilidad documental.',
      prompt: '"Audita el estándar 3.1.1 de la Resolución 0312 y redacta el informe de hallazgos..."',
    },
    {
      id: 'fisioterapeuta',
      name: 'Ergónomo & Biomecánico',
      category: 'salud',
      categoryLabel: 'Ergonomía & Salud',
      avatar: '/images/fisioterapeuta.png',
      badge: 'Métodos OWAS / ROSA',
      desc: 'Autoevaluaciones de puesto de trabajo en vivo, evaluación postural, manipulación manual de cargas y rediseño de puestos.',
      prompt: '"Inicia la autoevaluación postural guiada EPT para el operario de empaque en turno nocturno..."',
    },
    {
      id: 'medico_laboral',
      name: 'Médico del Trabajo',
      category: 'salud',
      categoryLabel: 'Medicina Laboral',
      avatar: '/images/medico_laboral.png',
      badge: 'Conceptos de Aptitud',
      desc: 'Análisis de restricciones médicas, exámenes de ingreso/periódicos, profesiogramas y reubicaciones laborales.',
      prompt: '"Recomienda el plan de reincorporación para un operario con diagnóstico de túnel del carpo bilateral..."',
    },
  ];

  const filteredAgents =
    activeAgentCategory === 'todos'
      ? agentsList
      : agentsList.filter((a) => a.category === activeAgentCategory || a.category === 'orquestador');

  return (
    <div className="min-h-screen bg-white text-slate-900 dark:bg-[#090A0F] dark:text-slate-100 selection:bg-teal-500 selection:text-white font-sans antialiased transition-colors duration-300">
      {/* Background Subtle Grid / Dots */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-60 dark:opacity-40" />
      </div>

      {/* TOP NAVIGATION BAR (Exact Figma SaaS Style) */}
      <header className="sticky top-0 z-50 w-full bg-white/90 dark:bg-[#090A0F]/90 backdrop-blur-md border-b border-slate-200/80 dark:border-zinc-800/80 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 sm:h-20 flex items-center justify-between">
          {/* Logo & Brand: Squircle + Bold Name */}
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
              <div className="w-5 h-5 rounded-md border-2 border-white dark:border-slate-900 flex items-center justify-center font-black text-white dark:text-slate-900 text-[10px]">
                W
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white">
                WAPPY
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 dark:text-zinc-500">
                SST & PESV Colombia
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <a href="#metodologia" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              Metodología
            </a>
            <a href="#herramientas" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              Herramientas
            </a>
            <a href="#agentes" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              Agentes IA
            </a>
            <a href="#academia" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              Academia LMS
            </a>
            <a href="#planes" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              Planes
            </a>
            <a href="#creador" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              El Creador
            </a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="w-9 h-9 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-slate-600 dark:text-slate-300 hover:border-slate-400 dark:hover:border-zinc-600 flex items-center justify-center transition-all active:scale-95"
              title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>

            {isAuthenticated ? (
              <button
                onClick={() => navigate('/c/new')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 shadow-sm transition-all active:scale-95"
              >
                <span>Ir al Chat</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate('/login')}
                  className="px-3.5 py-2 rounded-xl font-semibold text-xs text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  Ingresar
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 shadow-sm transition-all active:scale-95"
                >
                  <span>Comenzar Ahora</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </>
            )}

            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden w-9 h-9 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-slate-700 dark:text-slate-200 flex items-center justify-center transition-all"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-b border-slate-200 dark:border-zinc-800 bg-white/95 dark:bg-[#090A0F]/95 backdrop-blur-2xl px-4 py-5 space-y-3">
            <a
              href="#metodologia"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-slate-900 py-1"
            >
              Metodología Somos SST
            </a>
            <a
              href="#herramientas"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-slate-900 py-1"
            >
              Herramientas & Canva
            </a>
            <a
              href="#agentes"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-slate-900 py-1"
            >
              Agentes IA
            </a>
            <a
              href="#academia"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-slate-900 py-1"
            >
              Academia LMS
            </a>
            <a
              href="#planes"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-slate-900 py-1"
            >
              Planes & Precios
            </a>
            <a
              href="#creador"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-slate-900 py-1"
            >
              El Creador
            </a>

            <div className="pt-3 border-t border-slate-200 dark:border-zinc-800 flex flex-col gap-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate('/login');
                }}
                className="w-full py-2.5 rounded-xl font-bold text-xs bg-slate-900 text-white dark:bg-white dark:text-slate-900"
              >
                Ingresar a la Plataforma
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="relative z-10">
        {/* HERO SECTION (100% Faithful to Figma "Design System SaaS" Layout) */}
        <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden">
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
            {/* Pill Capsule Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-slate-200 dark:border-zinc-800 bg-slate-100/90 dark:bg-zinc-900/90 text-slate-800 dark:text-slate-200 text-xs font-medium mb-8 shadow-xs">
              <span className="text-amber-500">✨</span>
              <span>Nuevo: Ecosistema Inteligente de SST Bio-Individual</span>
            </div>

            {/* Figma-Inspired Headline with Two-Tone Styling */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[70px] font-black tracking-tight text-slate-900 dark:text-white leading-[1.08] mb-6">
              Automatiza tu gestión SST{' '}
              <span className="text-slate-400 dark:text-zinc-500 font-extrabold">a escala</span>
            </h1>

            {/* Core Value Proposition */}
            <p className="text-base sm:text-lg md:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mb-9 font-normal leading-relaxed">
              Haz en <strong>20 minutos</strong> el trabajo documental que antes tomaba <strong>3 días</strong>.
              Crea matrices GTC-45 en tiempo real, proyecta aplicativos interactivos con base de datos en Google Sheets,
              audita puestos con visión artificial y escala tus asesorías con inteligencia artificial adaptada a Colombia.
            </p>

            {/* Figma Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full sm:w-auto mb-16">
              <button
                onClick={() => navigate('/login')}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-bold text-sm bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 shadow-md transition-all active:scale-95"
              >
                <span>Ingresar a WAPPY</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setVideoModalOpen(true)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-zinc-700 shadow-xs transition-all active:scale-95"
              >
                <Play className="w-4 h-4 text-slate-900 dark:text-white fill-slate-900 dark:fill-white" />
                <span>Ver Demostración</span>
              </button>
            </div>
          </div>

          {/* EXACT FIGMA DESIGN SYSTEM HERO CONSTELLATION GRAPHIC */}
          {/* Desktop Interactive Constellation */}
          <div className="hidden md:block relative w-full max-w-5xl mx-auto h-[580px] my-6 select-none">
            {/* SVG Connector Lines Radiating from Center (500, 290) */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox="0 0 1000 580"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Radiating connector lines */}
              <line x1="500" y1="290" x2="190" y2="90" stroke="currentColor" className="text-slate-200 dark:text-zinc-800" strokeWidth="1.5" />
              <line x1="500" y1="290" x2="140" y2="260" stroke="currentColor" className="text-slate-200 dark:text-zinc-800" strokeWidth="1.5" />
              <line x1="500" y1="290" x2="180" y2="460" stroke="currentColor" className="text-slate-200 dark:text-zinc-800" strokeWidth="1.5" />
              <line x1="500" y1="290" x2="500" y2="490" stroke="currentColor" className="text-slate-200 dark:text-zinc-800" strokeWidth="1.5" />
              <line x1="500" y1="290" x2="680" y2="85" stroke="currentColor" className="text-slate-200 dark:text-zinc-800" strokeWidth="1.5" />
              <line x1="500" y1="290" x2="840" y2="170" stroke="currentColor" className="text-slate-200 dark:text-zinc-800" strokeWidth="1.5" />
              <line x1="500" y1="290" x2="850" y2="340" stroke="currentColor" className="text-slate-200 dark:text-zinc-800" strokeWidth="1.5" />
              <line x1="500" y1="290" x2="790" y2="470" stroke="currentColor" className="text-slate-200 dark:text-zinc-800" strokeWidth="1.5" />

              {/* Scattered subtle plus signs and dots matching Figma */}
              <circle cx="120" cy="160" r="1.5" className="fill-slate-300 dark:fill-zinc-700" />
              <circle cx="340" cy="70" r="2" className="fill-slate-300 dark:fill-zinc-700" />
              <circle cx="400" cy="210" r="1.5" className="fill-slate-300 dark:fill-zinc-700" />
              <circle cx="280" cy="380" r="2" className="fill-slate-300 dark:fill-zinc-700" />
              <circle cx="620" cy="150" r="1.5" className="fill-slate-300 dark:fill-zinc-700" />
              <circle cx="640" cy="390" r="2" className="fill-slate-300 dark:fill-zinc-700" />
              <circle cx="820" cy="70" r="1.5" className="fill-slate-300 dark:fill-zinc-700" />
              <circle cx="910" cy="260" r="2" className="fill-slate-300 dark:fill-zinc-700" />
              <circle cx="730" cy="550" r="1.5" className="fill-slate-300 dark:fill-zinc-700" />
              <circle cx="380" cy="530" r="2" className="fill-slate-300 dark:fill-zinc-700" />

              {/* Little '+' markers */}
              <path d="M420 120V126M417 123H423" stroke="currentColor" className="text-slate-300 dark:text-zinc-700" strokeWidth="1" />
              <path d="M590 230V236M587 233H593" stroke="currentColor" className="text-slate-300 dark:text-zinc-700" strokeWidth="1" />
              <path d="M880 430V436M877 433H883" stroke="currentColor" className="text-slate-300 dark:text-zinc-700" strokeWidth="1" />
            </svg>

            {/* Central Dark Squircle Logo (Figma Style) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
              <div className="w-20 h-20 rounded-3xl bg-slate-900 dark:bg-zinc-900 border border-slate-700/80 dark:border-zinc-700 shadow-2xl flex items-center justify-center transition-transform hover:scale-105">
                <div className="w-9 h-9 rounded-xl border-[3.5px] border-white flex items-center justify-center font-black text-white text-base">
                  W
                </div>
              </div>
            </div>

            {/* NODE 1: "Button" (Top-Left) */}
            <div className="absolute top-[6%] left-[10%] z-10 w-44 p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 shadow-xl shadow-slate-200/40 dark:shadow-none hover:border-slate-400 dark:hover:border-zinc-600 transition-all">
              <span className="text-[11px] font-medium text-slate-400 dark:text-zinc-400 block mb-2.5">
                Button
              </span>
              <div className="h-6 w-32 bg-slate-900 dark:bg-white rounded-full flex items-center justify-center text-[10px] font-bold text-white dark:text-slate-900 px-3">
                Reportar Peligro
              </div>
              <div className="h-2 w-16 bg-slate-200 dark:bg-zinc-700 rounded-full mt-2.5" />
            </div>

            {/* NODE 2: "Docs" (Middle-Left) */}
            <div className="absolute top-[34%] left-[4%] z-10 w-48 p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 shadow-xl shadow-slate-200/40 dark:shadow-none hover:border-slate-400 dark:hover:border-zinc-600 transition-all">
              <span className="text-[11px] font-medium text-slate-400 dark:text-zinc-400 block mb-2.5">
                Docs
              </span>
              <div className="h-2.5 w-24 bg-slate-300 dark:bg-zinc-600 rounded-full mb-2" />
              <div className="h-2 w-36 bg-slate-100 dark:bg-zinc-800 rounded-full mb-1.5" />
              <div className="h-2 w-28 bg-slate-100 dark:bg-zinc-800 rounded-full mb-1.5" />
              <div className="h-2 w-32 bg-slate-100 dark:bg-zinc-800 rounded-full" />
            </div>

            {/* NODE 3: "Typography" (Bottom-Left) */}
            <div className="absolute top-[70%] left-[8%] z-10 w-48 p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 shadow-xl shadow-slate-200/40 dark:shadow-none hover:border-slate-400 dark:hover:border-zinc-600 transition-all">
              <span className="text-[11px] font-medium text-slate-400 dark:text-zinc-400 block mb-2.5">
                Typography
              </span>
              <div className="h-4 w-32 bg-slate-900 dark:bg-white rounded-sm mb-2" />
              <div className="h-2.5 w-36 bg-slate-300 dark:bg-zinc-600 rounded-full mb-1.5" />
              <div className="h-2 w-24 bg-slate-200 dark:bg-zinc-700 rounded-full" />
            </div>

            {/* NODE 4: "Icons" (Bottom-Center) */}
            <div className="absolute top-[76%] left-1/2 -translate-x-1/2 z-10 w-48 p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 shadow-xl shadow-slate-200/40 dark:shadow-none hover:border-slate-400 dark:hover:border-zinc-600 transition-all">
              <span className="text-[11px] font-medium text-slate-400 dark:text-zinc-400 block mb-2.5">
                Icons
              </span>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-teal-100 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center text-[10px] font-bold">
                  T
                </div>
                <div className="w-6 h-6 rounded-md bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center text-[10px] font-bold">
                  M
                </div>
                <div className="w-6 h-6 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center text-[10px] font-bold">
                  V
                </div>
                <div className="w-6 h-6 rounded-md bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center text-[10px] font-bold">
                  Q
                </div>
              </div>
            </div>

            {/* NODE 5: "Versions" (Top-Center-Right) */}
            <div className="absolute top-[4%] right-[22%] z-10 w-44 p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 shadow-xl shadow-slate-200/40 dark:shadow-none hover:border-slate-400 dark:hover:border-zinc-600 transition-all">
              <span className="text-[11px] font-medium text-slate-400 dark:text-zinc-400 block mb-2.5">
                Versions
              </span>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>v2.1.0 (Dec. 1072)</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>v2.0.5 (Res. 0312)</span>
                </div>
              </div>
            </div>

            {/* NODE 6: "Spacing" (Top-Right-Outer) */}
            <div className="absolute top-[20%] right-[4%] z-10 w-44 p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 shadow-xl shadow-slate-200/40 dark:shadow-none hover:border-slate-400 dark:hover:border-zinc-600 transition-all">
              <span className="text-[11px] font-medium text-slate-400 dark:text-zinc-400 block mb-2.5">
                Spacing
              </span>
              <div className="space-y-1.5">
                <div className="h-2 w-28 bg-slate-900 dark:bg-white rounded-full" />
                <div className="h-2 w-20 bg-slate-300 dark:bg-zinc-600 rounded-full" />
                <div className="h-2 w-14 bg-slate-200 dark:bg-zinc-700 rounded-full" />
              </div>
            </div>

            {/* NODE 7: "Colors" (Middle-Right) */}
            <div className="absolute top-[50%] right-[4%] z-10 w-44 p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 shadow-xl shadow-slate-200/40 dark:shadow-none hover:border-slate-400 dark:hover:border-zinc-600 transition-all">
              <span className="text-[11px] font-medium text-slate-400 dark:text-zinc-400 block mb-2.5">
                Colors
              </span>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-slate-900 dark:bg-white" />
                <div className="w-5 h-5 rounded-md bg-red-500" />
                <div className="w-5 h-5 rounded-md bg-orange-500" />
                <div className="w-5 h-5 rounded-md bg-teal-600" />
                <div className="w-5 h-5 rounded-md bg-blue-600" />
              </div>
            </div>

            {/* NODE 8: "Components" (Bottom-Right) */}
            <div className="absolute top-[72%] right-[12%] z-10 w-48 p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 shadow-xl shadow-slate-200/40 dark:shadow-none hover:border-slate-400 dark:hover:border-zinc-600 transition-all">
              <span className="text-[11px] font-medium text-slate-400 dark:text-zinc-400 block mb-2.5">
                Components
              </span>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded-sm bg-slate-900 dark:bg-white flex items-center justify-center">
                    <CheckCircle2 className="w-2.5 h-2.5 text-white dark:text-slate-900" />
                  </div>
                  <div className="h-2 w-24 bg-slate-300 dark:bg-zinc-600 rounded-full" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded-sm border border-slate-300 dark:border-zinc-700" />
                  <div className="h-2 w-28 bg-slate-200 dark:bg-zinc-700 rounded-full" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded-sm border border-slate-300 dark:border-zinc-700" />
                  <div className="h-2 w-18 bg-slate-200 dark:bg-zinc-700 rounded-full" />
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Fallback: Clean Structured Grid */}
          <div className="block md:hidden mt-8 max-w-md mx-auto space-y-4">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-slate-900 dark:bg-zinc-900 border border-slate-700 flex items-center justify-center shadow-xl">
                <div className="w-7 h-7 rounded-lg border-2 border-white flex items-center justify-center font-black text-white text-xs">
                  W
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-left">
              <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm">
                <span className="text-[10px] text-slate-400 font-bold block mb-1">Button</span>
                <div className="h-5 w-20 bg-slate-900 dark:bg-white rounded-full text-[9px] text-white dark:text-slate-900 flex items-center justify-center font-bold">
                  Peligro
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm">
                <span className="text-[10px] text-slate-400 font-bold block mb-1">Versions</span>
                <span className="text-[11px] font-semibold text-emerald-600 block">● Dec. 1072</span>
                <span className="text-[11px] font-semibold text-amber-600 block">● Res. 0312</span>
              </div>
              <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm">
                <span className="text-[10px] text-slate-400 font-bold block mb-1">Docs</span>
                <div className="h-2 w-16 bg-slate-300 dark:bg-zinc-600 rounded-full mb-1" />
                <div className="h-1.5 w-24 bg-slate-200 dark:bg-zinc-700 rounded-full" />
              </div>
              <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm">
                <span className="text-[10px] text-slate-400 font-bold block mb-1">Colors</span>
                <div className="flex gap-1.5 mt-1">
                  <div className="w-3.5 h-3.5 rounded bg-slate-900 dark:bg-white" />
                  <div className="w-3.5 h-3.5 rounded bg-red-500" />
                  <div className="w-3.5 h-3.5 rounded bg-teal-600" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* METRICS & PROOF BAR */}
        <section className="py-12 border-y border-slate-200/80 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-900/30 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                Ecosistema validado en Colombia
              </p>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                Diseñado para Asesores, Consultores y Responsables SST
              </h3>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-8 text-slate-700 dark:text-slate-300">
              <div className="flex flex-col">
                <span className="text-2xl font-black text-slate-900 dark:text-white">+85</span>
                <span className="text-[11px] font-semibold text-slate-500">Empresas Asesoradas</span>
              </div>
              <div className="w-px h-8 bg-slate-200 dark:bg-zinc-800 hidden sm:block" />
              <div className="flex flex-col">
                <span className="text-2xl font-black text-slate-900 dark:text-white">99.2%</span>
                <span className="text-[11px] font-semibold text-slate-500">Cumplimiento Res. 0312</span>
              </div>
              <div className="w-px h-8 bg-slate-200 dark:bg-zinc-800 hidden sm:block" />
              <div className="flex flex-col">
                <span className="text-2xl font-black text-slate-900 dark:text-white">10x</span>
                <span className="text-[11px] font-semibold text-slate-500">Velocidad en Matrices</span>
              </div>
              <div className="w-px h-8 bg-slate-200 dark:bg-zinc-800 hidden sm:block" />
              <div className="flex flex-col">
                <span className="text-2xl font-black text-slate-900 dark:text-white">100%</span>
                <span className="text-[11px] font-semibold text-slate-500">Normativa Vigente</span>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION: EL DOLOR OCULTO DEL PREVENCIONISTA (Clean 3-Card Design) */}
        <section className="py-24 bg-white dark:bg-[#090A0F] px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="text-xs uppercase tracking-widest font-extrabold text-slate-500 dark:text-zinc-400 mb-2 block">
                El Panorama Real de la SST
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">
                El Dolor Oculto del Asesor y Consultor SST
              </h2>
              <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
                Pasamos más del 80% de nuestra jornada laboral peleando con celdas de Excel y armando carpetas que los gerentes consideran un gasto obligatorio, en vez de una inversión estratégica.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="p-8 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm hover:border-slate-400 dark:hover:border-zinc-600 transition-all text-left">
                <div className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white mb-3">10h+</div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white mb-2">
                  Por Matriz de Riesgo Manual
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Redactar descripciones, consecuencias, niveles de deficiencia y controles sugeridos fila por fila en hojas de cálculo inertes que quedan obsoletas al mes siguiente.
                </p>
              </div>

              <div className="p-8 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm hover:border-slate-400 dark:hover:border-zinc-600 transition-all text-left">
                <div className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white mb-3">80%</div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white mb-2">
                  Burocracia Documental
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  El consultor se convierte en un redactor de actas, políticas y formatos para pasar la auditoría, perdiendo el tiempo valioso que debería dedicar a la intervención directa en campo.
                </p>
              </div>

              <div className="p-8 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm hover:border-slate-400 dark:hover:border-zinc-600 transition-all text-left">
                <div className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white mb-3">0%</div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white mb-2">
                  Personalización Individual
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Las matrices tradicionales evalúan cargos promedio abstractos. No saben si el soldador tiene escoliosis o si el conductor lleva 12 horas sin dormir. WAPPY cambia esto con SST Bio-Individual.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION: METODOLOGÍA SOMOS SST (Interactive Track Selector) */}
        <section id="metodologia" className="py-24 bg-slate-50 dark:bg-zinc-900/40 border-t border-slate-200 dark:border-zinc-800 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-14">
              <span className="text-xs uppercase tracking-widest font-extrabold text-slate-500 dark:text-zinc-400 mb-2 block">
                Nuestra Metodología
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">
                La Metodología Somos SST: De la Biología a la Organización
              </h2>
              <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
                WAPPY no es un repositorio de PDFs. Es el motor operativo de la metodología <strong>Somos SST</strong>, estructurada en dos pistas complementarias:
              </p>
            </div>

            {/* Track Switcher (Pill Style) */}
            <div className="flex justify-center mb-12">
              <div className="inline-flex p-1.5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm">
                <button
                  onClick={() => setActiveTrack('bio')}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                    activeTrack === 'bio'
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Activity className="w-4 h-4" />
                  <span>Pista 1: Motor Bio-Individual (5 Hitos)</span>
                </button>
                <button
                  onClick={() => setActiveTrack('org')}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                    activeTrack === 'org'
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span>Pista 2: Salud Organizacional & Clima</span>
                </button>
              </div>
            </div>

            {/* Track 1: 5 Hitos Bio-Individuales */}
            {activeTrack === 'bio' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
                <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xs hover:border-slate-400 dark:hover:border-zinc-600 transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <span className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-white flex items-center justify-center font-black text-xs">
                      01
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Entrada
                    </span>
                  </div>
                  <h4 className="font-extrabold text-base text-slate-900 dark:text-white mb-2">
                    Diagnóstico Clínico Individual
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Captura diagnósticos CIE-10, conceptos médicos de aptitud, antecedentes osteomusculares y condiciones de vulnerabilidad por trabajador en expedientes encriptados.
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xs hover:border-slate-400 dark:hover:border-zinc-600 transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <span className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-white flex items-center justify-center font-black text-xs">
                      02
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Evaluación
                    </span>
                  </div>
                  <h4 className="font-extrabold text-base text-slate-900 dark:text-white mb-2">
                    Autoevaluación EPT con IA
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    El trabajador realiza una autoevaluación interactiva guiada por el <em>Fisioterapeuta IA</em>. Tests de movilidad, ángulo de visión y posturas críticas clasificadas con método OWAS/ROSA.
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xs hover:border-slate-400 dark:hover:border-zinc-600 transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <span className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-white flex items-center justify-center font-black text-xs">
                      03
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Cálculo
                    </span>
                  </div>
                  <h4 className="font-extrabold text-base text-slate-900 dark:text-white mb-2">
                    Matriz Bio-IPEVAR GTC-45
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Cruza el peligro del entorno con la patología del trabajador. Si el puesto tiene vibración pero el colaborador tiene discopatía lumbar, el nivel de riesgo se recalcula automáticamente.
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xs hover:border-slate-400 dark:hover:border-zinc-600 transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <span className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-white flex items-center justify-center font-black text-xs">
                      04
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Intervención
                    </span>
                  </div>
                  <h4 className="font-extrabold text-base text-slate-900 dark:text-white mb-2">
                    Plan de Manejo & Adaptación
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Generación inmediata de recomendaciones de ingeniería, controles administrativos, pausas osteomusculares dirigidas y rediseño de puesto de trabajo.
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xs hover:border-slate-400 dark:hover:border-zinc-600 transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <span className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-white flex items-center justify-center font-black text-xs">
                      05
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Control
                    </span>
                  </div>
                  <h4 className="font-extrabold text-base text-slate-900 dark:text-white mb-2">
                    Seguimiento Continuo & Alertas
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Cronogramas automáticos con alertas a WhatsApp para reevaluaciones médicas periódicas y verificación de efectividad de las medidas correctivas.
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-2">
                      Resultado Clave
                    </span>
                    <h4 className="font-black text-lg mb-2">
                      Cero Papeleo Muerto
                    </h4>
                    <p className="text-xs opacity-90 leading-relaxed">
                      El SG-SST deja de ser una carpeta empolvada para convertirse en un expediente vivo que protege legalmente a la empresa y previene enfermedades laborales reales.
                    </p>
                  </div>
                  <button
                    onClick={() => navigate('/login')}
                    className="mt-6 flex items-center gap-2 text-xs font-bold underline hover:opacity-80"
                  >
                    <span>Comenzar a implementar</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Track 2: Salud Organizacional */}
            {activeTrack === 'org' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xs">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-white flex items-center justify-center font-bold mb-4">
                    <HeartPulse className="w-5 h-5" />
                  </div>
                  <h4 className="font-extrabold text-base text-slate-900 dark:text-white mb-2">
                    Termómetro Emocional & Psicosocial
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                    Pulsos anónimos periódicos de estado de ánimo y estrés laboral. El sistema analiza tendencias por área, alerta sobre riesgos de burnout y vincula planes de acción a la Batería de Riesgo Psicosocial.
                  </p>
                  <div className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                    Ciclo de 7 días • Reportes gerenciales automáticos
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xs">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-white flex items-center justify-center font-bold mb-4">
                    <Clock className="w-5 h-5" />
                  </div>
                  <h4 className="font-extrabold text-base text-slate-900 dark:text-white mb-2">
                    Centro de Control ACPM
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                    Tablero centralizado de Acciones Correctivas, Preventivas y de Mejora con semáforo de vencimientos, responsables asignados y notificaciones automáticas vía WhatsApp y correo.
                  </p>
                  <div className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                    Evidencias fotográficas • Cierre de ciclo PHVA
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* SECTION: BENTO GRID DE HERRAMIENTAS REALES DE WAPPY */}
        <section id="herramientas" className="py-24 bg-white dark:bg-[#090A0F] px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="text-xs uppercase tracking-widest font-extrabold text-slate-500 dark:text-zinc-400 mb-2 block">
                Tecnología & Capacidad Real
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">
                Herramientas Construidas para Resolver el Día a Día
              </h2>
              <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
                Cada módulo de WAPPY está probado y optimizado para los requerimientos legales vigentes en Colombia.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
              {/* Tool 1: Canva + Google Sheets */}
              <div className="p-7 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm hover:border-slate-400 dark:hover:border-zinc-600 transition-all flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-white flex items-center justify-center font-bold mb-4">
                    <Code2 className="w-5 h-5" />
                  </div>
                  <h3 className="font-extrabold text-lg text-slate-900 dark:text-white mb-2">
                    Apps en Canva + Google Sheets
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                    WAPPY no solo redacta textos. Es capaz de <strong>programar y desplegar aplicaciones interactivas en vivo</strong> dentro del chat, usando Google Sheets como base de datos en tiempo real.
                  </p>
                </div>
                <div className="pt-4 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between text-[11px] font-bold text-slate-500">
                  <span>HTML5 / JS / Tailwind en vivo</span>
                  <span>Sin servidor extra</span>
                </div>
              </div>

              {/* Tool 2: Matriz Bio-IPEVAR */}
              <div className="p-7 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm hover:border-slate-400 dark:hover:border-zinc-600 transition-all flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-white flex items-center justify-center font-bold mb-4">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <h3 className="font-extrabold text-lg text-slate-900 dark:text-white mb-2">
                    Matriz Bio-IPEVAR GTC-45
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                    Identificación de peligros, valoración de riesgos y determinación de controles conforme a la <strong>Guía Técnica Colombiana GTC-45</strong>. Recálculo automático ante condiciones osteomusculares individuales.
                  </p>
                </div>
                <div className="pt-4 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between text-[11px] font-bold text-slate-500">
                  <span>Exportación a Excel / PDF</span>
                  <span>Alineado a Res. 0312</span>
                </div>
              </div>

              {/* Tool 3: Autoevaluación EPT */}
              <div className="p-7 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm hover:border-slate-400 dark:hover:border-zinc-600 transition-all flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-white flex items-center justify-center font-bold mb-4">
                    <Activity className="w-5 h-5" />
                  </div>
                  <h3 className="font-extrabold text-lg text-slate-900 dark:text-white mb-2">
                    Autoevaluación EPT con IA
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                    El colaborador responde una serie de preguntas guiadas e ilustradas desde su móvil. El <strong>Fisioterapeuta IA</strong> calcula el nivel de riesgo postural y sugiere adecuaciones inmediatas.
                  </p>
                </div>
                <div className="pt-4 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between text-[11px] font-bold text-slate-500">
                  <span>Ergonomía participativa</span>
                  <span>Informe técnico automático</span>
                </div>
              </div>

              {/* Tool 4: PESV & SGA */}
              <div className="p-7 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm hover:border-slate-400 dark:hover:border-zinc-600 transition-all flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-white flex items-center justify-center font-bold mb-4">
                    <Scale className="w-5 h-5" />
                  </div>
                  <h3 className="font-extrabold text-lg text-slate-900 dark:text-white mb-2">
                    PESV & SGA Especializados
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                    Módulos específicos para el <strong>Plan Estratégico de Seguridad Vial (Res. 40595 de 2022)</strong> y la matriz de compatibilidad de sustancias químicas bajo el <strong>SGA (Dec. 1496 de 2018)</strong>.
                  </p>
                </div>
                <div className="pt-4 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between text-[11px] font-bold text-slate-500">
                  <span>Matrices de segregación</span>
                  <span>Evaluación de flota y conductores</span>
                </div>
              </div>

              {/* Tool 5: Automatizaciones Autónomas */}
              <div className="p-7 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm hover:border-slate-400 dark:hover:border-zinc-600 transition-all flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-white flex items-center justify-center font-bold mb-4">
                    <Zap className="w-5 h-5" />
                  </div>
                  <h3 className="font-extrabold text-lg text-slate-900 dark:text-white mb-2">
                    Automatizaciones 24/7
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                    Programa a tus agentes para que trabajen mientras duermes: cierres mensuales de incidentes, recordatorios de capacitaciones, auditorías de tareas vencidas y resúmenes ejecutivos.
                  </p>
                </div>
                <div className="pt-4 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between text-[11px] font-bold text-slate-500">
                  <span>Disparadores cron</span>
                  <span>Alertas automáticas vía WhatsApp</span>
                </div>
              </div>

              {/* Tool 6: Portales Públicos QR */}
              <div className="p-7 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm hover:border-slate-400 dark:hover:border-zinc-600 transition-all flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-white flex items-center justify-center font-bold mb-4">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <h3 className="font-extrabold text-lg text-slate-900 dark:text-white mb-2">
                    Portales Públicos QR
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                    Genera códigos QR para colocar en planta o vehículos. Los trabajadores reportan condiciones inseguras o incidentes desde su celular <strong>sin necesidad de crear usuario ni contraseña</strong>.
                  </p>
                </div>
                <div className="pt-4 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between text-[11px] font-bold text-slate-500">
                  <span>Acceso directo sin fricción</span>
                  <span>Sincronización instantánea</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION: ECOSISTEMA DE +15 AGENTES IA */}
        <section id="agentes" className="py-24 bg-slate-50 dark:bg-zinc-900/40 border-t border-slate-200 dark:border-zinc-800 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-14">
              <span className="text-xs uppercase tracking-widest font-extrabold text-slate-500 dark:text-zinc-400 mb-2 block">
                Tu Equipo Especializado
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">
                Más de 15 Agentes de IA Especializados a tu Servicio
              </h2>
              <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
                Cada agente fue entrenado con la jurisprudencia, normas técnicas y guías prácticas de Colombia. No son chatbots generales: son especialistas con criterio técnico.
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center justify-center gap-2 mb-12">
              {[
                { id: 'todos', label: 'Todos los Agentes' },
                { id: 'orquestador', label: 'Orquestador Nativo' },
                { id: 'prevencion', label: 'Prevención & Riesgos' },
                { id: 'salud', label: 'Salud & Ergonomía' },
                { id: 'legal', label: 'Legal & Auditoría' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveAgentCategory(cat.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeAgentCategory === cat.id
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                      : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-zinc-800 hover:border-slate-400'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Spotlight Tenshi */}
            <div className="p-8 rounded-3xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 mb-10 shadow-xl">
              <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
                <div className="flex items-center gap-5 text-left">
                  <div className="w-16 h-16 rounded-2xl bg-teal-500 text-white flex items-center justify-center font-black text-2xl shadow-lg shrink-0">
                    T
                  </div>
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-teal-500/20 text-teal-400 dark:text-teal-700 mb-2">
                      Motor Estrella de WAPPY
                    </div>
                    <h3 className="text-2xl font-black">Tenshi IA • Orquestador General</h3>
                    <p className="text-xs sm:text-sm opacity-80 max-w-2xl mt-1">
                      Tenshi conecta todos tus expedientes, lee bases de datos en tiempo real, genera reportes gerenciales y delega tareas a los agentes especialistas automáticamente.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/login')}
                  className="shrink-0 px-6 py-3 rounded-xl font-bold text-xs bg-teal-500 hover:bg-teal-600 text-white shadow-md transition-all active:scale-95"
                >
                  Hablar con Tenshi
                </button>
              </div>
            </div>

            {/* Grid of Other Agents */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
              {filteredAgents
                .filter((a) => a.id !== 'tenshi')
                .map((agent) => (
                  <div
                    key={agent.id}
                    className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xs hover:border-slate-400 dark:hover:border-zinc-600 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                          {agent.categoryLabel}
                        </span>
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-slate-300">
                          {agent.badge}
                        </span>
                      </div>
                      <h4 className="font-extrabold text-base text-slate-900 dark:text-white mb-2">
                        {agent.name}
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                        {agent.desc}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800 text-[11px] text-slate-500 dark:text-slate-400 italic">
                      {agent.prompt}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </section>

        {/* SECTION: ACADEMIA WAPPY (LMS & STREAMING) */}
        <section id="academia" className="py-24 bg-white dark:bg-[#090A0F] px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="text-xs uppercase tracking-widest font-extrabold text-slate-500 dark:text-zinc-400 mb-2 block">
                Capacitación Continua
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">
                Academia WAPPY: Formación, Streaming y Certificación
              </h2>
              <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
                Cumple con el estándar de capacitación anual del SG-SST sin contratar plataformas externas. Un LMS completo integrado en el mismo lugar.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left mb-12">
              <div className="p-7 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-white flex items-center justify-center font-bold mb-4">
                  <Video className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white mb-2">
                  Aula de Estudio en Vivo
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Transmisión de clases en streaming con chat interactivo en vivo, toma de asistencia automática y registro directo en el expediente del trabajador.
                </p>
              </div>

              <div className="p-7 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-white flex items-center justify-center font-bold mb-4">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white mb-2">
                  Rutas de Aprendizaje
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Crea cursos a medida por cargo o empresa: inducción general, manipulación de cargas, primeros auxilios, brigadas y manejo defensivo PESV.
                </p>
              </div>

              <div className="p-7 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-white flex items-center justify-center font-bold mb-4">
                  <FileBadge className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white mb-2">
                  Certificados con Verificación QR
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Al completar los cuestionarios interactivos, el sistema expide automáticamente certificados digitales con código QR único antifraude para auditorías.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION: PLANES & PRECIOS */}
        <section id="planes" className="py-24 bg-slate-50 dark:bg-zinc-900/40 border-t border-slate-200 dark:border-zinc-800 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="text-xs uppercase tracking-widest font-extrabold text-slate-500 dark:text-zinc-400 mb-2 block">
                Precios Transparentes
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">
                Elige el Plan que Escala tu Consultoría
              </h2>
              <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
                Sin sorpresas. Acceso completo a los modelos de inteligencia artificial y herramientas especializadas.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
              {/* Plan Vital */}
              <div className="p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-md hover:border-slate-400 dark:hover:border-zinc-600 transition-all flex flex-col justify-between">
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500 block mb-2">
                    Para Consultores Independientes
                  </span>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
                    WAPPY Vital
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
                    Ideal para comenzar a automatizar tus matrices y asesorar tus primeras empresas.
                  </p>
                  <div className="flex items-baseline gap-2 mb-6">
                    <span className="text-4xl font-black text-slate-900 dark:text-white">$350.000</span>
                    <span className="text-xs text-slate-500">COP / Pago Único</span>
                  </div>

                  <ul className="space-y-3 text-xs text-slate-700 dark:text-slate-300 mb-8">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span>Acceso vitalicio al ecosistema WAPPY</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span>Estructuración de Matrices GTC-45 y PESV</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span>Agentes especializados SST y Legal Laboral</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span>Actualizaciones normativas incluidas</span>
                    </li>
                  </ul>
                </div>

                <button
                  onClick={() => navigate('/login')}
                  className="w-full py-3.5 rounded-xl font-bold text-xs bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 transition-all active:scale-95"
                >
                  Adquirir WAPPY Vital
                </button>
              </div>

              {/* Plan Pro */}
              <div className="p-8 rounded-3xl bg-slate-900 text-white dark:bg-zinc-800 border border-slate-700 dark:border-zinc-700 shadow-xl flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-5 right-5">
                  <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-teal-500 text-white">
                    Más Popular
                  </span>
                </div>
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-slate-400 block mb-2">
                    Para Firmas de Consultoría & Empresas
                  </span>
                  <h3 className="text-2xl font-black mb-2">
                    WAPPY Pro Anual
                  </h3>
                  <p className="text-xs text-slate-400 mb-6">
                    Potencia total, automatizaciones 24/7 y aplicaciones ilimitadas en Canva.
                  </p>
                  <div className="flex items-baseline gap-2 mb-6">
                    <span className="text-4xl font-black">$1.200.000</span>
                    <span className="text-xs text-slate-400">COP / Año</span>
                  </div>

                  <ul className="space-y-3 text-xs text-slate-200 mb-8">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-teal-400" />
                      <span>Todo lo del Plan Vital</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-teal-400" />
                      <span>Apps interactivas en Canva + Google Sheets ilimitadas</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-teal-400" />
                      <span>Automatizaciones 24/7 con disparadores autónomos</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-teal-400" />
                      <span>Academia LMS con emisión de certificados QR</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-teal-400" />
                      <span>Soporte prioritario y sesiones 1 a 1 con Felix Bedoya</span>
                    </li>
                  </ul>
                </div>

                <button
                  onClick={() => navigate('/login')}
                  className="w-full py-3.5 rounded-xl font-bold text-xs bg-teal-500 hover:bg-teal-600 text-white shadow-lg transition-all active:scale-95"
                >
                  Suscribirme a WAPPY Pro
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION: EL CREADOR (Felix Bedoya) */}
        <section id="creador" className="py-24 bg-white dark:bg-[#090A0F] px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="p-8 sm:p-12 rounded-3xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 text-left flex flex-col md:flex-row items-center gap-8">
              <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-3xl shadow-lg shrink-0">
                FB
              </div>
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500 block mb-1">
                  Fundador & Especialista SST
                </span>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3">
                  Felix Bedoya • Creador de Somos SST & WAPPY
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                  «Creamos WAPPY porque nos cansamos de ver a colegas brillantes atrapados en la trampa del papeleo. La Seguridad y Salud en el Trabajo debe salvar vidas y cuidar la productividad, no limitarse a cumplir requisitos cosméticos. WAPPY es la herramienta que te devuelve el tiempo para hacer verdadera prevención.»
                </p>
                <div className="flex flex-wrap items-center gap-4">
                  <a
                    href="https://wa.me/573105001234?text=Hola%20Felix,%20quiero%20conocer%20m%C3%A1s%20sobre%20WAPPY%20y%20la%20metodolog%C3%ADa%20Somos%20SST"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Contactar por WhatsApp</span>
                  </a>
                  <button
                    onClick={() => setVideoModalOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs border border-slate-300 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-slate-300 transition-all"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Ver Masterclass</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FINAL CTA BANNER */}
        <section className="py-20 bg-slate-900 text-white dark:bg-zinc-900 border-t border-slate-800 px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-4">
              Construye tu SG-SST Inteligente Hoy
            </h2>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed mb-8">
              Únete a los consultores y empresas líderes en Colombia que ya transformaron sus horas de papeleo en prevención real con WAPPY.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => navigate('/login')}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm bg-white text-slate-900 hover:bg-slate-100 shadow-md transition-all active:scale-95"
              >
                Comenzar Ahora
              </button>
              <button
                onClick={() => navigate('/login')}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-semibold text-sm border border-slate-700 hover:border-slate-500 text-slate-200 transition-all active:scale-95"
              >
                Ya tengo cuenta • Ingresar
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER (Clean Figma Style) */}
      <footer className="py-12 bg-white dark:bg-[#090A0F] border-t border-slate-200 dark:border-zinc-800 text-xs text-slate-500 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center font-bold text-[10px]">
              W
            </div>
            <span className="font-bold text-slate-900 dark:text-white">WAPPY IA</span>
            <span>• Ecosistema de Seguridad y Salud en el Trabajo</span>
          </div>

          <div className="flex items-center gap-6">
            <a href="#metodologia" className="hover:text-slate-900 dark:hover:text-white">Metodología</a>
            <a href="#herramientas" className="hover:text-slate-900 dark:hover:text-white">Herramientas</a>
            <a href="#planes" className="hover:text-slate-900 dark:hover:text-white">Precios</a>
            <button onClick={() => navigate('/privacy')} className="hover:text-slate-900 dark:hover:text-white">
              Privacidad
            </button>
            <button onClick={() => navigate('/terms')} className="hover:text-slate-900 dark:hover:text-white">
              Términos
            </button>
          </div>
        </div>
      </footer>

      {/* VIDEO DEMO MODAL */}
      {videoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-4xl bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800 overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-zinc-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Demostración de WAPPY & Metodología Somos SST
              </h3>
              <button
                onClick={() => setVideoModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="aspect-video w-full bg-black">
              <iframe
                className="w-full h-full"
                src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1"
                title="WAPPY Demo"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
