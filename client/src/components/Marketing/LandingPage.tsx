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
            aria-label="WAPPY IA - Ecosistema SST y PESV"
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
              <span className="mkt-logo-sub">SST & PESV</span>
            </div>
          </a>

          <div className="mkt-nav-links">
            <a href="#modulos" onClick={(e) => scrollToSection(e, 'modulos')} title="Somos SST: Estructura Integral">Somos SST</a>
            <a href="#tenshi" onClick={(e) => scrollToSection(e, 'tenshi')} title="Ecosistema de Agentes de IA Especializados">Agentes IA</a>
            <a href="#pesv" onClick={(e) => scrollToSection(e, 'pesv')} title="Matrices GTC 45 & Gestión de Riesgos">Matrices & Riesgos</a>
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
              <line x1="50%" y1="42%" x2="16%" y2="14%" className="connector-line" />
              <line x1="50%" y1="42%" x2="84%" y2="14%" className="connector-line" />
              <line x1="50%" y1="42%" x2="16%" y2="54%" className="connector-line" />
              <line x1="50%" y1="42%" x2="84%" y2="54%" className="connector-line" />
              <line x1="50%" y1="42%" x2="50%" y2="76%" className="connector-line" />
            </svg>

            {/* ⭐ CENTRO: METODOLOGÍA DEL BIOINDIVIDUO (Somos SST · Imagen 3) ⭐ */}
            <div className="float-center-bio" style={{ top: '42%', left: '50%', width: 285 }}>
              <div className="fcb-eyebrow">
                <span className="fcb-pulse-dot"></span>
                Somos SST · Bioindividuo
              </div>
              <div className="fcb-score">
                98.2% <span style={{ fontSize: 24, fontWeight: 800 }}>FIT</span>
              </div>
              <div className="fcb-bars">
                <span className="fcb-bar"></span>
                <span className="fcb-bar"></span>
                <span className="fcb-bar"></span>
              </div>
              <div className="fcb-tag">
                ENFOQUE BIOCÉNTRICO INTEGRAL
              </div>
              <div className="fcb-sub">
                Salud, Aptitud & Bienestar al Centro
              </div>
            </div>

            {/* Satellite 1 (Top-Left): Gamificación & Votaciones COPASST */}
            <div className="float-card-v2" style={{ top: 8, left: '1.5%', width: 330 }}>
              <div className="fcv2-header">
                <div className="fcv2-icon" style={{ background: '#FEF3C7', color: '#B45309' }}>
                  🗳️
                </div>
                <div className="fcv2-titles">
                  <div className="fcv2-title">Gamificación & Comités</div>
                  <div className="fcv2-subtitle">COPASST · Convivencia</div>
                </div>
                <div className="fcv2-badge" style={{ background: '#FEF08A', color: '#854D0E' }}>
                  PARTICIPATIVO
                </div>
              </div>
              <div className="fcv2-body" style={{ background: '#FEF9C3', color: '#713F12' }}>
                Votación digital interactiva con QR: 48 colaboradores participaron en 15 min. Actas automatizadas sin papeleo.
              </div>
            </div>

            {/* Satellite 2 (Top-Right): Oráculo Predictivo H1 (Analítica Predictiva · Imagen 2) */}
            <div className="float-card-v2" style={{ top: 8, right: '1.5%', width: 335, animationDelay: '1.2s' }}>
              <div className="fcv2-header">
                <div className="fcv2-icon" style={{ background: '#C7F303', color: '#0E1300' }}>
                  🔮
                </div>
                <div className="fcv2-titles">
                  <div className="fcv2-title">Oráculo Predictivo H1</div>
                  <div className="fcv2-subtitle">analítica predictiva</div>
                </div>
                <div className="fcv2-badge" style={{ background: '#FEF08A', color: '#854D0E' }}>
                  EN VIVO
                </div>
              </div>
              <div className="fcv2-body" style={{ background: '#C7F303', color: '#0E1300' }}>
                Dictamen predictivo H1: Detección temprana de sobrecarga postural. Plan PAC generado antes de ausentismo 💚
              </div>
            </div>

            {/* Satellite 3 (Bottom-Left): Análisis en Vivo · Visión por Cámara */}
            <div className="float-card-v2" style={{ top: 265, left: '1.5%', width: 330, animationDelay: '2.1s' }}>
              <div className="fcv2-header">
                <div className="fcv2-icon" style={{ background: '#EFF6FF', color: '#2563EB' }}>
                  📹
                </div>
                <div className="fcv2-titles">
                  <div className="fcv2-title">Análisis en Vivo · Visión IA</div>
                  <div className="fcv2-subtitle">Monitoreo Ergonómico</div>
                </div>
                <div className="fcv2-badge" style={{ background: '#CFFAFE', color: '#0E7490' }}>
                  TIEMPO REAL
                </div>
              </div>
              <div className="fcv2-body" style={{ background: '#ECFEFF', color: '#155E75' }}>
                Cámara inteligente en puesto de trabajo: alerta temprana de fatiga biomecánica y recomendación de pausa activa en pantalla.
              </div>
            </div>

            {/* Satellite 4 (Bottom-Right): Academia LMS & Centro Educativo */}
            <div className="float-card-v2" style={{ top: 265, right: '1.5%', width: 335, animationDelay: '1.8s' }}>
              <div className="fcv2-header">
                <div className="fcv2-icon" style={{ background: '#DCFCE7', color: '#15803D' }}>
                  🎓
                </div>
                <div className="fcv2-titles">
                  <div className="fcv2-title">Academia LMS & Quizzes</div>
                  <div className="fcv2-subtitle">Centro Educativo · Blog</div>
                </div>
                <div className="fcv2-badge" style={{ background: '#DCFCE7', color: '#15803D' }}>
                  CERTIFICADO ✓
                </div>
              </div>
              <div className="fcv2-body" style={{ background: '#F0FDF4', color: '#166534' }}>
                Formación continua con micro-lecciones interactivas: 96% de aprobación en prevención y expedición de carnets digitales.
              </div>
            </div>

            {/* Satellite 5 (Bottom-Center): Google Drive & Registros Nube */}
            <div className="float-card-v2 center-bottom" style={{ top: 435, left: '50%', width: 370, animationDelay: '2.5s' }}>
              <div className="fcv2-header">
                <div className="fcv2-icon" style={{ background: '#E0F2FE', color: '#0284C7' }}>
                  ☁️
                </div>
                <div className="fcv2-titles">
                  <div className="fcv2-title">Google Drive Sync</div>
                  <div className="fcv2-subtitle">Nube & Registros Centralizados</div>
                </div>
                <div className="fcv2-badge" style={{ background: '#E0E7FF', color: '#3730A3' }}>
                  SINCRONIZADO
                </div>
              </div>
              <div className="fcv2-body" style={{ background: '#EFF6FF', color: '#1D4ED8' }}>
                Actas firmadas, matriz GTC 45 y perfiles biocéntricos respaldados automáticamente en la nube corporativa de tu empresa.
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Bento Grid: Gestión SST que escala contigo */}
      <section id="modulos" className="band">
        <div className="wrap">
          <div className="sec-head">
            <span className="eyebrow">
              <span className="dot"></span>
              {lang === 'es' ? 'Módulos Especializados' : 'Specialized Modules'}
            </span>
            <h2 className="display">
              {lang === 'es' ? 'Gestión SST & PESV que escala con tu empresa' : 'OHS & Road Safety that scales with you'}
            </h2>
            <p>
              {lang === 'es'
                ? 'Conecta cada proceso de seguridad laboral y vial en una sola suite colaborativa.'
                : 'Connect every safety and compliance workflow in a unified collaborative suite.'}
            </p>
          </div>

          <div className="bento">
            <div className="cell big">
              <div>
                <div style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '.06em', opacity: 0.5 }}>
                  {lang === 'es' ? 'Ecosistema Integral' : 'Integrated Ecosystem'}
                </div>
                <div className="display" style={{ fontSize: 28, marginTop: 8, lineHeight: 1.1 }}>
                  {lang === 'es'
                    ? 'Todo lo que exige el Decreto 1072 y la Res. 0312, automatizado.'
                    : 'Everything required by Colombian Decree 1072 and Res. 0312, automated.'}
                </div>
              </div>

              <div className="chan-cards">
                <div className="chan-card">
                  <span className="cdot" style={{ background: '#25D366' }}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="#fff">
                      <path d="M12 2a10 10 0 0 0-8.5 15.3L2 22l4.8-1.5A10 10 0 1 0 12 2zm0 18a8 8 0 0 1-4.3-1.2l-.3-.2-2.9.9.9-2.8-.2-.3A8 8 0 1 1 12 20z"></path>
                    </svg>
                  </span>
                  <div>
                    <div className="cn">COPASST & Convivencia</div>
                    <div className="cs">{lang === 'es' ? 'Votación QR & Actas' : 'QR Voting & Minutes'}</div>
                  </div>
                </div>

                <div className="chan-card">
                  <span className="cdot" style={{ background: '#0A7CFF' }}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="#fff">
                      <path d="M18.9 8.5c-.8.5-1.3 1.4-1.3 2.4 0 1.2.7 2.2 1.7 2.6-.2.6-.5 1.3-.9 1.9-.6.9-1.2 1.8-2.1 1.8-.9 0-1.2-.5-2.2-.5s-1.4.5-2.2.5c-.9 0-1.6-1-2.2-1.9-1.3-1.9-2.3-5.3-1-7.6.7-1.2 1.8-1.9 3-1.9.9 0 1.7.6 2.2.6.5 0 1.5-.7 2.6-.6.5 0 1.8.2 2.7 1.2z"></path>
                    </svg>
                  </span>
                  <div>
                    <div className="cn">PESV Vial (Res. 40595)</div>
                    <div className="cs">{lang === 'es' ? 'Flota & Preoperacional' : 'Fleet & Pre-trip'}</div>
                  </div>
                </div>

                <div className="chan-card">
                  <span className="cdot" style={{ background: '#E1306C' }}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="5"></rect>
                      <circle cx="12" cy="12" r="4"></circle>
                      <circle cx="17.5" cy="6.5" r="1" fill="#fff"></circle>
                    </svg>
                  </span>
                  <div>
                    <div className="cn">Matriz GTC 45</div>
                    <div className="cs">{lang === 'es' ? 'Peligros & Controles' : 'Hazards & Controls'}</div>
                  </div>
                </div>

                <div className="chan-card">
                  <span className="cdot" style={{ background: '#5B6B7B' }}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                      <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                      <path d="m2 7 10 6 10-6"></path>
                    </svg>
                  </span>
                  <div>
                    <div className="cn">Matriz Química SGA</div>
                    <div className="cs">{lang === 'es' ? 'ONU & Almacenamiento' : 'UN & Storage'}</div>
                  </div>
                </div>

                <div className="chan-card">
                  <span className="cdot" style={{ background: '#C7F303' }}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="2">
                      <path d="M21 12a9 9 0 0 1-9 9 9 9 0 0 1 0-18 9 9 0 0 1 9 9z"></path>
                      <path d="M3.6 9h16.8M3.6 15h16.8M12 3a15 15 0 0 1 0 18"></path>
                    </svg>
                  </span>
                  <div>
                    <div className="cn">Academia LMS & Quizzes</div>
                    <div className="cs">{lang === 'es' ? 'Carnets & Certificados' : 'Badges & Certificates'}</div>
                  </div>
                </div>

                <div className="chan-card" style={{ alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>
                    {lang === 'es' ? '+ Ergo EPT & Auditoría' : '+ Ergonomics & Audits'}
                  </span>
                </div>
              </div>
            </div>

            <div className="cell lime">
              <div className="stat-n">90%</div>
              <div className="stat-l">{lang === 'es' ? 'Menos tiempo redactando actas y matrices' : 'Less time drafting minutes and matrices'}</div>
            </div>

            <div className="cell">
              <div className="stat-n">60+</div>
              <div className="stat-l">{lang === 'es' ? 'Estándares auditados (Res. 0312)' : 'Standards audited (Res. 0312)'}</div>
            </div>

            <div className="cell">
              <div className="stat-n">12+</div>
              <div className="stat-l">{lang === 'es' ? 'Agentes especializados SST entrenados' : 'Trained specialized OHS AI agents'}</div>
            </div>

            <div className="cell">
              <div className="stat-n">100%</div>
              <div className="stat-l">{lang === 'es' ? 'Conforme a normativa colombiana' : 'Compliant with Colombian law'}</div>
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
                {lang === 'es' ? 'Comités & Actas Digitales' : 'Committees & Digital Minutes'}
              </span>
              <h3>{lang === 'es' ? 'COPASST y Convivencia sin papeleo ni fricciones.' : 'Safety committees without paperwork or friction.'}</h3>
              <p>
                {lang === 'es'
                  ? 'Elecciones con código QR, votación secreta con verificación de cédula, quórum automático y actas ejecutivas firmadas digitalmente en minutos.'
                  : 'QR code elections, private voting verified by worker ID, automatic quorum checks, and digital legally compliant minutes in minutes.'}
              </p>
              <ul className="feat-list">
                <li>
                  <span className="ck">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  {lang === 'es' ? 'Autocompletado de candidatos desde la nómina' : 'Candidate autocomplete from employee database'}
                </li>
                <li>
                  <span className="ck">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  {lang === 'es' ? 'Escrutinio con porcentaje de participación en vivo' : 'Live participation percentage and ballot tally'}
                </li>
                <li>
                  <span className="ck">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  {lang === 'es' ? 'Exportación a PDF y Word con validez legal' : 'Legally valid PDF and Word exports'}
                </li>
              </ul>
            </div>

            <div className="feat-art tint-sky">
              <div style={{ width: '100%', maxWidth: 360, background: '#fff', borderRadius: 18, boxShadow: '0 16px 40px rgba(20,40,80,0.14)', overflow: 'hidden' }}>
                <div style={{ padding: '14px 16px', borderBottom: '1px solid #EEF0F3', fontWeight: 700, fontFamily: 'var(--display)' }}>
                  {lang === 'es' ? 'Panel de Comités (COPASST 2026)' : 'Committee Dashboard (COPASST 2026)'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '12px 16px', borderBottom: '1px solid #F2F3F5' }}>
                  <span style={{ width: 38, height: 38, borderRadius: 9999, background: '#E8EAFF', color: '#4852ED', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13 }}>
                    PR
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>Presidente COPASST</div>
                    <div style={{ fontSize: 12, color: '#9A9AA8' }}>Representante Empleador · {lang === 'es' ? 'Firmado' : 'Signed'}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '12px 16px', borderBottom: '1px solid #F2F3F5' }}>
                  <span style={{ width: 38, height: 38, borderRadius: 9999, background: '#D6F4DF', color: '#0A5818', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13 }}>
                    SC
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>Secretario del Comité</div>
                    <div style={{ fontSize: 12, color: '#9A9AA8' }}>Representante Trabajadores · {lang === 'es' ? 'Firmado' : 'Signed'}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '12px 16px' }}>
                  <span style={{ width: 38, height: 38, borderRadius: 9999, background: '#FEF0DC', color: '#F09030', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13 }}>
                    QR
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>Acta Registrada con Token</div>
                    <div style={{ fontSize: 12, color: '#9A9AA8' }}>SHA-256 · {lang === 'es' ? 'Auditada' : 'Audited'}</div>
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
              <h3>{lang === 'es' ? 'Tu equipo de especialistas SST trabajando 24/7.' : 'Your team of OHS specialists working 24/7.'}</h3>
              <p>
                {lang === 'es'
                  ? 'Tenshi no es un simple chat: está conectado a tu base de datos de sedes, empleados y vehículos. Redacta informes ejecutivos, proyecta planes de trabajo y te alerta antes de una visita de la ARL o del MinTrabajo.'
                  : 'Tenshi is connected to your employee and facility records. It drafts management reports, schedules compliance milestones, and prepares you for audits.'}
              </p>
              <ul className="feat-list">
                <li>
                  <span className="ck">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  {lang === 'es' ? 'Diagnóstico en tiempo real de estándares mínimos' : 'Real-time diagnosis of legal safety standards'}
                </li>
                <li>
                  <span className="ck">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  {lang === 'es' ? 'Matriz GTC 45 con cálculo automático de deficiencia' : 'GTC 45 matrix with automated deficiency scores'}
                </li>
                <li>
                  <span className="ck">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  {lang === 'es' ? 'Respuestas citadas con normatividad vigente exacta' : 'Answers cited with exact Colombian legislation'}
                </li>
              </ul>
            </div>

            <div className="feat-art tint-lav">
              <div style={{ width: '100%', maxWidth: 340, background: '#fff', borderRadius: 18, boxShadow: '0 16px 40px rgba(20,40,80,0.14)', padding: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <span style={{ width: 28, height: 28, borderRadius: 8, background: '#C7F303', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="2">
                      <path d="M12 3l1.9 5.8a2 2 0 0 0 1.3 1.3L21 12l-5.8 1.9a2 2 0 0 0-1.3 1.3L12 21l-1.9-5.8a2 2 0 0 0-1.3-1.3L3 12l5.8-1.9a2 2 0 0 0 1.3-1.3z"></path>
                    </svg>
                  </span>
                  <span style={{ fontWeight: 700 }}>Tenshi IA</span>
                </div>
                <div style={{ background: '#F2F3F5', borderRadius: 12, padding: 12, fontSize: 13, lineHeight: 1.5, marginBottom: 12 }}>
                  {lang === 'es'
                    ? 'Revisé la matriz de riesgos de la Sede Principal. Detecté 2 peligros biológicos sin control de ingeniería y 1 extintor próximo a vencer el 15 de octubre.'
                    : 'Audited Main Facility risk matrix. Found 2 biological hazards lacking engineering controls and 1 fire extinguisher expiring October 15.'}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span style={{ flex: 1, height: 38, borderRadius: 9999, background: '#C7F303', color: '#0E1300', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>
                    {lang === 'es' ? 'Generar Plan de Acción' : 'Generate Action Plan'}
                  </span>
                  <span style={{ width: 38, height: 38, borderRadius: 9999, border: '1px solid #E7EAEE', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    ↻
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 3: PESV & Química */}
          <div id="pesv" className="feat">
            <div className="feat-copy">
              <span className="eyebrow">
                <span className="dot"></span>
                {lang === 'es' ? 'PESV Vial & Compatibilidad Química' : 'Road Safety PESV & Chemical SGA'}
              </span>
              <h3>{lang === 'es' ? 'Cálculos de riesgo exactos y normatividad blindada.' : 'Exact risk math and airtight compliance.'}</h3>
              <p>
                {lang === 'es'
                  ? 'Evalúa flotas de vehículos y rutas críticas con la metodología oficial del PESV (Res. 20223040040595) y organiza tu bodega de químicos con la matriz de compatibilidad SGA (Decreto 1496).'
                  : 'Evaluate vehicle fleets and critical routes with official road safety scoring (NP x NE x NC) and store chemicals safely using UN SGA compatibility matrices.'}
              </p>
              <ul className="feat-list">
                <li>
                  <span className="ck">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  {lang === 'es' ? 'Fórmula matemática NP × NE × NC para nivel de riesgo vial' : 'Official NP × NE × NC mathematical formula for road risk'}
                </li>
                <li>
                  <span className="ck">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  {lang === 'es' ? 'Matriz semaforizada verde/amarillo/rojo de sustancias químicas' : 'Color-coded chemical segregation matrix'}
                </li>
                <li>
                  <span className="ck">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  {lang === 'es' ? 'Autoevaluación postural ergonómica (EPT) guiada' : 'Guided ergonomic postural self-assessment (EPT)'}
                </li>
              </ul>
            </div>

            <div className="feat-art tint-mint">
              <div style={{ width: 290, background: 'linear-gradient(160deg, #C7F303, #A8D400)', borderRadius: 20, boxShadow: '0 16px 40px rgba(20,40,80,0.16)', padding: 18 }}>
                <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 20, color: '#0E1300' }}>
                  {lang === 'es' ? 'PESV Nivel Avanzado' : 'PESV Advanced Level'}
                </div>
                <div style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 13, color: 'rgba(14,19,0,0.6)', marginBottom: 12 }}>
                  Res. 20223040040595
                </div>
                <div style={{ background: '#fff', borderRadius: 14, padding: '12px 14px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0E1300' }}>24 Vehículos</div>
                    <div style={{ fontSize: 11, color: '#6A6A6E' }}>{lang === 'es' ? 'Preoperacionales al día' : 'Inspections up to date'}</div>
                  </div>
                  <span style={{ width: 28, height: 28, borderRadius: 9999, background: '#D6F4DF', color: '#0A5818', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12 }}>
                    ✓
                  </span>
                </div>
                <div style={{ background: '#fff', borderRadius: 14, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0E1300' }}>Riesgo Vial: Bajo</div>
                    <div style={{ fontSize: 11, color: '#6A6A6E' }}>NP 2 · NE 2 · NC 10 = NR 40</div>
                  </div>
                  <span style={{ width: 28, height: 28, borderRadius: 9999, background: '#C7F303', color: '#0E1300', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12 }}>
                    ★
                  </span>
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
            {lang === 'es' ? 'Reportes desde Campo y WhatsApp' : 'Field Reports & WhatsApp'}
          </span>
          <h2 className="display" style={{ fontSize: 'clamp(30px,4.6vw,48px)', margin: '14px 0 0' }}>
            {lang === 'es' ? 'Seguridad y Salud en tu bolsillo' : 'Safety and Health in your pocket'}
          </h2>
          <p style={{ fontSize: 17, color: 'rgba(14,19,0,0.62)', maxWidth: 520, margin: '14px auto 0' }}>
            {lang === 'es'
              ? 'Tus brigadistas, inspectores y trabajadores reportan actos inseguros, realizan preoperacionales de vehículos y consultan su carnet SST desde cualquier teléfono móvil.'
              : 'Inspectors, drivers, and workers log unsafe conditions, perform pre-trip inspections, and check training badges directly from mobile.'}
          </p>

          <div className="app-phones">
            {/* Phone 1: iOS Preoperacional */}
            <div className="phone-wrap">
              <div className="phone-label">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#0E1300">
                  <path d="M16 1.6c.06.9-.3 1.8-.86 2.43-.6.66-1.55 1.17-2.48 1.1-.07-.88.35-1.8.88-2.36C14.08 2.1 15.1 1.64 16 1.6zM18.9 8.5c-.8.5-1.3 1.4-1.3 2.4 0 1.2.7 2.2 1.7 2.6-.2.6-.5 1.3-.9 1.9-.6.9-1.2 1.8-2.1 1.8-.9 0-1.2-.5-2.2-.5s-1.4.5-2.2.5c-.9 0-1.6-1-2.2-1.9-1.3-1.9-2.3-5.3-1-7.6.7-1.2 1.8-1.9 3-1.9.9 0 1.7.6 2.2.6.5 0 1.5-.7 2.6-.6.5 0 1.8.2 2.7 1.2z"></path>
                </svg>
                WAPPY Móvil · Inspecciones
              </div>
              <div className="phone">
                <div className="phone-screen">
                  <div className="phone-notch">
                    <span></span>
                  </div>
                  <div style={{ padding: '6px 16px 10px', textAlign: 'left', background: '#fff' }}>
                    <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 22, color: '#0E1300' }}>
                      {lang === 'es' ? 'Inspecciones' : 'Inspections'}
                    </div>
                    <div style={{ display: 'flex', gap: 6, background: '#E9E9EE', borderRadius: 9, padding: 3, marginTop: 8 }}>
                      <span style={{ flex: 1, textAlign: 'center', fontSize: 11, fontWeight: 600, padding: '6px 0', background: '#fff', borderRadius: 7 }}>
                        {lang === 'es' ? 'Preoperacional' : 'Pre-trip'}
                      </span>
                      <span style={{ flex: 1, textAlign: 'center', fontSize: 11, color: '#6A6A6E', padding: '6px 0' }}>
                        {lang === 'es' ? 'Peligros' : 'Hazards'}
                      </span>
                    </div>
                  </div>

                  <div style={{ background: '#F2F3F7', padding: 6, textAlign: 'left' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, background: '#fff', borderRadius: 14, marginBottom: 6 }}>
                      <span style={{ width: 36, height: 36, borderRadius: 9999, background: '#D6F4DF', color: '#0A5818', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12 }}>
                        VH
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>Camión FTR Placa WPY-789</div>
                        <div style={{ fontSize: 11, color: '#9A9AA8' }}>Frenos, luces y llantas: 100% OK</div>
                        <span style={{ display: 'inline-block', marginTop: 3, fontSize: 9, fontWeight: 700, padding: '1px 7px', borderRadius: 9999, background: '#D6F4DF', color: '#0A5818' }}>
                          {lang === 'es' ? 'Aprobado' : 'Passed'}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, background: '#fff', borderRadius: 14, marginBottom: 6 }}>
                      <span style={{ width: 36, height: 36, borderRadius: 9999, background: '#FEF0DC', color: '#F09030', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12 }}>
                        EXT
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>Extintor Pasillo Bodega 3</div>
                        <div style={{ fontSize: 11, color: '#9A9AA8' }}>Manómetro en zona de recarga</div>
                        <span style={{ display: 'inline-block', marginTop: 3, fontSize: 9, fontWeight: 700, padding: '1px 7px', borderRadius: 9999, background: '#FEF0DC', color: '#F09030' }}>
                          {lang === 'es' ? 'Requiere Mantenimiento' : 'Needs Service'}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '8px 4px' }}>
                      <span style={{ height: 36, padding: '0 16px', borderRadius: 9999, background: '#C7F303', color: '#0E1300', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700 }}>
                        + Nueva Inspección
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Phone 2: Android Carnet SST */}
            <div className="phone-wrap">
              <div className="phone-label">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#0E1300">
                  <path d="M3.6 2.4 13 12 3.6 21.6c-.3-.3-.5-.7-.5-1.3V3.7c0-.6.2-1 .5-1.3zM14.3 13.3l2.5 2.5-9.6 5.5 7.1-8zM17.9 9.8l3 1.7c.9.5.9 1.5 0 2l-3 1.7-2.7-2.7 2.7-2.7zM7.2 2.7l9.6 5.5-2.5 2.5-7.1-8z"></path>
                </svg>
                Android · Carnet Digital SST
              </div>
              <div className="phone">
                <div className="phone-screen">
                  <div className="phone-notch">
                    <span style={{ width: 10, height: 10, borderRadius: 9999 }}></span>
                  </div>
                  <div style={{ background: 'linear-gradient(160deg, #5BB8F5, #86CCF6)', height: 54 }}></div>
                  <div style={{ padding: '14px 16px', textAlign: 'left', background: '#F2F3F7', marginTop: -30 }}>
                    <div style={{ textAlign: 'center', marginBottom: 12 }}>
                      <span style={{ width: 64, height: 64, borderRadius: 9999, background: '#C7F303', color: '#0E1300', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 20, border: '3px solid #F2F3F7' }}>
                        FB
                      </span>
                      <div style={{ fontSize: 16, fontWeight: 700, marginTop: 6 }}>Félix Bedoya</div>
                      <div style={{ fontSize: 11, color: '#9A9AA8' }}>Operario de Almacén · CC. 102045...</div>
                    </div>

                    <div style={{ fontSize: 10, fontWeight: 700, color: '#3B40B5', marginBottom: 6 }}>
                      ESTADO DE APTITUD MÉDICA
                    </div>
                    <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                      <span style={{ flex: 1, height: 34, borderRadius: 9999, background: '#E8EAFF', color: '#3B40B5', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, fontSize: 11, fontWeight: 700 }}>
                        <span style={{ width: 7, height: 7, borderRadius: 9999, background: '#1E8E3E' }}></span>
                        {lang === 'es' ? 'Apto sin restricciones' : 'Fit for duty'}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <div style={{ background: '#fff', borderRadius: 16, padding: 10 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#1E8E3E' }}>Alturas 50h</div>
                        <div style={{ fontSize: 10, color: '#9A9AA8' }}>Certificado Vigente</div>
                      </div>
                      <div style={{ background: '#fff', borderRadius: 16, padding: 10 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#4852ED' }}>COPASST</div>
                        <div style={{ fontSize: 10, color: '#9A9AA8' }}>Miembro Activo</div>
                      </div>
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

      {/* Integrations */}
      <section className="band">
        <div className="wrap">
          <div className="sec-head">
            <span className="eyebrow">
              <span className="dot"></span>
              {lang === 'es' ? 'Interoperabilidad & Conectividad' : 'Integrations & Interoperability'}
            </span>
            <h2 className="display">{lang === 'es' ? 'Conectado a tus herramientas empresariales' : 'Connected to your enterprise tools'}</h2>
            <p>
              {lang === 'es'
                ? 'WhatsApp Cloud API oficial, exportación a Excel y Word sin fórmulas rotas, Google Drive, OneDrive y bases de datos SQL.'
                : 'WhatsApp Cloud API, export to Excel and Word, cloud storage sync, and enterprise webhooks.'}
            </p>
          </div>

          <div className="intg">
            <div className="i">
              <span className="g" style={{ background: '#25D366' }}>
                <svg viewBox="0 0 24 24" fill="#fff">
                  <path d="M12 2a10 10 0 0 0-8.5 15.3L2 22l4.8-1.5A10 10 0 1 0 12 2zm0 18a8 8 0 0 1-4.3-1.2l-.3-.2-2.9.9.9-2.8-.2-.3A8 8 0 1 1 12 20z"></path>
                </svg>
              </span>
              WhatsApp API
            </div>

            <div className="i">
              <span className="g" style={{ background: '#107C41' }}>
                <svg viewBox="0 0 24 24" fill="#fff">
                  <path d="M21 2H3a1 1 0 0 0-1 1v18a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1zm-9 15.5H5.5v-2H12v2zm0-4.5H5.5v-2H12v2zm0-4.5H5.5v-2H12v2zm6.5 9H13.5v-11h5v11z"></path>
                </svg>
              </span>
              Excel Export
            </div>

            <div className="i">
              <span className="g" style={{ background: '#2B579A' }}>
                <svg viewBox="0 0 24 24" fill="#fff">
                  <path d="M21 2H3a1 1 0 0 0-1 1v18a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1zm-6.2 14.8-2.3-7.5h-1.6l-2.3 7.5h-1.8l-1.3-9.6h2.2l.8 6.4 2.1-6.4h1.7l2.1 6.4.8-6.4h2.2l-1.3 9.6h-1.2z"></path>
                </svg>
              </span>
              Word Docs
            </div>

            <div className="i">
              <span className="g" style={{ background: '#0F9D58' }}>
                <svg viewBox="0 0 24 24" fill="#fff">
                  <path d="M7.7 2h8.6l5.7 10-4.3 7.5-8.6-15zm-5.7 10 4.3-7.5 8.6 15H6.3L2 12zm13.4 7.5H6.8L11.1 12h8.6l-4.3 7.5z"></path>
                </svg>
              </span>
              Google Drive
            </div>

            <div className="i">
              <span className="g" style={{ background: '#0078D4' }}>
                <svg viewBox="0 0 24 24" fill="#fff">
                  <path d="M19.4 10.1C18.6 6.6 15.5 4 11.8 4 9.1 4 6.7 5.4 5.3 7.5 2.3 8 0 10.6 0 13.8c0 3.4 2.8 6.2 6.2 6.2h13.1c2.6 0 4.7-2.1 4.7-4.7 0-2.4-1.8-4.4-4.6-5.2z"></path>
                </svg>
              </span>
              OneDrive
            </div>

            <div className="i">
              <span className="g" style={{ background: '#336791' }}>
                <svg viewBox="0 0 24 24" fill="#fff">
                  <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm1 14.9V13h-2v3.9H9.5v-5.4h5v5.4H13zm2.5-7.4h-7V8h7v1.5z"></path>
                </svg>
              </span>
              PostgreSQL
            </div>

            <div className="i">
              <span className="g" style={{ background: '#181717' }}>
                <svg viewBox="0 0 24 24" fill="#fff">
                  <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.46-1.16-1.11-1.47-1.11-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.08 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.5 9.5 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.69-4.57 4.94.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2z"></path>
                </svg>
              </span>
              GitHub Sync
            </div>

            <div className="i">
              <span className="g" style={{ background: '#4A154B' }}>
                <svg viewBox="0 0 24 24" fill="#fff">
                  <path d="M5.04 15.17a2.52 2.52 0 1 1-2.52-2.52h2.52zM6.3 15.17a2.52 2.52 0 0 1 5.04 0v6.3a2.52 2.52 0 0 1-5.04 0z"></path>
                </svg>
              </span>
              Slack Alertas
            </div>

            <div className="i">
              <span className="g" style={{ background: '#E65100' }}>
                <svg viewBox="0 0 24 24" fill="#fff">
                  <path d="M3 11h8V3H3v8zm2-6h4v4H5V5zm8-2v8h8V3h-8zm6 6h-4V5h4v4zM3 21h8v-8H3v8zm2-6h4v4H5v-4zm13-2h-2v2h2v-2zm-4 4h2v2h-2v-2zm2 2h2v2h-2v-2zm2-2h2v2h-2v-2zm0 4h2v2h-2v-2zm-4 0h2v2h-2v-2z"></path>
                </svg>
              </span>
              Código QR
            </div>

            <div className="i">
              <span className="g" style={{ background: '#1976D2' }}>
                <svg viewBox="0 0 24 24" fill="#fff">
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"></path>
                </svg>
              </span>
              Firma Digital
            </div>

            <div className="i">
              <span className="g" style={{ background: '#5E35B1' }}>
                <svg viewBox="0 0 24 24" fill="#fff">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"></path>
                </svg>
              </span>
              MinTrabajo
            </div>

            <div className="i">
              <span className="g" style={{ background: '#0E1300' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#C7F303" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="8 7 3 12 8 17"></polyline>
                  <polyline points="16 7 21 12 16 17"></polyline>
                </svg>
              </span>
              Webhooks API
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
                  ? '“El módulo PESV nos permitió pasar la auditoría de la Superintendencia de Transporte con cero no conformidades. El cálculo automático NP+NE+NC es impecable.”'
                  : '“The road safety module helped us ace our transportation audit with zero non-conformities. Flawless mathematical risk scoring.”'}
              </p>
              <div className="who">
                <span className="av" style={{ background: '#D6F4DF', color: '#0A5818' }}>AR</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>Andrés Rentería</div>
                  <div style={{ fontSize: 12.5, color: '#9A9AA8' }}>Director de Flota y Logística</div>
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
                    ? 'Totalmente. WAPPY está programado y auditado con base en la Resolución 0312 de 2019 (Estándares Mínimos), Decreto 1072 de 2015 (SG-SST), Resolución 20223040040595 de 2022 (PESV), Decreto 1496 de 2018 (Sistema Globalmente Armonizado SGA) y la Guía Técnica Colombiana GTC 45.'
                    : 'Yes. WAPPY is modeled strictly on Colombian regulations: Decree 1072 of 2015, Res. 0312 of 2019, Res. 20223040040595 for Road Safety, and Decree 1496 for SGA.'}
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
                    ? 'Tenshi no es un chatbot desconectado: es un orquestador inteligente conectado directamente a la base de datos de tu empresa. Conoce a tus empleados, cargos, sedes, vehículos y expedientes históricos, y está entrenado para redactar actas legales, auditar porcentajes de cumplimiento y generar informes gerenciales con citas exactas a la ley.'
                    : 'Tenshi is connected directly to your enterprise database. It knows your employees, roles, facilities, and fleet history, and produces legally valid documents with exact statutory citations.'}
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
                    ? 'Sí. Todos los documentos generados en WAPPY (actas de COPASST, matriz de riesgos GTC 45, matriz PESV, actas de convivencia y carnets de capacitación) pueden exportarse con un clic en formatos editables de Excel y Word o descargarse en PDF listos para firmar con código QR.'
                    : 'Yes. All generated records (committee minutes, GTC 45 risk matrix, PESV, and training certificates) export with one click to editable Excel/Word and signed PDF files.'}
                </p>
              </div>
            </div>

            <div className={`qa ${openFaq === 3 ? 'open' : ''}`}>
              <button onClick={() => setOpenFaq(openFaq === 3 ? null : 3)} aria-expanded={openFaq === 3}>
                {lang === 'es' ? '¿Cómo funciona la integración con WhatsApp para reportes de trabajadores?' : 'How does the WhatsApp integration work for worker reports?'}
                <span className="q-ico">+</span>
              </button>
              <div className="a">
                <p>
                  {lang === 'es'
                    ? 'WAPPY se conecta a tu línea oficial de WhatsApp. Los trabajadores pueden enviar fotos de condiciones inseguras o realizar la inspección preoperacional de su vehículo chateando de forma natural. Tenshi procesa la información, clasifica el peligro y lo indexa automáticamente en la matriz correspondiente.'
                    : 'WAPPY integrates with official WhatsApp. Workers report unsafe conditions or pre-trip vehicle checks by messaging naturally; Tenshi indexes and routes the data into the safety matrices.'}
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
            {/* Starter: Consultor */}
            <div className="pcard">
              <div className="pn">{lang === 'es' ? 'Consultor SST' : 'OHS Consultant'}</div>
              <div className="pp">$29<span>{lang === 'es' ? '/mes' : '/mo'}</span></div>
              <div style={{ fontSize: 13, color: '#9A9AA8', marginBottom: 4 }}>
                {lang === 'es' ? 'Para profesionales y pymes (hasta 25 trab.)' : 'For independent consultants & small teams'}
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
                  {lang === 'es' ? '1 empresa y hasta 2 sedes' : '1 company and up to 2 locations'}
                </li>
                <li>
                  <span className="pck">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  {lang === 'es' ? 'Matriz de Riesgos GTC 45 completa' : 'Complete GTC 45 risk matrix'}
                </li>
                <li>
                  <span className="pck">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  {lang === 'es' ? 'Gestor de COPASST digital y actas' : 'Digital COPASST manager and minutes'}
                </li>
                <li>
                  <span className="pck">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  {lang === 'es' ? 'Tenshi IA para consultas normativas' : 'Tenshi AI for regulatory questions'}
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
              <button className="btn btn-glass btn-sm" style={{ marginTop: 'auto', justifyContent: 'center', border: '1px solid var(--line)' }} onClick={handleStartTrial}>
                {lang === 'es' ? 'Comenzar gratis' : 'Start free'}
              </button>
            </div>

            {/* Growth: Empresarial Pro */}
            <div className="pcard feat-plan">
              <span className="pbadge">{lang === 'es' ? 'Más popular' : 'Most Popular'}</span>
              <div className="pn">{lang === 'es' ? 'Empresarial Pro' : 'Enterprise Pro'}</div>
              <div className="pp">$99<span>{lang === 'es' ? '/mes' : '/mo'}</span></div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>
                {lang === 'es' ? 'Para empresas que gestionan SG-SST y PESV' : 'For companies managing OHS & Road Safety'}
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
                  <strong>{lang === 'es' ? 'Todo lo del plan Consultor, más:' : 'Everything in Consultant, plus:'}</strong>
                </li>
                <li>
                  <span className="pck">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  {lang === 'es' ? 'Módulo PESV completo (Res. 40595)' : 'Full Road Safety PESV module'}
                </li>
                <li>
                  <span className="pck">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  {lang === 'es' ? 'COPASST, Convivencia y Brigada con QR' : 'Safety, Harassment & Brigade with QR'}
                </li>
                <li>
                  <span className="pck">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  {lang === 'es' ? 'Matriz Química SGA & Almacenamiento' : 'Chemical SGA compatibility matrix'}
                </li>
                <li>
                  <span className="pck">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  {lang === 'es' ? 'Bot de WhatsApp para reportes de campo' : 'WhatsApp bot for field condition logs'}
                </li>
                <li>
                  <span className="pck">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  {lang === 'es' ? 'Academia LMS con carnets y certificados' : 'LMS Academy with badges and certs'}
                </li>
              </ul>
              <button className="btn btn-lime btn-sm" style={{ marginTop: 'auto', justifyContent: 'center' }} onClick={handleStartTrial}>
                {lang === 'es' ? 'Comenzar prueba gratis' : 'Start free trial'}
              </button>
            </div>

            {/* Scale: Corporativo */}
            <div className="pcard">
              <div className="pn">{lang === 'es' ? 'Corporativo / ARL' : 'Enterprise / ARL'}</div>
              <div className="pp">$249<span>{lang === 'es' ? '/mes' : '/mo'}</span></div>
              <div style={{ fontSize: 13, color: '#9A9AA8', marginBottom: 4 }}>
                {lang === 'es' ? 'Para firmas consultoras y grandes grupos' : 'For consulting firms & large conglomerates'}
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
                  <strong>{lang === 'es' ? 'Todo lo de Empresarial, más:' : 'Everything in Enterprise, plus:'}</strong>
                </li>
                <li>
                  <span className="pck">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  {lang === 'es' ? 'Multi-empresa y sedes ilimitadas' : 'Unlimited companies and branches'}
                </li>
                <li>
                  <span className="pck">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  {lang === 'es' ? 'Marca blanca con logo y dominio propio' : 'White-label with custom domain'}
                </li>
                <li>
                  <span className="pck">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  {lang === 'es' ? 'API abierta y sincronización con ARL' : 'Open API & ARL reporting pipeline'}
                </li>
                <li>
                  <span className="pck">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  {lang === 'es' ? 'Acompañamiento VIP en auditorías legales' : 'VIP legal audit advisory'}
                </li>
              </ul>
              <button className="btn btn-glass btn-sm" style={{ marginTop: 'auto', justifyContent: 'center', border: '1px solid var(--line)' }} onClick={handleStartTrial}>
                {lang === 'es' ? 'Hablar con ventas' : 'Contact sales'}
              </button>
            </div>
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
                  ? 'El primer ecosistema de inteligencia artificial para SG-SST y PESV en Colombia.'
                  : 'The first AI ecosystem for OHS and Road Safety in Colombia.'}
              </p>
            </div>

            <div className="foot-cols">
              <div className="foot-col">
                <h4>{lang === 'es' ? 'Módulos' : 'Modules'}</h4>
                <a href="#tenshi">{lang === 'es' ? 'Tenshi IA' : 'Tenshi AI'}</a>
                <a href="#modulos">COPASST & Convivencia</a>
                <a href="#pesv">PESV Res. 40595</a>
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
              ? 'Te mostraremos cómo Tenshi audita tu empresa, genera actas de COPASST y automatiza el PESV.'
              : 'We will show you how Tenshi audits safety, generates committee minutes, and automates road safety.'}
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
                  <th>Consultor<br /><span>$29/mes</span></th>
                  <th className="hl">Empresarial<br /><span>$99/mes</span></th>
                  <th>Corporativo<br /><span>$249/mes</span></th>
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
                  <td>{lang === 'es' ? 'Comité de Convivencia Laboral (RIT)' : 'Harassment Committee'}</td>
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
                  <td colSpan={4}>Seguridad Vial PESV & Matrices</td>
                </tr>
                <tr>
                  <td>{lang === 'es' ? 'Matriz de Riesgos GTC 45' : 'GTC 45 Risk Matrix'}</td>
                  <td><span className="cy">✓</span></td>
                  <td className="hl"><span className="cy">✓</span></td>
                  <td><span className="cy">✓</span></td>
                </tr>
                <tr>
                  <td>{lang === 'es' ? 'Plan Estratégico Vial (Res. 40595)' : 'Road Safety PESV'}</td>
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
                  <td colSpan={4}>Inteligencia Artificial Tenshi</td>
                </tr>
                <tr>
                  <td>{lang === 'es' ? 'Consultas legales normativas' : 'Regulatory legal inquiries'}</td>
                  <td><span className="cy">✓</span></td>
                  <td className="hl"><span className="cy">✓</span></td>
                  <td><span className="cy">✓</span></td>
                </tr>
                <tr>
                  <td>{lang === 'es' ? 'Acceso a base de datos empresarial' : 'Live database access'}</td>
                  <td><span className="cn">–</span></td>
                  <td className="hl"><span className="cy">✓</span></td>
                  <td><span className="cy">✓</span></td>
                </tr>
                <tr>
                  <td>{lang === 'es' ? 'Alertas de vencimientos y auditorías' : 'Expiration alerts & audits'}</td>
                  <td><span className="cn">–</span></td>
                  <td className="hl"><span className="cy">✓</span></td>
                  <td><span className="cy">✓</span></td>
                </tr>

                <tr className="grp">
                  <td colSpan={4}>Canales & Formación</td>
                </tr>
                <tr>
                  <td>{lang === 'es' ? 'Bot de WhatsApp para reportes' : 'WhatsApp Bot for reports'}</td>
                  <td><span className="cn">–</span></td>
                  <td className="hl"><span className="cy">✓</span></td>
                  <td><span className="cy">✓</span></td>
                </tr>
                <tr>
                  <td>{lang === 'es' ? 'Academia LMS y carnets digitales' : 'LMS Academy & digital badges'}</td>
                  <td><span className="cn">–</span></td>
                  <td className="hl"><span className="cy">✓</span></td>
                  <td><span className="cy">✓</span></td>
                </tr>
                <tr>
                  <td>{lang === 'es' ? 'Marca blanca y multi-empresa' : 'White-label & multi-company'}</td>
                  <td><span className="cn">–</span></td>
                  <td className="hl"><span className="cn">–</span></td>
                  <td><span className="cy">✓</span></td>
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
