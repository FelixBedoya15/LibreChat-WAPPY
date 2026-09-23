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
  Play
} from 'lucide-react';
import { useAuthContext } from '~/hooks';

export default function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthContext();

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

  // Somos SST Track Selector: 'bio' (Trabajador) vs 'org' (Empresa)
  const [activeTrack, setActiveTrack] = useState<'bio' | 'org'>('bio');

  // Agent category filter
  const [activeAgentCategory, setActiveAgentCategory] = useState<string>('todos');

  // Interactive Live Simulation Step
  const [simStep, setSimStep] = useState<number>(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setSimStep((prev) => (prev + 1) % 4);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Agent data list
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
      name: 'Abogado Laboral SST',
      category: 'legal',
      categoryLabel: 'Legal & Normativo',
      avatar: '/images/abogado_laboral.png',
      badge: 'Blindaje Jurídico',
      desc: 'Asesoría en litigios laborales, descargos, redacción de RIT con jornada de 42 horas y respuesta a requerimientos del MinTrabajo.',
      prompt: '"Revisa la cláusula de desconexión laboral y las obligaciones del RIT bajo Ley 2191..."',
    },
    {
      id: 'riesgo_vial',
      name: 'Coordinador PESV',
      category: 'prevencion',
      categoryLabel: 'Seguridad Vial',
      avatar: '/images/riesgo_vial.png',
      badge: 'Res. 20223040040595',
      desc: 'Diagnóstico de flota vehicular, análisis de rutas críticas, matriz de riesgos viales y planes de acción PESV.',
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
      desc: 'Evaluación de posturas forzadas, manipulación manual de cargas, pausas activas personalizadas y rediseño de puestos.',
      prompt: '"Evalúa una postura con flexión de tronco a 45° y carga de 15 kg bajo el método OWAS..."',
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
    <div className="min-h-screen bg-slate-950 text-slate-100 dark:bg-slate-950 dark:text-slate-100 selection:bg-teal-500 selection:text-white font-sans antialiased overflow-x-hidden">
      {/* Dynamic Ambient Background Lights */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-b from-teal-500/15 via-emerald-500/10 to-transparent blur-[120px] rounded-full" />
        <div className="absolute top-[40%] -right-40 w-[500px] h-[500px] bg-cyan-500/10 blur-[130px] rounded-full" />
        <div className="absolute top-[75%] -left-40 w-[600px] h-[600px] bg-emerald-600/10 blur-[140px] rounded-full" />
      </div>

      {/* STICKY NAVBAR */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-slate-950/80 border-b border-slate-800/80 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Brand Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 bg-teal-500/30 blur-md rounded-xl" />
              <img
                src="/assets/logo.png"
                alt="WAPPY IA"
                className="h-10 sm:h-12 w-auto relative z-10 object-contain drop-shadow-sm"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg sm:text-xl tracking-tight bg-gradient-to-r from-teal-400 via-emerald-300 to-cyan-300 bg-clip-text text-transparent">
                WAPPY IA
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
                Ecosistema SST Colombia
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7 text-xs font-semibold text-slate-300">
            <a href="#somossst" className="hover:text-teal-400 transition-colors">
              Metodología Somos SST
            </a>
            <a href="#herramientas" className="hover:text-teal-400 transition-colors">
              Herramientas
            </a>
            <a href="#agentes" className="hover:text-teal-400 transition-colors">
              Agentes IA
            </a>
            <a href="#formacion" className="hover:text-teal-400 transition-colors">
              Academia LMS
            </a>
            <a href="#planes" className="hover:text-teal-400 transition-colors">
              Planes & Precios
            </a>
            <a href="#creador" className="hover:text-teal-400 transition-colors">
              El Creador
            </a>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="w-9 h-9 rounded-xl border border-slate-700/80 bg-slate-900/90 text-slate-300 hover:text-teal-400 hover:border-teal-500/50 flex items-center justify-center transition-all shadow-sm active:scale-95"
              title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-cyan-400" />}
            </button>

            {isAuthenticated ? (
              <button
                onClick={() => navigate('/c/new')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white shadow-md shadow-teal-700/30 transition-all active:scale-95"
              >
                <span>Ir al Chat</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate('/login')}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold text-xs text-slate-200 hover:text-white bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-600 transition-all shadow-sm active:scale-95"
                >
                  <UserCheck className="w-3.5 h-3.5 text-teal-400" />
                  <span>Ingresar</span>
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white shadow-md shadow-teal-700/30 transition-all active:scale-95"
                >
                  <Sparkles className="w-3.5 h-3.5 text-teal-200" />
                  <span>Registrarse</span>
                </button>
              </>
            )}

            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden w-9 h-9 rounded-xl border border-slate-800 bg-slate-900 text-slate-300 flex items-center justify-center transition-all"
              aria-label="Toggle Mobile Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-b border-slate-800 bg-slate-950/95 backdrop-blur-2xl px-4 py-5 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <a
              href="#somossst"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-semibold text-slate-300 hover:text-teal-400 py-1.5"
            >
              Metodología Somos SST
            </a>
            <a
              href="#herramientas"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-semibold text-slate-300 hover:text-teal-400 py-1.5"
            >
              Herramientas
            </a>
            <a
              href="#agentes"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-semibold text-slate-300 hover:text-teal-400 py-1.5"
            >
              Agentes IA
            </a>
            <a
              href="#formacion"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-semibold text-slate-300 hover:text-teal-400 py-1.5"
            >
              Academia LMS
            </a>
            <a
              href="#planes"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-semibold text-slate-300 hover:text-teal-400 py-1.5"
            >
              Planes & Precios
            </a>
            <a
              href="#creador"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-semibold text-slate-300 hover:text-teal-400 py-1.5"
            >
              El Creador
            </a>

            <div className="pt-3 border-t border-slate-800/80 flex flex-col gap-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate('/login');
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs bg-slate-900 border border-slate-700 text-slate-200"
              >
                Ingresar a la Plataforma
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate('/register');
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-teal-600 to-teal-700 text-white"
              >
                Registrarse Gratis
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="relative z-10">
        {/* HERO SECTION */}
        <section className="relative pt-12 pb-20 md:pt-20 md:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-teal-500/30 bg-teal-500/10 text-teal-300 text-xs font-semibold mb-6 shadow-sm shadow-teal-900/20 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
              <span>El 1er Copiloto de Inteligencia Artificial para SG-SST en Colombia</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.12] mb-6">
              Automatiza tu Gestión de{' '}
              <span className="bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                Seguridad y Salud
              </span>
              . Menos Papeleo, Más Prevención.
            </h1>

            {/* Subhead */}
            <p className="text-base sm:text-lg md:text-xl text-slate-300 max-w-2xl mx-auto mb-9 font-normal leading-relaxed">
              El ecosistema inteligente especializado en la normatividad colombiana (Decreto 1072, Res. 0312 y PESV 40595).
              Estructura matrices GTC-45 en minutos, audita posturas por visión artificial, delega alertas a automatizaciones
              autónomas y certifica a tu personal con un LMS integrado.
            </p>

            {/* CTA Button Group */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto mb-10">
              <button
                onClick={() => navigate('/login')}
                className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white shadow-xl shadow-teal-800/30 transition-all hover:scale-[1.02] active:scale-95"
              >
                <span>Ingresar al Ecosistema</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <a
                href="#somossst"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 hover:border-slate-600 transition-all active:scale-95"
              >
                <Compass className="w-4 h-4 text-teal-400" />
                <span>Explorar Metodología</span>
              </a>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-[11px] text-slate-400 font-medium">
              <span className="px-3 py-1 rounded-lg bg-slate-900/60 border border-slate-800/80 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                Estándares Res. 0312 / Dec. 1072
              </span>
              <span className="px-3 py-1 rounded-lg bg-slate-900/60 border border-slate-800/80 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                PESV Res. 20223040040595
              </span>
              <span className="px-3 py-1 rounded-lg bg-slate-900/60 border border-slate-800/80 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                Químicos SGA Dec. 1496/2018
              </span>
              <span className="px-3 py-1 rounded-lg bg-slate-900/60 border border-slate-800/80 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                +15 Agentes de IA Especializados
              </span>
            </div>
          </div>

          {/* PRODUCT-AS-DEMO SIMULATION COMPONENT */}
          <div className="mt-14 max-w-5xl mx-auto rounded-2xl border border-slate-800/90 bg-slate-900/70 backdrop-blur-xl shadow-2xl shadow-teal-950/40 overflow-hidden">
            {/* Window Topbar */}
            <div className="px-4 py-3 bg-slate-950/80 border-b border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                <span className="ml-2 text-xs font-semibold text-slate-400">
                  WAPPY Copilot • Tenshi IA v3.5 & Somos SST
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-teal-400 font-mono font-medium">
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping inline-block" />
                <span>Base de Datos Conectada</span>
              </div>
            </div>

            {/* Interactive Inner Demo Grid */}
            <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* Left Column: Tenshi Conversational Feed */}
              <div className="lg:col-span-5 flex flex-col gap-3">
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/90">
                  <div className="flex items-center gap-2.5 mb-2">
                    <img
                      src="/assets/tenshi.png"
                      alt="Tenshi IA"
                      className="w-7 h-7 rounded-full border border-teal-500 object-cover"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-white">Tenshi IA</h4>
                      <p className="text-[10px] text-teal-400">Orquestador de Somos SST</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {simStep === 0 && '¡Hola! Acabo de sincronizar los 142 colaboradores en el censo sociodemográfico. Procedo a cruzar peligros con la Matriz Bio-IPEVAR.'}
                    {simStep === 1 && 'He evaluado 18 peligros bajo GTC-45. 2 riesgos mecánicos y biomecánicos se marcaron en prioridad Alta con plan de mejora.'}
                    {simStep === 2 && 'Alerta temprana: 3 actividades del Centro de Control ACPM vencen esta semana. Enviando resumen automático a WhatsApp de gerencia...'}
                    {simStep === 3 && 'Ruta de aprendizaje actualizada: 94% de colaboradores completaron el módulo de autocuidado y descargaron certificado oficial con QR.'}
                  </p>
                </div>

                {/* Micro Action Pills */}
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <div>
                      <div className="font-bold text-white">Fit Score H1</div>
                      <div className="text-[10px] text-emerald-400 font-semibold">91.4% Óptimo</div>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                    <div>
                      <div className="font-bold text-white">Res. 0312</div>
                      <div className="text-[10px] text-cyan-400 font-semibold">100% Estándares</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Live Data Table Simulation */}
              <div className="lg:col-span-7 bg-slate-950/90 rounded-xl border border-slate-800/90 p-4 overflow-hidden">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-teal-400" />
                    <span className="text-xs font-bold text-slate-200">
                      Matriz Bio-IPEVAR (GTC-45 en Vivo)
                    </span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-teal-500/10 text-teal-300 font-mono">
                    Auto-sincronizada
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="p-2 rounded bg-slate-900/80 border border-slate-800/80 flex items-center justify-between">
                    <div>
                      <span className="text-slate-400 text-[10px] block">Área Operativa • Taller 1</span>
                      <strong className="text-white">Movimiento repetitivo en ensamblaje</strong>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Riesgo Medio (III)
                    </span>
                  </div>

                  <div className="p-2 rounded bg-slate-900/80 border border-slate-800/80 flex items-center justify-between">
                    <div>
                      <span className="text-slate-400 text-[10px] block">Logística • Bodega Central</span>
                      <strong className="text-white">Trabajo en alturas en estanterías &gt; 2.5m</strong>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/30">
                      Riesgo Alto (I)
                    </span>
                  </div>

                  <div className="p-2 rounded bg-slate-900/80 border border-slate-800/80 flex items-center justify-between">
                    <div>
                      <span className="text-slate-400 text-[10px] block">Transporte • Ruta Medellín-Bogotá</span>
                      <strong className="text-white">Factor PESV Vial: Jornada prolongada</strong>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                      Controlado (IV)
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Exportación directa a Excel / PDF</span>
                  <span className="text-teal-400 font-semibold cursor-pointer hover:underline flex items-center gap-1">
                    Ver matriz completa <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* EL DOLOR OCULTO DEL PREVENCIONISTA */}
        <section className="py-20 bg-slate-900/40 border-y border-slate-800/60 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-14">
              <span className="text-xs uppercase tracking-widest font-extrabold text-teal-400 mb-2 block">
                El Panorama de la SST en Colombia
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
                El Dolor Oculto del <span className="bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">Prevencionista</span>
              </h2>
              <p className="text-slate-300 text-sm sm:text-base">
                Más del 80% de la jornada laboral de los consultores y líderes de SST se esfuma redactando y actualizando
                archivos repetitivos en Word y Excel, en lugar de estar en campo salvando vidas.
              </p>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              <div className="p-7 rounded-2xl bg-slate-950/70 border border-slate-800/80 hover:border-teal-500/40 transition-all duration-300 shadow-lg">
                <div className="text-4xl sm:text-5xl font-extrabold text-teal-400 mb-2">10h+</div>
                <h3 className="text-base font-bold text-white mb-2">Matriz de Riesgos Manual</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Tiempo promedio que un especialista invierte en estructurar, investigar y valorar una sola matriz GTC 45 para una mediana empresa.
                </p>
              </div>

              <div className="p-7 rounded-2xl bg-slate-950/70 border border-slate-800/80 hover:border-cyan-500/40 transition-all duration-300 shadow-lg">
                <div className="text-4xl sm:text-5xl font-extrabold text-cyan-400 mb-2">80%</div>
                <h3 className="text-base font-bold text-white mb-2">Carga Administrativa</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  De las horas laborales consumidas en redactar reglamentos de trabajo, actas, formatos y preparar carpetas para ARLs o auditorías.
                </p>
              </div>

              <div className="p-7 rounded-2xl bg-slate-950/70 border border-slate-800/80 hover:border-emerald-500/40 transition-all duration-300 shadow-lg">
                <div className="text-4xl sm:text-5xl font-extrabold text-emerald-400 mb-2">0%</div>
                <h3 className="text-base font-bold text-white mb-2">Prevención Activa Real</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  La frustrante realidad cuando el prevencionista pasa el día atrapado entre carpetas archivadas y no puede inspeccionar el campo de trabajo.
                </p>
              </div>
            </div>

            {/* Motivational Banner */}
            <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-teal-950/40 via-slate-900 to-cyan-950/30 border border-teal-500/30 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
              <div className="w-12 h-12 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center flex-shrink-0">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white mb-1">
                  La Inteligencia Artificial no te va a reemplazar. El prevencionista que use WAPPY IA, sí.
                </h4>
                <p className="text-xs text-slate-300">
                  El mercado laboral y las empresas recompensan la agilidad. WAPPY te entrega las herramientas para realizar el trabajo de toda una semana en apenas unas horas.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* METODOLOGÍA SOMOS SST */}
        <section id="somossst" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs uppercase tracking-widest font-extrabold text-teal-400 mb-2 block">
              Metodología Exclusiva
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
              Somos SST y su <span className="bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">Estructura Integral</span>
            </h2>
            <p className="text-slate-300 text-sm sm:text-base">
              A diferencia del enfoque tradicional que trata al personal como estadísticas homogéneas, Somos SST divide la gestión en dos pistas articuladas: el trabajador individual y la gobernanza empresarial.
            </p>
          </div>

          {/* Track Switcher Buttons */}
          <div className="flex items-center justify-center gap-3 mb-10">
            <button
              onClick={() => setActiveTrack('bio')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                activeTrack === 'bio'
                  ? 'bg-teal-500/20 border-teal-500 text-teal-300 border shadow-md'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 border'
              }`}
            >
              <Brain className="w-4 h-4 text-teal-400" />
              <span>🧬 Pista 1: Motor Bio-Individual (Trabajador)</span>
            </button>

            <button
              onClick={() => setActiveTrack('org')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                activeTrack === 'org'
                  ? 'bg-teal-500/20 border-teal-500 text-teal-300 border shadow-md'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 border'
              }`}
            >
              <Building2 className="w-4 h-4 text-cyan-400" />
              <span>🏢 Pista 2: Salud Organizacional (Empresa)</span>
            </button>
          </div>

          {/* TRACK 1: MOTOR BIO-INDIVIDUAL (5 HITOS) */}
          {activeTrack === 'bio' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
              {/* Hito 1 */}
              <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-teal-500/40 transition-all flex flex-col justify-between">
                <div>
                  <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-300 font-extrabold text-xs flex items-center justify-center mb-3">
                    01
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">Hito 1: Huella Biocéntrica</h3>
                  <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                    Identifica y consolida las exigencias y aptitudes fisiológicas, biomecánicas y clínicas específicas de cada colaborador.
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5 text-[10px]">
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">Perfiles de Cargo</span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">Censo Sociodemográfico</span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">Condiciones de Salud</span>
                  <span className="px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 font-semibold border border-teal-500/30">
                    Fit Score H1
                  </span>
                </div>
              </div>

              {/* Hito 2 */}
              <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-teal-500/40 transition-all flex flex-col justify-between">
                <div>
                  <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-300 font-extrabold text-xs flex items-center justify-center mb-3">
                    02
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">Hito 2: Núcleo Bio-Evaluativo</h3>
                  <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                    Evalúa el estado anímico y estrés psicosocial semanal en tiempo real, junto con la interacción directa de los peligros en el puesto.
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5 text-[10px]">
                  <span className="px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 font-semibold border border-teal-500/30">
                    Termómetro Psicosocial (7 días)
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">Matriz Bio-IPEVAR</span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">GTC-45 en Vivo</span>
                </div>
              </div>

              {/* Hito 3 */}
              <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-teal-500/40 transition-all flex flex-col justify-between">
                <div>
                  <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-300 font-extrabold text-xs flex items-center justify-center mb-3">
                    03
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">Hito 3: Dinámica de Exposición</h3>
                  <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                    Operación diaria de prevención en campo: reporte de actos inseguros con gamificación, permisos de alturas y análisis de posturas.
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5 text-[10px]">
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">Reporte Móvil de Actos</span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">Permisos Alturas Digitales</span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">ATS</span>
                  <span className="px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 font-semibold border border-teal-500/30">
                    Método OWAS / ROSA
                  </span>
                </div>
              </div>

              {/* Hito 4 */}
              <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-teal-500/40 transition-all flex flex-col justify-between">
                <div>
                  <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-300 font-extrabold text-xs flex items-center justify-center mb-3">
                    04
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">Hito 4: Traumatismo y Curación</h3>
                  <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                    Investigación forense de causa raíz e indicadores estadísticos automáticos para corregir fallas después del daño.
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5 text-[10px]">
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">Investigación FURAT / FUREL</span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">Árbol de Causas</span>
                  <span className="px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 font-semibold border border-teal-500/30">
                    Estadísticas ATEL (TA, IF, IS, ILI)
                  </span>
                </div>
              </div>

              {/* Hito 5 */}
              <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-teal-500/40 transition-all flex flex-col justify-between md:col-span-2 lg:col-span-2">
                <div>
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-300 font-extrabold text-xs flex items-center justify-center mb-3">
                    05
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">Hito 5: Centro de Inteligencia Predictiva</h3>
                  <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                    Cruce inteligente con IA que correlaciona las esferas de vida del colaborador para adelantarse a los accidentes antes de que ocurran. Mapeo anatómico 3D treemap y proyección de incapacidades.
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5 text-[10px]">
                  <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30">
                    Análisis Anatómico 3D
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">Comparativa de Plantas</span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">Modelos Predictivos</span>
                </div>
              </div>
            </div>
          )}

          {/* TRACK 2: SALUD ORGANIZACIONAL (EMPRESA) */}
          {activeTrack === 'org' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
              {/* Fase 1 */}
              <div className="p-7 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-teal-500/40 transition-all">
                <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-300 font-extrabold text-xs flex items-center justify-center mb-3">
                  01
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Cimiento del Cuidado</h3>
                <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                  Estructuración legal y diagnósticos iniciales. Monitoreo continuo de vencimientos y asignación de responsabilidades corporativas.
                </p>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <span className="p-2 rounded bg-slate-800/80 text-slate-300">✓ Diagnóstico Res. 0312</span>
                  <span className="p-2 rounded bg-teal-500/10 text-teal-300 font-semibold">⚡ Centro ACPM con Alertas</span>
                  <span className="p-2 rounded bg-slate-800/80 text-slate-300">✓ Matriz Legal en Vivo</span>
                  <span className="p-2 rounded bg-slate-800/80 text-slate-300">✓ Análisis de Vulnerabilidad</span>
                  <span className="p-2 rounded bg-slate-800/80 text-slate-300">✓ Reglamento RIT 42 Horas</span>
                  <span className="p-2 rounded bg-teal-500/10 text-teal-300 font-semibold">⚡ App Builder No-Code</span>
                </div>
              </div>

              {/* Fase 2 */}
              <div className="p-7 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-teal-500/40 transition-all">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-300 font-extrabold text-xs flex items-center justify-center mb-3">
                  02
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Liderazgo Consciente</h3>
                <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                  Evaluaciones periódicas del diseño del sistema, rendición de cuentas de la gerencia sobre la salud laboral y auditoría interna.
                </p>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <span className="p-2 rounded bg-slate-800/80 text-slate-300">✓ Informe de Gestión Anual</span>
                  <span className="p-2 rounded bg-cyan-500/10 text-cyan-300 font-semibold">⚡ Revisión Alta Dirección</span>
                  <span className="p-2 rounded bg-slate-800/80 text-slate-300">✓ Auditoría ISO 45001</span>
                  <span className="p-2 rounded bg-slate-800/80 text-slate-300">✓ Tablero de Indicadores</span>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* BENTO GRID: HERRAMIENTAS Y SUPERPODERES */}
        <section id="herramientas" className="py-24 bg-slate-900/50 border-t border-slate-800/80 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="text-xs uppercase tracking-widest font-extrabold text-teal-400 mb-2 block">
                Capacidades de Vanguardia
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
                Herramientas Avanzadas en <span className="bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">WAPPY IA</span>
              </h2>
              <p className="text-slate-300 text-sm sm:text-base">
                Nuestros agentes no se limitan a chatear; ejecutan herramientas especializadas en tiempo real que modifican datos, generan tablas interactivas y emiten alertas.
              </p>
            </div>

            {/* Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Tool 1: IPEVAR */}
              <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-teal-500/50 transition-all flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center mb-4">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">Matriz Bio-IPEVAR (GTC 45)</h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    Inyección de peligros y valoración de riesgos en tiempo real asistida por IA. Visualiza tablas interactivas al lado del chat y expórtalas a Excel listo para ARLs.
                  </p>
                </div>
                <span className="text-[11px] font-semibold text-teal-400 flex items-center gap-1">
                  Exportación Excel Nativa <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>

              {/* Tool 2: PESV */}
              <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-teal-500/50 transition-all flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-4">
                    <Shield className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">Matriz PESV Vial</h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    Estructurada bajo la Resolución 20223040040595 del Ministerio de Transporte. Clasifica flotas de vehículos, conductores y rutas críticas automáticamente.
                  </p>
                </div>
                <span className="text-[11px] font-semibold text-cyan-400 flex items-center gap-1">
                  Planes de Seguridad Vial <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>

              {/* Tool 3: Compatibilidad Química */}
              <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-teal-500/50 transition-all flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4">
                    <Flame className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">Matriz Química SGA</h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    Gestión de inventarios químicos bajo el Sistema Globalmente Armonizado (Dec. 1496/2018). Genera semáforos de almacenamiento seguro (Verde/Amarillo/Rojo).
                  </p>
                </div>
                <span className="text-[11px] font-semibold text-amber-400 flex items-center gap-1">
                  SGA & Pictogramas ONU <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>

              {/* Tool 4: Automatizaciones Autónomas */}
              <div className="p-6 rounded-2xl bg-slate-950/80 border border-teal-500/30 hover:border-teal-500/60 transition-all flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 px-3 py-1 bg-teal-500/20 text-teal-300 font-bold text-[9px] uppercase tracking-wider rounded-bl-xl border-l border-b border-teal-500/30">
                  ⚡ 24/7 Autónomo
                </div>
                <div>
                  <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center mb-4">
                    <Zap className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">Automatizaciones Autónomas</h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    Delega tareas repetitivas a tus agentes: reportes semanales a gerencia, alertas de vencimiento normativo a WhatsApp/correo y recordatorios sin tocar el teclado.
                  </p>
                </div>
                <span className="text-[11px] font-semibold text-teal-300 flex items-center gap-1">
                  Cron Jobs & Notificaciones <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>

              {/* Tool 5: Visión Computacional */}
              <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-cyan-500/50 transition-all flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-4">
                    <Camera className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">Cámara IA & Visión en Campo</h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    Abre la cámara de tu móvil en campo: evalúa posturas bajo método OWAS/ROSA, mide ángulos corporales y detecta uso de EPPs obligatorios (casco, chaleco, arnés).
                  </p>
                </div>
                <span className="text-[11px] font-semibold text-cyan-400 flex items-center gap-1">
                  Inspección Visual en Vivo <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>

              {/* Tool 6: Portales Públicos sin Login */}
              <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-emerald-500/50 transition-all flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
                    <Users className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">Portales Públicos Móviles (QR)</h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    Tus colaboradores reportan actos inseguros, responden el termómetro anónimo y actualizan su ficha sin registrarse: solo escaneando un código QR o ingresando su cédula.
                  </p>
                </div>
                <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                  Ferozmente Fácil para Empleados <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* MERCADO DE +15 AGENTES ESPECIALIZADOS */}
        <section id="agentes" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs uppercase tracking-widest font-extrabold text-teal-400 mb-2 block">
              Mercado de Expertos
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
              Más de 15 <span className="bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">Agentes Especializados</span>
            </h2>
            <p className="text-slate-300 text-sm sm:text-base">
              Cada área crítica de la SST cuenta con un agente pre-entrenado en la normatividad colombiana y metodologías de ingeniería de prevención.
            </p>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
            {[
              { id: 'todos', label: 'Todos los Agentes' },
              { id: 'legal', label: 'Abogados & Legal' },
              { id: 'salud', label: 'Salud & Ergonomía' },
              { id: 'prevencion', label: 'Técnicos & Operativos' },
              { id: 'auditoria', label: 'Auditoría & Calidad' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveAgentCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all ${
                  activeAgentCategory === cat.id
                    ? 'bg-teal-500 text-slate-950 shadow-md font-extrabold'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Tenshi IA Star Banner */}
          <div className="mb-10 p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-teal-950/40 via-slate-900/90 to-cyan-950/40 border border-teal-500/30 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-[11px] font-bold uppercase tracking-wider mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                <span>IA Estrella & Orquestador Nativo</span>
              </div>
              <h3 className="text-2xl font-extrabold text-white mb-2">Tenshi: Tu Asistente Virtual 24/7</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-4">
                Tenshi conecta y coordina todo el ecosistema WAPPY IA. Es la asistente nativa que navega por Somos SST, actualiza expedientes de trabajadores, vigila las alertas ACPM y conversa con tono cercano, profesional y proactivo.
              </p>
              <div className="flex flex-wrap gap-2 text-[11px]">
                <span className="px-2.5 py-1 rounded bg-teal-500/10 border border-teal-500/30 text-teal-300 font-semibold">
                  Automatización Integral
                </span>
                <span className="px-2.5 py-1 rounded bg-slate-800 text-slate-300">
                  Acceso en Vivo a Base de Datos
                </span>
                <span className="px-2.5 py-1 rounded bg-slate-800 text-slate-300">
                  Generación de Reportes PDF
                </span>
              </div>
            </div>

            <div className="flex-shrink-0 text-center">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-teal-500/30 blur-xl rounded-full" />
                <img
                  src="/assets/tenshi.png"
                  alt="Tenshi IA"
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-2 border-teal-400 object-cover relative z-10 shadow-lg"
                />
              </div>
              <h4 className="font-bold text-white text-sm mt-2">Tenshi IA</h4>
              <p className="text-[11px] text-teal-400">En línea en toda la plataforma</p>
            </div>
          </div>

          {/* Agents Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAgents
              .filter((a) => !a.isStar)
              .map((agent) => (
                <div
                  key={agent.id}
                  className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-teal-500/40 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <img
                        src={agent.avatar}
                        alt={agent.name}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-700 bg-slate-800"
                        onError={(e) => {
                          e.currentTarget.src = '/assets/avatars/Avatar1.png';
                        }}
                      />
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400">
                          {agent.categoryLabel}
                        </span>
                        <h4 className="text-sm font-bold text-white">{agent.name}</h4>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed mb-3">{agent.desc}</p>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80 text-[11px] text-slate-300 font-mono italic">
                    {agent.prompt}
                  </div>
                </div>
              ))}
          </div>
        </section>

        {/* ECOSISTEMA DE FORMACIÓN Y LMS */}
        <section id="formacion" className="py-24 bg-slate-900/40 border-t border-slate-800/80 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="text-xs uppercase tracking-widest font-extrabold text-teal-400 mb-2 block">
                Capacitación Continua
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
                Academia WAPPY: <span className="bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">LMS & Certificaciones</span>
              </h2>
              <p className="text-slate-300 text-sm sm:text-base">
                Cumple con el programa de capacitación anual obligatorio del SG-SST sin desgaste administrativo.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-teal-500/40 transition-all flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center mb-4">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">🎓 Aula de Estudio</h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    Plataforma tipo streaming con cursos y masterclasses en video para prevencionistas. Aprende a aplicar IA práctica en la gestión de riesgos laborales.
                  </p>
                </div>
                <span className="text-[11px] font-semibold text-teal-400">Acceso a Clases y Recursos</span>
              </div>

              <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-cyan-500/40 transition-all flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-4">
                    <Compass className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">🚀 Rutas de Aprendizaje por Empresa</h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    Genera rutas de formación automáticas para cada una de tus empresas registradas: lecciones guiadas, evaluaciones interactivas y trazabilidad de notas.
                  </p>
                </div>
                <span className="text-[11px] font-semibold text-cyan-400">Seguimiento de Asistencia</span>
              </div>

              <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-emerald-500/40 transition-all flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
                    <Award className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">📜 Certificados con Código QR</h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    Al aprobar cada evaluación, los trabajadores descargan de inmediato su certificado PDF oficial con código QR verificable ante inspectores y ARLs.
                  </p>
                </div>
                <span className="text-[11px] font-semibold text-emerald-400">Válido en Auditorías</span>
              </div>
            </div>
          </div>
        </section>

        {/* COMPARATIVA DE PLANES Y PRECIOS */}
        <section id="planes" className="py-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs uppercase tracking-widest font-extrabold text-teal-400 mb-2 block">
              Inversión Transparente
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
              Elige tu Nivel de <span className="bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">Productividad</span>
            </h2>
            <p className="text-slate-300 text-sm sm:text-base">
              Soluciones diseñadas para consultores independientes, líderes de SST y firmas asesoras en Colombia.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            {/* PLAN 1: WAPPY VITAL */}
            <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between hover:border-teal-500/40 transition-all">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Para Consultores</span>
                <h3 className="text-2xl font-extrabold text-white mt-1 mb-2">Wappy Vital</h3>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-4xl font-extrabold text-white">$350.000</span>
                  <span className="text-xs font-bold text-teal-400 uppercase">COP / Pago Único</span>
                </div>
                <div className="text-xs text-teal-300 font-semibold mb-6">
                  Acceso de por vida • Sin mensualidades
                </div>

                <ul className="space-y-3 text-xs text-slate-300 mb-8">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
                    <span>Hasta 20 chats diarios con Agentes Especializados</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
                    <span>Más de 15 Agentes Expertos de IA (Legal, Médico, Prevención)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
                    <span>Subida de archivos ilimitada para análisis de documentos</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
                    <span>Skill de Canvas Documental (Word, Hojas de cálculo y Slides)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
                    <span>Skill Editor RIT & Matriz IPEVAR Básica GTC-45</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
                    <span>Videollamada con Agente Biomecánico IA por visión artificial</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => navigate('/planes')}
                className="w-full py-3 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-all active:scale-95"
              >
                Adquirir Wappy Vital
              </button>
            </div>

            {/* PLAN 2: WAPPY PRO */}
            <div className="p-8 rounded-2xl bg-gradient-to-b from-teal-950/40 via-slate-900/90 to-slate-900/90 border-2 border-teal-500/60 flex flex-col justify-between shadow-2xl shadow-teal-950/40 relative">
              <div className="absolute -top-3.5 right-6 px-3 py-1 rounded-full bg-teal-500 text-slate-950 font-extrabold text-[10px] uppercase tracking-wider shadow-md">
                Más Recomendado
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-teal-400">Ecosistema Completo</span>
                <h3 className="text-2xl font-extrabold text-white mt-1 mb-2">Wappy Pro</h3>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-4xl font-extrabold text-white">$1.200.000</span>
                  <span className="text-xs font-bold text-teal-400 uppercase">COP / Año</span>
                </div>
                <div className="text-xs text-teal-300 font-semibold mb-6">
                  Desde $100.000 COP/mes (Opción semestral, trimestral y mensual)
                </div>

                <ul className="space-y-3 text-xs text-slate-300 mb-8">
                  <li className="flex items-start gap-2 font-semibold text-white">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
                    <span>Todo lo de Wappy Vital con chats 100% ilimitados</span>
                  </li>
                  <li className="flex items-start gap-2 font-semibold text-white">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
                    <span>Somos SST Completo (Motor Bio-Individual + Salud Organizacional)</span>
                  </li>
                  <li className="flex items-start gap-2 font-semibold text-white">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
                    <span>Matriz IPEVAR Live (GTC 45) con exportación a Excel</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
                    <span>Coordinador PESV Vial & Matriz Química SGA</span>
                  </li>
                  <li className="flex items-start gap-2 font-semibold text-teal-300">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
                    <span>1 Automatización Autónoma IA incluida (cron jobs sin supervisión)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
                    <span>Aula de Estudio LMS & Certificaciones Oficiales para trabajadores</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
                    <span>Crea y personaliza tus propios Agentes IA & Soporte VIP</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => navigate('/planes')}
                className="w-full py-3.5 rounded-xl font-bold text-xs bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white shadow-xl shadow-teal-800/40 transition-all hover:scale-[1.02] active:scale-95"
              >
                Adquirir Wappy Pro
              </button>
            </div>
          </div>
        </section>

        {/* EL CREADOR (FELIX BEDOYA) */}
        <section id="creador" className="py-24 bg-slate-900/40 border-t border-slate-800/80 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-10 lg:gap-14">
            <div className="flex-shrink-0 text-center">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-teal-500/25 blur-2xl rounded-full" />
                <img
                  src="/assets/avatars/Avatar1.png"
                  alt="Felix Bedoya"
                  className="w-36 h-36 sm:w-44 sm:h-44 rounded-full border-4 border-teal-500/80 object-cover relative z-10 shadow-2xl"
                  onError={(e) => {
                    e.currentTarget.src = 'https://api.dicebear.com/7.x/bottts/svg?seed=Felix1';
                  }}
                />
              </div>
            </div>

            <div>
              <span className="text-xs uppercase tracking-widest font-extrabold text-teal-400 mb-2 block">
                Detrás de WAPPY
              </span>
              <h2 className="text-3xl font-extrabold text-white tracking-tight mb-3">
                Mucho gusto, soy <span className="bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">Felix Bedoya</span>
              </h2>

              <div className="flex flex-wrap gap-2 mb-4 text-xs font-semibold">
                <span className="px-2.5 py-1 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  Psicólogo Especialista en SST
                </span>
                <span className="px-2.5 py-1 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Desarrollador Senior
                </span>
                <span className="px-2.5 py-1 rounded bg-slate-800 text-slate-300">
                  +8 Años de Experiencia
                </span>
                <span className="px-2.5 py-1 rounded bg-slate-800 text-slate-300">
                  Fundador de WAPPY
                </span>
              </div>

              <blockquote className="text-xs sm:text-sm text-slate-300 italic border-l-2 border-teal-500 pl-4 py-1 mb-4 leading-relaxed bg-slate-950/40 rounded-r-lg">
                "Al unir la tecnología y la inteligencia artificial con la SST, automaticé el papeleo repetitivo de semanas a horas. Esto me permitió asegurar mayor calidad técnica y escalar drásticamente mi consultoría."
              </blockquote>

              <p className="text-xs text-slate-400 leading-relaxed mb-6">
                Como especialista en Seguridad y Salud en el Trabajo en Colombia, viví en carne propia la frustración de pasar fines de semana enteros armando matrices de riesgos y reglamentos para cumplir con la ley y los estándares de las ARLs. Por eso programé WAPPY: el copiloto que utilizo a diario para generar informes con rigor técnico en minutos, ganando libertad y rentabilidad.
              </p>

              <a
                href="https://wa.me/573102913651?text=Hola%20Felix,%20quiero%20conocer%20más%20sobre%20WAPPY%20IA"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-700/30 transition-all active:scale-95"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Contactar por WhatsApp</span>
              </a>
            </div>
          </div>
        </section>

        {/* CALL TO ACTION FINAL */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
          <div className="p-8 sm:p-14 rounded-3xl bg-gradient-to-r from-teal-950/60 via-slate-900 to-cyan-950/60 border border-teal-500/40 text-center relative overflow-hidden shadow-2xl shadow-teal-950/60">
            <div className="relative z-10 max-w-2xl mx-auto">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
                Únete a la Revolución de la <span className="bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">SST en Colombia</span>
              </h2>
              <p className="text-slate-300 text-sm sm:text-base mb-8 leading-relaxed">
                Multiplica tu productividad, blindate ante requerimientos de las autoridades laborales y entrega reportes de alta calidad en minutos.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => navigate('/login')}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-xs bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white shadow-xl shadow-teal-800/40 transition-all hover:scale-[1.02] active:scale-95"
                >
                  Ingresar a WAPPY
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className="w-full sm:w-auto px-7 py-3.5 rounded-xl font-bold text-xs bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 transition-all active:scale-95"
                >
                  Crear Cuenta Gratis
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-800 bg-slate-950 text-slate-400 py-12 px-4 sm:px-6 lg:px-8 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <img src="/assets/logo.png" alt="WAPPY Logo" className="h-7 w-auto object-contain" />
            <span className="font-bold text-white">WAPPY IA</span>
            <span className="text-slate-500">•</span>
            <span>© {new Date().getFullYear()} Todos los derechos reservados.</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6">
            <a href="#somossst" className="hover:text-teal-400 transition-colors">Somos SST</a>
            <a href="#herramientas" className="hover:text-teal-400 transition-colors">Herramientas</a>
            <a href="#planes" className="hover:text-teal-400 transition-colors">Planes</a>
            <a href="/terms" className="hover:text-teal-400 transition-colors">Términos de Servicio</a>
            <a href="/privacy" className="hover:text-teal-400 transition-colors">Privacidad</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
