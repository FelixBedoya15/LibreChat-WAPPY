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
  const [showVideo, setShowVideo] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Form states for Demo Modal
  const [demoName, setDemoName] = useState('');
  const [demoEmail, setDemoEmail] = useState('');
  const [demoPhone, setDemoPhone] = useState('');
  const [demoCompany, setDemoCompany] = useState('');
  const [demoArl, setDemoArl] = useState('');
  const [demoArlCustom, setDemoArlCustom] = useState('');
  const [demoTeamSize, setDemoTeamSize] = useState('1–10 trabajadores');
  const [isSubmittingDemo, setIsSubmittingDemo] = useState(false);

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

  // Lock background scrolling when mobile navigation menu or any modal is open
  useEffect(() => {
    if (isMobileMenuOpen || isDemoModalOpen || isCompareModalOpen || isPwaModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen, isDemoModalOpen, isCompareModalOpen, isPwaModalOpen]);

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
      navigate('/register');
    }
  };

  const handleLogin = () => {
    if (isAuthenticated) {
      navigate('/c/new');
    } else {
      navigate('/login');
    }
  };

  const handleDemoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingDemo(true);
    try {
      const selectedArl = demoArl === 'Otra' && demoArlCustom.trim()
        ? `Otra (${demoArlCustom.trim()})`
        : (demoArl || 'No especificada');

      await fetch('/api/contact/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: demoName,
          email: demoEmail,
          phone: demoPhone,
          company: demoCompany || 'No especificada',
          arl: selectedArl,
          plan: 'Solicitud Demo Personalizada WAPPY',
          message: `Solicitud de Demostración en vivo desde la Landing Page.\nEmpresa: ${demoCompany || 'No especificada'}\nARL: ${selectedArl}\nTeléfono/WhatsApp: ${demoPhone || 'No proporcionado'}\nTamaño de la empresa: ${demoTeamSize}\nFecha: ${new Date().toLocaleString('es-CO')}`,
        }),
      });

      setIsDemoModalOpen(false);
      showToast(
        lang === 'es'
          ? '✅ ¡Solicitud recibida! Tus datos fueron registrados y un especialista SST te contactará hoy mismo.'
          : '✅ Demo request received! An SST specialist will contact you today.'
      );
      setDemoName('');
      setDemoEmail('');
      setDemoPhone('');
      setDemoCompany('');
      setDemoArl('');
      setDemoArlCustom('');
    } catch (err) {
      console.error('Error submitting demo lead:', err);
      setIsDemoModalOpen(false);
      showToast(
        lang === 'es'
          ? '✅ ¡Solicitud recibida! Nos pondremos en contacto contigo hoy mismo.'
          : '✅ Demo request noted! We will contact you today.'
      );
    } finally {
      setIsSubmittingDemo(false);
    }
  };

  const toggleVideo = () => {
    setShowVideo((prev) => !prev);
  };

  const resolveTargetElement = (targetId: string): HTMLElement | null => {
    return (
      document.getElementById(targetId) ||
      (targetId === 'modulos' ? document.getElementById('aplicativos') : null) ||
      (targetId === 'aplicativos' ? document.getElementById('modulos') : null) ||
      (targetId === 'tenshi' ? document.getElementById('agentes') : null) ||
      (targetId === 'agentes' ? document.getElementById('tenshi') : null) ||
      (targetId === 'vision' ? document.getElementById('movil') : null) ||
      (targetId === 'movil' ? document.getElementById('vision') : null) ||
      (targetId === 'pricing' ? document.getElementById('planes') : null) ||
      (targetId === 'planes' ? document.getElementById('pricing') : null)
    );
  };

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);
    const el = resolveTargetElement(targetId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      const navOffset = 90;
      const rect = el.getBoundingClientRect();
      const bodyTop = (document.body.scrollTop || 0) + rect.top - navOffset;
      const winTop = (window.pageYOffset || document.documentElement.scrollTop || 0) + rect.top - navOffset;
      if (document.body && document.body.scrollHeight > document.body.clientHeight) {
        document.body.scrollTo({ top: bodyTop, behavior: 'smooth' });
      }
      window.scrollTo({ top: winTop, behavior: 'smooth' });
      document.documentElement.scrollTo({ top: winTop, behavior: 'smooth' });
      try {
        window.history.pushState(null, '', `#${targetId}`);
      } catch (err) {
        // ignore
      }
    }
  };

  const navigateToSection = (targetId: string) => {
    setIsMobileMenuOpen(false);
    const el = resolveTargetElement(targetId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      const navOffset = 90;
      const rect = el.getBoundingClientRect();
      const bodyTop = (document.body.scrollTop || 0) + rect.top - navOffset;
      const winTop = (window.pageYOffset || document.documentElement.scrollTop || 0) + rect.top - navOffset;
      if (document.body && document.body.scrollHeight > document.body.clientHeight) {
        document.body.scrollTo({ top: bodyTop, behavior: 'smooth' });
      }
      window.scrollTo({ top: winTop, behavior: 'smooth' });
      document.documentElement.scrollTo({ top: winTop, behavior: 'smooth' });
      try {
        window.history.pushState(null, '', `#${targetId}`);
      } catch (err) {
        // ignore
      }
    }
  };

  return (
    <div className="mkt">
      {/* Mobile Menu Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="mkt-mobile-menu-backdrop"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Floating Capsule Navbar */}
      <nav className="mkt-nav" aria-label="Navegación principal">
        <div className={`mkt-nav-inner ${isScrolled ? 'scrolled' : ''}`}>
          <a
            className="mkt-nav-logo"
            aria-label="WAPPY IA - Ecosistema SG-SST Inteligente"
            href="/"
            onClick={(e) => {
              e.preventDefault();
              setIsMobileMenuOpen(false);
              document.body.scrollTo({ top: 0, behavior: 'smooth' });
              window.scrollTo({ top: 0, behavior: 'smooth' });
              document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
              try { window.history.pushState(null, '', '/'); } catch (err) {}
            }}
          >
            <img src="/marketing/wappy-cat-logo.png" alt="WAPPY Logo" className="mkt-logo-icon" />
            <div className="mkt-logo-text">
              <span className="mkt-logo-title">WAPPY<span>IA</span></span>
              <span className="mkt-logo-sub">SOMOS SST</span>
            </div>
          </a>

          <div className="mkt-nav-links">
            <a href="#modulos" onClick={(e) => scrollToSection(e, 'modulos')} title={lang === 'es' ? 'Módulos SST: Más de 30 Aplicativos Especializados' : 'OHS Modules & Apps'}>
              {lang === 'es' ? 'Módulos SST' : 'OHS Modules'}
            </a>
            <a href="#tenshi" onClick={(e) => scrollToSection(e, 'tenshi')} title={lang === 'es' ? 'Agentes IA: Tenshi y +20 Especialistas Autónomos en SST' : 'AI Agents & Tenshi'}>
              {lang === 'es' ? 'Agentes IA' : 'AI Agents'}
            </a>
            <a href="#matrices" onClick={(e) => scrollToSection(e, 'matrices')} title={lang === 'es' ? 'Matrices de Riesgos: GTC 45, Bio-IPEVR, PESV y SGA' : 'Risk Matrices'}>
              {lang === 'es' ? 'Matrices' : 'Matrices'}
            </a>
            <a href="#movil" onClick={(e) => scrollToSection(e, 'movil')} title={lang === 'es' ? 'Visión & PWA: App Móvil, Inspecciones y Modo Sin Conexión' : 'Vision & Mobile PWA'}>
              {lang === 'es' ? 'Visión & PWA' : 'Vision & PWA'}
            </a>
            <a href="#herramientas" onClick={(e) => scrollToSection(e, 'herramientas')} title={lang === 'es' ? 'Herramientas: 22 Integraciones Nativas y Conectores' : 'Tools & Connectors'}>
              {lang === 'es' ? 'Herramientas' : 'Tools'}
            </a>
            <a href="#pricing" onClick={(e) => scrollToSection(e, 'pricing')} title={lang === 'es' ? 'Planes Comerciales y Tarifas WAPPY Pro' : 'Pricing Plans'}>
              {lang === 'es' ? 'Planes' : 'Plans'}
            </a>
            <a href="#faq" onClick={(e) => scrollToSection(e, 'faq')} title={lang === 'es' ? 'Preguntas Frecuentes sobre WAPPY' : 'FAQ'}>
              FAQ
            </a>
          </div>

          <div className="mkt-nav-cta">
            <button type="button" className="btn btn-ghost mkt-nav-signin" onClick={handleLogin}>
              {lang === 'es' ? 'Ir a WAPPY' : 'Go to WAPPY'}
            </button>

            <button type="button" className="btn btn-lime btn-sm" onClick={() => setIsDemoModalOpen(true)}>
              {lang === 'es' ? 'Agendar demo' : 'Book a demo'}
            </button>

            {/* Mobile Hamburger Toggle Button */}
            <button
              type="button"
              className={`mkt-hamburger-btn ${isMobileMenuOpen ? 'active' : ''}`}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={isMobileMenuOpen}
            >
              <span className="mkt-hamburger-bar"></span>
              <span className="mkt-hamburger-bar"></span>
              <span className="mkt-hamburger-bar"></span>
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown Drawer */}
        {isMobileMenuOpen && (
          <div className="mkt-mobile-menu-drawer">
            <div className="mkt-mobile-menu-links">
              <button type="button" className="mkt-mobile-link" onClick={() => navigateToSection('modulos')}>
                <span className="mkt-mobile-link-icon">🚀</span>
                <div className="mkt-mobile-link-info">
                  <span className="mkt-mobile-link-title">{lang === 'es' ? 'Módulos SST' : 'OHS Modules'}</span>
                  <span className="mkt-mobile-link-desc">{lang === 'es' ? '30+ Aplicativos especializados en los 8 Hitos' : '30+ Apps across 8 management milestones'}</span>
                </div>
              </button>

              <button type="button" className="mkt-mobile-link" onClick={() => navigateToSection('tenshi')}>
                <span className="mkt-mobile-link-icon">🤖</span>
                <div className="mkt-mobile-link-info">
                  <span className="mkt-mobile-link-title">{lang === 'es' ? 'Agentes IA' : 'AI Agents'}</span>
                  <span className="mkt-mobile-link-desc">{lang === 'es' ? 'Tenshi y +20 especialistas autónomos en SST' : 'Tenshi & 20+ autonomous OHS specialists'}</span>
                </div>
              </button>

              <button type="button" className="mkt-mobile-link" onClick={() => navigateToSection('matrices')}>
                <span className="mkt-mobile-link-icon">📊</span>
                <div className="mkt-mobile-link-info">
                  <span className="mkt-mobile-link-title">{lang === 'es' ? 'Matrices de Riesgos' : 'Risk Matrices'}</span>
                  <span className="mkt-mobile-link-desc">{lang === 'es' ? 'GTC 45, Bio-IPEVR, PESV y SGA Química' : 'GTC 45, Bio-IPEVR, PESV & GHS Chemical'}</span>
                </div>
              </button>

              <button type="button" className="mkt-mobile-link" onClick={() => navigateToSection('movil')}>
                <span className="mkt-mobile-link-icon">📱</span>
                <div className="mkt-mobile-link-info">
                  <span className="mkt-mobile-link-title">{lang === 'es' ? 'Visión & PWA' : 'Vision & PWA'}</span>
                  <span className="mkt-mobile-link-desc">{lang === 'es' ? 'App móvil offline y análisis postural en vivo' : 'Offline mobile app & live pose analysis'}</span>
                </div>
              </button>

              <button type="button" className="mkt-mobile-link" onClick={() => navigateToSection('herramientas')}>
                <span className="mkt-mobile-link-icon">🔌</span>
                <div className="mkt-mobile-link-info">
                  <span className="mkt-mobile-link-title">{lang === 'es' ? 'Herramientas' : 'Tools'}</span>
                  <span className="mkt-mobile-link-desc">{lang === 'es' ? '22 integraciones: Google, WhatsApp, n8n y más' : '22 native integrations: Google, WhatsApp, n8n'}</span>
                </div>
              </button>

              <button type="button" className="mkt-mobile-link" onClick={() => navigateToSection('pricing')}>
                <span className="mkt-mobile-link-icon">💳</span>
                <div className="mkt-mobile-link-info">
                  <span className="mkt-mobile-link-title">{lang === 'es' ? 'Planes' : 'Plans'}</span>
                  <span className="mkt-mobile-link-desc">{lang === 'es' ? 'Tarifas transparentes y prueba gratis de 7 días' : 'Transparent pricing with 7-day free trial'}</span>
                </div>
              </button>

              <button type="button" className="mkt-mobile-link" onClick={() => navigateToSection('faq')}>
                <span className="mkt-mobile-link-icon">❓</span>
                <div className="mkt-mobile-link-info">
                  <span className="mkt-mobile-link-title">{lang === 'es' ? 'FAQ' : 'FAQ'}</span>
                  <span className="mkt-mobile-link-desc">{lang === 'es' ? 'Normatividad colombiana, ARL y datos' : 'Compliance, data security, and support'}</span>
                </div>
              </button>
            </div>

            <div className="mkt-mobile-menu-divider"></div>

            {/* Language Selector */}
            <div className="mkt-mobile-lang-row">
              <span className="mkt-mobile-lang-label">{lang === 'es' ? 'Idioma:' : 'Language:'}</span>
              <div className="mkt-mobile-lang-btns">
                <button
                  type="button"
                  className={`mkt-mobile-lang-btn ${lang === 'es' ? 'active' : ''}`}
                  onClick={() => setLang('es')}
                >
                  🇨🇴 Español
                </button>
                <button
                  type="button"
                  className={`mkt-mobile-lang-btn ${lang === 'en' ? 'active' : ''}`}
                  onClick={() => setLang('en')}
                >
                  🇺🇸 English
                </button>
              </div>
            </div>

            {/* Mobile CTAs */}
            <div className="mkt-mobile-menu-actions">
              <button
                type="button"
                className="btn btn-outline-dark"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => { setIsMobileMenuOpen(false); handleLogin(); }}
              >
                {lang === 'es' ? 'Ir a WAPPY' : 'Go to WAPPY'}
              </button>

              <button
                type="button"
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => { setIsMobileMenuOpen(false); handleStartTrial(); }}
              >
                {lang === 'es' ? 'Comenzar prueba gratis de 7 días' : 'Start 7-day free trial'}
              </button>
            </div>
          </div>
        )}
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

          {/* Banner Prevencionista IA (Imagen 4) */}
          <div
            className="hero-ai-banner"
            style={{
              maxWidth: 780,
              margin: '20px auto 0',
              padding: '14px 22px',
              background: 'rgba(6, 17, 16, 0.90)',
              border: '1px dashed rgba(34, 197, 94, 0.45)',
              borderRadius: 20,
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              textAlign: 'left',
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.22)',
              position: 'relative',
              zIndex: 3,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: '#041214',
                border: '1px solid rgba(250, 204, 21, 0.35)',
                boxShadow: '0 0 16px rgba(250, 204, 21, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 22,
                flexShrink: 0,
              }}
            >
              💡
            </div>
            <div>
              <div style={{ fontSize: 15.5, fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.01em', lineHeight: 1.25 }}>
                {lang === 'es'
                  ? 'La IA no te reemplazará. El prevencionista que la use, sí.'
                  : 'AI will not replace you. The safety professional who uses it will.'}
              </div>
              <div style={{ fontSize: 12.5, color: 'rgba(255, 255, 255, 0.82)', marginTop: 4, lineHeight: 1.45 }}>
                {lang === 'es'
                  ? 'El mercado laboral recompensa a quienes optimizan procesos. Wappy te capacita y te da las herramientas para realizar el trabajo de una semana en solo unas horas.'
                  : 'The job market rewards those who optimize workflows. Wappy trains you and delivers the tools to accomplish a week’s work in just a few hours.'}
              </div>
            </div>
          </div>
        </div>

        {/* Floating Interactive Stage (Ecosistema Centrado en el Bioindividuo con estilo Imagen 2) */}
        <div className="wrap">
          <div className="hero-stage">
            {/* SVG Connecting Constellation Lines */}
            <svg className="hero-connectors" aria-hidden="true">
              <line x1="50%" y1="40%" x2="16%" y2="12%" className="connector-line" />
              <line x1="50%" y1="40%" x2="84%" y2="12%" className="connector-line" />
              <line x1="50%" y1="40%" x2="16%" y2="52%" className="connector-line" />
              <line x1="50%" y1="40%" x2="84%" y2="52%" className="connector-line" />
              <line x1="50%" y1="40%" x2="50%" y2="75%" className="connector-line" />
            </svg>

            {/* ⭐ CENTRO: EL COLABORADOR EN EL CORAZÓN DE LA ORGANIZACIÓN (Somos SST) - ESTÁTICO ⭐ */}
            <div className="float-center-bio">
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

            {/* Responsive Satellites Container */}
            <div className="hero-satellites">
              {/* Satellite 1 (Top-Left): Gamificación en SST */}
              <div className="float-card-v2 pos-top-left">
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
              <div className="float-card-v2 pos-top-right">
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
              <div className="float-card-v2 pos-bottom-left">
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
              <div className="float-card-v2 pos-bottom-right">
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
              <div className="float-card-v2 pos-bottom-center">
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
        </div>
      </header>

      {/* Bento Grid: Hito 2 · Huella Biocéntrica */}
      <section id="metodologia" className="band">
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
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 9999, background: '#10B981', display: 'inline-block' }}></span>
                    <div style={{ fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '.08em', color: '#10B981', fontWeight: 800 }}>
                      {lang === 'es' ? 'Hito 2 · Índice Biocéntrico Integral' : 'Milestone 2 · Biocentric Fit Index'}
                    </div>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 9999, background: 'rgba(16, 185, 129, 0.15)', color: '#34D399', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                    Cruce Algorítmico Activo
                  </span>
                </div>

                {/* Score Visual Banner (radial meter + worker profile) */}
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 18, background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 18, padding: '16px 20px', marginBottom: 16 }}>
                  {/* Gauge */}
                  <div style={{ position: 'relative', width: 84, height: 84, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg style={{ width: 84, height: 84, transform: 'rotate(-90deg)' }} viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="8" />
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#10B981" strokeWidth="8" strokeDasharray="251.2" strokeDashoffset="20" strokeLinecap="round" />
                    </svg>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                      <span style={{ fontSize: 20, fontWeight: 900, color: '#34D399', lineHeight: 1 }}>92%</span>
                      <span style={{ fontSize: 7.5, fontWeight: 800, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.05em' }}>FIT SCORE</span>
                      <span style={{ fontSize: 7, fontWeight: 900, background: '#10B981', color: '#062B16', padding: '1px 5px', borderRadius: 9999, marginTop: 2 }}>ÓPTIMO</span>
                    </div>
                  </div>

                  {/* Worker Context */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>
                      Carlos Mario Gómez
                    </div>
                    <div style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.75)', marginTop: 2 }}>
                      {lang === 'es' ? 'Cargo: Operario de Planta & Maquinaria' : 'Role: Plant & Machinery Operator'}
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.55)', marginTop: 4, lineHeight: 1.4 }}>
                      {lang === 'es'
                        ? 'Cruce analítico: Exigencias del Profesiograma (físicas, biomecánicas) vs. Concepto Médico Ocupacional (CIE-10).'
                        : 'Analytical cross: Job Demands vs. Occupational Medical Concepts (ICD-10).'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Real Audit Items (matching CondicionesSalud & BioFitAuditModal) */}
              <div style={{ marginTop: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.06em', color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981' }}></span>
                    {lang === 'es' ? 'Desglose de Auditoría Biocéntrica (Base 100%)' : 'Biocentric Audit Deductions (Base 100%)'}
                  </div>
                  <span style={{ fontSize: 9.5, fontWeight: 700, color: '#34D399', background: 'rgba(16, 185, 129, 0.15)', padding: '2px 8px', borderRadius: 9999 }}>
                    {lang === 'es' ? 'Score Final: 92% FIT' : 'Final Score: 92% FIT'}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {/* Item 1: Biomecánica Lumbar (-8 pts) */}
                  <div style={{ display: 'flex', alignItems: 'stretch', gap: 12, padding: '10px 14px', borderRadius: 14, background: 'rgba(245, 158, 11, 0.09)', border: '1px solid rgba(245, 158, 11, 0.28)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: 54, borderRight: '1px solid rgba(255,255,255,0.12)', paddingRight: 10 }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: 19, color: '#FBBF24', lineHeight: 1 }}>-8</span>
                      <span style={{ fontSize: 8, fontWeight: 800, textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>{lang === 'es' ? 'PUNTOS' : 'POINTS'}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 13 }}>⚠️</span>
                          <span style={{ fontSize: 12, fontWeight: 800, color: '#fff' }}>{lang === 'es' ? 'Biomecánica Lumbar (GTC 45)' : 'Lumbar Biomechanics (GTC 45)'}</span>
                        </div>
                        <span style={{ fontSize: 8.5, fontWeight: 800, padding: '2px 6px', borderRadius: 9999, background: 'rgba(245, 158, 11, 0.2)', color: '#FDE68A', textTransform: 'uppercase' }}>
                          {lang === 'es' ? 'Físico / Puesto' : 'Physical'}
                        </span>
                      </div>
                      <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.7)', lineHeight: 1.35 }}>
                        {lang === 'es' ? 'Alerta: flexión repetitiva de tronco > 20° en línea de empaque vs. antecedentes osteomusculares.' : 'Warning: repetitive trunk flexion > 20° in packing line vs musculoskeletal history.'}
                      </div>
                    </div>
                  </div>

                  {/* Item 2: Clínico / CIE-10 (0 pts - Aprobado) */}
                  <div style={{ display: 'flex', alignItems: 'stretch', gap: 12, padding: '10px 14px', borderRadius: 14, background: 'rgba(16, 185, 129, 0.09)', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: 54, borderRight: '1px solid rgba(255,255,255,0.12)', paddingRight: 10 }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: 19, color: '#34D399', lineHeight: 1 }}>0</span>
                      <span style={{ fontSize: 8, fontWeight: 800, textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>{lang === 'es' ? 'PUNTOS' : 'POINTS'}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 13 }}>🩺</span>
                          <span style={{ fontSize: 12, fontWeight: 800, color: '#fff' }}>{lang === 'es' ? 'Biometría & Concepto CIE-10' : 'Biometrics & ICD-10'}</span>
                        </div>
                        <span style={{ fontSize: 8.5, fontWeight: 800, padding: '2px 6px', borderRadius: 9999, background: 'rgba(16, 185, 129, 0.2)', color: '#A7F3D0', textTransform: 'uppercase' }}>
                          {lang === 'es' ? 'Clínico / Salud' : 'Clinical'}
                        </span>
                      </div>
                      <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.7)', lineHeight: 1.35 }}>
                        {lang === 'es' ? 'PA 120/80 mmHg · IMC 23.8 Normal · Examen ocupacional periódico sin patologías limitantes.' : 'BP 120/80 · Normal BMI · Clear periodic occupational medical exam.'}
                      </div>
                    </div>
                  </div>

                  {/* Item 3: Prescripción Readaptación Tenshi IA */}
                  <div style={{ display: 'flex', alignItems: 'stretch', gap: 12, padding: '10px 14px', borderRadius: 14, background: 'rgba(13, 148, 136, 0.12)', border: '1px solid rgba(13, 148, 136, 0.3)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: 54, borderRight: '1px solid rgba(255,255,255,0.12)', paddingRight: 10 }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: 13, color: '#2DD4BF', lineHeight: 1.1 }}>ACTIVO</span>
                      <span style={{ fontSize: 7.5, fontWeight: 800, textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>{lang === 'es' ? 'CONTROL' : 'CONTROL'}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 13 }}>⚡</span>
                          <span style={{ fontSize: 12, fontWeight: 800, color: '#fff' }}>{lang === 'es' ? 'Plan de Readaptación Ergonómica (Tenshi IA)' : 'Ergonomic Adaptation Plan (Tenshi AI)'}</span>
                        </div>
                        <span style={{ fontSize: 8.5, fontWeight: 800, padding: '2px 6px', borderRadius: 9999, background: 'rgba(45, 212, 191, 0.2)', color: '#99F6E4', textTransform: 'uppercase' }}>
                          {lang === 'es' ? 'Prescripción' : 'Prescription'}
                        </span>
                      </div>
                      <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.7)', lineHeight: 1.35 }}>
                        {lang === 'es' ? 'Pausas activas dirigidas cada 2 horas y ajuste de plano de mesa a 95 cm para mitigar la flexión.' : 'Targeted active micro-breaks every 2 hours and workbench height adjustment to 95 cm.'}
                      </div>
                    </div>
                  </div>

                  {/* Compliance footer */}
                  <div style={{ padding: '8px 12px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.22)', borderRadius: 10, textAlign: 'center', marginTop: 2 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#34D399' }}>
                      {lang === 'es' ? '✓ Dictamen Técnico: Aptitud Operativa Óptima con Controles Preventivos Activos' : '✓ Certified Fitness: Optimal Operative Fitness with Active Controls'}
                    </span>
                  </div>
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
                    ? 'Parametriza la ficha técnica del cargo: nivel de exigencia física, mental y operación de maquinaria. Asigna la matriz de EPP obligatorios, entrenamientos requeridos y almacena registros fotográficos y de video del puesto de trabajo.'
                    : 'Configures role technical sheets: physical and mental demands, machinery operation, required PPE, trainings, and stores photographic and video evidence of the workstation.'}
                </div>
              </div>
              <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid var(--line)', fontSize: 11, fontWeight: 700, color: '#0369A1' }}>
                ✓ {lang === 'es' ? 'Ficha técnica, EPP y evidencia en video' : 'Job demands, PPE & video records'}
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
                    Línea Base SST
                  </span>
                </div>
                <div style={{ fontSize: 17, fontWeight: 700, color: '#0F172A', lineHeight: 1.25, marginBottom: 8 }}>
                  {lang === 'es' ? 'Perfil Sociodemográfico' : 'Sociodemographic Profile'}
                </div>
                <div style={{ fontSize: 12.5, color: '#64748B', lineHeight: 1.5 }}>
                  {lang === 'es'
                    ? 'Caracterización integral de la población trabajadora: datos demográficos, hábitos de vida, afiliación a EPS/AFP, licencias de conducción (vigencia y categoría) y cursos de alturas. Permite importación masiva inteligente desde Excel.'
                    : 'Comprehensive workforce characterization: demographics, lifestyle habits, healthcare/pension affiliations, driver licenses, and work-at-height certifications. Smart Excel import enabled.'}
                </div>
              </div>
              <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid var(--line)', fontSize: 11, fontWeight: 700, color: '#B45309' }}>
                ✓ {lang === 'es' ? 'Población trabajadora e importación Excel' : 'Workforce baseline & Excel import'}
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
                    Monitoreo Clínico
                  </span>
                </div>
                <div style={{ fontSize: 17, fontWeight: 700, color: '#0F172A', lineHeight: 1.25, marginBottom: 8 }}>
                  {lang === 'es' ? 'Condiciones de Salud' : 'Health Baseline Reports'}
                </div>
                <div style={{ fontSize: 12.5, color: '#64748B', lineHeight: 1.5 }}>
                  {lang === 'es'
                    ? 'Consolida los conceptos médicos ocupacionales (ingreso, periódico y retiro) con diagnósticos CIE-10, recomendaciones y biomonitoreo de signos vitales (PA, IMC, limitaciones osteomusculares). Genera el cálculo del Índice Biocéntrico Integral.'
                    : 'Consolidates occupational medical concepts (entry, periodic, exit) with ICD-10 diagnoses, recommendations, and live vital sign biomonitoring (BP, BMI, musculoskeletal limits).'}
                </div>
              </div>
              <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid var(--line)', fontSize: 11, fontWeight: 700, color: '#15803D' }}>
                ✓ {lang === 'es' ? 'Conceptos CIE-10 y semáforo de restricciones' : 'ICD-10 concepts & medical restrictions'}
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
                    Acceso QR
                  </span>
                </div>
                <div style={{ fontSize: 17, fontWeight: 800, color: '#0E1300', lineHeight: 1.25, marginBottom: 8 }}>
                  {lang === 'es' ? 'Portal Móvil del Colaborador' : 'Mobile Worker Hub via QR'}
                </div>
                <div style={{ fontSize: 12.5, color: 'rgba(14, 19, 0, 0.72)', lineHeight: 1.5, fontWeight: 500 }}>
                  {lang === 'es'
                    ? 'El trabajador escanea el código QR de la empresa desde su celular y valida su identidad con su cédula. Puede actualizar su perfil sociodemográfico, votar en elecciones de comités, firmar actas digitalmente y reportar actos o condiciones inseguras con foto al instante.'
                    : 'Workers scan the company QR code on their smartphone and verify by ID. They can update profiles, cast secret committee votes, sign minutes, and report hazards with photos instantly.'}
                </div>
              </div>
              <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid rgba(14, 19, 0, 0.15)', fontSize: 11, fontWeight: 800, color: '#0E1300' }}>
                ⚡ {lang === 'es' ? 'Votación, firmas y auto-reporte sin claves' : 'Instant voting, signatures & hazard reporting'}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Hito 3 · Comités */}
      <section id="comites" className="band" style={{ paddingTop: 40 }}>
        <div className="wrap">
          <div className="sec-head">
            <span className="eyebrow">
              <span className="dot"></span>
              {lang === 'es' ? 'Hito 3 · Comités de Apoyo Organizacional' : 'Milestone 3 · Organizational Support Committees'}
            </span>
            <h2 className="display">
              {lang === 'es' ? 'COPASST, Convivencia y Brigadas sin Papeleo' : 'Safety Committees without Paperwork or Friction'}
            </h2>
            <p>
              {lang === 'es'
                ? 'Elecciones democráticas y secretas con código QR desde el celular, escrutinio automático en tiempo real, redacción de actas asistida por IA y firmas digitales de los integrantes con plena validez legal.'
                : 'Secret QR code elections, real-time vote tally, AI-drafted minutes, and legally valid digital signatures directly from mobile.'}
            </p>
          </div>

          {/* Feature 1: Comités */}
          <div className="feat">
            <div className="feat-copy">
              <span className="eyebrow">
                <span className="dot"></span>
                {lang === 'es' ? 'Votación Digital & Actas IA' : 'Digital Voting & AI Minutes'}
              </span>
              <h3>{lang === 'es' ? 'Elecciones democráticas y actas de posesión en minutos.' : 'Democratic elections and inauguration records in minutes.'}</h3>
              <p>
                {lang === 'es'
                  ? 'Garantiza la participación de todos los colaboradores con votación por QR desde cualquier smartphone, validación de cédula y escrutinio automático con plena validez legal.'
                  : 'Ensure team participation with QR voting from any mobile device, identity validation, and automatic possession records.'}
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
              <div style={{ width: '100%', maxWidth: 380, background: '#fff', borderRadius: 20, boxShadow: '0 16px 40px rgba(20,40,80,0.14)', overflow: 'hidden', border: '1px solid #E2E8F0' }}>
                <div style={{ padding: '14px 18px', borderBottom: '1px solid #EEF0F3', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontWeight: 800, fontSize: 13.5, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>🗳️</span> {lang === 'es' ? 'Urna Digital COPASST' : 'Digital Ballot Box COPASST'}
                  </div>
                  <span style={{ fontSize: 9.5, fontWeight: 800, padding: '2px 8px', borderRadius: 9999, background: '#DCFCE7', color: '#15803D', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#16A34A', display: 'inline-block' }}></span>
                    VOTO SECRETO
                  </span>
                </div>

                <div style={{ padding: '16px 18px' }}>
                  {/* QR & Mobile voting banner */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 14, padding: '12px 14px', marginBottom: 14 }}>
                    {/* Realistic, High-Resolution QR Vector Card with Corner Guides */}
                    <div style={{ position: 'relative', width: 72, height: 72, background: '#fff', borderRadius: 12, padding: 6, border: '1px solid #CBD5E1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 14px rgba(15,23,42,0.08)' }}>
                      {/* Corner Target Accents */}
                      <span style={{ position: 'absolute', top: 2, left: 2, width: 8, height: 8, borderTop: '2px solid #0D9488', borderLeft: '2px solid #0D9488', borderTopLeftRadius: 3 }}></span>
                      <span style={{ position: 'absolute', top: 2, right: 2, width: 8, height: 8, borderTop: '2px solid #0D9488', borderRight: '2px solid #0D9488', borderTopRightRadius: 3 }}></span>
                      <span style={{ position: 'absolute', bottom: 2, left: 2, width: 8, height: 8, borderBottom: '2px solid #0D9488', borderLeft: '2px solid #0D9488', borderBottomLeftRadius: 3 }}></span>
                      <span style={{ position: 'absolute', bottom: 2, right: 2, width: 8, height: 8, borderBottom: '2px solid #0D9488', borderRight: '2px solid #0D9488', borderBottomRightRadius: 3 }}></span>

                      <svg width="58" height="58" viewBox="0 0 100 100" fill="none">
                        {/* Finder Top-Left */}
                        <rect x="4" y="4" width="28" height="28" rx="5" fill="#0F172A" />
                        <rect x="9" y="9" width="18" height="18" rx="3" fill="#fff" />
                        <rect x="13" y="13" width="10" height="10" rx="2" fill="#0D9488" />

                        {/* Finder Top-Right */}
                        <rect x="68" y="4" width="28" height="28" rx="5" fill="#0F172A" />
                        <rect x="73" y="9" width="18" height="18" rx="3" fill="#fff" />
                        <rect x="77" y="13" width="10" height="10" rx="2" fill="#0D9488" />

                        {/* Finder Bottom-Left */}
                        <rect x="4" y="68" width="28" height="28" rx="5" fill="#0F172A" />
                        <rect x="9" y="73" width="18" height="18" rx="3" fill="#fff" />
                        <rect x="13" y="77" width="10" height="10" rx="2" fill="#0D9488" />

                        {/* Alignment Pattern Bottom-Right */}
                        <rect x="68" y="68" width="20" height="20" rx="4" fill="#0F172A" />
                        <rect x="72" y="72" width="12" height="12" rx="2" fill="#fff" />
                        <rect x="75" y="75" width="6" height="6" rx="1.5" fill="#0D9488" />

                        {/* Timing Lines & Authentic Data Grid Modules */}
                        <rect x="36" y="6" width="5" height="5" rx="1" fill="#0F172A" />
                        <rect x="44" y="6" width="5" height="5" rx="1" fill="#0F172A" />
                        <rect x="52" y="6" width="5" height="5" rx="1" fill="#0F172A" />
                        <rect x="60" y="6" width="5" height="5" rx="1" fill="#0F172A" />

                        <rect x="36" y="14" width="5" height="5" rx="1" fill="#0F172A" />
                        <rect x="48" y="14" width="5" height="5" rx="1" fill="#0D9488" />
                        <rect x="56" y="14" width="5" height="5" rx="1" fill="#0F172A" />

                        <rect x="36" y="22" width="5" height="5" rx="1" fill="#0F172A" />
                        <rect x="44" y="22" width="5" height="5" rx="1" fill="#0F172A" />
                        <rect x="60" y="22" width="5" height="5" rx="1" fill="#0F172A" />

                        {/* Middle horizontal band */}
                        <rect x="6" y="36" width="5" height="5" rx="1" fill="#0F172A" />
                        <rect x="14" y="36" width="5" height="5" rx="1" fill="#0F172A" />
                        <rect x="22" y="36" width="5" height="5" rx="1" fill="#0F172A" />
                        <rect x="36" y="36" width="5" height="5" rx="1" fill="#0F172A" />
                        <rect x="44" y="36" width="13" height="5" rx="1" fill="#0F172A" />
                        <rect x="68" y="36" width="5" height="5" rx="1" fill="#0F172A" />
                        <rect x="76" y="36" width="5" height="5" rx="1" fill="#0F172A" />
                        <rect x="88" y="36" width="5" height="5" rx="1" fill="#0F172A" />

                        <rect x="6" y="44" width="5" height="5" rx="1" fill="#0F172A" />
                        <rect x="18" y="44" width="5" height="5" rx="1" fill="#0D9488" />
                        <rect x="26" y="44" width="5" height="5" rx="1" fill="#0F172A" />
                        <rect x="36" y="44" width="5" height="5" rx="1" fill="#0F172A" />
                        <rect x="48" y="44" width="5" height="5" rx="1" fill="#0F172A" />
                        <rect x="60" y="44" width="5" height="5" rx="1" fill="#0F172A" />
                        <rect x="72" y="44" width="5" height="5" rx="1" fill="#0F172A" />
                        <rect x="84" y="44" width="8" height="5" rx="1" fill="#0F172A" />

                        <rect x="6" y="52" width="5" height="5" rx="1" fill="#0F172A" />
                        <rect x="14" y="52" width="5" height="5" rx="1" fill="#0F172A" />
                        <rect x="22" y="52" width="5" height="5" rx="1" fill="#0F172A" />
                        <rect x="36" y="52" width="13" height="5" rx="1" fill="#0F172A" />
                        <rect x="56" y="52" width="5" height="5" rx="1" fill="#0D9488" />
                        <rect x="68" y="52" width="5" height="5" rx="1" fill="#0F172A" />
                        <rect x="80" y="52" width="5" height="5" rx="1" fill="#0F172A" />

                        {/* Bottom right data blocks */}
                        <rect x="36" y="68" width="5" height="5" rx="1" fill="#0F172A" />
                        <rect x="44" y="68" width="5" height="5" rx="1" fill="#0F172A" />
                        <rect x="52" y="68" width="8" height="5" rx="1" fill="#0F172A" />

                        <rect x="36" y="76" width="5" height="5" rx="1" fill="#0D9488" />
                        <rect x="48" y="76" width="5" height="5" rx="1" fill="#0F172A" />
                        <rect x="56" y="76" width="5" height="5" rx="1" fill="#0F172A" />

                        <rect x="36" y="84" width="13" height="5" rx="1" fill="#0F172A" />
                        <rect x="56" y="84" width="5" height="5" rx="1" fill="#0F172A" />
                      </svg>
                    </div>
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 800, color: '#0F172A' }}>
                        {lang === 'es' ? 'Escanea para sufragar' : 'Scan to cast secret ballot'}
                      </div>
                      <div style={{ fontSize: 10.5, color: '#64748B', lineHeight: 1.35, marginTop: 2 }}>
                        {lang === 'es' ? 'Voto anónimo y directo desde el smartphone validado por cédula (Res. 2013/86).' : 'Anonymous mobile voting verified by worker ID (Res. 2013/86).'}
                      </div>
                    </div>
                  </div>

                  {/* Quorum & Live Count */}
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                      <span>{lang === 'es' ? 'Quórum electoral en vivo:' : 'Live voting quorum:'}</span>
                      <span style={{ color: '#0D9488', fontWeight: 800 }}>81.6% (98 / 120 votos)</span>
                    </div>
                    <div style={{ width: '100%', height: 6, background: '#E2E8F0', borderRadius: 9999, overflow: 'hidden' }}>
                      <div style={{ width: '81.6%', height: '100%', background: '#0D9488', borderRadius: 9999 }}></div>
                    </div>
                  </div>

                  {/* Candidates */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: '#F0FDFA', border: '1px solid #CCFBF1', borderRadius: 10 }}>
                      <div style={{ fontSize: 11.5, fontWeight: 700, color: '#0F172A' }}>
                        Carlos Gómez <span style={{ fontSize: 10, color: '#64748B', fontWeight: 500 }}>(Operario)</span>
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 800, color: '#0D9488' }}>
                        42 votos <span style={{ fontSize: 9.5, color: '#64748B' }}>(43%)</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10 }}>
                      <div style={{ fontSize: 11.5, fontWeight: 700, color: '#0F172A' }}>
                        Mariana Ríos <span style={{ fontSize: 10, color: '#64748B', fontWeight: 500 }}>(Analista)</span>
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 800, color: '#475569' }}>
                        34 votos <span style={{ fontSize: 9.5, color: '#64748B' }}>(35%)</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10 }}>
                      <div style={{ fontSize: 11.5, fontWeight: 600, color: '#64748B' }}>
                        Voto en Blanco
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8' }}>
                        22 votos <span style={{ fontSize: 9.5 }}>(22%)</span>
                      </div>
                    </div>
                  </div>

                  {/* Action & Token */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #F1F5F9', paddingTop: 10 }}>
                    <span style={{ fontSize: 10, color: '#15803D', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                      ✓ Acta Oficial con Token & Firmas Digitales
                    </span>
                    <span style={{ fontSize: 10, fontWeight: 800, color: '#0F172A', background: '#F1F5F9', padding: '3px 8px', borderRadius: 6 }}>
                      Periodo 2026-2028
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Agentes IA & Tenshi Orquestador */}
      <section id="tenshi" className="band" style={{ paddingTop: 40 }}>
        <div className="wrap">
          <div className="sec-head">
            <span className="eyebrow">
              <span className="dot"></span>
              {lang === 'es' ? 'Inteligencia Artificial Especializada' : 'Specialized Artificial Intelligence'}
            </span>
            <h2 className="display">
              {lang === 'es' ? 'Agentes IA: Tenshi y +20 Especialistas Autónomos en SST' : 'AI Agents: Tenshi & 20+ Autonomous Specialists'}
            </h2>
            <p>
              {lang === 'es'
                ? 'Tenshi no es un simple chat de respuestas genéricas: es el orientador y orquestador autónomo de WAPPY. Conoce a profundidad la estructura de los 8 Hitos y los más de 30 aplicativos de la plataforma, coordinando con médicos, ergónomos y abogados para operar el sistema por ti.'
                : 'Tenshi is WAPPY’s autonomous orchestrator and system guide, coordinating with 20+ specialized AI agents and navigating the system for you.'}
            </p>
          </div>

          {/* Feature 2: Tenshi Orquestador */}
          <div className="feat rev">
            <div className="feat-copy">
              <span className="eyebrow">
                <span className="dot"></span>
                {lang === 'es' ? 'Tenshi IA · Orquestador & Orientador SST' : 'Tenshi AI · System Orchestrator & Guide'}
              </span>
              <h3>{lang === 'es' ? 'Tu orientador experto que te guía por el sistema y ejecuta actividades contigo.' : 'Your expert guide navigating the system and executing tasks with you.'}</h3>
              <p>
                {lang === 'es'
                  ? 'Tenshi no es un simple chat de respuestas genéricas: es el orientador y orquestador autónomo de WAPPY. Conoce a profundidad la estructura de los 8 Hitos y los más de 30 aplicativos de la plataforma. Si tienes dudas o no sabes por dónde empezar, Tenshi te guía paso a paso, te lleva al módulo exacto y te ayuda a diligenciar formularios, actas y matrices en pantalla mediante control de interfaz (Page Controller). Cuando requieres un criterio de alta especialidad, convoca y consulta en vivo a los más de 20 agentes expertos (médico laboral, auditor 0312, especialista químico SGA o ergónomo) integrando sus respuestas en tus actividades.'
                  : 'Tenshi is WAPPY’s autonomous orchestrator and system guide. It knows all 8 milestones and 30+ applications: guiding you step by step, taking you to the exact module, and actively helping you fill forms, minutes, and matrices on screen via Page Controller, while coordinating with 20+ specialized AI agents.'}
              </p>
              <ul className="feat-list">
                <li>
                  <span className="ck">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  {lang === 'es' ? 'Orientador del SG-SST: Te guía paso a paso por los 8 Hitos y te indica exactamente qué hacer ante auditorías o inspecciones' : 'System guide across all 8 milestones, advising applicable requirements and where to resolve them'}
                </li>
                <li>
                  <span className="ck">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  {lang === 'es' ? 'Asistente de actividades en pantalla: Diligencia matrices, actas de comités y registros ACPM interactuando directamente en la interfaz' : 'Interface automation: fills technical forms, minutes, and CAPA plans directly on screen'}
                </li>
                <li>
                  <span className="ck">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  {lang === 'es' ? 'Orquestador Multi-Agente: Consulta y enruta requerimientos complejos hacia más de 20 especialistas SST (Médico, Abogado, Ergónomo, Químico)' : 'Multi-Agent Orchestrator: consults and routes queries to 20+ specialized OHS AI agents'}
                </li>
                <li>
                  <span className="ck">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  {lang === 'es' ? 'Sesión de voz bidireccional en vivo para consultar y ejecutar actividades con manos libres en campo' : 'Real-time two-way voice session to execute activities or solve inquiries hands-free on site'}
                </li>
              </ul>
            </div>

            <div className="feat-art tint-lav">
              <div style={{ width: '100%', maxWidth: 380, background: '#fff', borderRadius: 20, boxShadow: '0 16px 40px rgba(20,40,80,0.14)', padding: 20, border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 30, height: 30, borderRadius: 10, background: '#C7F303', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="2.2">
                        <path d="M12 3l1.9 5.8a2 2 0 0 0 1.3 1.3L21 12l-5.8 1.9a2 2 0 0 0-1.3 1.3L12 21l-1.9-5.8a2 2 0 0 0-1.3-1.3L3 12l5.8-1.9a2 2 0 0 0 1.3-1.3z"></path>
                      </svg>
                    </span>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 14, color: '#0F172A', lineHeight: 1.1 }}>Tenshi IA</div>
                      <div style={{ fontSize: 10, color: '#64748B', fontWeight: 600 }}>{lang === 'es' ? 'Orientador & Orquestador Activo' : 'Active System Guide & Orchestrator'}</div>
                    </div>
                  </div>
                  <span style={{ fontSize: 9.5, fontWeight: 800, padding: '2px 8px', borderRadius: 9999, background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #DBEAFE' }}>
                    Control de Pantalla
                  </span>
                </div>

                {/* Simulated Guidance & Execution Flow */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
                  {/* User query */}
                  <div style={{ alignSelf: 'flex-end', maxWidth: '88%', background: '#F1F5F9', borderRadius: '12px 12px 2px 12px', padding: '8px 12px', fontSize: 11.5, color: '#1E293B', lineHeight: 1.4 }}>
                    {lang === 'es'
                      ? 'Tenshi, guíame para registrar una acción de mejora por hallazgo ergonómico en la matriz IPEVAR y ayúdame a diligenciarla.'
                      : 'Tenshi, guide me to record a CAPA improvement action from an ergonomic IPEVAR hazard and help me fill it out.'}
                  </div>

                  {/* Tenshi Response & Screen Action */}
                  <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px 12px 12px 2px', padding: '12px', fontSize: 11.5, lineHeight: 1.45, color: '#334155' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: '#0284C7', marginBottom: 4 }}>
                      <span>🧭</span> {lang === 'es' ? 'Orientación en Somos SST:' : 'System Guidance:'}
                    </div>
                    <div style={{ marginBottom: 8, fontSize: 11 }}>
                      {lang === 'es'
                        ? 'Te he guiado al Centro de Control ACPM (Hito 7). Convoqué al Especialista GTC 45 y al Ergónomo para formular la medida correctiva.'
                        : 'Navigated to CAPA Control Center (Milestone 7). Consulted GTC 45 Specialist and Ergonomist.'}
                    </div>

                    <div style={{ background: '#fff', border: '1px solid #CBD5E1', borderRadius: 8, padding: '8px 10px', fontSize: 10.5 }}>
                      <div style={{ fontWeight: 800, color: '#0F172A', marginBottom: 2 }}>⚡ {lang === 'es' ? 'Diligenciado en Pantalla:' : 'Form Filled on Screen:'}</div>
                      <div style={{ color: '#475569' }}>• {lang === 'es' ? 'Acción: Control de ingeniería en mesa de empaque' : 'Action: Engineering control on packing table'}</div>
                      <div style={{ color: '#475569' }}>• {lang === 'es' ? 'Causa Raíz: Sobrecarga lumbar repetitiva' : 'Root Cause: Repetitive lumbar overload'}</div>
                      <div style={{ color: '#0D9488', fontWeight: 700, marginTop: 2 }}>✓ {lang === 'es' ? 'Listo para guardar y asignar responsable' : 'Ready to save & assign responsible'}</div>
                    </div>
                  </div>
                </div>

                {/* Footer action pill buttons */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <span style={{ flex: 1, height: 36, borderRadius: 10, background: '#0E1300', color: '#C7F303', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11.5, fontWeight: 800, gap: 5 }}>
                    <span>⚡</span> {lang === 'es' ? 'Diligenciado en Pantalla' : 'Automated on Screen'}
                  </span>
                  <span style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid #CBD5E1', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC', fontSize: 14 }}>
                    🎙️
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Matrices Normativas & Bio-IPEVR */}
      <section id="matrices" className="band" style={{ paddingTop: 40 }}>
        <div className="wrap">
          <div className="sec-head">
            <span className="eyebrow">
              <span className="dot"></span>
              {lang === 'es' ? 'Hitos 1 & 4 · Evaluación y Control del Riesgo' : 'Milestones 1 & 4 · Risk Assessment & Control'}
            </span>
            <h2 className="display">
              {lang === 'es' ? 'Matrices de Riesgos: GTC 45, Bio-IPEVR, PESV y SGA' : 'Risk Matrices: GTC 45, Bio-IPEVR, PESV & GHS'}
            </h2>
            <p>
              {lang === 'es'
                ? 'WAPPY trasciende las matrices estáticas en papel combinando dos metodologías complementarias sincronizadas en tiempo real: la Matriz IPEVR Oficial bajo GTC 45 y la Matriz Bio-IPEVR Dinámica con amortiguación de riesgo por autorreportes.'
                : 'WAPPY replaces static spreadsheets with two synchronized risk engines: Official IPEVR and Dynamic Bio-IPEVR with worker perception damping.'}
            </p>
          </div>

          {/* Feature 3: Dos Matrices Convergentes (Hito 1 vs. Hito 4) */}
          <div className="feat">
            <div className="feat-copy">
              <span className="eyebrow">
                <span className="dot"></span>
                {lang === 'es' ? 'Matrices Convergentes en Tiempo Real' : 'Real-time Convergent Risk Matrices'}
              </span>
              <h3>
                {lang === 'es'
                  ? 'Matriz IPEVR Organizacional (Hito 1) vs. Matriz Bio-IPEVR (Hito 4): La prevención viva.'
                  : 'Organizational IPEVR (Milestone 1) vs. Dynamic Bio-IPEVR (Milestone 4): Living Prevention.'}
              </h3>
              <p>
                {lang === 'es'
                  ? 'WAPPY trasciende las matrices estáticas en papel combinando dos metodologías complementarias que se sincronizan en tiempo real:'
                  : 'WAPPY replaces static spreadsheets with two synchronized risk engines:'}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, margin: '14px 0 18px', fontSize: 13, lineHeight: 1.55, color: 'var(--ink)' }}>
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: '10px 14px' }}>
                  <strong style={{ color: '#0F172A', display: 'block', marginBottom: 2 }}>
                    🏛️ {lang === 'es' ? '1. Matriz IPEVR Oficial (Hito 1 · Gobernanza & GTC 45):' : '1. Official IPEVR Matrix (Milestone 1 · GTC 45):'}
                  </strong>
                  <span style={{ color: '#475569' }}>
                    {lang === 'es'
                      ? 'Evalúa el puesto de trabajo de manera macro y reglamentaria (Decreto 1072 & Res. 0312). Utiliza la fórmula paramétrica oficial: ND × NE = NP y NP × NC = Nivel de Riesgo (NR I a IV) para definir la jerarquía de controles de la empresa.'
                      : 'Assesses roles and zones collectively under Colombian standard GTC 45 (ND × NE = NP; NP × NC = Risk Level NR I-IV) establishing enterprise hierarchy of controls.'}
                  </span>
                </div>

                <div style={{ background: '#F0FDFA', border: '1px solid #CCFBF1', borderRadius: 12, padding: '10px 14px' }}>
                  <strong style={{ color: '#0D9488', display: 'block', marginBottom: 2 }}>
                    🧬 {lang === 'es' ? '2. Matriz Bio-IPEVR Dinámica (Hito 4 · Metodología del Bioindividuo):' : '2. Dynamic Bio-IPEVR Matrix (Milestone 4 · Bioindividual):'}
                  </strong>
                  <span style={{ color: '#334155' }}>
                    {lang === 'es'
                      ? 'Evalúa a la persona real que ocupa el puesto en 8 dominios fisiológicos (Osteomuscular, Cardiovascular, Neurológico, etc.). Multiplica la Susceptibilidad Clínica (NS) por la Exposición (NE) y aplica el Modulador de Percepción del Riesgo: los puntos por autorreportes del trabajador amortiguan el riesgo efectivo hasta un 40%.'
                      : 'Assesses the actual human worker across 8 bio-physiological domains. Multiplies Clinical Susceptibility (NS) by Exposure (NE), moderated by worker risk perception score (reducing up to 40%).'}
                  </span>
                </div>
              </div>

              <ul className="feat-list">
                <li>
                  <span className="ck">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  {lang === 'es'
                    ? '¿Por qué son diferentes? Hito 1 audita el cargo formal ante la ley; Hito 4 protege la anatomía viva y estado clínico del trabajador que lo ejecuta.'
                    : 'Why are they different? Milestone 1 audits formal job compliance; Milestone 4 protects the worker’s live clinical biology.'}
                </li>
                <li>
                  <span className="ck">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  {lang === 'es'
                    ? '¿Cómo convergen? Si en Hito 1 el riesgo es estándar, pero en Hito 4 el colaborador presenta vulnerabilidad lumbar o fatiga, el sistema eleva la alerta a crítico.'
                    : 'How do they converge? If Milestone 1 rates risk standard, but Milestone 4 detects personal vulnerability, the system escalates the risk to critical.'}
                </li>
                <li>
                  <span className="ck">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  {lang === 'es'
                    ? 'Cierre automático del ciclo: La convergencia prescribe controles de ingeniería y dispara tareas correctivas directas al Centro de Control ACPM (Hito 7).'
                    : 'Automated loop: Convergence prescribes engineering controls and sends corrective tasks straight to the CAPA Kanban (Milestone 7).'}
                </li>
              </ul>
            </div>

            <div className="feat-art tint-mint">
              <div style={{ width: '100%', maxWidth: 330, boxSizing: 'border-box', background: 'linear-gradient(160deg, #0F172A, #1E293B)', borderRadius: 20, boxShadow: '0 16px 40px rgba(15,23,42,0.25)', padding: 18, color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 15, color: '#C7F303' }}>
                    Doble Matriz Convergente
                  </div>
                  <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 9999, background: 'rgba(199,243,3,0.15)', color: '#C7F303' }}>
                    SINCRONIZACIÓN IA
                  </span>
                </div>

                {/* Matrix 1: Hito 1 */}
                <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 14, padding: '12px 14px', marginBottom: 8, border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', color: '#38BDF8', letterSpacing: '.05em' }}>
                      Hito 1 · Matriz IPEVR (GTC 45)
                    </span>
                    <span style={{ fontSize: 9.5, fontWeight: 800, padding: '1px 6px', borderRadius: 6, background: '#EF4444', color: '#fff' }}>
                      NR I (Crítico)
                    </span>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>Peligro Biomecánico en Línea</div>
                  <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.6)', marginTop: 3 }}>
                    ND 6 × NE 4 = NP 24 · NC 25 → NR 600 (GTC 45)
                  </div>
                  <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 3 }}>
                    Evaluación Colectiva del Puesto &amp; Legal Dec. 1072
                  </div>
                </div>

                {/* Convergence Arrow Indicator */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, margin: '4px 0', fontSize: 10.5, fontWeight: 800, color: '#C7F303' }}>
                  <span>↕</span> {lang === 'es' ? 'Cruce Algorítmico en Tiempo Real' : 'Real-time Algorithmic Cross'} <span>↕</span>
                </div>

                {/* Matrix 2: Hito 4 */}
                <div style={{ background: 'rgba(45, 212, 191, 0.08)', borderRadius: 14, padding: '12px 14px', border: '1px solid rgba(45, 212, 191, 0.25)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', color: '#2DD4BF', letterSpacing: '.05em' }}>
                      Hito 4 · Matriz Bio-IPEVR (Bioindividuo)
                    </span>
                    <span style={{ fontSize: 9.5, fontWeight: 800, padding: '1px 6px', borderRadius: 6, background: '#F59E0B', color: '#451A03' }}>
                      Efectivo: 8.4
                    </span>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>Carlos Gómez · Dominio Osteomuscular</div>
                  <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.7)', marginTop: 3 }}>
                    Susceptibilidad NS 4 × Exposición NE 3 = 12 Bruto
                  </div>
                  <div style={{ fontSize: 10, color: '#34D399', fontWeight: 700, marginTop: 4 }}>
                    ✓ Modulador Activo: -30% por Cultura Preventiva
                  </div>
                </div>

                {/* Automatic CAPA Sync Footer */}
                <div style={{ marginTop: 8, padding: '7px 10px', background: 'rgba(199,243,3,0.1)', borderRadius: 8, textAlign: 'center', fontSize: 10, fontWeight: 700, color: '#C7F303' }}>
                  ⚡ {lang === 'es' ? 'Acción de Ingeniería enviada a ACPM (Hito 7)' : 'Engineering task dispatched to CAPA (Milestone 7)'}
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
          <div className="sec-head" style={{ marginBottom: 40 }}>
            <span className="eyebrow">
              <span className="dot"></span>
              {lang === 'es' ? 'PWA Móvil & Modo Offline' : 'PWA Mobile & Offline Mode'}
            </span>
            <h2 className="display" style={{ fontSize: 'clamp(30px,4.6vw,48px)', margin: '14px 0 0' }}>
              {lang === 'es' ? 'Visión & PWA: App Móvil, Inspecciones y Modo Sin Conexión' : 'Vision & PWA: Mobile App, Inspections & Offline Mode'}
            </h2>
            <p style={{ fontSize: 17, color: 'rgba(14,19,0,0.62)', maxWidth: 640, margin: '14px auto 0' }}>
              {lang === 'es'
                ? 'Sin descargar aplicaciones pesadas: realiza análisis biomecánicos en vivo con el Fisioterapeuta IA, consulta a más de 20 especialistas SST y habilita portales públicos por QR para que tus trabajadores voten en comités, firmen actas y reporten peligros sin contraseñas.'
                : 'Zero app store installs: run live ergonomic posture assessments, consult 20+ specialized AI agents, and launch instant QR portals for workers to vote in committees, sign records, and report hazards with zero passwords.'}
            </p>
          </div>

          <div className="app-phones">
            {/* Phone 1: Análisis Biomecánico · Fisioterapeuta IA (MediaPipe Pose Exoskeleton) */}
            <div className="phone-wrap">
              <div className="phone-label">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"></path>
                  <path d="M6 21v-4a6 6 0 0 1 12 0v4"></path>
                </svg>
                {lang === 'es' ? 'Análisis Biomecánico · Fisioterapeuta IA' : 'Biomechanical Analysis · AI Physio'}
              </div>
              <div className="phone" style={{ width: 260, height: 530, display: 'flex', flexDirection: 'column', padding: 8, boxSizing: 'border-box' }}>
                <div className="phone-screen" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#090D16', borderRadius: 34, overflow: 'hidden' }}>
                  {/* Unified Dynamic Island Notch */}
                  <div className="phone-notch" style={{ height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0F172A', flexShrink: 0 }}>
                    <span style={{ width: 56, height: 12, borderRadius: 9999, background: '#000' }}></span>
                  </div>

                  {/* Unified Header */}
                  <div style={{ background: '#0F172A', padding: '6px 12px 10px', color: '#fff', textAlign: 'left', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <span style={{ width: 28, height: 28, borderRadius: 8, background: '#0284C7', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>
                          📐
                        </span>
                        <div>
                          <div style={{ fontSize: 12.5, fontWeight: 800, lineHeight: 1.1 }}>{lang === 'es' ? 'Fisioterapeuta IA' : 'AI Physiotherapist'}</div>
                          <div style={{ fontSize: 9.5, color: '#38BDF8', fontWeight: 600 }}>MediaPipe Pose · ROSA</div>
                        </div>
                      </div>
                      <span style={{ fontSize: 8.5, fontWeight: 800, padding: '2px 6px', borderRadius: 9999, background: 'rgba(34, 197, 94, 0.2)', color: '#4ADE80', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#4ADE80', boxShadow: '0 0 6px #4ADE80' }}></span>
                        {lang === 'es' ? 'EN VIVO' : 'LIVE'}
                      </span>
                    </div>
                  </div>

                  {/* Camera Viewport with MediaPipe Pose Exoskeleton */}
                  <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', background: 'radial-gradient(circle at 60% 40%, #111A2E 0%, #070B12 100%)', overflow: 'hidden', minHeight: 0 }}>
                    {/* Viewfinder Telemetry Top HUD */}
                    <div style={{ position: 'absolute', top: 6, left: 8, right: 8, zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', padding: '2px 6px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)' }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#EF4444' }}></span>
                        <span style={{ fontSize: 8.5, fontWeight: 800, color: '#F1F5F9', letterSpacing: '0.04em' }}>REC 30 FPS</span>
                      </div>
                      <span style={{ fontSize: 8.5, fontWeight: 800, padding: '2px 6px', borderRadius: 6, background: 'rgba(245, 158, 11, 0.25)', color: '#FCD34D', border: '1px solid rgba(245, 158, 11, 0.4)' }}>
                        ROSA: 4 · Moderado
                      </span>
                    </div>

                    {/* SVG Canvas: Workstation Silhouette + MediaPipe 33-Landmark Pose Exoskeleton */}
                    <div style={{ width: '100%', height: 235, position: 'relative' }}>
                      <svg width="100%" height="100%" viewBox="0 0 240 235" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
                        <defs>
                          <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="2" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                          </filter>
                          <filter id="glow-amber" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="2" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                          </filter>
                        </defs>

                        {/* Camera Optical Reticles / Viewfinder Corners */}
                        <path d="M 12 28 L 12 18 L 22 18" stroke="#38BDF8" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
                        <path d="M 228 28 L 228 18 L 218 18" stroke="#38BDF8" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
                        <path d="M 12 215 L 12 225 L 22 225" stroke="#38BDF8" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
                        <path d="M 228 215 L 228 225 L 218 225" stroke="#38BDF8" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />

                        {/* Subtle background tech grid */}
                        <line x1="20" y1="130" x2="220" y2="130" stroke="#1E293B" strokeWidth="0.8" strokeDasharray="3 4" opacity="0.5" />
                        <line x1="120" y1="20" x2="120" y2="220" stroke="#1E293B" strokeWidth="0.8" strokeDasharray="3 4" opacity="0.4" />

                        {/* Workstation Silhouette (Office Desk, Monitor & Ergonomic Chair) */}
                        {/* Monitor & Stand */}
                        <rect x="180" y="80" width="34" height="42" rx="3" fill="#151E2E" stroke="#334155" strokeWidth="1.5" />
                        <rect x="182" y="82" width="30" height="38" rx="2" fill="#0284C7" fillOpacity="0.12" />
                        <line x1="197" y1="122" x2="197" y2="148" stroke="#475569" strokeWidth="3" strokeLinecap="round" />
                        <path d="M 186 148 L 208 148" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" />

                        {/* Office Desk */}
                        <line x1="120" y1="150" x2="228" y2="150" stroke="#334155" strokeWidth="3.5" strokeLinecap="round" />
                        <line x1="216" y1="150" x2="216" y2="228" stroke="#1E293B" strokeWidth="2.5" />

                        {/* Keyboard & Mouse */}
                        <rect x="156" y="146" width="22" height="4" rx="1.5" fill="#475569" />
                        <ellipse cx="186" cy="148" rx="3.5" ry="2" fill="#64748B" />

                        {/* Ergonomic Chair */}
                        <path d="M 48 95 Q 52 145 56 168" stroke="#1E293B" strokeWidth="6" strokeLinecap="round" />
                        <path d="M 52 168 L 105 168" stroke="#1E293B" strokeWidth="5" strokeLinecap="round" />
                        <line x1="75" y1="168" x2="75" y2="216" stroke="#334155" strokeWidth="3.5" />
                        <path d="M 58 222 L 75 216 L 92 222" stroke="#475569" strokeWidth="3" strokeLinecap="round" />

                        {/* Human Worker Profile Silhouette */}
                        <circle cx="95" cy="74" r="14" fill="#192338" />
                        <path d="M 88 88 C 76 112 74 150 78 166 C 85 168 108 168 114 166 C 112 146 110 114 100 88 Z" fill="#151E2E" />
                        <path d="M 78 166 L 128 170 L 122 220 L 140 224" stroke="#151E2E" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />

                        {/* --- MEDIAPIPE POSE EXOSKELETON OVERLAY --- */}
                        {/* Connecting Bones (Cyan & Lime Glowing Vectors) */}
                        {/* Spine / Trunk Vector */}
                        <line x1="98" y1="102" x2="88" y2="164" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" filter="url(#glow-cyan)" />

                        {/* Pelvis to Knee (Thigh) */}
                        <line x1="88" y1="164" x2="132" y2="170" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" />

                        {/* Knee to Ankle (Lower Leg) */}
                        <line x1="132" y1="170" x2="128" y2="218" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" />

                        {/* Ankle to Foot Tip */}
                        <line x1="128" y1="218" x2="148" y2="222" stroke="#10B981" strokeWidth="2" strokeLinecap="round" />

                        {/* Arm: Shoulder -> Elbow */}
                        <line x1="98" y1="102" x2="122" y2="132" stroke="#22D3EE" strokeWidth="2.5" strokeLinecap="round" filter="url(#glow-cyan)" />

                        {/* Forearm: Elbow -> Wrist */}
                        <line x1="122" y1="132" x2="160" y2="145" stroke="#22D3EE" strokeWidth="2.5" strokeLinecap="round" filter="url(#glow-cyan)" />

                        {/* Wrist to Hand Landmarks */}
                        <line x1="160" y1="145" x2="170" y2="147" stroke="#22D3EE" strokeWidth="2" strokeLinecap="round" />

                        {/* Head & Facial Landmarks */}
                        <line x1="95" y1="74" x2="105" y2="72" stroke="#22D3EE" strokeWidth="1.8" strokeLinecap="round" />
                        <line x1="105" y1="72" x2="108" y2="76" stroke="#22D3EE" strokeWidth="1.8" strokeLinecap="round" />

                        {/* Cervical Vector (Warning / Amber): C7 Cervical to Ear */}
                        <line x1="98" y1="102" x2="95" y2="74" stroke="#F59E0B" strokeWidth="2.8" strokeLinecap="round" filter="url(#glow-amber)" />

                        {/* Vertical Reference Line for Cervical Angle */}
                        <line x1="98" y1="102" x2="98" y2="60" stroke="#94A3B8" strokeWidth="1.2" strokeDasharray="3 3" opacity="0.7" />

                        {/* Cervical Angle Arc (24°) */}
                        <path d="M 98 72 A 30 30 0 0 0 95 74" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" fill="none" />

                        {/* Cervical Angle Warning Badge */}
                        <g transform="translate(42, 54)">
                          <rect x="0" y="0" width="50" height="18" rx="5" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="1.2" />
                          <text x="25" y="12" fill="#B45309" fontSize="8.5" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">
                            24° ALERTA
                          </text>
                        </g>

                        {/* Elbow Angle Arc & Badge (95° OK) */}
                        <g transform="translate(128, 116)">
                          <rect x="0" y="0" width="40" height="15" rx="4" fill="#DCFCE7" stroke="#10B981" strokeWidth="1" />
                          <text x="20" y="11" fill="#15803D" fontSize="8" fontWeight="800" textAnchor="middle" fontFamily="sans-serif">
                            95° OK
                          </text>
                        </g>

                        {/* MediaPipe 33-Landmark Glowing Node Dots */}
                        <circle cx="95" cy="74" r="3.5" fill="#F59E0B" stroke="#FFFFFF" strokeWidth="1.5" />
                        <circle cx="105" cy="72" r="2.5" fill="#22D3EE" stroke="#FFFFFF" strokeWidth="1" />
                        <circle cx="108" cy="76" r="2.5" fill="#22D3EE" stroke="#FFFFFF" strokeWidth="1" />
                        <circle cx="98" cy="102" r="4" fill="#F59E0B" stroke="#FFFFFF" strokeWidth="1.5" />
                        <circle cx="122" cy="132" r="4" fill="#10B981" stroke="#FFFFFF" strokeWidth="1.5" />
                        <circle cx="160" cy="145" r="3" fill="#22D3EE" stroke="#FFFFFF" strokeWidth="1" />
                        <circle cx="170" cy="147" r="2.5" fill="#22D3EE" stroke="#FFFFFF" strokeWidth="1" />
                        <circle cx="88" cy="164" r="4" fill="#10B981" stroke="#FFFFFF" strokeWidth="1.5" />
                        <circle cx="132" cy="170" r="4" fill="#10B981" stroke="#FFFFFF" strokeWidth="1.5" />
                        <circle cx="128" cy="218" r="3.5" fill="#10B981" stroke="#FFFFFF" strokeWidth="1" />
                        <circle cx="148" cy="222" r="3" fill="#10B981" stroke="#FFFFFF" strokeWidth="1" />

                        {/* Real-time confidence watermark badge */}
                        <g transform="translate(10, 206)">
                          <rect x="0" y="0" width="128" height="15" rx="4" fill="rgba(15, 23, 42, 0.75)" stroke="rgba(56, 189, 248, 0.3)" strokeWidth="0.8" />
                          <text x="64" y="11" fill="#38BDF8" fontSize="7.5" fontWeight="700" textAnchor="middle" fontFamily="sans-serif">
                            ⚡ 33 Landmarks · 98.4% Confianza
                          </text>
                        </g>
                      </svg>
                    </div>

                    {/* Diagnostic Summary Drawer */}
                    <div style={{ background: '#0F172A', borderTop: '1px solid #1E293B', padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 5, flexShrink: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 9.5, fontWeight: 800, color: '#F8FAFC', display: 'flex', alignItems: 'center', gap: 5 }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#F59E0B' }}></span>
                          {lang === 'es' ? 'Flexión Cervical: 24° (Límite 20°)' : 'Neck Flexion: 24° (Limit 20°)'}
                        </span>
                        <span style={{ fontSize: 8, fontWeight: 800, padding: '1px 5px', borderRadius: 4, background: '#FEF3C7', color: '#B45309' }}>
                          ISO 11226
                        </span>
                      </div>

                      <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: '5px 8px', fontSize: 9, color: '#94A3B8', lineHeight: 1.35, border: '1px solid rgba(255,255,255,0.06)' }}>
                        <strong style={{ color: '#C7F303' }}>{lang === 'es' ? 'Fisioterapeuta IA: ' : 'AI Physio: '}</strong>
                        {lang === 'es'
                          ? 'Elevar monitor +8 cm y realizar micropausa activa de 2 min.'
                          : 'Raise screen +8 cm and take 2-min active break.'}
                      </div>

                      {/* Bottom Action Button */}
                      <div style={{ paddingTop: 2 }}>
                        <span style={{ height: 32, width: '100%', borderRadius: 8, background: '#C7F303', color: '#0E1300', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5, fontSize: 10.5, fontWeight: 800 }}>
                          ⚡ {lang === 'es' ? 'Prescribir Ajuste en Matriz' : 'Sync to Risk Matrix'}
                        </span>
                      </div>
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
              <div className="phone" style={{ width: 260, height: 530, display: 'flex', flexDirection: 'column', padding: 8, boxSizing: 'border-box' }}>
                <div className="phone-screen" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#F8FAFC', borderRadius: 34, overflow: 'hidden' }}>
                  {/* Unified Dynamic Island Notch */}
                  <div className="phone-notch" style={{ height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0F172A', flexShrink: 0 }}>
                    <span style={{ width: 56, height: 12, borderRadius: 9999, background: '#000' }}></span>
                  </div>

                  {/* Unified Header */}
                  <div style={{ background: '#0F172A', padding: '6px 12px 10px', color: '#fff', textAlign: 'left', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <span style={{ width: 28, height: 28, borderRadius: 8, background: '#C7F303', color: '#0E1300', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 12 }}>
                          FT
                        </span>
                        <div>
                          <div style={{ fontSize: 12.5, fontWeight: 800, lineHeight: 1.1 }}>Fisioterapeuta IA</div>
                          <div style={{ fontSize: 9.5, color: '#94A3B8' }}>{lang === 'es' ? 'En línea · +20 Especialistas' : 'Online · 20+ Specialists'}</div>
                        </div>
                      </div>
                      <span style={{ fontSize: 8.5, fontWeight: 800, padding: '2px 6px', borderRadius: 9999, background: 'rgba(199, 243, 3, 0.2)', color: '#C7F303' }}>
                        CHAT IA
                      </span>
                    </div>
                  </div>

                  {/* Phone Body */}
                  <div style={{ flex: 1, padding: 10, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: '#F1F5F9', minHeight: 0 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {/* Specialist pills */}
                      <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 2 }}>
                        <span style={{ fontSize: 9.5, fontWeight: 800, padding: '3px 8px', borderRadius: 9999, background: '#0E1300', color: '#C7F303', whiteSpace: 'nowrap' }}>
                          Fisioterapeuta
                        </span>
                        <span style={{ fontSize: 9.5, fontWeight: 600, padding: '3px 8px', borderRadius: 9999, background: '#E2E8F0', color: '#475569', whiteSpace: 'nowrap' }}>
                          Médico Laboral
                        </span>
                        <span style={{ fontSize: 9.5, fontWeight: 600, padding: '3px 8px', borderRadius: 9999, background: '#E2E8F0', color: '#475569', whiteSpace: 'nowrap' }}>
                          Abogado RIT
                        </span>
                      </div>

                      {/* Chat dialog bubble */}
                      <div style={{ background: '#fff', borderRadius: 12, padding: 9, fontSize: 11, lineHeight: 1.45, color: '#1E293B', border: '1px solid #E2E8F0' }}>
                        {lang === 'es'
                          ? 'Analicé el puesto. Para mitigar sobrecargas biomecánicas en miembros superiores, sugiero micropausas activas dirigidas y elevación de pantalla a la altura de los ojos.'
                          : 'Reviewed workstation ergonomics. To reduce upper limb strain, I recommend targeted active breaks and adjusting monitor to eye level.'}
                      </div>

                      {/* Technical citation card */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', borderRadius: 10, padding: '6px 8px', fontSize: 9.5, color: '#0369A1', fontWeight: 700, border: '1px solid #E0F2FE' }}>
                        <span>📜</span>
                        <span>{lang === 'es' ? 'Citado con Res. 2400 & ISO 11226' : 'Cited with Res. 2400 & ISO 11226'}</span>
                      </div>

                      {/* Model / Agent info */}
                      <div style={{ fontSize: 9.5, color: '#64748B', padding: '0 2px' }}>
                        ✓ {lang === 'es' ? 'Acceso 24/7 sin citas ni esperas' : 'Instant 24/7 access with zero waiting'}
                      </div>
                    </div>

                    {/* Bottom Action Button */}
                    <div style={{ marginTop: 'auto', paddingTop: 6 }}>
                      <span style={{ height: 36, width: '100%', borderRadius: 10, background: '#C7F303', color: '#0E1300', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 11.5, fontWeight: 800 }}>
                        🎙️ {lang === 'es' ? 'Consulta por Voz en Vivo' : 'Live Voice Session'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Phone 3: Portales Públicos por QR · Colaboradores */}
            <div className="phone-wrap">
              <div className="phone-label">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7"></rect>
                  <rect x="14" y="3" width="7" height="7"></rect>
                  <rect x="14" y="14" width="7" height="7"></rect>
                  <rect x="3" y="14" width="7" height="7"></rect>
                </svg>
                {lang === 'es' ? 'Portales Públicos QR · Colaboradores' : 'Public QR Portals · Workforce'}
              </div>
              <div className="phone" style={{ width: 260, height: 530, display: 'flex', flexDirection: 'column', padding: 8, boxSizing: 'border-box' }}>
                <div className="phone-screen" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#F8FAFC', borderRadius: 34, overflow: 'hidden' }}>
                  {/* Unified Dynamic Island Notch */}
                  <div className="phone-notch" style={{ height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0F172A', flexShrink: 0 }}>
                    <span style={{ width: 56, height: 12, borderRadius: 9999, background: '#000' }}></span>
                  </div>

                  {/* Unified Header */}
                  <div style={{ background: '#0F172A', padding: '6px 12px 10px', color: '#fff', textAlign: 'left', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <span style={{ width: 28, height: 28, borderRadius: 8, background: '#0D9488', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 12 }}>
                          QR
                        </span>
                        <div>
                          <div style={{ fontSize: 12.5, fontWeight: 800, lineHeight: 1.1 }}>{lang === 'es' ? 'Portal Colaborador' : 'Worker Portal'}</div>
                          <div style={{ fontSize: 9.5, color: '#94A3B8' }}>{lang === 'es' ? 'Cero contraseñas · Cédula' : 'Zero passwords · ID check'}</div>
                        </div>
                      </div>
                      <span style={{ fontSize: 8.5, fontWeight: 800, padding: '2px 6px', borderRadius: 9999, background: 'rgba(13, 148, 136, 0.25)', color: '#2DD4BF' }}>
                        PWA MÓVIL
                      </span>
                    </div>
                  </div>

                  {/* Phone Body */}
                  <div style={{ flex: 1, padding: 10, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: '#F1F5F9', minHeight: 0 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {/* Worker active ID */}
                      <div style={{ background: '#fff', borderRadius: 10, padding: '6px 8px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 800, color: '#0F172A' }}>Carlos M. Gómez</div>
                          <div style={{ fontSize: 9.5, color: '#64748B' }}>C.C. 1.020.485.*** · Operario Planta</div>
                        </div>
                        <span style={{ width: 7, height: 7, borderRadius: 9999, background: '#10B981' }}></span>
                      </div>

                      {/* Service 1: Votaciones COPASST */}
                      <div style={{ background: '#fff', borderRadius: 10, padding: '7px 8px', border: '1px solid #E2E8F0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span>🗳️</span> {lang === 'es' ? 'Votación COPASST' : 'COPASST Voting'}
                          </div>
                          <span style={{ fontSize: 8, fontWeight: 800, padding: '1px 5px', borderRadius: 9999, background: '#DCFCE7', color: '#15803D' }}>
                            {lang === 'es' ? 'Tarjetón Activo' : 'Ballot Open'}
                          </span>
                        </div>
                        <div style={{ fontSize: 9.5, color: '#64748B' }}>
                          {lang === 'es' ? 'Voto secreto cifrado en urna móvil' : 'Encrypted secret mobile ballot'}
                        </div>
                      </div>

                      {/* Service 2: Auto-reporte de Riesgos */}
                      <div style={{ background: '#fff', borderRadius: 10, padding: '7px 8px', border: '1px solid #E2E8F0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span>📸</span> {lang === 'es' ? 'Auto-reporte de Peligro' : 'Hazard Report'}
                          </div>
                          <span style={{ fontSize: 8, fontWeight: 800, padding: '1px 5px', borderRadius: 9999, background: '#FEF3C7', color: '#B45309' }}>
                            {lang === 'es' ? 'Con Foto' : 'Photo'}
                          </span>
                        </div>
                        <div style={{ fontSize: 9.5, color: '#64748B' }}>
                          {lang === 'es' ? 'Condición insegura en tiempo real' : 'Real-time hazard report'}
                        </div>
                      </div>

                      {/* Service 3: Firma Digital de Actas */}
                      <div style={{ background: '#fff', borderRadius: 10, padding: '7px 8px', border: '1px solid #E2E8F0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span>✍️</span> {lang === 'es' ? 'Firma Digital de Actas' : 'Digital Signatures'}
                          </div>
                          <span style={{ fontSize: 8, fontWeight: 800, padding: '1px 5px', borderRadius: 9999, background: '#E0F2FE', color: '#0369A1' }}>
                            {lang === 'es' ? 'En Pantalla' : 'On-Screen'}
                          </span>
                        </div>
                        <div style={{ fontSize: 9.5, color: '#64748B' }}>
                          {lang === 'es' ? 'Entrega de EPP y compromisos SST' : 'PPE and OHS commitments'}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Button */}
                    <div style={{ marginTop: 'auto', paddingTop: 6 }}>
                      <span style={{ height: 36, width: '100%', borderRadius: 10, background: '#C7F303', color: '#0E1300', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 11.5, fontWeight: 800 }}>
                        ⚡ {lang === 'es' ? 'Escanear QR de Empresa' : 'Scan Company QR'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Video Band: Ecosistema de +20 Agentes SST & Demo Fisioterapeuta IA */}
      <section id="vision" className="band vid-band">
        <div className="wrap">
          <div className="sec-head">
            <span className="eyebrow">
              <span className="dot"></span>
              {lang === 'es' ? 'Demostración en Video · Visión por Computadora' : 'Video Demo · Computer Vision'}
            </span>
            <h2 className="display">
              {lang === 'es'
                ? 'Fisioterapeuta IA y Análisis Postural con Visión Artificial en Vivo'
                : 'Live AI Physiotherapist & Computer Vision Posture Analysis'}
            </h2>
            <p>
              {lang === 'es'
                ? 'WAPPY no es un chatbot genérico ni un formulario pasivo: es un equipo multidisciplinario de más de 20 agentes autónomos (Fisioterapeuta biomecánico, Médico Laboral, Higienista Industrial, Auditor ISO 45001 y Abogado SST) interconectados en tiempo real. En pantalla puedes observar a la Fisioterapeuta IA ejecutando un análisis postural en vivo mediante visión artificial, detectando desviaciones articulares y prescribiendo ajustes ergonómicos al instante.'
                : 'WAPPY is not a generic chatbot: it is an orchestrated multidisciplinary team of 20+ specialized autonomous agents (Biomechanical Physio, Occupational Doctor, Industrial Hygienist, ISO 45001 Auditor, and OHS Legal Advisor). Watch our AI Physiotherapist perform live computer vision pose estimation, detecting joint angles and prescribing instant ergonomic adjustments.'}
            </p>
          </div>

          {/* Video Action Toolbar (OUTSIDE the video - zero buttons covering YouTube!) */}
          <div className="vid-control-bar">
            <div className="vid-control-left">
              <span className="vid-live-pill">
                <span className="dot" style={{ background: '#10B981' }}></span>
                {lang === 'es' ? 'Análisis en Vivo · Fisioterapeuta IA' : 'Live Analysis · AI Physio'}
              </span>
              <span className="vid-tech-pill">
                MediaPipe Pose · Cinemática
              </span>
            </div>

            <div className="vid-control-right">
              <button
                type="button"
                className={`vid-toggle-btn ${!showVideo ? 'active' : ''}`}
                onClick={() => setShowVideo(false)}
              >
                🖼️ {lang === 'es' ? 'Infografía Estática' : 'Static Diagram'}
              </button>
              <button
                type="button"
                className={`vid-toggle-btn ${showVideo ? 'active' : ''}`}
                onClick={() => setShowVideo(true)}
              >
                ▶️ {lang === 'es' ? 'Video en Vivo' : 'Live Video'}
              </button>
              <a
                href="https://youtube.com/shorts/-cR-Qv3DDsM"
                target="_blank"
                rel="noopener noreferrer"
                className="vid-ext-link"
                title="Abrir en YouTube Shorts"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
                YouTube ↗
              </a>
            </div>
          </div>

          {/* Video Shell: Adapts between 16:9 for static poster and 9:16 vertical smartphone frame for YouTube Short */}
          <div
            className={`vid-shell ${showVideo ? 'vid-vertical-mode' : 'vid-poster-mode'}`}
          >
            {!showVideo ? (
              /* Static Image Poster with Interactive Play Trigger */
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '100%',
                  cursor: 'pointer',
                  overflow: 'hidden',
                }}
                onClick={() => setShowVideo(true)}
                title={lang === 'es' ? 'Clic para reproducir video del análisis en vivo' : 'Click to watch live video analysis'}
              >
                <img
                  src="/marketing/analisis_postural_en_vivo.jpg"
                  alt={lang === 'es' ? 'Análisis Postural Biomecánico en Vivo con Fisioterapeuta IA' : 'Live Postural Biomechanical Analysis with AI Physio'}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                    transition: 'transform 0.4s ease',
                  }}
                  className="vid-poster-img"
                />

                {/* Center Play Button Overlay */}
                <div
                  className="vid-play"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(14, 19, 0, 0.28)',
                    backdropFilter: 'blur(1px)',
                    gap: 14,
                    transition: 'all 0.3s ease',
                  }}
                >
                  <span
                    className="pbtn"
                    style={{
                      background: '#C7F303',
                      width: 86,
                      height: 86,
                      borderRadius: 9999,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 12px 40px rgba(199, 243, 3, 0.6), 0 0 0 10px rgba(199, 243, 3, 0.2)',
                      transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                    }}
                  >
                    <svg width="34" height="34" viewBox="0 0 24 24" fill="#0E1300">
                      <polygon points="6 4 20 12 6 20 6 4"></polygon>
                    </svg>
                  </span>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      background: 'rgba(15, 23, 42, 0.88)',
                      backdropFilter: 'blur(10px)',
                      color: '#FFFFFF',
                      padding: '8px 18px',
                      borderRadius: 9999,
                      fontSize: 13,
                      fontWeight: 700,
                      border: '1px solid rgba(255, 255, 255, 0.18)',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                    }}
                  >
                    <span>▶</span>
                    <span>{lang === 'es' ? 'Ver video del análisis en vivo (2:24 min)' : 'Watch live video demo (2:24 min)'}</span>
                  </div>
                </div>
              </div>
            ) : (
              /* Active YouTube Embed Player - 100% UNCLUTTERED, ZERO OVERLAPPING BUTTONS */
              <div style={{ position: 'relative', width: '100%', height: '100%', background: '#000' }}>
                <iframe
                  src="https://www.youtube.com/embed/-cR-Qv3DDsM?autoplay=1&rel=0&playsinline=1"
                  title="Fisioterapeuta IA - Análisis postural en vivo"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    display: 'block',
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Más de 30 Aplicativos Disponibles en tu SG-SST */}
      <section id="modulos" className="band">
        <div id="aplicativos" style={{ position: 'relative', top: -90 }} />
        <div className="wrap">
          <div className="sec-head">
            <span className="eyebrow">
              <span className="dot"></span>
              {lang === 'es' ? 'Catálogo Interactivo · 8 Hitos SG-SST' : 'Interactive Catalog · 8 Milestones'}
            </span>
            <h2 className="display">
              {lang === 'es' ? 'Módulos SST: Más de 30 Aplicativos Especializados' : 'OHS Modules: 30+ Specialized Applications'}
            </h2>
            <p>
              {lang === 'es'
                ? 'El ecosistema modular más completo de Colombia, estructurado bajo la Metodología del Bioindividuo y los 8 Hitos de gestión. Todos los aplicativos se conectan directamente a los más de 20 agentes de IA especialistas en SST de nuestro sistema para automatización, rigor normativo colombiano y analítica en una sola plataforma.'
                : 'Colombia’s most comprehensive OHS ecosystem, structured under the Bioindividual Methodology and 8 management milestones, connecting directly to the 20+ specialized OHS AI agents across the system.'}
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

      {/* Herramientas de IA, Conexiones API & Ecosistema de Integraciones */}
      <section id="herramientas" className="band" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="sec-head">
            <span className="eyebrow">
              <span className="dot"></span>
              {lang === 'es' ? 'Conectividad & Automatizaciones' : 'Connectivity & Automations'}
            </span>
            <h2 className="display">
              {lang === 'es'
                ? 'Herramientas: 22 Integraciones Nativas y Conectores'
                : 'Tools: 22 Native Integrations & Connectors'}
            </h2>
            <p>
              {lang === 'es'
                ? 'Nuestros más de 20 agentes especialistas en SST ejecutan acciones en tiempo real con herramientas de Google Workspace, Microsoft OneDrive, alertas meteorológicas OpenWeather para emergencias, bases de datos químicas SGA, automatizaciones n8n y las matrices oficiales del SG-SST.'
                : 'Our 20+ specialized OHS AI agents execute real-time actions using Google Workspace tools, Microsoft OneDrive, OpenWeather emergency alerts, GHS chemical databases, n8n automations, and official OHS compliance matrices.'}
            </p>
          </div>

          <div className="intg">
            {/* 1. Google Drive API */}
            <div className="i">
              <span className="g" style={{ background: '#E8F0FE' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#1A73E8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 14.89 9 6.23l5 8.66H4z"></path>
                  <path d="M9 6.23h10l-5 8.66"></path>
                  <path d="M14 14.89 9 23.55 4 14.89"></path>
                </svg>
              </span>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: '#0F172A', textAlign: 'center', lineHeight: 1.25, padding: '0 4px' }}>
                Google Drive API
              </span>
              <span style={{ fontSize: 9, fontWeight: 800, color: '#1A73E8', background: '#E8F0FE', padding: '2px 6px', borderRadius: 9999 }}>
                Google · Cloud
              </span>
            </div>

            {/* 2. Google Sheets API */}
            <div className="i">
              <span className="g" style={{ background: '#E6F4EA' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#137333" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2"></rect>
                  <line x1="3" y1="9" x2="21" y2="9"></line>
                  <line x1="3" y1="15" x2="21" y2="15"></line>
                  <line x1="9" y1="3" x2="9" y2="21"></line>
                  <line x1="15" y1="3" x2="15" y2="21"></line>
                </svg>
              </span>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: '#0F172A', textAlign: 'center', lineHeight: 1.25, padding: '0 4px' }}>
                Google Sheets API
              </span>
              <span style={{ fontSize: 9, fontWeight: 800, color: '#137333', background: '#E6F4EA', padding: '2px 6px', borderRadius: 9999 }}>
                Google · Tablas
              </span>
            </div>

            {/* 3. Google Docs API */}
            <div className="i">
              <span className="g" style={{ background: '#E8F0FE' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#1A73E8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
              </span>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: '#0F172A', textAlign: 'center', lineHeight: 1.25, padding: '0 4px' }}>
                Google Docs API
              </span>
              <span style={{ fontSize: 9, fontWeight: 800, color: '#1A73E8', background: '#E8F0FE', padding: '2px 6px', borderRadius: 9999 }}>
                Google · Documentos
              </span>
            </div>

            {/* 4. Google Slides API */}
            <div className="i">
              <span className="g" style={{ background: '#FEF3C7' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                  <line x1="8" y1="21" x2="16" y2="21"></line>
                  <line x1="12" y1="17" x2="12" y2="21"></line>
                </svg>
              </span>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: '#0F172A', textAlign: 'center', lineHeight: 1.25, padding: '0 4px' }}>
                Google Slides API
              </span>
              <span style={{ fontSize: 9, fontWeight: 800, color: '#D97706', background: '#FEF3C7', padding: '2px 6px', borderRadius: 9999 }}>
                Google · Presentaciones
              </span>
            </div>

            {/* 5. Google Calendar API */}
            <div className="i">
              <span className="g" style={{ background: '#FEF3C7' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#B45309" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
              </span>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: '#0F172A', textAlign: 'center', lineHeight: 1.25, padding: '0 4px' }}>
                Google Calendar
              </span>
              <span style={{ fontSize: 9, fontWeight: 800, color: '#B45309', background: '#FEF3C7', padding: '2px 6px', borderRadius: 9999 }}>
                Google · Agenda
              </span>
            </div>

            {/* 6. Gmail Oficial API */}
            <div className="i">
              <span className="g" style={{ background: '#FEE2E2' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
              </span>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: '#0F172A', textAlign: 'center', lineHeight: 1.25, padding: '0 4px' }}>
                Gmail Oficial API
              </span>
              <span style={{ fontSize: 9, fontWeight: 800, color: '#DC2626', background: '#FEE2E2', padding: '2px 6px', borderRadius: 9999 }}>
                Google · Notificaciones
              </span>
            </div>

            {/* 7. Google Search en Vivo */}
            <div className="i">
              <span className="g" style={{ background: '#EDE9FE' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </span>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: '#0F172A', textAlign: 'center', lineHeight: 1.25, padding: '0 4px' }}>
                Google Search
              </span>
              <span style={{ fontSize: 9, fontWeight: 800, color: '#7C3AED', background: '#EDE9FE', padding: '2px 6px', borderRadius: 9999 }}>
                Google · Citas en Vivo
              </span>
            </div>

            {/* 8. NotebookLM / Gemini MCP */}
            <div className="i">
              <span className="g" style={{ background: '#E0F2FE' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#0284C7" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                </svg>
              </span>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: '#0F172A', textAlign: 'center', lineHeight: 1.25, padding: '0 4px' }}>
                NotebookLM MCP
              </span>
              <span style={{ fontSize: 9, fontWeight: 800, color: '#0284C7', background: '#E0F2FE', padding: '2px 6px', borderRadius: 9999 }}>
                Google · Cuadernos SST
              </span>
            </div>

            {/* 9. OpenWeather API (Emergencias y Riesgo Climático) */}
            <div className="i">
              <span className="g" style={{ background: '#E0F2FE' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#0369A1" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"></path>
                </svg>
              </span>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: '#0F172A', textAlign: 'center', lineHeight: 1.25, padding: '0 4px' }}>
                OpenWeather API
              </span>
              <span style={{ fontSize: 9, fontWeight: 800, color: '#0369A1', background: '#E0F2FE', padding: '2px 6px', borderRadius: 9999 }}>
                Clima · Emergencias
              </span>
            </div>

            {/* 10. Sustancias Químicas SGA / ONU (Riesgo Químico) */}
            <div className="i">
              <span className="g" style={{ background: '#CFFAFE' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#0891B2" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 2v7.31"></path>
                  <path d="M14 9.3V2"></path>
                  <path d="M8.5 2h7"></path>
                  <path d="M14 9.3a6.5 6.5 0 1 1-4 0"></path>
                </svg>
              </span>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: '#0F172A', textAlign: 'center', lineHeight: 1.25, padding: '0 4px' }}>
                Químicos SGA / ONU
              </span>
              <span style={{ fontSize: 9, fontWeight: 800, color: '#0891B2', background: '#CFFAFE', padding: '2px 6px', borderRadius: 9999 }}>
                Inventario · Libro Púrpura
              </span>
            </div>

            {/* 11. Gestor Automatizaciones (Cron) */}
            <div className="i">
              <span className="g" style={{ background: '#E0E7FF' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
              </span>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: '#0F172A', textAlign: 'center', lineHeight: 1.25, padding: '0 4px' }}>
                Tareas Cron
              </span>
              <span style={{ fontSize: 9, fontWeight: 800, color: '#4F46E5', background: '#E0E7FF', padding: '2px 6px', borderRadius: 9999 }}>
                Simulacros & Extintores
              </span>
            </div>

            {/* 12. n8n & Webhooks */}
            <div className="i">
              <span className="g" style={{ background: '#FFEDD5' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#EA580C" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                </svg>
              </span>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: '#0F172A', textAlign: 'center', lineHeight: 1.25, padding: '0 4px' }}>
                n8n & Webhooks
              </span>
              <span style={{ fontSize: 9, fontWeight: 800, color: '#EA580C', background: '#FFEDD5', padding: '2px 6px', borderRadius: 9999 }}>
                Cadenas de Rescate
              </span>
            </div>

            {/* 13. Matriz IPEVR (GTC 45) */}
            <div className="i">
              <span className="g" style={{ background: '#FEE2E2' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
              </span>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: '#0F172A', textAlign: 'center', lineHeight: 1.25, padding: '0 4px' }}>
                Matriz IPEVR (GTC 45)
              </span>
              <span style={{ fontSize: 9, fontWeight: 800, color: '#DC2626', background: '#FEE2E2', padding: '2px 6px', borderRadius: 9999 }}>
                Matriz · Peligros & Riesgos
              </span>
            </div>

            {/* 14. Matriz de Compatibilidad Química */}
            <div className="i">
              <span className="g" style={{ background: '#CCFBF1' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#0D9488" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 11V4a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v7"></path>
                  <path d="M5 11a7 7 0 0 0 14 0"></path>
                  <line x1="12" y1="18" x2="12" y2="22"></line>
                  <line x1="8" y1="22" x2="16" y2="22"></line>
                </svg>
              </span>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: '#0F172A', textAlign: 'center', lineHeight: 1.25, padding: '0 4px' }}>
                Matriz Compatibilidad
              </span>
              <span style={{ fontSize: 9, fontWeight: 800, color: '#0D9488', background: '#CCFBF1', padding: '2px 6px', borderRadius: 9999 }}>
                Matriz · Dec. 1496 Químico
              </span>
            </div>

            {/* 15. Matriz de Riesgo Vial PESV */}
            <div className="i">
              <span className="g" style={{ background: '#FEF3C7' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="3" width="15" height="13"></rect>
                  <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                  <circle cx="5.5" cy="18.5" r="2.5"></circle>
                  <circle cx="18.5" cy="18.5" r="2.5"></circle>
                </svg>
              </span>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: '#0F172A', textAlign: 'center', lineHeight: 1.25, padding: '0 4px' }}>
                Matriz de Riesgo PESV
              </span>
              <span style={{ fontSize: 9, fontWeight: 800, color: '#D97706', background: '#FEF3C7', padding: '2px 6px', borderRadius: 9999 }}>
                Matriz · Res. 40595 Vial
              </span>
            </div>

            {/* 16. Matriz Legal & Editor RIT */}
            <div className="i">
              <span className="g" style={{ background: '#FEF3C7' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#92400E" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                </svg>
              </span>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: '#0F172A', textAlign: 'center', lineHeight: 1.25, padding: '0 4px' }}>
                Matriz Legal & RIT
              </span>
              <span style={{ fontSize: 9, fontWeight: 800, color: '#92400E', background: '#FEF3C7', padding: '2px 6px', borderRadius: 9999 }}>
                Matriz · Dec. 1072 & RIT
              </span>
            </div>

            {/* 17. Analítica de Actos y Condiciones (ACI) */}
            <div className="i">
              <span className="g" style={{ background: '#FFE4E6' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#E11D48" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                  <circle cx="12" cy="13" r="4"></circle>
                </svg>
              </span>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: '#0F172A', textAlign: 'center', lineHeight: 1.25, padding: '0 4px' }}>
                Analítica Actos ACI
              </span>
              <span style={{ fontSize: 9, fontWeight: 800, color: '#E11D48', background: '#FFE4E6', padding: '2px 6px', borderRadius: 9999 }}>
                Reportes · Terreno & Fotos
              </span>
            </div>

            {/* 18. Radar Psicosocial */}
            <div className="i">
              <span className="g" style={{ background: '#FCE7F3' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#BE185D" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
              </span>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: '#0F172A', textAlign: 'center', lineHeight: 1.25, padding: '0 4px' }}>
                Radar Psicosocial
              </span>
              <span style={{ fontSize: 9, fontWeight: 800, color: '#BE185D', background: '#FCE7F3', padding: '2px 6px', borderRadius: 9999 }}>
                Batería · Res. 2764
              </span>
            </div>

            {/* 19. Microsoft OneDrive API */}
            <div className="i">
              <span className="g" style={{ background: '#EFF6FF' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#0078D4" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"></path>
                </svg>
              </span>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: '#0F172A', textAlign: 'center', lineHeight: 1.25, padding: '0 4px' }}>
                Microsoft OneDrive
              </span>
              <span style={{ fontSize: 9, fontWeight: 800, color: '#0078D4', background: '#EFF6FF', padding: '2px 6px', borderRadius: 9999 }}>
                Microsoft · M365 Cloud
              </span>
            </div>

            {/* 20. Canvas Interactivo */}
            <div className="i">
              <span className="g" style={{ background: '#FCE7F3' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#DB2777" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2"></rect>
                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                  <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
              </span>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: '#0F172A', textAlign: 'center', lineHeight: 1.25, padding: '0 4px' }}>
                Canvas Interactivo
              </span>
              <span style={{ fontSize: 9, fontWeight: 800, color: '#DB2777', background: '#FCE7F3', padding: '2px 6px', borderRadius: 9999 }}>
                Editor · Tiempo Real
              </span>
            </div>

            {/* 21. Page Controller (Operar GUI) */}
            <div className="i">
              <span className="g" style={{ background: '#FEF3C7' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#B45309" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 3l7 18 3-7 7-3L3 3z"></path>
                </svg>
              </span>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: '#0F172A', textAlign: 'center', lineHeight: 1.25, padding: '0 4px' }}>
                Page Controller
              </span>
              <span style={{ fontSize: 9, fontWeight: 800, color: '#B45309', background: '#FEF3C7', padding: '2px 6px', borderRadius: 9999 }}>
                WAPPY · Autómata UI
              </span>
            </div>

            {/* 22. Orquestador Tenshi Multi-Agente */}
            <div className="i">
              <span className="g" style={{ background: '#0E1300' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#C7F303" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="18" cy="5" r="3"></circle>
                  <circle cx="6" cy="12" r="3"></circle>
                  <circle cx="18" cy="19" r="3"></circle>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                </svg>
              </span>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: '#0F172A', textAlign: 'center', lineHeight: 1.25, padding: '0 4px' }}>
                Tenshi Multi-Agente
              </span>
              <span style={{ fontSize: 9, fontWeight: 800, color: '#0E1300', background: '#C7F303', padding: '2px 6px', borderRadius: 9999 }}>
                Orquestador · +20 IA
              </span>
            </div>

            {/* 23. Somos SST Core DB */}
            <div className="i">
              <span className="g" style={{ background: '#DCFCE7' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
                  <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
                  <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
                </svg>
              </span>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: '#0F172A', textAlign: 'center', lineHeight: 1.25, padding: '0 4px' }}>
                Somos SST DB
              </span>
              <span style={{ fontSize: 9, fontWeight: 800, color: '#16A34A', background: '#DCFCE7', padding: '2px 6px', borderRadius: 9999 }}>
                Sedes · Empresas & Sedes
              </span>
            </div>

            {/* 24. Consultar Especialista SST */}
            <div className="i">
              <span className="g" style={{ background: '#EDE9FE' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </span>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: '#0F172A', textAlign: 'center', lineHeight: 1.25, padding: '0 4px' }}>
                Consultar Especialista
              </span>
              <span style={{ fontSize: 9, fontWeight: 800, color: '#7C3AED', background: '#EDE9FE', padding: '2px 6px', borderRadius: 9999 }}>
                Multi-Agente · +20 Roles
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonios" className="band" style={{ paddingTop: 0 }}>
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
                  <div style={{ fontSize: 12.5, color: '#9A9AA8' }}>
                    {lang === 'es' ? 'Responsable del SG-SST · Sector Construcción' : 'SG-SST Lead · Construction Sector'}
                  </div>
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
                  <div style={{ fontSize: 12.5, color: '#9A9AA8' }}>
                    {lang === 'es' ? 'Coordinador de Seguridad y Salud en el Trabajo' : 'OHS Coordinator · Manufacturing'}
                  </div>
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
                  <div style={{ fontSize: 12.5, color: '#9A9AA8' }}>
                    {lang === 'es' ? 'Especialista en SST · Licencia Vigente MinSalud' : 'OHS Specialist & Auditor · Certified'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Lifestyle Section: Cultura Preventiva Real & Actividad SST en Obra */}
      <section className="band" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="life">
            <img
              className="bg"
              src="/images/sgsst_perfiles/siso_actividad.jpg"
              alt="Actividad de Seguridad y Salud en el Trabajo - Inspección SISO en Obra"
              style={{ objectFit: 'cover', objectPosition: 'center 20%' }}
            />
            <div
              className="scrim"
              style={{
                background:
                  'linear-gradient(90deg, rgba(8, 14, 4, 0.90) 0%, rgba(8, 14, 4, 0.72) 42%, rgba(8, 14, 4, 0.25) 75%, transparent 100%)',
              }}
            ></div>
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

            <div className="life-float" style={{ bottom: 36, right: 36, width: 270 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 9 }}>
                <span style={{ width: 24, height: 24, borderRadius: 7, background: '#C7F303', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="2">
                    <path d="M12 3l1.9 5.8a2 2 0 0 0 1.3 1.3L21 12l-5.8 1.9a2 2 0 0 0-1.3 1.3L12 21l-1.9-5.8a2 2 0 0 0-1.3-1.3L3 12l5.8-1.9a2 2 0 0 0 1.3-1.3z"></path>
                  </svg>
                </span>
                <span style={{ fontSize: 12.5, fontWeight: 700 }}>Tenshi Alerta SST</span>
              </div>
              <div style={{ background: '#C7F303', borderRadius: 12, padding: '9px 12px', fontSize: 12, fontWeight: 600, color: '#0E1300', lineHeight: 1.4 }}>
                {lang === 'es'
                  ? '¡Excelente jornada! Hoy registramos cero incidentes y el 100% de preoperacionales completados en campo 👷‍♂️✨'
                  : 'Zero incidents recorded today and 100% of field pre-trips completed 👷‍♂️✨'}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing: Solo Plan Wappy Pro con 3 Temporalidades (Mensual, Semestral, Anual) */}
      <section id="pricing" className="band" style={{ paddingTop: 0 }}>
        <div id="planes" style={{ position: 'relative', top: -90 }} />
        <div className="wrap">
          <div className="sec-head">
            <span className="eyebrow">
              <span className="dot"></span>
              {lang === 'es' ? 'Inversión Transparente & Retorno Inmediato' : 'Transparent Investment & ROI'}
            </span>
            <h2 className="display">{lang === 'es' ? 'Planes Comerciales y Tarifas WAPPY Pro' : 'WAPPY Pro Pricing Plans'}</h2>
            <p>
              {lang === 'es'
                ? 'Una sola suite integral con todas las herramientas de IA y normatividad colombiana. Elige la periodicidad que mejor se ajuste a tu flujo empresarial con 7 días de prueba gratis:'
                : 'A single complete suite with all AI tools and Colombian compliance. Choose the billing cycle that fits your business with a 7-day free trial:'}
            </p>
          </div>

          <div className="price">
            {/* Wappy Pro Mensual */}
            <div className="pcard">
              <span className="pbadge" style={{ position: 'static', alignSelf: 'flex-start', marginBottom: 14, background: '#F1F5F9', color: '#475569', border: '1px solid #CBD5E1' }}>
                {lang === 'es' ? 'Flexibilidad Mensual' : 'Monthly Flexibility'}
              </span>
              <div className="pn">{lang === 'es' ? 'Wappy Pro Mensual' : 'Wappy Pro Monthly'}</div>
              <div className="pp">$114.330<span>{lang === 'es' ? ' COP /mes' : ' COP/mo'}</span></div>
              <div style={{ fontSize: 13, color: '#9A9AA8', marginBottom: 4 }}>
                {lang === 'es' ? 'Flexibilidad mes a mes · Cancela en cualquier momento' : 'Month-to-month flexibility · Cancel anytime'}
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
                  {lang === 'es' ? 'Somos SST completo (30+ aplicativos en 8 hitos)' : 'Full Somos SST (30+ apps across 8 milestones)'}
                </li>
                <li>
                  <span className="pck">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  {lang === 'es' ? 'Conversaciones ilimitadas con +20 Agentes IA' : 'Unlimited chats with 20+ specialized AI agents'}
                </li>
                <li>
                  <span className="pck">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  {lang === 'es' ? 'Análisis Biomecánico en Vivo con Visión IA (MediaPipe)' : 'Live Biomechanical Vision Analysis (MediaPipe)'}
                </li>
                <li>
                  <span className="pck">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  {lang === 'es' ? 'Matriz IPEVR (GTC 45) y Bio-IPEVR interconectadas' : 'Interconnected GTC 45 and Bio-IPEVR matrices'}
                </li>
                <li>
                  <span className="pck">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  {lang === 'es' ? 'Actos predictivos en ATEL & Termómetro Psicosocial' : 'Predictive ATEL incidents & Psychosocial thermometer'}
                </li>
                <li>
                  <span className="pck">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  {lang === 'es' ? 'Portales Públicos QR para colaboradores sin contraseñas' : 'Passwordless public QR portals for workers'}
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
              <button className="btn btn-glass btn-sm" style={{ marginTop: 'auto', justifyContent: 'center', border: '1px solid var(--line)' }} onClick={() => navigate('/planes')}>
                {lang === 'es' ? 'Elegir Pro Mensual' : 'Choose Pro Monthly'}
              </button>
            </div>

            {/* Wappy Pro Semestral */}
            <div className="pcard">
              <span className="pbadge" style={{ position: 'static', alignSelf: 'flex-start', marginBottom: 14, background: '#0D9488', color: '#fff' }}>
                {lang === 'es' ? 'Ahorro Semestral · 6% DCTO' : 'Biannual Savings · 6% OFF'}
              </span>
              <div className="pn">{lang === 'es' ? 'Wappy Pro Semestral' : 'Wappy Pro Semiannual'}</div>
              <div className="pp">$641.960<span>{lang === 'es' ? ' COP /semestre' : ' COP/6 mo'}</span></div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#0D9488', marginTop: 1, marginBottom: 4 }}>
                {lang === 'es' ? '⚡ Equivalente a $106.993 COP/mes' : '⚡ $106,993 COP/mo equivalent'}
              </div>
              <div style={{ fontSize: 13, color: '#9A9AA8', marginBottom: 4 }}>
                {lang === 'es' ? 'Compromiso semestral con tarifa reducida para tu empresa' : 'Semiannual commitment with reduced monthly fee'}
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
                  <strong>{lang === 'es' ? 'Todo lo del Plan Pro, facturado semestralmente' : 'Full Pro suite billed every 6 months'}</strong>
                </li>
                <li>
                  <span className="pck">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  {lang === 'es' ? 'Ahorro directo en la tarifa mensual de tu SG-SST' : 'Direct savings on your monthly safety budget'}
                </li>
                <li>
                  <span className="pck">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  {lang === 'es' ? '30+ aplicativos del SG-SST 100% habilitados' : 'All 30+ safety management applications active'}
                </li>
                <li>
                  <span className="pck">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  {lang === 'es' ? '+20 Agentes IA: Médico, Abogado, Fisioterapeuta, Higienista' : '20+ AI Agents: Doctor, Legal, Physio, Hygienist'}
                </li>
                <li>
                  <span className="pck">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  {lang === 'es' ? 'Visión artificial y diagnóstico postural MediaPipe en vivo' : 'Computer vision live ergonomic MediaPipe pose checks'}
                </li>
                <li>
                  <span className="pck">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  {lang === 'es' ? 'Votación secreta COPASST y firmas electrónicas en actas' : 'Secret COPASST voting and electronic digital signatures'}
                </li>
                <li>
                  <span className="pck">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  {lang === 'es' ? 'Soporte técnico preferencial y acompañamiento de inicio' : 'Priority technical support & onboarding assistance'}
                </li>
              </ul>
              <button className="btn btn-glass btn-sm" style={{ marginTop: 'auto', justifyContent: 'center', border: '1px solid var(--line)' }} onClick={() => navigate('/planes')}>
                {lang === 'es' ? 'Elegir Pro Semestral' : 'Choose Pro Semiannual'}
              </button>
            </div>

            {/* Wappy Pro Anual (Más Popular / Máximo Ahorro) */}
            <div className="pcard feat-plan">
              <span className="pbadge" style={{ position: 'static', alignSelf: 'flex-start', marginBottom: 14 }}>
                {lang === 'es' ? 'Más popular · Máximo ahorro' : 'Most Popular · Max Savings'}
              </span>
              <div className="pn">{lang === 'es' ? 'Wappy Pro Anual' : 'Wappy Pro Annual'}</div>
              <div className="pp">$1.200.000<span>{lang === 'es' ? ' COP /año' : ' COP/yr'}</span></div>
              <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--lime)', marginTop: 1, marginBottom: 4 }}>
                {lang === 'es' ? '🌟 Solo $100.000 COP/mes (Ahorras $171.960/año)' : '🌟 Only $100,000 COP/mo (Save $171,960/yr)'}
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', marginBottom: 4 }}>
                {lang === 'es' ? 'La elección preferida por empresas: máxima economía y continuidad SG-SST' : 'Preferred by businesses: maximum savings and continuous OHS compliance'}
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
                  <strong>{lang === 'es' ? 'Todo lo del ecosistema Wappy Pro con tarifa preferencial' : 'Full Wappy Pro ecosystem at frozen best rate'}</strong>
                </li>
                <li>
                  <span className="pck">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  {lang === 'es' ? 'Paga solo $100.000 COP/mes con facturación anual única' : 'Pay only $100,000 COP/mo with single annual billing'}
                </li>
                <li>
                  <span className="pck">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  {lang === 'es' ? 'Somos SST integral: 30+ aplicativos en los 8 hitos normativos' : 'Complete Somos SST: 30+ apps in all 8 milestones'}
                </li>
                <li>
                  <span className="pck">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  {lang === 'es' ? '+20 Agentes IA autónomos y orquestador Tenshi 24/7' : '20+ autonomous AI agents & Tenshi orchestrator 24/7'}
                </li>
                <li>
                  <span className="pck">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  {lang === 'es' ? 'Visión IA MediaPipe para evaluación ergonómica de puestos' : 'MediaPipe AI vision for ergonomic workstation audits'}
                </li>
                <li>
                  <span className="pck">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  {lang === 'es' ? 'Creación de Agentes de IA propios a la medida de tu empresa' : 'Custom tailored AI agents for your business'}
                </li>
                <li>
                  <span className="pck">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  {lang === 'es' ? 'Acompañamiento prioritario en migración de matrices y datos' : 'Priority assistance with data & matrix migrations'}
                </li>
              </ul>
              <button className="btn btn-lime btn-sm" style={{ marginTop: 'auto', justifyContent: 'center' }} onClick={() => navigate('/planes')}>
                {lang === 'es' ? 'Elegir Wappy Pro Anual' : 'Choose Wappy Pro Annual'}
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
                  ? 'Plan Empresas & Corporativo: Dominio propio, marca blanca con logos institucionales, usuarios ilimitados, agentes IA a la medida y 200 GB de almacenamiento.'
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

      {/* FAQ: Preguntas Frecuentes con Protección de Datos & Propiedad de la IA */}
      <section id="faq" className="band" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="sec-head">
            <span className="eyebrow">
              <span className="dot"></span>
              {lang === 'es' ? 'Resolvemos tus Dudas' : 'Resolve Your Doubts'}
            </span>
            <h2 className="display">{lang === 'es' ? 'Preguntas Frecuentes sobre WAPPY' : 'Frequently Asked Questions about WAPPY'}</h2>
            <p>
              {lang === 'es'
                ? 'Todo lo que necesitas saber sobre legalidad en Colombia, protección de datos, soporte de ARL y funcionamiento de nuestros agentes de IA.'
                : 'Everything you need to know about Colombian compliance, data privacy, OHS support, and AI agents.'}
            </p>
          </div>

          <div className="faq">
            {/* FAQ 0 */}
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

            {/* FAQ 1 */}
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

            {/* FAQ 2 */}
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

            {/* FAQ 3 */}
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

            {/* FAQ 4: Protección y Tratamiento de Datos (Ley 1581 / Habeas Data) */}
            <div className={`qa ${openFaq === 4 ? 'open' : ''}`}>
              <button onClick={() => setOpenFaq(openFaq === 4 ? null : 4)} aria-expanded={openFaq === 4}>
                {lang === 'es'
                  ? '¿Cómo se protegen los datos y cómo es el tratamiento de la información de mi empresa?'
                  : 'How is company data protected and processed?'}
                <span className="q-ico">+</span>
              </button>
              <div className="a">
                <p>
                  {lang === 'es'
                    ? 'Cumplimos estrictamente con la Ley 1581 de 2012 (Régimen General de Protección de Datos Personales en Colombia) y el Decreto 1377 de 2013. Toda la información de tu organización y colaboradores viaja cifrada en tránsito (TLS/HTTPS) y se resguarda cifrada en reposo (AES-256) bajo aislamiento multi-inquilino. WAPPY LTDA jamás vende, comercializa ni comparte la información de tu empresa con terceros, y tus datos empresariales NUNCA se utilizan para entrenar modelos públicos de inteligencia artificial.'
                    : 'We strictly comply with Colombia’s Statutory Data Protection Law (Ley 1581 de 2012) and Decree 1377 of 2013. All corporate and worker records are encrypted in transit (TLS/HTTPS) and at rest (AES-256) with strict multi-tenant isolation. WAPPY LTDA never sells or shares your records with third parties, and your proprietary data is NEVER used to train public AI models.'}
                </p>
              </div>
            </div>

            {/* FAQ 5: Propiedad de la IA, Datos y Responsabilidad de Uso */}
            <div className={`qa ${openFaq === 5 ? 'open' : ''}`}>
              <button onClick={() => setOpenFaq(openFaq === 5 ? null : 5)} aria-expanded={openFaq === 5}>
                {lang === 'es'
                  ? '¿Quién es el dueño de la IA, de los datos ingresados y quién es el responsable de su uso?'
                  : 'Who owns the AI, the input data, and who is responsible for its use?'}
                <span className="q-ico">+</span>
              </button>
              <div className="a">
                <p>
                  {lang === 'es'
                    ? 'Tu empresa es la única y absoluta dueña de sus datos: todas las bases de datos cargadas, información de trabajadores, matrices de riesgos, actas de comités y diagnósticos generados pertenecen exclusivamente a tu organización. WAPPY LTDA (NIT 901437310-3, Medellín, Colombia) es la titular y propietaria del software, algoritmos y agentes de inteligencia artificial, otorgando a tu empresa una licencia de uso corporativa para operar y liderar su SG-SST con total autonomía.'
                    : 'Your organization is the sole and exclusive owner of its data: all uploaded records, worker information, hazard matrices, committee minutes, and reports belong entirely to your company. WAPPY LTDA (NIT 901437310-3, Medellín, Colombia) owns the software architecture and AI agent platform, granting your company a corporate subscription license to run your OHS management system with complete autonomy.'}
                </p>
                <p style={{ marginTop: 10 }}>
                  {lang === 'es'
                    ? 'Responsabilidad de la IA: La empresa cliente y sus profesionales o usuarios autorizados son los únicos y exclusivos responsables del uso de la IA, de la supervisión humana y de la validación técnica previa a cualquier toma de decisiones o implementación de los contenidos generados. WAPPY actúa como copiloto tecnológico y de apoyo normativo, manteniendo intacto el principio de control humano (Human-in-the-loop) exigido por los estándares técnicos y legales del SG-SST en Colombia.'
                    : 'AI Responsibility: The client company and its designated professionals or users are solely and exclusively responsible for the use of the AI, human oversight, and the technical validation and final decision-making regarding any recommendations, matrices, or reports generated. WAPPY functions as an OHS technological copilot, adhering strictly to the human-in-the-loop governance principle required by workplace safety regulations.'}
                </p>
              </div>
            </div>
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

      {/* Footer: 4 Columnas Temáticas Estructuradas con WAPPY LTDA */}
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
                {lang === 'es' ? 'Ir a WAPPY' : 'Go to WAPPY'}
              </button>
            </div>
          </div>

          <div className="foot-top">
            <div className="foot-brand">
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 12 }}>
                <img src="/marketing/wappy-cat-logo.png" alt="WAPPY Logo" style={{ height: 40, width: 40, objectFit: 'contain' }} />
                <span style={{ fontFamily: 'var(--display)', fontSize: 24, fontWeight: 800, color: 'var(--ink)' }}>WAPPY<span style={{ color: '#16a34a' }}>IA</span></span>
              </div>
              <p className="foot-desc">
                {lang === 'es'
                  ? 'Ecosistema de Inteligencia Artificial para el SG-SST en Colombia. Metodología del Bioindividuo, +20 agentes autónomos, matrices GTC 45, Química SGA, PESV y analítica predictiva.'
                  : 'Colombia’s AI Ecosystem for Occupational Health & Safety (SG-SST). Bioindividual Methodology, 20+ autonomous agents, GTC 45, SGA Chemical, PESV and predictive analytics.'}
              </p>
            </div>
          </div>

          <div className="foot-word">WAPPY</div>

          <div className="foot-bottom">
            <span>© 2026 WAPPY LTDA · NIT 901437310-3 · Medellín, Colombia. {lang === 'es' ? 'Todos los derechos reservados.' : 'All rights reserved.'}</span>
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
      <div
        className={`mkt-modal-scrim ${isDemoModalOpen ? 'show' : ''}`}
        aria-hidden={!isDemoModalOpen}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setIsDemoModalOpen(false);
          }
        }}
      >
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
              ? 'Te mostraremos cómo Tenshi se encarga del trabajo pesado y repetitivo, reduciendo tu carga laboral para que lideres con más tiempo, control y cero estrés.'
              : 'We’ll show you how Tenshi takes care of heavy, repetitive tasks—cutting your workload so you can lead with more time, full control, and zero stress.'}
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
              type="tel"
              placeholder={lang === 'es' ? 'Número de contacto / WhatsApp' : 'Phone / WhatsApp'}
              required
              value={demoPhone}
              onChange={(e) => setDemoPhone(e.target.value)}
            />
            <input
              className="fld"
              type="text"
              placeholder={lang === 'es' ? 'Empresa u Organización' : 'Company or Organization'}
              required
              value={demoCompany}
              onChange={(e) => setDemoCompany(e.target.value)}
            />
            <select
              className="fld"
              required
              value={demoArl}
              onChange={(e) => setDemoArl(e.target.value)}
            >
              <option value="" disabled>
                {lang === 'es' ? 'Selecciona la ARL de tu empresa' : 'Select company ARL / Insurance'}
              </option>
              <option value="Positiva">ARL Positiva Compañía de Seguros</option>
              <option value="SURA">ARL SURA (Suramericana)</option>
              <option value="Seguros Bolívar">ARL Seguros Bolívar</option>
              <option value="Colmena Seguros">ARL Colmena Seguros</option>
              <option value="AXA Colpatria">ARL AXA Colpatria</option>
              <option value="Seguros del Estado">ARL Seguros del Estado</option>
              <option value="La Equidad Seguros">ARL La Equidad Seguros</option>
              <option value="Mapfre">ARL Mapfre</option>
              <option value="Aurora">ARL Aurora</option>
              <option value="Alfa">ARL Alfa</option>
              <option value="Otra">
                {lang === 'es' ? 'Otra ARL / Asesor Independiente' : 'Other ARL / Independent'}
              </option>
              <option value="Sin ARL">
                {lang === 'es' ? 'Aún sin ARL / En trámite' : 'No ARL yet / In progress'}
              </option>
            </select>
            {demoArl === 'Otra' && (
              <input
                className="fld"
                type="text"
                placeholder={lang === 'es' ? '¿Cuál es tu ARL?' : 'Which ARL?'}
                required
                value={demoArlCustom}
                onChange={(e) => setDemoArlCustom(e.target.value)}
              />
            )}
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
            <button
              className="btn btn-primary"
              type="submit"
              disabled={isSubmittingDemo}
              style={{ width: '100%', justifyContent: 'center', marginTop: 6, opacity: isSubmittingDemo ? 0.75 : 1 }}
            >
              {isSubmittingDemo
                ? (lang === 'es' ? 'Enviando solicitud...' : 'Sending request...')
                : (lang === 'es' ? 'Solicitar demo personalizada' : 'Request personalized demo')}
              {!isSubmittingDemo && (
                <span className="pip">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </span>
              )}
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
      <div
        className={`mkt-modal-scrim ${isCompareModalOpen ? 'show' : ''}`}
        aria-hidden={!isCompareModalOpen}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setIsCompareModalOpen(false);
          }
        }}
      >
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
                  <th>Wappy Pro Mensual<br /><span>$114.330/mes</span></th>
                  <th>Wappy Pro Semestral<br /><span>$106.993/mes</span></th>
                  <th className="hl">Wappy Pro Anual<br /><span>$100.000/mes · Ahorro</span></th>
                </tr>
              </thead>
              <tbody>
                <tr className="grp">
                  <td colSpan={4}>Comités & Gestión Paritaria</td>
                </tr>
                <tr>
                  <td>{lang === 'es' ? 'COPASST (Votación QR & Actas)' : 'COPASST (QR & Minutes)'}</td>
                  <td><span className="cy">✓</span></td>
                  <td><span className="cy">✓</span></td>
                  <td className="hl"><span className="cy">✓</span></td>
                </tr>
                <tr>
                  <td>{lang === 'es' ? 'Comité de Convivencia Laboral (COCOLAB)' : 'Harassment Committee'}</td>
                  <td><span className="cy">✓</span></td>
                  <td><span className="cy">✓</span></td>
                  <td className="hl"><span className="cy">✓</span></td>
                </tr>
                <tr>
                  <td>{lang === 'es' ? 'Brigada de Emergencias y simulacros' : 'Emergency Brigade'}</td>
                  <td><span className="cy">✓</span></td>
                  <td><span className="cy">✓</span></td>
                  <td className="hl"><span className="cy">✓</span></td>
                </tr>

                <tr className="grp">
                  <td colSpan={4}>Matrices Técnicas & Riesgos</td>
                </tr>
                <tr>
                  <td>{lang === 'es' ? 'Matriz de Riesgos GTC 45 (IPEVAR)' : 'GTC 45 Risk Matrix'}</td>
                  <td><span className="cy">✓</span></td>
                  <td><span className="cy">✓</span></td>
                  <td className="hl"><span className="cy">✓</span></td>
                </tr>
                <tr>
                  <td>{lang === 'es' ? 'Matriz Legal SST (Dec. 1072)' : 'Legal OHS Matrix'}</td>
                  <td><span className="cy">✓</span></td>
                  <td><span className="cy">✓</span></td>
                  <td className="hl"><span className="cy">✓</span></td>
                </tr>
                <tr>
                  <td>{lang === 'es' ? 'Matriz Química SGA (Decreto 1496)' : 'Chemical SGA Matrix'}</td>
                  <td><span className="cy">✓</span></td>
                  <td><span className="cy">✓</span></td>
                  <td className="hl"><span className="cy">✓</span></td>
                </tr>
                <tr>
                  <td>{lang === 'es' ? 'Autoevaluación Ergonómica Postural EPT' : 'Ergonomics EPT'}</td>
                  <td><span className="cy">✓</span></td>
                  <td><span className="cy">✓</span></td>
                  <td className="hl"><span className="cy">✓</span></td>
                </tr>

                <tr className="grp">
                  <td colSpan={4}>Inteligencia Artificial Tenshi & Visión</td>
                </tr>
                <tr>
                  <td>{lang === 'es' ? 'Consultas legales normativas' : 'Regulatory legal inquiries'}</td>
                  <td><span className="cy">✓</span></td>
                  <td><span className="cy">✓</span></td>
                  <td className="hl"><span className="cy">✓</span></td>
                </tr>
                <tr>
                  <td>{lang === 'es' ? 'Análisis Biomecánico en Vivo con Visión IA' : 'Live Biomechanical Analysis'}</td>
                  <td><span className="cy">✓</span></td>
                  <td><span className="cy">✓</span></td>
                  <td className="hl"><span className="cy">✓</span></td>
                </tr>
                <tr>
                  <td>{lang === 'es' ? 'Control de Interfaz y Diligenciamiento en Pantalla' : 'Page Controller Automation'}</td>
                  <td><span className="cy">✓</span></td>
                  <td><span className="cy">✓</span></td>
                  <td className="hl"><span className="cy">✓</span></td>
                </tr>

                <tr className="grp">
                  <td colSpan={4}>Canales, Formación & Beneficios</td>
                </tr>
                <tr>
                  <td>{lang === 'es' ? 'Portal Móvil PWA con Código QR' : 'PWA Mobile QR Portal'}</td>
                  <td><span className="cy">✓</span></td>
                  <td><span className="cy">✓</span></td>
                  <td className="hl"><span className="cy">✓</span></td>
                </tr>
                <tr>
                  <td>{lang === 'es' ? 'Academia LMS y certificados interactivos' : 'LMS Academy & interactive certs'}</td>
                  <td><span className="cy">✓</span></td>
                  <td><span className="cy">✓</span></td>
                  <td className="hl"><span className="cy">✓</span></td>
                </tr>
                <tr>
                  <td>{lang === 'es' ? 'Creación de Agentes de IA propios (+20 incluidos)' : 'Custom AI Agent Builder (+20 included)'}</td>
                  <td><span className="cy">✓</span></td>
                  <td><span className="cy">✓</span></td>
                  <td className="hl"><span className="cy">✓</span></td>
                </tr>
                <tr>
                  <td>{lang === 'es' ? 'Acompañamiento en Parametrización e Inducción' : 'Onboarding & Setup'}</td>
                  <td style={{ fontSize: 12 }}>{lang === 'es' ? 'Autoguiado' : 'Self-guided'}</td>
                  <td style={{ fontSize: 12 }}>{lang === 'es' ? 'Asistido' : 'Assisted'}</td>
                  <td className="hl" style={{ fontSize: 12, fontWeight: 700 }}>{lang === 'es' ? 'Sesión VIP 1 a 1' : '1-on-1 VIP Session'}</td>
                </tr>
                <tr>
                  <td>{lang === 'es' ? 'Nivel de Soporte Técnico' : 'Support Level'}</td>
                  <td style={{ fontSize: 12 }}>{lang === 'es' ? 'Plataforma & Tickets' : 'Platform & Tickets'}</td>
                  <td style={{ fontSize: 12 }}>{lang === 'es' ? 'WhatsApp Preferente' : 'Priority WhatsApp'}</td>
                  <td className="hl" style={{ fontSize: 12, fontWeight: 700 }}>{lang === 'es' ? 'VIP Prioritario 24/7' : 'VIP 24/7 Priority'}</td>
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
      <div
        className={`mkt-modal-scrim ${isPwaModalOpen ? 'show' : ''}`}
        aria-hidden={!isPwaModalOpen}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setIsPwaModalOpen(false);
          }
        }}
      >
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
