import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '~/hooks';
import './marketing.css';

export default function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthContext();

  const [isScrolled, setIsScrolled] = useState(false);
  const [lang, setLang] = useState<'es' | 'en'>('es');
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [isPwaModalOpen, setIsPwaModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Form states for Demo Modal
  const [demoName, setDemoName] = useState('');
  const [demoEmail, setDemoEmail] = useState('');
  const [demoCompany, setDemoCompany] = useState('');
  const [demoTeamSize, setDemoTeamSize] = useState('1–25 trabajadores');

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
      setIsScrolled(scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleStartTrial = () => {
    if (isAuthenticated) {
      navigate('/c/new');
    } else {
      navigate('/signup');
    }
  };

  const handleLogin = () => {
    if (isAuthenticated) {
      navigate('/c/new');
    } else {
      navigate('/login');
    }
  };

  const handleDemoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsDemoModalOpen(false);
    showToast(
      lang === 'es'
        ? '¡Solicitud recibida! Un especialista SST te contactará hoy mismo para tu demo personalizada.'
        : 'Demo request received! An SST specialist will contact you today.'
    );
    setDemoName('');
    setDemoEmail('');
    setDemoCompany('');
  };

  const toggleVideo = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsVideoPlaying(true);
      } else {
        videoRef.current.pause();
        setIsVideoPlaying(false);
      }
    }
  };

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    const el = document.getElementById(targetId);
    if (el) {
      const navOffset = 90;
      const elementPosition = el.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - navOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      try {
        window.history.pushState(null, '', `#${targetId}`);
      } catch (err) {
        // ignore
      }
    }
  };

  return (
    <div className="mkt">
      {/* Floating Capsule Navbar */}
      <nav className="mkt-nav" aria-label="Navegación principal">
        <div className={`mkt-nav-inner ${isScrolled ? 'scrolled' : ''}`}>
          <a
            className="mkt-nav-logo"
            aria-label="WAPPY IA - Ecosistema SG-SST Inteligente"
            href="/landing"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
              try { window.history.pushState(null, '', '/landing'); } catch (err) {}
            }}
          >
            <img src="/marketing/wappy-cat-logo.png" alt="WAPPY Logo" className="mkt-logo-icon" />
            <div className="mkt-logo-text">
              <span className="mkt-logo-title">WAPPY<span>IA</span></span>
              <span className="mkt-logo-sub">SOMOS SST</span>
            </div>
          </a>

          <div className="mkt-nav-links">
            <a href="#modulos" onClick={(e) => scrollToSection(e, 'modulos')} title="Somos SST: Estructura Integral">Somos SST</a>
            <a href="#tenshi" onClick={(e) => scrollToSection(e, 'tenshi')} title="Ecosistema de Agentes de IA Especializados">Agentes IA</a>
            <a href="#matrices" onClick={(e) => scrollToSection(e, 'matrices')} title="Matrices GTC 45 & Gestión de Riesgos">Matrices & Riesgos</a>
            <a href="#movil" onClick={(e) => scrollToSection(e, 'movil')} title="Visión por Cámara y Reportes en Campo">Visión & Campo</a>
            <a href="#pricing" onClick={(e) => scrollToSection(e, 'pricing')} title="Planes para Mipymes y Empresas">Planes</a>
            <a href="#faq" onClick={(e) => scrollToSection(e, 'faq')} title="Preguntas Frecuentes">FAQ</a>
          </div>

          <div className="mkt-nav-cta">
            <button type="button" className="btn btn-ghost mkt-nav-signin" onClick={handleLogin}>
              {isAuthenticated ? 'Ir al Chat' : 'Iniciar sesión'}
            </button>

            <button type="button" className="btn btn-lime btn-sm" onClick={() => setIsDemoModalOpen(true)}>
              Agendar demo
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="hero">
        <div className="cloud" style={{ top: 90, left: -60, width: 300, height: 120 }}></div>
        <div className="cloud" style={{ top: 240, right: -40, width: 260, height: 110 }}></div>
        <div className="cloud" style={{ bottom: 60, left: '18%', width: 240, height: 100, opacity: 0.5 }}></div>

        <div className="wrap hero-inner">
          <span className="trial">
            <span className="tdot"></span>
            {lang === 'es' ? 'Somos SST · Ecosistema de IA & Metodología del Bioindividuo' : 'Somos SST · AI Ecosystem & Bioindividual Methodology'}
          </span>

          <h1 className="display">
            {lang === 'es' ? (
              <>
                <span className="hero-h1-main">Evoluciona tu SG-SST con IA,</span>
                <span className="hero-h1-sub">análisis en vivo y analítica predictiva.</span>
              </>
            ) : (
              <>
                <span className="hero-h1-main">Evolve your OHS with AI,</span>
                <span className="hero-h1-sub">live analysis and predictive analytics.</span>
              </>
            )}
          </h1>

          <p className="sub">
            {lang === 'es'
              ? 'WAPPY sitúa al trabajador en el centro con la Metodología del Bioindividuo: gamificación participativa para comités y reportes, agentes expertos en tiempo real, integración directa con Google Drive y un centro educativo (Academia LMS) con certificaciones interactivas y blog normativo.'
              : 'WAPPY places the worker at the center with the Bioindividual Methodology: participatory gamification for committees and reports, real-time expert AI agents, Google Drive integration, and an LMS educational academy with interactive certifications and blog.'}
          </p>

          <div className="hero-cta">
            <button className="btn btn-primary" onClick={handleStartTrial}>
              Comenzar prueba gratis
              <span className="pip">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </span>
            </button>
            <button className="btn btn-glass" onClick={() => setIsDemoModalOpen(true)}>
              Ver demo en vivo
            </button>
          </div>

          <div className="hero-badges">
            <button
              type="button"
              className="pwa-install-badge"
              onClick={() => setIsPwaModalOpen(true)}
              title="Instalar WAPPY en tu celular o tablet (PWA)"
            >
              <div className="pwa-badge-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                  <line x1="12" y1="18" x2="12.01" y2="18"></line>
                </svg>
              </div>
              <div className="pwa-badge-content">
                <div className="pwa-s1">{lang === 'es' ? 'Disponible como App Móvil' : 'Available as Mobile App'}</div>
                <div className="pwa-s2">{lang === 'es' ? 'Descárgalo en tu celular · PWA' : 'Install on your phone · PWA'}</div>
              </div>
              <span className="pwa-badge-pill">
                {lang === 'es' ? 'Sin tiendas' : 'Instant'}
              </span>
            </button>
          </div>
        </div>

        {/* Floating Interactive Stage (Ecosistema Centrado en el Bioindividuo con estilo Imagen 2) */}
        <div className="wrap">
          <div className="hero-stage">
            {/* SVG Connecting Constellation Lines */}
            <svg className="hero-connectors" aria-hidden="true">
              <line x1="50%" y1="38%" x2="16%" y2="14%" className="connector-line" />
              <line x1="50%" y1="38%" x2="84%" y2="14%" className="connector-line" />
              <line x1="50%" y1="38%" x2="16%" y2="50%" className="connector-line" />
              <line x1="50%" y1="38%" x2="84%" y2="50%" className="connector-line" />
              <line x1="50%" y1="38%" x2="50%" y2="68%" className="connector-line" />
            </svg>

            {/* ⭐ CENTRO: EL COLABORADOR EN EL CORAZÓN DE LA ORGANIZACIÓN (Somos SST) - ESTÁTICO ⭐ */}
            <div className="float-center-bio" style={{ top: 230, left: '50%', transform: 'translate(-50%, -50%)', width: 310 }}>
              <div className="fcb-eyebrow">
                <span className="fcb-pulse-dot"></span>
                {lang === 'es' ? 'Metodología del Bioindividuo' : 'Bioindividual Methodology'}
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '10px 0 6px' }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: '#DCFCE7', color: '#15803D', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0, boxShadow: '0 4px 12px rgba(22,163,74,0.15)' }}>
                  👤
                </div>
                <div>
                  <div style={{ fontSize: 21, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                    {lang === 'es' ? 'El Colaborador' : 'The Worker'}
                  </div>
                  <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>
                    {lang === 'es' ? 'Núcleo de la Organización' : 'Core of the Organization'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#15803D', padding: '3px 8px', borderRadius: 9999, fontSize: 10.5, fontWeight: 800, margin: '2px 0 6px' }}>
                <span>⚡</span> {lang === 'es' ? 'Interconectado con +20 Agentes IA' : 'Connected to +20 AI Agents'}
              </div>

              <div className="fcb-bars" style={{ marginTop: 8 }}>
                <span className="fcb-bar" title="Salud"></span>
                <span className="fcb-bar" title="Aptitud"></span>
                <span className="fcb-bar" title="Bienestar"></span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9.5, fontWeight: 800, color: '#15803D', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 4 }}>
                <span>{lang === 'es' ? 'Salud' : 'Health'}</span>
                <span>{lang === 'es' ? 'Aptitud' : 'Fitness'}</span>
                <span>{lang === 'es' ? 'Bienestar' : 'Wellness'}</span>
              </div>

              <div className="fcb-tag" style={{ marginTop: 10 }}>
                {lang === 'es' ? 'NÚCLEO DEL ECOSISTEMA PREVENTIVO' : 'CORE OF THE PREVENTIVE ECOSYSTEM'}
              </div>
              <div className="fcb-sub" style={{ fontSize: 11, lineHeight: 1.35 }}>
                {lang === 'es'
                  ? 'El ser humano en el centro: hacia donde convergen las 30+ aplicaciones, la gamificación y la analítica predictiva.'
                  : 'The human at the center: where 30+ applications, gamification, and predictive AI converge.'}
              </div>
            </div>

            {/* Satellite 1 (Top-Left): Gamificación en SST */}
            <div className="float-card-v2" style={{ top: 8, left: '1.5%', width: 330 }}>
              <div className="fcv2-header">
                <div className="fcv2-icon" style={{ background: '#FEF3C7', color: '#B45309' }}>
                  🏆
                </div>
                <div className="fcv2-titles">
                  <div className="fcv2-title">Gamificación en SST</div>
                  <div className="fcv2-subtitle">Cultura Participativa & Retos</div>
                </div>
                <div className="fcv2-badge" style={{ background: '#FEF08A', color: '#854D0E' }}>
                  PARTICIPACIÓN 100%
                </div>
              </div>
              <div className="fcv2-body" style={{ background: '#FEF9C3', color: '#713F12' }}>
                Votaciones QR para comités (COPASST y Convivencia), retos de autocuidado, reporte lúdico de actos inseguros (ACI), seguimiento anímico diario y puntos que motivan a los colaboradores.
              </div>
            </div>

            {/* Satellite 2 (Top-Right): Hito 8: Inteligencia Artificial & Oráculo Predictivo */}
            <div className="float-card-v2" style={{ top: 8, right: '1.5%', width: 335, animationDelay: '1.2s' }}>
              <div className="fcv2-header">
                <div className="fcv2-icon" style={{ background: '#C7F303', color: '#0E1300' }}>
                  🔮
                </div>
                <div className="fcv2-titles">
                  <div className="fcv2-title">IA & Oráculo Predictivo</div>
                  <div className="fcv2-subtitle">Analítica Predictiva Avanzada</div>
                </div>
                <div className="fcv2-badge" style={{ background: '#FEF08A', color: '#854D0E' }}>
                  ANTICIPACIÓN EN VIVO
                </div>
              </div>
              <div className="fcv2-body" style={{ background: '#C7F303', color: '#0E1300' }}>
                {lang === 'es'
                  ? 'Pronóstico estocástico de siniestralidad y radar de 9 dominios bioindividuales: anticipa picos de riesgo ergonómico, ausentismo y accidentalidad antes de que ocurran, generando planes preventivos coordinados con los agentes de IA.'
                  : 'Stochastic incident forecasting and 9-domain bioindividual radar: anticipates ergonomic risks, absenteeism, and incidents before they happen with AI-coordinated preventive plans.'}
              </div>
            </div>

            {/* Satellite 3 (Bottom-Left): +20 Agentes Especialistas en SST */}
            <div className="float-card-v2" style={{ top: 220, left: '1.5%', width: 330, animationDelay: '2.1s' }}>
              <div className="fcv2-header">
                <div className="fcv2-icon" style={{ background: '#EFF6FF', color: '#2563EB' }}>
                  🤖
                </div>
                <div className="fcv2-titles">
                  <div className="fcv2-title">+20 Agentes Especialistas SST</div>
                  <div className="fcv2-subtitle">Inteligencia Artificial Autónoma 24/7</div>
                </div>
                <div className="fcv2-badge" style={{ background: '#CFFAFE', color: '#0E7490' }}>
                  MULTIA-AGENTE
                </div>
              </div>
              <div className="fcv2-body" style={{ background: '#ECFEFF', color: '#155E75' }}>
                Expertos dedicados: Médico Laboral, Auditor SG-SST, Especialista en Riesgo Químico (SGA), Biomecánica & ROSA, Tareas Críticas, GTC-45, Analista Forense AT/EL y Salud Mental.
              </div>
            </div>

            {/* Satellite 4 (Bottom-Right): Academia LMS & Blog SST */}
            <div className="float-card-v2" style={{ top: 220, right: '1.5%', width: 335, animationDelay: '1.8s' }}>
              <div className="fcv2-header">
                <div className="fcv2-icon" style={{ background: '#DCFCE7', color: '#15803D' }}>
                  🎓
                </div>
                <div className="fcv2-titles">
                  <div className="fcv2-title">Academia LMS & Blog SST</div>
                  <div className="fcv2-subtitle">Centro Educativo · Artículos al Día</div>
                </div>
                <div className="fcv2-badge" style={{ background: '#DCFCE7', color: '#15803D' }}>
                  CERTIFICADO ✓
                </div>
              </div>
              <div className="fcv2-body" style={{ background: '#F0FDF4', color: '#166534' }}>
                Micro-lecciones interactivas de 5 min con quizzes gamificados, expedición automática de carnets digitales verificables y blog con análisis normativo y técnico permanente.
              </div>
            </div>

            {/* Satellite 5 (Bottom-Center): Somos SST · +30 Aplicativos para el SG-SST */}
            <div className="float-card-v2 center-bottom" style={{ top: 410, left: '50%', transform: 'translateX(-50%)', width: 360 }}>
              <div className="fcv2-header">
                <div className="fcv2-icon" style={{ background: '#E0F2FE', color: '#0284C7' }}>
                  ⚡
                </div>
                <div className="fcv2-titles">
                  <div className="fcv2-title">Somos SST · Ecosistema Modular</div>
                  <div className="fcv2-subtitle">Más de 30 Aplicativos para el SG-SST</div>
                </div>
                <div className="fcv2-badge" style={{ background: '#E0E7FF', color: '#3730A3' }}>
                  8 HITOS
                </div>
              </div>
              <div className="fcv2-body" style={{ background: '#EFF6FF', color: '#1D4ED8' }}>
                {lang === 'es'
                  ? 'Plataforma con más de 30 aplicativos para el SG-SST: diagnóstico, matrices IPEVAR, comités, inspecciones de campo, ATS, actos predictivos en ATEL y analítica en tiempo real. ¡Todo 100% interconectado con nuestros agentes de IA!'
                  : 'Platform with 30+ applications for OHS: diagnostics, IPEVAR matrix, committees, inspections, JSA/ATS, predictive ATEL events, and real-time analytics. 100% interconnected with AI agents!'}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Bento Grid: Hito 2 · Huella Biocéntrica */}
      <section id="modulos" className="band">
        <div className="wrap">
          <div className="sec-head">
            <span className="eyebrow">
              <span className="dot"></span>
              {lang === 'es' ? 'Hito 2 · Metodología del Bioindividuo' : 'Milestone 2 · Bioindividual Methodology'}
            </span>
            <h2 className="display">
              {lang === 'es' ? 'Huella Biocéntrica: La Línea Base del Ser Humano' : 'Biocentric Blueprint: The Human Baseline'}
            </h2>
            <p>
              {lang === 'es'
                ? 'El viaje preventivo comienza reconociendo que cada individuo posee variaciones biológicas, clínicas y sociales únicas. WAPPY cruza el estado de salud y las capacidades del trabajador con las exigencias del cargo para prevenir daños antes de que ocurran.'
                : 'True prevention begins by recognizing that every worker has unique biological, clinical, and social variations. WAPPY crosses health baselines with job demands to prevent injuries before they occur.'}
            </p>
          </div>

          <div className="bento">
            {/* Big Cell: Dictamen de Compatibilidad Cargo-Persona & FIT Score 360° */}
            <div className="cell big">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 9999, background: '#10B981', display: 'inline-block' }}></span>
                  <div style={{ fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '.08em', color: '#10B981', fontWeight: 800 }}>
                    {lang === 'es' ? 'Cruce Analítico Cargo-Persona' : 'Job-Person Analytical Cross'}
                  </div>
                </div>
                <div className="display" style={{ fontSize: 26, marginTop: 4, lineHeight: 1.15, fontWeight: 700 }}>
                  {lang === 'es'
                    ? 'Dictamen de Compatibilidad Cargo-Persona · FIT Score 360°'
                    : 'Job-Person Compatibility & 360° FIT Score'}
                </div>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 8, lineHeight: 1.55 }}>
                  {lang === 'es'
                    ? '¿Qué significa el Porcentaje FIT? WAPPY cruza analíticamente las demandas del puesto (biomecánicas, físicas y psicosociales del Profesiograma) con el concepto de aptitud médica del colaborador (CIE-10). Un porcentaje alto (ej. 98.2% FIT) certifica compatibilidad total con su cargo; si el puntaje desciende, los Agentes IA prescriben adaptaciones ergonómicas y controles preventivos de inmediato para evitar enfermedades laborales.'
                    : 'What does the FIT Score mean? WAPPY analytically compares job demands (biomechanical, physical, cognitive) with the worker’s medical fitness (ICD-10). A high score (e.g. 98.2% FIT) certifies total job ergonomics and compatibility, prompting instant preventive adaptations if risks appear.'}
                </p>
              </div>

              <div className="chan-cards">
                <div className="chan-card">
                  <span className="cdot" style={{ background: '#10B981' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                    </svg>
                  </span>
                  <div>
                    <div className="cn">{lang === 'es' ? 'Conceptos de Aptitud Médica' : 'Medical Fitness Concepts'}</div>
                    <div className="cs">{lang === 'es' ? 'Diagnósticos CIE-10, ingresos y periódicos' : 'ICD-10, periodic exams'}</div>
                  </div>
                </div>

                <div className="chan-card">
                  <span className="cdot" style={{ background: '#0284C7' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                    </svg>
                  </span>
                  <div>
                    <div className="cn">{lang === 'es' ? 'Profesiograma & Biomecánica' : 'Job Demands & Biomechanics'}</div>
                    <div className="cs">{lang === 'es' ? 'Exigencias físicas, posturales y cognitivas' : 'Physical and posture demands'}</div>
                  </div>
                </div>

                <div className="chan-card">
                  <span className="cdot" style={{ background: '#D97706' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                  </span>
                  <div>
                    <div className="cn">{lang === 'es' ? 'Contexto Sociodemográfico' : 'Sociodemographic Context'}</div>
                    <div className="cs">{lang === 'es' ? 'Hábitos, entorno y vulnerabilidad' : 'Habits and vulnerability'}</div>
                  </div>
                </div>

                <div className="chan-card">
                  <span className="cdot" style={{ background: '#8B5CF6' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                    </svg>
                  </span>
                  <div>
                    <div className="cn">{lang === 'es' ? 'Planes de Adaptación Preventiva' : 'Preventive Adaptation Plans'}</div>
                    <div className="cs">{lang === 'es' ? 'Ajustes al puesto, pausas activas y controles' : 'Ergonomic controls & active breaks'}</div>
                  </div>
                </div>

                <div className="chan-card">
                  <span className="cdot" style={{ background: '#C7F303' }}>
                    <span style={{ fontSize: 13, fontWeight: 900, color: '#0E1300' }}>%</span>
                  </span>
                  <div>
                    <div className="cn">{lang === 'es' ? '98.2% FIT: Compatibilidad Óptima' : '98.2% FIT: Optimal Compatibility'}</div>
                    <div className="cs">{lang === 'es' ? 'Cruce analítico aptitud vs. demandas del puesto' : 'Analytical cross: fitness vs. job demands'}</div>
                  </div>
                </div>

                <div className="chan-card" style={{ alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed' }}>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: '#34D399' }}>
                    {lang === 'es' ? '✓ Interconectado con Agentes IA · Dec. 1072 & Res. 0312' : '✓ Connected with AI Agents · Dec. 1072 & Res. 0312'}
                  </span>
                </div>
              </div>
            </div>

            {/* Cell 1: Perfiles de Cargo (Roles & Profesiograma) */}
            <div className="cell" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ width: 36, height: 36, borderRadius: 10, background: '#E0F2FE', color: '#0369A1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                    💼
                  </span>
                  <span style={{ background: '#E0F2FE', color: '#0369A1', fontSize: 9.5, fontWeight: 800, padding: '3px 8px', borderRadius: 9999, textTransform: 'uppercase' }}>
                    Profesiograma
                  </span>
                </div>
                <div style={{ fontSize: 17, fontWeight: 700, color: '#0F172A', lineHeight: 1.25, marginBottom: 8 }}>
                  {lang === 'es' ? 'Perfiles de Cargo (Roles)' : 'Job Profiles & Demands'}
                </div>
                <div style={{ fontSize: 12.5, color: '#64748B', lineHeight: 1.5 }}>
                  {lang === 'es'
                    ? 'Parametriza exigencias biomecánicas (ROSA/OWAS), físicas, cognitivas y psicosociales reales del puesto. Define la matriz de EPP y exámenes obligatorios por rol.'
                    : 'Parameters for biomechanical, physical, cognitive, and psychosocial job demands. Defines required PPE and mandatory medical exams per role.'}
                </div>
              </div>
              <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid var(--line)', fontSize: 11, fontWeight: 700, color: '#0369A1' }}>
                ✓ {lang === 'es' ? 'Estandarización de exigencias' : 'Standardized job demands'}
              </div>
            </div>

            {/* Cell 2: Perfil Sociodemográfico */}
            <div className="cell" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ width: 36, height: 36, borderRadius: 10, background: '#FEF3C7', color: '#B45309', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                    👥
                  </span>
                  <span style={{ background: '#FEF3C7', color: '#B45309', fontSize: 9.5, fontWeight: 800, padding: '3px 8px', borderRadius: 9999, textTransform: 'uppercase' }}>
                    Antropología
                  </span>
                </div>
                <div style={{ fontSize: 17, fontWeight: 700, color: '#0F172A', lineHeight: 1.25, marginBottom: 8 }}>
                  {lang === 'es' ? 'Perfil Sociodemográfico' : 'Sociodemographic Profile'}
                </div>
                <div style={{ fontSize: 12.5, color: '#64748B', lineHeight: 1.5 }}>
                  {lang === 'es'
                    ? 'Mapea la comunidad laboral: edad, composición familiar, comorbilidades, hábitos y tiempo de desplazamiento. Permite personalizar los planes de salud y bienestar.'
                    : 'Maps workforce demographics: age, family composition, comorbidities, habits, and commute time to personalize health and wellness programs.'}
                </div>
              </div>
              <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid var(--line)', fontSize: 11, fontWeight: 700, color: '#B45309' }}>
                ✓ {lang === 'es' ? 'Vulnerabilidad individual y colectiva' : 'Individual & collective risk'}
              </div>
            </div>

            {/* Cell 3: Informe de Condiciones de Salud */}
            <div className="cell" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ width: 36, height: 36, borderRadius: 10, background: '#DCFCE7', color: '#15803D', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                    🩺
                  </span>
                  <span style={{ background: '#DCFCE7', color: '#15803D', fontSize: 9.5, fontWeight: 800, padding: '3px 8px', borderRadius: 9999, textTransform: 'uppercase' }}>
                    Clínica SST
                  </span>
                </div>
                <div style={{ fontSize: 17, fontWeight: 700, color: '#0F172A', lineHeight: 1.25, marginBottom: 8 }}>
                  {lang === 'es' ? 'Condiciones de Salud' : 'Health Baseline Reports'}
                </div>
                <div style={{ fontSize: 12.5, color: '#64748B', lineHeight: 1.5 }}>
                  {lang === 'es'
                    ? 'Seguimiento clínico de exámenes de ingreso, periódicos y retiro. Monitorea diagnósticos CIE-10, signos vitales y administra el semáforo de restricciones médicas laborales.'
                    : 'Clinical tracking of pre-employment, periodic, and exit exams. Monitors ICD-10 diagnoses, vital signs, and manages workplace medical restrictions.'}
                </div>
              </div>
              <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid var(--line)', fontSize: 11, fontWeight: 700, color: '#15803D' }}>
                ✓ {lang === 'es' ? 'Vigilancia epidemiológica activa' : 'Active medical surveillance'}
              </div>
            </div>

            {/* Cell 4: Portal del Colaborador por QR */}
            <div className="cell lime" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(14, 19, 0, 0.1)', color: '#0E1300', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                    📱
                  </span>
                  <span style={{ background: 'rgba(14, 19, 0, 0.12)', color: '#0E1300', fontSize: 9.5, fontWeight: 800, padding: '3px 8px', borderRadius: 9999, textTransform: 'uppercase' }}>
                    Cero Papeleo
                  </span>
                </div>
                <div style={{ fontSize: 17, fontWeight: 800, color: '#0E1300', lineHeight: 1.25, marginBottom: 8 }}>
                  {lang === 'es' ? 'Portal Móvil del Colaborador' : 'Mobile Worker Hub via QR'}
                </div>
                <div style={{ fontSize: 12.5, color: 'rgba(14, 19, 0, 0.72)', lineHeight: 1.5, fontWeight: 500 }}>
                  {lang === 'es'
                    ? 'El trabajador escanea el QR desde su celular, valida su cédula y autogestiona su perfil sociodemográfico, signos vitales y reporte de condiciones sin contraseñas.'
                    : 'Workers scan a QR on their phone, verify by ID, and update demographic profiles, vital signs, and conditions with zero passwords or paperwork.'}
                </div>
              </div>
              <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid rgba(14, 19, 0, 0.15)', fontSize: 11, fontWeight: 800, color: '#0E1300' }}>
                ⚡ {lang === 'es' ? 'Acceso instantáneo con QR' : 'Instant mobile QR access'}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Spotlights */}
      <section id="tenshi" className="band" style={{ paddingTop: 30 }}>
        <div className="wrap">
          {/* Feature 1: Comités */}
          <div className="feat">
            <div className="feat-copy">
              <span className="eyebrow">
                <span className="dot"></span>
                {lang === 'es' ? 'Comités Paritarios & Actas Oficiales' : 'Committees & Digital Minutes'}
              </span>
              <h3>{lang === 'es' ? 'COPASST, Convivencia y Brigada sin papeleo ni fricciones.' : 'Safety committees without paperwork or friction.'}</h3>
              <p>
                {lang === 'es'
                  ? 'Elecciones democráticas y secretas con código QR desde el celular, escrutinio automático en tiempo real, redacción de actas asistida por IA y firmas digitales de los integrantes con plena validez legal.'
                  : 'Secret QR code elections, real-time vote tally, AI-drafted minutes, and legally valid digital signatures directly from mobile.'}
              </p>
              <ul className="feat-list">
                <li>
                  <span className="ck">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  {lang === 'es' ? 'Votación secreta digital con código QR y validación de cédula' : 'Secret digital QR voting verified by worker ID'}
                </li>
                <li>
                  <span className="ck">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  {lang === 'es' ? 'Escrutinio en tiempo real, cálculo de quórum y actas de posesión' : 'Live participation percentage, quorum checks, and inauguration records'}
                </li>
                <li>
                  <span className="ck">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  {lang === 'es' ? 'Redacción asistida por Tenshi IA y firmas digitales en pantalla' : 'AI-assisted minutes drafting and touch digital signatures'}
                </li>
              </ul>
            </div>

            <div className="feat-art tint-sky">
              <div style={{ width: '100%', maxWidth: 360, background: '#fff', borderRadius: 18, boxShadow: '0 16px 40px rgba(20,40,80,0.14)', overflow: 'hidden' }}>
                <div style={{ padding: '14px 16px', borderBottom: '1px solid #EEF0F3', fontWeight: 700, fontFamily: 'var(--display)' }}>
                  {lang === 'es' ? 'Panel de Comités (COPASST & Convivencia)' : 'Committee Dashboard (COPASST & Harassment)'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '12px 16px', borderBottom: '1px solid #F2F3F5' }}>
                  <span style={{ width: 38, height: 38, borderRadius: 9999, background: '#E8EAFF', color: '#4852ED', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13 }}>
                    PR
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>Presidente COPASST</div>
                    <div style={{ fontSize: 12, color: '#9A9AA8' }}>Representante Empleador · {lang === 'es' ? 'Firmado digital' : 'Signed'}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '12px 16px', borderBottom: '1px solid #F2F3F5' }}>
                  <span style={{ width: 38, height: 38, borderRadius: 9999, background: '#D6F4DF', color: '#0A5818', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13 }}>
                    SC
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>Secretario del Comité</div>
                    <div style={{ fontSize: 12, color: '#9A9AA8' }}>Representante Trabajadores · {lang === 'es' ? 'Firmado digital' : 'Signed'}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '12px 16px' }}>
                  <span style={{ width: 38, height: 38, borderRadius: 9999, background: '#FEF0DC', color: '#F09030', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13 }}>
                    QR
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>Acta Registrada con Token</div>
                    <div style={{ fontSize: 12, color: '#9A9AA8' }}>Res. 2013/86 · Res. 652/12 · {lang === 'es' ? 'Auditada' : 'Audited'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 2: Tenshi Orquestador */}
          <div className="feat rev">
            <div className="feat-copy">
              <span className="eyebrow">
                <span className="dot"></span>
                {lang === 'es' ? 'Tenshi IA · Orquestador Autónomo' : 'Tenshi AI · Autonomous Orchestrator'}
              </span>
              <h3>{lang === 'es' ? 'Tu orquestador inteligente que coordina y ejecuta en el SG-SST.' : 'Your intelligent orchestrator coordinating and executing OHS tasks.'}</h3>
              <p>
                {lang === 'es'
                  ? 'Tenshi no es un simple chat que responde con generalidades: es el orquestador autónomo de WAPPY. Enruta tus requerimientos hacia más de 20 agentes especialistas (médicos, fisioterapeutas, abogados, químicos), diligencia formularios técnicos en pantalla mediante control de interfaz (Page Controller) y te asiste por voz en tiempo real con fundamentación en la ley colombiana.'
                  : 'Tenshi is WAPPY’s autonomous orchestrator. It delegates queries to +20 specialist agents, automates technical form filling on screen via Page Controller, and provides hands-free voice assistance grounded in Colombian OHS regulations.'}
              </p>
              <ul className="feat-list">
                <li>
                  <span className="ck">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  {lang === 'es' ? 'Orquesta y enruta consultas a más de 20 agentes especializados SST' : 'Orchestrates and routes queries to 20+ specialized OHS AI agents'}
                </li>
                <li>
                  <span className="ck">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  {lang === 'es' ? 'Automatización de interfaz: diligencia formularios, actas y matrices en pantalla' : 'Interface automation: fills technical forms, minutes, and matrices directly on screen'}
                </li>
                <li>
                  <span className="ck">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  {lang === 'es' ? 'Sesión de voz bidireccional en vivo para consultas en campo y manos libres' : 'Real-time two-way voice session for hands-free field operations'}
                </li>
              </ul>
            </div>

            <div className="feat-art tint-lav">
              <div style={{ width: '100%', maxWidth: 360, background: '#fff', borderRadius: 18, boxShadow: '0 16px 40px rgba(20,40,80,0.14)', padding: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 28, height: 28, borderRadius: 8, background: '#C7F303', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="2">
                        <path d="M12 3l1.9 5.8a2 2 0 0 0 1.3 1.3L21 12l-5.8 1.9a2 2 0 0 0-1.3 1.3L12 21l-1.9-5.8a2 2 0 0 0-1.3-1.3L3 12l5.8-1.9a2 2 0 0 0 1.3-1.3z"></path>
                      </svg>
                    </span>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>Tenshi IA</span>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 9999, background: '#E0E7FF', color: '#4338CA' }}>
                    Orquestador Activo
                  </span>
                </div>
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: 12, fontSize: 12.5, lineHeight: 1.5, color: '#334155', marginBottom: 12 }}>
                  {lang === 'es'
                    ? 'He coordinado con el Fisioterapeuta Laboral y el Médico Ocupacional. Diligencié la matriz de riesgos IPEVAR con controles de ingeniería y proyecté el borrador del acta reglamentaria.'
                    : 'Coordinated with the Occupational Physician and Ergonomist. Filled the IPEVAR matrix with engineering controls and drafted the committee minutes.'}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span style={{ flex: 1, height: 38, borderRadius: 9999, background: '#0E1300', color: '#C7F303', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>
                    ⚡ {lang === 'es' ? 'Diligenciado en Pantalla' : 'Automated on Screen'}
                  </span>
                  <span style={{ width: 38, height: 38, borderRadius: 9999, border: '1px solid #E7EAEE', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC', fontSize: 14 }}>
                    🎙️
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 3: Matrices Técnicas (GTC 45, SGA, Legal) */}
          <div id="matrices" className="feat">
            <div className="feat-copy">
              <span className="eyebrow">
                <span className="dot"></span>
                {lang === 'es' ? 'Matrices Técnicas & Evaluación de Riesgos' : 'Risk Matrices & Technical Compliance'}
              </span>
              <h3>{lang === 'es' ? 'Cálculos de riesgo exactos, matrices IPEVAR GTC 45 y SGA.' : 'Exact risk math, GTC 45 hazard matrix and chemical SGA.'}</h3>
              <p>
                {lang === 'es'
                  ? 'Gestiona tus matrices preventivas con metodologías estandarizadas: Matriz IPEVAR bajo GTC 45 con cálculo paramétrico exacto, Matriz de Compatibilidad Química oficial bajo el Sistema Globalmente Armonizado (SGA - Decreto 1496) y Matriz Legal SST auditada.'
                  : 'Manage safety matrices using official standards: GTC 45 hazard matrix with automated risk scoring, UN SGA chemical storage segregation, and verified Colombian legal compliance matrix.'}
              </p>
              <ul className="feat-list">
                <li>
                  <span className="ck">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  {lang === 'es' ? 'Fórmula matemática GTC 45: ND × NE = NP y NP × NC = Nivel de Riesgo (NR)' : 'GTC 45 mathematical formula: ND × NE = NP and NP × NC = Risk Level (NR)'}
                </li>
                <li>
                  <span className="ck">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  {lang === 'es' ? 'Matriz semaforizada oficial SGA (Decreto 1496) para bodegas de químicos' : 'Official color-coded SGA matrix (Decree 1496) for chemical segregation'}
                </li>
                <li>
                  <span className="ck">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  {lang === 'es' ? 'Matriz Legal con verificación de estándares mínimos (Dec. 1072 & Res. 0312)' : 'Legal matrix verifying minimum standards (Decree 1072 & Resolution 0312)'}
                </li>
              </ul>
            </div>

            <div className="feat-art tint-mint">
              <div style={{ width: 300, background: 'linear-gradient(160deg, #0F172A, #1E293B)', borderRadius: 20, boxShadow: '0 16px 40px rgba(15,23,42,0.25)', padding: 18, color: '#fff' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 18, color: '#C7F303' }}>
                    Matriz IPEVAR GTC 45
                  </div>
                  <span style={{ fontSize: 9.5, fontWeight: 800, padding: '2px 8px', borderRadius: 9999, background: 'rgba(199,243,3,0.15)', color: '#C7F303' }}>
                    AUTOMATIZADA
                  </span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: '12px 14px', marginBottom: 8, border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: '#fff' }}>Peligro Biomecánico / Físico</div>
                    <span style={{ fontSize: 10, fontWeight: 800, padding: '1px 6px', borderRadius: 6, background: '#EF4444', color: '#fff' }}>NR I</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>ND 6 · NE 4 · NC 25 = NR 600 (Crítico)</div>
                  <div style={{ fontSize: 10, color: '#34D399', fontWeight: 600, marginTop: 4 }}>✓ Control de Ingeniería Prescrito</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: '12px 14px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: '#fff' }}>Compatibilidad Química SGA</div>
                    <span style={{ fontSize: 10, fontWeight: 800, padding: '1px 6px', borderRadius: 6, background: '#10B981', color: '#fff' }}>100% OK</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>16 FDS / HDS verificadas · Sin cruces reactivos</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile Apps Showcase */}
      <section id="movil" className="band" style={{ background: 'var(--sky)', overflow: 'hidden', position: 'relative' }}>
        <div className="cloud" style={{ top: 40, left: -40, width: 240, height: 100 }}></div>
        <div className="cloud" style={{ bottom: 40, right: -30, width: 220, height: 90 }}></div>

        <div className="wrap" style={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
          <span className="eyebrow">
            <span className="dot"></span>
            {lang === 'es' ? 'Acceso Móvil PWA & IA en Vivo' : 'PWA Mobile & Live AI'}
          </span>
          <h2 className="display" style={{ fontSize: 'clamp(30px,4.6vw,48px)', margin: '14px 0 0' }}>
            {lang === 'es' ? 'Seguridad y Salud en tu bolsillo' : 'Safety and Health in your pocket'}
          </h2>
          <p style={{ fontSize: 17, color: 'rgba(14,19,0,0.62)', maxWidth: 540, margin: '14px auto 0' }}>
            {lang === 'es'
              ? 'Sin descargar aplicaciones pesadas: realiza análisis biomecánicos en vivo con el Fisioterapeuta IA, consulta a más de 20 especialistas SST y gestiona comités y reportes desde cualquier smartphone.'
              : 'Zero app store installs: run live ergonomic posture assessments, consult 20+ specialized AI agents, and manage committees directly from any mobile browser.'}
          </p>

          <div className="app-phones">
            {/* Phone 1: Análisis Biomecánico Fisioterapeuta IA */}
            <div className="phone-wrap">
              <div className="phone-label">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"></path>
                  <path d="M6 21v-4a6 6 0 0 1 12 0v4"></path>
                </svg>
                {lang === 'es' ? 'Análisis Biomecánico · Fisioterapeuta IA' : 'Biomechanical Analysis · AI Physio'}
              </div>
              <div className="phone">
                <div className="phone-screen">
                  <div className="phone-notch">
                    <span></span>
                  </div>
                  <div style={{ padding: '6px 16px 10px', textAlign: 'left', background: '#fff' }}>
                    <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 19, color: '#0E1300' }}>
                      {lang === 'es' ? 'Evaluación Postural' : 'Postural Assessment'}
                    </div>
                    <div style={{ display: 'flex', gap: 6, background: '#E9E9EE', borderRadius: 9, padding: 3, marginTop: 8 }}>
                      <span style={{ flex: 1, textAlign: 'center', fontSize: 11, fontWeight: 700, padding: '6px 0', background: '#fff', borderRadius: 7, color: '#0E1300' }}>
                        Visión IA en Vivo
                      </span>
                      <span style={{ flex: 1, textAlign: 'center', fontSize: 11, color: '#6A6A6E', padding: '6px 0', fontWeight: 600 }}>
                        ROSA / OWAS
                      </span>
                    </div>
                  </div>

                  <div style={{ background: '#F2F3F7', padding: 8, textAlign: 'left' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, background: '#fff', borderRadius: 14, marginBottom: 6 }}>
                      <span style={{ width: 36, height: 36, borderRadius: 10, background: '#FEF3C7', color: '#B45309', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13 }}>
                        24°
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A' }}>Inclinación Cervical / Cuello</div>
                        <div style={{ fontSize: 11, color: '#B45309', fontWeight: 600 }}>Flexión moderada · Alerta preventiva</div>
                        <span style={{ display: 'inline-block', marginTop: 3, fontSize: 9, fontWeight: 700, padding: '1px 7px', borderRadius: 9999, background: '#FEF3C7', color: '#B45309' }}>
                          Ajustar altura de pantalla
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, background: '#fff', borderRadius: 14, marginBottom: 6 }}>
                      <span style={{ width: 36, height: 36, borderRadius: 10, background: '#D6F4DF', color: '#0A5818', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13 }}>
                        OK
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A' }}>Alineación de Columna Lumbar</div>
                        <div style={{ fontSize: 11, color: '#64748B' }}>Apoyo lumbar adecuado en silla</div>
                        <span style={{ display: 'inline-block', marginTop: 3, fontSize: 9, fontWeight: 700, padding: '1px 7px', borderRadius: 9999, background: '#D6F4DF', color: '#0A5818' }}>
                          Postura Neutra Aceptable
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '6px 4px' }}>
                      <span style={{ height: 36, padding: '0 16px', borderRadius: 9999, background: '#C7F303', color: '#0E1300', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700 }}>
                        📷 {lang === 'es' ? 'Cámara en Vivo' : 'Live Camera'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Phone 2: Chat Especializado con +20 Agentes SST */}
            <div className="phone-wrap">
              <div className="phone-label">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                {lang === 'es' ? 'Chat Especializado · +20 Agentes SST' : 'Specialized Chat · 20+ OHS Agents'}
              </div>
              <div className="phone">
                <div className="phone-screen">
                  <div className="phone-notch">
                    <span style={{ width: 10, height: 10, borderRadius: 9999 }}></span>
                  </div>
                  <div style={{ background: 'linear-gradient(160deg, #0F172A, #1E293B)', padding: '12px 14px', color: '#fff', textAlign: 'left' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 32, height: 32, borderRadius: 9999, background: '#C7F303', color: '#0E1300', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13 }}>
                        FT
                      </span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>Fisioterapeuta Laboral IA</div>
                        <div style={{ fontSize: 10, color: '#94A3B8' }}>En línea · +20 Agentes disponibles</div>
                      </div>
                    </div>
                  </div>

                  <div style={{ padding: '12px', textAlign: 'left', background: '#F8FAFC' }}>
                    <div style={{ display: 'flex', gap: 5, overflowX: 'auto', paddingBottom: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 9999, background: '#0E1300', color: '#C7F303', whiteSpace: 'nowrap' }}>
                        Fisioterapeuta
                      </span>
                      <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 9999, background: '#E2E8F0', color: '#475569', whiteSpace: 'nowrap' }}>
                        Médico Laboral
                      </span>
                      <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 9999, background: '#E2E8F0', color: '#475569', whiteSpace: 'nowrap' }}>
                        Abogado RIT
                      </span>
                    </div>

                    <div style={{ background: '#fff', borderRadius: 14, padding: 10, fontSize: 12, lineHeight: 1.45, color: '#1E293B', border: '1px solid #E2E8F0', marginBottom: 8 }}>
                      {lang === 'es'
                        ? 'Analicé el puesto de trabajo. Para mitigar sobrecargas biomecánicas en miembros superiores, sugiero micropausas activas y elevación del monitor según la guía técnica del MinTrabajo.'
                        : 'Reviewed the workstation. To prevent upper limb strain, I recommend active micro-breaks and elevating the screen according to OHS ergonomic standards.'}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F1F5F9', borderRadius: 10, padding: '6px 10px', fontSize: 10.5, color: '#0369A1', fontWeight: 700 }}>
                      <span>📜</span>
                      <span>{lang === 'es' ? 'Citado con Res. 2400 & ISO 11226' : 'Cited with Res. 2400 & ISO 11226'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Video Band */}
      <section className="band vid-band">
        <div className="wrap">
          <div className="sec-head">
            <span className="eyebrow">
              <span className="dot"></span>
              {lang === 'es' ? 'WAPPY en acción' : 'WAPPY in action'}
            </span>
            <h2 className="display">{lang === 'es' ? 'La revolución de la IA en SST' : 'The AI revolution in OHS'}</h2>
            <p>
              {lang === 'es'
                ? 'Mira cómo Tenshi analiza una inspección en campo, calcula los índices de frecuencia y genera el informe de estándares mínimos en segundos.'
                : 'Watch Tenshi audit safety records, score road safety risks, and generate management reports.'}
            </p>
          </div>

          <div className="vid-shell">
            <span className="vid-tag eyebrow">
              <span className="dot"></span>
              {lang === 'es' ? 'Demostración de la plataforma' : 'Platform demo'}
            </span>
            <video
              ref={videoRef}
              src="/marketing/wappy-motion.mp4"
              muted
              loop
              autoPlay
              playsInline
              preload="auto"
            />
            <button
              className={`vid-play ${isVideoPlaying ? 'hide' : ''}`}
              aria-label="Play tour"
              onClick={toggleVideo}
            >
              <span className="pbtn">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="#0E1300">
                  <polygon points="6 4 20 12 6 20 6 4"></polygon>
                </svg>
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Más de 30 Aplicativos Disponibles en tu SG-SST */}
      <section className="band">
        <div className="wrap">
          <div className="sec-head">
            <span className="eyebrow">
              <span className="dot"></span>
              {lang === 'es' ? 'Ecosistema Integral de Aplicativos' : 'Comprehensive App Ecosystem'}
            </span>
            <h2 className="display">
              {lang === 'es' ? 'Más de 30 aplicativos disponibles para tu SG-SST' : '30+ Specialized OHS Applications Available'}
            </h2>
            <p>
              {lang === 'es'
                ? 'El ecosistema modular más completo de Colombia, estructurado bajo la Metodología del Bioindividuo y los 8 Hitos de gestión. Todos los aplicativos están 100% interconectados con más de 20 agentes de IA especializados que analizan, diligencian y previenen en tiempo real sin silos ni doble digitación.'
                : 'Colombia’s most robust OHS platform, structured under the Bioindividual Methodology and 8 management milestones, 100% interconnected with +20 specialist AI agents.'}
            </p>
          </div>

          <div className="intg">
            {/* 1. Diagnóstico 0312 */}
            <div className="i">
              <span className="g" style={{ background: '#E0F2FE' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#0284C7" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"></path>
                  <path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"></path>
                  <circle cx="20" cy="10" r="2"></circle>
                </svg>
              </span>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: '#0F172A', textAlign: 'center', lineHeight: 1.25, padding: '0 4px' }}>
                Diagnóstico 0312
              </span>
              <span style={{ fontSize: 9, fontWeight: 800, color: '#0284C7', background: '#E0F2FE', padding: '2px 6px', borderRadius: 9999 }}>
                Hito 1 · Gobernanza
              </span>
            </div>

            {/* 2. Matriz IPEVAR */}
            <div className="i">
              <span className="g" style={{ background: '#FEE2E2' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
              </span>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: '#0F172A', textAlign: 'center', lineHeight: 1.25, padding: '0 4px' }}>
                Matriz IPEVAR GTC 45
              </span>
              <span style={{ fontSize: 9, fontWeight: 800, color: '#DC2626', background: '#FEE2E2', padding: '2px 6px', borderRadius: 9999 }}>
                Hito 1 · Peligros
              </span>
            </div>

            {/* 3. Matriz Legal */}
            <div className="i">
              <span className="g" style={{ background: '#EDE9FE' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"></path>
                  <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"></path>
                  <path d="M7 21h10"></path>
                  <path d="M12 3v18"></path>
                  <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"></path>
                </svg>
              </span>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: '#0F172A', textAlign: 'center', lineHeight: 1.25, padding: '0 4px' }}>
                Matriz Legal SST
              </span>
              <span style={{ fontSize: 9, fontWeight: 800, color: '#7C3AED', background: '#EDE9FE', padding: '2px 6px', borderRadius: 9999 }}>
                Hito 1 · Dec. 1072
              </span>
            </div>

            {/* 4. Vulnerabilidad */}
            <div className="i">
              <span className="g" style={{ background: '#FFEDD5' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#EA580C" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <circle cx="12" cy="12" r="6"></circle>
                  <circle cx="12" cy="12" r="2"></circle>
                </svg>
              </span>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: '#0F172A', textAlign: 'center', lineHeight: 1.25, padding: '0 4px' }}>
                Vulnerabilidad & PAE
              </span>
              <span style={{ fontSize: 9, fontWeight: 800, color: '#EA580C', background: '#FFEDD5', padding: '2px 6px', borderRadius: 9999 }}>
                Hito 1 · Amenazas
              </span>
            </div>

            {/* 5. Política & Objetivos */}
            <div className="i">
              <span className="g" style={{ background: '#CCFBF1' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#0D9488" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                </svg>
              </span>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: '#0F172A', textAlign: 'center', lineHeight: 1.25, padding: '0 4px' }}>
                Política & Objetivos
              </span>
              <span style={{ fontSize: 9, fontWeight: 800, color: '#0D9488', background: '#CCFBF1', padding: '2px 6px', borderRadius: 9999 }}>
                Hito 1 · Promesa
              </span>
            </div>

            {/* 6. Reglamentos RHS & RIT */}
            <div className="i">
              <span className="g" style={{ background: '#FEF3C7' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#B45309" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                </svg>
              </span>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: '#0F172A', textAlign: 'center', lineHeight: 1.25, padding: '0 4px' }}>
                Reglamentos RHS / RIT
              </span>
              <span style={{ fontSize: 9, fontWeight: 800, color: '#B45309', background: '#FEF3C7', padding: '2px 6px', borderRadius: 9999 }}>
                Hito 1 · Normativa
              </span>
            </div>

            {/* 7. Perfiles de Cargo */}
            <div className="i">
              <span className="g" style={{ background: '#E0F2FE' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#0369A1" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                </svg>
              </span>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: '#0F172A', textAlign: 'center', lineHeight: 1.25, padding: '0 4px' }}>
                Perfiles de Cargo
              </span>
              <span style={{ fontSize: 9, fontWeight: 800, color: '#0369A1', background: '#E0F2FE', padding: '2px 6px', borderRadius: 9999 }}>
                Hito 2 · Profesiograma
              </span>
            </div>

            {/* 8. Perfil Sociodemográfico */}
            <div className="i">
              <span className="g" style={{ background: '#FEF3C7' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </span>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: '#0F172A', textAlign: 'center', lineHeight: 1.25, padding: '0 4px' }}>
                Perfil Sociodemográfico
              </span>
              <span style={{ fontSize: 9, fontWeight: 800, color: '#D97706', background: '#FEF3C7', padding: '2px 6px', borderRadius: 9999 }}>
                Hito 2 · Antropología
              </span>
            </div>

            {/* 9. Condiciones de Salud */}
            <div className="i">
              <span className="g" style={{ background: '#DCFCE7' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#15803D" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                </svg>
              </span>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: '#0F172A', textAlign: 'center', lineHeight: 1.25, padding: '0 4px' }}>
                Condiciones de Salud
              </span>
              <span style={{ fontSize: 9, fontWeight: 800, color: '#15803D', background: '#DCFCE7', padding: '2px 6px', borderRadius: 9999 }}>
                Hito 2 · CIE-10
              </span>
            </div>

            {/* 10. Dictamen FIT Score */}
            <div className="i">
              <span className="g" style={{ background: '#DBEAFE' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
              </span>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: '#0F172A', textAlign: 'center', lineHeight: 1.25, padding: '0 4px' }}>
                Dictamen FIT Score
              </span>
              <span style={{ fontSize: 9, fontWeight: 800, color: '#2563EB', background: '#DBEAFE', padding: '2px 6px', borderRadius: 9999 }}>
                Hito 2 · Compatibilidad
              </span>
            </div>

            {/* 11. Portal Móvil con QR */}
            <div className="i">
              <span className="g" style={{ background: '#F1F5F9' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                  <line x1="12" y1="18" x2="12.01" y2="18"></line>
                </svg>
              </span>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: '#0F172A', textAlign: 'center', lineHeight: 1.25, padding: '0 4px' }}>
                Portal Móvil con QR
              </span>
              <span style={{ fontSize: 9, fontWeight: 800, color: '#0E1300', background: '#E2E8F0', padding: '2px 6px', borderRadius: 9999 }}>
                Hito 2 · Cero Papel
              </span>
            </div>

            {/* 12. COPASST / Vigía */}
            <div className="i">
              <span className="g" style={{ background: '#E0E7FF' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#4338CA" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="7"></circle>
                  <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
                </svg>
              </span>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: '#0F172A', textAlign: 'center', lineHeight: 1.25, padding: '0 4px' }}>
                COPASST / Vigía SST
              </span>
              <span style={{ fontSize: 9, fontWeight: 800, color: '#4338CA', background: '#E0E7FF', padding: '2px 6px', borderRadius: 9999 }}>
                Hito 3 · Comités
              </span>
            </div>

            {/* 13. Convivencia COCOLAB */}
            <div className="i">
              <span className="g" style={{ background: '#FCE7F3' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#BE185D" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 14h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 16"></path>
                  <path d="m7 20 1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a2 2 0 0 0-2.8-2.8L15 13"></path>
                </svg>
              </span>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: '#0F172A', textAlign: 'center', lineHeight: 1.25, padding: '0 4px' }}>
                Comité Convivencia
              </span>
              <span style={{ fontSize: 9, fontWeight: 800, color: '#BE185D', background: '#FCE7F3', padding: '2px 6px', borderRadius: 9999 }}>
                Hito 3 · COCOLAB
              </span>
            </div>

            {/* 14. Brigada de Emergencia */}
            <div className="i">
              <span className="g" style={{ background: '#FEE2E2' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
              </span>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: '#0F172A', textAlign: 'center', lineHeight: 1.25, padding: '0 4px' }}>
                Brigada Emergencias
              </span>
              <span style={{ fontSize: 9, fontWeight: 800, color: '#DC2626', background: '#FEE2E2', padding: '2px 6px', borderRadius: 9999 }}>
                Hito 3 · Rescate
              </span>
            </div>

            {/* 15. Termómetro Psicosocial */}
            <div className="i">
              <span className="g" style={{ background: '#FFE4E6' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#E11D48" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>
                </svg>
              </span>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: '#0F172A', textAlign: 'center', lineHeight: 1.25, padding: '0 4px' }}>
                Termómetro Psicosocial
              </span>
              <span style={{ fontSize: 9, fontWeight: 800, color: '#E11D48', background: '#FFE4E6', padding: '2px 6px', borderRadius: 9999 }}>
                Hito 4 · Pulsos de Ánimo
              </span>
            </div>

            {/* 16. Estudio de Puesto (EPT) */}
            <div className="i">
              <span className="g" style={{ background: '#D1FAE5' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="5" r="3"></circle>
                  <path d="M12 8v8"></path>
                  <path d="M9 13l3 3 3-3"></path>
                  <path d="M7 21h10"></path>
                </svg>
              </span>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: '#0F172A', textAlign: 'center', lineHeight: 1.25, padding: '0 4px' }}>
                Estudio de Puesto (EPT)
              </span>
              <span style={{ fontSize: 9, fontWeight: 800, color: '#059669', background: '#D1FAE5', padding: '2px 6px', borderRadius: 9999 }}>
                Hito 4 · Biomecánica
              </span>
            </div>

            {/* 17. Método OWAS / ROSA */}
            <div className="i">
              <span className="g" style={{ background: '#FEF3C7' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 12h20"></path>
                  <path d="M20 12v8H4v-8"></path>
                  <path d="m4 12 8-8 8 8"></path>
                </svg>
              </span>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: '#0F172A', textAlign: 'center', lineHeight: 1.25, padding: '0 4px' }}>
                Método OWAS / ROSA
              </span>
              <span style={{ fontSize: 9, fontWeight: 800, color: '#D97706', background: '#FEF3C7', padding: '2px 6px', borderRadius: 9999 }}>
                Hito 4 · Ergonomía
              </span>
            </div>

            {/* 18. Análisis Trabajo Seguro (ATS) */}
            <div className="i">
              <span className="g" style={{ background: '#FFEDD5' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#B45309" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
              </span>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: '#0F172A', textAlign: 'center', lineHeight: 1.25, padding: '0 4px' }}>
                Análisis Seguro (ATS)
              </span>
              <span style={{ fontSize: 9, fontWeight: 800, color: '#B45309', background: '#FFEDD5', padding: '2px 6px', borderRadius: 9999 }}>
                Hito 5 · Terreno
              </span>
            </div>

            {/* 19. Permiso Alturas */}
            <div className="i">
              <span className="g" style={{ background: '#FEE2E2' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#EA580C" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v20"></path>
                  <path d="m17 5-5-3-5 3"></path>
                  <path d="m17 19-5 3-5-3"></path>
                </svg>
              </span>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: '#0F172A', textAlign: 'center', lineHeight: 1.25, padding: '0 4px' }}>
                Permisos de Alturas
              </span>
              <span style={{ fontSize: 9, fontWeight: 800, color: '#EA580C', background: '#FEE2E2', padding: '2px 6px', borderRadius: 9999 }}>
                Hito 5 · Res. 4272
              </span>
            </div>

            {/* 20. Química SGA */}
            <div className="i">
              <span className="g" style={{ background: '#E0F2FE' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#0284C7" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 2v7.31"></path>
                  <path d="M14 9.3V2"></path>
                  <path d="M8.5 2h7"></path>
                  <path d="M14 9.3a6.5 6.5 0 1 1-4 0"></path>
                </svg>
              </span>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: '#0F172A', textAlign: 'center', lineHeight: 1.25, padding: '0 4px' }}>
                Química SGA (Dec. 1496)
              </span>
              <span style={{ fontSize: 9, fontWeight: 800, color: '#0284C7', background: '#E0F2FE', padding: '2px 6px', borderRadius: 9999 }}>
                Hito 5 · FDS / ONU
              </span>
            </div>

            {/* 21. Entrega EPP */}
            <div className="i">
              <span className="g" style={{ background: '#DCFCE7' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#15803D" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  <path d="m9 12 2 2 4-4"></path>
                </svg>
              </span>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: '#0F172A', textAlign: 'center', lineHeight: 1.25, padding: '0 4px' }}>
                Entrega y Control EPP
              </span>
              <span style={{ fontSize: 9, fontWeight: 800, color: '#15803D', background: '#DCFCE7', padding: '2px 6px', borderRadius: 9999 }}>
                Hito 5 · Dotación
              </span>
            </div>

            {/* 22. Reporte de Actos */}
            <div className="i">
              <span className="g" style={{ background: '#FFE4E6' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#E11D48" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                  <circle cx="12" cy="13" r="4"></circle>
                </svg>
              </span>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: '#0F172A', textAlign: 'center', lineHeight: 1.25, padding: '0 4px' }}>
                Reporte de Actos
              </span>
              <span style={{ fontSize: 9, fontWeight: 800, color: '#E11D48', background: '#FFE4E6', padding: '2px 6px', borderRadius: 9999 }}>
                Hito 6 · Terreno
              </span>
            </div>

            {/* 23. Programa Capacitaciones */}
            <div className="i">
              <span className="g" style={{ background: '#CFFAFE' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#0891B2" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
              </span>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: '#0F172A', textAlign: 'center', lineHeight: 1.25, padding: '0 4px' }}>
                Capacitaciones SST
              </span>
              <span style={{ fontSize: 9, fontWeight: 800, color: '#0891B2', background: '#CFFAFE', padding: '2px 6px', borderRadius: 9999 }}>
                Hito 6 · Plan Formación
              </span>
            </div>

            {/* 24. Academia LMS */}
            <div className="i">
              <span className="g" style={{ background: '#EEF2FF' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                  <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
                </svg>
              </span>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: '#0F172A', textAlign: 'center', lineHeight: 1.25, padding: '0 4px' }}>
                Academia LMS SST
              </span>
              <span style={{ fontSize: 9, fontWeight: 800, color: '#4F46E5', background: '#EEF2FF', padding: '2px 6px', borderRadius: 9999 }}>
                Hito 6 · Certificados
              </span>
            </div>

            {/* 25. App Builder No-Code */}
            <div className="i">
              <span className="g" style={{ background: '#F3E8FF' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7"></rect>
                  <rect x="14" y="3" width="7" height="7"></rect>
                  <rect x="14" y="14" width="7" height="7"></rect>
                  <rect x="3" y="14" width="7" height="7"></rect>
                </svg>
              </span>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: '#0F172A', textAlign: 'center', lineHeight: 1.25, padding: '0 4px' }}>
                App Builder No-Code
              </span>
              <span style={{ fontSize: 9, fontWeight: 800, color: '#7C3AED', background: '#F3E8FF', padding: '2px 6px', borderRadius: 9999 }}>
                Hito 6 · Creador
              </span>
            </div>

            {/* 26. Gestión ATEL */}
            <div className="i">
              <span className="g" style={{ background: '#DBEAFE' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="20" x2="18" y2="10"></line>
                  <line x1="12" y1="20" x2="12" y2="4"></line>
                  <line x1="6" y1="20" x2="6" y2="14"></line>
                </svg>
              </span>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: '#0F172A', textAlign: 'center', lineHeight: 1.25, padding: '0 4px' }}>
                Ausentismo & ATEL
              </span>
              <span style={{ fontSize: 9, fontWeight: 800, color: '#2563EB', background: '#DBEAFE', padding: '2px 6px', borderRadius: 9999 }}>
                Hito 7 · Indicadores
              </span>
            </div>

            {/* 27. Investigación AT */}
            <div className="i">
              <span className="g" style={{ background: '#FAF5FF' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#9333EA" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </span>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: '#0F172A', textAlign: 'center', lineHeight: 1.25, padding: '0 4px' }}>
                Investigación Forense
              </span>
              <span style={{ fontSize: 9, fontWeight: 800, color: '#9333EA', background: '#FAF5FF', padding: '2px 6px', borderRadius: 9999 }}>
                Hito 7 · Árbol Causas
              </span>
            </div>

            {/* 28. Tablero Kanban ACPM */}
            <div className="i">
              <span className="g" style={{ background: '#D1FAE5' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2"></rect>
                  <path d="M7 7h3v10H7z"></path>
                  <path d="M14 7h3v6h-3z"></path>
                </svg>
              </span>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: '#0F172A', textAlign: 'center', lineHeight: 1.25, padding: '0 4px' }}>
                Tablero Kanban ACPM
              </span>
              <span style={{ fontSize: 9, fontWeight: 800, color: '#059669', background: '#D1FAE5', padding: '2px 6px', borderRadius: 9999 }}>
                Hito 7 · Mejora
              </span>
            </div>

            {/* 29. Auditoría SG-SST */}
            <div className="i">
              <span className="g" style={{ background: '#CCFBF1' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#0D9488" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                  <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                  <path d="m9 14 2 2 4-4"></path>
                </svg>
              </span>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: '#0F172A', textAlign: 'center', lineHeight: 1.25, padding: '0 4px' }}>
                Auditoría SG-SST 360°
              </span>
              <span style={{ fontSize: 9, fontWeight: 800, color: '#0D9488', background: '#CCFBF1', padding: '2px 6px', borderRadius: 9999 }}>
                Hito 7 · Eficacia
              </span>
            </div>

            {/* 30. Centro Predictivo IA */}
            <div className="i">
              <span className="g" style={{ background: '#0E1300' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#C7F303" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z"></path>
                  <path d="m9 12 2 2 4-4"></path>
                </svg>
              </span>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: '#0F172A', textAlign: 'center', lineHeight: 1.25, padding: '0 4px' }}>
                Centro Predictivo IA
              </span>
              <span style={{ fontSize: 9, fontWeight: 800, color: '#0E1300', background: '#C7F303', padding: '2px 6px', borderRadius: 9999 }}>
                Hito 8 · Oráculo
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="band" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="sec-head">
            <span className="eyebrow">
              <span className="dot"></span>
              {lang === 'es' ? 'Validado en el Sector Real' : 'Validated in Real Industry'}
            </span>
            <h2 className="display">{lang === 'es' ? 'Lo que dicen los líderes SST' : 'What OHS leaders say'}</h2>
          </div>

          <div className="tgrid">
            <div className="tcard">
              <div className="stars">★★★★★</div>
              <p>
                {lang === 'es'
                  ? '“Redujimos el 80% del tiempo transcribiendo actas de COPASST y actualizando matrices GTC 45. Tenshi es el mejor asistente que un líder SST puede tener.”'
                  : '“We cut 80% of our manual time drafting committee minutes and hazard matrices. Tenshi is a game changer.”'}
              </p>
              <div className="who">
                <span className="av" style={{ background: '#E8EAFF', color: '#4852ED' }}>CM</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>Claudia Martínez</div>
                  <div style={{ fontSize: 12.5, color: '#9A9AA8' }}>Gerente SST · Sector Construcción</div>
                </div>
              </div>
            </div>

            <div className="tcard">
              <div className="stars">★★★★★</div>
              <p>
                {lang === 'es'
                  ? '“La Matriz IPEVAR bajo GTC 45 y la evaluación paramétrica nos permitieron pasar la auditoría de la ARL con 100% de cumplimiento. El cálculo automático de deficiencia y exposición es impecable.”'
                  : '“The GTC 45 IPEVAR matrix and automated risk scoring helped us pass our OHS audit with 100% compliance. Flawless mathematical risk calculations.”'}
              </p>
              <div className="who">
                <span className="av" style={{ background: '#D6F4DF', color: '#0A5818' }}>AR</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>Andrés Rentería</div>
                  <div style={{ fontSize: 12.5, color: '#9A9AA8' }}>Líder de Seguridad y Salud en el Trabajo</div>
                </div>
              </div>
            </div>

            <div className="tcard">
              <div className="stars">★★★★★</div>
              <p>
                {lang === 'es'
                  ? '“La matriz de compatibilidad química evitó errores graves en nuestro centro de distribución de solventes. Obligatorio para cualquier empresa industrial en Colombia.”'
                  : '“The chemical compatibility matrix prevented dangerous storage errors in our industrial warehouse. Absolutely essential.”'}
              </p>
              <div className="who">
                <span className="av" style={{ background: '#FEF0DC', color: '#F09030' }}>MP</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>Ing. Marcela Pardo</div>
                  <div style={{ fontSize: 12.5, color: '#9A9AA8' }}>Consultora Senior Especialista SST</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Lifestyle Section */}
      <section className="band" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="life">
            <img className="bg" src="/marketing/ref-lifestyle-1.png" alt="Seguridad en el Trabajo" />
            <div className="scrim"></div>
            <div className="life-copy">
              <span className="eyebrow">
                <span className="dot"></span>
                {lang === 'es' ? 'Cultura Preventiva Real' : 'Real Preventive Culture'}
              </span>
              <h2>{lang === 'es' ? 'Protege la vida de tus trabajadores.' : 'Protect your workforce every single day.'}</h2>
              <p>
                {lang === 'es'
                  ? 'La seguridad no es llenar formularios para evitar multas; es asegurar que cada trabajador regrese sano y salvo a casa. WAPPY te da las herramientas para lograrlo sin burocracia.'
                  : 'Safety is about making sure every worker returns home safe. WAPPY gives your team the automation to focus on human lives, not paperwork.'}
              </p>
              <div className="hero-cta" style={{ justifyContent: 'flex-start', marginTop: 24 }}>
                <button className="btn btn-lime" onClick={handleStartTrial}>
                  {lang === 'es' ? 'Comenzar prueba gratis de 7 días' : 'Start 7-day free trial'}
                </button>
              </div>
            </div>

            <div className="life-float" style={{ top: 36, right: 36, width: 260 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 9 }}>
                <span style={{ width: 24, height: 24, borderRadius: 7, background: '#C7F303', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="2">
                    <path d="M12 3l1.9 5.8a2 2 0 0 0 1.3 1.3L21 12l-5.8 1.9a2 2 0 0 0-1.3 1.3L12 21l-1.9-5.8a2 2 0 0 0-1.3-1.3L3 12l5.8-1.9a2 2 0 0 0 1.3-1.3z"></path>
                  </svg>
                </span>
                <span style={{ fontSize: 12.5, fontWeight: 700 }}>Tenshi Alerta SST</span>
              </div>
              <div style={{ background: '#C7F303', borderRadius: 12, padding: '9px 12px', fontSize: 12, fontWeight: 500, color: '#0E1300', lineHeight: 1.4 }}>
                {lang === 'es'
                  ? '¡Excelente jornada! Hoy registramos cero incidentes y el 100% de preoperacionales completados en campo 👷‍♂️✨'
                  : 'Zero incidents recorded today and 100% of field pre-trips completed 👷‍♂️✨'}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="band" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="sec-head">
            <span className="eyebrow">
              <span className="dot"></span>
              FAQ
            </span>
            <h2 className="display">{lang === 'es' ? 'Preguntas Frecuentes' : 'Frequently Asked Questions'}</h2>
          </div>

          <div className="faq">
            <div className={`qa ${openFaq === 0 ? 'open' : ''}`}>
              <button onClick={() => setOpenFaq(openFaq === 0 ? null : 0)} aria-expanded={openFaq === 0}>
                {lang === 'es' ? '¿WAPPY cumple estrictamente con la legislación colombiana?' : 'Does WAPPY fully comply with Colombian regulations?'}
                <span className="q-ico">+</span>
              </button>
              <div className="a">
                <p>
                  {lang === 'es'
                    ? 'Totalmente. WAPPY está programado y auditado con base en la Resolución 0312 de 2019 (Estándares Mínimos), Decreto 1072 de 2015 (SG-SST), Guía Técnica Colombiana GTC 45, Decreto 1496 de 2018 (Sistema Globalmente Armonizado SGA), Resolución 2013 de 1986 (COPASST), Resolución 652 de 2012 y Ley 2365 de 2024 (Convivencia Laboral).'
                    : 'Yes. WAPPY is modeled strictly on Colombian regulations: Decree 1072 of 2015, Res. 0312 of 2019, GTC 45 hazard guide, Decree 1496 (SGA), Res. 2013 of 1986 (COPASST), and Law 2365 of 2024 (Labor Harassment).'}
                </p>
              </div>
            </div>

            <div className={`qa ${openFaq === 1 ? 'open' : ''}`}>
              <button onClick={() => setOpenFaq(openFaq === 1 ? null : 1)} aria-expanded={openFaq === 1}>
                {lang === 'es' ? '¿Qué es Tenshi IA y cómo se diferencia de un ChatGPT genérico?' : 'What is Tenshi AI and how is it different from general ChatGPT?'}
                <span className="q-ico">+</span>
              </button>
              <div className="a">
                <p>
                  {lang === 'es'
                    ? 'Tenshi no es un chatbot genérico desconectado: es un orquestador inteligente autónomo. Coordina y delega consultas hacia más de 20 agentes especialistas en SST (fisioterapeutas, médicos laborales, abogados y químicos), diligencia formularios técnicos en pantalla mediante control de interfaz (Page Controller) y te asiste por voz con citas normativas exactas a la ley colombiana.'
                    : 'Tenshi is an autonomous orchestrator connected to your safety database. It delegates queries to 20+ specialized OHS agents, fills forms on screen via Page Controller, and assists by voice citing exact statutory standards.'}
                </p>
              </div>
            </div>

            <div className={`qa ${openFaq === 2 ? 'open' : ''}`}>
              <button onClick={() => setOpenFaq(openFaq === 2 ? null : 2)} aria-expanded={openFaq === 2}>
                {lang === 'es' ? '¿Puedo exportar actas, matrices y reportes a Excel, Word o PDF?' : 'Can I export matrices and minutes to Excel, Word, or PDF?'}
                <span className="q-ico">+</span>
              </button>
              <div className="a">
                <p>
                  {lang === 'es'
                    ? 'Sí. Todos los documentos generados en WAPPY (actas de comités, matriz de riesgos GTC 45, matriz de compatibilidad química SGA, diagnósticos de estándares mínimos y carnets de capacitación) pueden exportarse en formatos editables de Excel y Word o descargarse en PDF membretados listos para auditorías.'
                    : 'Yes. All generated records (committee minutes, GTC 45 risk matrix, chemical SGA matrix, and training certificates) export with one click to editable Excel/Word and signed PDF files.'}
                </p>
              </div>
            </div>

            <div className={`qa ${openFaq === 3 ? 'open' : ''}`}>
              <button onClick={() => setOpenFaq(openFaq === 3 ? null : 3)} aria-expanded={openFaq === 3}>
                {lang === 'es' ? '¿Cómo acceden los colaboradores desde su celular sin contraseñas?' : 'How do workers access mobile tools without passwords?'}
                <span className="q-ico">+</span>
              </button>
              <div className="a">
                <p>
                  {lang === 'es'
                    ? 'Mediante el portal móvil PWA y código QR oficial de la empresa. Los colaboradores escanean el QR desde su celular, validan su cédula y pueden autogestionar su perfil sociodemográfico, participar en votaciones secretas de comités, firmar actas digitalmente y reportar condiciones inseguras con foto al instante.'
                    : 'Through the PWA mobile portal and company QR code. Workers scan the QR, verify with their national ID, and can update their demographic profiles, cast secret committee votes, sign minutes, and report hazards with photos instantly.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="band" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="sec-head">
            <span className="eyebrow">
              <span className="dot"></span>
              {lang === 'es' ? 'Planes Transparentes' : 'Transparent Pricing'}
            </span>
            <h2 className="display">{lang === 'es' ? 'Planes que se ajustan a tu empresa' : 'Plans tailored to your organization'}</h2>
            <p>
              {lang === 'es'
                ? 'Todos los planes inician con 7 días de prueba gratuita. Sin contratos de permanencia ni cobros ocultos.'
                : 'All plans include a 7-day free trial. No lock-in, no hidden fees.'}
            </p>
          </div>

          <div className="price">
            {/* Starter: Plan Plus */}
            <div className="pcard">
              <div className="pn">{lang === 'es' ? 'Plan Plus' : 'Plus Plan'}</div>
              <div className="pp">$57.800<span>{lang === 'es' ? ' COP /mes' : ' COP/mo'}</span></div>
              <div style={{ fontSize: 13, color: '#9A9AA8', marginBottom: 4 }}>
                {lang === 'es' ? 'Para profesionales y responsables del SG-SST' : 'For independent OHS professionals & consultants'}
              </div>
              <div className="ptrial">
                <span style={{ width: 6, height: 6, borderRadius: 9999, background: '#1E8E3E', display: 'inline-block' }}></span>
                {lang === 'es' ? 'Prueba gratis de 7 días' : '7-day free trial'}
              </div>
              <ul>
                <li>
                  <span className="pck">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  {lang === 'es' ? 'Acceso a plataforma Somos SST' : 'Access to Somos SST platform'}
                </li>
                <li>
                  <span className="pck">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  {lang === 'es' ? 'Chat con IA y conversaciones ilimitadas' : 'Unlimited AI chat & conversations'}
                </li>
                <li>
                  <span className="pck">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  {lang === 'es' ? 'Más de 15 Agentes Expertos en SST' : '15+ Specialized OHS AI agents'}
                </li>
                <li>
                  <span className="pck">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  {lang === 'es' ? 'Agente Matriz IPEVR (GTC 45)' : 'IPEVR Hazard Matrix Agent (GTC 45)'}
                </li>
                <li>
                  <span className="pck">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  {lang === 'es' ? 'Aula de estudio & Blog WAPPY' : 'Study Hall & WAPPY Blog'}
                </li>
                <li>
                  <span className="pck">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  {lang === 'es' ? 'Exportación oficial a Excel y PDF' : 'Official export to Excel and PDF'}
                </li>
              </ul>
              <button className="btn btn-glass btn-sm" style={{ marginTop: 'auto', justifyContent: 'center', border: '1px solid var(--line)' }} onClick={() => navigate('/planes')}>
                {lang === 'es' ? 'Elegir Plan Plus' : 'Choose Plus Plan'}
              </button>
            </div>

            {/* Flagship: Wappy Pro */}
            <div className="pcard feat-plan">
              <span className="pbadge">{lang === 'es' ? 'Más popular' : 'Most Popular'}</span>
              <div className="pn">{lang === 'es' ? 'Wappy Pro' : 'Wappy Pro'}</div>
              <div className="pp">$114.330<span>{lang === 'es' ? ' COP /mes' : ' COP/mo'}</span></div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 4 }}>
                {lang === 'es' ? 'Para empresas que buscan analítica predictiva y visión IA' : 'For organizations seeking predictive AI & live vision'}
              </div>
              <div className="ptrial">
                <span style={{ width: 6, height: 6, borderRadius: 9999, background: 'var(--lime)', display: 'inline-block' }}></span>
                {lang === 'es' ? 'Prueba gratis de 7 días' : '7-day free trial'}
              </div>
              <ul>
                <li>
                  <span className="pck">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  <strong>{lang === 'es' ? 'Todo lo del Plan Plus, y además:' : 'Everything in Plus Plan, plus:'}</strong>
                </li>
                <li>
                  <span className="pck">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  {lang === 'es' ? 'Somos SST completo (30+ aplicativos en 8 hitos)' : 'Full Somos SST (30+ apps across 8 milestones)'}
                </li>
                <li>
                  <span className="pck">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  {lang === 'es' ? 'Actos predictivos en ATEL & Termómetro Psicosocial' : 'Predictive ATEL Incidents & Psychosocial Climate'}
                </li>
                <li>
                  <span className="pck">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  {lang === 'es' ? 'Todos los módulos interconectados con más de 20 Agentes IA' : 'All modules interconnected with +20 AI Agents'}
                </li>
                <li>
                  <span className="pck">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  {lang === 'es' ? 'Chat Live (videollamada en vivo para riesgos)' : 'Chat Live (video calling to inspect hazards)'}
                </li>
                <li>
                  <span className="pck">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  {lang === 'es' ? 'Análisis Biomecánico en Vivo con Visión IA' : 'Live Biomechanical Analysis with AI Vision'}
                </li>
                <li>
                  <span className="pck">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  {lang === 'es' ? 'Crea tus propios Agentes de IA a la medida' : 'Create your own custom AI agents'}
                </li>
                <li>
                  <span className="pck">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  {lang === 'es' ? '3 GB de almacenamiento (+1 GB por sede adicional)' : '3 GB storage (+1 GB per extra branch)'}
                </li>
              </ul>
              <button className="btn btn-lime btn-sm" style={{ marginTop: 'auto', justifyContent: 'center' }} onClick={() => navigate('/planes')}>
                {lang === 'es' ? 'Elegir Wappy Pro' : 'Choose Wappy Pro'}
              </button>
            </div>

            {/* Lifetime: Wappy Vital */}
            <div className="pcard">
              <span className="pbadge" style={{ background: '#10B981', color: '#fff' }}>
                {lang === 'es' ? 'Pago Único' : 'One-time Pay'}
              </span>
              <div className="pn">{lang === 'es' ? 'Wappy Vital' : 'Wappy Vital'}</div>
              <div className="pp">$150.000<span>{lang === 'es' ? ' COP' : ' COP'}</span></div>
              <div style={{ fontSize: 13, color: '#9A9AA8', marginBottom: 4 }}>
                {lang === 'es' ? 'Acceso de por vida · Sin mensualidades recurrentes' : 'Lifetime access · No recurring fees'}
              </div>
              <div className="ptrial">
                <span style={{ width: 6, height: 6, borderRadius: 9999, background: '#10B981', display: 'inline-block' }}></span>
                {lang === 'es' ? 'Licencia vitalicia permanente' : 'Permanent lifetime license'}
              </div>
              <ul>
                <li>
                  <span className="pck">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  {lang === 'es' ? 'Acceso vitalicio para 1 empresa' : 'Lifetime access for 1 company'}
                </li>
                <li>
                  <span className="pck">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  {lang === 'es' ? 'Hasta 20 chats abiertos simultáneos' : 'Up to 20 open concurrent chats'}
                </li>
                <li>
                  <span className="pck">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  {lang === 'es' ? 'Más de 15 Agentes Especialistas en SST' : '15+ Specialized OHS AI agents'}
                </li>
                <li>
                  <span className="pck">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  {lang === 'es' ? 'Skills IPEVR, Editor RIT y Canvas' : 'IPEVR, RIT Editor & Canvas Skills'}
                </li>
                <li>
                  <span className="pck">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  {lang === 'es' ? 'Videollamada con exoesqueleto biomecánico' : 'Video call with biomechanical exoskeleton'}
                </li>
                <li>
                  <span className="pck">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  {lang === 'es' ? 'Descargas y exportaciones ilimitadas' : 'Unlimited downloads & exports'}
                </li>
              </ul>
              <button className="btn btn-glass btn-sm" style={{ marginTop: 'auto', justifyContent: 'center', border: '1px solid var(--line)' }} onClick={() => navigate('/planes')}>
                {lang === 'es' ? 'Obtener Wappy Vital' : 'Get Wappy Vital'}
              </button>
            </div>
          </div>

          {/* Banner Plan Empresas / Asesores / ARL */}
          <div style={{ marginTop: 24, padding: '20px 24px', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 20, display: 'flex', flexDirection: 'column', md: { flexDirection: 'row' }, alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>
                {lang === 'es' ? '¿Eres intermediador de ARL, consultora o gran empresa?' : 'Are you an ARL intermediary, consulting firm, or large enterprise?'}
              </div>
              <div style={{ fontSize: 13, color: 'var(--ink2)', marginTop: 4 }}>
                {lang === 'es'
                  ? 'Plan Empresas & Corporativo: Dominio propio, marca blanca con logos propios, usuarios ilimitados, agentes IA a la medida y 200 GB de almacenamiento.'
                  : 'Enterprise Plan: Custom domain, white-label branding, unlimited users, custom AI agents, and 200 GB storage.'}
              </div>
            </div>
            <button className="btn btn-primary btn-sm" style={{ whiteSpace: 'nowrap' }} onClick={() => setIsDemoModalOpen(true)}>
              {lang === 'es' ? 'Hablar con Asesor Corporativo' : 'Contact Enterprise Team'}
            </button>
          </div>

          <div className="price-note">
            {lang === 'es'
              ? 'Todos los planes incluyen actualizaciones normativas automáticas y soporte técnico especializado.'
              : 'All plans include automatic regulatory updates and specialized technical support.'}{' '}
            <button
              type="button"
              className="legal-link"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              onClick={() => setIsCompareModalOpen(true)}
            >
              {lang === 'es' ? 'Ver tabla comparativa detallada →' : 'See detailed comparison table →'}
            </button>
          </div>
        </div>
      </section>

      {/* Final Banner */}
      <section className="final">
        <span className="trial" style={{ marginBottom: 18 }}>
          <span className="tdot"></span>
          {lang === 'es' ? 'Auditoría sin estrés garantizada' : 'Stress-free compliance guaranteed'}
        </span>
        <h2>{lang === 'es' ? 'Moderniza tu gestión SST hoy mismo.' : 'Modernize your OHS management today.'}</h2>
        <p>
          {lang === 'es'
            ? 'Configura tu primera empresa en 2 minutos y deja que Tenshi orqueste tu cumplimiento.'
            : 'Set up your company in 2 minutes and let Tenshi orchestrate your compliance.'}
        </p>
        <div className="hero-cta" style={{ marginTop: 28 }}>
          <button className="btn btn-primary" onClick={handleStartTrial}>
            {lang === 'es' ? 'Empezar prueba de 7 días' : 'Start 7-day free trial'}
            <span className="pip">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </span>
          </button>
          <button className="btn btn-glass" onClick={() => setIsDemoModalOpen(true)}>
            {lang === 'es' ? 'Agendar demostración' : 'Schedule walkthrough'}
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer>
        <div className="fcloud" style={{ top: 40, left: -50, width: 280, height: 110 }}></div>
        <div className="fcloud" style={{ top: 120, right: -40, width: 240, height: 100 }}></div>

        <div className="wrap">
          <div className="foot-cta">
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 12 }}>
              <img src="/marketing/wappy-cat-logo.png" alt="WAPPY Logo" style={{ height: 44, width: 44, objectFit: 'contain' }} />
              <span style={{ fontFamily: 'var(--display)', fontSize: 26, fontWeight: 800, color: 'var(--ink)' }}>WAPPY<span style={{ color: '#16a34a' }}>IA</span></span>
            </div>
            <h3 className="display">{lang === 'es' ? 'La seguridad de tu equipo es primero.' : 'Your team’s safety comes first.'}</h3>
            <p>
              {lang === 'es'
                ? 'Empieza hoy tu prueba gratis de 7 días. Sin tarjeta de crédito.'
                : 'Start your 7-day free trial today. No credit card required.'}
            </p>
            <div className="hero-cta" style={{ marginTop: 22 }}>
              <button className="btn btn-primary" onClick={handleStartTrial}>
                {lang === 'es' ? 'Empezar prueba gratis' : 'Start free trial'}
                <span className="pip">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </span>
              </button>
              <button type="button" className="btn btn-glass" onClick={handleLogin}>
                {isAuthenticated ? (lang === 'es' ? 'Ir al Chat' : 'Go to Chat') : (lang === 'es' ? 'Iniciar sesión' : 'Sign in')}
              </button>
            </div>
          </div>

          <div className="foot-top">
            <div className="foot-brand">
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
                <img src="/marketing/wappy-cat-logo.png" alt="WAPPY Logo" style={{ height: 36, width: 36, objectFit: 'contain' }} />
                <span style={{ fontFamily: 'var(--display)', fontSize: 21, fontWeight: 800, color: 'var(--ink)' }}>WAPPY<span style={{ color: '#16a34a' }}>IA</span></span>
              </div>
              <p>
                {lang === 'es'
                  ? 'El primer ecosistema de inteligencia artificial para el SG-SST en Colombia.'
                  : 'The first AI ecosystem for OHS management in Colombia.'}
              </p>
            </div>

            <div className="foot-cols">
              <div className="foot-col">
                <h4>{lang === 'es' ? 'Módulos' : 'Modules'}</h4>
                <a href="#tenshi">{lang === 'es' ? 'Tenshi IA' : 'Tenshi AI'}</a>
                <a href="#modulos">COPASST & Convivencia</a>
                <a href="#matrices">Matrices & Riesgos</a>
                <a href="#modulos">{lang === 'es' ? 'Matriz GTC 45' : 'GTC 45 Matrix'}</a>
                <a href="#modulos">{lang === 'es' ? 'Química SGA' : 'Chemical SGA'}</a>
              </div>
              <div className="foot-col">
                <h4>{lang === 'es' ? 'Soluciones' : 'Solutions'}</h4>
                <a href="#pricing">{lang === 'es' ? 'Para Consultores' : 'For Consultants'}</a>
                <a href="#pricing">{lang === 'es' ? 'Para Empresas' : 'For Enterprises'}</a>
                <a href="#pricing">{lang === 'es' ? 'Para ARLs y Grupos' : 'For ARLs'}</a>
                <a href="/blog">{lang === 'es' ? 'Blog Normativo' : 'Blog'}</a>
              </div>
              <div className="foot-col">
                <h4>{lang === 'es' ? 'Recursos' : 'Resources'}</h4>
                <a href="#faq">{lang === 'es' ? 'Centro de Ayuda' : 'Help Center'}</a>
                <a href="#modulos">{lang === 'es' ? 'Academia LMS' : 'LMS Academy'}</a>
                <a href="/c/new">{lang === 'es' ? 'Plataforma Web' : 'Web App'}</a>
                <a href="#pricing">{lang === 'es' ? 'Precios' : 'Pricing'}</a>
              </div>
              <div className="foot-col">
                <h4>Legal</h4>
                <a href="/terms">{lang === 'es' ? 'Términos del Servicio' : 'Terms'}</a>
                <a href="/privacy-policy">{lang === 'es' ? 'Política de Privacidad' : 'Privacy'}</a>
                <a href="/cookies">Cookies</a>
              </div>
            </div>
          </div>

          <div className="foot-word">WAPPY</div>

          <div className="foot-bottom">
            <span>© 2026 Wappy. {lang === 'es' ? 'Todos los derechos reservados. Desarrollado en Colombia.' : 'All rights reserved. Developed in Colombia.'}</span>
            <div className="foot-legal">
              <a href="/terms">{lang === 'es' ? 'Términos' : 'Terms'}</a>
              <a href="/privacy-policy">{lang === 'es' ? 'Privacidad' : 'Privacy'}</a>
              <a href="/cookies">Cookies</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Toast Notification */}
      <div className={`mkt-toast ${toastMessage ? 'show' : ''}`} role="status">
        {toastMessage}
      </div>

      {/* Demo Booking Modal */}
      <div className={`mkt-modal-scrim ${isDemoModalOpen ? 'show' : ''}`} aria-hidden={!isDemoModalOpen}>
        <div className="mkt-modal" role="dialog" aria-modal="true" aria-label="Demo WAPPY">
          <button className="mkt-modal-x" onClick={() => setIsDemoModalOpen(false)} aria-label="Close">
            ×
          </button>
          <span className="eyebrow">
            <span className="dot"></span>
            {lang === 'es' ? 'Agendar demostración' : 'Schedule walkthrough'}
          </span>
          <h3 className="display" style={{ fontSize: 28, margin: '14px 0 6px' }}>
            {lang === 'es' ? 'Mira WAPPY en vivo' : 'See WAPPY in action'}
          </h3>
          <p style={{ color: '#5a6470', fontSize: 14.5, margin: '0 0 20px', lineHeight: 1.5 }}>
            {lang === 'es'
              ? 'Te mostraremos cómo Tenshi orquesta tu empresa, genera actas de COPASST y audita matrices de riesgos.'
              : 'We will show you how Tenshi audits safety, generates committee minutes, and automates risk matrices.'}
          </p>

          <form onSubmit={handleDemoSubmit}>
            <input
              className="fld"
              type="text"
              placeholder={lang === 'es' ? 'Nombre completo' : 'Full name'}
              required
              value={demoName}
              onChange={(e) => setDemoName(e.target.value)}
            />
            <input
              className="fld"
              type="email"
              placeholder={lang === 'es' ? 'Email corporativo' : 'Work email'}
              required
              value={demoEmail}
              onChange={(e) => setDemoEmail(e.target.value)}
            />
            <input
              className="fld"
              type="text"
              placeholder={lang === 'es' ? 'Empresa u Organización' : 'Company or Organization'}
              value={demoCompany}
              onChange={(e) => setDemoCompany(e.target.value)}
            />
            <select
              className="fld"
              value={demoTeamSize}
              onChange={(e) => setDemoTeamSize(e.target.value)}
            >
              <option value="1–10">{lang === 'es' ? '1–10 trabajadores (Estándares Mínimos Básicos)' : '1–10 workers'}</option>
              <option value="11–50">{lang === 'es' ? '11–50 trabajadores (Riesgo I, II, III)' : '11–50 workers'}</option>
              <option value="50+">{lang === 'es' ? 'Más de 50 trabajadores (Todos los Estándares)' : '50+ workers'}</option>
              <option value="consultor">{lang === 'es' ? 'Soy Consultor / Asesor SST' : 'I am an OHS Consultant'}</option>
            </select>
            <button className="btn btn-primary" type="submit" style={{ width: '100%', justifyContent: 'center', marginTop: 6 }}>
              {lang === 'es' ? 'Solicitar demo personalizada' : 'Request personalized demo'}
              <span className="pip">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </span>
            </button>
          </form>
          <p style={{ fontSize: 12, color: '#5a6470', textAlign: 'center', margin: '14px 0 0' }}>
            {lang === 'es' ? 'O comienza una ' : 'Or start a '}
            <button
              type="button"
              className="legal-link"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              onClick={() => {
                setIsDemoModalOpen(false);
                handleStartTrial();
              }}
            >
              {lang === 'es' ? 'prueba gratis de 7 días' : '7-day free trial'}
            </button>.
          </p>
        </div>
      </div>

      {/* Plan Comparison Modal */}
      <div className={`mkt-modal-scrim ${isCompareModalOpen ? 'show' : ''}`} aria-hidden={!isCompareModalOpen}>
        <div className="mkt-modal mkt-cmp-modal" role="dialog" aria-modal="true" aria-label="Comparación de planes WAPPY">
          <button className="mkt-modal-x" onClick={() => setIsCompareModalOpen(false)} aria-label="Close">
            ×
          </button>
          <span className="eyebrow">
            <span className="dot"></span>
            {lang === 'es' ? 'Comparación de Planes' : 'Plan Comparison'}
          </span>
          <h3 className="display" style={{ fontSize: 26, margin: '14px 0 18px' }}>
            {lang === 'es' ? 'Módulos y funciones incluidas' : 'Modules and included features'}
          </h3>

          <div className="mkt-cmp-scroll">
            <table className="mkt-cmp-table">
              <thead>
                <tr>
                  <th>{lang === 'es' ? 'Módulo / Capacidad' : 'Module / Feature'}</th>
                  <th>Plan Plus<br /><span>$57.800/mes</span></th>
                  <th className="hl">Wappy Pro<br /><span>$114.330/mes</span></th>
                  <th>Wappy Vital<br /><span>$150.000 (Único)</span></th>
                </tr>
              </thead>
              <tbody>
                <tr className="grp">
                  <td colSpan={4}>Comités & Gestión Paritaria</td>
                </tr>
                <tr>
                  <td>{lang === 'es' ? 'COPASST (Votación QR & Actas)' : 'COPASST (QR & Minutes)'}</td>
                  <td><span className="cy">✓</span></td>
                  <td className="hl"><span className="cy">✓</span></td>
                  <td><span className="cy">✓</span></td>
                </tr>
                <tr>
                  <td>{lang === 'es' ? 'Comité de Convivencia Laboral (COCOLAB)' : 'Harassment Committee'}</td>
                  <td><span className="cn">–</span></td>
                  <td className="hl"><span className="cy">✓</span></td>
                  <td><span className="cy">✓</span></td>
                </tr>
                <tr>
                  <td>{lang === 'es' ? 'Brigada de Emergencias y simulacros' : 'Emergency Brigade'}</td>
                  <td><span className="cn">–</span></td>
                  <td className="hl"><span className="cy">✓</span></td>
                  <td><span className="cy">✓</span></td>
                </tr>

                <tr className="grp">
                  <td colSpan={4}>Matrices Técnicas & Riesgos</td>
                </tr>
                <tr>
                  <td>{lang === 'es' ? 'Matriz de Riesgos GTC 45 (IPEVAR)' : 'GTC 45 Risk Matrix'}</td>
                  <td><span className="cy">✓</span></td>
                  <td className="hl"><span className="cy">✓</span></td>
                  <td><span className="cy">✓</span></td>
                </tr>
                <tr>
                  <td>{lang === 'es' ? 'Matriz Legal SST (Dec. 1072)' : 'Legal OHS Matrix'}</td>
                  <td><span className="cn">–</span></td>
                  <td className="hl"><span className="cy">✓</span></td>
                  <td><span className="cy">✓</span></td>
                </tr>
                <tr>
                  <td>{lang === 'es' ? 'Matriz Química SGA (Decreto 1496)' : 'Chemical SGA Matrix'}</td>
                  <td><span className="cn">–</span></td>
                  <td className="hl"><span className="cy">✓</span></td>
                  <td><span className="cy">✓</span></td>
                </tr>
                <tr>
                  <td>{lang === 'es' ? 'Autoevaluación Ergonómica Postural EPT' : 'Ergonomics EPT'}</td>
                  <td><span className="cn">–</span></td>
                  <td className="hl"><span className="cy">✓</span></td>
                  <td><span className="cy">✓</span></td>
                </tr>

                <tr className="grp">
                  <td colSpan={4}>Inteligencia Artificial Tenshi & Visión</td>
                </tr>
                <tr>
                  <td>{lang === 'es' ? 'Consultas legales normativas' : 'Regulatory legal inquiries'}</td>
                  <td><span className="cy">✓</span></td>
                  <td className="hl"><span className="cy">✓</span></td>
                  <td><span className="cy">✓</span></td>
                </tr>
                <tr>
                  <td>{lang === 'es' ? 'Análisis Biomecánico en Vivo con Visión IA' : 'Live Biomechanical Analysis'}</td>
                  <td><span className="cn">–</span></td>
                  <td className="hl"><span className="cy">✓</span></td>
                  <td><span className="cy">✓</span></td>
                </tr>
                <tr>
                  <td>{lang === 'es' ? 'Control de Interfaz y Diligenciamiento en Pantalla' : 'Page Controller Automation'}</td>
                  <td><span className="cn">–</span></td>
                  <td className="hl"><span className="cy">✓</span></td>
                  <td><span className="cn">–</span></td>
                </tr>

                <tr className="grp">
                  <td colSpan={4}>Canales & Formación</td>
                </tr>
                <tr>
                  <td>{lang === 'es' ? 'Portal Móvil PWA con Código QR' : 'PWA Mobile QR Portal'}</td>
                  <td><span className="cy">✓</span></td>
                  <td className="hl"><span className="cy">✓</span></td>
                  <td><span className="cy">✓</span></td>
                </tr>
                <tr>
                  <td>{lang === 'es' ? 'Academia LMS y certificados interactivos' : 'LMS Academy & interactive certs'}</td>
                  <td><span className="cy">✓</span></td>
                  <td className="hl"><span className="cy">✓</span></td>
                  <td><span className="cy">✓</span></td>
                </tr>
                <tr>
                  <td>{lang === 'es' ? 'Creación de Agentes de IA propios' : 'Custom AI Agent Builder'}</td>
                  <td><span className="cn">–</span></td>
                  <td className="hl"><span className="cy">✓</span></td>
                  <td><span className="cn">–</span></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
            <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', minWidth: 160 }} onClick={() => { setIsCompareModalOpen(false); handleStartTrial(); }}>
              {lang === 'es' ? 'Comenzar prueba gratis' : 'Start free trial'}
            </button>
            <button className="btn btn-glass" style={{ flex: 1, justifyContent: 'center', minWidth: 140, border: '1px solid #e7eaee' }} onClick={() => { setIsCompareModalOpen(false); setIsDemoModalOpen(true); }}>
              {lang === 'es' ? 'Agendar demostración' : 'Schedule walkthrough'}
            </button>
          </div>
        </div>
      </div>

      {/* PWA Installation Instructions Modal */}
      <div className={`mkt-modal-scrim ${isPwaModalOpen ? 'show' : ''}`} aria-hidden={!isPwaModalOpen}>
        <div className="mkt-modal" role="dialog" aria-modal="true" aria-label="Instalar WAPPY PWA">
          <button className="mkt-modal-x" onClick={() => setIsPwaModalOpen(false)} aria-label="Cerrar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <span style={{ fontSize: 36, display: 'inline-block', marginBottom: 8 }}>📲</span>
            <h3 style={{ fontFamily: 'var(--display)', fontSize: 22, fontWeight: 800, color: 'var(--ink)' }}>
              {lang === 'es' ? 'Instala WAPPY en tu celular o tablet' : 'Install WAPPY on your phone or tablet'}
            </h3>
            <p style={{ fontSize: 13.5, color: 'var(--muted)', marginTop: 6, lineHeight: 1.5 }}>
              {lang === 'es'
                ? 'WAPPY es una Aplicación Web Progresiva (PWA): ultraligera, siempre sincronizada y sin descargas pesadas desde tiendas.'
                : 'WAPPY is a Progressive Web App (PWA): ultra-lightweight, always in sync, without heavy app store downloads.'}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14, marginBottom: 22 }}>
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 14, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 14, color: '#0F172A', marginBottom: 8 }}>
                <span>🍏</span> iPhone & iPad (Safari)
              </div>
              <ol style={{ fontSize: 12.5, color: '#475569', lineHeight: 1.6, paddingLeft: 18, margin: 0 }}>
                <li>Abre WAPPY en <strong>Safari</strong>.</li>
                <li>Toca el botón <strong>Compartir</strong> (cuadro con flecha hacia arriba ⬆️).</li>
                <li>Baja y selecciona <strong>"Agregar a inicio"</strong> ➕.</li>
              </ol>
            </div>

            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 14, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 14, color: '#0F172A', marginBottom: 8 }}>
                <span>🤖</span> Android (Chrome)
              </div>
              <ol style={{ fontSize: 12.5, color: '#475569', lineHeight: 1.6, paddingLeft: 18, margin: 0 }}>
                <li>Abre WAPPY en <strong>Google Chrome</strong>.</li>
                <li>Toca el menú de <strong>tres puntos</strong> (⋮) arriba a la derecha.</li>
                <li>Selecciona <strong>"Instalar aplicación"</strong> o "Agregar a la pantalla principal" 📥.</li>
              </ol>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={() => setIsPwaModalOpen(false)}
          >
            {lang === 'es' ? '¡Entendido, gracias!' : 'Got it, thanks!'}
          </button>
        </div>
      </div>
    </div>
  );
}
